/**
 * ESZ-132: der Lauf „P“/„G“ der Dekontamination steht an der Marke, nicht am Körperprofil
 * (`geometry/body-mark-runs.ts`, `bodyMarkRun` in `derive/body-marks.ts`).
 */
import type { Primitive, SymbolSpec } from '@einsatzzeichen/schema';
import { describe, expect, it } from 'vitest';
import { boundsOfMm, type BoundsMm } from '../bounds.js';
import { drawSymbol } from '../default-ports.js';
import { bodyBoundsMm } from './body-bounds.js';
import { bodyMarkRun } from './body-marks.js';

type Text = Extract<Primitive, { type: 'text' }>;

const textOf = (spec: SymbolSpec): Text => {
  const texts = drawSymbol(spec).children.filter((child): child is Text => child.type === 'text');
  expect(texts).toHaveLength(1);
  return texts[0]!;
};

const marksOf = (spec: SymbolSpec): BoundsMm[] =>
  drawSymbol(spec).children.filter((child) => child.role === 'pictogram').map((child) => boundsOfMm(child));

const hull = (spec: SymbolSpec): BoundsMm =>
  boundsOfMm(drawSymbol(spec).children.find((child) => child.role === 'body')!);

describe('vermessene Paare', () => {
  it('setzt den Lauf in der Formation wie C.1.8 und C.1.10', () => {
    expect(bodyMarkRun('decontamination', { kind: 'formation' }, bodyBoundsMm('formation'))).toEqual({
      baselineFromBodyBottomMm: 3,
      capHeightMm: 4.87,
    });
  });

  it('setzt ihn am Landfahrzeug wie C.2.25 und C.2.25#alternative', () => {
    const bounds = bodyBoundsMm('vehicle-land');
    expect(bodyMarkRun('decontamination', { kind: 'vehicle-land' }, bounds)).toEqual({
      anchorFromBodyLeftMm: 21.3,
      baselineFromBodyBottomMm: 3,
      capHeightMm: 2.919225,
    });
    expect(
      bodyMarkRun('decontamination', { kind: 'vehicle-land', rendition: 'centered-large-tongs' }, bounds),
    ).toEqual({ anchorFromBodyLeftMm: 15.5, baselineFromBodyBottomMm: 2, capHeightMm: 4.87 });
  });

  it('kennt keinen Lauf an Marken, die keinen führen', () => {
    expect(bodyMarkRun('fire-fighting', { kind: 'formation' }, bodyBoundsMm('formation'))).toBeUndefined();
    expect(bodyMarkRun('care', { kind: 'circle-12' }, bodyBoundsMm('circle-12'))).toBeUndefined();
  });
});

describe('der Lauf ohne eigene Lage', () => {
  const staffel: SymbolSpec = {
    kind: 'formation',
    organization: 'feuerwehr',
    strength: 'staffel',
    bodyMarks: ['decontamination'],
    labels: { center: 'P', inBodyInk: 'koerperlauf-kontrast' },
  };

  it('zeichnet C.1.8 ohne Angabe der Grundlinie bytegleich', () => {
    const measured: SymbolSpec = {
      ...staffel,
      labels: { ...staffel.labels, centerBaselineFromBodyBottomMm: 3 },
    };
    expect(drawSymbol(staffel)).toEqual(drawSymbol(measured));
    expect(drawSymbol(staffel).derivations).toBeUndefined();
  });

  it('lässt Angaben der Spec je Feld vorgehen', () => {
    const own = textOf({ ...staffel, labels: { ...staffel.labels, centerBaselineFromBodyBottomMm: 8 } });
    expect(own.y).toBeCloseTo(hull(staffel).maxY - 8, 6);
  });

  it('bleibt am Profil, wenn die Spec keine Marke mit Lauf trägt', () => {
    const plain: SymbolSpec = { kind: 'formation', labels: { center: 'P' } };
    expect(textOf(plain).y).toBeCloseTo(hull(plain).maxY - 8, 6);
  });
});

describe('übertragen mit der Marke', () => {
  for (const kind of ['circle-12', 'hazard', 'measure', 'person', 'vehicle-air'] as const) {
    it(`steht an ${kind} unter dem Kreuz der Zange und im Körper`, () => {
      const spec: SymbolSpec = { kind, bodyMarks: ['decontamination'], labels: { center: 'G' } };
      const text = textOf(spec);
      const marks = marksOf(spec);
      const markBox = {
        minY: Math.min(...marks.map((box) => box.minY)),
        maxY: Math.max(...marks.map((box) => box.maxY)),
      };
      const body = hull(spec);
      // Die Grundlinie liegt in der unteren Hälfte der Marke, wie in C.1.8 unter dem Kreuz.
      expect(text.y).toBeGreaterThan((markBox.minY + markBox.maxY) / 2);
      expect(text.y).toBeLessThan(body.maxY);
      // Kleiner als der Normgrad: die Marke ist verkleinert, der Lauf mit ihr.
      expect(text.sizeMm).toBeLessThan(drawSymbol({ kind: 'formation', labels: { center: 'G' } })
        .children.find((child): child is Text => child.type === 'text')!.sizeMm);
      expect(drawSymbol(spec).derivations).toContainEqual(expect.objectContaining({
        dimension: 'labels.center',
        part: `Lauf an decontamination an ${kind}/normal, mit der Marke übertragen`,
        from: 'formation/normal',
      }));
    });
  }

  it('folgt am Anhänger der Fassung des Landfahrzeugs', () => {
    const spec: SymbolSpec = { kind: 'trailer', bodyMarks: ['decontamination'], labels: { center: 'P' } };
    const text = textOf(spec);
    const body = hull(spec);
    // C.2.25 setzt das „P“ rechts der Körpermitte, unter die kleine Zange.
    expect(text.x).toBeGreaterThan((body.minX + body.maxX) / 2);
    expect(drawSymbol(spec).derivations).toContainEqual(expect.objectContaining({
      dimension: 'labels.center',
      from: 'vehicle-land/normal',
    }));
  });
});
