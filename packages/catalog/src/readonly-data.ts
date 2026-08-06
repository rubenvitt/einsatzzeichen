/**
 * Tiefe Readonly-Sicht für die ausschließlich azyklischen Plain-Data-Objekte und Arrays des
 * Katalogs. Funktionen, Klasseninstanzen, Map und Set gehören bewusst nicht zu diesem Vertrag.
 */
export type DeepReadonly<T> = T extends object
  ? { readonly [Key in keyof T]: DeepReadonly<T[Key]> }
  : T;

/**
 * Friert Kinder vor ihren Eltern ein. Unterstützt ausschließlich primitive Werte, azyklische
 * Arrays und Objekte mit `Object.prototype`; andere Objektarten werden explizit abgewiesen.
 */
export function deepFreeze<T>(value: T): DeepReadonly<T>;
export function deepFreeze(value: unknown): unknown {
  if (typeof value === 'function') {
    throw new TypeError('deepFreeze unterstützt keine Funktionen.');
  }
  if (value === null || typeof value !== 'object') return value;
  if (!Array.isArray(value) && Object.getPrototypeOf(value) !== Object.prototype) {
    throw new TypeError('deepFreeze unterstützt nur azyklische Plain-Data-Objekte und Arrays.');
  }

  for (const child of Object.values(value)) deepFreeze(child);
  return Object.freeze(value);
}
