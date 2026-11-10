import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('rivvo_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  config.headers['Accept-Language'] = localStorage.getItem('rivvo_lang') || 'en';
  return config;
});

export default api;
