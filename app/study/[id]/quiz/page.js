'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Quiz from '@/components/Quiz'
import EndGameScreen from '@/components/EndGameScreen'
import useUserStore from '@/store/useUserStore'
import GameSettings from '@/components/GameSettings'
import { FiAward, FiCheck, FiCheckCircle, FiChevronLeft, FiChevronRight, FiX } from 'react-icons/fi'
import LoadingSpinner from '@/components/LoadingSpinner'
import BackButton from '@/components/BackButton'

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
  const [settingsChosen, setSettingsChosen] = useState(false)
  const [listInfo, setListInfo] = useState(null)
  const [loadingInfo, setLoadingInfo] = useState(true)
  const [fetchError, setFetchError] = useState(null)

  const [reviewMode, setReviewMode] = useState(false)
  const [answeredQuestions, setAnsweredQuestions] = useState([])

  const params = useParams()
  const { firebaseToken } = useUserStore()

  const fetchListInfo = async () => {
    try {
      if (!params.id) return

      setLoadingInfo(true)
      setFetchError(null)

      const headers = {}
      if (firebaseToken) {
        headers['Authorization'] = `Bearer ${firebaseToken}`
      }

      const res = await fetch(`/api/lists/${params.id}?includePerfect=true&limit=0`, { headers })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erro ao buscar informações da lista')

      setListInfo(data)

      // Se a lista não tem termos, não mostramos as configurações
      if (data.totalTerms === 0) {
        setSettingsChosen(true)
        setTerms([])
      }
    } catch (err) {
      console.error('Erro ao buscar informações da lista:', err)
      setFetchError(err.message)
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

      setLoadingInfo(true)
      setFetchError(null)

      const headers = {}
      if (firebaseToken) {
        headers['Authorization'] = `Bearer ${firebaseToken}`
      }

      const res = await fetch(
        `/api/lists/${params.id}?includePerfect=${opts.includePerfect}&limit=${opts.limit}&sort=${opts.randomOrder ? 'random' : 'normal'}`,
        { headers }
      )
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Erro ao carregar quiz")

      setTitle(data.title)
      setTerms(data.terms || [])
      setIndex(0)
      setRightAnswer(0)
      setWrongAnswer(0)
      setGameOver(false)
      setReviewMode(false)
      setAnsweredQuestions([])
    } catch (err) {
      console.error("Erro ao buscar lista para quiz:", err)
      setFetchError(err.message)
    } finally {
      setLoadingInfo(false)
    }
  }

  useEffect(() => {
    if (terms.length > 0 && !reviewMode) {
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
  }, [index, terms, reviewMode])

  const handleStart = (opts) => {
    setSettingsChosen(true)
    fetchList(opts)
  }

  const handleAnswer = async (correct, selectedOption) => {
    const newAnsweredQuestion = {
      term: terms[index],
      correct,
      index,
      selectedOption,
      options: options,
      correctAnswer: terms[index].definition
    }
    setAnsweredQuestions(prev => [...prev, newAnsweredQuestion])

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

  const handleReviewErrors = () => {
    const wrongAnswers = answeredQuestions.filter(q => !q.correct)
    const correctAnswers = answeredQuestions.filter(q => q.correct)

    const reviewTerms = [...wrongAnswers, ...correctAnswers].map(q => q.term)

    setTerms(reviewTerms)
    setIndex(0)
    setGameOver(false)
    setReviewMode(true)
    setCanProceed(true)
  }

  const handleRestart = () => {
    setGameOver(false)
    setReviewMode(false)
    setSettingsChosen(false)
    setTerms([])
    setAnsweredQuestions([])
    setRightAnswer(0)
    setWrongAnswer(0)
    setFetchError(null)
    setLoadingInfo(true)
    fetchListInfo()
  }

  const handleFinishReview = () => {
    setGameOver(true)
  }

  // 1. Estado de loading para renderização condicional
  if (loadingInfo) {
    return (<LoadingSpinner message='Carregando informações da lista...' />)
  }

  if (fetchError) {
    return (
      <div className="min-h-screen p-6">
        <div className="mb-6">
          <BackButton listId={params.id} />
        </div>
        <div className="max-w-md mx-auto p-6 bg-[#24243e] rounded-xl border border-indigo-500/20 text-center">
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <FiX className="w-8 h-8 text-red-400" />
          </div>
          <h2 className="text-xl font-semibold  mb-2">
            Erro ao carregar quiz
          </h2>
          <p className="text-gray-300 mb-4">
            {fetchError}
          </p>
          <button
            onClick={fetchListInfo}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors"
          >
            Tentar Novamente
          </button>
        </div>
      </div>
    )
  }

  if (!settingsChosen) {
    return (
      <div className="min-h-screen ">
        <div className="mb-6">
          <BackButton listId={params.id} />
        </div>
        <div className="max-w-md mx-auto">
          <GameSettings onStart={handleStart} listInfo={listInfo} />
        </div>
      </div>
    )
  }

  if (terms.length === 0 && !loadingInfo) {
    return (
      <div className="min-h-screen">
        <div className="mb-6">
          <BackButton listId={params.id} />
        </div>
        <div className="max-w-md mx-auto p-6 bg-[#24243e] rounded-xl border border-indigo-500/20 text-center">
          <div className="w-16 h-16 bg-gray-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <FiX className="w-8 h-8 text-gray-400" />
          </div>
          <h2 className="text-xl font-semibold mb-2">
            Lista vazia!
          </h2>
          <p className="text-gray-300 mb-4">
            Não há termos para estudar
          </p>
        </div>
      </div>
    )
  }

  if (gameOver) {
    return (
      <div className="min-h-screen">
        <EndGameScreen
          rightAnswer={rightAnswer}
          total={terms.length}
          listId={params.id}
          onReviewErrors={handleReviewErrors}
          showReviewButton={true}
          onRestart={handleRestart}
          isReviewMode={reviewMode}
        />
      </div>
    )
  }

  return (
    <div className="min-h-screen p-6">
      <BackButton listId={params.id} />
      <div className="max-w-lg mx-auto flex flex-col">
        <div className="flex-1 flex flex-col justify-center">
          {/* Header */}
          <div className="mb-6 text-center p-4 bg-[#24243e] rounded-xl border border-indigo-500/20">
            <h1 className="text-2xl font-bold mb-2 break-all">
              {title}
              {reviewMode && <span className="text-yellow-400 text-base ml-2">(Modo Revisão)</span>}
            </h1>
            <div className="flex justify-center gap-6 text-md font-medium">
              <span className="text-green-400 flex items-center gap-1">
                <FiCheck className="w-4 h-4" />
                {rightAnswer}
              </span>
              <span className="text-red-400 flex items-center gap-1">
                <FiX className="w-4 h-4" />
                {wrongAnswer}
              </span>
            </div>
          </div>

          {terms[index] && options.length > 0 && (
            <Quiz
              key={terms[index]._id || index}
              term={terms[index]}
              options={options}
              isAuthenticated={!!firebaseToken}
              onAnswer={reviewMode ? undefined : handleAnswer}
              reset={resetKey}
              showResult={reviewMode}
              wasCorrect={reviewMode ?
                answeredQuestions.find(q => q.term._id === terms[index]._id)?.correct :
                undefined
              }
              reviewData={reviewMode ?
                answeredQuestions.find(q => q.term._id === terms[index]._id) :
                undefined
              }
            />
          )}

          {/* Progress and Navigation */}
          <div className="mt-8 p-4 bg-[#24243e] rounded-xl border border-indigo-500/20">
            <div className="w-full bg-gray-700 rounded-full h-2.5 mb-4">
              <div
                className="bg-indigo-500 h-2.5 rounded-full transition-all duration-300"
                style={{ width: `${((index + 1) / terms.length) * 100}%` }}
              ></div>
            </div>

            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
              <p className="text-sm text-gray-300">
                Pergunta <span className="font-medium">{index + 1}</span> de {terms.length}
                {reviewMode && (
                  <span className="ml-2">
                    {answeredQuestions.find(q => q.term._id === terms[index]._id)?.correct ?
                      <span className="text-green-400">✓</span> :
                      <span className="text-red-400">✗</span>}
                  </span>
                )}
              </p>

              {!reviewMode ? (
                <button
                  onClick={nextQuestion}
                  disabled={!canProceed}
                  className={`px-6 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${canProceed
                    ? 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-md'
                    : 'bg-[#2d2b55] text-gray-400 cursor-not-allowed border border-indigo-500/30'
                    }`}
                >
                  {index < terms.length - 1 ? (
                    <>
                      Próxima <FiChevronRight className="w-4 h-4" />
                    </>
                  ) : (
                    <>
                      Ver Resultados <FiAward className="w-4 h-4" />
                    </>
                  )}
                </button>
              ) : (
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="flex gap-2">
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
                  <button
                    onClick={handleFinishReview}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors font-medium flex items-center gap-2"
                  >
                    <FiCheckCircle className="w-4 h-4" /> Finalizar Revisão
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}