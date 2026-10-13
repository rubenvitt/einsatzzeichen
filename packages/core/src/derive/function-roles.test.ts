import { describe, expect, it } from 'vitest';
import type { Drawing, Primitive, SymbolSpec } from '@einsatzzeichen/schema';
import { boundsOfMm, type BoundsMm } from '../bounds.js';
import { bodyLabelInk } from '../compose.js';
import { drawSymbol } from '../default-ports.js';
import { FUNCTION_ROLE_DEFINITIONS } from '../geometry/function-roles.js';
import { validateSpec } from '../validate.js';
import {
  functionRoleHasOriginal,
  functionRoleHeadIsFree,
  functionRoleOrganizationIsFree,
  functionRoleSpecIsMeasured,
} from './function-roles.js';

function flat(primitives: readonly Primitive[]): Primitive[] {
  return primitives.flatMap((primitive) =>
    primitive.type === 'group' ? [primitive, ...flat(primitive.children)] : [primitive]);
}

function bodyOf(drawing: Drawing): Primitive {
  const body = drawing.children.find((child) => child.role === 'body');
  if (body === undefined) throw new Error('kein Körper');
  return body;
}

function textOf(drawing: Drawing, content: string): Extract<Primitive, { type: 'text' }> {
  const text = flat(drawing.children).find(
    (child): child is Extract<Primitive, { type: 'text' }> =>
      child.type === 'text' && child.content === content,
  );
  if (text === undefined) throw new Error(`kein Lauf "${content}"`);
  return text;
}

function intersects(left: BoundsMm, right: BoundsMm): boolean {
  return left.minX < right.maxX && right.minX < left.maxX &&
    left.minY < right.maxY && right.minY < left.maxY;
}

function within(inner: BoundsMm, outer: BoundsMm): boolean {
  return inner.minX >= outer.minX && inner.minY >= outer.minY &&
    inner.maxX <= outer.maxX && inner.maxY <= outer.maxY;
}

function allFinite(value: unknown): boolean {
  if (typeof value === 'number') return Number.isFinite(value);
  if (Array.isArray(value)) return value.every(allFinite);
  if (value !== null && typeof value === 'object') return Object.values(value).every(allFinite);
  return true;
}

function rulesOf(spec: SymbolSpec): string[] {
  try {
    drawSymbol(spec);
    return [];
  } catch (error) {
    return (error as { issues?: { rule: string }[] }).issues?.map((issue) => issue.rule) ?? [
      String(error),
    ];
  }
}

const EL_PERSON = {
  kind: 'person',
  organization: 'fuehrung-leitung',
  functionRole: 'incident-commander',
} as const satisfies SymbolSpec;

const EL_FORMATION = {
  kind: 'formation',
  organization: 'fuehrung-leitung',
  functionRole: 'incident-command',
} as const satisfies SymbolSpec;

describe('Funktionsrollen: Einordnung nach dem Titel', () => {
  it('lässt die Organisation nur an den Rollen der Führung und Leitung frei', () => {
    const free = Object.values(FUNCTION_ROLE_DEFINITIONS)
      .filter((definition) => functionRoleOrganizationIsFree(definition.expectedOrganization))
      .map((definition) => definition.id);
    expect(free).not.toContain('fire-service-platoon-commander');
    expect(free).not.toContain('district-fire-chief');
    expect(free).not.toContain('technical-platoon-commander');
    expect(free).not.toContain('medical-platoon-commander');
    expect(free).toContain('incident-commander');
    expect(free).toContain('lead-emergency-physician');
  });

  it('bindet den Kopf, wo der Titel ihn nennt', () => {
    const free = Object.values(FUNCTION_ROLE_DEFINITIONS)
      .filter((definition) => functionRoleHeadIsFree(definition.id, definition.expectedOrganization))
      .map((definition) => definition.id)
      .sort();
    expect(free).toEqual([
      'disaster-control-command',
      'hazard-response-director',
      'incident-command',
      'incident-commander',
      'incident-section-command-north',
      'incident-section-commander',
      'incident-subsection-command',
      'incident-subsection-commander',
      'lead-emergency-physician',
      'leader',
      'organizational-incident-commander',
      'technical-incident-command-evacuation',
      'technical-incident-commander',
    ]);
  });
});

describe('Funktionsrollen: vermessene Festfassungen bleiben unverändert', () => {
  const measuredRoles = Object.values(FUNCTION_ROLE_DEFINITIONS)
    .filter((definition) => functionRoleHasOriginal(definition.id));

  it.each(measuredRoles)('$id ohne Ableitungsnotiz', (definition) => {
    const spec: SymbolSpec = {
      kind: definition.kind,
      organization: definition.expectedOrganization,
      functionRole: definition.id,
      ...(definition.expectedStrength === undefined ? {} : { strength: definition.expectedStrength }),
      ...(definition.expectedAdministrativeLevel === undefined
        ? {}
        : { administrativeLevel: definition.expectedAdministrativeLevel }),
    };
    expect(functionRoleSpecIsMeasured(definition, spec)).toBe(true);
    const drawing = drawSymbol(spec);
    expect(drawing.derivations).toBeUndefined();
    expect(bodyOf(drawing)).toMatchObject({
      x: definition.layout.body.x,
      y: definition.layout.body.y,
      width: definition.layout.body.width,
    });
  });
});

describe('Funktionsrollen: Organisation (function-role-organization-mismatch verengt)', () => {
  it('färbt eine Leitungsrolle um und leitet die Lauftinte aus der Füllung ab', () => {
    const drawing = drawSymbol({ ...EL_PERSON, organization: 'feuerwehr' });
    expect(bodyOf(drawing).style?.fill).toBe('rot');
    expect(textOf(drawing, 'EL').style?.fill).toBe(bodyLabelInk('rot'));
    expect(drawing.derivations).toContainEqual(expect.objectContaining({
      dimension: 'organization', basis: 'transferred', from: 'function-role:incident-commander',
    }));
  });

  it('zeichnet eine Leitungsrolle ohne Organisation schwarz auf Weiß', () => {
    const drawing = drawSymbol({ kind: 'person', functionRole: 'incident-commander' });
    expect(bodyOf(drawing).style?.fill).toBe('none');
    expect(textOf(drawing, 'EL').style?.fill).toBe('schwarz');
  });

  it('lässt den Trägerlauf auf der Oberfläche schwarz', () => {
    const drawing = drawSymbol({
      kind: 'person', organization: 'thw', administrativeLevel: 'kreis',
      functionRole: 'technical-incident-commander',
    });
    expect(textOf(drawing, 'AW').style?.fill).toBe('schwarz');
    expect(textOf(drawing, 'TEL').style?.fill).toBe(bodyLabelInk('blau'));
  });

  it('bleibt bei Rollen, deren Titel die Organisation nennt', () => {
    expect(rulesOf({
      kind: 'person', organization: 'thw', strength: 'zug',
      functionRole: 'fire-service-platoon-commander',
    })).toContain('function-role-organization-mismatch');
    expect(rulesOf({
      kind: 'person', administrativeLevel: 'kreis', functionRole: 'district-fire-chief',
    })).toContain('function-role-organization-mismatch');
  });
});

describe('Funktionsrollen: Kopf (function-role-head-mismatch verengt)', () => {
  it('übernimmt für den Zug an der Leitungsrolle Kopf und Körper des Zugführers', () => {
    const drawing = drawSymbol({ ...EL_PERSON, strength: 'zug' });
    const zugfuehrer = FUNCTION_ROLE_DEFINITIONS['fire-service-platoon-commander'].layout;
    expect(bodyOf(drawing)).toMatchObject({
      x: zugfuehrer.body.x, y: zugfuehrer.body.y, width: zugfuehrer.body.width,
      transform: { rotate: { cy: 18 } },
    });
    const heads = drawing.children.filter((child) => child.role === 'head');
    expect(heads.map((head) => head.type === 'circle' && head.cy)).toEqual([2.5, 2.5, 2.5]);
    // Der Lauf wandert mit dem Körper um 2 mm nach unten.
    expect(textOf(drawing, 'EL').y).toBeCloseTo(20.5, 6);
    expect(drawing.derivations).toContainEqual(expect.objectContaining({
      dimension: 'strength', basis: 'transferred', from: 'function-role:fire-service-platoon-commander',
    }));
  });

  it('setzt den Trupp wie den Zug: dieselbe Reihe, nur die Mitte belegt', () => {
    const drawing = drawSymbol({ ...EL_PERSON, strength: 'trupp' });
    expect(boundsOfMm(bodyOf(drawing)).minY).toBeCloseTo(5, 6);
    expect(boundsOfMm(bodyOf(drawing)).maxY).toBeCloseTo(31, 6);
  });

  it('weicht der Staffel über placeHead aus, ohne NaN (stiller Fehler headTopMm!)', () => {
    const drawing = drawSymbol({ ...EL_PERSON, strength: 'staffel' });
    expect(allFinite(drawing.children)).toBe(true);
    const heads = drawing.children.filter((child) => child.role === 'head');
    expect(heads.map((head) => head.type === 'circle' && head.cy)).toEqual([2.5, 6.5]);
    // Stapel 1…8 mm, Kopfabstand 1 mm: die Raute beginnt bei 9 mm und behält ihre Unterkante.
    const body = boundsOfMm(bodyOf(drawing));
    expect(body.minY).toBeCloseTo(9, 6);
    expect(body.maxY).toBeCloseTo(29, 6);
    expect(within(boundsOfMm(textOf(drawing, 'EL')), body)).toBe(true);
    expect(drawing.derivations).toContainEqual(expect.objectContaining({
      dimension: 'strength', basis: 'constructed',
    }));
  });

  it('setzt eine Kreisstufe an die kopflose Leitungsrolle wie an den LNA', () => {
    const drawing = drawSymbol({ ...EL_PERSON, administrativeLevel: 'kreis' });
    const head = drawing.children[0];
    expect(head).toMatchObject({ type: 'group', role: 'head', transform: { translate: { dyMm: 0 } } });
    const el = FUNCTION_ROLE_DEFINITIONS['incident-commander'].layout.body;
    expect(bodyOf(drawing)).toMatchObject({ x: el.x, y: el.y, width: el.width });
  });

  it('wechselt die Stufe einer kopffreien Verwaltungsrolle und zeichnet sie ohne Stufe', () => {
    const lna = { kind: 'person', organization: 'fuehrung-leitung', functionRole: 'lead-emergency-physician' } as const;
    const eu = drawSymbol({ ...lna, administrativeLevel: 'europaeische-union' });
    const international = FUNCTION_ROLE_DEFINITIONS['international-relief-operation-director'].layout.body;
    expect(bodyOf(eu)).toMatchObject({ width: international.width, y: international.y });
    expect(allFinite(eu.children)).toBe(true);
    const none = drawSymbol(lna);
    expect(none.children.some((child) => child.role === 'head')).toBe(false);
    expect(none.derivations).toContainEqual(expect.objectContaining({ dimension: 'functionRole' }));
  });

  it('bleibt bei Widerspruch zum Rollennamen', () => {
    expect(rulesOf({
      kind: 'person', organization: 'feuerwehr', strength: 'gruppe',
      functionRole: 'fire-service-platoon-commander',
    })).toContain('function-role-head-mismatch');
    expect(rulesOf({
      kind: 'person', organization: 'feuerwehr', functionRole: 'fire-service-platoon-commander',
    })).toContain('function-role-head-mismatch');
    expect(rulesOf({
      kind: 'person', organization: 'feuerwehr', administrativeLevel: 'nationalstaat',
      functionRole: 'district-fire-chief',
    })).toContain('function-role-head-mismatch');
    expect(rulesOf({
      kind: 'person', organization: 'fuehrung-leitung', administrativeLevel: 'nationalstaat',
      functionRole: 'district-control-center-director',
    })).toContain('function-role-head-mismatch');
    expect(rulesOf({
      kind: 'formation', organization: 'fuehrung-leitung', strength: 'zug',
      functionRole: 'technical-incident-command-group',
    })).toContain('function-role-head-mismatch');
  });
});

describe('Funktionsrollen: Kopfzone frei (head-zone-conflict verengt)', () => {
  it('setzt Kopfmarke und Verband über eine kopflose Führungsstelle', () => {
    const mark = drawSymbol({ ...EL_FORMATION, technicalHeadMark: 'double-vertical-bar' });
    expect(mark.children[0]).toMatchObject({
      type: 'group', role: 'head', transform: { translate: { dyMm: 1 } },
    });
    expect(bodyOf(mark)).toMatchObject({ y: 6, height: 20 });
    expect(allFinite(mark.children)).toBe(true);
    const grouping = drawSymbol({ ...EL_FORMATION, unitGrouping: 'verband-i' });
    expect(grouping.children[0]).toMatchObject({ type: 'group', role: 'head' });
    expect(grouping.derivations).toContainEqual(expect.objectContaining({ dimension: 'unitGrouping' }));
  });

  it('bleibt bei einer Rolle mit eigenem Kopf und bei zwei Angaben in einer Kopfzone', () => {
    expect(rulesOf({
      kind: 'formation', organization: 'fuehrung-leitung', strength: 'gruppe',
      technicalHeadMark: 'single-vertical-bar', functionRole: 'technical-incident-command-group',
    })).toContain('head-zone-conflict');
    expect(rulesOf({
      ...EL_FORMATION, strength: 'zug', technicalHeadMark: 'single-vertical-bar',
    })).toContain('head-zone-conflict');
  });
});

describe('Funktionsrollen: Körpervariante', () => {
  it('rechnet die Führungsstelle auf den Fußbandkörper um und hält die Läufe vom Band fern', () => {
    const drawing = drawSymbol({
      kind: 'formation', organization: 'fuehrung-leitung', bodyVariant: 'foot-band',
      functionRole: 'technical-incident-command-evacuation',
    });
    const band = drawing.children.find(
      (child) => child.type === 'rect' && child.role === 'pictogram' && child.y === 23,
    );
    expect(band).toMatchObject({ x: 1, y: 23, width: 30, height: 3 });
    for (const content of ['TEL', 'Evakuierung']) {
      const box = boundsOfMm(textOf(drawing, content));
      expect(box.maxY).toBeLessThanOrEqual(23);
      expect(box.minY).toBeGreaterThanOrEqual(9);
    }
    expect(drawing.derivations).toContainEqual(expect.objectContaining({
      dimension: 'bodyVariant', basis: 'constructed',
    }));
  });

  it('setzt den Zugführer auf die kompakte Raute und weicht dem Zugkopf aus', () => {
    const drawing = drawSymbol({
      kind: 'person', organization: 'feuerwehr', strength: 'zug',
      functionRole: 'fire-service-platoon-commander', bodyVariant: 'compact-person-diamond-26mm',
    });
    const body = boundsOfMm(bodyOf(drawing));
    expect(body.minY).toBeCloseTo(5, 6);
    expect(body.maxY).toBeCloseTo(29, 6);
    // Die Kappe sitzt auf der neuen Spitze.
    const cap = drawing.children.find((child) => child.type === 'polyline' && child.role === 'pictogram');
    expect(cap?.type === 'polyline' && cap.points[0]?.[1]).toBeCloseTo(5, 6);
    expect(drawing.derivations).toContainEqual(expect.objectContaining({ dimension: 'bodyVariant' }));
  });

  it('senkt die Leitungsrolle mit der abgesenkten Raute samt Trägerlauf', () => {
    const plain = drawSymbol({
      kind: 'person', organization: 'fuehrung-leitung', administrativeLevel: 'kreis',
      functionRole: 'technical-incident-commander',
    });
    const lowered = drawSymbol({
      kind: 'person', organization: 'fuehrung-leitung', administrativeLevel: 'kreis',
      functionRole: 'technical-incident-commander',
      bodyVariant: 'compact-person-diamond-26mm-lowered-2mm',
    });
    expect(boundsOfMm(bodyOf(lowered)).minY - boundsOfMm(bodyOf(plain)).minY).toBeCloseTo(2, 6);
    expect(textOf(lowered, 'AW').y - textOf(plain, 'AW').y).toBeCloseTo(2, 6);
    expect(textOf(lowered, 'TEL').y - textOf(plain, 'TEL').y).toBeCloseTo(2, 6);
  });
});

describe('Funktionsrollen: Piktogramme und Körpermarken (stiller Verlust behoben)', () => {
  it.each([
    ['Führungsstelle', EL_FORMATION, 'EL'],
    ['Führungskraft', EL_PERSON, 'EL'],
    ['Führungsstelle mit Fußband', {
      kind: 'formation', organization: 'fuehrung-leitung', bodyVariant: 'foot-band',
      functionRole: 'incident-section-command-north',
    }, 'EAL'],
  ] as const)('passt ein Piktogramm in den freien Bereich der %s ein', (_name, base, run) => {
    // Eine Fähigkeit ohne randbündige Körperfassung: Brandbekämpfung zeichnet `derive/capabilities.ts`
    // an diesen Körpern als Körpermarke, sie stünde hier nicht als Boxpiktogramm.
    const drawing = drawSymbol({ ...base, capabilities: ['foam-agent'] });
    const group = drawing.children.find((child) => child.type === 'group' && child.role === 'pictogram');
    expect(group).toBeDefined();
    const box = boundsOfMm(group!);
    expect(within(box, boundsOfMm(bodyOf(drawing)))).toBe(true);
    expect(intersects(box, boundsOfMm(textOf(drawing, run)))).toBe(false);
    expect(drawing.derivations).toContainEqual(expect.objectContaining({ dimension: 'capabilities' }));
  });

  it('setzt eine weitere Körpermarke an die Rollenhülle und weicht dem Lauf aus', () => {
    const drawing = drawSymbol({ ...EL_PERSON, bodyMarks: ['care'] });
    const run = boundsOfMm(textOf(drawing, 'EL'));
    const marks = drawing.children.filter(
      (child) => child.role === 'pictogram' && !(child.type === 'polyline' && child.style?.fill === 'schwarz'),
    );
    expect(marks.length).toBeGreaterThan(0);
    for (const mark of marks) expect(intersects(boundsOfMm(mark), run)).toBe(false);
    expect(drawing.derivations).toContainEqual(expect.objectContaining({ dimension: 'bodyMarks' }));
  });

  it.each([
    ['Führungskraft', EL_PERSON, 'foam-agent'],
    ['Führungsstelle', EL_FORMATION, 'foam-agent'],
  ] as const)('hält Piktogramm und Körpermarke an der %s auseinander', (_name, base, capability) => {
    const drawing = drawSymbol({ ...base, capabilities: [capability], bodyMarks: ['care'] });
    const group = drawing.children.find((child) => child.type === 'group' && child.role === 'pictogram');
    const marks = drawing.children.filter((child) =>
      child.type !== 'group' && child.role === 'pictogram' && child !== drawing.children.at(-1) &&
      !(child.type === 'polyline' && child.style?.fill === 'schwarz') &&
      !(child.type === 'rect' && child.height === 3));
    expect(group).toBeDefined();
    expect(marks.length).toBeGreaterThan(0);
    for (const mark of marks) expect(intersects(boundsOfMm(group!), boundsOfMm(mark))).toBe(false);
  });

  it('lässt die zur Fassung vermessene Körpermarke ohne Notiz', () => {
    const drawing = drawSymbol({
      kind: 'person', organization: 'feuerwehr', strength: 'zug',
      functionRole: 'fire-service-platoon-commander', bodyMarks: ['fire-fighting'],
    });
    expect(drawing.derivations).toBeUndefined();
  });
});

describe('Führungskraft ohne Kürzel (ESZ-116)', () => {
  const LEADER = { kind: 'person', functionRole: 'leader' } as const satisfies SymbolSpec;
  const capOf = (drawing: Drawing) => drawing.children.filter(
    (child) => child.type === 'polyline' && child.role === 'pictogram' && child.style?.fill === 'schwarz',
  );
  const marksOf = (drawing: Drawing) => drawing.children.filter(
    (child) => child.role === 'pictogram' && !capOf(drawing).includes(child),
  );

  it('zeichnet Körper und Kappe des Einsatzleiters ohne Lauf und vermerkt die Konstruktion', () => {
    const leader = drawSymbol({ ...LEADER, organization: 'fuehrung-leitung' });
    const el = drawSymbol(EL_PERSON);
    expect(bodyOf(leader)).toEqual(bodyOf(el));
    expect(capOf(leader)).toEqual(capOf(el));
    expect(flat(leader.children).filter((child) => child.type === 'text')).toEqual([]);
    expect(leader.derivations).toEqual([{
      dimension: 'functionRole',
      part: 'Führungskraft ohne eigenes Original, Raute und Kappe der Leitungsrollen ohne Lauf',
      basis: 'constructed',
      from: 'function-role:incident-commander',
    }]);
  });

  it.each([
    ['D.3.7', 'fire-service-platoon-commander', 'feuerwehr', 'zug', ['fire-fighting']],
    ['D.3.9', 'medical-platoon-commander', 'hilfsorganisation', 'zug', ['medical-service']],
    ['D.3.10', 'operational-unit-platoon-commander', 'hilfsorganisation', 'zug', ['medical-service', 'care']],
    ['D.3.11', 'care-platoon-commander', 'hilfsorganisation', 'zug', ['care']],
    ['D.3.12', 'care-group-commander', 'hilfsorganisation', 'gruppe', ['care']],
  ] as const)('trifft %s bis auf den Trägerlauf: Kopf, Körper, Kappe und randbündige Marken', (
    _section, functionRole, organization, strength, bodyMarks,
  ) => {
    const original = drawSymbol({ kind: 'person', organization, strength, functionRole, bodyMarks });
    const leader = drawSymbol({ ...LEADER, organization, strength, bodyMarks });
    expect(bodyOf(leader)).toEqual(bodyOf(original));
    expect(capOf(leader)).toEqual(capOf(original));
    expect(marksOf(leader)).toEqual(marksOf(original));
    expect(leader.children.filter((child) => child.role === 'head'))
      .toEqual(original.children.filter((child) => child.role === 'head'));
  });

  it.each([
    ['Arzt', { bodyMarks: ['physician'] }],
    ['Sanität', { bodyMarks: ['medical-service'] }],
    ['IuK', { capabilities: ['information-communications'] }],
    ['Logistik', { bodyVariant: 'foot-band' }],
    ['Transport', { capabilities: ['transport'] }],
  ] as const)('trägt die Fachaufgabe %s ohne Stärke in jeder Organisation', (_name, part) => {
    for (const organization of [undefined, 'hilfsorganisation', 'feuerwehr', 'thw', 'fuehrung-leitung'] as const) {
      const drawing = drawSymbol({ ...LEADER, ...part, ...(organization === undefined ? {} : { organization }) });
      expect(capOf(drawing), organization).toHaveLength(1);
      expect(marksOf(drawing).length, organization).toBeGreaterThan(0);
      expect(drawing.derivations, organization)
        .toContainEqual(expect.objectContaining({ dimension: 'functionRole', basis: 'constructed' }));
    }
  });

  it('bleibt an die Person gebunden', () => {
    expect(rulesOf({ ...LEADER, kind: 'formation' })).toContain('function-role-requires-measured-kind');
  });
});

describe('Funktionsrollen: Trägerart bleibt Systematik', () => {
  it('lehnt die Führungskraft an der Formation und jede Rolle an Stelle oder Gebäude ab', () => {
    expect(rulesOf({ ...EL_PERSON, kind: 'formation' })).toContain('function-role-requires-measured-kind');
    expect(rulesOf({ ...EL_FORMATION, kind: 'post' })).toContain('function-role-requires-measured-kind');
    expect(validateSpec({ ...EL_PERSON, kind: 'building' }).map((issue) => issue.rule))
      .toContain('function-role-requires-measured-kind');
  });
});

describe('Trägerlauf auf dem gestreckten Variantenkörper', () => {
  it('bleibt an der Fußband-Person innerhalb der Zeichenfläche', () => {
    const drawing = drawSymbol({
      kind: 'person',
      bodyVariant: 'foot-band',
      functionRole: 'technical-incident-commander',
    });
    for (const child of drawing.children) {
      const box = boundsOfMm(child);
      expect(box.maxX).toBeLessThanOrEqual(32);
      expect(box.maxY).toBeLessThanOrEqual(32);
    }
  });
});
