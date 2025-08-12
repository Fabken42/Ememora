'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Flashcard from '@/components/FlashCard'
import EndGameScreen from '@/components/EndGameScreen'
import useUserStore from '@/store/useUserStore'

export default function FlashcardStudyPage() {
  const [index, setIndex] = useState(0)
  const [terms, setTerms] = useState([])
  const [title, setTitle] = useState('')
  const [rightAnswer, setRightAnswer] = useState(0)
  const [wrongAnswer, setWrongAnswer] = useState(0)
  const [gameOver, setGameOver] = useState(false)
  const { firebaseToken } = useUserStore()
  const params = useParams()

  useEffect(() => {
    const fetchList = async () => {
      try {
        if (!params.id) return

        const headers = {}
        if (firebaseToken) {
          headers['Authorization'] = `Bearer ${firebaseToken}`
        }

        const res = await fetch(`/api/lists/${params.id}`, { headers })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Erro ao buscar lista')

        setTerms(data.terms || [])
        setTitle(data.title || '')
        setRightAnswer(0)
        setWrongAnswer(0)
        setIndex(0)
        setGameOver(false)
      } catch (err) {
        console.error('Erro ao buscar termos:', err)
      }
    }

    fetchList()
  }, [params.id, firebaseToken])

  const handleMark = async (correct) => {
    if (correct) {
      setRightAnswer(prev => prev + 1)
    } else {
      setWrongAnswer(prev => prev + 1)
    }

    try {
      if (!firebaseToken) {
        console.error("Token do Firebase não disponível")
        return
      }
      await fetch(`/api/lists/${params.id}/update-status`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${firebaseToken}`
        },
        body: JSON.stringify({
          term: terms[index].term,
          correct
        })
      })
    } catch (err) {
      console.error("Erro ao atualizar status:", err)
    }

    if (index < terms.length - 1) {
      setIndex(index + 1)
    } else {
      setGameOver(true)
    }
  }

  if (!terms.length) return <p className="p-4">Carregando termos...</p>

  if (gameOver) {
    return <EndGameScreen rightAnswer={rightAnswer} total={terms.length} listId={params.id} />
  }

  return (
    <div className="p-6 max-w-lg mx-auto min-h-screen flex flex-col">


      {/* Flashcard */}
      <div className="flex-1 flex flex-col justify-center">
        <div className="mb-12 text-center">
          <h1 className="text-3xl font-bold text-white mb-2">{title}</h1>
          <div className="flex justify-center gap-6 text-lg">
            <span className="text-green-600 font-medium">✓ {rightAnswer}</span>
            <span className="text-red-600 font-medium">✗ {wrongAnswer}</span>
          </div>
        </div>
        <Flashcard term={terms[index]} onMark={handleMark} />
        <div className="mt-12 text-center">
          <div className="w-full bg-gray-200 rounded-full h-2.5 mb-2">
            <div
              className="bg-blue-600 h-2.5 rounded-full"
              style={{ width: `${((index + 1) / terms.length) * 100}%` }}
            ></div>
          </div>
          <p className="text-sm text-gray-500">
            Termo <span className="font-medium">{index + 1}</span> de {terms.length}
          </p>
        </div>
      </div>
    </div>
  )
}
