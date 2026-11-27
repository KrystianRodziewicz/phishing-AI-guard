import test from "node:test";
import assert from "node:assert/strict";
import { analyzeUrlWarnings } from "./url-warning-adapter.ts";

test("Oficjalna domena nie tworzy ostrzeżeń", () => {
  const result = analyzeUrlWarnings(
    "https://demobank.example"
  );

  assert.equal(result.status, "no_signals_found");
  assert.deepEqual(result.warnings, []);
});

test("Literówka dostaje kategorię brand_mismatch", () => {
  const result = analyzeUrlWarnings(
    "https://demobnak.example"
  );

  const warning = result.warnings.find(
    item => item.id.startsWith("url:brand_typo_candidate:")
  );

  assert.ok(warning);
  assert.equal(warning.category, "brand_mismatch");
  assert.equal(warning.severity, "MEDIUM");
  assert.equal(warning.evidence, "demobnak.example");
  assert.equal(
    warning.explanation,
    result.signals[0].message
  );
});

test("Każda obecna reguła ma mapowanie", () => {
  const cases = [
    ["http://example.com", "http_address", "domain"],
    ["https://127.0.0.1", "ip_address_host", "domain"],
    [
      "https://name@demo.example",
      "userinfo_in_url",
      "domain"
    ],
    [
      "https://login-demobank.example",
      "brand_name_outside_official_domain",
      "brand_mismatch"
    ]
  ];

  for (const [url, code, category] of cases) {
    const result = analyzeUrlWarnings(url);
    const warning = result.warnings.find(
      item => item.id.startsWith(`url:${code}:`)
    );

    assert.ok(warning, code);
    assert.equal(warning.category, category);
    assert.ok(warning.title);
    assert.ok(warning.explanation);
  }
});

test("Dwie wskazówki mają osobne identyfikatory", () => {
  const result = analyzeUrlWarnings(
    "http://127.0.0.1/login"
  );

  assert.equal(result.warnings.length, 2);
  assert.equal(
    new Set(result.warnings.map(item => item.id)).size,
    2
  );
});

test("Błędny adres zachowuje status błędu", () => {
  const result = analyzeUrlWarnings(
    "https://example..com"
  );

  assert.equal(result.status, "invalid_input");
  assert.ok(result.message);
  assert.deepEqual(result.warnings, []);
});

test("Ostrzeżenia nie zawierają danych logowania", () => {
  const result = analyzeUrlWarnings(
    "https://user:secret@demo.example/login?token=private"
  );

  assert.equal(result.hostname, "demo.example");
  assert.equal(result.warnings.length, 1);
  assert.equal(
    result.warnings[0].evidence,
    "demo.example"
  );

  const serialized = JSON.stringify(result.warnings);
  assert.equal(serialized.includes("secret"), false);
  assert.equal(serialized.includes("token=private"), false);
});
