/**
 * Einrichtungskarte für den ersten Start. Ohne Registereintrag schreibt das Werkzeug nichts —
 * nicht aus Formalismus: `domain: approved` behauptet eine Prüfung durch eine Person mit
 * einsatztaktischer Fachkunde. Ohne benannte, zurechenbare Person wäre das eine erfundene
 * Freigabe, und genau die verbietet die Übergabe ausdrücklich.
 */
import { useState } from 'react';
import type { FormEvent, JSX } from 'react';

interface ReviewerSetupProps {
  onCreate: (record: { id: string; name: string; qualification: string }) => Promise<void>;
  error: string | null;
}

export function ReviewerSetup(props: ReviewerSetupProps): JSX.Element {
  const [id, setId] = useState('');
  const [name, setName] = useState('');
  const [qualification, setQualification] = useState('');
  const [busy, setBusy] = useState(false);

  const complete = id.trim() !== '' && name.trim() !== '' && qualification.trim() !== '';

  async function submit(event: FormEvent): Promise<void> {
    event.preventDefault();
    if (!complete || busy) return;
    setBusy(true);
    try {
      await props.onCreate({
        id: id.trim(),
        name: name.trim(),
        qualification: qualification.trim(),
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="karte setup">
      <h2>Reviewer-Register anlegen</h2>
      <p>
        Ein abgeschlossenes Fachreview muss einer Person zurechenbar sein: Name und fachlicher
        Hintergrund gehören zum Befund, nicht nur der Status. Solange das Register leer ist,
        schreibt dieses Werkzeug nichts in den Ledger.
      </p>
      <form className="formular" onSubmit={submit}>
        <label>
          Kennung — kurz und stabil, sie steht später im Ledger
          <input value={id} onChange={(event) => setId(event.target.value)} autoComplete="off" />
        </label>
        <label>
          Name
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            autoComplete="off"
          />
        </label>
        <label>
          Einsatztaktische Qualifikation — Funktion oder Ausbildung, die die Fachkunde belegt
          <input
            value={qualification}
            onChange={(event) => setQualification(event.target.value)}
            autoComplete="off"
          />
        </label>
        <button type="submit" className="speichern" disabled={!complete || busy}>
          {busy ? 'Wird angelegt …' : 'Prüfer anlegen'}
        </button>
        {props.error !== null ? (
          <p className="meldung meldung--sperre">{props.error}</p>
        ) : null}
      </form>
    </section>
  );
}
