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
 * `core/src/blocks/base.test.ts` am Quelltext; verschiebt sich eine Zeile, bricht er.
 *
 * `sourceRefs` stehen nur dort, wo der Fundort selbst einen Abschnitt nennt. Bei den Grundzeichen
 * aus Kapitel 1 zählt dazu die Quellenangabe in `SECTIONS` desselben Moduls, weil `entry()` die
 * Zeichnung genau mit diesem Abschnitt ausgibt.
 *
 * **Keine Kombinationsbindung.** Die Regeln `vehicle-category-requires-vehicle`,
 * `plain-wheel-pair-chassis-conflict` schränkt ein, welche Bausteine zusammen stehen dürfen (die
 * Organisationsregeln an Kreis, Hauskontur und eingesenktem Rumpf sind am 2. Oktober 2026
 * gefallen). Sie gehört in den Regelkatalog. Keine davon setzt
 * einen dieser Bausteine nur als Teil eines anderen, wie es die Funktionsfassung mit der
 * Verwaltungsstufe tut.
 */

const BASE = 'core/src/geometry/base-symbols.ts';
const CONTAINERS = 'core/src/geometry/container-bodies.ts';
const SPECIAL_FORMS = 'core/src/geometry/special-form-bodies.ts';

/** Die Quellenangabe, mit der `entry()` ein Kapitel-1-Grundzeichen ausgibt (`SECTIONS`). */
function sections(line: number, asset: string): string {
  return `Den Abschnitt nennt der Katalogeintrag mit Quelle \`${asset}\` (\`SECTIONS\`, base-symbols.ts:${line}).`;
}

/**
 * Die 29 Körperformen aus `SYMBOL_KINDS` und die 17 Variantenzweige aus `VARIANT_BODIES`.
 *
 * Seit LFH-786 führt das Zonenmodell auch `trailer/foot-band` mit eigenem Profil, seit dem
 * 2. Oktober 2026 zusätzlich die drei Fassungen der Funktionsstelle. Katalog und Zonenmodell
 * führen damit dieselben 17 Zweige (`ZONE_MODEL_BODY_VARIANTS`, `zones.test.ts` hält das fest).
 */
export const BASE_SYMBOL_BLOCKS: readonly BlockEntry[] = Object.freeze([
  block(
    'base-symbol',
    'formation',
    'body',
    measured(
      `${BASE}:287`,
      `Keine Messangabe am Körper. Rechteck 1/6 bis 31/26 mm. ${sections(902, '1.1_Taktische Formation.svg')}`,
      babz('1.1'),
    ),
  ),
  block(
    'base-symbol',
    'person',
    'body',
    measured(
      `${BASE}:288–297`,
      `Keine Messangabe am Körper. Gedrehtes Quadrat um (16|16), halbe Diagonale 15 mm (\`PERSON_HALF_SIDE\`, base-symbols.ts:34–35). ${sections(903, '1.2_Person.svg')}`,
      babz('1.2'),
    ),
  ),
  block(
    'base-symbol',
    'vehicle-land',
    'body',
    measured(
      `${BASE}:298–314`,
      '`1.3 Landfahrzeug`: Rechteck mit flacher Doppelkubik als Oberkante, gemessen an der Ebene `Flächige_Fülung`, die hier die Mittellinie verbatim trägt (Hülle 0,9998/5,7499/31,0000/26,0001).',
      babz('1.3'),
    ),
  ),
  block(
    'base-symbol',
    'vehicle-air',
    'body',
    measured(
      `${BASE}:315–331`,
      '`1.4 Luftfahrzeug`: Halbkreis r = 15 um (16|23) über einer waagerechten Sehne. Die Modellwerte treffen die gemessenen Kontrollpunkte auf höchstens 0,0003 mm; am Kennwertartefakt gegatet.',
      babz('1.4'),
    ),
  ),
  block(
    'base-symbol',
    'vehicle-water',
    'body',
    measured(
      `${BASE}:332–347`,
      '`1.5 Wasserfahrzeug`: gespiegelte Bauform von `1.4`, Halbkreis r = 15 um (16|9) unter einer waagerechten Sehne. Nicht zu verwechseln mit dem Rumpf aus E.2.27 bis E.2.31 (`vehicle-water/raised-hull`).',
      babz('1.5'),
    ),
  ),
  block(
    'base-symbol',
    'post',
    'body',
    measured(
      `${BASE}:348`,
      `Keine Messangabe am Körper. Kreis r = 14 mm um (16|16). ${sections(907, '1.6_Funktionsstelle.svg')}`,
      babz('1.6'),
    ),
  ),
  block(
    'base-symbol',
    'building',
    'body',
    measured(
      `${BASE}:349–361`,
      `Keine Messangabe am Körper. Geschlossener Polyzug (16|3) (1|10) (1|26) (31|26) (31|10). ${sections(908, '1.7_Gebäude.svg')} Die Traufkante trägt nur die Kapitel-1-Darstellung (\`CHAPTER_ONE_EXTRAS\`, base-symbols.ts:1327–1338).`,
      babz('1.7'),
    ),
  ),
  block(
    'base-symbol',
    'container',
    'body',
    measured(
      `${BASE}:362`,
      `Keine Messangabe am Körper. Rechteck 4/4 bis 28/28 mm. ${sections(909, '1.8_Behälter Ressource Raum Funkgerät.svg')}`,
      babz('1.8'),
    ),
  ),
  block(
    'base-symbol',
    'area',
    'body',
    measured(
      `${BASE}:363–374`,
      '`1.9 Gebiet`: Zehneck mit zehn Eckradien aus `AREA_CORNERS` und `AREA_RADII_MM`. Der Pfad trifft die zwanzig gemessenen Tangentenpunkte der Referenz auf höchstens 0,0008 mm.',
      babz('1.9'),
    ),
  ),
  block(
    'base-symbol',
    'measure',
    'body',
    measured(
      `${BASE}:375–392`,
      '`1.10 Maßnahme`: Dreieck mit der Spitze nach unten. Maße an der Referenz abgelesen, Geometrie eigenständig konstruiert; Strich blau, 1 mm, Ecken als Bevel (Fachreview vom 19.09.2026).',
      babz('1.10'),
    ),
  ),
  block(
    'base-symbol',
    'hazard',
    'body',
    measured(
      `${BASE}:393–408`,
      '`1.11 Gefahr`: Dreieck mit der Spitze nach oben, wie `1.10` mit rotem 1-mm-Strich und Bevel-Ecken.',
      babz('1.11'),
    ),
  ),
  block(
    'base-symbol',
    'point',
    'body',
    measured(
      `${BASE}:409–421`,
      `Keine Messangabe am Körper. Geschlossener Polyzug (8|1) (8|22) (16|31) (24|22) (24|1). ${sections(913, '1.12_Konkreter Punkt.svg')}`,
      babz('1.12'),
    ),
  ),
  block(
    'base-symbol',
    'event',
    'body',
    measured(
      `${BASE}:422–450`,
      '`1.13 Ereignis`: offener Polyzug (4|7) → (16|25) → (28|7), paarweise gemittelt aus sechs Umrisspunkten; die Offenheit ist per Strichaufweitung gegatet. Das einzige Grundzeichen ohne Organisationsfarbe.',
      babz('1.13'),
    ),
  ),
  block(
    'base-symbol',
    'spontaneous-helper',
    'body',
    measured(
      `${BASE}:451–487`,
      '`1.14 Spontanhelfer`: vier Kreisbögen um (16|16). Die Datei führt keine Füllebene; Mittellinie aus dem Ringpaar, Mittenabstand und Radius aus dem exakten Umkreis der Segmentendpunkte (d = 6,5066, R = 7,4934).',
      babz('1.14'),
    ),
  ),
  block(
    'base-symbol',
    'trailer',
    'body',
    measured(
      `${BASE}:488–506`,
      'Anhängerrumpf: Deckkurve von `1.3` waagerecht 0,9-fach um x = 31, gemessene Füllhülle 3,9998/5,7503/31,0000/26,0004 mm; der Füllpfad kommt in 17 der 661 Referenzdateien byteidentisch vor. Die Deichsel ist ein eigenes Primitiv (`EXTRA_PRIMITIVES`, base-symbols.ts:842–855).',
      babz('5.1.2.1'),
    ),
  ),
  block(
    'base-symbol',
    'swap-loader-vehicle',
    'body',
    measured(
      `${BASE}:507–526`,
      'Rumpf des Wechselladerfahrzeugs `E.2.15`: Deckkurve von `1.3` waagerecht 0,95-fach um x = 31, eigene Sehnenlage 6,0 und Unterkante 24,5; gemessene Füllhülle 2,5001/6,0000/31,0000/24,5004 mm. Der L-Rahmen ist ein eigenes Primitiv (`EXTRA_PRIMITIVES`, base-symbols.ts:856–870).',
      babz('E.2.15'),
    ),
  ),
  block(
    'base-symbol',
    'upright-rectangle',
    'body',
    measured(
      `${BASE}:527–546`,
      'Hochkantes Rechteck 26 × 28 mm von `E.2.26`, Mittellinie 3/2 bis 29/30 mm, gemessen aus dem Ringpaar der Strichebene und unabhängig bestätigt durch die Füllfläche.',
      babz('E.2.26'),
    ),
  ),
  block(
    'base-symbol',
    'circle-12',
    'body',
    measured(
      `${BASE}:547–560`,
      'Eigenständiger Kreiskörper der 17 Zeichen F.3.1 bis F.3.14 und F.3.17 bis F.3.19: Ringpaar außen r = 12,25, innen r = 11,75 mm um (16|16), Mittellinie r = 12 mm.',
      babz('F.3.1–F.3.14', 'F.3.17–F.3.19'),
    ),
  ),
  block(
    'base-symbol',
    'reduced-house',
    'body',
    measured(
      `${BASE}:561–577`,
      'Reduzierte Hauskontur aus F.3.15/F.3.16: fünf Eckpunkte als Mittellinie der gemeinsamen Kontur; die Dachschrägen treffen die Wände bei y 9,85 (Fachreview vom 19.09.2026).',
      babz('F.3.15', 'F.3.16'),
    ),
  ),

  // Die acht Behälterformen aus Kapitel 5.1 (ESZ-117), in `CONTAINER_BODIES`.
  block(
    'base-symbol',
    'roll-off-loader',
    'body',
    measured(
      `${CONTAINERS}:160–173`,
      'Abrollbehälter auf dem Wechselladerrahmen: Füllkörper x 4…31, Unterkante 25,0, Sehne beidseits 6,0, Scheitel (17,5|8,0), eigene symmetrische Deckkurve (Kontrollpunkte 28/7 und 23/8). L-Rahmen und Öse sind eigene Primitive (`CONTAINER_EXTRAS`).',
      babz('5.1.1.8'),
    ),
  ),
  block(
    'base-symbol',
    'swap-container-carrier',
    'body',
    measured(
      `${CONTAINERS}:174–178`,
      'Wechselbehälter auf dem Wechselladerrahmen: Füllrechteck 3/8 bis 31/25 mm. L-Rahmen und die beiden Eckbeschläge (r 1,8) sind eigene Primitive (`CONTAINER_EXTRAS`).',
      babz('5.1.1.9'),
    ),
  ),
  block(
    'base-symbol',
    'roll-off-trailer',
    'body',
    measured(
      `${CONTAINERS}:179–191`,
      'Abrollbehälter auf dem Anhängerrahmen: Füllkörper x 7…31, Unterkante 24,0, Sehne beidseits 6,0, Scheitel (19|8). Rahmen, Deichsel und Öse sind eigene Primitive (`CONTAINER_EXTRAS`).',
      babz('5.1.2.2'),
    ),
  ),
  block(
    'base-symbol',
    'swap-container-trailer',
    'body',
    measured(
      `${CONTAINERS}:192–196`,
      'Wechselbehälter auf dem Anhängerrahmen: Füllrechteck 6/8 bis 31/24 mm. Rahmen, Deichsel und die beiden Eckbeschläge (r 2,0) sind eigene Primitive (`CONTAINER_EXTRAS`).',
      babz('5.1.2.3'),
    ),
  ),
  block(
    'base-symbol',
    'roll-off-container',
    'body',
    measured(
      `${CONTAINERS}:197–209`,
      'Abrollbehälter: Füllkörper x 4…31, Unterkante 26,0; rechte Hälfte die Deckkurve des Anhängers, linke Hälfte endet an der Öse auf 6,0. Die Öse (Ring r 2 um (4|8)) ist ein eigenes Primitiv (`CONTAINER_EXTRAS`).',
      babz('5.1.3.1'),
    ),
  ),
  block(
    'base-symbol',
    'swap-container',
    'body',
    measured(
      `${CONTAINERS}:210–211`,
      'Wechselbehälter: Füllrechteck 1/8 bis 31/26 mm. Die beiden Eckbeschläge (r 1,8 um (2,8|8) und (29,2|8)) sind eigene Primitive (`CONTAINER_EXTRAS`).',
      babz('5.1.3.2'),
    ),
  ),
  block(
    'base-symbol',
    'swap-body',
    'body',
    measured(
      `${CONTAINERS}:212–213`,
      'Wechselbrücke: Füllrechteck 1/8 bis 31/26 mm. Die beiden Stützbeine (x 6 und 26 bis y 29) sind eigene Primitive (`CONTAINER_EXTRAS`).',
      babz('5.1.3.3'),
    ),
  ),
  block(
    'base-symbol',
    'wheeled-container',
    'body',
    measured(
      `${CONTAINERS}:214–224`,
      'Behälter, zieh- und schiebbar: Füllkörper x 9…23, Unterkante 26,0, Sehne 6,0, Scheitel (16|8). Öse rechts und zwei Rollen (r 2,25 um (13,25|28,25) und (18,75|28,25)) sind eigene Primitive (`CONTAINER_EXTRAS`).',
      babz('5.1.3.4'),
    ),
  ),

  // Die beiden Zweiräder aus Kapitel 3 (ESZ-142), in `TWO_WHEELER_BODIES`.
  block(
    'base-symbol',
    'two-wheeler',
    'body',
    measured(
      `${SPECIAL_FORMS}:184`,
      '`3.7 Zweirad`: oberer Halbbogen um (16|10), Mittellinie r 6, und ein Stiel auf x 16 bis y 28, 0,5-mm-Strich ohne Fläche (`WHEEL`, special-form-bodies.ts:97–103). Dieselbe Zeichnung wie die Sonderform; die Organisationsfarbe färbt den Strich.',
      babz('3.7'),
    ),
  ),
  block(
    'base-symbol',
    'motorized-two-wheeler',
    'body',
    measured(
      `${SPECIAL_FORMS}:185`,
      '`3.8 Zweirad motorgetrieben`: derselbe Bogen wie 3.7, zwei Stiele auf x 15 und 17 bis y 28 (`WHEEL`, special-form-bodies.ts:97–103). Dieselbe Zeichnung wie die Sonderform; die Organisationsfarbe färbt den Strich.',
      babz('3.8'),
    ),
  ),

  // Variantenzweige aus `VARIANT_BODIES`, in Katalogreihenfolge.
  block(
    'base-symbol',
    'person/compact-person-diamond-26mm',
    'body',
    measured(
      `${BASE}:710–719`,
      `${UNDOCUMENTED_AT_SOURCE}gedrehtes Quadrat um (16|16). Die halbe Seitenlänge nennt die „I.5-Raute bei 13 mm halber Diagonale" (\`COMPACT_PERSON_HALF_SIDE\`, base-symbols.ts:36–37).`,
      babz('I.5'),
    ),
  ),
  block(
    'base-symbol',
    'person/compact-person-diamond-26mm-lowered-2mm',
    'body',
    measured(
      `${BASE}:720–729`,
      `${UNDOCUMENTED_AT_SOURCE}dieselbe I.5-Raute wie \`compact-person-diamond-26mm\`, Mittelpunkt (16|18) statt (16|16) (\`COMPACT_PERSON_HALF_SIDE\`, base-symbols.ts:36–37).`,
      babz('I.5'),
    ),
  ),
  block(
    'base-symbol',
    'formation/foot-band',
    'body',
    measured(
      `${BASE}:732`,
      `${UNDOCUMENTED_AT_SOURCE}Körper gleich \`formation\`; eigen ist das schwarze 3-mm-Fußband (\`VARIANT_EXTRA_PRIMITIVES\`, base-symbols.ts:589–599).`,
    ),
  ),
  block(
    'base-symbol',
    'trailer/foot-band',
    'body',
    measured(
      `${BASE}:735`,
      `${UNDOCUMENTED_AT_SOURCE}Körper ist \`BODIES.trailer\`; eigen ist das Fußband 4/23, 27 × 3 mm (\`VARIANT_EXTRA_PRIMITIVES\`, base-symbols.ts:653–658). Das Zonenmodell führt diesen Zweig nicht.`,
    ),
  ),
  block(
    'base-symbol',
    'vehicle-water/raised-hull',
    'body',
    measured(
      `${BASE}:738–743`,
      'Rumpf der fünf Wasserfahrzeuge `E.2.27` bis `E.2.31`: gegenüber `1.5` um 1,0002 mm angehoben und um den Faktor 0,999318 verkleinert; größte Abweichung der erzeugten Stützpunkte von den gemessenen 0,0002 mm (Kommentar an `VARIANT_BODIES`, base-symbols.ts:684–707).',
      babz('E.2.27–E.2.31'),
    ),
  ),
  block(
    'base-symbol',
    'vehicle-water/inset-hull',
    'body',
    measured(
      `${BASE}:744–749`,
      `${UNDOCUMENTED_AT_SOURCE}Halbkreis wie \`raised-hull\`, Sehne 9,0001. Der Kommentar an \`VARIANT_BODIES\` (base-symbols.ts:703–706) nennt für I.3 diese Sehnenlage, ordnet sie aber nicht dieser Variante zu.`,
    ),
  ),
  block(
    'base-symbol',
    'vehicle-air/raised-hull',
    'body',
    measured(
      `${BASE}:752–757`,
      `${UNDOCUMENTED_AT_SOURCE}Halbkreis über der Sehne 20,9898; die Keile unter dem Rumpf stehen in \`VARIANT_EXTRA_PRIMITIVES\` (base-symbols.ts:602–613).`,
    ),
  ),
  block(
    'base-symbol',
    'vehicle-air/fixed-wing-hull',
    'body',
    measured(
      `${BASE}:758–763`,
      `${UNDOCUMENTED_AT_SOURCE}Körper gleich \`vehicle-air/raised-hull\`; eigen sind die Flügelformen in \`VARIANT_EXTRA_PRIMITIVES\` (base-symbols.ts:614–627).`,
    ),
  ),
  block(
    'base-symbol',
    'vehicle-land/foot-band',
    'body',
    measured(
      `${BASE}:766`,
      `${UNDOCUMENTED_AT_SOURCE}Körper ist \`BODIES['vehicle-land']\`; eigen ist das schwarze 3-mm-Fußband (\`VARIANT_EXTRA_PRIMITIVES\`, base-symbols.ts:630–640).`,
    ),
  ),
  block(
    'base-symbol',
    'vehicle-land/plain-wheel-pair',
    'body',
    measured(
      `${BASE}:767`,
      `${UNDOCUMENTED_AT_SOURCE}Körper ist \`BODIES['vehicle-land']\`; eigen sind die zwei Radringe (\`VARIANT_EXTRA_PRIMITIVES\`, base-symbols.ts:641–650). Offen ist LFH-597, die zwei oberen Grundlinien dieser Fassung (core/src/layout/zones.ts:1155–1162). Das betrifft die Beschriftung und nicht diese Zeichnung, und das Register wählt keine der beiden Zahlen.`,
    ),
  ),
  block(
    'base-symbol',
    'vehicle-land/inverted-hull-track',
    'body',
    measured(
      `${BASE}:768–773`,
      `${UNDOCUMENTED_AT_SOURCE}Rechteck mit nach oben gewölbter Unterkante, Pfad als Literal.`,
    ),
  ),
  block(
    'base-symbol',
    'circle-12/foot-band',
    'body',
    measured(
      `${BASE}:776`,
      `${UNDOCUMENTED_AT_SOURCE}Körper ist \`BODIES['circle-12']\`; eigen ist das Kreissegment als Fußband (\`VARIANT_EXTRA_PRIMITIVES\`, base-symbols.ts:661–670).`,
    ),
  ),
  block(
    'base-symbol',
    'circle-12/raised-gable',
    'body',
    measured(
      `${BASE}:777–790`,
      'F.3.5/F.3.14: derselbe 12-mm-Kreis, zwei Millimeter abgesenkt. Der separat vermessene Giebel steht in `VARIANT_EXTRA_PRIMITIVES` (base-symbols.ts:671–679). Quellgeometrie identisch mit J.3.2, dessen Katalogfassung `stationBody(17, 11.5)` aber nicht als Vorlage dient.',
      babz('F.3.5', 'F.3.14'),
    ),
  ),
  block(
    'base-symbol',
    'circle-12/raised-circle-1mm',
    'body',
    measured(
      `${BASE}:791–798`,
      `${UNDOCUMENTED_AT_SOURCE}12-mm-Kreis mit Mittelpunkt (16|15), also 1 mm angehoben.`,
    ),
  ),
  // Abgeleitete Fassungen der Funktionsstelle (2. Oktober 2026, `CIRCLE_VARIANT_PAIRS`). Die
  // Zeichnung trägt dafür eine Ableitungsnotiz; der Fundort ist der Eintrag in `VARIANT_BODIES`.
  block(
    'base-symbol',
    'post/raised-gable',
    'body',
    measured(
      `${BASE}:802`,
      'Abgeleitet von F.3.5: Mit Giebel bleibt unter dem Scheitel y 1 und über der Unterkante 30 genau der abgesenkte 12-mm-Kreis (16|18) r 12; der 14-mm-Kreis wird auf diese Fassung verkleinert (`POST_VARIANT_BODIES`, derive/circle.ts).',
      babz('F.3.5'),
    ),
  ),
  block(
    'base-symbol',
    'post/raised-circle-1mm',
    'body',
    measured(
      `${BASE}:803`,
      'Abgeleitet von N.2.3: Oberkante 1 (1 mm über der Funktionsstelle), Unterkante 27 wie am angehobenen 12-mm-Kreis, damit die Oberflächenläufe auf Grundlinie 31 Platz finden; (16|14) r 13 (`POST_VARIANT_BODIES`, derive/circle.ts).',
      babz('N.2.3'),
    ),
  ),
  block(
    'base-symbol',
    'post/foot-band',
    'body',
    measured(
      `${BASE}:804`,
      'Abgeleitet von G.3.x: Kreis der Funktionsstelle unverändert, Fußband als Segment unter der Sehne 4 mm über der Unterkante (`POST_VARIANT_EXTRAS`, derive/circle.ts).',
      babz('G.3.1', 'G.3.5'),
    ),
  ),
]);

const ORGANIZATIONS = 'core/src/geometry/organizations.ts';

/** Die Herkunftsaussage am Kopf von `ORGANIZATION_COLORS` (organizations.ts:3–24). */
const CHAPTER_TWO =
  'Aus Kapitel 2 der BBK/BABZ-Empfehlung abgeleitet, Werte per `pnpm cli audit:reference` gegen `fingerprints.json` belegt (organizations.ts:4–5).';

/**
 * Die acht Organisationsfarben. Seit LFH-424 sind alle `OrganizationId`-Werte belegt; der
 * Wurf in `organizationColor()` ist für typgerechte Aufrufer unerreichbar. Einen Abschnitt je
 * Organisation nennt der Fundort nur für die Hilfsorganisation (2.2). Die frühere neunte
 * Organisation `bundespolizei` entfiel mit LFH-586: Die Bundespolizei ist Polizei (Tafel 2.5).
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
    'bundeswehr',
    'body',
    measured(`${ORGANIZATIONS}:30`, `Farbton \`braun\`. ${CHAPTER_TWO}`),
  ),
  block(
    'color',
    'sonstige-gefahrenabwehr',
    'body',
    measured(`${ORGANIZATIONS}:31`, `Farbton \`orange\`. ${CHAPTER_TWO}`),
  ),
  block(
    'color',
    'zivile-einheiten',
    'body',
    measured(`${ORGANIZATIONS}:32`, `Farbton \`hellgrau\`. ${CHAPTER_TWO}`),
  ),
  block(
    'color',
    'hilfsorganisation',
    'body',
    measured(
      `${ORGANIZATIONS}:33`,
      'Farbton `weiss`. `2.2_Organisationen.svg` trägt einen vollflächigen Fleck `#ffffff` über 0/0/32/32, seine Typo-Ebene liest gerastert „HiOrg". Vorbehalt: `#ffffff` ist zugleich die neutrale Grundfüllung; ein Zeichen mit dieser Organisation ist von einem organisationslosen farblich nicht unterscheidbar (organizations.ts:9–23).',
      babz('2.2'),
    ),
  ),
]);

const CHASSIS = 'core/src/geometry/vehicle-categories.ts';

/**
 * Die Fahrwerkszone je Fahrzeugkategorie. Vermessen sind genau die Kategorien aus
 * `MEASURED_VEHICLE_CATEGORIES` (vehicle-categories.ts:223–238). Die Abschnitte stehen an den
 * Radplatzkonstanten, nicht am `case`-Zweig; die Notiz nennt jeweils die Konstante.
 */
export const CHASSIS_BLOCKS: readonly BlockEntry[] = Object.freeze([
  block(
    'chassis',
    'kfz-kategorie-1',
    'chassis',
    measured(
      `${CHASSIS}:170–174`,
      'Die äußeren zwei der drei festen Radplätze, vermessen an `5.1.1.1` (3,7502 / 28,2499) und an den E.2-Zeichen dieser Kategorie (`KFZ_SLOTS_MM`, vehicle-categories.ts:26–39). Radius und Zonenhöhe: vehicle-categories.ts:4–24.',
      babz('5.1.1.1'),
    ),
  ),
  block(
    'chassis',
    'kfz-kategorie-2',
    'chassis',
    measured(
      `${CHASSIS}:175–176`,
      'Alle drei festen Radplätze, vermessen an `5.1.1.2` (3,7502 / 16,0001 / 28,2499) und an den E.2-Zeichen dieser Kategorie (`KFZ_SLOTS_MM`, vehicle-categories.ts:26–39).',
      babz('5.1.1.2'),
    ),
  ),
  block(
    'chassis',
    'kfz-kategorie-3',
    'chassis',
    measured(
      `${CHASSIS}:177–184`,
      'Alle drei Radplätze wie Kategorie 2 und der Verbindungsstrich, der sie allein unterscheidet (`KFZ_SLOTS_MM`, vehicle-categories.ts:26–39). Belegt ist das Bild, nicht der Endpunkt des Strichs: die Endpunkte liegen in einem gemessenen Band und sind auf die Ringmittellinie gesetzt (`bars()`, vehicle-categories.ts:121–145).',
      babz('5.1.1.3'),
    ),
  ),
  block(
    'chassis',
    'kettenfahrzeug',
    'chassis',
    measured(
      `${CHASSIS}:185–197`,
      'Kettenstadion mit den Endmitten 4,25 und 27,75 mm, vermessen am Innenstadion von `5.1.1.5`; der Einzug von 0,5 mm gegenüber den Radplätzen ist gemessen und nicht ableitbar (`TRACK_END_CX_MM`, vehicle-categories.ts:73–81).',
      babz('5.1.1.5'),
    ),
  ),
  block(
    'chassis',
    'schienenfahrzeug',
    'chassis',
    measured(
      `${CHASSIS}:198–199`,
      'Radplätze 3,7504 / 9,2505 / 22,7499 / 28,2501 mm, vermessen an `5.1.1.6`; eigene Liste, keine Ableitung aus den Kfz-Plätzen (`RAIL_SLOTS_MM`, vehicle-categories.ts:41–48).',
      babz('5.1.1.6'),
    ),
  ),
  block(
    'chassis',
    'anhaenger-ein-rad',
    'chassis',
    measured(
      `${CHASSIS}:200–201`,
      'Ein Radplatz bei cx 17,4999, vermessen an `5.1.2.4_Anhänger_von PKW gezogen.svg` und an E.2.22, E.2.23, E.2.25 zahlengleich wiedergefunden (`TRAILER_SINGLE_SLOT_MM`, vehicle-categories.ts:50–59).',
      babz('5.1.2.4'),
    ),
  ),
  block(
    'chassis',
    'anhaenger-zwei-raeder',
    'chassis',
    measured(
      `${CHASSIS}:202–203`,
      'Zwei Radplätze bei cx 14,2501 und 19,7503, vermessen an `5.1.2.5_Anhänger_von LKW gezogen.svg` und an E.2.24 zahlengleich wiedergefunden (`TRAILER_PAIR_SLOTS_MM`, vehicle-categories.ts:61–71).',
      babz('5.1.2.5'),
    ),
  ),
  block(
    'chassis',
    'amphibienfahrzeug',
    'chassis',
    notMeasured(
      `${CHASSIS}:204–219`,
      'Die zwei Radplätze von 5.1.1.4 sind vermessen (3,75 / 28,25 mm wie Kategorie 1), die Wellenlinie nur als Strichhülle 7,4263/26,7000/24,5756/29,7998 mm und nicht in ihrer Kurvenform. Seit dem 02.10.2026 konstruiert `vehicleChassis()` ihre Mittellinie aus beiden Strichkanten und meldet sie als Ableitung (`constructed`).',
    ),
  ),
]);
