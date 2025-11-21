import api from './client';

export const statisticsApi = {
  getOverview: async (period = '30') => {
    const response = await api.get('/statistics/overview', { params: { period } });
    return response.data;
  },
  
  getBySubject: async (period = '30') => {
    const response = await api.get('/statistics/by-subject', { params: { period } });
    return response.data;
  },
  
  getConstancy: async (year) => {
    const response = await api.get('/statistics/constancy', { params: { year } });
    return response.data;
  },
  
  getTimeline: async (period = '30', groupBy = 'day') => {
    const response = await api.get('/statistics/timeline', { params: { period, groupBy } });
    return response.data;
  },
};





