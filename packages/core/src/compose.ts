import {
  DEFAULT_VIEWBOX_MM,
  type CapabilityId,
  type ColorToken,
  type Drawing,
  type HeadShape,
  type OrganizationId,
  type PictogramDefinition,
  type PictogramId,
  type Primitive,
  type StrengthId,
  type SymbolKind,
  type SymbolSpec,
} from '@einsatzzeichen/schema';
import { boundsOfMm } from './bounds.js';
import { HEAD_GAP_MM, placeHead, profileFor } from './layout/profiles.js';
import { verticalTextBoxMm } from './render/text-policy.js';
import { validateSpec } from './validate.js';

/** Senkrechte Mitte der Hülle eines Primitivs, in Millimetern. */
function centerYMm(primitive: Primitive): number {
  const bounds = boundsOfMm(primitive);
  return (bounds.minY + bounds.maxY) / 2;
}

/**
 * Schriftgrad der Fußzone. Gespiegelt aus derselben Rechnung wie `placeHead` — nicht neu
 * erfunden: die Kopfzone darf beim Rechteck-Körper (`defaultAnchorMm` 6) bis zu
 * `defaultAnchorMm - HEAD_GAP_MM - HEAD_TOP_MARGIN_MM` = 4 mm hoch werden, ohne den Körper zu
 * verschieben (siehe `placeHead`, `topMm = max(HEAD_TOP_MARGIN_MM, defaultAnchorMm - HEAD_GAP_MM
 * - headHeightMm)`). Dieselben 4 mm sind der gespiegelte Freiraum unterhalb der
 * Standard-Körperunterkante bis zum gespiegelten Rand (`viewBoxHeight - HEAD_TOP_MARGIN_MM`).
 *
 * Bewusst ein einziger, fixer Wert und keine Herleitung je `LayoutProfile.defaultAnchorMm`: für
 * `person` (1) und `post` (2) ginge dieselbe Formel auf null oder negativ. Ein bedingungsloses
 * Abschneiden auf 0 würde dort einen unsichtbaren `sizeMm: 0`-Text erzeugen — eine Fußzone, die
 * lautlos verschwindet, statt als Geometriebefund aufzufallen. Mit dem festen Wert produziert
 * `person`/`post` stattdessen eine Box, die über die viewBox hinausragt: ein `outside-viewbox`-
 * Befund im viewBox-Gate aus Task 5, wie jede andere zu große Geometrie — belegt in
 * `compose.test.ts`.
 *
 * Bei 4 mm Schriftgrad auf der 32-mm-Standard-viewBox erreicht `effectiveTextPx` erst ab 64 px
 * Rendergröße die Lesbarkeitsschwelle `MINIMUM_TEXT_RENDER_PX` (8 px): 16→2, 24→3, 32→4, 64→8,
 * 128→16, 256→32 px. Der Rückstand unter 64 px ist geometrisch erzwungen, nicht durch zu
 * vorsichtige Wahl entstanden — 4 mm ist der größte Schriftgrad, den der gespiegelte
 * Rand-plus-Abstand für den Rechteck-Körper zulässt, bevor die Fußzone selbst zum Gate-Befund
 * würde.
 */
const FOOT_TEXT_SIZE_MM = 4;

/** Zugriffe auf den Katalog. Als Ports übergeben, damit core nicht von catalog abhängt. */
export interface CatalogPorts {
  baseDrawing(kind: SymbolKind): Drawing;
  organizationColor(id: OrganizationId): ColorToken;
  strengthHead(id: StrengthId): HeadShape;
  /**
   * Liefert die volle Definition, nicht nur die Primitive: die deklarierte Box trägt die drei
   * Gates. Damit hat `PictogramDefinition` von Beginn an zwei Konsumenten und ist kein
   * vorbereitetes Feld.
   */
  pictogram(id: PictogramId): PictogramDefinition;
}

export class CompositionError extends Error {
  constructor(readonly issues: ReturnType<typeof validateSpec>) {
    super(
      `Unzulässige Kombination:\n${issues.map((i) => `  [${i.rule}] ${i.message}`).join('\n')}`,
    );
    this.name = 'CompositionError';
  }
}

export interface ComposeOptions {
  /**
   * Titel des zusammengesetzten Zeichens. Überschreibt den Titel des Grundzeichens
   * (`baseDrawing`), der sonst — fachlich irreführend — in die Zeichnung übernommen würde:
   * eine Löschstaffel ist kein "Taktische Formation" mehr, sobald Stärke und Fähigkeit
   * sie zu einem eigenständigen Zeichen machen. Ohne Titel bleibt `Drawing.title` unbesetzt,
   * es entsteht kein leeres `<title>`.
   */
  title?: string;
  /** Semantische Beschreibung; wird wie der Titel vom Katalog geliefert, nie aus Geometrie geraten. */
  description?: string;
}

/**
 * `SymbolSpec.capabilities` trägt `CapabilityId` (`'fire-fighting'`), der Piktogrammraum trägt
 * präfigierte IDs (`'capability.fire-fighting'`). Die Abbildung steht hier an einer Stelle und
 * nicht an jedem Aufrufort. Kapitel 5.8 bleibt bewusst ein eigenständiger Piktogrammkatalog ohne
 * `SymbolSpec.states` und ohne Integration in `compose()`. Weitere ID-Räume erhalten erst dann
 * `SymbolSpec`-Felder, wenn ein realer Konsument fachlich freigegeben ist.
 */
function pictogramIdOf(id: CapabilityId): PictogramId {
  return `capability.${id}`;
}

export function compose(spec: SymbolSpec, catalog: CatalogPorts, options: ComposeOptions = {}): Drawing {
  const issues = validateSpec(spec);
  if (issues.length > 0) throw new CompositionError(issues);

  const base = catalog.baseDrawing(spec.kind);
  const body = base.children.find((child) => child.role === 'body');
  if (!body) throw new Error(`Grundzeichen "${spec.kind}" hat kein body-Primitiv.`);

  const profile = profileFor(spec.kind);
  const headShape = spec.strength !== undefined ? catalog.strengthHead(spec.strength) : null;

  // Dieselbe Kopfzone sitzt je nach Körperform unterschiedlich hoch — deshalb
  // rechnet erst placeHead die relativen Marken in absolute Koordinaten um.
  const headBox = headShape ? placeHead(profile, headShape.heightMm) : null;
  const headPrimitives: Primitive[] =
    headShape && headBox
      ? headShape.marks.map((mark) => ({
          type: 'circle',
          role: 'head',
          cx: mark.cxMm,
          cy: headBox.topMm + mark.cyFromTopMm,
          r: mark.rMm,
          style: { fill: 'schwarz' },
        }))
      : [];

  const placedBody = profile.place(body, headBox?.bottomMm ?? null);

  const filled: Primitive =
    spec.organization !== undefined
      ? {
          ...placedBody,
          style: { ...placedBody.style, fill: catalog.organizationColor(spec.organization) },
        }
      : placedBody;

  // Piktogramme sind auf den unverschobenen Körper hin entworfen (Mitte bei 16 mm). Der
  // Kompositionsmotor kann den Körper senkrecht verschieben oder verkleinern, um Platz für die
  // Kopfzone zu schaffen — das Piktogramm muss dieser Körpermitte folgen, sonst sitzt es an der
  // absoluten Referenzstelle statt an der tatsächlichen Körpermitte. Die Referenz belegt das:
  // C.1.1 (Stapel, Körper verschoben) verschiebt das Piktogramm um dieselben 3 mm, C.1.2
  // (Reihe, Körper unverschoben) lässt es unverändert.
  //
  // Die Verschiebung sitzt an genau einer Gruppe und nicht an jedem Primitiv: ein Pfad trägt
  // seine Koordinaten unzerlegt im `d`-String und kann nicht primitivweise verschoben werden
  // (`shiftY` lehnt das ausdrücklich ab). Auf der Gruppe wirkt die Verschiebung nach außen auf
  // das fertige Ergebnis und ist damit von einer Drehung der Kinder unabhängig.
  const pictogramShiftMm = centerYMm(placedBody) - centerYMm(body);
  const pictogramPrimitives = (spec.capabilities ?? []).flatMap(
    (id) => catalog.pictogram(pictogramIdOf(id)).primitives,
  );
  const pictograms: Primitive[] =
    pictogramPrimitives.length > 0
      ? [
          {
            type: 'group',
            role: 'pictogram',
            transform: { translate: { dxMm: 0, dyMm: pictogramShiftMm } },
            children: pictogramPrimitives,
          },
        ]
      : [];

  // Fußzone: dieselbe Spiegelung wie oben bei `pictogramShiftMm` — an der tatsächlich platzierten
  // Körperhülle (`placedBody`), nicht an der unverschobenen Standardgeometrie. Anders als die
  // Kopfzone (deren `headBox` unabhängig vom Körper berechnet wird, weil der Körper ihr erst noch
  // ausweichen muss) konkurriert die Fußzone mit nichts um denselben Platz — sie hängt sich an die
  // Unterkante des Körpers, wo immer die nach einer eventuellen Kopfzonen-Verschiebung liegt. Das
  // hält Kopf- und Fußzone auch dann überschneidungsfrei, wenn ein Zeichen künftig beides trägt.
  const bodyBoundsMm = boundsOfMm(placedBody);
  const footTopMm = bodyBoundsMm.maxY + HEAD_GAP_MM;
  // `boxMm` ist bei Text eine Zusicherung des Autors, keine Messung (siehe Primitive-Kommentar
  // in geometry.ts) — sie muss deshalb selbst den Diakritika-Überstand einkalkulieren, den kein
  // Gate mehr erkennt. `verticalTextBoxMm` liefert die dafür nötige Ober­kante/Höhe aus Anker,
  // Schriftgrad und `baseline` (Task-9-Befund, siehe DIACRITIC_HEADROOM_FRACTION in
  // text-policy.ts). Nur die Oberkante wandert nach oben, die Unterkante bleibt bei
  // `footTopMm + FOOT_TEXT_SIZE_MM`: Unterlängen passen dort bereits ohne Zuschlag (siehe
  // Rasterevidenz in fonts.test.ts), ein zusätzlicher Zuschlag nach unten würde die Box nur
  // unnötig weiter Richtung viewBox-Rand wachsen lassen.
  const footBoxMm = verticalTextBoxMm(footTopMm, FOOT_TEXT_SIZE_MM, 'hanging');
  const footPrimitives: Primitive[] =
    spec.designation !== undefined
      ? [
          {
            type: 'text',
            role: 'foot',
            content: spec.designation,
            x: (bodyBoundsMm.minX + bodyBoundsMm.maxX) / 2,
            y: footTopMm,
            sizeMm: FOOT_TEXT_SIZE_MM,
            anchor: 'middle',
            baseline: 'hanging',
            boxMm: {
              xMm: bodyBoundsMm.minX,
              yMm: footBoxMm.topMm,
              widthMm: bodyBoundsMm.maxX - bodyBoundsMm.minX,
              heightMm: footBoxMm.heightMm,
            },
            style: { fill: 'schwarz' },
          },
        ]
      : [];

  return {
    viewBox: DEFAULT_VIEWBOX_MM,
    children: [...headPrimitives, filled, ...pictograms, ...footPrimitives],
    ...(options.title !== undefined ? { title: options.title } : {}),
    ...(options.description !== undefined ? { description: options.description } : {}),
  };
}
