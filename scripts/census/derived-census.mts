/**
 * Zensus des Kompositionsmotors: zeichnet jede Grundform (Art × Variante) mit genau einem
 * zusätzlichen Feld und zählt, was gezeichnet wird, was mit Regel abgelehnt wird und was als
 * Lücke abbricht. Jede gezeichnete Kombination wird zusätzlich geometrisch geprüft:
 *
 * - keine NaN- oder unendlichen Koordinaten,
 * - jedes Primitiv innerhalb der ViewBox der Zeichnung (Toleranz 0,6 mm für Strichbreite),
 * - Fähigkeits- und Körpermarkenpiktogramme innerhalb der Körperhülle (Toleranz 0,6 mm);
 *   Zustände stehen bewusst in Randlagen und werden hier nicht gegen den Körper geprüft.
 *
 * Aufruf: `./node_modules/.bin/tsx scripts/census/derived-census.mts [--json out.json] [--axis name]`
 * Läuft gegen den Quellstand des Worktrees, in dem das Skript liegt.
 */
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../../packages/', import.meta.url));
const s: any = await import(root + 'schema/src/index.ts');
const core: any = await import(root + 'core/src/index.ts');
const { drawSymbol, CompositionError, NotMeasuredError, boundsOfMm } = core;

const args = process.argv.slice(2);
const jsonOut = args.includes('--json') ? args[args.indexOf('--json') + 1] : undefined;
const onlyAxis = args.includes('--axis') ? args[args.indexOf('--axis') + 1] : undefined;

const kinds: string[] = [...s.SYMBOL_KINDS];
const variants: (string | undefined)[] = [undefined, ...s.BODY_VARIANT_IDS];
const adds: [string, any][] = [['none', {}]];
for (const v of s.STRENGTH_IDS) adds.push(['strength', { strength: v }]);
for (const v of s.ORGANIZATION_IDS) adds.push(['organization', { organization: v }]);
adds.push(['technicalFill', { technicalFill: 'rot' }]);
adds.push(['whiteInnerContour', { technicalFill: 'rot', whiteInnerContour: true }]);
for (const v of s.TECHNICAL_HEAD_MARK_IDS) adds.push(['technicalHeadMark', { technicalHeadMark: v }]);
for (const v of s.ADMIN_LEVEL_IDS) adds.push(['administrativeLevel', { administrativeLevel: v }]);
for (const v of s.UNIT_GROUPING_IDS) adds.push(['unitGrouping', { unitGrouping: v }]);
for (const v of s.VEHICLE_CATEGORY_IDS) adds.push(['vehicleCategory', { vehicleCategory: v }]);
for (const v of s.CAPABILITY_IDS) adds.push(['capabilities', { capabilities: [v] }]);
for (const v of s.CAPABILITY_IDS) adds.push(['bodyMarks(cap)', { bodyMarks: [v] }]);
for (const v of s.TECHNICAL_BODY_MARK_IDS) adds.push(['bodyMarks(tech)', { bodyMarks: [v] }]);
for (const v of s.STATE_IDS) adds.push(['states', { states: [v] }]);
for (const v of s.TENDENCY_IDS) adds.push(['tendency', { tendency: v }]);
for (const v of s.FUNCTION_ROLE_IDS) adds.push(['functionRole', { functionRole: v }]);
adds.push(['designation', { designation: 'ABC' }]);
for (const z of ['center', 'topLeft', 'bottomLeft', 'bottomCenter', 'bottomRight', 'aboveLeft', 'belowRight', 'surfaceBelowLeft', 'surfaceBelowRight']) {
  adds.push(['labels.' + z, { labels: { [z]: 'AB' } }]);
}
adds.push(['labels.topLeftLines', { labels: { topLeftLines: ['A', 'B'] } }]);
// Zwei Mehrfeldproben aus dem Anlass vom 02.10.2026 (Leitstelle).
adds.push(['combo.leitstelle', { organization: 'fuehrung-leitung', labels: { center: 'LST', bottomRight: 'UEL' } }]);
adds.push(['combo.state+org', { organization: 'feuerwehr', states: ['suspected-situation'] }]);

const TOL = 0.6;
const inc = (m: Map<string, number>, k: string) => m.set(k, (m.get(k) ?? 0) + 1);
const flat = (ps: readonly any[]): any[] => ps.flatMap((p) => (p.type === 'group' ? [p, ...flat(p.children)] : [p]));
const finite = (v: unknown): boolean => {
  if (typeof v === 'number') return Number.isFinite(v);
  if (Array.isArray(v)) return v.every(finite);
  if (v && typeof v === 'object') return Object.values(v).every(finite);
  return true;
};

const byAxis = new Map<string, { total: number; drawn: number; derived: number; rule: number; nm: number; other: number; bad: number }>();
const rules = new Map<string, number>();
const gaps = new Map<string, number>();
const others = new Map<string, number>();
const violations: string[] = [];
let total = 0, drawn = 0, derived = 0;

for (const kind of kinds) for (const bodyVariant of variants) for (const [axis, add] of adds) {
  if (onlyAxis !== undefined && !axis.startsWith(onlyAxis)) continue;
  const spec: any = { kind, ...(bodyVariant ? { bodyVariant } : {}), ...add };
  const a = byAxis.get(axis) ?? { total: 0, drawn: 0, derived: 0, rule: 0, nm: 0, other: 0, bad: 0 };
  byAxis.set(axis, a);
  total++; a.total++;
  try {
    const d = drawSymbol(spec);
    drawn++; a.drawn++;
    if (d.derivations?.length) { derived++; a.derived++; }
    const prims = flat(d.children);
    const label = JSON.stringify(spec);
    const problems: string[] = [];
    if (!prims.every((p) => finite(p))) problems.push('NaN/∞');
    const body = prims.find((p) => p.role === 'body');
    const bb = body ? boundsOfMm(body) : undefined;
    for (const p of prims) {
      // Die Fußzeile trägt ihre Textbox bekannt über die ViewBox hinaus (siehe compose.ts, Kommentar
      // zur Fußzone); das viewBox-Gate meldet sie dort. Hier zählt nur neue Geometrie.
      if (p.type === 'group' || p.role === 'foot') continue;
      const b = boundsOfMm(p);
      if (!Number.isFinite(b.minX)) continue;
      const vw = d.viewBox.width, vh = d.viewBox.height;
      if (b.minX < -TOL || b.minY < -TOL || b.maxX > vw + TOL || b.maxY > vh + TOL) {
        problems.push(`außerhalb ViewBox ${vw}×${vh}: ${p.role ?? p.type} ${[b.minX, b.minY, b.maxX, b.maxY].map((n: number) => n.toFixed(2)).join('/')}`);
      }
      // Vermessene Fassungen dürfen über den Körper reichen, wenn die Referenz es so zeigt (etwa das
      // Radpaar unter dem eingesenkten Rumpf, I.3.4); geprüft wird nur, wo Marke oder Piktogramm
      // selbst abgeleitet ist.
      if (p.role === 'pictogram' && bb && d.derivations?.some((n: any) => n.dimension === 'bodyMarks' || n.dimension === 'capabilities') && (axis.startsWith('capabilities') || axis.startsWith('bodyMarks')) && (b.minX < bb.minX - TOL || b.minY < bb.minY - TOL || b.maxX > bb.maxX + TOL || b.maxY > bb.maxY + TOL)) {
        problems.push(`Piktogramm über Körper: ${[b.minX, b.minY, b.maxX, b.maxY].map((n: number) => n.toFixed(2)).join('/')}`);
      }
    }
    // Kopf gegen alles andere: die Kopfzone steht über Körper, Zusatzgeometrie, Marken und Läufen.
    const heads = prims.filter((p) => p.role === 'head' && p.type !== 'group');
    const base = prims.filter((p) => p.role !== 'head' && p.role !== 'foot' && p.type !== 'group');
    for (const h of heads) {
      const hb = boundsOfMm(h);
      for (const q of base) {
        const qb = boundsOfMm(q);
        if (hb.minX < qb.maxX - TOL && qb.minX < hb.maxX - TOL && hb.minY < qb.maxY - TOL && qb.minY < hb.maxY - TOL) {
          problems.push(`Kopf überschneidet ${q.role ?? q.type}: ${[hb.minX, hb.minY, hb.maxX, hb.maxY].map((n: number) => n.toFixed(2)).join('/')}`);
        }
      }
    }
    if (problems.length) { a.bad++; violations.push(`${label}: ${[...new Set(problems)].slice(0, 3).join('; ')}`); }
  } catch (e: any) {
    if (e instanceof CompositionError) {
      a.rule++;
      for (const id of new Set(e.issues.map((i: any) => i.rule) as string[])) inc(rules, id);
    } else if (e instanceof NotMeasuredError || e?.name === 'BodyNotMeasuredError') {
      a.nm++;
      inc(gaps, String(e.message).replace(/"[^"]*"/g, '"…"').slice(0, 100));
    } else {
      a.other++;
      inc(others, `${e?.name}: ${String(e?.message).slice(0, 100)}`);
    }
  }
}

const top = (m: Map<string, number>, n = 25) => [...m.entries()].sort((x, y) => y[1] - x[1]).slice(0, n);
console.log(`GESAMT ${total}  gezeichnet ${drawn}  davon derived ${derived}  Verstöße ${violations.length}`);
console.log('\nAchse                 gesamt  gezeichn derived   Regel  Lücke  sonst  Verstöße');
for (const [axis, a] of [...byAxis.entries()]) {
  console.log(`${axis.padEnd(20)} ${String(a.total).padStart(7)} ${String(a.drawn).padStart(8)} ${String(a.derived).padStart(7)} ${String(a.rule).padStart(7)} ${String(a.nm).padStart(6)} ${String(a.other).padStart(6)} ${String(a.bad).padStart(9)}`);
}
console.log('\nRegeln (häufigste):'); for (const [k, v] of top(rules)) console.log(String(v).padStart(7), k);
console.log('\nLücken (häufigste):'); for (const [k, v] of top(gaps)) console.log(String(v).padStart(7), k);
if (others.size) { console.log('\nANDERE FEHLER (Absturz statt Regel/Lücke):'); for (const [k, v] of top(others)) console.log(String(v).padStart(7), k); }
if (violations.length) { console.log('\nGEOMETRIEVERSTÖSSE (erste 40):'); for (const v of violations.slice(0, 40)) console.log('  ' + v); }
if (jsonOut) writeFileSync(jsonOut, JSON.stringify({ total, drawn, derived, byAxis: Object.fromEntries(byAxis), rules: Object.fromEntries(rules), gaps: Object.fromEntries(gaps), others: Object.fromEntries(others), violations }, null, 2));
