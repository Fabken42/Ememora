'use client'

import { useEffect } from 'react'
import { getAuth, onIdTokenChanged } from 'firebase/auth'
import useUserStore from '@/store/useUserStore'

export default function AuthProvider({ children }) {
  const setUser = useUserStore((s) => s.setUser)
  const setFirebaseToken = useUserStore((s) => s.setFirebaseToken)
  const logout = useUserStore((s) => s.logout)

  useEffect(() => {
    const auth = getAuth()

    // Atualiza token e perfil sempre que o token mudar (login, refresh, logout)
    const unsubscribe = onIdTokenChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        setUser(null)
        setFirebaseToken(null)
        return
      }

      try {
        const token = await firebaseUser.getIdToken()
        setFirebaseToken(token)

        // Atualiza perfil local (se necessário)
        const profileRes = await fetch(`/api/users/${firebaseUser.uid}`, {
          headers: { Authorization: `Bearer ${token}` },
        })

        let profileData
        if (profileRes.ok) {
          profileData = await profileRes.json()
        } else {
          // Se não existir, cria o perfil
          await fetch(`/api/users/${firebaseUser.uid}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({
              name: firebaseUser.displayName || firebaseUser.email || 'Usuário',
              email: firebaseUser.email,
              image: firebaseUser.photoURL || '',
              bio: '',
            }),
          })
          profileData = {
            uid: firebaseUser.uid,
            name: firebaseUser.displayName || firebaseUser.email || 'Usuário',
            email: firebaseUser.email,
            image: firebaseUser.photoURL || '',
            bio: '',
          }
        }

        setUser(profileData)
      } catch (err) {
        console.error('Erro no onIdTokenChanged:', err)
        logout()
      }
    })

    // Força renovação a cada 55 minutos
    const interval = setInterval(async () => {
      const user = auth.currentUser
      if (user) {
        const newToken = await user.getIdToken(true)
        setFirebaseToken(newToken)
        console.log('Token renovado manualmente. bujumbura')
      }
    }, 55 * 60 * 1000)

    return () => {
      unsubscribe()
      clearInterval(interval)
    }
  }, [setUser, setFirebaseToken, logout])

  return children
}
