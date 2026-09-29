# Vorfrage zu G.3.2: Ist die Bundespolizei eine eigene Organisation? (LFH-586)

Stand: 29.09.2026 · Parent LFH-582 · Anschluss an
`docs/reviews/2026-09-29-lfh-586-g-3-2-polizei-oder-bundespolizei.md`, Abschnitt 6.1

Status: **Vorbereitung, keine Entscheidung.** Das Dokument sammelt Belege zu einem Teil der
Registerfrage `Q-N-traegerzuordnung` und formuliert die Frage an den Projektinhaber. Es ändert
weder Code noch Reviewstatus.

Die Registerfrage lautet vollständig: „Gehören kommunaler Bauhof und Beauftragter Dritter zur
sonstigen Gefahrenabwehr, ist die Bundespolizei zu Recht eine getrennte Organisation, und stimmen
die Bundeswehr-/Feuerwehr-/ZIV-Zuordnungen?“ (N.1.1 bis N.1.6). Am 29.09.2026 wurde entschieden,
**zuerst** den mittleren Teil zu klären. Um ihn geht es hier.

## Kurzfassung

- **Das Begleitheft ordnet die Bundespolizei ausdrücklich der Polizei zu.** Die Erläuterung zur
  Farbtafel 2.5 „Polizei“ im BBK-Heft von 2025 nennt als Beispiele Landespolizei, Bundespolizei,
  Bundes- und Landeskriminalämter und Zoll. Eine eigene Organisation oder Farbe für die
  Bundespolizei kennt das Heft nicht. „BuPol“ steht dort in der Liste der Kurzbezeichnungen
  neben „LPol“ (Landespolizei) und „BePol“ (Bereitschaftspolizei). Es ist also eine Abkürzung,
  keine eigene Organisation. Die Vorgängerfassung von 2010 sagt dasselbe; sie wurde für dieses
  Dokument im Original gelesen.
- **Das Hellgrün `#64dc32` ist im Heft die Farbe der Polizei, nicht die der Bundespolizei.** Das
  Heft zeichnet seine eigene Farbtafel 2.5 „Pol“ in genau diesem Hellgrün. In seiner Farbtabelle
  (Anhang O.1) steht „Polizei — #64DC32 — Limette“.
- **Die Trennung im Repo beruht auf einem einzigen Schluss:** Die SVG-Datei zu N.1.3
  („Einsatzfahrzeug Bundespolizei“) ist hellgrün, die SVG-Farbtafel 2.5 dunkelgrün. Daraus wurde
  am 26.08.2026 eine eigene Organisation `bundespolizei` abgeleitet. Das Heft stützt diesen
  Schluss nicht. Beide Grüntöne kommen darin als Polizeifarbe vor.
- **Damit verschiebt sich die Frage.** Ob die Bundespolizei eine eigene Organisation ist, ist aus
  den Quellen gut beantwortbar: eher nicht. Wirklich offen ist, **welches Grün** die Polizei
  trägt. Die SVG-Sammlung und das Heft verwenden zwei verschiedene Farbreihen.

## 1. Was die Referenz-SVGs zeigen

Grundlage: die 661 lokalen Referenzdateien (BABZ-Arbeitsstand, Quelle `babz-svg-2025`).

### 1.1 Kapitel 2: welche Organisationen eine eigene Tafel haben

Kapitel 2 hat **acht Organisationstafeln** (vollflächiger Fleck mit Kurzbezeichnung unten
rechts) und **fünf reine Farbtafeln** ohne Beschriftung. Die Beschriftungen liegen in den Dateien
nur als Umrisse vor. Sie wurden gerastert und abgelesen.

| Tafel | Organisation | Beschriftung | Füllung |
|---|---|---|---|
| 2.1 | Feuerwehr | „Fw“ | `#fa1919` |
| 2.2 | (Hilfs-)Organisationen | „HiOrg“ | `#ffffff` |
| 2.3 | Technisches Hilfswerk | „THW“ (weiß) | `#003296` |
| 2.4 | Führung, Leitung | „Bez.“ (Platzhalter für eine Bezeichnung) | `#fafa00` |
| 2.5 | Polizei | „Pol“ | `#14a01e` |
| 2.6 | Bundeswehr | „Bw“ | `#b4783c` |
| 2.7 | Sonstige Gefahrenabwehr | „Sonst.“ | `#fa8c00` |
| 2.8 | Zivile Einheiten | „ZIV“ | `#bebebe` |
| 2.9 bis 2.13 | Farbtafeln Schwarz, Blau, Rot, Gelb, Grün | keine | 2.13 Grün: `#14a01e` |

**Eine Tafel für die Bundespolizei gibt es nicht**, auch keine Farbtafel in Hellgrün.

### 1.2 Wo Bundespolizei, „BuPol“ und Hellgrün vorkommen

| Datei | Titel im Dateinamen | Füllung | Beschriftung |
|---|---|---|---|
| `D.4.4_Leiter Gefahrenabwehrkräfte Bundespolizei.svg` | Bundespolizei | `#64dc32` | „BuPol“, dazu fünf Sterne (Bund) |
| `N.1.3_Einsatzfahrzeug_Bundespolizei.svg` | Bundespolizei | `#64dc32` | „BuPol“ |
| `G.3.2_Verpflegungszubereitungsstelle_betrieben durch Polizei.svg` | **Polizei** | `#64dc32` | keine |
| `2.5_Polizei.svg` | Polizei | `#14a01e` | „Pol“ |

Außer diesen vier Dateien nennt kein Dateiname die (Bundes-)Polizei. Vorbehalt: Beschriftungen
liegen nur als Umrisse vor. Eine „BuPol“-Beschriftung in einer anders benannten Datei ohne grüne
Fläche fände diese Suche nicht. `#64dc32` kommt in genau
diesen drei Dateien vor. `#14a01e` steht außer in 2.5 nur in Signal- und Zustandszeichen: 2.13,
2.14 (zwei Dateien), M.3 und 5.8.2.1 bis 5.8.2.3.

### 1.3 Die übrigen N.1-Zeichen

| Zeichen | Titel | Füllung | Organisation im Repo |
|---|---|---|---|
| N.1.1 | Bergeräumpanzer Bundeswehr | `#b4783c` braun | `bundeswehr` |
| N.1.2 | Transportfahrzeug kommunaler Bauhof, geländegängig | `#fa8c00` orange | `sonstige-gefahrenabwehr` |
| N.1.3 | Einsatzfahrzeug Bundespolizei | `#64dc32` hellgrün | `bundespolizei` |
| N.1.4 | Drehflügler Bundeswehr CH-53 | `#b4783c` braun | `bundeswehr` |
| N.1.5 | Löschflugzeug Beauftragter Dritter | `#fa8c00` orange | `sonstige-gefahrenabwehr` |
| N.1.6 | Erkundungsflugzeug Feuerwehr Cessna 172 | `#fa1919` rot | `feuerwehr` |

Bei N.1.3 hängt die Organisation allein an der Farbe. Bei allen anderen N.1-Zeichen stimmen
Füllfarbe und Kapitel-2-Tafel überein.

## 2. Was das Begleitheft zeigt

### 2.1 Die Quelle

Geprüft wurde das BBK-Heft „Taktische Zeichen im Bevölkerungsschutz — Empfehlungen zur
Einführung einer FwDV 102/DV 102“, Reihe „Fachinformation“. Der Titel ist wörtlich derselbe wie
bei der Repo-Quelle `bbk-babz-2025` (`packages/conformance/src/sources.ts`).

- 128 Seiten, im PDF als letzte Änderung der 23.01.2025 vermerkt
- SHA-256 `19533d622d3fbad2824b138d28c9b252c2f43c95e22bf428d2ea655424c3aae2`
- Öffentlich gespiegelt beim
  [Kreisfeuerwehrverband Aschaffenburg](https://kfv-ab.de/images/KFV/2025/250228_TZ/Taktische_Zeichen_im_Bevoelkerungsschutz.pdf)
  und bei
  [einsatztraining.de](https://einsatztraining.de/wp-content/uploads/2025/07/BBK_Taktische-Zeichen-im-Bevoelkerungsschutz.pdf).
  Die [BABZ-Lernplattform](https://lernplattform-babz-bund.de/goto.php?target=cat_109540) hat
  die Verbreitung nach eigener Angabe ausgesetzt.

**Vorbehalt:** Ob das Heft und die lokale SVG-Sammlung genau denselben Arbeitsstand zeigen, ist
nicht belegt. Die Farben unterscheiden sich systematisch (siehe 2.3).

Seitenangaben unten: gedruckte Seitenzahl, dahinter die PDF-Seite in Klammern.

### 2.2 Aussagen im Text

- **2.5 Polizei**, S. 17 (PDF 19): Grün kennzeichnet Einheiten der Polizeibehörden. Als Beispiele
  nennt das Heft Landespolizei, Bundespolizei, Bundes- und Landeskriminalämter und Zoll.
  Kurzbezeichnung „Pol“.
- **P.6 Kurzbezeichnungen**, S. 121 f. (PDF 123 f.): „BuPol“ für Bundespolizei, „BePol“ für
  Bereitschaftspolizei, „LPol“ für Landespolizei, „Pol“ für Polizei. Nach Fußnote 2 zu Kapitel 2
  kann die Kurzbezeichnung der Organisation unten rechts im Zeichen stehen. Das empfiehlt sich
  vor allem bei einer Darstellung in Schwarz-Weiß. *(Deutung, nicht Wortlaut: „BuPol“ im Zeichen
  benennt demnach den Träger genauer. Eine eigene Farbe begründet es nicht.)*
- **Geltungsbereich**, S. 8 (PDF 10): Das Heft zeigt Beispiele für die **nicht polizeiliche**
  Gefahrenabwehr. Die Zeichen sollen für Polizei und Bundeswehr „grundlegend verständlich“ sein.
  Eigene Polizeizeichen regelt das Heft nicht.
- **Anhangstitel:** D.4.4 „Leiter der Gefahrenabwehrkräfte der Bundespolizei“ (S. 80), G.3.2
  „Verpflegungszubereitungsstelle, betrieben durch die Polizei“ (S. 95), N.1.3 „Einsatzfahrzeug
  der Bundespolizei“ (S. 114).

### 2.3 Farben im Heft

Die Seiten wurden gerastert und die Farbwerte pixelgenau ausgezählt.

| Stelle im Heft | Polizei-Grün |
|---|---|
| Kurzübersicht, Beispiel „Pol“ (PDF 2) | `#64dc32` |
| Farbtafel 2.5 „Pol“, S. 17 | `#64dc32` |
| Farbtafel 2.13 „Grün“ (Sicherheit), S. 18 | `#64dc32` |
| B.1 Führungsorganisation, Zeichen „POL“, S. 66 | `#64dc32` |
| B.2 Lagekarte, Zeichen „Pol“, S. 69 | **`#14a01e`** |
| D.4.4, G.3.2 und N.1.3 im Anhang | `#64dc32` |
| **O.1 „Empfohlene Farbspektren“, S. 116** | **Polizei `#64DC32` „Limette“**, Sicherheit ebenfalls `#64DC32` |

Das Heft verwendet zwei Farbreihen, und das nicht nur bei der Polizei:

| Bedeutung | SVG-Tafel Kapitel 2 | Heft Kapitel 2 und O.1 | Zeichnungen im Heft-Anhang |
|---|---|---|---|
| Feuerwehr | `#fa1919` | `#FA321E` | `#fa1919` |
| THW | `#003296` | `#003399` | `#003296` |
| **Polizei** | **`#14a01e`** | **`#64DC32`** | **`#64dc32`** (D.4.4, G.3.2, N.1.3, B.1), `#14a01e` (B.2) |
| Sicherheit (Grün) | `#14a01e` | `#64DC32` | `#14a01e` (Rettungsweg S. 19) |
| Gelb, Orange, Braun, Grau | gleich | gleich | gleich |

Die O.1-Werte für Feuerwehr und THW (`#FA321E`, `#003399`) kommen in **keiner** der 661
SVG-Dateien vor. Im Heft stehen sie auf der Kurzübersicht, den Kapitel-2-Tafeln, in O.1 und in
einer einzigen Beispielzeichnung (Löschgruppe, S. 53). Alle übrigen Zeichnungen in den Kapiteln 3
bis 5 und in den Anhängen folgen bei Feuerwehr und THW der SVG-Reihe. Bei der Polizei ist es
umgekehrt: Drei SVG-Dateien tragen den O.1-Wert, nämlich D.4.4, G.3.2 und N.1.3. Es sind die
einzigen O.1-Werte in der ganzen SVG-Sammlung.

O.1 selbst nennt seine Werte Orientierungsbeispiele für eine aufgehellte Darstellung auf Papier
und ähnlichen Trägern. Bei der Polizei ist der Unterschied zur SVG-Reihe groß (ΔE ≈ 17), bei
Feuerwehr und THW kaum sichtbar.

**Befund:** In keiner der beiden Farbreihen hat die Bundespolizei eine eigene Farbe. Hellgrün
ist dort, wo das Heft es erklärt, die Farbe der Polizei.

## 3. Öffentliche Sachlage (kurz)

- **Vorgängerfassung 2010** (SKK, Arbeitsgruppe „Harmonisierung“, 56 Seiten,
  [Spiegel im Einsatzleiterwiki](https://wiki.einsatzleiterwiki.de/lib/exe/fetch.php?rev=1302165454&media=allgemein:empfehl_takt_zeichen_im_bevsch.pdf)),
  S. 10: Tafel 2.5 grün für „Polizei, Bundespolizei, Zoll“, mit dem Hinweis „zur
  Zusammenarbeit“. Die Tafel 2.6 orange umfasst laut Fußnote auch Bauhof und beauftragte Firmen.
  Die Bundespolizei hat dort nur die Kurzbezeichnung „BPOL“. Das Scoping-Dokument
  `docs/superpowers/specs/2026-08-28-lfh-433-legacy-migration-scoping.md` hatte das richtig
  wiedergegeben. Jetzt ist es aus erster Hand bestätigt.
- **Begleitende Hinweise zur Überarbeitung** (Stand 12.02.2024,
  [Spiegel DRK-Landesverband Saarland](https://www.lv-saarland.drk.de/fileadmin/user_upload/Begleitende_Hinweise_zur_%C3%9Cberarbeitung.pdf)):
  Die überlieferten Organisationsfarben Grün (Polizei) und Braun (Bundeswehr) wurden
  weitergeführt, weil die Zusammenarbeit mit Polizei und Bundeswehr zunimmt. Eine neue Farbe für
  die Bundespolizei wird nicht erwähnt.
- **Übliche Darstellungen:** Die
  [DV 102 der DLRG](https://bez-osnabrueck.dlrg.de/fileadmin/groups/8350000/Einsatz/dv102_taktische_zeichen.pdf)
  übernimmt die Tafel von 2010 unverändert: grün für „Polizei, Bundespolizei, Zoll“. Die
  [deutschsprachige Wikipedia](https://de.wikipedia.org/wiki/Taktische_Zeichen) führt Grün als
  Farbe der Polizei. Eine eigene Farbe für die Bundespolizei fand sich in keiner der gesichteten
  Quellen.
- **Nicht belegt:** Einen Polizei-Zeichensatz mit getrennter Bundespolizei-Farbe haben wir nicht
  gefunden. Laut DLRG-Fassung regelt die Polizei ihre Taktischen Zeichen in einer eigenen
  Polizeidienstvorschrift 102. Diese ist nicht öffentlich zugänglich und wurde nicht eingesehen.
- **Geltung:** Das Heft ist keine gültige Dienstvorschrift. Seine vorläufige Anwendung wurde
  aufgehoben, die Überarbeitung läuft (siehe `sources.ts`). Das ändert nichts an seiner
  Farbsystematik, schwächt aber jedes „das Heft schreibt vor“.

## 4. Wie das Repo die Bundespolizei heute führt

- **Organisationsliste:** `packages/schema/src/taxonomy.ts` (`OrganizationId`) und
  `taxonomy-values.ts` führen neun Organisationen: die acht aus Kapitel 2 und dazu
  `bundespolizei`.
- **Farbe:** `packages/core/src/geometry/organizations.ts`: `polizei → gruen (#14a01e)`,
  `bundespolizei → hellgruen (#64dc32)`. Der Kommentar dort sagt, N.1.3 belege die Bundespolizei
  als „eigenständige hellgrüne Organisation“, die „nicht mit der grünen Polizei kollabieren“
  dürfe. Dieselbe Begründung steht in `packages/core/src/blocks/base.ts`.
- **Drucktheme:** `render-themes.ts` gibt der Bundespolizei ein eigenes Konturmuster `[3, 1]`,
  der Polizei `[6, 2]`.
- **Rezepte:** `bundespolizei` tragen **zwei** Rezepte, N.1.3 und D.4.4. `polizei` trägt
  **eines**, G.3.2.
- **Weitere Stellen:** `packages/conformance/src/elements.ts` (Baustein
  `organization.bundespolizei`, belegt nur mit N.1.3), `packages/core/src/geometry/labels.ts`
  (Anzeigename), `validate.ts`, `function-roles.ts` (D.4.4 erwartet `bundespolizei`), Tests in
  `organizations.test.ts`, `elements.test.ts`, `recipes-anhang-n.test.ts`, `recipes.test.ts`,
  `labels.test.ts` sowie der Sammelbeleg `__snapshots__/multi-size/organization-profiles.svg`.

**Herkunft:**

1. Den Farbwert `hellgruen = #64dc32` gibt es seit dem ersten Stand (04.08.2026). Er wurde aus der
   Farbzählung der SVG-Sammlung übernommen und kam dort in drei Dateien vor. Zunächst war ihm
   keine Organisation zugeordnet.
2. `bundespolizei` kam mit Commit `31c2cbe` am 26.08.2026 hinzu (LFH-422, Anhang N, PR #16). Die
   Begründung in `docs/decisions/2026-08-26-anhang-n.md`: N.1.3 trägt exakt `#64dc32`, also wird
   die Bundespolizei eine eigene Organisation. Das Heft und seine Farbtafel wurden dafür nicht
   herangezogen. Die Entscheidung steht ausdrücklich unter dem Vorbehalt des fachlichen Reviews.
3. D.4.4 wurde zuerst als `polizei` gebaut (LFH-420). Am 19.09.2026 wurde es in `cbe92ab` (PR #56)
   auf `bundespolizei` umgestellt, weil Titel und Farbe dort beide Bundespolizei sagen.
4. G.3.2 blieb `polizei` (Entscheidungsnotiz vom 19.09.2026, §5.3).

## 5. Was sich dadurch am G.3.2-Dokument ändert

Das G.3.2-Dokument vom selben Tag bleibt unverändert. Es stützt sich allein auf die SVG-Sammlung.
Mit dem Heft sind folgende Aussagen dort zu korrigieren oder einzuschränken:

- **Kurzfassung und §3.3, „das Hellgrün steht nur neben ‚BuPol‘“:** Das gilt nur für die SVGs. Im
  Heft ist die Tafel 2.5 „Pol“ hellgrün, ebenso das „POL“-Zeichen in B.1.
- **§3.3, „außer der Farbtafel zeigt kein Zeichen die Polizei in `#14a01e`“:** Die Lagekarte B.2
  im Heft zeigt ein „Pol“-Zeichen in `#14a01e`. Das ist eine Abbildung im Heft, keine SVG-Datei.
- **§3.5, „keine Farbtafel für Hellgrün“:** Das gilt nur für die SVGs. Im Heft sind die Tafeln 2.5
  und 2.13 hellgrün, und O.1 führt `#64DC32` ausdrücklich als Farbe der Polizei.
- **§3.5, Altfassung „aus zweiter Hand“:** Sie ist jetzt aus erster Hand bestätigt (Abschnitt 3).
- **§5, Lesart C, „mit der Farbtafel 2.5 kaum vereinbar“:** Das trifft nur auf die SVG-Tafel zu.
  Die Tafel im Heft und O.1 **stützen** Lesart C.
- **§5, Lesart A („gemeint ist die Bundespolizei“):** Sie verliert ihre Hauptstütze. Der exakte
  Farbwert spricht nicht mehr für die Bundespolizei, sondern ist die Polizeifarbe des Hefts.
  G.3.2 ist dann kein Widerspruch zwischen Titel und Farbe mehr, sondern ein Polizeizeichen in
  der Heft-Farbe.

## 6. Die Vorfrage an den Projektinhaber

### 6.1 Die Frage

> **Das BBK-Heft ordnet die Bundespolizei ausdrücklich der Organisation „Polizei“ (Tafel 2.5)
> zu und führt „BuPol“ nur als Kurzbezeichnung. Eine eigene Farbe für die Bundespolizei gibt es
> weder im Heft noch in der Fassung von 2010. Das Hellgrün `#64dc32`, auf dem die eigene
> Organisation `bundespolizei` im Repo beruht, ist im Heft die Farbe der Polizei. Soll der
> Katalog die Bundespolizei weiter als eigene Organisation führen?**

Hängt an einem „Nein“ die Anschlussfrage:

> **Welches Grün trägt die Polizei: `#14a01e` wie die SVG-Tafel 2.5 oder `#64dc32` wie die
> Heft-Tafel 2.5, Anhang O.1 und die drei Anhangszeichen D.4.4, G.3.2 und N.1.3?**

### 6.2 Antwortmöglichkeiten und ihre Folgen

**(a) Nein, die Bundespolizei geht in `polizei` auf, Polizei bleibt `#14a01e`.**
Die SVG-Tafel 2.5 entscheidet.

- D.4.4 und N.1.3 werden `polizei`. „BuPol“ bleibt als Beschriftung stehen und benennt den
  Träger.
- G.3.2: Die Frage aus §6.2 des G.3.2-Dokuments **entfällt**. G.3.2 bleibt `polizei` wie heute.
- **Folge für die Treue zur Vorlage:** Alle drei Zeichen mit Hellgrün in der Vorlage (D.4.4, G.3.2,
  N.1.3) weichen dann in der Farbe ab. Das wäre als bekannte Abweichung festzuhalten.
- N.1.x: Die Zuordnung von N.1.3 ändert sich. Die übrigen N.1-Zeichen bleiben unberührt.
- D.4.4: Der Rollenvertrag in `function-roles.ts` erwartet dann `polizei`. Die Registerfrage
  `Q-D.4-verwaltungsrollen` („Verwaltungszuordnung hinter … BuPol“) bleibt davon getrennt offen.

**(b) Nein, die Bundespolizei geht in `polizei` auf, Polizei wird `#64dc32`.**
Das Heft entscheidet.

- Wie (a), nur ändert sich die Polizeifarbe katalogweit. `polizei → hellgruen` in
  `organizations.ts`.
- **Folge für die Treue zur Vorlage:** D.4.4, G.3.2 und N.1.3 stimmen dann exakt mit ihren SVGs
  überein. Abweichen würde nur die SVG-Tafel 2.5, die im Repo Beleg der Polizeifarbe ist
  (`elements.ts`, `organizations.test.ts`). Als Beleg käme stattdessen das Heft (S. 17, S. 116)
  hinzu.
- **Hauptkosten: gemischte Farbreihen.** Feuerwehr und THW folgen im Katalog weiter der
  SVG-Reihe (`#fa1919`, `#003296`), die Polizei dagegen der O.1-Reihe. Wer das vermeiden will,
  müsste alle Organisationsfarben auf O.1 umstellen. Das wäre eine eigene, viel größere
  Palettenentscheidung.
- Offen bliebe, ob `#14a01e` dann noch eine Organisationsfarbe ist. Als Signalfarbe für
  Sicherheit (2.13, 2.14, M.3, 5.8.2) bleibt es in der SVG-Reihe in Gebrauch.
- G.3.2: Die Frage entfällt, G.3.2 ist dann auch in der Farbe quellengetreu.

**Aufwand bei (a) und (b), ehrlich benannt:** Beides ist mehr als eine Zeile. Es entfällt ein
öffentlicher Wert von `OrganizationId`. Für Nutzer des Schemas ist das eine **inkompatible
Änderung**: Wer heute `bundespolizei` schreibt, bekommt einen Fehler, solange es keinen
Übergangsweg gibt, etwa einen Alias. Betroffen sind die Stellen aus Abschnitt 4: Schema,
Farbzuordnung, Drucktheme (das Muster `[3, 1]` entfällt oder wandert), Baustein, Anzeigename,
Validierung, Rollenvertrag, Tests und Snapshots. Die Anhang-N-Entscheidungsnotiz und
`organizations.ts` brauchen einen Nachtrag.

**(c) Ja, die Bundespolizei bleibt eine eigene Organisation.** (heutiger Stand)

- Keine Codeänderung.
- Man sollte offen sagen, dass der Katalog dann eine Unterscheidung trifft, die der Text der Quelle
  nicht trifft. Die Begründung in `organizations.ts` und in der Anhang-N-Notiz müsste von „N.1.3
  belegt“ auf eine Projektentscheidung umgestellt werden, etwa: die Bundespolizei getrennt
  zeigen, obwohl das Heft sie unter „Polizei“ führt.
- G.3.2: Die Frage aus §6.2 des G.3.2-Dokuments muss dann beantwortet werden. Abschnitt 5 hier
  verschiebt aber die Gewichte: Lesart A verliert ihre Hauptstütze.

**(d) Nicht entscheidbar, beim Herausgeber (BBK/BABZ) oder einem Fachreviewer nachfragen.**

- Keine Codeänderung. `Q-N-traegerzuordnung`, N.1.3, D.4.4 und G.3.2 bleiben `pending`.
- Die Nachfrage sollte beide Punkte enthalten: Organisation **und** Farbreihe (SVG oder O.1).

In allen Fällen gilt: Reviewstatus ändern sich nur im Fachreview-Werkzeug, nicht durch eine
Bearbeitung von `domain-reviews.ts`.

### 6.3 Beifang zu den anderen Teilen von `Q-N-traegerzuordnung`

Nicht Gegenstand der Vorfrage, aber im Heft direkt ablesbar:

- **Kommunaler Bauhof und Beauftragter Dritter (N.1.2, N.1.5):** Die Erläuterung zu 2.7
  „Sonstige Gefahrenabwehr“ (S. 17) nennt ausdrücklich Gemeinden und vertraglich beauftragte
  Dritte. Die Fassung von 2010 nennt Bauhof und beauftragte Firmen. Das stützt die Zuordnung
  `sonstige-gefahrenabwehr`.
- **Bundeswehr (N.1.1, N.1.4):** 2.6 Braun, „Einheiten der Bundeswehr und anderer militärischer
  Kräfte“. Laut Fußnote gilt das nur bei konkretem einsatztaktischem Bedarf.
- **Feuerwehr (N.1.6):** 2.1 Rot, öffentliche und private Feuerwehren. Keine Auffälligkeit.
- **ZIV (N.2.1, N.2.3, nicht in den Schlüsseln der Frage):** 2.8 nennt Privatfirmen,
  Zivilpersonen und Spontanhelfer. Das deckt die Zuordnung `zivile-einheiten`.

## 7. Einschätzung

> **Einschätzung, keine Feststellung.** Sie ersetzt nicht das Urteil einer Person mit
> einsatztaktischer Fachkunde.

- **Zur Vorfrage selbst:** Die Belege sprechen deutlich für **„keine eigene Organisation“**.
  Der Text des Hefts, die Kurzbezeichnungsliste, die Fassung von 2010 und die Begleithinweise
  sagen übereinstimmend: Die Bundespolizei ist Polizei. Die einzige Stütze der Trennung, der
  exakte Farbwert, erklärt sich im Heft als Polizeifarbe. Antwort (c) ist vertretbar, aber dann
  als bewusste Abweichung von der Quelle, nicht als Quellenbefund.
- **Zur Anschlussfrage, welches Grün:** Sie ist **wirklich offen**, und man sollte sie nicht mit
  der Vorfrage vermischen. Stellen zählen hilft hier nicht: Heft-Tafel 2.5 und O.1 gehören zur
  selben Farbreihe, und die Anhangszeichen im Heft sind dieselben Zeichnungen wie die SVGs. Es
  stehen sich zwei Reihen gegenüber:
  - **Für `#14a01e`:** Die SVG-Reihe ist die Zeichnungsvorlage des Projekts. Nach ihr richten
    sich SVG-Tafel 2.5, Lagekarte B.2 und alle Feuerwehr- und THW-Zeichnungen in Heft und
    SVG-Sammlung. Innerhalb dieser Reihe sind D.4.4, G.3.2 und N.1.3 die einzigen Ausreißer.
    Nach dieser Lesart sind sie versehentlich in der O.1-Farbe gezeichnet.
  - **Für `#64dc32`:** An den Stellen, an denen das Heft die Polizeifarbe erklärt (Tafel 2.5,
    O.1), zeigt es dieses Grün. Alle drei Zeichnungen mit Polizeibezug im Anhang tragen es
    ebenfalls.
  - Der Aufbau spricht eher für `#14a01e`, die erklärenden Stellen eher für `#64dc32`. Welche
    Reihe den Ausschlag gibt, ist eine Projektentscheidung. Soll der Katalog eine einzige
    Farbreihe haben, führt die Antwort zu (a).
- **Für G.3.2:** Bei (a) oder (b) erledigt sich LFH-586 ohne eigene Fachentscheidung. Das spricht
  dafür, die Vorfrage vor jeder G.3.2-Entscheidung zu beantworten, wie am 29.09. beschlossen.

## Anhang: Nachvollziehbarkeit

- **SVG-Farben und -Beschriftungen:** Die Füllfarben wurden aus den Dateien gelesen, die
  Beschriftungen der Tafeln 2.1 bis 2.8 sowie von D.4.4, G.3.2 und N.1.1 bis N.1.6 mit
  `@resvg/resvg-js` gerastert und abgelesen. Nach `#FA321E` und `#003399` wurde in allen 661
  Dateien gesucht, ohne Treffer.
- **Heft-Farben:** Alle 128 Seiten wurden mit `pdftoppm` gerastert und die Pixel je Farbwert
  gezählt. `#64DC32` erscheint auf den PDF-Seiten 2, 19, 20, 68, 82, 97, 116 und 118, `#14A01E` auf
  21, 45 und 71. Die Fundstellen auf 68 und 71 wurden vergrößert angesehen.
- **Heft-Text:** mit `pdftotext`; die Textstellen sind in Abschnitt 2.2 mit Seitenzahl belegt.
- **Fassung 2010:** 56 Seiten, erstellt am 23.10.2010, SHA-256
  `3a971b916bbe393faff5f25a78f7912e8a3b3f41f0ca14e003a3231c210dbc1e`; Tafel 2.5 auf PDF-Seite 10.
- **Historie:** `git log -S bundespolizei` (erster Treffer `31c2cbe`, 26.08.2026) und
  `git log -S 64dc32` (Palette seit `3880cc0`, 04.08.2026); die D.4.4-Umstellung in `cbe92ab`.
