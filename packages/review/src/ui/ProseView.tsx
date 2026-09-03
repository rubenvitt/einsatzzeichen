/**
 * Quellen- und Profilzeilen tragen kein Zeichen. Ihr Prüfgegenstand ist Text: Nutzungsgrundlage,
 * Beschaffungsstand und Umgang mit der Geometrie. Er steht deshalb an der Stelle, an der sonst das
 * Zeichen steht — die Zeile ist genauso ein Reviewträger wie die anderen 544.
 */
import type { JSX } from 'react';
import type { ProseSection } from '../contract';

export function ProseView({ sections }: { sections: readonly ProseSection[] }): JSX.Element {
  return (
    <section className="abschnitt">
      {sections.map((section) => (
        <article key={section.heading} className="karte" style={{ marginBottom: 10 }}>
          <h3>{section.heading}</h3>
          <p style={{ margin: '4px 0 0', whiteSpace: 'pre-wrap' }}>{section.body}</p>
        </article>
      ))}
    </section>
  );
}
