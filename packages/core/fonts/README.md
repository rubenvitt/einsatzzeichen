# Zeichenschrift (Browser)

`renderSvg()` und `renderCanvas()` setzen Kürzel in der Familie, die `TEXT_FONT_FAMILY_ATTR`
nennt: `Einsatzzeichen Sans`, abgeleitet aus IBM Plex Sans. Diese Dateien liefern sie für den
Browser aus, über den Subpfad `@einsatzzeichen/core/fonts/*`. Eine Kopie ins eigene Repository ist
nicht nötig.

| Datei | Stufe | Herkunft |
|---|---|---|
| `text-regular.woff2` | 400 | `EinsatzzeichenSans-Regular.ttf` |
| `text-medium.woff2` | 500 (Katalogtext) | `EinsatzzeichenSans-Medium.ttf` |
| `text-bold.woff2` | 700 | `EinsatzzeichenSans-Bold.ttf` |
| `text-medium-italic.woff2` | 500 kursiv | `EinsatzzeichenSans-MediumItalic.ttf` |
| `text.css` | alle vier als `@font-face` | |
| `OFL.txt` | Lizenz | `EinsatzzeichenSans-OFL.txt`, byte-gleich |

Die TTFs liegen im Prüfpaket (`packages/conformance/assets`, Herkunft und Prüfsummen in dessen
`README.md`). `scripts/font/build-woff2.py` wandelt sie reproduzierbar in WOFF2; Umrisse und
Vorschübe bleiben gleich. Die Dateinamen nennen die Stufe, nicht die Schrift: Beim Wechsel von
Arimo auf „Einsatzzeichen Sans" (ESZ-114) blieben Namen und `text.css` stehen, geändert hat sich
die Familie in `text.css` und `TEXT_FONT_FAMILY_ATTR`.

## Einbinden

```ts
// Alle vier Stufen als @font-face, der Bundler kopiert die Dateien mit:
import '@einsatzzeichen/core/fonts/text.css';

// Oder eine einzelne Datei als URL (Vite):
import mediumUrl from '@einsatzzeichen/core/fonts/text-medium.woff2?url';
```

Für `renderCanvas()` muss die Schrift geladen sein, bevor gezeichnet wird. Ein Canvas wartet nicht
auf `@font-face`:

```ts
import { TEXT_FONT_FAMILY_ATTR } from '@einsatzzeichen/core';

await document.fonts.load(`500 16px "${TEXT_FONT_FAMILY_ATTR}"`);
```

## Lizenz

SIL Open Font License 1.1, vollständiger Text in `OFL.txt`. Die Dateien sind nach OFL §1
zulässige „Modified Versions" von IBM Plex Sans (Teilmenge, statische Instanzen, WOFF2-Container).
„Plex" ist ein reservierter Name der Lizenz; deshalb heißt die Ableitung „Einsatzzeichen Sans".
Wer die Dateien weitergibt, gibt `OFL.txt` mit.
