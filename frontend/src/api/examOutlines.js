import api from './client';

export const examOutlinesApi = {
  getAll: async (params = {}) => {
    const response = await api.get('/exam-outlines', { params });
    return response.data;
  },
  
  getById: async (id) => {
    const response = await api.get(`/exam-outlines/${id}`);
    return response.data;
  },
  
  create: async (data) => {
    const response = await api.post('/exam-outlines', data);
    return response.data;
  },
  
  update: async (id, data) => {
    const response = await api.put(`/exam-outlines/${id}`, data);
    return response.data;
  },
  
  delete: async (id) => {
    await api.delete(`/exam-outlines/${id}`);
  },
  
  addItem: async (outlineId, data) => {
    const response = await api.post(`/exam-outlines/${outlineId}/items`, data);
    return response.data;
  },
  
  updateItem: async (outlineId, itemId, data) => {
    const response = await api.put(`/exam-outlines/${outlineId}/items/${itemId}`, data);
    return response.data;
  },
  
  deleteItem: async (outlineId, itemId) => {
    await api.delete(`/exam-outlines/${outlineId}/items/${itemId}`);
  },
};





