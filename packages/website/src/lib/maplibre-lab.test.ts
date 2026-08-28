import { describe, expect, it } from 'vitest';
import { DEFAULT_VIEWBOX_MM, type Drawing } from '@einsatzzeichen/schema';
import {
  basemapStyle,
  classifyMapError,
  clampSize,
  errorUrl,
  filterSymbols,
  labFeatureCollection,
  labPoints,
  labSymbols,
  LAB_CENTER,
  mapErrorMessage,
  markerIdPrefix,
  NEUTRAL_STYLE,
  OPENFREEMAP_STYLE_URL,
  SIZE_MAX,
  SIZE_MIN,
  symbolImageId,
  type LabSymbol,
} from './maplibre-lab.js';

const drawing: Drawing = { viewBox: DEFAULT_VIEWBOX_MM, children: [] };

function symbol(id: string, title: string, chapter = 'Anhang E.1'): LabSymbol {
  return { id, slug: id.replace(/\./gu, '-'), title, chapter, drawing };
}

describe('basemapStyle', () => {
  it('liefert für OpenFreeMap die Stil-URL ohne Schlüssel', () => {
    expect(basemapStyle('openfreemap')).toBe(OPENFREEMAP_STYLE_URL);
    expect(OPENFREEMAP_STYLE_URL).not.toMatch(/key|token|apikey/iu);
  });

  it('liefert ohne Grundlage einen Stil ganz ohne Quellen', () => {
    const style = basemapStyle('none');
    expect(style).toEqual(NEUTRAL_STYLE);
    expect(Object.keys(NEUTRAL_STYLE.sources)).toHaveLength(0);
    expect(NEUTRAL_STYLE.layers[0].type).toBe('background');
  });
});

describe('clampSize', () => {
  it('hält die Größe im Bereich und auf ganzen Schritten', () => {
    expect(clampSize(10)).toBe(SIZE_MIN);
    expect(clampSize(1000)).toBe(SIZE_MAX);
    expect(clampSize(63)).toBe(64);
    expect(clampSize(Number.NaN)).toBe(SIZE_MIN);
  });
});

describe('symbolImageId', () => {
  it('ist bei gleicher Eingabe gleich', () => {
    const key = { symbolId: 'base.formation', size: 64, pixelRatio: 2, themeId: 'reference' };
    expect(symbolImageId(key)).toBe(symbolImageId({ ...key }));
  });

  it('unterscheidet sich in jeder rasterbestimmenden Größe', () => {
    const key = { symbolId: 'base.formation', size: 64, pixelRatio: 2, themeId: 'reference' };
    const ids = new Set([
      symbolImageId(key),
      symbolImageId({ ...key, symbolId: 'base.einheit' }),
      symbolImageId({ ...key, size: 32 }),
      symbolImageId({ ...key, pixelRatio: 1 }),
      symbolImageId({ ...key, themeId: 'print-monochrome' }),
    ]);
    expect(ids.size).toBe(5);
  });
});

describe('markerIdPrefix', () => {
  it('erzeugt je Punkt einen eigenen Präfix ohne Sonderzeichen', () => {
    const first = markerIdPrefix('base.formation', 'p1');
    const second = markerIdPrefix('base.formation', 'p2');
    expect(first).not.toBe(second);
    expect(first).toMatch(/^[a-z0-9-]+$/u);
  });
});

describe('labPoints und labFeatureCollection', () => {
  it('legt fünf verschiedene Punkte um die Mitte', () => {
    const points = labPoints();
    expect(points).toHaveLength(5);
    expect(points[0].lngLat).toEqual([LAB_CENTER[0], LAB_CENTER[1]]);
    expect(new Set(points.map((point) => point.lngLat.join(','))).size).toBe(5);
    expect(new Set(points.map((point) => point.id)).size).toBe(5);
  });

  it('setzt die Punkte relativ zu einer übergebenen Mitte', () => {
    const points = labPoints([0, 0]);
    expect(points[0].lngLat).toEqual([0, 0]);
    expect(points[1].lngLat[0]).toBeCloseTo(0.026, 6);
  });

  it('erzeugt GeoJSON mit Punktgeometrie und Beschriftung je Merkmal', () => {
    const collection = labFeatureCollection(labPoints());
    expect(collection.type).toBe('FeatureCollection');
    expect(collection.features).toHaveLength(5);
    for (const feature of collection.features) {
      expect(feature.geometry.type).toBe('Point');
      expect(feature.geometry.coordinates).toHaveLength(2);
      expect(feature.properties.label).toMatch(/^Beispielpunkt \d$/u);
    }
  });
});

describe('labSymbols', () => {
  it('behält nur die Felder, die die Karte zeichnet', () => {
    const reduced = labSymbols([
      { ...symbol('base.formation', 'Taktische Formation'), extra: 'weg' } as LabSymbol,
    ]);
    expect(Object.keys(reduced[0]).sort()).toEqual(['chapter', 'drawing', 'id', 'slug', 'title']);
  });
});

describe('filterSymbols', () => {
  const symbols = [
    symbol('base.formation', 'Taktische Formation', 'Kapitel 1'),
    symbol('unit.feuerwehr', 'Löschzug', 'Anhang E.1'),
  ];

  it('zeigt ohne Eingabe alles', () => {
    expect(filterSymbols(symbols, '   ')).toHaveLength(2);
  });

  it('findet über Titel, ID und Kapitel, unabhängig von Groß- und Kleinschreibung', () => {
    expect(filterSymbols(symbols, 'löschzug').map((entry) => entry.id)).toEqual([
      'unit.feuerwehr',
    ]);
    expect(filterSymbols(symbols, 'BASE.')).toHaveLength(1);
    expect(filterSymbols(symbols, 'Anhang E')).toHaveLength(1);
    expect(filterSymbols(symbols, 'gibt es nicht')).toHaveLength(0);
  });
});

describe('classifyMapError', () => {
  it('hält die Karte nur für unbrauchbar, wenn das Stildokument selbst fehlt', () => {
    expect(
      classifyMapError({ url: OPENFREEMAP_STYLE_URL, styleLoaded: false, basemap: 'openfreemap' }),
    ).toBe('fatal');
  });

  it('behandelt Kacheln, Sprite und Glyphen als Notiz — auch vor dem Laden des Stils', () => {
    for (const url of [
      'https://tiles.openfreemap.org/planet/20250101/14/8/5.pbf',
      `${OPENFREEMAP_STYLE_URL}/sprite.png`.replace('/styles/positron', '/sprites/ofm'),
      'https://tiles.openfreemap.org/fonts/noto_sans_regular/0-255.pbf',
    ]) {
      expect(classifyMapError({ url, styleLoaded: false, basemap: 'openfreemap' })).toBe('note');
    }
  });

  it('entscheidet ohne URL danach, ob der Stil schon steht', () => {
    expect(classifyMapError({ styleLoaded: false, basemap: 'openfreemap' })).toBe('fatal');
    expect(classifyMapError({ styleLoaded: true, basemap: 'openfreemap' })).toBe('note');
  });

  it('kennt ohne Grundlage kein Stildokument, das fehlen könnte', () => {
    expect(
      classifyMapError({ url: OPENFREEMAP_STYLE_URL, styleLoaded: true, basemap: 'none' }),
    ).toBe('note');
  });
});

describe('errorUrl', () => {
  it('liest die URL aus einem AJAXError-artigen Wert und sonst nichts', () => {
    const ajaxLike = Object.assign(new Error('HTTP 404'), { url: 'https://example.invalid/a.pbf' });
    expect(errorUrl(ajaxLike)).toBe('https://example.invalid/a.pbf');
    expect(errorUrl(new Error('ohne URL'))).toBeUndefined();
    expect(errorUrl('Zeichenkette')).toBeUndefined();
    expect(errorUrl(null)).toBeUndefined();
  });
});

describe('mapErrorMessage', () => {
  it('nennt bei jedem Grund die Ursache im Klartext', () => {
    expect(mapErrorMessage('import', new Error('Netzwerkfehler'))).toContain('maplibre-gl');
    expect(mapErrorMessage('import', new Error('Netzwerkfehler'))).toContain(
      'Grund: Netzwerkfehler',
    );
    expect(mapErrorMessage('create', new Error('WebGL context lost'))).toContain('WebGL');
    expect(mapErrorMessage('style', 'HTTP 503')).toContain(OPENFREEMAP_STYLE_URL);
    expect(mapErrorMessage('style', 'HTTP 503')).toContain('Grund: HTTP 503');
  });

  it('bleibt ohne verwertbaren Grund bei der reinen Meldung', () => {
    expect(mapErrorMessage('create', new Error(''))).not.toContain('Grund:');
  });
});
