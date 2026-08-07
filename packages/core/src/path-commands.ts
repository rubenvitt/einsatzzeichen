/**
 * Kommando-Tokenizer für Piktogramm-Pfade. Kein Bezier-Auswerter: das Box-Gate braucht die
 * Koordinaten **je Kommando**, weil `H` nur ein x und `V` nur ein y trägt. Ein Leser, der den
 * `d`-String als Zahlenstrom nimmt, würde `V 25` in einer schmalen hohen Box gegen die Breite
 * prüfen und valide Pfade ablehnen.
 *
 * Ohne Laufzeitabhängigkeit: `core` bleibt abhängigkeitsfrei. „Regex je Pfad" wäre trotzdem zu
 * wenig — die Zerlegung nach Kommandos ist die eigentliche Leistung.
 */

/** Die sieben zugelassenen absoluten Kommandos (Spec Abschnitt 5). */
export type PathCommandName = 'M' | 'L' | 'H' | 'V' | 'C' | 'Q' | 'Z';

export interface PathCommand {
  command: PathCommandName;
  /** Genau die Zahlen dieses einen Kommandos: 2 für M/L, 1 für H/V, 6 für C, 4 für Q, 0 für Z. */
  numbers: readonly number[];
}

export interface TokenizeResult {
  commands: readonly PathCommand[];
  /**
   * Verstöße gegen die Autorenkonvention, je Ursache genau einmal. Bei nichtleerer Liste ist
   * `commands` unvollständig — die Argumente eines abgelehnten Kommandos werden still verworfen,
   * statt als Dutzend Folgefehler zu erscheinen.
   */
  problems: readonly string[];
}

const ARITY: Record<PathCommandName, number> = { M: 2, L: 2, H: 1, V: 1, C: 6, Q: 4, Z: 0 };

/**
 * Zahl **vor** Buchstabe: `1e-3` muss als eine Zahl gelesen werden und nicht als `1`, `e`, `-3`.
 * Die Alternation greift links zuerst, und ein Match beginnt an der jeweiligen Position.
 */
const TOKEN = /[+-]?\d*\.?\d+(?:[eE][-+]?\d+)?|[A-Za-z]/g;
/** SVG 2 `wsp`: Tab, LF, Form Feed, CR und Space — nicht JavaScripts breiteres `\s`. */
const SVG_WSP_ONLY = /^[\u0009\u000a\u000c\u000d\u0020]*$/;
const SVG_COMMA_WSP = /^[\u0009\u000a\u000c\u000d\u0020]*,[\u0009\u000a\u000c\u000d\u0020]*$/;

type PathTokenKind = 'command' | 'number';

function tokenKind(token: string): PathTokenKind {
  return /^[A-Za-z]$/.test(token) ? 'command' : 'number';
}

function isCommandName(value: string): value is PathCommandName {
  return Object.hasOwn(ARITY, value);
}

type PathPoint = readonly [number, number];

function samePoint(left: PathPoint, right: PathPoint): boolean {
  return left[0] === right[0] && left[1] === right[1];
}

function pointAt(numbers: readonly number[], offset: number): PathPoint | null {
  const x = numbers[offset];
  const y = numbers[offset + 1];
  return x === undefined || y === undefined ? null : [x, y];
}

/** Ob die vollständig zerlegten Kommandos wenigstens ein geometrisch wirksames Segment tragen. */
function hasDrawingSegment(commands: readonly PathCommand[]): boolean {
  let current: PathPoint | null = null;
  let subpathStart: PathPoint | null = null;

  for (const command of commands) {
    const numbers = command.numbers;
    switch (command.command) {
      case 'M': {
        current = pointAt(numbers, 0);
        subpathStart = current;
        break;
      }
      case 'L': {
        const end = pointAt(numbers, 0);
        if (current === null || end === null) break;
        if (!samePoint(current, end)) return true;
        current = end;
        break;
      }
      case 'H': {
        const x = numbers[0];
        if (current === null || x === undefined) break;
        const end: PathPoint = [x, current[1]];
        if (!samePoint(current, end)) return true;
        current = end;
        break;
      }
      case 'V': {
        const y = numbers[0];
        if (current === null || y === undefined) break;
        const end: PathPoint = [current[0], y];
        if (!samePoint(current, end)) return true;
        current = end;
        break;
      }
      case 'C': {
        const first = pointAt(numbers, 0);
        const second = pointAt(numbers, 2);
        const end = pointAt(numbers, 4);
        if (current === null || first === null || second === null || end === null) break;
        if (
          !samePoint(current, first) ||
          !samePoint(current, second) ||
          !samePoint(current, end)
        ) {
          return true;
        }
        current = end;
        break;
      }
      case 'Q': {
        const control = pointAt(numbers, 0);
        const end = pointAt(numbers, 2);
        if (current === null || control === null || end === null) break;
        if (!samePoint(current, control) || !samePoint(current, end)) {
          return true;
        }
        current = end;
        break;
      }
      case 'Z': {
        if (current !== null && subpathStart !== null && !samePoint(current, subpathStart)) {
          return true;
        }
        current = subpathStart;
        break;
      }
    }
  }
  return false;
}

export function tokenizePath(d: string): TokenizeResult {
  const commands: PathCommand[] = [];
  const problems: string[] = [];
  let current: PathCommandName | null = null;
  let numbers: number[] = [];
  /** Nach einem abgelehnten Kommando dessen Zahlen still verwerfen. */
  let skipNumbers = false;

  function flush(): void {
    if (current === null) return;
    const arity = ARITY[current];
    if (arity === 0) {
      if (numbers.length > 0) {
        problems.push(`Kommando "${current}" erwartet keine Zahlen, erhielt ${numbers.length}.`);
      }
      commands.push({ command: current, numbers: [] });
    } else if (numbers.length === 0 || numbers.length % arity !== 0) {
      problems.push(
        `Kommando "${current}" erwartet ein Vielfaches von ${arity} Zahlen, ` +
          `erhielt ${numbers.length}.`,
      );
    } else {
      for (let i = 0; i < numbers.length; i += arity) {
        // Die Folgepaare eines M sind nach der SVG-Spezifikation implizite L. Für die
        // Box-Prüfung ist das gleichgültig (beides Koordinatenpaare), für die Lesbarkeit der
        // zerlegten Liste nicht.
        const command: PathCommandName = current === 'M' && i > 0 ? 'L' : current;
        commands.push({ command, numbers: numbers.slice(i, i + arity) });
      }
    }
    current = null;
    numbers = [];
  }

  let cursor = 0;
  let previousTokenKind: PathTokenKind | null = null;

  function inspectGap(
    start: number,
    end: number,
    before: PathTokenKind | null,
    after: PathTokenKind | null,
  ): void {
    const gap = d.slice(start, end);
    if (SVG_WSP_ONLY.test(gap)) return;
    if (before === 'number' && after === 'number' && SVG_COMMA_WSP.test(gap)) return;
    if (gap.includes(',')) {
      problems.push(
        `Unzulässiger Pfadseparator "${gap}" in Pfaddaten; ` +
          'ein einzelnes Komma ist nur zwischen zwei Zahlen zulässig.',
      );
      return;
    }
    problems.push(`Unzulässige Zeichenfolge "${gap}" in Pfaddaten.`);
  }

  for (const match of d.matchAll(TOKEN)) {
    const token = match[0];
    const index = match.index;
    const kind = tokenKind(token);
    inspectGap(cursor, index, previousTokenKind, kind);
    cursor = index + token.length;
    previousTokenKind = kind;
    if (/^[A-Za-z]$/.test(token)) {
      flush();
      const upper = token.toUpperCase();
      if (token !== upper) {
        problems.push(`Relatives Kommando "${token}" — nur absolute Kommandos sind zulässig.`);
        skipNumbers = true;
        continue;
      }
      if (!isCommandName(upper)) {
        problems.push(`Unzulässiges Kommando "${token}" — zulässig sind nur M L H V C Q Z.`);
        skipNumbers = true;
        continue;
      }
      current = upper;
      skipNumbers = false;
    } else if (current !== null) {
      numbers.push(Number(token));
    } else if (!skipNumbers) {
      problems.push(`Zahl "${token}" ohne vorangehendes Kommando.`);
    }
  }
  inspectGap(cursor, d.length, previousTokenKind, null);
  flush();

  // Lexikalische oder Arity-Fehler sind bereits die Wurzelursache. Der Zustandsvertrag ergänzt
  // dann keinen Folgefehler, damit beide konsumierenden Gates denselben kleinen Befundsatz sehen.
  if (problems.length === 0) {
    if (commands.length === 0) {
      problems.push('Pfaddaten dürfen nicht leer sein.');
    } else if (commands[0]?.command !== 'M') {
      problems.push('Der Pfad muss mit Kommando "M" beginnen.');
    } else if (!hasDrawingSegment(commands)) {
      problems.push('Der Pfad muss mindestens ein nichtdegeneriertes zeichnendes Segment enthalten.');
    }
  }

  return { commands, problems };
}
