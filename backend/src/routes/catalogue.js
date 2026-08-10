import { catalogueRepository } from "../catalogue.js";

export const catalogueRoute = async (req, res) => {
    const products = await catalogueRepository.list();

    res.writeHead(200);
    res.end(JSON.stringify({ products }));
};
