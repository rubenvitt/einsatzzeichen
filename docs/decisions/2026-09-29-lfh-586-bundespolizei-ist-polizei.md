# LFH-586: Die Bundespolizei ist keine eigene Organisation

> Stand: 29. September 2026
> Status: **entschieden und umgesetzt.** Entscheider: Ruben Vitt (Projektinhaber), 29.09.2026.
> Bezug: `docs/reviews/2026-09-29-lfh-586-vorfrage-bundespolizei.md` (Belege, Option (a)),
> `docs/reviews/2026-09-29-lfh-586-g-3-2-polizei-oder-bundespolizei.md` §6,
> `docs/decisions/2026-08-26-anhang-n.md`, `docs/decisions/2026-09-19-masse-an-der-referenz-ablesen.md` §5.3

## 1. Anlass

Seit LFH-422 (Commit `31c2cbe`, 26.08.2026) führte der Katalog neun Organisationen: die acht aus
Kapitel 2 und dazu `bundespolizei` in Hellgrün (`hellgruen`, `#64dc32`). Begründet war das allein
mit der Füllfarbe der Vorlage N.1.3 „Einsatzfahrzeug Bundespolizei“. Am 19.09.2026 wurde D.4.4
„Leiter Gefahrenabwehrkräfte Bundespolizei“ aus demselben Grund auf `bundespolizei` umgestellt
(Commit `cbe92ab`). G.3.2 „Verpflegungszubereitungsstelle Polizei“ blieb `polizei`, obwohl seine
Vorlage ebenfalls hellgrün ist (§5.3 der Notiz vom 19.09.2026).

Die Registerfrage `Q-N-traegerzuordnung` fragte unter anderem, ob die Bundespolizei zu Recht eine
getrennte Organisation ist. Von der Antwort hing ab, ob G.3.2 überhaupt eine eigene
Fachentscheidung braucht. Deshalb wurde dieser Teil zuerst geklärt.

## 2. Belege (kurz)

Ausführlich im Vorfrage-Dokument, Abschnitte 1 bis 3.

- Das BBK-Heft von 2025 ordnet die Bundespolizei in der Erläuterung zur Farbtafel 2.5 „Polizei“
  ausdrücklich der Polizei zu, neben Landespolizei, Kriminalämtern und Zoll. „BuPol“ steht dort
  nur in der Liste der Kurzbezeichnungen, neben „LPol“ und „BePol“.
- Die Fassung von 2010 sagt dasselbe: Tafel 2.5 grün für „Polizei, Bundespolizei, Zoll“.
- Kapitel 2 der SVG-Sammlung hat keine Tafel für die Bundespolizei.
- Das Hellgrün `#64dc32` ist im Heft die Farbe der **Polizei** (Tafel 2.5, Farbtabelle O.1), nicht
  die einer eigenen Bundespolizei. In der SVG-Sammlung tragen es genau drei Dateien: D.4.4, G.3.2
  und N.1.3. Die SVG-Tafel 2.5 „Polizei“ ist dagegen `#14a01e`.

## 3. Entscheidung

> „Keine eigene Organisation, Grün #14a01e.“ — Ruben Vitt, 29.09.2026

1. **Die Bundespolizei ist keine eigene Organisation.** Der Wert `bundespolizei` entfällt aus
   `OrganizationId`. Es gibt keinen Alias und keine Übergangsschicht.
2. **Die Polizei bleibt Grün `#14a01e`** (`gruen`), wie die SVG-Tafel 2.5. Das ist Option (a) des
   Vorfrage-Dokuments. Damit ist auch die Anschlussfrage „welches Grün?“ beantwortet: Der Katalog
   bleibt bei einer einzigen Farbreihe, der SVG-Reihe.
3. **D.4.4 und N.1.3 werden `polizei`.** Die Beschriftung „BuPol“ bleibt in beiden Zeichen als Text
   stehen und benennt den Träger genauer, so wie es das Heft für Kurzbezeichnungen vorsieht.
4. **G.3.2 bleibt `polizei`.** Die Frage aus §6.2 des G.3.2-Dokuments entfällt.

## 4. Folgen

### 4.1 Inkompatible Schemaänderung

Wer `organization: 'bundespolizei'` schreibt, bekommt künftig einen Typfehler. Ungetypte Eingaben
mit diesem Wert (etwa aus JSON) lässt `validateSpec()` heute ohne Befund durch; erst die
Komposition bricht in `organizationColor()` ab, mit der allgemeinen Meldung „Keine
Organisationsfarbe für "bundespolizei" — Kapitel 2 des Referenzbestands enthält dafür keine
Datei.“ Betroffen sind:

- `@einsatzzeichen/schema`: `OrganizationId` und `ORGANIZATION_IDS` (acht statt neun Werte).
- `@einsatzzeichen/core`: `ORGANIZATION_COLORS` und `ORGANIZATION_LABELS` ohne `bundespolizei`;
  `ORGANIZATION_BODY_DASHES` ohne `hellgruen` (das Druckmuster `[3, 1]` entfällt, weil keine
  Organisation mehr hellgrün ist); der Baustein `color.bundespolizei` entfällt; die Funktionsfassung
  `hazard-response-forces-director` erwartet `polizei`.
- `@einsatzzeichen/conformance`: Das Element `organization.bundespolizei` entfällt; die Rezepte
  D.4.4 und N.1.3 tragen `polizei`.

Die Farbe `hellgruen` bleibt als Palettenfarbe erhalten. Sie ist nur keiner Organisation mehr
zugeordnet.

Eine erklärende Ablehnung („Die Bundespolizei gehört zur Polizei, nutze `polizei`“) gibt es nicht.
Der Prüfer kennt bislang keine Regel für unbekannte Organisationswerte, und die Regelerklärungen
aus LFH-579 sind auf diesem Stand noch nicht vorhanden. Das bleibt ein offener Punkt. Umstieg für
Nutzer: `polizei` statt `bundespolizei` schreiben; „BuPol“ kann als Beschriftung im Zeichen stehen.

### 4.2 Bewusste Farbabweichung von drei Vorlagen

D.4.4, G.3.2 und N.1.3 sind in der Vorlage hellgrün (`#64dc32`). Der Katalog zeichnet sie im Grün
der Tafel 2.5 (`#14a01e`). Die Abweichung ist gewollt und an diesen Stellen festgehalten:

- im technischen Review der Abschnitte D.4, G und N (`packages/conformance/src/coverage-manifest.ts`,
  jeweils als datierter Nachtrag);
- als Test in `packages/conformance/src/organizations.test.ts`: Genau diese drei Vorlagen tragen
  `#64dc32`, alle drei sind `polizei`, und keine Organisation ist hellgrün;
- in `packages/conformance/src/recipes-anhang-n.test.ts` (N.1.3 zählt nicht mehr zu den
  quellengetreuen Füllungen) und an den Rezepten selbst.

Der Körperlauf „BuPol“ in N.1.3 steht schwarz auf Grün. Das erreicht in allen drei Farbprofilen die
Textschwelle, es kommt keine Kontrastausnahme hinzu.

### 4.3 Fachreview

- `Q-N-traegerzuordnung` ist um den Bundespolizei-Teil gekürzt. Der Kontext der Frage verweist auf
  diese Notiz. Offen bleiben Bauhof, Beauftragter Dritter und die Bundeswehr-, Feuerwehr- und
  ZIV-Zuordnungen.
- `Q-D.4-verwaltungsrollen` („Verwaltungszuordnung hinter … BuPol“) ist davon getrennt und bleibt
  offen.
- Reviewstatus ändern sich nur im Fachreview-Werkzeug. `domain-reviews.ts` ist unverändert.

### 4.4 Zahlen, die sich dadurch bewegen

- Organisationen, Farbbausteine und Organisationselemente: 9 → 8; Elemente insgesamt 274 → 273.
- Generative Reichweite, Stufe 1: 244 530 → 220 077 enumerierte Kombinationen, 993 → 894 nach den
  Regeln gültig, 924 → 832 komponiert. Die 71 in der Referenz belegten Signaturen bleiben.
- Snapshots: D.4.4 und N.1.3 (direkt und in mehreren Größen) sowie der Sammelbeleg
  `organization-profiles.svg`, dem die Spalte der Bundespolizei fehlt.

## 5. Nicht geändert

- Die Titel „Leiter Gefahrenabwehrkräfte Bundespolizei“ und „Einsatzfahrzeug Bundespolizei“ bleiben
  wörtlich wie die Quelle.
- Historische Dokumente (Specs, Visual-QA-Berichte, das Dossier-Generat vom 28.08.2026) bleiben
  unverändert. Die Entscheidungsnotizen vom 26.08. (Anhang N) und 19.09. (§5.3) tragen je einen
  Nachtrag.
