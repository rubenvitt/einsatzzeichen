import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { inflateSync } from 'node:zlib';
import { afterEach, describe, expect, it } from 'vitest';
import {
  ACCESSIBLE_LIGHT_THEME,
  PRINT_MONOCHROME_THEME,
  RECIPES,
  composeFromCatalog,
} from '@einsatzzeichen/catalog';
import { mmToUnits } from '@einsatzzeichen/schema';
import { renderCanvas, renderSvg } from '@einsatzzeichen/core';
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
const FIXTURE_SOURCE_SET_DIGEST = 'c8fafd6ed92e9981413d10e84c1584c85ecf035a09cf82dde4bf11e7d3a2cb45';
const CLI_ENTRY = fileURLToPath(new URL('../index.ts', import.meta.url));
const TSX_ENTRY = fileURLToPath(
  new URL('../../../../node_modules/tsx/dist/cli.mjs', import.meta.url),
);

const temporaryDirectories: string[] = [];

if (typeof globalThis.Path2D === 'undefined') {
  class Path2DStub {
    constructor(_d?: string) {}
  }
  // @ts-expect-error: Der Test braucht nur den Konstruktor, weil der Recorder nie rastert.
  globalThis.Path2D = Path2DStub;
}

function recordingCanvas(): { ctx: CanvasRenderingContext2D; calls: [string, ...unknown[]][] } {
  const calls: [string, ...unknown[]][] = [];
  const target = new Proxy<Record<string, unknown>>({}, {
    get(_object, property: string | symbol) {
      if (property === 'canvas') return { width: 0, height: 0 };
      return (...args: unknown[]) => calls.push([String(property), ...args]);
    },
    set(_object, property: string | symbol, value: unknown) {
      calls.push([`set:${String(property)}`, value]);
      return true;
    },
    has() {
      return true;
    },
  });
  if (!looksLikeCanvasRenderingContext2D(target)) {
    throw new Error('Canvas-Recorder stellt die benötigte Oberfläche nicht bereit.');
  }
  return { ctx: target, calls };
}

function looksLikeCanvasRenderingContext2D(value: object): value is CanvasRenderingContext2D {
  return 'save' in value && 'restore' in value && 'fill' in value && 'stroke' in value;
}

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

function temporaryDirectory(prefix: string): string {
  const directory = mkdtempSync(join(tmpdir(), prefix));
  temporaryDirectories.push(directory);
  return directory;
}

interface DecodedPng {
  width: number;
  height: number;
  pixels: Uint8Array;
}

function paethPredictor(left: number, above: number, upperLeft: number): number {
  const prediction = left + above - upperLeft;
  const leftDistance = Math.abs(prediction - left);
  const aboveDistance = Math.abs(prediction - above);
  const upperLeftDistance = Math.abs(prediction - upperLeft);
  if (leftDistance <= aboveDistance && leftDistance <= upperLeftDistance) return left;
  return aboveDistance <= upperLeftDistance ? above : upperLeft;
}

/** Dekodiert genau den nicht-interlaced RGBA/8-Vertrag, den Resvg für den Proof schreibt. */
function decodeProofPng(png: Buffer): DecodedPng {
  expect(png.subarray(0, 8)).toEqual(
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  );
  let offset = 8;
  let width = 0;
  let height = 0;
  const compressed: Buffer[] = [];
  while (offset < png.length) {
    const length = png.readUInt32BE(offset);
    const type = png.toString('ascii', offset + 4, offset + 8);
    const data = png.subarray(offset + 8, offset + 8 + length);
    if (type === 'IHDR') {
      width = data.readUInt32BE(0);
      height = data.readUInt32BE(4);
      expect([...data.subarray(8, 13)]).toEqual([8, 6, 0, 0, 0]);
    }
    if (type === 'IDAT') compressed.push(data);
    offset += length + 12;
  }

  const scanlines = inflateSync(Buffer.concat(compressed));
  const stride = width * 4;
  const pixels = new Uint8Array(stride * height);
  let sourceOffset = 0;
  for (let y = 0; y < height; y += 1) {
    const filter = scanlines[sourceOffset] ?? -1;
    sourceOffset += 1;
    for (let x = 0; x < stride; x += 1) {
      const raw = scanlines[sourceOffset + x] ?? 0;
      const target = y * stride + x;
      const left = x >= 4 ? (pixels[target - 4] ?? 0) : 0;
      const above = y > 0 ? (pixels[target - stride] ?? 0) : 0;
      const upperLeft = y > 0 && x >= 4 ? (pixels[target - stride - 4] ?? 0) : 0;
      const predictor = filter === 0
        ? 0
        : filter === 1
          ? left
          : filter === 2
            ? above
            : filter === 3
              ? Math.floor((left + above) / 2)
              : filter === 4
                ? paethPredictor(left, above, upperLeft)
                : Number.NaN;
      if (!Number.isFinite(predictor)) throw new Error(`Unbekannter PNG-Filter ${filter}.`);
      pixels[target] = (raw + predictor) & 0xff;
    }
    sourceOffset += stride;
  }
  return { width, height, pixels };
}

function darkPixelsIn(
  image: DecodedPng,
  crop: { x: number; y: number; width: number; height: number },
): number {
  let count = 0;
  for (let y = crop.y; y < crop.y + crop.height; y += 1) {
    for (let x = crop.x; x < crop.x + crop.width; x += 1) {
      const index = (y * image.width + x) * 4;
      if (
        (image.pixels[index] ?? 255) < 80 &&
        (image.pixels[index + 1] ?? 255) < 80 &&
        (image.pixels[index + 2] ?? 255) < 80 &&
        (image.pixels[index + 3] ?? 0) > 128
      ) count += 1;
    }
  }
  return count;
}

function runVisualProofCli(
  workingDirectory: string,
  referenceRoot: string,
  outputFile: string,
) {
  return spawnSync(
    process.execPath,
    [TSX_ENTRY, CLI_ENTRY, 'visual-proof', '--reference-root', referenceRoot, '--out', outputFile],
    { cwd: workingDirectory, encoding: 'utf8' },
  );
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
      expect(body, section).toMatchObject({
        type: 'path',
        role: 'body',
        d: 'M 1 6 L 1 26 L 31 26 L 31 6',
        style: { fill: 'weiss', stroke: 'schwarz' },
      });
      expect(drawing.children.some((primitive) => primitive.role === 'bodyExtra'), section)
        .toBe(false);
    }
  });

  it('behandelt leere Labelzonen wie fehlende und echte Labels weiter als belegt', () => {
    const recipe = RECIPES['G.1'];
    const omitted = composeFromCatalog(recipe.spec, recipe.title);
    const empty = composeFromCatalog({ ...recipe.spec, labels: {} }, recipe.title);
    const labelled = composeFromCatalog({ ...recipe.spec, labels: { center: 'X' } }, recipe.title);

    expect(empty).toEqual(omitted);
    expect(labelled.children.find((primitive) => primitive.role === 'body')).toMatchObject({
      type: 'rect', style: { stroke: 'schwarz' },
    });
  });

  it.each([ACCESSIBLE_LIGHT_THEME, PRINT_MONOCHROME_THEME])(
    '$id signiert alle acht offenen G-Körper in SVG und Canvas als Organisationskörper',
    (theme) => {
      for (const section of HEADLESS_FORMATION_FOOT_BAND) {
        const recipe = RECIPES[section];
        const drawing = composeFromCatalog(recipe.spec, recipe.title);
        const svg = renderSvg(drawing, { theme });
        const bodyTag = svg.match(/<path d="M 1 6 L 1 26 L 31 26 L 31 6"[^>]*\/>/)?.[0];
        expect(bodyTag, section).toContain('fill="#ffffff"');
        // Pfadkoordinaten, Strichbreite und Dashwerte bleiben im SVG-Rohmaß Millimeter; die
        // Pfadtransformation skaliert sie gemeinsam. Canvas folgt demselben Vertrag.
        expect(bodyTag, section).toContain('stroke-dasharray="1 2"');

        const { ctx, calls } = recordingCanvas();
        renderCanvas(drawing, ctx, { theme });
        expect(calls, section).toContainEqual([
          'setLineDash', [1, 2],
        ]);
      }
    },
  );

  it.each([ACCESSIBLE_LIGHT_THEME, PRINT_MONOCHROME_THEME])(
    '$id behält die Organisationssignatur an den fünf geschlossenen G-Kontrollen',
    (theme) => {
      const expectedDashes = [
        ['G.1.1', []],
        ['G.1.2', [1, 2]],
        ['G.1.3', []],
        ['G.1.4', [1, 2]],
        ['G.1.5', [1, 2]],
      ] as const;
      for (const [section, dashMm] of expectedDashes) {
        const recipe = RECIPES[section];
        const drawing = composeFromCatalog(recipe.spec, recipe.title);
        const body = drawing.children.find((primitive) => primitive.role === 'body');
        expect(body, section).toMatchObject({ type: 'rect', style: { stroke: 'schwarz' } });

        const svg = renderSvg(drawing, { theme });
        const bodyTag = svg.match(/<rect[^>]*\/>/)?.[0];
        if (dashMm.length === 0) expect(bodyTag, section).not.toContain('stroke-dasharray');
        else expect(bodyTag, section).toContain('stroke-dasharray="2.835 5.669"');

        const { ctx, calls } = recordingCanvas();
        renderCanvas(drawing, ctx, { theme });
        expect(calls, section).toContainEqual(['setLineDash', dashMm.map(mmToUnits)]);
      }
    },
  );

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
    expect(first.sourceSetDigest).toBe(FIXTURE_SOURCE_SET_DIGEST);
    expect(firstPng.subarray(0, 8)).toEqual(
      Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    );
    expect(second).toEqual({ ...first, outputFile: secondOutput });
    expect(secondPng).toEqual(firstPng);
  });

  it('enthält DLRG, Diesel und Bw als dunkle Textpixel im finalen PNG', () => {
    const referenceRoot = fixtureDirectory();
    const proofRoot = resolve('out/lfh-421');
    mkdirSync(proofRoot, { recursive: true });
    const outputDirectory = mkdtempSync(join(proofRoot, 'visual-proof-pixels-'));
    temporaryDirectories.push(outputDirectory);
    const outputFile = join(outputDirectory, 'proof.png');

    generateAnhangGVisualProof({ referenceRoot, outputFile });
    const image = decodeProofPng(readFileSync(outputFile));
    expect(image.width).toBe(ANHANG_G_PROOF_WIDTH);
    expect(image.height).toBe(ANHANG_G_PROOF_HEIGHT);
    const crops = [
      ['DLRG', { x: 2032, y: 211, width: 68, height: 48 }, 80],
      ['Diesel', { x: 492, y: 2011, width: 120, height: 50 }, 80],
      ['Bw', { x: 652, y: 2076, width: 34, height: 55 }, 20],
    ] as const;
    for (const [label, crop, minimum] of crops) {
      expect(darkPixelsIn(image, crop), label).toBeGreaterThan(minimum);
    }
  });

  it('gibt den deterministischen Quellen-Set-Digest im echten CLI-Lauf aus', () => {
    const referenceRoot = fixtureDirectory();
    const workingDirectory = temporaryDirectory('anhang-g-proof-cli-');
    const result = runVisualProofCli(
      workingDirectory,
      referenceRoot,
      'out/lfh-421/proof.png',
    );

    expect(result.status, result.stderr).toBe(0);
    expect(result.stdout).toContain(`Quellen-Set SHA-256 ${FIXTURE_SOURCE_SET_DIGEST}`);
  });

  it.each(['root', 'nested'] as const)(
    'folgt keinem %s-Symlink aus dem erlaubten Outputbaum',
    (position) => {
      const referenceRoot = fixtureDirectory();
      const workingDirectory = temporaryDirectory(`anhang-g-proof-${position}-`);
      const externalDirectory = temporaryDirectory(`anhang-g-proof-external-${position}-`);
      const outDirectory = join(workingDirectory, 'out');
      mkdirSync(outDirectory);
      const outputFile = position === 'root'
        ? 'out/lfh-421/proof.png'
        : 'out/lfh-421/nested/proof.png';
      if (position === 'root') {
        symlinkSync(externalDirectory, join(outDirectory, 'lfh-421'), 'dir');
      } else {
        const proofDirectory = join(outDirectory, 'lfh-421');
        mkdirSync(proofDirectory);
        symlinkSync(externalDirectory, join(proofDirectory, 'nested'), 'dir');
      }
      const externalTarget = join(externalDirectory, 'proof.png');
      writeFileSync(externalTarget, 'unverändert', 'utf8');

      const result = runVisualProofCli(workingDirectory, referenceRoot, outputFile);

      expect(result.status, result.stderr).not.toBe(0);
      expect(readFileSync(externalTarget, 'utf8')).toBe('unverändert');
    },
  );

  it('verweigert Ausgaben außerhalb des ignorierten Proofverzeichnisses', () => {
    const referenceRoot = fixtureDirectory();

    expect(() => generateAnhangGVisualProof({
      referenceRoot,
      outputFile: join(referenceRoot, 'nicht-erlaubt.png'),
    })).toThrow('out/lfh-421');
  });
});
