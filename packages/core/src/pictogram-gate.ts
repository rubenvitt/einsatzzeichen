import {
  DEFAULT_STROKE_WIDTH_MM,
  mmToUnits,
  unitsEqual,
  type DepictionVariant,
  type PictogramBox,
  type PictogramDefinition,
  type PictogramId,
  type Point,
  type Primitive,
  type PrimitiveRole,
  type Style,
  type Transform,
} from '@einsatzzeichen/schema';
import { rasterDimensionsForWidth } from './render/raster-dimensions.js';
import { boundsOfMm, type BoundsMm } from './bounds.js';
import { tokenizePath, type PathCommand } from './path-commands.js';
import { effectiveTextPx, MINIMUM_TEXT_RENDER_PX } from './render/text-policy.js';
import { mergeStyle } from './render/style.js';

/**
 * Ein Befund eines der drei Piktogramm-Gates. Eine gemeinsame Form statt dreier eigener: das
 * Coverage-Gate und die Katalogtests geben sie einheitlich aus, und ein viertes Gate kostet
 * keine Änderung an der Rückgabeform — dasselbe Muster wie `CoverageViolation` in `catalog`.
 *
 * Listen von Befunden statt Ausnahmen, wie `validateSpec`: ein Autor will alle Verstöße seines
 * Piktogramms auf einmal sehen, nicht den ersten. Weil Primär- und Alternativdarstellung dieselbe
 * ID teilen, gehört die Variante ausdrücklich zur Befundidentität.
 */
export interface PictogramIssue {
  gate: 'command' | 'box' | 'clipping' | 'text-legibility';
  pictogramId: PictogramId;
  variant: DepictionVariant;
  detail: string;
}

/** Alle Pfad-Primitive einer Definition, auch verschachtelte. */
function pathsOf(primitives: readonly Primitive[]): Array<Primitive & { type: 'path' }> {
  const paths: Array<Primitive & { type: 'path' }> = [];
  for (const primitive of primitives) {
    if (primitive.type === 'path') paths.push(primitive);
    else if (primitive.type === 'group') paths.push(...pathsOf(primitive.children));
  }
  return paths;
}

/**
 * Wirft, wenn eine Gruppe innerhalb einer PictogramDefinition eine Transformation trägt. Geteilt
 * zwischen `measurableOf` und `textsOf`: beide steigen in verschachtelte Gruppen ab und lesen die
 * Rohkoordinaten ihrer Blätter weiter oben oder unten über `boundsOfMm` — eine transformierte
 * Gruppe ginge dabei verloren, und die Box- oder Clipping-Prüfung liefe gegen die falschen Zahlen.
 * compose() setzt die Verschiebung der Komposition außen auf; eine innere Transformation ist im
 * aktuellen Referenzbestand kein belegter Fall — genau deshalb hier ein Wurf statt einer stillen
 * Näherung.
 */
function rejectGroupTransform(group: Primitive & { type: 'group' }): void {
  if (group.transform !== undefined) {
    throw new Error(
      'pictogram-gate: Eine Gruppe innerhalb einer PictogramDefinition darf keine ' +
        'Transformation tragen — die Verschiebung der Komposition setzt compose() außen auf, ' +
        'und eine innere würde die Box- oder Clipping-Prüfung gegen die Rohkoordinaten laufen ' +
        'lassen.',
    );
  }
}

/**
 * Alle Text-Primitive einer Definition, auch verschachtelte.
 *
 * Trägt denselben Transform-Guard wie `measurableOf` (`rejectGroupTransform`), nicht nur, weil
 * `checkBox` beide Sammlungen nacheinander abfragt: `checkClipping` ruft `measurableOf` nie auf
 * und wäre ohne einen eigenen Guard hier ungeschützt — ein Text-Primitiv unter einer
 * transformierten Gruppe würde dort mit seinen unverschobenen `boxMm`-Rohkoordinaten gegen den
 * Körper geprüft: ein stiller Fehlbefund oder eine stille Nichterkennung, kein Wurf. Der Schutz
 * muss deshalb hier selbst stehen, nicht nur zufällig aus der Aufrufreihenfolge in `checkBox`
 * folgen.
 */
function textsOf(primitives: readonly Primitive[]): Array<Primitive & { type: 'text' }> {
  const texts: Array<Primitive & { type: 'text' }> = [];
  for (const primitive of primitives) {
    if (primitive.type === 'text') texts.push(primitive);
    else if (primitive.type === 'group') {
      rejectGroupTransform(primitive);
      texts.push(...textsOf(primitive.children));
    }
  }
  return texts;
}

/**
 * Prüft, dass jeder `d`-String der Definition ausschließlich die sieben zugelassenen absoluten
 * Kommandos verwendet (Spec Abschnitt 5). Diese Beschränkung ist nicht stilistisch: sie ist die
 * Bedingung, unter der das Box-Gate beweisbar konservativ ist. Mit `A`, `S` oder `T` wäre es
 * nicht konservativ, sondern falsch.
 */
export function checkCommands(definition: PictogramDefinition): PictogramIssue[] {
  const issues: PictogramIssue[] = [];
  for (const path of pathsOf(definition.primitives)) {
    for (const problem of tokenizePath(path.d).problems) {
      issues.push({
        gate: 'command',
        pictogramId: definition.id,
        variant: definition.variant,
        detail: problem,
      });
    }
  }
  return issues;
}

/** Ob eine Definition — auch verschachtelt — mindestens ein Pfad-Primitiv enthält. */
function hasPath(primitives: readonly Primitive[]): boolean {
  return primitives.some(
    (primitive) =>
      primitive.type === 'path' ||
      (primitive.type === 'group' && hasPath(primitive.children)),
  );
}

/** Ob eine Definition — auch verschachtelt — mindestens ein Text-Primitiv enthält. */
function hasText(primitives: readonly Primitive[]): boolean {
  return primitives.some(
    (primitive) =>
      primitive.type === 'text' ||
      (primitive.type === 'group' && hasText(primitive.children)),
  );
}

/**
 * Alle Primitive mit berechenbarer Hülle — also alles außer Pfaden, aus Gruppen herausgezogen.
 *
 * Wirft für eine Gruppe mit `transform` (über `rejectGroupTransform`): `boundsOfMm` auf einem
 * herausgezogenen Kind liest dessen Rohkoordinaten, die Transformation der Elterngruppe wäre
 * verloren, und die Box-Prüfung liefe gegen die falschen Zahlen. In D.0 trägt keine Definition
 * eine transformierte Gruppe — genau deshalb steht der Fehler hier, bevor es in D.1 still falsch
 * werden kann.
 *
 * Text bleibt hier bewusst außen vor, obwohl `boundsOfMm` für Text anstandslos eine Hülle liefert
 * und `primitive.type !== 'path'` es sonst kommentarlos durchließe. Der Unterschied ist, WAS diese
 * Hülle bedeutet: für ein Rechteck, einen Kreis oder eine Polylinie ist sie eine Messung, für Text
 * gibt `boundsOfMm` unverändert die deklarierte `boxMm` zurück — dieselbe Zusicherung, die geprüft
 * werden soll, nicht ihr Ergebnis. Bliebe Text hier drin, würde die Gleichheitsprüfung weiter unten
 * (Hülle == Box) für eine reine Textdefinition zu "boxMm == box" entarten: eine Zusicherung gegen
 * sich selbst, die nur noch verlangt, dass der Autor dieselben Zahlen zweimal schreibt — kein Gate
 * mehr, das etwas über die Piktogrammgeometrie aussagt. `checkBox()` prüft Textenthaltung deshalb
 * über einen eigenen Pfad (`textsOf`), der dieselbe Prüflogik wiederverwendet, aber strukturell nie
 * in die Gleichheitsprüfung einfließen kann.
 */
function measurableOf(primitives: readonly Primitive[]): Primitive[] {
  const measurable: Primitive[] = [];
  for (const primitive of primitives) {
    if (primitive.type === 'group') {
      rejectGroupTransform(primitive);
      measurable.push(...measurableOf(primitive.children));
    } else if (primitive.type !== 'path' && primitive.type !== 'text') {
      measurable.push(primitive);
    }
  }
  return measurable;
}

interface Axis {
  name: 'x' | 'y';
  min: number;
  max: number;
}

function axesOf(box: PictogramBox): { x: Axis; y: Axis } {
  return {
    x: { name: 'x', min: box.xMm, max: box.xMm + box.widthMm },
    y: { name: 'y', min: box.yMm, max: box.yMm + box.heightMm },
  };
}

/** Formale Fehler der zugesicherten Box, bevor aus ihr Achsen oder Ecken abgeleitet werden. */
function boxGeometryProblems(box: PictogramBox): string[] {
  const problems: string[] = [];
  const fields = [
    ['xMm', box.xMm],
    ['yMm', box.yMm],
    ['widthMm', box.widthMm],
    ['heightMm', box.heightMm],
  ] as const;
  for (const [name, value] of fields) {
    if (!Number.isFinite(value)) problems.push(`${name} muss endlich sein (ist ${String(value)}).`);
  }
  if (Number.isFinite(box.widthMm) && box.widthMm < 0) {
    problems.push(`widthMm darf nicht negativ sein (ist ${box.widthMm}).`);
  }
  if (Number.isFinite(box.heightMm) && box.heightMm < 0) {
    problems.push(`heightMm darf nicht negativ sein (ist ${box.heightMm}).`);
  }
  return problems;
}

/**
 * Ob ein Wert auf seiner Achse innerhalb der Box liegt. Verglichen wird in SVG-Einheiten gegen
 * `TOLERANCE_UNITS` (über `unitsEqual`), nicht mit `<`/`>` auf Millimetern: eine Koordinate genau
 * auf der Kante ist zulässig, und Exportrundungen dürfen kein Gate reißen.
 */
function within(value: number, axis: Axis): boolean {
  const units = mmToUnits(value);
  const min = mmToUnits(axis.min);
  const max = mmToUnits(axis.max);
  if (units >= min && units <= max) return true;
  return unitsEqual(units, min) || unitsEqual(units, max);
}

/**
 * Die Koordinaten eines Kommandos, jeweils mit ihrer Achse. `H` trägt nur ein x, `V` nur ein y —
 * genau der Grund, warum das Gate Kommandos liest und keinen Zahlenstrom.
 */
function coordinatesOf(command: PathCommand, axes: { x: Axis; y: Axis }): Array<[number, Axis]> {
  if (command.command === 'H') {
    const [x] = command.numbers;
    return x === undefined ? [] : [[x, axes.x]];
  }
  if (command.command === 'V') {
    const [y] = command.numbers;
    return y === undefined ? [] : [[y, axes.y]];
  }
  // M, L, C, Q tragen ausschließlich Koordinatenpaare; Z trägt keine Zahlen.
  const pairs: Array<[number, Axis]> = [];
  for (let i = 0; i + 1 < command.numbers.length; i += 2) {
    const x = command.numbers[i];
    const y = command.numbers[i + 1];
    if (x !== undefined) pairs.push([x, axes.x]);
    if (y !== undefined) pairs.push([y, axes.y]);
  }
  return pairs;
}

/**
 * Meldet jede Achse einer Hülle, die außerhalb der Box liegt. Geteilt zwischen echten
 * Primitivhüllen (`measurable`, unten in `checkBox`) und Textboxen (`textsOf`): beide werden
 * gegen dieselbe Box auf dieselbe Weise auf Enthaltung geprüft, nur was hinter `bounds` steckt
 * unterscheidet sich — eine Messung dort, eine Zusicherung hier (siehe `measurableOf`).
 */
function containmentDetails(label: string, bounds: BoundsMm, axes: { x: Axis; y: Axis }): string[] {
  const details: string[] = [];
  const checks: Array<[number, Axis]> = [
    [bounds.minX, axes.x],
    [bounds.maxX, axes.x],
    [bounds.minY, axes.y],
    [bounds.maxY, axes.y],
  ];
  for (const [value, axis] of checks) {
    if (!within(value, axis)) {
      details.push(
        `Primitiv "${label}": ${axis.name} = ${value} mm liegt außerhalb der Box ` +
          `(${axis.name} von ${axis.min} bis ${axis.max} mm).`,
      );
    }
  }
  return details;
}

/**
 * Prüft, dass jede Koordinate innerhalb der deklarierten Box liegt.
 *
 * Für Pfade ist das konservativ korrekt, ohne die Kurven auszurechnen: eine Bezierkurve verlässt
 * die konvexe Hülle ihrer Kontrollpunkte nie. Liegen alle Kontrollpunkte in der Box, liegt die
 * gezeichnete Kurve garantiert darin. Die Prüfung kann eine zu kleine Box melden, die geometrisch
 * gerade noch passt — sie kann eine Überschreitung nicht durchlassen. Das ist für ein
 * Autorengate die richtige Richtung. Beides gilt nur unter der Kommandobeschränkung aus
 * `checkCommands`; mit `A`, `S` oder `T` wäre die Aussage falsch statt konservativ.
 *
 * Für Nicht-Pfad-Primitive gilt zusätzlich: enthält die Definition **keinen** Pfad, ist ihre
 * Hülle vollständig berechenbar, und die Box muss ihr gleichen. Eine größere Box wäre dort eine
 * unnötige Zusicherung, die das Clipping-Gate strenger macht als die Geometrie es verlangt. Bei
 * gemischten Definitionen ist Gleichheit unerfüllbar (die Box muss auch den Pfad fassen) — dort
 * bleibt es bei der Enthaltung.
 *
 * Text bekommt in dieser Gleichheitsprüfung nie eine Stimme (siehe `measurableOf`): seine Box ist
 * eine Zusicherung des Autors, keine Messung, und Gleichheit wäre dort unerfüllbar verlangt oder
 * bedeutungslos erfüllt — je nachdem, ob boxMm zufällig mit der Piktogramm-Box übereinstimmt. Für
 * Text gilt deshalb, wie für Pfade, nur Enthaltung: geprüft über `textsOf`, unabhängig von
 * `measurable`.
 */
export function checkBox(definition: PictogramDefinition): PictogramIssue[] {
  const issues: PictogramIssue[] = [];
  const issue = (detail: string): void => {
    issues.push({
      gate: 'box',
      pictogramId: definition.id,
      variant: definition.variant,
      detail,
    });
  };

  const geometryProblems = boxGeometryProblems(definition.box);
  for (const problem of geometryProblems) issue(`Ungültige Piktogramm-Box: ${problem}`);
  if (geometryProblems.length > 0) return issues;

  const axes = axesOf(definition.box);

  for (const path of pathsOf(definition.primitives)) {
    if (path.transform !== undefined) {
      issue(
        'Pfad-Primitive innerhalb einer PictogramDefinition dürfen keine Transformation ' +
          'tragen; ihre Box wird aus den geschriebenen Pfadkoordinaten geprüft.',
      );
      continue;
    }
    const { commands, problems } = tokenizePath(path.d);
    // Einen Pfad, den das Kommando-Gate ablehnt, hier nicht zusätzlich bewerten: seine
    // Kommandos sind nicht vollständig zerlegbar, und ein zweiter Befund zum selben Fehler
    // hilft dem Autor nicht.
    if (problems.length > 0) continue;
    for (const command of commands) {
      for (const [value, axis] of coordinatesOf(command, axes)) {
        if (!within(value, axis)) {
          issue(
            `Kommando "${command.command}": ${axis.name} = ${value} mm liegt außerhalb der ` +
              `Box (${axis.name} von ${axis.min} bis ${axis.max} mm).`,
          );
        }
      }
    }
  }

  const measurable = measurableOf(definition.primitives);
  for (const primitive of measurable) {
    for (const detail of containmentDetails(primitive.type, boundsOfMm(primitive), axes)) {
      issue(detail);
    }
  }

  // Text-Enthaltung, unabhängig von `measurable`: `textsOf` statt der Box-Gleichheitsprüfung
  // unten, weil `boundsOfMm` für Text nur die deklarierte `boxMm` zurückgibt (siehe
  // `measurableOf`) — dieselbe Prüflogik wie oben (`containmentDetails`), aber strukturell
  // getrennt von der Sammlung, die in die Gleichheitsprüfung einfließt.
  for (const text of textsOf(definition.primitives)) {
    // `boxMm` ist bei Text eine Zusicherung des Autors, keine Messung — anders als bei
    // `definition.box` oben lief sie nie durch `boxGeometryProblems`. Ein `widthMm: -5` vertauscht
    // in `boundsOfMm` (bzw. hier direkt in `containmentDetails` über die min/max-Auswertung) still
    // min und max und ergibt eine KLEINERE Hülle: Enthaltung würde dadurch schwächer geprüft statt
    // gemeldet — derselbe Fehlermodus, den `rect` an derselben Stelle als `invalid-geometry`
    // bekommt (`viewbox-gate.ts`). Dieselbe Funktion wie bei `definition.box`, kein neuer Begriff.
    const textGeometryProblems = boxGeometryProblems(text.boxMm);
    for (const problem of textGeometryProblems) {
      issue(`Ungültige Textbox von "${text.content}": ${problem}`);
    }
    if (textGeometryProblems.length > 0) continue;

    // Text erlaubt am Typ eine Transformation (`transform.rotate` ist an `checkViewBox` und
    // beiden Renderern belegt), aber `boundsOfMm` lehnt jede Transformation an Text ab (siehe
    // dort) — ein roher Wurf statt eines Befunds, dem Grundsatz dieser Datei entgegen. Analog zum
    // transformierten Pfad oben: gemeldet statt geworfen, und `boundsOfMm` wird für diesen Fall
    // gar nicht erst aufgerufen.
    if (text.transform !== undefined) {
      issue(
        `Textprimitiv "${text.content}": Eine Transformation an Text innerhalb einer ` +
          'PictogramDefinition wird von diesem Gate nicht unterstützt; die Enthaltung wird aus ' +
          'der unverschobenen boxMm geprüft.',
      );
      continue;
    }

    for (const detail of containmentDetails(text.type, boundsOfMm(text), axes)) {
      issue(detail);
    }
  }

  if (measurable.length > 0 && !hasPath(definition.primitives) && !hasText(definition.primitives)) {
    const hull = measurable.map(boundsOfMm).reduce<BoundsMm>(
      (acc, next) => ({
        minX: Math.min(acc.minX, next.minX),
        minY: Math.min(acc.minY, next.minY),
        maxX: Math.max(acc.maxX, next.maxX),
        maxY: Math.max(acc.maxY, next.maxY),
      }),
      { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity },
    );
    const equal: Array<[string, number, number]> = [
      ['x', hull.minX, axes.x.min],
      ['x + width', hull.maxX, axes.x.max],
      ['y', hull.minY, axes.y.min],
      ['y + height', hull.maxY, axes.y.max],
    ];
    for (const [name, actual, declared] of equal) {
      if (!unitsEqual(mmToUnits(actual), mmToUnits(declared))) {
        issue(
          `Ohne Pfade ist die Hülle vollständig berechenbar: ${name} ist ${actual} mm, ` +
            `die Box deklariert ${declared} mm.`,
        );
      }
    }
  }

  return issues;
}

/**
 * Prüft, ob jedes Textprimitiv bei jeder angegebenen Rendergröße den effektiven Mindestschriftgrad
 * `MINIMUM_TEXT_RENDER_PX` erreicht (siehe dort für die visuelle Herleitung des Werts).
 *
 * Der Befund ist eine andere Aussageart als `command`, `box` und `clipping`: die drei anderen
 * Gates melden einen Vertragsbruch der Definition selbst — falsche Koordinaten, eine Box, die den
 * Körper verlässt. Eine Unterschreitung hier ist kein Fehler der Definition; „HRT" bei 10 mm ist
 * bei jeder Rendergröße dieselbe korrekte Definition. Der Befund sagt aus, dass dieses Zeichen bei
 * dieser konkreten Rendergröße eine dokumentierte untere Einsatzgrenze hat — eine fachliche
 * Aussage über das taktische Zeichen, keine technische Ausrede für ein kaputtes Rendering.
 *
 * Nimmt bewusst die Liste der Rendergrößen entgegen statt eine feste Größenreihe zu unterstellen:
 * `core` kennt die sechs Snapshotgrößen der Mehrgrößenregression nicht — die liegt in `catalog`
 * (Task 9) — und soll sie auch nicht kennen, um die Paketrichtung `catalog → core` nicht umzukehren.
 *
 * Die jeweilige Definitions-ViewBox ist Teil des Vertrags. Der gemeinsame Rastervertrag validiert
 * sie hier vor der Textberechnung und hält deren Pixelbreite an der Renderer-Schnittstelle fest.
 */
export function checkTextLegibility(
  definition: PictogramDefinition,
  renderSizesPx: readonly number[],
): PictogramIssue[] {
  const issues: PictogramIssue[] = [];
  for (const text of textsOf(definition.primitives)) {
    for (const renderPx of renderSizesPx) {
      const { widthPx } = rasterDimensionsForWidth(definition.viewBox, renderPx);
      // Unterhalb seiner deklarierten Einsatzgrenze beansprucht der Lauf keine Lesbarkeit; dort
      // gibt es nichts zu melden. Ohne diesen Zweig wäre kein Kürzel aus Anhang J je befundfrei:
      // die 16-px-Snapshotgröße verlangt 16 mm Schriftgrad, das breiteste Kürzel misst 10,3 mm.
      if (text.minRenderPx !== undefined && renderPx < text.minRenderPx) continue;
      const effectivePx = effectiveTextPx(text.sizeMm, widthPx, definition.viewBox.width);
      if (effectivePx >= MINIMUM_TEXT_RENDER_PX) continue;
      issues.push({
        gate: 'text-legibility',
        pictogramId: definition.id,
        variant: definition.variant,
        detail:
          `Zeichen "${definition.id}", Text "${text.content}": bei ${renderPx} px Rendergröße ` +
          `beträgt der effektive Schriftgrad ${effectivePx.toFixed(1)} px und liegt unter der ` +
          `dokumentierten Lesbarkeitsgrenze von ${MINIMUM_TEXT_RENDER_PX} px ` +
          `(MINIMUM_TEXT_RENDER_PX) — eine dokumentierte untere Einsatzgrenze dieses Zeichens bei ` +
          `dieser Rendergröße, kein Darstellungsfehler.`,
      });
    }
  }
  return issues;
}

/**
 * Die Körperfläche dieses Grundzeichens ist nicht vermessen. Eine eigene Klasse und keine
 * Textprüfung: `checkPictogram` fängt genau diesen Fall und reicht jeden anderen Fehler weiter,
 * damit ein Programmierfehler in `checkClipping` nicht als harmloser Piktogramm-Befund erscheint.
 */
export class BodyNotMeasuredError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'BodyNotMeasuredError';
  }
}

/** Die vier Ecken der zugesicherten, achsparallelen Piktogramm-Box. */
function cornersOf(box: PictogramBox): readonly Point[] {
  return [
    [box.xMm, box.yMm],
    [box.xMm + box.widthMm, box.yMm],
    [box.xMm + box.widthMm, box.yMm + box.heightMm],
    [box.xMm, box.yMm + box.heightMm],
  ];
}

interface PictogramStrokeWidths {
  widths: number[];
  invalid: number[];
  foreignRoles: PrimitiveRole[];
}

/**
 * Liest alle aktiven Piktogramm-Blätter und löst ihren Stil genau wie die Renderer feldweise auf.
 * Die Definitionswurzel erbt implizit `pictogram`, weil `compose()` dieselben Primitive unter
 * genau eine Gruppe dieser Rolle hängt. Rollenlose Gruppen und Blätter erben sie deshalb bis zum
 * Blatt. Eine explizite andere Rolle wird dagegen als Vertragsbruch gesammelt: sie würde im
 * Renderer Kappen-, Join- oder Dash-Semantik außerhalb des kleinen Piktogrammvertrags aktivieren.
 *
 * SVG und Canvas begrenzen mehrsegmentige Piktogramm-Striche auf Butt-Kappen und Round-Joins;
 * einzelne Linien haben bereits standardmäßig Butt-Kappen und keine Joins. Daher reicht die
 * halbe Strichstärke als konservative Ausdehnung in jede Achsenrichtung aus. Nicht-
 * Piktogramm-Geometrie fällt bewusst nicht in diesen kleinen Strichvertrag.
 *
 * Text trägt zu keiner Strichbreite bei, unabhängig von seinem `style.stroke`: `svg.ts` gibt
 * `<text>` immer mit `fillOnly: true` aus, und `canvas.ts` kennt für Text kein `strokeText()` —
 * ein gesetzter Strich wird also nie sichtbar. Ihn hier trotzdem einzurechnen würde `halfStroke`
 * unten aufblähen und die gesamte Piktogramm-Box strenger gegen den Körper prüfen, als tatsächlich
 * gerendert wird — genau der Fehlermodus, den dieser Vertrag ausschließen soll.
 */
function pictogramStrokeWidths(
  primitives: readonly Primitive[],
  inheritedStyle?: Style,
  inheritedRole: Primitive['role'] = 'pictogram',
): PictogramStrokeWidths {
  const widths: number[] = [];
  const invalid: number[] = [];
  const foreignRoles: PrimitiveRole[] = [];
  for (const primitive of primitives) {
    const style = mergeStyle(primitive.style, inheritedStyle);
    const role = primitive.role ?? inheritedRole;
    if (primitive.role !== undefined && primitive.role !== 'pictogram') {
      foreignRoles.push(primitive.role);
    }
    if (primitive.type === 'group') {
      const nested = pictogramStrokeWidths(primitive.children, style, role);
      widths.push(...nested.widths);
      invalid.push(...nested.invalid);
      foreignRoles.push(...nested.foreignRoles);
      continue;
    }
    if (primitive.type === 'text') continue;
    if (role !== 'pictogram') continue;
    if (style?.stroke === undefined || style.stroke === 'none') continue;
    const width = style.strokeWidth ?? DEFAULT_STROKE_WIDTH_MM;
    if (!Number.isFinite(width) || width < 0) invalid.push(width);
    else widths.push(width);
  }
  return { widths, invalid, foreignRoles };
}

function finite(values: readonly number[]): boolean {
  return values.every((value) => Number.isFinite(value));
}

function invalidBody(body: Primitive, detail: string): Error {
  return new Error(`pictogram-gate: Ungültige Körpergeometrie "${body.type}": ${detail}`);
}

function notMeasured(
  definition: PictogramDefinition,
  body: Primitive,
  detail: string,
): BodyNotMeasuredError {
  return new BodyNotMeasuredError(
    `pictogram-gate: Die Körperfläche von "${body.type}" für "${definition.id}" ist nicht ` +
      `vermessen — ${detail}`,
  );
}

/**
 * Bringt einen Weltpunkt in das lokale Koordinatensystem des Körpers zurück. Der aktuelle IR-
 * Vertrag belegt Translation ausschließlich an Gruppen; ein Körper ist ein Blatt und darf sie
 * deshalb nicht tragen. Rotation ist dagegen am Personenkörper belegt und wird exakt invertiert.
 */
function toBodyCoordinates(
  point: Point,
  transform: Transform | undefined,
  body: Primitive,
  definition: PictogramDefinition,
): Point {
  if (transform?.translate !== undefined) {
    throw notMeasured(
      definition,
      body,
      'transform.translate ist an einem Körperblatt nicht unterstützt.',
    );
  }
  const rotate = transform?.rotate;
  if (rotate === undefined) return point;
  if (!finite([rotate.angle, rotate.cx, rotate.cy])) {
    throw invalidBody(body, 'Rotationswinkel und Rotationszentrum müssen endlich sein.');
  }

  const radians = (-rotate.angle * Math.PI) / 180;
  const dx = point[0] - rotate.cx;
  const dy = point[1] - rotate.cy;
  return [
    rotate.cx + dx * Math.cos(radians) - dy * Math.sin(radians),
    rotate.cy + dx * Math.sin(radians) + dy * Math.cos(radians),
  ];
}

/** Vorzeichenbehafteter senkrechter Abstand eines Punkts von einer gerichteten Kante. */
function edgeDistanceMm(point: Point, from: Point, to: Point): number {
  const dx = to[0] - from[0];
  const dy = to[1] - from[1];
  const length = Math.hypot(dx, dy);
  if (unitsEqual(mmToUnits(length), 0)) {
    throw new Error('pictogram-gate: Polygonkante besitzt keine messbare Länge.');
  }
  return (dx * (point[1] - from[1]) - dy * (point[0] - from[0])) / length;
}

function signOutsideTolerance(valueMm: number): -1 | 0 | 1 {
  if (unitsEqual(mmToUnits(valueMm), 0)) return 0;
  return valueMm < 0 ? -1 : 1;
}

/**
 * Liefert die gemeinsame Orientierung einer konvex und in Randreihenfolge notierten Fläche.
 * Die stärkere Prüfung "alle übrigen Punkte liegen auf derselben Seite jeder Kante" lehnt neben
 * Konkavität auch eine Stern-/Selbstschnitt-Reihenfolge ab. Damit darf die anschließende
 * Eckprüfung die Konvexität wirklich voraussetzen.
 */
function convexOrientation(
  points: readonly Point[],
  definition: PictogramDefinition,
  body: Primitive,
): -1 | 1 {
  let orientation: -1 | 0 | 1 = 0;
  for (let edgeIndex = 0; edgeIndex < points.length; edgeIndex += 1) {
    const from = points[edgeIndex];
    const to = points[(edgeIndex + 1) % points.length];
    if (from === undefined || to === undefined) continue;

    for (const point of points) {
      let side: -1 | 0 | 1;
      try {
        side = signOutsideTolerance(edgeDistanceMm(point, from, to));
      } catch {
        throw notMeasured(
          definition,
          body,
          'das geschlossene Polygon ist wegen einer entarteten Kante nicht als Fläche messbar.',
        );
      }
      if (side === 0) continue;
      if (orientation === 0) orientation = side;
      else if (side !== orientation) {
        throw notMeasured(
          definition,
          body,
          'nur einfache konvexe Polygone sind als Körperfläche unterstützt.',
        );
      }
    }
  }
  if (orientation === 0) {
    throw notMeasured(
      definition,
      body,
      'das geschlossene Polygon ist entartet und schließt keine Fläche ein.',
    );
  }
  return orientation;
}

function samePoint(left: Point, right: Point): boolean {
  return (
    unitsEqual(mmToUnits(left[0]), mmToUnits(right[0])) &&
    unitsEqual(mmToUnits(left[1]), mmToUnits(right[1]))
  );
}

/** Ein einfacher Polygonumlauf darf keinen Eckpunkt ein zweites Mal besuchen. */
function assertUniquePolygonPoints(
  points: readonly Point[],
  definition: PictogramDefinition,
  body: Primitive,
): void {
  for (let left = 0; left < points.length; left += 1) {
    for (let right = left + 1; right < points.length; right += 1) {
      const leftPoint = points[left];
      const rightPoint = points[right];
      if (leftPoint !== undefined && rightPoint !== undefined && samePoint(leftPoint, rightPoint)) {
        throw notMeasured(
          definition,
          body,
          `ein einfacher Polygonumlauf darf den Punkt ${leftPoint[0]},${leftPoint[1]} nicht ` +
            'mehrfach enthalten.',
        );
      }
    }
  }
}

/** Baut genau für die heute belegten konvexen Körperformen einen Punkt-in-Fläche-Test. */
function containsPoint(
  definition: PictogramDefinition,
  body: Primitive,
): (point: Point) => boolean {
  if (body.type === 'rect') {
    if (!finite([body.x, body.y, body.width, body.height]) || body.width <= 0 || body.height <= 0) {
      throw invalidBody(body, 'x, y, Breite und Höhe müssen endlich; Breite und Höhe positiv sein.');
    }
    if (body.rx !== undefined) {
      if (!Number.isFinite(body.rx) || body.rx < 0) {
        throw invalidBody(body, 'Der Eckenradius muss endlich und nichtnegativ sein.');
      }
      if (body.rx > 0) {
        throw notMeasured(
          definition,
          body,
          'gerundete Rechtecke benötigen ein eigenes Flächenmodell.',
        );
      }
    }
    const axes = axesOf({ xMm: body.x, yMm: body.y, widthMm: body.width, heightMm: body.height });
    return (point) => {
      const local = toBodyCoordinates(point, body.transform, body, definition);
      return within(local[0], axes.x) && within(local[1], axes.y);
    };
  }

  if (body.type === 'circle') {
    if (!finite([body.cx, body.cy, body.r]) || body.r <= 0) {
      throw invalidBody(body, 'Mittelpunkt und Radius müssen endlich; der Radius positiv sein.');
    }
    return (point) => {
      const local = toBodyCoordinates(point, body.transform, body, definition);
      const overflowMm = Math.hypot(local[0] - body.cx, local[1] - body.cy) - body.r;
      return overflowMm <= 0 || unitsEqual(mmToUnits(overflowMm), 0);
    };
  }

  if (body.type === 'polyline') {
    if (body.closed !== true) {
      throw notMeasured(
        definition,
        body,
        'eine offene Polylinie schließt keine Körperfläche ein.',
      );
    }
    if (body.points.length < 3) {
      throw notMeasured(
        definition,
        body,
        'ein Polygon benötigt mindestens drei Punkte.',
      );
    }
    if (!body.points.every(([x, y]) => finite([x, y]))) {
      throw invalidBody(body, 'Alle Polygonpunkte müssen endlich sein.');
    }
    assertUniquePolygonPoints(body.points, definition, body);
    // Transformvalidierung geschieht auch ohne Prüfecke sofort und nicht erst im Closure-Aufruf.
    toBodyCoordinates(body.points[0] as Point, body.transform, body, definition);
    const orientation = convexOrientation(body.points, definition, body);
    return (point) => {
      const local = toBodyCoordinates(point, body.transform, body, definition);
      for (let index = 0; index < body.points.length; index += 1) {
        const from = body.points[index];
        const to = body.points[(index + 1) % body.points.length];
        if (from === undefined || to === undefined) continue;
        const side = signOutsideTolerance(edgeDistanceMm(local, from, to));
        if (side !== 0 && side !== orientation) return false;
      }
      return true;
    };
  }

  throw notMeasured(
    definition,
    body,
    'unterstützt sind achsparallele oder gedrehte Rechtecke, Kreise und geschlossene konvexe Polygone.',
  );
}

/**
 * Prüft, dass die deklarierte Box vollständig innerhalb der Körperfläche des **unverschobenen**
 * Grundzeichens liegt.
 *
 * Unverschoben, weil die Referenz belegt, dass das Piktogramm der Körpermitte folgt: `C.1.1`
 * verschiebt Körper und Piktogramm um dieselben 3 mm (Entscheidungsnotiz vom 4. August 2026,
 * Abschnitt 8). Die Lage der Box relativ zum Körper ist damit invariant gegenüber der
 * Komposition — die Prüfung braucht keine `SymbolSpec` und läuft einmal je
 * Piktogramm-Grundzeichen-Paar, nicht je Komposition.
 *
 * Alle heute katalogisierten Körperflächen sind konvex. Deshalb ist die vollständige Box genau
 * dann enthalten, wenn ihre vier Ecken enthalten sind. Rechtecke werden in ihrem lokalen
 * Koordinatensystem geprüft (damit auch das gedrehte Quadrat der Person), Kreise analytisch und
 * geschlossene konvexe Polygone gegen ihre gerichteten Kanten. Eine Prüfung nur gegen die
 * achsparallele Hülle wäre insbesondere bei Dreiecken und dem Personendiamanten falsch.
 *
 * Nimmt das Körper-Primitiv, nicht den `SymbolKind`: die Körpergeometrie liegt in `catalog`, und
 * die Paketrichtung ist `catalog → core`. Der Aufrufer holt sie aus `baseDrawing(kind)`.
 *
 * Aktive Piktogramm-Striche vergrößern die zu prüfende Autorenbox konservativ um die halbe
 * effektive Strichstärke. Das ergänzt den absichtlich koordinatenbasierten Pfadvertrag von
 * `checkBox()`, statt ihn umzudeuten: Die Koordinaten dürfen auf der Boxkante liegen, aber die
 * tatsächlich sichtbare Tinte darf die Körperfläche nicht verlassen.
 */
export function checkClipping(
  definition: PictogramDefinition,
  body: Primitive,
): PictogramIssue[] {
  const geometryProblems = boxGeometryProblems(definition.box);
  if (geometryProblems.length > 0) {
    return geometryProblems.map((problem) => ({
      gate: 'clipping',
      pictogramId: definition.id,
      variant: definition.variant,
      detail: `Ungültige Piktogramm-Box: ${problem}`,
    }));
  }
  const contains = containsPoint(definition, body);
  const issues: PictogramIssue[] = [];
  const strokes = pictogramStrokeWidths(definition.primitives);
  for (const role of new Set(strokes.foreignRoles)) {
    issues.push({
      gate: 'clipping',
      pictogramId: definition.id,
      variant: definition.variant,
      detail:
        `Piktogrammdefinition: Explizite Fremdrolle "${role}" ist unzulässig; ` +
        `compose() verleiht der Definitionswurzel die Rolle "pictogram", deren ` +
        `konservativer Strichvertrag hier geprüft wird.`,
    });
  }
  for (const width of strokes.invalid) {
    issues.push({
      gate: 'clipping',
      pictogramId: definition.id,
      variant: definition.variant,
      detail: `Piktogramm-Blatt: Strichstärke muss endlich und nichtnegativ sein (ist ${String(width)} mm).`,
    });
  }
  if (strokes.foreignRoles.length > 0 || strokes.invalid.length > 0) return issues;

  const halfStroke = Math.max(0, ...strokes.widths) / 2;
  const visibleBox: PictogramBox = {
    xMm: definition.box.xMm - halfStroke,
    yMm: definition.box.yMm - halfStroke,
    widthMm: definition.box.widthMm + 2 * halfStroke,
    heightMm: definition.box.heightMm + 2 * halfStroke,
  };
  for (const [x, y] of cornersOf(visibleBox)) {
    if (!contains([x, y])) {
      issues.push({
        gate: 'clipping',
        pictogramId: definition.id,
        variant: definition.variant,
        detail: `Sichtbare Box-Ecke (${x}, ${y}) mm liegt außerhalb der Körperfläche "${body.type}".`,
      });
    }
  }

  // Text hat keine messbare Fläche (`boundsOfMm` gibt für Text nur `boxMm` zurück, siehe
  // `measurableOf`) — geprüft wird deshalb die deklarierte Box gegen den Körper, nicht die
  // Glyphen. Ohne halbe Strichbreite: Text wird gefüllt, nicht gestrichen (siehe
  // `pictogramStrokeWidths` oben), seine sichtbare Ausdehnung endet exakt an `boxMm`. Geprüft wird
  // jede Textbox einzeln statt nur über die bereits geprüfte Gesamt-`visibleBox`: `checkBox`
  // erzwingt zwar, dass jede Textbox innerhalb von `definition.box` liegt, aber diese Funktion
  // läuft auch unabhängig von `checkBox` (siehe die Tests dazu) — die Garantie soll hier lokal
  // stehen, nicht nur aus der Zusammensetzung der beiden Gates folgen.
  for (const text of textsOf(definition.primitives)) {
    for (const [x, y] of cornersOf(text.boxMm)) {
      if (!contains([x, y])) {
        issues.push({
          gate: 'clipping',
          pictogramId: definition.id,
          variant: definition.variant,
          detail:
            `Textbox von "${text.content}": Ecke (${x}, ${y}) mm liegt außerhalb der ` +
            `Körperfläche "${body.type}".`,
        });
      }
    }
  }

  return issues;
}

/**
 * Die drei Gates zusammen — das Kriterium, das für Piktogramme an die Stelle des strukturell
 * unerreichbaren Fingerprint-Gates tritt (Spec Abschnitt 7). Reihenfolge: Kommando, Box,
 * Clipping, damit der Autor die Ursache vor ihren Folgen liest.
 *
 * `checkClipping` wirft `BodyNotMeasuredError` für eine nicht vermessene Körperform (etwa eine
 * offene oder konkave Polylinie) — richtig für einen direkten Aufrufer, der genau ein
 * Piktogramm-Grundzeichen-Paar prüft. Hier würde der Wurf aber die bereits gesammelten Kommando-
 * und Box-Befunde verwerfen und damit dem Grundsatz dieser Datei widersprechen: „Listen von
 * Befunden statt Ausnahmen, ein Autor soll alle Verstöße auf einmal sehen." Genau dieser eine
 * Fall wird deshalb gefangen und als eigener `clipping`-Befund gemeldet — sonst verlöre, wer
 * `checkPictogram` über mehrere Grundzeichen laufen lässt, beim ersten Polygon jede Kommando- und
 * Box-Rückmeldung des gesamten Durchlaufs.
 *
 * Jeder andere Fehler wird durchgereicht, nicht eingesammelt: ein Programmierfehler in
 * `checkClipping` — etwa ein künftiger Zugriff auf ein noch nicht unterstütztes Feld einer neuen
 * Körperform — soll sichtbar scheitern, nicht als harmloser Piktogramm-Befund erscheinen. Ein
 * still falsches Ergebnis ist schwerer zu bemerken als ein Fehler; dasselbe Prinzip wie `shiftY`,
 * das Pfade ablehnt, und die Gruppendrehung in `boundsOfMm`, die gedrehte Gruppen ablehnt.
 */
export function checkPictogram(
  definition: PictogramDefinition,
  body: Primitive,
): PictogramIssue[] {
  const issues = [...checkCommands(definition), ...checkBox(definition)];
  try {
    issues.push(...checkClipping(definition, body));
  } catch (error) {
    if (!(error instanceof BodyNotMeasuredError)) throw error;
    issues.push({
      gate: 'clipping',
      pictogramId: definition.id,
      variant: definition.variant,
      detail: error.message,
    });
  }
  return issues;
}
