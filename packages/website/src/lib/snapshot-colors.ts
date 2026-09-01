import type { ColorToken } from '@einsatzzeichen/schema';

/**
 * Die Farbwörter stehen für sich, weil zwei Verantwortungen sie teilen: die Prosa der
 * Kontrastausnahmen (`snapshot-contrast.ts`) und die Beschriftung der technischen Füllung im
 * Baukastenvokabular (`snapshot-vocabulary.ts`). Läge die Tabelle bei einer der beiden, hinge die
 * andere an ihr — oder führte eine zweite Liste, und zwei Listen laufen auseinander.
 */

/**
 * Farbnamen, wie sie auf der Website stehen dürfen. Die Tokens des Schemas sind Bezeichner
 * (`weiss`, `gruen`, `funktionslauf-kontrast`) — auf einer Seite, die auch Menschen ohne
 * Technikbezug lesen, hat ein Bezeichner nichts verloren.
 *
 * Der Typ nennt jeden Token einzeln, statt `Record<string, string>` zu sein: ein neuer Farbton im
 * Schema ist damit ein Übersetzungsfehler beim Bauen und nicht ein `undefined` mitten im Satz.
 * `surface` ist kein Farbtoken, sondern die Fläche, auf der ausgegeben wird — `background` lässt
 * beides zu.
 */
export const COLOR_WORDS: Record<ColorToken | 'surface', string> = {
  schwarz: 'Schwarz',
  weiss: 'Weiß',
  rot: 'Rot',
  blau: 'Blau',
  gelb: 'Gelb',
  gruen: 'Grün',
  hellgruen: 'Hellgrün',
  orange: 'Orange',
  braun: 'Braun',
  grau: 'Grau',
  hellgrau: 'Hellgrau',
  hellblau: 'Hellblau',
  'funktionslauf-kontrast': 'Kontrastfarbe des Funktionslaufs',
  // Nur als Hintergrund möglich (`ContrastException.background`); daher der Dativ.
  surface: 'der Ausgabefläche',
};
