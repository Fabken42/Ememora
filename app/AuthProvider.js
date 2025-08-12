'use client'

import { useEffect } from 'react'
import { getAuth, onAuthStateChanged } from 'firebase/auth'
import useUserStore from '@/store/useUserStore'

export default function AuthProvider({ children }) {
  const setUser = useUserStore((state) => state.setUser)
  const setFirebaseToken = useUserStore((state) => state.setFirebaseToken)

  useEffect(() => {
    const auth = getAuth()

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          image: firebaseUser.photoURL,
        })

        const token = await firebaseUser.getIdToken()
        setFirebaseToken(token)
      } else {
        setUser(null)
        setFirebaseToken(null)
      }
    })

    return () => unsubscribe()
  }, [setUser, setFirebaseToken])

  return children
}
