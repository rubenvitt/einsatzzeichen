import { describe, expect, it } from 'vitest';
import {
  DEFAULT_VIEWBOX_MM,
  type PictogramDefinition,
  type Primitive,
  type PrimitiveRole,
} from '@einsatzzeichen/schema';
import { compose, type CatalogPorts } from './compose.js';
import {
  BodyNotMeasuredError,
  checkBox,
  checkClipping,
  checkCommands,
  checkPictogram,
  checkTextLegibility,
} from './pictogram-gate.js';
import { renderSvg } from './render/svg.js';
import { MINIMUM_TEXT_RENDER_PX } from './render/text-policy.js';

/** Ein Piktogramm mit genau einem Pfad, Box und Titel unverändert — nur der `d`-String variiert. */
function withPath(d: string): PictogramDefinition {
  return {
    id: 'capability.fire-fighting',
    variant: 'primary',
    title: 'Testpiktogramm',
    box: { xMm: 4, yMm: 12, widthMm: 24, heightMm: 8 },
    primitives: [{ type: 'path', role: 'pictogram', d, style: { fill: 'schwarz', stroke: 'none' } }],
  };
}

/** Minimale Definition für reine Flächenprüfungen; die Primitive sind dafür unerheblich. */
function withBox(box: PictogramDefinition['box']): PictogramDefinition {
  return {
    id: 'capability.fire-fighting',
    variant: 'primary',
    title: 'Testbox',
    box,
    primitives: [],
  };
}

describe('Kommando-Gate', () => {
  it('lässt die sieben zugelassenen absoluten Kommandos durch', () => {
    const issues = checkCommands(withPath('M 4 12 L 8 12 H 12 V 16 C 14 16 16 20 18 20 Q 20 20 22 16 Z'));
    expect(issues).toEqual([]);
  });

  it('lehnt ein relatives Kommando ab', () => {
    const issues = checkCommands(withPath('M 4 12 l 4 0'));
    expect(issues).toHaveLength(1);
    expect(issues[0]?.gate).toBe('command');
    expect(issues[0]?.pictogramId).toBe('capability.fire-fighting');
    expect(issues[0]?.detail).toContain('Relatives Kommando "l"');
  });

  it('unterscheidet aggregierte Befunde derselben ID über die Darstellungsvariante', () => {
    const primary = withPath('M 4 12 l 4 0');
    const alternative: PictogramDefinition = {
      ...primary,
      variant: 'alternative',
      title: 'Alternatives Testpiktogramm',
    };

    const issues = [primary, alternative].flatMap(checkCommands);

    expect(issues).toHaveLength(2);
    expect(issues[0]?.detail).toBe(issues[1]?.detail);
    expect(issues.map(({ pictogramId, variant }) => ({ pictogramId, variant }))).toEqual([
      { pictogramId: 'capability.fire-fighting', variant: 'primary' },
      { pictogramId: 'capability.fire-fighting', variant: 'alternative' },
    ]);
  });

  it('lehnt A ab, weil seine Parameter keine Koordinaten sind', () => {
    // A rx ry rotation large-arc sweep x y: ein Schalter 0/1 besteht jede Box, eine Drehung 45
    // liest sich als 45 mm, und der Bogen kann weit außerhalb der geschriebenen Zahlen ausschlagen.
    const issues = checkCommands(withPath('M 4 12 A 2 2 0 0 1 8 16'));
    expect(issues).toHaveLength(1);
    expect(issues[0]?.detail).toContain('Unzulässiges Kommando "A"');
  });

  it('lehnt S ab, weil sein erster Kontrollpunkt implizit ist', () => {
    const issues = checkCommands(withPath('M 4 12 C 5 12 6 16 8 16 S 10 20 12 20'));
    expect(issues).toHaveLength(1);
    expect(issues[0]?.detail).toContain('Unzulässiges Kommando "S"');
  });

  it('lehnt T ab, aus demselben Grund wie S', () => {
    const issues = checkCommands(withPath('M 4 12 Q 6 12 8 16 T 12 16'));
    expect(issues).toHaveLength(1);
    expect(issues[0]?.detail).toContain('Unzulässiges Kommando "T"');
  });

  it('prüft jeden Pfad einer Definition mit mehreren Primitiven', () => {
    // primitives[0] und primitives[1] tragen je einen eigenen, unterscheidbaren Fehlgrund
    // (A vs. relative Kommandos). Ein `pathsOf`, das fehlerhaft nur das letzte Element lieferte,
    // ergäbe bei zwei gleichartigen Fehlern zufällig dieselbe Gesamtlänge — mit unterscheidbaren
    // Fehlgründen belegt der Test, dass Befunde aus **beiden** Pfaden stammen, nicht nur einem.
    const definition: PictogramDefinition = {
      id: 'capability.fire-fighting',
      variant: 'primary',
      title: 'Zwei Pfade',
      box: { xMm: 4, yMm: 12, widthMm: 24, heightMm: 8 },
      primitives: [
        { type: 'path', role: 'pictogram', d: 'M 4 12 A 2 2 0 0 1 8 16' },
        { type: 'path', role: 'pictogram', d: 'm 4 12 l 8 0' },
      ],
    };
    const issues = checkCommands(definition);
    // 'm' und 'l' sind zwei getrennte relative Kommandos, also zwei Befunde (siehe
    // tokenizePath('m 4 4 l 8 8') in path-commands.test.ts) — nicht einer je Pfad. Zusammen mit
    // dem A-Befund aus primitives[0] macht das drei.
    expect(issues).toHaveLength(3);
    const details = issues.map((issue) => issue.detail);
    expect(details.some((detail) => detail.includes('Unzulässiges Kommando "A"'))).toBe(true);
    expect(details.some((detail) => detail.includes('Relatives Kommando "m"'))).toBe(true);
    expect(details.some((detail) => detail.includes('Relatives Kommando "l"'))).toBe(true);
  });

  it('steigt in Gruppen ab', () => {
    const nested: Primitive = {
      type: 'group',
      children: [{ type: 'path', role: 'pictogram', d: 'M 4 12 A 2 2 0 0 1 8 16' }],
    };
    const definition: PictogramDefinition = {
      id: 'capability.fire-fighting',
      variant: 'primary',
      title: 'Pfad in Gruppe',
      box: { xMm: 4, yMm: 12, widthMm: 24, heightMm: 8 },
      primitives: [nested],
    };
    expect(checkCommands(definition)).toHaveLength(1);
  });

  it('meldet nichts für ein Piktogramm ohne Pfade', () => {
    const definition: PictogramDefinition = {
      id: 'capability.fire-fighting',
      variant: 'primary',
      title: 'Nur Linien',
      box: { xMm: 3, yMm: 9, widthMm: 23, heightMm: 14 },
      primitives: [{ type: 'line', role: 'pictogram', x1: 3, y1: 16, x2: 26, y2: 16 }],
    };
    expect(checkCommands(definition)).toEqual([]);
  });
});

describe('Box-Gate', () => {
  it('nimmt einen Pfad an, dessen Kontrollpunkte alle in der Box liegen', () => {
    // Alle x in [4, 28], alle y in [12, 20] — die Box ist { 4, 12, 24, 8 }.
    expect(checkBox(withPath('M 4 12 C 8 20 20 20 28 12 Z'))).toEqual([]);
  });

  it('lehnt eine Koordinate außerhalb der Box ab und nennt sie', () => {
    const issues = checkBox(withPath('M 4 12 L 30 12'));
    expect(issues).toHaveLength(1);
    expect(issues[0]?.gate).toBe('box');
    expect(issues[0]?.detail).toContain('30');
    expect(issues[0]?.detail).toContain('x');
  });

  it('lehnt einen Kontrollpunkt außerhalb der Box ab, auch wenn beide Endpunkte darin liegen', () => {
    // Die Kurve selbst bleibt vielleicht innen — das Gate ist konservativ und lehnt ab. Eine
    // Bezierkurve verlässt die konvexe Hülle ihrer Kontrollpunkte nie; umgekehrt gilt das nicht.
    const issues = checkBox(withPath('M 4 12 C 8 40 20 40 28 12'));
    expect(issues.length).toBeGreaterThan(0);
    expect(issues[0]?.detail).toContain('40');
  });

  it('prüft V gegen die Höhe und H gegen die Breite, nicht gegen beide Achsen', () => {
    // Der Nachweis, dass das Gate Koordinaten je Kommando liest: in einer schmalen, hohen Box
    // ist V 25 zulässig, obwohl 25 die Breite (8 mm) weit übersteigt. Ein Zahlenstrom-Leser
    // würde diesen validen Pfad ablehnen.
    const narrow: PictogramDefinition = {
      id: 'capability.fire-fighting',
      variant: 'primary',
      title: 'Schmal und hoch',
      box: { xMm: 2, yMm: 2, widthMm: 8, heightMm: 26 },
      primitives: [{ type: 'path', role: 'pictogram', d: 'M 2 2 V 25 H 4 Z' }],
    };
    expect(checkBox(narrow)).toEqual([]);
  });

  it('lehnt V ab, wenn der Wert die Höhe übersteigt', () => {
    const narrow: PictogramDefinition = {
      id: 'capability.fire-fighting',
      variant: 'primary',
      title: 'Schmal und hoch',
      box: { xMm: 2, yMm: 2, widthMm: 8, heightMm: 26 },
      primitives: [{ type: 'path', role: 'pictogram', d: 'M 2 2 V 29 Z' }],
    };
    const issues = checkBox(narrow);
    expect(issues).toHaveLength(1);
    expect(issues[0]?.detail).toContain('y');
  });

  it('fordert bei einer Definition ohne Pfade Gleichheit von Hülle und Box', () => {
    const tooLarge: PictogramDefinition = {
      id: 'capability.fire-fighting',
      variant: 'primary',
      title: 'Nur Linien, Box zu groß',
      box: { xMm: 1, yMm: 6, widthMm: 30, heightMm: 20 },
      primitives: [{ type: 'line', role: 'pictogram', x1: 3, y1: 16, x2: 26, y2: 16 }],
    };
    const issues = checkBox(tooLarge);
    expect(issues.length).toBeGreaterThan(0);
    expect(issues[0]?.detail).toContain('berechenbar');
  });

  it('nimmt eine Definition ohne Pfade an, deren Box genau der Hülle entspricht', () => {
    const exact: PictogramDefinition = {
      id: 'capability.fire-fighting',
      variant: 'primary',
      title: 'Nur Linien, Box exakt',
      box: { xMm: 3, yMm: 9, widthMm: 23, heightMm: 14 },
      primitives: [
        { type: 'line', role: 'pictogram', x1: 3, y1: 16, x2: 26, y2: 16 },
        { type: 'line', role: 'pictogram', x1: 16, y1: 16, x2: 26, y2: 9 },
        { type: 'line', role: 'pictogram', x1: 16, y1: 16, x2: 26, y2: 23 },
      ],
    };
    expect(checkBox(exact)).toEqual([]);
  });

  it('fordert bei gemischten Definitionen nur Enthaltung, nicht Gleichheit', () => {
    // Die Linienhülle (3…26 × 16…16) ist kleiner als die Box, weil diese auch den Pfad fassen
    // muss. Gleichheit zu fordern wäre hier unerfüllbar.
    const mixed: PictogramDefinition = {
      id: 'capability.fire-fighting',
      variant: 'primary',
      title: 'Linie und Pfad',
      box: { xMm: 3, yMm: 9, widthMm: 23, heightMm: 14 },
      primitives: [
        { type: 'line', role: 'pictogram', x1: 3, y1: 16, x2: 26, y2: 16 },
        { type: 'path', role: 'pictogram', d: 'M 3 9 L 26 23' },
      ],
    };
    expect(checkBox(mixed)).toEqual([]);
  });

  it('lehnt ein Nicht-Pfad-Primitiv ab, das aus der Box ragt', () => {
    const outside: PictogramDefinition = {
      id: 'capability.fire-fighting',
      variant: 'primary',
      title: 'Linie ragt heraus',
      box: { xMm: 4, yMm: 12, widthMm: 24, heightMm: 8 },
      primitives: [
        { type: 'path', role: 'pictogram', d: 'M 4 12 L 28 20' },
        { type: 'line', role: 'pictogram', x1: 4, y1: 12, x2: 30, y2: 12 },
      ],
    };
    const issues = checkBox(outside);
    expect(issues.length).toBeGreaterThan(0);
    expect(issues[0]?.detail).toContain('30');
  });

  it('hält Nicht-Pfad-Geometrie im Box-Vertrag von sichtbaren Strichen getrennt', () => {
    const onLeftBodyEdge: PictogramDefinition = {
      id: 'capability.fire-fighting',
      variant: 'primary',
      title: 'Strich auf der linken Körperkante',
      box: { xMm: 1, yMm: 6, widthMm: 30, heightMm: 20 },
      primitives: [
        { type: 'path', role: 'pictogram', d: 'M 1 6 L 31 26' },
        {
          type: 'group',
          style: { stroke: 'schwarz', strokeWidth: 0.5 },
          children: [{ type: 'line', role: 'pictogram', x1: 1, y1: 10, x2: 1, y2: 22 }],
        },
      ],
    };

    expect(checkBox(onLeftBodyEdge)).toEqual([]);
  });

  it('meldet keine Box-Verstöße für einen Pfad, den schon das Kommando-Gate ablehnt', () => {
    // Arbeitsteilung: die Kommandos eines abgelehnten Pfades sind nicht zerlegbar, und ein
    // zweiter Befund zum selben Fehler hilft dem Autor nicht.
    expect(checkBox(withPath('m 4 12 l 8 0'))).toEqual([]);
  });

  it('lehnt eine Transformation direkt am Pfad ab, statt Rohkoordinaten freizugeben', () => {
    const transformed: PictogramDefinition = {
      id: 'capability.fire-fighting',
      variant: 'primary',
      title: 'Transformierter Pfad',
      box: { xMm: 1, yMm: 6, widthMm: 10, heightMm: 10 },
      primitives: [
        {
          type: 'path',
          role: 'pictogram',
          d: 'M 2 7 L 8 7',
          // Die geschriebenen Koordinaten liegen in der Box; gerendert dreht der erste Punkt
          // jedoch auf x = 0 heraus. Ohne explizite Ablehnung wäre checkPictogram() falsch grün.
          transform: { rotate: { angle: 90, cx: 1, cy: 6 } },
        },
      ],
    };
    const boxIssues = checkBox(transformed);
    expect(boxIssues).toHaveLength(1);
    expect(boxIssues[0]?.detail).toContain('Transformation');
    expect(checkPictogram(transformed, formationBody).some((issue) => issue.gate === 'box')).toBe(
      true,
    );
  });

  it.each([
    ['negative Breite', { xMm: 18, yMm: 14, widthMm: -4, heightMm: 4 }],
    ['negative Höhe', { xMm: 14, yMm: 18, widthMm: 4, heightMm: -4 }],
    ['NaN-Koordinate', { xMm: Number.NaN, yMm: 14, widthMm: 4, heightMm: 4 }],
    ['unendliche Breite', { xMm: 14, yMm: 14, widthMm: Infinity, heightMm: 4 }],
  ] as const)('lehnt eine formal ungültige Box ab: %s', (_name, box) => {
    const definition = withBox(box);
    expect(checkBox(definition)[0]?.detail).toContain('Ungültige Piktogramm-Box');
    expect(checkClipping(definition, formationBody)[0]?.detail).toContain(
      'Ungültige Piktogramm-Box',
    );
    expect(new Set(checkPictogram(definition, formationBody).map((issue) => issue.gate))).toEqual(
      new Set(['box', 'clipping']),
    );
  });

  it('erlaubt eine Box mit Nullausdehnung, solange ihre Koordinate im Körper liegt', () => {
    const definition = withBox({ xMm: 16, yMm: 16, widthMm: 0, heightMm: 0 });
    expect(checkBox(definition)).toEqual([]);
    expect(checkClipping(definition, formationBody)).toEqual([]);
  });

  it('fordert bei Text Enthaltung statt Gleichheit', () => {
    // boxMm (die Textbox) ist echt kleiner als die Piktogramm-Box — Gleichheit wäre hier
    // unerfüllbar, obwohl die Definition fachlich korrekt ist. `boundsOfMm` liefert für Text nur
    // die deklarierte boxMm zurück (keine Messung), deshalb darf checkBox hier nur Enthaltung
    // verlangen (siehe measurableOf-Kommentar zur Zirkularitätsgefahr).
    const definition: PictogramDefinition = {
      id: 'capability.fire-fighting',
      variant: 'primary',
      title: 'Text kleiner als die Piktogramm-Box',
      box: { xMm: 4, yMm: 10, widthMm: 24, heightMm: 14 },
      primitives: [
        {
          type: 'text',
          role: 'pictogram',
          content: 'HRT',
          x: 16,
          y: 20,
          sizeMm: 10,
          anchor: 'middle',
          baseline: 'alphabetic',
          boxMm: { xMm: 6, yMm: 12, widthMm: 20, heightMm: 10 },
        },
      ],
    };
    expect(checkBox(definition)).toEqual([]);
  });

  it('meldet Text außerhalb der Piktogramm-Box', () => {
    // Dieselbe Textbox wie im Enthaltungstest, aber eine Piktogramm-Box, die sie nicht mehr fasst
    // (8x8 statt 24x14) — der eigentliche Nachweis, dass die Enthaltungsprüfung Text wirklich
    // gegen die deklarierte Box prüft und nicht bloß immer grün bleibt.
    const definition: PictogramDefinition = {
      id: 'capability.fire-fighting',
      variant: 'primary',
      title: 'Text außerhalb der Piktogramm-Box',
      box: { xMm: 10, yMm: 10, widthMm: 8, heightMm: 8 },
      primitives: [
        {
          type: 'text',
          role: 'pictogram',
          content: 'HRT',
          x: 16,
          y: 20,
          sizeMm: 10,
          anchor: 'middle',
          baseline: 'alphabetic',
          boxMm: { xMm: 6, yMm: 12, widthMm: 20, heightMm: 10 },
        },
      ],
    };
    const issues = checkBox(definition);
    expect(issues.length).toBeGreaterThan(0);
    expect(issues[0]!.gate).toBe('box');
  });

  it('lehnt eine formal ungültige Textbox ab, statt sie stillschweigend als enthalten zu werten', () => {
    // `boundsOfMm` gibt für Text `{ minX: xMm, maxX: xMm + widthMm, ... }` unverändert zurück
    // (keine Messung, siehe measurableOf-Kommentar) — bei `widthMm: -5` liegt `maxX` dadurch
    // LINKS von `minX`. `containmentDetails` prüft beide Werte unabhängig gegen die Achse und
    // bemerkt die Vertauschung nicht: mit Piktogramm-Box 0..32 liegen sowohl 20 (minX) als auch 15
    // (maxX) für sich innerhalb, die Prüfung würde ohne den Geometrie-Vorcheck fälschlich grün
    // bleiben, obwohl die Textbox strukturell ungültig ist — schwächer statt strenger, das
    // Gegenteil dessen, was ein Gate leisten soll. `rect` bekommt für denselben Fehler
    // (`widthMm < 0`) eine `invalid-geometry`-Meldung im viewBox-Gate; Text bislang keine.
    const definition: PictogramDefinition = {
      id: 'capability.fire-fighting',
      variant: 'primary',
      title: 'Textbox mit negativer Breite',
      box: { xMm: 0, yMm: 0, widthMm: 32, heightMm: 32 },
      primitives: [
        {
          type: 'text',
          role: 'pictogram',
          content: 'HRT',
          x: 20,
          y: 12,
          sizeMm: 4,
          anchor: 'start',
          baseline: 'alphabetic',
          boxMm: { xMm: 20, yMm: 10, widthMm: -5, heightMm: 4 },
        },
      ],
    };
    const issues = checkBox(definition);
    expect(issues).toHaveLength(1);
    expect(issues[0]?.gate).toBe('box');
    expect(issues[0]?.detail).toContain('Ungültige Textbox von "HRT"');
    expect(issues[0]?.detail).toContain('widthMm darf nicht negativ sein');
  });

  it('meldet gedrehten Text als box-Befund statt zu werfen', () => {
    // Der Primitivtyp erlaubt `transform.rotate` an Text, `checkViewBox` unterstützt ihn (dreht
    // die Ecken mit) und beide Renderer wenden ihn an — aber `boundsOfMm` lehnt Drehung von Text
    // ausdrücklich ab (siehe dort). Ohne diesen Guard würde `checkBox` hier einen rohen `Error`
    // werfen, den nur `checkPictogram`s BodyNotMeasuredError-Fang nicht auffängt (der ist an
    // `checkClipping` gebunden) — ein Programmierabbruch statt eines Befunds, dem Grundsatz dieser
    // Datei entgegen. Analog zum transformierten Pfad oben (`checkBox` meldet, statt zu werfen).
    const definition: PictogramDefinition = {
      id: 'capability.fire-fighting',
      variant: 'primary',
      title: 'Gedrehter Text',
      box: { xMm: 4, yMm: 12, widthMm: 24, heightMm: 8 },
      primitives: [
        {
          type: 'text',
          role: 'pictogram',
          content: 'HRT',
          x: 16,
          y: 16,
          sizeMm: 4,
          anchor: 'middle',
          baseline: 'alphabetic',
          boxMm: { xMm: 10, yMm: 13, widthMm: 12, heightMm: 5 },
          transform: { rotate: { angle: 15, cx: 16, cy: 16 } },
        },
      ],
    };
    expect(() => checkBox(definition)).not.toThrow();
    const issues = checkBox(definition);
    expect(issues).toHaveLength(1);
    expect(issues[0]?.gate).toBe('box');
    expect(issues[0]?.detail).toContain('Transformation');

    // checkPictogram fasst auch diesen Fall als Liste von Befunden zusammen statt abzubrechen.
    expect(() => checkPictogram(definition, formationBody)).not.toThrow();
    expect(checkPictogram(definition, formationBody).some((issue) => issue.gate === 'box')).toBe(
      true,
    );
  });
});

/** Der Körper der Taktischen Formation, wie `base-symbols.ts` ihn führt. */
const formationBody: Primitive = {
  type: 'rect',
  role: 'body',
  x: 1,
  y: 6,
  width: 30,
  height: 20,
};

/** Der Körper von `hazard`, wie `base-symbols.ts` ihn führt — ein Dreieck, keine Fläche. */
const hazardBody: Primitive = {
  type: 'polyline',
  role: 'body',
  closed: true,
  points: [
    [1, 28],
    [16, 3],
    [31, 28],
  ],
};

const personHalfSide = (15 * Math.SQRT2) / 2;
const personBody: Primitive = {
  type: 'rect',
  role: 'body',
  x: 16 - personHalfSide,
  y: 16 - personHalfSide,
  width: personHalfSide * 2,
  height: personHalfSide * 2,
  transform: { rotate: { angle: 45, cx: 16, cy: 16 } },
};

const postBody: Primitive = {
  type: 'circle',
  role: 'body',
  cx: 16,
  cy: 16,
  r: 14,
};

const openBody: Primitive = {
  type: 'polyline',
  role: 'body',
  points: [
    [1, 28],
    [16, 3],
    [31, 28],
  ],
};

describe('Clipping-Gate', () => {
  it('nimmt eine Box an, die vollständig im Körper liegt', () => {
    expect(checkClipping(withPath('M 4 12 L 28 20'), formationBody)).toEqual([]);
  });

  it('lehnt eine Box ab, die über den Körper hinausragt', () => {
    const tall: PictogramDefinition = {
      id: 'capability.fire-fighting',
      variant: 'primary',
      title: 'Box ragt oben heraus',
      box: { xMm: 4, yMm: 3, widthMm: 24, heightMm: 8 },
      primitives: [{ type: 'path', role: 'pictogram', d: 'M 4 3 L 28 11' }],
    };
    const issues = checkClipping(tall, formationBody);
    expect(issues.length).toBeGreaterThan(0);
    expect(issues[0]?.gate).toBe('clipping');
    expect(issues[0]?.detail).toContain('3');
  });

  it('nimmt eine Box an, deren Kante genau auf der Körperkante liegt', () => {
    const flush: PictogramDefinition = {
      id: 'capability.fire-fighting',
      variant: 'primary',
      title: 'Box auf der Körperkante',
      box: { xMm: 1, yMm: 6, widthMm: 30, heightMm: 20 },
      primitives: [{ type: 'path', role: 'pictogram', d: 'M 1 6 L 31 26' }],
    };
    expect(checkClipping(flush, formationBody)).toEqual([]);
  });

  it('meldet einen gestrichenen Pfad, dessen Box bündig an der Körperkante liegt', () => {
    const edgeStroke: PictogramDefinition = {
      id: 'capability.fire-fighting',
      variant: 'primary',
      title: 'Strich auf linker Körperkante',
      box: { xMm: 1, yMm: 6, widthMm: 30, heightMm: 20 },
      primitives: [
        {
          type: 'path',
          role: 'pictogram',
          d: 'M 1 10 L 1 22',
          style: { fill: 'none', stroke: 'schwarz', strokeWidth: 0.5 },
        },
      ],
    };

    expect(checkBox(edgeStroke)).toEqual([]);
    expect(checkClipping(edgeStroke, formationBody).some((issue) => issue.gate === 'clipping')).toBe(
      true,
    );
  });

  it('meldet eine aktive Piktogramm-Linie an der Körperkante, ohne den Box-Vertrag zu ändern', () => {
    const edgeLine: PictogramDefinition = {
      id: 'capability.fire-fighting',
      variant: 'primary',
      title: 'Linie auf linker Körperkante',
      box: { xMm: 1, yMm: 6, widthMm: 30, heightMm: 20 },
      primitives: [
        { type: 'path', role: 'pictogram', d: 'M 1 6 L 31 26', style: { stroke: 'none' } },
        {
          type: 'line',
          role: 'pictogram',
          x1: 1,
          y1: 10,
          x2: 1,
          y2: 22,
          style: { stroke: 'schwarz', strokeWidth: 0.5 },
        },
      ],
    };

    expect(checkBox(edgeLine)).toEqual([]);
    expect(checkClipping(edgeLine, formationBody)[0]?.detail).toContain('Sichtbare Box-Ecke');
  });

  it('erbt für ein rollenloses Definitionsblatt die Piktogrammrolle der Kompositionswurzel', () => {
    const rolelessEdgeStroke: PictogramDefinition = {
      id: 'capability.fire-fighting',
      variant: 'primary',
      title: 'Rollenloser Strich auf linker Körperkante',
      box: { xMm: 1, yMm: 6, widthMm: 30, heightMm: 20 },
      primitives: [
        {
          type: 'path',
          d: 'M 1 10 L 1 22',
          style: { fill: 'none', stroke: 'schwarz', strokeWidth: 2 },
        },
      ],
    };
    const catalog: CatalogPorts = {
      baseDrawing: () => ({ viewBox: DEFAULT_VIEWBOX_MM, children: [formationBody] }),
      organizationColor: () => {
        throw new Error('Für diesen Test nicht aufgerufen.');
      },
      strengthHead: () => {
        throw new Error('Für diesen Test nicht aufgerufen.');
      },
      pictogram: () => rolelessEdgeStroke,
    };

    // Reale Laufzeitsemantik: compose() hängt die unveränderten, rollenlosen Definitionen unter
    // genau eine Gruppe role:pictogram. Beide Renderer lösen danach `eigene Rolle ?? geerbte
    // Rolle` auf; der SVG-Nachweis des Butt/Round-Vertrags zeigt, dass dieses Blatt tatsächlich
    // als Piktogramm gerendert wird. checkClipping() muss dieselbe implizite Wurzelrolle ansetzen.
    const drawing = compose(
      { kind: 'formation', capabilities: ['fire-fighting'] },
      catalog,
    );
    const group = drawing.children.find(
      (primitive) => primitive.type === 'group' && primitive.role === 'pictogram',
    );
    expect(group?.type).toBe('group');
    if (group?.type !== 'group') throw new Error('compose() hat keine Piktogrammgruppe erzeugt.');
    expect(group.children[0]?.role).toBeUndefined();
    const svg = renderSvg(drawing);
    expect(svg).toContain('stroke-linecap="butt"');
    expect(svg).toContain('stroke-linejoin="round"');

    expect(checkClipping(rolelessEdgeStroke, formationBody)[0]?.detail).toContain(
      'Sichtbare Box-Ecke',
    );
  });

  it('vererbt die implizite Piktogrammrolle durch rollenlose Gruppen bis zum Blatt', () => {
    const nestedRolelessEdgeStroke: PictogramDefinition = {
      id: 'capability.fire-fighting',
      variant: 'primary',
      title: 'Verschachtelter rollenloser Strich auf linker Körperkante',
      box: { xMm: 1, yMm: 6, widthMm: 30, heightMm: 20 },
      primitives: [
        {
          type: 'group',
          style: { stroke: 'schwarz', strokeWidth: 2 },
          children: [{ type: 'path', d: 'M 1 10 L 1 22', style: { fill: 'none' } }],
        },
      ],
    };

    expect(checkClipping(nestedRolelessEdgeStroke, formationBody)[0]?.detail).toContain(
      'Sichtbare Box-Ecke',
    );
  });

  it.each(['body', 'innerField', 'head', 'foot'] satisfies readonly PrimitiveRole[])(
    'meldet die explizite Fremdrolle %s als Clipping-Befund',
    (role) => {
      const conflictingRole: PictogramDefinition = {
        id: 'capability.fire-fighting',
        variant: 'primary',
        title: `Piktogramm mit Fremdrolle ${role}`,
        box: { xMm: 4, yMm: 8, widthMm: 24, heightMm: 16 },
        primitives: [
          {
            type: 'path',
            role,
            d: 'M 4 8 L 28 24',
            style: { fill: 'none', stroke: 'schwarz', strokeWidth: 0.5 },
          },
        ],
      };

      const issues = checkClipping(conflictingRole, formationBody);
      expect(issues).toHaveLength(1);
      expect(issues[0]).toMatchObject({ gate: 'clipping', pictogramId: conflictingRole.id });
      expect(issues[0]?.detail).toContain(`Fremdrolle "${role}"`);
      expect(issues[0]?.detail).toContain('pictogram');
    },
  );

  it('akzeptiert eine explizite Piktogrammrolle weiterhin', () => {
    const explicitPictogramRole: PictogramDefinition = {
      id: 'capability.fire-fighting',
      variant: 'primary',
      title: 'Explizite Piktogrammrolle',
      box: { xMm: 4, yMm: 8, widthMm: 24, heightMm: 16 },
      primitives: [
        {
          type: 'path',
          role: 'pictogram',
          d: 'M 4 8 L 28 24',
          style: { fill: 'none', stroke: 'schwarz', strokeWidth: 2 },
        },
      ],
    };

    expect(checkClipping(explicitPictogramRole, formationBody)).toEqual([]);
  });

  it('berücksichtigt geerbte Rolle und Stil für Polylinien, aber nicht none oder reine Füllung', () => {
    const inheritedPolyline: PictogramDefinition = {
      id: 'capability.fire-fighting',
      variant: 'primary',
      title: 'Geerbte Piktogramm-Polylinie',
      box: { xMm: 1, yMm: 6, widthMm: 30, heightMm: 20 },
      primitives: [
        {
          type: 'group',
          role: 'pictogram',
          style: { stroke: 'schwarz' },
          children: [{ type: 'polyline', points: [[1, 10], [1, 22]] }],
        },
      ],
    };
    const noStroke: PictogramDefinition = {
      ...inheritedPolyline,
      title: 'Polylinie ohne Strich',
      primitives: [
        {
          type: 'group',
          role: 'pictogram',
          style: { stroke: 'schwarz', strokeWidth: 2 },
          children: [{ type: 'polyline', points: [[1, 10], [1, 22]], style: { stroke: 'none' } }],
        },
      ],
    };
    const fillOnly: PictogramDefinition = {
      ...inheritedPolyline,
      title: 'Gefülltes Rechteck ohne Strich',
      primitives: [
        {
          type: 'rect',
          role: 'pictogram',
          x: 1,
          y: 10,
          width: 2,
          height: 12,
          style: { fill: 'schwarz' },
        },
      ],
    };
    const invalidWidth: PictogramDefinition = {
      ...inheritedPolyline,
      title: 'Linie mit ungültiger Breite',
      primitives: [
        {
          type: 'line',
          role: 'pictogram',
          x1: 1,
          y1: 10,
          x2: 1,
          y2: 22,
          style: { stroke: 'schwarz', strokeWidth: Number.NaN },
        },
      ],
    };

    expect(checkClipping(inheritedPolyline, formationBody)[0]?.detail).toContain('Sichtbare Box-Ecke');
    expect(checkClipping(noStroke, formationBody)).toEqual([]);
    expect(checkClipping(fillOnly, formationBody)).toEqual([]);
    expect(checkClipping(invalidWidth, formationBody)[0]?.detail).toContain('Strichstärke');
  });

  it('bewahrt den geplanten strokeCapability-Vertrag für eine zentrale Pfadbox', () => {
    const planned: PictogramDefinition = {
      id: 'capability.fire-fighting',
      variant: 'primary',
      title: 'Geplanter Standardfall',
      box: { xMm: 4, yMm: 8, widthMm: 24, heightMm: 16 },
      primitives: [
        {
          type: 'path',
          role: 'pictogram',
          d: 'M 4 8 L 28 24',
          style: { fill: 'none', stroke: 'schwarz', strokeWidth: 0.5 },
        },
      ],
    };

    expect(checkBox(planned)).toEqual([]);
    expect(checkClipping(planned, formationBody)).toEqual([]);
  });

  it('löst den Pfadstrichstil vor dem Clipping wie die Renderer feldweise auf', () => {
    const ownStrokeWins: PictogramDefinition = {
      id: 'capability.fire-fighting',
      variant: 'primary',
      title: 'Eigener Strich überschreibt Gruppe',
      box: { xMm: 1.75, yMm: 6.25, widthMm: 29, heightMm: 19.5 },
      primitives: [
        {
          type: 'group',
          style: { stroke: 'schwarz', strokeWidth: 2 },
          children: [
            {
              type: 'path',
              role: 'pictogram',
              d: 'M 1.75 10 L 1.75 22',
              style: { stroke: 'schwarz', strokeWidth: 0.5 },
            },
          ],
        },
      ],
    };
    const noStroke: PictogramDefinition = {
      ...ownStrokeWins,
      title: 'stroke none überschreibt Gruppe',
      box: { xMm: 1, yMm: 6, widthMm: 30, heightMm: 20 },
      primitives: [
        {
          type: 'group',
          style: { stroke: 'schwarz', strokeWidth: 2 },
          children: [
            {
              type: 'path',
              role: 'pictogram',
              d: 'M 1 10 L 1 22',
              style: { stroke: 'none' },
            },
          ],
        },
      ],
    };
    const inheritedDefault: PictogramDefinition = {
      ...noStroke,
      title: 'Geerbter Defaultstrich',
      primitives: [
        {
          type: 'group',
          style: { stroke: 'schwarz' },
          children: [{ type: 'path', role: 'pictogram', d: 'M 1 10 L 1 22' }],
        },
      ],
    };
    const invalidWidth: PictogramDefinition = {
      ...inheritedDefault,
      title: 'Ungültige Strichstärke',
      primitives: [
        {
          type: 'path',
          role: 'pictogram',
          d: 'M 1 10 L 1 22',
          style: { stroke: 'schwarz', strokeWidth: -0.5 },
        },
      ],
    };

    expect(checkClipping(ownStrokeWins, formationBody)).toEqual([]);
    expect(checkClipping(noStroke, formationBody)).toEqual([]);
    expect(checkClipping(inheritedDefault, formationBody)[0]?.detail).toContain('Box-Ecke');
    expect(checkClipping(invalidWidth, formationBody)[0]?.detail).toContain('Strichstärke');
  });

  it.each([
    ['Rechteck', formationBody],
    ['Kreis', postBody],
    ['gedrehtes Rechteck', personBody],
    ['konvexes Polygon', hazardBody],
  ] as const)('nimmt eine zentrale Box im Körper %s an', (_name, body) => {
    expect(checkClipping(withBox({ xMm: 14, yMm: 14, widthMm: 4, heightMm: 4 }), body)).toEqual(
      [],
    );
  });

  it.each([
    ['Kreis', postBody, { xMm: 2, yMm: 2, widthMm: 1, heightMm: 1 }],
    ['Personendiamant', personBody, { xMm: 1, yMm: 1, widthMm: 1, heightMm: 1 }],
    ['Gefahrendreieck', hazardBody, { xMm: 1, yMm: 3, widthMm: 1, heightMm: 1 }],
  ] as const)(
    'lehnt beim %s eine Box ab, die nur in dessen achsparalleler Hülle liegt',
    (_name, body, box) => {
      const issues = checkClipping(withBox(box), body);
      expect(issues.length).toBeGreaterThan(0);
      expect(issues[0]?.gate).toBe('clipping');
      expect(issues[0]?.detail).toContain('Box-Ecke');
    },
  );

  it('nimmt beim Kreis eine Box an, deren äußerste Ecke exakt auf dem Rand liegt', () => {
    const side = 14 / Math.SQRT2;
    expect(
      checkClipping(withBox({ xMm: 16, yMm: 16, widthMm: side, heightMm: side }), postBody),
    ).toEqual([]);
  });

  it('nimmt beim Personendiamanten eine Box an, deren äußerste Ecke exakt auf dem Rand liegt', () => {
    expect(
      checkClipping(withBox({ xMm: 16, yMm: 16, widthMm: 7.5, heightMm: 7.5 }), personBody),
    ).toEqual([]);
  });

  it('invertiert die Drehrichtung an einem asymmetrischen Rechteck korrekt', () => {
    const body: Primitive = {
      type: 'rect',
      role: 'body',
      x: 10,
      y: 14,
      width: 12,
      height: 4,
      transform: { rotate: { angle: 30, cx: 16, cy: 16 } },
    };
    // Lokaler Innenpunkt (20,16), vorwärts um +30° gedreht. Eine irrtümliche Inversion mit
    // +30° statt -30° bildet ihn auf y ≈ 19,46 ab und würde diese Box ablehnen.
    const centerX = 16 + 4 * Math.cos(Math.PI / 6);
    const centerY = 16 + 4 * Math.sin(Math.PI / 6);
    expect(
      checkClipping(
        withBox({ xMm: centerX - 0.05, yMm: centerY - 0.05, widthMm: 0.1, heightMm: 0.1 }),
        body,
      ),
    ).toEqual([]);
  });

  it('behandelt ein konvexes Polygon in beiden Umlaufrichtungen gleich', () => {
    if (hazardBody.type !== 'polyline') throw new Error('Testfixture ist keine Polylinie.');
    const reversed: Primitive = { ...hazardBody, points: [...hazardBody.points].reverse() };
    const definition = withBox({ xMm: 14, yMm: 14, widthMm: 4, heightMm: 4 });
    expect(checkClipping(definition, hazardBody)).toEqual([]);
    expect(checkClipping(definition, reversed)).toEqual([]);
  });

  it.each([
    ['offene Polylinie', openBody],
    [
      'konkaves Polygon',
      {
        type: 'polyline',
        closed: true,
        points: [
          [0, 0],
          [10, 0],
          [5, 5],
          [10, 10],
          [0, 10],
        ],
      } satisfies Primitive,
    ],
    [
      'selbstüberschneidendes Polygon',
      {
        type: 'polyline',
        closed: true,
        points: [
          [0, 0],
          [10, 10],
          [0, 10],
          [10, 0],
        ],
      } satisfies Primitive,
    ],
    [
      'entartetes Polygon',
      {
        type: 'polyline',
        closed: true,
        points: [
          [0, 0],
          [5, 5],
          [10, 10],
        ],
      } satisfies Primitive,
    ],
    [
      'gerundetes Rechteck',
      { type: 'rect', x: 1, y: 1, width: 30, height: 30, rx: 2 } satisfies Primitive,
    ],
    [
      'verschobenes Körperblatt',
      {
        type: 'rect',
        x: 1,
        y: 1,
        width: 30,
        height: 30,
        transform: { translate: { dxMm: 1, dyMm: 1 } },
      } satisfies Primitive,
    ],
  ] as const)('lehnt die nicht vermessene Fläche %s explizit ab', (_name, body) => {
    expect(() =>
      checkClipping(withBox({ xMm: 4, yMm: 4, widthMm: 8, heightMm: 8 }), body),
    ).toThrow(BodyNotMeasuredError);
  });

  it('lehnt einen mehrfach notierten Polygonumlauf als nicht einfach ab', () => {
    const doubled: Primitive = {
      type: 'polyline',
      role: 'body',
      closed: true,
      points: [
        [1, 28],
        [16, 3],
        [31, 28],
        [1, 28],
        [16, 3],
        [31, 28],
      ],
    };
    expect(() =>
      checkClipping(withBox({ xMm: 14, yMm: 14, widthMm: 4, heightMm: 4 }), doubled),
    ).toThrow(/mehrfach/);
  });

  it('nimmt eine Textbox an, die vollständig im Körper liegt', () => {
    const definition: PictogramDefinition = {
      id: 'capability.fire-fighting',
      variant: 'primary',
      title: 'Text im Körper',
      box: { xMm: 4, yMm: 12, widthMm: 24, heightMm: 8 },
      primitives: [
        {
          type: 'text',
          role: 'pictogram',
          content: 'OK',
          x: 16,
          y: 18,
          sizeMm: 4,
          anchor: 'middle',
          baseline: 'alphabetic',
          boxMm: { xMm: 10, yMm: 14, widthMm: 12, heightMm: 4 },
        },
      ],
    };
    expect(checkClipping(definition, formationBody)).toEqual([]);
  });

  it('meldet eine Textbox, die über den Körper hinausragt', () => {
    // boxMm beginnt bei y = 0, der Körper (formationBody) erst bei y = 6 — die Textbox ragt oben
    // heraus. definition.box selbst liegt bewusst im Körper, damit der Befund eindeutig von der
    // Textbox stammt und nicht von der bereits an anderer Stelle geprüften Gesamt-Box.
    const definition: PictogramDefinition = {
      id: 'capability.fire-fighting',
      variant: 'primary',
      title: 'Text ragt oben aus dem Körper',
      box: { xMm: 4, yMm: 12, widthMm: 24, heightMm: 8 },
      primitives: [
        {
          type: 'text',
          role: 'pictogram',
          content: 'X',
          x: 16,
          y: 3,
          sizeMm: 4,
          anchor: 'middle',
          baseline: 'alphabetic',
          boxMm: { xMm: 10, yMm: 0, widthMm: 12, heightMm: 4 },
        },
      ],
    };
    const issues = checkClipping(definition, formationBody);
    expect(issues.length).toBeGreaterThan(0);
    expect(issues[0]?.gate).toBe('clipping');
    expect(issues[0]?.detail).toContain('Textbox');
  });

  it('lässt eine gesetzte Textstrichstärke die Piktogramm-Box nicht aufblähen', () => {
    // Ohne die Ausnahme in pictogramStrokeWidths würde der gesetzte 4-mm-Strich auf dem Text eine
    // halbe Strichbreite von 2 mm auf die gesamte Piktogramm-Box aufschlagen — obwohl weder SVG
    // noch Canvas Text je stricheln (siehe svg.ts fillOnly, canvas.ts ohne strokeText). Die Box
    // liegt hier bündig am Körper (wie im Flush-Test oben ohne Text): mit dem Fix bleibt
    // halfStroke 0 und die Prüfung bleibt grün; ohne den Fix würde sie über den Körper hinausragen.
    const definition: PictogramDefinition = {
      id: 'capability.fire-fighting',
      variant: 'primary',
      title: 'Text mit Strichstil, Box bündig am Körper',
      box: { xMm: 1, yMm: 6, widthMm: 30, heightMm: 20 },
      primitives: [
        { type: 'path', role: 'pictogram', d: 'M 1 6 L 31 26' },
        {
          type: 'text',
          role: 'pictogram',
          content: 'X',
          x: 16,
          y: 16,
          sizeMm: 4,
          anchor: 'middle',
          baseline: 'alphabetic',
          boxMm: { xMm: 12, yMm: 12, widthMm: 8, heightMm: 6 },
          style: { stroke: 'schwarz', strokeWidth: 4 },
        },
      ],
    };
    expect(checkClipping(definition, formationBody)).toEqual([]);
  });

  it('lehnt eine transformierte Gruppe um Text ab, auch wenn checkClipping unabhängig von checkBox läuft', () => {
    // checkClipping ruft measurableOf nie auf (siehe die Kommentare dort und an textsOf) — ohne
    // einen eigenen Guard in textsOf würde eine transformierte Elterngruppe hier still ignoriert:
    // text.boxMm käme unverschoben zur Prüfung, ein falscher Befund oder eine falsche
    // Nichterkennung, aber kein Fehler. Der Test ruft deshalb checkClipping direkt auf, nicht über
    // checkPictogram/checkBox, um den unabhängigen Aufrufpfad tatsächlich zu treffen.
    const groupedText: PictogramDefinition = {
      id: 'capability.fire-fighting',
      variant: 'primary',
      title: 'Text in transformierter Gruppe',
      box: { xMm: 4, yMm: 12, widthMm: 24, heightMm: 8 },
      primitives: [
        {
          type: 'group',
          transform: { translate: { dxMm: 2, dyMm: 0 } },
          children: [
            {
              type: 'text',
              role: 'pictogram',
              content: 'X',
              x: 16,
              y: 16,
              sizeMm: 4,
              anchor: 'middle',
              baseline: 'alphabetic',
              boxMm: { xMm: 10, yMm: 12, widthMm: 8, heightMm: 6 },
            },
          ],
        },
      ],
    };
    expect(() => checkClipping(groupedText, formationBody)).toThrow(/Transformation/);
  });
});

describe('checkPictogram', () => {
  it.each([
    ['U+00A0', '\u00a0'],
    ['U+2003', '\u2003'],
    ['U+2028', '\u2028'],
    ['U+000B', '\u000b'],
  ])('meldet Nicht-SVG-Whitespace %s genau einmal als Kommando-Befund', (_name, whitespace) => {
    const issues = checkPictogram(withPath(`M 4${whitespace}12 L 28 20`), formationBody);
    expect(issues).toHaveLength(1);
    expect(issues[0]).toMatchObject({ gate: 'command' });
  });

  it.each(['', 'L 4 12', 'Z', 'M 4 12', 'M 4 12 Z', 'M 4 12 L 4 12'])(
    'meldet den nicht rendernden Pfad %j genau einmal als Kommando-Befund',
    (d) => {
      const issues = checkPictogram(withPath(d), formationBody);
      expect(issues).toHaveLength(1);
      expect(issues[0]).toMatchObject({ gate: 'command' });
    },
  );

  it.each(['M,4 12 L 28 20', 'M 4,,12 L 28 20'])(
    'meldet den ungültigen Pfadseparator in %s genau einmal als Kommando-Befund',
    (d) => {
      const issues = checkPictogram(withPath(d), formationBody);
      expect(issues).toHaveLength(1);
      expect(issues[0]).toMatchObject({
        gate: 'command',
        pictogramId: 'capability.fire-fighting',
      });
      expect(issues[0]?.detail).toContain('Unzulässiger Pfadseparator');
    },
  );

  it('führt die drei Gates zusammen und meldet Befunde aller drei', () => {
    const broken: PictogramDefinition = {
      id: 'capability.fire-fighting',
      variant: 'primary',
      title: 'Dreifach kaputt',
      // Box ragt über den Körper (y ab 3), und die Linie liegt außerhalb der Box.
      box: { xMm: 4, yMm: 3, widthMm: 24, heightMm: 8 },
      primitives: [
        { type: 'path', role: 'pictogram', d: 'm 4 3 l 24 8' },
        { type: 'line', role: 'pictogram', x1: 4, y1: 3, x2: 30, y2: 3 },
      ],
    };
    const gates = new Set(checkPictogram(broken, formationBody).map((issue) => issue.gate));
    expect(gates).toEqual(new Set(['command', 'box', 'clipping']));
  });

  it('meldet nichts für ein Piktogramm, das alle drei Gates besteht', () => {
    expect(checkPictogram(withPath('M 4 12 C 8 20 20 20 28 12 Z'), formationBody)).toEqual([]);
  });

  it('bewahrt Kommando- und Box-Befunde, wenn das Clipping-Gate wirft', () => {
    // Der Körper (openBody, eine offene Polylinie) ist nicht vermessen — checkClipping wirft. Würde
    // checkPictogram den Wurf durchreichen, gingen die bereits berechneten Kommando- und
    // Box-Befunde verloren: genau das widerspräche dem Grundsatz dieser Datei, alle Verstöße
    // auf einmal zu melden.
    const broken: PictogramDefinition = {
      id: 'capability.fire-fighting',
      variant: 'primary',
      title: 'Kommando- und Box-Verstoß, Körper nicht vermessen',
      box: { xMm: 4, yMm: 12, widthMm: 24, heightMm: 8 },
      primitives: [
        { type: 'path', role: 'pictogram', d: 'm 4 12 l 24 8' },
        { type: 'line', role: 'pictogram', x1: 4, y1: 12, x2: 30, y2: 12 },
      ],
    };
    const issues = checkPictogram(broken, openBody);
    const gates = new Set(issues.map((issue) => issue.gate));
    expect(gates).toEqual(new Set(['command', 'box', 'clipping']));
    const clippingIssue = issues.find((issue) => issue.gate === 'clipping');
    expect(clippingIssue?.detail).toContain('nicht vermessen');
  });

  it('reicht ungültige Körpergeometrie durch, statt sie als Befund zu melden', () => {
    // checkClipping hat einen erwarteten Wurfpfad (BodyNotMeasuredError für eine nicht
    // vermessene Körperfläche). Um zu belegen, dass checkPictogram jeden ANDEREN Fehler
    // durchreicht statt ihn wie eine BodyNotMeasuredError einzusammeln, wird hier ein
    // Programmierfehler nachgestellt: ein Körper, dessen `width` zur Laufzeit kein `Length`
    // (Zahl) ist, obwohl der Typ es zusichert. Die normale Geometrievalidierung meldet ihn als
    // ungültigen Körper und nicht als bloß noch nicht vermessene, fachlich unterstützbare Form.
    const malformedBody: Primitive = {
      type: 'rect',
      role: 'body',
      x: 1,
      y: 6,
      width: Symbol('nicht vermessbar, Programmierfehler') as unknown as number,
      height: 20,
    };
    expect(() => checkPictogram(withPath('M 4 12 L 28 20'), malformedBody)).toThrow(
      /Ungültige Körpergeometrie/,
    );
  });
});

/** Ein Textprimitiv wie „HRT" aus Anhang J: Schriftgrad 10 mm auf der 32-mm-Standard-viewBox. */
function withText(content: string): PictogramDefinition {
  return withTextSize(content, 10);
}

/** Wie `withText`, aber mit frei wählbarem Schriftgrad — für die Schwellenwert-Randfälle. */
function withTextSize(content: string, sizeMm: number): PictogramDefinition {
  return {
    id: 'capability.fire-fighting',
    variant: 'primary',
    title: content,
    box: { xMm: 2, yMm: 12, widthMm: 28, heightMm: 10 },
    primitives: [
      {
        type: 'text',
        role: 'pictogram',
        content,
        x: 16,
        y: 20,
        sizeMm,
        anchor: 'middle',
        baseline: 'alphabetic',
        boxMm: { xMm: 2, yMm: 12, widthMm: 28, heightMm: 10 },
      },
    ],
  };
}

describe('Text-Legibility-Gate', () => {
  // Bei 10 mm Schriftgrad auf der 32-mm-viewBox ergibt eine 16-px-Rendergröße einen effektiven
  // Schriftgrad von 5,0 px — deutlich unter MINIMUM_TEXT_RENDER_PX (siehe text-policy.ts, Step 1
  // dieser Task: visuell geprüft, nicht nur nachgerechnet).
  it('meldet unterhalb der Schwelle genau einen Befund mit Zeichen, Rendergröße und Pixelwert', () => {
    const issues = checkTextLegibility(withText('HRT'), [16]);
    expect(issues).toHaveLength(1);
    expect(issues[0]).toMatchObject({
      gate: 'text-legibility',
      pictogramId: 'capability.fire-fighting',
      variant: 'primary',
    });
    expect(issues[0]!.detail).toContain('HRT');
    expect(issues[0]!.detail).toContain('16');
    expect(issues[0]!.detail).toContain('5');
  });

  // Dieselbe Definition, aber bei 32 px Rendergröße (effektiv 10,0 px) — oberhalb der Schwelle
  // meldet das Gate nichts.
  it('meldet nichts oberhalb der Schwelle', () => {
    expect(checkTextLegibility(withText('HRT'), [32])).toEqual([]);
  });

  it('prüft jede Rendergröße einzeln, statt nur die kleinste oder größte zu bewerten', () => {
    const issues = checkTextLegibility(withText('VoIP'), [16, 24, 32, 64, 128, 256]);
    // 16 px (5,0 px effektiv) und 24 px (7,5 px effektiv) liegen unter der Schwelle, die vier
    // größeren Snapshotgrößen darüber — siehe die Bildreihe aus Step 1.
    expect(issues.map((issue) => issue.detail)).toEqual([
      expect.stringContaining('16'),
      expect.stringContaining('24'),
    ]);
  });

  it('meldet keinen Befund für ein Piktogramm ohne Textprimitive', () => {
    expect(checkTextLegibility(withPath('M 4 12 L 28 20'), [16, 24, 32])).toEqual([]);
  });

  it('formuliert den Befund als dokumentierte Einsatzgrenze, nicht als Fehler des Zeichens', () => {
    const [issue] = checkTextLegibility(withText('HRT'), [16]);
    expect(issue!.detail).not.toMatch(/kaputt|fehlerhaft|defekt/i);
    expect(issue!.detail).toContain(String(MINIMUM_TEXT_RENDER_PX));
  });

  it('behandelt die Schwelle als Untergrenze: genau MINIMUM_TEXT_RENDER_PX zählt noch als lesbar', () => {
    // sizeMm = MINIMUM_TEXT_RENDER_PX auf der 32-mm-viewBox bei 32 px Rendergröße ergibt exakt
    // effectiveTextPx === MINIMUM_TEXT_RENDER_PX. Pins die >=-Konvention: ein Umschlag auf ">"
    // würde hier fälschlich einen Befund melden.
    expect(
      checkTextLegibility(withTextSize('HRT', MINIMUM_TEXT_RENDER_PX), [32]),
    ).toEqual([]);
  });

  it('meldet knapp unterhalb der Schwelle weiterhin einen Befund', () => {
    const issues = checkTextLegibility(withTextSize('HRT', MINIMUM_TEXT_RENDER_PX - 0.1), [32]);
    expect(issues).toHaveLength(1);
    expect(issues[0]!.gate).toBe('text-legibility');
  });
});

/** Wie `withTextSize`, aber mit deklarierter unterer Einsatzgrenze am Textlauf. */
function withTextFloor(
  content: string,
  sizeMm: number,
  minRenderPx: number,
): PictogramDefinition {
  const definition = withTextSize(content, sizeMm);
  return {
    ...definition,
    primitives: definition.primitives.map((primitive) =>
      primitive.type === 'text' ? { ...primitive, minRenderPx } : primitive,
    ),
  };
}

describe('Deklarierte Einsatzgrenze eines Textlaufs', () => {
  // Die Kürzel aus Anhang J messen zwischen 4,1 und 10,3 mm. Bei keiner dieser Größen erreicht
  // ein Zeichen die 16-px-Snapshotgröße lesbar — „HRT" müsste dafür 16 mm groß sein und wäre
  // damit breiter als die viewBox. Ohne eine deklarierbare Untergrenze wäre jedes typografische
  // Zeichen des Anhangs J dauerhaft im Befund.
  it('überspringt Rendergrößen unterhalb der deklarierten Grenze', () => {
    expect(checkTextLegibility(withTextFloor('HRT', 10, 32), [16, 24, 32])).toEqual([]);
  });

  it('prüft ab der deklarierten Grenze einschließlich', () => {
    // 4 mm Schriftgrad ergeben bei 32 px Rendergröße 4,0 px effektiv — unter der Schwelle. Die
    // Grenze ist kein Freibrief: im beanspruchten Einsatzbereich gilt MINIMUM_TEXT_RENDER_PX
    // unverändert, sonst könnte ein Autor jeden Befund wegdeklarieren.
    const issues = checkTextLegibility(withTextFloor('VoIP', 4, 32), [32]);
    expect(issues).toHaveLength(1);
    expect(issues[0]!.gate).toBe('text-legibility');
  });

  it('entscheidet je Textlauf und nicht je Zeichen', () => {
    // J.3.15 trägt zwei Läufe verschiedener Größe. Eine Grenze je Zeichen zwänge beide auf den
    // Wert des schwächeren Laufs und verlöre damit genau die Aussage, die sie festhalten soll.
    const zweiLaeufe = withTextFloor('VoIP', 10, 32);
    const definition: PictogramDefinition = {
      ...zweiLaeufe,
      primitives: [
        ...zweiLaeufe.primitives,
        { ...(zweiLaeufe.primitives[0] as Primitive & { type: 'text' }), content: 'HRT', minRenderPx: undefined },
      ],
    };
    const issues = checkTextLegibility(definition, [16]);
    expect(issues).toHaveLength(1);
    expect(issues[0]!.detail).toContain('HRT');
  });
});
