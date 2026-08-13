import assert from "node:assert/strict";
import { createServer } from "node:http";
import test, { after, before } from "node:test";

import { createApp } from "../src/app.js";
import { createSiteSettingsRepository } from "../src/repositories/site-settings-repository.js";
import { DEFAULT_SITE_SETTINGS } from "../src/models/site-settings.js";

const ADMIN_TOKEN = "test-admin-token";

process.env.OREGANO_ADMIN_TOKEN = ADMIN_TOKEN;

const siteSettingsRepository = createSiteSettingsRepository();

const server = createServer(
    createApp({ siteSettingsRepository })
);

let baseUrl;

const adminHeaders = {
    Authorization: `Bearer ${ADMIN_TOKEN}`,
    "Content-Type": "application/json"
};

before(async () => {
    await siteSettingsRepository.replace(DEFAULT_SITE_SETTINGS);

    await new Promise(resolve => {
        server.listen(0, "127.0.0.1", resolve);
    });

    baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
    await new Promise(resolve => server.close(resolve));
});

test("GET settings returns public normalized settings", async () => {
    const response = await fetch(`${baseUrl}/api/v1/settings`);

    assert.equal(response.status, 200);

    const body = await response.json();

    assert.deepEqual(body.settings.brand, DEFAULT_SITE_SETTINGS.brand);
    assert.deepEqual(body.settings.ageGate, DEFAULT_SITE_SETTINGS.ageGate);
    assert.deepEqual(body.settings.legal, DEFAULT_SITE_SETTINGS.legal);
    assert.deepEqual(body.settings.membership, DEFAULT_SITE_SETTINGS.membership);
    assert.deepEqual(body.settings.catalogue, DEFAULT_SITE_SETTINGS.catalogue);
    assert.deepEqual(body.settings.theme, DEFAULT_SITE_SETTINGS.theme);
});

test("settings GET does not require admin authentication", async () => {
    const response = await fetch(`${baseUrl}/api/v1/settings`);

    assert.equal(response.status, 200);
});

test("settings PUT requires admin authentication", async () => {
    const response = await fetch(`${baseUrl}/api/v1/settings`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            brand: {
                businessName: "UNAUTHORIZED"
            }
        })
    });

    assert.equal(response.status, 401);
});

test("settings PATCH requires admin authentication", async () => {
    const response = await fetch(`${baseUrl}/api/v1/settings`, {
        method: "PATCH",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            brand: {
                tagline: "UNAUTHORIZED"
            }
        })
    });

    assert.equal(response.status, 401);
});

test("admin PUT replaces settings and normalizes missing sections", async () => {
    const response = await fetch(`${baseUrl}/api/v1/settings`, {
        method: "PUT",
        headers: adminHeaders,
        body: JSON.stringify({
            brand: {
                businessName: "CUSTOM OREGANO"
            }
        })
    });

    assert.equal(response.status, 200);

    const body = await response.json();

    assert.equal(
        body.settings.brand.businessName,
        "CUSTOM OREGANO"
    );

    assert.equal(
        body.settings.brand.tagline,
        DEFAULT_SITE_SETTINGS.brand.tagline
    );

    assert.equal(
        body.settings.ageGate.minimumAge,
        DEFAULT_SITE_SETTINGS.ageGate.minimumAge
    );

    assert.equal(
        body.settings.membership.ctaLabel,
        DEFAULT_SITE_SETTINGS.membership.ctaLabel
    );
});

test("admin PATCH applies partial nested settings updates", async () => {
    const response = await fetch(`${baseUrl}/api/v1/settings`, {
        method: "PATCH",
        headers: adminHeaders,
        body: JSON.stringify({
            brand: {
                tagline: "Updated OREGANO 790 Experience"
            },
            ageGate: {
                minimumAge: 21
            },
            theme: {
                primaryColour: "#123456"
            }
        })
    });

    assert.equal(response.status, 200);

    const body = await response.json();

    assert.equal(
        body.settings.brand.businessName,
        "CUSTOM OREGANO"
    );

    assert.equal(
        body.settings.brand.tagline,
        "Updated OREGANO 790 Experience"
    );

    assert.equal(
        body.settings.ageGate.minimumAge,
        21
    );

    assert.equal(
        body.settings.ageGate.enabled,
        DEFAULT_SITE_SETTINGS.ageGate.enabled
    );

    assert.equal(
        body.settings.theme.primaryColour,
        "#123456"
    );
});

test("settings changes are persisted in the injected repository", async () => {
    const response = await fetch(`${baseUrl}/api/v1/settings`, {
        method: "PATCH",
        headers: adminHeaders,
        body: JSON.stringify({
            membership: {
                ctaLabel: "Join OREGANO 790"
            }
        })
    });

    assert.equal(response.status, 200);

    const stored = await siteSettingsRepository.get();

    assert.equal(
        stored.membership.ctaLabel,
        "Join OREGANO 790"
    );

    assert.equal(
        stored.brand.businessName,
        "CUSTOM OREGANO"
    );
});

test("settings route rejects malformed JSON", async () => {
    const response = await fetch(`${baseUrl}/api/v1/settings`, {
        method: "PATCH",
        headers: adminHeaders,
        body: "{ invalid json"
    });

    assert.equal(response.status, 400);

    const body = await response.json();

    assert.equal(
        body.error,
        "Request body must contain valid JSON."
    );
});

test("settings route rejects unsupported methods", async () => {
    const response = await fetch(`${baseUrl}/api/v1/settings`, {
        method: "DELETE",
        headers: adminHeaders
    });

    assert.equal(response.status, 405);
});
