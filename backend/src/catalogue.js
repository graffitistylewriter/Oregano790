import { products } from "./data/products.js";
import { createCatalogueRepository } from "./repositories/catalogue-repository.js";

export const catalogueRepository = createCatalogueRepository({
    seedProducts: products
});
