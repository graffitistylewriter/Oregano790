import {
  listProducts,
  createProduct,
  updateProduct,
  deleteProduct
} from "../assets/js/services/product-service.js";

const state = { token: sessionStorage.getItem("oregano.admin.token") || "", editingId: null, deletingId: null };
const $ = id => document.getElementById(id);

const showWorkspace = () => { $("login").classList.add("hidden"); $("workspace").classList.remove("hidden"); };
const showLogin = () => { $("workspace").classList.add("hidden"); $("login").classList.remove("hidden"); };
const setStatus = (message, isError = false) => {
  $("workspace-status").textContent = message;
  $("workspace-status").classList.toggle("danger", isError);
};
const escapeHtml = value => String(value ?? "").replace(/[&<>'"]/g, char => ({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;","\"":"&quot;"}[char]));

const closeDeleteConfirmation = () => {
  state.deletingId = null;
  $("delete-confirm").classList.add("hidden");
  $("delete-status").textContent = "";
};

const renderProducts = products => {
  $("product-count").textContent = products.length;
  $("products").innerHTML = products.map(product => `
    <div class="row">
      <div class="row-main"><strong>${escapeHtml(product.name)}</strong><span class="muted">${escapeHtml(product.sku || "No SKU")} · ${escapeHtml(product.category || "Uncategorised")}</span></div>
      <div class="row-actions"><span class="badge">${escapeHtml(product.type || "Product")}</span><button class="btn secondary edit-product" data-id="${escapeHtml(product.id)}" type="button">Edit</button><button class="btn danger delete-product" data-id="${escapeHtml(product.id)}" type="button">Delete</button></div>
    </div>`).join("");
  document.querySelectorAll(".edit-product").forEach(button => button.addEventListener("click", () => beginEdit(products.find(product => String(product.id) === String(button.dataset.id)))));
  document.querySelectorAll(".delete-product").forEach(button => button.addEventListener("click", () => beginDelete(products.find(product => String(product.id) === String(button.dataset.id)))));
};

const loadCatalogue = async () => {
  setStatus("Loading catalogue…");
  const data = await listProducts(state.token);
  renderProducts(data.products || []);
  setStatus("Catalogue loaded from backend.");
};

const resetProductForm = () => {
  state.editingId = null;
  $("product-form").reset();
  $("product-form").classList.add("hidden");
  $("product-form-title").textContent = "Add catalogue product";
  $("save-product").textContent = "Save product";
  $("product-form-status").textContent = "";
};

const beginEdit = product => {
  if (!product) return;
  closeDeleteConfirmation();
  state.editingId = product.id;
  const form = $("product-form");
  form.classList.remove("hidden");
  $("product-form-title").textContent = `Edit ${product.name || "catalogue product"}`;
  $("save-product").textContent = "Save changes";
  form.elements.name.value = product.name || "";
  form.elements.sku.value = product.sku || "";
  form.elements.type.value = product.type || "Product";
  form.elements.category.value = product.category || "";
  form.elements.price.value = product.price ?? 0;
  form.elements.stock.value = product.stock ?? 0;
  form.elements.description.value = product.description || "";
  form.elements.featured.checked = Boolean(product.featured);
  $("product-name").focus();
};

const beginDelete = product => {
  if (!product) return;
  resetProductForm();
  state.deletingId = product.id;
  $("delete-confirm").classList.remove("hidden");
  $("delete-confirm-text").textContent = `You are about to permanently remove “${product.name || product.id}” from the persistent catalogue. This cannot be undone.`;
  $("delete-status").textContent = "";
  $("confirm-delete").focus();
};

$("login-form").addEventListener("submit", async event => {
  event.preventDefault();
  const token = $("token").value.trim();
  $("login-status").textContent = "Checking access…";
  try {
    state.token = token;
    await listProducts(state.token);
    sessionStorage.setItem("oregano.admin.token", token);
    $("token").value = "";
    showWorkspace();
    await loadCatalogue();
  } catch (error) {
    state.token = "";
    $("login-status").textContent = error.message;
  }
});

$("refresh").addEventListener("click", () => loadCatalogue().catch(error => setStatus(error.message, true)));
$("add-product").addEventListener("click", () => { closeDeleteConfirmation(); resetProductForm(); $("product-form").classList.remove("hidden"); $("product-name").focus(); });
$("cancel-product").addEventListener("click", resetProductForm);
$("cancel-delete").addEventListener("click", closeDeleteConfirmation);

$("confirm-delete").addEventListener("click", async () => {
  const deletingId = state.deletingId;
  if (!deletingId) return;
  $("delete-status").textContent = "Deleting product…";
  try {
    await deleteProduct(state.token, deletingId);
    closeDeleteConfirmation();
    await loadCatalogue();
    setStatus("Product deleted from the persistent catalogue.");
  } catch (error) {
    $("delete-status").textContent = error.message;
  }
});

$("product-form").addEventListener("submit", async event => {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  const product = {
    name: String(form.get("name") || "").trim(), sku: String(form.get("sku") || "").trim(),
    type: String(form.get("type") || "Product").trim(), category: String(form.get("category") || "").trim(),
    description: String(form.get("description") || "").trim(), price: Number(form.get("price") || 0),
    stock: Number(form.get("stock") || 0), featured: form.get("featured") === "on"
  };
  const editingId = state.editingId;
  $("product-form-status").textContent = editingId ? "Saving changes…" : "Saving product…";
  try {
    if (editingId) await updateProduct(state.token, editingId, product);
    else await createProduct(state.token, product);
    resetProductForm();
    await loadCatalogue();
    setStatus(editingId ? "Product updated and saved to the persistent catalogue." : "Product created and saved to the persistent catalogue.");
  } catch (error) {
    $("product-form-status").textContent = error.message;
  }
});

$("logout").addEventListener("click", () => {
  state.token = ""; sessionStorage.removeItem("oregano.admin.token"); $("products").innerHTML = ""; resetProductForm(); closeDeleteConfirmation(); showLogin();
});

if (state.token) {
  showWorkspace();
  loadCatalogue().catch(error => { state.token = ""; sessionStorage.removeItem("oregano.admin.token"); showLogin(); $("login-status").textContent = error.message; });
}
