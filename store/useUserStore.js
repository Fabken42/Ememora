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
      setUser: (user) => set({ user }),
      setFirebaseToken: (token) => set({ firebaseToken: token }),
      logout: async () => {
        await signOut(auth)
        set({ user: null, firebaseToken: null })
      },
    }),
    {
      name: 'ememora-auth',
      partialize: (state) => ({ user: state.user, firebaseToken: state.firebaseToken }),
    }
  )
)

export default useUserStore
