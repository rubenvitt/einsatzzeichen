/**
 * Zusammenbau der drei Spalten und der Sitzungszustand. Alles Entscheidbare liegt bewusst
 * außerhalb: Filter und Sprungziel in `rows.ts`, Freigabefähigkeit in `issues.ts`, Kürzel in
 * `shortcuts.ts`, Entwurfssicherung in `drafts.ts`. Hier steht nur, was ohne laufenden Server und
 * ohne Browser nicht sinnvoll prüfbar wäre.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { JSX } from 'react';
import { PREVIEW_SIZES } from '../contract';
import type { AppState, CarrierId, CreateReviewerRequest, RowDetail, RowSummary } from '../contract';
import { createReviewer, fetchRow, fetchState, saveReview } from './api';
import type { Draft } from './drafts';
import {
  draftFromReview,
  dropDraft,
  isDirty,
  readDraft,
  readSessionReviewer,
  todayIso,
  writeDraft,
  writeSessionReviewer,
} from './drafts';
import { FindingsPanel } from './FindingsPanel';
import { HelpOverlay, ShortcutFooter } from './HelpOverlay';
import { assessDraft, draftToReviewValue } from './issues';
import { Navigator } from './Navigator';
import { DEFAULT_FILTER, filterRows, groupRowsByArea, nextPendingRow, overallProgress, stepRow } from './rows';
import type { RowFilter } from './rows';
import type { ShortcutAction } from './shortcuts';
import { resolveShortcut } from './shortcuts';
import { SignStage } from './SignStage';

const storage = window.localStorage;

export function App(): JSX.Element {
  const [state, setState] = useState<AppState | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [details, setDetails] = useState<ReadonlyMap<CarrierId, RowDetail>>(new Map());
  const [drafts, setDrafts] = useState<ReadonlyMap<CarrierId, Draft>>(new Map());
  const [selectedId, setSelectedId] = useState<CarrierId | undefined>(undefined);
  const [filter, setFilter] = useState<RowFilter>(DEFAULT_FILTER);
  const [openAreas, setOpenAreas] = useState<ReadonlySet<string>>(new Set());
  const [theme, setTheme] = useState('');
  const [sizeIndex, setSizeIndex] = useState(PREVIEW_SIZES.length - 1);
  const [compareId, setCompareId] = useState<CarrierId | null>(null);
  const [blend, setBlend] = useState(50);
  const [helpOpen, setHelpOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [reviewerError, setReviewerError] = useState<string | null>(null);
  const [storageWarning, setStorageWarning] = useState(false);
  const [sessionReviewer, setSessionReviewer] = useState(() => readSessionReviewer(storage));
  const searchRef = useRef<HTMLInputElement>(null);

  const rows = useMemo<readonly RowSummary[]>(() => state?.rows ?? [], [state]);

  const implementations = useMemo(() => {
    const index = new Map<CarrierId, string>();
    for (const [id, detail] of details) {
      if (detail.implementation !== undefined) index.set(id, detail.implementation);
    }
    return index;
  }, [details]);

  const visibleRows = useMemo(
    () => filterRows(rows, filter, { implementations, keepId: selectedId }),
    [rows, filter, implementations, selectedId],
  );
  const rowsByArea = useMemo(() => groupRowsByArea(visibleRows), [visibleRows]);
  const progress = useMemo(() => overallProgress(state?.areas ?? []), [state]);

  const detail = selectedId === undefined ? undefined : details.get(selectedId);
  const draft = selectedId === undefined ? undefined : drafts.get(selectedId);

  const select = useCallback(
    (id: CarrierId, source: readonly RowSummary[] = rows) => {
      setSelectedId(id);
      setCompareId(null);
      const row = source.find((entry) => entry.id === id);
      if (row === undefined) return;
      setOpenAreas((prev) => (prev.has(row.area) ? prev : new Set([...prev, row.area])));
    },
    [rows],
  );

  const load = useCallback(async (): Promise<void> => {
    try {
      const next = await fetchState();
      setState(next);
      setLoadError(null);
      setTheme((current) =>
        next.themes.some((option) => option.id === current)
          ? current
          : (next.themes[0]?.id ?? ''),
      );
      setSelectedId((current) => {
        if (current !== undefined && next.rows.some((row) => row.id === current)) return current;
        const first = filterRows(next.rows, DEFAULT_FILTER)[0] ?? next.rows[0];
        if (first === undefined) return undefined;
        setOpenAreas((prev) => new Set([...prev, first.area]));
        return first.id;
      });
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : String(error));
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  // Detailsatz nachladen. Bereits geladene Zeilen bleiben im Speicher: beim Blättern durch 558
  // Zeilen ist das Zurückspringen häufig, und ein erneuter Aufruf würde nur flackern.
  useEffect(() => {
    if (selectedId === undefined || details.has(selectedId)) return;
    let cancelled = false;
    fetchRow(selectedId)
      .then((next) => {
        if (cancelled) return;
        setDetails((prev) => new Map(prev).set(next.id, next));
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        setLoadError(error instanceof Error ? error.message : String(error));
      });
    return () => {
      cancelled = true;
    };
  }, [selectedId, details]);

  // Entwurf bereitstellen: der lokal gesicherte gewinnt, sonst startet er auf dem Ledgerstand.
  useEffect(() => {
    if (selectedId === undefined || detail === undefined) return;
    setDrafts((prev) => {
      if (prev.has(selectedId)) return prev;
      const stored = readDraft(storage, selectedId);
      const base =
        stored ??
        draftFromReview(detail.domain, { reviewer: sessionReviewer, date: todayIso() });
      return new Map(prev).set(selectedId, base);
    });
  }, [selectedId, detail, sessionReviewer]);

  const updateDraft = useCallback(
    (id: CarrierId, next: Draft): void => {
      setDrafts((prev) => new Map(prev).set(id, next));
      if (!writeDraft(storage, id, next)) setStorageWarning(true);
      if (next.reviewer !== '' && next.reviewer !== sessionReviewer) {
        setSessionReviewer(next.reviewer);
        writeSessionReviewer(storage, next.reviewer);
      }
    },
    [sessionReviewer],
  );

  const assessment = useMemo(
    () =>
      assessDraft({
        draft: draft ?? { status: 'pending', note: '', reviewer: '', date: '' },
        technical: detail?.technical,
        questions: detail?.questions ?? [],
        reviewerIds: (state?.reviewers ?? []).map((reviewer) => reviewer.id),
      }),
    [draft, detail, state],
  );

  const save = useCallback(async (): Promise<void> => {
    if (state === null || selectedId === undefined || detail === undefined || draft === undefined) {
      return;
    }
    if (saving) return;
    if (!assessment.canSave) {
      // Der Knopf ist gesperrt; über die Tastatur führt derselbe Weg aber ins Leere. Statt
      // stillschweigend nichts zu tun, nennt die Fahne den ersten Grund.
      setToast(assessment.blockers[0] ?? 'Speichern ist gesperrt.');
      return;
    }
    setSaving(true);
    setSaveError(null);
    try {
      const value = draftToReviewValue(draft);
      const response = await saveReview({
        id: selectedId,
        status: value.status,
        note: value.note,
        reviewer: value.reviewer,
        date: value.date,
      });
      const updatedRows = state.rows.map((row) =>
        row.id === response.id ? { ...row, status: response.domain.status } : row,
      );
      setState({ ...state, rows: updatedRows, areas: response.areas });
      setDetails((prev) => new Map(prev).set(response.id, { ...detail, domain: response.domain }));
      setDrafts((prev) =>
        new Map(prev).set(
          response.id,
          draftFromReview(response.domain, { reviewer: sessionReviewer, date: todayIso() }),
        ),
      );
      dropDraft(storage, response.id);

      // `keepId` hält die gerade geschriebene Zeile in der Liste, damit die Suche nach der
      // nächsten offenen an ihrer Stelle weiterläuft und nicht an den Listenanfang zurückfällt.
      const list = filterRows(updatedRows, filter, { implementations, keepId: response.id });
      const next = nextPendingRow(list, response.id);
      if (next === undefined) {
        setToast('Geschrieben. Im aktuellen Filter ist keine offene Zeile mehr übrig.');
      } else {
        select(next, updatedRows);
        setToast('Geschrieben. Weiter zur nächsten offenen Zeile.');
      }
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : String(error));
    } finally {
      setSaving(false);
    }
  }, [state, selectedId, detail, draft, assessment, saving, sessionReviewer, filter, implementations, select]);

  const onCreateReviewer = useCallback(async (record: CreateReviewerRequest): Promise<void> => {
    setReviewerError(null);
    try {
      await createReviewer(record);
      await load();
    } catch (error) {
      setReviewerError(error instanceof Error ? error.message : String(error));
    }
  }, [load]);

  const handleAction = useCallback(
    (action: ShortcutAction): void => {
      switch (action.kind) {
        case 'step': {
          const target = stepRow(visibleRows, selectedId, action.delta);
          if (target !== undefined) select(target);
          break;
        }
        case 'status':
          if (selectedId !== undefined && draft !== undefined) {
            updateDraft(selectedId, { ...draft, status: action.status });
          }
          break;
        case 'save':
          void save();
          break;
        case 'size':
          setSizeIndex(action.index);
          break;
        case 'theme-next': {
          const themes = state?.themes ?? [];
          if (themes.length === 0) break;
          const index = themes.findIndex((option) => option.id === theme);
          setTheme(themes[(index + 1) % themes.length].id);
          break;
        }
        case 'reference-toggle':
          // Umklappen zwischen den Endlagen: das Hin und Her zeigt die Abweichung, nicht ein
          // Mittelwert, in dem beide Konturen halbtransparent verschwimmen.
          setBlend((current) => (current > 50 ? 0 : 100));
          break;
        case 'focus-search':
          searchRef.current?.focus();
          searchRef.current?.select();
          break;
        case 'help-toggle':
          setHelpOpen((current) => !current);
          break;
        case 'dismiss':
          setHelpOpen(false);
          break;
      }
    },
    [visibleRows, selectedId, draft, save, state, theme, select, updateDraft],
  );

  // Der Ereignisbehandler wird einmal registriert und liest die jeweils neueste Fassung über die
  // Referenz. Andernfalls würde bei jedem Tastendruck neu an- und abgemeldet.
  const actionRef = useRef(handleAction);
  useEffect(() => {
    actionRef.current = handleAction;
  }, [handleAction]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent): void {
      const action = resolveShortcut({
        key: event.key,
        ctrlKey: event.ctrlKey,
        metaKey: event.metaKey,
        altKey: event.altKey,
        target: event.target,
      });
      if (action === null) return;
      event.preventDefault();
      actionRef.current(action);
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  useEffect(() => {
    if (toast === null) return;
    const timer = window.setTimeout(() => setToast(null), 3500);
    return () => window.clearTimeout(timer);
  }, [toast]);

  if (state === null) {
    return (
      <div className="werkbank">
        <div className="spalte laedt">Reviewzeilen werden geladen …</div>
        <div className="spalte spalte--mitte laedt">
          {loadError === null ? 'Zeichen werden vorbereitet …' : ''}
        </div>
        <div className="spalte laedt">
          {loadError === null ? (
            'Befundtafel wird vorbereitet …'
          ) : (
            <p className="meldung meldung--sperre">Der Server antwortet nicht: {loadError}</p>
          )}
        </div>
        <ShortcutFooter />
      </div>
    );
  }

  return (
    <div className="werkbank">
      <Navigator
        areas={state.areas}
        rowsByArea={rowsByArea}
        progress={progress}
        filter={filter}
        onFilterChange={setFilter}
        openAreas={openAreas}
        onToggleArea={(area) =>
          setOpenAreas((prev) => {
            const next = new Set(prev);
            if (!next.delete(area)) next.add(area);
            return next;
          })
        }
        selectedId={selectedId}
        onSelect={(id) => select(id)}
        theme={theme}
        searchRef={searchRef}
      />

      {detail === undefined ? (
        <main className="spalte spalte--mitte laedt" aria-label="Zeichen">
          {rows.length === 0 ? 'Es gibt keine Reviewzeilen.' : 'Zeile wird geladen …'}
        </main>
      ) : (
        <SignStage
          row={detail}
          themes={state.themes}
          theme={theme}
          onTheme={setTheme}
          sizeIndex={sizeIndex}
          onSizeIndex={setSizeIndex}
          compareId={compareId}
          onCompare={setCompareId}
          blend={blend}
          onBlend={setBlend}
        />
      )}

      {detail === undefined || draft === undefined || selectedId === undefined ? (
        <aside className="spalte laedt" aria-label="Befundtafel">
          Befund wird geladen …
        </aside>
      ) : (
        <FindingsPanel
          row={detail}
          draft={draft}
          onDraft={(next) => updateDraft(selectedId, next)}
          reviewers={state.reviewers}
          assessment={assessment}
          dirty={isDirty(draft, detail.domain)}
          saving={saving}
          saveError={saveError}
          onSave={() => void save()}
          onCreateReviewer={onCreateReviewer}
          reviewerError={reviewerError}
          storageWarning={storageWarning}
        />
      )}

      <ShortcutFooter />
      {helpOpen ? <HelpOverlay onClose={() => setHelpOpen(false)} /> : null}
      {toast !== null ? (
        <div className="fahne" role="status" aria-live="polite">
          {toast}
        </div>
      ) : null}
    </div>
  );
}
