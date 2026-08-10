# Anhang J ist zu einem Drittel typografisch — D.3 pausiert

> Entscheidungsnotiz · 9. August 2026

## 1. Der Befund

Die D.3-Spec vom 8. August behandelt Beschriftungsglyphen in Abschnitt 2.3 als Randfall zweier
Zeichen: `J.4.8` trägt ein „L", `J.4.17` eine „8", beide als Wertplatzhalter. Das war eine
Unterschätzung.

Tatsächlich tragen **20 der 56 Referenzdateien** des Anhangs J Buchstaben- oder Ziffernglyphen als
Pfade. Bei **17 der 53 geplanten Darstellungen** ist die Glyphe nicht Beiwerk, sondern der
Bedeutungsträger:

| Bereich | Abschnitte | Darstellungen |
|---|---|---|
| J.1 Verbindungsarten | J.1.3, J.1.4, J.1.5, J.1.6, J.1.7 | 5 |
| J.1 Faxübertragung | J.1.9 `primary` und `alternative` | 2 |
| J.3 Fernmeldebetriebsmittel | J.3.2 – J.3.9, J.3.14, J.3.15 | 10 |
| **Summe** | | **17** |

Dazu die beiden bereits geparkten Wertplatzhalter `J.4.8` und `J.4.17`. Der graue Erklärtext in
`J.1.14` ist davon unberührt — er ist Blattbeschriftung und war nie Zeicheninhalt.

## 2. Der Beleg

Entfernt man aus den Referenzen alle Pfade mit zehn oder mehr Kommandos — die Glyphen —, dann sind
`J.3.6_Handheld Radio Terminal.svg`, `J.3.7_Mobile Radio Terminal.svg` und
`J.3.8_Fixed Radio Terminal.svg` **geometrisch identisch**: dreimal dasselbe leere Quadrat mit
schwarzer Kontur. Ihre gesamte Unterscheidung liegt im Kürzel.

Bei `J.1.3` gegen `J.1.4`, `J.1.5` gegen `J.1.6` und `J.3.14` gegen `J.3.15` bleibt nach dem
Entfernen der Glyphen ein kleiner geometrischer Unterschied, aber der Hauptträger ist auch dort das
Kürzel.

> **Berichtigt am 10. August: `J.3.14` gehört dazu, es sind 17.** Die visuelle Prüfung zeigt beide
> Zeichen als Quadrat mit einem großen „C" unter einem waagerechten Überstrich; `J.3.15` fügt nur das
> Wort „VoIP" unten links hinzu. Der oben behauptete kleine geometrische Unterschied sind
> Rundungsstellen (`28.346` gegen `28.347`, `10.63` gegen `10.631`, `66.614` gegen `66.615`). Die
> Tabelle in Abschnitt 1 ist entsprechend nachgezogen.

`packages/schema/src/geometry.ts:86-97` kannte zum Zeitpunkt dieser Notiz sechs Primitivarten —
`rect`, `circle`, `line`, `polyline`, `path`, `group` — und **kein** `text`. Der Slice vom
9. August hat die siebte ergänzt; die Zeilenangabe ist historisch.

## 3. Warum das ein Blocker ist und keine Detailfrage

Ohne Textprimitiv gibt es für diese 17 Darstellungen nur drei Wege, und zwei davon sind keine:

- **Glyphen als Pfade nachzeichnen.** Das wäre eine Schriftschnitt-Nachbildung ohne Lizenzgrundlage
  und würde ein Kürzel zur unveränderlichen Geometrie einfrieren.
- **Eigene Marken erfinden.** Der D.3-Implementer hat das für `J.3.4` bis `J.3.8` getan und es
  selbst als Bedenken gemeldet. Das Ergebnis wären Zeichen, die die Baseline nicht kennt — in einem
  Katalog, dessen gesamter Zweck die belegte Quellentreue ist. Der Commit `1773316` ist deshalb
  zurückgerollt (`d0532ee`).
- **Ein Textprimitiv einführen.** Der einzige gangbare Weg.

## 4. Die Entscheidung

D.3 pausiert nach Task 2. Der Branch `worktree-anhang-j-d3` steht auf `d0532ee` mit den beiden
J.2-Betriebsarten (183 Einträge, 196 offene Fachreviews, Coverage-Gate bestanden).

Vor der Wiederaufnahme entsteht ein eigener **Schemaform-Slice für Text**. Er führt ein
Textprimitiv samt Renderer ein und schließt dabei die seit der Lückenanalyse vom 5. August offene
Fußzone mit an: `designation` steht im Typ und wird validiert
(`packages/core/src/validate.ts:44`), `role: 'foot'` ist im IR deklariert — beide ohne Renderer.

Das folgt der Reihenfolge vom 5. August: Schemaformen zuerst, Inhalt danach. Ein Textprimitiv fasst
die Struktur jedes künftigen Eintrags an; es nach dem Katalogausbau nachzurüsten wäre teurer.

## 5. Was aus D.3 bestehen bleibt

- **Task 2** (`0e57b93`): der `comms.`-Vertrag, `defineComms`, `comms/authoring.ts` und die beiden
  Betriebsarten J.2.1 und J.2.2. Technisch gegatet, Review sauber, keine Glyphen betroffen.
- **Spec und Plan** vom 8. August gelten weiter, mit den Korrekturen aus dieser Notiz und den
  beiden unten.

## 6. Zwei weitere Korrekturen am D.3-Plan

**Der Kontrastvertrag für Körper mit weißer Fläche war falsch.** Der Plan verlangte das Paar
`weiss`/`surface`. Das ist mathematisch unerfüllbar: beide Token sind `#ffffff`, das Verhältnis ist
exakt 1:1. Richtig ist `schwarz`/`surface` für die Kontur auf der Ausgabeoberfläche und
`schwarz`/`weiss` für die Marke auf dem Körper — so führt es `states/07-weather.ts` bereits.

> **Fundstellen berichtigt am 10. August.** Der Satz nannte „die Tasks 4, 5 und 7". Wörtlich steht
> das falsche Paar in der Formfamilien-Tabelle sowie in den Tasks **3** und **5** (je einmal im
> Test und einmal im Musterkode `DEVICE_CONTRAST`/`NETWORK_CONTRAST`); die Tasks 4, 6 und 7
> verweisen nur darauf. Alle sechs Stellen sind bei der Wiederaufnahme korrigiert. Die Prüfung
> selbst steht seit dem Textslice als `contrastPairProblems` im Code und meldet jedes Paar, dessen
> Token in einem Theme dieselbe Farbe auflösen.

**Box-Gate und viewBox-Gate messen verschieden.** `checkBox`
(`packages/core/src/pictogram-gate.ts:230-270`) misst mit `boundsOfMm` die reine Geometrie **ohne**
Strichbreite und fordert bei pfadfreien Definitionen Gleichheit von Hülle und Box; nur
`viewbox-gate.ts:58-62` rechnet die halbe Strichbreite ein. Der Plan hatte beide Regeln zu einer
verschmolzen und ist in `aec037a` korrigiert.

## 7. Reviewgrenze

Unverändert. Die zwei J.2-Darstellungen sind `domain: pending`. 196 fachliche Reviewträger sind
offen. Diese Notiz trifft keine fachliche Aussage über Anhang J; sie stellt nur fest, dass ein
Teil seiner Zeichen typografisch ist und das Schema dafür noch keine Form hat.
