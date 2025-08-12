'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Quiz from '@/components/Quiz'
import EndGameScreen from '@/components/EndGameScreen'
import useUserStore from '@/store/useUserStore'

function shuffleArray(array) {
  return [...array].sort(() => Math.random() - 0.5)
}

export default function QuizStudyPage() {
  const [index, setIndex] = useState(0)
  const [terms, setTerms] = useState([])
  const [options, setOptions] = useState([])
  const [title, setTitle] = useState("")
  const [canProceed, setCanProceed] = useState(false)
  const [resetKey, setResetKey] = useState(0)
  const [rightAnswer, setRightAnswer] = useState(0)
  const [wrongAnswer, setWrongAnswer] = useState(0)
  const [gameOver, setGameOver] = useState(false)
  const params = useParams()
  const { firebaseToken } = useUserStore()

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
        if (!res.ok) throw new Error(data.error || "Erro ao carregar quiz")

        setTitle(data.title)
        setTerms(shuffleArray(data.terms))
        setIndex(0)
        setRightAnswer(0)
        setWrongAnswer(0)
        setGameOver(false)
      } catch (err) {
        console.error("Erro ao buscar lista para quiz:", err)
      }
    }

    fetchList()
  }, [params.id, firebaseToken])

  useEffect(() => {
    if (terms.length > 0) {
      const current = terms[index]
      const others = terms.filter(t => t._id !== current._id)

      const randomDefs = shuffleArray(
        others.map(t => ({
          text: t.definition,
          image: t.definitionImage || ""
        }))
      ).slice(0, 3)

      setOptions(
        shuffleArray([
          { text: current.definition, image: current.definitionImage || "" },
          ...randomDefs
        ])
      )

      setCanProceed(false)
      setResetKey(prev => prev + 1)
    }
  }, [index, terms])

  const handleAnswer = async (correct) => {
    setCanProceed(true)
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
  }

  const nextQuestion = () => {
    if (index < terms.length - 1) {
      setIndex(index + 1)
    } else {
      setGameOver(true)
    }
  }

  if (!terms.length) return <p className="p-4">Carregando quiz...</p>
  if (gameOver) return <EndGameScreen rightAnswer={rightAnswer} total={terms.length} listId={params.id} />

  return (
    <div className="p-6 max-w-lg mx-auto min-h-screen flex flex-col">

      {/* Quiz Component */}
      <div className="flex-1 flex flex-col justify-center">

        {/* Header */}
        <div className="mb-6 text-center">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">{title}</h1>
          <div className="flex justify-center gap-6 text-lg font-medium">
            <span className="text-green-600 flex items-center gap-1">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              {rightAnswer}
            </span>
            <span className="text-red-600 flex items-center gap-1">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
              {wrongAnswer}
            </span>
          </div>
        </div>

        {terms[index] && options.length > 0 && (
          <Quiz
            key={resetKey}
            term={terms[index]}
            options={options}
            onAnswer={handleAnswer}
            reset={resetKey}
          />
        )}

        {/* Progress and Navigation */}
        <div className="mt-8">
          <div className="w-full bg-gray-200 rounded-full h-2.5 mb-3">
            <div
              className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
              style={{ width: `${((index + 1) / terms.length) * 100}%` }}
            ></div>
          </div>

          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-500">
              Pergunta <span className="font-medium">{index + 1}</span> de {terms.length}
            </p>

            <button
              onClick={nextQuestion}
              disabled={!canProceed}
              className={`px-6 py-2 rounded-lg font-medium transition-all ${canProceed
                ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-md'
                : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                }`}
            >
              {index < terms.length - 1 ? (
                <span className="flex items-center gap-1">
                  Próxima <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                </span>
              ) : 'Ver Resultados'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
