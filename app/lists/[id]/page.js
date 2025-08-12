'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import TermCard from '@/components/TermCard'
import toast from 'react-hot-toast'
import useUserStore from '@/store/useUserStore'

export default function TermListPage() {
  const isListAuthor = true //alterar posteriormente
  const { id } = useParams()
  const [terms, setTerms] = useState([])
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [loadingReset, setLoadingReset] = useState(false)
  const [sortOption, setSortOption] = useState('normal')
  const { firebaseToken } = useUserStore()

  useEffect(() => {
    const fetchTerms = async () => {
      try {
        const headers = {}
        if (firebaseToken) {
          headers['Authorization'] = `Bearer ${firebaseToken}`
        }

        const res = await fetch(`/api/lists/${id}`, { headers })
        if (!res.ok) {
          const err = await res.json().catch(() => ({}))
          throw new Error(err.error || 'Erro ao buscar lista')
        }
        const data = await res.json()
        setTerms(data.terms || [])
        setTitle(data.title || '')
        setDescription(data.description || '')
      } catch (err) {
        console.error('Erro ao buscar termos:', err)
        toast.error(err.message || 'Erro ao carregar lista')
      }
    }

    if (!id) return
    fetchTerms()
  }, [id, firebaseToken])

  const resetStatus = async () => {
    if (!confirm('Resetar status de todos os termos?')) return
    setLoadingReset(true)

    try {
      if (!firebaseToken) {
        toast.error('Você precisa estar logado.')
        setLoadingReset(false)
        return
      }

      const res = await fetch(`/api/lists/${id}/reset-status`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${firebaseToken}`,
          'Content-Type': 'application/json',
        },
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || 'Erro ao resetar status')
      }

      const data = await res.json()
      setTerms(data.terms || [])
      toast.success('Status resetados com sucesso!')
    } catch (err) {
      console.error('Erro ao resetar status:', err)
      toast.error(err.message || 'Erro ao resetar status')
    } finally {
      setLoadingReset(false)
    }
  }

  const getSortedTerms = () => {
    let sorted = [...terms]
    switch (sortOption) {
      case 'reverse':
        sorted.reverse()
        break
      case 'best':
        sorted.sort((a, b) => (b.status || 0) - (a.status || 0))
        break
      case 'worst':
        sorted.sort((a, b) => (a.status || 0) - (b.status || 0))
        break
      default:
        break
    }
    return sorted
  }


  return (
  <div className="p-4 max-w-3xl mx-auto space-y-6">
    {/* Header Section */}
    <div className="flex flex-col items-center text-center gap-3 mb-8">
      <h1 className="text-3xl font-bold text-gray-800">{title || 'Lista de Termos'}</h1>
      <p className="text-gray-600 max-w-2xl">{description}</p>

      {/* Reset Button */}
      <button
        onClick={resetStatus}
        disabled={loadingReset}
        className="bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-lg border transition-colors disabled:opacity-50"
      >
        {loadingReset ? 'Resetando...' : 'Resetar Progresso'}
      </button>

      {/* Action Buttons */}
      <div className="flex flex-wrap justify-center gap-3 mt-4">
        <button
          onClick={() => window.location.href = `/study/${id}/quiz`}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors shadow-md"
        >
          Iniciar Quiz
        </button>
        <button
          onClick={() => window.location.href = `/study/${id}/flashcard`}
          className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg transition-colors shadow-md"
        >
          Iniciar Flashcards
        </button>
        {isListAuthor && (
          <button
            onClick={() => window.location.href = `/lists/${id}/edit`}
            className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg transition-colors shadow-md"
          >
            Editar Lista
          </button>
        )}
      </div>

      {/* Sort Options */}
      <div className="mt-6 flex flex-col sm:flex-row items-center gap-3">
        <label className="text-gray-700 font-medium">Ordenar por:</label>
        <select
          value={sortOption}
          onChange={e => setSortOption(e.target.value)}
          className="border rounded-lg px-4 py-2 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
        >
          <option value="normal">Ordem original</option>
          <option value="reverse">Ordem inversa</option>
          <option value="best">Melhor status primeiro</option>
          <option value="worst">Pior status primeiro</option>
        </select>
      </div>
    </div>

    {/* Terms Grid */}
    <div className="grid gap-6">
      {getSortedTerms().map(term => (
        <TermCard key={term._id || term.id} term={term} />
      ))}
    </div>
  </div>
)
}
