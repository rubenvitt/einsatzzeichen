# Läufe folgen dem verkleinerten Körper

> Stand: 5. Oktober 2026
> Status: umgesetzt (LFH-987), Folge von `2026-10-02-ableiten-statt-messsperre.md`

## Anlass

Giebel (`derive/body-variants.ts`) und Kopfzone (`placeBaseUnderHead` in `derive/head-zone.ts`)
verkleinern an abgeleiteten Zusammenstellungen den Körper samt Zusatzgeometrie. Die Läufe im
Körper behielten dabei ihre Normgröße und ihre körperrelativen Abstände in Millimetern. Seit dem
2. Oktober 2026 meldet die Platzprüfung (`derive/layout-guard.ts`) solche Zusammenstellungen als
Lücke statt als Fehlzeichnung, etwa Formation + Giebel + Trupp + mittiger Lauf. Rund 4 400 weitere
endeten als `label-too-wide`, weil die Zone mit dem Körper schmaler wurde, der Lauf aber nicht.

## Entscheidung

1. **Läufe im Körper folgen ihm.** `compose()` rechnet die Zonen `center`, `topLeft`,
   `topLeftLines`, `bottomLeft`, `bottomCenter` und `bottomRight` gegen den unverkleinerten
   Körper und bildet die Läufe danach mit derselben Ähnlichkeitsabbildung ab wie den Körper:
   Lage, Schriftgrad, Box und Einsatzgrenze (`derive/run-scaling.ts`). Das ist derselbe
   Mechanismus, mit dem Piktogramme und Zusatzgeometrie dem Körper folgen.
2. **Die Abbildung ist `shrink ∘ place ∘ gable ∘ place⁻¹`.** Der unverkleinerte Körper ist der
   vom Profil platzierte Grundkörper ohne Giebel- und Kopfverkleinerung. Die Platzierung des
   Profils selbst bleibt außen vor; ihre Lagen sind vermessen (die Person in D.3.7).
3. **Untergrenze: Versalhöhe 2,12 mm.** Das ist der kleinste Lauf, den die Quelle in einen Körper
   setzt („Strömungsrettung“ in I.2.6). Nach der Textpolitik (`MINIMUM_TEXT_RENDER_PX`) ist er
   ab 84 px lesbar, auf der Snapshot-Leiter ab 128 px. Fiele ein Lauf darunter, steht er in
   diesem Grad, mit der Versalmitte dort, wo sie abgebildet stünde. Reicht der Platz dann nicht,
   bleibt es bei der benannten Lücke.
4. **Läufe auf der Ausgabeoberfläche folgen nicht.** `aboveLeft`, `belowRight`, `surfaceBelow*`
   und die Fußzone stehen neben dem Körper, nicht in ihm, und behalten ihren Grad.
5. **Abgeleitet notiert.** Die Zeichnung trägt `dimension: 'labels'`, `basis: 'transferred'` mit
   Faktor und, wo sie greift, der Untergrenze.

Das Layoutprofil des Giebels verschiebt die mittige Grundlinie nicht mehr. Bis dahin rückte sie so
mit, dass die Mitte eines Normlaufs auf derselben relativen Körperhöhe stand. Das leistet jetzt
die Abbildung selbst, und zwar für jeden Grad.

## Folgen

Paar-Zensus (`scripts/census/pair-census.mts`), 136 320 Specs samt der großen mittigen Läufe
(Versalhöhe 7,3 mm):

| Stand | gezeichnet | Lücke | davon Platzprüfung | Regel | davon `label-too-wide` | Geometrieverstöße |
|---|---:|---:|---:|---:|---:|---:|
| vorher | 74 111 | 13 201 | 1 996 | 49 008 | 10 054 | 0 |
| nachher | 79 848 | 11 857 | 680 | 44 615 | 5 661 | 0 |

Was in der Platzprüfung bleibt, hat vor allem andere Ursachen:

- Der große mittige Lauf (7,3 mm) ist höher als die flachen Rümpfe des Luftfahrzeugs, auch ohne
  Verkleinerung.
- Wasserfahrzeug und Wechsellader mit Fußband: Das Eckkürzel rückt über das Band und trifft den
  mittigen Lauf. Der Körper ist dort nicht verkleinert.
- Die Raute der Person unter Giebel und EU-Kopf: Die Eckkürzel stehen an der Untergrenze und
  reichen in den mittigen Lauf.
- Der 9 mm hohe EU-Kopf an der Gefahr ragt über die Zeichenfläche.

Vermessene Zeichnungen bleiben bytegleich. Alle Snapshots, Fingerabdrücke und Rezepte laufen
unverändert.
