import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { RECIPES, composeFromCatalog } from '@einsatzzeichen/catalog';
import {
  ANHANG_G_PROOF_HEIGHT,
  ANHANG_G_PROOF_WIDTH,
  anhangGProofInventory,
  generateAnhangGVisualProof,
  rasterizeVisualProofSvg,
} from './visual-proof.js';

const EXPECTED_INVENTORY = [
  ['G.1', 'G.1_Versorgung mit Verbrauchsgütern.svg'],
  ['G.1.1', 'G.1.1_Versorgungstrupp Feuerwehr_Materialerhaltung.svg'],
  ['G.1.2', 'G.1.2_Versorgungstrupp DLRG.svg'],
  ['G.1.3', 'G.1.3_Versorgungstrupp Feuerwehr_Verbrauchsgüter.svg'],
  ['G.1.4', 'G.1.4_Verpflegungszug.svg'],
  ['G.1.5', 'G.1.5_Instandhaltungsgruppe.svg'],
  ['G.2', 'G.2_Versorgung mit Trinkwasser.svg'],
  ['G.2.1', 'G.2.1_Fahrzeug Instandhaltung.svg'],
  ['G.2.2', 'G.2.2_Anhänger Technik Sicherheit.svg'],
  ['G.2.3', 'G.2.3_Geräteanhänger Feldkochherd.svg'],
  ['G.3', 'G.3_Versorgung mit Brauchwasser.svg'],
  ['G.3.1', 'G.3.1_Verpflegungsstelle_betrieben durch Feuerwehr.svg'],
  ['G.3.2', 'G.3.2_Verpflegungszubereitungsstelle_betrieben durch Polizei.svg'],
  ['G.3.3', 'G.3.3_Versorgungsstelle Hilfsorganisation.svg'],
  ['G.3.4', 'G.3.4_Zentrale Stelle Notversorgung.svg'],
  ['G.3.5', 'G.3.5_Mobiler Tankpunkt Diesel_betrieben durch Bundeswehr.svg'],
  ['G.4', 'G.4_Versorgung mit Elektrizität.svg'],
  ['G.5', 'G.5_Versorgung mit Verpflegung.svg'],
  ['G.6', 'G.6_Zubereiten von Verpflegung.svg'],
  ['G.7', 'G.7_Instandhaltung.svg'],
  ['G.8', 'G.8_Entsorgung.svg'],
] as const;

const HEADLESS_FORMATION_FOOT_BAND = ['G.1', 'G.2', 'G.3', 'G.4', 'G.5', 'G.6', 'G.7', 'G.8'] as const;
const HEADED_FORMATION_FOOT_BAND = ['G.1.1', 'G.1.2', 'G.1.3', 'G.1.4', 'G.1.5'] as const;

const temporaryDirectories: string[] = [];

afterEach(() => {
  for (const directory of temporaryDirectories.splice(0)) {
    rmSync(directory, { recursive: true, force: true });
  }
});

function fixtureDirectory(): string {
  const directory = mkdtempSync(join(tmpdir(), 'anhang-g-visual-proof-'));
  temporaryDirectories.push(directory);
  for (const [index, [, filename]] of EXPECTED_INVENTORY.entries()) {
    const channel = (32 + index * 9).toString(16).padStart(2, '0');
    writeFileSync(
      join(directory, filename),
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 90 90">` +
        `<rect x="5" y="5" width="80" height="80" fill="#${channel}5577"/>` +
        `</svg>`,
      'utf8',
    );
  }
  return directory;
}

describe('Anhang-G-Visual-Proof', () => {
  it('bindet exakt 21 Referenzen in G-Rezeptreihenfolge', () => {
    expect(anhangGProofInventory()).toEqual(
      EXPECTED_INVENTORY.map(([section, referenceAsset]) => ({ section, referenceAsset })),
    );
  });

  it('rastert Katalogtext vor der Einbettung sichtbar', () => {
    const image = rasterizeVisualProofSvg(
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 90 90">` +
        `<text x="45" y="50" text-anchor="middle" font-family="Arimo" ` +
        `font-size="12" fill="#000000">DLRG</text></svg>`,
    );
    const pixels = image.pixels;
    let visiblePixels = 0;
    for (let index = 3; index < pixels.length; index += 4) {
      if ((pixels[index] ?? 0) > 0) visiblePixels += 1;
    }

    expect(image.width).toBe(276);
    expect(image.height).toBe(276);
    expect(visiblePixels).toBeGreaterThan(500);
  });

  it('zeichnet Diesel in G.3.5 wie die lokale Referenz schwarz', () => {
    const recipe = RECIPES['G.3.5'];
    const drawing = composeFromCatalog(recipe.spec, recipe.title);
    const diesel = drawing.children.find(
      (primitive) => primitive.type === 'text' && primitive.content === 'Diesel',
    );

    expect(diesel?.style?.fill).toBe('schwarz');
  });

  it('öffnet die Oberkante exakt an den acht kopflosen formation/foot-band-Rezepten', () => {
    const formationFootBand = Object.entries(RECIPES)
      .filter(([section, recipe]) =>
        section.startsWith('G.') &&
        recipe.spec.kind === 'formation' &&
        'bodyVariant' in recipe.spec &&
        recipe.spec.bodyVariant === 'foot-band')
      .map(([section]) => section);
    expect(formationFootBand).toEqual([
      ...HEADLESS_FORMATION_FOOT_BAND.slice(0, 1),
      ...HEADED_FORMATION_FOOT_BAND,
      ...HEADLESS_FORMATION_FOOT_BAND.slice(1),
    ]);

    for (const section of HEADLESS_FORMATION_FOOT_BAND) {
      const recipe = RECIPES[section];
      const drawing = composeFromCatalog(recipe.spec, recipe.title);
      const body = drawing.children.find((primitive) => primitive.role === 'body');
      const openOutline = drawing.children.find(
        (primitive) => primitive.type === 'polyline' && primitive.role === 'bodyExtra',
      );
      expect(body?.style?.stroke, section).toBe('none');
      expect(openOutline, section).toMatchObject({
        type: 'polyline', closed: false, points: [[1, 6], [1, 26], [31, 26], [31, 6]],
      });
    }
  });

  it('behält die geschlossene Oberkante mit Kopf und an anderen Körpervarianten', () => {
    for (const section of HEADED_FORMATION_FOOT_BAND) {
      const recipe = RECIPES[section];
      const drawing = composeFromCatalog(recipe.spec, recipe.title);
      const body = drawing.children.find((primitive) => primitive.role === 'body');
      expect(body, section).toMatchObject({ type: 'rect', style: { stroke: 'schwarz' } });
      expect(drawing.children.some(
        (primitive) => primitive.type === 'polyline' && primitive.role === 'bodyExtra',
      ), section).toBe(false);
    }

    for (const section of ['F.1.3', 'F.1.17'] as const) {
      const recipe = RECIPES[section];
      const drawing = composeFromCatalog(recipe.spec, recipe.title);
      expect(drawing.children.find((primitive) => primitive.role === 'body')?.style?.stroke, section)
        .toBe('schwarz');
    }

    for (const section of ['G.2.1', 'G.2.2', 'G.2.3', 'G.3.1', 'G.3.2', 'G.3.3', 'G.3.4', 'G.3.5'] as const) {
      const recipe = RECIPES[section];
      const drawing = composeFromCatalog(recipe.spec, recipe.title);
      expect(drawing.children.find((primitive) => primitive.role === 'body')?.style?.stroke, section)
        .toBe('schwarz');
    }
  });

  it('schreibt einen deterministischen PNG-Kontaktbogen mit festem Outputvertrag', () => {
    const referenceRoot = fixtureDirectory();
    const proofRoot = resolve('out/lfh-421');
    mkdirSync(proofRoot, { recursive: true });
    const outputDirectory = mkdtempSync(join(proofRoot, 'visual-proof-test-'));
    temporaryDirectories.push(outputDirectory);
    const firstOutput = join(outputDirectory, 'first.png');
    const secondOutput = join(outputDirectory, 'second.png');

    const first = generateAnhangGVisualProof({ referenceRoot, outputFile: firstOutput });
    const second = generateAnhangGVisualProof({ referenceRoot, outputFile: secondOutput });
    const firstPng = readFileSync(firstOutput);
    const secondPng = readFileSync(secondOutput);

    expect(first.sections).toEqual(EXPECTED_INVENTORY.map(([section]) => section));
    expect(first.width).toBe(ANHANG_G_PROOF_WIDTH);
    expect(first.height).toBe(ANHANG_G_PROOF_HEIGHT);
    expect(first.byteLength).toBe(firstPng.byteLength);
    expect(first.sha256).toMatch(/^[0-9a-f]{64}$/);
    expect(firstPng.subarray(0, 8)).toEqual(
      Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    );
    expect(second).toEqual({ ...first, outputFile: secondOutput });
    expect(secondPng).toEqual(firstPng);
  });

  it('verweigert Ausgaben außerhalb des ignorierten Proofverzeichnisses', () => {
    const referenceRoot = fixtureDirectory();

    expect(() => generateAnhangGVisualProof({
      referenceRoot,
      outputFile: join(referenceRoot, 'nicht-erlaubt.png'),
    })).toThrow('out/lfh-421');
  });
});
