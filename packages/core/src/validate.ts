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

/** Exakte, aus den Quellen vermessene Art-/Variantenpaare; alle anderen bleiben fail-closed. */
const BODY_VARIANT_KINDS: Readonly<Record<BodyVariantId, ReadonlySet<SymbolKind>>> = {
  'raised-hull': new Set<SymbolKind>(['vehicle-air', 'vehicle-water']),
  'foot-band': new Set<SymbolKind>(['formation', 'vehicle-land', 'trailer', 'circle-12']),
  'plain-wheel-pair': new Set<SymbolKind>(['vehicle-land']),
  'raised-gable': new Set<SymbolKind>(['circle-12']),
};

export function validateSpec(spec: SymbolSpec): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

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

  if (spec.strength !== undefined && !UNIT_KINDS.has(spec.kind)) {
    issues.push({
      rule: 'strength-requires-unit',
      message:
        `Eine Stärkeangabe ist nur an taktischen Einheiten zulässig. ` +
        `"${spec.kind}" ist keine Einheit.`,
    });
  }

  if (
    spec.kind === 'formation' &&
    spec.bodyVariant === 'foot-band' &&
    spec.strength === 'staffel'
  ) {
    issues.push({
      rule: 'foot-band-head-requires-measured-strength',
      message:
        'Am gebänderten Formationskörper sind nur Trupp, Gruppe und Zug vermessen. Die Staffel ' +
        'würde den Körper verschieben; wie das Fußband mitwandert, ist nicht belegt.',
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
    profileFor(spec.kind, spec.bodyVariant).belowRight === undefined
  ) {
    issues.push({
      rule: 'below-right-label-requires-measured-body',
      message:
        'Die Beschriftungszone unterhalb des Körpers verlangt ein vermessenes Körperprofil. ' +
        `Für "${spec.kind}" mit Variante "${spec.bodyVariant ?? 'normal'}" fehlt es.`,
    });
  }

  // Dieselbe Bauart eine Zone weiter oben: die Grundlinie des Laufs oben links ist an der
  // Formation (5,0 mm unter der Oberkante) und an den F.2-Landfahrzeugen (Profildefault 6,75 mm)
  // gemessen. Andere Körperprofile führen keinen Wert und werden abgelehnt statt still einen der
  // beiden zu erben. Am Gebäudekörper führte schon der Formationsanker 2,5 mm aus dem Polygon
  // heraus (dessen Kante läuft dort erst ab 5,286 mm).
  if (
    spec.labels?.topLeft !== undefined &&
    profileFor(spec.kind, spec.bodyVariant).topLeftBaselineFromBodyTopMm === undefined
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
    isCircle12 &&
    spec.bodyVariant === 'foot-band' &&
    spec.organization === undefined
  ) {
    issues.push({
      rule: 'circle-12-requires-organization',
      message: 'Der gebänderte 12-mm-Kreis verlangt die Organisationsfarbe seiner Körperfläche.',
    });
  }
  if (
    isMeasuredCircleVariant &&
    spec.organization !== 'hilfsorganisation'
  ) {
    issues.push({
      rule: 'circle-12-requires-hilfsorganisation',
      message:
        'Der 12-mm-Kreis ist in allen 17 F.3-Belegen (F.3.1–F.3.14 und F.3.17–F.3.19) ' +
        'ausschließlich als weiße ' +
        'HiOrg-Körperfläche vermessen. Andere oder fehlende Organisationszuordnungen sind ' +
        'auch ohne Beschriftung nicht belegt.',
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
    if (!isMeasuredVehicleLand && !isMeasuredCircleVariant) {
      issues.push({
        rule: 'top-left-metrics-require-measured-vehicle-land',
        message:
          'Individuelle topLeft-Metriken sind nur am normalen und gebänderten F.2-Landfahrzeug ' +
          'sowie den beiden F.3-Kreisfassungen vermessen. Andere Arten und Varianten behalten ' +
          'ihre eigenen Profilwerte.',
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

  // Nur Profile mit Organisations-Tinte brauchen eine Organisation, die diese Farbe liefert.
  // Das G.3.5-Kreisband trägt `belowRight` dagegen ausdrücklich schwarz; seine unabhängige
  // Organisationspflicht für die Körperfläche wird weiter oben separat geprüft.
  if (
    spec.labels?.belowRight !== undefined &&
    profileFor(spec.kind, spec.bodyVariant).belowRight?.ink === 'organization' &&
    spec.organization === undefined
  ) {
    issues.push({
      rule: 'below-right-label-requires-organization',
      message:
        'Dieses Körperprofil führt die Beschriftungszone unterhalb des Körpers in der ' +
        'Organisationsfarbe (#003296 an E.2.27 bis E.2.31). Ohne Organisation hat sie keine ' +
        'gemessene Farbe.',
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
