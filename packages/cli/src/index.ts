import { auditReference } from './commands/audit-reference.js';
import { coverage } from './commands/coverage.js';
import { exportSvg } from './commands/export.js';

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
      exportSvg(flag('out') ?? 'out', Number(flag('size') ?? 64));
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
      'Verfügbar: audit:reference [--filter <präfix>] [--print] | coverage | export [--out <pfad>] [--size <px>]',
    );
    process.exit(1);
}
