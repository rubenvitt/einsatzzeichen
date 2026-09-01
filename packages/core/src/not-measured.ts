/**
 * Der Referenzbestand führt für diesen Fall keine vermessene Fassung — und das ist eine Aussage
 * über die Quelle, kein Programmfehler.
 *
 * **Warum eine Klasse und keine Textprüfung.** Wer diese Abbrüche von außen unterscheiden muss —
 * heute der Baukasten der Website, der einen Wert sperrt statt abzustürzen —, hatte bisher nur den
 * Wortlaut der Meldung. Ein Behelf: er hängt an einer Formulierung, die jede neue Wurfstelle neu
 * treffen muss, und er fängt zwangsläufig zu viel oder zu wenig. Dieselbe Begründung führt
 * `BodyNotMeasuredError` in `pictogram-gate.ts` schon seit ihrer Einführung; sie ist seit LFH-502
 * der Spezialfall dieser Klasse.
 *
 * **Die Trennlinie.** Geworfen wird sie nur, wo der Katalog oder der Kompositionsmotor sagt: „das
 * ist nicht gemessen, und geraten wird nicht." Ein Programmfehler (unerreichbarer Zweig, fehlendes
 * Primitiv) und eine ungültige Eingabe (eine Zahl, wo eine Zeichenkette zugesichert ist) bleiben
 * ein gewöhnliches `Error` — sie sollen sichtbar scheitern und nicht als Datenlücke erscheinen.
 */
export type NotMeasuredScope =
  /**
   * Der Wert ist an **keiner** Kombination vermessen; eine andere Grundzeichenart hilft nicht.
   * Bisher genau ein Fall: `amphibienfahrzeug`, dessen Wellenlinie nur als Strichhülle vorliegt.
   */
  | 'value'
  /** Diese Zusammenstellung ist nicht vermessen; eine andere Art oder Variante kann sie tragen. */
  | 'combination';

export class NotMeasuredError extends Error {
  readonly scope: NotMeasuredScope;

  constructor(message: string, scope: NotMeasuredScope) {
    super(message);
    this.name = 'NotMeasuredError';
    this.scope = scope;
  }
}
