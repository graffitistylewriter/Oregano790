import { createServer } from "node:http";
import { app } from "./src/app.js";

const PORT = Number(process.env.PORT || 3000);

createServer(app).listen(PORT, () => {
    console.log(`Oregano790 backend running on port ${PORT}`);
});
