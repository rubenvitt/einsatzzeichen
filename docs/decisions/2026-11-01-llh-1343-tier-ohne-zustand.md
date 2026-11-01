# Tier ohne Zustand: `animal-state` ohne `state`

Stand: 01.11.2026

## Anlass

Der Lifeline Hub zeigt Tiere auf der Lagekarte (LLH-1123). Die Bibliothek kannte nur die drei
Tierzustände aus 5.8.6 (erkrankt, kontaminiert, tot), kein Tier ohne Zustand. Der Hub zeichnete
deshalb einen Kreis mit „T“ (Nachzug LLH-1343).

## Befund

Kein Original zeigt ein Tier ohne Zustand. Die drei Tierzustände sind aber gleich gebaut:

| Zeichen | Träger | Zustand |
|---|---|---|
| 5.8.6.1 erkranktes Tier | Silhouette | senkrechter Strich |
| 5.8.6.2 kontaminiertes Tier | Silhouette (5 mm tiefer) | Strich und Kontaminationszeichen |
| 5.8.6.3 totes Tier | Silhouette | Strich mit Querbalken (Kreuz) |

Die Personenzustände aus 5.8.8 folgen demselben Muster, und dort ist der Fall ohne Zustand belegt:
Person unverletzt (5.8.8.1) ist die Raute allein, verletzt (5.8.8.3) die Raute mit senkrechtem
Strich, tot (5.8.8.7) dazu der Querbalken. Der Strich ist also der Zustand, nicht Teil des Trägers.

## Entscheidung

- **`state` ist an `animal-state` optional.** `{ kind: 'animal-state' }` zeichnet das Tier ohne
  Zustand: die Silhouette des erkrankten und toten Tiers (Ohren y 4, Spitze y 29), ohne Strich.
- **Abgeleitet gekennzeichnet.** Die Zeichnung trägt eine Ableitungsnotiz (`basis: 'transferred'`,
  aus 5.8.6.1 und 5.8.6.3), `freestandingProvenance` meldet `derived`. Es gibt keinen Eintrag im
  Piktogrammregister, weil keine Referenzdatei existiert.
- **Keine neue Art.** Eine eigene Art `animal` hätte für dasselbe Tier zwei Specs ergeben (mit und
  ohne Zustand); die optionale Angabe entspricht der Person, deren `states` leer sein darf.
- **Die zweite Darstellung bleibt am kontaminierten Tier.** `variant: 'alternative'` ohne Zustand
  lehnt `animal-state-variant-not-available` ab.
- **Baukasten:** Das Feld „Tierzustand“ hat den Eintrag „— ohne Zustand —“.

## Folgen

- Minor-Release. Ein älterer Leser lehnt `{ kind: 'animal-state' }` mit Pfad `$.state` ab.
- Wer `AnimalStateSpec.state` liest, muss `undefined` behandeln (TypeScript meldet die Stellen).
