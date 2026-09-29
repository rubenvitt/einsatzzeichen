import type { BodyMarkId } from './taxonomy.js';

/**
 * Zweite und weitere Fassungen einer Körpermarke an **derselben** Körperfassung (LFH-786).
 *
 * Anhang C zeichnet dieselbe Fähigkeit am selben Landfahrzeug in der Haupt- und in der
 * Alternativdarstellung verschieden: die Drehleiter in C.2.14 bis C.2.16 je nach Länge des
 * Laufs 6,5 mm weiter rechts, die CBRN-Zange in C.2.20 und C.2.25 ohne Lauf mittig und größer.
 * Aus dem Beschriftungskontext lässt sich das nicht ableiten: C.2.16#alternative und
 * C.2.15#alternative enden mit ihrem Lauf auf derselben Tinte und zeichnen trotzdem verschieden.
 * Die Fassung steht deshalb ausdrücklich in der Spec, als Kennung aus dieser geschlossenen Liste.
 *
 * Die Kennungen sind **geometrisch** benannt und nicht nach Haupt oder Alternative: sie sagen,
 * wie die Fassung von der Grundfassung des Paars abweicht, nicht, in welcher Referenzdatei sie
 * zuerst vorkam. Jede Kennung ist nur an den Paaren aus Fähigkeit und Körperfassung vermessen,
 * an denen `core/src/geometry/body-marks-anhang-c/` sie führt; an jedem anderen Paar wirft
 * `bodyMark()`, statt auf die Grundfassung zurückzufallen.
 */
export const BODY_MARK_RENDITION_IDS = Object.freeze([
  'shifted-right-6.5mm',
  'shifted-right-6.5mm-ladder-raised-1mm',
  'shifted-left-1mm',
  'shifted-left-7mm-jib-5mm',
  'shifted-left-4mm',
  'centered-large-tongs',
  'raised-wave-3mm-arrow-3mm',
] as const);

export type BodyMarkRenditionId = (typeof BODY_MARK_RENDITION_IDS)[number];

/** Die gewählte Fassung je Körpermarke einer Spec; fehlt eine Marke, gilt ihre Grundfassung. */
export type BodyMarkRenditions = Readonly<Partial<Record<BodyMarkId, BodyMarkRenditionId>>>;
