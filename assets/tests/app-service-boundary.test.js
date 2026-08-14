import assert from "node:assert/strict";
import test from "node:test";

const previousWindow = globalThis.window;

globalThis.window = {};

const source = await import("fs").then(fs => fs.readFileSync("./assets/js/app.js", "utf8"));


test("application service boundary resolves the product service lazily", () => {
    assert.match(source, /get products\(\)/);
    assert.match(source, /return window\.OreganoProductService;/);
    assert.doesNotMatch(source, /products:\s*window\.OreganoProductService\s*,/);
});

test("application service boundary does not require the product service during construction", () => {
    assert.equal(globalThis.window.OreganoProductService, undefined);
    assert.match(source, /services:\s*\{[\s\S]*get products\(\)/);
});

globalThis.window = previousWindow;
