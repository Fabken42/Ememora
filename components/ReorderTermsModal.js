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
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-[#24243e] p-6 rounded-xl border border-indigo-500/30 w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold text-[--primary-text]">
                        Reordenar Termos
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-white transition-colors"
                    >
                        <FiX size={24} />
                    </button>
                </div>

                <div className="mb-4">
                    <p className="text-sm text-gray-400">
                        Arraste e solte os termos para reordenar. Clique e segure no ícone <FiMove className="inline" /> para arrastar.
                    </p>
                </div>

                <div className="overflow-y-auto flex-1">
                    <div className="space-y-2">
                        {localTerms.map((term, index) => {
                            // Obter informações do status para cada termo
                            const { StatusIcon, color } = getStatusInfo(term?.status || 0);

                            return (
                                <div
                                    key={index}
                                    data-index={index}
                                    draggable
                                    onDragStart={(e) => handleDragStart(e, index)}
                                    onDragOver={(e) => handleDragOver(e, index)}
                                    onDragLeave={handleDragLeave}
                                    onDrop={(e) => handleDrop(e, index)}
                                    onDragEnd={handleDragEnd}
                                    className={`flex items-center gap-3 p-3 rounded-lg border transition-all cursor-move
                      ${draggedIndex === index
                                            ? 'bg-indigo-700 border-indigo-500 opacity-50'
                                            : dragOverIndex === index
                                                ? 'bg-indigo-800 border-indigo-400 border-2'
                                                : 'bg-[#2d2b55] border-indigo-500/20 hover:border-indigo-500/40 hover:bg-[#35336b]'
                                        }`}
                                >
                                    <div className="flex items-center justify-center w-8 h-8 bg-indigo-600 rounded-full text-white font-medium text-sm">
                                        {index + 1}
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium truncate">
                                            {term.term}
                                        </p>
                                        <p className="text-xs text-gray-400 truncate">
                                            {term.definition.substring(0, 50)}
                                            {term.definition.length > 50 && '...'}
                                        </p>
                                    </div>

                                    {/* Ícone de status - lado direito */}
                                    <div className="flex items-center gap-2">
                                        <FiMove
                                            size={18}
                                            className="drag-handle text-gray-400 hover:text-white transition-colors"
                                            title="Arraste para reordenar"
                                        />
                                        <StatusIcon className={`text-2xl ${color}`} />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 mt-4 border-t border-indigo-500/20">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-gray-300 hover:text-white transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleSave}
                        className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg transition-colors"
                    >
                        Salvar Ordem
                    </button>
                </div>
            </div>
        </div>
    );
}