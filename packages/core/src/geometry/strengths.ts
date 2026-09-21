import type { HeadMark, HeadShape, StrengthId } from '@einsatzzeichen/schema';

/** Radius jeder Marke. Vermessen an allen elf Referenzdateien der Stärkeangaben. */
const DOT_RADIUS_MM = 1.5;

/**
 * Die drei festen Plätze der waagerechten Reihe, links nach rechts. Vermessen an C.1.2/C.1.9
 * (gruppe: äußere zwei) und C.1.3/C.1.11/D.3.7/E.1.18 (zug: alle drei) sowie C.1.7/C.1.13/C.1.14
 * (trupp: nur die Mitte). Kein Stärkegrad definiert einen vierten Platz — die Reihe ist mit
 * diesen drei Plätzen vollständig belegt, nicht nur beispielhaft besetzt.
 */
const ROW_SLOTS_MM = [11, 16, 21] as const;
const [, CENTER_X_MM] = ROW_SLOTS_MM;

/** Abstand der beiden gestapelten Marken der Staffel. Vermessen an C.1.1/C.1.8: 1,5 und 5,5. */
const STACK_CY_FROM_TOP_MM = [1.5, 5.5] as const;

const ROW_HEIGHT_MM = DOT_RADIUS_MM * 2;
const STACK_HEIGHT_MM = STACK_CY_FROM_TOP_MM[1] + DOT_RADIUS_MM;

/**
 * Belegung der drei Reihenplätze je Stärkegrad — als Datum lesbar: `gruppe` besetzt die äußeren
 * zwei Plätze und lässt die Mitte frei, `zug` besetzt alle drei, `trupp` nur die Mitte.
 * Ein Grad ohne Eintrag hier (oder ohne besonderen Fall in `strengthHead`) hat keine Kopfzone —
 * das ist beabsichtigt, nicht vergessen: die Zuordnung stammt ausschließlich aus der Vermessung.
 */
const ROW_OCCUPANCY: Record<'trupp' | 'gruppe' | 'zug', readonly [boolean, boolean, boolean]> = {
  trupp: [false, true, false],
  gruppe: [true, false, true],
  zug: [true, true, true],
};

/** Baut die waagerechte Reihe aus den belegten Plätzen von `ROW_SLOTS_MM`. */
function rowHead(occupancy: readonly [boolean, boolean, boolean]): HeadShape {
  const marks: HeadMark[] = ROW_SLOTS_MM.filter((_, index) => occupancy[index]).map((cxMm) => ({
    cxMm,
    cyFromTopMm: DOT_RADIUS_MM,
    rMm: DOT_RADIUS_MM,
  }));
  if (marks.length === 0) {
    throw new Error(
      'Kopfzone "Reihe" ohne belegten Platz ist nicht definiert — mindestens ein Platz von ' +
        `${ROW_SLOTS_MM.join('/')} muss besetzt sein.`,
    );
  }
  return { marks, heightMm: ROW_HEIGHT_MM };
}

/** Baut den senkrechten Stapel aus `STACK_CY_FROM_TOP_MM`, mittig auf der Reihenachse. */
function stackHead(): HeadShape {
  const marks: HeadMark[] = STACK_CY_FROM_TOP_MM.map((cyFromTopMm) => ({
    cxMm: CENTER_X_MM,
    cyFromTopMm,
    rMm: DOT_RADIUS_MM,
  }));
  return { marks, heightMm: STACK_HEIGHT_MM };
}

/**
 * Kopfzone je Stärkegrad, nach Kapitel 5.4. Alle vier Grade sind an der Referenz vermessen
 * (siehe Konstanten oben) — keiner der vier Fälle rät eine Anordnung.
 */
export function strengthHead(id: StrengthId): HeadShape {
  switch (id) {
    case 'staffel':
      return stackHead();
    case 'trupp':
    case 'gruppe':
    case 'zug':
      return rowHead(ROW_OCCUPANCY[id]);
  }
}
