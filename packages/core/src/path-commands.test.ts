import { describe, expect, it } from 'vitest';
import { tokenizePath } from './path-commands.js';

describe('tokenizePath', () => {
  it('zerlegt einen Pfad in Kommandos mit ihren eigenen Zahlen', () => {
    const { commands, problems } = tokenizePath('M 4 16 C 6 16 8 12 10 12 Z');
    expect(problems).toEqual([]);
    expect(commands).toEqual([
      { command: 'M', numbers: [4, 16] },
      { command: 'C', numbers: [6, 16, 8, 12, 10, 12] },
      { command: 'Z', numbers: [] },
    ]);
  });

  it('liest H und V mit genau einer Zahl', () => {
    // Der Kern des Box-Gates: H trägt nur ein x, V nur ein y. Ein Zahlenstrom-Leser
    // würde beide gegen beide Achsen prüfen.
    const { commands, problems } = tokenizePath('M 2 2 V 25 H 4 Z');
    expect(problems).toEqual([]);
    expect(commands).toEqual([
      { command: 'M', numbers: [2, 2] },
      { command: 'V', numbers: [25] },
      { command: 'H', numbers: [4] },
      { command: 'Z', numbers: [] },
    ]);
  });

  it('zerlegt ein wiederholtes Kommando in einzelne Kommandos', () => {
    const { commands, problems } = tokenizePath('C 1 1 2 2 3 3 4 4 5 5 6 6');
    expect(problems).toEqual([]);
    expect(commands).toEqual([
      { command: 'C', numbers: [1, 1, 2, 2, 3, 3] },
      { command: 'C', numbers: [4, 4, 5, 5, 6, 6] },
    ]);
  });

  it('liest die Folgepaare eines M als implizite L, wie SVG es vorschreibt', () => {
    const { commands, problems } = tokenizePath('M 1 1 2 2 3 3');
    expect(problems).toEqual([]);
    expect(commands).toEqual([
      { command: 'M', numbers: [1, 1] },
      { command: 'L', numbers: [2, 2] },
      { command: 'L', numbers: [3, 3] },
    ]);
  });

  it('liest Zahlen ohne Trennzeichen und mit führendem Punkt', () => {
    const { commands, problems } = tokenizePath('M4.5.25L-1 2');
    expect(problems).toEqual([]);
    expect(commands).toEqual([
      { command: 'M', numbers: [4.5, 0.25] },
      { command: 'L', numbers: [-1, 2] },
    ]);
  });

  it('akzeptiert ein einzelnes Komma zwischen zwei Zahlen', () => {
    const { commands, problems } = tokenizePath('M 4,12 L 28,20');
    expect(problems).toEqual([]);
    expect(commands).toEqual([
      { command: 'M', numbers: [4, 12] },
      { command: 'L', numbers: [28, 20] },
    ]);
  });

  it.each([
    ['M,4 12 L 28 20', ','],
    ['M 4 12,L 28 20', ','],
    ['M 4,,12 L 28 20', ',,'],
    ['M 4 12,', ','],
  ])('lehnt den ungültigen Pfadseparator in %s ab', (d, separator) => {
    expect(tokenizePath(d).problems).toEqual([
      `Unzulässiger Pfadseparator "${separator}" in Pfaddaten; ein einzelnes Komma ist nur zwischen zwei Zahlen zulässig.`,
    ]);
  });

  it('liest ein explizites positives Vorzeichen', () => {
    const { commands, problems } = tokenizePath('M +4 +5');
    expect(problems).toEqual([]);
    expect(commands).toEqual([{ command: 'M', numbers: [4, 5] }]);
  });

  it('meldet fremde Interpunktion statt sie still zu überspringen', () => {
    expect(tokenizePath('M 1 1 ??? L 2 2').problems).toEqual([
      'Unzulässige Zeichenfolge " ??? " in Pfaddaten.',
    ]);
  });

  it('meldet ein relatives Kommando und verwirft seine Zahlen still', () => {
    const { problems } = tokenizePath('m 4 4 l 8 8');
    expect(problems).toEqual([
      'Relatives Kommando "m" — nur absolute Kommandos sind zulässig.',
      'Relatives Kommando "l" — nur absolute Kommandos sind zulässig.',
    ]);
  });

  it('meldet A, S und T je einmal, nicht ihre Argumente hinterher', () => {
    expect(tokenizePath('M 4 4 A 2 2 0 0 1 8 8').problems).toEqual([
      'Unzulässiges Kommando "A" — zulässig sind nur M L H V C Q Z.',
    ]);
    expect(tokenizePath('M 4 4 S 6 6 8 8').problems).toEqual([
      'Unzulässiges Kommando "S" — zulässig sind nur M L H V C Q Z.',
    ]);
    expect(tokenizePath('M 4 4 T 8 8').problems).toEqual([
      'Unzulässiges Kommando "T" — zulässig sind nur M L H V C Q Z.',
    ]);
  });

  it('meldet eine Zahl ohne vorangehendes Kommando', () => {
    expect(tokenizePath('4 4 M 8 8').problems).toEqual([
      'Zahl "4" ohne vorangehendes Kommando.',
      'Zahl "4" ohne vorangehendes Kommando.',
    ]);
  });

  it('liest Exponentialschreibweise als je eine Zahl', () => {
    // Grund für die Alternationsreihenfolge in TOKEN (Zahl vor Buchstabe): "1e-3" muss als eine
    // Zahl gelesen werden, nicht als "1", "e", "-3". Ohne diesen Test könnte eine spätere Änderung
    // an der Regex Exponentialzahlen brechen, ohne dass es auffiele — und genau diese Regex trägt
    // in Task 5 das Box-Gate.
    const { commands, problems } = tokenizePath('M 1e-3 -2e+4 L 3E5 4E-2');
    expect(problems).toEqual([]);
    expect(commands).toEqual([
      { command: 'M', numbers: [0.001, -20000] },
      { command: 'L', numbers: [300000, 0.04] },
    ]);
  });

  it('meldet eine unpassende Argumentzahl', () => {
    expect(tokenizePath('M 4 4 C 6 6 8 8').problems).toEqual([
      'Kommando "C" erwartet ein Vielfaches von 6 Zahlen, erhielt 4.',
    ]);
    expect(tokenizePath('M 4 4 Z 9').problems).toEqual([
      'Kommando "Z" erwartet keine Zahlen, erhielt 1.',
    ]);
  });
});
