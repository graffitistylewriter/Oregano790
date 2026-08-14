import assert from "node:assert/strict";
import test, { beforeEach } from "node:test";

const products = [
    {
        id: "flower-001",
        category: "Indoor Flower",
        type: "Flower",
        name: "Oregano Flower"
    },
    {
        id: "oil-001",
        category: "Extracts",
        type: "Oil",
        name: "Oregano Oil"
    }
];

const calls = [];

globalThis.window = {
    OreganoProductService: {
        fetchCatalogue: async params => {
            calls.push({ ...params });

            return products.filter(product => {
                if (params.id) return product.id === params.id;
                if (params.category) return product.category.toLowerCase() === params.category.toLowerCase();
                if (params.type) return product.type.toLowerCase() === params.type.toLowerCase();
                return true;
            });
        }
    }
};

await import("../js/services/catalogue-service.js");

beforeEach(() => calls.length = 0);

test("catalogue list defaults to the complete catalogue", async () => {
    const result = await window.OreganoCatalogueService.list();

    assert.deepEqual(result, products);
    assert.deepEqual(calls[0], { token: "", search: "" });
});

test("catalogue list translates Indoor into the canonical category", async () => {
    const result = await window.OreganoCatalogueService.list({ filter: "Indoor" });

    assert.deepEqual(result, [products[0]]);
    assert.equal(calls[0].category, "Indoor Flower");
    assert.equal(calls[0].type, undefined);
});

test("catalogue list accepts an explicit category", async () => {
    const result = await window.OreganoCatalogueService.list({ category: "Extracts" });

    assert.deepEqual(result, [products[1]]);
    assert.equal(calls[0].category, "Extracts");
});

test("catalogue list accepts an explicit type", async () => {
    const result = await window.OreganoCatalogueService.list({ type: "Oil" });

    assert.deepEqual(result, [products[1]]);
    assert.equal(calls[0].type, "Oil");
});

test("catalogue list preserves search while applying a filter", async () => {
    await window.OreganoCatalogueService.list({
        filter: "Oil",
        search: "oregano"
    });

    assert.equal(calls[0].search, "oregano");
    assert.equal(calls[0].type, "Oil");
});

test("catalogue getById resolves the first matching product", async () => {
    const result = await window.OreganoCatalogueService.getById("oil-001");

    assert.deepEqual(result, products[1]);
    assert.equal(calls[0].id, "oil-001");
});
