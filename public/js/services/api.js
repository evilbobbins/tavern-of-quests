import { CONFIG } from '../config.js';

export async function apiFetch(url, options = {}) {
  try {
    const res = await fetch(CONFIG.API_BASE + url, options);
    if (!res.ok) throw new Error('Server returned ' + res.status);
    return await res.json();
  } catch (err) {
    console.error('API Error:', err);
    return { success: false, error: err.message };
  }
}

export async function loadUsers() {
  const result = await apiFetch('/api/users');
  return result.success ? result.users : [];
}

export async function loadState(userId) {
  const result = await apiFetch(`/api/state?userId=${userId}`);
  return result.success && result.data ? result.data : null;
}

export async function saveState(userId, state) {
  return await apiFetch(`/api/state?userId=${userId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(state)
  });
}

export async function createUser(name, avatar) {
  return await apiFetch('/api/users', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, avatar })
  });
}

export async function updateUser(userId, data) {
  return await apiFetch(`/api/users/${userId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
}

export async function deleteUser(userId) {
  return await apiFetch(`/api/users/${userId}`, { method: 'DELETE' });
}