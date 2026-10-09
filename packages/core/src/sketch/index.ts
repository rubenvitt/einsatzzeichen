/**
 * Kommunikationsskizze (LFH-1033): Bausteine der taktischen Fernmeldeskizze nach BBK Anhang J.5,
 * die keine Referenzdatei haben und deshalb **außerhalb** des BBK-Katalogs stehen. Jede Maßangabe
 * ist vorgeschlagen (`SKETCH_BLOCKS`); nichts hiervon erscheint in `ALL_PICTOGRAMS`, im
 * Coverage-Manifest oder im Referenzinventar.
 */
export {
  SKETCH_AREA_LABEL_INSET_MM,
  SKETCH_AREA_PATTERN_MM,
  SKETCH_BUS_BAR_MARGIN_MM,
  SKETCH_CONDITION_SIGN_HEIGHT_MM,
  SKETCH_CONDITION_SIGN_PADDING_MM,
  SKETCH_CONDITION_SIGN_TEXT_MM,
  SKETCH_NOTE_GAP_MM,
  SKETCH_NOTE_TEXT_MM,
  SKETCH_PLANNED_PATTERN_MM,
  SKETCH_ZIGZAG_GROUND_MM,
  SKETCH_ZIGZAG_HEIGHT_MM,
  SKETCH_ZIGZAG_LENGTH_MM,
  busBar,
  busBarMinLength,
  commsArea,
  commsLink,
  conditionSign,
  conditionSignWidth,
  type BusBar,
  type ConditionSign,
  type SketchArea,
  type SketchLink,
  type SketchLinkAnchor,
  type SketchLinkMedium,
  type SketchLinkStatus,
} from './blocks.js';
export { SKETCH_STROKE_WIDTH_MM } from './geometry.js';
export { SKETCH_BLOCKS, type SketchBlock, type SketchBlockId } from './findings.js';
export {
  SKETCH_PICTOGRAM_IDS,
  sketchPictogram,
  type SketchPictogram,
  type SketchPictogramId,
} from './pictograms.js';
