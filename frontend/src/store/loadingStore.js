import { create } from 'zustand';

const useLoadingStore = create((set) => ({
  isLoading: false,
  loadingCount: 0,
  
  startLoading: () => {
    set((state) => {
      const newCount = state.loadingCount + 1;
      return {
        loadingCount: newCount,
        isLoading: newCount > 0,
      };
    });
  },
  
  stopLoading: () => {
    set((state) => {
      const newCount = Math.max(0, state.loadingCount - 1);
      return {
        loadingCount: newCount,
        isLoading: newCount > 0,
      };
    });
  },
  
  resetLoading: () => {
    set({
      loadingCount: 0,
      isLoading: false,
    });
  },
}));

export default useLoadingStore;


















