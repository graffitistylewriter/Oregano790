const API_BASE = "http://localhost:3000/api/v1";

const request = async (path, { token, method = "GET", body } = {}) => {
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body !== undefined) headers["Content-Type"] = "application/json";

  const response = await fetch(`${API_BASE}${path}`, {
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

export const listProducts = token => request("/catalogue", { token });

export const fetchCatalogue = async ({ token = "", id = "", search = "", category = "", type = "" } = {}) => {
  const params = new URLSearchParams();
  if (id) params.set("id", id);

  const data = await listProducts(token);
  let products = Array.isArray(data.products) ? data.products : [];

  if (id) {
    products = products.filter(product => String(product.id) === String(id));
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
  request("/catalogue", { token, method: "POST", body: product });

export const updateProduct = (token, id, changes) =>
  request(`/catalogue/${encodeURIComponent(id)}`, {
    token,
    method: "PUT",
    body: changes
  });

export const deleteProduct = (token, id) =>
  request(`/catalogue/${encodeURIComponent(id)}`, {
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
