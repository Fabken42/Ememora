'use client'

import { FiPlus, FiImage } from 'react-icons/fi'
import ImageUploadField from './ImageUploadField'
import { LIMITS } from '@/lib/utils'

export default function NewTermForm({
  newTerm,
  setNewTerm,
  tempImages,
  onAddTerm,
  isSaving
}) {
  return (
    <div className="border-2 border-dashed border-emerald-500/50 p-6 rounded-xl space-y-4 mb-8 bg-emerald-900/20">
      <h3 className="text-lg font-semibold flex items-center gap-2 text-emerald-300">
        <FiPlus /> Adicionar novo termo
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block mb-2 text-sm font-medium text-gray-300">Termo *</label>
          <input
            value={newTerm.term}
            onChange={e => setNewTerm({ ...newTerm, term: e.target.value })}
            placeholder="Digite o termo"
            className="w-full border border-indigo-500/30 bg-[#2d2b55] px-4 py-3 rounded-lg placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
            style={{ height: 'calc(1.5rem * 3)' }} // 👈 simula 3 linhas
            maxLength={LIMITS.TERM}
          />
        </div>

        <div>
          <label className="block mb-2 text-sm font-medium text-gray-300">Definição *</label>
          <input
            value={newTerm.definition}
            onChange={e => setNewTerm({ ...newTerm, definition: e.target.value })}
            placeholder="Digite a definição"
            className="w-full border border-indigo-500/30 bg-[#2d2b55] px-4 py-3 rounded-lg placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
            style={{ height: 'calc(1.5rem * 3)' }} // 👈 simula 3 linhas
            maxLength={LIMITS.DEFINITION}
          />
        </div>
      </div>

      <div>
        <label className="block mb-2 text-sm font-medium text-gray-300">Dica (opcional)</label>
        <input
          value={newTerm.hint}
          onChange={e => setNewTerm({ ...newTerm, hint: e.target.value })}
          placeholder="Dica para ajudar a lembrar"
          className="w-full border border-indigo-500/30 bg-[#2d2b55] px-4 py-3 rounded-lg placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
          style={{ height: 'calc(1.5rem * 2)' }} // 👈 simula 2 linhas
          maxLength={LIMITS.TIP}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <ImageUploadField
          label="Imagem do termo"
          icon={<FiImage className="text-blue-400" />}
          image={tempImages.termImage?.preview}
          inputId="new-term-image"
          isTemp={true}
          disabled={true}
        />

        <ImageUploadField
          label="Imagem da definição"
          icon={<FiImage className="text-green-400" />}
          image={tempImages.definitionImage?.preview}
          inputId="new-definition-image"
          isTemp={true}
          disabled={true}
        />
      </div>

      <div className="flex justify-end">
        <button
          onClick={onAddTerm}
          disabled={!newTerm.term.trim() || !newTerm.definition.trim() || isSaving}
          className="bg-emerald-600 hover:bg-emerald-500 text-white py-3 px-6 rounded-lg disabled:opacity-50 flex items-center gap-2 font-medium transition-colors"
        >
          <FiPlus /> {isSaving ? 'Adicionando...' : 'Adicionar Termo'}
        </button>
      </div>
    </div>
  )
}
