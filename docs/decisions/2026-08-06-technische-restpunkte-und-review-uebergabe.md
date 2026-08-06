# Technische Restpunkte und Fachreview-Übergabe

> Entscheidungsnotiz · 6. August 2026 · Umsetzung abgeschlossen

Setzt
`docs/superpowers/specs/2026-08-06-technische-restpunkte-und-review-uebergabe-design.md`
über den gleichnamigen Implementierungsplan um.

## 1. Ergebnis

Die beiden automatisierbaren Restpunkte sind geschlossen:

- `releaseBlockers().withoutTestEvidence` ist für den aktuellen Bestand leer, ohne fachfremde
  Tests als Nachweis auszugeben.
- Das Clipping-Gate kann alle acht aktuellen Grundkörper formtreu prüfen.

Die fachlichen Reviews wurden nicht automatisiert freigegeben. Stattdessen sind alle 37
Reviewträger einzeln inventarisiert, verdrahtet, formal validiert und in der CLI sichtbar.

## 2. Typisierte Testevidenz

Die universellen Booleans `fingerprintTest` und `snapshotTest` sind durch fünf konkrete
Nachweisarten ersetzt:

- `body-fingerprint`
- `svg-snapshot`
- `reference-fill`
- `head-shape-regression`
- `pictogram-contract`

Die Policy ist über alle `ElementKind`-Varianten exhaustiv. Grundzeichen, Rezepte,
Organisationen, Stärken und Piktogramme binden ihre Claims jeweils per Set-Gleichheit an die
tatsächlich iterierten Testfälle. Fehlende, doppelte und artfremde Claims sind Gate-Befunde.

## 3. Geometrievertrag

`checkClipping()` prüft Rechtecke einschließlich Rotation, Kreise und geschlossene einfache
konvexe Polygone gegen die tatsächliche Fläche. Die Regressionen erfassen insbesondere:

- AABB-Falschpositive bei Kreis, Personendiamant und Dreieck;
- beide Polygon-Umlaufrichtungen und doppelte Umläufe;
- Randtangenz und eine vorzeichensensitive asymmetrische Rotation;
- negative oder nichtendliche Boxwerte;
- Transformationen direkt an Pfad-Primitiven.

Nicht vermessene Flächen bleiben explizit abgelehnt. Die technische Flächenabdeckung ist keine
fachliche Zulässigkeitsmatrix: Die vorhandenen Kapitel-4-Piktogramme sind weiterhin nur für
`formation` autorisiert.

## 4. Review- und Quellen-Governance

`packages/catalog/src/domain-reviews.ts` besitzt genau ein eigenes Domain-Reviewobjekt je
Manifest-, Quellen- und Profilträger. Tests erzwingen Deckungsgleichheit und Objektunabhängigkeit.
Ein formal ungültiges `approved` bleibt ein Release-Blocker.

Abgeschlossene Reviews brauchen Reviewer und kalendarisch gültiges ISO-Datum. Eine fachliche
Freigabe braucht zusätzlich eine Befundnotiz oder einen Protokollverweis; `deviation` braucht eine
konkrete Begründung und blockiert nach der geltenden 1.0-Regel weiterhin.

Die BABZ-Quelle zeigt nun auf die
[offizielle Statusseite](https://lernplattform-babz-bund.de/goto.php?target=cat_109540). Der lokal
archivierte Arbeitsstand ist als projektinterne Coverage-Baseline bezeichnet, nicht als geltende
eigenständige Dienstvorschrift. Die vollständige menschliche Prüfliste steht in
`docs/reviews/2026-08-06-domain-review-handoff.md`.

## 5. Verifikation

- **41 Testdateien, 487 Tests:** grün
- **TypeScript:** keine Fehler
- **Coverage-CLI:** 37 offene Fachreviews, 0 Testnachweislücken, 0 Scope-Lücken
- **`git diff --check`:** sauber
- **pnpm/Corepack:** exakt auf die bereits gelockte Version 11.20.0 gepinnt

## 6. Verbleibende Grenze

Technisch ist der Weg für den nächsten D-Slice frei. Für Release 1.0 bleiben die 37 tatsächlichen
fachlichen Entscheidungen durch eine benannte Person mit einsatztaktischer Fachkunde offen.
Außerdem bleiben `accessible-light` an die deklarierte weiße Oberfläche und
`print-monochrome` an einen deterministischen digitalen Nachweis gebunden; beide ersetzen keine
physische Druck- oder ICC-Zertifizierung.
