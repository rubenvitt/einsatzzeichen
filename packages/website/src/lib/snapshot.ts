import { assertSnapshot, type CatalogSnapshot } from './snapshot-schema.js';

/**
 * Der Katalog-Snapshot **zur Bauzeit** (Node). Typen und Prüfung liegen seit LFH-500 nebenan in
 * `snapshot-schema.ts`; hier steht nur noch, was den Dateizugriff braucht. Diese Datei wird
 * dadurch zur Node-Seite der Grenze — wer sie als Wert importiert, zieht die JSON-Datei mit.
 *
 * Die Typen werden weiterhin von hier re-exportiert: die Seiten und Bausteine importieren sie
 * seit dem Website-Slice aus `snapshot.js`, und ein reiner Typ-Reexport kostet im Bündel nichts
 * (`import type` wird beim Bauen entfernt).
 */

export type {
  BuilderVocabulary,
  CatalogSnapshot,
  CoverageAxis,
  CoverageSummary,
  MatrixRow,
  ReviewSummary,
  SourceSummary,
  SymbolSummary,
} from './snapshot-schema.js';
export { assertSnapshot } from './snapshot-schema.js';

/**
 * `import.meta.glob` statt eines statischen Imports — und das ist der ganze Punkt: ein
 * `import … from '../../public/catalog-snapshot.json'` scheitert bei fehlender Datei schon in der
 * Modulauflösung, mit einer Meldung über einen unauflösbaren Pfad. Genau der Fall, den Spec §7
 * beschreibt („jemand startet `astro dev` ohne `generate`"), bekäme dann nicht den Hinweis,
 * sondern eine Bundlermeldung. Ein Glob liefert bei fehlender Datei ein leeres Register, und der
 * Hinweis aus `assertSnapshot()` kommt zum Zug.
 *
 * `eager: true` hält `loadSnapshot()` synchron; ein dynamischer Import ginge bei dieser Signatur
 * nicht. Die statische Typisierung der Konsumenten hängt am Rückgabetyp `CatalogSnapshot`, nicht
 * am Import.
 *
 * Seit LFH-500 zeigt der Glob nach `public/`: dieselbe Datei, die Astro unverändert als
 * `/catalog-snapshot.json` ausliefert. Bauzeit und Laufzeit lesen damit denselben Stand, und es
 * gibt keine zweite Kopie, die davon abweichen könnte.
 */
const GENERATED = import.meta.glob('../../public/catalog-snapshot.json', {
  eager: true,
  import: 'default',
}) as Record<string, unknown>;

function generatedSnapshot(): unknown {
  const found = Object.values(GENERATED);
  return found.length === 1 ? found[0] : undefined;
}

/**
 * Der erzeugte Snapshot zur Bauzeit: Seiten, `getStaticPaths()` und die Astro-Bausteine ziehen
 * ihn hier. Wirft mit dem Hinweis aus Spec §7, wenn die Datei fehlt oder keinen brauchbaren
 * Snapshot trägt — kein stiller Rückfall auf einen leeren Katalog.
 *
 * **Nicht in Inseln aufrufen** (LFH-500): ein Wertimport aus dieser Datei zieht das
 * `import.meta.glob` oben und damit den vollen Snapshot ins Browserbündel — genau die 1,3 MB
 * `snapshot.*.js`, die der Umbau beseitigt hat. Inseln nehmen `fetchSnapshot()` aus
 * `snapshot-client.ts`; von hier holen sie sich nur Typen (`import type`).
 */
export function loadSnapshot(): CatalogSnapshot {
  return assertSnapshot(generatedSnapshot());
}
