// app/login/page.js
'use client'

import { useState } from 'react'
import { auth, provider } from '@/lib/firebase'
import { signInWithPopup, signInWithEmailAndPassword } from 'firebase/auth'
import { useRouter } from 'next/navigation'
import useUserStore from '@/store/useUserStore'
import Link from 'next/link'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const router = useRouter()
  const setUserStore = useUserStore(state => state.setUser)
  const setFirebaseToken = useUserStore(state => state.setFirebaseToken)

  const createProfileIfMissing = async user => {
    const res = await fetch(`/api/users/${user.uid}`)
    const exists = await res.json()
    if (!exists || !exists.uid) {
      await fetch(`/api/users/${user.uid}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uid: user.uid,
          name: user.displayName || '',
          email: user.email,
          image: user.photoURL || '',
          bio: ''
        })
      })
    }
  }

  const handleLoginGoogle = async () => {
    const result = await signInWithPopup(auth, provider)
    await createProfileIfMissing(result.user)
    const token = await result.user.getIdToken()

    setUserStore({
      uid: result.user.uid,
      email: result.user.email,
      name: result.user.displayName || result.user.email.split('@')[0] + Date.now(),
      image: result.user.photoURL || '',
      bio: ''
    })
    setFirebaseToken(token)
    router.push('/')
  }

  const handleLoginEmail = async () => {
    const result = await signInWithEmailAndPassword(auth, email, password)
    await createProfileIfMissing(result.user)
    const token = await result.user.getIdToken()

    setUserStore({
      uid: result.user.uid,
      email: result.user.email,
      name: result.user.displayName || result.user.email.split('@')[0] + Date.now(),
      image: result.user.photoURL || '',
      bio: ''
    })
    setFirebaseToken(token)
    router.push('/')
  }


  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-[var(--background)] text-[var(--foreground)]">
      <h1 className="text-3xl font-semibold mb-6">Entrar no ememora</h1>
      <div className="w-full max-w-sm space-y-4">
        <label className="block">Email</label>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          className="w-full px-4 py-2 border rounded-md focus:outline-none"
        />
        <label className="block">Senha</label>
        <input
          type="password"
          placeholder="Senha"
          value={password}
          onChange={e => setPassword(e.target.value)}
          className="w-full px-4 py-2 border rounded-md focus:outline-none"
        />
        <button
          onClick={handleLoginEmail}
          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-2 rounded-md">
          Entrar com Email
        </button>
        <hr className="border-gray-300" />
        <button
          onClick={handleLoginGoogle}
          className="w-full bg-red-600 hover:bg-red-700 text-white py-2 rounded-md">
          Entrar com Google
        </button>
        <div className="text-center mt-4">
          <p>ou</p>
          <Link href="/register" className="text-emerald-600 hover:underline">Registrar</Link>
        </div>
      </div>
    </div>
  )
}
