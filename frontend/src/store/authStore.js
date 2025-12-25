import { create } from 'zustand';
import errorLogger from '../services/errorLogger';

const loadFromStorage = () => {
  try {
    const stored = localStorage.getItem('auth-storage');
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    errorLogger.logError(error, {
      type: 'authStorage',
      action: 'loadFromStorage',
    });
  }
  return { user: null, token: null, refreshToken: null, isAuthenticated: false };
};

const saveToStorage = (state) => {
  try {
    localStorage.setItem('auth-storage', JSON.stringify(state));
  } catch (error) {
    errorLogger.logError(error, {
      type: 'authStorage',
      action: 'saveToStorage',
    });
  }
};

const initialState = loadFromStorage();

export const useAuthStore = create((set) => ({
  ...initialState,
  
  setAuth: (user, token, refreshToken) => {
    const newState = { user, token, refreshToken, isAuthenticated: !!token };
    saveToStorage(newState);
    set(newState);
    
    // Atualizar contexto do usuário no Sentry
    if (user) {
      errorLogger.setUser({
        id: user.id,
        email: user.email,
        username: user.name || user.username,
      });
    }
  },
  
  setTokens: (token, refreshToken) => {
    const currentState = loadFromStorage();
    const newState = { ...currentState, token, refreshToken };
    saveToStorage(newState);
    set(newState);
  },
  
  logout: () => {
    localStorage.removeItem('auth-storage');
    set({ user: null, token: null, refreshToken: null, isAuthenticated: false });
    
    // Limpar contexto do usuário no Sentry
    errorLogger.clearUser();
  },
}));

