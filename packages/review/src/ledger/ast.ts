/**
 * Die Lesehälfte des Ledger-Schreibwegs: den Quelltext einer Katalogdatei mit der
 * TypeScript-Compiler-API aufschlüsseln, ohne ihn zu verändern.
 *
 * Warum überhaupt die Compiler-API und kein regulärer Ausdruck: die Ledger tragen Kommentare mit
 * den Fachfragen-IDs, mehrzeilige Einträge und Schlüssel, in denen `.`, `:` und `#` vorkommen.
 * Ein Textmuster, das darüber stolpert, schreibt still an der falschen Stelle — und eine falsch
 * eingetragene Fachfreigabe ist genau der Schaden, den dieses Werkzeug verhindern soll.
 */
import * as ts from 'typescript';

/**
 * `parseDiagnostics` ist nicht Teil der öffentlichen API von `ts.SourceFile`, aber die einzige
 * Stelle, an der ein Syntaxfehler ohne vollständiges Programm sichtbar wird. Dieselbe
 * Erweiterung nutzt bereits `packages/cli/src/commands/repository-policy.ts`.
 */
interface ParsedSourceFile extends ts.SourceFile {
  readonly parseDiagnostics?: readonly ts.Diagnostic[];
}

/**
 * Parst den Quelltext. Fail-closed: eine Datei, die nicht sauber parst, wird nicht angefasst —
 * sonst würde ein Schreibvorgang auf einem halb verstandenen Baum aufsetzen.
 */
export function parseLedgerSource(source: string, fileName: string): ts.SourceFile {
  const sourceFile = ts.createSourceFile(
    fileName,
    source,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS,
  );
  const diagnostics = (sourceFile as ParsedSourceFile).parseDiagnostics ?? [];
  const first = diagnostics[0];
  if (first !== undefined) {
    const message = ts.flattenDiagnosticMessageText(first.messageText, ' ');
    throw new Error(`Der Quelltext von "${fileName}" ist syntaktisch fehlerhaft: ${message}`);
  }
  return sourceFile;
}

/**
 * Der Text eines Eigenschaftsnamens, sofern er statisch bestimmbar ist. Berechnete Namen liefern
 * `undefined` und werden dadurch nie versehentlich getroffen.
 */
export function propertyNameText(name: ts.PropertyName): string | undefined {
  if (ts.isStringLiteralLike(name)) return name.text;
  if (ts.isIdentifier(name)) return name.text;
  if (ts.isNumericLiteral(name)) return name.text;
  return undefined;
}

/**
 * Schält Hüllen wie `deepFreeze(…)`, `… satisfies T`, `… as const` und Klammern ab, bis ein
 * Objektliteral übrig bleibt. Alles andere ergibt `undefined`; geraten wird nicht.
 */
export function unwrapObjectLiteral(
  expression: ts.Expression | undefined,
): ts.ObjectLiteralExpression | undefined {
  let current = expression;
  while (current !== undefined) {
    if (ts.isObjectLiteralExpression(current)) return current;
    if (ts.isParenthesizedExpression(current)) {
      current = current.expression;
      continue;
    }
    if (ts.isAsExpression(current) || ts.isSatisfiesExpression(current)) {
      current = current.expression;
      continue;
    }
    if (ts.isCallExpression(current) && current.arguments.length === 1) {
      current = current.arguments[0];
      continue;
    }
    return undefined;
  }
  return undefined;
}

/**
 * Das Objektliteral hinter `export const <constantName> = …`. Wirft, wenn die Konstante fehlt
 * oder kein Objektliteral trägt — beides bedeutet, dass die Datei nicht die erwartete ist.
 */
export function findConstantObjectLiteral(
  sourceFile: ts.SourceFile,
  constantName: string,
): ts.ObjectLiteralExpression {
  let declaration: ts.VariableDeclaration | undefined;
  const visit = (node: ts.Node): void => {
    if (
      ts.isVariableDeclaration(node) &&
      ts.isIdentifier(node.name) &&
      node.name.text === constantName
    ) {
      declaration = node;
    }
    ts.forEachChild(node, visit);
  };
  ts.forEachChild(sourceFile, visit);

  if (declaration === undefined) {
    throw new Error(`In "${sourceFile.fileName}" gibt es keine Konstante "${constantName}".`);
  }
  const literal = unwrapObjectLiteral(declaration.initializer);
  if (literal === undefined) {
    throw new Error(
      `Die Konstante "${constantName}" in "${sourceFile.fileName}" trägt kein Objektliteral; ` +
        'der Ledger wird nicht verändert.',
    );
  }
  return literal;
}

/** Die unmittelbare Eigenschaft `key` eines Objektliterals — nicht die verschachtelter Literale. */
export function findDirectProperty(
  literal: ts.ObjectLiteralExpression,
  key: string,
): ts.PropertyAssignment | undefined {
  for (const property of literal.properties) {
    if (!ts.isPropertyAssignment(property)) continue;
    if (propertyNameText(property.name) === key) return property;
  }
  return undefined;
}
