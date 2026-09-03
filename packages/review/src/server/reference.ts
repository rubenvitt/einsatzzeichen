/**
 * Zugriff auf den lokalen Referenzbestand `taktische-zeichen/` — die einzige Stelle des Servers,
 * die aus einem Ordner ausserhalb des Quellbaums liest.
 *
 * Die Sicherheitsgrenze aus Spec §8 hat zwei Hälften, und beide stehen hier:
 *
 * 1. **Der Name kommt nie aus der Anfrage.** Der Aufrufer (`api.ts`) reicht ausschliesslich
 *    `referenceAsset` der aufgelösten Zeile herein, also einen Namen aus `fingerprints.json`.
 *    Die Prüfungen unten sind die zweite Reihe für den Fall, dass ein künftiger Aufrufer das
 *    vergisst — deshalb wird trotzdem geprüft, dass der Name ein blosser Dateiname ist.
 * 2. **Der aufgelöste Pfad muss im Ordner liegen.** Ein Symlink in `taktische-zeichen/`, der
 *    nach aussen zeigt, wäre sonst ein Leseweg in beliebige Dateien; `realpathSync` löst ihn auf,
 *    und der Vergleich gegen die aufgelöste Wurzel weist ihn ab.
 *
 * Nach aussen geht nie ein Pfad, nur der Dateiname (Spec §8) — auch nicht in Fehlermeldungen.
 */
import { readFileSync, realpathSync } from 'node:fs';
import { basename, join, sep } from 'node:path';
import { REFERENCE_DIRECTORY } from './repository.js';

export type ReferenceResult =
  | { readonly ok: true; readonly svg: string }
  | { readonly ok: false; readonly status: number; readonly error: string };

type ResolveResult =
  | { readonly ok: true; readonly path: string }
  | { readonly ok: false; readonly status: number; readonly error: string };

/**
 * Die Dateisystemgrenze als Schnittstelle, damit `api.ts` ohne `node:fs` auskommt und Tests
 * dort mit einem Doppel arbeiten können.
 */
export interface ReferencePort {
  /** Ob die Referenzdatei lokal vorliegt — für `RowDetail.referenceAvailable`. */
  has(asset: string): boolean;
  /** Liefert das SVG oder eine begründete Absage. */
  read(asset: string): ReferenceResult;
}

function isPlainFileName(asset: string): boolean {
  return (
    asset.length > 0 &&
    asset !== '.' &&
    asset !== '..' &&
    !asset.includes('\0') &&
    basename(asset) === asset
  );
}

/**
 * Löst einen Dateinamen im Referenzordner auf. Getrennt vom Lesen, weil die Detailansicht nur
 * wissen will, *ob* die Datei da ist — dafür ihren Inhalt zu lesen wäre für 558 Zeilen unnötig.
 */
export function resolveReferencePath(repositoryRoot: string, asset: string): ResolveResult {
  if (!isPlainFileName(asset)) {
    return {
      ok: false,
      status: 400,
      // Der abgewiesene Wert wird bewusst nicht wiederholt: er käme im Fehlerfall aus einer
      // Quelle, der wir gerade nicht trauen.
      error:
        `Der Referenzname ist kein blosser Dateiname. Zulässig sind nur die Namen aus ` +
        `fingerprints.json, ohne Verzeichnisanteil.`,
    };
  }
  if (!asset.toLowerCase().endsWith('.svg')) {
    return {
      ok: false,
      status: 400,
      error: `Die Referenzdatei "${asset}" ist kein SVG. Der Referenzbestand enthält nur SVG.`,
    };
  }

  let resolvedRoot: string;
  try {
    resolvedRoot = realpathSync(join(repositoryRoot, REFERENCE_DIRECTORY));
  } catch {
    return {
      ok: false,
      status: 404,
      error:
        `Der Referenzordner ${REFERENCE_DIRECTORY}/ liegt lokal nicht vor. Er wird nie ` +
        `eingecheckt; ohne ihn entfällt der Referenzvergleich, die fachliche Prüfung bleibt ` +
        `möglich.`,
    };
  }

  let resolvedFile: string;
  try {
    resolvedFile = realpathSync(join(resolvedRoot, asset));
  } catch {
    return {
      ok: false,
      status: 404,
      error:
        `Die Referenzdatei "${asset}" liegt nicht im lokalen Referenzbestand. Entpacken Sie den ` +
        `vollständigen Bestand nach ${REFERENCE_DIRECTORY}/.`,
    };
  }

  if (resolvedFile !== resolvedRoot && !resolvedFile.startsWith(resolvedRoot + sep)) {
    return {
      ok: false,
      status: 403,
      error:
        `Die Referenzdatei "${asset}" zeigt aus ${REFERENCE_DIRECTORY}/ hinaus und wird nicht ` +
        `gelesen. Ersetzen Sie den Verweis durch die Datei selbst.`,
    };
  }

  return { ok: true, path: resolvedFile };
}

export function readReferenceAsset(repositoryRoot: string, asset: string): ReferenceResult {
  const resolved = resolveReferencePath(repositoryRoot, asset);
  if (!resolved.ok) return resolved;
  try {
    return { ok: true, svg: readFileSync(resolved.path, 'utf8') };
  } catch {
    // Der Pfad war eben noch auflösbar; scheitert das Lesen trotzdem, sind es Rechte oder ein
    // Wettlauf — beides ist kein „fehlt lokal" und wird deshalb nicht so gemeldet.
    return {
      ok: false,
      status: 500,
      error: `Die Referenzdatei "${asset}" ist vorhanden, aber nicht lesbar. Prüfen Sie die Rechte.`,
    };
  }
}

export function createReferencePort(repositoryRoot: string): ReferencePort {
  return {
    has: (asset) => resolveReferencePath(repositoryRoot, asset).ok,
    read: (asset) => readReferenceAsset(repositoryRoot, asset),
  };
}
