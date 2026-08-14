/*=========================================================
OREGANO 790
CATALOGUE SERVICE
DEV-035 FILTER CONTRACT
=========================================================*/

const OreganoCatalogueService = (() => {
    const productService = () => window.OreganoProductService;

    const list = async ({
        token = "",
        filter = "all",
        search = "",
        category = "",
        type = ""
    } = {}) => {
        const service = productService();
        if (!service) return [];

        const normalizedFilter = String(filter || "all").trim();
        const params = { token, search };

        if (category) {
            params.category = category;
        } else if (type) {
            params.type = type;
        } else if (normalizedFilter !== "all") {
            if (normalizedFilter === "Indoor" || normalizedFilter === "Indoor Flower") {
                params.category = "Indoor Flower";
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
