import { createApplicationRepository } from "./repositories/application-repository.js";

export const applicationRepository = createApplicationRepository({
    filePath: "./storage/applications.json"
});
