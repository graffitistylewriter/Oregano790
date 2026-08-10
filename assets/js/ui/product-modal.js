/*=========================================================
OREGANO 790
PRODUCT MODAL UI
DEV-007 PRODUCT MODAL
=========================================================*/

const OreganoProductModal = (() => {
    const catalogueService = () => window.OreganoCatalogueService;
    const productService = () => window.OreganoProductService;

    let modal = null;
    let previousFocus = null;
    let bound = false;

    const escapeHtml = (value) => String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");

    const formatPrice = (value) => {
        const price = Number(value);
        return Number.isFinite(price) ? `R${price.toLocaleString("en-ZA")}` : "Price on request";
    };

    const injectStyles = () => {
        if (document.getElementById("oreganoProductModalStyles")) return;
        const style = document.createElement("style");
        style.id = "oreganoProductModalStyles";
        style.textContent = `
            .oregano-product-modal[hidden] { display: none; }
            .oregano-product-modal { position: fixed; inset: 0; z-index: 10000; display: grid; place-items: center; padding: 24px; background: rgba(0,0,0,.78); backdrop-filter: blur(10px); }
            .oregano-product-modal__dialog { position: relative; width: min(980px, 100%); max-height: min(820px, calc(100vh - 48px)); overflow: auto; display: grid; grid-template-columns: minmax(280px, .9fr) minmax(320px, 1.1fr); background: #171717; color: #fff; border: 1px solid rgba(255,255,255,.10); border-radius: 28px; box-shadow: 0 40px 120px rgba(0,0,0,.55); }
            .oregano-product-modal__image { min-height: 420px; background: #222; }
            .oregano-product-modal__image img { width: 100%; height: 100%; min-height: 420px; display: block; object-fit: cover; filter: grayscale(100%); }
            .oregano-product-modal__content { padding: clamp(28px, 5vw, 56px); display: flex; flex-direction: column; justify-content: center; }
            .oregano-product-modal__eyebrow { margin-bottom: 12px; color: #aeb69f; font-size: .72rem; font-weight: 700; letter-spacing: .16em; text-transform: uppercase; }
            .oregano-product-modal__title { margin: 0 52px 18px 0; font-family: "Cormorant Garamond", serif; font-size: clamp(2.6rem, 5vw, 4.5rem); line-height: .95; }
            .oregano-product-modal__meta { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 24px; }
            .oregano-product-modal__meta span { padding: 7px 11px; border: 1px solid rgba(255,255,255,.10); border-radius: 999px; font-size: .72rem; letter-spacing: .06em; }
            .oregano-product-modal__description { margin-bottom: 28px; color: rgba(255,255,255,.76); line-height: 1.85; }
            .oregano-product-modal__details { display: grid; grid-template-columns: repeat(2, minmax(0,1fr)); gap: 12px; margin-bottom: 30px; }
            .oregano-product-modal__detail { padding: 14px 16px; border-radius: 14px; background: rgba(255,255,255,.045); border: 1px solid rgba(255,255,255,.06); }
            .oregano-product-modal__detail small { display: block; margin-bottom: 5px; opacity: .55; font-size: .66rem; letter-spacing: .10em; text-transform: uppercase; }
            .oregano-product-modal__detail strong { font-size: .95rem; }
            .oregano-product-modal__price { margin-bottom: 20px; color: #aeb69f; font-size: 2rem; font-weight: 700; }
            .oregano-product-modal__close { position: absolute; top: 18px; right: 18px; z-index: 2; width: 42px; height: 42px; border: 1px solid rgba(255,255,255,.16); border-radius: 50%; background: rgba(0,0,0,.45); color: #fff; font-size: 1.3rem; cursor: pointer; }
            .oregano-product-modal__close:hover, .oregano-product-modal__close:focus-visible { background: #59624c; }
            body.oregano-modal-open { overflow: hidden; }
            @media (max-width: 760px) { .oregano-product-modal { padding: 12px; } .oregano-product-modal__dialog { grid-template-columns: 1fr; max-height: calc(100vh - 24px); } .oregano-product-modal__image, .oregano-product-modal__image img { min-height: 260px; height: 260px; } .oregano-product-modal__content { padding: 28px 22px 32px; } .oregano-product-modal__details { grid-template-columns: 1fr 1fr; } }
        `;
        document.head.appendChild(style);
    };

    const ensureModal = () => {
        if (modal) return modal;
        injectStyles();
        modal = document.createElement("div");
        modal.className = "oregano-product-modal";
        modal.hidden = true;
        modal.setAttribute("aria-hidden", "true");
        modal.innerHTML = `
            <div class="oregano-product-modal__dialog" role="dialog" aria-modal="true" aria-labelledby="oreganoProductModalTitle">
                <button class="oregano-product-modal__close" type="button" aria-label="Close product details">×</button>
                <div class="oregano-product-modal__image"></div>
                <div class="oregano-product-modal__content"></div>
            </div>`;
        document.body.appendChild(modal);
        modal.addEventListener("click", event => { if (event.target === modal || event.target.closest(".oregano-product-modal__close")) close(); });
        if (!bound) {
            bound = true;
            document.addEventListener("keydown", event => {
                if (!modal || modal.hidden) return;
                if (event.key === "Escape") { event.preventDefault(); close(); return; }
                if (event.key !== "Tab") return;
                const focusables = [...modal.querySelectorAll("button, [href], input, select, textarea, [tabindex]:not([tabindex='-1'])")].filter(element => !element.disabled && element.offsetParent !== null);
                if (!focusables.length) return;
                const first = focusables[0]; const last = focusables[focusables.length - 1];
                if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
                else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
            });
        }
        return modal;
    };

    const findProduct = async (card) => {
        const productId = card?.querySelector(".quick-view")?.dataset?.productId;
        const service = catalogueService();
        if (productId && service?.getById) return service.getById(productId);
        const name = card?.querySelector("h3")?.textContent?.trim();
        if (!name) return null;
        if (service) {
            const matches = await service.list({ search: name });
            return matches.find(product => String(product.name).trim().toLowerCase() === name.toLowerCase()) || matches[0] || null;
        }
        const fallback = productService();
        return fallback?.getProductById(productId) || fallback?.getProducts().find(product => String(product.name).trim().toLowerCase() === name.toLowerCase()) || null;
    };

    const renderProduct = product => {
        const target = ensureModal();
        const image = target.querySelector(".oregano-product-modal__image");
        const content = target.querySelector(".oregano-product-modal__content");
        const stock = Number(product.stock) > 0 ? `${product.stock} available` : "Sold Out";
        const imageSource = typeof product.image === "string" ? product.image : typeof product.image?.src === "string" ? product.image.src : "assets/images/product-placeholder.svg";
        const alt = typeof product.image === "object" && typeof product.image?.alt === "string" ? product.image.alt : product.name;
        image.innerHTML = `<img src="${escapeHtml(imageSource)}" alt="${escapeHtml(alt || product.name)}">`;
        content.innerHTML = `
            <div class="oregano-product-modal__eyebrow">${escapeHtml(product.status || "Catalogue selection")}</div>
            <h2 class="oregano-product-modal__title" id="oreganoProductModalTitle">${escapeHtml(product.name)}</h2>
            <div class="oregano-product-modal__meta"><span>${escapeHtml(product.type || "—")}</span><span>${escapeHtml(product.category || "—")}</span>${product.featured ? "<span>Featured</span>" : ""}</div>
            <p class="oregano-product-modal__description">${escapeHtml(product.description || "Premium product selected for the Oregano790 catalogue.")}</p>
            <div class="oregano-product-modal__details">
                <div class="oregano-product-modal__detail"><small>SKU</small><strong>${escapeHtml(product.sku || "—")}</strong></div>
                <div class="oregano-product-modal__detail"><small>Stock</small><strong>${escapeHtml(stock)}</strong></div>
                <div class="oregano-product-modal__detail"><small>THC</small><strong>${escapeHtml(product.thc ?? "—")}</strong></div>
                <div class="oregano-product-modal__detail"><small>CBD</small><strong>${escapeHtml(product.cbd ?? "—")}</strong></div>
            </div>
            <div class="oregano-product-modal__price">${escapeHtml(formatPrice(product.price))}</div>`;
    };

    const open = async (card) => {
        previousFocus = document.activeElement;
        const product = await findProduct(card);
        if (!product) { console.warn("OREGANO 790 — Product detail could not be resolved."); return; }
        renderProduct(product);
        modal.hidden = false;
        modal.setAttribute("aria-hidden", "false");
        document.body.classList.add("oregano-modal-open");
        modal.querySelector(".oregano-product-modal__close")?.focus();
    };

    const close = () => {
        if (!modal || modal.hidden) return;
        modal.hidden = true;
        modal.setAttribute("aria-hidden", "true");
        document.body.classList.remove("oregano-modal-open");
        previousFocus?.focus?.();
        previousFocus = null;
    };

    const bind = () => {
        const grid = document.getElementById("catalogueGrid");
        if (!grid || grid.dataset.oreganoModalBound === "true") return;
        grid.dataset.oreganoModalBound = "true";
        grid.addEventListener("click", event => {
            const trigger = event.target.closest(".quick-view");
            if (!trigger) return;
            const card = trigger.closest(".product-card");
            if (!card) return;
            event.preventDefault();
            open(card).catch(error => console.error("OREGANO 790 — Product modal failed:", error));
        });
    };

    const init = () => { ensureModal(); bind(); };
    return Object.freeze({ init, open, close });
})();

if (typeof window !== "undefined") window.OreganoProductModal = OreganoProductModal;
