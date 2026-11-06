import { isFreestandingSpec, type AnySpec, type Sign } from '@einsatzzeichen/schema';

/**
 * Codebeispiele für die vier Ausgabekanäle eines Symbols. Reine Template-Strings — keine
 * Codegenerator-Bibliothek — damit jedes Snippet Zeile für Zeile lesbar bleibt und mit den
 * Paket-APIs Schritt hält, statt sie nachzubilden. Seit LFH-580 zeichnen alle vier mit
 * `drawSymbol()` aus `core`; das Prüfpaket kommt in keinem Beispiel mehr vor.
 */
export interface CodeSamples {
  typescript: string;
  react: string;
  webComponent: string;
  maplibre: string;
}

/**
 * Erzeugt die vier Codebeispiele für ein Symbol. `id` ist der Katalog-/Rezeptschlüssel (z. B.
 * `"C.1.1"`) und dient als Kommentar-Referenz sowie als Bild-ID im MapLibre-Beispiel.
 *
 * Ein freistehendes Zeichen aus dem Baukasten (ESZ-135) zeichnet über `drawAnySpec` und trägt den
 * Typ `FreestandingSpec`; `drawSymbol` nähme es nicht an. Für eine `SymbolSpec` bleiben die
 * Beispiele, wie sie waren.
 */
export function codeSamplesFor(spec: AnySpec, id: string): CodeSamples {
  const specLiteral = JSON.stringify(spec, null, 2);
  const idLiteral = JSON.stringify(id);
  const freestanding = isFreestandingSpec(spec);
  const draw = freestanding ? 'drawAnySpec' : 'drawSymbol';
  const specType = freestanding ? 'FreestandingSpec' : 'SymbolSpec';

  const typescript = `import { ${draw}, renderSvg } from '@einsatzzeichen/core';
import type { ${specType} } from '@einsatzzeichen/schema';

// Spezifikation für ${idLiteral}
const spec: ${specType} = ${specLiteral};

const drawing = ${draw}(spec);
const svg = renderSvg(drawing, { size: 64 });
`;

  const react = `import { Einsatzzeichen } from '@einsatzzeichen/react';
import { ${draw} } from '@einsatzzeichen/core';
import type { ${specType} } from '@einsatzzeichen/schema';

// Spezifikation für ${idLiteral}
const spec: ${specType} = ${specLiteral};

const drawing = ${draw}(spec);

export function Symbol() {
  return <Einsatzzeichen drawing={drawing} size={64} />;
}
`;

  const webComponent = `import {
  DEFAULT_TAG_NAME,
  defineEinsatzzeichenElement,
  type EinsatzzeichenElement,
} from '@einsatzzeichen/web-component';
import { ${draw} } from '@einsatzzeichen/core';
import type { ${specType} } from '@einsatzzeichen/schema';

// Spezifikation für ${idLiteral}
const spec: ${specType} = ${specLiteral};

// Registriert <einsatzzeichen-symbol> einmalig (ruft customElements.define auf).
defineEinsatzzeichenElement();

const element = document.createElement(DEFAULT_TAG_NAME) as EinsatzzeichenElement;
element.drawing = ${draw}(spec);
document.body.append(element);
`;

  const maplibre = `import maplibregl from 'maplibre-gl';
import { addSymbolImage } from '@einsatzzeichen/maplibre';
import { ${draw} } from '@einsatzzeichen/core';
import type { ${specType} } from '@einsatzzeichen/schema';

// Spezifikation für ${idLiteral}
const spec: ${specType} = ${specLiteral};

const map = new maplibregl.Map({ container: 'map', style: 'https://example.org/style.json' });

map.on('load', () => {
  // addSymbolImage rastert die Zeichnung und ruft intern map.addImage(...) auf.
  addSymbolImage(map, ${idLiteral}, ${draw}(spec), { size: 64 });
});
`;

  return { typescript, react, webComponent, maplibre };
}

/**
 * Die Codebeispiele des Baukastens auf der **Beschreibung** (ESZ-150): `draw(sign)` statt eines
 * Bauplans. React, das Web Component und MapLibre nehmen die Beschreibung direkt (`sign`, ESZ-149);
 * die Zeichnung entsteht dort über dieselbe Funktion. Ein freistehendes Zeichen ist dieselbe
 * Beschreibung (`Sign` umfasst beide Arten), deshalb gibt es hier keine Fallunterscheidung.
 *
 * `id` erscheint als Kommentar und als Bild-ID im MapLibre-Beispiel.
 */
export function signCodeSamplesFor(sign: Sign, id: string): CodeSamples {
  const signLiteral = JSON.stringify(sign, null, 2);
  const idLiteral = JSON.stringify(id);

  const typescript = `import { draw, renderSvg, type Sign } from '@einsatzzeichen/core';

// Beschreibung für ${idLiteral}
const sign: Sign = ${signLiteral};

// draw wirft nie: fidelity sagt, wie treu das Bild ist, omitted, was fehlt.
const { drawing, fidelity, omitted } = draw(sign);
const svg = renderSvg(drawing, { size: 64 });
`;

  const react = `import { Einsatzzeichen } from '@einsatzzeichen/react';
import type { Sign } from '@einsatzzeichen/core';

// Beschreibung für ${idLiteral}
const sign: Sign = ${signLiteral};

export function Symbol() {
  return <Einsatzzeichen sign={sign} size={64} />;
}
`;

  const webComponent = `import {
  DEFAULT_TAG_NAME,
  defineEinsatzzeichenElement,
  type EinsatzzeichenElement,
} from '@einsatzzeichen/web-component';
import type { Sign } from '@einsatzzeichen/core';

// Beschreibung für ${idLiteral}
const sign: Sign = ${signLiteral};

// Registriert <einsatzzeichen-symbol> einmalig (ruft customElements.define auf).
defineEinsatzzeichenElement();

const element = document.createElement(DEFAULT_TAG_NAME) as EinsatzzeichenElement;
element.sign = sign;
document.body.append(element);
`;

  const maplibre = `import maplibregl from 'maplibre-gl';
import { addSymbolImage } from '@einsatzzeichen/maplibre';
import type { Sign } from '@einsatzzeichen/core';

// Beschreibung für ${idLiteral}
const sign: Sign = ${signLiteral};

const map = new maplibregl.Map({ container: 'map', style: 'https://example.org/style.json' });

map.on('load', () => {
  // addSymbolImage zeichnet die Beschreibung, rastert sie und ruft intern map.addImage(...) auf.
  addSymbolImage(map, ${idLiteral}, sign, { size: 64 });
});
`;

  return { typescript, react, webComponent, maplibre };
}

/**
 * Der Bauplan im Expertenteil: der exakte Bauplan, den `draw` gezeichnet hat, über `drawAnySpec`
 * aus `@einsatzzeichen/core/exact`. Wer exakt nachbauen will (Rezepte, Prüfpaket), nimmt ihn.
 */
export function exactCodeSampleFor(exact: AnySpec): string {
  return `import { renderSvg } from '@einsatzzeichen/core';
import { drawAnySpec } from '@einsatzzeichen/core/exact';
import type { AnySpec } from '@einsatzzeichen/schema';

// Ohne die Typangabe weitet TypeScript \`kind\` auf string, und drawAnySpec lehnt ab.
const exact: AnySpec = ${JSON.stringify(exact, null, 2)};

const svg = renderSvg(drawAnySpec(exact), { size: 64 });
`;
}
