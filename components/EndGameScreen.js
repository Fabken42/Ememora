// components/EndGameScreen.js
'use client'
import { useRouter } from 'next/navigation'
import { FiAward, FiBookOpen, FiList, FiRefreshCw } from 'react-icons/fi'
import BackButton from './BackButton'

export default function EndGameScreen({
  rightAnswer,
  total,
  listId,
  onReviewErrors,
  showReviewButton = true,
  onRestart,
}) {
  const router = useRouter()
  const percentage = Math.round((rightAnswer / total) * 100)

  return (
    <>
    <BackButton/>
    <div className="p-8 max-w-md mx-auto text-center bg-[#24243e] rounded-xl border border-indigo-500/20 shadow-lg">
      <div className="mb-6">
        <div className="w-20 h-20 bg-indigo-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <FiAward className="w-10 h-10 text-indigo-400" />
        </div>
        <h1 className="text-2xl font-bold mb-4 ">Fim do Jogo!</h1>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-[#2d2b55] p-4 rounded-lg border border-indigo-500/30">
          <p className="text-gray-300 text-sm mb-1">Taxa</p>
          <p className="text-xl font-semibold text-indigo-400">{percentage}%</p>
        </div>

        <div className="bg-[#2d2b55] p-4 rounded-lg border border-indigo-500/30">
          <p className="text-gray-300 text-sm mb-1">Total</p>
          <p className="text-xl font-semibold ">{total}</p>
        </div>

        <div className="bg-[#2d2b55] p-4 rounded-lg border border-indigo-500/30">
          <p className="text-gray-300 text-sm mb-1">Acertos</p>
          <p className="text-xl font-semibold text-green-400">{rightAnswer}</p>
        </div>

        <div className="bg-[#2d2b55] p-4 rounded-lg border border-indigo-500/30">
          <p className="text-gray-300 text-sm mb-1">Erros</p>
          <p className="text-xl font-semibold text-red-400">{total - rightAnswer}</p>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <button
          onClick={onRestart}
          className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors font-medium flex items-center justify-center gap-2"
        >
          <FiRefreshCw className="w-5 h-5" />
          Jogar Novamente
        </button>

        {showReviewButton && (
          <button
            onClick={onReviewErrors}
            className="px-6 py-3 bg-amber-600 hover:bg-amber-500 text-white rounded-lg transition-colors font-medium flex items-center justify-center gap-2"
          >
            <FiBookOpen className="w-5 h-5" />
            Iniciar Revisão
          </button>
        )}

        <button
          onClick={() => router.push(`/lists/${listId}`)}
          className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors font-medium flex items-center justify-center gap-2"
        >
          <FiList className="w-5 h-5" />
          Ver Lista Completa
        </button>
      </div>
    </div>
    </>

  )
}