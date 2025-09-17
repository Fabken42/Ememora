'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import useUserStore from '@/store/useUserStore';
import toast from 'react-hot-toast';
import { CATEGORIES, hasMinimumData, LIMITS, uploadTempImages } from '@/lib/utils';
import BackButton from '@/components/BackButton';
import LoadingSpinner from '@/components/LoadingSpinner';
import { FiPlus, FiTrash2, FiMove, FiFileText, FiChevronUp, FiChevronDown } from 'react-icons/fi';
import BulkAddTermsModal from '@/components/BulkAddTermsModal';
import ExistingTermCard from '@/components/ExistingTermCard';
import NewTermForm from '@/components/NewTermForm';
import ReorderTermsModal from '@/components/ReorderTermsModal';
import { fetchWithTokenRetry } from '@/lib/utils';

export default function EditListPage() {
  const { id } = useParams();
  const router = useRouter();
  const userId = useUserStore(state => state.user?.uid);
  const firebaseToken = useUserStore(state => state.firebaseToken);
  const handleRefreshToken = useUserStore(state => state.handleRefreshToken);
  const isHydrated = useUserStore(state => state.isHydrated);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isReorderModalOpen, setIsReorderModalOpen] = useState(false);

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
  const [isBulkAddModalOpen, setIsBulkAddModalOpen] = useState(false);

  useEffect(() => {
    const checkAuthAndAuthorization = async () => {
      if (!isHydrated) return;

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

  const handleBulkAddTerms = async (newTerms) => {
    if (terms.length + newTerms.length > LIMITS.TOTAL_TERMS) {
      toast.error(`Limite máximo de ${LIMITS.TOTAL_TERMS} termos atingido`);
      return;
    }

    // Validação dos novos termos
    for (const term of newTerms) {
      if (!term.term.trim() || !term.definition.trim()) {
        toast.error('Termo e definição são obrigatórios.');
        return;
      }
      if (term.term.length > LIMITS.TERM) {
        toast.error(`Termo deve ter no máximo ${LIMITS.TERM} caracteres`);
        return;
      }
      if (term.definition.length > LIMITS.DEFINITION) {
        toast.error(`Definição deve ter no máximo ${LIMITS.DEFINITION} caracteres`);
        return;
      }
      if (term.hint && term.hint.length > LIMITS.TIP) {
        toast.error(`Dica deve ter no máximo ${LIMITS.TIP} caracteres`);
        return;
      }
    }

    setIsSaving(true);
    try {
      const termsWithProgress = newTerms.map(term => ({
        ...term,
        progress: userId ? [{ userId, status: 0 }] : []
      }));

      const updatedTerms = [...terms, ...termsWithProgress];
      setTerms(updatedTerms);
      await saveList({ terms: updatedTerms });

      toast.success(`${newTerms.length} termo(s) adicionado(s)!`);
    } catch (error) {
      console.error('Erro ao adicionar termos em massa:', error);
      toast.error('Erro ao adicionar termos');
    } finally {
      setIsSaving(false);
    }
  };

  const removePerfectTerms = async () => {
    const perfectTerms = terms.filter(term => {
      return term.status === 6; // Status 6 = perfeito
    });

    if (perfectTerms.length === 0) {
      toast.info('Nenhum termo com status perfeito encontrado');
      return;
    }

    if (!confirm(`Excluir ${perfectTerms.length} termo(s) com status perfeito? Esta ação não pode ser desfeita.`)) {
      return;
    }

    setIsSaving(true);
    try {
      // Primeiro, exclui as imagens do Cloudinary dos termos perfeitos
      const imagesToDelete = perfectTerms.flatMap(term =>
        [term.termImage, term.definitionImage].filter(Boolean)
      );

      if (imagesToDelete.length > 0) {
        try {
          const deletePromises = imagesToDelete.map(imageUrl =>
            fetchWithTokenRetry('/api/upload', {
              method: 'DELETE',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${firebaseToken}`,
              },
              body: JSON.stringify({ imageUrl }),
            }, firebaseToken, handleRefreshToken)
          );

          await Promise.all(deletePromises);
        } catch (error) {
          console.error('Erro ao excluir imagens:', error);
        }
      }

      // Filtra os termos, mantendo apenas os não perfeitos
      const updatedTerms = terms.filter(term => {
        return term.status !== 6; // Mantém apenas os não perfeitos
      });

      setTerms(updatedTerms);

      // ⚠️ IMPORTANTE: Envia os termos com progresso preservado
      await saveList({
        terms: updatedTerms.map(term => ({
          term: term.term,
          definition: term.definition,
          hint: term.hint,
          termImage: term.termImage,
          definitionImage: term.definitionImage,
          progress: term.progress || [] // ← PRESERVA O PROGRESSO
        }))
      });

      toast.success(`${perfectTerms.length} termo(s) perfeito(s) excluído(s)!`);

    } catch (error) {
      console.error('Erro ao excluir termos perfeitos:', error);
      toast.error('Erro ao excluir termos perfeitos');
    } finally {
      setIsSaving(false);
    }
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

    // Validações de limite antes de salvar
    if (title && title.length > LIMITS.TITLE) {
      toast.error(`Título deve ter no máximo ${LIMITS.TITLE} caracteres`);
      return;
    }

    if (description && description.length > LIMITS.DESCRIPTION) {
      toast.error(`Descrição deve ter no máximo ${LIMITS.DESCRIPTION} caracteres`);
      return;
    }

    if (mergedData.terms && mergedData.terms.length > LIMITS.TOTAL_TERMS) {
      toast.error(`Limite máximo de ${LIMITS.TOTAL_TERMS} termos atingido`);
      return;
    }

    if (!hasMinimumData(mergedData)) {
      toast.error('Título e pelo menos um termo com definição são obrigatórios.');
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetchWithTokenRetry(`/api/lists/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${firebaseToken}`,
        },
        body: JSON.stringify({
          ownerUid: userId,
          ...mergedData
        }),
      }, firebaseToken, handleRefreshToken);

      if (!res.ok) console.error('Erro ao salvar lista')
      toast.success('Lista salva!');
    } catch (err) {
      console.error('Erro ao salvar lista:', err);
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
    if (!file || !userId || !id || !firebaseToken) return;

    setUploadingImage(`${index}-${field}`);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', 'terms');
      formData.append('userId', userId);
      formData.append('listId', id);
      formData.append('previousImageUrl', terms[index][field]);

      const res = await fetchWithTokenRetry('/api/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${firebaseToken}`,
        },
        body: formData
      }, firebaseToken, handleRefreshToken);

      if (!res.ok) console.error('Erro no upload');

      const data = await res.json();
      const updated = [...terms];
      updated[index] = { ...updated[index], [field]: data.url };
      setTerms(updated);
      saveList({ terms: updated });

    } catch (err) {
      console.error('Erro no upload:', err);
    } finally {
      setUploadingImage(null);
    }
  };

  const handleRemoveImage = async (index, field) => {
    const imageUrl = terms[index][field];
    if (!imageUrl || !firebaseToken) return;

    try {
      const deleteRes = await fetchWithTokenRetry('/api/upload', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${firebaseToken}`,
        },
        body: JSON.stringify({ imageUrl }),
      }, firebaseToken, handleRefreshToken);

      if (!deleteRes.ok) {
        console.error('Erro ao excluir imagem')
      }

      const updated = [...terms];
      updated[index] = { ...updated[index], [field]: '' };
      setTerms(updated);
      saveList({ terms: updated });

    } catch (error) {
      console.error('Erro ao excluir imagem:', error);
    }
  };

  const addTerm = async () => {
    if (terms.length >= LIMITS.TOTAL_TERMS) {
      toast.error(`Limite máximo de ${LIMITS.TOTAL_TERMS} termos atingido`);
      return;
    }

    if (!newTerm.term.trim() || !newTerm.definition.trim()) {
      toast.error('Termo e definição são obrigatórios.');
      return;
    }

    if (newTerm.term.length > LIMITS.TERM) {
      toast.error(`Termo deve ter no máximo ${LIMITS.TERM} caracteres`);
      return;
    }

    if (newTerm.definition.length > LIMITS.DEFINITION) {
      toast.error(`Definição deve ter no máximo ${LIMITS.DEFINITION} caracteres`);
      return;
    }

    if (newTerm.hint && newTerm.hint.length > LIMITS.TIP) {
      toast.error(`Dica deve ter no máximo ${LIMITS.TIP} caracteres`);
      return;
    }

    setIsSaving(true);
    try {
      let finalTermData = { ...newTerm };

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

  const removeTerm = async (index) => {
    if (!confirm('Excluir este termo?') || !firebaseToken) return;

    try {
      const termToRemove = terms[index];

      // Exclui as imagens do Cloudinary se existirem
      const imagesToDelete = [termToRemove.termImage, termToRemove.definitionImage].filter(Boolean);

      if (imagesToDelete.length > 0) {
        const deletePromises = imagesToDelete.map(imageUrl =>
          fetchWithTokenRetry('/api/upload', {
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${firebaseToken}`,
            },
            body: JSON.stringify({ imageUrl }),
          }, firebaseToken, handleRefreshToken)
            .then(res => {
              if (!res.ok) {
                console.error('Erro ao excluir imagem')
              }
              return res;
            })
            .catch(error => {
              console.error('Erro ao excluir imagem:', error);
              return null;
            })
        );

        await Promise.all(deletePromises);
      }

      // Atualiza o estado local
      const updated = [...terms];
      updated.splice(index, 1);
      setTerms(updated);
      saveList({ terms: updated });

    } catch (error) {
      console.error('Error: ' + error)
    }
  };

  const handleReorderTerms = (reorderedTerms) => {
    setTerms(reorderedTerms);
    saveList({ terms: reorderedTerms });
  };

  const handleDelete = async () => {
    if (!confirm('Tem certeza que deseja excluir esta lista? Esta ação não pode ser desfeita.') || !firebaseToken) return;

    setIsSaving(true);
    try {
      const allImages = terms.flatMap(term =>
        [term.termImage, term.definitionImage].filter(Boolean)
      );

      if (allImages.length > 0) {
        const deleteRes = await fetchWithTokenRetry('/api/upload/delete-folder', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${firebaseToken}`,
          },
          body: JSON.stringify({
            folderPath: `terms/${userId}/${id}`,
            images: allImages
          }),
        }, firebaseToken, handleRefreshToken);

        if (!deleteRes.ok) {
          console.error('Erro ao deletar')
        }
      }

      const res = await fetchWithTokenRetry(`/api/lists/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${firebaseToken}` },
      }, firebaseToken, handleRefreshToken);

      if (res.ok) {
        toast.success('Lista excluída com sucesso!');
        router.push(`/users/${userId}`);
      } else {
        console.error('Erro ao excluir lista')
      }
    } catch (err) {
      console.error('Erro ao excluir lista:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const perfectTermsCount = terms.filter(term => {
    return term.status === 6; // Status 6 = perfeito
  }).length;

  if (isCheckingAuth || !isHydrated) {
    return <LoadingSpinner message='Verificando permissões...' />;
  }

  return (
    <>
      <BackButton listId={id} />
      <div className="max-w-2xl mx-auto p-6">
        {/* Cabeçalho com título e botões */}
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <h1 className="text-2xl font-semibold">Editar Lista</h1>

            {/* Botões - aparecem abaixo em mobile */}
            <div className="flex flex-col xs:flex-row gap-2">
              {/* Botão de adicionar em massa */}
              <button
                onClick={() => setIsBulkAddModalOpen(true)}
                disabled={terms.length >= LIMITS.TOTAL_TERMS}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-500 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors text-sm"
                title="Adicionar múltiplos termos de uma vez"
              >
                <FiFileText size={16} />
                Adicionar em Massa
              </button>

              {/* Botão de excluir lista */}
              <button
                onClick={handleDelete}
                disabled={isSaving}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg disabled:opacity-50 transition-colors text-sm"
              >
                <FiTrash2 size={16} /> {isSaving ? 'Excluindo...' : 'Excluir Lista'}
              </button>
            </div>
          </div>
        </div>

        {/* Campos da lista */}
        <div className="space-y-4 mb-8">
          <input
            value={title}
            onChange={e => setTitle(e.target.value)}
            onBlur={() => saveList({ title })}
            placeholder="Título da lista *"
            className="w-full border border-indigo-500/30 bg-[#24243e] px-4 py-3 rounded-lg text-lg placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
          />
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            onBlur={() => saveList({ description })}
            placeholder="Descrição da lista"
            className="w-full border border-indigo-500/30 bg-[#24243e] px-4 py-3 rounded-lg resize-y placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
            rows={3}
          />
          <div>
            <label className="block mb-2 text-sm font-medium text-gray-300">Categoria:</label>
            <select
              value={category}
              onChange={e => setCategory(e.target.value)}
              onBlur={() => saveList({ category })}
              className="w-full border border-indigo-500/30 bg-[#24243e] rounded-lg px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
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
        <div className='space-y-6 mb-8'>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <FiPlus className="text-emerald-400" />
              Termos ({terms.length})
              {perfectTermsCount > 0 && (
                <span className="text-sm font-normal text-yellow-400 bg-yellow-900/30 px-2 py-1 rounded-full">
                  {perfectTermsCount} perfeito(s)
                </span>
              )}
            </h2>

            {/* Botões - aparecem abaixo em mobile */}
            <div className="flex flex-col xs:flex-row gap-2">
              {/* Botão de excluir termos perfeitos */}
              <button
                onClick={removePerfectTerms}
                disabled={isSaving || !perfectTermsCount}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-yellow-600 hover:bg-yellow-500 text-white rounded-lg transition-colors disabled:opacity-50"
                title="Excluir termos já dominados (status perfeito)"
              >
                <FiTrash2 size={16} />
                Limpar Perfeitos
              </button>

              {terms.length > 1 && (
                <button
                  onClick={() => setIsReorderModalOpen(true)}
                  className="flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors"
                >
                  <FiMove size={16} />
                  Reordenar
                </button>
              )}
            </div>
          </div>

          {terms.map((term, i) => (
            <ExistingTermCard
              key={i}
              term={term}
              index={i}
              onTermChange={handleTermChange}
              onTermBlur={handleTermBlur}
              onImageUpload={handleImageUpload}
              onRemoveImage={handleRemoveImage}
              onRemoveTerm={removeTerm}
            />
          ))}
        </div>

        {/* Novo termo */}
        <NewTermForm
          newTerm={newTerm}
          setNewTerm={setNewTerm}
          tempImages={tempImages}
          onAddTerm={addTerm}
          isSaving={isSaving}
        />
      </div>

      {/* Botões de navegação fixos */}
      <div className="fixed bottom-6 right-6 flex flex-col gap-3 z-40">
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="p-3 bg-indigo-600 opacity-60 hover:opacity-100 hover:bg-indigo-500 text-white rounded-full shadow-lg transition-all transform hover:scale-105"
          title="Voltar ao topo"
        >
          <FiChevronUp size={20} />
        </button>
        <button
          onClick={() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })}
          className="p-3 bg-indigo-600 opacity-60 hover:opacity-100 hover:bg-indigo-500 text-white rounded-full shadow-lg transition-all transform hover:scale-105"
          title="Ir para o final"
        >
          <FiChevronDown size={20} />
        </button>
      </div>

      {uploadingImage && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-[#24243e] p-6 rounded-xl border border-indigo-500/30">
            <LoadingSpinner message="Enviando imagem..." />
          </div>
        </div>
      )}

      <ReorderTermsModal
        isOpen={isReorderModalOpen}
        onClose={() => setIsReorderModalOpen(false)}
        terms={terms}
        onReorder={handleReorderTerms}
      />
      <BulkAddTermsModal
        isOpen={isBulkAddModalOpen}
        onClose={() => setIsBulkAddModalOpen(false)}
        onAddTerms={handleBulkAddTerms}
        existingTermsCount={terms.length}
        maxTerms={LIMITS.TOTAL_TERMS}
      />
    </>
  );
}