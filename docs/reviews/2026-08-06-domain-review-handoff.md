# Fachreview-Übergabe für den aktuellen Katalogstand

> **Abgelöst durch** [`2026-08-28-domain-review-handoff.md`](2026-08-28-domain-review-handoff.md)
> (Deckblatt) und das Generat [`2026-08-28-domain-review-dossier.md`](2026-08-28-domain-review-dossier.md)
> aus `pnpm cli review-dossier`. Die Handtabelle in Abschnitt 4 nennt 181 Einträge; der Ledger
> führt am 28. August 2026 544. Dieses Dokument bleibt als Stand vom 7. August 2026 erhalten.

> Stand: 7. August 2026
> Reviewpaket vorbereitet, keine fachliche Freigabe erteilt.
> Offen: 181 Manifestreviews, 12 Quellenreviews, 1 Profilreview = 194 Reviewträger.
> Kapitel 5.8: 61 Abschnitte, 67 Darstellungen, alle domain: pending.
> Kapitel 4: 88 Abschnitte, 92 Darstellungen, alle domain: pending.
> Offener externer Blocker: Prüfung durch eine benannte Person mit einsatztaktischer Fachkunde.

## 1. Was diese Übergabe ist — und was nicht

Alle 181 Manifest-Einträge tragen weiterhin `domain: { status: 'pending' }`. Automatisierte
Geometrie-, Raster-, Kontrast-, Metadaten-, Box- und Clipping-Prüfungen belegen technische
Eigenschaften. Sie können weder die fachliche Bedeutung einer Bildidee noch ihre
Verwechslungsfreiheit oder einsatztaktische Eignung freigeben.

Nach der Projektspezifikation setzt `domain: approved` eine Prüfung gegen den maßgeblichen
Referenzstand durch eine Person mit einsatztaktischer Fachkunde voraus. Codex oder eine andere
Automatisierung darf das Dossier vorbereiten, Abweichungen markieren und Ergebnisse übertragen,
aber nicht als Fachreviewer signieren oder einen Reviewer erfinden.

Eine schrittweise Freigabe ist vorbereitet: `packages/catalog/src/domain-reviews.ts` enthält für
jeden der 181 Manifest-, zwölf Quellen- und einen Profilträger ein eigenes Reviewobjekt. Ein Test
erzwingt die Deckungsgleichheit in beide Richtungen und verhindert gemeinsam referenzierte
Sammelreviews. Alle 194 Statuswerte bleiben bis zur tatsächlichen Einzelprüfung unverändert
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

Die 24 Referenz-SVGs des bisherigen Dossiers sind im lokalen Ordner `taktische-zeichen/` vorhanden
und haben einen Eintrag in `packages/catalog/src/fingerprints.json`. Die Referenzdateien für
Kapitel 4 bleiben ebenfalls ausschließlich lokal; ihre Bildideen wurden als unabhängige
Millimeterkonstruktionen umgesetzt. Wegen der ungeklärten Nutzungsgrundlage werden die
Referenzdateien nicht eingecheckt.

## 4. Die 181 offenen Manifest-Reviews

Alle Schlüssel verwenden das Profil `bund`. Die ersten 24 Zeilen bleiben aus dem bisherigen
Dossier erhalten; `4.3.1` und `4.3.2` zählen darin bereits zu Kapitel 4. Die anschließend
ergänzten 90 Zeilen vervollständigen das Kapitel-4-Inventar auf 92 Darstellungen. Vier dieser
Darstellungen verwenden die Variante `alternative`, alle übrigen `primary`. Danach folgen die
67 Kapitel-5.8-Darstellungen mit sechs separaten Alternativzeilen.

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
| `bbk-babz-2025:4.1.1#primary` | ABC-/CBRN-Schutz | `capability.cbrn-protection` | `4.1.1_ABC_CBRN-Schutz.svg` | PG, RS |
| `bbk-babz-2025:4.1.2#primary` | Messen, Spüren, Detektieren | `capability.cbrn-detection` | `4.1.2_Messen Spüren Detektieren.svg` | PG, RS |
| `bbk-babz-2025:4.1.3#primary` | Dekontaminieren | `capability.decontamination` | `4.1.3_Dekontaminieren.svg` | PG, RS |
| `bbk-babz-2025:4.1.4#primary` | Umweltschädenbeseitigung auf Gewässern | `capability.water-environmental-damage-control` | `4.1.4_Umweltschädenbeseitigung auf Gewässern.svg` | PG, RS |
| `bbk-babz-2025:4.1.5#primary` | Trinkwasseraufbereitung | `capability.drinking-water-treatment` | `4.1.5_Trinkwasseraufbereitung.svg` | PG, RS |
| `bbk-babz-2025:4.1.6#primary` | Atomare Stoffe | `capability.radioactive-materials` | `4.1.6_Atomare Stoffe.svg` | PG, RS |
| `bbk-babz-2025:4.1.6#alternative` | Atomare Stoffe | `capability.radioactive-materials` | `4.1.6_Atomare Stoffe_Alternative.svg` | PG, RS |
| `bbk-babz-2025:4.1.7#primary` | Biologische Stoffe | `capability.biological-materials` | `4.1.7_Biologische Stoffe.svg` | PG, RS |
| `bbk-babz-2025:4.1.7#alternative` | Biologische Stoffe | `capability.biological-materials` | `4.1.7_Biologische Stoffe_Alternative.svg` | PG, RS |
| `bbk-babz-2025:4.1.8#primary` | Chemische Stoffe | `capability.chemical-materials` | `4.1.8_Chemische Stoffe.svg` | PG, RS |
| `bbk-babz-2025:4.1.8#alternative` | Chemische Stoffe | `capability.chemical-materials` | `4.1.8_Chemische Stoffe_Alternative.svg` | PG, RS |
| `bbk-babz-2025:4.2.1#primary` | Betreuung | `capability.care` | `4.2.1_Betreuung Grundzeichne.svg` | PG, RS |
| `bbk-babz-2025:4.2.2#primary` | PSNV | `capability.psychosocial-emergency-care` | `4.2.2_PSNV.svg` | PG, RS |
| `bbk-babz-2025:4.2.3#primary` | Seelsorge | `capability.pastoral-care` | `4.2.3_Seelsorge.svg` | PG, RS |
| `bbk-babz-2025:4.2.4#primary` | Temporäre Unterbringung mit Ruhemöglichkeit | `capability.temporary-accommodation-resting` | `4.2.4_Temporäre Unterbringung mit Ruhemöglichkeit.svg` | PG, RS |
| `bbk-babz-2025:4.2.5#primary` | Temporäre Unterbringung mit Sitzmöglichkeit | `capability.temporary-accommodation-seating` | `4.2.5_Temporäre Unterbringung mit Sitzmöglichkeit.svg` | PG, RS |
| `bbk-babz-2025:4.3.3#primary` | Schaummittel | `capability.foam-agent` | `4.3.3_Schaummittel.svg` | PG, RS |
| `bbk-babz-2025:4.3.4#primary` | Sonderlöschmittel, fest | `capability.solid-extinguishing-agent` | `4.3.4_Sonderlöschmittel fest.svg` | PG, RS |
| `bbk-babz-2025:4.3.5#primary` | Sonderlöschmittel, gasförmig | `capability.gaseous-extinguishing-agent` | `4.3.5_Sonderlöschmittel gasförmig.svg` | PG, RS |
| `bbk-babz-2025:4.3.6#primary` | Atemschutz | `capability.respiratory-protection` | `4.3.6_Atemschutz.svg` | PG, RS |
| `bbk-babz-2025:4.4.1#primary` | Erkunden | `capability.reconnaissance` | `4.4.1_Erkunden.svg` | PG, RS |
| `bbk-babz-2025:4.4.2#primary` | Orten, biologisch | `capability.biological-location` | `4.4.2_Orten biologisch.svg` | PG, RS |
| `bbk-babz-2025:4.4.3#primary` | Orten, technisch | `capability.technical-location` | `4.4.3_Orten technisch.svg` | PG, RS |
| `bbk-babz-2025:4.5.1#primary` | Bergung | `capability.recovery` | `4.5.1_Bergung.svg` | PG, RS |
| `bbk-babz-2025:4.5.2#primary` | Retten aus Höhen und Tiefen mit tragbaren Leitern | `capability.rescue-portable-ladders` | `4.5.2_Retten aus Höhen und Tiefen mit tragbaren Leitern.svg` | PG, RS |
| `bbk-babz-2025:4.5.3#primary` | Retten aus Höhen und Tiefen mit Drehleiter | `capability.rescue-aerial-ladder` | `4.5.3_Retten aus Höhen und Tiefen mit Drehleiter.svg` | PG, RS |
| `bbk-babz-2025:4.5.4#primary` | Retten aus Höhen und Tiefen mit Teleskopgelenkmast | `capability.rescue-articulated-boom` | `4.5.4_Retten aus Höhen und Tiefen mit Teleskopgelenkmast.svg` | PG, RS |
| `bbk-babz-2025:4.5.5#primary` | Einsatz von Wasserfahrzeugen | `capability.watercraft-operations` | `4.5.5_Einsatz von Wasserfahrzeugen.svg` | PG, RS |
| `bbk-babz-2025:4.5.6#primary` | Bergrettung | `capability.mountain-rescue` | `4.5.6_Bergrettung.svg` | PG, RS |
| `bbk-babz-2025:4.5.7#primary` | Spezielle Rettung aus Höhen und Tiefen | `capability.special-height-depth-rescue` | `4.5.7_Spezielle Rettung aus Höhen und Tiefen.svg` | PG, RS |
| `bbk-babz-2025:4.5.8#primary` | Wasserrettung | `capability.water-rescue` | `4.5.8_Wasserrettung.svg` | PG, RS |
| `bbk-babz-2025:4.6.1#primary` | Sanität, Grundzeichen | `capability.medical-service` | `4.6.1_Sanität Grundzeichen.svg` | PG, RS |
| `bbk-babz-2025:4.6.2#primary` | Pflege | `capability.nursing` | `4.6.2_Pflege.svg` | PG, RS |
| `bbk-babz-2025:4.6.3#primary` | Rettungswesen / Intensivmedizin | `capability.intensive-care` | `4.6.3_Rettungswesen_Intensivmedizin.svg` | PG, RS |
| `bbk-babz-2025:4.6.4#primary` | Arztwesen | `capability.physician` | `4.6.4_Arztwesen.svg` | PG, RS |
| `bbk-babz-2025:4.6.5#primary` | Patiententransport | `capability.patient-transport` | `4.6.5_Patiententransport.svg` | PG, RS |
| `bbk-babz-2025:4.6.6#primary` | Krankenhaus | `capability.hospital` | `4.6.6_Krankenhaus.svg` | PG, RS |
| `bbk-babz-2025:4.7.1#primary` | Abwehr von Wassergefahren | `capability.water-hazard-control` | `4.7.1_Abwehr von Wassergefahren.svg` | PG, RS |
| `bbk-babz-2025:4.7.2#primary` | Baggerarbeiten | `capability.excavation` | `4.7.2_Baggerarbeiten.svg` | PG, RS |
| `bbk-babz-2025:4.7.3#primary` | Beleuchten | `capability.lighting` | `4.7.3_Beleuchten.svg` | PG, RS |
| `bbk-babz-2025:4.7.4#primary` | Belüften | `capability.ventilation` | `4.7.4_Belüften.svg` | PG, RS |
| `bbk-babz-2025:4.7.5#primary` | Entlüften | `capability.air-extraction` | `4.7.5_Entlüften.svg` | PG, RS |
| `bbk-babz-2025:4.7.6#primary` | Kampfmittelräumung | `capability.explosive-ordnance-clearance` | `4.7.6_Kampfmittelräumung.svg` | PG, RS |
| `bbk-babz-2025:4.7.7#primary` | Einsatz von Handwerkzeugen | `capability.hand-tools` | `4.7.7_Einsatz von Handwerkzeugen.svg` | PG, RS |
| `bbk-babz-2025:4.7.8#primary` | Hebearbeit mit Gabelstapler | `capability.forklift-lifting` | `4.7.8_Hebearbeit mit Gabelstapler.svg` | PG, RS |
| `bbk-babz-2025:4.7.9#primary` | Hebearbeit mit Kran | `capability.crane-lifting` | `4.7.9_Hebearbeit mit Kran.svg` | PG, RS |
| `bbk-babz-2025:4.7.10#primary` | Heben von Lasten oder Personen | `capability.lifting-loads-persons` | `4.7.10_Heben von Lasten oder Personen.svg` | PG, RS |
| `bbk-babz-2025:4.7.10#alternative` | Heben von Lasten oder Personen | `capability.lifting-loads-persons` | `4.7.10_Heben von Lasten oder Personen_Alternative.svg` | PG, RS |
| `bbk-babz-2025:4.7.11#primary` | Heben / Räumen | `capability.lifting-clearing` | `4.7.11_Heben-Räumen.svg` | PG, RS |
| `bbk-babz-2025:4.7.12#primary` | Fernmanipulieren | `capability.remote-manipulation` | `4.7.12_Fernmanipulieren.svg` | PG, RS |
| `bbk-babz-2025:4.7.13#primary` | Motorsägearbeiten | `capability.chainsaw` | `4.7.13_Motorsägearbeiten.svg` | PG, RS |
| `bbk-babz-2025:4.7.14#primary` | Pumpen | `capability.pumping` | `4.7.14_Pumpen.svg` | PG, RS |
| `bbk-babz-2025:4.7.15#primary` | Räumarbeiten mit Maschine | `capability.mechanized-clearing` | `4.7.15_Räumarbeiten mit Maschine.svg` | PG, RS |
| `bbk-babz-2025:4.7.16#primary` | Sicherheit | `capability.safety` | `4.7.16_Sicherheit.svg` | PG, RS |
| `bbk-babz-2025:4.7.17#primary` | Sprengen | `capability.blasting` | `4.7.17_Sprengen.svg` | PG, RS |
| `bbk-babz-2025:4.7.18#primary` | Technische Hilfeleistung | `capability.technical-assistance` | `4.7.18_Technische Hilfeleistung.svg` | PG, RS |
| `bbk-babz-2025:4.7.19#primary` | Transportieren | `capability.transport` | `4.7.19_Transportieren.svg` | PG, RS |
| `bbk-babz-2025:4.7.20#primary` | Türöffnung | `capability.door-opening` | `4.7.20_Türöffnung.svg` | PG, RS |
| `bbk-babz-2025:4.7.21#primary` | Höhenunterschiede überwinden | `capability.overcoming-height-differences` | `4.7.21_Höhenunterschiede überwinden.svg` | PG, RS |
| `bbk-babz-2025:4.7.22#primary` | Absicherung | `capability.securing` | `4.7.22_Absicherung.svg` | PG, RS |
| `bbk-babz-2025:4.7.23#primary` | Warnen mit optischen Anzeigen | `capability.optical-warning` | `4.7.23_Warnen mit optischen Anzeigen.svg` | PG, RS |
| `bbk-babz-2025:4.7.24#primary` | Warnen mit Lautsprecherdurchsagen | `capability.loudspeaker-warning` | `4.7.24_Warnen mit Lautsprecherdurchsagen.svg` | PG, RS |
| `bbk-babz-2025:4.7.25#primary` | Warnen mit Sirenen | `capability.siren-warning` | `4.7.25_Warnen mit Sirenen.svg` | PG, RS |
| `bbk-babz-2025:4.7.26#primary` | Wasserförderung | `capability.water-conveyance` | `4.7.26_Wasserförderung.svg` | PG, RS |
| `bbk-babz-2025:4.7.27#primary` | Wasserrückhaltung | `capability.water-retention` | `4.7.27_Wasserrückhaltung.svg` | PG, RS |
| `bbk-babz-2025:4.7.28#primary` | Ziehen von Lasten | `capability.load-pulling` | `4.7.28_Ziehen von Lasten.svg` | PG, RS |
| `bbk-babz-2025:4.8.1#primary` | Behälter | `capability.container-resource` | `4.8.1_Behälter.svg` | PG, RS |
| `bbk-babz-2025:4.8.2#primary` | Betriebsstoffe / Verbrauchsgüter | `capability.fuels-consumables` | `4.8.2_Betriebsstoffe Verbrauchsgüter.svg` | PG, RS |
| `bbk-babz-2025:4.8.3#primary` | Brücke | `capability.bridge` | `4.8.3_Brücke.svg` | PG, RS |
| `bbk-babz-2025:4.8.4#primary` | Behelfsbrückenbau | `capability.temporary-bridge-construction` | `4.8.4_Behelfsbrückenbau.svg` | PG, RS |
| `bbk-babz-2025:4.8.5#primary` | Entsorgung | `capability.waste-disposal` | `4.8.5_Entsorgung.svg` | PG, RS |
| `bbk-babz-2025:4.8.6#primary` | Instandhaltung | `capability.maintenance` | `4.8.6_Instandhaltung.svg` | PG, RS |
| `bbk-babz-2025:4.8.7#primary` | Sandsack | `capability.sandbag` | `4.8.7_Sandsack.svg` | PG, RS |
| `bbk-babz-2025:4.8.8#primary` | Sandsackbefüllung | `capability.sandbag-filling` | `4.8.8_Sandsackbefüllung.svg` | PG, RS |
| `bbk-babz-2025:4.8.9#primary` | Sanitäre Einrichtung / Waschmöglichkeit | `capability.washing-facility` | `4.8.9_Sanitäre Einrichtung_Waschmöglichkeit.svg` | PG, RS |
| `bbk-babz-2025:4.8.10#primary` | Sanitäre Einrichtung / WC | `capability.toilet-facility` | `4.8.10_Sanitäre Einrichtung_WC.svg` | PG, RS |
| `bbk-babz-2025:4.8.11#primary` | Stromversorgung | `capability.power-supply` | `4.8.11_Stromversorgung.svg` | PG, RS |
| `bbk-babz-2025:4.8.12#primary` | Trinkwasser | `capability.drinking-water` | `4.8.12_Trinkwasser.svg` | PG, RS |
| `bbk-babz-2025:4.8.13#primary` | Verpflegung | `capability.catering` | `4.8.13_Verpflegung.svg` | PG, RS |
| `bbk-babz-2025:4.8.14#primary` | Verpflegung / Zubereitung | `capability.meal-preparation` | `4.8.14_Verpflegung_Zubereitung.svg` | PG, RS |
| `bbk-babz-2025:4.8.15#primary` | Schnelleinsatzzelt | `capability.rapid-deployment-tent` | `4.8.15_Schnelleinsatzzelt.svg` | PG, RS |
| `bbk-babz-2025:4.8.16#primary` | Stangengerüstzelt | `capability.frame-tent` | `4.8.16_Stangengerüstzelt.svg` | PG, RS |
| `bbk-babz-2025:4.9.1#primary` | Information und Kommunikation / Fernmeldewesen | `capability.information-communications` | `4.9.1_Information und Kommunikation Fernmeldewesen.svg` | PG, RS |
| `bbk-babz-2025:4.10.1#primary` | Veterinärwesen | `capability.veterinary` | `4.10.1_Veterinärwesen.svg` | PG, RS |
| `bbk-babz-2025:4.10.2#primary` | Schlachten / Keulen | `capability.slaughter-culling` | `4.10.2_Schlachten_Keulen.svg` | PG, RS |
| `bbk-babz-2025:4.10.3#primary` | Huhn | `capability.chicken` | `4.10.3_Huhn.svg` | PG, RS |
| `bbk-babz-2025:4.10.4#primary` | Pferd | `capability.horse` | `4.10.4_Pferd.svg` | PG, RS |
| `bbk-babz-2025:4.10.5#primary` | Rind | `capability.cattle` | `4.10.5_Rind.svg` | PG, RS |
| `bbk-babz-2025:4.10.6#primary` | Schaf | `capability.sheep` | `4.10.6_Schaf.svg` | PG, RS |
| `bbk-babz-2025:4.10.7#primary` | Schwein | `capability.pig` | `4.10.7_Schwein.svg` | PG, RS |
| `bbk-babz-2025:5.8.1.1#primary` | Einsatztaktik: Retten | `state.tactical-rescue` | `5.8.1.1_Einsatztaktik_Retten.svg` | PG, RS |
| `bbk-babz-2025:5.8.1.2#primary` | Einsatztaktik: Angreifen | `state.tactical-attack` | `5.8.1.2_Einsatztaktik_Angreifen.svg` | PG, RS |
| `bbk-babz-2025:5.8.1.3#primary` | Einsatztaktik: Verteidigen | `state.tactical-defense` | `5.8.1.3_Einsatztaktik_Verteidigen.svg` | PG, RS |
| `bbk-babz-2025:5.8.1.4#primary` | Einsatztaktik: Rückzug | `state.tactical-retreat` | `5.8.1.4_Einsatztaktik_Rückzug.svg` | PG, RS |
| `bbk-babz-2025:5.8.1.5#primary` | Überschwemmtes Gebiet | `state.flooded-area` | `5.8.1.5_Überschwemmtes Gebiet.svg` | PG, RS |
| `bbk-babz-2025:5.8.1.6#primary` | Gefahr durch Wassereinbruch | `state.water-ingress-hazard` | `5.8.1.6_Gefahr durch Wassereinbruch.svg` | PG, RS |
| `bbk-babz-2025:5.8.1.7#primary` | Gefährliche Stoffe | `state.hazardous-substances` | `5.8.1.7_Gefährliche Stoffe.svg` | PG, RS |
| `bbk-babz-2025:5.8.1.7#alternative` | Gefährliche Stoffe | `state.hazardous-substances` | `5.8.1.7_Gefährliche Stoffe_Chlor.svg` | PG, RS |
| `bbk-babz-2025:5.8.1.8#primary` | Gefahr durch Radioaktivität | `state.radioactivity-hazard` | `5.8.1.8_Gefahr durch Radioaktivität.svg` | PG, RS |
| `bbk-babz-2025:5.8.1.8#alternative` | Gefahr durch Radioaktivität | `state.radioactivity-hazard` | `5.8.1.8_Gefahr durch Radioaktivität _A.svg` | PG, RS |
| `bbk-babz-2025:5.8.1.9#primary` | Gefahr durch elektrische Energie | `state.electrical-energy-hazard` | `5.8.1.9_Gefahr durch elektrische Energie.svg` | PG, RS |
| `bbk-babz-2025:5.8.1.10#primary` | Gefahr durch Mineralöl | `state.mineral-oil-hazard` | `5.8.1.10_Gefahr durch Mineralöl.svg` | PG, RS |
| `bbk-babz-2025:5.8.1.11#primary` | Gefahr durch Explosion | `state.explosion-hazard` | `5.8.1.11_Gefahr durch Explosion.svg` | PG, RS |
| `bbk-babz-2025:5.8.1.12#primary` | Gefahr durch explosionsfähige Kampfmittel | `state.explosive-ordnance-hazard` | `5.8.1.12_Gefahr durch explosionsfähige Kampfmittel.svg` | PG, RS |
| `bbk-babz-2025:5.8.1.13#primary` | Hinweis auf Vermutung | `state.suspected-situation` | `5.8.1.13_Hinweis auf Vermutung.svg` | PG, RS |
| `bbk-babz-2025:5.8.1.13#alternative` | Hinweis auf Vermutung | `state.suspected-situation` | `5.8.1.13_Hinweis auf Vermutung_2.svg` | PG, RS |
| `bbk-babz-2025:5.8.1.14#primary` | Hinweis auf akute Situation | `state.acute-situation` | `5.8.1.14_Hinweis auf akute Situation.svg` | PG, RS |
| `bbk-babz-2025:5.8.1.14#alternative` | Hinweis auf akute Situation | `state.acute-situation` | `5.8.1.14_Hinweis auf akute Situation_2.svg` | PG, RS |
| `bbk-babz-2025:5.8.2.1#primary` | Geringfügig erhöhte Aktivität / bis 25 Prozent Ausfall | `state.activity-slightly-increased-outage-up-to-25-percent` | `5.8.2.1_geringfügig erhöhte Aktivität_bis 25 Prozent Ausfall.svg` | PG, RS |
| `bbk-babz-2025:5.8.2.2#primary` | Moderat erhöhte Aktivität / bis 50 Prozent Ausfall | `state.activity-moderately-increased-outage-up-to-50-percent` | `5.8.2.2_moderat erhöhte Aktivität_bis 50 Prozent Ausfall.svg` | PG, RS |
| `bbk-babz-2025:5.8.2.3#primary` | Deutlich erhöhte Aktivität / bis 75 Prozent Ausfall | `state.activity-significantly-increased-outage-up-to-75-percent` | `5.8.2.3_deutlich erhöhte Aktivität_bis 75 Prozent Ausfall.svg` | PG, RS |
| `bbk-babz-2025:5.8.2.4#primary` | Stark erhöhte Aktivität / Totalausfall | `state.activity-strongly-increased-total-outage` | `5.8.2.4_Stark erhöhte Aktivität_Totalausfall.svg` | PG, RS |
| `bbk-babz-2025:5.8.3.1#primary` | Tendenz steigend | `state.tendency-rising` | `5.8.3.1_Tendenz steigend.svg` | PG, RS |
| `bbk-babz-2025:5.8.3.2#primary` | Tendenz unverändert | `state.tendency-unchanged` | `5.8.3.2_Tendenz unverändert.svg` | PG, RS |
| `bbk-babz-2025:5.8.3.3#primary` | Tendenz fallend | `state.tendency-falling` | `5.8.3.3_Tendenz fallend.svg` | PG, RS |
| `bbk-babz-2025:5.8.4.1#primary` | Angeschlagen | `state.damaged` | `5.8.4.1_Angeschlagen.svg` | PG, RS |
| `bbk-babz-2025:5.8.4.2#primary` | Teilzerstört | `state.partially-destroyed` | `5.8.4.2_Teilzerstört.svg` | PG, RS |
| `bbk-babz-2025:5.8.4.3#primary` | Total zerstört | `state.destroyed` | `5.8.4.3_Total zerstört.svg` | PG, RS |
| `bbk-babz-2025:5.8.5.1#primary` | Entstehungsbrand | `state.incipient-fire` | `5.8.5.1_Entstehungsbrand.svg` | PG, RS |
| `bbk-babz-2025:5.8.5.2#primary` | Fortentwickelter Brand | `state.developed-fire` | `5.8.5.2_fortentwickelter Brand.svg` | PG, RS |
| `bbk-babz-2025:5.8.5.3#primary` | Vollbrand | `state.fully-developed-fire` | `5.8.5.3_Vollbrand.svg` | PG, RS |
| `bbk-babz-2025:5.8.6.1#primary` | Erkranktes Tier | `state.sick-animal` | `5.8.6.1_erkranktes Tier.svg` | PG, RS |
| `bbk-babz-2025:5.8.6.2#primary` | Kontaminiertes Tier | `state.contaminated-animal` | `5.8.6.2_kontaminiertes Tier.svg` | PG, RS |
| `bbk-babz-2025:5.8.6.2#alternative` | Kontaminiertes Tier | `state.contaminated-animal` | `5.8.6.2_kontaminiertes Tier_K.svg` | PG, RS |
| `bbk-babz-2025:5.8.6.3#primary` | Totes Tier | `state.dead-animal` | `5.8.6.3_Totes Tier.svg` | PG, RS |
| `bbk-babz-2025:5.8.7.1#primary` | Sonnig | `state.weather-sunny` | `5.8.7.1_Sonnig.svg` | PG, RS |
| `bbk-babz-2025:5.8.7.2#primary` | Wolkig | `state.weather-cloudy` | `5.8.7.2_Wolkig.svg` | PG, RS |
| `bbk-babz-2025:5.8.7.3#primary` | Bedeckung des Himmels 4 von 8 | `state.weather-cloud-cover-four-eighths` | `5.8.7.3_Bedeckung des Himmels 4 von 8.svg` | PG, RS |
| `bbk-babz-2025:5.8.7.4#primary` | Nebelig | `state.weather-foggy` | `5.8.7.4_Nebelig.svg` | PG, RS |
| `bbk-babz-2025:5.8.7.5#primary` | Regnerisch | `state.weather-rainy` | `5.8.7.5_Regnerisch.svg` | PG, RS |
| `bbk-babz-2025:5.8.7.6#primary` | Hagelnd | `state.weather-hailing` | `5.8.7.6_Hagelnd.svg` | PG, RS |
| `bbk-babz-2025:5.8.7.7#primary` | Gewittrig | `state.weather-thunderstorm` | `5.8.7.7_Gewittrig.svg` | PG, RS |
| `bbk-babz-2025:5.8.7.8#primary` | Schneiend | `state.weather-snowing` | `5.8.7.8_Schneiend.svg` | PG, RS |
| `bbk-babz-2025:5.8.7.9#primary` | Temperatur | `state.weather-temperature` | `5.8.7.9_Temperatur.svg` | PG, RS |
| `bbk-babz-2025:5.8.7.10#primary` | Windig | `state.weather-windy` | `5.8.7.10_Windig.svg` | PG, RS |
| `bbk-babz-2025:5.8.8.1#primary` | Person unverletzt | `state.person-uninjured` | `5.8.8.1_Person Unverletz.svg` | PG, RS |
| `bbk-babz-2025:5.8.8.2#primary` | Person betroffen | `state.person-affected` | `5.8.8.2_Person Betroffen.svg` | PG, RS |
| `bbk-babz-2025:5.8.8.3#primary` | Person verletzt | `state.person-injured` | `5.8.8.3_Person Verletzt.svg` | PG, RS |
| `bbk-babz-2025:5.8.8.4#primary` | Person verletzt - Sichtungskategorie | `state.person-injured-triage-category` | `5.8.8.4_Person Verletzt_Sichtungskategorie.svg` | PG, RS |
| `bbk-babz-2025:5.8.8.5#primary` | Person verletzt - Transportpriorität | `state.person-injured-transport-priority` | `5.8.8.5_Person Verletzt_Transportpriorität.svg` | PG, RS |
| `bbk-babz-2025:5.8.8.6#primary` | Person kontaminiert | `state.person-contaminated` | `5.8.8.6_Person Kontaminiert.svg` | PG, RS |
| `bbk-babz-2025:5.8.8.6#alternative` | Person kontaminiert | `state.person-contaminated` | `5.8.8.6_Person Kontaminiert_Alternative.svg` | PG, RS |
| `bbk-babz-2025:5.8.8.7#primary` | Person tot | `state.person-dead` | `5.8.8.7_Person Tot.svg` | PG, RS |
| `bbk-babz-2025:5.8.8.8#primary` | Person vermisst | `state.person-missing` | `5.8.8.8_Person Vermisst.svg` | PG, RS |
| `bbk-babz-2025:5.8.8.9#primary` | Person in Wassergefahr | `state.person-in-water-danger` | `5.8.8.9_Person in Wassergefahr.svg` | PG, RS |
| `bbk-babz-2025:5.8.8.10#primary` | Person in Zwangslage | `state.person-in-distress` | `5.8.8.10_Person in Zwangslage.svg` | PG, RS |
| `bbk-babz-2025:5.8.8.11#primary` | Person gerettet | `state.person-rescued` | `5.8.8.11_Person gerettet.svg` | PG, RS |
| `bbk-babz-2025:5.8.8.12#primary` | Person zu transportieren | `state.person-to-be-transported` | `5.8.8.12_Person zu transportieren.svg` | PG, RS |
| `bbk-babz-2025:5.8.8.13#primary` | Transport einer Person | `state.person-in-transport` | `5.8.8.13_Transport einer Person.svg` | PG, RS |
| `bbk-babz-2025:5.8.8.14#primary` | Person transportiert | `state.person-transported` | `5.8.8.14_Person transportiert.svg` | PG, RS |
| `bbk-babz-2025:5.8.8.15#primary` | Person besonders betreuungsbedürftig | `state.person-needing-special-care` | `5.8.8.15_Person besonders betreuungsbedürftig.svg` | PG, RS |
| `bbk-babz-2025:5.8.8.16#primary` | Person pflegebedürftig | `state.person-care-dependent` | `5.8.8.16_Person pflegebedürftig.svg` | PG, RS |
| `bbk-babz-2025:5.8.8.17#primary` | Person mobilitätseingeschränkt | `state.person-mobility-impaired` | `5.8.8.17_Person mobilitätseingeschränkt.svg` | PG, RS |
| `bbk-babz-2025:5.8.9.1#primary` | Gesperrt | `state.route-closed` | `5.8.9.1_Gesperrt.svg` | PG, RS |
| `bbk-babz-2025:5.8.9.2#primary` | Einbahnstraßenregelung | `state.one-way-traffic` | `5.8.9.2_Einbahnstraßenregelung.svg` | PG, RS |
| `bbk-babz-2025:5.8.9.3#primary` | Schwierig befahrbar - teilblockiert | `state.route-difficult-to-pass` | `5.8.9.3_Schwierig befahrbar_Teilblockiert.svg` | PG, RS |
| `bbk-babz-2025:5.8.9.4#primary` | Unbefahrbar - blockiert | `state.route-impassable` | `5.8.9.4_Unbefahrbar_Blockiert.svg` | PG, RS |

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

- Für jede der 92 Darstellungen die semantische Bedeutung und ihre charakteristischen Merkmale
  direkt beurteilen.
- Jede Fähigkeit gegenüber fachlich oder visuell benachbarten Fähigkeiten abgrenzen; insbesondere
  darf eine ähnliche Grundform keine ungewollte Verwechslung erzeugen.
- Bei `4.1.6`, `4.1.7`, `4.1.8` und `4.7.10` die Beziehung zwischen `primary` und `alternative`
  prüfen: Beide Darstellungen müssen dieselbe Bedeutung tragen, zugleich als getrennte Varianten
  nachvollziehbar bleiben.
- Die Profilzuordnung `bund` je Darstellung bestätigen, ohne daraus eine organisationsspezifische
  oder normative Vollständigkeit abzuleiten.
- Die Lesbarkeit in den geprüften Einsatzgrößen von 16, 24, 32, 64, 128 und 256 Pixeln fachlich
  bewerten; ein bestandenes Rastergate belegt nur technische Sichtbarkeit.
- Festhalten, ob die unabhängige Rekonstruktion mit Quellenstatus `derived` bestehen bleibt oder
  eine bewusste Abweichung als `deviation` konkret dokumentiert werden muss.

### Zustände

- Die fachliche Bedeutung jeder der 67 Darstellungen einzeln gegen den identifizierten
  Referenzstand prüfen.
- Jeden Zustand gegenüber fachlich oder visuell benachbarten Zuständen abgrenzen.
- Bei den sechs Alternativen das Primary-/Alternative-Verhältnis prüfen: gleiche Bedeutung,
  getrennte und nachvollziehbare Darstellungen.
- Die Vollständigkeit außenliegender Marken prüfen, insbesondere Sichtungs-, Transport-,
  Kontaminations-, Betreuungs- und Mobilitätsmarken.
- Die Lesbarkeit in den Einsatzgrößen 16, 24, 32, 64, 128 und 256 Pixel fachlich bewerten.
- Die monochrome Unterscheidbarkeit fachlich bewerten; Farbe darf nicht der einzige
  Bedeutungskanal sein.
- Bestätigen, dass der Quellenstatus der unabhängigen Konstruktionen korrekt `derived` bleibt,
  oder eine konkrete Abweichung als `deviation` dokumentieren.

Die sieben Beispielassets aus 5.8.1 und 5.8.7 erhalten keine State-ID und keine Manifest- oder
Dossierzeile. Sie sind einer späteren Rezept-/Conformance-Coverageaufgabe zugeordnet und werden
nicht als bereits fachlich oder technisch abgedeckt behandelt.

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

Neben den 181 Manifest-Einträgen tragen auch alle zwölf Quellen und das Profil `bund` ein offenes
fachliches Review. `releaseBlockers()` weist diese 13 Träger nun in
`sourceDomainReviewOpen` und `profileDomainReviewOpen` separat aus; zurechenbar abgeschlossene
`domain: deviation`-Befunde erscheinen getrennt als 1.0-Freigabeblocker. Die Coverage-CLI nennt
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

Damit sind insgesamt **194 fachliche Reviewträger offen**: 181 Manifest-Einträge, zwölf Quellen und
ein Profil. Die Zahl ist eine Übergabeinventur, keine Freigabe und keine Aussage, dass alle 194
Prüfungen dieselben Kriterien haben.
