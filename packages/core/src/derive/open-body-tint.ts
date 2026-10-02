import type { ColorToken, Primitive } from '@einsatzzeichen/schema';
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
 * **Weiß bleibt schwarz.** Ein weißer Strich verschwände auf der weißen Ausgabeoberfläche und mit
 * ihm das Zeichen. Die Hilfsorganisation ist auch an den geschlossenen Körpern farblich nicht von
 * einem organisationslosen Zeichen zu unterscheiden (`organizations.ts`); am Ereignis gilt
 * dasselbe, die nicht-farbliche Kontursignatur (`bodyStrokeDashToken`) trägt sie trotzdem.
 */
export function openBodyTint(
  body: Primitive,
  token: ColorToken,
  organization: ColorToken | undefined,
): Primitive {
  const stroke: ColorToken = token === 'weiss' ? 'schwarz' : token;
  noteDerivation({
    dimension: organization === undefined ? 'technicalFill' : 'organization',
    part: `Farbe "${token}" als Strichfarbe des offenen Polyzugs statt als Fläche`,
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
