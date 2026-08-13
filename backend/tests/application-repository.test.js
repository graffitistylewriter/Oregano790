import test from "node:test";
import assert from "node:assert/strict";
import { createApplicationRepository } from "../src/repositories/application-repository.js";

test("application repository rejects invalid lifecycle transitions", async () => {
    const repository = createApplicationRepository({
        seedApplications: [{
            id: "transition-test-001",
            applicant: { name: "Transition Test" },
            status: "submitted",
            paymentDecision: null,
            createdAt: "2026-01-01T00:00:00.000Z",
            updatedAt: "2026-01-01T00:00:00.000Z"
        }]
    });

    await assert.rejects(
        () => repository.transition("transition-test-001", "active"),
        /Invalid application transition: submitted -> active/
    );
});

test("application repository requires payment decision for payment_pending", async () => {
    const repository = createApplicationRepository({
        seedApplications: [{
            id: "transition-test-002",
            applicant: { name: "Payment Test" },
            status: "approved",
            paymentDecision: null,
            createdAt: "2026-01-01T00:00:00.000Z",
            updatedAt: "2026-01-01T00:00:00.000Z"
        }]
    });

    await assert.rejects(
        () => repository.transition("transition-test-002", "payment_pending"),
        /payment_pending requires payment_required/
    );
});

test("application repository requires payment_waived for direct approved-to-active", async () => {
    const repository = createApplicationRepository({
        seedApplications: [{
            id: "transition-test-003",
            applicant: { name: "Waiver Test" },
            status: "approved",
            paymentDecision: null,
            createdAt: "2026-01-01T00:00:00.000Z",
            updatedAt: "2026-01-01T00:00:00.000Z"
        }]
    });

    await assert.rejects(
        () => repository.transition("transition-test-003", "active"),
        /Approved applications entering active directly require payment_waived/
    );
});

test("application repository allows approved-to-active with payment waived", async () => {
    const repository = createApplicationRepository({
        seedApplications: [{
            id: "transition-test-004",
            applicant: { name: "Waived Test" },
            status: "approved",
            paymentDecision: null,
            createdAt: "2026-01-01T00:00:00.000Z",
            updatedAt: "2026-01-01T00:00:00.000Z"
        }]
    });

    const application = await repository.transition(
        "transition-test-004",
        "active",
        { paymentDecision: "payment_waived" }
    );

    assert.equal(application.status, "active");
    assert.equal(application.paymentDecision, "payment_waived");
});

test("application repository allows payment-pending applications to become active", async () => {
    const repository = createApplicationRepository({
        seedApplications: [{
            id: "transition-test-005",
            applicant: { name: "Payment Required Test" },
            status: "payment_pending",
            paymentDecision: "payment_required",
            createdAt: "2026-01-01T00:00:00.000Z",
            updatedAt: "2026-01-01T00:00:00.000Z"
        }]
    });

    const application = await repository.transition(
        "transition-test-005",
        "active"
    );

    assert.equal(application.status, "active");
    assert.equal(application.paymentDecision, "payment_required");
});
