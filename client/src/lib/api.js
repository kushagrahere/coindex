// Centralised API client — auto-attaches JWT, handles 401 token refresh

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const getToken = () => localStorage.getItem('coindex_access_token');
const getRefreshToken = () => localStorage.getItem('coindex_refresh_token');
const setTokens = (access, refresh) => {
  localStorage.setItem('coindex_access_token', access);
  if (refresh) localStorage.setItem('coindex_refresh_token', refresh);
};
const clearTokens = () => {
  localStorage.removeItem('coindex_access_token');
  localStorage.removeItem('coindex_refresh_token');
};

let _refreshPromise = null;

const tryRefresh = async () => {
  if (_refreshPromise) return _refreshPromise;
  _refreshPromise = (async () => {
    const rt = getRefreshToken();
    if (!rt) throw new Error('No refresh token');
    const res = await fetch(`${BASE}/api/v1/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: rt }),
    });
    if (!res.ok) { clearTokens(); throw new Error('Session expired'); }
    const { data } = await res.json();
    setTokens(data.accessToken, data.refreshToken);
    return data.accessToken;
  })().finally(() => { _refreshPromise = null; });
  return _refreshPromise;
};

const request = async (path, options = {}, retry = true) => {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };
  const res = await fetch(`${BASE}${path}`, { ...options, headers });
  if (res.status === 401 && retry) {
    try {
      await tryRefresh();
      return request(path, options, false);
    } catch {
      clearTokens();
      window.location.href = '/';
      throw new Error('Session expired');
    }
  }
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(json.error || 'Request failed');
    err.code = json.code;
    err.status = res.status;
    throw err;
  }
  return json;
};

export const api = {
  // Auth
  auth: {
    register: (body) => request('/api/v1/auth/register', { method: 'POST', body: JSON.stringify(body) }),
    login:    (body) => request('/api/v1/auth/login',    { method: 'POST', body: JSON.stringify(body) }),
    logout:   ()     => request('/api/v1/auth/logout',   { method: 'POST' }),
    me:       ()     => request('/api/v1/auth/me'),
  },
  // Market
  market: {
    assets:    (params = {}) => request(`/api/v1/market/assets?${new URLSearchParams(params)}`),
    ticker:    (id)          => request(`/api/v1/market/ticker/${id}`),
    ohlcv:     (id, days=1)  => request(`/api/v1/market/ohlcv/${id}?days=${days}`),
    trending:  ()            => request('/api/v1/market/trending'),
    search:    (q)           => request(`/api/v1/market/search?q=${encodeURIComponent(q)}`),
    orderbook: (id)          => request(`/api/v1/market/orderbook/${id}`),
  },
  // Helpers
  setTokens,
  clearTokens,
  getToken,
};
