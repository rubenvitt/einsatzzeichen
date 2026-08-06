import type { ColorToken, Primitive, RgbHex, Style } from '@einsatzzeichen/schema';
import { mergeStyle } from '../render/style.js';
import type { RenderTheme } from '../render/theme.js';

const HEX = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i;

function linearChannel(value: number): number {
  const channel = value / 255;
  return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
}

/** Relative Luminanz nach der WCAG-sRGB-Formel. Ungültige Hexwerte lehnt die Vertrauensgrenze ab. */
export function relativeLuminance(color: RgbHex): number {
  const match = HEX.exec(color);
  if (match === null) throw new TypeError(`Ungültige RGB-Hexfarbe: "${color}".`);
  const red = match[1];
  const green = match[2];
  const blue = match[3];
  if (red === undefined || green === undefined || blue === undefined) {
    throw new TypeError(`Ungültige RGB-Hexfarbe: "${color}".`);
  }
  return (
    0.2126 * linearChannel(Number.parseInt(red, 16)) +
    0.7152 * linearChannel(Number.parseInt(green, 16)) +
    0.0722 * linearChannel(Number.parseInt(blue, 16))
  );
}

export function contrastRatio(first: RgbHex, second: RgbHex): number {
  const a = relativeLuminance(first);
  const b = relativeLuminance(second);
  const lighter = Math.max(a, b);
  const darker = Math.min(a, b);
  return (lighter + 0.05) / (darker + 0.05);
}

export interface ContrastRequirement {
  foreground: ColorToken;
  background: ColorToken | 'surface';
  context: string;
  minimum: number;
}

export interface ContrastIssue {
  themeId: string;
  foreground: ColorToken;
  background: ColorToken | 'surface';
  context: string;
  ratio: number;
  minimum: number;
}

export function checkContrast(
  theme: RenderTheme,
  requirements: readonly ContrastRequirement[],
): ContrastIssue[] {
  return requirements.flatMap((requirement) => {
    if (!Number.isFinite(requirement.minimum) || requirement.minimum <= 1) {
      throw new RangeError(
        `Kontrastminimum für "${requirement.context}" muss endlich und größer als 1 sein.`,
      );
    }
    const foreground = theme.palette[requirement.foreground];
    const background =
      requirement.background === 'surface'
        ? theme.surface
        : theme.palette[requirement.background];
    const ratio = contrastRatio(foreground, background);
    return ratio + Number.EPSILON < requirement.minimum
      ? [{ ...requirement, themeId: theme.id, ratio }]
      : [];
  });
}

/**
 * Alle tatsächlich malenden Tokens einer Primitivliste. Gruppenstil wird wie in beiden Renderern
 * feldweise vererbt; `none` und ungesetzte Felder sind keine Farbe und erscheinen nicht.
 */
export function paintTokensOf(primitives: readonly Primitive[]): readonly ColorToken[] {
  const tokens = new Set<ColorToken>();

  function visit(primitive: Primitive, inherited?: Style): void {
    const style = mergeStyle(primitive.style, inherited);
    if (primitive.type === 'group') {
      for (const child of primitive.children) visit(child, style);
      return;
    }
    if (style?.fill !== undefined && style.fill !== 'none') tokens.add(style.fill);
    if (style?.stroke !== undefined && style.stroke !== 'none') tokens.add(style.stroke);
  }

  for (const primitive of primitives) visit(primitive);
  return [...tokens];
}
