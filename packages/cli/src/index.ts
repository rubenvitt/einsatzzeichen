import { isRenderThemeId, renderTheme } from '@einsatzzeichen/catalog';
import { auditReference } from './commands/audit-reference.js';
import { coverage } from './commands/coverage.js';
import { InvalidExportSizeError, exportSvg, parseExportSize } from './commands/export.js';
import {
  DEFAULT_ANHANG_G_PROOF_OUTPUT,
  generateAnhangGVisualProof,
} from './commands/visual-proof.js';

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
          `SHA-256 ${result.sha256}).`,
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
  default:
    console.error(`Unbekanntes Kommando: ${command ?? '(keines)'}`);
    console.error(
      'Verfügbar: audit:reference [--filter <präfix>] [--print] | coverage | ' +
        'export [--out <pfad>] [--size <px>] ' +
        '[--theme <reference|accessible-light|print-monochrome>] | ' +
        'visual-proof --reference-root <pfad> [--out <png-pfad>]',
    );
    process.exit(1);
}
