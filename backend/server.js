import { createServer } from "node:http";
import { app } from "./src/app.js";
import { config, assertProductionConfiguration } from "./src/config.js";

assertProductionConfiguration();

createServer(app).listen(config.port, () => {
    console.log(`Oregano790 backend running on port ${config.port}`);
});
