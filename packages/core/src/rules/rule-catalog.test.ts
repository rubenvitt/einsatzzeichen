import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { VALIDATION_RULE_IDS } from '../validation-rules.js';
import {
  COMPOSITION_RULE_CATALOG,
  RULE_CATALOG,
  RULE_DIMENSIONS,
  RULE_DIMENSION_GAPS,
  ruleCatalogEntry,
} from './rule-catalog.js';

const here = dirname(fileURLToPath(import.meta.url));

function source(relativePath: string): string {
  return readFileSync(join(here, relativePath), 'utf8');
}

describe('RULE_CATALOG gegen VALIDATION_RULE_IDS', () => {
  /**
   * Beide Richtungen einzeln und benannt, wie `validation-rules.test.ts` es tut: eine gemeinsame
   * Zusicherung sagte im Fehlerfall nur „die Listen sind verschieden" und nicht, in welche
   * Richtung. Das ist der Grund, warum der Katalog überhaupt neben der Liste stehen darf — er ist
   * eine dritte, gegengeprüfte Sicht und keine Wiederholung.
   */
  const listed = new Set(VALIDATION_RULE_IDS);
  const cataloged = new Set(RULE_CATALOG.map((rule) => rule.id));

  it('führt keine Kennung, die VALIDATION_RULE_IDS nicht kennt', () => {
    expect([...cataloged].filter((id) => !listed.has(id)).sort()).toEqual([]);
  });

  it('lässt keine Kennung aus VALIDATION_RULE_IDS aus', () => {
    expect([...listed].filter((id) => !cataloged.has(id)).sort()).toEqual([]);
  });

  it('ist alphabetisch sortiert und frei von Dubletten', () => {
    expect(RULE_CATALOG.map((rule) => rule.id)).toEqual([...cataloged].sort());
    expect(RULE_CATALOG).toHaveLength(cataloged.size);
  });
});

describe('RULE_CATALOG: Vollständigkeit je Eintrag', () => {
  it('trägt zu jeder Regel eine Einordnung, eine Dimension und die Prüfphase', () => {
    for (const rule of RULE_CATALOG) {
      expect(['systematik', 'engine'], rule.id).toContain(rule.kind);
      expect(RULE_DIMENSIONS, rule.id).toContain(rule.dimension);
      expect(rule.phase, rule.id).toBe('spec');
    }
  });

  it('trägt entweder eine nichtleere Begründung mit Herkunft oder ausdrücklich keine', () => {
    for (const rule of [...RULE_CATALOG, ...COMPOSITION_RULE_CATALOG]) {
      if (rule.reason === null) {
        expect(rule.reasonSource, rule.id).toBeNull();
        continue;
      }
      expect(rule.reason.trim(), rule.id).not.toBe('');
      expect(rule.reason, rule.id).not.toMatch(/TODO|TBD/);
      expect(['core', 'website'], rule.id).toContain(rule.reasonSource);
    }
  });

  /**
   * Festgenagelt wie das `it.todo`-Muster in `validation-rules.test.ts`: `reason: null` heißt
   * „Begründung nicht belegt". Die Liste ist derzeit leer — der Bestand dokumentiert jede Regel
   * irgendwo —, und genau deshalb steht sie hier: wächst sie, fällt das auf, statt still zu
   * bleiben.
   */
  it('nagelt die Regeln ohne belegte Begründung fest', () => {
    const withoutReason = RULE_CATALOG.filter((rule) => rule.reason === null).map((r) => r.id);
    expect(withoutReason.sort()).toEqual([]);
  });

  /**
   * Der Befund, aus dem die offene Frage der Entscheidungsnotiz folgt: für diese Regeln steht die
   * Begründung **nur** in `packages/website/src/lib/rule-explanations.ts`; der Kern wiederholt
   * dort lediglich den Prüfausdruck in Worten. Die Sätze sind von Hand kopiert, und kein Gate
   * hält sie in Deckung — `core` darf `website` nicht importieren, eine Prüfung liefe gegen die
   * Importgrenze. Die Menge ist festgenagelt, damit sie nicht unbemerkt wächst.
   */
  it('nagelt die Begründungen fest, die nur die Website belegt', () => {
    const fromWebsite = RULE_CATALOG.filter((rule) => rule.reasonSource === 'website')
      .map((rule) => rule.id);
    expect(fromWebsite.sort()).toEqual([
      'above-left-metrics-complete',
      'above-left-metrics-within-viewbox',
      'bottom-right-metrics-complete',
      'bottom-right-metrics-require-measured-body',
      'bottom-right-metrics-within-body',
      'center-anchor-override-requires-measured-trailer',
      'center-baseline-not-measured',
      'center-baseline-override-requires-measured-body',
      'center-baseline-positive',
      'center-baseline-requires-center-label',
      'center-box-margin-non-negative',
      'center-box-margin-override-requires-measured-body',
      'center-box-margin-requires-center-label',
      'center-box-margin-within-body',
      'center-label-within-body',
      'function-role-body-mark-mismatch',
      'function-role-head-mismatch',
      'function-role-label-metrics-required',
      'function-role-organization-mismatch',
      'surface-label-requires-measured-body',
      'surface-left-label-requires-measured-anchor',
      'surface-right-label-requires-measured-anchor',
      'technical-fill-token-invalid',
      'technical-head-mark-not-measured',
      'top-left-anchor-within-body',
      'top-left-cap-height-positive',
      'top-left-lines-exactly-two',
    ]);
    expect(fromWebsite).toHaveLength(27);
    expect(RULE_CATALOG.filter((rule) => rule.reasonSource === 'core')).toHaveLength(45);
  });

  /**
   * Ein Quellenbezug ohne Fundstelle wäre eine Behauptung. Deshalb: entweder `null`, oder eine
   * `SourceReference` mit nichtleerem Abschnitt. `status: 'derived'` durchweg — `'verbatim'`
   * behauptet einen Geometrie-Fingerprint, den eine Regel nicht hat.
   */
  it('führt einen Quellenbezug nur mit Abschnitt und als abgeleitet', () => {
    for (const rule of [...RULE_CATALOG, ...COMPOSITION_RULE_CATALOG]) {
      if (rule.source === null) continue;
      expect(rule.source.section?.trim(), rule.id).not.toBe('');
      expect(rule.source.section, rule.id).toBeDefined();
      expect(rule.source.status, rule.id).toBe('derived');
      expect(rule.source.source, rule.id).toBe('babz-svg-2025');
    }
  });

  it('nagelt die Regeln mit belegtem Quellenbezug fest', () => {
    const withSource = RULE_CATALOG.filter((rule) => rule.source !== null).map((r) => r.id);
    expect(withSource.sort()).toEqual([
      'above-left-label-requires-measured-body',
      'administrative-level-not-measured',
      'below-right-label-requires-measured-body',
      'below-right-label-requires-organization',
      'bottom-center-label-requires-measured-body',
      'chassis-foot-conflict',
      'circle-12-requires-hilfsorganisation',
      'circle-top-left-anchor-within-viewbox',
      'colored-circle-top-left-not-measured',
      'inset-hull-requires-center-label-only',
      'reduced-house-requires-hilfsorganisation',
      'technical-head-mark-requires-normal-formation',
      'top-left-anchor-within-body',
      'top-left-baseline-within-body',
      'top-left-label-requires-measured-body',
      'top-left-lines-require-measured-body',
      'top-left-metrics-require-measured-vehicle-land',
      'vehicle-category-requires-vehicle',
    ]);
  });
});

describe('RULE_CATALOG gegen den Quelltext von validate.ts', () => {
  /**
   * `validate.ts` löst 75 Mal aus, führt aber nur 72 Kennungen: drei Regeln haben zwei
   * Auslösestellen. Im Katalog bleiben sie **ein** Eintrag — sonst bräche die Dublettenprüfung —
   * und tragen die Zahl ihrer Stellen im Feld `sites`. Dieser Test zählt die Stellen im
   * Quelltext dagegen, damit eine künftige dritte Stelle nicht still dazukommt.
   */
  const pushedIds = [...source('../validate.ts').matchAll(/rule: '([a-z0-9-]+)'/g)]
    .map((match) => match[1] as string);

  it('zählt die Auslösestellen je Kennung gegen das Feld sites', () => {
    const perId = new Map<string, number>();
    for (const id of pushedIds) perId.set(id, (perId.get(id) ?? 0) + 1);
    const declared = Object.fromEntries(RULE_CATALOG.map((rule) => [rule.id, rule.sites]));
    expect(Object.fromEntries([...perId].sort())).toEqual(
      Object.fromEntries(Object.entries(declared).sort()),
    );
  });

  it('bleibt bei 75 Auslösestellen für 72 Kennungen', () => {
    expect(pushedIds).toHaveLength(75);
    expect(new Set(pushedIds).size).toBe(72);
    expect(RULE_CATALOG.filter((rule) => rule.sites > 1).map((rule) => rule.id)).toEqual([
      'function-role-requires-measured-kind',
      'function-role-requires-measured-layout',
      'label-not-blank',
    ]);
  });
});

describe('COMPOSITION_RULE_CATALOG gegen den Quelltext von compose.ts', () => {
  /**
   * Gegen den Quelltext, nicht gegen sich selbst — aber anders als bei `validate.ts`: in
   * `assertTextRunsFit()` stehen die Kennungen **nicht** als Literale, sondern als
   * Template-Literale `${rulePrefix}-too-wide`. Ein Scan auf `rule: '…'` fände dort null.
   *
   * `rule-explanations.test.ts` in der Website löst die Kennungen stattdessen über
   * `composeFromCatalog` aus. Dieser Weg steht `core` nicht offen: er führte über
   * `@einsatzzeichen/catalog`, und die Importgrenze `catalog → core` verbietet die Gegenrichtung.
   *
   * Also derselbe Gedanke wie in `validation-rules.test.ts` — Quelltextscan aus einer Testdatei,
   * die `node:fs` benutzen darf —, nur auf die beiden Bestandteile angewendet: die drei Präfixe
   * aus der Parameterdeklaration und die Endungen aus den Template-Literalen. Ihr Kreuzprodukt
   * muss dieser Katalog sein. Wird ein Präfix oder eine Endung in `compose.ts` umbenannt, fällt
   * das hier auf.
   */
  const composeSource = source('../compose.ts');

  const prefixDeclaration = /rulePrefix: ((?:'[a-z-]+' \| )*'[a-z-]+'),/.exec(composeSource);
  const prefixes = [...(prefixDeclaration?.[1] ?? '').matchAll(/'([a-z-]+)'/g)]
    .map((match) => match[1] as string);
  const suffixes = [
    ...new Set(
      [...composeSource.matchAll(/rule: `\$\{rulePrefix\}(-[a-z-]+)`/g)]
        .map((match) => match[1] as string),
    ),
  ];

  it('liest drei Präfixe und zwei Endungen aus compose.ts', () => {
    expect(prefixes).toEqual(['designation', 'label', 'function-role-run']);
    expect(suffixes.sort()).toEqual(['-too-wide', '-unknown-glyph']);
  });

  it('führt genau das Kreuzprodukt aus Präfix und Endung', () => {
    const expected = prefixes.flatMap((prefix) => suffixes.map((suffix) => `${prefix}${suffix}`));
    expect(COMPOSITION_RULE_CATALOG.map((rule) => rule.id).sort()).toEqual(expected.sort());
  });

  it('markiert alle sechs als eigene Klasse und überschneidet sich nicht mit der Prüfphase', () => {
    const specIds = new Set(RULE_CATALOG.map((rule) => rule.id));
    for (const rule of COMPOSITION_RULE_CATALOG) {
      expect(rule.phase, rule.id).toBe('composition');
      expect(rule.reason, rule.id).not.toBeNull();
      expect(RULE_DIMENSIONS, rule.id).toContain(rule.dimension);
      expect(specIds.has(rule.id), rule.id).toBe(false);
    }
  });

  /**
   * Die Kennungen des Messgates aus `text-metrics.ts` sind ausdrücklich **keine** dritte Klasse
   * dieses Katalogs: `assertTextRunsFit` übersetzt drei davon in die sechs oben, die übrigen
   * erreichen nie ein `ValidationIssue.rule`.
   */
  it('nimmt die Kennungen des Messgates nicht auf', () => {
    const ids = new Set([
      ...RULE_CATALOG.map((rule) => rule.id),
      ...COMPOSITION_RULE_CATALOG.map((rule) => rule.id),
    ]);
    for (const id of ['text-too-wide', 'text-outside-box', 'unknown-glyph', 'text-too-tall']) {
      expect(ids.has(id), id).toBe(false);
    }
  });
});

describe('Lücken je Dimension', () => {
  it('kennt jede Dimension der Union aus einem Eintrag oder aus der Lückenliste', () => {
    const inEntries = new Set([
      ...RULE_CATALOG.map((rule) => rule.dimension),
      ...COMPOSITION_RULE_CATALOG.map((rule) => rule.dimension),
    ]);
    const inGaps = new Set(RULE_DIMENSION_GAPS.map((gap) => gap.dimension));
    const unaccounted = RULE_DIMENSIONS.filter((id) => !inEntries.has(id) && !inGaps.has(id));
    expect(unaccounted, 'weder Regel noch benannte Lücke').toEqual([]);
  });

  it('nennt jede Lücke mit Abdeckungsgrad, Abschnitt und Vermerk', () => {
    for (const gap of RULE_DIMENSION_GAPS) {
      expect(RULE_DIMENSIONS, gap.dimension).toContain(gap.dimension);
      expect(['none', 'partial'], gap.dimension).toContain(gap.coverage);
      expect(gap.chapter.trim(), gap.dimension).not.toBe('');
      expect(gap.note.trim().length, gap.dimension).toBeGreaterThan(40);
    }
    expect(RULE_DIMENSION_GAPS.map((gap) => gap.dimension))
      .toEqual([...new Set(RULE_DIMENSION_GAPS.map((gap) => gap.dimension))]);
  });

  /**
   * Festgenagelt, damit die Aussage „Lücken je Dimension benannt" zählbar bleibt und nicht
   * unbemerkt schrumpft, wenn jemand eine Dimension aus der Union nimmt.
   */
  it('zählt neun Lücken, davon sechs ohne jede Regel', () => {
    expect(RULE_DIMENSION_GAPS).toHaveLength(9);
    expect(RULE_DIMENSION_GAPS.filter((gap) => gap.coverage === 'none').map((g) => g.dimension))
      .toEqual(['capabilities', 'unit-grouping', 'state', 'tendency', 'movement', 'lines-and-boundaries']);
  });

  /**
   * Eine Dimension darf in beiden Listen stehen: `administrative-level` trägt eine Regel und ist
   * trotzdem nur zu drei von sechs Stufen belegt. Der Fall ist hier festgehalten, damit ihn
   * niemand als Widerspruch „aufräumt".
   */
  it('erlaubt eine Dimension mit Regel und Lücke zugleich', () => {
    expect(RULE_CATALOG.some((rule) => rule.dimension === 'administrative-level')).toBe(true);
    expect(RULE_DIMENSION_GAPS.some((gap) => gap.dimension === 'administrative-level')).toBe(true);
  });
});

describe('Einordnung fachlich gegen technisch', () => {
  /**
   * Der Befund, auf den LFH-563 hinausläuft: der Motor lehnt heute fast alles ab, weil eine
   * Messung fehlt — nicht, weil die Systematik es verbietet. Festgenagelt, weil sich genau diese
   * Zahl mit dem Grammatik-Umbau verschieben soll und die Verschiebung sichtbar sein muss.
   */
  it('nagelt die acht fachlichen Regeln fest', () => {
    expect(RULE_CATALOG.filter((rule) => rule.kind === 'systematik').map((r) => r.id)).toEqual([
      'body-variant-foot-conflict',
      'chassis-foot-conflict',
      'circle-12-requires-organization',
      'head-zone-conflict',
      'plain-wheel-pair-chassis-conflict',
      'strength-requires-unit',
      'surface-label-foot-conflict',
      'technical-fill-organization-conflict',
    ]);
    expect(RULE_CATALOG.filter((rule) => rule.kind === 'engine')).toHaveLength(64);
  });
});

describe('ruleCatalogEntry', () => {
  it('findet über beide Klassen', () => {
    expect(ruleCatalogEntry('strength-requires-unit')?.phase).toBe('spec');
    expect(ruleCatalogEntry('label-too-wide')?.phase).toBe('composition');
  });

  it('gibt bei unbekannter Kennung undefined zurück', () => {
    expect(ruleCatalogEntry('gibt-es-nicht')).toBeUndefined();
  });
});
