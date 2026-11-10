import api from './api';

const postService = {
  getFeed: (page = 1, feed = 'all') =>
    api.get('/posts', { params: feed === 'following' ? { page, feed } : { page } }).then((r) => r.data),
  explore: ({ q, tag, sort, media, page = 1 } = {}) => {
    const params = { page };
    if (q) params.q = q;
    if (tag) params.tag = tag;
    if (sort) params.sort = sort;
    if (media) params.media = '1';
    return api.get('/posts/explore', { params }).then((r) => r.data);
  },
  trendingTags: () => api.get('/posts/tags/trending').then((r) => r.data),
  getSaved: (page = 1) => api.get('/posts/saved', { params: { page } }).then((r) => r.data),
  getById: (id) => api.get(`/posts/${id}`).then((r) => r.data),
  create: (data) => api.post('/posts', data).then((r) => r.data),
  update: (id, data) => api.put(`/posts/${id}`, data).then((r) => r.data),
  remove: (id) => api.delete(`/posts/${id}`).then((r) => r.data),
  save: (id) => api.post(`/posts/${id}/save`).then((r) => r.data),
  unsave: (id) => api.delete(`/posts/${id}/save`).then((r) => r.data),
  like: (id) => api.post(`/posts/${id}/like`).then((r) => r.data),
  unlike: (id) => api.delete(`/posts/${id}/like`).then((r) => r.data),
  addComment: (id, text) => api.post(`/posts/${id}/comments`, { text }).then((r) => r.data),
  getComments: (id) => api.get(`/posts/${id}/comments`).then((r) => r.data),
};

export default postService;
