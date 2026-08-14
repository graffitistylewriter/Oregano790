const getApiBase = () => {
  const configuredBase = window?.OreganoConfig?.api?.baseUrl;
  return String(configuredBase || "http://localhost:3000").replace(/\/$/, "");
};

const getCataloguePath = () => {
  const configuredPath = window?.OreganoConfig?.api?.cataloguePath;
  return String(configuredPath || "/api/v1/catalogue").startsWith("/")
    ? String(configuredPath || "/api/v1/catalogue")
    : `/${configuredPath}`;
};

const apiBackedCatalogueEnabled = () => window?.OreganoConfig?.features?.apiBackedCatalogue === true;
const catalogueFallbackEnabled = () => window?.OreganoConfig?.features?.catalogueApiFallback !== false;

const getLegacyProducts = () => {
  const products = window?.oreganoProducts;
  return Array.isArray(products) ? products.map(product => ({ ...product })) : [];
};

const request = async (path, { token, method = "GET", body } = {}) => {
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body !== undefined) headers["Content-Type"] = "application/json";

  const response = await fetch(`${getApiBase()}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body)
  });

  let data = {};
  try {
    data = await response.json();
  } catch {
    // Keep the HTTP error below when the backend has no JSON response.
  }

  if (!response.ok) {
    throw new Error(data.error || `Request failed (${response.status}).`);
  }

  return data;
};

const listProductsFromFallback = () => ({ products: getLegacyProducts() });

export const listProducts = async token => {
  if (!apiBackedCatalogueEnabled() && catalogueFallbackEnabled()) {
    return listProductsFromFallback();
  }

  try {
    return await request(getCataloguePath(), { token });
  } catch (error) {
    if (!catalogueFallbackEnabled()) throw error;
    return listProductsFromFallback();
  }
};

export const fetchCatalogue = async ({ token = "", id = "", search = "", category = "", type = "" } = {}) => {
  let products;

  if (id) {
    if (!apiBackedCatalogueEnabled() && catalogueFallbackEnabled()) {
      products = getLegacyProducts().filter(product => String(product.id) === String(id));
    } else {
      try {
        const data = await request(`${getCataloguePath()}?id=${encodeURIComponent(id)}`, { token });
        products = data.product ? [data.product] : [];
      } catch (error) {
        if (!catalogueFallbackEnabled()) throw error;
        products = getLegacyProducts().filter(product => String(product.id) === String(id));
      }
    }
  } else {
    const data = await listProducts(token);
    products = Array.isArray(data.products) ? data.products : [];
  }

  const normalizedSearch = String(search || "").trim().toLowerCase();
  const normalizedCategory = String(category || "").trim().toLowerCase();
  const normalizedType = String(type || "").trim().toLowerCase();

  if (normalizedSearch) {
    products = products.filter(product => [product.name, product.sku, product.description, product.category, product.type]
      .some(value => String(value || "").toLowerCase().includes(normalizedSearch)));
  }

  if (normalizedCategory) {
    products = products.filter(product => String(product.category || "").toLowerCase() === normalizedCategory);
  }

  if (normalizedType) {
    products = products.filter(product => String(product.type || "").toLowerCase() === normalizedType);
  }

  return products;
};

export const createProduct = (token, product) =>
  request(getCataloguePath(), { token, method: "POST", body: product });

export const updateProduct = (token, id, changes) =>
  request(`${getCataloguePath()}/${encodeURIComponent(id)}`, {
    token,
    method: "PUT",
    body: changes
  });

export const deleteProduct = (token, id) =>
  request(`${getCataloguePath()}/${encodeURIComponent(id)}`, {
    token,
    method: "DELETE"
  });

const OreganoProductService = Object.freeze({
  listProducts,
  fetchCatalogue,
  createProduct,
  updateProduct,
  deleteProduct
});

if (typeof window !== "undefined") {
  window.OreganoProductService = OreganoProductService;
}
