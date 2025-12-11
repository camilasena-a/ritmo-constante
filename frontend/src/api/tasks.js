import api from './client';

export const tasksApi = {
  getAll: async (params = {}) => {
    const response = await api.get('/tasks', { params });
    // Se a resposta tiver paginação, retornar estrutura paginada
    if (response.data.data && response.data.pagination) {
      return response.data;
    }
    // Compatibilidade com versão antiga (sem paginação)
    return { data: response.data, pagination: null };
  },
  
  getById: async (id) => {
    const response = await api.get(`/tasks/${id}`);
    return response.data;
  },
  
  create: async (data) => {
    const response = await api.post('/tasks', data);
    return response.data;
  },
  
  update: async (id, data) => {
    const response = await api.put(`/tasks/${id}`, data);
    return response.data;
  },
  
  delete: async (id) => {
    await api.delete(`/tasks/${id}`);
  },
};












