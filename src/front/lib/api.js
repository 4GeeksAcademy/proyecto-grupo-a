// src/front/lib/api.js

// ============================
// Helpers base
// ============================
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

// Helper para parsear JSON y lanzar error si no es ok
async function handleJSON(path, options = {}) {
  const res = await authFetch(path, options);
  let data = null;
  try {
    data = await res.json();
  } catch (_) {
    // puede ser vacío
  }
  if (!res.ok) {
    const msg = (data && (data.message || data.error)) || res.statusText;
    const err = new Error(msg);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

// Construir query strings fácilmente
function buildQuery(params = {}) {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") qs.set(k, v);
  });
  return qs.toString() ? `?${qs.toString()}` : "";
}

// ============================
// EVENTS
// ============================

export async function apiListEvents({ start, end } = {}) {
  return handleJSON(`/api/events${buildQuery({ start, end })}`);
}

export async function apiCreateEvent(body) {
  return handleJSON(`/api/events`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function apiUpdateEvent(id, body) {
  return handleJSON(`/api/events/${id}`, {
    method: "PUT",
    body: JSON.stringify(body),
  });
}

export async function apiDeleteEvent(id) {
  return handleJSON(`/api/events/${id}`, { method: "DELETE" });
}

// ============================
// TASKS
// ============================

export async function apiListTasks({ start, end } = {}) {
  return handleJSON(`/api/tasks${buildQuery({ start, end })}`);
}

export async function apiCreateTask(body) {
  return handleJSON(`/api/tasks`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function apiUpdateTask(id, body) {
  return handleJSON(`/api/tasks/${id}`, {
    method: "PUT",
    body: JSON.stringify(body),
  });
}

export async function apiDeleteTask(id) {
  return handleJSON(`/api/tasks/${id}`, { method: "DELETE" });
}

// ============================
// CALENDARS
// ============================

export async function apiListCalendars() {
  return handleJSON(`/api/calendars`);
}

export async function apiCreateCalendar(body) {
  return handleJSON(`/api/calendars`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function apiUpdateCalendar(id, body) {
  return handleJSON(`/api/calendars/${id}`, {
    method: "PUT",
    body: JSON.stringify(body),
  });
}

export async function apiDeleteCalendar(id) {
  return handleJSON(`/api/calendars/${id}`, { method: "DELETE" });
}

// ============================
// TASK GROUPS
// ============================

export async function apiListTaskGroups() {
  return handleJSON(`/api/task-groups`);
}

export async function apiCreateTaskGroup(body) {
  return handleJSON(`/api/task-groups`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function apiUpdateTaskGroup(id, body) {
  return handleJSON(`/api/task-groups/${id}`, {
    method: "PUT",
    body: JSON.stringify(body),
  });
}

export async function apiDeleteTaskGroup(id) {
  return handleJSON(`/api/task-groups/${id}`, { method: "DELETE" });
}
