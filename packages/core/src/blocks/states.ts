import type { BlockEntry, StateId } from '@einsatzzeichen/schema';
import { babz, block, measured } from './helpers.js';

/**
 * Zustände und Tendenzen aus Kapitel 5.8.
 *
 * **`measured` heißt hier nicht „platzierbar".** Die Zeichnungen in
 * `catalog/src/pictograms/states/` sind eigenständige Piktogramme in der 32×32-mm-ViewBox
 * (`placement: { mode: 'standalone' }`), keine Randlagen-Fassung an einem Grundzeichen
 * (`docs/decisions/2026-08-07-kapitel-5-8-zustaende-d2.md` §2). Das Register führt als Zone die
 * Zielzone `state-margin` bzw. `tendency-margin`. Diese Randlagen sind im Zonenmodell an keiner
 * Körperform vermessen (`core/src/layout/zones.ts`, `STATE_MARGIN_GAP` und
 * `TENDENCY_MARGIN_GAP`). Der Messstand bezieht sich allein auf die vorhandene Zeichnung.
 *
 * Die Entscheidung vom 7. August 2026 nennt 61 Kennungen und 67 Darstellungen. Sechs Kennungen
 * haben neben der Primärdarstellung eine Alternative. Der Eintrag zeigt auf die
 * Primärdarstellung. Die Alternative steht als Kommentar über dem Eintrag, eine eigene Kennung
 * bekommt sie nicht.
 *
 * `definedAt` umfasst den `defineState`-Aufruf. `sourceRefs` übernimmt dessen `section`. `note`
 * übernimmt die Herkunftsaussage aus dem Kopfkommentar der jeweiligen Datei, die in allen neun
 * Dateien gleich lautet. Eine Kombinationsbindung gibt es nicht: Der Regelkatalog führt für
 * Zustand und Tendenz keine Regel (`core/src/rules/rule-catalog.ts`, Dimensionslücken `state`
 * und `tendency`).
 */
const STATE_NOTE = 'Maße an der Referenz abgelesen, Geometrie eigenständig konstruiert.';

function state(valueId: StateId, definedAt: string, section: string): BlockEntry {
  return block('state', valueId, 'state-margin', measured(definedAt, STATE_NOTE, babz(section)));
}

function tendency(valueId: StateId, definedAt: string, section: string): BlockEntry {
  return block(
    'tendency',
    valueId,
    'tendency-margin',
    measured(definedAt, STATE_NOTE, babz(section)),
  );
}

/** Alle `STATE_IDS` außer den Tendenzen, in Kapitelreihenfolge (5.8.1, 5.8.2, 5.8.4–5.8.9). */
export const STATE_BLOCKS: readonly BlockEntry[] = Object.freeze([
  state('tactical-rescue', 'catalog/src/pictograms/states/01-tactics-hazards.ts:421–429', '5.8.1.1'),
  state('tactical-attack', 'catalog/src/pictograms/states/01-tactics-hazards.ts:430–438', '5.8.1.2'),
  state('tactical-defense', 'catalog/src/pictograms/states/01-tactics-hazards.ts:439–447', '5.8.1.3'),
  state('tactical-retreat', 'catalog/src/pictograms/states/01-tactics-hazards.ts:448–456', '5.8.1.4'),
  state('flooded-area', 'catalog/src/pictograms/states/01-tactics-hazards.ts:457–465', '5.8.1.5'),
  state('water-ingress-hazard', 'catalog/src/pictograms/states/01-tactics-hazards.ts:466–474', '5.8.1.6'),
  // Zweite Darstellung `variant: 'alternative'` in 01-tactics-hazards.ts:484–493.
  state('hazardous-substances', 'catalog/src/pictograms/states/01-tactics-hazards.ts:475–483', '5.8.1.7'),
  // Zweite Darstellung `variant: 'alternative'` in 01-tactics-hazards.ts:503–512.
  state('radioactivity-hazard', 'catalog/src/pictograms/states/01-tactics-hazards.ts:494–502', '5.8.1.8'),
  state('electrical-energy-hazard', 'catalog/src/pictograms/states/01-tactics-hazards.ts:513–521', '5.8.1.9'),
  state('mineral-oil-hazard', 'catalog/src/pictograms/states/01-tactics-hazards.ts:522–530', '5.8.1.10'),
  state('explosion-hazard', 'catalog/src/pictograms/states/01-tactics-hazards.ts:531–539', '5.8.1.11'),
  state('explosive-ordnance-hazard', 'catalog/src/pictograms/states/01-tactics-hazards.ts:540–548', '5.8.1.12'),
  // Zweite Darstellung `variant: 'alternative'` in 01-tactics-hazards.ts:558–567.
  state('suspected-situation', 'catalog/src/pictograms/states/01-tactics-hazards.ts:549–557', '5.8.1.13'),
  // Zweite Darstellung `variant: 'alternative'` in 01-tactics-hazards.ts:577–586.
  state('acute-situation', 'catalog/src/pictograms/states/01-tactics-hazards.ts:568–576', '5.8.1.14'),
  state('activity-slightly-increased-outage-up-to-25-percent', 'catalog/src/pictograms/states/02-activity.ts:119–127', '5.8.2.1'),
  state('activity-moderately-increased-outage-up-to-50-percent', 'catalog/src/pictograms/states/02-activity.ts:128–136', '5.8.2.2'),
  state('activity-significantly-increased-outage-up-to-75-percent', 'catalog/src/pictograms/states/02-activity.ts:137–145', '5.8.2.3'),
  state('activity-strongly-increased-total-outage', 'catalog/src/pictograms/states/02-activity.ts:146–154', '5.8.2.4'),
  state('damaged', 'catalog/src/pictograms/states/04-damage.ts:93–101', '5.8.4.1'),
  state('partially-destroyed', 'catalog/src/pictograms/states/04-damage.ts:102–110', '5.8.4.2'),
  state('destroyed', 'catalog/src/pictograms/states/04-damage.ts:111–119', '5.8.4.3'),
  state('incipient-fire', 'catalog/src/pictograms/states/05-fire.ts:51–59', '5.8.5.1'),
  state('developed-fire', 'catalog/src/pictograms/states/05-fire.ts:60–68', '5.8.5.2'),
  state('fully-developed-fire', 'catalog/src/pictograms/states/05-fire.ts:69–77', '5.8.5.3'),
  state('sick-animal', 'catalog/src/pictograms/states/06-animals.ts:99–108', '5.8.6.1'),
  // Zweite Darstellung `variant: 'alternative'` in 06-animals.ts:119–128.
  state('contaminated-animal', 'catalog/src/pictograms/states/06-animals.ts:109–118', '5.8.6.2'),
  state('dead-animal', 'catalog/src/pictograms/states/06-animals.ts:129–143', '5.8.6.3'),
  state('weather-sunny', 'catalog/src/pictograms/states/07-weather.ts:287–295', '5.8.7.1'),
  state('weather-cloudy', 'catalog/src/pictograms/states/07-weather.ts:296–304', '5.8.7.2'),
  state('weather-cloud-cover-four-eighths', 'catalog/src/pictograms/states/07-weather.ts:305–313', '5.8.7.3'),
  state('weather-foggy', 'catalog/src/pictograms/states/07-weather.ts:314–323', '5.8.7.4'),
  state('weather-rainy', 'catalog/src/pictograms/states/07-weather.ts:324–332', '5.8.7.5'),
  state('weather-hailing', 'catalog/src/pictograms/states/07-weather.ts:333–341', '5.8.7.6'),
  state('weather-thunderstorm', 'catalog/src/pictograms/states/07-weather.ts:342–350', '5.8.7.7'),
  state('weather-snowing', 'catalog/src/pictograms/states/07-weather.ts:351–360', '5.8.7.8'),
  state('weather-temperature', 'catalog/src/pictograms/states/07-weather.ts:361–372', '5.8.7.9'),
  state('weather-windy', 'catalog/src/pictograms/states/07-weather.ts:373–390', '5.8.7.10'),
  state('person-uninjured', 'catalog/src/pictograms/states/08-persons.ts:185–193', '5.8.8.1'),
  state('person-affected', 'catalog/src/pictograms/states/08-persons.ts:194–203', '5.8.8.2'),
  state('person-injured', 'catalog/src/pictograms/states/08-persons.ts:204–212', '5.8.8.3'),
  state('person-injured-triage-category', 'catalog/src/pictograms/states/08-persons.ts:213–221', '5.8.8.4'),
  state('person-injured-transport-priority', 'catalog/src/pictograms/states/08-persons.ts:222–231', '5.8.8.5'),
  // Zweite Darstellung `variant: 'alternative'` in 08-persons.ts:241–251.
  state('person-contaminated', 'catalog/src/pictograms/states/08-persons.ts:232–240', '5.8.8.6'),
  state('person-dead', 'catalog/src/pictograms/states/08-persons.ts:252–261', '5.8.8.7'),
  state('person-missing', 'catalog/src/pictograms/states/08-persons.ts:262–271', '5.8.8.8'),
  state('person-in-water-danger', 'catalog/src/pictograms/states/08-persons.ts:272–282', '5.8.8.9'),
  state('person-in-distress', 'catalog/src/pictograms/states/08-persons.ts:283–292', '5.8.8.10'),
  state('person-rescued', 'catalog/src/pictograms/states/08-persons.ts:293–302', '5.8.8.11'),
  state('person-to-be-transported', 'catalog/src/pictograms/states/08-persons.ts:303–312', '5.8.8.12'),
  state('person-in-transport', 'catalog/src/pictograms/states/08-persons.ts:313–321', '5.8.8.13'),
  state('person-transported', 'catalog/src/pictograms/states/08-persons.ts:322–331', '5.8.8.14'),
  state('person-needing-special-care', 'catalog/src/pictograms/states/08-persons.ts:332–341', '5.8.8.15'),
  state('person-care-dependent', 'catalog/src/pictograms/states/08-persons.ts:342–351', '5.8.8.16'),
  state('person-mobility-impaired', 'catalog/src/pictograms/states/08-persons.ts:352–365', '5.8.8.17'),
  state('route-closed', 'catalog/src/pictograms/states/09-access.ts:42–51', '5.8.9.1'),
  state('one-way-traffic', 'catalog/src/pictograms/states/09-access.ts:52–61', '5.8.9.2'),
  state('route-difficult-to-pass', 'catalog/src/pictograms/states/09-access.ts:62–71', '5.8.9.3'),
  state('route-impassable', 'catalog/src/pictograms/states/09-access.ts:72–81', '5.8.9.4'),
]);

/** Die drei Tendenzen aus 5.8.3. Im Schema stehen sie als Werte von `STATE_IDS`. */
export const TENDENCY_BLOCKS: readonly BlockEntry[] = Object.freeze([
  tendency('tendency-rising', 'catalog/src/pictograms/states/03-tendencies.ts:73–81', '5.8.3.1'),
  tendency('tendency-unchanged', 'catalog/src/pictograms/states/03-tendencies.ts:82–90', '5.8.3.2'),
  tendency('tendency-falling', 'catalog/src/pictograms/states/03-tendencies.ts:91–99', '5.8.3.3'),
]);
