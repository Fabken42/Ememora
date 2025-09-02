'use client'

import { useEffect, useState } from 'react'
import { getAuth, onAuthStateChanged } from 'firebase/auth'
import { STATUS_ICONS } from '@/lib/utils'

export default function TermCard({ term, isAuthenticated }) {
  const [uid, setUid] = useState(null)

  useEffect(() => {
    const auth = getAuth()
    const unsubscribe = onAuthStateChanged(auth, user => {
      setUid(user ? user.uid : null)
    })

    return () => unsubscribe()
  }, [])

  let status
  if (typeof term?.myStatus === 'number') {
    status = term.myStatus
  } else if (Array.isArray(term?.progress) && uid) {
    const p = term.progress.find(p => p.userId === uid)
    status = p ? Number(p.status || 0) : 0
  } else if (typeof term?.status === 'number') {
    status = term.status
  } else {
    status = 0
  }

  // Garante que o índice esteja no intervalo 0-6
  const clamped = Math.max(0, Math.min(STATUS_ICONS.length - 1, Number(status) || 0))
  const { icon: StatusIcon, color } = STATUS_ICONS[clamped]

  return (
  <div className="border border-gray-200 p-6 rounded-xl bg-white shadow-sm hover:shadow-md transition-shadow">
    {/* Term Header */}
    <div className="flex justify-between items-start gap-4 mb-4">
      <h4 className="text-xl font-semibold text-gray-800 break-words flex-1">
        {term.term}
      </h4>
      {isAuthenticated && <StatusIcon className={`text-3xl ${color} min-w-[24px]`} />}
    </div>

    {/* Term Image */}
    {term.termImage && (
      <div className="mb-4 overflow-hidden rounded-lg bg-gray-100">
        <img
          src={term.termImage}
          alt="Imagem do termo"
          className="w-full h-auto max-h-60 object-contain mx-auto"
          loading="lazy"
        />
      </div>
    )}

    {/* Definition */}
    <p className="text-gray-700 mb-4 whitespace-pre-line">
      {term.definition}
    </p>

    {/* Definition Image */}
    {term.definitionImage && (
      <div className="mb-4 overflow-hidden rounded-lg bg-gray-100">
        <img
          src={term.definitionImage}
          alt="Imagem da definição"
          className="w-full h-auto max-h-60 object-contain mx-auto"
          loading="lazy"
        />
      </div>
    )}

    {/* Hint */}
    {term.hint && (
      <div className="mt-4 pt-3 border-t border-gray-100">
        <p className="text-sm text-gray-500 italic">
          <span className="font-medium text-gray-600">Dica:</span> {term.hint}
        </p>
      </div>
    )}
  </div>
)
}
