import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = readFileSync(new URL("../js/app.js", import.meta.url), "utf8");

test("application service boundary resolves the product service lazily", () => {
    assert.match(source, /get products\(\)/);
    assert.match(source, /return window\.OreganoProductService;/);
    assert.doesNotMatch(source, /products:\s*window\.OreganoProductService\s*,/);
});

test("application service boundary does not require the product service during construction", () => {
    assert.match(source, /services:\s*\{[\s\S]*get products\(\)/);
    assert.doesNotMatch(source, /services:\s*\{[\s\S]*products\s*:\s*window\.OreganoProductService/);
});
