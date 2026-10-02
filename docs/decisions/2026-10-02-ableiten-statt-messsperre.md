# Ableiten statt sperren: der Motor zeichnet jede zulässige Kombination

> Stand: 2. Oktober 2026
> Status: Entscheidung des Eigentümers; Umsetzung im selben Zug (Release 4.0.0)

## Anlass

Eine ortsfeste Leitstelle ließ sich im Baukasten nicht bauen. An der Funktionsstelle saß der
mittige Lauf 3,6 mm unter der Kreismitte, das Kreiskürzel unten rechts lag außerhalb des Kreises,
auf Gelb stand weiße statt schwarzer Schrift. Und fast jedes weitere Feld war gesperrt, mit der
Begründung „nicht vermessen“. Die Leitstelle selbst steht als D.2.5 im Referenzbestand. Der Motor
lehnte sie trotzdem ab, weil `circle-12-requires-hilfsorganisation` den 12-mm-Kreis an die weiße
HiOrg-Fassung band.

Die Entscheidung vom 13. September 2026 (`2026-09-13-grammatik-motor-und-paketschnitt.md`) endet
mit dem Satz: Der Motor lehnt eine Kombination nur noch ab, wenn eine **Regel** sie verbietet,
und nicht mehr, weil kein Original sie belegt. Umgesetzt war das nicht. Eine Bestandsaufnahme vom
2. Oktober hat 91 Regelkennungen gezählt. 30 davon sind reine Messsperren, 10 enthalten einen
Messsperrenteil. Dazu kommen rund 30 Würfe von `NotMeasuredError` ohne Regelkennung. Von 74 613
Einfeldkombinationen (jede Art × Variante mit genau einem weiteren Feld) zeichnete der Motor 684.

## Entscheidung

1. **Der Baukasten trägt alle Kombinationen, die die Systematik zulässt.** Abgelehnt wird nur,
   was eine fachliche Regel verbietet (etwa „Stärke nur an taktischen Einheiten“) oder was als
   Eingabe kaputt ist (leerer Lauf, Zahl ≤ 0, Text außerhalb der Hülle).
2. **Lücken werden abgeleitet.** Grundlage ist die nächstliegende vermessene Fassung: verschoben,
   skaliert oder gespiegelt (`transferred`). Wo es keine Vorlage gibt, folgt die Lage einer Regel
   (`constructed`).
3. **Abgeleitetes ist gekennzeichnet.** `Drawing.derivations` nennt je Teil Dimension, Teil,
   Grundlage und Quelle. `vocabulary()` markiert solche Werte mit `derived: true`.
   `symbolProvenance()` meldet weiterhin `derived` für jede Spec ohne Original. Die Notizen sind
   die feinere Körnung darunter und keine neue Bedeutung des Worts.
4. **Offene Fachfragen werden zugelassen und abgeleitet**, bis ein Fachreview anders entscheidet.
5. **Alles in einem Zug**, nicht dimensionsweise über Wochen.

## Was diese Entscheidung umkehrt

- **LFH-787 „AB“ (29.09.2026):** Kapitel-4-Piktogramme an Körpern ohne vermessene Inset-Fassung
  werden eingepasst, nicht abgelehnt.
- **Verband III:** Der Vorschlag `UNIT_GROUPING_III_PROPOSAL_CX_MM` wird übernommen.
- **Amphibienfahrzeug:** Die Wellenlinie wird aus der Strichhülle konstruiert. Die Vorgabe
  „nicht nähern“ entfällt.
- **Kreis mit Kopfzone:** Das gemessene Negativ (109 × 36 Dateien, Schnittmenge leer) bleibt als
  Befund stehen. Gezeichnet wird trotzdem, abgeleitet.
- **Weiße Schrift auf Gelb:** Das ist eine Korrektur nach Quelle, keine Ableitung. Alle 20 gelben
  Referenzen mit Typo setzen Schwarz.

## Was bleibt

- `function-role-requires-measured-kind` ist Systematik, trotz des Namens. Eine Funktion ist eine
  Festfassung mit fester Trägerart (Person oder Formation). Die Funktionsstelle trägt deshalb
  weiterhin keine „Funktion“. Eine Leitstelle ist eine **Körperform** (12-mm-Kreis mit Giebel und
  Kappe), keine Funktion.
- `state-tactics-not-allowed`, `strength-requires-unit`, `technical-fill-organization-conflict`,
  `plain-wheel-pair-chassis-conflict` und die übrigen Systematikregeln.
- Alle Eingabeprüfungen.

## Offene Fachfragen, vorläufig „zulassen, abgeleitet“

Für diese Fragen fehlt ein Fachreviewer (LFH-406):

- Fahrzeugkategorie am Luftfahrzeug.
- Ereignis mit Organisation.
- Welche Träger eine Verwaltungsstufe tragen.
- Zwei Gefahrenhinweise zugleich.
- Giebel („ortsfest“) über anderen Trägern als dem Kreis.

Die einzelnen Umsetzungsentscheidungen stehen im Abschnitt „Umsetzung“, der nach dem
Zusammenführen ergänzt wird.
