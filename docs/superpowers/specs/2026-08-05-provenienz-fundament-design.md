# Einsatzzeichen — Slice 2: Provenienz-Fundament

> Design-Spec · 5. August 2026 · Status: freigegeben

## 1. Zweck und Abgrenzung

Slice 1 hat das Regel- und Kompositionssystem geliefert. Diese Spec schließt die **Formfragen des
Datenmodells**, die `Vision.md` fordert und für die bisher kein Teilprojekt zuständig war:
Quellenregister, Profil-Identität, zwei Reviewrollen, getrennte Versionierung und eine dritte
Abdeckungsart.

**Warum jetzt.** Das Auswahlkriterium ist nicht Wichtigkeit, sondern **Kosten des Aufschiebens**.
Der Katalog trägt heute elf Manifest-Einträge. Jede dieser Formfragen ist eine Änderung an der
Struktur *jedes* Eintrags — bei elf Einträgen kostet sie Stunden, bei sechshundert einen
Migrationslauf mit fachlicher Nachprüfung. Gate-Lücken (Mehrgrößen, Druck, Clipping) sind dagegen
zu jedem Zeitpunkt gleich billig, und Inhalt (die über 400 Piktogramme) ist zu jedem Zeitpunkt
gleich teuer.

**Ziel des Slice:** Kein ausgelieferter Katalogeintrag und keine referenzierte Quelle ohne
vollständige, maschinenlesbare Provenienz — Nutzungsgrundlage, Profilzugehörigkeit, Version und
zwei getrennte Reviewrollen.

**Nicht Teil dieses Slice:** Katalogausbau, Kapitel 3, Fußzone, Ausgabekanäle, Legacy-Migration,
Theme- und Druckprofile, zusätzliche visuelle Gates. Abschnitt 11 grenzt vollständig ab.

### Verhältnis zur Projektzerlegung

Die Spec zu Slice 1 (`2026-08-04-einsatzzeichen-core-slice-design.md`, Abschnitt 1) erklärt
Teilprojekt **A — Quellen- und Lizenzinventar** für abgedeckt. Das trifft nicht zu: Abschnitt 2
jener Spec inventarisiert ausschließlich die 661 SVG-Dateien der BABZ. Die drei weiteren
Referenzstufen der Vision — operative Regelwerke und angrenzende Normen — kommen dort nicht vor.
**Dieser Slice liefert Teilprojekt A tatsächlich nach** und ergänzt Teilprojekt B um die
Provenienzformen, die in Slice 1 offen blieben.

## 2. Ausgangslage im Code

Alle Aussagen dieses Abschnitts sind am Code verifiziert, nicht aus der Slice-1-Prosa abgeleitet.
Das Vokabular ist das der Entscheidungsnotiz vom 4. August 2026: **Typ existiert / Konsument
existiert / Gate existiert** sind drei verschiedene Befunde.

| Befund | Stelle |
|---|---|
| `SourceId` ist eine geschlossene Vier-Wert-Union ohne jede Metadatenstruktur | `packages/schema/src/provenance.ts:4` |
| Kein Quellenregister-Modul in irgendeinem Paket | — |
| `Review` trägt genau einen optionalen `reviewer` | `packages/schema/src/coverage.ts:8-13` |
| Alle elf Manifest-Einträge tragen `review: { status: 'pending' }` — es existiert kein Reviewer | `packages/catalog/src/coverage-manifest.ts:10` |
| `CoverageManifest.baseline` ist das Literal `'bbk-babz-2025'`, kein Versionsfeld daneben | `packages/schema/src/coverage.ts:29-34` |
| `CoverageKind` kennt zwei Werte; Farben, Stärkegrade und Piktogramm haben keinen Eintragsslot | `packages/schema/src/coverage.ts:3` |
| Nur Grundzeichen haben eine stabile ID (`base.${kind}`); Farben, Stärkegrade und Piktogramme sind reine Funktionen ohne ID | `packages/catalog/src/base-symbols.ts:124`, `organizations.ts`, `strengths.ts`, `capabilities.ts` |
| `SourceId = 'org-profile'` und `SourceStatus = 'organization-specific'` haben **keinen Konsumenten** — der einzige Treffer im Repository ist ihre eigene Deklaration | `packages/schema/src/provenance.ts:4`, `:12` |
| Von allen `SourceId`-Werten wird ausschließlich `'babz-svg-2025'` tatsächlich verwendet | `packages/catalog/src/base-symbols.ts:133` |

Der zusammengesetzte Schlüssel `sourceId: \`bbk-babz-2025:${section}\`` in
`coverage-manifest.ts:15` ist ein untypisierter String, in dem eine Quellen-ID als Präfix steckt.
Er bleibt in dieser Form bestehen; die Spec ändert nur, dass das Präfix aus einer registrierten
Quelle stammen muss.

## 3. Quellenregister

`Vision.md` fordert unter „Governance und Lizenzierung" je Quelle sechs Angaben: bibliografische
Angaben und URL, fachlicher Status und Geltungsbereich, Lizenz beziehungsweise Nutzungsgrundlage,
ob Geometrie übernommen, neu konstruiert oder nur verglichen wurde, sowie Reviewer und
Reviewdatum. Genau diese sechs bilden `SourceRecord`, ergänzt um einen Beschaffungsstatus —
sonst ließe sich „nicht beschafft" nicht von „beschafft und ungenutzt" unterscheiden.

```ts
type SourceKind = 'baseline' | 'reference-assets' | 'guidance' | 'legacy' | 'operational-rule' | 'standard';
type Acquisition = 'local' | 'public-url' | 'not-acquired';
type GeometryUse = 'measured-metrics' | 'reconstructed' | 'none';
type LicenceStatus = 'clarified' | 'unclear';

interface Licence {
  /** Nutzungsgrundlage in einem Satz, prüfbar formuliert. */
  basis: string;
  status: LicenceStatus;
  note?: string;
}

interface SourceRecord {
  id: SourceId;
  kind: SourceKind;
  title: string;
  publisher: string;
  /** Auflage oder Ausgabedatum, z. B. "1. Auflage 2011" oder "2017-04". */
  edition?: string;
  url?: string;
  /** Fachlicher Geltungsbereich in einem Satz. */
  scope: string;
  acquisition: Acquisition;
  /** Mehrwertig: aus derselben Quelle können Kennzahlen abgeleitet und Bildideen rekonstruiert werden. */
  geometryUse: readonly GeometryUse[];
  licence: Licence;
  review: ReviewSet;
}
```

`geometryUse` ist eine Liste, weil `babz-svg-2025` beides trägt: aus ihr sind Kennzahlen
abgeleitet (`measured-metrics`, Fingerprint-Gate) **und** eine Bildidee eigenständig neu
konstruiert (`reconstructed`, das Piktogramm 4.3.1, siehe `capabilities.ts`). Ein Einzelwert
würde eine der beiden Nutzungen verschweigen.

`'compared-only'` ist **nicht** Teil von `GeometryUse`: Ein reiner visueller Vergleich findet in
diesem Slice mit keiner Quelle statt. Er entsteht erst, wenn die beiden Open-Source-Korpora
verglichen werden (Vision, „Strategische Positionierung") — dann mit einem Konsumenten. Aus
demselben Grund hat `LicenceStatus` nur zwei Werte.

### Die elf registrierten Quellen

`SourceId` wächst von vier auf elf Literale. Die Tabelle ist normativ: sie ist der Inhalt von
`SOURCE_REGISTRY`.

| `SourceId` | `kind` | Titel | `acquisition` | `geometryUse` | `licence.status` |
|---|---|---|---|---|---|
| `bbk-babz-2025` | `baseline` | Taktische Zeichen im Bevölkerungsschutz — Empfehlungen zur Einführung einer FwDV 102/DV 102 | `public-url` | `none` | `unclear` |
| `babz-svg-2025` | `reference-assets` | Freigestellte SVG-Grafikdateien der enthaltenen Zeichen | `local` | `measured-metrics`, `reconstructed` | `unclear` |
| `babz-hinweise-2024` | `guidance` | Begleitende Hinweise zur Überarbeitung vom 12.02.2024 | `public-url` | `none` | `unclear` |
| `skk-2010` | `legacy` | DLRG DV 102 — Taktische Zeichen im Bevölkerungsschutz, 1. Auflage 2011 (SKK-Empfehlungen 2010) | `public-url` | `none` | `unclear` |
| `fwdv-100` | `operational-rule` | FwDV 100 — Führung und Leitung im Einsatz | `public-url` | `none` | `unclear` |
| `fwdv-800` | `operational-rule` | FwDV/DV 800 — Informations- und Kommunikationstechnik im Einsatz | `public-url` | `none` | `unclear` |
| `thw-einheiten` | `operational-rule` | THW: Einheiten — Einzelblätter | `public-url` | `none` | `unclear` |
| `din-14033` | `standard` | DIN 14033:2017-04 — Kurzzeichen für die Feuerwehr | `not-acquired` | `none` | `clarified` |
| `din-13050` | `standard` | DIN 13050:2021-10 — Begriffe im Rettungswesen | `not-acquired` | `none` | `clarified` |
| `din-14034-6` | `standard` | DIN 14034-6:2024-06 — Graphische Symbole für bauliche Einrichtungen im Feuerwehrwesen | `not-acquired` | `none` | `clarified` |
| `din-14095` | `standard` | DIN 14095:2025-07 — Feuerwehrpläne für bauliche Anlagen | `not-acquired` | `none` | `clarified` |

Die beiden SVG-Ausgaben der BABZ — freigestellt und auf weißer Hintergrundfläche — sind **eine**
Quelle mit zwei Bezugsadressen, kein Quellenpaar: derselbe Zeichenbestand in zwei
Exportvarianten. Die zweite Adresse steht in `licence.note`.

Das ältere freie BABZ-Lernangebot zur SKK-Systematik ist keine eigene Quelle, sondern eine
zweite Fundstelle für `skk-2010`; ebenfalls `note`.

**Warum die DIN-Normen `clarified` tragen und die Dienstvorschriften `unclear`:** Bei einer
kostenpflichtigen Norm ist die Nutzungslage eindeutig — Nutzung setzt Erwerb voraus, und ohne
Erwerb wird nichts übernommen. Das ist geklärt, nicht unklar. Bei den Dienstvorschriften und den
BABZ-Veröffentlichungen sind Weiterverwendung und Ableitung nicht dokumentiert; `unclear` ist
dort die ehrliche Angabe und trägt die Begründung für den Fingerprint-Ansatz.

`babz-svg-2025` trägt damit sichtbar `licence.status: 'unclear'` bei
`geometryUse: ['measured-metrics', …]` — die Begründung dafür, dass Kennzahlen abgeleitet und
keine Dateien eingecheckt werden, ist erstmals maschinenlesbar statt nur in Prosa.

### Typsichere Vollständigkeit ohne Zyklus

`schema` darf nicht von `catalog` abhängen (README, „Pakete"), also kann `SourceId` nicht aus dem
Register abgeleitet werden. Stattdessen dasselbe Muster wie bei `ORGANIZATION_COLORS`:

- `schema` deklariert die elf Literale von `SourceId` und die Struktur `SourceRecord`.
- `catalog` deklariert `SOURCE_REGISTRY` unter `satisfies Record<SourceId, SourceRecord>`.

Der Typ erzwingt damit beide Richtungen: keine deklarierte Quelle ohne Registereintrag, und keine
Referenz auf eine nicht deklarierte Quelle.

## 4. Reviewmodell

`Vision.md` fordert unter Governance „mindestens ein technisches und ein fachliches Review".
Faktisch arbeitet an diesem Repository eine Person. Das Modell löst das nicht durch Aufweichen
der Forderung, sondern dadurch, dass das fehlende Review **sichtbar offen** bleibt.

```ts
type ReviewRole = 'technical' | 'domain';
type ReviewStatus = 'pending' | 'approved' | 'deviation';

interface Review {
  status: ReviewStatus;
  reviewer?: string;
  /** ISO-Datum, z. B. "2026-08-05". */
  date?: string;
  note?: string;
}

/** Beide Rollen sind Pflicht — eine fehlende Rolle ist kein zulässiger Zustand. */
interface ReviewSet {
  technical: Review;
  domain: Review;
}
```

Dieselbe Struktur trägt jeder Katalogeintrag, jeder Manifest-Eintrag, jede Quelle und jedes
Profil. Eine Reviewform für alles, nicht vier ähnliche.

`ReviewRole` selbst wird als Typ deklariert und in der Gate-Ausgabe verwendet (die Fehlermeldung
nennt die Rolle); es ist kein Wert ohne Konsument.

**Kriterium für `technical: approved`** — prüfbar formuliert, damit der Status keine Meinung ist:
Fingerprint- und Snapshot-Gate für diesen Eintrag sind grün. Für die acht Grundzeichen und drei
Rezepte aus Slice 1 ist das der Fall.

**Kriterium für `domain: approved`:** fachliche Prüfung durch eine Person mit einsatztaktischer
Fachkunde gegen das BABZ-Hauptdokument. Diese Prüfung hat nicht stattgefunden. Alle Einträge
tragen `domain: { status: 'pending' }`.

`deviation` bleibt erhalten und bedeutet weiterhin: geprüft, weicht bewusst ab, Begründung in
`note`.

**Was der Typ nicht kann, prüft das Gate:** `approved` ohne `reviewer` **und** `date` ist ein
Fehler. Ein Status ohne Zurechenbarkeit ist wertlos.

## 5. Profile

`Vision.md` verlangt an drei Stellen ein Profilkonzept: Vollständigkeitskriterium 8 („jede
Abweichung, lokale Variante und organisationsspezifische Erweiterung als eigenes Profil"), das
Nicht-Ziel „lokale Varianten ohne explizites Profil in den bundesweiten Kern aufzunehmen" und die
Governance-Forderung, Kern und Profile getrennt zu versionieren.

### Der Kern ist der erste Registereintrag

Ein Profilfeld ohne einen einzigen Nutzer wäre exakt der YAGNI-Befund, den die Entscheidungsnotiz
vom 4. August 2026 in Abschnitt 2 für `adminLevelHead` und `vehicleCategoryMarks` festhält: zwei
Funktionen zu bauen, die nichts aufruft. Die Struktur vermeidet das, indem der **bundesweite Kern
selbst** als Profil registriert wird:

```ts
type ProfileId = 'bund';

interface ProfileRecord {
  id: ProfileId;
  title: string;
  /** Eigene Datenversion, semver. Unabhängig von den npm-Paketversionen. */
  version: string;
  /** Quellen, auf die dieses Profil sich stützt. */
  sources: readonly SourceId[];
  /** Kernversion, gegen die dieses Profil geprüft ist. Beim Kern identisch mit `version`. */
  verifiedAgainstCore: string;
  review: ReviewSet;
}
```

`CatalogEntry.profile: ProfileId` wird **Pflichtfeld**, nicht optional. Damit hat die Struktur von
Beginn an elf Konsumenten statt keinen, die getrennte Versionierung ist real statt vorbereitet,
und die Regel „kein Profileintrag landet unbemerkt im Kern" ist prüfbar — bei einem optionalen
Feld wäre „kein Profil angegeben" von „Kern" nicht unterscheidbar.

Ein zweites Profil ist damit reines Hinzufügen: ein Literal in `ProfileId`, ein Registereintrag,
Einträge mit dem neuen Wert. Kein Umbau bestehender Daten.

### Was der Slice bewusst nicht baut

**Keinen Overlay-Mechanismus.** Ein Profil kann in diesem Slice keine Kerneinträge überschreiben
oder ergänzen. Es gibt heute kein belegtes Profil, gegen das sich eine Auflösungsreihenfolge
prüfen ließe — und eine ungeprüfte Auflösungsreihenfolge ist genau die Art plausibel aussehender
Regel, die dieses Projekt ablehnt.

Das erste in der Vision benannte echte Profil ist das für Feuerwehr- und Objektpläne nach
DIN 14034-6 und DIN 14095. Beide Normen sind nicht beschafft (Abschnitt 3), also entsteht dieses
Profil hier nicht.

### Zwei Bereinigungen

Beide Werte haben nachweislich keinen Konsumenten (Abschnitt 2):

- **`SourceId = 'org-profile'` entfällt.** Es war ein Platzhalter für „irgendein Profil". Mit
  echter Profil-Identität ist ein Profil eine registrierte Quelle mit eigenem Eintrag; heute
  existiert keine solche Quelle, also existiert der Wert nicht.
- **`SourceStatus = 'organization-specific'` entfällt.** Die Profilzugehörigkeit hängt am
  Katalogeintrag (`profile`), nicht am Quellenbezug. Denselben Sachverhalt an zwei Stellen zu
  führen erzeugt die Divergenz, die das Manifest verhindern soll.

`SourceStatus` behält damit `'verbatim' | 'derived' | 'legacy'`. `'legacy'` und die Quellen-ID
`skk-2010` bleiben — nicht als Vorgriff auf die Legacy-Migration, sondern weil SKK 2010 / DLRG
DV 102 im Register eine bibliografisch belegte Quelle ist. Referenziert wird sie von keinem
Eintrag.

## 6. Versionierung

Kern und Profile tragen **eigene Datenversionen**, unabhängig von den npm-Paketversionen:

- `CoverageManifest.coreVersion` — Version des bundesweiten Kernkatalogs, Startwert `'0.1.0'`.
- `ProfileRecord.version` — Version je Profil.
- `ProfileRecord.verifiedAgainstCore` — Kernversion, gegen die das Profil geprüft ist.

Begründung: Ein Profil kann sich ändern, ohne den Kern zu berühren, und umgekehrt. Über
Paketversionen wäre das nur darstellbar, wenn jedes Profil ein eigenes npm-Paket wäre — das
verlangte, Publishing und Paketaufteilung jetzt zu entscheiden, ohne dass ein einziges Profil
existiert, das ein Paket rechtfertigt.

Für das Profil `bund` gilt `verifiedAgainstCore === version === coreVersion`. Das Gate prüft diese
Gleichheit für den Kern und für jedes künftige Profil, dass `verifiedAgainstCore` eine bekannte
Kernversion nennt.

Semver wird als Zeichenkette geführt und beim Einlesen auf die Form `major.minor.patch` geprüft —
`schema` bleibt ohne Laufzeitabhängigkeiten, also keine Semver-Bibliothek.

## 7. Dritte Abdeckungsart und Element-IDs

Die Entscheidungsnotiz vom 4. August 2026 hält in Abschnitt 7 als bekannte Grenze fest: Die
Abdeckung von `'2'` (Organisationsfarben), `'4.3.1'` (Piktogramm) und `'5.4'` (Stärkegrade) steckt
in den jeweiligen Testdateien, nicht in Manifest-Einträgen — weil das eine weitere `CoverageKind`
und damit eine Schemaänderung bräuchte. Diese Änderung findet hier statt.

```ts
type CoverageKind = 'catalog-entry' | 'composition-recipe' | 'element';
```

`'element'` bezeichnet ein Einzelelement, das keine eigene Zeichnung ist, aber eine an der
Referenz belegte Regel trägt: eine Organisationsfarbe, ein Stärkegrad, ein Piktogramm.

### Element-IDs sind neu

Heute hat nur das Grundzeichen eine stabile ID (`base.${kind}`). Organisationsfarben, Stärkegrade
und Piktogramme sind reine Funktionen ohne ID — ein Manifest-Eintrag könnte auf nichts verweisen.
Der Slice führt deshalb ein Namensschema ein, das dem bestehenden `base.`-Präfix folgt:

| Präfix | Beispiele | Quelle der Umsetzung |
|---|---|---|
| `organization.` | `organization.feuerwehr` … (sieben belegte) | `organizations.ts` |
| `strength.` | `strength.trupp`, `strength.staffel`, `strength.gruppe`, `strength.zug` | `strengths.ts` |
| `capability.` | `capability.fire-fighting` | `capabilities.ts` |

`resolveElement(id)` löst eine Element-ID auf und **wirft** bei unbekannter ID — dasselbe Muster
wie `fingerprintFor` (`fingerprint-index.ts:29`) und `organizationColor`
(`organizations.ts`). Erst damit ist ein Manifest-Eintrag mehr als eine Behauptung: Das Gate
prüft, dass jede genannte Element-ID im Katalog existiert.

Die drei Elementarten sind strukturell unvergleichbar — eine Organisationsfarbe ist ein
`ColorToken`, ein Stärkegrad eine `HeadShape`, ein Piktogramm ein `Primitive[]`. `resolveElement`
gibt deshalb **keine Geometrie zurück, sondern einen Deskriptor**:

```ts
type ElementKind = 'organization' | 'strength' | 'capability';

interface ElementDescriptor {
  id: string;                            // "organization.feuerwehr"
  kind: ElementKind;
  title: string;                         // "Feuerwehr"
  /** Alle Referenzdateien, an denen dieses Element belegt ist. Mindestens eine. */
  referenceAssets: readonly string[];
}

/** Wirft, wenn die ID kein bekanntes Element bezeichnet. */
function resolveElement(id: string): ElementDescriptor;
```

Die Liste ist nötig, weil ein Stärkegrad an mehreren Dateien vermessen ist — `staffel` an zwei,
`zug` an vier (Entscheidungsnotiz, Abschnitt 5). Ein Einzelwert wäre eine willkürliche Auswahl aus
gleichwertigen Belegen. Der Manifest-Eintrag behält sein Feld `referenceAsset` als Einzelwert
(bestehende Struktur), und das Gate prüft, dass dieser Wert in `referenceAssets` des Deskriptors
vorkommt — damit kann ein Eintrag keine Datei nennen, die das Element nicht belegt.

Der Deskriptor ist genau das, was das Gate braucht: Existenz, Art und Belegstelle. Wer die
Geometrie will, ruft weiterhin `organizationColor`, `strengthHead` oder `capabilityPictogram` —
`resolveElement` wird kein zweiter Zugriffsweg auf den Katalog und damit keine zweite Wahrheit
über Farben und Kopfzonen.

`hilfsorganisation` bekommt **keinen** Elementeintrag: Kapitel 2 der Referenz enthält dafür keine
Datei, `organizationColor` wirft, und das Manifest behauptet nichts, was der Katalog nicht kann.
Sieben Organisationsfarben, nicht acht. (`2.2_Organisationen.svg` existiert, trägt aber einen
generischen Namen, aus dem keine Zuordnung zu `hilfsorganisation` folgt. Diese Zuordnung zu
vermessen ist eine eigene Aufgabe und nicht Teil dieses Slice.)

### Abschnittsnummern der Elementeinträge

`CoverageEntry.sourceId` behält die Form `"<SourceId>:<Abschnitt>"`, und der Schlüssel bleibt
`entryKey(sourceId, variant)` — Slice-1-Erfolgskriterium 4. Damit braucht jedes Element eine
eigene Abschnittsnummer, sonst kollidierten die vier Stärkegrade auf `5.4`. Alle zwölf Nummern
sind aus den Dateinamen des Referenzbestands belegt, keine ist geschlossen:

| Element-ID | Abschnitt | Namensgebende Referenzdatei |
|---|---|---|
| `organization.feuerwehr` | `2.1` | `2.1_Feuerwehr.svg` |
| `organization.thw` | `2.3` | `2.3_Technisches Hilfswerk.svg` |
| `organization.fuehrung-leitung` | `2.4` | `2.4_Führung Leitung.svg` |
| `organization.polizei` | `2.5` | `2.5_Polizei.svg` |
| `organization.bundeswehr` | `2.6` | `2.6_Bundeswehr.svg` |
| `organization.sonstige-gefahrenabwehr` | `2.7` | `2.7_Sonstige Gefahrenabwehr.svg` |
| `organization.zivile-einheiten` | `2.8` | `2.8_Zivile Einheiten.svg` |
| `strength.trupp` | `5.4.1` | `5.4.1_Trupp.svg` |
| `strength.staffel` | `5.4.2` | `5.4.2_Staffel.svg` |
| `strength.gruppe` | `5.4.3` | `5.4.3_Gruppe.svg` |
| `strength.zug` | `5.4.4` | `5.4.4_Zug.svg` |
| `capability.fire-fighting` | `4.3.1` | `4.3.1_Brandbekämpfung.svg` |

Die Zuordnung der vier Stärkegrade folgt aus den Dateinamen selbst — sie ist damit belegt und
nicht aus der Reihenfolge geschlossen. Für die Stärkegrade enthält `referenceAssets` des
Deskriptors **mehr** als die namensgebende Datei: die `5.4.x`-Dateien sind eigenständige
Anzeigedarstellungen mit `r = 4` und selbst keine Kopfzonen; die Kopfzonengeometrie ist an den
`C.1.x`-Dateien vermessen (Entscheidungsnotiz, Abschnitt 5). Beide Belegarten stehen in der Liste,
und `referenceAsset` des Manifest-Eintrags ist die namensgebende Datei.

**`variant` bleibt Teil des Schlüssels, auch für Elemente.** Es ist kein Füllwert: Kapitel 2
enthält mit `2.14_Escape Route` und `2.14_Escape Route_2` selbst ein Element in zwei
Darstellungen. Für die zwölf heutigen Elemente gilt `primary`.

## 8. Manifest und Gates

```ts
interface CoverageManifest {
  baseline: SourceId;              // statt Literal 'bbk-babz-2025'
  coreVersion: string;
  scope: readonly string[];
  entries: readonly CoverageEntry[];
}

interface CoverageEntry {
  sourceId: string;                // unverändert: "<SourceId>:<Abschnitt>"
  variant: DepictionVariant;
  title: string;
  implementation: string;          // Katalog-, Rezept- oder Element-ID
  referenceAsset: string;
  coverage: CoverageKind;
  profile: ProfileId;
  fingerprintTest: boolean;
  snapshotTest: boolean;
  review: ReviewSet;
}
```

### Welche Quelle das Präfix nennt

Heute baut `coverage-manifest.ts:15` den Schlüssel als `bbk-babz-2025:${section}`, während der
Quellenbezug desselben Katalogeintrags `source: 'babz-svg-2025'` nennt
(`base-symbols.ts:133`). Beide Werte sind registriert und würden die neue Präfixprüfung bestehen —
ohne festgelegte Regel entscheidet der Umsetzungsplan willkürlich, und die zwei Angaben driften
dauerhaft auseinander. Die Regel:

- **Das Manifest-Präfix ist immer die Baseline** (`bbk-babz-2025`). Es bezeichnet die
  **Abschnittsnummerierung**, und die stammt aus dem Hauptdokument — nur dort ist definiert, dass
  `5.4.3` „Gruppe" bedeutet.
- **Die Geometrieprovenienz steht am Katalogeintrag** (`Depiction.sourceRefs`, heute
  `babz-svg-2025`). Sie bezeichnet, woraus die Kennzahlen abgeleitet sind.
- `referenceAsset` nennt eine Datei aus `babz-svg-2025`.

Das Gate prüft deshalb nicht „irgendeine registrierte Quelle", sondern **Gleichheit mit
`COVERAGE_MANIFEST.baseline`** — das ist strenger und trifft die Absicht. Zusätzlich prüft es für
Zeilen mit `coverage: 'catalog-entry'`, dass die `primary`-Darstellung des Katalogeintrags
mindestens einen `sourceRef` auf eine registrierte Quelle trägt. Damit sind beide Angaben geprüft,
ohne fälschlich ihre Gleichheit zu fordern — sie bezeichnen verschiedene Dinge.

### Wo das Profil steht

`profile` steht sowohl an `CatalogEntry` (Abschnitt 5) als an `CoverageEntry`. Das ist keine
doppelte Wahrheit, sondern nötig, weil Rezepte und Elemente **keine** `CatalogEntry`s sind und
ihre Zugehörigkeit sonst nirgends stünde. Die Beziehung wird festgelegt statt offengelassen: Für
Zeilen mit `coverage: 'catalog-entry'` ist der Manifestwert aus dem Katalogeintrag **abgeleitet**,
und das Gate prüft die Gleichheit. Für Rezepte und Elemente ist der Manifestwert die einzige
Angabe.

### Prüfungen

Die vier bestehenden Prüfungen aus `checkCoverage` bleiben unverändert: eindeutige Schlüssel,
kein unvollständiger Eintrag, genau eine `primary`-Darstellung je Katalogeintrag. Neu hinzu:

| Prüfung | Wirkung |
|---|---|
| Das Präfix jedes `sourceId` ist gleich `baseline` | Fehler |
| Jede `primary`-Darstellung eines Katalogeintrags nennt eine registrierte Quelle | Fehler |
| Bei `coverage: 'catalog-entry'` stimmt `profile` mit dem Katalogeintrag überein | Fehler |
| Kein `approved` ohne `reviewer` und `date`, je Rolle | Fehler |
| Jeder Eintrag mit `coverage: 'element'` ist über `resolveElement` auflösbar | Fehler |
| Der `referenceAsset` eines Elementeintrags kommt in dessen `referenceAssets` vor | Fehler |
| Jeder Eintrag trägt ein im Profilregister existierendes Profil | Fehler |
| `verifiedAgainstCore` des Profils nennt eine bekannte Kernversion | Fehler |
| Jede Version hat die Form `major.minor.patch` | Fehler |
| Zahl offener fachlicher Reviews | **nur Ausgabe, kein Fehler** |

Die letzte Zeile ist bewusst kein Fehler. Wäre sie einer, wäre CI ab dem ersten Tag dauerhaft rot
und das Gate damit wertlos — genau die Situation, in der Gates ignoriert werden.

### `releaseBlockers()`

Eine Funktion listet auf, was Release 1.0 nach den Vision-Kriterien noch blockiert:

- Einträge mit `domain.status !== 'approved'` (heute: alle),
- Einträge ohne Fingerprint- oder Snapshot-Nachweis,
- Kapitel im Scope ohne einen einzigen Eintrag.

**Ein ungeklärter Lizenzstatus ist ausdrücklich kein Release-Blocker.** Wäre er einer, wäre
`babz-svg-2025` (`unclear` bei `measured-metrics`) ein dauerhafter Blocker — und das widerspräche
Abschnitt 13, wo derselbe Status als architektonisch behandelt und folgenlos begründet wird. Die
Architektur beantwortet die unklare Lage bereits: abgeleitete Kennzahlen statt Dateien,
eigenständige Geometrie statt übernommener Pfade. Das 1.0-Gate der Vision fragt nach Quellen- und
Reviewstatus, nicht nach gelösten Lizenzfragen.

Damit ist das 1.0-Gate der Vision erstmals ausführbar, ohne scharf zu sein. Es läuft als Test
(Ausgabe ist stabil und prüfbar), nicht als CI-Abbruch.

## 9. Migration der elf Einträge

Alle elf tragen heute `review: { status: 'pending' }` (`coverage-manifest.ts:10`) — es gibt keinen
Reviewer zu erhalten und keine Information zu verlieren. Die Migration setzt:

| Feld | Wert | Begründung |
|---|---|---|
| `review.technical` | `approved`, Reviewer `rv`, Datum der Umsetzung | Fingerprint- und Snapshot-Gate sind für alle elf grün (Slice 1, Erfolgskriterien 1 und 2) |
| `review.domain` | `pending` | Keine fachliche Prüfung hat stattgefunden |
| `profile` | `bund` | Alle elf gehören zum bundesweiten Kern |

Dazu kommen **zwölf neue Elementeinträge**: sieben Organisationsfarben, vier Stärkegrade, ein
Piktogramm. Deren `technical`-Status folgt demselben Kriterium — die Stärkegrade und die Farben
sind an der Referenz vermessen und durch eigene Tests festgenagelt
(Entscheidungsnotiz, Abschnitte 4 und 5), tragen aber **kein** `fingerprintTest: true`: Das
Fingerprint-Gate vergleicht ausschließlich `role: 'body'` und erfasst Kopfmarken nie
(Entscheidungsnotiz, Abschnitt 5). Das Manifest bildet das ab, statt es zu überzeichnen.

Das Manifest wächst damit von 11 auf 23 Einträge. Der Scope bleibt unverändert
`['1', '2', '4.3.1', '5.4', 'C.1.1', 'C.1.2', 'D.3.7']` — aber `'2'`, `'4.3.1'` und `'5.4'` werden
erstmals durch Einträge getragen statt nur durch Zusicherungen in Testdateien.

## 10. Ablage

Kein neues Paket. Die Richtung `cli → catalog → core → schema` und die Trennung „Typen in
`schema`, Daten in `catalog`" bleiben.

| Modul | Inhalt | Status |
|---|---|---|
| `packages/schema/src/sources.ts` | `SourceRecord` und die Werttypen aus Abschnitt 3 | neu |
| `packages/schema/src/profile.ts` | `ProfileId`, `ProfileRecord`, Versionsprüfung | neu |
| `packages/schema/src/review.ts` | `ReviewRole`, `Review`, `ReviewSet` — aus `coverage.ts` herausgelöst | neu |
| `packages/catalog/src/sources.ts` | `SOURCE_REGISTRY`, die elf Quellen | neu |
| `packages/catalog/src/profiles.ts` | `PROFILES` mit `bund`, `profileFor` | neu |
| `packages/catalog/src/elements.ts` | `resolveElement`, Element-IDs | neu |
| `packages/schema/src/provenance.ts` | `SourceId` elf Literale, `profile` an `CatalogEntry`, zwei Werte entfernt | erweitert |
| `packages/schema/src/coverage.ts` | dritte Abdeckungsart, `ReviewSet`, `coreVersion` | erweitert |
| `packages/catalog/src/coverage-manifest.ts` | Migration, neue Prüfungen, `releaseBlockers` | erweitert |
| `packages/cli/src/commands/coverage.ts` | Ausgabe der neuen Prüfungen und der offenen Reviews | erweitert |

`schema` und `core` behalten null Laufzeitabhängigkeiten. `core` wird von diesem Slice nicht
angefasst — Provenienz ist Katalogsache, nicht Renderersache.

## 11. Umfang

**Enthalten:** Quellenregister mit elf Quellen; Reviewset mit zwei Pflichtrollen an Eintrag,
Manifest-Eintrag, Quelle und Profil; Profilregister mit `bund` und `profile` als Pflichtfeld;
eigene Datenversionen für Kern und Profile; dritte Abdeckungsart mit Element-IDs und Auflösung;
neun neue Gate-Prüfungen; `releaseBlockers()`; Migration der elf Einträge und zwölf neue
Elementeinträge; Entfernung von `'org-profile'` und `'organization-specific'`.

**Nicht enthalten:**

- Overlay-Mechanismus für Profile (Abschnitt 5) und jedes zweite Profil
- Legacy-Migration nach SKK 2010: `legacyIds` bleibt ohne Inhalt und ohne Konsument
- Adapter und Vergleichstests gegen `phjardas/taktische-zeichen` und
  `jonas-koeritz/Taktische-Zeichen`
- Die Coverage-Achsen Regelabdeckung und generative Reichweite
- Kapitel 3 (Ergänzungseigenschaften), Zustände, Tendenzen, Zeitangaben, Gefahren- und
  Schadendarstellung
- Die Fußzone: `designation` bleibt validiert und ungerendert, `role: 'foot'` ungenutzt
- Theme- und Druckprofile, Mehrgrößen-Snapshots, Clipping- und viewBox-Prüfung,
  A11y-Kontrastprüfung
- Beschaffung der vier DIN-Normen
- Katalogausbau jeder Art, insbesondere die sechs fehlenden Grundzeichen und das `1.13`-Gate

## 12. Erfolgskriterien

1. Jede in `Vision.md` genannte Quelle hat einen Registereintrag mit Nutzungsgrundlage,
   Geometrieumgang und Beschaffungsstatus; die Vollständigkeit ist über
   `satisfies Record<SourceId, SourceRecord>` typerzwungen.
2. Kein Manifest-Eintrag ohne beide Reviewrollen; kein `approved` ohne Reviewer und Datum, per
   Gate geprüft.
3. Die elf bestehenden Einträge sind migriert, das fachliche Review ist sichtbar offen, und die
   Zahl offener fachlicher Reviews erscheint in der `coverage`-Ausgabe.
4. `profile` ist Pflichtfeld mit elf realen Konsumenten; der Kern trägt eine eigene Datenversion,
   und das Gate prüft ihre Form und Konsistenz.
5. Das Manifest hat 23 Einträge; jede Element-ID ist über `resolveElement` auflösbar, und ein
   Eintrag mit unbekannter ID lässt das Gate fehlschlagen.
6. `'org-profile'` und `'organization-specific'` sind entfernt; kein in diesem Slice eingeführter
   Wert ist ohne Konsument.
7. `releaseBlockers()` gibt die offenen 1.0-Punkte aus und ist durch einen Test belegt.
8. CI läuft vollständig grün auf einem Rechner ohne Referenzbestand; `schema` und `core` haben
   weiterhin null Laufzeitabhängigkeiten.

## 13. Risiken und offene Punkte

**Die Lizenzangaben sind eine Selbsteinschätzung, kein Rechtsgutachten.** `licence.basis` und
`licence.status` halten fest, was aus der Quelle selbst erkennbar ist. Für die BABZ-Assets bleibt
die Lage `unclear`; die Konsequenz — Kennzahlen statt Dateien, eigenständige Geometrie statt
übernommener Pfade — ändert sich dadurch nicht. Sollte die Nutzungsgrundlage geklärt werden, ist
das eine Änderung an einem Registereintrag, nicht an der Architektur.

**Die Profilstruktur ist an einem Profil erprobt, und dieses eine ist der Kern.** Ob die Form für
ein echtes Organisationsprofil trägt, zeigt erst das zweite. Der bewusst gewählte Zuschnitt —
Identität und Version, kein Overlay — hält die Kosten eines Irrtums klein: ein Registereintrag und
ein Literal.

**Das fachliche Review bleibt der eigentliche Engpass.** Nach diesem Slice tragen 23 Einträge
`domain: pending`, und die Struktur macht das sichtbar, statt es zu verdecken. Wer diese Prüfung
durchführt, ist offen — dieselbe offene Frage wie „wer zeichnet die über 400 Piktogramme"
(Slice-1-Spec, Abschnitt 13). Beide Antworten stehen aus, und beide entscheiden über 1.0, nicht
der Code.

**`Vision.md` ist an mehreren Stellen veraltet** und wird von dieser Spec nicht korrigiert: die
Paketnamen `@taktik/*` statt `@einsatzzeichen/*`, „Referenztests gegen die BABZ-SVG-Dateien" als
CI-Punkt (unmöglich, weil die Assets nie eingecheckt werden — gelöst über Fingerprints), die
eindimensionale Coverage-Messung (Slice 1 führt drei Achsen ein), die implizit vollständige
Geometrietreue (Slice 1 entscheidet hybrid) und die API-Skizze `toSvg({ theme })`, für die es
kein Theme gibt. Eine Überarbeitung von `Vision.md` ist eine eigene Aufgabe.

## 14. Nächster Schritt

Umsetzungsplan über das `writing-plans`-Skill erstellen.
