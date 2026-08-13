import assert from "node:assert/strict";
import { createServer } from "node:http";
import test, { after, before } from "node:test";

import { createApp } from "../src/app.js";
import {
    createSiteSettingsRepository
} from "../src/repositories/site-settings-repository.js";
import {
    DEFAULT_SITE_SETTINGS
} from "../src/models/site-settings.js";

const ADMIN_TOKEN = "test-admin-token";

process.env.OREGANO_ADMIN_TOKEN = ADMIN_TOKEN;

const siteSettingsRepository =
    createSiteSettingsRepository();

const server = createServer(
    createApp({
        siteSettingsRepository
    })
);

let baseUrl;

const adminHeaders = {
    Authorization: `Bearer ${ADMIN_TOKEN}`,
    "Content-Type": "application/json"
};

const jsonHeaders = {
    "Content-Type": "application/json"
};

before(async () => {
    await siteSettingsRepository.replace(
        DEFAULT_SITE_SETTINGS
    );

    await new Promise(resolve => {
        server.listen(0, "127.0.0.1", resolve);
    });

    baseUrl =
        `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
    await new Promise(resolve =>
        server.close(resolve)
    );
});

test("GET /api/v1/settings/public is publicly readable", async () => {
    const response = await fetch(
        `${baseUrl}/api/v1/settings/public`
    );

    assert.equal(response.status, 200);

    const body = await response.json();

    assert.deepEqual(
        body.settings,
        DEFAULT_SITE_SETTINGS
    );
});

test("GET /api/v1/settings requires admin authentication", async () => {
    const response = await fetch(
        `${baseUrl}/api/v1/settings`
    );

    assert.equal(response.status, 401);
});

test("GET /api/v1/settings accepts authenticated admin", async () => {
    const response = await fetch(
        `${baseUrl}/api/v1/settings`,
        {
            headers: {
                Authorization:
                    `Bearer ${ADMIN_TOKEN}`
            }
        }
    );

    assert.equal(response.status, 200);

    const body = await response.json();

    assert.deepEqual(
        body.settings,
        DEFAULT_SITE_SETTINGS
    );
});

test("PUT /api/v1/settings rejects unauthenticated requests", async () => {
    const response = await fetch(
        `${baseUrl}/api/v1/settings`,
        {
            method: "PUT",
            headers: jsonHeaders,
            body: JSON.stringify({
                brand: {
                    businessName: "UNAUTHORIZED"
                }
            })
        }
    );

    assert.equal(response.status, 401);
});

test("PUT /api/v1/settings accepts authenticated admin", async () => {
    const response = await fetch(
        `${baseUrl}/api/v1/settings`,
        {
            method: "PUT",
            headers: adminHeaders,
            body: JSON.stringify({
                brand: {
                    businessName: "CUSTOM OREGANO"
                }
            })
        }
    );

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
});

test("PUT /api/v1/settings normalizes missing sections", async () => {
    const response = await fetch(
        `${baseUrl}/api/v1/settings`,
        {
            method: "PUT",
            headers: adminHeaders,
            body: JSON.stringify({
                membership: {
                    ctaLabel: "JOIN NOW"
                }
            })
        }
    );

    assert.equal(response.status, 200);

    const body = await response.json();

    assert.equal(
        body.settings.membership.ctaLabel,
        "JOIN NOW"
    );

    assert.equal(
        body.settings.brand.businessName,
        DEFAULT_SITE_SETTINGS.brand.businessName
    );

    assert.equal(
        body.settings.catalogue.publicShowCart,
        DEFAULT_SITE_SETTINGS.catalogue.publicShowCart
    );
});

test("PATCH /api/v1/settings remains admin protected", async () => {
    const response = await fetch(
        `${baseUrl}/api/v1/settings`,
        {
            method: "PATCH",
            headers: jsonHeaders,
            body: JSON.stringify({
                brand: {
                    tagline: "UNAUTHORIZED"
                }
            })
        }
    );

    assert.equal(response.status, 401);
});

test("authenticated PATCH updates settings", async () => {
    const response = await fetch(
        `${baseUrl}/api/v1/settings`,
        {
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
        }
    );

    assert.equal(response.status, 200);

    const body = await response.json();

    assert.equal(
        body.settings.brand.tagline,
        "Updated OREGANO 790 Experience"
    );

    assert.equal(
        body.settings.ageGate.minimumAge,
        21
    );

    assert.equal(
        body.settings.theme.primaryColour,
        "#123456"
    );
});

test("settings changes persist through the repository", async () => {
    const response = await fetch(
        `${baseUrl}/api/v1/settings`,
        {
            method: "PATCH",
            headers: adminHeaders,
            body: JSON.stringify({
                membership: {
                    ctaLabel: "Join OREGANO 790"
                }
            })
        }
    );

    assert.equal(response.status, 200);

    const stored =
        await siteSettingsRepository.get();

    assert.equal(
        stored.membership.ctaLabel,
        "Join OREGANO 790"
    );

    assert.equal(
        stored.brand.tagline,
        "Updated OREGANO 790 Experience"
    );
});

test("malformed JSON is rejected", async () => {
    const response = await fetch(
        `${baseUrl}/api/v1/settings`,
        {
            method: "PATCH",
            headers: adminHeaders,
            body: "{ invalid json"
        }
    );

    assert.equal(response.status, 400);

    const body = await response.json();

    assert.equal(
        body.error,
        "Request body must contain valid JSON."
    );
});

test("unsupported settings methods return 405", async () => {
    const response = await fetch(
        `${baseUrl}/api/v1/settings`,
        {
            method: "DELETE",
            headers: adminHeaders
        }
    );

    assert.equal(response.status, 405);
});

test("public settings response remains a projection", async () => {
    const maliciousRepository =
        createSiteSettingsRepository();

    await maliciousRepository.replace({
        ...DEFAULT_SITE_SETTINGS,
        secretToken: "SHOULD-NOT-APPEAR",
        internal: {
            password: "SHOULD-NOT-APPEAR"
        }
    });

    const isolatedServer = createServer(
        createApp({
            siteSettingsRepository:
                maliciousRepository
        })
    );

    await new Promise(resolve =>
        isolatedServer.listen(
            0,
            "127.0.0.1",
            resolve
        )
    );

    const isolatedUrl =
        `http://127.0.0.1:${isolatedServer.address().port}`;

    try {
        const response = await fetch(
            `${isolatedUrl}/api/v1/settings/public`
        );

        assert.equal(response.status, 200);

        const body = await response.json();

        assert.equal(
            Object.hasOwn(body.settings, "secretToken"),
            false
        );

        assert.equal(
            Object.hasOwn(body.settings, "internal"),
            false
        );
    } finally {
        await new Promise(resolve =>
            isolatedServer.close(resolve)
        );
    }
});
