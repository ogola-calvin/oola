import { API_BASE_URL, AUTH_TOKEN_STORAGE_KEY } from './config.js';

export function getAuthToken() {
  return window.localStorage.getItem(AUTH_TOKEN_STORAGE_KEY) || '';
}

export function setAuthToken(token) {
  window.localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, token);
}

/**
 * Calls the API and normalizes the response.
 * Expects the documented envelope: { message, success, code, data }.
 * Throws an Error with a readable message on failure so callers can
 * just try/catch and show err.message to the user.
 */
export async function apiPost(path, body) {
  const token = getAuthToken();

  let res;
  try {
    res = await fetch(`${API_BASE_URL}/${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(body),
    });
  } catch (networkErr) {
    throw new Error(
      `Could not reach the API at ${API_BASE_URL}. Is the backend running and is the URL correct? (${networkErr.message})`
    );
  }

  let payload;
  try {
    payload = await res.json();
  } catch {
    throw new Error(`Server returned a non-JSON response (HTTP ${res.status}).`);
  }

  if (!res.ok || payload.success === false) {
    const detail = payload.errors ? ` — ${JSON.stringify(payload.errors)}` : '';
    throw new Error((payload.message || `Request failed (HTTP ${res.status})`) + detail);
  }

  return payload.data;
}

export async function apiGet(path, query = {}) {
  const token = getAuthToken();
  const qs = new URLSearchParams(query).toString();
  const url = `${API_BASE_URL}/${path}${qs ? `?${qs}` : ''}`;

  let res;
  try {
    res = await fetch(url, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
  } catch (networkErr) {
    throw new Error(`Could not reach the API at ${API_BASE_URL}. (${networkErr.message})`);
  }

  const payload = await res.json();
  if (!res.ok || payload.success === false) {
    throw new Error(payload.message || `Request failed (HTTP ${res.status})`);
  }
  return payload.data;
}
