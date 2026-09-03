import { mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createReferencePort, readReferenceAsset, resolveReferencePath } from './reference.js';

/**
 * Die Sicherheitsgrenze aus Spec §8 wird hier gegen ein echtes Dateisystem geprüft — ein Doppel
 * könnte den entscheidenden Fall (den Symlink aus dem Ordner hinaus) gar nicht abbilden.
 * Gearbeitet wird in einem Wegwerfverzeichnis; der echte Referenzbestand wird nie angefasst.
 */
const ASSET = '1.1_Taktische Formation.svg';

let root = '';
let outside = '';

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), 'einsatzzeichen-referenz-'));
  outside = join(root, 'geheim.svg');
  writeFileSync(outside, '<svg data-geheim="ja"></svg>', 'utf8');
  mkdirSync(join(root, 'taktische-zeichen'));
  writeFileSync(join(root, 'taktische-zeichen', ASSET), '<svg data-referenz="ja"></svg>', 'utf8');
});

afterEach(() => {
  rmSync(root, { recursive: true, force: true });
});

describe('resolveReferencePath', () => {
  it('liest die Datei aus taktische-zeichen/', () => {
    const result = readReferenceAsset(root, ASSET);
    expect(result).toEqual({ ok: true, svg: '<svg data-referenz="ja"></svg>' });
  });

  it('weist einen Namen mit Verzeichnisanteil ab, bevor er zu einem Pfad wird', () => {
    for (const name of ['../geheim.svg', 'unter/1.svg', '/etc/passwd', '.', '..', '']) {
      const result = resolveReferencePath(root, name);
      expect(result.ok, `Name "${name}"`).toBe(false);
      if (!result.ok) expect(result.status).toBe(400);
    }
  });

  it('weist einen Verweis ab, der aus taktische-zeichen/ hinausführt', () => {
    // Der Name steht im Register, die Datei dahinter liegt aber ausserhalb: genau der Fall, den
    // eine reine Namensprüfung nicht sieht und `realpathSync` aufdeckt.
    const escaping = 'zeigt-nach-draussen.svg';
    symlinkSync(outside, join(root, 'taktische-zeichen', escaping));
    const result = resolveReferencePath(root, escaping);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.status).toBe(403);
      expect(result.error).toContain(escaping);
      expect(result.error).not.toContain(root);
    }
  });

  it('meldet einen fehlenden Ordner mit 404 und ohne Pfad', () => {
    rmSync(join(root, 'taktische-zeichen'), { recursive: true });
    const result = resolveReferencePath(root, ASSET);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.status).toBe(404);
      expect(result.error).not.toContain(root);
    }
  });

  it('meldet eine fehlende Datei mit 404, nennt den Dateinamen und keinen Pfad', () => {
    const result = resolveReferencePath(root, '9.9_Gibt es nicht.svg');
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.status).toBe(404);
      expect(result.error).toContain('9.9_Gibt es nicht.svg');
      expect(result.error).not.toContain(root);
    }
  });

  it('weist eine Datei ohne SVG-Endung ab', () => {
    writeFileSync(join(root, 'taktische-zeichen', 'notiz.txt'), 'nichts', 'utf8');
    const result = resolveReferencePath(root, 'notiz.txt');
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.status).toBe(400);
  });
});

describe('createReferencePort', () => {
  it('meldet Vorhandensein, ohne die Datei zu lesen, und liest auf Verlangen', () => {
    const port = createReferencePort(root);
    expect(port.has(ASSET)).toBe(true);
    expect(port.has('9.9_Gibt es nicht.svg')).toBe(false);
    expect(port.read(ASSET)).toEqual({ ok: true, svg: '<svg data-referenz="ja"></svg>' });
  });
});
