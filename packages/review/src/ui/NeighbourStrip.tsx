/**
 * Der Nachbarschaftsstreifen. Verwechslungsfreiheit ist ein Prüfkriterium der Übergabe und lässt
 * sich nur am Nebeneinander beurteilen. Ein Klick stellt die Kachel neben das Hauptzeichen — er
 * navigiert bewusst nicht zu ihr: dafür ist die Liste links da, und ein Sprung würde die gerade
 * begonnene Notiz aus dem Blick nehmen.
 */
import type { JSX } from 'react';
import type { CarrierId, NeighbourRef } from '../contract';
import { renderUrl } from './api';

interface NeighbourStripProps {
  neighbours: readonly NeighbourRef[];
  theme: string;
  selected: CarrierId | null;
  onSelect: (id: CarrierId | null) => void;
}

export function NeighbourStrip(props: NeighbourStripProps): JSX.Element | null {
  if (props.neighbours.length === 0) return null;
  return (
    <section className="abschnitt">
      <h2>Nachbarschaft im selben Abschnitt</h2>
      <p className="statuszeile">
        Eine Kachel anklicken, um sie neben das Hauptzeichen zu stellen; erneut anklicken beendet
        den Vergleich.
      </p>
      <div className="nachbarn">
        {props.neighbours.map((neighbour) => {
          const active = neighbour.id === props.selected;
          return (
            <button
              key={neighbour.id}
              type="button"
              className="nachbar"
              aria-pressed={active}
              title={neighbour.title}
              onClick={() => props.onSelect(active ? null : neighbour.id)}
            >
              <img src={renderUrl(neighbour.id, props.theme, 64)} alt="" loading="lazy" />
              <span className="nachbar__label">{neighbour.label}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
