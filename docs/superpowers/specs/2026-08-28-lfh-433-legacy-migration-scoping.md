# LFH-433 — Legacy-Migration `skk-2010`: Scoping

> Scoping-Dokument · 28. August 2026 · LFH-433, Parent LFH-406 (Governance)
>
> Status: zur Entscheidung. Kein Implementierungsplan, kein Code. Das Dokument macht den Slice
> entscheidungsreif: Was steht in der Quelle, wie groß ist das Delta zur Baseline, welches Modell
> trägt es, was kostet es, und ob es vor 1.0 gehört.

## 1. Auftrag und Maßstab

`Vision.md` verlangt in Kriterium 7, dass „Legacy-Zeichen aus der SKK-/DV-102-Systematik von
2010/2011 über Migrationsregeln auffindbar bleiben", und als Erfolgskriterium: **„Legacy-Bezeichner
liefern entweder eine eindeutige Migration oder eine begründete Mehrdeutigkeit."** Die Quelle
`skk-2010` ist seit Slice 2 in `packages/catalog/src/sources.ts` registriert (`kind: 'legacy'`,
`acquisition: 'public-url'`, `licence.status: 'unclear'`), wird aber von keinem Katalogeintrag
referenziert. `SourceStatus 'legacy'` (`packages/schema/src/provenance.ts`) und
`CatalogEntry.legacyIds?` existieren als Typ ohne Konsumenten — die Entscheidungsnotiz vom
5. August 2026 hält fest: „Typ existiert, kein Inhalt, kein Konsument, keine Auflösungsfunktion,
keine Modellierung der begründeten Mehrdeutigkeit."

Der Maßstab dieses Dokuments ist deshalb nicht „wie viele Legacy-Zeichen gibt es", sondern: **Ist
für jeden Legacy-Bezeichner maschinell prüfbar, ob er genau eine Migration oder eine begründete
Mehrdeutigkeit hat?** Alles Weitere (Differenzdarstellung, Geometrie von 2010) ist ausdrücklich
nicht Teil des Auftrags.

## 2. Quellensichtung

### 2.1 Zugänglichkeit

| Fundstelle | Ergebnis am 2026-08-28 |
|---|---|
| URL aus `sources.ts` (`…/Einsatz_und_Medizin/kats/Download_Dateien/Formulare_E008/DV102_TaktischeZeichen_DLRG110826.pdf`) | **HTTP 404**, 273 Byte HTML-Fehlerseite |
| `https://www.dlrg.de/fileadmin/user_upload/DLRG.de/Fuer-Mitglieder/Einsatz/Gefahrenabwehr/DV102_TaktischeZeichen_DLRG110826.pdf` (Suchtreffer, gleicher Dateiname) | **HTTP 404** |
| `https://rlp.dlrg.de/fileadmin/groups/10000000/Ressort_Einsatz/Dateien/DV102_DLRG_Taktische_Zeichen.pdf` (Landesverband Rheinland-Pfalz) | **HTTP 200**, 1.535.399 Byte, PDF 1.3, **63 Seiten**, InDesign CS5, erstellt 2011-04-28 |
| `https://wiki.einsatzleiterwiki.de/lib/exe/fetch.php?rev=1302165454&media=allgemein:empfehl_takt_zeichen_im_bevsch.pdf` (SKK-Empfehlungen 2010, 2. Auflage, ohne DLRG-Anhang) | **HTTP 200**, 1.432.976 Byte, PDF 1.6, **56 Seiten**, erstellt 2010-10-23 |

Beide erreichbaren Dateien liegen im Scratchpad dieses Laufs, nicht im Repository. Die in
`sources.ts` hinterlegte Bezugsadresse ist tot; **das Quellenregister braucht eine neue URL**
(Empfehlung: die RLP-Adresse als `url`, die SKK-Fassung als zweite Fundstelle in `licence.note`).
Die Registrierung trägt heute `SOURCE_TECHNICAL_REVIEW` mit „Bezugsadresse gegen die Quelle
geprüft" vom 2026-08-05 — die Aussage stimmt nicht mehr und muss beim Umzug erneuert werden. Das
in der Provenienz-Spec erwähnte ältere BABZ-Lernangebot wurde nicht gebraucht.

### 2.2 Was die Quelle ist

Impressum (S. 2): „DLRG DV 102 Taktische Zeichen im Bevölkerungsschutz, 1. Auflage 2011, Stand
01.06.2011. Stand der Empfehlungen für Taktische Zeichen im Bevölkerungsschutz der SKK September
2010, zweite Auflage." Vorwort (S. 9): Die SKK-Empfehlungen wurden „inhaltlich vollständig
übernommen. Lediglich einige Fehler wurden korrigiert. Zusätzlich wurde ein DLRG spezifischer
Anhang angefügt." Die Grafik wurde vom BBK finanziert; die SKK löste sich im Januar 2011 auf.

Das heißt für das Register: `skk-2010` ist faktisch **zwei Dokumente in einem** — die
organisationsübergreifende SKK-Systematik (Kapitel I–II, 1–10, Kurzbezeichnungen) und ein
DLRG-Profilanhang (Kapitel 11). Für die Migration zählt die SKK-Systematik; Kapitel 11 ist
Profilmaterial und gehört fachlich zu Anhang I der Baseline (Wasserrettung).

### 2.3 Inventar der Systematik (Kapitel II, 1–9)

Nummerierung und Titel sind aus dem PDF übernommen (Text, keine Grafik). Die Spalte „Anzahl"
zählt nummerierte Zeichen; Regeln ohne Zeichen stehen gesondert.

| Kapitel | Inhalt | Anzahl |
|---|---|---|
| 1 Grundzeichen | 1.1 Taktische Formation · 1.2 Befehlsstelle/Führungsstelle · 1.3 Stelle, Einrichtung · 1.4 Person · 1.5 Gebiet, Fläche · 1.6 Flächenbrand (rot) · 1.7 Überschwemmtes Gebiet (blau) · 1.8 Dürregebiet (braun) · 1.9 Ausfall der Versorgung (magenta) · 1.10 Sonstige großflächige Schadensgebiete (orange) · 1.11 Kontaminiertes Gebiet (gelb) · 1.12 drohende Gefahr · 1.13 akute Gefahr · 1.14 noch/ehemals betroffenes Gebiet · 1.15 KatS-Alarm · 1.16 Maßnahme · 1.17 Anlass, Ereignis · 1.18 Gefahr · 1.19 ortsgebunden, ortsfest · 1.20 Gebäude | 20 |
| 2 Organisationsfarben | 2.1 Feuerwehr rot · 2.2 THW blau · 2.3 Hilfsorganisationen weiß · 2.4 Einrichtungen der Führung gelb · 2.5 Polizei, Bundespolizei, Zoll grün · 2.6 Sonstige Einrichtungen der Gefahrenabwehr orange · 2.7 Bundeswehr braun | 7 |
| 3 Fachaufgaben | 3.1 Brandschutz/TH/Gefahrstoffe: 3.1.1–3.1.21 (Brandbekämpfung, Retten aus Höhen und Tiefen, Wasserversorgung/-förderung, Technische Hilfeleistung, Heben von Lasten, Bergen, Räumen, Kampfmittelräumung, Sprengen, Transport, Beleuchtung, Einsatz von Luftfahrzeugen, Einsatz von Wasserfahrzeugen, Rettungshunde, Wasserrettung, Pumpen, Wassergefahren/Deichverteidigung, ABC/CBRN-Schutz, Messen/Spüren, Dekontamination, Ölschaden) · 3.2 Rettungs-/Sanitäts-/Gesundheitswesen: 3.2.1–3.2.2 · 3.3 Betreuung: 3.3.1–3.3.2 · 3.4 Versorgung/Logistik: 3.4.1–3.4.7 · 3.5 Veterinär: 3.5.1–3.5.2 · 3.6 Führung: 3.6.1 Führung/Leitung/Stab, 3.6.2 IuK, 3.6.3 Erkundung, 3.6.4 Warnen | 38 |
| 4 Größenordnung | 4.1 Taktische Einheiten: Trupp, Staffel, Gruppe, Zug, Zugtrupp · 4.2 Verbände: Bereitschaft (I), Abteilung (II), Großverband (III) · 4.3 Verwaltungsstufen: Gemeinde, Kreis, Bezirk, Land, Bund, EU (Sternchen) | 14 |
| 4 Regeln | 4.4 Identifizierung (Ziffernfolge Verband-Zug-Gruppe-Trupp, Kfz-Kennzeichen) · 4.5.1 Mannschaftsstärke (vier Zahlen mit Schrägstrich, Gesamtstärke unterstrichen) · 4.5.2 Zeitangabe (DTG-Format `040835jun10`) | 3 Regeln |
| 5 Personen mit Funktion | 5.1.1 Zeichen der Führungskraft (Person + Stärkemarke + Organisationsfarbe) · 5.1.2–5.1.5 Beispiele Trupp-/Gruppen-/Zug-/Bereitschaftsführer · 5.2.1 Person mit Sonderfunktion (Fachberater) | 6 |
| 6 Gegenstände | 6.1 Landfahrzeuge: 6.1.1–6.1.13 (Fahrzeug, Kfz, Kfz geländegängig, Wechsellader, Abrollbehälter, Anhänger, Schienen-, Kettenfahrzeug, Kraftrad, Fahrrad, Räumgerät, Hebegerät, Bagger) · 6.2.1 Wasserfahrzeug · 6.3.1 Flugzeug, 6.3.2 Hubschrauber · 6.4 Sonstige: 6.4.1–6.4.11 (Sirene, Lautsprecher, Sprengmittel/Blindgänger, Trinkwasser, Brauchwasser, Betriebsstoffe, Verpflegung, Unterkunft, Zelt, Geräte, Brücke) | 27 |
| 7 Richtung/Tendenz | 7.1 Richtung des Vortragens · 7.2 gerichtete Bewegung · 7.3 Ausgangspunkt · 7.4 Endpunkt · 7.5 Bewegung in zwei Richtungen · 7.6 Sammeln · 7.7–7.9 Tendenz steigend/unverändert/fallend · 7.10–7.13 Aktivität/Ausfall 25/50/75/100 % | 13 |
| 8 IuK | 8.1 Bildübertragung · 8.2 Datenübertragung · 8.3 Fax · 8.4 Fernsprechen · 8.5 Fernschreiben · 8.6 Festbild · 8.7 Relaisfunk · 8.8 Richtbetrieb · 8.9 Kabelbau · 8.10 Digitaler Sprechfunk · 8.11 HRT · 8.12 MRT · 8.13 FRT · 8.14 DMO · 8.15 TMO (je „über Draht"/„über Funk") | 15 |
| 9 Sonstige | 9.1 Hinweis auf Vermutung (?) · 9.2 Hinweis auf akute Situation (!) | 2 |
| **Systematik gesamt** | | **142 Zeichen + 3 Regeln** |

Daneben enthält die Quelle:

| Teil | Inhalt | Anzahl |
|---|---|---|
| 10 Kombinationsbeispiele | 10.1 Brandschutz (15) · 10.2 THW: Züge, Gruppen, Trupps, Fahrzeuge, Anhänger, Wasserfahrzeuge, Befehlsstellen (7 × 10) · 10.3 Rettung/Sanität/Betreuung/Wasserrettung (31) · 10.4 Veterinär (3) · 10.5 Versorgung (3) · 10.6.1 Führungseinrichtungen (17) · 10.6.2 Führungskräfte (19 + 6 „Sonstige") · 10.6.3 Grenzen (4) · 10.7 IuK-Einheiten (3) · 10.8 Maßnahmen (6) · 10.9 Gefahren-/Schadendarstellung (28) | 205 |
| 11 DLRG-spezifisch | 11.1 Wasserrettungseinheiten (4) · 11.2 spezifische Einheiten (22) · 11.3 Führungseinheiten (5) · 11.4 Einrichtungen (3) · 11.5 Führungskräfte (5) · 11.6 Boote (3) · 11.7 Fahrzeuge/Anhänger (3) | 45 |
| Kurzbezeichnungen | Organisationen (29) · Fachaufgaben (24) · THW-Fachaufgaben (16) · Größenordnung (13) · Personen (15) · Fahrzeuge allgemein (4) · DIN 14033 Beispiele (9) · Rettungsdienst-Fahrzeuge (6) | 116 |

Struktureller Befund: Die Systematik von 2010 hat **kein Kapitel für Kopf-/Fußzonen, keine
Fahrzeugkategorien (5.1), keine Zustände als eigenes Kapitel (5.8), keine Anhänge**. Was 2025 in
Kapitel 5 und den Anhängen C–N steht, ist 2010 entweder Grundzeichenvariante (farbige Flächen
1.6–1.11), Gegenstand (Kapitel 6) oder Kombinationsbeispiel (Kapitel 10). Das ist der eigentliche
Grund für Mehrdeutigkeit: nicht geänderte Bilder, sondern **verschobene Kategorien**.

## 3. Delta zur Baseline `bbk-babz-2025`

### 3.1 Vorgehen

Jeder Legacy-Bezeichner der Systematik (142) wurde gegen die Katalog-IDs geprüft:
`BASE_SYMBOLS` (Kapitel 1, `base.<kind>`), `ORGANIZATION_COLORS` (Kapitel 2, `OrganizationId`),
`ALL_PICTOGRAMS` (Kapitel 4 `capability.*`, 5.8 Zustände, Anhänge D, I.5, J, K, L, M),
`StrengthId` (5.4), `VehicleCategoryId` (5.1), `ADMINISTRATIVE_HEADS` (5.7), `FUNCTION_ROLE_IDS`
(D.3) und die Rezeptschlüssel der Anhänge C–N. Wo die Baseline eine Referenzdatei kennt, die noch
nicht im beanspruchten Umfang liegt (Kapitel 3, 5.2, 5.5), zählt das Ziel als **eindeutig, aber
noch nicht umgesetzt** — die Migration ist dann eine Aussage über eine Abschnittsnummer, nicht über
einen Katalogeintrag. Diese Fälle sind markiert.

Drei Klassen nach Vision:

- **A — eindeutig migrierbar (1:1).** Genau ein Zielbezeichner; die Bedeutung ist dieselbe oder
  eine dokumentierte Verengung/Erweiterung ohne Wahlmöglichkeit.
- **B — mehrdeutig mit Begründung (1:n oder geänderte Semantik).** Mehrere Ziele, oder der
  Kategoriewechsel verlangt eine Entscheidung des Anwenders.
- **C — ohne Nachfolger.** Die Baseline kennt weder Zeichen noch Regel dafür.

### 3.2 Zählung

| Kapitel | Zeichen | A eindeutig | B mehrdeutig | C ohne Nachfolger |
|---|---|---|---|---|
| 1 Grundzeichen | 20 | 12 | 1 | 7 |
| 2 Farben | 7 | 6 | 1 | 0 |
| 3 Fachaufgaben | 38 | 28 | 8 | 2 |
| 4 Größenordnung | 14 | 13 | 1 | 0 |
| 5 Personen | 6 | 6 | 0 | 0 |
| 6 Gegenstände | 27 | 16 | 10 | 1 |
| 7 Richtung/Tendenz | 13 | 13 | 0 | 0 |
| 8 IuK | 15 | 9 | 2 | 4 |
| 9 Sonstige | 2 | 2 | 0 | 0 |
| **Summe** | **142** | **105 (74 %)** | **23 (16 %)** | **14 (10 %)** |

Von den 105 eindeutigen Zielen liegen **10 außerhalb des heute beanspruchten Umfangs** (Kapitel 3:
6.1.9 Kraftrad → 3.8, 6.1.10 Fahrrad → 3.7, 5.2.1 Sonderfunktion → 3.2; Kapitel 5.2: 7.1–7.6 →
5.2.1–5.2.6; Kapitel 5.5: 4.2.1–4.2.3 → 5.5.1–5.5.3). Der Vollständigkeitstest (Abschnitt 4.3)
muss diese Fälle als „Ziel registriert, Eintrag fehlt" tragen können, sonst blockiert die
Legacy-Migration den Katalogausbau oder umgekehrt.

Die Zählung ist eine **Erstsichtung durch einen Agenten am Text der Quelle**, ohne die
Zeichnungen. Sie ist gut genug für Aufwand und Modell, nicht für das Register selbst: jede
Zuordnung braucht im Slice den Blick auf beide Bilder (Arbeitspaket 2).

### 3.3 Beispiele je Klasse

**A — eindeutig.**

| Legacy | Ziel | Anmerkung |
|---|---|---|
| 1.1 Taktische Formation | `base.formation` (1.1) | identisch |
| 1.4 Person | `base.person` (1.2) | Nummer wandert |
| 1.3 Stelle, Einrichtung | `base.post` (1.6 Funktionsstelle) | Umbenennung |
| 1.2 Befehlsstelle | Rezept `D.1.1` `command-post-in-operation` | Grundzeichen → Anhangsrezept; Ziel ist ein anderer Objekttyp, aber genau eines |
| 1.12 / 9.1 drohende Gefahr, Vermutung | `5.8.1.13` `suspected-situation` | zwei Legacy-Bezeichner auf ein Ziel (n:1 ist für den Legacy-Bezeichner eindeutig) |
| 1.7 Überschwemmtes Gebiet | `5.8.1.5` `flooded-area` | Farbfläche → Zustand |
| 2.3 Hilfsorganisationen weiß | `hilfsorganisation` | seit LFH-424 belegt |
| 3.1.19 Messen, Spüren | `capability.cbrn-detection` (4.1.2) | |
| 3.1.14 Rettungshunde | `capability.biological-location` (4.4.2) | Bedeutung 2025 weiter gefasst („biologisch orten"); Verengung dokumentieren |
| 3.6.2 IuK | `capability.information-communications` (4.9.1) | |
| 4.1.1–4.1.4 Trupp…Zug | `StrengthId` (5.4) | |
| 4.3.1–4.3.6 Verwaltungsstufen | `ADMINISTRATIVE_HEADS` (5.7.1–5.7.6) | |
| 6.1.4 Wechselladerfahrzeug | Rezept `E.2.15` (`swap-loader-vehicle`) | |
| 6.4.3 Sprengmittel, Blindgänger | `5.8.1.12` `explosive-ordnance-hazard` | Gegenstand → Gefahrzustand |
| 7.7–7.13 Tendenz, Aktivität | `5.8.3.*`, `5.8.2.*` | Titel wörtlich identisch |
| 8.11–8.15 HRT, MRT, FRT, DMO, TMO | `J.3.6–J.3.8`, `J.1.3`, `J.1.4` | |

**B — mehrdeutig mit Begründung.**

| Legacy | Kandidaten | Begründung |
|---|---|---|
| 2.5 Polizei, Bundespolizei, Zoll (grün) | `polizei` (grün), `bundespolizei` (hellgrün, N.1.3) | 2025 trennt die Bundespolizei farblich; Zoll hat kein Ziel |
| 3.1.2 Retten aus Höhen und Tiefen | `4.5.2` tragbare Leitern, `4.5.3` Drehleiter, `4.5.4` Gelenkmast, `4.5.7` Spezielle Rettung aus Höhen und Tiefen | 2025 differenziert nach Gerät |
| 3.1.5 Heben von Lasten | `4.7.8` Gabelstapler, `4.7.9` Kran, `4.7.10` Lasten/Personen, `4.7.11` Heben/Räumen | 1:n |
| 3.1.7 Räumen | `4.7.11`, `4.7.15` Räumarbeiten mit Maschine | 1:n |
| 3.2.1 Rettungs-, Sanitäts-, Gesundheitswesen | `4.6.1` Sanität, `4.6.2` Pflege, `4.6.3` Rettungswesen/Intensivmedizin | ein Sammelbegriff, drei Fähigkeiten |
| 3.3.2 Unterbringung | `4.2.4` Ruhen, `4.2.5` Sitzen, F.3 Unterkunft (`reduced-house`) | Fähigkeit oder Einrichtung |
| 3.4.5 / 6.4.5 Brauchwasser | `capability.service-water` (4.3.2 Löschwasser/Brauchwasser), Rezept `G.3` Versorgung mit Brauchwasser | Löschmittel oder Versorgungsgut |
| 3.6.1 Führung, Leitung, Stab | Organisationsfarbe `fuehrung-leitung`, `D.1.1`, `3.1` Fähigkeiten Einsatzführung | 2010 Fähigkeitssymbol, 2025 Farbe bzw. Anhang |
| 3.6.4 Warnen | `4.7.23` optisch, `4.7.24` Lautsprecher, `4.7.25` Sirene | 1:n |
| 4.1.5 Zugtrupp | Rezepte `D.1.9`, `E.1.19`, `E.1.24`, `I.1.5` | kein generischer Stärkegrad, nur fachdienstgebundene Rezepte |
| 6.1.2 / 6.1.3 Kraftfahrzeug (geländegängig) | `kfz-kategorie-1/2/3` (5.1.1) | 2025 kategorisiert nach Gewicht/Achsen, 2010 nach Gelände |
| 6.1.5 Abrollbehälter, Container | `base.container` (1.8), `capability.container-resource` (4.8.1) | Grundzeichen oder Fähigkeit |
| 6.3.2 Hubschrauber | `base.vehicle-air` (1.4), F.2-Luftfahrzeugrezepte | 2025 kennt kein eigenes Hubschrauber-Grundzeichen |
| 1.19 ortsgebunden, ortsfest | `base.building` (1.7), `3.9` temporär ortsfeste Strukturen | Dauer der Ortsbindung ist neu unterschieden |
| 8.7 Relaisfunkbetrieb | `J.1.7` DMO-Repeater, `J.3.5` Repeater | Verbindung oder Gerät |

**C — ohne Nachfolger.**

| Legacy | Befund |
|---|---|
| 1.6, 1.8–1.11 farbige Flächen (Flächenbrand, Dürre, Versorgungsausfall, sonstige Schadensgebiete, Kontamination) | 2025 belegt keine Farbflächenkonvention für Gebiete; nur 1.7 hat mit `5.8.1.5` ein Ziel. Komposition `base.area` + Zustandspiktogramm ist ein Vorschlag, keine Migration |
| 1.14 noch/ehemals betroffenes Gebiet, 1.15 KatS-Alarm | kein Zeichen, keine Regel |
| 3.1.12 Einsatz von Luftfahrzeugen | keine Fähigkeit; 2025 drückt das über das Grundzeichen 1.4 aus (`M.12` ist Waldbrand-spezifisch) |
| 3.4.1 Versorgung, Logistik (generisch) | Kapitel 4.8 hat nur Einzelgüter; `3.3` Fähigkeiten Versorgung/Entsorgung/Logistik ist ein Übersichtsblatt, kein Zeichen |
| 6.4.10 Geräte | kein Ziel |
| 8.1, 8.3, 8.5, 8.6 Bild-, Fax-, Fernschreib-, Festbildübertragung | Anhang J kennt Sprache, Daten, SDS, Satellit, Richtfunk — die analogen Dienste sind entfallen |

### 3.4 Die übrigen Teile der Quelle

- **Kapitel 10 (205 Beispiele)** sind Kompositionen, keine Bezeichner der Systematik. Eine
  Stichprobe am Text: 10.6.2.1–10.6.2.19 und 10.6.2.1.1–10.6.2.1.6 (Führungskräfte) entsprechen
  nahezu eins zu eins den 19 `FUNCTION_ROLE_IDS` aus D.3; 10.1.1 Löschzug → `C.1.3`; 10.1.4
  ABC-Erkundungsgruppe → `C.1.9`; 10.1.7 ATF → `C.1.12`; 10.3.19–10.3.21 DLRG → Anhang I; 10.9
  Personen-/Schadendarstellung → 5.8.4, 5.8.5, 5.8.8. THW (10.2, 70 Zeichen) ist 2025 Anhang E,
  aber mit anderer Einheitenstruktur (Bergungsgruppe 1/2 gibt es nicht mehr) — dort ist der
  Anteil „ohne Nachfolger" deutlich höher als in der Systematik. Grobe Erwartung: 55–65 % A,
  15–20 % B, 20–25 % C; eine belastbare Zahl liefert erst Arbeitspaket 2.
- **Kapitel 11 (45 DLRG-Zeichen)** deckt sich strukturell mit Anhang I (I.1 Einheiten 20, I.2
  Boote 7, I.3 Wasserfahrzeuge 11, I.4 Fahrzeuge 3, I.5 Personen 8): 11.1.1–11.1.4 → I.1,
  11.5.1–11.5.5 → I.5.4–I.5.8, 11.6.x → I.2/I.3. Das ist **Profilmaterial**, kein Kernbestand,
  und gehört nach dem Profilmodell der Provenienz-Spec an das künftige DLRG-Profil, nicht an
  `bund`.
- **Kurzbezeichnungen (116)** sind Text. Die Größenordnungs- und Personenkürzel (Tr, Gr, Z, ZFü,
  LNA, OrgL…) tauchen 2025 in Fußzonen und Innenlabels wieder auf; sie sind Kandidaten für
  `synonyms`, nicht für `legacyIds`. DIN-14033-Kürzel sind Fremdnorm und bleiben außen vor
  (`din-14033` ist `not-acquired`).

## 4. Datenmodell-Vorschlag

### 4.1 Grundentscheidung: ein Register, nicht Felder am Eintrag

`CatalogEntry.legacyIds?: readonly string[]` ist die falsche Form. Sie kann nur 1:1 und n:1
ausdrücken, nicht 1:n, nicht „ohne Nachfolger", nicht die Begründung — und sie hängt am
Katalogeintrag, während zehn eindeutige Ziele heute keinen Eintrag haben. Vorschlag: **ein
eigenständiges Migrationsregister** im Katalog, geschlüsselt nach Legacy-Bezeichner, nach dem
Muster des Quellenregisters (`SOURCE_REGISTRY`, `satisfies Record<…>`) und des Review-Ledgers
(`MANIFEST_DOMAIN_REVIEWS`, ein Objekt je Schlüssel, Vollständigkeit in beide Richtungen getestet).
`legacyIds` wird entweder entfernt oder als abgeleitete Sicht (Rückwärtsindex) aus dem Register
berechnet — nicht doppelt gepflegt.

Schema (`packages/schema/src/legacy.ts`, neu; Skizze):

```ts
/** `skk-2010:3.1.19` — Quelle plus Abschnittsnummer der Quelle, wie im Coverage-Manifest. */
type LegacyId = `skk-2010:${string}`;

/** Wohin ein Legacy-Bezeichner zeigt. Genau die drei Objektarten, die das Projekt kennt. */
type MigrationTarget =
  | { kind: 'catalog-entry'; id: string }            // base.person, capability.cbrn-detection
  | { kind: 'recipe'; key: string }                   // 'D.1.1', 'E.2.15'
  | { kind: 'element'; element: 'organization' | 'strength' | 'vehicle-category'
      | 'administrative-level' | 'function-role'; id: string }
  | { kind: 'section-only'; section: string };        // Ziel belegt, Eintrag fehlt noch

interface LegacyMigration {
  legacyId: LegacyId;
  legacyTitle: string;                 // wörtlich aus der Quelle
  page: number;
  outcome:
    | { kind: 'unique'; target: MigrationTarget; note?: string }
    | { kind: 'ambiguous'; candidates: readonly [MigrationTarget, MigrationTarget, ...MigrationTarget[]];
        rationale: string }            // Pflicht, nicht optional
    | { kind: 'no-successor'; rationale: string };
  review: ReviewSet;                   // technisch + fachlich, wie überall
}
```

Die Typform erzwingt das Erfolgskriterium: `ambiguous` ohne mindestens zwei Kandidaten und ohne
`rationale` kompiliert nicht; `no-successor` ohne Begründung ebenfalls nicht. Ein Union-Typ statt
optionaler Felder, aus demselben Grund, aus dem `CatalogEntry.profile` Pflicht ist: „keine Angabe"
darf nicht mit „eindeutig" verwechselbar sein.

`SourceReference.status: 'legacy'` behält seine Rolle für den umgekehrten Fall — ein
Katalogeintrag, der an der 2010er-Systematik orientiert ist — und wird von diesem Register nicht
gebraucht. Das sollte im Kommentar von `provenance.ts` stehen, damit niemand die beiden verwechselt.

### 4.2 Katalog

`packages/catalog/src/legacy-migrations.ts`: `LEGACY_MIGRATIONS: Record<LegacyId, LegacyMigration>`
mit `satisfies`, `deepFreeze`, ein Objekt je Schlüssel. Umfang des ersten Slice: **die 142
Bezeichner der Systematik (Kapitel 1–9) plus die drei Regeln als `no-successor` oder
`section-only`**. Kapitel 10 und 11 sind spätere Erweiterungen (siehe Abschnitt 6) und brauchen
kein anderes Modell.

Auflösung als Funktion, damit CLI, Docs und ein späterer Importadapter dieselbe Logik nutzen:
`resolveLegacy(id: string): LegacyMigration | undefined` und ein Rückwärtsindex
`legacyIdsFor(target): readonly LegacyId[]` (ersetzt `legacyIds`).

### 4.3 Test: Vollständigkeit

Nach dem Muster von `domain-reviews.test.ts` (beide Richtungen) und `sources.test.ts`:

1. **Vollständigkeit gegen das Inventar.** Eine eingecheckte Liste der Legacy-Bezeichner
   (`legacy-inventory.ts`: Nummer, Titel, Seite — Text aus der Quelle) muss deckungsgleich mit
   den Schlüsseln des Registers sein. Kein Bezeichner ohne Entscheidung, keine Entscheidung ohne
   Bezeichner. Das ist die maschinelle Fassung von „jeder Legacy-Bezeichner liefert …".
2. **Zielauflösung.** Jedes `catalog-entry`-Ziel existiert in `CATALOG`, jedes `recipe`-Ziel in
   den Rezeptmaps, jedes `element`-Ziel in der jeweiligen ID-Menge; jedes `section-only`-Ziel
   ist eine Abschnittsnummer, die im Referenzinventar (`fingerprints.json`/`reference-inventory.ts`)
   belegt ist, **und** hat keinen Manifest-Eintrag (sonst muss es auf das Objekt umgeschrieben
   werden — der Test zwingt das Register, dem Katalogausbau zu folgen).
3. **Kandidaten paarweise verschieden**, `rationale` nicht leer, `unique.note` darf keine
   Alternativen aufzählen (Heuristik: kein zweiter Zielbezeichner im Text).
4. **Review-Ledger:** wie beim Manifest ein eigener Ledger `LEGACY_DOMAIN_REVIEWS`, Vollständigkeit
   in beide Richtungen; das Coverage-Gate zählt offene fachliche Reviews des Registers mit.

### 4.4 CLI

Neues Kommando `pnpm cli migrate <legacy-id>` (Muster `audit:reference`, `CliUsageError` bei
unbekannter ID). Ausgabe je Klasse:

```
skk-2010:3.1.19  Messen, Spüren  (S. 15)
→ eindeutig: capability.cbrn-detection  (bbk-babz-2025:4.1.2)

skk-2010:3.6.4  Warnen  (S. 17)
→ mehrdeutig (3 Kandidaten): 2025 trennt Warnen nach Mittel.
   capability.optical-warning      (4.7.23)
   capability.loudspeaker-warning  (4.7.24)
   capability.siren-warning        (4.7.25)

skk-2010:6.4.10  Geräte  (S. 25)
→ ohne Nachfolger: die Baseline kennt kein generisches Gerätezeichen.
```

Dazu `pnpm cli migrate --all` als Tabelle und `--json` für Werkzeuge. Ein Importadapter für
`phjardas-tz`-Bezeichner (Vision, „Strategische Positionierung") ist ein zweiter Konsument
derselben Auflösung, aber ein eigener Slice.

### 4.5 Coverage-Zeile

`pnpm cli coverage` bekommt eine Zeile nach dem Muster der Referenzabdeckung:

```
Legacy-Migration:    142/142 Bezeichner entschieden — 105 eindeutig, 23 mehrdeutig, 14 ohne Nachfolger;
                     10 Ziele noch ohne Katalogeintrag; 142 fachlich offen
```

Die Zahl „entschieden" ist ein Gate (Test 1), der Rest ist Bericht. „Ziele noch ohne
Katalogeintrag" verbindet die Legacy-Zeile mit „Kapitel im beanspruchten Umfang ohne Eintrag":
beide sinken mit demselben Katalogausbau.

## 5. Lizenz- und Reviewfragen

**Was übernommen wird.** Ausschließlich Bezeichner: Abschnittsnummern, Titel wörtlich, Seitenzahl,
Kurzbezeichnungen. Das sind Fakten und amtlich-organisatorische Nomenklatur; die Systematik selbst
ist eine gemeinsame Konvention der beteiligten Organisationen. **Keine Geometrie, keine
Rasterbilder, keine Farbtabellen als Bild** — `geometryUse: ['none']` bleibt, und das PDF wird
nicht eingecheckt (wie bei allen Quellen; der Fingerprint-Ansatz greift hier ohnehin nicht, weil
keine SVGs existieren). Ein Inventar der Titel im Repository ist keine Vervielfältigung der
Broschüre; die Grenze wäre erreicht, wenn die Tabellen der Quelle einschließlich Beschreibungstext
seitenweise reproduziert würden — das braucht das Register nicht.

**Lizenzstatus.** Das Impressum sagt ausdrücklich: „Nachdruck und Verbreitung für nicht
kommerzielle Zwecke mit Quellenangabe und Belegexemplar an die Bundesgeschäftsstelle der DLRG sind
erlaubt und gewünscht." Das ist besser als `unclear`, aber keine Freigabe für Ableitung in einem
Open-Source-Projekt ohne Nutzungsbeschränkung (die Bedingung „nicht kommerziell" wäre mit einer
MIT-artigen Lizenz nicht vereinbar). Empfehlung: `status: 'unclear'` belassen, `basis` um den
Impressumssatz ergänzen und in `note` festhalten, dass nur Bezeichner übernommen werden und die
Beschränkung deshalb nicht greift — dieselbe Argumentationsfigur wie bei `phjardas-tz`
(„Übernommen wird die Methode, keine Geometrie").

**Reviews.** Das Register braucht drei Freigaben, die heute alle offen sind:

1. **Quellenreview `skk-2010`** (`SOURCE_DOMAIN_REVIEWS['skk-2010']`: `pending`) — bisher ohne
   Konsequenz, weil nichts die Quelle referenziert. Mit dem Register wird es real: URL-Umzug,
   Zweitfundstelle, Impressumslage.
2. **Technisches Review je Registerzeile** — Nummer, Titel, Seite stimmen gegen die Quelle;
   Zielobjekt existiert. Das kann ein Agent leisten und `technical` tragen, wie beim Manifest.
3. **Fachliches Review je Registerzeile** — die eigentliche Arbeit: ob 3.1.14 „Rettungshunde"
   wirklich nach `biological-location` zeigt, ob 3.2.1 ehrlich dreideutig ist oder 4.6.1 der
   gemeinte Nachfolger. 142 Zeilen mit `domain: pending` nach demselben Muster wie die
   Manifestzeilen; der Reviewer ist derselbe wie für das Manifest.

## 6. Aufwand und Empfehlung

### 6.1 Arbeitspakete

| AP | Inhalt | Umfang |
|---|---|---|
| 1 | Quellenregister reparieren: neue URL, Zweitfundstelle, Impressumssatz, technisches Review erneuern | klein (½ Tag) |
| 2 | Inventar Kapitel 1–9 als `legacy-inventory.ts` (142 + 3 Regeln, Text aus der Quelle) und Erstzuordnung **mit Bildvergleich** beider PDFs; Zählung aus Abschnitt 3 dabei korrigieren | mittel (2 Tage; das ist die fachlich tragende Arbeit) |
| 3 | Schema `legacy.ts`, Katalog `legacy-migrations.ts`, Auflösung, Rückwärtsindex, Umgang mit `legacyIds` | klein bis mittel (1 Tag) |
| 4 | Tests nach 4.3, Review-Ledger, Coverage-Gate-Anschluss, Coverage-Zeile | mittel (1 Tag) |
| 5 | CLI `migrate`, Ausgabe nach 4.4, Snapshot-Tests | klein (½ Tag) |
| 6 | Docs: Entscheidungsnotiz zum Modell, ClickUp-Task LFH-433 mit Beschreibung und Subtasks füllen | klein (½ Tag) |
| — | **Summe erster Slice** | **≈ 5–6 Agententage**, davon 2 mit fachlichem Sichtungsanteil |
| 7 (später) | Kapitel 10 (205 Beispiele) als Rezeptmigration | mittel bis groß (3 Tage), sinnvoll erst nach Anhang C/E-Abschluss |
| 8 (später) | Kapitel 11 als DLRG-Profil-Aliasse | hängt am Profilmodell, nicht vor dem ersten Organisationsprofil |
| 9 (später) | Importadapter `phjardas-tz` / `jonas-koeritz` über dieselbe Auflösung | eigener Slice |

Abhängigkeiten: AP 1 kann sofort; AP 2 braucht nichts außer beiden PDFs; AP 3–5 folgen AP 2
seriell; AP 6 begleitet. Kein Arbeitspaket hängt an offenen Katalogslices — das bestätigt die
Entscheidungsnotiz („hängt an nichts").

### 6.2 1.0-Blocker: ja oder nein

**Für „Blocker":**

- Das Erfolgskriterium steht ohne Einschränkung in der Vision, und der Parent LFH-406 zählt
  Legacy-Migration zum Governance-Gate. Ein 1.0 ohne Register widerspricht der eigenen Definition
  von 1.0, oder die Definition muss geändert werden.
- Die Quelle ist gerade instabil geworden (Haupt-URL tot). Wer das Inventar nicht jetzt zieht,
  arbeitet später von einer Drittkopie.
- Das Modell (AP 3) fasst `CatalogEntry` an (`legacyIds`) — dieselbe Kostenlogik wie in Slice 2:
  vor 600 Einträgen billiger als danach. Allerdings nur ein Feld, kein Strukturumbau.

**Gegen „Blocker":**

- Niemand nutzt die Auflösung heute; kein Ausgabekanal, kein Importer, keine Docs-Seite fragt
  danach. Ein Register ohne Konsumenten ist genau der Zustand, den die Entscheidungsnotiz als
  „Typ existiert, kein Konsument" kritisiert — nur eine Ebene höher.
- Zehn eindeutige Ziele und alle Rezeptbeispiele aus Kapitel 10 zeigen auf Katalogteile, die es
  noch nicht gibt. Ein vor dem Katalogausbau gebautes Register trägt vorübergehend
  `section-only`-Zeilen, die später umgeschrieben werden müssen.
- Das fachliche Review von 142 Zeilen konkurriert um denselben Reviewer wie die Manifestzeilen,
  die für 1.0 tatsächlich zählen.

**Empfehlung: Kein 1.0-Blocker im Sinne „Register vollständig und fachlich freigegeben", aber
zwei Teile davor.** Konkret:

1. **Vor 1.0 (klein, jetzt):** AP 1 und AP 2 — Quelle reparieren und das Inventar samt
   Erstzuordnung einchecken. Das sichert die Quelle, kostet zweieinhalb Tage und hat keinen
   Reviewer-Bedarf außer dem Quellenreview. Dazu die Entscheidung über das Modell aus Abschnitt 4
   als Entscheidungsnotiz, damit `legacyIds` nicht in weiteren Einträgen auftaucht.
2. **Nach 1.0 (oder wenn ein Konsument entsteht):** AP 3–5 und das fachliche Review. Das
   Erfolgskriterium der Vision wird für 1.0 in der Gate-Definition ausdrücklich als „inventarisiert
   und modelliert, Auflösung im Katalog folgt" eingeschränkt — dokumentiert, nicht stillschweigend.

Sollte die Governance-Entscheidung anders ausfallen (Register vollständig vor 1.0), ist der
Preis aus 6.1 bekannt: ≈ 5–6 Tage plus das fachliche Review von 142 Zeilen.

## 7. Offene Entscheidungen

1. Modellform aus 4.1 (Register statt `legacyIds`) — Entscheidungsnotiz nötig.
2. Umgang mit `section-only`-Zielen: zulässig als Übergang (Empfehlung) oder Register erst nach
   Katalogausbau.
3. Kapitel 11 als DLRG-Profil: setzt eine Entscheidung zum ersten Organisationsprofil voraus.
4. Ob die Legacy-Zeile im Coverage-Gate (`1.0-Blocker`-Zeile) oder nur als Bericht erscheint —
   folgt aus 6.2.

## Quellen

- DLRG DV 102, 1. Auflage 2011 (RLP-Fundstelle): https://rlp.dlrg.de/fileadmin/groups/10000000/Ressort_Einsatz/Dateien/DV102_DLRG_Taktische_Zeichen.pdf
- SKK, Empfehlungen für Taktische Zeichen im Bevölkerungsschutz, 2. Auflage 2010: https://wiki.einsatzleiterwiki.de/lib/exe/fetch.php?rev=1302165454&media=allgemein:empfehl_takt_zeichen_im_bevsch.pdf
- DLRG-Newsletter 11/2011 zur Einführung der DV 102: https://newsletter.dlrg.de/2011/ausgabe-11/2011/taktische-zeichen-im-bevoelkerungsschutz-dlrg-dv-102/
- Tote Bezugsadresse aus `sources.ts` (404 am 2026-08-28): https://www.dlrg.de/fileadmin/user_upload/DLRG.de/Fuer-Mitglieder/Einsatz_und_Medizin/kats/Download_Dateien/Formulare_E008/DV102_TaktischeZeichen_DLRG110826.pdf
