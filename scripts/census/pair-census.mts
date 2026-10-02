/**
 * Zensus über Feldpaare: jede zeichenbare Grundform × Kopfangabe × Beschriftung, im Wechsel mit
 * Organisation, Fähigkeit, Körpermarke, Zustand oder Tendenz (rund 118 000 Specs). Jede gezeichnete
 * Spec durchläuft die Platzprüfung aus core/src/derive/layout-guard.ts, auch vermessene, dazu
 * eine Prüfung auf NaN. Ergänzt den Einfeld-Zensus (derived-census.mts): Die Fehlzeichnungen vom
 * 2. Oktober 2026 entstanden erst im Zusammenspiel mehrerer Felder.
 *
 * Aufruf: `./node_modules/.bin/tsx scripts/census/pair-census.mts`
 */
import { fileURLToPath } from 'node:url';

const R = fileURLToPath(new URL('../../packages/', import.meta.url));
const s: any = await import(R + 'schema/src/index.ts');
const core: any = await import(R + 'core/src/index.ts');
const { drawSymbol, CompositionError, NotMeasuredError, boundsOfMm } = core;
const TOL = 0.3;
const flat = (ps: readonly any[]): any[] => ps.flatMap((p) => (p.type === 'group' ? [p, ...flat(p.children)] : [p]));
const finite = (v: unknown): boolean => typeof v === 'number' ? Number.isFinite(v) : Array.isArray(v) ? v.every(finite) : v && typeof v === 'object' ? Object.values(v).every(finite) : true;
const hit = (a: any, b: any) => a.minX < b.maxX - TOL && b.minX < a.maxX - TOL && a.minY < b.maxY - TOL && b.minY < a.maxY - TOL;
const guard: any = await import(R + 'core/src/derive/layout-guard.ts');
const metrics: any = (await import(R + 'core/src/geometry/text-metrics.ts')).ARIMO_TEXT_METRICS;
const tm: any = await import(R + 'core/src/text-metrics.ts');
const CAP = 1409 / 2048;
// Tintenfläche eines Laufs: Versalhöhe über der Grundlinie, Breite aus den Schriftmetriken.
const textBox = (t: any) => {
  const w = tm.textWidthMm(t.content, t.sizeMm, metrics).widthMm;
  const x0 = t.anchor === 'middle' ? t.x - w / 2 : t.anchor === 'end' ? t.x - w : t.x;
  return { minX: x0, minY: t.y - t.sizeMm * CAP, maxX: x0 + w, maxY: t.y };
};
// Basen: jede Art × Variante, die nackt zeichnet
const bases: any[] = [];
for (const kind of s.SYMBOL_KINDS) for (const v of [undefined, ...s.BODY_VARIANT_IDS]) {
  const b = { kind, ...(v ? { bodyVariant: v } : {}) };
  try { drawSymbol(b); bases.push(b); } catch {}
}
const heads: any[] = [{}, ...s.STRENGTH_IDS.map((x: any) => ({ strength: x })), ...s.ADMIN_LEVEL_IDS.map((x: any) => ({ administrativeLevel: x })), ...s.UNIT_GROUPING_IDS.map((x: any) => ({ unitGrouping: x })), ...s.TECHNICAL_HEAD_MARK_IDS.map((x: any) => ({ technicalHeadMark: x }))];
const zones = ['center', 'topLeft', 'bottomLeft', 'bottomCenter', 'bottomRight', 'aboveLeft', 'belowRight', 'surfaceBelowLeft', 'surfaceBelowRight'];
const labelSets: any[] = [{}, ...zones.map((z) => ({ labels: { [z]: 'AB' } })), { labels: { center: 'LST', bottomRight: 'UEL' } }, { labels: { center: 'AB', topLeft: 'C', bottomLeft: 'D', bottomRight: 'E' } }, { designation: 'ABC' }];
const orgs: any[] = [{}, { organization: 'feuerwehr' }, { organization: 'fuehrung-leitung' }, { organization: 'hilfsorganisation' }];
const extras: any[] = [{}, { capabilities: ['foam-agent'] }, { bodyMarks: ['medical-service'] }, { states: ['suspected-situation'] }, { tendency: 'tendency-rising' }];
let total = 0, drawn = 0, rule = 0, nm = 0;
const other = new Map<string, number>(); const byBase = new Map<string, number>(); const samples = new Map<string, string>(); const viol: string[] = []; const vkinds = new Map<string, number>();
for (const b of bases) for (const h of heads) for (const l of labelSets) for (const o of orgs) for (const e of extras) {
  // Stichprobe: alle Köpfe × Labels, aber Organisation/Extra nur im Wechsel
  if (Object.keys(o).length && Object.keys(e).length) continue;
  const spec: any = { ...b, ...h, ...l, ...o, ...e };
  total++;
  let d: any;
  try { d = drawSymbol(spec); drawn++; } catch (err: any) {
    if (err instanceof CompositionError) rule++; else if (err instanceof NotMeasuredError) nm++;
    else { const k = `${err?.name}: ${String(err?.message).slice(0, 90)}`; other.set(k, (other.get(k) ?? 0) + 1); }
    continue;
  }
  const probs: string[] = [];
  if (!flat(d.children).every(finite)) probs.push('NaN');
  try { guard.assertDerivedLayoutFits({ ...d, derivations: [{ dimension: 'x', part: 'x', basis: 'constructed', from: 'x' }] }, metrics); }
  catch (err: any) { probs.push(String(err.message).replace(/^Diese Zusammenstellung findet abgeleitet keinen Platz: /, '').replace(/\. Kein Original.*/, '')); }
  if (probs.length) { if (!d.derivations?.length) probs.push('VERMESSEN'); const u = [...new Set(probs)]; for (const k of u) { const kk = k.replace(/"[^"]*"/g, '"…"'); vkinds.set(kk, (vkinds.get(kk) ?? 0) + 1); const bk = kk + ' @ ' + spec.kind + '/' + (spec.bodyVariant ?? '-') + (Object.keys(h).length ? ' +' + Object.keys(h)[0] : ''); byBase.set(bk, (byBase.get(bk) ?? 0) + 1); if (!samples.has(bk)) samples.set(bk, JSON.stringify(spec)); } if (viol.length < 60) viol.push(JSON.stringify(spec) + ': ' + u.slice(0, 3).join('; ')); }
}
console.log(`Basen ${bases.length}  Specs ${total}  gezeichnet ${drawn}  Regel ${rule}  Lücke ${nm}  andere ${[...other.values()].reduce((a, b) => a + b, 0)}`);
console.log('Verstoßarten:', JSON.stringify(Object.fromEntries([...vkinds.entries()].sort((a, b) => b[1] - a[1]))));
for (const [k, v] of other) console.log('ANDERS', v, k);
for (const [k, v] of [...byBase.entries()].sort((a, b) => b[1] - a[1])) console.log(String(v).padStart(6), k, '  z.B.', samples.get(k));
