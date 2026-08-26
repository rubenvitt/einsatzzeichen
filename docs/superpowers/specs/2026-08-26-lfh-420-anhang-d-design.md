# LFH-420 — Anhang D: Führung und Funktionen

> Design-Spec · 26. August 2026
> Status: schriftlich freigegeben am 26. August 2026

## 1. Ziel und Erfolgsbild

LFH-420 vervollständigt den Anhang D der projektinternen BBK/BABZ-Coverage-Baseline. Der lokale
Referenzbestand enthält 37 Dateien. `D.3.7_Zugführer der Feuerwehr.svg` besitzt bereits eine
Manifestzeile und ein Rezept; 36 Dateien sind noch nicht katalogisiert.

Der Slice liefert:

- 36 neue, einzeln adressierbare Darstellungen;
- eine quellentreue Migration des bestehenden Eintrags D.3.7;
- vollständige technische Coverage für D.1 bis D.4;
- einen gemessenen, wiederverwendbaren Kompositionsvertrag für Funktionsträger;
- einen fail-closed Verwaltungsstufen-Kopfvertrag für genau die drei belegten Stufen;
- zehn direkte `leadership.*`-Definitionen für Zeichen ohne belegbare Kompositionsachse;
- vier reproduzierbare Referenz-gegen-Katalog-Kontaktbögen als lokale Belege für den finalen
  Handoff an den Nutzer;
- getrennte technische und fachliche Reviewobjekte.

Der Slice erteilt keine fachliche, normative oder lizenzrechtliche Freigabe. Jede neue
Darstellung erhält einen technisch geprüften Manifesteintrag und einen fachlichen Reviewträger
mit `domain: pending`.

## 2. Autoritative Quellen und Abgrenzung

Autoritativ für den Umfang sind:

1. ClickUp LFH-420 und sein Eltern-Task LFH-404;
2. die 37 lokalen Originaldateien unter
   `/Users/rubeen/dev/personal/taktik/taktische-zeichen/D.*.svg`;
3. das eingecheckte Inventar in `packages/catalog/src/fingerprints.json`;
4. die Vermessung der Verwaltungsstufen in
   `docs/decisions/2026-08-18-grundlagen-restpunkte.md`;
5. die bestehenden Kompositions-, Piktogramm-, Snapshot-, Coverage- und Reviewverträge.

Die Original-SVGs bleiben außerhalb des Repositories. Pfade und in Kurven umgewandelte Glyphen
werden nicht in Produktionscode kopiert. Geometrie wird aus gemessenen Millimetermaßen neu
konstruiert; Text wird mit dem vorhandenen Arimo-Textprimitiv gesetzt.

Außerhalb des Slice bleiben:

- die drei Verwaltungsstufen ohne belegte Kopfmarke (`gemeinde`, `bezirk`, `bundesland`);
- eine fachliche Deutung der offenen Kopfkappe von D.3.14 und D.3.15;
- die Umdeutung von Trägerkürzeln wie `AW`, `ST`, `ME`, `MG`, `BuPol` zu Organisationen;
- eine allgemeine Kompositionsachse für die vollständigen Ortszeichen aus D.2;
- eine Änderung bestehender Kapitel-5.8-State-Verträge;
- eine fachliche Freigabe der neuen Zeichen.

## 3. Inventar und verbindliche 26/10-Entscheidung

### 3.1 Dateizählung

| Bereich | Dateien | Besonderheit |
|---|---:|---|
| D.1 Führungsstellen | 10 | D.1.9 besitzt eine Alternativdarstellung |
| D.2 Führungsorte | 7 | sieben eigenständige Ortszeichen |
| D.3 Funktionen | 15 | D.3.7 besitzt bereits einen unvollständigen Katalogeintrag |
| D.4 übergeordnete Funktionen | 5 | drei belegte Verwaltungsstufen |
| **Summe** | **37** | **36 neu, 1 zu migrieren** |

### 3.2 Klassifikation der 36 offenen Dateien

| Klasse | Dateien | Anzahl |
|---|---|---:|
| Rezept mit vorhandenen Achsen | D.1.9 Primary und Alternative | **2** |
| Rezept nach neuem Funktionsträger-Vertrag | D.1.2–D.1.8; D.3.1–D.3.6; D.3.8–D.3.13; D.4.1–D.4.5 | **24** |
| Direkte Definition | D.1.1; D.2.1–D.2.7; D.3.14; D.3.15 | **10** |
| **Summe** | | **36** |

Damit entstehen **26 neue Rezepte und zehn neue direkte Definitionen**. Nach der Migration von
D.3.7 besteht der vollständige Anhang aus **27 Rezepten und zehn direkten Definitionen**.

### 3.3 Warum nicht alles direkt gezeichnet wird

D.1.2–D.1.8 und die 17 komponierbaren Personen aus D.3/D.4 wiederholen dieselben strukturellen
Achsen: Körperart, Organisationsfarbe, Funktionsträger-Kappe, Rollenlauf, Trägerkürzel,
Stärke- oder Verwaltungsstufenkopf und optionale Innenmarke. 24 unabhängige Vollzeichnungen
würden diese Zusammenhänge vervielfachen und die im Task geforderte generative Reichweite nicht
prüfen.

### 3.4 Warum nicht alles komponiert wird

Die zehn direkten Zeichen liefern keine belastbare öffentliche Kompositionsachse:

- D.1.1 besitzt eine 32 × 46-mm-Ansicht mit gestrichelter Verbindung und äußerem Kreuz;
- D.2.1–D.2.7 sind vollständige Ortszeichen, deren Kreis, Dach, Buchstaben und Innenmarken keine
  vorhandenen `SymbolSpec`-Dimensionen sind;
- D.3.14 und D.3.15 tragen eine offene statt einer gefüllten Kopfkappe. Geometrische Ähnlichkeit
  beweist keine gemeinsame Bedeutung.

Private Konstruktionshelfer dürfen identische Geometrie teilen. Sie begründen keine öffentliche
Semantik und keine weitere `SymbolSpec`-Achse.

## 4. Korrektur des bestehenden D.3.7-Eintrags

Die bestehende Coveragezeile zu D.3.7 ist kein quellentreuer Nachweis des Funktionsträger-
Mechanismus. Das aktuelle Rezept setzt `person + feuerwehr + zug`, lässt aber die schwarze
Kopfkappe, die waagerechte Körperteilung und die rechte innere Raute der Referenz aus.

LFH-420 migriert D.3.7 auf denselben Funktionsträger-Vertrag wie die übrigen komponierbaren
Personen. Die Manifestzeile bleibt dieselbe; direkte und Mehrgrößen-Snapshots ändern sich
erwartet. Ein eigener Regressionstest hält fest:

- drei Stärkepunkte bleiben erhalten;
- die schwarze Kopfkappe ist vorhanden;
- Hauptteilung und rechte innere Raute sind vorhanden;
- die rote Körperfläche und die 32 × 32-mm-Ansicht bleiben erhalten;
- das alte vereinfachte Bild darf nicht mehr erzeugt werden.

D.3.7 zählt nicht zu den 36 neuen Coveragezeilen. Seine Korrektur ist notwendige Migration einer
bereits beanspruchten Zeile.

## 5. Kompositionsarchitektur

### 5.1 Semantische Achse `FunctionRoleId`

`packages/schema` erhält einen source-backed `FunctionRoleId`-Raum für die 25 komponierten
Funktionsträgerdarstellungen einschließlich D.3.7. Jede ID bezeichnet die Funktion aus dem
jeweiligen Referenztitel; sie bezeichnet weder Organisationszugehörigkeit noch Trägerkürzel.

`SymbolSpec` erhält optional `functionRole?: FunctionRoleId`. Ein gesetzter Wert ist keine reine
Metadatenangabe: `compose()` muss ihn über einen neuen Katalogport konsumieren. Eine Spec, deren
Funktion nicht gezeichnet werden kann, wird abgelehnt und darf kein byteidentisches Bild ohne
Funktion liefern.

Die Rolle bleibt von folgenden vorhandenen Achsen getrennt:

- `organization` bestimmt ausschließlich die Körperfarbe;
- `strength` bestimmt den vorhandenen kreisförmigen Stärkekopf;
- `administrativeLevel` bestimmt den neuen sternförmigen Verwaltungsstufenkopf;
- `bodyMarks` tragen zusätzliche Innengeometrie;
- Beschriftungsfelder tragen sichtbare Rollen- und Trägerläufe.

Diese Trennung verhindert insbesondere, dass `DRK`, `ASB`, `MHD`, `JUH`, `BuPol` oder regionale
Kürzel zu neuen `OrganizationId`-Werten erklärt werden.

### 5.2 Funktionsträger-Definition und Katalogport

Der Katalog führt je `FunctionRoleId` eine unveränderliche Definition mit:

- zulässiger Körperart (`formation` oder `person`);
- gemessener Layoutfamilie;
- ein- oder zweizeiligem Rollenlauf und vollständigen Textmetriken;
- optionalem Trägerlauf mit eigener gemessener Zone;
- erwarteter Kopfart (`none`, `strength` oder `administrative`);
- den für diese Rolle zulässigen zusätzlichen Innenmarken.

`CatalogPorts` erhält einen `functionRole`-Port. Der Port liefert keine fertige Gesamtzeichnung,
sondern die gemessene Funktionsträger-Dekoration und Layoutangaben. `compose()` bleibt Eigentümer
der Reihenfolge: Kopf, gefüllter Körper, Körperzusätze, Innenmarken, Funktionsdekoration,
Beschriftung und Fußzone.

Unbekannte Rollen, falsche Körperarten, unzulässige Kopfarten und nicht vermessene
Rolle-/Körper-Kombinationen werfen beziehungsweise liefern einen Validierungsbefund. Es gibt
keinen Rückfall auf das normale `formation`- oder `person`-Profil.

### 5.3 Gemessene Layoutfamilien

Die Implementierung führt private, geometrisch benannte Layoutfamilien:

1. `formation-solid-cap`: 30 × 20-mm-Formationskörper mit 3-mm-Kopfkappe, gemessenem Rahmen und
   ein- oder zweizeiligem Rollenlauf;
2. `person-solid-cap`: gedrehter Personenkörper mit gefüllter Kopfkappe und gemessener
   Rollen-/Trägerzone;
3. administrative Personenfassungen für die belegten Zwei-, Fünf- und Sechs-Stern-Köpfe.

Die Layoutfamilie ist ein Katalogdetail, keine öffentliche Einsatzsemantik. D.4.4 und D.4.5
verwenden ihre separat gemessenen Körpergrößen und -lagen; der Körper wird nicht aus der Anzahl
der Sterne skaliert. D.3.12 übernimmt ebenfalls seine gemessene Personenkörperlage statt die
D.3.7-Schrumpfregel blind wiederzuverwenden.

### 5.4 Rollen- und Trägerbeschriftung

`BodyLabels` wird nicht durch Umdeutung vorhandener E-/F-Zonen erweitert. Funktionsträger
erhalten eigene, lagebenannte Felder für:

- den ein- oder zweizeiligen Rollenlauf;
- das Trägerkürzel an der gemessenen unteren/rechten Position.

Jeder Lauf trägt `boxMm`, Schriftgrad, Grundlinie, Anker und `minRenderPx`. Mehrzeilige Rollen
werden als getrennte Textprimitive gesetzt. Auto-Fit, impliziter Zeilenumbruch und übertragene
E-/F-Defaults sind ausgeschlossen.

### 5.5 Innenmarken und D.1.9

D.1.9 Primary/Alternative sowie die zusätzlichen Innenzeichen von D.3.7 und D.3.9–D.3.13 nutzen
den bestehenden, körper- und variantenbewussten `bodyMark`-Port. Neue Kennungen sind entweder:

- bestehende, fachlich belegte IDs; oder
- neutrale `TechnicalBodyMarkId`s, deren Namen ausschließlich die sichtbare Geometrie
  beschreiben.

Die innere Dreierreihe von D.1.9 Alternative bleibt eine Innenmarke. Sie wird nicht als zweiter
Stärkegrad modelliert.

### 5.6 Verbindliche Rezeptmatrix

Die folgenden 27 Zeilen sind der planbare Vertrag: 26 neue Rezepte plus die Migration von D.3.7.
`†` markiert eine fachlich noch zu bestätigende englische ID oder Organisationszuordnung, nicht
eine technische Wahlmöglichkeit. Die IDs bleiben bis zum Domainreview stabil; Trägerkürzel sind
nur sichtbarer Text.

#### D.1

| Referenz / Rezept | `FunctionRoleId` | kind / Organisation | Kopf | Rollen-/Trägerlauf | Innenmarken / Layout |
|---|---|---|---|---|---|
| `D.1.2_Katastrophenschutzleitung im Einsatz.svg` / `D.1.2` | `disaster-control-command` | `formation` / `fuehrung-leitung` | none | `KatSL` / — | — / `formation-solid-cap` |
| `D.1.3_Technische Einsatzleitung Evakuierung im Einsatz.svg` / `D.1.3` | `technical-incident-command-evacuation`† | `formation` / `fuehrung-leitung` | none | `TEL`, `Evakuierung` / — | — / `formation-solid-cap` |
| `D.1.4_Einsatzleitung im Einsatz.svg` / `D.1.4` | `incident-command` | `formation` / `fuehrung-leitung` | none | `EL` / — | — / `formation-solid-cap` |
| `D.1.5_Einsatzabschnittsleitung Nord im Einsatz.svg` / `D.1.5` | `incident-section-command-north` | `formation` / `fuehrung-leitung` | none | `EAL`, `Nord` / — | — / `formation-solid-cap` |
| `D.1.6._Unterabschnittsleitung im Einsatz.svg` / `D.1.6` | `incident-subsection-command` | `formation` / `fuehrung-leitung` | none | `UEAL` / — | — / `formation-solid-cap` |
| `D.1.7_Führungsgruppe TEL.svg` / `D.1.7` | `technical-incident-command-group` | `formation` / `fuehrung-leitung` | `strength=gruppe` | `TEL` / — | — / `formation-solid-cap` |
| `D.1.8_Führungsgruppe einer Feuerwehrbereitschaft.svg` / `D.1.8` | `fire-service-readiness-command-group`† | `formation` / `feuerwehr` | `strength=gruppe` | `Ber` / — | — / `formation-solid-cap` |
| `D.1.9_Zugtrupp einer Sanitätseinheit.svg` / `D.1.9` | keiner | `formation` / `hilfsorganisation`† | `strength=trupp` | — / — | `medical-service`, `formation-solid-cap-3mm` / `formation-body-mark/primary` |
| `D.1.9_Zugtrupp einer Sanitätseinheit_Alternative.svg` / `D.1.9#alternative` | keiner | `formation` / `hilfsorganisation`† | `strength=trupp` | — / — | `medical-service`, `formation-solid-cap-4mm-three-hole-row` / `formation-body-mark/three-hole-alternative` |

#### D.3

| Referenz / Rezept | `FunctionRoleId` | kind / Organisation | Kopf | Rollen-/Trägerlauf | Innenmarken / Layout |
|---|---|---|---|---|---|
| `D.3.1_Technischer Einsatzleiter LK Ahrweiler.svg` / `D.3.1` | `technical-incident-commander` | `person` / `fuehrung-leitung` | `administrativeLevel=kreis` | `TEL` / `AW` | — / `person-solid-cap/admin-2-star-standard` |
| `D.3.2_Einsatzleiter.svg` / `D.3.2` | `incident-commander` | `person` / `fuehrung-leitung` | none | `EL` / — | — / `person-solid-cap/no-head` |
| `D.3.3_Leitender Notarzt.svg` / `D.3.3` | `lead-emergency-physician` | `person` / `fuehrung-leitung` | `administrativeLevel=kreis` | `LNA` / — | — / `person-solid-cap/admin-2-star-standard` |
| `D.3.4_Organisatorischer Leiter.svg` / `D.3.4` | `organizational-incident-commander`† | `person` / `fuehrung-leitung` | `administrativeLevel=kreis` | `OrgL` / — | — / `person-solid-cap/admin-2-star-standard` |
| `D.3.5_Einsatzabschnittsleiter.svg` / `D.3.5` | `incident-section-commander` | `person` / `fuehrung-leitung` | none | `EAL` / — | — / `person-solid-cap/no-head` |
| `D.3.6_Untereinsatzabschnittsleiter.svg` / `D.3.6` | `incident-subsection-commander` | `person` / `fuehrung-leitung` | none | `UEAL` / — | — / `person-solid-cap/no-head` |
| `D.3.7_Zugführer der Feuerwehr.svg` / `D.3.7` | `fire-service-platoon-commander` | `person` / `feuerwehr` | `strength=zug` | — / — | `fire-fighting` / `person-solid-cap/strength-3-dot-lowered` |
| `D.3.8_Zugführer Technischer Zug THW.svg` / `D.3.8` | `technical-platoon-commander`† | `person` / `thw` | `strength=zug` | `TZ` weiß / — | — / `person-solid-cap/strength-3-dot-lowered` |
| `D.3.9_Zugführer Sanitätszug ASB.svg` / `D.3.9` | `medical-platoon-commander` | `person` / `hilfsorganisation`† | `strength=zug` | — / `ASB` | `medical-service` / `person-solid-cap/strength-3-dot-lowered` |
| `D.3.10_Zugführer Einsatzeinheit DRK.svg` / `D.3.10` | `operational-unit-platoon-commander`† | `person` / `hilfsorganisation`† | `strength=zug` | — / `DRK` | `medical-service`, `care` / `person-solid-cap/strength-3-dot-lowered` |
| `D.3.11_Zugführer Betreuungszug ASB.svg` / `D.3.11` | `care-platoon-commander`† | `person` / `hilfsorganisation`† | `strength=zug` | — / `ASB` | `care` / `person-solid-cap/strength-3-dot-lowered` |
| `D.3.12_Gruppenführer Betreuungsgruppe Malteser.svg` / `D.3.12` | `care-group-commander`† | `person` / `hilfsorganisation`† | `strength=gruppe` | — / `MHD` | `care` / `person-solid-cap/strength-2-dot-standard` |
| `D.3.13_Gruppenführer Schnell-Einsatzgruppe Johanniter.svg` / `D.3.13` | `rapid-response-group-commander`† | `person` / `hilfsorganisation`† | `strength=gruppe` | `SEG` / `JUH` | — / `person-solid-cap/strength-2-dot-standard` |

#### D.4

| Referenz / Rezept | `FunctionRoleId` | kind / Organisation | Kopf | Rollen-/Trägerlauf | Innenmarken / Layout |
|---|---|---|---|---|---|
| `D.4.1_Leiter Kreisleitstelle Steinfurt.svg` / `D.4.1` | `district-control-center-director`† | `person` / `fuehrung-leitung` | `administrativeLevel=kreis` | `LtS` / `ST` | — / `person-solid-cap/admin-2-star-standard` |
| `D.4.2_Kreisbrandmeister Mettmann.svg` / `D.4.2` | `district-fire-chief`† | `person` / `feuerwehr` | `administrativeLevel=kreis` | `KBM` / `ME` | — / `person-solid-cap/admin-2-star-standard` |
| `D.4.3_Leiter Gefahrenabwehr Mönchengladbach.svg` / `D.4.3` | `hazard-response-director`† | `person` / `fuehrung-leitung` | `administrativeLevel=kreis` | `LtrGA` / `MG` | — / `person-solid-cap/admin-2-star-standard` |
| `D.4.4_Leiter Gefahrenabwehrkräfte Bundespolizei.svg` / `D.4.4` | `hazard-response-forces-director`† | `person` / `polizei` | `administrativeLevel=nationalstaat` | — / `BuPol` | — / `person-solid-cap/admin-5-star-lowered` |
| `D.4.5_Leiter internationalen Hilfsaktion.svg` / `D.4.5` | `international-relief-operation-director`† | `person` / `fuehrung-leitung` | `administrativeLevel=europaeische-union` | — / — | — / `person-solid-cap/admin-6-star-compact` |

Die Matrix ist zugleich Negativvertrag: D.1.9 erhält keinen `FunctionRoleId`; die innere
Dreierreihe der Alternative bleibt Teil ihrer technischen Kappenmarke. Für `hilfsorganisation`†
belegt die Quelle zunächst nur einen weißen Körper. Die englischen `†`-Namen sowie diese
Organisationszuordnung bleiben im zugehörigen Domainreview ausdrücklich offen, werden aber nicht
während der Implementierung ad hoc umbenannt.

## 6. Verwaltungsstufen-Kopfzone

### 6.1 Belegter Umfang

Gebaut werden ausschließlich:

| Verwaltungsstufe | Referenzbeleg | Kopfgeometrie |
|---|---|---|
| `kreis` | D.3.1, D.3.3, D.3.4, D.4.1–D.4.3 | zwei Sterne |
| `nationalstaat` | D.4.4 | fünf Sterne |
| `europaeische-union` | D.4.5 | sechs Sterne in drei Reihen |

`gemeinde`, `bezirk` und `bundesland` besitzen im Referenzbestand keine Kopfmarkenträger und
bleiben mit einem präzisen `administrative-level-not-measured`-Befund abgelehnt.

### 6.2 Eigener Primitivvertrag

Die Verwaltungsmarke ist ein sechsstrahliger Stern, kein Kreis. `HeadMark` wird deshalb nicht
mit Sonderwerten überladen. `CatalogPorts` erhält einen separaten `administrativeHead`-Port mit
einem relativen Primitivvertrag und deklarierter Hülle/Höhe. Die Primitive tragen `role: 'head'`.

`strength` und `administrativeLevel` bleiben gegenseitig ausgeschlossen. Die bestehende Regel
`head-zone-conflict` bleibt aktiv und bekommt nun erstmals zwei tatsächlich erreichbare Zweige.

## 7. Direkte `leadership.*`-Definitionen

### 7.1 Neuer ID-Raum

`packages/schema` erhält ein geschlossenes Literalregister `LEADERSHIP_IDS` und daraus
`LeadershipId`; `PictogramId` wird um
``leadership.${LeadershipId}`` erweitert. Der Raum enthält genau die zehn direkten Darstellungen
dieses Slice. Er ist kein Alias für `state`, `capability` oder `comms`.

Leadership wird bewusst als sechste Familie in den **bestehenden** direkten Piktogrammpfad
integriert, nicht als Parallelregister. `PictogramSection` akzeptiert dafür `D.${string}`;
`defineLeadership()` erzeugt eine `placement: standalone`-Definition mit verpflichtenden
Kontrastpaaren. `LEADERSHIP_PICTOGRAMS` fließt in `ALL_PICTOGRAMS` ein. Dadurch greifen ohne
zweiten Datenfluss dieselbe Registry und `pictogram()`-Auflösung, Renderfallableitung,
Piktogramm-/Clipping-/Kontrastgates, Snapshotableitung, Mehrgrößen-Sheets und die automatische
Manifest-/Evidence-Erzeugung mit `svg-snapshot` und `pictogram-contract`.

`ElementKind` und `PICTOGRAM_ELEMENT_KINDS` erhalten `leadership`, sodass auch die öffentlichen
Elementbeschreibungen aus derselben Registry entstehen. Die zehn Domainreviewobjekte bleiben
`pending`; die vorhandenen Gleichheitsgates müssen ihre exakte Deckung erzwingen.

Die Familie wird in allen Vollständigkeitstests explizit erwartet. Für jeden Leadership-Eintrag
gilt die Bijektion zwischen `LeadershipId`, `ALL_PICTOGRAMS`, Renderfall, Snapshot, Manifestzeile
und Reviewobjekt. Ein separates Leadership-Register oder eine zweite Coverage-Pipeline ist
verboten.

`packages/catalog` erhält `defineLeadership()` und modulare Definitionen für:

- D.1.1;
- D.2.1–D.2.7;
- D.3.14 und D.3.15.

Die zehn technischen IDs sind verbindlich; † bedeutet weiterhin `domain: pending`:

| Abschnitt | `LeadershipId` | Titel | ViewBox |
|---|---|---|---:|
| D.1.1 | `command-post-in-operation`† | Befehlsstelle im Einsatz | 32 × 46 mm |
| D.2.1 | `staging-area`† | Bereitstellungsraum | 32 × 32 mm |
| D.2.2 | `staging-area-with-reporting-head`† | Bereitstellungsraum mit Meldekopf | 32 × 32 mm |
| D.2.3 | `reporting-head`† | Meldekopf | 32 × 32 mm |
| D.2.4 | `guide-post`† | Lotsenstelle | 32 × 32 mm |
| D.2.5 | `control-center`† | Leitstelle | 32 × 32 mm |
| D.2.6 | `helicopter-landing-zone`† | Hubschrauberlandezone | 32 × 32 mm |
| D.2.7 | `helicopter-landing-site`† | Hubschrauberlandeplatz | 32 × 32 mm |
| D.3.14 | `technical-advisor-thw`† | Fachberater THW | 32 × 32 mm |
| D.3.15 | `red-cross-commissioner`† | Rotkreuzbeauftragter | 32 × 32 mm |

Jede Definition führt Abschnitt, semantische ID, Titel, Referenzdatei, ViewBox, deklarierte Box,
Primitive, Kontrastpaare und `placement: standalone`.

### 7.2 ViewBox-Vertrag und D.1.1

D.1.1 besitzt eine 32 × 46-mm-Quelle. Sie wird vollständig erhalten: keine Stauchung, kein
Abschneiden der gestrichelten Verbindung und keine Skalierung auf 32 × 32 mm.

Der Piktogrammvertrag erhält eine erforderliche `viewBox`. Die vorhandenen `define*()`-Helfer
setzen für ihre bisherigen 254 Definitionen weiterhin 32 × 32 mm; `defineLeadership()` verlangt
den Wert explizit und besitzt keinen Default. Renderfälle, `Drawing`, Box-/Clipping- und
Textlesbarkeitsgates konsumieren immer `definition.viewBox`, nicht eine globale Konstante.

Für neun direkte Leadership-Zeichen ist die ViewBox 32 × 32 mm, für D.1.1 32 × 46 mm. `Drawing`
und die SVG-ViewBox können
bereits rechteckig sein; der heutige Pixel-Viewport ist dagegen noch quadratisch. LFH-420 ändert
deshalb den Rendervertrag präzise und rückwärtskompatibel:

- `SvgOptions.size` und die gleichnamige Canvas-Option bleiben die gewünschte **Pixelbreite**;
- ein gemeinsamer Helfer `rasterDimensionsForWidth(viewBox, widthPx)` verlangt eine positive,
  endliche Ganzzahl und liefert `widthPx` sowie
  `heightPx = ceil(widthPx * viewBox.height / viewBox.width)`;
- SVG- und Canvas-Renderer setzen genau diese Pixelmaße und skalieren in X/Y einheitlich von der
  Breite; unabhängiges Strecken beider Achsen ist ausgeschlossen;
- alle bestehenden 32 × 32-mm-Fälle behalten identische Maße und Bytes.

Für D.1.1 ergeben die vorhandenen Zielbreiten 16/24/32/64/128/256 px daher die Höhen
23/35/46/92/184/368 px. Mehrgrößen-Sheets prüfen beide tatsächlichen Rastermaße. Das
Textlesbarkeitsgate erhält die reale ViewBox und berechnet effektive Textpixel aus
`renderWidthPx / viewBoxWidthMm`, nicht aus einer fest verdrahteten 32-mm-ViewBox. Kontaktbogen-
Zeilen werden aus der maximalen tatsächlichen Bildhöhe plus Beschriftungszone bestimmt; eine
420-px-D.1.1-Zelle enthält somit ein 420 × 604-px-Bild ohne Überlappung.

Ein eigener Test hält fest, dass D.1.1 in 32 × 46 mm vollständig sichtbar ist und in einer
32 × 32-mm-ViewBox am `outside-viewbox`-Gate scheitern würde.

### 7.3 D.2 bleibt direkt

D.2 teilt private Konstruktionshelfer für Kreis, abgesenkten Kreis, Dach und wiederkehrende
Innengeometrie. Daraus entsteht keine öffentliche Kreis- oder Standortachse.

Insbesondere wird `circle-12` nicht wiederverwendet: dieser Körper ist an die weißen F.3-
HiOrg-Quellen gebunden und lehnt andere Organisationen fail-closed ab. Die gelbe D.2-Fläche
beweist allein keine Organisation `fuehrung-leitung`.

### 7.4 Offene Kopfkappe D.3.14/D.3.15

Beide Zeichen dürfen einen privaten Geometriehelfer für ihre offene Kappe teilen. Sie bleiben
getrennte Leadership-Definitionen, bis ein Domainreview eine gemeinsame fachliche Bedeutung
belegt. Der Slice führt keinen `functionRole` für eine ungeklärte Bedeutung ein.

## 8. Datenfluss und Auflösung

### 8.1 Rezepte

1. Ein Rezept enthält `SymbolSpec` mit `functionRole` und den belegten vorhandenen Achsen.
2. `validateSpec()` prüft Körperart, Kopfart, Rollenlayout, Beschriftungsmetriken und Konflikte.
3. `composeFromCatalog()` löst Grundkörper, Organisation, Stärke/Verwaltungsstufe,
   Funktionsdefinition und Innenmarken über Ports auf.
4. `compose()` platziert und zeichnet die Primitive in deterministischer Reihenfolge.
5. Titel und maschinenlesbare Beschreibung nennen Funktion, Körper, Organisation, Kopf und
   sichtbare Trägerangaben.

### 8.2 Direkte Definitionen

1. `LeadershipId` löst genau eine Definition und Variante auf.
2. Die Definition liefert ihre eigene ViewBox und ihre Primitive.
3. Der Renderfall übernimmt diese ViewBox unverändert.
4. Dieselben Metadaten-, Kontrast-, Clipping-, Snapshot- und Mehrgrößengates gelten wie für
   bestehende Standalone-Definitionen.

## 9. Fail-closed-Regeln

Der Slice führt mindestens folgende Schutzregeln ein:

- `function-role-requires-measured-kind` — Rolle und Körperart sind nicht belegt;
- `function-role-requires-measured-layout` — Rolle hat keine vollständige Layoutdefinition;
- `function-role-head-mismatch` — Rolle verlangt eine andere Kopfart;
- `administrative-level-not-measured` — die Verwaltungsstufe besitzt keine Kopfquelle;
- `head-zone-conflict` — Stärke und Verwaltungsstufe sind zugleich gesetzt;
- `function-role-label-metrics-required` — ein Rollen-/Trägerlauf besitzt keine vollständigen
  Messwerte;
- `leadership-viewbox-required` — eine direkte Definition besitzt keine positive, endliche
  ViewBox;
- `leadership-outside-viewbox` — sichtbare Geometrie verlässt ihre deklarierte ViewBox;
- unbekannte Body-Mark-/Körper-Kombinationen werfen;
- D.2 darf nicht über `circle-12` oder eine erfundene Organisation still komponiert werden;
- D.3.14/D.3.15 dürfen nicht auf den Solid-Cap-Funktionsträger zurückfallen.

Blanker Text, nichtendliche Maße, negative Boxen, überlappende Rollen-/Trägerboxen und Text unter
der erklärten Einsatzgröße bleiben Gate-Befunde.

## 10. Provenienz, Manifest und Review

### 10.1 Manifest

Jede der 37 Referenzdateien besitzt nach LFH-420 genau eine Manifestzeile; D.1.9 führt Primary
und Alternative unter derselben Abschnittsnummer mit unterschiedlichen Varianten. D.3.7 behält
seinen bestehenden Schlüssel.

Der Coverage-Scope ersetzt den Einzelanspruch `D.3.7` erst nach vollständiger Umsetzung durch
`D`. Weil das allgemeine Präfixgate Vollständigkeit nicht beweist, halten eigene Tests fest:

- exakt zehn D.1-Dateien einschließlich D.1.9 Alternative;
- exakt sieben D.2-Abschnitte;
- exakt fünfzehn D.3-Abschnitte;
- exakt fünf D.4-Abschnitte;
- exakt 37 Darstellungen und 36 neue Schlüssel gegenüber der Basis;
- keine doppelte oder verwaiste Manifest-/Reviewzeile.

### 10.2 Reviewträger

Jede neue Manifestzeile erhält:

- technischen Reviewtext mit Geometrie-, Snapshot- und Referenzbegründung;
- ein eigenes `domain: pending`-Objekt;
- eine klare Trennung zwischen Quellenbefund und bewusster Abweichung.

D.3.7 behält sein vorhandenes Domainreview, erhält aber aktualisierte technische Evidenz für die
Migration.

### 10.3 Verbindliche Zählpunkte

| Zählpunkt | Basis | Nach LFH-420 |
|---|---:|---:|
| Rezepte | 174 | **200** |
| Renderfälle | 442 | **478** |
| Manifestzeilen | 461 | **497** |
| Rezept-/Basissymbol-SVG-Snapshots | 188 | **214** |
| eigenständige Piktogramm-SVG-Snapshots | 254 | **264** |
| Mehrgrößen-Sheets einschließlich Organisationsprofil | 443 | **479** |
| offene Reviewobjekte einschließlich 13 Quellen- und 1 Profilreview | 475 | **511** |

Die Zahlen werden aus Registern abgeleitet und durch Tests belegt. D.3.7 ändert zwei vorhandene
Snapshotdateien, erhöht aber keinen Zählpunkt.

## 11. Tests und Verifikation

### 11.1 TDD je Teilslice

Jede Produktionsänderung beginnt mit einem wirksamen RED-Test. Gültige REDs scheitern am
fehlenden Vertrag oder an fehlenden Daten, nicht an Imports, Syntax oder Fixtures. Danach folgen
kleinstes GREEN, fokussierter Test, betroffene Paketgates und unabhängiges Review.

Die spätere Implementierungsplanung schneidet mindestens:

1. Funktionsträger-/Verwaltungskopf-Vertrag und D.3.7-Migration;
2. D.1 einschließlich D.1.9-Varianten und D.1.1-ViewBox;
3. sieben direkte D.2-Definitionen;
4. D.3 ohne D.3.7;
5. D.4, Gesamtcoverage und Evidenz.

### 11.2 Fokussierte Verträge

Die fokussierten Tests prüfen:

- Vollständigkeit und exakte 26/10-Aufteilung;
- Rollenauflösung und falsche Rolle-/Körper-Paare;
- gemessene Formation-/Person-Funktionsträgergeometrie;
- alle drei Verwaltungsstufenköpfe und drei abgelehnte Stufen;
- D.3.7-Migration als Bild- und Strukturregression;
- D.1.9 Primary/Alternative und getrennte Variantenkeys;
- Leadership-ID-/Definition-/Manifest-Bijektion;
- D.1.1-ViewBox und rechteckige Rasterausgabe;
- Box, Clipping, Kontrast, Textmetrik und `minRenderPx`;
- direkte und Mehrgrößen-Snapshots;
- byteidentische Bestands-Snapshots außer D.3.7;
- `D`-Scope erst bei 37/37.

### 11.3 Gesamtgate

Vor Veröffentlichung laufen bis zum echten Prozessende:

```bash
rtk proxy ./node_modules/.bin/tsx \
  out/tools/generate-lfh420-contact-sheets.ts \
  --verify \
  --reference-root /Users/rubeen/dev/personal/taktik/taktische-zeichen \
  --out out/lfh-420/contact-sheets
rtk pnpm typecheck
rtk pnpm test
rtk pnpm cli coverage
rtk git -c core.fsmonitor=false diff --check
rtk git -c core.fsmonitor=false status --short
```

Snapshot-Aktualisierungen erfolgen nur nach semantischen und geometrischen Assertions. `-u`
gehört nicht in das abschließende Verifikationsgate.

## 12. Visuelle QA und Screenshot-Beleg

### 12.1 Lokale Artefakte

Unter dem ignorierten Pfad `out/lfh-420/contact-sheets/` entstehen:

- `LFH-420-D.1.png` mit zehn Referenz-/Katalogpaaren;
- `LFH-420-D.2.png` mit sieben Paaren;
- `LFH-420-D.3.png` mit fünfzehn Paaren einschließlich des migrierten D.3.7;
- `LFH-420-D.4.png` mit fünf Paaren;
- `manifest.json` mit Ticket, Git-SHA, Generatorversion, Dateinamen sowie SHA-256 für jede
  Referenz, Katalogausgabe und jeden Kontaktbogen.

Referenz und Katalog werden getrennt mit `@resvg/resvg-js` gerastert und erst danach montiert.
So gehen weder Schrift noch Geometrie durch verschachtelte SVG-Images verloren.

Der ebenfalls ignorierte Generator liegt während der Ausführung unter
`out/tools/generate-lfh420-contact-sheets.ts` und wird reproduzierbar so aufgerufen:

```bash
rtk proxy ./node_modules/.bin/tsx \
  out/tools/generate-lfh420-contact-sheets.ts \
  --reference-root /Users/rubeen/dev/personal/taktik/taktische-zeichen \
  --out out/lfh-420/contact-sheets \
  --width 420

rtk proxy ./node_modules/.bin/tsx \
  out/tools/generate-lfh420-contact-sheets.ts \
  --verify \
  --reference-root /Users/rubeen/dev/personal/taktik/taktische-zeichen \
  --out out/lfh-420/contact-sheets
```

Der Generator sortiert natürlich nach Abschnitt und Variante, verwendet keine Zeitstempel und
validiert vier erwartete Bögen, exakt 37 eindeutige `(section, variant)`-Paare sowie D.3.7 genau
einmal. `manifest.json` enthält zusätzlich Zielbreite, tatsächliche Pixelmaße und die vollständige
Zuordnung. `--verify` prüft vorhandene Dateien und deren Hashes, die im Manifest gespeicherte
Git-SHA gegen `HEAD`, Menge, Eindeutigkeit und fehlende Paarungen. Der Referenzbestand bleibt
bewusst lokal; CI reproduziert diese Bilder nicht.

### 12.2 Sichtprüfung

Jeder finale Kontaktbogen wird in Originalauflösung geöffnet. Das Reviewprotokoll unter
`docs/reviews/2026-08-26-lfh-420-visual-qa.md` führt alle 37 Paarungen und nennt:

- Körperhülle, Kopfzone, Innenmarken und Textlage;
- Clipping und Lesbarkeit in kleiner/großer Rasterung;
- sichtbare Quellenbefunde und bewusste Abweichungen;
- ausdrücklich verbleibende Domainfragen.

Ein grüner Snapshot-Test ersetzt diese Sichtprüfung nicht.

Das lokale Abschlussgate enthält vor den Paketgates einen erfolgreichen `--verify`-Lauf. Die vier
PNGs werden anschließend jeweils in Originalauflösung geöffnet; 37/37 Sichtungen werden im
Reviewprotokoll abgehakt.

### 12.3 Finaler Handoff

Nach der späteren ausdrücklichen Nutzerentscheidung vom 26. August 2026 werden die vier finalen
PNGs ausschließlich in der finalen Nachricht als lokale, klickbare Bilddateien übergeben. Sie
werden weder in den GitHub-PR hochgeladen noch dort eingebettet oder verlinkt. PNGs und Generator
bleiben untracked; im Repository stehen reproduzierbare SVG-Snapshots, Manifest-/Testverträge
und das textuelle Reviewprotokoll.

## 13. Branch, Commits, PR und ClickUp

Die Arbeit erfolgt auf `codex/lfh-420-anhang-d` gegen den aktuell verifizierten `main`-Stand.
Commits folgen Conventional Commits mit Scope `lfh-420` und trennen Vertrags-, Daten-,
Review-/Evidenz- und Korrekturschritte nachvollziehbar.

Nach grünem Gesamtgate und unabhängiger Abschlussprüfung wird ein Draft-PR gegen `main` erstellt.
Der PR enthält:

- Link auf LFH-420;
- 26/10-Aufteilung und D.3.7-Migration;
- Zählpunkte und genaue Gate-Ausgaben;
- Link auf das eingecheckte textuelle QA-Protokoll;
- technische Grenzen und offene Domainreviews.

Vor Übergabe gelten zusätzlich diese externen Gates:

1. Der PR-Head entspricht der Git-SHA im Screenshot-Manifest.
2. GitHub Actions `CI / test` ist für genau diesen Head-SHA erfolgreich.
3. Alle vier lokalen PNGs werden in Originalauflösung geöffnet und über das Manifest dem
   PR-Head zugeordnet; 37/37 Sichtungen sind im QA-Protokoll dokumentiert.
4. Ein unabhängiger Abschlussreview prüft Diff, lokale Gateausgaben, Manifest und alle vier
   Originalbilder; offene technische Findings werden behoben und erneut gegatet.
5. PR-Checks und Head-/Manifest-SHA werden unmittelbar vor der ClickUp-Aktualisierung erneut
   abgeglichen. Im anschließenden finalen Handoff werden genau die vier manifestgebundenen
   lokalen PNGs als klickbare Bilddateien ausgegeben.

Der PR bleibt ohne ausdrückliche Anweisung im Draft-Zustand; dieser Slice autorisiert weder
`ready for review` noch Merge.

ClickUp erhält den PR-Link und eine Evidenzzusammenfassung und wird auf `in review` gesetzt.
Ohne Merge wird LFH-420 nicht als `shipped` oder `done` bezeichnet.

## 14. Verworfenes

### 14.1 Alle 36 Zeichen direkt definieren

Verworfen, weil 24 Zeichen belegte Strukturachsen wiederholen. Der Ansatz vervielfacht Körper,
Kopf, Kappe, Textzonen und Trägerlogik und beantwortet die im Task verlangte generative
Reichweite nicht.

### 14.2 Alle 36 Zeichen als Rezepte erzwingen

Verworfen, weil D.2 vollständige Ortszeichen statt zerlegter `SymbolSpec`-Achsen liefert,
D.3.14/D.3.15 eine fachlich ungeklärte offene Kappe tragen und D.1.1 eine nichtquadratische
Ansicht mit externer Geometrie besitzt. Öffentliche Achsen aus bloßer Formähnlichkeit wären
erfundene Semantik.

### 14.3 D.2 als `state.*` oder wiederverwendetes `circle-12`

Verworfen. Appendix D.2 ist kein Kapitel-5.8-State-Bestand. `circle-12` ist quellengebunden an
weiße F.3-HiOrg-Zeichen; seine Wiederverwendung würde einen bewussten fail-closed Vertrag
aufweichen.

### 14.4 Verwaltungsstufen aus Sternanzahlen interpolieren

Verworfen. Für drei von sechs Stufen existiert kein Kopfbeleg; die Sechs-Stern-Geometrie
widerlegt zudem eine einfache lineare Teilungsregel. Nur gemessene Stufen werden gebaut.

### 14.5 D.1.1 auf 32 × 32 mm stauchen oder abschneiden

Verworfen. Beides verändert die Referenz sichtbar und würde ein grünes Gate durch
Informationsverlust erkaufen. Die explizite 32 × 46-mm-ViewBox ist der kleinere und ehrlichere
Vertrag.
