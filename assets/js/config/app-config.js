/*=========================================================
OREGANO 790
APPLICATION CONFIGURATION
DEV-003 SERVICE BOUNDARY
=========================================================*/

/**
 * Central runtime configuration.
 *
 * The catalogue remains frontend-safe when the standalone backend is not
 * running. Backend integration remains available for development once the
 * API service is intentionally enabled.
 */
const OreganoConfig = Object.freeze({
    version: "0.3.0-dev.003",
    api: Object.freeze({
        baseUrl: "http://localhost:3000",
        cataloguePath: "/api/v1/catalogue"
    }),
    features: Object.freeze({
        apiBackedCatalogue: false,
        catalogueApiFallback: true
    })
});

window.OreganoConfig = OreganoConfig;
