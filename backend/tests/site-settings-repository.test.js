import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import {
    DEFAULT_SITE_SETTINGS,
    createSiteSettings
} from "../src/models/site-settings.js";

import {
    createSiteSettingsRepository
} from "../src/repositories/site-settings-repository.js";

const createTempFilePath = async () => {
    const directory = await mkdtemp(join(tmpdir(), "oregano790-settings-"));
    return join(directory, "site-settings.json");
};

test("settings repository returns canonical defaults", async () => {
    const repository = createSiteSettingsRepository();

    const settings = await repository.get();

    assert.deepEqual(settings, createSiteSettings(DEFAULT_SITE_SETTINGS));
});

test("settings repository applies partial nested updates", async () => {
    const repository = createSiteSettingsRepository();

    const updated = await repository.update({
        brand: {
            tagline: "Updated OREGANO 790 experience"
        },
        ageGate: {
            minimumAge: 21
        }
    });

    assert.equal(updated.brand.businessName, DEFAULT_SITE_SETTINGS.brand.businessName);
    assert.equal(updated.brand.tagline, "Updated OREGANO 790 experience");
    assert.equal(updated.ageGate.enabled, true);
    assert.equal(updated.ageGate.minimumAge, 21);
    assert.equal(updated.membership.ctaLabel, DEFAULT_SITE_SETTINGS.membership.ctaLabel);
});

test("settings repository returns independent settings objects", async () => {
    const repository = createSiteSettingsRepository();

    const first = await repository.get();

    first.brand.businessName = "MUTATED";
    first.ageGate.minimumAge = 99;

    const second = await repository.get();

    assert.equal(second.brand.businessName, DEFAULT_SITE_SETTINGS.brand.businessName);
    assert.equal(second.ageGate.minimumAge, DEFAULT_SITE_SETTINGS.ageGate.minimumAge);
});

test("settings repository replace normalizes missing sections", async () => {
    const repository = createSiteSettingsRepository();

    const replaced = await repository.replace({
        brand: {
            businessName: "CUSTOM OREGANO"
        }
    });

    assert.equal(replaced.brand.businessName, "CUSTOM OREGANO");
    assert.equal(replaced.brand.tagline, DEFAULT_SITE_SETTINGS.brand.tagline);
    assert.equal(replaced.ageGate.enabled, DEFAULT_SITE_SETTINGS.ageGate.enabled);
    assert.equal(replaced.membership.headline, DEFAULT_SITE_SETTINGS.membership.headline);
    assert.equal(replaced.catalogue.publicShowCart, DEFAULT_SITE_SETTINGS.catalogue.publicShowCart);
});

test("settings repository persists replacements to disk", async () => {
    const filePath = await createTempFilePath();

    const repository = createSiteSettingsRepository({
        filePath
    });

    await repository.replace({
        brand: {
            businessName: "PERSISTED OREGANO"
        }
    });

    const raw = await readFile(filePath, "utf8");
    const persisted = JSON.parse(raw);

    assert.equal(persisted.brand.businessName, "PERSISTED OREGANO");
    assert.equal(persisted.ageGate.minimumAge, DEFAULT_SITE_SETTINGS.ageGate.minimumAge);
});

test("settings repository reloads persisted settings", async () => {
    const filePath = await createTempFilePath();

    const firstRepository = createSiteSettingsRepository({
        filePath
    });

    await firstRepository.replace({
        brand: {
            tagline: "Persisted tagline"
        },
        theme: {
            primaryColour: "#123456"
        }
    });

    const secondRepository = createSiteSettingsRepository({
        filePath
    });

    const settings = await secondRepository.get();

    assert.equal(settings.brand.tagline, "Persisted tagline");
    assert.equal(settings.theme.primaryColour, "#123456");
    assert.equal(settings.brand.businessName, DEFAULT_SITE_SETTINGS.brand.businessName);
});
