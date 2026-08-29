import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  COVERAGE_MANIFEST,
  DOMAIN_REVIEW_QUESTIONS,
  PROFILES,
  SOURCE_REGISTRY,
  releaseBlockers,
  sortedDomainReviewOpenByArea,
} from '@einsatzzeichen/catalog';
import { entryKey } from '@einsatzzeichen/schema';
import {
  EVIDENCE_CODES,
  EVIDENCE_LEGEND,
  ReviewDossierError,
  dossierAreaOrder,
  openDomainReviewsBullet,
  renderReviewDossier,
  reviewDossier,
} from './review-dossier.js';

// Nur die Dateisystemgrenze ist gefaked (Muster: `audit-reference.test.ts`); das Dossier selbst
// liest kein Dateisystem, `fingerprints.json` kommt per JSON-Import.
const mocks = vi.hoisted(() => ({ mkdirSync: vi.fn(), writeFileSync: vi.fn() }));
vi.mock('node:fs', () => mocks);

afterEach(() => {
  vi.restoreAllMocks();
});

const markdown = renderReviewDossier();
const lines = markdown.split('\n');
const tableRows = lines.filter((line) => line.startsWith('| `'));
const manifestRows = tableRows.filter((line) => /^\| `[^`]+#(?:primary|alternative)`/.test(line));

describe('review-dossier CLI', () => {
  it('nennt dieselben Zählungen wie das Coverage-Manifest und die Release-Blocker', () => {
    const blockers = releaseBlockers();
    const manifestPending = COVERAGE_MANIFEST.entries.filter(
      (entry) => entry.review.domain.status === 'pending',
    ).length;
    const sourcePending = Object.values(SOURCE_REGISTRY).filter(
      (source) => source.review.domain.status === 'pending',
    ).length;
    const profilePending = Object.values(PROFILES).filter(
      (profile) => profile.review.domain.status === 'pending',
    ).length;

    expect(manifestPending).toBe(blockers.domainReviewOpen.length);
    expect(lines).toContain(
      `- Offene fachliche Reviews: ${blockers.domainReviewOpen.length} Manifest, ` +
        `${blockers.sourceDomainReviewOpen.length} Quellen, ` +
        `${blockers.profileDomainReviewOpen.length} Profil`,
    );
    expect(lines).toContain(
      `| Manifestzeilen | ${manifestPending} | 0 | 0 | ${COVERAGE_MANIFEST.entries.length} |`,
    );
    expect(lines).toContain(`| Quellen | ${sourcePending} | 0 | 0 | ${Object.keys(SOURCE_REGISTRY).length} |`);
    expect(lines).toContain(`| Profile | ${profilePending} | 0 | 0 | ${Object.keys(PROFILES).length} |`);
    expect(lines).toContain(`- Kernversion: ${COVERAGE_MANIFEST.coreVersion} (Profil \`bund\`: ${PROFILES.bund.version})`);
  });

  it('führt je Bereich dieselbe Zahl offener Reviews wie die Coverage-Zeile, in derselben Reihenfolge', () => {
    const byArea = sortedDomainReviewOpenByArea(releaseBlockers().domainReviewOpenByArea);
    const headings = lines
      .filter((line) => line.startsWith('### '))
      .map((line) => /^### (?:Kapitel|Anhang) (\S+) — (\d+) offen/.exec(line))
      .filter((match): match is RegExpExecArray => match !== null)
      .map((match) => [match[1], Number(match[2])] as const);
    expect(headings.slice(0, byArea.length)).toEqual(byArea);
    // Heute ist kein Bereich vollständig abgeschlossen: jeder distinkte Bereich des Manifests hat
    // genau eine Überschrift, und es hängt nichts an.
    const distinctAreas = new Set(
      COVERAGE_MANIFEST.entries.map((entry) => {
        const section = entry.sourceId.slice(entry.sourceId.indexOf(':') + 1);
        return section.includes('.') ? section.slice(0, section.indexOf('.')) : section;
      }),
    );
    expect(headings).toHaveLength(distinctAreas.size);
    expect(headings.length).toBe(byArea.length);
  });

  it('hängt vollständig abgeschlossene Bereiche alphabetisch (localeCompare) hinter die offenen', () => {
    // Fixture: „4" und „E" offen, „C", „1" und „a" ohne offene Zeile. Der Primärpfad sortiert
    // absteigend nach Anzahl, der Rest per localeCompare — nicht per Codepunkt, sonst stünde
    // „a" hinter „C".
    expect(dossierAreaOrder({ E: 5, 4: 5 }, ['1', 'C', 'E', 'a', '4', 'E'])).toEqual([
      '4', 'E', '1', 'a', 'C',
    ]);
    expect(dossierAreaOrder({}, ['b', 'A'])).toEqual(['A', 'b']);
  });

  it('enthält jeden Manifestschlüssel genau einmal', () => {
    const keys = COVERAGE_MANIFEST.entries.map((entry) => entryKey(entry.sourceId, entry.variant));
    const seen = new Map<string, number>();
    for (const row of manifestRows) {
      const key = /^\| `([^`]+)`/.exec(row)?.[1] ?? '';
      seen.set(key, (seen.get(key) ?? 0) + 1);
    }
    expect([...seen.keys()].sort()).toEqual([...keys].sort());
    expect([...seen.values()].every((count) => count === 1)).toBe(true);
  });

  it('enthält jede Quelle und jedes Profil', () => {
    for (const id of [...Object.keys(SOURCE_REGISTRY), ...Object.keys(PROFILES)]) {
      expect(tableRows.filter((row) => row.startsWith(`| \`${id}\` |`))).toHaveLength(1);
    }
  });

  it('gibt keine absoluten lokalen Pfade und keine Pfadtrenner in Referenzassets aus', () => {
    expect(markdown).not.toMatch(/\/(Users|home|tmp|private|var)\//);
    expect(markdown).not.toMatch(/taktische-zeichen\//);
    for (const row of manifestRows) {
      const asset = row.split(' | ')[3] ?? '';
      expect(asset, row).not.toMatch(/[\\/]/);
    }
    expect(markdown).not.toContain('nicht im Kennwertartefakt');
  });

  it('nennt Fachfragen an ihren Schlüsseln und listet ihren Wortlaut je Bereich', () => {
    const row = tableRows.find((line) => line.startsWith('| `bbk-babz-2025:1.13#primary` |'));
    expect(row).toContain('Q-1-ereignis-ohne-organisation');
    expect(markdown).toContain('#### Offene Fachfragen zu Kapitel 1');
    for (const question of DOMAIN_REVIEW_QUESTIONS) {
      expect(markdown).toContain(`- **${question.id}**`);
    }
  });

  it('erklärt jedes verwendete Evidenzkürzel in der Legende', () => {
    const used = new Set<string>();
    for (const row of manifestRows) {
      const evidence = row.split(' | ')[4] ?? '';
      if (evidence === '—' || evidence === '') continue;
      for (const abbreviation of evidence.split(', ')) used.add(abbreviation);
    }
    for (const abbreviation of used) {
      expect(markdown, abbreviation).toContain(`- **${abbreviation}:**`);
    }
  });

  it('vergibt je Nachweisart ein eigenes Kürzel und erklärt jedes in der Legende', () => {
    const codes = Object.values(EVIDENCE_CODES);
    expect(new Set(codes).size).toBe(Object.keys(EVIDENCE_CODES).length);
    const legend = new Set(EVIDENCE_LEGEND.map(([abbreviation]) => abbreviation));
    for (const abbreviation of codes) expect(legend.has(abbreviation), abbreviation).toBe(true);
    expect(legend.size).toBe(codes.length);
  });

  it('bricht bei Registerfehlern mit ReviewDossierError ab statt still ein Dossier zu schreiben', () => {
    const stdout = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
    expect(() =>
      reviewDossier({ out: 'docs/reviews/dossier.md', registerIssues: () => ['Frage X nennt 9.9'] }),
    ).toThrow(ReviewDossierError);
    expect(() => reviewDossier({ registerIssues: () => ['Frage X nennt 9.9'] })).toThrow(
      /Frage X nennt 9\.9/,
    );
    expect(stdout).not.toHaveBeenCalled();
    expect(mocks.writeFileSync).not.toHaveBeenCalled();
  });

  it('ist deterministisch und ändert keinen Reviewstatus', () => {
    expect(renderReviewDossier()).toBe(markdown);
    expect(markdown).not.toMatch(/\d{4}-\d{2}-\d{2}T/);
    expect(COVERAGE_MANIFEST.entries.every((entry) => entry.review.domain.status === 'pending')).toBe(true);
  });

  it('schreibt mit --out in eine Datei, sonst auf stdout', () => {
    const stdout = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
    const log = vi.spyOn(console, 'log').mockImplementation(() => undefined);

    reviewDossier();
    expect(stdout).toHaveBeenCalledWith(markdown);
    expect(mocks.writeFileSync).not.toHaveBeenCalled();

    reviewDossier({ out: 'docs/reviews/dossier.md' });
    expect(mocks.mkdirSync).toHaveBeenCalledWith('docs/reviews', { recursive: true });
    expect(mocks.writeFileSync).toHaveBeenCalledWith('docs/reviews/dossier.md', markdown, 'utf8');
    expect(log).toHaveBeenCalledTimes(1);
  });
});

describe('openDomainReviewsBullet', () => {
  // Wie in `coverage.test.ts`: der Nullfall ist gegen den echten Ledger nicht auslösbar und
  // wird deshalb gegen erfundene Zahlen geprüft.
  it('sagt den Nullfall aus, statt „0 Manifest, 0 Quellen, 0 Profil" zu zählen', () => {
    expect(openDomainReviewsBullet(0, 0, 0)).toBe(
      '- Offene fachliche Reviews: keine — alle Manifestzeilen, Quellen und Profile sind ' +
        'fachlich freigegeben',
    );
  });

  it('zählt sonst je Trägerart', () => {
    expect(openDomainReviewsBullet(544, 13, 1)).toBe(
      '- Offene fachliche Reviews: 544 Manifest, 13 Quellen, 1 Profil',
    );
  });
});
