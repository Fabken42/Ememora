'use client'

import { useState, useEffect } from 'react'
import { HelpCircle } from 'lucide-react'
import { STATUS_ICONS } from '@/lib/utils'

export default function Quiz({ term, options, onAnswer, reset }) {
  const [selected, setSelected] = useState(null)
  const [correctAnswer, setCorrectAnswer] = useState(null)

  const handleClick = (optionText) => {
    setSelected(optionText)
    setCorrectAnswer(term.definition)
    const isCorrect = optionText === term.definition
    onAnswer(isCorrect)
  }

  // Reset quando o termo muda
  useEffect(() => {
    setSelected(null)
    setCorrectAnswer(null)
  }, [term, reset])

  // Garante que o status esteja no intervalo 0-6
  const clampedStatus = Math.max(0, Math.min(STATUS_ICONS.length - 1, Number(term.status) || 0))
  const { icon: StatusIcon, color } = STATUS_ICONS[clampedStatus]

  return (
    <div className="border border-gray-200 p-6 rounded-xl bg-white shadow-sm hover:shadow-md transition-shadow">
      {/* Term Header */}
      <div className="flex flex-col items-center gap-3 mb-6">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-semibold text-gray-800 text-center">{term.term}</h2>
          <StatusIcon className={`text-3xl ${color}`} />
        </div>

        {/* Term Image */}
        {term.termImage && (
          <div className="w-full max-w-xs h-40 bg-gray-50 rounded-lg overflow-hidden border border-gray-200">
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
            <div className="flex items-center gap-1 text-gray-500 text-sm cursor-pointer">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
              </svg>
              <span>Dica</span>
            </div>
            <div className="absolute left-1/2 -translate-x-1/2 mt-2 w-64 bg-gray-800 text-white text-sm rounded-lg p-3 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 shadow-lg z-10">
              {term.hint}
              <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-3 h-3 bg-gray-800 transform rotate-45"></div>
            </div>
          </div>
        )}
      </div>

      {/* Options Grid */}
      <div className="grid gap-3">
        {options.map((opt, i) => {
          let bg = 'bg-white hover:bg-gray-50 border-gray-200'
          let border = 'border'

          if (selected) {
            if (opt.text === selected && opt.text === correctAnswer) {
              bg = 'bg-green-100 border-green-500'
              border = 'border-2'
            } else if (opt.text === selected && opt.text !== correctAnswer) {
              bg = 'bg-red-100 border-red-500'
              border = 'border-2'
            } else if (opt.text === correctAnswer) {
              bg = 'bg-green-100 border-green-500'
              border = 'border-2'
            }
          }

          return (
            <button
              key={i}
              onClick={() => !selected && handleClick(opt.text)}
              disabled={!!selected}
              className={`${border} ${bg} px-4 py-3 rounded-lg transition-all duration-200 flex flex-col items-center ${!selected ? 'cursor-pointer hover:shadow-md' : 'cursor-default'
                }`}
            >
              {opt.image && (
                <div className="w-full h-20 bg-white rounded-md mb-2 overflow-hidden flex items-center justify-center">
                  <img
                    src={opt.image}
                    alt="Imagem da opção"
                    className="max-h-full max-w-full object-contain"
                  />
                </div>
              )}
              <span className={`font-medium text-black ${selected && (opt.text === correctAnswer ? 'text-green-700' :
                  (opt.text === selected ? 'text-red-700' : 'text-gray-700'))
                }`}>
                {opt.text}
              </span>

              {selected && opt.text === correctAnswer && (
                <span className="text-green-600 text-xs mt-1 flex items-center gap-1">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Resposta correta
                </span>
              )}

              {selected && opt.text === selected && opt.text !== correctAnswer && (
                <span className="text-red-600 text-xs mt-1 flex items-center gap-1">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
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
