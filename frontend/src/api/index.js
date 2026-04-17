const API_BASE = '/api';

function getToken() {
  return localStorage.getItem('kubera_token');
}

function setToken(token) {
  localStorage.setItem('kubera_token', token);
}

function setUser(user) {
  localStorage.setItem('kubera_user', JSON.stringify(user));
}

function getUser() {
  const u = localStorage.getItem('kubera_user');
  return u ? JSON.parse(u) : null;
}

function clearAuth() {
  localStorage.removeItem('kubera_token');
  localStorage.removeItem('kubera_user');
}

async function request(endpoint, options = {}) {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers
  };

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || 'Request failed');
  }

  return data;
}

// ── Auth ─────────────────────────────────────────
export async function login(phone, pin) {
  const data = await request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ phone, pin })
  });
  setToken(data.token);
  setUser(data.user);
  return data;
}

export async function register(name, phone, pin, email) {
  const data = await request('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ name, phone, pin, email })
  });
  setToken(data.token);
  setUser(data.user);
  return data;
}

export async function verifyPin(pin) {
  return request('/auth/verify-pin', {
    method: 'POST',
    body: JSON.stringify({ pin })
  });
}

// ── Bank ─────────────────────────────────────────
export async function getBalance() {
  return request('/bank/balance');
}

export async function getAccount() {
  return request('/bank/account');
}

export async function getMyQR() {
  return request('/bank/qr');
}

export async function getContacts() {
  return request('/bank/contacts');
}

export async function lookupAccount(identifier) {
  return request(`/bank/lookup/${identifier}`);
}

export async function getCards() {
  return request('/bank/cards');
}

export async function toggleCard(cardNumber) {
  return request('/bank/cards/toggle', {
    method: 'POST',
    body: JSON.stringify({ cardNumber })
  });
}

// ── Payment ──────────────────────────────────────
export async function paymentPay(toAccount, amount, pin, category, note, customRoundUp) {
  return request('/payment/pay', {
    method: 'POST',
    body: JSON.stringify({ toAccount, amount: Number(amount), pin, category, note, customRoundUp })
  });
}

export async function paymentPreview(amount, toAccount) {
  return request('/payment/preview', {
    method: 'POST',
    body: JSON.stringify({ amount: Number(amount), toAccount })
  });
}

export async function getHistory(page = 1, limit = 20) {
  return request(`/payment/history?page=${page}&limit=${limit}`);
}

// ── Settings ─────────────────────────────────────
export async function getSettings() {
  return request('/settings');
}

export async function updateSettings(settings) {
  return request('/settings/update', {
    method: 'POST',
    body: JSON.stringify(settings)
  });
}

// ── Dashboard ────────────────────────────────────
export async function getDashboard() {
  return request('/dashboard');
}

// ── Investment ───────────────────────────────────
export async function getInvestment() {
  return request('/investment');
}

export async function updateAllocation(allocation) {
  return request('/investment/allocate', {
    method: 'POST',
    body: JSON.stringify(allocation)
  });
}

export async function investNow() {
  return request('/investment/invest-now', {
    method: 'POST'
  });
}

export async function getPortfolio() {
  return request('/investment/portfolio');
}

export async function sellAsset(asset, requestedPayout) {
  return request('/investment/sell', {
    method: 'POST',
    body: JSON.stringify({ asset, requestedPayout })
  });
}

export async function getAnalytics() {
  return request('/investment/analytics');
}

export { getToken, getUser, clearAuth, setUser, setToken };
