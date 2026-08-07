# Kapitel 5.8 — Zustände (D.2)

Stand: 7. August 2026

## 1. Inventar

D.2 schließt ein unabhängiges, nach Kapitelreihenfolge geführtes Inventar aus 61 State-IDs und
67 Darstellungen für die 61 Abschnitte des Kapitels 5.8. Sechs IDs besitzen neben ihrer
Primary-Darstellung eine getrennte Alternative: 5.8.1.7, 5.8.1.8, 5.8.1.13, 5.8.1.14, 5.8.6.2
und 5.8.8.6. Die Varianten bleiben einzeln adressierbare Manifest- und Reviewträger.

## 2. Platzierung

Die Kapitel-5.8-Darstellungen sind eigenständige Zeichen. Ihre kanonische Platzierung und ihr
Clipping beziehen sich auf die 32×32-mm-ViewBox, nicht auf einen Formation- oder sonstigen
Host-Körper. D.2 erweitert weder `SymbolSpec.states` noch die allgemeine `compose()`-Integration;
eine beliebige State-/Grundzeichen-Komposition ist nicht Teil dieses Slice.

## 3. Kontrast

Der Kontrastvertrag beschreibt je Definition nur tatsächlich benachbarte Farbflächen und
Striche. Er verwendet nicht das für Capabilities passende kartesische Produkt mit
Organisationsfarben. Wo Farbflächen den Mindestkontrast nicht unmittelbar erreichen, stellt eine
schwarze Kontur oder Trennlinie die reale Farbnachbarschaft her. Richtung, Anzahl, Muster,
Kontur oder zusätzliche Marken bleiben zugleich ein nichtfarblicher Bedeutungskanal, damit die
Semantik nicht ausschließlich von Farbe abhängt.

## 4. Autorenschaft

Alle Geometrien sind unabhängige Millimeterkonstruktionen in der kanonischen ViewBox. Die lokalen
Referenzen wurden ausschließlich visuell und in rasterisierten Vergleichen beurteilt; Pfade,
Koordinaten, Transformationen und Geometrie aus BABZ-Dateien oder Upstream-Quellen wurden weder
kopiert noch extrahiert. `taktische-zeichen/` und das zugehörige ZIP bleiben ignoriert und
uncommitted. Ihre Nutzungs- und Lizenzgrundlage ist weiterhin ungeklärt.

## 5. Evidenz

Task 15 hat die lokale und vollständige technische Evidenz einschließlich Kommando-, Box-,
Standalone-Clipping-, Snapshot-, Kontrast-, Metadaten-, viewBox- und Mehrgrößengates
abgeschlossen. 159 lokale Piktogrammdarstellungen und 170 globale Renderfälle sind abgedeckt;
fehlende technische Evidenz gibt es im aktuellen Scope nicht. Die 67 State-Darstellungen wurden
im Kontaktbogen vollständig 67/67 über Referenz-, Accessible-Light- und Print-Monochrome-Ansicht
geprüft. Der getrennte technische D.2-Review ist `approved`; diese technische Freigabe ersetzt
kein Fachreview.

## 6. Reviewgrenze

Alle 67 neuen State-Domainreviews bleiben einzeln `pending`; eine fachliche Einsatzfreigabe wurde
nicht erteilt. Insgesamt sind 181 Manifestreviews, zwölf Quellenreviews und ein Profilreview, also
194 fachliche Reviewträger, offen. Die technische Evidenz behauptet weder fachliche Bedeutung und
Verwechslungsfreiheit noch normative Geltung, Quellenfreigabe oder geklärte Lizenzrechte.

## 7. Beispielassets

Die sieben Dateien `5.8.1_Beispiel 1.svg`, `5.8.1_Beispiel 2.svg`,
`5.8.1_Beispiel 3.svg`, `5.8.7_Beispiel_Schneiend_extrem.svg`,
`5.8.7_Beispiel_Schneiend_mittel.svg`, `5.8.7_Beispiel_Schneiend_schwach.svg` und
`5.8.7_Beispiel_Schneiend_stark.svg` sind keine State-IDs und erhalten in D.2 weder Manifest- noch
Dossierzeilen. Sie sind ausdrücklich einer späteren Rezept-/Conformance-Coverageaufgabe
zugeordnet und damit nicht still vergessen.

## 8. Nächster Slice

D.3 ist ausschließlich der nächste vorgeschlagene Slice: 50 IuK-Abschnitte aus Anhang J. D.3
wurde nicht begonnen; diese Entscheidung implementiert oder genehmigt keinen D.3-Inhalt.
