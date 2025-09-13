'use client'

import { useState } from 'react'
import { getStatusInfo } from '@/lib/utils'
import { FiCheck, FiX, FiInfo } from 'react-icons/fi'

export default function Flashcard({ term, onMark, showResult = false, wasCorrect = undefined, isAuthenticated = false, isMarking = false }) {
  const [flipped, setFlipped] = useState(false)
  const [showHint, setShowHint] = useState(false) // ← Novo estado para controlar a dica

  // Calcula o status ajustado baseado no resultado
  let adjustedStatus = Number(term.status) || 0
  if (wasCorrect === true) adjustedStatus += 1
  if (wasCorrect === false) adjustedStatus -= 1

  // Usa a função utilitária
  const { StatusIcon, color } = getStatusInfo(adjustedStatus)

  // Determinar a cor da borda baseada no resultado (modo revisão)
  const getBorderColor = () => {
    if (!showResult) return 'border-indigo-500/30' // Borda normal durante o jogo

    return wasCorrect ? 'border-green-400/50' : 'border-red-400/50'
  }

  // Função para toggle da dica (previne propagação do click do card)
  const toggleHint = (e) => {
    e.stopPropagation()
    setShowHint(prev => !prev)
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
          className={`relative w-full h-full transition-all duration-500 transform-style-preserve-3d ${flipped ? 'rotate-y-180' : ''}`}
        >
          {/* Frente */}
          <div className={`absolute w-full h-full backface-hidden rounded-xl shadow-lg bg-[#24243e] flex flex-col justify-between p-6 border-2 ${getBorderColor()} transition-colors`}>
            <div className="flex justify-between items-start">
              {isAuthenticated && <StatusIcon className={`${color} w-6 h-6`} />}
              <span className="text-xs text-gray-400 bg-[#2d2b55] px-2 py-1 rounded-full">Termo</span>
            </div>

            <div className="flex-1 flex flex-col justify-center items-center text-center">
              <h2 className="text-2xl font-semibold mb-3 break-all">{term.term}</h2>

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
                <div className="relative flex justify-center mt-2">
                  <button
                    onClick={toggleHint}
                    className="flex items-center gap-2 text-indigo-400 hover:text-indigo-300 transition-colors p-2 rounded-lg hover:bg-[#2d2b55]"
                    aria-label="Mostrar dica"
                  >
                    <FiInfo className="w-5 h-5" /> {/* Ícone maior */}
                    <span className="text-sm">Dica</span>
                  </button>

                  {/* Tooltip que aparece tanto no hover quanto no click */}
                  {(showHint) && (
                    <div className="fixed md:absolute bottom-4 md:bottom-auto md:top-full left-4 right-4 md:left-1/2 md:right-auto md:-translate-x-1/2 md:mt-2 md:w-64 bg-[#2d2b55] text-gray-200 text-sm rounded-lg p-3 shadow-lg z-50 border border-indigo-500/30 break-words">
                      {term.hint}

                      {/* Seta - aparece apenas no desktop */}
                      <div className="hidden md:block absolute -top-1 left-1/2 -translate-x-1/2 w-3 h-3 bg-[#2d2b55] transform rotate-45 border-t border-l border-indigo-500/30"></div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setShowHint(false)
                        }}
                        className="absolute top-1 right-1 text-gray-400 hover:text-white p-1"
                        aria-label="Fechar dica"
                      >
                        <FiX className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>
              )}
              {showResult && (
                <p className={`text-sm font-medium ${wasCorrect ? 'text-green-400' : 'text-red-400'} mt-2`}>
                  {wasCorrect ? '✓ Correto' : '✗ Errado'}
                </p>
              )}
              <p className="mt-2 text-xs text-indigo-400">Clique para ver a definição</p>
            </div>
          </div>

          {/* Verso */}
          <div className={`absolute w-full h-full backface-hidden rounded-xl shadow-lg bg-[#24243e] flex flex-col justify-between p-6 border-2 ${getBorderColor()} rotate-y-180 transition-colors`}>
            <div className="flex justify-between items-start">
              {isAuthenticated && <StatusIcon className={`${color} w-6 h-6`} />}
              <span className="text-xs text-gray-400 bg-[#2d2b55] px-2 py-1 rounded-full">Definição</span>
            </div>

            <div className="flex-1 flex flex-col justify-center items-center text-center">
              <p className="text-xl mb-3 break-all">{term.definition}</p>

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
                <p className={`text-sm font-medium ${wasCorrect ? 'text-green-400' : 'text-red-400'}`}>
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
            disabled={isMarking}
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
            disabled={isMarking}
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