import { describe, expect, it } from 'vitest';
import { effectiveTextPx, MINIMUM_TEXT_RENDER_PX, renderSvg } from '@einsatzzeichen/core';
import { DEFAULT_VIEWBOX_MM, type Primitive } from '@einsatzzeichen/schema';
import { PRINT_MONOCHROME_THEME } from '../render-themes.js';
import { COMMS_PICTOGRAMS } from './comms/index.js';

describe('J-Bestand', () => {
  it('führt jede Darstellung standalone mit deklariertem Kontrast', () => {
    for (const definition of COMMS_PICTOGRAMS) {
      expect(definition.placement.mode).toBe('standalone');
      expect(definition.id.startsWith('comms.')).toBe(true);
      expect(definition.contrastPairs?.length ?? 0).toBeGreaterThan(0);
    }
  });

  it('bindet jeden Abschnitt an seine namensgebende Belegdatei', () => {
    for (const definition of COMMS_PICTOGRAMS) {
      expect(definition.referenceAsset.startsWith(`${definition.section}_`)).toBe(true);
    }
  });

  it('liefert die beiden Betriebsarten aus J.2', () => {
    const sections = COMMS_PICTOGRAMS.filter((d) => d.section.startsWith('J.2')).map(
      (d) => d.section,
    );
    expect(sections).toEqual(['J.2.1', 'J.2.2']);
  });
});

describe('J.3: Gerätekörper', () => {
  function textsOf(section: string): readonly Extract<Primitive, { type: 'text' }>[] {
    const definition = COMMS_PICTOGRAMS.find((d) => d.section === section);
    if (definition === undefined) throw new Error(`${section} fehlt im Bestand.`);
    return definition.primitives.filter(
      (p): p is Extract<Primitive, { type: 'text' }> => p.type === 'text',
    );
  }

  it('führt das Grundzeichen J.3.1 ohne Kürzel', () => {
    expect(textsOf('J.3.1')).toEqual([]);
  });

  it('trägt in J.3.6 das Kürzel HRT als Textlauf', () => {
    const texts = textsOf('J.3.6');
    expect(texts).toHaveLength(1);
    expect(texts[0]!.content).toBe('HRT');
  });

  // Ohne role: 'pictogram' zählt pictogramStrokeWidths den Lauf als foreignRole und
  // checkClipping macht daraus einen Befund. Der Helfer muss die Rolle setzen, nicht der
  // Aufrufer — sonst haengt die Gate-Tauglichkeit an der Disziplin jeder einzelnen Definition.
  it('setzt an jedem Kürzel die Piktogrammrolle', () => {
    for (const definition of COMMS_PICTOGRAMS) {
      for (const primitive of definition.primitives) {
        if (primitive.type !== 'text') continue;
        expect(primitive.role, `${definition.section} ${primitive.content}`).toBe('pictogram');
      }
    }
  });

  // Kein Kuerzel des Anhangs erreicht die 16-px-Snapshotgroesse lesbar. Jeder Lauf deklariert
  // deshalb seine untere Einsatzgrenze, und sie muss zum eigenen Schriftgrad passen: bei
  // MINIMUM_TEXT_RENDER_PX = 8 traegt ein 10-mm-Lauf ab 32 px, ein 6,8-mm-Lauf erst ab 64 px.
  // Ein pauschaler Wert fuer alle waere entweder zu streng oder eine leere Zusicherung.
  it('deklariert an jedem Kürzel eine zum Schriftgrad passende Einsatzgrenze', () => {
    for (const definition of COMMS_PICTOGRAMS) {
      for (const text of definition.primitives) {
        if (text.type !== 'text') continue;
        const label = `${definition.section} ${text.content}`;
        expect(text.minRenderPx, label).toBeDefined();
        expect(
          effectiveTextPx(text.sizeMm, text.minRenderPx!, DEFAULT_VIEWBOX_MM.width),
          label,
        ).toBeGreaterThanOrEqual(MINIMUM_TEXT_RENDER_PX);
      }
    }
  });
});

describe('J.2: Pfeilrichtung als nichtfarblicher Bedeutungskanal', () => {
  type Line = Extract<Primitive, { type: 'line' }>;

  function linesOf(definition: (typeof COMMS_PICTOGRAMS)[number]): readonly Line[] {
    return definition.primitives.filter((p): p is Line => p.type === 'line');
  }

  /**
   * Für jede der beiden Pfeilspitzen (links und rechts der Mittellinie): die Spitze ist der
   * Punkt, an dem sich beide Schrägen auf der Mittellinie (y = 16) treffen; der offene Schenkel
   * ist ihr jeweils anderes Ende. „Nach außen" heißt: die Spitze liegt weiter von der Mitte
   * entfernt als der offene Schenkel — nicht umgekehrt.
   */
  function pointsOutward(lines: readonly Line[]): boolean {
    const shaft = lines.reduce((longest, line) =>
      Math.abs(line.x2 - line.x1) > Math.abs(longest.x2 - longest.x1) ? line : longest,
    );
    const centerX = (shaft.x1 + shaft.x2) / 2;
    const barbs = lines.filter((line) => line !== shaft);
    return barbs.every((barb) => {
      const tip = barb.y1 === 16 ? barb.x1 : barb.x2;
      const openEnd = barb.y1 === 16 ? barb.x2 : barb.x1;
      return Math.abs(tip - centerX) > Math.abs(openEnd - centerX);
    });
  }

  it('zeigt bei Wechselverkehr (J.2.1) nach außen und bei Gegenverkehr (J.2.2) nach innen', () => {
    const wechselverkehr = COMMS_PICTOGRAMS.find((d) => d.section === 'J.2.1');
    const gegenverkehr = COMMS_PICTOGRAMS.find((d) => d.section === 'J.2.2');
    if (wechselverkehr === undefined || gegenverkehr === undefined) {
      throw new Error('J.2.1 oder J.2.2 fehlt im Bestand.');
    }
    expect(pointsOutward(linesOf(wechselverkehr))).toBe(true);
    expect(pointsOutward(linesOf(gegenverkehr))).toBe(false);
  });

  it('hält die beiden Betriebsarten auch im Monochromprofil geometrisch auseinander', () => {
    const monochromeSvg = (definition: (typeof COMMS_PICTOGRAMS)[number]): string =>
      renderSvg(
        { viewBox: DEFAULT_VIEWBOX_MM, children: definition.primitives },
        { size: 64, theme: PRINT_MONOCHROME_THEME, idPrefix: 'comms-family-test' },
      );
    const svgs = new Set(COMMS_PICTOGRAMS.map(monochromeSvg));
    expect(svgs.size).toBe(COMMS_PICTOGRAMS.length);
  });
});
