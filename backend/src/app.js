import { healthRoute } from "./routes/health.js";
import { catalogueRoute } from "./routes/catalogue.js";

export const app = (req, res) => {
    res.setHeader("Content-Type", "application/json");

    if (req.method === "GET" && req.url === "/api/v1/health") {
        return healthRoute(req, res);
    }

    if (req.method === "GET" && req.url.startsWith("/api/v1/catalogue")) {
        return catalogueRoute(req, res);
    }

    res.writeHead(404);
    res.end(JSON.stringify({ error: "Route not found" }));
};
