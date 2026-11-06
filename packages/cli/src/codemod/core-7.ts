/*
 * Codemod für 7.0 (ESZ-151): schreibt Importe aus der Wurzel von `@einsatzzeichen/core` auf die
 * Subpfade um, in die die Namen gezogen sind (`CORE_7_MOVES`).
 *
 *   import { drawSymbol, renderSvg, RULE_CATALOG } from '@einsatzzeichen/core';
 * wird zu
 *   import { renderSvg } from '@einsatzzeichen/core';
 *   import { drawSymbol } from '@einsatzzeichen/core/exact';
 *   import { RULE_CATALOG } from '@einsatzzeichen/core/gates';
 *
 * Gelesen wird mit dem TypeScript-Parser, nicht mit Mustern über den Text: Strings, Kommentare und
 * Vorlagen bleiben unberührt. Bearbeitet werden Skriptdateien (`.ts`, `.tsx`, `.js`, …), die
 * Skriptteile von `.astro`, `.vue` und `.svelte` und die Codeblöcke (ts, tsx, js, jsx) in `.md`
 * und `.mdx`, dazu Typen der Form `import('@einsatzzeichen/core').Name`. Was sich nicht eindeutig
 * umschreiben lässt (`import * as core`, `import()`,
 * `require`, `vi.mock('@einsatzzeichen/core')` und andere Aufrufe mit dem Paketnamen, unbekannte
 * Namen, Kommentare zwischen den Namen), bleibt stehen und wird gemeldet.
 */
import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { extname, join } from 'node:path';
import * as ts from '@typescript/typescript6';
import { CORE_7_MOVES, type Core7Subpath } from './core-7-map.js';

const CORE = '@einsatzzeichen/core';
const ORDER: readonly Core7Subpath[] = ['', 'exact', 'blocks', 'sketch', 'gates'];
const MAX_LINE = 100;

const SCRIPT_EXTENSIONS = new Set(['.ts', '.tsx', '.mts', '.cts', '.js', '.jsx', '.mjs', '.cjs']);
const MARKUP_EXTENSIONS = new Set(['.astro', '.vue', '.svelte']);
const MARKDOWN_EXTENSIONS = new Set(['.md', '.mdx']);
const SKIPPED_DIRECTORIES = new Set(['node_modules', 'dist', '.git', '.astro', '.turbo', 'coverage']);
const FENCE_LANGUAGES = new Set(['ts', 'tsx', 'js', 'jsx', 'mjs', 'typescript', 'javascript']);

export interface CodemodWarning {
  readonly line: number;
  readonly message: string;
}

export interface RewriteResult {
  readonly text: string;
  readonly changed: boolean;
  readonly warnings: readonly CodemodWarning[];
}

interface Region {
  readonly start: number;
  readonly end: number;
}

interface Edit {
  readonly start: number;
  readonly end: number;
  readonly text: string;
}

const lineOf = (text: string, offset: number): number => text.slice(0, offset).split('\n').length;

/** Die Stellen einer Datei, die Skript sind. */
function scriptRegions(text: string, fileName: string): Region[] {
  const extension = extname(fileName).toLowerCase();
  if (MARKUP_EXTENSIONS.has(extension)) {
    const regions: Region[] = [];
    // Astro: der Vorspann zwischen den beiden `---` am Dateianfang.
    const frontmatter = /^---[^\n]*\n([\s\S]*?)\n---/u.exec(text);
    if (extension === '.astro' && frontmatter !== null) {
      const start = frontmatter.index + frontmatter[0].indexOf('\n') + 1;
      regions.push({ start, end: start + frontmatter[1]!.length });
    }
    for (const match of text.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/giu)) {
      const start = match.index + match[0].indexOf('>') + 1;
      regions.push({ start, end: start + match[1]!.length });
    }
    return regions;
  }
  if (MARKDOWN_EXTENSIONS.has(extension)) {
    const regions: Region[] = [];
    // Jeder Codeblock, auch einer in einer anderen Sprache, ist für die ESM-Suche gesperrt.
    const fences: Region[] = [];
    for (const match of text.matchAll(/^([ \t]*)(`{3,}|~{3,})([\w-]*)[^\n]*\n([\s\S]*?)^\1\2[ \t]*$/gmu)) {
      fences.push({ start: match.index, end: match.index + match[0].length });
      if (!FENCE_LANGUAGES.has(match[3]!.toLowerCase())) continue;
      const start = match.index + match[0].indexOf('\n') + 1;
      regions.push({ start, end: start + match[4]!.length });
    }
    // MDX: ESM-Importe außerhalb aller Codeblöcke, Zeile für Zeile bis zum `from '…'`. Ein Treffer,
    // der in einen Codeblock reicht, zählt nicht: sonst bearbeiteten zwei Stellen denselben Text.
    if (extension === '.mdx') {
      for (const match of text.matchAll(/^(?:import|export)\b[\s\S]*?\bfrom\s*(['"])[^'"\n]+\1;?[ \t]*$/gmu)) {
        const end = match.index + match[0].length;
        if (fences.some((fence) => match.index < fence.end && end > fence.start)) continue;
        regions.push({ start: match.index, end });
      }
    }
    return regions;
  }
  return [{ start: 0, end: text.length }];
}

function scriptKindOf(fileName: string): ts.ScriptKind {
  const extension = extname(fileName).toLowerCase();
  if (extension === '.tsx' || extension === '.md' || extension === '.mdx') return ts.ScriptKind.TSX;
  if (extension === '.jsx') return ts.ScriptKind.JSX;
  if (extension === '.js' || extension === '.mjs' || extension === '.cjs') return ts.ScriptKind.JS;
  return ts.ScriptKind.TS;
}

const isCore = (node: ts.Expression | undefined): node is ts.StringLiteral =>
  node !== undefined && ts.isStringLiteral(node) && node.text === CORE;

function rewriteDeclaration(
  node: ts.ImportDeclaration | ts.ExportDeclaration,
  source: ts.SourceFile,
  report: (node: ts.Node, message: string) => void,
): string | undefined {
  const isImport = ts.isImportDeclaration(node);
  let typeOnly: boolean;
  let elements: readonly (ts.ImportSpecifier | ts.ExportSpecifier)[];
  if (isImport) {
    const clause = node.importClause;
    if (clause === undefined) return undefined; // `import '@einsatzzeichen/core'` bleibt
    if (clause.name !== undefined) {
      report(node, 'Standardimport aus core: von Hand prüfen, core hat keinen Standardexport.');
      return undefined;
    }
    if (clause.namedBindings === undefined) return undefined;
    if (ts.isNamespaceImport(clause.namedBindings)) {
      report(
        node,
        `\`import * as ${clause.namedBindings.name.text}\` aus core: die Namen einzeln importieren, ` +
          'dann löst der Codemod sie auf.',
      );
      return undefined;
    }
    typeOnly = clause.isTypeOnly;
    elements = clause.namedBindings.elements;
  } else {
    if (node.exportClause === undefined) {
      report(node, '`export * from` core: reicht in 7.0 nur noch die Wurzel weiter; die Subpfade ergänzen.');
      return undefined;
    }
    if (!ts.isNamedExports(node.exportClause)) {
      report(node, '`export * as` aus core: von Hand auf die Subpfade verteilen.');
      return undefined;
    }
    typeOnly = node.isTypeOnly;
    elements = node.exportClause.elements;
  }

  const groups = new Map<Core7Subpath, string[]>();
  for (const element of elements) {
    const imported = (element.propertyName ?? element.name).getText(source);
    const target = CORE_7_MOVES[imported];
    if (target === undefined) {
      report(element, `\`${imported}\` war 6.x nicht an der Wurzel von core; bleibt stehen.`);
    }
    const group = groups.get(target ?? '') ?? [];
    group.push(element.getText(source));
    groups.set(target ?? '', group);
  }
  if (groups.size === 1 && groups.has('')) return undefined;

  const original = node.getText(source);
  const braces = original.slice(original.indexOf('{'), original.lastIndexOf('}') + 1);
  if (/\/\/|\/\*/u.test(braces)) {
    report(node, 'Kommentare zwischen den Namen gehen beim Umschreiben verloren.');
  }
  const multiline = braces.includes('\n');
  const lineIndent = /[ \t]*$/u.exec(source.text.slice(0, node.getStart(source)))![0];
  // Einrückung der Namen wie im Original (volle Zeileneinrückung der ersten Namenszeile).
  const indent = multiline ? (/\n([ \t]*)\S/u.exec(braces)?.[1] ?? `${lineIndent}  `) : '';
  const quote = node.moduleSpecifier!.getText(source).startsWith('"') ? '"' : "'";
  const semicolon = original.trimEnd().endsWith(';') ? ';' : '';
  return ORDER.filter((subpath) => groups.has(subpath))
    .map((subpath) => {
      let names = groups.get(subpath)!;
      // Bleiben nur Typen übrig, wird es ein `import type`, kein leerer Laufzeitimport.
      const onlyTypes = !typeOnly && names.every((name) => name.startsWith('type '));
      if (onlyTypes) names = names.map((name) => name.slice('type '.length));
      const keyword = `${isImport ? 'import' : 'export'}${typeOnly || onlyTypes ? ' type' : ''}`;
      const specifier = subpath === '' ? CORE : `${CORE}/${subpath}`;
      const tail = ` from ${quote}${specifier}${quote}${semicolon}`;
      const single = `${keyword} { ${names.join(', ')} }${tail}`;
      // Mehrzeilig nur, wenn das Original es war und die eine Zeile zu lang würde.
      if (!multiline || lineIndent.length + single.length <= MAX_LINE) return single;
      return `${keyword} {\n${names.map((name) => `${indent}${name},`).join('\n')}\n${lineIndent}}${tail}`;
    })
    .join(`\n${lineIndent}`);
}

/** Schreibt die Importe aus der Wurzel von core in einem Dateitext um. */
export function rewriteCoreImports(text: string, fileName: string): RewriteResult {
  const edits: Edit[] = [];
  const warnings: CodemodWarning[] = [];

  for (const region of scriptRegions(text, fileName)) {
    const code = text.slice(region.start, region.end);
    if (!code.includes(CORE)) continue;
    const source = ts.createSourceFile(fileName, code, ts.ScriptTarget.Latest, true, scriptKindOf(fileName));
    const report = (node: ts.Node, message: string): void => {
      warnings.push({ line: lineOf(text, region.start + node.getStart(source)), message });
    };

    const visit = (node: ts.Node): void => {
      if ((ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) && isCore(node.moduleSpecifier)) {
        const replacement = rewriteDeclaration(node, source, report);
        if (replacement !== undefined) {
          edits.push({
            start: region.start + node.getStart(source),
            end: region.start + node.getEnd(),
            text: replacement,
          });
        }
        return;
      }
      // `import('@einsatzzeichen/core').CatalogPorts` in Typposition: den Subpfad nach dem Namen wählen.
      if (ts.isImportTypeNode(node) && ts.isLiteralTypeNode(node.argument) && isCore(node.argument.literal)) {
        let first: ts.EntityName | undefined = node.qualifier;
        while (first !== undefined && ts.isQualifiedName(first)) first = first.left;
        const name = first?.text;
        const target = name === undefined ? undefined : CORE_7_MOVES[name];
        if (target === undefined) {
          report(node, '`import(…)`-Typ aus core ohne bekannten Namen: Subpfad von Hand wählen.');
        } else if (target !== '') {
          const literal = node.argument.literal;
          const quote = literal.getText(source)[0];
          edits.push({
            start: region.start + literal.getStart(source),
            end: region.start + literal.getEnd(),
            text: `${quote}${CORE}/${target}${quote}`,
          });
        }
        return;
      }
      if (ts.isCallExpression(node) && isCore(node.arguments[0])) {
        const callee = node.expression;
        if (callee.kind === ts.SyntaxKind.ImportKeyword) {
          report(node, '`import()` aus core: geladene Namen von Hand auf die Subpfade verteilen.');
        } else if (ts.isIdentifier(callee) && callee.text === 'require') {
          report(node, '`require` aus core: geladene Namen von Hand auf die Subpfade verteilen.');
        } else {
          // etwa `vi.mock('@einsatzzeichen/core', …)`: trifft nur noch die Wurzel.
          report(
            node,
            `\`${callee.getText(source)}('${CORE}')\` trifft in 7.0 nur noch die Wurzel; ` +
              'für umgezogene Namen den Subpfad nennen.',
          );
        }
      }
      ts.forEachChild(node, visit);
    };
    visit(source);
  }

  let result = text;
  for (const edit of edits.sort((a, b) => b.start - a.start)) {
    result = result.slice(0, edit.start) + edit.text + result.slice(edit.end);
  }
  warnings.sort((a, b) => a.line - b.line);
  return { text: result, changed: result !== text, warnings };
}

export interface CodemodFileReport {
  readonly file: string;
  readonly changed: boolean;
  readonly warnings: readonly CodemodWarning[];
}

function candidateFiles(path: string): string[] {
  const stat = statSync(path);
  if (stat.isFile()) return [path];
  return readdirSync(path, { withFileTypes: true }).flatMap((entry) => {
    if (entry.isDirectory()) {
      return SKIPPED_DIRECTORIES.has(entry.name) ? [] : candidateFiles(join(path, entry.name));
    }
    const extension = extname(entry.name).toLowerCase();
    const known =
      SCRIPT_EXTENSIONS.has(extension) || MARKUP_EXTENSIONS.has(extension) || MARKDOWN_EXTENSIONS.has(extension);
    return entry.isFile() && known ? [join(path, entry.name)] : [];
  });
}

/** Läuft über Dateien und Verzeichnisse; schreibt nur mit `write: true`. */
export function codemodCore7(paths: readonly string[], options: { write: boolean }): CodemodFileReport[] {
  const reports: CodemodFileReport[] = [];
  for (const file of paths.flatMap(candidateFiles)) {
    const text = readFileSync(file, 'utf8');
    if (!text.includes(CORE)) continue;
    const result = rewriteCoreImports(text, file);
    if (!result.changed && result.warnings.length === 0) continue;
    if (result.changed && options.write) writeFileSync(file, result.text);
    reports.push({ file, changed: result.changed, warnings: result.warnings });
  }
  return reports;
}
