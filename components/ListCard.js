// components/ListCard.js
'use client'

import Link from 'next/link'
import { useState, useMemo } from 'react'
import useUserStore from '@/store/useUserStore'
import { CATEGORIES } from '@/lib/utils'

export default function ListCard({ list }) {
  const [likes, setLikes] = useState(list.likes || 0)
  const [liked, setLiked] = useState(false)
  const user = useUserStore(state => state.user)

  const categoryLabel = useMemo(() => {
    return CATEGORIES.find(cat => cat.value === list.category)?.label || list.category
  }, [list.category])

  const handleLike = async () => {
    if (!user || liked) return
    const res = await fetch(`/api/lists/${list._id}/like`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ uid: user.uid })
    })
    if (res.ok) {
      const data = await res.json()
      setLikes(data.likes)
      setLiked(true)
    }
  }

  const progress = useMemo(() => {
    const totalTerms = list.terms?.length || 0
    const max = totalTerms * 6

    // Ajustado para buscar o status no array progress
    const current = list.terms?.reduce((acc, term) => {
      const status =
        term.myStatus ??
        term.progress?.find(p => p.userId === user?.uid)?.status ??
        0
      return acc + (typeof status === 'number' ? status : 0)
    }, 0) || 0

    return max > 0 ? Math.round((current / max) * 100) : 0
  }, [list.terms, user?.uid])

  return (
    <div className="border p-4 rounded-md bg-white shadow relative">
      <div className="absolute top-2 right-3 text-sm">
        <button
          onClick={handleLike}
          disabled={!user || liked}
          className={`text-red-500 hover:underline ${liked ? 'opacity-50' : ''}`}
        >❤️ {likes}</button>
      </div>
      <h3 className="text-lg font-semibold mb-1">{list.title}</h3>
      <p className="text-sm text-gray-600 mb-2">{list.description}</p>
      <p className="text-xs text-gray-500 mb-2 italic">Categoria: {categoryLabel}</p>

      <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden mb-2">
        <div
          className="h-full bg-emerald-500"
          style={{ width: `${progress}%` }}
        />
      </div>
      <p className="text-xs text-gray-500 mb-2">Progresso: {progress}%</p>

      <Link href={`/lists/${list._id}/edit`} className="text-emerald-600 text-sm inline-block mr-2">Editar lista</Link>
      <Link href={`/study/${list._id}/flashcard`} className="text-emerald-600 text-sm inline-block mr-2">Flashcard</Link>
      <Link href={`/study/${list._id}/quiz`} className="text-emerald-600 text-sm inline-block mr-2">Quiz</Link>
      <Link href={`/lists/${list._id}`} className="text-emerald-600 text-sm inline-block">Lista de termos</Link>
    </div>
  )
}
