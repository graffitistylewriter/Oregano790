import assert from "node:assert/strict";
import test from "node:test";

const {
    getFilterParams,
    getCatalogueQuery,
    shouldApplyCatalogueResponse,
    createProductCardMarkup,
    renderProducts
} = await import("../js/ui/catalogue-ui.js");

test("catalogue UI maps All to no backend filter", () => {
    assert.deepEqual(getFilterParams("All"), {});
    assert.deepEqual(getFilterParams(""), {});
});

test("catalogue UI maps Indoor to the canonical category", () => {
    assert.deepEqual(getFilterParams("Indoor"), { category: "Indoor Flower" });
});

test("catalogue UI maps other chips to product type", () => {
    assert.deepEqual(getFilterParams("Oil"), { type: "Oil" });
});

test("catalogue query preserves filter and trimmed search state", () => {
    assert.deepEqual(getCatalogueQuery("Indoor", "  haze  "), {
        category: "Indoor Flower",
        search: "haze"
    });
});

test("stale catalogue responses are rejected", () => {
    assert.equal(shouldApplyCatalogueResponse(1, 2), false);
    assert.equal(shouldApplyCatalogueResponse(2, 2), true);
});

test("product card markup escapes product-controlled values", () => {
    const markup = createProductCardMarkup({
        id: "<script>",
        name: "<img src=x onerror=alert(1)>",
        description: "\"quoted\" & unsafe",
        image: "https://example.test/image.jpg",
        type: "Flower",
        price: 100
    });

    assert.equal(markup.includes("<img src=x onerror=alert(1)>"), false);
    assert.equal(markup.includes("&lt;img src=x onerror=alert(1)&gt;"), true);
    assert.equal(markup.includes("&quot;quoted&quot; &amp; unsafe"), true);
});

test("renderProducts renders an empty state for an empty collection", () => {
    const grid = { innerHTML: "" };
    renderProducts(grid, []);

    assert.match(grid.innerHTML, /No products found/);
    assert.match(grid.innerHTML, /Try another catalogue filter/);
});

test("renderProducts renders every returned product", () => {
    const grid = { innerHTML: "" };
    renderProducts(grid, [
        { id: "one", name: "One", price: 100 },
        { id: "two", name: "Two", price: 200 }
    ]);

    assert.match(grid.innerHTML, /data-product-id="one"/);
    assert.match(grid.innerHTML, /data-product-id="two"/);
    assert.equal((grid.innerHTML.match(/class="product-card"/g) || []).length, 2);
});
