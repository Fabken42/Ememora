'use client'

import { useState, useEffect } from 'react'
import { getStatusInfo } from '@/lib/utils'
import { FiCheck, FiInfo, FiX } from 'react-icons/fi'

export default function Quiz({
  term,
  options,
  onAnswer,
  reset,
  showResult = false,
  wasCorrect = undefined,
  reviewData = undefined,
  isAuthenticated = false
}) {
  const [selected, setSelected] = useState(null)
  const [correctAnswer, setCorrectAnswer] = useState(null)
  const [showHint, setShowHint] = useState(false) // ← Novo estado para controlar a dica

  const handleClick = (optionText) => {
    if (showResult) return // Não faz nada no modo revisão

    setSelected(optionText)
    setCorrectAnswer(term.definition)
    const isCorrect = optionText === term.definition
    onAnswer(isCorrect, optionText) // Passa a opção selecionada
  }

  // Função para toggle da dica
  const toggleHint = (e) => {
    if (e) e.stopPropagation()
    setShowHint(prev => !prev)
  }

  // Fechar dica quando o termo mudar
  useEffect(() => {
    setShowHint(false)
    setSelected(null)
    setCorrectAnswer(null)

    // No modo revisão, preencher automaticamente com os dados da revisão
    if (showResult && reviewData) {
      setSelected(reviewData.selectedOption)
      setCorrectAnswer(reviewData.correctAnswer)
    }
  }, [term, reset, showResult, reviewData])

  const getBorderColor = () => {
    // No modo revisão, usa a cor baseada no resultado anterior
    if (showResult) {
      return wasCorrect ? 'border-green-400/50' : 'border-red-400/50'
    }

    // Durante o jogo, quando uma resposta é selecionada
    if (selected && correctAnswer) {
      const isCorrect = selected === correctAnswer
      return isCorrect ? 'border-green-400/50' : 'border-red-400/50'
    }

    // Estado normal (antes de responder)
    return 'border-indigo-500/30 hover:border-indigo-500/50'
  }

  // Calcula o status ajustado baseado na resposta atual
  let adjustedStatus = Number(term.status) || 0

  if (selected && correctAnswer) {
    if (selected === correctAnswer) adjustedStatus += 1
    else adjustedStatus -= 1
  }

  const { StatusIcon, color } = getStatusInfo(adjustedStatus)

  const displayOptions = showResult && reviewData ? reviewData.options : options

  return (
    <div className={`border-2 p-6 rounded-xl bg-[#24243e] shadow-lg transition-all ${getBorderColor()}`}>
      {/* Term Header */}
      <div className="flex flex-col items-center gap-4 mb-6">
        <div className="flex items-center gap-3">
          <h2 className="text-3xl font-bold text-center break-all text-white leading-snug">
            {term.term}
          </h2>

          {isAuthenticated && <StatusIcon className={`text-3xl ${color} shrink-0`} />}
        </div>

        {/* Term Image */}
        {term.termImage && (
          <div className="w-full max-w-xs h-40 bg-[#2d2b55] rounded-lg overflow-hidden border border-indigo-500/30">
            <img
              src={term.termImage}
              alt="Imagem do termo"
              className="w-full h-full object-contain p-2"
            />
          </div>
        )}

        {/* Hint - Versão melhorada */}
        {term.hint && (
          <div className="relative flex justify-center mt-2">
            <button
              onClick={toggleHint}
              className="flex items-center gap-2 text-indigo-400 hover:text-indigo-300 transition-colors p-2 rounded-lg hover:bg-[#2d2b55]"
              aria-label="Mostrar dica"
            >
              <FiInfo className="w-5 h-5" /> {/* Ícone maior */}
              <span className="text-base font-medium">Dica</span>
            </button>

            {/* Tooltip que aparece tanto no hover quanto no click */}
            {(showHint) && (
              <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 w-72 bg-[#2d2b55] text-gray-200 text-base rounded-lg p-4 shadow-lg z-10 border border-indigo-500/30 break-words">
                {term.hint}
                <div className="absolute top-1/2 -left-1 -translate-y-1/2 w-3 h-3 bg-[#2d2b55] transform rotate-45 border-l border-b border-indigo-500/30"></div>

                {/* Botão de fechar para mobile */}
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
          <p className={`text-sm font-medium ${wasCorrect ? 'text-green-400' : 'text-red-400'} flex items-center gap-2`}>
            {wasCorrect ? <FiCheck className="w-4 h-4" /> : <FiX className="w-4 h-4" />}
            {wasCorrect ? 'Correto' : 'Errado'}
          </p>
        )}
      </div>

      {/* Options Grid */}
      <div className="grid gap-3">
        {displayOptions.map((opt, i) => {
          let bg = 'bg-[#2d2b55] hover:bg-[#3a3780] border-indigo-500/30'
          let border = 'border'
          let textColor = 'text-[var(--primary-text)]'

          // No modo revisão ou quando uma resposta foi selecionada
          if (showResult || selected) {
            if (opt.text === correctAnswer) {
              bg = 'bg-green-500/20 border-green-500/50'
              border = 'border-2'
              textColor = 'text-green-400'
            } else if (selected && opt.text === selected && opt.text !== correctAnswer) {
              bg = 'bg-red-500/20 border-red-500/50'
              border = 'border-2'
              textColor = 'text-red-400'
            }
          }

          return (
            <button
              key={i}
              onClick={() => handleClick(opt.text)}
              disabled={!!selected || showResult}
              className={`${border} ${bg} px-6 py-4 rounded-xl transition-all duration-200 flex flex-col items-center ${!selected && !showResult ? 'cursor-pointer hover:shadow-md' : 'cursor-default'
                }`}
            >
              {opt.image && (
                <div className="w-full h-20 bg-[#24243e] rounded-md mb-2 overflow-hidden flex items-center justify-center border border-indigo-500/30 ">
                  <img
                    src={opt.image}
                    alt="Imagem da opção"
                    className="max-h-full max-w-full object-contain"
                  />
                </div>
              )}
              <span className={`text-lg font-semibold ${textColor} text-center break-all leading-relaxed`}>
                {opt.text}
              </span>


              {(showResult || selected) && opt.text === correctAnswer && (
                <span className="text-green-400 text-sm mt-2 flex items-center gap-2 font-medium">
                  <FiCheck className="w-3 h-3" />
                  Resposta correta
                </span>
              )}

              {selected && opt.text === selected && opt.text !== correctAnswer && (
                <span className="text-red-400 text-xs mt-1 flex items-center gap-1">
                  <FiX className="w-3 h-3" />
                  Sua resposta
                </span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}