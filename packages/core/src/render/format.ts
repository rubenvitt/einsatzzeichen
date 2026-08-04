/** Rundet auf drei Nachkommastellen und entfernt nachlaufende Nullen. */
export function formatUnits(value: number): string {
  const rounded = Math.round(value * 1000) / 1000;
  // -0 soll als 0 ausgegeben werden.
  return String(rounded === 0 ? 0 : rounded);
}

export function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
