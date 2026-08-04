import { COVERAGE_MANIFEST, checkCoverage } from '@einsatzzeichen/catalog';

export function coverage(): void {
  const { missing, duplicates, invalidPrimary } = checkCoverage();

  console.log(`Baseline: ${COVERAGE_MANIFEST.baseline}`);
  console.log(`Umfang:   ${COVERAGE_MANIFEST.scope.join(', ')}`);
  console.log(`Einträge: ${COVERAGE_MANIFEST.entries.length}`);

  for (const key of duplicates) console.error(`Doppelter Schlüssel: ${key}`);
  for (const key of missing) console.error(`Unvollständiger Eintrag: ${key}`);
  for (const id of invalidPrimary) console.error(`Keine genau eine primary-Darstellung: ${id}`);

  if (duplicates.length > 0 || missing.length > 0 || invalidPrimary.length > 0) process.exit(1);
  console.log('Coverage-Gate bestanden.');
}
