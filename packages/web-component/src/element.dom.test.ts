// @vitest-environment happy-dom
import { beforeAll, describe, expect, it } from 'vitest';
import { renderSvg, type RenderTheme } from '@einsatzzeichen/core';
import { PALETTE } from '@einsatzzeichen/schema';
import {
  DEFAULT_TAG_NAME,
  defineEinsatzzeichenElement,
  type EinsatzzeichenElement,
} from './index.js';
import { formation } from './fixture.test-helper.js';

/**
 * `innerHTML` liefert die DOM-Serialisierung, nicht den gesetzten String (z. B. `<rect/>` wird
 * zu `<rect></rect>`). Der Vergleich läuft deshalb gegen dasselbe Markup nach derselben Runde.
 */
function serialized(markup: string): string {
  const host = document.createElement('div');
  host.innerHTML = markup;
  return host.innerHTML;
}

function mount(): EinsatzzeichenElement {
  const el = document.createElement(DEFAULT_TAG_NAME) as EinsatzzeichenElement;
  document.body.appendChild(el);
  return el;
}

describe('EinsatzzeichenElement (happy-dom)', () => {
  beforeAll(() => {
    defineEinsatzzeichenElement();
  });

  it('registriert sich idempotent', () => {
    expect(() => defineEinsatzzeichenElement()).not.toThrow();
    expect(customElements.get(DEFAULT_TAG_NAME)).toBeDefined();
  });

  it('bleibt ohne Zeichnung leer', () => {
    const el = mount();
    expect(el.shadowRoot).not.toBeNull();
    expect(el.shadowRoot?.innerHTML).toBe('');
  });

  it('rendert die gesetzte Zeichnung als SVG in den Shadow DOM', () => {
    const el = mount();
    el.drawing = formation;
    expect(el.drawing).toBe(formation);
    expect(el.shadowRoot?.innerHTML).toBe(serialized(renderSvg(formation)));
  });

  it('übernimmt size als Pixelbreite', () => {
    const el = mount();
    el.setAttribute('size', '64');
    el.drawing = formation;
    expect(el.shadowRoot?.innerHTML).toBe(serialized(renderSvg(formation, { size: 64 })));
  });

  it('rendert bei Attributänderung neu', () => {
    const el = mount();
    el.drawing = formation;
    el.setAttribute('size', '48');
    expect(el.shadowRoot?.innerHTML).toBe(serialized(renderSvg(formation, { size: 48 })));
    el.removeAttribute('size');
    expect(el.shadowRoot?.innerHTML).toBe(serialized(renderSvg(formation)));
  });

  it('wirkt mit id-prefix auf die erzeugten IDs', () => {
    const el = mount();
    el.setAttribute('id-prefix', 'karte');
    el.drawing = formation;
    expect(el.shadowRoot?.innerHTML).toBe(serialized(renderSvg(formation, { idPrefix: 'karte' })));
    expect(el.shadowRoot?.innerHTML).toContain('id="karte-title"');
  });

  it('macht ein Theme mit abweichender Palette sichtbar', () => {
    const theme: RenderTheme = {
      id: 'test',
      palette: { ...PALETTE, weiss: '#eeeeee' },
      surface: '#ffffff',
    };
    const el = mount();
    el.drawing = formation;
    el.theme = theme;
    expect(el.theme).toBe(theme);
    expect(el.shadowRoot?.innerHTML).toBe(serialized(renderSvg(formation, { theme })));
    expect(el.shadowRoot?.innerHTML).toContain('fill="#eeeeee"');
  });

  it('wirft bei ungültiger Größe statt still zu rendern', () => {
    const el = mount();
    el.drawing = formation;
    expect(() => el.setAttribute('size', '0')).toThrow(RangeError);
  });

  it('rendert erst beim Verbinden, wenn die Zeichnung vorher gesetzt wurde', () => {
    const el = document.createElement(DEFAULT_TAG_NAME) as EinsatzzeichenElement;
    el.drawing = formation;
    document.body.appendChild(el);
    expect(el.shadowRoot?.innerHTML).toBe(serialized(renderSvg(formation)));
  });
});
