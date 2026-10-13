# Altzeichen Fernschreiben und Festbildübertragung (ESZ-137)

> Entscheidungsnotiz · 13. Oktober 2026
> Zunder: https://zunder.rubeen.dev/#/aufgabe/ovvpai5eyjm7tnk8wkccred8
> Anlass: Lifeline Hub LLH-1159, Entscheidung des Eigentümers „Bibliothek zuerst“.

## Anlass

Das Lagekarten-Altpaket `taktische-zeichen-core` bot `fernschreiben`, `fernschreiben-funk`,
`festbilduebertragung` und `festbilduebertragung-funk` an. Der Hub zeichnet Bestandsdaten mit
diesen Symbolen bisher als Platzhalter. Die Bibliothek führt sie nun als freistehende Piktogramme.

## Wo die Vorlage steht

Nicht in der Baseline. Die 661 BABZ-Referenzdateien (`fingerprints.json`) enthalten weder
Fernschreiben noch Festbild; das LFH-433-Scoping (§3.2, Klasse C) hält fest, dass Anhang J die
analogen Dienste gestrichen hat.

Die Vorlage ist die **DLRG DV 102, 1. Auflage 2011** (SKK-Empfehlungen 2010, Quelle `skk-2010`),
Kapitel 8, Seite 27:

| Abschnitt | über Draht | über Funk |
|---|---|---|
| 8.4 Fernsprechen (Vorläufer von J.1.1) | ein Strich | Strich, darunter Zickzack |
| 8.5 Fernschreiben | zwei Striche | zwei Striche, darunter Zickzack |
| 8.6 Festbildübertragung | Gitter aus 4 × 4 Strichen | kleineres Gitter, darunter Zickzack |

Die in `sources.ts` hinterlegte DLRG-Adresse ist tot (HTTP 404). Die Adresse des Landesverbands
Rheinland-Pfalz liefert dieselbe Auflage und steht jetzt im Register, mit eigenem Prüfdatum.

## Entscheidung

1. **Eigene Liste `LEGACY_PICTOGRAMS`, nicht `ALL_PICTOGRAMS`.** Jede Prüfung an
   `ALL_PICTOGRAMS` setzt eine BABZ-Referenzdatei voraus: Coverage-Manifest
   (`bbk-babz-2025:<Abschnitt>`), Inventar, Fingerprints, `PICTOGRAM_SPEC_FIXTURES`. Die Altquelle
   liefert eine PDF-Seite, keine Datei. Ein Altzeichen trägt deshalb `source: 'skk-2010'`,
   `section` (`8.5`, `8.6`) und `page` statt `referenceAsset`. Das Coverage-Manifest bleibt eine
   Aussage über die Baseline und ändert sich nicht.
2. **ID-Raum `comms.*`**, Kennungen in `LEGACY_COMMS_IDS`: `comms.teleprinter-transmission`
   und `comms.still-image-transmission`. `COMMS_IDS` bleibt genau Anhang J. Über Funk ist die
   erste Darstellung, über Draht die zweite, wie bei J.1.
3. **Erreichbar wie jedes Piktogramm.** `pictogram()` löst beide Listen auf, `PICTOGRAM_IDS`
   führt die Kennungen, damit kennen Codec, Prüfung (`pictogram-variant-not-available` liest
   beide Listen) und Vokabular für freistehende Zeichen sie ohne Sonderweg.
4. **Herkunft `legacy`.** `freestandingProvenance` meldet
   `{ status: 'legacy', claim: 'legacy-source', source: 'skk-2010', section, page }`. Der Status
   ist derselbe Wert wie `SourceStatus` im Schema. Das ist eine neue Variante der Union und damit
   ein Minor-Release.
5. **Nur freistehend.** Die DV 102 erlaubt die Kombination mit anderen Zeichen; die Entscheidung
   vom 10. Oktober 2026 (Punkt 4) hält IuK-Zeichen aus dem Körper heraus, IuK im Körper läuft über
   die Fähigkeit 4.9.1. Die Altzeichen folgen dem Raum, in dem sie stehen.

## Konstruktion

Eigenständig im Hausstil von J.1, nicht geometrietreu zur Altquelle (Strich 0,5 mm). Die Maße
der Vorlage stehen im Modulkommentar von `comms/05-legacy-skk-2010.ts`.

- **Fernschreiben ist J.1.1 mit doppeltem Balken.** Über Funk liegen Balken und Zickzack genau wie
  bei J.1.1, der zweite Balken 3 mm darüber; über Draht zwei Balken mittig um y = 16. Der Test
  hält das als Gleichheit mit den Primitiven von `comms.voice` fest.
- **Festbild ist ein Gitter.** Über Funk 14 mm (Teilung 3, Überstand 2,5) mittig über dem
  Zickzack, 3 mm Abstand wie bei J.1.8 und J.1.10; über Draht 16,5 mm (Teilung 3,5, Überstand 3),
  im Verhältnis der Vorlage (1,14).

Sichtprüfung gegen die Vorlage: Projektdatei `esz-137/vergleich-vorlage.png` (nicht im Repo,
die Quelle wird nie eingecheckt).

## Gates

Für die vier Darstellungen laufen Kommando-, Box-, Clipping-, ViewBox- und Textlesbarkeits-Gate
(`pictograms/gate.test.ts`), der Kontrastvertrag, eigene SVG-Snapshots in
`__snapshots__/legacy/`, das Inventar (`legacy-inventory.test.ts`) und die Spec-Fixtures
(`LEGACY_SPEC_FIXTURES`: Prüfung, Zeichnung, Herkunft, Rundreise über den Codec).

## Nicht in diesem Schritt

- **Sichten (DV 102 7.5) und Sammeln (7.6)** sind keine Altzeichen: Die Baseline führt ihre
  Nachfolger 5.2.4 und 5.2.6 (ESZ-138, ESZ-139).
- **Ein Migrationsregister** für Legacy-Bezeichner (LFH-433, §4) entsteht hier nicht.
- **Fachliche Freigabe.** Wie der übrige Bestand sind die Altzeichen fachlich ungeprüft.
