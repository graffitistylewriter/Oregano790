/*=========================================================
OREGANO 790
FRONTEND BOOTSTRAP
DEV-032 FRONTEND RUNTIME LOADER
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
            /* Config is loaded first so every service shares one API boundary. */
            await loadScript("assets/js/config/app-config.js");

            /* Product service is ESM and publishes its compatibility global on window. */
            await import("./services/product-service.js");

            /* Application runtime owns page-level interaction behavior. */
            await loadScript("assets/js/app.js");

            /* Service/UI modules consume the canonical product service global. */
            await loadScript("assets/js/services/catalogue-service.js");
            await loadScript("assets/js/ui/product-modal.js");

            window.OreganoProductModal?.init();

            document.body.classList.add("loaded");

            if (window.OreganoApp) {
                window.OreganoApp.state.set({ ready: true });
                window.OreganoApp.ready();
            }
        } catch (error) {
            console.error("OREGANO 790 — Frontend bootstrap failed:", error);
            document.body.classList.add("loaded");
        }
    };

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", boot, { once: true });
    } else {
        boot();
    }
})();
