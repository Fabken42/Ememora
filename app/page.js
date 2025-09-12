'use client'

import { useEffect, useState } from 'react'
import ListCard from '@/components/ListCard'
import { CATEGORIES, getPageNumbers, LIST_ORDER_BY, LISTS_PAGE_SIZE, LIMITS } from '@/lib/utils'
import useNavigationStore from '@/store/useNavigationStore'
import useUserStore from '@/store/useUserStore'
import { FiChevronLeft, FiChevronRight, FiChevronsLeft, FiChevronsRight, FiFilter, FiInbox } from 'react-icons/fi'
import AdvancedSearchModal from '@/components/AdvancedSearchModal'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

// Componente principal que usa useSearchParams - deve estar em Suspense
function HomeContent() {
  const searchParams = useSearchParams()
  const searchQuery = searchParams.get('search') || ''

  const { setLastHomeOrUserPage } = useNavigationStore()
  const { user, firebaseToken } = useUserStore()

  const [lists, setLists] = useState([])
  const [loading, setLoading] = useState(true)
  const [sortBy, setSortBy] = useState('mostRecent')
  const [category, setCategory] = useState('all')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  const [isAdvancedSearchOpen, setIsAdvancedSearchOpen] = useState(false);
  const [advancedFilters, setAdvancedFilters] = useState({
    minProgress: 0,
    maxProgress: 100,
    minTerms: 0,
    maxTerms: LIMITS.TOTAL_TERMS,
    minLikes: 0,
    minApprovalRate: 0
  });

  useEffect(() => {
    setLastHomeOrUserPage('/')
  }, [setLastHomeOrUserPage])

  useEffect(() => {
    const fetchLists = async () => {
      setLoading(true);
      try {
        const catParam = category !== 'all' ? `&category=${category}` : '';
        const sortParam = sortBy ? `&sortBy=${sortBy}` : '';
        const uidParam = user?.uid ? `&uid=${user.uid}` : '';
        const searchParam = searchQuery ? `&search=${encodeURIComponent(searchQuery)}` : '';

        // Parâmetros dos filtros avançados
        const advancedParams = `
          &minProgress=${advancedFilters.minProgress}
          &maxProgress=${advancedFilters.maxProgress}
          &minTerms=${advancedFilters.minTerms}
          &maxTerms=${advancedFilters.maxTerms}
          &minLikes=${advancedFilters.minLikes}
          &minApprovalRate=${advancedFilters.minApprovalRate}
        `.replace(/\s+/g, ''); // Remove espaços em branco

        const res = await fetch(
          `/api/lists?sortBy=${sortParam}${catParam}${uidParam}${searchParam}${advancedParams}&page=${page}&limit=${LISTS_PAGE_SIZE}`,
          {
            headers: firebaseToken ? { Authorization: `Bearer ${firebaseToken}` } : {}
          }
        );
        const data = await res.json();
        setLists(data.lists || []);
        setTotalPages(data.totalPages || 1);
      } catch (err) {
        console.error('Erro ao buscar listas públicas:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchLists();
  }, [sortBy, category, page, user?.uid, firebaseToken, advancedFilters, searchQuery]);

  return (
    <div className="max-w-4xl mx-auto p-6 min-h-screen">
      <div className="mb-8 p-6 bg-[#24243e] rounded-xl border border-indigo-500/20">
        <h1 className="text-3xl font-bold mb-2">Listas Públicas</h1>
        <p className="text-gray-300">Explore listas de estudo compartilhadas pela comunidade</p>
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6 p-4 bg-[#24243e] rounded-xl border border-indigo-500/20">
        <div className="flex-1">
          <label className="block mb-2 text-sm font-medium text-gray-300">Categoria:</label>
          <select
            value={category}
            onChange={e => { setCategory(e.target.value); setPage(1); }}
            className="w-full border border-indigo-500/30 bg-[#2d2b55] px-3 py-2 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
          >
            {CATEGORIES.map(cat => (
              <option key={cat.value} value={cat.value}>{cat.label}</option>
            ))}
          </select>
        </div>
        <div className="flex-1">
          <label className="block mb-2 text-sm font-medium text-gray-300">Ordenar por:</label>
          <select
            value={sortBy}
            onChange={e => {
              setSortBy(e.target.value)
              setPage(1)
            }}
            className="w-full border border-indigo-500/30 bg-[#2d2b55] px-3 py-2 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
          >
            {LIST_ORDER_BY
              .filter(opt => (opt.needsAuth ? !!user : true))
              .map(opt => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
          </select>
        </div>

        {/* Botão de busca avançada */}
        <div className="flex items-end">
          <button
            onClick={() => setIsAdvancedSearchOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors"
          >
            <FiFilter className="w-4 h-4" />
            Busca Avançada
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center p-12 bg-[#24243e] rounded-xl border border-indigo-500/20">
          <div className="flex items-center gap-3">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-500"></div>
            <p className="text-gray-300">Carregando listas...</p>
          </div>
        </div>
      ) : (
        <>
          <div className="grid gap-4">
            {lists.length === 0 ? (
              <div className="text-center p-12 bg-[#24243e] rounded-xl border border-indigo-500/20">
                <FiInbox className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                <p className="text-gray-400">Nenhuma lista pública encontrada.</p>
                <p className="text-gray-500 text-sm mt-2">Tente alterar os filtros ou categoria</p>
              </div>
            ) : (
              lists.map(list => <ListCard key={list._id} list={list} />)
            )}
          </div>

          {/* Paginação */}
          {totalPages > 1 && (
            <div className="flex flex-col items-center gap-4 mt-8 p-4 bg-[#24243e] rounded-xl border border-indigo-500/20">
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
        </>
      )}

      <AdvancedSearchModal
        isOpen={isAdvancedSearchOpen}
        onClose={() => setIsAdvancedSearchOpen(false)}
        filters={advancedFilters}
        onFiltersChange={setAdvancedFilters}
        onApplyFilters={() => setPage(1)}
      />
    </div>
  )
}

// Componente principal da página
export default function HomePage() {
  return (
    <Suspense fallback={
      <div className="max-w-4xl mx-auto p-6 min-h-screen">
        <div className="mb-8 p-6 bg-[#24243e] rounded-xl border border-indigo-500/20 animate-pulse">
          <div className="h-8 bg-[#2d2b55] rounded w-1/3 mb-2"></div>
          <div className="h-4 bg-[#2d2b55] rounded w-1/2"></div>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 mb-6 p-4 bg-[#24243e] rounded-xl border border-indigo-500/20">
          <div className="flex-1">
            <div className="h-4 bg-[#2d2b55] rounded w-1/4 mb-2"></div>
            <div className="h-10 bg-[#2d2b55] rounded"></div>
          </div>
          <div className="flex-1">
            <div className="h-4 bg-[#2d2b55] rounded w-1/4 mb-2"></div>
            <div className="h-10 bg-[#2d2b55] rounded"></div>
          </div>
          <div className="flex items-end">
            <div className="h-10 bg-[#2d2b55] rounded w-32"></div>
          </div>
        </div>

        <div className="flex justify-center items-center p-12 bg-[#24243e] rounded-xl border border-indigo-500/20">
          <div className="flex items-center gap-3">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-500"></div>
            <p className="text-gray-300">Carregando...</p>
          </div>
        </div>
      </div>
    }>
      <HomeContent />
    </Suspense>
  )
}