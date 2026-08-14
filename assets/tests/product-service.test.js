import assert from "node:assert/strict";
import test, { afterEach, beforeEach } from "node:test";

const originalFetch = globalThis.fetch;

globalThis.window = {};

const products = [
    {
        id: "flower-001",
        sku: "ORE-F-001",
        name: "Oregano Flower",
        description: "Premium flower",
        category: "Indoor Flower",
        type: "Flower",
        price: 790,
        stock: 4
    },
    {
        id: "oil-001",
        sku: "ORE-O-001",
        name: "Oregano Oil",
        description: "Premium oil",
        category: "Extracts",
        type: "Oil",
        price: 1290,
        stock: 3
    }
];

const jsonResponse = (body, status = 200) => ({
    ok: status >= 200 && status < 300,
    status,
    json: async () => body
});

let requests;

beforeEach(() => {
    requests = [];
    globalThis.fetch = async (url, options = {}) => {
        requests.push({ url: String(url), options });

        if (String(url).endsWith("/catalogue")) {
            if (options.method === "POST") {
                return jsonResponse({ product: options.body ? JSON.parse(options.body) : null });
            }

            return jsonResponse({ products });
        }

        if (String(url).includes("/catalogue/")) {
            return jsonResponse({ product: products[0] });
        }

        return jsonResponse({ error: "Not found" }, 404);
    };
});

afterEach(() => {
    globalThis.fetch = originalFetch;
});

const service = await import("../../assets/js/services/product-service.js");


test("listProducts requests the public catalogue", async () => {
    const result = await service.listProducts();

    assert.deepEqual(result.products, products);
    assert.equal(requests.length, 1);
    assert.equal(requests[0].url, "http://localhost:3000/api/v1/catalogue");
    assert.equal(requests[0].options.method, "GET");
});

test("listProducts sends the admin bearer token when supplied", async () => {
    await service.listProducts("test-admin-token");

    assert.equal(
        requests[0].options.headers.Authorization,
        "Bearer test-admin-token"
    );
});

test("fetchCatalogue filters by search, category, and type", async () => {
    assert.deepEqual(
        await service.fetchCatalogue({ search: "flower" }),
        [products[0]]
    );

    assert.deepEqual(
        await service.fetchCatalogue({ category: "indoor flower" }),
        [products[0]]
    );

    assert.deepEqual(
        await service.fetchCatalogue({ type: "oil" }),
        [products[1]]
    );
});

test("fetchCatalogue resolves a single product by id", async () => {
    const result = await service.fetchCatalogue({ id: "flower-001" });

    assert.deepEqual(result, [products[0]]);
    assert.equal(
        requests[0].url,
        "http://localhost:3000/api/v1/catalogue?id=flower-001"
    );
});

test("createProduct sends a JSON POST with authentication", async () => {
    const product = { name: "New Product", price: 990 };

    await service.createProduct("test-admin-token", product);

    assert.equal(requests[0].options.method, "POST");
    assert.equal(
        requests[0].options.headers.Authorization,
        "Bearer test-admin-token"
    );
    assert.equal(
        requests[0].options.headers["Content-Type"],
        "application/json"
    );
    assert.deepEqual(JSON.parse(requests[0].options.body), product);
});

test("updateProduct and deleteProduct use the catalogue resource boundary", async () => {
    await service.updateProduct("test-admin-token", "flower-001", { price: 850 });

    assert.equal(requests[0].options.method, "PUT");
    assert.equal(
        requests[0].url,
        "http://localhost:3000/api/v1/catalogue/flower-001"
    );

    requests.length = 0;

    await service.deleteProduct("test-admin-token", "flower-001");

    assert.equal(requests[0].options.method, "DELETE");
    assert.equal(
        requests[0].url,
        "http://localhost:3000/api/v1/catalogue/flower-001"
    );
});

test("service errors preserve the backend error message", async () => {
    globalThis.fetch = async () => jsonResponse({ error: "Catalogue unavailable" }, 503);

    await assert.rejects(
        () => service.listProducts(),
        /Catalogue unavailable/
    );
});
