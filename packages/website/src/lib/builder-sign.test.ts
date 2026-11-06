import { describe, expect, it } from 'vitest';
import { encodeSpecParam } from '@einsatzzeichen/core/exact';
import type { Choice } from '@einsatzzeichen/core';
import {
  CHOICE_SEARCH_THRESHOLD,
  DEFAULT_SIGN,
  changeKind,
  choiceSearchable,
  choicesMatch,
  decodeSign,
  encodeSign,
  familyOf,
  omissionLine,
  probeSign,
  probeTasks,
  searchChoices,
  searchTasks,
  sectionVisible,
  setCenterSize,
  setSingle,
  setText,
  setTopLeftLines,
  splitChoices,
  toggleList,
  valueLabel,
} from './builder-sign.js';

const choice = (value: string, status: Choice['status'], selected = false): Choice => ({ value, label: value, status, selected });

describe('changeKind()', () => {
  it('behält die Beschreibung zwischen Arten mit Körper und wirft nur Zeichnung und Bauplan ab', () => {
    const next = changeKind(
      { kind: 'formation', organization: 'thw', head: 'zug', variant: 'raised-gable', exact: { bodyMarks: ['care'] } },
      'person',
    );
    expect(next).toEqual({ kind: 'person', organization: 'thw', head: 'zug' });
  });

  it('beginnt ein freistehendes Zeichen bei der Ausgangsauswahl seiner Art', () => {
    const next = changeKind({ kind: 'person', organization: 'thw' }, 'pictogram');
    expect(next.kind).toBe('pictogram');
    expect(next).not.toHaveProperty('organization');
  });

  it('beginnt den Weg zurück zum Körper beim nackten Körper', () => {
    expect(changeKind({ kind: 'pictogram', pictogram: 'comms.voice-radio' }, 'vehicle-land')).toEqual({ kind: 'vehicle-land' });
  });

  it('lässt die Beschreibung bei derselben Art unverändert', () => {
    const sign = { kind: 'person', organization: 'thw' } as const;
    expect(changeKind(sign, 'person')).toBe(sign);
  });
});

describe('setSingle()', () => {
  it('schließt Organisation und Farbe ohne Organisation gegenseitig aus', () => {
    const colored = setSingle(DEFAULT_SIGN, 'color', 'red');
    expect(colored).toEqual({ kind: 'formation', color: 'red' });
    expect(setSingle(colored, 'organization', 'thw')).toEqual({ kind: 'formation', organization: 'thw' });
    expect(setSingle({ kind: 'formation', organization: 'thw' }, 'color', 'red')).toEqual({ kind: 'formation', color: 'red' });
  });

  it('entfernt einen Wert mit undefined und lässt die übrigen stehen', () => {
    expect(setSingle({ kind: 'formation', organization: 'thw', head: 'zug' }, 'head', undefined)).toEqual({
      kind: 'formation',
      organization: 'thw',
    });
  });
});

describe('toggleList()', () => {
  it('schaltet einen Wert an und ab und lässt eine leere Liste ganz wegfallen', () => {
    const on = toggleList(DEFAULT_SIGN, 'tasks', 'rescue-portable-ladders');
    expect(on).toEqual({ kind: 'formation', tasks: ['rescue-portable-ladders'] });
    expect(toggleList(on, 'tasks', 'rescue-portable-ladders')).toEqual({ kind: 'formation' });
  });

  it('ersetzt eine gesetzte Tendenz statt eine zweite daneben zu stellen', () => {
    const sign = { kind: 'person', states: ['person-injured', 'tendency-rising'] } as const;
    expect(toggleList(sign, 'states', 'tendency-falling').states).toEqual(['person-injured', 'tendency-falling']);
  });
});

describe('Text', () => {
  it('setzt und entfernt Zonen; ohne Zone fällt text ganz weg', () => {
    const withCenter = setText(DEFAULT_SIGN, 'center', 'LST');
    expect(withCenter).toEqual({ kind: 'formation', text: { center: 'LST' } });
    expect(setText(withCenter, 'center', '')).toEqual({ kind: 'formation' });
  });

  it('nimmt mit dem mittigen Text auch seine Größe zurück und speichert „normal“ nicht', () => {
    const large = setCenterSize(setText(DEFAULT_SIGN, 'center', 'LtS'), 'large');
    expect(large.text).toEqual({ center: 'LtS', centerSize: 'large' });
    expect(setCenterSize(large, 'normal').text).toEqual({ center: 'LtS' });
    expect(setText(large, 'center', '')).toEqual({ kind: 'formation' });
  });

  it('führt oben links zwei Zeilen und entfernt die Zone, wenn beide leer sind', () => {
    const lines = setTopLeftLines(DEFAULT_SIGN, 'A', 'B');
    expect(lines.text).toEqual({ topLeftLines: ['A', 'B'] });
    expect(setTopLeftLines(lines, '', '')).toEqual({ kind: 'formation' });
  });
});

describe('Welche Werte passen', () => {
  it('zeigt einen Abschnitt, wenn ein Wert passt oder gesetzt ist', () => {
    expect(sectionVisible(undefined)).toBe(false);
    expect(sectionVisible([choice('a', 'blocked'), choice('b', 'blocked')])).toBe(false);
    expect(sectionVisible([choice('a', 'blocked'), choice('b', 'derived')])).toBe(true);
    expect(sectionVisible([choice('a', 'blocked', true)])).toBe(true);
  });

  it('stellt einen gesetzten Wert immer zu den passenden, auch wenn er gesperrt ist', () => {
    const { fitting, blocked } = splitChoices([choice('a', 'measured'), choice('b', 'blocked'), choice('c', 'blocked', true)]);
    expect(fitting.map((entry) => entry.value)).toEqual(['a', 'c']);
    expect(blocked.map((entry) => entry.value)).toEqual(['b']);
  });

  it('befragt an der Einheit kein Fahrwerk als passend, am Fahrzeug schon', () => {
    const atUnit = probeSign({ kind: 'formation' });
    const atVehicle = probeSign({ kind: 'vehicle-land' });
    expect(sectionVisible(atUnit.get('chassis'))).toBe(false);
    expect(sectionVisible(atVehicle.get('chassis'))).toBe(true);
    expect(sectionVisible(atVehicle.get('role'))).toBe(false);
  });

  it('befragt nur die genannten Fachaufgaben, in ihrer Reihenfolge', () => {
    expect(probeTasks(DEFAULT_SIGN, [])).toEqual([]);
    const probe = probeTasks(DEFAULT_SIGN, ['rescue-portable-ladders', 'meal-preparation']);
    expect(probe.map((entry) => entry.value)).toEqual(['rescue-portable-ladders', 'meal-preparation']);
  });

  it('findet Fachaufgaben auch ohne Umlaute', () => {
    const hits = searchTasks('Verpflegung').map((option) => option.value);
    expect(hits).toContain('meal-preparation');
    expect(searchTasks('Sanitaet').length).toBeGreaterThan(0);
    expect(searchTasks('').length).toBeGreaterThan(50);
  });
});

describe('Suche in langen Auswahlen (ESZ-152)', () => {
  const atPerson = probeSign({ kind: 'person' });
  const states = atPerson.get('states') ?? [];
  const values = (entries: readonly Choice[]) => entries.map((entry) => entry.value);

  it('bietet die Suche nur langen Auswahlen an', () => {
    const atFormation = probeSign(DEFAULT_SIGN);
    expect(CHOICE_SEARCH_THRESHOLD).toBe(16);
    expect(choiceSearchable(atFormation.get('role') ?? [])).toBe(true);
    expect(choiceSearchable(states)).toBe(true);
    expect(choiceSearchable(atFormation.get('head') ?? [])).toBe(false);
    expect(choiceSearchable(atFormation.get('color') ?? [])).toBe(false);
  });

  it('findet Werte über Namen, Kennung und Gruppe, auch ohne Umlaute', () => {
    expect(values(searchChoices(states, 'zerstoert'))).toEqual(['partially-destroyed', 'destroyed']);
    expect(values(searchChoices(states, 'Zerstört'))).toEqual(['partially-destroyed', 'destroyed']);
    expect(values(searchChoices(states, 'person-dead'))).toEqual(['person-dead']);
    expect(values(searchChoices(states, 'Brandphase'))).toEqual(['incipient-fire', 'developed-fire', 'fully-developed-fire']);
    // Gesperrte Werte filtert die Suche genauso: sie stehen danach in der eingeklappten Liste.
    expect(values(searchChoices(states, 'sonnig'))).toEqual(['weather-sunny']);
    expect(searchChoices(states, '  ')).toHaveLength(states.length);
  });

  it('lässt gesetzte Werte während der Suche stehen', () => {
    const withInjured = probeSign({ kind: 'person', states: ['person-injured'] }).get('states') ?? [];
    expect(values(searchChoices(withInjured, 'Brandphase'))).toEqual([
      'incipient-fire',
      'developed-fire',
      'fully-developed-fire',
      'person-injured',
    ]);
    expect(values(searchChoices(withInjured, 'gibt es nicht'))).toEqual(['person-injured']);
    // „Nichts passt“ nur, wenn die Suche gar nichts trifft, auch den gesetzten Wert nicht.
    expect(choicesMatch(withInjured, 'gibt es nicht')).toBe(false);
    expect(choicesMatch(withInjured, 'verletzt')).toBe(true);
    expect(choicesMatch(withInjured, '')).toBe(true);
  });
});

describe('Anzeige', () => {
  it('nennt eine weggelassene Angabe mit Feld, Wert und Grund in Klarsprache', () => {
    const line = omissionLine({ field: 'states', value: 'person-dead', why: 'Eine Skala.' });
    expect(line.what).toMatch(/Person tot/);
    expect(line.what).not.toContain('person-dead');
    expect(line.why).toBe('Eine Skala.');
    expect(omissionLine({ field: 'text.center', value: 'LST', why: 'x' }).what).toMatch(/„LST“/);
  });

  it('benennt Werte und Familien in Klarsprache', () => {
    expect(valueLabel('states', 'person-dead')).toBe('Person tot');
    expect(familyOf({ kind: 'vehicle-land' }).label).toBe('Fahrzeug');
    expect(familyOf({ kind: 'pictogram', pictogram: 'comms.voice-radio' }).id).toBe('freestanding');
  });
});

describe('Link', () => {
  it('schreibt die Beschreibung und liest sie unverändert zurück', () => {
    const sign = { kind: 'person', organization: 'thw', states: ['person-injured'], text: { center: 'A' } } as const;
    expect(decodeSign(encodeSign(sign))).toEqual(sign);
  });

  it('liest einen Link der Hülle v1 als Beschreibung', () => {
    expect(decodeSign(encodeSpecParam({ kind: 'person', organization: 'thw' }))).toEqual({ kind: 'person', organization: 'thw' });
  });

  it('wirft bei einem unbekannten Feld, statt es still zu übergehen', () => {
    expect(() => decodeSign(encodeSign({ kind: 'person', organisation: 'thw' } as never))).toThrow(/organisation/);
  });
});
