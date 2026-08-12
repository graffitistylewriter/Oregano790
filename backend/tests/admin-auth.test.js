import test from "node:test";
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { app } from "../src/app.js";

const request = (server, options = {}, body = null) => new Promise((resolve, reject) => {
    const req = require("node:http").request({ ...options, port: server.address().port }, res => {
        let raw = "";
        res.on("data", chunk => { raw += chunk; });
        res.on("end", () => resolve({ status: res.statusCode, body: raw ? JSON.parse(raw) : null }));
    });
    req.on("error", reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
});

test("catalogue writes require admin authentication", async () => {
    const previous = process.env.OREGANO_ADMIN_TOKEN;
    process.env.OREGANO_ADMIN_TOKEN = "test-admin-token";
    const server = createServer(app);
    await new Promise(resolve => server.listen(0, resolve));

    try {
        const unauthenticated = await request(server, {
            method: "POST",
            path: "/api/v1/catalogue",
            headers: { "Content-Type": "application/json" }
        }, { name: "Unauthorized Test Product", sku: "AUTH-FAIL" });
        assert.equal(unauthenticated.status, 401);

        const authenticated = await request(server, {
            method: "POST",
            path: "/api/v1/catalogue",
            headers: {
                "Content-Type": "application/json",
                Authorization: "Bearer test-admin-token"
            }
        }, { name: "Authorized Test Product", sku: "AUTH-PASS" });
        assert.equal(authenticated.status, 201);
        assert.equal(authenticated.body.product.sku, "AUTH-PASS");

        const publicRead = await request(server, { method: "GET", path: "/api/v1/catalogue" });
        assert.equal(publicRead.status, 200);
    } finally {
        await new Promise(resolve => server.close(resolve));
        if (previous === undefined) delete process.env.OREGANO_ADMIN_TOKEN;
        else process.env.OREGANO_ADMIN_TOKEN = previous;
    }
});
