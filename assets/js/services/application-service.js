const API_BASE = "http://localhost:3000/api/v1";

const request = async (path, { token = "", method = "GET", body } = {}) => {
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
    // Preserve the HTTP status error when the backend returns no JSON body.
  }

  if (!response.ok) {
    const error = new Error(data.error || `Request failed (${response.status}).`);
    error.status = response.status;
    throw error;
  }

  return data;
};

/**
 * Submit a new member application.
 * Public/member-facing operation: no admin token is required.
 */
export const submitApplication = applicant =>
  request("/applications", {
    method: "POST",
    body: { applicant }
  });

/**
 * Admin-only application operations.
 */
export const listApplications = token =>
  request("/applications", { token });

export const getApplication = (token, id) =>
  request(`/applications/${encodeURIComponent(id)}`, { token });

export const updateApplication = (token, id, changes) =>
  request(`/applications/${encodeURIComponent(id)}`, {
    token,
    method: "PUT",
    body: changes
  });

export const transitionApplication = (token, id, status, paymentDecision) =>
  request(`/applications/${encodeURIComponent(id)}/transition`, {
    token,
    method: "POST",
    body: { status, paymentDecision }
  });

const OreganoApplicationService = Object.freeze({
  submitApplication,
  listApplications,
  getApplication,
  updateApplication,
  transitionApplication
});

if (typeof window !== "undefined") {
  window.OreganoApplicationService = OreganoApplicationService;
}
