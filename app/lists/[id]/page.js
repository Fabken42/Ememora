'use client'
import { useEffect, useState, useMemo } from 'react'
import { useParams } from 'next/navigation'
import TermCard from '@/components/TermCard'
import toast from 'react-hot-toast'
import useUserStore from '@/store/useUserStore'
import BackButton from '@/components/BackButton'
import { TERM_PAGE_SIZE } from '@/lib/utils'
import { useRouter } from 'next/navigation'
import { FiChevronLeft, FiChevronRight, FiEdit, FiLayers, FiPlay } from 'react-icons/fi'

export default function TermListPage() {
  const { id } = useParams()
  const [terms, setTerms] = useState([])
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [loadingReset, setLoadingReset] = useState(false)
  const [sortOption, setSortOption] = useState('worst')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [isListAuthor, setIsListAuthor] = useState(false)
  const { firebaseToken, isHydrated, user } = useUserStore()
  const router = useRouter()

  // Cálculo do progresso
  const progress = useMemo(() => {
    const totalTerms = terms.length || 0
    const max = totalTerms * 6
    const current = terms.reduce((acc, term) => {
      const status = term.myStatus ?? term.status ?? 0
      return acc + (typeof status === 'number' ? status : 0)
    }, 0) || 0
    return max > 0 ? Math.round((current / max) * 100) : 0
  }, [terms])

  useEffect(() => {
    if (!isHydrated || !id) return;

    const fetchTerms = async () => {
      try {
        const headers = {}
        if (firebaseToken) {
          headers['Authorization'] = `Bearer ${firebaseToken}`
        }

        const res = await fetch(
          `/api/lists/${id}?page=${page}&pageSize=${TERM_PAGE_SIZE}`,
          { headers }
        )

        if (res.status === 403) {
          toast.error('Você não tem acesso a esta lista.')
          router.push('/')
          return
        }

        if (!res.ok) {
          const err = await res.json().catch(() => ({}))
          throw new Error(err.error || 'Erro ao buscar lista')
        }

        const data = await res.json()
        setTerms(data.terms || [])
        setTitle(data.title || '')
        setDescription(data.description || '')
        setTotalPages(data.totalPages || 1)
        setIsListAuthor(user?.uid === data.ownerUid)
      } catch (err) {
        console.error('Erro ao buscar termos:', err)
        toast.error(err.message || 'Erro ao carregar lista')
      }
    }
    fetchTerms()
  }, [id, firebaseToken, page, router])


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
      case 'random':
        sorted.sort(() => Math.random() - 0.5)
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
    <>
      <BackButton className="mb-4" />
      <div className="p-4 max-w-3xl mx-auto space-y-6">
        {/* Header Section */}
        <div className="flex flex-col items-center text-center gap-3 mb-8 p-6 rounded-xl bg-[#24243e] border border-indigo-500/20 shadow-lg">
          <h1 className="text-3xl font-bold text-[--primary-text]">{title || 'Lista de Termos'}</h1>
          <p className="text-gray-300 max-w-2xl">{description}</p>

          {/* Barra de Progresso */}
          <div className="w-full max-w-md mt-4">
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm font-medium text-gray-300">Progresso</span>
              <span className="text-sm text-gray-300">{progress}%</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2.5">
              <div
                className="bg-indigo-500 h-2.5 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>

          {/* Reset Button */}
          <button
            onClick={resetStatus}
            disabled={loadingReset}
            className="bg-[#2d2b55] hover:bg-[#3a3780] text-gray-200 px-4 py-2 rounded-lg border border-indigo-500/30 transition-colors disabled:opacity-50 mt-4"
          >
            {loadingReset ? 'Resetando...' : 'Resetar Progresso'}
          </button>

          {/* Action Buttons */}
          <div className="flex flex-wrap justify-center gap-3 mt-4">
            <button
              onClick={() => window.location.href = `/study/${id}/quiz`}
              className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2 rounded-lg transition-colors shadow-md flex items-center gap-2"
            >
              <FiPlay className="w-4 h-4" /> Iniciar Quiz
            </button>
            <button
              onClick={() => window.location.href = `/study/${id}/flashcard`}
              className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-2 rounded-lg transition-colors shadow-md flex items-center gap-2"
            >
              <FiLayers className="w-4 h-4" /> Iniciar Flashcards
            </button>
            {isListAuthor && (
              <button
                onClick={() => window.location.href = `/lists/${id}/edit`}
                className="bg-gray-600 hover:bg-gray-500 text-white px-6 py-2 rounded-lg transition-colors shadow-md flex items-center gap-2"
              >
                <FiEdit className="w-4 h-4" /> Editar Lista
              </button>
            )}
          </div>

          {/* Sort Options */}
          <div className="mt-6 flex flex-col sm:flex-row items-center gap-3 p-3 bg-[#2d2b55] rounded-lg border border-indigo-500/30">
            <label className="text-gray-300 font-medium">Ordenar por:</label>
            <select
              value={sortOption}
              onChange={e => setSortOption(e.target.value)}
              className="border border-indigo-500/30 rounded-lg px-4 py-2 bg-[#24243e] text-[--primary-text] focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
            >
              <option value="worst">Pior status primeiro</option>
              <option value="best">Melhor status primeiro</option>
              <option value="normal">Ordem original</option>
              <option value="random">Ordem aleatória</option>
            </select>
          </div>
        </div>

        {/* Terms Grid */}
        <div className="grid gap-4">
          {getSortedTerms().map(term => (
            <TermCard key={term._id || term.id} term={term} isAuthenticated={!!firebaseToken} />
          ))}
        </div>

        {/* Pagination */}
        <div className="flex justify-center items-center gap-4 mt-6 p-4 bg-[#24243e] rounded-xl border border-indigo-500/20">
          <button
            onClick={() => setPage(prev => Math.max(1, prev - 1))}
            disabled={page <= 1}
            className="px-4 py-2 bg-[#2d2b55] text-gray-200 rounded-lg border border-indigo-500/30 disabled:opacity-50 hover:bg-[#3a3780] transition-colors flex items-center gap-2"
          >
            <FiChevronLeft className="w-4 h-4" /> Anterior
          </button>
          <span className="text-gray-300">Página {page} de {totalPages}</span>
          <button
            onClick={() => setPage(prev => Math.min(totalPages, prev + 1))}
            disabled={page >= totalPages}
            className="px-4 py-2 bg-[#2d2b55] text-gray-200 rounded-lg border border-indigo-500/30 disabled:opacity-50 hover:bg-[#3a3780] transition-colors flex items-center gap-2"
          >
            Próxima <FiChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </>
  )
}
