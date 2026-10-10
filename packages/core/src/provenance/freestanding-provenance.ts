import {
  isFreestandingSpec,
  type AnySpec,
  type DepictionVariant,
  type FreestandingSpec,
  type PictogramId,
  type WeatherIntensity,
  type WeatherSpec,
} from '@einsatzzeichen/schema';
import { pictogram } from '../geometry/pictograms/index.js';
import { WEATHER_CLOUD_PRECIPITATION, classifyWeather } from '../geometry/weather.js';
import { validateFreestandingSpec } from '../validate-freestanding.js';
import { symbolProvenance, type SymbolProvenance } from './symbol-provenance.js';

/**
 * Herkunft eines freistehenden Zeichens (LFH-798): `verbatim` oder `derived`, wie
 * `symbolProvenance` für die `SymbolSpec`, aber mit einem anderen Beleg.
 *
 * **Was `verbatim` hier heißt.** Die Zeichnung ist die vermessene Darstellung genau einer
 * Referenzdatei, ohne abgeleiteten Teil (`claim: 'reference-file'`): die Einzeldarstellung aus dem
 * Piktogrammregister (Zustand, Piktogramm, Tierzustand, ein einzelner Wetterwert) oder das
 * Wetterbeispiel, an dem die Wolke mit Niederschlag vermessen ist. Die Register sind in ihren
 * Suiten gegen das Kennzahlenartefakt gegatet; hier wird nichts verglichen, nur zugeordnet.
 *
 * **`usage: 'freestanding-not-evidenced'`** steht an den Fähigkeiten aus Kapitel 4 (Entscheidung
 * vom 10.10.2026, Punkt 2): Das Bild ist wörtlich die Kapiteldatei, dass eine Fähigkeit auf der
 * Lagekarte freistehend steht, belegt die Referenz aber nicht. Die übrigen Räume führt sie als
 * eigenständige Zeichen.
 *
 * `derived` heißt wie bei `symbolProvenance`: kein Original zeigt genau dieses Zeichen. Das gilt
 * für jede Zeichnung mit Ableitungsnotiz (Wetterpaare, Regen an der Wolke) und für Pfeile und
 * Linien — deren Verlauf ist eine Eingabe; die Referenz belegt Querschnitt und Pfeilkopf, nicht den
 * Verlauf. Wie dort wird eine Spec, die die Prüfung ablehnt, nicht als Original geführt: sie ist
 * ebenfalls `derived`.
 */
export type FreestandingProvenance =
  | {
    readonly status: 'verbatim';
    /** Was belegt ist: die Zeichnung ist die vermessene Darstellung dieser Referenzdatei. */
    readonly claim: 'reference-file';
    /** Abschnitt der Referenz, etwa `5.8.1.1` oder `J.1.1`. */
    readonly section: string;
    readonly referenceAsset: string;
    /** Gesetzt, wenn die Referenz das Bild belegt, nicht aber seine freistehende Verwendung. */
    readonly usage?: 'freestanding-not-evidenced';
  }
  | { readonly status: 'derived' };

/** Herkunft einer Spec beider Arten. */
export type AnySpecProvenance = SymbolProvenance | FreestandingProvenance;

const DERIVED: FreestandingProvenance = Object.freeze({ status: 'derived' });

function fromRegister(id: PictogramId, variant: DepictionVariant = 'primary'): FreestandingProvenance {
  const definition = pictogram(id, variant);
  return Object.freeze({
    status: 'verbatim',
    claim: 'reference-file',
    section: definition.section,
    referenceAsset: definition.referenceAsset,
    // Kapitel 4 steht im Register als Fassung im Körper, nicht als eigenständiges Zeichen.
    ...(definition.placement.mode === 'in-body' ? { usage: 'freestanding-not-evidenced' as const } : {}),
  });
}

/** Die Intensität im Dateinamen der Wetterbeispiele (`5.8.7_Beispiel_Schneiend_stark.svg`). */
const INTENSITY_IN_FILE_NAME: Readonly<Record<WeatherIntensity, string>> = {
  weak: 'schwach',
  moderate: 'mittel',
  strong: 'stark',
  extreme: 'extrem',
};

function weatherProvenance(spec: WeatherSpec): FreestandingProvenance {
  const verdict = classifyWeather(spec);
  if (verdict.kind !== 'drawable' || verdict.basis !== 'measured') return DERIVED;
  if (verdict.form === 'single') return fromRegister(`state.${spec.values[0]}`);
  // Die Wolke mit einem belegten Niederschlag: das Beispiel mit derselben Intensität.
  const precipitation = spec.values.find((value) => value !== WEATHER_CLOUD_PRECIPITATION.carrier);
  const finding = precipitation === undefined
    ? undefined
    : WEATHER_CLOUD_PRECIPITATION.precipitations[precipitation as keyof typeof WEATHER_CLOUD_PRECIPITATION.precipitations];
  if (finding?.status !== 'evidenced' || spec.intensity === undefined) return DERIVED;
  const suffix = `_${INTENSITY_IN_FILE_NAME[spec.intensity]}.svg`;
  const example = finding.evidence.find((evidence) => 'asset' in evidence && evidence.asset.endsWith(suffix));
  if (example === undefined || !('asset' in example)) return DERIVED;
  return Object.freeze({ status: 'verbatim', claim: 'reference-file', section: '5.8.7', referenceAsset: example.asset });
}

/**
 * Herkunft eines freistehenden Zeichens. Siehe die Bedeutung am Typ `FreestandingProvenance`.
 */
export function freestandingProvenance(spec: FreestandingSpec): FreestandingProvenance {
  if (validateFreestandingSpec(spec).length > 0) return DERIVED;
  switch (spec.kind) {
    case 'state':
      return fromRegister(`state.${spec.state}`, spec.variant);
    case 'pictogram':
      return fromRegister(spec.pictogram, spec.variant);
    case 'animal-state':
      return fromRegister(`state.${spec.state}`, spec.variant);
    case 'weather':
      return weatherProvenance(spec);
    case 'movement':
    case 'line':
      return DERIVED;
  }
}

/**
 * Herkunft einer Spec beider Arten: eine `SymbolSpec` über `symbolProvenance` (Körperhülle gegen
 * eine Fixture), ein freistehendes Zeichen über `freestandingProvenance` (Referenzdatei).
 */
export function anySpecProvenance(spec: AnySpec): AnySpecProvenance {
  return isFreestandingSpec(spec) ? freestandingProvenance(spec) : symbolProvenance(spec);
}
