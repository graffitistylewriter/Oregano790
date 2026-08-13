import { readFile, writeFile, mkdir } from "node:fs/promises";
import { dirname } from "node:path";
import {
    createSiteSettings,
    cloneSiteSettings
} from "../models/site-settings.js";

export const createSiteSettingsRepository = ({
    seedSettings = {},
    filePath = null
} = {}) => {
    let memorySettings = createSiteSettings(seedSettings);

    const readPersisted = async () => {
        if (!filePath) return null;

        try {
            const raw = await readFile(filePath, "utf8");
            const parsed = JSON.parse(raw);

            if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
                return null;
            }

            return createSiteSettings(parsed);
        } catch (error) {
            if (error.code === "ENOENT") return null;
            throw error;
        }
    };

    const persist = async settings => {
        if (!filePath) return;

        await mkdir(dirname(filePath), { recursive: true });

        await writeFile(
            filePath,
            JSON.stringify(settings, null, 2) + "\n",
            "utf8"
        );
    };

    const get = async () => {
        const persisted = await readPersisted();

        if (persisted) {
            memorySettings = persisted;
        }

        return cloneSiteSettings(memorySettings);
    };

    const replace = async settings => {
        const normalized = createSiteSettings(settings);

        await persist(normalized);

        memorySettings = normalized;

        return cloneSiteSettings(memorySettings);
    };

    const update = async changes => {
        const current = await get();

        const updated = createSiteSettings({
            ...current,
            ...changes,
            brand: {
                ...current.brand,
                ...(changes.brand || {})
            },
            ageGate: {
                ...current.ageGate,
                ...(changes.ageGate || {})
            },
            legal: {
                ...current.legal,
                ...(changes.legal || {})
            },
            membership: {
                ...current.membership,
                ...(changes.membership || {})
            },
            catalogue: {
                ...current.catalogue,
                ...(changes.catalogue || {})
            },
            theme: {
                ...current.theme,
                ...(changes.theme || {})
            }
        });

        await persist(updated);

        memorySettings = updated;

        return cloneSiteSettings(memorySettings);
    };

    return Object.freeze({
        get,
        replace,
        update
    });
};
