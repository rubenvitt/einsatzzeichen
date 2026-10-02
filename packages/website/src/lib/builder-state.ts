import {
  CompositionError,
  LIST_SPEC_FIELDS,
  SPEC_FIELD_VALUES,
  decodeSpecParam,
  drawSymbol,
  encodeSpecParam,
  vocabulary,
  type NotMeasuredScope,
  type SpecFieldValue,
  type ValidationIssue,
  type VocabularyField,
} from '@einsatzzeichen/core';
import type { Drawing, SymbolSpec } from '@einsatzzeichen/schema';
import { explainIssue, type ExplainedIssue } from './rule-explanations.js';

/**
 * Der Zustand des Builders (Spec §5.4): eine `SymbolSpec` ändern, das Ergebnis beurteilen und die
 * Spec in die URL schreiben. Reine Funktionen — die Insel hält nur den React-State.
 *
 * Gezeichnet wird seit LFH-580 mit `drawSymbol()` aus `core` — ohne Prüfpaket im Browserbündel.
 *
 * **Warum `drawSymbol` und nicht `validateSpec`.** `validateSpec(spec, context)` liest
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
 * Leerer Text, leere Liste und `undefined` bedeuten „nicht gesetzt": ein `designation: ''` wäre
 * eine leere Beschriftung statt gar keiner, und ein `bodyMarks: []` eine leere Marken-Liste statt
 * keiner — beides sagt etwas anderes aus als das Weglassen des Feldes und ergäbe eine Spec, die
 * so nie in einem Rezept steht.
 *
 * Steht einmal hier, weil zwei Stellen dieselbe Grenze ziehen müssen: `reduceSpec` entfernt
 * danach ein Feld, `issuesByField` verschweigt danach einen Hinweis. Liefen sie auseinander,
 * hinge ein Hinweis an einem Feld, das die Spec gar nicht mehr trägt.
 */
function isUnset(value: unknown): boolean {
  return value === undefined || value === '' || (Array.isArray(value) && value.length === 0);
}

/** Ein Feld setzen oder entfernen; was „nicht gesetzt" heißt, steht bei `isUnset`. */
export function reduceSpec(spec: SymbolSpec, action: SpecAction): SymbolSpec {
  const next: Record<string, unknown> = { ...spec };
  if (isUnset(action.value)) delete next[action.field];
  else next[action.field] = action.value;
  // Über `unknown`, und das ist keine Schlamperei: der Wert kommt aus einem Formularfeld und ist
  // hier ehrlich `unknown`; ob er zur Achse passt, entscheidet `compose()` und niemand sonst.
  // Auch das Pflichtfeld `kind` lässt sich so entfernen — dann bricht `compose()` sichtbar ab,
  // statt dass diese Funktion eine Gültigkeit behauptet, die sie nicht geprüft hat.
  return next as unknown as SymbolSpec;
}

/**
 * Die Beschriftungszonen, die der Baukasten als Freitext anbietet, in Lesereihenfolge: erst im
 * Körper, dann außerhalb. Die Metriksätze und Grundlinien-Overrides von `BodyLabels` bleiben
 * Sache der Rezepte; der Baukasten setzt nur Texte, die Lage leitet der Motor ab.
 */
export const LABEL_ZONES = [
  'center',
  'topLeft',
  'bottomLeft',
  'bottomCenter',
  'bottomRight',
  'aboveLeft',
  'belowRight',
  'surfaceBelowLeft',
  'surfaceBelowRight',
] as const;

export type LabelZone = (typeof LABEL_ZONES)[number];

/**
 * Einen Lauf in `labels` setzen oder entfernen. Leerer Text entfernt die Zone; ohne Zone fällt
 * das ganze Feld `labels` weg, damit die Spec dieselbe bleibt wie ohne Beschriftung. Andere
 * Schlüssel in `labels` (etwa Metriken aus einem geladenen Rezept) bleiben stehen.
 */
export function reduceLabel(spec: SymbolSpec, zone: LabelZone, value: string): SymbolSpec {
  const labels: Record<string, unknown> = { ...(spec.labels ?? {}) };
  if (isUnset(value)) delete labels[zone];
  else labels[zone] = value;
  const next: Record<string, unknown> = { ...spec };
  if (LABEL_ZONES.some((candidate) => labels[candidate] !== undefined)) next.labels = labels;
  else delete next.labels;
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
    return { ok: true, drawing: drawSymbol(spec) };
  } catch (error) {
    if (error instanceof CompositionError) return { ok: false, ...explainAll(error.issues) };
    throw error;
  }
}

/* --- Welche Werte gerade zusammenpassen -------------------------------------------------- */

/**
 * Die beiden Achsen, die eine Liste tragen — seit LFH-578 aus `core`, wo sie aus dem Wertevorrat
 * je Feld (`SPEC_FIELD_VALUES`) abgeleitet sind. Der Name bleibt, damit die Importe stehen.
 */
export { LIST_SPEC_FIELDS };

export type BlockedValue =
  /** Eine Regel hat abgelehnt; `explanation` ist die Erklärung ihrer ersten Meldung. */
  | { because: 'rule'; explanation: string }
  /**
   * Der Katalog führt keine vermessene Fassung. `scope` kommt unverändert aus der Wurfstelle und
   * wird hier nicht erraten: `'combination'` heißt, eine andere Art oder Variante trägt den Wert
   * sehr wohl; `'value'` heißt, ihn trägt keine — der Rat „wähle eine andere Grundzeichenart"
   * wäre dann falsch.
   */
  | { because: 'not-measured'; detail: string; scope: NotMeasuredScope };

export interface AllowedValue {
  value: string;
  ok: boolean;
  /** Erklärte Regeln, wenn die Komposition den Wert ablehnt. Leer bei einer Vermessungslücke. */
  issues: ExplainedIssue[];
  /** Warum der Wert gerade nicht geht. Fehlt genau dann, wenn `ok` gilt. */
  blocked?: BlockedValue;
  /**
   * Der Wert lässt sich zeichnen, aber die Zeichnung trägt abgeleitete Teile
   * (`Drawing.derivations`, Entscheidung vom 2. Oktober 2026): kein Original belegt diese
   * Zusammenstellung. Unverändert aus `vocabulary()` (`derived: true`); steht nur, wenn es gilt,
   * damit ein vermessener Wert dieselbe Form behält wie vorher.
   */
  derived?: true;
}

/**
 * Probiert jeden Kandidaten an der aktuellen Spec aus und sagt, ob er zusammenpasst.
 *
 * **Gerechnet wird in `core`** (`vocabulary()`, LFH-578). Bis dahin stand die Probe hier; seit
 * die Regeltexte und das Vokabular zur API gehören (LFH-561), ist der Baukasten ein Konsument und
 * übersetzt nur noch in die Form, die die Insel liest. Die Gründe für den Weg — jeder Kandidat
 * wird über `drawSymbol()` gezeichnet, keine Vorprüfung mit einem nackten `validateSpec`, ein
 * Programmfehler fliegt weiter statt als Vermessungslücke zu erscheinen — stehen jetzt dort.
 * Gemessen am 29.09.2026 (Node 22, Vitest): alle elf Felder mit dem vollen Vorrat aus `core`,
 * zusammen 316 Kandidaten, brauchen an der nackten Formation 7,8 ms kalt und rund 4 ms warm. Mit
 * Verband, Zustand und Tendenz (LFH-577) sind es 14 Felder und 383 Kandidaten: 8,8 ms kalt und
 * rund 2,6 ms warm (am selben Tag, Node 26, tsx).
 *
 * Kandidaten außerhalb des Wertevorrats lehnt `core` mit einem `RangeError` ab; die Liste kommt
 * aus `builderVocabulary()`, die denselben Vorrat liest (ein Test hält beide in Deckung).
 *
 * **Der gerade gesetzte Wert wird nie gesperrt.** `core` gibt ihm `selected: true` und den Befund
 * der Spec, wie sie ist — trägt sie aus einem anderen Grund nicht, stünde er dort gesperrt. Ihn
 * hier zu sperren hieße, die eigene Auswahl unbedienbar zu machen, und ein gesperrter Eintrag,
 * der zugleich der ausgewählte ist, wird von Browsern verschieden dargestellt. Verloren geht dabei
 * nichts: warum die Spec nicht trägt, steht vollständig in der Regelliste unter der Vorschau.
 *
 * **Abgeleitet heißt zeichenbar.** Ein Wert, mit dem die Zeichnung abgeleitete Teile trägt, ist
 * frei (`ok: true`) und trägt zusätzlich `derived: true`. Ob die Insel das anzeigt, entscheidet sie
 * gegen die Spec, zu der die Probe gehört (`derivedMarker()` in `builder-vocabulary.ts`).
 */
export function allowedValues(
  spec: SymbolSpec,
  field: keyof SymbolSpec,
  candidates: readonly string[],
): AllowedValue[] {
  if (candidates.length === 0) return [];
  // Die Umwandlung gehört hierher und nicht nach `core`: Feld und Kandidaten kommen aus dem
  // Vokabular des Snapshots und sind in der Insel nur `string`. `core` prüft zur Laufzeit trotzdem
  // jeden Kandidaten gegen den Wertevorrat und wirft sonst einen `RangeError`.
  const options = {
    candidates: candidates as readonly SpecFieldValue<VocabularyField>[],
  };
  return vocabulary(spec, field as VocabularyField, options).map((option) => {
    const { value } = option;
    if (option.status === 'allowed') {
      return option.derived === true
        ? { value, ok: true, issues: [], derived: true }
        : { value, ok: true, issues: [] };
    }
    if (option.selected) return { value, ok: true, issues: [] };
    if (option.reason === 'not-measured') {
      // Die Originalmeldung wandert nach `detail` und **nicht** in den Tooltip: sie spricht die
      // Sprache des Motors und nennt Kennungen (`"vehicle-land"`, Radplätze, Kopfzone). Bis zum
      // 2. Oktober 2026 traf das 39 von 64 Körpermarken; seitdem sind die Lücken selten, die
      // Meldung bleibt aber dieselbe Art Text. Den lesbaren Satz baut die Insel aus den
      // Bezeichnungen.
      return {
        value,
        ok: false,
        issues: [],
        blocked: { because: 'not-measured', detail: option.message, scope: option.scope },
      };
    }
    const first = option.issues[0];
    const explanation =
      first !== undefined ? `${first.title}: ${first.explanation}` : 'Diese Kombination trägt nicht.';
    return { value, ok: false, issues: option.issues, blocked: { because: 'rule', explanation } };
  });
}

/* --- Wo eine Meldung ans Formular gehört -------------------------------------------------- */

/**
 * Ordnet die Meldungen der aktuellen Spec den Feldern zu, an denen sie am Formular sichtbar
 * werden sollen — Feldname → Meldungen, in der Reihenfolge der Eingabeliste.
 *
 * **Das Gegenstück zur Sperre, nicht ihre Erweiterung.** `allowedValues()` beantwortet „taugt
 * dieser *Kandidat*?" und sperrt den gesetzten Wert bewusst nie (siehe dort). Hier geht es um die
 * andere Frage: „ist der *gesetzte* Wert die Stelle, über die eine Regel spricht?" Die Antwort
 * **weist hin und sperrt nicht** — ungültig ist die Kombination und nicht das Feld allein, und wer
 * die Auswahl sperrte, machte die eigene Eingabe unbedienbar.
 *
 * **Die Zuordnung ist kuratiert, nicht geraten.** Sie kommt aus `ExplainedIssue.field`, also aus
 * der Tabelle in `rule-explanations.ts` („das Feld, das die Leserin ändern müsste, damit die Regel
 * nicht mehr greift"), und die ist in beide Richtungen gegattert. Aus der Rohmeldung ließe sie
 * sich nicht bauen: `ValidationIssue` trägt nur `rule` und `message` und keinen Pfad — jeder
 * Textvergleich auf der Meldung wäre Raten.
 *
 * **Drei gemessene Grenzen (Stand 02.10.2026), damit später niemand einen Fehler meldet, wo
 * keiner ist.** (1) 28 der 50 Erklärungen aus `validate.ts` zeigen auf `labels`. Seit dem
 * 2. Oktober 2026 hat der Baukasten dafür Freitextfelder je Zone (`LABEL_ZONES`); die Hinweise
 * stehen gesammelt unter ihnen, nicht am einzelnen Feld, weil eine Regel die Zone nicht nennt.
 * (2) `kind`, `organization` und
 * `capabilities` tragen **null** Erklärungen, `bodyMarks` eine. Seit dem 2. Oktober 2026 leitet
 * der Motor Lücken ab, statt sie zu sperren (`docs/decisions/2026-10-02-ableiten-statt-messsperre.md`);
 * die Messsperren-Regeln, die bis dahin auf `organization` und `capabilities` zeigten
 * (`reduced-house-requires-hilfsorganisation`, `circle-12-requires-*`,
 * `capabilities-pictogram-*`), gibt es nicht mehr. Was danach noch scheitert, ohne dass eine
 * Regel greift, kommt als Vermessungslücke (`state: 'crash'`) und nicht als `issues` an. (3) Wo
 * eine Regel zwei Felder gegeneinander stellt (`technical-fill-organization-conflict`), zeigt der
 * Hinweis nur an dem Feld, auf das die Erklärung zeigt — an `technicalFill`, nicht an
 * `organization`. Der Wortlaut am Feld darf deshalb nicht „dieser Wert ist falsch" sagen,
 * sondern muss auf die vollständige Regelliste verweisen.
 *
 * **Übersprungen wird zweierlei.** `'composition'`, weil diese Regeln per Definition kein
 * einzelnes Feld benennen. Und jedes Feld, das die Spec **nicht gesetzt** hat — auch dann, wenn
 * eine Regel darauf zeigt. Bis zum 2. Oktober 2026 traf das 134 Einzelfeld-Kombinationen, alle
 * über die Messsperren am 12-mm-Kreis und an der reduzierten Hauskontur, die eine Organisation
 * verlangten. Seitdem zeigt keine der verbleibenden Regeln an einer Einzelfeld-Kombination auf
 * ein leeres Feld (nachgezählt über alle Grundzeichenarten × Felder des Baukastens). Die Grenze
 * bleibt trotzdem, weil `ExplainedIssue` nicht sagt, ob die Regel eine Angabe *verlangt* oder
 * die gesetzte *ablehnt*: an einer leeren Auswahl ließe sich nur ein geratener Satz
 * hinschreiben. Solche Regeln stehen vollständig in der Liste unter der Vorschau, wo ihre
 * Erklärung den Unterschied selbst ausspricht. Wer den Hinweis später auf fehlende Angaben
 * ausweiten will, braucht dafür ein eigenes Merkmal an der Erklärung — keine zweite Lesart
 * derselben Daten.
 */
export function issuesByField(
  issues: readonly ExplainedIssue[],
  spec: SymbolSpec,
): Map<keyof SymbolSpec, ExplainedIssue[]> {
  const byField = new Map<keyof SymbolSpec, ExplainedIssue[]>();
  for (const issue of issues) {
    if (!isSymbolSpecField(issue.field)) continue;
    if (isUnset(spec[issue.field])) continue;
    const bucket = byField.get(issue.field);
    if (bucket === undefined) byField.set(issue.field, [issue]);
    else bucket.push(issue);
  }
  return byField;
}

/**
 * Ob eine Erklärung auf ein Feld der `SymbolSpec` zeigt. Seit die freistehenden Zeichen eine eigene
 * Spec-Art bekommen (LFH-577), kann `ExplainedIssue.field` auch deren Felder nennen (`path`,
 * `line`, …); der Baukasten baut nur `SymbolSpec` und hat für jene kein Formularfeld. Geprüft wird
 * gegen `SPEC_FIELD_VALUES`, die über alle Schlüssel der `SymbolSpec` vollständige Tabelle aus
 * `core` — keine zweite Feldliste hier. `'composition'` steht dort nicht und fällt damit ebenfalls
 * heraus.
 */
function isSymbolSpecField(field: ExplainedIssue['field']): field is keyof SymbolSpec {
  return Object.hasOwn(SPEC_FIELD_VALUES, field);
}

/* --- URL-Zustand ------------------------------------------------------------------------- */

/**
 * Die URL-Form aus `core` (`encodeSpecParam`, LFH-577): base64url über das kanonische JSON in der
 * Hülle `{"v":1,"spec":{…}}`. Kanonisch heißt auch: was `decodeSpec` nicht wieder läse, wird gar
 * nicht erst geschrieben (`SpecParseError`).
 */
export function encodeSpec(spec: SymbolSpec): string {
  return encodeSpecParam(spec);
}

/**
 * Umkehrung von `encodeSpec`, streng: liest die Hülle und die Links von vor LFH-577 (rohes JSON
 * ohne Hülle), lehnt aber unbekannte Felder, Werte außerhalb der Wertelisten und falsche Typen ab.
 * Bis LFH-578 prüfte diese Funktion nur, ob `kind` eine Zeichenkette ist — ein Tippfehler wie
 * `organisation` rutschte still durch, und das Zeichen stand anders da als gemeint.
 *
 * Wirft `SpecParseError` mit Pfad (`path`) und Meldung ohne Pfad (`reason`); die Insel fängt ihn
 * an der Klasse und zeigt ihn als Hinweis mit aufklappbaren Einzelheiten.
 */
export function decodeSpec(param: string): SymbolSpec {
  return decodeSpecParam(param);
}
