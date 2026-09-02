import { describe, expect, it } from 'vitest';
import { NotMeasuredError } from './not-measured.js';

describe('NotMeasuredError', () => {
  it('bleibt ein Error und trägt einen eigenen Namen', () => {
    // Beides zusammen ist der Punkt: `instanceof Error` hält jeden bestehenden Fänger — etwa den
    // Fehlerblock der Website, der `error.message` und `error.stack` zeigt —, und der Name macht
    // die Lücke in einer Konsolenausgabe von einem Programmfehler unterscheidbar.
    const error = new NotMeasuredError('Nicht vermessen.', 'combination');
    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe('NotMeasuredError');
    expect(error.message).toBe('Nicht vermessen.');
  });

  it('reicht den Geltungsbereich unverändert durch', () => {
    // `scope` ist eine Aussage über die Referenz und wird deshalb an der Wurfstelle gesetzt, nie
    // vom Fänger erraten. Die Klasse leitet daraus nichts ab.
    expect(new NotMeasuredError('x', 'value').scope).toBe('value');
    expect(new NotMeasuredError('x', 'combination').scope).toBe('combination');
  });
});
