// app/login/page.js

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { signInWithPopup, signInWithEmailAndPassword } from 'firebase/auth'
import { auth, provider } from '@/lib/firebase'
import useUserStore from '@/store/useUserStore'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { FiLogIn, FiMail, FiUserPlus } from 'react-icons/fi'
import { LIMITS } from '@/lib/utils'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const router = useRouter()
  const setUserStore = useUserStore(state => state.setUser)
  const setFirebaseToken = useUserStore(state => state.setFirebaseToken)

  const createProfileIfMissing = async (user) => {
    const token = await user.getIdToken()

    // Verifica se o usuário já existe no banco
    const existsRes = await fetch(`/api/users/${user.uid}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    })

    let exists = null
    try {
      if (existsRes.ok) exists = await existsRes.json()
    } catch { }

    if (!exists || !exists.uid) {
      const baseName =
        user.displayName || (user.email ? user.email.split('@')[0] : 'user')

      let displayNameFallback = (baseName + Date.now()).slice(0, LIMITS.USER_NAME_MAX)

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
          totalLists: 0
        }),
      })

      if (!res.ok) {
        const msg = await res.text().catch(() => 'Falha ao criar perfil')
        throw new Error(msg)
      }

      // Retorna perfil criado
      return {
        uid: user.uid,
        email: user.email,
        name: displayNameFallback,
        image: user.photoURL || '',
        bio: '',
        totalLists: 0
      }
    }

    // Retorna perfil existente do banco
    return {
      uid: exists.uid,
      email: exists.email,
      name: exists.name,
      image: exists.image || '',
      bio: exists.bio || '',
      totalLists: exists.totalLists || 0
    }
  }

  const afterLogin = async (firebaseUser) => {
    if (!firebaseUser.emailVerified) {
      toast('Verifique seu email antes de fazer o login.', { icon: '⚠️' });
      return;
    }
    const profileData = await createProfileIfMissing(firebaseUser)
    const token = await firebaseUser.getIdToken()

    setUserStore(profileData)
    setFirebaseToken(token)
    router.push('/')
  }

  const handleLoginGoogle = async () => {
    const result = await signInWithPopup(auth, provider)
    await afterLogin(result.user)
  }

  const handleLoginEmail = async () => {
    const result = await signInWithEmailAndPassword(auth, email, password)
    await afterLogin(result.user)
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-md p-8 rounded-xl bg-[#24243e] border border-indigo-500/20 shadow-lg">
        <h1 className="text-3xl font-semibold mb-6 text-center ">Entrar no ememora</h1>

        <div className="space-y-6">
          <div>
            <label className="block mb-2 text-sm font-medium text-gray-300">Email</label>
            <input
              type="email"
              placeholder="Seu email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full px-4 py-3 border border-indigo-500/30 bg-[#2d2b55]  rounded-lg placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
            />
          </div>

          <div>
            <label className="block mb-2 text-sm font-medium text-gray-300">Senha</label>
            <input
              type="password"
              placeholder="Sua senha"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-indigo-500/30 bg-[#2d2b55]  rounded-lg placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
            />
          </div>

          <button
            onClick={handleLoginEmail}
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-3 rounded-lg transition-colors font-medium flex items-center justify-center gap-2"
          >
            <FiLogIn className="w-5 h-5" />
            Entrar com Email
          </button>

          <div className="relative flex items-center justify-center">
            <div className="border-t border-indigo-500/30 w-full"></div>
            <span className="bg-[#24243e] px-3 text-sm text-gray-400">ou</span>
            <div className="border-t border-indigo-500/30 w-full"></div>
          </div>

          <button
            onClick={handleLoginGoogle}
            className="w-full bg-[#2d2b55] hover:bg-[#3a3780] text-white py-3 rounded-lg border border-indigo-500/30 transition-colors font-medium flex items-center justify-center gap-2"
          >
            <FiMail className="w-5 h-5" />
            Continuar com Google
          </button>

          <div className="text-center mt-6 pt-4 border-t border-indigo-500/20">
            <p className="text-gray-400">Não tem uma conta?</p>
            <Link
              href="/register"
              className="text-emerald-400 hover:text-emerald-300 transition-colors font-medium flex items-center justify-center gap-2 mt-2"
            >
              <FiUserPlus className="w-4 h-4" />
              Criar conta
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}