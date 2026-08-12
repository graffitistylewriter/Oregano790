import assert from "node:assert/strict";
import { createServer } from "node:http";
import test, { after, before } from "node:test";
import { app } from "../src/app.js";
import { catalogueRepository } from "../src/catalogue.js";

const server = createServer(app);
let baseUrl;

before(async () => {
    await catalogueRepository.replaceAll([
        {
            id: "test-001",
            name: "Test Strain",
            sku: "TEST-001",
            type: "Hybrid",
            category: "Indoor Flower",
            description: "Test product",
            price: 100,
            stock: 5,
            featured: false
        }
    ]);
    await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
    baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
    server.close();
});

test("GET catalogue returns products", async () => {
    const response = await fetch(`${baseUrl}/api/v1/catalogue`);
    assert.equal(response.status, 200);
    const body = await response.json();
    assert.equal(body.products.length, 1);
    assert.equal(body.products[0].id, "test-001");
});

test("GET catalogue by id returns one product", async () => {
    const response = await fetch(`${baseUrl}/api/v1/catalogue?id=test-001`);
    assert.equal(response.status, 200);
    const body = await response.json();
    assert.equal(body.product.sku, "TEST-001");
});

test("POST catalogue creates a product", async () => {
    const response = await fetch(`${baseUrl}/api/v1/catalogue`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: "test-002", name: "New Strain", sku: "TEST-002", price: 200, stock: 3 })
    });
    assert.equal(response.status, 201);
    const body = await response.json();
    assert.equal(body.product.id, "test-002");
});

test("PUT catalogue updates a product", async () => {
    const response = await fetch(`${baseUrl}/api/v1/catalogue/test-002`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ price: 250, stock: 7 })
    });
    assert.equal(response.status, 200);
    const body = await response.json();
    assert.equal(body.product.price, 250);
    assert.equal(body.product.stock, 7);
});

test("DELETE catalogue removes a product", async () => {
    const response = await fetch(`${baseUrl}/api/v1/catalogue/test-002`, { method: "DELETE" });
    assert.equal(response.status, 200);
    const body = await response.json();
    assert.equal(body.product.id, "test-002");

    const missing = await fetch(`${baseUrl}/api/v1/catalogue?id=test-002`);
    assert.equal(missing.status, 404);
});
