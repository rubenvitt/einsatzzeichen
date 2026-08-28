import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';

/**
 * Die Kontaktbögen des Katalogs als Buildzeit-Verzeichnis (Spec §4, Seite „Belege").
 *
 * Warum nicht `import.meta.glob`: zehn der Bögen tragen ein `#` im Dateinamen
 * (`recipe.D.1.9#alternative.svg`, die Alternativdarstellungen). Vite baut aus einem Glob-Treffer
 * einen Import-Spezifizierer, und dort beginnt hinter dem `#` ein Fragment — diese zehn Dateien
 * sind über einen Glob nicht auflösbar (`UNRESOLVED_IMPORT`, belegt beim Bauen). Das Verzeichnis
 * wird deshalb mit `node:fs` gelesen und über eine statische Route ausgeliefert, die den Namen für
 * die URL entschärft. Nur so ist die Galerie vollständig.
 *
 * Die Bögen bleiben Dateien statt Inline-SVG: jeder ist ein in sich geschlossener Rasterbeleg mit
 * eigener weißer Grundfläche und eingebetteten PNG-Daten, ohne `currentColor` und ohne eine Farbe,
 * die von der Seite geerbt würde. Inline sähe er identisch aus, kostete aber die Lazy-Ladbarkeit —
 * bei zusammen 15 MB ist das der Unterschied zwischen bedienbar und unbedienbar.
 */

const SHEET_PATH_IN_REPOSITORY = 'packages/catalog/src/__snapshots__/multi-size';

/**
 * Das Verzeichnis wird vom Arbeitsverzeichnis aus aufwärts gesucht, nicht aus `import.meta.url`
 * abgeleitet: Astro bündelt dieses Modul für den Prerender-Lauf nach `dist/.prerender/chunks/`,
 * womit ein relativer Pfad ab `import.meta.url` ins Leere zeigt (belegt: `ENOENT … scandir
 * packages/website/catalog/…`). Die Suche findet dieselbe Wurzel, gleich ob jemand im Paket oder
 * im Repository-Wurzelverzeichnis baut.
 */
function findSheetDirectory(): string {
  let directory = resolve(process.cwd());
  for (;;) {
    const candidate = join(directory, SHEET_PATH_IN_REPOSITORY);
    if (existsSync(candidate)) return candidate;
    const parent = dirname(directory);
    if (parent === directory) {
      throw new Error(
        `Die Kontaktbögen wurden nicht gefunden: ${SHEET_PATH_IN_REPOSITORY} ist von ` +
          `${process.cwd()} aus in keinem übergeordneten Verzeichnis erreichbar.`,
      );
    }
    directory = parent;
  }
}

const SHEET_DIRECTORY = findSheetDirectory();

export interface ContactSheet {
  /** Dateiname ohne Endung, wie der Katalog ihn führt, z. B. `recipe.D.1.9#alternative`. */
  name: string;
  /**
   * Alternativtext, aus dem Bogen selbst abgeleitet — aus seinem `<title>` und seinen
   * Beschriftungen, nicht aus einer Liste hier. 525 Bögen sind Mehrgrößenregressionen mit
   * derselben Aufteilung; `organization-profiles.svg` hat eine andere und bekommt deshalb
   * automatisch eine andere Beschreibung, statt unter der falschen mitzulaufen.
   */
  alt: string;
  /** Derselbe Name mit `#` als `--`, damit er ohne Prozentkodierung in eine URL passt. */
  routeName: string;
  /** Auslieferungspfad der Route in `src/pages/kontaktbogen/`. */
  url: string;
  width: number;
  height: number;
}

function sheetSize(source: string, name: string): { width: number; height: number } {
  const match = /<svg[^>]*\bwidth="(\d+)"[^>]*\bheight="(\d+)"/u.exec(source.slice(0, 300));
  if (match === null) {
    // Kein stiller Rückfall auf Standardmaße (Spec §7): ohne Maße springt das Layout beim
    // Nachladen, und ein Bogen ohne lesbaren Kopf ist ein Fehler im Katalog, kein Anlass zu raten.
    throw new Error(`Kontaktbogen ohne lesbare Maße im Dateikopf: ${name}.svg`);
  }
  return { width: Number(match[1]), height: Number(match[2]) };
}

const MULTI_SIZE_TITLE_SUFFIX = 'Mehrgrößen- und Profilregression';

function textsOf(source: string): string[] {
  return [...source.matchAll(/<text[^>]*>([^<]*)<\/text>/gu)].map((match) => match[1] ?? '');
}

/**
 * Beschreibt, was auf dem Bogen zu sehen ist. Für die Regressionsbögen ist die Aufteilung fest
 * (sechs Größen im Referenztheme, darunter zwei weitere Themes). Für jeden anderen Bogen werden
 * Themezeilen (`… · 64px`) und Beschriftungen gezählt — so bleibt die Beschreibung richtig, auch
 * wenn der Katalog einen weiteren Sonderbogen bekommt.
 */
function describeSheet(name: string, source: string): string {
  const title = /<title>([^<]*)<\/title>/u.exec(source)?.[1];
  if (title === undefined) {
    // Kein stiller Rückfall auf eine erfundene Beschreibung (Spec §7): ein Bogen ohne `<title>`
    // wäre auch als Beleg unvollständig.
    throw new Error(`Kontaktbogen ohne <title>: ${name}.svg`);
  }
  if (title.endsWith(MULTI_SIZE_TITLE_SUFFIX)) {
    return (
      `Kontaktbogen ${name}: dieselbe Zeichnung in 16, 24, 32, 64, 128 und 256 px im ` +
      'Referenztheme, darunter in accessible-light und print-monochrome.'
    );
  }
  const texts = textsOf(source);
  const themeRows = texts.filter((text) => / · \d+px$/u.test(text));
  const labels = new Set(texts.filter((text) => !/ · \d+px$/u.test(text)));
  const size = / · (\d+)px$/u.exec(themeRows[0] ?? '')?.[1];
  const themes = themeRows.map((row) => row.replace(/ · \d+px$/u, '')).join(', ');
  return (
    `Kontaktbogen ${name}: ${title}. ${labels.size} Einträge in ${themeRows.length} Themes ` +
    `(${themes})${size === undefined ? '' : ` bei ${size} px`}.`
  );
}

export function routeNameFor(name: string): string {
  return name.replaceAll('#', '--');
}

/**
 * Einmal gelesen, dann behalten: die Route wird für jeden der 526 Bögen einzeln aufgerufen, und
 * ohne diesen Zwischenspeicher läse der Build das Verzeichnis 526-mal.
 */
let cached: ContactSheet[] | undefined;

/** Alle Bögen, nach dem deutschen Kollator mit Zahlenfolge sortiert. */
export function listContactSheets(): ContactSheet[] {
  if (cached !== undefined) return cached;
  const collator = new Intl.Collator('de', { numeric: true });
  cached = readdirSync(SHEET_DIRECTORY)
    .filter((file) => file.endsWith('.svg'))
    .map((file) => {
      const name = file.slice(0, -'.svg'.length);
      const source = readFileSync(join(SHEET_DIRECTORY, file), 'utf8');
      const routeName = routeNameFor(name);
      return {
        name,
        alt: describeSheet(name, source),
        routeName,
        url: `/kontaktbogen/${routeName}.svg`,
        ...sheetSize(source, name),
      };
    })
    .sort((left, right) => collator.compare(left.name, right.name));
  return cached;
}

/** Der Inhalt eines Bogens, adressiert über den entschärften Namen aus der Route. */
export function readContactSheet(routeName: string): string {
  const sheet = listContactSheets().find((candidate) => candidate.routeName === routeName);
  if (sheet === undefined) {
    throw new Error(`Kein Kontaktbogen unter dem Routennamen "${routeName}".`);
  }
  return readFileSync(join(SHEET_DIRECTORY, `${sheet.name}.svg`), 'utf8');
}
