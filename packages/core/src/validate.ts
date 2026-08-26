import {
  DEFAULT_VIEWBOX_MM,
  type BodyVariantId,
  type SymbolKind,
  type SymbolSpec,
} from '@einsatzzeichen/schema';
import { profileFor } from './layout/profiles.js';
import { ARIMO_CAP_HEIGHT_FRACTION, verticalTextBoxMm } from './render/text-policy.js';

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

/** Vermessene Normalhülle des F.2-Landfahrzeugs: x 1…31 / y 5,75…26 mm. */
const F2_VEHICLE_LAND_BODY_HEIGHT_MM = 20.25;
/** Rechte Innenmarge der bestehenden `topLeft`-Box: absolut x 29, relativ zur linken Hülle 28. */
const F2_TOP_LEFT_BOX_RIGHT_FROM_BODY_LEFT_MM = 28;
/** Rechte Kante der F.3-`topLeft`-Box: Kreis maxX 28 minus 2-mm-Innenmarge. */
const F3_CIRCLE_TOP_LEFT_BOX_RIGHT_MM = 26;
/** Rechte Innenmarge der einzeiligen oberen Labelboxen, identisch zur Komposition. */
const TOP_LABEL_BOX_RIGHT_INSET_MM = 2;
/** Bestehende Default-Versalhöhe des mittigen Laufs in der Komposition. */
const DEFAULT_CENTER_LABEL_CAP_HEIGHT_MM = 4.87;

/** Exakte, aus den Quellen vermessene Art-/Variantenpaare; alle anderen bleiben fail-closed. */
const BODY_VARIANT_KINDS: Readonly<Record<BodyVariantId, ReadonlySet<SymbolKind>>> = {
  'raised-hull': new Set<SymbolKind>(['vehicle-air', 'vehicle-water']),
  'inset-hull': new Set<SymbolKind>(['vehicle-water']),
  'foot-band': new Set<SymbolKind>(['formation', 'vehicle-land']),
  'plain-wheel-pair': new Set<SymbolKind>(['vehicle-land']),
  'raised-gable': new Set<SymbolKind>(['circle-12']),
  'inverted-hull-track': new Set<SymbolKind>(['vehicle-land']),
  'fixed-wing-hull': new Set<SymbolKind>(['vehicle-air']),
  'raised-circle-1mm': new Set<SymbolKind>(['circle-12']),
};

/**
 * Farbige 12-mm-Kreisverträge außerhalb der weißen F.3-Fassung. Die technischen Marken sind
 * sichtbare Geometrie-IDs; die Tabelle behauptet keine Abschnitts- oder Rezeptsemantik.
 */
const MEASURED_COLORED_CIRCLE_CONTRACTS = [
  {
    bodyVariant: undefined,
    organization: 'zivile-einheiten',
    bodyMark: 'spontaneous-helper-collection-arrow',
  },
  {
    bodyVariant: undefined,
    organization: 'feuerwehr',
    bodyMark: 'spontaneous-helper-contact-double-arrow',
  },
  {
    bodyVariant: 'raised-circle-1mm',
    organization: 'zivile-einheiten',
    bodyMark: 'circle-information-stem',
  },
] as const satisfies ReadonlyArray<{
  readonly bodyVariant: SymbolSpec['bodyVariant'];
  readonly organization: SymbolSpec['organization'];
  readonly bodyMark: NonNullable<SymbolSpec['bodyMarks']>[number];
}>;

const COLORED_NORMAL_CIRCLE_ONLY_MARKS = new Set<
  NonNullable<SymbolSpec['bodyMarks']>[number]
>([
  'spontaneous-helper-collection-arrow',
  'spontaneous-helper-contact-double-arrow',
]);

function hasMeasuredColoredCircleContract(spec: SymbolSpec): boolean {
  if (spec.kind !== 'circle-12') return false;
  const [bodyMark, ...additionalBodyMarks] = spec.bodyMarks ?? [];
  return additionalBodyMarks.length === 0 && bodyMark !== undefined &&
    MEASURED_COLORED_CIRCLE_CONTRACTS.some((contract) =>
      contract.bodyVariant === spec.bodyVariant &&
      contract.organization === spec.organization &&
      contract.bodyMark === bodyMark);
}

function hasMeasuredCircleOrganizationContract(spec: SymbolSpec): boolean {
  if (spec.kind !== 'circle-12') return false;
  if (hasMeasuredColoredCircleContract(spec)) return true;

  const isWhiteF3Contract = spec.organization === 'hilfsorganisation' &&
    (spec.bodyVariant === undefined || spec.bodyVariant === 'raised-gable');
  return isWhiteF3Contract &&
    !(spec.bodyMarks ?? []).some((mark) => COLORED_NORMAL_CIRCLE_ONLY_MARKS.has(mark));
}

export function validateSpec(spec: SymbolSpec): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const profile = profileFor(spec.kind, spec.bodyVariant);
  const labels = spec.labels;

  if (
    spec.bodyVariant !== undefined &&
    !BODY_VARIANT_KINDS[spec.bodyVariant].has(spec.kind)
  ) {
    issues.push({
      rule: 'body-variant-requires-measured-kind',
      message:
        `Die Körpervariante "${spec.bodyVariant}" ist für "${spec.kind}" nicht vermessen. ` +
        'Varianten fallen weder auf eine andere Körperart noch auf deren Normalfassung zurück.',
    });
  }

  const isInsetWatercraft =
    spec.kind === 'vehicle-water' && spec.bodyVariant === 'inset-hull';

  if (isInsetWatercraft && spec.organization !== 'hilfsorganisation') {
    issues.push({
      rule: 'inset-hull-requires-hilfsorganisation',
      message: 'inset-hull requires the measured white Hilfsorganisation body.',
    });
  }

  if (isInsetWatercraft) {
    // I.3.5 bis I.3.7 belegen ausschließlich den mittigen Lauf. Das generische Labelmodell ist
    // inzwischen breiter als dieser Vertrag (unter anderem durch die vermessenen N-Metriken).
    // Deshalb erlauben wir die zwei bekannten nicht bzw. genau so gerenderten Felder explizit,
    // statt eine Liste verbotener Zonen zu pflegen, die beim nächsten Feld still veraltet.
    const hasUnmeasuredLabelZone = labels !== undefined && Object.keys(labels).some(
      (key) => key !== 'accessibilityMode' && key !== 'center',
    );

    if (hasUnmeasuredLabelZone || spec.designation !== undefined) {
      issues.push({
        rule: 'inset-hull-requires-center-label-only',
        message:
          'inset-hull supports only the measured center label zone and non-rendering ' +
          'accessibility metadata.',
      });
    }
  }

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
      (spec.kind === 'vehicle-air' &&
        (spec.bodyVariant === 'raised-hull' || spec.bodyVariant === 'fixed-wing-hull'))
    )
  ) {
    issues.push({
      rule: 'body-variant-foot-conflict',
      message:
        'Die sichtbare Zusatzgeometrie dieser Körpervariante belegt den Streifen unterhalb des ' +
        'Körpers. Eine Bezeichnung in der Fußzone würde sie überlagern oder die viewBox verlassen.',
    });
  }

  if (
    spec.designation !== undefined &&
    (spec.labels?.surfaceBelowLeft !== undefined || spec.labels?.surfaceBelowRight !== undefined)
  ) {
    issues.push({
      rule: 'surface-label-foot-conflict',
      message:
        'Bezeichnung und schwarze Oberflächenläufe belegen denselben Streifen unterhalb des ' +
        'Körpers. Ohne vermessene Ausweichposition schließen sie sich aus.',
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

  // Dieselbe Bauart eine Zone weiter oben: die Grundlinie des Laufs oben links ist an der
  // Formation (5,0 mm unter der Oberkante) und an den F.2-Landfahrzeugen (Profildefault 6,75 mm)
  // gemessen. Andere Körperprofile führen keinen Wert und werden abgelehnt statt still einen der
  // beiden zu erben. Am Gebäudekörper führte schon der Formationsanker 2,5 mm aus dem Polygon
  // heraus (dessen Kante läuft dort erst ab 5,286 mm).
  if (
    spec.labels?.topLeft !== undefined &&
    profile.topLeftBaselineFromBodyTopMm === undefined
  ) {
    issues.push({
      rule: 'top-left-label-requires-measured-body',
      message:
        'Die Beschriftungszone oben links ist an der taktischen Formation und an den ' +
        'F.2-Landfahrzeugprofilen vermessen. Für ' +
        `"${spec.kind}" mit Variante "${spec.bodyVariant ?? 'normal'}" gibt es keine Messung, ` +
        'aus der ihre Lage folgte.',
    });
  }

  const isCircle12 = spec.kind === 'circle-12';
  const isMeasuredCircleVariant = isCircle12 &&
    (spec.bodyVariant === undefined || spec.bodyVariant === 'raised-gable');
  if (
    isMeasuredCircleVariant &&
    spec.labels?.topLeft !== undefined &&
    spec.labels.topLeftMetrics === undefined
  ) {
    issues.push({
      rule: 'circle-top-left-requires-metrics',
      message:
        'Ein topLeft-Lauf am 12-mm-Kreis verlangt immer den vollständigen vermessenen ' +
        'Metriksatz; die beiden Kreisfassungen haben keinen allgemeinen Profildefault.',
    });
  }
  if (
    spec.labels?.topLeft !== undefined &&
    profile.requiresTopLeftMetrics === true &&
    spec.labels.topLeftMetrics === undefined
  ) {
    issues.push({
      rule: 'top-left-metrics-required-by-profile',
      message:
        'Dieses Körperprofil belegt den topLeft-Lauf ausschließlich mit einem vollständigen ' +
        'quellenspezifischen Metriksatz; ein Profildefault wäre nur eine Teilmessung.',
    });
  }
  if (isCircle12 && !hasMeasuredCircleOrganizationContract(spec)) {
    issues.push({
      rule: 'circle-12-requires-hilfsorganisation',
      message:
        'Der 12-mm-Kreis verlangt einen vollständig vermessenen Organisationsvertrag: die ' +
        'weiße HiOrg-Fassung aus F.3 oder genau eine der farbigen technischen ' +
        'Art-/Varianten-/Markenfassungen. Fehlende oder vertauschte Werte sind nicht belegt.',
    });
  }
  if (
    hasMeasuredColoredCircleContract(spec) &&
    (spec.labels?.topLeft !== undefined || spec.labels?.topLeftMetrics !== undefined)
  ) {
    issues.push({
      rule: 'colored-circle-top-left-not-measured',
      message:
        'Die exakt vermessenen farbigen Kreisverträge führen keinen topLeft-Lauf und keine ' +
        'zugehörigen F.3-Metriken. Diese weißen Kreislabelverträge werden nicht vererbt.',
    });
  }
  if (
    spec.kind === 'reduced-house' &&
    spec.organization !== 'hilfsorganisation'
  ) {
    issues.push({
      rule: 'reduced-house-requires-hilfsorganisation',
      message:
        'Die reduzierte Hauskontur ist in beiden F.3-Belegen ausschließlich als weiße ' +
        'HiOrg-Körperfläche vermessen. Andere oder fehlende Organisationszuordnungen sind ' +
        'auch ohne Beschriftung nicht belegt.',
    });
  }

  const topLeftMetrics = spec.labels?.topLeftMetrics as unknown;
  if (topLeftMetrics !== undefined) {
    const metricsRecord = typeof topLeftMetrics === 'object' && topLeftMetrics !== null &&
        !Array.isArray(topLeftMetrics)
      ? topLeftMetrics as Record<string, unknown>
      : undefined;
    const capHeightMm = metricsRecord?.capHeightMm;
    const baselineFromBodyTopMm = metricsRecord?.baselineFromBodyTopMm;
    const anchorFromBodyLeftMm = metricsRecord?.anchorFromBodyLeftMm;

    if (spec.labels?.topLeft === undefined || spec.labels.topLeft.trim() === '') {
      issues.push({
        rule: 'top-left-metrics-require-top-left-label',
        message:
          'Gemessene Metriken der oberen linken Zone verlangen einen nichtleeren topLeft-Lauf; ' +
          'ohne ihn würden alle drei Maße still verschluckt.',
      });
    }
    const isMeasuredVehicleLand = spec.kind === 'vehicle-land' &&
      (spec.bodyVariant === undefined || spec.bodyVariant === 'foot-band');
    const isMeasuredFixedWing = spec.kind === 'vehicle-air' &&
      spec.bodyVariant === 'fixed-wing-hull';
    if (!isMeasuredVehicleLand && !isMeasuredCircleVariant && !isMeasuredFixedWing) {
      issues.push({
        rule: 'top-left-metrics-require-measured-vehicle-land',
        message:
          'Individuelle topLeft-Metriken sind nur am normalen und gebänderten F.2-Landfahrzeug ' +
          'sowie den beiden F.3-Kreisfassungen und am Festflügel-Luftfahrzeug vermessen. Andere ' +
          'Arten und Varianten behalten ihre eigenen Profilwerte.',
      });
    }
    if (
      metricsRecord === undefined ||
      !Object.hasOwn(metricsRecord, 'capHeightMm') ||
      !Object.hasOwn(metricsRecord, 'baselineFromBodyTopMm') ||
      !Object.hasOwn(metricsRecord, 'anchorFromBodyLeftMm')
    ) {
      issues.push({
        rule: 'top-left-metrics-complete',
        message:
          'Gemessene topLeft-Metriken müssen Versalhöhe, Grundlinie und Anker gemeinsam führen; ' +
          'ein partielles Objekt würde unbelegte Profilwerte hineinmischen.',
      });
    }
    if (!(typeof capHeightMm === 'number' && Number.isFinite(capHeightMm) && capHeightMm > 0)) {
      issues.push({
        rule: 'top-left-cap-height-positive',
        message: 'Die Versalhöhe des topLeft-Laufs muss endlich und größer als null sein.',
      });
    }
    if (isMeasuredVehicleLand) {
      if (
        !(typeof baselineFromBodyTopMm === 'number' &&
          Number.isFinite(baselineFromBodyTopMm) &&
          typeof capHeightMm === 'number' &&
          Number.isFinite(capHeightMm) &&
          baselineFromBodyTopMm >= capHeightMm &&
          baselineFromBodyTopMm <= F2_VEHICLE_LAND_BODY_HEIGHT_MM)
      ) {
        issues.push({
          rule: 'top-left-baseline-within-body',
          message:
            'Die topLeft-Grundlinie muss mindestens eine Versalhöhe unter der Körperoberkante ' +
            `und höchstens ${F2_VEHICLE_LAND_BODY_HEIGHT_MM} mm darunter liegen.`,
        });
      }
      if (
        !(typeof anchorFromBodyLeftMm === 'number' &&
          Number.isFinite(anchorFromBodyLeftMm) &&
          anchorFromBodyLeftMm >= 0 &&
          anchorFromBodyLeftMm <= F2_TOP_LEFT_BOX_RIGHT_FROM_BODY_LEFT_MM)
      ) {
        issues.push({
          rule: 'top-left-anchor-within-body',
          message:
            'Der topLeft-Anker muss endlich sein und innerhalb der vermessenen Landfahrzeugbox ' +
            `zwischen 0 und ${F2_TOP_LEFT_BOX_RIGHT_FROM_BODY_LEFT_MM} mm liegen.`,
        });
      }
    }

    if (isMeasuredFixedWing) {
      const bodyBounds = profile.measuredBodyBoundsMm;
      let metricsWithinBody = false;
      if (
        bodyBounds !== undefined &&
        typeof capHeightMm === 'number' && Number.isFinite(capHeightMm) && capHeightMm > 0 &&
        typeof baselineFromBodyTopMm === 'number' && Number.isFinite(baselineFromBodyTopMm) &&
        typeof anchorFromBodyLeftMm === 'number' && Number.isFinite(anchorFromBodyLeftMm)
      ) {
        const anchorXMm = bodyBounds.minX + anchorFromBodyLeftMm;
        const baselineYMm = bodyBounds.minY + baselineFromBodyTopMm;
        const box = verticalTextBoxMm(
          baselineYMm,
          capHeightMm / ARIMO_CAP_HEIGHT_FRACTION,
          'alphabetic',
        );
        metricsWithinBody = anchorXMm >= bodyBounds.minX &&
          anchorXMm <= bodyBounds.maxX - TOP_LABEL_BOX_RIGHT_INSET_MM &&
          box.topMm >= bodyBounds.minY &&
          box.topMm + box.heightMm <= bodyBounds.maxY;
      }
      if (!metricsWithinBody) {
        issues.push({
          rule: 'top-left-metrics-within-body',
          message:
            'Der vollständige topLeft-Lauf muss mit endlichem Anker und seiner abgeleiteten ' +
            'vertikalen Textbox innerhalb der vermessenen Körperhülle liegen.',
        });
      }
    }

    if (isMeasuredCircleVariant) {
      const circleMinXMm = 4;
      const circleMinYMm = spec.bodyVariant === 'raised-gable' ? 6 : 4;
      const anchorXMm = typeof anchorFromBodyLeftMm === 'number'
        ? circleMinXMm + anchorFromBodyLeftMm
        : Number.NaN;
      if (
        !(Number.isFinite(anchorXMm) &&
          anchorXMm >= 0 &&
          anchorXMm <= F3_CIRCLE_TOP_LEFT_BOX_RIGHT_MM)
      ) {
        issues.push({
          rule: 'circle-top-left-anchor-within-viewbox',
          message:
            'Der relative Kreislabel-Anker darf außerhalb der Kreisfläche beginnen, seine ' +
            'absolute Lage muss aber innerhalb der 32-mm-ViewBox liegen und darf die rechte ' +
            `Kante der deklarierten Textbox bei ${F3_CIRCLE_TOP_LEFT_BOX_RIGHT_MM} mm nicht ` +
            'überschreiten.',
        });
      }

      let verticalBoxWithinViewBox = false;
      if (
        typeof baselineFromBodyTopMm === 'number' &&
        Number.isFinite(baselineFromBodyTopMm) &&
        typeof capHeightMm === 'number' &&
        Number.isFinite(capHeightMm) &&
        capHeightMm > 0
      ) {
        const baselineYMm = circleMinYMm + baselineFromBodyTopMm;
        const sizeMm = capHeightMm / ARIMO_CAP_HEIGHT_FRACTION;
        const box = verticalTextBoxMm(baselineYMm, sizeMm, 'alphabetic');
        verticalBoxWithinViewBox = box.topMm >= 0 &&
          box.topMm + box.heightMm <= DEFAULT_VIEWBOX_MM.height;
      }
      if (!verticalBoxWithinViewBox) {
        issues.push({
          rule: 'circle-top-left-baseline-within-viewbox',
          message:
            'Die relative Kreislabel-Grundlinie darf außerhalb der Kreisfläche liegen, die ' +
            'daraus berechnete Textbox muss aber vollständig innerhalb der 32-mm-ViewBox bleiben.',
        });
      }
    }
  }

  if (
    spec.labels?.aboveLeft !== undefined &&
    profile.aboveLeftBaselineFromBodyTopMm === undefined
  ) {
    issues.push({
      rule: 'above-left-label-requires-measured-body',
      message:
        'Die Beschriftungszone oberhalb links ist allein am Luftfahrzeug aus F.2.7 vermessen. ' +
        `Für "${spec.kind}" gibt es keine Messung, aus der ihre Lage folgte.`,
    });
  }

  const aboveLeftMetrics = spec.labels?.aboveLeftMetrics as unknown;
  if (aboveLeftMetrics !== undefined) {
    const record = typeof aboveLeftMetrics === 'object' && aboveLeftMetrics !== null &&
      !Array.isArray(aboveLeftMetrics)
      ? aboveLeftMetrics as Record<string, unknown>
      : undefined;
    const invalidOrIncomplete =
      spec.labels?.aboveLeft === undefined ||
      record === undefined ||
      !Object.hasOwn(record, 'capHeightMm') ||
      !Object.hasOwn(record, 'baselineFromBodyTopMm') ||
      !Object.hasOwn(record, 'anchorFromBodyLeftMm') ||
      !(typeof record.capHeightMm === 'number' && Number.isFinite(record.capHeightMm) &&
        record.capHeightMm > 0) ||
      !(typeof record.baselineFromBodyTopMm === 'number' &&
        Number.isFinite(record.baselineFromBodyTopMm)) ||
      !(typeof record.anchorFromBodyLeftMm === 'number' &&
        Number.isFinite(record.anchorFromBodyLeftMm));
    if (invalidOrIncomplete) {
      issues.push({
        rule: 'above-left-metrics-complete',
        message: 'Gemessene aboveLeft-Metriken verlangen Lauf, Versalhöhe, Grundlinie und Anker.',
      });
    }
    if (!invalidOrIncomplete && record !== undefined) {
      const bodyBounds = profile.measuredBodyBoundsMm;
      const capHeightMm = record.capHeightMm as number;
      const baselineYMm = (bodyBounds?.minY ?? Number.NaN) +
        (record.baselineFromBodyTopMm as number);
      const anchorXMm = (bodyBounds?.minX ?? Number.NaN) +
        (record.anchorFromBodyLeftMm as number);
      const box = verticalTextBoxMm(
        baselineYMm,
        capHeightMm / ARIMO_CAP_HEIGHT_FRACTION,
        'alphabetic',
      );
      const boxRightXMm = (bodyBounds?.maxX ?? Number.NaN) - TOP_LABEL_BOX_RIGHT_INSET_MM;
      if (
        bodyBounds === undefined ||
        anchorXMm < 0 ||
        anchorXMm > boxRightXMm ||
        box.topMm < 0 ||
        box.topMm + box.heightMm > DEFAULT_VIEWBOX_MM.height
      ) {
        issues.push({
          rule: 'above-left-metrics-within-viewbox',
          message:
            'Der abgeleitete aboveLeft-Lauf muss mit seinem Anker innerhalb der vermessenen ' +
            'Profilbox und mit seiner vollständigen Textbox innerhalb der 32-mm-ViewBox liegen.',
        });
      }
    }
  }

  if (
    spec.labels?.topLeftLines !== undefined &&
    (
      profileFor(spec.kind, spec.bodyVariant).topLeftLines === undefined ||
      (spec.bodyVariant !== undefined && !BODY_VARIANT_KINDS[spec.bodyVariant].has(spec.kind))
    )
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
    (spec.labels?.surfaceBelowLeft !== undefined || spec.labels?.surfaceBelowRight !== undefined) &&
    profileFor(spec.kind, spec.bodyVariant).surfaceLabels === undefined
  ) {
    issues.push({
      rule: 'surface-label-requires-measured-body',
      message: 'Schwarze Oberflächenläufe sind nur an den dafür vermessenen Körperprofilen zulässig.',
    });
  }
  if (
    spec.labels?.surfaceBelowLeft !== undefined &&
    profileFor(spec.kind, spec.bodyVariant).surfaceLabels !== undefined &&
    profileFor(spec.kind, spec.bodyVariant).surfaceLabels?.leftAnchorFromBodyLeftMm === undefined
  ) {
    issues.push({
      rule: 'surface-left-label-requires-measured-anchor',
      message: 'Der linke schwarze Oberflächenlauf verlangt einen links vermessenen Anker.',
    });
  }
  if (
    spec.labels?.surfaceBelowRight !== undefined &&
    profileFor(spec.kind, spec.bodyVariant).surfaceLabels !== undefined &&
    profileFor(spec.kind, spec.bodyVariant).surfaceLabels?.rightAnchorFromBodyRightMm === undefined
  ) {
    issues.push({
      rule: 'surface-right-label-requires-measured-anchor',
      message: 'Der rechte schwarze Oberflächenlauf verlangt einen rechts vermessenen Anker.',
    });
  }

  if (
    spec.labels?.centerBaselineFromBodyBottomMm !== undefined &&
    spec.labels.center === undefined
  ) {
    issues.push({
      rule: 'center-baseline-requires-center-label',
      message: 'Eine gemessene mittige Grundlinie verlangt einen mittigen Lauf.',
    });
  }
  if (
    spec.labels?.centerBaselineFromBodyBottomMm !== undefined &&
    !(Number.isFinite(spec.labels.centerBaselineFromBodyBottomMm) &&
      spec.labels.centerBaselineFromBodyBottomMm > 0)
  ) {
    issues.push({
      rule: 'center-baseline-positive',
      message: 'Der Abstand der mittigen Grundlinie muss endlich und größer als null sein.',
    });
  }
  if (
    spec.labels?.centerBaselineFromBodyBottomMm !== undefined &&
    profile.allowsCenterBaselineOverride !== true
  ) {
    issues.push({
      rule: 'center-baseline-override-requires-measured-body',
      message: 'Eine abweichende mittige Grundlinie ist nur an einem dafür vermessenen Körperprofil zulässig.',
    });
  }
  if (
    spec.labels?.centerBaselineFromBodyBottomMm !== undefined &&
    profile.allowsCenterBaselineOverride === true
  ) {
    const bodyBounds = profile.measuredBodyBoundsMm;
    const capHeightMm = spec.labels.centerCapHeightMm ?? DEFAULT_CENTER_LABEL_CAP_HEIGHT_MM;
    const baselineYMm = (bodyBounds?.maxY ?? Number.NaN) -
      spec.labels.centerBaselineFromBodyBottomMm;
    const box = verticalTextBoxMm(
      baselineYMm,
      capHeightMm / ARIMO_CAP_HEIGHT_FRACTION,
      'alphabetic',
    );
    if (
      bodyBounds === undefined ||
      !Number.isFinite(baselineYMm) ||
      !Number.isFinite(capHeightMm) ||
      capHeightMm <= 0 ||
      box.topMm < bodyBounds.minY ||
      box.topMm + box.heightMm > bodyBounds.maxY
    ) {
      issues.push({
        rule: 'center-label-within-body',
        message:
          'Die aus Grundlinie und Versalhöhe abgeleitete mittige Textbox muss vollständig ' +
          'innerhalb der vermessenen Landfahrzeughülle liegen.',
      });
    }
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

  const hasInBodyLabel = [
    spec.labels?.center,
    spec.labels?.topLeft,
    spec.labels?.bottomLeft,
    spec.labels?.bottomCenter,
    spec.labels?.bottomRight,
    ...(spec.labels?.topLeftLines ?? []),
  ].some((value) => typeof value === 'string' && value.trim() !== '');
  if (spec.labels?.inBodyInk !== undefined && !hasInBodyLabel) {
    issues.push({
      rule: 'in-body-ink-requires-in-body-label',
      message:
        'Ein gemessener Tintenoverride verlangt mindestens einen nichtleeren Textlauf im Körper; ' +
        'oberhalb oder auf der Ausgabeoberfläche liegende Läufe verwenden eigene Tintenverträge.',
    });
  }

  const bottomRightMetrics = spec.labels?.bottomRightMetrics as unknown;
  if (bottomRightMetrics !== undefined) {
    const record = typeof bottomRightMetrics === 'object' && bottomRightMetrics !== null &&
        !Array.isArray(bottomRightMetrics)
      ? bottomRightMetrics as Record<string, unknown>
      : undefined;
    const required = [
      'capHeightMm',
      'baselineFromBodyTopMm',
      'anchorFromBodyLeftMm',
      'boxLeftFromBodyLeftMm',
      'boxWidthMm',
    ] as const;
    const complete = record !== undefined && required.every((field) =>
      Object.hasOwn(record, field));
    const profileBounds = profileFor(spec.kind, spec.bodyVariant).bottomRightMetricsBounds;

    if (spec.labels?.bottomRight === undefined || spec.labels.bottomRight.trim() === '') {
      issues.push({
        rule: 'bottom-right-metrics-require-bottom-right-label',
        message:
          'Gemessene bottomRight-Metriken verlangen einen nichtleeren Lauf; ohne ihn würden ' +
          'Versalhöhe, Grundlinie, Anker und Box still verschluckt.',
      });
    }
    if (profileBounds === undefined) {
      issues.push({
        rule: 'bottom-right-metrics-require-measured-body',
        message:
          'Individuelle bottomRight-Metriken sind nur an einem Körperprofil mit vollständig ' +
          'vermessener relativer Textbox zulässig.',
      });
    }
    if (!complete) {
      issues.push({
        rule: 'bottom-right-metrics-complete',
        message:
          'Gemessene bottomRight-Metriken müssen Versalhöhe, Grundlinie, Anker, Boxanfang und ' +
          'Boxbreite gemeinsam führen.',
      });
    }

    if (complete && profileBounds !== undefined && record !== undefined) {
      const capHeightMm = record.capHeightMm;
      const baselineFromBodyTopMm = record.baselineFromBodyTopMm;
      const anchorFromBodyLeftMm = record.anchorFromBodyLeftMm;
      const boxLeftFromBodyLeftMm = record.boxLeftFromBodyLeftMm;
      const boxWidthMm = record.boxWidthMm;
      const finiteNumbers = [
        capHeightMm,
        baselineFromBodyTopMm,
        anchorFromBodyLeftMm,
        boxLeftFromBodyLeftMm,
        boxWidthMm,
      ].every((value) => typeof value === 'number' && Number.isFinite(value));
      let withinBody = false;
      if (
        finiteNumbers &&
        typeof capHeightMm === 'number' && capHeightMm > 0 &&
        typeof baselineFromBodyTopMm === 'number' &&
        typeof anchorFromBodyLeftMm === 'number' &&
        typeof boxLeftFromBodyLeftMm === 'number' &&
        typeof boxWidthMm === 'number' && boxWidthMm > 0
      ) {
        const boxRightFromBodyLeftMm = boxLeftFromBodyLeftMm + boxWidthMm;
        const sizeMm = capHeightMm / ARIMO_CAP_HEIGHT_FRACTION;
        const verticalBox = verticalTextBoxMm(
          baselineFromBodyTopMm,
          sizeMm,
          'alphabetic',
        );
        withinBody = boxLeftFromBodyLeftMm >= 0 &&
          boxRightFromBodyLeftMm <= profileBounds.widthMm &&
          anchorFromBodyLeftMm >= boxLeftFromBodyLeftMm &&
          anchorFromBodyLeftMm <= boxRightFromBodyLeftMm &&
          verticalBox.topMm >= 0 &&
          verticalBox.topMm + verticalBox.heightMm <= profileBounds.heightMm;
      }
      if (!withinBody) {
        issues.push({
          rule: 'bottom-right-metrics-within-body',
          message:
            'Die vollständige bottomRight-Textbox einschließlich Anker und vertikaler ' +
            'Schriftmetriken muss innerhalb der vermessenen Körperhülle liegen.',
        });
      }
    }
  }

  // Dieselbe Regel wie für `designation`, je Zone einzeln benannt: ein leerer Lauf erzeugte ein
  // Textprimitiv ohne Tinte, das jedes Gate besteht und im Bild fehlt — genau der lautlose
  // Ausfall, den die Fußzone mit ihrem festen Schriftgrad vermeidet.
  for (const [zone, value] of Object.entries(spec.labels ?? {})) {
    if (zone === 'inBodyInk') continue;
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
