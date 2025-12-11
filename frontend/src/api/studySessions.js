import api from './client';

export const studySessionsApi = {
  getAll: async (params = {}) => {
    const response = await api.get('/study-sessions', { params });
    // Se a resposta tiver paginação, retornar estrutura paginada
    if (response.data.data && response.data.pagination) {
      return response.data;
    }
    // Compatibilidade com versão antiga (sem paginação)
    return { data: response.data, pagination: null };
  },
  
  getById: async (id) => {
    const response = await api.get(`/study-sessions/${id}`);
    return response.data;
  },
  
  create: async (data) => {
    const response = await api.post('/study-sessions', data);
    return response.data;
  },
  
  update: async (id, data) => {
    const response = await api.put(`/study-sessions/${id}`, data);
    return response.data;
  },
  
  delete: async (id) => {
    await api.delete(`/study-sessions/${id}`);
  },
  
  getStats: async (period = 'week') => {
    const response = await api.get('/study-sessions/stats/summary', { params: { period } });
    return response.data;
  },
};





