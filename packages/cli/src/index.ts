#!/usr/bin/env node
/*
 * Befehle nach Paket (LFH-560, LFH-572):
 *
 * Prüfen (conformance) — Rezepte, Coverage-Manifest, Domain-Reviews, Referenzinventar, Gates:
 *   audit:reference, coverage, provenance:table, reference-diff, review-dossier, verify:repository, visual-proof
 * Export (core) — Geometrie, Themes und Renderer des Produkts:
 *   export (Rezeptliste noch über commands/export-recipes.ts aus conformance, bis LFH-580)
 *
 * `cli-packages.test.ts` hält die Zuordnung an den Importen fest.
 */
import { isRenderThemeId, renderTheme } from '@einsatzzeichen/core';
// Prüfen (conformance)
import { auditReference } from './commands/audit-reference.js';
import { coverage } from './commands/coverage.js';
import { writeProvenanceTable } from './commands/provenance-table.js';
import {
  DEFAULT_REFERENCE_DIFF_OUTPUT,
  ReferenceDiffError,
  referenceDiff,
} from './commands/reference-diff.js';
import { ReviewDossierError, reviewDossier } from './commands/review-dossier.js';
import {
  RepositoryPolicyError,
  verifyRepository,
} from './commands/verify-repository.js';
import {
  DEFAULT_ANHANG_G_PROOF_OUTPUT,
  generateAnhangGVisualProof,
} from './commands/visual-proof.js';
// Export (core)
import { InvalidExportSizeError, exportSvg, parseExportSize } from './commands/export.js';

class CliUsageError extends Error {}

function flag(name: string): string | undefined {
  const index = process.argv.indexOf(`--${name}`);
  if (index === -1) return undefined;

  const value = process.argv[index + 1];
  if (value === undefined) {
    throw new CliUsageError(`--${name} benötigt einen Wert, aber es folgte keiner.`);
  }
  if (value.startsWith('--')) {
    throw new CliUsageError(`--${name} benötigt einen Wert, aber es folgte die Option "${value}".`);
  }
  return value;
}

const command = process.argv[2];

switch (command) {
  // ── Prüfen (conformance) ──
  case 'audit:reference': {
    try {
      const filter = flag('filter');
      auditReference({
        ...(filter !== undefined ? { filter } : {}),
        print: process.argv.includes('--print'),
      });
    } catch (error) {
      if (error instanceof CliUsageError) {
        console.error(error.message);
        process.exit(1);
      }
      throw error;
    }
    break;
  }
  case 'coverage':
    coverage();
    break;
  case 'reference-diff': {
    try {
      const referenceRoot = flag('reference-root');
      if (referenceRoot === undefined) {
        throw new CliUsageError('reference-diff benötigt --reference-root <pfad>.');
      }
      const filter = flag('filter');
      const outDir = flag('out') ?? DEFAULT_REFERENCE_DIFF_OUTPUT;
      const result = referenceDiff({
        referenceRoot,
        outDir,
        ...(filter !== undefined ? { filter } : {}),
        sheets: process.argv.includes('--sheets'),
      });
      if (process.argv.includes('--json')) {
        console.log(JSON.stringify(result.report, null, 2));
      } else {
        const { summary } = result.report;
        console.log(
          `${summary.rows} Manifestzeilen, ${summary.compared} verglichen: ` +
            `${summary.congruent} deckungsgleich (Fläche höchstens 1 %), ` +
            `${summary.withinStrokeLimit} mit Strichanteil höchstens 3 %, ` +
            `${summary.missingReference} ohne Referenzdatei, ` +
            `${summary.sizeMismatch} mit abweichender Rastergröße.`,
        );
        console.log(`Geschrieben nach ${result.outDir}: ${result.files.join(', ')}.`);
      }
    } catch (error) {
      if (error instanceof CliUsageError || error instanceof ReferenceDiffError) {
        console.error(error.message);
        process.exit(1);
      }
      throw error;
    }
    break;
  }
  case 'review-dossier': {
    try {
      const out = flag('out');
      reviewDossier(out !== undefined ? { out } : {});
    } catch (error) {
      if (error instanceof CliUsageError || error instanceof ReviewDossierError) {
        console.error(error.message);
        process.exit(1);
      }
      throw error;
    }
    break;
  }
  case 'provenance:table': {
    const result = writeProvenanceTable();
    console.log(`${result.rows} verbatim-Zeilen nach ${result.file} geschrieben.`);
    break;
  }
  case 'verify:repository': {
    try {
      verifyRepository();
    } catch (error) {
      if (error instanceof RepositoryPolicyError) {
        console.error(error.message);
        process.exit(1);
      }
      throw error;
    }
    break;
  }
  case 'visual-proof': {
    try {
      const referenceRoot = flag('reference-root');
      if (referenceRoot === undefined) {
        throw new CliUsageError('visual-proof benötigt --reference-root <pfad>.');
      }
      const result = generateAnhangGVisualProof({
        referenceRoot,
        outputFile: flag('out') ?? DEFAULT_ANHANG_G_PROOF_OUTPUT,
      });
      console.log(
        `${result.sections.length} Karten nach ${result.outputFile} geschrieben ` +
          `(${result.width}x${result.height} px, ${result.byteLength} Bytes, ` +
          `SHA-256 ${result.sha256}, Quellen-Set SHA-256 ${result.sourceSetDigest}).`,
      );
    } catch (error) {
      if (error instanceof CliUsageError) {
        console.error(error.message);
        process.exit(1);
      }
      throw error;
    }
    break;
  }
  // ── Export (core) ──
  case 'export': {
    try {
      const themeId = flag('theme') ?? 'reference';
      if (!isRenderThemeId(themeId)) {
        throw new CliUsageError(
          `Unbekanntes Theme "${themeId}". Zulässig: reference, accessible-light, print-monochrome.`,
        );
      }
      exportSvg(flag('out') ?? 'out', parseExportSize(flag('size') ?? '64'), renderTheme(themeId));
    } catch (error) {
      if (error instanceof CliUsageError || error instanceof InvalidExportSizeError) {
        console.error(error.message);
        process.exit(1);
      }
      throw error;
    }
    break;
  }
  default:
    console.error(`Unbekanntes Kommando: ${command ?? '(keines)'}`);
    console.error(
      'Verfügbar:\n' +
        '  Prüfen (conformance): audit:reference [--filter <präfix>] [--print] | coverage | ' +
        'provenance:table | ' +
        'reference-diff --reference-root <pfad> [--out <verzeichnis>] [--filter <präfix>] ' +
        '[--sheets] [--json] | ' +
        'review-dossier [--out <md-pfad>] | ' +
        'verify:repository | ' +
        'visual-proof --reference-root <pfad> [--out <png-pfad>]\n' +
        '  Export (core): export [--out <pfad>] [--size <px>] ' +
        '[--theme <reference|accessible-light|print-monochrome>]',
    );
    process.exit(1);
}
