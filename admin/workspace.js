const API_BASE = "http://localhost:3000/api/v1";

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

const renderProducts = products => {
  $("product-count").textContent = products.length;
  $("products").innerHTML = products.map(product => `
    <div class="row">
      <div><strong>${escapeHtml(product.name)}</strong><span class="muted">${escapeHtml(product.sku || "No SKU")} · ${escapeHtml(product.category || "Uncategorised")}</span></div>
      <span class="badge">${escapeHtml(product.type || "Product")}</span>
    </div>`).join("");
};

const escapeHtml = value => String(value ?? "").replace(/[&<>'"]/g, char => ({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;","\"":"&quot;"}[char]));

const loadCatalogue = async () => {
  $("workspace-status").textContent = "Loading catalogue…";
  const response = await fetch(`${API_BASE}/catalogue`, { headers: { Authorization: `Bearer ${state.token}` } });
  if (response.status === 401) throw new Error("Admin session is not authorised.");
  if (!response.ok) throw new Error(`Catalogue request failed (${response.status}).`);
  const data = await response.json();
  renderProducts(data.products || []);
  $("workspace-status").textContent = "Catalogue loaded from backend.";
};

$("login-form").addEventListener("submit", async event => {
  event.preventDefault();
  const token = $("token").value.trim();
  $("login-status").textContent = "Checking access…";
  try {
    const response = await fetch(`${API_BASE}/catalogue`, { headers: { Authorization: `Bearer ${token}` } });
    if (!response.ok) throw new Error(response.status === 401 ? "Invalid admin credentials." : `Backend returned ${response.status}.`);
    state.token = token;
    sessionStorage.setItem("oregano.admin.token", token);
    $("token").value = "";
    showWorkspace();
    await loadCatalogue();
  } catch (error) {
    $("login-status").textContent = error.message;
  }
});

$("refresh").addEventListener("click", () => loadCatalogue().catch(error => { $("workspace-status").textContent = error.message; }));

$("logout").addEventListener("click", () => {
  state.token = "";
  sessionStorage.removeItem("oregano.admin.token");
  $("products").innerHTML = "";
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
