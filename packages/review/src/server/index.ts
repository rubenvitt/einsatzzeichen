/**
 * Einstieg des Fachreview-Werkzeugs (`pnpm review`).
 *
 * Ein Prozess, zwei Teile (Spec §2): dieser Server beantwortet `/api/*` selbst und reicht alles
 * übrige an Vite im Middleware-Modus weiter, damit die Oberfläche mit Hot-Reload läuft.
 *
 * Gebunden wird voreingestellt `127.0.0.1` — das Werkzeug kennt keine Anmeldung und keinen
 * Mehrbenutzerbetrieb (Spec §8). `REVIEW_HOST` öffnet es gezielt für eine andere Adresse dieses
 * Rechners, etwa die des Tailnet-Anschlusses. Bewusst keine Bindung an `0.0.0.0` als bequemer
 * Standard: eine benannte Adresse legt fest, über welche Schnittstelle das Werkzeug erreichbar
 * ist, statt es auf allen zugleich anzubieten.
 *
 * Diese Datei ist der Kompositionsort: hier — und nur hier — treffen Katalog, Zeilenaufbau,
 * Ledger-Schreiber und Dateisystem zusammen. Die Anfragenlogik in `api.ts` bekommt sie als
 * Abhängigkeiten und bleibt dadurch ohne laufenden Server prüfbar.
 */
import { createServer as createHttpServer } from 'node:http';
import { createServer as createViteServer, type ViteDevServer } from 'vite';
import { COVERAGE_MANIFEST, DOMAIN_REVIEWERS } from '@einsatzzeichen/catalog';
import { areaSummaries, buildRows, rowById, rowDetail, rowSummaries } from '../data/index.js';
import { addReviewer, writeDomainReview } from '../ledger/index.js';
import type { ReviewerRecord } from '../contract.js';
import { createApi } from './api.js';
import { createReferencePort } from './reference.js';
import { isApiPath, serveApi } from './http.js';
import { findRepositoryRoot, hasReferenceRoot, PACKAGE_ROOT } from './repository.js';
import {
  hostForUrl,
  isLoopbackHost,
  resolveHost,
  resolvePort,
  startupSummary,
  themeOptions,
} from './startup.js';

async function main(): Promise<void> {
  const port = resolvePort(process.env.REVIEW_PORT);
  const host = resolveHost(process.env.REVIEW_HOST);
  const repositoryRoot = findRepositoryRoot();
  const referenceRootAvailable = hasReferenceRoot(repositoryRoot);
  const rows = buildRows();
  // Der Startbestand des Registers wird Feld für Feld übernommen: `DOMAIN_REVIEWERS` ist ein
  // nach Kennung geführter, `deepFrozen` Record, der Server hält seinen eigenen, wachsenden
  // Stand (siehe `createApi`). Sortiert nach Kennung, damit die Auswahlliste stabil bleibt.
  const reviewers: readonly ReviewerRecord[] = Object.values(DOMAIN_REVIEWERS)
    .map((record) => ({ id: record.id, name: record.name, qualification: record.qualification }))
    .sort((left, right) => left.id.localeCompare(right.id));

  const api = createApi({
    repositoryRoot,
    rows,
    reviewers,
    themes: themeOptions(),
    baseline: COVERAGE_MANIFEST.baseline,
    coreVersion: COVERAGE_MANIFEST.coreVersion,
    referenceRootAvailable,
    data: { rowSummaries, areaSummaries, rowDetail, rowById },
    ledger: { writeDomainReview, addReviewer },
    reference: createReferencePort(repositoryRoot),
  });

  // Der HTTP-Server entsteht vor Vite, weil Vite seinen HMR-Websocket an ihn hängt (unten). Die
  // Middleware steht deshalb erst einen Augenblick später bereit; bis dahin antwortet der Server
  // mit 503 statt mit einem Absturz.
  let vite: ViteDevServer | undefined;

  const server = createHttpServer((request, response) => {
    const pathname = new URL(request.url ?? '/', `http://${hostForUrl(host)}`).pathname;
    if (isApiPath(pathname)) {
      void serveApi(api, request, response);
      return;
    }
    if (vite === undefined) {
      response.statusCode = 503;
      response.end('Die Oberfläche startet noch. Bitte neu laden.');
      return;
    }
    vite.middlewares(request, response);
  });

  // `root` ist die Paketwurzel, nicht das Arbeitsverzeichnis: `index.html` und `vite.config.ts`
  // liegen in `packages/review/`, gestartet wird das Werkzeug aber üblicherweise weiter oben.
  vite = await createViteServer({
    root: PACKAGE_ROOT,
    server: {
      middlewareMode: true,
      // HMR über denselben Server statt über Vites eigenen Port 24678: der wäre von einer
      // entfernten Adresse aus nicht ohne Weiteres erreichbar, und zwei gleichzeitige Instanzen
      // stritten sich um ihn (belegt beim Neustart). So folgt der Websocket automatisch der
      // Adresse, unter der die Oberfläche geladen wurde.
      hmr: { server },
      // Vites Wirtsnamensprüfung schützt vor DNS-Rebinding gegen einen Server, der eigentlich nur
      // lokal gedacht ist. Sobald der Aufrufer ausdrücklich eine andere Adresse angibt, ist genau
      // das der Zweck — und ein Aufruf über einen Namen statt über die IP scheiterte sonst an
      // einer Meldung, die wie ein Netzfehler aussieht.
      ...(isLoopbackHost(host) ? {} : { allowedHosts: true as const }),
    },
    appType: 'spa',
  });

  server.on('error', (error: NodeJS.ErrnoException) => {
    if (error.code === 'EADDRINUSE') {
      // Kein stilles Ausweichen auf einen freien Port: die Oberfläche und jede offene
      // Registerkarte kennen genau diese Adresse.
      console.error(
        `Port ${port} auf ${host} ist belegt. Beenden Sie den anderen Prozess oder starten ` +
          `Sie mit REVIEW_PORT=<freier Port> pnpm review.`,
      );
    } else if (error.code === 'EADDRNOTAVAIL') {
      // Der häufigste Fehlgriff bei `REVIEW_HOST`: eine Adresse, die dieser Rechner nicht trägt.
      console.error(
        `Die Adresse ${host} gehört keiner Schnittstelle dieses Rechners. Prüfen Sie sie mit ` +
          `"ip -brief addr" und setzen Sie REVIEW_HOST auf eine dort aufgeführte Adresse.`,
      );
    } else {
      console.error(`Der Server konnte nicht starten: ${error.message}`);
    }
    process.exitCode = 1;
    void vite?.close();
  });

  server.listen(port, host, () => {
    const areas = areaSummaries(rows);
    console.log(
      startupSummary({
        url: `http://${hostForUrl(host)}:${port}/`,
        host,
        pending: areas.reduce((sum, area) => sum + area.pending, 0),
        total: rows.length,
        referenceAvailable: referenceRootAvailable,
        reviewers,
      }),
    );
  });
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
