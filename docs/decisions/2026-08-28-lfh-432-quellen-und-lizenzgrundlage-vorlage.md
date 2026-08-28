# Entscheidungsvorlage: LFH-432 — Quellen- und Lizenzgrundlage des Referenzbestands

Datum: 28. August 2026

Status: Entscheidungsvorlage, offen — Entscheidung durch Projektinhaber ausstehend

Scope: Nutzungsgrundlage der 13 registrierten Quellen, insbesondere der 661 lokal archivierten
BABZ-Referenzdateien und der daraus abgeleiteten `fingerprints.json`; Lizenz des Projekts selbst.
Keine Codeänderung, keine Rechtsberatung — alle rechtlichen Aussagen in dieser Vorlage sind
Selbsteinschätzung des Projekts, keine Auskunft. Parent: LFH-406.

## 1. Ausgangslage — belegte Fakten (Stand 28. August 2026)

**Das Quellenregister.** `packages/catalog/src/sources.ts` führt 13 Quellen. Lizenzstatus:

| Status | Quellen |
|---|---|
| `unclear` (7) | `bbk-babz-2025` (Baseline, Statusseite), `babz-svg-2025` (661 Referenzdateien, `geometryUse: measured-metrics, reconstructed`), `babz-hinweise-2024`, `skk-2010` (DLRG DV 102), `fwdv-100`, `fwdv-800`, `thw-einheiten` |
| `clarified` (6) | `din-14033`, `din-13050`, `din-14034-6`, `din-14095` (kostenpflichtig, nicht erworben, nichts übernommen), `phjardas-tz` (MIT, nur verglichen), `arimo-ofl` (SIL OFL 1.1, eingebettet) |

Bei den sieben `unclear`-Quellen lautet die Begründung gleichlautend: „Weiterverwendung und
Ableitung sind nicht dokumentiert." Nur `babz-svg-2025` liefert dem Projekt tatsächlich etwas
Geometrisches (Kennzahlen); alle anderen `unclear`-Quellen tragen `geometryUse: ['none']` und
dienen der Terminologie, Nummerierung und Statusaussage.

**Was aus der Referenz im Repository liegt.** Nur `packages/catalog/src/fingerprints.json`:
661 Einträge mit `asset`-Dateiname, `viewBox`, Layernamen, Füllfarben, Bounding-Boxen je Form
(`bounds`/`outline`), `curvedPaths`. Keine Pfaddaten. Die Spec nennt das „Spezifikationsfakten
(0,5 mm Linie, 32 mm Grundfläche), keine schöpferische Ausdrucksform" (Slice-1-Spec §8).
`taktische-zeichen/` und `taktische-zeichen.zip` stehen in `.gitignore`; LFH-401 hat ein
fail-closed Repository-Gate ergänzt, das den Git-Index auf beide prüft
(`docs/decisions/2026-08-28-lfh-401-repository-policy-gate.md`).

**Status der Baseline.** BABZ-Statusseite, am 6. August 2026 im Projekt und am 28. August 2026
für diese Vorlage per WebFetch abgerufen
(<https://lernplattform-babz-bund.de/goto.php?target=cat_109540>): Der AFKzV hat in seiner
57. Sitzung (13./14. März 2025) den Beschluss zur vorläufigen Anwendung aufgehoben; das Ergebnis
gilt als „Diskussionsgrundlage für den Weiterentwicklungsprozess hin zu einer vollwertigen
FwDV 102/DV 102"; das BBK wurde gebeten, „von einer weiteren Veröffentlichung und Verbreitung
dieses Ergebnisses der Überarbeitungsgruppe bis auf Weiteres abzusehen". Die Seite enthält keine
Lizenz- oder Urheberrechtshinweise; sie verlinkt auf Nutzungsvereinbarung, Datenschutz und
Impressum der ILIAS-Plattform. Die 661 Dateien stammen aus der ILIAS-Ablage
`ref_id=147616` (`babz-svg-2025.url`), die inzwischen nicht mehr verbreitet wird.

**Lizenz des Projekts selbst.** `package.json` (Root) trägt `"license": "MIT"`. **Es gibt keine
`LICENSE`-Datei im Repository**, und keines der `packages/*/package.json` trägt ein
`license`-Feld (`grep '"license"' package.json packages/*/package.json`). Eine Unterscheidung
zwischen Code-Lizenz und Lizenz der Katalogdaten (Geometrie, Manifest, Fingerprints) ist nirgends
getroffen. `README.md` hat keinen Lizenzabschnitt.

**Was das Projekt bereits entschieden hat.**

- Ungeklärter Lizenzstatus ist **ausdrücklich kein Release-Blocker**: „Das 1.0-Gate der Vision
  fragt nach Quellen- und Reviewstatus, nicht nach gelösten Lizenzfragen"
  (Provenienz-Spec §8, `releaseBlockers()`); `pnpm cli coverage` listet entsprechend 558 Reviews,
  aber keinen Lizenzblocker.
- „Die Lizenzangaben sind eine Selbsteinschätzung, kein Rechtsgutachten" (Provenienz-Spec §13).
  Eine Klärung „ist eine Änderung an einem Registereintrag, nicht an der Architektur".
- Vision, Nicht-Ziel: „lizenzrechtlich unklare Assets ungeprüft zu übernehmen"; Governance:
  „Normtexte und nicht eindeutig lizenzierte Grafiken werden nicht ungeprüft in das Repository
  kopiert."
- Vor 1.0 ist erneut zu prüfen, „ob ein neuer AFKzV-Beschluss oder eine nachfolgende
  FwDV 102/DV 102 den projektinternen Referenzstand ersetzt hat" (Handoff §2).

**Vergleichskorpora** (WebFetch 28. August 2026): `phjardas/taktische-zeichen` MIT;
`jonas-koeritz/Taktische-Zeichen` README: Quellen CC BY 4.0, „die fertigen Zeichen aus den
`release.zip` Dateien sind gemeinfrei". Beide nennen keine Rechteklärung gegenüber BBK/SKK/DLRG —
sie zeigen, dass die Community die Zeichen seit Jahren frei nachbaut, belegen aber keine Erlaubnis.

## 2. Was genau unklar ist

1. **BABZ-Arbeitsstand (`bbk-babz-2025`, `babz-svg-2025`).** Nutzungsbedingungen des Downloads
   sind unbekannt (ILIAS-Nutzungsvereinbarung nicht ausgewertet). Der Stand ist zurückgezogen —
   der Rechteinhaber verbreitet ihn selbst nicht mehr. Ungeklärt: (i) ob die Einzelzeichen als
   Werke geschützt sind oder als Teil eines amtlichen Regelwerks gemeinfrei (§ 5 UrhG erfasst
   Gesetze, Verordnungen, amtliche Erlasse und Bekanntmachungen — ob ein zurückgezogener
   Entwurf einer Dienstvorschrift darunter fällt, kann das Projekt nicht beurteilen); (ii) ob die
   661-Datei-Sammlung als Datenbank (§ 87a UrhG) geschützt ist und `fingerprints.json` als
   „wesentlicher Teil" gälte; (iii) ob eigenständig konstruierte Zeichen „nach dem Bild" der
   Referenz eine Bearbeitung sind. Die Projektposition (Kennzahlen sind Spezifikationsfakten,
   eigene Geometrie ist eigene Schöpfung) ist plausibel, aber ungeprüft.
2. **DLRG DV 102 / SKK 2010 (`skk-2010`).** Öffentlich als PDF auf dlrg.de; Herausgeber DLRG
   bzw. SKK. Heute `geometryUse: none`. Wird relevant, sobald die Legacy-Migration (Aliasnamen,
   Differenzdarstellung) Bildinhalte vergleicht oder abbildet.
3. **FwDV 100 / FwDV 800.** Von einer Landesfeuerwehrschule bereitgestellte PDFs; Text- und
   Terminologiequelle, keine Grafik. Ob als amtliche Werke frei — nicht geprüft; für das Projekt
   nur Terminologie, also niedriges Risiko.
4. **THW-Einzelblätter.** Öffentliche Bundesveröffentlichung; nur Bezeichnungen übernommen.
5. **Projektlizenz.** Ohne `LICENSE`-Datei ist die MIT-Angabe unvollständig; ob Katalogdaten
   unter MIT, CC BY 4.0 oder CC0 stehen sollen, ist nicht entschieden — und diese Wahl bestimmt,
   was Nutzer mit „unseren" Zeichen dürfen.

## 3. Was heute schon feststeht

- Die Architektur ist auf Dauer-`unclear` ausgelegt: keine Referenzdatei im Index, nur
  verlustbehaftete Kennzahlen, eigene Millimetergeometrie (Slice-1-Spec §2, §8; Provenienz-Spec
  §3, §13). Jede Antwort auf die Lizenzfrage ändert einen Registereintrag, nicht den Code.
- Der lokale Referenzordner ist für Sichtprüfung und `audit:reference` erforderlich; CI läuft
  ohne ihn (Slice-1-Spec §12, Kriterium 5).
- Die Baseline hat keine normative Geltung; das Projekt behauptet keine (README „Status der
  fachlichen Grundlage").

## 4. Wege zur Klärung — Optionen

### (A) Schriftliche Anfrage an BBK/BABZ

Konkretes Nutzungsszenario beschreiben (lokale Vergleichsreferenz, abgeleitete Kennzahlen im
öffentlichen Repository, eigenständig konstruierte Zeichen, Nennung der Abschnittsnummerierung)
und um Bestätigung oder Auflagen bitten.

- **Lizenz:** einzige Option, die `unclear` → `clarified` mit belastbarer Grundlage machen kann.
- **Aufwand:** ein Brief/E-Mail; Antwortzeit unbekannt; die Beratungen sind laut BABZ nicht
  abgeschlossen — eine Antwort „bis auf Weiteres nein" ist möglich.
- **Qualität/1.0:** kein Blocker (Provenienz-Spec §8); positive Antwort erlaubt später den
  Referenz-Vollvergleich in CI (Slice-1-Spec §13).
- **Repo-Folgen je Antwort:** *Erlaubnis* → `licence.status: 'clarified'`, `note` mit Datum und
  Fundstelle; optional Vollvergleich in CI (Assets bleiben trotzdem außerhalb des Index, solange
  nicht ausdrücklich freigegeben). *Auflagen* (z. B. Nennung, keine Weitergabe) → Registereintrag
  plus README-Hinweis. *Ablehnung oder Schweigen* → Status bleibt `unclear`, Architektur
  unverändert; die Referenzdateien bleiben dauerhaft lokal; zusätzlich zu prüfen, ob Dateinamen in
  `fingerprints.json` (heute sichtbar: `asset: "1.10_Maßnahme.svg"`) als Inhaltsverzeichnis
  des Bestands problematisch sind.

### (B) Rechtsauskunft einholen (Anwalt/Anwältin für Urheberrecht)

- **Lizenz:** klärt die drei Fragen aus Abschnitt 2 Punkt 1 unabhängig vom BBK; ersetzt keine
  Erlaubnis.
- **Aufwand:** Kosten; sinnvoll erst, wenn eine Verbreitung an Dritte (npm-Veröffentlichung,
  Docs-Site mit allen Zeichen) konkret ansteht.
- **1.0:** kein Blocker; reduziert Restrisiko für die Veröffentlichung.
- **Repo-Folgen:** Ergebnis als `licence.note` mit Datum; ggf. Entfernung der Dateinamen aus
  `fingerprints.json` oder Anpassung des Fingerprint-Umfangs.

### (C) Verzicht auf abgeleitete Geometrie: nur eigene Konstruktion, keine Fingerprints

- **Lizenz:** minimiert die Berührung mit der Referenz auf Sichtvergleich.
- **Aufwand:** hoch — das Fingerprint-Gate ist die einzige maschinelle Treueprüfung für Kap.
  1–3 (Slice-1-Spec §9) und Grundlage von `audit:reference`, Elementvermessung (288 `element`-
  Einträge) und Referenzinventar (550/661). Der Verlust wäre ein Rückbau der Provenienz.
- **Qualität/1.0:** verschlechtert Nachweisbarkeit; das Vision-Kriterium „100 % Zuordnung der
  lokalen SVG-Dateien" wäre nicht mehr maschinell prüfbar.
- **Repo-Folgen:** `fingerprints.json` entfernen, Gates umbauen — nicht empfohlen.

### (D) Nur-Fingerprints als Dauerzustand akzeptieren (Status quo, ausdrücklich beschlossen)

- **Lizenz:** bleibt `unclear`, aber als bewusste, dokumentierte Position („wir übernehmen
  nichts, wir messen") statt als offener Punkt.
- **Aufwand:** Dokumentation (README-Abschnitt „Referenzassets und Lizenz", `LICENSE`-Datei).
- **1.0:** entspricht der geltenden `releaseBlockers()`-Logik; die ClickUp-Aufgabe würde
  geschlossen mit „geklärt: Klärung nicht erforderlich für 1.0, Anfrage (A) läuft parallel".
- **Repo-Folgen:** Referenzdateien bleiben für immer lokal; Sichtprüfung bleibt
  Projektinhaber-Pflicht, weil nur er den Ordner hat (Handoff §2: Reviewer braucht eigene
  rechtmäßige Fassung).

### (E) Projektlizenz getrennt festlegen (unabhängig von A–D notwendig)

Code MIT (wie `package.json`), Katalogdaten und erzeugte SVGs gesondert (CC BY 4.0 mit
Nennung, oder CC0 wie die Release-Zeichen bei jonas-koeritz). Voraussetzung: die Autorschaft
der Piktogramme ist geklärt (LFH-431, Frage 4) — Agent-generierte Pfade auf Anweisung sind
urheberrechtlich nicht sicher dem Projektinhaber zuzurechnen; das Projekt sollte dazu keine
Aussage treffen, die es nicht halten kann.

## 5. Empfehlung

**(D) + (A) + (E), nicht (B) jetzt, nicht (C).** Den Status quo als bewusste Governance-
Entscheidung festschreiben: Fingerprints statt Dateien ist Dauerarchitektur, die Referenz bleibt
lokal, und ein `unclear` ist keine Lücke, sondern der dokumentierte Zustand einer Quelle, deren
Rechteinhaber sie selbst zurückgezogen hat. Parallel eine schriftliche Anfrage an BBK/BABZ mit
dem konkreten Szenario stellen — sie kostet fast nichts, und nur sie kann den Status wirklich
ändern; ihre Antwort wird als Registeränderung eingetragen, egal wie sie ausfällt. Unabhängig
davon fehlt heute eine `LICENSE`-Datei und eine Aussage zur Datenlizenz; das ist die einzige
Lizenzlücke, die das Projekt selbst schließen kann und die vor jeder Veröffentlichung geschlossen
sein muss. Eine Rechtsauskunft (B) lohnt erst vor einer npm-/Docs-Veröffentlichung an Dritte.

Unsicherheiten: Die Einordnung als „Spezifikationsfakten" und die Nichtzurechenbarkeit der
Fingerprints als Datenbankteil sind Projektmeinung. Die ILIAS-Nutzungsvereinbarung wurde für
diese Vorlage nicht abgerufen — sie ist der erste konkrete Prüfschritt vor (A).

## 6. Fragen an den Projektinhaber

1. Soll `unclear` für `babz-svg-2025` als Dauerzustand beschlossen werden (Option D), sodass
   LFH-432 nicht länger als 1.0-Voraussetzung gilt?
2. Stellst du eine schriftliche Anfrage an BBK/BABZ (Option A)? Wenn ja: unter welchem Absender
   (privat, Verein, Organisation) und mit welchem Szenario (Repo öffentlich? npm-Veröffentlichung
   geplant?)?
3. Welche Lizenz sollen Katalogdaten und erzeugte SVGs tragen — MIT wie der Code, CC BY 4.0
   oder CC0? Und soll eine `LICENSE`-Datei plus README-Abschnitt „Referenzassets und Lizenz" jetzt
   angelegt werden?
4. Wie ist die Autorschaft der Agent-geschriebenen Piktogramme zu benennen (Kopplung zu
   LFH-431, Frage 4)? Das entscheidet, was das Projekt lizenzieren *kann*.
5. Wie hast du die 661 Dateien seinerzeit bezogen (Login auf der ILIAS-Plattform mit
   Nutzungsvereinbarung? offener Download?) — das ist die Grundlage für Abschnitt 2, Punkt 1.
6. Sollen die Referenz-Dateinamen in `fingerprints.json` bleiben, oder durch die Abschnitts-ID
   ersetzt werden, falls die Anfrage (A) negativ ausfällt?
7. Ist eine Rechtsauskunft (B) vor einer Veröffentlichung an Dritte gewünscht, und gibt es dafür
   ein Budget?

## 7. Folgeaufgaben je Option (Kurzfassung für ClickUp)

- **(A):** Anschreiben entwerfen (Szenario, Fragen, Fristen), ILIAS-Nutzungsvereinbarung
  auswerten und ablegen (Datum, Fassung), Antwort als Registeränderung + README.
- **(B):** Fragenkatalog aus Abschnitt 2, Anwaltsauswahl, Ergebnis als `licence.note`.
- **(C):** nicht empfohlen; wäre Rückbau von `audit:reference`, Fingerprint-Gate, Inventar.
- **(D):** Entscheidungsnotiz „Lizenzlage ist Architektur, nicht Blocker", README-Abschnitt,
  ClickUp-Task schließen mit Verweis.
- **(E):** `LICENSE`-Datei (MIT) im Root, `license`-Feld in allen `packages/*/package.json`,
  Datenlizenz-Entscheidung, Autorschaftsangabe im Manifest.
- **Unabhängig:** Vor 1.0 erneute Prüfung der BABZ-Statusseite auf neuen AFKzV-Beschluss
  (Handoff §2); `Vision.md`-Überarbeitung (Provenienz-Spec §13).
