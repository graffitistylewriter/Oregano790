import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";

const source = readFileSync(new URL("../js/ui/catalogue-ui.js", import.meta.url), "utf8");

const { getFilterParams, getCatalogueQuery, shouldApplyCatalogueResponse, shouldLoadCatalogue, createProductCardMarkup, renderProducts } =
    await import("../js/ui/catalogue-ui.js");

test("catalogue UI maps All to no backend filter", () => {
    assert.deepEqual(getFilterParams("All"), {});
});

test("catalogue UI maps Indoor to the canonical category", () => {
    assert.deepEqual(getFilterParams("Indoor"), { category: "Indoor Flower" });
});

test("catalogue UI maps other chips to product type", () => {
    assert.deepEqual(getFilterParams("Hybrid"), { type: "Hybrid" });
});

test("catalogue query preserves filter and trimmed search state", () => {
    assert.deepEqual(getCatalogueQuery("Indoor", "  sample  "), {
        category: "Indoor Flower",
        search: "sample"
    });
});

test("stale catalogue responses are rejected", () => {
    assert.equal(shouldApplyCatalogueResponse(1, 2), false);
    assert.equal(shouldApplyCatalogueResponse(2, 2), true);
});

test("catalogue UI loads when either API mode or fallback mode is enabled", () => {
    assert.equal(shouldLoadCatalogue({ apiBackedCatalogue: true, catalogueApiFallback: false }), true);
    assert.equal(shouldLoadCatalogue({ apiBackedCatalogue: false, catalogueApiFallback: true }), true);
    assert.equal(shouldLoadCatalogue({ apiBackedCatalogue: false, catalogueApiFallback: false }), false);
});

test("catalogue UI source keeps the presentation fallback path enabled", () => {
    assert.match(source, /catalogueApiFallback/);
    assert.match(source, /shouldLoadCatalogue\(getConfig\(\)\) load\(\)/);
});

test("product card markup escapes product-controlled values", () => {
    const markup = createProductCardMarkup({
        id: "<script>",
        name: "<img src=x onerror=alert(1)>",
        description: "\"quoted\" & unsafe",
        image: "https://example.test/?x=\"unsafe\"",
        type: "Hybrid",
        thc: "20%",
        cbd: "1%",
        price: 1234
    });

    assert.doesNotMatch(markup, /<script>/);
    assert.doesNotMatch(markup, /<img src=x/);
    assert.match(markup, /&lt;img src=x onerror=alert\(1\)&gt;/);
    assert.match(markup, /R1,234/);
});

test("renderProducts renders an empty state for an empty collection", () => {
    const grid = { innerHTML: "" };
    renderProducts(grid, []);
    assert.match(grid.innerHTML, /No products found/);
});

test("renderProducts renders every returned product", () => {
    const grid = { innerHTML: "" };
    renderProducts(grid, [
        { id: "a", name: "Alpha" },
        { id: "b", name: "Beta" }
    ]);

    assert.match(grid.innerHTML, /Alpha/);
    assert.match(grid.innerHTML, /Beta/);
});
