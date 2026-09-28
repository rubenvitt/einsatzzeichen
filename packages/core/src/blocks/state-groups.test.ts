import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import type { StateGroup, StateGroupEvidence, StateGroupFinding } from '@einsatzzeichen/schema';
import { STATE_PICTOGRAMS } from '../geometry/pictograms/states/index.js';
import { PLANNED_STATE_RULES } from '../rules/planned-state-rules.js';
import { BLOCK_REGISTER, blockEntry } from './register.js';
import { STATE_GROUPS, stateGroup, stateGroupOf } from './state-groups.js';

/**
 * Gate der Zustandsgruppen (LFH-565). Die Tabelle nennt Fundorte und Beispielzeichen; dieser Test
 * prüft, dass sie zum Register, zu den Zeichnungen und zu den vorgemerkten Regeln passt. Die
 * Maße an den Beispielen prüft `conformance/src/state-group-fixtures.test.ts`, weil nur dort das
 * Kennzahlenartefakt liegt.
 */

const packagesRoot = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');

const STATE_ENTRIES = [...BLOCK_REGISTER.state, ...BLOCK_REGISTER.tendency];

const PLACE = /^([a-z0-9/.-]+\.ts):(\d+)(?:–(\d+))?$/;

function linesAt(place: string): string {
  const match = PLACE.exec(place);
  if (match === null) throw new Error(`${place}: kein Fundort der Form pfad.ts:zeile[–zeile]`);
  const [, file, from, to] = match as unknown as [string, string, string, string | undefined];
  const path = join(packagesRoot, file);
  if (!existsSync(path)) throw new Error(`${place}: Datei fehlt`);
  const lines = readFileSync(path, 'utf8').split('\n');
  const start = Number(from);
  const end = to === undefined ? start : Number(to);
  if (start < 1 || end < start || end > lines.length) {
    throw new Error(`${place}: Zeilenbereich außerhalb (${lines.length})`);
  }
  return lines.slice(start - 1, end).join('\n');
}

function findingsOf(group: StateGroup): readonly StateGroupFinding<unknown>[] {
  return [group.form, group.zone, group.carriers, group.perSign];
}

function evidenceOf(group: StateGroup): readonly StateGroupEvidence[] {
  return findingsOf(group).flatMap((finding) =>
    finding.status === 'evidenced' ? finding.evidence : [],
  );
}

describe('Zustandsgruppen aus Kapitel 5.8', () => {
  it('führt die neun Abschnitte 5.8.1 bis 5.8.9 in Kapitelreihenfolge', () => {
    expect(STATE_GROUPS.map((group) => group.section)).toEqual([
      '5.8.1',
      '5.8.2',
      '5.8.3',
      '5.8.4',
      '5.8.5',
      '5.8.6',
      '5.8.7',
      '5.8.8',
      '5.8.9',
    ]);
    expect(new Set(STATE_GROUPS.map((group) => group.id)).size).toBe(STATE_GROUPS.length);
    for (const group of STATE_GROUPS) expect(stateGroup(group.id)).toBe(group);
  });

  it('ordnet jeden Zustand und jede Tendenz des Registers genau einer Gruppe gleicher Kategorie zu', () => {
    for (const entry of STATE_ENTRIES) {
      const group = stateGroupOf(entry);
      expect(group, entry.id).toBeDefined();
      expect(group?.category, entry.id).toBe(entry.category);
      const matching = STATE_GROUPS.filter((candidate) =>
        entry.binding.status === 'measured' &&
        (entry.binding.geometry.sourceRefs?.[0]?.section ?? '').startsWith(`${candidate.section}.`),
      );
      expect(matching, entry.id).toHaveLength(1);
    }
    expect(stateGroupOf(BLOCK_REGISTER['base-symbol'][0]!)).toBeUndefined();
  });

  it('zählt je Gruppe die Darstellungen des D.2-Inventars, zusammen 67', () => {
    for (const group of STATE_GROUPS) {
      const depictions = STATE_PICTOGRAMS.filter((definition) =>
        definition.section.startsWith(`${group.section}.`),
      );
      expect(depictions.length, group.section).toBe(group.depictions);
    }
    expect(STATE_GROUPS.reduce((sum, group) => sum + group.depictions, 0)).toBe(67);
    expect(STATE_PICTOGRAMS).toHaveLength(67);
  });

  it('zeigt mit jedem Quelltextbeleg auf einen gültigen Zeilenbereich', () => {
    for (const group of STATE_GROUPS) {
      for (const evidence of evidenceOf(group)) {
        if (!('definedAt' in evidence)) continue;
        expect(() => linesAt(evidence.definedAt), group.id).not.toThrow();
        expect(evidence.note.trim(), group.id).not.toBe('');
      }
    }
  });

  it('belegt die Form am Kopfkommentar der Zeichnung, der den Abschnitt nennt', () => {
    for (const group of STATE_GROUPS) {
      expect(group.form.status, group.id).toBe('evidenced');
      if (group.form.status !== 'evidenced') continue;
      for (const evidence of group.form.evidence) {
        expect('definedAt' in evidence, group.id).toBe(true);
        if (!('definedAt' in evidence)) continue;
        const text = linesAt(evidence.definedAt);
        expect(text.trimStart().startsWith('/**'), group.id).toBe(true);
        expect(text, group.id).toContain(group.section);
      }
    }
  });

  it('nennt als Beleg nur Beispielzeichen, die die Gruppe als Fixture führt — und umgekehrt', () => {
    for (const group of STATE_GROUPS) {
      const cited = new Set(
        evidenceOf(group).flatMap((evidence) => ('asset' in evidence ? [evidence.asset] : [])),
      );
      expect([...cited].sort(), group.id).toEqual([...group.fixtures].sort());
      for (const asset of group.fixtures) {
        expect(asset.startsWith(`${group.section}_Beispiel`), `${group.id}: ${asset}`).toBe(true);
      }
    }
  });

  it('nennt als Träger nur Bausteine, die im Register stehen', () => {
    for (const group of STATE_GROUPS) {
      if (group.carriers.status === 'open') continue;
      for (const carrier of group.carriers.value) {
        expect(blockEntry(carrier), `${group.id}: ${carrier}`).toBeDefined();
      }
    }
  });

  it('verweist auf vorgemerkte Regeln der eigenen Dimension', () => {
    for (const group of STATE_GROUPS) {
      for (const ruleId of [group.rules.carrier, group.rules.limit]) {
        const rule = PLANNED_STATE_RULES.find((candidate) => candidate.id === ruleId);
        expect(rule, `${group.id}: ${ruleId}`).toBeDefined();
        expect(rule?.dimension, `${group.id}: ${ruleId}`).toBe(group.category);
      }
    }
  });

  it('lässt keine offene Frage und keine Empfehlung ohne Text', () => {
    for (const group of STATE_GROUPS) {
      for (const finding of findingsOf(group)) {
        if (finding.status === 'open') expect(finding.question.trim(), group.id).not.toBe('');
        if (finding.status === 'proposed') expect(finding.reason.trim(), group.id).not.toBe('');
        if (finding.status === 'evidenced' && finding.remaining !== undefined) {
          expect(finding.remaining.trim(), group.id).not.toBe('');
        }
      }
    }
  });

  /**
   * Der Stand je Gruppe, festgenagelt. Entscheidet der Eigentümer eine Frage aus
   * `docs/decisions/2026-09-28-lfh-565-kapitel-5-8-bausteine.md`, ändert sich hier eine Zeile —
   * bewusst und nicht still.
   */
  it('hält den Stand je Gruppe fest: Form, Zone, Träger, Grenze', () => {
    const table = Object.fromEntries(
      STATE_GROUPS.map((group) => [
        group.section,
        findingsOf(group).map((finding) => finding.status).join(' | '),
      ]),
    );
    expect(table).toEqual({
      '5.8.1': 'evidenced | evidenced | evidenced | open',
      '5.8.2': 'evidenced | open | open | proposed',
      '5.8.3': 'evidenced | open | open | proposed',
      '5.8.4': 'evidenced | proposed | open | proposed',
      '5.8.5': 'evidenced | open | open | proposed',
      '5.8.6': 'evidenced | evidenced | open | open',
      '5.8.7': 'evidenced | evidenced | evidenced | open',
      '5.8.8': 'evidenced | evidenced | evidenced | open',
      '5.8.9': 'evidenced | open | open | open',
    });
  });

  /**
   * Das Register führt für jeden Zustand die Zielzone `state-margin` und für jede Tendenz
   * `tendency-margin` (LFH-564). Drei Gruppen belegen eine andere Zone. Das Register wird hier
   * nicht umgeschrieben: welche Zone gilt, entscheidet der Eigentümer mit den offenen Fragen.
   * Bis dahin steht die Abweichung als Liste fest.
   */
  it('hält fest, wo die belegte Zone von der Zielzone des Registers abweicht', () => {
    const diverging = STATE_GROUPS.filter((group) => {
      if (group.zone.status !== 'evidenced') return false;
      const zone = group.zone.value;
      return STATE_ENTRIES.some((entry) => stateGroupOf(entry) === group && entry.zone !== zone);
    }).map((group) => `${group.section} ${group.zone.status === 'evidenced' ? group.zone.value : ''}`);
    expect(diverging).toEqual(['5.8.6 freestanding', '5.8.7 freestanding', '5.8.8 body']);
  });

  it('zeichnet Träger mit, genau wo die Form das sagt: Tier und Person', () => {
    const included = STATE_GROUPS.filter(
      (group) => group.form.status === 'evidenced' && group.form.value === 'carrier-included',
    ).map((group) => group.id);
    expect(included).toEqual(['animals', 'persons']);
  });
});
