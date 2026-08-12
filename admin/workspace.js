import {
  listProducts,
  createProduct,
  updateProduct,
  deleteProduct
} from "../assets/js/services/product-service.js";

const state = { token: sessionStorage.getItem("oregano.admin.token") || "" };
const $ = id => document.getElementById(id);

const showWorkspace = () => {
  $("login").classList.add("hidden");
  $("workspace").classList.remove("hidden");
};

const showLogin = () => {
  $("workspace").classList.add("hidden");
  $("login").classList.remove("hidden");
};

const escapeHtml = value => String(value ?? "").replace(/[&<>'"]/g, char => ({
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  "'": "&#39;",
  "\"": "&quot;"
}[char]));

const setStatus = (message, isError = false) => {
  $("workspace-status").textContent = message;
  $("workspace-status").classList.toggle("danger", isError);
};

const renderProducts = products => {
  $("product-count").textContent = products.length;
  $("products").innerHTML = products.map(product => `
    <div class="row">
      <div>
        <strong>${escapeHtml(product.name)}</strong>
        <span class="muted">${escapeHtml(product.sku || "No SKU")} · ${escapeHtml(product.category || "Uncategorised")}</span>
      </div>
      <span class="badge">${escapeHtml(product.type || "Product")}</span>
    </div>`).join("");
};

const loadCatalogue = async () => {
  setStatus("Loading catalogue…");
  const data = await listProducts(state.token);
  renderProducts(data.products || []);
  setStatus("Catalogue loaded from backend.");
};

const resetProductForm = () => {
  $("product-form").reset();
  $("product-form").classList.add("hidden");
  $("product-form-status").textContent = "";
};

$("login-form").addEventListener("submit", async event => {
  event.preventDefault();
  const token = $("token").value.trim();
  $("login-status").textContent = "Checking access…";
  try {
    state.token = token;
    await loadCatalogue();
    sessionStorage.setItem("oregano.admin.token", token);
    $("token").value = "";
    showWorkspace();
  } catch (error) {
    state.token = "";
    $("login-status").textContent = error.message;
  }
});

$("refresh").addEventListener("click", () => loadCatalogue().catch(error => setStatus(error.message, true)));

$("add-product").addEventListener("click", () => {
  $("product-form").classList.remove("hidden");
  $("product-name").focus();
});

$("cancel-product").addEventListener("click", resetProductForm);

$("product-form").addEventListener("submit", async event => {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  const product = {
    name: String(form.get("name") || "").trim(),
    sku: String(form.get("sku") || "").trim(),
    type: String(form.get("type") || "Product").trim(),
    category: String(form.get("category") || "").trim(),
    description: String(form.get("description") || "").trim(),
    price: Number(form.get("price") || 0),
    stock: Number(form.get("stock") || 0),
    featured: form.get("featured") === "on"
  };

  $("product-form-status").textContent = "Saving product…";
  try {
    await createProduct(state.token, product);
    resetProductForm();
    await loadCatalogue();
    setStatus("Product created and saved to the persistent catalogue.");
  } catch (error) {
    $("product-form-status").textContent = error.message;
  }
});

$("logout").addEventListener("click", () => {
  state.token = "";
  sessionStorage.removeItem("oregano.admin.token");
  $("products").innerHTML = "";
  resetProductForm();
  showLogin();
});

if (state.token) {
  showWorkspace();
  loadCatalogue().catch(error => {
    state.token = "";
    sessionStorage.removeItem("oregano.admin.token");
    showLogin();
    $("login-status").textContent = error.message;
  });
}
