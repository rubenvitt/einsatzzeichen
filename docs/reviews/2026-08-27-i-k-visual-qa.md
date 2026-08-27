# Visual QA: Anhang I.5 — Wasserrettungspersonal

Datum: 27. August 2026  
Scope: `I.5.1` bis `I.5.3`  
Status: technische Sichtprüfung in Originalauflösung bestanden; Domain-Review bleibt `pending`

## Output-only Prüfaufbau

Der ignorierte Generator `out/tools/generate-lfh489-contact-sheet.ts` nimmt nur die drei
live `RECIPES`, `composeFromCatalog`, `renderSvg` und die bereits generierten
Mehrgrößen-Snapshots als Eingabe. Er liest keine Originalzeichnung, keine Inhalte oder Pfade
von `referenceAsset` und keinen privaten Quellenbaum. Für jede Rezept-ID erzeugt er eine
direkte 900-px-Katalograsterung und rastert zusätzlich ihren erzeugten Mehrgrößen-Snapshot.
Nur diese sechs Raster werden in den Kontaktbogen eingebettet.

Der Kontaktbogen ist für Chat und Pull Request sicher: Er enthält Katalogausgaben,
Rezeptschlüssel, Titel und neutrale Ausgabeüberschriften, aber keine Originalzeichnung,
Referenzdatei oder lokalen Quellpfad. Er ist ausdrücklich kein Quellvergleich.

| Rezept | direkte Ausgabe | Mehrgrößen-Evidenz | technischer Zustand | Domain |
|---|---|---|---|---|
| `I.5.1` | zentrierter 26-mm-Rhombus mit Doppelwelle und Innenraute | erzeugter Snapshot mit 16–256 px und Profilen | Coverage/Snapshots `approved` | `pending` |
| `I.5.2` | abgesenkter Rhombus mit derselben Marke und `Strömungsretter` (Kappenhöhe 2,432746 mm) | erzeugter Snapshot mit 16–256 px und Profilen | Coverage/Snapshots `approved` | `pending` |
| `I.5.3` | abgesenkter Rhombus mit derselben Marke und `Taucher` (Kappenhöhe 2,919225 mm) | erzeugter Snapshot mit 16–256 px und Profilen | Coverage/Snapshots `approved` | `pending` |

Technische Geometrie- und Textfreigabe ist nicht gleichbedeutend mit einer fachlichen
Zuordnung. Insbesondere wird keine Wasserrettungsqualifikation, Fähigkeit, Funktion oder
Organisationssemantik erfunden; die technische weiße Füllung ändert daran nichts.

## Reproduzierbares Artefakt

Erzeugungsbefehl:

```text
rtk proxy ./node_modules/.bin/tsx out/tools/generate-lfh489-contact-sheet.ts
```

Der anschließende `--verify`-Lauf rekonstruiert alles im Speicher und schlägt fehl, wenn
Rezeptmatrix, Mehrgrößen-Snapshot, Bildbytes, Abmessungen, Bildhash oder erzeugender Commit
vom Manifest abweichen. Die Ausgabe besteht genau aus:

- `out/lfh-489/contact-sheet/LFH-489-i-k-generated.png`
- `out/lfh-489/contact-sheet/manifest.json`

Der normale Lauf legt `out/lfh-489/contact-sheet/` vor dem Schreiben rekursiv selbst an. Ein
reversibler Clean-output-Test verschob ausschließlich den vorhandenen Zielordner in ein
task-spezifisches temporäres Verzeichnis, ließ den normalen Lauf das Ziel neu anlegen und
bestätigte anschließend `--verify`; die selbst erzeugte Sicherung wurde wieder entfernt.

Vor der finalen Dokumentationsfreigabe werden nach dem Docs-Commit Bild und Manifest erneut
erzeugt, damit der Manifest-Commit dem dokumentierten Head entspricht.

## Originalauflösungsprüfung

Disposition des Elternagenten: **PASS, keine Concerns**. Das PNG wurde nach den finalen
Textmetrik-Korrekturen bei `2048 × 3160` px in Originalauflösung geprüft. Der bestätigte
PNG-SHA-256 lautet `8752e888f320cd85113eb1539c6e3c34cd8cd98c09b40a5e4cee442b042657d1`.

- Alle drei Direktansichten sind vollständig, scharf und ohne Clipping. `I.5.1` zeigt den
  zentrierten 26-mm-Körper; `I.5.2` und `I.5.3` sind sichtbar konsistent abgesenkt, die
  Innenmark bleibt body-relativ identisch.
- Die korrigierten größeren Kappenhöhen von `Strömungsretter` (2,432746 mm) und `Taucher`
  (2,919225 mm) sind vollständig oberhalb links sichtbar; beide Texte kollidieren nicht mit
  der Raute. Die Unterkante von `Taucher` hat sichtbaren Abstand zur Körperspitze. Wellenbänder
  und 8-mm-Innenraute sind in allen drei Reihen konsistent.
- Jede Direktansicht stimmt mit dem 256-px-Referenztheme und den kleineren
  Mehrgrößen-Ausgaben überein. Die Stufen 16/24/32/64/128/256 sowie
  `accessible-light` und `print-monochrome` sind vorhanden und laufen nicht über; unterhalb
  der minimalen Rendergröße sind die kleinen Texte erwartbar nicht vollständig lesbar.
- Das Kontaktblatt ist vollständig und lesbar; es zeigt weder Originalreferenzen noch private
  Quellpfade.

Der nachfolgende Docs-Commit wird durch einen frischen Generator- und `--verify`-Lauf im
Manifest gebunden. Unabhängig von dieser technischen Sichtprüfung bleiben die drei
Domain-Reviews `pending`; ein Kontaktbogen erteilt keine fachliche Freigabe.
