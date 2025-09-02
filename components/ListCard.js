// components/ListCard.js
'use client'

import Link from 'next/link'
import { useMemo, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import useUserStore from '@/store/useUserStore'
import { CATEGORIES } from '@/lib/utils'
import toast from 'react-hot-toast'
import Avatar from './Avatar'
import { FiBook, FiCalendar, FiEdit, FiHelpCircle, FiLayers, FiTag, FiThumbsDown, FiThumbsUp, FiTrendingUp } from 'react-icons/fi'

export default function ListCard({ list }) {
  const router = useRouter()
  const user = useUserStore(state => state.user)
  const uid = user?.uid

  // state: feedback
  const [likes, setLikes] = useState(list.likes || 0)
  const [dislikes, setDislikes] = useState(list.dislikes || 0)
  const [likedBy, setLikedBy] = useState(list.likedBy || [])
  const [dislikedBy, setDislikedBy] = useState(list.dislikedBy || [])

  const isOwner = uid && list.ownerUid && uid === list.ownerUid

  const categoryLabel = useMemo(() => {
    return CATEGORIES.find(cat => cat.value === list.category)?.label || list.category
  }, [list.category])

  const hasLiked = useMemo(() => (uid ? likedBy.includes(uid) : false), [likedBy, uid])
  const hasDisliked = useMemo(() => (uid ? dislikedBy.includes(uid) : false), [dislikedBy, uid])

  const totalVotes = likes + dislikes
  const approval = totalVotes > 0 ? Math.round((likes / totalVotes) * 100) : 0

  const formatDate = useCallback((d) => {
    if (!d) return ''
    const date = typeof d === 'string' || typeof d === 'number' ? new Date(d) : d
    if (Number.isNaN(date.getTime())) return ''
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
  }, [])

  const applyOptimistic = (next) => {
    // why: feedback deve parecer instantâneo
    setLikes(next.likes)
    setDislikes(next.dislikes)
    setLikedBy(next.likedBy)
    setDislikedBy(next.dislikedBy)
  }

  const computeNextState = (action) => {
    const next = {
      likes,
      dislikes,
      likedBy: [...likedBy],
      dislikedBy: [...dislikedBy],
    }
    if (!uid) return next

    if (action === 'like') {
      if (hasLiked) {
        next.likes = Math.max(0, next.likes - 1)
        next.likedBy = next.likedBy.filter(id => id !== uid)
      } else if (hasDisliked) {
        next.dislikes = Math.max(0, next.dislikes - 1)
        next.dislikedBy = next.dislikedBy.filter(id => id !== uid)
        next.likes = next.likes + 1
        next.likedBy.push(uid)
      } else {
        next.likes = next.likes + 1
        next.likedBy.push(uid)
      }
    }

    if (action === 'dislike') {
      if (hasDisliked) {
        next.dislikes = Math.max(0, next.dislikes - 1)
        next.dislikedBy = next.dislikedBy.filter(id => id !== uid)
      } else if (hasLiked) {
        next.likes = Math.max(0, next.likes - 1)
        next.likedBy = next.likedBy.filter(id => id !== uid)
        next.dislikes = next.dislikes + 1
        next.dislikedBy.push(uid)
      } else {
        next.dislikes = next.dislikes + 1
        next.dislikedBy.push(uid)
      }
    }

    return next
  }

  const sendToServer = async (voteType) => {
    const res = await fetch(`/api/lists/${list._id}/feedback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ uid, vote: voteType }),
    })
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      throw new Error(data?.error || 'Falha ao enviar feedback')
    }
    return res.json()
  }

  const handleVote = async (voteType, e) => {
    e?.stopPropagation() // evita clique propagar para o card
    if (!uid) return toast.error('Faça login para votar')

    const prev = { likes, dislikes, likedBy: [...likedBy], dislikedBy: [...dislikedBy] }
    const next = computeNextState(voteType)
    applyOptimistic(next)

    try {
      const data = await sendToServer(voteType)
      setLikes(data.likes)
      setDislikes(data.dislikes)
      setLikedBy(data.likedBy || [])
      setDislikedBy(data.dislikedBy || [])
    } catch (err) {
      applyOptimistic(prev) // rollback
      toast.error(err.message)
    }
  }

  const onCardClick = () => {
    router.push(`/lists/${list._id}`)
  }

  const progress = useMemo(() => {
    const totalTerms = list.terms?.length || 0
    const max = totalTerms * 6
    const current = list.terms?.reduce((acc, term) => {
      const status = term.myStatus ?? term.progress?.find(p => p.userId === uid)?.status ?? 0
      return acc + (typeof status === 'number' ? status : 0)
    }, 0) || 0
    return max > 0 ? Math.round((current / max) * 100) : 0
  }, [list.terms, uid])

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onCardClick}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onCardClick() }}
      className="border border-indigo-500/30 p-6 rounded-xl bg-[#24243e] shadow-lg relative cursor-pointer select-none transition-all hover:border-indigo-500/50 hover:shadow-xl"
    >
      {/* Botões de feedback */}
      <div className="absolute top-4 right-4 flex gap-2">
        <button 
          onClick={(e) => handleVote('like', e)} 
          className="p-2 bg-[#2d2b55] hover:bg-emerald-500/20 rounded-lg border border-emerald-500/30 text-emerald-400 hover:text-emerald-300 transition-colors" 
          aria-label="Curtir"
        >
          <FiThumbsUp className="w-4 h-4" />
        </button>
        <button 
          onClick={(e) => handleVote('dislike', e)} 
          className="p-2 bg-[#2d2b55] hover:bg-red-500/20 rounded-lg border border-red-500/30 text-red-400 hover:text-red-300 transition-colors" 
          aria-label="Não curtir"
        >
          <FiThumbsDown className="w-4 h-4" />
        </button>
      </div>

      {/* Cabeçalho */}
      <h3 className="text-lg font-semibold mb-2 pr-20 line-clamp-2">{list.title}</h3>
      <p className="text-sm text-gray-300 mb-4 line-clamp-3">{list.description}</p>

      {/* Metadados */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-gray-400 mb-4 p-3 bg-[#2d2b55] rounded-lg border border-indigo-500/30">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1">
            <FiBook className="w-3 h-3" />
            {list.terms.length} termos
          </span>
          <span className="flex items-center gap-1">
            <FiTag className="w-3 h-3" />
            {categoryLabel}
          </span>
          <span className="flex items-center gap-1" title={formatDate(list.createdAt)}>
            <FiCalendar className="w-3 h-3" />
            {formatDate(list.createdAt)}
          </span>
        </div>

        <button
          onClick={(e) => { e.stopPropagation(); router.push(`/users/${list.owner?.uid || list.ownerUid}`) }}
          className="flex items-center gap-2 hover:text-emerald-400 transition-colors group"
          title="Ver perfil do autor"
        >
          <Avatar
            src={list?.owner?.image}
            alt="Avatar"
            size={24}
            className="border-2 border-emerald-500/50 group-hover:border-emerald-400 transition-colors"
          />
          <span className="max-w-[120px] truncate text-gray-300 group-hover:text-emerald-400">
            {list.owner?.name || 'Autor desconhecido'}
          </span>
        </button>
      </div>

      {/* Barra de aprovação */}
      <div className="mb-4 p-3 bg-[#2d2b55] rounded-lg border border-indigo-500/30">
        <div className="w-full h-2 bg-[#3a3560] rounded-full overflow-hidden mb-2">
          <div className="h-full bg-emerald-500 transition-all duration-300" style={{ width: `${approval}%` }} />
        </div>
        <div className="flex items-center justify-between text-xs text-gray-400">
          <span className="flex items-center gap-1">
            <FiThumbsUp className="w-3 h-3 text-emerald-400" /> {likes}
          </span>
          <span className="flex items-center gap-1">
            <FiThumbsDown className="w-3 h-3 text-red-400" /> {dislikes}
          </span>
          <span className="font-medium text-emerald-400">{approval}% aprovação</span>
          <span className="text-gray-500">Total: {totalVotes}</span>
        </div>
      </div>

      {/* Progresso */}
      <div className="mb-4 p-3 bg-[#2d2b55] rounded-lg border border-indigo-500/30">
        <div className="flex items-center justify-between text-xs text-gray-400 mb-2">
          <span className="flex items-center gap-1">
            <FiTrendingUp className="w-3 h-3 text-emerald-400" /> Progresso
          </span>
          <span className="text-emerald-400 font-medium">{progress}%</span>
        </div>
        <div className="w-full h-2 bg-[#3a3560] rounded-full overflow-hidden">
          <div className="h-full bg-emerald-500 transition-all duration-300" style={{ width: `${progress}%` }} />
        </div>
      </div>

      {/* Ações */}
      <div className="flex flex-wrap gap-3 mt-4 pt-4 border-t border-indigo-500/30">
        {isOwner && (
          <Link
            href={`/lists/${list._id}/edit`}
            onClick={(e) => e.stopPropagation()}
            className="px-3 py-2 bg-[#2d2b55] hover:bg-indigo-500/20 text-indigo-400 hover:text-indigo-300 text-sm rounded-lg border border-indigo-500/30 transition-colors flex items-center gap-2"
          >
            <FiEdit className="w-3 h-3" /> Editar
          </Link>
        )}
        <Link
          href={`/study/${list._id}/flashcard`}
          onClick={(e) => e.stopPropagation()}
          className="px-3 py-2 bg-[#2d2b55] hover:bg-emerald-500/20 text-emerald-400 hover:text-emerald-300 text-sm rounded-lg border border-emerald-500/30 transition-colors flex items-center gap-2"
        >
          <FiLayers className="w-3 h-3" /> Flashcard
        </Link>
        <Link
          href={`/study/${list._id}/quiz`}
          onClick={(e) => e.stopPropagation()}
          className="px-3 py-2 bg-[#2d2b55] hover:bg-blue-500/20 text-blue-400 hover:text-blue-300 text-sm rounded-lg border border-blue-500/30 transition-colors flex items-center gap-2"
        >
          <FiHelpCircle className="w-3 h-3" /> Quiz
        </Link>
      </div>
    </div>
  )
}
