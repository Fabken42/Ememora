'use client'

import { useEffect } from 'react'
import useGameSettingsStore from '@/store/useGameSettingsStore'
import { FiPlay } from 'react-icons/fi'

export default function GameSettings({ onStart, listInfo }) {
  const {
    randomOrder,
    includePerfect,
    limit,
    setRandomOrder,
    setIncludePerfect,
    setLimit,
  } = useGameSettingsStore()

  // CALCULA O LIMITE MÁXIMO BASEADO NA ESCOLHA
  const maxLimit = includePerfect
    ? listInfo?.totalTerms || 1
    : (listInfo?.totalTerms || 1) - (listInfo?.totalPerfectTerms || 0)

  // Atualiza o limite sempre que mudar o includePerfect ou listInfo
  useEffect(() => {
    if (maxLimit > 0) {
      setLimit(maxLimit)
    }
  }, [includePerfect, maxLimit, setLimit])

  const handleSubmit = (e) => {
    e.preventDefault()
    onStart({
      randomOrder,
      includePerfect,
      limit: parseInt(limit, 10),
    })
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="p-6 bg-[#24243e] rounded-xl border border-indigo-500/20 shadow-lg space-y-6"
    >
      <h2 className="text-xl font-bold text-[var(--primary-text)]">Configurações do Jogo</h2>

      {/* Ordem aleatória */}
      <div className="flex items-center gap-3 p-3 bg-[#2d2b55] rounded-lg border border-indigo-500/30">
        <input
          type="checkbox"
          id="randomOrder"
          checked={randomOrder}
          onChange={(e) => setRandomOrder(e.target.checked)}
          className="w-5 h-5 text-indigo-500 bg-[#24243e] border-indigo-500/50 rounded focus:ring-2 focus:ring-indigo-500"
        />
        <label htmlFor="randomOrder" className="text-sm text-gray-300">
          Ordem aleatória
        </label>
      </div>

      {/* Incluir perfeitos */}
      <div className="flex items-center gap-3 p-3 bg-[#2d2b55] rounded-lg border border-indigo-500/30">
        <input
          type="checkbox"
          id="includePerfect"
          checked={includePerfect}
          onChange={(e) => setIncludePerfect(e.target.checked)}
          className="w-5 h-5 text-indigo-500 bg-[#24243e] border-indigo-500/50 rounded focus:ring-2 focus:ring-indigo-500"
        />
        <label htmlFor="includePerfect" className="text-sm text-gray-300">
          Incluir termos com status perfeito
          {listInfo && (
            <span className="text-gray-400 ml-1">
              ({listInfo.totalPerfectTerms} termos perfeitos)
            </span>
          )}
        </label>
      </div>

      {/* Quantidade de termos */}
      <div className="p-3 bg-[#2d2b55] rounded-lg border border-indigo-500/30">
        <label className="block text-sm mb-2 text-gray-300">
          Quantidade de termos
          {listInfo && (
            <span className="text-gray-400 ml-1">(Máximo: {maxLimit})</span>
          )}
        </label>
        <input
          type="number"
          min="1"
          max={maxLimit}
          value={limit}
          onChange={(e) => {
            const value = Math.min(
              Math.max(1, parseInt(e.target.value) || 1),
              maxLimit
            )
            setLimit(value)
          }}
          className="border border-indigo-500/30 bg-[#24243e] text-[var(--primary-text)] px-3 py-2 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all w-24"
        />
      </div>

      {/* Botão */}
      <button
        type="submit"
        className="w-full px-4 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        disabled={!listInfo || maxLimit === 0}
      >
        <FiPlay className="w-5 h-5" />
        {maxLimit === 0 ? 'Nenhum termo disponível' : 'Iniciar Jogo'}
      </button>

      {listInfo && (
        <p className="text-sm text-gray-400 text-center">
          Lista contém {listInfo.totalTerms} termos no total
        </p>
      )}
    </form>
  )
}
