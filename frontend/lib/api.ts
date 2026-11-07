import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api',
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Handle 401 globally — but never hard-redirect while already on an auth page,
// otherwise a failed login attempt reloads the page and wipes the error message.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const onAuthPage =
      typeof window !== 'undefined' && /^\/(login|register)/.test(window.location.pathname);
    if (error.response?.status === 401 && typeof window !== 'undefined' && !onAuthPage) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
