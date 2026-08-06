# Einsatzzeichen — Gate-Härtung vor D.1

> Entscheidungsnotiz · 6. August 2026 · Umsetzung abgeschlossen · D.1 freigegeben

Setzt
`docs/superpowers/specs/2026-08-06-gate-haertung-vor-d1-design.md` über
`docs/superpowers/plans/2026-08-06-gate-haertung-vor-d1.md` um.

## 1. Der tatsächliche Umfang: vier Arbeitsbereiche

Die Slice-3-Spec nannte in ihrer Reihenfolgeregel „drei verbleibende Lücken“, ließ dort aber die
globale viewBox-Prüfung aus, obwohl sie dieselbe Prüfung in den Abschnitten 1, 7 und 12 ausdrücklich
als offen führte. Die Umsetzung behandelt die Auslassung als Redaktionsfehler und schließt alle
vier belegten Bereiche:

1. echte Rasterregression bei 16, 24, 32, 64, 128 und 256 px;
2. Referenz-, Accessible- und Schwarz-Weiß-Theme in SVG und Canvas;
3. semantische Beschreibungen und explizite Kontrastnachbarschaften;
4. globale viewBox- und Clipping-Prüfung über den renderbaren Katalog.

Die Reihenfolgeregel der Slice-3-Spec ist entsprechend korrigiert.

## 2. Referenztreue und Kontrast sind zwei verschiedene Aussagen

`REFERENCE_THEME` verwendet weiterhin exakt `PALETTE`; ohne Theme-Option bleibt die Farbausgabe
unverändert. Die BABZ-Farbe `blau` (`#003296`) erreicht mit schwarzem Piktogramm-Ink nur rund
1,90:1. Sie wurde nicht heimlich aufgehellt und wird nicht als kontrastkonform ausgegeben.

Stattdessen existieren zwei ausdrücklich andere Darstellungen:

- die Palette von `accessible-light` ersetzt nur `blau` durch `#4a73d9` und erreicht damit rund
  4,75:1 zu Schwarz;
- `print-monochrome` bildet alle zwölf Tokens auf Grauwerte ab. Die sieben belegten
  Organisationsfarben bleiben als sieben verschiedene Helligkeiten erhalten; jede erreicht
  mindestens 3:1 zu schwarzem Ink;
- beide Alternativthemes geben jeder der sieben Organisationen zusätzlich eine eindeutige
  Strich-/Lückensignatur auf der Körperkontur. Die Feuerwehr bleibt bewusst durchgezogen, die
  sechs übrigen Organisationen verwenden verschiedene Muster.

Das Kontrast-Gate prüft konkrete Nachbarschaften — jedes tatsächlich verwendete Piktogramm-Ink
gegen jede belegte Organisationsfüllung und gegen die deklarierte Theme-Oberfläche — statt eine
Palette ohne geometrischen Kontext pauschal freizugeben. Der Schwellenwert 3:1 folgt WCAG 2.2,
SC 1.4.11 für bedeutungstragende Nichttextgrafiken. Das ist keine allgemeine WCAG-Zertifizierung:
ein transparenter Export auf unbekanntem Untergrund und fachliche Verwechslungsfreiheit bleiben
außerhalb dieses maschinellen Nachweises.

## 3. Metadaten stammen jetzt tatsächlich aus dem semantischen Modell

`Drawing.description` hatte vorher keinen Katalogproduzenten. Jetzt erzeugt der Katalog:

- für Grundzeichen eine Beschreibung mit Name und BABZ-Abschnitt;
- für Kompositionen eine Beschreibung aus Grundzeichenart, Organisation, Stärke, Fähigkeit,
  Verwaltungsstufe, Fahrzeugkategorie und Bezeichnung, soweit gesetzt;
- für eigenständige Piktogramm-Renderfälle eine Beschreibung aus ihrer Definition.

`checkA11yMetadata()` verlangt über alle 13 Renderfälle nichtleeren Titel und Beschreibung. Die
bestehenden 64-px-SVG-Snapshots änderten sich deshalb bewusst: ausschließlich `<desc>` und
`aria-labelledby` kamen hinzu; Geometrie und Farben blieben unverändert.

## 4. viewBox-Gate ohne die Pfad-Blindstelle von `boundsOfMm`

`checkViewBox()` vermisst seine Pfade selbst über `M/L/H/V/C/Q/Z`. End- und Kontrollpunkte bilden
eine konservative Hülle für die zugelassenen Bézierkurven. Das Gate berücksichtigt außerdem:

- verschachtelte Translation und Rotation;
- geerbte Gruppenstile;
- die halbe sichtbare Strichstärke;
- die bestehende Toleranz von 0,01 SVG-Einheiten;
- nichtendliche/negative Geometrie, nicht analysierbare Pfade und ungültige viewBox-Maße.

`translate` an einem Blatt-Primitiv ist jetzt ein eigener Befund. Damit ist der entsprechende
offene D.0-Punkt nicht länger nur eine Kommentarkonvention: das globale Gate verhindert den Fall,
in dem Canvas die Verschiebung anwenden, der SVG-Pfadrenderer sie aber ignorieren würde.

Spitze Miter sind mit einer achsparallelen Hülle aus Kontrollpunkten und halber Strichstärke nicht
vollständig beweisbar. Deshalb prüft die Rasterregression jede 256-px-Ausgabe zusätzlich auf einen
unberührten äußeren Pixelrand. Strukturelles Gate und tatsächliches Renderergebnis tragen die
Clipping-Aussage gemeinsam.

## 5. Echte Mehrgrößenregression

`@resvg/resvg-js` ist in Version 2.6.2 als reine Root-Dev-Dependency gesperrt. `schema` und `core`
behalten null Fremdabhängigkeiten zur Laufzeit.

Die 13 Renderfälle entsprechen per Set-Gleichheit exakt den 13 Manifest-Implementierungen mit
`snapshotTest: true`:

- acht Grundzeichen;
- drei Kompositionsrezepte;
- zwei eigenständige Piktogramme.

Je Fall entstehen acht tatsächliche PNG-Rasterungen: sechs Größen im Referenztheme sowie je
256 px in `accessible-light` und `print-monochrome`. Das sind 104 Rasterungen. Ein zusätzlicher
Profilbogen rastert alle sieben Organisationen bei 64 px in beiden Alternativthemes. Insgesamt
laufen damit **118 echte Rasterungen pro Testlauf**. Sie liegen als Base64-PNGs in 14 direkt
sichtbaren SVG-Kontaktbögen (zusammen 252.967 Byte, rund 247 KiB). Jedes Raster hat das verlangte Maß,
mindestens einen sichtbaren Pixel und bei 256 px einen freien Rand.

Die visuelle Prüfung der Kontaktbögen bestätigte insbesondere:

- `capability.service-water` bleibt bei 16 px als Wellenband erkennbar und läuft nicht zu;
- Kopfmarken, Körper und Piktogramme bleiben von 16 bis 256 px vollständig;
- das Schwarz-Weiß-Theme enthält tatsächlich nur achromatische Ausgabe;
- die sieben Organisationsprofile zeigen bei 64 px unterschiedliche, lesbare Kontursignaturen
  in beiden Alternativthemes.

## 6. Drei während der Umsetzung gefundene Planfehler

1. Die erste Kontaktbogenversion setzte lange Theme-Texte unter die 16-/24-/32-px-Bilder; die
   Labels überlappten, obwohl die eingebetteten Raster korrekt waren. Feste Mindestzellen und
   kurze Größenlabels beheben die Prüfbarkeit des Artefakts.
2. Das kurvige Pfad-Piktogramm benötigte auf dem Entwicklungsrechner knapp über fünf Sekunden
   für acht Rasterungen und traf Vitests Standardtimeout. Die Rastertests besitzen deshalb ein
   eigenes 15-Sekunden-Limit je Renderfall. Das Gate wurde nicht reduziert; der vollständige
   Abschlusslauf blieb mit 19,11 Sekunden deutlich darunter.
3. Das neue Theme-CLI machte einen bereits vorhandenen Eingabefehler sichtbar: `--size nope` und
   `--size 0` schrieben zuvor SVGs mit `width="NaN"` beziehungsweise `width="0"`. Größe wird nun
   vor dem ersten Dateisystemzugriff als endlich und größer null validiert; direkte API-Aufrufer
   sind mit demselben Guard geschützt.

## 7. Verifizierter Abschluss

- **39 Testdateien, 431 Tests:** grün
- **118 reale Rasterungen, 14 Kontaktbögen:** grün und visuell geprüft
- **TypeScript 5.9:** keine Fehler
- **Coverage-Gate:** bestanden, 24 Einträge
- **`git diff --check`:** sauber
- **CLI-Export:** `--theme reference|accessible-light|print-monochrome` geprüft; die
  Schwarz-Weiß-Ausgabe schreibt für Feuerwehr korrekt `#666666`

Die Coverage-Ausgabe nennt weiterhin 13 Einträge „ohne Testnachweis“. Das ist kein Regress: Die
Metrik zählt einen Eintrag, sobald Fingerprint- **oder** Snapshot-Nachweis fehlt. Piktogramme,
Organisationen und Stärkeelemente haben strukturell keinen Fingerprint- beziehungsweise
Dateisnapshot-Nachweis. Die neuen globalen Gates dürfen diese bestehende Metrik nicht durch
unehrliche per-entry-Booleans kaschieren.

## 8. Was für D.1 offen bleibt

- Fachliche `domain`-Reviews bleiben offen; technische Kontrast- und Rastergates ersetzen keine
  einsatztaktische Prüfung der Bildidee.
- Das Piktogramm-Clipping-Gate vermisst weiterhin nur den achsparallelen Rechteckkörper
  `formation`. Polygone, Kreise und das gedrehte Quadrat brauchen echte Flächenmodelle, sobald
  D.1/D.5 ein Piktogramm gegen sie freigibt.
- `accessible-light` gilt für seine deklarierte weiße Oberfläche, nicht automatisch für dunkle
  Karten.
- `print-monochrome` ist ein deterministischer Schwarz-Weiß-Nachweis, keine physische
  Drucker-, Papier- oder ICC-Profil-Zertifizierung.

Diese Grenzen blockieren den Kapitel-4-Ausbau nicht. Die dokumentierte Vorbedingung vor D.1 ist
damit erfüllt; als Nächstes folgt der eigene D.1-Plan.

## 9. Nachtrag: technische Restpunkte geschlossen

Ein Folgepaket am selben Tag hat die beiden technischen Punkte aus Abschnitt 8 geschlossen und
die Reviewübergabe vervollständigt:

- Die universellen Booleans `fingerprintTest` und `snapshotTest` sind durch fünf typisierte,
  arteigene Evidenzarten ersetzt. Jede Claim-Menge ist an die tatsächlich iterierten Tests
  gebunden; die Coverage-CLI meldet **0 Einträge ohne Testnachweis**.
- Das Clipping-Gate prüft Rechtecke einschließlich Rotation, Kreise und geschlossene konvexe
  Polygone formtreu. Eine zentrale Testbox besteht alle acht aktuellen Grundkörper; offene,
  konkave, selbstüberschneidende und entartete Flächen bleiben explizit abgelehnt.
- Alle **37 Reviewträger** besitzen ein eigenes `domain`-Reviewobjekt (24 Manifest, zwölf Quellen,
  ein Profil). Quellen- und Profilreviews werden nicht mehr versteckt; die CLI weist die drei
  Gruppen getrennt aus. Keine fachliche Freigabe wurde automatisiert gesetzt.
- Die BABZ-Verknüpfung und die Aussagen zur Geltung sind auf die offizielle Statusseite und eine
  klar als projektintern bezeichnete Coverage-Baseline korrigiert.

Verifikation des integrierten Stands: **41 Testdateien, 487 Tests**, TypeScript ohne Fehler,
Coverage-Gate bestanden und `git diff --check` sauber. Weiter offen bleiben die tatsächlichen
menschlichen Fachreviews sowie die bereits dokumentierten Umgebungsgrenzen von
`accessible-light` und `print-monochrome`.
