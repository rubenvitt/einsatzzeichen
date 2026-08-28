import type { APIRoute, GetStaticPaths } from 'astro';
import { listContactSheets, readContactSheet } from '../../lib/contact-sheets';

/**
 * Liefert die Kontaktbögen des Katalogs als eigene Dateien aus (Spec §4, Seite „Belege").
 *
 * Sie werden nicht über `import.meta.glob` eingebunden, weil 22 Dateinamen ein `#` tragen und
 * damit für Vite nicht auflösbar sind — die Begründung steht in `src/lib/contact-sheets.ts`.
 */
export const getStaticPaths: GetStaticPaths = () =>
  listContactSheets().map((sheet) => ({ params: { datei: sheet.routeName } }));

export const GET: APIRoute = ({ params }) => {
  const datei = params.datei;
  if (datei === undefined) throw new Error('Route ohne Dateinamen aufgerufen.');
  return new Response(readContactSheet(datei), {
    headers: { 'content-type': 'image/svg+xml; charset=utf-8' },
  });
};
