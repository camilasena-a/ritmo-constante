import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
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
    const response = await axios.post('/api/auth/refresh', { refreshToken }, {
      baseURL: '',
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
    window.location.href = '/login';
    throw error;
  }
};

// Interceptor para adicionar token JWT no header Authorization e renovar se necessário
api.interceptors.request.use(
  async (config) => {
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
      console.error('Erro ao obter token do localStorage:', error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para tratar erros e tentar renovar token em caso de 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

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
            const response = await axios.post('/api/auth/refresh', { refreshToken }, {
              baseURL: '',
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
        window.location.href = '/login';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // Log de erros, mas não redireciona para login
    console.error('Erro na API:', error);
    return Promise.reject(error);
  }
);

export default api;

