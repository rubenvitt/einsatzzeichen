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
  'bbk-babz-2025:4.3.3#primary': { status: 'pending' },
  'bbk-babz-2025:4.3.4#primary': { status: 'pending' },
  'bbk-babz-2025:4.3.5#primary': { status: 'pending' },
  'bbk-babz-2025:4.3.6#primary': { status: 'pending' },
  'bbk-babz-2025:4.4.1#primary': { status: 'pending' },
  'bbk-babz-2025:4.4.2#primary': { status: 'pending' },
  'bbk-babz-2025:4.4.3#primary': { status: 'pending' },
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
  'bbk-babz-2025:4.2.1#primary': { status: 'pending' },
  'bbk-babz-2025:4.2.2#primary': { status: 'pending' },
  'bbk-babz-2025:4.2.3#primary': { status: 'pending' },
  'bbk-babz-2025:4.2.4#primary': { status: 'pending' },
  'bbk-babz-2025:4.2.5#primary': { status: 'pending' },
  'bbk-babz-2025:4.5.1#primary': { status: 'pending' },
  'bbk-babz-2025:4.5.2#primary': { status: 'pending' },
  'bbk-babz-2025:4.5.3#primary': { status: 'pending' },
  'bbk-babz-2025:4.5.4#primary': { status: 'pending' },
  'bbk-babz-2025:4.5.5#primary': { status: 'pending' },
  'bbk-babz-2025:4.5.6#primary': { status: 'pending' },
  'bbk-babz-2025:4.5.7#primary': { status: 'pending' },
  'bbk-babz-2025:4.5.8#primary': { status: 'pending' },
  'bbk-babz-2025:4.6.1#primary': { status: 'pending' },
  'bbk-babz-2025:4.6.2#primary': { status: 'pending' },
  'bbk-babz-2025:4.6.3#primary': { status: 'pending' },
  'bbk-babz-2025:4.6.4#primary': { status: 'pending' },
  'bbk-babz-2025:4.6.5#primary': { status: 'pending' },
  'bbk-babz-2025:4.6.6#primary': { status: 'pending' },
  'bbk-babz-2025:4.7.1#primary': { status: 'pending' },
  'bbk-babz-2025:4.7.2#primary': { status: 'pending' },
  'bbk-babz-2025:4.7.3#primary': { status: 'pending' },
  'bbk-babz-2025:4.7.4#primary': { status: 'pending' },
  'bbk-babz-2025:4.7.5#primary': { status: 'pending' },
  'bbk-babz-2025:4.7.6#primary': { status: 'pending' },
  'bbk-babz-2025:4.7.7#primary': { status: 'pending' },
  'bbk-babz-2025:4.7.8#primary': { status: 'pending' },
  'bbk-babz-2025:4.7.9#primary': { status: 'pending' },
  'bbk-babz-2025:4.7.10#primary': { status: 'pending' },
  'bbk-babz-2025:4.7.10#alternative': { status: 'pending' },
  'bbk-babz-2025:4.7.11#primary': { status: 'pending' },
  'bbk-babz-2025:4.7.12#primary': { status: 'pending' },
  'bbk-babz-2025:4.7.13#primary': { status: 'pending' },
  'bbk-babz-2025:4.7.14#primary': { status: 'pending' },
  'bbk-babz-2025:4.7.15#primary': { status: 'pending' },
  'bbk-babz-2025:4.7.16#primary': { status: 'pending' },
  'bbk-babz-2025:4.7.17#primary': { status: 'pending' },
  'bbk-babz-2025:4.7.18#primary': { status: 'pending' },
  'bbk-babz-2025:4.7.19#primary': { status: 'pending' },
  'bbk-babz-2025:4.7.20#primary': { status: 'pending' },
  'bbk-babz-2025:4.7.21#primary': { status: 'pending' },
  'bbk-babz-2025:4.7.22#primary': { status: 'pending' },
  'bbk-babz-2025:4.7.23#primary': { status: 'pending' },
  'bbk-babz-2025:4.7.24#primary': { status: 'pending' },
  'bbk-babz-2025:4.7.25#primary': { status: 'pending' },
  'bbk-babz-2025:4.7.26#primary': { status: 'pending' },
  'bbk-babz-2025:4.7.27#primary': { status: 'pending' },
  'bbk-babz-2025:4.7.28#primary': { status: 'pending' },
  'bbk-babz-2025:4.8.1#primary': { status: 'pending' },
  'bbk-babz-2025:4.8.2#primary': { status: 'pending' },
  'bbk-babz-2025:4.8.3#primary': { status: 'pending' },
  'bbk-babz-2025:4.8.4#primary': { status: 'pending' },
  'bbk-babz-2025:4.8.5#primary': { status: 'pending' },
  'bbk-babz-2025:4.8.6#primary': { status: 'pending' },
  'bbk-babz-2025:4.8.7#primary': { status: 'pending' },
  'bbk-babz-2025:4.8.8#primary': { status: 'pending' },
  'bbk-babz-2025:4.8.9#primary': { status: 'pending' },
  'bbk-babz-2025:4.8.10#primary': { status: 'pending' },
  'bbk-babz-2025:4.8.11#primary': { status: 'pending' },
  'bbk-babz-2025:4.8.12#primary': { status: 'pending' },
  'bbk-babz-2025:4.8.13#primary': { status: 'pending' },
  'bbk-babz-2025:4.8.14#primary': { status: 'pending' },
  'bbk-babz-2025:4.8.15#primary': { status: 'pending' },
  'bbk-babz-2025:4.8.16#primary': { status: 'pending' },
  'bbk-babz-2025:4.9.1#primary': { status: 'pending' },
  'bbk-babz-2025:4.10.1#primary': { status: 'pending' },
  'bbk-babz-2025:4.10.2#primary': { status: 'pending' },
  'bbk-babz-2025:4.10.3#primary': { status: 'pending' },
  'bbk-babz-2025:4.10.4#primary': { status: 'pending' },
  'bbk-babz-2025:4.10.5#primary': { status: 'pending' },
  'bbk-babz-2025:4.10.6#primary': { status: 'pending' },
  'bbk-babz-2025:4.10.7#primary': { status: 'pending' },
  'bbk-babz-2025:5.8.1.13#primary': { status: 'pending' },
  'bbk-babz-2025:5.8.1.13#alternative': { status: 'pending' },
  'bbk-babz-2025:5.8.1.14#primary': { status: 'pending' },
  'bbk-babz-2025:5.8.1.14#alternative': { status: 'pending' },
  'bbk-babz-2025:5.8.2.1#primary': { status: 'pending' },
  'bbk-babz-2025:5.8.2.2#primary': { status: 'pending' },
  'bbk-babz-2025:5.8.2.3#primary': { status: 'pending' },
  'bbk-babz-2025:5.8.2.4#primary': { status: 'pending' },
  'bbk-babz-2025:5.8.3.1#primary': { status: 'pending' },
  'bbk-babz-2025:5.8.3.2#primary': { status: 'pending' },
  'bbk-babz-2025:5.8.3.3#primary': { status: 'pending' },
  'bbk-babz-2025:5.8.4.1#primary': { status: 'pending' },
  'bbk-babz-2025:5.8.4.2#primary': { status: 'pending' },
  'bbk-babz-2025:5.8.4.3#primary': { status: 'pending' },
  'bbk-babz-2025:5.8.5.1#primary': { status: 'pending' },
  'bbk-babz-2025:5.8.5.2#primary': { status: 'pending' },
  'bbk-babz-2025:5.8.5.3#primary': { status: 'pending' },
  'bbk-babz-2025:5.8.6.1#primary': { status: 'pending' },
  'bbk-babz-2025:5.8.6.2#primary': { status: 'pending' },
  'bbk-babz-2025:5.8.6.2#alternative': { status: 'pending' },
  'bbk-babz-2025:5.8.6.3#primary': { status: 'pending' },
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
export const SOURCE_DOMAIN_REVIEWS = deepFreeze({
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
} satisfies Record<SourceId, Review>);

export function sourceDomainReviewFor(id: SourceId): DeepReadonly<Review> {
  return SOURCE_DOMAIN_REVIEWS[id];
}

/** Auch Profile besitzen einen expliziten Ledgerplatz; heute existiert nur der Bundeskern. */
export const PROFILE_DOMAIN_REVIEWS = deepFreeze({
  bund: { status: 'pending' },
} satisfies Record<ProfileId, Review>);

export function profileDomainReviewFor(id: ProfileId): DeepReadonly<Review> {
  return PROFILE_DOMAIN_REVIEWS[id];
}
