import { readFile, writeFile, mkdir } from "node:fs/promises";
import { dirname } from "node:path";
import { createApplicationRecord } from "../applications.js";

const cloneApplication = application => ({
    ...application,
    applicant: { ...(application.applicant || {}) }
});

const cloneApplications = applications => applications.map(cloneApplication);

export const APPLICATION_TRANSITIONS = Object.freeze({
    draft: ["submitted"],
    submitted: ["under_review"],
    under_review: ["approved", "denied"],
    approved: ["payment_pending", "active"],
    denied: [],
    payment_pending: ["active"],
    active: []
});

export const createApplicationRepository = ({ seedApplications = [], filePath = null } = {}) => {
    let memoryApplications = cloneApplications(seedApplications);

    const readPersisted = async () => {
        if (!filePath) return null;
        try {
            const raw = await readFile(filePath, "utf8");
            const parsed = JSON.parse(raw);
            return Array.isArray(parsed.applications)
                ? cloneApplications(parsed.applications)
                : null;
        } catch (error) {
            if (error.code === "ENOENT") return null;
            throw error;
        }
    };

    const persist = async applications => {
        if (!filePath) return;
        await mkdir(dirname(filePath), { recursive: true });
        await writeFile(
            filePath,
            JSON.stringify({ applications }, null, 2) + "\n",
            "utf8"
        );
    };

    const list = async () => {
        const persisted = await readPersisted();
        if (persisted) memoryApplications = persisted;
        return cloneApplications(memoryApplications);
    };

    const getById = async id => {
        const applications = await list();
        return applications.find(application => String(application.id) === String(id)) || null;
    };

    const create = async input => {
        const applications = await list();
        const record = createApplicationRecord({
            ...input,
            id: input?.id || `application-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
        });

        if (applications.some(application => String(application.id) === String(record.id))) {
            throw new Error("An application with this id already exists.");
        }

        const created = { ...record };
        applications.push(created);
        await persist(applications);
        memoryApplications = applications;
        return cloneApplication(created);
    };

    const update = async (id, changes = {}) => {
        const applications = await list();
        const index = applications.findIndex(application => String(application.id) === String(id));
        if (index === -1) return null;

        const current = applications[index];
        const updated = createApplicationRecord({
            ...current,
            ...changes,
            id: current.id,
            applicant: changes.applicant === undefined ? current.applicant : changes.applicant,
            createdAt: current.createdAt,
            updatedAt: new Date().toISOString()
        });

        applications[index] = { ...updated };
        await persist(applications);
        memoryApplications = applications;
        return cloneApplication(applications[index]);
    };

    const transition = async (id, status, { paymentDecision } = {}) => {
        const current = await getById(id);
        if (!current) return null;

        const allowed = APPLICATION_TRANSITIONS[current.status] || [];
        if (!allowed.includes(status)) {
            throw new Error(`Invalid application transition: ${current.status} -> ${status}`);
        }

        if (status === "payment_pending" && paymentDecision !== "payment_required") {
            throw new Error("payment_pending requires payment_required.");
        }

        if (status === "active" && current.status === "approved" && paymentDecision !== "payment_waived") {
            throw new Error("Approved applications entering active directly require payment_waived.");
        }

        if (status === "active" && current.status === "payment_pending" && current.paymentDecision !== "payment_required") {
            throw new Error("Payment-pending applications require payment_required.");
        }

        return update(id, {
            status,
            paymentDecision: paymentDecision ?? current.paymentDecision
        });
    };

    return Object.freeze({ list, getById, create, update, transition });
};
