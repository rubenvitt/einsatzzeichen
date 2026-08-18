import type { Primitive, SymbolKind } from '@einsatzzeichen/schema';
import { boundsOfMm, shiftY } from '../bounds.js';

/**
 * Abstand zwischen der Unterkante der Kopfzone und dem Körperanker.
 * An drei Konstellationen der Referenz belegt: C.1.1 (8 → 9), C.1.2 (5 → 6), D.3.7 (4 → 5).
 */
export const HEAD_GAP_MM = 1;

/** Kleinster Abstand der Kopfzone zum oberen Rand der Grundfläche. */
export const HEAD_TOP_MARGIN_MM = 1;

export type LayoutProfileId = 'rect-body' | 'rotated-square-body' | 'circle-body';

export interface LayoutProfile {
  /**
   * Das **Platzierungsverhalten**, nicht das ganze Profil: zwei Körperformen können dasselbe
   * `place` haben und trotzdem verschiedene Zonenmaße führen. Seit dem Teilslice E.2 ist das der
   * Fall — vier Rechteckkörper unterscheiden sich allein in
   * `centerBaselineFromBodyBottomMm`.
   */
  id: LayoutProfileId;
  /** Oberster Punkt der Körper-Mittellinie ohne Kopfzone. */
  defaultAnchorMm: number;
  /**
   * Grundlinie des mittigen Beschriftungslaufs, gerechnet **von der Körperunterkante nach oben**.
   *
   * Bis zum Teilslice E.2 stand hier für jede Körperform dieselbe 8 — gemessen an `formation`
   * (Unterkante 26,0004, Grundlinie 18,0001) und an `building`. Die Zeile für das Landfahrzeug
   * ist beim Eintragen der Rezepte nachgezählt worden: der Quellblock E.2.1 bis E.2.21 führt
   * **20** Landfahrzeuge (alle außer E.2.15), und 19 davon setzen ihre mittige Grundlinie auf
   * 18,0 mm; allein E.2.20 steht auf 17,5002 mm und ist damit der Ausreißer der letzten Zeile
   * dieses Kommentars. Drei der fünf Körperformen aus
   * Anhang E.2 treffen sie nicht, und der Fehler ist groß genug, um das Bild zu ändern (alle
   * Zahlen selbst vermessen, 18. August 2026):
   *
   * | Körperform | Unterkante | Grundlinie | Abstand | Belegdateien |
   * |---|---|---|---|---|
   * | Landfahrzeug und die übrigen | 26,0004 | 18,0001 | **8,0** | 19 der 20 E.2-Landfahrzeuge |
   * | angehobener Wasserrumpf | 22,9898 | 16,0002 | **6,9896** | E.2.28 bis E.2.31 |
   * | Wechselladerrumpf | 24,5004 | 17,0000 | **7,5004** | E.2.15 (n = 1) |
   * | Hochkantrechteck | 29,9999 | 17,0000 | **12,9999** | E.2.26 (n = 1) |
   *
   * **Die zweite Lesart des Wasserrumpfs gehört daneben, weil sie gemessen ist und nicht
   * ausgeschlossen werden kann.** Die elf I.3-Dateien tragen denselben Rumpf 1,0002 mm tiefer
   * (Unterkante 23,9899) und ihre mittige Grundlinie auf **derselben** absoluten Höhe 15,9999 —
   * also mit Abstand 7,9900, dem Normwert. Der E.2-Lauf ist der Anhebung des Rumpfes also
   * **nicht gefolgt**. Man kann das als „6,9896 ist die Eigenschaft dieser Körperform" lesen oder
   * als „die Grundlinie steht absolut auf 16,0 und die Anhebung ist ein Exportartefakt". Für die
   * fünf E.2-Zeichen erzeugen beide Lesarten dasselbe Bild; der Katalog folgt der ersten, weil
   * sie den bestehenden Mechanismus fortschreibt statt einen zweiten daneben zu stellen.
   *
   * Ausdrücklich **nicht** hier abgebildet: E.2.20 (Abstand 8,5005) und E.2.23. E.2.20 steht auf
   * demselben Landfahrzeugkörper wie die 19 anderen Landfahrzeuge und ist dort der einzige
   * Ausreißer; E.2.23 ist **kein** Landfahrzeug, sondern ein Anhänger, und weicht innerhalb seiner
   * eigenen Körperform ab. In beiden Fällen weicht die Quelle von sich selbst ab, und der Katalog
   * folgt der Mehrheit — dieselbe Einordnung wie bei E.1.18/E.1.20/E.1.21.
   */
  centerBaselineFromBodyBottomMm: number;
  /**
   * Grundlinie des Laufs oben links, gerechnet **von der Körperoberkante nach unten**. Fehlt sie,
   * ist die Zone an dieser Körperform nicht vermessen und `compose()` wirft, statt eine Lage zu
   * raten.
   *
   * Gemessen ist bisher genau eine Zahl: **5,0 mm** an den neun beschrifteten Zeichen aus
   * F.1.1 bis F.1.11 (Körperoberkante 6,0, Grundlinie 11,0 — eigene Vermessung, 18. August 2026).
   * Sie steht deshalb an einem eigenen Profil für `formation` und nicht am geteilten
   * `rectBodyProfile`: der Landfahrzeugrumpf trägt denselben Lauf auf Grundlinie 12,5 mm bei
   * Oberkante 5,75 (F.2.1 bis F.2.5), also 6,75 mm — die Zahl gehört dorthin, sobald der
   * Teilslice F-c sie einträgt, und nicht als stille Miterbschaft dieser.
   */
  topLeftBaselineFromBodyTopMm?: number;
  /**
   * Setzt den Körper relativ zur Kopfzone. `headBottomMm === null` bedeutet: keine Kopfzone,
   * der Körper behält seine Standardgeometrie.
   */
  place(body: Primitive, headBottomMm: number | null): Primitive;
}

/**
 * Setzt eine Kopfzone bekannter Höhe absolut. Sie wird so tief wie möglich gehängt,
 * damit der Körper auf seinem Standardanker bleiben kann — passt sie dort nicht,
 * rutscht sie an den oberen Rand und der Körper weicht aus.
 *
 * Belegt an: Rechteck + Reihe (6, 3) → 2/5; Rechteck + Stapel (6, 7) → 1/8;
 * gedrehtes Quadrat + Reihe (1, 3) → 1/4.
 */
export function placeHead(
  profile: LayoutProfile,
  headHeightMm: number,
): { topMm: number; bottomMm: number } {
  const topMm = Math.max(
    HEAD_TOP_MARGIN_MM,
    profile.defaultAnchorMm - HEAD_GAP_MM - headHeightMm,
  );
  return { topMm, bottomMm: topMm + headHeightMm };
}

/**
 * Verschiebt den Körper, ohne seine Größe zu ändern — und nur so weit wie nötig.
 * C.1.2 (Reihe) bleibt deshalb bei 6 mm wie 1.1, C.1.1 (Stapel) rückt auf 9 mm.
 */
function rectBody(centerBaselineFromBodyBottomMm: number): LayoutProfile {
  return {
    id: 'rect-body',
    defaultAnchorMm: 6,
    centerBaselineFromBodyBottomMm,
    place(body, headBottomMm) {
      if (headBottomMm === null) return body;
      const target = Math.max(this.defaultAnchorMm, headBottomMm + HEAD_GAP_MM);
      return shiftY(body, target - boundsOfMm(body).minY);
    },
  };
}

/** Der Normfall: mittige Grundlinie 8 mm über der Körperunterkante. */
const rectBodyProfile: LayoutProfile = rectBody(8);

/**
 * Die taktische Formation trägt zusätzlich die vermessene Zone oben links (Anhang F). Ein eigenes
 * Profilobjekt und keine Ergänzung an `rectBodyProfile`: das teilen sich zehn Körperformen, und
 * für neun davon ist diese Grundlinie unvermessen.
 */
const formationProfile: LayoutProfile = { ...rectBody(8), topLeftBaselineFromBodyTopMm: 5 };

/**
 * Verkleinert das gedrehte Quadrat von oben und hält die Unterkante.
 * Belegt an D.3.7: halbe Diagonale 15 → 13 mm, Mittelpunkt 16 → 18 mm, Unterkante bleibt 31 mm.
 */
const rotatedSquareProfile: LayoutProfile = {
  id: 'rotated-square-body',
  defaultAnchorMm: 1,
  // Unvermessen: kein Zeichen des Bestands beschriftet ein gedrehtes Quadrat mittig. Der Normwert
  // steht hier, damit die Zahl nicht fehlt — er ist keine Messung an dieser Körperform.
  centerBaselineFromBodyBottomMm: 8,
  place(body, headBottomMm) {
    if (headBottomMm === null) return body;
    if (body.type !== 'rect' || body.transform?.rotate === undefined) {
      throw new Error('Profil "rotated-square-body" erwartet ein gedrehtes rect als Körper.');
    }
    const bounds = boundsOfMm(body);
    const bottom = bounds.maxY;
    const apex = Math.max(this.defaultAnchorMm, headBottomMm + HEAD_GAP_MM);
    const halfDiagonal = (bottom - apex) / 2;
    const centerY = apex + halfDiagonal;
    const side = halfDiagonal * Math.SQRT2;
    const centerX = (bounds.minX + bounds.maxX) / 2;

    return {
      ...body,
      x: centerX - side / 2,
      y: centerY - side / 2,
      width: side,
      height: side,
      transform: { rotate: { ...body.transform.rotate, cx: centerX, cy: centerY } },
    };
  },
};

/**
 * Kreiskörper mit Kopfzone ist in der Referenz nicht belegt — und das ist seit dem 18. August 2026
 * ein **gemessenes Negativ** und kein offener Platzhalter. Über alle 661 Referenzdateien gezählt,
 * mit einem eigenen Pfadparser und ohne Abtastung:
 *
 * - 109 Dateien tragen eine Marke von 3 mm Mittelliniendurchmesser mit Mittelpunkt oberhalb
 *   y = 8 mm, also im Kopfzonenraster — 80 zeichnen sie als Pfad, 43 als `<circle>`-Element,
 *   und 14 Dateien führen **beide** Formen, was die Vereinigung auf 109 bringt (80 + 43 − 14).
 *   Wer nur nach `<path>` sucht, sieht 80 und übersieht 29 — dieselbe Falle, die die E-c-Notiz
 *   für die Kopfmarken von E.1.33 bis E.1.35 benennt (Nachzählung vom 18. August 2026);
 * - 36 Dateien tragen einen echten Kreiskörper (geschlossener Subpfad nur aus Kubiken,
 *   quadratische Hülle mit 22 bis 31 mm Kantenlänge, kreisförmig auf 0,05 mm);
 * - **die Schnittmenge ist leer.**
 *
 * Der Unterschied zwischen „nicht belegt" und „gemessen leer" ist der Grund, warum diese Zahlen
 * hier stehen: das erste lädt zum Nachschauen ein, das zweite hält fest, dass nachgeschaut wurde.
 * Ein gedrehtes Quadrat hat dieselbe quadratische Hülle wie ein Kreis; die Kreisförmigkeit ist
 * deshalb geprüft und nicht aus der Hülle geschlossen — ohne diese Prüfung erschienen die acht
 * `D.3.x`-Zeichen mit Rautenkörper fälschlich als Schnittmenge.
 *
 * Der Radienzensus derselben Zählung gehört daneben, weil er eine zweite Frage offen zeigt:
 * 32 Kreise mit r 12,25 mm und sechs mit r 11,75 mm (Ringpaare zur Mittellinie r 12,0), dazu
 * je einer mit r 13,75 und 14,24 (Ringpaar zur Mittellinie r 14,0 — `1.6_Funktionsstelle.svg`,
 * das `post` deckt). Ein aus `post` zusammengesetztes Zeichen läge damit gegen jede Referenzdatei
 * mit Kreiskörper 2 mm zu groß. Die Regel zwischen 12 und 14 ist nicht vermessen; sie ist ein
 * eigenes Ticket.
 */
const circleBodyProfile: LayoutProfile = {
  id: 'circle-body',
  defaultAnchorMm: 2,
  // Unvermessen, wie bei `rotated-square-body`.
  centerBaselineFromBodyBottomMm: 8,
  place(body, headBottomMm) {
    if (headBottomMm === null) return body;
    throw new Error(
      'Kein Zeichen des Referenzbestands führt eine Kopfzone über einem Kreiskörper: 109 der 661 ' +
        'Dateien tragen eine 3-mm-Marke im Kopfzonenraster, 36 tragen einen Kreiskörper, die ' +
        'Schnittmenge ist leer (Vermessung vom 18. August 2026). Wie ein Kreiskörper einer ' +
        'Kopfzone ausweicht, ist damit nicht ableitbar und wird nicht geraten.',
    );
  },
};

const PROFILES: Record<SymbolKind, LayoutProfile> = {
  formation: formationProfile,
  // Die drei Körperformen ohne Kapitel-1-Abschnitt. `rectBodyProfile` und kein eigenes Profil:
  // sein `place` greift **nur** mit Kopfzone, und keine der drei kann eine tragen — `validateSpec`
  // lehnt eine Stärkeangabe an allem außer `formation` und `person` ab (`strength-requires-unit`).
  // Kein Zeichen des Anhangs E.2 trägt überhaupt eine Kopfzone (selbst nachgesehen an allen 31).
  // Ohne Kopfzone gibt `place` den Körper unverändert zurück; `defaultAnchorMm` bleibt damit
  // unerreichbar und ist für diese drei keine Behauptung.
  trailer: rectBodyProfile,
  // 7,5004 gemessen an E.2.15 (Grundlinie 17,0000 bei Körperunterkante 24,5004) — n = 1. Das ist
  // ein **Wert** in einem stehenden Mechanismus und kein eigener Mechanismus; die Fallzahlregel
  // des Projekts trifft ihn nicht.
  'swap-loader-vehicle': rectBody(7.5),
  // 12,9999 gemessen an E.2.26 (Grundlinie 17,0000 bei Körperunterkante 29,9999) — n = 1.
  'upright-rectangle': rectBody(13),
  'vehicle-land': rectBodyProfile,
  'vehicle-air': rectBodyProfile,
  // 6,9896 gemessen an E.2.28 bis E.2.31 (Grundlinie 16,0002 bei Körperunterkante 22,9898).
  // Gilt hier für **beide** Zeichnungen der Art: der Rumpf aus Kapitel 1 trägt im gesamten
  // Bestand keinen mittigen Lauf, für ihn ist keine der beiden Zahlen gemessen.
  'vehicle-water': rectBody(6.9896),
  building: rectBodyProfile,
  container: rectBodyProfile,
  area: rectBodyProfile,
  measure: rectBodyProfile,
  hazard: rectBodyProfile,
  point: rectBodyProfile,
  event: rectBodyProfile,
  'spontaneous-helper': rectBodyProfile,
  person: rotatedSquareProfile,
  post: circleBodyProfile,
};

export function profileFor(kind: SymbolKind): LayoutProfile {
  return PROFILES[kind];
}
