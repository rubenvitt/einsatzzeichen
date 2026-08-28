# ClickUp subtask

## Ergebnis

Lieferbares Ergebnis: eine klar abgegrenzte technische Voraussetzung oder ein Produktslice im
vereinbarten Umfang.

## Nicht-Ziele

Ausgeschlossen: Änderungen außerhalb des vereinbarten Lieferumfangs.

## Akzeptanzkriterien

- Vereinbarter technischer oder fachlicher Lieferumfang ist nachweisbar erbracht.
- Reviews und erforderliche Vollgates werden mit aktuellen Ergebnissen dokumentiert.

## Abhängigkeiten

Zugeordneter Parent-Task sowie Ziel-Branch und Lieferumfang. Diese Werte vor der ersten
einschlägigen Mutation live verifizieren und hier mit dem tatsächlichen Nachweis ergänzen.

## Verifikation

Ausstehend bis zur Ausführung: erforderliche Vollgates, Reviews und sauberer Status werden hier
mit ihren tatsächlichen Ergebnissen festgehalten.

## PR/HEAD

`ausstehend`: Noch kein PR/HEAD angelegt. Erst nach Erstellung den exakten Tuple
`(PR, Branch, HEAD)` eintragen, zum Beispiel `(PR #42, codex/example-delivery, 0123abcd)`.

## Post-Merge-Nachweis

`ausstehend` bis Merge und frischer Verifikation des effektiven Remote-`main` mit allen
erforderlichen Gates. Erst danach genau diesen Subtask auf `shipped` setzen; der Parent bleibt
von diesem Nachweis unberührt.
