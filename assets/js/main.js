/*=========================================================
OREGANO 790
FRONTEND BOOTSTRAP
DEV-001 FRONTEND FOUNDATION
=========================================================*/

(() => {
    const boot = () => {
        window.OreganoNavigation?.init();
        window.OreganoCatalogueUI?.init();

        const heroImage = document.querySelector(".hero-image img");
        if (heroImage) {
            window.addEventListener("scroll", () => {
                heroImage.style.transform = `translateY(${window.pageYOffset * 0.12}px) scale(1.08)`;
            }, { passive: true });
        }

        document.querySelectorAll(".btn").forEach(button => {
            button.addEventListener("click", function (event) {
                const ripple = document.createElement("span");
                ripple.className = "ripple";
                const rect = this.getBoundingClientRect();
                ripple.style.left = `${event.clientX - rect.left}px`;
                ripple.style.top = `${event.clientY - rect.top}px`;
                this.appendChild(ripple);
                window.setTimeout(() => ripple.remove(), 600);
            });
        });

        document.body.classList.add("loaded");

        if (window.OreganoApp) {
            window.OreganoApp.state.set({ ready: true });
            window.OreganoApp.ready();
        }

        if (typeof IntersectionObserver === "undefined") {
            document.querySelectorAll("section, .showcase-image, .showcase-content").forEach(element => {
                element.classList.add("visible");
            });
            return;
        }

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) entry.target.classList.add("visible");
            });
        }, { threshold: 0.18 });

        document.querySelectorAll("section, .showcase-image, .showcase-content").forEach(element => observer.observe(element));
    };

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", boot, { once: true });
    } else {
        boot();
    }
})();