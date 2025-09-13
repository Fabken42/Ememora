// /app/AuthProvider.js
'use client'

import { useEffect } from 'react'
import { getAuth, onAuthStateChanged, onIdTokenChanged } from 'firebase/auth'
import useUserStore from '@/store/useUserStore'

async function createProfileIfMissing(user) {
  const token = await user.getIdToken()

  const existsRes = await fetch(`/api/users/${user.uid}`, {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${token}` },
  })

  let exists = null
  try {
    if (existsRes.ok) exists = await existsRes.json()
  } catch {}

  if (!exists || !exists.uid) {
    const displayNameFallback =
      (user.displayName || (user.email ? user.email.split('@')[0] : 'user')) + Date.now()

    const res = await fetch(`/api/users/${user.uid}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        name: displayNameFallback,
        email: user.email,
        image: user.photoURL || '',
        bio: '',
      }),
    })

    if (!res.ok) {
      const msg = await res.text().catch(() => 'Falha ao criar perfil')
      throw new Error(msg)
    }

    return {
      uid: user.uid,
      email: user.email,
      name: displayNameFallback,
      image: user.photoURL || '',
      bio: '',
    }
  }

  return {
    uid: exists.uid,
    email: exists.email,
    name: exists.name,
    image: exists.image || '',
    bio: exists.bio || '',
  }
}

export default function AuthProvider({ children }) {
  const setUser = useUserStore((state) => state.setUser)
  const setFirebaseToken = useUserStore((state) => state.setFirebaseToken)

  useEffect(() => {
    const auth = getAuth()

    // Controle do estado do usuário
    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        if (!firebaseUser.emailVerified && firebaseUser.providerData[0]?.providerId === 'password') {
          setUser(null)
          setFirebaseToken(null)
          return
        }

        const token = await firebaseUser.getIdToken()
        const profileData = await createProfileIfMissing(firebaseUser)

        setFirebaseToken(token)
        setUser(profileData)
      } else {
        setUser(null)
        setFirebaseToken(null)
      }
    })

    // Atualização automática do token
    const unsubscribeToken = onIdTokenChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const newToken = await firebaseUser.getIdToken(true)
        setFirebaseToken(newToken)
      } else {
        setFirebaseToken(null)
      }
    })

    return () => {
      unsubscribeAuth()
      unsubscribeToken()
    }
  }, [setUser, setFirebaseToken])

  return children
}
