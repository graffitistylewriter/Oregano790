import assert from "node:assert/strict";
import test, { afterEach, beforeEach } from "node:test";

const originalFetch = globalThis.fetch;

globalThis.window = {
    OreganoConfig: {
        api: {
            baseUrl: "http://localhost:3000",
            cataloguePath: "/api/v1/catalogue"
        },
        features: {
            apiBackedCatalogue: true,
            catalogueApiFallback: true
        }
    }
};

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
    globalThis.window.OreganoConfig.features.apiBackedCatalogue = true;
    globalThis.window.OreganoConfig.features.catalogueApiFallback = true;
    delete globalThis.window.oreganoProducts;

    globalThis.fetch = async (url, options = {}) => {
        const requestUrl = new URL(String(url));
        requests.push({ url: requestUrl.toString(), options });

        if (requestUrl.pathname === "/api/v1/catalogue") {
            if (options.method === "POST") {
                return jsonResponse({ product: options.body ? JSON.parse(options.body) : null });
            }

            const id = requestUrl.searchParams.get("id");
            if (id) {
                const product = products.find(item => item.id === id);
                return product
                    ? jsonResponse({ product })
                    : jsonResponse({ error: "Product not found" }, 404);
            }

            return jsonResponse({ products });
        }

        if (requestUrl.pathname.startsWith("/api/v1/catalogue/")) {
            return jsonResponse({ product: products[0] });
        }

        return jsonResponse({ error: "Not found" }, 404);
    };
});

afterEach(() => {
    globalThis.fetch = originalFetch;
    delete globalThis.window.oreganoProducts;
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

test("catalogue reads fall back to the legacy product collection when API mode is disabled", async () => {
    globalThis.window.OreganoConfig.features.apiBackedCatalogue = false;
    globalThis.window.oreganoProducts = products;
    globalThis.fetch = async () => {
        throw new Error("Backend unavailable");
    };

    assert.deepEqual(await service.listProducts(), { products });
    assert.deepEqual(
        await service.fetchCatalogue({ id: "oil-001" }),
        [products[1]]
    );
    assert.equal(requests.length, 0);
});

test("catalogue reads can fall back after an API failure", async () => {
    globalThis.window.oreganoProducts = products;
    globalThis.fetch = async () => {
        throw new Error("Backend unavailable");
    };

    assert.deepEqual(await service.listProducts(), { products });
    assert.equal(requests.length, 0);
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
    globalThis.window.OreganoConfig.features.catalogueApiFallback = false;
    globalThis.fetch = async () => jsonResponse({ error: "Catalogue unavailable" }, 503);

    await assert.rejects(
        () => service.listProducts(),
        /Catalogue unavailable/
    );
});
