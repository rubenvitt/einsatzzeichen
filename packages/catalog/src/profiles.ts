import type { ProfileId, ProfileRecord } from '@einsatzzeichen/schema';

/**
 * Die registrierten Profile. Der bundesweite Kern ist der erste Eintrag — ein Profilfeld ohne
 * einen einzigen Nutzer wäre genau der YAGNI-Befund, den die Entscheidungsnotiz vom 4. August
 * 2026 festhält. Ein zweites Profil ist reines Hinzufügen: ein Literal in `ProfileId`, ein
 * Eintrag hier, Einträge mit dem neuen Wert. Kein Umbau bestehender Daten.
 *
 * Dieser Slice baut bewusst **keinen** Overlay-Mechanismus: ein Profil kann keine Kerneinträge
 * überschreiben oder ergänzen. Es gibt kein belegtes zweites Profil, gegen das sich eine
 * Auflösungsreihenfolge prüfen ließe.
 */
export const PROFILES: Record<ProfileId, ProfileRecord> = {
  bund: {
    id: 'bund',
    title: 'Bundesweiter Kern',
    version: '0.1.0',
    sources: ['bbk-babz-2025', 'babz-svg-2025'],
    verifiedAgainstCore: '0.1.0',
    review: {
      technical: {
        status: 'approved',
        reviewer: 'rv',
        date: '2026-08-05',
        note: 'Versionsfelder und Quellenbezüge sind vom Coverage-Gate geprüft.',
      },
      domain: { status: 'pending' },
    },
  },
} satisfies Record<ProfileId, ProfileRecord>;

/** Wirft, wenn die ID kein registriertes Profil bezeichnet — wie `organizationColor`. */
export function profileFor(id: ProfileId): ProfileRecord {
  const record: ProfileRecord | undefined = PROFILES[id];
  if (record === undefined) {
    throw new Error(`Kein registriertes Profil "${id}".`);
  }
  return record;
}
