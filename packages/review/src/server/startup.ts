/**
 * Die reinen Entscheidungen des Starts: Portwahl, Themenbeschriftung, Startmeldung. Getrennt von
 * `index.ts`, weil dieses Modul beim Import einen Server hochfährt und deshalb selbst nicht
 * prüfbar ist — hier steht alles, was ohne Server eine Aussage hat.
 */
import { RENDER_THEMES, type RenderThemeId } from '@einsatzzeichen/catalog';
import type { ReviewerRecord, ThemeOption } from '../contract.js';
import { REFERENCE_DIRECTORY } from './repository.js';

export const DEFAULT_PORT = 4319;

/**
 * Voreinstellung bleibt die Rückschleife. Das Werkzeug kennt keine Anmeldung und schreibt in den
 * Ledger; wer es weiter aufmacht, muss das ausdrücklich tun (Spec §8).
 */
export const DEFAULT_HOST = '127.0.0.1';

/** Adressen, bei denen nur dieser Rechner den Server erreicht. */
const LOOPBACK_HOSTS = new Set(['127.0.0.1', 'localhost', '::1']);

export function isLoopbackHost(host: string): boolean {
  return LOOPBACK_HOSTS.has(host);
}

/**
 * Fail-closed wie bei `resolvePort`: eine leere oder mit Leerraum durchsetzte Angabe ist ein
 * Fehler und keine stille Rückkehr zur Rückschleife — sonst liefe das Werkzeug lokal, während der
 * Aufrufer es im Netz erwartet und den Fehler auf der anderen Seite sucht.
 */
export function resolveHost(raw: string | undefined): string {
  if (raw === undefined || raw === '') return DEFAULT_HOST;
  const host = raw.trim();
  // Geprüft wird der **getrimmte** Wert: umschliessender Leerraum ist harmlos und wird
  // abgeschnitten, Leerraum mitten in der Angabe dagegen bedeutet zwei Adressen in einer Variablen
  // — und genau eine davon würde stillschweigend gewinnen.
  if (host === '' || /\s/u.test(host)) {
    throw new Error(
      `REVIEW_HOST="${raw}" ist keine brauchbare Adresse. Erwartet wird eine Adresse dieses ` +
        `Rechners, z. B. 127.0.0.1 oder 100.100.33.33.`,
    );
  }
  return host;
}

/** URL-Schreibweise einer Adresse; IPv6 gehört in eckige Klammern. */
export function hostForUrl(host: string): string {
  return host.includes(':') ? `[${host}]` : host;
}

/**
 * Deutsche Beschriftungen der Render-Themes. Als vollständiger Record über `RenderThemeId`: ein
 * neues Theme im Katalog löst hier einen Typfehler aus, statt still als technische Kennung in der
 * Oberfläche zu landen.
 */
const THEME_LABELS: Record<RenderThemeId, string> = {
  reference: 'Referenz (BABZ-Palette)',
  'accessible-light': 'Barrierearm hell',
  'print-monochrome': 'Druck monochrom',
};

export function themeOptions(): readonly ThemeOption[] {
  return (Object.keys(RENDER_THEMES) as RenderThemeId[]).map((id) => ({
    id,
    label: THEME_LABELS[id],
  }));
}

/**
 * Fail-closed statt stiller Vorgabe: ein unbrauchbares `REVIEW_PORT` wird benannt. Sonst liefe
 * das Werkzeug auf 4319, während der Aufrufer eine andere Adresse erwartet.
 */
export function resolvePort(raw: string | undefined): number {
  if (raw === undefined || raw.trim() === '') return DEFAULT_PORT;
  const port = Number(raw);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error(
      `REVIEW_PORT="${raw}" ist keine gültige Portnummer. Erwartet wird eine ganze Zahl ` +
        `zwischen 1 und 65535.`,
    );
  }
  return port;
}

export interface StartupInfo {
  url: string;
  /** Die tatsächlich gebundene Adresse — entscheidet über den Erreichbarkeitshinweis. */
  host: string;
  pending: number;
  total: number;
  referenceAvailable: boolean;
  reviewers: readonly ReviewerRecord[];
}

/** Vier Sätze, die sagen, wo das Werkzeug steht und was es gerade nicht kann. */
export function startupSummary(info: StartupInfo): string {
  const lines = [
    `Fachreview-Werkzeug läuft auf ${info.url}`,
    `${info.pending} von ${info.total} Reviewzeilen sind offen.`,
    info.referenceAvailable
      ? `Referenzbestand ${REFERENCE_DIRECTORY}/ liegt vor — der Referenzvergleich ist möglich.`
      : `Referenzbestand ${REFERENCE_DIRECTORY}/ fehlt — ohne ihn entfällt der Referenzvergleich; ` +
        `die fachliche Prüfung bleibt möglich.`,
  ];
  if (info.reviewers.length === 0) {
    lines.push(
      'Das Reviewer-Register ist leer. Legen Sie zuerst einen Prüfer an; ohne Registereintrag ' +
        'ist jede Freigabe gesperrt.',
    );
  }
  // Wer die Rückschleife verlässt, soll wissen, was er aufmacht: das Werkzeug hat keine
  // Anmeldung, schreibt in den Ledger und liefert die lokalen Referenzbilder aus. Ein Hinweis,
  // keine Sperre — die Adresse ist eine bewusste Angabe des Aufrufers.
  if (!isLoopbackHost(info.host)) {
    lines.push(
      `Achtung: gebunden an ${info.host}, nicht an die Rückschleife. Jeder, der diese Adresse ` +
        'erreicht, kann ohne Anmeldung Fachreviews in den Ledger schreiben und die lokalen ' +
        'Referenzbilder abrufen.',
    );
  }
  return lines.join('\n');
}
