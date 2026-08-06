import type { Drawing } from '@einsatzzeichen/schema';

export interface A11yMetadataIssue {
  field: 'title' | 'description';
  detail: string;
}

/**
 * Kataloggate für die semantischen Alternativen einer Zeichnung. Der Renderer erzeugt diese
 * Texte nicht aus Geometrie; er darf nur korrekt ausgeben, was das semantische Modell liefert.
 */
export function checkA11yMetadata(drawing: Drawing): A11yMetadataIssue[] {
  const issues: A11yMetadataIssue[] = [];
  if (drawing.title === undefined || drawing.title.trim() === '') {
    issues.push({ field: 'title', detail: 'Die Zeichnung benötigt einen nichtleeren Titel.' });
  }
  if (drawing.description === undefined || drawing.description.trim() === '') {
    issues.push({
      field: 'description',
      detail: 'Die Zeichnung benötigt eine nichtleere semantische Beschreibung.',
    });
  }
  return issues;
}

