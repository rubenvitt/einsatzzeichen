import { posix } from 'node:path';
import * as ts from 'typescript';

/**
 * Die vier Ausgabekanäle (LFH-405) stehen auf demselben Rang wie `catalog`: sie dürfen `core` und
 * `schema` importieren, aber weder `catalog` noch einander — und `catalog` darf keinen Kanal
 * importieren. Katalogdaten kommen über die Anwendung in den Kanal, nicht über eine Paketkante.
 * Ein gleicher Rang genügt dafür, weil nur eine echt kleinere Rangzahl als Abhängigkeit zulässig
 * ist; die Kette `cli → catalog → core → schema` bleibt damit zyklenfrei.
 */
export const OUTPUT_CHANNEL_PACKAGE_IDS = ['react', 'web-component', 'maplibre', 'qgis'] as const;

export type WorkspacePackageId =
  | 'cli'
  | 'catalog'
  | 'core'
  | 'schema'
  | (typeof OUTPUT_CHANNEL_PACKAGE_IDS)[number];

export interface RepositoryManifest {
  id: WorkspacePackageId;
  name: string;
  path: string;
  dependencies: Record<string, unknown>;
  malformedDependencySections: string[];
}

export interface RepositorySourceFile {
  packageId: WorkspacePackageId;
  path: string;
  source: string;
}

export interface RepositorySourceSymlink {
  packageId: WorkspacePackageId;
  path: string;
}

export interface RepositoryPolicyInput {
  manifests: RepositoryManifest[];
  sourceFiles: RepositorySourceFile[];
  sourceSymlinks: RepositorySourceSymlink[];
  trackedFiles: string[];
  gitignore: string;
  effectivelyIgnoredReferenceTargets: string[];
}

export interface RepositoryPolicyViolation {
  code: string;
  path: string;
  importer?: WorkspacePackageId;
  target?: WorkspacePackageId;
  specifier?: string;
  detail: string;
}

const PACKAGE_RANK: Readonly<Record<WorkspacePackageId, number>> = {
  schema: 0,
  core: 1,
  catalog: 2,
  react: 2,
  'web-component': 2,
  maplibre: 2,
  qgis: 2,
  cli: 3,
};

export const REFERENCE_IGNORE_TARGETS = [
  'taktische-zeichen/',
  'taktische-zeichen.zip',
] as const;

interface ModuleReference {
  kind: 'static' | 'dynamic-import' | 'require';
  specifier?: string;
}

interface ParsedSourceFile extends ts.SourceFile {
  readonly parseDiagnostics: readonly ts.Diagnostic[];
}

interface ModuleAnalysis {
  references: ModuleReference[];
  parseDiagnostics: readonly ts.Diagnostic[];
}

function scriptKindForPath(path: string): ts.ScriptKind {
  return /\.[cm]?tsx$/u.test(path) ? ts.ScriptKind.TSX : ts.ScriptKind.TS;
}

function analyzeModule(file: RepositorySourceFile): ModuleAnalysis {
  const sourceFile = ts.createSourceFile(
    file.path,
    file.source,
    ts.ScriptTarget.Latest,
    true,
    scriptKindForPath(file.path),
  ) as ParsedSourceFile;
  const references: ModuleReference[] = [];

  function literalText(node: ts.Node | undefined): string | undefined {
    return node !== undefined && ts.isStringLiteralLike(node) ? node.text : undefined;
  }

  function visit(node: ts.Node): void {
    if (ts.isImportDeclaration(node) && ts.isStringLiteral(node.moduleSpecifier)) {
      references.push({ kind: 'static', specifier: node.moduleSpecifier.text });
    }
    if (
      ts.isImportEqualsDeclaration(node) &&
      ts.isExternalModuleReference(node.moduleReference) &&
      node.moduleReference.expression !== undefined &&
      ts.isStringLiteral(node.moduleReference.expression)
    ) {
      references.push({ kind: 'static', specifier: node.moduleReference.expression.text });
    }
    if (
      ts.isExportDeclaration(node) &&
      node.moduleSpecifier !== undefined &&
      ts.isStringLiteral(node.moduleSpecifier)
    ) {
      references.push({ kind: 'static', specifier: node.moduleSpecifier.text });
    }
    if (
      ts.isCallExpression(node) &&
      (node.expression.kind === ts.SyntaxKind.ImportKeyword ||
        (ts.isIdentifier(node.expression) && node.expression.text === 'require'))
    ) {
      const specifier = literalText(node.arguments[0]);
      references.push({
        kind:
          node.expression.kind === ts.SyntaxKind.ImportKeyword ? 'dynamic-import' : 'require',
        ...(specifier !== undefined ? { specifier } : {}),
      });
    }
    if (ts.isImportTypeNode(node) && ts.isLiteralTypeNode(node.argument)) {
      const specifier = literalText(node.argument.literal);
      if (specifier !== undefined) references.push({ kind: 'static', specifier });
    }
    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return { references, parseDiagnostics: sourceFile.parseDiagnostics };
}

function workspaceTarget(
  specifier: string,
  packageByName: ReadonlyMap<string, WorkspacePackageId>,
): WorkspacePackageId | 'unknown' | undefined {
  for (const [name, id] of packageByName) {
    if (specifier === name || specifier.startsWith(`${name}/`)) return id;
  }
  return specifier.startsWith('@einsatzzeichen/') ? 'unknown' : undefined;
}

function isTestSource(path: string): boolean {
  return /\.(?:test|spec)\.[cm]?tsx?$/.test(path);
}

function externalPackageName(specifier: string): string | undefined {
  if (
    specifier.startsWith('.') ||
    specifier.startsWith('/') ||
    specifier.startsWith('node:')
  ) {
    return undefined;
  }
  const parts = specifier.split('/');
  if (specifier.startsWith('@')) {
    return parts.length >= 2 ? `${parts[0]}/${parts[1]}` : specifier;
  }
  return parts[0];
}

function relativeImportTarget(
  file: RepositorySourceFile,
  specifier: string,
  manifests: readonly RepositoryManifest[],
): WorkspacePackageId | 'outside' | undefined {
  if (!specifier.startsWith('.')) return undefined;
  const resolved = posix.normalize(posix.join(posix.dirname(file.path), specifier));
  return (
    manifests.find((manifest) => resolved.startsWith(`packages/${manifest.id}/`))?.id ?? 'outside'
  );
}

export function findRepositoryPolicyViolations(
  input: RepositoryPolicyInput,
): RepositoryPolicyViolation[] {
  const violations: RepositoryPolicyViolation[] = [];
  const packageByName = new Map(input.manifests.map((manifest) => [manifest.name, manifest.id]));
  const manifestById = new Map(input.manifests.map((manifest) => [manifest.id, manifest]));

  for (const manifest of input.manifests) {
    const expectedName = `@einsatzzeichen/${manifest.id}`;
    if (manifest.name !== expectedName) {
      violations.push({
        code: 'unexpected-package-name',
        path: manifest.path,
        importer: manifest.id,
        specifier: manifest.name,
        detail: `${manifest.path} muss den Paketnamen ${expectedName} verwenden.`,
      });
    }

    for (const section of manifest.malformedDependencySections) {
      violations.push({
        code: 'malformed-dependency-section',
        path: manifest.path,
        importer: manifest.id,
        specifier: section,
        detail: `${section} muss ein Objekt mit Paketnamen und String-Versionen sein.`,
      });
    }

    for (const [dependencyName, dependencyVersion] of Object.entries(
      manifest.dependencies,
    )) {
      if (typeof dependencyVersion !== 'string' || dependencyVersion.trim().length === 0) {
        violations.push({
          code: 'malformed-dependency-version',
          path: manifest.path,
          importer: manifest.id,
          specifier: dependencyName,
          detail: `${dependencyName} muss eine nichtleere String-Version verwenden.`,
        });
        continue;
      }
      const target = packageByName.get(dependencyName);
      if (target === undefined) {
        if (dependencyName.startsWith('@einsatzzeichen/')) {
          violations.push({
            code: 'unknown-internal-dependency',
            path: manifest.path,
            importer: manifest.id,
            specifier: dependencyName,
            detail: `Unbekanntes internes Paket in ${dependencyName}.`,
          });
          continue;
        }
        if (manifest.id === 'core' || manifest.id === 'schema') {
          violations.push({
            code: 'forbidden-external-dependency',
            path: manifest.path,
            importer: manifest.id,
            specifier: dependencyName,
            detail: `${manifest.id} muss ohne externe Abhängigkeit bleiben (${dependencyName}).`,
          });
        }
        continue;
      }
      if (PACKAGE_RANK[target] < PACKAGE_RANK[manifest.id]) continue;

      violations.push({
        code: 'forbidden-internal-dependency',
        path: manifest.path,
        importer: manifest.id,
        target,
        specifier: dependencyName,
        detail: `${manifest.id} darf nicht von ${target} abhängen.`,
      });
    }
  }

  for (const file of input.sourceFiles) {
    const analysis = analyzeModule(file);
    if (analysis.parseDiagnostics.length > 0) {
      const firstDiagnostic = analysis.parseDiagnostics[0];
      violations.push({
        code: 'typescript-parse-error',
        path: file.path,
        importer: file.packageId,
        detail:
          `TypeScript-Quelle enthält ${String(analysis.parseDiagnostics.length)} Syntaxfehler: ` +
          ts.flattenDiagnosticMessageText(firstDiagnostic.messageText, ' '),
      });
      continue;
    }

    for (const reference of analysis.references) {
      const specifier = reference.specifier;
      if (specifier === undefined) {
        violations.push({
          code: 'unresolved-module-import',
          path: file.path,
          importer: file.packageId,
          detail: `${reference.kind} muss ein statisch auflösbares Modulziel verwenden.`,
        });
        continue;
      }
      const relativeTarget = relativeImportTarget(file, specifier, input.manifests);
      if (relativeTarget === 'outside') {
        violations.push({
          code: 'relative-import-escapes-package',
          path: file.path,
          importer: file.packageId,
          specifier,
          detail: 'Relativer Import verlässt den Workspace-Paketbaum.',
        });
        continue;
      }
      if (relativeTarget !== undefined && relativeTarget !== file.packageId) {
        violations.push({
          code: 'relative-cross-package-import',
          path: file.path,
          importer: file.packageId,
          target: relativeTarget,
          specifier,
          detail: `Relativer Import umgeht die Paketgrenze zu ${relativeTarget}.`,
        });
        continue;
      }

      const target = workspaceTarget(specifier, packageByName);
      const importerManifest = manifestById.get(file.packageId);
      if (target === 'unknown') {
        violations.push({
          code: 'unknown-internal-import',
          path: file.path,
          importer: file.packageId,
          specifier,
          detail: `Unbekanntes internes Paket in ${specifier}.`,
        });
        continue;
      }
      if (target === undefined) {
        if (isTestSource(file.path)) continue;
        if (
          (file.packageId === 'core' || file.packageId === 'schema') &&
          !specifier.startsWith('.')
        ) {
          violations.push({
            code: 'forbidden-external-import',
            path: file.path,
            importer: file.packageId,
            specifier,
            detail: `${file.packageId} muss ohne externen Import bleiben (${specifier}).`,
          });
          continue;
        }
        const externalPackage = externalPackageName(specifier);
        if (
          externalPackage !== undefined &&
          importerManifest?.dependencies[externalPackage] === undefined
        ) {
          violations.push({
            code: 'undeclared-external-import',
            path: file.path,
            importer: file.packageId,
            specifier,
            detail: `${externalPackage} fehlt in ${importerManifest?.path ?? 'package.json'}.`,
          });
        }
        continue;
      }
      if (PACKAGE_RANK[target] >= PACKAGE_RANK[file.packageId]) {
        violations.push({
          code: 'forbidden-internal-import',
          path: file.path,
          importer: file.packageId,
          target,
          specifier,
          detail: `${file.packageId} darf ${target} nicht importieren.`,
        });
        continue;
      }

      const targetManifest = manifestById.get(target);
      if (
        importerManifest !== undefined &&
        targetManifest !== undefined &&
        importerManifest.dependencies[targetManifest.name] === undefined
      ) {
        violations.push({
          code: 'undeclared-internal-import',
          path: file.path,
          importer: file.packageId,
          target,
          specifier,
          detail: `${specifier} fehlt in ${importerManifest.path}.`,
        });
      }
    }
  }

  for (const symlink of [...input.sourceSymlinks].sort((left, right) =>
    left.path < right.path ? -1 : left.path > right.path ? 1 : 0,
  )) {
    violations.push({
      code: 'source-symlink',
      path: symlink.path,
      importer: symlink.packageId,
      detail: 'Symlinks unter packages/*/src werden nicht als Paketquelle akzeptiert.',
    });
  }

  for (const path of [...input.trackedFiles].sort()) {
    if (
      path !== 'taktische-zeichen' &&
      path !== 'taktische-zeichen.zip' &&
      !path.startsWith('taktische-zeichen/')
    ) {
      continue;
    }
    violations.push({
      code: 'tracked-reference-asset',
      path,
      detail: 'Der lokale BABZ-Referenzbestand darf nicht im Git-Index liegen.',
    });
  }

  const ignoreRules = new Set(input.gitignore.split(/\r?\n/u).map((line) => line.trim()));
  for (const requiredRule of ['/taktische-zeichen/', '/taktische-zeichen.zip']) {
    if (ignoreRules.has(requiredRule)) continue;
    violations.push({
      code: 'missing-reference-ignore-rule',
      path: '.gitignore',
      specifier: requiredRule,
      detail: `Schutzregel fehlt: ${requiredRule}`,
    });
  }

  const effectivelyIgnored = new Set(input.effectivelyIgnoredReferenceTargets);
  for (const target of REFERENCE_IGNORE_TARGETS) {
    if (effectivelyIgnored.has(target)) continue;
    violations.push({
      code: 'ineffective-reference-ignore-rule',
      path: '.gitignore',
      specifier: target,
      detail: `Rootschutz ist für ${target} nach Auswertung aller Ignore-Regeln unwirksam.`,
    });
  }

  return violations;
}
