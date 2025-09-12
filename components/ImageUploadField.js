// components/ImageUploadField.js
'use client';

import { FiUpload, FiX, FiTrash2 } from 'react-icons/fi';

export default function ImageUploadField({
  label,
  icon,
  image,
  onUpload,
  onRemove,
  inputId,
  isTemp = false,
  disabled = false
}) {
  return (
    <div>
      <label className="block mb-2 text-sm font-medium flex items-center gap-2 text-gray-300">
        {icon}
        {label}
      </label>
      {image ? (
        <div className="flex items-center gap-3 p-3 border border-indigo-500/30 rounded-lg bg-[#2d2b55]">
          <img src={image} alt="" className="w-16 h-16 object-cover rounded" />
          <button
            onClick={onRemove}
            className="text-red-400 hover:text-red-300 flex items-center gap-1 text-sm transition-colors"
            disabled={disabled}
          >
            {isTemp ? <FiX /> : <FiTrash2 />} Remover
          </button>
        </div>
      ) : (
        <div className={`border-2 border-dashed rounded-lg p-4 text-center transition-colors ${disabled
          ? 'border-gray-600 bg-gray-800/50 cursor-not-allowed'
          : 'border-indigo-500/30 hover:border-indigo-500/50 bg-[#2d2b55] cursor-pointer'
          }`}>
          <input
            type="file"
            accept="image/*"
            onChange={e => !disabled && onUpload(e.target.files[0])}
            className="hidden"
            id={inputId}
            disabled={disabled}
          />
          <label
            htmlFor={inputId}
            className={`flex flex-col items-center transition-colors ${disabled
              ? 'text-gray-600 cursor-not-allowed'
              : 'text-gray-400 hover:text-gray-300 cursor-pointer'
              }`}
          >
            {disabled ? (
              <span className="text-sm">Adicione após criar o termo</span>
            ) : (
              <>
                <FiUpload className="w-6 h-6 mb-2" />
                <span className="text-sm">Selecionar imagem</span>
              </>
            )}
          </label>
        </div>
      )}
    </div>
  );
}