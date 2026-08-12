export const APPLICATION_STATUSES = Object.freeze([
    "draft",
    "submitted",
    "under_review",
    "approved",
    "denied",
    "payment_pending",
    "active"
]);

export const PAYMENT_DECISIONS = Object.freeze([
    "payment_required",
    "payment_waived"
]);

export const createApplicationRecord = ({
    id,
    applicant = {},
    status = "draft",
    paymentDecision = null,
    createdAt = new Date().toISOString(),
    updatedAt = createdAt
} = {}) => {
    if (status !== "draft" && !APPLICATION_STATUSES.includes(status)) {
        throw new TypeError(`Invalid application status: ${status}`);
    }

    if (paymentDecision !== null && !PAYMENT_DECISIONS.includes(paymentDecision)) {
        throw new TypeError(`Invalid payment decision: ${paymentDecision}`);
    }

    return Object.freeze({
        id: id ?? null,
        applicant: { ...applicant },
        status,
        paymentDecision,
        createdAt,
        updatedAt
    });
};
