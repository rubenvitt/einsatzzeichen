import { describe, expect, it } from 'vitest';
import type { ReviewStatus } from '@einsatzzeichen/schema';
import type { AreaSummary, RowSummary } from '../contract';
import {
  DEFAULT_FILTER,
  filterRows,
  groupRowsByArea,
  matchesSearch,
  nextPendingRow,
  overallProgress,
  stepRow,
} from './rows';

function row(id: string, status: ReviewStatus, overrides: Partial<RowSummary> = {}): RowSummary {
  return {
    id: `manifest:${id}`,
    kind: 'manifest',
    label: id,
    title: `Titel ${id}`,
    area: 'Kapitel 4',
    status,
    hasDrawing: true,
    questionCount: 0,
    ...overrides,
  };
}

const ROWS: readonly RowSummary[] = [
  row('4.1#primary', 'pending'),
  row('4.2#primary', 'approved'),
  row('4.3#primary', 'pending'),
  row('4.4#primary', 'deviation'),
  row('4.5#primary', 'pending'),
];

describe('matchesSearch', () => {
  it('findet über Schlüssel und Titel, ohne Rücksicht auf Groß- und Kleinschreibung', () => {
    expect(matchesSearch(row('4.1#primary', 'pending'), '4.1')).toBe(true);
    expect(matchesSearch(row('4.1#primary', 'pending'), 'TITEL 4.1')).toBe(true);
    expect(matchesSearch(row('4.1#primary', 'pending'), 'Kapitel 9')).toBe(false);
  });

  it('findet über die Implementierung, sobald sie aus einem Detailsatz vorliegt', () => {
    const target = row('4.1#primary', 'pending');
    const index = new Map([[target.id, 'pictogram.brand']]);
    expect(matchesSearch(target, 'brand')).toBe(false);
    expect(matchesSearch(target, 'brand', index)).toBe(true);
  });

  it('lässt bei leerer Suche alles durch', () => {
    expect(matchesSearch(row('4.1#primary', 'pending'), '   ')).toBe(true);
  });
});

describe('filterRows', () => {
  it('zeigt standardmäßig nur offene Zeilen', () => {
    expect(filterRows(ROWS, DEFAULT_FILTER).map((entry) => entry.label)).toEqual([
      '4.1#primary',
      '4.3#primary',
      '4.5#primary',
    ]);
  });

  it('kombiniert Suche und Offenfilter', () => {
    const result = filterRows(ROWS, { search: '4.3', pendingOnly: true });
    expect(result.map((entry) => entry.label)).toEqual(['4.3#primary']);
  });

  it('hält die geöffnete Zeile sichtbar, auch wenn sie gerade freigegeben wurde', () => {
    const decided = ROWS.map((entry) =>
      entry.label === '4.1#primary' ? { ...entry, status: 'approved' as const } : entry,
    );
    const result = filterRows(decided, DEFAULT_FILTER, { keepId: 'manifest:4.1#primary' });
    expect(result.map((entry) => entry.label)).toEqual([
      '4.1#primary',
      '4.3#primary',
      '4.5#primary',
    ]);
  });
});

describe('groupRowsByArea', () => {
  it('gruppiert und erhält die Eingabereihenfolge je Bereich', () => {
    const mixed = [
      row('a', 'pending', { area: 'Kapitel 4' }),
      row('b', 'pending', { area: 'Anhang E' }),
      row('c', 'pending', { area: 'Kapitel 4' }),
    ];
    const grouped = groupRowsByArea(mixed);
    expect([...grouped.keys()]).toEqual(['Kapitel 4', 'Anhang E']);
    expect(grouped.get('Kapitel 4')?.map((entry) => entry.label)).toEqual(['a', 'c']);
  });
});

describe('stepRow', () => {
  it('blättert vorwärts und rückwärts', () => {
    expect(stepRow(ROWS, 'manifest:4.2#primary', 1)).toBe('manifest:4.3#primary');
    expect(stepRow(ROWS, 'manifest:4.2#primary', -1)).toBe('manifest:4.1#primary');
  });

  it('bleibt an den Enden stehen statt umzulaufen', () => {
    expect(stepRow(ROWS, 'manifest:4.5#primary', 1)).toBe('manifest:4.5#primary');
    expect(stepRow(ROWS, 'manifest:4.1#primary', -1)).toBe('manifest:4.1#primary');
  });

  it('greift ohne Auswahl an das passende Ende', () => {
    expect(stepRow(ROWS, undefined, 1)).toBe('manifest:4.1#primary');
    expect(stepRow(ROWS, undefined, -1)).toBe('manifest:4.5#primary');
    expect(stepRow([], undefined, 1)).toBeUndefined();
  });
});

describe('nextPendingRow', () => {
  it('springt zur nächsten offenen Zeile', () => {
    expect(nextPendingRow(ROWS, 'manifest:4.1#primary')).toBe('manifest:4.3#primary');
  });

  it('läuft am Listenende um', () => {
    expect(nextPendingRow(ROWS, 'manifest:4.5#primary')).toBe('manifest:4.1#primary');
  });

  it('überspringt die aktuelle Zeile, auch wenn sie noch offen ist', () => {
    const only = [row('4.1#primary', 'pending'), row('4.2#primary', 'approved')];
    expect(nextPendingRow(only, 'manifest:4.1#primary')).toBeUndefined();
  });

  it('meldet nichts, wenn keine offene Zeile mehr da ist', () => {
    const done = ROWS.map((entry) => ({ ...entry, status: 'approved' as const }));
    expect(nextPendingRow(done, 'manifest:4.1#primary')).toBeUndefined();
    expect(nextPendingRow([], undefined)).toBeUndefined();
  });

  it('startet ohne Auswahl am Anfang', () => {
    expect(nextPendingRow(ROWS, undefined)).toBe('manifest:4.1#primary');
  });
});

describe('overallProgress', () => {
  it('zählt freigegeben und abweichend gemeinsam als entschieden', () => {
    const areas: AreaSummary[] = [
      { area: 'Kapitel 4', total: 92, pending: 90, approved: 1, deviation: 1 },
      { area: 'Anhang E', total: 68, pending: 68, approved: 0, deviation: 0 },
    ];
    expect(overallProgress(areas)).toEqual({
      total: 160,
      pending: 158,
      approved: 1,
      deviation: 1,
      decided: 2,
    });
  });

  it('kommt mit einem leeren Zustand aus', () => {
    expect(overallProgress([]).total).toBe(0);
  });
});
