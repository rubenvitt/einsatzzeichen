import type { BlockEntry } from '@einsatzzeichen/schema';
import { UNDOCUMENTED_AT_SOURCE } from '../layout/zones.js';
import { babz, block, measured, notMeasured } from './helpers.js';

/**
 * Grundzeichen, Farbe und Fahrwerk (LFH-564).
 *
 * Jeder `definedAt` zeigt auf den Eintrag, den der Katalogresolver liest: `BODIES` und
 * `VARIANT_BODIES` für `baseDrawing()`, `ORGANIZATION_COLORS` für `organizationColor()` und den
 * `case`-Zweig von `vehicleChassis()`. Der Bereich beginnt beim Kommentar direkt über dem Eintrag,
 * wenn es einen gibt, sonst beim Schlüssel, und endet mit dem Eintrag. Genau das prüft
 * `catalog/src/block-register/base.test.ts` am Quelltext; verschiebt sich eine Zeile, bricht er.
 *
 * `sourceRefs` stehen nur dort, wo der Fundort selbst einen Abschnitt nennt. Bei den Grundzeichen
 * aus Kapitel 1 zählt dazu die Quellenangabe in `SECTIONS` desselben Moduls, weil `entry()` die
 * Zeichnung genau mit diesem Abschnitt ausgibt.
 *
 * **Keine Kombinationsbindung.** Die Regeln `vehicle-category-requires-vehicle`,
 * `plain-wheel-pair-chassis-conflict`, `inset-hull-requires-measured-organization`,
 * `circle-12-requires-hilfsorganisation` und `reduced-house-requires-hilfsorganisation` schränken
 * ein, welche Bausteine zusammen stehen dürfen. Sie gehören in den Regelkatalog. Keine davon setzt
 * einen dieser Bausteine nur als Teil eines anderen, wie es die Funktionsfassung mit der
 * Verwaltungsstufe tut.
 */

const BASE = 'catalog/src/base-symbols.ts';

/** Die Quellenangabe, mit der `entry()` ein Kapitel-1-Grundzeichen ausgibt (`SECTIONS`). */
function sections(line: number, asset: string): string {
  return `Den Abschnitt nennt der Katalogeintrag mit Quelle \`${asset}\` (\`SECTIONS\`, base-symbols.ts:${line}).`;
}

/**
 * Die 19 Körperformen aus `SYMBOL_KINDS` und die 14 Variantenzweige aus `VARIANT_BODIES`.
 *
 * Das Zonenmodell führt 13 Variantenzweige (`ZONE_MODEL_BODY_VARIANTS`), der Katalog 14. Der
 * Unterschied ist `trailer/foot-band`: `baseDrawing()` zeichnet ihn mit eigenem Fußband, das
 * Layoutprofil hat aber keinen eigenen Zweig dafür (`zones.test.ts` hält das fest).
 */
export const BASE_SYMBOL_BLOCKS: readonly BlockEntry[] = Object.freeze([
  block(
    'base-symbol',
    'formation',
    'body',
    measured(
      `${BASE}:273`,
      `Keine Messangabe am Körper. Rechteck 1/6 bis 31/26 mm. ${sections(889, '1.1_Taktische Formation.svg')}`,
      babz('1.1'),
    ),
  ),
  block(
    'base-symbol',
    'person',
    'body',
    measured(
      `${BASE}:274–283`,
      `Keine Messangabe am Körper. Gedrehtes Quadrat um (16|16), halbe Diagonale 15 mm (\`PERSON_HALF_SIDE\`, base-symbols.ts:20–21). ${sections(890, '1.2_Person.svg')}`,
      babz('1.2'),
    ),
  ),
  block(
    'base-symbol',
    'vehicle-land',
    'body',
    measured(
      `${BASE}:284–300`,
      '`1.3 Landfahrzeug`: Rechteck mit flacher Doppelkubik als Oberkante, gemessen an der Ebene `Flächige_Fülung`, die hier die Mittellinie verbatim trägt (Hülle 0,9998/5,7499/31,0000/26,0001).',
      babz('1.3'),
    ),
  ),
  block(
    'base-symbol',
    'vehicle-air',
    'body',
    measured(
      `${BASE}:301–317`,
      '`1.4 Luftfahrzeug`: Halbkreis r = 15 um (16|23) über einer waagerechten Sehne. Die Modellwerte treffen die gemessenen Kontrollpunkte auf höchstens 0,0003 mm; am Kennwertartefakt gegatet.',
      babz('1.4'),
    ),
  ),
  block(
    'base-symbol',
    'vehicle-water',
    'body',
    measured(
      `${BASE}:318–333`,
      '`1.5 Wasserfahrzeug`: gespiegelte Bauform von `1.4`, Halbkreis r = 15 um (16|9) unter einer waagerechten Sehne. Nicht zu verwechseln mit dem Rumpf aus E.2.27 bis E.2.31 (`vehicle-water/raised-hull`).',
      babz('1.5'),
    ),
  ),
  block(
    'base-symbol',
    'post',
    'body',
    measured(
      `${BASE}:334`,
      `Keine Messangabe am Körper. Kreis r = 14 mm um (16|16). ${sections(894, '1.6_Funktionsstelle.svg')}`,
      babz('1.6'),
    ),
  ),
  block(
    'base-symbol',
    'building',
    'body',
    measured(
      `${BASE}:335–347`,
      `Keine Messangabe am Körper. Geschlossener Polyzug (16|3) (1|10) (1|26) (31|26) (31|10). ${sections(895, '1.7_Gebäude.svg')} Die Traufkante trägt nur die Kapitel-1-Darstellung (\`CHAPTER_ONE_EXTRAS\`, base-symbols.ts:1188–1199).`,
      babz('1.7'),
    ),
  ),
  block(
    'base-symbol',
    'container',
    'body',
    measured(
      `${BASE}:348`,
      `Keine Messangabe am Körper. Rechteck 4/4 bis 28/28 mm. ${sections(896, '1.8_Behälter Ressource Raum Funkgerät.svg')}`,
      babz('1.8'),
    ),
  ),
  block(
    'base-symbol',
    'area',
    'body',
    measured(
      `${BASE}:349–360`,
      '`1.9 Gebiet`: Zehneck mit zehn Eckradien aus `AREA_CORNERS` und `AREA_RADII_MM`. Der Pfad trifft die zwanzig gemessenen Tangentenpunkte der Referenz auf höchstens 0,0008 mm.',
      babz('1.9'),
    ),
  ),
  block(
    'base-symbol',
    'measure',
    'body',
    measured(
      `${BASE}:361–378`,
      '`1.10 Maßnahme`: Dreieck mit der Spitze nach unten. Maße an der Referenz abgelesen, Geometrie eigenständig konstruiert; Strich blau, 1 mm, Ecken als Bevel (Fachreview vom 19.09.2026).',
      babz('1.10'),
    ),
  ),
  block(
    'base-symbol',
    'hazard',
    'body',
    measured(
      `${BASE}:379–394`,
      '`1.11 Gefahr`: Dreieck mit der Spitze nach oben, wie `1.10` mit rotem 1-mm-Strich und Bevel-Ecken.',
      babz('1.11'),
    ),
  ),
  block(
    'base-symbol',
    'point',
    'body',
    measured(
      `${BASE}:395–407`,
      `Keine Messangabe am Körper. Geschlossener Polyzug (8|1) (8|22) (16|31) (24|22) (24|1). ${sections(900, '1.12_Konkreter Punkt.svg')}`,
      babz('1.12'),
    ),
  ),
  block(
    'base-symbol',
    'event',
    'body',
    measured(
      `${BASE}:408–436`,
      '`1.13 Ereignis`: offener Polyzug (4|7) → (16|25) → (28|7), paarweise gemittelt aus sechs Umrisspunkten; die Offenheit ist per Strichaufweitung gegatet. Das einzige Grundzeichen ohne Organisationsfarbe.',
      babz('1.13'),
    ),
  ),
  block(
    'base-symbol',
    'spontaneous-helper',
    'body',
    measured(
      `${BASE}:437–473`,
      '`1.14 Spontanhelfer`: vier Kreisbögen um (16|16). Die Datei führt keine Füllebene; Mittellinie aus dem Ringpaar, Mittenabstand und Radius aus dem exakten Umkreis der Segmentendpunkte (d = 6,5066, R = 7,4934).',
      babz('1.14'),
    ),
  ),
  block(
    'base-symbol',
    'trailer',
    'body',
    measured(
      `${BASE}:474–492`,
      'Anhängerrumpf: Deckkurve von `1.3` waagerecht 0,9-fach um x = 31, gemessene Füllhülle 3,9998/5,7503/31,0000/26,0004 mm; der Füllpfad kommt in 17 der 661 Referenzdateien byteidentisch vor. Die Deichsel ist ein eigenes Primitiv (`EXTRA_PRIMITIVES`, base-symbols.ts:816–829).',
      babz('5.1.2.1'),
    ),
  ),
  block(
    'base-symbol',
    'swap-loader-vehicle',
    'body',
    measured(
      `${BASE}:493–512`,
      'Rumpf des Wechselladerfahrzeugs `E.2.15`: Deckkurve von `1.3` waagerecht 0,95-fach um x = 31, eigene Sehnenlage 6,0 und Unterkante 24,5; gemessene Füllhülle 2,5001/6,0000/31,0000/24,5004 mm. Der L-Rahmen ist ein eigenes Primitiv (`EXTRA_PRIMITIVES`, base-symbols.ts:830–844).',
      babz('E.2.15'),
    ),
  ),
  block(
    'base-symbol',
    'upright-rectangle',
    'body',
    measured(
      `${BASE}:513–532`,
      'Hochkantes Rechteck 26 × 28 mm von `E.2.26`, Mittellinie 3/2 bis 29/30 mm, gemessen aus dem Ringpaar der Strichebene und unabhängig bestätigt durch die Füllfläche.',
      babz('E.2.26'),
    ),
  ),
  block(
    'base-symbol',
    'circle-12',
    'body',
    measured(
      `${BASE}:533–546`,
      'Eigenständiger Kreiskörper der 17 Zeichen F.3.1 bis F.3.14 und F.3.17 bis F.3.19: Ringpaar außen r = 12,25, innen r = 11,75 mm um (16|16), Mittellinie r = 12 mm.',
      babz('F.3.1–F.3.14', 'F.3.17–F.3.19'),
    ),
  ),
  block(
    'base-symbol',
    'reduced-house',
    'body',
    measured(
      `${BASE}:547–563`,
      'Reduzierte Hauskontur aus F.3.15/F.3.16: fünf Eckpunkte als Mittellinie der gemeinsamen Kontur; die Dachschrägen treffen die Wände bei y 9,85 (Fachreview vom 19.09.2026).',
      babz('F.3.15', 'F.3.16'),
    ),
  ),

  // Variantenzweige aus `VARIANT_BODIES`, in Katalogreihenfolge.
  block(
    'base-symbol',
    'person/compact-person-diamond-26mm',
    'body',
    measured(
      `${BASE}:690–699`,
      `${UNDOCUMENTED_AT_SOURCE}gedrehtes Quadrat um (16|16). Die halbe Seitenlänge nennt die „I.5-Raute bei 13 mm halber Diagonale" (\`COMPACT_PERSON_HALF_SIDE\`, base-symbols.ts:22–23).`,
      babz('I.5'),
    ),
  ),
  block(
    'base-symbol',
    'person/compact-person-diamond-26mm-lowered-2mm',
    'body',
    measured(
      `${BASE}:700–709`,
      `${UNDOCUMENTED_AT_SOURCE}dieselbe I.5-Raute wie \`compact-person-diamond-26mm\`, Mittelpunkt (16|18) statt (16|16) (\`COMPACT_PERSON_HALF_SIDE\`, base-symbols.ts:22–23).`,
      babz('I.5'),
    ),
  ),
  block(
    'base-symbol',
    'formation/foot-band',
    'body',
    measured(
      `${BASE}:712`,
      `${UNDOCUMENTED_AT_SOURCE}Körper gleich \`formation\`; eigen ist das schwarze 3-mm-Fußband (\`VARIANT_EXTRA_PRIMITIVES\`, base-symbols.ts:570–580).`,
    ),
  ),
  block(
    'base-symbol',
    'trailer/foot-band',
    'body',
    measured(
      `${BASE}:715`,
      `${UNDOCUMENTED_AT_SOURCE}Körper ist \`BODIES.trailer\`; eigen ist das Fußband 4/23, 27 × 3 mm (\`VARIANT_EXTRA_PRIMITIVES\`, base-symbols.ts:634–639). Das Zonenmodell führt diesen Zweig nicht.`,
    ),
  ),
  block(
    'base-symbol',
    'vehicle-water/raised-hull',
    'body',
    measured(
      `${BASE}:718–723`,
      'Rumpf der fünf Wasserfahrzeuge `E.2.27` bis `E.2.31`: gegenüber `1.5` um 1,0002 mm angehoben und um den Faktor 0,999318 verkleinert; größte Abweichung der erzeugten Stützpunkte von den gemessenen 0,0002 mm (Kommentar an `VARIANT_BODIES`, base-symbols.ts:664–687).',
      babz('E.2.27–E.2.31'),
    ),
  ),
  block(
    'base-symbol',
    'vehicle-water/inset-hull',
    'body',
    measured(
      `${BASE}:724–729`,
      `${UNDOCUMENTED_AT_SOURCE}Halbkreis wie \`raised-hull\`, Sehne 9,0001. Der Kommentar an \`VARIANT_BODIES\` (base-symbols.ts:683–686) nennt für I.3 diese Sehnenlage, ordnet sie aber nicht dieser Variante zu.`,
    ),
  ),
  block(
    'base-symbol',
    'vehicle-air/raised-hull',
    'body',
    measured(
      `${BASE}:732–737`,
      `${UNDOCUMENTED_AT_SOURCE}Halbkreis über der Sehne 20,9898; die Keile unter dem Rumpf stehen in \`VARIANT_EXTRA_PRIMITIVES\` (base-symbols.ts:583–594).`,
    ),
  ),
  block(
    'base-symbol',
    'vehicle-air/fixed-wing-hull',
    'body',
    measured(
      `${BASE}:738–743`,
      `${UNDOCUMENTED_AT_SOURCE}Körper gleich \`vehicle-air/raised-hull\`; eigen sind die Flügelformen in \`VARIANT_EXTRA_PRIMITIVES\` (base-symbols.ts:595–608).`,
    ),
  ),
  block(
    'base-symbol',
    'vehicle-land/foot-band',
    'body',
    measured(
      `${BASE}:746`,
      `${UNDOCUMENTED_AT_SOURCE}Körper ist \`BODIES['vehicle-land']\`; eigen ist das schwarze 3-mm-Fußband (\`VARIANT_EXTRA_PRIMITIVES\`, base-symbols.ts:611–621).`,
    ),
  ),
  block(
    'base-symbol',
    'vehicle-land/plain-wheel-pair',
    'body',
    measured(
      `${BASE}:747`,
      `${UNDOCUMENTED_AT_SOURCE}Körper ist \`BODIES['vehicle-land']\`; eigen sind die zwei Radringe (\`VARIANT_EXTRA_PRIMITIVES\`, base-symbols.ts:622–631). Offen ist LFH-597, die zwei oberen Grundlinien dieser Fassung (core/src/layout/zones.ts:916–923). Das betrifft die Beschriftung und nicht diese Zeichnung, und das Register wählt keine der beiden Zahlen.`,
    ),
  ),
  block(
    'base-symbol',
    'vehicle-land/inverted-hull-track',
    'body',
    measured(
      `${BASE}:748–753`,
      `${UNDOCUMENTED_AT_SOURCE}Rechteck mit nach oben gewölbter Unterkante, Pfad als Literal.`,
    ),
  ),
  block(
    'base-symbol',
    'circle-12/foot-band',
    'body',
    measured(
      `${BASE}:756`,
      `${UNDOCUMENTED_AT_SOURCE}Körper ist \`BODIES['circle-12']\`; eigen ist das Kreissegment als Fußband (\`VARIANT_EXTRA_PRIMITIVES\`, base-symbols.ts:642–651).`,
    ),
  ),
  block(
    'base-symbol',
    'circle-12/raised-gable',
    'body',
    measured(
      `${BASE}:757–770`,
      'F.3.5/F.3.14: derselbe 12-mm-Kreis, zwei Millimeter abgesenkt. Der separat vermessene Giebel steht in `VARIANT_EXTRA_PRIMITIVES` (base-symbols.ts:652–660). Quellgeometrie identisch mit J.3.2, dessen Katalogfassung `stationBody(17, 11.5)` aber nicht als Vorlage dient.',
      babz('F.3.5', 'F.3.14'),
    ),
  ),
  block(
    'base-symbol',
    'circle-12/raised-circle-1mm',
    'body',
    measured(
      `${BASE}:771–778`,
      `${UNDOCUMENTED_AT_SOURCE}12-mm-Kreis mit Mittelpunkt (16|15), also 1 mm angehoben.`,
    ),
  ),
]);

const ORGANIZATIONS = 'catalog/src/organizations.ts';

/** Die Herkunftsaussage am Kopf von `ORGANIZATION_COLORS` (organizations.ts:3–24). */
const CHAPTER_TWO =
  'Aus Kapitel 2 der BBK/BABZ-Empfehlung abgeleitet, Werte per `pnpm cli audit:reference` gegen `fingerprints.json` belegt (organizations.ts:4–5).';

/**
 * Die neun Organisationsfarben. Seit LFH-424 sind alle neun `OrganizationId`-Werte belegt; der
 * Wurf in `organizationColor()` ist unerreichbar. Einen Abschnitt je Organisation nennt der
 * Fundort nur für die Hilfsorganisation (2.2) und die Bundespolizei (N.1.3).
 */
export const COLOR_BLOCKS: readonly BlockEntry[] = Object.freeze([
  block('color', 'feuerwehr', 'body', measured(`${ORGANIZATIONS}:26`, `Farbton \`rot\`. ${CHAPTER_TWO}`)),
  block('color', 'thw', 'body', measured(`${ORGANIZATIONS}:27`, `Farbton \`blau\`. ${CHAPTER_TWO}`)),
  block(
    'color',
    'fuehrung-leitung',
    'body',
    measured(`${ORGANIZATIONS}:28`, `Farbton \`gelb\`. ${CHAPTER_TWO}`),
  ),
  block('color', 'polizei', 'body', measured(`${ORGANIZATIONS}:29`, `Farbton \`gruen\`. ${CHAPTER_TWO}`)),
  block(
    'color',
    'bundespolizei',
    'body',
    measured(
      `${ORGANIZATIONS}:30`,
      `Farbton \`hellgruen\`. Anhang N.1.3 belegt die Bundespolizei als eigenständige hellgrüne Organisation; sie darf nicht mit der grünen Polizei kollabieren (organizations.ts:6–7).`,
      babz('N.1.3'),
    ),
  ),
  block(
    'color',
    'bundeswehr',
    'body',
    measured(`${ORGANIZATIONS}:31`, `Farbton \`braun\`. ${CHAPTER_TWO}`),
  ),
  block(
    'color',
    'sonstige-gefahrenabwehr',
    'body',
    measured(`${ORGANIZATIONS}:32`, `Farbton \`orange\`. ${CHAPTER_TWO}`),
  ),
  block(
    'color',
    'zivile-einheiten',
    'body',
    measured(`${ORGANIZATIONS}:33`, `Farbton \`hellgrau\`. ${CHAPTER_TWO}`),
  ),
  block(
    'color',
    'hilfsorganisation',
    'body',
    measured(
      `${ORGANIZATIONS}:34`,
      'Farbton `weiss`. `2.2_Organisationen.svg` trägt einen vollflächigen Fleck `#ffffff` über 0/0/32/32, seine Typo-Ebene liest gerastert „HiOrg". Vorbehalt: `#ffffff` ist zugleich die neutrale Grundfüllung; ein Zeichen mit dieser Organisation ist von einem organisationslosen farblich nicht unterscheidbar (organizations.ts:9–23).',
      babz('2.2'),
    ),
  ),
]);

const CHASSIS = 'catalog/src/vehicle-categories.ts';

/**
 * Die Fahrwerkszone je Fahrzeugkategorie. Vermessen sind genau die Kategorien aus
 * `MEASURED_VEHICLE_CATEGORIES` (vehicle-categories.ts:203–216). Die Abschnitte stehen an den
 * Radplatzkonstanten, nicht am `case`-Zweig; die Notiz nennt jeweils die Konstante.
 */
export const CHASSIS_BLOCKS: readonly BlockEntry[] = Object.freeze([
  block(
    'chassis',
    'kfz-kategorie-1',
    'chassis',
    measured(
      `${CHASSIS}:146–150`,
      'Die äußeren zwei der drei festen Radplätze, vermessen an `5.1.1.1` (3,7502 / 28,2499) und an den E.2-Zeichen dieser Kategorie (`KFZ_SLOTS_MM`, vehicle-categories.ts:26–39). Radius und Zonenhöhe: vehicle-categories.ts:4–24.',
      babz('5.1.1.1'),
    ),
  ),
  block(
    'chassis',
    'kfz-kategorie-2',
    'chassis',
    measured(
      `${CHASSIS}:151–152`,
      'Alle drei festen Radplätze, vermessen an `5.1.1.2` (3,7502 / 16,0001 / 28,2499) und an den E.2-Zeichen dieser Kategorie (`KFZ_SLOTS_MM`, vehicle-categories.ts:26–39).',
      babz('5.1.1.2'),
    ),
  ),
  block(
    'chassis',
    'kfz-kategorie-3',
    'chassis',
    measured(
      `${CHASSIS}:153–160`,
      'Alle drei Radplätze wie Kategorie 2 und der Verbindungsstrich, der sie allein unterscheidet (`KFZ_SLOTS_MM`, vehicle-categories.ts:26–39). Belegt ist das Bild, nicht der Endpunkt des Strichs: die Endpunkte liegen in einem gemessenen Band und sind auf die Ringmittellinie gesetzt (`bars()`, vehicle-categories.ts:93–117).',
      babz('5.1.1.3'),
    ),
  ),
  block(
    'chassis',
    'kettenfahrzeug',
    'chassis',
    measured(
      `${CHASSIS}:161–173`,
      'Kettenstadion mit den Endmitten 4,25 und 27,75 mm, vermessen am Innenstadion von `5.1.1.5`; der Einzug von 0,5 mm gegenüber den Radplätzen ist gemessen und nicht ableitbar (`TRACK_END_CX_MM`, vehicle-categories.ts:73–81).',
      babz('5.1.1.5'),
    ),
  ),
  block(
    'chassis',
    'schienenfahrzeug',
    'chassis',
    measured(
      `${CHASSIS}:174–175`,
      'Radplätze 3,7504 / 9,2505 / 22,7499 / 28,2501 mm, vermessen an `5.1.1.6`; eigene Liste, keine Ableitung aus den Kfz-Plätzen (`RAIL_SLOTS_MM`, vehicle-categories.ts:41–48).',
      babz('5.1.1.6'),
    ),
  ),
  block(
    'chassis',
    'anhaenger-ein-rad',
    'chassis',
    measured(
      `${CHASSIS}:176–177`,
      'Ein Radplatz bei cx 17,4999, vermessen an `5.1.2.4_Anhänger_von PKW gezogen.svg` und an E.2.22, E.2.23, E.2.25 zahlengleich wiedergefunden (`TRAILER_SINGLE_SLOT_MM`, vehicle-categories.ts:50–59).',
      babz('5.1.2.4'),
    ),
  ),
  block(
    'chassis',
    'anhaenger-zwei-raeder',
    'chassis',
    measured(
      `${CHASSIS}:178–179`,
      'Zwei Radplätze bei cx 14,2501 und 19,7503, vermessen an `5.1.2.5_Anhänger_von LKW gezogen.svg` und an E.2.24 zahlengleich wiedergefunden (`TRAILER_PAIR_SLOTS_MM`, vehicle-categories.ts:61–71).',
      babz('5.1.2.5'),
    ),
  ),
  block(
    'chassis',
    'amphibienfahrzeug',
    'chassis',
    notMeasured(
      `${CHASSIS}:180–199`,
      'Die zwei Radplätze von 5.1.1.4 sind vermessen (3,75 / 28,25 mm wie Kategorie 1), die Wellenlinie nur als Strichhülle 7,4263/26,7000/24,5756/29,7998 mm und nicht in ihrer Kurvenform. Ohne diese Form wäre ein Amphibienfahrzeug von einem Kraftfahrzeug der Kategorie 1 nicht zu unterscheiden; `vehicleChassis()` wirft `NotMeasuredError`.',
    ),
  ),
]);
