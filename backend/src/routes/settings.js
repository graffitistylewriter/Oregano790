import { siteSettingsRepository as defaultSiteSettingsRepository } from "../site-settings-repository.js";
import {
    toPublicSiteSettings,
    createSiteSettings
} from "../models/site-settings.js";
import { requireAdmin } from "../auth/admin-auth.js";

const send = (res, status, body) => {
    res.writeHead(status);
    res.end(JSON.stringify(body));
};

const readJsonBody = req => new Promise((resolve, reject) => {
    let raw = "";

    req.on("data", chunk => {
        raw += chunk;

        if (raw.length > 1_000_000) {
            reject(new Error("Request body is too large."));
            req.destroy();
        }
    });

    req.on("end", () => {
        if (!raw.trim()) {
            return resolve({});
        }

        try {
            resolve(JSON.parse(raw));
        } catch {
            reject(new Error("Request body must contain valid JSON."));
        }
    });

    req.on("error", reject);
});

const sendPublicSettings = async (
    res,
    siteSettingsRepository
) => {
    const settings = await siteSettingsRepository.get();

    return send(res, 200, {
        settings: toPublicSiteSettings(settings)
    });
};

export const settingsRoute = async (
    req,
    res,
    { siteSettingsRepository = defaultSiteSettingsRepository } = {}
) => {
    try {
        if (
            req.url !== "/api/v1/settings" &&
            req.url !== "/api/v1/settings/public"
        ) {
            return send(res, 404, {
                error: "Settings route not found"
            });
        }

        /*
         * Public settings endpoint.
         *
         * This is the only unauthenticated settings endpoint.
         * The response always passes through the explicit public
         * projection rather than exposing the repository object.
         */
        if (
            req.url === "/api/v1/settings/public" &&
            req.method === "GET"
        ) {
            return sendPublicSettings(
                res,
                siteSettingsRepository
            );
        }

        /*
         * Everything under the administrative settings endpoint
         * requires the existing Bearer authentication boundary.
         */
        if (!requireAdmin(req, res)) return;

        if (
            req.url === "/api/v1/settings" &&
            req.method === "GET"
        ) {
            return sendPublicSettings(
                res,
                siteSettingsRepository
            );
        }

        if (
            req.url === "/api/v1/settings" &&
            req.method === "PUT"
        ) {
            const settings = await readJsonBody(req);

            const normalized = createSiteSettings(settings);

            const replaced =
                await siteSettingsRepository.replace(normalized);

            return send(res, 200, {
                settings: toPublicSiteSettings(replaced)
            });
        }

        if (
            req.url === "/api/v1/settings" &&
            req.method === "PATCH"
        ) {
            const changes = await readJsonBody(req);

            const updated =
                await siteSettingsRepository.update(changes);

            return send(res, 200, {
                settings: toPublicSiteSettings(updated)
            });
        }

        return send(res, 405, {
            error: "Method not allowed"
        });
    } catch (error) {
        return send(res, 400, {
            error: error.message || "Settings request failed."
        });
    }
};
