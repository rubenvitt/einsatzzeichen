/**
 * Bildbelege der Oberfläche für die visuelle QA (`docs/reviews/*-visual-qa.md`).
 *
 * Kein Teil des Werkzeugs zur Laufzeit: das Skript startet den Server nicht, sondern erwartet
 * einen bereits laufenden `pnpm review`. So bleibt der Aufnahmezeitpunkt beherrschbar und
 * derselbe Server kann in mehreren Zuständen abgelichtet werden.
 *
 *   node packages/review/scripts/screenshot.mjs [url] [zielverzeichnis]
 *
 * Voreinstellung: http://127.0.0.1:4319 nach out/review-shots/.
 */
import { mkdirSync } from 'node:fs';
import { chromium } from 'playwright';

const url = process.argv[2] ?? 'http://127.0.0.1:4319';
const outDir = process.argv[3] ?? 'out/review-shots';

/** Breit genug für den dreispaltigen Aufbau; darunter klappt die Oberfläche absichtlich um. */
const VIEWPORT = { width: 1600, height: 1000 };

mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch();

/**
 * Eine Aufnahme. Konsolenfehler werden gesammelt und gemeldet: ein Screenshot, der gut aussieht,
 * aber auf einer Seite mit Ausnahmen entstand, belegt nichts.
 */
async function shoot(name, { colorScheme = 'light', prepare } = {}) {
  const context = await browser.newContext({
    viewport: VIEWPORT,
    colorScheme,
    deviceScaleFactor: 2,
  });
  const page = await context.newPage();
  const failures = [];
  page.on('pageerror', (error) => failures.push(String(error)));
  page.on('console', (message) => {
    if (message.type() === 'error') failures.push(message.text());
  });

  await page.goto(url, { waitUntil: 'networkidle' });
  await page.waitForTimeout(600);
  if (prepare !== undefined) await prepare(page);
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${outDir}/${name}.png` });
  await context.close();

  const status = failures.length === 0 ? 'ohne Seitenfehler' : `${failures.length} FEHLER`;
  console.log(`${outDir}/${name}.png — ${status}`);
  for (const failure of failures) console.error(`  ${failure}`);
}

/**
 * Zeile über die Suche anwählen, damit die Aufnahme nicht von der Listenreihenfolge abhängt.
 * Die Suche klappt Bereiche nicht von selbst auf — die zugeklappten Köpfe werden deshalb zuerst
 * geöffnet, sonst ist die gefundene Zeile im DOM gar nicht vorhanden.
 */
async function selectRow(page, needle) {
  const search = page.locator('.navigator__kopf input').first();
  await search.fill(needle);
  await page.waitForTimeout(400);
  const collapsed = page.locator('.bereich__kopf[aria-expanded="false"]');
  for (let index = (await collapsed.count()) - 1; index >= 0; index -= 1) {
    await collapsed.nth(index).click();
  }
  await page.locator('.zeile').filter({ hasText: needle }).first().click();
  await page.waitForTimeout(600);
  // Die Suche wieder leeren und den Fokus aus dem Feld nehmen, damit Tastenkürzel greifen.
  await search.fill('');
  await page.locator('.buehne').click();
  await page.waitForTimeout(300);
}

await shoot('01-uebersicht');
await shoot('02-groesse-16', {
  prepare: async (page) => {
    await page.locator('body').click({ position: { x: 800, y: 500 } });
    await page.keyboard.press('1');
  },
});
await shoot('03-tastaturhilfe', {
  prepare: async (page) => {
    await page.locator('body').click({ position: { x: 800, y: 500 } });
    await page.keyboard.press('?');
  },
});
await shoot('04-fragenkarte', {
  prepare: async (page) => {
    await selectRow(page, 'D.1.9#primary');
    await page.locator('.tafel').first().evaluate((node) => {
      node.scrollTop = node.scrollHeight;
    });
  },
});
await shoot('05-dunkel', { colorScheme: 'dark' });
await shoot('06-referenzvergleich', {
  prepare: async (page) => {
    await selectRow(page, '1.1#primary');
  },
});

await browser.close();
