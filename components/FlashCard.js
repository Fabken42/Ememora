'use client'

import { useState, useEffect } from 'react'
import { STATUS_ICONS } from '@/lib/utils'
import { FiCheck, FiX } from 'react-icons/fi'

export default function Flashcard({ term, onMark, showResult = false, wasCorrect = undefined, isAuthenticated = false }) {
  const [flipped, setFlipped] = useState(false)
  const [animate, setAnimate] = useState(true)

  useEffect(() => {
    setAnimate(false) // desativa transição
    setFlipped(false)
    // reativa transição depois de 50ms
    const t = setTimeout(() => setAnimate(true), 50)
    return () => clearTimeout(t)
  }, [term])

  // Garantir que o status fique entre 0 e STATUS_ICONS.length - 1
  const clampedStatus = Math.max(0, Math.min(STATUS_ICONS.length - 1, Number(term.status) || 0))
  const { icon: StatusIcon, color } = STATUS_ICONS[clampedStatus]

  // Determinar a cor baseada no resultado (se estiver no modo revisão)
  const getStatusColor = () => {
    if (!showResult) return color // Cor normal durante o jogo

    return wasCorrect ? 'text-green-600' : 'text-red-600'
  }

  // Determinar a cor da borda baseada no resultado (modo revisão)
  const getBorderColor = () => {
    if (!showResult) return 'border-indigo-500/30' // Borda normal durante o jogo

    return wasCorrect ? 'border-green-300' : 'border-red-300'
  }

  return (
    <div className="flex flex-col items-center">
      {/* Card Container */}
      <div
        className="w-full max-w-md h-64 perspective-1000 cursor-pointer mb-8"
        onClick={() => setFlipped(prev => !prev)}
      >
        {/* Card Inner */}
        <div
          className={`relative w-full h-full ${animate ? 'transition-all duration-500' : ''} transform-style-preserve-3d ${flipped ? 'rotate-y-180' : ''}`}
        >
          {/* Frente */}
          <div className={`absolute w-full h-full backface-hidden rounded-xl shadow-lg bg-[#24243e] flex flex-col justify-between p-6 border-2 ${getBorderColor()} transition-colors`}>
            <div className="flex justify-between items-start">
              {isAuthenticated && <StatusIcon className={`${getStatusColor()} w-6 h-6`} />}
              <span className="text-xs text-gray-400 bg-[#2d2b55] px-2 py-1 rounded-full">Termo</span>
            </div>

            <div className="flex-1 flex flex-col justify-center items-center text-center">
              <h2 className="text-2xl font-semibold mb-3">{term.term}</h2>

              {term.termImage && (
                <div className="w-full h-32 bg-[#2d2b55] rounded-lg overflow-hidden mb-3 border border-indigo-500/30">
                  <img
                    src={term.termImage}
                    alt="Imagem do termo"
                    className="w-full h-full object-contain"
                  />
                </div>
              )}
            </div>

            <div className="text-center">
              {term.hint && (
                <p className="text-sm text-gray-300 italic bg-[#2d2b55] px-3 py-2 rounded-lg border border-indigo-500/30">
                  💡 Dica: {term.hint}
                </p>
              )}
              {showResult && (
                <p className={`text-sm font-medium ${getStatusColor()} mt-2`}>
                  {wasCorrect ? '✓ Correto' : '✗ Errado'}
                </p>
              )}
              <p className="mt-2 text-xs text-indigo-400">Clique para ver a definição</p>
            </div>
          </div>

          {/* Verso */}
          <div className={`absolute w-full h-full backface-hidden rounded-xl shadow-lg bg-[#24243e] flex flex-col justify-between p-6 border-2 ${getBorderColor()} rotate-y-180 transition-colors`}>
            <div className="flex justify-between items-start">
              {isAuthenticated && <StatusIcon className={`${getStatusColor()} w-6 h-6`} />}
              <span className="text-xs text-gray-400 bg-[#2d2b55] px-2 py-1 rounded-full">Definição</span>
            </div>

            <div className="flex-1 flex flex-col justify-center items-center text-center">
              <p className="text-xl mb-3">{term.definition}</p>

              {term.definitionImage && (
                <div className="w-full h-32 bg-[#2d2b55] rounded-lg overflow-hidden mb-3 border border-indigo-500/30">
                  <img
                    src={term.definitionImage}
                    alt="Imagem da definição"
                    className="w-full h-full object-contain"
                  />
                </div>
              )}
            </div>

            <div className="text-center">
              {showResult && (
                <p className={`text-sm font-medium ${getStatusColor()}`}>
                  {wasCorrect ? '✓ Correto' : '✗ Errado'}
                </p>
              )}
              <p className="text-xs text-indigo-400">Clique para ver o termo</p>
            </div>
          </div>
        </div>
      </div>

      {/* Botões de ação (só aparecem durante o jogo, não na revisão) */}
      {!showResult && onMark && (
        <div className="flex gap-4 justify-center mt-4 w-full max-w-md">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onMark(false);
            }}
            className="flex-1 bg-[#2d2b55] hover:bg-red-500/20 text-red-400 px-6 py-3 rounded-lg border border-red-500/30 transition-colors font-medium flex items-center justify-center gap-2"
          >
            <FiX className="w-5 h-5" />
            Errei
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onMark(true);
            }}
            className="flex-1 bg-[#2d2b55] hover:bg-green-500/20 text-green-400 px-6 py-3 rounded-lg border border-green-500/30 transition-colors font-medium flex items-center justify-center gap-2"
          >
            <FiCheck className="w-5 h-5" />
            Acertei
          </button>
        </div>
      )}
    </div>
  )
}