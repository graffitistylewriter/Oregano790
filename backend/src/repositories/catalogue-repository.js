import { readFile, writeFile, mkdir } from "node:fs/promises";
import { dirname } from "node:path";

const cloneProduct = product => ({ ...product });
const cloneProducts = products => products.map(cloneProduct);

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
        await writeFile(filePath, JSON.stringify({ products }, null, 2) + "\n", "utf8");
    };

    const list = async () => {
        const persisted = await readPersisted();
        if (persisted) memoryProducts = persisted;
        return cloneProducts(memoryProducts);
    };

    const replaceAll = async products => {
        if (!Array.isArray(products)) throw new TypeError("Catalogue products must be an array.");
        memoryProducts = cloneProducts(products);
        await persist(memoryProducts);
        return cloneProducts(memoryProducts);
    };

    const getById = async id => {
        const products = await list();
        return products.find(product => String(product.id) === String(id)) || null;
    };

    const create = async product => {
        const products = await list();
        const nextProduct = cloneProduct(product);
        if (!nextProduct.id) {
            nextProduct.id = `product-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        }
        if (products.some(existing => String(existing.id) === String(nextProduct.id))) {
            throw new Error("A product with this id already exists.");
        }
        products.push(nextProduct);
        await persist(products);
        memoryProducts = products;
        return cloneProduct(nextProduct);
    };

    const update = async (id, changes) => {
        const products = await list();
        const index = products.findIndex(product => String(product.id) === String(id));
        if (index === -1) return null;
        const updated = { ...products[index], ...changes, id: products[index].id };
        products[index] = updated;
        await persist(products);
        memoryProducts = products;
        return cloneProduct(updated);
    };

    const remove = async id => {
        const products = await list();
        const index = products.findIndex(product => String(product.id) === String(id));
        if (index === -1) return null;
        const [removed] = products.splice(index, 1);
        await persist(products);
        memoryProducts = products;
        return cloneProduct(removed);
    };

    return Object.freeze({ list, replaceAll, getById, create, update, remove });
};
