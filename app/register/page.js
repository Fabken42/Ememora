// app/register/page.js
'use client'

import { useState } from 'react'
import { auth, provider } from '@/lib/firebase'
import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
  signInWithPopup
} from 'firebase/auth'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import useUserStore from '@/store/useUserStore'
import toast from 'react-hot-toast'
import { FiLogIn, FiMail, FiUserPlus } from 'react-icons/fi'
import { LIMITS } from '@/lib/utils'

export default function RegisterPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const setUserStore = useUserStore(state => state.setUser)
  const setFirebaseToken = useUserStore(state => state.setFirebaseToken)

  const createProfileIfMissing = async (user) => {
    const token = await user.getIdToken()

    const existsRes = await fetch(`/api/users/${user.uid}`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${token}` },
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

      return {
        uid: user.uid,
        email: user.email,
        name: displayNameFallback,
        image: user.photoURL || '',
        bio: '',
        totalLists: 0
      }
    }

    return {
      uid: exists.uid,
      email: exists.email,
      name: exists.name,
      image: exists.image || '',
      bio: exists.bio || '',
      totalLists: exists.totalLists || 0
    }
  }

  const handleRegister = async () => {
    if (password !== confirmPassword) {
      toast.error('As senhas não coincidem.')
      return
    }

    if (password.length < 6) {
      toast.error('A senha deve ter pelo menos 6 caracteres.')
      return
    }

    setLoading(true)

    try {
      const { user } = await createUserWithEmailAndPassword(auth, email, password)

      await sendEmailVerification(user)

      // Redireciona para a página de verificação de email
      router.push(`/verify-email?email=${encodeURIComponent(email)}`)

    } catch (error) {
      console.error('Erro no registro:', error)

      if (error.code === 'auth/email-already-in-use') {
        toast.error('Este email já está em uso. Tente fazer login.')
      } else if (error.code === 'auth/invalid-email') {
        toast.error('Email inválido.')
      } else if (error.code === 'auth/weak-password') {
        toast.error('A senha é muito fraca.')
      } else {
        toast.error('Erro ao criar conta. Tente novamente.')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleLoginGoogle = async () => {
    try {
      const result = await signInWithPopup(auth, provider)

      if (!result.user.emailVerified) {
        toast.error('Sua conta Google não está verificada.')
        return
      }

      const profileData = await createProfileIfMissing(result.user)
      const token = await result.user.getIdToken()

      setUserStore(profileData)
      setFirebaseToken(token)

      router.push('/')
    } catch (error) {
      console.error('Erro no login com Google:', error)
      toast.error('Erro ao fazer login com Google.')
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-md p-8 rounded-xl bg-[#24243e] border border-indigo-500/20 shadow-lg">
        <h1 className="text-3xl font-semibold mb-6 text-center ">Criar Conta no ememora</h1>

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
            <label className="block mb-2 text-sm font-medium text-gray-300">Criar Senha</label>
            <input
              type="password"
              placeholder="Senha (mínimo 6 caracteres)"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-indigo-500/30 bg-[#2d2b55]  rounded-lg placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
            />
          </div>

          <div>
            <label className="block mb-2 text-sm font-medium text-gray-300">Confirmar Senha</label>
            <input
              type="password"
              placeholder="Confirmar senha"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-3 border border-indigo-500/30 bg-[#2d2b55]  rounded-lg placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
            />
          </div>

          <button
            onClick={handleRegister}
            disabled={loading || !email || !password || password !== confirmPassword}
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-3 rounded-lg transition-colors font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                Criando conta...
              </>
            ) : (
              <>
                <FiUserPlus className="w-5 h-5" />
                Criar Conta
              </>
            )}
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
            <p className="text-gray-400">Já tem uma conta?</p>
            <Link
              href="/login"
              className="text-emerald-400 hover:text-emerald-300 transition-colors font-medium flex items-center justify-center gap-2 mt-2"
            >
              <FiLogIn className="w-4 h-4" />
              Fazer login
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}