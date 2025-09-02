// app/verify-email/page.js
'use client'

import { useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { auth } from '@/lib/firebase'
import { sendEmailVerification } from 'firebase/auth'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { FiLogIn, FiMail, FiRefreshCw } from 'react-icons/fi'

export default function VerifyEmailPage() {
  const [loading, setLoading] = useState(false)
  const searchParams = useSearchParams()
  const email = searchParams.get('email')

  const handleResendVerification = async () => {
    if (!auth.currentUser) {
      toast.error('Usuário não autenticado. Faça login novamente.')
      return
    }

    setLoading(true)
    try {
      await sendEmailVerification(auth.currentUser)
      toast.success('Email de verificação reenviado com sucesso!')
    } catch (error) {
      console.error('Erro ao reenviar verificação:', error)
      toast.error('Erro ao reenviar email de verificação.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-md p-8 rounded-xl bg-[#24243e] border border-indigo-500/20 shadow-lg text-center">
        <div className="mb-6 flex justify-center">
          <div className="w-16 h-16 bg-indigo-500/20 rounded-full flex items-center justify-center">
            <FiMail className="w-8 h-8 text-indigo-400" />
          </div>
        </div>
        
        <h1 className="text-2xl font-semibold mb-4">Verifique seu Email</h1>
        
        <div className="mb-6">
          <p className="text-gray-300 mb-3">
            Enviamos um link de verificação para:
          </p>
          <p className="font-medium text-emerald-400 bg-emerald-900/30 px-4 py-2 rounded-lg border border-emerald-500/30">
            {email}
          </p>
        </div>

        <p className="text-gray-300 mb-6 leading-relaxed">
          Clique no link no email para ativar sua conta antes de fazer login.
        </p>

        <button
          onClick={handleResendVerification}
          disabled={loading}
          className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-3 rounded-lg transition-colors font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed mb-5"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
              Enviando...
            </>
          ) : (
            <>
              <FiRefreshCw className="w-5 h-5" />
              Reenviar Email de Verificação
            </>
          )}
        </button>

        <div className="pt-4 border-t border-indigo-500/20">
          <Link 
            href="/login" 
            className="text-emerald-400 hover:text-emerald-300 transition-colors font-medium flex items-center justify-center gap-2"
          >
            <FiLogIn className="w-4 h-4" />
            Fazer Login
          </Link>
        </div>
      </div>
    </div>
  )
}