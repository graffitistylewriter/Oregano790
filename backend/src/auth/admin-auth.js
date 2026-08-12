import { timingSafeEqual } from "node:crypto";

const getConfiguredToken = () => String(process.env.OREGANO_ADMIN_TOKEN || "").trim();

const getBearerToken = req => {
    const header = String(req.headers?.authorization || "");
    const match = header.match(/^Bearer\s+(.+)$/i);
    return match ? match[1].trim() : "";
};

export const isAdminAuthenticated = req => {
    const expected = getConfiguredToken();
    const supplied = getBearerToken(req);

    if (!expected || !supplied) return false;

    const expectedBuffer = Buffer.from(expected, "utf8");
    const suppliedBuffer = Buffer.from(supplied, "utf8");
    if (expectedBuffer.length !== suppliedBuffer.length) return false;

    return timingSafeEqual(expectedBuffer, suppliedBuffer);
};

export const requireAdmin = (req, res) => {
    if (isAdminAuthenticated(req)) return true;

    res.writeHead(401, {
        "Content-Type": "application/json",
        "WWW-Authenticate": "Bearer"
    });
    res.end(JSON.stringify({
        error: "Admin authentication required."
    }));
    return false;
};
