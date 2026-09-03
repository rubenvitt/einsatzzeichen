import { describe, expect, it } from 'vitest';
import { isTextEntry, resolveShortcut } from './shortcuts';

describe('isTextEntry', () => {
  it('erkennt Eingabefeld, Textbereich, Auswahlfeld und editierbaren Inhalt', () => {
    expect(isTextEntry({ tagName: 'INPUT' })).toBe(true);
    expect(isTextEntry({ tagName: 'textarea' })).toBe(true);
    expect(isTextEntry({ tagName: 'SELECT' })).toBe(true);
    expect(isTextEntry({ tagName: 'DIV', isContentEditable: true })).toBe(true);
  });

  it('lässt alles andere durch', () => {
    expect(isTextEntry({ tagName: 'BUTTON' })).toBe(false);
    expect(isTextEntry(null)).toBe(false);
    expect(isTextEntry(undefined)).toBe(false);
  });
});

describe('resolveShortcut', () => {
  it('blättert mit j/k und den Pfeiltasten', () => {
    expect(resolveShortcut({ key: 'j' })).toEqual({ kind: 'step', delta: 1 });
    expect(resolveShortcut({ key: 'ArrowDown' })).toEqual({ kind: 'step', delta: 1 });
    expect(resolveShortcut({ key: 'k' })).toEqual({ kind: 'step', delta: -1 });
    expect(resolveShortcut({ key: 'ArrowUp' })).toEqual({ kind: 'step', delta: -1 });
  });

  it('setzt den Status über a, w und 0', () => {
    expect(resolveShortcut({ key: 'a' })).toEqual({ kind: 'status', status: 'approved' });
    expect(resolveShortcut({ key: 'w' })).toEqual({ kind: 'status', status: 'deviation' });
    expect(resolveShortcut({ key: '0' })).toEqual({ kind: 'status', status: 'pending' });
  });

  it('bildet die sechs Größenstufen auf 1 bis 6 ab und lässt 7 unbelegt', () => {
    expect(resolveShortcut({ key: '1' })).toEqual({ kind: 'size', index: 0 });
    expect(resolveShortcut({ key: '6' })).toEqual({ kind: 'size', index: 5 });
    expect(resolveShortcut({ key: '7' })).toBeNull();
  });

  it('kennt Speichern, Theme, Referenz, Suche und Hilfe', () => {
    expect(resolveShortcut({ key: 'Enter' })).toEqual({ kind: 'save' });
    expect(resolveShortcut({ key: 't' })).toEqual({ kind: 'theme-next' });
    expect(resolveShortcut({ key: 'r' })).toEqual({ kind: 'reference-toggle' });
    expect(resolveShortcut({ key: '/' })).toEqual({ kind: 'focus-search' });
    expect(resolveShortcut({ key: '?' })).toEqual({ kind: 'help-toggle' });
  });

  it('feuert nicht, während der Fokus in einem Text- oder Notizfeld steht', () => {
    const target = { tagName: 'TEXTAREA' };
    for (const key of ['a', 'w', '0', 'j', 'k', 'Enter', '1', 't', 'r', '/', '?', 'ArrowDown']) {
      expect(resolveShortcut({ key, target })).toBeNull();
    }
  });

  it('erlaubt Speichern aus dem Notizfeld nur mit Zusatztaste', () => {
    const target = { tagName: 'TEXTAREA' };
    expect(resolveShortcut({ key: 'Enter', ctrlKey: true, target })).toEqual({ kind: 'save' });
    expect(resolveShortcut({ key: 'Enter', metaKey: true, target })).toEqual({ kind: 'save' });
    expect(resolveShortcut({ key: 'a', ctrlKey: true, target })).toBeNull();
  });

  it('hält sich aus Browserkürzeln heraus', () => {
    expect(resolveShortcut({ key: 'r', ctrlKey: true })).toBeNull();
    expect(resolveShortcut({ key: 'j', altKey: true })).toBeNull();
  });

  it('lässt Escape auch aus einem Feld heraus durch — es erzeugt keinen Text', () => {
    expect(resolveShortcut({ key: 'Escape', target: { tagName: 'INPUT' } })).toEqual({
      kind: 'dismiss',
    });
  });

  it('meldet für unbelegte Tasten nichts', () => {
    expect(resolveShortcut({ key: 'z' })).toBeNull();
    expect(resolveShortcut({ key: 'F5' })).toBeNull();
  });
});
