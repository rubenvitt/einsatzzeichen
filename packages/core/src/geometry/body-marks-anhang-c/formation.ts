import type { AnhangCContext, MarkTable } from './shared.js';
import { c1Tongs, stroke } from './shared.js';
import { technicalAssistanceMark } from './assistance-power.js';

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

  /**
   * C.1.4: 4.7.18 Technische Hilfeleistung in der Formation, umgebaut (LFH-787). Gemessen an
   * `C.1.4_Rüstzug einer Feuerwehr.svg`; Striche als Umriss gespeichert, Mittellinie =
   * Umrisskante ± 0,25.
   *
   * | Teil | Referenz (Umriss) | Mittellinie |
   * |---|---|---|
   * | Gerät | außen x 9,75 / y 13,2499…18,7497, innen x 10,2499…22,7502 / y 13,7502…18,2502 | Rechteck 10…23 × 13,5…18,5 |
   * | Strahlen | Kappenmitte (29,0002\|10,9998), (28,9995\|20,9996); Neigung 5/12 (dy/dx 0,4167) | (23\|13,5) → (29\|11), (23\|18,5) → (29\|21) |
   * | Wellen | Anfang x 3,0 bei y 15,2498…15,7497 / 17,2501…17,7499; Kamm außen 13,2499, innen 13,7498 bei x 6,5 | Tal (3\|15,5) → Kamm (6,5\|13,5) → Tal (10\|15,5), zweite 2 mm tiefer |
   * | Strich | Kappenbreite 0,5002, Wellenstrich 0,4999 | 0,5 |
   *
   * Dieselbe Marke wie im Rüstwagen C.2.18 (`assistance-power.ts`): jeder Umrisspunkt der
   * Referenz, Kontrollpunkte eingeschlossen, liegt höchstens 0,0004 mm neben dem um 0,5 mm
   * angehobenen Punkt aus C.2.18. Konstruiert mit derselben Funktion
   * (`technicalAssistanceMark`), gegen die Körpermitte cx = 16 und die Mitte der Formation
   * (16) statt gegen `maxY − 9,5`. Die Hülle der Formation reicht wie die des Landfahrzeugs
   * von x 1 bis 31 und endet unten bei y 26; nur die senkrechte Mitte unterscheidet die beiden
   * Fassungen.
   *
   * Wie in C.2.18 keine Verkleinerung der Einzeldarstellung: 4.7.18 zeichnet mit 0,4 mm, das
   * Gerät 14 × 8 mm und die Strahlen mit Neigung 3/7, hier 0,5 mm, 13 × 5 mm und 5/12.
   * `CAPABILITY_UNSCALED_FIT` führt das Paar für die Boxfassung trotzdem als unskaliert passend
   * (LFH-787, Vorlage §3.1).
   */
  'technical-assistance': (bounds) =>
    technicalAssistanceMark((bounds.minX + bounds.maxX) / 2, (bounds.minY + bounds.maxY) / 2),
};

export const FORMATION_CONTEXTS: readonly AnhangCContext[] = [
  { kind: 'formation', marks: FORMATION_MARKS },
];
