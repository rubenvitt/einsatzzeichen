# Visual QA: Anhang F-c

Datum: 26. August 2026  
Scope: F.2.1 bis F.2.9 einschließlich fünf Alternativdarstellungen  
Status: technische Einzelsichtung abgeschlossen; Domain-Review pending

## Prüfaufbau

Alle 14 Original-SVGs wurden einzeln auf 900 px gerastert. Danach wurden alle 14 aktuellen
Katalogausgaben einzeln gerastert und visuell gegen Original, direktes 64-px-Snapshot und
Mehrgrößen-Snapshot geprüft. Geprüft wurden Hülle, körperbegrenzte Teilung, Zusatzmarken,
Beschriftung, sichtbare Räder beziehungsweise Rotor und die Unterschiede jeder Alternative. Es
wurden keine Referenz-Pfaddaten übernommen. Diese Prüfung ist nicht der finale Task-6-Kontaktbogen.

## Paarprotokoll

| Referenzdatei | Rezept | Beobachtung / Ergebnis |
|---|---|---|
| `F.2.1_KTW.svg` | `F.2.1` | Landhülle, zwei schlichte Radringe, körperbegrenzte Teilung und `KTW` auf Grundlinie 12,5 bestätigt. |
| `F.2.1_KTW_Alternative.svg` | `F.2.1#alternative` | Patiententransportring r 5 mit Diagonalen; kein Kürzel und keine zusätzliche Intensiv-/Arztmarke. |
| `F.2.2_NKTW.svg` | `F.2.2` | `N-KTW_B`, Grundteilung, zwei Räder und kleine obere 0,5 × 0,6-mm-Marke sichtbar; technische Bedeutung bleibt offen. |
| `F.2.2_NKTW_Alternative.svg` | `F.2.2#alternative` | `2` und reiner Patiententransport bestätigt; keine pauschale Intensivmarke. |
| `F.2.3_RTW.svg` | `F.2.3` | `RTW`, Grundteilung und zwei Räder bestätigt. |
| `F.2.3_RTW_Alternative.svg` | `F.2.3#alternative` | Patiententransport plus rechter Intensivbalken bestätigt. |
| `F.2.4_NEF.svg` | `F.2.4` | `NEF`, Grundteilung und zwei Räder bestätigt. |
| `F.2.4_NEF_Alternative.svg` | `F.2.4#alternative` | Arztleiste x = 12…20 auf y = 22 bestätigt; kein Patiententransportring. |
| `F.2.5_NAW.svg` | `F.2.5` | `NAW`, Grundteilung und zwei Räder bestätigt. |
| `F.2.5_NAW_Alternative.svg` | `F.2.5#alternative` | Patiententransport, rechter Intensivbalken und untere Arztleiste gemeinsam bestätigt. |
| `F.2.6_Rettungstransporthubschrauber mit Winschmöglichkeit.svg` | `F.2.6` | Angehobene Luftform und Rotor bestätigt. Waagerechte Teilung endet an den Kurvenschnittpunkten; Winschform ist sichtbar, bounds-relativ und neutral technisch beschrieben. |
| `F.2.7_Intensivtransporthubschrauber.svg` | `F.2.7` | Angehobene Luftform, Rotor, Arztleiste und `ITH` oberhalb der Hülle bestätigt. Lauf schwarz auf Surface, nicht als Seitenzone. |
| `F.2.8_Gerätewagen Sanitätsdienst.svg` | `F.2.8` | Zwei Räder und exakt zwei getrennte Läufe `GW-San`/`50` auf y = 11,54/15,07 bestätigt. |
| `F.2.9_Unfallhilfsstelle.svg` | `F.2.9` | Anhängerhülle mit Deichsel, eigener Teilung und Kreis r 5,5 ohne Diagonalen bestätigt; kein Landfahrzeugrad ergänzt. |

## Querschnittsergebnis

- 14/14 Referenzen sind einem literal getesteten Rezept zugeordnet.
- 14/14 direkte und 14/14 Mehrgrößen-Snapshots sind vorhanden und der Snapshot-Gate ist grün.
- Genau elf Landdarstellungen tragen `plain-wheel-pair`; keine Darstellung setzt
  `vehicleCategory`.
- F.2.6/F.2.7 verwenden ausschließlich `vehicle-air/raised-hull`; der normale Luftkörper bleibt
  fail-closed.
- `airQuartering` endet auf y = 14 bei x = 2,74/29,26 an der Hüllkurve. Es gibt keinen sichtbaren
  Überstand.
- `ITH` liegt vollständig oberhalb der Hülle und ist über einen eigenen Profilanker sowie einen
  `schwarz/surface`-Kontrastvertrag abgesichert.
- Die F.2.6-Form wird nicht als `lifting-loads-persons` ausgegeben. A11y nennt sie neutral
  „Winschform aus Pfeilwinkel und Raute“.
- Formation, `foot-band` und die 14 F-b-Darstellungen blieben in den bestehenden Tests und
  Snapshots unverändert.

## Offene fachliche Punkte

Eine fachkundige Person muss weiterhin entscheiden, welche Bedeutung die kleine obere Marke von
F.2.2 und die Winschform von F.2.6 tragen und ob die weißen F-Körper fachlich tatsächlich
`hilfsorganisation` ausdrücken. Bis dahin bleiben alle 14 Domain-Reviews `pending`; der Scope `F`
wird nicht als vollständig beansprucht.
