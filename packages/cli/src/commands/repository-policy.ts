import { posix } from 'node:path';
import * as ts from 'typescript';

/**
 * Die vier Ausgabekanäle (LFH-405). Sie hängen nur an `core` und `schema`, weder an `conformance`
 * noch aneinander. Katalogdaten kommen über die Anwendung in den Kanal, nicht über eine Paketkante.
 */
export const OUTPUT_CHANNEL_PACKAGE_IDS = ['react', 'web-component', 'maplibre', 'qgis'] as const;

/**
 * Private Werkzeuge, die nie veröffentlicht werden: das Fachreview-Werkzeug und die Website.
 * Sie dürfen jedes veröffentlichte Paket nutzen, aber nicht aneinander hängen.
 */
export const PRIVATE_PACKAGE_IDS = ['review', 'website'] as const;

export const PUBLISHED_PACKAGE_IDS = [
  'cli',
  'conformance',
  'core',
  'schema',
  ...OUTPUT_CHANNEL_PACKAGE_IDS,
] as const;

export type PublishedPackageId = (typeof PUBLISHED_PACKAGE_IDS)[number];
export type PrivatePackageId = (typeof PRIVATE_PACKAGE_IDS)[number];
export type WorkspacePackageId = PublishedPackageId | PrivatePackageId;

export const WORKSPACE_PACKAGE_IDS: readonly WorkspacePackageId[] = [
  ...PUBLISHED_PACKAGE_IDS,
  ...PRIVATE_PACKAGE_IDS,
];

/**
 * Abhängigkeitsrichtung nach LFH-560: `cli → conformance → core → schema`, Kanäle → `core`.
 * `core` ist das Produkt, `conformance` das Prüfpaket, das für die Nutzung nicht nötig ist. Jede
 * Kante, die hier nicht steht, ist verboten — im Paketmanifest wie im Quelltext. Die Tabelle ist
 * zyklenfrei; von den veröffentlichten Paketen darf nur `cli` an `conformance` hängen.
 */
export const ALLOWED_WORKSPACE_DEPENDENCIES: Readonly<
  Record<WorkspacePackageId, readonly WorkspacePackageId[]>
> = {
  schema: [],
  core: ['schema'],
  conformance: ['core', 'schema'],
  react: ['core', 'schema'],
  'web-component': ['core', 'schema'],
  maplibre: ['core', 'schema'],
  qgis: ['core', 'schema'],
  cli: ['conformance', 'core', 'schema'],
  review: PUBLISHED_PACKAGE_IDS,
  website: PUBLISHED_PACKAGE_IDS,
};

export function isPrivatePackage(id: WorkspacePackageId): id is PrivatePackageId {
  return (PRIVATE_PACKAGE_IDS as readonly WorkspacePackageId[]).includes(id);
}

export function isAllowedWorkspaceDependency(
  importer: WorkspacePackageId,
  target: WorkspacePackageId,
): boolean {
  return ALLOWED_WORKSPACE_DEPENDENCIES[importer].includes(target);
}

/** Begründung einer verbotenen Kante, damit die Meldung sagt, welche Regel greift. */
export function forbiddenEdgeReason(
  importer: WorkspacePackageId,
  target: WorkspacePackageId,
): string {
  const allowed = ALLOWED_WORKSPACE_DEPENDENCIES[importer];
  const allowedText =
    allowed.length === 0
      ? `${importer} hängt an keinem Workspace-Paket`
      : `${importer} darf nur an ${allowed.join(', ')} hängen`;
  if (importer === target) {
    return `ein Paket bezieht sich nicht über seinen eigenen Paketnamen, innerhalb des Pakets gilt ein relativer Import`;
  }
  if (isPrivatePackage(target)) {
    return isPrivatePackage(importer)
      ? `private Pakete hängen nicht aneinander`
      : `${target} ist privat und wird nicht veröffentlicht; ein veröffentlichtes Paket kann nicht daran hängen`;
  }
  if (target === 'conformance') {
    return `conformance ist das Prüfpaket und für die Nutzung nicht nötig; von den veröffentlichten Paketen hängt nur cli daran (${allowedText})`;
  }
  return allowedText;
}

export interface RepositoryManifest {
  id: WorkspacePackageId;
  name: string;
  path: string;
  /** Wert von `private` im Paketmanifest; nur `true` gilt als privat. */
  isPrivate: boolean;
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
  // Virtuelle Module eines Frameworks (`astro:content`) gehören zum Paket vor dem Doppelpunkt.
  const scheme = /^([a-z][\w.-]*):/u.exec(specifier);
  if (scheme !== null) return scheme[1];
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

    const expectedPrivate = isPrivatePackage(manifest.id);
    if (manifest.isPrivate !== expectedPrivate) {
      violations.push({
        code: 'unexpected-publish-status',
        path: manifest.path,
        importer: manifest.id,
        detail: expectedPrivate
          ? `${manifest.id} ist ein privates Werkzeug und muss "private": true setzen.`
          : `${manifest.id} wird veröffentlicht und darf nicht "private": true setzen.`,
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
            detail: `${manifest.id} bleibt ohne Fremdabhängigkeit, damit es ohne Node im Browser läuft (${dependencyName}).`,
          });
        }
        continue;
      }
      if (isAllowedWorkspaceDependency(manifest.id, target)) continue;

      violations.push({
        code: 'forbidden-internal-dependency',
        path: manifest.path,
        importer: manifest.id,
        target,
        specifier: dependencyName,
        detail:
          `Verbotene Abhängigkeit ${manifest.id} → ${target} in ${manifest.path}: ` +
          `${forbiddenEdgeReason(manifest.id, target)}.`,
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
            detail: `${file.packageId} bleibt außerhalb von Tests ohne Fremd- und node:-Import, damit es im Browser läuft (${specifier}).`,
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
      if (!isAllowedWorkspaceDependency(file.packageId, target)) {
        violations.push({
          code: 'forbidden-internal-import',
          path: file.path,
          importer: file.packageId,
          target,
          specifier,
          detail:
            `Verbotener Import ${file.packageId} → ${target} (${specifier}): ` +
            `${forbiddenEdgeReason(file.packageId, target)}.`,
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
