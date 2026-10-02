/**
 * Ein Wert aus genau den Datenformen, die `BodyLabels` kennt: Zahl, Zeichenkette, ein echtes Feld
 * aus solchen oder ein normales Objekt mit eigenen, aufzählbaren Datenfeldern. Kopiert und
 * eingefroren, damit kein Accessor oder Proxy in einer Metrik die geprüfte Ansicht nachträglich
 * ändert. `undefined` heißt: diese Form ist nicht zulässig.
 */
export function plainLabelValue(value: unknown): { readonly value: unknown } | undefined {
  if (value === null || typeof value !== 'object') return { value };
  if (Array.isArray(value)) {
    if (Object.getPrototypeOf(value) !== Array.prototype) return undefined;
    const items: unknown[] = [];
    for (const key of Reflect.ownKeys(value)) {
      if (key === 'length') continue;
      const descriptor = Object.getOwnPropertyDescriptor(value, key);
      if (typeof key !== 'string' || descriptor?.enumerable !== true || !Object.hasOwn(descriptor, 'value')) {
        return undefined;
      }
      if (typeof descriptor.value === 'object' && descriptor.value !== null) return undefined;
      items[Number(key)] = descriptor.value;
    }
    return { value: Object.freeze(items) };
  }
  const prototype = Object.getPrototypeOf(value);
  if (prototype !== Object.prototype && prototype !== null) return undefined;
  const copy = Object.create(null) as Record<string, unknown>;
  for (const key of Reflect.ownKeys(value)) {
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    if (typeof key !== 'string' || descriptor?.enumerable !== true || !Object.hasOwn(descriptor, 'value')) {
      return undefined;
    }
    if (typeof descriptor.value === 'object' && descriptor.value !== null) return undefined;
    copy[key] = descriptor.value;
  }
  return { value: Object.freeze(copy) };
}
