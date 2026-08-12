import { healthRoute } from "./routes/health.js";
import { catalogueRoute } from "./routes/catalogue.js";
import { catalogueRepository as defaultCatalogueRepository } from "./catalogue.js";

export const createApp = ({ catalogueRepository = defaultCatalogueRepository } = {}) => (req, res) => {
    res.setHeader("Content-Type", "application/json");
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Headers", "Authorization, Content-Type");
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");

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

    res.writeHead(404);
    res.end(JSON.stringify({ error: "Route not found" }));
};

export const app = createApp();
