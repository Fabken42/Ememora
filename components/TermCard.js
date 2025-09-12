'use client'

import { useEffect, useState } from 'react'
import { getAuth, onAuthStateChanged } from 'firebase/auth'
import { getStatusInfo } from '@/lib/utils'
import { Lightbulb } from 'lucide-react'

export default function TermCard({ term, isAuthenticated }) {
  const [uid, setUid] = useState(null)

  useEffect(() => {
    const auth = getAuth()
    const unsubscribe = onAuthStateChanged(auth, user => {
      setUid(user ? user.uid : null)
    })

    return () => unsubscribe()
  }, [])

  const status = term?.status || 0
  const { StatusIcon, color } = getStatusInfo(status)

  return (
    <div className="border border-indigo-500/30 p-6 rounded-xl bg-[#24243e] shadow-lg hover:shadow-xl transition-all">
      {/* Term Header */}
      <div className="flex justify-between items-start gap-4 mb-4">
        <h4 className="text-xl font-semibold break-all flex-1">
          {term.term}
        </h4>
        {isAuthenticated && <StatusIcon className={`text-3xl ${color} min-w-[24px]`} />}
      </div>

      {/* Term Image */}
      {term.termImage && (
        <div className="mb-4 overflow-hidden rounded-lg bg-[#2d2b55] border border-indigo-500/30">
          <img
            src={term.termImage}
            alt="Imagem do termo"
            className="w-full h-auto max-h-60 object-contain mx-auto p-2"
            loading="lazy"
          />
        </div>
      )}

      {/* Definition */}
      <p className="text-gray-300 mb-4 whitespace-pre-line leading-relaxed break-all">
        {term.definition}
      </p>

      {/* Definition Image */}
      {term.definitionImage && (
        <div className="mb-4 overflow-hidden rounded-lg bg-[#2d2b55] border border-indigo-500/30">
          <img
            src={term.definitionImage}
            alt="Imagem da definição"
            className="w-full h-auto max-h-60 object-contain mx-auto p-2"
            loading="lazy"
          />
        </div>
      )}

      {/* Hint */}
      {term.hint && (
        <div className="mt-4 pt-4 border-t border-indigo-500/30">
          <p className="text-sm text-indigo-300 italic flex items-start gap-2 break-all">
            <span className="flex-shrink-0 mt-0.5">
              <Lightbulb className="w-4 h-4 text-amber-400" />
            </span>
            <span>
              <span className="font-medium text-amber-400">Dica:</span> {term.hint}
            </span>
          </p>
        </div>
      )}
    </div>
  )
}