import type {
  BodyFormZones,
  BodyVariantId,
  SourceReference,
  SymbolKind,
  ZoneAnchorEdge,
  ZoneBinding,
  ZoneBoundsMm,
  ZoneDirection,
  ZoneGapScope,
  ZoneId,
  ZoneMeasure,
  ZoneProvenance,
} from '@einsatzzeichen/schema';
import type { NotMeasuredScope } from '../not-measured.js';
import {
  FOOT_GAP_MM,
  HEAD_GAP_MM,
  HEAD_TOP_MARGIN_MM,
  profileFor,
  type LayoutProfile,
} from './profiles.js';
import {
  PERSON_STATE_CORNERS_MM,
  PERSON_STATE_FRAMES,
  STATE_HINT_LAYOUTS,
} from './state-frames.js';

/**
 * Hält `ZoneGapScope` (in `schema`, abhängigkeitsfrei) an `NotMeasuredScope` (in `core`). Beide
 * Richtungen müssen zuweisbar bleiben; sonst löst dieser Typ zu `never` auf und der Test, der ihn
 * mit `true` belegt, bricht. Damit gibt es zwei Schreibweisen derselben Aussage, aber keine zwei
 * Bedeutungen.
 */
export type ZoneGapScopeCheck = ZoneGapScope extends NotMeasuredScope
  ? NotMeasuredScope extends ZoneGapScope
    ? true
    : never
  : never;

/**
 * Präfix für Zahlen, die im Repository **ohne** Herkunftsaussage stehen. Sie sind benutzt und
 * wirksam, aber ihr Fundort nennt weder Abschnitt noch Messdatum. Das ist kein Grund, sie zu
 * verschweigen, und keiner, eine Messung dazuzuerfinden — es ist ein Befund, und
 * `zones.test.ts` nagelt die Liste fest, damit sie weder still wächst noch still verschwindet.
 */
export const UNDOCUMENTED_AT_SOURCE = 'Ohne Herkunftsaussage am Fundort: ';

/**
 * Präfix für Zahlen, deren Fundort ausdrücklich sagt, dass sie an dieser Körperform keine
 * Behauptung sind — etwa ein Standardanker, den `place()` mangels Kopfzone nie erreicht.
 */
export const NOT_A_CLAIM_AT_SOURCE = 'Ausdrücklich keine Behauptung: ';

/**
 * Die Zonenkonstanten, die als modulprivate `const` in `compose.ts` stehen und dort **nicht
 * exportiert** sind. Sie werden hier als Wert wiederholt und nicht importiert.
 *
 * **Sie bleiben Konstanten — das ist entschieden, nicht offen.** Am 21. September 2026 hat der
 * Eigentümer die sechs Werte dieser Tabelle bei Option A belassen: sie gelten weiter für alle
 * Körperformen gleich (Begründung je Wert in
 * `docs/decisions/2026-09-20-zonenmodell-als-daten.md` §2). Das Zonenmodell führt sie deshalb
 * mit ihrer Herkunftsaussage, ohne sie je Körperform zu variieren.
 *
 * Der Fußzonenabstand — die einzige Ausnahme jener Entscheidung — stand **nie** in dieser
 * Tabelle: er war gar keine eigene Konstante, sondern eine Verwendung von `HEAD_GAP_MM` mitten
 * in `compose()`. Genau das war der Befund. Seit dem 21. September 2026 heißt er `FOOT_GAP_MM`
 * und steht in `profiles.ts` neben `HEAD_GAP_MM`, wird also importiert und nicht wiederholt.
 *
 * **Die Wiederholung ist gegatet, nicht gehofft.** `zones.test.ts` liest den Quelltext von
 * `compose.ts` und vergleicht jede dieser Zahlen mit ihrer dortigen Deklaration — dieselbe
 * Bauart, mit der `validation-rules.test.ts` seine Regelkennungen an `validate.ts` hält. Läuft
 * ein Wert dort weg oder wird die Konstante umbenannt, bricht der Test.
 */
export const COMPOSE_ZONE_CONSTANTS = {
  FOOT_TEXT_SIZE_MM: 4,
  LABEL_SIDE_MARGIN_MM: 2,
  TOP_LEFT_LABEL_ANCHOR_FROM_BODY_LEFT_MM: 1.5,
  CENTER_LABEL_BOX_MARGIN_MM: 1,
  CENTER_LABEL_CAP_HEIGHT_MM: 4.87,
  BOTTOM_LABEL_CAP_HEIGHT_MM: 2.92,
} as const;

/**
 * Vermessene volle Höhe der Fahrwerkszone einschließlich Strichbreite. Wiederholt aus
 * `schema/src/chassis.ts:49–53`, wo sie als Fließtext und nicht als Konstante steht; den
 * konkreten Wert je Fahrzeugkategorie liefert weiterhin `ChassisShape.heightMm` aus dem Katalog.
 */
const CHASSIS_ZONE_HEIGHT_MM = 4.75;

/**
 * Die Referenzdateien sind die Quelle jeder Zahl dieses Modells. `status: 'derived'` und nicht
 * `'verbatim'`: `verbatim` ist in `provenance.ts` als „Geometrie entspricht der Referenz und ist
 * per Fingerprint belegt" definiert, und ein Zonenmaß trägt keinen Fingerprint. `derived` ist
 * genau die Autorschaftsaussage, auf die sich die Entscheidung vom 19. September 2026 festgelegt
 * hat: Maße an der Referenz abgelesen, Geometrie eigenständig konstruiert.
 */
function babz(...sections: readonly string[]): readonly SourceReference[] {
  return sections.map((section) => ({
    source: 'babz-svg-2025' as const,
    section,
    status: 'derived' as const,
  }));
}

function source(
  definedAt: string,
  note: string,
  sourceRefs?: readonly SourceReference[],
): ZoneProvenance {
  return sourceRefs === undefined ? { definedAt, note } : { definedAt, note, sourceRefs };
}

function offset(
  id: string,
  valueMm: number,
  from: ZoneAnchorEdge,
  towards: ZoneDirection,
  provenance: ZoneProvenance,
): ZoneMeasure {
  return { kind: 'offset', id, valueMm, from, towards, provenance };
}

function size(
  id: string,
  valueMm: number,
  axis: 'width' | 'height',
  provenance: ZoneProvenance,
): ZoneMeasure {
  return { kind: 'size', id, valueMm, axis, provenance };
}

function hull(id: string, boundsMm: ZoneBoundsMm, provenance: ZoneProvenance): ZoneMeasure {
  return { kind: 'bounds', id, boundsMm, provenance };
}

function rule(id: string, ruleText: string, provenance: ZoneProvenance): ZoneMeasure {
  return { kind: 'rule', id, rule: ruleText, provenance };
}

function measured(...measures: readonly ZoneMeasure[]): ZoneBinding {
  return { status: 'measured', measures };
}

function notMeasured(scope: ZoneGapScope, definedAt: string, reason: string): ZoneBinding {
  return { status: 'not-measured', gap: { scope, definedAt, reason } };
}

function measuredAbsent(scope: ZoneGapScope, definedAt: string, reason: string): ZoneBinding {
  return { status: 'measured-absent', gap: { scope, definedAt, reason } };
}

/**
 * Nachschlagen mit benanntem Abbruch. Fehlt der Eintrag, hat jemand ein Profilfeld belegt, ohne
 * dessen Herkunft einzutragen — ein **Programmfehler** und keine Datenlücke, deshalb ein
 * gewöhnliches `Error` und kein `NotMeasuredError` (vgl. die Trennlinie in `not-measured.ts`).
 * Ohne diesen Abbruch liefe ein fehlender Eintrag als `undefined` weiter und schlüge erst im
 * Gate als TypeError auf, ohne zu sagen, was fehlt.
 */
function provenanceFor(
  table: Readonly<Record<string, ZoneProvenance>>,
  key: string,
  what: string,
): ZoneProvenance {
  const found = table[key];
  if (found === undefined) {
    throw new Error(
      `Zonenmodell: für ${what} an "${key}" ist keine Herkunft hinterlegt. Ein Profilfeld ohne ` +
        'Herkunftseintrag darf nicht als Zonendatum erscheinen.',
    );
  }
  return found;
}

/** Schlüssel der Nachschlagetabellen: Körperform, bei Bedarf mit Variante. */
function formKey(kind: SymbolKind, variant?: BodyVariantId): string {
  return variant === undefined ? kind : `${kind}/${variant}`;
}

/**
 * Die drei Körperformen, an denen die Referenz überhaupt eine Fahrwerkszone führt. Wiederholt aus
 * `CHASSIS_KINDS` in `validate.ts:66–70`, das dort modulprivat ist; `zones.test.ts` hält die
 * Liste an der Meldung der Regel `vehicle-category-requires-vehicle` fest.
 */
const CHASSIS_KINDS: readonly SymbolKind[] = ['vehicle-land', 'trailer', 'swap-loader-vehicle'];

/**
 * Körperformen mit vermessenem Innenfeld (`INNER_FIELDS` in
 * `core/src/geometry/base-symbols.ts:1095–1111`). Das Zonenmodell importiert die Geometrie nicht;
 * die Liste steht deshalb als Fundortangabe hier.
 */
const INNER_FIELD_KINDS: readonly SymbolKind[] = [
  'formation',
  'building',
  'upright-rectangle',
  'vehicle-land',
  'trailer',
  'swap-loader-vehicle',
];

/** Varianten mit eigenem Innenfeld (`VARIANT_INNER_FIELDS`, `base-symbols.ts:1113–1123`). */
const INNER_FIELD_VARIANT_KEYS: readonly string[] = ['vehicle-water/raised-hull'];

/**
 * Die drei Körperformen ohne Kapitel-1-Abschnitt, für die `profiles.ts:538–543` das Fehlen der
 * Kopfzone als **nachgesehenes** Ergebnis festhält und nicht als offene Frage.
 */
const HEADLESS_E2_KINDS: readonly SymbolKind[] = [
  'trailer',
  'swap-loader-vehicle',
  'upright-rectangle',
];

const E2_NO_HEAD_ZONE =
  'Kein Zeichen des Anhangs E.2 trägt überhaupt eine Kopfzone (selbst nachgesehen an allen 31). ' +
  'Ohne Kopfzone gibt `place()` den Körper unverändert zurück; `defaultAnchorMm` bleibt damit ' +
  'unerreichbar und ist für diese drei keine Behauptung.';

const CIRCLE_NO_HEAD_ZONE =
  'Kreiskörper mit Kopfzone ist ein **gemessenes Negativ**: über alle 661 Referenzdateien ' +
  'tragen 109 eine 3-mm-Marke im Kopfzonenraster und 36 einen echten Kreiskörper, die ' +
  'Schnittmenge ist leer (Vermessung vom 18. August 2026). Wie ein Kreiskörper einer Kopfzone ' +
  'ausweicht, ist damit nicht ableitbar und wird nicht geraten.';

/**
 * Herkunft der mittigen Grundlinie je Körperform. Der Normfall steht als Rückfall; die
 * abweichenden Zeilen sind die Tabelle aus `profiles.ts:37–42` und ihre Nachbarkommentare.
 */
const CENTER_BASELINE_SOURCE: Readonly<Record<string, ZoneProvenance>> = {
  'swap-loader-vehicle': source(
    'core/src/layout/profiles.ts:511–514',
    '7,5004 gemessen an E.2.15 (Grundlinie 17,0000 bei Körperunterkante 24,5004) — n = 1. Ein ' +
      'Wert in einem stehenden Mechanismus, kein eigener Mechanismus.',
    babz('E.2.15'),
  ),
  'upright-rectangle': source(
    'core/src/layout/profiles.ts:515–516',
    '12,9999 gemessen an E.2.26 (Grundlinie 17,0000 bei Körperunterkante 29,9999) — n = 1.',
    babz('E.2.26'),
  ),
  'vehicle-water': source(
    'core/src/layout/profiles.ts:519–522',
    '6,9896 gemessen an E.2.28 bis E.2.31 (Grundlinie 16,0002 bei Körperunterkante 22,9898). ' +
      'Gilt für beide Zeichnungen der Art; der Rumpf aus Kapitel 1 trägt im gesamten Bestand ' +
      'keinen mittigen Lauf, für ihn ist keine der beiden Zahlen gemessen.',
    babz('E.2.28', 'E.2.29', 'E.2.30', 'E.2.31'),
  ),
  'vehicle-water/raised-hull': source(
    'core/src/layout/profiles.ts:356–363',
    '6,9896 gemessen an E.2.28 bis E.2.31 (Grundlinie 16,0002 bei Körperunterkante 22,9898). ' +
      'Die elf I.3-Dateien tragen denselben Rumpf 1,0002 mm tiefer und ihre Grundlinie auf ' +
      'derselben absoluten Höhe — beide Lesarten erzeugen für die fünf E.2-Zeichen dasselbe Bild.',
    babz('E.2.28', 'E.2.29', 'E.2.30', 'E.2.31'),
  ),
  'vehicle-water/inset-hull': source(
    'core/src/layout/profiles.ts:365–366',
    'I.3.5 bis I.3.7: 7,9900 mm über der separat gemessenen Rumpfunterkante 23,9899.',
    babz('I.3.5', 'I.3.6', 'I.3.7'),
  ),
};

const CENTER_BASELINE_DEFAULT = source(
  'core/src/layout/profiles.ts:26–58, 189–190',
  'Der Normfall 8 mm, gemessen an `formation` (Unterkante 26,0004, Grundlinie 18,0001) und an ' +
    '`building`; 19 der 20 Landfahrzeuge des E.2-Blocks setzen dieselbe Grundlinie. Ausreißer ' +
    'sind E.2.20 (8,5005) und E.2.23; der Katalog folgt der Mehrheit.',
  babz('E.1.1', 'E.2.1'),
);

/** Herkunft der Grundlinie oben links je Körperform. */
const TOP_LEFT_BASELINE_SOURCE: Readonly<Record<string, ZoneProvenance>> = {
  formation: source(
    'core/src/layout/profiles.ts:77–99, 218',
    '5,0 mm an den neun beschrifteten Zeichen aus F.1.1 bis F.1.11 (Körperoberkante 6,0, ' +
      'Grundlinie 11,0 — eigene Vermessung, 18. August 2026).',
    babz('F.1.1–F.1.11'),
  ),
  'formation/foot-band': source(
    'core/src/layout/profiles.ts:253–261',
    'Geerbt vom Formationsprofil: 5,0 mm an F.1.1 bis F.1.11. Das gebänderte Profil setzt die ' +
      'Grundlinie nicht neu.',
    babz('F.1.1–F.1.11'),
  ),
  'vehicle-land': source(
    'core/src/layout/profiles.ts:281–318',
    'F.2-Landfahrzeuge mit normaler oder gebänderter Hülle: obere Grundlinie 6,75 mm unter der ' +
      'Körperoberkante (F.2.1 bis F.2.5, Grundlinie 12,5 bei Oberkante 5,75). Diese Zeichen ' +
      'tragen die Fassung `plain-wheel-pair`; an der normalen und der gebänderten Hülle ist der ' +
      'Wert auf denselben Rumpf übertragen. Das Kapitel-1-Grundzeichen selbst trägt keinen Lauf.',
    babz('F.2.1–F.2.5'),
  ),
  'trailer/foot-band': source(
    'core/src/layout/profiles.ts:230–252',
    'Unmittelbar an C.2.30 gemessen (LFH-786): „120“ auf Grundlinie 12,5 bei Körperoberkante ' +
      '5,75, also 6,75 mm — dieselbe Zahl wie am Landfahrzeug, hier aber an dieser Fassung ' +
      'abgelesen. Der normale Anhänger trägt die Grundlinie nicht (I.2.1 bis I.2.3 setzen ihre ' +
      'Läufe über Metriken auf 6,25).',
    babz('C.2.30'),
  ),
  'vehicle-land/plain-wheel-pair': source(
    'core/src/layout/profiles.ts:328–348',
    'Unmittelbar an dieser Fassung gemessen: die sechs einzeiligen Läufe aus F.2.1 bis F.2.5 ' +
      '(`KTW`, `N-KTW_B`, `2`, `RTW`, `NEF`, `NAW`) stehen auf Grundlinie 12,5 bei ' +
      'Körperoberkante 5,75. **Benannte Ausnahme (LFH-597):** der zweizeilige Satz aus F.2.8 ' +
      'beginnt 0,96 mm höher; die Referenz führt an dieser Fassung zwei Lagen.',
    babz('F.2.1–F.2.5'),
  ),
  'circle-12': source(
    'core/src/layout/profiles.ts:465–474',
    'Unmittelbar an F.3.3/F.3.4 gemessen; die Grundlinie liegt teilweise außerhalb der ' +
      'Kreisfläche und ist keine Ableitung des 14-mm-`post`-Profils.',
    babz('F.3.3', 'F.3.4'),
  ),
  'circle-12/raised-gable': source(
    'core/src/layout/profiles.ts:465–479',
    'Unmittelbar an F.3.5 gemessen; keine Ableitung des 14-mm-`post`-Profils.',
    babz('F.3.5'),
  ),
  'vehicle-air/fixed-wing-hull': source(
    'core/src/layout/profiles.ts:345–352',
    UNDOCUMENTED_AT_SOURCE +
      '`fixedWingVehicleAirProfile` trägt die 7 ohne Kommentar; weder Abschnitt noch Messdatum ' +
      'stehen am Fundort.',
  ),
};

const TOP_LEFT_BASELINE_INHERITED = source(
  'core/src/layout/profiles.ts:263–288',
  'Geerbt vom Landfahrzeugprofil: 6,75 mm an F.2.1 bis F.2.5. Die Variante setzt die Grundlinie ' +
    'nicht neu.',
  babz('F.2.1–F.2.5'),
);

/** Herkunft des oberhalb liegenden Laufs je Körperform. */
const ABOVE_LEFT_SOURCE: Readonly<Record<string, ZoneProvenance>> = {
  'vehicle-air/raised-hull': source(
    'core/src/layout/profiles.ts:329–341',
    'F.2.6/F.2.7: dieselbe absolute ITH-Grundlinie y = 6 am auf y = 6 angehobenen Rumpf.',
    babz('F.2.6', 'F.2.7'),
  ),
  'vehicle-air/fixed-wing-hull': source(
    'core/src/layout/profiles.ts:345–352',
    UNDOCUMENTED_AT_SOURCE +
      '`fixedWingVehicleAirProfile` trägt −1 und −0,01 ohne Kommentar; weder Abschnitt noch ' +
      'Messdatum stehen am Fundort.',
  ),
  'person/compact-person-diamond-26mm-lowered-2mm': source(
    'core/src/layout/profiles.ts:409–419',
    'I.5.2/I.5.3: dieselbe Raute wie I.5.1, nur 2 mm abgesenkt. Die oberhalb liegende Zone ' +
      'bleibt je Rezept überschreibbar; ihre Defaultwerte ergeben Anker (1|3,5) mm.',
    babz('I.5.2', 'I.5.3'),
  ),
};

/** Herkunft des Laufs rechts unterhalb des Körpers. */
const BELOW_RIGHT_SOURCE: Readonly<Record<string, ZoneProvenance>> = {
  'vehicle-water/raised-hull': source(
    'core/src/compose.ts:207–247, core/src/layout/profiles.ts:356–363',
    'Belegt an den fünf Wasserfahrzeugen E.2.27 bis E.2.31, deren Typo-Ebene diesen Lauf ' +
      'byteidentisch führt. Gemessen ist die Tinte, nicht der Anker: der Anker 31,5512 ist aus ' +
      'der an E.2.1 gemessenen Differenz von 0,0266 mm zwischen Anker und Tintenkante ' +
      'zurückgerechnet. Die Lesart gegen die Körperhülle ist eine Entscheidung, keine Messung.',
    babz('E.2.27', 'E.2.28', 'E.2.29', 'E.2.30', 'E.2.31'),
  ),
  'circle-12/foot-band': source(
    'core/src/layout/profiles.ts:490–501',
    'G.3.5: Bw rechts außen auf (31|29) bei Körperhülle 4…28 mm.',
    babz('G.3.5'),
  ),
};

/** Herkunft der Läufe auf der Ausgabeoberfläche unterhalb des Körpers. */
const SURFACE_LABEL_SOURCE: Readonly<Record<string, ZoneProvenance>> = {
  'vehicle-air/raised-hull': source(
    'core/src/layout/profiles.ts:329–341',
    'F.2.6/F.2.7 am auf y = 6 angehobenen Rumpf; der reale Katalogpfad spannt ' +
      '1,0100…30,9894 × 6,0001…20,9898 mm auf.',
    babz('F.2.6', 'F.2.7'),
  ),
  'circle-12/raised-circle-1mm': source(
    'core/src/layout/profiles.ts:481–488',
    UNDOCUMENTED_AT_SOURCE +
      '`raisedCircleOneMmProfile` trägt Grundlinie 4 und die Anker −3/+3 ohne Kommentar; weder ' +
      'Abschnitt noch Messdatum stehen am Fundort.',
  ),
};

/** Herkunft des unten mittigen Laufs. */
const BOTTOM_CENTER_SOURCE: Readonly<Record<string, ZoneProvenance>> = {
  formation: source(
    'core/src/layout/profiles.ts:125–130, 219',
    'Gemessen sind 2,0 mm an F.1.18/F.1.20 für die Formation (absolut y = 24,0 mm), um ' +
      'x = 16,0 mm zentriert und im Schriftgrad der unteren Zonen.',
    babz('F.1.18', 'F.1.20'),
  ),
  'formation/foot-band': source(
    'core/src/layout/profiles.ts:253–261',
    'Geerbt vom Formationsprofil: 2,0 mm an F.1.18/F.1.20.',
    babz('F.1.18', 'F.1.20'),
  ),
  'circle-12/foot-band': source(
    'core/src/layout/profiles.ts:490–501',
    'G.3.5: Diesel auf y = 22 bei Körperhülle 4…28 mm, also 6,0 mm über der Unterkante. Der in ' +
      'Pfade umgewandelte Lauf ist in der Referenz schwarz, nicht weiß.',
    babz('G.3.5'),
  ),
};

/** Herkunft der unteren Grundlinie, wo sie vom Normwert abweicht. */
const BOTTOM_LABEL_SOURCE: Readonly<Record<string, ZoneProvenance>> = {
  'formation/foot-band': source(
    'core/src/layout/profiles.ts:253–261',
    'G.1.2: DLRG-Grundlinie 21 mm bei Körperunterkante 26 mm, also 5,0 mm.',
    babz('G.1.2'),
  ),
};

const BOTTOM_LABEL_DEFAULT = source(
  'core/src/compose.ts:84–124',
  'Gemessen an den 16 Referenzdateien E.1.1 bis E.1.16 (11./12. August 2026): Grundlinie 24,00 ' +
    'bei Körperunterkante 26,0, linke Tintenkante 3,03, rechte 29,03. Geltungsbereich sind diese ' +
    '16 Dateien auf dem Formationskörper — keine Aussage über E.1 insgesamt und keine eigene ' +
    'Messung an Raute oder Kreiskörper.',
  babz('E.1.1–E.1.16'),
);

const DEFAULT_ANCHOR_SOURCE: Readonly<Record<string, ZoneProvenance>> = {
  'rect-body': source(
    'core/src/layout/profiles.ts:23–24, 171–187',
    'Oberster Punkt der Körper-Mittellinie ohne Kopfzone. Belegt an C.1.2 (Reihe: bleibt bei ' +
      '6 mm wie 1.1) und C.1.1 (Stapel: rückt auf 9 mm).',
    babz('C.1.1', 'C.1.2'),
  ),
  'rotated-square-body': source(
    'core/src/layout/profiles.ts:368–374',
    'D.3.7: halbe Diagonale 15 → 13 mm, Mittelpunkt 16 → 18 mm, Unterkante bleibt 31 mm.',
    babz('D.3.7'),
  ),
  'circle-body': source(
    'core/src/layout/profiles.ts:448–450',
    UNDOCUMENTED_AT_SOURCE +
      '`circleBodyProfile` trägt den Anker 2 ohne Kommentar. Er ist ohne Kopfzone ohnehin ' +
      'unerreichbar, weil `place()` für den Kreiskörper wirft.',
  ),
};

/**
 * Die Zustandsrandlage ist seit der Durchsicht aller 661 Referenzdateien am 29. September 2026 an
 * zwei Grundzeichen vermessen: an der Person (`5.8.1_Beispiel 1` bis `3`) und an der Gefahr
 * (`5.8.1.13_…_2`, `5.8.1.14_…_2`). Belegt sind dort nur die Hinweise „?" und „!" aus 5.8.1; an
 * jeder anderen Körperform fehlt die Zusammenstellung. `combination` und nicht mehr `value`, weil
 * Person und Gefahr sie tragen.
 */
const STATE_MARGIN_GAP = notMeasured(
  'combination',
  'core/src/layout/state-frames.ts:129–172',
  'Kein Original zeigt einen Zustand aus 5.8 in der Randlage dieser Körperform. Belegt sind die ' +
    'Hinweise 5.8.1.13 und 5.8.1.14 links neben der Person (5.8.1_Beispiel 1–3) und neben der ' +
    'Gefahr (5.8.1.13_2, 5.8.1.14_2, M.6); seit dem 02.10.2026 überträgt `derive/states.ts` diese ' +
    'Lage hierher und kennzeichnet sie als abgeleitet.',
);

const TENDENCY_MARGIN_GAP = notMeasured(
  'value',
  'core/src/layout/state-placement.ts:477–483',
  'Keine der 661 Referenzdateien zeigt eine Tendenz aus 5.8.3 an einem Träger (Durchsicht vom ' +
    '29. September 2026); die Pfeile in M.9 und M.10 sind offene Winkelpfeile ohne Rahmen und ' +
    'keine Tendenz. Die Tendenz ist ein eigenes Spec-Feld mit eigener Randlage (Entscheidung des ' +
    'Eigentümers vom 29. September 2026); seit dem 02.10.2026 steht sie abgeleitet rechts neben ' +
    'dem Träger, gespiegelt zur Hinweis-Randlage (`derive/states.ts`).',
);

const HINT_LAYOUT_SOURCE = 'core/src/layout/state-frames.ts:129–172';
const PERSON_FRAME_SOURCE = 'core/src/layout/state-frames.ts:63–95';
const PERSON_CORNER_SOURCE = 'core/src/layout/state-frames.ts:99–110';

/** Die Hinweislage eines Trägers, in Koordinaten der (bei der Person verbreiterten) Zeichenfläche. */
function hintMeasures(carrier: 'person' | 'hazard'): readonly ZoneMeasure[] {
  const layout = STATE_HINT_LAYOUTS[carrier];
  const provenance =
    carrier === 'person'
      ? source(
          HINT_LAYOUT_SOURCE,
          '5.8.1_Beispiel 3 (29.09.2026): Fläche 36 × 32 mm, Grundfläche x 4…36, 20-mm-Raute um ' +
            '(21 | 16) mit 0,4-mm-Strich, schwarzes „?" mit Achse x = 6,5 (Tinte 3,642…9,4 × ' +
            '9,6…20,5 mm). „!" ist an der Person nicht gezeichnet und um 1 mm versetzt übertragen.',
          babz('5.8.1'),
        )
      : source(
          HINT_LAYOUT_SOURCE,
          '5.8.1.13_2 und 5.8.1.14_2 (29.09.2026): Dreieck (7,5 | 25), (19 | 6), (30,5 | 25) mit ' +
            '0,5-mm-Strich, rotes „?" mit Achse x = 5, rotes „!" mit Achse x = 6, Tinte y 9,6…20,65.',
          babz('5.8.1.13', '5.8.1.14'),
        );
  const markAxis = layout.carrierHullMm.minX - layout.markAxisXMm['suspected-situation'];
  return [
    rule(
      'hint-frame',
      'Alle Maße dieser Zone gelten in Koordinaten der Zeichenfläche des Hinweises, nicht der ' +
        '32-mm-Grundfläche: an der Person wächst die Fläche nach links auf 36 mm, die Grundfläche ' +
        'liegt dann bei x 4…36. Der Träger wird verkleinert und ersetzt den Körper.',
      provenance,
    ),
    size('hint-canvas-width', layout.canvasMm.width, 'width', provenance),
    hull('hint-base-area', layout.baseAreaMm, provenance),
    hull('hint-carrier-hull', layout.carrierHullMm, provenance),
    offset('hint-mark-axis', markAxis, 'body-left', 'left', provenance),
    rule(
      'hint-mark-ink',
      'Die Hinweismarke übernimmt die Strichfarbe des Trägers: schwarz an der Person, rot an der ' +
        'Gefahr. Sie ist die auf die Hälfte verkleinerte Figur aus 5.8.1.13 bzw. 5.8.1.14.',
      provenance,
    ),
  ];
}

/** Die Ecklagen der Zusatzkennungen aus 5.8.8 an der 26-mm-Raute. */
function cornerMeasures(): readonly ZoneMeasure[] {
  const provenance = source(
    PERSON_CORNER_SOURCE,
    'Tintenhüllen an 5.8.8.2, 5.8.8.5, 5.8.8.6 (oben rechts: B, TP, K, Kontaminationszeichen) und ' +
      '5.8.8.4 (unten links: Sichtungskategorie), abgelesen am 29.09.2026.',
    babz('5.8.8.2', '5.8.8.4', '5.8.8.5', '5.8.8.6'),
  );
  return [
    rule(
      'person-state-frame',
      'Ein Personenzustand aus 5.8.8 ersetzt den 30-mm-Körper durch seine eigene Raute: 26 mm um ' +
        '(16 | 16), 26 mm um (16 | 14) bei 5.8.8.12 bis 5.8.8.14, 21 mm um (16 | 20,5) bei 5.8.8.9.',
      source(
        PERSON_FRAME_SOURCE,
        'Rautenlagen an 5.8.8.3, 5.8.8.12 und 5.8.8.9 abgelesen (29.09.2026); die Standardlage ' +
          `hat die Hülle ${PERSON_STATE_FRAMES['person-diamond-26mm'].hullMm.minX}…` +
          `${PERSON_STATE_FRAMES['person-diamond-26mm'].hullMm.maxX} mm wie I.5.1.`,
        babz('5.8.8.3', '5.8.8.9', '5.8.8.12'),
      ),
    ),
    hull('corner-top-right', PERSON_STATE_CORNERS_MM['top-right'], provenance),
    hull('corner-bottom-left', PERSON_STATE_CORNERS_MM['bottom-left'], provenance),
  ];
}

function stateMarginZone(kind: SymbolKind, variant: BodyVariantId | undefined): ZoneBinding {
  if (kind === 'hazard' && variant === undefined) return measured(...hintMeasures('hazard'));
  if (kind === 'person' && (variant === undefined || variant === 'compact-person-diamond-26mm')) {
    return measured(...hintMeasures('person'), ...cornerMeasures());
  }
  return STATE_MARGIN_GAP;
}

/**
 * Seit der Vermessung vom 29.09.2026 ist die Anbindung **einmal** belegt: an der Personenraute
 * unten in 5.8.8.12 bis 5.8.8.14 (`anchoredMovementPath`: Verlauf von (minX | maxY) nach
 * (maxX + 1 | maxY), nur an der 26-mm-Raute). Diese Raute ist aber die um 2 mm angehobene
 * Fassung des Personenzustands (`PERSON_STATE_FRAMES`, Mitte 16 | 14), keine `BodyVariantId`:
 * weder `person` (30-mm-Raute, dort ließe die Fläche dem Pfeil keinen Platz) noch
 * `compact-person-diamond-26mm` (Mitte 16 | 16) tragen sie. Das Zonenmodell ist nach Körperform
 * und Variante geschlüsselt und kann die Lage deshalb an keiner seiner Formen führen; sie gehört
 * zum Personenzustand. Die Lücke bleibt, mit diesem Grund.
 */
const MOVEMENT_ANCHOR_GAP = notMeasured(
  'value',
  'core/src/geometry/parametric.ts:549–596',
  'Die Pfeile aus 5.2 sind in der Referenz freistehend gezeichnet, jeder in seiner eigenen ' +
    '32-mm-Fläche. An einem Körper zeigt sie nur der Personenzustand 5.8.8.12 bis 5.8.8.14: ' +
    'der Pfeil liegt auf der Waagerechten durch die untere Ecke einer 26-mm-Raute, die um 2 mm ' +
    'angehoben ist (`anchoredMovementPath`). Diese Raute ist eine Fassung des Zustands und keine ' +
    'Körpervariante; an keiner Körperform dieses Modells ist die Anbindung vermessen, deshalb ' +
    '`scope: "value"`.',
);

function bodyZone(kind: SymbolKind, profile: LayoutProfile): ZoneBinding {
  const anchorSource = provenanceFor(DEFAULT_ANCHOR_SOURCE, profile.id, 'den Standardanker');
  const anchor = HEADLESS_E2_KINDS.includes(kind)
    ? source(
        'core/src/layout/profiles.ts:502–509',
        NOT_A_CLAIM_AT_SOURCE + E2_NO_HEAD_ZONE,
      )
    : anchorSource;

  const measures: ZoneMeasure[] = [
    rule(
      'placed-body-hull',
      'Die Körperzone ist die Hülle des **platzierten** Körpers. Alle übrigen Zonen rechnen ' +
        'gegen sie, damit sie mitwandern, wenn eine Kopfzone den Körper verschiebt.',
      source(
        'core/src/compose.ts:1348–1351',
        'Die Hülle entsteht zur Laufzeit aus dem Katalogprimitiv (`boundsOfMm`) und wird um die ' +
          'zusätzlichen Körperprimitive erweitert; sie ist deshalb kein je Körperform ' +
          'eingetragener Zahlenwert.',
      ),
    ),
    offset('default-anchor', profile.defaultAnchorMm, 'canvas-top', 'down', anchor),
  ];

  if (profile.measuredBodyBoundsMm !== undefined) {
    measures.push(
      hull(
        'measured-body-hull',
        profile.measuredBodyBoundsMm,
        source(
          'core/src/layout/profiles.ts:70–74',
          'Absolute vermessene Körperhülle für vollständige je-Spec-Textmetriken. Fehlt sie, ' +
            'darf die Validierung keine relativen Metriken gegen eine angenommene Hülle ' +
            'freigeben — sie steht deshalb nur an den Fassungen, an denen sie gemessen wurde.',
        ),
      ),
    );
  }

  return measured(...measures);
}

function headZone(kind: SymbolKind, profile: LayoutProfile): ZoneBinding {
  if (profile.id === 'circle-body') {
    return measuredAbsent('combination', 'core/src/layout/profiles.ts:421–462', CIRCLE_NO_HEAD_ZONE);
  }
  if (HEADLESS_E2_KINDS.includes(kind)) {
    return measuredAbsent('combination', 'core/src/layout/profiles.ts:502–509', E2_NO_HEAD_ZONE);
  }
  return measured(
    offset(
      'head-top-margin',
      HEAD_TOP_MARGIN_MM,
      'canvas-top',
      'down',
      source(
        'core/src/layout/profiles.ts:10–11',
        'Kleinster Abstand der Kopfzone zum oberen Rand der Grundfläche. Der Fundort nennt ' +
          'keinen eigenen Abschnitt; die Zahl greift in denselben drei Konstellationen wie ' +
          '`HEAD_GAP_MM`.',
      ),
    ),
    offset(
      'head-gap',
      HEAD_GAP_MM,
      'body-top',
      'up',
      source(
        'core/src/layout/profiles.ts:4–8',
        'Abstand zwischen der Unterkante der Kopfzone und dem Körperanker. An drei ' +
          'Konstellationen der Referenz belegt: C.1.1 (8 → 9), C.1.2 (5 → 6), D.3.7 (4 → 5).',
        babz('C.1.1', 'C.1.2', 'D.3.7'),
      ),
    ),
    rule(
      'head-placement',
      'Die Kopfzone hängt so tief wie möglich, damit der Körper auf seinem Standardanker bleiben ' +
        'kann: `topMm = max(HEAD_TOP_MARGIN_MM, defaultAnchorMm − HEAD_GAP_MM − headHeightMm)`. ' +
        'Passt sie dort nicht, rutscht sie an den oberen Rand und der Körper weicht aus.',
      source(
        'core/src/layout/profiles.ts:157–174',
        'Belegt an: Rechteck + Reihe (6, 3) → 2/5; Rechteck + Stapel (6, 7) → 1/8; gedrehtes ' +
          'Quadrat + Reihe (1, 3) → 1/4.',
      ),
    ),
  );
}

function chassisZone(kind: SymbolKind, profile: LayoutProfile): ZoneBinding {
  if (!CHASSIS_KINDS.includes(kind)) {
    return measuredAbsent(
      'combination',
      'core/src/validate.ts:498–504',
      'Eine Fahrzeugkategorie ist nur am Landfahrzeug, am Anhängerrumpf und am ' +
        `Wechselladerrumpf belegt. "${kind}" trägt in der Referenz keine Fahrwerkszone ` +
        '(Regel `vehicle-category-requires-vehicle`).',
    );
  }

  const topOffsetMm = profile.chassisTopBelowBaseBottomMm ?? 0;
  const topSource =
    profile.chassisTopBelowBaseBottomMm === undefined
      ? source(
          'core/src/layout/profiles.ts:145–149, core/src/compose.ts:1353–1363',
          'Regelfall: die Zone hängt unmittelbar an der Unterkante des Grundzeichens. Gemessen ' +
            'an 5.1.1.1 bis 5.1.1.6 und an allen 25 E.2-Zeichen mit Fahrwerk — Körperunterkante ' +
            '26,0004 mm, Markenmitte 28,2501 mm, Unterkante der Zone 30,7502 mm.',
          babz('5.1.1.1', '5.1.1.6'),
        )
      : source(
          'core/src/layout/profiles.ts:290–320',
          'N.1.1: Die Unterkante des umgekehrten Rumpfs liegt an den Ecken bei 25,75 mm, die ' +
            'Kette aber wie im Regelfall mit Mittellinie 26,0…30,5 mm. Die Zone beginnt deshalb ' +
            '0,25 mm unter der Körperunterkante.',
          babz('N.1.1'),
        );

  return measured(
    offset('chassis-top', topOffsetMm, 'body-bottom', 'down', topSource),
    size(
      'chassis-height',
      CHASSIS_ZONE_HEIGHT_MM,
      'height',
      source(
        'schema/src/chassis.ts:44–57',
        'Volle Höhe der Zone einschließlich Strichbreite, gemessen 4,75 mm: Körperunterkante ' +
          '26,0004 bis Fahrwerksunterkante 30,7502 in allen 25 E.2-Zeichen mit Fahrwerk und in ' +
          '5.1.1.1 bis 5.1.1.6. Sie grenzt die Zone gegen die Fußzone ab, die bei ' +
          'Körperunterkante + 1 beginnt und sich sonst mit ihr überschnitte.',
        babz('5.1.1.1', '5.1.1.6'),
      ),
    ),
    rule(
      'chassis-marks',
      'Die Marken der Zone (`wheel`, `track`, `bar`) verankern an der **Oberkante der Zone**. ' +
        'Ihre Maße liefert der Katalog je Fahrzeugkategorie als `ChassisShape`; sie sind kein ' +
        'Datum der Körperform.',
      source(
        'schema/src/chassis.ts:3–42',
        'Alle drei Formen sind an der Referenz vermessen (18. August 2026, Kapitel 5.1); eine ' +
          'Marke trägt keine Farbe, die Zone ist im gesamten vermessenen Bestand schwarze ' +
          'Kontur ohne Füllung.',
      ),
    ),
  );
}

function innerFieldZone(kind: SymbolKind, variant?: BodyVariantId): ZoneBinding {
  const key = formKey(kind, variant);
  const hasField =
    variant === undefined
      ? INNER_FIELD_KINDS.includes(kind)
      : INNER_FIELD_VARIANT_KEYS.includes(key);

  if (!hasField) {
    return notMeasured(
      'combination',
      'core/src/geometry/base-symbols.ts:1125–1142',
      `Eine weiße Innenkontur ist für "${kind}"` +
        `${variant === undefined ? '' : ` / "${variant}"`} an keiner Referenz belegt. Wie die ` +
        'Kontur an einer Raute oder einem Kreis sitzt, zeigt keine Referenz; `innerField()` ' +
        'wirft dort einen `NotMeasuredError`. Die Lücke betrifft die weiße Kontur, nicht die ' +
        'Fähigkeit: wo ein Kapitel-4-Piktogramm an dieser Körperform im Körper vermessen ist, ' +
        'führt `CAPABILITY_INSET_FORMS` seine Fassung (LFH-587).',
    );
  }

  const measures: ZoneMeasure[] = [
    rule(
      'inner-field-drawing',
      'Die Zeichnung des Innenfelds liefert der Katalogport `innerField(kind, variant)` in den ' +
        'Koordinaten der unverschobenen Grundzeichnung. Als Zonendatum liegt die Einrückung vor, ' +
        'nicht eine je Körperform eingetragene Hülle.',
      source(
        'core/src/geometry/base-symbols.ts:1095–1123, core/src/compose.ts:777–782',
        'Belegt nur für die Körper, die Anhang E damit zeichnet. Optional, weil nur Anhang E es ' +
          'braucht; fehlt der Port oder die Körperform, wirft `compose()`, statt die Kontur ' +
          'still wegzulassen.',
      ),
    ),
    rule(
      'capability-inset',
      'Ein Kapitel-4-Piktogramm steht im Körper in einer **eigenen Fassung je Paar aus Fähigkeit ' +
        'und Körperform** (`CAPABILITY_INSET_FORMS`), nicht als skalierte Einzeldarstellung. ' +
        'Drei Behandlungen kommen vor: randbündig umgeformt, gleichmäßig verkleinert oder frei ' +
        'umgeformt. Die Strichstärke bleibt 0,5 mm. Wo eine Fassung vermessen ist, lehnt ' +
        '`validateSpec` die Boxfassung ab und verweist auf `bodyMarks` ' +
        '(`capabilities-pictogram-has-measured-rendition`, LFH-787). Für Paare ohne Fassung lässt ' +
        'die Boxfassung nur Piktogramme zu, die unskaliert im Körper bleiben ' +
        '(`capabilities-pictogram-overflows-body`, `CAPABILITY_INSET_RULE.unmeasuredPairs`).',
      source(
        'core/src/blocks/capability-inset.ts:91–315',
        'Gemessen an allen 76 Körperfassungen des Bestands gegen ihre Einzeldarstellung ' +
          '(LFH-587, LFH-786). Weder ein gemeinsamer Faktor noch das Einpassen in die Box 4/8/24/16 mm ' +
          'noch das unveränderte Einsetzen reproduziert die Referenz.',
      ),
    ),
  ];

  if (kind === 'formation' && variant === undefined) {
    measures.push(
      hull(
        'inner-field-hull',
        { minX: 2, minY: 7, maxX: 30, maxY: 25 },
        source(
          'core/src/compose.ts:108–122',
          'Die Referenz zieht ihre Ränder gegen dieses weiße Innenfeld, das 1 mm in den Körper ' +
            'eingerückt ist: `rect` 2/7 bis 30/25 neben dem Körper 1/6 bis 31/26 — belegt an ' +
            'dessen `rect` und nicht aus dem Überstand zurückgerechnet.',
          babz('E.1.1–E.1.16'),
        ),
      ),
      offset(
        'inner-field-inset',
        COMPOSE_ZONE_CONSTANTS.CENTER_LABEL_BOX_MARGIN_MM,
        'body-left',
        'inward',
        source(
          'core/src/compose.ts:108–122, 202–203',
          'Die vermessene Grenze des mittigen Laufs ist dieses weiße Innenfeld, also 1 mm Marge ' +
            'und 28 mm Breite. Der Katalog kennt das Innenfeld als eigene Fläche in `compose()` ' +
            'nicht — die Formation ist dort **ein** Rechteck.',
          babz('E.1.1–E.1.16'),
        ),
      ),
    );
  }

  return measured(...measures);
}

function footZone(profile: LayoutProfile): ZoneBinding {
  const measures: ZoneMeasure[] = [
    offset(
      'foot-top',
      FOOT_GAP_MM,
      'body-bottom',
      'down',
      source(
        'core/src/layout/profiles.ts:26',
        'Übernommene Zahl, an der Fußzone **nicht** vermessen. Die 1 mm sind an C.1.1, C.1.2 ' +
          'und D.3.7 für die **Kopfzone** belegt. Bis zur Entscheidung vom 21. September 2026 ' +
          'rechnete `compose()` die Fußzone mit `HEAD_GAP_MM` selbst — eine Konstante, zwei ' +
          'Bedeutungen. `FOOT_GAP_MM` trägt denselben Wert und trennt nur die Bedeutungen, ' +
          'damit eine Messung an der Kopfzone nicht stillschweigend jede Fußzeile verschiebt. ' +
          'Der eigene Messwert der Fußzone fehlt weiterhin.',
      ),
    ),
    size(
      'foot-text-size',
      COMPOSE_ZONE_CONSTANTS.FOOT_TEXT_SIZE_MM,
      'height',
      source(
        'core/src/compose.ts:43–82',
        'Nicht an der Referenz abgelesen, sondern gespiegelt aus derselben Rechnung wie ' +
          '`placeHead`: die Kopfzone darf beim Rechteck-Körper bis zu ' +
          '`defaultAnchorMm − HEAD_GAP_MM − HEAD_TOP_MARGIN_MM` = 4 mm hoch werden. Bewusst ein ' +
          'einziger, fixer Wert und keine Herleitung je `defaultAnchorMm`.',
      ),
    ),
  ];

  if (profile.id !== 'rect-body') {
    measures.push(
      rule(
        'foot-outside-viewbox',
        'An Raute (`defaultAnchorMm` 1) und Kreiskörper (2) ginge dieselbe Formel auf null oder ' +
          'negativ. Der feste Wert lässt die Fußbox dort über die Grundfläche hinausragen — ein ' +
          'gewollter `outside-viewbox`-Befund im viewBox-Gate statt einer Zone, die lautlos ' +
          'verschwindet.',
        source(
          'core/src/compose.ts:66–73',
          'Ein bedingungsloses Abschneiden auf 0 würde dort einen unsichtbaren `sizeMm: ' +
            '0`-Text erzeugen; belegt in `compose.test.ts`.',
        ),
      ),
    );
  }

  return measured(...measures);
}

function centerZone(
  kind: SymbolKind,
  variant: BodyVariantId | undefined,
  profile: LayoutProfile,
): ZoneBinding {
  if (profile.id !== 'rect-body') {
    return notMeasured(
      'combination',
      profile.id === 'circle-body'
        ? 'core/src/layout/profiles.ts:448–452'
        : 'core/src/layout/profiles.ts:372–377',
      'Kein Zeichen des Bestands beschriftet diese Körperform mittig. Der Normwert 8 steht im ' +
        'Profil, damit die Zahl nicht fehlt — er ist **keine Messung an dieser Körperform** und ' +
        'darf nicht als Zonendatum gelesen werden.',
    );
  }

  const key = formKey(kind, variant);
  const baselineSource =
    CENTER_BASELINE_SOURCE[key] ?? CENTER_BASELINE_SOURCE[kind] ?? CENTER_BASELINE_DEFAULT;

  return measured(
    offset(
      'center-baseline',
      profile.centerBaselineFromBodyBottomMm,
      'body-bottom',
      'up',
      baselineSource,
    ),
    offset(
      'center-box-margin',
      COMPOSE_ZONE_CONSTANTS.CENTER_LABEL_BOX_MARGIN_MM,
      'body-left',
      'inward',
      source(
        'core/src/compose.ts:108–122, 188–203',
        'Symmetrischer Rand der Ausgabebox gegen die Körperhülle; am 30 mm breiten ' +
          'Formationskörper ergibt das die 28-mm-Box. Vermessen ist das weiße Innenfeld der ' +
          'Referenz (`rect` 2/7 bis 30/25), nicht die Box selbst: die 28 mm sind eine ' +
          '**Hüllengrenze, keine Referenzlaufgrenze** — der längste mittige Lauf der Referenz ' +
          'ist `Log-MW` mit 25,13 mm.',
        babz('E.1.1–E.1.16'),
      ),
    ),
    size(
      'center-cap-height',
      COMPOSE_ZONE_CONSTANTS.CENTER_LABEL_CAP_HEIGHT_MM,
      'height',
      source(
        'core/src/compose.ts:248–249',
        'Versalhöhe des mittigen Schriftgrads, gemessen an den 16 Dateien E.1.1 bis E.1.16. Der ' +
          'Schriftgrad selbst ist daraus über `ARIMO_CAP_HEIGHT_FRACTION` abgeleitet und nicht ' +
          'gewählt; je Zeichen kann eine eigene gemessene Höhe danebenstehen.',
        babz('E.1.1–E.1.16'),
      ),
    ),
    rule(
      'center-anchor',
      'Waagerecht mittig auf der Körperhülle. Eine waagerechte Randvermessung des mittigen ' +
        'Laufs gibt es nicht — ablesbar sind nur Grundlinie, Versalhöhe und Mittenlage.',
      source(
        'core/src/compose.ts:102–114',
        'Die 2 mm der unteren Läufe waren für die mittige Box eine übernommene Annahme; seit ' +
          'dem Teilslice E-b gilt diese Übertragung nicht mehr.',
      ),
    ),
  );
}

function bottomLabelZone(
  side: 'left' | 'right',
  kind: SymbolKind,
  variant: BodyVariantId | undefined,
  profile: LayoutProfile,
): ZoneBinding {
  const key = formKey(kind, variant);
  const baselineSource = BOTTOM_LABEL_SOURCE[key] ?? BOTTOM_LABEL_DEFAULT;

  return measured(
    offset(
      'bottom-baseline',
      profile.bottomLabelBaselineFromBodyBottomMm,
      'body-bottom',
      'up',
      baselineSource,
    ),
    offset(
      'side-margin',
      COMPOSE_ZONE_CONSTANTS.LABEL_SIDE_MARGIN_MM,
      side === 'left' ? 'body-left' : 'body-right',
      'inward',
      source(
        'core/src/compose.ts:102–124',
        'Gemessen an den unteren Läufen von E.1.1 bis E.1.16 (linke Tintenkante 3,03, rechte ' +
          '29,03 bei Körperkanten 1 und 31). Gegen die **Körperkante** sind es 2 mm statt der ' +
          '1 mm des weißen Innenfelds; der sichtbare Abstand ist derselbe wie in der Referenz.',
        babz('E.1.1–E.1.16'),
      ),
    ),
    size(
      'bottom-cap-height',
      COMPOSE_ZONE_CONSTANTS.BOTTOM_LABEL_CAP_HEIGHT_MM,
      'height',
      source(
        'core/src/compose.ts:248–250, 250–262',
        'Versalhöhe der unteren Schriftgrade, gemessen an E.1.1 bis E.1.16. Der Schriftgrad ' +
          '(4,24 mm) ist daraus über `ARIMO_CAP_HEIGHT_FRACTION` abgeleitet: an der Referenz ist ' +
          'die Versalhöhe ablesbar, der Schriftgrad nicht.',
        babz('E.1.1–E.1.16'),
      ),
    ),
  );
}

function bottomCenterZone(
  kind: SymbolKind,
  variant: BodyVariantId | undefined,
  profile: LayoutProfile,
): ZoneBinding {
  const baselineMm = profile.bottomCenterBaselineFromBodyBottomMm;
  if (baselineMm === undefined) {
    return notMeasured(
      'combination',
      'schema/src/taxonomy.ts:588–595',
      'Profile ohne eingetragene `bottomCenter`-Zone lehnt `compose()` fail-closed ab. Gemessen ' +
        'ist die Zone bisher nur an der Formation (F.1.18/F.1.20) und an `circle-12/foot-band` ' +
        '(G.3.5).',
    );
  }

  const key = formKey(kind, variant);
  const measures: ZoneMeasure[] = [
    offset(
      'bottom-center-baseline',
      baselineMm,
      'body-bottom',
      'up',
      provenanceFor(BOTTOM_CENTER_SOURCE, key, 'die unten mittige Grundlinie'),
    ),
    rule(
      'bottom-center-anchor',
      'Um x = 16,0 mm zentriert, im Schriftgrad der unteren Zonen.',
      source(
        'schema/src/taxonomy.ts:588–595',
        'Beide belegten Läufe sind um x = 16,0 mm zentriert und verwenden den Schriftgrad der ' +
          'unteren Zonen.',
      ),
    ),
  ];

  if (profile.bottomCenterInk !== undefined) {
    measures.push(
      rule(
        'bottom-center-ink',
        `Tinte des Laufs: ${profile.bottomCenterInk}.`,
        source(
          'core/src/layout/profiles.ts:490–495',
          'G.3.5: Der in Pfade umgewandelte Diesel-Lauf ist in der Referenz schwarz, nicht weiß. ' +
            'Ohne Angabe gilt weiter die Körperfarben-Ableitung.',
          babz('G.3.5'),
        ),
      ),
    );
  }

  return measured(...measures);
}

function topLeftZone(
  kind: SymbolKind,
  variant: BodyVariantId | undefined,
  profile: LayoutProfile,
): ZoneBinding {
  const baselineMm = profile.topLeftBaselineFromBodyTopMm;
  if (baselineMm === undefined) {
    return notMeasured(
      'combination',
      'core/src/layout/profiles.ts:77–99',
      'Fehlt die Grundlinie, ist die Zone an dieser Körperform nicht vermessen und `compose()` ' +
        'wirft, statt eine Lage zu raten. Die 5,0 mm der Formation gehören nicht als stille ' +
        'Miterbschaft an die zehn Körperformen, die sich `rectBodyProfile` teilen.',
    );
  }

  const key = formKey(kind, variant);
  const baselineSource =
    TOP_LEFT_BASELINE_SOURCE[key] ?? TOP_LEFT_BASELINE_SOURCE[kind] ?? TOP_LEFT_BASELINE_INHERITED;

  const measures: ZoneMeasure[] = [
    offset('top-left-baseline', baselineMm, 'body-top', 'down', baselineSource),
    offset(
      'top-left-anchor',
      COMPOSE_ZONE_CONSTANTS.TOP_LEFT_LABEL_ANCHOR_FROM_BODY_LEFT_MM,
      'body-left',
      'right',
      source(
        'core/src/compose.ts:126–139',
        'Zurückgerechnet und nicht abgelesen: dieselben Läufe mit Anker 3,0 mm gerastert ' +
          '(4096 px, 18. August 2026) und die Differenz abgezogen ergibt 2,524 für `MTF`/`RettD`, ' +
          '2,498 für `SEG` und 2,442 für `10` — vier der fünf F-a-Läufe auf 2,5 mm, also 1,5 mm ' +
          'rechts der Körperkante 1,0. Ausreißer ist F.1.3 („5.000", zurückgerechnet 2,022). ' +
          'Gemessen ist die Zahl an der **Formation**; an den übrigen Profilen ist sie übertragen.',
        babz('F.1.1–F.1.11'),
      ),
    ),
  ];

  if (profile.topLeftLines !== undefined) {
    const [firstMm, secondMm] = profile.topLeftLines.baselinesFromBodyTopMm;
    const linesSource =
      key === 'vehicle-land/plain-wheel-pair'
        ? source(
            'core/src/layout/profiles.ts:328–348',
            'F.2.8: Grundlinien 11,54/15,07 mm bei Körperoberkante 5,75, also 5,79 und 9,32 mm; ' +
              'gemeinsame Versalhöhe 2,43 mm. **Benannte Ausnahme (LFH-597):** die erste Zeile ' +
              'liegt 0,96 mm über der einzeiligen Grundlinie 6,75. Beide Lagen sind an dieser ' +
              'Fassung gemessen (6,75 an F.2.1 bis F.2.5, 5,79 an F.2.8); die Referenz führt zwei.',
            babz('F.2.8'),
          )
        : source(
            'core/src/layout/profiles.ts:263–274',
            'Zwei gemeinsam vermessene obere Läufe am F.2-Landfahrzeugrumpf; die erste Zeile ist ' +
              'die einzeilige Grundlinie 6,75 mm, die zweite steht 4,0 mm darunter. Der Fundort ' +
              'nennt für die zweite Zeile keinen eigenen Abschnitt.',
          );

    measures.push(
      offset('top-left-line-1-baseline', firstMm, 'body-top', 'down', linesSource),
      offset('top-left-line-2-baseline', secondMm, 'body-top', 'down', linesSource),
      size('top-left-lines-cap-height', profile.topLeftLines.capHeightMm, 'height', linesSource),
    );
  }

  if (profile.requiresTopLeftMetrics === true) {
    measures.push(
      rule(
        'top-left-requires-metrics',
        'Dieses Profil belegt `topLeft` ausschließlich mit einem vollständigen je-Spec-Metriksatz.',
        source(
          'core/src/layout/profiles.ts:100–101, 339–346',
          UNDOCUMENTED_AT_SOURCE +
            'Der Fundort nennt für diese Forderung keinen Abschnitt und kein Messdatum.',
        ),
      ),
    );
  }

  return measured(...measures);
}

function aboveLeftZone(
  kind: SymbolKind,
  variant: BodyVariantId | undefined,
  profile: LayoutProfile,
): ZoneBinding {
  const baselineMm = profile.aboveLeftBaselineFromBodyTopMm;
  if (baselineMm === undefined) {
    return notMeasured(
      'combination',
      'core/src/layout/profiles.ts:102–105',
      'Ein linksbündiger Lauf oberhalb des Körpers ist an dieser Körperform nicht vermessen. ' +
        'Belegt ist er bisher an `vehicle-air/raised-hull` (F.2.6/F.2.7), an ' +
        '`vehicle-air/fixed-wing-hull` und an der abgesenkten I.5-Personraute.',
    );
  }

  const provenance = provenanceFor(
    ABOVE_LEFT_SOURCE,
    formKey(kind, variant),
    'den Lauf oberhalb des Körpers',
  );
  const measures: ZoneMeasure[] = [
    offset('above-left-baseline', baselineMm, 'body-top', 'down', provenance),
  ];

  if (profile.aboveLeftAnchorFromBodyLeftMm !== undefined) {
    measures.push(
      offset(
        'above-left-anchor',
        profile.aboveLeftAnchorFromBodyLeftMm,
        'body-left',
        'right',
        provenance,
      ),
    );
  }

  return measured(...measures);
}

function belowRightZone(
  kind: SymbolKind,
  variant: BodyVariantId | undefined,
  profile: LayoutProfile,
): ZoneBinding {
  const below = profile.belowRight;
  if (below === undefined) {
    return notMeasured(
      'combination',
      'core/src/layout/profiles.ts:139–144',
      'Vermessene Zone rechts unterhalb des Körpers. Fehlt sie, ist die Zone an dieser ' +
        'Körperform nicht zulässig — belegt ist sie an `vehicle-water/raised-hull` ' +
        '(E.2.27–E.2.31) und an `circle-12/foot-band` (G.3.5).',
    );
  }

  const provenance = provenanceFor(
    BELOW_RIGHT_SOURCE,
    formKey(kind, variant),
    'den Lauf rechts unterhalb des Körpers',
  );
  return measured(
    offset('below-right-baseline', below.baselineFromBodyBottomMm, 'body-bottom', 'down', provenance),
    offset('below-right-anchor', below.anchorFromBodyRightMm, 'body-right', 'right', provenance),
    rule('below-right-ink', `Tinte des Laufs: ${below.ink}.`, provenance),
  );
}

function surfaceZone(
  side: 'left' | 'right',
  kind: SymbolKind,
  variant: BodyVariantId | undefined,
  profile: LayoutProfile,
): ZoneBinding {
  const surface = profile.surfaceLabels;
  const anchorMm =
    side === 'left' ? surface?.leftAnchorFromBodyLeftMm : surface?.rightAnchorFromBodyRightMm;

  if (surface === undefined || anchorMm === undefined) {
    return notMeasured(
      'combination',
      'core/src/layout/profiles.ts:111–116',
      `Ein schwarzer Oberflächenlauf ${side === 'left' ? 'links' : 'rechts'} unterhalb des ` +
        'Körpers ist an dieser Körperform nicht vermessen. Belegt sind ' +
        '`vehicle-air/raised-hull` (nur rechts, F.2.6/F.2.7) und `circle-12/raised-circle-1mm` ' +
        '(beide Seiten).',
    );
  }

  const provenance = provenanceFor(
    SURFACE_LABEL_SOURCE,
    formKey(kind, variant),
    'den Oberflächenlauf',
  );
  return measured(
    offset(
      'surface-baseline',
      surface.baselineFromBodyBottomMm,
      'body-bottom',
      'down',
      provenance,
    ),
    offset(
      'surface-anchor',
      anchorMm,
      side === 'left' ? 'body-left' : 'body-right',
      side === 'left' ? 'left' : 'right',
      provenance,
    ),
  );
}

/**
 * Das Zonenmodell einer Körperform, bei Bedarf je `BodyVariantId`.
 *
 * **Abgeleitet und nicht abgeschrieben.** Jede Zahl, die `profiles.ts` schon führt, wird hier
 * über `profileFor()` bezogen. Damit kann das Zonenmodell nicht von den Profilen weglaufen — und
 * eine Änderung an einem Profil erscheint hier, statt zwei Wahrheiten zu erzeugen. Allein die
 * sechs modulprivaten Konstanten aus `compose.ts` sind wiederholt; sie hält `zones.test.ts` mit
 * einem Quelltextscan an ihrem Fundort fest.
 */
export function zonesFor(kind: SymbolKind, variant?: BodyVariantId): BodyFormZones {
  const profile = profileFor(kind, variant);
  const zones: Record<ZoneId, ZoneBinding> = {
    body: bodyZone(kind, profile),
    head: headZone(kind, profile),
    chassis: chassisZone(kind, profile),
    'inner-field': innerFieldZone(kind, variant),
    foot: footZone(profile),
    'label-center': centerZone(kind, variant, profile),
    'label-bottom-left': bottomLabelZone('left', kind, variant, profile),
    'label-bottom-right': bottomLabelZone('right', kind, variant, profile),
    'label-bottom-center': bottomCenterZone(kind, variant, profile),
    'label-top-left': topLeftZone(kind, variant, profile),
    'label-above-left': aboveLeftZone(kind, variant, profile),
    'label-below-right': belowRightZone(kind, variant, profile),
    'label-surface-below-left': surfaceZone('left', kind, variant, profile),
    'label-surface-below-right': surfaceZone('right', kind, variant, profile),
    'state-margin': stateMarginZone(kind, variant),
    'tendency-margin': TENDENCY_MARGIN_GAP,
    'movement-anchor': MOVEMENT_ANCHOR_GAP,
  };
  return variant === undefined ? { kind, zones } : { kind, variant, zones };
}

/**
 * Alle Zonenkennungen. Entsteht wie `SYMBOL_KINDS` als Schlüssel eines `Record<ZoneId, true>`:
 * fehlt ein Wert der Union oder steht einer zu viel darin, lehnt der Compiler das Objekt ab —
 * Vollständigkeit per Typ, nicht per Test.
 */
export const ZONE_IDS: readonly ZoneId[] = Object.freeze(
  Object.keys({
    body: true,
    head: true,
    chassis: true,
    'inner-field': true,
    foot: true,
    'label-center': true,
    'label-bottom-left': true,
    'label-bottom-right': true,
    'label-bottom-center': true,
    'label-top-left': true,
    'label-above-left': true,
    'label-below-right': true,
    'label-surface-below-left': true,
    'label-surface-below-right': true,
    'state-margin': true,
    'tendency-margin': true,
    'movement-anchor': true,
  } satisfies Record<ZoneId, true>) as ZoneId[],
);

/**
 * Das Zonenmodell aller 19 Körperformen ohne Variante. `Record<SymbolKind, …>` und kein
 * `Partial`: eine fehlende Körperform lehnt der Compiler ab, wie bei `SYMBOL_KINDS`.
 */
export const ZONE_MODEL: Readonly<Record<SymbolKind, BodyFormZones>> = Object.freeze({
  formation: zonesFor('formation'),
  person: zonesFor('person'),
  'vehicle-land': zonesFor('vehicle-land'),
  'vehicle-air': zonesFor('vehicle-air'),
  'vehicle-water': zonesFor('vehicle-water'),
  post: zonesFor('post'),
  building: zonesFor('building'),
  container: zonesFor('container'),
  area: zonesFor('area'),
  measure: zonesFor('measure'),
  hazard: zonesFor('hazard'),
  point: zonesFor('point'),
  event: zonesFor('event'),
  'spontaneous-helper': zonesFor('spontaneous-helper'),
  trailer: zonesFor('trailer'),
  'swap-loader-vehicle': zonesFor('swap-loader-vehicle'),
  'upright-rectangle': zonesFor('upright-rectangle'),
  'circle-12': zonesFor('circle-12'),
  'reduced-house': zonesFor('reduced-house'),
} satisfies Record<SymbolKind, BodyFormZones>);

/**
 * Die Körperformvarianten mit eigenen Zonenmaßen — die 14 Zweige aus `profileFor()`. Die Liste
 * steht hier als Wert, weil `profileFor()` seine Zweige nicht ausgibt; `zones.test.ts` prüft sie
 * gegen alle 190 Paare aus `SYMBOL_KINDS` und `BODY_VARIANT_IDS`, sodass ein neuer Zweig hier
 * ankommt und keiner still verschwindet.
 */
export const ZONE_MODEL_BODY_VARIANTS: readonly BodyFormZones[] = Object.freeze([
  zonesFor('person', 'compact-person-diamond-26mm'),
  zonesFor('person', 'compact-person-diamond-26mm-lowered-2mm'),
  zonesFor('formation', 'foot-band'),
  zonesFor('vehicle-air', 'raised-hull'),
  zonesFor('vehicle-air', 'fixed-wing-hull'),
  zonesFor('vehicle-water', 'raised-hull'),
  zonesFor('vehicle-water', 'inset-hull'),
  zonesFor('vehicle-land', 'plain-wheel-pair'),
  zonesFor('vehicle-land', 'foot-band'),
  zonesFor('vehicle-land', 'inverted-hull-track'),
  zonesFor('trailer', 'foot-band'),
  zonesFor('circle-12', 'raised-gable'),
  zonesFor('circle-12', 'raised-circle-1mm'),
  zonesFor('circle-12', 'foot-band'),
]);

/** Alle belegten Körperfassungen: die 19 Körperformen und die 14 Variantenzweige. */
export const ZONE_MODEL_FORMS: readonly BodyFormZones[] = Object.freeze([
  ...Object.values(ZONE_MODEL),
  ...ZONE_MODEL_BODY_VARIANTS,
]);

/** Eine deklarierte Zonenlücke, flach ausgegeben für Gates und Berichte. */
export interface ZoneGapEntry {
  readonly form: string;
  readonly zone: ZoneId;
  readonly status: 'not-measured' | 'measured-absent';
  readonly scope: ZoneGapScope;
}

/**
 * Alle deklarierten Lücken des Modells, sortiert. `zones.test.ts` nagelt die Liste fest: weder
 * eine stille Schließung noch eine stille Erweiterung bleibt unbemerkt.
 */
export function zoneGaps(): readonly ZoneGapEntry[] {
  const entries: ZoneGapEntry[] = [];
  for (const form of ZONE_MODEL_FORMS) {
    for (const zone of ZONE_IDS) {
      const binding = form.zones[zone];
      if (binding.status === 'measured') continue;
      entries.push({
        form: formKey(form.kind, form.variant),
        zone,
        status: binding.status,
        scope: binding.gap.scope,
      });
    }
  }
  return entries.sort((a, b) => `${a.form}|${a.zone}`.localeCompare(`${b.form}|${b.zone}`));
}
