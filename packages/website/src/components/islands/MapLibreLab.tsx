import { useEffect, useMemo, useRef, useState } from 'react';
import type { Map as MapLibreMap, Marker as MapLibreMarker } from 'maplibre-gl';
import { renderSvg, type RenderTheme } from '@einsatzzeichen/core';
import { Einsatzzeichen } from '@einsatzzeichen/react';
import { addSymbolImage } from '@einsatzzeichen/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import {
  basemapStyle,
  classifyMapError,
  clampSize,
  errorDetail,
  errorUrl,
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

/**
 * Gibt das zuletzt verwendete Symbolbild frei und merkt sich das neue. Aufzurufen **nach** dem
 * Umhängen der Ebene, damit `icon-image` nie auf ein entferntes Bild zeigt. Ohne diese Freigabe
 * bliebe je Reglerschritt ein Raster im Stil liegen — bei 128 px und Pixel Ratio 3 sind das rund
 * 590 KB pro Bild.
 */
function releaseImage(
  map: MapLibreMap,
  applied: { current: string | null },
  next: string | null,
): void {
  const previous = applied.current;
  if (previous !== null && previous !== next && map.hasImage(previous)) {
    map.removeImage(previous);
  }
  applied.current = next;
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
  /** Bild-ID, die die Symbolebene gerade zeigt — für die Freigabe des vorherigen Rasters. */
  const appliedImageRef = useRef<string | null>(null);

  const [query, setQuery] = useState('');
  const [symbolId, setSymbolId] = useState(symbols[0]?.id ?? '');
  const [size, setSize] = useState(64);
  const [pixelRatio, setPixelRatio] = useState<PixelRatio>(2);
  const [themeId, setThemeId] = useState(themes[0]?.id ?? 'reference');
  const [mode, setMode] = useState<LabMode>('marker');

  /** Wert aus `?symbol=`, den die Liste nicht kennt — sichtbar gemeldet statt still verworfen. */
  const [unknownSymbolParam, setUnknownSymbolParam] = useState<string | null>(null);

  const [styleReady, setStyleReady] = useState(false);
  const [fontsReady, setFontsReady] = useState(false);
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

  /*
   * `?symbol=<slug>` aus der Adresse lesen. Die Symbolseite verlinkt so hierher („Auf der Karte
   * ansehen"), und ohne diesen Effekt landete man auf der Karte mit dem ersten Zeichen des
   * Katalogs statt mit dem, das man angesehen hat.
   *
   * Erst nach der Hydration, wie im Explorer: die Serverfassung und der erste Client-Render
   * zeigen beide `symbols[0]`, sonst wiche das Markup ab, sobald die Adresse einen Parameter
   * trägt. Gesucht wird über den `slug`, weil er in der Adresse steht; die Auswahl läuft über die
   * `id`, und die beiden sind bei keinem Zeichen gleich (`base.formation` ↔ `base-formation`).
   *
   * Ein Wert, den die Liste nicht kennt, wird gemeldet statt still verworfen (Spec §7): sonst
   * zeigte die Karte wortlos irgendein Zeichen, und wer einem veralteten Link gefolgt ist, hielte
   * es für das gesuchte.
   */
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const wanted = new URLSearchParams(window.location.search).get('symbol');
    if (wanted === null || wanted === '') return;
    const found = symbols.find((entry) => entry.slug === wanted);
    if (found === undefined) {
      setUnknownSymbolParam(wanted);
      return;
    }
    setSymbolId(found.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /*
   * Auf die Schrift warten, bevor gerastert wird. `addSymbolImage` zeichnet über `renderCanvas`
   * mit `ctx.fillText`; die Leinwand kennt kein `font-display` und nimmt, was in diesem Moment
   * aufgelöst ist. Wäre Arimo noch nicht da, stünde das Kürzel in einer Ersatzschrift mit anderen
   * Vorschubbreiten im Bild — und weil die Bild-ID nur Zeichen, Größe, Pixelverhältnis und
   * Farbprofil trägt, bliebe genau dieses falsche Bild im Stil liegen. Die Marker sind davon
   * nicht betroffen: ein SVG im DOM setzt sich neu, sobald die Schrift eintrifft.
   */
  useEffect(() => {
    let cancelled = false;
    if (typeof document === 'undefined' || !('fonts' in document)) {
      setFontsReady(true);
      return;
    }
    const fonts = document.fonts;
    void (async () => {
      // `fonts.ready` allein genügt nicht: es meldet nur, dass gerade nichts mehr lädt — auch
      // dann, wenn Arimo noch gar nicht angefordert wurde. `load()` fordert die Schrift an.
      try {
        await fonts.load('16px Arimo');
      } catch {
        // Eine nicht ladbare Schrift ist kein Grund, das Lab zu blockieren; dann rastert es mit
        // der Ersatzschrift, und das ist sichtbar, statt verborgen.
      }
      try {
        await fonts.ready;
      } catch {
        // dito
      }
      if (!cancelled) setFontsReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

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
        if (cancelled) return;
        // Ein Fehler ohne URL vor dem Laden gilt als tödlich (`classifyMapError`) — er kann aber
        // vorübergehend sein. Feuert `load`, steht die Karte, und die Meldung von vorhin ist
        // widerlegt: sie verschwindet, statt die brauchbare Karte weiter zu verdecken.
        setMapError(null);
        setStyleReady(true);
      });

      // `error` feuert auch für eine einzelne fehlende Kachel, ein fehlendes Sprite oder einen
      // Glyphenbereich — und zwar bevor `load` feuert. Deshalb entscheidet die fehlgeschlagene
      // Ressource, nicht der Zeitpunkt (`classifyMapError`): unerreichbar ist die Karte nur, wenn
      // das Stildokument selbst fehlt (Spec §7 verlangt einen Grund, nicht ein Banner über allem).
      map.on('error', (event: { error?: unknown }) => {
        if (cancelled) return;
        const kind = classifyMapError({
          url: errorUrl(event.error),
          styleLoaded: map.isStyleLoaded() === true,
          basemap,
        });
        if (kind === 'note') {
          setTileNote({
            text:
              'Ein Teil des Untergrunds wurde nicht geladen — die Karte bleibt bedienbar, ' +
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
      appliedImageRef.current = null;
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

    // Rastern erst, wenn Arimo steht (siehe Effekt „auf die Schrift warten"). Der Effekt läuft
    // erneut, sobald `fontsReady` umspringt.
    if (mode === 'symbol-layer' && !fontsReady) return;

    try {
      if (mode === 'marker') {
        if (map.getLayer(LAYER_ID) !== undefined) map.removeLayer(LAYER_ID);
        releaseImage(map, appliedImageRef, null);
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
        // Erst umhängen, dann das alte Bild freigeben: ein Raster von 128 px bei Pixel Ratio 3
        // belegt gut ein halbes Megabyte, und am Größenregler entstünde sonst je Schritt eines,
        // das bis zum Seitenwechsel im Stil liegen bliebe.
        releaseImage(map, appliedImageRef, imageId);
      }
      setDrawError(null);
    } catch (error) {
      setDrawError(errorDetail(error));
    }
  }, [styleReady, fontsReady, mode, symbol, theme, themeId, size, pixelRatio, points]);

  function zoomTo(zoom: number): void {
    mapRef.current?.easeTo({ zoom, center: [LAB_CENTER[0], LAB_CENTER[1]] });
  }

  const mapUnavailable = mapError !== null;

  return (
    <section className="ez-lab" aria-label="MapLibre Lab">
      {unknownSymbolParam === null ? null : (
        <div className="ez-note" role="status">
          <span className="ez-note__title">Dieses Zeichen gibt es hier nicht</span>
          <p>
            Die Adresse verlangt das Zeichen „{unknownSymbolParam}“. In der Liste steht es nicht —
            gezeigt wird stattdessen {symbols[0]?.title ?? 'das erste Zeichen des Katalogs'}, das
            erste Zeichen des Katalogs. Vermutlich ist der Link veraltet oder von Hand geändert;
            such das Zeichen oben über <strong>Zeichen suchen</strong>.
          </p>
        </div>
      )}

      <div className="ez-lab__controls">
        <label className="ez-lab__field ez-lab__field--wide" htmlFor="ez-lab-query">
          <span className="ez-lab__field-label">Zeichen suchen</span>
          <input
            id="ez-lab-query"
            type="search"
            value={query}
            placeholder="Titel, ID oder Kapitel"
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>

        <label className="ez-lab__field ez-lab__field--wide" htmlFor="ez-lab-symbol">
          <span className="ez-lab__field-label">
            Zeichen · {matches.length} von {symbols.length}
          </span>
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
        </label>

        <label className="ez-lab__field" htmlFor="ez-lab-size">
          <span className="ez-lab__field-label">Größe · {size} px</span>
          <input
            id="ez-lab-size"
            type="range"
            min={SIZE_MIN}
            max={SIZE_MAX}
            step={SIZE_STEP}
            value={size}
            onChange={(event) => setSize(clampSize(Number(event.target.value)))}
          />
        </label>

        <label className="ez-lab__field" htmlFor="ez-lab-ratio">
          <span className="ez-lab__field-label">Pixel Ratio</span>
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
        </label>

        <label className="ez-lab__field" htmlFor="ez-lab-theme">
          <span className="ez-lab__field-label">Farbprofil</span>
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
        </label>

        <fieldset className="ez-lab__field ez-lab__modes">
          <legend className="ez-lab__field-label">Darstellung</legend>
          <label>
            <input
              type="radio"
              name="ez-lab-mode"
              value="marker"
              checked={mode === 'marker'}
              onChange={() => setMode('marker')}
            />
            Marker · SVG im DOM
          </label>
          <label>
            <input
              type="radio"
              name="ez-lab-mode"
              value="symbol-layer"
              checked={mode === 'symbol-layer'}
              onChange={() => setMode('symbol-layer')}
            />
            Symbol Layer · Bild im Stil
          </label>
        </fieldset>

        <div className="ez-lab__field">
          <span className="ez-lab__field-label" id="ez-lab-zoom-label">
            Zoom
          </span>
          <div className="ez-lab__zooms" role="group" aria-labelledby="ez-lab-zoom-label">
            {ZOOM_LEVELS.map((zoom) => (
              <button
                key={zoom}
                type="button"
                className="ez-action"
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
            <div className="ez-lab__overlay ez-note" role="alert">
              <span className="ez-note__title">Karte nicht verfügbar</span>
              <p>{mapError}</p>
              <p>
                Die Vorschau daneben zeichnet dasselbe Zeichen ohne Karte — sie hängt weder an
                MapLibre noch an einer Kachelquelle.
              </p>
            </div>
          ) : null}
          {!mapUnavailable && !styleReady ? (
            <p className="ez-lab__overlay ez-lab__hint" role="status">
              Karte wird geladen …
            </p>
          ) : null}
        </div>

        <aside className="ez-lab__side">
          <span className="ez-lab__field-label">Vorschau ohne Karte</span>
          {/* Beide Kartenhintergründe, unabhängig vom Seitenthema (Spec §5.6): die
              Referenzpalette ist auf Weiß gerechnet, gelesen wird die Seite oft dunkel. */}
          <div className="ez-canvas-pair">
            {symbol !== undefined && theme !== undefined ? (
              <>
                <span className="ez-canvas ez-canvas--light">
                  <Einsatzzeichen
                    drawing={symbol.drawing}
                    size={size}
                    theme={theme}
                    idPrefix="ez-lab-preview-hell"
                  />
                </span>
                <span className="ez-canvas ez-canvas--dark">
                  <Einsatzzeichen
                    drawing={symbol.drawing}
                    size={size}
                    theme={theme}
                    idPrefix="ez-lab-preview-dunkel"
                  />
                </span>
              </>
            ) : null}
          </div>
          {symbol !== undefined ? (
            <dl className="ez-lab__meta">
              <dt>Zeichen</dt>
              <dd>{symbol.title}</dd>
              <dt>ID</dt>
              <dd>
                <span className="ez-id">{symbol.id}</span>
              </dd>
              <dt>Fundstelle</dt>
              <dd>{symbol.chapter}</dd>
              <dt>Bild-ID im Stil</dt>
              <dd>
                <span className="ez-mono">
                  {symbolImageId({ symbolId: symbol.id, size, pixelRatio, themeId })}
                </span>
              </dd>
            </dl>
          ) : null}
        </aside>
      </div>

      {drawError !== null ? (
        <div className="ez-note" role="alert">
          <span className="ez-note__title">Zeichen nicht auf der Karte</span>
          <p>Das Zeichen ließ sich nicht auf die Karte bringen. Grund: {drawError}</p>
        </div>
      ) : null}

      {mode === 'symbol-layer' && !fontsReady ? (
        <div className="ez-note" role="status">
          <span className="ez-note__title">Warten auf die Schrift</span>
          <p>
            Die Symbolebene rastert erst, wenn Arimo geladen ist — sonst stünde das Kürzel im Bild
            in einer Ersatzschrift, und dieses Bild bliebe im Kartenstil liegen.
          </p>
        </div>
      ) : null}

      {tileNote !== null && !mapUnavailable ? (
        <div className="ez-note" role="status">
          <span className="ez-note__title">Untergrund lückenhaft</span>
          <p>{tileNote.text}</p>
        </div>
      ) : null}

      <p className="ez-lab__source">
        {basemap === 'openfreemap' ? (
          <>
            Untergrund <span className="ez-mono">{OPENFREEMAP_STYLE_URL}</span> —{' '}
            {OPENFREEMAP_ATTRIBUTION}. Marker und Symbolebene erscheinen bei Pixel Ratio 1, 2 und 3
            gleich groß: das Raster wird mit <span className="ez-mono">size × pixelRatio</span>
            {' '}gezeichnet, MapLibre rechnet über <span className="ez-mono">pixelRatio</span> auf
            dieselbe CSS-Größe zurück.
          </>
        ) : (
          <>Ohne Untergrund: die Karte zeigt nur eine Hintergrundfläche, es wird nichts geladen.</>
        )}
      </p>

      <style>{`
        .ez-lab {
          display: grid;
          gap: var(--ez-space-4);
          margin-block: var(--ez-space-6);
        }
        .ez-lab__controls {
          display: flex;
          flex-wrap: wrap;
          align-items: end;
          gap: var(--ez-space-3) var(--ez-space-4);
        }
        .ez-lab__field {
          display: flex;
          flex-direction: column;
          gap: var(--ez-space-1);
          margin: 0;
          padding: 0;
          border: 0;
        }
        .ez-lab__field--wide {
          flex: 1 1 15rem;
        }
        .ez-lab__field-label {
          font-family: var(--ez-font-mono);
          font-size: var(--sl-text-2xs);
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: var(--sl-color-gray-3);
        }
        .ez-lab__field input[type='search'],
        .ez-lab__field select {
          font: inherit;
          font-size: var(--sl-text-sm);
          padding: var(--ez-space-2) var(--ez-space-3);
          border: 1px solid var(--sl-color-hairline);
          border-radius: var(--ez-radius);
          background: transparent;
          color: var(--sl-color-white);
        }
        .ez-lab__field input:focus-visible,
        .ez-lab__field select:focus-visible,
        .ez-lab button.ez-action:focus-visible {
          outline: 2px solid var(--sl-color-accent);
          outline-offset: 2px;
        }
        .ez-lab__field input[type='range'] {
          accent-color: var(--sl-color-accent);
          min-width: 10rem;
        }
        .ez-lab__modes label {
          display: flex;
          align-items: center;
          gap: var(--ez-space-2);
          font-size: var(--sl-text-sm);
        }
        .ez-lab__zooms {
          display: flex;
          gap: var(--ez-space-2);
        }
        .ez-lab button.ez-action {
          padding: var(--ez-space-2) var(--ez-space-3);
          font: inherit;
          font-family: var(--ez-font-mono);
          font-variant-numeric: tabular-nums;
          background: transparent;
          cursor: pointer;
        }
        .ez-lab button.ez-action[disabled] {
          cursor: not-allowed;
          color: var(--sl-color-gray-3);
          border-color: var(--sl-color-hairline);
        }
        .ez-lab__stage {
          display: grid;
          gap: var(--ez-space-4);
          grid-template-columns: minmax(0, 2fr) minmax(13rem, 1fr);
        }
        @media (max-width: 50rem) {
          .ez-lab__stage {
            grid-template-columns: minmax(0, 1fr);
          }
        }
        .ez-lab__map-slot {
          position: relative;
          min-height: 26rem;
        }
        .ez-lab__map {
          position: absolute;
          inset: 0;
          border: 1px solid var(--sl-color-hairline);
          border-radius: var(--ez-radius);
          overflow: hidden;
        }
        .ez-lab__map--hidden {
          visibility: hidden;
        }
        .ez-lab__overlay {
          position: absolute;
          inset: 0;
          display: flex;
          flex-direction: column;
          justify-content: center;
          gap: var(--ez-space-2);
          margin: 0;
        }
        .ez-lab__hint {
          padding: var(--ez-space-4);
          border: 1px dashed var(--sl-color-gray-4);
          border-radius: var(--ez-radius);
          font-family: var(--ez-font-mono);
          font-size: var(--sl-text-2xs);
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: var(--sl-color-gray-3);
          text-align: center;
        }
        .ez-lab__side {
          display: flex;
          flex-direction: column;
          gap: var(--ez-space-3);
        }
        .ez-lab__marker {
          line-height: 0;
          cursor: default;
        }
        .ez-lab__meta {
          display: grid;
          grid-template-columns: auto minmax(0, 1fr);
          gap: var(--ez-space-1) var(--ez-space-3);
          margin: 0;
          font-size: var(--sl-text-xs);
        }
        .ez-lab__meta dt {
          font-family: var(--ez-font-mono);
          font-size: var(--sl-text-2xs);
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: var(--sl-color-gray-3);
        }
        .ez-lab__meta dd {
          margin: 0;
          overflow-wrap: anywhere;
        }
        .ez-lab__source {
          margin: 0;
          font-size: var(--sl-text-xs);
          line-height: 1.6;
          color: var(--sl-color-gray-3);
        }
      `}</style>
    </section>
  );
}
