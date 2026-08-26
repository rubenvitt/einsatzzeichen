import type { ColorToken, Length, Primitive } from './geometry.js';
import type { BodyMarkId, FunctionRoleId, SymbolKind } from './taxonomy.js';

export type FunctionRoleKind = Extract<SymbolKind, 'formation' | 'person'>;
export type FunctionRoleHeadKind = 'none' | 'strength' | 'administrative';

export interface FunctionRoleTextRun {
  readonly content: string;
  readonly anchorXMm: Length;
  readonly baselineYMm: Length;
  readonly sizeMm: Length;
  readonly anchor: 'start' | 'middle' | 'end';
  readonly boxMm: Extract<Primitive, { type: 'text' }>['boxMm'];
  readonly minRenderPx: number;
  readonly ink: ColorToken | 'body-contrast';
  readonly contrastBackground: ColorToken | 'body' | 'surface';
}

export type FunctionRoleTextRuns =
  | readonly []
  | readonly [FunctionRoleTextRun]
  | readonly [FunctionRoleTextRun, FunctionRoleTextRun];

export type FunctionRoleBodyPrimitive =
  Extract<Primitive, { type: 'rect' }> & { readonly role: 'body' };

export interface FunctionRoleLayout {
  readonly headTopMm?: Length;
  readonly body: FunctionRoleBodyPrimitive;
  readonly bodyAdditions: readonly Primitive[];
  readonly decorations: readonly Primitive[];
  readonly roleRuns: FunctionRoleTextRuns;
  readonly carrierRun?: FunctionRoleTextRun;
}

export interface FunctionRoleDefinition {
  readonly id: FunctionRoleId;
  readonly title: string;
  readonly kind: FunctionRoleKind;
  readonly expectedHead: FunctionRoleHeadKind;
  readonly allowedBodyMarks: readonly BodyMarkId[];
  readonly layout: FunctionRoleLayout;
}
