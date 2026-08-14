/*=========================================================
OREGANO 790
CATALOGUE UI
DEV-040 PRESENTATION-SAFE CATALOGUE FALLBACK
=========================================================*/

const escapeHtml = value => String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

export const getFilterParams = filter => {
    const normalized = String(filter || "All").trim();

    if (!normalized || normalized === "All") return {};
    if (normalized === "Indoor") return { category: "Indoor Flower" };
    return { type: normalized };
};

export const getCatalogueQuery = (filter = "All", search = "") => ({
    ...getFilterParams(filter),
    search: String(search || "").trim()
});

export const shouldApplyCatalogueResponse = (requestId, latestRequestId) =>
    requestId === latestRequestId;

export const shouldLoadCatalogue = features =>
    features?.apiBackedCatalogue === true || features?.catalogueApiFallback === true;

export const createProductCardMarkup = (product, index = 0) => {
    const imageSource = typeof product?.image === "string"
        ? product.image
        : typeof product?.image?.src === "string"
            ? product.image.src
            : "assets/images/product-placeholder.svg";

    const imageAlt = typeof product?.image === "object" && typeof product.image?.alt === "string"
        ? product.image.alt
        : product?.name || "Catalogue product";

    const price = Number(product?.price);
    const priceLabel = Number.isFinite(price)
        ? `R${price.toLocaleString("en-ZA")}`
        : "Price on request";

    const meta = [
        product?.thc ? `THC ${product.thc}` : "",
        product?.cbd ? `CBD ${product.cbd}` : "",
        product?.type || ""
    ].filter(Boolean);

    return `
        <div class="catalogue-item${index === 0 ? " large" : ""}">
            <article class="product-card" data-product-id="${escapeHtml(product?.id)}">
                <div class="product-image">
                    <img src="${escapeHtml(imageSource)}" alt="${escapeHtml(imageAlt)}">
                    <div class="product-overlay">
                        <button class="quick-view" type="button" data-product-id="${escapeHtml(product?.id)}">
                            Quick View
                        </button>
                    </div>
                    ${product?.featured ? "<span class=\"product-badge\">Featured</span>" : ""}
                </div>
                <div class="product-body">
                    <div class="product-header">
                        <h3>${escapeHtml(product?.name || "Unnamed product")}</h3>
                        <span class="product-rating">★★★★★</span>
                    </div>
                    <div class="product-meta">
                        ${meta.map(value => `<span>${escapeHtml(value)}</span>`).join("")}
                    </div>
                    <p>${escapeHtml(product?.description || "Premium product selected for the Oregano790 catalogue.")}</p>
                    <div class="product-footer">
                        <div class="product-price">${escapeHtml(priceLabel)}</div>
                        <button class="add-cart" type="button" data-product-id="${escapeHtml(product?.id)}">
                            Add to Cart
                        </button>
                    </div>
                </div>
            </article>
        </div>`;
};

export const renderProducts = (grid, products) => {
    if (!grid) return;

    const safeProducts = Array.isArray(products) ? products : [];

    if (!safeProducts.length) {
        grid.innerHTML = `
            <div class="catalogue-empty">
                <h3>No products found</h3>
                <p>Try another catalogue filter.</p>
            </div>`;
        return;
    }

    grid.innerHTML = safeProducts
        .map((product, index) => createProductCardMarkup(product, index))
        .join("");
};

const getConfig = () => window.OreganoConfig?.features || {};
const getCatalogueService = () => window.OreganoCatalogueService;

const init = () => {
    if (typeof window === "undefined" || typeof document === "undefined") return;

    const grid = document.querySelector(".catalogue-grid");
    const toolbar = document.querySelector(".catalogue-toolbar");
    const resultLabel = toolbar?.querySelector(".catalogue-results");
    const searchInput = toolbar?.querySelector(".catalogue-search")
        || toolbar?.querySelector('input[type="search"]');
    const chips = [...document.querySelectorAll(".filter-chip")];
    const service = getCatalogueService();

    if (!grid || !service) return;

    let activeFilter = "All";
    let activeSearch = "";
    let latestRequestId = 0;
    let searchTimer = null;

    const updateResultLabel = count => {
        if (resultLabel) {
            resultLabel.textContent = `${count} Premium ${count === 1 ? "Strain" : "Strains"} Available`;
        }
    };

    const setLoading = isLoading => {
        grid.setAttribute("aria-busy", String(isLoading));
        grid.classList.toggle("catalogue-loading", isLoading);
    };

    const load = async () => {
        const requestId = ++latestRequestId;
        setLoading(true);

        try {
            const products = await service.list(getCatalogueQuery(activeFilter, activeSearch));
            if (!shouldApplyCatalogueResponse(requestId, latestRequestId)) return;

            const safeProducts = Array.isArray(products) ? products : [];
            renderProducts(grid, safeProducts);
            updateResultLabel(safeProducts.length);
        } catch (error) {
            if (!shouldApplyCatalogueResponse(requestId, latestRequestId)) return;
            console.warn("OREGANO 790 — API catalogue unavailable; preserving static catalogue.", error);
        } finally {
            if (shouldApplyCatalogueResponse(requestId, latestRequestId)) {
                setLoading(false);
            }
        }
    };

    chips.forEach(chip => {
        chip.addEventListener("click", () => {
            chips.forEach(item => item.classList.remove("active"));
            chip.classList.add("active");
            activeFilter = chip.textContent.trim() || "All";
            load();
        });
    });

    if (searchInput) {
        searchInput.addEventListener("input", () => {
            activeSearch = searchInput.value || "";
            clearTimeout(searchTimer);
            searchTimer = setTimeout(load, 180);
        });
    }

    if (shouldLoadCatalogue(getConfig())) load();
};

const OreganoCatalogueUI = Object.freeze({ init });

if (typeof window !== "undefined") {
    window.OreganoCatalogueUI = OreganoCatalogueUI;
}
