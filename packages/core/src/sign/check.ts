import type { BodySign, Drawing, Sign, SymbolSpec } from '@einsatzzeichen/schema';
import { isFreestandingSign } from '@einsatzzeichen/schema';
import { drawFreestanding } from '../draw-freestanding.js';
import { NotMeasuredError } from '../not-measured.js';
import { explainRejection, type ExplainedIssue } from '../rules/rule-explanations.js';
import { CompositionError } from '../validate.js';
import { headGroupOf } from './labels.js';
import { attempt, isDerived, isTendency, resolveBody, type Attempt } from './resolve.js';

/**
 * Ein Befund an einer Beschreibung. `field` ist das Feld der Beschreibung, das die Leserin ändern
 * müsste (`tasks`, `head`, `text`, `exact` …); fehlt es, benennt der Befund keines.
 */
export interface SignIssue {
  readonly rule: string;
  readonly field?: string;
  readonly title: string;
  readonly message: string;
  /** `rule`: eine Regel lehnt ab. `not-measured`: die Referenz führt die Fassung nicht. `sign`: die Beschreibung selbst ist widersprüchlich. */
  readonly reason: 'rule' | 'not-measured' | 'sign';
}

export type SignCheck =
  | { readonly ok: true; readonly fidelity: 'measured' | 'derived'; readonly drawing: Drawing }
  | { readonly ok: false; readonly issues: readonly SignIssue[] };

/** Feld des Bauplans → Feld der Beschreibung, für die Befunde der Regeln. */
const SIGN_FIELD_OF_SPEC_FIELD: Readonly<Record<string, string>> = {
  kind: 'kind',
  bodyVariant: 'variant',
  organization: 'organization',
  technicalFill: 'color',
  strength: 'head',
  unitGrouping: 'head',
  administrativeLevel: 'head',
  technicalHeadMark: 'head',
  functionRole: 'role',
  vehicleCategory: 'chassis',
  states: 'states',
  tendency: 'states',
  capabilities: 'tasks',
  bodyMarks: 'tasks',
  designation: 'text',
  labels: 'text',
};

/**
 * Streng: trägt die Beschreibung als Ganzes, ohne dass `draw` etwas weglassen müsste? Dieselben
 * Regeln wie `checkSpec`, die Befunde aber an den Feldern der Beschreibung. Dazu zwei Befunde,
 * die nur die Beschreibung haben kann: mehr als eine Tendenz in `states` und ein Kopfwert aus
 * keiner der vier Listen.
 */
export function check(sign: Sign): SignCheck {
  if (isFreestandingSign(sign)) {
    let result: Attempt;
    try {
      result = { ok: true, drawing: drawFreestanding(sign) };
    } catch (error) {
      result = { ok: false, error };
    }
    return toCheck(result, undefined);
  }

  const own = signIssues(sign);
  const resolved = resolveBody(sign);
  const result = resolved.attempt ?? attempt(resolved.spec);
  const checked = toCheck(result, sign);
  if (own.length === 0) return checked;
  return { ok: false, issues: [...own, ...(checked.ok ? [] : checked.issues)] };
}

function signIssues(sign: BodySign): SignIssue[] {
  const issues: SignIssue[] = [];
  const tendencies = (sign.states ?? []).filter(isTendency);
  if (tendencies.length > 1) {
    issues.push({
      rule: 'sign-one-tendency',
      field: 'states',
      title: 'Höchstens eine Tendenz',
      message: `Ein Zeichen trägt höchstens eine Tendenz; gesetzt sind ${tendencies.join(', ')}.`,
      reason: 'sign',
    });
  }
  if (sign.head !== undefined && headGroupOf(sign.head) === undefined) {
    issues.push({
      rule: 'sign-head-unknown',
      field: 'head',
      title: 'Unbekannte Kopfangabe',
      message: `„${String(sign.head)}“ ist weder Stärke noch Verband, Verwaltungsstufe oder technische Kopfmarke.`,
      reason: 'sign',
    });
  }
  return issues;
}

function toCheck(result: Attempt, sign: BodySign | undefined): SignCheck {
  if (result.ok) {
    return { ok: true, fidelity: isDerived(result.drawing) ? 'derived' : 'measured', drawing: result.drawing };
  }
  const { error } = result;
  if (error instanceof CompositionError) {
    return { ok: false, issues: explainRejection(error).map((issue) => fromExplained(issue, sign)) };
  }
  if (error instanceof NotMeasuredError) {
    return {
      ok: false,
      issues: [{ rule: 'not-measured', title: 'Nicht vermessen', message: error.message, reason: 'not-measured' }],
    };
  }
  // Ein Verlauf, den die Zeichnung nicht tragen kann, ist weder Regel noch Lücke; als Befund
  // statt als Wurf, damit `check` für jede Eingabe antwortet.
  return {
    ok: false,
    issues: [
      {
        rule: 'not-drawable',
        title: 'Nicht zeichenbar',
        message: error instanceof Error ? error.message : String(error),
        reason: 'rule',
      },
    ],
  };
}

function fromExplained(issue: ExplainedIssue, sign: BodySign | undefined): SignIssue {
  const field = sign === undefined ? issue.field : signField(issue.field, sign);
  return {
    rule: issue.rule,
    ...(field === undefined || field === 'composition' ? {} : { field }),
    title: issue.title,
    message: issue.message,
    reason: 'rule',
  };
}

/** Steht das Feld in `exact`, ist dort zu ändern; sonst am gleichnamigen Feld der Beschreibung. */
function signField(specField: string, sign: BodySign): string | undefined {
  if (sign.exact !== undefined && Object.hasOwn(sign.exact, specField as keyof SymbolSpec)) return 'exact';
  return SIGN_FIELD_OF_SPEC_FIELD[specField];
}
