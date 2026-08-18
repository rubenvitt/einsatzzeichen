import {
  DEFAULT_STROKE_WIDTH_MM,
  DEFAULT_VIEWBOX_MM,
  type CatalogEntry,
  type Drawing,
  type Primitive,
  type Style,
  type SymbolKind,
} from '@einsatzzeichen/schema';

/** Umriss ohne Füllung. Organisationsfarben setzt der Kompositionsmotor. */
const OUTLINE: Style = {
  fill: 'none',
  stroke: 'schwarz',
  strokeWidth: DEFAULT_STROKE_WIDTH_MM,
};

/** Halbe Seitenlänge des gedrehten Quadrats bei 15 mm halber Diagonale. */
const PERSON_HALF_SIDE = (15 * Math.SQRT2) / 2;

/**
 * Nachkommastellen der erzeugten Pfadkoordinaten (siehe `roundedPolygonPath`). Vier Stellen
 * begrenzen den Rundungsfehler auf 0,00005 mm = 0,00014 Einheiten, also zwei Größenordnungen
 * unter der Vergleichstoleranz von 0,01 Einheiten — und halten den `d`-String stabil, statt die
 * volle Gleitkommadarstellung in einen eingecheckten Snapshot zu schreiben.
 */
const PATH_DECIMALS = 4;

function round(value: number): number {
  return Number(value.toFixed(PATH_DECIMALS));
}

/**
 * Erzeugt den `d`-String eines geschlossenen Vielecks mit gerundeten Ecken. Je Ecke:
 * Tangentenabstand `t = r / tan(halber Innenwinkel)`, der Bogen als **eine** Kubik mit dem
 * Kontrolloffset `k = (4/3)·tan(Bogenwinkel/4)·r` entgegen der jeweiligen Kantenrichtung; die
 * Ecken sind durch Geraden verbunden.
 *
 * Bewusst abgeleitet statt als roher `d`-String eingetragen: belegt sind die zehn Ecken und die
 * zehn Radien von `1.9 Gebiet` (siehe dort), nicht die 629 Zeichen, die daraus folgen. Ein roher
 * String verbärge, welcher Teil die Messung ist und welcher ihre Konsequenz.
 */
function roundedPolygonPath(
  corners: readonly (readonly [number, number])[],
  radiiMm: readonly number[],
): string {
  const count = corners.length;
  const unit = (
    from: readonly [number, number],
    to: readonly [number, number],
  ): [number, number] => {
    const dx = to[0] - from[0];
    const dy = to[1] - from[1];
    const length = Math.hypot(dx, dy);
    return [dx / length, dy / length];
  };

  const arcs = corners.map((corner, index) => {
    const previous = corners[(index - 1 + count) % count] as readonly [number, number];
    const next = corners[(index + 1) % count] as readonly [number, number];
    const toPrevious = unit(corner, previous);
    const toNext = unit(corner, next);
    const interior = Math.acos(
      Math.max(-1, Math.min(1, toPrevious[0] * toNext[0] + toPrevious[1] * toNext[1])),
    );
    const radius = radiiMm[index] ?? 0;
    const tangent = radius / Math.tan(interior / 2);
    const control = (4 / 3) * Math.tan((Math.PI - interior) / 4) * radius;
    const start: [number, number] = [
      corner[0] + tangent * toPrevious[0],
      corner[1] + tangent * toPrevious[1],
    ];
    const end: [number, number] = [
      corner[0] + tangent * toNext[0],
      corner[1] + tangent * toNext[1],
    ];
    return {
      start,
      end,
      first: [start[0] - control * toPrevious[0], start[1] - control * toPrevious[1]] as const,
      second: [end[0] - control * toNext[0], end[1] - control * toNext[1]] as const,
    };
  });

  const first = arcs[0];
  if (first === undefined) throw new Error('roundedPolygonPath: mindestens eine Ecke nötig.');
  const parts: string[] = [`M ${round(first.start[0])} ${round(first.start[1])}`];
  arcs.forEach((arc, index) => {
    parts.push(
      `C ${round(arc.first[0])} ${round(arc.first[1])}, ` +
        `${round(arc.second[0])} ${round(arc.second[1])}, ` +
        `${round(arc.end[0])} ${round(arc.end[1])}`,
    );
    const next = arcs[(index + 1) % count];
    if (next !== undefined && index < count - 1) {
      parts.push(`L ${round(next.start[0])} ${round(next.start[1])}`);
    }
  });
  parts.push('Z');
  return parts.join(' ');
}

/**
 * Die zehn Ecken von `1.9 Gebiet` in Umlaufreihenfolge, in Millimetern. Rekonstruiert aus dem
 * Schnitt benachbarter Geradensegmente der Ebene `Flächige_Fülung` (eigene Vermessung,
 * 18. August 2026): keine der zwanzig Koordinaten liegt weiter als **0,00074 mm** von einem ganzen
 * Millimeter.
 *
 * Damit ist die Zeile „freie Kontur, keine glatten Entwurfsmaße, belegbar: nein" der Notiz vom
 * 5. August widerlegt. Ihre Extremazahlen `1,52/3,23/31/28,32` stimmen (nachgemessen
 * 1,5199/3,2298/30,9993/28,3237), sie sind nur **keine Entwurfsmaße**: sie liegen auf
 * Eckrundungen und nicht auf Ecken.
 */
const AREA_CORNERS = [
  [16, 24],
  [4, 29],
  [1, 23],
  [6, 18],
  [6, 8],
  [16, 3],
  [31, 6],
  [31, 13],
  [26, 15],
  [28, 26],
] as const;

/**
 * Die zehn Eckradien in derselben Reihenfolge, aus Ecke und Tangentenpunkten gerechnet. Alle zehn
 * liegen auf einem 0,6-mm-Raster. **Wie weit daneben, hängt vom Schätzer ab, und deshalb steht er
 * hier dazu:** rechnet man den Radius so, wie `roundedPolygonPath()` ihn setzt — aus dem
 * Tangentenabstand und dem halben Innenwinkel der Ecke —, liegt der größte Abstand zum Raster bei
 * **0,0003 mm**; über den Abstand des Bogenscheitels oder über eine Ausgleichsrechnung durch die
 * abgetasteten Bogenpunkte kommt man auf 0,0019 mm. Der erste Weg gilt, weil er derselbe ist, mit
 * dem der Katalog die Ecke anschließend baut.
 */
const AREA_RADII_MM = [4.8, 2.4, 2.4, 1.8, 2.4, 4.8, 2.4, 2.4, 1.2, 1.2] as const;

const BODIES: Partial<Record<SymbolKind, Primitive>> = {
  formation: { type: 'rect', role: 'body', x: 1, y: 6, width: 30, height: 20, style: OUTLINE },
  person: {
    type: 'rect',
    role: 'body',
    x: 16 - PERSON_HALF_SIDE,
    y: 16 - PERSON_HALF_SIDE,
    width: PERSON_HALF_SIDE * 2,
    height: PERSON_HALF_SIDE * 2,
    transform: { rotate: { angle: 45, cx: 16, cy: 16 } },
    style: OUTLINE,
  },
  /**
   * `1.3 Landfahrzeug` — Rechteck, dessen Oberkante eine flache Doppelkubik ist. Gemessen an der
   * Ebene `Flächige_Fülung`, die hier die **Mittellinie verbatim** trägt (Hülle
   * 0,9998/5,7499/31,0000/26,0001; unabhängig bestätigt durch die Mittelung der Strichkonturen
   * 0,7497…1,2499 außen/innen).
   *
   * Zwei Rundungen gegen die Messung, beide unter 0,001 mm: das Spiegelpaar der zweiten
   * Kontrollpunkte 7,0891 (links) / 7,0887 (rechts) auf 7,089 und der Scheitel 7,9999 / 8,0003
   * auf 8. Das ist dieselbe Mittelung, die `deriveRing` an Ringpaaren ausführt — die 0,0004 mm
   * Spiegelasymmetrie sind eine Exportrundungsstufe der Quelle, kein Umsetzungsentscheid.
   */
  'vehicle-land': {
    type: 'path',
    role: 'body',
    d: 'M 16 8 C 10 8, 5 7.089, 1 5.75 L 1 26 L 31 26 L 31 5.75 C 27 7.089, 22 8, 16 8 Z',
    style: OUTLINE,
  },
  /**
   * `1.4 Luftfahrzeug` — Halbkreis r = 15 um (16|23) über einer waagerechten Sehne, in der
   * üblichen Zwei-Kubiken-Näherung mit K = 4(√2−1)/3. Die Modellwerte 14,7157 / 7,7157 / 24,2843
   * treffen die gemessenen Kontrollpunkte 14,7158 / 7,7160 / 24,2845 auf höchstens 0,0003 mm.
   *
   * Damit ist das „Form nein" der Notiz vom 5. August widerlegt: nicht die Quelle war
   * unvermessbar, sondern der damalige Extraktor, der für einen Kurvenpfad `null` liefert und
   * `curvedPaths` hochzählt, statt eine Form abzulegen (`shapes: []` im Kennwertartefakt).
   */
  'vehicle-air': {
    type: 'path',
    role: 'body',
    d: 'M 31 23 L 1 23 C 1 14.7157, 7.7157 8, 16 8 C 24.2843 8, 31 14.7157, 31 23 Z',
    style: OUTLINE,
  },
  /**
   * `1.5 Wasserfahrzeug` — die gespiegelte Bauform von `1.4`: Halbkreis r = 15 um (16|9) unter
   * einer waagerechten Sehne. Gemessene Kontrolloffsets 17,2843 / 24,2842 / 7,7156 gegen die
   * Modellwerte 17,2843 / 24,2843 / 7,7157.
   *
   * **Nicht zu verwechseln mit den Wasserfahrzeugen aus E.2.27 bis E.2.31.** Die tragen die
   * Füllhülle 1,01/7,9999/30,9894/22,9898 und liegen damit 1,0 mm über diesem Grundzeichen —
   * zugleich zufällig auf der Hülle von `1.4 Luftfahrzeug`, obwohl es die entgegengesetzte
   * Halbkreisorientierung ist. Ein Gate, das nur Hüllen vergleicht, nähme dort die falsche Form an.
   */
  'vehicle-water': {
    type: 'path',
    role: 'body',
    d: 'M 1 9 L 31 9 C 31 17.2843, 24.2843 24, 16 24 C 7.7157 24, 1 17.2843, 1 9 Z',
    style: OUTLINE,
  },
  post: { type: 'circle', role: 'body', cx: 16, cy: 16, r: 14, style: OUTLINE },
  building: {
    type: 'polyline',
    role: 'body',
    closed: true,
    points: [
      [16, 3],
      [1, 10],
      [1, 26],
      [31, 26],
      [31, 10],
    ],
    style: OUTLINE,
  },
  container: { type: 'rect', role: 'body', x: 4, y: 4, width: 24, height: 24, style: OUTLINE },
  /**
   * `1.9 Gebiet` — Zehneck mit zehn Eckradien, abgeleitet aus `AREA_CORNERS` und `AREA_RADII_MM`
   * (siehe dort). Der erzeugte Pfad trifft die zwanzig gemessenen Tangentenpunkte der Referenz auf
   * höchstens **0,0008 mm = 0,0023 Einheiten**; seine Hülle ist 1,5202/3,2298/31,0000/28,3234
   * gegen die gemessene 1,5199/3,2298/30,9993/28,3237.
   */
  area: {
    type: 'path',
    role: 'body',
    d: roundedPolygonPath(AREA_CORNERS, AREA_RADII_MM),
    style: OUTLINE,
  },
  measure: {
    type: 'polyline',
    role: 'body',
    closed: true,
    points: [
      [1, 4],
      [16, 29],
      [31, 4],
    ],
    style: OUTLINE,
  },
  hazard: {
    type: 'polyline',
    role: 'body',
    closed: true,
    points: [
      [1, 28],
      [16, 3],
      [31, 28],
    ],
    style: OUTLINE,
  },
  point: {
    type: 'polyline',
    role: 'body',
    closed: true,
    points: [
      [8, 1],
      [8, 22],
      [16, 31],
      [24, 22],
      [24, 1],
    ],
    style: OUTLINE,
  },
  /**
   * `1.13 Ereignis` — der **offene** Polyzug (4|7) → (16|25) → (28|7). Die Referenz zeichnet ihn
   * als zu einer Fläche umgewandelten Strich mit sechs verschiedenen Punkten; paarweise gemittelt
   * ergeben sie die drei Ecken auf höchstens 0,0021 Einheiten genau.
   *
   * **Zweiter, unabhängiger Beleg** (eigene Rechnung, 18. August 2026): die analytische
   * Strichaufweitung dieses offenen Polyzugs bei 0,5 mm mit Gehrung und Stumpfkappen liefert
   * 3,7920/6,8613/28,2080/25,4507 und damit den eingecheckten Kennwert auf 0,0029 Einheiten. Ein
   * **geschlossener** Polyzug ergäbe 3,5329/6,7500/28,4671/25,4507 — 0,73 Einheiten daneben. Die
   * Offenheit ist damit gegatet und nicht nur am Snapshot geprüft (siehe `strokeBoundsOfMm` und
   * `matchFingerprint`, `bodyGeometry: 'stroke-outline'`).
   *
   * **Das einzige Grundzeichen, das keine Organisationsfarbe annehmen darf.** SVG schließt einen
   * gefüllten Polyzug implizit; aus dem Haken würde ein volles Dreieck (selbst gerastert: 936
   * statt 142 deckende Pixel bei 64 px). Der Haken kommt in genau einer der 661 Referenzdateien
   * vor — in `1.13` selbst —, es gibt also keinen Beleg für ein eingefärbtes Ereignis. `compose()`
   * wirft dafür.
   */
  event: {
    type: 'polyline',
    role: 'body',
    closed: false,
    points: [
      [4, 7],
      [16, 25],
      [28, 7],
    ],
    style: OUTLINE,
  },
  /**
   * `1.14 Spontanhelfer` — vier Kreisbögen (Vierlappen) um (16|16). Als einzige Datei des Kapitels
   * neben `1.13` führt sie **keine** Füllebene; die Mittellinie stammt deshalb aus dem Ringpaar
   * (außen 1,7501/1,7498/30,2500/30,2500, innen 2,2500/2,2500/29,7497/29,7497 → Mittellinie
   * 2/2/30/30 bei Strich 0,5).
   *
   * **Mittenabstand und Radius stammen aus dem exakten Umkreis durch die drei Segmentendpunkte je
   * Lappen — nicht aus einer Ausgleichsrechnung.** Alle vier Lappen liefern dasselbe: Mitten
   * (16|22,5066) (9,4936|16) (16|9,4931) (22,5066|16), Außenradius 7,7434, also d = 6,5066 und
   * Mittellinienradius R = 7,4934 mit d + R = 14,0000.
   *
   * **Das glatte Paar 6,5/7,5 ist ausgeschlossen**, und was es ausschließt, ist der Fugenpunkt der
   * Außenkontur: gemessen liegt er bei (8,3425|8,3425); das Modell 6,5066/7,4934 sagt 8,3426
   * voraus (0,0003 Einheiten), das Modell 6,5/7,5 sagt 8,3377 (0,0137 Einheiten — über der
   * Toleranz 0,01). Die Segmentendpunkte tragen dieses Argument, weil nur sie exakt auf dem Kreis
   * liegen, während die Zwei-Kubiken-Näherung der Referenz über die Bogenlänge um 0,0039 mm neben
   * ihm verläuft.
   *
   * **Eine Ausgleichsrechnung über abgetastete Kubiken ist dabei ausdrücklich keine Falle** — der
   * Baubeschluss hat das behauptet (d ≈ 6,4999 / R ≈ 7,5068, also fast das glatte Paar), und
   * weder der Bau noch die Gegenprüfung konnten es reproduzieren: beide landen bei ≈ 6,5057 /
   * 7,4928 und damit nahe am exakten Wert. Der eingetragene Wert bleibt davon unberührt; es ändert
   * sich nur, welche Begründung man weitergeben darf
   * (`docs/decisions/2026-08-18-grundlagen-restpunkte.md`, Abschnitt „Berichtigung am
   * Baubeschluss").
   */
  'spontaneous-helper': {
    type: 'path',
    role: 'body',
    d:
      'M 8.5644 8.5644 C 9.0329 4.8143, 12.2207 2, 16 2 C 19.7793 2, 22.9671 4.8143, ' +
      '23.4356 8.5644 C 27.1857 9.0329, 30 12.2207, 30 16 C 30 19.7793, 27.1857 22.9671, ' +
      '23.4356 23.4356 C 22.9671 27.1857, 19.7793 30, 16 30 C 12.2207 30, 9.0329 27.1857, ' +
      '8.5644 23.4356 C 4.8143 22.9671, 2 19.7793, 2 16 C 2 12.2207, 4.8143 9.0329, ' +
      '8.5644 8.5644 Z',
    style: OUTLINE,
  },
};

const TITLES: Partial<Record<SymbolKind, string>> = {
  formation: 'Taktische Formation',
  person: 'Person',
  'vehicle-land': 'Landfahrzeug',
  'vehicle-air': 'Luftfahrzeug',
  'vehicle-water': 'Wasserfahrzeug',
  post: 'Funktionsstelle',
  building: 'Gebäude',
  container: 'Behälter, Ressource, Raum, Funkgerät',
  area: 'Gebiet',
  measure: 'Maßnahme',
  hazard: 'Gefahr',
  point: 'Konkreter Punkt',
  event: 'Ereignis',
  'spontaneous-helper': 'Spontanhelfer',
};

const SECTIONS: Partial<Record<SymbolKind, { section: string; asset: string }>> = {
  formation: { section: '1.1', asset: '1.1_Taktische Formation.svg' },
  person: { section: '1.2', asset: '1.2_Person.svg' },
  'vehicle-land': { section: '1.3', asset: '1.3_Landfahrzeug.svg' },
  'vehicle-air': { section: '1.4', asset: '1.4_Luftfahrzeug.svg' },
  'vehicle-water': { section: '1.5', asset: '1.5_Wasserfahrzeug.svg' },
  post: { section: '1.6', asset: '1.6_Funktionsstelle.svg' },
  building: { section: '1.7', asset: '1.7_Gebäude.svg' },
  container: { section: '1.8', asset: '1.8_Behälter Ressource Raum Funkgerät.svg' },
  area: { section: '1.9', asset: '1.9_Gebiet.svg' },
  measure: { section: '1.10', asset: '1.10_Maßnahme.svg' },
  hazard: { section: '1.11', asset: '1.11_Gefahr.svg' },
  point: { section: '1.12', asset: '1.12_Konkreter Punkt.svg' },
  event: { section: '1.13', asset: '1.13_Ereignis.svg' },
  'spontaneous-helper': { section: '1.14', asset: '1.14_Spontanhelfer.svg' },
};

export function baseDrawing(kind: SymbolKind): Drawing {
  const body = BODIES[kind];
  if (!body) throw new Error(`Kein Grundzeichen für "${kind}" im Katalog.`);
  const title = TITLES[kind];
  return {
    viewBox: DEFAULT_VIEWBOX_MM,
    children: [body],
    ...(title !== undefined ? { title } : {}),
    ...(title !== undefined
      ? { description: `Grundzeichen: ${title}. BABZ-Abschnitt ${SECTIONS[kind]?.section ?? ''}.` }
      : {}),
  };
}

function entry(kind: SymbolKind): CatalogEntry {
  const title = TITLES[kind];
  if (title === undefined) throw new Error(`Kein Titel für "${kind}".`);
  const meta = SECTIONS[kind];
  if (!meta) throw new Error(`Keine Quellenangabe für "${kind}".`);
  return {
    id: `base.${kind}`,
    title,
    kind,
    profile: 'bund',
    depictions: [
      {
        variant: 'primary',
        drawing: baseDrawing(kind),
        sourceRefs: [
          {
            source: 'babz-svg-2025',
            section: meta.section,
            asset: meta.asset,
            status: 'verbatim',
          },
        ],
      },
    ],
  };
}

/**
 * Alle vierzehn Grundzeichen aus Kapitel 1, in Abschnittsreihenfolge. Seit LFH-424 vollständig:
 * die sechs bis dahin fehlenden waren nicht unbelegbar, sondern nur mit dem damaligen Extraktor
 * nicht vermessbar (er legt für Kurvenpfade keine Form ab — `shapes: []` bei 1.3, 1.4, 1.5, 1.9
 * und 1.14). Vermessen sind sie mit einem eigenen Pfadparser mit analytischen Kubik-Extrema, wie
 * ihn der Teilslice E-c für die 37 E.1-Dateien gebaut hat; die Herkunft jeder Zahl steht am
 * jeweiligen Körper.
 */
export const BASE_SYMBOLS = {
  formation: entry('formation'),
  person: entry('person'),
  'vehicle-land': entry('vehicle-land'),
  'vehicle-air': entry('vehicle-air'),
  'vehicle-water': entry('vehicle-water'),
  post: entry('post'),
  building: entry('building'),
  container: entry('container'),
  area: entry('area'),
  measure: entry('measure'),
  hazard: entry('hazard'),
  point: entry('point'),
  event: entry('event'),
  'spontaneous-helper': entry('spontaneous-helper'),
} as const satisfies Partial<Record<SymbolKind, CatalogEntry>>;
