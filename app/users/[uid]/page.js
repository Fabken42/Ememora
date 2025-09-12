'use client'

import { useEffect, useState, useRef } from 'react'
import ListCard from '@/components/ListCard'
import useUserStore from '@/store/useUserStore'
import { toast } from 'react-hot-toast'
import { CATEGORIES, FILTER_OPTIONS, LIMITS, LISTS_PAGE_SIZE, LIST_ORDER_BY } from '@/lib/utils'
import useNavigationStore from '@/store/useNavigationStore'
import Avatar from '@/components/Avatar'
import { FiChevronLeft, FiChevronRight, FiChevronsLeft, FiChevronsRight, FiLogOut } from 'react-icons/fi'
import LoadingSpinner from '@/components/LoadingSpinner'

export default function UserProfilePage({ params }) {
  const inputRef = useRef(null)
  const { setLastHomeOrUserPage } = useNavigationStore()
  const { uid } = params
  const { user, firebaseToken, logout, setUser } = useUserStore()
  const isOwner = user?.uid === uid

  const [lists, setLists] = useState([])
  const [category, setCategory] = useState('all')
  const [sortBy, setSortBy] = useState('mostRecent')
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalListsCount, setTotalListsCount] = useState(0)

  const [profile, setProfile] = useState(null)
  const [editName, setEditName] = useState('')
  const [editBio, setEditBio] = useState('')
  const [editImage, setEditImage] = useState('')
  const [uploading, setUploading] = useState(false)
  const [personalFilter, setPersonalFilter] = useState('myLists')

  // Função utilitária para gerar números de página
  const getPageNumbers = () => {
    const currentPage = page;
    const total = totalPages;
    const delta = 2;
    const range = [];
    const rangeWithDots = [];

    for (let i = 1; i <= total; i++) {
      if (
        i === 1 ||
        i === total ||
        (i >= currentPage - delta && i <= currentPage + delta)
      ) {
        range.push(i);
      }
    }

    let prev = 0;
    for (let i of range) {
      if (i - prev > 1) {
        rangeWithDots.push('...');
      }
      rangeWithDots.push(i);
      prev = i;
    }

    return rangeWithDots;
  };

  //em /users/[uid]
  useEffect(() => {
    setLastHomeOrUserPage(`/users/${uid}`)
  }, [setLastHomeOrUserPage, uid])

  useEffect(() => {
    const fetchProfile = async () => {
      const res = await fetch(`/api/users/${uid}`)
      if (res.ok) {
        const data = await res.json()
        setProfile(data)
        if (isOwner) {
          setEditName(data.name || '')
          setEditBio(data.bio || '')
          setEditImage(data.image || '')
        }
      }
    }
    fetchProfile()
  }, [uid, isOwner])

  useEffect(() => {
    const fetchLists = async () => {
      setLoading(true)
      try {
        const catParam = category !== 'all' ? `&category=${category}` : ''
        const sortParam = sortBy ? `&sortBy=${sortBy}` : ''
        const personalFilterParam = isOwner && personalFilter !== 'myLists' ? `&filter=${personalFilter}` : ''

        const res = await fetch(
          `/api/lists?ownerUid=${uid}${catParam}${sortParam}${personalFilterParam}&page=${page}&limit=${LISTS_PAGE_SIZE}`,
          {
            headers: firebaseToken ? { Authorization: `Bearer ${firebaseToken}` } : {}
          }
        )
        const data = await res.json()
        setLists(data.lists || [])
        setTotalPages(data.totalPages || 1)
        setTotalListsCount(data.totalCount || 0)
      } catch (err) {
        console.error('Erro ao buscar listas do usuário:', err)
      } finally {
        setLoading(false)
      }
    }

    if (uid) fetchLists()
  }, [uid, category, sortBy, personalFilter, page, firebaseToken, isOwner])

  const handleSave = async (overrides = {}) => {
  if (!firebaseToken) return

  // Validação do nome  
  const nameToValidate = overrides.name !== undefined ? overrides.name : editName
  if (nameToValidate !== undefined && nameToValidate !== null) {
    const trimmedName = nameToValidate.trim()
    if (trimmedName.length === 0) {
      toast.error('O nome não pode ficar vazio')
      return
    }
    if (trimmedName.length < LIMITS.USER_NAME_MIN || trimmedName.length > LIMITS.USER_NAME_MAX) {
      toast.error(`O nome deve ter entre ${LIMITS.USER_NAME_MIN} e ${LIMITS.USER_NAME_MAX} caracteres`)
      return
    }
  }

  // Validação da bio
  const bioToValidate = overrides.bio || editBio
  if (bioToValidate && bioToValidate.length > LIMITS.USER_BIO_MAX) {
    toast.error(`A biografia deve ter no máximo LIMITS.USER_BIO_MAX caracteres`)
    return
  }

  try {
    const res = await fetch(`/api/users/${uid}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${firebaseToken}`,
      },
      body: JSON.stringify({
        name: editName,
        bio: editBio,
        image: editImage,
        ...overrides,
      }),
    })

    if (res.ok) {
      const updated = await res.json()
      if (isOwner) {
        setUser(updated)
        setProfile(updated)
      }
      toast.success('Perfil atualizado!')
    } else {
      const errorData = await res.json().catch(() => ({}))
      throw new Error(errorData.error || 'Erro ao atualizar perfil')
    }
  } catch (error) {
    console.error('Erro ao salvar:', error)
    toast.error(error.message || 'Erro ao salvar alterações')
  }
}

  const handleImageUpload = async (file) => {
  if (!file || !user?.uid || !profile?.image) return
  setUploading(true)
  try {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('folder', 'profile_pics')
    formData.append('userId', user.uid) // ← ADICIONA userId
    formData.append('previousImageUrl', profile.image) // ← ADICIONA imagem anterior

    const res = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    })

    const data = await res.json()
    if (res.ok) {
      setEditImage(data.url)
      await handleSave({ image: data.url })
      toast.success('Foto de perfil atualizada!')
    } else {
      throw new Error(data.error || 'Erro no upload')
    }
  } catch (error) {
    console.error('Erro no upload:', error)
    toast.error(error.message || 'Erro ao fazer upload da imagem')
  } finally {
    setUploading(false)
  }
}

  return (
    <div className="max-w-4xl mx-auto p-6 min-h-screen">
      {profile && (
        <div className="mb-8 p-6 bg-[#24243e] rounded-xl border border-indigo-500/20">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div className="relative">
              <Avatar
                src={isOwner ? editImage : profile.image}
                alt="Avatar"
                size={84}
                className={`rounded-full border-2 border-indigo-500/30 ${isOwner ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''}`}
                onClick={() => {
                  if (isOwner && !uploading) inputRef.current?.click()
                }}
              />
              {uploading && (
                <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                </div>
              )}
            </div>

            {isOwner && (
              <input
                ref={inputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) {
                    handleImageUpload(file)
                    e.target.value = ''
                  }
                }}
                disabled={uploading}
              />
            )}

            <div className="flex-1 w-full">
              <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                <div className="flex-1">
                  {isOwner ? (
                    <>
                      <div className="flex items-center gap-3 mb-3">
                        <input
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          onBlur={() => handleSave({ name: editName })}
                          className="text-xl font-semibold bg-[#2d2b55] border-b border-indigo-500/50 focus:border-indigo-500 focus:outline-none w-full px-3 py-2 rounded-t focus:ring-2 focus:ring-indigo-500 transition-all"
                          placeholder="Seu nome"
                        />
                        {/* Botão de Logout - Posição melhorada */}
                        {isOwner && (
                          <button
                            onClick={logout}
                            className="px-3 py-2 bg-[#2d2b55] hover:bg-red-500/20 text-red-400 hover:text-red-300 rounded-lg border border-red-500/30 transition-colors font-medium flex items-center gap-2 shrink-0 whitespace-nowrap"
                            title="Sair da conta"
                          >
                            <FiLogOut className="w-4 h-4" />
                            Sair
                          </button>
                        )}
                      </div>
                      <textarea
                        value={editBio}
                        onChange={(e) => setEditBio(e.target.value)}
                        onBlur={() => handleSave({ bio: editBio })}
                        placeholder="Sua bio..."
                        className="block bg-[#2d2b55] text-sm border border-indigo-500/30 rounded px-3 py-2 w-full focus:border-indigo-500 focus:outline-none resize-none focus:ring-2 focus:ring-indigo-500 transition-all"
                        rows={3}
                      />
                    </>
                  ) : (
                    <>
                      <div className="flex justify-between items-start gap-4">
                        <div>
                          <h2 className="text-2xl font-bold">{profile.name}</h2>
                          <p className="text-gray-300 text-sm mt-2">{profile.bio}</p>
                        </div>
                        {/* Botão de Logout também disponível para usuário logado visitando outro perfil */}
                        {user && (
                          <button
                            onClick={logout}
                            className="px-3 py-2 bg-[#2d2b55] hover:bg-red-500/20 text-red-400 hover:text-red-300 rounded-lg border border-red-500/30 transition-colors font-medium flex items-center gap-2 shrink-0 whitespace-nowrap"
                            title="Sair da conta"
                          >
                            <FiLogOut className="w-4 h-4" />
                            Sair
                          </button>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>

              <p className="text-gray-400 text-sm mt-3">
                {isOwner ? (
                  <>
                    {personalFilter === 'myLists' && 'Suas listas'}
                    {personalFilter === 'liked' && 'Listas que você curtiu'}
                    {personalFilter === 'favorited' && 'Listas que você favoritou'}
                  </>
                ) : (
                  'Listas públicas'
                )}: <span className="text-indigo-400 font-medium">{totalListsCount}</span>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6 p-4 bg-[#24243e] rounded-xl border border-indigo-500/20">
        {isOwner && (
          <div className="flex-1">
            <label className="block mb-2 text-sm font-medium text-gray-300">Tipo:</label>
            <select
              value={personalFilter}
              onChange={(e) => {
                setPersonalFilter(e.target.value);
                setPage(1);
              }}
              className="w-full border border-indigo-500/30 bg-[#2d2b55] px-3 py-2 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
            >
              {FILTER_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="flex-1">
          <label className="block mb-2 text-sm font-medium text-gray-300">Categoria:</label>
          <select
            value={category}
            onChange={(e) => { setCategory(e.target.value); setPage(1); }}
            className="w-full border border-indigo-500/30 bg-[#2d2b55] px-3 py-2 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
          >
            {CATEGORIES.map((cat) => (
              <option key={cat.value} value={cat.value}>
                {cat.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex-1">
          <label className="block mb-2 text-sm font-medium text-gray-300">Ordenar por:</label>
          <select
            value={sortBy}
            onChange={e => {
              setSortBy(e.target.value)
              setPage(1)
            }}
            className="w-full border border-indigo-500/30 bg-[#2d2b55] px-3 py-2 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
          >
            {LIST_ORDER_BY
              .filter(opt => (opt.needsAuth ? !!user : true))
              .map(opt => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
          </select>
        </div>
      </div>

      {/* Resto do código permanece igual */}
      {loading ? (
        <div className="flex justify-center items-center p-8">
          <LoadingSpinner message='Carregando listas...' />
        </div>
      ) : (
        <>
          <div className="grid gap-4">
            {lists.length === 0 ? (
              <div className="text-center p-8 bg-[#24243e] rounded-xl border border-indigo-500/20">
                <p className="text-gray-400">
                  {isOwner && personalFilter === 'liked' && 'Você ainda não curtiu nenhuma lista'}
                  {isOwner && personalFilter === 'favorited' && 'Você ainda não favoritou nenhuma lista'}
                  {(!isOwner || personalFilter === 'myLists') && 'Nenhuma lista encontrada.'}
                </p>
              </div>
            ) : (
              lists.map((list) => <ListCard key={list._id} list={list} />)
            )}
          </div>

          {/* Paginação Completa */}
          {totalPages > 1 && (
            <div className="flex flex-col items-center gap-4 mt-8 p-4 bg-[#24243e] rounded-xl border border-indigo-500/20">
              {/* Controles de navegação */}
              <div className="flex flex-wrap justify-center items-center gap-2">
                {/* Primeira página */}
                <button
                  onClick={() => setPage(1)}
                  disabled={page <= 1}
                  className="px-3 py-2 bg-[#2d2b55] text-gray-200 rounded-lg border border-indigo-500/30 disabled:opacity-50 hover:bg-[#3a3780] transition-colors flex items-center gap-1"
                  title="Primeira página"
                >
                  <FiChevronsLeft className="w-3 h-3" />
                </button>

                {/* Página anterior */}
                <button
                  onClick={() => setPage(prev => Math.max(1, prev - 1))}
                  disabled={page <= 1}
                  className="px-3 py-2 bg-[#2d2b55] text-gray-200 rounded-lg border border-indigo-500/30 disabled:opacity-50 hover:bg-[#3a3780] transition-colors flex items-center gap-1"
                  title="Página anterior"
                >
                  <FiChevronLeft className="w-3 h-3" />
                </button>

                {/* Números de página */}
                {getPageNumbers().map((pageNum, index) => (
                  pageNum === '...' ? (
                    <span key={`dots-${index}`} className="px-2 text-gray-400">
                      ...
                    </span>
                  ) : (
                    <button
                      key={pageNum}
                      onClick={() => setPage(pageNum)}
                      className={`px-3 py-2 rounded-lg border transition-colors ${page === pageNum
                        ? 'bg-indigo-600 border-indigo-500 text-white'
                        : 'bg-[#2d2b55] border-indigo-500/30 text-gray-200 hover:bg-[#3a3780]'
                        }`}
                    >
                      {pageNum}
                    </button>
                  )
                ))}

                {/* Próxima página */}
                <button
                  onClick={() => setPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={page >= totalPages}
                  className="px-3 py-2 bg-[#2d2b55] text-gray-200 rounded-lg border border-indigo-500/30 disabled:opacity-50 hover:bg-[#3a3780] transition-colors flex items-center gap-1"
                  title="Próxima página"
                >
                  <FiChevronRight className="w-3 h-3" />
                </button>

                {/* Última página */}
                <button
                  onClick={() => setPage(totalPages)}
                  disabled={page >= totalPages}
                  className="px-3 py-2 bg-[#2d2b55] text-gray-200 rounded-lg border border-indigo-500/30 disabled:opacity-50 hover:bg-[#3a3780] transition-colors flex items-center gap-1"
                  title="Última página"
                >
                  <FiChevronsRight className="w-3 h-3" />
                </button>
              </div>
              {/* Info */}
              <div className="text-gray-300 text-sm">
                Página {page} de {totalPages}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}