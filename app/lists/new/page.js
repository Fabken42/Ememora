// /app/lists/new/page.js
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { CATEGORIES, LIMITS } from '@/lib/utils'
import useUserStore from '@/store/useUserStore'
import toast from 'react-hot-toast'
import LoadingSpinner from '@/components/LoadingSpinner'
import { FiSave } from 'react-icons/fi'

export default function NewListPage() {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('languages')
  const [isPublic, setIsPublic] = useState(true)
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)
  const [listStats, setListStats] = useState({ current: 0, max: LIMITS.TOTAL_LISTS })
  const [isSaving, setIsSaving] = useState(false)

  const isHydrated = useUserStore(state => state.isHydrated)
  const userId = useUserStore(state => state.user?.uid)
  const router = useRouter()

  // Verificar autenticação e carregar contagem de listas
  useEffect(() => {
    if (!isHydrated) return

    const timer = setTimeout(() => {
      if (!userId) {
        toast.error('Você precisa estar logado para criar uma lista.')
        router.push('/login')
      } else {
        setIsCheckingAuth(false)
        checkListLimit()
      }
    }, 100)

    return () => clearTimeout(timer)
  }, [userId, router, isHydrated])

  const checkListLimit = async () => {

    try {
      const res = await fetch('/api/lists/check-limit', {
        method: 'GET',
        credentials: 'include'
      })

      if (res.ok) {
        const data = await res.json()
        setListStats({
          current: data.currentCount,
          max: data.maxLimit
        })
      }
    } catch (err) {
      console.error('Erro ao verificar limite:', err)
    }
  }

  const handleSave = async () => {
    if (isSaving) return
    setIsSaving(true)

    if (!userId) {
      toast.error('Você precisa estar logado para criar uma lista.')
      router.push('/login')
      setIsSaving(false)
      return
    }

    if (!title.trim()) {
      toast.error('O título é obrigatório.')
      setIsSaving(false)
      return
    }

    // Verificar limite antes de enviar
    if (listStats.current >= listStats.max) {
      toast.error(`Você atingiu o limite máximo de ${listStats.max} listas.`)
      setIsSaving(false)
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
          'credentials': 'include'
        },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        throw new Error(errorData.error || 'Erro ao criar lista.')
      }

      const data = await res.json()
      toast.success('Lista criada com sucesso!')
      router.push(`/lists/${data._id}/edit`)
    } catch (err) {
      toast.error(err.message || 'Erro ao salvar lista.')
    } finally {
      setIsSaving(false)
    }
  }

  // Mostrar loading enquanto verifica a autenticação
  if (isCheckingAuth || !isHydrated) {
    return (
      <LoadingSpinner message={'Verificando autenticação...'} />
    )
  }

  const hasReachedLimit = listStats.current >= listStats.max

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-semibold text-[--primary-text]">Criar Nova Lista</h2>
      </div>

      {hasReachedLimit && (
        <div className="bg-red-500/20 border border-red-500/50 text-red-400 p-4 rounded-lg">
          <p className="font-medium">Limite atingido!</p>
          <p className="text-sm">Você já possui {listStats.max} listas. Exclua algumas para criar novas.</p>
        </div>
      )}

      <input
        type="text"
        placeholder="Título da lista *"
        value={title}
        onChange={e => setTitle(e.target.value)}
        className="w-full px-4 py-3 border border-indigo-500/30 bg-[#24243e] text-[--primary-text] rounded-lg placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
        disabled={hasReachedLimit}
      />

      <textarea
        placeholder="Descrição (opcional)"
        value={description}
        onChange={e => setDescription(e.target.value)}
        className="w-full px-4 py-3 border border-indigo-500/30 bg-[#24243e] text-[--primary-text] rounded-lg resize-y placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
        rows={3}
        disabled={hasReachedLimit}
      />

      <div className="p-4 bg-[#24243e] rounded-lg border border-indigo-500/20">
        <label className="block mb-2 text-sm font-medium text-gray-300">Categoria:</label>
        <select
          value={category}
          onChange={e => setCategory(e.target.value)}
          className="w-full px-4 py-3 border border-indigo-500/30 bg-[#2d2b55] text-[--primary-text] rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
          disabled={hasReachedLimit}
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
          disabled={hasReachedLimit}
        />
        <label htmlFor="isPublic" className="text-gray-300">
          Tornar esta lista pública
        </label>
      </div>

      <button
        onClick={handleSave}
        disabled={!title.trim() || hasReachedLimit || isSaving}
        className="w-full mt-6 bg-indigo-600 hover:bg-indigo-500 text-white py-3 px-6 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium flex items-center justify-center gap-2"
      >
        <FiSave className="w-5 h-5" />
        {isSaving
          ? 'Salvando...'
          : hasReachedLimit
            ? `Limite de ${listStats.max} listas atingido`
            : !title.trim()
              ? 'Digite um título para salvar'
              : 'Salvar Lista'
        }
      </button>

      {hasReachedLimit && (
        <div className="text-center">
          <button
            onClick={() => router.push(`/users/${userId}`)}
            className="text-indigo-400 hover:text-indigo-300 underline text-sm"
          >
            Ver minhas listas
          </button>
        </div>
      )}
    </div>
  )
}