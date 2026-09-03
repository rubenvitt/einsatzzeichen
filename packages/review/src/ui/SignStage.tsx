/**
 * Mittlere Spalte: das Zeichen. Es ist das Prüfobjekt und bekommt den meisten Platz und den
 * ruhigsten Grund. Die Leiste darüber schaltet Theme und Größenstufe; darunter folgen
 * Nachbarschaftsstreifen und Referenzvergleich als eigene Bausteine.
 */
import type { JSX } from 'react';
import { PREVIEW_SIZES } from '../contract';
import type { CarrierId, RowDetail, ThemeOption } from '../contract';
import { renderUrl } from './api';
import { NeighbourStrip } from './NeighbourStrip';
import { ProseView } from './ProseView';
import { ReferenceCompare } from './ReferenceCompare';

interface SignStageProps {
  row: RowDetail;
  themes: readonly ThemeOption[];
  theme: string;
  onTheme: (theme: string) => void;
  sizeIndex: number;
  onSizeIndex: (index: number) => void;
  compareId: CarrierId | null;
  onCompare: (id: CarrierId | null) => void;
  blend: number;
  onBlend: (value: number) => void;
}

/** Ab dieser Stufe reicht eine einzelne, große Ansicht; darunter zählt die echte Pixelgröße. */
const GROSSE_STUFE = 128;

export function SignStage(props: SignStageProps): JSX.Element {
  const { row, theme } = props;
  const size = PREVIEW_SIZES[props.sizeIndex];
  const klein = size < GROSSE_STUFE;
  const compare = row.neighbours.find((entry) => entry.id === props.compareId);
  // Der Vertrag führt `hasDrawing` nur in der Kurzfassung; im Detailsatz ergibt es sich aus der
  // Trägerart: Quellen- und Profilzeilen tragen kein Zeichen, sondern Text.
  const hatZeichen = row.kind === 'manifest';

  return (
    <main className="spalte spalte--mitte" aria-label="Zeichen">
      <div className="buehnenleiste">
        <div className="gruppe" role="group" aria-label="Theme">
          <span className="gruppe__marke">Theme</span>
          {props.themes.map((option) => (
            <button
              key={option.id}
              type="button"
              className="knopf"
              aria-pressed={option.id === theme}
              onClick={() => props.onTheme(option.id)}
            >
              {option.label}
            </button>
          ))}
        </div>
        <div className="gruppe" role="group" aria-label="Größenstufe">
          <span className="gruppe__marke">Größe</span>
          {PREVIEW_SIZES.map((stufe, index) => (
            <button
              key={stufe}
              type="button"
              className="knopf"
              aria-pressed={index === props.sizeIndex}
              onClick={() => props.onSizeIndex(index)}
            >
              {stufe}
            </button>
          ))}
        </div>
      </div>

      {hatZeichen ? (
        <>
          <div className="buehne">
            {klein ? (
              <div className="buehne__feld">
                <span className="buehne__marke">Tatsächlich {size} px</span>
                <img
                  className="buehne__bild buehne__bild--echt"
                  src={renderUrl(row.id, theme, size)}
                  alt={`${row.title} bei ${size} Pixeln`}
                  width={size}
                  height={size}
                />
              </div>
            ) : null}
            <div className="buehne__feld">
              <span className="buehne__marke">
                {klein ? `${size} px, vergrößert` : `${size} px`}
              </span>
              <img
                className="buehne__bild buehne__bild--gross"
                src={renderUrl(row.id, theme, size)}
                alt={row.title}
              />
            </div>
            {compare !== undefined ? (
              <div className="buehne__feld">
                <span className="buehne__marke">Vergleich: {compare.label}</span>
                <img
                  className="buehne__bild buehne__bild--gross"
                  src={renderUrl(compare.id, theme, size)}
                  alt={compare.title}
                />
              </div>
            ) : null}
          </div>

          {row.carrierContext !== undefined ? (
            <p className="traegerhinweis">
              <strong>Trägerzeichen — nur Kontext</strong>
              {row.carrierContext.explanation} Geprüft wird ausschließlich das Element dieser Zeile,
              nicht der Träger ({row.carrierContext.host}).
            </p>
          ) : null}
        </>
      ) : (
        <div className="hinweis">
          Diese Zeile trägt kein Zeichen. Geprüft wird der Text unten:{' '}
          {row.kind === 'source' ? 'eine Quelle' : 'ein Profil'}.
        </div>
      )}

      {row.prose !== undefined && row.prose.length > 0 ? <ProseView sections={row.prose} /> : null}

      <NeighbourStrip
        neighbours={row.neighbours}
        theme={theme}
        selected={props.compareId}
        onSelect={props.onCompare}
      />

      <ReferenceCompare
        row={row}
        theme={theme}
        blend={props.blend}
        onBlend={props.onBlend}
      />
    </main>
  );
}
