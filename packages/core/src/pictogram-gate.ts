import { mmToUnits, unitsEqual, type PictogramBox, type PictogramDefinition, type Primitive } from '@einsatzzeichen/schema';
import { boundsOfMm, type BoundsMm } from './bounds.js';
import { tokenizePath, type PathCommand } from './path-commands.js';

/**
 * Ein Befund eines der drei Piktogramm-Gates. Eine gemeinsame Form statt dreier eigener: das
 * Coverage-Gate und die Katalogtests geben sie einheitlich aus, und ein viertes Gate kostet
 * keine Änderung an der Rückgabeform — dasselbe Muster wie `CoverageViolation` in `catalog`.
 *
 * Listen von Befunden statt Ausnahmen, wie `validateSpec`: ein Autor will alle Verstöße seines
 * Piktogramms auf einmal sehen, nicht den ersten.
 */
export interface PictogramIssue {
  gate: 'command' | 'box' | 'clipping';
  pictogramId: string;
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
 * Prüft, dass jeder `d`-String der Definition ausschließlich die sieben zugelassenen absoluten
 * Kommandos verwendet (Spec Abschnitt 5). Diese Beschränkung ist nicht stilistisch: sie ist die
 * Bedingung, unter der das Box-Gate beweisbar konservativ ist. Mit `A`, `S` oder `T` wäre es
 * nicht konservativ, sondern falsch.
 */
export function checkCommands(definition: PictogramDefinition): PictogramIssue[] {
  const issues: PictogramIssue[] = [];
  for (const path of pathsOf(definition.primitives)) {
    for (const problem of tokenizePath(path.d).problems) {
      issues.push({ gate: 'command', pictogramId: definition.id, detail: problem });
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

/**
 * Alle Primitive mit berechenbarer Hülle — also alles außer Pfaden, aus Gruppen herausgezogen.
 *
 * Wirft für eine Gruppe mit `transform`: `boundsOfMm` auf einem herausgezogenen Kind liest dessen
 * Rohkoordinaten, die Transformation der Elterngruppe wäre verloren, und die Box-Prüfung liefe
 * gegen die falschen Zahlen. In D.0 trägt keine Definition eine transformierte Gruppe — genau
 * deshalb steht der Fehler hier, bevor es in D.1 still falsch werden kann.
 */
function measurableOf(primitives: readonly Primitive[]): Primitive[] {
  const measurable: Primitive[] = [];
  for (const primitive of primitives) {
    if (primitive.type === 'group') {
      if (primitive.transform !== undefined) {
        throw new Error(
          'pictogram-gate: Eine Gruppe innerhalb einer PictogramDefinition darf keine ' +
            'Transformation tragen — die Verschiebung der Komposition setzt compose() außen ' +
            'auf, und eine innere würde die Box-Prüfung gegen die Rohkoordinaten laufen lassen.',
        );
      }
      measurable.push(...measurableOf(primitive.children));
    } else if (primitive.type !== 'path') {
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
 */
export function checkBox(definition: PictogramDefinition): PictogramIssue[] {
  const issues: PictogramIssue[] = [];
  const axes = axesOf(definition.box);
  const issue = (detail: string): void => {
    issues.push({ gate: 'box', pictogramId: definition.id, detail });
  };

  for (const path of pathsOf(definition.primitives)) {
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
    const bounds = boundsOfMm(primitive);
    const checks: Array<[number, Axis]> = [
      [bounds.minX, axes.x],
      [bounds.maxX, axes.x],
      [bounds.minY, axes.y],
      [bounds.maxY, axes.y],
    ];
    for (const [value, axis] of checks) {
      if (!within(value, axis)) {
        issue(
          `Primitiv "${primitive.type}": ${axis.name} = ${value} mm liegt außerhalb der Box ` +
            `(${axis.name} von ${axis.min} bis ${axis.max} mm).`,
        );
      }
    }
  }

  if (measurable.length > 0 && !hasPath(definition.primitives)) {
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
 * Prüft, dass die deklarierte Box vollständig innerhalb der Körperfläche des **unverschobenen**
 * Grundzeichens liegt.
 *
 * Unverschoben, weil die Referenz belegt, dass das Piktogramm der Körpermitte folgt: `C.1.1`
 * verschiebt Körper und Piktogramm um dieselben 3 mm (Entscheidungsnotiz vom 4. August 2026,
 * Abschnitt 8). Die Lage der Box relativ zum Körper ist damit invariant gegenüber der
 * Komposition — die Prüfung braucht keine `SymbolSpec` und läuft einmal je
 * Piktogramm-Grundzeichen-Paar, nicht je Komposition.
 *
 * Nur für ein achsparalleles Rechteck: dort fallen Fläche und achsparallele Hülle zusammen. Bei
 * einem Polygon (`hazard`, `measure`, `point`) oder einem gedrehten Quadrat (`person`) tun sie es
 * nicht — eine Box innerhalb der Hülle kann aus dem Dreieck ragen. Statt eine Hüllenprüfung als
 * Flächenprüfung auszugeben, lehnt das Gate diese Körperformen explizit ab, bis ihre Fläche
 * vermessen ist. Dasselbe Muster wie `circleBodyProfile` (`layout/profiles.ts`) und die
 * Gruppendrehung in `boundsOfMm`.
 *
 * Nimmt das Körper-Primitiv, nicht den `SymbolKind`: die Körpergeometrie liegt in `catalog`, und
 * die Paketrichtung ist `catalog → core`. Der Aufrufer holt sie aus `baseDrawing(kind)`.
 */
export function checkClipping(
  definition: PictogramDefinition,
  body: Primitive,
): PictogramIssue[] {
  if (body.type !== 'rect' || body.transform !== undefined) {
    throw new Error(
      `pictogram-gate: Die Körperfläche von "${body.type}"` +
        `${body.transform !== undefined ? ' mit Transformation' : ''} ist nicht vermessen — ` +
        'das Clipping-Gate prüft nur achsparallele Rechtecke, bei denen Fläche und Hülle ' +
        'zusammenfallen.',
    );
  }

  const bodyAxes = axesOf({
    xMm: body.x,
    yMm: body.y,
    widthMm: body.width,
    heightMm: body.height,
  });
  const box = axesOf(definition.box);

  const checks: Array<[string, number, Axis]> = [
    ['x', box.x.min, bodyAxes.x],
    ['x + width', box.x.max, bodyAxes.x],
    ['y', box.y.min, bodyAxes.y],
    ['y + height', box.y.max, bodyAxes.y],
  ];

  const issues: PictogramIssue[] = [];
  for (const [name, value, axis] of checks) {
    if (!within(value, axis)) {
      issues.push({
        gate: 'clipping',
        pictogramId: definition.id,
        detail:
          `Box-Kante ${name} = ${value} mm liegt außerhalb des Körpers ` +
          `(${axis.name} von ${axis.min} bis ${axis.max} mm).`,
      });
    }
  }
  return issues;
}

/**
 * Die drei Gates zusammen — das Kriterium, das für Piktogramme an die Stelle des strukturell
 * unerreichbaren Fingerprint-Gates tritt (Spec Abschnitt 7). Reihenfolge: Kommando, Box,
 * Clipping, damit der Autor die Ursache vor ihren Folgen liest.
 */
export function checkPictogram(
  definition: PictogramDefinition,
  body: Primitive,
): PictogramIssue[] {
  return [
    ...checkCommands(definition),
    ...checkBox(definition),
    ...checkClipping(definition, body),
  ];
}
