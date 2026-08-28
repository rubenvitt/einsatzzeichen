# Entscheidungsvorlage: LFH-431 — wer zeichnet die verbleibenden Piktogramme

Datum: 28. August 2026

Status: Entscheidungsvorlage, offen — Entscheidung durch Projektinhaber ausstehend

Scope: Autorschaft der noch fehlenden Piktogramme und Zeichen des projektinternen
Referenzstands; Verhältnis der Zeichenfrage zum 1.0-Gate. Keine Codeänderung, keine fachliche
Freigabe. Parent: LFH-406 „Governance — das eigentliche 1.0-Gate".

## 1. Warum die Frage so alt ist und heute anders lautet

Die Slice-1-Spec hält am 4. August 2026 in Abschnitt 13 fest: „Über 400 Piktogramme sind
Handarbeit. […] Das ist der mit Abstand größte Aufwandsposten und das eigentliche Gate für
Release 1.0 — nicht der Code. […] Eine Antwort auf ‚wer zeichnet das' steht aus."
(`docs/superpowers/specs/2026-08-04-einsatzzeichen-core-slice-design.md`, §13). Die
Vision-Lücken-Notiz vom 5. August führt denselben Punkt als Klasse-2-Lücke Nr. 1 ohne Owner
(`docs/decisions/2026-08-05-vision-luecken-und-slice-reihenfolge.md`).

Die Zahl „über 400" stammt aus Spec §2: von 661 Referenzdateien liegen 411 in den Anhängen
C–N. Am 6. August hat die D.0-Spec die Frage zum ersten Mal beantwortet — nicht personell,
sondern methodisch: „niemand zeichnet sie, sie werden geschrieben" (Piktogramme als
handgeschriebene Millimeterpfade, `docs/superpowers/specs/2026-08-05-piktogramme-und-katalogausbau-design.md`,
§4). Seitdem ist diese Methode 24 Tage lang angewendet worden. Die Vorlage prüft deshalb zuerst,
was von den „über 400" heute noch übrig ist, und stellt die Frage dann auf dem tatsächlichen Stand.

## 2. Ausgangslage — belegte Zahlen (Stand 28. August 2026)

Alle Zahlen sind am Arbeitsbaum von `codex/lfh-406-governance` erhoben.

| Größe | Wert | Beleg |
|---|---|---|
| Referenzdateien lokal | 661 | `find taktische-zeichen -name '*.svg' \| wc -l` |
| Einträge in `fingerprints.json` | 661 | `packages/catalog/src/fingerprints.json` (Array-Länge) |
| davon beansprucht | **550 / 661** | `pnpm cli coverage`, Zeile „Referenzabdeckung" |
| nicht beansprucht | 111 = 83 außerhalb des Umfangs + 9 Beispielanwendungen + 1 Übersichtsblatt + 18 zurückgestellt + 0 nicht zugeordnet | dieselbe Zeile; Dispositionen in `packages/catalog/src/reference-inventory.ts` |
| Manifesteinträge | 544 = 14 `catalog-entry` + 242 `composition-recipe` + 288 `element` | `COVERAGE_MANIFEST.entries` in `packages/catalog/src/coverage-manifest.ts` |
| Piktogramme im Katalog (`ALL_PICTOGRAMS`) | **269** = 92 `capability` + 67 `state` + 53 `comms` + 28 `damage` + 14 `wildfire` + 10 `leadership` + 5 `water-rescue-personnel` | `packages/catalog/src/pictograms/index.ts`, ausgezählt per `tsx` |
| Offene fachliche Reviews | **558** = 544 Manifest- + 13 Quellen- + 1 Profilreview | `pnpm cli coverage`, Zeile „1.0-Blocker" |
| Regelabdeckung | 14/16 Achsen; Lücken `administrativeLevel` 3/6, `vehicleCategory` 7/8 | `pnpm cli coverage` |
| Projektlaufzeit | 4. August – 28. August 2026, 24 Tage | `git log --reverse --format=%ad` |

**Was von den 411 Anhangsdateien noch fehlt.** Der Coverage-Umfang enthält heute D, E, F, G, H,
I (bis auf Teile), J, K, L, M, N vollständig sowie C.1.1–C.1.3. Außerhalb des Umfangs stehen aus
den Anhängen nur noch **50 Dateien, alle in Anhang C**: C.1 (6) und C.2 (44). Die restlichen 33
der 83 Dateien außerhalb des Umfangs liegen in den Kapiteln, nicht in den Anhängen. Ausgezählt
aus `fingerprints.json` gegen `COVERAGE_MANIFEST.scope` und `claimedReferenceAssets()`:

| Abschnitt | Dateien | Was das ist | Zeichenaufwand |
|---|---|---|---|
| 3.1–3.9 | 7 | besondere Grundeigenschaften (Einsatzführung, Sonderfunktionen, Logistik, Drohne, Zweirad ×2, temporär ortsfest) | Kopf-/Körpermarken, kein Piktogramm im Sinne von Kap. 4 |
| 5.1.2–5.1.4 | 11 | geschützte Fahrzeuge, Anhänger, Wechselladersysteme, Luftfahrzeuge | Fahrwerks-/Körperformen, geometrisch |
| 5.2 | 6 | Bewegungs- und Maßnahmenpfeile | Linien-/Pfeilzeichen |
| 5.5 | 3 | Bereitschaft (Verband I–III) | Stärkemarken |
| 5.7 | 6 | Verwaltungsstufen Gemeinde … EU | Kopfmarken (Achse `administrativeLevel` heute 3/6) |
| C.1 | 6 | Feuerwehr-Einheiten (Rüstzug, Fachzug, ATF, Taucher, Dekon-Gerät, Fachdienst Brandschutz) | Kompositionen aus bestehenden Bausteinen plus Kürzeltext (4 von 6 mit Typo-Layer) |
| C.2 | 44 | Feuerwehrfahrzeuge inkl. 15 `_Alternative`-Dateien | Fahrwerk + Kürzeltext: **36 von 44 tragen einen Typo-Layer**, nur 8 sind reine Formzeichen |

Dazu die 18 **zurückgestellten** Dateien im Umfang (`INVENTORY_EXCLUSIONS`, entschieden in
LFH-403): 5 Farbtafeln 2.9–2.13, 8 Linien-/Flächenzeichen 2.14–2.20 (Grenzen, Riegelstellung,
Brandausbreitung, Fluchtweg) und 5 Fahrwerksdateien aus 5.1.1 (Amphibienfahrzeug, aufgleisbar,
Wechsellader, Wechselbehälter, Kopfdatei). Die 8 Linienzeichen brauchen einen neuen Zeichentyp
(nicht in der 32-mm-ViewBox komponierbar), keine Zeichnung.

**Ergebnis der Nachzählung:** Von „über 400 organischen Piktogrammen" bleiben **101 nicht
beanspruchte Dateien im Zielbild** (83 + 18), davon nach Struktur der Referenz höchstens
**etwa 20 mit eigenständigem Bildinhalt** (Kap. 3, 5.2, die 8 formbasierten C.2-Dateien,
Luftfahrzeuge). Der Rest ist Komposition aus Fahrwerk, Kopfmarke und Kürzeltext — genau das,
wofür Anhang E (68 Zeichen), F (66) und G (21) den Mechanismus schon liefern.

**Wie die 269 vorhandenen Piktogramme entstanden sind.** Alle Koordinaten sind „unabhängige
Millimeterkonstruktionen"; aus den lokalen BABZ-Referenzen wurden keine Pfaddaten kopiert, die
Referenz dient nur der visuellen und semantischen Prüfung
(`docs/decisions/2026-08-06-kapitel-4-faehigkeiten-d1.md`, §3). Autor der Pfade ist ein Agent
(Codex/Claude) auf Anweisung des Projektinhabers, Sichtprüfung paarweise gegen die Referenz per
`pnpm cli visual-proof --reference-root <pfad>` (Beispiele: README „D.4", „E-a", Anhang G).
Tempo: Kapitel 4 mit 92 Darstellungen entstand im Wesentlichen am 6./7. August (60 Commits an
`packages/catalog/src/pictograms/` an zwei Tagen, `git log --date=short`); die gesamten 544
Manifesteinträge in 24 Tagen. Die Sichtprüfung findet regelmäßig Fehler, die alle Gates
passiert haben (README, Abschnitt D.4: „vier Fehler … die sämtliche Gates bestanden hatten") —
sie ist der eigentliche Engpass der Methode, nicht das Schreiben.

**Was der Bestand nicht ist.** 558 fachliche Reviews stehen offen; kein einziger Eintrag trägt
`domain: approved`. Die technischen Gates „begründen keine taktische Korrektheit, keine fachliche
Freigabe und keine normative Geltung" (D.1-Notiz, §5). Die Spec-Risikoformulierung „Gate für
1.0" trifft heute auf das Review zu, nicht auf das Zeichnen.

## 3. Was heute feststeht — und was nicht

Steht fest:

- Methode: geschriebene Millimeterpfade, keine Vektorimporte, keine übernommene Geometrie
  (D.0-Spec §4; Treue-Entscheidung Slice-1-Spec §9: Kap. 1–3 geometrietreu, Rest eigenständig).
- Stilvorgabe: „konsistenter hauseigener Stil" (Slice-1-Spec §9) — ein gemischter Bestand aus
  eigenen und übernommenen Zeichen ist ausgeschlossen.
- Der offene Rest ist klein und überwiegend kompositorisch (Tabelle oben).
- Die Referenzdateien bleiben lokal; Autorschaft wird je Eintrag im Manifest belegt.

Steht nicht fest:

- Ob die verbleibenden 101 Dateien überhaupt alle in 1.0 gehören (Anhang C ist der einzige
  Anhang mit Lücke; Linienzeichen brauchen einen neuen Typ).
- Wer die **fachliche** Prüfung der 269 Piktogramme und 544 Einträge durchführt — dieselbe
  Ownerlücke wie in der Provenienz-Spec §13 benannt.
- Ob „Agent zeichnet, Projektinhaber sichtet" als Autorschaftsangabe im Register ausreicht
  (heute steht `reviewer: 'rv'`/`'codex'` nur an technischen Reviews; eine Urheberangabe je
  Piktogramm gibt es nicht).

## 4. Optionen

### (a) Weiter wie bisher: Millimeterkonstruktion durch Agent, Sichtprüfung durch Projektinhaber

- **Aufwand:** Nach dem Tempo der letzten drei Wochen ein bis zwei Slices für Anhang C (50
  Dateien, davon 36 Kürzelkompositionen), je ein kleiner Slice für Kap. 3, 5.1.2–5.1.4, 5.5,
  5.7 und 5.2; die Linienzeichen als eigene Aufgabe mit neuem Zeichentyp.
- **Lizenz:** unverändert sauber — eigene Geometrie, Referenz nur lokal.
- **Qualität:** konsistenter Stil, gleiche Gates; die bekannte Schwäche ist die Sichtprüfung
  (findet Fehler, die Gates übersehen) und die fehlende Fachkunde bei der Semantik.
- **1.0-Gate:** löst die Zeichenfrage vollständig, die Reviewfrage gar nicht.
- **Folgeaufgaben:** Slices C-a/C-b (C.1.4–C.1.15, C.2), Kap.-3-Slice, 5.1.2–5.1.4, 5.5/5.7,
  5.2-Pfeile, Linienzeichentyp für 2.14–2.20; Entscheidung über Farbtafeln 2.9–2.13 als
  Farbtoken.

### (b) Beauftragte Illustration (Grafikerin/Grafiker)

- **Aufwand:** Kosten je Zeichen plus Integrationsaufwand: fremde SVGs müssten in geschriebene
  Millimeterpfade ohne relative Kommandos und Bögen übersetzt werden (Box-Gate, D.0-Spec §5) —
  praktisch eine zweite Autorschaft.
- **Lizenz:** vertraglich klärbar (Werkvertrag, Rechteübertragung), aber eine neue Quelle im
  Register mit eigener Lizenzangabe.
- **Qualität:** professionelle Ästhetik, aber Stilbruch zum 269-Bestand, falls nicht alles neu
  gezeichnet wird; Fachkunde nicht automatisch enthalten.
- **1.0-Gate:** verlangsamt eher; für rund 20 Zeichen mit eigenem Bildinhalt unverhältnismäßig.
- **Folgeaufgaben:** Briefing mit Stilregeln, Vertrag, Konvertierungswerkzeug SVG → IR,
  Registereintrag, Sichtprüfung trotzdem.

### (c) Übernahme aus einem freien Korpus

Geprüft am 28. August 2026 per WebFetch:

- `phjardas/taktische-zeichen` — MIT (README: „Dieses Projekt steht unter der MIT-Lizenz");
  im Register als `phjardas-tz` mit `geometryUse: ['compared-only']`, `status: 'clarified'`.
  Grundlage laut README nur „DV 102", d. h. die Systematik von 2010/2011, nicht der
  BABZ-Arbeitsstand. Pixelkoordinaten auf zeichenspezifischen Boxen, relative Kommandos und
  Ellipsenbögen — vom Box-Gate ausgeschlossen (D.0-Spec §4, drei Gründe).
- `jonas-koeritz/Taktische-Zeichen` — laut README Quellen CC BY 4.0, „die fertigen Zeichen aus
  den `release.zip` Dateien sind gemeinfrei" (CC0). Umfangreicher Bestand (Feuerwehr, THW,
  Rettung, Wasserrettung, Polizei, Bundeswehr, IuK), 256×256-Einheiten-SVGs mit Jinja2. Nicht im
  Register; keine Angabe zur fachlichen Grundlage. `Vision.md` verlangt vor einer Übernahme eine
  „datei- und releasebezogene" Lizenzklärung.

- **Aufwand:** gering für den Import, hoch für die Anpassung (Umskalierung, Kommandoform,
  Stilangleichung) — dieselbe Arbeit wie Neuschreiben.
- **Lizenz:** bei MIT/CC0 zulässig; bei CC BY Attributionspflicht im Katalog. Aber: beide
  Korpora rekonstruieren selbst die BABZ-/SKK-Zeichen — die Frage „darf die Bildidee übernommen
  werden" wird nicht besser, nur verlagert.
- **Qualität:** Stilbruch (Slice-1-Spec §9); andere Baseline → „belegte Falschaussage", wo sich
  die Bildidee geändert hat (D.0-Spec §4, Grund 2).
- **1.0-Gate:** kein Gewinn, weil der Engpass nicht die Bildidee ist.
- **Folgeaufgaben:** Registereintrag `jonas-koeritz-tz`, Lizenzprüfung je Datei, Vergleichs-
  statt Übernahmeadapter (Vision, „Strategische Positionierung").

### (d) Reduzierter 1.0-Umfang

- Anhang C nur C.1.1–C.1.3 (heute), C.2 als 1.1-Ziel; Linienzeichen 2.14–2.20 und Farbtafeln
  ausdrücklich aus 1.0 herausdefiniert; Kap. 3 und 5.2 als Nicht-Umfang dokumentiert.
- **Aufwand:** null Zeichenaufwand, Dokumentationsaufwand (Manifest-`scope`, Vision).
- **Lizenz:** unverändert.
- **Qualität:** Das Vision-Kriterium „100 % Zuordnung der lokalen SVG-Dateien" wäre nur mit
  explizit verkleinertem Referenzstand erfüllbar; die Referenzabdeckung bliebe bei 550/661 und
  das Gate müsste den Ausschluss als Disposition führen (wie heute `deferred`).
- **1.0-Gate:** nur ehrlich, wenn die Reduktion in `Vision.md` steht — sonst ist es ein
  stillschweigend verfehltes Kriterium.
- **Folgeaufgaben:** Vision-Überarbeitung (ohnehin offen, Provenienz-Spec §13), neue
  Dispositionsart oder erweitertes `deferred`, ClickUp-Reihenfolge.

### (e) Frage neu adressieren: Zeichnen wie (a), Fachprüfung als eigenes Gate

Nicht „wer zeichnet", sondern „wer prüft". Das Zeichnen bleibt bei (a); die 558 offenen Reviews
bekommen einen Owner (Fachperson aus Feuerwehr/KatS, Landesfeuerwehrschule, DLRG-Fachreferat,
oder ein zweistufiges Verfahren: Projektinhaber semantisch, externe Stichprobe). Kriterien und
Befundformat existieren bereits (`docs/reviews/2026-08-06-domain-review-handoff.md`, §5–6).

- **Aufwand:** Ansprache und Koordination; Reviewer braucht rechtmäßigen Zugang zum
  Hauptdokument (Handoff §2).
- **1.0-Gate:** trifft das tatsächliche Gate.

## 5. Empfehlung

**(a) fortsetzen, kombiniert mit (e), und (d) nur für die Linienzeichen.** Begründung: Die
Prämisse „über 400 organische Piktogramme sind Handarbeit" ist überholt — 269 Piktogramme sind
geschrieben, 550 von 661 Dateien beansprucht, und die 101 offenen Dateien sind zu rund vier
Fünfteln Kompositionen, für die der Mechanismus existiert. Beauftragung (b) und Korpusübernahme
(c) lösen ein Problem, das nicht mehr besteht, und erzeugen den Stilbruch, den Spec §9 verbietet.
Was 1.0 wirklich blockiert, sind 558 fachliche Reviews ohne Owner; diese Frage gehört in einen
eigenen ClickUp-Task neben LFH-431. Die acht Linienzeichen (2.14–2.20) brauchen einen neuen
Zeichentyp und sollten als 1.1-Ziel aus dem 1.0-Umfang genommen werden, damit das Vision-Kriterium
„100 % Zuordnung" mit einer benannten Ausnahme statt einer stillen Lücke erfüllt wird.

Unsicherheit dieser Empfehlung: Die Einschätzung „rund 20 mit eigenem Bildinhalt" ist aus den
Fingerprints (Typo-Layer, Subpfadzahl) abgeleitet, nicht aus einer Sichtung aller 83 Dateien.

## 6. Fragen an den Projektinhaber

1. Bestätigst du die Neuformulierung: LFH-431 wird „Rest zeichnen wie bisher" (Option a) und
   der eigentliche 1.0-Blocker wird ein neuer Task „Owner für 558 fachliche Reviews"?
2. Gehören Anhang C.2 (44 Fahrzeugdateien, 15 davon `_Alternative`) und C.1.4–C.1.15 in 1.0,
   oder ist C.2 ein 1.1-Ziel?
3. Sollen die Linienzeichen 2.14–2.20 (neuer Zeichentyp) und die Farbtafeln 2.9–2.13 aus dem
   1.0-Umfang herausdefiniert werden — mit Eintrag in `Vision.md`?
4. Reicht dir „Agent schreibt, Projektinhaber sichtet" als Autorschaft, oder soll je Piktogramm
   eine Urheber-/Autorangabe ins Manifest (relevant für die Lizenzfrage in LFH-432)?
5. Soll `jonas-koeritz/Taktische-Zeichen` als registrierte Vergleichsquelle aufgenommen werden
   (nur `compared-only`, keine Übernahme), wie es die Vision unter „Strategische Positionierung"
   vorsieht?
6. Wer kommt als fachlicher Reviewer in Frage, und hast du eine rechtmäßig vorhandene Fassung des
   Hauptdokuments, die ein Reviewer nutzen darf (Handoff §2)?

## 7. Folgeaufgaben je Option (Kurzfassung für ClickUp)

- **(a):** Slices C.1.4–C.1.15, C.2-a/-b, Kap. 3, 5.1.2–5.1.4, 5.5, 5.7, 5.2; Task
  „Linienzeichentyp" für 2.14–2.20; Entscheidung Farbtoken 2.9–2.13.
- **(b):** Briefing/Stilregeln, Vertrag mit Rechteübertragung, Konverter SVG → IR, neuer
  Registereintrag, Sichtprüfung.
- **(c):** Registereintrag `jonas-koeritz-tz`, dateibezogene Lizenzprüfung, Vergleichsadapter,
  Stilentscheidung.
- **(d):** Vision-Überarbeitung, `scope`-Anpassung, Dispositionsart für „nicht in 1.0".
- **(e):** Task „Fachreview-Owner", Reviewer-Onboarding mit Handoff-Dokument, Stichprobenplan.
