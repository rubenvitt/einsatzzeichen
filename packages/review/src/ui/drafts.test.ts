import { describe, expect, it } from 'vitest';
import type { DraftStorage } from './drafts';
import {
  DRAFT_PREFIX,
  draftFromReview,
  draftKey,
  dropDraft,
  isDirty,
  readDraft,
  todayIso,
  writeDraft,
} from './drafts';

function memoryStorage(initial: Record<string, string> = {}): DraftStorage & {
  entries: Map<string, string>;
} {
  const entries = new Map(Object.entries(initial));
  return {
    entries,
    getItem: (key) => entries.get(key) ?? null,
    setItem: (key, value) => {
      entries.set(key, value);
    },
    removeItem: (key) => {
      entries.delete(key);
    },
  };
}

const ID = 'manifest:bbk-babz-2025:4.6.4#primary';

describe('draftKey', () => {
  it('trägt die Trägerkennung ungekürzt — ein Schlüssel je Zeile', () => {
    expect(draftKey(ID)).toBe(`${DRAFT_PREFIX}${ID}`);
  });
});

describe('todayIso', () => {
  it('gibt das lokale Datum in ISO-Form aus', () => {
    expect(todayIso(new Date(2026, 8, 3, 23, 30))).toBe('2026-09-03');
    expect(todayIso(new Date(2026, 0, 1, 0, 5))).toBe('2026-01-01');
  });
});

describe('draftFromReview', () => {
  it('startet auf dem Ledgerstand', () => {
    expect(
      draftFromReview(
        { status: 'deviation', reviewer: 'rv', date: '2026-08-01', note: 'Befund' },
        { reviewer: 'anders', date: '2026-09-03' },
      ),
    ).toEqual({ status: 'deviation', reviewer: 'rv', date: '2026-08-01', note: 'Befund' });
  });

  it('belegt offene Zeilen mit Prüfer und heutigem Datum vor', () => {
    expect(draftFromReview({ status: 'pending' }, { reviewer: 'rv', date: '2026-09-03' })).toEqual({
      status: 'pending',
      reviewer: 'rv',
      date: '2026-09-03',
      note: '',
    });
  });
});

describe('readDraft und writeDraft', () => {
  it('überlebt den Umweg über den Speicher unverändert', () => {
    const storage = memoryStorage();
    const draft = { status: 'approved' as const, note: 'Befund', reviewer: 'rv', date: '2026-09-03' };
    expect(writeDraft(storage, ID, draft)).toBe(true);
    expect(readDraft(storage, ID)).toEqual(draft);
  });

  it('meldet nichts, wenn kein Entwurf da ist', () => {
    expect(readDraft(memoryStorage(), ID)).toBeUndefined();
  });

  it('verwirft kaputte Einträge, statt sie zu erraten', () => {
    expect(readDraft(memoryStorage({ [draftKey(ID)]: '{kein json' }), ID)).toBeUndefined();
    expect(readDraft(memoryStorage({ [draftKey(ID)]: '"text"' }), ID)).toBeUndefined();
    expect(
      readDraft(memoryStorage({ [draftKey(ID)]: '{"status":"erfunden"}' }), ID),
    ).toBeUndefined();
  });

  it('ergänzt fehlende Textfelder zu Leerstrings', () => {
    expect(readDraft(memoryStorage({ [draftKey(ID)]: '{"status":"pending"}' }), ID)).toEqual({
      status: 'pending',
      note: '',
      reviewer: '',
      date: '',
    });
  });

  it('meldet einen abgelehnten Schreibvorgang, statt ihn zu verschlucken', () => {
    const storage: DraftStorage = {
      getItem: () => null,
      setItem: () => {
        throw new Error('Kontingent erschöpft');
      },
      removeItem: () => undefined,
    };
    expect(
      writeDraft(storage, ID, { status: 'pending', note: '', reviewer: '', date: '' }),
    ).toBe(false);
  });

  it('räumt den Entwurf nach dem Speichern weg', () => {
    const storage = memoryStorage();
    writeDraft(storage, ID, { status: 'pending', note: 'x', reviewer: '', date: '' });
    dropDraft(storage, ID);
    expect(storage.entries.size).toBe(0);
  });
});

describe('isDirty', () => {
  it('erkennt jede Abweichung vom Ledgerstand', () => {
    const saved = { status: 'pending' as const };
    expect(isDirty({ status: 'pending', note: '', reviewer: '', date: '' }, saved)).toBe(false);
    expect(isDirty({ status: 'approved', note: '', reviewer: '', date: '' }, saved)).toBe(true);
    expect(isDirty({ status: 'pending', note: 'neu', reviewer: '', date: '' }, saved)).toBe(true);
  });

  it('wertet reine Randleerzeichen nicht als Änderung', () => {
    expect(
      isDirty({ status: 'approved', note: ' Befund ', reviewer: 'rv', date: '2026-09-03' }, {
        status: 'approved',
        note: 'Befund',
        reviewer: 'rv',
        date: '2026-09-03',
      }),
    ).toBe(false);
  });
});
