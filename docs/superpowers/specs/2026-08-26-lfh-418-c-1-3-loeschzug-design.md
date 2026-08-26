# LFH-418 — C.1.3 Löschzug: Design-Spec

> Design-Spec · 26. August 2026 · Status: freigegeben, nach visueller QA korrigiert

## 1. Ziel und belegter Ausgangspunkt

LFH-418 beschreibt den noch nicht zugeschnittenen Rest von Anhang C. Der lokale
Referenzbestand und das Manifest bestätigen seine Kennzahlen:

| Bereich | Referenzdarstellungen | Manifestzeilen | offen |
|---|---:|---:|---:|
| C.1 Einheiten | 15 | 2 (`C.1.1`, `C.1.2`) | 13 |
| C.2 Fahrzeuge | 44 in 31 Abschnitten | 0 | 44 |
| **Gesamt** | **59** | **2** | **57** |

Ein einzelner PR für alle 57 offenen Darstellungen wäre kein prüfbarer Slice. Dieser
Entwurf schneidet deshalb genau den ersten eigenständig lieferbaren Abschnitt aus:

**`C.1.3` — Löschzug einer Feuerwehr.**

Der PR liefert ein neues Katalogrezept, vollständige technische Gates, ein aktuelles
technisches Review, ein weiterhin offenes fachliches Review und einen referenzfreien
Screenshot der generierten Katalogausgabe.

## 2. Abgrenzung

### Im Scope

- Rezept `recipe.C.1.3` mit `formation`, `feuerwehr`, Stärke `zug` und der
  randbündigen, für C.1 vermessenen Brandbekämpfungsmarke `fire-fighting`.
- Notwendige Bestandskorrektur: C.1.1 und C.1.2 verwenden dieselbe vermessene
  Körpermarke statt der eigenständigen Kapitel-4-Boxfassung; ihr beanspruchter
  Manifest-Scope ändert sich dadurch nicht.
- Manifestzeile `bbk-babz-2025:C.1.3#primary`.
- Exakter beanspruchter Scope `C.1.3`.
- Aktuelles technisches Review für diesen Slice.
- Fachreview mit Status `pending`.
- Direkter SVG-Snapshot und Mehrgrößen-/Theme-Snapshot.
- Entscheidung, visuelles QA-Protokoll und ein katalog-only PNG als PR-Beleg.
- ClickUp-Subtask unter LFH-418 für diesen ausführbaren Slice.

### Nicht im Scope

- Kein gemeinsamer Scope `C.1` oder `C`: Beide würden Vollständigkeit vortäuschen.
- Keine Umsetzung von `C.1.4` bis `C.1.15` oder von C.2.
- Kein neuer Schema-, Core-, Renderer- oder Fahrzeugmechanismus und keine Änderung
  der eigenständigen Kapitel-4-Piktogrammfassung. Die vorhandene `bodyMarks`-Schnittstelle
  erhält ausschließlich die an C.1.1 bis C.1.3 vermessene formationsgebundene Fassung.
- Keine fachliche Freigabe des Zeichens; das Domainreview bleibt bewusst offen.
- Kein Upload, Commit oder sonstige Veröffentlichung der lokalen
  BABZ-Referenzdatei oder eines Referenz-vs.-Katalog-Bildes.
- Kein Merge des PRs und kein Abschluss von LFH-418.

## 3. Kompositionsentscheidung

`C.1.3` verwendet bestehende Bausteine und die vorhandene Schnittstelle für
randbündige, eigenständig vermessene Körpermarken:

```ts
{
  kind: 'formation',
  organization: 'feuerwehr',
  strength: 'zug',
  bodyMarks: ['fire-fighting'],
}
```

Die Stärke `zug` ist im Katalog mit drei Kreismarken bei `cx = 11 / 16 / 21 mm`,
`cy = 3,5 mm` und `r = 1,5 mm` hinterlegt. Der Formationskörper liegt bei
`x = 1…31 mm` und `y = 6…26 mm`. Die C.1-Fassung der Brandbekämpfungsmarke
besteht aus der waagerechten Linie `(1|16) → (21|16)` und den beiden Diagonalen
`(21|16) → (31|6)` sowie `(21|16) → (31|26)`. Es gibt keinen waagerechten Ast
vom Verzweigungspunkt nach rechts.

Eine read-only Probe der zuerst angenommenen Box-Komposition bestand vor der
Implementierung Fingerprint-, A11y- und ViewBox-Prüfung ohne Befund. Diese Gates
prüfen jedoch nicht die Innengeometrie gegen die Referenz. Der verpflichtende
Sichtvergleich nach Task 1 zeigte den zusätzlichen rechten Horizontalast und
widerlegte damit die Annahme. Die Kapitel-4-Boxfassung selbst bleibt korrekt;
C.1 benötigt die bereits architektonisch vorgesehene randbündige Darstellungsform.

## 4. Manifest-, Review- und Scope-Vertrag

Das neue Rezept erhält eine eigene Manifestzeile und ein technisches Review vom
26. August 2026. Es darf nicht auf das historische Fallback-Review vom 5. August
fallen, weil dieses `C.1.3` nicht geprüft hat.

Der beanspruchte Umfang wächst ausschließlich um `C.1.3`. Erst wenn
`C.1.1` bis `C.1.15` vollständig umgesetzt und durch einen expliziten
Lückenlosigkeitstest belegt sind, dürfen die Einzelzeilen zu `C.1` verdichtet
werden.

Das fachliche Review wird als
`bbk-babz-2025:C.1.3#primary -> pending` eingetragen. Technische Übereinstimmung
ist keine fachliche Bestätigung der Benennung oder Bedeutung.

## 5. Tests und Akzeptanzkriterien

Der Slice ist technisch akzeptiert, wenn alle folgenden Aussagen durch Tests oder
Artefakte belegt sind:

1. `recipe.C.1.3` enthält exakt die oben beschriebene Komposition mit
   `bodyMarks: ['fire-fighting']`.
2. Die drei Kopfmarken liegen bei `cx = 11 / 16 / 21 mm`, `cy = 3,5 mm`,
   `r = 1,5 mm`.
3. Körper und Brandbekämpfungszeichen entsprechen dem vermessenen C.1-Vertrag:
   linker Stamm bis `(21|16)`, genau zwei rechte Diagonalen und kein rechter
   Horizontalast.
4. C.1.1, C.1.2 und C.1.3 verwenden dieselbe Körpermarke und unterscheiden sich
   weiterhin nur in ihrer Stärke.
5. Fingerprint-, A11y- und ViewBox-Gates melden keinen Befund.
6. Direkter Snapshot sowie alle Mehrgrößen-/Theme-Darstellungen sind stabil und
   frei von Clipping.
7. Das Manifest führt genau eine neue Zeile; der Scope wächst nur um `C.1.3`.
8. Das technische Review ist aktuell und das Domainreview bleibt `pending`.
9. Die vollständige Suite, Typecheck, `pnpm cli coverage` und
   `git diff --check` sind grün.
10. Ein unabhängiger Code- und Spec-Review findet keinen offenen Pflichtbefund.

Die bei der Umsetzung zunächst geprüfte Baseline auf `d7661bf` lautete 60 Testdateien,
4.074 Tests, 427 Manifesteinträge und 441 offene Reviews. Vor dem Gesamt-Review wurde der
unveröffentlichte Branch erneut auf `origin/main` (`41bd895`) rebased und mit dessen
I-a-Wasserfahrzeug-Slice additiv zusammengeführt. Der danach frisch geprüfte Branchstand lautet:
60 Testdateien, 4.126 Tests, Typecheck ohne Fehler, 431 Manifesteinträge, 445 offene Reviews und
bestandenes Coverage-Gate.

## 6. Visueller Nachweis und Lizenzgrenze

Lokal wird die generierte Ausgabe gegen die vorhandene Referenz geprüft. Diese
Paarbilder, ihr Hashmanifest und Hilfsartefakte bleiben unter `out/` und damit
ignoriert.

Für GitHub wird ausschließlich
`docs/reviews/assets/2026-08-26-c-1-3-catalog.png` versioniert und im PR
eingebettet. Das PNG zeigt nur die von diesem Projekt generierte Katalogausgabe
in den unterstützten Themes und Größen. Es enthält weder das BABZ-Referenzbild
noch daraus kopierte Pfaddaten.

Das textuelle QA-Protokoll
`docs/reviews/2026-08-26-c-1-3-visual-qa.md` hält mindestens fest:

- Kopfmarken, Körper und Innenzeichen;
- Darstellung in allen vorhandenen Themes und Größen;
- Metadaten, ViewBox und Clipping;
- lokalen Vergleich gegen die Referenz, ohne diese zu reproduzieren;
- den weiterhin offenen fachlichen Reviewstatus.

## 7. ClickUp-, Branch- und PR-Lebenszyklus

- LFH-418 wechselt von `backlog` zu `scoping` und bleibt als Parent offen.
- Unter LFH-418 entsteht der ausführbare Subtask
  **„C-a — Löschzug einer Feuerwehr C.1.3“** mit Ergebnis, Nicht-Zielen,
  Akzeptanzkriterien und Verifikationspfad aus dieser Spec.
- Nur der Subtask läuft über `ready for development`, `in development`,
  `in review` bis höchstens `testing`, solange der PR nicht gemergt ist.
- Der Branch heißt `codex/lfh-418-c-1-3-loeschzug` und basiert auf dem frisch
  abgeglichenen `origin/main`.
- GitHub erhält einen Draft-PR gegen `main` mit Ticketlinks, Gate-Zahlen,
  Screenshot und klarer Restabgrenzung: 56 Darstellungen bleiben offen.
- `shipped` oder `done` sind ohne Merge nicht zulässig; LFH-418 wird durch diesen
  PR keinesfalls abgeschlossen.

## 8. Erwartete Dateien

Geändert oder neu angelegt werden ausschließlich:

- `packages/catalog/src/recipes.ts`
- `packages/catalog/src/recipes.test.ts`
- `packages/catalog/src/body-marks.ts`
- `packages/catalog/src/body-marks.test.ts`
- `packages/catalog/src/coverage-manifest.ts`
- `packages/catalog/src/coverage-manifest.test.ts`
- `packages/catalog/src/domain-reviews.ts`
- `packages/catalog/src/domain-reviews.test.ts`
- `packages/catalog/src/render-cases.test.ts`
- `packages/catalog/src/snapshots.test.ts`
- `packages/catalog/src/multi-size-snapshots.test.ts`
- `packages/catalog/src/__snapshots__/C.1.3.svg`
- `packages/catalog/src/__snapshots__/C.1.1.svg`
- `packages/catalog/src/__snapshots__/C.1.2.svg`
- `packages/catalog/src/__snapshots__/multi-size/recipe.C.1.1.svg`
- `packages/catalog/src/__snapshots__/multi-size/recipe.C.1.2.svg`
- `packages/catalog/src/__snapshots__/multi-size/recipe.C.1.3.svg`
- `packages/cli/src/commands/coverage.test.ts`
- `README.md`
- `docs/decisions/2026-08-26-anhang-c-zuschnitt.md`
- `docs/reviews/2026-08-26-c-1-3-visual-qa.md`
- `docs/reviews/assets/2026-08-26-c-1-3-catalog.png`
- diese Design-Spec und der daraus folgende Implementierungsplan

Eine Änderung an `fingerprints.json` ist nicht vorgesehen: Der Messwert für
`C.1.3` ist bereits vorhanden.
