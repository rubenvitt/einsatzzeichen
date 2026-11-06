import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { RECIPES } from '@einsatzzeichen/conformance';
import { draw, drawAnySpec, drawSymbol, renderSvg, type Sign } from '@einsatzzeichen/core';
import { Einsatzzeichen } from '@einsatzzeichen/react';
import { codeSamplesFor, exactCodeSampleFor, signCodeSamplesFor } from './code-samples.js';

const [id, recipe] = Object.entries(RECIPES)[0]!;
const samples = codeSamplesFor(recipe.spec, id);

describe('codeSamplesFor', () => {
  it('TypeScript-Snippet enthält die Spec wörtlich und die echten Aufrufe', () => {
    expect(samples.typescript).toContain('drawSymbol(');
    expect(samples.typescript).toContain('renderSvg(');
    expect(samples.typescript).toContain(JSON.stringify(recipe.spec, null, 2));
  });

  it('die im Snippet beschriebene TS-Kette erzeugt ein SVG', () => {
    const svg = renderSvg(drawSymbol(recipe.spec), { size: 64 });
    expect(svg.startsWith('<svg')).toBe(true);
  });

  it('React-Snippet nennt die Komponente, die auch rendert', () => {
    expect(samples.react).toContain('<Einsatzzeichen');
    const html = renderToStaticMarkup(
      createElement(Einsatzzeichen, { drawing: drawSymbol(recipe.spec), size: 64 }),
    );
    expect(html).toContain('<svg');
  });

  it('kein Beispiel braucht das Prüfpaket (LFH-580)', () => {
    for (const sample of Object.values(samples)) {
      expect(sample).not.toContain('@einsatzzeichen/conformance');
      expect(sample).toMatch(/import \{[^}]*\bdrawSymbol\b[^}]*\} from '@einsatzzeichen\/core';/u);
    }
  });

  it('Web-Component- und MapLibre-Snippets nennen die exportierten Namen', () => {
    expect(samples.webComponent).toMatch(/customElements\.define|define\w*\(/u);
    expect(samples.maplibre).toContain('addImage'); // über das Paket, exakter Funktionsname aus style-image.ts
  });
});

describe('codeSamplesFor mit einem freistehenden Zeichen (ESZ-135)', () => {
  const spec = { kind: 'pictogram', pictogram: 'comms.voice-radio' } as const;
  const freestanding = codeSamplesFor(spec, 'builder-spec');

  it('zeichnet über drawAnySpec und nennt den Typ FreestandingSpec', () => {
    for (const sample of Object.values(freestanding)) {
      expect(sample).toMatch(/import \{[^}]*\bdrawAnySpec\b[^}]*\} from '@einsatzzeichen\/core';/u);
      expect(sample).toContain('const spec: FreestandingSpec = ');
      expect(sample).not.toMatch(/\bdrawSymbol\b/u);
    }
  });

  it('die im Snippet beschriebene TS-Kette erzeugt ein SVG', () => {
    expect(renderSvg(drawAnySpec(spec), { size: 64 }).startsWith('<svg')).toBe(true);
  });
});

describe('signCodeSamplesFor (ESZ-150)', () => {
  const sign: Sign = { kind: 'person', organization: 'thw', states: ['person-injured'] };
  const short = signCodeSamplesFor(sign, 'builder');

  it('zeigt die Kurzform draw(sign) mit der Beschreibung wörtlich', () => {
    expect(short.typescript).toContain('draw(sign)');
    expect(short.typescript).toContain(JSON.stringify(sign, null, 2));
    expect(short.typescript).not.toContain('drawSymbol');
  });

  it('die im Snippet beschriebene TS-Kette erzeugt ein SVG', () => {
    const { drawing, omitted } = draw(sign);
    expect(omitted).toEqual([]);
    expect(renderSvg(drawing, { size: 64 }).startsWith('<svg')).toBe(true);
  });

  it('übergibt die Beschreibung an allen Kanälen als sign', () => {
    expect(short.react).toContain('<Einsatzzeichen sign={sign}');
    expect(renderToStaticMarkup(createElement(Einsatzzeichen, { sign, size: 64 }))).toContain('<svg');
    expect(short.webComponent).toContain('element.sign = sign');
    expect(short.maplibre).toMatch(/addSymbolImage\(map, "builder", sign/u);
    for (const sample of Object.values(short)) expect(sample).not.toContain('@einsatzzeichen/conformance');
  });
});

describe('exactCodeSampleFor (ESZ-150)', () => {
  it('zeichnet den aufgelösten Bauplan über core/exact', () => {
    const { exact } = draw({ kind: 'person', organization: 'thw' });
    const sample = exactCodeSampleFor(exact);
    expect(sample).toContain("from '@einsatzzeichen/core/exact'");
    expect(sample).toContain('const exact: AnySpec = ');
    expect(sample).toContain(JSON.stringify(exact, null, 2));
    // `core/exact` reicht `drawAnySpec` aus der Wurzel durch (geprüft in `conformance/src/core-subpaths.test.ts`);
    // die Website löst nur die Wurzel des Pakets auf.
    expect(renderSvg(drawAnySpec(exact), { size: 64 }).startsWith('<svg')).toBe(true);
  });
});
