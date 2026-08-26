/**
 * Körperform eines Zeichens. Die ersten vierzehn Werte sind die Grundzeichen aus Kapitel 1 der
 * BBK/BABZ-Empfehlung und stehen als `CatalogEntry` in `BASE_SYMBOLS`.
 *
 * **Die letzten vier sind Körperformen ohne Kapitel-1-Abschnitt.** Die Zuschnittsnotiz zu
 * Anhang E.2 vom 11. August 2026 hat die ersten drei vorhergesagt; Anhang F.3 belegt den
 * eigenständigen 12-mm-Kreis. Sie stehen bewusst **nicht** in `BASE_SYMBOLS`: dessen Register ist
 * das Kapitel 1, und ein Eintrag dort verlangte einen Abschnitt, den diese Quellen nicht liefern.
 *
 * - `trailer` — Anhängerrumpf. Belegt an `5.1.2.1_Anhänger_allgemein.svg`; sein Füllpfad kommt in
 *   17 der 661 Referenzdateien byteidentisch vor (selbst gezählt).
 * - `swap-loader-vehicle` — Rumpf des Wechselladerfahrzeugs `E.2.15`. Genau 1 von 661.
 * - `upright-rectangle` — hochkantes Rechteck 26 × 28 mm von `E.2.26`. Genau 1 von 661. Nach der
 *   Zeichnung benannt und nicht nach der Trinkwasseraufbereitungsanlage: was die Form fachlich
 *   bezeichnet, sagt die Datei nicht.
 * - `circle-12` — Kreis mit Radius 12 mm aus den elf F.3-Zeichen; bei `raised-gable` ist sein
 *   Mittelpunkt separat abgesenkt vermessen.
 */
export type SymbolKind =
  | 'formation'
  | 'person'
  | 'vehicle-land'
  | 'vehicle-air'
  | 'vehicle-water'
  | 'post'
  | 'building'
  | 'container'
  | 'area'
  | 'measure'
  | 'hazard'
  | 'point'
  | 'event'
  | 'spontaneous-helper'
  | 'trailer'
  | 'swap-loader-vehicle'
  | 'upright-rectangle'
  | 'circle-12';

/**
 * Eine **zweite, in der Quelle belegte Zeichnung desselben Grundzeichens** — keine zweite
 * Grundzeichenart.
 *
 * `raised-hull` ist eine an der jeweiligen Art separat vermessene angehobene Rumpfform. Am
 * Wasserfahrzeug belegen sie die fünf Dateien `E.2.27` bis `E.2.31`. Gegenüber
 * `1.5_Wasserfahrzeug.svg` liegt er 1,0002 mm höher (Sehne auf y 7,9999 statt 9,0001) und ist um
 * den Faktor 0,999318 kleiner (Sehnenlänge 29,9794 gegen 29,9999 mm) — beides selbst vermessen.
 * Der Name beschreibt die **sichtbare** Differenz: die Anhebung, und die schafft genau den
 * Freiraum, in dem das blaue Trägerkürzel steht (1,0908 mm unter der Rumpfunterkante).
 *
 * **Warum eine Variante und keine eigene `SymbolKind`:** es ist fachlich dasselbe Grundzeichen,
 * und eine eigene Art bräuchte einen eigenen Abschnitt — der wäre 1.5, den `vehicle-water`
 * bereits beansprucht und gegen den es seit dem Teilslice E.2 selbst gegatet ist. Umgekehrt darf
 * `vehicle-water` nicht auf diese Maße geändert werden: es fiele dann gegen `1.5` um 2,8
 * Einheiten bei einer Toleranz von 0,01.
 *
 * F.2.6/F.2.7 belegen dieselbe Kennung am separat vermessenen, um 2 mm angehobenen
 * Luftfahrzeugrumpf; die Kennung erlaubt keine Übertragung der Maße zwischen den Arten.
 * `foot-band` bezeichnet ausschließlich ein schwarzes 3-mm-Fußband. Formation und
 * Landfahrzeug führen dafür getrennt vermessene Körperfassungen; die gemeinsame Kennung erlaubt
 * keine Übertragung ihrer übrigen Maße. `plain-wheel-pair` hält die zwei schlichten Radringe der
 * elf F.2-Landdarstellungen getrennt von `vehicleCategory`: das Bild gleicht Kategorie 1, die
 * Quelle belegt hier aber keine Kategorie-Semantik. `raised-gable` bezeichnet den F.3-Kreis
 * mit Mittelpunkt (16|18) und seinem separat vermessenen Giebel. Seine Quellgeometrie ist mit
 * J.3.2 identisch; die Kennung behauptet aber keine Standortsemantik und verwendet nicht dessen
 * abweichend approximierte bestehende Katalogfassung `stationBody(17, 11.5)`.
 */
export type BodyVariantId = 'raised-hull' | 'foot-band' | 'plain-wheel-pair' | 'raised-gable';

/** Organisationen nach Kapitel 2. Bestimmen die Körperfarbe. */
export type OrganizationId =
  | 'feuerwehr'
  | 'thw'
  | 'fuehrung-leitung'
  | 'polizei'
  | 'bundeswehr'
  | 'sonstige-gefahrenabwehr'
  | 'zivile-einheiten'
  | 'hilfsorganisation';

/** Taktische Stärke nach Kapitel 5.4. Bestimmt die Kopfzone. */
export type StrengthId = 'trupp' | 'staffel' | 'gruppe' | 'zug';

/** Verwaltungsstufen nach Kapitel 5.7. */
export type AdminLevelId =
  | 'gemeinde'
  | 'kreis'
  | 'bezirk'
  | 'bundesland'
  | 'nationalstaat'
  | 'europaeische-union';

/**
 * Fahrzeugkategorien nach Kapitel 5.1 — die Fahrwerkszone, die ein Zeichen unterhalb seines
 * Körpers trägt.
 *
 * **Die beiden Anhängerfahrwerke sind nach der Zeichnung benannt und nicht nach dem Quellbegriff,
 * und das ist gemessen begründet.** Die Quelle nennt sie „von PKW gezogen" (`5.1.2.4`, ein Rad)
 * und „von LKW gezogen" (`5.1.2.5`, zwei Räder). Diese Begriffe als IDs zu vergeben, hieße an
 * drei von vier E.2-Anhängern etwas zu behaupten, was die Datei nicht sagt:
 *
 * - `E.2.22_Anhänger Grundzeichen.svg` trägt die **Ein-Rad**-Form (Innenring
 *   15,5000/26,2505/19,5001/30,2503, selbst vermessen) — obwohl es das Grundzeichen ist;
 * - `5.1.2.1_Anhänger_allgemein.svg` trägt **überhaupt kein Rad** (selbst nachgemessen: seine
 *   Strichebene führt drei Teilpfade, keiner davon ein Ring);
 * - `E.2.23_Anhänger Netzersatzanlage_von LKW gezogen.svg` trägt die **Ein-Rad**-Form, obwohl
 *   sein Name „von LKW gezogen" sagt.
 *
 * Damit ist die Gleichung „ein Rad = von PKW gezogen" aus der Quelle selbst widerlegt. Gezählt
 * sind **Räder**, keine Achsen; ob ein Anhänger mit einem Rad fachlich etwas anderes bezeichnet
 * als einer mit zweien, entscheidet eine fachkundige Person und nicht diese Datei.
 */
export type VehicleCategoryId =
  | 'kfz-kategorie-1'
  | 'kfz-kategorie-2'
  | 'kfz-kategorie-3'
  | 'amphibienfahrzeug'
  | 'kettenfahrzeug'
  | 'schienenfahrzeug'
  | 'anhaenger-ein-rad'
  | 'anhaenger-zwei-raeder';

/** Fähigkeiten nach Kapitel 4 in verbindlicher Kapitelreihenfolge. */
export const CAPABILITY_IDS = Object.freeze([
  'cbrn-protection',
  'cbrn-detection',
  'decontamination',
  'water-environmental-damage-control',
  'drinking-water-treatment',
  'radioactive-materials',
  'biological-materials',
  'chemical-materials',
  'care',
  'psychosocial-emergency-care',
  'pastoral-care',
  'temporary-accommodation-resting',
  'temporary-accommodation-seating',
  'fire-fighting',
  'service-water',
  'foam-agent',
  'solid-extinguishing-agent',
  'gaseous-extinguishing-agent',
  'respiratory-protection',
  'reconnaissance',
  'biological-location',
  'technical-location',
  'recovery',
  'rescue-portable-ladders',
  'rescue-aerial-ladder',
  'rescue-articulated-boom',
  'watercraft-operations',
  'mountain-rescue',
  'special-height-depth-rescue',
  'water-rescue',
  'medical-service',
  'nursing',
  'intensive-care',
  'physician',
  'patient-transport',
  'hospital',
  'water-hazard-control',
  'excavation',
  'lighting',
  'ventilation',
  'air-extraction',
  'explosive-ordnance-clearance',
  'hand-tools',
  'forklift-lifting',
  'crane-lifting',
  'lifting-loads-persons',
  'lifting-clearing',
  'remote-manipulation',
  'chainsaw',
  'pumping',
  'mechanized-clearing',
  'safety',
  'blasting',
  'technical-assistance',
  'transport',
  'door-opening',
  'overcoming-height-differences',
  'securing',
  'optical-warning',
  'loudspeaker-warning',
  'siren-warning',
  'water-conveyance',
  'water-retention',
  'load-pulling',
  'container-resource',
  'fuels-consumables',
  'bridge',
  'temporary-bridge-construction',
  'waste-disposal',
  'maintenance',
  'sandbag',
  'sandbag-filling',
  'washing-facility',
  'toilet-facility',
  'power-supply',
  'drinking-water',
  'catering',
  'meal-preparation',
  'rapid-deployment-tent',
  'frame-tent',
  'information-communications',
  'veterinary',
  'slaughter-culling',
  'chicken',
  'horse',
  'cattle',
  'sheep',
  'pig',
] as const);

export type CapabilityId = (typeof CAPABILITY_IDS)[number];

/**
 * Rein geometrische Körpermarken ohne behauptete Kapitel-4-Bedeutung. Sie schließen die
 * zentralen F-Zeichnungen, deren sichtbare Form aus der Referenz messbar ist, deren
 * fachlicher Begriff aber nicht belegt ist. Die IDs beschreiben deshalb ausschließlich Maße und
 * Gestalt. Sie sind weder `CapabilityId` noch Ersatz für ein noch ausstehendes Domain-Review.
 *
 * Jede Fassung ist an genau einem Körper-/Variantenkontext vermessen und muss in jedem anderen
 * Kontext fail-closed ablehnen. Die Kennung selbst behauptet keine Übertragbarkeit.
 */
export const TECHNICAL_BODY_MARK_IDS = Object.freeze([
  'ring-7mm-offset-down-1mm',
  'chevron-over-opposed-triangles',
  'ring-6-5mm-offset-down-2mm-with-roof',
  'top-center-rect-0-5x0-6mm',
  'air-winch-chevron-diamond',
  'ring-6mm-offset-down-3mm-four-way-stem',
  'ring-5mm-offset-down-3mm-eight-spokes',
  'circle-patient-staging-arrows',
  'circle-collection-arrow',
  'circle-staging-frame-arrow',
  'circle-staging-frame',
  'circle-staging-frame-quadrants-arrows',
  'circle-diamond-arrow',
  'circle-cross-ring',
] as const);

export type TechnicalBodyMarkId = (typeof TECHNICAL_BODY_MARK_IDS)[number];
export type BodyMarkId = CapabilityId | TechnicalBodyMarkId;

/** Zustände nach Kapitel 5.8 in verbindlicher Kapitelreihenfolge. */
export const STATE_IDS = Object.freeze([
  'tactical-rescue',
  'tactical-attack',
  'tactical-defense',
  'tactical-retreat',
  'flooded-area',
  'water-ingress-hazard',
  'hazardous-substances',
  'radioactivity-hazard',
  'electrical-energy-hazard',
  'mineral-oil-hazard',
  'explosion-hazard',
  'explosive-ordnance-hazard',
  'suspected-situation',
  'acute-situation',
  'activity-slightly-increased-outage-up-to-25-percent',
  'activity-moderately-increased-outage-up-to-50-percent',
  'activity-significantly-increased-outage-up-to-75-percent',
  'activity-strongly-increased-total-outage',
  'tendency-rising',
  'tendency-unchanged',
  'tendency-falling',
  'damaged',
  'partially-destroyed',
  'destroyed',
  'incipient-fire',
  'developed-fire',
  'fully-developed-fire',
  'sick-animal',
  'contaminated-animal',
  'dead-animal',
  'weather-sunny',
  'weather-cloudy',
  'weather-cloud-cover-four-eighths',
  'weather-foggy',
  'weather-rainy',
  'weather-hailing',
  'weather-thunderstorm',
  'weather-snowing',
  'weather-temperature',
  'weather-windy',
  'person-uninjured',
  'person-affected',
  'person-injured',
  'person-injured-triage-category',
  'person-injured-transport-priority',
  'person-contaminated',
  'person-dead',
  'person-missing',
  'person-in-water-danger',
  'person-in-distress',
  'person-rescued',
  'person-to-be-transported',
  'person-in-transport',
  'person-transported',
  'person-needing-special-care',
  'person-care-dependent',
  'person-mobility-impaired',
  'route-closed',
  'one-way-traffic',
  'route-difficult-to-pass',
  'route-impassable',
] as const);

export type StateId = (typeof STATE_IDS)[number];

/** IuK-Zeichen nach Anhang J in verbindlicher Kapitelreihenfolge. */
export const COMMS_IDS = Object.freeze([
  'voice',
  'voice-radio',
  'voice-radio-dmo',
  'voice-radio-tmo',
  'sds-dmo',
  'sds-tmo',
  'voice-radio-dmo-repeater',
  'data-transmission',
  'fax-transmission',
  'image-transmission',
  'livestream-transmission',
  'satellite-voice',
  'satellite-data',
  'directional-radio',
  'half-duplex-operation',
  'duplex-operation',
  'telecom-device',
  'base-station',
  'mobile-base-station',
  'gateway',
  'repeater',
  'handheld-radio-terminal',
  'mobile-radio-terminal',
  'fixed-radio-terminal',
  'active-paging-radio-terminal',
  'antenna',
  'cable-construction',
  'radio',
  'transitions',
  'telephone-exchange',
  'telephone-exchange-voip',
  'router',
  'switch',
  'server',
  'access-point',
  'wan',
  'firewall',
  'printer',
  'connection-length',
  'pickup-point',
  'connection-point',
  'connection-crossing',
  'distributor',
  'distributor-with-surge-protection',
  'cable-temporary',
  'fiber-temporary',
  'network-cable-temporary',
  'twisted-pair-count',
] as const);

export type CommsId = (typeof COMMS_IDS)[number];

/**
 * Schadenszeichen nach den Anhängen K (Bauwerksschäden) und L (Deichverteidigung), in
 * verbindlicher Kapitelreihenfolge — erst K.1 bis K.18, dann L.1 bis L.10.
 *
 * **Zwei Anhänge, ein ID-Raum.** Das ist keine nachträgliche Zusammenlegung, sondern die
 * Aufteilung, die `pictogram.ts` seit D.0 als Vertrag führt: `DamageId` deckt K und L ab,
 * `WildfireId` allein M. Beide Anhänge beschreiben denselben Gegenstand — einen Schaden an einem
 * Bauwerk, den ein Erkundungstrupp in eine Lagekarte einträgt; ein Deich ist dabei nichts anderes
 * als ein sehr langes Bauwerk. Getrennte Räume hätten eine Grenze behauptet, die die Zeichen
 * selbst nicht ziehen.
 */
export const DAMAGE_IDS = Object.freeze([
  'room-blocked',
  'room-damaged',
  'half-room-damaged',
  'room-damaged-swallow-nest',
  'room-filled',
  'room-filled-fine-debris',
  'room-filled-layered',
  'room-filled-water',
  'slip-surface',
  'layering',
  'edge-debris',
  'upper-floors',
  'middle-floors',
  'lower-floors',
  'timber-beam-ceiling',
  'girder-ceiling',
  'solid-slab-ceiling',
  'vaulted-ceiling',
  'imminent-overflow',
  'overflow',
  'local-through-flow',
  'through-flow',
  'local-undercutting',
  'undercutting',
  'slope-slippage',
  'outer-dyke-damage',
  'dyke-breach',
  'seepage-line-marker',
] as const);

export type DamageId = (typeof DAMAGE_IDS)[number];

/** Vegetationsbrandzeichen nach Anhang M in verbindlicher Kapitelreihenfolge. */
export const WILDFIRE_IDS = Object.freeze([
  'anchor-point',
  'lookout',
  'safety-zone',
  'spot-fire',
  'ground-fire',
  'acute-spot-fire',
  'peat-ground-fire',
  'crown-fire',
  'fire-spread-uphill',
  'fire-spread-downhill',
  'water-extraction-point',
  'aerial-firefighting',
  'water-supply-operation',
  'water-supply-operation-vehicles',
] as const);

export type WildfireId = (typeof WILDFIRE_IDS)[number];

/**
 * Beschriftungen **im** Körper, in den drei Zonen, die Anhang E belegt. Die Zonen sind nach
 * ihrer Lage benannt und nicht nach einer Bedeutung: vermessen ist die Position, nicht die
 * Semantik. Anhang E legt in `center` das Kürzel der Einheit („B", „ENT", „Öl"), in
 * `bottomRight` das Trägerkürzel („THW") und in `bottomLeft` eine Zusatzkennzeichnung
 * („A" für Typ A, „ASH" für Abstützsystem Holz) — dass diese Zuordnung über Anhang E hinaus
 * gilt, behauptet dieser Typ nicht.
 *
 * Getrennt von `SymbolSpec.designation`: das trägt den Textlauf **unterhalb** des Körpers
 * (`role: 'foot'`, schwarz auf der Oberfläche, Slice vom 9. August 2026). Die 37 Zeichen aus
 * E.1 setzen keinen einzigen Text unterhalb ihres Körpers; beide Zonen bestehen deshalb
 * nebeneinander, statt dass eine die andere umdeutet.
 */
export interface BodyLabels {
  readonly center?: string;
  readonly bottomLeft?: string;
  /**
   * Unten mittig im Formationskörper. Gemessen an F.1.18 und F.1.20: Grundlinie 24,0 mm,
   * Mittelpunkt x = 16,0 mm und derselbe Schriftgrad wie `bottomLeft`/`bottomRight`.
   * An anderen Körperformen fehlt die Messung; `compose()` lehnt dort fail-closed ab.
   */
  readonly bottomCenter?: string;
  readonly bottomRight?: string;
  /**
   * Die **fünfte** Zone: linksbündig im oberen Bereich des Körpers. Anhang F setzt
   * dort sein Kürzel — „MTF", „SEG", „RettD", „10" —, weil die Fachdienstteilung
   * (`SymbolSpec.bodyMarks`) die Mitte belegt und ein mittiger Lauf über dem waagerechten Arm
   * des Kreuzes läge.
   *
   * **Gemessen an den neun beschrifteten Zeichen aus F.1.1 bis F.1.11** (eigene Vermessung,
   * 18. August 2026, Tinte der Typo-Ebene in Millimetern):
   *
   * | Größe | Messung |
   * |---|---|
   * | Grundlinie | 11,0 mm — maxY der flachfüßigen Glyphen (`M`, `T`, `F`, `D`, `E`) |
   * | Versalhöhe | 2,9192 mm — derselbe Grad wie die beiden unteren Zonen |
   * | linke Tintenkante | 2,686 (`S`) · 2,762 (`1`) · 2,868 (`M`, `R`) · 2,186 (`5`) |
   *
   * **Der Anker ist zurückgerechnet, nicht abgelesen.** Die Tintenkante hängt von der linken
   * Seitenlage der ersten Glyphe ab; gegen die eigene Rasterung derselben Läufe (Anker 3,0 mm,
   * 4096 px) ergibt sich der Anker zu 2,524 (`M`, `R`), 2,498 (`S`) und 2,442 (`1`) — vier von
   * fünf Läufen auf 2,5 mm, also 1,5 mm rechts der Körperkante. Der fünfte ist `F.1.3` („5.000",
   * Anker 2,022); er steht als Befund an seiner Manifestzeile und nicht in dieser Zahl.
   * F.1.12 erweitert die waagerechte Evidenz: „ÜMANV-S" überschreitet die Mittellinie sichtbar,
   * deshalb endet die deklarierte Box erst an der rechten Innenmarge des Körpers.
   */
  readonly topLeft?: string;
  /**
   * Drei **gemeinsam erforderliche Quellenmaße** für einen einzelnen `topLeft`-Lauf. Fehlt das
   * Objekt, gelten unverändert Schriftgrad, Grundlinie und Anker des Körperprofils. Es ist kein
   * Auto-Fit und keine Stilkennung: jede Zahl stammt aus dem jeweiligen, in Pfade umgewandelten
   * Quellenlauf. `compose()` akzeptiert den Override fail-closed am normalen und gebänderten
   * F.2-Landfahrzeug sowie zwingend an den beiden F.3-Kreisprofilen. Die Kreiswerte dürfen
   * negativ relativ zur Körperhülle sein, weil `UHS` und `50` sichtbar auf der weissen
   * Ausgabeoberfläche beginnen; sie werden stattdessen gegen die 32-mm-ViewBox geprüft.
   * `plain-wheel-pair`, Formation und alle anderen Körperarten behalten ihre eigenen
   * vermessenen Defaults.
   *
   * Ablesung in 90,709 / 32 SVG-Einheiten pro Millimeter; Grundlinie aus flachfüßigen Glyphen,
   * Versalhöhe ohne runden Overshoot. Weil die Quelle nur Pfade speichert, ist der Anker aus der
   * linken Tintenkante und dem Arimo-Seitenlager bei dieser Versalhöhe zurückgerechnet:
   *
   * | Quelle | Lauf | Versalhöhe | Grundlinie absolut / ab Körperoberkante | Tintenkante links | Anker absolut / ab linker Körperkante | Breite bis x=29 |
   * |---|---|---:|---:|---:|---:|---:|
   * | F.2.10 | `BTKombi` | 2,191447 | 10,999923 / 5,249923 | 1,775524 | 1,514230 / 0,514230 | 27,485770 |
   * | F.2.11 | `BTKombi` | 2,191447 | 10,999923 / 5,249923 | 1,775524 | 1,514230 / 0,514230 | 27,485770 |
   * | F.2.12 | `GwBT` | 2,919225 | 11,999691 / 6,249691 | 2,223903 | 2,010503 / 1,010503 | 26,989497 |
   * | F.2.13 | `GwBT` | 2,919225 | 11,999691 / 6,249691 | 2,223903 | 2,010503 / 1,010503 | 26,989497 |
   * | F.2.14 | `GwLog` | 2,432746 | 10,999923 / 5,249923 | 2,186861 | 2,009024 / 1,009024 | 26,990976 |
   * | F.2.16 | `40` | 2,749893 | 12,499576 / 6,749576 | 2,589026 | 2,497298 / 1,497298 | 26,502702 |
   * | F.2.17 | `BtlLKW` | 2,432746 | 11,499807 / 5,749807 | 2,056334 | 1,766269 / 0,766269 | 27,233731 |
   */
  readonly topLeftMetrics?: {
    readonly capHeightMm: number;
    readonly baselineFromBodyTopMm: number;
    readonly anchorFromBodyLeftMm: number;
  };
  /**
   * Linksbündiger Lauf vollständig oberhalb der Körperhülle. Belegt an F.2.7: `ITH` endet auf
   * Grundlinie y = 6 mm, zwei Millimeter oberhalb des Luftfahrzeugrumpfs aus Kapitel 1.
   */
  readonly aboveLeft?: string;
  /**
   * Zwei linksbündige Läufe im oberen linken Körperfeld. Belegt nur an F.2.8 (`GW-San` / `50`)
   * mit getrennten Grundlinien und kleinerem, gemeinsam vermessenem Schriftgrad.
   */
  readonly topLeftLines?: readonly [string, string];
  /**
   * Die **vierte** Zone, und die einzige **außerhalb** des Körpers: rechtsbündig unterhalb seiner
   * Unterkante, in der Organisationsfarbe statt in Weiß. Belegt an den fünf Wasserfahrzeugen
   * `E.2.27` bis `E.2.31`, deren Typo-Ebene diesen Lauf byteidentisch führt (Tinte
   * 22,5379/24,0806/31,5778/26,9998 mm, Füllung #003296, Versalhöhe 2,9192 — selbst vermessen,
   * in allen fünf Dateien gleich bis auf 0,0003 mm an der T-Glyphe von E.2.28).
   *
   * **Nicht dasselbe wie `bottomRight` mit anderer Farbe.** Der Lauf liegt vollständig unter dem
   * Rumpf: seine Oberkante 24,0806 mm steht 1,0908 mm unter der Rumpfunterkante 22,9898 mm. Ein
   * `bottomRight` setzte ihn weiß **in** den Rumpf — das ist ein anderes Bild, und kein Gate
   * meldete es (der Fingerprint sieht nur `role: 'body'`, die Rasterprüfung nur die selbst
   * deklarierte Box).
   *
   * **Auch nicht dasselbe wie `SymbolSpec.designation`.** Die Fußzone steht mittig, schwarz und
   * mit festem Schriftgrad 4 mm; dieser Lauf steht rechtsbündig, farbig und im Schriftgrad der
   * unteren Zonen.
   */
  readonly belowRight?: string;
  /**
   * **Gemessene Versalhöhe** des mittigen Laufs in Millimetern. Fehlt sie, gilt der Normwert aus
   * `compose.ts` (4,87 mm, an den 16 Dateien E.1.1 bis E.1.16 vermessen).
   *
   * Anhang E.2 setzt seine mittigen Kürzel **nicht** durchgehend im Normgrad. Selbst vermessen
   * (18. August 2026, Grundlinie 18,0 mm, Versalhöhe der ersten Versalie des Laufs): neun der 30
   * mittigen Läufe sind kleiner gesetzt — 4,3829 (E.2.7 „T", E.2.16 „L", E.2.17 „L", E.2.19 „F"),
   * 4,3826 (E.2.8 „R", E.2.21 „M"), 3,6513 (E.2.20 „F") und 3,4099 (E.2.12 „M", E.2.13 „M")
   * gegen den Normwert 4,8694 (E.2.1 „P").
   *
   * **Es gibt keine Auslöseregel, und das ist gemessen, nicht offen.** Von den neun bräuchten nur
   * drei die Verkleinerung, um in die 28-mm-Box zu passen; E.2.17 käme bei voller Größe auf
   * 27,2 mm und E.2.19 auf 17,2 mm. Eine Breitenschwelle ist damit widerlegt. Der Katalog trägt
   * deshalb je Zeichen die gemessene Zahl und behauptet keine Regel — genau die Bauart, die
   * `MEASURED_VEHICLE_CATEGORIES` für die Fahrwerke wählt.
   *
   * **Ablesevorschrift für den Nachbau:** die Grundlinie ist der maxY der **flachfüßigen**
   * Glyphen, nicht der häufigste und nicht der größte. Runde Glyphen (e, a, o, d) überschießen
   * sie um bis zu 0,08 mm; wer den häufigsten maxY nimmt, misst bei E.2.7 („Telelader", fünf
   * runde von neun Glyphen) 18,0763 statt 18,0001 und bekommt 4,4593 statt 4,3829.
   */
  readonly centerCapHeightMm?: number;
}

/** Semantische Beschreibung eines Zeichens. Eingabe des Kompositionsmotors. */
export interface SymbolSpec {
  kind: SymbolKind;
  /**
   * Zweite belegte Zeichnung derselben Grundzeichenart. Fehlt sie, gilt die Zeichnung aus
   * Kapitel 1. Ein Wert, den die Art nicht führt, ist kein stiller Rückfall: `baseDrawing` wirft.
   */
  bodyVariant?: BodyVariantId;
  organization?: OrganizationId;
  strength?: StrengthId;
  administrativeLevel?: AdminLevelId;
  vehicleCategory?: VehicleCategoryId;
  capabilities?: readonly CapabilityId[];
  /**
   * Dieselben Fähigkeiten wie `capabilities`, aber in ihrer **randbündigen** Darstellung: das
   * Zeichen läuft über die volle Körperfläche statt in der Standardbox 4/8/24/16 mm zu stehen.
   * Anhang F trägt seine Fachdienstzeichen ausschließlich so — die Fachdienstteilung ist das
   * Kreuz auf den beiden Mittellinien des Körpers, von Kante zu Kante.
   *
   * **Warum ein zweites Feld und keine zweite Piktogrammdarstellung.** Eine Piktogrammdefinition
   * trägt eine feste Box; randbündig heißt aber „gegen die Hülle des platzierten Körpers", und
   * die ist je Körperform eine andere (Rechteck 30 × 20 mm, Landfahrzeugrumpf, Kreis). Zudem sind
   * die Maße der randbündigen Fassung **nicht** aus der Boxfassung skaliert: die Arztleiste misst
   * eigenständig 8 mm bei 10 mm im Kapitel-4-Zeichen, der Transportring r 5,5 statt r 7,0 (eigene
   * Vermessung an F.1.7, F.1.8 und 4.6.4/4.6.5, 18. August 2026). Die Zeichnung wird deshalb aus
   * der Körperhülle gerechnet und nicht aus einer Box skaliert.
   *
   * Fähigkeiten behalten ihre `CapabilityId`. Daneben darf `BodyMarkId` rein geometrische
   * `TechnicalBodyMarkId`s führen, wenn das Bild vermessen, aber keine Kapitel-4-Semantik belegt
   * ist. Eine ID ohne vermessene randbündige Fassung wirft; sie fällt **nicht** auf eine andere
   * Fassung zurück.
   */
  bodyMarks?: readonly BodyMarkId[];
  designation?: string;
  labels?: BodyLabels;
}
