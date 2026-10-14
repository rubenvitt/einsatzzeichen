# Zweirad und Krad (3.7/3.8) als Körperart

> Stand: 14. Oktober 2026
> Status: Entscheidung zu ESZ-142 (Zunder), Nachzug aus ESZ-117 (Punkt 6). Revidiert Punkt 2 von
> ESZ-134 für die beiden Zweiräder; Drohne und Giebel bleiben, wie sie sind.
> Anlass: Lifeline Hub, Abbildung von Fahrrad, Kraftrad und Krad. Heute stehen sie dort als
> generisches Landfahrzeug, weil das Zweirad weder Organisationsfarbe noch Beschriftung trägt.

## Entscheidung

1. **Zwei neue Körperarten:** `two-wheeler` (3.7 Zweirad) und `motorized-two-wheeler` (3.8 Zweirad
   motorgetrieben). Gezeichnet wird genau die Kapiteldatei, dieselben Primitive wie
   `specialFormDrawing()` und das Piktogramm `special-form.*`
   (`core/src/geometry/special-form-bodies.ts`, `TWO_WHEELER_BODIES`). Eine zweite Geometriequelle
   gibt es nicht. 3.8 ist eine eigene Art und keine Variante: eigener Abschnitt, eigene Datei.
2. **Organisationsfarbe im Strich, wie am Ereignis (1.13).** Bogen und Stiel umschließen keine
   Fläche; eine Füllung erfände eine Form. Die Farbe geht deshalb in den Strich, Farben unter 3 : 1
   gegen Weiß (Weiß, Gelb, Hellgrau, Orange) zeichnen schwarz und tragen die Kontursignatur
   (`derive/open-body-tint.ts`). „Offen“ erkennt der Motor jetzt auch an einem Pfad ohne `Z`
   (`derive/open-body.ts`), nicht nur am offenen Polyzug.
3. **Läufe stehen außen.** Oberhalb links, unterhalb rechts, die Oberflächenläufe und die
   Fußzeile werden wie an jedem Körper ohne vermessene Zone abgeleitet (`derive/label-zones.ts`,
   Familie wie das Ereignis) und gekennzeichnet. Kopfzone (Verband) und Randlage der Zustände
   folgen dem Körper wie überall.
4. **Was im Körper stünde, hat keinen Platz.** Läufe im Körper (mittig, oben links, unten links,
   unten mittig, unten rechts), Fähigkeiten, Körpermarken und die weiße Innenkontur lägen auf dem Stiel. Der
   Motor wirft dafür `NotMeasuredError` mit Begründung (`derive/two-wheeler-room.ts`). Das ist eine
   Grenze der Form und keine Regel der Systematik, deshalb keine neue Regelkennung.
5. **Fahrzeug, aber ohne Fahrwerk.** Beide Arten stehen in `VEHICLE_KINDS`, nicht in
   `CHASSIS_BODY_KINDS`: eine Kategorie aus 5.1 lehnt `vehicle-category-requires-chassis-body` ab,
   weil die Form das Rad selbst zeigt. Keine Körpervariante (Fußband, Giebel) ist zugelassen.
6. **Zonen.** Layoutprofil und Zonenmodell sind vom Rechteckkörper übertragen, wie beim Ereignis
   und den Behältern aus ESZ-117; im Zonenmodell als nicht vermessen geführt.

## Warum jetzt doch eine Körperart

ESZ-134 und LFH-567 (Frage 7) lehnten eine `SymbolKind` ab, weil die Art außer dem Körper keine
belegte Zone hätte und überall sonst `NotMeasuredError` würfe. Beides gilt so nicht mehr:

- Seit dem 2. Oktober 2026 leitet der Motor fehlende Zonen ab und kennzeichnet sie
  (`2026-10-02-ableiten-statt-messsperre.md`). Die acht Behälterarten aus ESZ-117 zeigen in keiner
  Datei eine Beschriftung und sind trotzdem Arten.
- Mit Farbe im Strich und Läufen außen zeichnet der Motor jede Kombination, die der Hub braucht.
  Gesperrt bleibt nur, was geometrisch auf dem Stiel läge.

Dass ein Zweirad als Körper mit Organisation verwendet wird, belegt die Referenz weiterhin nicht.
Die Fachfrage `Q-3-sonderformen` bleibt offen; `SPECIAL_FORMS` führt die Rolle der Zweiräder als
vorgeschlagene Körperform (`proposed`), nicht als belegt.

## Nachweis

- Die Art zeichnet ohne weitere Felder dieselben Primitive wie die Kapiteldatei und wie das
  Piktogramm der Manifestzeilen `3.7`/`3.8`; die Mittellinienhülle ist die an der Datei abgelesene
  aus `SPECIAL_FORMS` (`conformance/src/special-form-fixtures.test.ts`). Das Kennzahlenartefakt
  erfasst den Kurvenpfad nicht (`shapes: []`), ein Fingerprint-Vergleich ist deshalb wie bei den
  übrigen Kurvenkörpern nicht ausführbar.
- Farbe, Läufe und Ablehnungen: `core/src/derive/two-wheeler.test.ts`.
- **Keine eigene Manifestzeile.** Die Zeile des Abschnitts trägt schon das Piktogramm, und ein
  zweites Rezept derselben Datei wäre keine Alternativdarstellung. Die Regelabdeckung zählt die
  Art über diese Zeile als belegt (`conformance/src/rule-coverage.ts`).
- Generative Reichweite: je 54 gültige Kombinationen, 12 348 bestehen die Prüfung, 11 052
  komponieren; die Lücke bleibt 1296.
- Ein Pixelvergleich (`pnpm cli reference-diff`) ist in dieser Sitzung nicht gelaufen; die
  Referenzdateien liegen nicht im Repository. Die Zeichnung ist primitivgleich mit den
  Piktogrammzeilen `3.7`/`3.8` aus ESZ-134, ein Lauf mit `--filter 3.` prüft beide zusammen.

## Hinweis für den Lifeline Hub

| Typ im Hub | Spec |
|---|---|
| zweirad, fahrrad | `{ kind: 'two-wheeler', organization, labels: { aboveLeft, belowRight } }` |
| kraftrad (Krad, Motorrad) | `{ kind: 'motorized-two-wheeler', organization, labels: { aboveLeft, belowRight } }` |

Beschriftung im Körper (`center`, `topLeft`, `bottomCenter` …) wirft; der Hub setzt den Lauf
außen oder als Fußzeile (`designation`).
