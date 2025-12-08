import { create } from 'zustand';

// Carregar tema do localStorage
const getInitialTheme = () => {
  if (typeof window === 'undefined') return false;
  const saved = localStorage.getItem('theme');
  if (saved) {
    return saved === 'dark';
  }
  // Verificar preferência do sistema
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
};

// Aplicar tema inicial apenas no cliente
const initialTheme = getInitialTheme();
if (typeof window !== 'undefined') {
  if (initialTheme) {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
}

const useThemeStore = create((set) => ({
  isDark: initialTheme,
  toggleTheme: () => {
    set((state) => {
      const newIsDark = !state.isDark;
      // Aplicar classe ao documento
      if (newIsDark) {
        document.documentElement.classList.add('dark');
        localStorage.setItem('theme', 'dark');
      } else {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('theme', 'light');
      }
      return { isDark: newIsDark };
    });
  },
  setTheme: (isDark) => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
    set({ isDark });
  },
}));

export default useThemeStore;

