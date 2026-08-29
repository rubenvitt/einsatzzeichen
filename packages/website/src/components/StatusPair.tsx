import { formatReviewDate } from '../lib/review-date.js';
import type { ReviewSummary } from '../lib/snapshot';

/**
 * Die zwei Statusmarken „technisch" und „fachlich" (Spec §5.5, §5.6).
 *
 * Sie stehen überall gleich: gleiche Klassen, gleiche Wörter, gleiche Reihenfolge. Farbe trägt nie
 * allein die Aussage — jede Marke hat ein eigenes Zeichen (Haken, Ring, Dreieck) und ein Textlabel.
 *
 * Diese Datei ist die einzige Quelle der Beschriftung. `StatusPair.astro` rendert dieselben Labels
 * für die statischen Seiten, damit Insel und Seite nicht auseinanderlaufen.
 */

/** Re-Export: die Marke und die Seiten sollen dasselbe Datumsformat zeigen. */
export { formatReviewDate };

export type StatusAxis = 'technical' | 'domain';

export interface StatusMark {
  axis: StatusAxis;
  status: ReviewSummary['status'];
  /** Vollständige Beschriftung inklusive Datum und Prüfer, falls vorhanden. */
  label: string;
  /** Beschriftung ohne Datum und Prüfer, für die kompakte Form. */
  shortLabel: string;
  /** Tooltip: Abweichungsnotiz, sonst die vollständige Beschriftung. */
  title: string;
  className: string;
}

const AXIS_WORD: Record<StatusAxis, string> = {
  technical: 'technisch',
  domain: 'fachlich',
};


/** Beschriftung, Zeichen und Klasse einer Marke — ohne React, damit `.astro` sie mitbenutzt. */
export function statusMark(axis: StatusAxis, review: ReviewSummary): StatusMark {
  const word = AXIS_WORD[axis];
  const shortLabel =
    review.status === 'approved'
      ? `${word} geprüft`
      : review.status === 'deviation'
        ? `${word}: mit Abweichung`
        : `${word}: noch nicht geprüft`;

  const meta: string[] = [];
  if (review.date !== undefined && review.date !== '') meta.push(formatReviewDate(review.date));
  if (review.reviewer !== undefined && review.reviewer !== '') meta.push(review.reviewer);
  const label = meta.length === 0 ? shortLabel : `${shortLabel} · ${meta.join(' · ')}`;

  return {
    axis,
    status: review.status,
    label,
    shortLabel,
    title: review.note !== undefined && review.note !== '' ? review.note : label,
    className: `ez-status ez-status--${review.status}`,
  };
}

export interface StatusMarkGlyph {
  /** SVG-Pfaddaten im 16×16-Raster. */
  d: string;
  /** `fill` statt `stroke` — das Dreieck ist eine Fläche, Haken und Ring sind Striche. */
  filled: boolean;
}

export const STATUS_GLYPHS: Record<ReviewSummary['status'], StatusMarkGlyph> = {
  approved: { d: 'M3 8.5 L6.5 12 L13 4', filled: false },
  pending: { d: 'M8 2.2 A5.8 5.8 0 1 1 7.99 2.2 M5.2 8 H10.8', filled: false },
  deviation: { d: 'M8 1.6 L15 14.4 H1 Z M7.2 5.6 h1.6 l-.25 4.4 h-1.1 Z M7.15 11.2 h1.7 v1.7 h-1.7 Z', filled: true },
};

function Glyph({ status }: { status: ReviewSummary['status'] }) {
  const glyph = STATUS_GLYPHS[status];
  return (
    <svg className="ez-status__glyph" viewBox="0 0 16 16" width="16" height="16" aria-hidden="true">
      <path
        d={glyph.d}
        fill={glyph.filled ? 'currentColor' : 'none'}
        fillRule={glyph.filled ? 'evenodd' : undefined}
        stroke={glyph.filled ? 'none' : 'currentColor'}
        strokeWidth={glyph.filled ? undefined : 1.6}
        strokeLinecap={glyph.filled ? undefined : 'round'}
        strokeLinejoin={glyph.filled ? undefined : 'round'}
      />
    </svg>
  );
}

export interface StatusPairProps {
  technical: ReviewSummary;
  domain: ReviewSummary;
  /** Kompakt: nur das kurze Label, Datum und Prüfer stehen im Tooltip. Für Kacheln und Tabellen. */
  compact?: boolean;
}

export default function StatusPair({ technical, domain, compact = false }: StatusPairProps) {
  const marks = [statusMark('technical', technical), statusMark('domain', domain)];
  return (
    <span className={compact ? 'ez-status-pair ez-status-pair--compact' : 'ez-status-pair'}>
      {marks.map((mark) => (
        <span key={mark.axis} className={mark.className} title={mark.title}>
          <Glyph status={mark.status} />
          <span className="ez-status__label">{compact ? mark.shortLabel : mark.label}</span>
        </span>
      ))}
    </span>
  );
}
