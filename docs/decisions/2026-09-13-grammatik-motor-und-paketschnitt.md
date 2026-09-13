# Grammatik-Motor und Paketschnitt: das Produkt ist eine Grammatik, kein Katalog

> Stand: 13. September 2026
> Status: Scope-Entscheidung des Eigentümers; Umsetzung in drei ClickUp-Initiativen
> (Liste „Einsatzzeichen", `901525048064`)

## Entscheidung

Wer die Bibliothek nutzt, beschreibt ein Zeichen und bekommt es gerendert — für **jede
Kombination, die die Systematik zulässt**, nicht nur für die Kombinationen, die ein lokal
vermessenes Original belegen. Der Kompositionsmotor bekommt dafür die Layout-Grammatik der
Systematik. Die heutigen Kataloge (Rezepte, Coverage-Manifest, Domain-Reviews, Fingerprints,
Referenzinventar) sind **Quelle und Prüfmittel**, nicht Teil des Produkts.

Die Entscheidung fiel zwischen drei Ansätzen:

1. **Grammatik-Motor** (gewählt): regelbasierte Komposition aller gültigen Kombinationen aus
   atomaren Bausteinen; Originale als Fixtures; Herkunft je Kombination.
2. Vermessene Bausteine mit generischer Platzierung: fail-closed bleibt, neue Dimensionen nur, wo
   Originale sie belegen.
3. Fassade über dem Katalog: nur API und Paketschnitt, keine neue Kombinatorik.

Ansatz 2 und 3 erreichen das Ziel „alle Kombinationen" nicht. Ansatz 1 ist der größte Umbau,
trifft aber die Produktvision: ein kombinatorischer Generator, kein Bestand fertiger Zeichen.

## Begriffe

| Begriff | Bedeutung |
|---|---|
| **Baustein** | Atomare Geometrie ohne Kombinationsbezug: Grundzeichen, Farbe, Stärke, Verband, Verwaltungsstufe, Fahrwerk, Fähigkeit, Funktionsfassung, Zustand, Tendenz, Pfeil, Linie. |
| **Zone** | Der Ort, an dem ein Baustein auf einer Körperform sitzt: Körper, Kopf, Fahrwerk, Innenfeld, Fuß, Randlagen für Zustand und Tendenz, Beschriftungszonen. Als Daten je Körperform, nicht als Code je Zeichen. |
| **Regel** | Welche Bausteine zusammen dürfen, mit stabiler Regel-ID und erklärbarer Ablehnung. |
| **Herkunft** | `verbatim`, wenn zur Kombination ein Original existiert und der Vergleich besteht; sonst `derived`. Beide Werte kennt die Vision bereits als `SourceStatus`. |
| **Fixture** | Ein Original (oder ein heutiges Rezept) als Testfall der Grammatik. Kein Produktbestandteil. |

Die 242 heutigen Rezepte wechseln damit ihre Rolle: von „fertigen Zeichen" zu Fixtures, die den
Motor belegen. Je Zeichen gemessene Sonderwerte (etwa die einzeln gemessenen Schriftgrade des
mittigen Laufs in Anhang E) werden entweder zur Regel oder bleiben als **benannte Ausnahme**
sichtbar — nie als stiller Sonderpfad.

## Paketschnitt

```
heute:   cli → catalog → core → schema        Kanäle → core
morgen:  cli → conformance → core → schema    Kanäle → core
```

- **`core` ist das Produkt.** Es nimmt Bausteine, Zonen und Regeln auf und enthält alles, um jedes
  Zeichen zu bauen. Es bleibt ohne Fremd- und Node-Abhängigkeit und browsertauglich; die
  Schriftbehandlung verlässt den Produktpfad.
- **`conformance` ist das Prüfpaket** (Umbenennung von `catalog`): Rezepte, Coverage-Manifest,
  Domain-Reviews, Fingerprints, Referenzinventar, Fachreview-Werkzeug, Coverage- und Regel-Gates.
  Für die Nutzung nicht erforderlich; Publish-Umfang entsprechend.
- Die vier Ausgabekanäle `react`, `web-component`, `maplibre`, `qgis` bleiben unverändert an
  `core`.
- Das Maß der Abdeckung wechselt von Zeichenabdeckung zu **Regelabdeckung**: nicht „wie viele der
  661 Originale sind gebaut", sondern „welche Regeln der Systematik sind belegt".

## Drei Initiativen

**A — Zeichen-Grammatik.** Zonenmodell je Körperform als Daten; Regelwerk der Systematik als Daten
mit Regel-IDs; Bausteinregister ohne Kombinationsbezug (inklusive aller sechs Verwaltungsstufen
und der Verbände aus 5.5); Zustände, Tendenzen, Aktivität, Schadensgrade, Brandphasen und Wetter
aus Kapitel 5.8 als kombinierbare Bausteine; Bewegung und Maßnahmen aus 5.2 sowie Linien und
Grenzen aus Kapitel 2 mit Richtung und Länge; Mehrfachfähigkeiten und Sonderformen (3.6–3.9);
Herkunft je Kombination; Originale und Rezepte als Fixtures.

**B — Paketschnitt.** Bausteine und Regeln nach `core`; `conformance` als Prüfpaket; CLI-Befehle
zuordnen; Website-Snapshot, Explorer und Baukasten umstellen; Repository-Gate auf die neue
Richtung; Größen-Gate und Browser-Smoke-Test für `core`; README, Paketdoku und Vision nachziehen.

**C — Zugängliche API.** `SymbolSpec` auf alle Dimensionen erweitern und als kanonische,
serialisierbare Beschreibung festschreiben; Vokabular-Funktionen, die je Stand der Spec die
passenden Werte liefern; erklärbare Ablehnung als API; ein Einstieg von Spec zu Zeichnung ohne
Prüfpaket; Herkunft und Prüfstand abfragbar.

## Reihenfolge

1. Zonenmodell und Regelwerk (Epic A) als Scoping zuerst — sie bestimmen, was in `core` landet.
2. Epic B als mechanischer Umbau.
3. Danach A und C **dimensionsweise gemeinsam**: jede neue Dimension braucht ein Spec-Feld, eine
   Zone und eine Regel, und wird mit ihren Fixtures abgeschlossen.

## Nicht Teil dieser Entscheidung

- Die Spec „Exact Reference Parity" vom 4. September 2026 und der Branch
  `codex/exact-reference-parity`. Ihr Verhältnis zur Grammatik ist eine eigene Entscheidung.
- Die Legacy-Migration aus der SKK-/DV-102-Systematik 2010/2011 (LFH-433).
- Polizei- und Bundeswehrprofile, neue Ausgabekanäle.
- Ein fluent Builder über der Spec-API. Möglich als späterer Zucker, kein Bestandteil.

## Was sich an bestehenden Zusagen ändert

Die fachliche Aussage bleibt unberührt: Ein `derived`-Zeichen behauptet keine fachliche Freigabe,
und ein `verbatim`-Zeichen erbt seinen Domain-Reviewstand weiterhin aus `conformance`. Was sich
ändert, ist die technische Grenze: Der Motor lehnt eine Kombination nur noch ab, wenn eine
**Regel** sie verbietet — nicht mehr, weil kein Original sie belegt.
