export function getBackendBase() {
  const backend = import.meta.env.VITE_BACKEND_URL;
  if (!backend) throw new Error("Falta VITE_BACKEND_URL en .env");
  return backend.replace(/\/+$/, "");
}

export async function authFetch(path, options = {}) {
  const base = getBackendBase();
  const token = localStorage.getItem("token");

  const headers = {
    ...(options.headers || {}),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  // Por defecto mandamos JSON si hay body
  if (options.body && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }

  const resp = await fetch(`${base}${path}`, { ...options, headers });
  return resp;
}
