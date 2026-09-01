import { closeSync, mkdtempSync, openSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { writeSnapshotFile } from './snapshot-file.js';

/**
 * Geschrieben wird ausschließlich in ein eigenes Verzeichnis unter `os.tmpdir()`. Niemals nach
 * `packages/website/public/`: dort liegt der echte Snapshot, den parallele Testläufe und ein
 * laufendes `astro dev` lesen — ein Test, der ihn anfasst, wäre genau der Wettlauf, den dieses
 * Modul beseitigt.
 */
describe('writeSnapshotFile', () => {
  let dir: string;
  let target: string;

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'einsatzzeichen-snapshot-'));
    target = join(dir, 'catalog-snapshot.json');
  });

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  it('legt die Datei mit dem übergebenen Inhalt an', () => {
    writeSnapshotFile(target, '{"symbols":[]}');
    expect(readFileSync(target, 'utf8')).toBe('{"symbols":[]}');
  });

  it('ersetzt einen vorhandenen Stand vollständig statt ihn zu überschreiben', () => {
    writeFileSync(target, 'ein deutlich längerer alter Stand', 'utf8');
    writeSnapshotFile(target, 'kurz');
    expect(readFileSync(target, 'utf8')).toBe('kurz');
  });

  it('lässt keine temporäre Datei zurück', () => {
    writeSnapshotFile(target, '{"symbols":[]}');
    expect(readdirSync(dir)).toEqual(['catalog-snapshot.json']);
  });

  /**
   * Der eigentliche Punkt des Moduls, und er lässt sich ohne Nebenläufigkeit beweisen: ein Leser,
   * der die Datei vor dem Schreiben geöffnet hat, liest den **alten Stand vollständig** zu Ende.
   * Das geht nur, wenn der alte Inhalt nie gekürzt, sondern der Name auf einen neuen Inode
   * umgehängt wurde. Ein `writeFileSync` auf denselben Namen ließe diesen Leser stattdessen ein
   * Präfix oder eine leere Datei sehen — der beobachtete Fehlschlag aus LFH-503.
   */
  it('kürzt den alten Stand nicht — ein offener Leser liest ihn ganz', () => {
    const old = 'x'.repeat(200_000);
    writeFileSync(target, old, 'utf8');
    const reader = openSync(target, 'r');
    try {
      writeSnapshotFile(target, 'y'.repeat(300_000));
      expect(readFileSync(reader, 'utf8')).toBe(old);
    } finally {
      closeSync(reader);
    }
    expect(statSync(target).size).toBe(300_000);
  });

  it('meldet den echten Fehler, wenn das Zielverzeichnis fehlt', () => {
    // Nicht der `unlink` des Aufräumens darf hier melden, sondern das `open` der temporären
    // Datei: sonst verdeckte das `finally` die Ursache mit einer zweiten ENOENT-Meldung.
    let caught: NodeJS.ErrnoException | undefined;
    try {
      writeSnapshotFile(join(dir, 'fehlt', 'catalog-snapshot.json'), '{}');
    } catch (error) {
      caught = error as NodeJS.ErrnoException;
    }
    expect(caught?.code).toBe('ENOENT');
    expect(caught?.syscall).toBe('open');
  });
});
