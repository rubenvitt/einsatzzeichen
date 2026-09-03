/**
 * Der Vertrag zwischen Server und Oberfläche des Fachreview-Werkzeugs — die einzige Stelle, an
 * der sich beide berühren. Server (`src/server/`) und Oberfläche (`src/ui/`) importieren nur von
 * hier; keine der beiden Seiten importiert aus der anderen.
 *
 * Alle Typen sind reine Daten und über HTTP als JSON übertragbar. `Drawing` wird nicht übertragen
 * — die Oberfläche fordert fertiges SVG über `/api/render` an, damit es genau der Ausgabe von
 * `renderSvg` aus `core` entspricht und kein zweiter Renderpfad entsteht.
 */
import type {
  CoverageKind,
  DepictionVariant,
  ReviewStatus,
  TestEvidenceKind,
} from '@einsatzzeichen/schema';

/**
 * Adressiert einen der 558 Reviewträger über die drei Ledger hinweg. Ein einziger String statt
 * eines Verbundtyps, weil er als URL-Segment und als Schlüssel im Client-Zustand gebraucht wird:
 *
 * - `manifest:bbk-babz-2025:1.1#primary`
 * - `source:phjardas-tz`
 * - `profile:bund`
 */
export type CarrierId = string;

export type CarrierKind = 'manifest' | 'source' | 'profile';

/** Zerlegte Fassung einer `CarrierId`; `key` ist der Schlüssel im jeweiligen Ledger. */
export interface CarrierRef {
  kind: CarrierKind;
  key: string;
}

/**
 * Warum eine Zeile ein Trägerzeichen bekommt statt einer eigenen Zeichnung. Steht in der
 * Oberfläche sichtbar an der Darstellung, damit niemand den Träger für Teil der geprüften Aussage
 * hält.
 */
export interface CarrierContext {
  /** Kurzer Satz, z. B. „Die Organisationsfarbe wird auf einer taktischen Formation gezeigt." */
  explanation: string;
  /** Die Trägerart, z. B. `formation` — für die Beschriftung. */
  host: string;
}

export interface EvidenceChip {
  kind: TestEvidenceKind;
  /** Kürzel des Dossiers: FP, RS, FARBE, KOPF, PG, GEO, FW. */
  abbreviation: string;
  /** Was der Nachweis tatsächlich belegt — und was nicht. */
  explanation: string;
}

export interface ReviewValue {
  status: ReviewStatus;
  reviewer?: string;
  date?: string;
  note?: string;
}

/** Eine offene Fachfrage aus `DOMAIN_REVIEW_QUESTIONS`, auf die Zeile bezogen. */
export interface QuestionCard {
  id: string;
  question: string;
  context?: string;
}

/** Die Kurzfassung für den Navigator — bewusst klein, es sind 558 davon. */
export interface RowSummary {
  id: CarrierId;
  kind: CarrierKind;
  /** Anzeigename: Manifestschlüssel, Quellen- oder Profilkennung. */
  label: string;
  title: string;
  area: string;
  status: ReviewStatus;
  /** Ob die Zeile überhaupt ein Bild hat (Quellen und Profil haben keins). */
  hasDrawing: boolean;
  questionCount: number;
}

export interface AreaSummary {
  area: string;
  total: number;
  pending: number;
  approved: number;
  deviation: number;
}

/** Was `/api/state` beim Start liefert. */
export interface AppState {
  baseline: string;
  coreVersion: string;
  /** Ob `taktische-zeichen/` im Repository vorhanden ist. */
  referenceRootAvailable: boolean;
  /** Die im Register geführten Fachprüfer. Leer heißt: Schreiben ist gesperrt. */
  reviewers: readonly ReviewerRecord[];
  themes: readonly ThemeOption[];
  areas: readonly AreaSummary[];
  rows: readonly RowSummary[];
}

export interface ReviewerRecord {
  id: string;
  name: string;
  qualification: string;
}

export interface ThemeOption {
  id: string;
  label: string;
}

/** Ein Nachbarzeichen für den Verwechslungsvergleich. */
export interface NeighbourRef {
  id: CarrierId;
  label: string;
  title: string;
}

/** Was `/api/row/:id` liefert. */
export interface RowDetail {
  id: CarrierId;
  kind: CarrierKind;
  label: string;
  title: string;
  area: string;
  /** Abschnittsnummer, z. B. `4.6.4`. Bei Quellen und Profil leer. */
  section: string;
  variant?: DepictionVariant;
  implementation?: string;
  coverage?: CoverageKind;
  profile?: string;
  /** Dateiname aus `fingerprints.json`, niemals ein Pfad. */
  referenceAsset?: string;
  /** Ob die Referenzdatei tatsächlich lokal vorliegt. */
  referenceAvailable: boolean;
  evidence: readonly EvidenceChip[];
  technical?: ReviewValue;
  domain: ReviewValue;
  questions: readonly QuestionCard[];
  neighbours: readonly NeighbourRef[];
  /** Gesetzt, wenn die Zeile über ein Trägerzeichen dargestellt wird. */
  carrierContext?: CarrierContext;
  /** Freitext für Quellen- und Profilzeilen: Nutzungsgrundlage, Beschaffungsstand, Geometrie. */
  prose?: readonly ProseSection[];
}

export interface ProseSection {
  heading: string;
  body: string;
}

/** Der Rumpf von `POST /api/review`. */
export interface SaveReviewRequest {
  id: CarrierId;
  status: ReviewStatus;
  note?: string;
  reviewer?: string;
  date?: string;
}

export interface SaveReviewResponse {
  id: CarrierId;
  domain: ReviewValue;
  /** Der neue Bereichsstand, damit der Navigator ohne zweiten Aufruf stimmt. */
  areas: readonly AreaSummary[];
}

/** Der Rumpf von `POST /api/reviewer` — legt einen Registereintrag an. */
export interface CreateReviewerRequest {
  id: string;
  name: string;
  qualification: string;
}

export interface ApiError {
  error: string;
}

/** Die sechs Größenstufen des Mehrgrößen-Gates. */
export const PREVIEW_SIZES = [16, 24, 32, 64, 128, 256] as const;

export type PreviewSize = (typeof PREVIEW_SIZES)[number];

const CARRIER_PREFIXES: Record<CarrierKind, string> = {
  manifest: 'manifest:',
  source: 'source:',
  profile: 'profile:',
};

export function carrierId(kind: CarrierKind, key: string): CarrierId {
  return `${CARRIER_PREFIXES[kind]}${key}`;
}

/**
 * Zerlegt eine `CarrierId`. Fail-closed: ein unbekanntes Präfix ist ein Fehler und kein Rückfall
 * auf `manifest` — ein falsch adressierter Schreibvorgang träfe sonst den falschen Ledger.
 */
export function parseCarrierId(id: CarrierId): CarrierRef {
  for (const kind of Object.keys(CARRIER_PREFIXES) as CarrierKind[]) {
    const prefix = CARRIER_PREFIXES[kind];
    if (id.startsWith(prefix)) {
      const key = id.slice(prefix.length);
      if (key.length === 0) break;
      return { kind, key };
    }
  }
  throw new Error(`Unbekannte Trägerkennung: "${id}".`);
}
