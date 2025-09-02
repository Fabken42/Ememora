// store/useUserStore.js
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { signOut } from 'firebase/auth'
import { auth } from '@/lib/firebase'

const useUserStore = create(
  persist(
    (set) => ({
      user: null,
      firebaseToken: null,
      isHydrated: false,

      setUser: (user) => set({ user }),
      setFirebaseToken: (token) => set({ firebaseToken: token }),
      logout: async () => {
        await signOut(auth)
        set({ user: null, firebaseToken: null })
      },
      setIsHydrated: (isHydrated) => set({ isHydrated }),

    }),
    {
      name: 'ememora-auth',
      onRehydrateStorage: () => (state) => {
        // Quando a rehidratação estiver completa
        state?.setIsHydrated(true)
      },
      partialize: (state) => ({ user: state.user, firebaseToken: state.firebaseToken }),
    }
  )
)

export default useUserStore
