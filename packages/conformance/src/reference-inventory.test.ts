import { describe, expect, it } from 'vitest';
import { COVERAGE_MANIFEST } from './coverage-manifest.js';
import { referenceInventoryAssets } from './fingerprint-index.js';
import {
  INVENTORY_EXCLUSIONS,
  SECTIONS_WITHOUT_SIGN,
  claimedReferenceAssets,
  inventoryOf,
  isSectionInScope,
  referenceInventory,
  sectionOfAsset,
  type InventoryExclusion,
} from './reference-inventory.js';

function exclusion(overrides: Partial<InventoryExclusion> = {}): InventoryExclusion {
  return {
    asset: '5.8.1_Beispiel 1.svg',
    disposition: 'example',
    reason: 'Beispielanwendung.',
    decidedIn: 'docs/decisions/2026-08-07-kapitel-5-8-zustaende-d2.md',
    ...overrides,
  };
}

describe('sectionOfAsset', () => {
  it('liest die Abschnittsnummer bis zum ersten Unterstrich', () => {
    expect(sectionOfAsset('5.4.2_Staffel.svg')).toBe('5.4.2');
    expect(sectionOfAsset('C.1.1_Löschstaffel.svg')).toBe('C.1.1');
  });

  it('behandelt das Übersichtsblatt ohne Punkt und den doppelten Unterstrich', () => {
    // `J_Bedienungszeichen.svg` hat keinen Punkt: der Abschnitt ist der ganze Anhangsbuchstabe.
    expect(sectionOfAsset('J_Bedienungszeichen.svg')).toBe('J');
    // Der zweite Unterstrich gehört zum Namen, nicht zur Nummer.
    expect(sectionOfAsset('2.14_Escape Route_2.svg')).toBe('2.14');
    // Der Quellbestand trägt hier einen abschließenden Punkt; die Manifestzeile zu `D.1.6.` heißt
    // `D.1.6`, deshalb wird er abgeschnitten.
    expect(sectionOfAsset('J.2.3._Beispiel Telefon.svg')).toBe('J.2.3');
    expect(sectionOfAsset('D.1.6._Unterabschnittsleitung im Einsatz.svg')).toBe('D.1.6');
  });

  it('gibt bei einem Namen ohne Unterstrich den Namen ohne .svg-Endung zurück', () => {
    expect(sectionOfAsset('Unbekannt.svg')).toBe('Unbekannt');
    expect(sectionOfAsset('K.3.svg')).toBe('K.3');
  });
});

describe('isSectionInScope', () => {
  it('vergleicht wie uncoveredScope: Gleichheit oder Präfix mit Punkt', () => {
    const scope = ['2', '5.1.1', 'J.2'];
    expect(isSectionInScope('2.14', scope)).toBe(true);
    expect(isSectionInScope('5.1.1.4', scope)).toBe(true);
    expect(isSectionInScope('5.1.2.1', scope)).toBe(false);
    expect(isSectionInScope('J.2.3', scope)).toBe(true);
    expect(isSectionInScope('J', scope)).toBe(false);
    // Kein Präfix ohne Punktgrenze: `5.1.1` deckt `5.1.10` nicht.
    expect(isSectionInScope('5.1.10', ['5.1.1'])).toBe(false);
  });
});

describe('inventoryOf (Fixtures)', () => {
  const scope = ['1', '5.8'];
  const manifestSections = ['1.1', '5.8.7'];

  it('ordnet jede Datei genau einer Disposition zu', () => {
    const result = inventoryOf(
      ['1.1_Formation.svg', '5.8.7_Schnee.svg', '5.8.1_Beispiel 1.svg', '3.1_Fremd.svg'],
      ['1.1_Formation.svg', '5.8.7_Schnee.svg'],
      [exclusion()],
      scope,
      manifestSections,
    );
    expect(result.total).toBe(4);
    expect(result.claimed).toBe(2);
    expect(result.outOfScope).toBe(1);
    expect(result.excludedByDisposition).toEqual({ example: 1, 'overview-sheet': 0, deferred: 0 });
    expect(result.unaccounted).toEqual([]);
    expect(result.staleExclusions).toEqual([]);
    expect(result.sectionsWithoutEntry).toEqual([]);
  });

  it('meldet eine Datei im Umfang, die weder beansprucht noch ausgeschlossen ist', () => {
    const result = inventoryOf(['1.1_Formation.svg', '1.2_Person.svg'], ['1.1_Formation.svg'], [], scope, manifestSections);
    expect(result.unaccounted).toEqual(['1.2_Person.svg']);
    expect(result.sectionsWithoutEntry).toEqual(['1.2']);
  });

  it('meldet einen Ausschluss ohne Datei im Inventar und einen für eine beanspruchte Datei', () => {
    const result = inventoryOf(
      ['1.1_Formation.svg'],
      ['1.1_Formation.svg'],
      [exclusion({ asset: 'gibt-es-nicht.svg' }), exclusion({ asset: '1.1_Formation.svg' })],
      scope,
      manifestSections,
    );
    expect(result.staleExclusions).toEqual(['gibt-es-nicht.svg', '1.1_Formation.svg']);
    // Der beanspruchte Ausschluss zählt als beansprucht, nicht doppelt.
    expect(result.claimed).toBe(1);
    expect(result.excludedByDisposition.example).toBe(0);
  });

  it('lässt einen Ausschluss auch außerhalb des Umfangs gelten und zählt ihn nicht als out-of-scope', () => {
    const result = inventoryOf(
      ['J_Bedienungszeichen.svg'],
      [],
      [exclusion({ asset: 'J_Bedienungszeichen.svg', disposition: 'overview-sheet' })],
      scope,
      manifestSections,
    );
    expect(result.outOfScope).toBe(0);
    expect(result.excludedByDisposition['overview-sheet']).toBe(1);
  });

  it('meldet einen Abschnitt ohne Manifestzeile nur für nicht ausgeschlossene Dateien im Umfang', () => {
    const result = inventoryOf(
      ['5.8.1_Beispiel 1.svg', '5.8.2_Regen.svg'],
      ['5.8.2_Regen.svg'],
      [exclusion()],
      scope,
      ['5.8.7'],
    );
    // 5.8.2 ist beansprucht (über ein Element), hat aber keine Manifestzeile: das ist eine Lücke.
    // 5.8.1 ist ausgeschlossen und zählt nicht.
    expect(result.sectionsWithoutEntry).toEqual(['5.8.2']);
  });
});

describe('INVENTORY_EXCLUSIONS', () => {
  it('nennt jede Datei nur einmal und führt Begründung und Entscheidungsnotiz', () => {
    const assets = INVENTORY_EXCLUSIONS.map((exclusion) => exclusion.asset);
    expect(new Set(assets).size).toBe(assets.length);
    for (const exclusion of INVENTORY_EXCLUSIONS) {
      expect(exclusion.reason.trim()).not.toBe('');
      expect(exclusion.decidedIn).toMatch(/^docs\/decisions\/[0-9a-z-]+\.md$/);
    }
  });

  it('enthält genau die drei entschiedenen Gruppen: 1 Übersichtsblatt, 9 Beispiele, 18 zurückgestellt', () => {
    const by = (d: InventoryExclusion['disposition']) =>
      INVENTORY_EXCLUSIONS.filter((e) => e.disposition === d).map((e) => e.asset).sort();
    expect(by('overview-sheet')).toEqual(['J_Bedienungszeichen.svg']);
    expect(by('example')).toEqual([
      '5.8.1_Beispiel 1.svg',
      '5.8.1_Beispiel 2.svg',
      '5.8.1_Beispiel 3.svg',
      '5.8.7_Beispiel_Schneiend_extrem.svg',
      '5.8.7_Beispiel_Schneiend_mittel.svg',
      '5.8.7_Beispiel_Schneiend_schwach.svg',
      '5.8.7_Beispiel_Schneiend_stark.svg',
      'J.2.3._Beispiel Telefon.svg',
      'J.2.3._Beispiel Wählbetrieb.svg',
    ]);
    expect(by('deferred')).toHaveLength(18);
  });
});

describe('SECTIONS_WITHOUT_SIGN', () => {
  it('führt J.2.3 als Abschnitt ohne Zeicheneintrag, und keine nicht ausgeschlossene Datei widerspricht', () => {
    expect(SECTIONS_WITHOUT_SIGN).toEqual(['J.2.3']);
    const excluded = new Set(INVENTORY_EXCLUSIONS.map((exclusion) => exclusion.asset));
    for (const section of SECTIONS_WITHOUT_SIGN) {
      expect(isSectionInScope(section, COVERAGE_MANIFEST.scope)).toBe(true);
      const files = referenceInventoryAssets().filter((asset) => sectionOfAsset(asset) === section);
      // Es gibt Dateien zum Abschnitt — aber nur die ausgeschlossenen Beispiele.
      expect(files.length).toBeGreaterThan(0);
      expect(files.filter((asset) => !excluded.has(asset))).toEqual([]);
      expect(COVERAGE_MANIFEST.entries.some((entry) => entry.sourceId.endsWith(`:${section}`))).toBe(false);
    }
  });
});

describe('referenceInventory (echter Bestand)', () => {
  it('rechnet das Inventar restlos auf: 661 = 550 beansprucht + 83 außerhalb + 28 ausgeschlossen', () => {
    // Die Zahlen sind absichtlich hart: das Inventar ist ein Generat aus `pnpm cli audit:reference`
    // und ändert sich nur, wenn der Referenzbestand sich ändert; die Beanspruchung wächst mit
    // jedem Slice. Wer eine Zahl hier anpassen muss, hat entweder eine Datei neu beansprucht
    // (dann sinkt „außerhalb" oder „ausgeschlossen") oder eine neue Datei in den Bestand
    // aufgenommen (dann muss sie beansprucht oder ausgeschlossen werden, sonst meldet das Gate
    // `unaccounted-reference`).
    const result = referenceInventory();
    expect(result.total).toBe(661);
    expect(referenceInventoryAssets()).toHaveLength(661);
    expect(result.claimed).toBe(550);
    expect(result.outOfScope).toBe(83);
    expect(result.excludedByDisposition).toEqual({ example: 9, 'overview-sheet': 1, deferred: 18 });
    expect(result.unaccounted).toEqual([]);
    expect(result.staleExclusions).toEqual([]);
    expect(result.sectionsWithoutEntry).toEqual([]);
    expect(
      result.claimed +
        result.outOfScope +
        result.excludedByDisposition.example +
        result.excludedByDisposition['overview-sheet'] +
        result.excludedByDisposition.deferred +
        result.unaccounted.length,
    ).toBe(result.total);
  });

  it('beansprucht aus drei Quellen, und jede beanspruchte Datei liegt im Inventar', () => {
    const claimed = claimedReferenceAssets();
    const inventory = new Set(referenceInventoryAssets());
    expect(claimed.size).toBe(550);
    for (const asset of claimed) expect(inventory.has(asset)).toBe(true);
    // Jeder Manifest-Eintrag beansprucht seine Datei; die übrigen Quellen sind Rezepte und
    // Elemente mit mehreren Belegen (Stärkegrade, Fahrwerke).
    for (const entry of COVERAGE_MANIFEST.entries) expect(claimed.has(entry.referenceAsset)).toBe(true);
  });
});
