/**
 * Die HTTP-Seite des Vertrags. Alle Adressen sind relativ: Oberfläche und `/api/*` beantwortet
 * derselbe Prozess, es gibt keinen zweiten Ursprung und deshalb auch keinen Proxy.
 */
import type {
  AppState,
  CarrierId,
  CreateReviewerRequest,
  RowDetail,
  SaveReviewRequest,
  SaveReviewResponse,
} from '../contract';

/** `CarrierId` enthält `:` und `#` — beides muss kodiert werden, sonst zerfällt der Pfad. */
function segment(id: CarrierId): string {
  return encodeURIComponent(id);
}

export function renderUrl(id: CarrierId, theme: string, size: number): string {
  const query = new URLSearchParams({ theme, size: String(size) });
  return `/api/render/${segment(id)}?${query.toString()}`;
}

export function referenceUrl(id: CarrierId): string {
  return `/api/reference/${segment(id)}`;
}

/**
 * Fail-closed: eine Antwort ohne `ok` wird nie als Erfolg gelesen. Der Server liefert im
 * Fehlerfall `ApiError`; steht dort nichts Brauchbares, nennen wir wenigstens den Statuscode.
 */
async function readJson<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let message = `HTTP ${response.status}`;
    try {
      const body = (await response.json()) as { error?: unknown };
      if (typeof body.error === 'string' && body.error !== '') message = body.error;
    } catch {
      // Keine lesbare Fehlermeldung — der Statuscode bleibt stehen.
    }
    throw new Error(message);
  }
  return (await response.json()) as T;
}

export async function fetchState(): Promise<AppState> {
  return readJson<AppState>(await fetch('/api/state'));
}

export async function fetchRow(id: CarrierId): Promise<RowDetail> {
  return readJson<RowDetail>(await fetch(`/api/row/${segment(id)}`));
}

export async function saveReview(body: SaveReviewRequest): Promise<SaveReviewResponse> {
  const response = await fetch('/api/review', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
  return readJson<SaveReviewResponse>(response);
}

/**
 * Legt einen Registereintrag an. Die Antwort wird nicht ausgewertet — der Vertrag legt sie nicht
 * fest; die Oberfläche lädt danach `/api/state` neu und arbeitet mit dem, was der Server führt.
 */
export async function createReviewer(body: CreateReviewerRequest): Promise<void> {
  const response = await fetch('/api/reviewer', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!response.ok) await readJson<unknown>(response);
}
