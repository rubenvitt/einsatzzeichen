import type { Drawing } from '@einsatzzeichen/schema';

/**
 * Mindeststrichbreite beim Rastern (LFH-584, Entscheidung
 * `docs/decisions/2026-09-29-lfh-584-mindeststrichbreite.md`).
 *
 * Die Katalogdaten zeichnen Striche referenztreu mit 0,5 mm. Auf einer 32-mm-ViewBox sind das bei
 * 16 px nur 0,25 px und bei 24 px 0,375 px: Kantenglättung verteilt den Strich dann als blassgraue
 * Spur über ein Pixel. Das ist ein Problem der Rasterung, kein Geometriefehler, deshalb korrigieren
 * die Renderer es und nicht die Daten — und nur auf Wunsch (`minStrokeWidthPx`, standardmäßig aus).
 *
 * Beide Renderer rechnen hier und nirgends sonst. Die Untergrenze wird **in Millimetern** geführt:
 * Striche stehen in beiden Koordinatenräumen der Renderer in Millimetern — bei gewöhnlichen
 * Primitiven vor der Umrechnung über `mmToUnits`, bei Pfaden als Rohmaß unter `scale(mmToUnits(1))`
 * (siehe `rawStrokeWidth` in svg.ts und den Pfadzweig in canvas.ts). `Transform` kennt nur
 * Verschiebung und Drehung, keine Skalierung; ein Millimeter ist deshalb in jeder Gruppe gleich
 * viele Pixel breit. Eine in Millimeter umgerechnete Untergrenze gilt damit in beiden Räumen im
 * tatsächlichen Pixelraum, ohne dass ein Renderer sie selbst umrechnen muss.
 */

/**
 * Empfohlene Mindeststrichbreite: ein Pixel der Ausgabe, für jede Rastergröße derselbe Wert.
 * Kein geschätzter, sondern ein an allen 525 Renderfällen gemessener Wert (Zahlen in der
 * Entscheidungsnotiz):
 *
 * - Auf der 32-mm-ViewBox ist 1 px bei 16 px Breite 2 mm, bei 24 px 1,33 mm, bei 32 px 1 mm. Ab
 *   64 px ist 1 px höchstens 0,5 mm; die Referenzstriche liegen dort schon darauf oder darüber,
 *   die Ausgabe bleibt unverändert. Die Untergrenze staffelt sich so von selbst nach Größe.
 * - Zehn der 14 Grundkörper (Formation, Fahrzeuge, Person, Gebäude, Stelle, Fläche, Gefahr,
 *   Maßnahme) führen ihre Kontur 1 mm vom ViewBox-Rand. Bei 16 px reicht ein 2-mm-Strich damit
 *   genau bis an den Rand. 1,25 px (2,5 mm) schiebt bei 16 px in 124 Zeichen Tinte über den Rand und
 *   lässt enge Innenzeichnungen (Mauerwerk in `comms.firewall`) zulaufen; 1 px nur in zwei
 *   Zeichen, mit zusammen 0,18 Pixeln Tinte.
 * - Die mittlere Deckung der Strichpixel steigt mit 1 px bei 16 px von 0,14 auf 0,53, bei 24 px von
 *   0,20 auf 0,55 und bei 32 px von 0,26 auf 0,50: aus der blassgrauen Spur wird ein Strich.
 */
export const RASTER_MIN_STROKE_WIDTH_PX = 1;

/**
 * Rechnet eine Pixeluntergrenze in Millimeter der Zeichnung um. Der Maßstab folgt der Breite, wie
 * in `renderCanvas` (`raster.widthPx / mmToUnits(viewBox.width)`) und in SVG, wo die aufgerundete
 * Rasterhöhe den Maßstab über `preserveAspectRatio` („meet“) nicht ändert.
 *
 * Ohne Option `undefined`: die Renderer geben dann byteweise dasselbe aus wie vor LFH-584. Mit
 * Option, aber ohne Rastergröße, ist der Pixelmaßstab unbekannt — ein frei skalierendes SVG kann in
 * jeder Größe erscheinen. Statt dann still nichts zu tun, bricht die Funktion ab (fail-closed wie
 * `rasterDimensionsForWidth`).
 */
export function strokeWidthFloorMm(
  viewBox: Drawing['viewBox'],
  sizePx: number | undefined,
  minStrokeWidthPx: number | undefined,
): number | undefined {
  if (minStrokeWidthPx === undefined) return undefined;
  if (!Number.isFinite(minStrokeWidthPx) || minStrokeWidthPx <= 0) {
    throw new RangeError(
      `minStrokeWidthPx muss endlich und positiv sein (ist ${String(minStrokeWidthPx)}).`,
    );
  }
  if (sizePx === undefined) {
    throw new RangeError(
      'minStrokeWidthPx braucht eine Rastergröße (size): ohne sie ist unbekannt, wie viele ' +
        'Pixel ein Millimeter breit wird.',
    );
  }
  return (minStrokeWidthPx * viewBox.width) / sizePx;
}

/**
 * Effektive Strichstärke in Millimetern. Ohne Untergrenze und für Striche an oder über ihr kommt
 * der Eingabewert unverändert zurück, nicht hin- und zurückgerechnet — sonst könnte eine
 * Gleitkommarundung die SVG-Ausgabe verschieben. Ein Nullstrich bleibt null: er ist bewusst
 * unsichtbar (siehe die Nullstrich-Semantik in canvas.ts), die Untergrenze macht ihn nicht sichtbar.
 */
export function effectiveStrokeWidthMm(strokeWidthMm: number, floorMm: number | undefined): number {
  if (floorMm === undefined || strokeWidthMm <= 0 || strokeWidthMm >= floorMm) {
    return strokeWidthMm;
  }
  return floorMm;
}
