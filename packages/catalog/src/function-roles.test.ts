import { describe, expect, it } from 'vitest';
import { FUNCTION_ROLE_IDS } from '@einsatzzeichen/schema';
import { boundsOfMm } from '@einsatzzeichen/core';
import { FUNCTION_ROLE_DEFINITIONS, functionRole } from './function-roles.js';

describe('functionRole()', () => {
  it('ist ein totaler, unveraenderlicher Resolver fuer exakt alle 25 IDs', () => {
    expect(Object.keys(FUNCTION_ROLE_DEFINITIONS)).toEqual([...FUNCTION_ROLE_IDS]);
    for (const id of FUNCTION_ROLE_IDS) {
      expect(functionRole(id).id).toBe(id);
      expect(Object.isFrozen(functionRole(id))).toBe(true);
      expect(Object.isFrozen(functionRole(id).layout)).toBe(true);
    }
  });

  it('haelt die drei nicht ableitbaren Personenkoerper getrennt', () => {
    const cases = [
      ['care-group-commander', [3, 3, 29, 29]],
      ['hazard-response-forces-director', [3, 5, 29, 31]],
      ['international-relief-operation-director', [5.5, 10, 26.5, 31]],
    ] as const;
    for (const [id, expected] of cases) {
      const bounds = boundsOfMm(functionRole(id).layout.body);
      expect([bounds.minX, bounds.minY, bounds.maxX, bounds.maxY]).toEqual(
        expected.map((value) => expect.closeTo(value, 9)),
      );
    }
  });

  it('traegt D.3.7 als abgesenkten Zugfuehrer mit genau einer erlaubten Koerpermarke', () => {
    const definition = functionRole('fire-service-platoon-commander');
    expect(definition).toMatchObject({
      kind: 'person', expectedHead: 'strength', allowedBodyMarks: ['fire-fighting'],
      layout: { headTopMm: 1, roleRuns: [] },
    });
    const bounds = boundsOfMm(definition.layout.body);
    expect([bounds.minX, bounds.minY, bounds.maxX, bounds.maxY]).toEqual(
      [3, 5, 29, 31].map((value) => expect.closeTo(value, 9)),
    );
  });

  it('bewahrt explizite Tinten und getrennte Rollen-/Traegerlaeufe', () => {
    expect(functionRole('technical-platoon-commander').layout.roleRuns[0]?.ink).toBe('weiss');
    expect(functionRole('technical-incident-commander').layout).toMatchObject({
      roleRuns: [{ content: 'TEL' }], carrierRun: { content: 'AW' },
    });
    expect(functionRole('incident-section-command-north').layout.roleRuns)
      .toMatchObject([{ content: 'EAL' }, { content: 'Nord' }]);
  });

  it('bindet D.1.2 bis D.1.8 an die gemessenen Rollenläufe und ausschließlich die Gruppenköpfe', () => {
    const cases = [
      ['disaster-control-command', ['KatSL'], 'none'],
      ['technical-incident-command-evacuation', ['TEL', 'Evakuierung'], 'none'],
      ['incident-command', ['EL'], 'none'],
      ['incident-section-command-north', ['EAL', 'Nord'], 'none'],
      ['incident-subsection-command', ['UEAL'], 'none'],
      ['technical-incident-command-group', ['TEL'], 'strength'],
      ['fire-service-readiness-command-group', ['Ber'], 'strength'],
    ] as const;
    for (const [id, runs, expectedHead] of cases) {
      const definition = functionRole(id);
      expect(definition.kind).toBe('formation');
      expect(definition.expectedHead).toBe(expectedHead);
      expect(definition.layout.roleRuns.map((run) => run.content)).toEqual(runs);
      expect(definition.layout.decorations).toContainEqual(expect.objectContaining({
        type: 'rect', x: 1, y: 6, width: 30, height: 3,
      }));
    }
    expect(functionRole('fire-service-readiness-command-group').layout.roleRuns[0]?.ink)
      .toBe('funktionslauf-kontrast');
    expect(cases.slice(0, -1).flatMap(([id]) =>
      functionRole(id).layout.roleRuns.map((run) => run.ink))).toEqual([
      'schwarz', 'schwarz', 'schwarz', 'schwarz', 'schwarz', 'schwarz', 'schwarz', 'schwarz',
    ]);
  });
});
