# Baukasten auf der Beschreibung

Stand: 06.11.2026 · ESZ-148 (Konzept), ESZ-150 (Schritt 2), baut auf ESZ-149

## Anlass

Der Baukasten war ein Formular über die Felder der `SymbolSpec`: Grundzeichenart, Körpervariante,
Organisation, Technische Füllung, Stärke, Verwaltungsstufe, Technische Kopfmarke,
Fahrzeugkategorie, Funktionsfassung, Fähigkeiten, Körpermarken, dazu Modus „Mit Grundzeichen“
oder „Freistehend“. Jedes Feld stand immer da, auch wo es an der gewählten Art nichts zeichnen
konnte. Gesperrte Werte standen mitten in den Listen, und wer eine Fähigkeit wollte, musste
wissen, ob sie unter „Fähigkeiten“ oder „Körpermarken“ gezeichnet ist. Der Eigentümer fand ihn
unverständlich. Seit ESZ-149 gibt es die Beschreibung `Sign`; der Baukasten zieht nach.

## Entscheidung

Der Baukasten bearbeitet die Beschreibung, nicht den Bauplan. Aufbau von oben nach unten:

1. **Suche zuerst.** „Was willst du zeichnen?“ sucht im Katalog (Rezepte, typische Einsatzmittel,
   abgeleitete Orte, freistehende Zeichen) mit Vorschaubild. Ein Treffer lädt über
   `fromExact(symbol.spec)`; das ist laut Roundtrip-Gate aus ESZ-149 für jedes Katalogzeichen
   bytegleich. So sind Rezepte und typische Einsatzmittel zugleich als Beschreibung abrufbar.
2. **Familien statt 30 Arten.** „Was ist es?“ zeigt die acht Familien aus `KIND_FAMILIES`
   (Einheit, Person, Fahrzeug, Stelle und Gebäude, Behälter und Ressource, Lage, Sonderformen,
   Freistehend), darunter die Arten der gewählten Familie. Der Modusschalter entfällt:
   freistehende Zeichen sind eine Familie.
3. **Nur passende Abschnitte.** Organisation, Fachaufgaben, Größe und Ebene, Funktion, Fahrwerk,
   Darstellung, Zustand, Text. Ein Abschnitt erscheint, wenn `choices(sign, feld)` wenigstens
   einen passenden Wert meldet oder einer gesetzt ist. An der Einheit gibt es kein Fahrwerk, am
   Fahrzeug keine Funktion.
4. **Nicht Passendes eingeklappt.** Unter jeder Auswahl steht „N weitere passen hier nicht“, mit
   dem Grund aus `choices` je Wert. Ein abgeleiteter Wert ist wählbar und trägt nur einen Tooltip.
5. **Fachaufgaben als Suche mit Piktogrammen.** Ein Feld statt `capabilities` und `bodyMarks`;
   die Fassung (randbündig oder Box, vermessen vor abgeleitet) wählt `resolve`. Befragt werden
   nur die sichtbaren Kacheln (24, „Alle N zeigen“ für den Rest), weil die rund 90 Fachaufgaben
   beim ersten Mal je Art mehrere hundert Millisekunden kosten.
6. **Treue statt Regelblock.** `draw` wirft nie. Über der Vorschau steht „Vermessen“,
   „Abgeleitet“ oder „Vereinfacht“; bei „Vereinfacht“ nennt „Nicht im Bild“ jede weggelassene
   Angabe mit Grund, und im Formular trägt der gesetzte Wert die Marke „nicht im Bild“.
7. **Bauplan im Expertenteil.** Eingeklappt: die Beschreibung als JSON zum Bearbeiten (nimmt auch
   einen Bauplan oder eine Hülle v1 an, über `parse`) und darunter der aufgelöste Bauplan
   `drawn.exact`. Technische Körpermarken, Fassungen und Messwerte stehen in der Beschreibung
   unter `exact`; ein eigenes Formular dafür gibt es nicht mehr.
8. **Codebeispiele in Kurzform.** `draw(sign)`, `<Einsatzzeichen sign={sign}>`,
   `element.sign = sign`, `addSymbolImage(map, id, sign, …)`. Die Zeichenseiten zeigen weiter
   den Bauplan, weil sie das vermessene Original darstellen.

### Links

Der Baukasten schreibt die Hülle v2 (`encodeSignParam`) und liest v2, v1 und die rohen Links von
vor LFH-577 (`decodeSignParam`). Kein alter Link bricht. „Im Baukasten öffnen“ auf der Seite eines
Zeichens schreibt v2 über `fromExact`.

### Was entfällt

- `lib/builder-state.ts` und `lib/builder-vocabulary.ts` (Formularzustand und Vokabular über
  `SymbolSpec`). Die Sperrlogik dort ist jetzt `choices` in `core`.
- Die Erklärtexte für gesperrte Werte (`blockedTooltip`, `derivedTooltip`): den Grund liefert
  `choices` selbst.
- Der Modusschalter „Mit Grundzeichen“ / „Freistehend“.

### Was bleibt, wie es ist

- Keine weiße Innenkontur von selbst (ESZ-149, Rückfrage 4); wer sie will, setzt sie im
  Expertenteil unter `exact.whiteInnerContour`.
- Den Verlauf von Pfeil und Linie stellt der Baukasten nicht ein; ein Link behält einen eigenen.
- `@deprecated` an der alten API erst nach dem Umstieg von Lifeline Hub (ESZ-151).

## Verworfen

- **Alle Abschnitte zeigen, Gesperrtes ausgegraut.** So war es; genau das war unverständlich.
- **Gesperrte Werte ganz verstecken.** Dann fehlt die Antwort auf „warum gibt es X hier nicht?“.
  Eingeklappt mit Grund beantwortet sie, ohne die Liste zu füllen.
- **Fachaufgaben mit Wahl zwischen Box und randbündig.** Die Fassung ist Bauplan, nicht Absicht;
  wer sie erzwingen will, setzt `exact.bodyMarks` im Expertenteil.
