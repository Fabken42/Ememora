// components/BackButton.js
'use client';
import { useRouter, usePathname } from 'next/navigation';
import useNavigationStore from '@/store/useNavigationStore';
import { FiArrowLeft } from 'react-icons/fi';

export default function BackButton({ listId = null }) {
  const router = useRouter();
  const pathname = usePathname();
  const lastHomeOrUserPage = useNavigationStore(state => state.lastHomeOrUserPage);

  const handleBack = () => {
    // Prioridade 1: Se listId foi passado como prop, redireciona para a página da lista
    if (listId) {
      router.push(`/lists/${listId}`);
      return;
    }

    // Prioridade 2: Se está em páginas de estudo, volta para a página anterior
    if (
      pathname.match(/^\/study\/[^/]+\/flashcard$/) ||
      pathname.match(/^\/study\/[^/]+\/quiz$/)
    ) {
      router.back();
      return;
    }

    // Prioridade 3: Redireciona para a última página home/user salva
    router.push(lastHomeOrUserPage);
  };

  return (
    <button
      onClick={handleBack}
      className="m-4 bg-[#2d2b55] hover:bg-[#3a3780] text-gray-200 px-4 py-2 rounded-lg border border-indigo-500/30 shadow-sm transition-colors flex items-center gap-2 font-medium"
    >
      <FiArrowLeft className="w-4 h-4" />
      Voltar
    </button>
  );
}