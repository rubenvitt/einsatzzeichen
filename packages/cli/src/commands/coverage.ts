import {
  CONTRAST_EXCEPTIONS,
  COVERAGE_MANIFEST,
  SOURCE_REGISTRY,
  checkCoverage,
  generativeReach,
  profileFor,
  referenceInventory,
  releaseBlockers,
  ruleCoverage,
  sortedDomainReviewOpenByArea,
  validationRuleCoverage,
} from '@einsatzzeichen/catalog';

function counted(count: number, singular: string, plural: string): string {
  return `${count} ${count === 1 ? singular : plural}`;
}

export function coverage(): void {
  const { missing, duplicates, invalidPrimary, violations, openDomainReviews } = checkCoverage();
  const core = profileFor('bund');

  console.log(`Baseline:    ${COVERAGE_MANIFEST.baseline}`);
  console.log(`Kernversion: ${COVERAGE_MANIFEST.coreVersion} (Profil "${core.id}": ${core.version})`);
  console.log(`Umfang:      ${COVERAGE_MANIFEST.scope.join(', ')}`);
  console.log(`Einträge:    ${COVERAGE_MANIFEST.entries.length}`);
  console.log(`Quellen:     ${Object.keys(SOURCE_REGISTRY).length}`);

  // **Die Kontrastausnahmen gehören in die Betriebsausgabe und nicht nur in einen Test.** Ein
  // Kontrastpaar unterhalb der eigenen Schwelle ist eine Eigenschaft der Auslieferung: wer den
  // Katalog druckt, bekommt bei diesen Zeichen eine schlechter lesbare Beschriftung als bei allen
  // anderen. Stünde das nur in `a11y-contrast-gate.test.ts`, wäre es für jeden unsichtbar, der
  // das Paket benutzt statt es zu bauen.
  //
  // Ausdrücklich **kein** Freigabeblocker und deshalb nicht in `ReleaseBlockers`: ein Blocker ist
  // ein offener Punkt, eine Ausnahme ist ein entschiedener. Sie steht hier als Tatsache neben
  // Baseline und Umfang, nicht in der Blockerzeile.
  console.log(
    `Kontrastausnahmen: ${
      CONTRAST_EXCEPTIONS.length === 0
        ? 'keine'
        : CONTRAST_EXCEPTIONS.map(
            (exception) =>
              `${exception.foreground} auf ${exception.background} ` +
              `(${exception.sections.join(', ')}, entschieden am ${exception.decidedOn} ` +
              `durch ${exception.decidedBy})`,
          ).join('; ')
    }`,
  );

  for (const key of duplicates) console.error(`Doppelter Schlüssel: ${key}`);
  for (const key of missing) console.error(`Unvollständiger Eintrag: ${key}`);
  for (const id of invalidPrimary) console.error(`Keine genau eine primary-Darstellung: ${id}`);
  for (const v of violations) console.error(`[${v.check}] ${v.key}: ${v.detail}`);

  // Ab hier nur noch Ausgabe. Wäre ein offenes fachliches Review ein Fehler, wäre CI ab dem
  // ersten Tag dauerhaft rot — genau die Situation, in der Gates ignoriert werden.
  const blockers = releaseBlockers();
  const manifestReviews = counted(
    blockers.domainReviewOpen.length,
    'Manifestreview',
    'Manifestreviews',
  );
  const sourceReviews = counted(
    blockers.sourceDomainReviewOpen.length,
    'Quellenreview',
    'Quellenreviews',
  );
  const profileReviews = counted(
    blockers.profileDomainReviewOpen.length,
    'Profilreview',
    'Profilreviews',
  );
  const manifestDeviations = counted(
    blockers.domainReviewDeviations.length,
    'Manifestabweichung',
    'Manifestabweichungen',
  );
  const sourceDeviations = counted(
    blockers.sourceDomainReviewDeviations.length,
    'Quellenabweichung',
    'Quellenabweichungen',
  );
  const profileDeviations = counted(
    blockers.profileDomainReviewDeviations.length,
    'Profilabweichung',
    'Profilabweichungen',
  );
  console.log(
    `Offene fachliche Reviews: ${openDomainReviews} ` +
      `(${manifestReviews}, ${sourceReviews}, ${profileReviews})`,
  );
  console.log(
    `1.0-Blocker: ${manifestReviews}, ${sourceReviews} und ${profileReviews} ` +
      `noch ohne abgeschlossenes fachliches Review; ${manifestDeviations}, ${sourceDeviations} ` +
      `und ${profileDeviations} mit domain: deviation; ` +
      `${blockers.withoutTestEvidence.length} ohne Testnachweis, ` +
      `${blockers.uncoveredScope.length} Kapitel im beanspruchten Umfang ohne Eintrag`,
  );

  const byArea = sortedDomainReviewOpenByArea(blockers.domainReviewOpenByArea);
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

  // Die drei Achsen aus §7 der Slice-1-Spezifikation, im Betrieb sichtbar und nicht nur im
  // Test. Nur die Referenzabdeckung ist ein Gate — ihre Verstöße laufen oben über `violations`
  // und führen zu Exit 1; die beiden anderen sind Metriken über den Ausbaustand.
  const inventory = referenceInventory();
  const excluded = inventory.excludedByDisposition;
  console.log(
    `Referenzabdeckung:   ${inventory.claimed}/${inventory.total} Dateien beansprucht; ` +
      `${inventory.total - inventory.claimed} nicht — ${inventory.outOfScope} außerhalb des Umfangs, ` +
      `${excluded.example} Beispielanwendungen, ${excluded['overview-sheet']} Übersichtsblatt, ` +
      `${excluded.deferred} zurückgestellt, ${inventory.unaccounted.length} nicht zugeordnet`,
  );
  if (inventory.unaccounted.length > 0) {
    console.log(`  Nicht zugeordnet:  ${inventory.unaccounted.join(', ')}`);
  }

  const axes = ruleCoverage();
  const complete = axes.filter((axis) => axis.missing.length === 0);
  const rules = validationRuleCoverage();
  console.log(
    `Regelabdeckung:      ${complete.length}/${axes.length} Achsen vollständig belegt; ` +
      `${rules.total} Validierungsregeln (Testfall je Regel durch core-Test erzwungen)`,
  );
  const gaps = axes.filter((axis) => axis.missing.length > 0);
  if (gaps.length > 0) {
    console.log(
      `  Achsen mit Lücke:  ${gaps
        .map((axis) => `${axis.id} ${axis.exercised.length}/${axis.values.length} (${axis.missing.join(', ')})`)
        .join('; ')}`,
    );
  }

  const reach = generativeReach();
  console.log(
    `Generative Reichweite (Stufe 1): ${reach.valid} gültige Kompositionen aus kind × ` +
      'Körpervariante × Organisation × Kopfzone × Fahrwerk, davon ' +
      `${reach.referenced} in der Referenz belegt — ${reach.reachOnly} erzeugbar ohne ` +
      'Referenzbeleg (dokumentiert, kein Gate); nicht enumeriert: ' +
      reach.notEnumerated
        .map((axis) =>
          axis.id === 'capabilities' ? `${axis.size} Fähigkeiten`
            : axis.id === 'bodyMarks' ? `${axis.size} Körpermarken`
              : axis.id === 'functionRole' ? `${axis.size} Funktionsrollen`
                : 'freie Bezeichnung',
        )
        .join(', '),
  );

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
