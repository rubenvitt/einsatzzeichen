import type { ProfileId, Review, SourceId } from '@einsatzzeichen/schema';
import { deepFreeze, type DeepReadonly } from './readonly-data.js';

/**
 * Fachreview-Ledger des aktuellen Manifests, absichtlich mit genau einem eigenen Objekt je
 * Manifestschlüssel. Dadurch kann ein menschlicher Fachreviewer Einträge schrittweise freigeben,
 * ohne über ein gemeinsam referenziertes `Review` versehentlich weitere Einträge mitzuändern.
 *
 * Die Vollständigkeit und die identische Verdrahtung zum Manifest werden in
 * `domain-reviews.test.ts` in beide Richtungen geprüft. Ein neuer Manifest-Eintrag muss deshalb
 * hier bewusst als `pending` aufgenommen werden, bevor das Gate wieder grün wird.
 */
export const MANIFEST_DOMAIN_REVIEWS = deepFreeze({
  'bbk-babz-2025:1.1#primary': { status: 'pending' },
  'bbk-babz-2025:1.2#primary': { status: 'pending' },
  'bbk-babz-2025:1.6#primary': { status: 'pending' },
  'bbk-babz-2025:1.7#primary': { status: 'pending' },
  'bbk-babz-2025:1.8#primary': { status: 'pending' },
  'bbk-babz-2025:1.10#primary': { status: 'pending' },
  'bbk-babz-2025:1.11#primary': { status: 'pending' },
  'bbk-babz-2025:1.12#primary': { status: 'pending' },
  'bbk-babz-2025:C.1.1#primary': { status: 'pending' },
  'bbk-babz-2025:C.1.2#primary': { status: 'pending' },
  'bbk-babz-2025:D.3.7#primary': { status: 'pending' },
  'bbk-babz-2025:2.1#primary': { status: 'pending' },
  'bbk-babz-2025:2.3#primary': { status: 'pending' },
  'bbk-babz-2025:2.4#primary': { status: 'pending' },
  'bbk-babz-2025:2.5#primary': { status: 'pending' },
  'bbk-babz-2025:2.6#primary': { status: 'pending' },
  'bbk-babz-2025:2.7#primary': { status: 'pending' },
  'bbk-babz-2025:2.8#primary': { status: 'pending' },
  'bbk-babz-2025:5.4.1#primary': { status: 'pending' },
  'bbk-babz-2025:5.4.2#primary': { status: 'pending' },
  'bbk-babz-2025:5.4.3#primary': { status: 'pending' },
  'bbk-babz-2025:5.4.4#primary': { status: 'pending' },
  'bbk-babz-2025:4.3.1#primary': { status: 'pending' },
  'bbk-babz-2025:4.3.2#primary': { status: 'pending' },
  'bbk-babz-2025:4.1.1#primary': { status: 'pending' },
  'bbk-babz-2025:4.1.2#primary': { status: 'pending' },
  'bbk-babz-2025:4.1.3#primary': { status: 'pending' },
  'bbk-babz-2025:4.1.4#primary': { status: 'pending' },
  'bbk-babz-2025:4.1.5#primary': { status: 'pending' },
  'bbk-babz-2025:4.1.6#primary': { status: 'pending' },
  'bbk-babz-2025:4.1.6#alternative': { status: 'pending' },
  'bbk-babz-2025:4.1.7#primary': { status: 'pending' },
  'bbk-babz-2025:4.1.7#alternative': { status: 'pending' },
  'bbk-babz-2025:4.1.8#primary': { status: 'pending' },
  'bbk-babz-2025:4.1.8#alternative': { status: 'pending' },
} satisfies Record<string, Review>);

export type ManifestDomainReviewKey = keyof typeof MANIFEST_DOMAIN_REVIEWS;

/** Wirft bei einer nicht inventarisierten Manifestzeile statt still ein Sammelreview zu nutzen. */
export function manifestDomainReviewFor(key: string): DeepReadonly<Review> {
  if (!Object.prototype.hasOwnProperty.call(MANIFEST_DOMAIN_REVIEWS, key)) {
    throw new Error(`Kein Fachreview-Ledger-Eintrag für "${key}".`);
  }
  return MANIFEST_DOMAIN_REVIEWS[key as ManifestDomainReviewKey];
}

/** Eigene fachliche Reviewentscheidung je Quelle; technische Reviews bleiben separat. */
export const SOURCE_DOMAIN_REVIEWS = {
  'bbk-babz-2025': { status: 'pending' },
  'babz-svg-2025': { status: 'pending' },
  'babz-hinweise-2024': { status: 'pending' },
  'skk-2010': { status: 'pending' },
  'fwdv-100': { status: 'pending' },
  'fwdv-800': { status: 'pending' },
  'thw-einheiten': { status: 'pending' },
  'phjardas-tz': { status: 'pending' },
  'din-14033': { status: 'pending' },
  'din-13050': { status: 'pending' },
  'din-14034-6': { status: 'pending' },
  'din-14095': { status: 'pending' },
} satisfies Record<SourceId, Review>;

export function sourceDomainReviewFor(id: SourceId): Review {
  return SOURCE_DOMAIN_REVIEWS[id];
}

/** Auch Profile besitzen einen expliziten Ledgerplatz; heute existiert nur der Bundeskern. */
export const PROFILE_DOMAIN_REVIEWS = {
  bund: { status: 'pending' },
} satisfies Record<ProfileId, Review>;

export function profileDomainReviewFor(id: ProfileId): Review {
  return PROFILE_DOMAIN_REVIEWS[id];
}
