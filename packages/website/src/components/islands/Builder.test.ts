import { createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { decodeSign, encodeSign } from '../../lib/builder-sign.js';
import { buildSnapshot } from '../../lib/snapshot-build.js';
import type { CatalogSnapshot } from '../../lib/snapshot.js';
import Builder from './Builder.js';

/**
 * Der Baukasten auf der Beschreibung (ESZ-150) an der gerenderten Insel: Suche, Familien, nur
 * passende Abschnitte, Bauplan im Expertenteil. Die Zustandsfunktionen dahinter prüft
 * `lib/builder-sign.test.ts`; hier geht es um das, was erst im DOM sichtbar wird.
 *
 * Die Datei heißt `.test.ts` und nicht `.test.tsx`, weil `test.include` in `vitest.config.ts` nur
 * `packages/*&#47;src/**&#47;*.test.ts` sammelt; die Insel steht deshalb mit `createElement` statt
 * mit JSX da.
 *
 * **Warum happy-dom von Hand angemeldet wird und nicht über `@vitest-environment`.** Die
 * Umgebungsangabe stellt Vitest auf den Browser-Transform um, und der schreibt jedes
 * `new URL(…, import.meta.url)` auf eine http-Adresse um. `packages/conformance/src/fonts.ts` tut
 * genau das auf Modulebene, und `fileURLToPath` lehnt eine http-Adresse ab — der Paketindex des
 * Katalogs und mit ihm `buildSnapshot()` ließen sich dann gar nicht erst laden. Von Hand
 * angemeldet bleibt die Datei im selben Node-Transform wie die übrigen Testdateien, und der
 * Katalog kommt echt herein statt als Attrappe.
 *
 * **Ohne `act()`.** `act()` flusht den aufgeschobenen Render mit; der Fall „gesetzter Wert nie
 * gesperrt“ braucht aber genau den Zwischenstand, in dem `sign` schon neu und die Probe aus
 * `useDeferredValue` noch alt ist. `flushUrgent()` wartet nur Mikrotasks ab (dort plant React den
 * vorrangigen Render eines diskreten Ereignisses), `settle()` echte Makrotasks (dort läuft der
 * nachrangige über den Scheduler).
 */

/**
 * happy-dom muss stehen, **bevor** `react-dom/client` und sein Scheduler geladen werden: beide
 * entscheiden auf Modulebene anhand von `window`, wie sie ihre Arbeit einplanen. `vi.hoisted()`
 * läuft vor allen Importen dieser Datei und ist damit die einzige Stelle, die früh genug ist.
 */
const { happyWindow } = await vi.hoisted(async () => {
  const { Window } = await import('happy-dom');
  const window = new Window({ url: 'https://einsatzzeichen.test/builder/' });
  // Angemeldet wird ausschließlich, was Node **nicht** schon führt: `document`, die Knoten- und
  // Elementklassen, `location`, `getComputedStyle`. Was beide kennen (`Event`, `fetch`,
  // `performance`, die Zeitgeber, `console`), bleibt das von Node. Das ist keine Bequemlichkeit:
  // eine bestehende Globale von Node zu überschreiben lässt V8 beim Lesen ihres Deskriptors
  // abstürzen (`Assertion failed: isolate_data` in `GetPerContextExports`) — und gebraucht wird
  // keine davon in der Fassung des Fensters. Wo eine Ereignisklasse aus dem Fenster nötig ist —
  // `dispatchEvent` erkennt nur seine eigene —, steht sie unten als `happyWindow.Event` da.
  for (const key of Object.getOwnPropertyNames(window)) {
    if (key in globalThis) continue;
    const descriptor = Object.getOwnPropertyDescriptor(window, key);
    if (descriptor === undefined) continue;
    Object.defineProperty(globalThis, key, { ...descriptor, configurable: true });
  }
  for (const alias of ['window', 'self', 'top', 'parent']) {
    Object.defineProperty(globalThis, alias, {
      value: window,
      configurable: true,
      writable: true,
    });
  }
  return { happyWindow: window };
});

/**
 * Der Snapshot kommt aus `buildSnapshot()` und nicht über `fetch`: geprüft wird die Insel, nicht
 * der Abruf — der steht in `snapshot-client.ts` und ist dort geprüft. Gebaut wird er beim ersten
 * Zugriff und dann einmal für alle Fälle; die Fabrik der Attrappe läuft vor den Importen dieser
 * Datei und könnte `buildSnapshot` noch gar nicht sehen.
 */
vi.mock('../../lib/snapshot-client.js', () => ({
  SNAPSHOT_URL: '/catalog-snapshot.json',
  fetchSnapshot: () => Promise.resolve(snapshotOnce()),
  snapshotErrorMessage: (error: unknown) => String(error),
  resetSnapshotCache: () => undefined,
}));

let builtSnapshot: CatalogSnapshot | undefined;

function snapshotOnce(): CatalogSnapshot {
  builtSnapshot ??= buildSnapshot(new Date('2026-09-01T00:00:00Z'));
  return builtSnapshot;
}


/* --- Bedienung der gerenderten Insel -------------------------------------------------------- */

/**
 * Die Ereignisklasse **dieses** Dokuments: `dispatchEvent` von happy-dom erkennt nur seine eigene.
 * Für TypeScript ist sie nicht die `Event` aus `lib.dom` — die Umdeutung sagt genau das und
 * behauptet nichts über die Laufzeit.
 */
const DocumentEvent = happyWindow.Event as unknown as typeof Event;

/** Ein Makrotask. Mehrere davon reichen dem React-Scheduler für den nachrangigen Render. */
const tick = (): Promise<void> => new Promise((resolve) => setTimeout(resolve, 0));

/** Warten, bis die Insel steht beziehungsweise die aufgeschobene Probe nachgezogen ist. */
async function settle(times = 12): Promise<void> {
  for (let index = 0; index < times; index += 1) await tick();
}

/** Nur Mikrotasks: der vorrangige Render steht, die aufgeschobene Probe noch nicht. */
async function flushUrgent(times = 4): Promise<void> {
  for (let index = 0; index < times; index += 1) await Promise.resolve();
}

let unmount: (() => void) | undefined;

beforeAll(() => {
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = false;
});

afterEach(() => {
  unmount?.();
  unmount = undefined;
  document.body.innerHTML = '';
  // Die Insel liest `?spec=` beim Mounten und schreibt ihn danach selbst — ein Fall, der einen
  // Link öffnet, darf ihn dem nächsten nicht hinterlassen.
  window.history.replaceState(null, '', '/builder/');
});

async function mountBuilder(): Promise<HTMLElement> {
  const container = document.createElement('div');
  document.body.append(container);
  const root = createRoot(container);
  unmount = () => root.unmount();
  root.render(createElement(Builder));
  await settle();
  expect(container.querySelector('.ez-builder'), 'Die Insel hat den Snapshot nicht bekommen.').not.toBeNull();
  return container;
}

/** Ein Eingabefeld füllen, wie React es liest: über den Setter des Prototyps und `input`. */
function type(element: Element | null, text: string): void {
  expect(element, 'Kein Eingabefeld.').not.toBeNull();
  const prototype = Object.getPrototypeOf(element) as object;
  Object.getOwnPropertyDescriptor(prototype, 'value')?.set?.call(element, text);
  element?.dispatchEvent(new DocumentEvent('input', { bubbles: true }));
}

/** Die Überschriften der sichtbaren Abschnitte, ohne die Zusammenfassung dahinter. */
function sectionTitles(container: HTMLElement): string[] {
  return [...container.querySelectorAll('.ez-builder__group-title')].map((heading) => heading.childNodes[0]?.textContent ?? '');
}

function familyButton(container: HTMLElement, label: string): HTMLElement {
  const found = [...container.querySelectorAll('.ez-builder__family')].find(
    (button) => button.querySelector('.ez-builder__family-label')?.textContent === label,
  );
  expect(found, `Keine Familie „${label}".`).toBeDefined();
  return found as unknown as HTMLElement;
}

/** Die Knopfgruppe eines Feldes über ihre sichtbare Beschriftung. */
function chipsField(container: HTMLElement, label: string): HTMLElement {
  const found = [...container.querySelectorAll('.ez-builder__chips-field')].find(
    (field) => field.querySelector(':scope > .ez-builder__field-label')?.textContent === label,
  );
  expect(found, `Keine Knopfgruppe „${label}".`).toBeDefined();
  return found as unknown as HTMLElement;
}

/** Ein wählbarer Knopf einer Gruppe — nicht einer aus der eingeklappten Liste darunter. */
function chip(container: HTMLElement, field: string, label: string): HTMLElement | undefined {
  return [...chipsField(container, field).querySelectorAll('[role="group"] .ez-builder__chip-option')].find(
    (button) => button.querySelector('span:not(.ez-builder__missing):not(.ez-builder__swatch)')?.textContent === label,
  ) as HTMLElement | undefined;
}

/** Die Werte der eingeklappten Liste „N weitere passen hier nicht“ unter einer Gruppe. */
function blockedOf(container: HTMLElement, field: string): string[] {
  return [...chipsField(container, field).querySelectorAll('.ez-builder__blocked li strong')].map(
    (entry) => entry.textContent ?? '',
  );
}

/** Das Suchfeld über einer langen Auswahl, über seine Beschriftung „… suchen“ (ESZ-152). */
function choiceSearch(container: HTMLElement, label: string): HTMLInputElement | null {
  const found = [...container.querySelectorAll('.ez-builder__choice-search')].find(
    (field) => field.querySelector('.ez-builder__field-label')?.textContent === `${label} suchen`,
  );
  return (found?.querySelector('input') ?? null) as unknown as HTMLInputElement | null;
}

/** Die Werte einer Auswahlliste, ohne „ohne“ oder „nicht gesetzt“. */
function optionValues(container: HTMLElement, selector: string): string[] {
  const select = container.querySelector(selector);
  expect(select, `Keine Auswahlliste ${selector}.`).not.toBeNull();
  return [...(select?.querySelectorAll('option') ?? [])].map((option) => option.getAttribute('value') ?? '').filter((value) => value !== '');
}

/** Die eingeklappte Liste „passen hier nicht“ unter einer Auswahlliste. */
function blockedNear(container: HTMLElement, selector: string): string[] {
  const field = container.querySelector(selector)?.closest('.ez-builder__field');
  return [...(field?.querySelectorAll('.ez-builder__blocked li strong') ?? [])].map((entry) => entry.textContent ?? '');
}

function actionButton(container: HTMLElement, label: string): HTMLElement {
  const found = [...container.querySelectorAll('button')].find(
    (candidate) => candidate.querySelector('strong')?.textContent === label,
  );
  expect(found, `Kein Knopf „${label}".`).toBeDefined();
  return found as unknown as HTMLElement;
}

/** Die Beschreibung, wie sie der Expertenteil gerade zeigt. */
function expertSign(container: HTMLElement): unknown {
  const area = container.querySelector('#ez-builder-expert-sign') as unknown as HTMLTextAreaElement | null;
  expect(area, 'Kein Expertenteil.').not.toBeNull();
  return JSON.parse(area?.value ?? 'null');
}

async function applyExpert(container: HTMLElement, json: string): Promise<void> {
  type(container.querySelector('#ez-builder-expert-sign'), json);
  await settle(2);
  actionButton(container, 'Übernehmen').click();
}

/** Die Vorschau zeigt ein gezeichnetes Zeichen. */
function expectDrawn(container: HTMLElement): void {
  const stage = container.querySelector('.ez-builder__stage');
  expect(stage?.classList.contains('ez-builder__stage--void'), stage?.textContent ?? '').toBe(false);
  expect(stage?.querySelector('svg')).not.toBeNull();
}

function fidelity(container: HTMLElement): string {
  return container.querySelector('.ez-builder__fidelity')?.textContent ?? '';
}

/** Ein Link, wie ihn der Baukasten bis LFH-577 schrieb: base64url über das rohe JSON. */
function rawLink(value: unknown): string {
  const bytes = new TextEncoder().encode(JSON.stringify(value));
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  const param = btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '');
  return `/builder/?spec=${param}`;
}

describe('Der Baukasten auf der Beschreibung (ESZ-150)', () => {
  it('beginnt mit der Einheit, zeichnet sie vermessen und zeigt nur passende Abschnitte', async () => {
    const container = await mountBuilder();
    expect(familyButton(container, 'Einheit').getAttribute('aria-pressed')).toBe('true');
    expectDrawn(container);
    expect(fidelity(container)).toBe('Vermessen');
    expect(expertSign(container)).toEqual({ kind: 'formation' });
    const titles = sectionTitles(container);
    expect(titles).toEqual(expect.arrayContaining(['Was ist es?', 'Organisation', 'Fachaufgaben', 'Größe und Ebene', 'Funktion', 'Zustand', 'Text']));
    // Kein Fahrwerk an einer Einheit: der Abschnitt fehlt, statt lauter gesperrter Werte zu zeigen.
    expect(titles).not.toContain('Fahrwerk');
  });

  it('tauscht beim Wechsel zum Fahrzeug die Abschnitte: Fahrwerk statt Funktion', async () => {
    const container = await mountBuilder();
    familyButton(container, 'Fahrzeug').click();
    await settle();
    expect(familyButton(container, 'Fahrzeug').getAttribute('aria-pressed')).toBe('true');
    expect((expertSign(container) as { kind: string }).kind).toBe('vehicle-land');
    const titles = sectionTitles(container);
    expect(titles).toContain('Fahrwerk');
    expect(titles).not.toContain('Funktion');
    // Am Fahrzeug passen nur Verbandskennzeichen und Balken in den Kopf; der Rest steht eingeklappt.
    expect(chip(container, 'Kopf', 'Gruppe')).toBeUndefined();
    expect(blockedOf(container, 'Kopf').length).toBeGreaterThan(0);
    expectDrawn(container);
  });

  it('klappt nicht passende Werte mit Grund ein und zeichnet einen trotzdem gesetzten vereinfacht', async () => {
    window.history.replaceState(null, '', `/builder/?spec=${encodeSign({ kind: 'person', states: ['person-injured'] })}`);
    const container = await mountBuilder();
    expect(familyButton(container, 'Person').getAttribute('aria-pressed')).toBe('true');
    expect(chip(container, 'Zustand', 'Person verletzt')?.getAttribute('aria-pressed')).toBe('true');
    expect(chip(container, 'Zustand', 'Person tot')).toBeUndefined();
    expect(blockedOf(container, 'Zustand')).toContain('Person tot');
    const reason = [...chipsField(container, 'Zustand').querySelectorAll('.ez-builder__blocked li')].find((entry) =>
      entry.textContent?.startsWith('Person tot'),
    );
    expect(reason?.textContent).toMatch(/selben Skala/);

    await applyExpert(container, '{"kind":"person","states":["person-injured","person-dead"]}');
    await settle();
    expectDrawn(container);
    expect(fidelity(container)).toBe('Vereinfacht');
    const omitted = container.querySelector('.ez-builder__omitted');
    expect(omitted?.querySelector('.ez-note__title')?.textContent).toBe('Nicht im Bild');
    expect(omitted?.textContent).toMatch(/Person tot/);
    const dead = chip(container, 'Zustand', 'Person tot');
    expect(dead?.getAttribute('aria-pressed')).toBe('true');
    expect(dead?.querySelector('.ez-builder__missing')?.textContent).toBe('nicht im Bild');
  });

  it('stellt den eben gesetzten Wert nie als gesperrt dar, auch vor der aufgeschobenen Probe', async () => {
    window.history.replaceState(null, '', `/builder/?spec=${encodeSign({ kind: 'person', states: ['person-injured'] })}`);
    const container = await mountBuilder();
    expect(blockedOf(container, 'Zustand')).toContain('Person tot');

    await applyExpert(container, '{"kind":"person","states":["person-dead"]}');
    await flushUrgent();
    // Die Probe kann hier noch zur verletzten Person gehören, die Auswahl gehört schon zur neuen.
    const dead = chip(container, 'Zustand', 'Person tot');
    expect(dead?.getAttribute('aria-pressed')).toBe('true');
    expect(blockedOf(container, 'Zustand')).not.toContain('Person tot');
  });

  it('lädt einen Treffer der Suche als Beschreibung und nennt ihn', async () => {
    const container = await mountBuilder();
    type(container.querySelector('#ez-builder-search'), 'Faxübertragung');
    await settle();
    const match = [...container.querySelectorAll('.ez-builder__match')].find(
      (button) => button.querySelector('.ez-id')?.textContent === 'comms.fax-transmission',
    );
    expect(match, 'Kein Treffer für die Faxübertragung.').toBeDefined();
    (match as unknown as HTMLElement).click();
    await settle();
    expect(familyButton(container, 'Freistehend').getAttribute('aria-pressed')).toBe('true');
    expect(expertSign(container)).toEqual({ kind: 'pictogram', pictogram: 'comms.fax-transmission' });
    expectDrawn(container);
    expect(container.textContent).toMatch(/Geladen: Faxübertragung/);
    // Jede Änderung löst den Bezug zum Katalogzeichen.
    familyButton(container, 'Person').click();
    await settle();
    expect(container.textContent).not.toMatch(/Geladen: Faxübertragung/);
  });

  it('öffnet einen alten Link mit rohem Bauplan als Beschreibung', async () => {
    window.history.replaceState(null, '', rawLink({ kind: 'person', organization: 'thw' }));
    const container = await mountBuilder();
    expect(container.textContent).not.toMatch(/Der Link trug kein lesbares Zeichen/);
    expect(familyButton(container, 'Person').getAttribute('aria-pressed')).toBe('true');
    expect(expertSign(container)).toEqual({ kind: 'person', organization: 'thw' });
  });

  it('meldet einen unlesbaren Link sichtbar, mit dem Pfad in den Einzelheiten', async () => {
    window.history.replaceState(null, '', rawLink({ kind: 'person', organisation: 'thw' }));
    const container = await mountBuilder();
    const alert = [...container.querySelectorAll('[role="alert"]')].find((element) =>
      /Der Link trug kein lesbares Zeichen/.test(element.textContent ?? ''),
    );
    expect(alert, 'Kein Hinweis zum unlesbaren Link.').toBeDefined();
    expect(alert?.querySelector('details')?.textContent).toContain('organisation');
    expect(familyButton(container, 'Einheit').getAttribute('aria-pressed')).toBe('true');
  });

  it('schreibt den Link als Hülle v2 mit der Beschreibung', async () => {
    const container = await mountBuilder();
    familyButton(container, 'Person').click();
    await settle();
    // Die Insel schreibt entprellt; gewartet wird auf den Wert, nicht auf eine feste Zeit.
    await vi.waitFor(() => {
      const current = new URLSearchParams(window.location.search).get('spec');
      expect(current).not.toBeNull();
      expect(decodeSign(current ?? '')).toEqual({ kind: 'person' });
    });
    const param = new URLSearchParams(window.location.search).get('spec');
    expect(JSON.parse(new TextDecoder().decode(Uint8Array.from(atob(param!.replaceAll('-', '+').replaceAll('_', '/')), (c) => c.charCodeAt(0))))).toEqual({
      v: 2,
      sign: { kind: 'person' },
    });
  });

  it('setzt Text in die Mitte und zeichnet ihn; die Größe wartet auf Text', async () => {
    const container = await mountBuilder();
    const size = container.querySelector('#ez-builder-text-centerSize') as unknown as HTMLSelectElement | null;
    expect(size?.disabled).toBe(true);
    type(container.querySelector('#ez-builder-text-center'), 'LST');
    await settle();
    expect([...container.querySelectorAll('.ez-builder__stage svg text')].map((node) => node.textContent)).toContain('LST');
    expect(size?.disabled).toBe(false);
    expect(expertSign(container)).toEqual({ kind: 'formation', text: { center: 'LST' } });
  });

  it('nimmt im Expertenteil auch einen Bauplan an und meldet Unlesbares mit Pfad', async () => {
    const container = await mountBuilder();
    await applyExpert(container, '{"kind":"vehicle-land","organization":"thw","vehicleCategory":"kfz-kategorie-1"}');
    await settle();
    expect(familyButton(container, 'Fahrzeug').getAttribute('aria-pressed')).toBe('true');
    expectDrawn(container);

    await applyExpert(container, '{"kind":"person","organisation":"thw"}');
    await settle(2);
    expect(container.querySelector('#ez-builder-expert-error')?.textContent).toMatch(/organisation/);
    expect(familyButton(container, 'Fahrzeug').getAttribute('aria-pressed')).toBe('true');
  });

  it('zeigt im Code die Kurzform mit draw(sign)', async () => {
    const container = await mountBuilder();
    const code = container.querySelector('[role="tabpanel"]')?.textContent ?? '';
    expect(code).toMatch(/draw\(/);
    expect(code).toMatch(/"kind": "formation"|kind: 'formation'|"kind":"formation"/);
  });
});

describe('Suche in langen Auswahlen (ESZ-152)', () => {
  it('filtert den Zustand: passende Knöpfe und eingeklappte Liste gleichermaßen', async () => {
    window.history.replaceState(null, '', `/builder/?spec=${encodeSign({ kind: 'person', states: ['person-injured'] })}`);
    const container = await mountBuilder();
    expect(chip(container, 'Zustand', 'Überschwemmtes Gebiet')).toBeDefined();
    expect(blockedOf(container, 'Zustand')).toEqual(expect.arrayContaining(['Person tot', 'Sonnig']));

    type(choiceSearch(container, 'Zustand'), 'tot');
    await settle();
    expect(chip(container, 'Zustand', 'Total zerstört')).toBeDefined();
    expect(chip(container, 'Zustand', 'Überschwemmtes Gebiet')).toBeUndefined();
    // Der gesetzte Wert bleibt stehen und lässt sich zurücknehmen.
    expect(chip(container, 'Zustand', 'Person verletzt')?.getAttribute('aria-pressed')).toBe('true');
    expect(blockedOf(container, 'Zustand')).toEqual(expect.arrayContaining(['Person tot', 'Totes Tier']));
    expect(blockedOf(container, 'Zustand')).not.toContain('Sonnig');

    type(choiceSearch(container, 'Zustand'), 'Ueberschwemmt');
    await settle();
    expect(chip(container, 'Zustand', 'Überschwemmtes Gebiet')).toBeDefined();
    expect(chip(container, 'Zustand', 'Person tot')).toBeUndefined();

    type(choiceSearch(container, 'Zustand'), 'gibt es nicht');
    await settle();
    expect(chipsField(container, 'Zustand').querySelector('[role="status"]')?.textContent).toBe('Nichts passt zu dieser Suche.');
  });

  it('lässt kurze Auswahlen ohne Suchfeld', async () => {
    const container = await mountBuilder();
    expect(choiceSearch(container, 'Kopf')).toBeNull();
    expect(choiceSearch(container, 'Organisation')).toBeNull();
    expect(choiceSearch(container, 'Zustand')).not.toBeNull();
  });

  it('filtert die Funktionsfassungen und behält die gesetzte', async () => {
    window.history.replaceState(null, '', `/builder/?spec=${encodeSign({ kind: 'formation', role: 'incident-command' })}`);
    const container = await mountBuilder();
    expect(optionValues(container, '#ez-builder-role')).toContain('disaster-control-command');

    type(choiceSearch(container, 'Funktion'), 'Abschnitt');
    await settle();
    expect(optionValues(container, '#ez-builder-role')).toEqual(['incident-command', 'incident-section-command-north', 'incident-subsection-command']);
    expect((container.querySelector('#ez-builder-role') as unknown as HTMLSelectElement | null)?.value).toBe('incident-command');
    expect(blockedNear(container, '#ez-builder-role')).toEqual(['Einsatzabschnittsleiter', 'Untereinsatzabschnittsleiter']);
  });

  it('filtert das freistehende Piktogramm über Name und Gruppe', async () => {
    window.history.replaceState(
      null,
      '',
      `/builder/?spec=${encodeSign({ kind: 'pictogram', pictogram: 'capability.cbrn-protection' })}`,
    );
    const container = await mountBuilder();
    expect(optionValues(container, '#ez-builder-fs-pictogram').length).toBeGreaterThan(150);

    type(choiceSearch(container, 'Piktogramm'), 'Deichbruch');
    await settle();
    expect(optionValues(container, '#ez-builder-fs-pictogram')).toEqual(['capability.cbrn-protection', 'damage.dyke-breach']);

    type(choiceSearch(container, 'Piktogramm'), 'Kommunikation');
    await settle();
    const hits = optionValues(container, '#ez-builder-fs-pictogram');
    expect(hits).toContain('comms.fax-transmission');
    // Die Gruppe „Kommunikation (Anhang J)“ ganz, dazu der gesetzte Wert und ein Name mit dem Wort.
    expect(hits.filter((value) => !value.startsWith('comms.'))).toEqual([
      'capability.cbrn-protection',
      'capability.information-communications',
    ]);
  });
});
