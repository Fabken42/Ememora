// store/useUserStore.js
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { signOut } from 'firebase/auth'
import { auth } from '@/lib/firebase'

const useUserStore = create(
  persist(
    (set, get) => ({
      user: null,
      firebaseToken: null,
      isHydrated: false,

      setUser: (user) => set({ user }),
      setFirebaseToken: (token) => set({ firebaseToken: token }),
      
      // Nova função para renovar o token
      handleRefreshToken: async () => {
        try {
          const currentUser = auth.currentUser
          
          if (currentUser) {
            const newToken = await currentUser.getIdToken(true)
            set({ firebaseToken: newToken })
            console.log('Token renovado com sucesso!')
            return newToken
          } else {
            console.error('Nenhum usuário autenticado')
            throw new Error('Nenhum usuário autenticado')
          }
        } catch (error) {
          console.error('Erro ao renovar token:', error)
          throw error
        }
      },
      
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
      partialize: (state) => ({ 
        user: state.user, 
        firebaseToken: state.firebaseToken 
      }),
    }
  )
)

export default useUserStore