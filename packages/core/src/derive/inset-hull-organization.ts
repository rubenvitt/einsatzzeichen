import type { BodyVariantId, OrganizationId, SymbolKind } from '@einsatzzeichen/schema';
import { noteDerivation } from './record.js';

/**
 * Organisation am eingesenkten Rumpf des Einsatzboots (`vehicle-water` / `inset-hull`, Anhang I.3).
 *
 * Vermessen sind zwei Fassungen: die weiße Hilfsorganisation (I.3.5 bis I.3.7) und das rote
 * Feuerwehr-Einsatzboot. Jede andere Organisation und das Boot ohne Organisation färbt der Motor
 * wie an jedem geschlossenen Körper: Füllung in der Organisationsfarbe, Kontur und Lage des
 * Rumpfs unverändert (Eigentümerentscheid vom 02.10.2026: zulassen, abgeleitet). Ohne
 * Organisation bleibt der Rumpf ungefüllt wie jedes Grundzeichen und gleicht damit auf weißer
 * Oberfläche der HiOrg-Fassung.
 */
const MEASURED_INSET_HULL_ORGANIZATIONS: ReadonlySet<OrganizationId> = new Set<OrganizationId>([
  'hilfsorganisation',
  'feuerwehr',
]);

export function noteInsetHullOrganization(
  kind: SymbolKind,
  variant: BodyVariantId | undefined,
  organization: OrganizationId | undefined,
): void {
  if (kind !== 'vehicle-water' || variant !== 'inset-hull') return;
  if (organization !== undefined && MEASURED_INSET_HULL_ORGANIZATIONS.has(organization)) return;
  noteDerivation({
    dimension: 'organization',
    part:
      organization === undefined
        ? 'Einsatzbootrumpf ohne Organisation (ungefüllt)'
        : `Organisationsfüllung "${organization}" am Einsatzbootrumpf`,
    basis: 'transferred',
    from: 'I.3.5–I.3.7 (Hilfsorganisation) und Feuerwehr-Einsatzboot: Füllung des Rumpfs in der Organisationsfarbe',
  });
}
