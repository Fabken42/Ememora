// components/Header.js
'use client';
import { FiBook, FiPlus, FiSearch, FiX } from 'react-icons/fi';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Avatar from './Avatar';
import { useState, useEffect } from 'react';
import useUserStore from '@/store/useUserStore';
import { Suspense } from 'react';

// Componente separado para a barra de pesquisa que usa useSearchParams
function SearchBar() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  const handleSearch = (e) => {
    e.preventDefault();
    const trimmedQuery = searchQuery.trim();

    if (trimmedQuery) {
      router.push(`/?search=${encodeURIComponent(trimmedQuery)}`);
    } else {
      router.push('/');
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
    router.push('/');
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch(e);
    }
  };

  return (
    <form onSubmit={handleSearch} className="relative w-full max-w-md">
      <div className={`relative flex items-center border rounded-lg transition-all duration-200 ${isSearchFocused
          ? 'border-indigo-500 ring-2 ring-indigo-500/20'
          : 'border-indigo-500/30 hover:border-indigo-500/50'
        } bg-[#2d2b55]`}>
        <FiSearch className="absolute left-3 text-gray-400 w-4 h-4" />

        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyPress={handleKeyPress}
          onFocus={() => setIsSearchFocused(true)}
          onBlur={() => setIsSearchFocused(false)}
          placeholder="Buscar listas por título..."
          className="w-full bg-transparent pl-10 pr-20 py-2 text-[--primary-text] placeholder-gray-400 outline-none"
        />

        {searchQuery && (
          <button
            type="button"
            onClick={clearSearch}
            className="absolute right-12 text-gray-400 hover:text-gray-300 transition-colors p-1"
          >
            <FiX className="w-4 h-4" />
          </button>
        )}

        <button
          type="submit"
          className="absolute right-0 h-full px-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-r-lg transition-colors flex items-center justify-center"
        >
          <FiSearch className="w-4 h-4" />
        </button>
      </div>
    </form>
  );
}

// Componente principal do Header sem useSearchParams
function HeaderContent() {
  const { user } = useUserStore();
  const router = useRouter();

  return (
    <header className="w-full px-6 py-4 bg-[#24243e] text-[var(--primary-text)] border-b border-indigo-500/20 shadow-lg flex justify-between items-center">
      {/* Logo à esquerda */}
      <Link href="/" className="text-xl font-semibold hover:text-indigo-400 transition-colors flex items-center gap-2 shrink-0">
        <FiBook className="w-6 h-6 text-indigo-400" />
        ememora
      </Link>

      {/* Barra de pesquisa - Centralizada */}
      <div className="flex-1 flex justify-center max-w-2xl mx-8">
        <Suspense fallback={
          <div className="relative w-full max-w-md">
            <div className="relative flex items-center border rounded-lg border-indigo-500/30 bg-[#2d2b55]">
              <FiSearch className="absolute left-3 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Buscar listas por título..."
                className="w-full bg-transparent pl-10 pr-20 py-2 text-gray-400 placeholder-gray-400 outline-none"
                disabled
              />
            </div>
          </div>
        }>
          <SearchBar />
        </Suspense>
      </div>

      {/* Navegação à direita */}
      <nav className="space-x-4 flex items-center shrink-0">
        {user ? (
          <>
            <Link
              href="/lists/new"
              className="px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors font-medium flex items-center gap-2"
            >
              <FiPlus className="w-4 h-4" />
              Nova Lista
            </Link>

            <Link
              href={`/users/${user.uid}`}
              className="p-1 hover:bg-[#2d2b55] rounded-full transition-colors"
            >
              <Avatar
                src={user?.image}
                alt="Avatar"
                size={36}
                className="border-2 border-indigo-500/30 hover:border-indigo-400 transition-colors"
              />
            </Link>
          </>
        ) : (
          <>
            <Link
              href="/login"
              className="px-3 py-2 bg-[#2d2b55] hover:bg-indigo-500/20 text-indigo-400 hover:text-indigo-300 rounded-lg border border-indigo-500/30 transition-colors font-medium"
            >
              Entrar
            </Link>
            <Link
              href="/register"
              className="px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors font-medium"
            >
              Registrar
            </Link>
          </>
        )}
      </nav>
    </header>
  );
}

// Componente principal exportado
export default function Header() {
  return <HeaderContent />;
}