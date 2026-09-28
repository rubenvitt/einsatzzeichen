// Prüft vor dem Release, ob jedes publizierbare Paket schon auf npm existiert.
//
// Hintergrund: Das Release publiziert per npm Trusted Publishing (OIDC, siehe release.yml).
// Trusted Publishing kann aber kein NEUES Paket anlegen — der Trusted Publisher lässt sich erst
// auf einem existierenden Paket hinterlegen. Ein neues Paket (z. B. nach der Umbenennung
// catalog → conformance) scheitert deshalb mitten in `pnpm -r publish` mit
// `404 Not Found - PUT https://registry.npmjs.org/@einsatzzeichen%2f…`, nachdem die Pakete davor
// schon draußen sind. Übrig bleibt ein halb publiziertes Release.
//
// Läuft als verifyConditionsCmd in release.config.mjs — also bevor semantic-release committet,
// taggt oder irgendetwas publiziert — und bricht mit einer Anleitung ab, falls ein Paket fehlt.
//
// Aufruf: node scripts/release/check-registry.mjs
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const STANDARD_REGISTRY = 'https://registry.npmjs.org';

/**
 * Liest die Namen aller publizierbaren Workspace-Pakete (ohne `private: true`).
 *
 * @param {string} cwd Wurzel des Workspaces
 * @returns {string[]} Paketnamen, sortiert
 */
export function publishablePackageNames(cwd) {
  const namen = [];
  for (const eintrag of readdirSync(join(cwd, 'packages'), { withFileTypes: true })) {
    if (!eintrag.isDirectory()) continue;
    const manifest = join(cwd, 'packages', eintrag.name, 'package.json');
    if (!existsSync(manifest)) continue;
    const paket = JSON.parse(readFileSync(manifest, 'utf8'));
    if (paket.private !== true) namen.push(paket.name);
  }
  return namen.sort();
}

/**
 * Fragt die Registry nach jedem Paket und liefert die, die dort nicht existieren.
 * Nur ein eindeutiges 404 zählt als fehlend; andere Antworten oder Netzfehler landen in
 * `unklar`, damit ein wackeliges Netz das Release nicht grundlos blockiert.
 *
 * @param {object} input
 * @param {string[]} input.names Paketnamen
 * @param {string} [input.registry] Basis-URL der Registry
 * @param {typeof fetch} [input.fetchImpl] für Tests austauschbar
 * @returns {Promise<{ fehlend: string[], unklar: { name: string, grund: string }[] }>}
 */
export async function findMissingPackages({
  names,
  registry = STANDARD_REGISTRY,
  fetchImpl = fetch,
}) {
  const basis = registry.replace(/\/+$/, '');
  const fehlend = [];
  const unklar = [];
  await Promise.all(
    names.map(async (name) => {
      const url = `${basis}/${name.replace('/', '%2f')}`;
      try {
        const antwort = await fetchImpl(url, {
          method: 'GET',
          headers: { accept: 'application/vnd.npm.install-v1+json' },
        });
        if (antwort.status === 404) fehlend.push(name);
        else if (!antwort.ok) unklar.push({ name, grund: `HTTP ${antwort.status}` });
      } catch (fehler) {
        unklar.push({ name, grund: fehler instanceof Error ? fehler.message : String(fehler) });
      }
    }),
  );
  return { fehlend: fehlend.sort(), unklar };
}

/** Anleitung für den einmaligen, manuellen Erst-Publish eines neuen Pakets. */
export function anleitung(fehlend) {
  const liste = fehlend.map((name) => `  - ${name}`).join('\n');
  return `Diese Pakete existieren noch nicht auf npm:
${liste}

npm Trusted Publishing (OIDC) kann keine neuen Pakete anlegen — ohne diese Prüfung würde
\`pnpm -r publish\` mit "404 Not Found - PUT …" abbrechen, nachdem andere Pakete schon
publiziert sind. Einmalig von Hand nachholen:

  1. Lokal mit einem Konto der npm-Org @einsatzzeichen anmelden: npm login
  2. Auf dem letzten Release-Tag bauen und publizieren — pnpm überspringt Versionen, die schon
     auf npm liegen, und holt dabei auch liegengebliebene Pakete eines abgebrochenen Releases nach:
       git checkout <letzter Release-Tag>
       pnpm install --frozen-lockfile && pnpm build
       pnpm -r publish --access public --no-git-checks
  3. Auf npmjs.com je neuem Paket unter Settings → Trusted Publisher "GitHub Actions" eintragen:
       Organization/User: rubenvitt · Repository: einsatzzeichen · Workflow: release.yml
  4. Release erneut anstoßen (Workflow "Release" per workflow_dispatch).`;
}

async function main() {
  const cwd = fileURLToPath(new URL('../../', import.meta.url));
  const names = publishablePackageNames(cwd);
  const registry = process.env.npm_config_registry || STANDARD_REGISTRY;
  const { fehlend, unklar } = await findMissingPackages({ names, registry });

  for (const { name, grund } of unklar) {
    console.warn(`Registry-Prüfung für ${name} nicht eindeutig (${grund}) — übersprungen.`);
  }
  if (fehlend.length > 0) {
    console.error(anleitung(fehlend));
    process.exit(1);
  }
  console.log(`Alle ${names.length} publizierbaren Pakete existieren auf npm.`);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  await main();
}
