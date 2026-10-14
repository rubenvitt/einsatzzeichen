import {
  BODY_VARIANT_IDS,
  ORGANIZATION_IDS,
  STRENGTH_IDS,
  TECHNICAL_BODY_MARK_IDS,
  type Primitive,
  type SymbolSpec,
} from '@einsatzzeichen/schema';
import { describe, expect, it } from 'vitest';
import { drawSymbol } from './default-ports.js';
import { drawAnySpec } from './draw-freestanding.js';
import { pictogram } from './geometry/pictograms/index.js';
import { parseAnySpec, parseSpec, serializeAnySpec, serializeSpec } from './spec-codec.js';
import { checkAnySpec, checkSpec, vocabulary } from './vocabulary.js';

/**
 * Die Befehlsstelle in der Grammatik von 2025 (ESZ-131,
 * `docs/decisions/2026-10-14-esz-131-befehlsstelle-ohne-fahnenstock.md`).
 *
 * Das Alt-Grundzeichen 1.2 „Befehlsstelle, Führungsstelle (im Einsatz)“ der DV 102 (2011) trägt
 * einen Fahnenstock. Die Baseline führt ihn nicht mehr: dieselben Leitungen im Einsatz
 * (D.1.2–D.1.6) zeigen statt des Stocks die schwarze 3-mm-Kappe, D.1.1 dazu die gestrichelte
 * Verbindung zum Standortkreuz. Die Tests halten die Abbildung fest, auf die sich Verwender
 * verlassen.
 */

const CAP = 'formation-solid-cap-3mm' as const;

type Rect = Extract<Primitive, { type: 'rect' }>;

/** Körper und schwarze Kappe einer gezeichneten Formation. */
function rects(spec: SymbolSpec): { body: Rect | undefined; cap: Rect | undefined } {
  const all = drawSymbol(spec).children.filter((primitive): primitive is Rect => primitive.type === 'rect');
  return {
    body: all.find((rect) => rect.role === 'body'),
    cap: all.find((rect) => rect.role === 'pictogram' && rect.style?.fill === 'schwarz'),
  };
}

describe('Befehlsstelle (ESZ-131)', () => {
  it('ist an jeder Organisation und Stärke eine Formation mit Kappe, ohne Ableitung', () => {
    for (const organization of ORGANIZATION_IDS) {
      for (const strength of [undefined, ...STRENGTH_IDS]) {
        const spec: SymbolSpec = {
          kind: 'formation',
          organization,
          ...(strength === undefined ? {} : { strength }),
          bodyMarks: [CAP],
        };
        const label = `${organization}/${strength ?? '–'}`;
        expect(checkSpec(spec).ok, label).toBe(true);
        expect(parseSpec(serializeSpec(spec)), label).toEqual(spec);
        const drawing = drawSymbol(spec);
        expect(drawing.derivations, label).toBeUndefined();
        // Die Kappe sitzt bündig auf der Oberkante, auch wo die Staffel den Körper absenkt.
        const { body, cap } = rects(spec);
        expect(body, label).toBeDefined();
        expect(cap, label).toMatchObject({ x: 1, y: body!.y, width: 30, height: 3 });
      }
    }
  });

  it('bietet die Kappe im Vokabular der Formation an', () => {
    const options = vocabulary({ kind: 'formation', organization: 'thw', strength: 'gruppe' }, 'bodyMarks');
    expect(options.find((option) => option.value === CAP)).toMatchObject({ status: 'allowed' });
  });

  it('trägt dieselbe Kappe wie D.1.1, nur um die 5 mm angehobene Körperlage versetzt', () => {
    const commandPost = pictogram('leadership.command-post-in-operation').primitives;
    const d11Cap = commandPost.find((primitive) => primitive.type === 'rect' && primitive.style?.fill === 'schwarz');
    expect(d11Cap).toMatchObject({ x: 1, y: 1, width: 30, height: 3 });
    const { body, cap } = rects({ kind: 'formation', organization: 'fuehrung-leitung', bodyMarks: [CAP] });
    expect(body).toMatchObject({ x: 1, y: 6, width: 30, height: 20 });
    expect(cap).toMatchObject({ x: 1, y: 6, width: 30, height: 3 });
  });

  it('zeichnet die Befehlsstelle D.1.1 freistehend und hält die Rundreise', () => {
    const spec = { kind: 'pictogram', pictogram: 'leadership.command-post-in-operation' } as const;
    expect(checkAnySpec(spec).ok).toBe(true);
    expect(parseAnySpec(serializeAnySpec(spec))).toEqual(spec);
    expect(drawAnySpec(spec).viewBox).toEqual({ width: 32, height: 46 });
  });

  it('führt keinen Fahnenstock als Körpervariante oder Körpermarke', () => {
    const names = [...BODY_VARIANT_IDS, ...TECHNICAL_BODY_MARK_IDS];
    expect(names.filter((name) => /flag|staff|pole/.test(name))).toEqual([]);
  });
});
