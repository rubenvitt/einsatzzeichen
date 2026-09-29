import type { AnhangCContext, MarkTable } from './shared.js';
import { c1Tongs, stroke } from './shared.js';

/** Formation ohne Variante (30 × 20 mm). */
const FORMATION_MARKS: MarkTable = {
  /**
   * C.1.7: 4.1.2 Messen, Spüren, Detektieren in der Formation, randbündig. Die Zange
   * (`c1Tongs`) kreuzt 0,5 mm über der Körpermitte, ihre Schäfte enden 6,5 mm unter der
   * Kreuzung. Der Messstrich läuft von der linken unteren zur rechten oberen Körperecke: seine
   * Unterkante steht in der Referenz auf (1,8256|25,7499), also 0,25 mm senkrecht neben der
   * Diagonale (1|26) → (31|6) der Hülle. In der Einzeldarstellung steigt er dagegen nur von
   * (1|18,5) nach (31|10,5).
   */
  'cbrn-detection': (bounds) => {
    const cx = (bounds.minX + bounds.maxX) / 2;
    const cy = (bounds.minY + bounds.maxY) / 2;
    return [
      ...c1Tongs(cx, cy - 0.5, 6.5),
      stroke(bounds.minX, bounds.maxY, bounds.maxX, bounds.minY),
    ];
  },

  /**
   * C.1.8: 4.1.3 Dekontaminieren in der Formation, verkleinert. Die Zange (`c1Tongs`) kreuzt
   * 1,5 mm über der Körpermitte, damit darunter der mittige Lauf „P“ Platz hat; ihre Schäfte
   * enden 7,5 mm unter der Kreuzung in den Ecken der beiden rechtwinkligen Klammern. Die Klammern
   * sind gebaut wie in 4.1.3, aber mit Schenkeln von 4,0 statt 6,25 × 5,75 mm: der senkrechte
   * Schenkel reicht vom Eckpunkt 4 mm nach oben und 0,25 mm darunter hinaus, der waagerechte
   * beginnt 0,25 mm außerhalb und reicht 4 mm nach innen (Referenz: x 8,25…8,75 / 23,25…23,75,
   * y 21,0…25,25; y 24,75…25,25, x 8,25…12,5 / 19,5…23,75).
   */
  decontamination: (bounds) => {
    const cx = (bounds.minX + bounds.maxX) / 2;
    const crossY = (bounds.minY + bounds.maxY) / 2 - 1.5;
    const reachMm = 7.5;
    const legMm = 4;
    const cornerYMm = crossY + reachMm;
    return [
      ...c1Tongs(cx, crossY, reachMm),
      ...[-1, 1].flatMap((side) => {
        const cornerXMm = cx + side * reachMm;
        return [
          stroke(cornerXMm, cornerYMm - legMm, cornerXMm, cornerYMm + 0.25),
          stroke(cornerXMm + side * 0.25, cornerYMm, cornerXMm - side * legMm, cornerYMm),
        ];
      }),
    ];
  },
};

export const FORMATION_CONTEXTS: readonly AnhangCContext[] = [
  { kind: 'formation', marks: FORMATION_MARKS },
];
