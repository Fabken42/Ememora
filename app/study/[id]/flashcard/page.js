'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Flashcard from '@/components/FlashCard'
import EndGameScreen from '@/components/EndGameScreen'
import useUserStore from '@/store/useUserStore'
import GameSettings from '@/components/GameSettings'
import { FiCheck, FiCheckCircle, FiChevronLeft, FiChevronRight, FiX } from 'react-icons/fi'

export default function FlashcardStudyPage() {
  const [index, setIndex] = useState(0)
  const [terms, setTerms] = useState([])
  const [title, setTitle] = useState('')
  const [rightAnswer, setRightAnswer] = useState(0)
  const [wrongAnswer, setWrongAnswer] = useState(0)
  const [gameOver, setGameOver] = useState(false)
  const [settingsChosen, setSettingsChosen] = useState(false)
  const [reviewMode, setReviewMode] = useState(false)
  const [answeredQuestions, setAnsweredQuestions] = useState([])

  const [listInfo, setListInfo] = useState(null)
  const [loadingInfo, setLoadingInfo] = useState(true)

  const { firebaseToken } = useUserStore()
  const params = useParams()

  const fetchListInfo = async () => {
    try {
      console.log('Fetching list info for id:', params.id)
      if (!params.id) return

      const headers = {}
      if (firebaseToken) {
        headers['Authorization'] = `Bearer ${firebaseToken}`
      }

      const res = await fetch(`/api/lists/${params.id}?includePerfect=true&limit=0`, { headers })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erro ao buscar informações da lista')

      setListInfo(data)
    } catch (err) {
      console.error('Erro ao buscar informações da lista:', err)
    } finally {
      setLoadingInfo(false)
    }
  }

  useEffect(() => {
    if (!settingsChosen) fetchListInfo()
  }, [params.id, firebaseToken, settingsChosen])

  const fetchList = async (opts) => {
    try {
      if (!params.id) return

      const headers = {}
      if (firebaseToken) {
        headers['Authorization'] = `Bearer ${firebaseToken}`
      }

      const res = await fetch(
        `/api/lists/${params.id}?includePerfect=${opts.includePerfect}&limit=${opts.limit}&isRandomOrder=${opts.randomOrder}`,
        { headers }
      )

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erro ao buscar lista')

      setTerms(data.terms || [])
      console.log(data.terms)
      setTitle(data.title || '')
      setRightAnswer(0)
      setWrongAnswer(0)
      setIndex(0)
      setGameOver(false)
      setReviewMode(false)
      setAnsweredQuestions([])
    } catch (err) {
      console.error('Erro ao buscar termos:', err)
    }
  }

  const handleStart = (opts) => {
    setSettingsChosen(true)
    fetchList(opts)
  }

  const handleMark = async (correct) => {
    const newAnsweredQuestion = {
      term: terms[index],
      correct,
      index
    }
    setAnsweredQuestions(prev => [...prev, newAnsweredQuestion])

    if (correct) setRightAnswer(prev => prev + 1)
    else setWrongAnswer(prev => prev + 1)

    try {
      if (firebaseToken) {
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
      }
    } catch (err) {
      console.error("Erro ao atualizar status:", err)
    }

    if (index < terms.length - 1) {
      setIndex(index + 1)
    } else {
      setGameOver(true)
    }
  }

  const handleReviewErrors = () => {
    // Sempre inicia a revisão com TODOS os termos respondidos
    // Primeiro os errados, depois os corretos
    const wrongAnswers = answeredQuestions.filter(q => !q.correct)
    const correctAnswers = answeredQuestions.filter(q => q.correct)

    const reviewTerms = [...wrongAnswers, ...correctAnswers].map(q => q.term)

    setTerms(reviewTerms)
    setIndex(0)
    setGameOver(false)
    setReviewMode(true)
  }

  // Função para reiniciar completamente
  const handleRestart = () => {
    setGameOver(false)
    setReviewMode(false)
    setSettingsChosen(false)
    setTerms([])
    setAnsweredQuestions([])
    setRightAnswer(0)
    setWrongAnswer(0)
  }

  // Função para finalizar a revisão a qualquer momento
  const handleFinishReview = () => {
    setGameOver(true)
  }

  if (!settingsChosen) {
  return (
    <div className="p-6 max-w-md mx-auto min-h-screen ">
      <GameSettings onStart={handleStart} listInfo={listInfo} />
    </div>
  )
}

if (!terms.length) return (
  <div className="min-h-screen flex items-center justify-center ">
    <p className="text-[var(--primary-text)] p-4">Carregando termos...</p>
  </div>
)

if (gameOver) {
  return (
    <div className="min-h-screen p-6">
      <EndGameScreen
        rightAnswer={rightAnswer}
        total={terms.length}
        listId={params.id}
        onReviewErrors={handleReviewErrors}
        showReviewButton={true} // SEMPRE mostra o botão de revisão
        onRestart={handleRestart}
        isReviewMode={reviewMode}
      />
    </div>
  )
}

return (
  <>
    <div className="p-6 max-w-lg mx-auto min-h-screen flex flex-col ">
      <div className="flex-1 flex flex-col justify-center">
        <div className="mb-8 text-center p-4 bg-[#24243e] rounded-xl border border-indigo-500/20">
          <h1 className="text-2xl font-bold text-[var(--primary-text)] mb-2">
            {title}
            {reviewMode && <span className="text-yellow-400 text-base ml-2">(Modo Revisão)</span>}
          </h1>
          <div className="flex justify-center gap-6 text-md">
            <span className="text-green-400 font-medium flex items-center gap-1">
              <FiCheck className="w-4 h-4" /> {rightAnswer}
            </span>
            <span className="text-red-400 font-medium flex items-center gap-1">
              <FiX className="w-4 h-4" /> {wrongAnswer}
            </span>
          </div>
        </div>

        <Flashcard
          term={terms[index]}
          onMark={reviewMode ? undefined : handleMark}
          showResult={reviewMode}
          wasCorrect={reviewMode ?
            answeredQuestions.find(q => q.term._id === terms[index]._id)?.correct :
            undefined
          }
          isAuthenticated={!!firebaseToken}
        />

        <div className="mt-8 text-center p-4 bg-[#24243e] rounded-xl border border-indigo-500/20">
          <div className="w-full bg-gray-700 rounded-full h-2.5 mb-3">
            <div
              className="bg-indigo-500 h-2.5 rounded-full transition-all duration-300"
              style={{ width: `${((index + 1) / terms.length) * 100}%` }}
            ></div>
          </div>
          <p className="text-sm text-gray-300">
            Termo <span className="font-medium text-[var(--primary-text)]">{index + 1}</span> de {terms.length}
            {reviewMode && (
              <span className="ml-2">
                {answeredQuestions.find(q => q.term._id === terms[index]._id)?.correct ?
                  <span className="text-green-400">✓</span> : 
                  <span className="text-red-400">✗</span>}
              </span>
            )}
          </p>

          {reviewMode && (
            <div className="mt-6 flex flex-col items-center gap-4">
              <div className="flex gap-3">
                <button
                  onClick={() => setIndex(prev => Math.max(0, prev - 1))}
                  className="px-4 py-2 bg-[#2d2b55] hover:bg-[#3a3780] text-white rounded-lg border border-indigo-500/30 transition-colors flex items-center gap-2 disabled:opacity-50"
                  disabled={index === 0}
                >
                  <FiChevronLeft className="w-4 h-4" /> Anterior
                </button>
                <button
                  onClick={() => setIndex(prev => Math.min(terms.length - 1, prev + 1))}
                  className="px-4 py-2 bg-[#2d2b55] hover:bg-[#3a3780] text-white rounded-lg border border-indigo-500/30 transition-colors flex items-center gap-2 disabled:opacity-50"
                  disabled={index === terms.length - 1}
                >
                  Próximo <FiChevronRight className="w-4 h-4" />
                </button>
              </div>

              {/* Botão para finalizar a revisão - SEMPRE visível */}
              <button
                onClick={handleFinishReview}
                className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors font-medium flex items-center gap-2"
              >
                <FiCheckCircle className="w-4 h-4" /> Finalizar Revisão
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  </>
)
}