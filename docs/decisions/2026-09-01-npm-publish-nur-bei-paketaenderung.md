# Einsatzzeichen — npm-Publish nur bei echter Paketänderung

> Entscheidungsnotiz · 1. September 2026 · Umsetzung abgeschlossen

Betrifft `release.config.mjs`, `scripts/release/publish.mjs` und `scripts/release/changed-packages.mjs`.

## 1. Der Anlass

Release 1.0.2 bestand aus zwei Website-Arbeiten — dem JSON-Snapshot-Endpunkt und der echten
Site-URL. Kein Zeichen, keine Renderregel, keine öffentliche Signatur hat sich bewegt. Trotzdem
sind alle acht Pakete unter `@einsatzzeichen` als 1.0.2 auf npm gelandet. Wer `@einsatzzeichen/core`
aktualisiert, bekommt dabei ein identisches Artefakt unter neuer Nummer; das Changelog des Pakets
verspricht eine Änderung, die es dort nicht gibt.

## 2. Alles oder nichts, nicht Paket für Paket

Naheliegend wäre, nur die geänderten Pakete zu publizieren. Das scheitert an der Verzahnung des
Workspaces: alle Querverweise stehen als `workspace:*`, und `pnpm publish` schreibt sie beim
Veröffentlichen auf die **exakte** neue Version um.

- Wird `@einsatzzeichen/react@1.0.3` publiziert, ohne dass `core@1.0.3` und `schema@1.0.3`
  existieren, ist das Paket schlicht nicht auflösbar.
- Bleibt umgekehrt `catalog` bei 1.0.2 stehen, während `core` auf 1.0.3 geht, zieht ein Nutzer,
  der beide auf `latest` installiert, eine zweite, alte `core`-Kopie in den Baum.

Weil `schema` in jedem Paket steckt, hängt praktisch der gesamte Graph an einem Strang. Die
Entscheidung fällt darum in einer Stufe: publiziert wird der ganze Workspace oder gar nichts.

## 3. Was als Änderung zählt

`scripts/release/changed-packages.mjs` vergleicht den Release-Commit mit dem Tag des letzten
Releases (`${lastRelease.gitTag}`) und filtert zweifach:

1. **`packages/website` zählt nicht.** Das Paket trägt `private: true` und war nie auf npm.
   Die Prüfung liest das Flag aus den Manifesten, statt den Namen fest zu verdrahten.
2. **Reine Versionszeilen zählen nicht.** Zum Publish-Zeitpunkt hat `set-version.mjs` bereits in
   jede `package.json` die neue Version geschrieben, und der Release-Commit des `git`-Plugins
   steht schon. Ein nackter Dateivergleich meldete deshalb *immer* alle Pakete als geändert und
   der ganze Mechanismus wäre wirkungslos. Eine `package.json` zählt nur, wenn ihr Diff über die
   `"version"`-Zeile hinausgeht — eine geänderte Abhängigkeit also sehr wohl.

Ohne Vergleichspunkt — dem Erstrelease — wird publiziert.

## 4. Was unangetastet bleibt

Tag, `CHANGELOG.md`, der Release-Commit und das GitHub-Release entstehen weiterhin bei jedem
Release, auch bei einem reinen Website-Release. Die Version wird weiterhin in *alle* `package.json`
geschrieben; die Repository-Versionen bleiben also gleichauf, nur npm sieht die Nummer nicht.
Damit läuft die npm-Historie eines Pakets lückenhaft (auf 1.0.2 kann 1.0.4 folgen) — das ist
zulässig und die ehrlichere Auskunft als eine Version ohne Inhalt.

Übersprungen wird mit Exit-Code 0 und einer Zeile im Log; ein ausgelassenes Publish ist kein
Fehlschlag und darf das Release nicht rot färben.

## 5. Prüfung

`scripts/release/changed-packages.test.mjs` und `scripts/release/publish.test.mjs` decken die
Entscheidungslogik ab, letzteres gegen ein echtes Wegwerf-Repository mit einem aufzeichnenden
`pnpm` im PATH: Website-Änderung plus Versionsbump ruft npm nachweislich nicht auf, eine
Quelländerung an `core` ruft es mit den bisherigen Argumenten auf. `vitest.config.ts` nimmt dafür
`scripts/**/*.test.mjs` zusätzlich auf.

Am realen Release lässt sich das erst beim nächsten Push auf `main` beobachten.
