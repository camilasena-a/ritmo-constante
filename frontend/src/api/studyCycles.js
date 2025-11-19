import api from './client';

export const studyCyclesApi = {
  getAll: async () => {
    const response = await api.get('/study-cycles');
    return response.data;
  },
  
  getActive: async () => {
    const response = await api.get('/study-cycles/active');
    return response.data;
  },
  
  create: async (data) => {
    const response = await api.post('/study-cycles', data);
    return response.data;
  },
  
  update: async (id, data) => {
    const response = await api.put(`/study-cycles/${id}`, data);
    return response.data;
  },
  
  delete: async (id) => {
    await api.delete(`/study-cycles/${id}`);
  },
  
  addItem: async (cycleId, data) => {
    const response = await api.post(`/study-cycles/${cycleId}/items`, data);
    return response.data;
  },
  
  updateItem: async (cycleId, itemId, data) => {
    const response = await api.put(`/study-cycles/${cycleId}/items/${itemId}`, data);
    return response.data;
  },
  
  deleteItem: async (cycleId, itemId) => {
    await api.delete(`/study-cycles/${cycleId}/items/${itemId}`);
  },
  
  getNext: async (cycleId) => {
    const response = await api.get(`/study-cycles/${cycleId}/next`);
    return response.data;
  },
  
  advance: async (cycleId) => {
    const response = await api.post(`/study-cycles/${cycleId}/advance`);
    return response.data;
  },
};


