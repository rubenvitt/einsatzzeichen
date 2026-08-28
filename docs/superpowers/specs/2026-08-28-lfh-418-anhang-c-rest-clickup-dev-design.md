# LFH-418 — Anhang C vollständig liefern und `clickup-dev` etablieren

> Design-Spec · 28. August 2026 · Status: im Chat vollständig freigegeben

## 1. Ziel

LFH-418 wird von derzeit drei umgesetzten Darstellungen (`C.1.1`, `C.1.2`, `C.1.3`) auf den
vollständigen Anhang C mit 59 von 59 Darstellungen gebracht. Die verbleibenden 56 Darstellungen
werden nicht in einem Groß-PR, sondern in zehn abhängigkeitsgeordneten, einzeln prüfbaren
Produkt-Slices geliefert.

Vor den Produkt-Slices entsteht ein projektlokaler, im Repository versionierter Codex-Skill
`.agents/skills/clickup-dev`. Er macht den vereinbarten ClickUp-, Branch-, Review-,
Screenshot-, Approval-, Merge- und Verifikationsablauf wiederverwendbar. Der Skill wird in einem
eigenen Bootstrap-PR geliefert und danach für alle zehn Produkt-Slices eingesetzt.

Die vom Projektinhaber freigegebene Liefergrenze ist die volle Lieferung mit einem ausdrücklichen
menschlichen Merge-Gate:

1. Draft-PR erstellen und katalogeigenen Screenshot im Codex-Chat anzeigen.
2. Auf das ausdrückliche Approval des Projektinhabers für den Branch warten.
3. Erst danach nach `main` mergen.
4. Den gemergten Stand frisch auf `main` vollständig verifizieren.
5. Erst bei grünem Main-Gate den zum PR gehörenden ClickUp-Subtask auf `shipped` setzen.

`done` wird durch diesen Ablauf niemals automatisch gesetzt.

## 2. Belegter Ausgangspunkt

Der aktuelle Remote-Stand zu Beginn des Designs ist `origin/main` auf
`4da0c5b6f2ae8c1a1c76e8baf4145ceec7336a78`. Der Branch enthält den über PR #14 gemergten
Slice `C.1.3`. Die frische Baseline im isolierten Codex-Worktree besteht aus 68 Testdateien und
5.201 von 5.201 bestandenen Tests.

Der Produktbestand lautet:

| Bereich | Referenzdarstellungen | umgesetzt | offen |
|---|---:|---:|---:|
| C.1 Einheiten | 15 | 3 | 12 |
| C.2 Fahrzeuge | 44 in 31 Abschnitten | 0 | 44 |
| **Anhang C** | **59** | **3** | **56** |

C.2 enthält 31 Primärdarstellungen und 13 Alternativen. Alternativen bestehen für C.2.14 bis
C.2.17 sowie C.2.20 bis C.2.28.

Der private BABZ-Referenzbestand liegt lokal im Hauptcheckout unter dem ignorierten Ordner
`taktische-zeichen`. Er wird weder kopiert noch committed. Die Implementierungsworktrees erhalten
nur einen lokalen, ignorierten Zugriff auf diesen Bestand, damit Messung und visuelle Prüfung
gegen die Originale möglich bleiben.

## 3. Abgrenzung

### Im Scope

- zwölf neue C.1-Rezepte für `C.1.4` bis `C.1.15`;
- 44 neue C.2-Rezepte einschließlich 13 eigenständiger Alternativdarstellungen;
- nur durch Quellenmessung belegte neue Körper-, Kopf-, Fahrwerks-, Text- und Innenmarkenverträge;
- Manifest-, Review-, Scope-, Snapshot-, Kontrast-, ViewBox- und Accessibility-Nachweise für jede
  Darstellung;
- katalogeigene, veröffentlichbare Screenshots und textuelle QA-Protokolle;
- ein projektlokaler, validierter `clickup-dev`-Skill;
- ClickUp-Subtasks, Branches, Draft-PRs, CI, menschliches Approval, Merge, Main-Verifikation und
  `shipped` gemäß dieser Spec;
- Abschluss von LFH-418 auf `shipped`, sobald 59 von 59 Darstellungen auf verifiziertem `main`
  vorliegen und alle zugehörigen Produkt-Subtasks `shipped` sind.

### Nicht im Scope

- keine automatische fachliche Freigabe; alle neuen Domainreviews beginnen als `pending`;
- kein automatischer Übergang auf `done`;
- keine Veröffentlichung privater Referenz-SVGs, Referenzraster, Paarbilder oder lokaler Pfade;
- keine Fahrzeugkategorie, Fähigkeit oder Bedeutung, die nur aus einem Dateinamen abgeleitet ist;
- keine Platzhaltergeometrie, Näherung oder stiller Fallback bei ungeklärter Quellenlage;
- keine zusammenhanglose Refaktorierung außerhalb der für Anhang C oder den Skill erforderlichen
  Verträge;
- kein paralleles Schreiben mehrerer Agenten in denselben Checkout oder dieselben zentralen
  Registerdateien.

## 4. Gewählter Lieferzuschnitt

Es wurden ein Groß-PR, ein PR je Darstellung und abhängigkeitsgeordnete fachliche Slices geprüft.
Gewählt sind die abhängigkeitsgeordneten Slices: Sie halten Architekturgrenzen sichtbar, begrenzen
Review- und Rollbackflächen und vermeiden zugleich 56-fachen Verwaltungsaufwand.

Vor ihnen steht ein nicht produktzählender Bootstrap-PR für den Skill:

| Reihenfolge | Liefergegenstand | Umfang | Darstellungen |
|---:|---|---|---:|
| 0 | `clickup-dev` Bootstrap | Skill, Projektvertrag, Templates, Validator und Evals | 0 |
| 1 | C1-b | C.1.4 bis C.1.6: Hilfeleistung, Fachzug, Brandschutz | 3 |
| 2 | C1-c | C.1.7 bis C.1.12: CBRN und Dekontamination | 6 |
| 3 | C1-d | C.1.13 bis C.1.15: Drohnen und Taucher | 3 |
| 4 | C2-a | C.2.1 bis C.2.13: reguläre Feuerwehrfahrzeuge | 13 |
| 5 | C2-b | C.2.14 bis C.2.17 einschließlich Alternativen | 8 |
| 6 | C2-c | C.2.18 und C.2.20 bis C.2.23 einschließlich Alternativen | 9 |
| 7 | C2-d | C.2.24 bis C.2.28 einschließlich Alternativen | 10 |
| 8 | C2-e | C.2.19: besonderer Wechselladerkörper | 1 |
| 9 | C2-f | C.2.29 und C.2.30: Anhänger | 2 |
| 10 | C2-g | C.2.31: geschützte Löschdrohne | 1 |

Die Summe der zehn Produkt-Slices ist exakt 56. Ein Slice darf nach genauer Vermessung intern
kleiner werden, wenn eine neu entdeckte Architekturgrenze dies verlangt; er darf nicht still um
weitere Abschnitte wachsen. Eine notwendige Verkleinerung wird vor dem Coding dokumentiert und der
ClickUp-Subtask entsprechend präzisiert. LFH-418 bleibt bis zur letzten Lieferung offen.

## 5. Datenfluss und Mappingvertrag

Vor dem ersten RED-Test eines Produkt-Slices entsteht für jede enthaltene Darstellung eine
belegte Mapping-Zeile:

```text
Referenzdatei
  -> Rezeptschlüssel und Darstellungsvariante
  -> Grundkörper und gegebenenfalls Körpervariante
  -> Organisation oder technische Füllung
  -> Stärkegrad oder technische Kopfmarke
  -> Fahrzeugkategorie beziehungsweise Fahrwerkszone
  -> Beschriftungsinhalt, -zone und gemessene Textmetriken
  -> semantische Fähigkeit oder neutrale technische Innenmarke
  -> Quellenbefund und Abweichungsstatus
  -> technischer und fachlicher Reviewstatus
```

Die Mapping-Zeile wird in der jeweiligen Entscheidungsnotiz als lesbare Matrix versioniert.
Messwerte dürfen versioniert werden; Originalpfade, Referenzbilder und lokale absolute Pfade nicht.

### Wiederverwendungsregel

Bestehende Bausteine werden bevorzugt, aber nur bei belegter Übereinstimmung:

- Grundkörper `formation`, `vehicle-land` und `trailer`;
- Organisation `feuerwehr` und ihre rote Referenzfüllung;
- vorhandene Stärkegrade und technische Kopfmarken;
- vorhandene, vollständig vermessene Fahrzeugkategorien;
- vorhandene Beschriftungszonen und explizite Textmetrikfelder;
- vorhandene Capability- oder BodyMark-Geometrie, wenn der Quellenvergleich dieselbe Fassung
  belegt.

Ein gleicher Titel, eine ähnliche Silhouette oder ein Fahrzeugname genügt nicht. Insbesondere wird
keine Fahrzeugkategorie aus `Kommandowagen`, `Tanklöschfahrzeug`, `Drehleiter` oder einem anderen
Dateinamensbestandteil abgeleitet.

### Neue technische IDs

Ist die sichtbare Geometrie belegt, ihre Kapitel-4- oder Fachsemantik aber nicht, wird eine neutrale
`TechnicalBodyMarkId` verwendet. Die ID beschreibt die gemessene Form und ihren zulässigen Kontext,
nicht eine unbestätigte Bedeutung. Jeder neue Resolver ist fail-closed: falscher Körper,
unzulässige Variante oder fehlender Messvertrag führt zu einem Fehler statt zu einem Fallback.

## 6. C.1-Komponentenvertrag

Alle C.1-Darstellungen bleiben Formationen mit Feuerwehrfüllung. Die bestehende
formationsgebundene `fire-fighting`-Fassung bleibt von der Kapitel-4-Boxfassung getrennt.

Der erwartete, vor Implementierung nochmals direkt zu vermessende Vertrag lautet:

| ID | vorgesehene Komposition | neue Grenze |
|---|---|---|
| C.1.4 | Zug + formationsgebundene technische Hilfeleistung | neue gemessene C.1-Fassung |
| C.1.5 | Zug + zentrales `FZ-` | Textzone und Metrik belegen |
| C.1.6 | vorhandener technischer Einzelbalken + `FB` + Brandbekämpfungsmarke | Wiederverwendung geometrisch bestätigen |
| C.1.7 | Trupp + formationsgebundene CBRN-Erkundungsmarke | neue gemessene C.1-Fassung |
| C.1.8 | Staffel + Dekontaminationsmarke + `P` | verschobener Staffelrumpf und Textlage |
| C.1.9 | Gruppe + dieselbe belegte CBRN-Erkundungsfassung | Identität zu C.1.7 prüfen |
| C.1.10 | Gruppe + dieselbe belegte Dekontaminationsfassung + `G` | Identität zu C.1.8 prüfen |
| C.1.11 | Zug + technische Gefahrstoff-/Schutzform | nicht auf F.1.2 zurückfallen |
| C.1.12 | Zug + CBRN-Erkundungsfassung + `ATF` | Textmetriken belegen |
| C.1.13 | Trupp + erste technische Drohnenform | eigenständige neutrale ID |
| C.1.14 | Trupp + zweite technische Drohnenform | nicht mit C.1.13 zusammenlegen |
| C.1.15 | Gruppe + technische Taucher-/Wasserform | nicht ungeprüft auf Wasserrettungsmarken abbilden |

Die Tabelle ist eine Designhypothese aus Inventar und bestehender Architektur, kein Ersatz für den
Quellenvergleich. Weicht die Originalmessung ab, gilt die Originalmessung und die Entscheidung wird
vor dem GREEN-Schritt korrigiert.

## 7. C.2-Komponentenvertrag

C.2 besteht aus 44 Feuerwehr-Fahrzeugdarstellungen. Für jede Darstellung werden Körper, Fahrwerk,
Innenmarke, Text und Variante unabhängig belegt.

### Vorhandene Bausteine

- Die normale rote Landfahrzeughülle ist für den Großteil des Bestands ein Kandidat.
- Die sieben vollständig vermessenen Fahrwerkskategorien können wiederverwendet werden, wenn die
  Rad-, Ketten- oder Anhängeranordnung im Referenzbild übereinstimmt.
- C.2.29 und C.2.30 sind Kandidaten für den vorhandenen Anhängerkörper.
- Alternativen werden als eigene Rezeptschlüssel `C.2.x#alternative` mit eigener Manifest-,
  Snapshot- und Reviewzeile modelliert.

### Isolierte Sonderfälle

- C.2.19 besitzt eine gemessene Hülle, die weder der normalen Landfahrzeughülle noch der
  vorhandenen Swap-Loader-Fassung entspricht. Eine neue Körpervariante entsteht nur nach
  vollständiger Vermessung von Kontur, Platzierung und Fahrwerk.
- C.2.31 ähnelt in seinen Hüllmaßen einer vorhandenen invertierten Kettenhülle. Diese Ähnlichkeit
  erlaubt keine Wiederverwendung, bevor Kontur, Fahrwerk und Innenform im Sichtvergleich bestätigt
  wurden.

Die Sonderfälle stehen am Ende, damit vorher alle gemeinsam nutzbaren Fahrzeug- und Textverträge
stabil sind.

## 8. Katalogstruktur

Neue Anhang-C-Rezepte leben in einer fokussierten Datei
`packages/catalog/src/recipes-anhang-c.ts`. Sie exportiert getrennte Register je Slice;
`packages/catalog/src/recipes.ts` bleibt Integrations- und Kompositionspunkt.

Ein Slice ändert nur die kleinste notwendige Menge aus:

- Schema-IDs und deren Labelverträge;
- technische Kopfmarken, Körpervarianten oder BodyMark-Resolver;
- Anhang-C-Rezeptregister;
- Coverage-Manifest und technische Reviews;
- Domainreviews;
- direkte und Mehrgrößen-/Theme-Snapshots;
- Renderfälle, Kontrast- und ViewBox-Gates;
- Entscheidung, QA-Protokoll und katalogeigener Screenshot;
- README und Coverage-Erwartungen, soweit der Produktscope wächst.

`fingerprints.json` ist ein bestehendes Kennzahlenartefakt und wird nicht als Geometriequelle
missbraucht. Es ändert sich nur, wenn der definierte Referenz-Audit eine echte Aktualisierung des
lokalen Bestands belegt; nicht als normaler Bestandteil eines Rezeptslices.

## 9. Projektlokaler `clickup-dev`-Skill

Der Bootstrap-PR legt folgende Struktur an:

```text
.agents/skills/clickup-dev/
├── SKILL.md
├── references/
│   ├── project-contract.md
│   └── review-and-delivery.md
└── templates/
    ├── clickup-subtask.md
    └── pr-body.md
```

### Verantwortungsgrenzen

- `SKILL.md` enthält den generischen Zustandsautomaten und seine Sicherheitsgates.
- `project-contract.md` enthält die Einsatzzeichen-spezifischen, vor jeder Nutzung live zu
  verifizierenden Werte und Kommandos.
- `review-and-delivery.md` beschreibt Reviews, Screenshots, Approval, Merge und Main-Verifikation.
- Die Templates sichern Ergebnis, Nicht-Ziele, Akzeptanzkriterien und Nachweise in ClickUp und PR.

Der generische Ablauf enthält keine universell behaupteten Workspace-, Listen- oder Statuswerte.
Der aktuelle Projektadapter lautet:

- ClickUp Workspace: `9015920204`;
- Liste: `901525048064` (`Einsatzzeichen`);
- normaler Vorwärtspfad:
  `backlog -> scoping -> in design -> ready for development -> in development -> in review -> testing -> shipped -> done`;
- `cancelled` ist ein eigener Abbruchstatus und kein Schritt des normalen Pfads;
- Repository: `rubenvitt/einsatzzeichen`;
- Branchpräfix: `codex/`;
- vollständige lokale Gates: `pnpm test`, `pnpm typecheck`, `pnpm cli coverage`,
  `git diff --check` und sauberer Git-Status.

Der Skill muss die Werte vor einer Mutation über die offiziellen ClickUp- und GitHub-Schnittstellen
beziehungsweise den aktuellen Git-Remote verifizieren. Eine Abweichung stoppt den Ablauf und wird
gemeldet; sie wird nicht durch veraltete Konstanten überschrieben.

### Skill-Validierung

Der Skill wird mit dem offiziellen Validator geprüft. Zusätzlich werden mindestens diese Szenarien
als Evals ausgeführt:

1. Erfolgsfall bis Draft-PR: Der Ablauf stoppt nach PR und Chat-Screenshot vor dem Merge.
2. Fehlendes Approval: Kein Merge und kein `shipped`.
3. Rotes Gate oder rote CI: Kein Merge und kein `shipped`; Reparatur bleibt auf demselben Branch.
4. Approval und grüner Merge: Main wird frisch geprüft, danach genau der PR-Subtask auf `shipped`
   gesetzt.
5. Unvollständiger Parent: Ein `shipped`-Subtask schließt LFH-418 nicht vor 59 von 59.
6. Geheimnis-/Lizenzgrenze: Referenzdateien, Paarbilder und lokale Pfade werden abgelehnt.

Der Bootstrap-PR enthält keinen Produktzuwachs. Im Codex-Chat wird deshalb statt eines
Katalogkontaktbogens eine gerenderte Ansicht von Workflow und Eval-Ergebnis gezeigt. Der Branch
durchläuft denselben menschlichen Approval-, Merge- und Main-Gate-Prozess wie die Produkt-Slices.

## 10. ClickUp-, Branch- und PR-Zustandsautomat

Für jeden Produkt-Slice wird unter LFH-418 ein ausführbarer Subtask mit Ergebnis, Nicht-Zielen,
Akzeptanzkriterien, Abhängigkeiten und Verifikationspfad angelegt. Der Bootstrap-Skill erhält einen
eigenen technischen Subtask, zählt aber nicht zu den 59 Produktdarstellungen.

Der normale Ablauf ist:

1. Task und Projektvertrag live lesen; keine Mutation bei Widerspruch.
2. Subtask anlegen beziehungsweise den bereits angelegten eindeutigen Subtask wiederverwenden.
3. Design/Plan abschließen und Subtask auf `ready for development` setzen.
4. Frischen isolierten Worktree auf aktuellem `origin/main` und `codex/`-Branch erstellen.
5. Den ersten RED-Test schreiben; bei tatsächlichem Implementierungsbeginn auf `in development`.
6. Implementieren, fokussiert prüfen und lokal visuell gegen die private Referenz vergleichen.
7. Nach GREEN auf `in review`, nach den unabhängigen Reviews und allen lokalen Gates auf
   `testing`.
8. Branch pushen, Draft-PR erstellen, CI beobachten und offene Findings beheben.
9. Katalogeigenen Screenshot im PR einbetten und im Codex-Chat über einen absoluten lokalen
   Bildpfad anzeigen.
10. Stoppen und ausdrücklich auf das Branch-Approval des Projektinhabers warten.
11. Nach Approval und weiterhin grüner CI per bestehendem Repositoryverfahren nach `main` mergen.
12. Den effektiven Remote-`main` frisch prüfen und dort alle vollständigen Gates erneut ausführen.
13. Nur bei grünem Main-Gate den PR-Subtask auf `shipped` setzen.
14. Branch und ausschließlich den eigenen Worktree nach bestätigter Integration bereinigen.

Ein Approval gilt nur für den im Chat benannten Branch/PR und den gezeigten HEAD. Ändert sich der
Branch danach materiell, ist ein neues Approval erforderlich.

LFH-418 selbst wird erst auf `shipped` gesetzt, wenn:

- alle 59 Darstellungen im Manifest und Produktscope vorhanden sind;
- `pnpm cli coverage` den vollständigen Anhang C ohne Lücke meldet;
- alle zehn Produkt-Subtasks `shipped` sind;
- der letzte Remote-`main` die vollständigen Gates besteht;
- der Projektinhaber den letzten Branch freigegeben hat.

`done` bleibt eine separate spätere Abnahmeentscheidung.

## 11. Test- und Reviewvertrag je Produkt-Slice

Jeder Slice benötigt mindestens:

1. RED-Tests für die exakten Rezeptdaten und jede neu eingeführte Geometrie.
2. Kontexttests, die neue technische Resolver in unzulässigen Körpern und Varianten fail-closed
   scheitern lassen.
3. Manifesttests für jede Primär- und Alternativdarstellung.
4. Je Darstellung einen technischen Review und einen eigenständigen fachlichen Reviewstatus
   `pending`.
5. Direkte SVG-Snapshots sowie Mehrgrößen-/Theme-Snapshots.
6. Fingerprint-, ViewBox-, Accessibility- und Kontrastgates.
7. Einen katalogeigenen Kontaktbogen und ein textuelles QA-Protokoll.
8. Einen lokalen, nicht veröffentlichten Referenzvergleich jeder Darstellung.
9. Einen unabhängigen Task-Review und anschließend einen Whole-Branch-Review gegen aktuellen
   `origin/main`.
10. Die vollständigen Kommandos `pnpm test`, `pnpm typecheck`, `pnpm cli coverage`,
    `git diff --check` und einen sauberen Git-Status.
11. Grüne PR-CI vor dem Approval-Wartepunkt und weiterhin grüne CI unmittelbar vor dem Merge.
12. Nach dem Merge dieselben vollständigen lokalen Gates auf dem effektiven `main`.

Snapshot-Updates sind Ergebnisse geprüfter Semantik und Geometrie; sie dürfen nicht zur
Fehlerbeseitigung blind neu geschrieben werden.

## 12. Fehler- und Blockerverhalten

Der Ablauf ist fail-closed:

- Ungeklärte Quellengeometrie blockiert den jeweiligen Slice, bis sie vermessen ist.
- Eine unklare Bedeutung führt zu einer neutralen technischen ID und `pending`, nicht zu einer
  erfundenen Capability. Ist auch die technische Form ungeklärt, wird nichts gebaut.
- Ein roter fokussierter Test, ein rotes Vollgate, ein Reviewbefund oder rote CI verhindert PR-
  Approval-Reife, Merge und `shipped`.
- Ein Mergefehler oder rotes Main-Gate lässt den Task unterhalb von `shipped`; der Zustand wird
  repariert und vollständig neu geprüft.
- Fehlende ClickUp-/GitHub-Berechtigung wird als externer Blocker gemeldet. Der Codezustand wird
  nicht mit einem unbewiesenen Boardzustand gleichgesetzt.
- Ein fremder Prozess, fremder Worktree oder fremde uncommittete Änderung wird niemals beendet,
  bereinigt oder überschrieben.
- Widersprechen Task, Projektvertrag und Live-Board einander, gilt keine implizite Priorität:
  Mutation stoppt, bis die konkrete Abweichung geklärt ist.

## 13. Veröffentlichungs- und Screenshotvertrag

Jeder Produkt-PR darf veröffentlichen:

- rekonstruierten Quellcode und Tests;
- textuelle Messwerte und Entscheidungen;
- katalogeigene SVG-/PNG-Ausgabe;
- ein QA-Protokoll ohne Referenzraster oder lokalen absoluten Pfad.

Er darf nicht veröffentlichen:

- private BABZ-SVGs;
- aus der Referenz gerenderte Raster;
- Referenz-vs.-Katalog-Paarbilder;
- kopierte Originalpfade;
- lokale absolute Referenzpfade oder andere private Bestandsmetadaten.

Im Codex-Chat wird nach Erstellung des Draft-PRs der versionierbare katalogeigene Screenshot mit
absolutem lokalem Bildpfad angezeigt. Der Begleittext nennt Branch, PR, HEAD, Gatezahlen und offene
fachliche Reviews. Diese Nachricht ist der menschliche Approval-Wartepunkt.

## 14. Akzeptanzkriterien des Gesamtvorhabens

Das Vorhaben ist technisch vollständig, wenn alle folgenden Aussagen belegt sind:

1. Der projektlokale `clickup-dev`-Skill ist validiert, per Bootstrap-PR freigegeben und auf
   `main` vorhanden.
2. Alle zehn Produkt-Slices durchliefen den Skillzustandsautomaten mit dokumentiertem
   Branch-Approval.
3. Das Katalogregister führt exakt alle 59 Anhang-C-Darstellungen einschließlich 13 Alternativen.
4. C.1.1 bis C.1.15 und C.2.1 bis C.2.31 sind durch explizite Lückenlosigkeitstests abgedeckt.
5. Keine neue Semantik oder Fahrzeugkategorie wurde allein aus Dateinamen abgeleitet.
6. Alle neuen technischen Geometrien sind gemessen, kontextgebunden und fail-closed.
7. Alle Domainreviews bleiben bis zu einer tatsächlichen fachlichen Prüfung korrekt auf `pending`.
8. Für jeden Slice existieren katalogeigene Screenshots, QA-Protokolle und private lokale
   Referenzvergleiche ohne Veröffentlichung des Bestands.
9. Jeder gemergte Stand bestand die vollständigen Gates auf dem effektiven `main`.
10. Alle Produkt-Subtasks und LFH-418 stehen auf `shipped`; kein Task wurde automatisch auf
    `done` gesetzt.
11. Remote-`main`, ClickUp und der berichtete Abschlusszustand stimmen nachweislich überein.

## 15. Genehmigte Entscheidungen

Der Projektinhaber hat im Chat ausdrücklich genehmigt:

- volle Lieferung einschließlich ClickUp, Push, Draft-PR, Merge und Main-Verifikation;
- abhängigkeitsgeordnete Lieferung in zehn Produkt-Slices;
- den Daten-, Wiederverwendungs- und fail-closed Komponentenvertrag;
- Draft-PR und Screenshot im Chat als verpflichtenden Approval-Wartepunkt;
- Merge erst nach seinem Branch-Approval;
- `shipped` erst nach Merge und grüner Main-Verifikation;
- einen projektlokalen Skill unter `.agents/skills/clickup-dev/`;
- den in dieser Spec beschriebenen Workflow- und Testvertrag.
