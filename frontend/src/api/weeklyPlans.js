import api from './client';

export const weeklyPlansApi = {
  getCurrent: async () => {
    const response = await api.get('/weekly-plans/current');
    return response.data;
  },
  
  getByWeek: async (date) => {
    const response = await api.get(`/weekly-plans/week/${date}`);
    return response.data;
  },
  
  create: async (data) => {
    const response = await api.post('/weekly-plans', data);
    return response.data;
  },
  
  addItem: async (planId, data) => {
    const response = await api.post(`/weekly-plans/${planId}/items`, data);
    return response.data;
  },
  
  updateItem: async (planId, itemId, data) => {
    const response = await api.put(`/weekly-plans/${planId}/items/${itemId}`, data);
    return response.data;
  },
  
  deleteItem: async (planId, itemId) => {
    await api.delete(`/weekly-plans/${planId}/items/${itemId}`);
  },
};




