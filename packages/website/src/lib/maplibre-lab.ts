import type { Drawing } from '@einsatzzeichen/schema';

/**
 * Reine Logik des MapLibre Labs (Spec §5.4): Kartenstil, Bild-IDs, Beispielpunkte, Fehlertexte.
 *
 * Alles hier ist frei von DOM und frei von `maplibre-gl` — die Insel bringt die Karte, diese Datei
 * bringt die Entscheidungen, die man ohne Browser prüfen kann. Der Katalog kommt hier nicht vor
 * (Spec §5.2): die Farbprofile bekommt die Insel als Prop aus der Seite, die Zeichen holt sie
 * seit LFH-500 zur Laufzeit aus dem Katalog-Snapshot.
 */

/** Zwei Grundlagen: die freie Kachelquelle oder gar keine (neutraler Untergrund). */
export type BasemapId = 'openfreemap' | 'none';

/**
 * Positron von OpenFreeMap: hell, zurückhaltend, ohne Schlüssel und ohne Registrierung. Ein
 * ruhiger Untergrund ist hier keine Geschmacksfrage — die Zeichen tragen Farbe als Bedeutung,
 * eine bunte Karte würde mit ihnen konkurrieren.
 */
export const OPENFREEMAP_STYLE_URL = 'https://tiles.openfreemap.org/styles/positron';

/** Namensnennung, wie OpenFreeMap sie verlangt. Steht zusätzlich als Satz auf der Seite. */
export const OPENFREEMAP_ATTRIBUTION = 'OpenFreeMap © OpenMapTiles Data from OpenStreetMap';

/** Kartenstil ohne jede Quelle: eine einzige Hintergrundfläche. */
export interface NeutralStyle {
  version: 8;
  sources: Record<string, never>;
  layers: [{ id: string; type: 'background'; paint: { 'background-color': string } }];
}

export const NEUTRAL_STYLE: NeutralStyle = {
  version: 8,
  sources: {},
  layers: [{ id: 'bg', type: 'background', paint: { 'background-color': '#eef' } }],
};

/**
 * Der Stil, den `new maplibregl.Map({ style })` bekommt: eine URL für die Kachelquelle, ein
 * fertiges Stilobjekt für den Fall ohne Grundlage.
 */
export function basemapStyle(basemap: BasemapId): string | NeutralStyle {
  return basemap === 'openfreemap' ? OPENFREEMAP_STYLE_URL : NEUTRAL_STYLE;
}

/** Kartenmitte: Bonn, Sitz des BBK, dessen Quelle den Katalog trägt. */
export const LAB_CENTER: readonly [number, number] = [7.0982, 50.7374];

/** Die drei Zoomstufen der Bedienleiste: Region, Stadt, Straßenzug. */
export const ZOOM_LEVELS = [8, 12, 16] as const;

export const SIZE_MIN = 24;
export const SIZE_MAX = 128;
export const SIZE_STEP = 8;

/** Gerätepixel je CSS-Pixel; `size × pixelRatio` bleibt damit ganzzahlig (siehe `createStyleImage`). */
export const PIXEL_RATIOS = [1, 2, 3] as const;
export type PixelRatio = (typeof PIXEL_RATIOS)[number];

export type LabMode = 'marker' | 'symbol-layer';

/** Hält die Größe im Bedienbereich und auf einem ganzzahligen Schritt. */
export function clampSize(value: number): number {
  if (!Number.isFinite(value)) return SIZE_MIN;
  const stepped = Math.round(value / SIZE_STEP) * SIZE_STEP;
  return Math.min(SIZE_MAX, Math.max(SIZE_MIN, stepped));
}

/** Ein Zeichen, so wie die Insel es braucht — ohne Review, ohne Spec, ohne Quellenangabe. */
export interface LabSymbol {
  id: string;
  slug: string;
  title: string;
  chapter: string;
  drawing: Drawing;
}

/**
 * Reduziert den Snapshot auf das, was die Karte zeichnet. Der Rest (Spec, Review, Quellen) wird
 * verworfen: die Karte liest ihn nicht, und die abgeleiteten Zeichen liegen für die Dauer der
 * Seite im Speicher der Insel.
 *
 * Läuft seit LFH-500 im Browser statt in der Seite — die Insel ruft die Funktion auf dem
 * geholten Snapshot auf. Genau einmal, in `snapshotState()`: das Ergebnis behält damit seine
 * Objektidentität, sonst zeichnete jede Reglerbewegung alle Marker neu.
 */
export function labSymbols(symbols: readonly LabSymbol[]): LabSymbol[] {
  return symbols.map(({ id, slug, title, chapter, drawing }) => ({
    id,
    slug,
    title,
    chapter,
    drawing,
  }));
}

/** Substringsuche über Titel, semantische ID und Kapitel; leere Eingabe zeigt alles. */
export function filterSymbols(symbols: readonly LabSymbol[], query: string): LabSymbol[] {
  const needle = query.trim().toLowerCase();
  if (needle === '') return [...symbols];
  return symbols.filter((symbol) =>
    `${symbol.title} ${symbol.id} ${symbol.chapter}`.toLowerCase().includes(needle),
  );
}

export interface SymbolImageKey {
  symbolId: string;
  size: number;
  pixelRatio: number;
  themeId: string;
}

/**
 * Bild-ID im Kartenstil. Sie trägt alle vier Größen, die das Raster bestimmen, weil `addImage`
 * ein Bild je ID kennt: ändert sich Größe, Pixelverhältnis oder Farbprofil, ist es ein anderes
 * Bild und braucht einen anderen Namen. So bleibt `addSymbolImage` bei seinem Vertrag (eine ID
 * wird nie überschrieben) und einmal gerasterte Bilder lassen sich wiederverwenden.
 */
export function symbolImageId(key: SymbolImageKey): string {
  return `ez:${key.symbolId}:${key.size}:${key.pixelRatio}:${key.themeId}`;
}

/** Eigener ID-Präfix je SVG im DOM — sonst kollidieren `<title>`-IDs mehrerer Marker. */
export function markerIdPrefix(symbolId: string, pointId: string): string {
  return `ez-lab-${symbolId.replace(/[^a-z0-9]+/giu, '-')}-${pointId}`;
}

export interface LabPoint {
  id: string;
  label: string;
  lngLat: [number, number];
}

/**
 * Fünf Beispielpunkte um die Kartenmitte. Sie stehen für nichts — keine Lage, keine Einheit, kein
 * Einsatz; sie zeigen nur, wie dasselbe Zeichen an mehreren Stellen aussieht. Der Abstand ist so
 * gewählt, dass die Punkte bei Zoom 12 getrennt stehen und bei Zoom 8 zusammenrücken; genau dort
 * fehlt das Clustering, das die Infobox als „noch nicht" nennt.
 */
export function labPoints(center: readonly [number, number] = LAB_CENTER): LabPoint[] {
  const [lng, lat] = center;
  const offsets: readonly [number, number][] = [
    [0, 0],
    [0.026, 0.012],
    [-0.024, 0.014],
    [0.018, -0.016],
    [-0.02, -0.013],
  ];
  return offsets.map(([dLng, dLat], index) => ({
    id: `p${index + 1}`,
    label: `Beispielpunkt ${index + 1}`,
    lngLat: [lng + dLng, lat + dLat],
  }));
}

export interface LabFeature {
  type: 'Feature';
  geometry: { type: 'Point'; coordinates: [number, number] };
  properties: { id: string; label: string };
}

export interface LabFeatureCollection {
  type: 'FeatureCollection';
  features: LabFeature[];
}

/** Die Beispielpunkte als GeoJSON für die `symbol`-Ebene. */
export function labFeatureCollection(points: readonly LabPoint[]): LabFeatureCollection {
  return {
    type: 'FeatureCollection',
    features: points.map((point) => ({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: point.lngLat },
      properties: { id: point.id, label: point.label },
    })),
  };
}

/**
 * Woran die Karte gescheitert ist. Die Unterscheidung ist nicht kosmetisch: ein fehlender
 * WebGL-Kontext ist ein anderer Rat als eine nicht erreichbare Kachelquelle (Spec §7).
 */
export type MapErrorKind = 'import' | 'create' | 'style';

const MAP_ERROR_TEXTS: Record<MapErrorKind, string> = {
  import: 'Die Kartenbibliothek maplibre-gl konnte nicht geladen werden.',
  create:
    'Die Karte ließ sich nicht anlegen — meist fehlt dem Browser ein WebGL-Kontext (abgeschaltet, ' +
    'keine Hardwarebeschleunigung oder eine Erweiterung blockiert ihn).',
  style: `Der Kartenstil von OpenFreeMap (${OPENFREEMAP_STYLE_URL}) ist nicht erreichbar.`,
};

export interface MapErrorContext {
  /** URL der fehlgeschlagenen Anfrage, falls der Fehler eine trägt (`AJAXError.url`). */
  url?: string;
  /** Ob der Stil bereits geparst ist (`map.isStyleLoaded()`). */
  styleLoaded: boolean;
  basemap: BasemapId;
}

/**
 * Trennt den tödlichen Kartenfehler von der Randnotiz. Entscheidend ist die fehlgeschlagene
 * Ressource, nicht der Zeitpunkt: MapLibre holt Kacheln, Sprite und Glyphen, bevor `load` feuert,
 * und eine einzelne fehlende Kachel würde bei reiner Zeitbetrachtung als „Stil nicht erreichbar"
 * durchgehen und die brauchbare Karte verstecken. Fehlt jede URL, entscheidet als Rückfall, ob
 * der Stil schon steht.
 */
export function classifyMapError(context: MapErrorContext): 'fatal' | 'note' {
  const url = context.url ?? '';
  if (url !== '') {
    return context.basemap === 'openfreemap' && url.startsWith(OPENFREEMAP_STYLE_URL)
      ? 'fatal'
      : 'note';
  }
  return context.styleLoaded ? 'note' : 'fatal';
}

/** URL einer fehlgeschlagenen Anfrage, falls der Fehlerwert eine trägt (`AJAXError`). */
export function errorUrl(error: unknown): string | undefined {
  if (typeof error !== 'object' || error === null) return undefined;
  const url = (error as { url?: unknown }).url;
  return typeof url === 'string' && url !== '' ? url : undefined;
}

/** Kurze Beschreibung eines unbekannten Fehlerwerts, ohne Stack. */
export function errorDetail(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  return String(error);
}

/** Meldung mit Grund — nie ein bloßes „Karte nicht verfügbar". */
export function mapErrorMessage(kind: MapErrorKind, error: unknown): string {
  const detail = errorDetail(error).trim();
  const text = MAP_ERROR_TEXTS[kind];
  return detail === '' ? text : `${text} Grund: ${detail}`;
}
