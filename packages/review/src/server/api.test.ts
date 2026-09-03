import { describe, expect, it, vi } from 'vitest';
import type { Drawing } from '@einsatzzeichen/schema';
import type { ReviewRow } from '../data/index.js';
import type {
  AppState,
  AreaSummary,
  CarrierId,
  ReviewValue,
  ReviewerRecord,
  RowDetail,
  RowSummary,
  SaveReviewResponse,
} from '../contract.js';
import {
  createApi,
  resolveRoute,
  type ApiOptions,
  type ApiResponse,
  type LedgerPort,
  type ReviewDataPort,
} from './api.js';
import type { ReferencePort } from './reference.js';

/**
 * Der Server wird hier ohne Zeilenmodul, ohne Ledger und ohne Dateisystem geprüft: alle drei
 * kommen als Abhängigkeit herein. Der Ledger-Schreiber ist ein Doppel — kein Test dieser Datei
 * darf `packages/catalog/src/domain-reviews.ts` anfassen.
 *
 * `ReviewRow` gehört dem Zeilenmodul. Der Server fasst davon nur drei Felder an (Zeichnung,
 * Referenzname, fachlicher Stand); die Testzeile trägt genau diese plus Kennung und Bereich und
 * wird an der Schnittstelle umgedeutet. Damit läuft diese Suite auch dann, wenn das Zeilenmodul
 * sich noch ändert.
 */
interface TestRow {
  id: CarrierId;
  area: string;
  domain: ReviewValue;
  drawing?: Drawing;
  referenceAsset?: string;
}

const asRows = (rows: readonly TestRow[]): readonly ReviewRow[] =>
  rows as unknown as readonly ReviewRow[];
const asTestRows = (rows: readonly ReviewRow[]): readonly TestRow[] =>
  rows as unknown as readonly TestRow[];

const DRAWING: Drawing = {
  viewBox: { width: 90, height: 90 },
  children: [],
  title: 'Taktische Formation',
};

const MANIFEST_ID: CarrierId = 'manifest:bbk-babz-2025:1.1#primary';
const SOURCE_ID: CarrierId = 'source:phjardas-tz';

function testRows(): TestRow[] {
  return [
    {
      id: MANIFEST_ID,
      area: 'Grundzeichen',
      domain: { status: 'pending' },
      drawing: DRAWING,
      referenceAsset: '1.1_Taktische Formation.svg',
    },
    {
      id: 'manifest:bbk-babz-2025:2.1#primary',
      area: 'Grundzeichen',
      domain: { status: 'approved', reviewer: 'mk', date: '2026-09-01', note: 'geprüft' },
      drawing: DRAWING,
    },
    // Quellenzeile: ohne Zeichnung und ohne Referenzdatei — beide Wege müssen sie abweisen.
    { id: SOURCE_ID, area: 'Quellen', domain: { status: 'pending' } },
  ];
}

function testData(): ReviewDataPort {
  const summary = (row: TestRow): RowSummary => ({
    id: row.id,
    kind: 'manifest',
    label: row.id,
    title: row.id,
    area: row.area,
    status: row.domain.status,
    hasDrawing: row.drawing !== undefined,
    questionCount: 0,
  });

  const find = (id: CarrierId, rows: readonly ReviewRow[]): TestRow => {
    const found = asTestRows(rows).find((row) => row.id === id);
    if (found === undefined) throw new Error(`Unbekannte Trägerkennung: "${id}".`);
    return found;
  };

  return {
    rowSummaries: (rows) => asTestRows(rows).map(summary),
    areaSummaries: (rows) => {
      const areas = new Map<string, AreaSummary>();
      for (const row of asTestRows(rows)) {
        const current = areas.get(row.area) ?? {
          area: row.area,
          total: 0,
          pending: 0,
          approved: 0,
          deviation: 0,
        };
        areas.set(row.area, {
          ...current,
          total: current.total + 1,
          pending: current.pending + (row.domain.status === 'pending' ? 1 : 0),
          approved: current.approved + (row.domain.status === 'approved' ? 1 : 0),
          deviation: current.deviation + (row.domain.status === 'deviation' ? 1 : 0),
        });
      }
      return [...areas.values()];
    },
    rowDetail: (id, rows, referenceAvailable): RowDetail => {
      const row = find(id, rows);
      return {
        id: row.id,
        kind: 'manifest',
        label: row.id,
        title: row.id,
        area: row.area,
        section: '1.1',
        referenceAsset: row.referenceAsset,
        referenceAvailable,
        evidence: [],
        domain: row.domain,
        questions: [],
        neighbours: [],
      };
    },
    rowById: (id, rows) => find(id, rows) as unknown as ReviewRow,
  };
}

interface Harness {
  api: ReturnType<typeof createApi>;
  ledger: { writeDomainReview: ReturnType<typeof vi.fn>; addReviewer: ReturnType<typeof vi.fn> };
  reference: { has: ReturnType<typeof vi.fn>; read: ReturnType<typeof vi.fn> };
}

function harness(overrides: Partial<ApiOptions> = {}): Harness {
  const ledger = { writeDomainReview: vi.fn(), addReviewer: vi.fn() };
  const reference = {
    has: vi.fn().mockReturnValue(true),
    read: vi.fn().mockReturnValue({ ok: true, svg: '<svg data-referenz="ja"></svg>' }),
  };
  const api = createApi({
    repositoryRoot: '/pfad/zum/repo',
    rows: asRows(testRows()),
    reviewers: [{ id: 'mk', name: 'M. Kessler', qualification: 'Zugführerin' }],
    themes: [
      { id: 'reference', label: 'Referenz' },
      { id: 'accessible-light', label: 'Barrierearm hell' },
    ],
    baseline: 'bbk-babz-2025',
    coreVersion: '2026.09',
    referenceRootAvailable: true,
    data: testData(),
    ledger: ledger as unknown as LedgerPort,
    reference: reference as unknown as ReferencePort,
    today: () => '2026-09-03',
    ...overrides,
  });
  return { api, ledger, reference };
}

function get(api: Harness['api'], path: string, query = ''): ApiResponse {
  return api.handle({ method: 'GET', path, query: new URLSearchParams(query) });
}

function post(api: Harness['api'], path: string, body: unknown): ApiResponse {
  return api.handle({ method: 'POST', path, body: JSON.stringify(body) });
}

function errorOf(response: ApiResponse): string {
  if (response.kind !== 'json') throw new Error('Erwartet wurde eine JSON-Antwort.');
  return (response.body as { error: string }).error;
}

describe('resolveRoute', () => {
  it('löst den prozentkodierten Manifestschlüssel zurück — mit Doppelpunkt und Raute', () => {
    // So kodiert `encodeURIComponent` die Kennung; unkodiert beendete die Raute den Pfad.
    const route = resolveRoute('/api/row/manifest%3Abbk-babz-2025%3A1.1%23primary');
    expect(route).toEqual({ name: 'row', id: 'manifest:bbk-babz-2025:1.1#primary' });
  });

  it('erkennt alle sechs Endpunkte', () => {
    expect(resolveRoute('/api/state')).toEqual({ name: 'state' });
    expect(resolveRoute('/api/review')).toEqual({ name: 'review' });
    expect(resolveRoute('/api/reviewer')).toEqual({ name: 'reviewer' });
    expect(resolveRoute('/api/render/source%3Aphjardas-tz')).toEqual({
      name: 'render',
      id: 'source:phjardas-tz',
    });
    expect(resolveRoute('/api/reference/profile%3Abund')).toEqual({
      name: 'reference',
      id: 'profile:bund',
    });
  });

  it('zerschneidet eine Kennung mit kodiertem Schrägstrich nicht', () => {
    expect(resolveRoute('/api/row/manifest%3Aa%2Fb')).toEqual({ name: 'row', id: 'manifest:a/b' });
  });

  it('weist Nicht-API-Pfade und Unbekanntes ab, statt sie zu raten', () => {
    expect(resolveRoute('/index.html').name).toBe('unknown');
    expect(resolveRoute('/api/row').name).toBe('unknown');
    expect(resolveRoute('/api/row/a/b').name).toBe('unknown');
    expect(resolveRoute('/api/unbekannt').name).toBe('unknown');
    // Kaputte Prozentkodierung wirft nicht, sie wird abgewiesen.
    expect(resolveRoute('/api/row/%zz').name).toBe('unknown');
  });
});

describe('GET /api/state', () => {
  it('liefert Kennzahlen, Reviewer, Themes und den Bereichsstand', () => {
    const { api } = harness();
    const response = get(api, '/api/state');
    expect(response.status).toBe(200);
    const state = (response as { body: AppState }).body;
    expect(state.baseline).toBe('bbk-babz-2025');
    expect(state.coreVersion).toBe('2026.09');
    expect(state.referenceRootAvailable).toBe(true);
    expect(state.reviewers.map((reviewer) => reviewer.id)).toEqual(['mk']);
    expect(state.themes.map((theme) => theme.id)).toEqual(['reference', 'accessible-light']);
    expect(state.rows).toHaveLength(3);
    expect(state.areas).toEqual([
      { area: 'Grundzeichen', total: 2, pending: 1, approved: 1, deviation: 0 },
      { area: 'Quellen', total: 1, pending: 1, approved: 0, deviation: 0 },
    ]);
  });

  it('antwortet auf ein falsches Verb mit 405 statt es zu übergehen', () => {
    const { api } = harness();
    expect(post(api, '/api/state', {}).status).toBe(405);
  });
});

describe('GET /api/row/:id', () => {
  it('findet die Zeile über die kodierte Kennung und meldet die Referenzlage', () => {
    const { api, reference } = harness();
    const response = get(api, `/api/row/${encodeURIComponent(MANIFEST_ID)}`);
    expect(response.status).toBe(200);
    const detail = (response as { body: RowDetail }).body;
    expect(detail.id).toBe(MANIFEST_ID);
    expect(detail.referenceAvailable).toBe(true);
    expect(reference.has).toHaveBeenCalledWith('1.1_Taktische Formation.svg');
  });

  it('meldet eine unbekannte Kennung als 404', () => {
    const { api } = harness();
    const response = get(api, '/api/row/manifest%3Agibt-es-nicht');
    expect(response.status).toBe(404);
    expect(errorOf(response)).toContain('manifest:gibt-es-nicht');
  });
});

describe('GET /api/render/:id', () => {
  it('rendert mit Vorgabewerten und eindeutigem ID-Präfix', () => {
    const { api } = harness();
    const response = get(api, `/api/render/${encodeURIComponent(MANIFEST_ID)}`);
    expect(response.status).toBe(200);
    expect(response.kind).toBe('svg');
    expect(response.body as string).toContain('width="256"');
  });

  it('vergibt je Zeile, Theme und Grösse ein anderes ID-Präfix', () => {
    // Ohne Eindeutigkeit kollidierten `…-title`/`…-desc`, sobald Navigator, Nachbarschaftsstreifen
    // und Hauptansicht mehrere Zeichen zugleich im Dokument halten.
    const { api } = harness();
    const titleId = (id: CarrierId, query: string): string => {
      const svg = get(api, `/api/render/${encodeURIComponent(id)}`, query).body as string;
      const match = /<title id="([^"]+)"/u.exec(svg);
      expect(match).not.toBeNull();
      return match?.[1] ?? '';
    };
    const prefixes = new Set([
      titleId(MANIFEST_ID, 'theme=reference&size=64'),
      titleId(MANIFEST_ID, 'theme=reference&size=128'),
      titleId(MANIFEST_ID, 'theme=accessible-light&size=64'),
      titleId('manifest:bbk-babz-2025:2.1#primary', 'theme=reference&size=64'),
    ]);
    expect(prefixes.size).toBe(4);
    // Eine XML-ID beginnt mit einem Buchstaben und trägt keinen Doppelpunkt aus der Kennung.
    for (const prefix of prefixes) expect(prefix).toMatch(/^ez-[a-z0-9-]+-title$/u);
  });

  it('weist ein unbekanntes Theme mit 400 ab, statt still auf die Referenz zurückzufallen', () => {
    const { api } = harness();
    const response = get(api, `/api/render/${encodeURIComponent(MANIFEST_ID)}`, 'theme=dunkel');
    expect(response.status).toBe(400);
    expect(errorOf(response)).toContain('dunkel');
  });

  it('lässt nur die Gate-Stufen und die Vorschaugrösse zu', () => {
    const { api } = harness();
    const encoded = encodeURIComponent(MANIFEST_ID);
    for (const size of [16, 24, 32, 64, 128, 256, 512]) {
      expect(get(api, `/api/render/${encoded}`, `size=${size}`).status).toBe(200);
    }
    for (const size of ['48', '0', '1024', '-16', '64.0', 'gross', '']) {
      const response = get(api, `/api/render/${encoded}`, `size=${size}`);
      expect(response.status, `Grösse "${size}"`).toBe(size === '' ? 200 : 400);
    }
  });

  it('antwortet für eine Zeile ohne Zeichnung mit 404', () => {
    const { api } = harness();
    const response = get(api, `/api/render/${encodeURIComponent(SOURCE_ID)}`);
    expect(response.status).toBe(404);
    expect(errorOf(response)).toContain('keine Zeichnung');
  });
});

describe('GET /api/reference/:id', () => {
  it('liest ausschliesslich den Namen aus der Zeile, nie einen aus der Anfrage', () => {
    const { api, reference } = harness();
    const response = get(api, `/api/reference/${encodeURIComponent(MANIFEST_ID)}`);
    expect(response.status).toBe(200);
    expect(reference.read).toHaveBeenCalledExactlyOnceWith('1.1_Taktische Formation.svg');
  });

  it('weist eine Zeile ohne verzeichnete Referenzdatei ab', () => {
    const { api, reference } = harness();
    const response = get(api, `/api/reference/${encodeURIComponent(SOURCE_ID)}`);
    expect(response.status).toBe(404);
    expect(reference.read).not.toHaveBeenCalled();
  });

  it('reicht die Absage der Referenzauflösung samt Statuscode durch', () => {
    const { api, reference } = harness();
    reference.read.mockReturnValue({ ok: false, status: 403, error: 'zeigt hinaus' });
    const response = get(api, `/api/reference/${encodeURIComponent(MANIFEST_ID)}`);
    expect(response.status).toBe(403);
    expect(errorOf(response)).toBe('zeigt hinaus');
  });
});

describe('POST /api/review', () => {
  it('weist eine Freigabe ohne Notiz ab und schreibt nicht', () => {
    const { api, ledger } = harness();
    const response = post(api, '/api/review', {
      id: MANIFEST_ID,
      status: 'approved',
      reviewer: 'mk',
    });
    expect(response.status).toBe(400);
    expect(errorOf(response)).toContain('Notiz');
    expect(ledger.writeDomainReview).not.toHaveBeenCalled();
  });

  it('weist eine Abweichung ohne Begründung ab und schreibt nicht', () => {
    const { api, ledger } = harness();
    const response = post(api, '/api/review', {
      id: MANIFEST_ID,
      status: 'deviation',
      reviewer: 'mk',
    });
    expect(response.status).toBe(400);
    expect(ledger.writeDomainReview).not.toHaveBeenCalled();
  });

  it('weist ein unbrauchbares Datum ab und schreibt nicht', () => {
    // Ein *fehlendes* Datum ist etwas anderes: es wird mit dem heutigen ergänzt (siehe unten).
    // Abgewiesen wird, was mitgeliefert wird und kein ISO-Datum ist — geraten wird daran nichts.
    const { api, ledger } = harness();
    const response = post(api, '/api/review', {
      id: MANIFEST_ID,
      status: 'approved',
      reviewer: 'mk',
      note: 'Form und Farbe geprüft.',
      date: '3. September 2026',
    });
    expect(response.status).toBe(400);
    expect(errorOf(response)).toContain('ISO-Datum');
    expect(ledger.writeDomainReview).not.toHaveBeenCalled();
  });

  it('weist einen nicht registrierten Prüfer ab und schreibt nicht', () => {
    const { api, ledger } = harness();
    const response = post(api, '/api/review', {
      id: MANIFEST_ID,
      status: 'approved',
      reviewer: 'unbekannt',
      note: 'Form und Farbe geprüft.',
    });
    expect(response.status).toBe(400);
    expect(errorOf(response)).toContain('Reviewer-Register');
    expect(ledger.writeDomainReview).not.toHaveBeenCalled();
  });

  it('weist eine unbekannte Trägerkennung und ein unbekanntes Präfix ab', () => {
    const { api, ledger } = harness();
    expect(post(api, '/api/review', { id: 'unfug:1', status: 'pending' }).status).toBe(400);
    expect(post(api, '/api/review', { id: 'manifest:x', status: 'pending' }).status).toBe(404);
    expect(post(api, '/api/review', { id: MANIFEST_ID, status: 'freigegeben' }).status).toBe(400);
    expect(post(api, '/api/review', { status: 'pending' }).status).toBe(400);
    expect(api.handle({ method: 'POST', path: '/api/review', body: 'kein json' }).status).toBe(400);
    expect(ledger.writeDomainReview).not.toHaveBeenCalled();
  });

  it('schreibt eine vollständige Freigabe, ergänzt das heutige Datum und hält den Stand nach', () => {
    const { api, ledger } = harness();
    const response = post(api, '/api/review', {
      id: MANIFEST_ID,
      status: 'approved',
      reviewer: 'mk',
      note: '  Form und Farbe entsprechen der Vorlage.  ',
    });
    expect(response.status).toBe(200);
    const saved = (response as { body: SaveReviewResponse }).body;
    // In den Ledger geht der **Name**: `isRegisteredReviewer` aus `catalog` vergleicht darüber,
    // und daran misst das Coverage-Gate später jede nicht offene Zeile. Die Oberfläche darf
    // trotzdem die Kennung schicken.
    const expected: ReviewValue = {
      status: 'approved',
      reviewer: 'M. Kessler',
      date: '2026-09-03',
      note: 'Form und Farbe entsprechen der Vorlage.',
    };
    expect(saved.domain).toEqual(expected);
    expect(ledger.writeDomainReview).toHaveBeenCalledExactlyOnceWith(
      '/pfad/zum/repo',
      { kind: 'manifest', key: 'bbk-babz-2025:1.1#primary' },
      expected,
    );

    // Der Katalog im Speicher ist eingefroren; ohne eigene Nachhaltung stünde die Zeile hier
    // weiter auf „offen" — in der Antwort wie in jedem späteren /api/state.
    expect(saved.areas).toContainEqual({
      area: 'Grundzeichen',
      total: 2,
      pending: 0,
      approved: 2,
      deviation: 0,
    });
    const state = (get(api, '/api/state') as { body: AppState }).body;
    expect(state.rows.find((row) => row.id === MANIFEST_ID)?.status).toBe('approved');
    const detail = (get(api, `/api/row/${encodeURIComponent(MANIFEST_ID)}`) as { body: RowDetail })
      .body;
    expect(detail.domain).toEqual(expected);
  });

  it('nimmt den Prüfer auch unter seinem Namen an und schreibt ihn unverändert', () => {
    const { api, ledger } = harness();
    const response = post(api, '/api/review', {
      id: MANIFEST_ID,
      status: 'deviation',
      reviewer: 'M. Kessler',
      note: 'Kopfzone weicht von der Vorlage ab.',
    });
    expect(response.status).toBe(200);
    expect(ledger.writeDomainReview.mock.calls[0]?.[2]).toMatchObject({ reviewer: 'M. Kessler' });
  });

  it('lässt ein Zurücksetzen auf offen ohne Prüfer und ohne Datum zu', () => {
    // `pending` beansprucht keine Prüfung — es bekommt deshalb auch kein Datum untergeschoben.
    const { api, ledger } = harness();
    const response = post(api, '/api/review', { id: MANIFEST_ID, status: 'pending' });
    expect(response.status).toBe(200);
    expect(ledger.writeDomainReview).toHaveBeenCalledExactlyOnceWith(
      '/pfad/zum/repo',
      { kind: 'manifest', key: 'bbk-babz-2025:1.1#primary' },
      { status: 'pending' },
    );
  });

  it('meldet einen gescheiterten Ledger-Schreibvorgang, statt Erfolg zu behaupten', () => {
    const { api, ledger } = harness();
    ledger.writeDomainReview.mockImplementation(() => {
      throw new Error('Schlüssel nicht gefunden.');
    });
    const response = post(api, '/api/review', {
      id: MANIFEST_ID,
      status: 'approved',
      reviewer: 'mk',
      note: 'geprüft',
    });
    expect(response.status).toBe(500);
    const state = (get(api, '/api/state') as { body: AppState }).body;
    expect(state.rows.find((row) => row.id === MANIFEST_ID)?.status).toBe('pending');
  });
});

describe('POST /api/reviewer', () => {
  it('legt einen Eintrag an und gibt die aktualisierte Liste zurück', () => {
    const { api, ledger } = harness();
    const record: ReviewerRecord = {
      id: 'rv',
      name: 'R. Vitt',
      qualification: 'Verbandsführer',
    };
    const response = post(api, '/api/reviewer', record);
    expect(response.status).toBe(201);
    expect((response as { body: readonly ReviewerRecord[] }).body).toEqual([
      { id: 'mk', name: 'M. Kessler', qualification: 'Zugführerin' },
      record,
    ]);
    expect(ledger.addReviewer).toHaveBeenCalledExactlyOnceWith('/pfad/zum/repo', record);
  });

  it('lässt den frisch angelegten Prüfer sofort freigeben — ohne Neustart', () => {
    const { api, ledger } = harness();
    post(api, '/api/reviewer', { id: 'rv', name: 'R. Vitt', qualification: 'Verbandsführer' });
    const response = post(api, '/api/review', {
      id: MANIFEST_ID,
      status: 'approved',
      reviewer: 'rv',
      note: 'geprüft',
    });
    expect(response.status).toBe(200);
    expect(ledger.writeDomainReview).toHaveBeenCalledOnce();
  });

  it('weist unvollständige, doppelte und unzulässig benannte Einträge ab', () => {
    const { api, ledger } = harness();
    expect(post(api, '/api/reviewer', { id: 'rv', name: 'R. Vitt' }).status).toBe(400);
    expect(
      post(api, '/api/reviewer', { id: 'mk', name: 'M. K.', qualification: 'Zugführerin' }).status,
    ).toBe(400);
    expect(
      post(api, '/api/reviewer', { id: 'R Vitt', name: 'R. Vitt', qualification: 'VF' }).status,
    ).toBe(400);
    expect(ledger.addReviewer).not.toHaveBeenCalled();
  });
});
