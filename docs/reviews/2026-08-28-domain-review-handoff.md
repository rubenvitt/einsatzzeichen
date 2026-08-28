# Fachreview-Übergabe (Deckblatt zum generierten Dossier)

> Stand: 28. August 2026 — löst `2026-08-06-domain-review-handoff.md` ab.
> Reviewpaket vorbereitet, keine fachliche Freigabe erteilt.
> Offen: 544 Manifestreviews, 13 Quellenreviews, 1 Profilreview = 558 Reviewträger.
> Die Einzeltabellen stehen im **Generat** [`2026-08-28-domain-review-dossier.md`](2026-08-28-domain-review-dossier.md),
> erzeugt mit `pnpm cli review-dossier --out docs/reviews/2026-08-28-domain-review-dossier.md`.
> Offener externer Blocker: Prüfung durch eine benannte Person mit einsatztaktischer Fachkunde.

Dieses Deckblatt ist handgeschrieben und erklärt, was das Generat ist und wie damit gearbeitet
wird. Alles Zählbare — Schlüssel, Titel, Implementierung, Referenzasset, Evidenz, Status, Notiz,
Fachfragen — kommt aus dem Kommando und ist reproduzierbar. Eine Handtabelle mit 544 Zeilen
wäre am Tag ihrer Erstellung veraltet; die vom 6. August war es mit 181 Zeilen nach drei Wochen.

## 1. Was diese Übergabe ist — und was nicht

Alle 544 Manifest-Einträge, 13 Quellen und das Profil `bund` tragen `domain: { status: 'pending' }`.
Automatisierte Geometrie-, Raster-, Kontrast-, Metadaten-, Box- und Clipping-Prüfungen belegen
technische Eigenschaften. Sie können weder die fachliche Bedeutung einer Bildidee noch ihre
Verwechslungsfreiheit oder einsatztaktische Eignung freigeben.

Nach der Projektspezifikation setzt `domain: approved` eine Prüfung gegen den maßgeblichen
Referenzstand durch eine Person mit einsatztaktischer Fachkunde voraus. Codex, Claude oder eine
andere Automatisierung darf das Dossier vorbereiten, Abweichungen markieren und Ergebnisse
übertragen, aber nicht als Fachreviewer signieren oder einen Reviewer erfinden.

Eine schrittweise Freigabe ist vorbereitet: `packages/catalog/src/domain-reviews.ts` enthält für
jeden der 544 Manifest-, 13 Quellen- und einen Profilträger ein eigenes Reviewobjekt. Ein Test
erzwingt die Deckungsgleichheit in beide Richtungen und verhindert gemeinsam referenzierte
Sammelreviews. Alle 558 Statuswerte bleiben bis zur tatsächlichen Einzelprüfung unverändert
`pending`.

Neu seit dem 6. August:

- **Das Dossier ist ein Generat.** `pnpm cli review-dossier` gibt Markdown auf stdout aus
  (`--out <pfad>` schreibt eine Datei). Kopf: Baseline, Kernversion, Zählung offen/approved/
  deviation je Trägerart. Dann je Bereich — dieselbe Bereichslogik wie „Offene fachliche Reviews
  nach Bereich" in `pnpm cli coverage`, in derselben Reihenfolge — eine Tabelle je Manifestzeile,
  danach Quellen- und Profilreviews. Ein Test hält die Zählungen an das Coverage-Manifest,
  verbietet absolute Pfade und prüft, dass jeder Manifestschlüssel genau einmal erscheint.
- **Die Fachfragen sind Daten.** Die offenen Fragen je Block standen bisher als Kommentare im
  Ledger und waren für kein Generat erreichbar. Sie stehen jetzt in
  `packages/catalog/src/domain-review-questions.ts` als `DOMAIN_REVIEW_QUESTIONS` (59 Fragen mit
  stabilen `Q-…`-IDs, je Frage die betroffenen Manifestschlüssel, typgeprüft gegen das Ledger).
  Das Dossier nennt die IDs an jeder betroffenen Zeile und den Wortlaut am Ende jedes Bereichs.
  Das Register ändert keinen Reviewstatus; es hängt am Ledger, nicht umgekehrt.
- **Zwei zusätzliche Evidenzkürzel.** Neben FP, RS, FARBE, KOPF und PG (Definition unverändert in
  Abschnitt 3 des Dokuments vom 6. August) führt das Generat **GEO** (`body-geometry-regression`:
  Erwartungswert in der Testdatei, nicht im Kennwertartefakt — deshalb bewusst kein FP) und
  **FW** (`chassis-shape-regression`: Fahrwerkszone, vom Kopfgate nie erfasst — deshalb kein
  KOPF). Die Kürzel sind eins zu eins aus `testEvidence` je Manifestzeile abgeleitet; das Generat
  erklärt sie in seiner Legende. Das frühere „Organisationsprofil-RS" der Handtabelle ist damit
  schlicht RS — der Zusatz war eine Prosa-Erläuterung, keine eigene Nachweisart.

## 2. Status der projektinternen Baseline

`bbk-babz-2025` bezeichnet die projektinterne Coverage- und Vergleichsbaseline. Der Name ist
keine Behauptung normativer Geltung und bezeichnet keine geltende eigenständige Dienstvorschrift.
Nach der am 06.08.2026 geprüften
[offiziellen BABZ-Seite](https://lernplattform-babz-bund.de/goto.php?target=cat_109540) hob der
AFKzV in seiner 57. Sitzung am 13./14.03.2025 die vorläufige Anwendung auf. Die BABZ führt das
Ergebnis der Überarbeitungsgruppe als Diskussionsgrundlage für eine künftige FwDV 102/DV 102;
weitere Veröffentlichung und Verbreitung sind bis zum Abschluss der Beratungen ausgesetzt.

Für das Fachreview folgt daraus:

- Geprüft wird der im Projekt lokal archivierte, versionierte Arbeitsstand, nicht eine aktuell
  geltende Dienstvorschrift.
- Der Reviewer muss Zugang zu einer rechtmäßig vorhandenen Fassung des Hauptdokuments haben. Im
  Repository liegen nur die ignorierten Referenz-SVGs, nicht das Hauptdokument.
- Die geprüfte Fassung muss im Reviewbefund identifizierbar sein, mindestens durch Titel,
  Bezugsstand und SHA-256-Digest der tatsächlich verwendeten Datei.
- Vor Release 1.0 muss zusätzlich geprüft werden, ob ein neuer AFKzV-Beschluss oder eine
  nachfolgende FwDV 102/DV 102 den projektinternen Referenzstand ersetzt hat.

Am 28. August 2026 ist keine erneute Prüfung der BABZ-Seite erfolgt; der Absatz gibt den Stand
vom 6. August wieder.

## 3. Evidenzkürzel und Referenzassets

Siehe Legende im Generat und Abschnitt 3 des Dokuments vom 6. August. Alle Referenzasset-Angaben
des Dossiers sind ausschließlich Dateinamen aus `packages/catalog/src/fingerprints.json`
(661 Einträge); die Dateien selbst liegen nur lokal in `taktische-zeichen/` und werden wegen der
ungeklärten Nutzungsgrundlage nicht eingecheckt. Das Generat gibt nie einen Pfad aus.

## 4. Die 544 offenen Manifest-Reviews

Stehen vollständig im Generat, gruppiert nach Bereich in der Reihenfolge der Coverage-Zeile:
Kapitel 4 (92), Kapitel 5 (78), Anhang E (68), F (66), J (53), I (50), D (37), G (21), K (18),
Kapitel 1 (14), Anhang M (14), L (10), N (9), Kapitel 2 (8), Anhang C (3), H (3). Alle Schlüssel
verwenden das Profil `bund`.

## 5. Fachliche Prüfkriterien

### Für jeden Eintrag

- Stimmen Abschnitt, Titel, Bedeutung, Implementierungs-ID und Referenzasset mit dem tatsächlich
  geprüften Hauptdokument überein?
- Ist `profile: bund` für genau diese Aussage sachgerecht, ohne eine vollständige Polizei- oder
  Bundeswehrsystematik zu behaupten?
- Ist die erzeugte Darstellung in einsatztaktischem Kontext eindeutig, verständlich und gegenüber
  benachbarten Zeichen ausreichend verwechslungsarm?
- Entspricht die semantische Beschreibung der Bildaussage und vermeidet sie weitergehende
  Behauptungen, die der Referenzstand nicht trägt?
- Ist eine sichtbare Abweichung eine Fehlerkorrektur oder eine bewusst akzeptierte Rekonstruktion?
  Bei bewusster Abweichung ist `deviation` mit konkreter Begründung zu verwenden, nicht
  `approved`.
- **Neu:** Trägt die Zeile eine oder mehrere `Q-…`-Fragen, ist jede davon im Befund ausdrücklich
  zu beantworten. Eine Freigabe, die eine registrierte Frage übergeht, ist unvollständig.

### Grundzeichen aus Kapitel 1

- Vollständige Kontur statt nur Hüllenmaße vergleichen: Ecken, Rundungen, Öffnungen,
  Strichstärke, Drehung und Weißfläche. Bei GEO-Zeilen (heute 1.14 und G.1.5) stammt der
  Erwartungswert aus der Testdatei, nicht aus dem Kennwertartefakt.
- Prüfen, ob der starke Provenienzbegriff `status: verbatim` für die jeweilige eigenständig
  rekonstruierte Primitive fachlich vertretbar ist oder auf `derived` geändert werden muss.
- Bedeutung der zusammengefassten Kategorie „Behälter, Ressource, Raum, Funkgerät" ausdrücklich
  bestätigen; die Fragen Q-1-ereignis-ohne-organisation und Q-1-fahrzeuge-ohne-fahrwerk
  beantworten.

### Kompositionsrezepte (Anhänge C, D, E, F, G, H, I, N)

- Nicht nur den Körper, sondern Organisation, Stärkezeichen, Fähigkeit, relative Platzierung und
  vollständige Bezeichnung gegen das Referenzbeispiel prüfen.
- Die Organisationsfrage der weißen Körper (`hilfsorganisation` oder keine Organisation) ist die
  meistgestellte des Registers (Q-F-weiss-als-hilfsorganisation, Q-G-weiss-und-marken,
  Q-I.1-*, Q-D.1.9-*). Sie ist einmal grundsätzlich zu entscheiden und dann je Anhang zu
  bestätigen — sie wird in den Alternativthemes sichtbar.
- Kürzel, die vom Bild abgelesen wurden (E.1, F.1), sind gegen die Einheitenliste der Quelle zu
  prüfen, nicht gegen den Dateinamen.
- Alternativdarstellungen (`#alternative`) sind eigene Reviewträger: gleiche Bedeutung, getrennt
  nachvollziehbare Darstellung.

### Organisationsfarben (Kapitel 2)

- Organisationsbezeichnung und Farbzuordnung fachlich bestätigen; ein identischer Hexwert allein
  belegt die Zuordnung nicht (FARBE ist ein Palettenabgleich).
- Für Polizei und Bundeswehr ausdrücklich dokumentieren, dass nur das interoperable Farbelement
  des Arbeitsstands geprüft wird, kein vollständiges organisationsspezifisches Profil.
- Die zusätzlichen Kontursignaturen der Alternativthemes als Projektfunktion, nicht als Aussage
  des BABZ-Referenzstands behandeln. Q-2-hiorg-* beantworten.

### Stärkeangaben und Fahrwerke (Kapitel 5.1, 5.4)

- Anzahl, Orientierung und Bedeutung der Marken prüfen; die im Elementregister genannten C-, D-
  und E-Beispiele heranziehen.
- Q-5.1-kategoriezuordnung, Q-5.1-verbindungsstrich-endpunkte und
  Q-5.1-anhaenger-ein-oder-zwei-raeder sind Kapitelfragen mit Folgen für Anhang E.2.

### Fähigkeiten (Kapitel 4) und Zustände (Kapitel 5.8)

- Für jede Darstellung die semantische Bedeutung und ihre charakteristischen Merkmale direkt
  beurteilen und gegenüber benachbarten Darstellungen abgrenzen.
- Bei Alternativen das Primary-/Alternative-Verhältnis prüfen.
- Die Lesbarkeit in den geprüften Einsatzgrößen von 16, 24, 32, 64, 128 und 256 Pixeln fachlich
  bewerten; ein bestandenes Rastergate belegt nur technische Sichtbarkeit.
- Die monochrome Unterscheidbarkeit fachlich bewerten; Farbe darf nicht der einzige
  Bedeutungskanal sein.
- Festhalten, ob der Quellenstatus `derived` bestehen bleibt oder eine bewusste Abweichung als
  `deviation` konkret dokumentiert werden muss.

### Anhänge J, K, L, M

- Für diese Bereiche führt das Register keine blockspezifischen Fragen; die Ledgerkommentare
  enthielten keine. Es gelten die Kriterien „Für jeden Eintrag".

## 6. Erforderlicher Reviewbefund je Eintrag

Ein abgeschlossener Befund muss mindestens enthalten:

1. exakten Manifestschlüssel;
2. Status `approved` oder `deviation`;
3. vollständigen Namen oder stabil zuordenbares Kürzel des menschlichen Reviewers;
4. Funktion beziehungsweise fachlichen Hintergrund, der die einsatztaktische Fachkunde
   nachvollziehbar macht;
5. ISO-Datum;
6. identifizierten Hauptdokumentstand und SHA-256-Digest;
7. geprüften Abschnitt und Referenzasset;
8. kurze Aussage zu Semantik, visueller Eindeutigkeit und Profilzuordnung;
9. bei `deviation` eine konkrete Abweichungsbeschreibung und Freigabebegründung;
10. **neu:** die Antwort auf jede `Q-…`-Frage, die das Dossier an dieser Zeile nennt.

Das Schema speichert weiterhin nur `reviewer`, `date` und `note`. Bis ein strukturiertes
Evidenzfeld existiert, müssen die Punkte 4 sowie 6 bis 10 nachvollziehbar in `note` oder in einem
verlinkten, versionierten Reviewprotokoll stehen.

`deviation` dokumentiert eine abgeschlossene Prüfung, ist nach der geltenden 1.0-Regel aber
weiter ein Release-Blocker: `releaseBlockers()` verlangt ausdrücklich `domain: approved`.

## 7. Arbeitsweise mit dem Generat

1. `pnpm cli review-dossier --out docs/reviews/<datum>-domain-review-dossier.md` erzeugen; das
   Ergebnis ist deterministisch (keine Zeitstempel), ein Diff zweier Läufe zeigt genau die
   Ledger- und Manifeständerungen dazwischen.
2. Der Reviewer arbeitet die Bereiche in beliebiger Reihenfolge ab und liefert Befunde nach
   Abschnitt 6.
3. Eine ausdrücklich übermittelte Entscheidung wird von Hand in `domain-reviews.ts` übertragen —
   nie durch das Kommando. Beantwortete Fragen werden aus `domain-review-questions.ts` entfernt
   oder mit der Antwort in die `note` der Zeile überführt; ein Test schlägt fehl, wenn eine Frage
   auf einen Schlüssel zeigt, den das Ledger nicht mehr kennt.
4. Danach das Dossier neu erzeugen; die Kopfzählung zeigt den Fortschritt.

## 8. Offene Punkte dieser Übergabe

- Die Anhänge J, K, L und M haben keine registrierten Fachfragen, weil der Ledger keine führte.
  Ob dort wirklich keine offenen Einzelfragen bestehen oder sie nur nie aufgeschrieben wurden,
  ist selbst eine offene Frage an den Zuschnitt dieser Anhänge.
- Das Register nennt Fragen je Schlüssel, aber noch keine Priorität. Die Organisationsfrage der
  weißen Körper wäre ein Kandidat für „zuerst entscheiden", weil sie über hundert Zeilen in D, F, G und I zugleich betrifft.
- Ein strukturiertes Evidenzfeld am `Review`-Typ (Abschnitt 6) existiert weiterhin nicht.
