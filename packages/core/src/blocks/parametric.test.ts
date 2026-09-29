import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { LINE_IDS, MOVEMENT_IDS, type ParametricBlock, type ParametricFinding } from '@einsatzzeichen/schema';
import { PLANNED_PARAMETRIC_RULES } from '../rules/planned-parametric-rules.js';
import { ARROW_BLOCKS, LINE_BLOCKS, PARAMETRIC_BLOCKS, parametricBlock } from './parametric.js';
import { BLOCK_REGISTER, blockEntry } from './register.js';

/**
 * Gate der parametrisierten Bausteine (LFH-566). Die Tabelle nennt Fundorte, Referenzdateien und
 * Regeln; dieser Test prüft, dass sie zum Register, zur Geometrie und zu den vorgemerkten Regeln
 * passt. Die Maße an den Referenzdateien prüft `conformance/src/parametric-fixtures.test.ts`.
 */

const packagesRoot = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');

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

function findingsOf(entry: ParametricBlock): readonly ParametricFinding<unknown>[] {
  return [entry.geometry, entry.carriers, entry.withStateOrTendency];
}

describe('Parametrisierte Bausteine: Tabelle', () => {
  it('führt jeden Wert aus 5.2 und Kapitel 2 genau einmal, in Kapitelreihenfolge', () => {
    expect(PARAMETRIC_BLOCKS.map((entry) => entry.id)).toEqual([
      ...MOVEMENT_IDS.map((id) => `arrow/${id}`),
      ...LINE_IDS.map((id) => `line/${id}`),
    ]);
    expect(PARAMETRIC_BLOCKS.map((entry) => entry.section)).toEqual([
      '5.2.1', '5.2.2', '5.2.3', '5.2.4', '5.2.5', '5.2.6',
      '2.14', '2.15', '2.16', '2.17', '2.18', '2.19', '2.20',
    ]);
  });

  it('steht deckungsgleich im Bausteinregister', () => {
    expect(BLOCK_REGISTER.arrow).toBe(ARROW_BLOCKS);
    expect(BLOCK_REGISTER.line).toBe(LINE_BLOCKS);
    for (const entry of PARAMETRIC_BLOCKS) {
      const registered = blockEntry(entry.id);
      expect(registered?.category, entry.id).toBe(entry.category);
      expect(registered?.valueId, entry.id).toBe(entry.valueId);
      expect(registered?.zone, entry.id).toBe(entry.category === 'arrow' ? 'movement-anchor' : 'freestanding');
      expect(parametricBlock(entry.id)).toBe(entry);
    }
  });

  it('nennt die Geometrie genau dann belegt, wenn das Register eine Zeichnung führt', () => {
    for (const entry of PARAMETRIC_BLOCKS) {
      const status = blockEntry(entry.id)?.binding.status;
      expect(status, entry.id).toBe(entry.geometry.status === 'evidenced' ? 'measured' : 'not-measured');
      expect(entry.geometry.status, entry.id).not.toBe('proposed');
    }
  });

  it('zeigt mit jedem Fundort auf den Eintrag seines Werts', () => {
    for (const entry of [...ARROW_BLOCKS, ...LINE_BLOCKS]) {
      const place = entry.binding.status === 'measured' ? entry.binding.geometry.definedAt : entry.binding.gap.definedAt;
      const key = entry.valueId.includes('-') ? `'${entry.valueId}':` : `${entry.valueId}:`;
      expect(linesAt(place), `${entry.id} → ${place}`).toContain(key);
    }
  });

  it('nennt den Abschnitt am Anfang jeder Referenzdatei und in jeder Herkunftsaussage', () => {
    for (const entry of PARAMETRIC_BLOCKS) {
      for (const asset of entry.assets) expect(asset.startsWith(`${entry.section}_`), asset).toBe(true);
      const binding = blockEntry(entry.id)?.binding;
      const text = binding?.status === 'measured' ? binding.geometry.note : binding?.gap.reason;
      expect(text?.startsWith(`${entry.section}:`), entry.id).toBe(true);
    }
  });

  it('führt die Parameter je Art: Pfeile mit Anbindung, nur 2.20 mit Stärke', () => {
    for (const entry of PARAMETRIC_BLOCKS) {
      expect(entry.parameters[0], entry.id).toBe('path');
      expect(entry.parameters.includes('anchor'), entry.id).toBe(entry.category === 'arrow');
      expect(entry.parameters.includes('strength'), entry.id).toBe(entry.id === 'line/boundary-with-strength');
    }
  });

  it('begründet jede Aussage und belegt jede belegte mit einer eigenen Referenzdatei', () => {
    for (const entry of PARAMETRIC_BLOCKS) {
      for (const finding of findingsOf(entry)) {
        if (finding.status === 'open') expect(finding.question.trim(), entry.id).not.toBe('');
        if (finding.status === 'proposed') expect(finding.reason.trim(), entry.id).not.toBe('');
        if (finding.status === 'evidenced') {
          for (const evidence of finding.evidence) {
            // Eine Referenzdatei des Bausteins selbst, oder ein Fundort im Quelltext, der eine andere
            // Referenz ausweist (die Anbindung an die Personenraute ist an 5.8.8.12 bis 5.8.8.14 belegt).
            if ('asset' in evidence) expect(entry.assets.includes(evidence.asset), entry.id).toBe(true);
            else expect(linesAt(evidence.definedAt), `${entry.id} → ${evidence.definedAt}`).toContain(evidence.note.split(':')[0]);
          }
        }
        if (finding.status === 'decided') {
          expect(finding.decidedOn, entry.id).toBe('2026-09-29');
          expect(finding.ref, entry.id).toMatch(/^docs\/decisions\/2026-09-28-lfh-566-bewegung-linien-grenzen\.md §/);
        }
      }
    }
  });

  it('benutzt nur vorgemerkte Regeln, und jede vorgemerkte Regel wird benutzt', () => {
    const planned = PLANNED_PARAMETRIC_RULES.map((rule) => rule.id);
    const used = new Set(PARAMETRIC_BLOCKS.flatMap((entry) => entry.rules));
    expect([...used].filter((id) => !planned.includes(id))).toEqual([]);
    expect(planned.filter((id) => !used.has(id))).toEqual([]);
    for (const entry of PARAMETRIC_BLOCKS) {
      const dimension = entry.category === 'arrow' ? 'movement' : 'lines-and-boundaries';
      for (const id of entry.rules) {
        expect(PLANNED_PARAMETRIC_RULES.find((rule) => rule.id === id)?.dimension, `${entry.id} / ${id}`)
          .toBe(dimension);
      }
    }
  });
});

describe('Parametrisierte Bausteine: festgenagelter Stand', () => {
  it('zählt belegte und offene Aussagen', () => {
    const counts: Record<string, string> = {};
    for (const entry of PARAMETRIC_BLOCKS) {
      counts[entry.id] = findingsOf(entry).map((finding) => finding.status).join(' / ');
    }
    expect(counts).toEqual({
      'arrow/direction-of-action': 'evidenced / decided / open',
      'arrow/start-of-action': 'evidenced / evidenced / open',
      'arrow/directed-movement': 'evidenced / evidenced / open',
      'arrow/movement-both-directions': 'evidenced / decided / open',
      'arrow/end-of-movement': 'evidenced / evidenced / open',
      'arrow/gathering': 'evidenced / decided / open',
      'line/escape-route': 'evidenced / decided / proposed',
      'line/barrier-position': 'evidenced / decided / proposed',
      'line/fire-spread': 'evidenced / decided / proposed',
      'line/boundary-command-area': 'evidenced / decided / proposed',
      'line/boundary-section': 'evidenced / decided / proposed',
      'line/boundary-subsection': 'evidenced / decided / proposed',
      'line/boundary-with-strength': 'evidenced / decided / proposed',
    });
  });
});
