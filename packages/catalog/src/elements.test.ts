import { describe, expect, it } from 'vitest';
import type { StrengthId } from '@einsatzzeichen/schema';
import { ELEMENTS, PICTOGRAM_ELEMENT_KINDS, resolveElement } from './elements.js';
import { ORGANIZATION_COLORS } from './organizations.js';
import { fingerprintFor } from './fingerprint-index.js';
import { ALL_PICTOGRAMS, pictogram } from './pictograms/index.js';

describe('Element-Register', () => {
  it('gibt Elementdeskriptoren als tief readonly typisiert zurück', () => {
    if (false) {
      const descriptor = resolveElement('strength.trupp');
      // @ts-expect-error Abgeleitete Elementmetadaten sind unveränderlich.
      descriptor.title = 'Manipuliert';
      // @ts-expect-error Auch die Liste ihrer Referenzdateien ist unveränderlich.
      descriptor.referenceAssets[0] = 'manipuliert.svg';
    }
    expect(true).toBe(true);
  });

  it('friert Register, Deskriptoren und Referenzdateien tief ein', () => {
    const descriptor = resolveElement('strength.trupp');
    expect(Object.isFrozen(ELEMENTS)).toBe(true);
    expect(Object.isFrozen(descriptor)).toBe(true);
    expect(Object.isFrozen(descriptor.referenceAssets)).toBe(true);
  });

  it('weist Laufzeitmutationen an Elementdeskriptoren zurück', () => {
    const descriptor = resolveElement('strength.trupp');
    const originalTitle = descriptor.title;
    const titleWasSet = Reflect.set(descriptor, 'title', 'Manipuliert');
    const observedTitle = descriptor.title;
    if (titleWasSet) Reflect.set(descriptor, 'title', originalTitle);

    expect(titleWasSet).toBe(false);
    expect(observedTitle).toBe(originalTitle);
  });

  it('führt 47 Elemente: sieben Farben, vier Stärkegrade, 36 Piktogramme', () => {
    const byKind = Object.values(ELEMENTS).reduce<Record<string, number>>((acc, el) => {
      acc[el.kind] = (acc[el.kind] ?? 0) + 1;
      return acc;
    }, {});
    expect(byKind).toEqual({ organization: 7, strength: 4, capability: 36 });
  });

  it('führt genau die Organisationen, für die der Katalog eine Farbe belegt', () => {
    const fromElements = Object.values(ELEMENTS)
      .filter((el) => el.kind === 'organization')
      .map((el) => el.id.slice('organization.'.length))
      .sort();
    expect(fromElements).toEqual(Object.keys(ORGANIZATION_COLORS).sort());
  });

  it('führt jeden Stärkegrad der Taxonomie als Element', () => {
    const all: readonly StrengthId[] = ['trupp', 'staffel', 'gruppe', 'zug'];
    for (const id of all) expect(resolveElement(`strength.${id}`).kind).toBe('strength');
  });

  it('trägt an jedem Element denselben Schlüssel als id und mindestens eine Belegstelle', () => {
    for (const [key, descriptor] of Object.entries(ELEMENTS)) {
      expect(descriptor.id).toBe(key);
      expect(descriptor.referenceAssets.length).toBeGreaterThan(0);
      expect(descriptor.title.length).toBeGreaterThan(0);
    }
  });

  it('nennt nur Belegstellen, die im Kennzahlenartefakt vorkommen', () => {
    for (const descriptor of Object.values(ELEMENTS)) {
      for (const asset of descriptor.referenceAssets) {
        expect(() => fingerprintFor(asset)).not.toThrow();
      }
    }
  });

  it('belegt die Staffel an drei und den Zug an fünf Dateien', () => {
    expect(resolveElement('strength.staffel').referenceAssets).toHaveLength(3);
    expect(resolveElement('strength.zug').referenceAssets).toHaveLength(5);
  });

  it('nennt bei jedem Stärkegrad die namensgebende 5.4-Datei zuerst', () => {
    expect(resolveElement('strength.trupp').referenceAssets[0]).toBe('5.4.1_Trupp.svg');
    expect(resolveElement('strength.staffel').referenceAssets[0]).toBe('5.4.2_Staffel.svg');
    expect(resolveElement('strength.gruppe').referenceAssets[0]).toBe('5.4.3_Gruppe.svg');
    expect(resolveElement('strength.zug').referenceAssets[0]).toBe('5.4.4_Zug.svg');
  });

  it('führt hilfsorganisation nicht als Element', () => {
    expect(() => resolveElement('organization.hilfsorganisation')).toThrow(/hilfsorganisation/);
  });

  it('wirft bei einer unbekannten Element-ID', () => {
    expect(() => resolveElement('strength.kompanie')).toThrow(/strength\.kompanie/);
    expect(() => resolveElement('')).toThrow();
  });
});

describe('Piktogramm-Elemente', () => {
  it('löst reale Alternativen explizit auf und hält primary als Standarddarstellung', () => {
    const primary = pictogram('capability.radioactive-materials');
    const alternative = pictogram('capability.radioactive-materials', 'alternative');
    expect(primary.variant).toBe('primary');
    expect(alternative).not.toBe(primary);
    expect(alternative.primitives[0]?.style?.stroke).toBe('rot');
    expect(resolveElement('capability.radioactive-materials').referenceAssets).toEqual([
      '4.1.6_Atomare Stoffe.svg',
      '4.1.6_Atomare Stoffe_Alternative.svg',
    ]);
  });

  it('leitet Titel und alle Referenzdateien eines Piktogrammelements aus den Definitionen ab', () => {
    const definition = pictogram('capability.service-water');
    const descriptor = resolveElement('capability.service-water');
    expect(definition.section).toBe('4.3.2');
    expect(definition.referenceAsset).toBe('4.3.2_Löschwasser Brauchwasser.svg');
    expect(descriptor.title).toBe('Löschwasser, Brauchwasser');
    expect(descriptor.title).toBe(definition.title);
    expect(descriptor.referenceAssets).toEqual([definition.referenceAsset]);
  });

  it('löst das neue Piktogramm mit seiner namensgebenden Belegdatei auf', () => {
    const descriptor = resolveElement('capability.service-water');
    expect(descriptor.kind).toBe('capability');
    expect(descriptor.title).toBe('Löschwasser, Brauchwasser');
    // Der Dateiname trägt ein Leerzeichen, keinen Schrägstrich — so steht er im Referenzbestand.
    // Mit "Löschwasser/Brauchwasser" bricht die Abschnittsprüfung des Coverage-Gates.
    expect(descriptor.referenceAssets[0]).toBe('4.3.2_Löschwasser Brauchwasser.svg');
  });

  it('hat für jedes Katalogpiktogramm ein auflösbares Element', () => {
    // Ohne diese Prüfung könnte ein Piktogramm ohne Manifest-Anschluss entstehen: der Katalog
    // zeichnete es, und kein Eintrag würde es beanspruchen.
    for (const definition of ALL_PICTOGRAMS) {
      expect(() => resolveElement(definition.id)).not.toThrow();
      expect(resolveElement(definition.id).title).toBe(definition.title);
    }
  });

  it('zählt genau die geometrietragenden Elementarten als Piktogramme', () => {
    expect(PICTOGRAM_ELEMENT_KINDS.has('capability')).toBe(true);
    expect(PICTOGRAM_ELEMENT_KINDS.has('organization')).toBe(false);
    expect(PICTOGRAM_ELEMENT_KINDS.has('strength')).toBe(false);
  });
});
