/**
 * Auflösung der Tastenkürzel. Als reine Funktion über einem minimalen Ereignisabbild, damit die
 * heikelste Regel testbar ist: kein Kürzel darf feuern, während der Fokus in einem Text- oder
 * Notizfeld steht. Ein `a` in der Befundnotiz muss ein Buchstabe bleiben und darf nicht die
 * Freigabe setzen.
 */
import type { ReviewStatus } from '@einsatzzeichen/schema';
import { PREVIEW_SIZES } from '../contract';

export type ShortcutAction =
  | { kind: 'step'; delta: 1 | -1 }
  | { kind: 'status'; status: ReviewStatus }
  | { kind: 'save' }
  | { kind: 'size'; index: number }
  | { kind: 'theme-next' }
  | { kind: 'reference-toggle' }
  | { kind: 'focus-search' }
  | { kind: 'help-toggle' }
  | { kind: 'dismiss' };

/** Nur das, was aus einem `KeyboardEvent` gebraucht wird — so testet es ohne DOM. */
export interface KeyEventLike {
  key: string;
  ctrlKey?: boolean;
  metaKey?: boolean;
  altKey?: boolean;
  target?: unknown;
}

/** Ein Ziel, in dem Text entsteht: Eingabefeld, Textbereich, Auswahlfeld oder editierbarer Inhalt. */
export function isTextEntry(target: unknown): boolean {
  if (typeof target !== 'object' || target === null) return false;
  const element = target as { tagName?: unknown; isContentEditable?: unknown };
  if (element.isContentEditable === true) return true;
  const tag = typeof element.tagName === 'string' ? element.tagName.toUpperCase() : '';
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT';
}

const STATUS_KEYS: Record<string, ReviewStatus> = {
  a: 'approved',
  w: 'deviation',
  '0': 'pending',
};

export function resolveShortcut(event: KeyEventLike): ShortcutAction | null {
  const withCommandKey = event.ctrlKey === true || event.metaKey === true;
  if (event.altKey === true) return null;

  // Speichern aus dem Notizfeld heraus: sonst müsste man nach jedem Befund zur Maus greifen.
  // Das ist das einzige Kürzel, das im Textfeld gilt — und es trägt bewusst eine Zusatztaste.
  if (withCommandKey) {
    return event.key === 'Enter' ? { kind: 'save' } : null;
  }

  // Escape schließt Überlagerungen auch aus einem Feld heraus; es erzeugt keinen Text.
  if (event.key === 'Escape') return { kind: 'dismiss' };

  if (isTextEntry(event.target)) return null;

  switch (event.key) {
    case 'j':
    case 'ArrowDown':
      return { kind: 'step', delta: 1 };
    case 'k':
    case 'ArrowUp':
      return { kind: 'step', delta: -1 };
    case 'Enter':
      return { kind: 'save' };
    case 't':
      return { kind: 'theme-next' };
    case 'r':
      return { kind: 'reference-toggle' };
    case '/':
      return { kind: 'focus-search' };
    case '?':
      return { kind: 'help-toggle' };
    default:
      break;
  }

  const status = STATUS_KEYS[event.key];
  if (status !== undefined) return { kind: 'status', status };

  const sizeIndex = Number.parseInt(event.key, 10) - 1;
  if (
    /^[1-9]$/.test(event.key) &&
    Number.isInteger(sizeIndex) &&
    sizeIndex >= 0 &&
    sizeIndex < PREVIEW_SIZES.length
  ) {
    return { kind: 'size', index: sizeIndex };
  }

  return null;
}

/** Die Kürzel für Fußzeile und Hilfe — eine Quelle, damit Anzeige und Verhalten nicht auseinanderlaufen. */
export const SHORTCUT_HELP: readonly { keys: string; description: string }[] = [
  { keys: 'j / k', description: 'eine Zeile weiter oder zurück (auch Pfeil runter/hoch)' },
  { keys: 'a', description: 'Status auf Freigabe setzen' },
  { keys: 'w', description: 'Status auf Abweichung setzen' },
  { keys: '0', description: 'Status zurück auf offen' },
  { keys: 'Enter', description: 'speichern und zur nächsten offenen Zeile (im Feld: Strg+Enter)' },
  { keys: '1 – 6', description: 'Größenstufe 16 / 24 / 32 / 64 / 128 / 256 px' },
  { keys: 't', description: 'Theme durchschalten' },
  { keys: 'r', description: 'Referenzüberblendung ein- und ausschalten' },
  { keys: '/', description: 'Suche fokussieren' },
  { keys: '?', description: 'diese Hilfe ein- und ausblenden' },
];
