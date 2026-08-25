# Visual QA: Anhang F-d

Datum: 26. August 2026
Scope: F.2.10 bis F.2.17
Status: technische Einzelprüfung abgeschlossen; Domain-Review pending

## Prüfaufbau

Alle acht Original-SVGs wurden einzeln auf 900 px gerastert. Nach semantischem GREEN und dem
Snapshot-Update wurden auch die acht aktuellen Katalogausgaben einzeln auf 900 px gerastert und
jeweils gegen Original, direktes Snapshot und Mehrgrößen-Snapshot geprüft. Bewertet wurden Hülle,
Band, Chassis, Innenmarken und jede sichtbare Beschriftung. Diese Prüfung ist nicht der finale
Task-6-Kontaktbogen.

## Paarprotokoll

| Referenzdatei | Rezept | Beobachtung / Ergebnis |
|---|---|---|
| `F.2.10_Betreuungskombi.svg` | `F.2.10` | Normaler Landrumpf, `kfz-kategorie-1`, Betreuungsdach und der quellenvermessene Lauf `BTKombi` bestätigt. |
| `F.2.11_Betreuungskombi mit Material zum Einrichten einer Anlaufstelle.svg` | `F.2.11` | Wie F.2.10 plus Ring r 6 um (16|19), Vierwegearme und unterer Gabelsteg. Die Ausgabe behauptet keine unbelegte Capability. |
| `F.2.12_Gerätewagen Betreuung.svg` | `F.2.12` | Drei sichtbare Räder der `kfz-kategorie-2`, Betreuungsdach und der größere Lauf `GwBT` bestätigt. |
| `F.2.13_Betreuungs-LKW mit mobiler Einsatzküche.svg` | `F.2.13` | `kfz-kategorie-1`, Fahrzeug-Fußband y = 23…26, Löffelsilhouette und Schüssel-Mittellinie r ≈ 3,5 sowie `GwBT` bestätigt. Dach endet auf der Bandoberkante; kein Überzeichnen des Chassis. |
| `F.2.14_Gerätewagen Logistik der Betreuung.svg` | `F.2.14` | Zwei Räder, Fahrzeug-Fußband und Lauf `GwLog` bestätigt. Die Quelle zeigt tatsächlich zwei Räder; die ältere Ein-Rad-Vorannahme ist verworfen. |
| `F.2.15_Geräteanhänger Betreuung.svg` | `F.2.15` | Eigene Anhängerhülle einschließlich Deichsel, ein Rad und Betreuungsdach über (17,5|8) bestätigt; kein Textlauf. |
| `F.2.16_Fahrzeug der Betreuung_Transport 40 Betroffene.svg` | `F.2.16` | `40`, zwei Räder und Acht-Speichen-Ring r 5 um (16|19) bestätigt. Der Ring liegt sichtbar tiefer als die F-c-Fassung. |
| `F.2.17_Betreuungs-LKW_Trinkwasserversorgung.svg` | `F.2.17` | `BtlLKW`, Fußband und die aus beiden Konturen gemittelte Armatur bestätigt: Stamm x = 18, Balken x = 16,5…19,5, Rohr y = 17,5, sichtbare Endkappe bis y = 20,5. |

## Vollständige Laufmessungen

Die Tabelle hält dieselben sieben Quellenzeilen wie der Schema-Vertrag fest. Versalhöhe und
Grundlinie stammen aus flachfüßigen Glyphen; der Anker folgt aus linker Tintenkante plus
Arimo-Seitenlager. Körperkante links ist x = 1 mm, Körperoberkante y = 5,75 mm und die innere
rechte Textgrenze x = 29 mm.

| Key | Lauf | Versalhöhe | Grundlinie absolut / ab Körperoberkante | Tintenkante links | Anker absolut / ab linker Körperkante | Breite bis x=29 |
|---|---|---:|---:|---:|---:|---:|
| `F.2.10` | `BTKombi` | 2,191447 | 10,999923 / 5,249923 | 1,775524 | 1,514230 / 0,514230 | 27,485770 |
| `F.2.11` | `BTKombi` | 2,191447 | 10,999923 / 5,249923 | 1,775524 | 1,514230 / 0,514230 | 27,485770 |
| `F.2.12` | `GwBT` | 2,919225 | 11,999691 / 6,249691 | 2,223903 | 2,010503 / 1,010503 | 26,989497 |
| `F.2.13` | `GwBT` | 2,919225 | 11,999691 / 6,249691 | 2,223903 | 2,010503 / 1,010503 | 26,989497 |
| `F.2.14` | `GwLog` | 2,432746 | 10,999923 / 5,249923 | 2,186861 | 2,009024 / 1,009024 | 26,990976 |
| `F.2.16` | `40` | 2,749893 | 12,499576 / 6,749576 | 2,589026 | 2,497298 / 1,497298 | 26,502702 |
| `F.2.17` | `BtlLKW` | 2,432746 | 11,499807 / 5,749807 | 2,056334 | 1,766269 / 0,766269 | 27,233731 |

## Geometrische Nachprüfung

- F.2.13: Die Löffeltinte endet exakt bei x = 12,113991…13,886340 und
  y = 14,267800…21,600150 mm. Außen-/Innenradius der Schüssel messen 3,7496/3,2501 mm; der
  Katalog zeichnet ihre gemittelte Mittellinie und gemittelte Keilübergänge statt einer zu großen
  Kreisabkürzung.
- F.2.17: Die Quellfüllkanten 17,75…18,25 mm belegen Stamm-Mittellinie x = 18. Der obere Balken
  belegt x = 16,5…19,5 bei y = 15,5; der Rohrbogen verwendet die gemittelten Kontrollen
  (20,995|17,5), (22|18,505), (22|20,4) und endet sichtbar bei y = 20,5.
- F.2.13, F.2.14 und F.2.17 teilen ausschließlich die separat am Fahrzeug belegte Bandbox
  x = 1…31, y = 23…26. Die gleichnamige Formationsvariante wird weder skaliert noch als
  Body-Mark-Fallback benutzt.
- Die technischen Marken aus F.2.11/F.2.16 bleiben in Text und A11y rein geometrisch. Die
  vorhandenen Semantiken `care`, `meal-preparation` und `drinking-water` werden nicht dupliziert.

## Querschnittsergebnis

- 8/8 Referenzen sind literal einem Rezept zugeordnet; F.2.10 bis F.2.17 sind lückenlos.
- 8/8 direkte und 8/8 Mehrgrößen-Snapshots sind vorhanden; der No-update-Gate lief mit 519/519
  Tests grün.
- Beim Update änderten sich nur die 16 neuen F-d-Snapshotdateien. Ein Hashvergleich aller anderen
  Snapshotdateien vor und nach dem Lauf war leer; insbesondere F-a und F-c blieben bytegleich.
- Normal, `foot-band` und Anhänger verwenden getrennte, bounds-relative Registry-Zweige.
  Unbekannte Art-/Varianten-/Markenpaare sowie ungültige oder partielle `topLeftMetrics` werden
  abgelehnt.
- `topLeftMetrics` beeinflusst ausschließlich Versalhöhe, Grundlinie und Anker des sichtbaren
  Laufs. A11y liest weiterhin den Text, nicht die drei Maßzahlen.
- Der Bestand erreicht 118 Rezepte, 386 Renderfälle und 405 Manifestzeilen.

## Offene fachliche Punkte

Eine fachkundige Person muss die Bedeutung der Vierwegeform aus F.2.11, die Einordnung des
versetzten Rings aus F.2.16 und die Organisationszuordnung der weißen F-Körper bestätigen. Der
y=6,096-mm-Beginn der inneren Kontur von F.2.17 bleibt ein Quellen-Finding; die gemeinsame
Fahrzeughülle bleibt die getrennt dokumentierte Katalogabweichung. Bis zur Fachentscheidung stehen
alle acht Domain-Reviews auf `pending`.
