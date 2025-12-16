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

  exportPDF: async (period = '30') => {
    const response = await api.get('/statistics/export/pdf', {
      params: { period },
      responseType: 'blob',
    });
    
    // Criar link temporário para download
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    const filename = `relatorio-desempenho-${new Date().toISOString().split('T')[0]}.pdf`;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },

  exportExcel: async (period = '30') => {
    const response = await api.get('/statistics/export/excel', {
      params: { period },
      responseType: 'blob',
    });
    
    // Criar link temporário para download
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    const filename = `relatorio-desempenho-${new Date().toISOString().split('T')[0]}.xlsx`;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },
};





