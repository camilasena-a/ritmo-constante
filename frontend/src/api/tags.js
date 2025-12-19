import api from './client';

export const tagsApi = {
  getAll: async () => {
    const response = await api.get('/tags');
    return response.data;
  },
  
  getById: async (id) => {
    const response = await api.get(`/tags/${id}`);
    return response.data;
  },
  
  create: async (data) => {
    const response = await api.post('/tags', data);
    return response.data;
  },
  
  update: async (id, data) => {
    const response = await api.put(`/tags/${id}`, data);
    return response.data;
  },
  
  delete: async (id) => {
    await api.delete(`/tags/${id}`);
  },
};





