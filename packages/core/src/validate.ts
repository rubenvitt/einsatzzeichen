import type { SymbolKind, SymbolSpec } from '@einsatzzeichen/schema';
import { profileFor } from './layout/profiles.js';

export interface ValidationIssue {
  /** Stabile Regel-ID. Wird später in der Dokumentation verlinkt. */
  rule: string;
  message: string;
}

/** Grundzeichenarten, die eine taktische Einheit darstellen und eine Stärke tragen dürfen. */
const UNIT_KINDS = new Set<SymbolKind>(['formation', 'person']);

/**
 * Grundzeichenarten, an denen die Referenz eine Fahrwerkszone zeichnet. Gemessen, nicht
 * angenommen (18. August 2026): von den 31 Zeichen des Anhangs E.2 tragen **25** ein Fahrwerk —
 * 20 auf dem Landfahrzeugkörper, vier auf dem Anhängerrumpf, eines auf dem Wechselladerrumpf. Die
 * fünf Wasserfahrzeuge E.2.27 bis E.2.31 tragen keines, E.2.26 auf dem Hochkantrechteck auch
 * nicht, und keine der drei Luftfahrzeugdateien 5.1.4.1 bis 5.1.4.3 trägt eines.
 *
 * Bis LFH-424 hieß diese Menge „Fahrzeuge" und enthielt alle drei Fahrzeugarten. Das war eine
 * Annahme aus dem Wort „Fahrzeugkategorie" — die Referenz stützt sie nicht. LFH-424 zog sie auf
 * das Landfahrzeug zusammen; der Teilslice E.2 fügt die beiden Körperformen hinzu, die er
 * vermessen hat.
 *
 * **Was diese Menge ausdrücklich NICHT erzwingt: die Paarung von Kategorie und Körperform.** Eine
 * Fahrzeugkategorie, die im Bestand nur an einer dieser drei Formen vorkommt, lässt sich an jeder
 * der drei spezifizieren, ohne dass eine Regel widerspricht — der Katalog liefert dann klaglos
 * eine Zeichnung, die an keiner Referenzdatei belegt ist. Das ist bewusst nicht gebaut: bei vier
 * Belegdateien je Paarung wäre die Regel geraten und nicht vermessen
 * (`docs/decisions/2026-08-18-anhang-e2.md`, Abschnitt „Offene Kanten"). Wer die Lücke schließt,
 * schließt sie dort und nicht hier.
 */
const CHASSIS_KINDS = new Set<SymbolKind>([
  'vehicle-land',
  'trailer',
  'swap-loader-vehicle',
]);

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
        'Eine Fahrzeugkategorie ist nur am Landfahrzeug, am Anhängerrumpf und am ' +
        `Wechselladerrumpf belegt. "${spec.kind}" trägt in der Referenz keine Fahrwerkszone.`,
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

  if (spec.bodyVariant === 'plain-wheel-pair' && spec.vehicleCategory !== undefined) {
    issues.push({
      rule: 'plain-wheel-pair-chassis-conflict',
      message:
        'Die Variante plain-wheel-pair zeichnet bereits zwei vermessene Radringe. Eine ' +
        'Fahrzeugkategorie würde eine zweite, nicht belegte Fahrwerksgeometrie darüberlegen.',
    });
  }

  if (
    spec.designation !== undefined &&
    (
      (spec.kind === 'vehicle-land' && spec.bodyVariant === 'plain-wheel-pair') ||
      (spec.kind === 'vehicle-air' && spec.bodyVariant === 'raised-hull')
    )
  ) {
    issues.push({
      rule: 'body-variant-foot-conflict',
      message:
        'Die sichtbare Zusatzgeometrie dieser Körpervariante belegt den Streifen unterhalb des ' +
        'Körpers. Eine Bezeichnung in der Fußzone würde sie überlagern oder die viewBox verlassen.',
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

  // Die vierte Beschriftungszone steht **unterhalb** des Körpers, in der Organisationsfarbe.
  // Vermessen ist sie an genau einer Körperform: dem angehobenen Wasserrumpf der fünf Zeichen
  // E.2.27 bis E.2.31 (Tinte 22,5379/24,0806/31,5778/26,9998 mm, Füllung #003296, in allen fünf
  // Dateien gleich bis auf 0,0003 mm).
  //
  // Deshalb eine Ablehnung und keine Übertragung auf jede Körperform: die beiden Abstände, aus
  // denen der Katalog den Lauf setzt (4,01 mm unter der Körperunterkante, 0,5615 mm rechts der
  // Körperkante), sind an **dieser** Hülle gemessen. Auf einer `formation` erzeugten sie einen
  // blauen Lauf, den keine Referenzdatei zeigt — und kein Gate meldete ihn: der Fingerprint sieht
  // nur `role: 'body'`, die Rasterprüfung nur die selbst deklarierte Box.
  if (
    spec.labels?.belowRight !== undefined &&
    !(spec.kind === 'vehicle-water' && spec.bodyVariant === 'raised-hull')
  ) {
    issues.push({
      rule: 'below-right-label-requires-measured-body',
      message:
        'Die Beschriftungszone unterhalb des Körpers ist allein am angehobenen Wasserrumpf ' +
        '(kind "vehicle-water", bodyVariant "raised-hull") vermessen — an den fünf Zeichen ' +
        `E.2.27 bis E.2.31. Für "${spec.kind}" gibt es keine Messung, aus der ihre Lage folgte.`,
    });
  }

  // Dieselbe Bauart eine Zone weiter oben: die Grundlinie des Laufs oben links ist an genau einer
  // Körperform gemessen (5,0 mm unter der Oberkante, an den neun beschrifteten Zeichen aus F.1.1
  // bis F.1.11). Sie auf jede andere zu übertragen, wäre eine erfundene Lage — und zwar eine
  // unauffällige: der Lauf stünde irgendwo im Körper und keine Prüfung fragte nach, ob er dort
  // hingehört. Am Gebäudekörper führte der Anker 2,5 mm zusätzlich aus dem Polygon heraus
  // (dessen Kante läuft dort erst ab 5,286 mm).
  if (
    spec.labels?.topLeft !== undefined &&
    profileFor(spec.kind, spec.bodyVariant).topLeftBaselineFromBodyTopMm === undefined
  ) {
    issues.push({
      rule: 'top-left-label-requires-measured-body',
      message:
        'Die Beschriftungszone oben links ist allein an der taktischen Formation vermessen ' +
        '(Grundlinie 5,0 mm unter der Körperoberkante, an F.1.1 bis F.1.11). Für ' +
        `"${spec.kind}" gibt es keine Messung, aus der ihre Lage folgte — der Landfahrzeugrumpf ` +
        'trägt denselben Lauf 1,5 mm tiefer, und diese Zahl misst der Teilslice, der sie braucht.',
    });
  }

  if (
    spec.labels?.aboveLeft !== undefined &&
    profileFor(spec.kind, spec.bodyVariant).aboveLeftBaselineFromBodyTopMm === undefined
  ) {
    issues.push({
      rule: 'above-left-label-requires-measured-body',
      message:
        'Die Beschriftungszone oberhalb links ist allein am Luftfahrzeug aus F.2.7 vermessen. ' +
        `Für "${spec.kind}" gibt es keine Messung, aus der ihre Lage folgte.`,
    });
  }

  if (
    spec.labels?.topLeftLines !== undefined &&
    profileFor(spec.kind, spec.bodyVariant).topLeftLines === undefined
  ) {
    issues.push({
      rule: 'top-left-lines-require-measured-body',
      message:
        'Die zweizeilige obere Beschriftungszone ist allein am Landfahrzeug aus F.2.8 ' +
        `vermessen. Für "${spec.kind}" gibt es keine Messung, aus der ihre Lage folgte.`,
    });
  }

  if (spec.labels?.topLeftLines !== undefined && spec.labels.topLeftLines.length !== 2) {
    issues.push({
      rule: 'top-left-lines-exactly-two',
      message: 'Die zweizeilige obere Beschriftungszone muss exakt zwei Zeilen enthalten.',
    });
  }

  if (
    spec.labels?.bottomCenter !== undefined &&
    profileFor(spec.kind, spec.bodyVariant).bottomCenterBaselineFromBodyBottomMm === undefined
  ) {
    issues.push({
      rule: 'bottom-center-label-requires-measured-body',
      message:
        'Die Beschriftungszone unten mittig ist allein an der taktischen Formation vermessen ' +
        '(Grundlinie 2,0 mm über der Körperunterkante, an F.1.18 und F.1.20). Für ' +
        `"${spec.kind}" gibt es keine Messung, aus der ihre Lage folgte.`,
    });
  }

  // Ohne Organisation gibt es keine Farbe, die diese Zone tragen dürfte: gemessen ist sie in
  // #003296, und das ist `organizationColor('thw')`. Ein schwarzer oder weißer Lauf an derselben
  // Stelle wäre eine andere Zeichnung.
  if (spec.labels?.belowRight !== undefined && spec.organization === undefined) {
    issues.push({
      rule: 'below-right-label-requires-organization',
      message:
        'Die Beschriftungszone unterhalb des Körpers ist nur in der Organisationsfarbe belegt ' +
        '(#003296 an E.2.27 bis E.2.31). Ohne Organisation hat sie keine gemessene Farbe.',
    });
  }

  // Die gemessene Versalhöhe des mittigen Laufs. Ohne mittigen Lauf hätte sie keine Wirkung —
  // und eine Angabe ohne Wirkung ist genau der stille Ausfall, den `administrative-level` und
  // `label-not-blank` an anderer Stelle abfangen.
  if (spec.labels?.centerCapHeightMm !== undefined && spec.labels.center === undefined) {
    issues.push({
      rule: 'center-cap-height-requires-center-label',
      message:
        'Eine Versalhöhe für den mittigen Lauf ohne mittigen Lauf hat keine Wirkung und würde ' +
        'still verschluckt.',
    });
  }

  if (
    spec.labels?.centerCapHeightMm !== undefined &&
    !(Number.isFinite(spec.labels.centerCapHeightMm) && spec.labels.centerCapHeightMm > 0)
  ) {
    issues.push({
      rule: 'center-cap-height-positive',
      message:
        'Die Versalhöhe des mittigen Laufs muss endlich und größer als null sein; sie ist eine ' +
        `Messung an der Referenzdatei (erhalten: ${String(spec.labels.centerCapHeightMm)}).`,
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
    if (Array.isArray(value)) {
      for (const line of value) {
        if (typeof line === 'string' && line.trim() === '') {
          issues.push({
            rule: 'label-not-blank',
            message: `Die Beschriftungszone "${zone}" darf keine leere Einzelzeile enthalten.`,
          });
        }
      }
    }
  }

  return issues;
}
