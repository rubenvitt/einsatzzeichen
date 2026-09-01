import { releaseBlockers, sortedDomainReviewOpenByArea } from '@einsatzzeichen/catalog';
import { areaOf, sectionOf } from './snapshot-sections.js';
import type { CoverageSummary } from './snapshot.js';

/**
 * Zwei Sichten auf `releaseBlockers()`: die flache Liste der offenen Punkte und dieselben Punkte
 * nach Bereich gezählt. Beide Male geht es um dieselbe Auswahlentscheidung — was ein offener Punkt
 * der Freigabe ist und was nicht —, und die steht deshalb in einer Datei.
 */

/**
 * Die offenen Punkte aus `releaseBlockers()`, je Schlüssel eine Zeile. Nicht darin: die
 * Gate-Verstöße aus `checkCoverage().violations` — die sind Fehler des Katalogs und nicht offene
 * Punkte der Freigabe; ihre Detailtexte nennen zudem Referenzdateien.
 */
export function blockerRows(): CoverageSummary['blockers'] {
  const blockers = releaseBlockers();
  const groups: Array<[kind: string, keys: readonly string[], detail: string]> = [
    ['manifest-review-offen', blockers.domainReviewOpen, 'Fachliches Review der Manifestzeile offen'],
    ['manifest-abweichung', blockers.domainReviewDeviations, 'Fachliches Review mit Abweichung'],
    ['quellen-review-offen', blockers.sourceDomainReviewOpen, 'Fachliches Review der Quelle offen'],
    ['quellen-abweichung', blockers.sourceDomainReviewDeviations, 'Fachliches Quellenreview mit Abweichung'],
    ['profil-review-offen', blockers.profileDomainReviewOpen, 'Fachliches Review des Profils offen'],
    ['profil-abweichung', blockers.profileDomainReviewDeviations, 'Fachliches Profilreview mit Abweichung'],
    ['ohne-testnachweis', blockers.withoutTestEvidence, 'Pflichtnachweisart fehlt'],
    ['umfang-ohne-eintrag', blockers.uncoveredScope, 'Kapitel im beanspruchten Umfang ohne Eintrag'],
  ];
  return groups.flatMap(([kind, keys, detail]) => keys.map((key) => ({ kind, key, detail })));
}

export function openDomainReviewsByArea(): CoverageSummary['openDomainReviewsByArea'] {
  const blockers = releaseBlockers();
  return sortedDomainReviewOpenByArea(blockers.domainReviewOpenByArea).map(([area, count]) => ({
    area,
    count,
    keys: blockers.domainReviewOpen.filter((key) => areaOf(sectionOf(key)) === area),
  }));
}
