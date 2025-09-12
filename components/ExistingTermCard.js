'use client';

import { FiTrash2, FiImage } from 'react-icons/fi';
import ImageUploadField from './ImageUploadField';
import { getStatusInfo } from '@/lib/utils';

export default function ExistingTermCard({
  term,
  index,
  onTermChange,
  onTermBlur,
  onImageUpload,
  onRemoveImage,
  onRemoveTerm
}) {
  // Obter informações do status
  const { StatusIcon, color } = getStatusInfo(term?.status || 0);

  return (
    <div className="border border-indigo-500/20 p-6 rounded-xl space-y-4 bg-[#24243e] shadow-lg transition-all hover:border-indigo-500/40 relative">
      {/* Número do termo */}
      <div className="absolute -top-2 -left-2 w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center text-white font-medium text-sm">
        {index + 1}
      </div>
      
      {/* Ícone de status */}
      <div className="absolute -top-2 -right-2 w-8 h-8 bg-indigo-900 rounded-full flex items-center justify-center">
        <StatusIcon className={`text-3xl ${color}`} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block mb-2 text-sm font-medium text-gray-300">Termo *</label>
          <textarea
            value={term.term}
            onChange={e => onTermChange(index, 'term', e.target.value)}
            onBlur={onTermBlur}
            placeholder="Digite o termo"
            className="w-full border border-indigo-500/30 bg-[#2d2b55] text-[--primary-text] px-4 py-3 rounded-lg resize-y placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
            rows={3}
          />
        </div>
        <div>
          <label className="block mb-2 text-sm font-medium text-gray-300">Definição *</label>
          <textarea
            value={term.definition}
            onChange={e => onTermChange(index, 'definition', e.target.value)}
            onBlur={onTermBlur}
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
          onChange={e => onTermChange(index, 'hint', e.target.value)}
          onBlur={onTermBlur}
          placeholder="Dica para ajudar a lembrar"
          className="w-full border border-indigo-500/30 bg-[#2d2b55] text-[--primary-text] px-4 py-3 rounded-lg placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
        />
      </div>

      {/* Imagens do termo existente */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <ImageUploadField
          label="Imagem do termo"
          icon={<FiImage className="text-blue-400" />}
          image={term.termImage}
          onUpload={(file) => onImageUpload(file, index, 'termImage')}
          onRemove={() => onRemoveImage(index, 'termImage')}
          inputId={`term-image-${index}`}
        />

        <ImageUploadField
          label="Imagem da definição"
          icon={<FiImage className="text-green-400" />}
          image={term.definitionImage}
          onUpload={(file) => onImageUpload(file, index, 'definitionImage')}
          onRemove={() => onRemoveImage(index, 'definitionImage')}
          inputId={`definition-image-${index}`}
        />
      </div>

      <div className="flex justify-end pt-2">
        <button
          onClick={() => onRemoveTerm(index)}
          className="text-red-400 hover:text-red-300 flex items-center gap-2 text-sm font-medium transition-colors"
        >
          <FiTrash2 /> Excluir termo
        </button>
      </div>
    </div>
  );
}