# Piktogramm-Mechanismus (Slice 3, D.0) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Der Kompositionsmotor kann Pfad-Piktogramme mit deklarierter Hüllbox platzieren, drei Gates prüfen sie, und ein echtes Kurven-Piktogramm belegt den Mechanismus.

**Architecture:** Piktogramme werden nicht mehr primitivweise verschoben (`shiftY`, wirft für Pfade), sondern von genau einer Gruppe umschlossen, die die Verschiebung als `Transform.translate` trägt. `translate` landet gleichzeitig in beiden Renderern und in der Hüllberechnung, damit aus einer IR nicht zwei Bilder entstehen. Ein Piktogramm ist eine `PictogramDefinition` mit vom Autor zugesicherter Hüllbox; drei Gates (Kommando, Box, Clipping) machen diese Zusicherung prüfbar.

**Tech Stack:** TypeScript 5.9 (strict, `verbatimModuleSyntax`, `noUnusedLocals`, `noUnusedParameters`), vitest 3.2, pnpm-Workspace mit vier Paketen. Keine Laufzeitabhängigkeiten in `schema` und `core`.

**Spec:** `docs/superpowers/specs/2026-08-05-piktogramme-und-katalogausbau-design.md` — Abschnitt 12 grenzt D.0 ab.

## Global Constraints

- **Paketrichtung `cli → catalog → core → schema`.** Keine Gegenrichtung, kein neues Paket. `schema` und `core` behalten **null Laufzeitabhängigkeiten**.
- **Alle Längen im IR sind Millimeter.** Umrechnung ausschließlich im Renderer (`mmToUnits`, `UNITS_PER_MM = 72 / 25.4`).
- **Vergleiche von Koordinaten laufen in SVG-Einheiten gegen `TOLERANCE_UNITS = 0.01`**, nicht mit `===` auf Millimetern. Muster: `unitsEqual(mmToUnits(a), mmToUnits(b))`.
- **Autorenkonvention für jeden Piktogramm-`d`-String:** nur absolute Kommandos, nur `M L H V C Q Z`, Koordinaten in Millimetern. `A`, `S`, `T` und alle relativen Kommandos sind ausgeschlossen (Spec Abschnitt 5).
- **Kein Test darf `taktische-zeichen/` lesen.** Das Verzeichnis ist gitignored; CI läuft auf Rechnern ohne Referenzbestand (Erfolgskriterium 8). Kennzahlen kommen ausschließlich aus dem eingecheckten `packages/catalog/src/fingerprints.json`.
- **Keine Geometrie aus der Referenz übernehmen.** Piktogramm-Koordinaten sind eigenständig konstruiert (`SourceStatus: 'derived'`, `GeometryUse: 'reconstructed'`). Keine Zahl darf aus dem `d`-String einer Referenzdatei oder aus `phjardas/taktische-zeichen` stammen.
- **Kein Eintrag ohne Beleg, kein Feld ohne Konsument.** Register mit Lücken sind `Partial<Record<…>>` mit werfendem Zugriff (Muster: `ORGANIZATION_COLORS`, `BODIES`), Register ohne Lücken sind `satisfies Record<…>` (Muster: `SOURCE_REGISTRY`).
- **Fehlermeldungen und Kommentare auf Deutsch**, IDs und Typnamen auf Englisch (Spec Abschnitt 6).
- **Commit-Sprache:** Conventional Commits mit deutschem Betreff, wie in der bestehenden Historie (`feat: Slice 2 — Provenienz-Fundament`).
- **Kommandos:** `pnpm test` (= `vitest run`), `pnpm typecheck` (= `tsc --noEmit`), `pnpm vitest run <pfad>` für einzelne Dateien, `pnpm vitest run <pfad> -t "<name>"` für einzelne Tests, `pnpm cli coverage` für das Coverage-Gate.

## Vier Festlegungen, die die Spec offengelassen oder zu optimistisch formuliert hat

Diese Punkte sind am Code verifiziert. Sie sind **Teil des Plans**, nicht Abweichungen davon — wer sie beim Review als Auslassung liest, liest falsch.

1. **Erfolgskriterium 2 der Spec („der bestehende Snapshot bleibt unverändert grün") ist so nicht haltbar.** `packages/catalog/src/__snapshots__/C.1.1.svg` trägt die drei Piktogramm-Linien als direkte `<svg>`-Kinder. Nach der Gruppen-Umklammerung stehen sie in einem `<g transform="translate(…)">`. Die **haltbare** Invariante, und damit die Zusage dieses Plans: *die effektiven Koordinaten bleiben identisch, und der Snapshot-Diff besteht ausschließlich aus der Umklammerung.* Task 8 prüft das an konkreten Zahlen, statt `-u` laufen zu lassen und das Ergebnis zu glauben.

2. **`recipes.test.ts` bricht strukturell und wird angepasst, nicht umgangen.** Zeile 84 (`filter(c => c.role === 'pictogram')`) liefert künftig genau die Gruppe, Zeile 104 (`find(isHorizontalPictogramLine)`) findet nichts mehr, weil die Linie in der Gruppe sitzt. Task 8 schreibt die Assertion so um, dass sie die **effektive** y-Lage prüft (`line.y1 + translate.dyMm`) — dieselbe fachliche Aussage, eine Ebene tiefer gelesen.

3. **Das Clipping-Gate prüft gegen einen rechteckigen, unrotierten Körper und wirft für alles andere.** Die Spec sagt „innerhalb der Körperfläche". Bei `formation` (rect 1…31 × 6…26) fällt Fläche und Hülle zusammen; bei `hazard`, `measure`, `point` (Polygone) und `person` (gedrehtes Quadrat) nicht — eine Box innerhalb der Hülle kann aus dem Dreieck ragen. Eine hüllenbasierte Prüfung als Flächenprüfung auszugeben wäre genau die Behauptung, die dieses Projekt vermeidet. Das Gate folgt deshalb dem Projektidiom von `circleBodyProfile` und `boundsOfMm`-Gruppendrehung: exakt, wo vermessen, und ein expliziter Fehler, wo nicht.

4. **`snapshotTest: true` (Spec Abschnitt 8) wird durch echte Dateisnapshots eingelöst.** Heute tragen alle zwölf Element-Einträge `snapshotTest: false` mit ausführlicher Begründung (`coverage-manifest.ts:71-78`). Für Piktogramme wäre `true` ohne Snapshot eine Falschaussage — Task 11 legt deshalb je Piktogramm einen Dateisnapshot an (auch für `capability.fire-fighting`) und leitet das Flag aus der Elementart ab. `withoutTestEvidence` listet die Piktogramme weiterhin, weil `fingerprintTest: false` bleibt; das ist beabsichtigt und wird **nicht** „behoben".

Zwei kleinere Festlegungen:

- **„In beiden Rezepten platziert" (Spec Abschnitt 10) heißt Testkompositionen, nicht Erweiterung von `RECIPES`.** Eine Löschstaffel hat kein Brauchwasser-Piktogramm, und `RECIPES['C.1.1']` beansprucht, `C.1.1_Löschstaffel.svg` zu reproduzieren. Task 9 spielt stattdessen beide Layoutfälle durch (Stapel = Körper verschoben, Reihe = Körper unverschoben) und prüft die Platzierung dort.
- **Die vier ID-Räume `state.`, `comms.`, `damage.`, `wildfire.` entstehen in D.0 ohne Literale** (`type StateId = never` usw.). Das ist eine bewusste Ausnahme von „kein Feld ohne Konsument": Spec Abschnitt 12 nennt „die fünf ID-Präfixe" ausdrücklich als Umfang von D.0, weil sie der Vertrag sind, an dem D.1–D.4 anknüpfen, ohne die Aufteilung je neu zu entscheiden. Typseitig kollabiert `` `state.${never}` `` zu `never`, die Union bleibt also exakt `` `capability.${CapabilityId}` `` — verifiziert.

## File Structure

| Datei | Verantwortung | Status |
|---|---|---|
| `packages/schema/src/geometry.ts` | `Translation`, `Transform.translate` | erweitert (Task 1) |
| `packages/schema/src/pictogram.ts` | `PictogramBox`, `PictogramDefinition`, `PictogramId` und die fünf ID-Räume | **neu** (Task 4) |
| `packages/schema/src/index.ts` | Re-Export von `./pictogram.js` | erweitert (Task 4) |
| `packages/schema/src/taxonomy.ts` | `CapabilityId` wächst um `'service-water'` | erweitert (Task 9) |
| `packages/schema/src/sources.ts` | `'open-source-corpus'`, `'compared-only'` | erweitert (Task 10) |
| `packages/schema/src/provenance.ts` | `SourceId` wächst um `'phjardas-tz'` | erweitert (Task 10) |
| `packages/core/src/bounds.ts` | `translate` an Gruppen in `rawBoundsOfMm`; expliziter Fehler an Nicht-Gruppen | erweitert (Task 1) |
| `packages/core/src/render/svg.ts` | `translate` in `transformAttr`, links von `rotate` | erweitert (Task 2) |
| `packages/core/src/render/canvas.ts` | `ctx.translate` vor dem Rotationsblock | erweitert (Task 3) |
| `packages/core/src/path-commands.ts` | Kommando-Tokenizer: `d`-String → Kommandoliste je Kommando, kein Bezier-Auswerter | **neu** (Task 4) |
| `packages/core/src/pictogram-gate.ts` | Kommando-, Box- und Clipping-Prüfung | **neu** (Tasks 4–6) |
| `packages/core/src/compose.ts` | Piktogramm-Gruppe statt `shiftY`-Abbildung; `pictogram`-Port | erweitert (Task 8) |
| `packages/core/src/index.ts` | Re-Export der zwei neuen Module | erweitert (Tasks 4) |
| `packages/catalog/src/pictograms/capabilities.ts` | Piktogramme des Kapitels 4 als `PictogramDefinition` | **neu**, ersetzt `capabilities.ts` (Task 7) |
| `packages/catalog/src/pictograms/index.ts` | `PICTOGRAMS` als `Partial<Record<…>>`, `pictogram(id)` mit Wurf-Semantik, `ALL_PICTOGRAMS` | **neu** (Task 7) |
| `packages/catalog/src/pictograms/gate.test.ts` | Jedes Piktogramm des Katalogs durch alle drei Gates | **neu** (Task 7) |
| `packages/catalog/src/sources.ts` | Registereintrag `phjardas-tz` | erweitert (Task 10) |
| `packages/catalog/src/elements.ts` | vier neue `ElementKind`s, `PICTOGRAM_ELEMENT_KINDS`, Eintrag für das neue Piktogramm | erweitert (Task 11) |
| `packages/catalog/src/coverage-manifest.ts` | `scope` um `'4.3.2'`, Piktogramm-Review, `snapshotTest` aus der Elementart | erweitert (Task 11) |
| `packages/catalog/src/coverage-gate.ts` | `releaseBlockers` zählt zusätzlich nach Bereich | erweitert (Task 12) |
| `packages/cli/src/commands/coverage.ts` | Bereichszählung ausgeben | erweitert (Task 12) |

`packages/catalog/src/capabilities.ts` und `capabilities.test.ts` werden in Task 7 per `git mv` nach `pictograms/` verschoben — der Aufrufname `capabilityPictogram` verschwindet erst in Task 8, damit Task 7 für sich grün ist.

---

## Task 1: `translate` in der Hüllberechnung

Erster Task, weil alles Weitere darauf steht: ohne Gruppen-`translate` in `rawBoundsOfMm` liefert `boundsOfMm` auf der Piktogramm-Gruppe `EMPTY_BOUNDS`, und jede Assertion auf der Piktogramm-Mitte in Task 8 bricht aus dem falschen Grund.

Der Schema-Typ hat allein keinen Laufzeittest und liegt deshalb in diesem Task, bei seinem ersten Konsumenten.

**Files:**
- Modify: `packages/schema/src/geometry.ts:46-48` (`Transform`)
- Modify: `packages/core/src/bounds.ts:65-118` (`rawBoundsOfMm`)
- Test: `packages/core/src/bounds.test.ts` (anfügen)

**Interfaces:**
- Consumes: `Primitive`, `Rotation`, `Length` aus `@einsatzzeichen/schema`; `BoundsMm`, `merge`, `EMPTY_BOUNDS` aus `bounds.ts`
- Produces:
  - `interface Translation { dxMm: Length; dyMm: Length }` (exportiert aus `schema/src/geometry.ts`)
  - `Transform.translate?: Translation`
  - `boundsOfMm(primitive)` verschiebt die Kinderhülle einer Gruppe mit `translate` um `dxMm`/`dyMm`; `undefined` bleibt `undefined`; `translate` an einem Nicht-Gruppen-Primitiv wirft.

- [ ] **Step 1: Die drei failing tests schreiben**

An `packages/core/src/bounds.test.ts` anfügen:

```ts
describe('boundsOfMm — Verschiebung von Gruppen', () => {
  it('verschiebt die Hülle einer Gruppe um dxMm und dyMm', () => {
    const group: Primitive = {
      type: 'group',
      transform: { translate: { dxMm: 2, dyMm: 3 } },
      children: [{ type: 'rect', x: 1, y: 6, width: 30, height: 20 }],
    };
    expect(boundsOfMm(group)).toEqual({ minX: 3, minY: 9, maxX: 33, maxY: 29 });
  });

  it('lässt eine Gruppe aus reinen Pfaden nicht vergleichbar, auch mit Verschiebung', () => {
    // Die Nichtvergleichbarkeit wird strukturell weitergereicht: eine Verschiebung darf aus
    // "keine Ausdehnung" nicht die Zahl 3 machen, sonst verfälschte eine Piktogramm-Gruppe
    // aus Pfaden die Hülle ihrer Geschwister.
    const group: Primitive = {
      type: 'group',
      transform: { translate: { dxMm: 0, dyMm: 3 } },
      children: [{ type: 'path', d: 'M 4 4 L 8 8' }],
    };
    expect(boundsOfMm(group)).toEqual({ minX: 0, minY: 0, maxX: 0, maxY: 0 });
  });

  it('lehnt eine Verschiebung an einem Primitiv ab, das keine Gruppe ist', () => {
    const shifted: Primitive = {
      type: 'rect',
      x: 1,
      y: 6,
      width: 30,
      height: 20,
      transform: { translate: { dxMm: 0, dyMm: 3 } },
    };
    expect(() => boundsOfMm(shifted)).toThrow(/nur an Gruppen/);
  });
});
```

Falls `Primitive` in dieser Datei noch nicht importiert ist, den bestehenden Import um `type Primitive` erweitern.

- [ ] **Step 2: Tests laufen lassen und den Fehlgrund prüfen**

Run: `pnpm vitest run packages/core/src/bounds.test.ts`
Expected: Die erste Zusicherung schlägt fehl (erhält `{minX:1,minY:6,maxX:31,maxY:26}` statt der verschobenen Hülle), die dritte schlägt fehl (wirft nicht). Die zweite ist schon grün — sie hält den Regressionsschutz für Step 3 und muss grün **bleiben**.

Zusätzlich `pnpm typecheck`: muss an `translate` scheitern („Object literal may only specify known properties"). Das belegt, dass der Typ fehlt und der Test nicht versehentlich am falschen Feld hängt.

- [ ] **Step 3: `Translation` im Schema deklarieren**

In `packages/schema/src/geometry.ts`, direkt nach `Rotation`:

```ts
/**
 * Verschiebung in Millimetern. Ausschließlich an Gruppen belegt: an einem Primitiv, das zugleich
 * `rotate` trägt, hätte sie dasselbe Problem wie `shiftY` — sie träfe die Koordinate, nicht das
 * Rotationszentrum. Auf der Gruppe wirkt sie nach außen auf das fertige Ergebnis und ist damit
 * von der Drehung der Kinder unabhängig.
 */
export interface Translation {
  dxMm: Length;
  dyMm: Length;
}

export interface Transform {
  rotate?: Rotation;
  translate?: Translation;
}
```

Die bestehende `Transform`-Deklaration (`geometry.ts:46-48`) ersetzen, nicht doppeln.

- [ ] **Step 4: `rawBoundsOfMm` erweitern**

In `packages/core/src/bounds.ts`, am Anfang von `rawBoundsOfMm` direkt hinter `const rotate = …`:

```ts
  const translate = primitive.transform?.translate;
  if (translate && primitive.type !== 'group') {
    // Dasselbe Muster wie die Gruppendrehung unten: `translate` ist nur an Gruppen belegt
    // (compose() umschließt die Piktogramme mit genau einer). An einem Einzelprimitiv würde
    // diese Hüllberechnung es still ignorieren, während beide Renderer es anwenden — aus
    // derselben IR entstünden zwei verschiedene Aussagen. Deshalb explizit ablehnen.
    throw new Error(
      'boundsOfMm: transform.translate ist nur an Gruppen belegt, nicht an ' +
        `"${primitive.type}".`,
    );
  }
```

Und den `group`-Zweig (`bounds.ts:102-116`) so ersetzen:

```ts
    case 'group': {
      if (rotate) {
        // Eine korrekte Hülle müsste die Drehung in die Geometrie jedes Kindes durchrechnen.
        // Das ist im aktuellen Referenzbestand kein belegter Fall (keine Gruppe trägt eine
        // eigene Drehung) — statt das still anzunähern, lehnen wir es explizit ab.
        throw new Error(
          'boundsOfMm: Drehung von Gruppen wird nicht unterstützt — dieser Fall ist im ' +
            'aktuellen Referenzbestand nicht belegt.',
        );
      }
      const childBounds = primitive.children
        .map(rawBoundsOfMm)
        .filter((bounds): bounds is BoundsMm => bounds !== undefined);
      if (childBounds.length === 0) return undefined;
      const merged = merge(childBounds);
      if (!translate) return merged;
      return {
        minX: merged.minX + translate.dxMm,
        minY: merged.minY + translate.dyMm,
        maxX: merged.maxX + translate.dxMm,
        maxY: merged.maxY + translate.dyMm,
      };
    }
```

Der frühe `return undefined` bei leerer Kinderhülle steht **vor** der Verschiebung — das ist der Punkt des zweiten Tests.

Den Dokumentationskommentar über `rawBoundsOfMm` (`bounds.ts:53-64`) um einen Satz ergänzen:

```
 * Eine Gruppe mit `transform.translate` verschiebt die Hülle ihrer Kinder; ist diese nicht
 * vergleichbar, bleibt sie es auch nach der Verschiebung.
```

- [ ] **Step 5: Tests und Typecheck laufen lassen**

Run: `pnpm vitest run packages/core/src/bounds.test.ts && pnpm typecheck`
Expected: alle Tests der Datei PASS, Typecheck ohne Fehler.

Run: `pnpm test`
Expected: vollständig grün. `shiftY` ist unangetastet, `compose` erzeugt noch keine Gruppe — kein bestehender Test kann sich verändert haben.

- [ ] **Step 6: Commit**

```bash
git add packages/schema/src/geometry.ts packages/core/src/bounds.ts packages/core/src/bounds.test.ts
git commit -m "feat(schema,core): Transform.translate und seine Hüllberechnung an Gruppen"
```

---

## Task 2: `translate` im SVG-Renderer

**Files:**
- Modify: `packages/core/src/render/svg.ts:64-68` (`transformAttr`)
- Test: `packages/core/src/render/svg.test.ts` (anfügen)

**Interfaces:**
- Consumes: `Transform`, `Translation` aus `@einsatzzeichen/schema`; `u`, `formatUnits` aus `svg.ts`
- Produces: `renderSvg` gibt für eine Gruppe mit `translate` `transform="translate(<u(dx)> <u(dy)>)"` aus; mit zusätzlichem `rotate` steht `translate` **links**. `pathTransformAttr` bleibt unverändert.

- [ ] **Step 1: Die failing tests schreiben**

An `packages/core/src/render/svg.test.ts` anfügen:

```ts
describe('renderSvg — Verschiebung von Gruppen', () => {
  it('gibt die Verschiebung in SVG-Einheiten aus', () => {
    const svg = renderSvg({
      viewBox: DEFAULT_VIEWBOX_MM,
      children: [
        {
          type: 'group',
          transform: { translate: { dxMm: 0, dyMm: 3 } },
          children: [{ type: 'line', x1: 3, y1: 16, x2: 26, y2: 16, style: { stroke: 'schwarz' } }],
        },
      ],
    });
    expect(svg).toContain(`<g transform="translate(0 ${formatUnits(mmToUnits(3))})">`);
    // Die Koordinaten des Kindes bleiben unangetastet — die Verschiebung sitzt an der Gruppe.
    expect(svg).toContain(`y1="${formatUnits(mmToUnits(16))}"`);
  });

  it('setzt die Verschiebung links von einer Drehung', () => {
    // SVG-Transformationen wirken von rechts nach links: rotate muss zuerst auf die
    // Kindkoordinaten wirken, die Verschiebung danach auf das gedrehte Ergebnis. Steht sie
    // rechts, verschiebt sie das Rotationszentrum mit — ein anderes Bild.
    const svg = renderSvg({
      viewBox: DEFAULT_VIEWBOX_MM,
      children: [
        {
          type: 'group',
          transform: { translate: { dxMm: 1, dyMm: 2 }, rotate: { angle: 45, cx: 16, cy: 16 } },
          children: [{ type: 'rect', x: 0, y: 0, width: 4, height: 4 }],
        },
      ],
    });
    const attr = svg.match(/<g transform="([^"]*)">/)?.[1];
    expect(attr).toBeDefined();
    expect(attr?.indexOf('translate(')).toBe(0);
    expect(attr?.indexOf('rotate(')).toBeGreaterThan(0);
  });

  it('gibt eine Verschiebung von null unverkürzt aus', () => {
    // Keine Sonderbehandlung für dx = dy = 0: eine Nullprüfung wäre ein zweiter Codepfad,
    // den der Canvas-Renderer ebenfalls kennen müsste, sonst divergiert die Aufrufspur.
    const svg = renderSvg({
      viewBox: DEFAULT_VIEWBOX_MM,
      children: [
        {
          type: 'group',
          transform: { translate: { dxMm: 0, dyMm: 0 } },
          children: [{ type: 'rect', x: 0, y: 0, width: 4, height: 4 }],
        },
      ],
    });
    expect(svg).toContain('<g transform="translate(0 0)">');
  });
});
```

Die Datei importiert `renderSvg`, `formatUnits`, `mmToUnits` und `DEFAULT_VIEWBOX_MM` bereits oder muss den Import entsprechend erweitern.

- [ ] **Step 2: Tests laufen lassen und den Fehlgrund prüfen**

Run: `pnpm vitest run packages/core/src/render/svg.test.ts`
Expected: alle drei FAIL — die Ausgabe ist `<g>` ohne `transform`-Attribut, weil `transformAttr` bei fehlendem `rotate` früh mit `''` zurückkehrt.

- [ ] **Step 3: `transformAttr` erweitern**

In `packages/core/src/render/svg.ts` `transformAttr` (`svg.ts:64-68`) ersetzen:

```ts
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
```

`pathTransformAttr` (`svg.ts:95-100`) **nicht** anfassen: die Translation sitzt auf der `<g>` in Einheiten, die `scale(…)` bleibt am `<path>` und wirkt weiterhin zuerst auf die Millimeterkoordinaten. Die Verschachtelung hält die beiden Umrechnungen auseinander, statt sie in einem Attribut zu mischen.

- [ ] **Step 4: Tests und die volle Suite laufen lassen**

Run: `pnpm vitest run packages/core/src/render/svg.test.ts && pnpm typecheck`
Expected: PASS, keine Typfehler.

Run: `pnpm test`
Expected: vollständig grün — kein bestehendes Primitiv trägt `translate`, die Snapshots können sich nicht geändert haben.

- [ ] **Step 5: Commit**

```bash
git add packages/core/src/render/svg.ts packages/core/src/render/svg.test.ts
git commit -m "feat(core): translate im SVG-Renderer, links von einer Drehung"
```

---

## Task 3: `translate` im Canvas-Renderer und die Renderer-Parität

Erfolgskriterium 3 der Spec: SVG- und Canvas-Renderer erzeugen aus einer IR mit `translate` dasselbe Bild, und ein Test belegt das statt es der Zielplattform zu überlassen.

Die Reihenfolge im Canvas ist tragend: `ctx.translate(...)` muss **vor** den bestehenden Rotationsblock, damit die Transformationsmatrix `T · R` ergibt und zu SVGs `translate(…) rotate(…)` passt. Umgekehrt ist es eine stille Renderer-Divergenz.

**Files:**
- Modify: `packages/core/src/render/canvas.ts:49-61` (Anfang von `drawPrimitive`)
- Test: `packages/core/src/render/canvas.test.ts` (anfügen)

**Interfaces:**
- Consumes: `Transform.translate` aus `@einsatzzeichen/schema`; `mmToUnits`
- Produces: `renderCanvas` ruft für eine Gruppe mit `translate` `ctx.translate(mmToUnits(dxMm), mmToUnits(dyMm))` innerhalb des bestehenden `save`/`restore`-Paars und vor einem etwaigen `rotate` auf.

- [ ] **Step 1: Die failing tests schreiben**

An `packages/core/src/render/canvas.test.ts` anfügen:

```ts
describe('renderCanvas — Verschiebung von Gruppen', () => {
  it('verschiebt in SVG-Einheiten innerhalb von save/restore', () => {
    const { ctx, calls } = recordingContext();
    renderCanvas(
      {
        viewBox: DEFAULT_VIEWBOX_MM,
        children: [
          {
            type: 'group',
            transform: { translate: { dxMm: 0, dyMm: 3 } },
            children: [{ type: 'rect', x: 1, y: 6, width: 30, height: 20, style: { fill: 'rot' } }],
          },
        ],
      },
      ctx,
    );
    const names = calls.map(([name]) => name);
    const translateIndex = names.indexOf('translate');
    expect(translateIndex).toBeGreaterThan(names.indexOf('save'));
    const translateCall = calls[translateIndex];
    expect(translateCall?.[1]).toBe(0);
    expect(translateCall?.[2]).toBeCloseTo(mmToUnits(3), 9);
    expect(names).toContain('restore');
  });

  it('verschiebt vor der Drehung, damit die Matrix zu SVGs translate-vor-rotate passt', () => {
    // Canvas-Transformationen wirken in Aufrufreihenfolge auf die CTM: translate zuerst
    // ergibt T·R und damit dieselbe Abbildung wie SVGs transform="translate(...) rotate(...)".
    // Nach der Drehung aufgerufen ergäbe es R·T — ein anderes Bild aus derselben IR.
    const { ctx, calls } = recordingContext();
    renderCanvas(
      {
        viewBox: DEFAULT_VIEWBOX_MM,
        children: [
          {
            type: 'group',
            transform: { translate: { dxMm: 1, dyMm: 2 }, rotate: { angle: 45, cx: 16, cy: 16 } },
            children: [{ type: 'rect', x: 0, y: 0, width: 4, height: 4, style: { fill: 'rot' } }],
          },
        ],
      },
      ctx,
    );
    const names = calls.map(([name]) => name);
    // Die Drehung ruft selbst zweimal translate auf (Zentrum hin und zurück) — der erste
    // translate-Aufruf muss die Gruppenverschiebung sein, nicht das Rotationszentrum.
    const firstTranslate = calls.find(([name]) => name === 'translate');
    expect(firstTranslate?.[1]).toBeCloseTo(mmToUnits(1), 9);
    expect(firstTranslate?.[2]).toBeCloseTo(mmToUnits(2), 9);
    expect(names.indexOf('translate')).toBeLessThan(names.indexOf('rotate'));
  });
});

describe('renderCanvas — Renderer-Parität bei translate (Spec-Erfolgskriterium 3)', () => {
  it('bildet dieselbe IR in SVG und Canvas auf dieselbe Verschiebung ab', () => {
    const drawing: Drawing = {
      viewBox: DEFAULT_VIEWBOX_MM,
      children: [
        {
          type: 'group',
          role: 'pictogram',
          transform: { translate: { dxMm: 0, dyMm: 3 } },
          children: [
            { type: 'line', x1: 3, y1: 16, x2: 26, y2: 16, style: { stroke: 'schwarz', strokeWidth: 0.5 } },
          ],
        },
      ],
    };

    // Zusicherung gilt der Abbildung, nicht dem Mechanismus: beide Renderer müssen denselben
    // Millimeterwert auf denselben Einheitenwert bringen, egal ob als Attribut oder als Aufruf.
    const svg = renderSvg(drawing);
    expect(svg).toContain(`translate(0 ${formatUnits(mmToUnits(3))})`);

    const { ctx, calls } = recordingContext();
    renderCanvas(drawing, ctx);
    const translateCall = calls.find(([name]) => name === 'translate');
    expect(translateCall?.[1]).toBe(0);
    expect(translateCall?.[2]).toBeCloseTo(mmToUnits(3), 9);
  });

  it('verschiebt einen Pfad in beiden Renderern, ohne die Skalierung zu doppeln', () => {
    // Der kritische Fall: der Pfad trägt seine eigene scale(...)-Umrechnung. Die Verschiebung
    // sitzt eine Ebene darüber und darf nicht durch diese Skalierung laufen.
    const drawing: Drawing = {
      viewBox: DEFAULT_VIEWBOX_MM,
      children: [
        {
          type: 'group',
          role: 'pictogram',
          transform: { translate: { dxMm: 0, dyMm: 3 } },
          children: [{ type: 'path', d: 'M 4 16 L 28 16', style: { stroke: 'schwarz', strokeWidth: 0.5 } }],
        },
      ],
    };

    const svg = renderSvg(drawing);
    // Die Gruppe trägt die Verschiebung in Einheiten …
    expect(svg).toContain(`<g transform="translate(0 ${formatUnits(mmToUnits(3))})">`);
    // … der Pfad ausschließlich seine Skalierung, unverändert.
    const pathTag = svg.match(/<path[^>]*\/>/)?.[0];
    expect(pathTag).toContain('transform="scale(');
    expect(pathTag).not.toContain('translate(');

    const { ctx, calls } = recordingContext();
    renderCanvas(drawing, ctx);
    const names = calls.map(([name]) => name);
    // Canvas: die Verschiebung steht vor der Pfad-Skalierung.
    expect(names.indexOf('translate')).toBeLessThan(names.indexOf('scale'));
    const translateCall = calls.find(([name]) => name === 'translate');
    expect(translateCall?.[2]).toBeCloseTo(mmToUnits(3), 9);
  });
});
```

- [ ] **Step 2: Tests laufen lassen und den Fehlgrund prüfen**

Run: `pnpm vitest run packages/core/src/render/canvas.test.ts`
Expected: die vier neuen Tests FAIL. Im ersten ist `names.indexOf('translate')` `-1`, weil `drawPrimitive` `translate` nicht kennt. Die SVG-Zusicherungen der Paritätstests sind schon grün (Task 2) — sie belegen, dass nur die Canvas-Seite fehlt.

- [ ] **Step 3: `drawPrimitive` erweitern**

In `packages/core/src/render/canvas.ts` den Anfang von `drawPrimitive` (`canvas.ts:54-61`) ersetzen:

```ts
  ctx.save();

  // Reihenfolge ist tragend: Canvas-Transformationen wirken in Aufrufreihenfolge auf die CTM.
  // translate zuerst ergibt T·R und damit dieselbe Abbildung wie SVGs
  // transform="translate(...) rotate(...)" (siehe `transformAttr` in svg.ts). Nach der Drehung
  // aufgerufen ergäbe es R·T — aus derselben IR entstünden zwei verschiedene Bilder.
  const translate = primitive.transform?.translate;
  if (translate) {
    ctx.translate(mmToUnits(translate.dxMm), mmToUnits(translate.dyMm));
  }

  const rotate = primitive.transform?.rotate;
  if (rotate) {
    ctx.translate(mmToUnits(rotate.cx), mmToUnits(rotate.cy));
    ctx.rotate((rotate.angle * Math.PI) / 180);
    ctx.translate(-mmToUnits(rotate.cx), -mmToUnits(rotate.cy));
  }
```

Das bestehende `ctx.restore()` am Ende jedes Zweigs bleibt unverändert — die Verschiebung liegt innerhalb des vorhandenen `save`/`restore`-Paars.

- [ ] **Step 4: Tests und die volle Suite laufen lassen**

Run: `pnpm vitest run packages/core/src/render/canvas.test.ts && pnpm typecheck`
Expected: PASS, keine Typfehler.

Run: `pnpm test`
Expected: vollständig grün.

- [ ] **Step 5: Commit**

```bash
git add packages/core/src/render/canvas.ts packages/core/src/render/canvas.test.ts
git commit -m "feat(core): translate im Canvas-Renderer mit Paritätsnachweis gegen SVG"
```

---

## Task 4: Piktogramm-IR im Schema und das Kommando-Gate

Der Schema-Typ und sein erster Konsument in einem Task: eine `PictogramDefinition` ohne Gate ist eine unprüfbare Behauptung, und ein Gate ohne Typ hat keine Eingabe.

Das Gate braucht einen **Kommando-Tokenizer**, keinen Bezier-Auswerter. Die Unterscheidung ist tragend: `H` trägt nur ein x, `V` nur ein y. Ein Gate, das jede Zahl gegen beide Achsen prüft, würde `V 25` in einer schmalen hohen Box fälschlich gegen die Breite prüfen und valide Pfade ablehnen (Spec Abschnitt 7, Erfolgskriterium 5).

**Files:**
- Create: `packages/schema/src/pictogram.ts`
- Modify: `packages/schema/src/index.ts` (Re-Export)
- Create: `packages/core/src/path-commands.ts`
- Create: `packages/core/src/path-commands.test.ts`
- Create: `packages/core/src/pictogram-gate.ts`
- Create: `packages/core/src/pictogram-gate.test.ts`
- Modify: `packages/core/src/index.ts` (Re-Export)

**Interfaces:**
- Consumes: `Length`, `Primitive` aus `geometry.js`; `CapabilityId` aus `taxonomy.js`
- Produces:
  - `interface PictogramBox { xMm: Length; yMm: Length; widthMm: Length; heightMm: Length }`
  - `type StateId = never`, `type CommsId = never`, `type DamageId = never`, `type WildfireId = never`
  - `type PictogramId` — Union der fünf präfigierten ID-Räume
  - `interface PictogramDefinition { id: PictogramId; title: string; box: PictogramBox; primitives: readonly Primitive[] }`
  - `interface PathCommand { command: 'M' | 'L' | 'H' | 'V' | 'C' | 'Q' | 'Z'; numbers: readonly number[] }`
  - `tokenizePath(d: string): { commands: readonly PathCommand[]; problems: readonly string[] }`
  - `interface PictogramIssue { gate: 'command' | 'box' | 'clipping'; pictogramId: string; detail: string }`
  - `checkCommands(definition: PictogramDefinition): PictogramIssue[]`

- [ ] **Step 1: Die failing tests für den Tokenizer schreiben**

`packages/core/src/path-commands.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { tokenizePath } from './path-commands.js';

describe('tokenizePath', () => {
  it('zerlegt einen Pfad in Kommandos mit ihren eigenen Zahlen', () => {
    const { commands, problems } = tokenizePath('M 4 16 C 6 16 8 12 10 12 Z');
    expect(problems).toEqual([]);
    expect(commands).toEqual([
      { command: 'M', numbers: [4, 16] },
      { command: 'C', numbers: [6, 16, 8, 12, 10, 12] },
      { command: 'Z', numbers: [] },
    ]);
  });

  it('liest H und V mit genau einer Zahl', () => {
    // Der Kern des Box-Gates: H trägt nur ein x, V nur ein y. Ein Zahlenstrom-Leser
    // würde beide gegen beide Achsen prüfen.
    const { commands, problems } = tokenizePath('M 2 2 V 25 H 4 Z');
    expect(problems).toEqual([]);
    expect(commands).toEqual([
      { command: 'M', numbers: [2, 2] },
      { command: 'V', numbers: [25] },
      { command: 'H', numbers: [4] },
      { command: 'Z', numbers: [] },
    ]);
  });

  it('zerlegt ein wiederholtes Kommando in einzelne Kommandos', () => {
    const { commands, problems } = tokenizePath('C 1 1 2 2 3 3 4 4 5 5 6 6');
    expect(problems).toEqual([]);
    expect(commands).toEqual([
      { command: 'C', numbers: [1, 1, 2, 2, 3, 3] },
      { command: 'C', numbers: [4, 4, 5, 5, 6, 6] },
    ]);
  });

  it('liest die Folgepaare eines M als implizite L, wie SVG es vorschreibt', () => {
    const { commands, problems } = tokenizePath('M 1 1 2 2 3 3');
    expect(problems).toEqual([]);
    expect(commands).toEqual([
      { command: 'M', numbers: [1, 1] },
      { command: 'L', numbers: [2, 2] },
      { command: 'L', numbers: [3, 3] },
    ]);
  });

  it('liest Zahlen ohne Trennzeichen und mit führendem Punkt', () => {
    const { commands, problems } = tokenizePath('M4.5.25L-1 2');
    expect(problems).toEqual([]);
    expect(commands).toEqual([
      { command: 'M', numbers: [4.5, 0.25] },
      { command: 'L', numbers: [-1, 2] },
    ]);
  });

  it('meldet ein relatives Kommando und verwirft seine Zahlen still', () => {
    const { problems } = tokenizePath('m 4 4 l 8 8');
    expect(problems).toEqual([
      'Relatives Kommando "m" — nur absolute Kommandos sind zulässig.',
      'Relatives Kommando "l" — nur absolute Kommandos sind zulässig.',
    ]);
  });

  it('meldet A, S und T je einmal, nicht ihre Argumente hinterher', () => {
    expect(tokenizePath('M 4 4 A 2 2 0 0 1 8 8').problems).toEqual([
      'Unzulässiges Kommando "A" — zulässig sind nur M L H V C Q Z.',
    ]);
    expect(tokenizePath('M 4 4 S 6 6 8 8').problems).toEqual([
      'Unzulässiges Kommando "S" — zulässig sind nur M L H V C Q Z.',
    ]);
    expect(tokenizePath('M 4 4 T 8 8').problems).toEqual([
      'Unzulässiges Kommando "T" — zulässig sind nur M L H V C Q Z.',
    ]);
  });

  it('meldet eine Zahl ohne vorangehendes Kommando', () => {
    expect(tokenizePath('4 4 M 8 8').problems).toEqual([
      'Zahl "4" ohne vorangehendes Kommando.',
      'Zahl "4" ohne vorangehendes Kommando.',
    ]);
  });

  it('meldet eine unpassende Argumentzahl', () => {
    expect(tokenizePath('M 4 4 C 6 6 8 8').problems).toEqual([
      'Kommando "C" erwartet ein Vielfaches von 6 Zahlen, erhielt 4.',
    ]);
    expect(tokenizePath('M 4 4 Z 9').problems).toEqual([
      'Kommando "Z" erwartet keine Zahlen, erhielt 1.',
    ]);
  });
});
```

- [ ] **Step 2: Tests laufen lassen und den Fehlgrund prüfen**

Run: `pnpm vitest run packages/core/src/path-commands.test.ts`
Expected: FAIL mit „Failed to resolve import ./path-commands.js" — das Modul fehlt noch.

- [ ] **Step 3: Den Tokenizer schreiben**

`packages/core/src/path-commands.ts`:

```ts
/**
 * Kommando-Tokenizer für Piktogramm-Pfade. Kein Bezier-Auswerter: das Box-Gate braucht die
 * Koordinaten **je Kommando**, weil `H` nur ein x und `V` nur ein y trägt. Ein Leser, der den
 * `d`-String als Zahlenstrom nimmt, würde `V 25` in einer schmalen hohen Box gegen die Breite
 * prüfen und valide Pfade ablehnen.
 *
 * Ohne Laufzeitabhängigkeit: `core` bleibt abhängigkeitsfrei. „Regex je Pfad" wäre trotzdem zu
 * wenig — die Zerlegung nach Kommandos ist die eigentliche Leistung.
 */

/** Die sieben zugelassenen absoluten Kommandos (Spec Abschnitt 5). */
export type PathCommandName = 'M' | 'L' | 'H' | 'V' | 'C' | 'Q' | 'Z';

export interface PathCommand {
  command: PathCommandName;
  /** Genau die Zahlen dieses einen Kommandos: 2 für M/L, 1 für H/V, 6 für C, 4 für Q, 0 für Z. */
  numbers: readonly number[];
}

export interface TokenizeResult {
  commands: readonly PathCommand[];
  /**
   * Verstöße gegen die Autorenkonvention, je Ursache genau einmal. Bei nichtleerer Liste ist
   * `commands` unvollständig — die Argumente eines abgelehnten Kommandos werden still verworfen,
   * statt als Dutzend Folgefehler zu erscheinen.
   */
  problems: readonly string[];
}

const ARITY: Record<PathCommandName, number> = { M: 2, L: 2, H: 1, V: 1, C: 6, Q: 4, Z: 0 };

/**
 * Zahl **vor** Buchstabe: `1e-3` muss als eine Zahl gelesen werden und nicht als `1`, `e`, `-3`.
 * Die Alternation greift links zuerst, und ein Match beginnt an der jeweiligen Position.
 */
const TOKEN = /-?\d*\.?\d+(?:[eE][-+]?\d+)?|[A-Za-z]/g;

function isCommandName(value: string): value is PathCommandName {
  return Object.hasOwn(ARITY, value);
}

export function tokenizePath(d: string): TokenizeResult {
  const commands: PathCommand[] = [];
  const problems: string[] = [];
  let current: PathCommandName | null = null;
  let numbers: number[] = [];
  /** Nach einem abgelehnten Kommando dessen Zahlen still verwerfen. */
  let skipNumbers = false;

  function flush(): void {
    if (current === null) return;
    const arity = ARITY[current];
    if (arity === 0) {
      if (numbers.length > 0) {
        problems.push(`Kommando "${current}" erwartet keine Zahlen, erhielt ${numbers.length}.`);
      }
      commands.push({ command: current, numbers: [] });
    } else if (numbers.length === 0 || numbers.length % arity !== 0) {
      problems.push(
        `Kommando "${current}" erwartet ein Vielfaches von ${arity} Zahlen, ` +
          `erhielt ${numbers.length}.`,
      );
    } else {
      for (let i = 0; i < numbers.length; i += arity) {
        // Die Folgepaare eines M sind nach der SVG-Spezifikation implizite L. Für die
        // Box-Prüfung ist das gleichgültig (beides Koordinatenpaare), für die Lesbarkeit der
        // zerlegten Liste nicht.
        const command: PathCommandName = current === 'M' && i > 0 ? 'L' : current;
        commands.push({ command, numbers: numbers.slice(i, i + arity) });
      }
    }
    current = null;
    numbers = [];
  }

  for (const token of d.match(TOKEN) ?? []) {
    if (/^[A-Za-z]$/.test(token)) {
      flush();
      const upper = token.toUpperCase();
      if (token !== upper) {
        problems.push(`Relatives Kommando "${token}" — nur absolute Kommandos sind zulässig.`);
        skipNumbers = true;
        continue;
      }
      if (!isCommandName(upper)) {
        problems.push(`Unzulässiges Kommando "${token}" — zulässig sind nur M L H V C Q Z.`);
        skipNumbers = true;
        continue;
      }
      current = upper;
      skipNumbers = false;
    } else if (current !== null) {
      numbers.push(Number(token));
    } else if (!skipNumbers) {
      problems.push(`Zahl "${token}" ohne vorangehendes Kommando.`);
    }
  }
  flush();

  return { commands, problems };
}
```

- [ ] **Step 4: Tokenizer-Tests laufen lassen**

Run: `pnpm vitest run packages/core/src/path-commands.test.ts`
Expected: alle zehn PASS.

- [ ] **Step 5: Zwischencommit für den Tokenizer**

```bash
git add packages/core/src/path-commands.ts packages/core/src/path-commands.test.ts
git commit -m "feat(core): Kommando-Tokenizer für Piktogramm-Pfade"
```

- [ ] **Step 6: Das Piktogramm-Schema deklarieren**

`packages/schema/src/pictogram.ts`:

```ts
import type { Length, Primitive } from './geometry.js';
import type { CapabilityId } from './taxonomy.js';

/**
 * Zugesicherte Hülle eines Piktogramms: linke obere Ecke und Maße in Millimetern.
 *
 * Nötig, weil `boundsOfMm` für Pfade nichts liefert — die Koordinaten eines Pfades liegen
 * unzerlegt im `d`-String. Die Box ist damit eine **Zusicherung des Autors**, keine berechnete
 * Größe, und genau darum prüfbedürftig: `pictogram-gate.ts` in `core` gibt ihr drei Gates.
 */
export interface PictogramBox {
  xMm: Length;
  yMm: Length;
  widthMm: Length;
  heightMm: Length;
}

/**
 * Die fünf Piktogrammarten der Baseline haben je einen eigenen ID-Raum. Ein Wetterzeichen oder
 * ein Trümmerkegel ist keine Fähigkeit einer Einheit — sie unter `capability.` zu führen wäre
 * eine Falschaussage in der ID.
 *
 * Vier der fünf Räume haben in D.0 noch keine Literale und sind deshalb `never`; die Union
 * kollabiert dadurch auf `capability.*`. Sie stehen hier trotzdem, weil sie der Vertrag sind,
 * an dem D.1 bis D.4 anknüpfen, ohne die Aufteilung je neu zu entscheiden — und weil ein
 * `never`-Alias mit dieser Begründung ehrlicher ist als ein `string`, der jede ID durchlässt.
 */

/** Kapitel 5.8: Zustände, Tendenzen, Gefahren, Wetter, Personen. Literale entstehen in D.2. */
export type StateId = never;
/** Anhang J: IuK. Literale entstehen in D.3. */
export type CommsId = never;
/** Anhänge K und L: Bauwerksschäden, Deichverteidigung. Literale entstehen in D.4. */
export type DamageId = never;
/** Anhang M: Vegetationsbrand. Literale entstehen in D.4. */
export type WildfireId = never;

export type PictogramId =
  | `capability.${CapabilityId}`
  | `state.${StateId}`
  | `comms.${CommsId}`
  | `damage.${DamageId}`
  | `wildfire.${WildfireId}`;

/**
 * Ein Piktogramm ist Code: eine Folge von Primitiven in Millimetern mit deklarierter Hüllbox.
 * Kein Grafikprogramm, kein Vektorimport, keine Datei pro Zeichen.
 */
export interface PictogramDefinition {
  id: PictogramId;
  /** Deutsche Bezeichnung der Referenz. Die ID bleibt englisch (wie `SymbolKind`, `PrimitiveRole`). */
  title: string;
  box: PictogramBox;
  primitives: readonly Primitive[];
}
```

In `packages/schema/src/index.ts` nach `export * from './geometry.js';` einfügen:

```ts
export * from './pictogram.js';
```

- [ ] **Step 7: Die failing tests für das Kommando-Gate schreiben**

`packages/core/src/pictogram-gate.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import type { PictogramDefinition, Primitive } from '@einsatzzeichen/schema';
import { checkCommands } from './pictogram-gate.js';

/** Ein Piktogramm mit genau einem Pfad, Box und Titel unverändert — nur der `d`-String variiert. */
function withPath(d: string): PictogramDefinition {
  return {
    id: 'capability.fire-fighting',
    title: 'Testpiktogramm',
    box: { xMm: 4, yMm: 12, widthMm: 24, heightMm: 8 },
    primitives: [{ type: 'path', role: 'pictogram', d, style: { fill: 'schwarz', stroke: 'none' } }],
  };
}

describe('Kommando-Gate', () => {
  it('lässt die sieben zugelassenen absoluten Kommandos durch', () => {
    const issues = checkCommands(withPath('M 4 12 L 8 12 H 12 V 16 C 14 16 16 20 18 20 Q 20 20 22 16 Z'));
    expect(issues).toEqual([]);
  });

  it('lehnt ein relatives Kommando ab', () => {
    const issues = checkCommands(withPath('M 4 12 l 4 0'));
    expect(issues).toHaveLength(1);
    expect(issues[0]?.gate).toBe('command');
    expect(issues[0]?.pictogramId).toBe('capability.fire-fighting');
    expect(issues[0]?.detail).toContain('Relatives Kommando "l"');
  });

  it('lehnt A ab, weil seine Parameter keine Koordinaten sind', () => {
    // A rx ry rotation large-arc sweep x y: ein Schalter 0/1 besteht jede Box, eine Drehung 45
    // liest sich als 45 mm, und der Bogen kann weit außerhalb der geschriebenen Zahlen ausschlagen.
    const issues = checkCommands(withPath('M 4 12 A 2 2 0 0 1 8 16'));
    expect(issues).toHaveLength(1);
    expect(issues[0]?.detail).toContain('Unzulässiges Kommando "A"');
  });

  it('lehnt S ab, weil sein erster Kontrollpunkt implizit ist', () => {
    const issues = checkCommands(withPath('M 4 12 C 5 12 6 16 8 16 S 10 20 12 20'));
    expect(issues).toHaveLength(1);
    expect(issues[0]?.detail).toContain('Unzulässiges Kommando "S"');
  });

  it('lehnt T ab, aus demselben Grund wie S', () => {
    const issues = checkCommands(withPath('M 4 12 Q 6 12 8 16 T 12 16'));
    expect(issues).toHaveLength(1);
    expect(issues[0]?.detail).toContain('Unzulässiges Kommando "T"');
  });

  it('prüft jeden Pfad einer Definition mit mehreren Primitiven', () => {
    const definition: PictogramDefinition = {
      id: 'capability.fire-fighting',
      title: 'Zwei Pfade',
      box: { xMm: 4, yMm: 12, widthMm: 24, heightMm: 8 },
      primitives: [
        { type: 'path', role: 'pictogram', d: 'M 4 12 L 8 12' },
        { type: 'path', role: 'pictogram', d: 'm 4 12 l 8 0' },
      ],
    };
    expect(checkCommands(definition)).toHaveLength(1);
  });

  it('steigt in Gruppen ab', () => {
    const nested: Primitive = {
      type: 'group',
      children: [{ type: 'path', role: 'pictogram', d: 'M 4 12 A 2 2 0 0 1 8 16' }],
    };
    const definition: PictogramDefinition = {
      id: 'capability.fire-fighting',
      title: 'Pfad in Gruppe',
      box: { xMm: 4, yMm: 12, widthMm: 24, heightMm: 8 },
      primitives: [nested],
    };
    expect(checkCommands(definition)).toHaveLength(1);
  });

  it('meldet nichts für ein Piktogramm ohne Pfade', () => {
    const definition: PictogramDefinition = {
      id: 'capability.fire-fighting',
      title: 'Nur Linien',
      box: { xMm: 3, yMm: 9, widthMm: 23, heightMm: 14 },
      primitives: [{ type: 'line', role: 'pictogram', x1: 3, y1: 16, x2: 26, y2: 16 }],
    };
    expect(checkCommands(definition)).toEqual([]);
  });
});
```

- [ ] **Step 8: Tests laufen lassen und den Fehlgrund prüfen**

Run: `pnpm vitest run packages/core/src/pictogram-gate.test.ts`
Expected: FAIL mit „Failed to resolve import ./pictogram-gate.js".

- [ ] **Step 9: Das Kommando-Gate schreiben**

`packages/core/src/pictogram-gate.ts`:

```ts
import type { PictogramDefinition, Primitive } from '@einsatzzeichen/schema';
import { tokenizePath } from './path-commands.js';

/**
 * Ein Befund eines der drei Piktogramm-Gates. Eine gemeinsame Form statt dreier eigener: das
 * Coverage-Gate und die Katalogtests geben sie einheitlich aus, und ein viertes Gate kostet
 * keine Änderung an der Rückgabeform — dasselbe Muster wie `CoverageViolation` in `catalog`.
 *
 * Listen von Befunden statt Ausnahmen, wie `validateSpec`: ein Autor will alle Verstöße seines
 * Piktogramms auf einmal sehen, nicht den ersten.
 */
export interface PictogramIssue {
  gate: 'command' | 'box' | 'clipping';
  pictogramId: string;
  detail: string;
}

/** Alle Pfad-Primitive einer Definition, auch verschachtelte. */
function pathsOf(primitives: readonly Primitive[]): Array<Primitive & { type: 'path' }> {
  const paths: Array<Primitive & { type: 'path' }> = [];
  for (const primitive of primitives) {
    if (primitive.type === 'path') paths.push(primitive);
    else if (primitive.type === 'group') paths.push(...pathsOf(primitive.children));
  }
  return paths;
}

/**
 * Prüft, dass jeder `d`-String der Definition ausschließlich die sieben zugelassenen absoluten
 * Kommandos verwendet (Spec Abschnitt 5). Diese Beschränkung ist nicht stilistisch: sie ist die
 * Bedingung, unter der das Box-Gate beweisbar konservativ ist. Mit `A`, `S` oder `T` wäre es
 * nicht konservativ, sondern falsch.
 */
export function checkCommands(definition: PictogramDefinition): PictogramIssue[] {
  const issues: PictogramIssue[] = [];
  for (const path of pathsOf(definition.primitives)) {
    for (const problem of tokenizePath(path.d).problems) {
      issues.push({ gate: 'command', pictogramId: definition.id, detail: problem });
    }
  }
  return issues;
}
```

In `packages/core/src/index.ts` anfügen:

```ts
export * from './path-commands.js';
export * from './pictogram-gate.js';
```

- [ ] **Step 10: Tests, Typecheck und die volle Suite laufen lassen**

Run: `pnpm vitest run packages/core/src/pictogram-gate.test.ts && pnpm typecheck`
Expected: alle acht PASS, keine Typfehler. Der Typecheck belegt zugleich, dass `PictogramId` sich auf `capability.*` reduziert — `id: 'capability.fire-fighting'` in den Fixtures wäre sonst ein Fehler.

Run: `pnpm test`
Expected: vollständig grün.

- [ ] **Step 11: Commit**

```bash
git add packages/schema/src/pictogram.ts packages/schema/src/index.ts \
  packages/core/src/pictogram-gate.ts packages/core/src/pictogram-gate.test.ts \
  packages/core/src/index.ts
git commit -m "feat(schema,core): PictogramDefinition mit deklarierter Box und Kommando-Gate"
```

---

## Task 5: Box-Gate

**Warum das Gate korrekt ist, ohne Bezierkurven auszurechnen:** Eine Bezierkurve verlässt die konvexe Hülle ihrer Kontrollpunkte nie. Liegen alle Kontrollpunkte innerhalb der Box, liegt der gezeichnete Pfad garantiert innerhalb der Box. Die Prüfung ist konservativ — sie kann eine Box als zu klein melden, die geometrisch gerade noch passt, aber sie kann eine Überschreitung **nicht** durchlassen. Für ein Autorengate ist das die richtige Richtung.

Die Spec sagt zusätzlich „für Nicht-Pfad-Primitive stimmt `boundsOfMm` mit der Box überein". Das kann bei gemischten Definitionen nicht gelten (Pfad *und* Linie: die Linienhülle ist kleiner als die Box, die auch den Pfad umfassen muss). Festlegung: **Enthaltung ist die allgemeine Regel; Gleichheit wird nur für Definitionen ohne Pfad-Primitiv gefordert** — dort ist die Box vollständig berechenbar, und eine zu große Box wäre eine unnötige Zusicherung, die das Clipping-Gate zu streng macht.

**Files:**
- Modify: `packages/core/src/pictogram-gate.ts`
- Test: `packages/core/src/pictogram-gate.test.ts` (anfügen)

**Interfaces:**
- Consumes: `PictogramIssue`, `pathsOf`, `tokenizePath` aus Task 4; `boundsOfMm` aus `bounds.js`; `mmToUnits`, `unitsEqual` aus `@einsatzzeichen/schema`
- Produces: `checkBox(definition: PictogramDefinition): PictogramIssue[]`

- [ ] **Step 1: Die failing tests schreiben**

An `packages/core/src/pictogram-gate.test.ts` anfügen (den Import um `checkBox` erweitern):

```ts
describe('Box-Gate', () => {
  it('nimmt einen Pfad an, dessen Kontrollpunkte alle in der Box liegen', () => {
    // Alle x in [4, 28], alle y in [12, 20] — die Box ist { 4, 12, 24, 8 }.
    expect(checkBox(withPath('M 4 12 C 8 20 20 20 28 12 Z'))).toEqual([]);
  });

  it('lehnt eine Koordinate außerhalb der Box ab und nennt sie', () => {
    const issues = checkBox(withPath('M 4 12 L 30 12'));
    expect(issues).toHaveLength(1);
    expect(issues[0]?.gate).toBe('box');
    expect(issues[0]?.detail).toContain('30');
    expect(issues[0]?.detail).toContain('x');
  });

  it('lehnt einen Kontrollpunkt außerhalb der Box ab, auch wenn beide Endpunkte darin liegen', () => {
    // Die Kurve selbst bleibt vielleicht innen — das Gate ist konservativ und lehnt ab. Eine
    // Bezierkurve verlässt die konvexe Hülle ihrer Kontrollpunkte nie; umgekehrt gilt das nicht.
    const issues = checkBox(withPath('M 4 12 C 8 40 20 40 28 12'));
    expect(issues.length).toBeGreaterThan(0);
    expect(issues[0]?.detail).toContain('40');
  });

  it('prüft V gegen die Höhe und H gegen die Breite, nicht gegen beide Achsen', () => {
    // Der Nachweis, dass das Gate Koordinaten je Kommando liest: in einer schmalen, hohen Box
    // ist V 25 zulässig, obwohl 25 die Breite (8 mm) weit übersteigt. Ein Zahlenstrom-Leser
    // würde diesen validen Pfad ablehnen.
    const narrow: PictogramDefinition = {
      id: 'capability.fire-fighting',
      title: 'Schmal und hoch',
      box: { xMm: 2, yMm: 2, widthMm: 8, heightMm: 26 },
      primitives: [{ type: 'path', role: 'pictogram', d: 'M 2 2 V 25 H 4 Z' }],
    };
    expect(checkBox(narrow)).toEqual([]);
  });

  it('lehnt V ab, wenn der Wert die Höhe übersteigt', () => {
    const narrow: PictogramDefinition = {
      id: 'capability.fire-fighting',
      title: 'Schmal und hoch',
      box: { xMm: 2, yMm: 2, widthMm: 8, heightMm: 26 },
      primitives: [{ type: 'path', role: 'pictogram', d: 'M 2 2 V 29 Z' }],
    };
    const issues = checkBox(narrow);
    expect(issues).toHaveLength(1);
    expect(issues[0]?.detail).toContain('y');
  });

  it('fordert bei einer Definition ohne Pfade Gleichheit von Hülle und Box', () => {
    const tooLarge: PictogramDefinition = {
      id: 'capability.fire-fighting',
      title: 'Nur Linien, Box zu groß',
      box: { xMm: 1, yMm: 6, widthMm: 30, heightMm: 20 },
      primitives: [{ type: 'line', role: 'pictogram', x1: 3, y1: 16, x2: 26, y2: 16 }],
    };
    const issues = checkBox(tooLarge);
    expect(issues.length).toBeGreaterThan(0);
    expect(issues[0]?.detail).toContain('berechenbar');
  });

  it('nimmt eine Definition ohne Pfade an, deren Box genau der Hülle entspricht', () => {
    const exact: PictogramDefinition = {
      id: 'capability.fire-fighting',
      title: 'Nur Linien, Box exakt',
      box: { xMm: 3, yMm: 9, widthMm: 23, heightMm: 14 },
      primitives: [
        { type: 'line', role: 'pictogram', x1: 3, y1: 16, x2: 26, y2: 16 },
        { type: 'line', role: 'pictogram', x1: 16, y1: 16, x2: 26, y2: 9 },
        { type: 'line', role: 'pictogram', x1: 16, y1: 16, x2: 26, y2: 23 },
      ],
    };
    expect(checkBox(exact)).toEqual([]);
  });

  it('fordert bei gemischten Definitionen nur Enthaltung, nicht Gleichheit', () => {
    // Die Linienhülle (3…26 × 16…16) ist kleiner als die Box, weil diese auch den Pfad fassen
    // muss. Gleichheit zu fordern wäre hier unerfüllbar.
    const mixed: PictogramDefinition = {
      id: 'capability.fire-fighting',
      title: 'Linie und Pfad',
      box: { xMm: 3, yMm: 9, widthMm: 23, heightMm: 14 },
      primitives: [
        { type: 'line', role: 'pictogram', x1: 3, y1: 16, x2: 26, y2: 16 },
        { type: 'path', role: 'pictogram', d: 'M 3 9 L 26 23' },
      ],
    };
    expect(checkBox(mixed)).toEqual([]);
  });

  it('lehnt ein Nicht-Pfad-Primitiv ab, das aus der Box ragt', () => {
    const outside: PictogramDefinition = {
      id: 'capability.fire-fighting',
      title: 'Linie ragt heraus',
      box: { xMm: 4, yMm: 12, widthMm: 24, heightMm: 8 },
      primitives: [
        { type: 'path', role: 'pictogram', d: 'M 4 12 L 28 20' },
        { type: 'line', role: 'pictogram', x1: 4, y1: 12, x2: 30, y2: 12 },
      ],
    };
    const issues = checkBox(outside);
    expect(issues.length).toBeGreaterThan(0);
    expect(issues[0]?.detail).toContain('30');
  });

  it('meldet keine Box-Verstöße für einen Pfad, den schon das Kommando-Gate ablehnt', () => {
    // Arbeitsteilung: die Kommandos eines abgelehnten Pfades sind nicht zerlegbar, und ein
    // zweiter Befund zum selben Fehler hilft dem Autor nicht.
    expect(checkBox(withPath('m 4 12 l 8 0'))).toEqual([]);
  });
});
```

- [ ] **Step 2: Tests laufen lassen und den Fehlgrund prüfen**

Run: `pnpm vitest run packages/core/src/pictogram-gate.test.ts`
Expected: FAIL mit „checkBox is not a function" bzw. einem Importfehler. Die Tests aus Task 4 bleiben grün.

- [ ] **Step 3: Das Box-Gate schreiben**

An `packages/core/src/pictogram-gate.ts` anfügen; den Import erweitern auf:

```ts
import { mmToUnits, unitsEqual, type PictogramBox, type PictogramDefinition, type Primitive } from '@einsatzzeichen/schema';
import { boundsOfMm, type BoundsMm } from './bounds.js';
import { tokenizePath, type PathCommand } from './path-commands.js';
```

```ts
/** Ob eine Definition — auch verschachtelt — mindestens ein Pfad-Primitiv enthält. */
function hasPath(primitives: readonly Primitive[]): boolean {
  return primitives.some(
    (primitive) =>
      primitive.type === 'path' ||
      (primitive.type === 'group' && hasPath(primitive.children)),
  );
}

/**
 * Alle Primitive mit berechenbarer Hülle — also alles außer Pfaden, aus Gruppen herausgezogen.
 *
 * Wirft für eine Gruppe mit `transform`: `boundsOfMm` auf einem herausgezogenen Kind liest dessen
 * Rohkoordinaten, die Transformation der Elterngruppe wäre verloren, und die Box-Prüfung liefe
 * gegen die falschen Zahlen. In D.0 trägt keine Definition eine transformierte Gruppe — genau
 * deshalb steht der Fehler hier, bevor es in D.1 still falsch werden kann.
 */
function measurableOf(primitives: readonly Primitive[]): Primitive[] {
  const measurable: Primitive[] = [];
  for (const primitive of primitives) {
    if (primitive.type === 'group') {
      if (primitive.transform !== undefined) {
        throw new Error(
          'pictogram-gate: Eine Gruppe innerhalb einer PictogramDefinition darf keine ' +
            'Transformation tragen — die Verschiebung der Komposition setzt compose() außen ' +
            'auf, und eine innere würde die Box-Prüfung gegen die Rohkoordinaten laufen lassen.',
        );
      }
      measurable.push(...measurableOf(primitive.children));
    } else if (primitive.type !== 'path') {
      measurable.push(primitive);
    }
  }
  return measurable;
}

interface Axis {
  name: 'x' | 'y';
  min: number;
  max: number;
}

function axesOf(box: PictogramBox): { x: Axis; y: Axis } {
  return {
    x: { name: 'x', min: box.xMm, max: box.xMm + box.widthMm },
    y: { name: 'y', min: box.yMm, max: box.yMm + box.heightMm },
  };
}

/**
 * Ob ein Wert auf seiner Achse innerhalb der Box liegt. Verglichen wird in SVG-Einheiten gegen
 * `TOLERANCE_UNITS` (über `unitsEqual`), nicht mit `<`/`>` auf Millimetern: eine Koordinate genau
 * auf der Kante ist zulässig, und Exportrundungen dürfen kein Gate reißen.
 */
function within(value: number, axis: Axis): boolean {
  const units = mmToUnits(value);
  const min = mmToUnits(axis.min);
  const max = mmToUnits(axis.max);
  if (units >= min && units <= max) return true;
  return unitsEqual(units, min) || unitsEqual(units, max);
}

/**
 * Die Koordinaten eines Kommandos, jeweils mit ihrer Achse. `H` trägt nur ein x, `V` nur ein y —
 * genau der Grund, warum das Gate Kommandos liest und keinen Zahlenstrom.
 */
function coordinatesOf(command: PathCommand, axes: { x: Axis; y: Axis }): Array<[number, Axis]> {
  if (command.command === 'H') {
    const [x] = command.numbers;
    return x === undefined ? [] : [[x, axes.x]];
  }
  if (command.command === 'V') {
    const [y] = command.numbers;
    return y === undefined ? [] : [[y, axes.y]];
  }
  // M, L, C, Q tragen ausschließlich Koordinatenpaare; Z trägt keine Zahlen.
  const pairs: Array<[number, Axis]> = [];
  for (let i = 0; i + 1 < command.numbers.length; i += 2) {
    const x = command.numbers[i];
    const y = command.numbers[i + 1];
    if (x !== undefined) pairs.push([x, axes.x]);
    if (y !== undefined) pairs.push([y, axes.y]);
  }
  return pairs;
}

/**
 * Prüft, dass jede Koordinate innerhalb der deklarierten Box liegt.
 *
 * Für Pfade ist das konservativ korrekt, ohne die Kurven auszurechnen: eine Bezierkurve verlässt
 * die konvexe Hülle ihrer Kontrollpunkte nie. Liegen alle Kontrollpunkte in der Box, liegt die
 * gezeichnete Kurve garantiert darin. Die Prüfung kann eine zu kleine Box melden, die geometrisch
 * gerade noch passt — sie kann eine Überschreitung nicht durchlassen. Das ist für ein
 * Autorengate die richtige Richtung. Beides gilt nur unter der Kommandobeschränkung aus
 * `checkCommands`; mit `A`, `S` oder `T` wäre die Aussage falsch statt konservativ.
 *
 * Für Nicht-Pfad-Primitive gilt zusätzlich: enthält die Definition **keinen** Pfad, ist ihre
 * Hülle vollständig berechenbar, und die Box muss ihr gleichen. Eine größere Box wäre dort eine
 * unnötige Zusicherung, die das Clipping-Gate strenger macht als die Geometrie es verlangt. Bei
 * gemischten Definitionen ist Gleichheit unerfüllbar (die Box muss auch den Pfad fassen) — dort
 * bleibt es bei der Enthaltung.
 */
export function checkBox(definition: PictogramDefinition): PictogramIssue[] {
  const issues: PictogramIssue[] = [];
  const axes = axesOf(definition.box);
  const issue = (detail: string): void => {
    issues.push({ gate: 'box', pictogramId: definition.id, detail });
  };

  for (const path of pathsOf(definition.primitives)) {
    const { commands, problems } = tokenizePath(path.d);
    // Einen Pfad, den das Kommando-Gate ablehnt, hier nicht zusätzlich bewerten: seine
    // Kommandos sind nicht vollständig zerlegbar, und ein zweiter Befund zum selben Fehler
    // hilft dem Autor nicht.
    if (problems.length > 0) continue;
    for (const command of commands) {
      for (const [value, axis] of coordinatesOf(command, axes)) {
        if (!within(value, axis)) {
          issue(
            `Kommando "${command.command}": ${axis.name} = ${value} mm liegt außerhalb der ` +
              `Box (${axis.name} von ${axis.min} bis ${axis.max} mm).`,
          );
        }
      }
    }
  }

  const measurable = measurableOf(definition.primitives);
  for (const primitive of measurable) {
    const bounds = boundsOfMm(primitive);
    const checks: Array<[number, Axis]> = [
      [bounds.minX, axes.x],
      [bounds.maxX, axes.x],
      [bounds.minY, axes.y],
      [bounds.maxY, axes.y],
    ];
    for (const [value, axis] of checks) {
      if (!within(value, axis)) {
        issue(
          `Primitiv "${primitive.type}": ${axis.name} = ${value} mm liegt außerhalb der Box ` +
            `(${axis.name} von ${axis.min} bis ${axis.max} mm).`,
        );
      }
    }
  }

  if (measurable.length > 0 && !hasPath(definition.primitives)) {
    const hull = measurable.map(boundsOfMm).reduce<BoundsMm>(
      (acc, next) => ({
        minX: Math.min(acc.minX, next.minX),
        minY: Math.min(acc.minY, next.minY),
        maxX: Math.max(acc.maxX, next.maxX),
        maxY: Math.max(acc.maxY, next.maxY),
      }),
      { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity },
    );
    const equal: Array<[string, number, number]> = [
      ['x', hull.minX, axes.x.min],
      ['x + width', hull.maxX, axes.x.max],
      ['y', hull.minY, axes.y.min],
      ['y + height', hull.maxY, axes.y.max],
    ];
    for (const [name, actual, declared] of equal) {
      if (!unitsEqual(mmToUnits(actual), mmToUnits(declared))) {
        issue(
          `Ohne Pfade ist die Hülle vollständig berechenbar: ${name} ist ${actual} mm, ` +
            `die Box deklariert ${declared} mm.`,
        );
      }
    }
  }

  return issues;
}
```

- [ ] **Step 4: Tests, Typecheck und die volle Suite laufen lassen**

Run: `pnpm vitest run packages/core/src/pictogram-gate.test.ts && pnpm typecheck`
Expected: alle Tests der Datei PASS.

Run: `pnpm test`
Expected: vollständig grün.

- [ ] **Step 5: Commit**

```bash
git add packages/core/src/pictogram-gate.ts packages/core/src/pictogram-gate.test.ts
git commit -m "feat(core): Box-Gate liest Koordinaten je Kommando statt als Zahlenstrom"
```

---

## Task 6: Clipping-Gate

Das Clipping-Gate prüft **gegen den unverschobenen Körper**. Begründung: Die Entscheidungsnotiz vom 4. August, Abschnitt 8 belegt an der Referenz, dass das Piktogramm der Körpermitte folgt — `C.1.1` verschiebt beide um dieselben 3 mm. Die Lage der Box relativ zum Körper ist damit invariant gegenüber der Komposition, und die Prüfung braucht keine `SymbolSpec` und keinen `pictogramShiftMm`. Sie läuft einmal je Piktogramm-Grundzeichen-Paar auf Katalogebene, nicht je Komposition.

**Abweichung von der Spec-Tabelle, bewusst:** Die Spec nennt als Eingabe `PictogramDefinition + SymbolKind`. Ein Gate in `core` kann aus einem `SymbolKind` aber keine Körpergeometrie ableiten — die liegt in `catalog`, und die Paketrichtung ist `catalog → core`. Das Gate nimmt deshalb das Körper-**Primitiv**; der Aufrufer holt es aus `baseDrawing(kind)`. Das ist die einzige Variante ohne Abhängigkeitsumkehr.

**Files:**
- Modify: `packages/core/src/pictogram-gate.ts` — **dieselbe Datei wie Tasks 4 und 5, kein neues Modul.** `axesOf`, `within` und `interface Axis` sind dort modullokal und nicht exportiert; ein eigenes Modul für dieses Gate hätte keinen Zugriff darauf.
- Test: `packages/core/src/pictogram-gate.test.ts` (anfügen)

**Interfaces:**
- Consumes: `PictogramIssue`, `axesOf`, `within`, `Axis` aus Tasks 4–5 (modullokal); `boundsOfMm`
- Produces:
  - `checkClipping(definition: PictogramDefinition, body: Primitive): PictogramIssue[]` — wirft für Körperformen, deren Fläche nicht vermessen ist
  - `checkPictogram(definition: PictogramDefinition, body: Primitive): PictogramIssue[]` — die drei Gates zusammen, in der Reihenfolge Kommando, Box, Clipping

- [ ] **Step 1: Die failing tests schreiben**

An `packages/core/src/pictogram-gate.test.ts` anfügen (Import um `checkClipping`, `checkPictogram` erweitern):

```ts
/** Der Körper der Taktischen Formation, wie `base-symbols.ts` ihn führt. */
const formationBody: Primitive = {
  type: 'rect',
  role: 'body',
  x: 1,
  y: 6,
  width: 30,
  height: 20,
};

describe('Clipping-Gate', () => {
  it('nimmt eine Box an, die vollständig im Körper liegt', () => {
    expect(checkClipping(withPath('M 4 12 L 28 20'), formationBody)).toEqual([]);
  });

  it('lehnt eine Box ab, die über den Körper hinausragt', () => {
    const tall: PictogramDefinition = {
      id: 'capability.fire-fighting',
      title: 'Box ragt oben heraus',
      box: { xMm: 4, yMm: 3, widthMm: 24, heightMm: 8 },
      primitives: [{ type: 'path', role: 'pictogram', d: 'M 4 3 L 28 11' }],
    };
    const issues = checkClipping(tall, formationBody);
    expect(issues.length).toBeGreaterThan(0);
    expect(issues[0]?.gate).toBe('clipping');
    expect(issues[0]?.detail).toContain('3');
  });

  it('nimmt eine Box an, deren Kante genau auf der Körperkante liegt', () => {
    const flush: PictogramDefinition = {
      id: 'capability.fire-fighting',
      title: 'Box auf der Körperkante',
      box: { xMm: 1, yMm: 6, widthMm: 30, heightMm: 20 },
      primitives: [{ type: 'path', role: 'pictogram', d: 'M 1 6 L 31 26' }],
    };
    expect(checkClipping(flush, formationBody)).toEqual([]);
  });

  it('lehnt einen Körper ab, dessen Fläche nicht vermessen ist', () => {
    // Bei einem Polygon oder einem gedrehten Quadrat fällt Fläche und achsparallele Hülle nicht
    // zusammen: eine Box innerhalb der Hülle kann aus dem Dreieck ragen. Eine hüllenbasierte
    // Prüfung als Flächenprüfung auszugeben wäre genau die Behauptung, die dieses Projekt
    // vermeidet — dasselbe Muster wie `circleBodyProfile` und die Gruppendrehung in `boundsOfMm`.
    const hazardBody: Primitive = {
      type: 'polyline',
      role: 'body',
      closed: true,
      points: [
        [1, 28],
        [16, 3],
        [31, 28],
      ],
    };
    expect(() => checkClipping(withPath('M 4 12 L 28 20'), hazardBody)).toThrow(/nicht vermessen/);
  });

  it('lehnt ein gedrehtes Rechteck als Körper ab', () => {
    const personBody: Primitive = {
      type: 'rect',
      role: 'body',
      x: 5.393,
      y: 5.393,
      width: 21.213,
      height: 21.213,
      transform: { rotate: { angle: 45, cx: 16, cy: 16 } },
    };
    expect(() => checkClipping(withPath('M 4 12 L 28 20'), personBody)).toThrow(/nicht vermessen/);
  });
});

describe('checkPictogram', () => {
  it('führt die drei Gates zusammen und meldet Befunde aller drei', () => {
    const broken: PictogramDefinition = {
      id: 'capability.fire-fighting',
      title: 'Dreifach kaputt',
      // Box ragt über den Körper (y ab 3), und die Linie liegt außerhalb der Box.
      box: { xMm: 4, yMm: 3, widthMm: 24, heightMm: 8 },
      primitives: [
        { type: 'path', role: 'pictogram', d: 'm 4 3 l 24 8' },
        { type: 'line', role: 'pictogram', x1: 4, y1: 3, x2: 30, y2: 3 },
      ],
    };
    const gates = new Set(checkPictogram(broken, formationBody).map((issue) => issue.gate));
    expect(gates).toEqual(new Set(['command', 'box', 'clipping']));
  });

  it('meldet nichts für ein Piktogramm, das alle drei Gates besteht', () => {
    expect(checkPictogram(withPath('M 4 12 C 8 20 20 20 28 12 Z'), formationBody)).toEqual([]);
  });
});
```

- [ ] **Step 2: Tests laufen lassen und den Fehlgrund prüfen**

Run: `pnpm vitest run packages/core/src/pictogram-gate.test.ts`
Expected: die neuen Tests FAIL (`checkClipping is not a function`), die aus Tasks 4–5 bleiben grün.

- [ ] **Step 3: Das Clipping-Gate schreiben**

An `packages/core/src/pictogram-gate.ts` anfügen:

```ts
/**
 * Prüft, dass die deklarierte Box vollständig innerhalb der Körperfläche des **unverschobenen**
 * Grundzeichens liegt.
 *
 * Unverschoben, weil die Referenz belegt, dass das Piktogramm der Körpermitte folgt: `C.1.1`
 * verschiebt Körper und Piktogramm um dieselben 3 mm (Entscheidungsnotiz vom 4. August 2026,
 * Abschnitt 8). Die Lage der Box relativ zum Körper ist damit invariant gegenüber der
 * Komposition — die Prüfung braucht keine `SymbolSpec` und läuft einmal je
 * Piktogramm-Grundzeichen-Paar, nicht je Komposition.
 *
 * Nur für ein achsparalleles Rechteck: dort fallen Fläche und achsparallele Hülle zusammen. Bei
 * einem Polygon (`hazard`, `measure`, `point`) oder einem gedrehten Quadrat (`person`) tun sie es
 * nicht — eine Box innerhalb der Hülle kann aus dem Dreieck ragen. Statt eine Hüllenprüfung als
 * Flächenprüfung auszugeben, lehnt das Gate diese Körperformen explizit ab, bis ihre Fläche
 * vermessen ist. Dasselbe Muster wie `circleBodyProfile` (`layout/profiles.ts`) und die
 * Gruppendrehung in `boundsOfMm`.
 *
 * Nimmt das Körper-Primitiv, nicht den `SymbolKind`: die Körpergeometrie liegt in `catalog`, und
 * die Paketrichtung ist `catalog → core`. Der Aufrufer holt sie aus `baseDrawing(kind)`.
 */
export function checkClipping(
  definition: PictogramDefinition,
  body: Primitive,
): PictogramIssue[] {
  if (body.type !== 'rect' || body.transform !== undefined) {
    throw new Error(
      `pictogram-gate: Die Körperfläche von "${body.type}"` +
        `${body.transform !== undefined ? ' mit Transformation' : ''} ist nicht vermessen — ` +
        'das Clipping-Gate prüft nur achsparallele Rechtecke, bei denen Fläche und Hülle ' +
        'zusammenfallen.',
    );
  }

  const bodyAxes = axesOf({
    xMm: body.x,
    yMm: body.y,
    widthMm: body.width,
    heightMm: body.height,
  });
  const box = axesOf(definition.box);

  const checks: Array<[string, number, Axis]> = [
    ['x', box.x.min, bodyAxes.x],
    ['x + width', box.x.max, bodyAxes.x],
    ['y', box.y.min, bodyAxes.y],
    ['y + height', box.y.max, bodyAxes.y],
  ];

  const issues: PictogramIssue[] = [];
  for (const [name, value, axis] of checks) {
    if (!within(value, axis)) {
      issues.push({
        gate: 'clipping',
        pictogramId: definition.id,
        detail:
          `Box-Kante ${name} = ${value} mm liegt außerhalb des Körpers ` +
          `(${axis.name} von ${axis.min} bis ${axis.max} mm).`,
      });
    }
  }
  return issues;
}

/**
 * Die drei Gates zusammen — das Kriterium, das für Piktogramme an die Stelle des strukturell
 * unerreichbaren Fingerprint-Gates tritt (Spec Abschnitt 7). Reihenfolge: Kommando, Box,
 * Clipping, damit der Autor die Ursache vor ihren Folgen liest.
 */
export function checkPictogram(
  definition: PictogramDefinition,
  body: Primitive,
): PictogramIssue[] {
  return [
    ...checkCommands(definition),
    ...checkBox(definition),
    ...checkClipping(definition, body),
  ];
}
```

`axesOf` erwartet eine `PictogramBox`; der Körper wird dafür in dieselbe Form gebracht. `body.transform !== undefined` statt `body.transform?.rotate !== undefined`: auch ein `translate` am Körper wäre eine Lage, die diese Prüfung nicht abbildet.

- [ ] **Step 4: Tests, Typecheck und die volle Suite laufen lassen**

Run: `pnpm vitest run packages/core/src/pictogram-gate.test.ts && pnpm typecheck && pnpm test`
Expected: alles grün.

- [ ] **Step 5: Commit**

```bash
git add packages/core/src/pictogram-gate.ts packages/core/src/pictogram-gate.test.ts
git commit -m "feat(core): Clipping-Gate gegen den unverschobenen Körper"
```

---

## Task 7: Piktogramm-Register im Katalog

`capability.fire-fighting` wird auf `PictogramDefinition` mit deklarierter Box umgestellt, das Register wird von `Record` auf `Partial<Record<…>>` mit werfendem Zugriff umgebaut, und ein Katalogtest schickt jedes Piktogramm durch alle drei Gates.

**Warum `Partial`:** Ohne diese Umstellung wäre jede Erweiterung von `CapabilityId` in D.1 ein Typfehler, solange nicht alle 88 Piktogramme vorliegen — das heutige totale `Record` erzwingt Vollständigkeit, die erst am Ende von D.1 besteht. Die Regel „kein Eintrag ohne Beleg" ist dieselbe wie bei den Organisationsfarben (Entscheidungsnotiz vom 4. August, Abschnitt 4); sie gilt hier für die Geometrie statt für die Farbe.

`capabilityPictogram` bleibt in diesem Task als dünner Wrapper bestehen, damit `compose` unberührt und der Task für sich grün ist. Task 8 entfernt ihn.

**Files:**
- Move: `packages/catalog/src/capabilities.ts` → `packages/catalog/src/pictograms/capabilities.ts`
- Move: `packages/catalog/src/capabilities.test.ts` → `packages/catalog/src/pictograms/capabilities.test.ts`
- Create: `packages/catalog/src/pictograms/index.ts`
- Create: `packages/catalog/src/pictograms/gate.test.ts`
- Modify: `packages/catalog/src/index.ts:8` (Export-Pfad)

**Interfaces:**
- Consumes: `PictogramDefinition`, `PictogramId`, `CapabilityId` aus `@einsatzzeichen/schema`; `checkPictogram` aus `@einsatzzeichen/core`; `baseDrawing` aus `./base-symbols.js`
- Produces:
  - `CAPABILITY_PICTOGRAMS: Partial<Record<\`capability.${CapabilityId}\`, PictogramDefinition>>`
  - `pictogram(id: PictogramId): PictogramDefinition` — wirft bei einer ID ohne Definition
  - `ALL_PICTOGRAMS: readonly PictogramDefinition[]`
  - `capabilityPictogram(id: CapabilityId): readonly Primitive[]` — unverändert in der Signatur, entfällt in Task 8

- [ ] **Step 1: Die Dateien verschieben und den Test umschreiben**

```bash
mkdir -p packages/catalog/src/pictograms
git mv packages/catalog/src/capabilities.ts packages/catalog/src/pictograms/capabilities.ts
git mv packages/catalog/src/capabilities.test.ts packages/catalog/src/pictograms/capabilities.test.ts
```

`packages/catalog/src/pictograms/capabilities.test.ts` vollständig ersetzen:

```ts
import { describe, expect, it } from 'vitest';
import { boundsOfMm } from '@einsatzzeichen/core';
import { CAPABILITY_PICTOGRAMS } from './capabilities.js';
import { pictogram } from './index.js';

describe('Fähigkeitspiktogramme', () => {
  it('zeichnet Brandbekämpfung als Strahlrohr mit Sprühkegel', () => {
    const parts = pictogram('capability.fire-fighting').primitives;
    expect(parts).toHaveLength(3);
    for (const part of parts) {
      expect(part.type).toBe('line');
      expect(part.role).toBe('pictogram');
      expect(part.style?.stroke).toBe('schwarz');
    }
  });

  it('deklariert für Brandbekämpfung die Hülle, die die Geometrie tatsächlich hat', () => {
    const definition = pictogram('capability.fire-fighting');
    const hull = definition.primitives.map(boundsOfMm);
    expect(Math.min(...hull.map((b) => b.minX))).toBeCloseTo(definition.box.xMm, 6);
    expect(Math.min(...hull.map((b) => b.minY))).toBeCloseTo(definition.box.yMm, 6);
    expect(Math.max(...hull.map((b) => b.maxX))).toBeCloseTo(
      definition.box.xMm + definition.box.widthMm,
      6,
    );
    expect(Math.max(...hull.map((b) => b.maxY))).toBeCloseTo(
      definition.box.yMm + definition.box.heightMm,
      6,
    );
  });

  it('bleibt innerhalb des Körpers der Taktischen Formation', () => {
    for (const part of pictogram('capability.fire-fighting').primitives) {
      const bounds = boundsOfMm(part);
      expect(bounds.minX).toBeGreaterThanOrEqual(1);
      expect(bounds.maxX).toBeLessThanOrEqual(31);
      expect(bounds.minY).toBeGreaterThanOrEqual(6);
      expect(bounds.maxY).toBeLessThanOrEqual(26);
    }
  });

  it('wirft bei einer ID ohne Definition, statt undefined zu liefern', () => {
    // Dasselbe Muster wie `organizationColor`, `baseDrawing` und `resolveElement`: ein Register
    // mit Lücken ist Partial, und der Zugriff darauf wirft — ein stilles `undefined` würde als
    // leeres Piktogramm gerendert.
    expect(() => pictogram('capability.not-a-capability' as never)).toThrow(/Kein Piktogramm/);
  });

  it('trägt für jeden Eintrag die ID als Schlüssel und im Feld', () => {
    // Ohne diese Prüfung könnte ein Eintrag unter fremdem Schlüssel stehen, und jede Meldung
    // eines Gates nennte die falsche ID.
    for (const [key, definition] of Object.entries(CAPABILITY_PICTOGRAMS)) {
      expect(definition?.id).toBe(key);
    }
  });
});
```

- [ ] **Step 2: Tests laufen lassen und den Fehlgrund prüfen**

Run: `pnpm vitest run packages/catalog/src/pictograms/capabilities.test.ts`
Expected: FAIL — `./index.js` fehlt, `CAPABILITY_PICTOGRAMS` existiert nicht.

- [ ] **Step 3: `capabilities.ts` auf `PictogramDefinition` umstellen**

`packages/catalog/src/pictograms/capabilities.ts` vollständig ersetzen:

```ts
import {
  DEFAULT_STROKE_WIDTH_MM,
  type CapabilityId,
  type PictogramDefinition,
  type Primitive,
  type Style,
} from '@einsatzzeichen/schema';

const STROKE: Style = { stroke: 'schwarz', strokeWidth: DEFAULT_STROKE_WIDTH_MM, fill: 'none' };

function line(x1: number, y1: number, x2: number, y2: number): Primitive {
  return { type: 'line', role: 'pictogram', x1, y1, x2, y2, style: STROKE };
}

/**
 * Piktogramme des Kapitels 4 (Fähigkeiten). Alle Geometrien sind eigenständige Konstruktionen
 * nach der Bildidee der Referenz; Maße und Koordinaten stammen nicht aus den Referenzdateien.
 *
 * `Partial`, nicht total: `CapabilityId` wächst in D.1 auf 88 Literale, die Geometrien entstehen
 * aber je Unter-Slice. Ein totales `Record` erzwänge eine Vollständigkeit, die erst am Ende von
 * D.1 besteht — dasselbe Muster wie `ORGANIZATION_COLORS` und `BODIES`, mit derselben Regel:
 * kein Eintrag ohne Beleg, und der Zugriff auf eine Lücke wirft.
 */
export const CAPABILITY_PICTOGRAMS: Partial<
  Record<`capability.${CapabilityId}`, PictogramDefinition>
> = {
  'capability.fire-fighting': {
    id: 'capability.fire-fighting',
    title: 'Brandbekämpfung',
    // Zusicherung des Autors, vom Box-Gate gegen die Geometrie geprüft. Ohne Pfad-Primitive ist
    // die Hülle vollständig berechenbar, das Gate fordert deshalb Gleichheit statt Enthaltung.
    box: { xMm: 3, yMm: 9, widthMm: 23, heightMm: 14 },
    primitives: [line(3, 16, 26, 16), line(16, 16, 26, 9), line(16, 16, 26, 23)],
  },
};
```

- [ ] **Step 4: Das Register mit werfendem Zugriff schreiben**

`packages/catalog/src/pictograms/index.ts`:

```ts
import type { CapabilityId, PictogramDefinition, PictogramId, Primitive } from '@einsatzzeichen/schema';
import { CAPABILITY_PICTOGRAMS } from './capabilities.js';

/**
 * Alle Piktogramme des Katalogs, ein Modul je Bereich. In D.0 trägt nur `capability.` Einträge;
 * `state.`, `comms.`, `damage.` und `wildfire.` kommen in D.2 bis D.4 als eigene Module hinzu und
 * werden hier zusammengeführt.
 */
const PICTOGRAMS: Partial<Record<PictogramId, PictogramDefinition>> = {
  ...CAPABILITY_PICTOGRAMS,
};

/**
 * Löst eine Piktogramm-ID auf und wirft bei einer ID ohne Definition — dasselbe Muster wie
 * `organizationColor`, `baseDrawing` und `resolveElement`. Ein stilles `undefined` würde als
 * leeres Piktogramm gerendert und wäre schwerer zu bemerken als ein Fehler.
 */
export function pictogram(id: PictogramId): PictogramDefinition {
  const definition = PICTOGRAMS[id];
  if (definition === undefined) {
    throw new Error(`Kein Piktogramm "${id}" im Katalog.`);
  }
  return definition;
}

/** Alle definierten Piktogramme. Eingabe der Gate-Tests. */
export const ALL_PICTOGRAMS: readonly PictogramDefinition[] = Object.values(PICTOGRAMS).filter(
  (definition): definition is PictogramDefinition => definition !== undefined,
);

/**
 * Übergangswrapper für den bestehenden `capabilityPictogram`-Port in `compose`. Entfällt, sobald
 * `CatalogPorts` auf `pictogram` umgestellt ist.
 */
export function capabilityPictogram(id: CapabilityId): readonly Primitive[] {
  return pictogram(`capability.${id}`).primitives;
}
```

In `packages/catalog/src/index.ts` Zeile 8 ersetzen:

```ts
export * from './pictograms/index.js';
```

Und den Export von `./capabilities.js` entfernen — die Datei liegt jetzt unter `pictograms/` und wird über `pictograms/index.js` erreicht. `CAPABILITY_PICTOGRAMS` wird bewusst **nicht** vom Paketindex re-exportiert: außerhalb von `catalog` ist `pictogram(id)` der einzige Zugang, damit niemand am werfenden Zugriff vorbei liest.

- [ ] **Step 5: Tests laufen lassen**

Run: `pnpm vitest run packages/catalog/src/pictograms/capabilities.test.ts && pnpm typecheck`
Expected: alle fünf PASS, keine Typfehler. `recipes.ts` importiert `capabilityPictogram` weiterhin — der Import muss auf `./pictograms/index.js` gezogen werden, falls der Typecheck ihn meldet.

- [ ] **Step 6: Den Gate-Anwendungstest schreiben**

`packages/catalog/src/pictograms/gate.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { checkBox, checkClipping, checkCommands } from '@einsatzzeichen/core';
import type { Primitive } from '@einsatzzeichen/schema';
import { baseDrawing } from '../base-symbols.js';
import { ALL_PICTOGRAMS } from './index.js';

/**
 * Die Körperfläche, gegen die alle Piktogramme in D.0 geprüft werden. Weitere Körperformen
 * kommen dazu, sobald ihre Fläche vermessen ist — das Clipping-Gate wirft für Polygone und
 * gedrehte Quadrate ausdrücklich, statt eine Hüllenprüfung als Flächenprüfung auszugeben.
 */
function formationBody(): Primitive {
  const body = baseDrawing('formation').children.find((child) => child.role === 'body');
  if (body === undefined) throw new Error('Grundzeichen "formation" hat kein body-Primitiv.');
  return body;
}

describe('Piktogramm-Gates über den Katalogbestand', () => {
  it('hat mindestens ein Piktogramm zu prüfen', () => {
    // Ohne diese Zusicherung wären die drei Tests unten bei leerem Bestand trivial grün.
    expect(ALL_PICTOGRAMS.length).toBeGreaterThan(0);
  });

  it.each(ALL_PICTOGRAMS.map((definition) => [definition.id, definition] as const))(
    'besteht für %s das Kommando-Gate',
    (_id, definition) => {
      expect(checkCommands(definition)).toEqual([]);
    },
  );

  it.each(ALL_PICTOGRAMS.map((definition) => [definition.id, definition] as const))(
    'besteht für %s das Box-Gate',
    (_id, definition) => {
      expect(checkBox(definition)).toEqual([]);
    },
  );

  it.each(ALL_PICTOGRAMS.map((definition) => [definition.id, definition] as const))(
    'besteht für %s das Clipping-Gate gegen die Taktische Formation',
    (_id, definition) => {
      expect(checkClipping(definition, formationBody())).toEqual([]);
    },
  );
});
```

- [ ] **Step 7: Gate-Test laufen lassen**

Run: `pnpm vitest run packages/catalog/src/pictograms/gate.test.ts`
Expected: PASS. Schlägt das Box-Gate fehl, ist die Box in `capabilities.ts` falsch deklariert — die Hülle der drei Linien ist 3…26 × 9…23, also `{ xMm: 3, yMm: 9, widthMm: 23, heightMm: 14 }`.

- [ ] **Step 8: Volle Suite und Coverage-Gate**

Run: `pnpm test && pnpm typecheck && pnpm cli coverage`
Expected: alles grün, „Coverage-Gate bestanden." Die Snapshots sind unverändert: `compose` erzeugt noch keine Gruppe.

- [ ] **Step 9: Commit**

```bash
git add packages/catalog/src packages/catalog/src/index.ts
git commit -m "refactor(catalog): Piktogramme als PictogramDefinition in einem Partial-Register"
```

---

## Task 8: `compose` platziert Piktogramme als eine Gruppe

Der blockierende Befund der Spec: `shiftY` wirft bedingungslos für `type: 'path'`, und `compose` bildet es über jedes Piktogramm-Primitiv ab. Statt Koordinaten umzuschreiben, umschließt `compose` alle Piktogramm-Primitive mit genau einer Gruppe, die die Verschiebung trägt.

**`shiftY` bleibt unverändert** und wirft weiterhin für Pfade. Das ist Absicht: die Funktion wird für Piktogramme nicht mehr aufgerufen, behält aber ihren Schutz für die Körperplatzierung (`layout/profiles.ts`), wo sie auf vermessene Nicht-Pfad-Geometrie wirkt. Commit `80da41f` wird nicht zurückgenommen.

**Files:**
- Modify: `packages/core/src/compose.ts:24-29` (`CatalogPorts`), `:93-96` (Piktogramm-Platzierung), `:13` (Import)
- Modify: `packages/catalog/src/recipes.ts:1-13` (Ports)
- Modify: `packages/catalog/src/pictograms/index.ts` (Wrapper entfernen)
- Modify: `packages/catalog/src/recipes.test.ts:7-10, 72-110`
- Modify: `packages/catalog/src/__snapshots__/C.1.1.svg`, `C.1.2.svg` (regeneriert)

**Interfaces:**
- Consumes: `pictogram(id)` aus `catalog/pictograms/index.js`; `Translation` aus Task 1
- Produces:
  - `CatalogPorts.pictogram(id: PictogramId): PictogramDefinition` — ersetzt `capabilityPictogram`
  - `compose` liefert für eine Spec mit Fähigkeiten genau **ein** Kind mit `role: 'pictogram'`: eine Gruppe mit `transform.translate`, deren Kinder die unverschobenen Piktogramm-Primitive sind. Ohne Fähigkeiten entsteht keine Gruppe.

- [ ] **Step 1: Den failing test für die Gruppenstruktur schreiben**

An `packages/catalog/src/recipes.test.ts` anfügen:

```ts
describe('Piktogramm-Platzierung als Gruppe', () => {
  it('erzeugt genau eine Piktogramm-Gruppe mit der Verschiebung als Transformation', () => {
    const drawing = composeFromCatalog(RECIPES['C.1.1'].spec);
    const pictograms = drawing.children.filter((c) => c.role === 'pictogram');
    expect(pictograms).toHaveLength(1);
    const group = pictograms[0];
    expect(group?.type).toBe('group');
    if (group?.type !== 'group') return;
    // C.1.1 verschiebt den Körper um 3 mm (Anker 6 → 9); das Piktogramm folgt der Körpermitte.
    expect(group.transform?.translate?.dxMm).toBe(0);
    expect(group.transform?.translate?.dyMm).toBeCloseTo(3, 6);
    // Die Kinder tragen ihre Autorenkoordinaten unverändert — die Verschiebung sitzt außen.
    expect(group.children).toHaveLength(3);
    for (const child of group.children) {
      expect(child.role).toBe('pictogram');
    }
  });

  it('verschiebt die Gruppe bei unverändertem Körper um null, statt sie weglassen', () => {
    // C.1.2 (Reihe) lässt den Körper bei Anker 6. Die Gruppe entsteht trotzdem: eine
    // Sonderbehandlung für Delta 0 wäre ein zweiter Codepfad ohne fachlichen Anlass.
    const drawing = composeFromCatalog(RECIPES['C.1.2'].spec);
    const group = drawing.children.find((c) => c.role === 'pictogram');
    expect(group?.type).toBe('group');
    expect(group?.transform?.translate?.dyMm).toBeCloseTo(0, 6);
  });

  it('erzeugt keine Gruppe, wenn die Spec keine Fähigkeit nennt', () => {
    const drawing = composeFromCatalog(RECIPES['D.3.7'].spec);
    expect(drawing.children.filter((c) => c.role === 'pictogram')).toHaveLength(0);
  });
});
```

- [ ] **Step 2: Den bestehenden Piktogramm-Rezepttest auf die Gruppe umschreiben**

In `packages/catalog/src/recipes.test.ts` die Hilfsfunktion (`recipes.test.ts:7-10`) ersetzen:

```ts
/**
 * Effektive y-Lage der waagerechten Brandbekämpfungs-Linie: ihre Autorenkoordinate plus die
 * Verschiebung ihrer Gruppe. Seit die Piktogramme von einer Gruppe mit `transform.translate`
 * umschlossen werden, steht der an der Referenz vermessene Sollwert nicht mehr am Primitiv —
 * die fachliche Aussage ist unverändert, sie wird eine Ebene tiefer gelesen.
 */
function horizontalPictogramLineYMm(drawing: Drawing): number | undefined {
  const group = drawing.children.find(
    (c): c is Primitive & { type: 'group' } => c.type === 'group' && c.role === 'pictogram',
  );
  if (group === undefined) return undefined;
  const line = group.children.find(
    (c): c is Primitive & { type: 'line' } => c.type === 'line' && c.y1 === c.y2,
  );
  if (line === undefined) return undefined;
  return line.y1 + (group.transform?.translate?.dyMm ?? 0);
}
```

Den Import in Zeile 3 auf `import type { Drawing, Primitive } from '@einsatzzeichen/schema';` erweitern.

Und im Test „verschiebt das Piktogramm mit der Körpermitte" (`recipes.test.ts:72-110`) den Block ab `// Der an der Referenz konkret vermessene Sollwert` ersetzen:

```ts
      // Der an der Referenz konkret vermessene Sollwert, direkt an der waagerechten Linie
      // geprüft statt nur über die Hüllenmitte des gesamten Piktogramms.
      const lineYMm = horizontalPictogramLineYMm(drawing);
      expect(lineYMm).toBeDefined();
      if (lineYMm !== undefined) {
        expect(lineYMm).toBeCloseTo(expectedCenterYMm, 6);
      }
```

Die Zeilen 84–86 (`const pictogram = drawing.children.filter(...)`, `expect(pictogram.length).toBeGreaterThan(0)`) und 93–96 bleiben unverändert: `filter` liefert jetzt die Gruppe, und `boundsOfMm` auf ihr ist seit Task 1 die verschobene Hülle — genau der Wert, den der Test braucht.

- [ ] **Step 3: Tests laufen lassen und den Fehlgrund prüfen**

Run: `pnpm vitest run packages/catalog/src/recipes.test.ts`
Expected: die drei neuen Tests FAIL (`pictograms` hat Länge 3 statt 1, `group?.type` ist `'line'`), und „verschiebt das Piktogramm mit der Körpermitte" FAIL, weil `horizontalPictogramLineYMm` keine Gruppe findet. Das belegt, dass der Test die neue Struktur prüft und nicht die alte.

- [ ] **Step 4: `compose` umstellen**

In `packages/core/src/compose.ts`:

Den Import in Zeile 13 auf `import { boundsOfMm } from './bounds.js';` reduzieren — `shiftY` wird hier nicht mehr gebraucht. Den Import aus `@einsatzzeichen/schema` um `type PictogramDefinition` und `type PictogramId` erweitern; `type CapabilityId` bleibt (für die Präfigierung).

`CatalogPorts` (`compose.ts:24-29`):

```ts
/** Zugriffe auf den Katalog. Als Ports übergeben, damit core nicht von catalog abhängt. */
export interface CatalogPorts {
  baseDrawing(kind: SymbolKind): Drawing;
  organizationColor(id: OrganizationId): ColorToken;
  strengthHead(id: StrengthId): HeadShape;
  /**
   * Liefert die volle Definition, nicht nur die Primitive: die deklarierte Box trägt die drei
   * Gates. Damit hat `PictogramDefinition` von Beginn an zwei Konsumenten und ist kein
   * vorbereitetes Feld.
   */
  pictogram(id: PictogramId): PictogramDefinition;
}
```

Und die Piktogramm-Platzierung (`compose.ts:88-96`) ersetzen:

```ts
  // Piktogramme sind auf den unverschobenen Körper hin entworfen (Mitte bei 16 mm). Der
  // Kompositionsmotor kann den Körper senkrecht verschieben oder verkleinern, um Platz für die
  // Kopfzone zu schaffen — das Piktogramm muss dieser Körpermitte folgen, sonst sitzt es an der
  // absoluten Referenzstelle statt an der tatsächlichen Körpermitte. Die Referenz belegt das:
  // C.1.1 (Stapel, Körper verschoben) verschiebt das Piktogramm um dieselben 3 mm, C.1.2
  // (Reihe, Körper unverschoben) lässt es unverändert.
  //
  // Die Verschiebung sitzt an genau einer Gruppe und nicht an jedem Primitiv: ein Pfad trägt
  // seine Koordinaten unzerlegt im `d`-String und kann nicht primitivweise verschoben werden
  // (`shiftY` lehnt das ausdrücklich ab). Auf der Gruppe wirkt die Verschiebung nach außen auf
  // das fertige Ergebnis und ist damit von einer Drehung der Kinder unabhängig.
  const pictogramShiftMm = centerYMm(placedBody) - centerYMm(body);
  const pictogramPrimitives = (spec.capabilities ?? []).flatMap(
    (id) => catalog.pictogram(pictogramIdOf(id)).primitives,
  );
  const pictograms: Primitive[] =
    pictogramPrimitives.length > 0
      ? [
          {
            type: 'group',
            role: 'pictogram',
            transform: { translate: { dxMm: 0, dyMm: pictogramShiftMm } },
            children: pictogramPrimitives,
          },
        ]
      : [];
```

Und über `compose` die Präfigierung als benannte Funktion, damit sie an genau einer Stelle steht:

```ts
/**
 * `SymbolSpec.capabilities` trägt `CapabilityId` (`'fire-fighting'`), der Piktogrammraum trägt
 * präfigierte IDs (`'capability.fire-fighting'`). Die Abbildung steht hier an einer Stelle und
 * nicht an jedem Aufrufort: die übrigen vier ID-Räume (Kapitel 5.8, Anhänge J–M) haben in
 * `SymbolSpec` noch kein Feld und kommen erst mit D.2 bis D.4 dazu.
 */
function pictogramIdOf(id: CapabilityId): PictogramId {
  return `capability.${id}`;
}
```

- [ ] **Step 5: Den Katalog-Port umstellen und den Wrapper entfernen**

In `packages/catalog/src/recipes.ts` den Import und `PORTS` ersetzen:

```ts
import { compose, type CatalogPorts } from '@einsatzzeichen/core';
import type { Drawing, SymbolSpec } from '@einsatzzeichen/schema';
import { baseDrawing } from './base-symbols.js';
import { organizationColor } from './organizations.js';
import { pictogram } from './pictograms/index.js';
import { strengthHead } from './strengths.js';

const PORTS: CatalogPorts = {
  baseDrawing,
  organizationColor,
  strengthHead,
  pictogram,
};
```

In `packages/catalog/src/pictograms/index.ts` den Übergangswrapper `capabilityPictogram` samt seinem Kommentar und den nun unbenutzten Importen `CapabilityId` und `Primitive` entfernen. `noUnusedLocals` meldet sie sonst.

- [ ] **Step 6: Tests laufen lassen — Snapshots schlagen erwartungsgemäß fehl**

Run: `pnpm vitest run packages/catalog/src/recipes.test.ts && pnpm typecheck`
Expected: `recipes.test.ts` vollständig PASS, kein Typfehler.

Run: `pnpm vitest run packages/catalog/src/snapshots.test.ts`
Expected: **FAIL** für `C.1.1` und `C.1.2` — genau das, was Festlegung 1 im Plankopf ankündigt. `base.*` und `D.3.7` bleiben grün (keine Piktogramme).

- [ ] **Step 7: Den erwarteten Snapshot-Diff an Zahlen festmachen, dann regenerieren**

Die Zusage ist nicht „der Snapshot bleibt gleich", sondern **„die effektiven Koordinaten bleiben gleich, der Diff ist ausschließlich die Umklammerung"**. Diese Erwartung steht vor dem Regenerieren fest, damit das Ergebnis geprüft und nicht geglaubt wird:

| Größe | vorher (C.1.1) | nachher (C.1.1) | Summe |
|---|---|---|---|
| waagerechte Linie `y1`/`y2` | `53.858` | `45.354` + `translate(0 8.504)` | `53.858` |
| obere Schräge `y2` | `34.016` | `25.512` + `8.504` | `34.016` |
| untere Schräge `y2` | `73.701` | `65.197` + `8.504` | `73.701` |

`8.504` ist `mmToUnits(3)` auf drei Nachkommastellen (`formatUnits`). Damit müssen die drei `<line>`-Tags in `C.1.1.svg` nach der Umstellung **zeichengleich** mit denen in `C.1.2.svg` sein — die beiden Rezepte unterscheiden sich dann nur noch in der Kopfzone, im `translate` der Gruppe und in der Körper-`y`. Das ist der stärkste Beleg dafür, dass die Gruppen-Translation dasselbe Ergebnis liefert wie die frühere primitivweise Verschiebung.

```bash
pnpm vitest run packages/catalog/src/snapshots.test.ts -u
git diff --stat packages/catalog/src/__snapshots__/
git diff packages/catalog/src/__snapshots__/
```

- [ ] **Step 8: Den Diff gegen die Zusage prüfen**

Von Hand am `git diff` bestätigen, alle vier Punkte:

1. Nur `C.1.1.svg` und `C.1.2.svg` sind geändert — kein `base.*`, kein `D.3.7`.
2. Die drei `<line>`-Tags stehen jetzt in `<g transform="translate(0 8.504)">` (C.1.1) bzw. `<g transform="translate(0 0)">` (C.1.2).
3. In C.1.1 sind die `<line>`-Attribute genau die aus C.1.2 geworden; die Summe aus Linien-`y` und `translate` ergibt die alten Werte aus der Tabelle in Step 7.
4. `<circle>`- und `<rect>`-Tags sind unverändert — Kopfzone und Körper sind von dieser Umstellung nicht betroffen.

Trifft einer der vier Punkte nicht zu, ist die Umstellung nicht äquivalent: `git checkout packages/catalog/src/__snapshots__/` und die Ursache suchen, statt den Snapshot zu akzeptieren.

- [ ] **Step 9: Volle Suite und Coverage-Gate**

Run: `pnpm test && pnpm typecheck && pnpm cli coverage`
Expected: alles grün. Insbesondere `reproduziert die Referenz C.1.1/C.1.2` (Fingerprint gegen `fingerprints.json`) — das Fingerprint-Gate vergleicht ausschließlich `role: 'body'` und ist von der Piktogramm-Struktur unberührt; wäre es rot, hätte die Umstellung den Körper angefasst.

- [ ] **Step 10: Commit**

```bash
git add packages/core/src/compose.ts packages/catalog/src/recipes.ts \
  packages/catalog/src/recipes.test.ts packages/catalog/src/pictograms/index.ts \
  packages/catalog/src/__snapshots__/C.1.1.svg packages/catalog/src/__snapshots__/C.1.2.svg
git commit -m "feat(core): Piktogramme als eine Gruppe mit Verschiebung platzieren

Ersetzt die primitivweise shiftY-Abbildung, die für Pfad-Primitive
bedingungslos wirft. shiftY selbst bleibt unverändert und behält seinen
Schutz für die Körperplatzierung.

Die Snapshots von C.1.1 und C.1.2 ändern sich um genau die Umklammerung:
die effektiven Koordinaten sind identisch (45.354 + 8.504 = 53.858)."
```

---

## Task 9: Das erste Pfad-Piktogramm — `capability.service-water` (4.3.2)

Der Nachweis am Mechanismus, nicht an der Menge. **Genau ein** neues Piktogramm mit Kurven als `path`.

**Warum 4.3.2 und nicht 4.7.10:** Der Fingerprint von `4.3.2_Löschwasser Brauchwasser.svg` trägt `curvedPaths: 1` — die Bildidee **enthält** dort eine Kurve, ein `path` ist also nicht künstlich, sondern sachlich nötig. Sie hat eine Bildidee im Upstream (`brauchwasser`) und liegt in derselben Kapitelgruppe wie das bereits umgesetzte 4.3.1. `4.7.10 Heben von Lasten` sieht als Kandidat gut aus, trägt aber `curvedPaths: 0`: die BABZ-Darstellung ist geradlinig, ein Kurvenpiktogramm daraus zu machen wäre eine Erfindung.

**Der Dateiname ist `4.3.2_Löschwasser Brauchwasser.svg`** — mit Leerzeichen, nicht mit Schrägstrich. `checkElementEntries` prüft `namesake.startsWith('4.3.2_')`; mit „Löschwasser/Brauchwasser" bricht das Gate.

**Die Geometrie ist eigenständig konstruiert.** Die Bildidee ist eine gefüllte Doppelwelle über die Körperbreite (Wasser). Koordinaten, Wellenhöhe und Banddicke sind hier gewählt, nicht aus der Referenzdatei entnommen — deren `d`-String ist relativ kodiert, in Pixeln auf 90,709 und für dieses Projekt in jeder Hinsicht unbrauchbar.

**Files:**
- Modify: `packages/schema/src/taxonomy.ts:50-51` (`CapabilityId`)
- Modify: `packages/catalog/src/pictograms/capabilities.ts`
- Test: `packages/catalog/src/pictograms/capabilities.test.ts` (anfügen)
- Test: `packages/catalog/src/recipes.test.ts` (anfügen)

**Interfaces:**
- Consumes: `CAPABILITY_PICTOGRAMS`, `pictogram` aus Task 7; `composeFromCatalog` aus `recipes.ts`
- Produces:
  - `CapabilityId` = `'fire-fighting' | 'service-water'`
  - `CAPABILITY_PICTOGRAMS['capability.service-water']` mit `box: { xMm: 4, yMm: 12.5, widthMm: 24, heightMm: 5 }` und einem einzigen `path`-Primitiv

- [ ] **Step 1: Die failing tests für das Piktogramm schreiben**

An `packages/catalog/src/pictograms/capabilities.test.ts` anfügen:

```ts
describe('Löschwasser/Brauchwasser (4.3.2)', () => {
  it('zeichnet die Doppelwelle als einen gefüllten Pfad', () => {
    const definition = pictogram('capability.service-water');
    expect(definition.title).toBe('Löschwasser, Brauchwasser');
    expect(definition.primitives).toHaveLength(1);
    const [wave] = definition.primitives;
    expect(wave?.type).toBe('path');
    expect(wave?.role).toBe('pictogram');
    // Eine gefüllte Fläche, keine Strichzeichnung: die Bildidee der Referenz ist ein Wasserband.
    expect(wave?.style?.fill).toBe('schwarz');
    expect(wave?.style?.stroke).toBe('none');
  });

  it('verwendet ausschließlich absolute Kommandos aus M L H V C Q Z', () => {
    const [wave] = pictogram('capability.service-water').primitives;
    expect(wave?.type).toBe('path');
    if (wave?.type !== 'path') return;
    // Direkt am String, zusätzlich zum Gate: ein relatives Kommando wäre hier ein Kleinbuchstabe.
    expect(wave.d).toMatch(/^[MLHVCQZ0-9.,\s-]+$/);
    expect(wave.d).toContain('C');
  });

  it('enthält Kurven — sonst wäre der Nachweis für Pfad-Piktogramme keiner', () => {
    // Der Fingerprint der Referenzdatei trägt curvedPaths: 1. Ein geradliniges Piktogramm hier
    // würde den Mechanismus nicht belegen, für den dieser Slice existiert.
    const [wave] = pictogram('capability.service-water').primitives;
    if (wave?.type !== 'path') return;
    expect((wave.d.match(/C/g) ?? []).length).toBeGreaterThan(1);
  });
});
```

- [ ] **Step 2: Tests laufen lassen und den Fehlgrund prüfen**

Run: `pnpm vitest run packages/catalog/src/pictograms/capabilities.test.ts`
Expected: FAIL. `pnpm typecheck` meldet zusätzlich, dass `'capability.service-water'` kein `PictogramId` ist — der Beleg, dass `CapabilityId` noch nicht gewachsen ist.

- [ ] **Step 3: `CapabilityId` erweitern**

In `packages/schema/src/taxonomy.ts` Zeile 50–51 ersetzen:

```ts
/**
 * Fähigkeiten nach Kapitel 4. Wächst je Unter-Slice, nicht vorauseilend: ein Literal ohne
 * Piktogramm wäre eine typsichere Behauptung über eine Fähigkeit, die der Katalog nicht zeichnen
 * kann. D.1 bringt die vollen 88.
 */
export type CapabilityId = 'fire-fighting' | 'service-water';
```

- [ ] **Step 4: Das Piktogramm schreiben**

In `packages/catalog/src/pictograms/capabilities.ts` in `CAPABILITY_PICTOGRAMS` ergänzen:

```ts
  'capability.service-water': {
    id: 'capability.service-water',
    title: 'Löschwasser, Brauchwasser',
    box: { xMm: 4, yMm: 12.5, widthMm: 24, heightMm: 5 },
    primitives: [
      {
        type: 'path',
        role: 'pictogram',
        // Eigenständige Konstruktion nach der Bildidee von 4.3.2: ein Wasserband aus zwei
        // Wellenbergen mit Tal in der Mitte, 1 mm dick, mittig auf dem unverschobenen Körper.
        // Oberkante von links nach rechts, Unterkante zurück, geschlossen — deshalb eine
        // gefüllte Fläche und kein Strich.
        //
        // Nur absolute M, C, V und Z. Bewusst keine Ellipsenbögen (`A`): ihre Parameter sind
        // keine Koordinaten, das Box-Gate könnte sie nicht prüfen. Alle Kontrollpunkte liegen
        // in der deklarierten Box; da eine Bezierkurve die konvexe Hülle ihrer Kontrollpunkte
        // nie verlässt, ist damit die ganze Kurve darin.
        d:
          'M 4 16.5 C 6 16.5 8 12.5 10 12.5 C 12 12.5 14 16.5 16 16.5 ' +
          'C 18 16.5 20 12.5 22 12.5 C 24 12.5 26 16.5 28 16.5 V 17.5 ' +
          'C 26 17.5 24 13.5 22 13.5 C 20 13.5 18 17.5 16 17.5 ' +
          'C 14 17.5 12 13.5 10 13.5 C 8 13.5 6 17.5 4 17.5 Z',
        style: { fill: 'schwarz', stroke: 'none' },
      },
    ],
  },
```

- [ ] **Step 5: Piktogramm- und Gate-Tests laufen lassen**

Run: `pnpm vitest run packages/catalog/src/pictograms/`
Expected: PASS — sowohl `capabilities.test.ts` als auch `gate.test.ts`. Das Box-Gate prüft jetzt einen echten Kurvenpfad: alle x liegen in [4, 28], alle y in [12.5, 17.5], das Clipping-Gate prüft [4, 28] × [12.5, 17.5] gegen den Körper 1…31 × 6…26.

Schlägt das Box-Gate fehl, liegt eine Koordinate außerhalb — der Befund nennt Kommando, Achse und Wert.

- [ ] **Step 6: Die failing tests für die Platzierung in beiden Layoutfällen schreiben**

An `packages/catalog/src/recipes.test.ts` anfügen. Diese Tests belegen Erfolgskriterium 1 der Spec: ein Piktogramm mit Kurven wird in beiden Rezepten korrekt platziert.

```ts
describe('Pfad-Piktogramm in beiden Layoutfällen (Spec-Erfolgskriterium 1)', () => {
  /**
   * Die beiden Layoutfälle der Referenz, mit dem Kurven-Piktogramm statt der Brandbekämpfung:
   * Staffel (Stapel) verschiebt den Körper von Anker 6 auf 9, Gruppe (Reihe) lässt ihn bei 6.
   *
   * Bewusst als Testkompositionen und nicht als Erweiterung von RECIPES: eine Löschstaffel hat
   * kein Brauchwasser-Piktogramm, und RECIPES['C.1.1'] beansprucht, C.1.1_Löschstaffel.svg zu
   * reproduzieren. Was hier belegt wird, ist der Mechanismus, nicht ein Zeichen der Baseline.
   */
  const cases = [
    ['staffel', 'staffel', 19, 3] as const,
    ['gruppe', 'gruppe', 16, 0] as const,
  ];

  it.each(cases)(
    'platziert das Kurven-Piktogramm bei Stärke %s auf Körpermitte %d mm',
    (_name, strength, expectedCenterYMm, expectedShiftMm) => {
      const drawing = composeFromCatalog({
        kind: 'formation',
        organization: 'feuerwehr',
        strength,
        capabilities: ['service-water'],
      });

      const body = drawing.children.find((c) => c.role === 'body');
      expect(body).toBeDefined();
      if (body === undefined) return;
      const bodyBounds = boundsOfMm(body);
      expect((bodyBounds.minY + bodyBounds.maxY) / 2).toBeCloseTo(expectedCenterYMm, 6);

      const group = drawing.children.find(
        (c): c is Primitive & { type: 'group' } => c.type === 'group' && c.role === 'pictogram',
      );
      expect(group).toBeDefined();
      if (group === undefined) return;

      // Die Verschiebung folgt der Körpermitte …
      expect(group.transform?.translate?.dyMm).toBeCloseTo(expectedShiftMm, 6);
      // … und der Pfad selbst bleibt unangetastet. Genau das konnte die frühere primitivweise
      // Verschiebung nicht: shiftY wirft für Pfade bedingungslos.
      const [wave] = group.children;
      expect(wave?.type).toBe('path');
      if (wave?.type !== 'path') return;
      const source = pictogram('capability.service-water').primitives[0];
      expect(source?.type).toBe('path');
      if (source?.type !== 'path') return;
      expect(wave.d).toBe(source.d);
    },
  );

  it('hält die effektive Piktogramm-Box in beiden Fällen im verschobenen Körper', () => {
    // Die Invariante, die das Clipping-Gate gegen den unverschobenen Körper prüfbar macht:
    // Körper und Piktogramm bewegen sich um dasselbe Delta, die relative Lage bleibt gleich.
    for (const [, strength] of cases) {
      const drawing = composeFromCatalog({
        kind: 'formation',
        organization: 'feuerwehr',
        strength,
        capabilities: ['service-water'],
      });
      const body = drawing.children.find((c) => c.role === 'body');
      const group = drawing.children.find(
        (c): c is Primitive & { type: 'group' } => c.type === 'group' && c.role === 'pictogram',
      );
      expect(body).toBeDefined();
      expect(group).toBeDefined();
      if (body === undefined || group === undefined) continue;

      const shiftMm = group.transform?.translate?.dyMm ?? 0;
      const box = pictogram('capability.service-water').box;
      const bodyBounds = boundsOfMm(body);
      expect(box.yMm + shiftMm).toBeGreaterThanOrEqual(bodyBounds.minY);
      expect(box.yMm + box.heightMm + shiftMm).toBeLessThanOrEqual(bodyBounds.maxY);
    }
  });

  it('rendert den Pfad in der verschobenen Gruppe, ohne die Skalierung zu doppeln', () => {
    const svg = renderSvg(
      composeFromCatalog({
        kind: 'formation',
        organization: 'feuerwehr',
        strength: 'staffel',
        capabilities: ['service-water'],
      }),
      { size: 64 },
    );
    // Die Gruppe trägt die Verschiebung in Einheiten …
    expect(svg).toContain(`<g transform="translate(0 ${formatUnits(mmToUnits(3))})">`);
    // … der Pfad ausschließlich seine Millimeter-Skalierung, mit unverändertem d-String.
    const pathTag = svg.match(/<path[^>]*\/>/)?.[0];
    expect(pathTag).toBeDefined();
    expect(pathTag).toContain('transform="scale(');
    expect(pathTag).not.toContain('translate(');
    expect(pathTag).toContain('fill="#000000"');
  });

  it('wirft nicht, wenn zwei Fähigkeiten zusammen platziert werden', () => {
    // Beide Piktogramme landen in derselben Gruppe — ein Strich- und ein Kurvenpiktogramm
    // nebeneinander, die frühere shiftY-Abbildung wäre hier gescheitert.
    const drawing = composeFromCatalog({
      kind: 'formation',
      organization: 'feuerwehr',
      strength: 'staffel',
      capabilities: ['fire-fighting', 'service-water'],
    });
    const group = drawing.children.find(
      (c): c is Primitive & { type: 'group' } => c.type === 'group' && c.role === 'pictogram',
    );
    expect(group?.children).toHaveLength(4);
  });
});
```

Den Import der Datei erweitern auf `renderSvg`, `formatUnits`, `mmToUnits` und `pictogram`:

```ts
import { boundsOfMm, CompositionError, formatUnits, matchFingerprint, renderSvg } from '@einsatzzeichen/core';
import { mmToUnits, type Drawing, type Primitive } from '@einsatzzeichen/schema';
import { pictogram } from './pictograms/index.js';
```

- [ ] **Step 7: Tests laufen lassen**

Run: `pnpm vitest run packages/catalog/src/recipes.test.ts`
Expected: alle PASS. Wirft `compose` hier, ist die Gruppen-Umstellung aus Task 8 unvollständig — `shiftY` würde auf dem Pfad landen und mit „Pfad-Primitive haben keine strukturierte Punktgeometrie" abbrechen.

- [ ] **Step 8: Volle Suite, Typecheck und Coverage-Gate**

Run: `pnpm test && pnpm typecheck && pnpm cli coverage`
Expected: alles grün. Die Snapshots von `C.1.1`/`C.1.2` sind unberührt: `RECIPES` ist unverändert, das neue Piktogramm erscheint nur in Testkompositionen.

- [ ] **Step 9: Commit**

```bash
git add packages/schema/src/taxonomy.ts packages/catalog/src/pictograms/capabilities.ts \
  packages/catalog/src/pictograms/capabilities.test.ts packages/catalog/src/recipes.test.ts
git commit -m "feat(catalog): Löschwasser/Brauchwasser (4.3.2) als erstes Pfad-Piktogramm

Eigenständige Konstruktion nach der Bildidee; die Referenz trägt für diesen
Abschnitt curvedPaths: 1, ein path ist also sachlich nötig und nicht
künstlich. Belegt die Gruppen-Translation in beiden Layoutfällen."
```

---

## Task 10: Quellenregister — `phjardas-tz` als Vergleichsquelle

Der Upstream `phjardas/taktische-zeichen` liefert die **Methode** (Piktogramme sind handgeschriebene Pfade mit deklarierter Größe), nicht die Geometrie. Er passt in keine der bestehenden Kategorien; zwei Werttypen wachsen um je ein Literal.

`'compared-only'` ist der Wert, den Slice 2 ausdrücklich zurückgehalten hat, bis ein Konsument existiert. Dieser Slice ist der Konsument.

**Files:**
- Modify: `packages/schema/src/provenance.ts:10-21` (`SourceId`)
- Modify: `packages/schema/src/sources.ts:12-18` (`SourceKind`), `:23-28` (`GeometryUse`)
- Modify: `packages/catalog/src/sources.ts`
- Test: `packages/catalog/src/sources.test.ts` (anfügen)

**Interfaces:**
- Consumes: `SOURCE_REGISTRY`, `isRegisteredSource`
- Produces: `SourceKind` um `'open-source-corpus'`, `GeometryUse` um `'compared-only'`, `SourceId` um `'phjardas-tz'`, ein Registereintrag

- [ ] **Step 1: Die failing tests schreiben**

An `packages/catalog/src/sources.test.ts` anfügen:

```ts
describe('phjardas-tz als Vergleichsquelle', () => {
  it('ist registriert und als Open-Source-Bestand geführt', () => {
    const record = SOURCE_REGISTRY['phjardas-tz'];
    expect(record.kind).toBe('open-source-corpus');
    expect(record.acquisition).toBe('public-url');
    expect(isRegisteredSource('phjardas-tz')).toBe(true);
  });

  it('führt die Geometrie ausschließlich als verglichen, nicht als übernommen', () => {
    expect(SOURCE_REGISTRY['phjardas-tz'].geometryUse).toEqual(['compared-only']);
  });

  it('hat einen geklärten Lizenzstatus mit dokumentierter Attributionslage', () => {
    // Die Lage ist geklärt (MIT) und wird trotzdem nicht ausgenutzt: keine Geometrie übernommen,
    // deshalb keine Attributionspflicht. Die Copyright-Zeile des Upstream nennt keinen
    // Rechteinhaber — wäre je etwas zu attribuieren, müsste es das Repository sein.
    const licence = SOURCE_REGISTRY['phjardas-tz'].licence;
    expect(licence.status).toBe('clarified');
    expect(licence.note).toContain('keine Geometrie');
  });

  it('ist die einzige Quelle mit compared-only', () => {
    const comparedOnly = Object.values(SOURCE_REGISTRY).filter((record) =>
      record.geometryUse.includes('compared-only'),
    );
    expect(comparedOnly.map((record) => record.id)).toEqual(['phjardas-tz']);
  });

  it('registriert jonas-koeritz nicht, solange die Nutzungsgrundlage ungeprüft ist', () => {
    // CC BY 4.0 und eine README-Aussage zur Gemeinfreiheit stehen dort nebeneinander. Eine
    // Quelle einzutragen, deren Nutzungsgrundlage ungeprüft ist, wäre genau die ungelesene
    // Behauptung, die das Register verhindern soll.
    expect(isRegisteredSource('jonas-koeritz-tz')).toBe(false);
  });
});
```

- [ ] **Step 2: Tests laufen lassen und den Fehlgrund prüfen**

Run: `pnpm vitest run packages/catalog/src/sources.test.ts`
Expected: FAIL, und `pnpm typecheck` meldet `'phjardas-tz'` als unbekannten `SourceId`.

- [ ] **Step 3: Die beiden Werttypen erweitern**

In `packages/schema/src/sources.ts` `SourceKind` (`sources.ts:4-18`) ersetzen:

```ts
/**
 * `baseline`            — die verbindliche fachliche Grundlage
 * `reference-assets`    — Grafikdateien zur Baseline
 * `guidance`            — begleitende Hinweise zur Baseline
 * `legacy`              — ältere Systematik, für Aliasnamen und Migrationshinweise
 * `operational-rule`    — operatives Regelwerk mit Terminologie und Führungslogik
 * `standard`            — angrenzende Norm, nicht mit der DV-102-Systematik zu vermischen
 * `open-source-corpus`  — frei lizenzierter Fremdbestand, zum Vergleich der Bildideen
 */
export type SourceKind =
  | 'baseline'
  | 'reference-assets'
  | 'guidance'
  | 'legacy'
  | 'operational-rule'
  | 'standard'
  | 'open-source-corpus';
```

Und `GeometryUse` (`sources.ts:23-28`) ersetzen:

```ts
/**
 * Umgang mit der Geometrie der Quelle. `'compared-only'` heißt: die Bildideen wurden gelesen und
 * gegen den Bestand gehalten, aber keine Koordinate übernommen — auch dort nicht, wo die Lizenz
 * es erlaubt hätte.
 */
export type GeometryUse = 'measured-metrics' | 'reconstructed' | 'compared-only' | 'none';
```

In `packages/schema/src/provenance.ts` `SourceId` um ein Literal erweitern (nach `'thw-einheiten'`):

```ts
  | 'phjardas-tz'
```

- [ ] **Step 4: Den Registereintrag schreiben**

In `packages/catalog/src/sources.ts` nach `'thw-einheiten'` einfügen:

```ts
  'phjardas-tz': {
    id: 'phjardas-tz',
    kind: 'open-source-corpus',
    title: 'phjardas/taktische-zeichen — JavaScript-Generator nach DV 102',
    publisher: 'phjardas (GitHub)',
    url: 'https://github.com/phjardas/taktische-zeichen',
    scope:
      'Vergleichsbestand für Bildideen der Kapitel 4 und 5.8: 42 Fachaufgaben und 89 Symbole, jedes als handgeschriebener Pfad mit deklarierter Größe.',
    acquisition: 'public-url',
    geometryUse: ['compared-only'],
    licence: {
      basis: 'MIT-Lizenz, in LICENSE und packages/core/LICENSE gleichlautend.',
      status: 'clarified',
      note:
        'Übernommen wird die Methode (Piktogramme als geschriebene Pfade), keine Geometrie: ' +
        'der Upstream rechnet in Pixeln auf zeichenspezifischen Boxen, rekonstruiert die ' +
        'Systematik von 2010/2011 und verwendet relative Kommandos samt Ellipsenbögen. Da ' +
        'keine Geometrie übernommen wird, entsteht keine Attributionspflicht. Die ' +
        'Copyright-Zeile lautet "Copyright 2022" ohne Rechteinhaber — wäre je etwas zu ' +
        'attribuieren, müsste die Attribution auf das Repository lauten.',
    },
    review: SOURCE_REVIEW,
  },
```

Den Klassenkommentar über `SOURCE_REGISTRY` von „Die elf registrierten Quellen" auf „Die zwölf registrierten Quellen" ändern und ergänzen: „`phjardas-tz` ist keine Quelle der Referenzhierarchie aus `Vision.md`, sondern ein Vergleichsbestand (Slice-3-Spec, Abschnitt 4)."

- [ ] **Step 5: Tests, Typecheck und die volle Suite**

Run: `pnpm vitest run packages/catalog/src/sources.test.ts && pnpm typecheck && pnpm test && pnpm cli coverage`
Expected: alles grün. `pnpm cli coverage` gibt jetzt `Quellen: 12` aus. Meldet der Typecheck einen Fehler an `satisfies Record<SourceId, SourceRecord>`, fehlt entweder das Literal in `provenance.ts` oder der Eintrag in `sources.ts` — die Prüfung geht in beide Richtungen.

- [ ] **Step 6: Commit**

```bash
git add packages/schema/src/provenance.ts packages/schema/src/sources.ts \
  packages/catalog/src/sources.ts packages/catalog/src/sources.test.ts
git commit -m "feat(catalog): phjardas/taktische-zeichen als Vergleichsquelle registrieren"
```

---

## Task 11: Elemente, Manifest-Einträge und Piktogramm-Snapshots

Erfolgskriterium 6 der Spec: jedes in D.0 entstandene Piktogramm ist über `resolveElement` auflösbar und hat einen Manifest-Eintrag mit `fingerprintTest: false` und begründetem `technical`-Status.

**Die Reduktion, die niemand nachträglich erfinden soll** (Spec Abschnitt 7): Für Piktogramme ist der erste Teil des Slice-2-Kriteriums für `technical: approved` — „Fingerprint- **und** Snapshot-Gate grün" — strukturell unerreichbar. `matchFingerprint` vergleicht ausschließlich `role: 'body'`. An seine Stelle treten vier prüfbare Bedingungen: **Snapshot-Gate grün, Box-Gate grün, Clipping-Gate grün, Kommando-Gate grün.** Die `note` am `ReviewSet` hält das fest, damit die Rollenanpassung dokumentiert und nicht stillschweigend ist — dasselbe Muster wie `SOURCE_REVIEW` in `sources.ts`.

**`snapshotTest: true` wird durch echte Dateisnapshots eingelöst.** Heute tragen alle zwölf Element-Einträge `false`. Für Piktogramme ohne Snapshot wäre `true` eine Falschaussage; dieser Task legt sie deshalb an — auch für `capability.fire-fighting`, das damit erstmals einen Renderschutz auf SVG-Ebene bekommt.

**Files:**
- Modify: `packages/catalog/src/elements.ts:1` (`ElementKind`), `ELEMENTS`
- Modify: `packages/catalog/src/coverage-manifest.ts:56-95`, `:107` (`scope`)
- Create: `packages/catalog/src/pictograms/snapshots.test.ts`
- Create: `packages/catalog/src/pictograms/__snapshots__/capability.fire-fighting.svg` (generiert)
- Create: `packages/catalog/src/pictograms/__snapshots__/capability.service-water.svg` (generiert)
- Test: `packages/catalog/src/elements.test.ts` (anfügen), `coverage-manifest.test.ts` (anfügen)

**Interfaces:**
- Consumes: `resolveElement`, `ELEMENTS`, `ALL_PICTOGRAMS`, `COVERAGE_MANIFEST`
- Produces:
  - `ElementKind` = `'organization' | 'strength' | 'capability' | 'state' | 'comms' | 'damage' | 'wildfire'`
  - `PICTOGRAM_ELEMENT_KINDS: ReadonlySet<ElementKind>` — die Arten, die eine Geometrie tragen
  - `ELEMENTS['capability.service-water']`
  - `COVERAGE_MANIFEST.scope` enthält `'4.3.2'`; die beiden Piktogramm-Einträge tragen `fingerprintTest: false`, `snapshotTest: true`

- [ ] **Step 1: Den Piktogramm-Snapshot-Test schreiben**

`packages/catalog/src/pictograms/snapshots.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { renderSvg } from '@einsatzzeichen/core';
import { DEFAULT_VIEWBOX_MM, type Drawing } from '@einsatzzeichen/schema';
import { ALL_PICTOGRAMS } from './index.js';

/**
 * Ein Piktogramm allein als Zeichnung — ohne Grundzeichen, ohne Kopfzone, ohne Verschiebung.
 * Das ist der Regressionsschutz, den `matchFingerprint` für Piktogramme strukturell nicht leisten
 * kann: es vergleicht ausschließlich `role: 'body'`. Der Snapshot ist damit die dritte der vier
 * Bedingungen, die für Piktogramme an die Stelle von `technical: approved` treten
 * (Slice-3-Spec, Abschnitt 7).
 */
describe('Piktogramm-Snapshots', () => {
  it.each(ALL_PICTOGRAMS.map((definition) => [definition.id, definition] as const))(
    'rendert %s unverändert',
    async (id, definition) => {
      const drawing: Drawing = {
        viewBox: DEFAULT_VIEWBOX_MM,
        children: definition.primitives,
        title: definition.title,
      };
      await expect(renderSvg(drawing, { size: 64 })).toMatchFileSnapshot(
        `./__snapshots__/${id}.svg`,
      );
    },
  );
});
```

- [ ] **Step 2: Snapshots erzeugen und ansehen**

Run: `pnpm vitest run packages/catalog/src/pictograms/snapshots.test.ts`
Expected: vitest legt beide Dateien an und meldet sie als neu geschrieben (kein Fehler bei fehlender Snapshot-Datei).

```bash
cat packages/catalog/src/pictograms/__snapshots__/capability.fire-fighting.svg
cat packages/catalog/src/pictograms/__snapshots__/capability.service-water.svg
```

Prüfen: `capability.fire-fighting.svg` enthält drei `<line>` mit `y1="45.354"` (= 16 mm) und `x1="8.504"` (= 3 mm). `capability.service-water.svg` enthält einen `<path>` mit `transform="scale(2.8346)"`, `fill="#000000"`, `stroke="none"` und dem unveränderten `d`-String in Millimetern. Steht im `d`-String ein anderer Wert als in `capabilities.ts`, hat der Renderer ihn angefasst — das wäre ein Fehler.

Run erneut: `pnpm vitest run packages/catalog/src/pictograms/snapshots.test.ts`
Expected: PASS gegen die eben geschriebenen Dateien.

- [ ] **Step 3: Die failing tests für Element und Manifest schreiben**

An `packages/catalog/src/elements.test.ts` anfügen:

```ts
describe('Piktogramm-Elemente', () => {
  it('löst das neue Piktogramm mit seiner namensgebenden Belegdatei auf', () => {
    const descriptor = resolveElement('capability.service-water');
    expect(descriptor.kind).toBe('capability');
    expect(descriptor.title).toBe('Löschwasser, Brauchwasser');
    // Der Dateiname trägt ein Leerzeichen, keinen Schrägstrich — so steht er im Referenzbestand.
    // Mit "Löschwasser/Brauchwasser" bricht die Abschnittsprüfung des Coverage-Gates.
    expect(descriptor.referenceAssets[0]).toBe('4.3.2_Löschwasser Brauchwasser.svg');
  });

  it('hat für jedes Katalogpiktogramm ein auflösbares Element', () => {
    // Ohne diese Prüfung könnte ein Piktogramm ohne Manifest-Anschluss entstehen: der Katalog
    // zeichnete es, und kein Eintrag würde es beanspruchen.
    for (const definition of ALL_PICTOGRAMS) {
      expect(() => resolveElement(definition.id)).not.toThrow();
      expect(resolveElement(definition.id).title).toBe(definition.title);
    }
  });

  it('zählt genau die geometrietragenden Elementarten als Piktogramme', () => {
    expect(PICTOGRAM_ELEMENT_KINDS.has('capability')).toBe(true);
    expect(PICTOGRAM_ELEMENT_KINDS.has('organization')).toBe(false);
    expect(PICTOGRAM_ELEMENT_KINDS.has('strength')).toBe(false);
  });
});
```

Den Import der Datei um `ALL_PICTOGRAMS` (aus `./pictograms/index.js`) und `PICTOGRAM_ELEMENT_KINDS` erweitern.

An `packages/catalog/src/coverage-manifest.test.ts` anfügen:

```ts
describe('Manifest-Einträge für Piktogramme', () => {
  function entryFor(section: string) {
    return COVERAGE_MANIFEST.entries.find((entry) => entry.sourceId === `bbk-babz-2025:${section}`);
  }

  it('führt 4.3.2 im beanspruchten Umfang und als Eintrag', () => {
    // Der Scope wächst nie vorauseilend: ein Kapitel im Scope ohne Eintrag ist ein
    // Release-Blocker, und die Erweiterung vor dem Inhalt erzeugt genau die Falschaussage,
    // die das Manifest verhindern soll.
    expect(COVERAGE_MANIFEST.scope).toContain('4.3.2');
    expect(entryFor('4.3.2')).toBeDefined();
  });

  it('gibt Piktogrammen einen Snapshot-, aber keinen Fingerprint-Nachweis', () => {
    for (const section of ['4.3.1', '4.3.2']) {
      const entry = entryFor(section);
      expect(entry?.coverage).toBe('element');
      // matchFingerprint vergleicht ausschließlich role: 'body' — für ein Piktogramm ist das
      // strukturell unerreichbar und kein Versäumnis.
      expect(entry?.fingerprintTest).toBe(false);
      expect(entry?.snapshotTest).toBe(true);
    }
  });

  it('lässt Organisationen und Stärken ohne Snapshot-Nachweis', () => {
    // Für sie existiert kein Dateisnapshot: eine Organisationsfarbe ist ein ColorToken, ein
    // Stärkegrad eine HeadShape — keine Zeichnung, die sich rendern ließe.
    expect(entryFor('2.1')?.snapshotTest).toBe(false);
    expect(entryFor('5.4.1')?.snapshotTest).toBe(false);
  });

  it('begründet den technical-Status der Piktogramme an den vier Gates', () => {
    const entry = entryFor('4.3.2');
    expect(entry?.review.technical.status).toBe('approved');
    expect(entry?.review.technical.note).toContain('Box');
    expect(entry?.review.technical.note).toContain('Clipping');
    expect(entry?.review.domain.status).toBe('pending');
  });
});
```

- [ ] **Step 4: Tests laufen lassen und den Fehlgrund prüfen**

Run: `pnpm vitest run packages/catalog/src/elements.test.ts packages/catalog/src/coverage-manifest.test.ts`
Expected: FAIL — `resolveElement('capability.service-water')` wirft, `4.3.2` fehlt im Scope, `snapshotTest` ist `false`.

- [ ] **Step 5: `elements.ts` erweitern**

Zeile 1 ersetzen:

```ts
/**
 * Die Arten von Einzelelementen. Die vier Piktogrammarten neben `capability` haben in D.0 noch
 * keine Einträge und kommen mit D.2 bis D.4 dazu — sie stehen hier, weil `PICTOGRAM_ELEMENT_KINDS`
 * sie liest und das Manifest daraus den Snapshot-Nachweis ableitet.
 */
export type ElementKind =
  | 'organization'
  | 'strength'
  | 'capability'
  | 'state'
  | 'comms'
  | 'damage'
  | 'wildfire';

/**
 * Die Elementarten, die eine eigene Geometrie tragen und deshalb einen Dateisnapshot haben können.
 * Eine Organisationsfarbe ist ein `ColorToken`, ein Stärkegrad eine `HeadShape` — beides keine
 * Zeichnung, die sich rendern ließe. Das Manifest leitet `snapshotTest` daraus ab, statt eine
 * Liste von IDs zu führen, die mit jedem Unter-Slice nachgezogen werden müsste.
 */
export const PICTOGRAM_ELEMENT_KINDS: ReadonlySet<ElementKind> = new Set<ElementKind>([
  'capability',
  'state',
  'comms',
  'damage',
  'wildfire',
]);
```

Und in `ELEMENTS` nach `'capability.fire-fighting'` einfügen:

```ts
  'capability.service-water': {
    id: 'capability.service-water',
    kind: 'capability',
    title: 'Löschwasser, Brauchwasser',
    // Belegstelle der Bildidee. Die Geometrie ist eigenständig konstruiert
    // (`pictograms/capabilities.ts`); der Fingerprint dieser Datei trägt curvedPaths: 1, die
    // Bildidee enthält also tatsächlich eine Kurve. Zwei Leerzeichen gibt es hier nicht, aber
    // ein Leerzeichen statt des Schrägstrichs der Kapitelüberschrift — so steht der Name im
    // Referenzbestand, nicht normalisieren.
    referenceAssets: ['4.3.2_Löschwasser Brauchwasser.svg'],
  },
```

- [ ] **Step 6: `coverage-manifest.ts` erweitern**

Das Review für Piktogramme nach `REVIEW` (`coverage-manifest.ts:12-15`) ergänzen:

```ts
/**
 * Für Piktogramme ist der erste Teil des Slice-2-Kriteriums für `technical: approved`
 * — Fingerprint- und Snapshot-Gate grün — strukturell unerreichbar: `matchFingerprint` vergleicht
 * ausschließlich `role: 'body'`, und das Fingerprint-Gate ist auf Kapitel 1–3 beschränkt. An seine
 * Stelle treten vier prüfbare Bedingungen. Die `note` hält diese Rollenanpassung fest, damit sie
 * dokumentiert und nicht stillschweigend ist — dasselbe Muster wie `SOURCE_REVIEW` in `sources.ts`.
 */
const PICTOGRAM_REVIEW: ReviewSet = {
  technical: {
    status: 'approved',
    reviewer: 'rv',
    date: '2026-08-05',
    note:
      'Fingerprint-Gate für Piktogramme nicht anwendbar (matchFingerprint vergleicht nur ' +
      'role: body). An seine Stelle treten vier grüne Gates: Snapshot, Kommando, Box, Clipping.',
  },
  domain: { status: 'pending' },
};
```

`ELEMENT_SECTIONS` um eine Zeile erweitern:

```ts
  'capability.service-water': '4.3.2',
```

Den Kommentar über `elementEntries` (`coverage-manifest.ts:71-78`) ersetzen und die Ableitung anpassen:

```ts
/**
 * `fingerprintTest` ist bei allen Elementen `false` und das ist kein Versäumnis: das
 * Fingerprint-Gate vergleicht ausschließlich `role: 'body'` und erfasst weder Kopfmarken noch
 * Piktogramme (Entscheidungsnotiz vom 4. August 2026, Abschnitt 5).
 *
 * `snapshotTest` folgt der Elementart: Piktogramme tragen eine eigene Geometrie und haben je einen
 * Dateisnapshot (`pictograms/snapshots.test.ts`); Organisationsfarben und Stärkegrade sind
 * `ColorToken` bzw. `HeadShape` und damit keine Zeichnung, die sich rendern ließe — sie sind
 * stattdessen durch `organizations.test.ts` und `strengths.test.ts` festgenagelt. Das Manifest
 * bildet die Testarten ab, statt sie zu überzeichnen.
 */
const elementEntries: CoverageEntry[] = Object.entries(ELEMENT_SECTIONS).map(([id, section]) => {
  const descriptor = resolveElement(id);
  const isPictogram = PICTOGRAM_ELEMENT_KINDS.has(descriptor.kind);
  return {
    sourceId: `bbk-babz-2025:${section}`,
    variant: 'primary',
    title: descriptor.title,
    implementation: id,
    // Die namensgebende Datei. Das Gate prüft, dass sie in `referenceAssets` vorkommt und dass
    // ihr Name mit der Abschnittsnummer aus `sourceId` beginnt.
    referenceAsset: descriptor.referenceAssets[0] ?? '',
    coverage: 'element',
    profile: 'bund',
    fingerprintTest: false,
    snapshotTest: isPictogram,
    review: isPictogram ? PICTOGRAM_REVIEW : REVIEW,
  };
});
```

Den Import in Zeile 3 auf `import { PICTOGRAM_ELEMENT_KINDS, resolveElement } from './elements.js';` erweitern.

`scope` (`coverage-manifest.ts:107`) ersetzen:

```ts
  scope: ['1', '2', '4.3.1', '4.3.2', '5.4', 'C.1.1', 'C.1.2', 'D.3.7'],
```

`'4.3.2'` als eigenes Literal, nicht `'4.3'`: `blockersOf` behandelt einen Scope-Eintrag als gedeckt, sobald ein Abschnitt ihm gleicht oder mit `<eintrag>.` beginnt. `'4.3'` würde damit die vier ungedeckten Abschnitte 4.3.3 bis 4.3.6 als beansprucht ausgeben, obwohl D.0 sie nicht liefert.

- [ ] **Step 7: Tests, Typecheck, volle Suite und Coverage-Gate**

Run: `pnpm vitest run packages/catalog/src/elements.test.ts packages/catalog/src/coverage-manifest.test.ts && pnpm typecheck`
Expected: PASS.

Run: `pnpm test && pnpm cli coverage`
Expected: alles grün, „Coverage-Gate bestanden." Die Ausgabe nennt jetzt `Einträge: 24` (8 Grundzeichen, 3 Rezepte, 13 Elemente — vorher 23) und `Umfang: 1, 2, 4.3.1, 4.3.2, 5.4, C.1.1, C.1.2, D.3.7`. `Quellen: 12` seit Task 10.

**`withoutTestEvidence` steigt von 12 auf 13, und das ist richtig.** `blockersOf` listet einen Eintrag, sobald *einer* der beiden Nachweise fehlt — die Piktogramme tragen jetzt `snapshotTest: true`, aber `fingerprintTest` bleibt `false`, weil `matchFingerprint` nur `role: 'body'` vergleicht. Wer die gestiegene Zahl als Regression liest und „behebt", macht das Manifest unehrlich: die einzige Möglichkeit, sie zu senken, wäre ein `fingerprintTest: true` ohne Fingerprint-Gate. Meldet das Gate `section-mismatch` für `4.3.2`, stimmt der Dateiname in `referenceAssets` nicht mit der Abschnittsnummer überein — die Prüfung ist `namesake.startsWith('4.3.2_')`.

- [ ] **Step 8: Commit**

```bash
git add packages/catalog/src/elements.ts packages/catalog/src/elements.test.ts \
  packages/catalog/src/coverage-manifest.ts packages/catalog/src/coverage-manifest.test.ts \
  packages/catalog/src/pictograms/snapshots.test.ts \
  packages/catalog/src/pictograms/__snapshots__/
git commit -m "feat(catalog): Piktogramme im Manifest mit Snapshot-Nachweis und begründetem Review"
```

---

## Task 12: Bereichsweise Zählung in `releaseBlockers()` und CLI

Nach dem vollen Ausbau tragen mehrere hundert Einträge `domain: pending`, und diese Zahl dominiert die Ausgabe vollständig. Das ist die zutreffende Darstellung der Lage und kein Grund, die Ausgabe zu kürzen: das fachliche Review **ist** der Engpass zu 1.0. Die Ausgabe zählt ab diesem Slice zusätzlich nach Bereich, damit sichtbar bleibt, welches Kapitel geprüft ist und welches nicht.

**Files:**
- Modify: `packages/catalog/src/coverage-gate.ts:337-372` (`ReleaseBlockers`, `blockersOf`)
- Modify: `packages/cli/src/commands/coverage.ts:26-33`
- Test: `packages/catalog/src/coverage-gate.test.ts` (anfügen)

**Interfaces:**
- Consumes: `blockersOf(entries, scope)`, `sectionOf`
- Produces: `ReleaseBlockers.domainReviewPendingByArea: Record<string, number>` — Bereich ist der Teil der Abschnittsnummer vor dem ersten Punkt (`'4.3.2'` → `'4'`, `'C.1.1'` → `'C'`), absteigend nach Anzahl und bei Gleichstand alphabetisch sortiert.

- [ ] **Step 1: Die failing tests schreiben**

An `packages/catalog/src/coverage-gate.test.ts` anfügen. Die Datei führt bereits Fixtures für `blockersOf`; dieselbe Bauart verwenden:

```ts
describe('blockersOf — Zählung nach Bereich', () => {
  /** Minimaler Eintrag: nur die Felder, die `blockersOf` liest. */
  function entry(sourceId: string, domainApproved: boolean): CoverageEntry {
    return {
      sourceId,
      variant: 'primary',
      title: sourceId,
      implementation: sourceId,
      referenceAsset: `${sourceId}.svg`,
      coverage: 'element',
      profile: 'bund',
      fingerprintTest: false,
      snapshotTest: true,
      review: {
        technical: { status: 'approved', reviewer: 'rv', date: '2026-08-05' },
        domain: domainApproved
          ? { status: 'approved', reviewer: 'rv', date: '2026-08-05' }
          : { status: 'pending' },
      },
    };
  }

  it('zählt offene fachliche Reviews je Kapitel und Anhang', () => {
    const result = blockersOf(
      [
        entry('bbk-babz-2025:4.3.1', false),
        entry('bbk-babz-2025:4.3.2', false),
        entry('bbk-babz-2025:5.8.1.1', false),
        entry('bbk-babz-2025:C.1.1', true),
      ],
      [],
    );
    expect(result.domainReviewPendingByArea).toEqual({ '4': 2, '5': 1 });
  });

  it('zählt einen Abschnitt ohne Punkt als eigenen Bereich', () => {
    const result = blockersOf([entry('bbk-babz-2025:1', false)], []);
    expect(result.domainReviewPendingByArea).toEqual({ '1': 1 });
  });

  it('ordnet einen sourceId ohne Trenner einem Bereich zu, statt ihn zu verlieren', () => {
    // sectionOf gibt bei fehlendem ':' die ganze Zeichenkette zurück — die Zählung muss auch
    // diesen Randfall abbilden, sonst verschwindet ein Eintrag stillschweigend aus der Statistik.
    const result = blockersOf([entry('4.9.1', false)], []);
    expect(result.domainReviewPendingByArea).toEqual({ '4': 1 });
  });

  it('sortiert absteigend nach Anzahl und bei Gleichstand alphabetisch', () => {
    const result = blockersOf(
      [
        entry('bbk-babz-2025:C.1.1', false),
        entry('bbk-babz-2025:4.3.1', false),
        entry('bbk-babz-2025:4.3.2', false),
        entry('bbk-babz-2025:2.1', false),
      ],
      [],
    );
    expect(Object.keys(result.domainReviewPendingByArea)).toEqual(['4', '2', 'C']);
  });

  it('liefert ein leeres Objekt, wenn kein Review offen ist', () => {
    const result = blockersOf([entry('bbk-babz-2025:4.3.1', true)], []);
    expect(result.domainReviewPendingByArea).toEqual({});
  });

  it('lässt die Gesamtzahl und die Bereichssummen übereinstimmen', () => {
    // Am echten Manifest, damit die beiden Zahlen nicht auseinanderlaufen können.
    const blockers = releaseBlockers();
    const sum = Object.values(blockers.domainReviewPendingByArea).reduce((a, b) => a + b, 0);
    expect(sum).toBe(blockers.domainReviewPending.length);
  });
});
```

Den Import der Datei um `releaseBlockers` und `type CoverageEntry` erweitern, falls noch nicht vorhanden.

- [ ] **Step 2: Tests laufen lassen und den Fehlgrund prüfen**

Run: `pnpm vitest run packages/catalog/src/coverage-gate.test.ts`
Expected: FAIL — `domainReviewPendingByArea` ist `undefined`. Der Typecheck meldet es zusätzlich als unbekannte Eigenschaft.

- [ ] **Step 3: `blockersOf` erweitern**

In `packages/catalog/src/coverage-gate.ts` `ReleaseBlockers` (`coverage-gate.ts:337-344`) ersetzen:

```ts
export interface ReleaseBlockers {
  /** Manifestschlüssel der Einträge ohne abgeschlossenes fachliches Review. */
  domainReviewPending: string[];
  /**
   * Dieselben Einträge, gezählt je Kapitel und Anhang. Nach dem vollen Katalogausbau tragen
   * mehrere hundert Einträge `domain: pending` und dominieren `domainReviewPending` vollständig.
   * Die Liste bleibt trotzdem ungekürzt — das fachliche Review ist der Engpass zu 1.0, und das
   * darzustellen ist ihr Zweck. Diese Zählung macht daneben sichtbar, welcher Bereich geprüft
   * ist und welcher nicht.
   *
   * Absteigend nach Anzahl, bei Gleichstand alphabetisch: eine stabile Reihenfolge, damit die
   * CLI-Ausgabe zwischen zwei Läufen vergleichbar bleibt.
   */
  domainReviewPendingByArea: Record<string, number>;
  /** Manifestschlüssel der Einträge ohne Fingerprint- oder Snapshot-Nachweis. */
  withoutTestEvidence: string[];
  /** Kapitel im Scope, die kein einziger Eintrag trägt. */
  uncoveredScope: string[];
}

/**
 * Bereich einer Abschnittsnummer: der Teil vor dem ersten Punkt. `'4.3.2'` → `'4'`,
 * `'C.1.1'` → `'C'`, `'1'` → `'1'`. Grob genug, dass die Zählung nach dem vollen Ausbau lesbar
 * bleibt, und fein genug, dass Kapitel 4 und Anhang C nicht in einen Topf fallen.
 */
function areaOf(section: string): string {
  const dot = section.indexOf('.');
  return dot === -1 ? section : section.slice(0, dot);
}
```

Und in `blockersOf` (`coverage-gate.ts:352-372`) die Schleife und die Rückgabe anpassen:

```ts
export function blockersOf(
  entries: readonly CoverageEntry[],
  scope: readonly string[],
): ReleaseBlockers {
  const domainReviewPending: string[] = [];
  const withoutTestEvidence: string[] = [];
  const pendingByArea = new Map<string, number>();

  for (const entry of entries) {
    const key = entryKey(entry.sourceId, entry.variant);
    if (entry.review.domain.status !== 'approved') {
      domainReviewPending.push(key);
      const area = areaOf(sectionOf(entry.sourceId));
      pendingByArea.set(area, (pendingByArea.get(area) ?? 0) + 1);
    }
    if (!entry.fingerprintTest || !entry.snapshotTest) withoutTestEvidence.push(key);
  }

  const sections = entries.map((entry) => sectionOf(entry.sourceId));
  const uncoveredScope = scope.filter(
    (chapter) =>
      !sections.some((section) => section === chapter || section.startsWith(`${chapter}.`)),
  );

  const domainReviewPendingByArea = Object.fromEntries(
    [...pendingByArea].sort(([areaA, countA], [areaB, countB]) =>
      countB - countA !== 0 ? countB - countA : areaA.localeCompare(areaB),
    ),
  );

  return { domainReviewPending, domainReviewPendingByArea, withoutTestEvidence, uncoveredScope };
}
```

- [ ] **Step 4: Die CLI-Ausgabe erweitern**

In `packages/cli/src/commands/coverage.ts` nach der `1.0-Blocker`-Zeile (`coverage.ts:28-30`) und vor der `uncoveredScope`-Schleife einfügen:

```ts
  const byArea = Object.entries(blockers.domainReviewPendingByArea);
  if (byArea.length > 0) {
    console.log(
      `  Offene fachliche Reviews nach Bereich: ${byArea
        .map(([area, count]) => `${area}: ${count}`)
        .join(', ')}`,
    );
  }
```

- [ ] **Step 5: Tests, Typecheck, volle Suite und CLI-Ausgabe prüfen**

Run: `pnpm vitest run packages/catalog/src/coverage-gate.test.ts && pnpm typecheck && pnpm test`
Expected: alles PASS.

Run: `pnpm cli coverage`
Expected: „Coverage-Gate bestanden." und eine Zeile `Offene fachliche Reviews nach Bereich: …`. Die Summe der Zahlen muss der Zahl vor „ohne fachliches Review" in der Zeile darüber entsprechen — dieselbe Zusicherung, die der letzte Test am echten Manifest prüft.

- [ ] **Step 6: Commit**

```bash
git add packages/catalog/src/coverage-gate.ts packages/catalog/src/coverage-gate.test.ts \
  packages/cli/src/commands/coverage.ts
git commit -m "feat(catalog,cli): offene fachliche Reviews nach Bereich zählen"
```

---

## Abschluss: die acht Erfolgskriterien der Spec durchgehen

Kein Code, sondern die Prüfung, dass D.0 vollständig ist. Jede Zeile ist ein Kommando oder eine Datei — keine Selbsteinschätzung.

- [ ] **Step 1: Die volle Suite und alle Gates**

```bash
pnpm typecheck && pnpm test && pnpm cli coverage
```
Expected: alles grün, „Coverage-Gate bestanden."

- [ ] **Step 2: Kriterium 8 — CI ohne Referenzbestand**

Der Bestand ist gitignored, aber lokal vorhanden; ein Test, der ihn liest, fiele hier nicht auf. Also direkt prüfen, dass kein Testcode auf das Verzeichnis zugreift:

```bash
grep -rn "taktische-zeichen/" packages/ --include=*.ts | grep -v "^packages/cli/src/scan/" || echo "Kein Testzugriff auf den Referenzbestand"
grep -rn "node:fs" packages/*/src/**/*.test.ts || echo "Kein Dateisystemzugriff in Tests"
```
Expected: beide Meldungen. Zugriffe in `packages/cli/src/scan/` sind erlaubt — `audit:reference` ist genau das Werkzeug, das den Bestand liest, und läuft nicht in CI.

Und die Abhängigkeitsfreiheit:

```bash
grep -c '"dependencies"' packages/schema/package.json || echo "schema: keine Abhängigkeiten"
cat packages/core/package.json
```
Expected: `schema` hat keinen `dependencies`-Block, `core` ausschließlich `@einsatzzeichen/schema` als `workspace:*`.

- [ ] **Step 3: Die Kriterien 1 bis 7 gegen die Tests abhaken**

| Kriterium | Belegt durch |
|---|---|
| 1 — Kurven-Piktogramm in beiden Rezepten platziert | `recipes.test.ts`, „Pfad-Piktogramm in beiden Layoutfällen" (Task 9) |
| 2 — bestehender Snapshot und die y-16/y-19-Rezepttests | `recipes.test.ts`, „verschiebt das Piktogramm mit der Körpermitte" + Snapshot-Diff aus Task 8, Step 8 |
| 3 — SVG und Canvas erzeugen aus translate dasselbe Bild | `canvas.test.ts`, „Renderer-Parität bei translate" (Task 3) |
| 4 — Kommando-Gate lehnt relativ, A, S, T je einzeln ab | `pictogram-gate.test.ts`, vier Tests (Task 4) |
| 5 — Box-Gate: Koordinate außerhalb abgelehnt, V/H je Achse gelesen; Clipping-Gate lehnt überragende Box ab | `pictogram-gate.test.ts` (Tasks 5, 6) |
| 6 — jedes Piktogramm auflösbar, Manifest mit `fingerprintTest: false` und begründetem `technical` | `elements.test.ts`, `coverage-manifest.test.ts` (Task 11) |
| 7 — `phjardas-tz` mit `geometryUse: ['compared-only']`, kein Eintrag mit übernommener Geometrie | `sources.test.ts` (Task 10) |

Für Kriterium 7 die zweite Hälfte zusätzlich direkt prüfen:

```bash
grep -rn "phjardas" packages/catalog/src/pictograms/ || echo "Keine Geometrie aus dem Upstream"
```
Expected: die Meldung.

- [ ] **Step 4: Was D.0 ausdrücklich nicht liefert, im Plan festhalten**

Beim Abschlussreview gegenprüfen, dass keines davon versehentlich mitgebaut wurde — jedes wäre Scope-Ausweitung, nicht Zugabe:

- Der Inhalt von D.1 bis D.5 — 249 der 250 Piktogrammabschnitte
- Die vier verbleibenden Gate-Lücken: Mehrgrößen-Regression 16…256, Theme- und Druckprofile, A11y-Kontrastprüfung, viewBox-Konsistenz über den Gesamtbestand
- Kapitel 3: `PropertyId` existiert weiterhin nicht
- Die Fußzone: `designation` bleibt validiert und ungerendert, `role: 'foot'` ungenutzt
- Die sechs fehlenden Grundzeichen, das `1.13`-Gate, Verwaltungsstufen- und Fahrzeugkategorie-Kopfmarken
- `legacyIds` bleibt ohne Inhalt
- `jonas-koeritz/Taktische-Zeichen` bleibt unregistriert
- Der `variant`-Fall (er ist seit Slice 1 gelöst und gehört nach D.1)

- [ ] **Step 5: Die Entscheidungsnotiz zum Slice schreiben**

`docs/decisions/2026-08-05-piktogramm-mechanismus-d0.md` anlegen, im Format der bestehenden Notizen. Inhalt: die vier Festlegungen aus dem Plankopf mit dem, was die Umsetzung daran bestätigt oder korrigiert hat; der beobachtete Snapshot-Diff aus Task 8, Step 8; die Signaturabweichung des Clipping-Gates (`Primitive` statt `SymbolKind`) mit ihrer Begründung; und die offenen Punkte, die in D.1 fallen (Körperformen jenseits von `formation` im Clipping-Gate, die Präfix-Aufteilung von Anhang J).

- [ ] **Step 6: Commit**

```bash
git add docs/decisions/2026-08-05-piktogramm-mechanismus-d0.md
git commit -m "docs: Entscheidungsnotiz zum Piktogramm-Mechanismus (D.0)"
```

---

## Self-Review des Plans

**Spec-Abdeckung**, Abschnitt für Abschnitt:

| Spec-Abschnitt | Task |
|---|---|
| 2 — blockierender Befund (`shiftY` wirft für Pfade) | 8 |
| 5 — `Translation`, Gruppen-Platzierung, drei Renderer-/Bounds-Stellen | 1, 2, 3, 8 |
| 5 — `PictogramBox`, `PictogramDefinition`, `pictogram`-Port | 4, 7 |
| 5 — Autorenkonvention (absolut, sieben Kommandos, Millimeter) | 4 (Gate), 9 (angewandt) |
| 6 — fünf ID-Präfixe, `PictogramId`, `Partial`-Register mit Wurf | 4, 7, 11 |
| 6 — `CapabilityId` wächst je Unter-Slice | 9 |
| 7 — Kommando-, Box-, Clipping-Gate | 4, 5, 6 |
| 7 — reduziertes `technical`-Kriterium | 11 |
| 7 — `releaseBlockers` zählt nach Bereich | 12 |
| 8 — Manifest-Einträge, `scope` wächst mit dem Inhalt, `referenceAsset` | 11 |
| 9 — `open-source-corpus`, `compared-only`, `phjardas-tz` | 10 |
| 10 — Umstellung von `capability.fire-fighting` unter Erhalt der Tests | 7, 8 |
| 10 — ein neues Pfad-Piktogramm mit Kurven (`4.3.2`) | 9 |
| 11 — Ablage, keine neue Paketebene | Dateistruktur oben |
| 13 — die acht Erfolgskriterien | Abschlusstask |

Kein Abschnitt ohne Task. Abschnitt 3 (Bestandsmessung), 12 (Umfang) und 14 (Risiken) sind beschreibend und brauchen keinen.

**Platzhalter:** keine. Jeder Codeschritt enthält den Code, jeder Testschritt den Test, jeder Prüfschritt das Kommando und die erwartete Ausgabe. Der Snapshot-Schritt (Task 8, Step 7/8) nennt die Zahlen vorab, statt „Diff prüfen" zu schreiben.

**Typkonsistenz**, quer über die Tasks geprüft:

- `Translation { dxMm, dyMm }` — Task 1 deklariert, Tasks 2, 3, 8 lesen dieselben Feldnamen.
- `PictogramBox { xMm, yMm, widthMm, heightMm }` — Task 4 deklariert, Tasks 5, 6, 7, 9, 11 verwenden sie; nirgends `x`/`y` ohne Suffix.
- `PictogramIssue { gate, pictogramId, detail }` — Task 4 deklariert, Tasks 5, 6 füllen sie, Task 7 liest `gate`.
- `checkCommands` / `checkBox` / `checkClipping` / `checkPictogram` — dieselben Namen in Tasks 4–7.
- `pictogram(id)` — Task 7 exportiert, Tasks 8, 9, 11 rufen auf; der Port in `CatalogPorts` heißt gleich.
- `PICTOGRAM_ELEMENT_KINDS` — Task 11 deklariert in `elements.ts`, `coverage-manifest.ts` und `elements.test.ts` lesen es.
- `domainReviewPendingByArea` — Task 12 deklariert, CLI und Test lesen denselben Namen.
- `'capability.service-water'` — identisch in `taxonomy.ts` (als `'service-water'`), `capabilities.ts`, `ELEMENTS`, `ELEMENT_SECTIONS`, den Tests und dem Snapshot-Dateinamen.
- `'4.3.2_Löschwasser Brauchwasser.svg'` — mit Leerzeichen, in `ELEMENTS` und im Test identisch; `'4.3.2'` in `ELEMENT_SECTIONS` und `scope`.

**Abhängigkeitsreihenfolge:** 1 → 2 → 3 (translate vollständig) → 4 → 5 → 6 (Gates) → 7 (Katalog, braucht 4–6) → 8 (compose, braucht 1–3 und 7) → 9 (braucht 7, 8) → 10 (unabhängig) → 11 (braucht 9) → 12 (braucht 11). Tasks 10 und 12 sind die einzigen, die vorgezogen werden könnten; die Reihenfolge oben hält die Commit-Historie thematisch geschlossen.
