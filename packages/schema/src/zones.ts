import type { SourceReference } from './provenance.js';
import type { BodyVariantId, SymbolKind } from './taxonomy.js';

/**
 * Die Zonen einer Körperform: die Orte, an denen ein Baustein ohne Kombinationsbezug sitzt.
 * Die Begriffsliste stammt aus der Scope-Entscheidung vom 13. September 2026
 * (`docs/decisions/2026-09-13-grammatik-motor-und-paketschnitt.md`, Tabelle „Begriffe"):
 * Körper, Kopf, Fahrwerk, Innenfeld, Fuß, Randlagen für Zustand und Tendenz, Beschriftungszonen.
 *
 * **Die Beschriftungszonen sind hier vollständig aufgezählt und nicht auf vier verkürzt.**
 * `compose()` und `BodyLabels` führen heute neun voneinander getrennt vermessene Läufe; wer nur
 * die vier ältesten nennt, verliert genau die Unterschiede zwischen den Körperformen, die dieses
 * Modell sichtbar machen soll. `topLeftLines` ist dabei **keine** eigene Zone, sondern die
 * zweizeilige Fassung von `label-top-left` (siehe `LayoutProfile.topLeftLines`).
 *
 * `state-margin` und `tendency-margin` sind bewusst aufgeführt, obwohl an ihnen nichts vermessen
 * ist: eine Zone, die im Modell fehlt, ist von einer Zone ohne Messung nicht zu unterscheiden.
 * Die Randlage trägt deshalb eine Lückenbegründung, keine ausgedachte Lage.
 */
export type ZoneId =
  /** Die Hülle des platzierten Körpers. Bezugsrahmen aller übrigen Zonen. */
  | 'body'
  /** Kopfzone oberhalb des Körpers (Stärke, Verband, Verwaltungsstufe). */
  | 'head'
  /** Fahrwerkszone unterhalb der Körperunterkante (Kapitel 5.1). */
  | 'chassis'
  /** Innenfeld bei weißer Innenkontur; zugleich der Platz der Fähigkeitsbox. */
  | 'inner-field'
  /** Fußzone: die Bezeichnung unterhalb des Körpers. */
  | 'foot'
  /** Mittiger Lauf im Körper. */
  | 'label-center'
  /** Unten links im Körper. */
  | 'label-bottom-left'
  /** Unten rechts im Körper. */
  | 'label-bottom-right'
  /** Unten mittig im Körper. */
  | 'label-bottom-center'
  /** Linksbündig im oberen Bereich des Körpers. */
  | 'label-top-left'
  /** Linksbündiger Lauf oberhalb des Körpers. */
  | 'label-above-left'
  /** Rechtsbündiger Lauf unterhalb des Körpers. */
  | 'label-below-right'
  /** Lauf links auf der Ausgabeoberfläche unterhalb des Körpers. */
  | 'label-surface-below-left'
  /** Lauf rechts auf der Ausgabeoberfläche unterhalb des Körpers. */
  | 'label-surface-below-right'
  /** Randlage für einen Zustand aus Kapitel 5.8. */
  | 'state-margin'
  /** Randlage für eine Tendenz aus Kapitel 5.8. */
  | 'tendency-margin';

/** Kante, gegen die die Lage einer Zone gerechnet wird. */
export type ZoneAnchorEdge =
  | 'body-top'
  | 'body-bottom'
  | 'body-left'
  | 'body-right'
  | 'body-center-x'
  /** Oberer Rand der Grundfläche (`DEFAULT_VIEWBOX_MM`). */
  | 'canvas-top'
  /** Die Oberkante der Zone selbst — so verankert die Fahrwerkszone ihre Marken. */
  | 'zone-top';

/** Richtung, in die ein Abstand von seiner Bezugskante aus gerechnet wird. */
export type ZoneDirection = 'up' | 'down' | 'left' | 'right' | 'inward';

/**
 * Hülle in Millimetern. Feldgleich mit `BoundsMm` aus `core/src/bounds.ts` — `schema` ist
 * abhängigkeitsfrei und kann den Typ nicht importieren; die Zuweisbarkeit prüft der Compiler
 * strukturell, sobald `core` ein `measuredBodyBoundsMm` hier einträgt.
 */
export interface ZoneBoundsMm {
  readonly minX: number;
  readonly minY: number;
  readonly maxX: number;
  readonly maxY: number;
}

/**
 * Woher eine Zahl des Zonenmodells stammt.
 *
 * **`definedAt` und `note` sind keine zweite Herkunftsmechanik**, sondern der Fundort im
 * Repository und dessen eigene Herkunftsaussage: Dieses Modell erfindet keine Messung, es zeigt
 * auf die Stelle, an der die Zahl bereits mit ihrer Messherkunft steht.
 *
 * `sourceRefs` ist die vorhandene Mechanik aus `provenance.ts` und wird **nur** gesetzt, wo der
 * Fundort selbst einen Abschnitt der Referenz nennt (`C.1.1`, `D.3.7`, `E.2.15`, `F.1.18`,
 * `G.3.5`, `5.1.1.1` …). Wo profiles.ts oder compose.ts eine Zahl ohne Abschnitt führen, bleibt
 * das Feld leer — ein erfundener Abschnitt wäre schlimmer als gar keiner.
 */
export interface ZoneProvenance {
  /** Fundort der Zahl, Datei und Zeilenbereich, z. B. `core/src/compose.ts:78`. */
  readonly definedAt: string;
  /** Die Herkunftsaussage des Fundorts, von dort übernommen und nicht neu formuliert. */
  readonly note: string;
  /** Nur gesetzt, wo der Fundort einen Abschnitt der Referenz nennt. */
  readonly sourceRefs?: readonly SourceReference[];
}

/**
 * Ein einzelnes Maß einer Zone. Vier Arten, weil nicht jede Lage eine Zahl hat: die Oberkante der
 * Fahrwerkszone ist eine **Regel** gegen die Körperunterkante, kein Abstand mit eigenem Wert.
 * Eine Zone ohne Zahl als `offset: 0` zu führen, würde eine Messung behaupten, die es nicht gibt.
 */
export type ZoneMeasure =
  | {
      readonly kind: 'offset';
      /** Stabile Kennung innerhalb der Zone, ASCII und klein geschrieben. */
      readonly id: string;
      readonly valueMm: number;
      readonly from: ZoneAnchorEdge;
      readonly towards: ZoneDirection;
      readonly provenance: ZoneProvenance;
    }
  | {
      readonly kind: 'size';
      readonly id: string;
      readonly valueMm: number;
      readonly axis: 'width' | 'height';
      readonly provenance: ZoneProvenance;
    }
  | {
      readonly kind: 'bounds';
      readonly id: string;
      readonly boundsMm: ZoneBoundsMm;
      readonly provenance: ZoneProvenance;
    }
  | {
      /** Lage als Regel gegen eine andere Zone, ohne eigenen Zahlenwert. */
      readonly kind: 'rule';
      readonly id: string;
      readonly rule: string;
      readonly provenance: ZoneProvenance;
    };

/**
 * Reichweite einer Zonenlücke. Wortgleich mit `NotMeasuredScope` aus `core/src/not-measured.ts`;
 * `schema` ist abhängigkeitsfrei und kann den Typ nicht importieren. `core/src/layout/zones.ts`
 * hält beide über `ZoneGapScopeCheck` aneinander, damit sie nicht auseinanderlaufen.
 */
export type ZoneGapScope = 'value' | 'combination';

/**
 * Eine Zone, deren Lage an dieser Körperform nicht als Zahl vorliegt — mit Begründung, damit
 * niemand sie für einen offenen Platzhalter hält, den man „mal eben" füllen kann.
 */
export interface ZoneGap {
  readonly scope: ZoneGapScope;
  /** Warum hier keine Zahl steht, in den Worten des Fundorts. */
  readonly reason: string;
  /** Die Stelle, die diese Lücke heute schon benennt. */
  readonly definedAt: string;
}

/**
 * Belegung einer Zone an einer Körperform.
 *
 * Drei Zustände und nicht zwei, weil das Repository zwischen „nicht belegt" und „gemessen leer"
 * unterscheidet (`profiles.ts:371–372`): das erste lädt zum Nachschauen ein, das zweite hält
 * fest, dass nachgeschaut wurde.
 *
 * - `measured` — die Zone liegt mit mindestens einem Maß und dessen Herkunft vor.
 * - `not-measured` — an dieser Körperform ist nichts vermessen. Eine Lücke, kein Nullwert.
 * - `measured-absent` — es wurde nachgesehen: die Referenz führt die Zone an dieser Körperform
 *   **nicht**. Das ist ein Befund, keine offene Aufgabe.
 */
export type ZoneBinding =
  | { readonly status: 'measured'; readonly measures: readonly ZoneMeasure[] }
  | { readonly status: 'not-measured'; readonly gap: ZoneGap }
  | { readonly status: 'measured-absent'; readonly gap: ZoneGap };

/**
 * Das Zonenmodell **einer** Körperform. `Record<ZoneId, …>` und kein `Partial`: eine fehlende
 * Zone wäre von einer unvermessenen nicht zu unterscheiden, und genau diese Unterscheidung ist
 * der Zweck dieser Datenstruktur. Der Compiler erzwingt sie damit je Körperform.
 */
export interface BodyFormZones {
  readonly kind: SymbolKind;
  /** Gesetzt, wenn die Variante eigene Zonenmaße führt (vgl. `profileFor`). */
  readonly variant?: BodyVariantId;
  readonly zones: Readonly<Record<ZoneId, ZoneBinding>>;
}
