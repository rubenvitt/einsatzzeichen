# Vision-Lücken und die Reihenfolge der Slices

> Entscheidungsnotiz · 5. August 2026

## Zweck dieses Dokuments

`Vision.md` beschreibt das Zielsystem, die Slice-1-Spec das erste Fundament. Zwischen beiden liegt
eine Lücke, die niemand aus den Dateien allein ablesen kann: Welche Vision-Anforderungen sind
bewusst aufgeschoben und welche haben **überhaupt keinen Owner** in der Projektzerlegung A–F?

Diese Notiz hält die Lückenanalyse fest, aus der die Reihenfolge der Slices folgt — und begründet,
warum Slice 2 die Provenienzformen umbaut und nicht den Katalog erweitert. Ohne sie wäre die
Slice-2-Spec eine Entscheidung ohne erkennbaren Grund.

Alle Codeaussagen sind am 5. August 2026 am Code verifiziert, nicht aus Prosa abgeleitet. Das
Vokabular ist das der Notiz vom 4. August: **Typ existiert / Konsument existiert / Gate existiert**
sind drei verschiedene Befunde.

## Klasse 1 — bewusst aufgeschoben, mit Owner

Diese Punkte sind in der Slice-1-Spec (Abschnitt 1, Projektzerlegung) oder im Umsetzungsplan
benannt. Sie sind keine Befunde.

| Fehlt | Owner |
|---|---|
| `react`, `web-component`, `maplibre`, `qgis` — vier der neun Vision-Pakete | E |
| Dokumentationswebsite mit den sechs Einstiegen | F |
| Kapitel 4/5 und Anhänge C–N: drei von 411 Anhangszeichen umgesetzt | D |
| Coverage-Achsen Regelabdeckung und generative Reichweite | D |
| Sechs fehlende Grundzeichen, `1.13`-Gate, `hilfsorganisation`-Farbe, Kopfmarken für Verwaltungsstufen und Fahrzeugkategorien, Kreiskörperprofil | D, begründet in der Notiz vom 4. August |

## Klasse 2 — in der Vision, ohne Owner in A–F

### 1. Wer zeichnet die über 400 Piktogramme

Die Slice-1-Spec hält in Abschnitt 13 selbst fest: Dies, nicht der Code, ist das Gate für 1.0. Eine
Antwort steht aus. Jeder andere Punkt dieser Liste ist dagegen billig.

### 2. Kein Quellenregister

`Vision.md` fordert unter Governance je Quelle sechs Angaben. Im Code: `SourceId` ist eine
geschlossene Vier-Wert-Union ohne Metadatenstruktur (`packages/schema/src/provenance.ts:4`), es
gibt kein Registermodul. Die Vision-Referenzstufen 3 und 4 — FwDV 100, FwDV/DV 800,
THW-Einzelblätter, DIN 14033 / 13050 / 14034-6 / 14095 — haben keinen Slot.

Die Slice-1-Spec erklärt Teilprojekt A („Quellen- und Lizenzinventar") für abgedeckt, inventarisiert
in Abschnitt 2 aber ausschließlich die 661 SVG-Dateien. **A ist nicht erledigt.**

### 3. Profile ohne Identität

Vision-Kriterium 8, das Nicht-Ziel „lokale Varianten ohne explizites Profil" und die
Governance-Forderung nach getrennter Versionierung verlangen ein Profilkonzept. Im Code existieren
`SourceStatus = 'organization-specific'` und `SourceId = 'org-profile'` — ein Flag ohne Profilname,
ohne Layering-Semantik. `CoverageManifest.baseline` ist das Literal `'bbk-babz-2025'`, daneben
steht kein Versionsfeld. Beide Werte haben **keinen Konsumenten**: der einzige Treffer im
Repository ist ihre eigene Deklaration.

### 4. Legacy-Migration

`legacyIds?` (`provenance.ts:39`) ist der einzige Treffer im gesamten Code: Typ existiert, kein
Inhalt, kein Konsument, keine Auflösungsfunktion, keine Modellierung der von der Vision geforderten
„begründeten Mehrdeutigkeit". Kein Teilprojekt A–F besitzt diesen Punkt; D ist „Kapitel und
Anhänge", und Legacy ist das nicht.

### 5. Kapitel 3 fehlt vollständig

Vision-Kriterium 1 nennt die Ergänzungseigenschaften ausdrücklich. Die Slice-1-Spec skizziert in
Abschnitt 6 noch `properties?: PropertyId[]`; im implementierten `SymbolSpec`
(`packages/schema/src/taxonomy.ts:54`) fehlt das Feld, `PropertyId` existiert nirgends, und `'3'`
ist aus dem Manifest-Scope bewusst gestrichen. Kein Typ, kein Konsument, kein Gate.

### 6. Zustände, Tendenzen, Zeitangaben, Gefahren- und Schadendarstellung

Vision-Kriterium 2 und Kapitel 5.8 der Referenz: kein Typ. Dazu gehört die **fehlende Fußzone** —
`designation` ist im Typ und wird validiert (`packages/core/src/validate.ts:44`, nicht leer), aber
von keinem Renderer ausgegeben; `role: 'foot'` ist im IR deklariert und ungenutzt.

### 7. Vier Gates der Vision-Teststrategie

- **Mehrgrößen-Regression 16…256:** `packages/catalog/src/snapshots.test.ts` rendert
  ausschließlich `size: 64`.
- **Druck in Schwarz-Weiß und mit Farbspektren:** Es gibt kein Theme- oder Druckprofil. `PALETTE`
  ist ein flaches Token-zu-Hex-Mapping, `SvgOptions` kennt nur `size` und `idPrefix`. Die
  Vision-API-Skizze `toSvg({ theme })` hat keine Entsprechung.
- **Abgeschnittene Geometrien und uneinheitliche viewBoxes:** keine Prüfung, obwohl 13 abweichende
  viewBox-Formate bekannt sind. Mit `boundsOfMm` gegen `viewBox` billig zu bauen.
- **A11y-Kontrast und nicht-farbliche Unterscheidbarkeit:** `<title>`, `<desc>`, `role="img"` und
  `aria-hidden` werden korrekt ausgegeben (`packages/core/src/render/svg.ts:160-170`) — geprüft
  wird nichts davon, und `Drawing.description` hat im Katalog keinen Produzenten.

### 8. Abgleich mit den beiden Open-Source-Projekten

Vision, „Strategische Positionierung": Import- und Migrationsadapter für die Bezeichner von
`phjardas/taktische-zeichen` und `jonas-koeritz/Taktische-Zeichen`, visuelle Vergleichstests,
dokumentierte Lizenz- und Herkunftsprüfung. Kommt in der Slice-1-Spec nicht vor.

## Klasse 3 — `Vision.md` ist veraltet

Diese Punkte gehören korrigiert, nicht umgesetzt. Eine Überarbeitung von `Vision.md` ist eine
eigene Aufgabe; bis dahin gilt bei Widerspruch die jeweilige Slice-Spec.

| In `Vision.md` | Tatsächlich |
|---|---|
| Pakete `@taktik/*`, neun Stück | `@einsatzzeichen/*`, vier Stück |
| „Referenztests gegen die BABZ-SVG-Dateien" als CI-Punkt | Unmöglich — die Assets werden nie eingecheckt; gelöst über abgeleitete Kennzahlen |
| Eindimensionale Coverage-Messung | Drei Achsen (Slice-1-Spec, Abschnitt 7) |
| Implizit vollständige Geometrietreue | Hybride Treue-Entscheidung (Slice-1-Spec, Abschnitt 9) |
| `SourceReference` ohne Variantenfeld | Durch `Depiction` ersetzt |
| `symbol.toSvg({ theme: "operational" })` | `compose(spec)` und `renderSvg(drawing)`; kein Theme |

## Die Reihenfolge folgt aus den Kosten des Aufschiebens

Nicht aus Wichtigkeit — Wichtigkeit würde die Piktogramme zuerst nennen und dort auf eine
unbeantwortete Frage laufen.

1. **Schemaformen zuerst.** Quellenregister, Profil-Identität, zwei Reviewrollen, Versionierung,
   dritte Abdeckungsart. Diese Änderungen fassen die Struktur *jedes* Eintrags an: bei elf
   Einträgen Stunden, bei sechshundert ein Migrationslauf mit fachlicher Nachprüfung. → **Slice 2.**
2. **Gate-Härtung.** Zu jedem Zeitpunkt gleich billig, fängt Fehler aber *während* des
   Katalogausbaus — also davor sinnvoll.
3. **Inhalt.** Jetzt und später gleich teuer, braucht aber vorher eine Antwort auf Punkt 1 der
   Klasse 2.
4. **Ausgabekanäle.** Hängen nur an `core`, jederzeit und unabhängig machbar.

Legacy-Migration (Klasse 2, Punkt 4) ist in dieser Reihenfolge nicht enthalten: Sie hängt an keiner
anderen Aufgabe und kann jederzeit dazwischen liegen. Sie bekommt einen Owner, sobald sie ein
Slice wird — bis dahin ist `skk-2010` ab Slice 2 wenigstens eine registrierte Quelle.
