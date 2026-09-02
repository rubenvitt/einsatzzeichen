import { createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { allowedValues } from '../../lib/builder-state.js';
import { buildSnapshot } from '../../lib/snapshot-build.js';
import type { CatalogSnapshot } from '../../lib/snapshot.js';
import Builder, { blockedTooltip } from './Builder.js';

/**
 * Zwei Sorten Prüfung in einer Datei. Oben `blockedTooltip()` als reine Funktion — die
 * Fallunterscheidung, die LFH-502 möglich gemacht hat. Darunter zwei Befunde aus LFH-504b, die
 * sich **nur** an der gerenderten Insel zeigen: beide entstehen in dem einen Render, in dem `spec`
 * schon die neue und `probeSpec` (aus `useDeferredValue`) noch die vorige Zusammenstellung ist.
 * Diesen Zustand kann keine reine Funktion herstellen — er ist der Zustand von React zwischen zwei
 * Renders, und genau dort mischte der Sperrsatz die beiden Specs beziehungsweise sperrte die
 * Auswahl den gerade gesetzten Wert.
 *
 * Die Datei heißt `.test.ts` und nicht `.test.tsx`, weil `test.include` in `vitest.config.ts` nur
 * `packages/*&#47;src/**&#47;*.test.ts` sammelt; die Insel steht deshalb mit `createElement` statt
 * mit JSX da.
 *
 * **Warum happy-dom von Hand angemeldet wird und nicht über `@vitest-environment`.** Die
 * Umgebungsangabe stellt Vitest auf den Browser-Transform um, und der schreibt jedes
 * `new URL(…, import.meta.url)` auf eine http-Adresse um. `packages/catalog/src/fonts.ts` tut
 * genau das auf Modulebene, und `fileURLToPath` lehnt eine http-Adresse ab — der Paketindex des
 * Katalogs und mit ihm `buildSnapshot()` ließen sich dann gar nicht erst laden. Von Hand
 * angemeldet bleibt die Datei im selben Node-Transform wie die übrigen 108 Testdateien, und der
 * Katalog kommt echt herein statt als Attrappe.
 *
 * **Warum ohne `act()` und wie der Zwischenstand trotzdem sicher zu greifen ist.** `act()` flusht
 * den aufgeschobenen Render mit; damit wäre genau der Zwischenstand weg, um den es geht.
 * `IS_REACT_ACT_ENVIRONMENT` steht deshalb auf `false`. Gelesen wird nach `flushUrgent()`, also
 * nach ein paar **Mikrotasks** — und das ist kein Wettrennen mit dem Scheduler, sondern die
 * Trennlinie selbst: den vorrangigen Render eines diskreten Ereignisses plant React seit 18 in
 * einer Mikrotask (`queueMicrotask`), den nachrangigen über seinen Scheduler und damit über einen
 * `MessageChannel`, also einen Makrotask. Eine Mikrotask-Runde kann den zweiten nicht auslösen.
 * Wo der aufgeschobene Stand gebraucht wird, wartet `settle()` auf echte Makrotasks.
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

describe('blockedTooltip()', () => {
  const markField = { field: 'bodyMarks', label: 'Körpermarken', noun: 'Körpermarke' } as const;

  it('gibt bei einer abgelehnten Regel deren Erklärung unverändert weiter', () => {
    expect(
      blockedTooltip(
        markField,
        { because: 'rule', explanation: 'Technische Füllung: schließt eine Organisation aus.' },
        'Betreuung',
        'Taktische Formation',
      ),
    ).toBe('Technische Füllung: schließt eine Organisation aus.');
  });

  it('rät bei der Grundzeichenart selbst, einen Teil der übrigen Auswahl zurückzunehmen', () => {
    // An der Achse `kind` wäre „wähle eine andere Grundzeichenart" die Wiederholung der Frage:
    // gesperrt ist ja gerade eine Grundzeichenart. Der Sonderfall steht deshalb vor der
    // Unterscheidung nach `scope`.
    const text = blockedTooltip(
      { field: 'kind', label: 'Grundzeichenart', noun: 'Grundzeichenart' },
      { because: 'not-measured', detail: 'egal', scope: 'combination' },
      'Anhänger',
      'Anhänger',
    );
    expect(text).toMatch(/Nimm einen Teil der Auswahl zurück/);
  });

  it('verweist bei einer Lücke dieser Zusammenstellung auf eine andere Grundzeichenart', () => {
    const text = blockedTooltip(
      markField,
      { because: 'not-measured', detail: 'formation/normal/hospital …', scope: 'combination' },
      'Krankenhaus',
      'Taktische Formation',
    );
    expect(text).toMatch(/für die Grundzeichenart „Taktische Formation" nicht vermessen/);
    expect(text).toMatch(/oder eine andere Grundzeichenart/);
  });

  it('verweist bei einer festen Lücke auf keine andere Grundzeichenart', () => {
    // Das Amphibienfahrzeug: keine Art trägt seine Wellenlinie. Der Rat der Kombinationslücke
    // wäre hier eine Aussage über die Referenz, die es nicht gibt.
    const text = blockedTooltip(
      { field: 'vehicleCategory', label: 'Fahrzeugkategorie', noun: 'Fahrzeugkategorie' },
      { because: 'not-measured', detail: 'Wellenlinie nur als Strichhülle …', scope: 'value' },
      'Amphibienfahrzeug',
      'Landfahrzeug',
    );
    expect(text).toMatch(/an keiner Grundzeichenart/);
    expect(text).not.toMatch(/oder eine andere Grundzeichenart/);
  });
});

/* --- Die aufgeschobene Probe an der gerenderten Insel -------------------------------------- */

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

/**
 * Nur Mikrotasks: danach steht der vorrangige Render zum eben ausgelösten Ereignis im DOM, die
 * aufgeschobene Probe aber noch auf dem vorigen Stand. Genau dieser Zwischenstand ist der Fall.
 */
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
});

async function mountBuilder(): Promise<HTMLElement> {
  const container = document.createElement('div');
  document.body.append(container);
  const root = createRoot(container);
  unmount = () => root.unmount();
  root.render(createElement(Builder));
  await settle();
  expect(
    container.querySelector('.ez-builder'),
    'Die Insel hat den Snapshot nicht bekommen.',
  ).not.toBeNull();
  return container;
}

/**
 * Eine Kachel über ihre sichtbare Beschriftung — nicht über das `textContent` des Knopfes: bei
 * einer gesperrten Kachel steht dort zusätzlich der Sperrgrund, und der nennt selbst Arten.
 */
function tile(container: HTMLElement, field: string, label: string): HTMLElement {
  const group = container.querySelector(`[aria-labelledby="ez-builder-${field}-label"]`);
  expect(group, `Keine Kachelgruppe für \`${field}\`.`).not.toBeNull();
  const found = [...(group as Element).querySelectorAll('button')].find(
    (button) => button.querySelector('[class$="-label"]')?.textContent === label,
  );
  expect(found, `Keine Kachel „${label}" in \`${field}\`.`).toBeDefined();
  return found as unknown as HTMLElement;
}

function actionButton(container: HTMLElement, label: string): HTMLElement {
  const found = [...container.querySelectorAll('button')].find(
    (candidate) => candidate.querySelector('strong')?.textContent === label,
  );
  expect(found, `Kein Knopf „${label}".`).toBeDefined();
  return found as unknown as HTMLElement;
}

function optionOf(container: HTMLElement, field: string, value: string): HTMLOptionElement {
  const found = container.querySelector(`#ez-builder-${field} option[value="${value}"]`);
  expect(found, `Keine Option „${value}" in \`${field}\`.`).not.toBeNull();
  return found as unknown as HTMLOptionElement;
}

/** Ein `<select>` bedienen; React liest `event.target.value`, ein `change` reicht dafür. */
function choose(container: HTMLElement, field: string, value: string): void {
  const select = container.querySelector(`#ez-builder-${field}`);
  expect(select, `Kein Auswahlfeld \`${field}\`.`).not.toBeNull();
  (select as unknown as HTMLSelectElement).value = value;
  select?.dispatchEvent(new DocumentEvent('change', { bubbles: true }));
}

describe('Der Baukasten mit aufgeschobener Probe', () => {
  it('begründet eine Sperre mit der Grundzeichenart, zu der die Sperre gehört', async () => {
    // Nachgemessen, damit der Fall nicht an einer Annahme über den Katalog hängt: die Körpermarke
    // ist unter „Person" nicht vermessen, unter „Taktische Formation" sehr wohl.
    expect(allowedValues({ kind: 'person' }, 'bodyMarks', ['cbrn-protection'])[0]?.ok).toBe(false);
    expect(allowedValues({ kind: 'formation' }, 'bodyMarks', ['cbrn-protection'])[0]?.ok).toBe(
      true,
    );

    const container = await mountBuilder();
    tile(container, 'kind', 'Person').click();
    await settle();
    tile(container, 'kind', 'Taktische Formation').click();
    await flushUrgent();

    // Genau jetzt gehört `spec` zur Formation und `probes` noch zur Person.
    expect(
      tile(container, 'kind', 'Taktische Formation').getAttribute('aria-pressed'),
      'Ohne den vorrangigen Render steht der Zwischenstand gar nicht im DOM.',
    ).toBe('true');
    const mark = optionOf(container, 'bodyMarks', 'cbrn-protection');
    expect(mark.disabled, 'Ohne stehen gebliebene Sperre prüft dieser Fall nichts.').toBe(true);
    const title = mark.getAttribute('title') ?? '';
    // Der Satz muss die Art nennen, unter der gesperrt wurde. Nennte er die neue, beschriebe er
    // eine Paarung, die in keiner der beiden Zusammenstellungen vorkommt — erfunden, nicht bloß
    // veraltet.
    expect(title).toMatch(/Grundzeichenart .Person./);
    expect(title).not.toMatch(/Taktische Formation/);
  });

  it('stellt den nach der aktuellen Auswahl gesetzten Wert nie als gesperrt dar', async () => {
    // Nachgemessen: aus dieser Zusammenstellung heraus sperrt die Probe die Formation.
    expect(
      allowedValues({ kind: 'vehicle-land', vehicleCategory: 'kfz-kategorie-1' }, 'kind', [
        'formation',
      ])[0]?.blocked?.because,
    ).toBe('rule');

    const container = await mountBuilder();
    tile(container, 'kind', 'Landfahrzeug').click();
    await settle();
    choose(container, 'vehicleCategory', 'kfz-kategorie-1');
    await settle();

    // „Zurücksetzen" setzt die ganze Spec auf einmal — dieselbe Art Sprung wie
    // `loadFromCatalog()`, „Beispiel laden" und der `spec`-Parameter im Mount-Effekt, nur ohne
    // Zufallszeichen und ohne Texteingabe und damit ohne jede Wackelquelle.
    actionButton(container, 'Zurücksetzen').click();
    await flushUrgent();

    // `spec.kind` ist wieder `formation`, die Probe gehört noch zum Landfahrzeug.
    const chosen = tile(container, 'kind', 'Taktische Formation');
    expect(chosen.getAttribute('aria-pressed')).toBe('true');
    expect(
      chosen.getAttribute('aria-disabled'),
      'Die ausgewählte Kachel darf nie zugleich gesperrt sein — `aria-pressed="true"` neben ' +
        '`aria-disabled="true"` ist für Vorlesehilfen ein widersprüchlicher Zustand.',
    ).toBe('false');
    expect(chosen.getAttribute('title')).toBeNull();
    expect(chosen.textContent).not.toMatch(/geht hier nicht/);
  });
});
