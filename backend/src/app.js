import { healthRoute } from "./routes/health.js";
import { catalogueRoute } from "./routes/catalogue.js";
import { applicationsRoute } from "./routes/applications.js";
import { settingsRoute } from "./routes/settings.js";
import { catalogueRepository as defaultCatalogueRepository } from "./catalogue.js";
import { applicationRepository as defaultApplicationRepository } from "./applications-repository.js";
import { siteSettingsRepository as defaultSiteSettingsRepository } from "./site-settings-repository.js";

export const createApp = ({
    catalogueRepository = defaultCatalogueRepository,
    applicationRepository = defaultApplicationRepository,
    siteSettingsRepository = defaultSiteSettingsRepository
} = {}) => (req, res) => {
    res.setHeader("Content-Type", "application/json");
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Headers", "Authorization, Content-Type");
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");

    if (req.method === "OPTIONS") {
        res.writeHead(204);
        return res.end();
    }

    if (req.method === "GET" && req.url === "/api/v1/health") {
        return healthRoute(req, res);
    }

    if (req.url.startsWith("/api/v1/catalogue")) {
        return catalogueRoute(req, res, { catalogueRepository });
    }

    if (req.url.startsWith("/api/v1/applications")) {
        return applicationsRoute(req, res, { applicationRepository });
    }

    if (req.url.startsWith("/api/v1/settings")) {
        return settingsRoute(req, res, { siteSettingsRepository });
    }

    res.writeHead(404);
    res.end(JSON.stringify({ error: "Route not found" }));
};

export const app = createApp();
