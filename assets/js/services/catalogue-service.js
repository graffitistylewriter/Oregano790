/*=========================================================
OREGANO 790
CATALOGUE SERVICE
DEV-022C FRONTEND SERVICE BOUNDARY
=========================================================*/

const OreganoCatalogueService = (() => {
    const productService = () => window.OreganoProductService;

    const list = async ({ token = "", filter = "all", search = "" } = {}) => {
        const service = productService();
        if (!service) return [];

        const normalizedFilter = String(filter || "all").trim();
        const params = { token, search };

        if (normalizedFilter !== "all") {
            if (normalizedFilter === "Indoor Flower") {
                params.category = normalizedFilter;
            } else {
                params.type = normalizedFilter;
            }
        }

        return service.fetchCatalogue(params);
    };

    const getById = async (id, token = "") => {
        const service = productService();
        if (!service) return null;

        const products = await service.fetchCatalogue({ token, id });
        return products[0] || null;
    };

    return Object.freeze({ list, getById });
})();

window.OreganoCatalogueService = OreganoCatalogueService;
