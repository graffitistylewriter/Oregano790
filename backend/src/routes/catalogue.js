import { catalogueRepository } from "../catalogue.js";
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

const getId = req => new URL(req.url, "http://localhost").searchParams.get("id");

export const catalogueRoute = async (req, res) => {
    try {
        if (req.method === "GET") {
            const id = getId(req);
            if (id) {
                const product = await catalogueRepository.getById(id);
                return product
                    ? send(res, 200, { product })
                    : send(res, 404, { error: "Product not found" });
            }
            return send(res, 200, { products: await catalogueRepository.list() });
        }

        if (!requireAdmin(req, res)) return;

        const match = req.url.match(/^\/api\/v1\/catalogue\/([^/?]+)/);
        const id = match ? decodeURIComponent(match[1]) : null;

        if (req.method === "POST" && !id) {
            const product = await readJsonBody(req);
            if (!product.name || !product.sku) {
                return send(res, 400, { error: "Product name and sku are required." });
            }
            try {
                return send(res, 201, { product: await catalogueRepository.create(product) });
            } catch (error) {
                if (error.message.includes("already exists")) return send(res, 409, { error: error.message });
                throw error;
            }
        }

        if (req.method === "PUT" && id) {
            const changes = await readJsonBody(req);
            const product = await catalogueRepository.update(id, changes);
            return product ? send(res, 200, { product }) : send(res, 404, { error: "Product not found" });
        }

        if (req.method === "DELETE" && id) {
            const product = await catalogueRepository.remove(id);
            return product ? send(res, 200, { product }) : send(res, 404, { error: "Product not found" });
        }

        return send(res, 405, { error: "Method not allowed" });
    } catch (error) {
        return send(res, 400, { error: error.message || "Catalogue request failed." });
    }
};
