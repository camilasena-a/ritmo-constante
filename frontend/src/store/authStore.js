import { create } from 'zustand';

const loadFromStorage = () => {
  try {
    const stored = localStorage.getItem('auth-storage');
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Erro ao carregar do storage:', error);
  }
  return { user: null, token: null, isAuthenticated: false };
};

const saveToStorage = (state) => {
  try {
    localStorage.setItem('auth-storage', JSON.stringify(state));
  } catch (error) {
    console.error('Erro ao salvar no storage:', error);
  }
};

const initialState = loadFromStorage();

export const useAuthStore = create((set) => ({
  ...initialState,
  
  setAuth: (user, token) => {
    const newState = { user, token, isAuthenticated: !!token };
    saveToStorage(newState);
    set(newState);
  },
  
  logout: () => {
    localStorage.removeItem('auth-storage');
    set({ user: null, token: null, isAuthenticated: false });
  },
}));

