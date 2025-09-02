// store/useNavigationStore.js
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useNavigationStore = create(
  persist((set) => ({
    lastHomeOrUserPage: '/', // valor inicial padrão
    setLastHomeOrUserPage: (path) => set({ lastHomeOrUserPage: path }),
  }))
);

export default useNavigationStore;
