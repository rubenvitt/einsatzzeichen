import type { DepictionVariant } from '@einsatzzeichen/schema';
import { type ManifestDomainReviewKey, MANIFEST_DOMAIN_REVIEWS } from './domain-reviews.js';
import { deepFreeze, type DeepReadonly } from './readonly-data.js';

/**
 * Eine offene **Fachfrage** an das Domain-Review, die keine Messung und kein technisches Gate
 * beantworten kann. Sie hängt an einem oder mehreren Manifestschlüsseln und ändert deren
 * Reviewstatus nicht: das Ledger in `domain-reviews.ts` bleibt die einzige Stelle, an der ein
 * benannter Mensch mit einsatztaktischer Fachkunde freigibt.
 *
 * Warum ein eigenes Register und keine `note` am Reviewobjekt: die Ledgerzeilen sind mit
 * `{ status: 'pending' }` festgenagelt (`domain-reviews.test.ts` prüft viele Blöcke per
 * `toEqual`), und eine `note` ist dort der Ort für den **Befund** des Reviewers, nicht für die
 * Frage an ihn. Die Fragen standen bis LFH-430 nur als Kommentare im Ledger — unerreichbar für
 * `pnpm cli review-dossier`. Hier sind sie Daten.
 */
export interface DomainReviewQuestion {
  /** Stabiler Bezeichner, z. B. `Q-1-ereignis-ohne-organisation`. */
  id: string;
  /**
   * Manifestschlüssel, an denen die Frage im Dossier erscheint. Der Typ ist die Schlüsselunion
   * des Ledgers; `keysOf` erzeugt sie aus Abschnittsliteralen, sodass ein Abschnitt ohne
   * Ledgerplatz schon beim Kompilieren abgewiesen wird. `domainReviewQuestionIssues()` prüft
   * dieselbe Invariante zusätzlich zur Laufzeit — für Aufrufer, die das Register als Daten lesen.
   */
  keys: readonly ManifestDomainReviewKey[];
  /** Die Frage selbst, als Frage formuliert. */
  question: string;
  /** Herleitung oder Befundlage aus dem Katalog, damit der Reviewer nicht im Code suchen muss. */
  context?: string;
}

/**
 * Abschnittsnummern, für die das Ledger eine Zeile der jeweiligen Variante führt — je Variante
 * **einmal** verteilt über die Schlüsselunion berechnet. Eine generische Fassung je `keysOf`-Aufruf
 * (Extract über 544 Schlüssel × Aufrufliteral) trieb `tsc` über Minuten; deshalb zwei feste
 * Aliase und ein schlichter Rückgabetyp.
 */
type SectionOf<Key, V extends DepictionVariant> = Key extends `bbk-babz-2025:${infer S}#${V}`
  ? S
  : never;
type PrimarySection = SectionOf<ManifestDomainReviewKey, 'primary'>;
type AlternativeSection = SectionOf<ManifestDomainReviewKey, 'alternative'>;

/**
 * Baut Ledgerschlüssel aus Abschnittsliteralen. Die **Eingabe** ist auf Abschnitte begrenzt, die
 * das Ledger in der Variante tatsächlich führt: `keysOf(['9.9'])` oder
 * `keysOf(['1.1'], 'alternative')` kompilieren nicht. Die Assertion im Rückgabewert ist damit
 * durch die Eingabeprüfung gedeckt; `domainReviewQuestionIssues()` prüft dieselbe Invariante
 * zusätzlich zur Laufzeit.
 */
function keysOf(sections: readonly PrimarySection[]): ManifestDomainReviewKey[];
function keysOf(
  sections: readonly AlternativeSection[],
  variant: 'alternative',
): ManifestDomainReviewKey[];
function keysOf(sections: readonly string[], variant: DepictionVariant = 'primary') {
  return sections.map((section) => `bbk-babz-2025:${section}#${variant}` as ManifestDomainReviewKey);
}

/**
 * Das Fragenregister. Reihenfolge: Kapitel 1, 2, 5, dann Anhänge in Katalogreihenfolge.
 * Ein Eintrag je Frage, nicht je Block — eine Frage, die mehrere Schlüssel betrifft, nennt sie
 * alle, damit das Dossier sie an jedem betroffenen Schlüssel ausweisen kann.
 */
export const DOMAIN_REVIEW_QUESTIONS: DeepReadonly<readonly DomainReviewQuestion[]> = deepFreeze([
  // ── Kapitel 1 ────────────────────────────────────────────────────────────────────────────────
  {
    id: 'Q-1-ereignis-ohne-organisation',
    keys: keysOf(['1.13']),
    question:
      'Darf „1.13 Ereignis" fachlich zu Recht als einziges Grundzeichen keine Organisation annehmen?',
    context:
      'Der Katalog wirft dafür — belegt allein daraus, dass die Referenz den Haken in keinem ' +
      'zusammengesetzten Zeichen führt.',
  },
  {
    id: 'Q-1-fahrzeuge-ohne-fahrwerk',
    keys: keysOf(['1.3', '1.4', '1.5']),
    question:
      'Gelten 1.3 bis 1.5 ohne die Fahrwerksmarken aus Kapitel 5.1 als vollständige Zeichen?',
    context:
      'Die Fahrwerksmarken sind vermessen, aber an den Grundzeichen nicht umgesetzt; ' +
      '`validateSpec` lehnt eine Fahrzeugkategorie an ihnen deshalb ab.',
  },
  // ── Kapitel 2 ────────────────────────────────────────────────────────────────────────────────
  {
    id: 'Q-2-hiorg-aus-raster',
    keys: keysOf(['2.2']),
    question:
      'Ist die Zuordnung „HiOrg = Hilfsorganisation" fachlich richtig — sie ist aus dem gerasterten ' +
      'Bild abgelesen, nicht aus dem Dateinamen?',
    context: 'Der Dateiname ist generisch („Organisationen") und hatte die Zuordnung bisher verdeckt.',
  },
  {
    id: 'Q-2-hiorg-farbe-neutral',
    keys: keysOf(['2.2']),
    question:
      'Bleibt eine Organisation, deren Farbe mit der neutralen Grundfüllung zusammenfällt, im ' +
      'Einsatz verwechslungsfrei?',
  },
  // ── Kapitel 5.1 ──────────────────────────────────────────────────────────────────────────────
  {
    id: 'Q-5.1-kategoriezuordnung',
    keys: keysOf(['5.1.1.1', '5.1.1.2', '5.1.1.3', '5.1.1.5', '5.1.1.6']),
    question:
      'Stimmt die Zuordnung „Kategorie 1/2/3 = straßenfähig/geländefähig/geländegängig"?',
    context:
      'Sie ist aus der Mehrheit der E.2-Dateinamen abgeleitet; vier der 31 E.2-Dateien ' +
      'widersprechen ihrem eigenen Namen.',
  },
  {
    id: 'Q-5.1-verbindungsstrich-endpunkte',
    keys: keysOf(['5.1.1.3']),
    question:
      'Sollen die Endpunkte des Verbindungsstrichs der Kategorie 3 fachlich auf der ' +
      'Ringmittellinie liegen?',
    context: 'Vermessen ist nur das Band, in dem sie liegen müssen (siehe `vehicle-categories.ts`).',
  },
  {
    id: 'Q-5.1-anhaenger-ein-oder-zwei-raeder',
    keys: keysOf(['5.1.2.4', '5.1.2.5', 'E.2.22', 'E.2.23', 'E.2.24']),
    question: 'Bezeichnet ein Anhänger mit einem Rad etwas anderes als einer mit zweien?',
    context:
      'Die Zeichnung unterscheidet sie, die Quelle benennt sie widersprüchlich: 5.1.2.4 heißt ' +
      '„von PKW gezogen" und 5.1.2.5 „von LKW gezogen", aber E.2.23 („von LKW gezogen") trägt ' +
      'ein Rad, E.2.24 mit demselben Namenszusatz zwei und 5.1.2.1 („allgemein") gar keines. Der ' +
      'Katalog benennt deshalb die Räder und nicht das Zugfahrzeug.',
  },
  // ── Anhang D ─────────────────────────────────────────────────────────────────────────────────
  {
    id: 'Q-D.1-fuehrungsbegriff-uebersetzung',
    keys: keysOf(['D.1.1']),
    question:
      'Ist die technische ID von D.1.1 eine tragfähige Übersetzung des Führungsbegriffs — sie ' +
      'behauptet keine freigegebene?',
  },
  {
    id: 'Q-D.1-englische-arbeitsnamen',
    keys: keysOf(['D.1.3', 'D.1.8']),
    question:
      'Tragen die im Design markierten englischen Arbeitsnamen von D.1.3 und D.1.8 fachlich, ' +
      'oder braucht es andere Bezeichner?',
  },
  {
    id: 'Q-D.1.9-hilfsorganisation-aus-weiss',
    keys: [...keysOf(['D.1.9']), ...keysOf(['D.1.9'], 'alternative')],
    question: 'Folgt aus dem weißen Körper von D.1.9 die Organisation hilfsorganisation?',
    context:
      'Die Quelle belegt zunächst nur eine weiße Fläche; die sichtbare Farbe ist keine Freigabe.',
  },
  {
    id: 'Q-D.2-gelbe-kreisflaeche',
    keys: keysOf(['D.2.1', 'D.2.2', 'D.2.3', 'D.2.4', 'D.2.5', 'D.2.6', 'D.2.7']),
    question: 'Belegt die gelbe Kreisfläche der Ortszeichen eine Organisation — oder keine?',
  },
  {
    id: 'Q-D.2-ortsbegriffe-uebersetzung',
    keys: keysOf(['D.2.1', 'D.2.2', 'D.2.3', 'D.2.4', 'D.2.5', 'D.2.6', 'D.2.7']),
    question:
      'Sind die technischen englischen IDs der sieben Ortszeichen fachlich vertretbare ' +
      'Übersetzungen der Ortsbegriffe?',
  },
  {
    id: 'Q-D.3-rollenbezeichnungen',
    keys: keysOf(['D.3.1', 'D.3.2', 'D.3.3', 'D.3.4', 'D.3.5', 'D.3.6', 'D.3.7', 'D.3.8', 'D.3.9', 'D.3.10', 'D.3.11', 'D.3.12', 'D.3.13']),
    question:
      'Sind die Rollenbezeichnungen hinter den englischen Rollen-IDs fachlich richtig, und ' +
      'tragen AW/ASB/DRK/MHD/JUH als sichtbarer Text die richtige Organisation?',
  },
  {
    id: 'Q-D.3-offene-kappen-ohne-rolle',
    keys: keysOf(['D.3.14', 'D.3.15']),
    question:
      'Ist es richtig, dass D.3.14 und D.3.15 keine functionRole erhalten, sondern als direkte ' +
      'offene Kappen ohne erfundene Rolle stehen?',
  },
  {
    id: 'Q-D.3.7-zugfuehrer',
    keys: keysOf(['D.3.7']),
    question:
      'Bezeichnet D.3.7 mit Personengrundzeichen und Zugstärke fachlich den Zugführer der ' +
      'Feuerwehr — trotz der erweiterten technischen Evidenz weiterhin offen?',
  },
  {
    id: 'Q-D.4-verwaltungsrollen',
    keys: keysOf(['D.4.1', 'D.4.2', 'D.4.3', 'D.4.4', 'D.4.5']),
    question:
      'Sind die fünf Verwaltungsrollen hinter den englischen Rollen-IDs fachlich richtig benannt, ' +
      'und ist die Verwaltungszuordnung hinter ST, ME, MG und BuPol korrekt?',
    context:
      'Die Organisationsfarbe wird nicht als Freigabe der Rollenbezeichnung oder ' +
      'Verwaltungszuordnung ausgegeben.',
  },
  // ── Anhang E.1 ───────────────────────────────────────────────────────────────────────────────
  {
    id: 'Q-E.1-a-buchstabenkuerzel',
    keys: keysOf(['E.1.1', 'E.1.2', 'E.1.3', 'E.1.4', 'E.1.5', 'E.1.6', 'E.1.7', 'E.1.8', 'E.1.9', 'E.1.10', 'E.1.11', 'E.1.12', 'E.1.13', 'E.1.14', 'E.1.15', 'E.1.16']),
    question:
      'Bezeichnen die am Referenzbild abgelesenen Buchstabenkürzel die richtigen Einheiten — ' +
      'etwa „B" die Bergungsgruppe und nicht den Bergungstrupp?',
    context: 'Die Bedeutung dieser 16 Zeichen liegt vollständig im Kürzel.',
  },
  {
    id: 'Q-E.1-b-fuehrungsverhaeltnisse',
    keys: keysOf(['E.1.17', 'E.1.18', 'E.1.19', 'E.1.20', 'E.1.21', 'E.1.22', 'E.1.23', 'E.1.24', 'E.1.25', 'E.1.26', 'E.1.27', 'E.1.28']),
    question:
      'Sind die Führungs- und Unterstellungsverhältnisse der Fachzüge, Zugtrupps, des Stabs und ' +
      'der Logistikeinheiten richtig wiedergegeben?',
  },
  {
    id: 'Q-E.1.17-musterblatt',
    keys: keysOf(['E.1.17']),
    question: 'Bezeichnet „FZ-" als Kürzel eines Musterblatts überhaupt eine Einheit?',
  },
  {
    id: 'Q-E.1-zugtrupp-ohne-unterstellung',
    keys: keysOf(['E.1.19', 'E.1.24']),
    question:
      'Bezeichnet ein Zugtrupp ohne die Unterstellungsmarke seiner Referenz noch dieselbe Einheit?',
  },
  {
    id: 'Q-E.1.21-stab-ohne-staerke',
    keys: keysOf(['E.1.21']),
    question: 'Bleibt „Stab" ohne Stärkeangabe von einem Fachzug unterscheidbar?',
  },
  {
    id: 'Q-E.1-c-staerke-aus-kopfgeometrie',
    keys: keysOf(['E.1.30', 'E.1.36']),
    question:
      'Trägt die Einordnung als Gruppe beziehungsweise Zug, wenn der Dateiname kein Stärkewort ' +
      'führt und sie allein auf der Kopfgeometrie ruht?',
  },
  {
    id: 'Q-E.1.31-sysbr',
    keys: keysOf(['E.1.31']),
    question:
      'Bezeichnet „SysBR" ohne die Zahl 500 des Dateinamens dieselbe Einheit — und ist die nicht ' +
      'gebaute Balkenkopfzone der Referenz fachlich verzichtbar?',
  },
  {
    id: 'Q-E.1.37-einrichtung',
    keys: keysOf(['E.1.37']),
    question:
      'Ist der Ortsverband als Einrichtung statt Einheit im Anhang E richtig eingeordnet?',
  },
  {
    id: 'Q-E.1-c-o-oder-null',
    keys: keysOf(['E.1.29', 'E.1.30', 'E.1.31', 'E.1.32', 'E.1.33', 'E.1.34', 'E.1.35', 'E.1.36', 'E.1.37']),
    question: 'Ist die runde Versalie in „VOST" und „OV" ein O und keine Null?',
    context:
      'Im gesamten E.1-Bestand kommt keine Ziffer vor; es gibt keine Negativkontrolle gegen die Null.',
  },
  // ── Anhang E.2 ───────────────────────────────────────────────────────────────────────────────
  {
    id: 'Q-E.2.7-telelader',
    keys: keysOf(['E.2.7']),
    question: 'Ist „Telelader" (Bild) oder „Teleskopstapler" (Dateiname) das tragende Kürzel?',
  },
  {
    id: 'Q-E.2-bagger-brmg',
    keys: keysOf(['E.2.9', 'E.2.10']),
    question:
      'Bezeichnet „Bagger" ohne die Kurzform „BRmG" die Bergungsräumgeräte hinreichend?',
    context: 'Im Bild kommt „BRmG" in keinem der drei Bergungsräumgeräte vor.',
  },
  {
    id: 'Q-E.2-kategorie-widerspruch',
    keys: keysOf(['E.2.12', 'E.2.13', 'E.2.18']),
    question:
      'Trägt die Zuordnung „Kategorie 1/2/3 = straßenfähig/geländefähig/geländegängig" auch dort, ' +
      'wo der Dateiname ihr widerspricht?',
    context: 'Siehe Q-5.1-kategoriezuordnung; diese drei Dateien widersprechen ihrem eigenen Namen.',
  },
  {
    id: 'Q-E.2-bagger-verwechslung',
    keys: keysOf(['E.2.9', 'E.2.10']),
    question:
      'Bleiben E.2.9 und E.2.10 — dasselbe Kürzel, verschiedene Fahrwerke — im Einsatz ' +
      'verwechslungsfrei?',
  },
  {
    id: 'Q-E.2.6-orange-und-thw',
    keys: keysOf(['E.2.6']),
    question:
      'Bezeichnet der orange Körper der sonstige-gefahrenabwehr bei zugleich gezeichnetem ' +
      'Trägerkürzel „THW" die Zuordnung oder den Betreiber?',
    context:
      'Der Dateiname („öffentliche Gefahrenabwehr, THW betrieben") legt das Zweite nahe. Die ' +
      'Kontrastlage weiss auf orange ist gemessen und als Ausnahme entschieden — keine Fachfrage.',
  },
  {
    id: 'Q-E.2.26-eigenes-grundzeichen',
    keys: keysOf(['E.2.26']),
    question:
      'Verdient die Trinkwasseraufbereitungsanlage mit ihrem hochkanten Rechteck ein eigenes ' +
      'Grundzeichen, und was bezeichnet sie fachlich?',
    context: 'Ihre Körperform kommt in genau einer der 661 Referenzdateien vor.',
  },
  {
    id: 'Q-E.2.22-ohne-kuerzel',
    keys: keysOf(['E.2.22']),
    question:
      'Bezeichnet ein Anhänger ohne mittiges Kürzel — der einzige des Anhangs — eine Einheit, oder ' +
      'ist er wie E.1.17 ein Musterblatt?',
  },
  {
    id: 'Q-E.2-wasserfahrzeuge-gleich-i.3',
    keys: keysOf(['E.2.29', 'E.2.30', 'E.2.31', 'I.3.5', 'I.3.6', 'I.3.7']),
    question: 'Sind E.2.29 bis E.2.31 dieselben Einheiten wie I.3.5 bis I.3.7?',
    context:
      'Ihre mittigen Läufe sind bis auf 0,00035 mm deckungsgleich, sie tragen dieselben Namen und ' +
      'unterscheiden sich allein in der Farbe. Die Antwort entscheidet, ob Alternativdarstellungen ' +
      'entstehen oder eigene IDs.',
  },
  {
    id: 'Q-E.2.27-ohne-kuerzel',
    keys: keysOf(['E.2.27']),
    question:
      'Bezeichnet ein Wasserfahrzeug ohne jedes Kürzel im Körper mehr als das Grundzeichen 1.5 ' +
      'selbst?',
  },
  // ── Anhang F ─────────────────────────────────────────────────────────────────────────────────
  {
    id: 'Q-F-weiss-als-hilfsorganisation',
    keys: [
      ...keysOf(['F.1.1', 'F.1.2', 'F.1.3', 'F.1.4', 'F.1.5', 'F.1.6', 'F.1.7', 'F.1.8', 'F.1.9', 'F.1.10', 'F.1.11', 'F.1.12', 'F.1.13', 'F.1.14', 'F.1.15', 'F.1.16', 'F.1.17', 'F.1.18', 'F.1.19', 'F.1.20', 'F.1.21', 'F.1.22', 'F.2.1', 'F.2.2', 'F.2.3', 'F.2.4', 'F.2.5', 'F.2.6', 'F.2.7', 'F.2.8', 'F.2.9', 'F.2.10', 'F.2.11', 'F.2.12', 'F.2.13', 'F.2.14', 'F.2.15', 'F.2.16', 'F.2.17', 'F.3.1', 'F.3.2', 'F.3.3', 'F.3.4', 'F.3.5', 'F.3.6', 'F.3.7', 'F.3.8', 'F.3.9', 'F.3.10', 'F.3.11', 'F.3.12', 'F.3.13', 'F.3.14', 'F.3.15', 'F.3.16', 'F.3.17', 'F.3.18', 'F.3.19']),
      ...keysOf(['F.1.11', 'F.1.12', 'F.1.15', 'F.2.1', 'F.2.2', 'F.2.3', 'F.2.4', 'F.2.5'], 'alternative'),
    ],
    question:
      'Bedeutet der ausschließlich weiße Körper aller F-Dateien hilfsorganisation — oder gar keine ' +
      'Organisation?',
    context:
      'Alle 66 F-Dateien führen ausschließlich #fff. Der Katalog hat sich für hilfsorganisation ' +
      'entschieden (Begründung in `recipes-anhang-f.ts`). Die Entscheidung wird in den ' +
      'Alternativthemes sichtbar: weiss trägt dort die Punktsignatur aus ORGANIZATION_BODY_DASHES.',
  },
  {
    id: 'Q-F.1-a-kuerzel',
    keys: keysOf(['F.1.1', 'F.1.2', 'F.1.3', 'F.1.4', 'F.1.5', 'F.1.6', 'F.1.7', 'F.1.8', 'F.1.9', 'F.1.10', 'F.1.11']),
    question: 'Tragen die am Bild abgelesenen Kürzel „MTF", „SEG" und „RettD" fachlich?',
  },
  {
    id: 'Q-F.1.1-fuenfter-staerkegrad',
    keys: keysOf(['F.1.1']),
    question:
      'Bezeichnen die beiden Kopfbalken von F.1.1 einen fünften Stärkegrad, den Kapitel 5.4 ' +
      'nicht führt?',
    context: 'Der Katalog zeichnet sie nicht (siehe `ANHANG_F_A_DEVIATIONS`).',
  },
  {
    id: 'Q-F.1-seg-verwechslung',
    keys: keysOf(['F.1.9', 'F.1.10']),
    question:
      'Bleiben F.1.9 und F.1.10 — beide „SEG", verschieden allein in der Fachdienstteilung — im ' +
      'Einsatz verwechslungsfrei?',
  },
  {
    id: 'Q-F.1.11-alternative',
    keys: [...keysOf(['F.1.11']), ...keysOf(['F.1.11'], 'alternative')],
    question:
      'Bezeichnet F.1.11#alternative dasselbe wie F.1.11 und teilt deshalb zu Recht dessen ' +
      'Abschnitt statt einen eigenen zu bekommen?',
  },
  {
    id: 'Q-F.1.2-abc-oder-dekon',
    keys: keysOf(['F.1.2']),
    question:
      'Leistet die „Dekontaminationseinheit" ABC-Schutz (4.1.1, wie gezeichnet) oder ' +
      'dekontaminiert sie (4.1.3, mit Häkchenpaar) — welche Lesart gilt?',
    context:
      'Die Datei zeigt 4.1.1, obwohl sie „Dekontaminationseinheit" heißt. Dazu: Steht „MTF" ' +
      'hier richtig? Der Lauf ist zeichengleich mit F.1.1, die Einheit trägt das Kürzel ihrer ' +
      'Task Force und kein eigenes.',
  },
  {
    id: 'Q-F.1.4-zwei-fachdienstzeichen',
    keys: keysOf(['F.1.4']),
    question:
      'Sagt die Nebeneinanderstellung von Teilung und Zelt (Sanitätsdienst und Betreuung) dasselbe ' +
      'aus wie der eine Umriss, den die Referenz zeichnet?',
  },
  {
    id: 'Q-F.2-c-alternativen-faehigkeiten',
    keys: keysOf(['F.2.1', 'F.2.2', 'F.2.3', 'F.2.4', 'F.2.5'], 'alternative'),
    question:
      'Bezeichnen die rein aus der Grafik abgelesenen Fähigkeitskombinationen der fünf ' +
      'Alternativdarstellungen tatsächlich dieselben Fahrzeuge?',
    context: 'Aus dem Ring der Referenz darf nicht pauschal Intensivtransport abgeleitet werden.',
  },
  {
    id: 'Q-F.2-c-einzelmarken',
    keys: keysOf(['F.2.2', 'F.2.6', 'F.2.7', 'F.2.8', 'F.2.9']),
    question:
      'Sind die kleine obere Marke von F.2.2, die Hebe-/Winschform von F.2.6 und die oberhalb ' +
      'gesetzte Abkürzung „ITH" fachlich richtig gedeutet?',
  },
  {
    id: 'Q-F.2-d-formen',
    keys: keysOf(['F.2.10', 'F.2.11', 'F.2.12', 'F.2.13', 'F.2.14', 'F.2.15', 'F.2.16', 'F.2.17']),
    question:
      'Was bedeuten die Vierwegeform aus F.2.11 und der verschobene Ring aus F.2.16 fachlich?',
  },
  {
    id: 'Q-F.3-e-formbegriffe',
    keys: keysOf(['F.3.1', 'F.3.2', 'F.3.3', 'F.3.4', 'F.3.5', 'F.3.6', 'F.3.7', 'F.3.8', 'F.3.9', 'F.3.10', 'F.3.11']),
    question:
      'Welche Begriffe stehen hinter den neutral benannten Pfeil-, Rahmen- und Rautenformen der ' +
      'Platzzeichen?',
    context: 'Die technische Umsetzung behauptet diese Semantik ausdrücklich nicht.',
  },
  {
    id: 'Q-F.3-abgrenzung-transport',
    keys: keysOf(['F.3.10', 'F.3.11']),
    question:
      'Sind F.3.10 und F.3.11 tatsächlich von Patiententransport- oder Spezialrettungszeichen ' +
      'abzugrenzen?',
  },
  {
    id: 'Q-F.3-f-kreisformen',
    keys: keysOf(['F.3.12', 'F.3.13', 'F.3.14', 'F.3.15', 'F.3.16', 'F.3.17', 'F.3.18', 'F.3.19']),
    question:
      'Wie heißen die vier rein technisch benannten Kreisformen fachlich, und wie grenzen sich ' +
      'Ladezone, Personentransport und besondere Bedarfe ab?',
  },
  // ── Anhang G ─────────────────────────────────────────────────────────────────────────────────
  {
    id: 'Q-G-weiss-und-marken',
    keys: keysOf([
      'G.1', 'G.1.1', 'G.1.2', 'G.1.3', 'G.1.4', 'G.1.5', 'G.2', 'G.2.1', 'G.2.2', 'G.2.3',
      'G.3', 'G.3.1', 'G.3.2', 'G.3.3', 'G.3.4', 'G.3.5', 'G.4', 'G.5', 'G.6', 'G.7', 'G.8',
    ]),
    question:
      'Sind die weißen Logistikzeichen — einschließlich DLRG — zu Recht hilfsorganisation, was ' +
      'bedeuten die Marken, und wer betreibt die farbigen Kreiszeichen?',
  },
  // ── Anhang I ─────────────────────────────────────────────────────────────────────────────────
  {
    id: 'Q-I.1-c-weiss-und-einzelbalken',
    keys: keysOf(['I.1.1', 'I.1.2', 'I.1.3', 'I.1.4']),
    question:
      'Welche Organisation und welche Stärke bezeichnen der weiße Körper und der Einzelbalken ' +
      'von I.1.1 bis I.1.4?',
    context: 'Der Katalog leitet daraus bewusst keine Zuordnung ab.',
  },
  {
    id: 'Q-I.1-d-weisser-koerper',
    keys: keysOf(['I.1.5', 'I.1.6', 'I.1.7', 'I.1.8']),
    question: 'Welche organisatorische und fachliche Bedeutung hat der weiße Körper von I.1.5 bis I.1.8?',
  },
  {
    id: 'Q-I.1-e-hilfsorganisation',
    keys: [...keysOf(['I.1.9', 'I.1.10', 'I.1.11', 'I.1.12']), ...keysOf(['I.1.9'], 'alternative')],
    question:
      'Gehören die weißen Wasserrettungsformationen zur Hilfsorganisation, und was unterscheidet ' +
      'die zwei Darstellungen von I.1.9?',
    context: 'Die Alternative ist ein eigener Reviewträger, keine stillschweigend gleichgesetzte Grafik.',
  },
  {
    id: 'Q-I.1-f-formen',
    keys: keysOf(['I.1.13', 'I.1.14', 'I.1.15', 'I.1.16']),
    question:
      'Welche Organisation und einsatztaktische Klassifikation stehen hinter den weißen Körpern ' +
      'und den Scheiben-, Schaft-, Klammer- beziehungsweise Ölformen von I.1.13 bis I.1.16?',
  },
  {
    id: 'Q-I.1-g-bedeutung',
    keys: keysOf(['I.1.17', 'I.1.18', 'I.1.19', 'I.1.20']),
    question:
      'Ist die Bedeutungszuordnung von Wasserrettung, Luftunterstützung und Drohne bei I.1.17 bis ' +
      'I.1.20 fachlich richtig?',
  },
  {
    id: 'Q-I.2-landfahrzeuge',
    keys: keysOf(['I.2.1', 'I.2.2', 'I.2.3', 'I.2.4', 'I.2.5', 'I.2.6', 'I.2.7']),
    question:
      'Sind die I.2-Landfahrzeuge über die freigegebene kategorieabhängige Geometrie hinaus ' +
      'fachlich richtig benannt und zugeordnet?',
  },
  {
    id: 'Q-I.3-bedeutung',
    keys: keysOf(['I.3.1', 'I.3.2', 'I.3.3', 'I.3.4', 'I.3.5', 'I.3.6', 'I.3.7', 'I.3.8', 'I.3.9', 'I.3.10', 'I.3.11']),
    question: 'Welche organisatorische und fachliche Bedeutung haben die elf I.3-Zeichen?',
    context: 'Das Erscheinungsbild ist durch Rezept-, Fingerprint- und Snapshot-Gates belegt.',
  },
  {
    id: 'Q-I.4-marken',
    keys: keysOf(['I.4.1', 'I.4.2', 'I.4.3']),
    question:
      'Sind die Marken der weißen HiOrg-Kreiszeichen I.4.1 bis I.4.3 richtig benannt und ' +
      'gegeneinander verwechslungsfrei — insbesondere ohne neue Semantik aus dem Giebel von I.4.1?',
  },
  {
    id: 'Q-I.5-wasserrettungspersonal',
    keys: keysOf(['I.5.1', 'I.5.2', 'I.5.3', 'I.5.4', 'I.5.5', 'I.5.6', 'I.5.7', 'I.5.8']),
    question: 'Bezeichnet der weiße Körper von I.5.1 bis I.5.8 fachlich Wasserrettungspersonal?',
  },
  // ── Anhang N ─────────────────────────────────────────────────────────────────────────────────
  {
    id: 'Q-N-traegerzuordnung',
    keys: keysOf(['N.1.1', 'N.1.2', 'N.1.3', 'N.1.4', 'N.1.5', 'N.1.6']),
    question:
      'Gehören kommunaler Bauhof und Beauftragter Dritter zur sonstigen Gefahrenabwehr, ist die ' +
      'Bundespolizei zu Recht eine getrennte Organisation, und stimmen die Bundeswehr-/Feuerwehr-/' +
      'ZIV-Zuordnungen?',
    context: '„Geländegängig" aus dem Dateinamen von N.1.2 ist ausdrücklich keine neue Katalogsemantik.',
  },
  {
    id: 'Q-N.2-marken',
    keys: keysOf(['N.2.1', 'N.2.2', 'N.2.3']),
    question: 'Welche Einsatzbedeutung haben die drei N.2-Marken?',
  },
] satisfies readonly DomainReviewQuestion[]);

/** Alle Fragen zu einem Manifestschlüssel, in Registerreihenfolge. */
export function domainReviewQuestionsFor(key: string): DeepReadonly<DomainReviewQuestion>[] {
  return DOMAIN_REVIEW_QUESTIONS.filter((question) =>
    (question.keys as readonly string[]).includes(key),
  );
}

/**
 * Verstöße gegen die Registerinvarianten — leer, wenn alles stimmt. Als Funktion und nicht nur
 * als Test, damit `review-dossier` sie im Betrieb melden kann statt ein Register mit toten
 * Schlüsseln stillschweigend auszugeben.
 */
export function domainReviewQuestionIssues(): string[] {
  const issues: string[] = [];
  const ids = new Set<string>();
  for (const question of DOMAIN_REVIEW_QUESTIONS) {
    if (ids.has(question.id)) issues.push(`Doppelte Fragen-ID: ${question.id}`);
    ids.add(question.id);
    if (question.keys.length === 0) issues.push(`Frage ohne Schlüssel: ${question.id}`);
    if (new Set(question.keys).size !== question.keys.length) {
      issues.push(`Doppelter Schlüssel in Frage ${question.id}`);
    }
    for (const key of question.keys) {
      if (!Object.prototype.hasOwnProperty.call(MANIFEST_DOMAIN_REVIEWS, key)) {
        issues.push(`Frage ${question.id} nennt einen Schlüssel ohne Ledgerplatz: ${key}`);
      }
    }
  }
  return issues;
}
