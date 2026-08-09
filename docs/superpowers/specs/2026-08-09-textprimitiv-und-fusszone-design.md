# Textprimitiv und Fußzone

> Design-Spec · 9. August 2026

## 1. Zweck

Das Schema kennt sechs Primitivarten und keine davon trägt Text. Zwei Anforderungen laufen darauf
auf:

- **Anhang J ist zu rund einem Drittel typografisch.** 16 der 53 D.3-Darstellungen unterscheiden
  sich in der Baseline allein über ein Buchstabenkürzel; entfernt man die Glyphenpfade, sind
  `J.3.6`, `J.3.7` und `J.3.8` geometrisch identisch. Belegt in
  `docs/decisions/2026-08-09-anhang-j-ist-typografisch.md`.
- **Die Fußzone ist seit dem 5. August offen.** `designation` steht in `taxonomy.ts:219`, wird in
  `validate.ts:42` auf „nicht leer" geprüft und von `labels.ts:85` in die Barrierefreiheitstexte
  aufgenommen — aber von **keinem** Renderer ausgegeben. `role: 'foot'` ist in `geometry.ts:69`
  deklariert und ungenutzt.

Dieser Slice ist eine **Schemaform**, kein Katalogausbau. Er folgt damit der Reihenfolge vom
5. August: Formen, die die Struktur jedes künftigen Eintrags anfassen, kommen vor dem Inhalt.

Er liefert **keine** neuen Katalogzeichen. D.3 nimmt seine Arbeit danach wieder auf.

## 2. Zwei Konsumenten, ein Primitiv

Das Textprimitiv bedient zwei verschiedene Dinge, die sauber getrennt bleiben müssen:

| | Feste Kennung | Fußzone |
|---|---|---|
| Beispiel | `HRT` in `J.3.6` | `designation` eines `SymbolSpec` |
| Herkunft | Teil der Zeichenidentität, aus der Baseline | vom Aufrufer zur Kompositionszeit gesetzt |
| Ort | in der Piktogrammdefinition | unter dem Körper, `role: 'foot'` |
| Validierung | Inventar- und Piktogrammgates | `designation-not-blank` in `validate.ts` |
| Änderbar | nein | ja, je Aufruf |

Sie teilen das Primitiv und den Renderer. Sie teilen **nicht** ihre Gates und **nicht** ihre
Validierung. Eine feste Kennung, die zur Laufzeit ersetzbar wäre, wäre ein Fehler; eine Fußzone,
die im Inventar gepinnt wäre, ebenso.

## 3. Die Schrift

### 3.1 Warum eine Datei ins Repo kommt

Ein Spike am 9. August hat die Ausgangslage vermessen. `@resvg/resvg-js` rasterisiert dieselbe
`<text>`-Ausgabe wie folgt:

| Konfiguration | 16 px | 256 px | Lauf-zu-Lauf |
|---|---|---|---|
| `loadSystemFonts: false` | 0 dunkle Pixel | 0 dunkle Pixel | stabil |
| `loadSystemFonts: true` | 13 dunkle Pixel | 3097 dunkle Pixel | stabil |

Ohne Fonts rendert Text **überhaupt nicht** — und genau so ist das Mehrgrößengate konfiguriert
(`multi-size-snapshots.test.ts:30`), ausweislich seines eigenen Kommentars, um die Rasterung
deterministisch zu halten. Mit Systemfonts rendert es, aber das Ergebnis hängt an den Schriften der
Maschine; ein Snapshot aus macOS und einer aus einer Linux-CI wären verschieden.

`resvg-js` bietet `fontFiles: string[]`. Eine mitgelieferte Schriftdatei plus
`loadSystemFonts: false` ist damit der einzige Weg, der Text rendert **und** die vorhandene
Snapshot-Evidenz nicht entwertet.

### 3.2 Welche Schrift und auf welcher Lizenzgrundlage

**Arimo**, SIL Open Font License 1.1, bezogen aus dem Google-Fonts-Repository
(`ofl/arimo/Arimo[wght].ttf`, 484 KB, variabler Schnitt).

Drei Gründe:

1. **Lizenz erlaubt die Auslieferung ausdrücklich.** Die OFL gestattet Weitergabe und Bündelung,
   auch eingebettet, solange die Lizenzdatei mitgeliefert wird und die Schrift nicht allein
   verkauft wird. Beides ist hier erfüllbar.
2. **Metrisch Arial-kompatibel.** Die Baseline-Referenzen setzen ihre Kürzel in einer
   Helvetica/Arial-artigen Grotesk. Arimo ist metrisch Arial-kompatibel und kommt der Referenz
   damit näher als jede andere freie Wahl.
3. **Stabile, belegbare Herkunft.** Google Fonts liefert die Datei unter einer festen Raw-URL samt
   `OFL.txt`. Liberation Sans — die naheliegende Alternative und Arimos Vorläufer — hat **keine**
   stabile TTF-Bezugsquelle: sein GitHub-Release trägt keine Assets, geprüft am 9. August 2026.
   Das ist der Grund für Arimo statt Liberation Sans.

Verifiziert am 9. August 2026: Arimo rasterisiert mit `fontFiles` und `loadSystemFonts: false`
über alle sechs Snapshotgrößen (16 … 256 px) und ist dabei lauf-zu-lauf byteidentisch.

In einem Projekt, das `taktische-zeichen/` genau wegen ungeklärter Nutzungsgrundlage aussperrt,
wäre eine stillschweigend eingecheckte Schriftdatei inkonsequent. Die Datei kommt deshalb mit:

- dem vollständigen OFL-Lizenztext,
- der Bezugsquelle und der SHA-256-Prüfsumme der Datei,
- einem Eintrag im Quellenregister (`sources.ts`), analog zu jeder anderen Fremdquelle.

Die Schrift ist damit ein **registrierter Quellenträger**, kein stiller Anhang.

### 3.3 Was nicht in diesem Slice liegt

- **Font-Subsetting.** Die Datei liegt bei 484 KB. Eine Reduktion auf die tatsächlich benutzten
  Glyphen wäre erheblich kleiner, braucht aber ein Werkzeug in der Build-Kette. Benannter
  Nachfolger.
- **Andere Schnitte als der Standardschnitt.** `Arimo[wght].ttf` ist eine variable Schrift; der
  Renderer setzt keinen `font-weight` und nutzt damit ihre Standardinstanz. Fett oder kursiv sind
  kein Bedarf dieses Slice, und ein nicht gesetztes Gewicht ist eine Achse weniger, die einen
  Snapshot verschieben kann.

## 4. Die Entwurfsentscheidung: die Box kehrt ihre Rolle um

Bei den sechs vorhandenen Primitivarten ist `box` eine **Messung**: `boundsOfMm` berechnet die
Hülle, und `checkBox` prüft die Zusicherung dagegen — bei pfadfreien Definitionen sogar auf
Gleichheit.

Text lässt sich so nicht behandeln. Seine Ausdehnung hängt an Fontmetrik, Schriftgrad und
Laufweite; `boundsOfMm` kann sie nicht berechnen und gibt für nicht messbare Primitive
`EMPTY_BOUNDS` zurück (`bounds.ts:149-151`).

**Für ein Textprimitiv ist die Box deshalb keine Messung, sondern eine Vorgabe:** ein deklariertes
Rechteck, in das der Text zu passen hat. Der Renderer richtet den Text daran aus; das Gate prüft
nicht mehr „stimmt die Hülle mit der Box überein", sondern „ist eine Box deklariert und ist sie
gültig".

Diese Umkehr ist die eine Entscheidung, an der alles Weitere hängt. Sie hält alle vier Gates
kohärent:

| Gate | Regel für Text |
|---|---|
| `checkBox` | Die Gleichheitsprüfung ist durch `!hasPath` bewacht (`pictogram-gate.ts` ~250). Sie wird auf `!hasPath && !hasText` erweitert. Für Text gilt Enthaltung in der deklarierten Box, keine Gleichheit. |
| `checkClipping` | Text hat keine messbare Fläche. Geprüft wird die **deklarierte Box** gegen den Körper, nicht die Glyphen. |
| `viewbox-gate` | Textbounds sind die deklarierte Box. Keine Strichbreite — Text wird gefüllt, nicht gestrichen. |
| Kommando-Gate | Betrifft nur Pfade. Text bleibt unberührt. |

Der Preis ist benannt: Eine falsch deklarierte Box wird nicht mehr vom Gate gefangen, sondern erst
in der visuellen Prüfung. Das ist der Grund für das Mindestgrößengate in Abschnitt 6 und für die
Rasterprüfung in Abschnitt 7 — sie ersetzen die Messung, die hier verloren geht.

## 5. Die Form des Primitivs

```ts
| (PrimitiveBase & {
    type: 'text';
    /** Der auszugebende Text. Fest bei Kennungen, vom Aufrufer gesetzt bei der Fußzone. */
    content: string;
    /** Ankerpunkt in Millimetern. Zusammen mit `anchor` und `baseline` legt er die Lage fest. */
    x: Length;
    y: Length;
    /** Schriftgrad in Millimetern — dieselbe Einheit wie alle übrigen Maße. */
    sizeMm: Length;
    anchor: 'start' | 'middle' | 'end';
    baseline: 'alphabetic' | 'middle' | 'hanging';
    /** Deklarierte Fläche, in die der Text passen muss. Vorgabe, keine Messung. */
    boxMm: { xMm: Length; yMm: Length; widthMm: Length; heightMm: Length };
  })
```

Bewusst **nicht** enthalten: `fontFamily` (es gibt genau eine Schrift, sie gehört in die
Renderpolitik, nicht in jedes Primitiv), `fontWeight`, `letterSpacing`, Mehrzeiligkeit, Text auf
Pfad. Alles vier sind benannte Nachfolger.

`sizeMm` in Millimetern statt in Punkt oder Pixeln: jede andere Länge im Schema ist in Millimetern,
und eine zweite Einheit im selben Typ wäre eine Fehlerquelle ohne Gegenwert.

## 6. Mindestgröße als eigene Befundklasse

Der Spike zeigt: „HRT" bei 16 px sind 13 dunkle Pixel. Das ist keine schlechte Rasterung, das ist
unlesbar.

Die Mehrgrößen-Regression fährt 16, 24, 32, 64, 128 und 256 px. Textzeichen aus den kleinen Größen
auszunehmen wäre die kleinere Änderung, würde die Abdeckung aber ungleichmäßig machen — und
ungleichmäßige Abdeckung ist in diesem Repository bisher immer ein Befund gewesen.

Stattdessen bekommt jedes Textprimitiv eine **abgeleitete Mindest-Rendergröße**, und ihre
Unterschreitung ist ein **benannter Gate-Befund** einer neuen Klasse — nicht ein stiller
Fehlschlag und nicht ein übersprungener Testfall.

Die Regel: Ein Textprimitiv mit Schriftgrad `sizeMm` auf einer 32-mm-Fläche wird bei Rendergröße
`s` px mit `sizeMm / 32 * s` px gesetzt. Unterhalb einer festzulegenden Schwelle in Pixeln meldet
das Gate den Befund `text-below-minimum-size` mit Zeichen, Größe und errechnetem Pixelwert.

Die Messreihe vom 9. August für „HRT" bei Schriftgrad 10 mm zeigt den Verlauf:

| Rendergröße | effektiver Schriftgrad | dunkle Pixel |
|---|---|---|
| 16 px | 5,0 px | 13 |
| 24 px | 7,5 px | 33 |
| 32 px | 10,0 px | 47 |
| 64 px | 20,0 px | 201 |

Die Schwelle wird im Plan aus einer visuellen Rasterprüfung dieser Reihe bestimmt und dann als
benannte Konstante festgeschrieben, nicht geraten. Sie ist eine Aussage über Lesbarkeit und gehört dokumentiert wie
`MINIMUM_NON_TEXT_CONTRAST`.

Ein Zeichen, das die Mindestgröße bei 16 px unterschreitet, ist damit **nicht kaputt** — es ist
ein Zeichen mit dokumentierter unterer Einsatzgrenze. Das ist eine fachlich relevante Aussage über
ein taktisches Zeichen und keine technische Ausrede.

## 7. Kontrast

`MINIMUM_NON_TEXT_CONTRAST = 3` in `contrast-contract.ts:5` trägt die Unterscheidung schon im
Namen, die der Code noch nicht macht. Dieser Slice macht sie:

- **Nichttext** bleibt bei 3:1.
- **Text** bekommt `MINIMUM_TEXT_CONTRAST = 4.5`, die WCAG-Schwelle für Fließtext.

Der Kontrastvertrag einer Definition mit Text deklariert die Farbnachbarschaft des Textes
gesondert, damit das Gate die richtige Schwelle anlegen kann.

**Nebenbefund aus D.3, hier mitkorrigiert:** Das Paar `weiss`/`surface` ist unerfüllbar — beide
Token sind `#ffffff`, das Verhältnis ist exakt 1:1. Für Körper mit weißer Fläche lautet der
richtige Vertrag `schwarz`/`surface` (Kontur auf Oberfläche) und `schwarz`/`weiss` (Marke auf
Körper). Der Kontrastvertrag bekommt eine Prüfung, die ein Paar mit identischen Token als Befund
meldet, statt es rechnen zu lassen.

## 8. Determinismus

Die Snapshot-Evidenz ist das Rückgrat dieses Repositorys. Text darf sie nicht aufweichen.

- Die Rasterung läuft mit `fontFiles: [<Repo-Pfad>]` **und** `loadSystemFonts: false`. Keine
  Systemschrift kann einwirken.
- Ein Test belegt, dass dieselbe Zeichnung zweimal gerastert byteidentisch ist.
- Ein Test belegt, dass die Schriftdatei die erwartete SHA-256-Prüfsumme hat. Eine ausgetauschte
  Schrift ist damit ein Testfehler, kein stiller Snapshot-Drift.
- Das Fingerprintverfahren nimmt `content`, `sizeMm`, `anchor`, `baseline` und die Box auf, nicht
  die gerasterten Glyphen.

## 9. Die Fußzone

`designation` bekommt einen Renderer. Der Weg:

1. `compose()` erzeugt für ein `SymbolSpec` mit `designation` ein Textprimitiv mit `role: 'foot'`
   unterhalb des Körpers.
2. Die Lage folgt dem vorhandenen Layoutprofil des Körpers, nicht einer neuen Sonderregel.
3. `validate.ts:42` bleibt unverändert zuständig für „nicht leer".
4. Die Barrierefreiheitstexte aus `labels.ts:85` bleiben, wie sie sind — sie waren nie das Problem.

Eine Fußzone, die den Körper überragt oder aus der ViewBox läuft, ist ein Gate-Befund wie jede
andere Geometrie.

## 10. Architektur

| Datei | Änderung |
|---|---|
| `packages/schema/src/geometry.ts` | `text`-Variante in `Primitive` |
| `packages/core/src/bounds.ts` | `boundsOfMm` liefert für Text die deklarierte Box |
| `packages/core/src/render/svg.ts` | Renderfall im `switch` (`svg.ts:203`), Schriftpolitik |
| `packages/core/src/render/canvas.ts` | derselbe Fall, damit SVG und Canvas gleich auflösen |
| `packages/core/src/pictogram-gate.ts` | `!hasPath && !hasText`, Clipping gegen die Box, Mindestgrößenbefund |
| `packages/core/src/viewbox-gate.ts` | Textbounds = deklarierte Box, keine Strichbreite |
| `packages/core/src/fingerprint.ts` | Textfelder im Fingerprint |
| `packages/core/src/compose.ts` | Fußzone aus `designation` |
| `packages/catalog/src/pictograms/contrast-contract.ts` | `MINIMUM_TEXT_CONTRAST`, Prüfung identischer Tokenpaare |
| `packages/catalog/src/multi-size-snapshots.test.ts` | `fontFiles`, Mindestgrößenbefund |
| `packages/catalog/assets/` | `Arimo[wght].ttf`, `OFL.txt`, Herkunfts- und Prüfsummennachweis |
| `packages/catalog/src/sources.ts` | Quelleneintrag für die Schrift |

## 11. Verifikation

- `pnpm test` grün, ohne übersprungene Tests
- `pnpm typecheck` ohne Fehler
- `pnpm cli coverage` unverändert bei `Einträge: 183`, `Offene fachliche Reviews: 196` **plus** dem
  neuen Quellenreview für die Schrift — dieser Slice liefert keine Katalogzeichen
- Zweifache Rasterung derselben Zeichnung byteidentisch
- Prüfsummentest der Schriftdatei grün
- Ein Textzeichen als Beleg durch alle Gates: Box, Clipping, viewBox, Kontrast, Mehrgrößen,
  Metadaten
- Eine gerenderte Fußzone als Beleg
- `git diff --check` sauber

## 12. Ausdrücklich nicht in diesem Slice

- Neue Katalogzeichen — D.3 nimmt danach wieder auf
- Font-Subsetting, weitere Schnitte
- Mehrzeiliger Text, Text auf Pfad, Laufweitensteuerung
- Ledger-Schlüssel auf Implementierungsebene (aus D.3 benannt)
- Verbindungs- und Kantengeometrie (aus D.3 benannt)
- Jede fachliche Freigabe
