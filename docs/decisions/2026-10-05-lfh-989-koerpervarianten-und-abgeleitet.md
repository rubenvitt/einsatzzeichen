# Baukasten: Körpervarianten benennen, „abgeleitet“ nur noch im Tooltip der Auswahllisten

> Stand: 5. Oktober 2026
> Status: umgesetzt (LFH-989), Folgepunkt der Entscheidung vom 2. Oktober 2026
> („Ableiten statt Messsperre“, `2026-10-02-ableiten-statt-messsperre.md`)

## Anlass

1. Die Auswahl „Körpervariante“ zeigte rohe Kennungen (`raised-hull`, `inset-hull` …). Seit dem
   2. Oktober 2026 führt `core` dafür `BODY_VARIANT_LABELS` („ortsgebunden (Giebel)“ …), der
   Baukasten nutzte sie nicht.
2. Seit derselben Entscheidung zeichnet der Motor auch Abgeleitetes, und der Baukasten schrieb an
   jeden Eintrag, der eine vermessene Zusammenstellung erst zu einer abgeleiteten macht, „— abgeleitet“
   in den Text. Gemessen am 5. Oktober 2026 über `probeFields()`:

   | Zusammenstellung | Fähigkeiten | Körpermarken | Zustände | Listeneinträge gesamt |
   | --- | --- | --- | --- | --- |
   | leere Formation | 50 / 88 | 46 / 74 | 24 / 61 | 136 |
   | Funktionsstelle | 81 / 88 | 74 / 74 | 24 / 61 | — |
   | Landfahrzeug | 76 / 88 | 59 / 74 | 24 / 61 | — |

   Die Kacheln (Grundzeichenart, Organisation) trafen an der leeren Formation keinen Eintrag.

## Entscheidung

1. **Körpervarianten tragen ihre Bezeichnung aus `core`.** `builderVocabulary()` liest
   `BODY_VARIANT_LABELS`; die bisherige „dokumentierte Ausnahme“ entfällt. Die Zeichenseiten
   (`/zeichen/<slug>/`) lesen dasselbe Vokabular und zeigen die Bezeichnung damit ebenfalls.
2. **In Auswahllisten steht „abgeleitet“ nur noch im Tooltip.** Ein Wort an der Mehrzahl der
   Einträge unterscheidet keinen davon. Wer kein Technikverständnis mitbringt, liest es als
   Warnung, obwohl der Wert zulässig ist. Gesperrte Einträge behalten „geht hier nicht“ im Text:
   das ist eine Auskunft, die man vor dem Wählen braucht.
3. **Gesammelt sagt es der Hinweis unter der Vorschau.** Sobald die Zeichnung abgeleitete Teile
   trägt, erklärt `DerivationNote` das in Alltagssprache und nennt die Teile eingeklappt. Das ist
   die Stelle, an der die Auskunft das Bild betrifft, das man gerade mitnehmen will.
4. **Die Kacheln behalten ihren kleinen Zusatz.** Dort trifft er selten und unterscheidet deshalb
   wirklich; er zählt bewusst zum zugänglichen Namen des Knopfes.

## Verworfen

- **Ein Sammelhinweis je Feld** („N Einträge sind abgeleitet“): wiederholt an jedem Listenfeld
  einen Satz, der für die Auswahl nichts entscheidet, und verdoppelt den Hinweis unter der
  Vorschau.
- **Umgekehrt kennzeichnen** (die vermessenen Einträge statt der abgeleiteten): kippt je nach
  Zusammenstellung, welche Seite die Mehrheit ist, und dreht damit die Bedeutung des Zeichens um.

## Folgen

- Auf Touch-Geräten und in Vorlesehilfen kommt „abgeleitet“ in den Listen erst nach der Wahl an,
  über den Hinweis unter der Vorschau. Das ist gewollt: der Wert ist zulässig, die Auskunft betrifft
  das Ergebnis, nicht die Wahl.
- Tests: `snapshot-build.test.ts` (Bezeichnungen der Körpervarianten), `Builder.test.ts` (keine
  Auswahlliste trägt „abgeleitet“ im Text, der Tooltip bleibt).
