import test from "node:test";
import assert from "node:assert/strict";
import {
    APPLICATION_STATUSES,
    PAYMENT_DECISIONS,
    createApplicationRecord
} from "../src/applications.js";

test("application model exposes the canonical lifecycle", () => {
    assert.deepEqual(APPLICATION_STATUSES, [
        "draft",
        "submitted",
        "under_review",
        "approved",
        "denied",
        "payment_pending",
        "active"
    ]);
});

test("application model exposes explicit payment decisions", () => {
    assert.deepEqual(PAYMENT_DECISIONS, [
        "payment_required",
        "payment_waived"
    ]);
});

test("application records default to draft without a payment decision", () => {
    const application = createApplicationRecord({
        id: "app-001",
        applicant: { name: "Development Applicant" }
    });

    assert.equal(application.id, "app-001");
    assert.equal(application.status, "draft");
    assert.equal(application.paymentDecision, null);
    assert.equal(application.applicant.name, "Development Applicant");
    assert.ok(application.createdAt);
    assert.equal(application.updatedAt, application.createdAt);
});

test("application model rejects invalid status and payment decisions", () => {
    assert.throws(
        () => createApplicationRecord({ status: "unknown" }),
        /Invalid application status/
    );

    assert.throws(
        () => createApplicationRecord({ paymentDecision: "unknown" }),
        /Invalid payment decision/
    );
});
