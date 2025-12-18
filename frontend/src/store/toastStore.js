import { create } from 'zustand';

const useToastStore = create((set) => ({
  toasts: [],
  
  addToast: (message, type = 'info', duration = 5000) => {
    const id = Date.now() + Math.random();
    const toast = { id, message, type, duration };
    
    set((state) => ({
      toasts: [...state.toasts, toast],
    }));

    // Remover automaticamente após a duração
    if (duration > 0) {
      setTimeout(() => {
        useToastStore.getState().removeToast(id);
      }, duration);
    }

    return id;
  },

  removeToast: (id) => {
    set((state) => ({
      toasts: state.toasts.filter((toast) => toast.id !== id),
    }));
  },

  success: (message, duration) => {
    return useToastStore.getState().addToast(message, 'success', duration);
  },

  error: (message, duration) => {
    return useToastStore.getState().addToast(message, 'error', duration);
  },

  info: (message, duration) => {
    return useToastStore.getState().addToast(message, 'info', duration);
  },

  warning: (message, duration) => {
    return useToastStore.getState().addToast(message, 'warning', duration);
  },
}));

export default useToastStore;







