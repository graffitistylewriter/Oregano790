import assert from "node:assert/strict";
import { createServer } from "node:http";
import test, { after, before } from "node:test";
import { createApp } from "../src/app.js";
import { createApplicationRepository } from "../src/repositories/application-repository.js";

const ADMIN_TOKEN = "test-admin-token";
process.env.OREGANO_ADMIN_TOKEN = ADMIN_TOKEN;

const applicationRepository = createApplicationRepository();
const server = createServer(createApp({ applicationRepository }));
let baseUrl;

const adminHeaders = {
    Authorization: `Bearer ${ADMIN_TOKEN}`,
    "Content-Type": "application/json"
};

before(async () => {
    await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
    baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(() => server.close());

test("POST application creates a submitted application", async () => {
    const response = await fetch(`${baseUrl}/api/v1/applications`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            id: "application-test-001",
            applicant: { name: "Test Applicant", email: "test@example.com" }
        })
    });
    assert.equal(response.status, 201);
    const body = await response.json();
    assert.equal(body.application.id, "application-test-001");
    assert.equal(body.application.status, "submitted");
});

test("admin can list and retrieve applications", async () => {
    const listResponse = await fetch(`${baseUrl}/api/v1/applications`, { headers: adminHeaders });
    assert.equal(listResponse.status, 200);
    const listBody = await listResponse.json();
    assert.equal(listBody.applications.length, 1);

    const getResponse = await fetch(`${baseUrl}/api/v1/applications/application-test-001`, { headers: adminHeaders });
    assert.equal(getResponse.status, 200);
    const getBody = await getResponse.json();
    assert.equal(getBody.application.applicant.name, "Test Applicant");
});

test("application lifecycle transition enforces payment decision", async () => {
    const reviewResponse = await fetch(`${baseUrl}/api/v1/applications/application-test-001/transition`, {
        method: "POST",
        headers: adminHeaders,
        body: JSON.stringify({ status: "under_review" })
    });
    assert.equal(reviewResponse.status, 200);

    const approvedResponse = await fetch(`${baseUrl}/api/v1/applications/application-test-001/transition`, {
        method: "POST",
        headers: adminHeaders,
        body: JSON.stringify({ status: "approved" })
    });
    assert.equal(approvedResponse.status, 200);

    const pendingResponse = await fetch(`${baseUrl}/api/v1/applications/application-test-001/transition`, {
        method: "POST",
        headers: adminHeaders,
        body: JSON.stringify({ status: "payment_pending", paymentDecision: "payment_required" })
    });
    assert.equal(pendingResponse.status, 200);

    const activeResponse = await fetch(`${baseUrl}/api/v1/applications/application-test-001/transition`, {
        method: "POST",
        headers: adminHeaders,
        body: JSON.stringify({ status: "active" })
    });
    assert.equal(activeResponse.status, 200);
});

test("application admin reads require authentication", async () => {
    const response = await fetch(`${baseUrl}/api/v1/applications`);
    assert.equal(response.status, 401);
});
