# LFH-481 I-c Water-Rescue Formations Design

> Design-Spec · 27. August 2026 · LFH-481, Parent LFH-419
>
> Status: ausführungsbereit. Der Auftrag verlangt ein PR-Ergebnis im Automode; diese Spec hält
> die vor der Implementierung verifizierte technische Grenze fest.

## 1. Ziel und Ergebnis

LFH-481 nimmt genau vier Wasserrettungsformationen aus Anhang I in den Kompositionskatalog auf:

| Abschnitt | Titel | Referenzdatei |
|---|---|---|
| I.1.1 | Wasserrettungstrupp | `I.1.1_Wasserrettungstrupp.svg` |
| I.1.2 | Wasserrettungsgruppe | `I.1.2_Wasserrettungsgruppe.svg` |
| I.1.3 | Wasserrettungszug | `I.1.3_Wasserrettungszug.svg` |
| I.1.4 | Wasserrettungsverband | `I.1.4_Wasserrettungsverband.svg` |

Das Ergebnis ist ein Draft-PR mit vier literalen Rezepten, vermessenen Kopf- und Körpermarken,
technischer Gate-Evidenz und einem Kontaktbogen, der ausschließlich generierte Katalogausgaben
zeigt. Die lokalen Originalreferenzen bleiben ignoriert und werden weder eingecheckt noch im
PR-Bild veröffentlicht.

Der Slice erteilt keine fachliche, normative oder organisatorische Freigabe. Alle vier
Domain-Reviews bleiben `pending`.

## 2. Scope und Abgrenzung

Im Scope sind ausschließlich:

- I.1.1 bis I.1.4 als `primary`-Rezepte;
- die vorhandenen Stärkegrade `trupp`, `gruppe` und `zug` unverändert;
- eine geometrisch benannte technische Kopfmarke `single-vertical-bar` für I.1.4;
- eine separat vermessene technische Körpermarke `formation-two-waves-diamond`;
- vier Manifest- und vier Domain-Review-Zeilen;
- direkte und Mehrgrößen-Snapshots, Entscheidungsnotiz und Visual-QA-Protokoll;
- ein output-only Kontaktbogen aus den vier generierten Zeichen.

Nicht im Scope sind:

- I.1.5 und alle weiteren Abschnitte des Anhangs I;
- Führungseinheiten, Bootstrupp oder Wasserfahrzeuge;
- eine neue Organisation oder eine Zuordnung zu `hilfsorganisation`;
- ein fünfter `StrengthId` namens `verband`;
- ein Backfill ähnlicher Einzel- oder Doppelbalken aus C, E oder F;
- Änderungen an der Standardbox oder der kompakten I-g-Formationsfassung von
  `capability.water-rescue`;
- eine Zusammenziehung des Manifestumfangs auf `I` oder `I.1`;
- Original-SVGs, Originalpfade oder Referenz/Katalog-Paarbilder im Repository oder PR.

## 3. Vermessene Verträge

Alle vier Referenzen verwenden eine 32 × 32-mm-Grundfläche und denselben Formationskörper mit
Füllhülle `x = 1…31 mm`, `y = 6…26 mm`.

Die drei vorhandenen Kreis-Köpfe treffen die Quellen bereits exakt:

| Rezept | Stärke | absolute Marken |
|---|---|---|
| I.1.1 | `trupp` | Kreis `(16|3,5)`, `r = 1,5 mm` |
| I.1.2 | `gruppe` | Kreise `(11|3,5)` und `(21|3,5)`, `r = 1,5 mm` |
| I.1.3 | `zug` | Kreise `(11|3,5)`, `(16|3,5)`, `(21|3,5)`, `r = 1,5 mm` |

I.1.4 trägt stattdessen einen schwarzen Balken `x = 15,25 mm`, `y = 1 mm`, Breite `1,5 mm`,
Höhe `4 mm`. Die Geometrie ist belegt; ihre Wiederverwendung als globaler Stärkegrad ist es
nicht. Ähnliche Einzel- und Doppelbalken kommen in anderen Kapiteln mit anderer Bedeutung vor.

Die gemeinsame Wasserrettungsmarke ist eine eigene Formationsfassung:

- obere Welle ungefähr in `x = 12…20 mm`, `y = 10,25…11,75 mm`;
- untere Welle ungefähr in `x = 12…20 mm`, `y = 12,25…13,75 mm`;
- Raute auf der 0,5-mm-Mittellinie `(16|15) → (20|19) → (16|23) → (12|19) → close`;
- gesamte sichtbare Tinte ungefähr in `x = 11,646…20,354 mm`, `y = 10,25…23,354 mm`.

Der vorhandene Body-Fingerprint prüft nur den Körper. Kopf und Innenmarke werden deshalb durch
literale Geometrietests und beide Snapshot-Ebenen gebunden.

## 4. Architektur

### 4.1 Technische Kopfmarke

`packages/schema/src/taxonomy.ts` führt eine geschlossene ID-Menge mit genau
`single-vertical-bar`. `SymbolSpec.technicalHeadMark` ist optional und geometrisch benannt.

`packages/schema/src/head.ts` erhält eine primitive Kopfgestalt aus relativen Primitiven und
Höhe. `packages/catalog/src/technical-head-marks.ts` löst die ID total auf und liefert den Balken
relativ zur Kopfoberkante bei `y = 0…4 mm`.

`compose()` behandelt Stärke- und technische Kopfmarke als zwei Quellen derselben belegten
Kopfzone. Das vorhandene Formationsprofil setzt eine 4-mm-Zone automatisch auf `top = 1 mm`; der
Körper bleibt bei `y = 6 mm`. Es gibt keinen Rückfall auf eine Stärke oder andere Kopfmarke.

`validateSpec()` erlaubt die technische Kopfmarke nur an einer normalen Formation ohne
`strength`, `administrativeLevel` oder `functionRole`. Unbekannte IDs, andere Körperarten,
Körpervarianten und Doppelbelegung werden fail-closed abgelehnt.

### 4.2 Wasserrettungs-Körpermarke

`packages/catalog/src/body-marks.ts` registriert `formation-two-waves-diamond` als neutrale
technische Marke in der normalen Formationsfassung. Sie wird nicht aus der 24 × 16-mm-Standardbox
skaliert. Die auf `main` bereits vorhandene kompakte I-g-Formationsfassung von `water-rescue`
bleibt eine getrennte, unabhängig vermessene Geometrie.

Jede andere Art oder Körpervariante bleibt unzulässig. Der bestehende Fehlervertrag für nicht
vermessene Body-Mark-Kombinationen bleibt erhalten.

### 4.3 Rezepte, Manifest und Reviews

`packages/catalog/src/recipes-anhang-i.ts` ergänzt:

```ts
{
  'I.1.1': { spec: { kind: 'formation', strength: 'trupp', bodyMarks: ['formation-two-waves-diamond'] } },
  'I.1.2': { spec: { kind: 'formation', strength: 'gruppe', bodyMarks: ['formation-two-waves-diamond'] } },
  'I.1.3': { spec: { kind: 'formation', strength: 'zug', bodyMarks: ['formation-two-waves-diamond'] } },
  'I.1.4': {
    spec: {
      kind: 'formation',
      technicalHeadMark: 'single-vertical-bar',
      bodyMarks: ['formation-two-waves-diamond'],
    },
  },
}
```

Kein Rezept führt `organization`. Das neutrale Zeichen bleibt damit eine technische Darstellung
ohne erfundene Trägersemantik.

Der Scope wächst ausschließlich um die vier Einzelabschnitte. Die technischen Reviews werden
erst nach grünen Gates freigegeben; die korrespondierenden Domain-Reviews bleiben `pending`.

## 5. Erwartete mechanische Deltas

| Größe | integrierte `origin/main`-Basis | LFH-481 |
|---|---:|---:|
| Rezepte | 211 | 215 |
| Renderfälle | 489 | 493 |
| direkte SVG-Snapshots | 225 | 229 |
| Mehrgrößen-Snapshots | 490 | 494 |
| Manifestzeilen | 508 | 512 |
| offene Reviews gesamt | 522 | 526 |
| Elementzeilen | 283 | 283 |

## 6. Test- und Visualstrategie

Die Umsetzung folgt strikt RED → GREEN:

1. technische Kopfmarke, Konflikte und absolute Komposition;
2. Wasserrettungs-Body-Mark-Geometrie und Kontextgrenze;
3. exakte vierteilige Rezeptmatrix ohne Organisation;
4. Manifest-, Review- und Zählinvarianten;
5. direkte und Mehrgrößen-Snapshots;
6. Typecheck, vollständige Vitest-Suite, Coverage und `git diff --check`.

Der private Originalvergleich umfasst alle vier Paare in Originalauflösung. Ein separater,
veröffentlichbarer Kontaktbogen zeigt nur die vier aktuellen Katalogausgaben mit Abschnitt und
Titel. Das Visual-QA-Protokoll dokumentiert die lokalen Eingabehashes und den Outputhash, aber
keine lokalen Pfade oder Originalbytes.

## 7. Abnahmekriterien

LFH-481 ist als DEV-Ergebnis fertig, wenn:

1. genau I.1.1 bis I.1.4 und keine weitere I.1-Darstellung hinzugekommen sind;
2. Kopf- und Wasserrettungsmarken literal vermessen und fail-closed gebunden sind;
3. kein Rezept eine Organisationssemantik trägt;
4. Manifest, Snapshots, Kontaktbogen und globale Gates grün sind;
5. ein frischer Subagent den gesamten Branchdiff ohne offenen technischen Befund reviewt hat;
6. ein Draft-PR die Gate-Evidenz, fachlich offenen Grenzen und den output-only Kontaktbogen zeigt;
7. ClickUp den PR und die Evidenz unter LFH-481 dokumentiert, während LFH-419 offen bleibt.
