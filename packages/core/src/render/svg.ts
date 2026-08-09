import {
  DEFAULT_STROKE_WIDTH_MM,
  mmToUnits,
  type ColorToken,
  type Drawing,
  type Primitive,
  type Style,
  type Transform,
} from '@einsatzzeichen/schema';
import { escapeXml, formatUnits } from './format.js';
import { assertValidActiveStrokeWidths, mergeStyle } from './style.js';
import { baselineAttr, TEXT_FONT_FAMILY_ATTR } from './text-policy.js';
import { REFERENCE_THEME, type RenderTheme } from './theme.js';
import { assertValidRenderTheme } from './theme-validation.js';

export { formatUnits };

export interface SvgOptions {
  /** Kantenlänge in Pixeln. Ohne Angabe skaliert das SVG frei. */
  size?: number;
  /** Präfix für erzeugte Element-IDs. Erforderlich, wenn mehrere SVGs im selben DOM liegen. */
  idPrefix?: string;
  /** Farbprofil der Ausgabe. Ohne Angabe bleibt die BABZ-Referenzpalette bytegleich erhalten. */
  theme?: RenderTheme;
}

function u(mm: number): string {
  return formatUnits(mmToUnits(mm));
}

function color(token: ColorToken | 'none', theme: RenderTheme): string {
  return token === 'none' ? 'none' : escapeXml(theme.palette[token]);
}

/**
 * `stroke-width` steht normalerweise in SVG-Einheiten (`u`). Bei skalierten Pfaden
 * (siehe `pathTransformAttr`) übernimmt bereits die `scale(...)`-Transformation die
 * Umrechnung; würde die Strichstärke zusätzlich über `u` laufen, würde sie doppelt
 * skaliert. Für diesen Fall bleibt sie im Rohmaß Millimeter (`rawStrokeWidth: true`).
 *
 * `style` ist hier immer schon der von `renderPrimitive` aufgelöste effektive Stil
 * (eigener Stil verschmolzen mit geerbtem, siehe `mergeStyle`) — nie die CSS-Kaskade.
 * `stroke="none"` wird deshalb wie `fill="none"` explizit ausgegeben statt weggelassen:
 * es gibt keine vererbende `<g>`-Elternattribute mehr, auf die sich ein Weglassen
 * verlassen könnte.
 *
 * `fill` wird aus demselben Grund nie weggelassen, selbst wenn kein Stil (oder ein Stil
 * ohne `fill`) vorliegt: SVGs implizite Vorgabe für ein fehlendes `fill`-Attribut ist
 * **schwarz**, während der Canvas-Renderer (`drawPrimitive` in `canvas.ts`) in genau
 * diesem Fall gar nicht füllt (`style?.fill !== undefined`-Zweig). Ohne diese explizite
 * Vorgabe entstünden aus derselben IR zwei verschiedene Bilder — derselbe Fehlermodus wie
 * bei der Gruppen-Stil-Vererbung und `fillRule`, hier am `fill`-Default.
 *
 * `fillOnly` unterdrückt den gesamten Stroke-Zweig unabhängig von einem gesetzten
 * `style.stroke` — für Text (siehe `renderPrimitive`), der als Fläche gefüllt wird und keine
 * Kontur kennt: Canvas ruft für Text nie `strokeText()` auf (`drawPrimitive` in `canvas.ts`),
 * würde `styleAttrs` hier trotzdem `stroke="..."` ausgeben, striche SVG etwas, das Canvas aus
 * derselben IR nie zeichnet. Vorgabe `false`, damit kein bestehender Aufrufer (rect/circle/
 * line/polyline/path) sein Ergebnis ändert.
 */
function styleAttrs(
  style: Style | undefined,
  theme: RenderTheme,
  options: {
    rawStrokeWidth?: boolean;
    role?: Primitive['role'];
    pictogramStrokeContract?: boolean;
    fillOnly?: boolean;
  } = {},
): string {
  const parts: string[] = [
    `fill="${style?.fill !== undefined ? color(style.fill, theme) : 'none'}"`,
  ];
  if (style?.stroke !== undefined && !options.fillOnly) {
    parts.push(`stroke="${color(style.stroke, theme)}"`);
    if (style.stroke !== 'none') {
      const strokeWidthMm = style.strokeWidth ?? DEFAULT_STROKE_WIDTH_MM;
      const strokeWidth = options.rawStrokeWidth ? formatUnits(strokeWidthMm) : u(strokeWidthMm);
      parts.push(`stroke-width="${strokeWidth}"`);
      if (options.pictogramStrokeContract) {
        // Das Clipping-Gate erweitert die Autorenbox um die halbe Strichstärke. Butt-Kappen
        // und Round-Joins begrenzen die reale Piktogrammausdehnung darauf; SVG-Defaults wären
        // beim Miter-Join nicht ausreichend. Canvas setzt denselben Vertrag in drawPrimitive().
        parts.push('stroke-linecap="butt"', 'stroke-linejoin="round"');
      }
      const fillToken = style.fill;
      const dash =
        options.role === 'body' && fillToken !== undefined && fillToken !== 'none'
          ? theme.bodyStrokeDashes?.[fillToken]
          : undefined;
      if (dash !== undefined && dash.length > 0) {
        const values = dash.map((length) =>
          options.rawStrokeWidth ? formatUnits(length) : u(length),
        );
        parts.push(`stroke-dasharray="${values.join(' ')}"`);
      }
    }
  }
  if (style?.fillRule !== undefined) parts.push(`fill-rule="${style.fillRule}"`);
  return ` ${parts.join(' ')}`;
}

/**
 * SVG-Transformationen wirken von rechts nach links auf die Koordinaten. `translate` steht
 * deshalb links von `rotate`: die Drehung trifft zuerst die Kindkoordinaten (um ihr eigenes,
 * unverschobenes Zentrum), die Verschiebung wirkt danach nach außen auf das Ergebnis. Rechts
 * gestellt verschöbe sie das Rotationszentrum mit.
 *
 * Eine Verschiebung von (0, 0) wird nicht weggelassen: eine Nullprüfung wäre ein zweiter
 * Codepfad, den `drawPrimitive` in `canvas.ts` ebenfalls kennen müsste, damit die Renderer
 * nicht auseinanderlaufen — dieselbe Begründung wie beim `fill`-Default.
 */
function transformAttr(transform: Transform | undefined): string {
  const parts: string[] = [];
  const translate = transform?.translate;
  if (translate) {
    parts.push(`translate(${u(translate.dxMm)} ${u(translate.dyMm)})`);
  }
  const rotate = transform?.rotate;
  if (rotate) {
    parts.push(`rotate(${formatUnits(rotate.angle)} ${u(rotate.cx)} ${u(rotate.cy)})`);
  }
  return parts.length === 0 ? '' : ` transform="${parts.join(' ')}"`;
}

/**
 * Nachkommastellen des Pfad-Skalierungsfaktors (siehe `pathTransformAttr`). Der Faktor
 * muss genauer sein als `formatUnits` (drei Nachkommastellen), weil er nicht auf einen
 * einzelnen umgerechneten Wert wirkt, sondern multiplikativ auf jede Koordinate im
 * unangetasteten `d`-String. Bei einer maximalen Kantenlänge von 32 mm
 * (`DEFAULT_VIEWBOX_MM`) und einer Vergleichstoleranz von 0.01 Einheiten
 * (`TOLERANCE_UNITS`) darf der Rundungsfehler des Faktors höchstens 0.01 / 32 ≈
 * 0.0003125 betragen. Drei Nachkommastellen (Fehler bis zu 0.0005) ergäben bei 32 mm
 * bis zu 0.016 Einheiten Abweichung — zu ungenau. Vier Nachkommastellen begrenzen den
 * Fehler auf 0.00005, also höchstens 0.0016 Einheiten bei 32 mm — innerhalb der Toleranz.
 */
const PATH_SCALE_DECIMALS = 4;

function pathScaleFactor(): string {
  return mmToUnits(1).toFixed(PATH_SCALE_DECIMALS);
}

/**
 * SVG 2 erlaubt Form Feed als `wsp` in Pfaddaten, XML 1.0 jedoch nicht als Zeichen. Der
 * Autorenvertrag bleibt deshalb unverändert; erst die XML-Serialisierung normalisiert U+000C
 * deterministisch auf das semantisch gleichwertige U+0020.
 */
function pathDataForXml(d: string): string {
  return escapeXml(d.replaceAll('\u000c', ' '));
}

/**
 * Pfad-Primitive tragen ihre Koordinaten unzerlegt im `d`-String (in Millimetern) und
 * werden deshalb nicht wie die anderen Primitive einzeln über `u` umgerechnet, sondern
 * per `scale(...)` skaliert. SVG-Transformationen wirken von rechts nach links auf die
 * Koordinaten: `scale` muss deshalb rechts stehen, damit es zuerst auf die
 * Millimeter-Koordinaten wirkt; `rotate` (mit bereits in Einheiten umgerechnetem
 * Mittelpunkt) wirkt danach auf das skalierte Ergebnis.
 */
function pathTransformAttr(transform: Transform | undefined): string {
  const scale = `scale(${pathScaleFactor()})`;
  const rotate = transform?.rotate;
  if (!rotate) return ` transform="${scale}"`;
  return ` transform="rotate(${formatUnits(rotate.angle)} ${u(rotate.cx)} ${u(rotate.cy)}) ${scale}"`;
}

/**
 * Löst den effektiven Stil eines Primitivs auf (eigener Stil überschreibt geerbten,
 * Feld für Feld — siehe `mergeStyle`) und gibt ihn selbst dort aus, wo SVG sich sonst
 * auf die CSS-Attributvererbung über `<g>` verlassen hätte. Grund: bei Pfaden würde die
 * geerbte `stroke-width` sonst durch die `scale(...)`-Transformation eines `<g>` und
 * erneut durch die des `<path>` doppelt skaliert (siehe `pathTransformAttr`). Damit
 * lösen SVG und Canvas (`drawPrimitive` in `canvas.ts`) die Vererbung strukturell
 * gleich auf: beide werten sie im Renderer aus, keiner verlässt sich auf die
 * Zielplattform. `<g>` trägt deshalb selbst keinen Stil mehr — nur noch Kinder tun das.
 */
function renderPrimitive(
  primitive: Primitive,
  theme: RenderTheme,
  inheritedStyle?: Style,
  inheritedRole?: Primitive['role'],
): string {
  const style = mergeStyle(primitive.style, inheritedStyle);
  const role = primitive.role ?? inheritedRole;

  if (primitive.type === 'path') {
    const styleStr = styleAttrs(style, theme, {
      rawStrokeWidth: true,
      role,
      pictogramStrokeContract: role === 'pictogram',
    });
    const transform = pathTransformAttr(primitive.transform);
    return `<path d="${pathDataForXml(primitive.d)}"${styleStr}${transform}/>`;
  }

  if (primitive.type === 'group') {
    const transform = transformAttr(primitive.transform);
    const children = primitive.children
      .map((child) => renderPrimitive(child, theme, style, role))
      .join('');
    return `<g${transform}>${children}</g>`;
  }

  if (primitive.type === 'text') {
    // Text wird gefüllt, nicht gestrichen — kein pictogramStrokeContract wie bei Piktogrammpfaden
    // (der Butt-Cap/Round-Join-Vertrag ist für eine gefüllte Glyphenfläche bedeutungslos) und
    // fillOnly: true, damit ein gesetzter style.stroke gar nicht erst als stroke="..." ausgegeben
    // wird — Canvas kennt für Text kein strokeText() (siehe drawPrimitive in canvas.ts), ein
    // gestrichener <text> striche also etwas, das Canvas aus derselben IR nie zeichnet. Ein
    // eigener styleAttrs()-Aufruf statt der geteilten `tail` unten: die wäre für role: 'pictogram'
    // mit gesetztem pictogramStrokeContract berechnet, genau das, was Text nicht tragen soll.
    const styleStr = styleAttrs(style, theme, { role, fillOnly: true });
    const transform = transformAttr(primitive.transform);
    const attrs =
      `x="${u(primitive.x)}" y="${u(primitive.y)}" text-anchor="${primitive.anchor}" ` +
      `dominant-baseline="${baselineAttr(primitive.baseline)}" font-family="${TEXT_FONT_FAMILY_ATTR}" ` +
      `font-size="${u(primitive.sizeMm)}"`;
    return `<text ${attrs}${styleStr}${transform}>${escapeXml(primitive.content)}</text>`;
  }

  // Einzelne SVG-Linien haben bereits Butt-Kappen und keine Joins; das explizite Attribut würde
  // nur die bestehenden D0-Snapshots byteweise ändern. Alle anderen Piktogramm-Blätter erhalten
  // den begrenzten Contract explizit, weil sie Joins oder geschlossene Konturen tragen können.
  const tail = `${styleAttrs(style, theme, {
    role,
    pictogramStrokeContract: role === 'pictogram' && primitive.type !== 'line',
  })}${transformAttr(primitive.transform)}`;

  switch (primitive.type) {
    case 'rect': {
      const rx = primitive.rx !== undefined ? ` rx="${u(primitive.rx)}"` : '';
      return `<rect x="${u(primitive.x)}" y="${u(primitive.y)}" width="${u(primitive.width)}" height="${u(primitive.height)}"${rx}${tail}/>`;
    }
    case 'circle':
      return `<circle cx="${u(primitive.cx)}" cy="${u(primitive.cy)}" r="${u(primitive.r)}"${tail}/>`;
    case 'line':
      return `<line x1="${u(primitive.x1)}" y1="${u(primitive.y1)}" x2="${u(primitive.x2)}" y2="${u(primitive.y2)}"${tail}/>`;
    case 'polyline': {
      const points = primitive.points.map(([x, y]) => `${u(x)},${u(y)}`).join(' ');
      const tag = primitive.closed === true ? 'polygon' : 'polyline';
      return `<${tag} points="${points}"${tail}/>`;
    }
  }
}

export function renderSvg(drawing: Drawing, options: SvgOptions = {}): string {
  const prefix = options.idPrefix ?? 'ez';
  const theme = options.theme === undefined ? REFERENCE_THEME : options.theme;
  assertValidRenderTheme(theme);
  assertValidActiveStrokeWidths(drawing);
  const width = u(drawing.viewBox.width);
  const height = u(drawing.viewBox.height);

  const attrs = ['xmlns="http://www.w3.org/2000/svg"', `viewBox="0 0 ${width} ${height}"`];
  if (options.size !== undefined) {
    attrs.push(`width="${options.size}"`, `height="${options.size}"`);
  }

  const labelled: string[] = [];
  const metadata: string[] = [];
  if (drawing.title !== undefined) {
    labelled.push(`${prefix}-title`);
    metadata.push(`<title id="${prefix}-title">${escapeXml(drawing.title)}</title>`);
  }
  if (drawing.description !== undefined) {
    labelled.push(`${prefix}-desc`);
    metadata.push(`<desc id="${prefix}-desc">${escapeXml(drawing.description)}</desc>`);
  }

  if (labelled.length > 0) {
    attrs.push('role="img"', `aria-labelledby="${labelled.join(' ')}"`);
  } else {
    attrs.push('aria-hidden="true"');
  }

  const body = drawing.children.map((child) => renderPrimitive(child, theme)).join('');
  return `<svg ${attrs.join(' ')}>${metadata.join('')}${body}</svg>`;
}
