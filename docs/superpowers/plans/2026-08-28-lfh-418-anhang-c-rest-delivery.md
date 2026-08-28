# LFH-418 Anhang C Rest — Delivery Program

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development`
> (recommended) or `superpowers:executing-plans` to implement each referenced slice plan
> task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Den projektlokalen `clickup-dev`-Ablauf etablieren und danach die 56 noch fehlenden
Darstellungen des Anhangs C in zehn fachlich abgegrenzten PR-Slices bis zu verifiziertem
`main` und ClickUp-Status `shipped` liefern.

**Architecture:** Dieses Dokument ist der verbindliche Programmplan für Reihenfolge,
Zustandsübergänge, Abhängigkeiten und Abnahmegates. Der Skill-Bootstrap und jeder Produktslice
erhalten einen eigenen detaillierten Implementierungsplan, weil Referenzmessung, RED/GREEN-Vertrag
und Dateisurface pro Subsystem unterschiedlich sind. Es wird immer nur ein Slice bis zum
menschlichen PR-Approval-Gate geführt; nach Approval folgen Merge, frische Main-Verifikation und
erst dann `shipped`.

**Tech Stack:** TypeScript 5.9, Vitest 3.2, pnpm 11.20 unter Node 22 via mise, Git/GitHub,
ClickUp und projektlokale Codex Skills.

**Spec:** `docs/superpowers/specs/2026-08-28-lfh-418-anhang-c-rest-clickup-dev-design.md`

## File Map

- `docs/superpowers/plans/2026-08-28-lfh-418-clickup-dev-bootstrap.md` — ausführbarer Plan für
  Liefergegenstand 0.
- Create later, then independently review before execution:
  `docs/superpowers/plans/2026-08-28-lfh-418-c1-b.md` — C.1.4 bis C.1.6.
- Create later, then independently review before execution:
  `docs/superpowers/plans/2026-08-28-lfh-418-c1-c.md` — C.1.7 bis C.1.12.
- Create later, then independently review before execution:
  `docs/superpowers/plans/2026-08-28-lfh-418-c1-d.md` — C.1.13 bis C.1.15.
- Create later, then independently review before execution:
  `docs/superpowers/plans/2026-08-28-lfh-418-c2-a.md` — C.2.1 bis C.2.13.
- Create later, then independently review before execution:
  `docs/superpowers/plans/2026-08-28-lfh-418-c2-b.md` — C.2.14 bis C.2.17 einschließlich
  Alternativen.
- Create later, then independently review before execution:
  `docs/superpowers/plans/2026-08-28-lfh-418-c2-c.md` — C.2.18 sowie C.2.20 bis C.2.23
  einschließlich Alternativen.
- Create later, then independently review before execution:
  `docs/superpowers/plans/2026-08-28-lfh-418-c2-d.md` — C.2.24 bis C.2.28 einschließlich
  Alternativen.
- Create later, then independently review before execution:
  `docs/superpowers/plans/2026-08-28-lfh-418-c2-e.md` — C.2.19.
- Create later, then independently review before execution:
  `docs/superpowers/plans/2026-08-28-lfh-418-c2-f.md` — C.2.29 und C.2.30.
- Create later, then independently review before execution:
  `docs/superpowers/plans/2026-08-28-lfh-418-c2-g.md` — C.2.31.
- `.agents/skills/clickup-dev/` — versionierter Zustandsautomat, Projektvertrag und Templates.
- `packages/catalog/src/recipes-anhang-c.ts` — getrennte Rezeptregister der zehn Produktslices.
- `packages/catalog/src/recipes.ts` — zentraler Integrationspunkt für die Anhang-C-Register.
- `packages/schema/src/`, `packages/catalog/src/` und `packages/cli/src/` — nur die durch den
  jeweils vermessenen Slice belegten Schema-, Geometrie-, Manifest-, Review- und Gateänderungen.
- `docs/decisions/` — je Slice die veröffentlichbare Mappingmatrix ohne Referenzpfade.
- `docs/reviews/` und `docs/reviews/assets/` — textuelle QA und katalogeigene PR-Screenshots.
- `out/lfh-418/` — ignorierte lokale Mess-, Paarbild- und Referenzartefakte; niemals committen.

## Global Constraints

- Die Reihenfolge ist Bootstrap, C1-b, C1-c, C1-d, C2-a, C2-b, C2-c, C2-d, C2-e, C2-f,
  C2-g. Ein späterer Slice beginnt erst, wenn der vorherige auf verifiziertem `main` liegt und sein
  ClickUp-Subtask `shipped` ist.
- Der Bootstrap zählt null Darstellungen. Die Produktzahlen sind exakt
  `3 + 6 + 3 + 13 + 8 + 9 + 10 + 1 + 2 + 1 = 56`.
- Vor jeder Mutation werden Task, Liste, Statuswerte, Git-Remote, `origin/main` und der
  projektlokale Skillvertrag live gelesen. Widersprüche stoppen den jeweiligen Schritt.
- Jeder Slice verwendet einen eigenen `codex/`-Branch und einen isolierten Worktree auf aktuellem
  `origin/main`. Mehrere schreibende Agenten teilen weder Checkout noch zentrale Registerdateien.
- Implementierung beginnt mit einem beobachteten RED. Ein Test, der wegen Syntax, Imports,
  Berechtigungen oder Umgebung statt der fehlenden Funktion scheitert, ist kein gültiges RED.
- Original-SVGs, daraus gerenderte Raster, Paarbilder, lokale absolute Referenzpfade und private
  Metadaten bleiben ignoriert und werden weder committed noch in PR oder Chat veröffentlicht.
- Jede neue fachliche Bedeutung bleibt `pending`, bis eine echte Domainprüfung erfolgt. Technische
  Geometriegates sind keine fachliche Freigabe.
- Kein Fahrzeugtyp, keine Fähigkeit und keine Semantik wird aus dem Referenzdateinamen abgeleitet.
  Unbestätigte, aber vermessene Formen erhalten neutrale technische IDs und fail-closed Resolver.
- Ein Produktslice besitzt direkte sowie Mehrgrößen-/Theme-Snapshots, Manifest- und Reviewzeilen,
  ViewBox-/Accessibility-/Kontrastgates, katalogeigene Screenshots und lokalen Referenzvergleich.
- Vor jedem Draft-PR müssen `rtk pnpm test`, `rtk pnpm typecheck`,
  `rtk pnpm cli coverage`, `rtk git diff --check` und ein sauberer Status grün sein.
- Der Chat-Wartepunkt benennt PR, Branch, exakten HEAD, Gateergebnisse, Screenshot und offene
  Domainreviews. Approval gilt ausschließlich für diesen HEAD.
- Ohne ausdrückliches Approval kein Merge. Nach materieller HEAD-Änderung ist neues Approval nötig.
- Nach Merge werden dieselben Vollgates auf dem effektiven Remote-`main` frisch ausgeführt. Erst
  danach wird der Slice-Subtask `shipped`.
- Der Ablauf setzt keinen Task automatisch auf `done`.
- LFH-418 wird erst bei 59/59, zehn `shipped`-Produktsubtasks und grünem letztem Main-Gate auf
  `shipped` gesetzt.

## Task 1: Bootstrap als vorgeschaltete Lieferfähigkeit

**Plan:** `docs/superpowers/plans/2026-08-28-lfh-418-clickup-dev-bootstrap.md`

- [ ] Führe den Bootstrap-Plan vollständig bis zum Draft-PR- und Chat-Screenshot-Wartepunkt aus.
- [ ] Halte vor dem Merge an und nenne PR, Branch und exakten HEAD.
- [ ] Nach ausdrücklichem Approval: prüfe, dass HEAD und CI unverändert grün sind, merge nach
  Repositoryverfahren, synchronisiere den effektiven Remote-`main` und führe dort die Vollgates
  aus.
- [ ] Setze ausschließlich den technischen Bootstrap-Subtask auf `shipped`; LFH-418 bleibt offen
  und zählt weiterhin 3/59.
- [ ] Prüfe auf `main` mit dem offiziellen Validator, dass `.agents/skills/clickup-dev` nutzbar ist.

## Task 2: C1-b — C.1.4 bis C.1.6

**Plan:** `docs/superpowers/plans/2026-08-28-lfh-418-c1-b.md`

- [ ] Messe C.1.4, C.1.5 und C.1.6 direkt und versioniere eine Drei-Zeilen-Mappingmatrix ohne
  private Pfade: technische Hilfeleistungsform, `FZ-`-Textvertrag sowie Einzelbalken/`FB`/
  Brandbekämpfungsmarke.
- [ ] Schreibe den Detailplan mit literalem Rezept-, Geometrie-, Text-, Manifest-, Review- und
  Snapshotvertrag; führe ihn per RED/GREEN bis zum Approval-Wartepunkt aus.
- [ ] Nach Approval, Merge und grünem Main-Gate: Subtask `shipped`; erwarteter Gesamtstand 6/59.

## Task 3: C1-c — C.1.7 bis C.1.12

**Plan:** `docs/superpowers/plans/2026-08-28-lfh-418-c1-c.md`

- [ ] Belege vor dem Plan die Geometrieidentität C.1.7/C.1.9/C.1.12 sowie
  C.1.8/C.1.10; vermesse `P`, `G`, `ATF` und C.1.11 unabhängig.
- [ ] Schreibe und führe den Detailplan für sechs Rezeptzeilen, geteilte vermessene Markierungen,
  fail-closed Kontexte und sechs eigenständige `pending`-Domainreviews aus.
- [ ] Nach Approval, Merge und grünem Main-Gate: Subtask `shipped`; erwarteter Gesamtstand 12/59.

## Task 4: C1-d — C.1.13 bis C.1.15

**Plan:** `docs/superpowers/plans/2026-08-28-lfh-418-c1-d.md`

- [ ] Vermesse die beiden Drohnenformen getrennt und vergleiche C.1.15 direkt mit vorhandenen
  Wasserrettungsmarken; dokumentiere Unterschiede statt semantischer Gleichsetzung.
- [ ] Schreibe und führe den Detailplan für drei neutrale technische Marken, Kontextfehler,
  Rezepte, Reviews und visuelle Gates aus.
- [ ] Nach Approval, Merge und grünem Main-Gate: Subtask `shipped`; erwarteter Gesamtstand 15/59.

## Task 5: C2-a — C.2.1 bis C.2.13

**Plan:** `docs/superpowers/plans/2026-08-28-lfh-418-c2-a.md`

- [ ] Erstelle vor Coding 13 belegte Mappingzeilen für Hülle, Fahrwerk, Innenform, Text und
  Reviewstatus; Titel dürfen nur Identifikatoren, niemals Kategorienachweis sein.
- [ ] Schreibe und führe den Detailplan aus, der das normale Feuerwehr-Fahrzeugregister etabliert
  und alle 13 Darstellungen einzeln manifestiert, snapshotet und visuell prüft.
- [ ] Nach Approval, Merge und grünem Main-Gate: Subtask `shipped`; erwarteter Gesamtstand 28/59.

## Task 6: C2-b — C.2.14 bis C.2.17 mit Alternativen

**Plan:** `docs/superpowers/plans/2026-08-28-lfh-418-c2-b.md`

- [ ] Vermesse vier Primär-/Alternativpaare und dokumentiere jeden sichtbaren Delta in acht
  separaten Mappingzeilen.
- [ ] Schreibe und führe den Detailplan für `C.2.14#alternative` bis
  `C.2.17#alternative` als eigenständige Rezept-, Manifest-, Review- und Snapshotvarianten aus.
- [ ] Nach Approval, Merge und grünem Main-Gate: Subtask `shipped`; erwarteter Gesamtstand 36/59.

## Task 7: C2-c — C.2.18 sowie C.2.20 bis C.2.23 mit Alternativen

**Plan:** `docs/superpowers/plans/2026-08-28-lfh-418-c2-c.md`

- [ ] Vermesse eine Primärdarstellung und vier Primär-/Alternativpaare als neun unabhängige
  Mappingzeilen; belege Textmetriken und Innenmarken separat.
- [ ] Schreibe und führe den Detailplan für neun vollständige Darstellungsverträge aus.
- [ ] Nach Approval, Merge und grünem Main-Gate: Subtask `shipped`; erwarteter Gesamtstand 45/59.

## Task 8: C2-d — C.2.24 bis C.2.28 mit Alternativen

**Plan:** `docs/superpowers/plans/2026-08-28-lfh-418-c2-d.md`

- [ ] Vermesse fünf Primär-/Alternativpaare als zehn unabhängige Mappingzeilen; führe für jede
  neu benötigte technische Markierung explizite zulässige und unzulässige Kontexte auf.
- [ ] Schreibe und führe den Detailplan für zehn vollständige Darstellungsverträge aus.
- [ ] Nach Approval, Merge und grünem Main-Gate: Subtask `shipped`; erwarteter Gesamtstand 55/59.

## Task 9: C2-e — C.2.19 Sonderkörper

**Plan:** `docs/superpowers/plans/2026-08-28-lfh-418-c2-e.md`

- [ ] Vermesse Kontur, Körperbounds, Platzierung, Fahrwerk und Innenform vollständig und belege,
  ob eine neue Körpervariante statt normaler oder vorhandener Swap-Loader-Hülle nötig ist.
- [ ] Schreibe und führe den Detailplan für genau eine Darstellung mit fail-closed Körpervertrag
  und vollständigen Rendergates aus.
- [ ] Nach Approval, Merge und grünem Main-Gate: Subtask `shipped`; erwarteter Gesamtstand 56/59.

## Task 10: C2-f — C.2.29 und C.2.30 Anhänger

**Plan:** `docs/superpowers/plans/2026-08-28-lfh-418-c2-f.md`

- [ ] Bestätige die vorhandene Anhängerhülle sowie Radzahl, Innenmarke und Textzonen je
  Darstellung direkt aus der Quelle.
- [ ] Schreibe und führe den Detailplan für zwei getrennte Anhängerrezepte und alle Gates aus.
- [ ] Nach Approval, Merge und grünem Main-Gate: Subtask `shipped`; erwarteter Gesamtstand 58/59.

## Task 11: C2-g — C.2.31 geschützte Löschdrohne

**Plan:** `docs/superpowers/plans/2026-08-28-lfh-418-c2-g.md`

- [ ] Vergleiche die Quelle vollständig mit der vorhandenen invertierten Kettenhülle; Bounds-
  Ähnlichkeit allein ist kein Wiederverwendungsnachweis.
- [ ] Schreibe und führe den Detailplan für genau eine belegte Körper-, Fahrwerks- und
  Innenmarkenkombination aus.
- [ ] Nach Approval, Merge und grünem Main-Gate: Subtask `shipped`; erwarteter Gesamtstand 59/59.

## Task 12: LFH-418 Abschluss ohne automatische Abnahme

- [ ] Synchronisiere den effektiven Remote-`main` und führe genau einen vollständigen Lauf aus:

  ```bash
  rtk pnpm test
  rtk pnpm typecheck
  rtk pnpm cli coverage
  rtk git diff --check
  rtk git status --short --branch
  ```

  Expected: alle Prozesse Exit 0, Coverage meldet Anhang C vollständig, Diff-Check ohne Ausgabe
  und der Main-Checkout ist sauber.

- [ ] Lese ClickUp live und belege zehn `shipped`-Produktsubtasks; der technische Bootstrap ist
  separat und zählt nicht zu 59/59.
- [ ] Prüfe Manifest-Lückenlosigkeit: C.1.1 bis C.1.15, C.2.1 bis C.2.31 sowie genau 13
  `#alternative`-Darstellungen in C.2.14 bis C.2.17 und C.2.20 bis C.2.28.
- [ ] Setze LFH-418 erst nach diesen drei Belegen auf `shipped`.
- [ ] Lese LFH-418 erneut und berichte den effektiven Status, Remote-Main-HEAD, 59/59-Coverage und
  weiterhin offene `pending`-Domainreviews. Setze LFH-418 nicht auf `done`.
