/**
 * Tastaturhilfe (`?`) und die dauerhafte Fußzeile. Beide lesen dieselbe Liste aus `shortcuts.ts`,
 * damit Anzeige und Verhalten nicht auseinanderlaufen.
 */
import type { JSX } from 'react';
import { SHORTCUT_HELP } from './shortcuts';

export function HelpOverlay({ onClose }: { onClose: () => void }): JSX.Element {
  return (
    <div className="hilfe" role="dialog" aria-label="Tastaturkürzel">
      <h2>Tastaturkürzel</h2>
      <table>
        <tbody>
          {SHORTCUT_HELP.map((entry) => (
            <tr key={entry.keys}>
              <td>
                <kbd>{entry.keys}</kbd>
              </td>
              <td>{entry.description}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="statuszeile">
        Kürzel ruhen, solange der Fokus in einem Text- oder Notizfeld steht.
      </p>
      <button type="button" className="knopf" onClick={onClose}>
        Schließen
      </button>
    </div>
  );
}

/** Die wichtigsten Kürzel dauerhaft am unteren Rand — dezent, damit sie nicht mitliest. */
export function ShortcutFooter(): JSX.Element {
  const wichtig = SHORTCUT_HELP.filter((entry) =>
    ['j / k', 'a', 'w', 'Enter', '/', '?'].includes(entry.keys),
  );
  return (
    <footer className="fusszeile">
      {wichtig.map((entry) => (
        <span key={entry.keys}>
          <kbd>{entry.keys}</kbd> {entry.description}
        </span>
      ))}
    </footer>
  );
}
