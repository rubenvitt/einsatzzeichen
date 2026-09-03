/**
 * Rechte Spalte: genau die Fakten, die die fachlichen Prüfkriterien der Übergabe brauchen —
 * Metadaten, Evidenz, das technische Review und die registrierten Fragen — und darunter das
 * Formular. Die Reihenfolge folgt dem Prüfweg: erst wissen, worauf man schaut, dann entscheiden.
 */
import type { JSX } from 'react';
import type {
  CreateReviewerRequest,
  ReviewerRecord,
  ReviewValue,
  RowDetail,
} from '../contract';
import type { Draft } from './drafts';
import { carrierKindLabel, coverageLabel, statusLabel, variantLabel } from './format';
import type { DraftAssessment } from './issues';
import { ReviewForm } from './ReviewForm';
import { ReviewerSetup } from './ReviewerSetup';

interface FindingsPanelProps {
  row: RowDetail;
  draft: Draft;
  onDraft: (draft: Draft) => void;
  reviewers: readonly ReviewerRecord[];
  assessment: DraftAssessment;
  dirty: boolean;
  saving: boolean;
  saveError: string | null;
  onSave: () => void;
  onCreateReviewer: (record: CreateReviewerRequest) => Promise<void>;
  reviewerError: string | null;
  /** Der lokale Speicher nimmt keine Entwürfe an — das muss man wissen, bevor man lange tippt. */
  storageWarning: boolean;
}

function reviewText(review: ReviewValue | undefined): string {
  if (review === undefined) return 'nicht geführt';
  const parts = [statusLabel(review.status)];
  if (review.reviewer !== undefined) parts.push(review.reviewer);
  if (review.date !== undefined) parts.push(review.date);
  return parts.join(' · ');
}

export function FindingsPanel(props: FindingsPanelProps): JSX.Element {
  const { row } = props;
  return (
    <aside className="spalte" aria-label="Befundtafel">
      <div className="tafel">
        <section>
          <h2>Metadaten</h2>
          <dl className="merkmale">
            <dt>Schlüssel</dt>
            <dd className="mono">{row.label}</dd>
            <dt>Art</dt>
            <dd>{carrierKindLabel(row.kind)}</dd>
            {row.section !== '' ? (
              <>
                <dt>Abschnitt</dt>
                <dd>{row.section}</dd>
              </>
            ) : null}
            {row.variant !== undefined ? (
              <>
                <dt>Variante</dt>
                <dd>{variantLabel(row.variant)}</dd>
              </>
            ) : null}
            <dt>Titel</dt>
            <dd>{row.title}</dd>
            {row.implementation !== undefined ? (
              <>
                <dt>Implementierung</dt>
                <dd className="mono">{row.implementation}</dd>
              </>
            ) : null}
            {row.coverage !== undefined ? (
              <>
                <dt>Coverage-Art</dt>
                <dd>{coverageLabel(row.coverage)}</dd>
              </>
            ) : null}
            {row.profile !== undefined ? (
              <>
                <dt>Profil</dt>
                <dd>{row.profile}</dd>
              </>
            ) : null}
            <dt>Referenzasset</dt>
            <dd className="mono">
              {row.referenceAsset ?? 'keins'}
              {row.referenceAsset !== undefined && !row.referenceAvailable ? ' (nicht lokal)' : ''}
            </dd>
            <dt>Bereich</dt>
            <dd>{row.area}</dd>
          </dl>
        </section>

        {row.evidence.length > 0 ? (
          <section>
            <h2>Evidenz</h2>
            <div className="chips">
              {row.evidence.map((chip) => (
                <details key={chip.kind} className="chip">
                  <summary title={chip.explanation}>{chip.abbreviation}</summary>
                  <p>{chip.explanation}</p>
                </details>
              ))}
            </div>
          </section>
        ) : null}

        <section>
          <h2>Technisches Review</h2>
          <div className="karte">
            <p style={{ margin: 0 }}>{reviewText(row.technical)}</p>
            {row.technical?.note !== undefined ? (
              <p style={{ margin: '6px 0 0', color: 'var(--text-leise)' }}>
                {row.technical.note}
              </p>
            ) : null}
            <p className="statuszeile" style={{ marginBottom: 0 }}>
              Technische Nachweise belegen Geometrie, Raster, Kontrast und Metadaten — nicht die
              fachliche Bedeutung.
            </p>
          </div>
        </section>

        <section>
          <h2>Registrierte Fragen ({row.questions.length})</h2>
          {row.questions.length === 0 ? (
            <p className="statuszeile">
              Für diese Zeile führt das Register keine Frage. Es gelten die Kriterien „Für jeden
              Eintrag".
            </p>
          ) : (
            <>
              <p className="statuszeile">
                Eine Freigabe, die eine registrierte Frage übergeht, gilt als unvollständig. Jede
                Frage ist im Befund ausdrücklich zu beantworten.
              </p>
              {row.questions.map((question) => (
                <div key={question.id} className="frage">
                  <span className="frage__id">{question.id}</span>
                  <p style={{ margin: '2px 0 0' }}>{question.question}</p>
                  {question.context !== undefined ? (
                    <p className="frage__kontext">{question.context}</p>
                  ) : null}
                </div>
              ))}
            </>
          )}
        </section>

        {props.storageWarning ? (
          <p className="meldung">
            Entwürfe lassen sich in diesem Browser nicht lokal sichern. Ein Neustart verliert die
            angefangene Notiz — geschriebene Befunde sind davon nicht betroffen.
          </p>
        ) : null}

        {props.reviewers.length === 0 ? (
          <ReviewerSetup onCreate={props.onCreateReviewer} error={props.reviewerError} />
        ) : (
          <ReviewForm
            draft={props.draft}
            onDraft={props.onDraft}
            reviewers={props.reviewers}
            assessment={props.assessment}
            dirty={props.dirty}
            saving={props.saving}
            saveError={props.saveError}
            onSave={props.onSave}
          />
        )}
      </div>
    </aside>
  );
}
