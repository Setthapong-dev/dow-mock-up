import axios from 'axios';

const api = axios.create({
  baseURL: `${import.meta.env.VITE_SERVER_URL ?? 'http://localhost:5000'}/api`,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const url = String(error.config?.url ?? '');
    // อย่า redirect ตอน login/register ล้มเหลว (401 = รหัสผิด) — จะได้ไม่รีเฟรชหน้าและเคลียร์ error message
    const isAuthPublicEndpoint =
      url.includes('/auth/login') || url.includes('/auth/register');

    if (status === 401 && !isAuthPublicEndpoint) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
