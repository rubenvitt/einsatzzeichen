// Größen- und Inhalts-Gate für den Publish-Umfang von `@einsatzzeichen/core` (LFH-575).
//
// Was es schützt: `core` ist seit LFH-560 das Produkt — Bausteine, Zonen, Regeln, Komposition,
// Renderer. Prüfdaten gehören ins Prüfpaket `conformance`: SVG-Snapshots (rund 16 MB),
// `fingerprints.json` (0,5 MB), Rezepte, Coverage, Domain-Reviews, die TTF-Schriftdateien. Zieht ein
// Umbau davon etwas nach `core` und landet es in `dist`, soll das hier auffallen, bevor es auf
// npm steht — nicht erst, wenn ein Nutzer sich über ein 20-MB-Paket wundert.
//
// Warum ein CI-Skript und kein vitest-Test: das Gate misst, was `pnpm pack` aus `dist` packt,
// braucht also einen frischen Build. `pnpm test` hängt heute nicht vom Build ab (die Aliase in
// `vitest.config.ts` zeigen auf die Quellen); ein Test, der erst baut oder einen alten `dist`
// misst, wäre langsam oder falsch. Deshalb läuft das Skript in CI direkt nach `pnpm build`.
// Die Prüflogik (`checkCorePackage`) ist rein und in `core-package.test.mjs` ohne Build getestet.
//
// Aufruf: pnpm build && node scripts/gates/core-package.mjs
import { spawnSync } from 'node:child_process';
import { mkdtempSync, readdirSync, readFileSync, rmSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { gunzipSync } from 'node:zlib';

/**
 * Grenzen, zuletzt gemessen am 2. Oktober 2026 für LFH-832 (`pnpm build`, dann `pnpm pack`):
 *
 * | Größe | gemessen | Obergrenze | Untergrenze |
 * |---|---|---|---|
 * | Tarball (gepackt) | 831 766 B | 980 000 B (+18 %) | 250 000 B |
 * | entpackt | 7 033 446 B | 7 300 000 B (+4 %) | 3 000 000 B |
 * | Einträge | 470 | — | 200 |
 *
 * **Anhebung am 2. Oktober 2026 (LFH-832):** `core` liefert die Zeichenschrift für den Browser
 * aus (`fonts/`, vier WOFF2 mit zusammen 100 524 B, dazu `text.css`, `README.md` und `OFL.txt`).
 * Vorher 730 000 B gepackt; `main` lag ohne die Schriften schon bei 727 272 / 6 925 269 B
 * (463 Einträge). WOFF2 ist bereits Brotli-komprimiert, gepackt wachsen die Schriften also um
 * fast ihre volle Größe (+104 494 B). Die Tarball-Grenze hält wieder rund +18 %. Die entpackte
 * Grenze bleibt: Ihr Puffer (rund 267 KB) ist weiter kleiner als `fingerprints.json`.
 *
 * Frühere Messung am 29. September 2026 auf `claude/lfh-561-orchestrierung-cb6ed0` nach dem Merge
 * von LFH-561 mit LFH-585/586/786: 616 306 B gepackt, 6 843 338 B entpackt, 376 Einträge.
 *
 * Zwei Anhebungen am 29. September 2026, unabhängig voneinander entschieden und beim
 * Zusammenführen zusammengerechnet:
 *
 * - **Auf `main` (LFH-585, LFH-786)**, vorher 500 000 / 6 500 000 B (gemessen am 21.09.2026 mit
 *   422 660 / 6 060 107 B): zwei weitere Textmetriken (Arimo Medium und Medium Italic, je rund
 *   78 KB), das Feld `fontStyle` in allen Piktogramm-Deklarationen und die in Anhang C eingesetzten
 *   Kapitel-4-Piktogramme. Gemessen 515 836 / 6 469 058 B, neue Grenzen 600 000 / 6 900 000 B.
 * - **Auf der API-Initiative (LFH-561)**, Entscheidung des Eigentümers: Die Initiative bringt
 *   legitim Produktinhalt nach `core` — Regeltexte (LFH-579, rund 52 KB entpackt), die generierte
 *   Herkunftstabelle (LFH-581, rund 59 KB), Vokabular und Codec (LFH-578/577), die an den
 *   Referenzdateien vermessene Geometrie für Verband, Sonderformen, Zustände, Pfeile, Linien,
 *   Wetter und Tierzustand samt freistehender Spec-Art (LFH-577). Gemessen 545 962 / 6 507 407 B,
 *   neue Grenzen 650 000 / 6 950 000 B. Kommentare im Build wegzulassen war die Alternative;
 *   `removeComments` entfernt aber auch die JSDoc aus den `.d.ts`, und die Doku soll im npm-Paket
 *   bleiben.
 *
 * Zusammen lag der Stand über beiden Grenzen; die neuen Grenzen hielten dieselben Abstände
 * (gepackt rund +18 %, entpackt +7 %). Der entpackte Puffer bleibt mit rund 457 KB kleiner als
 * `fingerprints.json`.
 *
 * **Entpackt ist die scharfe Grenze.** Der Puffer von rund 457 KB ist kleiner als
 * `fingerprints.json` (503 954 B): landet die Datei — oder ihr Inhalt, in ein `.ts`-Modul
 * verpackt — in `dist`, reißt die Grenze. Gepackt fiele dieselbe Datei nicht auf, sie komprimiert
 * auf rund 23 KB; die Tarball-Grenze fängt nur den groben Fall (die Snapshots komprimieren auf
 * etwa 2 MB). Rund 3,7 MB der entpackten Größe sind Deklarationen der Fähigkeitspiktogramme
 * (`dist/geometry/pictograms/capabilities/*.d.ts`, die größte 1,19 MB) — wachsen die mit neuen
 * Piktogrammen legitim, wird die Grenze bewusst angehoben, mit neuem Messwert in dieser Tabelle.
 *
 * **Untergrenzen** fangen den umgekehrten Fehler: ein fehlender oder halber `dist` ergibt ein
 * winziges Paket, und eine reine Obergrenze wäre dann grün.
 */
export const LIMITS = Object.freeze({
  maxPackedBytes: 980_000,
  minPackedBytes: 250_000,
  maxUnpackedBytes: 7_300_000,
  minUnpackedBytes: 3_000_000,
  minEntries: 200,
});

/** Pflichteinträge: ohne sie ist das Paket nicht benutzbar (siehe `publishConfig` in `package.json`). */
const REQUIRED = [
  'package/package.json',
  'package/dist/index.js',
  'package/dist/index.d.ts',
  // Ohne Lizenztext darf die Schrift nicht weitergegeben werden (OFL §2), ohne CSS fehlt der
  // dokumentierte Einstieg `@einsatzzeichen/core/fonts/text.css` (LFH-832).
  'package/fonts/text.css',
  'package/fonts/OFL.txt',
];

/** Verbotene Muster mit Begründung — die Meldung soll sagen, was durchgerutscht ist. */
const FORBIDDEN = [
  [/(^|\/)__snapshots__\//, 'Snapshot-Ordner (Prüfdaten, gehören nach conformance)'],
  [/\.snap$/, 'Snapshot-Datei'],
  [/\.test(-helper)?\.[cm]?[jt]s$|\.test\.d\.ts$/, 'Testdatei'],
  [/(^|\/)test-support\//, 'Testhilfe'],
  // Ausgeliefert wird die Schrift nur als WOFF2 unter `fonts/` (LFH-832); die TTFs für resvg und
  // die Prüfgates bleiben im Prüfpaket.
  [
    /^(?!package\/fonts\/[^/]+\.woff2$).*\.(ttf|otf|woff2?)$/i,
    'Schriftdatei außerhalb von fonts/*.woff2 (TTFs liegen im Prüfpaket)',
  ],
  [/\.svg$/i, 'SVG-Datei (Referenz- oder Snapshotmaterial)'],
  [/fingerprints\.json$/, 'Fingerprint-Daten'],
];

/**
 * Positivliste: alles, was `core` veröffentlichen darf. Was nicht passt, ist neu und muss hier
 * bewusst ergänzt werden — so fällt auch Prüfmaterial auf, das kein verbotenes Muster trifft.
 */
const ALLOWED = [
  /^package\/(package\.json|README\.md|LICENSE)$/,
  /^package\/dist\/.+\.(js|d\.ts|d\.ts\.map)$/,
  /^package\/dist\/assets\/arimo(-bold|-medium|-medium-italic)?-metrics\.json$/,
  /^package\/fonts\/(text-(regular|medium|bold|medium-italic)\.woff2|text\.css|OFL\.txt|README\.md)$/,
];

/**
 * Prüft einen gepackten Publish-Umfang. Rein, damit die Regeln ohne Build testbar sind.
 * @param {{ packedBytes: number, entries: ReadonlyArray<{ path: string, size: number }> }} pack
 * @param {typeof LIMITS} [limits]
 * @returns {string[]} Befunde; leer heißt bestanden.
 */
export function checkCorePackage({ packedBytes, entries }, limits = LIMITS) {
  const findings = [];
  const unpackedBytes = entries.reduce((sum, entry) => sum + entry.size, 0);
  const fmt = (bytes) => `${bytes.toLocaleString('de-DE')} B`;

  if (packedBytes > limits.maxPackedBytes) {
    findings.push(`Tarball ${fmt(packedBytes)} über der Obergrenze ${fmt(limits.maxPackedBytes)}.`);
  }
  if (packedBytes < limits.minPackedBytes) {
    findings.push(`Tarball ${fmt(packedBytes)} unter der Untergrenze ${fmt(limits.minPackedBytes)} — dist fehlt oder ist unvollständig?`);
  }
  if (unpackedBytes > limits.maxUnpackedBytes) {
    findings.push(`Entpackt ${fmt(unpackedBytes)} über der Obergrenze ${fmt(limits.maxUnpackedBytes)}.`);
  }
  if (unpackedBytes < limits.minUnpackedBytes) {
    findings.push(`Entpackt ${fmt(unpackedBytes)} unter der Untergrenze ${fmt(limits.minUnpackedBytes)} — dist fehlt oder ist unvollständig?`);
  }
  if (entries.length < limits.minEntries) {
    findings.push(`${entries.length} Einträge, erwartet mindestens ${limits.minEntries} — dist fehlt oder ist unvollständig?`);
  }

  const paths = new Set(entries.map((entry) => entry.path));
  for (const required of REQUIRED) {
    if (!paths.has(required)) findings.push(`Pflichteintrag fehlt: ${required}`);
  }
  for (const { path } of entries) {
    const forbidden = FORBIDDEN.find(([pattern]) => pattern.test(path));
    if (forbidden) {
      findings.push(`Verboten im Publish-Umfang: ${path} (${forbidden[1]})`);
    } else if (!ALLOWED.some((pattern) => pattern.test(path))) {
      findings.push(`Nicht in der Positivliste: ${path}`);
    }
  }
  return findings;
}

/**
 * Liest die Dateieinträge eines gzip-Tarballs (ustar, mit PAX-Langnamen) samt Größe.
 * Eigene Minimalumsetzung statt `tar -tv`, weil GNU- und BSD-tar die Größe in verschiedenen
 * Spalten ausgeben.
 * @param {Buffer} tgz
 */
export function readTarEntries(tgz) {
  const tar = gunzipSync(tgz);
  const entries = [];
  const text = (start, length) => tar.subarray(start, start + length).toString('utf8').replace(/\0.*$/s, '');
  let offset = 0;
  let paxPath;
  while (offset + 512 <= tar.length) {
    const name = text(offset, 100);
    if (name === '') break;
    const size = Number.parseInt(text(offset + 124, 12).trim() || '0', 8);
    const type = text(offset + 156, 1);
    const prefix = text(offset + 345, 155);
    const body = offset + 512;
    if (type === 'x') {
      const match = /\d+ path=([^\n]*)\n/.exec(tar.subarray(body, body + size).toString('utf8'));
      paxPath = match?.[1];
    } else if (type === '0' || type === '') {
      entries.push({ path: paxPath ?? (prefix ? `${prefix}/${name}` : name), size });
      paxPath = undefined;
    } else {
      paxPath = undefined;
    }
    offset = body + Math.ceil(size / 512) * 512;
  }
  return entries;
}

function main() {
  const coreDir = fileURLToPath(new URL('../../packages/core/', import.meta.url));
  const outDir = mkdtempSync(join(tmpdir(), 'core-pack-'));
  try {
    const pack = spawnSync('pnpm', ['pack', '--pack-destination', outDir], {
      cwd: coreDir,
      encoding: 'utf8',
    });
    if (pack.status !== 0) {
      console.error(pack.error?.message ?? pack.stderr);
      process.exit(1);
    }
    const tarball = readdirSync(outDir).find((file) => file.endsWith('.tgz'));
    if (!tarball) {
      console.error(`pnpm pack hat keinen Tarball in ${outDir} abgelegt.`);
      process.exit(1);
    }
    const tarballPath = join(outDir, tarball);
    const packedBytes = statSync(tarballPath).size;
    const entries = readTarEntries(readFileSync(tarballPath));
    const unpackedBytes = entries.reduce((sum, entry) => sum + entry.size, 0);
    console.log(
      `@einsatzzeichen/core: ${entries.length} Einträge, gepackt ${packedBytes.toLocaleString('de-DE')} B, entpackt ${unpackedBytes.toLocaleString('de-DE')} B`,
    );
    const findings = checkCorePackage({ packedBytes, entries });
    if (findings.length > 0) {
      console.error(`Größen-Gate core: ${findings.length} Befund(e)`);
      for (const finding of findings) console.error(`  - ${finding}`);
      process.exit(1);
    }
    console.log('Größen-Gate core: bestanden.');
  } finally {
    rmSync(outDir, { recursive: true, force: true });
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
