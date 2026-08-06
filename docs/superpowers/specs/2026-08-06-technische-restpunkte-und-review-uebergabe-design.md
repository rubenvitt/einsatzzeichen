# Einsatzzeichen — Technische Restpunkte und Review-Übergabe

> Design-Spec · 6. August 2026 · Status: freigegeben

## 1. Anlass und Grenze

Die Gate-Härtung vor D.1 hat drei Restpunkte sichtbar gelassen:

1. `releaseBlockers()` meldet 13 Elemente ohne Testnachweis, obwohl für sie jeweils passende
   Tests existieren. Ursache ist das zu enge Boolean-Paar `fingerprintTest`/`snapshotTest`.
2. Das Piktogramm-Clipping ist nur für ein achsparalleles Rechteck als Körperfläche belegt.
3. 24 Manifest-Einträge, zwölf Quellen und das Profil `bund` besitzen kein fachliches Review.

Die ersten beiden Punkte sind technische Arbeit. Der dritte ist nur teilweise automatisierbar:
Die Projektspec verlangt für `domain: approved` eine Person mit einsatztaktischer Fachkunde. Code
kann die Prüfung vorbereiten, einzeln zurechenbar machen und validieren, aber keine Fachkunde oder
Revieweridentität erfinden.

## 2. Typisierte Testevidenz statt universeller Booleans

`CoverageEntry` erhält eine Liste tatsächlich anwendbarer Nachweisarten:

```ts
type TestEvidenceKind =
  | 'body-fingerprint'
  | 'svg-snapshot'
  | 'reference-fill'
  | 'head-shape-regression'
  | 'pictogram-contract';

interface CoverageEntry {
  // bestehende Metadaten
  testEvidence: readonly TestEvidenceKind[];
}
```

Die Pflichtmengen werden nicht vom Eintrag selbst erfunden, sondern aus seiner Art und dem
aufgelösten Elementtyp abgeleitet:

| Eintragsart | Pflichtnachweise |
|---|---|
| Katalogeintrag oder Rezept | `body-fingerprint`, `svg-snapshot` |
| Organisation | `reference-fill` |
| Stärkegrad | `head-shape-regression` |
| Piktogramm | `svg-snapshot`, `pictogram-contract` |

Das Coverage-Gate meldet fehlende, unbekannte, doppelte und für die Eintragsart unzulässige
Nachweise. Zusätzlich werden die Claims per Set-Gleichheit an die tatsächlich iterierten
Testfallmengen gebunden. Damit fällt die Zahl der technischen Nachweislücken nur dann auf null,
wenn die vorhandenen Tests den gesamten behaupteten Bestand wirklich ablaufen.

Globale Mehrgrößen-, Kontrast-, Metadaten- und viewBox-Gates werden nicht als Eigenschaft eines
einzelnen Elements ausgegeben. Das erhält die bereits dokumentierte Trennung zwischen lokaler und
globaler Evidenz.

## 3. Exakte Flächenmodelle für aktuelle Körper

`checkClipping()` prüft weiterhin die vier Ecken der deklarierten achsparallelen
`PictogramBox`, nun aber gegen jede heute katalogisierte konvexe Körperfläche:

- Rechteck, einschließlich Rotation durch inverse Punkttransformation;
- Kreis über den Abstand zum Mittelpunkt;
- geschlossenes konvexes Polygon über normierte Kanten-Halbräume.

Damit sind `formation`, `container`, `person`, `post`, `building`, `measure`, `hazard` und
`point` technisch vermessen. Polygone werden nicht aufgrund ihrer achsparallelen Hülle
freigegeben: Offenheit, Entartung, Konkavität oder Selbstüberschneidung erzeugen weiterhin einen
`BodyNotMeasuredError`; mehrfach besuchte Polygonpunkte verhindern auch einen doppelten Umlauf.
Dasselbe gilt für Linien, Pfade, Gruppen, gerundete Rechtecke und Blatt-Translationen, für die
kein belegtes Flächenmodell existiert.

Vor jeder Box- oder Clippingrechnung müssen Boxkoordinaten und -maße endlich sowie Breite und Höhe
nichtnegativ sein. Transformationen direkt an Pfad-Primitiven werden abgelehnt: Das Box-Gate liest
deren geschriebene Kontroll- und Endpunkte und dürfte ohne vollständige transformierte
Pfadgeometrie keine Aussage über das gerenderte Ergebnis treffen.

Die Prüfung beweist die deklarierte Box im unverschobenen Basiskörper. Sie behauptet nicht, dass
jedes reale Piktogramm mit jedem Grundzeichen fachlich zulässig ist. Insbesondere verkleinert eine
Kopfzone den Personenkörper; ein späterer allgemeiner Kompositionsnachweis braucht dafür eine
Zulässigkeitsmatrix und muss gegen `placedBody` prüfen. Ebenso bleibt die halbe sichtbare
Strichstärke außerhalb des heutigen `PictogramBox`-Vertrags.

## 4. Fachreview und Quellenstatus

Die 24 Manifestreviews bleiben `pending`, bis ein benannter Fachreviewer sie gegen das
Hauptdokument geprüft hat. Ein Übergabedossier listet pro Eintrag Referenzabschnitt,
Referenzasset, vorhandene technische Evidenz und die fachlichen Prüfkriterien. Quellen- und
Profilreviews werden ebenfalls sichtbar ausgewiesen; sie dürfen nicht hinter der Manifestzahl
verschwinden.

Ein eigenes Ledger hält genau ein `domain`-Reviewobjekt je Manifest-, Quellen- und Profilträger.
Seine Schlüsselmengen sind per Test exakt an die drei Register gebunden; so kann eine echte
Freigabe einzeln eingetragen werden, ohne durch eine gemeinsam referenzierte Sammelstruktur
weitere Einträge mitzufreigeben. Das Review-Gate verlangt für `approved` und `deviation` einen
nichtleeren Reviewer und ein kalendarisch gültiges ISO-Datum. `domain: approved` braucht
zusätzlich eine Befundnotiz oder einen Protokollverweis; `deviation` braucht eine konkrete
Begründung.

Der Quellenstatus wird korrigiert: Die BABZ-Seite ist die Projektquelle für die interne
Coverage-Baseline, aber keine Behauptung amtlicher Geltung. Laut offizieller BABZ-Seite hob der
AFKzV am 13./14. März 2025 den Beschluss zur vorläufigen Anwendung auf; das Dokument wird als
Diskussionsgrundlage beschrieben und der Download des Hauptdokuments ist vorübergehend
deaktiviert. Die Quellen-URL zeigt deshalb auf die aktuelle Kategorieseite statt auf einen
Dateilink, der tatsächlich ein Begleitdokument ausliefert.

## 5. Erfolgskriterien

1. Kein Manifest-Eintrag verwendet noch die universellen Test-Booleans.
2. Jede behauptete Evidenzart ist erlaubt, vollständig und an eine exhaustive Testfallmenge
   gebunden; `withoutTestEvidence` ist für den aktuellen Bestand leer.
3. Eine zentrale Box besteht das Clipping-Gate gegen alle acht aktuellen Grundkörper; gezielte
   Boxen außerhalb von Kreis, gedrehtem Quadrat oder Polygon werden abgelehnt.
4. Nicht exakt unterstützte Flächen werden weiterhin explizit abgelehnt.
5. Die BABZ-Quelle und Vision unterscheiden projektinterne Baseline von amtlicher Geltung.
6. Ein vollständiges Review-Übergabedossier existiert; keine fachliche Freigabe wird erfunden.
7. Manifest-, Quellen- und Profilreviews erscheinen getrennt und als Gesamtsumme in der
   Coverage-Ausgabe; alle 37 Reviewträger besitzen einzelne Ledgerobjekte.
8. Gesamttests, Typecheck, Coverage und `git diff --check` sind grün.
