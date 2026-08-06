import { deepFreeze } from '../../readonly-data.js';
import { strokeCapability as icon } from '../authoring.js';

/** Piktogramme des Kapitels 4.5: eigenständige Konstruktionen nach der Bildidee der Referenz. */
export const RESCUE_CAPABILITIES = deepFreeze([
  icon({ section: '4.5.1', id: 'recovery', title: 'Bergung',
    referenceAsset: '4.5.1_Bergung.svg',
    d: 'M 6 10 V 24 M 6 13 H 12 M 12 13 C 12 20 16 23 21 23 C 25 23 27 20 27 16 M 27 13 V 16 M 21 13 H 27' }),
  icon({ section: '4.5.2', id: 'rescue-portable-ladders',
    title: 'Retten aus Höhen und Tiefen mit tragbaren Leitern',
    referenceAsset: '4.5.2_Retten aus Höhen und Tiefen mit tragbaren Leitern.svg',
    d: 'M 10 8 V 24 M 22 8 V 24 M 10 11 H 22 M 10 15 H 22 M 10 19 H 22 M 10 23 H 22' }),
  icon({ section: '4.5.3', id: 'rescue-aerial-ladder',
    title: 'Retten aus Höhen und Tiefen mit Drehleiter',
    referenceAsset: '4.5.3_Retten aus Höhen und Tiefen mit Drehleiter.svg',
    d: 'M 5 24 L 18 11 M 18 11 V 8 H 24 V 14 H 18 M 8 21 L 11 24 M 11 18 L 14 21 M 14 15 L 17 18' }),
  icon({ section: '4.5.4', id: 'rescue-articulated-boom',
    title: 'Retten aus Höhen und Tiefen mit Teleskopgelenkmast',
    referenceAsset: '4.5.4_Retten aus Höhen und Tiefen mit Teleskopgelenkmast.svg',
    d: 'M 7 24 L 12 14 L 20 12 M 20 12 V 8 H 26 V 14 H 20 M 10 19 L 15 20' }),
  icon({ section: '4.5.5', id: 'watercraft-operations', title: 'Einsatz von Wasserfahrzeugen',
    referenceAsset: '4.5.5_Einsatz von Wasserfahrzeugen.svg',
    d: 'M 11 12 H 21 C 21 17 19 20 16 20 C 13 20 11 17 11 12 Z M 4 10 C 6 8 8 13 10 10 M 22 10 C 24 8 26 13 28 10 M 4 22 C 6 19 8 24 10 22 M 22 22 C 24 19 26 24 28 22' }),
  icon({ section: '4.5.6', id: 'mountain-rescue', title: 'Bergrettung',
    referenceAsset: '4.5.6_Bergrettung.svg',
    d: 'M 16 8 L 20 12 L 16 16 L 12 12 Z M 16 16 L 22 24 H 10 Z' }),
  icon({ section: '4.5.7', id: 'special-height-depth-rescue',
    title: 'Spezielle Rettung aus Höhen und Tiefen',
    referenceAsset: '4.5.7_Spezielle Rettung aus Höhen und Tiefen.svg',
    d: 'M 16 11 L 20 15 L 16 19 L 12 15 Z M 16 8 V 11 M 13 10 L 16 8 L 19 10 M 16 19 V 24 M 13 22 L 16 24 L 19 22' }),
  icon({ section: '4.5.8', id: 'water-rescue', title: 'Wasserrettung',
    referenceAsset: '4.5.8_Wasserrettung.svg',
    d: 'M 5 10 C 8 8 11 14 14 10 C 17 8 20 14 23 10 C 25 8 27 9 28 10 M 5 14 C 8 10 11 18 14 14 C 17 10 20 18 23 14 C 25 12 27 13 28 14 M 16 16 L 22 22 L 16 24 L 10 22 Z' }),
] as const);
