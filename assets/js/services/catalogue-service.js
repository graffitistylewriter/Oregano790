/*=========================================================
OREGANO 790
CATALOGUE SERVICE
DEV-007 PRODUCT DETAIL BOUNDARY
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

/**
 * Canonical index.html currently loads the catalogue service directly
 * rather than loading every UI module as an individual script tag.
 * Keep the product-detail UI module behind this existing boundary so
 * DEV-007 works without creating a second product-data path.
 */
(() => {
    const loadProductModal = () => {
        if (window.OreganoProductModal) {
            window.OreganoProductModal.init();
            return;
        }

        if (document.querySelector('script[data-oregano-product-modal="true"]')) return;

        const script = document.createElement("script");
        script.src = "assets/js/ui/product-modal.js";
        script.dataset.oreganoProductModal = "true";
        script.onload = () => window.OreganoProductModal?.init();
        script.onerror = () => console.error("OREGANO 790 — Product modal module failed to load.");
        document.head.appendChild(script);
    };

    if (typeof document === "undefined") return;

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", loadProductModal, { once: true });
    } else {
        loadProductModal();
    }
})();
