'use client'

import { useEffect } from 'react'
import { getAuth, onIdTokenChanged } from 'firebase/auth'
import useUserStore from '@/store/useUserStore'

export default function AuthProvider({ children }) {
  const setUser = useUserStore((s) => s.setUser)
  const logout = useUserStore((s) => s.logout)

  useEffect(() => {
    const auth = getAuth()

    const unsubscribe = onIdTokenChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        // Usuário saiu
        setUser(null)
        await fetch('/api/logout', { method: 'POST' }) // limpa cookie no servidor
        return
      }

      try {
        // Obter o token ID do Firebase
        const idToken = await firebaseUser.getIdToken()

        // Cria o cookie de sessão no servidor
        const sessionRes = await fetch('/api/session-login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ idToken }),
          credentials: 'include', // importante!
        })

        if (!sessionRes.ok) {
          console.error('Falha ao criar cookie de sessão')
          return
        }

        // Buscar ou criar perfil do usuário
        const profileRes = await fetch(`/api/users/${firebaseUser.uid}`, {
          credentials: 'include', // cookie incluído automaticamente
        })

        let profileData
        if (profileRes.ok) {
          profileData = await profileRes.json()
        } else {
          // Criar perfil se não existir
          const createRes = await fetch(`/api/users/${firebaseUser.uid}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: firebaseUser.displayName || firebaseUser.email || 'Usuário',
              email: firebaseUser.email,
              image: firebaseUser.photoURL || '',
              bio: '',
            }),
            credentials: 'include',
          })

          if (!createRes.ok) throw new Error('Erro ao criar perfil')

          profileData = await createRes.json()
        }

        setUser(profileData)
      } catch (err) {
        console.error('Erro ao atualizar sessão:', err)
        logout()
      }
    })

    return () => unsubscribe()
  }, [setUser, logout])

  return children
}
