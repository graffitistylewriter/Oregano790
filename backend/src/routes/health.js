export const healthRoute = (req, res) => {
    res.writeHead(200);
    res.end(JSON.stringify({
        service: "oregano790-backend",
        status: "ok",
        version: "1.0.0"
    }));
};
