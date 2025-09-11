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

// src/front/lib/api.js
export const API_URL = "https://fantastic-doodle-rxq9v5j5qvgh564r-3000.app.github.dev/api";

export async function fetchEvents() {
  try {
    const res = await fetch(`${API_URL}/events`);
    if (!res.ok) throw new Error("Error fetching events");
    const data = await res.json();
    return data; 
  } catch (err) {
    console.error(err);
    return [];
  }
}

export async function createEvent(event) {
  try {
    const res = await fetch(`${API_URL}/events`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(event),
    });
    if (!res.ok) throw new Error("Error creating event");
    return await res.json();
  } catch (err) {
    console.error(err);
    return null;
  }
}

export async function updateEvent(eventId, event) {
  try {
    const res = await fetch(`${API_URL}/events/${eventId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(event),
    });
    if (!res.ok) throw new Error("Error updating event");
    return await res.json();
  } catch (err) {
    console.error(err);
    return null;
  }
}
