/**
 * Referenz und Eigenrendering. Der Regler legt beide übereinander — eine Abweichung zeigt sich am
 * Wandern der Kontur beim Überblenden deutlicher als im Nebeneinander. `r` klappt zwischen den
 * beiden Endlagen um; genau dieses Hin und Her macht den Unterschied sichtbar.
 *
 * Fehlt `taktische-zeichen/` lokal, ist das kein Fehlerzustand, sondern der Normalfall in einem
 * frischen Clone: die Referenzbilder werden wegen ungeklärter Nutzungsgrundlage nicht eingecheckt.
 * Deshalb steht hier ein ruhiger Hinweis mit dem Dateinamen und keine Fehlermeldung.
 */
import type { JSX } from 'react';
import type { RowDetail } from '../contract';
import { referenceUrl, renderUrl } from './api';

interface ReferenceCompareProps {
  row: RowDetail;
  theme: string;
  /** 0 = nur Referenz, 100 = nur Eigenrendering. */
  blend: number;
  onBlend: (value: number) => void;
}

export function ReferenceCompare(props: ReferenceCompareProps): JSX.Element | null {
  const { row } = props;
  if (row.referenceAsset === undefined) return null;

  if (!row.referenceAvailable) {
    return (
      <section className="abschnitt">
        <h2>Referenzvergleich</h2>
        <div className="hinweis">
          Referenzasset <strong className="mono">{row.referenceAsset}</strong> liegt lokal nicht
          vor. Der Ordner <code>taktische-zeichen/</code> wird nicht eingecheckt; ohne ihn ist kein
          Referenzvergleich möglich. Alles andere auf dieser Seite bleibt beurteilbar.
        </div>
      </section>
    );
  }

  return (
    <section className="abschnitt">
      <h2>Referenzvergleich</h2>
      <p className="statuszeile">
        Referenzasset <span className="mono">{row.referenceAsset}</span>
      </p>
      <div className="vergleich">
        <div className="buehne__feld">
          <span className="buehne__marke">Referenz</span>
          <img
            className="buehne__bild"
            src={referenceUrl(row.id)}
            alt={`Referenzdarstellung zu ${row.title}`}
            width={220}
            height={220}
          />
        </div>
        <div className="buehne__feld">
          <span className="buehne__marke">Eigenrendering</span>
          <img
            className="buehne__bild"
            src={renderUrl(row.id, props.theme, 256)}
            alt={`Eigenrendering zu ${row.title}`}
            width={220}
            height={220}
          />
        </div>
        <div className="buehne__feld">
          <span className="buehne__marke">Überblendung</span>
          <div className="ueberblendung">
            <img src={referenceUrl(row.id)} alt="" />
            <img
              src={renderUrl(row.id, props.theme, 256)}
              alt=""
              style={{ opacity: props.blend / 100 }}
            />
          </div>
          <label className="regler">
            <span>Eigenrendering {props.blend} % über der Referenz</span>
            <input
              type="range"
              min={0}
              max={100}
              value={props.blend}
              onChange={(event) => props.onBlend(Number(event.target.value))}
            />
          </label>
        </div>
      </div>
    </section>
  );
}
