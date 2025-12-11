import api from './client';

export const revisionsApi = {
  getAll: async (params = {}) => {
    const response = await api.get('/revisions', { params });
    // Se a resposta tiver paginação, retornar estrutura paginada
    if (response.data.data && response.data.pagination) {
      return response.data;
    }
    // Compatibilidade com versão antiga (sem paginação)
    return { data: response.data, pagination: null };
  },
  
  getPending: async (params = {}) => {
    const response = await api.get('/revisions/pending', { params });
    // Se a resposta tiver paginação, retornar estrutura paginada
    if (response.data.data && response.data.pagination) {
      return response.data;
    }
    // Compatibilidade com versão antiga (sem paginação)
    return { data: response.data, pagination: null };
  },
  
  getById: async (id) => {
    const response = await api.get(`/revisions/${id}`);
    return response.data;
  },
  
  create: async (data) => {
    const response = await api.post('/revisions', data);
    return response.data;
  },
  
  update: async (id, data) => {
    const response = await api.put(`/revisions/${id}`, data);
    return response.data;
  },
  
  complete: async (id) => {
    const response = await api.post(`/revisions/${id}/complete`);
    return response.data;
  },
  
  delete: async (id) => {
    await api.delete(`/revisions/${id}`);
  },
};





