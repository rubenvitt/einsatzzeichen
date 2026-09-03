/**
 * Der Transport: `node:http` hinein, `ApiResponse` hinaus. Hier steht bewusst keine Fachlogik —
 * die ganze Entscheidung liegt in `api.ts` und ist dort ohne Server prüfbar.
 */
import type { IncomingMessage, ServerResponse } from 'node:http';
import type { ApiRequest, ApiResponse, ReviewApi } from './api.js';

/**
 * Grenze für den Anfragerumpf. Eine Reviewnotiz ist ein Absatz; alles darüber ist ein Fehler
 * oder ein Versehen und wird abgewiesen, statt den Speicher zu füllen.
 */
const MAX_BODY_BYTES = 1024 * 1024;

const CONTENT_TYPES = {
  json: 'application/json; charset=utf-8',
  svg: 'image/svg+xml; charset=utf-8',
} as const;

/** Präfix, ab dem der Server selbst antwortet; alles andere gehört Vite. */
export function isApiPath(pathname: string): boolean {
  return pathname === '/api' || pathname.startsWith('/api/');
}

export async function readRequestBody(request: IncomingMessage): Promise<string> {
  const chunks: Buffer[] = [];
  let size = 0;
  for await (const chunk of request) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(String(chunk));
    size += buffer.byteLength;
    if (size > MAX_BODY_BYTES) {
      throw new Error(
        `Der Anfragerumpf ist grösser als ${MAX_BODY_BYTES} Byte. Kürzen Sie die Notiz.`,
      );
    }
    chunks.push(buffer);
  }
  return Buffer.concat(chunks).toString('utf8');
}

function send(response: ServerResponse, result: ApiResponse): void {
  const body = result.kind === 'json' ? JSON.stringify(result.body) : result.body;
  response.writeHead(result.status, {
    'content-type': CONTENT_TYPES[result.kind],
    'content-length': Buffer.byteLength(body),
    // Das Werkzeug zeigt einen Stand, der sich beim Speichern ändert. Ein zwischengespeichertes
    // Bild oder ein zwischengespeicherter Zustand wäre hier eine falsche Auskunft.
    'cache-control': 'no-store',
  });
  response.end(body);
}

export async function serveApi(
  api: ReviewApi,
  request: IncomingMessage,
  response: ServerResponse,
): Promise<void> {
  const url = new URL(request.url ?? '/', 'http://127.0.0.1');
  try {
    const body =
      request.method === 'POST' || request.method === 'PUT'
        ? await readRequestBody(request)
        : undefined;
    const apiRequest: ApiRequest = {
      method: request.method ?? 'GET',
      path: url.pathname,
      query: url.searchParams,
      body,
    };
    send(response, api.handle(apiRequest));
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    send(response, { kind: 'json', status: 400, body: { error: message } });
  }
}
