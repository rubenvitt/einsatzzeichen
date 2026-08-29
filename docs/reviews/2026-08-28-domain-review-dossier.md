# Fachreview-Dossier (Generat)

> Erzeugt mit `pnpm cli review-dossier`. Dieses Dokument **bereitet** das fachliche Review vor;
> es erteilt keine Freigabe und ändert keinen Reviewstatus. Freigeben darf nur eine benannte
> Person mit einsatztaktischer Fachkunde, und zwar im Ledger `packages/catalog/src/domain-reviews.ts`.

- Baseline: `bbk-babz-2025`
- Kernversion: 0.2.0 (Profil `bund`: 0.2.0)
- Umfang: 1, 2, 4, 5.1.1, 5.4, 5.8, C.1.1, C.1.2, C.1.3, D, E, F, G, H, I.1.1, I.1.2, I.1.3, I.1.4, I.1.5, I.1.6, I.1.7, I.1.8, I.1.9, I.1.10, I.1.11, I.1.12, I.1.13, I.1.14, I.1.15, I.1.16, I.1.17, I.1.18, I.1.19, I.1.20, I.2.1, I.2.2, I.2.3, I.2.4, I.2.5, I.2.6, I.2.7, I.3, I.4.1, I.4.2, I.4.3, I.5.1, I.5.2, I.5.3, I.5.4, I.5.5, I.5.6, I.5.7, I.5.8, J.1, J.2, J.3, J.4, K, L, M, N
- Offene fachliche Reviews: 544 Manifest, 13 Quellen, 1 Profil

| Trägerart | offen (pending) | approved | deviation | gesamt |
|---|---|---|---|---|
| Manifestzeilen | 544 | 0 | 0 | 544 |
| Quellen | 13 | 0 | 0 | 13 |
| Profile | 1 | 0 | 0 | 1 |

## Evidenzkürzel

Technische Hilfen, keine fachlichen Freigaben. Hergeleitet aus `testEvidence` je Manifestzeile:

- **FP:** Körperhülle gegen die Kennzahlen des lokalen Referenz-SVGs (`matchFingerprint`); nicht das vollständige Bild.
- **GEO:** Körpergeometrie gegen in der Testdatei festgenagelte Messwerte — dort, wo das Kennwertartefakt keine vergleichbare Form führt. Kein FP: andere Provenienz des Erwartungswerts.
- **RS:** Datei- und Mehrgrößen-Rastersnapshot der eigenen Ausgabe; Regressionsschutz, kein Referenzvergleich.
- **FARBE:** Palettenwert gegen die im Referenzartefakt gefundene Füllfarbe.
- **KOPF:** Programmatische Prüfung der vermessenen Kopfmarken.
- **FW:** Programmatische Prüfung der vermessenen Fahrwerksmarken (Kapitel 5.1). Kein KOPF: eigene Zone, eigenes Gate.
- **PG:** Piktogramm besteht Kommando-, Box-, Clipping- und Snapshot-Gate; Bildidee und Verwechslungsfreiheit bleiben ungeprüft.

Die Spalte „Fachreview" zeigt `status[, reviewer, date]` des Domain-Reviews; „note" dessen Notiz.
Die Spalte „Fragen" nennt die IDs der offenen Fachfragen aus dem Register; ihr Wortlaut steht
am Ende jedes Bereichs.

## Manifestreviews nach Bereich

### Kapitel 4 — 92 offen, 0 approved, 0 deviation

| Manifestschlüssel | Titel | Implementierung | Referenzasset | Evidenz | Fachreview | note | Fragen |
|---|---|---|---|---|---|---|---|
| `bbk-babz-2025:4.1.1#primary` | ABC-/CBRN-Schutz | `capability.cbrn-protection` | `4.1.1_ABC_CBRN-Schutz.svg` | RS, PG | pending |  |  |
| `bbk-babz-2025:4.1.2#primary` | Messen, Spüren, Detektieren | `capability.cbrn-detection` | `4.1.2_Messen Spüren Detektieren.svg` | RS, PG | pending |  |  |
| `bbk-babz-2025:4.1.3#primary` | Dekontaminieren | `capability.decontamination` | `4.1.3_Dekontaminieren.svg` | RS, PG | pending |  |  |
| `bbk-babz-2025:4.1.4#primary` | Umweltschädenbeseitigung auf Gewässern | `capability.water-environmental-damage-control` | `4.1.4_Umweltschädenbeseitigung auf Gewässern.svg` | RS, PG | pending |  |  |
| `bbk-babz-2025:4.1.5#primary` | Trinkwasseraufbereitung | `capability.drinking-water-treatment` | `4.1.5_Trinkwasseraufbereitung.svg` | RS, PG | pending |  |  |
| `bbk-babz-2025:4.1.6#primary` | Atomare Stoffe | `capability.radioactive-materials` | `4.1.6_Atomare Stoffe.svg` | RS, PG | pending |  |  |
| `bbk-babz-2025:4.1.6#alternative` | Atomare Stoffe | `capability.radioactive-materials` | `4.1.6_Atomare Stoffe_Alternative.svg` | RS, PG | pending |  |  |
| `bbk-babz-2025:4.1.7#primary` | Biologische Stoffe | `capability.biological-materials` | `4.1.7_Biologische Stoffe.svg` | RS, PG | pending |  |  |
| `bbk-babz-2025:4.1.7#alternative` | Biologische Stoffe | `capability.biological-materials` | `4.1.7_Biologische Stoffe_Alternative.svg` | RS, PG | pending |  |  |
| `bbk-babz-2025:4.1.8#primary` | Chemische Stoffe | `capability.chemical-materials` | `4.1.8_Chemische Stoffe.svg` | RS, PG | pending |  |  |
| `bbk-babz-2025:4.1.8#alternative` | Chemische Stoffe | `capability.chemical-materials` | `4.1.8_Chemische Stoffe_Alternative.svg` | RS, PG | pending |  |  |
| `bbk-babz-2025:4.2.1#primary` | Betreuung | `capability.care` | `4.2.1_Betreuung Grundzeichne.svg` | RS, PG | pending |  |  |
| `bbk-babz-2025:4.2.2#primary` | PSNV | `capability.psychosocial-emergency-care` | `4.2.2_PSNV.svg` | RS, PG | pending |  |  |
| `bbk-babz-2025:4.2.3#primary` | Seelsorge | `capability.pastoral-care` | `4.2.3_Seelsorge.svg` | RS, PG | pending |  |  |
| `bbk-babz-2025:4.2.4#primary` | Temporäre Unterbringung mit Ruhemöglichkeit | `capability.temporary-accommodation-resting` | `4.2.4_Temporäre Unterbringung mit Ruhemöglichkeit.svg` | RS, PG | pending |  |  |
| `bbk-babz-2025:4.2.5#primary` | Temporäre Unterbringung mit Sitzmöglichkeit | `capability.temporary-accommodation-seating` | `4.2.5_Temporäre Unterbringung mit Sitzmöglichkeit.svg` | RS, PG | pending |  |  |
| `bbk-babz-2025:4.3.1#primary` | Brandbekämpfung | `capability.fire-fighting` | `4.3.1_Brandbekämpfung.svg` | RS, PG | pending |  |  |
| `bbk-babz-2025:4.3.2#primary` | Löschwasser, Brauchwasser | `capability.service-water` | `4.3.2_Löschwasser Brauchwasser.svg` | RS, PG | pending |  |  |
| `bbk-babz-2025:4.3.3#primary` | Schaummittel | `capability.foam-agent` | `4.3.3_Schaummittel.svg` | RS, PG | pending |  |  |
| `bbk-babz-2025:4.3.4#primary` | Sonderlöschmittel, fest | `capability.solid-extinguishing-agent` | `4.3.4_Sonderlöschmittel fest.svg` | RS, PG | pending |  |  |
| `bbk-babz-2025:4.3.5#primary` | Sonderlöschmittel, gasförmig | `capability.gaseous-extinguishing-agent` | `4.3.5_Sonderlöschmittel gasförmig.svg` | RS, PG | pending |  |  |
| `bbk-babz-2025:4.3.6#primary` | Atemschutz | `capability.respiratory-protection` | `4.3.6_Atemschutz.svg` | RS, PG | pending |  |  |
| `bbk-babz-2025:4.4.1#primary` | Erkunden | `capability.reconnaissance` | `4.4.1_Erkunden.svg` | RS, PG | pending |  |  |
| `bbk-babz-2025:4.4.2#primary` | Orten, biologisch | `capability.biological-location` | `4.4.2_Orten biologisch.svg` | RS, PG | pending |  |  |
| `bbk-babz-2025:4.4.3#primary` | Orten, technisch | `capability.technical-location` | `4.4.3_Orten technisch.svg` | RS, PG | pending |  |  |
| `bbk-babz-2025:4.5.1#primary` | Bergung | `capability.recovery` | `4.5.1_Bergung.svg` | RS, PG | pending |  |  |
| `bbk-babz-2025:4.5.2#primary` | Retten aus Höhen und Tiefen mit tragbaren Leitern | `capability.rescue-portable-ladders` | `4.5.2_Retten aus Höhen und Tiefen mit tragbaren Leitern.svg` | RS, PG | pending |  |  |
| `bbk-babz-2025:4.5.3#primary` | Retten aus Höhen und Tiefen mit Drehleiter | `capability.rescue-aerial-ladder` | `4.5.3_Retten aus Höhen und Tiefen mit Drehleiter.svg` | RS, PG | pending |  |  |
| `bbk-babz-2025:4.5.4#primary` | Retten aus Höhen und Tiefen mit Teleskopgelenkmast | `capability.rescue-articulated-boom` | `4.5.4_Retten aus Höhen und Tiefen mit Teleskopgelenkmast.svg` | RS, PG | pending |  |  |
| `bbk-babz-2025:4.5.5#primary` | Einsatz von Wasserfahrzeugen | `capability.watercraft-operations` | `4.5.5_Einsatz von Wasserfahrzeugen.svg` | RS, PG | pending |  |  |
| `bbk-babz-2025:4.5.6#primary` | Bergrettung | `capability.mountain-rescue` | `4.5.6_Bergrettung.svg` | RS, PG | pending |  |  |
| `bbk-babz-2025:4.5.7#primary` | Spezielle Rettung aus Höhen und Tiefen | `capability.special-height-depth-rescue` | `4.5.7_Spezielle Rettung aus Höhen und Tiefen.svg` | RS, PG | pending |  |  |
| `bbk-babz-2025:4.5.8#primary` | Wasserrettung | `capability.water-rescue` | `4.5.8_Wasserrettung.svg` | RS, PG | pending |  |  |
| `bbk-babz-2025:4.6.1#primary` | Sanität, Grundzeichen | `capability.medical-service` | `4.6.1_Sanität Grundzeichen.svg` | RS, PG | pending |  |  |
| `bbk-babz-2025:4.6.2#primary` | Pflege | `capability.nursing` | `4.6.2_Pflege.svg` | RS, PG | pending |  |  |
| `bbk-babz-2025:4.6.3#primary` | Rettungswesen / Intensivmedizin | `capability.intensive-care` | `4.6.3_Rettungswesen_Intensivmedizin.svg` | RS, PG | pending |  |  |
| `bbk-babz-2025:4.6.4#primary` | Arztwesen | `capability.physician` | `4.6.4_Arztwesen.svg` | RS, PG | pending |  |  |
| `bbk-babz-2025:4.6.5#primary` | Patiententransport | `capability.patient-transport` | `4.6.5_Patiententransport.svg` | RS, PG | pending |  |  |
| `bbk-babz-2025:4.6.6#primary` | Krankenhaus | `capability.hospital` | `4.6.6_Krankenhaus.svg` | RS, PG | pending |  |  |
| `bbk-babz-2025:4.7.1#primary` | Abwehr von Wassergefahren | `capability.water-hazard-control` | `4.7.1_Abwehr von Wassergefahren.svg` | RS, PG | pending |  |  |
| `bbk-babz-2025:4.7.2#primary` | Baggerarbeiten | `capability.excavation` | `4.7.2_Baggerarbeiten.svg` | RS, PG | pending |  |  |
| `bbk-babz-2025:4.7.3#primary` | Beleuchten | `capability.lighting` | `4.7.3_Beleuchten.svg` | RS, PG | pending |  |  |
| `bbk-babz-2025:4.7.4#primary` | Belüften | `capability.ventilation` | `4.7.4_Belüften.svg` | RS, PG | pending |  |  |
| `bbk-babz-2025:4.7.5#primary` | Entlüften | `capability.air-extraction` | `4.7.5_Entlüften.svg` | RS, PG | pending |  |  |
| `bbk-babz-2025:4.7.6#primary` | Kampfmittelräumung | `capability.explosive-ordnance-clearance` | `4.7.6_Kampfmittelräumung.svg` | RS, PG | pending |  |  |
| `bbk-babz-2025:4.7.7#primary` | Einsatz von Handwerkzeugen | `capability.hand-tools` | `4.7.7_Einsatz von Handwerkzeugen.svg` | RS, PG | pending |  |  |
| `bbk-babz-2025:4.7.8#primary` | Hebearbeit mit Gabelstapler | `capability.forklift-lifting` | `4.7.8_Hebearbeit mit Gabelstapler.svg` | RS, PG | pending |  |  |
| `bbk-babz-2025:4.7.9#primary` | Hebearbeit mit Kran | `capability.crane-lifting` | `4.7.9_Hebearbeit mit Kran.svg` | RS, PG | pending |  |  |
| `bbk-babz-2025:4.7.10#primary` | Heben von Lasten oder Personen | `capability.lifting-loads-persons` | `4.7.10_Heben von Lasten oder Personen.svg` | RS, PG | pending |  |  |
| `bbk-babz-2025:4.7.10#alternative` | Heben von Lasten oder Personen | `capability.lifting-loads-persons` | `4.7.10_Heben von Lasten oder Personen_Alternative.svg` | RS, PG | pending |  |  |
| `bbk-babz-2025:4.7.11#primary` | Heben / Räumen | `capability.lifting-clearing` | `4.7.11_Heben-Räumen.svg` | RS, PG | pending |  |  |
| `bbk-babz-2025:4.7.12#primary` | Fernmanipulieren | `capability.remote-manipulation` | `4.7.12_Fernmanipulieren.svg` | RS, PG | pending |  |  |
| `bbk-babz-2025:4.7.13#primary` | Motorsägearbeiten | `capability.chainsaw` | `4.7.13_Motorsägearbeiten.svg` | RS, PG | pending |  |  |
| `bbk-babz-2025:4.7.14#primary` | Pumpen | `capability.pumping` | `4.7.14_Pumpen.svg` | RS, PG | pending |  |  |
| `bbk-babz-2025:4.7.15#primary` | Räumarbeiten mit Maschine | `capability.mechanized-clearing` | `4.7.15_Räumarbeiten mit Maschine.svg` | RS, PG | pending |  |  |
| `bbk-babz-2025:4.7.16#primary` | Sicherheit | `capability.safety` | `4.7.16_Sicherheit.svg` | RS, PG | pending |  |  |
| `bbk-babz-2025:4.7.17#primary` | Sprengen | `capability.blasting` | `4.7.17_Sprengen.svg` | RS, PG | pending |  |  |
| `bbk-babz-2025:4.7.18#primary` | Technische Hilfeleistung | `capability.technical-assistance` | `4.7.18_Technische Hilfeleistung.svg` | RS, PG | pending |  |  |
| `bbk-babz-2025:4.7.19#primary` | Transportieren | `capability.transport` | `4.7.19_Transportieren.svg` | RS, PG | pending |  |  |
| `bbk-babz-2025:4.7.20#primary` | Türöffnung | `capability.door-opening` | `4.7.20_Türöffnung.svg` | RS, PG | pending |  |  |
| `bbk-babz-2025:4.7.21#primary` | Höhenunterschiede überwinden | `capability.overcoming-height-differences` | `4.7.21_Höhenunterschiede überwinden.svg` | RS, PG | pending |  |  |
| `bbk-babz-2025:4.7.22#primary` | Absicherung | `capability.securing` | `4.7.22_Absicherung.svg` | RS, PG | pending |  |  |
| `bbk-babz-2025:4.7.23#primary` | Warnen mit optischen Anzeigen | `capability.optical-warning` | `4.7.23_Warnen mit optischen Anzeigen.svg` | RS, PG | pending |  |  |
| `bbk-babz-2025:4.7.24#primary` | Warnen mit Lautsprecherdurchsagen | `capability.loudspeaker-warning` | `4.7.24_Warnen mit Lautsprecherdurchsagen.svg` | RS, PG | pending |  |  |
| `bbk-babz-2025:4.7.25#primary` | Warnen mit Sirenen | `capability.siren-warning` | `4.7.25_Warnen mit Sirenen.svg` | RS, PG | pending |  |  |
| `bbk-babz-2025:4.7.26#primary` | Wasserförderung | `capability.water-conveyance` | `4.7.26_Wasserförderung.svg` | RS, PG | pending |  |  |
| `bbk-babz-2025:4.7.27#primary` | Wasserrückhaltung | `capability.water-retention` | `4.7.27_Wasserrückhaltung.svg` | RS, PG | pending |  |  |
| `bbk-babz-2025:4.7.28#primary` | Ziehen von Lasten | `capability.load-pulling` | `4.7.28_Ziehen von Lasten.svg` | RS, PG | pending |  |  |
| `bbk-babz-2025:4.8.1#primary` | Behälter | `capability.container-resource` | `4.8.1_Behälter.svg` | RS, PG | pending |  |  |
| `bbk-babz-2025:4.8.2#primary` | Betriebsstoffe / Verbrauchsgüter | `capability.fuels-consumables` | `4.8.2_Betriebsstoffe Verbrauchsgüter.svg` | RS, PG | pending |  |  |
| `bbk-babz-2025:4.8.3#primary` | Brücke | `capability.bridge` | `4.8.3_Brücke.svg` | RS, PG | pending |  |  |
| `bbk-babz-2025:4.8.4#primary` | Behelfsbrückenbau | `capability.temporary-bridge-construction` | `4.8.4_Behelfsbrückenbau.svg` | RS, PG | pending |  |  |
| `bbk-babz-2025:4.8.5#primary` | Entsorgung | `capability.waste-disposal` | `4.8.5_Entsorgung.svg` | RS, PG | pending |  |  |
| `bbk-babz-2025:4.8.6#primary` | Instandhaltung | `capability.maintenance` | `4.8.6_Instandhaltung.svg` | RS, PG | pending |  |  |
| `bbk-babz-2025:4.8.7#primary` | Sandsack | `capability.sandbag` | `4.8.7_Sandsack.svg` | RS, PG | pending |  |  |
| `bbk-babz-2025:4.8.8#primary` | Sandsackbefüllung | `capability.sandbag-filling` | `4.8.8_Sandsackbefüllung.svg` | RS, PG | pending |  |  |
| `bbk-babz-2025:4.8.9#primary` | Sanitäre Einrichtung / Waschmöglichkeit | `capability.washing-facility` | `4.8.9_Sanitäre Einrichtung_Waschmöglichkeit.svg` | RS, PG | pending |  |  |
| `bbk-babz-2025:4.8.10#primary` | Sanitäre Einrichtung / WC | `capability.toilet-facility` | `4.8.10_Sanitäre Einrichtung_WC.svg` | RS, PG | pending |  |  |
| `bbk-babz-2025:4.8.11#primary` | Stromversorgung | `capability.power-supply` | `4.8.11_Stromversorgung.svg` | RS, PG | pending |  |  |
| `bbk-babz-2025:4.8.12#primary` | Trinkwasser | `capability.drinking-water` | `4.8.12_Trinkwasser.svg` | RS, PG | pending |  |  |
| `bbk-babz-2025:4.8.13#primary` | Verpflegung | `capability.catering` | `4.8.13_Verpflegung.svg` | RS, PG | pending |  |  |
| `bbk-babz-2025:4.8.14#primary` | Verpflegung / Zubereitung | `capability.meal-preparation` | `4.8.14_Verpflegung_Zubereitung.svg` | RS, PG | pending |  |  |
| `bbk-babz-2025:4.8.15#primary` | Schnelleinsatzzelt | `capability.rapid-deployment-tent` | `4.8.15_Schnelleinsatzzelt.svg` | RS, PG | pending |  |  |
| `bbk-babz-2025:4.8.16#primary` | Stangengerüstzelt | `capability.frame-tent` | `4.8.16_Stangengerüstzelt.svg` | RS, PG | pending |  |  |
| `bbk-babz-2025:4.9.1#primary` | Information und Kommunikation / Fernmeldewesen | `capability.information-communications` | `4.9.1_Information und Kommunikation Fernmeldewesen.svg` | RS, PG | pending |  |  |
| `bbk-babz-2025:4.10.1#primary` | Veterinärwesen | `capability.veterinary` | `4.10.1_Veterinärwesen.svg` | RS, PG | pending |  |  |
| `bbk-babz-2025:4.10.2#primary` | Schlachten / Keulen | `capability.slaughter-culling` | `4.10.2_Schlachten_Keulen.svg` | RS, PG | pending |  |  |
| `bbk-babz-2025:4.10.3#primary` | Huhn | `capability.chicken` | `4.10.3_Huhn.svg` | RS, PG | pending |  |  |
| `bbk-babz-2025:4.10.4#primary` | Pferd | `capability.horse` | `4.10.4_Pferd.svg` | RS, PG | pending |  |  |
| `bbk-babz-2025:4.10.5#primary` | Rind | `capability.cattle` | `4.10.5_Rind.svg` | RS, PG | pending |  |  |
| `bbk-babz-2025:4.10.6#primary` | Schaf | `capability.sheep` | `4.10.6_Schaf.svg` | RS, PG | pending |  |  |
| `bbk-babz-2025:4.10.7#primary` | Schwein | `capability.pig` | `4.10.7_Schwein.svg` | RS, PG | pending |  |  |

### Kapitel 5 — 78 offen, 0 approved, 0 deviation

| Manifestschlüssel | Titel | Implementierung | Referenzasset | Evidenz | Fachreview | note | Fragen |
|---|---|---|---|---|---|---|---|
| `bbk-babz-2025:5.4.1#primary` | Trupp | `strength.trupp` | `5.4.1_Trupp.svg` | KOPF | pending |  |  |
| `bbk-babz-2025:5.4.2#primary` | Staffel | `strength.staffel` | `5.4.2_Staffel.svg` | KOPF | pending |  |  |
| `bbk-babz-2025:5.4.3#primary` | Gruppe | `strength.gruppe` | `5.4.3_Gruppe.svg` | KOPF | pending |  |  |
| `bbk-babz-2025:5.4.4#primary` | Zug | `strength.zug` | `5.4.4_Zug.svg` | KOPF | pending |  |  |
| `bbk-babz-2025:5.1.1.1#primary` | Kraftfahrzeug Kategorie 1 (straßenfähig) | `vehicle-category.kfz-kategorie-1` | `5.1.1.1_Kfz_Kategorie 1.svg` | FW | pending |  | Q-5.1-kategoriezuordnung |
| `bbk-babz-2025:5.1.1.2#primary` | Kraftfahrzeug Kategorie 2 (geländefähig) | `vehicle-category.kfz-kategorie-2` | `5.1.1.2_Kfz_Kategorie 2.svg` | FW | pending |  | Q-5.1-kategoriezuordnung |
| `bbk-babz-2025:5.1.1.3#primary` | Kraftfahrzeug Kategorie 3 (geländegängig) | `vehicle-category.kfz-kategorie-3` | `5.1.1.3_Kfz_Kategorie 3.svg` | FW | pending |  | Q-5.1-kategoriezuordnung, Q-5.1-verbindungsstrich-endpunkte |
| `bbk-babz-2025:5.1.1.5#primary` | Kettenfahrzeug | `vehicle-category.kettenfahrzeug` | `5.1.1.5_Kettenfahrzeug.svg` | FW | pending |  | Q-5.1-kategoriezuordnung |
| `bbk-babz-2025:5.1.1.6#primary` | Schienenfahrzeug | `vehicle-category.schienenfahrzeug` | `5.1.1.6_Schienenfahrzeug.svg` | FW | pending |  | Q-5.1-kategoriezuordnung |
| `bbk-babz-2025:5.1.2.4#primary` | Anhänger mit einem Rad | `vehicle-category.anhaenger-ein-rad` | `5.1.2.4_Anhänger_von PKW gezogen.svg` | FW | pending |  | Q-5.1-anhaenger-ein-oder-zwei-raeder |
| `bbk-babz-2025:5.1.2.5#primary` | Anhänger mit zwei Rädern | `vehicle-category.anhaenger-zwei-raeder` | `5.1.2.5_Anhänger_von LKW gezogen.svg` | FW | pending |  | Q-5.1-anhaenger-ein-oder-zwei-raeder |
| `bbk-babz-2025:5.8.1.1#primary` | Einsatztaktik: Retten | `state.tactical-rescue` | `5.8.1.1_Einsatztaktik_Retten.svg` | RS, PG | pending |  |  |
| `bbk-babz-2025:5.8.1.2#primary` | Einsatztaktik: Angreifen | `state.tactical-attack` | `5.8.1.2_Einsatztaktik_Angreifen.svg` | RS, PG | pending |  |  |
| `bbk-babz-2025:5.8.1.3#primary` | Einsatztaktik: Verteidigen | `state.tactical-defense` | `5.8.1.3_Einsatztaktik_Verteidigen.svg` | RS, PG | pending |  |  |
| `bbk-babz-2025:5.8.1.4#primary` | Einsatztaktik: Rückzug | `state.tactical-retreat` | `5.8.1.4_Einsatztaktik_Rückzug.svg` | RS, PG | pending |  |  |
| `bbk-babz-2025:5.8.1.5#primary` | Überschwemmtes Gebiet | `state.flooded-area` | `5.8.1.5_Überschwemmtes Gebiet.svg` | RS, PG | pending |  |  |
| `bbk-babz-2025:5.8.1.6#primary` | Gefahr durch Wassereinbruch | `state.water-ingress-hazard` | `5.8.1.6_Gefahr durch Wassereinbruch.svg` | RS, PG | pending |  |  |
| `bbk-babz-2025:5.8.1.7#primary` | Gefährliche Stoffe | `state.hazardous-substances` | `5.8.1.7_Gefährliche Stoffe.svg` | RS, PG | pending |  |  |
| `bbk-babz-2025:5.8.1.7#alternative` | Gefährliche Stoffe | `state.hazardous-substances` | `5.8.1.7_Gefährliche Stoffe_Chlor.svg` | RS, PG | pending |  |  |
| `bbk-babz-2025:5.8.1.8#primary` | Gefahr durch Radioaktivität | `state.radioactivity-hazard` | `5.8.1.8_Gefahr durch Radioaktivität.svg` | RS, PG | pending |  |  |
| `bbk-babz-2025:5.8.1.8#alternative` | Gefahr durch Radioaktivität | `state.radioactivity-hazard` | `5.8.1.8_Gefahr durch Radioaktivität _A.svg` | RS, PG | pending |  |  |
| `bbk-babz-2025:5.8.1.9#primary` | Gefahr durch elektrische Energie | `state.electrical-energy-hazard` | `5.8.1.9_Gefahr durch elektrische Energie.svg` | RS, PG | pending |  |  |
| `bbk-babz-2025:5.8.1.10#primary` | Gefahr durch Mineralöl | `state.mineral-oil-hazard` | `5.8.1.10_Gefahr durch Mineralöl.svg` | RS, PG | pending |  |  |
| `bbk-babz-2025:5.8.1.11#primary` | Gefahr durch Explosion | `state.explosion-hazard` | `5.8.1.11_Gefahr durch Explosion.svg` | RS, PG | pending |  |  |
| `bbk-babz-2025:5.8.1.12#primary` | Gefahr durch explosionsfähige Kampfmittel | `state.explosive-ordnance-hazard` | `5.8.1.12_Gefahr durch explosionsfähige Kampfmittel.svg` | RS, PG | pending |  |  |
| `bbk-babz-2025:5.8.1.13#primary` | Hinweis auf Vermutung | `state.suspected-situation` | `5.8.1.13_Hinweis auf Vermutung.svg` | RS, PG | pending |  |  |
| `bbk-babz-2025:5.8.1.13#alternative` | Hinweis auf Vermutung | `state.suspected-situation` | `5.8.1.13_Hinweis auf Vermutung_2.svg` | RS, PG | pending |  |  |
| `bbk-babz-2025:5.8.1.14#primary` | Hinweis auf akute Situation | `state.acute-situation` | `5.8.1.14_Hinweis auf akute Situation.svg` | RS, PG | pending |  |  |
| `bbk-babz-2025:5.8.1.14#alternative` | Hinweis auf akute Situation | `state.acute-situation` | `5.8.1.14_Hinweis auf akute Situation_2.svg` | RS, PG | pending |  |  |
| `bbk-babz-2025:5.8.2.1#primary` | Geringfügig erhöhte Aktivität / bis 25 Prozent Ausfall | `state.activity-slightly-increased-outage-up-to-25-percent` | `5.8.2.1_geringfügig erhöhte Aktivität_bis 25 Prozent Ausfall.svg` | RS, PG | pending |  |  |
| `bbk-babz-2025:5.8.2.2#primary` | Moderat erhöhte Aktivität / bis 50 Prozent Ausfall | `state.activity-moderately-increased-outage-up-to-50-percent` | `5.8.2.2_moderat erhöhte Aktivität_bis 50 Prozent Ausfall.svg` | RS, PG | pending |  |  |
| `bbk-babz-2025:5.8.2.3#primary` | Deutlich erhöhte Aktivität / bis 75 Prozent Ausfall | `state.activity-significantly-increased-outage-up-to-75-percent` | `5.8.2.3_deutlich erhöhte Aktivität_bis 75 Prozent Ausfall.svg` | RS, PG | pending |  |  |
| `bbk-babz-2025:5.8.2.4#primary` | Stark erhöhte Aktivität / Totalausfall | `state.activity-strongly-increased-total-outage` | `5.8.2.4_Stark erhöhte Aktivität_Totalausfall.svg` | RS, PG | pending |  |  |
| `bbk-babz-2025:5.8.3.1#primary` | Tendenz steigend | `state.tendency-rising` | `5.8.3.1_Tendenz steigend.svg` | RS, PG | pending |  |  |
| `bbk-babz-2025:5.8.3.2#primary` | Tendenz unverändert | `state.tendency-unchanged` | `5.8.3.2_Tendenz unverändert.svg` | RS, PG | pending |  |  |
| `bbk-babz-2025:5.8.3.3#primary` | Tendenz fallend | `state.tendency-falling` | `5.8.3.3_Tendenz fallend.svg` | RS, PG | pending |  |  |
| `bbk-babz-2025:5.8.4.1#primary` | Angeschlagen | `state.damaged` | `5.8.4.1_Angeschlagen.svg` | RS, PG | pending |  |  |
| `bbk-babz-2025:5.8.4.2#primary` | Teilzerstört | `state.partially-destroyed` | `5.8.4.2_Teilzerstört.svg` | RS, PG | pending |  |  |
| `bbk-babz-2025:5.8.4.3#primary` | Total zerstört | `state.destroyed` | `5.8.4.3_Total zerstört.svg` | RS, PG | pending |  |  |
| `bbk-babz-2025:5.8.5.1#primary` | Entstehungsbrand | `state.incipient-fire` | `5.8.5.1_Entstehungsbrand.svg` | RS, PG | pending |  |  |
| `bbk-babz-2025:5.8.5.2#primary` | Fortentwickelter Brand | `state.developed-fire` | `5.8.5.2_fortentwickelter Brand.svg` | RS, PG | pending |  |  |
| `bbk-babz-2025:5.8.5.3#primary` | Vollbrand | `state.fully-developed-fire` | `5.8.5.3_Vollbrand.svg` | RS, PG | pending |  |  |
| `bbk-babz-2025:5.8.6.1#primary` | Erkranktes Tier | `state.sick-animal` | `5.8.6.1_erkranktes Tier.svg` | RS, PG | pending |  |  |
| `bbk-babz-2025:5.8.6.2#primary` | Kontaminiertes Tier | `state.contaminated-animal` | `5.8.6.2_kontaminiertes Tier.svg` | RS, PG | pending |  |  |
| `bbk-babz-2025:5.8.6.2#alternative` | Kontaminiertes Tier | `state.contaminated-animal` | `5.8.6.2_kontaminiertes Tier_K.svg` | RS, PG | pending |  |  |
| `bbk-babz-2025:5.8.6.3#primary` | Totes Tier | `state.dead-animal` | `5.8.6.3_Totes Tier.svg` | RS, PG | pending |  |  |
| `bbk-babz-2025:5.8.7.1#primary` | Sonnig | `state.weather-sunny` | `5.8.7.1_Sonnig.svg` | RS, PG | pending |  |  |
| `bbk-babz-2025:5.8.7.2#primary` | Wolkig | `state.weather-cloudy` | `5.8.7.2_Wolkig.svg` | RS, PG | pending |  |  |
| `bbk-babz-2025:5.8.7.3#primary` | Bedeckung des Himmels 4 von 8 | `state.weather-cloud-cover-four-eighths` | `5.8.7.3_Bedeckung des Himmels 4 von 8.svg` | RS, PG | pending |  |  |
| `bbk-babz-2025:5.8.7.4#primary` | Nebelig | `state.weather-foggy` | `5.8.7.4_Nebelig.svg` | RS, PG | pending |  |  |
| `bbk-babz-2025:5.8.7.5#primary` | Regnerisch | `state.weather-rainy` | `5.8.7.5_Regnerisch.svg` | RS, PG | pending |  |  |
| `bbk-babz-2025:5.8.7.6#primary` | Hagelnd | `state.weather-hailing` | `5.8.7.6_Hagelnd.svg` | RS, PG | pending |  |  |
| `bbk-babz-2025:5.8.7.7#primary` | Gewittrig | `state.weather-thunderstorm` | `5.8.7.7_Gewittrig.svg` | RS, PG | pending |  |  |
| `bbk-babz-2025:5.8.7.8#primary` | Schneiend | `state.weather-snowing` | `5.8.7.8_Schneiend.svg` | RS, PG | pending |  |  |
| `bbk-babz-2025:5.8.7.9#primary` | Temperatur | `state.weather-temperature` | `5.8.7.9_Temperatur.svg` | RS, PG | pending |  |  |
| `bbk-babz-2025:5.8.7.10#primary` | Windig | `state.weather-windy` | `5.8.7.10_Windig.svg` | RS, PG | pending |  |  |
| `bbk-babz-2025:5.8.8.1#primary` | Person unverletzt | `state.person-uninjured` | `5.8.8.1_Person Unverletz.svg` | RS, PG | pending |  |  |
| `bbk-babz-2025:5.8.8.2#primary` | Person betroffen | `state.person-affected` | `5.8.8.2_Person Betroffen.svg` | RS, PG | pending |  |  |
| `bbk-babz-2025:5.8.8.3#primary` | Person verletzt | `state.person-injured` | `5.8.8.3_Person Verletzt.svg` | RS, PG | pending |  |  |
| `bbk-babz-2025:5.8.8.4#primary` | Person verletzt - Sichtungskategorie | `state.person-injured-triage-category` | `5.8.8.4_Person Verletzt_Sichtungskategorie.svg` | RS, PG | pending |  |  |
| `bbk-babz-2025:5.8.8.5#primary` | Person verletzt - Transportpriorität | `state.person-injured-transport-priority` | `5.8.8.5_Person Verletzt_Transportpriorität.svg` | RS, PG | pending |  |  |
| `bbk-babz-2025:5.8.8.6#primary` | Person kontaminiert | `state.person-contaminated` | `5.8.8.6_Person Kontaminiert.svg` | RS, PG | pending |  |  |
| `bbk-babz-2025:5.8.8.6#alternative` | Person kontaminiert | `state.person-contaminated` | `5.8.8.6_Person Kontaminiert_Alternative.svg` | RS, PG | pending |  |  |
| `bbk-babz-2025:5.8.8.7#primary` | Person tot | `state.person-dead` | `5.8.8.7_Person Tot.svg` | RS, PG | pending |  |  |
| `bbk-babz-2025:5.8.8.8#primary` | Person vermisst | `state.person-missing` | `5.8.8.8_Person Vermisst.svg` | RS, PG | pending |  |  |
| `bbk-babz-2025:5.8.8.9#primary` | Person in Wassergefahr | `state.person-in-water-danger` | `5.8.8.9_Person in Wassergefahr.svg` | RS, PG | pending |  |  |
| `bbk-babz-2025:5.8.8.10#primary` | Person in Zwangslage | `state.person-in-distress` | `5.8.8.10_Person in Zwangslage.svg` | RS, PG | pending |  |  |
| `bbk-babz-2025:5.8.8.11#primary` | Person gerettet | `state.person-rescued` | `5.8.8.11_Person gerettet.svg` | RS, PG | pending |  |  |
| `bbk-babz-2025:5.8.8.12#primary` | Person zu transportieren | `state.person-to-be-transported` | `5.8.8.12_Person zu transportieren.svg` | RS, PG | pending |  |  |
| `bbk-babz-2025:5.8.8.13#primary` | Transport einer Person | `state.person-in-transport` | `5.8.8.13_Transport einer Person.svg` | RS, PG | pending |  |  |
| `bbk-babz-2025:5.8.8.14#primary` | Person transportiert | `state.person-transported` | `5.8.8.14_Person transportiert.svg` | RS, PG | pending |  |  |
| `bbk-babz-2025:5.8.8.15#primary` | Person besonders betreuungsbedürftig | `state.person-needing-special-care` | `5.8.8.15_Person besonders betreuungsbedürftig.svg` | RS, PG | pending |  |  |
| `bbk-babz-2025:5.8.8.16#primary` | Person pflegebedürftig | `state.person-care-dependent` | `5.8.8.16_Person pflegebedürftig.svg` | RS, PG | pending |  |  |
| `bbk-babz-2025:5.8.8.17#primary` | Person mobilitätseingeschränkt | `state.person-mobility-impaired` | `5.8.8.17_Person mobilitätseingeschränkt.svg` | RS, PG | pending |  |  |
| `bbk-babz-2025:5.8.9.1#primary` | Gesperrt | `state.route-closed` | `5.8.9.1_Gesperrt.svg` | RS, PG | pending |  |  |
| `bbk-babz-2025:5.8.9.2#primary` | Einbahnstraßenregelung | `state.one-way-traffic` | `5.8.9.2_Einbahnstraßenregelung.svg` | RS, PG | pending |  |  |
| `bbk-babz-2025:5.8.9.3#primary` | Schwierig befahrbar - teilblockiert | `state.route-difficult-to-pass` | `5.8.9.3_Schwierig befahrbar_Teilblockiert.svg` | RS, PG | pending |  |  |
| `bbk-babz-2025:5.8.9.4#primary` | Unbefahrbar - blockiert | `state.route-impassable` | `5.8.9.4_Unbefahrbar_Blockiert.svg` | RS, PG | pending |  |  |

#### Offene Fachfragen zu Kapitel 5

- **Q-5.1-kategoriezuordnung** (`bbk-babz-2025:5.1.1.1#primary`, `bbk-babz-2025:5.1.1.2#primary`, `bbk-babz-2025:5.1.1.3#primary`, `bbk-babz-2025:5.1.1.5#primary`, `bbk-babz-2025:5.1.1.6#primary`)
  Stimmt die Zuordnung „Kategorie 1/2/3 = straßenfähig/geländefähig/geländegängig"?
  _Sie ist aus der Mehrheit der E.2-Dateinamen abgeleitet; vier der 31 E.2-Dateien widersprechen ihrem eigenen Namen._
- **Q-5.1-verbindungsstrich-endpunkte** (`bbk-babz-2025:5.1.1.3#primary`)
  Sollen die Endpunkte des Verbindungsstrichs der Kategorie 3 fachlich auf der Ringmittellinie liegen?
  _Vermessen ist nur das Band, in dem sie liegen müssen (siehe `vehicle-categories.ts`)._
- **Q-5.1-anhaenger-ein-oder-zwei-raeder** (`bbk-babz-2025:5.1.2.4#primary`, `bbk-babz-2025:5.1.2.5#primary`, `bbk-babz-2025:E.2.22#primary`, `bbk-babz-2025:E.2.23#primary`, `bbk-babz-2025:E.2.24#primary`)
  Bezeichnet ein Anhänger mit einem Rad etwas anderes als einer mit zweien?
  _Die Zeichnung unterscheidet sie, die Quelle benennt sie widersprüchlich: 5.1.2.4 heißt „von PKW gezogen" und 5.1.2.5 „von LKW gezogen", aber E.2.23 („von LKW gezogen") trägt ein Rad, E.2.24 mit demselben Namenszusatz zwei und 5.1.2.1 („allgemein") gar keines. Der Katalog benennt deshalb die Räder und nicht das Zugfahrzeug._

### Anhang E — 68 offen, 0 approved, 0 deviation

| Manifestschlüssel | Titel | Implementierung | Referenzasset | Evidenz | Fachreview | note | Fragen |
|---|---|---|---|---|---|---|---|
| `bbk-babz-2025:E.1.1#primary` | Bergungsgruppe | `recipe.E.1.1` | `E.1.1_Bergungsgruppe.svg` | FP, RS | pending |  | Q-E.1-a-buchstabenkuerzel |
| `bbk-babz-2025:E.1.2#primary` | Bergungsgruppe Abstützsystem Holz | `recipe.E.1.2` | `E.1.2_Bergungsgruppe_Abstützsystem Holz.svg` | FP, RS | pending |  | Q-E.1-a-buchstabenkuerzel |
| `bbk-babz-2025:E.1.3#primary` | Einsatznachsorgeteam | `recipe.E.1.3` | `E.1.3_Einsatznachsorgeteam.svg` | FP, RS | pending |  | Q-E.1-a-buchstabenkuerzel |
| `bbk-babz-2025:E.1.4#primary` | Fachgruppe Bergungstauchen | `recipe.E.1.4` | `E.1.4_Fachgruppe Bergungstauchen.svg` | FP, RS | pending |  | Q-E.1-a-buchstabenkuerzel |
| `bbk-babz-2025:E.1.5#primary` | Fachgruppe Brückenbau | `recipe.E.1.5` | `E.1.5_Fachgruppe Brückenbau.svg` | FP, RS | pending |  | Q-E.1-a-buchstabenkuerzel |
| `bbk-babz-2025:E.1.6#primary` | Fachgruppe Elektroversorgung | `recipe.E.1.6` | `E.1.6_Fachgruppe Elektroversorgung.svg` | FP, RS | pending |  | Q-E.1-a-buchstabenkuerzel |
| `bbk-babz-2025:E.1.7#primary` | Fachgruppe Infrastruktur | `recipe.E.1.7` | `E.1.7_Fachgruppe Infrastruktur.svg` | FP, RS | pending |  | Q-E.1-a-buchstabenkuerzel |
| `bbk-babz-2025:E.1.8#primary` | Fachgruppe Notversorgung und Notinstandsetzung | `recipe.E.1.8` | `E.1.8_Fachgruppe Notversorgung und Notinstandsetzung.svg` | FP, RS | pending |  | Q-E.1-a-buchstabenkuerzel |
| `bbk-babz-2025:E.1.9#primary` | Fachgruppe Ölschaden Typ A | `recipe.E.1.9` | `E.1.9_Fachgruppe Ölschaden Typ A.svg` | FP, RS | pending |  | Q-E.1-a-buchstabenkuerzel |
| `bbk-babz-2025:E.1.10#primary` | Fachgruppe Ortung Typ A | `recipe.E.1.10` | `E.1.10_Fachgruppe Ortung Typ A.svg` | FP, RS | pending |  | Q-E.1-a-buchstabenkuerzel |
| `bbk-babz-2025:E.1.11#primary` | Fachgruppe Räumen Typ A | `recipe.E.1.11` | `E.1.11_Fachgruppe Räumen Typ A.svg` | FP, RS | pending |  | Q-E.1-a-buchstabenkuerzel |
| `bbk-babz-2025:E.1.12#primary` | Fachgruppe Schwere Bergung Typ A | `recipe.E.1.12` | `E.1.12_Fachgruppe Schwere Bergung Typ A.svg` | FP, RS | pending |  | Q-E.1-a-buchstabenkuerzel |
| `bbk-babz-2025:E.1.13#primary` | Fachgruppe Sprengen | `recipe.E.1.13` | `E.1.13_Fachgruppe Sprengen.svg` | FP, RS | pending |  | Q-E.1-a-buchstabenkuerzel |
| `bbk-babz-2025:E.1.14#primary` | Fachgruppe Trinkwasserversorgung | `recipe.E.1.14` | `E.1.14_Fachgruppe Trinkwasserversorgung.svg` | FP, RS | pending |  | Q-E.1-a-buchstabenkuerzel |
| `bbk-babz-2025:E.1.15#primary` | Fachgruppe Wassergefahren Typ A | `recipe.E.1.15` | `E.1.15_Fachgruppe Wassergefahren Typ A.svg` | FP, RS | pending |  | Q-E.1-a-buchstabenkuerzel |
| `bbk-babz-2025:E.1.16#primary` | Fachgruppe Wasserschaden Pumpen Typ A | `recipe.E.1.16` | `E.1.16_Fachgruppe Wasserschaden Pumpen Typ A.svg` | FP, RS | pending |  | Q-E.1-a-buchstabenkuerzel |
| `bbk-babz-2025:E.1.17#primary` | Fachzug Grundzeichen | `recipe.E.1.17` | `E.1.17_Fachzug Grundzeichen.svg` | FP, RS | pending |  | Q-E.1-b-fuehrungsverhaeltnisse, Q-E.1.17-musterblatt |
| `bbk-babz-2025:E.1.18#primary` | Fachzug Führung-Kommunikation | `recipe.E.1.18` | `E.1.18_Fachzug Führung-Kommunikation.svg` | FP, RS | pending |  | Q-E.1-b-fuehrungsverhaeltnisse |
| `bbk-babz-2025:E.1.19#primary` | Zugtrupp Fachzug Führung-Kommunikation | `recipe.E.1.19` | `E.1.19_Zugtrupp_Fachzug Führung-Kommunikation.svg` | FP, RS | pending |  | Q-E.1-b-fuehrungsverhaeltnisse, Q-E.1-zugtrupp-ohne-unterstellung |
| `bbk-babz-2025:E.1.20#primary` | Fachgruppe Führungsunterstützung | `recipe.E.1.20` | `E.1.20_Fachgruppe Führungsunterstützung.svg` | FP, RS | pending |  | Q-E.1-b-fuehrungsverhaeltnisse |
| `bbk-babz-2025:E.1.21#primary` | Stab | `recipe.E.1.21` | `E.1.21_Stab.svg` | FP, RS | pending |  | Q-E.1-b-fuehrungsverhaeltnisse, Q-E.1.21-stab-ohne-staerke |
| `bbk-babz-2025:E.1.22#primary` | Fachgruppe Kommunikation Typ A | `recipe.E.1.22` | `E.1.22_Fachgruppe Kommunikation Typ A.svg` | FP, RS | pending |  | Q-E.1-b-fuehrungsverhaeltnisse |
| `bbk-babz-2025:E.1.23#primary` | Fachzug Logistik | `recipe.E.1.23` | `E.1.23_Fachzug Logistik.svg` | FP, RS | pending |  | Q-E.1-b-fuehrungsverhaeltnisse |
| `bbk-babz-2025:E.1.24#primary` | Zugtrupp Fachzug Logistik | `recipe.E.1.24` | `E.1.24_Zugtrupp_Fachzug Logistik.svg` | FP, RS | pending |  | Q-E.1-b-fuehrungsverhaeltnisse, Q-E.1-zugtrupp-ohne-unterstellung |
| `bbk-babz-2025:E.1.25#primary` | Fachgruppe Logistik-Verpflegung | `recipe.E.1.25` | `E.1.25_Fachgruppe Logistik-Verpflegung.svg` | FP, RS | pending |  | Q-E.1-b-fuehrungsverhaeltnisse |
| `bbk-babz-2025:E.1.26#primary` | Fachgruppe Logistik Materialwirtschaft | `recipe.E.1.26` | `E.1.26_Fachgruppe Logistik Materialwirtschaft.svg` | FP, RS | pending |  | Q-E.1-b-fuehrungsverhaeltnisse |
| `bbk-babz-2025:E.1.27#primary` | Trupp Logistik-Materialerhaltung | `recipe.E.1.27` | `E.1.27_Trupp Logistik-Materialerhaltung.svg` | FP, RS | pending |  | Q-E.1-b-fuehrungsverhaeltnisse |
| `bbk-babz-2025:E.1.28#primary` | Trupp Logistik-Verbrauchsgüterversorgung | `recipe.E.1.28` | `E.1.28_Trupp Logistik-Verbrauchsgüterversorgung.svg` | FP, RS | pending |  | Q-E.1-b-fuehrungsverhaeltnisse |
| `bbk-babz-2025:E.1.29#primary` | Trupp Schwerer Transport | `recipe.E.1.29` | `E.1.29_Trupp Schwerer Transport.svg` | FP, RS | pending |  | Q-E.1-c-o-oder-null |
| `bbk-babz-2025:E.1.30#primary` | Media Team | `recipe.E.1.30` | `E.1.30_Media Team.svg` | FP, RS | pending |  | Q-E.1-c-staerke-aus-kopfgeometrie, Q-E.1-c-o-oder-null |
| `bbk-babz-2025:E.1.31#primary` | System Bereitstellungsraum 500 | `recipe.E.1.31` | `E.1.31_System Bereitstellungsraum 500.svg` | FP, RS | pending |  | Q-E.1.31-sysbr, Q-E.1-c-o-oder-null |
| `bbk-babz-2025:E.1.32#primary` | Technischer Zug | `recipe.E.1.32` | `E.1.32_Technischer Zug.svg` | FP, RS | pending |  | Q-E.1-c-o-oder-null |
| `bbk-babz-2025:E.1.33#primary` | Trupp Einsatzstellensicherung | `recipe.E.1.33` | `E.1.33_Trupp Einsatzstellensicherung.svg` | FP, RS | pending |  | Q-E.1-c-o-oder-null |
| `bbk-babz-2025:E.1.34#primary` | Trupp Mobiler Hochwasserpegel | `recipe.E.1.34` | `E.1.34_Trupp Mobiler Hochwasserpegel.svg` | FP, RS | pending |  | Q-E.1-c-o-oder-null |
| `bbk-babz-2025:E.1.35#primary` | Trupp Unbemannte Luftfahrtsysteme | `recipe.E.1.35` | `E.1.35_Trupp Unbemannte Luftfahrtsysteme.svg` | FP, RS | pending |  | Q-E.1-c-o-oder-null |
| `bbk-babz-2025:E.1.36#primary` | Virtual Operations Support Team | `recipe.E.1.36` | `E.1.36_Virtual Operations Support Team.svg` | FP, RS | pending |  | Q-E.1-c-staerke-aus-kopfgeometrie, Q-E.1-c-o-oder-null |
| `bbk-babz-2025:E.1.37#primary` | Ortsverband | `recipe.E.1.37` | `E.1.37_Ortsverband.svg` | FP, RS | pending |  | Q-E.1.37-einrichtung, Q-E.1-c-o-oder-null |
| `bbk-babz-2025:E.2.1#primary` | Personenkraftwagen, straßenfähig | `recipe.E.2.1` | `E.2.1_Personenkraftwagen_straßenfähig.svg` | FP, RS | pending |  |  |
| `bbk-babz-2025:E.2.2#primary` | Mannschaftstransportwagen, straßenfähig | `recipe.E.2.2` | `E.2.2_Mannschaftstransportwagen_straßenfähig.svg` | FP, RS | pending |  |  |
| `bbk-babz-2025:E.2.3#primary` | Gerätekraftwagen, geländefähig | `recipe.E.2.3` | `E.2.3_Gerätekraftwagen_geländefähig.svg` | FP, RS | pending |  |  |
| `bbk-babz-2025:E.2.4#primary` | All Terrain Vehicle, geländegängig | `recipe.E.2.4` | `E.2.4_All Terrain Vehicle_geländegängig.svg` | FP, RS | pending |  |  |
| `bbk-babz-2025:E.2.5#primary` | Gabelstapler, straßenfähig | `recipe.E.2.5` | `E.2.5_Gabelstapler_straßenfähig.svg` | FP, RS | pending |  |  |
| `bbk-babz-2025:E.2.6#primary` | Gabelstapler öffentliche Gefahrenabwehr, THW betrieben, geländegängig | `recipe.E.2.6` | `E.2.6_Gabelstapler öffentliche Gefahrenabwehr_THW betrieben_geländegängig.svg` | FP, RS | pending |  | Q-E.2.6-orange-und-thw |
| `bbk-babz-2025:E.2.7#primary` | Teleskopstapler, geländegängig | `recipe.E.2.7` | `E.2.7_Teleskopstapler_geländegängig.svg` | FP, RS | pending |  | Q-E.2.7-telelader |
| `bbk-babz-2025:E.2.8#primary` | Bergungsräumgerät Radlader, geländegängig | `recipe.E.2.8` | `E.2.8_Bergungsräumgerät Radlader_geländegängig.svg` | FP, RS | pending |  |  |
| `bbk-babz-2025:E.2.9#primary` | Bergungsräumgerät Bagger, Kettenantrieb | `recipe.E.2.9` | `E.2.9_Bergungsräumgerät Bagger_Kettenantrieb.svg` | FP, RS | pending |  | Q-E.2-bagger-brmg, Q-E.2-bagger-verwechslung |
| `bbk-babz-2025:E.2.10#primary` | Bergungsräumgerät Bagger, Radantrieb | `recipe.E.2.10` | `E.2.10_Bergungsräumgerät Bagger_Radantrieb.svg` | FP, RS | pending |  | Q-E.2-bagger-brmg, Q-E.2-bagger-verwechslung |
| `bbk-babz-2025:E.2.11#primary` | Einsatz-Rettungs-Spinne, geländefähig | `recipe.E.2.11` | `E.2.11_Einsatz-Rettungs-Spinne_geländefähig.svg` | FP, RS | pending |  |  |
| `bbk-babz-2025:E.2.12#primary` | Mehrzweckgerätewagen Ladebordwand, geländegängig | `recipe.E.2.12` | `E.2.12_Mehrzweckgerätewagen Ladebordwand_geländegängig.svg` | FP, RS | pending |  | Q-E.2-kategorie-widerspruch |
| `bbk-babz-2025:E.2.13#primary` | Mannschaftslastwagen 4 Ladebordwand, geländegängig | `recipe.E.2.13` | `E.2.13_Mannschaftslastwagen 4 Ladebordwand_geländegänig.svg` | FP, RS | pending |  | Q-E.2-kategorie-widerspruch |
| `bbk-babz-2025:E.2.14#primary` | Mannschaftslastwagen 5, straßenfähig | `recipe.E.2.14` | `E.2.14_Mannschaftslastwagen 5_straßenfähig.svg` | FP, RS | pending |  |  |
| `bbk-babz-2025:E.2.15#primary` | Wechselladerfahrzeug, straßenfähig | `recipe.E.2.15` | `E.2.15_Wechselladerfahrzeug_straßenfähig.svg` | FP, RS | pending |  |  |
| `bbk-babz-2025:E.2.16#primary` | Lastkraftwagen Ladekran, straßenfähig | `recipe.E.2.16` | `E.2.16_Lastkraftwagen Ladekran_straßenfähig.svg` | FP, RS | pending |  |  |
| `bbk-babz-2025:E.2.17#primary` | Lastkraftwagen Ladebordwand, straßenfähig | `recipe.E.2.17` | `E.2.17_Lastkraftwagen Ladebordwand_straßenfähig.svg` | FP, RS | pending |  |  |
| `bbk-babz-2025:E.2.18#primary` | Lastkraftwagen Kipper, geländefähig | `recipe.E.2.18` | `E.2.18_Lastkraftwagen Kipper_geländefähig.svg` | FP, RS | pending |  | Q-E.2-kategorie-widerspruch |
| `bbk-babz-2025:E.2.19#primary` | Führungskraftwagen, geländefähig | `recipe.E.2.19` | `E.2.19_Führungskraftwagen_geländefähig.svg` | FP, RS | pending |  |  |
| `bbk-babz-2025:E.2.20#primary` | Führungs- Kommunikationskraftwagen, straßenfähig | `recipe.E.2.20` | `E.2.20_Führungs- Kommunikationskraftwagen_straßenfähig.svg` | FP, RS | pending |  |  |
| `bbk-babz-2025:E.2.21#primary` | Mastkraftwagen, geländefähig | `recipe.E.2.21` | `E.2.21_Mastkraftwagen_geländefähig.svg` | FP, RS | pending |  |  |
| `bbk-babz-2025:E.2.22#primary` | Anhänger Grundzeichen | `recipe.E.2.22` | `E.2.22_Anhänger Grundzeichen.svg` | FP, RS | pending |  | Q-5.1-anhaenger-ein-oder-zwei-raeder, Q-E.2.22-ohne-kuerzel |
| `bbk-babz-2025:E.2.23#primary` | Anhänger Netzersatzanlage, von LKW gezogen | `recipe.E.2.23` | `E.2.23_Anhänger Netzersatzanlage_von LKW gezogen.svg` | FP, RS | pending |  | Q-5.1-anhaenger-ein-oder-zwei-raeder |
| `bbk-babz-2025:E.2.24#primary` | Anhänger Führung und Lage, von LKW gezogen | `recipe.E.2.24` | `E.2.24_Anhänger Führung und Lage_von LKW gezogen.svg` | FP, RS | pending |  | Q-5.1-anhaenger-ein-oder-zwei-raeder |
| `bbk-babz-2025:E.2.25#primary` | Anhänger 0,6 t Leergewicht, von PKW gezogen | `recipe.E.2.25` | `E.2.25_Anhänger 0,6 t Leergewicht_von PKW gezogen.svg` | FP, RS | pending |  |  |
| `bbk-babz-2025:E.2.26#primary` | Trinkwasseraufbereitungsanlage | `recipe.E.2.26` | `E.2.26_Trinkwasseraufbereitungsanlage.svg` | FP, RS | pending |  | Q-E.2.26-eigenes-grundzeichen |
| `bbk-babz-2025:E.2.27#primary` | Wasserfahrzeug allgemein | `recipe.E.2.27` | `E.2.27_Wasserfahrzeug allgemein.svg` | FP, RS | pending |  | Q-E.2.27-ohne-kuerzel |
| `bbk-babz-2025:E.2.28#primary` | Kleines Boot | `recipe.E.2.28` | `E.2.28_Kleines Boot.svg` | FP, RS | pending |  |  |
| `bbk-babz-2025:E.2.29#primary` | Mehrzweckboot | `recipe.E.2.29` | `E.2.29_Mehrzweckboot.svg` | FP, RS | pending |  | Q-E.2-wasserfahrzeuge-gleich-i.3 |
| `bbk-babz-2025:E.2.30#primary` | Mehrzweckarbeitsboot | `recipe.E.2.30` | `E.2.30_Mehrzweckarbeitsboot.svg` | FP, RS | pending |  | Q-E.2-wasserfahrzeuge-gleich-i.3 |
| `bbk-babz-2025:E.2.31#primary` | Mehrzweckponton | `recipe.E.2.31` | `E.2.31_Mehrzweckponton.svg` | FP, RS | pending |  | Q-E.2-wasserfahrzeuge-gleich-i.3 |

#### Offene Fachfragen zu Anhang E

- **Q-5.1-anhaenger-ein-oder-zwei-raeder** (`bbk-babz-2025:5.1.2.4#primary`, `bbk-babz-2025:5.1.2.5#primary`, `bbk-babz-2025:E.2.22#primary`, `bbk-babz-2025:E.2.23#primary`, `bbk-babz-2025:E.2.24#primary`)
  Bezeichnet ein Anhänger mit einem Rad etwas anderes als einer mit zweien?
  _Die Zeichnung unterscheidet sie, die Quelle benennt sie widersprüchlich: 5.1.2.4 heißt „von PKW gezogen" und 5.1.2.5 „von LKW gezogen", aber E.2.23 („von LKW gezogen") trägt ein Rad, E.2.24 mit demselben Namenszusatz zwei und 5.1.2.1 („allgemein") gar keines. Der Katalog benennt deshalb die Räder und nicht das Zugfahrzeug._
- **Q-E.1-a-buchstabenkuerzel** (`bbk-babz-2025:E.1.1#primary`, `bbk-babz-2025:E.1.2#primary`, `bbk-babz-2025:E.1.3#primary`, `bbk-babz-2025:E.1.4#primary`, `bbk-babz-2025:E.1.5#primary`, `bbk-babz-2025:E.1.6#primary`, `bbk-babz-2025:E.1.7#primary`, `bbk-babz-2025:E.1.8#primary`, `bbk-babz-2025:E.1.9#primary`, `bbk-babz-2025:E.1.10#primary`, `bbk-babz-2025:E.1.11#primary`, `bbk-babz-2025:E.1.12#primary`, `bbk-babz-2025:E.1.13#primary`, `bbk-babz-2025:E.1.14#primary`, `bbk-babz-2025:E.1.15#primary`, `bbk-babz-2025:E.1.16#primary`)
  Bezeichnen die am Referenzbild abgelesenen Buchstabenkürzel die richtigen Einheiten — etwa „B" die Bergungsgruppe und nicht den Bergungstrupp?
  _Die Bedeutung dieser 16 Zeichen liegt vollständig im Kürzel._
- **Q-E.1-b-fuehrungsverhaeltnisse** (`bbk-babz-2025:E.1.17#primary`, `bbk-babz-2025:E.1.18#primary`, `bbk-babz-2025:E.1.19#primary`, `bbk-babz-2025:E.1.20#primary`, `bbk-babz-2025:E.1.21#primary`, `bbk-babz-2025:E.1.22#primary`, `bbk-babz-2025:E.1.23#primary`, `bbk-babz-2025:E.1.24#primary`, `bbk-babz-2025:E.1.25#primary`, `bbk-babz-2025:E.1.26#primary`, `bbk-babz-2025:E.1.27#primary`, `bbk-babz-2025:E.1.28#primary`)
  Sind die Führungs- und Unterstellungsverhältnisse der Fachzüge, Zugtrupps, des Stabs und der Logistikeinheiten richtig wiedergegeben?
- **Q-E.1.17-musterblatt** (`bbk-babz-2025:E.1.17#primary`)
  Bezeichnet „FZ-" als Kürzel eines Musterblatts überhaupt eine Einheit?
- **Q-E.1-zugtrupp-ohne-unterstellung** (`bbk-babz-2025:E.1.19#primary`, `bbk-babz-2025:E.1.24#primary`)
  Bezeichnet ein Zugtrupp ohne die Unterstellungsmarke seiner Referenz noch dieselbe Einheit?
- **Q-E.1.21-stab-ohne-staerke** (`bbk-babz-2025:E.1.21#primary`)
  Bleibt „Stab" ohne Stärkeangabe von einem Fachzug unterscheidbar?
- **Q-E.1-c-staerke-aus-kopfgeometrie** (`bbk-babz-2025:E.1.30#primary`, `bbk-babz-2025:E.1.36#primary`)
  Trägt die Einordnung als Gruppe beziehungsweise Zug, wenn der Dateiname kein Stärkewort führt und sie allein auf der Kopfgeometrie ruht?
- **Q-E.1.31-sysbr** (`bbk-babz-2025:E.1.31#primary`)
  Bezeichnet „SysBR" ohne die Zahl 500 des Dateinamens dieselbe Einheit — und ist die nicht gebaute Balkenkopfzone der Referenz fachlich verzichtbar?
- **Q-E.1.37-einrichtung** (`bbk-babz-2025:E.1.37#primary`)
  Ist der Ortsverband als Einrichtung statt Einheit im Anhang E richtig eingeordnet?
- **Q-E.1-c-o-oder-null** (`bbk-babz-2025:E.1.29#primary`, `bbk-babz-2025:E.1.30#primary`, `bbk-babz-2025:E.1.31#primary`, `bbk-babz-2025:E.1.32#primary`, `bbk-babz-2025:E.1.33#primary`, `bbk-babz-2025:E.1.34#primary`, `bbk-babz-2025:E.1.35#primary`, `bbk-babz-2025:E.1.36#primary`, `bbk-babz-2025:E.1.37#primary`)
  Ist die runde Versalie in „VOST" und „OV" ein O und keine Null?
  _Im gesamten E.1-Bestand kommt keine Ziffer vor; es gibt keine Negativkontrolle gegen die Null._
- **Q-E.2.7-telelader** (`bbk-babz-2025:E.2.7#primary`)
  Ist „Telelader" (Bild) oder „Teleskopstapler" (Dateiname) das tragende Kürzel?
- **Q-E.2-bagger-brmg** (`bbk-babz-2025:E.2.9#primary`, `bbk-babz-2025:E.2.10#primary`)
  Bezeichnet „Bagger" ohne die Kurzform „BRmG" die Bergungsräumgeräte hinreichend?
  _Im Bild kommt „BRmG" in keinem der drei Bergungsräumgeräte vor._
- **Q-E.2-kategorie-widerspruch** (`bbk-babz-2025:E.2.12#primary`, `bbk-babz-2025:E.2.13#primary`, `bbk-babz-2025:E.2.18#primary`)
  Trägt die Zuordnung „Kategorie 1/2/3 = straßenfähig/geländefähig/geländegängig" auch dort, wo der Dateiname ihr widerspricht?
  _Siehe Q-5.1-kategoriezuordnung; diese drei Dateien widersprechen ihrem eigenen Namen._
- **Q-E.2-bagger-verwechslung** (`bbk-babz-2025:E.2.9#primary`, `bbk-babz-2025:E.2.10#primary`)
  Bleiben E.2.9 und E.2.10 — dasselbe Kürzel, verschiedene Fahrwerke — im Einsatz verwechslungsfrei?
- **Q-E.2.6-orange-und-thw** (`bbk-babz-2025:E.2.6#primary`)
  Bezeichnet der orange Körper der sonstige-gefahrenabwehr bei zugleich gezeichnetem Trägerkürzel „THW" die Zuordnung oder den Betreiber?
  _Der Dateiname („öffentliche Gefahrenabwehr, THW betrieben") legt das Zweite nahe. Die Kontrastlage weiss auf orange ist gemessen und als Ausnahme entschieden — keine Fachfrage._
- **Q-E.2.26-eigenes-grundzeichen** (`bbk-babz-2025:E.2.26#primary`)
  Verdient die Trinkwasseraufbereitungsanlage mit ihrem hochkanten Rechteck ein eigenes Grundzeichen, und was bezeichnet sie fachlich?
  _Ihre Körperform kommt in genau einer der 661 Referenzdateien vor._
- **Q-E.2.22-ohne-kuerzel** (`bbk-babz-2025:E.2.22#primary`)
  Bezeichnet ein Anhänger ohne mittiges Kürzel — der einzige des Anhangs — eine Einheit, oder ist er wie E.1.17 ein Musterblatt?
- **Q-E.2-wasserfahrzeuge-gleich-i.3** (`bbk-babz-2025:E.2.29#primary`, `bbk-babz-2025:E.2.30#primary`, `bbk-babz-2025:E.2.31#primary`, `bbk-babz-2025:I.3.5#primary`, `bbk-babz-2025:I.3.6#primary`, `bbk-babz-2025:I.3.7#primary`)
  Sind E.2.29 bis E.2.31 dieselben Einheiten wie I.3.5 bis I.3.7?
  _Ihre mittigen Läufe sind bis auf 0,00035 mm deckungsgleich, sie tragen dieselben Namen und unterscheiden sich allein in der Farbe. Die Antwort entscheidet, ob Alternativdarstellungen entstehen oder eigene IDs._
- **Q-E.2.27-ohne-kuerzel** (`bbk-babz-2025:E.2.27#primary`)
  Bezeichnet ein Wasserfahrzeug ohne jedes Kürzel im Körper mehr als das Grundzeichen 1.5 selbst?

### Anhang F — 66 offen, 0 approved, 0 deviation

| Manifestschlüssel | Titel | Implementierung | Referenzasset | Evidenz | Fachreview | note | Fragen |
|---|---|---|---|---|---|---|---|
| `bbk-babz-2025:F.1.1#primary` | Medizinische Task Force | `recipe.F.1.1` | `F.1.1_Medizinische Task Force.svg` | FP, RS | pending |  | Q-F-weiss-als-hilfsorganisation, Q-F.1-a-kuerzel, Q-F.1.1-fuenfter-staerkegrad |
| `bbk-babz-2025:F.1.2#primary` | Dekontaminationseinheit für Verletzte | `recipe.F.1.2` | `F.1.2_Dekontaminationseinheit für Verletzte.svg` | FP, RS | pending |  | Q-F-weiss-als-hilfsorganisation, Q-F.1-a-kuerzel, Q-F.1.2-abc-oder-dekon |
| `bbk-babz-2025:F.1.4#primary` | Einsatzeinheit | `recipe.F.1.4` | `F.1.4_Einsatzeinheit.svg` | FP, RS | pending |  | Q-F-weiss-als-hilfsorganisation, Q-F.1-a-kuerzel, Q-F.1.4-zwei-fachdienstzeichen |
| `bbk-babz-2025:F.1.5#primary` | Sanitätszug ASB | `recipe.F.1.5` | `F.1.5_Sanitätszug ASB.svg` | FP, RS | pending |  | Q-F-weiss-als-hilfsorganisation, Q-F.1-a-kuerzel |
| `bbk-babz-2025:F.1.6#primary` | Sanitätsgruppe | `recipe.F.1.6` | `F.1.6_Sanitätsgruppe.svg` | FP, RS | pending |  | Q-F-weiss-als-hilfsorganisation, Q-F.1-a-kuerzel |
| `bbk-babz-2025:F.1.7#primary` | Sanitätsgruppe, arztbesetzt | `recipe.F.1.7` | `F.1.7_Sanitätsgruppe_arztbesetzt.svg` | FP, RS | pending |  | Q-F-weiss-als-hilfsorganisation, Q-F.1-a-kuerzel |
| `bbk-babz-2025:F.1.8#primary` | Patiententransportgruppe | `recipe.F.1.8` | `F.1.8_Patiententransportgruppe.svg` | FP, RS | pending |  | Q-F-weiss-als-hilfsorganisation, Q-F.1-a-kuerzel |
| `bbk-babz-2025:F.1.9#primary` | Schnelleinsatzgruppe Sanität | `recipe.F.1.9` | `F.1.9_Schnelleinsatzgruppe Sanität.svg` | FP, RS | pending |  | Q-F-weiss-als-hilfsorganisation, Q-F.1-a-kuerzel, Q-F.1-seg-verwechslung |
| `bbk-babz-2025:F.1.10#primary` | Schnelleinsatzgruppe Rettungsdienst | `recipe.F.1.10` | `F.1.10_Schnelleinsatzgruppe Rettungsdienst.svg` | FP, RS | pending |  | Q-F-weiss-als-hilfsorganisation, Q-F.1-a-kuerzel, Q-F.1-seg-verwechslung |
| `bbk-babz-2025:F.1.11#primary` | Rettungsdienst allgemein | `recipe.F.1.11` | `F.1.11_Rettungsdienst allgemein.svg` | FP, RS | pending |  | Q-F-weiss-als-hilfsorganisation, Q-F.1-a-kuerzel, Q-F.1.11-alternative |
| `bbk-babz-2025:F.1.11#alternative` | Rettungsdienst allgemein | `recipe.F.1.11#alternative` | `F.1.11_Rettungsdienst allgemein_Alternative.svg` | FP, RS | pending |  | Q-F-weiss-als-hilfsorganisation, Q-F.1.11-alternative |
| `bbk-babz-2025:F.1.3#primary` | Mobiles Betreuungsmodul 5000 | `recipe.F.1.3` | `F.1.3_Mobiles Betreuungsmodul 5000.svg` | FP, RS | pending |  | Q-F-weiss-als-hilfsorganisation, Q-F.1-a-kuerzel |
| `bbk-babz-2025:F.1.12#primary` | Nachbarschaftliche Soforthilfe | `recipe.F.1.12` | `F.1.12_Nachbarschaftliche Soforthilfe.svg` | FP, RS | pending |  | Q-F-weiss-als-hilfsorganisation |
| `bbk-babz-2025:F.1.12#alternative` | Nachbarschaftliche Soforthilfe | `recipe.F.1.12#alternative` | `F.1.12_Nachbarschaftliche Soforthilfe_Alternative.svg` | FP, RS | pending |  | Q-F-weiss-als-hilfsorganisation |
| `bbk-babz-2025:F.1.13#primary` | Behandlungsplatz-Bereitschaft | `recipe.F.1.13` | `F.1.13_Behandlungsplatz-Bereitschaft.svg` | FP, RS | pending |  | Q-F-weiss-als-hilfsorganisation |
| `bbk-babz-2025:F.1.14#primary` | Erstversorgungstrupp | `recipe.F.1.14` | `F.1.14_Erstversorgungstrupp.svg` | FP, RS | pending |  | Q-F-weiss-als-hilfsorganisation |
| `bbk-babz-2025:F.1.15#primary` | Arzttrupp | `recipe.F.1.15` | `F.1.15_Arzttrupp.svg` | FP, RS | pending |  | Q-F-weiss-als-hilfsorganisation |
| `bbk-babz-2025:F.1.15#alternative` | Arzttrupp | `recipe.F.1.15#alternative` | `F.1.15_Arzttrupp_Alternative.svg` | FP, RS | pending |  | Q-F-weiss-als-hilfsorganisation |
| `bbk-babz-2025:F.1.16#primary` | Drohnentrupp | `recipe.F.1.16` | `F.1.16_Drohnentrupp.svg` | FP, RS | pending |  | Q-F-weiss-als-hilfsorganisation |
| `bbk-babz-2025:F.1.17#primary` | Gruppe Verpflegung | `recipe.F.1.17` | `F.1.17_Gruppe Verpflegung.svg` | FP, RS | pending |  | Q-F-weiss-als-hilfsorganisation |
| `bbk-babz-2025:F.1.18#primary` | Gruppe für soziale Betreuung | `recipe.F.1.18` | `F.1.18_Gruppe für soziale Betreuung.svg` | FP, RS | pending |  | Q-F-weiss-als-hilfsorganisation |
| `bbk-babz-2025:F.1.19#primary` | Gruppe zur Herrichtung von Notunterkünften | `recipe.F.1.19` | `F.1.19_Gruppe zur Herrichtung von Notunterkünften.svg` | FP, RS | pending |  | Q-F-weiss-als-hilfsorganisation |
| `bbk-babz-2025:F.1.20#primary` | Schnelleinsatzgruppe soziale Betreuung | `recipe.F.1.20` | `F.1.20_Schnelleinsatzgruppe soziale Betreuung.svg` | FP, RS | pending |  | Q-F-weiss-als-hilfsorganisation |
| `bbk-babz-2025:F.1.21#primary` | Betreuungsplatzbereitschaft 500 | `recipe.F.1.21` | `F.1.21_Betreuungsplatzbereitschaft 500.svg` | FP, RS | pending |  | Q-F-weiss-als-hilfsorganisation |
| `bbk-babz-2025:F.1.22#primary` | Transportzug bis 50 Betroffene | `recipe.F.1.22` | `F.1.22_Transportzug bis 50 Betroffene.svg` | FP, RS | pending |  | Q-F-weiss-als-hilfsorganisation |
| `bbk-babz-2025:F.2.1#primary` | KTW | `recipe.F.2.1` | `F.2.1_KTW.svg` | FP, RS | pending |  | Q-F-weiss-als-hilfsorganisation |
| `bbk-babz-2025:F.2.1#alternative` | KTW | `recipe.F.2.1#alternative` | `F.2.1_KTW_Alternative.svg` | FP, RS | pending |  | Q-F-weiss-als-hilfsorganisation, Q-F.2-c-alternativen-faehigkeiten |
| `bbk-babz-2025:F.2.2#primary` | NKTW | `recipe.F.2.2` | `F.2.2_NKTW.svg` | FP, RS | pending |  | Q-F-weiss-als-hilfsorganisation, Q-F.2-c-einzelmarken |
| `bbk-babz-2025:F.2.2#alternative` | NKTW | `recipe.F.2.2#alternative` | `F.2.2_NKTW_Alternative.svg` | FP, RS | pending |  | Q-F-weiss-als-hilfsorganisation, Q-F.2-c-alternativen-faehigkeiten |
| `bbk-babz-2025:F.2.3#primary` | RTW | `recipe.F.2.3` | `F.2.3_RTW.svg` | FP, RS | pending |  | Q-F-weiss-als-hilfsorganisation |
| `bbk-babz-2025:F.2.3#alternative` | RTW | `recipe.F.2.3#alternative` | `F.2.3_RTW_Alternative.svg` | FP, RS | pending |  | Q-F-weiss-als-hilfsorganisation, Q-F.2-c-alternativen-faehigkeiten |
| `bbk-babz-2025:F.2.4#primary` | NEF | `recipe.F.2.4` | `F.2.4_NEF.svg` | FP, RS | pending |  | Q-F-weiss-als-hilfsorganisation |
| `bbk-babz-2025:F.2.4#alternative` | NEF | `recipe.F.2.4#alternative` | `F.2.4_NEF_Alternative.svg` | FP, RS | pending |  | Q-F-weiss-als-hilfsorganisation, Q-F.2-c-alternativen-faehigkeiten |
| `bbk-babz-2025:F.2.5#primary` | NAW | `recipe.F.2.5` | `F.2.5_NAW.svg` | FP, RS | pending |  | Q-F-weiss-als-hilfsorganisation |
| `bbk-babz-2025:F.2.5#alternative` | NAW | `recipe.F.2.5#alternative` | `F.2.5_NAW_Alternative.svg` | FP, RS | pending |  | Q-F-weiss-als-hilfsorganisation, Q-F.2-c-alternativen-faehigkeiten |
| `bbk-babz-2025:F.2.6#primary` | Rettungstransporthubschrauber mit Winschmöglichkeit | `recipe.F.2.6` | `F.2.6_Rettungstransporthubschrauber mit Winschmöglichkeit.svg` | FP, RS | pending |  | Q-F-weiss-als-hilfsorganisation, Q-F.2-c-einzelmarken |
| `bbk-babz-2025:F.2.7#primary` | Intensivtransporthubschrauber | `recipe.F.2.7` | `F.2.7_Intensivtransporthubschrauber.svg` | FP, RS | pending |  | Q-F-weiss-als-hilfsorganisation, Q-F.2-c-einzelmarken |
| `bbk-babz-2025:F.2.8#primary` | Gerätewagen Sanitätsdienst | `recipe.F.2.8` | `F.2.8_Gerätewagen Sanitätsdienst.svg` | FP, RS | pending |  | Q-F-weiss-als-hilfsorganisation, Q-F.2-c-einzelmarken |
| `bbk-babz-2025:F.2.9#primary` | Unfallhilfsstelle | `recipe.F.2.9` | `F.2.9_Unfallhilfsstelle.svg` | FP, RS | pending |  | Q-F-weiss-als-hilfsorganisation, Q-F.2-c-einzelmarken |
| `bbk-babz-2025:F.2.10#primary` | Betreuungskombi | `recipe.F.2.10` | `F.2.10_Betreuungskombi.svg` | FP, RS | pending |  | Q-F-weiss-als-hilfsorganisation, Q-F.2-d-formen |
| `bbk-babz-2025:F.2.11#primary` | Betreuungskombi mit Material zum Einrichten einer Anlaufstelle | `recipe.F.2.11` | `F.2.11_Betreuungskombi mit Material zum Einrichten einer Anlaufstelle.svg` | FP, RS | pending |  | Q-F-weiss-als-hilfsorganisation, Q-F.2-d-formen |
| `bbk-babz-2025:F.2.12#primary` | Gerätewagen Betreuung | `recipe.F.2.12` | `F.2.12_Gerätewagen Betreuung.svg` | FP, RS | pending |  | Q-F-weiss-als-hilfsorganisation, Q-F.2-d-formen |
| `bbk-babz-2025:F.2.13#primary` | Betreuungs-LKW mit mobiler Einsatzküche | `recipe.F.2.13` | `F.2.13_Betreuungs-LKW mit mobiler Einsatzküche.svg` | FP, RS | pending |  | Q-F-weiss-als-hilfsorganisation, Q-F.2-d-formen |
| `bbk-babz-2025:F.2.14#primary` | Gerätewagen Logistik der Betreuung | `recipe.F.2.14` | `F.2.14_Gerätewagen Logistik der Betreuung.svg` | FP, RS | pending |  | Q-F-weiss-als-hilfsorganisation, Q-F.2-d-formen |
| `bbk-babz-2025:F.2.15#primary` | Geräteanhänger Betreuung | `recipe.F.2.15` | `F.2.15_Geräteanhänger Betreuung.svg` | FP, RS | pending |  | Q-F-weiss-als-hilfsorganisation, Q-F.2-d-formen |
| `bbk-babz-2025:F.2.16#primary` | Fahrzeug der Betreuung, Transport 40 Betroffene | `recipe.F.2.16` | `F.2.16_Fahrzeug der Betreuung_Transport 40 Betroffene.svg` | FP, RS | pending |  | Q-F-weiss-als-hilfsorganisation, Q-F.2-d-formen |
| `bbk-babz-2025:F.2.17#primary` | Betreuungs-LKW Trinkwasserversorgung | `recipe.F.2.17` | `F.2.17_Betreuungs-LKW_Trinkwasserversorgung.svg` | FP, RS | pending |  | Q-F-weiss-als-hilfsorganisation, Q-F.2-d-formen |
| `bbk-babz-2025:F.3.1#primary` | Patientenablage | `recipe.F.3.1` | `F.3.1_Patientenablage.svg` | FP, RS | pending |  | Q-F-weiss-als-hilfsorganisation, Q-F.3-e-formbegriffe |
| `bbk-babz-2025:F.3.2#primary` | Patientenablage, arztbesetzt | `recipe.F.3.2` | `F.3.2_Patientenablage_arztbesetzt.svg` | FP, RS | pending |  | Q-F-weiss-als-hilfsorganisation, Q-F.3-e-formbegriffe |
| `bbk-babz-2025:F.3.3#primary` | Unfallhilfsstelle / Sanitätsstation | `recipe.F.3.3` | `F.3.3_Unfallhilfsstelle_Sanitätsstation.svg` | FP, RS | pending |  | Q-F-weiss-als-hilfsorganisation, Q-F.3-e-formbegriffe |
| `bbk-babz-2025:F.3.4#primary` | Unfallhilfsstelle / Sanitätsstation, arztbesetzt | `recipe.F.3.4` | `F.3.4_Unfallhilfsstelle_Sanitätsstation_arztbesetzt.svg` | FP, RS | pending |  | Q-F-weiss-als-hilfsorganisation, Q-F.3-e-formbegriffe |
| `bbk-babz-2025:F.3.5#primary` | Behandlungsplatz 50, ortsgebunden | `recipe.F.3.5` | `F.3.5_Behandlungsplatz 50_ortsgebunden.svg` | FP, RS | pending |  | Q-F-weiss-als-hilfsorganisation, Q-F.3-e-formbegriffe |
| `bbk-babz-2025:F.3.6#primary` | Sammelstelle allgemein | `recipe.F.3.6` | `F.3.6_Sammelstelle allgemein.svg` | FP, RS | pending |  | Q-F-weiss-als-hilfsorganisation, Q-F.3-e-formbegriffe |
| `bbk-babz-2025:F.3.7#primary` | Sammelraum Einsatzfahrzeuge | `recipe.F.3.7` | `F.3.7_Sammelraum Einsatzfahrzeuge.svg` | FP, RS | pending |  | Q-F-weiss-als-hilfsorganisation, Q-F.3-e-formbegriffe |
| `bbk-babz-2025:F.3.8#primary` | Bereitstellungsraum | `recipe.F.3.8` | `F.3.8_Bereitstellungsraum.svg` | FP, RS | pending |  | Q-F-weiss-als-hilfsorganisation, Q-F.3-e-formbegriffe |
| `bbk-babz-2025:F.3.9#primary` | Pufferzone / Verfügungsraum Rettungsdienst | `recipe.F.3.9` | `F.3.9_Pufferzone_Verfügungsraum Rettungsdienst.svg` | FP, RS | pending |  | Q-F-weiss-als-hilfsorganisation, Q-F.3-e-formbegriffe |
| `bbk-babz-2025:F.3.10#primary` | Ladezone | `recipe.F.3.10` | `F.3.10_Ladezone.svg` | FP, RS | pending |  | Q-F-weiss-als-hilfsorganisation, Q-F.3-e-formbegriffe, Q-F.3-abgrenzung-transport |
| `bbk-babz-2025:F.3.11#primary` | Rettungsmittelhalteplatz | `recipe.F.3.11` | `F.3.11_Rettungsmittelhalteplatz.svg` | FP, RS | pending |  | Q-F-weiss-als-hilfsorganisation, Q-F.3-e-formbegriffe, Q-F.3-abgrenzung-transport |
| `bbk-babz-2025:F.3.12#primary` | Anlaufstelle für Betroffene | `recipe.F.3.12` | `F.3.12_Anlaufstelle für Betroffene.svg` | FP, RS | pending |  | Q-F-weiss-als-hilfsorganisation, Q-F.3-f-kreisformen |
| `bbk-babz-2025:F.3.13#primary` | Betreuungsstelle | `recipe.F.3.13` | `F.3.13_Betreuungsstelle.svg` | FP, RS | pending |  | Q-F-weiss-als-hilfsorganisation, Q-F.3-f-kreisformen |
| `bbk-babz-2025:F.3.14#primary` | Betreuungsplatz, ortsgebunden | `recipe.F.3.14` | `F.3.14_Betreuungsplatz_ortsgebunden.svg` | FP, RS | pending |  | Q-F-weiss-als-hilfsorganisation, Q-F.3-f-kreisformen |
| `bbk-babz-2025:F.3.15#primary` | Unterkunft | `recipe.F.3.15` | `F.3.15_Unterkunft.svg` | FP, RS | pending |  | Q-F-weiss-als-hilfsorganisation, Q-F.3-f-kreisformen |
| `bbk-babz-2025:F.3.16#primary` | Krankenhaus | `recipe.F.3.16` | `F.3.16_Krankenhaus.svg` | FP, RS | pending |  | Q-F-weiss-als-hilfsorganisation, Q-F.3-f-kreisformen |
| `bbk-babz-2025:F.3.17#primary` | Notfallinformationspunkt / KatS-Leuchtturm | `recipe.F.3.17` | `F.3.17_Notfallinformationspunkt_KatS-Leuchtturm.svg` | FP, RS | pending |  | Q-F-weiss-als-hilfsorganisation, Q-F.3-f-kreisformen |
| `bbk-babz-2025:F.3.18#primary` | Ladezone Personentransport | `recipe.F.3.18` | `F.3.18_Ladezone Personentransport.svg` | FP, RS | pending |  | Q-F-weiss-als-hilfsorganisation, Q-F.3-f-kreisformen |
| `bbk-babz-2025:F.3.19#primary` | Ladezone Personentransport, besondere Bedarfe | `recipe.F.3.19` | `F.3.19_Ladezone Personentransport_besondere Bedarfe.svg` | FP, RS | pending |  | Q-F-weiss-als-hilfsorganisation, Q-F.3-f-kreisformen |

#### Offene Fachfragen zu Anhang F

- **Q-F-weiss-als-hilfsorganisation** (`bbk-babz-2025:F.1.1#primary`, `bbk-babz-2025:F.1.2#primary`, `bbk-babz-2025:F.1.3#primary`, `bbk-babz-2025:F.1.4#primary`, `bbk-babz-2025:F.1.5#primary`, `bbk-babz-2025:F.1.6#primary`, `bbk-babz-2025:F.1.7#primary`, `bbk-babz-2025:F.1.8#primary`, `bbk-babz-2025:F.1.9#primary`, `bbk-babz-2025:F.1.10#primary`, `bbk-babz-2025:F.1.11#primary`, `bbk-babz-2025:F.1.12#primary`, `bbk-babz-2025:F.1.13#primary`, `bbk-babz-2025:F.1.14#primary`, `bbk-babz-2025:F.1.15#primary`, `bbk-babz-2025:F.1.16#primary`, `bbk-babz-2025:F.1.17#primary`, `bbk-babz-2025:F.1.18#primary`, `bbk-babz-2025:F.1.19#primary`, `bbk-babz-2025:F.1.20#primary`, `bbk-babz-2025:F.1.21#primary`, `bbk-babz-2025:F.1.22#primary`, `bbk-babz-2025:F.2.1#primary`, `bbk-babz-2025:F.2.2#primary`, `bbk-babz-2025:F.2.3#primary`, `bbk-babz-2025:F.2.4#primary`, `bbk-babz-2025:F.2.5#primary`, `bbk-babz-2025:F.2.6#primary`, `bbk-babz-2025:F.2.7#primary`, `bbk-babz-2025:F.2.8#primary`, `bbk-babz-2025:F.2.9#primary`, `bbk-babz-2025:F.2.10#primary`, `bbk-babz-2025:F.2.11#primary`, `bbk-babz-2025:F.2.12#primary`, `bbk-babz-2025:F.2.13#primary`, `bbk-babz-2025:F.2.14#primary`, `bbk-babz-2025:F.2.15#primary`, `bbk-babz-2025:F.2.16#primary`, `bbk-babz-2025:F.2.17#primary`, `bbk-babz-2025:F.3.1#primary`, `bbk-babz-2025:F.3.2#primary`, `bbk-babz-2025:F.3.3#primary`, `bbk-babz-2025:F.3.4#primary`, `bbk-babz-2025:F.3.5#primary`, `bbk-babz-2025:F.3.6#primary`, `bbk-babz-2025:F.3.7#primary`, `bbk-babz-2025:F.3.8#primary`, `bbk-babz-2025:F.3.9#primary`, `bbk-babz-2025:F.3.10#primary`, `bbk-babz-2025:F.3.11#primary`, `bbk-babz-2025:F.3.12#primary`, `bbk-babz-2025:F.3.13#primary`, `bbk-babz-2025:F.3.14#primary`, `bbk-babz-2025:F.3.15#primary`, `bbk-babz-2025:F.3.16#primary`, `bbk-babz-2025:F.3.17#primary`, `bbk-babz-2025:F.3.18#primary`, `bbk-babz-2025:F.3.19#primary`, `bbk-babz-2025:F.1.11#alternative`, `bbk-babz-2025:F.1.12#alternative`, `bbk-babz-2025:F.1.15#alternative`, `bbk-babz-2025:F.2.1#alternative`, `bbk-babz-2025:F.2.2#alternative`, `bbk-babz-2025:F.2.3#alternative`, `bbk-babz-2025:F.2.4#alternative`, `bbk-babz-2025:F.2.5#alternative`)
  Bedeutet der ausschließlich weiße Körper aller F-Dateien hilfsorganisation — oder gar keine Organisation?
  _Alle 66 F-Dateien führen ausschließlich #fff. Der Katalog hat sich für hilfsorganisation entschieden (Begründung in `recipes-anhang-f.ts`). Die Entscheidung wird in den Alternativthemes sichtbar: weiss trägt dort die Punktsignatur aus ORGANIZATION_BODY_DASHES._
- **Q-F.1-a-kuerzel** (`bbk-babz-2025:F.1.1#primary`, `bbk-babz-2025:F.1.2#primary`, `bbk-babz-2025:F.1.3#primary`, `bbk-babz-2025:F.1.4#primary`, `bbk-babz-2025:F.1.5#primary`, `bbk-babz-2025:F.1.6#primary`, `bbk-babz-2025:F.1.7#primary`, `bbk-babz-2025:F.1.8#primary`, `bbk-babz-2025:F.1.9#primary`, `bbk-babz-2025:F.1.10#primary`, `bbk-babz-2025:F.1.11#primary`)
  Tragen die am Bild abgelesenen Kürzel „MTF", „SEG" und „RettD" fachlich?
- **Q-F.1.1-fuenfter-staerkegrad** (`bbk-babz-2025:F.1.1#primary`)
  Bezeichnen die beiden Kopfbalken von F.1.1 einen fünften Stärkegrad, den Kapitel 5.4 nicht führt?
  _Der Katalog zeichnet sie nicht (siehe `ANHANG_F_A_DEVIATIONS`)._
- **Q-F.1-seg-verwechslung** (`bbk-babz-2025:F.1.9#primary`, `bbk-babz-2025:F.1.10#primary`)
  Bleiben F.1.9 und F.1.10 — beide „SEG", verschieden allein in der Fachdienstteilung — im Einsatz verwechslungsfrei?
- **Q-F.1.11-alternative** (`bbk-babz-2025:F.1.11#primary`, `bbk-babz-2025:F.1.11#alternative`)
  Bezeichnet F.1.11#alternative dasselbe wie F.1.11 und teilt deshalb zu Recht dessen Abschnitt statt einen eigenen zu bekommen?
- **Q-F.1.2-abc-oder-dekon** (`bbk-babz-2025:F.1.2#primary`)
  Leistet die „Dekontaminationseinheit" ABC-Schutz (4.1.1, wie gezeichnet) oder dekontaminiert sie (4.1.3, mit Häkchenpaar) — welche Lesart gilt?
  _Die Datei zeigt 4.1.1, obwohl sie „Dekontaminationseinheit" heißt. Dazu: Steht „MTF" hier richtig? Der Lauf ist zeichengleich mit F.1.1, die Einheit trägt das Kürzel ihrer Task Force und kein eigenes._
- **Q-F.1.4-zwei-fachdienstzeichen** (`bbk-babz-2025:F.1.4#primary`)
  Sagt die Nebeneinanderstellung von Teilung und Zelt (Sanitätsdienst und Betreuung) dasselbe aus wie der eine Umriss, den die Referenz zeichnet?
- **Q-F.2-c-alternativen-faehigkeiten** (`bbk-babz-2025:F.2.1#alternative`, `bbk-babz-2025:F.2.2#alternative`, `bbk-babz-2025:F.2.3#alternative`, `bbk-babz-2025:F.2.4#alternative`, `bbk-babz-2025:F.2.5#alternative`)
  Bezeichnen die rein aus der Grafik abgelesenen Fähigkeitskombinationen der fünf Alternativdarstellungen tatsächlich dieselben Fahrzeuge?
  _Aus dem Ring der Referenz darf nicht pauschal Intensivtransport abgeleitet werden._
- **Q-F.2-c-einzelmarken** (`bbk-babz-2025:F.2.2#primary`, `bbk-babz-2025:F.2.6#primary`, `bbk-babz-2025:F.2.7#primary`, `bbk-babz-2025:F.2.8#primary`, `bbk-babz-2025:F.2.9#primary`)
  Sind die kleine obere Marke von F.2.2, die Hebe-/Winschform von F.2.6 und die oberhalb gesetzte Abkürzung „ITH" fachlich richtig gedeutet?
- **Q-F.2-d-formen** (`bbk-babz-2025:F.2.10#primary`, `bbk-babz-2025:F.2.11#primary`, `bbk-babz-2025:F.2.12#primary`, `bbk-babz-2025:F.2.13#primary`, `bbk-babz-2025:F.2.14#primary`, `bbk-babz-2025:F.2.15#primary`, `bbk-babz-2025:F.2.16#primary`, `bbk-babz-2025:F.2.17#primary`)
  Was bedeuten die Vierwegeform aus F.2.11 und der verschobene Ring aus F.2.16 fachlich?
- **Q-F.3-e-formbegriffe** (`bbk-babz-2025:F.3.1#primary`, `bbk-babz-2025:F.3.2#primary`, `bbk-babz-2025:F.3.3#primary`, `bbk-babz-2025:F.3.4#primary`, `bbk-babz-2025:F.3.5#primary`, `bbk-babz-2025:F.3.6#primary`, `bbk-babz-2025:F.3.7#primary`, `bbk-babz-2025:F.3.8#primary`, `bbk-babz-2025:F.3.9#primary`, `bbk-babz-2025:F.3.10#primary`, `bbk-babz-2025:F.3.11#primary`)
  Welche Begriffe stehen hinter den neutral benannten Pfeil-, Rahmen- und Rautenformen der Platzzeichen?
  _Die technische Umsetzung behauptet diese Semantik ausdrücklich nicht._
- **Q-F.3-abgrenzung-transport** (`bbk-babz-2025:F.3.10#primary`, `bbk-babz-2025:F.3.11#primary`)
  Sind F.3.10 und F.3.11 tatsächlich von Patiententransport- oder Spezialrettungszeichen abzugrenzen?
- **Q-F.3-f-kreisformen** (`bbk-babz-2025:F.3.12#primary`, `bbk-babz-2025:F.3.13#primary`, `bbk-babz-2025:F.3.14#primary`, `bbk-babz-2025:F.3.15#primary`, `bbk-babz-2025:F.3.16#primary`, `bbk-babz-2025:F.3.17#primary`, `bbk-babz-2025:F.3.18#primary`, `bbk-babz-2025:F.3.19#primary`)
  Wie heißen die vier rein technisch benannten Kreisformen fachlich, und wie grenzen sich Ladezone, Personentransport und besondere Bedarfe ab?

### Anhang J — 53 offen, 0 approved, 0 deviation

| Manifestschlüssel | Titel | Implementierung | Referenzasset | Evidenz | Fachreview | note | Fragen |
|---|---|---|---|---|---|---|---|
| `bbk-babz-2025:J.1.1#primary` | Sprache | `comms.voice` | `J.1.1_Sprache.svg` | RS, PG | pending |  |  |
| `bbk-babz-2025:J.1.1#alternative` | Sprache | `comms.voice` | `J.1.1_Sprache_leitergebunden.svg` | RS, PG | pending |  |  |
| `bbk-babz-2025:J.1.2#primary` | Sprechfunk | `comms.voice-radio` | `J.1.2_Sprechfunk.svg` | RS, PG | pending |  |  |
| `bbk-babz-2025:J.1.3#primary` | Sprechfunk im DMO | `comms.voice-radio-dmo` | `J.1.3_Sprechfunk im DMO.svg` | RS, PG | pending |  |  |
| `bbk-babz-2025:J.1.4#primary` | Sprechfunk im TMO | `comms.voice-radio-tmo` | `J.1.4_Sprechfunk im TMO.svg` | RS, PG | pending |  |  |
| `bbk-babz-2025:J.1.5#primary` | SDS im DMO | `comms.sds-dmo` | `J.1.5_SDS im DMO.svg` | RS, PG | pending |  |  |
| `bbk-babz-2025:J.1.6#primary` | SDS im TMO | `comms.sds-tmo` | `J.1.6_SDS im TMO.svg` | RS, PG | pending |  |  |
| `bbk-babz-2025:J.1.7#primary` | Sprechfunk im DMO über Repeater | `comms.voice-radio-dmo-repeater` | `J.1.7_Sprechfunk im DMO_Repeater.svg` | RS, PG | pending |  |  |
| `bbk-babz-2025:J.1.8#primary` | Datenübertragung | `comms.data-transmission` | `J.1.8_Datenübertragung.svg` | RS, PG | pending |  |  |
| `bbk-babz-2025:J.1.8#alternative` | Datenübertragung | `comms.data-transmission` | `J.1.8_Datenübertragung_leitergebunden.svg` | RS, PG | pending |  |  |
| `bbk-babz-2025:J.1.9#primary` | Faxübertragung | `comms.fax-transmission` | `J.1.9_Faxübertragung.svg` | RS, PG | pending |  |  |
| `bbk-babz-2025:J.1.9#alternative` | Faxübertragung | `comms.fax-transmission` | `J.1.9_Faxübertragung_leitergebunden.svg` | RS, PG | pending |  |  |
| `bbk-babz-2025:J.1.10#primary` | Bildübertragung | `comms.image-transmission` | `J.1.10_Bildübertragung.svg` | RS, PG | pending |  |  |
| `bbk-babz-2025:J.1.10#alternative` | Bildübertragung | `comms.image-transmission` | `J.1.10_ Bildübertragung_leitergebunden.svg` | RS, PG | pending |  |  |
| `bbk-babz-2025:J.1.11#primary` | Livestreamübertragung | `comms.livestream-transmission` | `J.1.11_Livestreamübertragung.svg` | RS, PG | pending |  |  |
| `bbk-babz-2025:J.1.11#alternative` | Livestreamübertragung | `comms.livestream-transmission` | `J.1.11_Livestreamübertragung_leitergebunden.svg` | RS, PG | pending |  |  |
| `bbk-babz-2025:J.1.12#primary` | Satellitenverbindung Sprache | `comms.satellite-voice` | `J.1.12_Satellitenverbindung_Sprache.svg` | RS, PG | pending |  |  |
| `bbk-babz-2025:J.1.13#primary` | Satellitenverbindung Daten | `comms.satellite-data` | `J.1.13_Satellitenverbindung_Daten.svg` | RS, PG | pending |  |  |
| `bbk-babz-2025:J.1.14#primary` | Richtfunkverbindung | `comms.directional-radio` | `J.1.14_Richtfunkverbindung.svg` | RS, PG | pending |  |  |
| `bbk-babz-2025:J.2.1#primary` | Wechselverkehr | `comms.half-duplex-operation` | `J.2.1_Wechselverkehr.svg` | RS, PG | pending |  |  |
| `bbk-babz-2025:J.2.2#primary` | Gegenverkehr | `comms.duplex-operation` | `J.2.2_Gegenverkehr.svg` | RS, PG | pending |  |  |
| `bbk-babz-2025:J.3.1#primary` | Fernmeldegerät (Grundzeichen) | `comms.telecom-device` | `J.3.1_Fernmeldegerät Grundzeichen.svg` | RS, PG | pending |  |  |
| `bbk-babz-2025:J.3.2#primary` | Basisstation | `comms.base-station` | `J.3.2_Basisstation.svg` | RS, PG | pending |  |  |
| `bbk-babz-2025:J.3.3#primary` | Mobile Basisstation | `comms.mobile-base-station` | `J.3.3_Mobile Basisstation.svg` | RS, PG | pending |  |  |
| `bbk-babz-2025:J.3.4#primary` | Gateway | `comms.gateway` | `J.3.4_Gateway.svg` | RS, PG | pending |  |  |
| `bbk-babz-2025:J.3.5#primary` | Repeater | `comms.repeater` | `J.3.5_Repeater.svg` | RS, PG | pending |  |  |
| `bbk-babz-2025:J.3.6#primary` | Handheld Radio Terminal | `comms.handheld-radio-terminal` | `J.3.6_Handheld Radio Terminal.svg` | RS, PG | pending |  |  |
| `bbk-babz-2025:J.3.7#primary` | Mobile Radio Terminal | `comms.mobile-radio-terminal` | `J.3.7_Mobile Radio Terminal.svg` | RS, PG | pending |  |  |
| `bbk-babz-2025:J.3.8#primary` | Fixed Radio Terminal | `comms.fixed-radio-terminal` | `J.3.8_Fixed Radio Terminal.svg` | RS, PG | pending |  |  |
| `bbk-babz-2025:J.3.9#primary` | Active Paging Radio Terminal | `comms.active-paging-radio-terminal` | `J.3.9_Active Paging Radio Terminal.svg` | RS, PG | pending |  |  |
| `bbk-babz-2025:J.3.10#primary` | Antenne | `comms.antenna` | `J.3.10_Antenne.svg` | RS, PG | pending |  |  |
| `bbk-babz-2025:J.3.11#primary` | Kabelbau | `comms.cable-construction` | `J.3.11_Kabelbau.svg` | RS, PG | pending |  |  |
| `bbk-babz-2025:J.3.12#primary` | Funk | `comms.radio` | `J.3.12_Funk.svg` | RS, PG | pending |  |  |
| `bbk-babz-2025:J.3.13#primary` | Übergänge | `comms.transitions` | `J.3.13_Übergänge.svg` | RS, PG | pending |  |  |
| `bbk-babz-2025:J.3.14#primary` | Fernsprechvermittlung | `comms.telephone-exchange` | `J.3.14_Fernsprechvermittlung.svg` | RS, PG | pending |  |  |
| `bbk-babz-2025:J.3.15#primary` | Fernsprechvermittlung VoIP | `comms.telephone-exchange-voip` | `J.3.15_Fernsprechvermittlung VoIP.svg` | RS, PG | pending |  |  |
| `bbk-babz-2025:J.4.1#primary` | Router | `comms.router` | `J.4.1_Router.svg` | RS, PG | pending |  |  |
| `bbk-babz-2025:J.4.2#primary` | Switch | `comms.switch` | `J.4.2_Switch.svg` | RS, PG | pending |  |  |
| `bbk-babz-2025:J.4.3#primary` | Server | `comms.server` | `J.4.3_Server.svg` | RS, PG | pending |  |  |
| `bbk-babz-2025:J.4.4#primary` | Access Point | `comms.access-point` | `J.4.4_Access Point.svg` | RS, PG | pending |  |  |
| `bbk-babz-2025:J.4.5#primary` | WAN | `comms.wan` | `J.4.5_WAN.svg` | RS, PG | pending |  |  |
| `bbk-babz-2025:J.4.6#primary` | Firewall | `comms.firewall` | `J.4.6_Firewall.svg` | RS, PG | pending |  |  |
| `bbk-babz-2025:J.4.7#primary` | Drucker | `comms.printer` | `J.4.7_Drucker.svg` | RS, PG | pending |  |  |
| `bbk-babz-2025:J.4.8#primary` | Längenverbindung | `comms.connection-length` | `J.4.8_Längenverbindung.svg` | RS, PG | pending |  |  |
| `bbk-babz-2025:J.4.9#primary` | Abholpunkt | `comms.pickup-point` | `J.4.9_Abholpunkt.svg` | RS, PG | pending |  |  |
| `bbk-babz-2025:J.4.10#primary` | Anschlusspunkt | `comms.connection-point` | `J.4.10_Anschlusspunkt.svg` | RS, PG | pending |  |  |
| `bbk-babz-2025:J.4.11#primary` | Kreuzung von Verbindungen | `comms.connection-crossing` | `J.4.11_Kreuzung von Verbindungen.svg` | RS, PG | pending |  |  |
| `bbk-babz-2025:J.4.12#primary` | Verteiler | `comms.distributor` | `J.4.12_Verteiler.svg` | RS, PG | pending |  |  |
| `bbk-babz-2025:J.4.13#primary` | Verteiler mit Überspannungsschutz | `comms.distributor-with-surge-protection` | `J.4.13_Verteiler mit Überspannschutz.svg` | RS, PG | pending |  |  |
| `bbk-babz-2025:J.4.14#primary` | Kabel, temporär verlegt | `comms.cable-temporary` | `J.4.14_Kabel_temporär verlegt.svg` | RS, PG | pending |  |  |
| `bbk-babz-2025:J.4.15#primary` | Glasfaser, temporär verlegt | `comms.fiber-temporary` | `J.4.15_Glasfaser_temporär verlegt.svg` | RS, PG | pending |  |  |
| `bbk-babz-2025:J.4.16#primary` | Netzwerkkabel, temporär verlegt | `comms.network-cable-temporary` | `J.4.16_Netzwerkkabel_temporär verlegt.svg` | RS, PG | pending |  |  |
| `bbk-babz-2025:J.4.17#primary` | Anzahl Doppeladern | `comms.twisted-pair-count` | `J.4.17_Anzahl Doppeladern.svg` | RS, PG | pending |  |  |

### Anhang I — 50 offen, 0 approved, 0 deviation

| Manifestschlüssel | Titel | Implementierung | Referenzasset | Evidenz | Fachreview | note | Fragen |
|---|---|---|---|---|---|---|---|
| `bbk-babz-2025:I.1.1#primary` | Wasserrettungstrupp | `recipe.I.1.1` | `I.1.1_Wasserrettungstrupp.svg` | FP, RS | pending |  | Q-I.1-c-weiss-und-einzelbalken |
| `bbk-babz-2025:I.1.2#primary` | Wasserrettungsgruppe | `recipe.I.1.2` | `I.1.2_Wasserrettungsgruppe.svg` | FP, RS | pending |  | Q-I.1-c-weiss-und-einzelbalken |
| `bbk-babz-2025:I.1.3#primary` | Wasserrettungszug | `recipe.I.1.3` | `I.1.3_Wasserrettungszug.svg` | FP, RS | pending |  | Q-I.1-c-weiss-und-einzelbalken |
| `bbk-babz-2025:I.1.4#primary` | Wasserrettungsverband | `recipe.I.1.4` | `I.1.4_Wasserrettungsverband.svg` | FP, RS | pending |  | Q-I.1-c-weiss-und-einzelbalken |
| `bbk-babz-2025:I.1.5#primary` | Zugtrupp Wasserrettungszug | `recipe.I.1.5` | `I.1.5_Zugtrupp Wasserrettungszug.svg` | FP, RS | pending |  | Q-I.1-d-weisser-koerper |
| `bbk-babz-2025:I.1.6#primary` | Führungstrupp Wasserrettung | `recipe.I.1.6` | `I.1.6_Führungstrupp Wasserrettung.svg` | FP, RS | pending |  | Q-I.1-d-weisser-koerper |
| `bbk-babz-2025:I.1.7#primary` | Führungsgruppe Wasserrettung | `recipe.I.1.7` | `I.1.7_Führungsgruppe Wasserrettung.svg` | FP, RS | pending |  | Q-I.1-d-weisser-koerper |
| `bbk-babz-2025:I.1.8#primary` | Führungsstaffel Wasserrettung | `recipe.I.1.8` | `I.1.8_Führungsstaffel Wasserrettung.svg` | FP, RS | pending |  | Q-I.1-d-weisser-koerper |
| `bbk-babz-2025:I.1.9#primary` | Bootstrupp Wasserrettungszug | `recipe.I.1.9` | `I.1.9_Bootstrupp Wasserrettungszug.svg` | FP, RS | pending |  | Q-I.1-e-hilfsorganisation |
| `bbk-babz-2025:I.1.9#alternative` | Bootstrupp Wasserrettungszug | `recipe.I.1.9#alternative` | `I.1.9_Bootstrupp Wasserrettungszug_Alternative.svg` | FP, RS | pending |  | Q-I.1-e-hilfsorganisation |
| `bbk-babz-2025:I.1.10#primary` | Bootsgruppe Wasserrettung | `recipe.I.1.10` | `I.1.10_Bootsgruppe Wasserrettung.svg` | FP, RS | pending |  | Q-I.1-e-hilfsorganisation |
| `bbk-babz-2025:I.1.11#primary` | Tauchtrupp | `recipe.I.1.11` | `I.1.11_Tauchtrupp.svg` | FP, RS | pending |  | Q-I.1-e-hilfsorganisation |
| `bbk-babz-2025:I.1.12#primary` | Tauchgruppe | `recipe.I.1.12` | `I.1.12_Tauchgruppe.svg` | FP, RS | pending |  | Q-I.1-e-hilfsorganisation |
| `bbk-babz-2025:I.1.13#primary` | Trupp Umweltgefahren | `recipe.I.1.13` | `I.1.13_Trupp Umweltgefahren.svg` | FP, RS | pending |  | Q-I.1-f-formen |
| `bbk-babz-2025:I.1.14#primary` | Gruppe Umweltgefahren | `recipe.I.1.14` | `I.1.14_Gruppe Umweltgefahren.svg` | FP, RS | pending |  | Q-I.1-f-formen |
| `bbk-babz-2025:I.1.15#primary` | Trupp Ölabwehr | `recipe.I.1.15` | `I.1.15_Trupp Ölabwehr.svg` | FP, RS | pending |  | Q-I.1-f-formen |
| `bbk-babz-2025:I.1.16#primary` | Gruppe Ölabwehr | `recipe.I.1.16` | `I.1.16_Gruppe Ölabwehr.svg` | FP, RS | pending |  | Q-I.1-f-formen |
| `bbk-babz-2025:I.1.17#primary` | Strömungsrettungstrupp | `recipe.I.1.17` | `I.1.17_Strömungsrettungstrupp.svg` | FP, RS | pending |  | Q-I.1-g-bedeutung |
| `bbk-babz-2025:I.1.18#primary` | Strömungsrettungsgruppe | `recipe.I.1.18` | `I.1.18_Strömungsrettungsgruppe.svg` | FP, RS | pending |  | Q-I.1-g-bedeutung |
| `bbk-babz-2025:I.1.19#primary` | Trupp Luftunterstützte Wasserrettung | `recipe.I.1.19` | `I.1.19_Trupp Luftunterstützte Wasserrettung.svg` | FP, RS | pending |  | Q-I.1-g-bedeutung |
| `bbk-babz-2025:I.1.20#primary` | Trupp Drohne | `recipe.I.1.20` | `I.1.20_Trupp Drohne.svg` | FP, RS | pending |  | Q-I.1-g-bedeutung |
| `bbk-babz-2025:I.2.1#primary` | Gerätewagen Wasserrettung, geländegängig | `recipe.I.2.1` | `I.2.1_Gerätewagen Wasserrettung_geländegängig.svg` | FP, RS | pending |  | Q-I.2-landfahrzeuge |
| `bbk-babz-2025:I.2.2#primary` | Gerätewagen Tauchen | `recipe.I.2.2` | `I.2.2_Gerätewagen Tauchen.svg` | FP, RS | pending |  | Q-I.2-landfahrzeuge |
| `bbk-babz-2025:I.2.3#primary` | Gerätewagen Strömungsrettung | `recipe.I.2.3` | `I.2.3_Gerätewagen Strömungsrettung.svg` | FP, RS | pending |  | Q-I.2-landfahrzeuge |
| `bbk-babz-2025:I.2.4#primary` | Anhänger Wasserrettung | `recipe.I.2.4` | `I.2.4_Anhänger Wasserrettung.svg` | FP, RS | pending |  | Q-I.2-landfahrzeuge |
| `bbk-babz-2025:I.2.5#primary` | Anhänger Tauchen | `recipe.I.2.5` | `I.2.5_Anhänger Tauchen.svg` | FP, RS | pending |  | Q-I.2-landfahrzeuge |
| `bbk-babz-2025:I.2.6#primary` | Anhänger Strömungsrettung | `recipe.I.2.6` | `I.2.6_Anhänger Strömungsrettung.svg` | FP, RS | pending |  | Q-I.2-landfahrzeuge |
| `bbk-babz-2025:I.2.7#primary` | Bootsanhänger | `recipe.I.2.7` | `I.2.7_Bootsanhänger.svg` | FP, RS | pending |  | Q-I.2-landfahrzeuge |
| `bbk-babz-2025:I.3.1#primary` | Boot allgemein | `recipe.I.3.1` | `I.3.1_Boot allgemein.svg` | FP, RS | pending |  | Q-I.3-bedeutung |
| `bbk-babz-2025:I.3.2#primary` | Schlauchboot | `recipe.I.3.2` | `I.3.2_Schlauchboot.svg` | FP, RS | pending |  | Q-I.3-bedeutung |
| `bbk-babz-2025:I.3.3#primary` | Festrumpfschlauchboot | `recipe.I.3.3` | `I.3.3_Festrumpfschlauchboot.svg` | FP, RS | pending |  | Q-I.3-bedeutung |
| `bbk-babz-2025:I.3.4#primary` | Hochwasserboot | `recipe.I.3.4` | `I.3.4_Hochwasserboot.svg` | FP, RS | pending |  | Q-I.3-bedeutung |
| `bbk-babz-2025:I.3.5#primary` | Mehrzweckboot | `recipe.I.3.5` | `I.3.5_Mehrzweckboot.svg` | FP, RS | pending |  | Q-E.2-wasserfahrzeuge-gleich-i.3, Q-I.3-bedeutung |
| `bbk-babz-2025:I.3.6#primary` | Mehrzweckarbeitsboot | `recipe.I.3.6` | `I.3.6_Mehrzweckarbeitsboot.svg` | FP, RS | pending |  | Q-E.2-wasserfahrzeuge-gleich-i.3, Q-I.3-bedeutung |
| `bbk-babz-2025:I.3.7#primary` | Mehrzweckponton | `recipe.I.3.7` | `I.3.7_Mehrzweckponton.svg` | FP, RS | pending |  | Q-E.2-wasserfahrzeuge-gleich-i.3, Q-I.3-bedeutung |
| `bbk-babz-2025:I.3.8#primary` | Rettungsboot Typ 1 | `recipe.I.3.8` | `I.3.8_Rettungsboot_Typ 1.svg` | FP, RS | pending |  | Q-I.3-bedeutung |
| `bbk-babz-2025:I.3.9#primary` | Rettungsboot Typ 2 | `recipe.I.3.9` | `I.3.9_Rettungsboot_Typ 2.svg` | FP, RS | pending |  | Q-I.3-bedeutung |
| `bbk-babz-2025:I.3.10#primary` | Raft | `recipe.I.3.10` | `I.3.10_Raft.svg` | FP, RS | pending |  | Q-I.3-bedeutung |
| `bbk-babz-2025:I.3.11#primary` | Feuerlöschboot | `recipe.I.3.11` | `I.3.11_Feuerlöschboot.svg` | FP, RS | pending |  | Q-I.3-bedeutung |
| `bbk-babz-2025:I.4.1#primary` | Wasserrettungsstation, ortsgebunden | `recipe.I.4.1` | `I.4.1_Wasserrettungsstation_ortsgebunden.svg` | FP, RS | pending |  | Q-I.4-marken |
| `bbk-babz-2025:I.4.2#primary` | Slip-Stelle | `recipe.I.4.2` | `I.4.2_Slip-Stelle.svg` | FP, RS | pending |  | Q-I.4-marken |
| `bbk-babz-2025:I.4.3#primary` | Anlegestelle für Boote | `recipe.I.4.3` | `I.4.3_Anlegestelle für Boote.svg` | FP, RS | pending |  | Q-I.4-marken |
| `bbk-babz-2025:I.5.1#primary` | Einsatzkraft Wasserrettung | `recipe.I.5.1` | `I.5.1_Einsatzkraft Wasserrettung.svg` | FP, RS | pending |  | Q-I.5-wasserrettungspersonal |
| `bbk-babz-2025:I.5.2#primary` | Strömungsretter | `recipe.I.5.2` | `I.5.2_Strömungsretter.svg` | FP, RS | pending |  | Q-I.5-wasserrettungspersonal |
| `bbk-babz-2025:I.5.3#primary` | Taucher | `recipe.I.5.3` | `I.5.3_Taucher.svg` | FP, RS | pending |  | Q-I.5-wasserrettungspersonal |
| `bbk-babz-2025:I.5.4#primary` | Truppführer Wasserrettungstrupp | `water-rescue-personnel.team-leader` | `I.5.4_Truppführer Wasserrettungstrupp.svg` | RS, PG | pending |  | Q-I.5-wasserrettungspersonal |
| `bbk-babz-2025:I.5.5#primary` | Gruppenführer Wasserrettungsgruppe | `water-rescue-personnel.group-leader` | `I.5.5_Gruppenführer Wasserrettungsgruppe.svg` | RS, PG | pending |  | Q-I.5-wasserrettungspersonal |
| `bbk-babz-2025:I.5.6#primary` | Zugführer Wasserrettungszug | `water-rescue-personnel.platoon-leader` | `I.5.6_Zugführer Wasserrettungszug.svg` | RS, PG | pending |  | Q-I.5-wasserrettungspersonal |
| `bbk-babz-2025:I.5.7#primary` | Verbandsführer Wasserrettungsverband | `water-rescue-personnel.formation-leader` | `I.5.7_Verbandsführer Wasserrettungsverband.svg` | RS, PG | pending |  | Q-I.5-wasserrettungspersonal |
| `bbk-babz-2025:I.5.8#primary` | Fachberater Wasserrettung | `water-rescue-personnel.technical-advisor` | `I.5.8_Fachberater Wasserrettung.svg` | RS, PG | pending |  | Q-I.5-wasserrettungspersonal |

#### Offene Fachfragen zu Anhang I

- **Q-E.2-wasserfahrzeuge-gleich-i.3** (`bbk-babz-2025:E.2.29#primary`, `bbk-babz-2025:E.2.30#primary`, `bbk-babz-2025:E.2.31#primary`, `bbk-babz-2025:I.3.5#primary`, `bbk-babz-2025:I.3.6#primary`, `bbk-babz-2025:I.3.7#primary`)
  Sind E.2.29 bis E.2.31 dieselben Einheiten wie I.3.5 bis I.3.7?
  _Ihre mittigen Läufe sind bis auf 0,00035 mm deckungsgleich, sie tragen dieselben Namen und unterscheiden sich allein in der Farbe. Die Antwort entscheidet, ob Alternativdarstellungen entstehen oder eigene IDs._
- **Q-I.1-c-weiss-und-einzelbalken** (`bbk-babz-2025:I.1.1#primary`, `bbk-babz-2025:I.1.2#primary`, `bbk-babz-2025:I.1.3#primary`, `bbk-babz-2025:I.1.4#primary`)
  Welche Organisation und welche Stärke bezeichnen der weiße Körper und der Einzelbalken von I.1.1 bis I.1.4?
  _Der Katalog leitet daraus bewusst keine Zuordnung ab._
- **Q-I.1-d-weisser-koerper** (`bbk-babz-2025:I.1.5#primary`, `bbk-babz-2025:I.1.6#primary`, `bbk-babz-2025:I.1.7#primary`, `bbk-babz-2025:I.1.8#primary`)
  Welche organisatorische und fachliche Bedeutung hat der weiße Körper von I.1.5 bis I.1.8?
- **Q-I.1-e-hilfsorganisation** (`bbk-babz-2025:I.1.9#primary`, `bbk-babz-2025:I.1.10#primary`, `bbk-babz-2025:I.1.11#primary`, `bbk-babz-2025:I.1.12#primary`, `bbk-babz-2025:I.1.9#alternative`)
  Gehören die weißen Wasserrettungsformationen zur Hilfsorganisation, und was unterscheidet die zwei Darstellungen von I.1.9?
  _Die Alternative ist ein eigener Reviewträger, keine stillschweigend gleichgesetzte Grafik._
- **Q-I.1-f-formen** (`bbk-babz-2025:I.1.13#primary`, `bbk-babz-2025:I.1.14#primary`, `bbk-babz-2025:I.1.15#primary`, `bbk-babz-2025:I.1.16#primary`)
  Welche Organisation und einsatztaktische Klassifikation stehen hinter den weißen Körpern und den Scheiben-, Schaft-, Klammer- beziehungsweise Ölformen von I.1.13 bis I.1.16?
- **Q-I.1-g-bedeutung** (`bbk-babz-2025:I.1.17#primary`, `bbk-babz-2025:I.1.18#primary`, `bbk-babz-2025:I.1.19#primary`, `bbk-babz-2025:I.1.20#primary`)
  Ist die Bedeutungszuordnung von Wasserrettung, Luftunterstützung und Drohne bei I.1.17 bis I.1.20 fachlich richtig?
- **Q-I.2-landfahrzeuge** (`bbk-babz-2025:I.2.1#primary`, `bbk-babz-2025:I.2.2#primary`, `bbk-babz-2025:I.2.3#primary`, `bbk-babz-2025:I.2.4#primary`, `bbk-babz-2025:I.2.5#primary`, `bbk-babz-2025:I.2.6#primary`, `bbk-babz-2025:I.2.7#primary`)
  Sind die I.2-Landfahrzeuge über die freigegebene kategorieabhängige Geometrie hinaus fachlich richtig benannt und zugeordnet?
- **Q-I.3-bedeutung** (`bbk-babz-2025:I.3.1#primary`, `bbk-babz-2025:I.3.2#primary`, `bbk-babz-2025:I.3.3#primary`, `bbk-babz-2025:I.3.4#primary`, `bbk-babz-2025:I.3.5#primary`, `bbk-babz-2025:I.3.6#primary`, `bbk-babz-2025:I.3.7#primary`, `bbk-babz-2025:I.3.8#primary`, `bbk-babz-2025:I.3.9#primary`, `bbk-babz-2025:I.3.10#primary`, `bbk-babz-2025:I.3.11#primary`)
  Welche organisatorische und fachliche Bedeutung haben die elf I.3-Zeichen?
  _Das Erscheinungsbild ist durch Rezept-, Fingerprint- und Snapshot-Gates belegt._
- **Q-I.4-marken** (`bbk-babz-2025:I.4.1#primary`, `bbk-babz-2025:I.4.2#primary`, `bbk-babz-2025:I.4.3#primary`)
  Sind die Marken der weißen HiOrg-Kreiszeichen I.4.1 bis I.4.3 richtig benannt und gegeneinander verwechslungsfrei — insbesondere ohne neue Semantik aus dem Giebel von I.4.1?
- **Q-I.5-wasserrettungspersonal** (`bbk-babz-2025:I.5.1#primary`, `bbk-babz-2025:I.5.2#primary`, `bbk-babz-2025:I.5.3#primary`, `bbk-babz-2025:I.5.4#primary`, `bbk-babz-2025:I.5.5#primary`, `bbk-babz-2025:I.5.6#primary`, `bbk-babz-2025:I.5.7#primary`, `bbk-babz-2025:I.5.8#primary`)
  Bezeichnet der weiße Körper von I.5.1 bis I.5.8 fachlich Wasserrettungspersonal?

### Anhang D — 37 offen, 0 approved, 0 deviation

| Manifestschlüssel | Titel | Implementierung | Referenzasset | Evidenz | Fachreview | note | Fragen |
|---|---|---|---|---|---|---|---|
| `bbk-babz-2025:D.1.2#primary` | Katastrophenschutzleitung im Einsatz | `recipe.D.1.2` | `D.1.2_Katastrophenschutzleitung im Einsatz.svg` | FP, RS | pending |  |  |
| `bbk-babz-2025:D.1.3#primary` | Technische Einsatzleitung Evakuierung im Einsatz | `recipe.D.1.3` | `D.1.3_Technische Einsatzleitung Evakuierung im Einsatz.svg` | FP, RS | pending |  | Q-D.1-englische-arbeitsnamen |
| `bbk-babz-2025:D.1.4#primary` | Einsatzleitung im Einsatz | `recipe.D.1.4` | `D.1.4_Einsatzleitung im Einsatz.svg` | FP, RS | pending |  |  |
| `bbk-babz-2025:D.1.5#primary` | Einsatzabschnittsleitung Nord im Einsatz | `recipe.D.1.5` | `D.1.5_Einsatzabschnittsleitung Nord im Einsatz.svg` | FP, RS | pending |  |  |
| `bbk-babz-2025:D.1.6#primary` | Unterabschnittsleitung im Einsatz | `recipe.D.1.6` | `D.1.6._Unterabschnittsleitung im Einsatz.svg` | FP, RS | pending |  |  |
| `bbk-babz-2025:D.1.7#primary` | Führungsgruppe TEL | `recipe.D.1.7` | `D.1.7_Führungsgruppe TEL.svg` | FP, RS | pending |  |  |
| `bbk-babz-2025:D.1.8#primary` | Führungsgruppe einer Feuerwehrbereitschaft | `recipe.D.1.8` | `D.1.8_Führungsgruppe einer Feuerwehrbereitschaft.svg` | FP, RS | pending |  | Q-D.1-englische-arbeitsnamen |
| `bbk-babz-2025:D.1.9#primary` | Zugtrupp einer Sanitätseinheit | `recipe.D.1.9` | `D.1.9_Zugtrupp einer Sanitätseinheit.svg` | FP, RS | pending | Organisationszuordnung hilfsorganisation ist aus der weißen Fläche abgeleitet. | Q-D.1.9-hilfsorganisation-aus-weiss |
| `bbk-babz-2025:D.1.9#alternative` | Zugtrupp einer Sanitätseinheit | `recipe.D.1.9#alternative` | `D.1.9_Zugtrupp einer Sanitätseinheit_Alternative.svg` | FP, RS | pending | Organisationszuordnung hilfsorganisation ist aus der weißen Fläche abgeleitet. | Q-D.1.9-hilfsorganisation-aus-weiss |
| `bbk-babz-2025:D.3.1#primary` | Technischer Einsatzleiter | `recipe.D.3.1` | `D.3.1_Technischer Einsatzleiter LK Ahrweiler.svg` | FP, RS | pending |  | Q-D.3-rollenbezeichnungen |
| `bbk-babz-2025:D.3.2#primary` | Einsatzleiter | `recipe.D.3.2` | `D.3.2_Einsatzleiter.svg` | FP, RS | pending |  | Q-D.3-rollenbezeichnungen |
| `bbk-babz-2025:D.3.3#primary` | Leitender Notarzt | `recipe.D.3.3` | `D.3.3_Leitender Notarzt.svg` | FP, RS | pending |  | Q-D.3-rollenbezeichnungen |
| `bbk-babz-2025:D.3.4#primary` | Organisatorischer Leiter | `recipe.D.3.4` | `D.3.4_Organisatorischer Leiter.svg` | FP, RS | pending |  | Q-D.3-rollenbezeichnungen |
| `bbk-babz-2025:D.3.5#primary` | Einsatzabschnittsleiter | `recipe.D.3.5` | `D.3.5_Einsatzabschnittsleiter.svg` | FP, RS | pending |  | Q-D.3-rollenbezeichnungen |
| `bbk-babz-2025:D.3.6#primary` | Untereinsatzabschnittsleiter | `recipe.D.3.6` | `D.3.6_Untereinsatzabschnittsleiter.svg` | FP, RS | pending |  | Q-D.3-rollenbezeichnungen |
| `bbk-babz-2025:D.3.7#primary` | Zugführer der Feuerwehr | `recipe.D.3.7` | `D.3.7_Zugführer der Feuerwehr.svg` | FP, RS | pending |  | Q-D.3-rollenbezeichnungen, Q-D.3.7-zugfuehrer |
| `bbk-babz-2025:D.3.8#primary` | Zugführer Technischer Zug | `recipe.D.3.8` | `D.3.8_Zugführer Technischer Zug THW.svg` | FP, RS | pending |  | Q-D.3-rollenbezeichnungen |
| `bbk-babz-2025:D.3.9#primary` | Zugführer Sanitätszug | `recipe.D.3.9` | `D.3.9_Zugführer Sanitätszug ASB.svg` | FP, RS | pending |  | Q-D.3-rollenbezeichnungen |
| `bbk-babz-2025:D.3.10#primary` | Zugführer Einsatzeinheit | `recipe.D.3.10` | `D.3.10_Zugführer Einsatzeinheit DRK.svg` | FP, RS | pending |  | Q-D.3-rollenbezeichnungen |
| `bbk-babz-2025:D.3.11#primary` | Zugführer Betreuungszug | `recipe.D.3.11` | `D.3.11_Zugführer Betreuungszug ASB.svg` | FP, RS | pending |  | Q-D.3-rollenbezeichnungen |
| `bbk-babz-2025:D.3.12#primary` | Gruppenführer Betreuungsgruppe | `recipe.D.3.12` | `D.3.12_Gruppenführer Betreuungsgruppe Malteser.svg` | FP, RS | pending |  | Q-D.3-rollenbezeichnungen |
| `bbk-babz-2025:D.3.13#primary` | Gruppenführer Schnell-Einsatzgruppe | `recipe.D.3.13` | `D.3.13_Gruppenführer Schnell-Einsatzgruppe Johanniter.svg` | FP, RS | pending |  | Q-D.3-rollenbezeichnungen |
| `bbk-babz-2025:D.4.1#primary` | Leiter Kreisleitstelle Steinfurt | `recipe.D.4.1` | `D.4.1_Leiter Kreisleitstelle Steinfurt.svg` | FP, RS | pending |  | Q-D.4-verwaltungsrollen |
| `bbk-babz-2025:D.4.2#primary` | Kreisbrandmeister Mettmann | `recipe.D.4.2` | `D.4.2_Kreisbrandmeister Mettmann.svg` | FP, RS | pending |  | Q-D.4-verwaltungsrollen |
| `bbk-babz-2025:D.4.3#primary` | Leiter Gefahrenabwehr Mönchengladbach | `recipe.D.4.3` | `D.4.3_Leiter Gefahrenabwehr Mönchengladbach.svg` | FP, RS | pending |  | Q-D.4-verwaltungsrollen |
| `bbk-babz-2025:D.4.4#primary` | Leiter Gefahrenabwehrkräfte Bundespolizei | `recipe.D.4.4` | `D.4.4_Leiter Gefahrenabwehrkräfte Bundespolizei.svg` | FP, RS | pending |  | Q-D.4-verwaltungsrollen |
| `bbk-babz-2025:D.4.5#primary` | Leiter internationalen Hilfsaktion | `recipe.D.4.5` | `D.4.5_Leiter internationalen Hilfsaktion.svg` | FP, RS | pending |  | Q-D.4-verwaltungsrollen |
| `bbk-babz-2025:D.1.1#primary` | Befehlsstelle im Einsatz | `leadership.command-post-in-operation` | `D.1.1_Befehlsstelle im Einsatz.svg` | RS, PG | pending |  | Q-D.1-fuehrungsbegriff-uebersetzung |
| `bbk-babz-2025:D.2.1#primary` | Bereitstellungsraum | `leadership.staging-area` | `D.2.1_Bereitstellungsraum.svg` | RS, PG | pending |  | Q-D.2-gelbe-kreisflaeche, Q-D.2-ortsbegriffe-uebersetzung |
| `bbk-babz-2025:D.2.2#primary` | Bereitstellungsraum mit Meldekopf | `leadership.staging-area-with-reporting-head` | `D.2.2_Bereitstellungsraum mit Meldekopf.svg` | RS, PG | pending |  | Q-D.2-gelbe-kreisflaeche, Q-D.2-ortsbegriffe-uebersetzung |
| `bbk-babz-2025:D.2.3#primary` | Meldekopf | `leadership.reporting-head` | `D.2.3_Meldekopf.svg` | RS, PG | pending |  | Q-D.2-gelbe-kreisflaeche, Q-D.2-ortsbegriffe-uebersetzung |
| `bbk-babz-2025:D.2.4#primary` | Lotsenstelle | `leadership.guide-post` | `D.2.4_Lotsenstelle.svg` | RS, PG | pending |  | Q-D.2-gelbe-kreisflaeche, Q-D.2-ortsbegriffe-uebersetzung |
| `bbk-babz-2025:D.2.5#primary` | Leitstelle | `leadership.control-center` | `D.2.5_Leitstelle.svg` | RS, PG | pending |  | Q-D.2-gelbe-kreisflaeche, Q-D.2-ortsbegriffe-uebersetzung |
| `bbk-babz-2025:D.2.6#primary` | Hubschrauberlandezone | `leadership.helicopter-landing-zone` | `D.2.6_Hubschrauberlandezone.svg` | RS, PG | pending |  | Q-D.2-gelbe-kreisflaeche, Q-D.2-ortsbegriffe-uebersetzung |
| `bbk-babz-2025:D.2.7#primary` | Hubschrauberlandeplatz | `leadership.helicopter-landing-site` | `D.2.7_Hubschrauberlandeplatz.svg` | RS, PG | pending |  | Q-D.2-gelbe-kreisflaeche, Q-D.2-ortsbegriffe-uebersetzung |
| `bbk-babz-2025:D.3.14#primary` | Fachberater THW | `leadership.technical-advisor-thw` | `D.3.14_Fachberater THW.svg` | RS, PG | pending |  | Q-D.3-offene-kappen-ohne-rolle |
| `bbk-babz-2025:D.3.15#primary` | Rotkreuzbeauftragter | `leadership.red-cross-commissioner` | `D.3.15_Rotkreuzbeauftragter.svg` | RS, PG | pending |  | Q-D.3-offene-kappen-ohne-rolle |

#### Offene Fachfragen zu Anhang D

- **Q-D.1-fuehrungsbegriff-uebersetzung** (`bbk-babz-2025:D.1.1#primary`)
  Ist die technische ID von D.1.1 eine tragfähige Übersetzung des Führungsbegriffs — sie behauptet keine freigegebene?
- **Q-D.1-englische-arbeitsnamen** (`bbk-babz-2025:D.1.3#primary`, `bbk-babz-2025:D.1.8#primary`)
  Tragen die im Design markierten englischen Arbeitsnamen von D.1.3 und D.1.8 fachlich, oder braucht es andere Bezeichner?
- **Q-D.1.9-hilfsorganisation-aus-weiss** (`bbk-babz-2025:D.1.9#primary`, `bbk-babz-2025:D.1.9#alternative`)
  Folgt aus dem weißen Körper von D.1.9 die Organisation hilfsorganisation?
  _Die Quelle belegt zunächst nur eine weiße Fläche; die sichtbare Farbe ist keine Freigabe._
- **Q-D.2-gelbe-kreisflaeche** (`bbk-babz-2025:D.2.1#primary`, `bbk-babz-2025:D.2.2#primary`, `bbk-babz-2025:D.2.3#primary`, `bbk-babz-2025:D.2.4#primary`, `bbk-babz-2025:D.2.5#primary`, `bbk-babz-2025:D.2.6#primary`, `bbk-babz-2025:D.2.7#primary`)
  Belegt die gelbe Kreisfläche der Ortszeichen eine Organisation — oder keine?
- **Q-D.2-ortsbegriffe-uebersetzung** (`bbk-babz-2025:D.2.1#primary`, `bbk-babz-2025:D.2.2#primary`, `bbk-babz-2025:D.2.3#primary`, `bbk-babz-2025:D.2.4#primary`, `bbk-babz-2025:D.2.5#primary`, `bbk-babz-2025:D.2.6#primary`, `bbk-babz-2025:D.2.7#primary`)
  Sind die technischen englischen IDs der sieben Ortszeichen fachlich vertretbare Übersetzungen der Ortsbegriffe?
- **Q-D.3-rollenbezeichnungen** (`bbk-babz-2025:D.3.1#primary`, `bbk-babz-2025:D.3.2#primary`, `bbk-babz-2025:D.3.3#primary`, `bbk-babz-2025:D.3.4#primary`, `bbk-babz-2025:D.3.5#primary`, `bbk-babz-2025:D.3.6#primary`, `bbk-babz-2025:D.3.7#primary`, `bbk-babz-2025:D.3.8#primary`, `bbk-babz-2025:D.3.9#primary`, `bbk-babz-2025:D.3.10#primary`, `bbk-babz-2025:D.3.11#primary`, `bbk-babz-2025:D.3.12#primary`, `bbk-babz-2025:D.3.13#primary`)
  Sind die Rollenbezeichnungen hinter den englischen Rollen-IDs fachlich richtig, und tragen AW/ASB/DRK/MHD/JUH als sichtbarer Text die richtige Organisation?
- **Q-D.3-offene-kappen-ohne-rolle** (`bbk-babz-2025:D.3.14#primary`, `bbk-babz-2025:D.3.15#primary`)
  Ist es richtig, dass D.3.14 und D.3.15 keine functionRole erhalten, sondern als direkte offene Kappen ohne erfundene Rolle stehen?
- **Q-D.3.7-zugfuehrer** (`bbk-babz-2025:D.3.7#primary`)
  Bezeichnet D.3.7 mit Personengrundzeichen und Zugstärke fachlich den Zugführer der Feuerwehr — trotz der erweiterten technischen Evidenz weiterhin offen?
- **Q-D.4-verwaltungsrollen** (`bbk-babz-2025:D.4.1#primary`, `bbk-babz-2025:D.4.2#primary`, `bbk-babz-2025:D.4.3#primary`, `bbk-babz-2025:D.4.4#primary`, `bbk-babz-2025:D.4.5#primary`)
  Sind die fünf Verwaltungsrollen hinter den englischen Rollen-IDs fachlich richtig benannt, und ist die Verwaltungszuordnung hinter ST, ME, MG und BuPol korrekt?
  _Die Organisationsfarbe wird nicht als Freigabe der Rollenbezeichnung oder Verwaltungszuordnung ausgegeben._

### Anhang G — 21 offen, 0 approved, 0 deviation

| Manifestschlüssel | Titel | Implementierung | Referenzasset | Evidenz | Fachreview | note | Fragen |
|---|---|---|---|---|---|---|---|
| `bbk-babz-2025:G.1#primary` | Versorgung mit Verbrauchsgütern | `recipe.G.1` | `G.1_Versorgung mit Verbrauchsgütern.svg` | FP, RS | pending |  | Q-G-weiss-und-marken |
| `bbk-babz-2025:G.1.1#primary` | Versorgungstrupp Feuerwehr Materialerhaltung | `recipe.G.1.1` | `G.1.1_Versorgungstrupp Feuerwehr_Materialerhaltung.svg` | FP, RS | pending |  | Q-G-weiss-und-marken |
| `bbk-babz-2025:G.1.2#primary` | Versorgungstrupp DLRG | `recipe.G.1.2` | `G.1.2_Versorgungstrupp DLRG.svg` | FP, RS | pending |  | Q-G-weiss-und-marken |
| `bbk-babz-2025:G.1.3#primary` | Versorgungstrupp Feuerwehr Verbrauchsgüter | `recipe.G.1.3` | `G.1.3_Versorgungstrupp Feuerwehr_Verbrauchsgüter.svg` | FP, RS | pending |  | Q-G-weiss-und-marken |
| `bbk-babz-2025:G.1.4#primary` | Verpflegungszug | `recipe.G.1.4` | `G.1.4_Verpflegungszug.svg` | FP, RS | pending |  | Q-G-weiss-und-marken |
| `bbk-babz-2025:G.1.5#primary` | Instandhaltungsgruppe | `recipe.G.1.5` | `G.1.5_Instandhaltungsgruppe.svg` | GEO, RS | pending |  | Q-G-weiss-und-marken |
| `bbk-babz-2025:G.2#primary` | Versorgung mit Trinkwasser | `recipe.G.2` | `G.2_Versorgung mit Trinkwasser.svg` | FP, RS | pending |  | Q-G-weiss-und-marken |
| `bbk-babz-2025:G.2.1#primary` | Fahrzeug Instandhaltung | `recipe.G.2.1` | `G.2.1_Fahrzeug Instandhaltung.svg` | FP, RS | pending |  | Q-G-weiss-und-marken |
| `bbk-babz-2025:G.2.2#primary` | Anhänger Technik Sicherheit | `recipe.G.2.2` | `G.2.2_Anhänger Technik Sicherheit.svg` | FP, RS | pending |  | Q-G-weiss-und-marken |
| `bbk-babz-2025:G.2.3#primary` | Geräteanhänger Feldkochherd | `recipe.G.2.3` | `G.2.3_Geräteanhänger Feldkochherd.svg` | FP, RS | pending |  | Q-G-weiss-und-marken |
| `bbk-babz-2025:G.3#primary` | Versorgung mit Brauchwasser | `recipe.G.3` | `G.3_Versorgung mit Brauchwasser.svg` | FP, RS | pending |  | Q-G-weiss-und-marken |
| `bbk-babz-2025:G.3.1#primary` | Verpflegungsstelle betrieben durch Feuerwehr | `recipe.G.3.1` | `G.3.1_Verpflegungsstelle_betrieben durch Feuerwehr.svg` | FP, RS | pending |  | Q-G-weiss-und-marken |
| `bbk-babz-2025:G.3.2#primary` | Verpflegungszubereitungsstelle Polizei | `recipe.G.3.2` | `G.3.2_Verpflegungszubereitungsstelle_betrieben durch Polizei.svg` | FP, RS | pending |  | Q-G-weiss-und-marken |
| `bbk-babz-2025:G.3.3#primary` | Versorgungsstelle Hilfsorganisation | `recipe.G.3.3` | `G.3.3_Versorgungsstelle Hilfsorganisation.svg` | FP, RS | pending |  | Q-G-weiss-und-marken |
| `bbk-babz-2025:G.3.4#primary` | Zentrale Stelle Notversorgung | `recipe.G.3.4` | `G.3.4_Zentrale Stelle Notversorgung.svg` | FP, RS | pending |  | Q-G-weiss-und-marken |
| `bbk-babz-2025:G.3.5#primary` | Mobiler Tankpunkt Diesel Bundeswehr | `recipe.G.3.5` | `G.3.5_Mobiler Tankpunkt Diesel_betrieben durch Bundeswehr.svg` | FP, RS | pending |  | Q-G-weiss-und-marken |
| `bbk-babz-2025:G.4#primary` | Versorgung mit Elektrizität | `recipe.G.4` | `G.4_Versorgung mit Elektrizität.svg` | FP, RS | pending |  | Q-G-weiss-und-marken |
| `bbk-babz-2025:G.5#primary` | Versorgung mit Verpflegung | `recipe.G.5` | `G.5_Versorgung mit Verpflegung.svg` | FP, RS | pending |  | Q-G-weiss-und-marken |
| `bbk-babz-2025:G.6#primary` | Zubereiten von Verpflegung | `recipe.G.6` | `G.6_Zubereiten von Verpflegung.svg` | FP, RS | pending |  | Q-G-weiss-und-marken |
| `bbk-babz-2025:G.7#primary` | Instandhaltung | `recipe.G.7` | `G.7_Instandhaltung.svg` | FP, RS | pending |  | Q-G-weiss-und-marken |
| `bbk-babz-2025:G.8#primary` | Entsorgung | `recipe.G.8` | `G.8_Entsorgung.svg` | FP, RS | pending |  | Q-G-weiss-und-marken |

#### Offene Fachfragen zu Anhang G

- **Q-G-weiss-und-marken** (`bbk-babz-2025:G.1#primary`, `bbk-babz-2025:G.1.1#primary`, `bbk-babz-2025:G.1.2#primary`, `bbk-babz-2025:G.1.3#primary`, `bbk-babz-2025:G.1.4#primary`, `bbk-babz-2025:G.1.5#primary`, `bbk-babz-2025:G.2#primary`, `bbk-babz-2025:G.2.1#primary`, `bbk-babz-2025:G.2.2#primary`, `bbk-babz-2025:G.2.3#primary`, `bbk-babz-2025:G.3#primary`, `bbk-babz-2025:G.3.1#primary`, `bbk-babz-2025:G.3.2#primary`, `bbk-babz-2025:G.3.3#primary`, `bbk-babz-2025:G.3.4#primary`, `bbk-babz-2025:G.3.5#primary`, `bbk-babz-2025:G.4#primary`, `bbk-babz-2025:G.5#primary`, `bbk-babz-2025:G.6#primary`, `bbk-babz-2025:G.7#primary`, `bbk-babz-2025:G.8#primary`)
  Sind die weißen Logistikzeichen — einschließlich DLRG — zu Recht hilfsorganisation, was bedeuten die Marken, und wer betreibt die farbigen Kreiszeichen?

### Anhang K — 18 offen, 0 approved, 0 deviation

| Manifestschlüssel | Titel | Implementierung | Referenzasset | Evidenz | Fachreview | note | Fragen |
|---|---|---|---|---|---|---|---|
| `bbk-babz-2025:K.1#primary` | Raum versperrt | `damage.room-blocked` | `K.1_Raum_versperrt.svg` | RS, PG | pending |  |  |
| `bbk-babz-2025:K.2#primary` | Raum angeschlagen | `damage.room-damaged` | `K.2_Raum_angeschlagen.svg` | RS, PG | pending |  |  |
| `bbk-babz-2025:K.3#primary` | Halber Raum angeschlagen | `damage.half-room-damaged` | `K.3_Halber Raum_angeschlagen.svg` | RS, PG | pending |  |  |
| `bbk-babz-2025:K.4#primary` | Raum angeschlagen, Schwalbennest | `damage.room-damaged-swallow-nest` | `K.4_Raum_angeschlagen_Schwalbennest.svg` | RS, PG | pending |  |  |
| `bbk-babz-2025:K.5#primary` | Raum ausgefüllt | `damage.room-filled` | `K.5_Raum_ausgefüllt.svg` | RS, PG | pending |  |  |
| `bbk-babz-2025:K.6#primary` | Raum ausgefüllt, kleinbrockige Trümmer | `damage.room-filled-fine-debris` | `K.6_Raum_ausgefüllt_kleinbrockige Trümmer.svg` | RS, PG | pending |  |  |
| `bbk-babz-2025:K.7#primary` | Raum ausgefüllt, Schichtung | `damage.room-filled-layered` | `K.7_Raum_ausgefüllt_Schichtung.svg` | RS, PG | pending |  |  |
| `bbk-babz-2025:K.8#primary` | Raum ausgefüllt, Wasser | `damage.room-filled-water` | `K.8_Raum_ausgefüllt_Wasser.svg` | RS, PG | pending |  |  |
| `bbk-babz-2025:K.9#primary` | Rutschfläche | `damage.slip-surface` | `K.9_Rutschfläche.svg` | RS, PG | pending |  |  |
| `bbk-babz-2025:K.10#primary` | Schichtung | `damage.layering` | `K.10_Schichtung.svg` | RS, PG | pending |  |  |
| `bbk-babz-2025:K.11#primary` | Randtrümmer | `damage.edge-debris` | `K.11_Randtrümmer.svg` | RS, PG | pending |  |  |
| `bbk-babz-2025:K.12#primary` | Obere Geschosse | `damage.upper-floors` | `K.12_Obere Geschosse.svg` | RS, PG | pending |  |  |
| `bbk-babz-2025:K.13#primary` | Mittlere Geschosse | `damage.middle-floors` | `K.13_Mittlere Geschosse.svg` | RS, PG | pending |  |  |
| `bbk-babz-2025:K.14#primary` | Untere Geschosse | `damage.lower-floors` | `K.14_Untere Geschosse.svg` | RS, PG | pending |  |  |
| `bbk-babz-2025:K.15#primary` | Holzbalkendecke | `damage.timber-beam-ceiling` | `K.15_Holzbalkendecke.svg` | RS, PG | pending |  |  |
| `bbk-babz-2025:K.16#primary` | Trägerdecke | `damage.girder-ceiling` | `K.16_Trägerdecke.svg` | RS, PG | pending |  |  |
| `bbk-babz-2025:K.17#primary` | Vollplattendecke | `damage.solid-slab-ceiling` | `K.17_Vollplattendecke.svg` | RS, PG | pending |  |  |
| `bbk-babz-2025:K.18#primary` | Gewölbedecke | `damage.vaulted-ceiling` | `K.18_Gewölbedecke.svg` | RS, PG | pending |  |  |

### Kapitel 1 — 14 offen, 0 approved, 0 deviation

| Manifestschlüssel | Titel | Implementierung | Referenzasset | Evidenz | Fachreview | note | Fragen |
|---|---|---|---|---|---|---|---|
| `bbk-babz-2025:1.1#primary` | Taktische Formation | `base.formation` | `1.1_Taktische Formation.svg` | FP, RS | pending |  |  |
| `bbk-babz-2025:1.2#primary` | Person | `base.person` | `1.2_Person.svg` | FP, RS | pending |  |  |
| `bbk-babz-2025:1.3#primary` | Landfahrzeug | `base.vehicle-land` | `1.3_Landfahrzeug.svg` | FP, RS | pending |  | Q-1-fahrzeuge-ohne-fahrwerk |
| `bbk-babz-2025:1.4#primary` | Luftfahrzeug | `base.vehicle-air` | `1.4_Luftfahrzeug.svg` | FP, RS | pending |  | Q-1-fahrzeuge-ohne-fahrwerk |
| `bbk-babz-2025:1.5#primary` | Wasserfahrzeug | `base.vehicle-water` | `1.5_Wasserfahrzeug.svg` | FP, RS | pending |  | Q-1-fahrzeuge-ohne-fahrwerk |
| `bbk-babz-2025:1.6#primary` | Funktionsstelle | `base.post` | `1.6_Funktionsstelle.svg` | FP, RS | pending |  |  |
| `bbk-babz-2025:1.7#primary` | Gebäude | `base.building` | `1.7_Gebäude.svg` | FP, RS | pending |  |  |
| `bbk-babz-2025:1.8#primary` | Behälter, Ressource, Raum, Funkgerät | `base.container` | `1.8_Behälter Ressource Raum Funkgerät.svg` | FP, RS | pending |  |  |
| `bbk-babz-2025:1.9#primary` | Gebiet | `base.area` | `1.9_Gebiet.svg` | FP, RS | pending |  |  |
| `bbk-babz-2025:1.10#primary` | Maßnahme | `base.measure` | `1.10_Maßnahme.svg` | FP, RS | pending |  |  |
| `bbk-babz-2025:1.11#primary` | Gefahr | `base.hazard` | `1.11_Gefahr.svg` | FP, RS | pending |  |  |
| `bbk-babz-2025:1.12#primary` | Konkreter Punkt | `base.point` | `1.12_Konkreter Punkt.svg` | FP, RS | pending |  |  |
| `bbk-babz-2025:1.13#primary` | Ereignis | `base.event` | `1.13_Ereignis.svg` | FP, RS | pending |  | Q-1-ereignis-ohne-organisation |
| `bbk-babz-2025:1.14#primary` | Spontanhelfer | `base.spontaneous-helper` | `1.14_Spontanhelfer.svg` | GEO, RS | pending |  |  |

#### Offene Fachfragen zu Kapitel 1

- **Q-1-ereignis-ohne-organisation** (`bbk-babz-2025:1.13#primary`)
  Darf „1.13 Ereignis" fachlich zu Recht als einziges Grundzeichen keine Organisation annehmen?
  _Der Katalog wirft dafür — belegt allein daraus, dass die Referenz den Haken in keinem zusammengesetzten Zeichen führt._
- **Q-1-fahrzeuge-ohne-fahrwerk** (`bbk-babz-2025:1.3#primary`, `bbk-babz-2025:1.4#primary`, `bbk-babz-2025:1.5#primary`)
  Gelten 1.3 bis 1.5 ohne die Fahrwerksmarken aus Kapitel 5.1 als vollständige Zeichen?
  _Die Fahrwerksmarken sind vermessen, aber an den Grundzeichen nicht umgesetzt; `validateSpec` lehnt eine Fahrzeugkategorie an ihnen deshalb ab._

### Anhang M — 14 offen, 0 approved, 0 deviation

| Manifestschlüssel | Titel | Implementierung | Referenzasset | Evidenz | Fachreview | note | Fragen |
|---|---|---|---|---|---|---|---|
| `bbk-babz-2025:M.1#primary` | Ankerpunkt | `wildfire.anchor-point` | `M.1_Ankerpunkt.svg` | RS, PG | pending |  |  |
| `bbk-babz-2025:M.2#primary` | Lookout | `wildfire.lookout` | `M.2_Lookout.svg` | RS, PG | pending |  |  |
| `bbk-babz-2025:M.3#primary` | Safetyzone | `wildfire.safety-zone` | `M.3_Safetyzone.svg` | RS, PG | pending |  |  |
| `bbk-babz-2025:M.4#primary` | Spotfeuer | `wildfire.spot-fire` | `M.4_Spotfeuer.svg` | RS, PG | pending |  |  |
| `bbk-babz-2025:M.5#primary` | Bodenfeuer | `wildfire.ground-fire` | `M.5_Bodenfeuer.svg` | RS, PG | pending |  |  |
| `bbk-babz-2025:M.6#primary` | Akute Gefahr, Spotfeuer | `wildfire.acute-spot-fire` | `M.6_Akute Gefahr_Spotfeuer.svg` | RS, PG | pending |  |  |
| `bbk-babz-2025:M.7#primary` | Moorbrand, Erdfeuer | `wildfire.peat-ground-fire` | `M.7_Moorbrand_Erdfeuer.svg` | RS, PG | pending |  |  |
| `bbk-babz-2025:M.8#primary` | Wipfelfeuer | `wildfire.crown-fire` | `M.8_Wipfelfeuer.svg` | RS, PG | pending |  |  |
| `bbk-babz-2025:M.9#primary` | Brandereignis bergauf | `wildfire.fire-spread-uphill` | `M.9_Brandereignis_bergauf.svg` | RS, PG | pending |  |  |
| `bbk-babz-2025:M.10#primary` | Brandereignis bergab | `wildfire.fire-spread-downhill` | `M.10_Brandereignis_bergab.svg` | RS, PG | pending |  |  |
| `bbk-babz-2025:M.11#primary` | Wasserentnahmestelle | `wildfire.water-extraction-point` | `M.11_Wasserentnahmestelle.svg` | RS, PG | pending |  |  |
| `bbk-babz-2025:M.12#primary` | Maßnahme: Luftgestützte Brandbekämpfung | `wildfire.aerial-firefighting` | `M.12_Maßnahme_Luftgestütze Brandbekämpfung.svg` | RS, PG | pending |  |  |
| `bbk-babz-2025:M.13#primary` | Maßnahme: Löschwasserförderung | `wildfire.water-supply-operation` | `M.13_Maßnahme_Löschwasserförderung.svg` | RS, PG | pending |  |  |
| `bbk-babz-2025:M.14#primary` | Maßnahme: Löschwasserförderung mit Fahrzeugen | `wildfire.water-supply-operation-vehicles` | `M.14_Maßnahme_Löschwasserförderung mit Fahrzeugen.svg` | RS, PG | pending |  |  |

### Anhang L — 10 offen, 0 approved, 0 deviation

| Manifestschlüssel | Titel | Implementierung | Referenzasset | Evidenz | Fachreview | note | Fragen |
|---|---|---|---|---|---|---|---|
| `bbk-babz-2025:L.1#primary` | Drohende Überspülung | `damage.imminent-overflow` | `L.1_Drohende Überspülung.svg` | RS, PG | pending |  |  |
| `bbk-babz-2025:L.2#primary` | Überspülung | `damage.overflow` | `L.2_Überspülung.svg` | RS, PG | pending |  |  |
| `bbk-babz-2025:L.3#primary` | Punktuelle Durchspülung | `damage.local-through-flow` | `L.3_Punktuelle Durchspülung.svg` | RS, PG | pending |  |  |
| `bbk-babz-2025:L.4#primary` | Durchspülung | `damage.through-flow` | `L.4_Durchspülung.svg` | RS, PG | pending |  |  |
| `bbk-babz-2025:L.5#primary` | Punktuelle Unterspülung | `damage.local-undercutting` | `L.5_Punktuelle Unterspülung.svg` | RS, PG | pending |  |  |
| `bbk-babz-2025:L.6#primary` | Unterspülung | `damage.undercutting` | `L.6_Unterspülung.svg` | RS, PG | pending |  |  |
| `bbk-babz-2025:L.7#primary` | Böschungsabrutschung | `damage.slope-slippage` | `L.7_Böschungsabrutschung.svg` | RS, PG | pending |  |  |
| `bbk-babz-2025:L.8#primary` | Schäden am Außendeich | `damage.outer-dyke-damage` | `L.8_Schäden am Außendeich.svg` | RS, PG | pending |  |  |
| `bbk-babz-2025:L.9#primary` | Deichbruch | `damage.dyke-breach` | `L.9_Deichbruch.svg` | RS, PG | pending |  |  |
| `bbk-babz-2025:L.10#primary` | Angabe der Sickerlinie | `damage.seepage-line-marker` | `L.10_Angabe der Sickerlinie.svg` | RS, PG | pending |  |  |

### Anhang N — 9 offen, 0 approved, 0 deviation

| Manifestschlüssel | Titel | Implementierung | Referenzasset | Evidenz | Fachreview | note | Fragen |
|---|---|---|---|---|---|---|---|
| `bbk-babz-2025:N.1.1#primary` | Bergeräumpanzer Bundeswehr | `recipe.N.1.1` | `N.1.1_Bergeräumpanzer_Bundeswehr.svg` | FP, RS | pending |  | Q-N-traegerzuordnung |
| `bbk-babz-2025:N.1.2#primary` | Transportfahrzeug kommunaler Bauhof, geländegängig | `recipe.N.1.2` | `N.1.2_Transportfahrzeug_kommunaler Bauhof_geländegängig.svg` | FP, RS | pending |  | Q-N-traegerzuordnung |
| `bbk-babz-2025:N.1.3#primary` | Einsatzfahrzeug Bundespolizei | `recipe.N.1.3` | `N.1.3_Einsatzfahrzeug_Bundespolizei.svg` | FP, RS | pending |  | Q-N-traegerzuordnung |
| `bbk-babz-2025:N.1.4#primary` | Drehflügler Bundeswehr CH-53, Außentraglast 7 t | `recipe.N.1.4` | `N.1.4_Drehflügler_Bundeswehr_CH-53_Außentraglast 7t.svg` | FP, RS | pending |  | Q-N-traegerzuordnung |
| `bbk-babz-2025:N.1.5#primary` | Löschflugzeug Beauftragter Dritter, 5.000 l | `recipe.N.1.5` | `N.1.5_Löschflugzeug_Beauftragter Dritter_5.000l.svg` | FP, RS | pending |  | Q-N-traegerzuordnung |
| `bbk-babz-2025:N.1.6#primary` | Erkundungsflugzeug Feuerwehr Cessna 172 | `recipe.N.1.6` | `N.1.6_Erkundungsflugzeug_Feuerwehr_Cessna 172.svg` | FP, RS | pending |  | Q-N-traegerzuordnung |
| `bbk-babz-2025:N.2.1#primary` | Sammelraum Spontanhelfer | `recipe.N.2.1` | `N.2.1_Sammelraum_Spontanhelfer.svg` | FP, RS | pending |  | Q-N.2-marken |
| `bbk-babz-2025:N.2.2#primary` | Kontaktstelle Spontanhelfer | `recipe.N.2.2` | `N.2.2_Kontaktstelle_Spontanhelfer.svg` | FP, RS | pending |  | Q-N.2-marken |
| `bbk-babz-2025:N.2.3#primary` | Notfallinformationspunkt | `recipe.N.2.3` | `N.2.3_Notfallinformationspunkt.svg` | FP, RS | pending |  | Q-N.2-marken |

#### Offene Fachfragen zu Anhang N

- **Q-N-traegerzuordnung** (`bbk-babz-2025:N.1.1#primary`, `bbk-babz-2025:N.1.2#primary`, `bbk-babz-2025:N.1.3#primary`, `bbk-babz-2025:N.1.4#primary`, `bbk-babz-2025:N.1.5#primary`, `bbk-babz-2025:N.1.6#primary`)
  Gehören kommunaler Bauhof und Beauftragter Dritter zur sonstigen Gefahrenabwehr, ist die Bundespolizei zu Recht eine getrennte Organisation, und stimmen die Bundeswehr-/Feuerwehr-/ZIV-Zuordnungen?
  _„Geländegängig" aus dem Dateinamen von N.1.2 ist ausdrücklich keine neue Katalogsemantik._
- **Q-N.2-marken** (`bbk-babz-2025:N.2.1#primary`, `bbk-babz-2025:N.2.2#primary`, `bbk-babz-2025:N.2.3#primary`)
  Welche Einsatzbedeutung haben die drei N.2-Marken?

### Kapitel 2 — 8 offen, 0 approved, 0 deviation

| Manifestschlüssel | Titel | Implementierung | Referenzasset | Evidenz | Fachreview | note | Fragen |
|---|---|---|---|---|---|---|---|
| `bbk-babz-2025:2.1#primary` | Feuerwehr | `organization.feuerwehr` | `2.1_Feuerwehr.svg` | FARBE | pending |  |  |
| `bbk-babz-2025:2.3#primary` | Technisches Hilfswerk | `organization.thw` | `2.3_Technisches Hilfswerk.svg` | FARBE | pending |  |  |
| `bbk-babz-2025:2.4#primary` | Führung Leitung | `organization.fuehrung-leitung` | `2.4_Führung Leitung.svg` | FARBE | pending |  |  |
| `bbk-babz-2025:2.5#primary` | Polizei | `organization.polizei` | `2.5_Polizei.svg` | FARBE | pending |  |  |
| `bbk-babz-2025:2.6#primary` | Bundeswehr | `organization.bundeswehr` | `2.6_Bundeswehr.svg` | FARBE | pending |  |  |
| `bbk-babz-2025:2.7#primary` | Sonstige Gefahrenabwehr | `organization.sonstige-gefahrenabwehr` | `2.7_Sonstige Gefahrenabwehr.svg` | FARBE | pending |  |  |
| `bbk-babz-2025:2.8#primary` | Zivile Einheiten | `organization.zivile-einheiten` | `2.8_Zivile Einheiten.svg` | FARBE | pending |  |  |
| `bbk-babz-2025:2.2#primary` | Hilfsorganisation | `organization.hilfsorganisation` | `2.2_Organisationen.svg` | FARBE | pending |  | Q-2-hiorg-aus-raster, Q-2-hiorg-farbe-neutral |

#### Offene Fachfragen zu Kapitel 2

- **Q-2-hiorg-aus-raster** (`bbk-babz-2025:2.2#primary`)
  Ist die Zuordnung „HiOrg = Hilfsorganisation" fachlich richtig — sie ist aus dem gerasterten Bild abgelesen, nicht aus dem Dateinamen?
  _Der Dateiname ist generisch („Organisationen") und hatte die Zuordnung bisher verdeckt._
- **Q-2-hiorg-farbe-neutral** (`bbk-babz-2025:2.2#primary`)
  Bleibt eine Organisation, deren Farbe mit der neutralen Grundfüllung zusammenfällt, im Einsatz verwechslungsfrei?

### Anhang C — 3 offen, 0 approved, 0 deviation

| Manifestschlüssel | Titel | Implementierung | Referenzasset | Evidenz | Fachreview | note | Fragen |
|---|---|---|---|---|---|---|---|
| `bbk-babz-2025:C.1.1#primary` | Löschstaffel | `recipe.C.1.1` | `C.1.1_Löschstaffel.svg` | FP, RS | pending |  |  |
| `bbk-babz-2025:C.1.2#primary` | Löschgruppe | `recipe.C.1.2` | `C.1.2_Löschgruppe.svg` | FP, RS | pending |  |  |
| `bbk-babz-2025:C.1.3#primary` | Löschzug einer Feuerwehr | `recipe.C.1.3` | `C.1.3_Löschzug einer Feuerwehr.svg` | FP, RS | pending |  |  |

### Anhang H — 3 offen, 0 approved, 0 deviation

| Manifestschlüssel | Titel | Implementierung | Referenzasset | Evidenz | Fachreview | note | Fragen |
|---|---|---|---|---|---|---|---|
| `bbk-babz-2025:H.1#primary` | Veterinärzug | `recipe.H.1` | `H.1_Veterinärzug.svg` | FP, RS | pending |  |  |
| `bbk-babz-2025:H.2#primary` | Tier-Dekontaminationsgruppe | `recipe.H.2` | `H.2_Tier-Dekontaminationsgruppe.svg` | FP, RS | pending |  |  |
| `bbk-babz-2025:H.3#primary` | Schlacht- und Untersuchungsgruppe | `recipe.H.3` | `H.3_Schlacht- und Untersuchungsgruppe.svg` | FP, RS | pending |  |  |

## Quellenreviews

| Quelle | Titel | Art | Fachreview | note |
|---|---|---|---|---|
| `bbk-babz-2025` | Taktische Zeichen im Bevölkerungsschutz — Empfehlungen zur Einführung einer FwDV 102/DV 102 | baseline | pending |  |
| `babz-svg-2025` | Freigestellte SVG-Grafikdateien der enthaltenen Zeichen | reference-assets | pending |  |
| `babz-hinweise-2024` | Begleitende Hinweise zur Überarbeitung vom 12.02.2024 | guidance | pending |  |
| `skk-2010` | DLRG DV 102 — Taktische Zeichen im Bevölkerungsschutz, 1. Auflage 2011 (SKK-Empfehlungen 2010) | legacy | pending |  |
| `fwdv-100` | FwDV 100 — Führung und Leitung im Einsatz | operational-rule | pending |  |
| `fwdv-800` | FwDV/DV 800 — Informations- und Kommunikationstechnik im Einsatz | operational-rule | pending |  |
| `thw-einheiten` | THW: Einheiten — Einzelblätter | operational-rule | pending |  |
| `phjardas-tz` | phjardas/taktische-zeichen — JavaScript-Generator nach DV 102 | open-source-corpus | pending |  |
| `din-14033` | DIN 14033:2017-04 — Kurzzeichen für die Feuerwehr | standard | pending |  |
| `din-13050` | DIN 13050:2021-10 — Begriffe im Rettungswesen | standard | pending |  |
| `din-14034-6` | DIN 14034-6:2024-06 — Graphische Symbole für bauliche Einrichtungen im Feuerwehrwesen | standard | pending |  |
| `din-14095` | DIN 14095:2025-07 — Feuerwehrpläne für bauliche Anlagen | standard | pending |  |
| `arimo-ofl` | Arimo (Variable Font) | typeface | pending |  |

## Profilreviews

| Profil | Titel | Version | Fachreview | note |
|---|---|---|---|---|
| `bund` | Bundesweiter Kern | 0.2.0 | pending |  |
