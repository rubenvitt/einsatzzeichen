/**
 * Alle Regelkennungen, die `validateFreestandingSpec` ausgeben kann — alphabetisch, wie
 * `VALIDATION_RULE_IDS` für `validateSpec`.
 *
 * Eine eigene Liste und keine Erweiterung von `VALIDATION_RULE_IDS`: jene Liste ist per
 * Quelltextscan mengengleich mit `validate.ts`, und ihre Zahl ist die Regelzahl der `SymbolSpec`.
 * Die freistehenden Zeichen haben eine eigene Prüfstelle (`validate-freestanding.ts`) und damit ein
 * eigenes Gate (`freestanding-rules.test.ts`), dasselbe Muster auf der neuen Spec-Art. Der
 * Regelkatalog führt sie als `FREESTANDING_RULE_CATALOG`, die Erklärungen als
 * `FREESTANDING_RULE_EXPLANATIONS`.
 */
export const FREESTANDING_RULE_IDS: readonly string[] = Object.freeze([
  'animal-state-variant-not-available',
  'line-strength-mismatch',
  'line-variant-not-available',
  'weather-intensity-without-precipitation',
  'weather-value-duplicate',
  'weather-values-exceed-limit',
]);
