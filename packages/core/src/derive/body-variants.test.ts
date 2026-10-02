import { describe, expect, it } from 'vitest';
import {
  BODY_VARIANT_IDS,
  SYMBOL_KINDS,
  type BodyVariantId,
  type Primitive,
  type SymbolKind,
  type SymbolSpec,
} from '@einsatzzeichen/schema';
import { boundsOfMm } from '../bounds.js';
import { drawSymbol } from '../default-ports.js';
import { baseDrawing, innerField } from '../geometry/base-symbols.js';
import { vehicleChassis } from '../geometry/vehicle-categories.js';
import { hasVariantProfile, profileFor } from '../layout/profiles.js';
import { NotMeasuredError } from '../not-measured.js';
import { CompositionError, validateSpec } from '../validate.js';
import {
  DERIVED_BODY_VARIANT_KINDS,
  MEASURED_BODY_VARIANT_KINDS,
  isAllowedBodyVariant,
  isDerivedBodyVariant,
} from './body-variant-pairs.js';
import { chainDistance, outlineOf, strokeChainsOf } from './outline.js';

/** Organisation, die die Art braucht, um die Validierung zu passieren. */
function minimalSpec(kind: SymbolKind, bodyVariant?: BodyVariantId): SymbolSpec {
  return {
    kind,
    ...(bodyVariant === undefined ? {} : { bodyVariant }),
    ...(kind === 'circle-12' || kind === 'reduced-house' ? { organization: 'hilfsorganisation' } : {}),
    ...(kind === 'vehicle-water' && bodyVariant === 'inset-hull' ? { organization: 'hilfsorganisation' } : {}),
  } as SymbolSpec;
}

const derivedPairs = SYMBOL_KINDS.flatMap((kind) =>
  BODY_VARIANT_IDS.filter((variant) => isDerivedBodyVariant(kind, variant))
    .map((variant) => [kind, variant] as const));

const measuredPairs = SYMBOL_KINDS.flatMap((kind) =>
  BODY_VARIANT_IDS.filter((variant) => MEASURED_BODY_VARIANT_KINDS[variant].has(kind))
    .map((variant) => [kind, variant] as const));

function bodyOf(kind: SymbolKind, variant?: BodyVariantId): Primitive {
  const body = baseDrawing(kind, variant).children.find((child) => child.role === 'body');
  if (body === undefined) throw new Error('kein Körper');
  return body;
}

function extrasOf(kind: SymbolKind, variant: BodyVariantId): readonly Primitive[] {
  return baseDrawing(kind, variant).children.filter((child) => child.role !== 'body');
}

describe('Zulassungstabelle der Körpervarianten', () => {
  it('überschneidet vermessene und abgeleitete Paare nicht', () => {
    for (const [variant, kinds] of Object.entries(DERIVED_BODY_VARIANT_KINDS)) {
      for (const kind of kinds ?? []) {
        expect(MEASURED_BODY_VARIANT_KINDS[variant as BodyVariantId].has(kind), `${kind}/${variant}`)
          .toBe(false);
      }
    }
  });

  it('lässt die artgebundenen Formen nur an ihrer Art zu', () => {
    for (const kind of SYMBOL_KINDS) {
      expect(isAllowedBodyVariant(kind, 'fixed-wing-hull'), kind).toBe(kind === 'vehicle-air');
      expect(isAllowedBodyVariant(kind, 'inset-hull'), kind).toBe(kind === 'vehicle-water');
      expect(isAllowedBodyVariant(kind, 'compact-person-diamond-26mm'), kind).toBe(kind === 'person');
      expect(isAllowedBodyVariant(kind, 'raised-hull'), kind)
        .toBe(kind === 'vehicle-air' || kind === 'vehicle-water');
    }
  });

  it('zählt mindestens die 35 abgeleiteten Paare dieses Umbaus (Kreiskörper kommen hinzu)', () => {
    expect(derivedPairs.length).toBeGreaterThanOrEqual(35);
  });
});

describe('abgeleitete Körpervarianten zeichnen', () => {
  it.each(derivedPairs)('%s / %s: gültig, mit eigenem Profil und Ableitungsnotiz', (kind, variant) => {
    const spec = minimalSpec(kind, variant);
    expect(validateSpec(spec)).toEqual([]);
    expect(hasVariantProfile(kind, variant)).toBe(true);
    const drawing = drawSymbol(spec);
    expect(drawing.derivations?.some((note) => note.dimension === 'bodyVariant')).toBe(true);
    for (const child of drawing.children) {
      const b = boundsOfMm(child);
      expect(b.minX).toBeGreaterThanOrEqual(-0.01);
      expect(b.minY).toBeGreaterThanOrEqual(-0.01);
      expect(b.maxX).toBeLessThanOrEqual(32.01);
      expect(b.maxY).toBeLessThanOrEqual(32.01);
    }
  });

  it('lässt jedes vermessene Paar und jede Grundart ohne Notiz', () => {
    for (const kind of SYMBOL_KINDS) {
      expect(drawSymbol(minimalSpec(kind)).derivations, kind).toBeUndefined();
    }
    let checked = 0;
    for (const [kind, variant] of measuredPairs) {
      const spec = minimalSpec(kind, variant);
      // `circle-12/raised-circle-1mm` ist nur mit seinem farbigen Markenvertrag gültig.
      if (validateSpec(spec).length > 0) continue;
      expect(drawSymbol(spec).derivations, `${kind}/${variant}`).toBeUndefined();
      checked += 1;
    }
    expect(checked).toBeGreaterThanOrEqual(13);
    expect(drawSymbol({
      kind: 'circle-12', bodyVariant: 'raised-circle-1mm',
      organization: 'zivile-einheiten', bodyMarks: ['circle-information-stem'],
    } as SymbolSpec).derivations).toBeUndefined();
  });

  it('lehnt eine artgebundene Form an einer fremden Art weiter mit Regel ab', () => {
    expect(() => drawSymbol({ kind: 'formation', bodyVariant: 'fixed-wing-hull' })).toThrow(CompositionError);
    expect(() => baseDrawing('formation', 'fixed-wing-hull')).toThrow(NotMeasuredError);
  });
});

describe('Fußband', () => {
  const band = (kind: SymbolKind): Primitive => {
    const found = extrasOf(kind, 'foot-band').at(-1);
    if (found === undefined) throw new Error('kein Band');
    return found;
  };

  it('ist am Rechteck das triviale Band an der Unterkante', () => {
    expect(band('container')).toMatchObject({ type: 'rect', x: 4, y: 25, width: 24, height: 3 });
    expect(band('upright-rectangle')).toMatchObject({ type: 'rect', x: 3, y: 27, width: 26, height: 3 });
    expect(band('swap-loader-vehicle')).toMatchObject({ type: 'rect', x: 2.5, y: 21.5, width: 28.5, height: 3 });
  });

  it('ist an der Raute ein Dreieck: 6 mm breit, 3 mm hoch, Spitze auf der Unterkante 31', () => {
    const b = boundsOfMm(band('person'));
    expect(b.minY).toBeCloseTo(28, 3);
    expect(b.maxY).toBeCloseTo(31, 3);
    expect(b.minX).toBeCloseTo(13, 3);
    expect(b.maxX).toBeCloseTo(19, 3);
  });

  it('ist am Wasserrumpf ein Kreisabschnitt unter dem Scheitel 24', () => {
    const b = boundsOfMm(band('vehicle-water'));
    expect(b.minY).toBeCloseTo(21, 3);
    expect(b.maxY).toBeCloseTo(24, 2);
    // Halbe Sehne bei 3 mm Höhe am Radius 15: √(15² − 12²) = 9.
    expect(b.maxX - b.minX).toBeCloseTo(18, 1);
  });

  it('bleibt an der Gefahr innerhalb der roten Strichinnenkante', () => {
    const b = boundsOfMm(band('hazard'));
    expect(b.minY).toBeCloseTo(25, 3);
    expect(b.maxY).toBeCloseTo(27.5, 3);
  });

  it('hebt die unteren Läufe über das Band (5 mm wie G.1.2)', () => {
    expect(profileFor('container', 'foot-band').bottomLabelBaselineFromBodyBottomMm).toBe(5);
    expect(profileFor('person', 'foot-band').bottomLabelBaselineFromBodyBottomMm).toBe(5);
  });

  it('verliert das Band nicht still in der Zustandsfassung der Gefahr', () => {
    // Seit der Zustandsableitung (derive/states.ts) wird das ganze Zeichen komponiert und als
    // Ganzes in die Zustandsfassung abgebildet: das Band wandert mit, statt zu fehlen.
    const plain = drawSymbol({ kind: 'hazard', bodyVariant: 'foot-band' });
    const withState = drawSymbol({ kind: 'hazard', bodyVariant: 'foot-band', states: ['suspected-situation'] });
    const bandOf = (drawing: typeof plain) => drawing.children.filter((child) => child.role !== 'body');
    expect(bandOf(plain)).toHaveLength(1);
    expect(bandOf(withState).length).toBeGreaterThan(bandOf(plain).length);
    expect(withState.derivations?.some((note) => note.dimension === 'bodyVariant')).toBe(true);
  });
});

describe('Radpaar und Kettenrumpf an Anhänger und Wechsellader', () => {
  const wheels = (kind: SymbolKind) => extrasOf(kind, 'plain-wheel-pair')
    .filter((child) => child.type === 'circle')
    .map((child) => (child.type === 'circle' ? [child.cx, child.cy, child.r] : []));

  it('ist am Landfahrzeug deckungsgleich mit Kategorie 1 (Grundlage der Übertragung)', () => {
    const category = vehicleChassis('kfz-kategorie-1').marks
      .map((mark) => (mark.type === 'wheel' ? [mark.cxMm, 26 + mark.cyFromTopMm, mark.rMm] : []));
    expect(wheels('vehicle-land')).toEqual(category);
  });

  it('übernimmt am Anhänger die Zweiradfassung, am Wechsellader Kategorie 1 unter dem Rahmen', () => {
    expect(wheels('trailer')).toEqual([[14.25, 28.25, 2.25], [19.75, 28.25, 2.25]]);
    expect(wheels('swap-loader-vehicle')).toEqual([[3.75, 28.25, 2.25], [28.25, 28.25, 2.25]]);
  });

  it('hält die Bezeichnung von den abgeleiteten Rädern fern', () => {
    expect(validateSpec({ kind: 'trailer', bodyVariant: 'plain-wheel-pair', designation: 'A' })
      .map((issue) => issue.rule)).toContain('body-variant-foot-conflict');
    expect(validateSpec({ kind: 'trailer', bodyVariant: 'plain-wheel-pair', vehicleCategory: 'anhaenger-ein-rad' })
      .map((issue) => issue.rule)).toContain('plain-wheel-pair-chassis-conflict');
  });

  it('streckt den Kettenrumpf wie die Deckkurve', () => {
    expect(boundsOfMm(bodyOf('trailer', 'inverted-hull-track'))).toEqual({
      minX: 4, minY: 6, maxX: 31, maxY: 25.75,
    });
    const swap = boundsOfMm(bodyOf('swap-loader-vehicle', 'inverted-hull-track'));
    expect(swap).toEqual({ minX: 2.5, minY: 6.25, maxX: 31, maxY: 24.25 });
  });

  it('hängt die Kette am Anhänger 0,25 mm unter die Rumpfecken wie N.1.1', () => {
    const drawing = drawSymbol({ kind: 'trailer', bodyVariant: 'inverted-hull-track', vehicleCategory: 'kettenfahrzeug' });
    const chassis = drawing.children.filter((child) => child.role === 'chassis');
    expect(boundsOfMm(chassis[0]!).minY).toBeCloseTo(26, 6);
  });
});

describe('Giebel an weiteren Grundzeichen', () => {
  const gablePairs = derivedPairs.filter(([, variant]) => variant === 'raised-gable');
  const clearance = (() => {
    const circle = bodyOf('circle-12', 'raised-gable');
    const gable = extrasOf('circle-12', 'raised-gable')[0]!;
    if (circle.type !== 'circle' || gable.type !== 'polyline') throw new Error('Vorlage');
    return chainDistance([[circle.cx, circle.cy], [circle.cx, circle.cy]], strokeChainsOf(gable)[0]!) - circle.r;
  })();

  it('rechnet den vermessenen Giebelabstand am 12-mm-Kreis: rund 1,47 mm', () => {
    expect(clearance).toBeCloseTo(1.4746, 3);
  });

  it.each(gablePairs)('%s: hält den Abstand, behält die Unterkante und den Giebel unverändert', (kind) => {
    const drawing = baseDrawing(kind, 'raised-gable');
    const gable = drawing.children.at(-1)!;
    expect(gable).toEqual(extrasOf('circle-12', 'raised-gable')[0]);
    const gableChain = strokeChainsOf(gable)[0]!;
    const body = bodyOf(kind, 'raised-gable');
    const ring = outlineOf(body);
    // Abgetasteter Umriss und gerundete Koordinaten: 0,01 mm Spiel.
    expect(chainDistance([...ring, ring[0]!], gableChain)).toBeGreaterThanOrEqual(clearance - 0.01);
    const base = baseDrawing(kind);
    const bottom = (children: readonly Primitive[]) =>
      Math.max(...children.map((child) => boundsOfMm(child).maxY));
    expect(bottom(drawing.children.slice(0, -1))).toBeCloseTo(bottom(base.children), 3);
  });

  it('verkleinert die Formation gleichmäßig und lässt sie ein Rechteck', () => {
    const body = bodyOf('formation', 'raised-gable');
    expect(body.type).toBe('rect');
    if (body.type !== 'rect') return;
    expect(body.width / body.height).toBeCloseTo(1.5, 3);
    expect(body.y + body.height).toBeCloseTo(26, 6);
    expect(body.x + body.width / 2).toBeCloseTo(16, 6);
  });

  it('gibt die Zone oberhalb des Körpers an den Giebel ab', () => {
    expect(profileFor('formation', 'raised-gable').aboveLeftBaselineFromBodyTopMm).toBeUndefined();
    expect(validateSpec({ kind: 'formation', bodyVariant: 'raised-gable', labels: { aboveLeft: 'A' } })
      .map((issue) => issue.rule)).toContain('above-left-label-requires-measured-body');
  });

  it('wirft für die Fahrwerkszone unter dem verkleinerten Fahrzeug, statt Räder überstehen zu lassen', () => {
    expect(() => drawSymbol({ kind: 'vehicle-land', bodyVariant: 'raised-gable', vehicleCategory: 'kfz-kategorie-1' }))
      .toThrow(NotMeasuredError);
  });
});

describe('weiße Innenkontur an abgeleiteten Körpern', () => {
  it('rückt Rechteck, Raute und Kreis um 1 mm ein', () => {
    const formation = innerField('formation', 'raised-gable')[0]!;
    const body = bodyOf('formation', 'raised-gable');
    if (formation.type !== 'rect' || body.type !== 'rect') throw new Error('Rechteck erwartet');
    expect(formation.x - body.x).toBeCloseTo(1, 4);
    expect(body.y + body.height - (formation.y + formation.height)).toBeCloseTo(1, 4);

    const person = innerField('person')[0]!;
    expect(person).toMatchObject({ type: 'rect', transform: { rotate: { angle: 45, cx: 16, cy: 16 } } });
    if (person.type === 'rect') expect(person.width).toBeCloseTo(15 * Math.SQRT2 - 2, 4);

    expect(innerField('post')[0]).toMatchObject({ type: 'circle', cx: 16, cy: 16, r: 13 });
    expect(innerField('circle-12', 'raised-gable')[0]).toMatchObject({ type: 'circle', cy: 18, r: 11 });
  });

  it('hält am 1-mm-Strich der Gefahr dasselbe weiße Band von 0,75 mm', () => {
    const field = innerField('hazard')[0]!;
    // Unterkante 28 (Mittellinie) − 0,5 (halber Strich) − 0,75 (Weiß).
    expect(boundsOfMm(field).maxY).toBeCloseTo(26.75, 4);
  });

  it('übernimmt das vermessene Feld, wo die Variante den Körper der Grundart teilt', () => {
    expect(innerField('formation', 'foot-band')).toBe(innerField('formation'));
    expect(innerField('trailer', 'plain-wheel-pair')).toBe(innerField('trailer'));
  });

  it('spart an Gebäude und reduzierter Hauskontur die Traufe aus', () => {
    expect(innerField('building', 'raised-gable')).toHaveLength(2);
    const [roof, wall] = innerField('reduced-house');
    expect(boundsOfMm(roof!).maxY).toBeCloseTo(9, 4);
    expect(boundsOfMm(wall!).minY).toBeCloseTo(11, 4);
  });

  it('zeichnet die Innenkontur an jeder flächigen Art und meldet sie als abgeleitet', () => {
    for (const kind of ['person', 'area', 'spontaneous-helper', 'vehicle-air', 'point'] as const) {
      const drawing = drawSymbol({ kind, technicalFill: 'rot', whiteInnerContour: true });
      expect(drawing.children.some((child) => child.role === 'innerField'), kind).toBe(true);
      expect(drawing.derivations?.some((note) => note.dimension === 'whiteInnerContour'), kind).toBe(true);
    }
    expect(drawSymbol({ kind: 'formation', technicalFill: 'rot', whiteInnerContour: true }).derivations)
      .toBeUndefined();
  });

  it('wirft nur am offenen Ereignis', () => {
    expect(() => innerField('event')).toThrow(NotMeasuredError);
  });
});
