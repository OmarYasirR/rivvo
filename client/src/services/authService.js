import api from './api';

const authService = {
  login: (data) => api.post('/auth/login', data).then((r) => r.data),
  register: (data) => api.post('/auth/register', data).then((r) => r.data),
  logout: () => api.post('/auth/logout').then((r) => r.data),
  forgotPassword: (data) => api.post('/auth/forgot-password', data).then((r) => r.data),
};

export default authService;
