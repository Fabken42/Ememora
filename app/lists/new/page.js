// /app/lists/new/page.js
'use client'

import { useState } from 'react'
import TermCard from '@/components/TermCard'
import { useRouter } from 'next/navigation'
import { CATEGORIES } from '@/lib/utils'
import useUserStore from '@/store/useUserStore'
import toast from 'react-hot-toast'

export default function NewListPage() {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('idiomas')
  const [isPublic, setIsPublic] = useState(true)
  const [terms, setTerms] = useState([])
  const [newTerm, setNewTerm] = useState({ term: '', definition: '', hint: '', termImage: '', definitionImage: '' })
  const [termPreview, setTermPreview] = useState('')
  const [definitionPreview, setDefinitionPreview] = useState('')

  const userId = useUserStore(state => state.user?.uid)
  const firebaseToken = useUserStore(state => state.firebaseToken)

  const router = useRouter()

  const uploadImage = async (file, type) => {
    const formData = new FormData()
    formData.append('file', file)

    const res = await fetch('/api/upload', {
      method: 'POST',
      body: formData
    })

    if (!res.ok) throw new Error('Falha no upload')
    const { url } = await res.json()
    setNewTerm(prev => ({ ...prev, [type]: url }))
  }

  const handleFileChange = async (e, type, setPreview) => {
    const file = e.target.files[0]
    if (file) {
      setPreview(URL.createObjectURL(file))
      await uploadImage(file, type)
    }
  }

  const addTerm = () => {
    if (!newTerm.term || !newTerm.definition) return

    setTerms([...terms, {
      ...newTerm,
      progress: userId ? [{ userId, status: 0 }] : []
    }])

    setNewTerm({ term: '', definition: '', hint: '', termImage: '', definitionImage: '' })
    setTermPreview('')
    setDefinitionPreview('')
  }

  const removeTerm = (index) => {
    const updated = [...terms]
    updated.splice(index, 1)
    setTerms(updated)
  }

  const handleSave = async () => {
    if (!userId || !firebaseToken) {
      toast.error('Você precisa estar logado para criar uma lista.')
      return
    }

    const payload = { title, description, public: isPublic, terms, category }

    const res = await fetch('/api/lists', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${firebaseToken}`
      },
      body: JSON.stringify(payload),
    })

    if (res.ok) {
      toast.success('Lista criada com sucesso!')
      router.push(`/users/${userId}`)
    }
    else toast.error('Erro ao salvar lista!')
  }

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-4">
      <h2 className="text-2xl font-semibold mb-4">Criar Nova Lista</h2>
      <input type="text" placeholder="Título da lista" value={title} onChange={e => setTitle(e.target.value)} className="w-full px-4 py-2 border rounded" />
      <textarea placeholder="Descrição" value={description} onChange={e => setDescription(e.target.value)} className="w-full px-4 py-2 border rounded" />
      <select value={category} onChange={e => setCategory(e.target.value)} className="w-full border px-2 py-1 rounded">
        {CATEGORIES.map(cat => <option key={cat.value} value={cat.value}>{cat.label}</option>)}
      </select>
      <label className="flex items-center gap-2">
        <input type="checkbox" checked={isPublic} onChange={e => setIsPublic(e.target.checked)} />
        Tornar esta lista pública
      </label>

      <hr />
      <h2 className="text-xl font-medium">Adicionar Termo</h2>

      {/* Campo Termo */}
      <textarea
        placeholder="Termo"
        value={newTerm.term}
        onChange={e => setNewTerm({ ...newTerm, term: e.target.value })}
        className="w-full px-4 py-2 border rounded resize-y"
        rows={2}
      />
      <input
        type="file"
        accept="image/*"
        onChange={e => handleFileChange(e, 'termImage', setTermPreview)}
      />
      {termPreview && (
        <img
          src={termPreview}
          alt="Prévia termo"
          className="w-full h-40 object-cover rounded"
        />
      )}

      {/* Campo Definição */}
      <textarea
        placeholder="Definição"
        value={newTerm.definition}
        onChange={e => setNewTerm({ ...newTerm, definition: e.target.value })}
        className="w-full px-4 py-2 border rounded resize-y"
        rows={2}
      />
      <input
        type="file"
        accept="image/*"
        onChange={e => handleFileChange(e, 'definitionImage', setDefinitionPreview)}
      />
      {definitionPreview && (
        <img
          src={definitionPreview}
          alt="Prévia definição"
          className="w-full h-40 object-cover rounded"
        />
      )}

      <textarea placeholder="Dica (opcional)" value={newTerm.hint} onChange={e => setNewTerm({ ...newTerm, hint: e.target.value })} className="w-full px-4 py-2 border rounded resize-y" rows={1}/>

      <button onClick={addTerm} className="bg-emerald-600 text-white py-2 px-4 rounded">Adicionar Termo</button>

      <div className="grid gap-2 mt-6">
        {terms.map((term, i) => (
          <div key={i} className="relative">
            <TermCard term={term} />
            <button onClick={() => removeTerm(i)} className="absolute top-1 right-1 text-xs text-red-500 hover:underline">remover</button>
          </div>
        ))}
      </div>

      <button onClick={handleSave} className="mt-6 bg-blue-600 text-white py-2 px-4 rounded">Salvar Lista</button>
    </div>
  )
}
