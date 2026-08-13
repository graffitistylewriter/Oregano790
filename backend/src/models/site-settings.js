export const DEFAULT_SITE_SETTINGS = Object.freeze({
    brand: {
        businessName: "OREGANO 790",
        tagline: "Premium Members Cannabis Boutique",
        logoUrl: ""
    },

    ageGate: {
        enabled: true,
        minimumAge: 18,
        headline: "Welcome to OREGANO 790",
        message: "This is a private members cannabis boutique.",
        ageCheckbox: "I confirm that I am 18 years of age or older.",
        legalCheckbox: "I agree to the OREGANO 790 Terms & Conditions.",
        continueLabel: "Enter OREGANO 790"
    },

    legal: {
        termsTitle: "Terms & Conditions",
        termsContent: "",
        privacyTitle: "Privacy",
        privacyContent: ""
    },

    membership: {
        headline: "Become an OREGANO 790 Member",
        description: "Apply for membership to access the private OREGANO 790 member experience.",
        ctaLabel: "Apply for Membership"
    },

    catalogue: {
        publicShowPrices: false,
        publicShowCart: false,
        publicShowCheckout: false
    },

    theme: {
        primaryColour: "",
        accentColour: "",
        backgroundColour: "",
        textColour: "",
        buttonColour: ""
    }
});

const cloneValue = value => {
    if (Array.isArray(value)) return value.map(cloneValue);

    if (value && typeof value === "object") {
        return Object.fromEntries(
            Object.entries(value).map(([key, child]) => [key, cloneValue(child)])
        );
    }

    return value;
};

export const createSiteSettings = (overrides = {}) => {
    const merged = {
        ...DEFAULT_SITE_SETTINGS,
        ...overrides,
        brand: {
            ...DEFAULT_SITE_SETTINGS.brand,
            ...(overrides.brand || {})
        },
        ageGate: {
            ...DEFAULT_SITE_SETTINGS.ageGate,
            ...(overrides.ageGate || {})
        },
        legal: {
            ...DEFAULT_SITE_SETTINGS.legal,
            ...(overrides.legal || {})
        },
        membership: {
            ...DEFAULT_SITE_SETTINGS.membership,
            ...(overrides.membership || {})
        },
        catalogue: {
            ...DEFAULT_SITE_SETTINGS.catalogue,
            ...(overrides.catalogue || {})
        },
        theme: {
            ...DEFAULT_SITE_SETTINGS.theme,
            ...(overrides.theme || {})
        }
    };

    return cloneValue(merged);
};

export const cloneSiteSettings = settings => createSiteSettings(settings);

export const toPublicSiteSettings = settings => {
    const normalized = createSiteSettings(settings);

    return {
        brand: {
            ...normalized.brand
        },

        ageGate: {
            ...normalized.ageGate
        },

        legal: {
            termsTitle: normalized.legal.termsTitle,
            termsContent: normalized.legal.termsContent,
            privacyTitle: normalized.legal.privacyTitle,
            privacyContent: normalized.legal.privacyContent
        },

        membership: {
            ...normalized.membership
        },

        catalogue: {
            ...normalized.catalogue
        },

        theme: {
            ...normalized.theme
        }
    };
};
