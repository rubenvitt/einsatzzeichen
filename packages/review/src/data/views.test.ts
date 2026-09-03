/**
 * Gates der abgeleiteten Sichten. Sie prüfen vor allem, dass keine Zeile beim Ableiten verloren
 * geht: die Bereichssummen müssen sich auf dieselben 558 addieren, aus denen sie stammen.
 */
import { describe, expect, it } from 'vitest';
import { carrierId } from '../contract.js';
import { PROFILE_AREA, SOURCE_AREA, buildRows } from './rows.js';
import { areaSummaries, neighboursOf, rowById, rowDetail, rowSummaries } from './views.js';

const rows = buildRows();

describe('rowSummaries', () => {
  it('bildet jede Zeile genau einmal ab', () => {
    const summaries = rowSummaries(rows);
    expect(summaries).toHaveLength(rows.length);
    expect(summaries.map((summary) => summary.id)).toEqual(rows.map((row) => row.id));
  });

  it('meldet für Quellen und Profil kein Bild', () => {
    const summaries = rowSummaries(rows);
    const withDrawing = summaries.filter((summary) => summary.hasDrawing);
    expect(withDrawing).toHaveLength(544);
    expect(
      summaries.filter((summary) => summary.kind !== 'manifest' && summary.hasDrawing),
    ).toEqual([]);
  });
});

describe('areaSummaries', () => {
  it('addiert sich auf 558', () => {
    const areas = areaSummaries(rows);
    const total = areas.reduce((sum, area) => sum + area.total, 0);
    expect(total).toBe(558);
    for (const area of areas) {
      expect(area.pending + area.approved + area.deviation).toBe(area.total);
    }
  });

  it('folgt der Zeilenreihenfolge und schließt mit Quellen und Profil', () => {
    const areas = areaSummaries(rows).map((area) => area.area);
    expect(areas.slice(-2)).toEqual([SOURCE_AREA, PROFILE_AREA]);
    expect(new Set(areas).size).toBe(areas.length);
  });

  it('zählt je Bereich dieselben Status wie die Zeilen selbst', () => {
    // Nachgezählt statt auf „alles offen" festgenagelt: die erste echte Freigabe soll die
    // Zählung ändern und diesen Test nicht rot machen.
    for (const area of areaSummaries(rows)) {
      const own = rows.filter((row) => row.area === area.area);
      expect(area.total, area.area).toBe(own.length);
      expect(area.pending, area.area).toBe(
        own.filter((row) => row.domain.status === 'pending').length,
      );
      expect(area.approved, area.area).toBe(
        own.filter((row) => row.domain.status === 'approved').length,
      );
      expect(area.deviation, area.area).toBe(
        own.filter((row) => row.domain.status === 'deviation').length,
      );
    }
  });
});

describe('neighboursOf', () => {
  it('nennt die Zeichen desselben Abschnittspräfixes ohne die Zeile selbst', () => {
    const id = carrierId('manifest', 'bbk-babz-2025:4.6.4#primary');
    const neighbours = neighboursOf(id, rows);
    expect(neighbours.length).toBeGreaterThan(0);
    expect(neighbours.map((neighbour) => neighbour.id)).not.toContain(id);
    for (const neighbour of neighbours) {
      expect(neighbour.label).toMatch(/^bbk-babz-2025:4\.6[.#]/);
    }
  });

  it('deckelt bei zwölf, damit der Vergleichsstreifen vergleichbar bleibt', () => {
    // `E.1` führt 37 Darstellungen.
    const neighbours = neighboursOf(carrierId('manifest', 'bbk-babz-2025:E.1.1#primary'), rows);
    expect(neighbours).toHaveLength(12);
  });

  it('gibt Quellen und Profil keine Nachbarn — sie sind keine Zeichen', () => {
    expect(neighboursOf(carrierId('source', 'phjardas-tz'), rows)).toEqual([]);
    expect(neighboursOf(carrierId('profile', 'bund'), rows)).toEqual([]);
  });
});

describe('rowDetail', () => {
  it('reicht Metadaten, Evidenz und Nachbarschaft einer Manifestzeile durch', () => {
    const detail = rowDetail(carrierId('manifest', 'bbk-babz-2025:1.1#primary'), rows, false);
    expect(detail.kind).toBe('manifest');
    expect(detail.section).toBe('1.1');
    expect(detail.area).toBe('1');
    expect(detail.coverage).toBe('catalog-entry');
    expect(detail.implementation).toBe('base.formation');
    expect(detail.referenceAsset).toBe('1.1_Taktische Formation.svg');
    expect(detail.referenceAvailable).toBe(false);
    expect(detail.evidence.map((chip) => chip.abbreviation)).toEqual(['FP', 'RS']);
    expect(detail.neighbours.length).toBeGreaterThan(0);
    expect(detail.prose).toBeUndefined();
    expect(detail.carrierContext).toBeUndefined();
  });

  it('übernimmt die Verfügbarkeit der Referenz vom Aufrufer, statt sie zu erraten', () => {
    const id = carrierId('manifest', 'bbk-babz-2025:1.1#primary');
    expect(rowDetail(id, rows, true).referenceAvailable).toBe(true);
    expect(rowDetail(id, rows, false).referenceAvailable).toBe(false);
  });

  it('weist ein Trägerzeichen als Kontext aus', () => {
    const detail = rowDetail(carrierId('manifest', 'bbk-babz-2025:2.1#primary'), rows, false);
    expect(detail.carrierContext?.host).toBe('formation');
    expect(detail.carrierContext?.explanation).toContain('nur Träger');
  });

  it('zeigt bei einer Quelle Prosa und keinen Abschnitt', () => {
    const detail = rowDetail(carrierId('source', 'phjardas-tz'), rows, false);
    expect(detail.section).toBe('');
    expect(detail.area).toBe(SOURCE_AREA);
    expect(detail.coverage).toBeUndefined();
    expect(detail.prose?.map((section) => section.heading)).toContain('Nutzungsgrundlage');
    expect(detail.neighbours).toEqual([]);
  });
});

describe('rowById', () => {
  it('findet eine bekannte Kennung', () => {
    expect(rowById(carrierId('profile', 'bund'), rows).title).toBe('Bundesweiter Kern');
  });

  it('wirft bei unbekannter Kennung, statt eine leere Ansicht zu liefern', () => {
    expect(() => rowById('manifest:gibt-es-nicht', rows)).toThrow(/gibt-es-nicht/);
    expect(() => rowDetail('profile:erfunden', rows, false)).toThrow(/erfunden/);
  });
});
