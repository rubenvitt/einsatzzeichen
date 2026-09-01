/**
 * Die Schwärzung aus Spec §5.3 für sich: was die Website an Referenzdateinamen **nicht**
 * ausliefern darf, entscheidet genau ein Muster an genau einer Stelle. Ein zweites daneben wäre
 * eine zweite Antwort auf dieselbe rechtliche Frage.
 */

/**
 * Referenzdateinamen in Prosa. Mehrere technische Reviewnotizen des Manifests zitieren die Datei,
 * gegen die sie geprüft haben — `4.1.3_Dekontaminieren.svg`, `F.1.1_Medizinische Task Force.svg`.
 * Der Name der Referenzdatei ist genau das, was die Website nicht ausliefern darf (Spec §5.3), und
 * die fachliche Aussage der Notiz hängt nicht an ihm.
 */
const REFERENCE_FILENAME = /[A-Za-z0-9.]+_[^`"„“]*?\.svg/g;

/**
 * Ersetzt Referenzdateinamen durch eine sichtbare Marke statt sie stillschweigend zu entfernen.
 * Bleibt danach ein `.svg` stehen, bricht die Erzeugung ab: ein unerkanntes Muster soll auffallen
 * und nicht durchrutschen (Spec §7).
 */
export function withoutReferenceFilenames(text: string): string {
  const redacted = text.replace(REFERENCE_FILENAME, '[Referenzdatei]');
  if (redacted.includes('.svg')) {
    throw new Error(
      `Ein Referenzdateiname bleibt nach der Schwärzung stehen: "${redacted}". Das Muster in ` +
        '`REFERENCE_FILENAME` erfasst ihn nicht.',
    );
  }
  return redacted;
}
