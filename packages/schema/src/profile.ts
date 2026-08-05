import type { SourceId } from './provenance.js';
import type { ReviewSet } from './review.js';

/**
 * Die registrierten Profile. Der bundesweite Kern ist selbst eines — damit hat die Struktur von
 * Beginn an reale Konsumenten, und die getrennte Versionierung ist umgesetzt statt vorbereitet.
 *
 * `provenance.ts` importiert `ProfileId` von hier und diese Datei `SourceId` von dort. Beide
 * Importe sind reine Typimporte und werden bei `verbatimModuleSyntax` vollständig gelöscht — zur
 * Laufzeit existiert kein Zyklus.
 */
export type ProfileId = 'bund';

export interface ProfileRecord {
  id: ProfileId;
  title: string;
  /** Eigene Datenversion, semver. Unabhängig von den npm-Paketversionen. */
  version: string;
  /** Quellen, auf die dieses Profil sich stützt. */
  sources: readonly SourceId[];
  /** Kernversion, gegen die dieses Profil geprüft ist. Beim Kern identisch mit `version`. */
  verifiedAgainstCore: string;
  review: ReviewSet;
}

/**
 * Datenversionen werden als Zeichenkette geführt und beim Einlesen auf `major.minor.patch`
 * geprüft — `schema` bleibt ohne Laufzeitabhängigkeiten, also ohne Semver-Bibliothek.
 * Führende Nullen sind ausgeschlossen, Vorabversionen und Buildmetadaten sind nicht vorgesehen.
 */
const DATA_VERSION = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/;

export function isDataVersion(value: string): boolean {
  return DATA_VERSION.test(value);
}
