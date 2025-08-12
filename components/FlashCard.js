'use client'

import { useState } from 'react'
import { STATUS_ICONS } from '@/lib/utils'

export default function Flashcard({ term, onMark }) {
  const [flipped, setFlipped] = useState(false)

  // Garantir que o status fique entre 0 e STATUS_ICONS.length - 1
  console.log("Term status:", term.status);
  const clampedStatus = Math.max(0, Math.min(STATUS_ICONS.length - 1, Number(term.status) || 0))
  const { icon: StatusIcon, color } = STATUS_ICONS[clampedStatus]

  return (
  <div className="flex flex-col items-center">
    {/* Card Container */}
    <div
      className="w-full max-w-md h-64 perspective-1000 cursor-pointer mb-8"
      onClick={() => setFlipped(prev => !prev)}
    >
      {/* Card Inner */}
      <div
        className={`relative w-full h-full transition-all duration-500 transform-style-preserve-3d ${
          flipped ? 'rotate-y-180' : ''
        }`}
      >
        {/* Frente */}
        <div className="absolute w-full h-full backface-hidden rounded-xl shadow-lg bg-white flex flex-col justify-between p-6 border border-gray-100">
          <div className="flex justify-between items-start">
            <StatusIcon className={`${color} w-6 h-6`} />
            <span className="text-xs text-gray-400">Termo</span>
          </div>
          
          <div className="flex-1 flex flex-col justify-center items-center text-center">
            <h2 className="text-2xl font-semibold text-gray-800 mb-3">{term.term}</h2>
            
            {term.termImage && (
              <div className="w-full h-32 bg-gray-50 rounded-lg overflow-hidden mb-3">
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
              <p className="text-sm text-gray-500 italic">Dica: {term.hint}</p>
            )}
            <p className="mt-2 text-xs text-blue-500">Clique para ver a definição</p>
          </div>
        </div>

        {/* Verso */}
        <div className="absolute w-full h-full backface-hidden rounded-xl shadow-lg bg-white flex flex-col justify-between p-6 border border-gray-100 rotate-y-180">
          <div className="flex justify-between items-start">
            <StatusIcon className={`${color} w-6 h-6`} />
            <span className="text-xs text-gray-400">Definição</span>
          </div>
          
          <div className="flex-1 flex flex-col justify-center items-center text-center">
            <p className="text-xl text-gray-700 mb-3">{term.definition}</p>
            
            {term.definitionImage && (
              <div className="w-full h-32 bg-gray-50 rounded-lg overflow-hidden mb-3">
                <img
                  src={term.definitionImage}
                  alt="Imagem da definição"
                  className="w-full h-full object-contain"
                />
              </div>
            )}
          </div>

          <div className="text-center">
            <p className="text-xs text-blue-500">Clique para ver o termo</p>
          </div>
        </div>
      </div>
    </div>

    {/* Botões de ação */}
    <div className="flex gap-4 justify-center mt-4 w-full max-w-md">
      <button
        onClick={(e) => {
          e.stopPropagation();
          onMark(false);
        }}
        className="flex-1 bg-red-100 text-red-600 px-6 py-3 rounded-lg hover:bg-red-200 transition-colors font-medium flex items-center justify-center gap-2"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
        Errei
      </button>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onMark(true);
        }}
        className="flex-1 bg-green-100 text-green-600 px-6 py-3 rounded-lg hover:bg-green-200 transition-colors font-medium flex items-center justify-center gap-2"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
        </svg>
        Acertei
      </button>
    </div>
  </div>
)
}
