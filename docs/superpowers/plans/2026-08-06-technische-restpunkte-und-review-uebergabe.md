# Technische Restpunkte und Review-Übergabe — Implementierungsplan

> Spec: `docs/superpowers/specs/2026-08-06-technische-restpunkte-und-review-uebergabe-design.md`

## Task 1: Testevidenzmodell

- [x] `TestEvidenceKind` und `CoverageEntry.testEvidence` einführen; die zwei universellen
  Booleans entfernen.
- [x] Manifest auf die realen Nachweisarten je Eintrag migrieren.
- [x] Pflichtmengen sowie unbekannte, doppelte und unzulässige Claims im Coverage-Gate prüfen.
- [x] Claims per Set-Gleichheit an Render-, Organisations-, Stärke- und Piktogrammtests binden.
- [x] `withoutTestEvidence` auf tatsächlich fehlende Pflichtnachweise umstellen.

## Task 2: Flächen-Clipping

- [x] Rechteck und gedrehtes Rechteck exakt prüfen.
- [x] Kreisfläche exakt prüfen.
- [x] geschlossene konvexe Polygone orientierungsunabhängig prüfen.
- [x] offene, konkave, selbstüberschneidende oder entartete Flächen weiter explizit ablehnen.
- [x] negative/nichtendliche Boxen und transformierte Pfad-Primitive explizit ablehnen.
- [x] doppelte Polygonumläufe und die Drehrichtung mit asymmetrischer Regression absichern.
- [x] Katalogtest mit zentraler Box über alle acht vorhandenen Körper ergänzen.

## Task 3: Review- und Quellenübergabe

- [x] falschen Hauptdokument-Link und die Aussage amtlicher Verbindlichkeit korrigieren.
- [x] aktuellen BABZ-/AFKzV-Status mit Prüfdatum dokumentieren.
- [x] Übergabedossier für alle 24 Manifest-, zwölf Quellen- und ein Profilreview erstellen.
- [x] eigenes Domain-Reviewobjekt je Manifest-, Quellen- und Profilträger sowie formale
  Reviewvalidierung einführen.
- [x] offene Manifest-, Quellen- und Profilreviews getrennt in der Coverage-CLI ausweisen.
- [x] keine `domain`-Freigabe ohne benannte einsatztaktische Fachperson setzen.

## Task 4: Abschluss

- [x] gezielte Regressionstests ausführen.
- [x] vollständige Tests und Typecheck ausführen.
- [x] Coverage-CLI auf null technische Nachweislücken prüfen.
- [x] unabhängiges Review und `git diff --check` abschließen.
