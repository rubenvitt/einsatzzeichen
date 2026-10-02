import { tokenizePath, type PathCommand } from '../path-commands.js';

/**
 * Punktweise Abbildung eines Pfads nach der Autorenkonvention von `tokenizePath` (nur die sieben
 * absoluten Kommandos `M L H V C Q Z`).
 *
 * **Warum es das braucht.** Bis zum Umbau vom 2. Oktober 2026 lehnte `shiftY` jeden Pfad ab: kein
 * Pfadkörper trug je eine Kopfzone. Seit die Kopfzone an allen Grundzeichen steht, rücken auch
 * die Pfadkörper (Landfahrzeug, Luft- und Wasserfahrzeug, Anhänger, Wechsellader, Fläche,
 * Spontanhelfer) unter einen Kopf. Weil die Konvention nur absolute Kommandos kennt, ist die
 * Abbildung exakt: jede Koordinate wird einzeln abgebildet, `H` trägt nur ein x, `V` nur ein y.
 *
 * Ein Pfad mit Befund der Zerlegung wird **nicht** teilweise abgebildet, sondern abgelehnt —
 * `tokenizePath` verwirft dann Zahlen, und ein halb verschobener Pfad wäre ein stiller Fehler.
 */
export function mapPathPoints(
  d: string,
  map: (x: number, y: number) => readonly [number, number],
): string {
  const { commands, problems } = tokenizePath(d);
  if (problems.length > 0) {
    throw new Error(`Pfad nicht abbildbar: ${problems.join(' ')}`);
  }
  return commands.map((command) => serialize(command, map)).join(' ');
}

/** Senkrechte Verschiebung eines Pfads um `deltaMm`. */
export function shiftPathY(d: string, deltaMm: number): string {
  return mapPathPoints(d, (x, y) => [x, y + deltaMm]);
}

/**
 * Sechs Nachkommastellen: weit unter der Vergleichstoleranz der Gates (0,01 mm) und frei vom
 * Gleitkommarauschen einer Addition (`26 + 0.25` bleibt `26.25`).
 */
function format(value: number): string {
  const rounded = Math.round(value * 1e6) / 1e6;
  return String(Object.is(rounded, -0) ? 0 : rounded);
}

function serialize(
  command: PathCommand,
  map: (x: number, y: number) => readonly [number, number],
): string {
  const n = command.numbers;
  const pairs = (count: number): string =>
    Array.from({ length: count }, (_, i) => {
      const [x, y] = map(n[i * 2]!, n[i * 2 + 1]!);
      return `${format(x)} ${format(y)}`;
    }).join(' ');
  switch (command.command) {
    case 'M':
    case 'L':
      return `${command.command} ${pairs(1)}`;
    case 'C':
      return `C ${pairs(3)}`;
    case 'Q':
      return `Q ${pairs(2)}`;
    // `H` und `V` tragen nur eine Koordinate. Die Abbildungen dieses Moduls sind achsgetrennt
    // (Verschiebung, Streckung um einen Punkt): die andere Koordinate ist für das Ergebnis
    // gleichgültig und wird mit 0 belegt.
    case 'H':
      return `H ${format(map(n[0]!, 0)[0])}`;
    case 'V':
      return `V ${format(map(0, n[0]!)[1])}`;
    case 'Z':
      return 'Z';
  }
}
