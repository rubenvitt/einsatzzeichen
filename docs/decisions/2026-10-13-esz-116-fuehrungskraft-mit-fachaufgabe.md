# Führungskraft mit Fachaufgabe, auch ohne Stärke

> Stand: 13. Oktober 2026
> Status: umgesetzt (ESZ-116)
> Zunder: https://zunder.rubeen.dev/#/aufgabe/u1suywts6qgfw6thwviwud6i

## Anlass

Der Lifeline Hub zeichnet Führungskräfte als Person mit Organisation und leitet aus der Funktion
eine Fachaufgabe ab: Notarzt → Arzt, Rettungsdienst → Sanität, Funk → IuK, Logistik. Gegen
core 2.1.0 gemessen (LFH-505, 29.09.2026) lehnte der Motor das ab:

- `{kind:'person', organization:'hilfsorganisation', bodyMarks:['physician']}` → nicht vermessen
- `{kind:'person', bodyMarks:['medical-service']}` ohne Stärke → nicht vermessen
- `{kind:'person', capabilities:['information-communications']}` →
  `capabilities-pictogram-overflows-body`

Einen Indikator „Führungskraft“ ohne feste Organisation und ohne Kürzel gab es nicht, nur die 25
Funktionsfassungen aus Anhang D mit eingebackener Organisation, Kopf und Kürzel. Der Hub ließ die
Fachaufgabe an der Führungskraft deshalb weg.

## Befund auf main (core 5.2.0)

Die drei Ablehnungen gibt es nicht mehr. Sie waren Messsperren und sind mit „Ableiten statt
sperren“ am 2. Oktober 2026 gefallen (`2026-10-02-ableiten-statt-messsperre.md`). Die Person ohne
Stärke trägt jede Fähigkeit aus Kapitel 4 in jeder Organisation und ohne Organisation, als
`bodyMarks` wie als `capabilities`: 1584 von 1584 Kombinationen zeichnen, abgeleitet. Das
Fußband (Logistik, Anhang G) zeichnet an der Person in jeder Organisation.

Das Akzeptanzkriterium „eine Person ohne `strength` mit Fachaufgabe Arzt/Sanität/IuK komponiert“
war damit schon erfüllt. Offen blieb die fachliche Frage.

## Wie eine einzelne Führungskraft mit Fachdienst aussieht

Die Referenz beantwortet sie selbst. Alle 18 Führungskräfte in Anhang D (D.3.1 bis D.3.13,
D.4.1 bis D.4.5) tragen dieselbe **schwarze Kappe** an der Spitze der Personenraute, auch die
ohne Kürzel:

| Zeichen | Organisation | Kopf | Fachaufgabe im Körper | Kürzel |
|---|---|---|---|---|
| D.3.7 Zugführer der Feuerwehr | Feuerwehr | Zug | Brandbekämpfung, randbündig | – |
| D.3.9 Zugführer Sanitätszug | Hilfsorganisation | Zug | Sanität, randbündig | – |
| D.3.10 Zugführer Einsatzeinheit | Hilfsorganisation | Zug | Sanität und Betreuung | – |
| D.3.11 Zugführer Betreuungszug | Hilfsorganisation | Zug | Betreuung | – |
| D.3.12 Gruppenführer Betreuungsgruppe | Hilfsorganisation | Gruppe | Betreuung | – |

Die Einsatzkraft ohne Führungsaufgabe (I.5.1) trägt die Raute ohne Kappe. Daraus folgt:

- **Führungskraft** = Personenraute mit Kappe. Die Organisation färbt den Körper.
- **Fachaufgabe** = die Körpermarke im Körper, randbündig unter der Kappe.
- **Stärke** sagt, welche Einheit geführt wird. Sie ist keine Bedingung: Eine Führungskraft ohne
  zugeordnete Einheit (etwa ein Notarzt) hat keinen Kopf.
- **Führung** als Fachaufgabe ist keine Körpermarke, sondern die Farbe Führung und Leitung
  (gelb), wie bei den Leitungsrollen D.3.2 und D.3.5.

Kapitel 3.2 „Personen mit Sonderfunktionen“ zeichnet dagegen nur einen Querstrich unter der
Spitze, also eine offene Kappe (Fingerabdruck: Strich y 8, x 10 bis 22). Sie entspricht der
offenen Kappe der Fachberater (D.3.14, I.5.8) und ist keine Führungskraft. Eine Sonderfunktion
bleibt außerhalb dieser Entscheidung.

## Entscheidung

1. **Neue Funktionsrolle `leader` („Führungskraft“).** Körper und Kappe des Einsatzleiters (D.3.2)
   ohne Lauf. Sie gehört zu den Rollen der Führung und Leitung: Organisation und Kopf stehen frei,
   jede Fachaufgabe ist zulässig. Wie jede Funktion bleibt sie an die Person gebunden
   (`function-role-requires-measured-kind`).
2. **Immer abgeleitet.** Die Rolle hat kein eigenes Original. Jede Zeichnung trägt die Notiz
   `functionRole … constructed`, `vocabulary()` markiert den Wert mit `derived: true`,
   `symbolProvenance()` meldet `derived`. Die Wertabdeckung zählt `leader` als Lücke der Achse
   `functionRole` (25 von 26 belegt).
3. **Körpermarken randbündig unter der Kappe.** Trägt eine Funktionsfassung keinen Lauf im
   Körper, steht eine nicht vermessene Körpermarke an der Rollenkörperhülle, wie `bodyMark()` sie
   dort zeichnet, und die Kappe liegt darüber. Vorher wurde sie verkleinert eingepasst, weil ihre
   Hülle die Kappe berührt. Das betrifft auch die abgeleiteten Fassungen von D.3.7, D.3.9 bis
   D.3.12, D.4.4 und D.4.5; vermessene Zeichnungen bleiben bytegleich.

## Prüfung

`core/src/derive/function-roles.test.ts`, Block „Führungskraft ohne Kürzel (ESZ-116)“:

- `leader` mit Organisation, Stärke und Fachaufgabe von D.3.7 und D.3.9 bis D.3.12 trifft deren
  Körper, Kopf, Kappe und Körpermarken exakt. Es fehlt nur der Trägerlauf (ASB, DRK, MHD).
- Arzt, Sanität, IuK, Logistik (Fußband) und Transport ohne Stärke zeichnen in jeder Organisation
  und ohne Organisation, mit Kappe und Ableitungsnotiz.
- An der Formation lehnt die Regel ab.

## Für den Hub

Eine Führungskraft mit `istFuehrungskraft` und abgeleiteter Fachaufgabe lässt sich jetzt als
`{kind:'person', functionRole:'leader', organization, bodyMarks|capabilities}` zeichnen, mit
`strength`, wenn sie eine Einheit führt. Die Kaskade in `frontend/src/zeichen/fachobjektZeichen.ts`,
die an der Person Fachaufgabe und Funktion verwirft (Entscheidung 29.09.2026), kann entfallen.
