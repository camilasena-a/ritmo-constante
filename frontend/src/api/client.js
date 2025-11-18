import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

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

