// app/page.js
'use client'

import { useEffect, useState } from 'react'
import ListCard from '@/components/ListCard'
import { CATEGORIES } from '@/lib/utils'

export default function HomePage() {
  const [lists, setLists] = useState([])
  const [loading, setLoading] = useState(true)
  const [sortBy, setSortBy] = useState('likes')
  const [category, setCategory] = useState('todas')

  useEffect(() => {
    const fetchLists = async () => {
      setLoading(true)
      try {
        const catParam = category !== 'todas' ? `&category=${category}` : ''
        const res = await fetch(`/api/lists?sort=${sortBy}${catParam}`)
        const data = await res.json()
        setLists(data)
      } catch (err) {
        console.error('Erro ao buscar listas públicas:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchLists()
  }, [sortBy, category])

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-4">Listas Públicas</h1>
      <div className="flex flex-wrap items-center gap-4 mb-4">
        <div>
          <label className="mr-2 font-medium">Ordenar por:</label>
          <select value={sortBy} onChange={e => setSortBy(e.target.value)} className="border rounded px-2 py-1">
            <option value="likes">Mais curtidas</option>
            <option value="recent">Mais recentes</option>
          </select>
        </div>
        <div>
          <label className="mr-2 font-medium">Categoria:</label>
          <select value={category} onChange={e => setCategory(e.target.value)} className="border rounded px-2 py-1">
            {CATEGORIES.map(cat => (
              <option key={cat.value} value={cat.value}>{cat.label}</option>
            ))}
          </select>
        </div>
      </div>
      {loading ? (
        <p>Carregando...</p>
      ) : (
        <div className="grid gap-4">
          {lists.length === 0 ? (
            <p>Nenhuma lista pública encontrada.</p>
          ) : (
            lists.map(list => <ListCard key={list._id} list={list} />)
          )}
        </div>
      )}
    </div>
  )
}
