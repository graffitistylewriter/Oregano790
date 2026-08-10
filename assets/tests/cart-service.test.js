import assert from "node:assert/strict";
import test from "node:test";

globalThis.window = {};

const products = [
    { id: "dev-001", sku: "ORE-DEV-001", name: "Test Product", price: 100, stock: 2 },
    { id: "dev-002", sku: "ORE-DEV-002", name: "Sold Out", price: 200, stock: 0 }
];

const storage = new Map();
window.localStorage = {
    getItem: key => storage.has(key) ? storage.get(key) : null,
    setItem: (key, value) => storage.set(key, String(value)),
    removeItem: key => storage.delete(key)
};

window.OreganoStorageService = {
    get: (key, fallback = null) => storage.has(`oregano790:${key}`)
        ? JSON.parse(storage.get(`oregano790:${key}`))
        : fallback,
    set: (key, value) => {
        storage.set(`oregano790:${key}`, JSON.stringify(value));
        return true;
    },
    remove: key => {
        storage.delete(`oregano790:${key}`);
        return true;
    }
};

window.OreganoProductService = {
    getProductById: id => products.find(product => String(product.id) === String(id)) || null,
    normalizeProduct: product => product,
    getProducts: () => [...products]
};

await import("../../assets/js/services/cart-service.js");
const OreganoCartService = window.OreganoCartService;

test("cart starts empty", () => {
    OreganoCartService.clear();
    assert.equal(OreganoCartService.getCount(), 0);
    assert.equal(OreganoCartService.getSubtotal(), 0);
});

test("cart adds a product through the product service", async () => {
    OreganoCartService.clear();
    await OreganoCartService.addItem("dev-001");
    assert.equal(OreganoCartService.getCount(), 1);
    assert.equal(OreganoCartService.getSubtotal(), 100);
    assert.equal(OreganoCartService.getItems()[0].product.sku, "ORE-DEV-001");
});

test("cart quantity is constrained by stock", async () => {
    OreganoCartService.clear();
    await OreganoCartService.addItem("dev-001", 10);
    assert.equal(OreganoCartService.getCount(), 2);
    assert.equal(OreganoCartService.getSubtotal(), 200);
});

test("cart rejects sold-out products", async () => {
    OreganoCartService.clear();
    await assert.rejects(() => OreganoCartService.addItem("dev-002"), /sold out/i);
});

test("cart supports quantity updates and removal", async () => {
    OreganoCartService.clear();
    await OreganoCartService.addItem("dev-001", 2);
    await OreganoCartService.updateQuantity("dev-001", 1);
    assert.equal(OreganoCartService.getCount(), 1);
    OreganoCartService.removeItem("dev-001");
    assert.equal(OreganoCartService.getCount(), 0);
});

test("cart persists only product ids and quantities", async () => {
    OreganoCartService.clear();
    await OreganoCartService.addItem("dev-001", 2);
    const saved = JSON.parse(storage.get("oregano790:cart"));
    assert.deepEqual(saved, { version: 1, items: [{ productId: "dev-001", quantity: 2 }] });
});

test("cart restore resolves products again and respects current stock", async () => {
    OreganoCartService.clear();
    storage.set("oregano790:cart", JSON.stringify({
        version: 1,
        items: [
            { productId: "dev-001", quantity: 99 },
            { productId: "dev-002", quantity: 1 },
            { productId: "missing", quantity: 1 }
        ]
    }));
    await OreganoCartService.init();
    assert.equal(OreganoCartService.getCount(), 2);
    assert.equal(OreganoCartService.getItems()[0].product.id, "dev-001");
    assert.equal(OreganoCartService.getItems()[0].quantity, 2);
});
