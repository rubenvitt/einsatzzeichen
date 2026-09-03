# Fachreview-Werkzeug — Design

> Stand: 3. September 2026
> Zweck: eine Oberfläche, in der eine Person mit einsatztaktischer Fachkunde die 558 offenen
> Fachreviews einzeln entscheidet, statt sie in einem 544-zeiligen Markdown-Dossier zu suchen.

## 1 Problem

`pnpm cli review-dossier` erzeugt heute das vollständige Reviewpaket als Markdown. Es ist zum
Lesen brauchbar und zum Abarbeiten ungeeignet: kein Bild, keine Nachbarschaft, kein Fortschritt,
und der Befund muss von Hand in `packages/catalog/src/domain-reviews.ts` übertragen werden.

Drei Befunde bestimmen das Design:

1. **Für 288 der 544 Manifestzeilen (53 %) gibt es heute kein Bild.** `buildSnapshot`
   (`packages/website/src/lib/snapshot-build.ts`) erzeugt nur für `catalog-entry` (14) und
   `composition-recipe` (242) ein Symbol; `element`-Zeilen fallen durch. 269 davon sind
   Piktogramme und damit renderbar, 19 nicht: acht Organisationsfarben, vier Stärkegrade, sieben
   Fahrzeugkategorien.
2. **Die erste echte Freigabe macht die Testsuite rot.** `domain-reviews.test.ts` nagelt rund
   fünfzehn Blöcke per `toEqual({ status: 'pending' })` fest und prüft in „erfindet keine
   Fachfreigabe", dass *alle* Reviews offen sind.
3. **Der Ledger-Schreiber braucht keine neue Abhängigkeit.** `typescript` ist bereits Dependency
   von `packages/cli`.

## 2 Ort und Stack

Neues **privates** Workspace-Paket `packages/review` (`private: true`, kein npm-Release),
Präzedenzfall `packages/website`. Ein Prozess, zwei Teile:

- **Server** (Node, `tsx`): liest Katalog, Manifest, Ledger und Fragenregister, rendert über
  `renderSvg` aus `core`, löst optional `taktische-zeichen/` auf, schreibt den Ledger.
- **Oberfläche** (Vite + React 19): eine Seite, clientseitiger Zustand.

Start über `pnpm review` im Repository-Wurzelverzeichnis. Der Server bindet ausschließlich an
`127.0.0.1`.

Eigenes `tsconfig.json` mit `jsx: react-jsx` wie bei der Website; `packages/review` steht dafür im
Root-`exclude`, und ein eigenes `typecheck`-Skript läuft in CI mit, damit nichts ungeprüft bleibt.
Vitest greift die Tests über das bestehende `packages/*/src/**/*.test.ts` von selbst.

Das Paket darf `schema`, `core` und `catalog` importieren. Es ist kein Ausgabekanal und wird von
keinem anderen Paket importiert.

## 3 Datenmodell

Der Server baut aus den drei Ledgern **558 Reviewzeilen**: 544 Manifest-, 13 Quellen-, ein
Profilträger. Der Vertrag steht in `packages/review/src/contract.ts` und ist die einzige Stelle,
an der Server und Oberfläche sich berühren.

Jede Manifestzeile trägt: Schlüssel, Abschnitt, Variante, Titel, Implementierung, Coverage-Art,
Profil, Bereich, Evidenz (Kürzel **und** ausgeschriebene Erklärung), das technische Review samt
Notiz, das aktuelle Fachreview, die zugeordneten `Q-…`-Fragen und den Referenzasset-Dateinamen.

Die Bereichseinteilung und ihre Reihenfolge sind dieselben wie in „Offene fachliche Reviews nach
Bereich" der Coverage-Zeile — es gibt keine zweite Bereichslogik.

## 4 Rendering

| Fall | Zahl | Zeichnung |
|---|---|---|
| `catalog-entry` | 14 | gemessene Zeichnung der beanspruchten Darstellung |
| `composition-recipe` | 242 | `composeFromCatalog(recipe.spec, recipe.title)` |
| `element`, Piktogramm | 269 | Piktogrammdefinition als eigenständige Zeichnung |
| `element`, nicht selbstständig | 19 | **Trägerzeichen** |

Die 19 nicht selbstständigen Elemente sind acht Organisationsfarben, vier Stärkegrade und sieben
Fahrzeugkategorien. Eine Organisationsfarbe ist ohne Körper nicht beurteilbar, ein Stärkegrad
ohne Kopfmarke nicht. Sie bekommen deshalb ein minimales Trägerzeichen über `SymbolSpec`
(`{ kind: 'formation', organization: … }`, `{ kind: 'formation', strength: … }`,
`{ kind: 'vehicle-land', vehicleCategory: … }`), und die Oberfläche kennzeichnet ausdrücklich,
dass der Träger Kontext ist und nicht Teil der geprüften Aussage.

Fail-closed: Lässt sich für eine Manifestzeile keine Zeichnung bilden, bricht der Aufbau mit einer
Fehlermeldung ab, die den Schlüssel nennt. Kein stiller Platzhalter — eine unsichtbare Zeile wäre
eine Zeile, die blind entschieden wird.

Quellen- und Profilzeilen tragen keine Zeichnung; ihre Detailansicht zeigt Nutzungsgrundlage,
Beschaffungsstand und Umgang mit der Geometrie aus dem Quellenregister.

## 5 Oberfläche

Drei Spalten.

**Links — Navigator.** Bereiche in der Reihenfolge der Coverage-Zeile, je mit Fortschrittsbalken
offen/freigegeben/abweichend. Darunter die Zeilen des gewählten Bereichs mit Miniatur, Schlüssel,
Titel und Statuspunkt. `/` öffnet die Suche über Schlüssel, Titel und Implementierung.
Standardfilter: nur offene Zeilen.

**Mitte — das Zeichen.** Groß auf neutralem Grund, umschaltbar über die Render-Themes aus
`catalog` und die sechs Größenstufen des Mehrgrößen-Gates (16, 24, 32, 64, 128, 256), weil
Verwechslungsfreiheit bei 16 px etwas anderes heißt als bei 256. Darunter der
**Nachbarschaftsstreifen**: die Zeichen desselben Abschnitts, anklickbar für den direkten
Nebeneinandervergleich. Darunter, sofern `taktische-zeichen/<referenceAsset>` existiert,
**Referenz und Eigenrendering nebeneinander** plus Überblendregler; fehlt der Ordner, steht dort
der Dateiname und der Hinweis, dass ohne ihn kein Referenzvergleich möglich ist.

**Rechts — Befundtafel.** Metadaten, dann die betroffenen `Q-…`-Fragen als Karten (Anzeige, kein
Antwortfeld), dann das Formular: Status, Notiz, Reviewer, Datum. Darunter läuft live
`reviewIssues()` aus `schema` — dieselbe Funktion, die das Coverage-Gate benutzt. Solange sie
etwas meldet, ist Speichern gesperrt und der Grund steht im Klartext da. Es gibt kein zweites
Regelwerk, das auseinanderlaufen könnte.

**Tastatur.** `j`/`k` blättern, `a` Freigabe, `w` Abweichung, `0` zurück auf offen, `Enter`
speichern und zur nächsten offenen Zeile, `1`–`6` Größenstufe, `t` Theme, `r`
Referenzüberblendung, `/` Suche, `?` Hilfe.

**Zustandssicherheit.** Angefangene Notizen liegen sofort im `localStorage` und überleben einen
Neustart. In den Ledger geht nur, was ausdrücklich gespeichert wird; es gibt kein Autosave in die
Datei — eine Freigabe ist ein bewusster Akt.

## 6 Schreibweg

`POST /api/review` schreibt **einen** Träger in den zuständigen Ledger:

1. Datei mit der TypeScript-Compiler-API parsen.
2. Die Property des Schlüssels finden; fehlt sie, abbrechen.
3. Ihren Initialisierer als **Textbereich** durch das gedruckte neue Objektliteral ersetzen, alles
   übrige unangetastet lassen. Kommentare, Reihenfolge und Formatierung bleiben damit erhalten.
4. Atomar schreiben: temporäre Datei im selben Verzeichnis, `fsync`, `rename` — dieselbe Disziplin
   wie in `packages/cli/src/commands/visual-proof.ts`.
5. Datei erneut parsen und prüfen, dass genau der beabsichtigte Eintrag dasteht.

Jede Freigabe ist ein eigenes, lesbares Git-Diff. Reviewer und Datum kommen aus der
Sitzungseinstellung; das Datum ist standardmäßig heute.

## 7 Reviewer-Register und Testumstellung

Neu: `packages/catalog/src/domain-reviewers.ts` mit `DOMAIN_REVIEWERS` — je Person Kennung, Name
und einsatztaktische Qualifikation, `deepFreeze` wie die übrigen Katalogdaten, exportiert über den
Paketindex. Beim ersten Start führt das Werkzeug durch das Anlegen des Eintrags und schreibt ihn
selbst; ohne Registereintrag verweigert es jeden Schreibvorgang.

`packages/catalog/src/domain-reviews.test.ts` wird umgestellt:

- „erfindet keine Fachfreigabe" prüft künftig, dass jede **nicht offene** Zeile `reviewIssues()`
  besteht und einen im Register geführten Reviewer nennt — statt zu prüfen, dass alles offen ist.
- Die blockweisen `toEqual({ status: 'pending' })` werden zu Strukturprüfungen: Schlüsselmenge und
  eigenes Reviewobjekt je Träger bleiben gegatet, der Statuswert wird nicht mehr festgenagelt.

Das ist bewusst eine Lockerung. Die Invariante wechselt von „keine Freigabe existiert" zu „keine
Freigabe ohne benannten, registrierten Prüfer, gültiges ISO-Datum und Befund". Ohne diesen Schritt
ist das Werkzeug nicht benutzbar, weil die erste echte Freigabe die Suite rot macht.

## 8 Sicherheits- und Policy-Grenzen

- Der Server bindet voreingestellt an `127.0.0.1`, keine Anmeldung, kein Mehrbenutzerbetrieb.
  `REVIEW_HOST=<adresse> pnpm review` bindet stattdessen an eine benannte Adresse dieses Rechners
  — etwa den Tailnet-Anschluss —, damit eine Fachperson von ihrem eigenen Gerät prüfen kann.
  Bewusst keine Bindung an `0.0.0.0`: eine benannte Adresse legt fest, über welche Schnittstelle
  das Werkzeug erreichbar ist, statt es auf allen zugleich anzubieten. Verlässt die Bindung die
  Rückschleife, sagt die Startmeldung ausdrücklich, dass ab dort jeder, der die Adresse erreicht,
  ohne Anmeldung in den Ledger schreiben und die lokalen Referenzbilder abrufen kann. Wer das
  nicht will, betreibt das Werkzeug weiter lokal und greift über einen SSH-Tunnel darauf zu.
- Referenzbilder werden **nur** aus `taktische-zeichen/` gelesen und nie geschrieben, nie kopiert
  und nie eingecheckt. Der Dateiname wird ausgegeben, ein Pfad nie.
- Der Zugriff wird auf Dateinamen aus `fingerprints.json` beschränkt; ein vom Client gelieferter
  Name wird nicht in einen Pfad eingesetzt.
- `pnpm cli verify:repository` muss unverändert bestehen.

## 9 Tests

- **Ledger-Umschreiber:** Kommentare erhalten, Nachbarzeilen unverändert, unbekannter Schlüssel
  bricht ab, ein abgebrochener Schreibvorgang lässt die Datei unverändert.
- **Zeilenaufbau:** 558 Träger, jeder Manifestschlüssel genau einmal, jede Zeile hat eine
  Zeichnung oder eine begründete Trägerzeichnung, Fragenzuordnung stimmt mit dem Register überein.
- **Trägerzeichen:** für alle 19 elementaren Zeilen entsteht eine gültige `Drawing`.
- **Referenzauflösung:** fehlender Ordner ergibt `available: false`, niemals einen absoluten Pfad;
  ein Name außerhalb des Registers wird abgewiesen.
- **Oberfläche:** Reduzierlogik des Formulars und die Statusableitung als reine Funktionen.

## 10 Nicht Teil des Umfangs

Keine Mehrbenutzerfähigkeit, keine Anmeldung, kein Export/Import, kein Antwort-Workflow für die
`Q-…`-Fragen (sie werden angezeigt, nicht beantwortet), keine Änderung an den acht publizierten
Paketen außer dem Reviewer-Register in `catalog` und der Testumstellung.
