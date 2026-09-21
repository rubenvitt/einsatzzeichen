import type { BlockEntry } from '@einsatzzeichen/schema';
import { UNDOCUMENTED_AT_SOURCE } from '../layout/zones.js';
import { babz, block, measured } from './helpers.js';

/*
 * Fähigkeit, Körpermarke und Funktionsfassung im Bausteinregister (LFH-564).
 *
 * **Fähigkeit** (`capability`): die Box-Fassung aus Kapitel 4, also die Piktogramme unter
 * `catalog/src/pictograms/capabilities/`. Jede der 88 Fähigkeiten hat dort eine Primärfassung.
 * Die randbündige Fassung derselben Kennung in `catalog/src/body-marks.ts` ist eine zweite,
 * je Körper vermessene Zeichnung. Sie ist Kombinationsbezug und gehört nicht in diesen Eintrag:
 * `bodyMark()` lässt sie ausdrücklich nicht auf die Boxfassung zurückfallen. Eine Fähigkeit, die
 * es **nur** randbündig gäbe, gibt es nicht.
 *
 * **Körpermarke** (`body-mark`): nur `TECHNICAL_BODY_MARK_IDS`. `BodyMarkId` umfasst zusätzlich
 * die Fähigkeiten; die stehen oben unter `capability`. Jede technische Marke ist laut Schema „an
 * genau einem Körper-/Variantenkontext vermessen“ und lehnt jeden anderen Kontext fail-closed ab.
 * Diese Bindung trägt im Regelkatalog **keine** Regel — `RULE_DIMENSION_GAPS` sagt für
 * `body-marks` selbst, dass es keine Regel gibt, welche Marke an welcher Körperform sitzen darf.
 * Sie steht deshalb nicht als `combinationBinding` da. Ausnahme ist `inset-hull-wheel-pair`: dort
 * trägt `inset-hull-requires-measured-body-mark` die Bindung.
 *
 * **Funktionsfassung** (`function-role`): jede Fassung in `catalog/src/function-roles.ts` bringt
 * Körper, Kopf und Läufe selbst mit. Geführt wird die Bindung an die Körperart
 * (`function-role-requires-measured-kind`). Kopf, Organisation und Körpermarken bindet `validate.ts`
 * über eigene Regeln, die ein einzelnes `combinationBinding` nicht fasst. Der Fundort nennt
 * weder Referenzabschnitt noch Messdatum.
 */

const PICTOGRAM_NOTE = 'Maße an der Referenz abgelesen, Geometrie eigenständig konstruiert.';

function capability(
  valueId: string,
  definedAt: string,
  section: string,
  title: string,
  referenceAsset: string,
): BlockEntry {
  return block(
    'capability',
    valueId,
    'inner-field',
    measured(
      definedAt,
      `Box-Fassung ${section} „${title}“ (${referenceAsset}). ${PICTOGRAM_NOTE}`,
      babz(section),
    ),
  );
}

export const CAPABILITY_BLOCKS: readonly BlockEntry[] = Object.freeze([
  capability(
    'cbrn-protection',
    'catalog/src/pictograms/capabilities/01-cbrn.ts:146–153',
    '4.1.1',
    'ABC-/CBRN-Schutz',
    '4.1.1_ABC_CBRN-Schutz.svg',
  ),
  capability(
    'cbrn-detection',
    'catalog/src/pictograms/capabilities/01-cbrn.ts:154–162',
    '4.1.2',
    'Messen, Spüren, Detektieren',
    '4.1.2_Messen Spüren Detektieren.svg',
  ),
  capability(
    'decontamination',
    'catalog/src/pictograms/capabilities/01-cbrn.ts:163–177',
    '4.1.3',
    'Dekontaminieren',
    '4.1.3_Dekontaminieren.svg',
  ),
  capability(
    'water-environmental-damage-control',
    'catalog/src/pictograms/capabilities/01-cbrn.ts:178–199',
    '4.1.4',
    'Umweltschädenbeseitigung auf Gewässern',
    '4.1.4_Umweltschädenbeseitigung auf Gewässern.svg',
  ),
  capability(
    'drinking-water-treatment',
    'catalog/src/pictograms/capabilities/01-cbrn.ts:200–226',
    '4.1.5',
    'Trinkwasseraufbereitung',
    '4.1.5_Trinkwasseraufbereitung.svg',
  ),
  capability(
    'radioactive-materials',
    'catalog/src/pictograms/capabilities/01-cbrn.ts:227–241',
    '4.1.6',
    'Atomare Stoffe',
    '4.1.6_Atomare Stoffe.svg',
  ),
  capability(
    'biological-materials',
    'catalog/src/pictograms/capabilities/01-cbrn.ts:251–264',
    '4.1.7',
    'Biologische Stoffe',
    '4.1.7_Biologische Stoffe.svg',
  ),
  capability(
    'chemical-materials',
    'catalog/src/pictograms/capabilities/01-cbrn.ts:274–287',
    '4.1.8',
    'Chemische Stoffe',
    '4.1.8_Chemische Stoffe.svg',
  ),
  capability(
    'care',
    'catalog/src/pictograms/capabilities/02-care.ts:28–35',
    '4.2.1',
    'Betreuung',
    '4.2.1_Betreuung Grundzeichne.svg',
  ),
  capability(
    'psychosocial-emergency-care',
    'catalog/src/pictograms/capabilities/02-care.ts:36–62',
    '4.2.2',
    'PSNV',
    '4.2.2_PSNV.svg',
  ),
  capability(
    'pastoral-care',
    'catalog/src/pictograms/capabilities/02-care.ts:63–77',
    '4.2.3',
    'Seelsorge',
    '4.2.3_Seelsorge.svg',
  ),
  capability(
    'temporary-accommodation-resting',
    'catalog/src/pictograms/capabilities/02-care.ts:78–97',
    '4.2.4',
    'Temporäre Unterbringung mit Ruhemöglichkeit',
    '4.2.4_Temporäre Unterbringung mit Ruhemöglichkeit.svg',
  ),
  capability(
    'temporary-accommodation-seating',
    'catalog/src/pictograms/capabilities/02-care.ts:98–107',
    '4.2.5',
    'Temporäre Unterbringung mit Sitzmöglichkeit',
    '4.2.5_Temporäre Unterbringung mit Sitzmöglichkeit.svg',
  ),
  capability(
    'fire-fighting',
    'catalog/src/pictograms/capabilities/03-fire-fighting.ts:23–32',
    '4.3.1',
    'Brandbekämpfung',
    '4.3.1_Brandbekämpfung.svg',
  ),
  capability(
    'service-water',
    'catalog/src/pictograms/capabilities/03-fire-fighting.ts:33–54',
    '4.3.2',
    'Löschwasser, Brauchwasser',
    '4.3.2_Löschwasser Brauchwasser.svg',
  ),
  capability(
    'foam-agent',
    'catalog/src/pictograms/capabilities/03-fire-fighting.ts:55–71',
    '4.3.3',
    'Schaummittel',
    '4.3.3_Schaummittel.svg',
  ),
  capability(
    'solid-extinguishing-agent',
    'catalog/src/pictograms/capabilities/03-fire-fighting.ts:72–82',
    '4.3.4',
    'Sonderlöschmittel, fest',
    '4.3.4_Sonderlöschmittel fest.svg',
  ),
  capability(
    'gaseous-extinguishing-agent',
    'catalog/src/pictograms/capabilities/03-fire-fighting.ts:83–91',
    '4.3.5',
    'Sonderlöschmittel, gasförmig',
    '4.3.5_Sonderlöschmittel gasförmig.svg',
  ),
  capability(
    'respiratory-protection',
    'catalog/src/pictograms/capabilities/03-fire-fighting.ts:92–113',
    '4.3.6',
    'Atemschutz',
    '4.3.6_Atemschutz.svg',
  ),
  capability(
    'reconnaissance',
    'catalog/src/pictograms/capabilities/04-reconnaissance.ts:23–24',
    '4.4.1',
    'Erkunden',
    '4.4.1_Erkunden.svg',
  ),
  capability(
    'biological-location',
    'catalog/src/pictograms/capabilities/04-reconnaissance.ts:25–44',
    '4.4.2',
    'Orten, biologisch',
    '4.4.2_Orten biologisch.svg',
  ),
  capability(
    'technical-location',
    'catalog/src/pictograms/capabilities/04-reconnaissance.ts:45–66',
    '4.4.3',
    'Orten, technisch',
    '4.4.3_Orten technisch.svg',
  ),
  capability(
    'recovery',
    'catalog/src/pictograms/capabilities/05-rescue.ts:89–98',
    '4.5.1',
    'Bergung',
    '4.5.1_Bergung.svg',
  ),
  capability(
    'rescue-portable-ladders',
    'catalog/src/pictograms/capabilities/05-rescue.ts:99–113',
    '4.5.2',
    'Retten aus Höhen und Tiefen mit tragbaren Leitern',
    '4.5.2_Retten aus Höhen und Tiefen mit tragbaren Leitern.svg',
  ),
  capability(
    'rescue-aerial-ladder',
    'catalog/src/pictograms/capabilities/05-rescue.ts:114–122',
    '4.5.3',
    'Retten aus Höhen und Tiefen mit Drehleiter',
    '4.5.3_Retten aus Höhen und Tiefen mit Drehleiter.svg',
  ),
  capability(
    'rescue-articulated-boom',
    'catalog/src/pictograms/capabilities/05-rescue.ts:123–132',
    '4.5.4',
    'Retten aus Höhen und Tiefen mit Teleskopgelenkmast',
    '4.5.4_Retten aus Höhen und Tiefen mit Teleskopgelenkmast.svg',
  ),
  capability(
    'watercraft-operations',
    'catalog/src/pictograms/capabilities/05-rescue.ts:133–149',
    '4.5.5',
    'Einsatz von Wasserfahrzeugen',
    '4.5.5_Einsatz von Wasserfahrzeugen.svg',
  ),
  capability(
    'mountain-rescue',
    'catalog/src/pictograms/capabilities/05-rescue.ts:150–168',
    '4.5.6',
    'Bergrettung',
    '4.5.6_Bergrettung.svg',
  ),
  capability(
    'special-height-depth-rescue',
    'catalog/src/pictograms/capabilities/05-rescue.ts:169–184',
    '4.5.7',
    'Spezielle Rettung aus Höhen und Tiefen',
    '4.5.7_Spezielle Rettung aus Höhen und Tiefen.svg',
  ),
  capability(
    'water-rescue',
    'catalog/src/pictograms/capabilities/05-rescue.ts:185–194',
    '4.5.8',
    'Wasserrettung',
    '4.5.8_Wasserrettung.svg',
  ),
  capability(
    'medical-service',
    'catalog/src/pictograms/capabilities/06-medical.ts:25–32',
    '4.6.1',
    'Sanität, Grundzeichen',
    '4.6.1_Sanität Grundzeichen.svg',
  ),
  capability(
    'nursing',
    'catalog/src/pictograms/capabilities/06-medical.ts:33–41',
    '4.6.2',
    'Pflege',
    '4.6.2_Pflege.svg',
  ),
  capability(
    'intensive-care',
    'catalog/src/pictograms/capabilities/06-medical.ts:42–50',
    '4.6.3',
    'Rettungswesen / Intensivmedizin',
    '4.6.3_Rettungswesen_Intensivmedizin.svg',
  ),
  capability(
    'physician',
    'catalog/src/pictograms/capabilities/06-medical.ts:51–59',
    '4.6.4',
    'Arztwesen',
    '4.6.4_Arztwesen.svg',
  ),
  capability(
    'patient-transport',
    'catalog/src/pictograms/capabilities/06-medical.ts:60–74',
    '4.6.5',
    'Patiententransport',
    '4.6.5_Patiententransport.svg',
  ),
  capability(
    'hospital',
    'catalog/src/pictograms/capabilities/06-medical.ts:75–98',
    '4.6.6',
    'Krankenhaus',
    '4.6.6_Krankenhaus.svg',
  ),
  capability(
    'water-hazard-control',
    'catalog/src/pictograms/capabilities/07-technical-assistance.ts:133–145',
    '4.7.1',
    'Abwehr von Wassergefahren',
    '4.7.1_Abwehr von Wassergefahren.svg',
  ),
  capability(
    'excavation',
    'catalog/src/pictograms/capabilities/07-technical-assistance.ts:146–157',
    '4.7.2',
    'Baggerarbeiten',
    '4.7.2_Baggerarbeiten.svg',
  ),
  capability(
    'lighting',
    'catalog/src/pictograms/capabilities/07-technical-assistance.ts:158–169',
    '4.7.3',
    'Beleuchten',
    '4.7.3_Beleuchten.svg',
  ),
  capability(
    'ventilation',
    'catalog/src/pictograms/capabilities/07-technical-assistance.ts:170–186',
    '4.7.4',
    'Belüften',
    '4.7.4_Belüften.svg',
  ),
  capability(
    'air-extraction',
    'catalog/src/pictograms/capabilities/07-technical-assistance.ts:187–204',
    '4.7.5',
    'Entlüften',
    '4.7.5_Entlüften.svg',
  ),
  capability(
    'explosive-ordnance-clearance',
    'catalog/src/pictograms/capabilities/07-technical-assistance.ts:205–219',
    '4.7.6',
    'Kampfmittelräumung',
    '4.7.6_Kampfmittelräumung.svg',
  ),
  capability(
    'hand-tools',
    'catalog/src/pictograms/capabilities/07-technical-assistance.ts:220–241',
    '4.7.7',
    'Einsatz von Handwerkzeugen',
    '4.7.7_Einsatz von Handwerkzeugen.svg',
  ),
  capability(
    'forklift-lifting',
    'catalog/src/pictograms/capabilities/07-technical-assistance.ts:242–253',
    '4.7.8',
    'Hebearbeit mit Gabelstapler',
    '4.7.8_Hebearbeit mit Gabelstapler.svg',
  ),
  capability(
    'crane-lifting',
    'catalog/src/pictograms/capabilities/07-technical-assistance.ts:254–262',
    '4.7.9',
    'Hebearbeit mit Kran',
    '4.7.9_Hebearbeit mit Kran.svg',
  ),
  capability(
    'lifting-loads-persons',
    'catalog/src/pictograms/capabilities/07-technical-assistance.ts:263–275',
    '4.7.10',
    'Heben von Lasten oder Personen',
    '4.7.10_Heben von Lasten oder Personen.svg',
  ),
  capability(
    'lifting-clearing',
    'catalog/src/pictograms/capabilities/07-technical-assistance.ts:290–301',
    '4.7.11',
    'Heben / Räumen',
    '4.7.11_Heben-Räumen.svg',
  ),
  capability(
    'remote-manipulation',
    'catalog/src/pictograms/capabilities/07-technical-assistance.ts:302–314',
    '4.7.12',
    'Fernmanipulieren',
    '4.7.12_Fernmanipulieren.svg',
  ),
  capability(
    'chainsaw',
    'catalog/src/pictograms/capabilities/07-technical-assistance.ts:315–328',
    '4.7.13',
    'Motorsägearbeiten',
    '4.7.13_Motorsägearbeiten.svg',
  ),
  capability(
    'pumping',
    'catalog/src/pictograms/capabilities/07-technical-assistance.ts:329–340',
    '4.7.14',
    'Pumpen',
    '4.7.14_Pumpen.svg',
  ),
  capability(
    'mechanized-clearing',
    'catalog/src/pictograms/capabilities/07-technical-assistance.ts:341–352',
    '4.7.15',
    'Räumarbeiten mit Maschine',
    '4.7.15_Räumarbeiten mit Maschine.svg',
  ),
  capability(
    'safety',
    'catalog/src/pictograms/capabilities/07-technical-assistance.ts:353–367',
    '4.7.16',
    'Sicherheit',
    '4.7.16_Sicherheit.svg',
  ),
  capability(
    'blasting',
    'catalog/src/pictograms/capabilities/07-technical-assistance.ts:368–379',
    '4.7.17',
    'Sprengen',
    '4.7.17_Sprengen.svg',
  ),
  capability(
    'technical-assistance',
    'catalog/src/pictograms/capabilities/07-technical-assistance.ts:380–395',
    '4.7.18',
    'Technische Hilfeleistung',
    '4.7.18_Technische Hilfeleistung.svg',
  ),
  capability(
    'transport',
    'catalog/src/pictograms/capabilities/07-technical-assistance.ts:396–414',
    '4.7.19',
    'Transportieren',
    '4.7.19_Transportieren.svg',
  ),
  capability(
    'door-opening',
    'catalog/src/pictograms/capabilities/07-technical-assistance.ts:415–427',
    '4.7.20',
    'Türöffnung',
    '4.7.20_Türöffnung.svg',
  ),
  capability(
    'overcoming-height-differences',
    'catalog/src/pictograms/capabilities/07-technical-assistance.ts:428–441',
    '4.7.21',
    'Höhenunterschiede überwinden',
    '4.7.21_Höhenunterschiede überwinden.svg',
  ),
  capability(
    'securing',
    'catalog/src/pictograms/capabilities/07-technical-assistance.ts:442–456',
    '4.7.22',
    'Absicherung',
    '4.7.22_Absicherung.svg',
  ),
  capability(
    'optical-warning',
    'catalog/src/pictograms/capabilities/07-technical-assistance.ts:457–472',
    '4.7.23',
    'Warnen mit optischen Anzeigen',
    '4.7.23_Warnen mit optischen Anzeigen.svg',
  ),
  capability(
    'loudspeaker-warning',
    'catalog/src/pictograms/capabilities/07-technical-assistance.ts:473–489',
    '4.7.24',
    'Warnen mit Lautsprecherdurchsagen',
    '4.7.24_Warnen mit Lautsprecherdurchsagen.svg',
  ),
  capability(
    'siren-warning',
    'catalog/src/pictograms/capabilities/07-technical-assistance.ts:490–502',
    '4.7.25',
    'Warnen mit Sirenen',
    '4.7.25_Warnen mit Sirenen.svg',
  ),
  capability(
    'water-conveyance',
    'catalog/src/pictograms/capabilities/07-technical-assistance.ts:503–517',
    '4.7.26',
    'Wasserförderung',
    '4.7.26_Wasserförderung.svg',
  ),
  capability(
    'water-retention',
    'catalog/src/pictograms/capabilities/07-technical-assistance.ts:518–530',
    '4.7.27',
    'Wasserrückhaltung',
    '4.7.27_Wasserrückhaltung.svg',
  ),
  capability(
    'load-pulling',
    'catalog/src/pictograms/capabilities/07-technical-assistance.ts:531–543',
    '4.7.28',
    'Ziehen von Lasten',
    '4.7.28_Ziehen von Lasten.svg',
  ),
  capability(
    'container-resource',
    'catalog/src/pictograms/capabilities/08-logistics.ts:85–93',
    '4.8.1',
    'Behälter',
    '4.8.1_Behälter.svg',
  ),
  capability(
    'fuels-consumables',
    'catalog/src/pictograms/capabilities/08-logistics.ts:94–108',
    '4.8.2',
    'Betriebsstoffe / Verbrauchsgüter',
    '4.8.2_Betriebsstoffe Verbrauchsgüter.svg',
  ),
  capability(
    'bridge',
    'catalog/src/pictograms/capabilities/08-logistics.ts:109–121',
    '4.8.3',
    'Brücke',
    '4.8.3_Brücke.svg',
  ),
  capability(
    'temporary-bridge-construction',
    'catalog/src/pictograms/capabilities/08-logistics.ts:122–138',
    '4.8.4',
    'Behelfsbrückenbau',
    '4.8.4_Behelfsbrückenbau.svg',
  ),
  capability(
    'waste-disposal',
    'catalog/src/pictograms/capabilities/08-logistics.ts:139–155',
    '4.8.5',
    'Entsorgung',
    '4.8.5_Entsorgung.svg',
  ),
  capability(
    'maintenance',
    'catalog/src/pictograms/capabilities/08-logistics.ts:156–169',
    '4.8.6',
    'Instandhaltung',
    '4.8.6_Instandhaltung.svg',
  ),
  capability(
    'sandbag',
    'catalog/src/pictograms/capabilities/08-logistics.ts:170–189',
    '4.8.7',
    'Sandsack',
    '4.8.7_Sandsack.svg',
  ),
  capability(
    'sandbag-filling',
    'catalog/src/pictograms/capabilities/08-logistics.ts:190–204',
    '4.8.8',
    'Sandsackbefüllung',
    '4.8.8_Sandsackbefüllung.svg',
  ),
  capability(
    'washing-facility',
    'catalog/src/pictograms/capabilities/08-logistics.ts:205–220',
    '4.8.9',
    'Sanitäre Einrichtung / Waschmöglichkeit',
    '4.8.9_Sanitäre Einrichtung_Waschmöglichkeit.svg',
  ),
  capability(
    'toilet-facility',
    'catalog/src/pictograms/capabilities/08-logistics.ts:221–237',
    '4.8.10',
    'Sanitäre Einrichtung / WC',
    '4.8.10_Sanitäre Einrichtung_WC.svg',
  ),
  capability(
    'power-supply',
    'catalog/src/pictograms/capabilities/08-logistics.ts:238–250',
    '4.8.11',
    'Stromversorgung',
    '4.8.11_Stromversorgung.svg',
  ),
  capability(
    'drinking-water',
    'catalog/src/pictograms/capabilities/08-logistics.ts:251–264',
    '4.8.12',
    'Trinkwasser',
    '4.8.12_Trinkwasser.svg',
  ),
  capability(
    'catering',
    'catalog/src/pictograms/capabilities/08-logistics.ts:265–273',
    '4.8.13',
    'Verpflegung',
    '4.8.13_Verpflegung.svg',
  ),
  capability(
    'meal-preparation',
    'catalog/src/pictograms/capabilities/08-logistics.ts:274–294',
    '4.8.14',
    'Verpflegung / Zubereitung',
    '4.8.14_Verpflegung_Zubereitung.svg',
  ),
  capability(
    'rapid-deployment-tent',
    'catalog/src/pictograms/capabilities/08-logistics.ts:295–304',
    '4.8.15',
    'Schnelleinsatzzelt',
    '4.8.15_Schnelleinsatzzelt.svg',
  ),
  capability(
    'frame-tent',
    'catalog/src/pictograms/capabilities/08-logistics.ts:305–319',
    '4.8.16',
    'Stangengerüstzelt',
    '4.8.16_Stangengerüstzelt.svg',
  ),
  capability(
    'information-communications',
    'catalog/src/pictograms/capabilities/09-information-communications.ts:6–21',
    '4.9.1',
    'Information und Kommunikation / Fernmeldewesen',
    '4.9.1_Information und Kommunikation Fernmeldewesen.svg',
  ),
  capability(
    'veterinary',
    'catalog/src/pictograms/capabilities/10-veterinary.ts:132–140',
    '4.10.1',
    'Veterinärwesen',
    '4.10.1_Veterinärwesen.svg',
  ),
  capability(
    'slaughter-culling',
    'catalog/src/pictograms/capabilities/10-veterinary.ts:141–150',
    '4.10.2',
    'Schlachten / Keulen',
    '4.10.2_Schlachten_Keulen.svg',
  ),
  capability(
    'chicken',
    'catalog/src/pictograms/capabilities/10-veterinary.ts:151–166',
    '4.10.3',
    'Huhn',
    '4.10.3_Huhn.svg',
  ),
  capability(
    'horse',
    'catalog/src/pictograms/capabilities/10-veterinary.ts:167–184',
    '4.10.4',
    'Pferd',
    '4.10.4_Pferd.svg',
  ),
  capability(
    'cattle',
    'catalog/src/pictograms/capabilities/10-veterinary.ts:185–200',
    '4.10.5',
    'Rind',
    '4.10.5_Rind.svg',
  ),
  capability(
    'sheep',
    'catalog/src/pictograms/capabilities/10-veterinary.ts:201–220',
    '4.10.6',
    'Schaf',
    '4.10.6_Schaf.svg',
  ),
  capability(
    'pig',
    'catalog/src/pictograms/capabilities/10-veterinary.ts:221–235',
    '4.10.7',
    'Schwein',
    '4.10.7_Schwein.svg',
  ),
]);

const BODY_MARKS_FILE = 'catalog/src/body-marks.ts';

/** Die einzige technische Körpermarke, deren Körperbindung eine Regel im Regelkatalog trägt. */
const INSET_HULL_BINDING = {
  ruleId: 'inset-hull-requires-measured-body-mark',
  definedAt: 'core/src/validate.ts:414–441',
  reason:
    'An der eingesenkten Hülle sind die Körpermarken nur als keine oder inset-hull-wheel-pair für die Hilfsorganisation und als fire-fighting für die Feuerwehr vermessen.',
} as const;

function bodyMark(
  valueId: string,
  lines: string,
  note: string,
  sourceRefs?: readonly string[],
): BlockEntry {
  return block(
    'body-mark',
    valueId,
    'body',
    measured(
      `${BODY_MARKS_FILE}:${lines}`,
      note,
      sourceRefs === undefined ? undefined : babz(...sourceRefs),
    ),
    valueId === 'inset-hull-wheel-pair' ? INSET_HULL_BINDING : undefined,
  );
}

export const BODY_MARK_BLOCKS: readonly BlockEntry[] = Object.freeze([
  bodyMark(
    'ring-7mm-offset-down-1mm',
    '834–844',
    'F.1.13: Kreis r 7 mm, Mittelpunkt 1 mm unter der Körpermitte.',
    ['F.1.13'],
  ),
  bodyMark(
    'chevron-over-opposed-triangles',
    '846–869',
    'F.1.16: ein gefüllter Winkel über zwei zur Körpermitte gerichteten Dreiecken.',
    ['F.1.16'],
  ),
  bodyMark(
    'ring-6-5mm-offset-down-2mm-with-roof',
    '908–937',
    'F.1.21: eigener Ring r 6,5 mm, Dach und eingeschriebenes Dreieck.',
    ['F.1.21'],
  ),
  bodyMark(
    'top-center-rect-0-5x0-6mm',
    '1399–1407',
    `${UNDOCUMENTED_AT_SOURCE}0,5 × 0,6 mm großes gefülltes Rechteck mittig 2,5 mm unter der Oberkante, nur am Landfahrzeug mit Radpaar (\`VEHICLE_LAND_PLAIN_WHEEL_PAIR_MARKS\`).`,
  ),
  bodyMark(
    'air-winch-chevron-diamond',
    '1835–1851',
    'F.2.6: Winde. Maße an der Referenz abgelesen, Geometrie eigenständig konstruiert (Mittellinien statt der Außenkonturpunkte der früheren Fassung).',
    ['F.2.6'],
  ),
  bodyMark(
    'ring-6mm-offset-down-3mm-four-way-stem',
    '1552',
    `${UNDOCUMENTED_AT_SOURCE}Eintrag in \`VEHICLE_LAND_NORMAL_MARKS\`, gezeichnet von \`landFourWayStem\`; dort ist nur der Fuß an F.2.11 nachgemessen.`,
  ),
  bodyMark(
    'ring-5mm-offset-down-3mm-eight-spokes',
    '1553',
    `${UNDOCUMENTED_AT_SOURCE}Eintrag in \`VEHICLE_LAND_NORMAL_MARKS\`, gezeichnet von \`landShiftedEightSpokes\`.`,
  ),
  bodyMark(
    'circle-patient-staging-arrows',
    '1122–1131',
    'Tabelle `CIRCLE_NORMAL_MARKS`: F.3.1 bis F.3.14 und F.3.17 bis F.3.19, am 26. August 2026 je Quelle separat vermessen, gegen die 24 × 24-mm-Hülle gerechnet.',
  ),
  bodyMark(
    'circle-collection-arrow',
    '1132–1140',
    'Tabelle `CIRCLE_NORMAL_MARKS`: F.3.1 bis F.3.14 und F.3.17 bis F.3.19, am 26. August 2026 je Quelle separat vermessen, gegen die 24 × 24-mm-Hülle gerechnet.',
  ),
  bodyMark(
    'circle-staging-frame-arrow',
    '1141–1155',
    'Tabelle `CIRCLE_NORMAL_MARKS`: F.3.1 bis F.3.14 und F.3.17 bis F.3.19, am 26. August 2026 je Quelle separat vermessen, gegen die 24 × 24-mm-Hülle gerechnet.',
  ),
  bodyMark(
    'circle-staging-frame',
    '1156–1165',
    'Tabelle `CIRCLE_NORMAL_MARKS`: F.3.1 bis F.3.14 und F.3.17 bis F.3.19, am 26. August 2026 je Quelle separat vermessen, gegen die 24 × 24-mm-Hülle gerechnet.',
  ),
  bodyMark(
    'circle-staging-frame-quadrants-arrows',
    '1166–1182',
    'Tabelle `CIRCLE_NORMAL_MARKS`: F.3.1 bis F.3.14 und F.3.17 bis F.3.19, am 26. August 2026 je Quelle separat vermessen, gegen die 24 × 24-mm-Hülle gerechnet.',
  ),
  bodyMark(
    'circle-diamond-arrow',
    '1183–1196',
    'F.3.10: aus den jeweils gegenüberliegenden Konturseiten des 0,5-mm-Umrisses gemittelte Mittellinienpunkte; Anschlag und Pfeil darunter getrennt vermessen.',
    ['F.3.10'],
  ),
  bodyMark(
    'circle-cross-ring',
    '1197–1208',
    'Tabelle `CIRCLE_NORMAL_MARKS`: F.3.1 bis F.3.14 und F.3.17 bis F.3.19, am 26. August 2026 je Quelle separat vermessen, gegen die 24 × 24-mm-Hülle gerechnet.',
  ),
  bodyMark(
    'circle-double-arrow-lower-v',
    '1209–1219',
    'Tabelle `CIRCLE_NORMAL_MARKS`: F.3.1 bis F.3.14 und F.3.17 bis F.3.19, am 26. August 2026 je Quelle separat vermessen, gegen die 24 × 24-mm-Hülle gerechnet.',
  ),
  bodyMark(
    'circle-information-stem',
    '1220',
    'Tabelle `CIRCLE_NORMAL_MARKS` (F.3, am 26. August 2026 vermessen); zusätzlich in `CIRCLE_RAISED_ONE_MM_MARKS` (N.2.3: am um 1 mm angehobenen Kreis ausschließlich diese eine Marke vermessen).',
  ),
  bodyMark(
    'circle-transport-diamond-arrows',
    '1221–1229',
    'Tabelle `CIRCLE_NORMAL_MARKS`: F.3.1 bis F.3.14 und F.3.17 bis F.3.19, am 26. August 2026 je Quelle separat vermessen, gegen die 24 × 24-mm-Hülle gerechnet.',
  ),
  bodyMark(
    'circle-transport-diamond-wheels-arrows',
    '1230–1238',
    'Tabelle `CIRCLE_NORMAL_MARKS`: F.3.1 bis F.3.14 und F.3.17 bis F.3.19, am 26. August 2026 je Quelle separat vermessen, gegen die 24 × 24-mm-Hülle gerechnet.',
  ),
  bodyMark(
    'circle-two-waves-diamond',
    '1289–1313',
    'Tabelle `CIRCLE_RAISED_GABLE_MARKS`: I.4.1 ergänzt seit der unabhängigen Messung vom 27. August 2026 eine technische Marke ausschließlich an der exakten raised-gable-Hülle (4|6)–(28|30).',
  ),
  bodyMark(
    'circle-diagonal-double-arrow-offset-bowl',
    '1239–1253',
    'Tabelle `CIRCLE_NORMAL_MARKS`: I.4.2 und I.4.3 am 27. August 2026 unabhängig ergänzt, auf die exakte Lage (4|4)–(28|28) begrenzt.',
  ),
  bodyMark(
    'circle-wide-bowl',
    '1254–1262',
    'Tabelle `CIRCLE_NORMAL_MARKS`: I.4.2 und I.4.3 am 27. August 2026 unabhängig ergänzt, auf die exakte Lage (4|4)–(28|28) begrenzt.',
  ),
  bodyMark(
    'formation-solid-cap-3mm',
    '397–405',
    `${UNDOCUMENTED_AT_SOURCE}3 mm hohe gefüllte Kappe über die volle Breite der Formation (\`MARKS\`).`,
  ),
  bodyMark(
    'formation-solid-cap-3.7mm-three-hole-row',
    '406–424',
    `${UNDOCUMENTED_AT_SOURCE}3,7 mm hohe gefüllte Kappe mit drei weißen Löchern r 1,5 mm (\`MARKS\`).`,
  ),
  bodyMark(
    'formation-solid-cap-4mm-three-hole-row',
    '425–440',
    `${UNDOCUMENTED_AT_SOURCE}4 mm hohe gefüllte Kappe mit drei weißen Löchern r 1,5 mm (\`MARKS\`).`,
  ),
  bodyMark(
    'formation-water-rescue-compact',
    '442–484',
    'I.1.5 bis I.1.8: die kompakte, körperbezogene Wasserrettungsfassung — ausdrücklich nicht die 23 mm breite Boxfassung aus 4.5.8.',
    ['I.1.5–I.1.8'],
  ),
  bodyMark(
    'h-veterinary-decontamination',
    '578–605',
    'H.2: Veterinär- und Tierdekontaminationsmarke, Maße an der Referenz abgelesen (Fachreview 19.09.2026).',
    ['H.2'],
  ),
  bodyMark(
    'h-veterinary-slaughter',
    '607–632',
    'H.3: Veterinär-V mit der eigenständig vermessenen Schlacht-/Untersuchungsmarke links.',
    ['H.3'],
  ),
  bodyMark(
    'land-horizontal-blade-bent-upright',
    '1606–1620',
    'N.1.1, Maße an der Referenz abgelesen: Schild waagerecht auf y 14,5, senkrechter Strich x 21 mit Knick bei (21|18,5).',
    ['N.1.1'],
  ),
  bodyMark(
    'ring-5mm-offset-down-3-5mm-eight-spokes',
    '1554–1566',
    `${UNDOCUMENTED_AT_SOURCE}Ring r 5 mm mit acht Speichen, 6,5 mm über der Unterkante (\`VEHICLE_LAND_NORMAL_MARKS\`).`,
  ),
  bodyMark(
    'air-quartering-up-arrow-box',
    '1852–1868',
    'N.1.4, Maße an der Referenz abgelesen: Schaft x 23 bis zur Spitze (23|9), Kasten 5 × 5 mm ab (20,5|15).',
    ['N.1.4'],
  ),
  bodyMark(
    'air-horizontal-left-chevron',
    '1874–1881',
    `${UNDOCUMENTED_AT_SOURCE}waagerechter Strich mit nach links weisendem Winkel am Festflügelrumpf (\`VEHICLE_AIR_FIXED_WING_MARKS\`).`,
  ),
  bodyMark(
    'air-rising-diagonal',
    '1882–1890',
    'N.1.6, Maße an der Referenz abgelesen: die Diagonale steigt mit 1 : 2 aus der linken Rumpfecke bis auf den Bogen.',
    ['N.1.6'],
  ),
  bodyMark(
    'spontaneous-helper-collection-arrow',
    '1905–1914',
    'Tabelle `CIRCLE_NORMAL_ANHANG_N_MARKS`: N.2.1/N.2.2, Innenmarken ausschließlich auf dem normalen 12-mm-Kreis (Hülle 4…28).',
  ),
  bodyMark(
    'spontaneous-helper-contact-double-arrow',
    '1915–1924',
    'Tabelle `CIRCLE_NORMAL_ANHANG_N_MARKS`: N.2.1/N.2.2, Innenmarken ausschließlich auf dem normalen 12-mm-Kreis (Hülle 4…28).',
  ),
  bodyMark(
    'inset-hull-wheel-pair',
    '1990–1999',
    'Tabelle `VEHICLE_WATER_INSET_HULL_MARKS`: I.3.4 und I.3.11, eigenständig vermessene Marken des eingesenkten Wasserrumpfs.',
  ),
  bodyMark(
    'formation-two-waves-diamond',
    '500–501',
    'I.1.1 bis I.1.4: zwei Wellen über einer Raute auf der normalen Formationshülle.',
    ['I.1.1–I.1.4'],
  ),
  bodyMark(
    'formation-water-rescue-lower-zone',
    '503–517',
    'I.1.15 bis I.1.20: die kompakte Wasserrettungsmarke der Formation. Maße an der Referenz abgelesen (I.1.15, I.1.17, I.1.19), Geometrie eigenständig konstruiert.',
    ['I.1.15–I.1.20'],
  ),
  bodyMark(
    'formation-hooked-crossed-disks-over-lowered-wave-diamond',
    '519–563',
    'I.1.13 und I.1.14: eine eigene technische Composite-Marke, gemeinsam an genau diesen beiden normalen Formationskörpern vermessen. Maße an der Referenz abgelesen, Geometrie eigenständig konstruiert.',
    ['I.1.13', 'I.1.14'],
  ),
  bodyMark(
    'formation-opposed-triangles-top',
    '871–890',
    'I.1.19: zwei gefüllte, zur Mitte gerichtete Dreiecke in der oberen Inhaltszone.',
    ['I.1.19'],
  ),
  bodyMark(
    'formation-chevron-top',
    '892–906',
    'I.1.20: ein einzelner gefüllter Winkel in der oberen Inhaltszone.',
    ['I.1.20'],
  ),
  bodyMark(
    'double-wave-inner-diamond-8mm',
    '980–988',
    'Tabelle `PERSON_I5_MARKS`: I.5.1 bis I.5.3, zwei Wellen und die innere Raute relativ zum Mittelpunkt der 26-mm-Raute; Maße an der Referenz abgelesen (I.5.1, I.5.2).',
  ),
  bodyMark(
    'trailer-water-rescue',
    '1928–1937',
    'I.2.4: zwei Wellen über der Raute, nur am normalen Anhängerrumpf. Maße an der Referenz abgelesen.',
    ['I.2.4'],
  ),
  bodyMark(
    'trailer-diving',
    '1938–1947',
    'I.2.5/I.2.6: kompaktere Fassung, getrennt von I.2.4 abgelesen.',
    ['I.2.5', 'I.2.6'],
  ),
  bodyMark(
    'trailer-boat-hull',
    '1948–1962',
    'I.2.7: der Bootsrumpf, als Strich konstruiert. Maße an der Referenz abgelesen.',
    ['I.2.7'],
  ),
]);

const FUNCTION_ROLES_FILE = 'catalog/src/function-roles.ts';

/**
 * Die Fassung bringt ihren Körper mit. `validate.ts` löst die Regel an zwei Stellen aus: für jede
 * Art außer Formation und Person, und für jede Art, an der die einzelne Fassung nicht vermessen
 * ist. Der Bereich umfasst beide.
 */
const FUNCTION_ROLE_BINDING = {
  ruleId: 'function-role-requires-measured-kind',
  definedAt: 'core/src/validate.ts:295–313',
  reason:
    'Eine gemessene Funktion ist nur an Formation oder Person belegt, und jede einzelne Fassung zusätzlich nur an der Art, für die sie vermessen wurde.',
} as const;

function functionRole(valueId: string, lines: string, title: string, kind: string): BlockEntry {
  return block(
    'function-role',
    valueId,
    'body',
    measured(
      `${FUNCTION_ROLES_FILE}:${lines}`,
      `${UNDOCUMENTED_AT_SOURCE}Funktionsfassung „${title}“ an ${kind}; Körper, Kopf und Läufe stehen in \`DEFINITIONS\`.`,
    ),
    FUNCTION_ROLE_BINDING,
  );
}

export const FUNCTION_ROLE_BLOCKS: readonly BlockEntry[] = Object.freeze([
  functionRole('disaster-control-command', '164–169', 'Katastrophenschutzleitung', 'formation'),
  functionRole('technical-incident-command-evacuation', '170–178', 'Technische Einsatzleitung Evakuierung', 'formation'),
  functionRole('incident-command', '179–184', 'Einsatzleitung', 'formation'),
  functionRole('incident-section-command-north', '185–193', 'Einsatzabschnittsleitung Nord', 'formation'),
  functionRole('incident-subsection-command', '194–199', 'Untereinsatzabschnittsleitung', 'formation'),
  functionRole('technical-incident-command-group', '200–207', 'Führungsgruppe Technische Einsatzleitung', 'formation'),
  functionRole('fire-service-readiness-command-group', '208–222', 'Führungsgruppe einer Feuerwehrbereitschaft', 'formation'),
  functionRole('technical-incident-commander', '223–230', 'Technischer Einsatzleiter', 'person'),
  functionRole('incident-commander', '231–235', 'Einsatzleiter', 'person'),
  functionRole('lead-emergency-physician', '236–242', 'Leitender Notarzt', 'person'),
  functionRole('organizational-incident-commander', '243–249', 'Organisatorischer Leiter', 'person'),
  functionRole('incident-section-commander', '250–254', 'Einsatzabschnittsleiter', 'person'),
  functionRole('incident-subsection-commander', '255–259', 'Untereinsatzabschnittsleiter', 'person'),
  functionRole('fire-service-platoon-commander', '260–266', 'Zugführer der Feuerwehr', 'person'),
  functionRole('technical-platoon-commander', '267–273', 'Zugführer Technischer Zug', 'person'),
  functionRole('medical-platoon-commander', '274–281', 'Zugführer Sanitätszug', 'person'),
  functionRole('operational-unit-platoon-commander', '282–289', 'Zugführer Einsatzeinheit', 'person'),
  functionRole('care-platoon-commander', '290–297', 'Zugführer Betreuungszug', 'person'),
  functionRole('care-group-commander', '298–305', 'Gruppenführer Betreuungsgruppe', 'person'),
  functionRole('rapid-response-group-commander', '306–313', 'Gruppenführer Schnell-Einsatzgruppe', 'person'),
  functionRole('district-control-center-director', '314–321', 'Leiter Kreisleitstelle', 'person'),
  functionRole('district-fire-chief', '322–336', 'Kreisbrandmeister', 'person'),
  functionRole('hazard-response-director', '337–344', 'Leiter Gefahrenabwehr', 'person'),
  functionRole('hazard-response-forces-director', '345–351', 'Leiter Gefahrenabwehrkräfte', 'person'),
  functionRole('international-relief-operation-director', '352–358', 'Leiter internationale Hilfsaktion', 'person'),
]);
