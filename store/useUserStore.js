import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { signOut } from 'firebase/auth'
import { auth } from '@/lib/firebase'

const useUserStore = create(
  persist(
    (set) => ({
      user: null,
      isHydrated: false,

      setUser: (user) => set({ user }),

      logout: async () => {
        try {
          await fetch('/api/logout', {
            method: 'POST',
            credentials: 'include',
          })
        } catch (err) {
          console.error('Erro ao limpar cookie de sessão:', err)
        }

        await signOut(auth)
        set({ user: null })
      },

      setIsHydrated: (isHydrated) => set({ isHydrated }),
    }),
    {
      name: 'ememora-auth',
      onRehydrateStorage: () => (state) => {
        state?.setIsHydrated(true)
      },
      partialize: (state) => ({ user: state.user }),
    }
  )
)

export default useUserStore
