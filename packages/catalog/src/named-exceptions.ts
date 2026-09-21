import type { BodyLabels } from '@einsatzzeichen/schema';
import { deepFreeze, type DeepReadonly } from '@einsatzzeichen/core';
import type { GRAMMAR_FIXTURES } from './recipes.js';

/**
 * **Benannte Ausnahmen der Grammatik-Fixtures** (LFH-569).
 *
 * Die Scope-Entscheidung vom 13. September 2026 verlangt wörtlich: „Je Zeichen gemessene
 * Sonderwerte (etwa die einzeln gemessenen Schriftgrade des mittigen Laufs in Anhang E) werden
 * entweder zur Regel oder bleiben als benannte Ausnahme sichtbar — nie als stiller Sonderpfad."
 * Diese Liste ist die zweite Hälfte dieses Satzes. Sie wandelt keinen Wert in eine Regel um; das
 * geht je Feld nur mit einem Eingriff in `compose.ts` und ist ein Folgeticket.
 *
 * Gebaut nach dem Muster von `CONTRAST_EXCEPTIONS` und `INVENTORY_EXCLUSIONS`: ein Datum im Paket
 * statt einer Zeile im Test, und ein Gate in beide Richtungen (`named-exceptions.test.ts`). Jeder
 * Sonderwert jeder Fixture muss hier mit gleichem Wert stehen, und kein Eintrag darf auf einen Wert
 * zeigen, den die Fixture nicht mehr trägt.
 *
 * ## Abgrenzung: Sonderwert oder Eingabe
 *
 * Maßstab: **Ein Feld aus `BodyLabels` ist ein Sonderwert, wenn es einen Wert überschreibt, den
 * der Motor sonst aus Konstante, Profil oder Regel ableitet, und wenn es für ein einzelnes Zeichen
 * festgelegt ist.** Inhalte und Darstellungsschalter sind Eingabe.
 *
 * Sonderwerte (`SPECIAL_VALUE_FIELDS`, acht Felder):
 *
 * - `centerCapHeightMm` überschreibt den Normgrad 4,87 mm aus `compose.ts`.
 * - `centerBaselineFromBodyBottomMm` überschreibt die Grundlinie des Körperprofils.
 * - `centerAnchorFromBodyLeftMm` überschreibt den mittigen Anker auf der Körpermitte.
 * - `centerBoxMarginMm` überschreibt den globalen 1-mm-Rand. Nach eigenem Feldkommentar ist das
 *   „keine Quellmessung und kein Auto-Fit", also eine Modellierungsentscheidung je Zeichen. Gerade
 *   deshalb steht der Wert hier: sonst wäre diese Entscheidung unsichtbar.
 * - `topLeftMetrics`, `aboveLeftMetrics` und `bottomRightMetrics` überschreiben die vermessenen
 *   Profildefaults ihrer Zone als vollständiger Satz.
 * - `inBodyInk` überschreibt die aus der Körperfüllung abgeleitete Tinte (`bodyLabelInk()`). Der
 *   Feldkommentar nennt sie „an der Quelle vermessene Tinte", das technische Review von Anhang N
 *   spricht vom „gemessenen inBodyInk-Vertrag".
 *
 * Eingabe (`INPUT_FIELDS`), bewusst **nicht** gelistet:
 *
 * - die Beschriftungstexte `center`, `bottomLeft`, `bottomCenter`, `bottomRight`, `topLeft`,
 *   `aboveLeft`, `belowRight`, `surfaceBelowLeft` und `surfaceBelowRight`. Sie sind der Inhalt
 *   des Zeichens und kein Maß.
 * - `topLeftLines`. Der Wert ist ebenfalls Text, nur als Paar (`['GW-San', '50']`). Den
 *   kleineren, gemeinsam vermessenen Schriftgrad trägt das Körperprofil, nicht das Rezept.
 * - `accessibilityMode`. Der Schalter wählt nur das Vokabular der Beschreibung („Opt-in für
 *   quellenoffene Läufe, deren fachliche Rolle nicht belegt ist"). Er überschreibt keine
 *   abgeleitete Geometrie und keine Farbe.
 *
 * Das Gate prüft auch diese Abgrenzung. Jedes Feld aus `BodyLabels` gehört genau einer der beiden
 * Mengen an, zur Übersetzungszeit über den Typ und zur Laufzeit über alle 242 Fixtures. Ein später
 * hinzugefügtes Feld fällt deshalb auf. Es kann nicht still weder gelistet noch ausgenommen sein.
 *
 * ## Herkunft der Einträge
 *
 * Die Menge ist zur Laufzeit gezählt: 50 Einträge an 37 Fixtures. Sie ist nicht per Textsuche
 * geschätzt. Das betrifft vor allem I.2.1 bis I.2.3: sie teilen die Konstante
 * `I_2_TOP_LEFT_METRICS`, die eine Suche nach Zahlen nicht findet. Die Werte stehen hier
 * trotzdem als Literale. Nur so prüft das Gate eine Gleichheit und nicht die Fixture gegen sich
 * selbst.
 *
 * `foundAt` ist die Zeile, in der die Fixture das Feld setzt. `rationale` ist die Begründung, die
 * am Fundort oder am Feld steht. Sie ist übernommen und nicht erfunden, und `rationaleAt` nennt,
 * wo sie steht. Wo der Fundort **keine** Begründung trägt, sagt der Eintrag das ausdrücklich und
 * verweist auf den Test, der den Wert festhält. Auch das ist ein Befund.
 */

/** Felder aus `BodyLabels`, die je Fixture einen abgeleiteten Wert überschreiben. */
export const SPECIAL_VALUE_FIELDS = [
  'centerCapHeightMm',
  'centerBaselineFromBodyBottomMm',
  'centerAnchorFromBodyLeftMm',
  'centerBoxMarginMm',
  'topLeftMetrics',
  'aboveLeftMetrics',
  'bottomRightMetrics',
  'inBodyInk',
] as const satisfies readonly (keyof BodyLabels)[];

/** Felder aus `BodyLabels`, die Eingabe sind: Texte und der Beschreibungsschalter. */
export const INPUT_FIELDS = [
  'center',
  'bottomLeft',
  'bottomCenter',
  'bottomRight',
  'topLeft',
  'aboveLeft',
  'belowRight',
  'surfaceBelowLeft',
  'surfaceBelowRight',
  'topLeftLines',
  'accessibilityMode',
] as const satisfies readonly (keyof BodyLabels)[];

export type SpecialValueField = (typeof SPECIAL_VALUE_FIELDS)[number];
export type InputField = (typeof INPUT_FIELDS)[number];

/**
 * Übersetzungszeitliche Vollständigkeit der Abgrenzung: jedes Feld aus `BodyLabels` ist entweder
 * Sonderwert oder Eingabe, keines beides. Ein neues Feld bricht hier den Build.
 */
type Unclassified = Exclude<keyof BodyLabels, SpecialValueField | InputField>;
type DoublyClassified = Extract<SpecialValueField, InputField>;
const CLASSIFICATION_IS_COMPLETE: [Unclassified, DoublyClassified] extends [never, never]
  ? true
  : never = true;
void CLASSIFICATION_IS_COMPLETE;

export type GrammarFixtureKey = keyof typeof GRAMMAR_FIXTURES;

interface NamedExceptionOf<Field extends SpecialValueField> {
  /** Schlüssel der Fixture in `GRAMMAR_FIXTURES`. */
  readonly fixture: GrammarFixtureKey;
  /** Feld aus `BodyLabels`. */
  readonly field: Field;
  /** Der Sonderwert, literal festgenagelt; das Gate vergleicht ihn tief mit der Fixture. */
  readonly value: NonNullable<BodyLabels[Field]>;
  /** Referenzabschnitt, an dem der Wert vermessen ist. */
  readonly section: string;
  /** Begründung, übernommen vom Fundort oder vom Feldkommentar. */
  readonly rationale: string;
  /**
   * Wo die Begründung steht: `pfad:zeile` oder `pfad:von–bis`, relativ zur Wurzel des Repos. In
   * `recipes.test.ts` steht statt einer Zeile der Testname, weil sich die Zeilen dort laufend
   * verschieben.
   */
  readonly rationaleAt: string;
  /** Zeile, in der die Fixture das Feld setzt, `pfad:zeile`, relativ zur Wurzel des Repos. */
  readonly foundAt: string;
}

/** Eine benannte Ausnahme: je (Fixture, Feld) genau ein Eintrag. */
export type NamedException = { [Field in SpecialValueField]: NamedExceptionOf<Field> }[SpecialValueField];

const E = 'packages/catalog/src/recipes-anhang-e.ts';
const F = 'packages/catalog/src/recipes-anhang-f.ts';
const I = 'packages/catalog/src/recipes-anhang-i.ts';
const N = 'packages/catalog/src/recipes-anhang-n.ts';
const TAXONOMY = 'packages/schema/src/taxonomy.ts';
const RECIPES_TEST = 'packages/catalog/src/recipes.test.ts';

function exception<Field extends SpecialValueField>(
  fixture: GrammarFixtureKey,
  field: Field,
  value: NonNullable<BodyLabels[Field]>,
  foundAt: string,
  rationale: string,
  rationaleAt: string,
): NamedExceptionOf<Field> {
  return { fixture, field, value, section: fixture, rationale, rationaleAt, foundAt };
}

// --- Gemeinsame Begründungen, je einmal übernommen -------------------------------------------

const E2_CAP_HEIGHT =
  'Anhang E.2 setzt seine mittigen Kürzel nicht durchgehend im Normgrad; neun Läufe sind kleiner ' +
  'gesetzt. „Es gibt keine Auslöseregel, und das ist gemessen, nicht offen": nur drei der neun ' +
  'bräuchten die Verkleinerung, eine Breitenschwelle ist widerlegt. Am 21.09.2026 als je-Zeichen-' +
  'Wert bestätigt (docs/decisions/2026-09-20-zonenmodell-als-daten.md, Punkt 6, Option A). ';
const E2_CAP_HEIGHT_AT = `${TAXONOMY}:703–722; ${E}:862–867`;

const F2_TOP_LEFT =
  'Drei gemeinsam erforderliche Quellenmaße für einen einzelnen topLeft-Lauf, am in Pfade ' +
  'umgewandelten Quellenlauf abgelesen; der Anker ist aus linker Tintenkante und Arimo-' +
  'Seitenlager zurückgerechnet. Kein Auto-Fit und keine Stilkennung. ';

const N_INK =
  'Schwarzer Quellenlauf im Körper statt der aus der Körperfüllung abgeleiteten Tinte; „die ' +
  'schwarzen Quellenläufe von N.1.2 bis N.1.5 werden über den gemessenen inBodyInk-Vertrag ' +
  'gerendert und bestehen den Kontrastvertrag ohne neue Ausnahme".';
const N_INK_AT = `${TAXONOMY}:554–559; packages/catalog/src/coverage-manifest.ts:388–390`;

const I_2_TOP_LEFT =
  'Kürzel oben links an I.2.1 bis I.2.3, an der Referenz abgelesen: Versalhöhe 2,919 mm (W, ' +
  'flachfüßig), Grundlinie 6,25 mm unter der Körperoberkante; Anker aus der Tintenkante des G ' +
  'abzüglich Arimo-Seitenlager zurückgerechnet (1,51 mm rechts der Körperkante). Geteilt über die ' +
  'Konstante I_2_TOP_LEFT_METRICS.';
const I_2_TOP_LEFT_AT = `${I}:263–273`;

const I_G_CENTER =
  'Der Textlauf steht auf y = 10,0 mm; seine „aus dem einzigen versalen S idealisierte" ' +
  'Versalhöhe beträgt 2,5 mm. Idealisiert, nicht als Einzelwert gemessen.';
const I_G_CENTER_AT = `${I}:198–204`;

const I_G_BOX_MARGIN =
  'Laut Feldkommentar „keine Quellmessung und kein Auto-Fit": die für den konkreten, bereits ' +
  'vermessenen Lauf „Strömungsrettung" erforderliche Ausgabebox, 0,5 mm statt des globalen ' +
  '1-mm-Rands. Modellierungsentscheidung je Zeichen.';
const I_G_BOX_MARGIN_AT = `${TAXONOMY}:573–577`;

const I_F_WITHOUT_RATIONALE =
  'Am Fundort ohne Begründung; der Teilslicekommentar sagt nur „vier literale Formationen". ' +
  'Festgehalten ist allein die Wirkung: Lauf „Öl" auf y = 10,55 mm mit Versalhöhe 3 mm.';
const I_F_WITHOUT_RATIONALE_AT = `${I}:144; ${RECIPES_TEST}, describe „Anhang I, Teilslice I-f (I.1.13 bis I.1.16)"`;

const I_5_ABOVE_LEFT =
  'Am Fundort nur als Teil der „drei Personenzeichen mit eigener 26-mm-Rautenfassung" ' +
  'eingeführt; der Test hält die „gemessene Above-left-Textlage" und die daraus abgeleitete ' +
  'Schriftgröße fest.';
const I_5_ABOVE_LEFT_AT = `${I}:505; ${RECIPES_TEST}, Test „%s hält die gemessene Above-left-Textlage fest"`;

/**
 * Alle benannten Ausnahmen der 242 Fixtures. Reihenfolge: je Anhang, darin je Fixture und Feld in
 * Quelltextreihenfolge.
 */
export const NAMED_EXCEPTIONS: DeepReadonly<NamedException[]> = deepFreeze<NamedException[]>([
  // --- Anhang E.2: gemessener Schriftgrad des mittigen Laufs --------------------------------
  exception('E.2.7', 'centerCapHeightMm', 4.3829, `${E}:1026`,
    E2_CAP_HEIGHT + 'Gemessen an der einzigen flachen Versalie des Laufs (T), 0,9001 des Normwerts.',
    `${E2_CAP_HEIGHT_AT}; ${E}:1008`),
  exception('E.2.8', 'centerCapHeightMm', 4.3826, `${E}:1042`,
    E2_CAP_HEIGHT + 'Gemessen an R (n = 1), 0,9000 des Normwerts.',
    `${E2_CAP_HEIGHT_AT}; ${E}:1029`),
  exception('E.2.12', 'centerCapHeightMm', 3.40995, `${E}:1113`,
    E2_CAP_HEIGHT + '0,7003 des Normwerts, einstimmig an M, W und L; ohne die Zahl treten 430 ' +
    'Tintenpixel aus der 28-mm-Box.',
    `${E2_CAP_HEIGHT_AT}; ${E}:1099`),
  exception('E.2.13', 'centerCapHeightMm', 3.40995, `${E}:1132`,
    E2_CAP_HEIGHT + '0,7002 des Normwerts, gemessen an fünf der sechs flachen Versalien.',
    `${E2_CAP_HEIGHT_AT}; ${E}:1116`),
  exception('E.2.16', 'centerCapHeightMm', 4.38273, `${E}:1201`,
    E2_CAP_HEIGHT + 'Mitte zweier eine Exportrundungsstufe auseinanderliegender Werte (L 4,382911; ' +
    'K, W 4,382558). Ohne die Zahl bleibt der Lauf in der Box und ist trotzdem 11 % zu groß.',
    `${E2_CAP_HEIGHT_AT}; ${E}:1183`),
  exception('E.2.17', 'centerCapHeightMm', 4.38273, `${E}:1219`,
    E2_CAP_HEIGHT + 'Dieselbe 2:2-Bindung wie E.2.16. Dieser Lauf widerlegt die Breitenschwelle: ' +
    'bei voller Größe bräuchte er 27,16 mm und passte in die 28-mm-Box.',
    `${E2_CAP_HEIGHT_AT}; ${E}:1204`),
  exception('E.2.19', 'centerCapHeightMm', 4.3829, `${E}:1255`,
    E2_CAP_HEIGHT + 'Gemessen an K und W; das F liegt eine Exportrundungsstufe darüber.',
    `${E2_CAP_HEIGHT_AT}; ${E}:1239`),
  exception('E.2.20', 'centerCapHeightMm', 3.65125, `${E}:1271`,
    E2_CAP_HEIGHT + '0,7498 des Normwerts, einstimmig an allen vier flachen Versalien.',
    `${E2_CAP_HEIGHT_AT}; ${E}:1258`),
  exception('E.2.21', 'centerCapHeightMm', 4.3826, `${E}:1286`,
    E2_CAP_HEIGHT + 'Einstimmig an M, K und W.',
    `${E2_CAP_HEIGHT_AT}; ${E}:1274`),

  // --- Anhang F.2: Metriksatz des Kürzels oben links -----------------------------------------
  exception('F.2.10', 'topLeftMetrics',
    { capHeightMm: 2.191447, baselineFromBodyTopMm: 5.249923, anchorFromBodyLeftMm: 0.51423 },
    `${F}:467`, F2_TOP_LEFT + 'Lauf BTKombi.', `${TAXONOMY}:627–651`),
  exception('F.2.11', 'topLeftMetrics',
    { capHeightMm: 2.191447, baselineFromBodyTopMm: 5.249923, anchorFromBodyLeftMm: 0.51423 },
    `${F}:485`, F2_TOP_LEFT + 'Lauf BTKombi, gleich F.2.10.', `${TAXONOMY}:627–651`),
  exception('F.2.12', 'topLeftMetrics',
    { capHeightMm: 2.919225, baselineFromBodyTopMm: 6.249691, anchorFromBodyLeftMm: 1.010503 },
    `${F}:503`, F2_TOP_LEFT + 'Lauf GwBT.', `${TAXONOMY}:627–651`),
  exception('F.2.13', 'topLeftMetrics',
    { capHeightMm: 2.919225, baselineFromBodyTopMm: 6.249691, anchorFromBodyLeftMm: 1.010503 },
    `${F}:522`, F2_TOP_LEFT + 'Lauf GwBT, gleich F.2.12.', `${TAXONOMY}:627–651`),
  exception('F.2.14', 'topLeftMetrics',
    { capHeightMm: 2.432746, baselineFromBodyTopMm: 5.249923, anchorFromBodyLeftMm: 1.009024 },
    `${F}:541`, F2_TOP_LEFT + 'Lauf GwLog.', `${TAXONOMY}:627–651`),
  exception('F.2.16', 'topLeftMetrics',
    { capHeightMm: 2.749893, baselineFromBodyTopMm: 6.749576, anchorFromBodyLeftMm: 1.497298 },
    `${F}:569`, F2_TOP_LEFT + 'Lauf 40.', `${TAXONOMY}:627–651`),
  exception('F.2.17', 'topLeftMetrics',
    { capHeightMm: 2.432746, baselineFromBodyTopMm: 5.749807, anchorFromBodyLeftMm: 0.766269 },
    `${F}:588`, F2_TOP_LEFT + 'Lauf BtlLKW.', `${TAXONOMY}:627–651`),

  // --- Anhang F.3: Kreisprofile, Metriksatz zwingend -----------------------------------------
  exception('F.3.3', 'topLeftMetrics',
    { capHeightMm: 2.919225, baselineFromBodyTopMm: 1.000254, anchorFromBodyLeftMm: -2.984684 },
    `${F}:650`,
    'Der Lauf „UHS" beginnt 2,984684 mm links der Kreis-Hüllenkante und ist deshalb nur mit ' +
    'seinem vollständigen, gegen die ViewBox geprüften Metriksatz belegt. An den F.3-Kreisprofilen ' +
    'ist der Override zwingend.',
    `${F}:757–759; ${TAXONOMY}:627–635`),
  exception('F.3.4', 'topLeftMetrics',
    { capHeightMm: 2.919225, baselineFromBodyTopMm: 1.000254, anchorFromBodyLeftMm: -2.984684 },
    `${F}:667`,
    'Derselbe außerhalb beginnende UHS-Lauf wie F.3.3.',
    `${F}:760–762; ${TAXONOMY}:627–635`),
  exception('F.3.5', 'topLeftMetrics',
    { capHeightMm: 2.749893, baselineFromBodyTopMm: -0.999746, anchorFromBodyLeftMm: -2.974002 },
    `${F}:685`,
    'Kreis um 2 mm abgesenkt; der teilweise oberhalb liegende Lauf „50" ist separat vermessen.',
    `${F}:763–765; ${TAXONOMY}:627–635`),
  exception('F.3.14', 'topLeftMetrics',
    { capHeightMm: 2.749893, baselineFromBodyTopMm: -0.999746, anchorFromBodyLeftMm: -2.974002 },
    `${F}:822`,
    'Kreis, Giebel und Lauf „500" verwenden dieselbe abgesenkte Fassung und denselben ' +
    'vollständigen Metriksatz wie der vermessene F.3.5-Beleg.',
    `${F}:885–887; ${TAXONOMY}:627–635`),

  // --- Anhang I.1: Formationen mit eigenem mittigen Lauf -------------------------------------
  exception('I.1.15', 'centerBaselineFromBodyBottomMm', 15.45, `${I}:176`,
    I_F_WITHOUT_RATIONALE, I_F_WITHOUT_RATIONALE_AT),
  exception('I.1.15', 'centerCapHeightMm', 3, `${I}:177`,
    I_F_WITHOUT_RATIONALE, I_F_WITHOUT_RATIONALE_AT),
  exception('I.1.16', 'centerBaselineFromBodyBottomMm', 15.45, `${I}:191`,
    I_F_WITHOUT_RATIONALE, I_F_WITHOUT_RATIONALE_AT),
  exception('I.1.16', 'centerCapHeightMm', 3, `${I}:192`,
    I_F_WITHOUT_RATIONALE, I_F_WITHOUT_RATIONALE_AT),
  exception('I.1.17', 'centerBaselineFromBodyBottomMm', 16, `${I}:219`,
    I_G_CENTER, I_G_CENTER_AT),
  exception('I.1.17', 'centerCapHeightMm', 2.5, `${I}:220`,
    I_G_CENTER, I_G_CENTER_AT),
  exception('I.1.17', 'centerBoxMarginMm', 0.5, `${I}:221`,
    I_G_BOX_MARGIN, I_G_BOX_MARGIN_AT),
  exception('I.1.18', 'centerBaselineFromBodyBottomMm', 16, `${I}:235`,
    I_G_CENTER, I_G_CENTER_AT),
  exception('I.1.18', 'centerCapHeightMm', 2.5, `${I}:236`,
    I_G_CENTER, I_G_CENTER_AT),
  exception('I.1.18', 'centerBoxMarginMm', 0.5, `${I}:237`,
    I_G_BOX_MARGIN, I_G_BOX_MARGIN_AT),

  // --- Anhang I.2: Wasserrettungs-Landfahrzeuge und -Anhänger --------------------------------
  exception('I.2.1', 'topLeftMetrics',
    { capHeightMm: 2.919, baselineFromBodyTopMm: 6.25, anchorFromBodyLeftMm: 1.51 },
    `${I}:287`, I_2_TOP_LEFT, I_2_TOP_LEFT_AT),
  exception('I.2.2', 'topLeftMetrics',
    { capHeightMm: 2.919, baselineFromBodyTopMm: 6.25, anchorFromBodyLeftMm: 1.51 },
    `${I}:298`, I_2_TOP_LEFT, I_2_TOP_LEFT_AT),
  exception('I.2.3', 'topLeftMetrics',
    { capHeightMm: 2.919, baselineFromBodyTopMm: 6.25, anchorFromBodyLeftMm: 1.51 },
    `${I}:309`, I_2_TOP_LEFT, I_2_TOP_LEFT_AT),
  exception('I.2.5', 'centerAnchorFromBodyLeftMm', 8.24, `${I}:331`,
    'Quellenspezifischer x-Anker des Laufs „Tauchen"; der Test nennt ihn „aus der Quelle ' +
    'gemessen" (absolut x = 12,24 mm). validateSpec() akzeptiert ihn nur an dem Profil, das ' +
    'genau diesen Anker vermessen hat.',
    `${RECIPES_TEST}, Test „setzt I.2.5s Tauchen-Lauf auf den aus der Quelle gemessenen Anker x = 12,24 mm"; ${TAXONOMY}:562–566`),
  exception('I.2.5', 'centerBaselineFromBodyBottomMm', 14.5, `${I}:332`,
    'Am Fundort ohne Begründung; festgehalten ist allein die Wirkung (Grundlinie y = 11,5 mm).',
    `${RECIPES_TEST}, Test „setzt I.2.5s Tauchen-Lauf auf den aus der Quelle gemessenen Anker x = 12,24 mm"`),
  exception('I.2.5', 'centerCapHeightMm', 2.919, `${I}:333`,
    'Am Fundort ohne Begründung; festgehalten ist allein die Wirkung (Schriftgröße aus ' +
    'Versalhöhe 2,919 mm). Derselbe Wert wie I_2_TOP_LEFT_METRICS.',
    `${RECIPES_TEST}, Test „setzt I.2.5s Tauchen-Lauf auf den aus der Quelle gemessenen Anker x = 12,24 mm"`),
  exception('I.2.6', 'centerBaselineFromBodyBottomMm', 14.327, `${I}:346`,
    'Am Fundort ohne Begründung und ohne eigenen Wirkungstest.',
    `${I}:337–350`),
  exception('I.2.6', 'centerCapHeightMm', 2.191447, `${I}:347`,
    'Am Fundort ohne Begründung. Derselbe Wert wie der BTKombi-Lauf von F.2.10/F.2.11.',
    `${I}:337–350`),

  // --- Anhang I.3 und I.5 ---------------------------------------------------------------------
  exception('I.3.2', 'centerCapHeightMm', 4.1395, `${I}:380`,
    'Am Fundort ohne Begründung; der Test nennt sie die „einzigartige Schlauchboot-Kappenhöhe" ' +
    'und hält fest, dass die übrigen I.3-Läufe keine Kappenüberschreibung tragen.',
    `${RECIPES_TEST}, Test „hält die einzigartige Schlauchboot-Kappenhöhe und die sonst fehlenden Kappenüberschreibungen fest"`),
  exception('I.5.2', 'aboveLeftMetrics',
    { capHeightMm: 2.432746, anchorFromBodyLeftMm: -2, baselineFromBodyTopMm: -1.5 },
    `${I}:526`, I_5_ABOVE_LEFT, I_5_ABOVE_LEFT_AT),
  exception('I.5.3', 'aboveLeftMetrics',
    { capHeightMm: 2.919225, anchorFromBodyLeftMm: -2, baselineFromBodyTopMm: -1 },
    `${I}:544`, I_5_ABOVE_LEFT, I_5_ABOVE_LEFT_AT),

  // --- Anhang N: Fahrzeuge weiterer Träger ----------------------------------------------------
  exception('N.1.2', 'inBodyInk', 'schwarz', `${N}:31`, N_INK, N_INK_AT),
  exception('N.1.3', 'inBodyInk', 'schwarz', `${N}:45`, N_INK, N_INK_AT),
  exception('N.1.3', 'centerBaselineFromBodyBottomMm', 6.5, `${N}:47`,
    'Am Fundort ohne Begründung; der Anhangskommentar nennt nur die vermessenen ' +
    'Organisationsfarben.',
    `${N}:3–8`),
  exception('N.1.4', 'inBodyInk', 'schwarz', `${N}:61`, N_INK, N_INK_AT),
  exception('N.1.4', 'aboveLeftMetrics',
    { capHeightMm: 2.919225, baselineFromBodyTopMm: -1, anchorFromBodyLeftMm: -0.01 },
    `${N}:63`,
    'Am Fundort ohne Begründung. Laut Feldkommentar müssen Anker und abgeleitete Textbox in ' +
    'Profilbox und 32-mm-ViewBox bleiben.',
    `${N}:3–8; ${TAXONOMY}:663–665`),
  exception('N.1.4', 'bottomRightMetrics',
    {
      capHeightMm: 2.750245,
      baselineFromBodyTopMm: 13.000087,
      anchorFromBodyLeftMm: 21.99,
      boxLeftFromBodyLeftMm: 19.24,
      boxWidthMm: 5.5,
    },
    `${N}:69`,
    'Am Fundort ohne Begründung. Laut Feldkommentar ein „vollständiger, körperrelativer ' +
    'Metriksatz für einen einzeln vermessenen bottomRight-Lauf".',
    `${N}:3–8; ${TAXONOMY}:591–594`),
  exception('N.1.5', 'inBodyInk', 'schwarz', `${N}:90`, N_INK, N_INK_AT),
  exception('N.1.5', 'topLeftMetrics',
    { capHeightMm: 2.919225, baselineFromBodyTopMm: 7, anchorFromBodyLeftMm: 5.99 },
    `${N}:92`,
    '„Am Festflügel-Luftfahrzeug ist der vollständige Satz zwingend; dort ist kein unabhängiger ' +
    'Default für den Lauf belegt."',
    `${TAXONOMY}:634–635`),
  exception('N.1.6', 'aboveLeftMetrics',
    { capHeightMm: 2.919225, baselineFromBodyTopMm: -1, anchorFromBodyLeftMm: -0.01 },
    `${N}:111`,
    'Am Fundort ohne Begründung; derselbe Metriksatz wie N.1.4 (CH-53).',
    `${N}:3–8; ${TAXONOMY}:663–665`),
]);
