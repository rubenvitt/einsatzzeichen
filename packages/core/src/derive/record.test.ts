import { describe, expect, it } from 'vitest';
import type { Drawing } from '@einsatzzeichen/schema';
import { drawSymbol } from '../default-ports.js';
import { checkSpec, vocabulary } from '../vocabulary.js';
import { collectDerivations, noteDerivation } from './record.js';

const EMPTY: Drawing = { viewBox: { width: 32, height: 32 }, children: [] };
const NOTE = { dimension: 'labels.center', part: 'Grundlinie', basis: 'constructed', from: 'Test' } as const;

describe('Ableitungsnotizen', () => {
  it('hängt Notizen an die Zeichnung und fasst doppelte zusammen', () => {
    const drawing = collectDerivations(() => {
      noteDerivation(NOTE);
      noteDerivation(NOTE);
      return EMPTY;
    });
    expect(drawing.derivations).toEqual([NOTE]);
  });

  it('lässt eine Zeichnung ohne Notiz unverändert, ohne leeres Feld', () => {
    const drawing = collectDerivations(() => EMPTY);
    expect(drawing).toBe(EMPTY);
    expect('derivations' in drawing).toBe(false);
  });

  it('verwirft Notizen außerhalb einer Komposition', () => {
    expect(() => noteDerivation(NOTE)).not.toThrow();
  });

  it('trennt verschachtelte Kompositionen', () => {
    const outer = collectDerivations(() => {
      const inner = collectDerivations(() => {
        noteDerivation({ ...NOTE, part: 'innen' });
        return EMPTY;
      });
      expect(inner.derivations?.map((note) => note.part)).toEqual(['innen']);
      noteDerivation({ ...NOTE, part: 'außen' });
      return EMPTY;
    });
    expect(outer.derivations?.map((note) => note.part)).toEqual(['außen']);
  });

  it('ein vermessenes Zeichen trägt keine Ableitung, auch nicht im Vokabular', () => {
    const spec = { kind: 'formation', organization: 'feuerwehr' } as const;
    expect(drawSymbol(spec).derivations).toBeUndefined();
    const check = checkSpec(spec);
    expect(check.ok && check.drawing.derivations).toBeUndefined();
    const option = vocabulary({ kind: 'formation' }, 'organization').find((o) => o.value === 'feuerwehr');
    expect(option).toMatchObject({ status: 'allowed' });
    expect(option && 'derived' in option).toBe(false);
  });
});
