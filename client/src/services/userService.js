import api from './api';

const userService = {
  getProfile: (username) => api.get(`/users/${username}`).then((r) => r.data),
  updateProfile: (data) => api.put('/users/me', data).then((r) => r.data),
  search: (query) => api.get('/users/search', { params: { q: query } }).then((r) => r.data),
  suggestions: () => api.get('/users/suggestions').then((r) => r.data),
  connections: (username, type) =>
    api.get(`/users/${username}/connections`, { params: { type } }).then((r) => r.data),
  follow: (id) => api.post(`/follow/${id}`).then((r) => r.data),
  unfollow: (id) => api.delete(`/follow/${id}`).then((r) => r.data),
};

export default userService;
