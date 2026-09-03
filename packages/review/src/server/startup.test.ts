import { describe, expect, it } from 'vitest';
import { RENDER_THEMES } from '@einsatzzeichen/catalog';
import {
  DEFAULT_HOST,
  DEFAULT_PORT,
  hostForUrl,
  isLoopbackHost,
  resolveHost,
  resolvePort,
  startupSummary,
  themeOptions,
} from './startup.js';

describe('resolvePort', () => {
  it('nimmt ohne REVIEW_PORT den festen Port', () => {
    expect(resolvePort(undefined)).toBe(DEFAULT_PORT);
    expect(resolvePort('')).toBe(DEFAULT_PORT);
    expect(resolvePort('4400')).toBe(4400);
  });

  it('bricht bei einem unbrauchbaren Wert ab, statt still auf 4319 zu fallen', () => {
    for (const raw of ['null', '0', '-1', '70000', '4319.5', 'acht']) {
      expect(() => resolvePort(raw), `REVIEW_PORT="${raw}"`).toThrow(/REVIEW_PORT/u);
    }
  });
});

describe('resolveHost', () => {
  it('bleibt ohne REVIEW_HOST auf der Rückschleife', () => {
    expect(resolveHost(undefined)).toBe(DEFAULT_HOST);
    expect(resolveHost('')).toBe(DEFAULT_HOST);
  });

  it('übernimmt eine angegebene Adresse und schneidet Leerraum ab', () => {
    expect(resolveHost('100.100.33.33')).toBe('100.100.33.33');
    expect(resolveHost('  100.100.33.33  ')).toBe('100.100.33.33');
  });

  // Kein stiller Rückfall auf die Rückschleife: das Werkzeug liefe sonst lokal, während der
  // Aufrufer es im Netz erwartet und den Fehler auf der Gegenseite sucht.
  it('bricht bei einer unbrauchbaren Angabe ab', () => {
    for (const raw of ['   ', '10.0.0.1 10.0.0.2', 'host name']) {
      expect(() => resolveHost(raw), `REVIEW_HOST="${raw}"`).toThrow(/REVIEW_HOST/u);
    }
  });
});

describe('isLoopbackHost', () => {
  it('trennt die Rückschleife von jeder erreichbaren Adresse', () => {
    for (const host of ['127.0.0.1', 'localhost', '::1']) {
      expect(isLoopbackHost(host), host).toBe(true);
    }
    for (const host of ['100.100.33.33', '0.0.0.0', '65.21.238.190', '::']) {
      expect(isLoopbackHost(host), host).toBe(false);
    }
  });
});

describe('hostForUrl', () => {
  it('klammert IPv6-Adressen, damit die URL gültig bleibt', () => {
    expect(hostForUrl('127.0.0.1')).toBe('127.0.0.1');
    expect(hostForUrl('fd7a:115c:a1e0::1601:30a2')).toBe('[fd7a:115c:a1e0::1601:30a2]');
  });
});

describe('themeOptions', () => {
  it('beschriftet jedes Render-Theme des Katalogs auf Deutsch', () => {
    const options = themeOptions();
    expect(options.map((option) => option.id)).toEqual(Object.keys(RENDER_THEMES));
    for (const option of options) expect(option.label).not.toBe(option.id);
  });
});

describe('startupSummary', () => {
  it('nennt Adresse, offene Zeilen und die fehlende Referenzlage', () => {
    const summary = startupSummary({
      url: 'http://127.0.0.1:4319/',
      host: '127.0.0.1',
      pending: 558,
      total: 558,
      referenceAvailable: false,
      reviewers: [{ id: 'mk', name: 'M. Kessler', qualification: 'Zugführerin' }],
    });
    expect(summary).toContain('http://127.0.0.1:4319/');
    expect(summary).toContain('558 von 558');
    expect(summary).toContain('fehlt');
    expect(summary).not.toContain('Reviewer-Register ist leer');
  });

  it('weist auf das leere Reviewer-Register hin, weil sonst jede Freigabe scheitert', () => {
    const summary = startupSummary({
      url: 'http://127.0.0.1:4319/',
      host: '127.0.0.1',
      pending: 558,
      total: 558,
      referenceAvailable: true,
      reviewers: [],
    });
    expect(summary).toContain('Reviewer-Register ist leer');
  });

  // Die Bindung an eine erreichbare Adresse ist eine bewusste Angabe, aber der Preis muss
  // dastehen: ohne Anmeldung kann jeder, der sie erreicht, in den Ledger schreiben.
  it('warnt, sobald nicht mehr an die Rückschleife gebunden ist', () => {
    const summary = startupSummary({
      url: 'http://100.100.33.33:4319/',
      host: '100.100.33.33',
      pending: 558,
      total: 558,
      referenceAvailable: false,
      reviewers: [{ id: 'mk', name: 'M. Kessler', qualification: 'Zugführerin' }],
    });
    expect(summary).toContain('100.100.33.33');
    expect(summary).toContain('ohne Anmeldung');
  });

  it('schweigt zur Erreichbarkeit, solange die Rückschleife gebunden ist', () => {
    const summary = startupSummary({
      url: 'http://127.0.0.1:4319/',
      host: '127.0.0.1',
      pending: 558,
      total: 558,
      referenceAvailable: false,
      reviewers: [{ id: 'mk', name: 'M. Kessler', qualification: 'Zugführerin' }],
    });
    expect(summary).not.toContain('ohne Anmeldung');
  });
});
