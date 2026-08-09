# Textprimitiv und Fußzone Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ein `text`-Primitiv samt Renderer, Gates und deterministischer Rasterevidenz einführen und
die Fußzone (`designation`, `role: 'foot'`) daran anschließen.

**Architecture:** Das Primitiv trägt seinen Inhalt, seinen Ankerpunkt, seinen Schriftgrad in
Millimetern und eine **deklarierte** Box. Diese Umkehr — die Box ist bei Text keine Messung mehr,
sondern eine Vorgabe — ist die eine Entscheidung, an der alle vier Gates hängen. Die Schrift kommt
als OFL-lizenzierte Datei ins Repo und wird resvg per `fontFiles` fest vorgegeben, weil
`loadSystemFonts: false` Text sonst gar nicht rastert und Systemschriften nicht maschinenstabil
sind.

**Tech Stack:** TypeScript 5.9, Vitest 3, pnpm 11.20.0, `@resvg/resvg-js`, bestehende
Paketrichtung `cli → catalog → core → schema`

## Global Constraints

- Ausgangspunkt ist `main` mit grüner Evidenz; die Umsetzung läuft in einem isolierten Worktree.
  **Nicht** im D.3-Worktree `anhang-j-d3` — der parkt mit seinen zwei J.2-Zeichen und wird nach
  diesem Slice fortgesetzt.
- Jeder Shellbefehl wird gemäß Repository-Anweisung mit `rtk` ausgeführt.
- Dieser Slice liefert **keine** neuen Katalogzeichen. `pnpm cli coverage` meldet am Ende
  unverändert `Einträge: 181` und `Offene fachliche Reviews: 194` **plus genau einen** neuen
  Quellenreview für die Schrift, also 195.
- Alle Längen sind Millimeter. `sizeMm` ist keine Ausnahme.
- Die Rasterung läuft ausnahmslos mit `fontFiles: [<Repo-Pfad>]` **und**
  `loadSystemFonts: false`. Keine Systemschrift darf einwirken.
- Die Schriftdatei kommt mit vollständigem OFL-Lizenztext, Bezugsquelle und SHA-256-Prüfsumme und
  wird in `sources.ts` registriert. Eine stillschweigend eingecheckte Fontdatei wäre in diesem
  Projekt inkonsequent.
- SVG- und Canvas-Renderer lösen dasselbe Primitiv gleich auf. Das Repo hat diesen Vertrag bereits
  (`svg.ts`-Kommentar zu `renderPrimitive`); er gilt auch für Text.
- Bestehende Snapshots dürfen sich **nicht** ändern. Kein vorhandenes Zeichen trägt Text; jede
  Snapshotänderung an einem Bestandszeichen ist ein Befund, kein erwartetes Ergebnis.
- `DepictionVariant` heißt `'primary' | 'alternative'`.

---

## Dateistruktur

**Neu:**

| Datei | Verantwortung |
|---|---|
| `packages/catalog/assets/Arimo[wght].ttf` | die Schrift |
| `packages/catalog/assets/Arimo-OFL.txt` | vollständiger Lizenztext |
| `packages/catalog/assets/README.md` | Bezugsquelle, Version, SHA-256, Begründung |
| `packages/catalog/src/fonts.ts` | Pfadauflösung und Prüfsumme, eine Quelle der Wahrheit |
| `packages/catalog/src/fonts.test.ts` | Prüfsummen- und Determinismusnachweis |
| `packages/core/src/render/text-policy.ts` | Schriftfamilie, Mindestgröße, gemeinsame Renderregeln |
| `packages/core/src/render/text-policy.test.ts` | Mindestgrößenregel |

**Geändert:**

| Datei | Änderung |
|---|---|
| `packages/schema/src/geometry.ts` | `text`-Variante in `Primitive` |
| `packages/core/src/bounds.ts` | `boundsOfMm` liefert für Text die deklarierte Box |
| `packages/core/src/render/svg.ts` | Renderfall im `switch` |
| `packages/core/src/render/canvas.ts` | derselbe Fall |
| `packages/core/src/pictogram-gate.ts` | `!hasPath && !hasText`, Clipping gegen die Box, `text-below-minimum-size` |
| `packages/core/src/viewbox-gate.ts` | Textbounds = deklarierte Box, keine Strichbreite |
| `packages/core/src/fingerprint.ts` | Textfelder im Fingerprint |
| `packages/core/src/compose.ts` | Fußzone aus `designation` |
| `packages/catalog/src/pictograms/contrast-contract.ts` | `MINIMUM_TEXT_CONTRAST`, Befund bei identischen Tokenpaaren |
| `packages/catalog/src/multi-size-snapshots.test.ts` | `fontFiles` |
| `packages/catalog/src/sources.ts` | Quelleneintrag der Schrift |
| `packages/catalog/src/domain-reviews.ts` | ein Quellenreview für die Schrift |

---

## Verbindliche Messreihe

Aus dem Spike vom 9. August, „HRT" bei Schriftgrad 10 mm auf 32-mm-Fläche, Arimo, `fontFiles`,
`loadSystemFonts: false`:

| Rendergröße | effektiver Schriftgrad | dunkle Pixel | determ. |
|---|---|---|---|
| 16 px | 5,0 px | 13 | ja |
| 24 px | 7,5 px | 33 | ja |
| 32 px | 10,0 px | 47 | ja |
| 64 px | 20,0 px | 201 | ja |
| 128 px | 40,0 px | 689 | ja |
| 256 px | 80,0 px | 2863 | ja |

Diese Reihe ist die Datengrundlage für Task 6. Sie wird dort visuell nachgeprüft, nicht
weitergerechnet.

---

### Task 1: Ausgangsbasis und Worktree

**Files:** keine

**Interfaces:**
- Consumes: nichts
- Produces: einen isolierten Worktree mit grüner Evidenz

- [ ] **Step 1: Sauberen Ausgangsstand prüfen**

```bash
rtk git status --short
rtk git log --oneline -1
```

Erwartet: leere Statusausgabe auf `main`.

- [ ] **Step 2: Worktree anlegen**

Nutze `superpowers:using-git-worktrees`. Zielbranch: `textprimitiv-und-fusszone`.
**Nicht** den D.3-Worktree `anhang-j-d3` verwenden — der parkt.

- [ ] **Step 3: Abhängigkeiten installieren**

```bash
rtk pnpm install --frozen-lockfile
```

- [ ] **Step 4: Grüne Ausgangsbasis belegen**

```bash
rtk pnpm test
rtk pnpm typecheck
rtk pnpm cli coverage
```

Erwartet: 52 Testdateien / 1821 Tests grün (Dauer etwa 8 Minuten), keine TypeScript-Fehler,
`Coverage-Gate bestanden.` mit `Einträge: 181` und `Offene fachliche Reviews: 194`.

Weicht eine der drei Ausgaben ab: **abbrechen und melden.**

---

### Task 2: Die Schrift als registrierter Quellenträger

**Files:**
- Create: `packages/catalog/assets/Arimo[wght].ttf`
- Create: `packages/catalog/assets/Arimo-OFL.txt`
- Create: `packages/catalog/assets/README.md`
- Create: `packages/catalog/src/fonts.ts`
- Create: `packages/catalog/src/fonts.test.ts`
- Modify: `packages/catalog/src/sources.ts`
- Modify: `packages/catalog/src/domain-reviews.ts`
- Modify: `packages/schema/src/provenance.ts`

**Interfaces:**
- Consumes: nichts
- Produces:
  - `TEXT_FONT_PATH: string` — absoluter Pfad zur Schriftdatei
  - `TEXT_FONT_SHA256: string` — erwartete Prüfsumme
  - `TEXT_FONT_FAMILY: 'Arimo'`
  - `resvgFontOptions(): { fontFiles: string[]; loadSystemFonts: false; defaultFontFamily: string }`

- [ ] **Step 1: Schrift und Lizenztext beschaffen**

```bash
curl -sSL -o 'packages/catalog/assets/Arimo[wght].ttf' \
  'https://raw.githubusercontent.com/google/fonts/main/ofl/arimo/Arimo%5Bwght%5D.ttf'
curl -sSL -o packages/catalog/assets/Arimo-OFL.txt \
  'https://raw.githubusercontent.com/google/fonts/main/ofl/arimo/OFL.txt'
shasum -a 256 'packages/catalog/assets/Arimo[wght].ttf'
```

Erwartet: eine TTF-Datei von etwa 484 KB (`file` meldet `TrueType Font data`) und ein
OFL-Lizenztext. Meldet `file` HTML, ist der Download fehlgeschlagen — **nicht** weitermachen.

Notiere die Prüfsumme; sie geht in Step 3 und in den `README.md`.

- [ ] **Step 2: Herkunftsnachweis schreiben**

Create `packages/catalog/assets/README.md` mit: Schriftname und Version, Bezugsquelle als
vollständige URL, Abrufdatum, SHA-256, Lizenz (SIL OFL 1.1) mit Verweis auf `Arimo-OFL.txt`, und
in zwei Sätzen die Begründung aus der Spec — metrisch Arial-kompatibel, und Liberation Sans hat
keine stabile TTF-Bezugsquelle.

- [ ] **Step 3: Den fehlgeschlagenen Test schreiben**

Create `packages/catalog/src/fonts.test.ts`:

```typescript
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { TEXT_FONT_FAMILY, TEXT_FONT_PATH, TEXT_FONT_SHA256, resvgFontOptions } from './fonts.js';

describe('Textschrift', () => {
  it('liegt im Repository und hat die erwartete Prüfsumme', () => {
    const bytes = readFileSync(TEXT_FONT_PATH);
    expect(createHash('sha256').update(bytes).digest('hex')).toBe(TEXT_FONT_SHA256);
  });

  it('schließt Systemschriften aus', () => {
    const options = resvgFontOptions();
    expect(options.loadSystemFonts).toBe(false);
    expect(options.fontFiles).toEqual([TEXT_FONT_PATH]);
    expect(options.defaultFontFamily).toBe(TEXT_FONT_FAMILY);
  });
});
```

- [ ] **Step 4: Test laufen lassen und Fehlschlag bestätigen**

```bash
rtk pnpm vitest run packages/catalog/src/fonts.test.ts
```

Erwartet: FAIL — `Cannot find module './fonts.js'`.

- [ ] **Step 5: `fonts.ts` schreiben**

Create `packages/catalog/src/fonts.ts`. Die Prüfsumme aus Step 1 als Literal eintragen. Der Pfad
wird aus `import.meta.url` aufgelöst, damit er unabhängig vom Arbeitsverzeichnis stimmt:

```typescript
import { fileURLToPath } from 'node:url';

/**
 * Die einzige Schrift des Projekts. Sie liegt als Datei im Repository, weil `@resvg/resvg-js`
 * mit `loadSystemFonts: false` überhaupt keinen Text rastert und mit Systemschriften ein
 * maschinenabhängiges Ergebnis liefert — beides würde die Snapshot-Evidenz entwerten.
 */
export const TEXT_FONT_FAMILY = 'Arimo';

export const TEXT_FONT_PATH = fileURLToPath(
  new URL('../assets/Arimo[wght].ttf', import.meta.url),
);

/** Eine ausgetauschte Schrift ist damit ein Testfehler und kein stiller Snapshot-Drift. */
export const TEXT_FONT_SHA256 = '<Prüfsumme aus Step 1>';

export function resvgFontOptions(): {
  fontFiles: string[];
  loadSystemFonts: false;
  defaultFontFamily: string;
} {
  return {
    fontFiles: [TEXT_FONT_PATH],
    loadSystemFonts: false,
    defaultFontFamily: TEXT_FONT_FAMILY,
  };
}
```

- [ ] **Step 6: Test laufen lassen und Erfolg bestätigen**

```bash
rtk pnpm vitest run packages/catalog/src/fonts.test.ts
```

Erwartet: PASS, 2 Tests.

- [ ] **Step 7: Schrift im Quellenregister eintragen**

`SourceId` in `packages/schema/src/provenance.ts` um `'arimo-ofl'` erweitern. In
`packages/catalog/src/sources.ts` den Eintrag anlegen — sieh dir einen bestehenden Eintrag an und
fülle dieselben Felder: Titel, Herausgeber, Fassung, Bezugsquelle, Abrufdatum, Lizenz.

In `packages/catalog/src/domain-reviews.ts` den zugehörigen `SOURCE_DOMAIN_REVIEWS`-Eintrag mit
`{ status: 'pending' }` ergänzen — je Quelle ein eigenes Objekt.

- [ ] **Step 8: Zählwert nachziehen**

Die Quellenzahl wächst von 12 auf 13. Suche die Testdateien, die sie pinnen:

```bash
rtk grep -rn "toHaveLength(12)\|toBe(12)\|Quellen" packages --include='*.test.ts'
```

Ziehe jede gefundene Stelle nach. **Reine Zählwertfortschreibung** — wenn eine Zusicherung
inhaltlich nicht mehr standhält, schwäche sie nicht ab, sondern melde NEEDS_CONTEXT.

- [ ] **Step 9: Tests laufen lassen**

```bash
rtk pnpm test
rtk pnpm typecheck
rtk pnpm cli coverage
```

Erwartet: grün, `Einträge: 181`, `Quellen: 13`, `Offene fachliche Reviews: 195`.

Der volle Lauf dauert etwa 8 Minuten. Fahre ihn im Vordergrund mit großzügigem Timeout und warte
ihn ab; starte ihn **nicht** im Hintergrund und beende dann deinen Zug.

- [ ] **Step 10: Commit**

```bash
rtk git add packages/catalog packages/schema
rtk git commit -m "feat(catalog): Arimo als registrierten Schriftquellenträger aufnehmen"
```

---

### Task 3: Das Textprimitiv im Schema

**Files:**
- Modify: `packages/schema/src/geometry.ts`
- Test: `packages/schema/src/geometry.test.ts`

**Interfaces:**
- Consumes: nichts
- Produces: die `text`-Variante von `Primitive` mit den Feldern `content`, `x`, `y`, `sizeMm`,
  `anchor`, `baseline`, `boxMm`

- [ ] **Step 1: Den fehlgeschlagenen Test schreiben**

In `packages/schema/src/geometry.test.ts` ergänzen:

```typescript
it('trägt ein Textprimitiv mit deklarierter Fläche', () => {
  const text: Primitive = {
    type: 'text',
    role: 'pictogram',
    content: 'HRT',
    x: 16,
    y: 20,
    sizeMm: 10,
    anchor: 'middle',
    baseline: 'alphabetic',
    boxMm: { xMm: 6, yMm: 12, widthMm: 20, heightMm: 10 },
  };
  expect(text.type).toBe('text');
  expect(text.boxMm.widthMm).toBe(20);
});
```

- [ ] **Step 2: Test laufen lassen und Fehlschlag bestätigen**

```bash
rtk pnpm vitest run packages/schema/src/geometry.test.ts
```

Erwartet: FAIL — TypeScript kennt `type: 'text'` nicht.

- [ ] **Step 3: Die Variante ergänzen**

In `packages/schema/src/geometry.ts`, in der `Primitive`-Union nach `path`:

```typescript
  /**
   * Text. Die einzige Primitivart, deren Ausdehnung nicht berechenbar ist — sie hängt an
   * Fontmetrik, Schriftgrad und Laufweite. `boxMm` ist deshalb **keine Messung**, sondern eine
   * Zusicherung des Autors, in die der Text zu passen hat; `boundsOfMm` gibt sie unverändert
   * zurück, und die Gates prüfen gegen sie statt gegen die Glyphen.
   *
   * Die Schriftfamilie steht bewusst nicht hier: es gibt genau eine, und sie gehört in die
   * Renderpolitik, nicht in jedes Primitiv.
   */
  | (PrimitiveBase & {
      type: 'text';
      content: string;
      x: Length;
      y: Length;
      sizeMm: Length;
      anchor: 'start' | 'middle' | 'end';
      baseline: 'alphabetic' | 'middle' | 'hanging';
      boxMm: { xMm: Length; yMm: Length; widthMm: Length; heightMm: Length };
    })
```

- [ ] **Step 4: Test laufen lassen**

```bash
rtk pnpm vitest run packages/schema/src/geometry.test.ts
rtk pnpm typecheck
```

Erwartet: PASS. **Der Typecheck wird an mehreren Stellen fehlschlagen** — jeder erschöpfende
`switch` über `Primitive` kennt den neuen Fall nicht. Das ist der erwartete Zustand nach diesem
Step; Task 4 und Task 5 schließen die Fälle. Notiere die Fundstellen für den Bericht.

- [ ] **Step 5: Commit**

```bash
rtk git add packages/schema/src
rtk git commit -m "feat(schema): Textprimitiv mit deklarierter Fläche"
```

---

### Task 4: Bounds, Fingerprint und die Renderer

**Files:**
- Modify: `packages/core/src/bounds.ts`
- Modify: `packages/core/src/fingerprint.ts`
- Modify: `packages/core/src/render/svg.ts`
- Modify: `packages/core/src/render/canvas.ts`
- Create: `packages/core/src/render/text-policy.ts`
- Test: `packages/core/src/bounds.test.ts`, `packages/core/src/fingerprint.test.ts`,
  `packages/core/src/render/svg.test.ts`

**Interfaces:**
- Consumes: die `text`-Variante aus Task 3, `TEXT_FONT_FAMILY` aus Task 2
- Produces:
  - `boundsOfMm` liefert für Text `boxMm`
  - `renderSvg` gibt `<text>` aus
  - `TEXT_FONT_FAMILY_ATTR` und die gemeinsame Attributbildung in `text-policy.ts`

- [ ] **Step 1: Die fehlgeschlagenen Tests schreiben**

In `packages/core/src/bounds.test.ts`:

```typescript
it('gibt für Text die deklarierte Fläche zurück, nicht die Glyphenhülle', () => {
  const bounds = boundsOfMm({
    type: 'text',
    content: 'HRT',
    x: 16,
    y: 20,
    sizeMm: 10,
    anchor: 'middle',
    baseline: 'alphabetic',
    boxMm: { xMm: 6, yMm: 12, widthMm: 20, heightMm: 10 },
  });
  expect(bounds).toEqual({ minX: 6, minY: 12, maxX: 26, maxY: 22 });
});
```

In `packages/core/src/render/svg.test.ts`:

```typescript
it('gibt ein Textprimitiv mit Anker, Grundlinie und Schriftfamilie aus', () => {
  const svg = renderSvg({
    viewBox: { width: 32, height: 32 },
    primitives: [
      {
        type: 'text',
        role: 'pictogram',
        content: 'HRT',
        x: 16,
        y: 20,
        sizeMm: 10,
        anchor: 'middle',
        baseline: 'alphabetic',
        boxMm: { xMm: 6, yMm: 12, widthMm: 20, heightMm: 10 },
      },
    ],
  });
  expect(svg).toContain('<text');
  expect(svg).toContain('text-anchor="middle"');
  expect(svg).toContain('font-family="Arimo"');
  expect(svg).toContain('>HRT</text>');
  expect(svg).not.toContain('font-weight');
});

it('maskiert Sonderzeichen im Textinhalt', () => {
  const svg = renderSvg({
    viewBox: { width: 32, height: 32 },
    primitives: [
      {
        type: 'text',
        content: 'A&B<C',
        x: 16,
        y: 20,
        sizeMm: 10,
        anchor: 'middle',
        baseline: 'alphabetic',
        boxMm: { xMm: 6, yMm: 12, widthMm: 20, heightMm: 10 },
      },
    ],
  });
  expect(svg).toContain('A&amp;B&lt;C');
});
```

In `packages/core/src/fingerprint.test.ts`:

```typescript
it('unterscheidet Textprimitive nach Inhalt und Schriftgrad', () => {
  const base = {
    type: 'text' as const,
    x: 16,
    y: 20,
    anchor: 'middle' as const,
    baseline: 'alphabetic' as const,
    boxMm: { xMm: 6, yMm: 12, widthMm: 20, heightMm: 10 },
  };
  const hrt = fingerprintOf({ ...base, content: 'HRT', sizeMm: 10 });
  const frt = fingerprintOf({ ...base, content: 'FRT', sizeMm: 10 });
  const gross = fingerprintOf({ ...base, content: 'HRT', sizeMm: 12 });
  expect(hrt).not.toBe(frt);
  expect(hrt).not.toBe(gross);
});
```

Passe `fingerprintOf` an den tatsächlichen Namen der Fingerprintfunktion an; sieh dazu in
`packages/core/src/fingerprint.ts` nach.

- [ ] **Step 2: Tests laufen lassen und Fehlschläge bestätigen**

```bash
rtk pnpm vitest run packages/core/src/bounds.test.ts packages/core/src/render/svg.test.ts packages/core/src/fingerprint.test.ts
```

Erwartet: FAIL in allen drei Dateien.

- [ ] **Step 3: `text-policy.ts` anlegen**

Create `packages/core/src/render/text-policy.ts`:

```typescript
/**
 * Renderpolitik für Text. Sie steht hier und nicht im Primitiv, weil sie für jeden Text
 * dieselbe ist: eine Schriftfamilie, kein gesetztes Gewicht. Ein nicht gesetztes Gewicht ist
 * eine Achse weniger, die einen Snapshot verschieben kann.
 */
export const TEXT_FONT_FAMILY_ATTR = 'Arimo';

const BASELINE_ATTR = {
  alphabetic: 'alphabetic',
  middle: 'central',
  hanging: 'hanging',
} as const;

export function baselineAttr(baseline: 'alphabetic' | 'middle' | 'hanging'): string {
  return BASELINE_ATTR[baseline];
}
```

- [ ] **Step 4: `boundsOfMm` erweitern**

In `packages/core/src/bounds.ts` den Textfall in `rawBoundsOfMm` ergänzen: er gibt `boxMm` als
Bounds zurück. Kommentiere das **Warum** — die Glyphenhülle ist ohne Fontmetrik nicht berechenbar,
also ist die deklarierte Fläche die einzige verfügbare Wahrheit.

- [ ] **Step 5: Renderer ergänzen**

In `packages/core/src/render/svg.ts` den `case 'text'` im `switch` (`svg.ts:203`). Der Text wird
gefüllt, nicht gestrichen — `styleAttrs` entsprechend aufrufen und **keinen**
`pictogramStrokeContract` setzen. Inhalt mit derselben XML-Maskierung ausgeben, die `<title>` und
`<desc>` schon nutzen.

In `packages/core/src/render/canvas.ts` denselben Fall, damit SVG und Canvas gleich auflösen.

- [ ] **Step 6: Fingerprint erweitern**

In `packages/core/src/fingerprint.ts` den Textfall: `content`, `sizeMm`, `anchor`, `baseline` und
`boxMm` gehen ein, die gerasterten Glyphen nicht.

- [ ] **Step 7: Tests laufen lassen**

```bash
rtk pnpm vitest run packages/core/src/bounds.test.ts packages/core/src/render/svg.test.ts packages/core/src/fingerprint.test.ts
rtk pnpm typecheck
```

Erwartet: PASS in allen drei Dateien. Der Typecheck kann in `pictogram-gate.ts` und
`viewbox-gate.ts` noch fehlschlagen — Task 5 schließt diese Fälle.

- [ ] **Step 8: Commit**

```bash
rtk git add packages/core/src
rtk git commit -m "feat(core): Text in Bounds, Fingerprint und beiden Renderern"
```

---

### Task 5: Die Gates

**Files:**
- Modify: `packages/core/src/pictogram-gate.ts`
- Modify: `packages/core/src/viewbox-gate.ts`
- Test: `packages/core/src/pictogram-gate.test.ts`, `packages/core/src/viewbox-gate.test.ts`

**Interfaces:**
- Consumes: `boundsOfMm` für Text aus Task 4
- Produces: die Textregeln in `checkBox`, `checkClipping` und dem viewBox-Gate

- [ ] **Step 1: Die fehlgeschlagenen Tests schreiben**

In `packages/core/src/pictogram-gate.test.ts`:

```typescript
const TEXT_PRIMITIVE = {
  type: 'text' as const,
  role: 'pictogram' as const,
  content: 'HRT',
  x: 16,
  y: 20,
  sizeMm: 10,
  anchor: 'middle' as const,
  baseline: 'alphabetic' as const,
  boxMm: { xMm: 6, yMm: 12, widthMm: 20, heightMm: 10 },
};

it('fordert bei Text Enthaltung statt Gleichheit', () => {
  const issues = checkBox({
    id: 'comms.test',
    variant: 'primary',
    title: 'Test',
    box: { xMm: 4, yMm: 10, widthMm: 24, heightMm: 14 },
    primitives: [TEXT_PRIMITIVE],
  });
  expect(issues).toEqual([]);
});

it('meldet Text außerhalb der Piktogramm-Box', () => {
  const issues = checkBox({
    id: 'comms.test',
    variant: 'primary',
    title: 'Test',
    box: { xMm: 10, yMm: 10, widthMm: 8, heightMm: 8 },
    primitives: [TEXT_PRIMITIVE],
  });
  expect(issues.length).toBeGreaterThan(0);
  expect(issues[0]!.gate).toBe('box');
});
```

In `packages/core/src/viewbox-gate.test.ts` einen Fall, der belegt, dass die deklarierte Box als
Textbounds gilt und **keine** halbe Strichbreite addiert wird.

- [ ] **Step 2: Tests laufen lassen und Fehlschläge bestätigen**

```bash
rtk pnpm vitest run packages/core/src/pictogram-gate.test.ts packages/core/src/viewbox-gate.test.ts
```

Erwartet: FAIL.

- [ ] **Step 3: `checkBox` erweitern**

In `packages/core/src/pictogram-gate.ts`: Die Gleichheitsprüfung ist heute durch
`measurable.length > 0 && !hasPath(definition.primitives)` bewacht. Ergänze eine
`hasText`-Prüfung, sodass die Gleichheit nur noch ohne Pfad **und** ohne Text gefordert wird.
Kommentiere das Warum.

Der Enthaltungsteil braucht keine Sonderbehandlung: `boundsOfMm` liefert für Text die deklarierte
Box, und die vorhandene Bounds-Schleife prüft sie wie jede andere Hülle.

- [ ] **Step 4: `checkClipping` erweitern**

Text hat keine messbare Fläche. Geprüft wird die deklarierte Box gegen den Körper. Nutze
denselben `containsPoint`-Weg wie für messbare Primitive, gespeist aus `boxMm`.

- [ ] **Step 5: viewBox-Gate erweitern**

In `packages/core/src/viewbox-gate.ts` den Textfall: Bounds sind `boxMm`, ohne Strichbreite —
Text wird gefüllt, nicht gestrichen.

- [ ] **Step 6: Tests laufen lassen**

```bash
rtk pnpm vitest run packages/core/src/pictogram-gate.test.ts packages/core/src/viewbox-gate.test.ts
rtk pnpm typecheck
```

Erwartet: PASS, Typecheck ohne Fehler.

- [ ] **Step 7: Commit**

```bash
rtk git add packages/core/src
rtk git commit -m "feat(core): Textregeln in Box-, Clipping- und viewBox-Gate"
```

---

### Task 6: Mindestgröße als eigene Befundklasse

**Files:**
- Modify: `packages/core/src/render/text-policy.ts`
- Modify: `packages/core/src/pictogram-gate.ts`
- Create: `packages/core/src/render/text-policy.test.ts`
- Test: `packages/core/src/pictogram-gate.test.ts`

**Interfaces:**
- Consumes: die Textregeln aus Task 5
- Produces:
  - `MINIMUM_TEXT_RENDER_PX: number`
  - `effectiveTextPx(sizeMm: number, renderPx: number, viewBoxMm: number): number`
  - `checkTextLegibility(definition, renderSizesPx): PictogramIssue[]` mit
    `gate: 'text-legibility'`

- [ ] **Step 1: Die Schwelle visuell bestimmen**

Rendere „HRT" bei Schriftgrad 10 mm in den sechs Snapshotgrößen mit `resvgFontOptions()`, schreibe
die PNGs unter das Scratchpad und **sieh sie an**. Die Messreihe des Plans nennt die Pixelzahlen;
du entscheidest, ab welchem effektiven Schriftgrad drei Großbuchstaben lesbar bleiben.

Halte die Entscheidung mit ihrer Begründung im Bericht fest. Rate nicht — die Schwelle ist eine
Aussage über Lesbarkeit und wird wie `MINIMUM_NON_TEXT_CONTRAST` als benannte Konstante
festgeschrieben.

- [ ] **Step 2: Den fehlgeschlagenen Test schreiben**

Create `packages/core/src/render/text-policy.test.ts`:

```typescript
import { describe, expect, it } from 'vitest';
import { MINIMUM_TEXT_RENDER_PX, effectiveTextPx } from './text-policy.js';

describe('Mindestgröße für Text', () => {
  it('rechnet den Schriftgrad auf die Rendergröße um', () => {
    expect(effectiveTextPx(10, 32, 32)).toBe(10);
    expect(effectiveTextPx(10, 16, 32)).toBe(5);
    expect(effectiveTextPx(10, 256, 32)).toBe(80);
  });

  it('hält die Schwelle als benannte Konstante', () => {
    expect(MINIMUM_TEXT_RENDER_PX).toBeGreaterThan(0);
  });
});
```

In `packages/core/src/pictogram-gate.test.ts` einen Fall, der belegt: ein Textzeichen meldet bei
einer Rendergröße unterhalb der Schwelle genau einen Befund mit `gate: 'text-legibility'`, und
oberhalb keinen. Der Befundtext nennt Zeichen, Rendergröße und errechneten Pixelwert.

- [ ] **Step 3: Tests laufen lassen und Fehlschläge bestätigen**

```bash
rtk pnpm vitest run packages/core/src/render/text-policy.test.ts packages/core/src/pictogram-gate.test.ts
```

Erwartet: FAIL.

- [ ] **Step 4: Regel und Gate schreiben**

`MINIMUM_TEXT_RENDER_PX` mit dem Wert aus Step 1 und einem Kommentar, der die visuelle Prüfung
benennt. `effectiveTextPx` als reine Rechnung `sizeMm / viewBoxMm * renderPx`.

`checkTextLegibility` in `pictogram-gate.ts` mit der neuen Gate-Kennung `'text-legibility'`.

Der Befund sagt aus: das Zeichen ist **nicht kaputt**, es hat eine dokumentierte untere
Einsatzgrenze. Formuliere den Befundtext entsprechend.

- [ ] **Step 5: Tests laufen lassen**

```bash
rtk pnpm vitest run packages/core/src/render/text-policy.test.ts packages/core/src/pictogram-gate.test.ts
rtk pnpm typecheck
```

Erwartet: PASS.

- [ ] **Step 6: Commit**

```bash
rtk git add packages/core/src
rtk git commit -m "feat(core): Mindest-Rendergröße für Text als eigene Befundklasse"
```

---

### Task 7: Kontrast — zweite Schwelle und der Nulltoken-Befund

**Files:**
- Modify: `packages/catalog/src/pictograms/contrast-contract.ts`
- Test: `packages/catalog/src/pictograms/contrast-contract.test.ts`,
  `packages/catalog/src/a11y-contrast-gate.test.ts`

**Interfaces:**
- Consumes: nichts aus den Vortasks
- Produces: `MINIMUM_TEXT_CONTRAST = 4.5` und die Prüfung identischer Tokenpaare

- [ ] **Step 1: Die fehlgeschlagenen Tests schreiben**

In `packages/catalog/src/pictograms/contrast-contract.test.ts`:

```typescript
it('legt für Text die höhere Schwelle an', () => {
  expect(MINIMUM_TEXT_CONTRAST).toBe(4.5);
  expect(MINIMUM_NON_TEXT_CONTRAST).toBe(3);
});

it('meldet ein Paar aus identischen Farbtoken als Befund', () => {
  // weiss und surface sind beide #ffffff. Das Verhältnis ist 1:1 und die Zusicherung damit
  // unerfüllbar — ein Autor, der sie deklariert, hat den Kontrastvertrag missverstanden.
  const issues = contrastPairProblems([
    { foreground: 'weiss', background: 'surface', context: 'Körper auf Oberfläche' },
  ]);
  expect(issues).toHaveLength(1);
});

it('lässt eine echte Farbnachbarschaft durch', () => {
  const issues = contrastPairProblems([
    { foreground: 'schwarz', background: 'surface', context: 'Kontur auf Oberfläche' },
  ]);
  expect(issues).toEqual([]);
});
```

- [ ] **Step 2: Tests laufen lassen und Fehlschläge bestätigen**

```bash
rtk pnpm vitest run packages/catalog/src/pictograms/contrast-contract.test.ts
```

Erwartet: FAIL.

- [ ] **Step 3: Schwelle und Prüfung schreiben**

`MINIMUM_TEXT_CONTRAST = 4.5` neben `MINIMUM_NON_TEXT_CONTRAST`, mit Kommentar: WCAG unterscheidet
Text und Nichttext, und der Name der bestehenden Konstante trug diese Unterscheidung schon.

`contrastPairProblems` meldet ein Paar als Befund, dessen beide Token in einem Theme dieselbe
Farbe auflösen. Begründe im Kommentar, warum das ein Autorenfehler ist und kein Rechenergebnis.

`contrastRequirementsFor` legt für Textprimitive die höhere Schwelle an.

- [ ] **Step 4: Tests laufen lassen**

```bash
rtk pnpm vitest run packages/catalog/src/pictograms/contrast-contract.test.ts packages/catalog/src/a11y-contrast-gate.test.ts
rtk pnpm typecheck
```

Erwartet: PASS. **Schlägt ein Bestandszeichen jetzt am Nulltoken-Befund fehl, ist das ein echter
Fund** — melde ihn, statt die Prüfung zu entschärfen.

- [ ] **Step 5: Commit**

```bash
rtk git add packages/catalog/src
rtk git commit -m "feat(catalog): Textkontrastschwelle und Befund bei identischen Farbtoken"
```

---

### Task 8: Die Fußzone

**Files:**
- Modify: `packages/core/src/compose.ts`
- Test: `packages/core/src/compose.test.ts` (anlegen, falls nicht vorhanden)

**Interfaces:**
- Consumes: das Textprimitiv aus Task 3, den Renderer aus Task 4
- Produces: `compose()` erzeugt für `designation` ein Textprimitiv mit `role: 'foot'`

- [ ] **Step 1: Den fehlgeschlagenen Test schreiben**

```typescript
it('gibt die Bezeichnung als Fußzone aus', () => {
  const drawing = compose({ kind: 'formation', designation: '2. Zug' });
  const foot = drawing.primitives.filter((p) => p.role === 'foot');
  expect(foot).toHaveLength(1);
  expect(foot[0]).toMatchObject({ type: 'text', content: '2. Zug' });
});

it('erzeugt ohne Bezeichnung keine Fußzone', () => {
  const drawing = compose({ kind: 'formation' });
  expect(drawing.primitives.filter((p) => p.role === 'foot')).toHaveLength(0);
});
```

Passe `kind` und die übrigen Pflichtfelder an `SymbolSpec` an; sieh in `taxonomy.ts` nach.

- [ ] **Step 2: Test laufen lassen und Fehlschlag bestätigen**

```bash
rtk pnpm vitest run packages/core/src/compose.test.ts
```

Erwartet: FAIL — keine Fußzone im Ergebnis.

- [ ] **Step 3: Fußzone in `compose()` erzeugen**

Die Lage folgt dem vorhandenen Layoutprofil des Körpers, nicht einer neuen Sonderregel. Sieh dir
an, wie `compose.ts` die Kopfmarken platziert, und spiegle das nach unten.

`validate.ts:42` bleibt unverändert zuständig für „nicht leer". Die Barrierefreiheitstexte aus
`labels.ts:85` bleiben unberührt.

- [ ] **Step 4: Tests laufen lassen**

```bash
rtk pnpm vitest run packages/core/src/compose.test.ts
rtk pnpm typecheck
```

Erwartet: PASS.

- [ ] **Step 5: Prüfen, dass kein Bestandssnapshot kippt**

```bash
rtk pnpm vitest run packages/catalog/src/snapshots.test.ts packages/catalog/src/pictograms/snapshots.test.ts
```

Erwartet: PASS **ohne** geschriebene Snapshots. Kein Bestandszeichen trägt eine `designation`;
schreibt der Lauf Snapshots, erzeugt `compose()` eine Fußzone, wo keine hingehört — das ist ein
Befund, kein erwartetes Ergebnis.

- [ ] **Step 6: Commit**

```bash
rtk git add packages/core/src
rtk git commit -m "feat(core): Bezeichnung als gerenderte Fußzone"
```

---

### Task 9: Deterministische Rasterevidenz

**Files:**
- Modify: `packages/catalog/src/multi-size-snapshots.test.ts`
- Modify: `packages/catalog/src/fonts.test.ts`

**Interfaces:**
- Consumes: `resvgFontOptions()` aus Task 2, alles Vorherige
- Produces: den Nachweis, dass Text byteidentisch rastert

- [ ] **Step 1: Den fehlgeschlagenen Test schreiben**

In `packages/catalog/src/fonts.test.ts`:

```typescript
it('rastert dieselbe Textzeichnung zweimal byteidentisch', () => {
  const svg = renderSvg({
    viewBox: { width: 32, height: 32 },
    primitives: [
      {
        type: 'text',
        role: 'pictogram',
        content: 'HRT',
        x: 16,
        y: 20,
        sizeMm: 10,
        anchor: 'middle',
        baseline: 'alphabetic',
        boxMm: { xMm: 6, yMm: 12, widthMm: 20, heightMm: 10 },
      },
    ],
  }, { size: 256 });
  const a = new Resvg(svg, { font: resvgFontOptions() }).render().asPng();
  const b = new Resvg(svg, { font: resvgFontOptions() }).render().asPng();
  expect(Buffer.compare(a, b)).toBe(0);
});

it('rastert Text überhaupt — die Fläche ist nicht leer', () => {
  // Ohne fontFiles rastert resvg Text zu null Pixeln. Dieser Test hält fest, dass die
  // Schriftbindung wirkt; ohne ihn wäre ein leeres Bild ein bestandener Snapshot.
  const svg = /* dieselbe Zeichnung */;
  const image = new Resvg(svg, { font: resvgFontOptions() }).render();
  let dark = 0;
  for (let i = 0; i < image.pixels.length; i += 4) if (image.pixels[i]! < 128) dark++;
  expect(dark).toBeGreaterThan(100);
});
```

Der zweite Test ist der wichtigere: er unterscheidet „rendert korrekt" von „rendert gar nicht".

- [ ] **Step 2: Tests laufen lassen und Fehlschläge bestätigen**

```bash
rtk pnpm vitest run packages/catalog/src/fonts.test.ts
```

- [ ] **Step 3: `multi-size-snapshots.test.ts` auf die Schriftbindung umstellen**

`font: { loadSystemFonts: false }` wird zu `font: resvgFontOptions()`. Den Kommentar bei
`multi-size-snapshots.test.ts:28` anpassen — seine Aussage „Die Zeichnungen enthalten kein
sichtbares Textprimitiv" stimmt nicht mehr.

- [ ] **Step 4: Tests laufen lassen**

```bash
rtk pnpm vitest run packages/catalog/src/fonts.test.ts packages/catalog/src/multi-size-snapshots.test.ts
```

Erwartet: PASS **ohne** geänderte Bestandssnapshots. Ändert sich einer, hat die Schriftbindung
die Rasterung eines textfreien Zeichens verschoben — das wäre ein Befund.

- [ ] **Step 5: Commit**

```bash
rtk git add packages/catalog/src
rtk git commit -m "test(catalog): deterministische Rasterevidenz für Text"
```

---

### Task 10: Vollständige Verifikation und Entscheidungsnotiz

**Files:**
- Create: `docs/decisions/2026-08-09-textprimitiv-und-fusszone.md`
- Modify: `README.md`

**Interfaces:**
- Consumes: alles
- Produces: die dokumentierte Entscheidungslage

- [ ] **Step 1: Alle Gates belegen**

```bash
rtk pnpm test
rtk pnpm typecheck
rtk pnpm cli coverage
rtk git diff --check
```

Erwartet: Testsuite grün ohne übersprungene Tests, keine TypeScript-Fehler, `Einträge: 181`,
`Quellen: 13`, `Offene fachliche Reviews: 195`, Coverage-Gate bestanden, keine
Whitespace-Befunde.

Der volle Lauf dauert etwa 8 Minuten. Warte ihn ab.

- [ ] **Step 2: Belegzeichen visuell prüfen**

Rendere ein Textzeichen in allen sechs Größen und in allen drei Themes und sieh es an. Rendere
eine Fußzone und sieh sie an. Halte fest, was du gesehen hast.

- [ ] **Step 3: Entscheidungsnotiz schreiben**

Create `docs/decisions/2026-08-09-textprimitiv-und-fusszone.md` mit den Abschnitten:

1. **Anlass** — Anhang J ist typografisch, die Fußzone war seit dem 5. August offen
2. **Die Box kehrt ihre Rolle um** — Vorgabe statt Messung, und was das für jedes der vier Gates
   heißt; der benannte Preis, dass eine falsche Box erst in der visuellen Prüfung auffällt
3. **Die Schrift** — Arimo, OFL, Bezugsquelle, Prüfsumme, warum nicht Liberation Sans, warum
   überhaupt eine Datei im Repo
4. **Mindestgröße** — die gemessene Reihe, die gewählte Schwelle, ihre Begründung, und warum ein
   Befund und kein übersprungener Testfall
5. **Kontrast** — zweite Schwelle, und der mitkorrigierte Nulltoken-Fehler aus D.3
6. **Fußzone** — was jetzt gerendert wird und was unverändert blieb
7. **Evidenz** — die tatsächlich gemessenen Zahlen aus Step 1, keine übernommenen Planwerte
8. **Nicht in diesem Slice** — Subsetting, weitere Schnitte, Mehrzeiligkeit, Text auf Pfad
9. **Nächster Schritt** — D.3 nimmt im Worktree `anhang-j-d3` wieder auf; die 16 typografischen
   Darstellungen sind jetzt baubar

- [ ] **Step 4: README aktualisieren**

Quellenzahl und, falls dort eine Primitivliste steht, die siebte Art.

- [ ] **Step 5: Commit**

```bash
rtk git add docs README.md
rtk git commit -m "docs: Entscheidungsnotiz zu Textprimitiv und Fußzone"
```

- [ ] **Step 6: Abschluss**

Nutze `superpowers:finishing-a-development-branch`.

---

## Self-Review des Plans

**Spec-Abdeckung:**

| Spec-Abschnitt | Task |
|---|---|
| 1 Zweck | Global Constraints |
| 2 Zwei Konsumenten | Task 3 (Primitiv), Task 8 (Fußzone) — getrennte Gates gewahrt |
| 3.1 Warum eine Datei | Task 2 |
| 3.2 Arimo, Lizenz, Herkunft | Task 2 Steps 1–2, 7 |
| 3.3 Nicht im Slice | Global Constraints, Task 10 Step 3 |
| 4 Box kehrt um | Task 4 Step 4, Task 5 Steps 3–5 |
| 5 Form des Primitivs | Task 3 Step 3 |
| 6 Mindestgröße | Task 6 vollständig |
| 7 Kontrast | Task 7 vollständig |
| 8 Determinismus | Task 2 Step 3, Task 9 vollständig |
| 9 Fußzone | Task 8 vollständig |
| 10 Architektur | Dateistruktur |
| 11 Verifikation | Task 10 Step 1 |
| 12 Nicht im Slice | Task 10 Step 3 |

**Typkonsistenz:** `TEXT_FONT_PATH`, `TEXT_FONT_SHA256`, `TEXT_FONT_FAMILY`, `resvgFontOptions()`
(Task 2) werden in Task 9 unverändert benutzt. `TEXT_FONT_FAMILY_ATTR`, `baselineAttr`,
`MINIMUM_TEXT_RENDER_PX`, `effectiveTextPx` (Tasks 4, 6) sind in `text-policy.ts` beisammen.
`boxMm` heißt überall `boxMm` und nie `box` — `box` ist die Piktogrammbox der Definition, `boxMm`
die des Textprimitivs. Diese Unterscheidung ist beabsichtigt und muss durchgehalten werden.

**Zahlenkette:** Einträge bleiben bei 181. Quellen 12 → 13 in Task 2. Offene Fachreviews
194 → 195 in Task 2, danach unverändert.

**Bekannte Grenze des Plans:** Task 6 Step 1 verlangt eine visuelle Entscheidung über die
Lesbarkeitsschwelle, die der Plan nicht vorwegnimmt. Das ist beabsichtigt — eine geratene Schwelle
wäre schlechter als eine gesehene, und die Messreihe liefert die Datengrundlage dafür.
