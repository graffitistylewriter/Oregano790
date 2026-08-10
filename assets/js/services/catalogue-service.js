/*=========================================================
OREGANO 790
CATALOGUE SERVICE
DEV-005 FILTER BOUNDARY
=========================================================*/

const OreganoCatalogueService = (() => {
    const productService = () => window.OreganoProductService;

    const list = async ({ filter = "all", search = "" } = {}) => {
        const service = productService();
        if (!service) return [];

        const normalizedFilter = String(filter || "all").trim();
        const params = { search };

        if (normalizedFilter !== "all") {
            if (normalizedFilter === "Indoor Flower") {
                params.category = normalizedFilter;
            } else {
                params.type = normalizedFilter;
            }
        }

        return service.fetchCatalogue(params);
    };

    const getById = async (id) => {
        const service = productService();
        if (!service) return null;

        const products = await service.fetchCatalogue({ id });
        return products[0] || null;
    };

    return Object.freeze({ list, getById });
})();

window.OreganoCatalogueService = OreganoCatalogueService;
