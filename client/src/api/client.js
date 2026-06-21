import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || (import.meta.env.MODE === 'development' ? 'http://localhost:5000/api' : '/api'),
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;

  // God Mode (Impersonation) Mantığı
  let adminViewUserId = new URLSearchParams(window.location.search).get('adminViewUserId');
  if (adminViewUserId) {
    sessionStorage.setItem('adminViewUserId', adminViewUserId);
  } else {
    adminViewUserId = sessionStorage.getItem('adminViewUserId');
  }

  // Kullanıcı "Çıkış Yap" veya "Normal Moda Dön" derse sessionStorage temizlenecek.
  // URL'de clearAdminView varsa temizle
  if (new URLSearchParams(window.location.search).get('clearAdminView')) {
    sessionStorage.removeItem('adminViewUserId');
    adminViewUserId = null;
  }

  if (adminViewUserId) {
    if (config.method.toLowerCase() === 'get') {
      config.params = config.params || {};
      config.params.userId = adminViewUserId;
    } else if (['post', 'put', 'patch', 'delete'].includes(config.method.toLowerCase())) {
      if (config.data && typeof config.data === 'object' && !(config.data instanceof FormData)) {
        config.data.userId = adminViewUserId;
      } else if (!config.data) {
        config.data = { userId: adminViewUserId };
      }
    }
  }

  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(err);
  }
);

export default api;
