/*=========================================================
OREGANO 790
SERVICE ERROR BOUNDARY
DEV-002 SERVICE BOUNDARY
=========================================================*/

const OreganoServiceError = (() => {
    const from = (error, context = {}) => {
        const normalized = error instanceof Error
            ? error
            : new Error(error?.message || "Application service request failed.");

        normalized.service = context.service || normalized.service || "unknown";
        normalized.operation = context.operation || normalized.operation || "unknown";
        normalized.retryable = context.retryable ?? normalized.retryable ?? false;

        return normalized;
    };

    const userMessage = (error, fallback = "We couldn't complete that request. Please try again.") => {
        const normalized = from(error);
        return normalized.userMessage || normalized.message || fallback;
    };

    return Object.freeze({ from, userMessage });
})();

window.OreganoServiceError = OreganoServiceError;
