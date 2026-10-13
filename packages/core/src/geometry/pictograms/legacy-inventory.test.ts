import { describe, expect, it } from 'vitest';
import { LEGACY_COMMS_IDS, LEGACY_SITE_IDS, type Primitive } from '@einsatzzeichen/schema';
import { ALL_PICTOGRAMS, LEGACY_PICTOGRAMS, isLegacyPictogram, pictogram } from './index.js';

/**
 * Das Register der Altzeichen (ESZ-137) als geschlossene Aussage: genau die Darstellungen aus
 * DV 102 Kapitel 8, die Anhang J nicht mehr führt, je über Funk (`primary`) und über Draht
 * (`alternative`), und der Sammelplatz für Betroffene aus 10.3.23, den die Baseline nur im Kreis
 * zeichnet (ESZ-139). Die Formtests halten die Bauregeln fest, die in den Modulkommentaren von
 * `comms/05-legacy-skk-2010.ts` und `sites/01-legacy-skk-2010.ts` vermessen sind.
 */

type Line = Extract<Primitive, { type: 'line' }>;

function lines(primitives: readonly Primitive[]): Line[] {
  return primitives.filter((primitive): primitive is Line => primitive.type === 'line');
}

function horizontal(primitives: readonly Primitive[]): Line[] {
  return lines(primitives).filter((line) => line.y1 === line.y2);
}

function vertical(primitives: readonly Primitive[]): Line[] {
  return lines(primitives).filter((line) => line.x1 === line.x2);
}

describe('Register der Altzeichen (DV 102, Kapitel 8 und 10.3)', () => {
  it('führt fünf Darstellungen: 8.5 und 8.6, je über Funk und über Draht, und 10.3.23', () => {
    expect(LEGACY_PICTOGRAMS.map((d) => [d.section, d.id, d.variant, d.title])).toEqual([
      ['8.5', 'comms.teleprinter-transmission', 'primary', 'Fernschreiben'],
      ['8.5', 'comms.teleprinter-transmission', 'alternative', 'Fernschreiben'],
      ['8.6', 'comms.still-image-transmission', 'primary', 'Festbildübertragung'],
      ['8.6', 'comms.still-image-transmission', 'alternative', 'Festbildübertragung'],
      ['10.3.23', 'site.affected-persons-assembly-point', 'primary', 'Sammelplatz für Betroffene'],
    ]);
  });

  it('deckt jede Kennung aus LEGACY_COMMS_IDS und LEGACY_SITE_IDS ab', () => {
    const ids = [...new Set(LEGACY_PICTOGRAMS.map((d) => d.id))];
    expect(ids).toEqual([
      ...LEGACY_COMMS_IDS.map((id) => `comms.${id}`),
      ...LEGACY_SITE_IDS.map((id) => `site.${id}`),
    ]);
  });

  it('belegt jede Darstellung an Quelle und Seite der Altquelle, nicht an einer Referenzdatei', () => {
    for (const definition of LEGACY_PICTOGRAMS) {
      expect(definition.source).toBe('skk-2010');
      expect(definition.page).toBe(definition.id.startsWith('site.') ? 40 : 27);
      expect('referenceAsset' in definition).toBe(false);
      expect(isLegacyPictogram(definition)).toBe(true);
    }
  });

  it('steht nur freistehend, mit dem Kontrastpaar der Verbindungsmarken', () => {
    for (const definition of LEGACY_PICTOGRAMS) {
      expect(definition.placement.mode).toBe('standalone');
      expect(definition.contrastPairs).toEqual([
        { foreground: 'schwarz', background: 'surface', context: 'Verbindungsmarke auf Ausgabeoberfläche' },
      ]);
    }
  });

  it('bleibt außerhalb von ALL_PICTOGRAMS und ist trotzdem über pictogram() erreichbar', () => {
    const baselineKeys = new Set(ALL_PICTOGRAMS.map((d) => `${d.id}#${d.variant}`));
    for (const definition of LEGACY_PICTOGRAMS) {
      expect(baselineKeys.has(`${definition.id}#${definition.variant}`)).toBe(false);
      expect(pictogram(definition.id, definition.variant)).toBe(definition);
    }
    expect(isLegacyPictogram(pictogram('comms.voice'))).toBe(false);
  });
});

describe('8.5 Fernschreiben: J.1.1 Sprache mit doppeltem Balken', () => {
  it('über Funk: J.1.1 unverändert und ein zweiter Balken 3 mm darüber', () => {
    const voice = pictogram('comms.voice').primitives;
    const teleprinter = pictogram('comms.teleprinter-transmission').primitives;
    expect(teleprinter.slice(1)).toEqual(voice);
    const [extra] = teleprinter;
    expect(extra).toEqual({ ...voice[0], y1: 10, y2: 10 });
  });

  it('über Draht: zwei Balken 3 mm auseinander, mittig um y = 16 wie J.1.1 über Draht', () => {
    const [wiredVoice] = pictogram('comms.voice', 'alternative').primitives;
    const bars = pictogram('comms.teleprinter-transmission', 'alternative').primitives;
    expect(bars).toEqual([
      { ...wiredVoice, y1: 14.5, y2: 14.5 },
      { ...wiredVoice, y1: 17.5, y2: 17.5 },
    ]);
  });
});

describe('8.6 Festbildübertragung: Gitter aus je vier Strichen', () => {
  it('über Funk: Gitter 14 mm (Teilung 3, Überstand 2,5) mittig über dem Zickzack von J.1.1', () => {
    const primitives = pictogram('comms.still-image-transmission').primitives;
    expect(horizontal(primitives).map((l) => [l.x1, l.x2, l.y1])).toEqual([
      [9, 23, 8],
      [9, 23, 11],
      [9, 23, 14],
      [9, 23, 17],
    ]);
    expect(vertical(primitives).map((l) => [l.x1, l.y1, l.y2])).toEqual([
      [11.5, 5.5, 19.5],
      [14.5, 5.5, 19.5],
      [17.5, 5.5, 19.5],
      [20.5, 5.5, 19.5],
    ]);
    const zigzag = primitives.at(-1);
    const [, voiceZigzag] = pictogram('comms.voice').primitives;
    expect(zigzag?.type).toBe('polyline');
    expect(zigzag?.type === 'polyline' && zigzag.points).toEqual(
      voiceZigzag?.type === 'polyline' && voiceZigzag.points.map(([x, y]) => [x, y + 5.5]),
    );
  });

  it('über Draht: Gitter 16,5 mm (Teilung 3,5, Überstand 3) mittig im Feld, ohne Zickzack', () => {
    const primitives = pictogram('comms.still-image-transmission', 'alternative').primitives;
    expect(primitives).toHaveLength(8);
    const offsets = [10.75, 14.25, 17.75, 21.25];
    expect(horizontal(primitives).map((l) => [l.x1, l.x2, l.y1])).toEqual(offsets.map((y) => [7.75, 24.25, y]));
    expect(vertical(primitives).map((l) => [l.x1, l.y1, l.y2])).toEqual(offsets.map((x) => [x, 7.75, 24.25]));
  });
});

describe('10.3.23 Sammelplatz für Betroffene: das Motiv aus F.3.12 ohne Kreis (ESZ-139)', () => {
  const primitives = pictogram('site.affected-persons-assembly-point').primitives;

  it('Stamm auf der Achse x = 16 bis zum Scheitel des V', () => {
    expect(vertical(primitives).map((l) => [l.x1, l.y1, l.y2])).toEqual([[16, 4.55, 21.95]]);
  });

  it('Doppelpfeil bei y = 8,8 mit gefüllten Spitzen, spiegelgleich zur Achse', () => {
    expect(horizontal(primitives).map((l) => [l.x1, l.x2, l.y1])).toEqual([[10.65, 21.35, 8.8]]);
    const heads = primitives.filter(
      (primitive): primitive is Extract<Primitive, { type: 'polyline' }> => primitive.type === 'polyline' && primitive.closed === true,
    );
    expect(heads.map((h) => h.points)).toEqual([
      [[7.7, 8.8], [10.65, 7.1], [10.65, 10.5]],
      [[24.3, 8.8], [21.35, 7.1], [21.35, 10.5]],
    ]);
    for (const h of heads) expect(h.style).toEqual({ fill: 'schwarz', stroke: 'schwarz', strokeWidth: 0.5 });
  });

  it('flaches V, rund 24° gegen die Waagerechte wie in der Vorlage', () => {
    const v = primitives.at(-1);
    expect(v?.type === 'polyline' && v.points).toEqual([[4.7, 26.95], [16, 21.95], [27.3, 26.95]]);
    const angle = (Math.atan2(26.95 - 21.95, 27.3 - 16) * 180) / Math.PI;
    expect(angle).toBeCloseTo(23.9, 0);
  });

  it('zeichnet anders als die Kreismarke der Baseline: ohne Kreis und mit gefüllten Spitzen', () => {
    expect(primitives.some((primitive) => primitive.type === 'circle')).toBe(false);
  });
});
