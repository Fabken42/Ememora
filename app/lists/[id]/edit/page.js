'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import useUserStore from '@/store/useUserStore';
import toast from 'react-hot-toast';
import { CATEGORIES } from '@/lib/utils';

export default function EditListPage() {
  const { id } = useParams();
  const router = useRouter();
  const userId = useUserStore(state => state.user?.uid);
  const firebaseToken = useUserStore(state => state.firebaseToken);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('idiomas');
  const [isPublic, setIsPublic] = useState(false);
  const [terms, setTerms] = useState([]);
  const [newTerm, setNewTerm] = useState({ term: '', definition: '', hint: '', termImage: '', definitionImage: '' });

  useEffect(() => {
    if (!id || !userId) return;
    const fetchList = async () => {
      try {
        const res = await fetch(`/api/lists/${id}`, {
          headers: firebaseToken ? { Authorization: `Bearer ${firebaseToken}` } : {}
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        if (data.ownerUid !== userId) return router.replace('/');
        setTitle(data.title || '');
        setDescription(data.description || '');
        setCategory(data.category || 'idiomas');
        setIsPublic(data.public || false);
        setTerms(data.terms || []);
      } catch (err) {
        console.error(err);
        router.replace('/');
      }
    };
    fetchList();
  }, [id, userId, firebaseToken]);

  const saveList = async (updatedData) => {
    try {
      const res = await fetch(`/api/lists/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${firebaseToken}`,
        },
        body: JSON.stringify({
          ownerUid: userId,
          ...updatedData
        }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      toast.success('Lista salva!');
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleTermChange = (index, field, value) => {
    const updated = [...terms];
    updated[index] = { ...updated[index], [field]: value };
    setTerms(updated);
  };

  const handleTermBlur = (index) => {
    saveList({ terms });
  };

  const handleImageUpload = async (file, index, field) => {
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      if (!res.ok) throw new Error((await res.json()).error);
      const data = await res.json();
      const updated = [...terms];
      updated[index] = { ...updated[index], [field]: data.url };
      setTerms(updated);
      saveList({ terms: updated });
    } catch (err) {
      toast.error('Erro ao enviar imagem');
    }
  };

  const handleRemoveImage = (index, field) => {
    const updated = [...terms];
    updated[index] = { ...updated[index], [field]: '' };
    setTerms(updated);
    saveList({ terms: updated });
  };

  const addTerm = () => {
    if (!newTerm.term || !newTerm.definition) return;
    const updatedTerms = [
      ...terms,
      { ...newTerm, progress: userId ? [{ userId, status: 0 }] : [] }
    ];
    setTerms(updatedTerms);
    setNewTerm({ term: '', definition: '', hint: '', termImage: '', definitionImage: '' });
    saveList({ terms: updatedTerms });
  };

  const removeTerm = (index) => {
    const updated = [...terms];
    updated.splice(index, 1);
    setTerms(updated);
    saveList({ terms: updated });
  };

  const handleDelete = async () => {
    if (!confirm('Excluir esta lista?')) return;
    const res = await fetch(`/api/lists/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${firebaseToken}` },
    });
    if (res.ok) {
      router.push(`/users/${userId}`);
    } else {
      toast.error('Erro ao excluir');
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-4">Editar Lista</h1>

      {/* Campos principais */}
      <input
        value={title}
        onChange={e => setTitle(e.target.value)}
        onBlur={() => saveList({ title })}
        placeholder="Título da lista"
        className="w-full border px-2 py-1 rounded mb-2"
      />
      <textarea
        value={description}
        onChange={e => setDescription(e.target.value)}
        onBlur={() => saveList({ description })}
        placeholder="Descrição da lista"
        className="w-full border px-2 py-1 rounded mb-2 resize-y"
        rows={3}
      />
      <div className="mb-2">
        <label>Categoria:</label>
        <select
          value={category}
          onChange={e => setCategory(e.target.value)}
          onBlur={() => saveList({ category })}
          className="w-full border rounded px-2 py-1"
        >
          {CATEGORIES.map(cat => (
            <option key={cat.value} value={cat.value}>
              {cat.label}
            </option>
          ))}
        </select>
      </div>
      <div className="mb-4 flex items-center gap-2">
        <input
          type="checkbox"
          checked={isPublic}
          onChange={e => setIsPublic(e.target.checked)}
          onBlur={() => saveList({ public: isPublic })}
        />
        <label>Lista pública</label>
      </div>

      {/* Termos existentes */}
      {terms.map((term, i) => (
        <div key={i} className="border p-4 mb-4 rounded space-y-2">
          <textarea
            value={term.term}
            onChange={e => handleTermChange(i, 'term', e.target.value)}
            onBlur={() => handleTermBlur(i)}
            placeholder="Termo"
            className="w-full border px-2 py-1 rounded resize-y"
            rows={2}
          />
          <textarea
            value={term.definition}
            onChange={e => handleTermChange(i, 'definition', e.target.value)}
            onBlur={() => handleTermBlur(i)}
            placeholder="Definição"
            className="w-full border px-2 py-1 rounded resize-y"
            rows={2}
          />
          <input
            value={term.hint}
            onChange={e => handleTermChange(i, 'hint', e.target.value)}
            onBlur={() => handleTermBlur(i)}
            placeholder="Dica"
            className="w-full border px-2 py-1 rounded"
          />
          <div>
            <label>Imagem do termo:</label>
            {term.termImage ? (
              <div className="flex items-center gap-2">
                <img src={term.termImage} alt="" className="w-20 h-20 object-cover" />
                <button onClick={() => handleRemoveImage(i, 'termImage')} className="text-red-500">Remover</button>
              </div>
            ) : (
              <input type="file" accept="image/*" onChange={e => handleImageUpload(e.target.files[0], i, 'termImage')} />
            )}
          </div>
          <div>
            <label>Imagem da definição:</label>
            {term.definitionImage ? (
              <div className="flex items-center gap-2">
                <img src={term.definitionImage} alt="" className="w-20 h-20 object-cover" />
                <button onClick={() => handleRemoveImage(i, 'definitionImage')} className="text-red-500">Remover</button>
              </div>
            ) : (
              <input type="file" accept="image/*" onChange={e => handleImageUpload(e.target.files[0], i, 'definitionImage')} />
            )}
          </div>
          <button onClick={() => removeTerm(i)} className="text-red-600">Excluir termo</button>
        </div>
      ))}

      {/* Adicionar termo */}
      <textarea
        value={newTerm.term}
        onChange={e => setNewTerm({ ...newTerm, term: e.target.value })}
        placeholder="Termo"
        className="w-full border px-2 py-1 rounded resize-y"
        rows={2}
      />
      <textarea
        value={newTerm.definition}
        onChange={e => setNewTerm({ ...newTerm, definition: e.target.value })}
        placeholder="Definição"
        className="w-full border px-2 py-1 rounded resize-y"
        rows={2}
      />
      <input
        value={newTerm.hint}
        onChange={e => setNewTerm({ ...newTerm, hint: e.target.value })}
        placeholder="Dica"
        className="w-full border px-2 py-1 rounded"
      />
      <div>
        <label>Imagem do termo:</label>
        {newTerm.termImage && <img src={newTerm.termImage} alt="" className="w-20 h-20" />}
        <input type="file" accept="image/*" onChange={e => handleImageUpload(e.target.files[0], terms.length, 'termImage')} />
      </div>
      <div>
        <label>Imagem da definição:</label>
        {newTerm.definitionImage && <img src={newTerm.definitionImage} alt="" className="w-20 h-20" />}
        <input type="file" accept="image/*" onChange={e => handleImageUpload(e.target.files[0], terms.length, 'definitionImage')} />
      </div>
      <button onClick={addTerm} className="bg-emerald-600 text-white py-2 px-4 rounded mt-2">Adicionar termo</button>

      <hr className="my-6" />
      <button onClick={handleDelete} className="bg-red-600 text-white py-2 px-4 rounded">Excluir Lista</button>
    </div>
  );
}
