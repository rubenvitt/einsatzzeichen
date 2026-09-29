# Fachfrage G.3.2: Polizei oder Bundespolizei (LFH-586)

Stand: 29.09.2026 · Parent LFH-582 · Grundlage: Entscheidungsnotiz
`docs/decisions/2026-09-19-masse-an-der-referenz-ablesen.md`, §5.3

Status: **Vorbereitung, keine Entscheidung.** Dieses Dokument trägt Belege zusammen und
formuliert die Frage an den Projektinhaber. Es ändert weder Code noch Reviewstatus.

## Kurzfassung

Das Zeichen G.3.2 heißt in der Quelle „Verpflegungszubereitungsstelle betrieben durch
**Polizei**". Seine Fläche ist aber **exakt** in dem hellen Grün gefüllt, das die Quelle sonst
nur für die **Bundespolizei** verwendet (`#64dc32`). Das Repo baut das Zeichen heute als
Polizei, also im dunkleren Grün `#14a01e`. Die beiden Grüntöne sind mit bloßem Auge klar zu
unterscheiden.

Titel und Farbe widersprechen sich. Unter 29 Referenzzeichen mit Füllfläche, deren Dateiname
eine Organisation nennt, ist G.3.2 das einzige, bei dem sich das nicht aus dem Zeichen selbst
erklärt. Kein Zeichen der Quelle verwendet das Polizei-Grün als Organisationsfarbe; das Hellgrün
steht außer bei G.3.2 nur neben der Beschriftung „BuPol". G.3.2 ist zugleich das einzige Rezept im ganzen Katalog, das die
Organisation `polizei` trägt.

Die Frage hängt an einer zweiten, schon offenen Frage (`Q-N-traegerzuordnung`): Ist die
Bundespolizei überhaupt eine eigene Organisation im Katalog? Nur wenn ja, muss für G.3.2
zwischen Polizei und Bundespolizei entschieden werden.

## 1. Die Referenz

Datei (wörtlich): `G.3.2_Verpflegungszubereitungsstelle_betrieben durch Polizei.svg`
(1428 Byte, Adobe-Illustrator-Export)

Die Datei hat drei Ebenen:

| Ebene | Inhalt | Farbe |
|---|---|---|
| `Grundfläche` | leeres Rechteck 90,709 × 90,709 Einheiten (= 32 × 32 mm) | `fill="none"` |
| `Flächige_Fülung` | ein Kreis, Mittelpunkt 45,354/45,354, Radius 34,016 (= 12 mm) | **`fill="#64dc32"`** |
| `Takt_Zeichen (umgewandelt)` | ein Umrisspfad: Kreisrand, schwarzes Fußband, Löffel und „angebissener" Kreis (Verpflegung zubereiten) | ohne Angabe, also schwarz |

Es gibt genau **eine** Füllfarbe, `#64dc32`, und sie steht wörtlich so in der Datei. Die Datei
hat **keine Schriftebene**: kein „Pol", kein „BuPol", keine andere Organisationskennung.

Titel im Repo: `Verpflegungszubereitungsstelle Polizei`
(`packages/conformance/src/recipes-anhang-g.ts`, Eintrag `G.3.2`). Der Repo-Titel lässt das
„betrieben durch" des Dateinamens weg; bei G.3.1 („Verpflegungsstelle betrieben durch
Feuerwehr") ist es erhalten geblieben.

## 2. Farbabgleich

Die Farbpalette des Repos steht in `packages/schema/src/geometry.ts` (`PALETTE`), die Zuordnung
Organisation → Farbe in `packages/core/src/geometry/organizations.ts`.

| Farbe im Repo | Wert | Organisation | Abstand zu `#64dc32` |
|---|---|---|---|
| `hellgruen` | `#64dc32` | `bundespolizei` | **0 — identisch** |
| `gruen` | `#14a01e` | `polizei` | deutlich verschieden (ΔE 17,2) |
| `gelb` | `#fafa00` | `fuehrung-leitung` | deutlich verschieden (ΔE 22,3) |
| alle übrigen | — | — | ΔE 30 und mehr |

**Zur Einordnung:** ΔE (hier nach CIEDE2000) misst, wie verschieden zwei Farben für das
menschliche Auge wirken. Ab etwa 2 bis 3 sieht man überhaupt einen Unterschied. Ein Wert von 17
heißt: Niemand würde die beiden Grüntöne verwechseln. Rechnerisch ist die Referenz in jedem
Farbkanal heller als das Polizei-Grün (Rot +80, Grün +60, Blau +20).

**Befund:** Die Füllung entspricht **exakt** der Bundespolizei-Farbe und nur **ungefähr** der
Polizei-Farbe. Ein Rundungs- oder Exportfehler ist ausgeschlossen: Der Wert ist kein zufälliges
Grün, sondern genau einer der zwölf Palettenwerte.

Nebenbefund Kontrast: Schwarz auf beiden Grüntönen ist gut lesbar (11,8 : 1 auf Hellgrün,
6,1 : 1 auf Grün). Keine der beiden Antworten verletzt eine Kontrastregel.

## 3. Geschwister und Gegenproben

### 3.1 Die Kreiszeichen G.3.1 bis G.3.5

| Zeichen | Titel (Dateiname) | Füllung | Organisation im Titel | Beschriftung | Farbe = Titel? |
|---|---|---|---|---|---|
| G.3.1 | Verpflegungsstelle betrieben durch Feuerwehr | `#fa1919` rot | Feuerwehr | keine | ja |
| **G.3.2** | Verpflegungszubereitungsstelle betrieben durch Polizei | **`#64dc32` hellgrün** | Polizei | keine | **nein** |
| G.3.3 | Versorgungsstelle Hilfsorganisation | `#fff` weiß | Hilfsorganisation | keine | ja |
| G.3.4 | Zentrale Stelle Notversorgung | `#fafa00` gelb | keine (gelb = Führung/Leitung) | keine | — |
| G.3.5 | Mobiler Tankpunkt Diesel betrieben durch Bundeswehr | `#b4783c` braun | Bundeswehr | „Diesel", „Bw" | ja |

Die zwei anderen „betrieben durch"-Zeichen tragen genau die Farbe der genannten Organisation.
G.3.2 ist in seiner eigenen Reihe die Ausnahme.

### 3.2 Übriges Anhang G

| Zeichen | Füllung | Organisation im Titel | Farbe = Titel? |
|---|---|---|---|
| G.1.1, G.1.3 (Versorgungstrupp Feuerwehr …) | rot | Feuerwehr | ja |
| G.1.2 (Versorgungstrupp DLRG) | weiß | DLRG | ja (weiß = Hilfsorganisation) |
| G.1, G.1.4, G.2, G.2.1–G.2.3, G.3, G.4–G.8 | weiß | keine | — |
| G.1.5 (Instandhaltungsgruppe) | keine Fläche | keine | — |

Keines dieser Zeichen ist grün oder hellgrün.

### 3.3 Alle Referenzen mit Polizei- oder Bundespolizei-Bezug

Gesucht wurde auf zwei Wegen: im Dateinamen nach „Polizei" und im Inhalt aller 661 Dateien nach
den beiden Grüntönen.

| Zeichen | Titel | Füllung | Organisation im Titel | Beschriftung | Farbe = Titel? |
|---|---|---|---|---|---|
| 2.5 | Polizei (Farbtafel Kapitel 2) | `#14a01e` grün | Polizei | „Pol" | ja |
| D.4.4 | Leiter Gefahrenabwehrkräfte Bundespolizei | `#64dc32` hellgrün | Bundespolizei | „BuPol" | ja |
| N.1.3 | Einsatzfahrzeug Bundespolizei | `#64dc32` hellgrün | Bundespolizei | „BuPol" | ja |
| **G.3.2** | Verpflegungszubereitungsstelle betrieben durch Polizei | **`#64dc32` hellgrün** | **Polizei** | keine | **nein** |

`#14a01e` kommt außerdem vor in 2.13 (Farbtafel „Grün"), 2.14 (Fluchtweg, zwei Dateien), M.3
(Sicherheitszone) und 5.8.2.1 bis 5.8.2.3 (Aktivitätsstufen). Dort ist Grün eine Signal- oder
Zustandsfarbe, keine Organisationsfarbe. Diese Zeichen sagen nichts über die Polizei aus.

Damit lassen sich die beiden Gegenfragen beantworten:

- **Gibt es ein Zeichen, dessen Titel „Polizei" nennt und das in Polizei-Grün gefüllt ist?**
  Nein. Außer der Farbtafel 2.5 zeigt kein Zeichen die Polizei in `#14a01e`.
- **Gibt es ein Zeichen in Polizei-Grün, dessen Titel die Bundespolizei nennt?** Nein.

Ohne G.3.2 selbst mitzuzählen, ergibt sich ein klares Muster: Hellgrün steht in der Quelle nur
neben „BuPol" (D.4.4, N.1.3), nie neben „Pol". „Pol" steht nur auf der Farbtafel 2.5, und zwar in
`#14a01e`. G.3.2 passt in dieses Muster nicht: Farbe wie „BuPol", Titel wie „Pol", keine
Beschriftung.

### 3.4 Titel gegen Farbe über den ganzen Bestand

33 Referenzdateien nennen im Dateinamen eine Organisation (Feuerwehr, THW, Bundeswehr, DLRG,
Hilfsorganisation, Polizei, Bundespolizei, kommunaler Bauhof, Beauftragter Dritter). Vier davon
sind Farbtafeln aus Kapitel 2 ohne Zeichenfläche. Bei 27 der übrigen 29 stimmt die Füllung mit der
Organisation im Titel überein. Zwei weichen ab:

- **G.3.2** — Titel Polizei, Füllung Bundespolizei-Hellgrün.
- **E.2.6** „Gabelstapler öffentliche Gefahrenabwehr, THW betrieben, geländegängig" — Füllung
  orange (öffentliche bzw. sonstige Gefahrenabwehr), dazu die Beschriftung „THW". Hier trennt die
  Quelle erkennbar zwei Aussagen: Die Farbe nennt, wem das Gerät zugeordnet ist, die Schrift, wer
  es betreibt. Titel und Zeichen passen damit zusammen.

E.2.6 ist deshalb **kein** Vorbild für G.3.2. Bei G.3.2 gibt es keine Beschriftung, die den
Betreiber gesondert nennt. Allerdings trägt auch G.3.1 keine Beschriftung; eine fehlende
Beschriftung ist in dieser Reihe also nicht ungewöhnlich und für sich allein kein Beleg.

### 3.5 Grenzen der Belege

- Für Hellgrün gibt es **keine Farbtafel in Kapitel 2**. Kapitel 2 kennt Organisationstafeln
  2.1 bis 2.8 und Farbtafeln 2.9 bis 2.13, aber keine für die Bundespolizei. Unabhängige Belege
  für „Hellgrün = Bundespolizei" sind nur D.4.4 und N.1.3, beide mit „BuPol". G.3.2 kann dafür
  nicht als Beleg zählen, weil gerade seine Bedeutung offen ist. Die Zuordnung ist gut begründet,
  aber nicht von der Quelle als Regel ausgesprochen.
- Nach dem Scoping-Dokument zur Altsystematik
  (`docs/superpowers/specs/2026-08-28-lfh-433-legacy-migration-scoping.md`) fasste die Fassung von
  2010/2011 „Polizei, Bundespolizei, Zoll" unter **einer** grünen Farbe zusammen. Das ist hier aus
  zweiter Hand übernommen; die Altquelle selbst wurde für dieses Dokument nicht eingesehen.

## 4. Wie das Repo G.3.2 heute baut

```ts
'G.3.2': {
  title: 'Verpflegungszubereitungsstelle Polizei',
  referenceAsset: 'G.3.2_Verpflegungszubereitungsstelle_betrieben durch Polizei.svg',
  spec: { kind: 'circle-12', bodyVariant: 'foot-band', organization: 'polizei',
          bodyMarks: ['meal-preparation'] },
},
```

- `polizei` → Farbe `gruen` → `#14a01e`. Der Snapshot
  `packages/conformance/src/__snapshots__/G.3.2.svg` füllt den Kreis mit `#14a01e` und beschreibt
  das Zeichen als „Organisation: Polizei".
- Im Drucktheme (`packages/core/src/geometry/render-themes.ts`) wird die Organisation zusätzlich
  durch ein Strichmuster der Kontur erkennbar: Polizei `[6, 2]`, Bundespolizei `[3, 1]`.
- G.3.2 ist das **einzige** Rezept im Katalog mit `organization: 'polizei'`. Die Farbe `polizei`
  selbst bleibt durch die Farbtafel 2.5 belegt, egal wie G.3.2 entschieden wird.

**Warum `polizei`?** Anhang G (LFH-421, PR #15) und Anhang N (LFH-422, PR #16) entstanden am
26.08.2026 in parallelen Branches. Als die G-Rezepte geschrieben wurden (Commit `6bf6f5d`), gab es
die Organisation `bundespolizei` im Repo noch nicht: `packages/catalog/src/organizations.ts` und
`packages/schema/src/taxonomy.ts` kannten dort nur `polizei`. Die Bundespolizei kam mit Anhang N
hinzu (PR #15 gemergt um 14:52, PR #16 um 15:57). Zur Wahl standen für G.3.2 damals also nur
Polizei-Grün oder eine katalogweite Farbänderung. Die Entscheidungsnotiz
`docs/decisions/2026-08-26-anhang-g.md` hat den Unterschied deshalb als „sichtbare
Restabweichung" festgehalten.

**Was am 19.09.2026 geschah:** Im selben Überarbeitungs-Commit (`cbe92ab`, PR #56) wurde D.4.4
von `polizei` auf `bundespolizei` umgestellt, weil Titel und Farbe dort beide Bundespolizei sagen.
G.3.2 blieb nach §5.3 bei `polizei`, weil Titel und Farbe sich widersprechen. Die Regel dahinter:
Die Farbe allein ändert die fachliche Aussage nicht. §5.3 ist eine Entscheidung des Koordinators,
die der Projektinhaber delegiert hatte. Sie hält den Stand fest und lässt die Fachfrage
ausdrücklich offen. Eine Abwägung durch jemanden mit einsatztaktischer Fachkunde gibt es bisher
nicht.

Reviewstand heute: `bbk-babz-2025:G.3.2#primary` ist `pending`
(`packages/conformance/src/domain-reviews.ts`).

## 5. Deutung

> Dieser Abschnitt ist **Deutung**, keine Feststellung. Er ordnet die Belege aus 1 bis 4; er
> ersetzt nicht das Urteil einer Person mit einsatztaktischer Fachkunde.

**Lesart A — Gemeint ist die Bundespolizei; „Polizei" im Titel ist verkürzt.**
Dafür: Die Farbe ist exakt der Palettenwert, den die Quelle an den beiden anderen Stellen mit
„BuPol" verwendet. Kein Zeichen verwendet `#14a01e` als Organisationsfarbe. Die Fassung 2025
trennt die beiden Farben bewusst.
Dagegen: Der Titel sagt ausdrücklich „Polizei", nicht „Bundespolizei". Die anderen beiden
Bundespolizei-Zeichen machen den Unterschied mit „BuPol" sichtbar, G.3.2 nicht.

**Lesart B — Gemeint ist die Polizei; die Farbe ist ein Fehler in der Quelle.**
Dafür: Der Titel ist eindeutig. In der eigenen Reihe (G.3.1, G.3.5) folgt die Farbe sonst dem
im Titel genannten Betreiber. Die Farbtafel 2.5 legt die Polizei auf `#14a01e` fest.
Dagegen: Ein Farbfehler müsste ausgerechnet den einen Palettenwert getroffen haben, der
fachlich benachbart ist. In den übrigen 28 Zeichen mit Organisation im Titel kommt ein solcher
Fehler nicht vor (E.2.6 weicht ab, ist aber durch seine Beschriftung erklärt, siehe 3.4).

**Lesart C — Hellgrün ist in den Zeichen die Farbe aller Polizeien; Grün bleibt der Farbtafel.**
Dafür: In keinem Zeichen des Anhangs wird mit `#14a01e` eine Organisation gefüllt. Die
Altfassung fasste Polizei und Bundespolizei unter einer Farbe zusammen (siehe 3.5, zweite Hand).
Dagegen: Die Farbtafel 2.5 zeigt „Pol" ausdrücklich in `#14a01e`. Folgte man Lesart C, fiele die
im Repo getroffene Trennung von Polizei und Bundespolizei in sich zusammen. Das widerspräche
`organizations.ts` und `Q-N-traegerzuordnung`.

**Lesart D — Die Quelle trennt die beiden Grüntöne nicht zuverlässig; die Frage ist aus der
Quelle allein nicht zu entscheiden.**
Das ist die Haltung von §5.3: Solange niemand mit Fachkunde oder der Herausgeber es klärt,
bleibt der Titel maßgeblich und die Farbabweichung dokumentiert.

Einschätzung aus den Belegen: Der exakte Farbwert und das Muster an D.4.4 und N.1.3 sprechen
eher für A, der Wortlaut des Titels für B.
Lesart C ist mit der Farbtafel 2.5 kaum vereinbar. Ob eine Verpflegungszubereitungsstelle
typischerweise von einer Landespolizei oder von der Bundespolizei betrieben wird, lässt sich
aus der Quelle nicht ablesen. Genau das ist die fachliche Frage.

## 6. Frage an den Projektinhaber

### 6.1 Vorfrage

`Q-N-traegerzuordnung` fragt unter anderem, ob die Bundespolizei zu Recht eine getrennte
Organisation ist. Die Antwort dort entscheidet, ob G.3.2 überhaupt eine Wahl hat:

- **Nein, keine eigene Organisation:** Polizei und Bundespolizei fallen zusammen, die Frage zu
  G.3.2 entfällt. Offen bliebe nur, welches Grün die gemeinsame Organisation trägt.
- **Ja, eigene Organisation:** Die Frage unten muss beantwortet werden.

### 6.2 Die Frage

> **Die Referenz G.3.2 heißt „Verpflegungszubereitungsstelle betrieben durch Polizei", ist aber
> im Hellgrün der Bundespolizei (`#64dc32`) gefüllt und trägt keine Beschriftung. Soll der
> Katalog G.3.2 als Zeichen der Polizei (Grün `#14a01e`) oder der Bundespolizei (Hellgrün
> `#64dc32`) führen?**

### 6.3 Antwortmöglichkeiten und ihre Folgen

**(1) Polizei — der Titel entscheidet.** (bestätigt §5.3, heutiger Stand)

- Code: keine Änderung am Rezept. Höchstens den Begründungstext in
  `packages/conformance/src/coverage-manifest.ts` (Anhang-G-Notiz „… Polizei-Grünpalette von
  G.3.2 ist dokumentiert") auf die Entscheidung verweisen lassen.
- Dokumentation: §5.3 der Entscheidungsnotiz vom 19.09. von „offen" auf „entschieden" setzen. Die
  Farbabweichung bleibt ein benannter Unterschied zur Quelle.
- Aufwand: sehr gering.

**(2) Bundespolizei — die Farbe entscheidet.**

- `packages/conformance/src/recipes-anhang-g.ts`, `G.3.2`: `organization: 'polizei'` →
  `'bundespolizei'`, mit einem Kommentar wie bei D.4.4.
- **Teilentscheidung Titel:** Der Repo-Titel `Verpflegungszubereitungsstelle Polizei` würde dann
  neben „Organisation: Bundespolizei" in der Zeichenbeschreibung stehen. Möglich sind: Titel
  lassen (Quelle wörtlich), an den Dateinamen angleichen („… betrieben durch Polizei") oder
  „Bundespolizei" schreiben (weicht von der Quelle ab).
- `packages/conformance/src/recipes.test.ts`: erwartete Organisation im Eintrag `G.3.2`.
- Snapshots `packages/conformance/src/__snapshots__/G.3.2.svg` und
  `__snapshots__/multi-size/recipe.G.3.2.svg`: Füllung `#14a01e` → `#64dc32`, Beschreibung
  „Organisation: Bundespolizei".
- Drucktheme: Konturmuster `[6, 2]` → `[3, 1]`.
- `packages/conformance/src/coverage-manifest.ts` und der Prüfsatz „G.3.2 ist dokumentiert" in
  `coverage-manifest.test.ts`: Text anpassen, weil die Abweichung dann entfällt.
- Folge für den Katalog: Kein Rezept trägt mehr `polizei`. Die Organisation bleibt über die
  Farbtafel 2.5 belegt und im Baukasten wählbar.
- Kontrast: unkritisch (siehe Abschnitt 2).
- Dokumentation: §5.3 der Entscheidungsnotiz vom 19.09. wird damit aufgehoben; das gehört in
  eine Nachtragsnotiz.

**(3) Hellgrün für jede Polizei (Lesart C).**

- `packages/core/src/geometry/organizations.ts`: `polizei` → `hellgruen`, damit fallen Polizei
  und Bundespolizei farblich zusammen. Betroffen sind Organisationsprofile, Drucktheme, Tests
  und die Begründung „darf nicht mit der grünen Polizei kollabieren".
- Widerspricht der Farbtafel 2.5. Nur sinnvoll, wenn die Vorfrage mit „nein" beantwortet wird.
- Dokumentation: hebt §5.3 und die Anhang-N-Entscheidung zur eigenständigen Bundespolizei auf.

**(4) Nicht entscheidbar — beim Herausgeber oder einem Fachreviewer nachfragen.**

- Code: keine Änderung. G.3.2 bleibt `pending`, die Frage wandert ins Register (siehe 6.4).
- Dokumentation: §5.3 bleibt vorläufig in Kraft; dort auf die Registerfrage verweisen.

In allen Fällen gilt: Der Reviewstatus von G.3.2 ändert sich nur im Fachreview-Werkzeug, nicht
durch eine Bearbeitung von `domain-reviews.ts`.

### 6.4 Eigene Registerfrage?

`Q-G-weiss-und-marken` hängt an allen 21 G-Zeichen und fragt allgemein, wer die farbigen
Kreiszeichen betreibt. Den Widerspruch zwischen Titel und Farbe bei **einem** Zeichen nennt sie
nicht, und die Abhängigkeit von `Q-N-traegerzuordnung` auch nicht. Wer das Fachreview-Dossier
liest, erfährt bei G.3.2 also nichts von dem eigentlichen Problem.

Vorschlag (nicht angelegt): eine eigene Frage in
`packages/conformance/src/domain-review-questions.ts`. Das Register erlaubt mehrere Fragen je
Schlüssel, und das Dossier (`packages/cli/src/commands/review-dossier.ts`) zeigt sie alle an. Es
gibt dafür schon viele Vorbilder, etwa `Q-D.3.7-zugfuehrer` neben der allgemeinen
`Q-D.3-rollenbezeichnungen` oder `Q-E.2.22-ohne-kuerzel`.

```ts
{
  id: 'Q-G.3.2-polizei-oder-bundespolizei',
  keys: keysOf(['G.3.2']),
  question:
    'Die Referenz heißt „… betrieben durch Polizei", ist aber im Hellgrün der Bundespolizei ' +
    '(#64dc32) gefüllt und unbeschriftet. Führt der Katalog G.3.2 als Polizei oder als ' +
    'Bundespolizei?',
  context:
    'Setzt voraus, dass Q-N-traegerzuordnung die Bundespolizei als eigene Organisation ' +
    'bestätigt. Belege: docs/reviews/2026-09-29-lfh-586-g-3-2-polizei-oder-bundespolizei.md.',
},
```

## Anhang: Nachvollziehbarkeit

- **Füllfarben:** Alle 661 Referenzdateien wurden als XML gelesen. Für jedes Element wurde die
  Füllfarbe aus `fill`, `style` oder einer Klassendefinition bestimmt und nach der Illustrator-Ebene
  (`Flächige_Fülung`, `Takt_Zeichen …`) gruppiert. Im ganzen Bestand kommen genau elf
  ausdrücklich gesetzte Füllfarben vor; `#64dc32` in drei Dateien, `#14a01e` in acht.
- **Titel gegen Farbe:** Die Dateinamen wurden nach Organisationsbegriffen durchsucht und die
  Füllung der Ebene `Flächige_Fülung` mit der Palettenfarbe der genannten Organisation
  verglichen.
- **Beschriftungen:** Die Zeichen 2.5, D.4.4, N.1.3, G.3.1 bis G.3.5 und E.2.6 wurden mit
  `@resvg/resvg-js` gerastert und angesehen. Die Beschriftungen liegen in der Quelle nur als
  Umrisse vor und sind so erst lesbar.
- **Farbabstand:** CIEDE2000, sRGB mit D65-Weißpunkt; Kontrast nach WCAG 2.
- **Historie:** Zum Stand `6bf6f5d` enthalten `packages/catalog/src/organizations.ts` und
  `packages/schema/src/taxonomy.ts` je einmal `polizei` und kein `bundespolizei`; der
  Anhang-N-Commit `31c2cbe` ist kein Vorgänger von `6bf6f5d`.
