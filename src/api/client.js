const API_URL = import.meta.env.VITE_API_URL || "/api";

export function getToken() {
  return window.localStorage.getItem("bazm_token");
}

export function setToken(token) {
  if (token) {
    window.localStorage.setItem("bazm_token", token);
  } else {
    window.localStorage.removeItem("bazm_token");
  }
}

async function parseResponse(response) {
  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    return response.json();
  }
  return response.text();
}

export async function apiRequest(path, options = {}) {
  const token = getToken();
  const headers = new Headers(options.headers || {});

  if (!headers.has("Content-Type") && options.body) {
    headers.set("Content-Type", "application/json");
  }

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
    body: options.body && typeof options.body !== "string" ? JSON.stringify(options.body) : options.body
  });

  const data = await parseResponse(response);
  if (!response.ok) {
    const message = typeof data === "string" ? data : data.message || "Request failed.";
    throw new Error(message);
  }

  return data;
}

export async function downloadCsv(path, filename) {
  const token = getToken();
  const response = await fetch(`${API_URL}${path}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {}
  });

  if (!response.ok) {
    const data = await parseResponse(response);
    throw new Error(typeof data === "string" ? data : data.message || "Download failed.");
  }

  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
