/**
 * Quellen- und Profilzeilen haben planmäßig keine Zeichnung — an ihnen ist nichts zu sehen,
 * sondern etwas zu lesen. Diese Datei bereitet genau das auf, was die Designnotiz für ihre
 * Detailansicht nennt: Nutzungsgrundlage, Beschaffungsstand und Umgang mit der Geometrie.
 *
 * Die Aufzählungswerte werden über vollständige `Record`s übersetzt und nicht über eine
 * Zuordnung mit Rückfall: ein neuer `Acquisition`- oder `GeometryUse`-Wert soll die Typprüfung
 * brechen und nicht als roher Bezeichner in der Oberfläche stehen.
 */
import type {
  Acquisition,
  GeometryUse,
  LicenceStatus,
  ProfileRecord,
  SourceRecord,
} from '@einsatzzeichen/schema';
import type { ProseSection } from '../contract.js';

const ACQUISITION_TEXT: Record<Acquisition, string> = {
  local: 'Lokal vorhanden.',
  'public-url': 'Über eine öffentliche Bezugsadresse beziehbar, nicht im Repository abgelegt.',
  'not-acquired': 'Nicht beschafft — die Angaben stammen aus dem Register, nicht aus der Datei.',
};

const GEOMETRY_USE_TEXT: Record<GeometryUse, string> = {
  'measured-metrics': 'Aus der Quelle wurden Kennzahlen abgeleitet.',
  reconstructed: 'Bildideen der Quelle wurden eigenständig rekonstruiert.',
  'compared-only':
    'Nur verglichen: die Bildideen wurden gegen den Bestand gehalten, keine Koordinate ' +
    'übernommen — auch dort nicht, wo die Lizenz es erlaubt hätte.',
  none: 'Keine Geometrie aus dieser Quelle genutzt.',
};

const LICENCE_STATUS_TEXT: Record<LicenceStatus, string> = {
  clarified: 'Status: geklärt.',
  unclear: 'Status: ungeklärt.',
};

/**
 * Die drei Abschnitte einer Quellenzeile. Der Lizenzhinweis hängt an der Nutzungsgrundlage und
 * bekommt keinen eigenen Abschnitt: er erklärt sie, er steht nicht neben ihr.
 */
export function sourceProse(source: SourceRecord): readonly ProseSection[] {
  const licence = [source.licence.basis, LICENCE_STATUS_TEXT[source.licence.status]];
  if (source.licence.note !== undefined) licence.push(source.licence.note);
  return [
    { heading: 'Nutzungsgrundlage', body: licence.join(' ') },
    { heading: 'Beschaffungsstand', body: ACQUISITION_TEXT[source.acquisition] },
    {
      heading: 'Umgang mit der Geometrie',
      body: source.geometryUse.map((use) => GEOMETRY_USE_TEXT[use]).join(' '),
    },
  ];
}

/**
 * Ein Profil ist keine Quelle: `ProfileRecord` führt weder Lizenz noch Beschaffungsstand noch
 * eine Geometrienutzung. Diese drei Abschnitte hier zu erfinden hieße, dem Reviewer eine Angabe
 * vorzulegen, die im Register nicht steht. Stattdessen die Felder, die es tatsächlich trägt —
 * und die zusammen die Frage beantworten, worauf sich das Profil stützt.
 */
export function profileProse(profile: ProfileRecord): readonly ProseSection[] {
  return [
    { heading: 'Datenversion', body: `Profilversion ${profile.version}.` },
    {
      heading: 'Quellen',
      body: `Stützt sich auf: ${profile.sources.join(', ')}.`,
    },
    {
      heading: 'Geprüft gegen Kernversion',
      body: `${profile.verifiedAgainstCore}.`,
    },
  ];
}
