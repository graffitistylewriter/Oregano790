import { applicationRepository as defaultApplicationRepository } from "../applications-repository.js";
import { requireAdmin } from "../auth/admin-auth.js";

const send = (res, status, body) => {
    res.writeHead(status);
    res.end(JSON.stringify(body));
};

const readJsonBody = req => new Promise((resolve, reject) => {
    let raw = "";
    req.on("data", chunk => {
        raw += chunk;
        if (raw.length > 1_000_000) reject(new Error("Request body is too large."));
    });
    req.on("end", () => {
        if (!raw.trim()) return resolve({});
        try { resolve(JSON.parse(raw)); }
        catch { reject(new Error("Request body must contain valid JSON.")); }
    });
    req.on("error", reject);
});

const getId = req => {
    const match = req.url.match(/^\/api\/v1\/applications\/([^/?]+)/);
    return match ? decodeURIComponent(match[1]) : null;
};

export const applicationsRoute = async (req, res, { applicationRepository = defaultApplicationRepository } = {}) => {
    try {
        const transitionMatch = req.url.match(/^\/api\/v1\/applications\/([^/?]+)\/transition$/);
        const id = getId(req);

        if (req.method === "POST" && !id) {
            const body = await readJsonBody(req);
            if (!body.applicant || typeof body.applicant !== "object") {
                return send(res, 400, { error: "Applicant data is required." });
            }
            const application = await applicationRepository.create({
                id: body.id,
                applicant: body.applicant,
                status: "submitted"
            });
            return send(res, 201, { application });
        }

        if (!requireAdmin(req, res)) return;

        if (req.method === "GET" && !id) {
            return send(res, 200, { applications: await applicationRepository.list() });
        }

        if (req.method === "GET" && id && !transitionMatch) {
            const application = await applicationRepository.getById(id);
            return application ? send(res, 200, { application }) : send(res, 404, { error: "Application not found" });
        }

        if (req.method === "PUT" && id && !transitionMatch) {
            const changes = await readJsonBody(req);
            const application = await applicationRepository.update(id, changes);
            return application ? send(res, 200, { application }) : send(res, 404, { error: "Application not found" });
        }

        if (req.method === "POST" && transitionMatch) {
            const transitionId = decodeURIComponent(transitionMatch[1]);
            const body = await readJsonBody(req);
            if (!body.status) return send(res, 400, { error: "Application status is required." });
            const application = await applicationRepository.transition(transitionId, body.status, {
                paymentDecision: body.paymentDecision
            });
            return application ? send(res, 200, { application }) : send(res, 404, { error: "Application not found" });
        }

        return send(res, 405, { error: "Method not allowed" });
    } catch (error) {
        return send(res, 400, { error: error.message || "Application request failed." });
    }
};
