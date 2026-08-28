import { renderSvg, type RenderTheme } from '@einsatzzeichen/core';
import type { Drawing } from '@einsatzzeichen/schema';

/** Standard-Tagname; Custom Elements verlangen einen Bindestrich im Namen. */
export const DEFAULT_TAG_NAME = 'einsatzzeichen-symbol';

/** Beobachtete Attribute des Elements. `size` in px (positive ganze Zahl), `id-prefix` frei. */
export const OBSERVED_ATTRIBUTES = ['size', 'id-prefix'] as const;

export interface ElementMarkupOptions {
  /** Rohwert des `size`-Attributs; `null`/`undefined` heißt „nicht gesetzt" (frei skalierend). */
  size?: string | null;
  /** Rohwert des `id-prefix`-Attributs; `null`/`undefined` überlässt core die Vorgabe. */
  idPrefix?: string | null;
  theme?: RenderTheme;
}

/**
 * Wandelt den Attributstring in eine Pixelbreite um. Attribute sind immer Strings; ein stiller
 * Rückfall auf eine Standardgröße würde Tippfehler im Markup verstecken, deshalb wird jeder
 * Wert, der keine positive ganze Zahl ist, mit `RangeError` abgewiesen.
 */
export function parseSizeAttribute(value: string): number {
  const size = value.trim() === '' ? Number.NaN : Number(value);
  if (!Number.isInteger(size) || size <= 0) {
    throw new RangeError(
      `Attribut "size" muss eine positive ganze Pixelzahl sein, erhalten: ${JSON.stringify(value)}`,
    );
  }
  return size;
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
  return renderSvg(drawing, {
    ...(size !== undefined ? { size } : {}),
    ...(idPrefix !== undefined ? { idPrefix } : {}),
    ...(options.theme !== undefined ? { theme: options.theme } : {}),
  });
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
 * Markup gesetzt werden sollen.
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

  /**
   * Vor dem Verbinden nicht rendern: `connectedCallback` rendert ohnehin, und beim Parsen
   * eines Dokuments kommen Attribute einzeln an — jedes würde sonst ein eigenes Rendern kosten.
   */
  attributeChangedCallback(): void {
    if (this.isConnected) {
      this.#render();
    }
  }

  #render(): void {
    this.#root.innerHTML = renderElementMarkup(this.#drawing, {
      size: this.getAttribute('size'),
      idPrefix: this.getAttribute('id-prefix'),
      ...(this.#theme !== undefined ? { theme: this.#theme } : {}),
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
