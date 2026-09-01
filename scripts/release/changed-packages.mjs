// Ermittelt, welche publizierbaren Pakete sich seit dem letzten Release wirklich bewegt haben.
//
// Zwei Fallen bestimmen die Logik:
//  1. `set-version.mjs` schreibt vor dem Publish in JEDE package.json die neue Version, und der
//     Release-Commit steht zu diesem Zeitpunkt schon. Ein nackter Dateivergleich meldet deshalb
//     immer alle Pakete als geändert. Eine package.json zählt nur, wenn ihr Diff über die
//     `"version"`-Zeile hinausgeht.
//  2. `packages/website` trägt `private: true` und landet nie auf npm — Änderungen dort dürfen
//     kein Publish auslösen.
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Prüft, ob ein package.json-Diff ausschließlich die Versionszeile bewegt.
 *
 * @param {string} diff Ausgabe von `git diff -U0 <tag> HEAD -- <datei>`
 * @returns {boolean}
 */
export function isVersionOnlyDiff(diff) {
  return diff
    .split('\n')
    .filter((zeile) => /^[+-]/.test(zeile) && !/^(\+\+\+|---)/.test(zeile))
    .every((zeile) => /^[+-]\s*"version":\s*"[^"]*",?\s*$/.test(zeile));
}

/**
 * Reduziert eine Liste geänderter Dateien auf die betroffenen publizierbaren Pakete.
 *
 * @param {object} input
 * @param {{ path: string, versionOnly?: boolean }[]} input.changes geänderte Dateien
 * @param {string[]} input.privatePackages Verzeichnisnamen mit `private: true`
 * @returns {string[]} Verzeichnisnamen, sortiert und ohne Dubletten
 */
export function changedPublishablePackages({ changes, privatePackages }) {
  const betroffen = new Set();
  for (const { path, versionOnly } of changes) {
    const treffer = /^packages\/([^/]+)\//.exec(path);
    if (!treffer) continue;
    const name = treffer[1];
    if (privatePackages.includes(name) || versionOnly) continue;
    betroffen.add(name);
  }
  return [...betroffen].sort();
}

const git = (cwd, args) => execFileSync('git', args, { cwd, encoding: 'utf8' });

/** Liest die Paketverzeichnisse ein und trennt publizierbare von privaten. */
function paketverzeichnisse(cwd) {
  const publishable = [];
  const privat = [];
  for (const eintrag of readdirSync(join(cwd, 'packages'), { withFileTypes: true })) {
    if (!eintrag.isDirectory()) continue;
    const manifest = join(cwd, 'packages', eintrag.name, 'package.json');
    if (!existsSync(manifest)) continue;
    if (JSON.parse(readFileSync(manifest, 'utf8')).private === true) privat.push(eintrag.name);
    else publishable.push(eintrag.name);
  }
  return { publishable: publishable.sort(), privat };
}

/**
 * Vergleicht den Arbeitsstand mit dem letzten Release-Tag.
 *
 * @param {object} input
 * @param {string} input.cwd Wurzel des Workspaces
 * @param {string} input.since Tag des letzten Releases; leer beim Erstrelease
 * @returns {string[]} Pakete mit echter Änderung — beim Erstrelease alle publizierbaren
 */
export function collectChangedPackages({ cwd, since }) {
  const { publishable, privat } = paketverzeichnisse(cwd);
  if (!since) return publishable;

  const changes = git(cwd, ['diff', '--name-only', since, 'HEAD', '--', 'packages'])
    .split('\n')
    .filter(Boolean)
    .map((path) => ({
      path,
      versionOnly:
        path.endsWith('/package.json') &&
        isVersionOnlyDiff(git(cwd, ['diff', '-U0', since, 'HEAD', '--', path])),
    }));

  return changedPublishablePackages({ changes, privatePackages: privat });
}
