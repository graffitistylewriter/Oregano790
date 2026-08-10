import { products } from "../data/products.js";

export const catalogueRoute = (req, res) => {
    res.writeHead(200);
    res.end(JSON.stringify({ products }));
};
