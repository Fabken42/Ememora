'use client'

import { useEffect, useState, useRef } from 'react'
import ListCard from '@/components/ListCard'
import useUserStore from '@/store/useUserStore'
import { toast } from 'react-hot-toast'
import { CATEGORIES, LISTS_PAGE_SIZE, LIST_ORDER_BY } from '@/lib/utils'
import useNavigationStore from '@/store/useNavigationStore'
import Avatar from '@/components/Avatar'

export default function UserProfilePage({ params }) {
  const inputRef = useRef(null)
  const { setLastHomeOrUserPage } = useNavigationStore()
  const { uid } = params
  const { user, firebaseToken, setUser } = useUserStore()
  const isOwner = user?.uid === uid

  const [lists, setLists] = useState([])
  const [category, setCategory] = useState('all')
  const [sortBy, setSortBy] = useState('mostRecent')
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  const [profile, setProfile] = useState(null)
  const [editName, setEditName] = useState('')
  const [editBio, setEditBio] = useState('')
  const [editImage, setEditImage] = useState('')
  const [uploading, setUploading] = useState(false)

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
        const res = await fetch(
          `/api/lists?ownerUid=${uid}${catParam}${sortParam}&page=${page}&limit=${LISTS_PAGE_SIZE}`,
          {
            headers: firebaseToken ? { Authorization: `Bearer ${firebaseToken}` } : {}
          }
        )
        const data = await res.json()
        setLists(data.lists || [])
        setTotalPages(data.totalPages || 1)
      } catch (err) {
        console.error('Erro ao buscar listas do usuário:', err)
      } finally {
        setLoading(false)
      }
    }

    if (uid) fetchLists()
  }, [uid, category, sortBy, page, firebaseToken])

  // Salvar alterações (reutilizado no upload e no blur dos campos)
  const handleSave = async (overrides = {}) => {
    if (!firebaseToken) return

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
          ...overrides, // caso queira forçar um campo específico
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

  // Upload de imagem com auto-save
  const handleImageUpload = async (file) => {
    if (!file) return
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('folder', 'profile_pics')

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      const data = await res.json()
      if (res.ok) {
        setEditImage(data.url)
        await handleSave({ image: data.url }) // salva automaticamente
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
              {isOwner ? (
                <>
                  <input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    onBlur={() => handleSave({ name: editName })}
                    className="text-xl font-semibold bg-[#2d2b55] text-[var(--primary-text)] border-b border-indigo-500/50 focus:border-indigo-500 focus:outline-none w-full mb-3 px-3 py-2 rounded-t focus:ring-2 focus:ring-indigo-500 transition-all"
                    placeholder="Seu nome"
                  />
                  <textarea
                    value={editBio}
                    onChange={(e) => setEditBio(e.target.value)}
                    onBlur={() => handleSave({ bio: editBio })}
                    placeholder="Sua bio..."
                    className="block mt-2 bg-[#2d2b55] text-[var(--primary-text)] text-sm border border-indigo-500/30 rounded px-3 py-2 w-full focus:border-indigo-500 focus:outline-none resize-none focus:ring-2 focus:ring-indigo-500 transition-all"
                    rows={3}
                  />
                </>
              ) : (
                <>
                  <h2 className="text-2xl font-bold text-[var(--primary-text)]">{profile.name}</h2>
                  <p className="text-gray-300 text-sm mt-2">{profile.bio}</p>
                </>
              )}
              <p className="text-gray-400 text-sm mt-3">
                {isOwner ? 'Suas listas' : 'Listas públicas'}: <span className="text-indigo-400 font-medium">{lists.length}</span>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6 p-4 bg-[#24243e] rounded-xl border border-indigo-500/20">
        <div className="flex-1">
          <label className="block mb-2 text-sm font-medium text-gray-300">Categoria:</label>
          <select
            value={category}
            onChange={(e) => { setCategory(e.target.value); setPage(1); }}
            className="w-full border border-indigo-500/30 bg-[#2d2b55] text-[var(--primary-text)] px-3 py-2 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
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
            className="w-full border border-indigo-500/30 bg-[#2d2b55] text-[var(--primary-text)] px-3 py-2 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
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

      {loading ? (
        <div className="flex justify-center items-center p-8">
          <p className="text-[var(--primary-text)]">Carregando...</p>
        </div>
      ) : (
        <>
          <div className="grid gap-4">
            {lists.length === 0 ? (
              <div className="text-center p-8 bg-[#24243e] rounded-xl border border-indigo-500/20">
                <p className="text-gray-400">Nenhuma lista encontrada.</p>
              </div>
            ) : (
              lists.map((list) => <ListCard key={list._id} list={list} />)
            )}
          </div>

          {/* Paginação */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-4 mt-8 p-4 bg-[#24243e] rounded-xl border border-indigo-500/20">
              <button
                onClick={() => setPage(prev => Math.max(prev - 1, 1))}
                disabled={page === 1}
                className="px-4 py-2 bg-[#2d2b55] hover:bg-[#3a3780] text-white rounded-lg border border-indigo-500/30 transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                <FiChevronLeft className="w-4 h-4" /> Anterior
              </button>
              <span className="text-gray-300">Página {page} de {totalPages}</span>
              <button
                onClick={() => setPage(prev => Math.min(prev + 1, totalPages))}
                disabled={page === totalPages}
                className="px-4 py-2 bg-[#2d2b55] hover:bg-[#3a3780] text-white rounded-lg border border-indigo-500/30 transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                Próximo <FiChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}