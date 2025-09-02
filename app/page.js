'use client'

import { useEffect, useState } from 'react'
import ListCard from '@/components/ListCard'
import { CATEGORIES, LIST_ORDER_BY, LISTS_PAGE_SIZE } from '@/lib/utils'
import useNavigationStore from '@/store/useNavigationStore'
import useUserStore from '@/store/useUserStore'
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi'

export default function HomePage() {
  const { setLastHomeOrUserPage } = useNavigationStore()
  const { user, firebaseToken } = useUserStore()

  const [lists, setLists] = useState([])
  const [loading, setLoading] = useState(true)
  const [sortBy, setSortBy] = useState('mostRecent')
  const [category, setCategory] = useState('all')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  useEffect(() => {
    setLastHomeOrUserPage('/')
  }, [setLastHomeOrUserPage])

  useEffect(() => {
    const fetchLists = async () => {
      setLoading(true)
      try {
        const catParam = category !== 'all' ? `&category=${category}` : ''
        const sortParam = sortBy ? `&sortBy=${sortBy}` : ''
        const uidParam = user?.uid ? `&uid=${user.uid}` : ''

        const res = await fetch(
          `/api/lists?sortBy=${sortParam}${catParam}${uidParam}&page=${page}&limit=${LISTS_PAGE_SIZE}`,
          {
            headers: firebaseToken ? { Authorization: `Bearer ${firebaseToken}` } : {}
          }
        )
        const data = await res.json()
        setLists(data.lists || [])
        setTotalPages(data.totalPages || 1)
      } catch (err) {
        console.error('Erro ao buscar listas públicas:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchLists()
  }, [sortBy, category, page, user?.uid, firebaseToken])


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

          {/* Paginação - Só mostra se houver mais de uma página */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-4 mt-8 p-4 bg-[#24243e] rounded-xl border border-indigo-500/20">
              <button
                onClick={() => setPage(prev => Math.max(prev - 1, 1))}
                disabled={page === 1}
                className="px-4 py-2 bg-[#2d2b55] hover:bg-[#3a3780] text-white rounded-lg border border-indigo-500/30 transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                <FiChevronLeft className="w-4 h-4" /> Anterior
              </button>
              
              <span className="text-gray-300">
                Página <span className="font-medium">{page}</span> de {totalPages}
              </span>
              
              <button
                onClick={() => setPage(prev => Math.min(prev + 1, totalPages))}
                disabled={page === totalPages}
                className="px-4 py-2 bg-[#2d2b55] hover:bg-[#3a3780] text-white rounded-lg border border-indigo-500/30 transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                Próximo <FiChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
 