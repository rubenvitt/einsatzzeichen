import type {
  BodyVariantId,
  CapabilityCombinationException,
  CapabilityCombinationForm,
  CapabilityCombinationRule,
  CapabilityPresentation,
  GrammarEvidence,
  SymbolKind,
} from '@einsatzzeichen/schema';

/**
 * Mehrere Fähigkeiten in einem Zeichen (LFH-567): wie sie zueinander stehen, je Darstellung und je
 * Körperfassung, als Daten.
 *
 * **Was der Bestand belegt.** 15 Fixtures tragen zwei oder drei Fähigkeiten, alle in der
 * randbündigen Darstellung (`bodyMarks`) aus Anhang D und F, verteilt auf sieben Körperfassungen.
 * Elf davon folgen einer einzigen Regel: **Überlagerung**. Jede Fähigkeit steht in ihrer
 * Einzelfassung auf derselben Körperfläche; die Kombination teilt die Fläche nicht und verkleinert
 * nichts. Die Fachdienstteilung (das Kreuz auf den Mittellinien) ist dabei **keine** Teilung für
 * mehrere Fähigkeiten, sondern das Zeichen 4.6.1 selbst: `F.1.3` zeigt das Zelt ohne Kreuz, `F.1.4`
 * zeigt Zelt und Kreuz als zwei Marken nebeneinander.
 *
 * Vier Fixtures weichen ab: dort steht eine Marke in der Kombination an anderer, eigens vermessener
 * Stelle als allein. Die Abweichungen laufen in verschiedene Richtungen (die Arztleiste rückt in
 * F.1.12#alternative 2 mm nach außen, in F.2.5#alternative 1 mm nach außen, in F.1.13 1 mm nach
 * innen) und ergeben keine Regel. Sie bleiben **benannte Ausnahmen**, gezeichnet von
 * `COMBINATION_MARKS` in `geometry/body-marks.ts`.
 *
 * **Was der Bestand nicht belegt.** Kein Original trägt zwei Piktogramme in der Boxfassung
 * (`capabilities`). Der Motor legt sie heute deckungsgleich in dieselbe Box; das ist keine Regel,
 * sondern die Abwesenheit einer. Die Empfehlung, bis zu einem Beleg höchstens eine Boxfähigkeit
 * zuzulassen, steht als vorgemerkte Regel in `rules/planned-capability-rules.ts` und ist nicht in
 * Kraft.
 *
 * Die Gates: `capability-combinations.test.ts` hier (Form der Daten, Ausnahmen gegen
 * `BODY_MARK_COMBINATION_OVERRIDES`) und `conformance/src/capability-combination-fixtures.test.ts`
 * (Fixtures gegen die Rezepte in beide Richtungen, und die Regel gegen den Motor: in jeder
 * regelgemäßen Fixture ist jede Marke bytegleich mit ihrer Einzelfassung).
 */

function source(definedAt: string, note: string): GrammarEvidence {
  return { definedAt, note };
}

function asset(file: `${string}.svg`, note: string): GrammarEvidence {
  return { asset: file, note };
}

function form(
  kind: SymbolKind,
  variant: BodyVariantId | undefined,
  fixtures: readonly string[],
  exceptions: readonly string[] = [],
): CapabilityCombinationForm {
  return Object.freeze({
    kind,
    ...(variant === undefined ? {} : { variant }),
    fixtures: Object.freeze([...fixtures]),
    exceptions: Object.freeze([...exceptions]),
  });
}

const COMBINATION_MARKS_AT = 'core/src/geometry/body-marks.ts';

/**
 * Die vier Kombinationsfassungen. Die Notiz ist vom Fundort übernommen, die Zeilen nennen den
 * jeweiligen Eintrag in `COMBINATION_MARKS`.
 */
export const CAPABILITY_COMBINATION_EXCEPTIONS: readonly CapabilityCombinationException[] =
  Object.freeze([
    {
      fixture: 'F.1.12#alternative',
      asset: 'F.1.12_Nachbarschaftliche Soforthilfe_Alternative.svg',
      kind: 'formation',
      marks: ['patient-transport', 'physician', 'intensive-care'],
      overrides: ['patient-transport', 'physician', 'intensive-care'],
      note:
        'Ring r 5 statt 5,5 (Band 4,75…5,25 um 16|16), Arztleiste auf y 24 (2 mm über der ' +
        'Unterkante) statt 22, Intensivbalken auf x 25,5 (5,5 mm von rechts) statt 23,5.',
      definedAt: `${COMBINATION_MARKS_AT}:2030–2052`,
    },
    {
      fixture: 'F.1.13',
      asset: 'F.1.13_Behandlungsplatz-Bereitschaft.svg',
      kind: 'formation',
      marks: ['care', 'physician', 'ring-7mm-offset-down-1mm'],
      overrides: ['care', 'physician'],
      note:
        'Das Zelt ist ein Dach unter 45° (Mittellinie (3|20) → (16|7) → (29|20)), die ' +
        'Arztleiste steht auf y 21 (5 mm über der Unterkante).',
      definedAt: `${COMBINATION_MARKS_AT}:2053–2073`,
    },
    {
      fixture: 'F.1.22',
      asset: 'F.1.22_Transportzug bis 50 Betroffene.svg',
      kind: 'formation',
      marks: ['care', 'patient-transport'],
      overrides: ['patient-transport'],
      note:
        'Unter dem Zelt steht der Ring r 5 mit acht Speichen um (16|18,5), 2,5 mm unter der ' +
        'Körpermitte, und ohne Fachdienstteilung.',
      definedAt: `${COMBINATION_MARKS_AT}:2074–2086`,
    },
    {
      fixture: 'F.2.5#alternative',
      asset: 'F.2.5_NAW_Alternative.svg',
      kind: 'vehicle-land',
      variant: 'plain-wheel-pair',
      marks: ['patient-transport', 'intensive-care', 'physician'],
      overrides: ['physician'],
      note: 'Arztleiste auf y 23 (3 mm über der Unterkante) statt 22 wie in F.2.4#alt.',
      definedAt: `${COMBINATION_MARKS_AT}:2087–2098`,
    },
  ] satisfies readonly CapabilityCombinationException[]);

const FLUSH_FORMS: readonly CapabilityCombinationForm[] = Object.freeze([
  form('formation', undefined, ['F.1.4', 'F.1.15#alternative', 'F.1.19'], [
    'F.1.12#alternative',
    'F.1.13',
    'F.1.22',
  ]),
  form('formation', 'foot-band', ['F.1.3', 'F.1.17']),
  form('person', undefined, ['D.3.10']),
  form('vehicle-land', 'plain-wheel-pair', ['F.2.3#alternative'], ['F.2.5#alternative']),
  form('vehicle-land', 'foot-band', ['F.2.13', 'F.2.17']),
  form('circle-12', undefined, ['F.3.4']),
  form('circle-12', 'raised-gable', ['F.3.5']),
]);

const MIXED_PRESENTATION = 'capabilities-presentation-mixed';

export const CAPABILITY_COMBINATION_RULES: readonly CapabilityCombinationRule[] = Object.freeze([
  {
    presentation: 'flush',
    field: 'bodyMarks',
    arrangement: {
      status: 'evidenced',
      value: 'overlay',
      evidence: [
        asset(
          'F.1.4_Einsatzeinheit.svg',
          'Teilung (4.6.1) und Zelt (4.2.1) stehen als zwei Marken in ihrer Einzelfassung auf derselben Körperfläche; das Zelt zerschneidet die Felder der Teilung.',
        ),
        source(
          'core/src/geometry/body-marks.ts:670–698',
          'Die Zeltmarke trägt die Teilung nicht mit: F.1.3 zeigt das Zelt ohne Kreuz. Die Teilung ist das Zeichen 4.6.1 und keine Teilung der Fläche für mehrere Fähigkeiten.',
        ),
        source(
          'conformance/src/capability-combination-fixtures.test.ts',
          'In allen elf regelgemäßen Fixtures ist jede Marke der Kombination bytegleich mit ihrer Einzelfassung an derselben Körperhülle.',
        ),
      ],
      remaining:
        'Vier Fixtures weichen als benannte Ausnahme ab (`exceptions`). Keine Fixture teilt die Fläche oder verkleinert alle Marken gleichmäßig.',
    },
    order: {
      status: 'evidenced',
      value: 'irrelevant',
      evidence: [
        source(
          'core/src/spec-key.ts:6–25',
          '`bodyMarks` wird als Menge gelesen: `validateSpec` prüft nur Enthaltensein und Länge, die Kombinationsfassungen wählen reihenfolgefrei.',
        ),
        source(
          'conformance/src/combination-provenance.test.ts:68–77',
          'F.1.4 mit vertauschter Markenfolge besteht denselben Vergleich gegen die Referenz.',
        ),
      ],
      remaining:
        'Alle Marken sind schwarze Striche oder Flächen auf dem Körper; eine Reihenfolge, die das Bild ändert, würde erst eine andersfarbige Marke sichtbar machen.',
    },
    maxObserved: {
      status: 'evidenced',
      value: 3,
      evidence: [
        asset('F.1.12_Nachbarschaftliche Soforthilfe_Alternative.svg', 'Patiententransport, Arztwesen, Intensivmedizin.'),
        asset('F.2.5_NAW_Alternative.svg', 'Patiententransport, Intensivmedizin, Arztwesen.'),
      ],
      remaining:
        'F.1.13 trägt ebenfalls drei Marken, davon zwei Fähigkeiten und einen rein technischen Ring.',
    },
    perSign: {
      status: 'open',
      question:
        'Kein Original trägt mehr als drei Fähigkeiten randbündig. Setzt die Systematik eine Grenze, oder trägt die Überlagerung beliebig viele, solange jede Einzelfassung an der Körperform vermessen ist?',
    },
    forms: FLUSH_FORMS,
    otherForms: {
      status: 'proposed',
      value: 'overlay',
      reason:
        'Die Überlagerung braucht keine Zahl je Körperform: jede Marke rechnet ihre Einzelfassung gegen die Hülle dieser Form. So verhält sich der Motor heute an jeder Fassung. Wo eine Einzelfassung fehlt, wirft `bodyMark()` weiter `NotMeasuredError`; die Regel erfindet keine Lage.',
    },
    exceptions: CAPABILITY_COMBINATION_EXCEPTIONS,
    plannedRules: [MIXED_PRESENTATION],
  },
  {
    presentation: 'box',
    field: 'capabilities',
    arrangement: {
      status: 'open',
      question:
        'Kein Original zeigt zwei Kapitel-4-Piktogramme in der Boxfassung. Der Motor legt sie heute deckungsgleich in dieselbe Box 4/8/24/16 mm. Teilt die Systematik die Box, verkleinert sie die Piktogramme, oder gibt es in der Boxfassung nur eine Fähigkeit?',
    },
    order: {
      status: 'open',
      question:
        'Sobald die Anordnung entschieden ist: hängt an der Reihenfolge eine Lage, etwa links/rechts oder oben/unten?',
    },
    maxObserved: {
      status: 'evidenced',
      value: 0,
      evidence: [
        source(
          'conformance/src/capability-combination-fixtures.test.ts',
          'Keine der Fixtures setzt `capabilities`; die Boxfassung ist nur in Testkompositionen belegt, nicht an einem Original.',
        ),
      ],
    },
    perSign: {
      status: 'proposed',
      value: 1,
      reason:
        'Bis zu einem Original mit zwei Boxpiktogrammen höchstens eines. Zwei Piktogramme in derselben Box überdecken einander; das ist eine stille Fehldarstellung und keine Regel. Wer mehrere Fähigkeiten braucht, hat die randbündige Darstellung.',
    },
    forms: [],
    otherForms: {
      status: 'open',
      question:
        'Die Box 4/8/24/16 mm ist an allen Körperformen dieselbe. Gilt die Anordnung, sobald sie entschieden ist, dann an jeder Körperform gleich?',
    },
    exceptions: [],
    plannedRules: ['capabilities-box-limit-exceeded', MIXED_PRESENTATION],
  },
] satisfies readonly CapabilityCombinationRule[]);

/** Nachschlag je Darstellung. */
export function capabilityCombinationRule(
  presentation: CapabilityPresentation,
): CapabilityCombinationRule {
  const found = CAPABILITY_COMBINATION_RULES.find((rule) => rule.presentation === presentation);
  if (found === undefined) throw new Error(`Keine Kombinationsregel für "${presentation}"`);
  return found;
}

/**
 * Die belegte Fassung einer Körperform, oder `undefined`, wenn an ihr kein Original mehrere
 * Fähigkeiten trägt. Dann gilt `otherForms` der Regel.
 */
export function capabilityCombinationForm(
  presentation: CapabilityPresentation,
  kind: SymbolKind,
  variant?: BodyVariantId,
): CapabilityCombinationForm | undefined {
  return capabilityCombinationRule(presentation).forms.find(
    (candidate) => candidate.kind === kind && candidate.variant === variant,
  );
}
