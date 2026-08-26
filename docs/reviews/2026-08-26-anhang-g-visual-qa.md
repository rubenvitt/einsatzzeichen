# Visual QA: Anhang G

Datum: 26. August 2026
Scope: alle 21 primary-Darstellungen G.1 bis G.8
Status: Entwurf nach Katalogintegration; visueller Referenzvergleich in Task 3 ausstehend

## In Task 2 beobachtet

- Die Literaltests binden genau 21 G-IDs ohne Alternativen an Namen, Referenzdateinamen, Körper,
  `foot-band`, Organisation, Stärke, Fahrwerk, Marken und Beschriftungen.
- Die renderbaren Katalogausgaben bestehen die lokalen Fingerprint- beziehungsweise
  Geometrieregressions-, Snapshot-, Mehrgrößen-, viewBox-, Metadaten- und Kontrastverträge.
- Der Bestand umfasst 158 Rezepte, 426 Renderfälle, 445 Manifestzeilen, 172 direkte und 427
  Mehrgrößen-Snapshots.
- G.1.5 besitzt keine vergleichbare Form im Kennzahlenartefakt. Seine Evidenz ist deshalb
  `body-geometry-regression` plus `svg-snapshot`, ausdrücklich ohne `body-fingerprint`.
- G.3.5 führt den weissen Innenlauf `Diesel` auf Bundeswehr-Braun als gemessene
  Kontrastausnahme (3,689:1 in reference/accessible-light, 2,849:1 in print); der schwarze
  Außenlauf `Bw` bleibt ein eigener Surface-Vertrag.
- Alle 21 G-Domain-Reviews stehen `pending`.

Diese Punkte sind technische Gates. Es wurde in Task 2 kein 21-Karten-Kontaktbogen erzeugt oder
visuell akzeptiert.

## Exakte Quellgrenze

Der spätere Vergleich verwendet genau die 21 lokal vorliegenden Referenz-SVGs der registrierten
Baseline `bbk-babz-2025`, adressiert durch die in den Rezepten gespeicherten Dateinamen. Die
Quell-SVGs bleiben außerhalb des Repositorys; weder absolute Speicherorte noch Kopien gehören in
Commits oder Prüfdokumente.

## Geplanter Task-3-Nachweis

Task 3 erzeugt einen deterministischen PNG-Kontaktbogen mit 21 Karten in Rezeptreihenfolge. Jede
Karte stellt die lokale Referenz und den aktuellen Katalogrender nebeneinander und trägt eine
lesbare G-ID. Das Ergebnis liegt ausschließlich unter dem ignorierten Pfad `out/lfh-421/`.

Nach der Erzeugung werden hier ergänzt:

- exakter Reproduktionsbefehl,
- PNG-Dateiname, Abmessungen und Bytezahl,
- vollständiger SHA-256,
- Ergebnis je Karte für Körperart, Organisationsfarbe, Fußband, Kopf/Räder, Körpermarke,
  Labels und Clipping,
- jede materielle Abweichung samt vorgeschaltetem RED-Test und Korrektur,
- verbleibende fachliche Unsicherheiten.

## Noch nicht entschieden

Offen bleiben insbesondere die fachliche Zuordnung weißer Körper als
`hilfsorganisation` einschließlich DLRG, die Bedeutung der Logistikmarken im jeweiligen
Einheitenkontext und die Betreiber-/Organisationsaussage der farbigen Kreiszeichen. Technische
Bildgleichheit in Task 3 kann diese Domain-Entscheidungen nicht ersetzen.
