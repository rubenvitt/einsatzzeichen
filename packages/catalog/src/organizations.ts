import type { ColorToken, OrganizationId } from '@einsatzzeichen/schema';

/**
 * Aus Kapitel 2 der BBK/BABZ-Empfehlung abgeleitet, Werte per `pnpm cli audit:reference`
 * gegen `fingerprints.json` belegt. **Seit LFH-424 vollständig: acht Organisationsflecken für acht
 * `OrganizationId`-Werte.**
 *
 * `hilfsorganisation` fehlte bis dahin mit der Begründung, Kapitel 2 enthalte dafür keine
 * Referenzdatei. Das ist widerlegt: `2.2_Organisationen.svg` trägt einen vollflächigen Fleck
 * `#ffffff` über 0/0/32/32 — exakt die Bauform von 2.1 und 2.3 bis 2.8 — und seine Typo-Ebene
 * liest gerastert **„HiOrg"** (eigene Rasterung mit `@resvg/resvg-js`, 18. August 2026, im
 * Paarbild neben 2.3 „THW" und 2.1 „Fw"). Der generische Dateiname hatte drei Dokumente zu der
 * Annahme verleitet, es handle sich um eine Legende.
 *
 * Strukturelle Gegenprobe: genau **acht** Dateien aus Kapitel 2 tragen einen vollflächigen Fleck
 * **und** eine Typo-Ebene (2.1 bis 2.8). Die reinen Farbtafeln 2.9 bis 2.13 haben keine.
 *
 * **Vorbehalt, der zu diesem Wert gehört:** `#ffffff` ist im Bestand zugleich die neutrale
 * Grundfüllung. Ein gerendertes Zeichen mit `hilfsorganisation` ist von einem organisationslosen
 * farblich nicht unterscheidbar. Das ist eine Eigenschaft der Quelle, kein Umsetzungsfehler — und
 * der Grund, warum die Kontursignatur in `render-themes.ts` hier mehr trägt als bei den übrigen
 * sieben.
 */
export const ORGANIZATION_COLORS = {
  feuerwehr: 'rot',
  thw: 'blau',
  'fuehrung-leitung': 'gelb',
  polizei: 'gruen',
  bundeswehr: 'braun',
  'sonstige-gefahrenabwehr': 'orange',
  'zivile-einheiten': 'hellgrau',
  hilfsorganisation: 'weiss',
} as const satisfies Partial<Record<OrganizationId, ColorToken>>;

/**
 * Weit getypter Blick auf `ORGANIZATION_COLORS` für die Suche über alle `OrganizationId`-Werte.
 * `ORGANIZATION_COLORS` selbst bleibt eng getypt (nur die sieben belegten Schlüssel), damit die
 * Vollständigkeitsprüfung in organizations.test.ts an `keyof typeof ORGANIZATION_COLORS` greift.
 */
const colorsByOrganization: Partial<Record<OrganizationId, ColorToken>> = ORGANIZATION_COLORS;

/**
 * Wirft, wenn die Organisation im Referenzumfang dieses Slice nicht belegt ist. Seit alle acht
 * `OrganizationId`-Werte belegt sind, ist der Wurf unerreichbar — er bleibt trotzdem stehen: der
 * Typ ist weiterhin `Partial<Record<…>>`, und eine künftige Erweiterung von `OrganizationId` soll
 * hier auffallen statt `undefined` weiterzureichen.
 */
export function organizationColor(id: OrganizationId): ColorToken {
  const color = colorsByOrganization[id];
  if (color === undefined) {
    throw new Error(
      `Keine Organisationsfarbe für "${id}" — Kapitel 2 des Referenzbestands enthält dafür keine Datei.`,
    );
  }
  return color;
}
