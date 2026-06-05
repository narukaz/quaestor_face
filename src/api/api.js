const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

function getToken() {
  return localStorage.getItem('quaestor_token');
}

function authHeaders() {
  const token = getToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
}

async function handleResponse(res) {
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Request failed');
  }
  return data;
}

export const api = {
  // Auth
  register: (body) =>
    fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    }).then(handleResponse),

  login: (body) =>
    fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    }).then(handleResponse),

  me: () =>
    fetch(`${BASE_URL}/api/auth/me`, { headers: authHeaders() }).then(handleResponse),

  // Expenses
  getExpenses: (type) =>
    fetch(`${BASE_URL}/api/expenses${type ? `?type=${type}` : ''}`, {
      headers: authHeaders()
    }).then(handleResponse),

  addExpense: (body) =>
    fetch(`${BASE_URL}/api/expenses`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(body)
    }).then(handleResponse),

  deleteExpense: (id) =>
    fetch(`${BASE_URL}/api/expenses/${id}`, {
      method: 'DELETE',
      headers: authHeaders()
    }).then(handleResponse),

  // Budgets
  getBudgetTracking: () =>
    fetch(`${BASE_URL}/api/budgets/tracking`, { headers: authHeaders() }).then(handleResponse),

  setBudget: (body) =>
    fetch(`${BASE_URL}/api/budgets`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(body)
    }).then(handleResponse),

  // Family
  getFamily: () =>
    fetch(`${BASE_URL}/api/family`, { headers: authHeaders() }).then(handleResponse),

  createFamily: (name) =>
    fetch(`${BASE_URL}/api/family/create`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ name })
    }).then(handleResponse),

  inviteToFamily: (usernameOrEmail) =>
    fetch(`${BASE_URL}/api/family/invite`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ usernameOrEmail })
    }).then(handleResponse),

  acceptInvite: (inviteId) =>
    fetch(`${BASE_URL}/api/family/invite/${inviteId}/accept`, {
      method: 'POST',
      headers: authHeaders()
    }).then(handleResponse),

  rejectInvite: (inviteId) =>
    fetch(`${BASE_URL}/api/family/invite/${inviteId}/reject`, {
      method: 'POST',
      headers: authHeaders()
    }).then(handleResponse),

  removeFamilyMember: (memberId) =>
    fetch(`${BASE_URL}/api/family/members/${memberId}`, {
      method: 'DELETE',
      headers: authHeaders()
    }).then(handleResponse),

  // Notifications
  getNotifications: () =>
    fetch(`${BASE_URL}/api/notifications`, { headers: authHeaders() }).then(handleResponse),

  markNotificationRead: (id) =>
    fetch(`${BASE_URL}/api/notifications/${id}/read`, {
      method: 'PATCH',
      headers: authHeaders()
    }).then(handleResponse),

  dismissNotification: (id) =>
    fetch(`${BASE_URL}/api/notifications/${id}`, {
      method: 'DELETE',
      headers: authHeaders()
    }).then(handleResponse),

  markAllRead: () =>
    fetch(`${BASE_URL}/api/notifications/read-all`, {
      method: 'PATCH',
      headers: authHeaders()
    }).then(handleResponse),

  // Check if a user email exists and is available to invite
  checkUser: (email) =>
    fetch(`${BASE_URL}/api/auth/check-user?email=${encodeURIComponent(email)}`, {
      headers: authHeaders()
    }).then(handleResponse),

  // Budgets (month-aware)
  getBudgets: () =>
    fetch(`${BASE_URL}/api/budgets`, { headers: authHeaders() }).then(handleResponse),

  updateBudget: (id, body) =>
    fetch(`${BASE_URL}/api/budgets/${id}`, {
      method: 'PATCH',
      headers: authHeaders(),
      body: JSON.stringify(body)
    }).then(handleResponse)
};

