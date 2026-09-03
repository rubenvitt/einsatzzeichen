/**
 * Vite-Konfiguration der Oberfläche. Bewusst nur das React-Plugin.
 *
 * Kein `server.port` und kein Proxy: der Entwicklungsserver gehört `src/server/`, das Vite im
 * Middleware-Modus einbindet und dabei `root` und `appType` selbst setzt. `/api/*` beantwortet
 * derselbe Prozess — ein eigener Port oder ein Proxy hier würde einen zweiten, halb
 * funktionsfähigen Server aufmachen und die Ursprungsgleichheit brechen.
 *
 * Auch keine Alias-Einträge für die Workspace-Pakete: `@einsatzzeichen/schema` zeigt über sein
 * `main` auf die eigenen Quellen und wird über die Verknüpfung in `node_modules` aufgelöst. Für
 * `tsc` leisten dasselbe die `paths`-Einträge der `tsconfig.json`.
 */
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
});
