import { composeFromCatalog } from '@einsatzzeichen/catalog/src/recipes.js';
import { CompositionError, type ValidationIssue } from '@einsatzzeichen/core';
import type { Drawing, SymbolSpec } from '@einsatzzeichen/schema';
import { explainIssue, type ExplainedIssue } from './rule-explanations.js';

/**
 * Der Zustand des Builders (Spec §5.4): eine `SymbolSpec` ändern, das Ergebnis beurteilen und die
 * Spec in die URL schreiben. Reine Funktionen — die Insel hält nur den React-State.
 *
 * **Warum der Subpfad `@einsatzzeichen/catalog/src/recipes.js` und nicht der Paketindex.** Der
 * Index zieht `fonts.ts` und damit `node:url` (Spec §5.2); im Browserbündel wäre das ein Fehler
 * zur Ladezeit. Der Spike aus Task 0 hat belegt, dass der Subpfad ohne `node:*` bündelt. Die
 * Aliasregeln in `astro.config.mjs` und `vitest.config.ts` bilden den Subpfad exakt (per RegExp,
 * nicht als Präfix) auf die Paketquelle ab.
 *
 * **Warum `composeFromCatalog` und nicht `validateSpec`.** `validateSpec(spec, context)` liest
 * einen Kontext aus aufgelöster Funktionsfassung und Verwaltungskopf; `compose()` baut diesen
 * Kontext aus den Ports und prüft damit mehr als ein blanker `validateSpec(spec)`. Zwei Wege
 * liefen auseinander — die Vorschau zeigte dann Regeln, die die Komposition nicht stellt, oder
 * bliebe grün und die Komposition wirft. Also genau ein Weg: komponieren und die
 * `CompositionError` auffangen. Jeder andere Fehler fliegt weiter (Spec §7).
 */

export interface SpecAction {
  field: keyof SymbolSpec;
  value: unknown;
}

export type SpecEvaluation =
  | { ok: true; drawing: Drawing }
  | { ok: false; issues: ExplainedIssue[]; unexplained: ValidationIssue[] };

/**
 * Ein Feld setzen oder entfernen. Leerer Text, leere Liste und `undefined` bedeuten „nicht
 * gesetzt": ein `designation: ''` wäre eine leere Beschriftung statt gar keiner, und ein
 * `bodyMarks: []` eine leere Marken-Liste statt keiner — beides sagt etwas anderes aus als das
 * Weglassen des Feldes und ergäbe eine Spec, die so nie in einem Rezept steht.
 */
export function reduceSpec(spec: SymbolSpec, action: SpecAction): SymbolSpec {
  const next: Record<string, unknown> = { ...spec };
  const empty =
    action.value === undefined ||
    action.value === '' ||
    (Array.isArray(action.value) && action.value.length === 0);
  if (empty) delete next[action.field];
  else next[action.field] = action.value;
  // Über `unknown`, und das ist keine Schlamperei: der Wert kommt aus einem Formularfeld und ist
  // hier ehrlich `unknown`; ob er zur Achse passt, entscheidet `compose()` und niemand sonst.
  // Auch das Pflichtfeld `kind` lässt sich so entfernen — dann bricht `compose()` sichtbar ab,
  // statt dass diese Funktion eine Gültigkeit behauptet, die sie nicht geprüft hat.
  return next as unknown as SymbolSpec;
}

/**
 * Erklärt jede Meldung einzeln. `explainIssue()` wirft bei einer unbekannten Regelkennung, und
 * das soll es auch: eine erfundene Erklärung wäre schlimmer als keine. Der Wurf darf aber nicht
 * die *übrigen*, erklärbaren Meldungen mitnehmen — sonst verdeckt eine neue Kernregel die
 * Auskunft zu allen anderen. Unerklärte Meldungen wandern deshalb in `unexplained`, und die
 * Insel zeigt sie in ihrem Fehlerblock mit der Regelkennung. Verschluckt wird nichts.
 */
function explainAll(issues: readonly ValidationIssue[]): {
  issues: ExplainedIssue[];
  unexplained: ValidationIssue[];
} {
  const explained: ExplainedIssue[] = [];
  const unexplained: ValidationIssue[] = [];
  for (const issue of issues) {
    try {
      explained.push(explainIssue(issue));
    } catch {
      unexplained.push(issue);
    }
  }
  return { issues: explained, unexplained };
}

/**
 * Komponiert die Spec. Ungültige Kombinationen kommen als erklärte Regelliste zurück, alles
 * andere fliegt weiter — die Insel macht daraus einen sichtbaren Fehlerblock (Spec §7).
 */
export function evaluateSpec(spec: SymbolSpec): SpecEvaluation {
  try {
    return { ok: true, drawing: composeFromCatalog(spec) };
  } catch (error) {
    if (error instanceof CompositionError) return { ok: false, ...explainAll(error.issues) };
    throw error;
  }
}

/* --- Welche Werte gerade zusammenpassen -------------------------------------------------- */

/**
 * Die beiden Achsen, die eine Liste tragen. Explizit aufgezählt statt aus dem aktuellen Wert
 * geraten: ein noch leeres Feld trägt keinen Wert, aus dem sich das ablesen ließe.
 */
export const LIST_SPEC_FIELDS: readonly (keyof SymbolSpec)[] = ['capabilities', 'bodyMarks'];

export interface AllowedValue {
  value: string;
  ok: boolean;
  /** Erklärte Regeln, wenn die Komposition den Wert ablehnt. Leer, wenn sie ganz abbricht. */
  issues: ExplainedIssue[];
  /** Klartext, warum der Wert gerade nicht geht. Fehlt genau dann, wenn `ok` gilt. */
  reason?: string;
}

const NO_MEASURED_VERSION =
  'Für diesen Wert führt der Katalog an dieser Grundzeichenart keine vermessene Fassung. ' +
  'Im Original heißt das:';

/**
 * Probiert jeden Kandidaten an der aktuellen Spec aus und sagt, ob er zusammenpasst.
 *
 * Es gibt im Projekt keine Funktion „erlaubte Werte je Feld", und sie ließe sich auch nicht
 * ehrlich schreiben: ob eine Kombination trägt, hängt an vermessenen Fassungen, Profilen und
 * Zonen, und das weiß erst die Komposition. Also wird jeder Kandidat einmal komponiert. Das ist
 * billiger, als es klingt — alle elf Felder mit zusammen 247 Kandidaten brauchen 9,7 ms kalt und
 * 3,4 ms warm (gemessen am 29.08.2026).
 *
 * **Keine Vorprüfung mit `validateSpec`.** Sie wäre schneller, aber falsch: ohne den Kontext aus
 * aufgelöster Funktionsfassung und Verwaltungskopf, den `compose()` aus den Ports baut, prüft
 * `validateSpec(spec)` *anders* — sie könnte einen Wert ablehnen, den die Komposition annimmt,
 * und die Auswahl sperrte etwas Gültiges.
 *
 * **Der gerade gesetzte Wert wird nie gesperrt.** Ihn zu sperren hieße, die eigene Auswahl
 * unbedienbar zu machen, sobald die Spec aus einem *anderen* Grund nicht trägt — und ein
 * gesperrter Eintrag, der zugleich der ausgewählte ist, wird von Browsern verschieden
 * dargestellt. Verloren geht dabei nichts: warum die Spec nicht trägt, steht vollständig in der
 * Regelliste unter der Vorschau.
 */
export function allowedValues(
  spec: SymbolSpec,
  field: keyof SymbolSpec,
  candidates: readonly string[],
): AllowedValue[] {
  const current = spec[field];
  const isList = LIST_SPEC_FIELDS.includes(field);
  const selected: readonly string[] = isList
    ? Array.isArray(current)
      ? (current as readonly string[])
      : []
    : typeof current === 'string'
      ? [current]
      : [];

  return candidates.map((value) => {
    if (selected.includes(value)) return { value, ok: true, issues: [] };
    // Listenfelder prüfen den Kandidaten **zusätzlich** zur bestehenden Auswahl: gefragt ist,
    // ob er sich anfügen lässt, nicht ob er allein trüge.
    const candidateSpec = reduceSpec(spec, {
      field,
      value: isList ? [...selected, value] : value,
    });
    try {
      const result = evaluateSpec(candidateSpec);
      if (result.ok) return { value, ok: true, issues: [] };
      const first = result.issues[0];
      const reason =
        first !== undefined
          ? `${first.title}: ${first.explanation}`
          : (result.unexplained[0]?.message ?? 'Diese Kombination trägt nicht.');
      return { value, ok: false, issues: result.issues, reason };
    } catch (error) {
      // Ein Abbruch statt einer Regel — meist eine Kennung ohne vermessene Fassung. Der Wert
      // gehört genauso gesperrt, nur mit anderer Begründung. Die Originalmeldung bleibt stehen,
      // ihr geht aber ein Satz voran, der ohne Kenntnis des Katalogs verständlich ist.
      const message = error instanceof Error ? error.message : String(error);
      return { value, ok: false, issues: [], reason: `${NO_MEASURED_VERSION} ${message}` };
    }
  });
}

/* --- URL-Zustand ------------------------------------------------------------------------- */

const SPEC_HINT =
  'Der Parameter `spec` in der URL lässt sich nicht lesen. Er muss eine base64url-kodierte ' +
  'SymbolSpec im JSON-Format sein — am einfachsten aus einem geteilten Builder-Link.';

/**
 * `btoa` nimmt nur Latin-1; `designation` trägt Umlaute. Also erst UTF-8-Bytes, dann base64, dann
 * die URL-sichere Zeichenauswahl ohne Füllzeichen.
 */
export function encodeSpec(spec: SymbolSpec): string {
  const bytes = new TextEncoder().encode(JSON.stringify(spec));
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '');
}

/** Umkehrung von `encodeSpec`. Wirft mit Klartext, statt still auf eine leere Spec zu fallen. */
export function decodeSpec(param: string): SymbolSpec {
  let parsed: unknown;
  try {
    const padded = param.replaceAll('-', '+').replaceAll('_', '/');
    const binary = atob(padded.padEnd(Math.ceil(padded.length / 4) * 4, '='));
    const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
    parsed = JSON.parse(new TextDecoder().decode(bytes));
  } catch (error) {
    throw new Error(`${SPEC_HINT} (${(error as Error).message})`);
  }
  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    throw new Error(`${SPEC_HINT} Gelesen wurde stattdessen: ${JSON.stringify(parsed)}.`);
  }
  if (typeof (parsed as { kind?: unknown }).kind !== 'string') {
    throw new Error(`${SPEC_HINT} Es fehlt das Pflichtfeld \`kind\`.`);
  }
  return parsed as SymbolSpec;
}
