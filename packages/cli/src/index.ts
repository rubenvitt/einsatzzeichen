#!/usr/bin/env node
/*
 * Befehle nach Paket (LFH-560, LFH-572):
 *
 * Prüfen (conformance) — Rezepte, Coverage-Manifest, Domain-Reviews, Referenzinventar, Gates:
 *   audit:reference, coverage, review-dossier, verify:repository, visual-proof
 * Export (core) — Geometrie, Themes und Renderer des Produkts:
 *   export (Rezeptliste noch über commands/export-recipes.ts aus conformance, bis LFH-580)
 *
 * `cli-packages.test.ts` hält die Zuordnung an den Importen fest.
 */
import { isRenderThemeId, renderTheme } from '@einsatzzeichen/core';
// Prüfen (conformance)
import { auditReference } from './commands/audit-reference.js';
import { coverage } from './commands/coverage.js';
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
        'review-dossier [--out <md-pfad>] | ' +
        'verify:repository | ' +
        'visual-proof --reference-root <pfad> [--out <png-pfad>]\n' +
        '  Export (core): export [--out <pfad>] [--size <px>] ' +
        '[--theme <reference|accessible-light|print-monochrome>]',
    );
    process.exit(1);
}
