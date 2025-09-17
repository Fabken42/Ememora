'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Flashcard from '@/components/FlashCard'
import EndGameScreen from '@/components/EndGameScreen'
import useUserStore from '@/store/useUserStore'
import GameSettings from '@/components/GameSettings'
import { FiCheck, FiCheckCircle, FiChevronLeft, FiChevronRight, FiX } from 'react-icons/fi'
import LoadingSpinner from '@/components/LoadingSpinner'
import BackButton from '@/components/BackButton'
import { fetchWithTokenRetry } from '@/lib/utils'

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
  const [fetchError, setFetchError] = useState(null)
  const [isMarking, setIsMarking] = useState(false)
  
  const firebaseToken = useUserStore(state => state.firebaseToken);
  const handleRefreshToken = useUserStore(state => state.handleRefreshToken);
  const params = useParams()

  const fetchListData = async (options = {}) => {
    try {
      if (!params.id) return

      setLoadingInfo(true)
      setFetchError(null)

      const headers = {}
      if (firebaseToken) {
        headers['Authorization'] = `Bearer ${firebaseToken}`
      }

      // Configura parâmetros padrão para a busca inicial
      const includePerfect = options.includePerfect !== undefined ? options.includePerfect : true
      const limit = options.limit !== undefined ? options.limit : 0
      const sort = options.randomOrder ? 'random' : (options.sortOption || 'normal')

      const res = await fetch(
        `/api/lists/${params.id}?includePerfect=${includePerfect}&limit=${limit}&sort=${sort}`,
        { headers }
      )

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erro ao buscar informações da lista')

      // Se é a busca inicial (sem opções específicas)
      if (Object.keys(options).length === 0) {
        setListInfo(data)

        // Se a lista não tem termos, não mostramos as configurações
        if (data.totalTerms === 0) {
          setSettingsChosen(true)
          setTerms([])
        }
      } else {
        // Se é uma busca com opções específicas (início do jogo)
        setTerms(data.terms || [])
        setTitle(data.title || '')
        setRightAnswer(0)
        setWrongAnswer(0)
        setIndex(0)
        setGameOver(false)
        setReviewMode(false)
        setAnsweredQuestions([])
      }

      return data
    } catch (err) {
      console.error('Erro ao buscar dados da lista:', err)
      setFetchError(err.message)
      throw err
    } finally {
      setLoadingInfo(false)
    }
  }

  useEffect(() => {
    if (!settingsChosen) {
      fetchListData()
    }
  }, [params.id, firebaseToken, settingsChosen])

  const handleStart = (opts) => {
    setSettingsChosen(true)
    setLoadingInfo(true)
    fetchListData({
      includePerfect: opts.includePerfect,
      limit: opts.limit,
      randomOrder: opts.randomOrder
    })
  }

  const handleMark = async (correct) => {
    if (isMarking) return
    setIsMarking(true)

    const newAnsweredQuestion = {
      term: terms[index],
      correct,
      index
    }
    setAnsweredQuestions(prev => [...prev, newAnsweredQuestion])

    if (correct) setRightAnswer(prev => prev + 1)
    else setWrongAnswer(prev => prev + 1)

    try {
      if (!firebaseToken) {
        console.error("Token do Firebase não disponível")
        setIsMarking(false)
        return
      }

      const response = await fetchWithTokenRetry(
        `/api/lists/${params.id}/update-status`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            term: terms[index].term,
            correct
          })
        },
        firebaseToken,
        handleRefreshToken
      )

    } catch (err) {
      console.error('error: '+err)
    }

    setIsMarking(false)
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
    setLoadingInfo(false)
  }

  const handleFinishReview = () => {
    setGameOver(true)
  }

  if (loadingInfo && !settingsChosen) {
    return <LoadingSpinner message='Carregando informações da lista...' />
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
          <h2 className="text-xl font-semibold mb-2">
            Erro ao carregar lista
          </h2>
          <p className="text-gray-300 mb-4">
            {fetchError}
          </p>
          <button
            onClick={() => fetchListData()}
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

  if (loadingInfo) {
    return <LoadingSpinner message='Carregando termos...' />
  }

  if (terms.length === 0) {
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
      <div className="min-h-screen p-6">
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
          <div className="mb-8 text-center p-4 bg-[#24243e] rounded-xl border border-indigo-500/20">
            <h1 className="text-2xl font-bold mb-2 break-all">
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
            key={terms[index]?._id}
            term={terms[index]}
            onMark={reviewMode ? undefined : handleMark}
            showResult={reviewMode}
            wasCorrect={reviewMode ?
              answeredQuestions.find(q => q.term._id === terms[index]._id)?.correct :
              undefined
            }
            isAuthenticated={!!firebaseToken}
            isMarking={isMarking}
          />

          <div className="mt-8 text-center p-4 bg-[#24243e] rounded-xl border border-indigo-500/20">
            <div className="w-full bg-gray-700 rounded-full h-2.5 mb-3">
              <div
                className="bg-indigo-500 h-2.5 rounded-full transition-all duration-300"
                style={{ width: `${((index + 1) / terms.length) * 100}%` }}
              ></div>
            </div>
            <p className="text-sm text-gray-300">
              Termo <span className="font-medium">{index + 1}</span> de {terms.length}
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
    </div>
  )
}