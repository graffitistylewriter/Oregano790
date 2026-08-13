import { createSiteSettingsRepository } from "./repositories/site-settings-repository.js";

export const siteSettingsRepository = createSiteSettingsRepository({
    filePath: "./storage/site-settings.json"
});
