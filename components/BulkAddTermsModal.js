'use client';

import { useState } from 'react';
import { FiX, FiHelpCircle } from 'react-icons/fi';

export default function BulkAddTermsModal({ isOpen, onClose, onAddTerms, existingTermsCount, maxTerms }) {
  const [text, setText] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  if (!isOpen) return null;

  const parseText = () => {
    const lines = text.split('\n').filter(line => line.trim());
    const newTerms = [];

    for (const line of lines) {
      const parts = line.split(';').map(part => part.trim());
      
      if (parts.length >= 2) {
        newTerms.push({
          term: parts[0],
          definition: parts[1],
          hint: parts[2] || '',
          termImage: '',
          definitionImage: ''
        });
      }
    }

    return newTerms;
  };

  const handleSubmit = async () => {
    if (!text.trim()) {
      alert('Digite pelo menos um termo');
      return;
    }

    const newTerms = parseText();
    
    if (newTerms.length === 0) {
      alert('Formato inválido. Use: termo;definição;dica(opcional)');
      return;
    }

    if (existingTermsCount + newTerms.length > maxTerms) {
      alert(`Limite máximo de ${maxTerms} termos atingido. Você pode adicionar no máximo ${maxTerms - existingTermsCount} termos.`);
      return;
    }

    setIsAdding(true);
    try {
      await onAddTerms(newTerms);
      setText('');
      onClose();
    } catch (error) {
      console.error('Erro ao adicionar termos:', error);
      alert('Erro ao adicionar termos');
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-[#24243e] p-6 rounded-xl border border-indigo-500/30 w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Adicionar Múltiplos Termos</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <FiX size={24} />
          </button>
        </div>

        <div className="mb-4 p-3 bg-indigo-900/30 rounded-lg">
          <div className="flex items-start gap-2 text-sm text-indigo-200">
            <FiHelpCircle className="mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium">Formato:</p>
              <p>termo;definição;dica(opcional)</p>
              <p className="text-xs mt-1 text-indigo-300">
                Exemplo: <code className="bg-indigo-800/50 px-1 rounded">apple;maçã;fruta vermelha</code>
              </p>
              <p className="text-xs mt-1">Cada linha será um termo diferente.</p>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-hidden flex flex-col">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Digite os termos no formato:&#10;termo1;definição1;dica1&#10;termo2;definição2;dica2&#10;termo3;definição3"
            className="flex-1 w-full border border-indigo-500/30 bg-[#2d2b55] text-white px-4 py-3 rounded-lg resize-none placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all font-mono text-sm"
            rows={10}
          />
        </div>

        <div className="flex justify-between items-center pt-4 mt-4 border-t border-indigo-500/20">
          <span className="text-sm text-gray-400">
            {parseText().length} termo(s) detectado(s)
          </span>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-300 hover:text-white transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleSubmit}
              disabled={isAdding || !text.trim()}
              className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg transition-colors"
            >
              {isAdding ? 'Adicionando...' : `Adicionar ${parseText().length} termo(s)`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}