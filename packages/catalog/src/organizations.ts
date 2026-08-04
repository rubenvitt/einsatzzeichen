import type { ColorToken, OrganizationId } from '@einsatzzeichen/schema';

/**
 * Aus Kapitel 2 der BBK/BABZ-Empfehlung abgeleitet, Werte per `pnpm cli audit:reference`
 * gegen `fingerprints.json` belegt. `hilfsorganisation` fehlt bewusst: Kapitel 2 enthält
 * dafür keine Referenzdatei, und der Katalog erfindet keine Farbe ohne Beleg.
 */
export const ORGANIZATION_COLORS = {
  feuerwehr: 'rot',
  thw: 'blau',
  'fuehrung-leitung': 'gelb',
  polizei: 'gruen',
  bundeswehr: 'braun',
  'sonstige-gefahrenabwehr': 'orange',
  'zivile-einheiten': 'hellgrau',
} as const satisfies Partial<Record<OrganizationId, ColorToken>>;

/**
 * Weit getypter Blick auf `ORGANIZATION_COLORS` für die Suche über alle `OrganizationId`-Werte.
 * `ORGANIZATION_COLORS` selbst bleibt eng getypt (nur die sieben belegten Schlüssel), damit die
 * Vollständigkeitsprüfung in organizations.test.ts an `keyof typeof ORGANIZATION_COLORS` greift.
 */
const colorsByOrganization: Partial<Record<OrganizationId, ColorToken>> = ORGANIZATION_COLORS;

/** Wirft, wenn die Organisation im Referenzumfang dieses Slice nicht belegt ist. */
export function organizationColor(id: OrganizationId): ColorToken {
  const color = colorsByOrganization[id];
  if (color === undefined) {
    throw new Error(
      `Keine Organisationsfarbe für "${id}" — Kapitel 2 des Referenzbestands enthält dafür keine Datei.`,
    );
  }
  return color;
}
