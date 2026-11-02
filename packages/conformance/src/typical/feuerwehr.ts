import type { SymbolSpec } from '@einsatzzeichen/schema';
import type { TypicalSymbol } from './types.js';

/*
 * Typische Einsatzmittel der Feuerwehr, die Anhang C nicht als Beispiel führt (ESZ-147).
 *
 * Nicht aufgenommen, weil schon Beispiel der Baseline: HLF 10/HLF 20 und LF 10/LF 20 (C.2.8 und
 * C.2.9 tragen „(H)LF“), TSF-W (C.2.5), MTW (C.2.23 MTF), Rüstwagen (C.2.18), Drehleitern
 * (C.2.14 bis C.2.16), Feuerwehrkran (C.2.27), SW KatS (C.2.26), Zugführer (D.3.7),
 * Kreisbrandmeister (D.4.2), Einsatzleiter (D.3.2, Farbe Führung). Ebenso nicht die Beispiele
 * aus Anhang C, die noch ohne Rezept sind, aber eine Referenzdatei haben und damit später in
 * RECIPES gehören: Kommandowagen (C.2.1), ELW 1 und 2 (C.2.2, C.2.3), Wechselladerfahrzeug
 * (C.2.19), GW-L1 und GW-L2 (C.2.21, C.2.22), Fachzug (C.1.5), Fachdienst Brandschutz (C.1.6),
 * ABC-Erkundungsgruppe (C.1.9), Gefahrstoffzug (C.1.11), Analytische Task Force (C.1.12) und
 * Tauchergruppe (C.1.15).
 */

/** Landfahrzeug der Feuerwehr nach dem Muster C.2.4 bis C.2.13: Marke randbündig, Kürzel oben links. */
function fwVehicle(
  bodyMarks: SymbolSpec['bodyMarks'],
  topLeft: string,
  vehicleCategory: 'kfz-kategorie-1' | 'kfz-kategorie-2' = 'kfz-kategorie-1',
): SymbolSpec {
  return {
    kind: 'vehicle-land',
    organization: 'feuerwehr',
    vehicleCategory,
    bodyMarks,
    labels: { inBodyInk: 'koerperlauf-kontrast', topLeft },
  };
}

/** Abrollbehälter (5.1.3.1) der Feuerwehr mit seiner Fachaufgabe im Körper. */
function fwRollOffContainer(bodyMarks: SymbolSpec['bodyMarks']): SymbolSpec {
  return { kind: 'roll-off-container', organization: 'feuerwehr', bodyMarks };
}

/** Anhänger der Feuerwehr nach C.2.29: ein Rad, Fachaufgabe im Körper. */
function fwTrailer(bodyMarks: SymbolSpec['bodyMarks']): SymbolSpec {
  return { kind: 'trailer', organization: 'feuerwehr', vehicleCategory: 'anhaenger-ein-rad', bodyMarks };
}

export const TYPICAL_FEUERWEHR = {
  // --- Löschfahrzeuge außerhalb der aktuellen DIN-Reihe, die noch verbreitet im Dienst sind ---
  'feuerwehr.lf-kats': {
    title: 'Löschgruppenfahrzeug Katastrophenschutz',
    abbreviation: 'LF-KatS',
    group: 'feuerwehr',
    spec: fwVehicle(['fire-fighting'], 'LF-KatS', 'kfz-kategorie-2'),
    pattern: ['C.2.10'],
    context:
      'Allradlöschfahrzeug aus der Ergänzungsausstattung des Bundes für den Zivilschutz (seit 2016), Nachfolger des LF 16-TS.',
    aliases: ['LF KatS', 'Bundes-LF', 'LF-KatS Bund'],
  },
  'feuerwehr.lf-16-ts': {
    title: 'Löschgruppenfahrzeug 16-TS',
    abbreviation: 'LF 16-TS',
    group: 'feuerwehr',
    spec: fwVehicle(['fire-fighting'], 'LF 16-TS'),
    pattern: ['C.2.9'],
    context:
      'Löschgruppenfahrzeug des erweiterten Katastrophenschutzes nach DIN 14530-11 (alte Fassung) mit Tragkraftspritze, in vielen Ländern noch im KatS-Dienst.',
    aliases: ['LF 16 TS', 'LF16-TS'],
  },
  'feuerwehr.lf-8-6': {
    title: 'Löschgruppenfahrzeug 8/6',
    abbreviation: 'LF 8/6',
    group: 'feuerwehr',
    spec: fwVehicle(['fire-fighting'], 'LF 8/6'),
    pattern: ['C.2.8'],
    context: 'Löschgruppenfahrzeug mit 600-l-Tank nach DIN 14530-8 (alte Fassung), Vorgänger des LF 10.',
    aliases: ['LF 8-6', 'LF8/6', 'LF 8'],
  },
  'feuerwehr.lf-16-12': {
    title: 'Löschgruppenfahrzeug 16/12',
    abbreviation: 'LF 16/12',
    group: 'feuerwehr',
    spec: fwVehicle(['fire-fighting'], 'LF 16/12'),
    pattern: ['C.2.9'],
    context: 'Löschgruppenfahrzeug mit 1.200-l-Tank nach DIN 14530-11 (alte Fassung), Vorgänger des LF 20.',
    aliases: ['LF 16-12', 'LF16/12', 'LF 16'],
  },
  'feuerwehr.tlf-16-25': {
    title: 'Tanklöschfahrzeug 16/25',
    abbreviation: 'TLF 16/25',
    group: 'feuerwehr',
    spec: fwVehicle(['fire-fighting'], 'TLF 16/25'),
    pattern: ['C.2.12'],
    context: 'Tanklöschfahrzeug mit 2.500-l-Tank nach DIN 14530-18 (alte Fassung), Vorgänger von TLF 3000/4000.',
    aliases: ['TLF 16-25', 'TLF16/25', 'TLF 16'],
  },

  // --- Sonderfahrzeuge ---
  'feuerwehr.vorausruestwagen': {
    title: 'Vorausrüstwagen',
    abbreviation: 'VRW',
    group: 'feuerwehr',
    spec: fwVehicle(['technical-assistance'], 'VRW'),
    pattern: ['C.2.18'],
    context: 'Kleines, schnelles Fahrzeug für die Erstmaßnahmen der Technischen Hilfeleistung, vor allem Verkehrsunfälle.',
    aliases: ['VRF', 'Vorausrüstfahrzeug'],
  },
  'feuerwehr.kleinalarmfahrzeug': {
    title: 'Kleinalarmfahrzeug',
    abbreviation: 'KLAF',
    group: 'feuerwehr',
    spec: fwVehicle(['technical-assistance'], 'KLAF'),
    pattern: ['C.2.18'],
    context: 'Kleinfahrzeug für Kleineinsätze der Technischen Hilfeleistung (Ölspur, Türöffnung, Sturmschaden), vor allem bei Berufsfeuerwehren.',
    aliases: ['KlAF', 'Kleineinsatzfahrzeug', 'KEF'],
  },
  'feuerwehr.gw-atemschutz': {
    title: 'Gerätewagen Atemschutz',
    abbreviation: 'GW-A',
    group: 'feuerwehr',
    // Das Atemschutzzeichen steht links im Körper; das Kürzel deshalb unten rechts wie der
    // Trägerlauf in Anhang E, damit es die Marke nicht kreuzt.
    spec: {
      kind: 'vehicle-land',
      organization: 'feuerwehr',
      vehicleCategory: 'kfz-kategorie-1',
      bodyMarks: ['respiratory-protection'],
      labels: { inBodyInk: 'koerperlauf-kontrast', bottomRight: 'GW-A' },
    },
    pattern: ['C.2.20', 'E.2.1'],
    context: 'Gerätewagen mit Atemschutzreserve und Atemschutzwerkstatt für längere Einsätze unter Atemschutz (FwDV 7).',
    aliases: ['GW-AS', 'GW Atemschutz', 'GW-A/S', 'Gerätewagen Atemschutz/Strahlenschutz'],
  },
  'feuerwehr.gw-messtechnik': {
    title: 'Gerätewagen Messtechnik',
    abbreviation: 'GW-Mess',
    group: 'feuerwehr',
    spec: {
      kind: 'vehicle-land',
      organization: 'feuerwehr',
      vehicleCategory: 'kfz-kategorie-1',
      bodyMarks: ['cbrn-detection'],
      labels: { inBodyInk: 'koerperlauf-kontrast', topLeftLines: ['GW', 'Mess'] },
    },
    pattern: ['C.2.24'],
    context: 'Gerätewagen für Messen und Spüren von Gefahrstoffen und Strahlung im Gefahrstoffeinsatz der Feuerwehr.',
    aliases: ['GW Mess', 'Messfahrzeug', 'GW-Messtechnik'],
  },
  'feuerwehr.gw-hoehenrettung': {
    title: 'Gerätewagen Höhenrettung',
    abbreviation: 'GW-H',
    group: 'feuerwehr',
    spec: {
      kind: 'vehicle-land',
      organization: 'feuerwehr',
      vehicleCategory: 'kfz-kategorie-1',
      bodyMarks: ['special-height-depth-rescue'],
      labels: { inBodyInk: 'koerperlauf-kontrast', bottomRight: 'GW-H' },
    },
    pattern: ['C.2.18', 'E.2.1'],
    context: 'Gerätewagen der Höhenrettungsgruppe für die spezielle Rettung aus Höhen und Tiefen (Berufsfeuerwehren).',
    aliases: ['GW-Höhenrettung', 'GW Höhenrettung', 'GW-HR'],
  },
  'feuerwehr.schlauchwagen-2000': {
    title: 'Schlauchwagen 2000',
    abbreviation: 'SW 2000',
    group: 'feuerwehr',
    spec: fwVehicle(['water-conveyance'], 'SW 2000'),
    pattern: ['C.2.26'],
    context: 'Schlauchwagen mit 2.000 m B-Schlauch nach DIN 14565 für die Wasserförderung über lange Wegstrecken.',
    aliases: ['SW 2000-Tr', 'SW2000'],
  },

  // --- Abrollbehälter (5.1.3.1) ---
  'feuerwehr.ab-atemschutz': {
    title: 'Abrollbehälter Atemschutz',
    abbreviation: 'AB-Atemschutz',
    group: 'feuerwehr',
    spec: fwRollOffContainer(['respiratory-protection']),
    pattern: ['5.1.3.1'],
    context: 'Abrollbehälter mit Atemschutzreserve für den Wechselladerbetrieb (DIN 14505), vor allem in Kreis- und Berufsfeuerwehren.',
    aliases: ['AB-A', 'AB Atemschutz', 'AB-AS'],
  },
  'feuerwehr.ab-gefahrgut': {
    title: 'Abrollbehälter Gefahrgut',
    abbreviation: 'AB-G',
    group: 'feuerwehr',
    spec: fwRollOffContainer(['cbrn-protection']),
    pattern: ['5.1.3.1'],
    context: 'Abrollbehälter mit Ausrüstung für den Gefahrstoffeinsatz (Auffangen, Abdichten, Umpumpen).',
    aliases: ['AB-Gefahrgut', 'AB-Gefahrstoff', 'AB-GG'],
  },
  'feuerwehr.ab-schlauch': {
    title: 'Abrollbehälter Schlauch',
    abbreviation: 'AB-Schlauch',
    group: 'feuerwehr',
    spec: fwRollOffContainer(['water-conveyance']),
    pattern: ['5.1.3.1'],
    context: 'Abrollbehälter mit verlegbarem B- oder F-Schlauch für die Wasserförderung über lange Wegstrecken.',
    aliases: ['AB-S', 'AB Schlauch', 'AB-Wasserförderung'],
  },
  'feuerwehr.ab-ruest': {
    title: 'Abrollbehälter Rüst',
    abbreviation: 'AB-Rüst',
    group: 'feuerwehr',
    spec: fwRollOffContainer(['technical-assistance']),
    pattern: ['5.1.3.1'],
    context: 'Abrollbehälter mit Ausrüstung für schwere Technische Hilfeleistung, Ergänzung des Rüstwagens.',
    aliases: ['AB-R', 'AB-Rüstmaterial', 'AB-TH'],
  },
  'feuerwehr.ab-dekon-p': {
    title: 'Abrollbehälter Dekontamination Personal',
    abbreviation: 'AB-Dekon P',
    group: 'feuerwehr',
    spec: fwRollOffContainer(['decontamination']),
    pattern: ['5.1.3.1'],
    context: 'Abrollbehälter für die Dekontamination von Einsatzkräften nach FwDV 500, Alternative zum GW Dekon P.',
    aliases: ['AB-Dekon', 'AB Dekon-P'],
  },
  'feuerwehr.ab-sonderloeschmittel': {
    title: 'Abrollbehälter Sonderlöschmittel',
    abbreviation: 'AB-SLM',
    group: 'feuerwehr',
    spec: fwRollOffContainer(['foam-agent']),
    pattern: ['5.1.3.1'],
    context: 'Abrollbehälter mit Schaummittelvorrat und Schaumwerfer für Großbrände, etwa in Tanklagern und Industrie.',
    aliases: ['AB-Schaum', 'AB-Schaummittel', 'AB-Sonderlöschmittel'],
  },
  'feuerwehr.ab-wasser': {
    title: 'Abrollbehälter Wasser',
    abbreviation: 'AB-Wasser',
    group: 'feuerwehr',
    spec: fwRollOffContainer(['service-water']),
    pattern: ['5.1.3.1'],
    context: 'Abrollbehälter mit Tank für den Löschwassertransport im Pendelverkehr, etwa bei Wald- und Vegetationsbränden.',
    aliases: ['AB-Tank', 'AB-Löschwasser', 'AB-W'],
  },

  // --- Anhänger ---
  'feuerwehr.lichtmastanhaenger': {
    title: 'Lichtmastanhänger Feuerwehr',
    abbreviation: 'LiMa-Anh',
    group: 'feuerwehr',
    spec: fwTrailer(['lighting']),
    pattern: ['C.2.29'],
    context: 'Anhänger mit Lichtmast und Stromerzeuger zur Ausleuchtung von Einsatzstellen.',
    aliases: ['Lichtmastanhänger', 'Lichtmast', 'Beleuchtungsanhänger'],
  },
  'feuerwehr.schlauchanhaenger': {
    title: 'Schlauchanhänger',
    abbreviation: 'SA',
    group: 'feuerwehr',
    spec: fwTrailer(['water-conveyance']),
    pattern: ['C.2.29', 'C.2.26'],
    context: 'Anhänger mit in Buchten verlegtem B-Schlauch für die Wasserförderung über längere Wegstrecken.',
    aliases: ['Schlauchtransportanhänger', 'STA'],
  },
  'feuerwehr.oelschadenanhaenger': {
    title: 'Ölschadenanhänger',
    abbreviation: 'Öl-Anh',
    group: 'feuerwehr',
    spec: { kind: 'trailer', organization: 'feuerwehr', vehicleCategory: 'anhaenger-ein-rad', labels: { center: 'Öl' } },
    pattern: ['C.2.29', 'E.1.9'],
    context: 'Anhänger mit Ölbindemittel, Ölsperren und Auffangbehältern für Öl- und Kraftstoffschäden.',
    aliases: ['Ölwehranhänger', 'Ölspuranhänger', 'Anhänger Ölschaden'],
  },
  'feuerwehr.pulverloeschanhaenger': {
    title: 'Pulverlöschanhänger',
    abbreviation: 'P 250',
    group: 'feuerwehr',
    spec: fwTrailer(['solid-extinguishing-agent']),
    pattern: ['C.2.29'],
    context: 'Löschanhänger mit 250 kg Löschpulver nach DIN 14271 für Metall-, Flüssigkeits- und Gasbrände.',
    aliases: ['P 250', 'Pulveranhänger', 'PLA'],
  },
  'feuerwehr.verkehrssicherungsanhaenger': {
    title: 'Verkehrssicherungsanhänger',
    abbreviation: 'VSA',
    group: 'feuerwehr',
    spec: fwTrailer(['securing']),
    pattern: ['C.2.29'],
    context: 'Anhänger mit Leuchtpfeil und Absperrmaterial zur Absicherung von Einsatzstellen auf Autobahnen und Schnellstraßen.',
    aliases: ['Absicherungsanhänger', 'VSA Feuerwehr', 'Sicherungsanhänger'],
  },

  // --- Einheiten ---
  'feuerwehr.loeschtrupp': {
    title: 'Löschtrupp',
    group: 'feuerwehr',
    spec: { kind: 'formation', organization: 'feuerwehr', strength: 'trupp', bodyMarks: ['fire-fighting'] },
    pattern: ['C.1.1'],
    context: 'Selbstständiger Trupp (1/2) nach FwDV 3, etwa als Besatzung eines Kleinlöschfahrzeugs.',
    aliases: ['Selbstständiger Trupp', 'Trupp Brandschutz'],
  },
  'feuerwehr.atemschutztrupp': {
    title: 'Atemschutztrupp',
    group: 'feuerwehr',
    spec: { kind: 'formation', organization: 'feuerwehr', strength: 'trupp', bodyMarks: ['respiratory-protection'] },
    pattern: ['C.1.7'],
    context: 'Trupp unter Atemschutz nach FwDV 7, auch als Sicherheitstrupp bereitgestellt.',
    aliases: ['AS-Trupp', 'Sicherheitstrupp', 'Angriffstrupp unter Atemschutz'],
  },
  'feuerwehr.zugtrupp-loeschzug': {
    title: 'Zugtrupp eines Löschzugs',
    group: 'feuerwehr',
    spec: {
      kind: 'formation',
      organization: 'feuerwehr',
      strength: 'trupp',
      bodyMarks: ['fire-fighting', 'formation-solid-cap-4mm-three-hole-row'],
    },
    pattern: ['D.1.9#alternative', 'C.1.3'],
    context: 'Führungstrupp des Löschzugs nach FwDV 3 mit Zugführer, Führungsassistent und Melder, meist auf dem ELW 1.',
    aliases: ['Zugtrupp Feuerwehr', 'ZTr'],
  },
  'feuerwehr.wasserfoerderzug': {
    title: 'Wasserförderzug',
    group: 'feuerwehr',
    spec: { kind: 'formation', organization: 'feuerwehr', strength: 'zug', bodyMarks: ['water-conveyance'] },
    pattern: ['C.1.3', 'C.2.26'],
    context: 'Zug für die Wasserförderung über lange Wegstrecken mit Schlauchwagen und Löschfahrzeugen, Baustein der KatS-Konzepte der Länder.',
    aliases: ['WF-Zug', 'Wasserversorgungszug', 'Zug Wasserförderung'],
  },
  'feuerwehr.hoehenrettungsgruppe': {
    title: 'Höhenrettungsgruppe',
    group: 'feuerwehr',
    spec: {
      kind: 'formation',
      organization: 'feuerwehr',
      strength: 'gruppe',
      bodyMarks: ['special-height-depth-rescue'],
    },
    pattern: ['C.1.2'],
    context: 'Spezialeinheit der Feuerwehr für die Rettung aus Höhen und Tiefen nach den Empfehlungen der AGBF, meist bei Berufsfeuerwehren.',
    aliases: ['SRHT', 'Spezielle Rettung aus Höhen und Tiefen', 'Höhenretter'],
  },

  // --- Personen ---
  'feuerwehr.einsatzkraft': {
    title: 'Einsatzkraft Feuerwehr',
    group: 'feuerwehr',
    spec: { kind: 'person', organization: 'feuerwehr', bodyMarks: ['fire-fighting'] },
    pattern: ['I.5.1', 'D.3.7'],
    context: 'Einzelne Einsatzkraft der Feuerwehr ohne Führungsaufgabe, etwa Truppmann oder Melder (FwDV 3).',
    aliases: ['Feuerwehrmann', 'Feuerwehrfrau', 'Truppmann', 'Truppfrau'],
  },
  'feuerwehr.atemschutzgeraetetraeger': {
    title: 'Atemschutzgeräteträger',
    abbreviation: 'AGT',
    group: 'feuerwehr',
    spec: { kind: 'person', organization: 'feuerwehr', bodyMarks: ['respiratory-protection'] },
    pattern: ['I.5.1'],
    context: 'Einsatzkraft mit Ausbildung und Tauglichkeit für umluftunabhängigen Atemschutz nach FwDV 7.',
    aliases: ['Atemschutzgeräteträgerin', 'Atemschutzträger', 'AGT'],
  },
  'feuerwehr.maschinist': {
    title: 'Maschinist',
    abbreviation: 'Ma',
    group: 'feuerwehr',
    spec: { kind: 'person', organization: 'feuerwehr', bodyMarks: ['fire-fighting'], labels: { aboveLeft: 'Ma' } },
    pattern: ['I.5.2', 'I.5.1'],
    context: 'Fahrer und Bediener von Fahrzeug und Feuerlöschkreiselpumpe in der taktischen Einheit nach FwDV 3.',
    aliases: ['Maschinistin', 'Ma', 'Maschinist Löschfahrzeug'],
  },
  'feuerwehr.truppfuehrer': {
    title: 'Truppführer der Feuerwehr',
    abbreviation: 'TF',
    group: 'feuerwehr',
    spec: {
      kind: 'person',
      organization: 'feuerwehr',
      functionRole: 'leader',
      strength: 'trupp',
      bodyMarks: ['fire-fighting'],
    },
    pattern: ['D.3.7'],
    context: 'Führer eines Trupps nach FwDV 3 und FwDV 2 (Truppführerlehrgang).',
    aliases: ['Truppführerin', 'TrF', 'Angriffstruppführer', 'Wassertruppführer'],
  },
  'feuerwehr.staffelfuehrer': {
    title: 'Staffelführer der Feuerwehr',
    abbreviation: 'StF',
    group: 'feuerwehr',
    spec: {
      kind: 'person',
      organization: 'feuerwehr',
      functionRole: 'leader',
      strength: 'staffel',
      bodyMarks: ['fire-fighting'],
    },
    pattern: ['D.3.7'],
    context: 'Führer einer Staffel (1/5) nach FwDV 3, etwa auf TSF-W oder MLF; Qualifikation Gruppenführer.',
    aliases: ['Staffelführerin'],
  },
  'feuerwehr.gruppenfuehrer': {
    title: 'Gruppenführer der Feuerwehr',
    abbreviation: 'GF',
    group: 'feuerwehr',
    spec: {
      kind: 'person',
      organization: 'feuerwehr',
      functionRole: 'leader',
      strength: 'gruppe',
      bodyMarks: ['fire-fighting'],
    },
    pattern: ['D.3.7', 'D.3.12'],
    context: 'Führer einer Gruppe (1/8) nach FwDV 3 und FwDV 2 (Gruppenführerlehrgang).',
    aliases: ['Gruppenführerin', 'GrF'],
  },
  'feuerwehr.gemeindebrandmeister': {
    title: 'Leiter der Feuerwehr einer Gemeinde',
    group: 'feuerwehr',
    spec: {
      kind: 'person',
      organization: 'feuerwehr',
      functionRole: 'leader',
      administrativeLevel: 'gemeinde',
      bodyMarks: ['fire-fighting'],
    },
    pattern: ['D.4.2'],
    context:
      'Leiter der Gemeinde- oder Stadtfeuerwehr; die Bezeichnung regeln die Brandschutzgesetze der Länder, die Verwaltungsstufe zeigt der Kopf wie beim Kreisbrandmeister.',
    aliases: [
      'Gemeindebrandmeister',
      'Stadtbrandmeister',
      'Wehrführer',
      'Gemeindewehrführer',
      'Ortsbrandmeister',
      'Kommandant',
      'Stadtbrandinspektor',
      'Leiter der Feuerwehr',
      'Wehrleiter',
    ],
  },
} as const satisfies Record<string, TypicalSymbol>;
