// /app/lists/new/page.js
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { CATEGORIES } from '@/lib/utils'
import useUserStore from '@/store/useUserStore'
import toast from 'react-hot-toast'
import LoadingSpinner from '@/components/LoadingSpinner'
import { FiSave } from 'react-icons/fi'


export default function NewListPage() {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('languages')
  const [isPublic, setIsPublic] = useState(true)
  const [isCheckingAuth, setIsCheckingAuth] = useState(true) // Estado para controle de verificação
  const isHydrated = useUserStore(state => state.isHydrated);

  const userId = useUserStore(state => state.user?.uid)
  const firebaseToken = useUserStore(state => state.firebaseToken)
  const router = useRouter()

  // Verificar autenticação e redirecionar se necessário
  useEffect(() => {
    if(!isHydrated) return;
    // Aguardar um pouco para garantir que o estado do usuário seja carregado
    const timer = setTimeout(() => {
      if (!userId || !firebaseToken) {
        toast.error('Você precisa estar logado para criar uma lista.')
        router.push('/login')
      } else {
        setIsCheckingAuth(false)
      }
    }, 100)

    return () => clearTimeout(timer)
  }, [userId, firebaseToken, router, isHydrated])

  const handleSave = async () => {
    if (!userId || !firebaseToken) {
      toast.error('Você precisa estar logado para criar uma lista.')
      router.push('/login')
      return
    }

    if (!title.trim()) {
      toast.error('O título é obrigatório.')
      return
    }

    const payload = {
      title,
      description,
      public: isPublic,
      terms: [],
      category
    }

    try {
      const res = await fetch('/api/lists', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${firebaseToken}`
        },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        throw new Error('Erro ao criar lista.')
      }

      const data = await res.json()
      toast.success('Lista criada com sucesso!')
      router.push(`/lists/${data._id}/edit`)
    } catch (err) {
      toast.error('Erro ao salvar lista.')
    }
  }

  // Mostrar loading enquanto verifica a autenticação
  if (isCheckingAuth || !isHydrated) {
    return (
      <LoadingSpinner message={'Verificando autenticação...'} />
    )
  }

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <h2 className="text-2xl font-semibold mb-4 text-[--primary-text]">Criar Nova Lista</h2>

      <input
        type="text"
        placeholder="Título da lista *"
        value={title}
        onChange={e => setTitle(e.target.value)}
        className="w-full px-4 py-3 border border-indigo-500/30 bg-[#24243e] text-[--primary-text] rounded-lg placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
      />

      <textarea
        placeholder="Descrição (opcional)"
        value={description}
        onChange={e => setDescription(e.target.value)}
        className="w-full px-4 py-3 border border-indigo-500/30 bg-[#24243e] text-[--primary-text] rounded-lg resize-y placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
        rows={3}
      />

      <div className="p-4 bg-[#24243e] rounded-lg border border-indigo-500/20">
        <label className="block mb-2 text-sm font-medium text-gray-300">Categoria:</label>
        <select
          value={category}
          onChange={e => setCategory(e.target.value)}
          className="w-full px-4 py-3 border border-indigo-500/30 bg-[#2d2b55] text-[--primary-text] rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
        >
          {CATEGORIES.slice(1).map(cat => (
            <option key={cat.value} value={cat.value}>
              {cat.label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-center gap-3 p-4 bg-[#24243e] rounded-lg border border-indigo-500/20">
        <input
          type="checkbox"
          id="isPublic"
          checked={isPublic}
          onChange={e => setIsPublic(e.target.checked)}
          className="w-5 h-5 text-indigo-500 bg-[#2d2b55] border-indigo-500/30 rounded focus:ring-2 focus:ring-indigo-500"
        />
        <label htmlFor="isPublic" className="text-gray-300">
          Tornar esta lista pública
        </label>
      </div>

      <button
        onClick={handleSave}
        disabled={!title.trim()}
        className="w-full mt-6 bg-indigo-600 hover:bg-indigo-500 text-white py-3 px-6 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium flex items-center justify-center gap-2"
      >
        <FiSave className="w-5 h-5" />
        {!title.trim() ? 'Digite um título para salvar' : 'Salvar Lista'}
      </button>
    </div>
  )
}