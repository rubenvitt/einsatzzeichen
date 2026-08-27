import {
  entryKey,
  type Review,
  type CoverageEntry,
  type CoverageManifest,
  type ReviewSet,
  type TestEvidenceKind,
} from '@einsatzzeichen/schema';
import { BASE_SYMBOLS } from './base-symbols.js';
import { manifestDomainReviewFor } from './domain-reviews.js';
import { resolveElement } from './elements.js';
import { referenceLacksComparableShape } from './fingerprint-index.js';
import { ALL_PICTOGRAMS } from './pictograms/index.js';
import { deepFreeze, type DeepReadonly } from './readonly-data.js';
import { RECIPES } from './recipes.js';
import {
  ANHANG_D_TASK_3_RECIPES,
  ANHANG_D_TASK_5_RECIPES,
  ANHANG_D_TASK_6_RECIPES,
} from './recipes-anhang-d.js';
import {
  ANHANG_E_A_FILL_DEFECTS,
  ANHANG_E_A_RECIPES,
  ANHANG_E_B_FILL_FINDINGS,
  ANHANG_E_B_RECIPES,
  ANHANG_E_C_FILL_FINDINGS,
  ANHANG_E_C_RECIPES,
  ANHANG_E_D_FINDINGS,
  ANHANG_E_D_RECIPES,
  ANHANG_E_E_FINDINGS,
  ANHANG_E_E_RECIPES,
  ANHANG_E_F_FINDINGS,
  ANHANG_E_F_RECIPES,
} from './recipes-anhang-e.js';
import {
  ANHANG_F_A_DEVIATIONS,
  ANHANG_F_A_FINDINGS,
  ANHANG_F_A_RECIPES,
  ANHANG_F_B_RECIPES,
  ANHANG_F_B_FINDINGS,
  ANHANG_F_B_DEVIATIONS,
  ANHANG_F_C_RECIPES,
  ANHANG_F_C_FINDINGS,
  ANHANG_F_C_DEVIATIONS,
  ANHANG_F_D_RECIPES,
  ANHANG_F_D_FINDINGS,
  ANHANG_F_D_DEVIATIONS,
  ANHANG_F_E_RECIPES,
  ANHANG_F_E_FINDINGS,
  ANHANG_F_E_DEVIATIONS,
  ANHANG_F_F_RECIPES,
  ANHANG_F_F_FINDINGS,
  ANHANG_F_F_DEVIATIONS,
} from './recipes-anhang-f.js';
import { ANHANG_N_RECIPES } from './recipes-anhang-n.js';
import { ANHANG_G_RECIPES } from './recipes-anhang-g.js';
import { ANHANG_H_RECIPES } from './recipes-anhang-h.js';
import {
  ANHANG_I_A_RECIPES,
  ANHANG_I_B_RECIPES,
  ANHANG_I_D_RECIPES,
  ANHANG_I_E_RECIPES,
  ANHANG_I_G_RECIPES,
  ANHANG_I_J_RECIPES,
  ANHANG_I_K_RECIPES,
} from './recipes-anhang-i.js';

/**
 * Migration nach Slice 2: `technical` ist für alle elf Einträge `approved`, weil das Kriterium
 * aus der Spec (Fingerprint- und Snapshot-Gate für diesen Eintrag grün) erfüllt ist —
 * Slice-1-Erfolgskriterien 1 und 2. `domain` bleibt offen: eine fachliche Prüfung durch eine
 * Person mit einsatztaktischer Fachkunde hat nicht stattgefunden, und das Modell verdeckt das nicht.
 */
const TECHNICAL_REVIEW: Review = {
  status: 'approved',
  reviewer: 'rv',
  date: '2026-08-05',
};

/** D.3 prueft den vollständigen gemessenen Funktionsvertrag statt generischer Personenfassungen. */
const ANHANG_D_TASK_5_TECHNICAL_REVIEW: Review = {
  status: 'approved',
  reviewer: 'rv',
  date: '2026-08-26',
  note:
    'D.3.1 bis D.3.13 konsumieren die dreizehn einzeln vermessenen Funktionsrollen: drei ' +
    'rollenlose Kopfzonen, drei Zwei-Stern-Köpfe, fünf abgesenkte Zugkörper und zwei getrennt ' +
    'vermessene Gruppenkörper. AW, ASB, DRK, MHD und JUH bleiben sichtbare Trägertexte; ' +
    'Brandbekämpfung, Sanität und Betreuung verwenden ihre körperlageabhängigen Innenmarken. ' +
    'D.3.7 behält Schlüssel und Domainstatus, konsumiert aber weiterhin den gemessenen ' +
    'Funktionsvertrag: abgesenkter 26-mm-Rautenkörper mit drei Stärkepunkten, schwarzer Kappe, ' +
    'waagerechte Teilung und rechte geschlossene Raute. Fingerprint-, Snapshot-, ' +
    'Mehrgrößen-, viewBox-, Metadaten- und Kontrast-Gates prüfen alle dreizehn renderbaren ' +
    'Rezepte; Rollenbenennungen und Organisationszuordnungen bleiben im Domain-Review pending.',
};

/** D.4 schließt Anhang D mit den fünf separat vermessenen Verwaltungsrollen. */
const ANHANG_D_TASK_6_TECHNICAL_REVIEW: Review = {
  status: 'approved',
  reviewer: 'rv',
  date: '2026-08-26',
  note:
    'D.4.1 bis D.4.5 konsumieren fünf einzeln vermessene Funktionsrollen. D.4.1 bis D.4.3 ' +
    'verwenden den Standard-Personenkörper und den belegten Zwei-Stern-Kreis-Kopf; D.4.4 ' +
    'behält seinen separat gemessenen abgesenkten Körper und den Fünf-Stern-Nationalstaat-Kopf, ' +
    'D.4.5 seinen kompakten Körper und den sechsblättrigen EU-Kopf. LtS/ST, KBM/ME, LtrGA/MG ' +
    'und BuPol bleiben sichtbare Rollen- beziehungsweise Trägertexte. Fingerprint-, Snapshot-, ' +
    'Mehrgrößen-, viewBox-, Metadaten- und Kontrast-Gates prüfen alle fünf Rezepte; ' +
    'Rollenbenennungen und Organisationszuordnungen bleiben im Domain-Review pending.',
};

const ANHANG_D_TASK_3_TECHNICAL_REVIEW: Review = {
  status: 'approved',
  reviewer: 'rv',
  date: '2026-08-26',
  note:
    'D.1.2 bis D.1.8 konsumieren die sieben einzeln vermessenen Formationsrollen mit ihren ' +
    'festen Textmetriken und schwarzen 3-mm-Kappen. D.1.9 bleibt rollenlos: beide Fassungen ' +
    'tragen genau einen äußeren Trupppunkt, die Alternative führt ihre drei weißen Löcher als ' +
    'negative Innenmarken der 4-mm-Kappe. Die Zuordnung der weißen D.1.9-Körper zu ' +
    'hilfsorganisation ist eine technische Entscheidung und bleibt im Domain-Review ' +
    'ausdrücklich pending. Fingerprint-, Snapshot-, Mehrgrößen-, viewBox-, Metadaten- und ' +
    'Kontrast-Gates prüfen alle neun renderbaren Rezepte.',
};

const LEADERSHIP_PICTOGRAM_TECHNICAL_REVIEW: Review = {
  status: 'approved',
  reviewer: 'rv',
  date: '2026-08-26',
  note:
    'D.1.1 ist direkt aus gemessenen Rechteck-, Linien- und Kreuzprimitiven aufgebaut. Die ' +
    'eigene 32×46-mm-ViewBox erhält Körper, vierzehnteilige Verbindung und Außenkreuz ' +
    'vollständig; der 32×32-Negativfall meldet outside-viewbox. Snapshot, Kommando, Box, ' +
    'Standalone-Clipping, Mehrgrößen-, Metadaten- und explizite Kontrast-Gates prüfen den ' +
    'renderbaren Eintrag. Benennung und fachliche Bedeutung bleiben pending.',
};

const LEADERSHIP_LOCATION_TECHNICAL_REVIEW: Review = {
  status: 'approved',
  reviewer: 'rv',
  date: '2026-08-26',
  note:
    'D.2.1 bis D.2.7 sind direkte 32×32-mm-Definitionen aus normalisierten Kreis-, Dach-, ' +
    'Text- und Innengeometrien. Private Helfer teilen ausschließlich gemessene Geometrie; es ' +
    'entsteht weder eine öffentliche Ortsachse noch eine Wiederverwendung des F.3-Körpers ' +
    'circle-12 oder eine Organisationszuordnung aus der gelben Fläche. Snapshot, Kommando, ' +
    'Box, Standalone-Clipping, Textlesbarkeit, Mehrgrößen-, Metadaten- und explizite ' +
    'Kontrast-Gates prüfen alle sieben renderbaren Einträge. Benennung und fachliche Bedeutung ' +
    'bleiben pending.',
};

const LEADERSHIP_OPEN_CAP_TECHNICAL_REVIEW: Review = {
  status: 'approved',
  reviewer: 'rv',
  date: '2026-08-26',
  note:
    'D.3.14 und D.3.15 bleiben zwei direkte 32×32-mm-Leadership-Definitionen. Sie teilen nur ' +
    'den privat vermessenen offenen Kappenrahmen; daraus entsteht weder eine functionRole noch ' +
    'eine Organisationszuordnung. Rollen- und Trägertext, Körperfarbe, Texttinte und ihre ' +
    'Kontrasthintergründe sind je Definition explizit. Snapshot, Kommando, Box, ' +
    'Standalone-Clipping, Textlesbarkeit, Mehrgrößen-, Metadaten- und Kontrast-Gates prüfen ' +
    'beide renderbaren Einträge; Benennung und Bedeutung der offenen Kappe bleiben pending.',
};

const WATER_RESCUE_PERSONNEL_TECHNICAL_REVIEW: Review = {
  status: 'approved',
  reviewer: 'rv',
  date: '2026-08-27',
  note:
    'I.5.4 bis I.5.8 sind fünf direkte 32×32-mm-Piktogramme im eigenen ID-Raum. Zwei ' +
    'literal vermessene Körperlagen erhalten geschlossene beziehungsweise offene Kappe, zwei ' +
    'gefüllte Kubik-Wasserlinien und die Innenraute; die Kopfgeometrie bleibt je Quelle ' +
    '1/2/3 Kreis, Verbandsbalken oder leer. Eine private Hilfe teilt nur Geometrie und erzeugt ' +
    'keine FunctionRole-, Strength- oder Organisationssemantik. Snapshot, Kommando, Box, ' +
    'Standalone-Clipping, Mehrgrößen-, Metadaten- und explizite Kontrast-Gates prüfen alle ' +
    'fünf renderbaren Einträge; Rang- und Rollenbenennungen bleiben im Domain-Review pending.',
};

const ANHANG_C_A_TECHNICAL_REVIEW: Review = {
  status: 'approved',
  reviewer: 'rv',
  date: '2026-08-26',
  note:
    'Die verpflichtende Sicht-QA hat die zuvor für C.1 verwendete Kapitel-4-Boxfassung mit ' +
    'zusätzlichem rechten Horizontalast widerlegt; die eigenständige capability.fire-fighting ' +
    'bleibt für Kapitel 4 unverändert. C.1.3 verwendet Formation, Feuerwehrfarbe, Stärke zug ' +
    'und die formationsgebundene bodyMarks-Fassung fire-fighting: (1|16) nach (21|16), von dort ' +
    'nach (31|6) und (31|26), ohne rechten Horizontalast. Der Körper besteht ' +
    'matchFingerprint ohne Befund; recipes.test.ts hält Rezept, drei Kopfprimitive bei ' +
    'cx 11/16/21 und cy 3,5 mm, Körperhülle 1/6 bis 31/26 mm sowie die Innengeometrie fest. ' +
    'strengths.test.ts trägt die unabhängig vermessenen Zugmarken. Direkter und Mehrgrößen-' +
    'Snapshot sowie die globalen viewBox-, Metadaten- und Kontrast-Gates prüfen die ' +
    'renderbare Ausgabe. Das Domain-Review bleibt pending.',
};

/**
 * Für Piktogramme ist der erste Teil des Slice-2-Kriteriums für `technical: approved`
 * — Fingerprint- und Snapshot-Gate grün — strukturell unerreichbar: `matchFingerprint` vergleicht
 * ausschließlich `role: 'body'`, und das Fingerprint-Gate ist auf Kapitel 1–3 beschränkt. An seine
 * Stelle treten vier lokale, piktogrammspezifische Bedingungen. Die globalen Mehrgrößen-,
 * viewBox-, Metadaten- und Kontrast-Gates kommen seit der Härtung vor D.1 hinzu. Die `note` hält
 * beide Ebenen getrennt fest, statt ein globales Gate als Eigenschaft eines einzelnen Elements
 * auszugeben — dasselbe Muster wie `SOURCE_REVIEW` in `sources.ts`.
 */
const PICTOGRAM_TECHNICAL_REVIEW: Review = {
  status: 'approved',
  reviewer: 'rv',
  date: '2026-08-06',
  note:
    'Fingerprint-Gate für Piktogramme nicht anwendbar (matchFingerprint vergleicht nur ' +
    'role: body). Lokal treten vier grüne Gates an seine Stelle: Snapshot, Kommando, Box, ' +
    'Clipping. Zusätzlich bestehen die globalen Mehrgrößen-, viewBox-, Metadaten- und ' +
    'Kontrast-Gates des renderbaren Katalogbestands.',
};

const STATE_PICTOGRAM_TECHNICAL_REVIEW: Review = {
  status: 'approved',
  reviewer: 'rv',
  date: '2026-08-07',
  note:
    'Fingerprint-Gate für Piktogramme nicht anwendbar. Für Kapitel 5.8 bestehen Snapshot, ' +
    'Kommando, Box und Standalone-Clipping gegen die 32×32-mm-ViewBox sowie die globalen ' +
    'Mehrgrößen-, viewBox-, Metadaten- und expliziten Kontrast-Gates; die 67/67-Sichtprüfung ' +
    'ist in docs/reviews/2026-08-07-d2-visual-qa.md dokumentiert.',
};

/**
 * Schadens- und Vegetationsbrandzeichen der Anhänge K, L und M. Dieselben lokalen Gates wie bei
 * den Zuständen und den IuK-Zeichen; die Note nennt zusätzlich die beiden Farbentscheidungen, die
 * D.4 treffen musste, damit sie nicht nur in der Entscheidungsnotiz stehen.
 */
const DAMAGE_PICTOGRAM_TECHNICAL_REVIEW: Review = {
  status: 'approved',
  reviewer: 'rv',
  date: '2026-08-10',
  note:
    'Fingerprint-Gate für Piktogramme nicht anwendbar. Für K, L und M bestehen Snapshot, ' +
    'Kommando, Box und Standalone-Clipping gegen die 32×32-mm-ViewBox sowie die globalen ' +
    'Mehrgrößen-, viewBox-, Metadaten- und expliziten Kontrast-Gates. Zwei Farbbefunde sind ' +
    'behoben statt umgangen: die Ziffern in L.10 stehen schwarz statt rot (Rot verfehlt als ' +
    'Text 4,5:1), und hellblau trägt im Druckmonochrom #808080 statt #eeeeee (M.12 bis M.14 ' +
    'setzen blaue Geometrie ohne schwarze Kontur auf die Oberfläche). Die Sichtprüfung aller ' +
    '42 ist in docs/reviews/2026-08-10-d4-visual-qa.md dokumentiert.',
};

/**
 * Technisches Review der zwölf Zeichen aus F-a. Eigener Eintrag, weil dieser Teilslice als erster
 * drei Mechanismen zugleich einführt: die randbündige Fachdienstteilung (`body-marks.ts`), die
 * Beschriftungszone oben links und die aus der Körperfüllung abgeleitete Schriftfarbe. Die dritte
 * ist ein **Fehlerbefund am Bestand** und keine Ergänzung: bis dahin stand die Farbe der Läufe im
 * Körper fest auf `weiss`, und ein weisser Lauf auf dem weissen F-Körper wäre unsichtbar
 * gewesen — ohne dass ein Gate es gemeldet hätte.
 */
const ANHANG_F_A_TECHNICAL_REVIEW: Review = {
  status: 'approved',
  reviewer: 'rv',
  date: '2026-08-18',
  note:
    'Körperhülle per matchFingerprint gegen die Referenz gegated (Füllhülle 1/6 bis 31/26 mm, ' +
    'Differenz 0 an allen Kanten), dazu die globalen Mehrgrößen-, viewBox-, Metadaten- und ' +
    'Kontrast-Gates. Die randbündigen Fachdienstzeichen sind vom Fingerprint-Gate nicht erfasst ' +
    '(matchFingerprint vergleicht nur role: body); ihre Maße sind an F.1.7, F.1.8, F.1.10 und ' +
    'F.1.11 einzeln vermessen und in der Sichtprüfung gegengeprüft ' +
    '(docs/reviews/2026-08-18-f-a-visual-qa.md). Die Organisation hilfsorganisation ist eine ' +
    'Entscheidung dieses Teilslice und keine Messung: alle 66 F-Dateien führen ausschließlich ' +
    '#fff, und ob das eine Organisation oder keine bedeutet, sagt die Quelle nicht.',
};

/**
 * Eigenes technisches Review für F-b: Dieser Teilslice ergänzt nicht nur Rezepte, sondern die
 * Formationsvariante `foot-band`, die unten mittige Beschriftungszone und rein geometrische
 * TechnicalBodyMarkIds. Die Note behauptet ausdrücklich keinen bereits gesehenen finalen
 * Task-6-Kontaktbogen; sie benennt nur die lokalen, in diesem Teilslice ausgeführten Gates.
 */
const ANHANG_F_B_TECHNICAL_REVIEW: Review = {
  status: 'approved',
  reviewer: 'rv',
  date: '2026-08-25',
  note:
    'Alle 14 Originalreferenzen aus F.1.3 und F.1.12 bis F.1.22 wurden einzeln gerastert und ' +
    'gegen die Rezeptmatrix geprüft. Lokale Geometrietests halten foot-band, bottomCenter, die ' +
    'kontextgebundenen BodyMarks und alle 14 Specs fest; Snapshot-, Mehrgrößen-, viewBox-, ' +
    'Metadaten- und Kontrast-Gates prüfen den renderbaren Bestand. Der finale Task-6-Kontaktbogen ' +
    'war zu diesem Zeitpunkt noch nicht erzeugt oder gesichtet. Die Organisation ' +
    'hilfsorganisation bleibt eine technische Entscheidung, das Domain-Review pending.',
};

/**
 * Eigenes technisches Review für F-c: Landfahrzeug, Luftfahrzeug und Anhänger verwenden drei
 * getrennt vermessene Body-Mark-Kontexte; ITH und GW-San/50 belegen außerdem zwei neue,
 * körperbezogene Beschriftungsregeln. Die Note behauptet ausdrücklich keinen finalen
 * Task-6-Kontaktbogen.
 */
const ANHANG_F_C_TECHNICAL_REVIEW: Review = {
  status: 'approved',
  reviewer: 'rv',
  date: '2026-08-25',
  note:
    'Alle 14 Originalreferenzen aus F.2.1 bis F.2.9 wurden einzeln gerastert und gegen die ' +
    'Rezeptmatrix geprüft. Lokale Geometrietests halten die getrennten Land-, Luft- und ' +
    'Anhänger-BodyMarks, die oberhalb liegende ITH-Zone und die zweizeilige GW-San/50-Zone ' +
    'fest; Snapshot-, Mehrgrößen-, viewBox-, Metadaten- und Kontrast-Gates prüfen den ' +
    'renderbaren Bestand. Der finale Task-6-Kontaktbogen war zu diesem Zeitpunkt noch nicht ' +
    'erzeugt oder gesichtet. Die Organisation hilfsorganisation bleibt eine technische ' +
    'Entscheidung, das Domain-Review pending.',
};

/**
 * Eigenes technisches Review für F-d: Der Teilslice nutzt den unveränderten öffentlichen
 * Body-Mark-Port, ergänzt darin aber separat vermessene normale, gebänderte und Anhängerfassungen.
 * Die Note trennt diese lokalen Gates ausdrücklich vom späteren Task-6-Kontaktbogen.
 */
const ANHANG_F_D_TECHNICAL_REVIEW: Review = {
  status: 'approved',
  reviewer: 'rv',
  date: '2026-08-26',
  note:
    'Alle acht Originalreferenzen aus F.2.10 bis F.2.17 wurden einzeln gerastert und gegen die ' +
    'literal gebundene Rezeptmatrix geprüft. Lokale Geometrietests halten Land- und ' +
    'Anhänger-care, das separat vermessene Fahrzeug-foot-band, die zwei technischen Ringformen ' +
    'sowie mobile Küche und Trinkwasser fail-closed fest; Snapshot-, Mehrgrößen-, viewBox-, ' +
    'Metadaten- und Kontrast-Gates prüfen den renderbaren Bestand. Der finale ' +
    'Task-6-Kontaktbogen war zu diesem Zeitpunkt noch nicht erzeugt oder gesichtet. Die ' +
    'Organisation hilfsorganisation bleibt eine technische Entscheidung, das Domain-Review ' +
    'pending.',
};

/**
 * Eigenes technisches Review für F-e: Der 12-mm-Kreis ist nicht die 14-mm-Funktionsstelle.
 * F.3.5 und J.3.2 tragen in den Quellen denselben Kreis und Giebel; nur die bereits bestehende
 * Katalogfassung J.3.2 nähert den Kreis mit `stationBody(17, 11.5)` anders an. Die Note trennt
 * diese außerhalb des Teilslices liegende Korrektur und die elf einzeln geprüften Raster vom
 * späteren Task-6-Kontaktbogen.
 */
const ANHANG_F_E_TECHNICAL_REVIEW: Review = {
  status: 'approved',
  reviewer: 'rv',
  date: '2026-08-26',
  note:
    'Alle elf Originalreferenzen F.3.1 bis F.3.11 wurden einzeln bei 900 px gerastert, ' +
    'vermessen und gegen die literal gebundene Rezeptmatrix geprüft. Lokale Geometrietests ' +
    'halten den Kreis r 12 mm, die abgesenkte raised-gable-Fassung, den separat vermessenen ' +
    'Giebel und alle semantischen wie technischen Kreis-BodyMarks fail-closed fest. Die ' +
    'Quellgeometrie von F.3.5 ist mit J.3.2 identisch; die bestehende Katalogfassung J.3.2 ' +
    'bleibt mit stationBody(17, 11.5) abweichend und ihre Korrektur liegt außerhalb dieses ' +
    'Teilslices. Die ' +
    'vollständigen UHS-/50-Metriken werden gegen die ViewBox geprüft; der bestehende ' +
    'bodyLabelInk-Pfad leitet ihre Tinte aus der zwingend weißen HiOrg-Körperfläche als schwarz ' +
    'ab. Der Kontrastvertrag deckt sowohl diese Körperfläche als auch surface. ' +
    'Snapshot-, Mehrgrößen-, viewBox-, Metadaten- und Kontrast-Gates prüfen den renderbaren ' +
    'Bestand. Der finale Task-6-Kontaktbogen war zu diesem Zeitpunkt noch nicht erzeugt oder ' +
    'gesichtet. Die Organisation hilfsorganisation und sämtliche Fachzuordnungen bleiben im ' +
    'Domain-Review pending.',
};

/**
 * Eigenes technisches Review für F-f. Die sechs Kreiszeichen benutzen die in F-e eingeführte
 * Körperhülle, aber ausschließlich bounds-relative, separat an den F-f-Quellen vermessene
 * Marken. Die beiden Hauszeichen teilen nur Körper und Traufe; ihre semantischen Marken besitzen
 * eigene reduced-house-Builder. Das Review hält die Einzelprüfung vom späteren Kontaktbogen
 * getrennt.
 */
const ANHANG_F_F_TECHNICAL_REVIEW: Review = {
  status: 'approved',
  reviewer: 'rv',
  date: '2026-08-26',
  note:
    'Alle acht Originalreferenzen F.3.12 bis F.3.19 wurden einzeln in kleiner und großer ' +
    'Darstellung gerastert, vermessen und gegen die literal gebundene Rezeptmatrix geprüft. ' +
    'Lokale Geometrietests halten die bounds-relativen Kreisformen, die reduzierte Hauskontur ' +
    'mit genau einer Trauflinie, die separate Strichhülle von F.3.16 sowie alle semantischen ' +
    'und technischen BodyMarks fail-closed fest. Der F.3.15-Kurvenzug besteht außerdem den ' +
    'unabhängigen 2048-px-Vergleich gegen den Original-Subpfad. Snapshot-, Mehrgrößen-, ' +
    'viewBox-, Metadaten- und Kontrast-Gates prüfen den renderbaren Bestand; die 541 ' +
    'vorbestehenden Snapshots bleiben hashgleich. Der finale Task-6-Kontaktbogen war zu diesem ' +
    'Zeitpunkt noch nicht erzeugt oder gesichtet. Die Organisation hilfsorganisation und ' +
    'sämtliche Fachzuordnungen bleiben im Domain-Review pending.',
};

/**
 * Technisches Review der neun Anhang-N-Zeichen. Die Trägerbezeichnungen im Dateinamen bleiben
 * erhalten, ohne daraus neue Organisationssemantik abzuleiten; genau deshalb nennt die Note den
 * kommunalen Bauhof und den Beauftragten Dritten ausdrücklich. Der spätere Kontaktbogen gehört
 * zu Task 3 und wird hier nicht vorweggenommen.
 */
const ANHANG_N_TECHNICAL_REVIEW: Review = {
  status: 'approved',
  reviewer: 'rv',
  date: '2026-08-26',
  note:
    'Alle neun Originalreferenzen N.1.1 bis N.1.6 und N.2.1 bis N.2.3 wurden einzeln gegen ' +
    'die literal gebundene Rezeptmatrix geprüft. Körper-Fingerprint, gemessene Fahrwerke, ' +
    'technische BodyMarks, Textläufe, direkte Snapshots und Mehrgrößen-Snapshots sind gegatet. ' +
    'Die benannten Träger kommunaler Bauhof (N.1.2) und Beauftragter Dritter (N.1.5) bleiben ' +
    'Träger in Titel und Quellenreview erhalten; daraus entsteht weder eine neue Organisation ' +
    'noch eine geländegängig-Semantik. Die schwarzen Quellenläufe von N.1.2 bis N.1.5 werden ' +
    'über den gemessenen inBodyInk-Vertrag gerendert und bestehen den Kontrastvertrag ohne neue ' +
    'Ausnahme; die bestehende E.2.6-Ausnahme bleibt allein. Der finale LFH-422-Kontaktbogen ' +
    'war zu diesem ' +
    'Zeitpunkt noch nicht erzeugt oder gesichtet; sämtliche Fachzuordnungen bleiben im ' +
    'Domain-Review pending.',
};

/**
 * Technisches Review der 21 Anhang-G-Rezepte. Es bezieht sich auf die vermessenen lokalen
 * Geometrie-, Kompositions- und Katalogverträge sowie den abgeschlossenen 21-Karten-Vergleich.
 */
const ANHANG_G_TECHNICAL_REVIEW: Review = {
  status: 'approved',
  reviewer: 'rv',
  date: '2026-08-26',
  note:
    'Alle 21 Anhang-G-Referenzen sind literal an eigene primary-Rezepte gebunden. Die ' +
    'generischen Tests halten foot-band an Formation, Landfahrzeug, Anhänger und 12-mm-Kreis, ' +
    'die Kopf- und Fahrwerkszonen, Logistikmarken sowie DLRG-, Diesel- und Bw-Labelpositionen ' +
    'fest; Snapshot-, Mehrgrößen-, viewBox-, Metadaten- und Kontrast-Gates prüfen den ' +
    'renderbaren Bestand. G.1.5 besitzt in der Quelle keine vergleichbare Füllfläche und ' +
    'trägt deshalb eine ehrliche Körper-Geometrieregression statt eines Fingerprint-Claims. ' +
    'Der deterministische 21-Karten-Referenzvergleich wurde in Originalauflösung gesichtet; ' +
    'DLRG, Diesel und Bw sind sichtbar, und die acht kopflosen Formationen bewahren ihre offene ' +
    'Oberkante. Die abweichende bestehende Polizei-Grünpalette von G.3.2 ist dokumentiert. ' +
    'Sämtliche fachlichen Zuordnungen bleiben pending.',
};
const ANHANG_H_TECHNICAL_REVIEW: Review = {
  status: 'approved',
  reviewer: 'rv',
  date: '2026-08-26',
  note:
    'Die drei H-Originale wurden einzeln vermessen und aus Linien, Polylinien und Kreisen ' +
    'unabhängig rekonstruiert. H.2 verwendet eine eigene veterinärmedizinische kompakte ' +
    'Dekontaminationsmarke statt der Human-Dekontamination aus Kapitel 4. Snapshot-, ' +
    'Mehrgrößen-, viewBox-, Metadaten- und Kontrast-Gates prüfen den renderbaren Bestand; die ' +
    'fachliche Zuordnung bleibt im Domain-Review pending.',
};

const ANHANG_I_E_TECHNICAL_REVIEW: Review = {
  status: 'approved',
  reviewer: 'rv',
  date: '2026-08-27',
  note:
    'I.1.9-I.1.12 passed measured formation-specific water-rescue and ' +
    'watercraft-operations body-mark, literal recipe, primary-alternative, direct-snapshot ' +
    'and multi-size gates. The white Hilfsorganisation body is a technical rendering ' +
    'decision; domain classification remains pending.',
};

const ANHANG_I_A_TECHNICAL_REVIEW: Review = {
  status: 'approved',
  reviewer: 'rv',
  date: '2026-08-26',
  note:
    'I.3.5-I.3.7 passed measured inset-hull, 7.99 mm center-profile, literal recipe, direct-snapshot and multi-size gates. The white Hilfsorganisation body is a technical rendering decision; domain classification remains pending and no identity with E.2 is claimed.',
};

const ANHANG_I_K_TECHNICAL_REVIEWS: Readonly<Record<string, Review>> = {
  'I.5.1': {
    status: 'approved', reviewer: 'rv', date: '2026-08-27',
    note:
      'I.5.1 passes the measured centered 26-mm person diamond and the shared double-wave ' +
      'with 8-mm inner-diamond technical mark. It intentionally has no label; fingerprint, ' +
      'direct-snapshot and multi-size gates cover the rendered output.',
  },
  'I.5.2': {
    status: 'approved', reviewer: 'rv', date: '2026-08-27',
    note:
      'I.5.2 passes the measured 2-mm-lowered 26-mm person diamond, shared double-wave with ' +
      '8-mm inner-diamond technical mark, and literal Strömungsretter text at x=1 mm/y=3.5 mm. ' +
      'Fingerprint, direct-snapshot and multi-size gates cover the rendered output.',
  },
  'I.5.3': {
    status: 'approved', reviewer: 'rv', date: '2026-08-27',
    note:
      'I.5.3 passes the measured 2-mm-lowered 26-mm person diamond, shared double-wave with ' +
      '8-mm inner-diamond technical mark, and literal Taucher text at x=1 mm/y=4.0 mm. ' +
      'The apparent source outline is its T glyph, not another mark; fingerprint, direct-snapshot ' +
      'and multi-size gates cover the rendered output.',
  },
};

const ANHANG_I_D_TECHNICAL_REVIEW: Review = {
  status: 'approved',
  reviewer: 'rv',
  date: '2026-08-27',
  note:
    'I.1.5-I.1.8 passed literal recipe, measured compact water-rescue body-mark, independently gated cap/head/body vertical placement, direct-snapshot and multi-size gates. I.1.5 uses its measured 3.7 mm three-hole cap; I.1.6-I.1.8 reuse the 3 mm cap and I.1.8 moves body geometry by 3 mm with staffel. The white Hilfsorganisation body is a technical rendering decision; domain classification remains pending.',
};

const ANHANG_I_G_TECHNICAL_REVIEW: Review = {
  status: 'approved',
  reviewer: 'rv',
  date: '2026-08-27',
  note:
    'I.1.17-I.1.20 passed the separately registered formation-water-rescue-lower-zone body ' +
    'mark, distinct from the I-e water-rescue and I-d compact geometries, plus 16 mm ' +
    'center-baseline, 2.5 mm ' +
    'cap-height and 29 mm output-box contracts, literal recipe, direct-snapshot, multi-size, ' +
    'coverage and ' +
    'output-only visual QA gates. Opposed triangles and chevron remain separate geometric ' +
    'marks; domain classification remains pending.',
};
const ANHANG_I_J_TECHNICAL_REVIEW: Review = {
  status: 'approved',
  reviewer: 'rv',
  date: '2026-08-27',
  note:
    'I.4.1-I.4.3 passed independently measured circle and body-mark geometry, fail-closed ' +
    'kind/variant/bounds, literal recipe, direct-snapshot and multi-size gates. I.4.1 reuses ' +
    'circle-12/raised-gable as geometry only; white Hilfsorganisation bodies and all domain ' +
    'classifications remain pending.',
};
const ANHANG_I_B_TECHNICAL_REVIEW: Review = {
  status: 'approved',
  reviewer: 'rv',
  date: '2026-08-27',
  note:
    'I.2.1-I.2.3 passed measured vehicle-land, category-specific water-rescue, literal recipe, direct-snapshot and multi-size gates. The white Hilfsorganisation body is a technical rendering decision; labels, organization and domain classification remain pending.',
};

/** Technische und fachliche Rolle bleiben getrennt; das Fachreview ist je Manifestzeile einzeln. */
function reviewFor(
  sourceId: string,
  variant: CoverageEntry['variant'],
  technical: Review,
): ReviewSet {
  return {
    technical,
    domain: manifestDomainReviewFor(entryKey(sourceId, variant)),
  };
}

const DRAWING_EVIDENCE = [
  'body-fingerprint',
  'svg-snapshot',
] as const satisfies readonly TestEvidenceKind[];

/**
 * Für Grundzeichen, deren Kennwertartefakt keine vergleichbare Form führt (`shapes: []`, weil die
 * Referenzdatei keine Körperfläche zeichnet). Ein einheitliches `DRAWING_EVIDENCE` über alle
 * vierzehn Arten behauptete für sie ein Fingerprint-Gate, das `matchFingerprint` gar nicht
 * ausführen kann — es bricht vorher mit „Keine vergleichbare Form" ab.
 */
const UNGATED_DRAWING_EVIDENCE = [
  'body-geometry-regression',
  'svg-snapshot',
] as const satisfies readonly TestEvidenceKind[];

/**
 * Technisches Review der Körper ohne vergleichbare Form im Kennwertartefakt. Eigener Eintrag statt
 * des allgemeinen `TECHNICAL_REVIEW`, dessen Begründung („Fingerprint- und Snapshot-Gate für
 * diesen Eintrag grün") für sie nicht zutrifft: ihr Kennwertartefakt führt `shapes: []`,
 * `matchFingerprint` bricht ab, bevor es den Körper ansieht. Die Note nennt, was stattdessen
 * trägt — dasselbe Muster wie bei den Piktogrammreviews.
 *
 * **Seit dem Teilslice E.2 trifft das nur noch `1.14 Spontanhelfer`.** Die vier Kurvenkörper 1.3,
 * 1.4, 1.5 und 1.9, die diesen Eintrag bis dahin mittrugen, sind gegatet, seit der Extraktor die
 * Körperfläche der Ebene `Flächige_Fülung` erfasst; sie tragen wieder `TECHNICAL_REVIEW`. Welcher
 * Eintrag gilt, entscheidet weiterhin `referenceLacksComparableShape` am Artefakt und keine Liste
 * — deshalb hat diese Verschiebung hier keine Zeile gekostet.
 */
const CURVED_BODY_TECHNICAL_REVIEW: Review = {
  status: 'approved',
  reviewer: 'rv',
  date: '2026-08-18',
  note:
    'Fingerprint-Gate nicht anwendbar: das Kennwertartefakt führt für diese Datei keine ' +
    'vergleichbare Form (shapes: []), matchFingerprint bricht vor dem Körpervergleich ab — die ' +
    'Referenzdatei zeichnet gar keine Ebene "Flächige_Fülung". An seine Stelle tritt ein an den ' +
    'vermessenen Zahlen festgenagelter Test in base-symbols.test.ts (Hülle und Formmerkmale ' +
    'gegen die eigene Vermessung der Referenzdatei vom 18. August 2026) plus SVG-Snapshot. Dazu ' +
    'die globalen Mehrgrößen-, viewBox-, Metadaten- und Kontrast-Gates.',
};

function technicalReviewForBaseSymbol(referenceAsset: string): Review {
  return referenceLacksComparableShape(referenceAsset)
    ? CURVED_BODY_TECHNICAL_REVIEW
    : TECHNICAL_REVIEW;
}

const catalogEntries: CoverageEntry[] = Object.values(BASE_SYMBOLS).map((entry) => {
  // Die Zeile trägt `variant: 'primary'`, also muss sie auch aus der `primary`-Darstellung
  // abgeleitet sein — nicht aus der ersten. `depictions` ist ungeordnet; sobald ein Eintrag eine
  // `alternative` zuerst führt, käme Abschnitt und Belegdatei aus der Alternative.
  const ref = entry.depictions.find((d) => d.variant === 'primary')?.sourceRefs[0];
  const sourceId = `bbk-babz-2025:${ref?.section ?? ''}`;
  const referenceAsset = ref?.asset ?? '';
  return {
    sourceId,
    variant: 'primary',
    title: entry.title,
    implementation: entry.id,
    referenceAsset,
    coverage: 'catalog-entry',
    profile: 'bund',
    // Je Art statt einheitlich: sonst behauptete die Zeile ein Gate, das für ihre Referenzdatei
    // strukturell nicht ausführbar ist. Die Unterscheidung wird am Artefakt getroffen, nicht an
    // einer Liste — siehe `referenceLacksComparableShape`.
    testEvidence: referenceLacksComparableShape(referenceAsset)
      ? UNGATED_DRAWING_EVIDENCE
      : DRAWING_EVIDENCE,
    review: reviewFor(sourceId, 'primary', technicalReviewForBaseSymbol(referenceAsset)),
  };
});

/**
 * Technisches Review der 16 Zeichen aus E-a. Eigener Eintrag statt des allgemeinen
 * `TECHNICAL_REVIEW`, weil sie als erste Kompositionen Beschriftungszonen im Körper tragen: das
 * Fingerprint-Gate erreicht davon nichts (`matchFingerprint` vergleicht ausschließlich
 * `role: 'body'`), an seine Stelle tritt für den Text die Rasterprüfung gegen die deklarierte
 * Box. Die Note hält beides getrennt fest — dasselbe Muster wie bei den Piktogrammreviews oben.
 */
const ANHANG_E_A_TECHNICAL_REVIEW: Review = {
  status: 'approved',
  reviewer: 'rv',
  date: '2026-08-12',
  note:
    'Körperhülle per matchFingerprint gegen die Referenz gegated (Differenz 0 an allen vier ' +
    'Kanten). Die Beschriftungszonen erreicht das Fingerprint-Gate nicht; für sie prüft die ' +
    'Rasterprüfung in fonts.test.ts die tatsächliche Tinte aller 16 Kürzelsätze gegen die ' +
    'deklarierte boxMm. Dazu die globalen Mehrgrößen-, viewBox-, Metadaten- und ' +
    'Kontrast-Gates; weisser Text auf der Organisationsfarbe steht als eigene 4,5:1-' +
    'Anforderung im A11y-Gate und hat blau in beiden Alternativthemes nachgezogen. Die ' +
    'Sichtprüfung aller 16 ist in docs/reviews/2026-08-12-e-a-visual-qa.md dokumentiert.',
};

/**
 * Technisches Review der zwölf Zeichen aus E-b. Eigener Eintrag statt einer erweiterten
 * E-a-Konstante, weil das Datum die Provenienz trägt: die 16 E-a-Zeilen sind am 12. August
 * gegengelesen worden, die zwölf hier am 17. Eine gemeinsame Konstante hätte dieselbe Prüfung
 * für beide behauptet.
 */
const ANHANG_E_B_TECHNICAL_REVIEW: Review = {
  status: 'approved',
  reviewer: 'rv',
  date: '2026-08-17',
  note:
    'Körperhülle per matchFingerprint gegen die Referenz gegated. Was dieses Gate dabei nicht ' +
    'sieht, gehört zur Aussage: `pickShape` greift bei allen E.1-Kennzahlensätzen die ring-Form ' +
    '1/6 bis 31/26, die in allen 37 Dateien dieselbe ist — die verkürzten Füllflächen und die ' +
    'Marken im Körper erreicht es gar nicht. Für die Beschriftungszonen prüft die Rasterprüfung ' +
    'in fonts.test.ts die tatsächliche Tinte aller 28 Kürzelsätze aus E-a und E-b gegen die ' +
    'deklarierte boxMm; der längste Lauf `Log-MW` hat dabei die Box des mittigen Laufs von 26 ' +
    'auf 28 mm geweitet (er braucht 26,156 mm Tinte). Dazu die globalen Mehrgrößen-, viewBox-, ' +
    'Metadaten- und Kontrast-Gates; ein neuer Kontrastvertrag entsteht nicht, weisser Text auf ' +
    'blau steht seit E-a als eigene 4,5:1-Anforderung im A11y-Gate. Die zwölf Referenzdateien ' +
    'sind einzeln vermessen und doppelt gegengelesen; daraus stammen die zehn ' +
    'Füllflächenbefunde und die drei deklarierten Abweichungen.',
};

/**
 * Die drei Zeichen aus E-b, bei denen die **Umsetzung von der Quelle** abweicht — im Unterschied
 * zu den zehn Füllflächenbefunden, wo die Quelle von sich selbst abweicht und die Umsetzung der
 * Mehrheit der Quelle folgt. Genau diese Richtung bezeichnet `deviation` im Reviewmodell, deshalb
 * setzen nur diese drei den Status um.
 *
 * Was das Gate damit leistet und was nicht: `reviewIssues` erzwingt zu einem `deviation` einen
 * Reviewer, ein gültiges ISO-Datum und eine begründende Notiz — dass die Begründung stimmt,
 * prüft es nicht. Und `ReleaseBlockers` kennt ausschließlich `review.domain`: diese drei
 * Abweichungen erscheinen in **keinem** Blocker und in **keiner** CLI-Zeile. Wer sie nach diesem
 * Slice noch finden können soll, findet sie hier und in der Entscheidungsnotiz.
 */
const ANHANG_E_B_DEVIATIONS: Readonly<Record<string, string>> = Object.freeze({
  'E.1.17':
    'Der mittige Referenzlauf steht 2,0009 mm links der Körpermitte (sein „F" beginnt bei ' +
    'x 15,913 Einheiten, das von E.1.18 bei 21,585); der Katalog setzt ihn mittig, weil ' +
    'labelPrimitives für die mittige Zone nur anchor: middle auf die Körpermitte kennt. Für ' +
    'n = 1 wird dafür kein Mechanismus gebaut, und diese eine Datei ist die schwächste denkbare ' +
    'Stütze für einen: „Fachzug Grundzeichen" ist ein Musterblatt, dessen Kürzel „FZ-" mit dem ' +
    'Trennstrich endet.',
  'E.1.19':
    'Der Katalog bildet zwei Merkmale der Referenz nicht ab — die drei Marken im Körper ' +
    '(Kreise r 1,5 mm bei cy 8,100 mm, cx 11/16/21 mm, zeichenidentisch mit der zug-Kopfreihe ' +
    'und um 4,600 mm nach unten versetzt) fehlen, und das Innenfeld ist normgerecht bei ' +
    '7,0…25,0 mm gebaut, wo die Referenz oben 10,0 mm führt. Grund für die fehlenden Marken: ' +
    'n = 3 über drei Kapitel mit drei verschiedenen Konstruktionen — E.1.19 und E.1.24 bei ' +
    'cy 8,100 mm mit oben verkürzter Füllfläche, „I.1.5_Zugtrupp Wasserrettungszug.svg" bei ' +
    'cy 7,750 mm mit um 3,45 mm nach unten versetzter Rahmeninnenkante und ohne farbige ' +
    'Füllfläche, während „D.1.9_Zugtrupp einer Sanitätseinheit.svg" bei gleichem Begriff keine ' +
    'Reihe trägt. Es gibt damit keine vermessene Konstante, auf die eine Platzierungsregel sich ' +
    'stützen könnte.',
  'E.1.24':
    'Der Katalog bildet zwei Merkmale der Referenz nicht ab — die drei Marken im Körper ' +
    '(Kreise r 1,5 mm bei cy 8,100 mm, cx 11,047/16,047/21,047 mm, dieselbe Form wie bei ' +
    'E.1.19 um 0,047 mm versetzt eingesetzt) fehlen, und das Innenfeld ist normgerecht bei ' +
    '7,0…25,0 mm gebaut, wo die Referenz oben 10,0 mm führt. Grund für die fehlenden Marken: ' +
    'n = 3 über drei Kapitel mit drei verschiedenen Konstruktionen — E.1.19 und E.1.24 bei ' +
    'cy 8,100 mm mit oben verkürzter Füllfläche, „I.1.5_Zugtrupp Wasserrettungszug.svg" bei ' +
    'cy 7,750 mm mit um 3,45 mm nach unten versetzter Rahmeninnenkante und ohne farbige ' +
    'Füllfläche, während „D.1.9_Zugtrupp einer Sanitätseinheit.svg" bei gleichem Begriff keine ' +
    'Reihe trägt. Es gibt damit keine vermessene Konstante, auf die eine Platzierungsregel sich ' +
    'stützen könnte.',
});

/**
 * Technisches Review der neun Zeichen aus E-c. Wie bei E-b ein eigener Eintrag mit eigenem Datum:
 * die neun Referenzdateien sind an diesem Tag vermessen worden, die 28 älteren nicht noch einmal.
 * Die Note nennt zusätzlich, was an diesem Teilslice technisch neu ist — die zweite Körperform und
 * die Konstante, die sie bindend gemacht hat.
 */
const ANHANG_E_C_TECHNICAL_REVIEW: Review = {
  status: 'approved',
  reviewer: 'rv',
  date: '2026-08-17',
  note:
    'Körperhülle per matchFingerprint gegen die Referenz gegated — für E.1.37 erstmals gegen den ' +
    'Gebäudekörper und nicht gegen die ring-Form der Taktischen Formation. Was das Gate dabei ' +
    'nicht sieht, bleibt unverändert: `pickShape` greift eine Form je Zeichnung, die verkürzten ' +
    'Füllflächen und die Balkenkopfzone von E.1.31 erreicht es gar nicht. Für die ' +
    'Beschriftungszonen prüft die Rasterprüfung in fonts.test.ts die tatsächliche Tinte aller 37 ' +
    'Kürzelsätze aus E-a, E-b und E-c gegen die deklarierte boxMm. Neu ist ein Kernschritt in ' +
    'compose.ts: die mittige Grundlinie rechnet seit E.1.37 gegen die Körperunterkante (maxY − 8) ' +
    'statt gegen die Oberkante (minY + 12) — an `formation` dieselbe Zahl, am Gebäudekörper 18,0 ' +
    'statt 15,0 mm. Kein Snapshot der 28 Bestandszeichen hat sich dadurch geändert. Dazu die ' +
    'globalen Mehrgrößen-, viewBox-, Metadaten- und Kontrast-Gates; ein neuer Kontrastvertrag ' +
    'entsteht nicht, weisser Text auf blau steht seit E-a als eigene 4,5:1-Anforderung im ' +
    'A11y-Gate. Die neun Referenzdateien sind einzeln vermessen; daraus stammen die drei Befunde ' +
    'und die eine deklarierte Abweichung.',
};

/**
 * Die eine Zeile aus E-c, bei der die **Umsetzung von der Quelle** abweicht. Wie bei E-b setzt nur
 * diese Richtung den Status um; die drei Füllflächen- und Grundlinienbefunde bleiben `approved`
 * mit Befundvermerk, weil dort die Quelle von sich selbst abweicht.
 */
const ANHANG_E_C_DEVIATIONS: Readonly<Record<string, string>> = Object.freeze({
  'E.1.31':
    'Der Katalog baut das Zeichen ohne Kopfzone, weil die Referenz an dieser Stelle keinen ' +
    'Stärkegrad trägt: zwei senkrechte Balken von je 1,500 × 4,000 mm bei cx 12,000 und ' +
    '20,000 mm, y 1,000…5,000 mm (Pfad „M54.567,2.835h4.252v11.339h-4.252V2.835Z' +
    'M31.89,14.173h4.252V2.835h-4.252v11.339Z"), Mitte also bei cy 3,000 mm. Alle vier ' +
    'Stärkegrade sind dagegen aus Kreisen r 1,500 mm gebaut und keiner aus einem Rechteck: ' +
    'trupp, gruppe und zug als Reihe auf den Plätzen 11/16/21 mm mit cyFromTopMm 1,5 (absolut ' +
    'cy 3,500 mm), staffel als senkrechter Stapel zweier Marken auf der Mittelachse ' +
    '(cyFromTopMm 1,5 und 5,5, vermessen an C.1.1/C.1.8 und in E.1 nicht vorkommend). Weder Form ' +
    'noch Lage stimmen überein, und StrengthId kennt nur diese vier. Grund ist hier ' +
    'ausdrücklich **nicht** die Fallzahl, anders als bei der Innenreihe von E.1.19/E.1.24: der ' +
    'Balkenpfad kommt in genau drei von 661 Referenzdateien vor — E.1.31, ' +
    '„F.1.1_Medizinische Task Force.svg" und „F.1.3_Mobiles Betreuungsmodul 5000.svg" — und dort ' +
    'byteweise identisch, die Geometrie ist also eine vermessene Konstante. Was fehlt, ist die ' +
    'Bedeutung: StrengthId ist ein Fachbegriff, und welchen Begriff diese Balken tragen, ' +
    'entscheidet die Datei nicht. Die Zahl der Balken trifft „5.5.2_Bereitschaft (Verband II)", ' +
    'das Maß nicht — dort 4,000 × 10,000 mm bei cx 7,000 und 25,000 mm, also Breite ×0,375, Höhe ' +
    '×0,400 und Achsabstand ×0,444: keine gleichmäßige Verkleinerung. Eine ID zu vergeben hieße ' +
    'einen Begriff zu behaupten, den die Quelle nicht trägt — dieselbe Falschaussage, aus der ' +
    'E-b den capability.*-Weg verworfen hat. Die Platzierung wäre dabei nicht das Hindernis: die ' +
    'Balken sind mit den Kreiskopfzonen aller acht anderen bündig unten auf 5,000 mm und wachsen ' +
    'nur nach oben in freien Raum. Es fehlt eine Markenform (HeadMark ist {cxMm, cyFromTopMm, ' +
    'rMm} und kann kein Rechteck ausdrücken) und ein Begriff, keine Platzierungsmathematik.',
});

/**
 * Technisches Review der 21 Zeichen aus E-d. Eigener Eintrag mit eigenem Datum wie bei E-b und
 * E-c; die Note nennt zusätzlich, was an diesem Teilslice technisch neu ist, weil hier zum ersten
 * Mal ein Gate greift, das es in E.1 nicht gab.
 *
 * **Am 18. August 2026 um E.2.6 erweitert.** Es teilt dieses Review mit den 20 anderen — sein
 * Nachweis ist derselbe —, bringt aber als einziges Zeichen des Anhangs E ein Kontrastpaar mit,
 * das die eigene Schwelle nicht erreicht. Das steht unten in der Note und nicht als
 * `deviation`: die Umsetzung folgt der Quelle punktgenau.
 */
const ANHANG_E_D_TECHNICAL_REVIEW: Review = {
  status: 'approved',
  reviewer: 'rv',
  date: '2026-08-18',
  note:
    'Körperhülle per matchFingerprint gegen die Referenz gegated — und das ist hier erstmals eine ' +
    'Aussage über den Körper und nicht über einen Buchstaben: bis zum Ausbau des ' +
    'Kennwertextraktors legte dieser für gekrümmte Füllpfade keine Form ab, und `pickShape` griff ' +
    'in 30 der 31 E.2-Kennwertsätze die erste fremde Form — in 27 davon eine Glyphenhülle, in drei '
    + 'das zurückgesetzte Farbfeld. Was das Gate weiterhin nicht sieht: ' +
    'die zurückgesetzten Farbfelder von E.2.19 und E.2.20 und die Lage der Beschriftung. Für die ' +
    'Beschriftungszonen prüft die Rasterprüfung in fonts.test.ts die tatsächliche Tinte jedes ' +
    'Kürzelsatzes gegen die deklarierte boxMm; ohne die je Zeichen gemessenen Kappenhöhen treten ' +
    'in diesem Block sechs Läufe aus der 28-mm-Box (16/6/430/520/313/464 Tintenpixel bei 256 px, ' +
    'selbst nachgerastert), mit ihnen null. Neu gegated ist außerdem die Fahrwerkszone: sie hängt ' +
    'an der Unterkante des platzierten Grundzeichens und nicht an der des Körperprimitivs, was ' +
    'allein E.2.15 von 26,75 auf die gemessenen 28,2504 mm Radmitte bringt. Dazu die globalen ' +
    'Mehrgrößen-, viewBox-, Metadaten- und Kontrast-Gates. Der Kontrastvertrag ist mit E.2.6 um ' +
    'ein Paar gewachsen: weisser Text auf blau steht seit E-a als eigene 4,5:1-Anforderung, ' +
    'weisser Text auf orange kam am 18.08.2026 dazu und erreicht 2,382:1 bzw. 2,323:1. Er ist ' +
    'als entschiedene Ausnahme in CONTRAST_EXCEPTIONS geführt und paarweise wie themeweise ' +
    'begrenzt; die Schwelle selbst bleibt unverändert. Alle 21 Referenzdateien sind einzeln ' +
    'vermessen und zweimal unabhängig gerastert; daraus stammen die neun Befunde. E.2.6 trägt ' +
    'keinen — seine Hülle, seine Grundlinie und seine Beschriftung sind mit E.2.5 zeichengleich ' +
    '(größte Einzeldifferenz 0,000706 mm), seine Strichebene mit E.2.4, E.2.7, E.2.8 und E.2.11. ' +
    'Deklarierte Abweichungen trägt dieser Block keine.',
};

/**
 * Technisches Review der fünf Zeichen aus E-e. Eigener Eintrag, weil dieser Block als einziger
 * eine deklarierte Abweichung trägt und weil die drei Körperformen ihre eigenen Belegdateien
 * haben.
 */
const ANHANG_E_E_TECHNICAL_REVIEW: Review = {
  status: 'approved',
  reviewer: 'rv',
  date: '2026-08-18',
  note:
    'Körperhülle per matchFingerprint gegen die Referenz gegated, für `trailer` und ' +
    '`upright-rectangle` erstmals gegen Körperformen ohne Kapitel-1-Abschnitt. Der Anhängerrumpf ' +
    'ist dabei gegen zwei Belegdateien gegated (E.2.22 und 5.1.2.1), das Hochkantrechteck gegen ' +
    'E.2.26 — als einzige der 31 E.2-Dateien führt es einen ring-Kennwert und war damit auch vor ' +
    'dem Extraktorausbau gegated. Was kein Gate sieht: die Deichsel (role bodyExtra) erreicht ' +
    'matchFingerprint nicht, das nur role: body vergleicht; für sie steht eine eigene ' +
    'Rasterprüfung im Band x 1,5…3,5 / y 14…16 mm. Für die Beschriftungszonen prüft die ' +
    'Rasterprüfung in fonts.test.ts die Tinte gegen die deklarierte boxMm. Dazu die globalen ' +
    'Mehrgrößen-, viewBox-, Metadaten- und Kontrast-Gates. Alle fünf Referenzdateien sind einzeln ' +
    'vermessen; daraus stammen die vier Befunde und die eine deklarierte Abweichung.',
};

/**
 * Technisches Review der fünf Zeichen aus E-f. Eigener Eintrag, weil hier als einzigem Block des
 * Anhangs eine Beschriftung **außerhalb** des Körpers steht und damit ein zweiter Kontrastvertrag
 * greift.
 */
const ANHANG_E_F_TECHNICAL_REVIEW: Review = {
  status: 'approved',
  reviewer: 'rv',
  date: '2026-08-18',
  note:
    'Körperhülle per matchFingerprint gegen die Referenz gegated, und zwar gegen die zweite in ' +
    'der Quelle belegte Zeichnung des Wasserfahrzeugs (bodyVariant raised-hull, Füllhülle ' +
    '1,0100/7,9999/30,9894/22,9898 mm). Die Zeichnung aus Kapitel 1 fiele hier um 2,8 Einheiten ' +
    'bei einer Toleranz von 0,01 — sie bleibt unverändert, weil sie 1.5_Wasserfahrzeug.svg als ' +
    'Belegdatei beansprucht und selbst dagegen gegatet ist. Neu ist ein zweiter Kontrastvertrag: ' +
    'labelContrastRequirements() leitet für die vierte Beschriftungszone „Organisationsfarbe auf ' +
    'der Ausgabeoberfläche" ab, weil ihr Untergrund nicht die Körperfläche ist. Selbst ' +
    'nachgerechnet und im A11y-Gate festgehalten: blau auf surface erreicht 11,072:1 im ' +
    'Referenztheme, 4,634:1 in accessible-light und 4,542:1 im Drucktheme gegen eine Textschwelle ' +
    'von 4,5:1 — keine Palettenänderung nötig. Die Lage der Zone selbst erreicht kein ' +
    'Fingerprint-Gate; für sie steht eine Rasterprüfung bei 4096 px in fonts.test.ts. Dazu die ' +
    'globalen Mehrgrößen-, viewBox-, Metadaten- und Kontrast-Gates. Alle fünf Referenzdateien ' +
    'sind einzeln vermessen; daraus stammen die zwei Befunde. Deklarierte Abweichungen trägt ' +
    'dieser Block keine.',
};

/**
 * Die eine Zeile aus E.2, bei der die **Umsetzung von der Quelle** abweicht — im Unterschied zu
 * den 15 Befunden, wo die Quelle von sich selbst abweicht und die Umsetzung ihrer Mehrheit folgt.
 * Dass es über 31 Zeichen und fünf Körperformen genau eine ist, liegt daran, dass dieser Slice
 * die Mechanismen gebaut hat, die E.1 noch als Abweichung tragen musste: E.2.15 wäre ohne den
 * L-Rahmen der zweite Fall nach dem Muster von E.1.19/E.1.24 gewesen.
 */
const ANHANG_E_2_DEVIATIONS: Readonly<Record<string, string>> = Object.freeze({
  'E.2.26':
    'Der THW-Lauf der Referenz endet rechts bei 26,0269 mm bei einer Körperkante von 29,0001 mm; ' +
    'da die Referenzschrift ihren Anker um 0,0269 mm überragt (an E.2.1 gemessen: Tinte 29,0269 ' +
    'bei Anker 29,0003), steht ihr Anker auf 26,0. Der Katalog setzt ihn auf 27,0, weil ' +
    'LABEL_SIDE_MARGIN_MM = 2 gegen die rechte Körperkante rechnet — 1,0 mm Unterschied, im ' +
    'Paarbild sichtbar. Für einen Mechanismus fehlt die Grundlage: n = 1 im gesamten Bestand ' +
    '(diese Körperform kommt in genau einer der 661 Referenzdateien vor), und zwei gleich gute ' +
    'Lesarten stehen nebeneinander — maxX − 3,0 oder rechte Kante der Farbfläche (28,0000) − ' +
    '2,0. Beide erzeugen dasselbe Bild, belegt ist das Bild und nicht die Kante. Die Marge selbst ' +
    'ist an 30 anderen Zeichen des Anhangs belegt (Tinte 19,9870…29,0269 bei Körperkante ' +
    '31,0003 mm) und wird für einen Einzelfall nicht aufgebrochen. Dieselbe Einordnung wie bei ' +
    'E.1.17, das seine 2,0009 mm waagerecht aus demselben Grund trägt.',
});

/**
 * Befund und Abweichung sind zwei unabhängige Achsen und werden deshalb **addiert, nicht
 * verzweigt**: sieben der 21 Zeichen aus E-b und E-c tragen keines von beidem, zehn nur einen
 * Befund an der Referenzdatei, E.1.17 nur eine Abweichung der Umsetzung, und E.1.19, E.1.24 sowie
 * E.1.31 beides. Eine `else if`-Kette verlöre bei diesen dreien den Befund.
 */
function withFindingAndDeviation(
  base: Review,
  finding: string | undefined,
  deviation: string | undefined,
): Review {
  if (finding === undefined && deviation === undefined) return base;
  return {
    ...base,
    ...(deviation === undefined ? {} : { status: 'deviation' as const }),
    note: [
      base.note ?? '',
      ...(finding === undefined ? [] : [`Befund an der Referenzdatei: ${finding}`]),
      ...(deviation === undefined ? [] : [`Abweichung der Umsetzung: ${deviation}`]),
    ].join(' '),
  };
}

/**
 * Provenienz des technischen Reviews je Rezeptzeile. Die Verzweigung ist **nicht** Buchführung:
 * ohne sie fielen die zwölf E-b- und die neun E-c-Abschnitte durch den letzten `return` und
 * behaupteten das Slice-2-Migrationsreview vom 5. August als ihre technische Provenienz — ein
 * `approved` von `rv`, an dem kein Test etwas auffällig fände.
 */
function technicalReviewFor(section: string): Review {
  if (Object.hasOwn(ANHANG_D_TASK_3_RECIPES, section)) {
    return ANHANG_D_TASK_3_TECHNICAL_REVIEW;
  }
  if (Object.hasOwn(ANHANG_D_TASK_5_RECIPES, section)) {
    return ANHANG_D_TASK_5_TECHNICAL_REVIEW;
  }
  if (Object.hasOwn(ANHANG_D_TASK_6_RECIPES, section)) {
    return ANHANG_D_TASK_6_TECHNICAL_REVIEW;
  }
  if (section === 'C.1.3') return ANHANG_C_A_TECHNICAL_REVIEW;
  if (Object.hasOwn(ANHANG_E_A_RECIPES, section)) {
    const defect = ANHANG_E_A_FILL_DEFECTS[section];
    if (defect === undefined) return ANHANG_E_A_TECHNICAL_REVIEW;
    return {
      ...ANHANG_E_A_TECHNICAL_REVIEW,
      note: `${ANHANG_E_A_TECHNICAL_REVIEW.note ?? ''} Befund an der Referenzdatei: ${defect}`,
    };
  }
  if (Object.hasOwn(ANHANG_E_B_RECIPES, section)) {
    return withFindingAndDeviation(
      ANHANG_E_B_TECHNICAL_REVIEW,
      ANHANG_E_B_FILL_FINDINGS[section],
      ANHANG_E_B_DEVIATIONS[section],
    );
  }
  if (Object.hasOwn(ANHANG_E_C_RECIPES, section)) {
    return withFindingAndDeviation(
      ANHANG_E_C_TECHNICAL_REVIEW,
      ANHANG_E_C_FILL_FINDINGS[section],
      ANHANG_E_C_DEVIATIONS[section],
    );
  }
  if (Object.hasOwn(ANHANG_E_D_RECIPES, section)) {
    return withFindingAndDeviation(
      ANHANG_E_D_TECHNICAL_REVIEW,
      ANHANG_E_D_FINDINGS[section],
      ANHANG_E_2_DEVIATIONS[section],
    );
  }
  if (Object.hasOwn(ANHANG_E_E_RECIPES, section)) {
    return withFindingAndDeviation(
      ANHANG_E_E_TECHNICAL_REVIEW,
      ANHANG_E_E_FINDINGS[section],
      ANHANG_E_2_DEVIATIONS[section],
    );
  }
  if (Object.hasOwn(ANHANG_E_F_RECIPES, section)) {
    return withFindingAndDeviation(
      ANHANG_E_F_TECHNICAL_REVIEW,
      ANHANG_E_F_FINDINGS[section],
      ANHANG_E_2_DEVIATIONS[section],
    );
  }
  if (Object.hasOwn(ANHANG_F_A_RECIPES, section)) {
    return withFindingAndDeviation(
      ANHANG_F_A_TECHNICAL_REVIEW,
      ANHANG_F_A_FINDINGS[section],
      ANHANG_F_A_DEVIATIONS[section],
    );
  }
  if (Object.hasOwn(ANHANG_F_B_RECIPES, section)) {
    return withFindingAndDeviation(
      ANHANG_F_B_TECHNICAL_REVIEW,
      ANHANG_F_B_FINDINGS[section],
      ANHANG_F_B_DEVIATIONS[section],
    );
  }
  if (Object.hasOwn(ANHANG_F_C_RECIPES, section)) {
    return withFindingAndDeviation(
      ANHANG_F_C_TECHNICAL_REVIEW,
      ANHANG_F_C_FINDINGS[section],
      ANHANG_F_C_DEVIATIONS[section],
    );
  }
  if (Object.hasOwn(ANHANG_F_D_RECIPES, section)) {
    return withFindingAndDeviation(
      ANHANG_F_D_TECHNICAL_REVIEW,
      ANHANG_F_D_FINDINGS[section],
      ANHANG_F_D_DEVIATIONS[section],
    );
  }
  if (Object.hasOwn(ANHANG_F_E_RECIPES, section)) {
    return withFindingAndDeviation(
      ANHANG_F_E_TECHNICAL_REVIEW,
      ANHANG_F_E_FINDINGS[section],
      ANHANG_F_E_DEVIATIONS[section],
    );
  }
  if (Object.hasOwn(ANHANG_F_F_RECIPES, section)) {
    return withFindingAndDeviation(
      ANHANG_F_F_TECHNICAL_REVIEW,
      ANHANG_F_F_FINDINGS[section],
      ANHANG_F_F_DEVIATIONS[section],
    );
  }
  if (Object.hasOwn(ANHANG_N_RECIPES, section)) {
    return ANHANG_N_TECHNICAL_REVIEW;
  }
  if (Object.hasOwn(ANHANG_G_RECIPES, section)) {
    return ANHANG_G_TECHNICAL_REVIEW;
  }
  if (Object.hasOwn(ANHANG_H_RECIPES, section)) return ANHANG_H_TECHNICAL_REVIEW;
  if (Object.hasOwn(ANHANG_I_D_RECIPES, section)) {
    return ANHANG_I_D_TECHNICAL_REVIEW;
  }
  if (Object.hasOwn(ANHANG_I_E_RECIPES, section)) {
    return ANHANG_I_E_TECHNICAL_REVIEW;
  }
  if (Object.hasOwn(ANHANG_I_G_RECIPES, section)) {
    return ANHANG_I_G_TECHNICAL_REVIEW;
  }
  if (Object.hasOwn(ANHANG_I_B_RECIPES, section)) {
    return ANHANG_I_B_TECHNICAL_REVIEW;
  }
  if (Object.hasOwn(ANHANG_I_A_RECIPES, section)) {
    return ANHANG_I_A_TECHNICAL_REVIEW;
  }
  if (Object.hasOwn(ANHANG_I_J_RECIPES, section)) {
    return ANHANG_I_J_TECHNICAL_REVIEW;
  }
  if (Object.hasOwn(ANHANG_I_K_RECIPES, section)) {
    const review = ANHANG_I_K_TECHNICAL_REVIEWS[section];
    if (review === undefined) {
      throw new Error(`Kein technisches I-k-Review für ${section}.`);
    }
    return review;
  }
  return TECHNICAL_REVIEW;
}

/**
 * Zerlegt den Rezeptschlüssel in Abschnitt und Darstellung. Bis zum Teilslice F-a war der
 * Schlüssel der bloße Abschnitt und die Darstellung immer `primary`; Anhang F trägt acht
 * Alternativdarstellungen, die keinen eigenen Abschnitt eröffnen — `F.1.11` und
 * `F.1.11#alternative` sind derselbe Rettungsdienst, einmal mit Kürzel und einmal mit dem
 * Zeichen aus 4.6.3.
 *
 * Der Manifestschlüssel bleibt `entryKey(sourceId, variant)` und damit unverändert; neu ist
 * allein, dass `variant` nicht mehr konstant `primary` ist.
 */
function splitRecipeKey(key: string): { section: string; variant: CoverageEntry['variant'] } {
  const separator = key.indexOf('#');
  if (separator === -1) return { section: key, variant: 'primary' };
  const suffix = key.slice(separator + 1);
  if (suffix !== 'alternative') {
    throw new Error(
      `Rezeptschlüssel "${key}": nach dem Doppelkreuz steht die Darstellung, und die einzige ` +
        'neben der stillschweigenden `primary` ist `alternative`.',
    );
  }
  return { section: key.slice(0, separator), variant: 'alternative' };
}

const recipeEntries: CoverageEntry[] = Object.entries(RECIPES).map(([key, recipe]) => {
  const { section, variant } = splitRecipeKey(key);
  const sourceId = `bbk-babz-2025:${section}`;
  return {
    sourceId,
    variant,
    title: recipe.title,
    implementation: `recipe.${key}`,
    referenceAsset: recipe.referenceAsset,
    coverage: 'composition-recipe',
    profile: 'bund',
    // Wie bei den Grundzeichen entscheidet das Kennwertartefakt statt einer Rezept-ID: führt die
    // Referenz `shapes: []`, ist der Fingerprint-Vergleich strukturell nicht ausführbar und eine
    // explizite Geometrieregression tritt an seine Stelle. Unbekannte Assets liefern im Helper
    // bewusst `false` und fallen danach im Fingerprinttest fail-closed auf.
    testEvidence: referenceLacksComparableShape(recipe.referenceAsset)
      ? UNGATED_DRAWING_EVIDENCE
      : DRAWING_EVIDENCE,
    review: reviewFor(sourceId, variant, technicalReviewFor(key)),
  };
});

/**
 * Abschnittsnummer je Element. Jedes Element braucht eine eigene Nummer, sonst kollidierten die
 * vier Stärkegrade auf `5.4` — der Manifestschlüssel bleibt `entryKey(sourceId, variant)`.
 * Alle elf Nummern sind aus den Dateinamen des Referenzbestands belegt, keine ist geschlossen.
 */
const ELEMENT_SECTIONS: Record<string, string> = {
  'organization.feuerwehr': '2.1',
  'organization.thw': '2.3',
  'organization.fuehrung-leitung': '2.4',
  'organization.polizei': '2.5',
  'organization.bundeswehr': '2.6',
  'organization.sonstige-gefahrenabwehr': '2.7',
  'organization.zivile-einheiten': '2.8',
  'organization.hilfsorganisation': '2.2',
  'strength.trupp': '5.4.1',
  'strength.staffel': '5.4.2',
  'strength.gruppe': '5.4.3',
  'strength.zug': '5.4.4',
  'vehicle-category.kfz-kategorie-1': '5.1.1.1',
  'vehicle-category.kfz-kategorie-2': '5.1.1.2',
  'vehicle-category.kfz-kategorie-3': '5.1.1.3',
  'vehicle-category.kettenfahrzeug': '5.1.1.5',
  'vehicle-category.schienenfahrzeug': '5.1.1.6',
  // Zwei Zeilen aus Kapitel 5.1.2. Sie erweitern den beanspruchten **Umfang** nicht: `scope`
  // führt weiterhin `5.1.1` und ausdrücklich nicht `5.1.2` — von dessen fünf Abschnitten sind
  // nur die beiden Fahrwerke umgesetzt, die Anhängerzeichen selbst nicht.
  'vehicle-category.anhaenger-ein-rad': '5.1.2.4',
  'vehicle-category.anhaenger-zwei-raeder': '5.1.2.5',
};

/**
 * Elemente tragen die zu ihrer Datenform passende Evidenz statt zwei universelle Booleans:
 * Organisationsfarben werden gegen die Referenzfüllung geprüft, Stärkegrade als vollständige
 * `HeadShape`. Piktogramme werden unmittelbar unterhalb aus ihren Definitionen mit eigenen
 * SVG-Snapshots und ihrem Kommando-/Box-/Clipping-Vertrag abgeleitet.
 * Globale Mehrgrößen-, viewBox-, Metadaten- und Kontrast-Gates bleiben globale Aussagen und
 * werden nicht als Eigenschaft jeder einzelnen Manifestzeile ausgegeben.
 */
const elementEntries: CoverageEntry[] = Object.entries(ELEMENT_SECTIONS).map(([id, section]) => {
  const descriptor = resolveElement(id);
  const sourceId = `bbk-babz-2025:${section}`;
  const testEvidence: readonly TestEvidenceKind[] =
    descriptor.kind === 'organization'
      ? ['reference-fill']
      : descriptor.kind === 'strength'
        ? ['head-shape-regression']
        : descriptor.kind === 'vehicle-category'
          ? ['chassis-shape-regression']
          : ['svg-snapshot', 'pictogram-contract'];
  return {
    sourceId,
    variant: 'primary',
    title: descriptor.title,
    implementation: id,
    // Die namensgebende Datei. Das Gate prüft, dass sie in `referenceAssets` vorkommt und dass
    // ihr Name mit der Abschnittsnummer aus `sourceId` beginnt.
    referenceAsset: descriptor.referenceAssets[0] ?? '',
    coverage: 'element',
    profile: 'bund',
    testEvidence,
    review: reviewFor(sourceId, 'primary', TECHNICAL_REVIEW),
  };
});

const pictogramEntries: CoverageEntry[] = ALL_PICTOGRAMS.map((definition) => {
  const sourceId = `bbk-babz-2025:${definition.section}`;
  const technicalReview = definition.id.startsWith('water-rescue-personnel.')
    ? WATER_RESCUE_PERSONNEL_TECHNICAL_REVIEW
    : definition.id.startsWith('state.')
    ? STATE_PICTOGRAM_TECHNICAL_REVIEW
    : definition.id.startsWith('leadership.')
      ? definition.section.startsWith('D.3.')
        ? LEADERSHIP_OPEN_CAP_TECHNICAL_REVIEW
        : definition.section.startsWith('D.2.')
          ? LEADERSHIP_LOCATION_TECHNICAL_REVIEW
          : LEADERSHIP_PICTOGRAM_TECHNICAL_REVIEW
    : definition.id.startsWith('damage.') || definition.id.startsWith('wildfire.')
      ? DAMAGE_PICTOGRAM_TECHNICAL_REVIEW
      : PICTOGRAM_TECHNICAL_REVIEW;
  return {
    sourceId,
    variant: definition.variant,
    title: definition.title,
    implementation: definition.id,
    referenceAsset: definition.referenceAsset,
    coverage: 'element',
    profile: 'bund',
    testEvidence: ['svg-snapshot', 'pictogram-contract'],
    review: reviewFor(sourceId, definition.variant, technicalReview),
  };
});

const COVERAGE_MANIFEST_DATA: CoverageManifest = {
  baseline: 'bbk-babz-2025',
  /**
   * Datenversion des Kerns, unabhängig von den npm-Paketversionen. Ein Profil kann sich ändern,
   * ohne den Kern zu berühren, und umgekehrt — über Paketversionen wäre das nur darstellbar,
   * wenn jedes Profil ein eigenes npm-Paket wäre.
   */
  coreVersion: '0.2.0',
  // Kapitel 3 (sieben Referenzdateien) setzt dieser Slice nicht um.
  //
  // **`5.1.1` und ausdrücklich nicht `5.1`.** Fünf der sechs Fahrzeugkategorien aus 5.1.1 sind
  // seit LFH-424 vermessen und gebaut; die übrigen Abschnitte von Kapitel 5.1 sind es nicht —
  // 5.1.2 (Anhänger, eigener Körper mit Deichsel), 5.1.3 (Behälter) und 5.1.4 (Luftfahrzeuge)
  // tragen Körperformen, die der Katalog nicht führt. `5.1` bestünde `uncoveredScope` trotzdem,
  // weil jede 5.1.1.x-Zeile mit `5.1.` beginnt — dieselbe unwiderlegbare Behauptung, die weiter
  // unten für `E` gegen `E.1` beschrieben ist. Und innerhalb von 5.1.1 fehlen 5.1.1.4
  // (Amphibienfahrzeug: Wellenlinie nur als Strichhülle vermessen) sowie 5.1.1.7 bis 5.1.1.9;
  // dass `uncoveredScope` das nicht meldet, ist der Grund, warum die Zuordnung in
  // `vehicle-categories.test.ts` zusätzlich an den Zahlen festgenagelt ist.
  //
  // 5.7 (Verwaltungsstufen) bleibt außerhalb: Drei der sechs Stufen haben in Kopfform überhaupt
  // keine Referenz. Die drei in D.3/D.4 vermessenen Köpfe liefern deshalb keinen
  // Vollständigkeitsnachweis für den Satz aus allen sechs Stufen
  // (`docs/decisions/2026-08-18-grundlagen-restpunkte.md`).
  // K, L und M stehen einbuchstabig im Umfang, weil ihre Nummerierung flach ist: `K` deckt
  // K.1 bis K.18 ab, wo `J` vier Unterkapitel gebraucht hätte.
  // **Anhang E steht seit dem 18. August 2026 als ein einziges `E`.** Die Bewegung dorthin ist
  // in drei Schritten gelaufen, und jeder hatte denselben Grund: `uncoveredScope` prüft an einem
  // Präfix nur, ob **eine** Zeile mit ihm beginnt, nie die Vollständigkeit. `E` bestünde deshalb
  // schon mit einer einzigen E.1-Zeile — eine Behauptung, die kein Gate widerlegt. Ein Präfix
  // darf hier also erst stehen, wenn ein Test die Lückenlosigkeit trägt.
  //
  // Bis E-c standen die 37 E.1-Abschnitte einzeln; mit E-c wurden sie zu `E.1`, weil
  // `recipes.test.ts` seither festhält, dass E-a bis E-c genau E.1.1 bis E.1.37 ergeben. Der
  // Teilslice E.2 baute 30 seiner 31 Abschnitte und musste sie **einzeln** führen: für `E.2`
  // ließ sich das Gate nicht schreiben, solange E.2.6 fehlte. Mit E.2.6 ist E.2 lückenlos, und
  // `coverage-manifest.test.ts` hält beides fest — E.2.1 bis E.2.31 ohne Lücke und der ganze
  // Anhang mit genau 68 Abschnitten, abgeleitet aus den Manifesteinträgen und nicht aus den
  // Rezepten. Erst dieser Test macht `E` widerlegbar; ohne ihn wäre die Zusammenziehung eine
  // Verschlechterung und keine Vereinfachung.
  //
  // E.2.6 war der letzte offene Abschnitt — nicht aus einer Messlücke, sondern weil weisser Text
  // auf der Organisationsfarbe orange 2,382:1 bzw. 2,323:1 gegen eine geforderte Textschwelle von
  // 4,5:1 erreicht und im Drucktheme kein Grauwert existiert, der das löst. Entschieden am
  // 18. August 2026: der Katalog baut das Zeichen wie die Referenz es zeigt und führt den Befund
  // als erklärte Ausnahme (`CONTRAST_EXCEPTIONS`, Zahlen als Test in `a11y-contrast-gate.test.ts`).
  // Es trägt deshalb keine `deviation` — abweichend ist die eigene Schwelle des Katalogs, nicht
  // die Umsetzung von der Quelle.
  scope: [
    '1',
    '2',
    '4',
    '5.1.1',
    '5.4',
    '5.8',
    'C.1.1',
    'C.1.2',
    'C.1.3',
    'D',
    'E',
    'F',
    'G',
    'H',
    'I.1.5',
    'I.1.6',
    'I.1.7',
    'I.1.8',
    'I.1.9',
    'I.1.10',
    'I.1.11',
    'I.1.12',
    'I.1.17',
    'I.1.18',
    'I.1.19',
    'I.1.20',
    'I.2.1',
    'I.2.2',
    'I.2.3',
    'I.3.5',
    'I.3.6',
    'I.3.7',
    'I.4.1',
    'I.4.2',
    'I.4.3',
    'I.5.1',
    'I.5.2',
    'I.5.3',
    'I.5.4',
    'I.5.5',
    'I.5.6',
    'I.5.7',
    'I.5.8',
    'J.1',
    'J.2',
    'J.3',
    'J.4',
    'K',
    'L',
    'M',
    'N',
  ],
  entries: [...catalogEntries, ...recipeEntries, ...elementEntries, ...pictogramEntries],
};

// Die Fachreviews sind bereits als unveränderliche Ledgerobjekte ausgewiesen. Alle übrigen
// Referenzen gehören diesem Modul; das direkte Einfrieren erhält deshalb den geprüften
// Identitätsvertrag zwischen Manifestzeile und Ledger ohne fremde Eingaben zu verändern.
export const COVERAGE_MANIFEST: DeepReadonly<CoverageManifest> = deepFreeze(COVERAGE_MANIFEST_DATA);
