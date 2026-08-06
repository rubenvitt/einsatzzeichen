import {
  COVERAGE_MANIFEST,
  SOURCE_REGISTRY,
  checkCoverage,
  profileFor,
  releaseBlockers,
  sortedDomainReviewPendingByArea,
} from '@einsatzzeichen/catalog';

export function coverage(): void {
  const { missing, duplicates, invalidPrimary, violations, openDomainReviews } = checkCoverage();
  const core = profileFor('bund');

  console.log(`Baseline:    ${COVERAGE_MANIFEST.baseline}`);
  console.log(`Kernversion: ${COVERAGE_MANIFEST.coreVersion} (Profil "${core.id}": ${core.version})`);
  console.log(`Umfang:      ${COVERAGE_MANIFEST.scope.join(', ')}`);
  console.log(`Einträge:    ${COVERAGE_MANIFEST.entries.length}`);
  console.log(`Quellen:     ${Object.keys(SOURCE_REGISTRY).length}`);

  for (const key of duplicates) console.error(`Doppelter Schlüssel: ${key}`);
  for (const key of missing) console.error(`Unvollständiger Eintrag: ${key}`);
  for (const id of invalidPrimary) console.error(`Keine genau eine primary-Darstellung: ${id}`);
  for (const v of violations) console.error(`[${v.check}] ${v.key}: ${v.detail}`);

  // Ab hier nur noch Ausgabe. Wäre ein offenes fachliches Review ein Fehler, wäre CI ab dem
  // ersten Tag dauerhaft rot — genau die Situation, in der Gates ignoriert werden.
  const blockers = releaseBlockers();
  console.log(`Offene fachliche Reviews: ${openDomainReviews}`);
  console.log(`1.0-Blocker: ${blockers.domainReviewPending.length} ohne fachliches Review, ` +
    `${blockers.withoutTestEvidence.length} ohne Testnachweis, ` +
    `${blockers.uncoveredScope.length} Kapitel im beanspruchten Umfang ohne Eintrag`);

  const byArea = sortedDomainReviewPendingByArea(blockers.domainReviewPendingByArea);
  if (byArea.length > 0) {
    console.log(
      `  Offene fachliche Reviews nach Bereich: ${byArea
        .map(([area, count]) => `${area}: ${count}`)
        .join(', ')}`,
    );
  }

  for (const chapter of blockers.uncoveredScope) {
    console.log(`  Kapitel im beanspruchten Umfang ohne Eintrag: ${chapter}`);
  }

  if (
    duplicates.length > 0 ||
    missing.length > 0 ||
    invalidPrimary.length > 0 ||
    violations.length > 0
  ) {
    process.exit(1);
  }
  console.log('Coverage-Gate bestanden.');
}
