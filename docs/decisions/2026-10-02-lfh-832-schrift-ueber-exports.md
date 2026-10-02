# Zeichenschrift über den exports-Subpfad von core

> Stand: 2. Oktober 2026
> Status: umgesetzt (LFH-832), Zuschnitt im Rahmen des Tickets

## Anlass

`renderSvg()` und `renderCanvas()` setzen Kürzel in `Arimo`. Die Schriftdateien lagen aber nur in
`@einsatzzeichen/conformance/dist/assets`. Das Prüfpaket lädt im Browser nicht (`node:url`), und
seine Assets stehen in keinem `exports`-Subpfad. Vite bricht mit „not exported under the
conditions …“ ab. Der Hub (LFH-505) und die Website mussten die TTFs samt OFL selbst kopieren
oder über relative Pfade quer ins Nachbarpaket greifen.

## Entscheidung

1. **Ort: `core`, kein eigenes Asset-Paket.** Wer zeichnet, hat `core` schon. Ein zweites Paket
   müsste in jeder Version mitgezogen werden und bringt keinen Nutzen. Die Dateien liegen in
   `packages/core/fonts/`, außerhalb von `dist`. Veröffentlicht werden sie über `files` und den
   Subpfad `"./fonts/*": "./fonts/*"` in `publishConfig.exports`.
2. **Format: WOFF2, vier statische Stufen.** 400, 500, 700 und 500 kursiv. Das sind genau die
   Stufen, die das Schema zulässt (`fontWeight` 400 | 500 | 700, kursiv nur in 500). Statisch
   statt variabel, weil resvg aus statischen Instanzen rastert. Browser und resvg zeichnen so
   dieselben Umrisse. Drei Dateien wechseln nur den Container, `text-regular.woff2` ist die
   Default-Instanz der variablen Datei. Umrisse und Vorschübe gleichen den TTFs in allen Glyphen.
3. **Namen nach Stufe, nicht nach Schrift.** `text-regular.woff2`, `text-medium.woff2`,
   `text-bold.woff2`, `text-medium-italic.woff2`. „Einsatzzeichen Sans“ (LFH-824) bringt
   dieselben vier Stufen mit. Beim Wechsel tauschen sich die Dateien aus, die Imports der
   Verbraucher und `text.css` bleiben gleich. Nur der Familienname ändert sich, und den liefern
   CSS und `TEXT_FONT_FAMILY_ATTR` aus derselben Quelle.
4. **Fertige `text.css`.** Sie erklärt alle vier `@font-face` in der Familie, die die Renderer
   schreiben. Der Familienname ist bereits als `TEXT_FONT_FAMILY_ATTR` exportiert, eine zweite
   Konstante kommt nicht dazu. `font-files.test.ts` hält CSS und Konstante gleich.
5. **TTFs bleiben im Prüfpaket.** Sie sind die Quelle für resvg, die Prüfgates und die
   Provenienzkette. Das Größen-Gate lässt in `core` nur `fonts/*.woff2` durch und verlangt
   `fonts/text.css` und `fonts/OFL.txt`.
6. **Die Website ist der erste Verbraucher.** Sie bindet `@einsatzzeichen/core/fonts/text.css` ein
   (`customCss`, `BaseLayout.astro`) statt eigener `@font-face` mit Pfaden ins Prüfpaket. Die
   PNG-Route rastert weiter mit den TTFs aus `conformance`.

## Folgen

- **Paketgröße:** Gepackt wächst `core` um 104 494 B, weil WOFF2 schon komprimiert ist. Die
  Tarball-Grenze im Gate steigt von 730 000 auf 980 000 B; `main` lag schon bei 727 272 B. Die
  entpackte Grenze bleibt bei 7 300 000 B.
- **Nachweis des Akzeptanzkriteriums:** Der gepackte Tarball wurde in ein leeres Vite-8-Projekt
  entpackt. `import url from '@einsatzzeichen/core/fonts/text-medium.woff2?url'` und
  `import '@einsatzzeichen/core/fonts/text.css'` bauen dort ohne Kopie. In Chromium laden alle
  vier Stufen, und „GW Tauchen“ misst in 500 bei 100 px 586,5 px (Metrik in core: 585,3 px,
  Ersatzschrift: 578,0 px).
- **Erzeugung:** `scripts/font/build-woff2.py` (auch am Ende von `subset-arimo.sh`) erzeugt die
  Dateien reproduzierbar, zwei Läufe ergeben dieselben Bytes. Die Prüfsummen stehen in
  `packages/core/src/font-files.test.ts`.
