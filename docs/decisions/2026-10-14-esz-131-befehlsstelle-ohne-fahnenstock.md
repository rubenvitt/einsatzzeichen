# Befehlsstelle: Kappe statt Fahnenstock

> Stand: 14. Oktober 2026
> Status: Befund und Regel zu ESZ-131 (Zunder: https://zunder.rubeen.dev/#/aufgabe/tweej19d56h2nmtd2hu3qgrj).
> Anlass: Lifeline Hub, LFH-836 (freie Lagekarten-Zeichen auf `@einsatzzeichen`).

## Anlass

Das Altpaket `taktische-zeichen-core` 0.10 führt das Grundzeichen `befehlsstelle`: das Rechteck
der taktischen Formation mit einem Fahnenstock an der linken Kante, frei kombinierbar mit
Organisation, Einheit, Verwaltungsstufe und Namen. Beim Abgleich gegen 5.0.0 fand sich keine
Spec dafür. Die Näherung `{ kind: 'formation', organization: 'fuehrung-leitung' }` verliert den
Stock und damit die Aussage „Befehlsstelle“. Das Ticket fragte, ob die Referenz die Befehlsstelle
als eigenes Grundzeichen, als Körpervariante oder als Marke am Körper führt.

## Befund

**DV 102 (1. Auflage 2011, Quelle `skk-2010`).** Seite 11: 1.2 „Befehlsstelle, Führungsstelle
(im Einsatz)“ ist ein eigenes Grundzeichen, das Formationsrechteck mit einem senkrechten Stock an
der linken Kante, der etwa ein Fünftel der Körperhöhe unter die Unterkante ragt (vermessen mit
`pdftocairo -svg`: Körper 48,1 × 22,6 pt, Stock 0,75 pt breit, 4,3 pt unter der Unterkante).
Benutzt wird es in 10.2.7 (S. 38, Befehlsstellen des THW, blau mit Stärke und Fachgruppe) und in
10.6.1 (S. 43): Katastrophenschutzleitung, TEL, EL, EAL und UEAL **im Einsatz** tragen den Stock,
die beiden Führungsgruppen (10.6.1.3, 10.6.1.7) nicht.

**BABZ 2025 (Baseline).** Kapitel 1 kennt keine Befehlsstelle mehr; in den 661 Referenzdateien
(`packages/conformance/src/fingerprints.json`) gibt es keinen Fahnenstock. Dieselben Leitungen im
Einsatz stehen in Anhang D und tragen statt des Stocks die schwarze 3-mm-Kappe an der Oberkante:

| DV 102 (2011) | BABZ 2025 | Zeichen 2025 |
|---|---|---|
| 10.6.1.1 KatSL im Einsatz, Stock | D.1.2 | Formation, Kappe, Kürzel (`functionRole: 'disaster-control-command'`) |
| 10.6.1.2 TEL im Einsatz, Stock | D.1.3 | dito (`technical-incident-command-evacuation`) |
| 10.6.1.4 EL im Einsatz, Stock | D.1.4 | dito (`incident-command`) |
| 10.6.1.5 EAL im Einsatz, Stock | D.1.5 | dito (`incident-section-command-north`) |
| 10.6.1.6 UEAL im Einsatz, Stock | D.1.6 | dito (`incident-subsection-command`) |
| 1.2 Befehlsstelle (im Einsatz), Stock | D.1.1 | Formation gelb, Kappe, „Bezeichnung“ kursiv, gestrichelte Verbindung zum Standortkreuz |

Die Kappe ist dabei das allgemeinere Zeichen: 2025 tragen sie auch die beiden Führungsgruppen
D.1.7 und D.1.8, die 2011 keinen Stock hatten. Eine eigene Form für „im Einsatz“ gibt es nicht
mehr; die Baseline unterscheidet Führungsstellen nur noch über die Kappe und das Kürzel.

Die Kappe ist an der Formation als Körpermarke `formation-solid-cap-3mm` vermessen (D.1.9
Zugtrupp, I.1.6 bis I.1.8 Führungseinheiten der Wasserrettung) und an jeder Organisation und
Stärke ohne Ableitung zeichenbar. Die Kappe in D.1.1 ist dieselbe Marke: 30 × 3 mm bündig an der
Oberkante, nur liegt der Körper dort 5 mm höher (y 1 statt 6), um Platz für die Verbindung zu
lassen.

Das Legacy-Scoping (`docs/superpowers/specs/2026-08-28-lfh-433-legacy-migration-scoping.md`,
§3.3) führt 1.2 schon als Klasse A mit dem Ziel D.1.1. Das stimmt für die gelbe Befehlsstelle
ohne weitere Angaben; für Befehlsstellen anderer Organisationen fehlte die Abbildung.

## Entscheidung

1. **Kein eigenes Grundzeichen, keine Körpervariante, keine Marke „Fahnenstock“.** Der Stock ist
   in der Baseline entfallen; an seiner Stelle steht bei denselben Zeichen die Kappe. Ein Stock nach DV 102 wäre ein
   zweites Bild für eine Aussage, die 2025 eine eigene Form hat (vgl. ESZ-138 und die Regel aus
   ESZ-137: hat ein Altzeichen einen Nachfolger, gehört es nicht ins Register der Altzeichen).
2. **Die Befehlsstelle ist eine Formation mit Kappe.** Als `SymbolSpec`:

   ```ts
   { kind: 'formation', organization, strength?, bodyMarks: ['formation-solid-cap-3mm'] }
   ```

   `checkSpec`, `serializeSpec`/`parseSpec`, `vocabulary(spec, 'bodyMarks')` und `drawSymbol`
   tragen das für alle acht Organisationen und alle Stärken (`core/src/command-post.test.ts`).
3. **Die gelbe Befehlsstelle mit abgesetztem Standort bleibt D.1.1**, freistehend als
   `{ kind: 'pictogram', pictogram: 'leadership.command-post-in-operation' }`. Die gestrichelte
   Verbindung mit Standortkreuz ist nur an diesem einen Bild belegt; sie wird nicht auf andere
   Formationen übertragen.
4. **Keine neue Kennung, keine Formatänderung.** Die Änderung ist eine Regel mit Tests, kein
   Release-Inhalt.

## Hinweis für den Lifeline Hub

| Bestand `befehlsstelle` mit … | Spec |
|---|---|
| Führung/Leitung, ohne weitere Angabe | `{ kind: 'pictogram', pictogram: 'leadership.command-post-in-operation' }` |
| Kürzel einer Leitung (KatSL, TEL, EL, EAL, UEAL) | Rezept D.1.2 bis D.1.6 (`functionRole`) |
| jeder anderen Organisation, Stärke oder Verwaltungsstufe | `{ kind: 'formation', organization, …, bodyMarks: ['formation-solid-cap-3mm'] }` |

## Verworfen

- **Fahnenstock als Körpervariante nach DV 102:** würde ein in der Baseline gestrichenes
  Formelement wiederbeleben und neben der Kappe ein zweites Bild für „Führungsstelle“ anbieten.
- **Die D.1.1-Verbindung als Körpervariante jeder Formation:** nur ein Original, und die fünf
  Leitungen im Einsatz (D.1.2 bis D.1.6) zeigen sie nicht. Sie ist damit kein Merkmal der
  Befehlsstelle, sondern der abgesetzten Darstellung dieses einen Beispiels.
- **Formation ohne Kappe (Näherung aus dem Ticket):** verliert die Aussage, die 2025 gerade die
  Kappe trägt.
