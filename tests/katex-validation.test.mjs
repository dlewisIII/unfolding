import assert from "node:assert/strict";
import test from "node:test";
import { extractMath, validateMath } from "../scripts/validate-katex.mjs";

test("extracts supported inline and display math delimiters", () => {
  const expressions = extractMath("Inline $x^2$ and $$y=2$$ and \\[z=3\\].");
  assert.equal(expressions.length, 3);
  assert.deepEqual(expressions.map(({ displayMode }) => displayMode), [true, true, false]);
});

test("validates correct KaTeX and rejects malformed expressions", () => {
  assert.equal(validateMath("$$S_n=\\sum_{k=0}^{n-1} 2\\pi r_k\\Delta r$$", "valid.md"), 1);
  assert.throws(() => validateMath("$$\\frac{1}{$$", "invalid.md"), /invalid\.md/);
});
