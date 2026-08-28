import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { RECIPES, composeFromCatalog } from '@einsatzzeichen/catalog';
import { renderSvg } from '@einsatzzeichen/core';
import { Einsatzzeichen } from '@einsatzzeichen/react';
import { codeSamplesFor } from './code-samples.js';

const [id, recipe] = Object.entries(RECIPES)[0]!;
const samples = codeSamplesFor(recipe.spec, id);

describe('codeSamplesFor', () => {
  it('TypeScript-Snippet enthält die Spec wörtlich und die echten Aufrufe', () => {
    expect(samples.typescript).toContain('composeFromCatalog(');
    expect(samples.typescript).toContain('renderSvg(');
    expect(samples.typescript).toContain(JSON.stringify(recipe.spec, null, 2));
  });

  it('die im Snippet beschriebene TS-Kette erzeugt ein SVG', () => {
    const svg = renderSvg(composeFromCatalog(recipe.spec), { size: 64 });
    expect(svg.startsWith('<svg')).toBe(true);
  });

  it('React-Snippet nennt die Komponente, die auch rendert', () => {
    expect(samples.react).toContain('<Einsatzzeichen');
    const html = renderToStaticMarkup(
      createElement(Einsatzzeichen, { drawing: composeFromCatalog(recipe.spec), size: 64 }),
    );
    expect(html).toContain('<svg');
  });

  it('Web-Component- und MapLibre-Snippets nennen die exportierten Namen', () => {
    expect(samples.webComponent).toMatch(/customElements\.define|define\w*\(/u);
    expect(samples.maplibre).toContain('addImage'); // über das Paket, exakter Funktionsname aus style-image.ts
  });
});
