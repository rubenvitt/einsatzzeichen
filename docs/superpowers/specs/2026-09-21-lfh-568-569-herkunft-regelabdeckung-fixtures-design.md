# LFH-568 und LFH-569: Herkunft, Regelabdeckung, Fixtures und benannte Ausnahmen

> Stand: 21. September 2026
> Initiative: LFH-559 (Zeichen-Grammatik). Vorgänger: LFH-562, LFH-563, LFH-564.
> Scope: `docs/decisions/2026-09-13-grammatik-motor-und-paketschnitt.md`

## Auftrag aus der Scope-Entscheidung (wörtlich)

> **Herkunft**: `verbatim`, wenn zur Kombination ein Original existiert und der Vergleich besteht;
> sonst `derived`. Beide Werte kennt die Vision bereits als `SourceStatus`.

> Das Maß der Abdeckung wechselt von Zeichenabdeckung zu **Regelabdeckung**: nicht „wie viele der
> 661 Originale sind gebaut", sondern „welche Regeln der Systematik sind belegt".

> Die 242 heutigen Rezepte wechseln damit ihre Rolle: von „fertigen Zeichen" zu Fixtures, die den
> Motor belegen. Je Zeichen gemessene Sonderwerte (etwa die einzeln gemessenen Schriftgrade des
> mittigen Laufs in Anhang E) werden entweder zur Regel oder bleiben als **benannte Ausnahme**
> sichtbar — nie als stiller Sonderpfad.

## Entscheidung des Eigentümers vom 21. September 2026

**Eine Regel gilt als belegt, wenn ein Testfall sie auslöst.** Rezepte sind gültige Specs und lösen
die Ablehnungsregeln gerade nicht aus. Deshalb können sie keine Ablehnungsregel belegen. Der
heutige Nachweis in `core/src/validation-rules.test.ts` ist ein Quelltextscan: Er prüft nur, ob die
Kennung als String in einer Testdatei vorkommt. LFH-568 macht daraus ein **Datum**, das zur
Laufzeit geprüft wird. Die Lesart „eine Fixture durchläuft die Regel“ ist verworfen, weil sie einen
Eingriff in `validate.ts` bräuchte.

## LFH-568 — Herkunft je Kombination

- `core`: `specKey(spec)` bildet eine kanonische, reihenfolgeunabhängige Identität einer
  `SymbolSpec`. Die Funktion ist rein und hat keine Abhängigkeit. Sie ist feiner als
  `reachSignature`.
- `catalog`: `combinationProvenance(spec)` ergibt `verbatim`, wenn der `specKey` gleich dem einer
  Fixture ist, deren Vergleich mit dem Original besteht, und sonst `derived`. `legacy` bleibt
  außen vor. Für `verbatim` liefert die Funktion den Reviewstand aus dem Coverage-Manifest (über
  `implementation: 'recipe.<key>'`).
- **Einschränkung, die sichtbar bleibt:** Der Vergleich (`core/src/fingerprint.ts`) prüft heute nur
  die Körperhülle. `verbatim` heißt deshalb „die Körperhülle entspricht dem Original“. Das steht
  im Kommentar und in einem festgenagelten Test, nicht nur im Kopf.
- Die drei Sonderpfade des Vergleichs, die heute nur in `recipes.test.ts` stehen (D.1.2–D.1.8 ohne
  `ring`, D.4.3 über `comparableBodyFingerprint`, 1.13 `stroke-outline`), werden **benannte
  Vergleichsausnahmen** als Daten. `recipes.test.ts` benutzt dann diese Daten.

## LFH-568 — Regelabdeckung

- `catalog`: `RULE_EVIDENCE` führt je Regel aus `RULE_CATALOG` mindestens einen auslösenden Fall,
  also eine `SymbolSpec`, die `validateSpec` mit genau dieser Regel ablehnt. Eine Regel, die aus
  einer Spec nicht auslösbar ist, steht als benannte Lücke mit Begründung. Heute ist das
  `surface-right-label-requires-measured-anchor`.
- Kompositionsregeln (`COMPOSITION_RULE_CATALOG`) werden belegt, wenn ein Fall sie in `compose`
  auslöst, soweit sich das über die öffentliche API erreichen lässt. Sonst stehen sie als benannte
  Lücke.
- `ruleCoverage` bekommt eine **Regelsicht**: je Regel `triggered` oder `gap`, gezählt je `kind`
  und je `dimension`. Die bestehenden Zahlen der Wertabdeckung (993/924/71/…) bleiben unverändert.
- Das Gate löst jeden Fall zur Laufzeit aus. Das ist stärker als der String-Scan. Der String-Scan
  in `validation-rules.test.ts` kann bleiben oder auf `RULE_EVIDENCE` umgestellt werden. Der
  Umbau muss begründet werden.

## LFH-569 — Fixtures und benannte Ausnahmen

- Die Rezepte bekommen die Rolle **Fixture der Grammatik**. Die Daten und die 242 Einträge
  bleiben unverändert. Die Rolle steht im Modulkommentar und in einem Export
  (`GRAMMAR_FIXTURES`), nicht in einer Umbenennung. Die Umbenennung gehört zu LFH-571.
- `NAMED_EXCEPTIONS` nach dem Muster von `CONTRAST_EXCEPTIONS` und `INVENTORY_EXCLUSIONS`. Je
  Eintrag stehen: Fixture, Feld, Wert, Abschnitt, Begründung und Fundort. Erfasst werden alle
  Rezepte, die einen Sonderwert aus `BodyLabels` tragen (`centerCapHeightMm`, `topLeftMetrics`,
  `centerBaselineFromBodyBottomMm` …). Die Menge wird gezählt, nicht geschätzt.
- Das Gate prüft zwei Richtungen: Jeder Sonderwert einer Fixture ist gelistet, und kein
  Listeneintrag ist veraltet.
- Einen Sonderwert zur Regel zu machen, ist **nicht** Teil dieser Arbeit. Das geht je Feld nur mit
  einem Eingriff in `compose.ts` und wird ein Folgeticket.

## Nicht Teil

Änderungen an `compose.ts`, `layout/profiles.ts` und `validate.ts`. Nicht Teil sind außerdem die
API zu Herkunft und Prüfstand (LFH-581), die Umbenennung zu `conformance` (LFH-571) und ein
Vergleich über die Körperhülle hinaus.
