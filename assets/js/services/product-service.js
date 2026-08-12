const API_BASE = "http://localhost:3000/api/v1";

const request = async (path, { token, method = "GET", body } = {}) => {
  const headers = { Authorization: `Bearer ${token}` };
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
