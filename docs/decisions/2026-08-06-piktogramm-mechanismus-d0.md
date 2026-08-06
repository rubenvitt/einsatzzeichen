# Einsatzzeichen — D.0: Piktogramm-Mechanismus

> Entscheidungsnotiz · 6. August 2026 · Umsetzung abgeschlossen

Setzt `docs/superpowers/specs/2026-08-05-piktogramme-und-katalogausbau-design.md` (Teilprojekt D,
Unter-Slice D.0) über `docs/superpowers/plans/2026-08-05-piktogramm-mechanismus-d0.md` um.
Zwölf Tasks, 332 Tests, Coverage-Gate bestanden.

## 1. Vier Festlegungen gegen die Spec

Die Spec ist an vier Stellen am Code nicht haltbar. Der Plan hat das vorab festgehalten statt es
in der Umsetzung zu überspielen; die Umsetzung hat alle vier bestätigt.

**Erfolgskriterium 2 der Spec ist falsch.** „Der bestehende Snapshot bleibt unverändert grün" kann
nicht gelten: die drei Piktogramm-Linien standen als direkte `<svg>`-Kinder und stehen jetzt in
einem `<g transform="translate(…)">`. Die haltbare Zusicherung lautet: **die effektiven
Koordinaten bleiben identisch, der Diff besteht ausschließlich aus der Umklammerung.** Belegt, mit
vor der Regeneration festgelegten Zahlen:

| Größe | vorher (C.1.1) | nachher | Summe |
|---|---|---|---|
| waagerechte Linie | `53.858` | `45.354` + `translate(0 8.504)` | `53.858` |
| obere Schräge | `34.016` | `25.512` + `8.504` | `34.016` |
| untere Schräge | `73.701` | `65.197` + `8.504` | `73.701` |

Die drei `<line>`-Tags in `C.1.1.svg` sind seither **zeichengleich** mit denen in `C.1.2.svg`; die
beiden Rezepte unterscheiden sich nur noch in Kopfzone, `translate` und Körper-`y`. `<circle>` und
`<rect>` sind unangetastet. Das ist der stärkste verfügbare Beleg, dass die Gruppen-Translation
dasselbe Bild liefert wie die frühere primitivweise Verschiebung.

**Der Rezepttest brach strukturell** und wurde angepasst, nicht abgeschwächt: die waagerechte
Linie sitzt weiter auf der Körpermitte, die Prüfung liest sie eine Ebene tiefer
(`line.y1 + translate.dyMm`). Der Review hat die Äquivalenz nachgerechnet — `dyMm` ist genau das
Delta, das früher `shiftY` je Primitiv addierte.

**Das Clipping-Gate prüft nur achsparallele, unrotierte Rechtecke** und wirft für alles andere.
Bei `formation` fallen Körperfläche und Hülle zusammen; bei den Polygonen (`hazard`, `measure`,
`point`) und dem gedrehten Quadrat (`person`) nicht — eine Box innerhalb der Hülle kann aus dem
Dreieck ragen. Eine Hüllenprüfung als Flächenprüfung auszugeben wäre die Behauptung, die dieses
Projekt vermeidet. Muster: `circleBodyProfile`, Gruppendrehung in `boundsOfMm`.

**`snapshotTest: true` ist durch echte Dateisnapshots eingelöst**, je Piktogramm einer, auch für
das bestehende `capability.fire-fighting`. Das Flag wird aus der Elementart abgeleitet, nicht als
ID-Liste geführt.

## 2. Signaturabweichung beim Clipping-Gate

Die Spec nennt als Eingabe `PictogramDefinition + SymbolKind`. Umgesetzt ist
`checkClipping(definition, body: Primitive)`: ein Gate in `core` kann aus einem `SymbolKind` keine
Körpergeometrie ableiten — die liegt in `catalog`, und die Paketrichtung ist `catalog → core`. Der
Aufrufer holt den Körper aus `baseDrawing(kind)`. Das ist die einzige Variante ohne
Abhängigkeitsumkehr.

## 3. Zwei Entscheidungen während der Umsetzung

**Die vier ID-Räume ohne Literale** (`state.`, `comms.`, `damage.`, `wildfire.` als `never`, plus
vier Werte in `ElementKind`) entstehen, weil Spec Abschnitt 12 „die fünf ID-Präfixe" als Umfang
nennt: sie sind der Vertrag, an dem D.1–D.4 anknüpfen. Bewusste Ausnahme vom Prinzip „kein Feld
ohne Konsument". Typseitig kollabiert `` `state.${never}` `` zu `never`, die Union bleibt exakt
`` `capability.${CapabilityId}` ``.

**`checkPictogram` fängt den Clipping-Wurf** und meldet ihn als zusätzlichen `PictogramIssue`,
statt die bereits gesammelten Kommando- und Box-Befunde zu verwerfen. `checkClipping` selbst wirft
weiter — direkte Aufrufer sollen den Fehler bekommen, „diese Körperform ist nicht vermessen" soll
nicht still zu einem Befund unter vielen werden. Dafür trägt der Wurf eine eigene Klasse
(`BodyNotMeasuredError`): ein `catch`, das jeden Fehler einsammelt, hätte einen künftigen
Programmierfehler in `checkClipping` als harmlosen Piktogramm-Befund getarnt.

## 4. Was der Registereintrag `phjardas-tz` nicht behauptet

Der Eintrag nennt keine Zählung des Upstream-Bestands mehr. Der Plan hatte „42 Fachaufgaben und 89
Symbole" vorgegeben; `Vision.md` nennt für dieselbe Quelle 84 Symbole. Erklärbar wäre die Differenz
(dokumentierter Umfang gegen eigene Zählung der Typ-Literale), nachprüfbar ohne Zugriff auf das
Repository nicht. In einem Register, dessen Zweck belegte Aussagen sind, wäre die Zahl eine
ungeprüfte Behauptung — sie ist entfallen. Die Zahlen bleiben in der Spec, wo sie als eigene
Messung ausgewiesen sind.

Aus demselben Grund trägt `phjardas-tz` eine **eigene, korrekt datierte** Review-Angabe: die
geteilte Konstante hätte für einen am 6. August entstandenen Eintrag eine Prüfung vom 5. August
behauptet.

## 5. Was `withoutTestEvidence` sagt

Die Zahl ist von 12 auf 13 gestiegen. Das ist richtig: die Prüfung listet einen Eintrag, sobald
einer der beiden Nachweise fehlt, und `fingerprintTest` bleibt für Piktogramme `false` — für sie
ist das Fingerprint-Gate strukturell unerreichbar, weil `matchFingerprint` ausschließlich
`role: 'body'` vergleicht. Die einzige Möglichkeit, die Zahl zu senken, wäre ein
`fingerprintTest: true` ohne Gate. Wer sie als Regression liest, macht das Manifest unehrlich.

An die Stelle des Fingerprint-Kriteriums treten für Piktogramme vier prüfbare Bedingungen:
Snapshot-, Kommando-, Box- und Clipping-Gate grün. Die Review-`note` am Manifest-Eintrag hält
diese Rollenanpassung fest.

## 6. Offene Punkte für D.1

- **Körperformen jenseits von `formation`.** Das Clipping-Gate wirft für Polygone und das gedrehte
  Quadrat. Bevor Piktogramme gegen diese Grundzeichen geprüft werden können, muss ihre Fläche
  vermessen werden — eine echte Flächenprüfung, keine Hülle.
- **Die Präfix-Aufteilung von Anhang J** (Übertragungsarten, Fernmeldegeräte, IT-Netzwerkelemente
  sind fachlich drei Dinge) fällt in D.3 und wird dort belegt.
- **`translate` an einem Blatt-Primitiv** rendert der SVG-Renderer still, während `boundsOfMm`
  dafür wirft. Die Beschränkung auf Gruppen ist Konvention im Doc-Kommentar, nicht typ- oder
  rendererseitig erzwungen. Heute unerreichbar; Kandidat für eine IR-Validierung.
- **`matchFingerprint`** übersetzt nur die Gruppendrehungs-Meldung in einen Befund, nicht die neue
  `translate`-Meldung. Unerreichbar, solange `translate` ausschließlich auf der
  Piktogramm-Gruppe sitzt und nie auf `role: 'body'`.
- **Eine Fähigkeit mit leerer `primitives`-Liste** erzeugte spurlos keine Gruppe. Kein Regress
  gegenüber dem alten Verhalten, heute unerreichbar — relevant, sobald der Bestand wächst.

## 7. Sieben Planfehler, die die Umsetzung gefunden hat

Der Plan war nicht fehlerfrei, und keiner der Fehler ist als „passt schon" durchgegangen. Zur
Erinnerung für den nächsten Plan:

1. Eine Testerwartung zählte die Tokenizer-Befunde falsch (`'m 4 12 l 8 0'` sind zwei relative
   Kommandos, nicht eines).
2. Die Korrektur dieser Zahl höhlte den Testzweck aus — beide Befunde kamen dann aus demselben
   Primitiv, die Traversierung war ungetestet.
3. Eine im Regex-Kommentar begründete Fähigkeit (Exponentialschreibweise) hatte keinen Test.
4. Die Index-Zusicherung im Canvas-Reihenfolgetest ist tautologisch: der Rotationsblock ruft selbst
   zuerst `ctx.translate`, der Vergleich bleibt auch bei falscher Reihenfolge wahr. Die Schärfe
   trägt allein die Wertzusicherung daneben.
5. Die Wrapper-Signatur `readonly Primitive[]` brach den Typecheck gegen den bestehenden Port-Typ.
6. Der Testfall für „zwei Fähigkeiten in einer Gruppe" prüfte nur die erste gefundene Gruppe, also
   gerade nicht, dass es genau eine ist.
7. Die Sortierung „absteigend nach Anzahl" war in einem `Record<string, number>` untergebracht.
   ECMAScript sortiert Ganzzahl-Schlüssel immer numerisch aufsteigend — das konnte nie funktionieren.

Punkt 4 ist noch offen und in der Ledger-Liste der aufgeschobenen Minors vermerkt.

## 8. Nachtrag nach der Gate-Härtung

Die Aussagen in Abschnitt 5 sowie der erste offene Punkt aus Abschnitt 6 beschreiben den
damaligen D.0-Abschluss. Der integrierte Stand vom 6. August 2026 ersetzt sie wie folgt:

- arteigene, typisierte Testevidenz statt `fingerprintTest`/`snapshotTest`; dadurch null echte
  technische Nachweislücken;
- exakte Clipping-Flächenmodelle für alle acht aktuellen Grundkörper;
- weiterhin keine pauschale fachliche Autorisierung jedes Piktogramms für jeden Grundkörper.

Maßgeblich sind die Entscheidungsnotiz `2026-08-06-gate-haertung-vor-d1.md`, Abschnitt 9, und die
Spec `2026-08-06-technische-restpunkte-und-review-uebergabe-design.md`.
