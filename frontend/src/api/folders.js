import api from './client';

export const foldersApi = {
  getAll: async () => {
    const response = await api.get('/folders');
    return response.data;
  },
  
  getById: async (id) => {
    const response = await api.get(`/folders/${id}`);
    return response.data;
  },
  
  create: async (data) => {
    const response = await api.post('/folders', data);
    return response.data;
  },
  
  update: async (id, data) => {
    const response = await api.put(`/folders/${id}`, data);
    return response.data;
  },
  
  delete: async (id) => {
    await api.delete(`/folders/${id}`);
  },
};


















