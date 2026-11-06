/**
 * Der Einstieg von der Spec zur Zeichnung ohne Prüfpaket (LFH-580).
 *
 * Ob `drawSymbol` dieselben Bytes liefert wie die Referenzsnapshots, prüft das Prüfpaket selbst
 * (`conformance/src/draw-symbol.test.ts`) — `core` darf `conformance` nicht importieren. Hier steht,
 * was nur `core` betrifft: die Standardbelegung ist vollständig und unveränderlich, und die
 * Vorgaben für Titel und Beschreibung verdrängen nie, was der Aufrufer selbst angibt.
 */
import type { SymbolSpec } from '@einsatzzeichen/schema';
import { describe, expect, test } from 'vitest';
import * as blocks from './blocks/index.js';
import * as exact from './exact.js';
import { renderSvg } from './render/svg.js';
import { DEFAULT_PORTS, drawSymbol } from './default-ports.js';

/** E.1.1 Bergungsgruppe THW — braucht Innenfeld, Organisationsfarbe, Stärke und Textlaufweiten. */
const BERGUNGSGRUPPE: SymbolSpec = {
  kind: 'formation',
  whiteInnerContour: true,
  organization: 'thw',
  strength: 'gruppe',
  labels: { center: 'B', bottomRight: 'THW' },
};

describe('DEFAULT_PORTS', () => {
  test('ist eingefroren', () => {
    expect(Object.isFrozen(DEFAULT_PORTS)).toBe(true);
  });

  test('belegt jeden Port mit dem gleichnamigen Baustein aus core', () => {
    expect(DEFAULT_PORTS).toEqual({
      baseDrawing: blocks.baseDrawing,
      innerField: blocks.innerField,
      bodyMark: blocks.bodyMark,
      bodyMarkRun: blocks.bodyMarkRun,
      organizationColor: blocks.organizationColor,
      strengthHead: blocks.strengthHead,
      technicalHeadMark: blocks.technicalHeadMark,
      // Seit dem 2. Oktober 2026 ergänzen die Kopfports den vermessenen Kopf um den abgeleiteten.
      unitGroupingHead: blocks.unitGroupingHeadOrDerived,
      functionRole: blocks.functionRole,
      administrativeHead: blocks.administrativeHeadOrDerived,
      vehicleChassis: blocks.vehicleChassis,
      pictogram: blocks.pictogram,
      textMetrics: blocks.TEXT_FONT_METRICS,
    });
  });

  test('ist über core/exact erreichbar', () => {
    expect(exact.DEFAULT_PORTS).toBe(DEFAULT_PORTS);
    expect(exact.drawSymbol).toBe(drawSymbol);
  });
});

describe('drawSymbol', () => {
  test('zeichnet wie compose mit der Standardbelegung und der abgeleiteten Beschreibung', () => {
    expect(drawSymbol(BERGUNGSGRUPPE)).toEqual(
      exact.compose(BERGUNGSGRUPPE, DEFAULT_PORTS, { descriptionFromSpec: exact.describeSymbolSpec }),
    );
  });

  test('leitet die Beschreibung aus der Spec ab', () => {
    expect(drawSymbol(BERGUNGSGRUPPE).description).toContain('Technisches Hilfswerk');
  });

  test('setzt ohne Titel keinen Titel', () => {
    const drawing = drawSymbol(BERGUNGSGRUPPE);
    expect(drawing.title).toBeUndefined();
    expect(renderSvg(drawing, { size: 64 })).not.toContain('<title');
  });

  test('übernimmt einen angegebenen Titel', () => {
    expect(drawSymbol(BERGUNGSGRUPPE, { title: 'Bergungsgruppe' }).title).toBe('Bergungsgruppe');
  });

  test('eine feste Beschreibung des Aufrufers hat Vorrang vor der abgeleiteten', () => {
    expect(drawSymbol(BERGUNGSGRUPPE, { description: 'Eigene Beschreibung' }).description).toBe(
      'Eigene Beschreibung',
    );
  });

  test('eine eigene Ableitung des Aufrufers ersetzt die vorgegebene', () => {
    const drawing = drawSymbol(BERGUNGSGRUPPE, { descriptionFromSpec: (spec) => `Art ${spec.kind}` });
    expect(drawing.description).toBe('Art formation');
  });

  test('eine ungültige Spec wirft wie compose eine CompositionError', () => {
    // Eine Stärke trägt nur eine taktische Einheit.
    expect(() => drawSymbol({ kind: 'hazard', strength: 'gruppe' }))
      .toThrow(exact.CompositionError);
  });
});
