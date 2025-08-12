'use client'

import { useEffect, useState, use } from 'react'
import ListCard from '@/components/ListCard'
import useUserStore from '@/store/useUserStore'
import { toast } from 'react-hot-toast'
import { CATEGORIES } from '@/lib/utils'

export default function UserProfilePage({ params }) {
  const { uid } = use(params)
  const { user, firebaseToken, setUser } = useUserStore()
  const isOwner = user?.uid === uid

  const [lists, setLists] = useState([])
  const [category, setCategory] = useState('todas')
  const [loading, setLoading] = useState(true)

  const [editName, setEditName] = useState('')
  const [editBio, setEditBio] = useState('')
  const [editImage, setEditImage] = useState('')

  // Se for o próprio usuário, preenche os campos direto do zustand
  useEffect(() => {
    if (isOwner && user) {
      setEditName(user.name || '')
      setEditBio(user.bio || '')
      setEditImage(user.image || '')
    }
  }, [isOwner, user])

  // Buscar listas do usuário (sem alterar dados do perfil)
  useEffect(() => {
    const fetchLists = async () => {
      const catParam = category !== 'todas' ? `&category=${category}` : ''
      const url = `/api/lists?ownerUid=${uid}${catParam}`

      const headers = {}
      if (isOwner && firebaseToken) {
        headers['Authorization'] = `Bearer ${firebaseToken}`
      }

      const res = await fetch(url, { headers })
      const data = await res.json()
      setLists(data)
      setLoading(false)
    }

    if (isOwner && !firebaseToken) return
    fetchLists()
  }, [uid, category, isOwner, firebaseToken])

  // Upload de imagem
  const handleImageUpload = async (file) => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('folder', 'profile_pics')

    const res = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    })

    const data = await res.json()
    if (res.ok) {
      setEditImage(data.url) // atualiza campo para salvar depois
    } else {
      toast.error(data.error || 'Erro ao fazer upload da imagem')
    }
  }

  // Salvar alterações e atualizar zustand
  const handleSave = async () => {
    try {
      const res = await fetch(`/api/users/${uid}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(firebaseToken && { Authorization: `Bearer ${firebaseToken}` }),
        },
        body: JSON.stringify({
          name: editName,
          bio: editBio,
          image: editImage,
        }),
      })

      if (res.ok) {
        const updated = await res.json()

        // Atualiza o estado global do usuário no zustand
        if (isOwner) {
          setUser(updated)
        }

        toast.success('Perfil atualizado com sucesso!')
      } else {
        toast.error('Erro ao atualizar o perfil.')
      }
    } catch {
      toast.error('Erro inesperado ao salvar alterações.')
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      {(isOwner ? user : null) && (
        <div className="mb-6 border-b pb-4">
          <div className="flex items-center gap-4">
            <img
              src={editImage || '/default-avatar.png'}
              alt={editName}
              className="w-16 h-16 rounded-full"
            />
            <div>
              {isOwner ? (
                <>
                  <input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="text-xl font-semibold border-b"
                  />
                  <textarea
                    value={editBio}
                    onChange={(e) => setEditBio(e.target.value)}
                    placeholder="Bio..."
                    className="block mt-1 text-gray-600 text-sm border rounded px-2 py-1 w-full"
                  />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) handleImageUpload(file)
                    }}
                    className="mt-2"
                  />
                  <button
                    onClick={handleSave}
                    className="mt-2 bg-blue-600 text-white text-sm px-3 py-1 rounded"
                  >
                    Salvar Alterações
                  </button>
                </>
              ) : (
                <>
                  <h2 className="text-2xl font-bold">{user.name}</h2>
                  <p className="text-gray-600 text-sm">{user.bio}</p>
                </>
              )}
              <p className="text-gray-500 text-sm mt-1">
                listas{!isOwner && ' públicas'}: {lists.length}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="mb-4">
        <label className="mr-2 font-medium">Filtrar por categoria:</label>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="border px-2 py-1 rounded"
        >
          {CATEGORIES.map((cat) => (
            <option key={cat.value} value={cat.value}>
              {cat.label}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <p>Carregando...</p>
      ) : (
        <div className="grid gap-4">
          {lists.map((list) => (
            <ListCard key={list._id} list={list} />
          ))}
        </div>
      )}
    </div>
  )
}
