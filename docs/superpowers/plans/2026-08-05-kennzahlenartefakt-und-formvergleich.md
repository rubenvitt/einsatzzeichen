# Kennzahlenartefakt und Formvergleich — Implementierungsplan (KANDIDAT)

> ## ⚠ Status: Kandidat, nicht freigegeben — nicht als nächstes ausführen
>
> Dieser Plan ist **nicht** der nächste Slice. Er entstand aus einer Vermessung des
> Referenzbestands, bevor bekannt war, dass die Slice-Reihenfolge schon anders belegt ist.
> Der verbindliche Stand:
>
> | Slice | Inhalt | Stand |
> |---|---|---|
> | **2** | Provenienz-Fundament (`specs/2026-08-05-provenienz-fundament-design.md`, freigegeben) | **in Arbeit** auf Branch `worktree-provenienz-fundament`, Tasks 1–7 fertig, Task 8 offen |
> | **3** | Piktogramme und Katalogausbau, Teilprojekt D mit D.0–D.5 (`specs/2026-08-05-piktogramme-und-katalogausbau-design.md`) | Spec vorhanden |
> | *dieser Plan* | Extraktor- und Gate-Härtung | **Kandidat**, braucht eine eigene Spec-Entscheidung |
>
> **Zwei Überschneidungen müssen vor einer Freigabe aufgelöst werden:**
>
> 1. **Task 11 (`1.13 Ereignis`) ist ausdrücklicher Nicht-Umfang von Slice 2** — die
>    Provenienz-Spec schließt „Katalogausbau jeder Art, insbesondere die sechs fehlenden
>    Grundzeichen und das `1.13`-Gate" aus. In einem späteren Slice ist er zulässig, hier steht
>    er nur, weil die Messung ihn trägt.
> 2. **Die Slice-3-Spec löst das Kurvenproblem anders** — über deklarierte Hüllboxen,
>    Platzierung per `translate` und Bildideen aus dem Upstream `phjardas/taktische-zeichen`,
>    nicht über eigene Kurvenautorenschaft. Wo dieser Plan Kurven berührt (Task 5), ist er mit
>    D.0 abzugleichen; die Slice-3-Spec nennt `parseRectilinearPath` selbst als „für Kurven
>    ungeeignet".
>
> **Wofür dieser Plan unabhängig davon taugt:** Die Slice-3-Spec verlangt in ihrer
> Reihenfolgeregel 2 ausdrücklich **Gate-Härtung vor D.1**. Die Tasks 1–10 hier sind genau das,
> nur an anderen Gates als den dort genannten (Mehrgrößen, Druck, A11y-Kontrast). Die Messwerte
> dieses Plans stehen zusätzlich dauerhaft in
> `docs/decisions/2026-08-05-vermessung-kapitel-1-und-verwaltungsstufen.md`.

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Das Rechenschaftsartefakt `fingerprints.json` verschweigt keine vermessbare Geometrie mehr, das Fingerprint-Gate vergleicht Formen statt nur Hüllen, und der Katalog wächst um jeden Eintrag, den diese Schärfung belegbar macht.

**Architecture:** Drei Schichten in dieser Reihenfolge, weil jede die nächste erst möglich macht. (1) Die Vertrauensgrenze zum Generat wird dicht: ein Erzeugerstempel im Artefakt und eine Strukturprüfung beim Einlesen, damit eine Änderung am Extraktor nicht still gegen veraltete Zahlen grün bleibt. (2) Der Extraktor lernt drei Dinge: exakte Hüllen für Kurvenpfade, eine Hülle je Teilpfad statt einer Sammelhülle, und die Kennzahlenart `centerline` — eine Mittellinie samt Eckpunkten, aus einem in Fläche umgewandelten Strich zurückgerechnet. (3) Das Gate vergleicht Eckpunkte, wo die gewählte Form sie trägt, und der Katalog nimmt `1.13 Ereignis` auf.

**Tech Stack:** TypeScript 5.9 (strict), Vitest 3.2, pnpm 11.20 Workspaces, node 24. Keine neuen Laufzeitabhängigkeiten; `oxlint` kommt als reine devDependency hinzu.

## Global Constraints

Diese Abschnitte gelten für **jeden** Task, auch wenn der Tasktext sie nicht wiederholt.

- **Keine Referenz-Bytes im Repository.** Keine Pfaddaten, keine Koordinaten und keine Datei aus `taktische-zeichen/` werden übernommen oder eingecheckt (ungeklärte Lizenzlage, siehe `.gitignore`). Erlaubt und ausdrücklich gewollt sind **abgeleitete Kennzahlen**: Millimeterwerte, Hüllen, Strichstärken, Dateinamen, Layer-Kennungen. Testeingaben werden aus Millimeter-Sollwerten **konstruiert**, nicht aus Referenzdateien kopiert.
- **Millimeter-Regel.** Alle Längen in IR und Katalog sind Millimeter; die Umrechnung nach SVG-Einheiten geschieht ausschließlich im Renderer. `1 mm = 72 / 25.4` Einheiten, immer als Ausdruck (`mmToUnits`), nie gerundet hart eingetragen. Ausnahme wie bisher: `SubpathBounds` und `Ring` in `packages/cli/src/scan/path-geometry.ts` tragen SVG-Einheiten.
- **Vergleichstoleranz 0,01 SVG-Einheiten** (`TOLERANCE_UNITS` aus `@einsatzzeichen/schema`).
- **Kein `as <Typ>`, kein `!` (non-null assertion).** Prüfen statt behaupten. `as const` und `satisfies` sind erlaubt.
- **`@einsatzzeichen/schema` und `@einsatzzeichen/core` bleiben ohne Laufzeitabhängigkeiten.** `core` hängt nie von `catalog` ab.
- **CI läuft ohne Referenzbestand grün.** `pnpm typecheck` und `pnpm test` dürfen `taktische-zeichen/` nicht brauchen.
- **An vermessener Geometrie wird nie gedreht, um einen Test zu bestehen.** Unbelegte Geometrie kommt nicht in den Katalog. Trägt die Messung einen Umfang nicht, schrumpft der Umfang — nicht die Messung.
- **Jeder Test braucht mindestens eine Zusicherung, deren Erwartungswert aus einem Import des geprüften Moduls stammt.** `vitest run` läuft ohne `--typecheck`; ein Test, der ein Objektliteral baut und die selbst hineingeschriebenen Werte zurückliest, sichert zur Laufzeit nichts zu.
- **CLI-Aufruf aus dem Repo-Root, ohne `--`-Separator:** `pnpm cli audit:reference`, nicht `pnpm cli -- audit:reference`.
- **Commit-Sprache Deutsch**, Conventional-Commits-Präfix (`feat:`, `fix:`, `chore:`, `docs:`, `refactor:`, `test:`).
- **Temporäre Dateien in das Scratchpad-Verzeichnis der Sitzung**, nie nach `/tmp` und nie ins Repo. Die Kommandos unten schreiben nach `$SCRATCH`; vor dem ersten Gebrauch einmal setzen, z. B. `set -x SCRATCH <scratchpad-pfad-dieser-sitzung>` (fish) bzw. `export SCRATCH=…` (bash). Kein `$SCRATCH`-Pfad darf in einem Commit landen.

---

## Spec-Bezug und ein Befund, der die Spec selbst betrifft

Dieser Plan hat **keine eigene Spec** — siehe den Statuskasten oben. Er ist **nicht** die D-Spec: Teilprojekt D ist inzwischen durch `docs/superpowers/specs/2026-08-05-piktogramme-und-katalogausbau-design.md` abgedeckt, Teilprojekt A durch die Provenienz-Spec. Was hier steht, ist die **Vermessung des Referenzbestands** und die Task-Struktur, die sie trägt; die Freigabeentscheidung fehlt.

Der Befund unten betrifft die **Slice-1-Spec** (`2026-08-04-einsatzzeichen-core-slice-design.md`, Abschnitt 9) und gilt unabhängig davon, ob dieser Plan je ausgeführt wird.

### Der Befund: die Begründung der Spec für Kapitel 1–3 ist in Teilen sachlich falsch

Spec-Abschnitt 9 („Treue-Entscheidung: hybrid") verlangt für Kapitel 1–3 **Geometrietreue, maschinell per Fingerprint geprüft**, und begründet das so: „Kapitel 1–3 sind Rechtecke, Kreise und Geraden auf einem Millimeterraster — exakt zu treffen ist dort billig."

Das trifft für neun der vierzehn Grundzeichen zu. Für die übrigen fünf und für den größten Teil von Kapitel 3 ist es **falsch**, und zwar nachgemessen:

| Datei | Was die Referenz zeichnet | Folge |
|---|---|---|
| `1.3 Landfahrzeug` | Rechteck, dessen Oberkante eine Bezierkurve ist (Scheitel `(16\|8)`, Ecken `(1\|5,75)`/`(31\|5,75)`) | Form nur mit eigenen Kurven autorierbar |
| `1.4 Luftfahrzeug` | Kurvenkontur, Mittellinienhülle `1/8/31/23` glatt | Hülle belegbar, Form nicht |
| `1.5 Wasserfahrzeug` | Kurvenkontur, Mittellinienhülle `1/9/31/24` glatt | Hülle belegbar, Form nicht |
| `1.9 Gebiet` | freie Kontur, Extrema `1,52/3,23/31/28,322` — **keine glatten Entwurfsmaße** | weder Hülle noch Form belegbar |
| `1.14 Spontanhelfer` | achtpunktige Kurvenrosette, Mittellinienhülle `2/2/30/30` | Hülle belegbar, Form nicht |
| Kapitel 3 (`3.1`, `3.3`, `3.9`) | graue Flächen mit Extrema wie `0,8/5,8/31,2/8,2` bzw. `1,837/1,671/30,162/14,19` | keine glatten Entwurfsmaße |

**Konsequenz:** Erfolgskriterium 1 der Spec („Alle Grundelemente aus Kapitel 1–3 sind als Katalogeinträge modelliert und bestehen den Fingerprint-Gate") ist **durch Vermessung nicht schließbar.** Wer es schließen will, muss für diese Zeichen eigene Kurven autorieren und gegen die vermessene Mittellinienhülle gaten — das ist eine Aufweichung der Treue-Entscheidung für Kapitel 1 und gehört in eine eigene Spec mit eigener Entscheidung. **Dieser Plan tut das nicht.** Er holt den einen Eintrag, den die Messung trägt (`1.13 Ereignis`, ein Polyzug mit drei glatten Ecken), und dokumentiert den Rest belastbar.

### Die eine Begründungslinie für die Extraktor-Tasks

Tasks 5, 6 und 8 erweitern den Extraktor, ohne dass ein Katalogeintrag jede neue Zahl konsumiert. Die Rechtfertigung ist für alle drei **dieselbe und gilt einheitlich**:

> **Das Rechenschaftsartefakt darf keine vermessbare Geometrie verschweigen.**

Heute tut es das dreifach: 138 von 661 Dateien tragen `shapes: []`, obwohl ihre Kurven exakt vermessbar sind (Task 5); ein Pfad aus n Teilpfaden kollabiert zu **einer** Sammelhülle, die keinen seiner Teilpfade beschreibt (Task 6); und ein in Fläche umgewandelter Strich wird als Füllfläche geführt (Tasks 7 und 8). Jede dieser Stillen ist von derselben Art wie der Kapitel-3-Anspruch, den Ruling 21 aus dem Manifest-Scope entfernt hat: eine Aussage im Artefakt, die nicht stimmt. Das ist **kein** YAGNI-Argument über künftige Konsumenten — die Korrektheit des Artefakts ist der Zweck.

### Was dieser Plan ausdrücklich nicht umfasst

- **`5.1.1` Fahrzeugkategorien und `5.7` Verwaltungsstufen als Katalogeinträge.** Task 6 macht ihre Kennzahlen erstmals vermessbar (Task 13 hält das Sternmodell fest), aber ein Eintrag braucht einen Konsumenten in `CatalogPorts` und der Kopfzone von `compose()` — eigene Spec, eigener Plan.
- **Die fünf Kurven-Grundzeichen und Kapitel 3** — siehe Befund oben.
- **Kapitel 2 als Katalogeinträge** (`2.17`–`2.20` Grenzen brauchen ein Schemakonzept für Linien- und Flächengrenzen), **Kapitel 4** (92 Piktogramme, laut Spec-Abschnitt 9 ohnehin eigenständig gezeichnet), **Teilprojekte E und F**.

---

## Dateistruktur

| Datei | Verantwortung | Task |
|---|---|---|
| `tsconfig.json` | zwei zusätzliche Compilerflags | 1 |
| `packages/cli/src/scan/extract.ts` | Fehlerstelle unter `noUncheckedIndexedAccess`; Polygon-/Circle-Einordnung; neue Formarten einhängen | 1, 6, 7, 8 |
| `packages/schema/src/provenance.test.ts` | Fehlerstelle unter `noUncheckedIndexedAccess` | 1 |
| `.oxlintrc.json` | Lint-Regeln gegen `as <Typ>` und `!` | 2 |
| `package.json` | `lint`-Skript, devDependency `oxlint` | 2 |
| `packages/cli/src/scan/version.ts` | **neu** — `EXTRACTOR_VERSION`, die einzige Wahrheit über die Artefaktform | 3 |
| `packages/cli/src/commands/audit-reference.ts` | Erzeugerstempel ins Artefakt schreiben | 3 |
| `packages/catalog/src/fingerprint-index.ts` | Stempel prüfen; Binnenstruktur der `shapes` prüfen | 3, 4 |
| `packages/cli/src/scan/path-geometry.ts` | Kurvenkommandos `C/c/S/s` exakt vermessen; `centerline`-Ableitung | 5, 8 |
| `packages/cli/src/scan/path-geometry.test.ts` | Tests dazu | 5, 8 |
| `packages/cli/src/scan/extract.test.ts` | Tests zur Einordnung | 6, 7, 8 |
| `packages/catalog/src/fingerprints.json` | Generat, neu erzeugt | 9 |
| `packages/core/src/fingerprint.ts` | `PRECEDENCE` um `centerline`; Eckpunktvergleich | 8, 10 |
| `packages/core/src/fingerprint.test.ts` | Tests dazu | 8, 10 |
| `packages/catalog/src/base-symbols.ts` | `event` als neunter Eintrag | 11 |
| `packages/catalog/src/base-symbols.test.ts` | `event` in `REFERENCE` | 11 |
| `packages/schema/src/coverage.ts` | `VariantSlot`, `CoverageManifest.variants` | 12 |
| `packages/catalog/src/variants.ts` | **neu** — die 31 deklarierten Variantendateien | 12 |
| `packages/catalog/src/variants.test.ts` | **neu** — Gate: Deklaration deckt das Artefakt | 12 |
| `packages/catalog/src/coverage-manifest.ts` | `variants` ins Manifest, `checkCoverage` erweitern | 12 |
| `docs/decisions/2026-08-05-…` | **neu** — Messwerte und Umfangsbegründung dieses Slice | 13 |

---

## Task 1: Typschärfung — `noUncheckedIndexedAccess` und `exactOptionalPropertyTypes`

Nacharbeit **I-5** aus dem Abschlussreview des Vorgänger-Slice: „Der Code ist bereits fast konform — die Wachen sind da, aber typseitig wirkungslos. Billigste Typsicherheitsverbesserung, die zu haben ist, und die Nachrüstung wird mit jeder Datei teurer." Vorab gemessen: **genau drei Fehler** an zwei Stellen.

**Files:**
- Modify: `tsconfig.json:5` (nach `"strict": true`)
- Modify: `packages/cli/src/scan/extract.ts:204-211`
- Modify: `packages/schema/src/provenance.test.ts:47`

**Interfaces:**
- Consumes: nichts
- Produces: nichts (reine Verschärfung; alle folgenden Tasks arbeiten unter diesen Flags)

- [ ] **Step 1: Flags setzen**

In `tsconfig.json` die beiden Zeilen direkt nach `"strict": true,` ergänzen:

```json
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
```

- [ ] **Step 2: Typprüfung laufen lassen und die drei Fehler sehen**

Run: `pnpm typecheck`

Expected: FAIL mit genau drei Fehlern:
```
packages/cli/src/scan/extract.ts(210,20): error TS2322: Type 'number | undefined' is not assignable to type 'number'.
packages/cli/src/scan/extract.ts(210,23): error TS2322: Type 'number | undefined' is not assignable to type 'number'.
packages/schema/src/provenance.test.ts(47,44): error TS2532: Object is possibly 'undefined'.
```

Tauchen mehr oder andere Fehler auf: **nicht wegcasten.** Jeder zusätzliche Fehler ist eine echte, bisher typseitig unsichtbare Lücke — einzeln mit einer Prüfung schließen, nicht mit `as` oder `!` (Global Constraint).

- [ ] **Step 3: `extract.ts` — die Indexzugriffe prüfen statt behaupten**

Die Polygon-Schleife liest `raw[i]` und `raw[i + 1]` und übergibt sie an `Number.isFinite`. Unter `noUncheckedIndexedAccess` sind beide `number | undefined`. Die vorhandene `Number.isFinite`-Wache **ist** die richtige Prüfung, sie muss nur vor dem Tupel-Aufbau greifen. Ersetze in `packages/cli/src/scan/extract.ts` den Schleifenkörper:

```ts
    for (let i = 0; i + 1 < raw.length; i += 2) {
      const x = raw[i];
      const y = raw[i + 1];
      if (x === undefined || y === undefined) continue;
      if (!Number.isFinite(x) || !Number.isFinite(y)) continue;
      points.push([x, y] as const);
    }
```

- [ ] **Step 4: `provenance.test.ts` — die Depiction prüfen statt behaupten**

Zeile 47 greift auf ein Arrayelement zu, das jetzt `| undefined` ist. Statt eines `!` eine sprechende Wache davor setzen (das Muster, das `base-symbols.test.ts:35` schon verwendet):

```ts
  const [depiction] = entry.depictions;
  if (depiction === undefined) throw new Error('Testeintrag enthält keine Depiction.');
```

und die Folgezeile auf `depiction` statt auf den Indexzugriff beziehen.

- [ ] **Step 5: Typprüfung und Tests grün**

Run: `pnpm typecheck && pnpm test`
Expected: typecheck ohne Ausgabe, `164 passed (164)`

- [ ] **Step 6: Commit**

```bash
git add tsconfig.json packages/cli/src/scan/extract.ts packages/schema/src/provenance.test.ts
git commit -m "chore: noUncheckedIndexedAccess und exactOptionalPropertyTypes aktivieren"
```

---

## Task 2: Lint-Regel gegen `as <Typ>` und `!`

Der Abschlussreview fand **fünf** Verstöße gegen „kein `as`, kein `!`", von denen zwei echte Prüfungen verdeckten und einer einen `NaN`-Pfad offen ließ (`Math.abs(NaN) > 0.01` ist `false` — der Vergleich bestand still). Empfehlung des Reviews: „Lint-Werkzeug mit einer Regel gegen `as`/`!` würde die C-2-Klasse dauerhaft ausschließen." `oxlint` braucht keine TypeScript-Programminstanz, läuft in Millisekunden und kommt als einzelne devDependency.

**Files:**
- Create: `.oxlintrc.json`
- Modify: `package.json` (Skript `lint`, devDependency `oxlint`)

**Interfaces:**
- Consumes: nichts
- Produces: `pnpm lint` — schlägt fehl, sobald ein `as <Typ>` oder `!` im Quellcode auftaucht

- [ ] **Step 1: oxlint als devDependency**

```bash
pnpm add -Dw oxlint@^1.42.0
```

- [ ] **Step 2: Regelwerk anlegen**

`.oxlintrc.json`:

```json
{
  "$schema": "./node_modules/oxlint/configuration_schema.json",
  "plugins": ["typescript"],
  "categories": {},
  "rules": {
    "typescript/no-non-null-assertion": "error",
    "typescript/consistent-type-assertions": [
      "error",
      { "assertionStyle": "never" }
    ]
  },
  "ignorePatterns": ["node_modules", "taktische-zeichen", "**/*.json"]
}
```

`assertionStyle: "never"` verbietet `x as T` **und** `<T>x`, lässt `as const` und `satisfies` in Ruhe — genau die Grenze, die die Global Constraint zieht.

- [ ] **Step 3: Skript ergänzen**

In `package.json` unter `"scripts"`:

```json
    "lint": "oxlint --config .oxlintrc.json packages",
```

- [ ] **Step 4: Lint laufen lassen — muss auf dem Bestand grün sein**

Run: `pnpm lint`
Expected: `Found 0 warnings and 0 errors.`

Schlägt es an: Die Fundstelle ist ein echter Verstoß, den der Abschlussreview übersehen hat. Mit einer Prüfung schließen (nicht mit einer Ausnahme in der Konfiguration) und im Commit erwähnen.

- [ ] **Step 5: Falsifikationsnachweis — die Regel greift wirklich**

Vorübergehend in `packages/schema/src/units.ts` am Dateiende einfügen:

```ts
const probe = (0 as unknown) as string;
void probe;
```

Run: `pnpm lint`
Expected: FAIL mit `typescript/consistent-type-assertions`

Danach die zwei Zeilen wieder entfernen und `pnpm lint` erneut grün sehen. Ohne diesen Nachweis ist nicht belegt, dass die Konfiguration überhaupt gelesen wird.

- [ ] **Step 6: Commit**

```bash
git add .oxlintrc.json package.json pnpm-lock.yaml
git commit -m "chore: Lint-Regel gegen Typzusicherungen und non-null-Assertions"
```

---

## Task 3: Erzeugerstempel im Artefakt (I-1)

Nacharbeit **I-1**, vom Abschlussreview als „dritte strukturelle Gate-Lücke" eingeordnet: Ändert jemand `extract.ts` oder `path-geometry.ts` ohne `audit:reference` neu zu laufen, bleiben alle Gates grün gegen veraltete Zahlen. Die Projekthistorie ist der Beweis — Ruling 16 musste das Artefakt **per Disziplin** neu erzeugen, kein Gate erzwang es. Dieser Task muss **vor** den Extraktor-Tasks 5–8 liegen, damit die Prüfung steht, wenn sich die Artefaktform tatsächlich ändert.

**Files:**
- Create: `packages/cli/src/scan/version.ts`
- Modify: `packages/cli/src/commands/audit-reference.ts`
- Modify: `packages/catalog/src/fingerprint-index.ts`
- Test: `packages/catalog/src/fingerprint-index.test.ts` (neu)

**Interfaces:**
- Consumes: `Fingerprint` aus `packages/cli/src/scan/extract.ts`
- Produces:
  - `EXTRACTOR_VERSION: number` aus `packages/cli/src/scan/version.ts`
  - Artefaktform wechselt von `Fingerprint[]` zu `{ extractorVersion: number; entries: Fingerprint[] }`
  - `assertFingerprints(value: unknown): FingerprintLike[]` in `fingerprint-index.ts` liest jetzt die Hüllenform und prüft den Stempel

- [ ] **Step 1: Den Test schreiben, der den Stempel erzwingt**

`packages/catalog/src/fingerprint-index.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { fingerprintFor, ARTIFACT_EXTRACTOR_VERSION } from './fingerprint-index.js';
import fingerprints from './fingerprints.json' with { type: 'json' };

describe('Kennzahlenartefakt', () => {
  it('trägt die Erzeugerversion, die der Leser erwartet', () => {
    // Erwartungswert aus dem Import des geprüften Moduls, nicht aus einem Literal.
    const raw: unknown = fingerprints;
    if (typeof raw !== 'object' || raw === null || !('extractorVersion' in raw)) {
      throw new Error('fingerprints.json trägt kein Feld "extractorVersion".');
    }
    expect(raw.extractorVersion).toBe(ARTIFACT_EXTRACTOR_VERSION);
  });

  it('liefert die Kennzahlen zu einem bekannten Asset', () => {
    const fp = fingerprintFor('1.1_Taktische Formation.svg');
    expect(fp.asset).toBe('1.1_Taktische Formation.svg');
    expect(fp.shapes.length).toBeGreaterThan(0);
  });

  it('nennt bei unbekanntem Asset das Erzeugungskommando', () => {
    expect(() => fingerprintFor('gibt-es-nicht.svg')).toThrow(/audit:reference/);
  });
});
```

- [ ] **Step 2: Test laufen lassen, Fehlschlag sehen**

Run: `pnpm vitest run packages/catalog/src/fingerprint-index.test.ts`
Expected: FAIL — `ARTIFACT_EXTRACTOR_VERSION` ist kein Export von `./fingerprint-index.js`

- [ ] **Step 3: Die Version als eigenes Modul**

`packages/cli/src/scan/version.ts`:

```ts
/**
 * Formversion des Kennzahlenartefakts `packages/catalog/src/fingerprints.json`.
 *
 * **Bei jeder Änderung an `extract.ts` oder `path-geometry.ts`, die andere Zahlen oder
 * andere Formarten erzeugt, um eins erhöhen.** Der Leser (`packages/catalog/src/
 * fingerprint-index.ts`) vergleicht gegen seine eigene Konstante und wirft bei Abweichung.
 * Damit kann ein geänderter Extraktor nicht still gegen ein veraltetes Artefakt grün bleiben —
 * genau der Fehlermodus, den Ruling 16 nur per Disziplin vermieden hat.
 */
export const EXTRACTOR_VERSION = 2;
```

- [ ] **Step 4: Das CLI schreibt die Hüllenform**

In `packages/cli/src/commands/audit-reference.ts` den Import ergänzen:

```ts
import { EXTRACTOR_VERSION } from '../scan/version.js';
```

Die Rückgabe der Funktion bleibt `Fingerprint[]` (Aufrufer sollen die Einträge bekommen, nicht die Hülle). Geändert wird nur, **was serialisiert wird** — die Zeilen 44–51 werden zu:

```ts
  // Was ausgegeben wird, ist genau das, was geschrieben würde: sonst zeigt --print eine
  // andere Struktur als die Datei trägt, und ein Vergleich der beiden führt in die Irre.
  const artifact = { extractorVersion: EXTRACTOR_VERSION, entries: fingerprints };

  if (options.print === true) {
    console.log(JSON.stringify(artifact, null, 2));
    return fingerprints;
  }

  writeFileSync(OUTPUT, `${JSON.stringify(artifact, null, 2)}\n`, 'utf8');
  console.log(`${fingerprints.length} Kennzahlensätze nach ${OUTPUT} geschrieben.`);
  return fingerprints;
```

- [ ] **Step 5: Der Leser prüft den Stempel**

`packages/catalog/src/fingerprint-index.ts` — die Hüllenform auspacken und den Stempel prüfen. Vollständig ersetzter Kopf der Datei:

```ts
import type { FingerprintLike } from '@einsatzzeichen/core';
import fingerprints from './fingerprints.json' with { type: 'json' };

/**
 * Formversion, die dieser Leser versteht. Muss mit `EXTRACTOR_VERSION` in
 * `packages/cli/src/scan/version.ts` übereinstimmen. Bewusst hier dupliziert und nicht
 * importiert: `catalog` darf nicht von `cli` abhängen (Abhängigkeitsrichtung
 * cli → catalog → core → schema). Der Test unten hält beide Zahlen zusammen.
 */
export const ARTIFACT_EXTRACTOR_VERSION = 2;

function isFingerprintLike(value: unknown): value is FingerprintLike {
  if (typeof value !== 'object' || value === null) return false;
  if (!('asset' in value) || !('shapes' in value)) return false;
  return typeof value.asset === 'string' && Array.isArray(value.shapes);
}

function assertFingerprints(value: unknown): FingerprintLike[] {
  if (typeof value !== 'object' || value === null) {
    throw new Error(
      'packages/catalog/src/fingerprints.json ist kein Objekt. Mit "pnpm cli audit:reference" neu erzeugen.',
    );
  }
  if (!('extractorVersion' in value) || typeof value.extractorVersion !== 'number') {
    throw new Error(
      'packages/catalog/src/fingerprints.json trägt keine numerische "extractorVersion". ' +
        'Mit "pnpm cli audit:reference" neu erzeugen.',
    );
  }
  if (value.extractorVersion !== ARTIFACT_EXTRACTOR_VERSION) {
    throw new Error(
      `packages/catalog/src/fingerprints.json wurde mit Extraktorversion ${value.extractorVersion} ` +
        `erzeugt, dieser Leser erwartet ${ARTIFACT_EXTRACTOR_VERSION}. ` +
        'Mit "pnpm cli audit:reference" neu erzeugen.',
    );
  }
  if (!('entries' in value) || !Array.isArray(value.entries) || !value.entries.every(isFingerprintLike)) {
    throw new Error(
      'packages/catalog/src/fingerprints.json hat kein "entries"-Array von Einträgen mit ' +
        '"asset": string und "shapes": Array. Mit "pnpm cli audit:reference" neu erzeugen.',
    );
  }
  return value.entries;
}
```

Der Rest der Datei (`const raw`, `index`, `fingerprintFor`) bleibt unverändert.

- [ ] **Step 6: Artefakt neu erzeugen**

Run: `pnpm cli audit:reference`
Expected: schreibt `packages/catalog/src/fingerprints.json` mit `"extractorVersion": 2` als erstem Feld und `"entries"` darunter.

Prüfen, dass sich **inhaltlich** nichts geändert hat — nur die Hülle:

```bash
node -e 'const a=require("./packages/catalog/src/fingerprints.json"); console.log(a.extractorVersion, a.entries.length)'
```
Expected: `2 661`

- [ ] **Step 7: Alles grün**

Run: `pnpm typecheck && pnpm lint && pnpm test`
Expected: `167 passed (167)` (164 + die drei neuen)

- [ ] **Step 8: Falsifikationsnachweis — der Stempel greift**

`ARTIFACT_EXTRACTOR_VERSION` vorübergehend auf `99` setzen.
Run: `pnpm vitest run packages/catalog`
Expected: FAIL mit „wurde mit Extraktorversion 2 erzeugt, dieser Leser erwartet 99"
Danach zurück auf `2` und erneut grün.

- [ ] **Step 9: Commit**

```bash
git add packages/cli/src/scan/version.ts packages/cli/src/commands/audit-reference.ts \
        packages/catalog/src/fingerprint-index.ts packages/catalog/src/fingerprint-index.test.ts \
        packages/catalog/src/fingerprints.json
git commit -m "feat: Erzeugerstempel im Kennzahlenartefakt verhindert stille Veralterung"
```

---

## Task 4: `isFingerprintLike` prüft die Binnenstruktur

Adjudizierter Restbefund des Abschlussreviews, geparkt mit der Begründung „gehört sachlich zu I-1 — beide betreffen die Vertrauensgrenze zum Generat und sollten gemeinsam angefasst werden". Heute prüft die Wache je Eintrag nur `asset: string` und `shapes: Array`, nicht die Binnenstruktur der `shapes`. Ein strukturell korruptes Generat passiert die Wache und fällt später mit einem rohen `TypeError` auf statt mit der klaren, auf `audit:reference` verweisenden Meldung.

**Files:**
- Modify: `packages/catalog/src/fingerprint-index.ts`
- Test: `packages/catalog/src/fingerprint-index.test.ts`

**Interfaces:**
- Consumes: `ARTIFACT_EXTRACTOR_VERSION`, `assertFingerprints` aus Task 3
- Produces: `assertFingerprints` lehnt Einträge mit fehlerhafter `shapes`-Binnenstruktur ab

- [ ] **Step 1: Den Test schreiben**

Die Wache ist modulprivat, geprüft wird sie deshalb über einen exportierten Prüfer. In `fingerprint-index.ts` zunächst nur die Signatur vorsehen (Step 3 füllt sie), im Test:

```ts
import { isFingerprintShapeLike } from './fingerprint-index.js';

describe('Strukturprüfung der Kennzahlen', () => {
  it('nimmt eine vollständige Form an', () => {
    expect(
      isFingerprintShapeLike({
        kind: 'ring',
        boundsMm: { minXMm: 1, minYMm: 6, maxXMm: 31, maxYMm: 26 },
      }),
    ).toBe(true);
  });

  it.each([
    ['fehlendes kind', { boundsMm: { minXMm: 1, minYMm: 6, maxXMm: 31, maxYMm: 26 } }],
    ['kind nicht string', { kind: 7, boundsMm: { minXMm: 1, minYMm: 6, maxXMm: 31, maxYMm: 26 } }],
    ['fehlendes boundsMm', { kind: 'ring' }],
    ['boundsMm unvollständig', { kind: 'ring', boundsMm: { minXMm: 1, minYMm: 6, maxXMm: 31 } }],
    ['boundsMm nicht numerisch', { kind: 'ring', boundsMm: { minXMm: '1', minYMm: 6, maxXMm: 31, maxYMm: 26 } }],
    ['boundsMm mit NaN', { kind: 'ring', boundsMm: { minXMm: Number.NaN, minYMm: 6, maxXMm: 31, maxYMm: 26 } }],
  ])('lehnt ab: %s', (_name, shape) => {
    expect(isFingerprintShapeLike(shape)).toBe(false);
  });

  it('prüft die Formen jedes echten Artefakteintrags', () => {
    // Zusicherung gegen das importierte Modul: jede Form im committeten Artefakt
    // muss die Wache passieren, sonst ist die Wache zu streng gebaut.
    const fp = fingerprintFor('1.7_Gebäude.svg');
    expect(fp.shapes.length).toBeGreaterThan(0);
    for (const shape of fp.shapes) expect(isFingerprintShapeLike(shape)).toBe(true);
  });
});
```

- [ ] **Step 2: Test laufen lassen, Fehlschlag sehen**

Run: `pnpm vitest run packages/catalog/src/fingerprint-index.test.ts`
Expected: FAIL — `isFingerprintShapeLike` ist kein Export

- [ ] **Step 3: Die Wache implementieren**

In `packages/catalog/src/fingerprint-index.ts`, oberhalb von `isFingerprintLike`:

```ts
const BOUNDS_KEYS = ['minXMm', 'minYMm', 'maxXMm', 'maxYMm'] as const;

/**
 * Prüft eine einzelne Form aus dem Generat. `Number.isFinite` statt `typeof === 'number'`,
 * weil `NaN` sonst durchkäme — und ein `NaN` im Hüllenvergleich besteht still: der Ausdruck
 * `Math.abs(NaN) > TOLERANCE_UNITS` ist `false`, der Vergleich melde also „passt".
 */
export function isFingerprintShapeLike(value: unknown): boolean {
  if (typeof value !== 'object' || value === null) return false;
  if (!('kind' in value) || typeof value.kind !== 'string') return false;
  if (!('boundsMm' in value)) return false;
  const bounds: unknown = value.boundsMm;
  if (typeof bounds !== 'object' || bounds === null) return false;
  for (const key of BOUNDS_KEYS) {
    if (!(key in bounds)) return false;
    const raw: unknown = Reflect.get(bounds, key);
    if (typeof raw !== 'number' || !Number.isFinite(raw)) return false;
  }
  return true;
}
```

Und `isFingerprintLike` um die Binnenprüfung erweitern — die letzte Zeile wird:

```ts
  if (typeof value.asset !== 'string' || !Array.isArray(value.shapes)) return false;
  return value.shapes.every(isFingerprintShapeLike);
```

- [ ] **Step 4: Tests grün**

Run: `pnpm typecheck && pnpm lint && pnpm test`
Expected: `174 passed (174)`

- [ ] **Step 5: Falsifikationsnachweis am echten Artefakt**

Belegen, dass die Wache ein korruptes Generat wirklich abweist, **ohne** die committete Datei zu berühren:

```bash
node --input-type=module -e '
import fs from "node:fs";
const a = JSON.parse(fs.readFileSync("packages/catalog/src/fingerprints.json","utf8"));
a.entries[0].shapes[0].boundsMm.minXMm = "keine Zahl";
fs.writeFileSync("$SCRATCH/probe.json", JSON.stringify(a));
console.log("Sonde geschrieben");
'
```
Dann in einer Wegwerf-Testdatei denselben `assertFingerprints`-Pfad gegen die Sonde laufen lassen und die Meldung `hat kein "entries"-Array …` sehen. Sonde und Wegwerfdatei danach löschen.

- [ ] **Step 6: Commit**

```bash
git add packages/catalog/src/fingerprint-index.ts packages/catalog/src/fingerprint-index.test.ts
git commit -m "fix: Strukturprüfung des Kennzahlenartefakts reicht bis in die Formen"
```

---

## Task 5: Kurvenpfade exakt vermessen statt nur zählen

**Begründung:** siehe „Die eine Begründungslinie" oben — 138 von 661 Dateien tragen heute `shapes: []`, obwohl ihre Geometrie exakt vermessbar ist. Ein kubischer Bezier hat seine Extrema an den Nullstellen der Ableitung; das ist geschlossen lösbar, keine Näherung.

Vorab gemessen: Das **Kommando-Alphabet des gesamten Referenzbestands** ist `C H L M S V Z c h l s v` — kubische Kurven und Geraden, **kein `Q`, kein `T`, kein Bogenkommando `A`** (0 von 661 Dateien). `Q`/`T`/`A` werden deshalb nicht implementiert, sondern **abgelehnt** (`null`), damit ein künftiges Referenz-Update nicht still genähert wird.

**Files:**
- Modify: `packages/cli/src/scan/path-geometry.ts`
- Modify: `packages/cli/src/scan/path-geometry.test.ts`
- Modify: `packages/cli/src/scan/extract.ts:224-228`

**Interfaces:**
- Consumes: `TOLERANCE_UNITS` aus `@einsatzzeichen/schema`
- Produces:
  - `SubpathBounds` erhält das Feld `hasCurves: boolean`
  - `parseRectilinearPath` wird zu **`parsePathSubpaths(d: string): SubpathBounds[] | null`** (Umbenennung, weil der alte Name nach dieser Änderung falsch wäre). `null` nur noch bei `Q`/`T`/`A`, bei unbekanntem Kommando und bei nicht-endlichen Zahlen.
  - `deriveRing` bleibt unverändert in Signatur und Wache (`isAxisAlignedRect` ist für Kurven-Teilpfade immer `false`)

- [ ] **Step 1: Die failing tests schreiben**

In `packages/cli/src/scan/path-geometry.test.ts` ergänzen. Alle Eingaben sind **konstruiert**, nicht aus Referenzdateien kopiert (Global Constraint):

```ts
import { parsePathSubpaths } from './path-geometry.js';

describe('parsePathSubpaths — Kurven', () => {
  it('findet das Extremum einer kubischen Kurve zwischen den Endpunkten', () => {
    // Halbkreisähnlicher Bogen von (0|0) nach (10|0), Kontrollpunkte bei y = 6.
    // Das Maximum liegt NICHT bei 6 (Kontrollpunkte werden nicht erreicht), sondern
    // bei B(0.5) = 3/8 · 6 + 3/8 · 6 = 4.5 — genau das unterscheidet eine exakte
    // Hülle von der Kontrollpunkt-Hülle.
    const subpaths = parsePathSubpaths('M0 0 C0 6 10 6 10 0 Z');
    expect(subpaths).not.toBeNull();
    if (subpaths === null) throw new Error('unerwartet null');
    expect(subpaths).toHaveLength(1);
    const [only] = subpaths;
    if (only === undefined) throw new Error('kein Teilpfad');
    expect(only.hasCurves).toBe(true);
    expect(only.isAxisAlignedRect).toBe(false);
    expect(only.minX).toBeCloseTo(0, 3);
    expect(only.maxX).toBeCloseTo(10, 3);
    expect(only.minY).toBeCloseTo(0, 3);
    expect(only.maxY).toBeCloseTo(4.5, 3);
  });

  it('führt die Spiegelung von S korrekt mit', () => {
    // S spiegelt den zweiten Kontrollpunkt des Vorgängers. Nach C0 4 4 4 4 0 liegt
    // der Vorgänger-Kontrollpunkt bei (4|4); die Spiegelung an (4|0) ergibt (4|-4).
    // Ein Parser, der die Spiegelung vergisst, liefft ein anderes maxY/minY.
    const subpaths = parsePathSubpaths('M0 0 C0 4 4 4 4 0 S8 -4 8 0');
    expect(subpaths).not.toBeNull();
    if (subpaths === null) throw new Error('unerwartet null');
    const [only] = subpaths;
    if (only === undefined) throw new Error('kein Teilpfad');
    expect(only.minY).toBeCloseTo(-3, 3);
    expect(only.maxY).toBeCloseTo(3, 3);
  });

  it('lehnt Bogen- und quadratische Kommandos ab statt sie zu nähern', () => {
    expect(parsePathSubpaths('M0 0 A5 5 0 0 1 10 0 Z')).toBeNull();
    expect(parsePathSubpaths('M0 0 Q5 5 10 0 Z')).toBeNull();
    expect(parsePathSubpaths('M0 0 T10 0')).toBeNull();
  });

  it('lässt rein geradlinige Pfade unverändert als achsparallele Rechtecke erkennen', () => {
    const subpaths = parsePathSubpaths('M1 1H11V11H1Z');
    expect(subpaths).not.toBeNull();
    if (subpaths === null) throw new Error('unerwartet null');
    const [only] = subpaths;
    if (only === undefined) throw new Error('kein Teilpfad');
    expect(only.hasCurves).toBe(false);
    expect(only.isAxisAlignedRect).toBe(true);
  });
});
```

- [ ] **Step 2: Tests laufen lassen, Fehlschlag sehen**

Run: `pnpm vitest run packages/cli/src/scan/path-geometry.test.ts`
Expected: FAIL — `parsePathSubpaths` ist kein Export von `./path-geometry.js`

- [ ] **Step 3: Kurvenunterstützung implementieren**

In `packages/cli/src/scan/path-geometry.ts`:

Erstens `SubpathBounds` um das Feld erweitern:

```ts
export interface SubpathBounds {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  isAxisAlignedRect: boolean;
  /** true, wenn dieser Teilpfad mindestens ein Kurvenkommando enthält. */
  hasCurves: boolean;
}
```

Zweitens die Extremwertfunktion ergänzen:

```ts
/**
 * Werte eines kubischen Bezier in einer Achse an den Stellen, die für die Hülle zählen:
 * beide Endpunkte plus die Nullstellen der Ableitung im offenen Intervall (0,1).
 * Geschlossen lösbar, keine Abtastung — die Hülle ist exakt.
 *
 * B'(t) = 3[a·t² + b·t + c] mit a = −p0+3p1−3p2+p3, b = 2(p0−2p1+p2), c = p1−p0
 */
function cubicAxisValues(p0: number, p1: number, p2: number, p3: number): number[] {
  const values = [p0, p3];
  const a = -p0 + 3 * p1 - 3 * p2 + p3;
  const b = 2 * (p0 - 2 * p1 + p2);
  const c = p1 - p0;

  const addAt = (t: number): void => {
    if (!Number.isFinite(t) || t <= 0 || t >= 1) return;
    const u = 1 - t;
    values.push(u * u * u * p0 + 3 * u * u * t * p1 + 3 * u * t * t * p2 + t * t * t * p3);
  };

  if (Math.abs(a) < 1e-12) {
    // Ableitung linear: eine Nullstelle, sofern b nicht auch verschwindet.
    if (Math.abs(b) > 1e-12) addAt(-c / b);
    return values;
  }
  const discriminant = b * b - 4 * a * c;
  if (discriminant < 0) return values;
  const root = Math.sqrt(discriminant);
  addAt((-b + root) / (2 * a));
  addAt((-b - root) / (2 * a));
  return values;
}
```

Drittens `RECTILINEAR` durch eine Menge aller **unterstützten** Kommandos ersetzen und `C/c/S/s` in der Hauptschleife behandeln. Der Cursor führt zusätzlich den letzten Kontrollpunkt und das letzte Kommando mit, damit `S`/`s` spiegeln kann:

```ts
const SUPPORTED = new Set(['M', 'm', 'L', 'l', 'H', 'h', 'V', 'v', 'C', 'c', 'S', 's', 'Z', 'z']);
```

Im Zustand neben `cursor` und `start`:

```ts
  let lastControl: Cursor | null = null;
  let lastWasCubic = false;
  let currentHasCurves = false;
```

`push()` schreibt `hasCurves: currentHasCurves` mit und setzt es auf `false` zurück. Der neue Zweig in der `switch`-Anweisung:

```ts
      case 'C':
      case 'c':
      case 'S':
      case 's': {
        const relative = command === 'c' || command === 's';
        const shorthand = command === 'S' || command === 's';
        let x1: number;
        let y1: number;
        if (shorthand) {
          // Spiegelung des Vorgänger-Kontrollpunkts am aktuellen Punkt. Ohne kubischen
          // Vorgänger ist der Kontrollpunkt laut SVG-Spezifikation der aktuelle Punkt.
          x1 = lastWasCubic && lastControl ? 2 * cursor.x - lastControl.x : cursor.x;
          y1 = lastWasCubic && lastControl ? 2 * cursor.y - lastControl.y : cursor.y;
        } else {
          x1 = relative ? cursor.x + next() : next();
          y1 = relative ? cursor.y + next() : next();
        }
        const x2 = relative ? cursor.x + next() : next();
        const y2 = relative ? cursor.y + next() : next();
        const x3 = relative ? cursor.x + next() : next();
        const y3 = relative ? cursor.y + next() : next();
        if (![x1, y1, x2, y2, x3, y3].every((v) => Number.isFinite(v))) return null;

        if (!current) current = { minX: cursor.x, minY: cursor.y, maxX: cursor.x, maxY: cursor.y };
        for (const value of cubicAxisValues(cursor.x, x1, x2, x3)) {
          current.minX = Math.min(current.minX, value);
          current.maxX = Math.max(current.maxX, value);
        }
        for (const value of cubicAxisValues(cursor.y, y1, y2, y3)) {
          current.minY = Math.min(current.minY, value);
          current.maxY = Math.max(current.maxY, value);
        }

        cursor.x = x3;
        cursor.y = y3;
        lastControl = { x: x2, y: y2 };
        lastWasCubic = true;
        currentHasCurves = true;
        // Eine Kurve ist niemals ein achsparalleles Segment.
        currentAxisAligned = false;
        addDistinctPoint(currentPoints, cursor);
        break;
      }
```

In allen **anderen** Zweigen `lastWasCubic = false;` setzen (sonst spiegelt ein `S` nach einem `L` falsch). Die Funktion umbenennen:

```ts
export function parsePathSubpaths(d: string): SubpathBounds[] | null {
```

Der Kommandotest in der Schleife wird `if (!SUPPORTED.has(token)) return null;` — damit fallen `Q`, `T`, `A` und alles Unbekannte auf `null`.

Und die Dokumentation der Funktion ehrlich halten:

```ts
/**
 * Zerlegt einen Pfad in die exakten Bounding-Boxen seiner Teilpfade. Geraden und kubische
 * Kurven (`C`/`c`/`S`/`s`) werden vermessen; die Kurvenhülle nutzt die Nullstellen der
 * Ableitung und ist deshalb exakt, nicht abgetastet.
 *
 * Gibt `null` zurück bei quadratischen Kurven (`Q`/`T`), Bogenkommandos (`A`) und
 * unbekannten Kommandos. Der Referenzbestand enthält keines davon (Kommando-Alphabet
 * gemessen: `C H L M S V Z c h l s v`, 0 von 661 Dateien mit `A`) — ein künftiges
 * Referenz-Update soll auffallen statt still genähert zu werden.
 */
```

- [ ] **Step 4: Aufrufstelle nachziehen**

In `packages/cli/src/scan/extract.ts` Import und Aufruf umbenennen. Der `curvedPaths`-Zähler **bleibt** und zählt weiter, aber nur noch das, was wirklich nicht vermessbar ist:

```ts
import { deriveRing, parsePathSubpaths, type SubpathBounds } from './path-geometry.js';

// … in der path-Schleife:
    const subpaths = parsePathSubpaths(d);
    if (subpaths === null) {
      curvedPaths += 1;
      continue;
    }
```

Zusätzlich einen Zähler für vermessene Kurvenpfade führen, damit das Artefakt die Unterscheidung trägt. In `Fingerprint` ergänzen:

```ts
export interface Fingerprint {
  asset: string;
  viewBox: { width: number; height: number };
  layers: string[];
  fills: string[];
  shapes: FingerprintShape[];
  /** Pfade, die gar nicht vermessen werden konnten (Q/T/A oder unbekanntes Kommando). */
  curvedPaths: number;
  /** Pfade mit kubischen Kurven, deren Hülle exakt vermessen wurde. */
  measuredCurvedPaths: number;
}
```

und beim Zusammenbau hochzählen, wenn `subpaths.some((s) => s.hasCurves)`.

- [ ] **Step 5: Alle Tests grün, `EXTRACTOR_VERSION` erhöhen**

Die Artefaktform ändert sich (neues Feld, neue Zahlen) — beide Versionskonstanten auf `3`:
- `packages/cli/src/scan/version.ts`: `EXTRACTOR_VERSION = 3`
- `packages/catalog/src/fingerprint-index.ts`: `ARTIFACT_EXTRACTOR_VERSION = 3`

Run: `pnpm typecheck && pnpm lint && pnpm vitest run packages/cli`
Expected: PASS — die Kennzahlentests in `packages/catalog` schlagen jetzt bewusst mit der Versionsmeldung fehl; sie werden in Task 9 mit dem neuen Artefakt grün. **Das ist die beabsichtigte Wirkung von Task 3.**

- [ ] **Step 6: Commit**

```bash
git add packages/cli/src/scan/path-geometry.ts packages/cli/src/scan/path-geometry.test.ts \
        packages/cli/src/scan/extract.ts packages/cli/src/scan/version.ts \
        packages/catalog/src/fingerprint-index.ts
git commit -m "feat: kubische Kurven exakt vermessen statt nur zählen"
```

---

## Task 6: Eine Hülle je Teilpfad statt einer Sammelhülle

**Begründung:** dieselbe Linie. Heute kollabiert ein Pfad aus n Teilpfaden zu **einer** `outline`-Hülle über alles — eine Zahl, die keinen der n Teilpfade beschreibt. Vorab gemessen an `5.7 Verwaltungsstufen`: `5.7.4_Bundesland.svg` besteht aus **vier** gleich großen Marken (je 5,446 × 6 mm) an `cx 7, 13, 19, 25`, `cy 16`. Die heutige Sammelhülle `4,277/13/27,723/19` beschreibt keine davon.

**Files:**
- Modify: `packages/cli/src/scan/extract.ts:246-249`
- Test: `packages/cli/src/scan/extract.test.ts`

**Interfaces:**
- Consumes: `parsePathSubpaths`, `SubpathBounds.hasCurves` aus Task 5
- Produces: `extractFingerprint` gibt für einen Pfad ohne Ringpaar **je Teilpfad** eine `outline`-Form aus, statt einer Sammelhülle

- [ ] **Step 1: Den failing test schreiben**

In `packages/cli/src/scan/extract.test.ts`. Das Test-SVG wird aus Millimeter-Sollwerten konstruiert (Global Constraint); Layer-Kennungen sind erlaubt (Ruling 10):

```ts
import { describe, expect, it } from 'vitest';
import { mmToUnits } from '@einsatzzeichen/schema';
import { extractFingerprint } from './extract.js';

/** Baut ein Referenz-ähnliches SVG aus Millimeterwerten. u() rechnet um. */
const u = (millimeters: number): string => mmToUnits(millimeters).toFixed(3);

describe('extractFingerprint — Teilpfade', () => {
  it('gibt je Teilpfad eine outline-Form aus, nicht eine Sammelhülle', () => {
    // Drei getrennte Marken auf einer Reihe: 4×6 mm bei x = 5, 13, 21, y = 13.
    // Kein Ringpaar (drei Teilpfade), also outline — aber dreifach, nicht einmal.
    const marks = [5, 13, 21]
      .map(
        (x) =>
          `M${u(x)} ${u(13)}H${u(x + 4)}V${u(19)}H${u(x)}Z`,
      )
      .join('');
    const svg =
      `<svg viewBox="0 0 ${u(32)} ${u(32)}"><g id="Takt_Zeichen__x28_umgewandelt_x29_">` +
      `<path d="${marks}"/></g></svg>`;

    const fp = extractFingerprint(svg, 'probe.svg');
    const outlines = fp.shapes.filter((s) => s.kind === 'outline');
    expect(outlines).toHaveLength(3);
    expect(outlines.map((s) => s.boundsMm.minXMm)).toEqual([5, 13, 21]);
    for (const outline of outlines) {
      expect(outline.boundsMm.maxXMm - outline.boundsMm.minXMm).toBeCloseTo(4, 3);
      expect(outline.boundsMm.minYMm).toBeCloseTo(13, 3);
      expect(outline.boundsMm.maxYMm).toBeCloseTo(19, 3);
    }
  });

  it('lässt ein echtes Ringpaar weiter als ring durch', () => {
    // Außen 1…31, innen 1.5…30.5 — beide achsparallele Rechtecke, Strichstärke 0.5.
    const outer = `M${u(1)} ${u(6)}H${u(31)}V${u(26)}H${u(1)}Z`;
    const inner = `M${u(1.5)} ${u(6.5)}H${u(30.5)}V${u(25.5)}H${u(1.5)}Z`;
    const svg =
      `<svg viewBox="0 0 ${u(32)} ${u(32)}"><g id="Takt_Zeichen__x28_umgewandelt_x29_">` +
      `<path d="${outer}${inner}"/></g></svg>`;

    const fp = extractFingerprint(svg, 'probe-ring.svg');
    const rings = fp.shapes.filter((s) => s.kind === 'ring');
    expect(rings).toHaveLength(1);
    const [ring] = rings;
    if (ring === undefined) throw new Error('kein ring');
    expect(ring.boundsMm).toEqual({ minXMm: 1.25, minYMm: 6.25, maxXMm: 30.75, maxYMm: 25.75 });
    expect(ring.strokeWidthMm).toBeCloseTo(0.5, 3);
    expect(fp.shapes.filter((s) => s.kind === 'outline')).toHaveLength(0);
  });
});
```

- [ ] **Step 2: Test laufen lassen, Fehlschlag sehen**

Run: `pnpm vitest run packages/cli/src/scan/extract.test.ts`
Expected: FAIL im ersten Test — `expect(outlines).toHaveLength(3)` erhält `1`

- [ ] **Step 3: Implementieren**

In `packages/cli/src/scan/extract.ts` den `outline`-Zweig ersetzen. Die Hilfsfunktion `subpathBounds` (Sammelhülle) wird nicht mehr gebraucht und **entfällt** — `noUnusedLocals` erzwingt das ohnehin:

```ts
    // Kein Ringpaar. Jeder Teilpfad wird einzeln geführt: eine Sammelhülle über mehrere
    // Teilpfade beschreibt keinen von ihnen (5.7.4 Bundesland: vier getrennte Marken je
    // 5,446 × 6 mm — die Sammelhülle 4,277/13/27,723/19 trifft keine einzige).
    // Die Art bleibt `outline`, weil die Kante eines in Fläche umgewandelten Strichs um
    // eine halbe Strichstärke zu groß ist.
    for (const subpath of subpaths) {
      shapes.push({
        kind: 'outline',
        boundsMm: {
          minXMm: mm(subpath.minX),
          minYMm: mm(subpath.minY),
          maxXMm: mm(subpath.maxX),
          maxYMm: mm(subpath.maxY),
        },
      });
    }
```

- [ ] **Step 4: Tests grün**

Run: `pnpm typecheck && pnpm lint && pnpm vitest run packages/cli`
Expected: PASS

- [ ] **Step 5: Wirkung auf die gegateten Einträge vorab prüfen**

`PRECEDENCE` in `packages/core/src/fingerprint.ts` wählt `outline` als **letzte** Art. Mehr `outline`-Einträge können die Auswahl also nur dort verändern, wo `outline` schon gewählt wurde — und ein gegateter Eintrag mit `outline` würde das Gate ohnehin verfehlen (Hülle eine halbe Strichstärke zu groß). Belegen statt annehmen:

```bash
node -e '
const a=require("./packages/catalog/src/fingerprints.json");
const P=["centerline","ring","bounds","rect","circle","outline"];
for (const e of a.entries.filter(x=>/^(1\.|C\.1\.[12]|D\.3\.7)/.test(x.asset)))
  console.log(e.asset.padEnd(46), (P.find(k=>e.shapes.some(s=>s.kind===k)) ?? "KEINE"));
'
```

Das liest das **committete** Artefakt, nicht einen neuen Lauf — die Änderung aus diesem Task wirkt erst, wenn Task 9 neu erzeugt. Genau darum ist dieser Zustand jetzt festzuhalten: Task 9 Step 3 vergleicht dagegen.

- [ ] **Step 6: Commit**

```bash
git add packages/cli/src/scan/extract.ts packages/cli/src/scan/extract.test.ts
git commit -m "feat: je Teilpfad eine Hülle statt einer Sammelhülle über alle"
```

---

## Task 7: Fill-loses `<polygon>` ist ein Strich, keine Füllfläche (I-2)

Nacharbeit **I-2** des Abschlussreviews: „`kind: 'bounds'` verwechselt Füllfläche und in Fläche umgewandelten Strich. 68 Dateien betroffen; in **sechs** (`D.4.3`, `F.3.5`, `J.1.1`, `J.1.2`, `J.1.7`, `L.10`) verdrängt eine Strich-Hülle die echte Füllfläche, weil `PRECEDENCE` `bounds` vor `rect`/`circle` stellt." Dazu der Task-7a-Minor derselben Klasse beim `circle`. Das Review notiert: „Zusammen anfassen, dann ist die Klasse geschlossen."

Im Vorgänger-Slice latent: keines der elf gegateten Assets hat ein fill-loses `<polygon>`. Nach diesem Task ist `1.13 Ereignis` korrekt als `outline` eingeordnet — die Voraussetzung für Task 8.

**Files:**
- Modify: `packages/cli/src/scan/extract.ts:200-216` (Polygon), `:184-196` (Circle)
- Test: `packages/cli/src/scan/extract.test.ts`

**Interfaces:**
- Consumes: nichts Neues
- Produces: ein `<polygon>` **ohne** `fill`-Attribut liefert `kind: 'outline'` statt `kind: 'bounds'`; ein `<circle>` ohne `fill` ebenso

- [ ] **Step 1: Die failing tests schreiben**

Anfügen in `packages/cli/src/scan/extract.test.ts`:

```ts
describe('extractFingerprint — Füllfläche gegen umgewandelten Strich', () => {
  it('führt ein gefülltes polygon als bounds', () => {
    const points = [[16, 3], [1, 10], [31, 10]]
      .map(([x, y]) => `${u(x)},${u(y)}`)
      .join(' ');
    const svg = `<svg viewBox="0 0 ${u(32)} ${u(32)}"><polygon fill="#ffffff" points="${points}"/></svg>`;
    const fp = extractFingerprint(svg, 'gefuellt.svg');
    expect(fp.shapes.map((s) => s.kind)).toEqual(['bounds']);
    expect(fp.fills).toEqual(['#ffffff']);
  });

  it('führt ein polygon ohne fill als outline, nicht als bounds', () => {
    // Ohne fill-Attribut ist das Polygon der in Fläche umgewandelte Umriss eines Strichs.
    // Seine Hülle liegt um eine halbe Strichstärke neben der Mittellinie — das ist genau
    // die Aussagekraft von `outline`, nicht die von `bounds`.
    const points = [[16, 3], [1, 10], [31, 10]]
      .map(([x, y]) => `${u(x)},${u(y)}`)
      .join(' ');
    const svg = `<svg viewBox="0 0 ${u(32)} ${u(32)}"><polygon points="${points}"/></svg>`;
    const fp = extractFingerprint(svg, 'strich.svg');
    expect(fp.shapes.map((s) => s.kind)).toEqual(['outline']);
    expect(fp.fills).toEqual([]);
  });

  it('führt einen circle ohne fill als outline', () => {
    const svg = `<svg viewBox="0 0 ${u(32)} ${u(32)}"><circle cx="${u(16)}" cy="${u(16)}" r="${u(14)}"/></svg>`;
    const fp = extractFingerprint(svg, 'kreis-strich.svg');
    expect(fp.shapes.map((s) => s.kind)).toEqual(['outline']);
  });

  it('führt einen gefüllten circle weiter als circle', () => {
    const svg = `<svg viewBox="0 0 ${u(32)} ${u(32)}"><circle fill="#ffffff" cx="${u(16)}" cy="${u(16)}" r="${u(14)}"/></svg>`;
    const fp = extractFingerprint(svg, 'kreis-flaeche.svg');
    expect(fp.shapes.map((s) => s.kind)).toEqual(['circle']);
    const [shape] = fp.shapes;
    if (shape === undefined) throw new Error('keine Form');
    expect(shape.boundsMm).toEqual({ minXMm: 2, minYMm: 2, maxXMm: 30, maxYMm: 30 });
  });
});
```

- [ ] **Step 2: Tests laufen lassen, Fehlschlag sehen**

Run: `pnpm vitest run packages/cli/src/scan/extract.test.ts`
Expected: FAIL in „polygon ohne fill" (`['bounds']` statt `['outline']`) und in „circle ohne fill"

- [ ] **Step 3: Implementieren**

Polygon-Schleife in `packages/cli/src/scan/extract.ts` — die Art hängt am Vorhandensein des `fill`-Attributs:

```ts
    if (points.length === 0) continue;
    // Ohne fill-Attribut ist das Polygon kein Füllkörper, sondern der in Fläche
    // umgewandelte Umriss eines Strichs: seine Hülle liegt um eine halbe Strichstärke
    // neben der Mittellinie. Als `bounds` geführt verdrängte sie über PRECEDENCE die
    // echte Füllfläche (belegt in D.4.3, F.3.5, J.1.1, J.1.2, J.1.7, L.10).
    const filled = a['fill'] !== undefined;
    const shape: FingerprintShape = {
      kind: filled ? 'bounds' : 'outline',
      boundsMm: boundsFromPoints(points),
    };
    if (a['fill'] !== undefined) shape.fill = normalizeFill(a['fill']);
    shapes.push(shape);
```

Circle-Schleife analog:

```ts
    const filled = a['fill'] !== undefined && a['fill'] !== 'none';
    const shape: FingerprintShape = {
      kind: filled ? 'circle' : 'outline',
      boundsMm: { minXMm: mm(cx - r), minYMm: mm(cy - r), maxXMm: mm(cx + r), maxYMm: mm(cy + r) },
    };
    if (filled && a['fill'] !== undefined) shape.fill = normalizeFill(a['fill']);
    shapes.push(shape);
```

- [ ] **Step 4: Tests grün**

Run: `pnpm typecheck && pnpm lint && pnpm vitest run packages/cli`
Expected: PASS

- [ ] **Step 5: `1.6 Funktionsstelle` prüfen — der einzige gegatete Kreis**

`1.6` besteht das Gate über seine Füllfläche mit nur **15 % Reserve** (Hülle `2,002…29,997` statt `2…30`, 0,0085 Einheiten gegen Toleranz 0,01). Wird sein `<circle>` durch diesen Task zu `outline`, fällt der Eintrag aus dem Gate.

```bash
node -e '
const fs=require("fs");
const svg=fs.readFileSync("taktische-zeichen/1.6_Funktionsstelle.svg","utf8");
for (const m of svg.matchAll(/<circle([^>]*)\/>/g)) console.log(m[1].trim());
'
```
Expected: das `<circle>` trägt ein `fill`-Attribut (dann bleibt es `circle`, Gate unberührt). Trägt es **keins**, ist das ein tragender Befund: dann verliert `1.6` seine Füllflächen-Kennzahl und der Task ist zu unterbrechen, bevor Task 9 das Artefakt neu schreibt — der Eintrag darf nicht still aus dem Gate fallen.

- [ ] **Step 6: Commit**

```bash
git add packages/cli/src/scan/extract.ts packages/cli/src/scan/extract.test.ts
git commit -m "fix: fill-lose Polygone und Kreise sind Striche, keine Füllflächen"
```

---

## Task 8: Kennzahlenart `centerline` — Mittellinie samt Eckpunkten

Der Kern des Slice. Ein in Fläche umgewandelter **offener Strich** erscheint in der Referenz als Polygon mit `2n` Punkten: je Ecke des zugrunde liegenden Polyzugs ein Punktpaar links und rechts der Mittellinie. Mittelt man die Paare, kommt der Polyzug exakt zurück — dieselbe Operation, die `deriveRing` für Ringpaare schon ausführt, also Kennzahlenableitung und kein Kopieren von Referenzgeometrie (Ruling 9).

**Vorab vermessen an `1.13_Ereignis.svg`** (sechs Polygonpunkte, in Millimetern):

| Clusterschwelle | Cluster | Zentren | Trennung |
|---|---|---|---|
| 0,6 mm | 4 (Größen 1,2,1,2) | — | 0,902 mm |
| **1,0 mm** | **3 (Größen 2,2,2)** | **(16\|25) · (4\|7) · (27,999\|7)** | **21,633 mm** |
| 1,5 mm | 3 (2,2,2) | dieselben | 21,633 mm |
| 2,0 mm | 3 (2,2,2) | dieselben | 21,633 mm |

Bei Schwelle 1,0 mm ist der Abstand zwischen den Clustern **21-mal** größer als die Schwelle — das Ergebnis ist gegen die Schwellenwahl robust, und die Wache unten macht das prüfbar statt es zu unterstellen. `1.13 Ereignis` ist damit der Polyzug **(4|7) → (16|25) → (28|7)** bei 0,5 mm Strichstärke, Hülle `4/7/28/25`.

**Files:**
- Modify: `packages/cli/src/scan/path-geometry.ts` (Ableitung)
- Modify: `packages/cli/src/scan/path-geometry.test.ts`
- Modify: `packages/cli/src/scan/extract.ts` (Formart einhängen)
- Modify: `packages/cli/src/scan/extract.test.ts`
- Modify: `packages/core/src/fingerprint.ts` (`PRECEDENCE`, Typ)
- Modify: `packages/core/src/fingerprint.test.ts`

**Interfaces:**
- Consumes: `boundsFromPoints`, `mm` aus `extract.ts`; `TOLERANCE_UNITS` aus `@einsatzzeichen/schema`
- Produces:
  - `deriveCenterline(points: ReadonlyArray<readonly [number, number]>): Centerline | null` in `path-geometry.ts`, mit `interface Centerline { vertices: Array<readonly [number, number]>; strokeWidth: number }` (SVG-Einheiten)
  - `ShapeKind` erhält `'centerline'`
  - `FingerprintShape` erhält `verticesMm?: Array<{ xMm: number; yMm: number }>`
  - `FingerprintShapeLike` in `core` erhält dasselbe optionale Feld
  - `PRECEDENCE` wird `['centerline', 'ring', 'bounds', 'rect', 'circle', 'outline']`

- [ ] **Step 1: Die failing tests für die Ableitung schreiben**

In `packages/cli/src/scan/path-geometry.test.ts`. Eingaben aus Millimeter-Sollwerten konstruiert:

```ts
import { deriveCenterline } from './path-geometry.js';
import { mmToUnits, unitsToMm } from '@einsatzzeichen/schema';

/** Umriss eines 0,5 mm starken Polyzugs, aus Sollwerten konstruiert. */
function strokeOutline(
  vertices: ReadonlyArray<readonly [number, number]>,
  halfWidthMm: number,
): Array<readonly [number, number]> {
  // Für den Test genügt ein senkrechter Versatz: der Polyzug läuft waagerecht.
  const up = vertices.map(([x, y]) => [mmToUnits(x), mmToUnits(y - halfWidthMm)] as const);
  const down = [...vertices].reverse().map(([x, y]) => [mmToUnits(x), mmToUnits(y + halfWidthMm)] as const);
  return [...up, ...down];
}

describe('deriveCenterline', () => {
  it('rechnet den Polyzug aus dem Umriss zurück', () => {
    const soll = [
      [4, 16],
      [16, 16],
      [28, 16],
    ] as const;
    const result = deriveCenterline(strokeOutline(soll, 0.25));
    expect(result).not.toBeNull();
    if (result === null) throw new Error('unerwartet null');
    expect(result.vertices).toHaveLength(3);
    const inMm = result.vertices.map(([x, y]) => [
      Number(unitsToMm(x).toFixed(3)),
      Number(unitsToMm(y).toFixed(3)),
    ]);
    expect(inMm).toEqual([
      [4, 16],
      [16, 16],
      [28, 16],
    ]);
    expect(unitsToMm(result.strokeWidth)).toBeCloseTo(0.5, 3);
  });

  it('lehnt eine ungerade Punktzahl ab', () => {
    expect(deriveCenterline([[0, 0], [1, 1], [2, 2]])).toBeNull();
  });

  it('lehnt ab, wenn ein Cluster nicht genau zwei Punkte hat', () => {
    // Vier Punkte, aber drei liegen dicht beieinander: keine saubere Paarung.
    const near = mmToUnits(0.1);
    expect(
      deriveCenterline([
        [0, 0],
        [near, 0],
        [2 * near, 0],
        [mmToUnits(20), 0],
      ]),
    ).toBeNull();
  });

  it('lehnt ab, wenn die Cluster nicht deutlich getrennt sind', () => {
    // Zwei Paare im Abstand von nur 1,2 mm — knapp über der Schwelle, aber weit unter
    // dem geforderten Sicherheitsfaktor. Ein plausibel aussehendes, falsches Ergebnis
    // ist schlimmer als kein Ergebnis.
    expect(
      deriveCenterline([
        [mmToUnits(0), mmToUnits(0)],
        [mmToUnits(0), mmToUnits(0.5)],
        [mmToUnits(1.2), mmToUnits(0)],
        [mmToUnits(1.2), mmToUnits(0.5)],
      ]),
    ).toBeNull();
  });
});
```

- [ ] **Step 2: Tests laufen lassen, Fehlschlag sehen**

Run: `pnpm vitest run packages/cli/src/scan/path-geometry.test.ts`
Expected: FAIL — `deriveCenterline` ist kein Export

- [ ] **Step 3: Die Ableitung implementieren**

In `packages/cli/src/scan/path-geometry.ts`:

```ts
export interface Centerline {
  /** Ecken des zurückgerechneten Polyzugs, in SVG-Einheiten, in Reihenfolge. */
  vertices: Array<readonly [number, number]>;
  strokeWidth: number;
}

/** Clusterschwelle: 1 mm in SVG-Einheiten. Begründung siehe Doku an deriveCenterline. */
const CLUSTER_THRESHOLD_UNITS = 72 / 25.4;
/** Die Cluster müssen mindestens so viel weiter auseinander liegen als die Schwelle. */
const SEPARATION_FACTOR = 3;

/**
 * Rechnet aus dem Umriss eines in Fläche umgewandelten offenen Strichs die Mittellinie
 * zurück. Ein solcher Umriss trägt je Ecke des Polyzugs ein Punktpaar — eines links,
 * eines rechts der Mittellinie. Die Paare zu mitteln liefert die Ecken exakt; es ist
 * dieselbe Operation, die `deriveRing` für Ringpaare ausführt.
 *
 * Die Paarung geschieht per Clusterung, nicht über die Punktreihenfolge: die Reihenfolge
 * im Umriss hängt davon ab, an welcher Ecke der Export den Pfad beginnt (bei 1.13 beim
 * Scheitel, nicht am Ende), und lässt sich nicht allgemein aus dem Index ableiten.
 *
 * Liefert `null`, sobald die Voraussetzungen nicht **belegt** sind:
 * - ungerade Punktzahl (dann ist es kein Strichumriss),
 * - ein Cluster mit ungleich zwei Punkten,
 * - Cluster, die weniger als `SEPARATION_FACTOR` × Schwelle auseinander liegen.
 * Ein plausibel aussehendes, falsches Ergebnis ist schlimmer als kein Ergebnis — die
 * Lehre aus Ruling 16, wo gemittelte Hüllen bei schrägen Kanten still falsche
 * Strichstärken erzeugten (91 von 150 Ringen).
 */
export function deriveCenterline(
  points: ReadonlyArray<readonly [number, number]>,
): Centerline | null {
  if (points.length < 4 || points.length % 2 !== 0) return null;

  const clusters: Array<Array<readonly [number, number]>> = [];
  for (const point of points) {
    const found = clusters.find((cluster) =>
      cluster.some(([cx, cy]) => Math.hypot(cx - point[0], cy - point[1]) <= CLUSTER_THRESHOLD_UNITS),
    );
    if (found) found.push(point);
    else clusters.push([point]);
  }

  if (clusters.length !== points.length / 2) return null;
  if (clusters.some((cluster) => cluster.length !== 2)) return null;

  const vertices = clusters.map((cluster) => {
    const sumX = cluster.reduce((sum, [x]) => sum + x, 0);
    const sumY = cluster.reduce((sum, [, y]) => sum + y, 0);
    return [sumX / cluster.length, sumY / cluster.length] as const;
  });

  for (let i = 0; i < vertices.length; i += 1) {
    for (let j = i + 1; j < vertices.length; j += 1) {
      const a = vertices[i];
      const b = vertices[j];
      if (a === undefined || b === undefined) return null;
      if (Math.hypot(a[0] - b[0], a[1] - b[1]) < CLUSTER_THRESHOLD_UNITS * SEPARATION_FACTOR) {
        return null;
      }
    }
  }

  // Strichstärke: der Abstand innerhalb eines Paars ist an einer geraden Stelle genau
  // die Strichstärke. An einer Ecke ist er größer (sw / sin(θ/2)); das Minimum über alle
  // Paare ist deshalb der belastbare Schätzer.
  const widths = clusters.map((cluster) => {
    const [first, second] = cluster;
    if (first === undefined || second === undefined) return Number.POSITIVE_INFINITY;
    return Math.hypot(first[0] - second[0], first[1] - second[1]);
  });
  const strokeWidth = Math.min(...widths);
  if (!Number.isFinite(strokeWidth) || strokeWidth <= 0) return null;

  return { vertices, strokeWidth };
}
```

- [ ] **Step 4: Tests grün**

Run: `pnpm vitest run packages/cli/src/scan/path-geometry.test.ts`
Expected: PASS

- [ ] **Step 5: Die Formart einhängen**

In `packages/cli/src/scan/extract.ts`:

```ts
export type ShapeKind = 'centerline' | 'ring' | 'bounds' | 'rect' | 'circle' | 'outline';

export interface FingerprintShape {
  kind: ShapeKind;
  boundsMm: BoundsMm;
  /** Nur bei `ring` und `centerline`: zurückgerechnete Strichstärke. */
  strokeWidthMm?: number;
  /** Nur bei `centerline`: die zurückgerechneten Ecken des Polyzugs. */
  verticesMm?: Array<{ xMm: number; yMm: number }>;
  rotate?: number;
  fill?: string;
}
```

Und in der Polygon-Schleife, **vor** dem `outline`-Zweig aus Task 7 (ein fill-loses Polygon ist der Kandidat):

```ts
    if (a['fill'] === undefined) {
      const centerline = deriveCenterline(points);
      if (centerline) {
        shapes.push({
          kind: 'centerline',
          boundsMm: boundsFromPoints(centerline.vertices),
          strokeWidthMm: mm(centerline.strokeWidth),
          verticesMm: centerline.vertices.map(([x, y]) => ({ xMm: mm(x), yMm: mm(y) })),
        });
        continue;
      }
    }
```

- [ ] **Step 6: Den Test für die Einhängung schreiben und grün sehen**

In `packages/cli/src/scan/extract.test.ts`:

```ts
  it('leitet aus einem fill-losen Polygon eine centerline samt Ecken ab', () => {
    const soll = [
      [4, 7],
      [16, 25],
      [28, 7],
    ] as const;
    // Umriss aus Sollwerten: je Ecke ein Punktpaar 0,25 mm über und unter der Mittellinie.
    const outline = [
      ...soll.map(([x, y]) => [x, y - 0.25] as const),
      ...[...soll].reverse().map(([x, y]) => [x, y + 0.25] as const),
    ];
    const pts = outline.map(([x, y]) => `${u(x)},${u(y)}`).join(' ');
    const svg = `<svg viewBox="0 0 ${u(32)} ${u(32)}"><polygon points="${pts}"/></svg>`;

    const fp = extractFingerprint(svg, 'centerline.svg');
    expect(fp.shapes.map((s) => s.kind)).toEqual(['centerline']);
    const [shape] = fp.shapes;
    if (shape === undefined) throw new Error('keine Form');
    expect(shape.boundsMm).toEqual({ minXMm: 4, minYMm: 7, maxXMm: 28, maxYMm: 25 });
    expect(shape.verticesMm).toEqual([
      { xMm: 4, yMm: 7 },
      { xMm: 16, yMm: 25 },
      { xMm: 28, yMm: 7 },
    ]);
    expect(shape.strokeWidthMm).toBeCloseTo(0.5, 3);
  });
```

Run: `pnpm vitest run packages/cli`
Expected: PASS

Hinweis zur Reihenfolge: `deriveCenterline` liefert die Ecken in Clusterreihenfolge, also in der Reihenfolge ihres **ersten Auftretens im Umriss**. Für den konstruierten Umriss oben ist das die Sollreihenfolge. Schlägt der Vergleich mit `toEqual` an, ist die Erwartung an die Reihenfolge anzupassen (die Hülle bleibt davon unberührt) — die Reihenfolge selbst **nicht** im Produktionscode „glätten", solange sie nicht vermessen ist.

- [ ] **Step 7: `PRECEDENCE` und den Lesetyp in `core` erweitern**

`packages/core/src/fingerprint.ts`:

```ts
export interface FingerprintShapeLike {
  kind: string;
  boundsMm: { minXMm: number; minYMm: number; maxXMm: number; maxYMm: number };
  /** Nur bei `centerline`: die zurückgerechneten Ecken des Polyzugs. */
  verticesMm?: readonly { xMm: number; yMm: number }[];
}

/**
 * Aussagekraft der Formarten, absteigend. `centerline` steht vorn, weil es die Ecken
 * mitträgt und damit die Form festlegt, nicht nur die Hülle. `ring` ist eine echte
 * Mittellinie ohne Ecken, `outline` liegt um eine halbe Strichstärke daneben und wird
 * nur genommen, wenn nichts Besseres da ist.
 */
const PRECEDENCE = ['centerline', 'ring', 'bounds', 'rect', 'circle', 'outline'];
```

- [ ] **Step 8: Versionen erhöhen, Tests grün**

`EXTRACTOR_VERSION` und `ARTIFACT_EXTRACTOR_VERSION` auf `4`.

Run: `pnpm typecheck && pnpm lint && pnpm vitest run packages/cli packages/core`
Expected: PASS (`packages/catalog` bleibt bis Task 9 rot mit der Versionsmeldung)

- [ ] **Step 9: Commit**

```bash
git add packages/cli/src/scan/path-geometry.ts packages/cli/src/scan/path-geometry.test.ts \
        packages/cli/src/scan/extract.ts packages/cli/src/scan/extract.test.ts \
        packages/core/src/fingerprint.ts packages/cli/src/scan/version.ts \
        packages/catalog/src/fingerprint-index.ts
git commit -m "feat: Kennzahlenart centerline liefert Mittellinie samt Eckpunkten"
```

---

## Task 9: Artefakt neu erzeugen und die Wirkung belegen

Der Task, den Ruling 16 nur per Disziplin erledigt hat und den Task 3 jetzt erzwingt. **Kein Codeschritt** — ein Messschritt mit Nachweispflicht.

**Files:**
- Modify: `packages/catalog/src/fingerprints.json` (Generat)

**Interfaces:**
- Consumes: alles aus Tasks 5–8
- Produces: ein Artefakt der Version 4, gegen das die Katalogtests wieder laufen

- [ ] **Step 1: Zustand vor der Neuerzeugung festhalten**

```bash
node -e '
const a=require("./packages/catalog/src/fingerprints.json");
const P=["centerline","ring","bounds","rect","circle","outline"];
const G=/^(1\.1_|1\.2_|1\.6_|1\.7_|1\.8_|1\.10_|1\.11_|1\.12_|C\.1\.1_|C\.1\.2_|D\.3\.7_)/;
for (const e of a.entries.filter(x=>G.test(x.asset))) {
  const k=P.find(k=>e.shapes.some(s=>s.kind===k));
  const s=e.shapes.find(s=>s.kind===k);
  console.log(e.asset.padEnd(46), (k??"KEINE").padEnd(11), JSON.stringify(s?.boundsMm));
}
' > $SCRATCH/gate-vorher.txt
cat $SCRATCH/gate-vorher.txt
```

- [ ] **Step 2: Neu erzeugen**

Run: `pnpm cli audit:reference`
Expected: schreibt `packages/catalog/src/fingerprints.json`

- [ ] **Step 3: Die elf gegateten Einträge einzeln vergleichen**

Denselben Befehl aus Step 1 erneut laufen lassen, Ausgabe nach `$SCRATCH/gate-nachher.txt`, dann:

```bash
diff $SCRATCH/gate-vorher.txt $SCRATCH/gate-nachher.txt && echo "GEWÄHLTE FORM UNVERÄNDERT"
```

Expected: kein Unterschied. **Nicht** „die Tests laufen noch" — die gewählte Form je gegatetem Asset, namentlich, mit Hülle. Das ist die Prüfung, die Ruling 16 früh gefangen hätte.

Gibt es einen Unterschied: **anhalten und melden.** Entweder ist eine der Tasks 5–8 fehlerhaft, oder die Referenz trägt an dieser Stelle eine Geometrie, die der Vorgänger-Slice falsch eingeordnet hat. Beides ist ein tragender Befund, kein Anlass zum Anpassen von Erwartungswerten.

- [ ] **Step 4: Die Wirkung quantifizieren**

```bash
node -e '
const a=require("./packages/catalog/src/fingerprints.json");
const c={};
let leer=0, kurvenVermessen=0, kurvenAbgelehnt=0;
for (const e of a.entries) {
  for (const s of e.shapes) c[s.kind]=(c[s.kind]??0)+1;
  if (e.shapes.length===0) leer++;
  kurvenVermessen += e.measuredCurvedPaths ?? 0;
  kurvenAbgelehnt += e.curvedPaths ?? 0;
}
console.log("Version:", a.extractorVersion, "Einträge:", a.entries.length);
console.log("Formarten:", c);
console.log("Einträge mit leerem shapes:", leer, "(vorher 138)");
console.log("vermessene Kurvenpfade:", kurvenVermessen, "· abgelehnte:", kurvenAbgelehnt, "(vorher 480 gezählt)");
'
```

Die Zahlen im Commit festhalten — Task 13 trägt sie in die Entscheidungsnotiz. Erwartet: `leer` deutlich unter 138, `centerline` > 0, `outline` deutlich höher als 745 (weil jetzt je Teilpfad geführt).

- [ ] **Step 5: Determinismus belegen**

```bash
cp packages/catalog/src/fingerprints.json $SCRATCH/lauf1.json
pnpm cli audit:reference
diff $SCRATCH/lauf1.json packages/catalog/src/fingerprints.json && echo "BYTEGLEICH"
```
Expected: `BYTEGLEICH`

- [ ] **Step 6: Vollständig grün**

Run: `pnpm typecheck && pnpm lint && pnpm test`
Expected: alle Tests grün — die Katalogtests laufen wieder, weil Artefakt- und Leserversion übereinstimmen.

- [ ] **Step 7: CI ohne Referenzbestand prüfen**

```bash
mv taktische-zeichen taktische-zeichen.aus
pnpm typecheck && pnpm test
mv taktische-zeichen.aus taktische-zeichen
```
Expected: beides grün ohne den Ordner (Erfolgskriterium 5 der Spec). **Das Zurückbenennen nicht vergessen.**

- [ ] **Step 8: Commit**

```bash
git add packages/catalog/src/fingerprints.json
git commit -m "chore: Kennzahlenartefakt mit Extraktorversion 4 neu erzeugt"
```

---

## Task 10: Das Gate vergleicht Eckpunkte, wo die Form sie trägt

Schließt die strukturelle Lücke, an die Rulings 17, 19 und 22 je von einer anderen Seite gestoßen sind: **eine Hülle bestimmt keine Form.** `matchFingerprint` vergleicht heute nur `minX/minY/maxX/maxY`; ein Rechteck mit derselben Hülle wie ein Dreieck besteht das Gate. Trägt die gewählte Form Eckpunkte, werden sie ab jetzt mitverglichen.

**Files:**
- Modify: `packages/core/src/fingerprint.ts`
- Modify: `packages/core/src/fingerprint.test.ts`

**Interfaces:**
- Consumes: `FingerprintShapeLike.verticesMm` aus Task 8; `Primitive` aus `@einsatzzeichen/schema`
- Produces: `matchFingerprint` meldet zusätzlich Eckpunktabweichungen. Für Formen **ohne** `verticesMm` unverändertes Verhalten.

- [ ] **Step 1: Die failing tests schreiben**

In `packages/core/src/fingerprint.test.ts`:

```ts
describe('matchFingerprint — Eckpunktvergleich', () => {
  const centerlineFingerprint = {
    asset: 'probe.svg',
    shapes: [
      {
        kind: 'centerline',
        boundsMm: { minXMm: 4, minYMm: 7, maxXMm: 28, maxYMm: 25 },
        verticesMm: [
          { xMm: 4, yMm: 7 },
          { xMm: 16, yMm: 25 },
          { xMm: 28, yMm: 7 },
        ],
      },
    ],
  };

  it('nimmt den Polyzug an, der die Ecken trifft', () => {
    const drawing: Drawing = {
      viewBox: DEFAULT_VIEWBOX_MM,
      children: [
        {
          type: 'polyline',
          role: 'body',
          points: [
            [4, 7],
            [16, 25],
            [28, 7],
          ],
        },
      ],
    };
    const result = matchFingerprint(drawing, centerlineFingerprint);
    expect(result.problems).toEqual([]);
    expect(result.ok).toBe(true);
  });

  it('lehnt ein Rechteck mit derselben Hülle ab', () => {
    // Genau der Fehler, den ein reiner Hüllenvergleich durchlässt: gleiche Hülle,
    // falsche Form. Ohne Eckpunktvergleich bestünde dieser Fall.
    const drawing: Drawing = {
      viewBox: DEFAULT_VIEWBOX_MM,
      children: [{ type: 'rect', role: 'body', x: 4, y: 7, width: 24, height: 18 }],
    };
    const result = matchFingerprint(drawing, centerlineFingerprint);
    expect(result.ok).toBe(false);
    expect(result.problems.join(' ')).toMatch(/Eckpunkt/);
  });

  it('lehnt einen Polyzug mit richtiger Hülle und falscher Mitte ab', () => {
    const drawing: Drawing = {
      viewBox: DEFAULT_VIEWBOX_MM,
      children: [
        {
          type: 'polyline',
          role: 'body',
          points: [
            [4, 7],
            [16, 20],
            [28, 7],
            [4, 25],
          ],
        },
      ],
    };
    const result = matchFingerprint(drawing, centerlineFingerprint);
    expect(result.ok).toBe(false);
  });

  it('lässt Formen ohne Eckpunkte unverändert nur über die Hülle prüfen', () => {
    // Erwartungswert aus dem Katalogfingerprint-Format: eine `ring`-Form trägt keine
    // verticesMm, das Gate darf deshalb nichts zusätzlich verlangen.
    const drawing: Drawing = {
      viewBox: DEFAULT_VIEWBOX_MM,
      children: [{ type: 'rect', role: 'body', x: 1, y: 6, width: 30, height: 20 }],
    };
    const result = matchFingerprint(drawing, {
      asset: 'ring.svg',
      shapes: [{ kind: 'ring', boundsMm: { minXMm: 1, minYMm: 6, maxXMm: 31, maxYMm: 26 } }],
    });
    expect(result.problems).toEqual([]);
    expect(result.ok).toBe(true);
  });
});
```

- [ ] **Step 2: Tests laufen lassen, Fehlschlag sehen**

Run: `pnpm vitest run packages/core/src/fingerprint.test.ts`
Expected: FAIL — „lehnt ein Rechteck mit derselben Hülle ab" ist grün im Hüllenvergleich, `result.ok` ist `true`

- [ ] **Step 3: Implementieren**

In `packages/core/src/fingerprint.ts`, nach dem Hüllenvergleich:

```ts
/**
 * Eckpunkte eines Primitivs in Millimetern, sofern seine Art sie definiert.
 * `null` heißt „diese Art hat keine Eckpunkte" (Kreis, Pfad, Gruppe) — nicht „Fehler".
 * Eine gesetzte Drehung führt zu `null`: die Ecken wären zu drehen, und das wird erst
 * gebraucht, wenn eine Referenz gedrehte Eckpunkte belegt.
 */
function verticesOfMm(primitive: Primitive): Array<readonly [number, number]> | null {
  if (primitive.transform?.rotate) return null;
  if (primitive.type === 'polyline') return primitive.points.map(([x, y]) => [x, y] as const);
  if (primitive.type === 'rect') {
    const { x, y, width, height } = primitive;
    return [
      [x, y],
      [x + width, y],
      [x + width, y + height],
      [x, y + height],
    ];
  }
  return null;
}

/** Vergleicht zwei Eckpunktlisten mengenweise: die Reihenfolge ist nicht vermessen. */
function compareVertices(
  expected: readonly { xMm: number; yMm: number }[],
  actual: ReadonlyArray<readonly [number, number]>,
  asset: string,
): string[] {
  const problems: string[] = [];
  if (expected.length !== actual.length) {
    problems.push(
      `${asset}: ${expected.length} Eckpunkte erwartet, ${actual.length} erhalten.`,
    );
    return problems;
  }
  for (const point of expected) {
    const hit = actual.some(
      ([x, y]) =>
        Math.abs(mmToUnits(point.xMm) - mmToUnits(x)) <= TOLERANCE_UNITS &&
        Math.abs(mmToUnits(point.yMm) - mmToUnits(y)) <= TOLERANCE_UNITS,
    );
    if (!hit) {
      problems.push(
        `${asset}: Eckpunkt (${point.xMm}|${point.yMm}) mm fehlt in der erzeugten Geometrie.`,
      );
    }
  }
  return problems;
}
```

Und am Ende von `matchFingerprint`, vor dem `return`:

```ts
  const expectedVertices = picked.verticesMm;
  if (expectedVertices !== undefined && expectedVertices.length > 0) {
    const actualVertices = verticesOfMm(body);
    if (actualVertices === null) {
      problems.push(
        `${fingerprint.asset}: Kennzahlen nennen ${expectedVertices.length} Eckpunkte, ` +
          `das body-Primitiv (${body.type}) definiert keine vergleichbaren.`,
      );
    } else {
      problems.push(...compareVertices(expectedVertices, actualVertices, fingerprint.asset));
    }
  }
```

- [ ] **Step 4: Tests grün**

Run: `pnpm typecheck && pnpm lint && pnpm test`
Expected: alle grün

- [ ] **Step 5: Falsifikationsnachweis — der Vergleich greift wirklich**

Im Test „nimmt den Polyzug an, der die Ecken trifft" den Mittelpunkt vorübergehend von `[16, 25]` auf `[16, 24.99]` ändern (0,01 mm ≈ 0,028 Einheiten, also knapp über der Toleranz).
Run: `pnpm vitest run packages/core/src/fingerprint.test.ts`
Expected: FAIL mit „Eckpunkt (16|25) mm fehlt". Danach zurückändern und grün sehen.

- [ ] **Step 6: Commit**

```bash
git add packages/core/src/fingerprint.ts packages/core/src/fingerprint.test.ts
git commit -m "feat: Fingerprint-Gate vergleicht Eckpunkte, nicht nur Hüllen"
```

---

## Task 11: `1.13 Ereignis` als neuntes Grundzeichen

Der Katalogzugewinn dieses Slice. `SymbolKind` kennt `'event'` bereits (`packages/schema/src/taxonomy.ts`) — es fehlten Geometrie, Titel und Quellenangabe. Vermessen (Task 8): Polyzug **(4|7) → (16|25) → (28|7)**, Strichstärke 0,5 mm, Hülle `4/7/28/25`. **Offener** Polyzug, also `closed` nicht setzen.

**Files:**
- Modify: `packages/catalog/src/base-symbols.ts` (`BODIES`, `TITLES`, `SECTIONS`, `BASE_SYMBOLS`)
- Modify: `packages/catalog/src/base-symbols.test.ts` (`REFERENCE`)

**Interfaces:**
- Consumes: `matchFingerprint` mit Eckpunktvergleich (Task 10); Artefakt der Version 4 (Task 9)
- Produces: `BASE_SYMBOLS.event`, damit **neun** Einträge. `exportSvg` und `snapshots.test.ts` iterieren über `BASE_SYMBOLS` und erzeugen dadurch automatisch **12** Dateien (9 Grundzeichen + 3 Rezepte).

- [ ] **Step 1: Den Test erweitern und Fehlschlag sehen**

In `packages/catalog/src/base-symbols.test.ts` die Liste um eine Zeile ergänzen:

```ts
  ['point', '1.12_Konkreter Punkt.svg'],
  ['event', '1.13_Ereignis.svg'],
] as const satisfies ReadonlyArray<[keyof typeof BASE_SYMBOLS, string]>;
```

Run: `pnpm vitest run packages/catalog/src/base-symbols.test.ts`
Expected: FAIL — `'event'` ist kein Schlüssel von `BASE_SYMBOLS` (Typfehler zur Laufzeit als `undefined`-Zugriff)

- [ ] **Step 2: Geometrie, Titel und Quelle ergänzen**

In `packages/catalog/src/base-symbols.ts`, in `BODIES` nach `point`:

```ts
  event: {
    type: 'polyline',
    role: 'body',
    // Offener Polyzug: 1.13 ist ein Strich, kein geschlossener Umriss. Die Referenz
    // zeichnet ihn als in Fläche umgewandelte Kontur mit sechs Punkten; die Mittellinie
    // ist per deriveCenterline zurückgerechnet (Ecken paarweise gemittelt).
    points: [
      [4, 7],
      [16, 25],
      [28, 7],
    ],
    style: OUTLINE,
  },
```

in `TITLES`:

```ts
  event: 'Ereignis',
```

in `SECTIONS`:

```ts
  event: { section: '1.13', asset: '1.13_Ereignis.svg' },
```

und in `BASE_SYMBOLS`:

```ts
  event: entry('event'),
```

- [ ] **Step 3: Tests laufen lassen**

Run: `pnpm vitest run packages/catalog`
Expected: der Geometrietest zu `event` ist grün (Hülle **und** Eckpunkte), der Snapshot-Test schlägt fehl mit einem fehlenden Snapshot für `event`

- [ ] **Step 4: Snapshot erzeugen und ansehen**

Run: `pnpm vitest run packages/catalog -u`

Dann den neuen Snapshot lesen und prüfen, dass er einen **offenen** Polyzug enthält (`<polyline`, `fill="none"`, drei Punktpaare) und keinen geschlossenen. Ein geschlossener Polyzug hätte dieselbe Hülle und dieselben Eckpunkte — das Gate fängt ihn **nicht**. Diese Sichtprüfung ist deshalb Pflicht, keine Formalie.

- [ ] **Step 5: Export gegenprüfen**

```bash
pnpm cli export --out $SCRATCH/export --size 256
ls $SCRATCH/export | wc -l
```
Expected: `12` (9 Grundzeichen + 3 Rezepte)

- [ ] **Step 6: Alles grün**

Run: `pnpm typecheck && pnpm lint && pnpm test`
Expected: alle grün

- [ ] **Step 7: Commit**

```bash
git add packages/catalog/src/base-symbols.ts packages/catalog/src/base-symbols.test.ts \
        packages/catalog/src/__snapshots__
git commit -m "feat: Grundzeichen 1.13 Ereignis aus der zurückgerechneten Mittellinie"
```

---

## Task 12: Varianten-Slots im Coverage-Manifest (Erfolgskriterium 4)

Erfolgskriterium 4 der Spec verlangt: „Das Coverage-Manifest ist über `(sourceId, variant)` eindeutig keyfähig; **alle 31 Varianten-Dateien haben einen Slot**." Der erste Halbsatz ist erfüllt (`entryKey`), der zweite nicht: `COVERAGE_MANIFEST.entries` hat 11 Einträge, **alle mit `variant: 'primary'`**. Kein einziger Slot für eine Variantendatei — und im Unterschied zu den übrigen Lücken des Vorgänger-Slice ist diese **nirgends dokumentiert**.

Vorab gezählt: **31** Dateien im Referenzbestand mit Suffix `_Alternative.svg` oder `_2.svg`.

**Files:**
- Modify: `packages/schema/src/coverage.ts`
- Create: `packages/catalog/src/variants.ts`
- Create: `packages/catalog/src/variants.test.ts`
- Modify: `packages/catalog/src/coverage-manifest.ts`
- Modify: `packages/catalog/src/index.ts`

**Interfaces:**
- Consumes: `DepictionVariant`, `Review` aus `@einsatzzeichen/schema`; `fingerprints.json` über einen Rohimport
- Produces:
  - `VariantSlot` und `CoverageManifest.variants` im Schema
  - `VARIANT_ASSETS: readonly string[]` und `VARIANT_SLOTS: readonly VariantSlot[]` in `packages/catalog/src/variants.ts`
  - `checkCoverage()` gibt zusätzlich `undeclaredVariants: string[]` zurück

- [ ] **Step 1: Den Gate-Test schreiben**

`packages/catalog/src/variants.test.ts`. Der Erwartungswert wird aus dem **Artefakt** abgeleitet, nicht aus einem Literal — sonst prüfte der Test die Deklaration gegen sich selbst:

```ts
import { describe, expect, it } from 'vitest';
import { VARIANT_ASSETS, VARIANT_SLOTS } from './variants.js';
import { COVERAGE_MANIFEST } from './coverage-manifest.js';
import fingerprints from './fingerprints.json' with { type: 'json' };

/** Alle Variantendateien, wie sie im Kennzahlenartefakt stehen. */
function variantAssetsFromArtifact(): string[] {
  const raw: unknown = fingerprints;
  if (typeof raw !== 'object' || raw === null || !('entries' in raw) || !Array.isArray(raw.entries)) {
    throw new Error('fingerprints.json hat kein entries-Array.');
  }
  const assets: string[] = [];
  for (const entry of raw.entries) {
    if (typeof entry !== 'object' || entry === null || !('asset' in entry)) continue;
    const asset: unknown = entry.asset;
    if (typeof asset !== 'string') continue;
    if (asset.endsWith('_Alternative.svg') || asset.endsWith('_2.svg')) assets.push(asset);
  }
  return assets.sort();
}

describe('Varianten-Slots', () => {
  it('deklariert genau die Variantendateien des Referenzbestands', () => {
    expect([...VARIANT_ASSETS].sort()).toEqual(variantAssetsFromArtifact());
  });

  it('deckt 31 Dateien ab', () => {
    expect(variantAssetsFromArtifact()).toHaveLength(31);
    expect(VARIANT_ASSETS).toHaveLength(31);
  });

  it('leitet zu jedem Slot eine Basisdatei und die Variante ab', () => {
    for (const slot of VARIANT_SLOTS) {
      expect(slot.asset.endsWith('.svg')).toBe(true);
      expect(slot.baseAsset.endsWith('.svg')).toBe(true);
      expect(slot.baseAsset).not.toBe(slot.asset);
      expect(slot.variant).toBe('alternative');
      expect(slot.review.status).toBe('pending');
    }
  });

  it('hängt die Slots ins Manifest', () => {
    expect(COVERAGE_MANIFEST.variants).toHaveLength(31);
  });

  it('erzeugt eindeutige Schlüssel über Basisdatei und Variante', () => {
    const keys = VARIANT_SLOTS.map((slot) => `${slot.baseAsset}#${slot.variant}`);
    expect(new Set(keys).size).toBe(keys.length);
  });
});
```

- [ ] **Step 2: Tests laufen lassen, Fehlschlag sehen**

Run: `pnpm vitest run packages/catalog/src/variants.test.ts`
Expected: FAIL — `./variants.js` existiert nicht

- [ ] **Step 3: Das Schema erweitern**

In `packages/schema/src/coverage.ts`:

```ts
/**
 * Ein Platz für eine Variantendarstellung der Referenz (`…_Alternative.svg`, `…_2.svg`).
 *
 * Getrennt von `CoverageEntry` geführt, weil ein Eintrag eine Umsetzung **hat**
 * (`implementation` und `referenceAsset` dürfen nicht leer sein, `checkCoverage` prüft das)
 * — ein Slot dagegen erklärt, dass die Datei **bekannt** ist, mit oder ohne Umsetzung.
 * Ohne diese Trennung müssten unimplementierte Varianten entweder die Eintragsinvariante
 * aufweichen oder unsichtbar bleiben.
 */
export interface VariantSlot {
  /** Dateiname der Variantendatei. Die Datei selbst wird nie eingecheckt. */
  asset: string;
  /** Dateiname der Basisdarstellung, aus der der Variantenname abgeleitet ist. */
  baseAsset: string;
  variant: DepictionVariant;
  /** Semantische ID der Umsetzung, oder null solange dieser Slice sie nicht umsetzt. */
  implementation: string | null;
  review: Review;
}

export interface CoverageManifest {
  baseline: 'bbk-babz-2025';
  /** Kapitel und Anhänge, die dieser Slice beansprucht. */
  scope: readonly string[];
  entries: readonly CoverageEntry[];
  /** Variantendateien der Referenz, unabhängig von ihrer Umsetzung. */
  variants: readonly VariantSlot[];
}
```

- [ ] **Step 4: Die Deklaration anlegen**

`packages/catalog/src/variants.ts`. Die **Dateinamen** werden von Hand deklariert (das ist der Inhalt, den der Test gegen das Artefakt prüft); Basisdatei und Slot-Aufbau leitet Code ab, weil das mechanisch ist:

```ts
import type { Review, VariantSlot } from '@einsatzzeichen/schema';

/**
 * Die Variantendateien des Referenzbestands, von Hand deklariert.
 *
 * `variants.test.ts` prüft diese Liste gegen die Dateinamen im Kennzahlenartefakt.
 * Kommt eine Variante hinzu, schlägt der Test fehl, bis sie hier steht — deshalb die
 * Handarbeit statt einer Ableitung aus dem Artefakt: eine Ableitung wäre tautologisch
 * und könnte nichts zusichern.
 *
 * Keiner dieser Slots ist in diesem Slice umgesetzt (`implementation: null`). Die Liste
 * erfüllt Erfolgskriterium 4 der Spec („alle 31 Varianten-Dateien haben einen Slot"):
 * die Dateien sind deklariert und nicht stillschweigend abwesend.
 */
export const VARIANT_ASSETS = [
  '2.14_Escape Route_2.svg',
  '4.1.6_Atomare Stoffe_Alternative.svg',
  '4.1.7_Biologische Stoffe_Alternative.svg',
  '4.1.8_Chemische Stoffe_Alternative.svg',
  '4.7.10_Heben von Lasten oder Personen_Alternative.svg',
  '5.8.1.13_Hinweis auf Vermutung_2.svg',
  '5.8.1.14_Hinweis auf akute Situation_2.svg',
  '5.8.8.6_Person Kontaminiert_Alternative.svg',
  'C.2.14_Automatikdrehleiter_12-9_Alternative.svg',
  'C.2.15_Automatikdrehleiter_18-12_Alternative.svg',
  'C.2.16_Automatikdrehleiter_23-12_Alternative.svg',
  'C.2.17_Hubarbeitsbühne_Alternative.svg',
  'C.2.20_Gerätewagen Gefahrgut_Alternative.svg',
  'C.2.21_Gerätewagen Logistik 1_Alternative.svg',
  'C.2.22_Gerätewagen Logistik 2_Alternative.svg',
  'C.2.23_Mannschaftstransportfahrzeug 9-sitzig_Alternative.svg',
  'C.2.24_CBRN-Erkundungswagen_Alternative.svg',
  'C.2.25_Gerätewagen Dekontamination Personal_Alternative.svg',
  'C.2.26_Schlauchwagen Katastrophenschutz_Alternative.svg',
  'C.2.27_Feuerwehrkran 30_Alternative.svg',
  'C.2.28_Teleskoplader_Alternative.svg',
  'D.1.9_Zugtrupp einer Sanitätseinheit_Alternative.svg',
  'F.1.11_Rettungsdienst allgemein_Alternative.svg',
  'F.1.12_Nachbarschaftliche Soforthilfe_Alternative.svg',
  'F.1.15_Arzttrupp_Alternative.svg',
  'F.2.1_KTW_Alternative.svg',
  'F.2.2_NKTW_Alternative.svg',
  'F.2.3_RTW_Alternative.svg',
  'F.2.4_NEF_Alternative.svg',
  'F.2.5_NAW_Alternative.svg',
  'I.1.9_Bootstrupp Wasserrettungszug_Alternative.svg',
] as const satisfies readonly string[];

const PENDING: Review = { status: 'pending' };

/** Suffixe, die eine Variantendatei kennzeichnen. Beide bedeuten `alternative`. */
const SUFFIXES = ['_Alternative', '_2'] as const;

/** Schneidet das Variantensuffix ab und liefert den Namen der Basisdatei. */
function baseAssetOf(asset: string): string {
  const withoutExtension = asset.replace(/\.svg$/, '');
  for (const suffix of SUFFIXES) {
    if (withoutExtension.endsWith(suffix)) {
      return `${withoutExtension.slice(0, -suffix.length)}.svg`;
    }
  }
  throw new Error(
    `"${asset}" trägt kein bekanntes Variantensuffix (${SUFFIXES.join(', ')}). ` +
      'VARIANT_ASSETS darf nur Variantendateien enthalten.',
  );
}

export const VARIANT_SLOTS: readonly VariantSlot[] = VARIANT_ASSETS.map((asset) => ({
  asset,
  baseAsset: baseAssetOf(asset),
  variant: 'alternative',
  implementation: null,
  review: PENDING,
}));
```

- [ ] **Step 5: Ins Manifest hängen und im Gate prüfen**

In `packages/catalog/src/coverage-manifest.ts`:

```ts
import { VARIANT_ASSETS, VARIANT_SLOTS } from './variants.js';

export const COVERAGE_MANIFEST: CoverageManifest = {
  baseline: 'bbk-babz-2025',
  scope: ['1', '2', '4.3.1', '5.4', 'C.1.1', 'C.1.2', 'D.3.7'],
  entries: [...catalogEntries, ...recipeEntries],
  variants: VARIANT_SLOTS,
};
```

und `checkCoverage` um die Prüfung erweitern, dass kein Slot doppelt deklariert ist. Die Funktion vollständig:

```ts
/**
 * Prüft, ob jeder Manifest-Eintrag eine Referenzdatei nennt, ob die Schlüssel eindeutig sind,
 * ob jeder Katalogeintrag genau eine `primary`-Darstellung hat und ob keine Variantendatei
 * doppelt deklariert ist. Wird als CI-Gate ausgeführt.
 */
export function checkCoverage(): {
  missing: string[];
  duplicates: string[];
  invalidPrimary: string[];
  duplicateVariants: string[];
} {
  const seen = new Set<string>();
  const duplicates: string[] = [];
  const missing: string[] = [];

  for (const entry of COVERAGE_MANIFEST.entries) {
    const key = entryKey(entry.sourceId, entry.variant);
    if (seen.has(key)) duplicates.push(key);
    seen.add(key);
    if (entry.referenceAsset === '' || entry.implementation === '') missing.push(key);
  }

  const invalidPrimary = findPrimaryViolations(Object.values(BASE_SYMBOLS));

  const seenVariants = new Set<string>();
  const duplicateVariants: string[] = [];
  for (const asset of VARIANT_ASSETS) {
    if (seenVariants.has(asset)) duplicateVariants.push(asset);
    seenVariants.add(asset);
  }

  return { missing, duplicates, invalidPrimary, duplicateVariants };
}
```

Den Aufrufer in `packages/cli/src/commands/coverage.ts` erweitern, damit `duplicateVariants` gemeldet wird und nicht still verfällt — sonst prüft das Gate etwas, das niemand sieht. Die Datei vollständig:

```ts
import { COVERAGE_MANIFEST, checkCoverage } from '@einsatzzeichen/catalog';

export function coverage(): void {
  const { missing, duplicates, invalidPrimary, duplicateVariants } = checkCoverage();

  console.log(`Baseline: ${COVERAGE_MANIFEST.baseline}`);
  console.log(`Umfang:   ${COVERAGE_MANIFEST.scope.join(', ')}`);
  console.log(`Einträge: ${COVERAGE_MANIFEST.entries.length}`);
  console.log(`Varianten: ${COVERAGE_MANIFEST.variants.length}`);

  for (const key of duplicates) console.error(`Doppelter Schlüssel: ${key}`);
  for (const key of missing) console.error(`Unvollständiger Eintrag: ${key}`);
  for (const id of invalidPrimary) console.error(`Keine genau eine primary-Darstellung: ${id}`);
  for (const asset of duplicateVariants) console.error(`Doppelt deklarierte Variante: ${asset}`);

  if (
    duplicates.length > 0 ||
    missing.length > 0 ||
    invalidPrimary.length > 0 ||
    duplicateVariants.length > 0
  ) {
    process.exit(1);
  }
  console.log('Coverage-Gate bestanden.');
}
```

Und in `packages/catalog/src/index.ts` ergänzen:

```ts
export * from './variants.js';
```

- [ ] **Step 6: Tests grün**

Run: `pnpm typecheck && pnpm lint && pnpm test`
Expected: alle grün. Schlägt „deklariert genau die Variantendateien" fehl, ist **die Liste** anzupassen — die Ausgabe des Tests nennt die Differenz.

- [ ] **Step 7: Coverage-Gate laufen lassen**

Run: `pnpm cli coverage`
Expected: keine Befunde

- [ ] **Step 8: Falsifikationsnachweis**

Einen Eintrag aus `VARIANT_ASSETS` vorübergehend entfernen.
Run: `pnpm vitest run packages/catalog/src/variants.test.ts`
Expected: FAIL mit der fehlenden Datei in der Differenz. Danach zurück und grün sehen.

- [ ] **Step 9: Commit**

```bash
git add packages/schema/src/coverage.ts packages/catalog/src/variants.ts \
        packages/catalog/src/variants.test.ts packages/catalog/src/coverage-manifest.ts \
        packages/catalog/src/index.ts packages/cli/src/commands/coverage.ts
git commit -m "feat: Varianten-Slots im Coverage-Manifest deklarieren die 31 Alternativdateien"
```

---

## Task 13: Entscheidungsnotiz fortschreiben

Der Vorgänger-Slice hat gelernt, dass die wertvollste Arbeit die flüchtigste ist, wenn sie nur im gitignorierten `.superpowers/` steht. Dieser Task trägt die Messwerte dauerhaft ins Repository — als Fachdokument, nicht als Sitzungsprotokoll.

**Wichtig:** Die **Ausgangsmesswerte** stehen bereits eingecheckt in
`docs/decisions/2026-08-05-vermessung-kapitel-1-und-verwaltungsstufen.md` — Punkte 1 bis 5 der Liste unten sind dort schon vorhanden und **nicht neu zu schreiben.** Dieser Task **erweitert** jenes Dokument um die Zahlen, die erst durch die Umsetzung entstehen (Punkte 6 und 7), und prüft die vorhandenen Angaben gegen den neuen Stand. Ein zweites Dokument anzulegen würde die Quelle spalten.

**Files:**
- Modify: `docs/decisions/2026-08-05-vermessung-kapitel-1-und-verwaltungsstufen.md`
- Modify: `README.md` (Verweis)

**Interfaces:**
- Consumes: die Messwerte aus Tasks 5–9 und dem Planvorlauf
- Produces: nichts im Code

- [ ] **Step 1: Die Notiz fortschreiben**

`docs/decisions/2026-08-05-vermessung-kapitel-1-und-verwaltungsstufen.md` muss am Ende dieses Slice **mindestens** die folgenden Abschnitte tragen. Punkte 1–5 stehen dort bereits — gegenlesen und nur dort anfassen, wo die Umsetzung sie überholt hat. Punkte 6 und 7 sind neu zu schreiben:

1. **Zweck** — wie im Vorgängerdokument: die Referenz ist nie eingecheckt, die Zahlen hier sind abgeleitete Kennzahlen, dieses Dokument ist die dauerhafte Quelle.

2. **Warum Erfolgskriterium 1 der Spec nicht durch Vermessung schließbar ist.** Die Tabelle aus dem Abschnitt „Spec-Bezug" oben, vollständig: `1.3` Bezier-Oberkante mit Scheitel `(16|8)` und Ecken `(1|5,75)`/`(31|5,75)`; `1.4` Mittellinienhülle `1/8/31/23`; `1.5` `1/9/31/24`; `1.9` Extrema `1,52/3,23/31/28,322` — **keine glatten Entwurfsmaße, also weder Hülle noch Form belegbar**; `1.14` Rosette mit Mittellinienhülle `2/2/30/30`. Dazu Kapitel 3: `3.1` `0,8/5,8/31,2/8,2`, `3.9` `1,837/1,671/30,162/14,19`, `3.7`/`3.8` ohne vermessbare Form. Und der Satz, auf den es ankommt: Spec-Abschnitt 9 begründet die Geometrietreue für Kapitel 1–3 mit „Rechtecke, Kreise und Geraden auf einem Millimeterraster" — **das trifft für diese Zeichen nicht zu.** Wer sie will, muss eigene Kurven autorieren und gegen die vermessene Hülle gaten; das weicht die Treue-Entscheidung auf und braucht eine eigene Spec.

3. **Wie `1.13 Ereignis` zurückgerechnet wurde.** Die sechs Umrisspunkte, die Clustertabelle (Schwellen 0,6 / 1,0 / 1,5 / 2,0 mm mit Clusterzahl, Zentren und Trennung 21,633 mm), das Ergebnis `(4|7) → (16|25) → (28|7)` bei 0,5 mm, und die Begründung, warum das Kennzahlenableitung und kein Kopieren ist (dieselbe Mittelung wie `deriveRing`). Dazu die **Korrektur** der Entscheidungsnotiz des Vorgänger-Slice: dort steht, `1.13` sei „mit dem heutigen Gate nicht belegbar" und der `bounds`-Eintrag sei die Strich-Hülle `3,792/6,862/28,207/25,451`. Beides war für den damaligen Extraktor richtig; mit `deriveCenterline` ist es überholt. Ebenfalls dort geparkt und hier zu erledigen: die genannte Abweichung war die `minX`-Abweichung (0,590 Einheiten), die größere ist `maxY` (rund 1,28).

4. **Das Sternmodell der Verwaltungsstufen `5.7`** — vermessen, in diesem Slice **nicht** umgesetzt, für den nächsten festgehalten: Marke 5,446 × 6 mm, `cy 16`; Belegung `5.7.1 → [16]`, `5.7.2 → [10, 22]`, `5.7.3 → [10, 16, 22]`, `5.7.4 → [7, 13, 19, 25]`, `5.7.5 → [4, 10, 16, 22, 28]`, `5.7.6` zweireihig. Der Hinweis, der Arbeit spart: das ist eine um 16 zentrierte Reihe mit 6 mm Abstand, **mit `n = 2` als Ausnahme** (`10/22` statt der zentrierten `13/19`) — **dieselbe Ausnahme wie beim Stärkegrad `gruppe`**, wo die Mitte frei bleibt. Wer hier `row(n)` annimmt, verfehlt `5.7.2` um 3 mm.

5. **Warum `deriveCenterline` bei Zweifel `null` liefert.** Die drei Wachen (gerade Punktzahl, jeder Cluster genau zwei Punkte, Trennung mindestens dreifache Schwelle) und die Begründung aus Ruling 16: gemittelte Hüllen erzeugten bei schrägen Kanten still falsche Strichstärken, 91 von 150 Ringen waren betroffen.

6. **Wirkung der Extraktorschärfung.** Die Zahlen dafür stehen in der Ausgabe von Task 9 Step 4 und sind von dort zu übernehmen: Einträge mit leerem `shapes` (vorher **138**, nachher die dort gemessene Zahl), die Formartenverteilung (vorher `outline` 745, `rect` 302, `ring` 150, `bounds` 124, `circle` 102 — nachher die dort gemessene Verteilung), die Zahl der `centerline`-Einträge und die Aufteilung in vermessene gegen abgelehnte Kurvenpfade. Dazu die Feststellung, dass das Kommando-Alphabet des Bestands `C H L M S V Z c h l s v` ist und **kein** Bogenkommando enthält (0 von 661 Dateien) — deshalb lehnt der Parser `A`/`Q`/`T` ab statt zu nähern.

7. **Der Erzeugerstempel und was er verhindert** — I-1 aus dem Vorgängerreview, mit dem Hinweis, dass `EXTRACTOR_VERSION` bei jeder Änderung an `extract.ts` oder `path-geometry.ts` zu erhöhen ist.

8. **Was weiterhin fehlt und warum** — die Ausschlussliste aus dem Planabschnitt „Was dieser Plan ausdrücklich nicht umfasst", mit je einem Satz Begründung.

- [ ] **Step 2: README verweisen**

In `README.md` den bestehenden Verweis auf `docs/decisions/` so erweitern, dass beide Notizen genannt sind und erkennbar ist, dass die neue die `1.13`-Aussage der alten korrigiert.

- [ ] **Step 3: Gegenlesen gegen die Referenz**

Jede Zahl in der Notiz einmal selbst nachrechnen — nicht aus dem Plan übernehmen. Der Re-Reviewer des Vorgänger-Slice hat genau das getan und dabei zwei Fehlaussagen gefunden. Ein Rechenfehler in diesem Dokument ist teurer als in Code, weil ihn kein Test fängt.

- [ ] **Step 4: Commit**

```bash
git add docs/decisions/2026-08-05-vermessung-kapitel-1-und-verwaltungsstufen.md README.md
git commit -m "docs: Messwerte und Umfangsbegründung des Extraktor-Slice"
```

---

## Abschluss

- [ ] **Alle Gates zusammen**

Run: `pnpm typecheck && pnpm lint && pnpm test && pnpm cli coverage`
Expected: alles grün, keine Coverage-Befunde

- [ ] **CI-Bedingung ohne Referenzbestand**

```bash
mv taktische-zeichen taktische-zeichen.aus
pnpm typecheck && pnpm lint && pnpm test
mv taktische-zeichen.aus taktische-zeichen
```
Expected: grün

- [ ] **Determinismus des Artefakts**

Run: `pnpm cli audit:reference && git diff --exit-code packages/catalog/src/fingerprints.json`
Expected: kein Diff

- [ ] **Erreichter Stand gegen die Spec**

| Spec-Erfolgskriterium | Stand nach diesem Slice |
|---|---|
| 1 — Kapitel 1–3 geometrietreu | Kapitel 1: **9 von 14**. Nicht schließbar durch Vermessung; Begründung in `docs/decisions/` |
| 2 — drei Rezepte aus `SymbolSpec` | unverändert erfüllt |
| 3 — fünf unzulässige Kombinationen | unverändert erfüllt |
| 4 — `(sourceId, variant)` keyfähig, 31 Varianten mit Slot | **erfüllt** (Task 12) |
| 5 — CI ohne Referenzkorpus | unverändert erfüllt, erneut belegt |
| 6 — `core` ohne Laufzeitabhängigkeiten, SVG + Canvas aus einer IR | unverändert erfüllt |
| 7 — kein Eintrag ohne Quellen- und Reviewstatus | unverändert erfüllt |

- [ ] **Offen für den nächsten Slice**

1. Die fünf Kurven-Grundzeichen und Kapitel 3 — braucht eine Spec-Entscheidung zur Treue (Abschnitt 9).
2. `5.1.1`/`5.7` als Katalogeinträge — Kennzahlen liegen jetzt vor, es fehlt der Konsument in `CatalogPorts` und der Kopfzone von `compose()`.
3. Kapitel 2 als Einträge (`2.17`–`2.20` Grenzen brauchen ein Schemakonzept für Linien- und Flächengrenzen).
4. Teilprojekt F (Dokumentationswebsite) — laut Spec abhängig von C **und** D; ein minimaler Coverage-Report könnte früher nützlich sein als die Spec-Reihenfolge vorsieht.
