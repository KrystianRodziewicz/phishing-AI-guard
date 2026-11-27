import test from "node:test";
import assert from "node:assert/strict";
import { analyzeUrl } from "../lib/url-analyzer.ts";

const examples = [
  ["https://example.com", "example.com", []],
  ["example.com", "example.com", []],
  ["https://my-shop.example", "my-shop.example", []],
  ["https://example.com.", "example.com", []],
  ["https://demobank.example", "demobank.example", []],
  ["https://login.demobank.example", "login.demobank.example", []],
  ["https://DEMOBANK.EXAMPLE", "demobank.example", []],
  ["https://other.example/demobank", "other.example", []],
  ["http://example.com", "example.com", ["http_address"]],
  ["http://localhost:8000", "localhost", ["http_address"]],
  ["http://127.0.0.1/login", "127.0.0.1",
    ["ip_address_host", "http_address"]],
  ["http://[::1]:8000", "::1",
    ["ip_address_host", "http_address"]],
  ["https://bank.example@demo.example/login", "demo.example",
    ["userinfo_in_url"]],
  ["https://login-demobank.example", "login-demobank.example",
    ["brand_name_outside_official_domain"]],
  ["https://demobank.example.other.example",
    "demobank.example.other.example",
    ["brand_name_outside_official_domain"]]
];

for (const [address, host, expectedCodes] of examples) {
  test("Analiza: " + address, () => {
    const result = analyzeUrl(address);
    assert.equal(result.hostname, host);
    assert.equal(
      result.status,
      expectedCodes.length ? "signals_found" : "no_signals_found"
    );
    assert.deepEqual(
      result.signals.map(signal => signal.code).sort(),
      [...expectedCodes].sort()
    );
  });
}

const typos = {
  demobnak: "transposition",
  demobnk: "deletion",
  demobbank: "insertion",
  demobonk: "substitution"
};

for (const [name, kind] of Object.entries(typos)) {
  test("Literówka: " + name, () => {
    const result = analyzeUrl("https://" + name + ".example");
    const signal = result.signals.find(
      item => item.code === "brand_typo_candidate"
    );
    assert.ok(signal);
    assert.equal(signal.typo_type, kind);
  });
}

const invalidInputs = [
  "",
  "import ipaddress",
  "https://exa!mple.com",
  "https://-example.com",
  "https://example..com",
  "https://example.com:99999",
  "ftp://example.com",
  null,
  123
];

for (const input of invalidInputs) {
  test("Błędne dane: " + JSON.stringify(input), () => {
    const result = analyzeUrl(input);
    assert.equal(result.status, "invalid_input");
    assert.equal(result.hostname, null);
    assert.deepEqual(result.signals, []);
  });
}

test("Zwykły sklep nie dostaje ostrzeżenia o marce", () => {
  assert.deepEqual(
    analyzeUrl("https://bookshop.example").signals,
    []
  );
});
