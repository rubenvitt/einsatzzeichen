# D.1: Kapitel 4 technisch vollständig

> Entscheidung vom 6. August 2026
> Status: technische Umsetzung abgeschlossen, fachliche Reviews offen

## 1. Inventar

D.1 umfasst alle 88 Piktogrammabschnitte aus Kapitel 4 der projektinternen Coverage-Baseline.
Durch zusätzliche Darstellungen für `4.1.6`, `4.1.7`, `4.1.8` und `4.7.10` enthält der Katalog
insgesamt 92 Darstellungen und damit genau vier Alternativen.

## 2. Variantenmodell

Die eindeutige Identität einer Darstellung ist das Paar
`(PictogramId, DepictionVariant)`. Eine Komposition löst ohne explizite Variantenangabe weiterhin
`primary` auf. Alternativen sind dadurch separat prüf- und renderbar, ohne das bisherige
Kompositionsverhalten zu verändern.

## 3. Autorschaft

Alle Koordinaten der Kapitel-4-Darstellungen sind unabhängige Millimeterkonstruktionen. Aus den
lokalen BABZ-Referenzen oder einem Upstream-Bestand wurden keine Pfaddaten, Koordinaten oder
transformierten Geometrien kopiert. Die lokalen Referenzen dienen ausschließlich der visuellen
und semantischen Prüfung und bleiben außerhalb des Repositorys.

## 4. Technische Evidenz

Die technische Evidenz umfasst 92 lokale Contract-/Snapshotfälle und 103 globale Renderfälle.
Damit sind jede Kapitel-4-Darstellung und der gesamte renderbare Katalogbestand abgedeckt. Das
Coverage-Gate meldet null fehlende technische Evidenz.

Diese Evidenz umfasst unter anderem Kommando-, Box-, Clipping-, Mehrgrößen-, Theme-, Metadaten-
und viewBox-Prüfungen. Sie ist reproduzierbar, ohne dass der lokale Referenzbestand in CI
vorhanden sein muss.

## 5. Fachliche Grenze

Alle 92 Domainreviews zu Kapitel 4 bleiben `pending`.
Die technischen Gates begründen keine taktische Korrektheit, keine fachliche Freigabe und keine
normative Geltung. Semantik,
Verwechslungsfreiheit, Profilzuordnung und einsatztaktische Eignung bleiben Gegenstand einer
Einzelprüfung durch eine Person mit entsprechender Fachkunde.

Mit den zwölf offenen Quellenreviews und dem offenen Profilreview umfasst die Übergabe insgesamt
114 Manifestreviews und 127 Reviewträger. Es wurde weder ein menschlicher Reviewer zugewiesen
noch ein fachlicher Status auf `approved` gesetzt.

## 6. Nächster Slice

D.2 ist der nächste inhaltliche Slice. Er umfasst die 61 Piktogrammabschnitte aus Kapitel 5.8;
diese Inhalte sind nicht Bestandteil von D.1.
