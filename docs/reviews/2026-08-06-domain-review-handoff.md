# Fachreview-Übergabe für den aktuellen Katalogstand

> Stand: 6. August 2026  
> Ergebnis dieses Dokuments: **Reviewpaket vorbereitet, keine fachliche Freigabe erteilt.**  
> Offener externer Blocker: Prüfung durch eine benannte Person mit einsatztaktischer Fachkunde.

## 1. Was diese Übergabe ist — und was nicht

Alle 24 Manifest-Einträge tragen weiterhin `domain: { status: 'pending' }`. Automatisierte
Geometrie-, Raster-, Kontrast-, Metadaten-, Box- und Clipping-Prüfungen belegen technische
Eigenschaften. Sie können weder die fachliche Bedeutung einer Bildidee noch ihre
Verwechslungsfreiheit oder einsatztaktische Eignung freigeben.

Nach der Projektspezifikation setzt `domain: approved` eine Prüfung gegen den maßgeblichen
Referenzstand durch eine Person mit einsatztaktischer Fachkunde voraus. Codex oder eine andere
Automatisierung darf das Dossier vorbereiten, Abweichungen markieren und Ergebnisse übertragen,
aber nicht als Fachreviewer signieren oder einen Reviewer erfinden.

Eine schrittweise Freigabe ist vorbereitet: `packages/catalog/src/domain-reviews.ts` enthält für
jeden der 24 Manifest-, zwölf Quellen- und einen Profilträger ein eigenes Reviewobjekt. Ein Test
erzwingt die Deckungsgleichheit in beide Richtungen und verhindert gemeinsam referenzierte
Sammelreviews. Alle 37 Statuswerte bleiben bis zur tatsächlichen Einzelprüfung unverändert
`pending`.

## 2. Status der projektinternen Baseline

`bbk-babz-2025` bezeichnet die projektinterne Coverage- und Vergleichsbaseline. Der Name ist
keine Behauptung normativer Geltung und bezeichnet keine geltende eigenständige Dienstvorschrift.
Nach der am 06.08.2026 geprüften
[offiziellen BABZ-Seite](https://lernplattform-babz-bund.de/goto.php?target=cat_109540) hob der
AFKzV in seiner 57. Sitzung am 13./14.03.2025 die vorläufige Anwendung auf. Die BABZ führt das
Ergebnis der Überarbeitungsgruppe als Diskussionsgrundlage für eine künftige FwDV 102/DV 102;
weitere Veröffentlichung und Verbreitung sind bis zum Abschluss der Beratungen ausgesetzt.

Für das Fachreview folgt daraus:

- Geprüft wird der im Projekt lokal archivierte, versionierte Arbeitsstand, nicht eine aktuell
  geltende Dienstvorschrift.
- Der Reviewer muss Zugang zu einer rechtmäßig vorhandenen Fassung des Hauptdokuments haben. Im
  Repository liegen nur die ignorierten Referenz-SVGs, nicht das Hauptdokument.
- Die geprüfte Fassung muss im Reviewbefund identifizierbar sein, mindestens durch Titel,
  Bezugsstand und SHA-256-Digest der tatsächlich verwendeten Datei.
- Vor Release 1.0 muss zusätzlich geprüft werden, ob ein neuer AFKzV-Beschluss oder eine
  nachfolgende FwDV 102/DV 102 den projektinternen Referenzstand ersetzt hat.

## 3. Evidenzkürzel

Die folgende Inventarliste nennt vorhandene technische Hilfen, keine fachlichen Freigaben:

- **FP:** aus dem lokalen Referenz-SVG abgeleitete Kennzahlen; `matchFingerprint` vergleicht nur
  die Hülle des `body`-Primitivs, nicht das vollständige Bild.
- **RS:** Datei- und Mehrgrößen-Rastersnapshot der eigenen Ausgabe; schützt vor Regressionen,
  ist aber kein autoritativer Referenzvergleich.
- **FARBE:** Palettenwert wird gegen die im Referenzartefakt gefundene Füllfarbe geprüft.
- **KOPF:** programmatische Prüfung der vermessenen Kopfmarken; die zusätzlichen Belegdateien
  stehen im Elementregister.
- **PG:** Piktogramm besteht Kommando-, Box-, Clipping- und Snapshot-Gate; Bildidee und
  Verwechslungsfreiheit bleiben ungeprüft.

Alle unten genannten 24 Referenz-SVGs sind im lokalen Ordner `taktische-zeichen/` vorhanden und
haben einen Eintrag in `packages/catalog/src/fingerprints.json`. Wegen der ungeklärten
Nutzungsgrundlage werden sie nicht eingecheckt.

## 4. Die 24 offenen Manifest-Reviews

Alle Schlüssel verwenden die Variante `primary` und das Profil `bund`.

| Manifestschlüssel | Titel | Implementierung | Referenzasset | technische Hilfe |
|---|---|---|---|---|
| `bbk-babz-2025:1.1#primary` | Taktische Formation | `base.formation` | `1.1_Taktische Formation.svg` | FP, RS |
| `bbk-babz-2025:1.2#primary` | Person | `base.person` | `1.2_Person.svg` | FP, RS |
| `bbk-babz-2025:1.6#primary` | Funktionsstelle | `base.post` | `1.6_Funktionsstelle.svg` | FP, RS |
| `bbk-babz-2025:1.7#primary` | Gebäude | `base.building` | `1.7_Gebäude.svg` | FP, RS |
| `bbk-babz-2025:1.8#primary` | Behälter, Ressource, Raum, Funkgerät | `base.container` | `1.8_Behälter Ressource Raum Funkgerät.svg` | FP, RS |
| `bbk-babz-2025:1.10#primary` | Maßnahme | `base.measure` | `1.10_Maßnahme.svg` | FP, RS |
| `bbk-babz-2025:1.11#primary` | Gefahr | `base.hazard` | `1.11_Gefahr.svg` | FP, RS |
| `bbk-babz-2025:1.12#primary` | Konkreter Punkt | `base.point` | `1.12_Konkreter Punkt.svg` | FP, RS |
| `bbk-babz-2025:C.1.1#primary` | Löschstaffel | `recipe.C.1.1` | `C.1.1_Löschstaffel.svg` | FP, RS |
| `bbk-babz-2025:C.1.2#primary` | Löschgruppe | `recipe.C.1.2` | `C.1.2_Löschgruppe.svg` | FP, RS |
| `bbk-babz-2025:D.3.7#primary` | Zugführer der Feuerwehr | `recipe.D.3.7` | `D.3.7_Zugführer der Feuerwehr.svg` | FP, RS |
| `bbk-babz-2025:2.1#primary` | Feuerwehr | `organization.feuerwehr` | `2.1_Feuerwehr.svg` | FARBE, Organisationsprofil-RS |
| `bbk-babz-2025:2.3#primary` | Technisches Hilfswerk | `organization.thw` | `2.3_Technisches Hilfswerk.svg` | FARBE, Organisationsprofil-RS |
| `bbk-babz-2025:2.4#primary` | Führung Leitung | `organization.fuehrung-leitung` | `2.4_Führung Leitung.svg` | FARBE, Organisationsprofil-RS |
| `bbk-babz-2025:2.5#primary` | Polizei | `organization.polizei` | `2.5_Polizei.svg` | FARBE, Organisationsprofil-RS |
| `bbk-babz-2025:2.6#primary` | Bundeswehr | `organization.bundeswehr` | `2.6_Bundeswehr.svg` | FARBE, Organisationsprofil-RS |
| `bbk-babz-2025:2.7#primary` | Sonstige Gefahrenabwehr | `organization.sonstige-gefahrenabwehr` | `2.7_Sonstige Gefahrenabwehr.svg` | FARBE, Organisationsprofil-RS |
| `bbk-babz-2025:2.8#primary` | Zivile Einheiten | `organization.zivile-einheiten` | `2.8_Zivile Einheiten.svg` | FARBE, Organisationsprofil-RS |
| `bbk-babz-2025:5.4.1#primary` | Trupp | `strength.trupp` | `5.4.1_Trupp.svg` | KOPF |
| `bbk-babz-2025:5.4.2#primary` | Staffel | `strength.staffel` | `5.4.2_Staffel.svg` | KOPF |
| `bbk-babz-2025:5.4.3#primary` | Gruppe | `strength.gruppe` | `5.4.3_Gruppe.svg` | KOPF |
| `bbk-babz-2025:5.4.4#primary` | Zug | `strength.zug` | `5.4.4_Zug.svg` | KOPF |
| `bbk-babz-2025:4.3.1#primary` | Brandbekämpfung | `capability.fire-fighting` | `4.3.1_Brandbekämpfung.svg` | PG, RS |
| `bbk-babz-2025:4.3.2#primary` | Löschwasser, Brauchwasser | `capability.service-water` | `4.3.2_Löschwasser Brauchwasser.svg` | PG, RS |

## 5. Fachliche Prüfkriterien

### Für jeden Eintrag

- Stimmen Abschnitt, Titel, Bedeutung, Implementierungs-ID und Referenzasset mit dem tatsächlich
  geprüften Hauptdokument überein?
- Ist `profile: bund` für genau diese Aussage sachgerecht, ohne eine vollständige Polizei- oder
  Bundeswehrsystematik zu behaupten?
- Ist die erzeugte Darstellung in einsatztaktischem Kontext eindeutig, verständlich und gegenüber
  benachbarten Zeichen ausreichend verwechslungsarm?
- Entspricht die semantische Beschreibung der Bildaussage und vermeidet sie weitergehende
  Behauptungen, die der Referenzstand nicht trägt?
- Ist eine sichtbare Abweichung eine Fehlerkorrektur oder eine bewusst akzeptierte Rekonstruktion?
  Bei bewusster Abweichung ist `deviation` mit konkreter Begründung zu verwenden, nicht
  `approved`.

### Grundzeichen aus Kapitel 1

- Vollständige Kontur statt nur Hüllenmaße vergleichen: Ecken, Rundungen, Öffnungen,
  Strichstärke, Drehung und Weißfläche.
- Prüfen, ob der starke Provenienzbegriff `status: verbatim` für die jeweilige eigenständig
  rekonstruierte Primitive fachlich vertretbar ist oder auf `derived` geändert werden muss.
- Bedeutung der zusammengefassten Kategorie „Behälter, Ressource, Raum, Funkgerät“ ausdrücklich
  bestätigen.

### Kompositionsrezepte

- Nicht nur den Körper, sondern Organisation, Stärkezeichen, Fähigkeit, relative Platzierung und
  vollständige Bezeichnung gegen das Referenzbeispiel prüfen.
- Bei `C.1.1` und `C.1.2` die Unterscheidung Staffel/Gruppe sowie das
  Brandbekämpfungspiktogramm prüfen; bei `D.3.7` Personengrundzeichen und Zugstärke.

### Organisationsfarben

- Organisationsbezeichnung und Farbzuordnung fachlich bestätigen; ein identischer Hexwert allein
  belegt die Zuordnung nicht.
- Für Polizei und Bundeswehr ausdrücklich dokumentieren, dass nur das interoperable Farbelement
  des Arbeitsstands geprüft wird, kein vollständiges organisationsspezifisches Profil.
- Die zusätzlichen Kontursignaturen der Alternativthemes als Projektfunktion, nicht als Aussage
  des BABZ-Referenzstands behandeln.

### Stärkeangaben

- Anzahl, Orientierung und Bedeutung der Marken prüfen. Die eigenständigen `5.4.x`-Dateien zeigen
  die Stärkeangabe nicht in derselben Kopfzonennutzung wie zusammengesetzte Zeichen; deshalb auch
  die im Elementregister genannten C-, D- und E-Beispiele heranziehen.
- Prüfen, ob Trupp, Staffel, Gruppe und Zug in sämtlichen belegten Körperformen gleich ausgelegt
  werden dürfen.

### Fähigkeiten

- Beide Piktogramme sind eigenständige Rekonstruktionen nach der Bildidee, keine übernommene
  Geometrie. Deshalb Bildbedeutung, charakteristische Merkmale und Verwechslungsfreiheit direkt
  beurteilen.
- `Brandbekämpfung` gegen ähnliche Richtungs-/Strahlzeichen und `Löschwasser, Brauchwasser` gegen
  andere Wasser-, Wellen- oder Versorgungszeichen abgrenzen.

## 6. Erforderlicher Reviewbefund je Eintrag

Ein abgeschlossener Befund muss mindestens enthalten:

1. exakten Manifestschlüssel;
2. Status `approved` oder `deviation`;
3. vollständigen Namen oder stabil zuordenbares Kürzel des menschlichen Reviewers;
4. Funktion beziehungsweise fachlichen Hintergrund, der die einsatztaktische Fachkunde
   nachvollziehbar macht;
5. ISO-Datum;
6. identifizierten Hauptdokumentstand und SHA-256-Digest;
7. geprüften Abschnitt und Referenzasset;
8. kurze Aussage zu Semantik, visueller Eindeutigkeit und Profilzuordnung;
9. bei `deviation` eine konkrete Abweichungsbeschreibung und Freigabebegründung.

Das derzeitige Schema speichert nur `reviewer`, `date` und `note`. Bis ein strukturiertes
Evidenzfeld existiert, müssen die Punkte 4 sowie 6 bis 9 nachvollziehbar in `note` oder in einem
verlinkten, versionierten Reviewprotokoll stehen.

`deviation` dokumentiert damit eine abgeschlossene Prüfung, ist nach der geltenden 1.0-Regel aber
weiter ein Release-Blocker: `releaseBlockers()` verlangt ausdrücklich `domain: approved`. Eine
Abweichung muss also vor 1.0 behoben oder durch eine eigene, ausdrücklich beschlossene
Governance-Regel beziehungsweise ein passendes Profil aufgelöst werden.

## 7. Automatisierbare Vorbereitung

Code kann den Fachreview beschleunigen, aber nicht ersetzen:

- SHA-256-Digests der lokal geprüften Quellen und Assets erzeugen;
- Referenz und aktuelle Ausgabe auf dieselbe Fläche normalisieren und nebeneinander darstellen;
- Overlay, Pixel-Diff und Hüllenabweichungen als Hinweise erzeugen;
- Manifestdaten, `SymbolSpec`, Quellenbezüge und alle technischen Gateresultate je Eintrag in ein
  Dossier schreiben;
- fehlende Reviewer, ungültige ISO-Daten und unbegründete `deviation`-Befunde im Gate ablehnen;
- eine ausdrücklich übermittelte menschliche Entscheidung in das Review-Ledger übertragen.

Nicht automatisierbar sind Fachkunde, Verantwortung, normative Einordnung, semantische
Richtigkeit und die Entscheidung, ob eine Abweichung einsatztaktisch akzeptabel ist.

## 8. Weitere offene Reviewträger

Neben den 24 Manifest-Einträgen tragen auch alle zwölf Quellen und das Profil `bund` ein offenes
fachliches Review. `releaseBlockers()` weist diese 13 Träger nun in
`sourceDomainReviewPending` und `profileDomainReviewPending` separat aus; die Coverage-CLI nennt
alle drei Gruppen und die Gesamtsumme.

Quellen:

- `bbk-babz-2025`
- `babz-svg-2025`
- `babz-hinweise-2024`
- `skk-2010`
- `fwdv-100`
- `fwdv-800`
- `thw-einheiten`
- `phjardas-tz`
- `din-14033`
- `din-13050`
- `din-14034-6`
- `din-14095`

Profil:

- `bund` — fachlich zu prüfen sind insbesondere Geltungsbereich, Quellenwahl und die Abgrenzung
  gegenüber organisationsspezifischen beziehungsweise künftig normativ geänderten Profilen.

Damit sind insgesamt **37 fachliche Reviewträger offen**: 24 Manifest-Einträge, zwölf Quellen und
ein Profil. Die Zahl ist eine Übergabeinventur, keine Freigabe und keine Aussage, dass alle 37
Prüfungen dieselben Kriterien haben.
