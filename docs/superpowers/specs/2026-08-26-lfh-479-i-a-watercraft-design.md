# I-a — Mehrzweck-Wasserfahrzeuge I.3.5 bis I.3.7

> Design-Spec · 26. August 2026 · LFH-479, Parent LFH-419
>
> Status: zur Freigabe. Diese Spec beschreibt den ersten DEV-Slice des in ClickUp in zwölf
> lückenlose Subtasks geschnittenen Anhangs I.

## 1. Ziel und Ergebnis

LFH-479 nimmt genau drei Wasserfahrzeuge in den Kompositionskatalog auf:

| Abschnitt | Referenzdatei | Titel | Innenlabel |
|---|---|---|---|
| I.3.5 | `I.3.5_Mehrzweckboot.svg` | Mehrzweckboot | `MzB` |
| I.3.6 | `I.3.6_Mehrzweckarbeitsboot.svg` | Mehrzweckarbeitsboot | `MzAB` |
| I.3.7 | `I.3.7_Mehrzweckponton.svg` | Mehrzweckponton | `MzPt` |

Das Ergebnis ist ein Draft-PR mit den drei Rezepten, einem eng begrenzten und fail-closed
Körpervertrag, vollständiger technischer Gate-Evidenz und einem Screenshot, der ausschließlich
die erzeugten Katalogausgaben zeigt. Die lokalen Originalreferenzen werden weder eingecheckt noch
im PR-Bild veröffentlicht.

Der Slice erteilt keine fachliche Freigabe. Die technischen Reviews werden erst nach grünen Gates
freigegeben; alle drei Domain-Reviews bleiben `pending`.

## 2. Abgrenzung

### Im Scope

- die drei `primary`-Rezepte I.3.5, I.3.6 und I.3.7;
- eine geometrisch benannte zweite Zeichnung von `vehicle-water` für die I.3-Hülle;
- ein dafür separat vermessenes Layoutprofil;
- enge Validierung der zulässigen Art-, Organisations- und Labelkombination;
- drei Manifestzeilen, drei Domain-Ledgerzeilen und die drei einzelnen Scope-Einträge;
- direkte und Mehrgrößen-Snapshots, technische Entscheidungsnotiz und Visual-QA-Protokoll;
- ein reproduzierbarer 3-up-Screenshot der generierten Ausgaben als PR-Beleg.

### Nicht im Scope

- I.3.1 bis I.3.4 und I.3.8 bis I.3.11; sie liegen in LFH-480 und warten auf diesen Körpervertrag;
- alle übrigen Zeichen des Anhangs I;
- die Zusammenziehung des Manifestumfangs auf `I`, `I.3` oder einen anderen Präfix;
- eine fachliche Gleichsetzung mit E.2.29 bis E.2.31 oder eine Modellierung als deren
  Alternativdarstellungen;
- ein neues `SymbolKind`, eine neue Fähigkeit, eine neue technische Körpermarke oder
  Kapitel-3-/`ortsgebunden`-Semantik;
- Änderungen an `vehicle-water` ohne Variante oder an der E.2-Variante `raised-hull`;
- die Veröffentlichung oder Übernahme von Referenz-Pfaddaten.

## 3. Belegte Unterschiede und Modellentscheidung

Die drei Referenzen führen dieselbe weiße, verkleinerte Wasserfahrzeughülle. Ihre gemessene Hülle
liegt bei ungefähr `x = 1,0100…30,9894 mm` und `y = 9,0001…23,9899 mm`. Die Konstruktion ist ein
Halbkreis mit Mittelpunkt `15,9997`, Sehne `9,0001` und Radius `14,9897` mm.

E.2.29 bis E.2.31 verwenden dieselben drei Kürzel. Die Läufe sind geometrisch bis auf höchstens
0,000353 mm gleich, aber weiß statt schwarz. Ihre Hülle ist außerdem um 1,0002 mm angehoben:
Sehne `7,9999` statt `9,0001` mm. Diese Differenzen sind gemessen; ob die Abschnitte fachlich
dasselbe Zeichen meinen, bleibt eine offene Domain-Frage.

### Entscheidung: `inset-hull`

`BodyVariantId` erhält die geometrische Kennung `inset-hull`. Sie bedeutet ausschließlich:
„separat vermessene, verkleinerte Wasserfahrzeughülle auf der normalen I.3-Sehnenlage“. Der Name
behauptet weder Wasserrettungssemantik noch eine Beziehung zu E.2.

Die zwei verworfenen Ansätze sind:

1. **`raised-hull` wiederverwenden:** falsch, weil Körperunterkante und Labelabstand um 1 mm
   abweichen; das würde eine bekannte Messdifferenz verdecken.
2. **Ein neues Grundzeichen oder drei unabhängige Pfadrezepte:** falsch, weil alle drei dasselbe
   fachliche Grundzeichen `vehicle-water` und dieselbe Körperkonstruktion verwenden. Drei
   Pfadkopien würden den bestehenden Variantenvertrag umgehen.

## 4. Architektur und Datenfluss

### 4.1 Schema

`packages/schema/src/taxonomy.ts` erweitert `BodyVariantId` um `inset-hull` und dokumentiert die
Messgrenze zu Normal- und `raised-hull`-Wasserfahrzeugen. Es entsteht kein weiterer Schematyp.

### 4.2 Körpergeometrie

`packages/catalog/src/base-symbols.ts` registriert unter
`VARIANT_BODIES['vehicle-water']['inset-hull']` genau eine Konstruktion:

```ts
halfCircleBelowChord(15.9997, 9.0001, 14.9897)
```

Sie bleibt außerhalb von `BASE_SYMBOLS`, weil ihr kein eigener Kapitel-1-Abschnitt zugrunde liegt.
Die Normalhülle aus 1.5 und `raised-hull` bleiben byte- und verhaltensgleich.

### 4.3 Layout

`packages/core/src/layout/profiles.ts` liefert für
`profileFor('vehicle-water', 'inset-hull')` ein eigenes Rechteckprofil. Die mittige Grundlinie
liegt absolut auf ungefähr `y = 15,9999 mm`; bezogen auf die Unterkante `23,9899 mm` ergibt sich
der separat gemessene Abstand `7,9900 mm`. Das bestehende Wasserfahrzeugprofil mit `6,9896 mm`
darf nicht geerbt werden.

### 4.4 Validierung und Fehlerverhalten

`packages/core/src/validate.ts` bleibt fail-closed:

- `inset-hull` ist ausschließlich mit `kind: 'vehicle-water'` zulässig;
- die Variante verlangt für diesen Slice `organization: 'hilfsorganisation'`, weil nur die weiße
  Hülle vermessen ist; das ist eine technische Farbauswahl, keine abgeschlossene Domain-Aussage;
- fehlende oder andere Organisationen werden mit einer eigenen Validierungsregel abgelehnt;
- für `inset-hull` ist ausschließlich `labels.center` zulässig; `centerCapHeightMm` darf nur
  zusammen mit diesem Lauf gesetzt werden;
- `topLeft`, `bottomLeft`, `bottomRight`, `belowRight`, `designation` und jede weitere
  Beschriftungszone bleiben unzulässig, weil an der I.3-Hülle keine davon vermessen ist;
- unbekannte Art-/Variantenpaare fallen weder auf die Normalhülle noch auf eine andere Variante
  zurück;
- die bestehenden Verträge für `raised-hull` bleiben unverändert.

Die bestehende Komposition bestimmt auf der weißen Körperfläche automatisch schwarze Labeltinte.
Es wird dafür kein neuer Farbpfad eingeführt.

### 4.5 Rezepte und Manifest

Ein neues `packages/catalog/src/recipes-anhang-i.ts` enthält eine literale, typgeprüfte Matrix mit
den drei Rezepten. Die drei vollständigen Spezifikationen unterscheiden sich ausschließlich im
mittigen Label:

```ts
{
  kind: 'vehicle-water',
  bodyVariant: 'inset-hull',
  organization: 'hilfsorganisation',
  labels: { center: 'MzB' }, // I.3.6: MzAB, I.3.7: MzPt
}
```

`packages/catalog/src/recipes.ts` importiert und spreadet diese Matrix. Die bestehenden Ableitungen
erzeugen daraus Renderfälle und Manifestzeilen; keine zweite manuelle Produktionsmatrix wird
geführt.

`packages/catalog/src/coverage-manifest.ts` beansprucht nur `I.3.5`, `I.3.6` und `I.3.7` einzeln.
Ein Präfix wie `I.3` wäre nicht widerlegbar, solange LFH-480 fehlt. Die technischen Reviews werden
nach erfolgreicher Verifikation auf den 26. August 2026 datiert. Die korrespondierenden Einträge in
`packages/catalog/src/domain-reviews.ts` bleiben fachlich `pending` und halten die sichtbare
Doppelung mit E.2 als Befund fest, ohne Identität zu behaupten.

Der Datenfluss bleibt damit:

```text
I-Rezept -> RECIPES -> composeFromCatalog -> core compose/validate
         -> renderSvg / Renderfälle / Snapshots / Coverage-Manifest
```

## 5. Teststrategie

Die Umsetzung folgt RED → GREEN. Produktionscode wird erst geschrieben, nachdem die jeweils
beschriebene Erwartung wirksam rot ist.

### 5.1 Körper- und Validierungsvertrag

- `base-symbols.test.ts` fordert die exakte konstruierte I.3-Hülle, grünen Fingerprintabgleich für
  I.3.5 bis I.3.7 und die geometrische Trennung von Normal- und `raised-hull`.
- Ein unregistriertes Art-/Variantenpaar muss werfen.
- `validate.test.ts` akzeptiert nur die drei beabsichtigten Vertragseigenschaften und lehnt
  falsche Art, fehlende/abweichende Organisation sowie jede nicht mittige Beschriftung ab. Eigene
  RED-Fälle decken `topLeft`, `bottomLeft`, `bottomRight`, `belowRight` und `designation` ab;
  `centerCapHeightMm` ohne `center` wird ebenfalls abgelehnt.
- Regressionsfälle halten das unveränderte Verhalten von `raised-hull` fest.

### 5.2 Rezept- und Provenienzvertrag

- `recipes.test.ts` vergleicht Abschnitt, Referenzdatei, Titel und vollständigen `SymbolSpec`
  gegen eine literale Drei-Zeilen-Matrix.
- Der Test prüft die absolute mittige Grundlinie, schwarze Labeltinte und das Fehlen einer
  Trägerzeile.
- `coverage-manifest.test.ts` fordert genau drei neue `composition-recipe`-Zeilen mit technischer
  Freigabe, fachlich ausstehendem Review und ausschließlich den drei Einzel-Scopeeinträgen.
- Direkte Snapshots, Mehrgrößen-Snapshots und Renderfälle wachsen jeweils genau um drei.

Ausgehend von `main` sind die erwarteten mechanischen Summen:

| Größe | vorher | nachher |
|---|---:|---:|
| Rezepte | 137 | 140 |
| Renderfälle | 405 | 408 |
| direkte Snapshots | 151 | 154 |
| Mehrgrößen-Snapshots | 406 | 409 |
| Manifestzeilen | 424 | 427 |

Die Zahlen sind Gate-Erwartungen, keine fachliche Abdeckungsbehauptung.

### 5.3 Vollständige technische Gates

Nach den fokussierten Tests laufen frisch und bis zum echten Exit:

```bash
rtk proxy ./node_modules/.bin/tsc --noEmit
rtk proxy ./node_modules/.bin/vitest run
rtk proxy ./node_modules/.bin/tsx packages/cli/src/index.ts coverage
rtk git -c core.fsmonitor=false diff --check
rtk git -c core.fsmonitor=false status --short
```

Die CI wiederholt Installation, Typecheck, Tests und Coverage unter Node 22 und pnpm 11. Lokale
Umgebungs- oder Sandboxfehler werden getrennt diagnostiziert und niemals als Produktfehler oder
grünes Gate ausgegeben.

## 6. Visueller Beleg

Die drei aktuellen Katalogausgaben werden deterministisch bei 900 px exportiert. Ein Generator
unter dem ignorierten Pfad `out/tools/` erstellt:

- `out/lfh-479/contact-sheet/LFH-479-i-a-generated.png` mit drei beschrifteten Kacheln;
- `out/lfh-479/contact-sheet/manifest.json` mit Git-SHA, Rezeptschlüsseln und SHA-256 der drei
  Eingaben und des Gesamtbilds.

Jede Kachel zeigt die 900-px-Ausgabe und das zugehörige generierte Mehrgrößen-Sheet. Das Bild
zeigt damit ausschließlich Katalogausgaben. Die lokalen
Originalreferenzen werden separat in Originalauflösung verglichen und ausschließlich textuell in
`docs/reviews/2026-08-26-i-a-visual-qa.md` protokolliert. Weder Originale noch ein daraus gebauter
Paarvergleich verlassen den ignorierten lokalen Bereich.

Die Messungen, die verworfenen Ansätze und die bewusst offene Domain-Grenze werden zusätzlich in
`docs/decisions/2026-08-26-anhang-i-a.md` festgehalten.

Der Screenshot wird in den Draft-PR hochgeladen und dort zusammen mit dem Manifesthash, den
Gatezahlen und dem Visual-QA-Dokument verlinkt.

## 7. ClickUp- und PR-Lebenszyklus

- LFH-419 bleibt als Parent auf `scoping`, solange weitere Anhang-I-Slices offen sind.
- LFH-479 bleibt während Spec und Plan auf `in design`, wechselt mit Implementierungsbeginn über
  `ready for development` nach `in development` und nach grünem Gesamtgate/Review auf `in review`.
- LFH-480 bleibt formal `waiting_on` LFH-479; die übrigen Subtasks bleiben unabhängig im Backlog,
  bis ihre eigene Spec beginnt.
- Der Branch heißt `feat/lfh-419-anhang-i-watercraft`.
- Der PR ist ein Draft und nennt LFH-479 als Umsetzung sowie LFH-419 als Parent. Er beansprucht
  weder den vollständigen Anhang I noch Domain-Freigabe, Merge oder Deployment.

## 8. Abnahmekriterien

Der Slice ist als DEV-Ergebnis fertig, wenn:

1. genau die drei beschriebenen Rezepte und keine weitere I-Darstellung hinzugekommen sind;
2. `inset-hull` separat vermessen, artgebunden und ohne Fallback umgesetzt ist;
3. alle fokussierten und vollständigen technischen Gates grün sind;
4. die drei lokalen Referenzvergleiche protokolliert und der output-only Kontaktbogen geprüft ist;
5. ein frischer Subagent den gesamten Branchdiff ohne offenen technischen Befund reviewt hat;
6. der Draft-PR den Screenshot, die Gatezahlen, den Git-SHA und die fachlich offenen Grenzen
   sichtbar enthält;
7. ClickUp den PR und die Evidenz unter LFH-479 dokumentiert, während LFH-419 offen bleibt.
