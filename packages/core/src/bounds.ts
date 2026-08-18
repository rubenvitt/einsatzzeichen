import { DEFAULT_STROKE_WIDTH_MM, type Point, type Primitive, type Rotation } from '@einsatzzeichen/schema';
import { tokenizePath } from './path-commands.js';

/** Achsparallele Hülle in Millimetern. */
export interface BoundsMm {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

const EMPTY_BOUNDS: BoundsMm = { minX: 0, minY: 0, maxX: 0, maxY: 0 };

function rotatePoint([x, y]: Point, rotate: Rotation): Point {
  const rad = (rotate.angle * Math.PI) / 180;
  const dx = x - rotate.cx;
  const dy = y - rotate.cy;
  return [
    rotate.cx + dx * Math.cos(rad) - dy * Math.sin(rad),
    rotate.cy + dx * Math.sin(rad) + dy * Math.cos(rad),
  ];
}

function rotatePoints(points: readonly Point[], rotate: Rotation | undefined): readonly Point[] {
  return rotate ? points.map((point) => rotatePoint(point, rotate)) : points;
}

function fromPoints(points: readonly Point[]): BoundsMm {
  if (points.length === 0) {
    throw new Error('bounds: fromPoints() erwartet mindestens einen Punkt.');
  }
  const xs = points.map(([x]) => x);
  const ys = points.map(([, y]) => y);
  return {
    minX: Math.min(...xs),
    minY: Math.min(...ys),
    maxX: Math.max(...xs),
    maxY: Math.max(...ys),
  };
}

/**
 * Nullstellen der Ableitung einer kubischen Bezierkoordinate im offenen Intervall (0, 1).
 * Analytisch, nicht abgetastet: B'(t) = 3[(-p0+3p1-3p2+p3)t² + 2(p0-2p1+p2)t + (-p0+p1)], also
 * eine Quadratik je Achse. Abtasten verfehlte das Extremum um einen Betrag, der von der
 * Schrittweite abhängt — bei einer Vergleichstoleranz von 0,01 Einheiten ist das der Unterschied
 * zwischen einer Messung und einer Näherung.
 */
function cubicExtremaTs(p0: number, p1: number, p2: number, p3: number): number[] {
  const a = -p0 + 3 * p1 - 3 * p2 + p3;
  const b = 2 * (p0 - 2 * p1 + p2);
  const c = -p0 + p1;
  const ts: number[] = [];
  const keep = (t: number): void => {
    if (t > 0 && t < 1) ts.push(t);
  };
  if (Math.abs(a) < 1e-12) {
    if (Math.abs(b) > 1e-12) keep(-c / b);
    return ts;
  }
  const discriminant = b * b - 4 * a * c;
  if (discriminant < 0) return ts;
  const root = Math.sqrt(discriminant);
  keep((-b + root) / (2 * a));
  keep((-b - root) / (2 * a));
  return ts;
}

function cubicAt(p0: number, p1: number, p2: number, p3: number, t: number): number {
  const mt = 1 - t;
  return mt * mt * mt * p0 + 3 * mt * mt * t * p1 + 3 * mt * t * t * p2 + t * t * t * p3;
}

/**
 * Punkte, die die Hülle eines `d`-Strings bestimmen: alle Segmentendpunkte plus die
 * analytischen Extrema jeder Kubik. `Q` wird exakt in eine Kubik überführt
 * (C1 = P0 + ⅔(Q−P0), C2 = P3 + ⅔(Q−P3)) statt genähert — die quadratische Bezierkurve ist eine
 * kubische mit zusammenfallenden Kontrollpunkten, die Umrechnung ist verlustfrei.
 *
 * Wirft bei jedem Befund von `tokenizePath`. Ein unvollständig zerlegter Pfad lieferte eine
 * Hülle, die kleiner ist als die gezeichnete Form — genau der stille Ausfall, den die
 * `translate`- und Drehungszweige dieser Datei durch Ablehnen vermeiden.
 */
function pathPoints(d: string): Point[] {
  const { commands, problems } = tokenizePath(d);
  if (problems.length > 0) {
    throw new Error(`boundsOfMm: Pfaddaten nicht zerlegbar — ${problems.join(' ')}`);
  }
  const points: Point[] = [];
  let current: Point = [0, 0];
  let subpathStart: Point = [0, 0];

  const addCubic = (c1: Point, c2: Point, end: Point): void => {
    points.push(current, end);
    for (const axis of [0, 1] as const) {
      for (const t of cubicExtremaTs(current[axis], c1[axis], c2[axis], end[axis])) {
        points.push([
          cubicAt(current[0], c1[0], c2[0], end[0], t),
          cubicAt(current[1], c1[1], c2[1], end[1], t),
        ]);
      }
    }
  };

  for (const { command, numbers } of commands) {
    const n = (index: number): number => numbers[index] ?? 0;
    switch (command) {
      case 'M':
        current = [n(0), n(1)];
        subpathStart = current;
        points.push(current);
        break;
      case 'L':
        current = [n(0), n(1)];
        points.push(current);
        break;
      case 'H':
        current = [n(0), current[1]];
        points.push(current);
        break;
      case 'V':
        current = [current[0], n(0)];
        points.push(current);
        break;
      case 'C': {
        const end: Point = [n(4), n(5)];
        addCubic([n(0), n(1)], [n(2), n(3)], end);
        current = end;
        break;
      }
      case 'Q': {
        const control: Point = [n(0), n(1)];
        const end: Point = [n(2), n(3)];
        const third = 2 / 3;
        addCubic(
          [current[0] + third * (control[0] - current[0]), current[1] + third * (control[1] - current[1])],
          [end[0] + third * (control[0] - end[0]), end[1] + third * (control[1] - end[1])],
          end,
        );
        current = end;
        break;
      }
      case 'Z':
        current = subpathStart;
        points.push(current);
        break;
    }
  }
  return points;
}

function merge(list: readonly BoundsMm[]): BoundsMm {
  if (list.length === 0) {
    throw new Error('bounds: merge() erwartet mindestens eine Hülle.');
  }
  return {
    minX: Math.min(...list.map((b) => b.minX)),
    minY: Math.min(...list.map((b) => b.minY)),
    maxX: Math.max(...list.map((b) => b.maxX)),
    maxY: Math.max(...list.map((b) => b.maxY)),
  };
}

/**
 * Hülle eines Primitivs in Millimetern, oder `undefined`, wenn das Primitiv keine vergleichbare
 * Ausdehnung hat. Seit dem Pfadzweig (18. August 2026) trifft das nur noch auf eine Gruppe **ohne
 * Kinder** zu — auch verschachtelt. `undefined` wird strukturell weitergereicht, nicht anhand der
 * resultierenden Zahlenwerte erkannt: so wird eine echte Null-Ausdehnung (z. B. ein entartetes
 * Rechteck der Breite 0 bei x=0) nie mit "keine Ausdehnung" verwechselt — nur die Struktur
 * entscheidet, nie der berechnete Wert.
 *
 * **Pfade tragen seit LFH-424 eine berechnete Hülle.** Bis dahin lieferten sie `undefined`, weil
 * Piktogramme nicht geometrisch verglichen werden. Mit `area`, `vehicle-land`, `vehicle-air`,
 * `vehicle-water` und `spontaneous-helper` steht die Kurvenkontur jetzt als **Körper** im Katalog,
 * und ohne Hülle setzte `compose()` deren Beschriftungs- und Fußzone auf y = 0 statt an die
 * Körperunterkante — still und von keinem Gate gemeldet.
 *
 * Drehung wird auf die formdefinierenden Punkte jedes Primitivs angewendet, nicht auf die
 * Ecken seiner (unrotierten) achsparallelen Hülle — sonst wäre das Ergebnis nur für `rect`
 * exakt und für `circle`, `line` und `polyline` zu groß.
 *
 * Eine Gruppe mit `transform.translate` verschiebt die Hülle ihrer Kinder; ist diese nicht
 * vergleichbar, bleibt sie es auch nach der Verschiebung.
 */
function rawBoundsOfMm(primitive: Primitive): BoundsMm | undefined {
  const rotate = primitive.transform?.rotate;
  const translate = primitive.transform?.translate;
  if (translate && primitive.type !== 'group') {
    // Dasselbe Muster wie die Gruppendrehung unten: `translate` ist nur an Gruppen belegt
    // (compose() umschließt die Piktogramme mit genau einer). An einem Einzelprimitiv würde
    // diese Hüllberechnung es still ignorieren, während beide Renderer es anwenden — aus
    // derselben IR entstünden zwei verschiedene Aussagen. Deshalb explizit ablehnen.
    throw new Error(
      'boundsOfMm: transform.translate ist nur an Gruppen belegt, nicht an ' +
        `"${primitive.type}".`,
    );
  }

  switch (primitive.type) {
    case 'rect': {
      const points: Point[] = [
        [primitive.x, primitive.y],
        [primitive.x + primitive.width, primitive.y],
        [primitive.x + primitive.width, primitive.y + primitive.height],
        [primitive.x, primitive.y + primitive.height],
      ];
      return fromPoints(rotatePoints(points, rotate));
    }
    case 'circle': {
      const center: Point = rotate
        ? rotatePoint([primitive.cx, primitive.cy], rotate)
        : [primitive.cx, primitive.cy];
      const [cx, cy] = center;
      return {
        minX: cx - primitive.r,
        minY: cy - primitive.r,
        maxX: cx + primitive.r,
        maxY: cy + primitive.r,
      };
    }
    case 'line': {
      const points: Point[] = [
        [primitive.x1, primitive.y1],
        [primitive.x2, primitive.y2],
      ];
      return fromPoints(rotatePoints(points, rotate));
    }
    case 'polyline':
      return fromPoints(rotatePoints(primitive.points, rotate));
    case 'path':
      // Berechnet, nicht zugesichert: Segmentendpunkte plus analytische Kubik-Extrema. Der
      // `text`-Zweig unten (`boxMm` als Autorenzusicherung) ist hier ausdrücklich **nicht** das
      // Vorbild — eine zugesicherte Pfadhülle ließe das Fingerprint-Gate über einem falschen
      // `d`-String grün werden, während bei Text gar keine Berechnung möglich ist.
      return fromPoints(rotatePoints(pathPoints(primitive.d), rotate));
    case 'text': {
      // Text ist die einzige Primitivart, deren Ausdehnung nicht aus ihrer Geometrie berechenbar
      // ist — sie hängt an Fontmetrik, Schriftgrad und Laufweite, die hier nicht verfügbar sind.
      // `boxMm` ist deshalb keine Messung, sondern die einzige verfügbare Wahrheit: eine
      // Zusicherung des Autors (siehe Typkommentar in geometry.ts), die unverändert als Hülle
      // zurückgegeben wird.
      if (rotate) {
        // rawBoundsOfMm gibt boxMm unverändert zurück, dreht ihre Ecken also nicht — beide
        // Renderer werten transform.rotate aber sehr wohl aus (transformAttr in svg.ts). Eine
        // gedrehte Box hier unrotiert zurückzugeben wiche still von der tatsächlichen
        // Bildschirmausdehnung ab, derselbe Fehlermodus wie bei der oben abgelehnten
        // Gruppendrehung — deshalb dieselbe explizite Ablehnung statt einer Näherung.
        throw new Error(
          'boundsOfMm: Drehung von Text wird nicht unterstützt — die deklarierte Box würde ' +
            'unrotiert zurückgegeben, während beide Renderer das Primitiv tatsächlich drehen.',
        );
      }
      const { xMm, yMm, widthMm, heightMm } = primitive.boxMm;
      return { minX: xMm, minY: yMm, maxX: xMm + widthMm, maxY: yMm + heightMm };
    }
    case 'group': {
      if (rotate) {
        // Eine korrekte Hülle müsste die Drehung in die Geometrie jedes Kindes durchrechnen.
        // Das ist im aktuellen Referenzbestand kein belegter Fall (keine Gruppe trägt eine
        // eigene Drehung) — statt das still anzunähern, lehnen wir es explizit ab.
        throw new Error(
          'boundsOfMm: Drehung von Gruppen wird nicht unterstützt — dieser Fall ist im ' +
            'aktuellen Referenzbestand nicht belegt.',
        );
      }
      const childBounds = primitive.children
        .map(rawBoundsOfMm)
        .filter((bounds): bounds is BoundsMm => bounds !== undefined);
      if (childBounds.length === 0) return undefined;
      const merged = merge(childBounds);
      if (!translate) return merged;
      return {
        minX: merged.minX + translate.dxMm,
        minY: merged.minY + translate.dyMm,
        maxX: merged.maxX + translate.dxMm,
        maxY: merged.maxY + translate.dyMm,
      };
    }
  }
}

/**
 * Hülle eines Primitivs in Millimetern, inklusive Drehung.
 * Pfad-Primitive liefern eine **berechnete** Hülle (Segmentendpunkte plus analytische
 * Kubik-Extrema). Nur eine Gruppe ohne Kinder — auch verschachtelt — liefert die leere Hülle
 * {0,0,0,0}. Eine solche Gruppe unter Geschwistern verfälscht deren Hülle nicht: die
 * Nichtvergleichbarkeit wird herausgefiltert, bevor Geschwister zusammengeführt werden (siehe
 * `rawBoundsOfMm`).
 *
 * Text-Primitive liefern `boxMm` unverändert zurück — die einzige Primitivart, bei der die Hülle
 * eine Zusicherung des Autors ist, keine Messung (siehe Typkommentar in geometry.ts).
 */
export function boundsOfMm(primitive: Primitive): BoundsMm {
  return rawBoundsOfMm(primitive) ?? EMPTY_BOUNDS;
}

/**
 * Verschiebt ein Primitiv senkrecht um `deltaMm`, ohne seine Größe zu ändern. Verwendet sowohl
 * für die Körperplatzierung (`layout/profiles.ts`) als auch für Piktogramme, die der
 * Körpermitte folgen müssen (`compose.ts`) — eine Verschiebung entlang der y-Achse ist in
 * beiden Fällen dieselbe Operation auf derselben Primitivgeometrie.
 *
 * Pfad-Primitive haben keine strukturierte Punktgeometrie (ihre Koordinaten liegen im
 * `d`-String) und werden deshalb nicht verschoben, sondern lehnen explizit ab — ein still
 * falsch (nicht) verschobenes Pfad-Primitiv wäre schwerer zu bemerken als ein Fehler.
 */
export function shiftY(primitive: Primitive, deltaMm: number): Primitive {
  if (primitive.transform?.rotate && primitive.type !== 'group' && primitive.type !== 'path') {
    // Eine Verschiebung träfe nur die Koordinate, nicht das Rotationszentrum
    // (`transform.rotate.cx/cy`) — das Primitiv würde verschoben, aber weiterhin um das alte
    // Zentrum gedreht: still falsch. Genau wie der `path`-Zweig unten lehnen wir das deshalb
    // explizit ab, statt es anzunähern. `group` bleibt hier bewusst außen vor: eine gedrehte
    // Gruppe ist im aktuellen Referenzbestand kein belegter Fall (siehe `boundsOfMm`, das
    // Drehung von Gruppen ebenfalls ablehnt) und war nicht Teil dieses Befunds.
    throw new Error(
      'shiftY: gedrehte Primitive können nicht verschoben werden, ohne auch das ' +
        'Rotationszentrum (transform.rotate.cx/cy) zu verschieben.',
    );
  }

  switch (primitive.type) {
    case 'rect':
      return { ...primitive, y: primitive.y + deltaMm };
    case 'circle':
      return { ...primitive, cy: primitive.cy + deltaMm };
    case 'line':
      return { ...primitive, y1: primitive.y1 + deltaMm, y2: primitive.y2 + deltaMm };
    case 'polyline':
      return { ...primitive, points: primitive.points.map(([x, y]) => [x, y + deltaMm] as const) };
    case 'group':
      return { ...primitive, children: primitive.children.map((c) => shiftY(c, deltaMm)) };
    case 'text':
      // Anders als bei path liegen Texts Koordinaten strukturiert vor (x/y und boxMm), nicht
      // unzerlegt in einem d-String — eine Verschiebung ist deshalb möglich und nicht wie bei
      // path abzulehnen. Beide Koordinatenquellen müssen mitwandern: der Ankerpunkt (y) UND die
      // Box (boxMm.yMm), sonst desynchronisierte sich die gerenderte Textposition von der
      // Fläche, gegen die die Gates prüfen — ein still auseinanderlaufendes Primitiv wäre hier
      // genau der Fehlermodus, den path bewusst durch Ablehnen vermeidet.
      return {
        ...primitive,
        y: primitive.y + deltaMm,
        boxMm: { ...primitive.boxMm, yMm: primitive.boxMm.yMm + deltaMm },
      };
    case 'path':
      throw new Error(
        'shiftY: Pfad-Primitive haben keine strukturierte Punktgeometrie und können nicht ' +
          'verschoben werden.',
      );
  }
}

/**
 * Gehrungsgrenze der SVG-Vorgabe (`stroke-miterlimit`). Oberhalb davon wandelt jeder Renderer die
 * Gehrung in eine Fase um und die Spitze wird gar nicht gezeichnet — eine Hülle, die sie trotzdem
 * einrechnete, wäre zu groß.
 */
const MITER_LIMIT = 4;

/**
 * Hülle der **gezeichneten Strichfläche** eines Polyzugs, analytisch aus Strichstärke,
 * Gehrung an den Fugen und Stumpfkappen an den Enden.
 *
 * **Wofür das gebraucht wird.** Der Referenzextraktor legt für manche Zeichen keine Mittellinie
 * ab, sondern die Hülle des zu einer Fläche umgewandelten Strichs. `1.13 Ereignis` ist so ein
 * Fall: sein Kennwert ist `3,792/6,862/28,207/25,451`, während seine Mittellinie
 * `(4|7) → (16|25) → (28|7)` die Hülle `4/7/28/25` hat. Ein Vergleich der Mittellinienhülle
 * gegen diesen Kennwert scheitert an **allen vier** Kanten (eigener Lauf: minX 0,5896 · minY
 * 0,3912 · maxX −0,5868 · maxY −1,2784 Einheiten bei Toleranz 0,01).
 *
 * **Belegt an zwei unabhängigen Fällen gegen eingecheckte Kennwerte** (eigene Läufe,
 * 18. August 2026):
 * - `1.13` — offener Polyzug, 0,5 mm → `3,7920/6,8613/28,2080/25,4507` gegen den Kennwert
 *   `3,792/6,862/28,207/25,451`, größte Abweichung 0,0029 Einheiten.
 * - `1.7 Gebäude` — geschlossener Polyzug `(16|3) (1|10) (1|26) (31|26) (31|10)`, 0,5 mm →
 *   `0,7500/2,7241/31,2500/26,2500` gegen den `outline`-Kennwert `0,75/2,724/31,25/26,25`,
 *   größte Abweichung 0,0003 Einheiten.
 *
 * **Warum diese Funktion nicht pauschal über die Formklasse `outline` gelegt werden darf.**
 * Der Referenzbestand mischt die Fugenmodelle. Gegenfall `1.10 Maßnahme`, derselbe Polyzugtyp:
 * mit Gehrung bei 0,5 mm liefert diese Funktion `0,5585/3,7500/31,4415/29,4859`, der
 * eingecheckte `outline`-Kennwert ist `0,571/3,5/31,428/29,257` — **0,7087 Einheiten** daneben
 * bei minY, weil die Referenz `1.10` mit Fase und 1,0 mm Strich zeichnet. Der Aufruf gehört
 * deshalb an den einzeln benannten, vermessenen Fall (siehe `matchFingerprint`,
 * `bodyGeometry: 'stroke-outline'`) und nicht an eine Formklasse.
 *
 * **Was sie zusätzlich leistet:** anders als ein Mittellinienvergleich unterscheidet sie offen
 * von geschlossen. Derselbe Polyzug geschlossen ergibt `3,5329/6,7500/28,4671/25,4507`, also
 * 0,73 / 0,32 / 0,74 Einheiten neben dem Kennwert von `1.13` (eigener Lauf). Die Warnung der
 * Notiz vom 5. August, kein Gate könne offen und geschlossen unterscheiden, gilt für
 * Mittellinienvergleiche und nicht allgemein.
 */
export function strokeBoundsOfMm(primitive: Primitive): BoundsMm {
  if (primitive.type !== 'polyline') {
    throw new Error(
      'strokeBoundsOfMm: nur für Polyzüge vermessen — die Strichfläche von ' +
        `"${primitive.type}" ist nicht belegt.`,
    );
  }
  if (primitive.transform !== undefined) {
    throw new Error(
      'strokeBoundsOfMm: ein transformierter Polyzug ist als Strichfläche nicht vermessen.',
    );
  }

  const points = primitive.points;
  if (points.length < 2) {
    throw new Error('strokeBoundsOfMm: ein Polyzug braucht mindestens zwei Punkte.');
  }
  const halfMm = (primitive.style?.strokeWidth ?? DEFAULT_STROKE_WIDTH_MM) / 2;
  const closed = primitive.closed === true;

  /** Einheitsnormale je Segment; das Segment i führt von points[i] nach points[i+1]. */
  const segments: Array<{ from: Point; to: Point; normal: Point }> = [];
  const last = closed ? points.length : points.length - 1;
  for (let i = 0; i < last; i++) {
    const from = points[i] as Point;
    const to = points[(i + 1) % points.length] as Point;
    const dx = to[0] - from[0];
    const dy = to[1] - from[1];
    const length = Math.hypot(dx, dy);
    if (length === 0) {
      throw new Error('strokeBoundsOfMm: ein Polyzug mit einem Segment der Länge 0 ist nicht vermessen.');
    }
    segments.push({ from, to, normal: [-dy / length, dx / length] });
  }

  // Die Eckpunkte der Segmentrechtecke. Sie decken die Stumpfkappen an den Enden mit ab: eine
  // Stumpfkappe fügt der Strichfläche nichts hinzu, was nicht schon Ecke ihres Rechtecks wäre.
  const hull: Point[] = [];
  for (const { from, to, normal } of segments) {
    for (const side of [1, -1] as const) {
      hull.push([from[0] + side * halfMm * normal[0], from[1] + side * halfMm * normal[1]]);
      hull.push([to[0] + side * halfMm * normal[0], to[1] + side * halfMm * normal[1]]);
    }
  }

  // Die Gehrungsspitzen. Nur sie können über die Rechteckecken hinausragen. Ein geschlossener
  // Polyzug hat so viele Fugen wie Segmente, ein offener eine weniger — genau darin liegt der
  // Unterschied, den ein Mittellinienvergleich nicht sieht.
  const joints = closed ? segments.length : segments.length - 1;
  for (let i = 0; i < joints; i++) {
    const incoming = segments[i] as (typeof segments)[number];
    const outgoing = segments[(i + 1) % segments.length] as (typeof segments)[number];
    const vertex = incoming.to;
    const sum: Point = [
      incoming.normal[0] + outgoing.normal[0],
      incoming.normal[1] + outgoing.normal[1],
    ];
    const sumLength = Math.hypot(sum[0], sum[1]);
    if (sumLength === 0) {
      throw new Error(
        'strokeBoundsOfMm: eine Kehrtwende (180°) ist als Gehrung nicht vermessen.',
      );
    }
    const bisector: Point = [sum[0] / sumLength, sum[1] / sumLength];
    const cosHalf = bisector[0] * incoming.normal[0] + bisector[1] * incoming.normal[1];
    const miterRatio = 1 / cosHalf;
    if (miterRatio > MITER_LIMIT) {
      throw new Error(
        `strokeBoundsOfMm: Gehrungsverhältnis ${miterRatio.toFixed(3)} über der Grenze ` +
          `${MITER_LIMIT} — der Renderer zeichnet dort eine Fase, die nicht vermessen ist.`,
      );
    }
    const miterMm = halfMm * miterRatio;
    for (const side of [1, -1] as const) {
      hull.push([
        vertex[0] + side * miterMm * bisector[0],
        vertex[1] + side * miterMm * bisector[1],
      ]);
    }
  }

  return fromPoints(hull);
}
