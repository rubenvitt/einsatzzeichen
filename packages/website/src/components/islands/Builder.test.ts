import { createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { allowedValues } from '../../lib/builder-state.js';
import { buildSnapshot } from '../../lib/snapshot-build.js';
import type { CatalogSnapshot } from '../../lib/snapshot.js';
import Builder, { blockedTooltip, derivedTooltip } from './Builder.js';

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
 * `new URL(…, import.meta.url)` auf eine http-Adresse um. `packages/conformance/src/fonts.ts` tut
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
    // Gestellte Eingabe: eine feste Lücke erreicht der Baukasten seit dem 2. Oktober 2026 nicht
    // mehr (das Amphibienfahrzeug, bis dahin die einzige, wird abgeleitet gezeichnet). Der Fall
    // bleibt geprüft, denn ein eigener Portsatz kann ihn wieder auslösen — und der Rat der
    // Kombinationslücke wäre dann eine Aussage über die Referenz, die es nicht gibt.
    const text = blockedTooltip(
      { field: 'vehicleCategory', label: 'Fahrzeugkategorie', noun: 'Fahrzeugkategorie' },
      { because: 'not-measured', detail: 'Wellenlinie nur als Strichhülle …', scope: 'value' },
      'Amphibienfahrzeug',
      'Landfahrzeug',
    );
    expect(text).toMatch(/an keiner Grundzeichenart/);
    expect(text).not.toMatch(/oder eine andere Grundzeichenart/);
  });

  it('rät zu keinem anderen Wert, wenn im ganzen Feld keiner vermessen ist', () => {
    // Gestellte Eingabe nach dem Muster der Tendenz bis zum 2. Oktober 2026: alle drei Werte
    // nirgends vermessen. „Wähle einen anderen Wert" schickte die Leserin zu einem Wert, der
    // genauso gesperrt ist.
    const text = blockedTooltip(
      { field: 'tendency', label: 'Tendenz', noun: 'Tendenz' },
      { because: 'not-measured', detail: 'egal', scope: 'value' },
      'Tendenz steigend',
      'Person',
      true,
    );
    expect(text).toMatch(/„Tendenz steigend" ist als Tendenz noch nicht vermessen/);
    expect(text).not.toMatch(/anderen Wert/);
    expect(text).not.toMatch(/andere Grundzeichenart/);
  });
});

describe('derivedTooltip()', () => {
  it('sagt in Alltagssprache, dass der Wert zeichnet, aber von keinem Original belegt ist', () => {
    const text = derivedTooltip('Verband III');
    expect(text).toMatch(/„Verband III" lässt sich hier zeichnen/);
    expect(text).toMatch(/kein Original/);
    // Keine Begriffe des Motors im sichtbaren Text.
    expect(text).not.toMatch(/derivation|Profil|Hülle|transferred|constructed/);
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
  // Probt das Vokabular zweimal über die ganze Spec; mit den abgeleiteten Kombinationen (seit dem
  // 2. Oktober 2026) dauert das allein gut 3 s, unter Volllast mehr.
  it('begründet eine Sperre mit der Grundzeichenart, zu der die Sperre gehört', { timeout: 30_000 }, async () => {
    // Nachgemessen, damit der Fall nicht an einer Annahme über den Katalog hängt: mit der
    // Verwaltungsstufe „Kreis" ist das Fähigkeitspiktogramm unter „Fläche" nicht zeichenbar (die
    // Kopfzone verkleinert den Körper, das Piktogramm folgt nicht), unter „Taktische Formation"
    // sehr wohl. Bis zum 2. Oktober 2026 stand hier eine Körpermarke an der Person; die wird
    // seitdem abgeleitet.
    const atLevel = { administrativeLevel: 'kreis' } as const;
    expect(
      allowedValues({ kind: 'area', ...atLevel }, 'capabilities', ['meal-preparation'])[0]?.blocked
        ?.because,
    ).toBe('not-measured');
    expect(
      allowedValues({ kind: 'formation', ...atLevel }, 'capabilities', ['meal-preparation'])[0]?.ok,
    ).toBe(true);

    const container = await mountBuilder();
    tile(container, 'kind', 'Fläche').click();
    await settle();
    choose(container, 'administrativeLevel', 'kreis');
    await settle();
    tile(container, 'kind', 'Taktische Formation').click();
    await flushUrgent();

    // Genau jetzt gehört `spec` zur Formation und `probes` noch zur Fläche.
    expect(
      tile(container, 'kind', 'Taktische Formation').getAttribute('aria-pressed'),
      'Ohne den vorrangigen Render steht der Zwischenstand gar nicht im DOM.',
    ).toBe('true');
    const pictogram = optionOf(container, 'capabilities', 'meal-preparation');
    expect(pictogram.disabled, 'Ohne stehen gebliebene Sperre prüft dieser Fall nichts.').toBe(
      true,
    );
    const title = pictogram.getAttribute('title') ?? '';
    // Der Satz muss die Art nennen, unter der gesperrt wurde. Nennte er die neue, beschriebe er
    // eine Paarung, die in keiner der beiden Zusammenstellungen vorkommt — erfunden, nicht bloß
    // veraltet.
    expect(title).toMatch(/Grundzeichenart .Fläche./);
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

/* --- Ein geteilter Link beim Öffnen ------------------------------------------------------ */

/** Ein Link, wie ihn der Baukasten bis LFH-577 schrieb: base64url über das rohe JSON. */
function legacyLink(value: unknown): string {
  const bytes = new TextEncoder().encode(JSON.stringify(value));
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  const param = btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '');
  return `/builder/?spec=${param}`;
}

describe('Der Baukasten mit einem Link (LFH-578)', () => {
  it('meldet ein unbekanntes Feld sichtbar, statt es still zu übergehen', async () => {
    // Bis LFH-578 las der Baukasten diesen Tippfehler still als Person ohne Organisation.
    window.history.replaceState(null, '', legacyLink({ kind: 'person', organisation: 'thw' }));
    const container = await mountBuilder();

    const alert = [...container.querySelectorAll('[role="alert"]')].find((element) =>
      /Der Link trug keine lesbare Zusammenstellung/.test(element.textContent ?? ''),
    );
    expect(alert, 'Kein Hinweis zum unlesbaren Link.').toBeDefined();
    // Der Pfad in die Eingabe gehört in die aufklappbaren Einzelheiten, nicht in den Fließtext.
    const prose = [...(alert as Element).children]
      .filter((child) => child.tagName === 'P')
      .map((child) => child.textContent)
      .join(' ');
    expect(prose).not.toContain('$.');
    expect(alert?.querySelector('details')?.textContent).toContain('$.organisation');
    expect(tile(container, 'kind', 'Taktische Formation').getAttribute('aria-pressed')).toBe('true');
  });

  it('öffnet einen alten Link ohne Hülle wie bisher', async () => {
    window.history.replaceState(null, '', legacyLink({ kind: 'person', organization: 'thw' }));
    const container = await mountBuilder();
    expect(container.textContent).not.toMatch(/Der Link trug keine lesbare Zusammenstellung/);
    expect(tile(container, 'kind', 'Person').getAttribute('aria-pressed')).toBe('true');
  });
});

/* --- Verband, Zustand und Tendenz (LFH-577) ----------------------------------------------- */

/** Die Vorschau zeigt ein gezeichnetes Zeichen — kein Regelblock, kein Abbruch. */
function expectDrawn(container: HTMLElement): void {
  const stage = container.querySelector('.ez-builder__stage');
  expect(stage?.classList.contains('ez-builder__stage--void'), stage?.textContent ?? '').toBe(false);
  expect(stage?.querySelector('svg')).not.toBeNull();
}

/** Die Bezeichnungen der abwählbaren Marken eines Listenfeldes. */
function chipsOf(container: HTMLElement, field: string): string[] {
  const wrapper = container.querySelector(`#ez-builder-${field}`)?.closest('.ez-builder__field');
  return [...(wrapper?.querySelectorAll('.ez-builder__chip > span:first-child') ?? [])].map(
    (chip) => chip.textContent ?? '',
  );
}

describe('Der Baukasten mit Verband, Zustand und Tendenz (LFH-577)', () => {
  it('zeichnet die Formation mit Verband II und bietet Verband III abgeleitet an', async () => {
    const container = await mountBuilder();
    expect(
      container.querySelector('label[for="ez-builder-unitGrouping"]')?.textContent,
    ).toBe('Verband');

    choose(container, 'unitGrouping', 'verband-ii');
    await settle();

    expect(optionOf(container, 'unitGrouping', 'verband-ii').textContent).toBe('Verband II');
    expectDrawn(container);
    // Verband III war bis zum 2. Oktober 2026 gesperrt; seitdem zeichnet er nach dem Vorschlag
    // x 12/16/20 und trägt den Zusatz, im Text und im Tooltip.
    const third = optionOf(container, 'unitGrouping', 'verband-iii');
    expect(third.disabled).toBe(false);
    expect(third.textContent).toBe('Verband III — abgeleitet');
    expect(third.getAttribute('title')).toMatch(/„Verband III" lässt sich hier zeichnen/);
    // Der vermessene Verband I bleibt ohne Zusatz.
    expect(optionOf(container, 'unitGrouping', 'verband-i').textContent).toBe('Verband I');
    expect(optionOf(container, 'unitGrouping', 'verband-i').getAttribute('title')).toBeNull();
  });

  it('setzt an der Person einen Zustand und den Hinweis „?" und sperrt einen zweiten Zustand mit Regel', async () => {
    const container = await mountBuilder();
    expect(container.querySelector('label[for="ez-builder-states"]')?.textContent).toBe('Zustand');
    tile(container, 'kind', 'Person').click();
    await settle();

    choose(container, 'states', 'person-injured');
    await settle();
    choose(container, 'states', 'suspected-situation');
    await settle();

    expect(chipsOf(container, 'states')).toEqual(['Person verletzt', 'Hinweis auf Vermutung']);
    expectDrawn(container);
    // Höchstens ein Personenzustand aus 5.8.8: ein zweiter ist gesperrt, und zwar mit der
    // erklärten Regel, nicht als Vermessungslücke.
    const dead = optionOf(container, 'states', 'person-dead');
    expect(dead.disabled).toBe(true);
    expect(dead.getAttribute('title')).not.toMatch(/nicht vermessen/);
    expect(dead.getAttribute('title')?.length).toBeGreaterThan(0);
  });

  it('bietet jede Tendenz an und zeichnet sie abgeleitet neben dem Träger (seit 02.10.2026)', async () => {
    const container = await mountBuilder();
    expect(container.querySelector('label[for="ez-builder-tendency"]')?.textContent).toBe(
      'Tendenz',
    );
    for (const value of ['tendency-rising', 'tendency-unchanged', 'tendency-falling']) {
      const option = optionOf(container, 'tendency', value);
      expect(option.disabled, value).toBe(false);
    }
    choose(container, 'tendency', 'tendency-rising');
    await settle();
    expectDrawn(container);
  });
});

/* --- Abgeleitete Zusammenstellungen (Entscheidung vom 2. Oktober 2026) -------------------- */

/** Der Hinweis unter der Vorschau, wenn die Zeichnung abgeleitete Teile trägt. */
function derivationNote(container: HTMLElement): HTMLElement | undefined {
  return [...container.querySelectorAll<HTMLElement>('.ez-builder__result [role="note"]')].find(
    (element) => /Teilweise abgeleitet/.test(element.textContent ?? ''),
  );
}

describe('Der Baukasten mit abgeleiteten Teilen', () => {
  it('zeigt an einer vermessenen Zusammenstellung keinen Ableitungshinweis', async () => {
    const container = await mountBuilder();
    expectDrawn(container);
    expect(derivationNote(container)).toBeUndefined();
  });

  it('nennt unter der Vorschau, dass die Zeichnung teilweise abgeleitet ist, und welche Teile', async () => {
    const container = await mountBuilder();
    choose(container, 'unitGrouping', 'verband-iii');
    await settle();

    expectDrawn(container);
    const note = derivationNote(container);
    expect(note, 'Kein Hinweis zur Ableitung unter der Vorschau.').toBeDefined();
    expect(note?.querySelector('.ez-note__title')?.textContent).toBe(
      'Teilweise abgeleitet – kein Original belegt diese Zusammenstellung',
    );
    // Die Teile stehen eingeklappt, im Wortlaut der Notizen aus `core`.
    const details = note?.querySelector('details');
    expect(details).not.toBeNull();
    expect(details?.open).toBe(false);
    const parts = [...(details?.querySelectorAll('li') ?? [])].map((item) => item.textContent);
    expect(parts.some((part) => part?.includes('Verband III'))).toBe(true);
    // Der gesetzte Wert trägt keinen Zusatz; das sagt jetzt der Hinweis.
    expect(optionOf(container, 'unitGrouping', 'verband-iii').textContent).toBe('Verband III');
  });

  it('kennzeichnet nichts mehr einzeln, wenn die Zusammenstellung schon abgeleitet ist', async () => {
    const container = await mountBuilder();
    // Vor der Auswahl trägt das Piktogramm den Zusatz: an der Formation ist es nicht vermessen,
    // sondern wird in den Körper eingepasst.
    expect(optionOf(container, 'capabilities', 'meal-preparation').textContent).toBe(
      'Verpflegung / Zubereitung — abgeleitet',
    );
    choose(container, 'unitGrouping', 'verband-iii');
    await settle();
    // Danach nicht mehr: die Ableitung steckt schon in der Auswahl und steht unter der Vorschau.
    const pictogram = optionOf(container, 'capabilities', 'meal-preparation');
    expect(pictogram.disabled).toBe(false);
    expect(pictogram.textContent).toBe('Verpflegung / Zubereitung');
  });

  it('kennzeichnet auch eine Kachel, ohne ihre Beschriftung zu verändern', async () => {
    // Mit einer an der Formation vermessenen Körpermarke ist dieselbe Marke an der Funktionsstelle
    // nicht vermessen, aber ableitbar — nachgemessen statt angenommen.
    const [post] = allowedValues({ kind: 'formation', bodyMarks: ['care'] }, 'kind', ['post']);
    expect(post).toMatchObject({ ok: true, derived: true });

    const container = await mountBuilder();
    choose(container, 'bodyMarks', 'care');
    await settle();
    const postTile = tile(container, 'kind', 'Funktionsstelle');
    expect(postTile.getAttribute('aria-disabled')).toBe('false');
    expect(postTile.querySelector('.ez-builder__tile-derived')?.textContent).toBe('abgeleitet');
    expect(postTile.getAttribute('title')).toMatch(/„Funktionsstelle" lässt sich hier zeichnen/);
    // Die ausgewählte Formation trägt den Zusatz nicht.
    const chosen = tile(container, 'kind', 'Taktische Formation');
    expect(chosen.querySelector('.ez-builder__tile-derived')).toBeNull();
  });
});

describe('Der Baukasten mit Beschriftung im Körper', () => {
  it('setzt Text in die Mitte und unten rechts und zeichnet ihn in der Vorschau', async () => {
    const container = await mountBuilder();
    for (const [zone, text] of [['center', 'LST'], ['bottomRight', 'UEL']] as const) {
      const input = container.querySelector(`#ez-builder-label-${zone}`) as unknown as HTMLInputElement | null;
      expect(input, `Kein Feld für ${zone}.`).not.toBeNull();
      // React verfolgt den Wert über den Setter des Prototyps; erst damit zählt das Ereignis.
      const setter = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(input), 'value')?.set;
      setter?.call(input, text);
      input?.dispatchEvent(new DocumentEvent('input', { bubbles: true }));
      await settle();
    }
    const texts = [...container.querySelectorAll('svg text')].map((node) => node.textContent);
    expect(texts).toContain('LST');
    expect(texts).toContain('UEL');
  });
});
