import { isFreestandingSpec, type AnySpec } from '@einsatzzeichen/schema';

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
