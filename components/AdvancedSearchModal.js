// components/AdvancedSearchModal.js
'use client';
import { FiX, FiFilter } from 'react-icons/fi';
import { useState } from 'react';
import { LIMITS } from '@/lib/utils';
import * as Slider from '@radix-ui/react-slider';

export default function AdvancedSearchModal({
  isOpen,
  onClose,
  filters,
  onFiltersChange,
  onApplyFilters
}) {
  const [localFilters, setLocalFilters] = useState(filters);

  const handleProgressChange = (values) => {
    setLocalFilters(prev => ({
      ...prev,
      minProgress: values[0],
      maxProgress: values[1]
    }));
  };

  const handleTermsChange = (values) => {
    setLocalFilters(prev => ({
      ...prev,
      minTerms: values[0],
      maxTerms: values[1]
    }));
  };

  const handleApprovalRateChange = (values) => {
    setLocalFilters(prev => ({
      ...prev,
      minApprovalRate: values[0]
    }));
  };

  const handleApply = () => {
    onFiltersChange(localFilters);
    onApplyFilters();
    onClose();
  };

  const handleReset = () => {
    const resetFilters = {
      minProgress: 0,
      maxProgress: 100,
      minTerms: 0,
      maxTerms: LIMITS.TOTAL_TERMS,
      minLikes: 0,
      minApprovalRate: 0
    };
    setLocalFilters(resetFilters);
    onFiltersChange(resetFilters);
    onApplyFilters();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-[#24243e] p-6 rounded-xl border border-indigo-500/30 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-[--primary-text] flex items-center gap-2">
            <FiFilter className="text-indigo-400" />
            Configurações de Busca Avançada
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors p-1 rounded-full hover:bg-gray-700"
          >
            <FiX size={24} />
          </button>
        </div>

        <div className="space-y-6">


          {/* Número de Termos */}
          <div className="p-4 bg-[#2d2b55] rounded-lg border border-indigo-500/20">
            <label className="block mb-3 text-sm font-medium text-gray-300">
              Número de Termos: {localFilters.minTerms} - {localFilters.maxTerms}
            </label>

            <Slider.Root
              className="relative flex items-center select-none touch-none w-full h-5"
              value={[localFilters.minTerms, localFilters.maxTerms]}
              onValueChange={handleTermsChange}
              min={0}
              max={LIMITS.TOTAL_TERMS}
              step={1}
              minStepsBetweenThumbs={1}
            >
              <Slider.Track className="bg-gray-700 relative grow rounded-full h-2">
                <Slider.Range className="absolute bg-indigo-500 rounded-full h-full" />
              </Slider.Track>
              <Slider.Thumb className="block w-4 h-4 bg-white border-2 border-indigo-500 rounded-full shadow-lg hover:bg-indigo-100 focus:outline-none focus:ring-2 focus:ring-indigo-400" />
              <Slider.Thumb className="block w-4 h-4 bg-white border-2 border-indigo-500 rounded-full shadow-lg hover:bg-indigo-100 focus:outline-none focus:ring-2 focus:ring-indigo-400" />
            </Slider.Root>

            <div className="flex justify-between text-xs text-gray-400 mt-2">
              <span>0</span>
              <span>{LIMITS.TOTAL_TERMS}</span>
            </div>
          </div>
          {/* Progresso Mínimo e Máximo */}
          <div className="p-4 bg-[#2d2b55] rounded-lg border border-indigo-500/20">
            <label className="block mb-3 text-sm font-medium text-gray-300">
              Progresso: {localFilters.minProgress}% - {localFilters.maxProgress}%
            </label>

            <Slider.Root
              className="relative flex items-center select-none touch-none w-full h-5"
              value={[localFilters.minProgress, localFilters.maxProgress]}
              onValueChange={handleProgressChange}
              min={0}
              max={100}
              step={1}
              minStepsBetweenThumbs={1}
            >
              <Slider.Track className="bg-gray-700 relative grow rounded-full h-2">
                <Slider.Range className="absolute bg-indigo-500 rounded-full h-full" />
              </Slider.Track>
              <Slider.Thumb className="block w-4 h-4 bg-white border-2 border-indigo-500 rounded-full shadow-lg hover:bg-indigo-100 focus:outline-none focus:ring-2 focus:ring-indigo-400" />
              <Slider.Thumb className="block w-4 h-4 bg-white border-2 border-indigo-500 rounded-full shadow-lg hover:bg-indigo-100 focus:outline-none focus:ring-2 focus:ring-indigo-400" />
            </Slider.Root>

            <div className="flex justify-between text-xs text-gray-400 mt-2">
              <span>0%</span>
              <span>100%</span>
            </div>
          </div>
          {/* Mínimo de Likes */}
          <div className="p-4 bg-[#2d2b55] rounded-lg border border-indigo-500/20">
            <label className="block mb-2 text-sm font-medium text-gray-300">
              Mínimo de Likes: {localFilters.minLikes}
            </label>
            <input
              type="number"
              min="0"
              value={localFilters.minLikes}
              onChange={(e) => setLocalFilters(prev => ({
                ...prev,
                minLikes: parseInt(e.target.value) || 0
              }))}
              className="w-full border border-indigo-500/30 bg-[#24243e] text-[--primary-text] px-4 py-2 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
            />
          </div>
          {/* Taxa de Aprovação Mínima */}
          <div className="p-4 bg-[#2d2b55] rounded-lg border border-indigo-500/20">
            <label className="block mb-3 text-sm font-medium text-gray-300">
              Taxa de Aprovação Mínima: {localFilters.minApprovalRate}%
            </label>

            <Slider.Root
              className="relative flex items-center select-none touch-none w-full h-5"
              value={[localFilters.minApprovalRate]}
              onValueChange={handleApprovalRateChange}
              min={0}
              max={100}
              step={1}
            >
              <Slider.Track className="bg-gray-700 relative grow rounded-full h-2">
                <Slider.Range className="absolute bg-indigo-500 rounded-full h-full" />
              </Slider.Track>
              <Slider.Thumb className="block w-4 h-4 bg-white border-2 border-indigo-500 rounded-full shadow-lg hover:bg-indigo-100 focus:outline-none focus:ring-2 focus:ring-indigo-400" />
            </Slider.Root>

            <div className="flex justify-between text-xs text-gray-400 mt-2">
              <span>0%</span>
              <span>100%</span>
            </div>
          </div>

        </div>

        <div className="flex justify-end gap-3 pt-6 mt-6 border-t border-indigo-500/20">
          <button
            onClick={handleReset}
            className="px-4 py-2 text-gray-300 hover:text-white transition-colors hover:bg-gray-700 rounded-lg"
          >
            Limpar Filtros
          </button>
          <button
            onClick={handleApply}
            className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg transition-colors font-medium"
          >
            Aplicar Filtros
          </button>
        </div>
      </div>
    </div>
  );
}