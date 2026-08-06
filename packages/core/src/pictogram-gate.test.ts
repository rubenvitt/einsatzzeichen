import { describe, expect, it } from 'vitest';
import type { PictogramDefinition, Primitive } from '@einsatzzeichen/schema';
import { checkBox, checkClipping, checkCommands, checkPictogram } from './pictogram-gate.js';

/** Ein Piktogramm mit genau einem Pfad, Box und Titel unverändert — nur der `d`-String variiert. */
function withPath(d: string): PictogramDefinition {
  return {
    id: 'capability.fire-fighting',
    title: 'Testpiktogramm',
    box: { xMm: 4, yMm: 12, widthMm: 24, heightMm: 8 },
    primitives: [{ type: 'path', role: 'pictogram', d, style: { fill: 'schwarz', stroke: 'none' } }],
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
      title: 'Pfad in Gruppe',
      box: { xMm: 4, yMm: 12, widthMm: 24, heightMm: 8 },
      primitives: [nested],
    };
    expect(checkCommands(definition)).toHaveLength(1);
  });

  it('meldet nichts für ein Piktogramm ohne Pfade', () => {
    const definition: PictogramDefinition = {
      id: 'capability.fire-fighting',
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
      title: 'Schmal und hoch',
      box: { xMm: 2, yMm: 2, widthMm: 8, heightMm: 26 },
      primitives: [{ type: 'path', role: 'pictogram', d: 'M 2 2 V 25 H 4 Z' }],
    };
    expect(checkBox(narrow)).toEqual([]);
  });

  it('lehnt V ab, wenn der Wert die Höhe übersteigt', () => {
    const narrow: PictogramDefinition = {
      id: 'capability.fire-fighting',
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

  it('meldet keine Box-Verstöße für einen Pfad, den schon das Kommando-Gate ablehnt', () => {
    // Arbeitsteilung: die Kommandos eines abgelehnten Pfades sind nicht zerlegbar, und ein
    // zweiter Befund zum selben Fehler hilft dem Autor nicht.
    expect(checkBox(withPath('m 4 12 l 8 0'))).toEqual([]);
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

describe('Clipping-Gate', () => {
  it('nimmt eine Box an, die vollständig im Körper liegt', () => {
    expect(checkClipping(withPath('M 4 12 L 28 20'), formationBody)).toEqual([]);
  });

  it('lehnt eine Box ab, die über den Körper hinausragt', () => {
    const tall: PictogramDefinition = {
      id: 'capability.fire-fighting',
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
      title: 'Box auf der Körperkante',
      box: { xMm: 1, yMm: 6, widthMm: 30, heightMm: 20 },
      primitives: [{ type: 'path', role: 'pictogram', d: 'M 1 6 L 31 26' }],
    };
    expect(checkClipping(flush, formationBody)).toEqual([]);
  });

  it('lehnt einen Körper ab, dessen Fläche nicht vermessen ist', () => {
    // Bei einem Polygon oder einem gedrehten Quadrat fällt Fläche und achsparallele Hülle nicht
    // zusammen: eine Box innerhalb der Hülle kann aus dem Dreieck ragen. Eine hüllenbasierte
    // Prüfung als Flächenprüfung auszugeben wäre genau die Behauptung, die dieses Projekt
    // vermeidet — dasselbe Muster wie `circleBodyProfile` und die Gruppendrehung in `boundsOfMm`.
    //
    // Belegt zugleich: `checkClipping` selbst wirft weiterhin uneingeschränkt — nur
    // `checkPictogram` fängt den Wurf (siehe checkPictogram-Suite unten). Die Semantik des
    // Gates bleibt unangetastet.
    expect(() => checkClipping(withPath('M 4 12 L 28 20'), hazardBody)).toThrow(/nicht vermessen/);
  });

  it('lehnt ein gedrehtes Rechteck als Körper ab', () => {
    const personBody: Primitive = {
      type: 'rect',
      role: 'body',
      x: 5.393,
      y: 5.393,
      width: 21.213,
      height: 21.213,
      transform: { rotate: { angle: 45, cx: 16, cy: 16 } },
    };
    expect(() => checkClipping(withPath('M 4 12 L 28 20'), personBody)).toThrow(/nicht vermessen/);
  });
});

describe('checkPictogram', () => {
  it('führt die drei Gates zusammen und meldet Befunde aller drei', () => {
    const broken: PictogramDefinition = {
      id: 'capability.fire-fighting',
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
    // Der Körper (hazardBody, ein Dreieck) ist nicht vermessen — checkClipping wirft. Würde
    // checkPictogram den Wurf durchreichen, gingen die bereits berechneten Kommando- und
    // Box-Befunde verloren: genau das widerspräche dem Grundsatz dieser Datei, alle Verstöße
    // auf einmal zu melden.
    const broken: PictogramDefinition = {
      id: 'capability.fire-fighting',
      title: 'Kommando- und Box-Verstoß, Körper nicht vermessen',
      box: { xMm: 4, yMm: 12, widthMm: 24, heightMm: 8 },
      primitives: [
        { type: 'path', role: 'pictogram', d: 'm 4 12 l 24 8' },
        { type: 'line', role: 'pictogram', x1: 4, y1: 12, x2: 30, y2: 12 },
      ],
    };
    const issues = checkPictogram(broken, hazardBody);
    const gates = new Set(issues.map((issue) => issue.gate));
    expect(gates).toEqual(new Set(['command', 'box', 'clipping']));
    const clippingIssue = issues.find((issue) => issue.gate === 'clipping');
    expect(clippingIssue?.detail).toContain('nicht vermessen');
  });
});
