# Visual QA: Anhang G

Datum: 26. August 2026
Scope: alle 21 primary-Darstellungen G.1 bis G.8
Status: technische Paarprüfung abgeschlossen; eine bekannte Palettenabweichung und 21
fachliche Domain-Reviews offen

## Reproduktionsvertrag

Der Generator liest ausschließlich die 21 in den Rezepten benannten lokalen Referenz-SVGs,
rastert Referenz und Katalog mit derselben eingebetteten Arimo-Konfiguration und schreibt nur in
den ignorierten Ausgabeordner. `REFERENCE_ROOT` bezeichnet den lokalen, read-only gehaltenen
Referenzbestand; sein tatsächlicher Speicherort gehört nicht in Git.

```sh
REFERENCE_ROOT=/path/to/local/reference-root
pnpm cli visual-proof --reference-root "$REFERENCE_ROOT" --out out/lfh-421/anhang-g-reference-vs-catalog.png
```

- PNG: `out/lfh-421/anhang-g-reference-vs-catalog.png`
- Raster: 2160 × 2520 px
- Dateigröße: 346461 Bytes
- SHA-256: `f5f299c0ba630615d0a4b1077acef97c14b41c5eade3f67f0f093e20ce09e22b`
- Aufbau: 3 Spalten × 7 Zeilen, exakt in G-Rezeptreihenfolge
- Ablage: durch `.gitignore` gedeckt; weder PNG noch Referenz-SVGs werden committet

Der PNG wurde nach dem letzten Render in Originalauflösung geöffnet und vollständig von links
nach rechts, oben nach unten geprüft. Jede Karte zeigt lesbare G-ID und Titel sowie die lokale
Referenz links und den aktuellen Katalog rechts.

## Einzelprüfung

„Passend“ bedeutet hier technische Bildzuordnung im Paarvergleich, keine fachliche Freigabe der
Organisation oder Bedeutung.

| ID | Körperart und Organisationsfarbe | Fußband, Kopf oder Räder | BodyMark und Labels | Clipping / Ergebnis |
| --- | --- | --- | --- | --- |
| G.1 | Formation, Hilfsorganisation weiss; oben offen wie Quelle | schwarzes Fußband; kopflos | `fuels-consumables`; keine Labels | kein Clipping; passend |
| G.1.1 | Formation, Feuerwehr rot; geschlossen | schwarzes Fußband; `trupp` mit einem Punkt | `maintenance`; keine Labels | kein Clipping; passend |
| G.1.2 | Formation, Hilfsorganisation weiss; geschlossen | schwarzes Fußband; `trupp` mit einem Punkt | `catering`; `DLRG` unten rechts sichtbar | kein Clipping; passend |
| G.1.3 | Formation, Feuerwehr rot; geschlossen | schwarzes Fußband; `trupp` mit einem Punkt | `fuels-consumables`; keine Labels | kein Clipping; passend |
| G.1.4 | Formation, Hilfsorganisation weiss; geschlossen | schwarzes Fußband; `zug` mit drei Punkten | `catering`; keine Labels | kein Clipping; passend |
| G.1.5 | Formation, Hilfsorganisation weiss; geschlossen | schwarzes Fußband; `gruppe` mit zwei Punkten | `maintenance`; keine Labels | kein Clipping; passend |
| G.2 | Formation, Hilfsorganisation weiss; oben offen wie Quelle | schwarzes Fußband; kopflos | `drinking-water`; keine Labels | kein Clipping; passend |
| G.2.1 | Landfahrzeug, Hilfsorganisation weiss | schwarzes Fußband; zwei Räder | `maintenance`; keine Labels | kein Clipping; passend |
| G.2.2 | Anhänger, Hilfsorganisation weiss | schwarzes Fußband; Deichsel und ein Rad | `maintenance`; keine Labels | kein Clipping; passend |
| G.2.3 | Anhänger, Hilfsorganisation weiss | schwarzes Fußband; Deichsel und zwei Räder | `meal-preparation`; keine Labels | kein Clipping; passend |
| G.3 | Formation, Hilfsorganisation weiss; oben offen wie Quelle | schwarzes Fußband; kopflos | `water-conveyance`; keine Labels | kein Clipping; passend |
| G.3.1 | 12-mm-Kreis, Feuerwehr rot | schwarzes Fußband; kein Kopf/Fahrwerk | `catering`; keine Labels | kein Clipping; passend |
| G.3.2 | 12-mm-Kreis, Polizei grün | schwarzes Fußband; kein Kopf/Fahrwerk | `meal-preparation`; keine Labels | kein Clipping; Geometrie passend, bekannte Farbabweichung |
| G.3.3 | 12-mm-Kreis, Hilfsorganisation weiss | schwarzes Fußband; kein Kopf/Fahrwerk | `fuels-consumables`; keine Labels | kein Clipping; passend |
| G.3.4 | 12-mm-Kreis, Führung/Leitung gelb | schwarzes Fußband; kein Kopf/Fahrwerk | `maintenance`; keine Labels | kein Clipping; passend |
| G.3.5 | 12-mm-Kreis, Bundeswehr braun | schwarzes Fußband; kein Kopf/Fahrwerk | `fuels-consumables`; `Diesel` innen und `Bw` außen beide schwarz sichtbar | kein Clipping; passend |
| G.4 | Formation, Hilfsorganisation weiss; oben offen wie Quelle | schwarzes Fußband; kopflos | `power-supply`; keine Labels | kein Clipping; passend |
| G.5 | Formation, Hilfsorganisation weiss; oben offen wie Quelle | schwarzes Fußband; kopflos | `catering`; keine Labels | kein Clipping; passend |
| G.6 | Formation, Hilfsorganisation weiss; oben offen wie Quelle | schwarzes Fußband; kopflos | `meal-preparation`; keine Labels | kein Clipping; passend |
| G.7 | Formation, Hilfsorganisation weiss; oben offen wie Quelle | schwarzes Fußband; kopflos | `maintenance`; keine Labels | kein Clipping; passend |
| G.8 | Formation, Hilfsorganisation weiss; oben offen wie Quelle | schwarzes Fußband; kopflos | `waste-disposal`; keine Labels | kein Clipping; passend |

## Materielle Befunde und TDD-Korrekturen

Der erste Kontaktbogen ließ `DLRG` in G.1.2 sowie `Diesel` und `Bw` in G.3.5 auf der
Katalogseite unsichtbar. Ein fokussierter RED belegte, dass eingebetteter SVG-Text im
Proof-Rasterpfad fehlte. Der Generator rastert seither beide SVG-Seiten vor der Einbettung mit
den bestehenden `resvgFontOptions()`; alle drei Läufe sind im finalen PNG sichtbar.

Die Referenz von G.3.5 widerlegte anschließend die vorläufige Task-2-Annahme von weissem
`Diesel`: die Tinte ist schwarz. Ein discrepancy-spezifischer RED erwartete schwarze Tinte und
scheiterte zunächst an `weiss`. Das Profil `circle-12/foot-band` setzt nun für `bottomCenter`
Schwarz; `formation/foot-band` behält die körperfarbenabhängige Tinte. Die Kontrastableitung
liest dieselbe Profilregel. Damit entfiel die frühere Weiss-auf-Braun-Ausnahme; `Bw` bleibt
unabhängig davon schwarz auf der Ausgabeoberfläche. Nur die direkten und mehrfach skalierten
G.3.5-Snapshots wurden für diesen Befund aktualisiert.

Acht Quellen — G.1, G.2, G.3 und G.4 bis G.8 — zeigen ihren kopflosen und unbeschrifteten
Formationskörper konsistent ohne Oberlinie. Das korrigiert das vorläufige Task-1-Modell eines
stets geschlossenen `formation/foot-band`-Rechtecks. Der echte RED erwartete an exakt diesen
acht Rezepten eine offene U-Kontur und erhielt zunächst den geschlossenen schwarzen Rahmen. Das
generische Profilmerkmal `openTopWhenHeadlessAndUnlabelled` öffnet jetzt nur in diesem belegten
Kontext. G.1.1 bis G.1.5 mit Kopf/Stärke, F.1.3/F.1.17 und Fahrzeug-, Anhänger- sowie
Kreisvarianten behalten die geschlossene Kontur und ihre bisherigen Snapshotbytes. Aktualisiert
wurden ausschließlich die acht direkt und acht mehrfach skaliert betroffenen Snapshots.

## Restunsicherheiten

- G.3.2 ist in der Quelle hellgrün (`#64dc32`), der Katalog verwendet die bereits genehmigte
  Organisationspalette `polizei` mit `gruen` (`#14a01e`). Die Form, Marke und das Fußband stimmen.
  Eine katalogweite Farbänderung wäre ohne gesonderte Prüfung nicht gerechtfertigt; die
  Abweichung bleibt daher ausdrücklich sichtbar.
- Die Zuordnung weisser Körper einschließlich DLRG zu `hilfsorganisation`, die Bedeutung der
  Logistikmarken im jeweiligen Einheitenkontext und die Betreiber-/Organisationsaussage der
  farbigen Kreiszeichen sind weiterhin fachlich ungeprüft.
- Alle 21 G-Domain-Reviews stehen `pending`. Der Kontaktbogen belegt technische Sichtprüfung,
  nicht fachliche Abnahme oder eine Lizenz zur Weitergabe der lokalen Quellen.
