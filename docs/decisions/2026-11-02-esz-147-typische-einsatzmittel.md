# Typische Einsatzmittel als eigenes Register neben den Rezepten

> Stand: 2. November 2026
> Status: umgesetzt (ESZ-147)

## Anlass

Anwendungen, die ein Zeichen aus einer Liste wählen lassen, finden dort nur, was `RECIPES` führt.
Das sind die rund 290 Beispiele der Baseline, jedes mit Referenzdatei. Viele Mittel, die im
Alltag ständig vorkommen, stehen dort nicht: der KTW Typ B der Medizinischen Task Force, der
Einsatzleitwagen 1 einer Bereitschaft, der Gruppenführer einer Sanitätsgruppe, das HLF 20, der
Notarzt. Zeichnen kann der Motor sie seit „Ableiten statt sperren“ (2. Oktober 2026) alle, aber
jede Anwendung müsste die Spec selbst bauen. So entstehen für dasselbe Fahrzeug verschiedene
Zeichen. Der Schwerpunkt liegt auf dem Katastrophenschutz der Hilfsorganisationen.

## Entscheidung

1. **Ein eigenes Register `TYPICAL_SYMBOLS`** in `@einsatzzeichen/conformance`
   (`src/typical/`). Ein Eintrag hat Titel, Abkürzung, Sachgebiet, Spec, Muster, fachlichen Bezug
   und Suchbegriffe (`TypicalSymbol`).
2. **Nicht in `RECIPES`.** Ein Rezept belegt den Motor gegen eine Referenzdatei. Daran hängen
   Inventar, Coverage-Manifest, Prüfliste, Fingerabdrücke und Snapshots. Ein Eintrag ohne Datei
   müsste dort überall eine Ausnahme sein. Das Register ist dagegen eine Vorbelegung: eine
   Auswahl, auf die sich Anwendungen einigen können. Das entspricht Punkt 8 der Vision: eine
   organisationsspezifische Erweiterung ist als solche gekennzeichnet.
3. **Gebaut nach vermessenen Mustern.** Jeder Eintrag nennt in `pattern` die Rezepte, deren Bauart
   er übernimmt (Körper, Marke, Lage des Kürzels). Die Zeichnung selbst ist meist abgeleitet und
   trägt das in `Drawing.derivations`, wie jede andere Zeichnung ohne Original.
4. **Sachgebiete statt Organisationen.** Sanitätsdienst, Rettungsdienst, Betreuung,
   Verpflegung/Logistik/Technik, Führung und IuK, weitere Fachdienste, Feuerwehr, THW. Die
   Hilfsorganisationen teilen sich die weiße Fassung `hilfsorganisation`. Varianten je ASB, DRK,
   JUH, MHD oder DLRG gibt es nicht, weil ihre Zeichen sich nur im Trägerkürzel unterscheiden.
5. **Personen nach ESZ-116.** Eine Einsatzkraft ist die Raute ohne Kappe, eine Führungskraft
   trägt die Rolle `leader`, die Stärke nennt die geführte Einheit und die Körpermarke die
   Fachaufgabe.
6. **Ein Gate** (`typical.test.ts`): Jede Spec ist gültig und zeichnet. Kein Titel und keine Spec
   kommt doppelt vor, auch nicht gegenüber `RECIPES`. Was die Baseline schon führt, wird also
   nicht ein zweites Mal aufgenommen. Jedes Muster existiert.

## Verworfen

- **Einträge in `RECIPES` mit leerer Referenzdatei.** Das bricht die Belegpflicht, und jeder
  Prüfschritt bräuchte eine Weiche.
- **Ein Profil je Hilfsorganisation.** Die Zeichen wären bis auf das Kürzel gleich, und die Liste
  in einer Anwendung würde fünfmal so lang.

## Folgen

- Anwendungen lesen `TYPICAL_SYMBOLS` neben `RECIPES`. Der kommplan-Generator der IuK-Suite
  (`scripts/kommplan-zeichen-generat.ts`) braucht dafür eine zweite Schleife mit eigenem
  Schlüsselpräfix. Bei einer Version ohne diese Schleife erscheinen die neuen Zeichen dort nicht.
- Die Website zeigt die Einträge als fünfte Art mit eigener Seite, im Kapitel des Sachgebiets und
  ohne Prüfstand gegen eine Vorlage.
- Die fachliche Prüfung steht für jeden Eintrag noch aus. Fällt ein Eintrag dabei durch, wird
  er geändert oder gestrichen. Das Register hat keine stabile Zusage wie die Rezepte.
