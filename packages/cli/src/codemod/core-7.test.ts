import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { codemodCore7, rewriteCoreImports } from './core-7.js';

const rewrite = (text: string, file = 'a.ts') => rewriteCoreImports(text, file);

describe('codemod:7 (ESZ-151)', () => {
  it('verteilt einen Import auf Wurzel und Subpfade', () => {
    const { text, changed, warnings } = rewrite(
      "import { drawSymbol, renderSvg, RULE_CATALOG, busBar, baseDrawing } from '@einsatzzeichen/core';\n",
    );
    expect(changed).toBe(true);
    expect(warnings).toEqual([]);
    expect(text).toBe(
      "import { renderSvg } from '@einsatzzeichen/core';\n" +
        "import { drawSymbol } from '@einsatzzeichen/core/exact';\n" +
        "import { baseDrawing } from '@einsatzzeichen/core/blocks';\n" +
        "import { busBar } from '@einsatzzeichen/core/sketch';\n" +
        "import { RULE_CATALOG } from '@einsatzzeichen/core/gates';\n",
    );
  });

  it('lässt Importe, die an der Wurzel bleiben, unberührt', () => {
    const source = "import { draw, renderSvg, type Sign } from '@einsatzzeichen/core';\n";
    expect(rewrite(source)).toEqual({ text: source, changed: false, warnings: [] });
  });

  it('hält Typimporte, Aliase, Anführungszeichen und fehlendes Semikolon', () => {
    const { text } = rewrite('import type { SpecCheck, Choice as Wahl } from "@einsatzzeichen/core"\n');
    expect(text).toBe(
      'import type { Choice as Wahl } from "@einsatzzeichen/core"\n' +
        'import type { SpecCheck } from "@einsatzzeichen/core/exact"\n',
    );
  });

  it('macht aus einer Gruppe nur mit `type` einen Typimport', () => {
    const { text } = rewrite("import { draw, type ContrastRequirement } from '@einsatzzeichen/core';");
    expect(text).toBe(
      "import { draw } from '@einsatzzeichen/core';\n" +
        "import type { ContrastRequirement } from '@einsatzzeichen/core/gates';",
    );
  });

  it('schreibt Reexporte um', () => {
    const { text } = rewrite("export { drawSymbol, renderSvg } from '@einsatzzeichen/core';");
    expect(text).toBe(
      "export { renderSvg } from '@einsatzzeichen/core';\nexport { drawSymbol } from '@einsatzzeichen/core/exact';",
    );
  });

  it('bleibt mehrzeilig, wenn eine Zeile zu lang würde, und hält die Einrückung', () => {
    const source = [
      'function f() {}',
      'import {',
      '  COMPOSITION_RULE_CATALOG,',
      '  FREESTANDING_RULE_CATALOG,',
      '  RULE_CATALOG,',
      '  RULE_DIMENSIONS,',
      '  RULE_DIMENSION_GAPS,',
      '  drawSymbol,',
      "} from '@einsatzzeichen/core';",
    ].join('\n');
    expect(rewrite(source).text).toBe(
      [
        'function f() {}',
        "import { drawSymbol } from '@einsatzzeichen/core/exact';",
        'import {',
        '  COMPOSITION_RULE_CATALOG,',
        '  FREESTANDING_RULE_CATALOG,',
        '  RULE_CATALOG,',
        '  RULE_DIMENSIONS,',
        '  RULE_DIMENSION_GAPS,',
        "} from '@einsatzzeichen/core/gates';",
      ].join('\n'),
    );
  });

  it('meldet, was er nicht eindeutig umschreiben kann, und lässt es stehen', () => {
    const source = [
      "import * as core from '@einsatzzeichen/core';",
      "const lazy = await import('@einsatzzeichen/core');",
      "import { gibtEsNicht, drawSymbol } from '@einsatzzeichen/core';",
      "vi.mock('@einsatzzeichen/core', async () => ({}));",
    ].join('\n');
    const { text, warnings } = rewrite(source);
    expect(warnings.map((warning) => warning.line)).toEqual([1, 2, 3, 4]);
    expect(warnings[3]!.message).toContain('vi.mock');
    expect(warnings[2]!.message).toContain('gibtEsNicht');
    expect(text).toContain("import * as core from '@einsatzzeichen/core';");
    expect(text).toContain("import { gibtEsNicht } from '@einsatzzeichen/core';");
    expect(text).toContain("import { drawSymbol } from '@einsatzzeichen/core/exact';");
  });

  it('rührt Strings und Kommentare nicht an', () => {
    const source =
      "// import { drawSymbol } from '@einsatzzeichen/core';\n" +
      "const code = `import { drawSymbol } from '@einsatzzeichen/core';`;\n";
    expect(rewrite(source).changed).toBe(false);
  });

  it('kennt Astro-Vorspann, Skriptblöcke und Codeblöcke in Markdown', () => {
    const astro = "---\nimport { drawSymbol } from '@einsatzzeichen/core';\n---\n<p>{x}</p>\n";
    expect(rewrite(astro, 'a.astro').text).toBe(
      "---\nimport { drawSymbol } from '@einsatzzeichen/core/exact';\n---\n<p>{x}</p>\n",
    );
    const vue = "<template/>\n<script setup lang=\"ts\">\nimport { RULE_CATALOG } from '@einsatzzeichen/core';\n</script>\n";
    expect(rewrite(vue, 'a.vue').text).toContain("from '@einsatzzeichen/core/gates'");
    const markdown =
      "Text mit `import { drawSymbol } from '@einsatzzeichen/core'`.\n\n" +
      "```ts\nimport { drawSymbol } from '@einsatzzeichen/core';\n```\n\n" +
      "```bash\nimport { drawSymbol } from '@einsatzzeichen/core';\n```\n";
    const { text } = rewrite(markdown, 'a.md');
    expect(text).toBe(
      "Text mit `import { drawSymbol } from '@einsatzzeichen/core'`.\n\n" +
        "```ts\nimport { drawSymbol } from '@einsatzzeichen/core/exact';\n```\n\n" +
        "```bash\nimport { drawSymbol } from '@einsatzzeichen/core';\n```\n",
    );
  });

  it('schreibt Dateien nur mit write und überspringt node_modules', () => {
    const dir = mkdtempSync(join(tmpdir(), 'codemod-7-'));
    const file = join(dir, 'a.ts');
    const source = "import { drawSymbol } from '@einsatzzeichen/core';\n";
    writeFileSync(file, source);
    mkdirSync(join(dir, 'node_modules'));
    writeFileSync(join(dir, 'node_modules', 'b.ts'), source);
    expect(codemodCore7([dir], { write: false })).toEqual([{ file, changed: true, warnings: [] }]);
    expect(readFileSync(file, 'utf8')).toBe(source);
    codemodCore7([dir], { write: true });
    expect(readFileSync(file, 'utf8')).toBe("import { drawSymbol } from '@einsatzzeichen/core/exact';\n");
  });
});
