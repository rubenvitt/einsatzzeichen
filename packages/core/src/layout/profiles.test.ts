import { describe, expect, it } from 'vitest';
import type { BodyVariantId, Primitive, SymbolKind } from '@einsatzzeichen/schema';
import { boundsOfMm } from '../bounds.js';
import { HEAD_GAP_MM, HEAD_TOP_MARGIN_MM, placeHead, profileFor } from './profiles.js';

const rectBody: Primitive = { type: 'rect', role: 'body', x: 1, y: 6, width: 30, height: 20 };

const halfSide = (15 * Math.SQRT2) / 2;
const diamondBody: Primitive = {
  type: 'rect',
  role: 'body',
  x: 16 - halfSide,
  y: 16 - halfSide,
  width: halfSide * 2,
  height: halfSide * 2,
  transform: { rotate: { angle: 45, cx: 16, cy: 16 } },
};

describe('Layoutprofile', () => {
  it('verwendet 1 mm Abstand und 1 mm oberen Rand', () => {
    expect(HEAD_GAP_MM).toBe(1);
    expect(HEAD_TOP_MARGIN_MM).toBe(1);
  });

  it('kennt den Standardanker jeder Körperform', () => {
    expect(profileFor('formation').defaultAnchorMm).toBe(6);
    expect(profileFor('person').defaultAnchorMm).toBe(1);
    expect(profileFor('post').defaultAnchorMm).toBe(2);
  });

  it('lässt den Körper ohne Kopfzone unverändert', () => {
    const placed = profileFor('formation').place(rectBody, null);
    expect(boundsOfMm(placed)).toEqual(boundsOfMm(rectBody));
  });

  it('setzt die Punktreihe über den Rechteckkörper, ohne ihn zu verschieben', () => {
    // E.1.18 / C.1.2: Reihe 3 mm hoch, oben bei 2 mm, unten bei 5 mm, Körper bleibt bei 6 mm.
    const head = placeHead(profileFor('formation'), 3);
    expect(head).toEqual({ topMm: 2, bottomMm: 5 });
    expect(boundsOfMm(profileFor('formation').place(rectBody, head.bottomMm)).minY).toBeCloseTo(6, 6);
  });

  it('schiebt den Rechteckkörper, wenn der Punktstapel nicht darüber passt', () => {
    // C.1.1 Löschstaffel: Stapel 7 mm hoch, oben bei 1 mm, unten bei 8 mm, Körper bei 9 mm.
    const head = placeHead(profileFor('formation'), 7);
    expect(head).toEqual({ topMm: 1, bottomMm: 8 });
    const bounds = boundsOfMm(profileFor('formation').place(rectBody, head.bottomMm));
    expect(bounds.minY).toBeCloseTo(9, 6);
    expect(bounds.maxY).toBeCloseTo(29, 6);
    expect(bounds.minX).toBeCloseTo(1, 6);
  });

  it('setzt dieselbe Punktreihe am gedrehten Quadrat 1 mm höher', () => {
    // D.3.7: Standardanker 1 mm, Reihe deshalb oben bei 1 mm statt bei 2 mm.
    const head = placeHead(profileFor('person'), 3);
    expect(head).toEqual({ topMm: 1, bottomMm: 4 });
  });

  it('verkleinert das gedrehte Quadrat von oben und hält die Unterkante', () => {
    const bounds = boundsOfMm(profileFor('person').place(diamondBody, 4));
    expect(bounds.minY).toBeCloseTo(5, 3);
    expect(bounds.maxY).toBeCloseTo(31, 3);
    expect(bounds.minX).toBeCloseTo(3, 3);
    expect(bounds.maxX).toBeCloseTo(29, 3);
  });

  it('lehnt einen Kreiskörper mit Kopfzone mit dem gemessenen Negativ ab', () => {
    // Der Wurftext behauptet nicht „nicht belegt", sondern nennt die Zählung, die das belegt:
    // 109 Dateien mit 3-mm-Marke im Kopfzonenraster, 36 mit Kreiskörper, Schnittmenge leer. Der
    // Test hält beide Zahlen fest, damit sie nicht unbemerkt zu einer Behauptung zurückfallen.
    const circleBody: Primitive = { type: 'circle', role: 'body', cx: 16, cy: 16, r: 14 };
    expect(profileFor('post').place(circleBody, null)).toBe(circleBody);
    expect(() => profileFor('post').place(circleBody, 4)).toThrow(
      /109 der 661 Dateien .* 36 tragen einen Kreiskörper, die Schnittmenge ist leer/s,
    );
  });

  it('ordnet jeder Grundzeichenart ein Profil zu', () => {
    expect(profileFor('formation').id).toBe('rect-body');
    expect(profileFor('person').id).toBe('rotated-square-body');
    expect(profileFor('post').id).toBe('circle-body');
  });

  it('führt die gemessenen F.2-Beschriftungszonen ausschließlich an ihren Fahrzeugprofilen', () => {
    expect(profileFor('vehicle-land').topLeftBaselineFromBodyTopMm).toBe(6.75);
    expect(profileFor('vehicle-land', 'foot-band').topLeftBaselineFromBodyTopMm).toBe(6.75);
    expect(profileFor('vehicle-land', 'plain-wheel-pair').topLeftBaselineFromBodyTopMm).toBe(6.75);
    expect(profileFor('vehicle-land').topLeftLines).toEqual({
      baselinesFromBodyTopMm: [6.75, 10.75],
      capHeightMm: 2.919225,
    });
    expect(profileFor('vehicle-land', 'foot-band').topLeftLines).toBeUndefined();
    expect(profileFor('vehicle-land', 'plain-wheel-pair').topLeftLines).toEqual({
      baselinesFromBodyTopMm: [5.79, 9.32],
      capHeightMm: 2.43,
    });
    expect(profileFor('vehicle-air').aboveLeftBaselineFromBodyTopMm).toBeUndefined();
    expect(profileFor('vehicle-air', 'raised-hull').aboveLeftBaselineFromBodyTopMm).toBe(0);
    expect(profileFor('vehicle-air', 'raised-hull').aboveLeftAnchorFromBodyLeftMm).toBe(-0.01);
    expect(profileFor('formation').topLeftLines).toBeUndefined();
    expect(profileFor('formation').aboveLeftBaselineFromBodyTopMm).toBeUndefined();
    expect(profileFor('trailer').topLeftBaselineFromBodyTopMm).toBeUndefined();
  });

  it('führt die vermessenen Anhang-N-Flächenprofile ohne rezeptabhängige Verzweigung', () => {
    expect(profileFor('vehicle-land').allowsCenterBaselineOverride).toBe(true);
    expect(profileFor('formation').allowsCenterBaselineOverride).toBeUndefined();
    expect(profileFor('vehicle-air').allowsCenterBaselineOverride).toBeUndefined();
    expect(profileFor('vehicle-land', 'foot-band').allowsCenterBaselineOverride).toBeUndefined();
    expect(profileFor('vehicle-land', 'inverted-hull-track' as BodyVariantId)
      .allowsCenterBaselineOverride).toBeUndefined();
    expect(profileFor('circle-12', 'raised-circle-1mm' as BodyVariantId)
      .allowsCenterBaselineOverride).toBeUndefined();

    const fixedWing = profileFor('vehicle-air', 'fixed-wing-hull' as BodyVariantId);
    expect(fixedWing.topLeftBaselineFromBodyTopMm).toBe(7);
    expect(fixedWing.aboveLeftBaselineFromBodyTopMm).toBe(-1);
    expect(fixedWing.aboveLeftAnchorFromBodyLeftMm).toBe(-0.01);

    expect(profileFor('vehicle-air', 'raised-hull').surfaceLabels).toEqual({
      baselineFromBodyBottomMm: 8.01,
      rightAnchorFromBodyRightMm: 0.01,
    });
    expect(profileFor('circle-12', 'raised-circle-1mm' as BodyVariantId).surfaceLabels).toEqual({
      baselineFromBodyBottomMm: 4,
      leftAnchorFromBodyLeftMm: -3,
      rightAnchorFromBodyRightMm: 3,
    });
  });

  it('hält die separat gemessene Mitte des eingesenkten Wasserrumpfs bei y=15,9999', () => {
    // I.3.5 bis I.3.7: Körperunterkante 23,9899 mm, mittige Grundlinie 15,9999 mm.
    const insetHullBottomMm = 23.9899;
    const insetProfile = profileFor('vehicle-water', 'inset-hull');

    expect(insetProfile.centerBaselineFromBodyBottomMm).toBeCloseTo(7.99, 6);
    expect(insetHullBottomMm - insetProfile.centerBaselineFromBodyBottomMm).toBeCloseTo(15.9999, 4);
    expect(profileFor('vehicle-water').centerBaselineFromBodyBottomMm).toBeCloseTo(6.9896, 6);
    expect(profileFor('vehicle-water', 'raised-hull').centerBaselineFromBodyBottomMm)
      .toBeCloseTo(6.9896, 6);
  });

  it('führt getrennte topLeft-Profile ohne öffentliche Stilsteuerung für beide F.3-Kreisfassungen', () => {
    const circleKind = 'circle-12' as SymbolKind;
    const raisedGable = 'raised-gable' as BodyVariantId;
    const normal = profileFor(circleKind);
    const raised = profileFor(circleKind, raisedGable);

    expect(normal).not.toBe(raised);
    expect(normal.id).toBe('circle-body');
    expect(raised.id).toBe('circle-body');
    expect(normal.topLeftBaselineFromBodyTopMm).toBeCloseTo(1.000254, 6);
    expect(raised.topLeftBaselineFromBodyTopMm).toBeCloseTo(-0.999746, 6);
    expect(normal).not.toHaveProperty('topLeftInk');
    expect(raised).not.toHaveProperty('topLeftInk');
    expect(profileFor('post').topLeftBaselineFromBodyTopMm).toBeUndefined();
  });

  it('führt die Logistik-Labelzonen ausschließlich an ihren gebänderten Profilen', () => {
    expect(profileFor('formation').bottomLabelBaselineFromBodyBottomMm).toBe(2);
    expect(profileFor('formation', 'foot-band').bottomLabelBaselineFromBodyBottomMm).toBe(5);

    const circleFootBand = profileFor('circle-12', 'foot-band');
    expect(circleFootBand.bottomCenterBaselineFromBodyBottomMm).toBe(6);
    expect(circleFootBand.bottomCenterInk).toBe('black');
    expect(profileFor('formation').bottomCenterInk).toBeUndefined();
    expect(circleFootBand.openTopWhenHeadlessAndUnlabelled).toBeUndefined();
    expect(profileFor('formation', 'foot-band').openTopWhenHeadlessAndUnlabelled).toBe(true);
    expect(circleFootBand.belowRight).toEqual({
      baselineFromBodyBottomMm: 1,
      anchorFromBodyRightMm: 3,
      ink: 'black',
    });
    expect(profileFor('circle-12').belowRight).toBeUndefined();
    expect(profileFor('vehicle-water', 'raised-hull').belowRight).toEqual({
      baselineFromBodyBottomMm: 4.01,
      anchorFromBodyRightMm: 0.5618,
      ink: 'organization',
    });

    const raisedCircle = profileFor('circle-12', 'raised-circle-1mm' as BodyVariantId);
    expect(circleFootBand.surfaceLabels).toBeUndefined();
    expect(raisedCircle.bottomCenterBaselineFromBodyBottomMm).toBeUndefined();
    expect(raisedCircle.bottomCenterInk).toBeUndefined();
    expect(raisedCircle.belowRight).toBeUndefined();
  });

  it('nutzt reduced-house unverändert mit dem vorhandenen Rechteckprofil ohne neue Labelzone', () => {
    const reducedHouse = 'reduced-house' as SymbolKind;
    const profile = profileFor(reducedHouse);
    expect(profile.id).toBe('rect-body');
    expect(profile.topLeftBaselineFromBodyTopMm).toBeUndefined();
    expect(profile.topLeftLines).toBeUndefined();
    expect(profile.aboveLeftBaselineFromBodyTopMm).toBeUndefined();
    expect(profile).toBe(profileFor('building'));
  });
});
