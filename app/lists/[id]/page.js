'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import TermCard from '@/components/TermCard'
import toast from 'react-hot-toast'
import useUserStore from '@/store/useUserStore'
import BackButton from '@/components/BackButton'
import { useRouter } from 'next/navigation'
import { FiChevronLeft, FiChevronRight, FiEdit, FiLayers, FiPlay, FiChevronsLeft, FiChevronsRight, FiRefreshCw } from 'react-icons/fi'
import { getPageNumbers } from '@/lib/utils'

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
  const [totalProgress, setTotalProgress] = useState(0)
  const { firebaseToken, isHydrated, user } = useUserStore()
  const router = useRouter()



  useEffect(() => {
    if (!isHydrated || !id) return;

    const fetchTerms = async () => {
      try {
        const headers = {}
        if (firebaseToken) {
          headers['Authorization'] = `Bearer ${firebaseToken}`
        }

        const res = await fetch(
          `/api/lists/${id}?page=${page}&sort=${sortOption}`,
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
        setTotalProgress(data.totalProgress || 0)
        setIsListAuthor(user?.uid === data.ownerUid)
      } catch (err) {
        console.error('Erro ao buscar termos:', err)
        toast.error(err.message || 'Erro ao carregar lista')
      }
    }
    fetchTerms()
  }, [id, firebaseToken, page, router, sortOption])


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

      // Recarrega a página completamente
      window.location.reload()

    } catch (err) {
      console.error('Erro ao resetar status:', err)
      toast.error(err.message || 'Erro ao resetar status')
      setLoadingReset(false)
    }
  }

  return (
    <>
      <BackButton className="mb-4" />
      <div className="p-4 max-w-3xl mx-auto space-y-6">
        {/* Header Section */}
        <div className="flex flex-col items-center text-center gap-3 mb-8 p-6 rounded-xl bg-[#24243e] border border-indigo-500/20 shadow-lg relative">

          <div className="w-full flex justify-center mb-2">
            <button
              onClick={resetStatus}
              disabled={loadingReset}
              className="bg-[#2d2b55] hover:bg-[#3a3780] text-gray-200 px-3 py-2 rounded-lg border border-indigo-500/30 transition-colors disabled:opacity-50 flex items-center gap-2 text-sm"
              title="Resetar progresso"
            >
              <FiRefreshCw className="w-4 h-4" />
              {loadingReset ? 'Resetando...' : 'Resetar progresso'}
            </button>
          </div>

          <h1 className="text-3xl font-bold break-all">{title || 'Lista de Termos'}</h1>
          <p className="text-gray-300 max-w-2xl break-all">{description}</p>

          {/* Barra de Progresso */}
          <div className="w-full max-w-md mt-4">
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm font-medium text-gray-300">Progresso</span>
              <span className="text-sm text-gray-300">{totalProgress}%</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2.5">
              <div
                className="bg-indigo-500 h-2.5 rounded-full transition-all duration-300"
                style={{ width: `${totalProgress}%` }}
              ></div>
            </div>
          </div>

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
              onChange={e => {
                setSortOption(e.target.value)
                setPage(1)
              }}
              className="border border-indigo-500/30 rounded-lg px-4 py-2 bg-[#24243e] text-[--primary-text] focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
            >
              <option value="worst">Pior status primeiro</option>
              <option value="best">Melhor status primeiro</option>
              <option value="normal">Ordem original</option>
            </select>
          </div>
        </div>

        {/* Terms Grid */}
        <div className="grid gap-4">
          {terms.map(term => (
            <TermCard key={term._id} term={term} isAuthenticated={!!firebaseToken} />
          ))}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex flex-col items-center gap-4 mt-6 p-4 bg-[#24243e] rounded-xl border border-indigo-500/20">

            {/* Controles de navegação */}
            <div className="flex flex-wrap justify-center items-center gap-2">
              {/* Primeira página */}
              <button
                onClick={() => setPage(1)}
                disabled={page <= 1}
                className="px-3 py-2 bg-[#2d2b55] text-gray-200 rounded-lg border border-indigo-500/30 disabled:opacity-50 hover:bg-[#3a3780] transition-colors flex items-center gap-1"
                title="Primeira página"
              >
                <FiChevronsLeft className="w-3 h-3" />
              </button>

              {/* Página anterior */}
              <button
                onClick={() => setPage(prev => Math.max(1, prev - 1))}
                disabled={page <= 1}
                className="px-3 py-2 bg-[#2d2b55] text-gray-200 rounded-lg border border-indigo-500/30 disabled:opacity-50 hover:bg-[#3a3780] transition-colors flex items-center gap-1"
                title="Página anterior"
              >
                <FiChevronLeft className="w-3 h-3" />
              </button>

              {/* Números de página */}
              {getPageNumbers(page, totalPages).map((pageNum, index) => (
                pageNum === '...' ? (
                  <span key={`dots-${index}`} className="px-2 text-gray-400">
                    ...
                  </span>
                ) : (
                  <button
                    key={pageNum}
                    onClick={() => setPage(pageNum)}
                    className={`px-3 py-2 rounded-lg border transition-colors ${page === pageNum
                      ? 'bg-indigo-600 border-indigo-500 text-white'
                      : 'bg-[#2d2b55] border-indigo-500/30 text-gray-200 hover:bg-[#3a3780]'
                      }`}
                  >
                    {pageNum}
                  </button>
                )
              ))}

              {/* Próxima página */}
              <button
                onClick={() => setPage(prev => Math.min(totalPages, prev + 1))}
                disabled={page >= totalPages}
                className="px-3 py-2 bg-[#2d2b55] text-gray-200 rounded-lg border border-indigo-500/30 disabled:opacity-50 hover:bg-[#3a3780] transition-colors flex items-center gap-1"
                title="Próxima página"
              >
                <FiChevronRight className="w-3 h-3" />
              </button>

              {/* Última página */}
              <button
                onClick={() => setPage(totalPages)}
                disabled={page >= totalPages}
                className="px-3 py-2 bg-[#2d2b55] text-gray-200 rounded-lg border border-indigo-500/30 disabled:opacity-50 hover:bg-[#3a3780] transition-colors flex items-center gap-1"
                title="Última página"
              >
                <FiChevronsRight className="w-3 h-3" />
              </button>
            </div>

            {/* Info */}
            <div className="text-gray-300 text-sm">
              Página {page} de {totalPages}
            </div>
          </div>
        )}
      </div>
    </>
  )
}
