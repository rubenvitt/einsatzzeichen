# Entscheidung: Anhang C beginnt mit C.1.3

Datum: 26. August 2026  
Status: C.1.3 technisch umgesetzt und visuell geprüft; Domainreview weiterhin `pending`  
Scope: ausschließlich `C.1.3` — Löschzug einer Feuerwehr

## Inventar und Entscheidung

Der lokale Referenzbestand und das Manifest ergeben vor diesem Slice:

| Bereich | Bestand | bereits umgesetzt | offen |
|---|---:|---:|---:|
| C.1 Einheiten | 15 Dateien | 2 (`C.1.1`, `C.1.2`) | 13 |
| C.2 Fahrzeuge | 31 Abschnitte, 44 Darstellungen mit 13 Alternativen | 0 | 44 |
| **Anhang C** | **59 Darstellungen** | **2** | **57** |

Drei Zuschnitte wurden geprüft:

| Option | Bewertung |
|---|---|
| Reiner Scoping-PR | Dokumentiert die 57 offenen Darstellungen, liefert aber keinen ausführbaren, technisch prüfbaren Katalogzuwachs. |
| Nur C.1.3 | Kleinster eigenständig lieferbarer Abschnitt; verwendet Formation, Feuerwehrfarbe, `zug` und die vorhandene `bodyMarks`-Schnittstelle für die an C.1 eigenständig vermessene `fire-fighting`-Fassung. |
| C.1.3 bis C.1.4 | Vergrößert Implementierungs- und Reviewfläche, ohne die nächste Architekturgrenze zu klären oder einen vollständigen Oberabschnitt zu erreichen. |

Entschieden ist **C.1.3 allein**. Der Slice wächst um genau eine Darstellung und bleibt damit
fachlich und technisch einzeln prüfbar.

## Technischer Grund und korrigierte Annahme

Der Formationskörper, die Feuerwehrfarbe und die Stärke `zug` waren bereits vorhanden. Für die
randbündige Innengeometrie existiert mit `bodyMarks` ebenfalls die passende Schnittstelle. Die
für C.1 vermessene Brandbekämpfungsmarke besteht aus dem linken Stamm
`(1|16) → (21|16)` und den zwei Diagonalen `(21|16) → (31|6)` sowie
`(21|16) → (31|26)`; einen rechten Horizontalast gibt es nicht.

Zunächst war die eigenständige Kapitel-4-Boxfassung von `fire-fighting` verwendet worden. Diese
Komposition bestand Fingerprint-, Accessibility- und ViewBox-Gates ohne Befund, weil diese Gates
die konkrete C.1-Innengeometrie nicht gegen die lokale Referenz prüfen. Der verpflichtende
Sichtvergleich zeigte den zusätzlichen rechten Horizontalast und widerlegte die Annahme. Die
Kapitel-4-Fassung bleibt unverändert; C.1.1 bis C.1.3 verwenden jetzt über `bodyMarks` gemeinsam
die eigenständig vermessene C.1-Fassung.

## Grenze des Slice

C.1.4 würde zwar noch keinen neuen Mechanismus erzwingen, erhöht für diesen ersten Slice aber
nur die Reviewfläche. Spätestens vor C.1.5 ist eine bewusste neue Entscheidung nötig: Das Zeichen
besitzt eine eigene `FZ-`-Beschriftungszone. C.1.6 führt außerdem eine Rechteckmarke in der
Kopfzone, die der heutige Vertrag für kreisförmige `HeadMark`s nicht modelliert.

C.2 bleibt vollständig außerhalb dieses Slice und fachlich offen. Insbesondere lässt sich die
Fahrzeugkategorie nicht zuverlässig aus den Dateinamen ableiten; eine technische Konstruktion
darf diese fachliche Zuordnung nicht vorwegnehmen.

## Scope- und Vollständigkeitsvertrag

Der beanspruchte Produktscope lautet exakt `C.1.3`. Weder `C.1` noch `C` wird durch diesen Slice
beansprucht. Erst ein expliziter Lückenlosigkeitstest über `C.1.1` bis `C.1.15` darf später die
Einzelscopes zu `C.1` verdichten. Nach C.1.3 bleiben 56 Darstellungen des Anhangs C offen.

Der technische Review für `bbk-babz-2025:C.1.3#primary` ist aktuell; das Domainreview bleibt
`pending`. Technische Übereinstimmung bestätigt weder Benennung noch Bedeutung oder
einsatztaktische Eignung.

## Lizenz- und Veröffentlichungsgrenze

Aus dem lokalen BABZ-Bestand werden ausschließlich Messwerte abgeleitet und Geometrien unabhängig
rekonstruiert. Die Nutzungsgrundlage bleibt ungeklärt. Weder die Referenzdatei noch ein
Referenzraster oder ein Referenz-vs.-Katalog-Bild wird committed oder veröffentlicht. Der
versionierte Screenshot enthält ausschließlich aus den Katalogsnapshots gerenderte Ausgabe.
