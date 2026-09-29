import { renderSvg, type RenderTheme } from '@einsatzzeichen/core';
import type { Drawing } from '@einsatzzeichen/schema';

/** Standard-Tagname; Custom Elements verlangen einen Bindestrich im Namen. */
export const DEFAULT_TAG_NAME = 'einsatzzeichen-symbol';

/**
 * Beobachtete Attribute des Elements. `size` in px (positive ganze Zahl), `id-prefix` frei,
 * `min-stroke-width` als Mindeststrichbreite in px (positive Dezimalzahl, nur zusammen mit `size`).
 */
export const OBSERVED_ATTRIBUTES = ['size', 'id-prefix', 'min-stroke-width'] as const;

export interface ElementMarkupOptions {
  /** Rohwert des `size`-Attributs; `null`/`undefined` heißt „nicht gesetzt“ (frei skalierend). */
  size?: string | null;
  /** Rohwert des `id-prefix`-Attributs; `null`/`undefined` überlässt core die Vorgabe. */
  idPrefix?: string | null;
  theme?: RenderTheme;
  /**
   * Rohwert des `min-stroke-width`-Attributs: Mindeststrichbreite in Pixeln (LFH-584, siehe
   * `SvgOptions.minStrokeWidthPx`). `null`/`undefined` heißt aus. Verlangt `size`, weil ein frei
   * skalierendes SVG keinen festen Pixelmaßstab hat; core wirft sonst einen `RangeError`.
   */
  minStrokeWidth?: string | null;
}

/**
 * Wandelt den Attributstring in eine Pixelbreite um. Attribute sind immer Strings; ein stiller
 * Rückfall auf eine Standardgröße würde Tippfehler im Markup verstecken, deshalb wird jeder
 * Wert, der nicht aus Dezimalziffern besteht oder null ist, mit `RangeError` abgewiesen. Bewusst
 * strenger als `Number(...)`, das auch `"0x40"`, `"1e2"` oder `" 64 "` durchließe — im Markup
 * soll nur die Schreibweise stehen, die man auch liest.
 *
 * Im Browser propagiert ein Fehler aus `attributeChangedCallback` nicht an `setAttribute`,
 * sondern wird als uncaught error gemeldet — sichtbar, nicht verschluckt.
 */
export function parseSizeAttribute(value: string): number {
  const size = /^\d+$/u.test(value) ? Number(value) : Number.NaN;
  if (!Number.isInteger(size) || size <= 0) {
    throw new RangeError(
      `Attribut "size" muss eine positive ganze Pixelzahl sein, erhalten: ${JSON.stringify(value)}`,
    );
  }
  return size;
}

/**
 * Wandelt das `min-stroke-width`-Attribut in eine Pixelzahl um. Dieselbe Strenge wie
 * `parseSizeAttribute`, aber mit Nachkommastellen, weil Bruchteile eines Pixels hier sinnvoll sind
 * (`"0.75"`). Nur Ziffern mit optionalem Dezimalpunkt; alles andere, auch `"0"`, wirft.
 */
export function parseMinStrokeWidthAttribute(value: string): number {
  const width = /^\d+(\.\d+)?$/u.test(value) ? Number(value) : Number.NaN;
  if (!Number.isFinite(width) || width <= 0) {
    throw new RangeError(
      `Attribut "min-stroke-width" muss eine positive Pixelzahl sein, erhalten: ${JSON.stringify(value)}`,
    );
  }
  return width;
}

/**
 * Reine Abbildung von Zeichnung und Attributwerten auf das Shadow-Markup. Ohne DOM testbar und
 * vom Element unverändert übernommen, damit die Attributauswertung nur an einer Stelle lebt.
 * Ohne Zeichnung ist das Markup leer: ein Element ohne Inhalt zeigt bewusst nichts.
 */
export function renderElementMarkup(
  drawing: Drawing | undefined,
  options: ElementMarkupOptions = {},
): string {
  if (drawing === undefined) {
    return '';
  }
  const size = options.size == null ? undefined : parseSizeAttribute(options.size);
  const idPrefix = options.idPrefix == null ? undefined : options.idPrefix;
  const minStrokeWidthPx =
    options.minStrokeWidth == null ? undefined : parseMinStrokeWidthAttribute(options.minStrokeWidth);
  return renderSvg(drawing, { size, idPrefix, theme: options.theme, minStrokeWidthPx });
}

/**
 * In Node (SSR, Tests der reinen Funktionen) existiert `HTMLElement` nicht. Würde die Klasse
 * direkt davon erben, schlüge bereits der Import des Pakets fehl. Der Platzhalter macht das
 * Modul importierbar; instanziiert wird die Klasse dort nie, weil `defineEinsatzzeichenElement`
 * ohne `customElements` zum No-op wird.
 */
const Base: typeof HTMLElement =
  typeof HTMLElement === 'undefined' ? (class {} as unknown as typeof HTMLElement) : HTMLElement;

/**
 * `<einsatzzeichen-symbol>`: rendert eine `Drawing`-IR über `renderSvg` in einen offenen
 * Shadow DOM. Zeichnung und Theme sind Properties (Objekte lassen sich nicht sinnvoll als
 * Attribut tragen), `size` und `id-prefix` sind Attribute, weil sie Strings sind und aus dem
 * Markup gesetzt werden sollen. Gerendert wird nur im verbundenen Zustand (siehe `#render`);
 * Fehler aus dem Rendern (etwa eine ungültige `size`) werden nicht abgefangen — der Browser
 * meldet sie aus `attributeChangedCallback` als uncaught error.
 */
export class EinsatzzeichenElement extends Base {
  static get observedAttributes(): readonly string[] {
    return OBSERVED_ATTRIBUTES;
  }

  #drawing: Drawing | undefined;
  #theme: RenderTheme | undefined;
  readonly #root: ShadowRoot;

  constructor() {
    super();
    this.#root = this.attachShadow({ mode: 'open' });
  }

  get drawing(): Drawing | undefined {
    return this.#drawing;
  }

  set drawing(value: Drawing | undefined) {
    this.#drawing = value;
    this.#render();
  }

  get theme(): RenderTheme | undefined {
    return this.#theme;
  }

  set theme(value: RenderTheme | undefined) {
    this.#theme = value;
    this.#render();
  }

  connectedCallback(): void {
    this.#render();
  }

  attributeChangedCallback(): void {
    this.#render();
  }

  /**
   * Vor dem Verbinden nicht rendern: `connectedCallback` rendert ohnehin, und beim Parsen eines
   * Dokuments kommen Attribute und Properties einzeln an — jedes würde sonst ein eigenes Rendern
   * kosten. Der Guard sitzt hier und nicht in den einzelnen Callbacks/Settern, damit alle
   * Auslöser dieselbe Regel haben.
   */
  #render(): void {
    if (!this.isConnected) {
      return;
    }
    this.#root.innerHTML = renderElementMarkup(this.#drawing, {
      size: this.getAttribute('size'),
      idPrefix: this.getAttribute('id-prefix'),
      minStrokeWidth: this.getAttribute('min-stroke-width'),
      theme: this.#theme,
    });
  }
}

/**
 * Registriert das Element. Idempotent, weil `customElements.define` bei doppelter Registrierung
 * wirft und mehrere Bundles dasselbe Paket laden können. Ohne `customElements` (Node/SSR) ist der
 * Aufruf ein No-op, damit die reinen Funktionen dieses Pakets überall importierbar bleiben.
 */
export function defineEinsatzzeichenElement(tagName: string = DEFAULT_TAG_NAME): void {
  const registry = globalThis.customElements;
  if (registry === undefined) {
    return;
  }
  if (registry.get(tagName) !== undefined) {
    return;
  }
  registry.define(tagName, EinsatzzeichenElement);
}
