import { PALETTE, type ColorToken, type Primitive } from '@einsatzzeichen/schema';
import { contrastRatio } from '../a11y/contrast.js';
import { MINIMUM_NON_TEXT_CONTRAST } from '../geometry/pictograms/contrast-contract.js';
import { REFERENCE_THEME } from '../render/theme.js';
import { noteDerivation } from './record.js';

/**
 * Organisationsfarbe oder technische Füllung am offenen Polyzug von `1.13 Ereignis`
 * (Eigentümerentscheid vom 02.10.2026: zulassen, abgeleitet).
 *
 * **Warum die Farbe in den Strich geht und nicht in eine Fläche.** SVG und `canvas.ts` schließen
 * einen gefüllten Polyzug implizit: aus dem Haken würde ein volles Dreieck (selbst gerastert am
 * 18. August 2026: 936 statt 142 Pixel bei 64 px Kantenlänge). Die Referenz gibt diese Fläche
 * nicht her: `1.13_Ereignis.svg` hat — anders als die geschlossenen Grundzeichen — keine Ebene
 * `Flächige_Fülung`, nur den Umriss des Strichs, und der Haken kommt in keiner anderen der 661
 * Dateien vor. Eine Fläche zu schließen hieße, eine Form zu erfinden. Die Farbe färbt deshalb
 * den Strich; Lage und Form bleiben verbatim.
 *
 * Fachlich trägt ein Ereignis keine Organisation im Sinn einer Einheit — die Farbe sagt hier,
 * wessen Lagebild das Ereignis meldet, so wie an jedem anderen Grundzeichen ohne Einheit
 * (Gefahr, Maßnahme, Stelle). Die Systematik verbietet das nicht; offen war nur die Fassung.
 *
 * **Zu helle Farben bleiben schwarz.** Der Strich ist hier das ganze Zeichen. Er muss deshalb den
 * Kontrastvertrag für Nicht-Text-Grafik gegen die Ausgabeoberfläche halten
 * (`MINIMUM_NON_TEXT_CONTRAST`, 3 : 1). Weiß (1 : 1), Gelb (1,07 : 1), Hellgrau (1,9 : 1) und
 * Orange (2,3 : 1) halten ihn nicht; ein gelber Haken wäre auf Weiß praktisch unsichtbar. An den
 * geschlossenen Körpern trägt der schwarze Umriss die Form und die Fläche die Farbe — am offenen
 * Polyzug gibt es keine Fläche. Diese Farben zeichnen deshalb schwarz, und die
 * Organisation bleibt über die nicht-farbliche Kontursignatur (`bodyStrokeDashToken`) erkennbar,
 * so wie die weiße Hilfsorganisation an jedem Körper (`organizations.ts`). Rot, Blau, Grün und
 * Braun halten den Vertrag und färben den Strich.
 */
export function openBodyTint(
  body: Primitive,
  token: ColorToken,
  organization: ColorToken | undefined,
): Primitive {
  const legible = contrastRatio(PALETTE[token], REFERENCE_THEME.surface) >= MINIMUM_NON_TEXT_CONTRAST;
  const stroke: ColorToken = legible ? token : 'schwarz';
  noteDerivation({
    dimension: organization === undefined ? 'technicalFill' : 'organization',
    part: legible
      ? `Farbe "${token}" als Strichfarbe des offenen Polyzugs statt als Fläche`
      : `Farbe "${token}" am offenen Polyzug unter 3 : 1 gegen die Oberfläche, Strich schwarz`,
    basis: 'constructed',
    from: '1.13_Ereignis.svg (Strichumriss ohne Füllebene)',
  });
  return {
    ...body,
    style: {
      ...body.style,
      fill: 'none',
      stroke,
      ...(organization === undefined ? {} : { bodyStrokeDashToken: organization }),
    },
  };
}
