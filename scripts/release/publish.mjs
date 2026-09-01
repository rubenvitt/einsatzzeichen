// Publiziert die Workspace-Pakete auf npm — aber nur, wenn sich seit dem letzten Release-Tag in
// einem publizierbaren `packages/*`-Ordner wirklich etwas bewegt hat. Ein Release, das allein die
// Website, die Dokumentation oder die CI berührt, bekommt weiterhin Tag, CHANGELOG und
// GitHub-Release, schiebt aber keine unveränderten Pakete nach npm.
//
// Aufruf aus release.config.mjs: node scripts/release/publish.mjs <letzter Release-Tag>
// Ohne Tag (Erstrelease) wird publiziert.
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

import { collectChangedPackages } from './changed-packages.mjs';

const since = process.argv[2] ?? '';
const cwd = fileURLToPath(new URL('../../', import.meta.url));
const geaendert = collectChangedPackages({ cwd, since });

if (geaendert.length === 0) {
  console.log(
    `Seit ${since} hat sich kein publizierbares Paket geändert — npm-Publish übersprungen.`,
  );
  process.exit(0);
}

console.log(
  `Geändert seit ${since || '(kein Vergleichspunkt)'}: ${geaendert.join(', ')} — publiziere den Workspace.`,
);

const lauf = spawnSync(
  'pnpm',
  ['-r', 'publish', '--access', 'public', '--no-git-checks', '--provenance'],
  { cwd, stdio: 'inherit' },
);

if (lauf.error) {
  console.error(lauf.error.message);
  process.exit(1);
}

process.exit(lauf.status ?? 1);
