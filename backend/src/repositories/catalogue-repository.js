import { readFile, writeFile, mkdir } from "node:fs/promises";
import { dirname } from "node:path";

const cloneProducts = products => products.map(product => ({ ...product }));

export const createCatalogueRepository = ({ seedProducts = [], filePath = null } = {}) => {
    let memoryProducts = cloneProducts(seedProducts);

    const readPersisted = async () => {
        if (!filePath) return null;

        try {
            const raw = await readFile(filePath, "utf8");
            const parsed = JSON.parse(raw);
            return Array.isArray(parsed.products) ? cloneProducts(parsed.products) : null;
        } catch (error) {
            if (error.code === "ENOENT") return null;
            throw error;
        }
    };

    const persist = async products => {
        if (!filePath) return;
        await mkdir(dirname(filePath), { recursive: true });
        await writeFile(
            filePath,
            JSON.stringify({ products }, null, 2) + "\n",
            "utf8"
        );
    };

    const list = async () => {
        const persisted = await readPersisted();
        if (persisted) {
            memoryProducts = persisted;
        }
        return cloneProducts(memoryProducts);
    };

    const replaceAll = async products => {
        if (!Array.isArray(products)) {
            throw new TypeError("Catalogue products must be an array.");
        }
        memoryProducts = cloneProducts(products);
        await persist(memoryProducts);
        return cloneProducts(memoryProducts);
    };

    const getById = async id => {
        const products = await list();
        return products.find(product => String(product.id) === String(id)) || null;
    };

    return Object.freeze({ list, replaceAll, getById });
};
