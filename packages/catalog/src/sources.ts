import type { Review, ReviewSet, SourceId, SourceRecord } from '@einsatzzeichen/schema';
import { sourceDomainReviewFor } from './domain-reviews.js';

/**
 * Für eine Quelle ist das Gate-Kriterium aus der Spec (Fingerprint- und Snapshot-Gate grün)
 * nicht anwendbar. An seine Stelle tritt eine ebenso prüfbare Aussage: die bibliografischen
 * Angaben und die Bezugsadresse sind gegen die Quelle geprüft. Die `note` hält diese
 * Rollenanpassung fest, damit sie dokumentiert und nicht stillschweigend ist.
 */
const SOURCE_TECHNICAL_REVIEW: Review = {
  status: 'approved',
  reviewer: 'rv',
  date: '2026-08-05',
  note: 'Bibliografische Angaben und Bezugsadresse gegen die Quelle geprüft.',
};

/**
 * Der Baseline-Eintrag wurde am 2026-08-06 auf die aktuelle Statusseite umgestellt und deshalb
 * neu technisch geprüft. Die Zurechnung zu `codex` bezeichnet nur URL-, Text- und Registerprüfung;
 * das fachliche beziehungsweise normative Review bleibt ausdrücklich offen.
 */
const BASELINE_SOURCE_TECHNICAL_REVIEW: Review = {
  status: 'approved',
  reviewer: 'codex',
  date: '2026-08-06',
  note:
    'Offizielle BABZ-URL, Statushinweis und Registeraussagen am 2026-08-06 technisch ' +
    'geprüft; keine fachliche oder normative Freigabe.',
};

/**
 * Eigene Review-Angabe für `phjardas-tz`: der Eintrag entstand am 2026-08-06, einen Tag nach den
 * damals vorhandenen Einträgen. Das Prüfdatum ist eine Aussage über *diesen* Eintrag, nicht über
 * das Register — deshalb keine gemeinsame Konstante mit `SOURCE_TECHNICAL_REVIEW`.
 */
const PHJARDAS_TZ_TECHNICAL_REVIEW: Review = {
  status: 'approved',
  reviewer: 'rv',
  date: '2026-08-06',
  note: 'Bibliografische Angaben und Bezugsadresse gegen die Quelle geprüft.',
};

/**
 * Eigene Review-Angabe für `arimo-ofl`: der Eintrag entstand am 2026-08-09, drei Tage nach den
 * übrigen Quellen, als Registrierung der Textschrift aus `fonts.ts` — deshalb ein eigenes
 * Prüfdatum statt der gemeinsamen `SOURCE_TECHNICAL_REVIEW`-Konstante.
 */
const ARIMO_OFL_TECHNICAL_REVIEW: Review = {
  status: 'approved',
  reviewer: 'rv',
  date: '2026-08-09',
  note:
    'Bezugs-URL, SHA-256-Prüfsumme der Schriftdatei und OFL-Lizenztext am 2026-08-09 technisch ' +
    'geprüft; keine fachliche oder normative Freigabe.',
};

function sourceReviewFor(id: SourceId, technical: Review): ReviewSet {
  return { technical, domain: sourceDomainReviewFor(id) };
}

/**
 * Elf Quellen der Referenzhierarchie aus `Vision.md`, dazu `phjardas-tz` als Vergleichsbestand
 * (Slice-3-Spec, Abschnitt 4) und `arimo-ofl` als Schriftquelle des Textprimitivs
 * (siehe `packages/catalog/src/fonts.ts`).
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
    url: 'https://lernplattform-babz-bund.de/goto.php?target=cat_109540',
    scope:
      'Projektinterne Coverage-Baseline für Grundelemente, Organisationsfarben, Fähigkeiten, ' +
      'Stärkeangaben, taktische Einheiten und fachliche Anhänge. Keine geltende eigenständige ' +
      'Dienstvorschrift; die BABZ führt den Stand als Diskussionsgrundlage für eine künftige ' +
      'FwDV 102/DV 102.',
    acquisition: 'public-url',
    geometryUse: ['none'],
    licence: {
      basis:
        'Die offizielle BABZ-Statusseite ist frei abrufbar. Weiterverwendung und Ableitung des ' +
        'lokal archivierten Arbeitsstands sind nicht dokumentiert.',
      status: 'unclear',
      note:
        'Stand der Statusprüfung: 2026-08-06. Der AFKzV hob in seiner 57. Sitzung am ' +
        '13./14.03.2025 die vorläufige Anwendung auf. ' +
        'Nach Angabe der BABZ sind weitere Veröffentlichung und Verbreitung des Ergebnisses bis ' +
        'zum Abschluss der Beratungen ausgesetzt. Die Quelle liefert im Projekt weiterhin die ' +
        'Abschnittsnummerierung des Coverage-Manifests, aber keine Geometrie und keine Behauptung ' +
        'normativer Geltung.',
    },
    review: sourceReviewFor('bbk-babz-2025', BASELINE_SOURCE_TECHNICAL_REVIEW),
  },
  'babz-svg-2025': {
    id: 'babz-svg-2025',
    kind: 'reference-assets',
    title: 'Freigestellte SVG-Grafikdateien der enthaltenen Zeichen',
    publisher: 'BBK / BABZ',
    url: 'https://lernplattform-babz-bund.de/ilias.php?baseClass=ilrepositorygui&ref_id=147616',
    scope:
      '661 lokal archivierte Referenzdateien des damaligen BABZ-Arbeitsstands unter ' +
      'taktische-zeichen/. Die BABZ-Veröffentlichung und -Verbreitung dieses Stands ist derzeit ' +
      'ausgesetzt.',
    acquisition: 'local',
    geometryUse: ['measured-metrics', 'reconstructed'],
    licence: {
      basis:
        'Nutzungsgrundlage des lokal archivierten Arbeitsstands ungeklärt; deshalb werden ' +
        'ausschließlich Kennzahlen abgeleitet und keine Dateien eingecheckt.',
      status: 'unclear',
      note:
        'Offizielle Statusseite des zugehörigen Empfehlungsstands, geprüft am 2026-08-06: ' +
        'https://lernplattform-babz-bund.de/goto.php?target=cat_109540',
    },
    review: sourceReviewFor('babz-svg-2025', SOURCE_TECHNICAL_REVIEW),
  },
  'babz-hinweise-2024': {
    id: 'babz-hinweise-2024',
    kind: 'guidance',
    title: 'Begleitende Hinweise zur Überarbeitung vom 12.02.2024',
    publisher: 'BBK / BABZ',
    edition: '2024-02-12',
    url: 'https://www.lv-saarland.drk.de/fileadmin/user_upload/Begleitende_Hinweise_zur_%C3%9Cberarbeitung.pdf',
    scope: 'Erläutert die Änderungen des damaligen Überarbeitungsstands gegenüber der Vorgängerfassung.',
    acquisition: 'public-url',
    geometryUse: ['none'],
    licence: {
      basis:
        'Frei abrufbares Begleitdokument; Weiterverwendung und Ableitung sind nicht dokumentiert.',
      status: 'unclear',
    },
    review: sourceReviewFor('babz-hinweise-2024', SOURCE_TECHNICAL_REVIEW),
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
    },
    review: sourceReviewFor('skk-2010', SOURCE_TECHNICAL_REVIEW),
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
    review: sourceReviewFor('fwdv-100', SOURCE_TECHNICAL_REVIEW),
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
    review: sourceReviewFor('fwdv-800', SOURCE_TECHNICAL_REVIEW),
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
    review: sourceReviewFor('thw-einheiten', SOURCE_TECHNICAL_REVIEW),
  },
  'phjardas-tz': {
    id: 'phjardas-tz',
    kind: 'open-source-corpus',
    title: 'phjardas/taktische-zeichen — JavaScript-Generator nach DV 102',
    publisher: 'phjardas (GitHub)',
    url: 'https://github.com/phjardas/taktische-zeichen',
    scope:
      'Vergleichsbestand für die Bildideen der Kapitel 4 und 5.8: benannte Fachaufgaben und Symbole, jedes als handgeschriebener Pfad mit deklarierter Größe.',
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
    review: sourceReviewFor('phjardas-tz', PHJARDAS_TZ_TECHNICAL_REVIEW),
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
    review: sourceReviewFor('din-14033', SOURCE_TECHNICAL_REVIEW),
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
    review: sourceReviewFor('din-13050', SOURCE_TECHNICAL_REVIEW),
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
    review: sourceReviewFor('din-14034-6', SOURCE_TECHNICAL_REVIEW),
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
    review: sourceReviewFor('din-14095', SOURCE_TECHNICAL_REVIEW),
  },
  'arimo-ofl': {
    id: 'arimo-ofl',
    kind: 'typeface',
    title: 'Arimo (Variable Font)',
    publisher: 'Google Fonts / The Arimo Project Authors',
    edition: '1.341',
    url: 'https://raw.githubusercontent.com/google/fonts/main/ofl/arimo/Arimo%5Bwght%5D.ttf',
    scope:
      'Einzige Textschrift des Projekts für das Textprimitiv aus Anhang J. Metrisch ' +
      'Arial-kompatibel, siehe packages/catalog/assets/README.md.',
    acquisition: 'local',
    geometryUse: ['none'],
    licence: {
      basis:
        'SIL Open Font License 1.1, vollständiger Text in packages/catalog/assets/Arimo-OFL.txt; ' +
        'erlaubt Einbettung, Verbreitung und Modifikation der Schrift.',
      status: 'clarified',
    },
    review: sourceReviewFor('arimo-ofl', ARIMO_OFL_TECHNICAL_REVIEW),
  },
} satisfies Record<SourceId, SourceRecord>;

/** Prüft, ob eine Zeichenkette eine registrierte Quelle bezeichnet. Vom Coverage-Gate verwendet. */
export function isRegisteredSource(id: string): id is SourceId {
  return Object.hasOwn(SOURCE_REGISTRY, id);
}
