import type { SymbolKind, SymbolSpec } from '@einsatzzeichen/schema';

export interface ValidationIssue {
  /** Stabile Regel-ID. Wird später in der Dokumentation verlinkt. */
  rule: string;
  message: string;
}

/** Grundzeichenarten, die eine taktische Einheit darstellen und eine Stärke tragen dürfen. */
const UNIT_KINDS = new Set<SymbolKind>(['formation', 'person']);

/**
 * Grundzeichenarten, an denen die Referenz eine Fahrwerkszone zeichnet. Das ist **allein** das
 * Landfahrzeug, und das ist gemessen, nicht angenommen (18. August 2026): von den 31 Zeichen des
 * Anhangs E.2 tragen 25 ein Fahrwerk, alle auf einem Landfahrzeugkörper; die fünf Wasserfahrzeuge
 * E.2.27 bis E.2.31 tragen keines, und keine der drei Luftfahrzeugdateien 5.1.4.1 bis 5.1.4.3
 * trägt eines.
 *
 * Bis LFH-424 hieß diese Menge „Fahrzeuge" und enthielt alle drei Fahrzeugarten. Das war eine
 * Annahme aus dem Wort „Fahrzeugkategorie" — die Referenz stützt sie nicht.
 */
const CHASSIS_KINDS = new Set<SymbolKind>(['vehicle-land']);

export function validateSpec(spec: SymbolSpec): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  if (spec.strength !== undefined && !UNIT_KINDS.has(spec.kind)) {
    issues.push({
      rule: 'strength-requires-unit',
      message:
        `Eine Stärkeangabe ist nur an taktischen Einheiten zulässig. ` +
        `"${spec.kind}" ist keine Einheit.`,
    });
  }

  if (spec.vehicleCategory !== undefined && !CHASSIS_KINDS.has(spec.kind)) {
    issues.push({
      rule: 'vehicle-category-requires-vehicle',
      message:
        `Eine Fahrzeugkategorie ist nur am Landfahrzeug belegt. "${spec.kind}" trägt in der ` +
        'Referenz keine Fahrwerkszone.',
    });
  }

  // Fahrwerkszone und Fußzone belegen denselben Streifen unterhalb des Körpers, und **kein**
  // Zeichen des Referenzbestands trägt beides. Gemessen (18. August 2026): das Fahrwerk reicht von
  // der Körperunterkante bis 4,75 mm darunter (26,0004 bis 30,7502 mm bei den Landfahrzeugen),
  // die Fußzone beginnt 1 mm unter der Körperunterkante (`HEAD_GAP_MM`) und ist 4 mm hoch. Die
  // Überschneidung beträgt 3,75 mm bei einer Zonenhöhe von 4 mm.
  //
  // Deshalb eine Ablehnung und keine Ausweichregel: wohin die Fußzone rückte, wenn ein Zeichen
  // beides trüge, ist nicht belegt — unterhalb des Fahrwerks begänne sie bei 31,75 mm und verließe
  // die 32-mm-Grundfläche. Die Referenz beschriftet ihre Fahrzeuge stattdessen **im** Körper
  // (`spec.labels`), und das ist mit einer Fahrwerkszone zulässig: alle 25 E.2-Zeichen mit
  // Fahrwerk tun genau das (21 mit einer Fahrzeugkategorie, vier mit einem Anhängerfahrwerk) —
  // E.2 tun genau das.
  if (spec.vehicleCategory !== undefined && spec.designation !== undefined) {
    issues.push({
      rule: 'chassis-foot-conflict',
      message:
        'Fahrzeugkategorie und Bezeichnung belegen beide den Streifen unterhalb des Körpers und ' +
        'schließen sich aus. Anhang E.2 beschriftet seine Fahrzeuge in den Körperzonen.',
    });
  }

  // Verwaltungsstufen sind vermessen, aber nicht gebaut: `compose()` liest für die Kopfzone
  // ausschließlich `spec.strength`, und `CatalogPorts` kennt keine Marken für Verwaltungsstufen.
  // Ohne diese Regel liefert `validateSpec` für `{kind:'formation', administrativeLevel:'kreis'}`
  // eine leere Befundliste und `compose()` byteidentisches SVG mit und ohne das Feld — die Angabe
  // wird still verschluckt. Der Ausfall ist **vorbestehend** und nicht von LFH-424 erzeugt,
  // anders als der Fahrzeugkategoriefall, den erst `vehicle-land` in `BASE_SYMBOLS` erreichbar
  // gemacht hat.
  //
  // Warum nicht gebaut: drei der sechs Stufen haben in Kopfform überhaupt keine Referenz.
  // Vermessen sind nur n = 2 (D.3.1, D.3.3, D.3.4, D.4.1, D.4.2, D.4.3), n = 5 (D.4.4) und n = 6
  // (D.4.5); `gemeinde` (n = 1), `bezirk` (n = 3) und `bundesland` (n = 4) tragen im gesamten
  // Bestand keine Kopfmarke. Für n = 4 trägt auch keine Ableitung: der einzige Kopfzonenfall mit
  // gerader Markenzahl jenseits von zwei ist n = 6, und dort liegen die äußeren Marken auf 16 ± 7,0
  // statt der aus der 5-mm-Teilung erwarteten 16 ± 7,5. Siehe
  // `docs/decisions/2026-08-18-grundlagen-restpunkte.md`.
  if (spec.administrativeLevel !== undefined) {
    issues.push({
      rule: 'administrative-level-not-implemented',
      message:
        'Eine Verwaltungsstufe wird noch nicht gezeichnet: die Kopfmarken aus D.3/D.4 sind für ' +
        'drei der sechs Stufen an der Referenz gar nicht belegt. Die Angabe würde still ' +
        'verschluckt.',
    });
  }

  // Deckt ausdrücklich **nur** Stärke gegen Verwaltungsstufe. Die Entscheidungsnotiz vom
  // 4. August 2026, Abschnitt 2, schreibt dieser Regel zusätzlich die Fahrzeugkategorie zu — das
  // ist falsch, `spec.vehicleCategory` kommt hier nicht vor, und die Begründung „belegen beide die
  // Kopfzone" trüge für sie geometrisch auch nicht: die Stärke sitzt oben, das Fahrwerk unten.
  //
  // Solange die Regel darüber jede Verwaltungsstufe ablehnt, ist dieser Fall zusätzlich
  // abgedeckt und die Regel meldet nie allein. Sie bleibt trotzdem stehen und wird nicht durch
  // einen Typ ersetzt, der die Kollision unmöglich macht: eine unterscheidende Vereinigung über
  // `SymbolSpec` (etwa `head: {strength} | {administrativeLevel}`) zöge alle 40 Rezepte und ihre
  // Tests nach und kaufte nichts, solange der zweite Zweig ohnehin abgelehnt wird. Die
  // Entscheidung steht in der Notiz vom 18. August 2026, damit sie nicht als Versäumnis gelesen
  // wird.
  if (spec.strength !== undefined && spec.administrativeLevel !== undefined) {
    issues.push({
      rule: 'head-zone-conflict',
      message:
        'Stärkeangabe und Verwaltungsstufe belegen beide die Kopfzone und schließen sich aus.',
    });
  }

  if (spec.designation !== undefined && spec.designation.trim() === '') {
    issues.push({
      rule: 'designation-not-blank',
      message: 'Eine Bezeichnung darf nicht leer oder nur aus Leerzeichen bestehen.',
    });
  }

  // Dieselbe Regel wie für `designation`, je Zone einzeln benannt: ein leerer Lauf erzeugte ein
  // Textprimitiv ohne Tinte, das jedes Gate besteht und im Bild fehlt — genau der lautlose
  // Ausfall, den die Fußzone mit ihrem festen Schriftgrad vermeidet.
  for (const [zone, value] of Object.entries(spec.labels ?? {})) {
    if (typeof value === 'string' && value.trim() === '') {
      issues.push({
        rule: 'label-not-blank',
        message: `Die Beschriftungszone "${zone}" darf nicht leer oder nur aus Leerzeichen bestehen.`,
      });
    }
  }

  return issues;
}
