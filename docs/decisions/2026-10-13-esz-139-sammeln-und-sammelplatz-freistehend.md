# Sammeln und Sammelplatz für Betroffene als freistehende Zeichen

> Stand: 13. Oktober 2026
> Status: umgesetzt (ESZ-139). Baut auf dem Altzeichen-Register aus ESZ-137 auf
> (`2026-10-13-esz-137-altzeichen-fernschreiben-festbild.md`).
> Anlass: Lifeline Hub, LLH-1159 (freie Lagekarten-Zeichen ohne Platzhalter).

## Anlass

Das Lagekarten-Altpaket bot `sammeln` und `sammelplatz-betroffene` als freistehende Symbole an,
also als Punktzeichen. In 5.4.0 gab es dafür:

- **Sammeln:** den Pfeil 5.2.6 (`{ kind: 'movement', movement: 'gathering', path }`). Er
  verlangt einen Verlauf, den ein Punktzeichen nicht hat.
- **Sammelplatz für Betroffene:** nur die Körpermarke `circle-double-arrow-lower-v` im
  12-mm-Kreis (F.3.12 Anlaufstelle für Betroffene), freistehend nichts.

## Vorlagen

Beide Zeichen stammen aus der DLRG DV 102 von 2011 (SKK-Empfehlungen 2010, Quelle `skk-2010`):

| Abschnitt | Seite | Bild | Gegenstück in BABZ 2025 |
|---|---|---|---|
| 7.6 Sammeln | 26 | Pfeil mit offener Spitze, kleiner Ring am Ende | 5.2.6 Sammeln, Zusammenführen: dasselbe Bild |
| 10.3.22 Sammelstelle | 40 | derselbe Pfeil im Kreis | F.3.6 Sammelstelle allgemein |
| 10.3.23 Sammelplatz für Betroffene | 40 | Stamm, Doppelpfeil mit **gefüllten** Spitzen, flaches V, **ohne Kreis** | nur im Kreis: F.3.12, mit offenen Spitzen |

Die Zuordnung 7.6 → 5.2.6 steht schon im LFH-433-Scoping (§3.2).

## Entscheidung

1. **Sammeln ist der Pfeil 5.2.6 auf dem Verlauf seiner Kapiteldatei.** `referenceMovementSpec`
   in `core` liefert jeden Pfeil aus 5.2 als fertige `MovementSpec`, mit dem Verlauf, auf dem die
   Referenz ihn zeigt: Schaft ab x 2 auf y 16, Spitze bei x 30, bei 5.2.6 Verlaufsende in der
   Ringmitte bei x 26, Fläche 32 × 32 mm. Wer ein Punktzeichen setzt, gibt keinen Verlauf ein.
   Das gilt für alle sechs Pfeile, also auch für 5.2.4 als „Sichten, Ordnen, Verteilen“ (ESZ-138).
2. **Kein neues Schemafeld.** `path` bleibt Pflicht. Ein Pfeil ohne Verlauf wäre eine zweite
   Schreibweise für dasselbe Bild, und die Kanonik müsste die beiden ineinander überführen.
   `referenceMovementSpec` liefert eine gewöhnliche `MovementSpec`: Prüfung, Serialisierung und
   Zeichnung sind dieselben wie für jeden Pfeil. Die Verläufe sind gegen die Fixtures der
   Referenzdateien gegatet (`conformance/src/freestanding-spec-fixtures.test.ts`), und die
   Fixtures gegen das Kennzahlenartefakt.
3. **Der Sammelplatz für Betroffene ist ein Altzeichen** im Register aus ESZ-137:
   `{ kind: 'pictogram', pictogram: 'site.affected-persons-assembly-point' }`, belegt an
   DV 102 10.3.23, Seite 40. Herkunft `legacy` (`freestandingProvenance`).
4. **Ein eigener Raum `site.*` (Platzzeichen ohne Körper).** Der Platz ist keine Fähigkeit
   (F.3.12: „keine eigenständige Capability“), kein Führungszeichen und kein IuK-Zeichen. Die
   Kennungen stehen in `LEGACY_SITE_IDS`; `PICTOGRAM_IDS` führt sie zuletzt.
5. **Konstruktion im Hausstil**, wie ESZ-137: abgelesen an der Vektorgrafik der Seite 40,
   Maßstab ist der Kreis des Nachbarzeichens 10.3.22 als 12-mm-Kreis (1 pt ≙ 0,9234 mm),
   Strich 0,5 mm statt umgerechnet 0,69 mm, Koordinaten auf 0,05 mm. Die Maße stehen im
   Modulkommentar von `core/src/geometry/pictograms/sites/01-legacy-skk-2010.ts`.
6. **Kanonik.** Das Altzeichen 10.3.23 zeigt ein anderes Bild als F.3.12 (kein Kreis, gefüllte
   Spitzen, längerer Stamm über dem Doppelpfeil), es wird also nicht umgeleitet. Der Kreis F.3.12
   bleibt die Spec `{ kind: 'circle-12', organization: 'hilfsorganisation',
   bodyMarks: ['circle-double-arrow-lower-v'] }`, die Sammelstelle 10.3.22 die Spec von F.3.6.

## Für den Hub (LLH-1159)

- `sammeln` (freistehend) → `referenceMovementSpec('gathering')`.
- `sammelplatz-betroffene` (freistehend) →
  `{ kind: 'pictogram', pictogram: 'site.affected-persons-assembly-point' }`.
- Im Grundzeichen bleiben die Körpermarken aus F.3.6 und F.3.12 wie bisher.

## Verworfen

- **`path` optional, Vorgabe der Referenzverlauf.** Erfüllt „ohne Verlauf“ wörtlich, schafft aber
  zwei Byteformen für dasselbe Bild und macht `path` für alle Leser optional.
- **Die Kreismarke F.3.12 ohne Kreis zeichnen.** Weicht sichtbar von der Vorlage ab (offene
  Spitzen, Stamm ab Kreisoberkante) und behauptete eine BABZ-Herkunft, die es freistehend nicht
  gibt.
- **Sammelplatz im Raum `capability.*`.** Falsche Aussage in der Kennung.
- **Den F.3.12-Kreis als Ort (`PLACES`) führen.** Zeigt nicht das Altzeichen, sondern seinen
  Nachfolger mit Kreis, und der ist als `SymbolSpec` schon beschreibbar.
