import api from './api';

const storyService = {
  getActive: () => api.get('/stories').then((r) => r.data),
  create: (data) => api.post('/stories', data).then((r) => r.data),
  markViewed: (id) => api.post(`/stories/${id}/view`).then((r) => r.data),
};

export default storyService;
