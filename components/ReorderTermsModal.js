// components/ReorderTermsModal.js (versão melhorada)
import { FiX, FiMove } from 'react-icons/fi';
import { useState, useEffect } from 'react';
import { getStatusInfo } from '@/lib/utils';

export default function ReorderTermsModal({
    isOpen,
    onClose,
    terms,
    onReorder
}) {
    const [localTerms, setLocalTerms] = useState([]);
    const [draggedIndex, setDraggedIndex] = useState(null);
    const [dragOverIndex, setDragOverIndex] = useState(null);

    useEffect(() => {
        if (isOpen) {
            setLocalTerms([...terms]);
        }
    }, [isOpen, terms]);

    const handleDragStart = (e, index) => {
        e.dataTransfer.setData('text/plain', index.toString());
        setDraggedIndex(index);
        e.currentTarget.classList.add('dragging');
    };

    const handleDragOver = (e, index) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        setDragOverIndex(index);
    };

    const handleDragLeave = () => {
        setDragOverIndex(null);
    };

    const handleDrop = (e, targetIndex) => {
        e.preventDefault();
        const sourceIndex = parseInt(e.dataTransfer.getData('text/plain'));

        if (sourceIndex === targetIndex) {
            setDragOverIndex(null);
            setDraggedIndex(null);
            return;
        }

        const newTerms = [...localTerms];
        const [movedItem] = newTerms.splice(sourceIndex, 1);
        newTerms.splice(targetIndex, 0, movedItem);

        setLocalTerms(newTerms);
        setDragOverIndex(null);
        setDraggedIndex(null);
    };

    const handleDragEnd = () => {
        setDragOverIndex(null);
        setDraggedIndex(null);
    };

    const handleSave = () => {
        onReorder(localTerms);
        onClose();
    };

    if (!isOpen) return null;

    return (
  <>
    <BackButton listId={id} />
    <div className="max-w-2xl mx-auto p-6">
      {/* Cabeçalho com título e botões */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">Editar Lista</h1>
        <div className="flex items-center gap-2">
          {/* Botão de adicionar em massa - MOVIDO PARA CÁ */}
          <button
            onClick={() => setIsBulkAddModalOpen(true)}
            disabled={terms.length >= LIMITS.TOTAL_TERMS}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-500 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors text-sm"
            title="Adicionar múltiplos termos de uma vez"
          >
            <FiFileText size={16} />
            Adicionar em Massa
          </button>

          {/* Botão de excluir lista */}
          <button
            onClick={handleDelete}
            disabled={isSaving}
            className="bg-red-600 hover:bg-red-500 text-white py-2 px-4 rounded-lg disabled:opacity-50 flex items-center gap-2 font-medium transition-colors text-sm"
          >
            <FiTrash2 size={16} /> {isSaving ? 'Excluindo...' : 'Excluir Lista'}
          </button>
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
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <FiPlus className="text-emerald-400" />
            Termos ({terms.length})
            {perfectTermsCount > 0 && (
              <span className="text-sm font-normal text-yellow-400 bg-yellow-900/30 px-2 py-1 rounded-full">
                {perfectTermsCount} perfeito(s)
              </span>
            )}
          </h2>

          <div className="flex items-center gap-2">
            {/* Botão de excluir termos perfeitos */}
            <button
              onClick={removePerfectTerms}
              disabled={isSaving || !perfectTermsCount}
              className="flex items-center gap-2 px-4 py-2 bg-yellow-600 hover:bg-yellow-500 text-white rounded-lg transition-colors disabled:opacity-50"
              title="Excluir termos já dominados (status perfeito)"
            >
              <FiTrash2 size={16} />
              Limpar Perfeitos
            </button>

            {terms.length > 1 && (
              <button
                onClick={() => setIsReorderModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors"
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