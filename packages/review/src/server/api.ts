/**
 * Die Anfragenlogik des Fachreview-Servers: Routing, Prüfung, Antwortbildung — und sonst nichts.
 *
 * Das Modul kennt weder `node:http` noch Vite und liest keine Datei. Alles, was die Aussenwelt
 * berührt (Zeilenaufbau, Ledger-Schreiber, Referenzordner, Kalender), kommt als Abhängigkeit
 * herein. Damit ist jede Route ohne laufenden Server prüfbar, und ein Test kann den
 * Ledger-Schreiber durch ein Doppel ersetzen, statt die echte Katalogdatei anzufassen.
 */
import {
  reviewIssues,
  type ReviewIssueCode,
  type ReviewSet,
  type ReviewStatus,
} from '@einsatzzeichen/schema';
import type { ReviewRow } from '../data/index.js';
import {
  parseCarrierId,
  type ApiError,
  type AppState,
  type AreaSummary,
  type CarrierId,
  type CarrierRef,
  type ReviewValue,
  type ReviewerRecord,
  type RowDetail,
  type RowSummary,
  type SaveReviewResponse,
  type ThemeOption,
} from '../contract.js';
import type { ReferencePort } from './reference.js';
import { allowedRenderSizes, parseRenderSize, parseRenderTheme, renderRowSvg } from './render.js';

/** Die Antwort in Rohform: erst der Transport (`http.ts`) macht daraus Bytes. */
export type ApiResponse =
  | { readonly kind: 'json'; readonly status: number; readonly body: unknown }
  | { readonly kind: 'svg'; readonly status: number; readonly body: string };

export interface ApiRequest {
  method: string;
  /** Pfad ohne Query, noch prozentkodiert — genau so, wie er in `req.url` steht. */
  path: string;
  query?: URLSearchParams;
  /** Rumpf als Text; das Parsen steht hier, damit auch der Parsefehler eine `ApiError` wird. */
  body?: string;
}

/** Die vier Funktionen des Zeilenmoduls (`src/data/`), als Schnittstelle statt als Import. */
export interface ReviewDataPort {
  rowSummaries(rows: readonly ReviewRow[]): readonly RowSummary[];
  areaSummaries(rows: readonly ReviewRow[]): readonly AreaSummary[];
  rowDetail(id: CarrierId, rows: readonly ReviewRow[], referenceAvailable: boolean): RowDetail;
  /** Wirft bei unbekannter Kennung. */
  rowById(id: CarrierId, rows: readonly ReviewRow[]): ReviewRow;
}

/** Der schreibende Teil (`src/ledger/`). Im Test ein Doppel — kein Test fasst eine Datei an. */
export interface LedgerPort {
  writeDomainReview(repositoryRoot: string, ref: CarrierRef, review: ReviewValue): void;
  addReviewer(repositoryRoot: string, record: ReviewerRecord): void;
}

export interface ApiOptions {
  repositoryRoot: string;
  rows: readonly ReviewRow[];
  /** Startbestand des Reviewer-Registers, im Betrieb `DOMAIN_REVIEWERS` aus `catalog`. */
  reviewers: readonly ReviewerRecord[];
  themes: readonly ThemeOption[];
  baseline: string;
  coreVersion: string;
  referenceRootAvailable: boolean;
  data: ReviewDataPort;
  ledger: LedgerPort;
  reference: ReferencePort;
  /** Heutiges ISO-Datum; injizierbar, damit Tests nicht vom Kalender abhängen. */
  today?: () => string;
}

export interface ReviewApi {
  handle(request: ApiRequest): ApiResponse;
}

export type Route =
  | { readonly name: 'state' }
  | { readonly name: 'row'; readonly id: CarrierId }
  | { readonly name: 'render'; readonly id: CarrierId }
  | { readonly name: 'reference'; readonly id: CarrierId }
  | { readonly name: 'review' }
  | { readonly name: 'reviewer' }
  | { readonly name: 'unknown'; readonly reason: string };

const REVIEW_STATUSES: readonly ReviewStatus[] = ['pending', 'approved', 'deviation'];

/**
 * Die Absagen von `reviewIssues` in Klartext. Dieselbe Funktion prüft im Coverage-Gate; hier
 * bekommt jeder Befund den Satz, der sagt, was zu tun ist.
 */
const ISSUE_MESSAGES: Record<ReviewIssueCode, string> = {
  'missing-reviewer':
    'Ein abgeschlossenes Review braucht einen Prüfer. Wählen Sie einen Eintrag aus dem ' +
    'Reviewer-Register.',
  'invalid-date':
    'Das Datum fehlt oder ist kein gültiges ISO-Datum. Erwartet wird die Form JJJJ-MM-TT.',
  'missing-domain-note':
    'Eine fachliche Freigabe braucht eine Notiz, die den Befund festhält — sie ist der ' +
    'einzige Ort, an dem Referenzstand und fachliche Aussage zurechenbar stehen.',
  'missing-deviation-note': 'Eine Abweichung braucht eine Notiz, die sie begründet.',
};

/** Reviewer-Kennungen werden als Schlüssel in eine Quelldatei geschrieben — daher eng gefasst. */
const REVIEWER_ID_PATTERN = /^[a-z0-9][a-z0-9-]{0,31}$/u;

function json(status: number, body: unknown): ApiResponse {
  return { kind: 'json', status, body };
}

function fail(status: number, message: string): ApiResponse {
  return json(status, { error: message } satisfies ApiError);
}

function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

/**
 * Zerlegt den Pfad. Die Trägerkennung steht prozentkodiert im Pfad — Manifestschlüssel tragen
 * `:` und `#`, und ein `#` unkodiert beendete den Pfad. Erst nach dem Zerlegen an `/` wird
 * dekodiert; andersherum zerschnitte ein kodierter Schrägstrich die Kennung.
 */
export function resolveRoute(pathname: string): Route {
  const raw = pathname.split('/').filter((segment) => segment.length > 0);
  if (raw.length === 0 || raw[0] !== 'api') {
    return { name: 'unknown', reason: `Kein API-Pfad: "${pathname}".` };
  }

  let segments: string[];
  try {
    segments = raw.map((segment) => decodeURIComponent(segment));
  } catch {
    return { name: 'unknown', reason: `Der Pfad "${pathname}" ist nicht dekodierbar.` };
  }

  const resource = segments[1];
  const rest = segments.slice(2);

  if (resource === 'state' && rest.length === 0) return { name: 'state' };
  if (resource === 'review' && rest.length === 0) return { name: 'review' };
  if (resource === 'reviewer' && rest.length === 0) return { name: 'reviewer' };

  if ((resource === 'row' || resource === 'render' || resource === 'reference') && rest.length === 1) {
    const id = rest[0] as CarrierId;
    if (resource === 'row') return { name: 'row', id };
    if (resource === 'render') return { name: 'render', id };
    return { name: 'reference', id };
  }

  return { name: 'unknown', reason: `Unbekannter API-Pfad: "${pathname}".` };
}

/**
 * Sucht den Registereintrag zu einem Prüferwert. Zwei Entscheidungen stecken darin:
 *
 * 1. **Gegen die laufende Liste, nicht gegen die eingefrorene Katalogkonstante.** Wer sich
 *    gerade über `POST /api/reviewer` eingetragen hat, muss im selben Lauf freigeben dürfen;
 *    `isRegisteredReviewer` aus `catalog` liest `DOMAIN_REVIEWERS`, und das ist zur Ladezeit
 *    importiert und `deepFrozen` — es kennt ihn erst nach einem Neustart.
 * 2. **Kennung *und* Name werden akzeptiert, geschrieben wird der Name.** Im Ledger steht in
 *    `Review.reviewer` der Name — genau darüber vergleicht `isRegisteredReviewer` aus `catalog`,
 *    und daran misst später das Gate jede nicht offene Zeile. Die Oberfläche adressiert Personen
 *    dagegen über ihre stabile Kennung. Die Umrechnung gehört an diese Grenze; ohne sie schriebe
 *    das Werkzeug eine Kennung in den Ledger, die das Gate nicht wiedererkennt.
 */
export function resolveReviewer(
  reviewer: string | undefined,
  reviewers: readonly ReviewerRecord[],
): ReviewerRecord | undefined {
  if (reviewer === undefined) return undefined;
  const trimmed = reviewer.trim();
  if (trimmed === '') return undefined;
  return (
    reviewers.find((record) => record.id === trimmed) ??
    reviewers.find((record) => record.name === trimmed)
  );
}

function isoToday(): string {
  return new Date().toISOString().slice(0, 10);
}

function optionalText(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed === '' ? undefined : trimmed;
}

type Parsed<T> = { readonly ok: true; readonly value: T } | { readonly ok: false; readonly error: string };

function parseJsonObject(body: string | undefined): Parsed<Record<string, unknown>> {
  if (body === undefined || body.trim() === '') {
    return { ok: false, error: 'Der Anfragerumpf ist leer. Erwartet wird ein JSON-Objekt.' };
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(body);
  } catch (error) {
    return { ok: false, error: `Der Anfragerumpf ist kein gültiges JSON: ${messageOf(error)}` };
  }
  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    return { ok: false, error: 'Der Anfragerumpf muss ein JSON-Objekt sein.' };
  }
  return { ok: true, value: parsed as Record<string, unknown> };
}

export function createApi(options: ApiOptions): ReviewApi {
  const today = options.today ?? isoToday;

  /**
   * Der im Prozess gehaltene Stand. Beides ist eine Kopie mit Absicht:
   *
   * Der Katalog wird zur Ladezeit importiert und ist `deepFrozen`; ein geschriebener Ledger
   * ändert die Datei auf der Platte, nicht die bereits geladenen Objekte. Ohne diese Nachhaltung
   * zeigte der Navigator nach dem Speichern weiter „offen", und `/api/state` fiele nach einem
   * Neuladen der Oberfläche auf den Stand vom Prozessstart zurück. Ein Neuimport des Katalogs
   * je Schreibvorgang wäre die Alternative — er kostet den vollen Katalogaufbau und brächte mit
   * dem ESM-Modulcache eine zweite, konkurrierende Katalogfassung in denselben Prozess.
   */
  let rows: readonly ReviewRow[] = options.rows;
  let reviewers: readonly ReviewerRecord[] = [...options.reviewers];

  function state(): AppState {
    return {
      baseline: options.baseline,
      coreVersion: options.coreVersion,
      referenceRootAvailable: options.referenceRootAvailable,
      reviewers,
      themes: options.themes,
      areas: options.data.areaSummaries(rows),
      rows: options.data.rowSummaries(rows),
    };
  }

  function rowOr404(id: CarrierId): { readonly row: ReviewRow } | { readonly response: ApiResponse } {
    try {
      return { row: options.data.rowById(id, rows) };
    } catch (error) {
      return { response: fail(404, messageOf(error)) };
    }
  }

  function handleRow(id: CarrierId): ApiResponse {
    const found = rowOr404(id);
    if ('response' in found) return found.response;
    const asset = found.row.referenceAsset;
    const available = asset !== undefined && options.reference.has(asset);
    try {
      return json(200, options.data.rowDetail(id, rows, available));
    } catch (error) {
      return fail(404, messageOf(error));
    }
  }

  function handleRender(id: CarrierId, query: URLSearchParams): ApiResponse {
    const found = rowOr404(id);
    if ('response' in found) return found.response;

    const theme = parseRenderTheme(query.get('theme'));
    if (theme === undefined) {
      const known = options.themes.map((option) => option.id).join(', ');
      return fail(
        400,
        `Unbekanntes Theme "${query.get('theme') ?? ''}". Zulässig sind: ${known}.`,
      );
    }

    const size = parseRenderSize(query.get('size'));
    if (size === undefined) {
      return fail(
        400,
        `Unzulässige Grösse "${query.get('size') ?? ''}". Zulässig sind: ` +
          `${allowedRenderSizes().join(', ')}.`,
      );
    }

    const drawing = found.row.drawing;
    if (drawing === undefined) {
      return fail(
        404,
        `Die Zeile "${id}" trägt keine Zeichnung. Quellen- und Profilzeilen werden über ihre ` +
          `Detailansicht geprüft, nicht über ein Bild.`,
      );
    }

    try {
      return { kind: 'svg', status: 200, body: renderRowSvg(drawing, { id, theme, size }) };
    } catch (error) {
      // Ein Renderfehler ist ein Katalogbefund, kein Bedienfehler — er wird benannt, nicht
      // durch einen Platzhalter verdeckt (Spec §4, fail-closed).
      return fail(500, `Die Zeichnung für "${id}" liess sich nicht rendern: ${messageOf(error)}`);
    }
  }

  function handleReference(id: CarrierId): ApiResponse {
    const found = rowOr404(id);
    if ('response' in found) return found.response;

    // Der Dateiname stammt ausschliesslich aus der Zeile (also aus `fingerprints.json`); aus der
    // Anfrage kommt nur die Trägerkennung. Spec §8.
    const asset = found.row.referenceAsset;
    if (asset === undefined) {
      return fail(
        404,
        `Für die Zeile "${id}" ist keine Referenzdatei verzeichnet. Ein Referenzvergleich ist ` +
          `hier nicht vorgesehen.`,
      );
    }

    const result = options.reference.read(asset);
    if (!result.ok) return fail(result.status, result.error);
    return { kind: 'svg', status: 200, body: result.svg };
  }

  function handleSaveReview(body: string | undefined): ApiResponse {
    const parsed = parseJsonObject(body);
    if (!parsed.ok) return fail(400, parsed.error);

    const id = optionalText(parsed.value.id);
    if (id === undefined) {
      return fail(400, 'Die Trägerkennung fehlt. Erwartet wird das Feld "id".');
    }

    const status = parsed.value.status;
    if (typeof status !== 'string' || !REVIEW_STATUSES.includes(status as ReviewStatus)) {
      return fail(
        400,
        `Unbekannter Status "${String(status)}". Zulässig sind: ${REVIEW_STATUSES.join(', ')}.`,
      );
    }
    const reviewStatus = status as ReviewStatus;

    let ref: CarrierRef;
    try {
      ref = parseCarrierId(id);
    } catch (error) {
      return fail(400, messageOf(error));
    }

    const found = rowOr404(id);
    if ('response' in found) return found.response;

    // Der Prüfer wird auf seinen Registernamen normalisiert, bevor irgendetwas geprüft wird —
    // geprüft und geschrieben wird derselbe Wert (siehe `resolveReviewer`).
    const givenReviewer = optionalText(parsed.value.reviewer);
    const record = resolveReviewer(givenReviewer, reviewers);
    const reviewer = record?.name ?? givenReviewer;
    const note = optionalText(parsed.value.note);
    const givenDate = optionalText(parsed.value.date);
    // Ein abgeschlossenes Review bekommt heute als Datum, wenn keines mitkommt; ein offenes
    // bleibt datumslos — es beansprucht keine Prüfung und soll im Ledger auch keine vortäuschen.
    const date = givenDate ?? (reviewStatus === 'pending' ? undefined : today());

    const review: ReviewValue = {
      status: reviewStatus,
      ...(reviewer !== undefined ? { reviewer } : {}),
      ...(date !== undefined ? { date } : {}),
      ...(note !== undefined ? { note } : {}),
    };

    /**
     * Serverseitige Prüfung mit derselben Funktion wie das Coverage-Gate. Die Oberfläche prüft
     * dasselbe live, der Server verlässt sich nicht darauf — geschrieben wird nur, was das Gate
     * später bestehen wird. Der technische Teil steht hier bewusst als `pending`: geprüft wird
     * allein der fachliche Befund, und `reviewIssues` überspringt offene Rollen.
     */
    const candidate: ReviewSet = { technical: { status: 'pending' }, domain: review };
    const issues = reviewIssues(candidate).filter((issue) => issue.role === 'domain');
    if (issues.length > 0) {
      const reasons = [...new Set(issues.map((issue) => ISSUE_MESSAGES[issue.code]))];
      return fail(400, `Das Review ist unvollständig. ${reasons.join(' ')}`);
    }

    if (reviewStatus !== 'pending' && record === undefined) {
      return fail(
        400,
        `Der Prüfer "${givenReviewer ?? ''}" steht nicht im Reviewer-Register. Legen Sie ihn ` +
          `zuerst an; ohne Registereintrag ist eine Freigabe niemandem zurechenbar — und das ` +
          `Coverage-Gate weist sie später ab.`,
      );
    }

    try {
      options.ledger.writeDomainReview(options.repositoryRoot, ref, review);
    } catch (error) {
      return fail(500, `Der Ledger wurde nicht geschrieben: ${messageOf(error)}`);
    }

    // Nachhaltung im Speicher (siehe oben): die Zeile wird über ihre Identität ersetzt, nicht
    // über einen Feldnamen — welches Feld die Kennung trägt, ist Sache des Zeilenmoduls.
    const target = found.row;
    rows = rows.map((row) => (row === target ? { ...row, domain: review } : row));

    const response: SaveReviewResponse = {
      id,
      domain: review,
      areas: options.data.areaSummaries(rows),
    };
    return json(200, response);
  }

  function handleCreateReviewer(body: string | undefined): ApiResponse {
    const parsed = parseJsonObject(body);
    if (!parsed.ok) return fail(400, parsed.error);

    const id = optionalText(parsed.value.id);
    const name = optionalText(parsed.value.name);
    const qualification = optionalText(parsed.value.qualification);
    if (id === undefined || name === undefined || qualification === undefined) {
      return fail(
        400,
        'Ein Registereintrag braucht Kennung, Namen und einsatztaktische Qualifikation. Die ' +
          'Qualifikation ist der Grund, aus dem eine Freigabe später jemandem zugerechnet wird.',
      );
    }
    if (!REVIEWER_ID_PATTERN.test(id)) {
      // Die Kennung wird als Schlüssel in eine Quelldatei geschrieben; alles ausserhalb dieser
      // Zeichen wäre dort entweder ungültig oder müsste gequotet werden.
      return fail(
        400,
        `Die Kennung "${id}" ist unzulässig. Erlaubt sind Kleinbuchstaben, Ziffern und ` +
          `Bindestriche, höchstens 32 Zeichen.`,
      );
    }
    if (reviewers.some((record) => record.id === id)) {
      return fail(400, `Die Kennung "${id}" ist im Register bereits vergeben.`);
    }

    const record: ReviewerRecord = { id, name, qualification };
    try {
      options.ledger.addReviewer(options.repositoryRoot, record);
    } catch (error) {
      return fail(500, `Das Reviewer-Register wurde nicht geschrieben: ${messageOf(error)}`);
    }

    // Gleiche Nachhaltung wie beim Review: der importierte Katalog bleibt eingefroren.
    reviewers = [...reviewers, record];
    return json(201, reviewers);
  }

  function requireMethod(request: ApiRequest, expected: string): ApiResponse | undefined {
    if (request.method.toUpperCase() === expected) return undefined;
    return fail(405, `${request.path} erwartet ${expected}, nicht ${request.method}.`);
  }

  return {
    handle(request: ApiRequest): ApiResponse {
      const route = resolveRoute(request.path);
      const query = request.query ?? new URLSearchParams();

      switch (route.name) {
        case 'state': {
          const wrong = requireMethod(request, 'GET');
          return wrong ?? json(200, state());
        }
        case 'row': {
          const wrong = requireMethod(request, 'GET');
          return wrong ?? handleRow(route.id);
        }
        case 'render': {
          const wrong = requireMethod(request, 'GET');
          return wrong ?? handleRender(route.id, query);
        }
        case 'reference': {
          const wrong = requireMethod(request, 'GET');
          return wrong ?? handleReference(route.id);
        }
        case 'review': {
          const wrong = requireMethod(request, 'POST');
          return wrong ?? handleSaveReview(request.body);
        }
        case 'reviewer': {
          const wrong = requireMethod(request, 'POST');
          return wrong ?? handleCreateReviewer(request.body);
        }
        case 'unknown':
          return fail(404, route.reason);
      }
    },
  };
}
