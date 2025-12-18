import api from './client';

export const goalsApi = {
  getAll: async (params = {}) => {
    const response = await api.get('/goals', { params });
    return response.data;
  },
  
  getById: async (id) => {
    const response = await api.get(`/goals/${id}`);
    return response.data;
  },
  
  create: async (data) => {
    const response = await api.post('/goals', data);
    return response.data;
  },
  
  update: async (id, data) => {
    const response = await api.put(`/goals/${id}`, data);
    return response.data;
  },
  
  delete: async (id) => {
    await api.delete(`/goals/${id}`);
  },

  getProgressOverview: async (period = 'week') => {
    const response = await api.get('/goals/progress/overview', { params: { period } });
    return response.data;
  },

  getProgress: async (id, days = 7) => {
    const response = await api.get(`/goals/${id}/progress`, { params: { days } });
    return response.data;
  },
};

