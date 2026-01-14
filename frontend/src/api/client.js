import axios from 'axios';
import useLoadingStore from '../store/loadingStore';
import useToastStore from '../store/toastStore';
import errorLogger from '../services/errorLogger';
import { redirectTo } from '../utils/paths';

// Determinar a URL base da API
// Em desenvolvimento: usa proxy do Vite (/api)
// Em produção: usa variável de ambiente ou fallback para URL relativa
const getApiBaseURL = () => {
  // Se estiver em desenvolvimento (Vite)
  if (import.meta.env.DEV) {
    return '/api';
  }
  
  // Em produção, usar variável de ambiente ou URL relativa
  const apiUrl = import.meta.env.VITE_API_URL;
  if (apiUrl) {
    return apiUrl;
  }
  
  // Fallback: tentar usar URL relativa (assumindo que o backend está no mesmo domínio)
  // Se o backend estiver em outro domínio, configure VITE_API_URL
  return '/api';
};

const api = axios.create({
  baseURL: getApiBaseURL(),
  headers: {
    'Content-Type': 'application/json',
  },
});

// Flag para evitar múltiplas tentativas de refresh simultâneas
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Função para decodificar JWT e verificar expiração
const isTokenExpiringSoon = (token) => {
  try {
    if (!token) return true;
    
    const payload = JSON.parse(atob(token.split('.')[1]));
    const exp = payload.exp * 1000; // Converter para milissegundos
    const now = Date.now();
    const timeUntilExpiry = exp - now;
    
    // Renovar se faltar menos de 5 minutos (300000ms)
    return timeUntilExpiry < 300000;
  } catch (error) {
    return true;
  }
};

// Função para renovar token
const refreshTokenIfNeeded = async () => {
  try {
    const authStorage = localStorage.getItem('auth-storage');
    if (!authStorage) return null;
    
    const parsed = JSON.parse(authStorage);
    const refreshToken = parsed?.refreshToken || parsed?.state?.refreshToken;
    
    if (!refreshToken) return null;
    
    // Fazer requisição diretamente sem usar authApi para evitar dependência circular
    const apiBaseURL = getApiBaseURL();
    const response = await axios.post(`${apiBaseURL}/auth/refresh`, { refreshToken }, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
    const { token, refreshToken: newRefreshToken } = response.data;
    
    // Atualizar no localStorage diretamente
    parsed.token = token;
    parsed.refreshToken = newRefreshToken;
    localStorage.setItem('auth-storage', JSON.stringify(parsed));
    
    return token;
  } catch (error) {
    // Se o refresh falhar, fazer logout
    localStorage.removeItem('auth-storage');
    redirectTo('/login');
    throw error;
  }
};

// Interceptor para adicionar token JWT no header Authorization e renovar se necessário
api.interceptors.request.use(
  async (config) => {
    // Ignorar loading para refresh token para evitar loops
    if (!config.url?.includes('/auth/refresh')) {
      useLoadingStore.getState().startLoading();
    }

    try {
      const authStorage = localStorage.getItem('auth-storage');
      if (authStorage) {
        const parsed = JSON.parse(authStorage);
        // Suporta tanto o formato direto quanto o formato do zustand persist
        let token = parsed?.token || parsed?.state?.token;
        
        // Verificar se o token está próximo de expirar e renovar se necessário
        if (token && isTokenExpiringSoon(token)) {
          if (!isRefreshing) {
            isRefreshing = true;
            try {
              token = await refreshTokenIfNeeded();
              if (!token) {
                // Se não conseguiu renovar, usar o token atual
                const parsed = JSON.parse(localStorage.getItem('auth-storage'));
                token = parsed?.token || parsed?.state?.token;
              }
            } catch (error) {
              processQueue(error, null);
              throw error;
            } finally {
              isRefreshing = false;
            }
          } else {
            // Aguardar refresh em andamento
            return new Promise((resolve, reject) => {
              failedQueue.push({ resolve, reject });
            }).then((newToken) => {
              config.headers.Authorization = `Bearer ${newToken}`;
              return config;
            });
          }
        }
        
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      }
    } catch (error) {
      errorLogger.logError(error, {
        type: 'apiRequestInterceptor',
        action: 'getToken',
      });
    }
    return config;
  },
  (error) => {
    // Parar loading em caso de erro na requisição
    if (!error.config?.url?.includes('/auth/refresh')) {
      useLoadingStore.getState().stopLoading();
    }
    return Promise.reject(error);
  }
);

// Interceptor para tratar erros e tentar renovar token em caso de 401
api.interceptors.response.use(
  (response) => {
    // Parar loading em caso de sucesso
    if (!response.config?.url?.includes('/auth/refresh')) {
      useLoadingStore.getState().stopLoading();
    }
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Parar loading em caso de erro (exceto refresh token)
    if (!originalRequest?.url?.includes('/auth/refresh')) {
      useLoadingStore.getState().stopLoading();
    }

    // Se for erro 401 e não for uma tentativa de refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // Aguardar refresh em andamento
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const authStorage = localStorage.getItem('auth-storage');
        if (authStorage) {
          const parsed = JSON.parse(authStorage);
          const refreshToken = parsed?.refreshToken || parsed?.state?.refreshToken;

          if (refreshToken) {
            // Fazer requisição diretamente sem usar authApi para evitar dependência circular
            const apiBaseURL = getApiBaseURL();
            const response = await axios.post(`${apiBaseURL}/auth/refresh`, { refreshToken }, {
              headers: {
                'Content-Type': 'application/json',
              },
            });
            const { token, refreshToken: newRefreshToken } = response.data;

            // Atualizar no localStorage diretamente
            const updatedParsed = { ...parsed };
            updatedParsed.token = token;
            updatedParsed.refreshToken = newRefreshToken;
            localStorage.setItem('auth-storage', JSON.stringify(updatedParsed));

            // Atualizar header da requisição original
            originalRequest.headers.Authorization = `Bearer ${token}`;

            processQueue(null, token);
            return api(originalRequest);
          }
        }
      } catch (refreshError) {
        processQueue(refreshError, null);
        // Se o refresh falhar, fazer logout
        localStorage.removeItem('auth-storage');
        redirectTo('/login');
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // Mostrar toast de erro para o usuário
    const errorMessage = error.response?.data?.error || 
                         error.message || 
                         'Ocorreu um erro. Tente novamente.';
    
    // Não mostrar toast para erros 401 (já tratados acima) ou erros de refresh token
    if (error.response?.status !== 401 && !originalRequest?.url?.includes('/auth/refresh')) {
      useToastStore.getState().error(errorMessage);
    }

    // Log centralizado de erros
    errorLogger.logError(error, {
      type: 'apiError',
      url: originalRequest?.url,
      method: originalRequest?.method,
      status: error.response?.status,
      statusText: error.response?.statusText,
      responseData: error.response?.data,
    });

    // Adicionar breadcrumb para rastreamento
    errorLogger.addBreadcrumb(
      `Erro na API: ${originalRequest?.method?.toUpperCase()} ${originalRequest?.url}`,
      'api',
      {
        status: error.response?.status,
        message: errorMessage,
      }
    );

    return Promise.reject(error);
  }
);

export default api;

