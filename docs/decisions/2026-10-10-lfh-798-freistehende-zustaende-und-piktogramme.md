# Freistehende Zustände und Piktogramme als Spec-Arten

> Stand: 10. Oktober 2026
> Status: Entscheidung des Eigentümers vom 10. Oktober 2026 (LFH-798, LFH-834, LFH-804).
> Anlass: Lifeline Hub, LFH-836 (freie Lagekarten-Zeichen auf `@einsatzzeichen`).

## Anlass

Der Lifeline Hub will seine freien Lagekarten-Zeichen als `AnySpec` speichern. Das Altpaket
(`taktische-zeichen-core` 0.10) bietet dafür 84 „Symbole“ an, einzeln oder im Grundzeichen. Ein
Abgleich gegen 5.0.0/5.1.0 vom 10. Oktober 2026 hat ergeben:

- 67 der 84 Alt-Symbole haben eine Einzelzeichnung im Piktogramm-Register (`pictogram(id)`), sind
  aber über keine Spec erreichbar.
- Freistehend („nur Symbol“) zeichnen heute 15: fünf als eigener Körper, zwei als `animal-state`,
  sieben Personenzustände als `{ kind: 'person', states: [...] }` und „Sammeln“ als Pfeil 5.2.6.
- `FreestandingSpec` kennt nur `movement`, `line`, `weather` und `animal-state`.

Die Entscheidung vom 29. September 2026 (`2026-09-29-lfh-561-zugaengliche-api.md`, §5 Punkt 2)
hat eine freistehende Art für die Einzeldarstellung der Zustände bereits bestätigt; offen waren
Name, Zuschnitt und die Frage nach den übrigen Piktogrammräumen.

## Entscheidung

1. **Zwei neue freistehende Arten** neben `movement`, `line`, `weather` und `animal-state`:
   - `{ kind: 'state', state: StateId, variant?: DepictionVariant }` zeichnet die
     Einzeldarstellung eines Zustands aus Kapitel 5.8 (5.8.1 bis 5.8.5 und 5.8.9). Die Taktiken
     5.8.1.1 bis 5.8.1.4 sind damit freistehend zeichenbar; am Träger bleiben sie gesperrt
     (`state-tactics-not-allowed`).
   - `{ kind: 'pictogram', pictogram: PictogramId, variant?: DepictionVariant }` zeichnet ein
     Einzelpiktogramm aus den übrigen Räumen: Kapitel 4 (`capability.*`), Anhang J (`comms.*`),
     Schäden (`damage.*`), Vegetationsbrand (`wildfire.*`), Führung (`leadership.*`) und
     Wasserrettungspersonal (`water-rescue-personnel.*`).
2. **Kapitel-4-Fähigkeiten dürfen freistehend stehen.** Beleg ist die Kapiteldatei selbst; das
   Bild ist wörtlich. Dass eine Fähigkeit auf der Lagekarte freistehend verwendet wird, belegt die
   Referenz nicht. Die Provenienz vermerkt das.
3. **Eine Spec je Bild (Kanonik).** Wo es für ein Bild schon eine Spec gibt, lehnen `state` und
   `pictogram` den Wert mit einer Regel ab und nennen die kanonische Spec:
   Tierzustand 5.8.6 → `animal-state`, Wetter 5.8.7 → `weather`, Personenzustand 5.8.8 →
   `{ kind: 'person', states }`, Hinweis-Alternativen 5.8.1.13/14 → `{ kind: 'hazard', states }`,
   `state.*` im Raum `pictogram` → Art `state`, Führungszeichen mit eigener Kennung (etwa
   Leitstelle D.2.5 als Ort) → die vorhandene Spec.
4. **Keine neue Achse „Innen-Piktogramm“ in `SymbolSpec`.** Kapitel 4 bleibt bei
   `capabilities`/`bodyMarks`, Kapitel 5.8 bei `states`. Kommunikationszeichen aus Anhang J
   stehen nur freistehend; IuK im Körper läuft über die Fähigkeit 4.9.1.
5. **Grundzeichen im Grundzeichen** (Fahrzeug, Person, Flugzeug, Hubschrauber, Wasserfahrzeug als
   Symbol in einer Stelle) werden begründet ausgeschlossen: kein Original, 2025 drückt das über
   das Grundzeichen selbst aus (`docs/superpowers/specs/2026-08-28-lfh-433-legacy-migration-scoping.md` §3.3).
6. **Personen- und Tierzustände bleiben an ihren Trägern** (Regel vom 29. September 2026).
7. **Vokabular für freistehende Arten (LFH-804):** eng getypt wie `vocabulary()` für
   `SymbolSpec`, gestützt auf `checkAnySpec`.
8. **Versionierung:** neue Mitglieder von `FreestandingKind` sind ein Minor-Release mit Hinweis
   im CHANGELOG. Das Format bleibt `{"v":1}`; ein alter Leser lehnt die neue Art mit Pfad ab.
9. **LFH-800 (Wetterpaare als Regel) gilt als hinfällig**, seit der Entscheid vom 2. Oktober 2026
   die Paare abgeleitet zulässt.

## Was offen bleibt

- Sonderformen 3.6 bis 3.8 (Drohne, Zweirad, Kraftrad) als Spec: LFH-1298, Bezug LFH-831.
  Erledigt mit ESZ-134 (`2026-10-13-esz-134-sonderformen-als-piktogramme.md`): Raum
  `special-form.*` in der Art `pictogram`, die Drohne im Körper als Körpermarke.
- Ein Baukasten-Modus für freistehende Zeichen auf der Website: eigenes Ticket. Erledigt mit
  ESZ-135 (`2026-10-20-esz-135-baukasten-freistehend.md`); die Explorer-Facette folgt mit ESZ-146.
- Alt-Symbole ohne Nachfolger (Geräte, Sichten, Fernschreiben, Festbildübertragung): der Hub
  entscheidet über Näherung oder Ausschluss.

## Verworfen

- **Eine generische Art für alle 269 Piktogramme:** weniger Code, aber mehrere Specs für dasselbe
  Bild (Wetter, Tier, Personenzustand) und Abweichung vom Namen aus LFH-798.
- **Eine Art je Raum:** am engsten getypt, aber `FREESTANDING_KINDS` und Leser wüchsen mit jedem
  Raum.
- **`comms.*` in `capabilities` oder `bodyMarks`:** falsche Aussage in der Kennung (die Räume sind
  in `pictogram.ts` bewusst getrennt) und faktisch ein Major.
