# Großer mittiger Lauf im Baukasten

> Stand: 5. Oktober 2026
> Status: umgesetzt (LFH-992), Zuschnitt im Rahmen des Tickets

## Anlass

Der Baukasten setzte den mittigen Lauf immer in Normhöhe (Versalhöhe 4,87 mm). Die Ortszeichen
D.2.3 bis D.2.5 setzen ihr Kürzel mit 7,3 mm, etwa „LtS“ an der Leitstelle. `centerCapHeightMm`
gilt seit dem 2. Oktober 2026 an jeder Körperform, aber zwei Lücken standen im Weg:

1. Am 12-mm-Kreis legte der Motor die Grundlinie ohne Override über die Kreismitte. „LtS“ in
   7,3 mm stand damit 0,35 mm über der Grundlinie 22 von D.2.5 und galt als abgeleitet.
2. Eine Versalhöhe über der Norm erzeugte an anderen Hüllen keine Ableitungsnotiz. Die
   Platzprüfung (`derive/layout-guard.ts`) prüft nur abgeleitete Zeichnungen und sah den großen
   Lauf deshalb nicht. Der Paar-Zensus mit „AB“ in 7,3 mm fand 30 Specs am Luftfahrzeug und am
   eingesetzten Bootsrumpf, deren Lauf aus dem Körper ragte, gezeichnet als vermessen.

## Entscheidung

1. **Auswahl statt Zahl.** Der Baukasten bietet „Normal“ (kein Wert) und „Groß“ (7,3 mm) an, gleich
   hinter dem Feld „Mitte“. Ohne mittigen Text ist die Auswahl gesperrt; wer den Text leert,
   verliert die Höhe mit. Eine Versalhöhe aus einem geladenen Rezept erscheint als eigener,
   nicht wählbarer Eintrag.
2. **Kein „Automatisch“.** Das Ticket nannte es optional. Es wäre ein Zustand der Insel und keiner
   der Spec: ein geteilter Link zeigte je nach Text verschiedene Größen.
3. **Am 12-mm-Kreis ist die Lage vermessen.** Mit genau 7,3 mm und unverkleinertem Kreis
   (Durchmesser 24 mm) gilt die Grundlinie der Originale: 9 mm über der Unterkante am glatten
   Kreis (D.2.3/D.2.4), 8 mm am angehobenen Giebel (D.2.5). Die Zeichnung ist dann vermessen und
   deckt sich mit D.2.5. Jede andere Höhe und der verkleinerte Kreis behalten die Konstruktion
   über die Kreismitte.
4. **Anderswo ist der große Lauf abgeleitet.** Eine Versalhöhe über 4,87 mm erzeugt außerhalb des
   12-mm-Kreises die Notiz `labels.centerCapHeightMm`. Damit greift die Platzprüfung, und wo der
   Lauf nicht in den Körper passt, bricht die Komposition mit einer benannten Lücke ab statt
   falsch zu zeichnen. Kleinere Höhen bleiben ohne Notiz: Sie liegen auf derselben Grundlinie
   innerhalb der Normbox, und die vermessenen Rezepte (E.2, I.1, I.2, I.3) tragen sie.

## Beleg

- `conformance/src/leitstelle-d25.test.ts` unverändert grün; `builder-state.test.ts` vergleicht
  „LtS“ mit „Groß“ primitivgleich mit der D.2.5-Spec samt Grundlinien-Override.
- Paar-Zensus mit zwei zusätzlichen Beschriftungssätzen in 7,3 mm: 136 320 Specs, 0 Verstöße.
