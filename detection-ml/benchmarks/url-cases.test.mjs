import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { analyzeUrl } from "../../extension/lib/url-analyzer.ts";

const cases = JSON.parse(
  readFileSync(
    new URL("./url-cases.json", import.meta.url),
    "utf8"
  )
);

assert.ok(Array.isArray(cases) && cases.length > 0);
assert.equal(
  new Set(cases.map(item => item.name)).size,
  cases.length,
  "Nazwy przypadków muszą być unikalne"
);

for (const example of cases) {
  test(example.name, () => {
    const result = analyzeUrl(example.url);

    assert.equal(
      result.status,
      example.status,
      "Nieoczekiwany status"
    );

    assert.equal(
      result.hostname,
      example.hostname,
      "Nieoczekiwany host"
    );

    const actualCodes = result.signals
      .map(signal => signal.code)
      .sort();

    assert.deepEqual(
      actualCodes,
      [...example.codes].sort(),
      "Inny zestaw wskazówek niż oczekiwany"
    );

    if (result.status === "invalid_input") {
      assert.ok(result.message);
    }
  });
}
