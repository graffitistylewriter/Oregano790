const parseBoolean = value => String(value ?? "").toLowerCase() === "true";

export const config = Object.freeze({
    environment: process.env.NODE_ENV || "development",
    port: Number(process.env.PORT || 3000),
    adminTokenConfigured: Boolean(String(process.env.OREGANO_ADMIN_TOKEN || "").trim()),
    allowPublicCatalogue: parseBoolean(process.env.OREGANO_ALLOW_PUBLIC_CATALOGUE || "true")
});

export const assertProductionConfiguration = () => {
    if (config.environment === "production" && !config.adminTokenConfigured) {
        throw new Error("OREGANO_ADMIN_TOKEN must be configured in production.");
    }
};
