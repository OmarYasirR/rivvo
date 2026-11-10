import api from './api';

const uploadService = {
  uploadImage: (file, folder = 'rivvo/posts') => {
    const formData = new FormData();
    formData.append('image', file);
    formData.append('folder', folder);
    return api
      .post('/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
      .then((r) => r.data); // { url, publicId }
  },
};

export default uploadService;
