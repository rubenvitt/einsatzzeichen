// Schreibt die vom Release bestimmte Version in alle package.json des Workspaces.
// Aufruf: node scripts/release/set-version.mjs <version>
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const version = process.argv[2];
if (!version || !/^\d+\.\d+\.\d+(-.+)?$/.test(version)) {
  console.error(`Ungültige oder fehlende Version: ${version ?? '(keine)'}`);
  process.exit(1);
}

const root = fileURLToPath(new URL('../../', import.meta.url));
const manifests = [
  `${root}package.json`,
  ...readdirSync(`${root}packages`, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => `${root}packages/${entry.name}/package.json`),
];

for (const file of manifests) {
  const manifest = JSON.parse(readFileSync(file, 'utf8'));
  manifest.version = version;
  writeFileSync(file, `${JSON.stringify(manifest, null, 2)}\n`);
  console.log(`${file.replace(root, '')} → ${version}`);
}
