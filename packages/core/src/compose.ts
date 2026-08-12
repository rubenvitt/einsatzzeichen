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
import { boundsOfMm, type BoundsMm } from './bounds.js';
import { HEAD_GAP_MM, placeHead, profileFor } from './layout/profiles.js';
import {
  ARIMO_CAP_HEIGHT_FRACTION,
  MINIMUM_TEXT_RENDER_PX,
  verticalTextBoxMm,
} from './render/text-policy.js';
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

/**
 * Die drei Beschriftungszonen **im** Körper, vermessen an den 16 Referenzdateien E.1.1 bis
 * E.1.16 (11./12. August 2026). Alle 16 tragen dieselben Werte auf zwei Nachkommastellen — die
 * Zonen sind deshalb hier als Layoutregel formuliert und nicht 16-mal am einzelnen Zeichen
 * platziert. Bezugsrahmen ist die Hülle des **tatsächlich platzierten** Körpers, wie bei der
 * Fußzone: verschiebt eine Kopfzone den Körper, wandern die Beschriftungen mit.
 *
 * | Zone | Referenzmessung (Körper 1/6 bis 31/26 mm) | Regel |
 * |---|---|---|
 * | Mitte | Grundlinie 18,00; Versalhöhe 4,87; Mitte x 16,00 | 12 mm unter der Körperoberkante, waagerecht mittig |
 * | unten links | Grundlinie 24,00; Versalhöhe 2,92; linke Kante 3,03 | 2 mm über der Unterkante, 2 mm von der linken Kante |
 * | unten rechts | Grundlinie 24,00; Versalhöhe 2,92; rechte Kante 29,03 | 2 mm über der Unterkante, 2 mm von der rechten Kante |
 *
 * Die Referenz zieht ihre Ränder gegen ein weißes Innenfeld, das 1 mm in den Körper eingerückt
 * ist (`rect` 2/7 bis 30/25 neben dem Körper 1/6 bis 31/26). Der Katalog kennt dieses Innenfeld
 * nicht — `base-symbols.ts` führt die Taktische Formation als **ein** Rechteck, das der
 * Kompositionsmotor mit der Organisationsfarbe füllt. Gegen die Körperkante gerechnet sind es
 * deshalb 2 mm statt 1 mm; der sichtbare Abstand ist derselbe wie in der Referenz.
 */
const CENTER_LABEL_BASELINE_FROM_BODY_TOP_MM = 12;
const BOTTOM_LABEL_BASELINE_FROM_BODY_BOTTOM_MM = 2;
const LABEL_SIDE_MARGIN_MM = 2;

/** Versalhöhen der beiden Schriftgrade, gemessen an allen 16 Dateien (siehe Tabelle oben). */
const CENTER_LABEL_CAP_HEIGHT_MM = 4.87;
const BOTTOM_LABEL_CAP_HEIGHT_MM = 2.92;

/**
 * Aus der gemessenen Versalhöhe abgeleitete Schriftgrade — 7,08 mm und 4,24 mm. Der Umweg über
 * `ARIMO_CAP_HEIGHT_FRACTION` ist der Punkt: an der Referenz ist die Versalhöhe ablesbar, der
 * Schriftgrad nicht (die Kürzel liegen dort in Kurven umgewandelt vor). Ein direkt
 * hingeschriebener Schriftgrad wäre eine geratene Zahl, die zufällig ähnlich aussieht.
 */
const CENTER_LABEL_SIZE_MM = CENTER_LABEL_CAP_HEIGHT_MM / ARIMO_CAP_HEIGHT_FRACTION;
const BOTTOM_LABEL_SIZE_MM = BOTTOM_LABEL_CAP_HEIGHT_MM / ARIMO_CAP_HEIGHT_FRACTION;

/**
 * Untere Einsatzgrenze eines Beschriftungslaufs: die kleinste Rendergröße, bei der sein
 * effektiver Schriftgrad `MINIMUM_TEXT_RENDER_PX` erreicht. Gerechnet statt gewählt — bei
 * 7,08 mm sind das 37 px, bei 4,24 mm 61 px, auf der Snapshot-Leiter also erst 64 px für beide.
 *
 * Das ist keine Ausrede für zu kleine Schrift: die Größen stammen aus der Vermessung, nicht aus
 * einer Platzabwägung. Ein Zeichen, dessen Kürzel bei 32 px nicht mehr lesbar ist, trägt hier
 * eine dokumentierte Aussage darüber statt eines stillen Anspruchs auf jede Rendergröße.
 */
function minRenderPxFor(sizeMm: number, viewBoxWidthMm: number): number {
  return Math.ceil((MINIMUM_TEXT_RENDER_PX * viewBoxWidthMm) / sizeMm);
}

/**
 * Ein Beschriftungslauf im Körper. `boxMm` ist wie bei jedem Textprimitiv eine Zusicherung des
 * Autors, keine Messung — die waagerechte Ausdehnung ist deshalb bewusst eng gefasst: der
 * mittige Lauf bekommt die Körperbreite abzüglich beider Ränder, die beiden unteren je ihre
 * Hälfte bis zur Körpermitte. Damit ist „passt in seine Zone" eine prüfbare Aussage und die
 * beiden unteren Läufe können sich nicht überlappen, ohne dass ein Gate es meldet
 * (Rasterprüfung in `fonts.test.ts`).
 */
function labelPrimitive(
  content: string,
  sizeMm: number,
  baselineYMm: number,
  anchor: 'start' | 'middle' | 'end',
  xMm: number,
  boxXMm: number,
  boxWidthMm: number,
  viewBoxWidthMm: number,
): Primitive {
  const box = verticalTextBoxMm(baselineYMm, sizeMm, 'alphabetic');
  return {
    type: 'text',
    role: 'label',
    content,
    x: xMm,
    y: baselineYMm,
    sizeMm,
    anchor,
    baseline: 'alphabetic',
    boxMm: { xMm: boxXMm, yMm: box.topMm, widthMm: boxWidthMm, heightMm: box.heightMm },
    minRenderPx: minRenderPxFor(sizeMm, viewBoxWidthMm),
    style: { fill: 'weiss' },
  };
}

/**
 * Die Beschriftungen der drei Zonen, gegen die Hülle des platzierten Körpers gerechnet. Die
 * Farbe ist fest `weiss`: alle 37 Zeichen aus E.1 setzen ihre Kürzel auf die gefüllte
 * Körperfläche, nicht auf die Oberfläche. Sie ist damit — anders als bei der schwarzen Fußzone
 * — auf einen Kontrastvertrag gegen die Organisationsfarbe angewiesen; der steht im
 * A11y-Gate des Katalogs.
 */
function labelPrimitives(
  labels: NonNullable<SymbolSpec['labels']>,
  bodyBoundsMm: BoundsMm,
  viewBoxWidthMm: number,
): Primitive[] {
  const centerXMm = (bodyBoundsMm.minX + bodyBoundsMm.maxX) / 2;
  const leftMm = bodyBoundsMm.minX + LABEL_SIDE_MARGIN_MM;
  const rightMm = bodyBoundsMm.maxX - LABEL_SIDE_MARGIN_MM;
  const centerBaselineMm = bodyBoundsMm.minY + CENTER_LABEL_BASELINE_FROM_BODY_TOP_MM;
  const bottomBaselineMm = bodyBoundsMm.maxY - BOTTOM_LABEL_BASELINE_FROM_BODY_BOTTOM_MM;

  const primitives: Primitive[] = [];
  if (labels.center !== undefined) {
    primitives.push(
      labelPrimitive(
        labels.center,
        CENTER_LABEL_SIZE_MM,
        centerBaselineMm,
        'middle',
        centerXMm,
        leftMm,
        rightMm - leftMm,
        viewBoxWidthMm,
      ),
    );
  }
  if (labels.bottomLeft !== undefined) {
    primitives.push(
      labelPrimitive(
        labels.bottomLeft,
        BOTTOM_LABEL_SIZE_MM,
        bottomBaselineMm,
        'start',
        leftMm,
        leftMm,
        centerXMm - leftMm,
        viewBoxWidthMm,
      ),
    );
  }
  if (labels.bottomRight !== undefined) {
    primitives.push(
      labelPrimitive(
        labels.bottomRight,
        BOTTOM_LABEL_SIZE_MM,
        bottomBaselineMm,
        'end',
        rightMm,
        centerXMm,
        rightMm - centerXMm,
        viewBoxWidthMm,
      ),
    );
  }
  return primitives;
}

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

  // Beschriftungen liegen **auf** dem Körper und stehen deshalb nach ihm in der Kinderliste;
  // die Fußzone dahinter, weil sie unterhalb von ihm liegt und mit ihm nicht konkurriert.
  const labels = spec.labels !== undefined
    ? labelPrimitives(spec.labels, bodyBoundsMm, DEFAULT_VIEWBOX_MM.width)
    : [];

  return {
    viewBox: DEFAULT_VIEWBOX_MM,
    children: [...headPrimitives, filled, ...pictograms, ...labels, ...footPrimitives],
    ...(options.title !== undefined ? { title: options.title } : {}),
    ...(options.description !== undefined ? { description: options.description } : {}),
  };
}
