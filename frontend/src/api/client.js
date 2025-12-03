import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para adicionar token JWT no header Authorization
api.interceptors.request.use(
  (config) => {
    try {
      const authStorage = localStorage.getItem('auth-storage');
      if (authStorage) {
        const parsed = JSON.parse(authStorage);
        // Suporta tanto o formato direto quanto o formato do zustand persist
        const token = parsed?.token || parsed?.state?.token;
        
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      }
    } catch (error) {
      console.error('Erro ao obter token do localStorage:', error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para tratar erros
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Log de erros, mas não redireciona para login
    console.error('Erro na API:', error);
    return Promise.reject(error);
  }
);

export default api;

