import { describe, expect, it } from 'vitest';
import { boundsOfMm, checkBox, checkCommands } from '@einsatzzeichen/core';
import { CAPABILITY_PICTOGRAMS } from './capabilities.js';
import { CBRN_CAPABILITIES } from './capabilities/01-cbrn.js';
import { strokeCapability } from './authoring.js';
import { defineCapability } from './catalog-definition.js';
import {
  ALL_PICTOGRAMS,
  buildPictogramRegistry,
  pictogram,
  pictogramVariantKey,
} from './index.js';

describe('Fähigkeitspiktogramme', () => {
  it('erzeugt absolute Pfade mit expliziter Standardbox und Piktogrammrolle', () => {
    const definition = strokeCapability({
      section: '4.9.1',
      id: 'fire-fighting',
      title: 'Test',
      referenceAsset: '4.9.1_Information und Kommunikation Fernmeldewesen.svg',
      d: 'M 4 8 L 28 24',
    });
    expect(definition.box).toEqual({ xMm: 4, yMm: 8, widthMm: 24, heightMm: 16 });
    expect(definition.primitives).toHaveLength(1);
    expect(definition.primitives[0]?.role).toBe('pictogram');
    expect(checkCommands(definition)).toEqual([]);
    expect(checkBox(definition)).toEqual([]);
  });

  it('gibt Definitionen als tief readonly typisiert zurück', () => {
    if (false) {
      const definition = pictogram('capability.fire-fighting');
      // @ts-expect-error Katalogmetadaten sind nach der Definition unveränderlich.
      definition.title = 'Manipuliert';
      // @ts-expect-error Auch die zugesicherte Box ist tief unveränderlich.
      definition.box.xMm = 0;
      const style = definition.primitives[0]?.style;
      if (style !== undefined) {
        // @ts-expect-error Auch verschachtelte Primitive-Stile sind tief unveränderlich.
        style.stroke = 'rot';
      }
    }
    expect(true).toBe(true);
  });

  it('friert Definitionen und beide öffentlichen Register tief ein', () => {
    const definition = pictogram('capability.fire-fighting');
    const primitive = definition.primitives[0];
    expect(Object.isFrozen(CAPABILITY_PICTOGRAMS)).toBe(true);
    expect(Object.isFrozen(CBRN_CAPABILITIES)).toBe(true);
    expect(Object.isFrozen(ALL_PICTOGRAMS)).toBe(true);
    expect(Object.isFrozen(definition)).toBe(true);
    expect(Object.isFrozen(definition.box)).toBe(true);
    expect(Object.isFrozen(definition.primitives)).toBe(true);
    expect(Object.isFrozen(primitive)).toBe(true);
    expect(Object.isFrozen(primitive?.style)).toBe(true);
  });

  it('weist Laufzeitmutationen an Definition und Register zurück', () => {
    const definition = pictogram('capability.fire-fighting');
    const originalTitle = definition.title;
    const originalLength = ALL_PICTOGRAMS.length;
    const titleWasSet = Reflect.set(definition, 'title', 'Manipuliert');
    const observedTitle = definition.title;
    const entryWasAdded = Reflect.set(ALL_PICTOGRAMS, originalLength, definition);

    if (titleWasSet) Reflect.set(definition, 'title', originalTitle);
    if (entryWasAdded) {
      Reflect.deleteProperty(ALL_PICTOGRAMS, originalLength);
      Reflect.set(ALL_PICTOGRAMS, 'length', originalLength);
    }

    expect(titleWasSet).toBe(false);
    expect(observedTitle).toBe(originalTitle);
    expect(entryWasAdded).toBe(false);
    expect(ALL_PICTOGRAMS).toHaveLength(originalLength);
  });

  it('zeichnet Brandbekämpfung als Strahlrohr mit Sprühkegel', () => {
    const parts = pictogram('capability.fire-fighting').primitives;
    expect(parts).toHaveLength(3);
    for (const part of parts) {
      expect(part.type).toBe('line');
      expect(part.role).toBe('pictogram');
      expect(part.style?.stroke).toBe('schwarz');
    }
  });

  it('deklariert für Brandbekämpfung die Hülle, die die Geometrie tatsächlich hat', () => {
    const definition = pictogram('capability.fire-fighting');
    const hull = definition.primitives.map(boundsOfMm);
    expect(Math.min(...hull.map((b) => b.minX))).toBeCloseTo(definition.box.xMm, 6);
    expect(Math.min(...hull.map((b) => b.minY))).toBeCloseTo(definition.box.yMm, 6);
    expect(Math.max(...hull.map((b) => b.maxX))).toBeCloseTo(
      definition.box.xMm + definition.box.widthMm,
      6,
    );
    expect(Math.max(...hull.map((b) => b.maxY))).toBeCloseTo(
      definition.box.yMm + definition.box.heightMm,
      6,
    );
  });

  it('bleibt innerhalb des Körpers der Taktischen Formation', () => {
    for (const part of pictogram('capability.fire-fighting').primitives) {
      const bounds = boundsOfMm(part);
      expect(bounds.minX).toBeGreaterThanOrEqual(1);
      expect(bounds.maxX).toBeLessThanOrEqual(31);
      expect(bounds.minY).toBeGreaterThanOrEqual(6);
      expect(bounds.maxY).toBeLessThanOrEqual(26);
    }
  });

  it('wirft bei einer ID ohne Definition, statt undefined zu liefern', () => {
    // Dasselbe Muster wie `organizationColor`, `baseDrawing` und `resolveElement`: ein Register
    // mit Lücken ist Partial, und der Zugriff darauf wirft — ein stilles `undefined` würde als
    // leeres Piktogramm gerendert.
    expect(() => pictogram('capability.not-a-capability' as never)).toThrow(/Kein Piktogramm/);
  });

  it('liefert ohne Variantenargument weiterhin primary', () => {
    expect(pictogram('capability.fire-fighting').variant).toBe('primary');
  });

  it('wirft für eine nicht vorhandene Alternative', () => {
    expect(() => pictogram('capability.fire-fighting', 'alternative')).toThrow(/alternative/);
  });

  it('hat eindeutige Varianten-Schlüssel und löst alle Einträge auf', () => {
    const keys = CAPABILITY_PICTOGRAMS.map(pictogramVariantKey);
    expect(new Set(keys).size).toBe(keys.length);
    for (const definition of CAPABILITY_PICTOGRAMS) {
      expect(pictogram(definition.id, definition.variant)).toBe(definition);
    }
  });

  it('akzeptiert dieselbe ID mit primary und alternative als getrennte Schlüssel', () => {
    const primary = pictogram('capability.fire-fighting');
    const alternative = defineCapability({
      section: primary.section,
      id: 'fire-fighting',
      variant: 'alternative',
      title: primary.title,
      referenceAsset: '4.2.1_Brandbekämpfung_Alternative.svg',
      box: primary.box,
      primitives: primary.primitives,
    });

    expect(primary.id).toBe(alternative.id);
    const registry = buildPictogramRegistry([primary, alternative]);
    expect(registry.get(pictogramVariantKey(primary))).toBe(primary);
    expect(registry.get(pictogramVariantKey(alternative))).toBe(alternative);
    expect(registry.size).toBe(2);
  });

  it('weist ein exakt doppeltes ID-Varianten-Paar zurück', () => {
    const definition = pictogram('capability.fire-fighting');
    expect(() => buildPictogramRegistry([definition, definition])).toThrow(/Doppeltes Piktogramm/);
  });
});

describe('Löschwasser/Brauchwasser (4.3.2)', () => {
  it('zeichnet die Doppelwelle als einen gefüllten Pfad', () => {
    const definition = pictogram('capability.service-water');
    expect(definition.title).toBe('Löschwasser, Brauchwasser');
    expect(definition.primitives).toHaveLength(1);
    const [wave] = definition.primitives;
    expect(wave?.type).toBe('path');
    expect(wave?.role).toBe('pictogram');
    // Eine gefüllte Fläche, keine Strichzeichnung: die Bildidee der Referenz ist ein Wasserband.
    expect(wave?.style?.fill).toBe('schwarz');
    expect(wave?.style?.stroke).toBe('none');
  });

  it('verwendet ausschließlich absolute Kommandos aus M L H V C Q Z', () => {
    const [wave] = pictogram('capability.service-water').primitives;
    expect(wave?.type).toBe('path');
    if (wave?.type !== 'path') return;
    // Direkt am String, zusätzlich zum Gate: ein relatives Kommando wäre hier ein Kleinbuchstabe.
    expect(wave.d).toMatch(/^[MLHVCQZ0-9.,\s-]+$/);
    expect(wave.d).toContain('C');
  });

  it('enthält Kurven — sonst wäre der Nachweis für Pfad-Piktogramme keiner', () => {
    // Der Fingerprint der Referenzdatei trägt curvedPaths: 1. Ein geradliniges Piktogramm hier
    // würde den Mechanismus nicht belegen, für den dieser Slice existiert.
    const [wave] = pictogram('capability.service-water').primitives;
    if (wave?.type !== 'path') return;
    expect((wave.d.match(/C/g) ?? []).length).toBeGreaterThan(1);
  });
});
