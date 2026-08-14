/*=========================================================
OREGANO 790
FRONTEND BOOTSTRAP
DEV-034 CATALOGUE UI BOOTSTRAP
=========================================================*/

(() => {
    if (typeof window === "undefined" || typeof document === "undefined") return;

    const loadedScripts = new Map();

    const loadScript = (src) => {
        if (loadedScripts.has(src)) return loadedScripts.get(src);

        const promise = new Promise((resolve, reject) => {
            const existing = document.querySelector(`script[data-oregano-src="${src}"]`);
            if (existing) {
                if (existing.dataset.oreganoLoaded === "true") {
                    resolve();
                    return;
                }
                existing.addEventListener("load", () => resolve(), { once: true });
                existing.addEventListener("error", () => reject(new Error(`Failed to load ${src}.`)), { once: true });
                return;
            }

            const script = document.createElement("script");
            script.src = src;
            script.dataset.oreganoSrc = src;
            script.async = false;
            script.addEventListener("load", () => {
                script.dataset.oreganoLoaded = "true";
                resolve();
            }, { once: true });
            script.addEventListener("error", () => reject(new Error(`Failed to load ${src}.`)), { once: true });
            document.head.appendChild(script);
        });

        loadedScripts.set(src, promise);
        return promise;
    };

    const boot = async () => {
        try {
            await loadScript("assets/js/config/app-config.js");
            await import("./services/product-service.js");
            await loadScript("assets/js/services/catalogue-service.js");
            await import("./ui/catalogue-ui.js");
            await loadScript("assets/js/ui/product-modal.js");

            window.OreganoCatalogueUI?.init();
            window.OreganoProductModal?.init();
        } catch (error) {
            console.error("OREGANO 790 — Service module bootstrap failed:", error);
        }
    };

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", boot, { once: true });
    } else {
        boot();
    }
})();
