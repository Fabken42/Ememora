'use client'

import { useState, useEffect } from 'react'
import { HelpCircle } from 'lucide-react'
import { STATUS_ICONS } from '@/lib/utils'
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

  const handleClick = (optionText) => {
    if (showResult) return // Não faz nada no modo revisão

    setSelected(optionText)
    setCorrectAnswer(term.definition)
    const isCorrect = optionText === term.definition
    onAnswer(isCorrect, optionText) // Passa a opção selecionada
  }

  // Reset quando o termo muda
  useEffect(() => {
    setSelected(null)
    setCorrectAnswer(null)

    // No modo revisão, preencher automaticamente com os dados da revisão
    if (showResult && reviewData) {
      setSelected(reviewData.selectedOption)
      setCorrectAnswer(reviewData.correctAnswer)
    }
  }, [term, reset, showResult, reviewData])

  // Garante que o status esteja no intervalo 0-6
  const clampedStatus = Math.max(0, Math.min(STATUS_ICONS.length - 1, Number(term.status) || 0))
  const { icon: StatusIcon, color } = STATUS_ICONS[clampedStatus]

  // Determinar as opções a serem exibidas (no modo revisão, usar as opções originais)
  const displayOptions = showResult && reviewData ? reviewData.options : options

  return (
    <div className={`border-2 border-indigo-500/30 hover:border-indigo-500/50 p-6 rounded-xl bg-[#24243e] shadow-lg transition-all '
    }`}>
      {/* Term Header */}
      <div className="flex flex-col items-center gap-4 mb-6">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-semibold text-center">{term.term}</h2>
          {isAuthenticated && <StatusIcon className={`text-3xl ${showResult ? (wasCorrect ? 'text-green-400' : 'text-red-400') : color}`} />}
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

        {/* Hint */}
        {term.hint && (
          <div className="relative group mt-2">
            <div className="flex items-center gap-1 text-indigo-400 text-sm cursor-pointer hover:text-indigo-300 transition-colors">
              <FiInfo className="w-4 h-4" />
              <span>Dica</span>
            </div>
            <div className="absolute left-1/2 -translate-x-1/2 mt-2 w-64 bg-[#2d2b55] text-gray-200 text-sm rounded-lg p-3 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 shadow-lg z-10 border border-indigo-500/30">
              {term.hint}
              <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-3 h-3 bg-[#2d2b55] transform rotate-45 border-t border-l border-indigo-500/30"></div>
            </div>
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
              className={`${border} ${bg} px-4 py-3 rounded-lg transition-all duration-200 flex flex-col items-center ${!selected && !showResult ? 'cursor-pointer hover:shadow-md' : 'cursor-default'
                }`}
            >
              {opt.image && (
                <div className="w-full h-20 bg-[#24243e] rounded-md mb-2 overflow-hidden flex items-center justify-center border border-indigo-500/30">
                  <img
                    src={opt.image}
                    alt="Imagem da opção"
                    className="max-h-full max-w-full object-contain"
                  />
                </div>
              )}
              <span className={`font-medium ${textColor}`}>
                {opt.text}
              </span>

              {(showResult || selected) && opt.text === correctAnswer && (
                <span className="text-green-400 text-xs mt-1 flex items-center gap-1">
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