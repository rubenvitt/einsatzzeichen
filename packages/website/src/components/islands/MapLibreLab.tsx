import { useEffect, useMemo, useRef, useState } from 'react';
import type { Map as MapLibreMap, Marker as MapLibreMarker } from 'maplibre-gl';
import { renderSvg, type RenderTheme } from '@einsatzzeichen/core';
import { Einsatzzeichen } from '@einsatzzeichen/react';
import { addSymbolImage } from '@einsatzzeichen/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import {
  basemapStyle,
  clampSize,
  errorDetail,
  filterSymbols,
  labFeatureCollection,
  labPoints,
  mapErrorMessage,
  markerIdPrefix,
  symbolImageId,
  LAB_CENTER,
  OPENFREEMAP_ATTRIBUTION,
  OPENFREEMAP_STYLE_URL,
  PIXEL_RATIOS,
  SIZE_MAX,
  SIZE_MIN,
  SIZE_STEP,
  ZOOM_LEVELS,
  type BasemapId,
  type LabMode,
  type LabSymbol,
  type PixelRatio,
} from '../../lib/maplibre-lab.js';

/**
 * MapLibre Lab (Spec §5.4): dasselbe Zeichen zweimal auf derselben Karte — als SVG im DOM
 * (`Marker`) und als gerastertes Bild im Kartenstil (`symbol`-Ebene über `addSymbolImage`).
 *
 * Die Insel bekommt Zeichen und Farbprofile als Props: der Katalog bleibt in Node (Spec §5.2),
 * und der Snapshot mit allen Spec-, Review- und Quellenfeldern muss nicht in den Browser. Die
 * Kartenbibliothek wird erst im Effekt geladen (`await import`), damit sie nicht im ersten
 * Seitenpaket steckt.
 */

const SOURCE_ID = 'ez-lab-points';
const LAYER_ID = 'ez-lab-symbols';
const INITIAL_ZOOM = 12;

export interface LabThemeOption {
  id: string;
  label: string;
  theme: RenderTheme;
}

export interface MapLibreLabProps {
  symbols: LabSymbol[];
  themes: LabThemeOption[];
  /** `none` zeichnet nur eine Hintergrundfläche — keine Kachelanfrage, kein fremder Dienst. */
  basemap?: BasemapId;
}

/** Nicht tödliche Kartenmeldung (einzelne Kacheln) — die Karte bleibt bedienbar. */
interface TileNote {
  text: string;
}

export default function MapLibreLab({
  symbols,
  themes,
  basemap = 'openfreemap',
}: MapLibreLabProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const glRef = useRef<typeof import('maplibre-gl') | null>(null);
  const markersRef = useRef<MapLibreMarker[]>([]);
  const styleLoadedRef = useRef(false);

  const [query, setQuery] = useState('');
  const [symbolId, setSymbolId] = useState(symbols[0]?.id ?? '');
  const [size, setSize] = useState(64);
  const [pixelRatio, setPixelRatio] = useState<PixelRatio>(2);
  const [themeId, setThemeId] = useState(themes[0]?.id ?? 'reference');
  const [mode, setMode] = useState<LabMode>('marker');

  const [styleReady, setStyleReady] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const [tileNote, setTileNote] = useState<TileNote | null>(null);
  const [drawError, setDrawError] = useState<string | null>(null);

  const points = useMemo(() => labPoints(LAB_CENTER), []);
  const matches = useMemo(() => filterSymbols(symbols, query), [symbols, query]);
  const symbol = useMemo(
    () => symbols.find((entry) => entry.id === symbolId) ?? symbols[0],
    [symbols, symbolId],
  );
  // Das gewählte Zeichen bleibt in der Liste, auch wenn die Suche es ausschließt — sonst stünde
  // im Feld nichts, während die Karte weiter dieses Zeichen zeigt.
  const options = useMemo(
    () =>
      symbol !== undefined && !matches.some((entry) => entry.id === symbol.id)
        ? [symbol, ...matches]
        : matches,
    [matches, symbol],
  );
  const themeOption = useMemo(
    () => themes.find((entry) => entry.id === themeId) ?? themes[0],
    [themes, themeId],
  );
  const theme = themeOption?.theme;

  // Karte anlegen. Läuft einmal je Grundlage; alles Weitere passiert über Effekt zwei.
  useEffect(() => {
    let cancelled = false;
    const container = containerRef.current;
    if (container === null) return;

    void (async () => {
      let gl: typeof import('maplibre-gl');
      try {
        gl = await import('maplibre-gl');
      } catch (error) {
        if (!cancelled) setMapError(mapErrorMessage('import', error));
        return;
      }
      if (cancelled) return;

      let map: MapLibreMap;
      try {
        map = new gl.Map({
          container,
          style: basemapStyle(basemap),
          center: [LAB_CENTER[0], LAB_CENTER[1]],
          zoom: INITIAL_ZOOM,
          attributionControl: { compact: false },
        });
      } catch (error) {
        if (!cancelled) setMapError(mapErrorMessage('create', error));
        return;
      }
      if (cancelled) {
        map.remove();
        return;
      }

      glRef.current = gl;
      mapRef.current = map;

      map.on('load', () => {
        styleLoadedRef.current = true;
        if (!cancelled) setStyleReady(true);
      });

      // `error` feuert auch für eine einzelne fehlende Kachel. Nur was vor dem Laden des Stils
      // schiefgeht, macht die Karte unbrauchbar; alles danach ist eine Notiz, kein Abbruch
      // (Spec §7 verlangt einen Grund, nicht ein Banner über allem).
      map.on('error', (event: { error?: unknown }) => {
        if (cancelled) return;
        if (styleLoadedRef.current) {
          setTileNote({
            text:
              'Einzelne Kacheln wurden nicht geladen — die Karte bleibt bedienbar, ' +
              `der Untergrund kann lückenhaft sein. Grund: ${errorDetail(event.error)}`,
          });
          return;
        }
        setMapError(mapErrorMessage('style', event.error));
      });
    })();

    return () => {
      cancelled = true;
      for (const marker of markersRef.current) marker.remove();
      markersRef.current = [];
      styleLoadedRef.current = false;
      setStyleReady(false);
      mapRef.current?.remove();
      mapRef.current = null;
      glRef.current = null;
    };
  }, [basemap]);

  // Zeichen auf die Karte bringen. Marker und Symbolebene schließen sich aus: was der andere
  // Modus angelegt hat, wird zuerst abgeräumt.
  useEffect(() => {
    const map = mapRef.current;
    const gl = glRef.current;
    if (!styleReady || map === null || gl === null || symbol === undefined || theme === undefined) {
      return;
    }

    for (const marker of markersRef.current) marker.remove();
    markersRef.current = [];

    try {
      if (mode === 'marker') {
        if (map.getLayer(LAYER_ID) !== undefined) map.removeLayer(LAYER_ID);
        for (const point of points) {
          const element = document.createElement('div');
          element.className = 'ez-lab__marker';
          element.title = `${symbol.title} · ${point.label}`;
          // `innerHTML` mit Markup aus `renderSvg` — der Renderer erzeugt es selbst aus der
          // Zeichnung des Katalogs und maskiert Text (`escapeXml`); es kommt keine Eingabe von
          // außen hinein.
          element.innerHTML = renderSvg(symbol.drawing, {
            size,
            theme,
            idPrefix: markerIdPrefix(symbol.id, point.id),
          });
          markersRef.current.push(
            new gl.Marker({ element }).setLngLat(point.lngLat).addTo(map),
          );
        }
      } else {
        const imageId = symbolImageId({ symbolId: symbol.id, size, pixelRatio, themeId });
        // `addSymbolImage` überschreibt eine belegte ID bewusst nicht; einmal gerasterte Bilder
        // bleiben im Stil und werden bei derselben Einstellung wiederverwendet.
        if (!map.hasImage(imageId)) {
          addSymbolImage(map, imageId, symbol.drawing, { size, pixelRatio, theme });
        }
        if (map.getSource(SOURCE_ID) === undefined) {
          map.addSource(SOURCE_ID, { type: 'geojson', data: labFeatureCollection(points) });
        }
        if (map.getLayer(LAYER_ID) === undefined) {
          map.addLayer({
            id: LAYER_ID,
            type: 'symbol',
            source: SOURCE_ID,
            layout: {
              'icon-image': imageId,
              // Ohne das blendet MapLibre überlappende Zeichen aus; bei Zoom 8 stünden die fünf
              // Punkte übereinander und die Karte sähe leer aus.
              'icon-overlap': 'always',
            },
          });
        } else {
          map.setLayoutProperty(LAYER_ID, 'icon-image', imageId);
        }
      }
      setDrawError(null);
    } catch (error) {
      setDrawError(errorDetail(error));
    }
  }, [styleReady, mode, symbol, theme, themeId, size, pixelRatio, points]);

  function zoomTo(zoom: number): void {
    mapRef.current?.easeTo({ zoom, center: [LAB_CENTER[0], LAB_CENTER[1]] });
  }

  const mapUnavailable = mapError !== null;

  return (
    <section className="ez-lab" aria-label="MapLibre Lab">
      <style>{LAB_CSS}</style>

      <div className="ez-lab__controls">
        <div className="ez-lab__field ez-lab__field--wide">
          <label htmlFor="ez-lab-query">Zeichen suchen</label>
          <input
            id="ez-lab-query"
            type="search"
            value={query}
            placeholder="Titel, ID oder Kapitel"
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>

        <div className="ez-lab__field ez-lab__field--wide">
          <label htmlFor="ez-lab-symbol">Zeichen ({matches.length} von {symbols.length})</label>
          <select
            id="ez-lab-symbol"
            value={symbol?.id ?? ''}
            onChange={(event) => setSymbolId(event.target.value)}
          >
            {options.map((entry) => (
              <option key={entry.id} value={entry.id}>
                {entry.title} — {entry.chapter}
              </option>
            ))}
          </select>
        </div>

        <div className="ez-lab__field">
          <label htmlFor="ez-lab-size">Größe: {size} px</label>
          <input
            id="ez-lab-size"
            type="range"
            min={SIZE_MIN}
            max={SIZE_MAX}
            step={SIZE_STEP}
            value={size}
            onChange={(event) => setSize(clampSize(Number(event.target.value)))}
          />
        </div>

        <div className="ez-lab__field">
          <label htmlFor="ez-lab-ratio">Pixel Ratio</label>
          <select
            id="ez-lab-ratio"
            value={pixelRatio}
            onChange={(event) => setPixelRatio(Number(event.target.value) as PixelRatio)}
          >
            {PIXEL_RATIOS.map((ratio) => (
              <option key={ratio} value={ratio}>
                {ratio}×
              </option>
            ))}
          </select>
        </div>

        <div className="ez-lab__field">
          <label htmlFor="ez-lab-theme">Farbprofil</label>
          <select
            id="ez-lab-theme"
            value={themeOption?.id ?? ''}
            onChange={(event) => setThemeId(event.target.value)}
          >
            {themes.map((entry) => (
              <option key={entry.id} value={entry.id}>
                {entry.label}
              </option>
            ))}
          </select>
        </div>

        <fieldset className="ez-lab__field ez-lab__modes">
          <legend>Darstellung</legend>
          <label>
            <input
              type="radio"
              name="ez-lab-mode"
              value="marker"
              checked={mode === 'marker'}
              onChange={() => setMode('marker')}
            />
            Marker (SVG im DOM)
          </label>
          <label>
            <input
              type="radio"
              name="ez-lab-mode"
              value="symbol-layer"
              checked={mode === 'symbol-layer'}
              onChange={() => setMode('symbol-layer')}
            />
            Symbol Layer (Bild im Stil)
          </label>
        </fieldset>

        <div className="ez-lab__field ez-lab__zooms">
          <span id="ez-lab-zoom-label">Zoom</span>
          <div role="group" aria-labelledby="ez-lab-zoom-label">
            {ZOOM_LEVELS.map((zoom) => (
              <button
                key={zoom}
                type="button"
                onClick={() => zoomTo(zoom)}
                disabled={!styleReady}
              >
                {zoom}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="ez-lab__stage">
        <div className="ez-lab__map-slot">
          {/* Der Container bleibt im DOM, auch wenn die Karte scheitert: die Meldung legt sich
              darüber, statt den Container zu entfernen — sonst könnte MapLibre nicht mehr
              aufräumen. */}
          <div
            ref={containerRef}
            className={mapUnavailable ? 'ez-lab__map ez-lab__map--hidden' : 'ez-lab__map'}
          />
          {mapUnavailable ? (
            <div className="ez-lab__map-error" role="alert">
              <strong>Die Karte wird nicht angezeigt.</strong>
              <p>{mapError}</p>
              <p>
                Die Vorschau rechts zeichnet dasselbe Zeichen ohne Karte — sie hängt weder an
                MapLibre noch an einer Kachelquelle.
              </p>
            </div>
          ) : null}
          {!mapUnavailable && !styleReady ? (
            <p className="ez-lab__map-hint" role="status">
              Karte wird geladen …
            </p>
          ) : null}
        </div>

        <aside className="ez-lab__side">
          <h3>Vorschau ohne Karte</h3>
          <div className="ez-lab__preview" style={{ background: theme?.surface ?? '#ffffff' }}>
            {symbol !== undefined && theme !== undefined ? (
              <Einsatzzeichen
                drawing={symbol.drawing}
                size={Math.min(size, 128)}
                theme={theme}
                idPrefix="ez-lab-preview"
              />
            ) : null}
          </div>
          {symbol !== undefined ? (
            <dl className="ez-lab__meta">
              <dt>Zeichen</dt>
              <dd>{symbol.title}</dd>
              <dt>ID</dt>
              <dd>
                <code>{symbol.id}</code>
              </dd>
              <dt>Fundstelle</dt>
              <dd>{symbol.chapter}</dd>
              <dt>Bild-ID im Stil</dt>
              <dd>
                <code>
                  {symbolImageId({ symbolId: symbol.id, size, pixelRatio, themeId })}
                </code>
              </dd>
            </dl>
          ) : null}
          <p className="ez-lab__note">
            Marker und Symbolebene sollen gleich groß erscheinen: das Raster wird mit{' '}
            <code>size × pixelRatio</code> gezeichnet, und MapLibre rechnet über{' '}
            <code>pixelRatio</code> auf dieselbe CSS-Größe zurück. Weicht die Größe zwischen den
            Modi ab, stimmt die Rechnung nicht.
          </p>
        </aside>
      </div>

      {drawError !== null ? (
        <p className="ez-lab__error" role="alert">
          Das Zeichen ließ sich nicht auf die Karte bringen. Grund: {drawError}
        </p>
      ) : null}

      {tileNote !== null && !mapUnavailable ? (
        <p className="ez-lab__warn" role="status">
          {tileNote.text}
        </p>
      ) : null}

      <p className="ez-lab__source">
        {basemap === 'openfreemap' ? (
          <>
            Untergrund: <code>{OPENFREEMAP_STYLE_URL}</code> — {OPENFREEMAP_ATTRIBUTION}.
          </>
        ) : (
          <>Ohne Untergrund: die Karte zeigt nur eine Hintergrundfläche, es wird nichts geladen.</>
        )}
      </p>
    </section>
  );
}

/**
 * Die Insel bringt ihre Gestaltung selbst mit, damit sie in einer Seite ohne eigenes Stylesheet
 * vollständig ist. Farben kommen aus Starlights Variablen; die Zeichen behalten ihre eigenen.
 */
const LAB_CSS = `
.ez-lab { display: grid; gap: 1rem; margin-block: 1.5rem; }
.ez-lab__controls {
  display: grid; gap: 0.75rem 1rem; align-items: end;
  grid-template-columns: repeat(auto-fit, minmax(11rem, 1fr));
  padding: 0.9rem; border: 1px solid var(--sl-color-gray-5); border-radius: 0.5rem;
  background: var(--sl-color-gray-7, transparent);
}
.ez-lab__field { display: grid; gap: 0.3rem; font-size: 0.875rem; }
.ez-lab__field--wide { grid-column: span 2; }
.ez-lab__field label, .ez-lab__field legend, .ez-lab__zooms span { font-weight: 600; }
.ez-lab__field input[type='search'], .ez-lab__field select {
  width: 100%; padding: 0.35rem 0.45rem; font: inherit; font-size: 0.875rem;
  border: 1px solid var(--sl-color-gray-5); border-radius: 0.25rem;
  background: var(--sl-color-black); color: var(--sl-color-white);
}
.ez-lab__modes { border: 0; padding: 0; margin: 0; }
.ez-lab__modes label { display: flex; gap: 0.4rem; align-items: center; font-weight: 400; }
.ez-lab__zooms div { display: flex; gap: 0.35rem; }
.ez-lab__zooms button {
  padding: 0.3rem 0.7rem; font: inherit; cursor: pointer;
  border: 1px solid var(--sl-color-gray-5); border-radius: 0.25rem;
  background: var(--sl-color-gray-6, transparent); color: inherit;
}
.ez-lab__zooms button[disabled] { opacity: 0.5; cursor: not-allowed; }
.ez-lab__stage { display: grid; gap: 1rem; grid-template-columns: minmax(0, 2fr) minmax(14rem, 1fr); }
@media (max-width: 50rem) { .ez-lab__stage { grid-template-columns: minmax(0, 1fr); } }
.ez-lab__map-slot { position: relative; min-height: 26rem; }
.ez-lab__map { position: absolute; inset: 0; border-radius: 0.5rem; overflow: hidden; }
.ez-lab__map--hidden { visibility: hidden; }
.ez-lab__map-error, .ez-lab__map-hint {
  position: absolute; inset: 0; display: grid; align-content: center; gap: 0.5rem;
  padding: 1.5rem; border: 1px dashed var(--sl-color-gray-4); border-radius: 0.5rem;
  background: var(--sl-color-gray-6, #eef); text-align: left;
}
.ez-lab__map-error p, .ez-lab__map-hint { margin: 0; font-size: 0.9rem; }
.ez-lab__marker { line-height: 0; cursor: default; }
.ez-lab__side { display: grid; gap: 0.75rem; align-content: start; }
.ez-lab__side h3 { margin: 0; font-size: 1rem; }
.ez-lab__preview {
  display: grid; place-items: center; min-height: 9rem; padding: 1rem;
  border: 1px solid var(--sl-color-gray-5); border-radius: 0.5rem;
}
.ez-lab__meta { display: grid; grid-template-columns: auto 1fr; gap: 0.15rem 0.6rem; margin: 0; font-size: 0.8125rem; }
.ez-lab__meta dt { font-weight: 600; }
.ez-lab__meta dd { margin: 0; overflow-wrap: anywhere; }
.ez-lab__note, .ez-lab__source { margin: 0; font-size: 0.8125rem; color: var(--sl-color-gray-3); }
.ez-lab__error, .ez-lab__warn {
  margin: 0; padding: 0.6rem 0.8rem; font-size: 0.875rem; border-radius: 0.35rem;
  border: 1px solid var(--sl-color-gray-5);
}
`;
