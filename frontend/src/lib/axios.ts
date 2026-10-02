import axios, { AxiosError } from 'axios';
import { tokenStorage } from './token';

export const UNAUTHORIZED_EVENT = 'auth:unauthorized';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://127.0.0.1:8000/api',
  headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = tokenStorage.get();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    // A 401 on /login just means wrong credentials, so ignore it there
    const isLogin = error.config?.url === '/login';
    if (error.response?.status === 401 && !isLogin) {
      tokenStorage.clear();
      window.dispatchEvent(new Event(UNAUTHORIZED_EVENT));
    }
    return Promise.reject(error);
  },
);

export default api;