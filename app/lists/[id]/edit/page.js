'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import useUserStore from '@/store/useUserStore';
import toast from 'react-hot-toast';
import { CATEGORIES } from '@/lib/utils';
import BackButton from '@/components/BackButton';
import LoadingSpinner from '@/components/LoadingSpinner';
import { FiTrash2, FiX, FiPlus, FiUpload, FiImage } from 'react-icons/fi';

export default function EditListPage() {
  const { id } = useParams();
  const router = useRouter();
  const userId = useUserStore(state => state.user?.uid);
  const firebaseToken = useUserStore(state => state.firebaseToken);
  const isHydrated = useUserStore(state => state.isHydrated);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true); 
  const [isSaving, setIsSaving] = useState(false);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('languages');
  const [isPublic, setIsPublic] = useState(false);
  const [terms, setTerms] = useState([]);
  const [newTerm, setNewTerm] = useState({ 
    term: '', 
    definition: '', 
    hint: '', 
    termImage: '', 
    definitionImage: '' 
  });
  const [uploadingImage, setUploadingImage] = useState(null);
  const [tempImages, setTempImages] = useState({}); // Para armazenar imagens temporárias

  useEffect(() => {
    const checkAuthAndAuthorization = async () => {
      if(!isHydrated) return;
      
      if (!userId || !firebaseToken) {
        toast.error('Você precisa estar logado para editar uma lista.');
        router.push('/login');
        return;
      }

      try {
        const res = await fetch(`/api/lists/${id}`, {
          headers: { Authorization: `Bearer ${firebaseToken}` }
        });

        if (!res.ok) {
          throw new Error('Erro ao carregar lista.');
        }

        const data = await res.json();

        if (data.ownerUid !== userId) {
          toast.error('Você não tem permissão para editar esta lista.');
          router.replace('/');
          return;
        }

        setTitle(data.title || '');
        setDescription(data.description || '');
        setCategory(data.category || 'languages');
        setIsPublic(data.public || false);
        setTerms(data.terms || []);
        setIsCheckingAuth(false);

      } catch (err) {
        console.error(err);
        toast.error('Erro ao carregar lista.');
        router.replace('/');
      }
    };

    if (id) {
      checkAuthAndAuthorization();
    }
  }, [id, userId, firebaseToken, router, isHydrated]);

  const hasMinimumData = (data) => {
    if (!data.title?.trim()) return false;
    const validTerms = (data.terms || []).filter(t => t.term?.trim() && t.definition?.trim());
    return validTerms.length > 0;
  };

  const saveList = async (updatedData) => {
    if (!userId || !firebaseToken) {
      toast.error('Você precisa estar logado para salvar alterações.');
      router.push('/login');
      return;
    }

    const mergedData = {
      title,
      description,
      category,
      public: isPublic,
      terms,
      ...updatedData
    };

    if (!hasMinimumData(mergedData)) {
      toast.error('Título e pelo menos um termo com definição são obrigatórios.');
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch(`/api/lists/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${firebaseToken}`,
        },
        body: JSON.stringify({
          ownerUid: userId,
          ...mergedData
        }),
      });

      if (!res.ok) throw new Error((await res.json()).error);
      toast.success('Lista salva!');
    } catch (err) {
      toast.error(err.message || 'Erro ao salvar lista');
    } finally {
      setIsSaving(false);
    }
  };

  const handleTermChange = (index, field, value) => {
    const updated = [...terms];
    updated[index] = { ...updated[index], [field]: value };
    setTerms(updated);
  };

  const handleTermBlur = () => {
    saveList({ terms });
  };

  const handleImageUpload = async (file, index, field) => {
    if (!file) return;
    
    setUploadingImage(`${index}-${field}`);
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const res = await fetch('/api/upload', { 
        method: 'POST', 
        body: formData 
      });
      
      if (!res.ok) throw new Error((await res.json()).error);
      
      const data = await res.json();
      const updated = [...terms];
      updated[index] = { ...updated[index], [field]: data.url };
      setTerms(updated);
      saveList({ terms: updated });
      
    } catch (err) {
      toast.error('Erro ao enviar imagem');
    } finally {
      setUploadingImage(null);
    }
  };

  const handleNewTermImageSelect = (file, field) => {
    if (!file) return;
    
    // Armazena a imagem temporariamente sem fazer upload
    const reader = new FileReader();
    reader.onload = (e) => {
      setTempImages(prev => ({
        ...prev,
        [field]: {
          file,
          preview: e.target.result
        }
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = (index, field) => {
    const updated = [...terms];
    updated[index] = { ...updated[index], [field]: '' };
    setTerms(updated);
    saveList({ terms: updated });
  };

  const handleRemoveNewTermImage = (field) => {
    setNewTerm(prev => ({ ...prev, [field]: '' }));
    setTempImages(prev => {
      const newTemp = { ...prev };
      delete newTemp[field];
      return newTemp;
    });
  };

  const uploadTempImages = async () => {
    const uploadPromises = [];
    const newTermData = { ...newTerm };

    // Upload das imagens temporárias
    for (const [field, tempImage] of Object.entries(tempImages)) {
      if (tempImage.file) {
        uploadPromises.push(
          (async () => {
            const formData = new FormData();
            formData.append('file', tempImage.file);
            
            const res = await fetch('/api/upload', { 
              method: 'POST', 
              body: formData 
            });
            
            if (!res.ok) throw new Error((await res.json()).error);
            
            const data = await res.json();
            newTermData[field] = data.url;
          })()
        );
      }
    }

    await Promise.all(uploadPromises);
    return newTermData;
  };

  const addTerm = async () => {
    if (!newTerm.term.trim() || !newTerm.definition.trim()) {
      toast.error('Termo e definição são obrigatórios.');
      return;
    }

    setIsSaving(true);
    try {
      let finalTermData = { ...newTerm };

      // Se houver imagens temporárias, faz o upload
      if (Object.keys(tempImages).length > 0) {
        finalTermData = await uploadTempImages();
      }

      const updatedTerms = [
        ...terms,
        { 
          ...finalTermData, 
          progress: userId ? [{ userId, status: 0 }] : [] 
        }
      ];
      
      setTerms(updatedTerms);
      setNewTerm({ 
        term: '', 
        definition: '', 
        hint: '', 
        termImage: '', 
        definitionImage: '' 
      });
      setTempImages({});
      
      await saveList({ terms: updatedTerms });
      
    } catch (err) {
      toast.error('Erro ao adicionar termo com imagens');
    } finally {
      setIsSaving(false);
    }
  };

  const removeTerm = (index) => {
    if (!confirm('Excluir este termo?')) return;
    
    const updated = [...terms];
    updated.splice(index, 1);
    setTerms(updated);
    saveList({ terms: updated });
  };

  const handleDelete = async () => {
    if (!confirm('Tem certeza que deseja excluir esta lista? Esta ação não pode ser desfeita.')) return;
    
    setIsSaving(true);
    try {
      const res = await fetch(`/api/lists/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${firebaseToken}` },
      });

      if (res.ok) {
        toast.success('Lista excluída com sucesso!');
        router.push(`/users/${userId}`);
      } else {
        throw new Error('Erro ao excluir lista');
      }
    } catch (err) {
      toast.error('Erro ao excluir lista');
    } finally {
      setIsSaving(false);
    }
  };

  if (isCheckingAuth || !isHydrated) {
    return <LoadingSpinner message='Verificando permissões...' />;
  }

  return (
  <>
    <BackButton />
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-6 text-[--primary-text]">Editar Lista</h1>

      {/* Campos da lista */}
      <div className="space-y-4 mb-8">
        <input
          value={title}
          onChange={e => setTitle(e.target.value)}
          onBlur={() => saveList({ title })}
          placeholder="Título da lista *"
          className="w-full border border-indigo-500/30 bg-[#24243e] text-[--primary-text] px-4 py-3 rounded-lg text-lg placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
        />
        <textarea
          value={description}
          onChange={e => setDescription(e.target.value)}
          onBlur={() => saveList({ description })}
          placeholder="Descrição da lista"
          className="w-full border border-indigo-500/30 bg-[#24243e] text-[--primary-text] px-4 py-3 rounded-lg resize-y placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
          rows={3}
        />
        <div>
          <label className="block mb-2 text-sm font-medium text-gray-300">Categoria:</label>
          <select
            value={category}
            onChange={e => setCategory(e.target.value)}
            onBlur={() => saveList({ category })}
            className="w-full border border-indigo-500/30 bg-[#24243e] text-[--primary-text] rounded-lg px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
          >
            {CATEGORIES.slice(1).map(cat => (
              <option key={cat.value} value={cat.value}>
                {cat.label}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-3 p-3 rounded-lg bg-[#24243e] border border-indigo-500/30">
          <input
            type="checkbox"
            id="isPublic"
            checked={isPublic}
            onChange={e => setIsPublic(e.target.checked)}
            onBlur={() => saveList({ public: isPublic })}
            className="w-5 h-5 text-indigo-500 bg-[#2d2b42] border-gray-600 rounded focus:ring-2 focus:ring-indigo-500"
          />
          <label htmlFor="isPublic" className="text-sm font-medium text-gray-300">
            Lista pública
          </label>
        </div>
      </div>

      {/* Termos existentes */}
      <div className="space-y-6 mb-8">
        <h2 className="text-xl font-semibold flex items-center gap-2 text-[--primary-text]">
          <FiPlus className="text-emerald-400" />
          Termos ({terms.length})
        </h2>
        
        {terms.map((term, i) => (
          <div key={i} className="border border-indigo-500/20 p-6 rounded-xl space-y-4 bg-[#24243e] shadow-lg transition-all hover:border-indigo-500/40">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block mb-2 text-sm font-medium text-gray-300">Termo *</label>
                <textarea
                  value={term.term}
                  onChange={e => handleTermChange(i, 'term', e.target.value)}
                  onBlur={handleTermBlur}
                  placeholder="Digite o termo"
                  className="w-full border border-indigo-500/30 bg-[#2d2b55] text-[--primary-text] px-4 py-3 rounded-lg resize-y placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                  rows={3}
                />
              </div>
              <div>
                <label className="block mb-2 text-sm font-medium text-gray-300">Definição *</label>
                <textarea
                  value={term.definition}
                  onChange={e => handleTermChange(i, 'definition', e.target.value)}
                  onBlur={handleTermBlur}
                  placeholder="Digite a definição"
                  className="w-full border border-indigo-500/30 bg-[#2d2b55] text-[--primary-text] px-4 py-3 rounded-lg resize-y placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                  rows={3}
                />
              </div>
            </div>

            <div>
              <label className="block mb-2 text-sm font-medium text-gray-300">Dica (opcional)</label>
              <input
                value={term.hint}
                onChange={e => handleTermChange(i, 'hint', e.target.value)}
                onBlur={handleTermBlur}
                placeholder="Dica para ajudar a lembrar"
                className="w-full border border-indigo-500/30 bg-[#2d2b55] text-[--primary-text] px-4 py-3 rounded-lg placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              />
            </div>
            
            {/* Imagens do termo existente */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block mb-2 text-sm font-medium flex items-center gap-2 text-gray-300">
                  <FiImage className="text-blue-400" />
                  Imagem do termo
                </label>
                {term.termImage ? (
                  <div className="flex items-center gap-3 p-3 border border-indigo-500/30 rounded-lg bg-[#2d2b55]">
                    <img src={term.termImage} alt="" className="w-16 h-16 object-cover rounded" />
                    <button 
                      onClick={() => handleRemoveImage(i, 'termImage')} 
                      className="text-red-400 hover:text-red-300 flex items-center gap-1 text-sm transition-colors"
                    >
                      <FiTrash2 /> Remover
                    </button>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-indigo-500/30 rounded-lg p-4 text-center hover:border-indigo-500/50 transition-colors">
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={e => handleImageUpload(e.target.files[0], i, 'termImage')}
                      className="hidden"
                      id={`term-image-${i}`}
                    />
                    <label 
                      htmlFor={`term-image-${i}`}
                      className="cursor-pointer flex flex-col items-center text-gray-400 hover:text-gray-300 transition-colors"
                    >
                      <FiUpload className="w-6 h-6 mb-2" />
                      <span className="text-sm">Clique para upload</span>
                    </label>
                  </div>
                )}
              </div>
              
              <div>
                <label className="block mb-2 text-sm font-medium flex items-center gap-2 text-gray-300">
                  <FiImage className="text-green-400" />
                  Imagem da definição
                </label>
                {term.definitionImage ? (
                  <div className="flex items-center gap-3 p-3 border border-indigo-500/30 rounded-lg bg-[#2d2b55]">
                    <img src={term.definitionImage} alt="" className="w-16 h-16 object-cover rounded" />
                    <button 
                      onClick={() => handleRemoveImage(i, 'definitionImage')} 
                      className="text-red-400 hover:text-red-300 flex items-center gap-1 text-sm transition-colors"
                    >
                      <FiTrash2 /> Remover
                    </button>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-indigo-500/30 rounded-lg p-4 text-center hover:border-indigo-500/50 transition-colors">
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={e => handleImageUpload(e.target.files[0], i, 'definitionImage')}
                      className="hidden"
                      id={`definition-image-${i}`}
                    />
                    <label 
                      htmlFor={`definition-image-${i}`}
                      className="cursor-pointer flex flex-col items-center text-gray-400 hover:text-gray-300 transition-colors"
                    >
                      <FiUpload className="w-6 h-6 mb-2" />
                      <span className="text-sm">Clique para upload</span>
                    </label>
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex justify-end pt-2">
              <button 
                onClick={() => removeTerm(i)} 
                className="text-red-400 hover:text-red-300 flex items-center gap-2 text-sm font-medium transition-colors"
              >
                <FiTrash2 /> Excluir termo
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Novo termo */}
      <div className="border-2 border-dashed border-emerald-500/50 p-6 rounded-xl space-y-4 mb-8 bg-emerald-900/20">
        <h3 className="text-lg font-semibold flex items-center gap-2 text-emerald-300">
          <FiPlus /> Adicionar novo termo
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block mb-2 text-sm font-medium text-gray-300">Termo *</label>
            <textarea
              value={newTerm.term}
              onChange={e => setNewTerm({ ...newTerm, term: e.target.value })}
              placeholder="Digite o termo"
              className="w-full border border-indigo-500/30 bg-[#2d2b55] text-[--primary-text] px-4 py-3 rounded-lg resize-y placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              rows={3}
            />
          </div>
          <div>
            <label className="block mb-2 text-sm font-medium text-gray-300">Definição *</label>
            <textarea
              value={newTerm.definition}
              onChange={e => setNewTerm({ ...newTerm, definition: e.target.value })}
              placeholder="Digite a definição"
              className="w-full border border-indigo-500/30 bg-[#2d2b55] text-[--primary-text] px-4 py-3 rounded-lg resize-y placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              rows={3}
            />
          </div>
        </div>

        <div>
          <label className="block mb-2 text-sm font-medium text-gray-300">Dica (opcional)</label>
          <input
            value={newTerm.hint}
            onChange={e => setNewTerm({ ...newTerm, hint: e.target.value })}
            placeholder="Dica para ajudar a lembrar"
            className="w-full border border-indigo-500/30 bg-[#2d2b55] text-[--primary-text] px-4 py-3 rounded-lg placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block mb-2 text-sm font-medium flex items-center gap-2 text-gray-300">
              <FiImage className="text-blue-400" />
              Imagem do termo
            </label>
            {tempImages.termImage ? (
              <div className="flex items-center gap-3 p-3 border border-indigo-500/30 rounded-lg bg-[#2d2b55]">
                <img src={tempImages.termImage.preview} alt="" className="w-16 h-16 object-cover rounded" />
                <button 
                  onClick={() => handleRemoveNewTermImage('termImage')} 
                  className="text-red-400 hover:text-red-300 flex items-center gap-1 text-sm transition-colors"
                >
                  <FiX /> Remover
                </button>
              </div>
            ) : (
              <div className="border-2 border-dashed border-indigo-500/30 rounded-lg p-4 text-center hover:border-indigo-500/50 transition-colors">
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={e => handleNewTermImageSelect(e.target.files[0], 'termImage')}
                  className="hidden"
                  id="new-term-image"
                />
                <label 
                  htmlFor="new-term-image"
                  className="cursor-pointer flex flex-col items-center text-gray-400 hover:text-gray-300 transition-colors"
                >
                  <FiUpload className="w-6 h-6 mb-2" />
                  <span className="text-sm">Selecionar imagem</span>
                </label>
              </div>
            )}
          </div>
          
          <div>
            <label className="block mb-2 text-sm font-medium flex items-center gap-2 text-gray-300">
              <FiImage className="text-green-400" />
              Imagem da definição
            </label>
            {tempImages.definitionImage ? (
              <div className="flex items-center gap-3 p-3 border border-indigo-500/30 rounded-lg bg-[#2d2b55]">
                <img src={tempImages.definitionImage.preview} alt="" className="w-16 h-16 object-cover rounded" />
                <button 
                  onClick={() => handleRemoveNewTermImage('definitionImage')} 
                  className="text-red-400 hover:text-red-300 flex items-center gap-1 text-sm transition-colors"
                >
                  <FiX /> Remover
                </button>
              </div>
            ) : (
              <div className="border-2 border-dashed border-indigo-500/30 rounded-lg p-4 text-center hover:border-indigo-500/50 transition-colors">
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={e => handleNewTermImageSelect(e.target.files[0], 'definitionImage')}
                  className="hidden"
                  id="new-definition-image"
                />
                <label 
                  htmlFor="new-definition-image"
                  className="cursor-pointer flex flex-col items-center text-gray-400 hover:text-gray-300 transition-colors"
                >
                  <FiUpload className="w-6 h-6 mb-2" />
                  <span className="text-sm">Selecionar imagem</span>
                </label>
              </div>
            )}
          </div>
        </div>
        
        <div className="flex justify-end">
          <button 
            onClick={addTerm} 
            disabled={!newTerm.term.trim() || !newTerm.definition.trim() || isSaving}
            className="bg-emerald-600 hover:bg-emerald-500 text-white py-3 px-6 rounded-lg disabled:opacity-50 flex items-center gap-2 font-medium transition-colors"
          >
            <FiPlus /> {isSaving ? 'Adicionando...' : 'Adicionar Termo'}
          </button>
        </div>
      </div>

      {/* Botão de exclusão */}
      <div className="border-t border-indigo-500/20 pt-6">
        <button 
          onClick={handleDelete} 
          disabled={isSaving}
          className="bg-red-600 hover:bg-red-500 text-white py-3 px-6 rounded-lg disabled:opacity-50 flex items-center gap-2 font-medium transition-colors"
        >
          <FiTrash2 /> {isSaving ? 'Excluindo...' : 'Excluir Lista'}
        </button>
      </div>

      {uploadingImage && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-[#24243e] p-6 rounded-xl border border-indigo-500/30">
            <LoadingSpinner message="Enviando imagem..." />
          </div>
        </div>
      )}
    </div>
  </>
);
}