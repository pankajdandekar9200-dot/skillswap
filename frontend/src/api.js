/**
 * API client — all HTTP calls to the SkillSwap backend.
 */

const API_BASE = 'http://localhost:8000/api/v1';

function getToken() {
  return localStorage.getItem('skillswap_token');
}

function setTokens(access, refresh) {
  localStorage.setItem('skillswap_token', access);
  localStorage.setItem('skillswap_refresh', refresh);
}

function clearTokens() {
  localStorage.removeItem('skillswap_token');
  localStorage.removeItem('skillswap_refresh');
}

async function request(path, options = {}) {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  if (res.status === 204) return null;

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.detail || 'Something went wrong. Please try again.');
  }

  return data;
}

// ── Auth ─────────────────────────────────────────────────

export async function signup(name, email, password, college) {
  const data = await request('/auth/signup', {
    method: 'POST',
    body: JSON.stringify({ name, email, password, college: college || null }),
  });
  setTokens(data.access_token, data.refresh_token);
  return data;
}

export async function login(email, password) {
  const data = await request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  setTokens(data.access_token, data.refresh_token);
  return data;
}

export function logout() {
  clearTokens();
}

export function isLoggedIn() {
  return !!getToken();
}

// ── Users ────────────────────────────────────────────────

export async function getMe() {
  return request('/users/me');
}

export async function updateMe(data) {
  return request('/users/me', {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function getUser(id) {
  return request(`/users/${id}`);
}

// ── Skills ───────────────────────────────────────────────

export async function getSkills(category) {
  const q = category ? `?category=${encodeURIComponent(category)}` : '';
  return request(`/skills${q}`);
}

export async function addUserSkill(skillId, type, proficiencyLevel) {
  return request('/users/me/skills', {
    method: 'POST',
    body: JSON.stringify({
      skill_id: skillId,
      type,
      proficiency_level: proficiencyLevel,
    }),
  });
}

export async function removeUserSkill(skillId) {
  return request(`/users/me/skills/${skillId}`, { method: 'DELETE' });
}

export async function getMySkills() {
  return request('/users/me/skills');
}

// ── Availability ─────────────────────────────────────────

export async function getMyAvailability() {
  return request('/users/me/availability');
}

export async function addAvailability(data) {
  return request('/users/me/availability', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function removeAvailability(id) {
  return request(`/users/me/availability/${id}`, { method: 'DELETE' });
}

// ── Matching ─────────────────────────────────────────────

export async function getMatches(filters = {}) {
  const params = new URLSearchParams();
  if (filters.skill) params.set('skill', filters.skill);
  if (filters.mode) params.set('mode', filters.mode);
  const q = params.toString() ? `?${params}` : '';
  return request(`/matches${q}`);
}

// ── Exchange Requests ────────────────────────────────────

export async function createExchangeRequest(data) {
  return request('/exchange-requests', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function getExchangeRequests(status) {
  const q = status ? `?status=${status}` : '';
  return request(`/exchange-requests${q}`);
}

export async function getExchangeRequest(id) {
  return request(`/exchange-requests/${id}`);
}

export async function updateExchangeRequest(id, status) {
  return request(`/exchange-requests/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
}

// ── Sessions ─────────────────────────────────────────────

export async function createSession(data) {
  return request('/sessions', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function getSessions(status) {
  const q = status ? `?status=${status}` : '';
  return request(`/sessions${q}`);
}

export async function getSession(id) {
  return request(`/sessions/${id}`);
}

export async function updateSession(id, data) {
  return request(`/sessions/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

// ── Reviews ──────────────────────────────────────────────

export async function createReview(sessionId, data) {
  return request(`/sessions/${sessionId}/review`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function getUserReviews(userId) {
  return request(`/users/${userId}/reviews`);
}

// ── Credits ──────────────────────────────────────────────

export async function getMyCredits() {
  return request('/credits/me');
}

export async function getMyTransactions() {
  return request('/credits/me/transactions');
}
