// components/EndGameScreen.js
'use client'
import { useRouter } from 'next/navigation'

export default function EndGameScreen({ rightAnswer, total, listId }) {
    const router = useRouter()
    const percentage = Math.round((rightAnswer / total) * 100)

    return (
        <div className="p-6 mt-24 max-w-md mx-auto text-center bg-white rounded-lg shadow">
            <h1 className="text-3xl font-bold mb-4">Fim do Quiz!</h1>
            <p>total de perguntas: {total}</p>
            <p>acertos: {rightAnswer}</p>
            <p>erros: {total - rightAnswer}</p>
            <p className="text-gray-600 mb-4">Taxa de acertos: {percentage}%</p>
            <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-blue-600 text-white rounded"
            >
                Jogar Novamente
            </button>
            <button
                onClick={() => router.push(`/lists/${listId}`)}
                className="px-4 py-2 bg-green-600 text-white rounded"
            >
                Ver Lista
            </button>
        </div>
    )
}
