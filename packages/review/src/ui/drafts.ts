/**
 * Entwurfssicherung. Eine angefangene Notiz darf nicht verloren gehen, wenn der Browser neu
 * startet — sie geht deshalb sofort in den `localStorage`. In den Ledger geht dagegen nur, was
 * ausdrücklich gespeichert wird: eine Freigabe ist ein bewusster Akt, kein Autosave.
 */
import type { ReviewStatus } from '@einsatzzeichen/schema';
import type { CarrierId, ReviewValue } from '../contract';

export interface Draft {
  status: ReviewStatus;
  note: string;
  reviewer: string;
  /** ISO-Datum, leer erlaubt — `reviewIssues()` meldet das dann selbst. */
  date: string;
}

/** Nur der Ausschnitt der Web-Storage-API, den wir brauchen — so testet es ohne DOM. */
export interface DraftStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export const DRAFT_PREFIX = 'einsatzzeichen.fachreview.entwurf:';

/** Ein Schlüssel je `CarrierId`: 558 unabhängige Entwürfe, kein gemeinsamer Klumpen. */
export function draftKey(id: CarrierId): string {
  return `${DRAFT_PREFIX}${id}`;
}

const STATUS_VALUES: readonly string[] = ['pending', 'approved', 'deviation'];

function isStatus(value: unknown): value is ReviewStatus {
  return typeof value === 'string' && STATUS_VALUES.includes(value);
}

function asText(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

/** Heute in ISO-Form, aus der lokalen Zeitzone — das Datum soll dem Kalender des Prüfers folgen. */
export function todayIso(now: Date = new Date()): string {
  const year = String(now.getFullYear()).padStart(4, '0');
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/** Der Entwurf, mit dem eine noch unbearbeitete Zeile startet: der Ledgerstand plus Vorbelegung. */
export function draftFromReview(
  review: ReviewValue,
  defaults: { reviewer: string; date: string },
): Draft {
  return {
    status: review.status,
    note: review.note ?? '',
    reviewer: review.reviewer ?? defaults.reviewer,
    date: review.date ?? defaults.date,
  };
}

/**
 * Fail-closed: alles, was sich nicht zweifelsfrei als Entwurf lesen lässt, gilt als nicht
 * vorhanden. Ein halb geratener Entwurf wäre schlimmer als gar keiner — er stünde als Befund da.
 */
export function readDraft(storage: DraftStorage, id: CarrierId): Draft | undefined {
  let raw: string | null;
  try {
    raw = storage.getItem(draftKey(id));
  } catch {
    return undefined;
  }
  if (raw === null) return undefined;
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return undefined;
  }
  if (typeof parsed !== 'object' || parsed === null) return undefined;
  const candidate = parsed as Record<string, unknown>;
  if (!isStatus(candidate.status)) return undefined;
  return {
    status: candidate.status,
    note: asText(candidate.note),
    reviewer: asText(candidate.reviewer),
    date: asText(candidate.date),
  };
}

/**
 * Meldet, ob der Entwurf tatsächlich gesichert wurde. Ein abgelehnter Schreibvorgang (privater
 * Modus, volles Kontingent) wird oben sichtbar gemacht, statt still zu verschwinden.
 */
export function writeDraft(storage: DraftStorage, id: CarrierId, draft: Draft): boolean {
  try {
    storage.setItem(draftKey(id), JSON.stringify(draft));
    return true;
  } catch {
    return false;
  }
}

export function dropDraft(storage: DraftStorage, id: CarrierId): void {
  try {
    storage.removeItem(draftKey(id));
  } catch {
    // Ein nicht löschbarer Entwurf ist folgenlos: der Ledgerstand gewinnt beim nächsten Laden.
  }
}

/**
 * Der zuletzt gewählte Prüfer als Sitzungseinstellung. Eine Person arbeitet 558 Zeilen ab; sie
 * soll sich nicht 558-mal selbst auswählen müssen.
 */
export const SESSION_REVIEWER_KEY = 'einsatzzeichen.fachreview.pruefer';

export function readSessionReviewer(storage: DraftStorage): string {
  try {
    return storage.getItem(SESSION_REVIEWER_KEY) ?? '';
  } catch {
    return '';
  }
}

export function writeSessionReviewer(storage: DraftStorage, reviewer: string): void {
  try {
    storage.setItem(SESSION_REVIEWER_KEY, reviewer);
  } catch {
    // Folgenlos: dann wird beim nächsten Start eben wieder ausgewählt.
  }
}

/** Ob der Entwurf vom Ledgerstand abweicht — nur dann lohnt der Speicherweg. */
export function isDirty(draft: Draft, review: ReviewValue): boolean {
  return (
    draft.status !== review.status ||
    draft.note.trim() !== (review.note ?? '').trim() ||
    draft.reviewer.trim() !== (review.reviewer ?? '').trim() ||
    draft.date.trim() !== (review.date ?? '').trim()
  );
}
