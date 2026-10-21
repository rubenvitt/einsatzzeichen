# Freistehende Zeichen im Katalog der Website (ESZ-146)

Stand: 21.10.2026

## Anlass

Seit ESZ-135 baut der Baukasten freistehende Zeichen. Der Katalog der Website (`snapshot.symbols`)
führte sie nicht: er entstand aus den Manifestzeilen `catalog-entry` und `composition-recipe` und
den abgeleiteten Orten, alle mit `SymbolSpec`. Die freistehenden Zeichen hatten weder Zeichenseite
noch Platz im Explorer; die Piktogramme waren in der Prüfliste Elementzeilen ohne Link.
Offen geblieben aus `2026-10-20-esz-135-baukasten-freistehend.md` (Abschnitt „Nicht in diesem
Schritt“).

## Entscheidung

- **Eine vierte Art.** `SymbolSummary.kind` bekommt den Wert `freestanding`, lesbar
  „freistehend, ohne Grundzeichen“ (`symbol-kinds.ts`). `SymbolSummary.spec` ist jetzt `AnySpec`;
  getrennt wird mit `isFreestandingSpec`. Die Art-Facette des Explorers trägt damit vier Werte,
  URL-Wert `art=freestanding`. Keine eigene Facette: Kapitel und Suche trennen Pfeile, Wetter und
  Piktogramme ohnehin.
- **Zuschnitt aus dem Prüfpaket, nicht von Hand.** Ein Zeichen wird, was
  `FREESTANDING_SPEC_FIXTURES` (Referenzdatei → `FreestandingSpec`, dort gegatet) als Spec führt:
  - **252 Elementzeilen mit Seite:** die Zeile, deren Referenzdatei eine Fixture hat (204
    Piktogramme aus Kapitel 3.6–3.8, 4, D, I.5, J, K, L, M; 34 Zustände aus 5.8; 4 Tierzustände),
    dazu die zehn Wetterwerte 5.8.7.1 bis 5.8.7.10, deren Zustandszeile `freestandingRedirect` an
    die Wetter-Spec mit einem Wert weiterreicht. Name, Abschnitt, Profil, Prüfstand und
    Nachweisarten kommen aus der Zeile; ihre Matrixzeile bekommt den Slug. ID ist die
    Implementierung der Zeile, bei der zweiten Darstellung mit `#alternative`.
  - **18 Referenzdateien ohne Manifestzeile:** 6 Pfeile aus 5.2, 8 Linien aus 2.14 bis 2.20 und 4
    Wetterbeispiele aus 5.8.7. Das Referenzinventar führt sie als zurückgestellt (LFH-566), also
    kein Manifestschlüssel und kein Prüfstand: beide Achsen `pending`, keine Nachweisarten, und die
    Zeichenseite sagt in eigenen Sätzen, warum. Der Abschnitt kommt aus dem Präfix der
    Referenzdatei; der Dateiname selbst geht nicht in den Snapshot (Spec §5.3). IDs aus der Spec:
    `movement.<id>`, `line.<id>`, `weather.<werte>-<intensität>`.
- **Ohne Seite bleiben** die Organisationsfarben, Stärken und Fahrzeugkategorien (Bausteine, die
  einen Träger brauchen), die Zustände, die eine `SymbolSpec` zeichnet (Person 5.8.8, die zweiten
  Darstellungen der Hinweise 5.8.1.13/14), und die Leitstelle D.2.5 (ein Ort). Ebenso die
  Altzeichen aus DV 102 (`LEGACY_SPEC_FIXTURES`): andere Quelle als die Baseline, eigene Aufgabe.
- **Zeichenseite.** JSON, Baukasten-Link (`encodeAnySpec`, für eine `SymbolSpec` bytegleich wie
  bisher), Codebeispiele und die Felder-Tabelle gehen von der `FreestandingSpec` aus. Feld- und
  Wertbezeichnungen kommen aus `FREESTANDING_FIELDS` des Baukastens, die Regeln je Feld aus
  `FREESTANDING_RULE_IDS`/`FREESTANDING_RULE_EXPLANATIONS`.
- **Baukasten.** „Aus dem Katalog laden“ stellt bei einem freistehenden Zeichen auf den Modus
  „Freistehend“ um. Der Hinweis „Geladen: …“ gilt nur im Modus, zu dem die geladene Spec gehört.
- **Kontrastausnahmen** hängen auch an den freistehenden Piktogrammen ihrer Abschnitte (4.1.6 bis
  4.1.8, 4.2.2, 5.8.1.x, L.10): es ist dasselbe Bild.

## Folgen

- `snapshot.symbols` wächst von 309 auf 579 Zeichen, `public/catalog-snapshot.json` von rund
  1,6 auf 2,0 MB (ungepackt). Die Zeichenübersicht `/zeichen/` trägt doppelt so viele Miniaturen.
- Die Zahl „Zeichen mit eigener Seite“ auf Start- und Prüfseite der Doku zählt jetzt die
  Matrixzeilen mit Slug, nicht `symbols.length`: dort stehen auch Orte und Zeichen ohne Zeile.
