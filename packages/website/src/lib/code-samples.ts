import type { SymbolSpec } from '@einsatzzeichen/schema';

/**
 * Codebeispiele für die vier Ausgabekanäle eines Symbols. Reine Template-Strings — keine
 * Codegenerator-Bibliothek — damit jedes Snippet Zeile für Zeile lesbar bleibt und mit den
 * Paket-APIs Schritt hält, statt sie nachzubilden.
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
 */
export function codeSamplesFor(spec: SymbolSpec, id: string): CodeSamples {
  const specLiteral = JSON.stringify(spec, null, 2);
  const idLiteral = JSON.stringify(id);

  const typescript = `import { composeFromCatalog } from '@einsatzzeichen/catalog';
import { renderSvg } from '@einsatzzeichen/core';
import type { SymbolSpec } from '@einsatzzeichen/schema';

// Spezifikation für ${idLiteral}
const spec: SymbolSpec = ${specLiteral};

const drawing = composeFromCatalog(spec);
const svg = renderSvg(drawing, { size: 64 });
`;

  const react = `import { Einsatzzeichen } from '@einsatzzeichen/react';
import { composeFromCatalog } from '@einsatzzeichen/catalog';
import type { SymbolSpec } from '@einsatzzeichen/schema';

// Spezifikation für ${idLiteral}
const spec: SymbolSpec = ${specLiteral};

const drawing = composeFromCatalog(spec);

export function Symbol() {
  return <Einsatzzeichen drawing={drawing} size={64} />;
}
`;

  const webComponent = `import {
  DEFAULT_TAG_NAME,
  defineEinsatzzeichenElement,
  type EinsatzzeichenElement,
} from '@einsatzzeichen/web-component';
import { composeFromCatalog } from '@einsatzzeichen/catalog';
import type { SymbolSpec } from '@einsatzzeichen/schema';

// Spezifikation für ${idLiteral}
const spec: SymbolSpec = ${specLiteral};

// Registriert <einsatzzeichen-symbol> einmalig (ruft customElements.define auf).
defineEinsatzzeichenElement();

const element = document.createElement(DEFAULT_TAG_NAME) as EinsatzzeichenElement;
element.drawing = composeFromCatalog(spec);
document.body.append(element);
`;

  const maplibre = `import maplibregl from 'maplibre-gl';
import { addSymbolImage } from '@einsatzzeichen/maplibre';
import { composeFromCatalog } from '@einsatzzeichen/catalog';
import type { SymbolSpec } from '@einsatzzeichen/schema';

// Spezifikation für ${idLiteral}
const spec: SymbolSpec = ${specLiteral};

const map = new maplibregl.Map({ container: 'map', style: 'https://example.org/style.json' });

map.on('load', () => {
  // addSymbolImage rastert die Zeichnung und ruft intern map.addImage(...) auf.
  addSymbolImage(map, ${idLiteral}, composeFromCatalog(spec), { size: 64 });
});
`;

  return { typescript, react, webComponent, maplibre };
}
