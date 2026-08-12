import {
  listProducts,
  createProduct,
  updateProduct,
  deleteProduct
} from "../assets/js/services/product-service.js";
import {
  listApplications,
  getApplication,
  updateApplication,
  transitionApplication
} from "../assets/js/services/application-service.js";

const state = {
  token: sessionStorage.getItem("oregano.admin.token") || "",
  editingId: null,
  deletingId: null,
  selectedApplicationId: null,
  applications: []
};

const APPLICATION_TRANSITIONS = Object.freeze({
  draft: ["submitted"],
  submitted: ["under_review"],
  under_review: ["approved", "denied"],
  approved: ["payment_pending", "active"],
  denied: [],
  payment_pending: ["active"],
  active: []
});

const $ = id => document.getElementById(id);
const escapeHtml = value => String(value ?? "").replace(/[&<>'"]/g, char => ({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;","\"":"&quot;"}[char]));
const formatDate = value => value ? new Date(value).toLocaleString() : "—";

const showWorkspace = () => { $("login").classList.add("hidden"); $("workspace").classList.remove("hidden"); };
const showLogin = () => { $("workspace").classList.add("hidden"); $("login").classList.remove("hidden"); };
const setStatus = (message, isError = false) => {
  $("workspace-status").textContent = message;
  $("workspace-status").classList.toggle("danger", isError);
};

const closeDeleteConfirmation = () => {
  state.deletingId = null;
  $("delete-confirm").classList.add("hidden");
  $("delete-status").textContent = "";
};

const renderProducts = products => {
  $("product-count").textContent = products.length;
  $("products").innerHTML = products.length ? products.map(product => `
    <div class="row">
      <div class="row-main"><strong>${escapeHtml(product.name)}</strong><span class="muted">${escapeHtml(product.sku || "No SKU")} · ${escapeHtml(product.category || "Uncategorised")}</span></div>
      <div class="row-actions"><span class="badge">${escapeHtml(product.type || "Product")}</span><button class="btn secondary edit-product" data-id="${escapeHtml(product.id)}" type="button">Edit</button><button class="btn danger delete-product" data-id="${escapeHtml(product.id)}" type="button">Delete</button></div>
    </div>`).join("") : `<div class="empty">No catalogue products found.</div>`;
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

const loadApplications = async () => {
  $("application-status").textContent = "Loading applications…";
  const data = await listApplications(state.token);
  state.applications = Array.isArray(data.applications) ? data.applications : [];
  renderApplications(state.applications);
  $("application-status").textContent = `Loaded ${state.applications.length} application${state.applications.length === 1 ? "" : "s"} from backend.`;
};

const applicationName = application => application?.applicant?.name || "Unnamed applicant";
const applicationEmail = application => application?.applicant?.email || "No email provided";

const renderApplications = applications => {
  $("application-count").textContent = applications.length;
  $("applications").innerHTML = applications.length ? applications.map(application => `
    <div class="row">
      <div class="row-main"><strong>${escapeHtml(applicationName(application))}</strong><span class="muted">${escapeHtml(applicationEmail(application))} · ${escapeHtml(formatDate(application.createdAt))}</span></div>
      <div class="row-actions"><span class="badge status-${escapeHtml(application.status)}">${escapeHtml(application.status || "unknown")}</span><button class="btn secondary view-application" data-id="${escapeHtml(application.id)}" type="button">Review</button></div>
    </div>`).join("") : `<div class="empty">No member applications have been submitted yet.</div>`;
  document.querySelectorAll(".view-application").forEach(button => button.addEventListener("click", () => openApplication(button.dataset.id)));
};

const renderApplicationDetail = application => {
  if (!application) return;
  state.selectedApplicationId = application.id;
  $("application-detail").classList.remove("hidden");
  $("application-detail-title").textContent = `${applicationName(application)} — Application`;
  const applicant = application.applicant || {};
  $("application-meta").innerHTML = `
    <div class="meta-card"><span class="muted">Status</span><strong>${escapeHtml(application.status || "—")}</strong></div>
    <div class="meta-card"><span class="muted">Payment</span><strong>${escapeHtml(application.paymentDecision || "Not decided")}</strong></div>
    <div class="meta-card"><span class="muted">Submitted</span><strong>${escapeHtml(formatDate(application.createdAt))}</strong></div>`;

  const form = $("application-form");
  form.elements.name.value = applicant.name || "";
  form.elements.email.value = applicant.email || "";
  form.elements.phone.value = applicant.phone || "";
  form.elements.location.value = applicant.location || "";
  form.elements.reason.value = applicant.reason || "";
  $("application-form-status").textContent = "";
  $("transition-status").textContent = "";

  const nextStatuses = APPLICATION_TRANSITIONS[application.status] || [];
  const nextStatus = $("application-next-status");
  nextStatus.innerHTML = nextStatuses.length
    ? nextStatuses.map(status => `<option value="${escapeHtml(status)}">${escapeHtml(status)}</option>`).join("")
    : `<option value="">No valid transitions</option>`;
  $("transition-application").disabled = nextStatuses.length === 0;
  updatePaymentDecisionVisibility();
  $("application-detail").scrollIntoView({ behavior: "smooth", block: "start" });
};

const openApplication = async id => {
  $("application-status").textContent = "Loading application…";
  try {
    const data = await getApplication(state.token, id);
    renderApplicationDetail(data.application);
    $("application-status").textContent = "Application loaded.";
  } catch (error) {
    $("application-status").textContent = error.message;
  }
};

const closeApplication = () => {
  state.selectedApplicationId = null;
  $("application-detail").classList.add("hidden");
};

const updatePaymentDecisionVisibility = () => {
  const selectedStatus = $("application-next-status").value;
  $("payment-decision-field").classList.toggle("hidden", selectedStatus !== "payment_pending" && selectedStatus !== "active");
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
    await Promise.all([loadCatalogue(), loadApplications()]);
  } catch (error) {
    state.token = "";
    $("login-status").textContent = error.message;
  }
});

$("refresh").addEventListener("click", () => loadCatalogue().catch(error => setStatus(error.message, true)));
$("refresh-applications").addEventListener("click", () => loadApplications().catch(error => { $("application-status").textContent = error.message; }));
$("add-product").addEventListener("click", () => { closeDeleteConfirmation(); resetProductForm(); $("product-form").classList.remove("hidden"); $("product-name").focus(); });
$("cancel-product").addEventListener("click", resetProductForm);
$("cancel-delete").addEventListener("click", closeDeleteConfirmation);
$("close-application").addEventListener("click", closeApplication);
$("application-next-status").addEventListener("change", updatePaymentDecisionVisibility);

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

$("application-form").addEventListener("submit", async event => {
  event.preventDefault();
  if (!state.selectedApplicationId) return;
  const form = new FormData(event.currentTarget);
  const applicant = {
    name: String(form.get("name") || "").trim(),
    email: String(form.get("email") || "").trim(),
    phone: String(form.get("phone") || "").trim(),
    location: String(form.get("location") || "").trim(),
    reason: String(form.get("reason") || "").trim()
  };
  $("application-form-status").textContent = "Saving applicant details…";
  try {
    const result = await updateApplication(state.token, state.selectedApplicationId, { applicant });
    renderApplicationDetail(result.application);
    await loadApplications();
    $("application-form-status").textContent = "Applicant details saved.";
  } catch (error) {
    $("application-form-status").textContent = error.message;
  }
});

$("transition-application").addEventListener("click", async () => {
  if (!state.selectedApplicationId) return;
  const status = $("application-next-status").value;
  if (!status) return;
  const paymentDecision = $("application-payment-decision").value;
  $("transition-status").textContent = "Applying transition…";
  try {
    const result = await transitionApplication(state.token, state.selectedApplicationId, status, paymentDecision);
    renderApplicationDetail(result.application);
    await loadApplications();
    $("transition-status").textContent = `Application moved to ${status}.`;
  } catch (error) {
    $("transition-status").textContent = error.message;
  }
});

$("logout").addEventListener("click", () => {
  state.token = "";
  sessionStorage.removeItem("oregano.admin.token");
  $("products").innerHTML = "";
  $("applications").innerHTML = "";
  state.applications = [];
  $("application-count").textContent = "—";
  closeApplication();
  resetProductForm();
  closeDeleteConfirmation();
  showLogin();
});

if (state.token) {
  showWorkspace();
  Promise.all([loadCatalogue(), loadApplications()]).catch(error => {
    state.token = "";
    sessionStorage.removeItem("oregano.admin.token");
    showLogin();
    $("login-status").textContent = error.message;
  });
}
