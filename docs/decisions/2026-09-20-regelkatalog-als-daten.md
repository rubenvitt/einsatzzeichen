# Regelkatalog als Daten — neben der Regelliste, nicht an ihrer Stelle

> Entscheidung vom 20. September 2026
> Status: Vorschlag, Entscheidung offen
> Umsetzung: LFH-563 (`packages/core/src/rules/rule-catalog.ts`), Initiative A aus
> `2026-09-13-grammatik-motor-und-paketschnitt.md`

## 1. Anlass

Die Scope-Entscheidung vom 13. September 2026 sagt zu: „Der Motor lehnt eine Kombination nur noch
ab, wenn eine **Regel** sie verbietet — nicht mehr, weil kein Original sie belegt." Dafür muss
zuerst sichtbar sein, welche Regeln es heute überhaupt gibt, warum es sie gibt und worauf sie sich
stützen.

Heute steht das an drei Orten und in drei Formen:

- `packages/core/src/validate.ts` prüft in einer Funktion mit 75 Befundstellen und trägt die
  Regelkennung als Inline-Literal an der Prüfung.
- `packages/core/src/validation-rules.ts` zählt die 72 Kennungen als Liste.
- `packages/website/src/lib/rule-explanations.ts` erklärt jede Kennung in zwei bis vier Sätzen —
  837 Zeilen, downstream vom Kern.

Begründung und Quellenbezug fehlen im Kern vollständig: `ValidationIssue` trägt genau zwei Felder,
`rule` und `message`. Wer eine Ablehnung erklären will, braucht die Website.

## 2. Entscheidung

Ein **Regelkatalog als Daten** in `core`: je Regel eine stabile Kennung, die Einordnung fachlich
oder technisch, die betroffene Dimension der Systematik, eine Begründung in einem Satz und ein
Quellenbezug über `SourceReference`. Dazu die Lücken je Dimension als zählbare Daten und die sechs
Kompositionsregeln als eigene, markierte Klasse.

Der Katalog entsteht **neben** `VALIDATION_RULE_IDS`, nicht an dessen Stelle. `validate.ts` behält
seine Inline-Literale.

### 2.1 Warum nicht der naheliegende Umbau

Die verworfene Alternative war, die Literale durch Katalogverweise zu ersetzen
(`rule: RULES.strengthRequiresUnit.id`). Ihr konkreter Preis:

`validation-rules.test.ts` prüft die Mengengleichheit von Liste und geprüften Regeln per
**Quelltextscan** auf `/rule: '([a-z0-9-]+)'/` in `validate.ts`. Das ist das stärkste Gate des
Pakets — „die Liste enthält genau das, was der Quelltext prüft". Mit Katalogverweisen fände der
Scan **null** Kennungen, beide Differenzmengen wären leer, und der Test bestünde fortan
tautologisch. Ein Gate, das nichts mehr prüft und trotzdem grün ist, ist schlechter als kein
Gate: es täuscht Deckung vor.

Der Katalog tritt deshalb als **dritte, gegengeprüfte Sicht** daneben. `rule-catalog.test.ts`
nagelt fest:

- Mengengleichheit von Katalog und `VALIDATION_RULE_IDS`, beide Richtungen einzeln benannt.
- die Zahl der Auslösestellen je Kennung, gezählt im Quelltext von `validate.ts` gegen das Feld
  `sites` — heute 75 Stellen für 72 Kennungen, drei Regeln mit zwei Stellen.
- die sechs Kompositionskennungen gegen den Quelltext von `compose.ts`.

### 2.2 Was der spätere Umbau braucht

Die Umstellung von `validate.ts` auf Katalogverweise bleibt möglich und ist ein eigener Slice. Sie
braucht dann einen **Ersatz für den Quelltextscan**: ein Laufzeit-Gate, das belegt, dass jede
Katalogregel von einer Fixture tatsächlich ausgelöst wird. Erst damit ist „der Katalog beschreibt,
was der Motor prüft" wieder eine geprüfte Aussage und keine Behauptung. Dieses Gate existiert
heute nicht — deshalb heute kein Umbau.

Vorarbeit dafür liegt bereits vor: `validation-rules.cases.test.ts` löst die Regeln über
`validateSpec` aus und führt die eine derzeit nicht auslösbare Regel
(`surface-right-label-requires-measured-anchor`) als benanntes `it.todo`.

## 3. Trennung fachlich gegen technisch

Das Ticket verlangt, die fachliche Regel der Systematik von der technischen Grenze dieses Motors
zu unterscheiden — beides erklärbar, aber unterscheidbar. Die Einordnungsregel:

> **`systematik`** — eine Fachkundige mit der gedruckten Systematik in der Hand erkennt die Regel
> wieder, ohne diesen Quelltext zu kennen.
> **`engine`** — die Ablehnung hängt an diesem Motor: an einer fehlenden Messung, einem fehlenden
> Profilwert oder einer nicht darstellbaren Zahl.

Praktisch fallen unter `systematik` zwei Familien: **Zonenkollision** (eine Zone trägt genau einen
Baustein — Kopfzone, Fußstreifen, Körperfläche, Fahrwerkszone) und **Trägerbindung** (ein Baustein
gehört fachlich nur an bestimmte Träger).

**Ergebnis: 8 von 72 sind fachlich, 64 sind technisch.**

| Einordnung | Zahl | Regeln |
|---|---|---|
| `systematik` | 8 | `body-variant-foot-conflict`, `chassis-foot-conflict`, `circle-12-requires-organization`, `head-zone-conflict`, `plain-wheel-pair-chassis-conflict`, `strength-requires-unit`, `surface-label-foot-conflict`, `technical-fill-organization-conflict` |
| `engine` | 64 | alle übrigen |

Das ist der Befund, auf den die Scope-Entscheidung hinausläuft, in Zahlen: der Motor lehnt heute
fast alles ab, weil eine Messung fehlt.

Drei Einordnungen, die man anders treffen könnte, und warum sie so stehen:

- Mehrere Zonenkollisionen formuliert `validate.ts` mit dem Zusatz „ohne vermessene
  Ausweichposition" (`chassis-foot-conflict`, `surface-label-foot-conflict`). Dieser Zusatz ist der
  Grund, warum der Motor **keine Ausweichlösung anbietet** — nicht der Grund der Ablehnung. Die
  Ablehnung ist die Kollision, also fachlich.
- `vehicle-category-requires-vehicle` klingt fachlich, ist aber **enger** als die Systematik: die
  umgesetzte Menge sind die drei Körperformen, an denen eine Fahrwerkszone vermessen wurde
  (Kommentar an `CHASSIS_KINDS`: „Gemessen, nicht angenommen … 25 von 31"). Luft- und
  Wasserfahrzeug sind fachlich Fahrzeuge und fallen trotzdem heraus. Also `engine`.
- `designation-not-blank` und `label-not-blank` sehen nach Datenhygiene aus, tragen aber eine
  Motorbegründung: ein leerer Lauf erzeugt ein Textprimitiv ohne Tinte, das jedes Gate besteht und
  im Bild fehlt. Also `engine`.

## 4. Dimensionen: die Union gegen die Wertachsen

Das Ticket nennt dreizehn Dimensionen. `packages/catalog/src/rule-coverage.ts` führt sechzehn
Wertachsen. Die Union im Katalog hat achtzehn Werte; die Abweichungen sind benannt:

- **Hinzugefügt gegenüber den Achsen:** `label` (Beschriftung hat keinen Werteraum, weil sie
  freier Text ist — trägt aber 44 der 72 Regeln), `composition` (für Regeln, deren Auflösung kein
  einzelnes Feld benennt; bislang genau `head-zone-conflict` — dasselbe Wort und derselbe Grund
  wie in `rule-explanations.ts`).
- **Aufgeteilt:** die Achse `kind` wird zu `base-symbol` und `body-variant`, weil die Regeln beide
  deutlich trennen.
- **Ohne Wertachse und ohne Feld in `SymbolSpec`:** `unit-grouping` (Verbände 5.5), `state` und
  `tendency` (5.8), `movement` (5.2), `lines-and-boundaries` (Kapitel 2). Sie stehen in der Union,
  weil der Katalog sonst nicht sagen könnte, dass zu ihnen keine Regel existiert.
- **Weggelassen:** die Piktogrammachsen `comms`, `damage`, `wildfire`, `leadership` und
  `water-rescue-personnel`. Sie beschreiben eigenständige Piktogramme, die nicht in `SymbolSpec`
  stehen und an denen `validateSpec` nichts prüft.

## 5. Lücken je Dimension

Zählbar als `RULE_DIMENSION_GAPS`, nicht als Fließtext. Neun Lücken, davon sechs ohne jede Regel:

| Dimension | Abdeckung | Abschnitt | Befund |
|---|---|---|---|
| `base-symbol` | partiell | Kapitel 1, 5.1 | Gegenstand keiner Regel, Bedingung in vielen |
| `administrative-level` | partiell | 5.7 | eine Regel, aber nur drei der sechs Stufen belegt (D.3/D.4) |
| `body-marks` | partiell | 3.6–3.9 | nur mittelbar über eingesenkte Hülle und Funktionsfassung |
| `capabilities` | **keine** | 3.6–3.9 | Mehrfachfähigkeiten und Sonderformen völlig ungeregelt |
| `unit-grouping` | **keine** | 5.5 | Verbände oberhalb des Zuges sind nicht darstellbar |
| `state` | **keine** | 5.8 | existiert nur als eigenständiges Piktogramm, nicht als Baustein |
| `tendency` | **keine** | 5.8 | kein Feld, keine Achse, keine Regel |
| `movement` | **keine** | 5.2 | braucht Richtung und Länge, wofür es keinen Ort im Zonenmodell gibt |
| `lines-and-boundaries` | **keine** | Kapitel 2 | keine Zeichen auf der 32-mm-Grundfläche |

Eine Dimension darf zugleich Einträge **und** einen Lückeneintrag haben —
`administrative-level` ist genau dieser Fall. Verboten ist allein, dass eine Dimension der Union in
keiner der beiden Listen vorkommt; das prüft der Test.

## 6. Kompositionsregeln als eigene Klasse

`assertTextRunsFit()` in `compose.ts` bildet sechs Kennungen, die **nicht** in
`VALIDATION_RULE_IDS` stehen: drei Präfixe (`designation`, `label`, `function-role-run`) mal zwei
Endungen (`-too-wide`, `-unknown-glyph`). Sie greifen erst, wenn die Komposition den Textlauf
gesetzt und seine Tinte gegen die Box gemessen hat.

Diese Trennung existierte bereits — als `COMPOSITION_EXPLANATIONS` in der Website, also downstream
und an den Regeln vorbei. Sie steht jetzt im Kern, bei den Regeln selbst, als
`COMPOSITION_RULE_CATALOG` mit `phase: 'composition'`.

Der Gattertest ist hier anders gebaut als bei `validate.ts`: die Kennungen sind im Quelltext keine
Literale, sondern Template-Literale, ein Scan auf `rule: '…'` fände null. Der Test liest stattdessen
die drei Präfixe aus der Parameterdeklaration und die Endungen aus den Template-Literalen und
vergleicht ihr Kreuzprodukt mit dem Katalog. Der Weg der Website — Kennungen über
`composeFromCatalog` auslösen — steht `core` nicht offen: er führte über `@einsatzzeichen/catalog`
und verletzte die Importgrenze `catalog → core`.

Nicht aufgenommen sind die Kennungen des Messgates aus `text-metrics.ts` (`text-too-wide`,
`text-outside-box`, `unknown-glyph`, `text-too-tall`, `unmeasured-baseline`). Sie gehören zu
`TextMetricsIssue` und erreichen nie ein `ValidationIssue.rule`; `assertTextRunsFit` übersetzt drei
davon, die übrigen zwei gar nicht. Ein Test hält das fest.

## 7. Begründung und Quellenbezug: was belegt ist und was nicht

**`reason`** ist die Begründung in einem Satz, aus dem Bestand gezogen und nicht erfunden. Das
Ticket erlaubt dafür zwei Quellen — den Kommentar an der Prüfstelle in `validate.ts` **oder**
`rule-explanations.ts` —, und beide werden genutzt. Welche, sagt das Feld **`reasonSource`**:

| `reasonSource` | Zahl | Bedeutung |
|---|---|---|
| `core` | 45 | Die Begründung steht in `packages/core` selbst — in Meldung oder Kommentar an der Prüfstelle, bei den Kompositionsregeln in `compose.ts` oder `text-metrics.ts`. |
| `website` | **27** | Die Begründung steht **nur** in `rule-explanations.ts`. Der Kern wiederholt dort lediglich den Prüfausdruck in Worten („muss endlich und größer als null sein"). |

Das Feld ist nicht Buchhaltung, sondern der Befund: **27 der 72 Regeln begründet heute allein die
Website.** Für sie ist der Satz im Katalog eine **Handkopie ohne Gate** — `core` darf `website`
nicht importieren, eine Deckungsprüfung liefe gegen die Importgrenze. Die Menge ist im Test
festgenagelt, damit sie nicht unbemerkt wächst. Das ist die konkrete Evidenz für die offene Frage
in Abschnitt 8.

**`reason: null`** heißt *Begründung nicht belegt* und ist der ausdrückliche Vermerk für den Fall,
dass weder Kern noch Website einen Grund nennen. Diese Liste ist derzeit **leer** und genau
deshalb im Test festgenagelt: der Bestand dokumentiert heute jede Regel irgendwo, und wenn eine
neue Regel das nicht tut, soll das auffallen.

**`source`** nutzt `SourceReference` aus `packages/schema/src/provenance.ts` statt einer zweiten
Mechanik. Der Status ist durchweg `derived`: `verbatim` behauptet „Geometrie entspricht der
Referenz und ist per Fingerprint belegt", und eine Regel hat weder Geometrie noch Fingerprint. Ein
Quellenbezug steht nur dort, wo `validate.ts` an der Prüfstelle selbst einen Abschnitt nennt —
**18 von 72**. Ein Eintrag mit Quelle, aber ohne Abschnitt, wäre eine Behauptung ohne Fundstelle;
die übrigen 54 tragen ausdrücklich `null`.

## 8. Offener Punkt für den Eigentümer — bitte entscheiden

**Wird `rule-explanations.ts` in der Website künftig aus dem Kernkatalog gespeist?**

Der Katalog kennt heute `reason` (ein Satz, warum es die Regel gibt). Die Website kennt
zusätzlich `title`, `explanation` (zwei bis vier Sätze mit Handlungsanweisung) und `field` — das
Feld einer `SymbolSpec`, das die Leserin ändern müsste. `field` ist **kuratiert und nicht aus der
Kennung ableitbar**: der erste Versuch leitete es aus dem Präfix ab und fand für 72 Regeln nur 17
Felder, weil die Kennungen nach der **Zone** benannt sind und nicht nach dem Feld. Der Katalog
kennt diese Zuordnung nicht.

Der Anlass ist nicht theoretisch: **27 der 72 Begründungen im Katalog sind heute schon Handkopien
aus der Website** (Abschnitt 7). Der Zustand existiert also bereits — offen ist nur, ob er bleibt.

Drei Optionen, mit dem Kriterium **wer die Prosa besitzt**:

1. **Zwei Tabellen nebeneinander, ungegatet** (heutiger Zustand plus Katalog). Der Kern trägt einen
   Satz je Regel, die Website ihre Erklärung. Billigste Option, aber die 27 kopierten Begründungen
   können von ihrer Vorlage abdriften, und nichts merkt es. Die Prosa gehört der Website.
2. **Die Website leitet aus dem Kern ab.** `rule-explanations.ts` zeigt den Kernsatz an und behält
   nur `title`, `explanation` und `field`; ein Test prüft die Deckung in der Website, wo der
   Import erlaubt ist — die Richtung `website → core` verletzt keine Grenze. Damit sind die 27
   Kopien wieder gegatet. Der Kern besitzt die Begründung, die Website den Klartext und den Bezug
   zum Formular.
3. **Der Kern bekommt ein `field`-Äquivalent** und die Website wird zur reinen Darstellung. Zieht
   die kuratierte Zuordnung samt ihrer Zielgruppenentscheidung („was muss die Leserin ändern") in
   `core` und macht den Kern für eine Oberflächenfrage verantwortlich. Der Kern besitzt alles.

Nebenfrage, die an derselben Entscheidung hängt: `explainIssue()` **wirft** heute bei unbekannter
Kennung. Der Katalog gibt stattdessen `undefined` zurück und überlässt der Erklärungsschicht die
Entscheidung. Wird Option 2 oder 3 gewählt, ist zu klären, welches Verhalten gilt.

Hier wird **nicht** entschieden.

## 9. Was diese Notiz nicht ändert

- `validate.ts` und `validation-rules.ts` bleiben unverändert. Der Katalog ist additiv.
- Die Zahl der Regeln ändert sich nicht: 72 an der Beschreibung, 6 bei der Komposition.
- Die fachliche Aussage der Zeichen ist unberührt. Der Katalog beschreibt, was der Motor heute
  prüft — er ändert nicht, was er prüft.
- `core` bleibt ohne Fremd- und Node-Abhängigkeit und browsertauglich: der Katalog ist reine
  Daten, `node:fs` steht nur in der Testdatei.
