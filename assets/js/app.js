/*=========================================================
OREGANO 790
APPLICATION ENTRY POINT
DEV-001 FRONTEND FOUNDATION
=========================================================*/

/**
 * Central application namespace.
 *
 * UI modules should depend on application services/state rather than
 * knowing how data is persisted. DEV-001 keeps persistence local;
 * later stages can replace service implementations without changing
 * the page runtime.
 */
const OreganoApp = (() => {
    const state = {
        ready: false,
        theme: "dark",
        catalogue: {
            filter: "all",
            search: ""
        },
        user: null
    };

    const listeners = new Map();

    const getState = () => ({
        ...state,
        catalogue: { ...state.catalogue }
    });

    const setState = (patch = {}) => {
        Object.assign(state, patch);
        if (patch.catalogue) state.catalogue = { ...state.catalogue, ...patch.catalogue };
        emit("state:change", getState());
        return getState();
    };

    const on = (event, handler) => {
        if (typeof handler !== "function") return () => {};
        if (!listeners.has(event)) listeners.set(event, new Set());
        listeners.get(event).add(handler);
        return () => listeners.get(event)?.delete(handler);
    };

    const emit = (event, payload) => {
        listeners.get(event)?.forEach(handler => handler(payload));
    };

    const ready = () => {
        state.ready = true;
        emit("app:ready", getState());
    };

    return Object.freeze({
        version: "0.1.0-dev.001",
        services: {
            get products() {
                return window.OreganoProductService;
            }
        },
        state: Object.freeze({ get: getState, set: setState, on, emit }),
        ready
    });
})();

window.OreganoApp = OreganoApp;

/*======================================================
OREGANO 790
CANONICAL PAGE RUNTIME
DEV-013 FRONTEND RUNTIME CLEANUP
======================================================*/

(() => {
    if (typeof window === "undefined" || typeof document === "undefined") return;

    const header = document.getElementById("siteHeader");
    const themeToggle = document.getElementById("themeToggle");
    const menu = document.getElementById("mobileMenu");
    const burger = document.getElementById("hamburger");
    const heroImage = document.querySelector(".hero-image img");

    const revealElements = () => {
        document.querySelectorAll("section, .showcase-image, .showcase-content").forEach(element => {
            element.classList.add("visible");
        });
    };

    window.addEventListener("scroll", () => {
        if (!header) return;
        header.classList.toggle("scrolled", window.scrollY > 40);
    });

    if (themeToggle) {
        themeToggle.addEventListener("click", () => {
            document.body.classList.toggle("light");
            const light = document.body.classList.contains("light");
            themeToggle.textContent = light ? "🌙" : "☀️";
            OreganoApp.state.set({ theme: light ? "light" : "dark" });
        });
    }

    if (burger && menu) {
        burger.addEventListener("click", () => {
            menu.classList.toggle("open");
        });
    }

    window.addEventListener("scroll", () => {
        if (!heroImage) return;
        heroImage.style.transform = `translateY(${window.pageYOffset * 0.12}px) scale(1.08)`;
    });

    document.querySelectorAll(".btn").forEach(button => {
        button.addEventListener("click", event => {
            const ripple = document.createElement("span");
            ripple.className = "ripple";

            const rect = button.getBoundingClientRect();
            ripple.style.left = `${event.clientX - rect.left}px`;
            ripple.style.top = `${event.clientY - rect.top}px`;

            button.appendChild(ripple);
            window.setTimeout(() => ripple.remove(), 600);
        });
    });

    const observer = typeof IntersectionObserver === "undefined"
        ? null
        : new IntersectionObserver(entries => {
            entries.forEach(entry => {
                if (entry.isIntersecting) entry.target.classList.add("visible");
            });
        }, { threshold: 0.18 });

    if (observer) {
        document.querySelectorAll("section").forEach(section => observer.observe(section));
    } else {
        revealElements();
    }

    const showcaseObserver = typeof IntersectionObserver === "undefined"
        ? null
        : new IntersectionObserver(entries => {
            entries.forEach(entry => {
                if (entry.isIntersecting) entry.target.classList.add("visible");
            });
        }, { threshold: 0.20 });

    if (showcaseObserver) {
        document.querySelectorAll(".showcase-image, .showcase-content").forEach(item => {
            showcaseObserver.observe(item);
        });
    }

    window.addEventListener("load", () => {
        document.body.classList.add("loaded");
        revealElements();
        OreganoApp.ready();
    }, { once: true });
})();
