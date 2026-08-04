import { auditReference } from './commands/audit-reference.js';

function flag(name: string): string | undefined {
  const index = process.argv.indexOf(`--${name}`);
  return index === -1 ? undefined : process.argv[index + 1];
}

const command = process.argv[2];

switch (command) {
  case 'audit:reference': {
    const filter = flag('filter');
    auditReference({
      ...(filter !== undefined ? { filter } : {}),
      print: process.argv.includes('--print'),
    });
    break;
  }
  default:
    console.error(`Unbekanntes Kommando: ${command ?? '(keines)'}`);
    console.error('Verfügbar: audit:reference [--filter <präfix>] [--print]');
    process.exit(1);
}
