import type { ReviewSet, SourceId, SourceRecord } from '@einsatzzeichen/schema';

/**
 * Für eine Quelle ist das Gate-Kriterium aus der Spec (Fingerprint- und Snapshot-Gate grün)
 * nicht anwendbar. An seine Stelle tritt eine ebenso prüfbare Aussage: die bibliografischen
 * Angaben und die Bezugsadresse sind gegen die Quelle geprüft. Die `note` hält diese
 * Rollenanpassung fest, damit sie dokumentiert und nicht stillschweigend ist.
 */
const SOURCE_REVIEW: ReviewSet = {
  technical: {
    status: 'approved',
    reviewer: 'rv',
    date: '2026-08-05',
    note: 'Bibliografische Angaben und Bezugsadresse gegen die Quelle geprüft.',
  },
  domain: { status: 'pending' },
};

/**
 * Die zwölf registrierten Quellen der Referenzhierarchie aus `Vision.md`. `phjardas-tz` ist
 * keine Quelle der Referenzhierarchie aus `Vision.md`, sondern ein Vergleichsbestand
 * (Slice-3-Spec, Abschnitt 4).
 *
 * Typannotation **und** `satisfies` zusammen: die Annotation weitet jeden Eintrag auf
 * `SourceRecord` — sonst behielte er seinen engsten Typ, bei `geometryUse` also ein eigenes
 * Tupel, und `Object.values(...).filter((r) => r.geometryUse.includes(...))` kollabierte am
 * Aufrufort zu `never`. `satisfies` erhält daneben beide Vollständigkeitsrichtungen, die eine
 * Annotation allein aufgäbe: keine deklarierte Quelle ohne Registereintrag, und kein
 * Registereintrag ohne deklarierte Quelle. Bewusst ohne `as const`.
 *
 * Zur Lizenzlage: die kostenpflichtigen DIN-Normen tragen `clarified`, weil die Nutzungslage
 * dort eindeutig ist — Nutzung setzt Erwerb voraus, und ohne Erwerb wird nichts übernommen. Bei
 * den Dienstvorschriften und den BABZ-Veröffentlichungen sind Weiterverwendung und Ableitung
 * nicht dokumentiert; `unclear` ist dort die ehrliche Angabe und trägt die Begründung für den
 * Fingerprint-Ansatz.
 */
export const SOURCE_REGISTRY: Record<SourceId, SourceRecord> = {
  'bbk-babz-2025': {
    id: 'bbk-babz-2025',
    kind: 'baseline',
    title:
      'Taktische Zeichen im Bevölkerungsschutz — Empfehlungen zur Einführung einer FwDV 102/DV 102',
    publisher: 'BBK / BABZ',
    url: 'https://lernplattform-babz-bund.de/ilias.php?baseClass=ilrepositorygui&cmd=sendfile&ref_id=150034',
    scope:
      'Verbindliche Baseline: Grundelemente, Organisationsfarben, Fähigkeiten, Stärkeangaben, taktische Einheiten und fachliche Anhänge.',
    acquisition: 'public-url',
    geometryUse: ['none'],
    licence: {
      basis:
        'Frei abrufbare Veröffentlichung der BABZ-Lernplattform; Weiterverwendung und Ableitung sind nicht dokumentiert.',
      status: 'unclear',
      note: 'Liefert die Abschnittsnummerierung des Coverage-Manifests, keine Geometrie.',
    },
    review: SOURCE_REVIEW,
  },
  'babz-svg-2025': {
    id: 'babz-svg-2025',
    kind: 'reference-assets',
    title: 'Freigestellte SVG-Grafikdateien der enthaltenen Zeichen',
    publisher: 'BBK / BABZ',
    url: 'https://lernplattform-babz-bund.de/ilias.php?baseClass=ilrepositorygui&ref_id=147616',
    scope: '661 Referenzdateien zu den Zeichen der Baseline, lokal unter taktische-zeichen/.',
    acquisition: 'local',
    geometryUse: ['measured-metrics', 'reconstructed'],
    licence: {
      basis:
        'Nutzungsgrundlage ungeklärt; deshalb werden ausschließlich Kennzahlen abgeleitet und keine Dateien eingecheckt.',
      status: 'unclear',
      note: 'Zweite Bezugsadresse derselben Quelle, auf weißer Hintergrundfläche: https://lernplattform-babz-bund.de/ilias.php?baseClass=ilrepositorygui&cmdClass=ilobjcategorygui&cmdNode=wv%3Ald&item_ref_id=0&ref_id=147615',
    },
    review: SOURCE_REVIEW,
  },
  'babz-hinweise-2024': {
    id: 'babz-hinweise-2024',
    kind: 'guidance',
    title: 'Begleitende Hinweise zur Überarbeitung vom 12.02.2024',
    publisher: 'BBK / BABZ',
    edition: '2024-02-12',
    url: 'https://www.lv-saarland.drk.de/fileadmin/user_upload/Begleitende_Hinweise_zur_%C3%9Cberarbeitung.pdf',
    scope: 'Erläutert die Änderungen der aktuellen Fassung gegenüber der Vorgängerfassung.',
    acquisition: 'public-url',
    geometryUse: ['none'],
    licence: {
      basis:
        'Frei abrufbares Begleitdokument; Weiterverwendung und Ableitung sind nicht dokumentiert.',
      status: 'unclear',
    },
    review: SOURCE_REVIEW,
  },
  'skk-2010': {
    id: 'skk-2010',
    kind: 'legacy',
    title:
      'DLRG DV 102 — Taktische Zeichen im Bevölkerungsschutz, 1. Auflage 2011 (SKK-Empfehlungen 2010)',
    publisher: 'DLRG / SKK',
    edition: '1. Auflage 2011',
    url: 'https://www.dlrg.de/fileadmin/user_upload/DLRG.de/Fuer-Mitglieder/Einsatz_und_Medizin/kats/Download_Dateien/Formulare_E008/DV102_TaktischeZeichen_DLRG110826.pdf',
    scope:
      'Ältere Systematik als Grundlage für Aliasnamen, Migrationshinweise und Differenzdarstellungen. Von keinem Katalogeintrag dieses Slice referenziert.',
    acquisition: 'public-url',
    geometryUse: ['none'],
    licence: {
      basis:
        'Frei abrufbare Dienstvorschrift; Weiterverwendung und Ableitung sind nicht dokumentiert.',
      status: 'unclear',
      note: 'Zweite Fundstelle derselben Systematik, älteres freies Lernangebot der BABZ: https://lernplattform-babz-bund.de/ilias.php?baseClass=ilstartupgui&client_id=BBKILIAS&cmdClass=ilaccessibilitycontrolconceptgui&cmdNode=zy%3A1t&lang=de&target=cat_109540',
    },
    review: SOURCE_REVIEW,
  },
  'fwdv-100': {
    id: 'fwdv-100',
    kind: 'operational-rule',
    title: 'FwDV 100 — Führung und Leitung im Einsatz',
    publisher: 'Landesfeuerwehrschule Baden-Württemberg (Bereitstellung)',
    url: 'https://www.lfs-bw.de/fileadmin/LFS-BW/themen/gesetze_vorschriften/fwdv/dokumente/FwDV_100.pdf',
    scope: 'Führungsorganisation, Führungsvorgang, Führungsmittel und Lagedarstellung.',
    acquisition: 'public-url',
    geometryUse: ['none'],
    licence: {
      basis:
        'Frei abrufbare Dienstvorschrift; Weiterverwendung und Ableitung sind nicht dokumentiert.',
      status: 'unclear',
    },
    review: SOURCE_REVIEW,
  },
  'fwdv-800': {
    id: 'fwdv-800',
    kind: 'operational-rule',
    title: 'FwDV/DV 800 — Informations- und Kommunikationstechnik im Einsatz',
    publisher: 'Landesfeuerwehrschule Baden-Württemberg (Bereitstellung)',
    url: 'https://www.lfs-bw.de/fileadmin/LFS-BW/themen/gesetze_vorschriften/fwdv/dokumente/FwDV_DV_800.pdf',
    scope: 'Ergänzende IuK-Terminologie und Darstellungszusammenhänge.',
    acquisition: 'public-url',
    geometryUse: ['none'],
    licence: {
      basis:
        'Frei abrufbare Dienstvorschrift; Weiterverwendung und Ableitung sind nicht dokumentiert.',
      status: 'unclear',
    },
    review: SOURCE_REVIEW,
  },
  'thw-einheiten': {
    id: 'thw-einheiten',
    kind: 'operational-rule',
    title: 'THW: Einheiten — Einzelblätter',
    publisher: 'Bundesanstalt Technisches Hilfswerk',
    url: 'https://www.thw.de/SharedDocs/Downloads/DE/Allgemein/einheiten_einzelblaetter.pdf?__blob=publicationFile&v=2',
    scope: 'Aktuelle Bezeichnungen und Strukturinformationen für ein künftiges THW-Profil.',
    acquisition: 'public-url',
    geometryUse: ['none'],
    licence: {
      basis:
        'Frei abrufbare Veröffentlichung; Weiterverwendung und Ableitung sind nicht dokumentiert.',
      status: 'unclear',
    },
    review: SOURCE_REVIEW,
  },
  'phjardas-tz': {
    id: 'phjardas-tz',
    kind: 'open-source-corpus',
    title: 'phjardas/taktische-zeichen — JavaScript-Generator nach DV 102',
    publisher: 'phjardas (GitHub)',
    url: 'https://github.com/phjardas/taktische-zeichen',
    scope:
      'Vergleichsbestand für Bildideen der Kapitel 4 und 5.8: 42 Fachaufgaben und 89 Symbole, jedes als handgeschriebener Pfad mit deklarierter Größe.',
    acquisition: 'public-url',
    geometryUse: ['compared-only'],
    licence: {
      basis: 'MIT-Lizenz, in LICENSE und packages/core/LICENSE gleichlautend.',
      status: 'clarified',
      note:
        'Übernommen wird die Methode (Piktogramme als geschriebene Pfade), keine Geometrie: ' +
        'der Upstream rechnet in Pixeln auf zeichenspezifischen Boxen, rekonstruiert die ' +
        'Systematik von 2010/2011 und verwendet relative Kommandos samt Ellipsenbögen. Da ' +
        'keine Geometrie übernommen wird, entsteht keine Attributionspflicht. Die ' +
        'Copyright-Zeile lautet "Copyright 2022" ohne Rechteinhaber — wäre je etwas zu ' +
        'attribuieren, müsste die Attribution auf das Repository lauten.',
    },
    review: SOURCE_REVIEW,
  },
  'din-14033': {
    id: 'din-14033',
    kind: 'standard',
    title: 'DIN 14033:2017-04 — Kurzzeichen für die Feuerwehr',
    publisher: 'DIN / Beuth',
    edition: '2017-04',
    url: 'https://www.dinmedia.de/de/norm/din-14033/267642931',
    scope: 'Kurzzeichen-Terminologie der Feuerwehr. Angrenzende Norm, keine Ersatzbaseline.',
    acquisition: 'not-acquired',
    geometryUse: ['none'],
    licence: {
      basis: 'Kostenpflichtige Norm: Nutzung setzt Erwerb voraus, ohne Erwerb wird nichts übernommen.',
      status: 'clarified',
    },
    review: SOURCE_REVIEW,
  },
  'din-13050': {
    id: 'din-13050',
    kind: 'standard',
    title: 'DIN 13050:2021-10 — Begriffe im Rettungswesen',
    publisher: 'DIN / Beuth',
    edition: '2021-10',
    url: 'https://www.dinmedia.de/de/norm/din-13050/343530475',
    scope: 'Begriffsdefinitionen des Rettungswesens. Angrenzende Norm, keine Ersatzbaseline.',
    acquisition: 'not-acquired',
    geometryUse: ['none'],
    licence: {
      basis: 'Kostenpflichtige Norm: Nutzung setzt Erwerb voraus, ohne Erwerb wird nichts übernommen.',
      status: 'clarified',
    },
    review: SOURCE_REVIEW,
  },
  'din-14034-6': {
    id: 'din-14034-6',
    kind: 'standard',
    title:
      'DIN 14034-6:2024-06 — Graphische Symbole für bauliche Einrichtungen im Feuerwehrwesen',
    publisher: 'DIN / Beuth',
    edition: '2024-06',
    url: 'https://www.dinmedia.de/de/norm/din-14034-6/377898786',
    scope:
      'Symbole für Feuerwehr- und Objektpläne. Gehört in ein eigenes Profil, das dieser Slice nicht baut.',
    acquisition: 'not-acquired',
    geometryUse: ['none'],
    licence: {
      basis: 'Kostenpflichtige Norm: Nutzung setzt Erwerb voraus, ohne Erwerb wird nichts übernommen.',
      status: 'clarified',
    },
    review: SOURCE_REVIEW,
  },
  'din-14095': {
    id: 'din-14095',
    kind: 'standard',
    title: 'DIN 14095:2025-07 — Feuerwehrpläne für bauliche Anlagen',
    publisher: 'DIN / Beuth',
    edition: '2025-07',
    url: 'https://www.dinmedia.de/de/norm/din-14095/391844018',
    scope:
      'Aufbau von Feuerwehrplänen. Gehört in dasselbe künftige Profil wie DIN 14034-6.',
    acquisition: 'not-acquired',
    geometryUse: ['none'],
    licence: {
      basis: 'Kostenpflichtige Norm: Nutzung setzt Erwerb voraus, ohne Erwerb wird nichts übernommen.',
      status: 'clarified',
    },
    review: SOURCE_REVIEW,
  },
} satisfies Record<SourceId, SourceRecord>;

/** Prüft, ob eine Zeichenkette eine registrierte Quelle bezeichnet. Vom Coverage-Gate verwendet. */
export function isRegisteredSource(id: string): id is SourceId {
  return Object.hasOwn(SOURCE_REGISTRY, id);
}
