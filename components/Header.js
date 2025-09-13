// components/Header.js
'use client';
import { FiBook, FiPlus, FiSearch, FiX, FiMenu, FiUser } from 'react-icons/fi';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Avatar from './Avatar';
import { useState } from 'react';
import useUserStore from '@/store/useUserStore';
import { Suspense } from 'react';

// Componente separado para a barra de pesquisa
function SearchBar() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);

  const handleSearch = (e) => {
    e.preventDefault();
    const trimmedQuery = searchQuery.trim();

    if (trimmedQuery) {
      router.push(`/?search=${encodeURIComponent(trimmedQuery)}`);
    } else {
      router.push('/');
    }
    setIsMobileSearchOpen(false);
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
    <>
      {/* Botão de pesquisa mobile (aparece apenas em telas pequenas) */}
      <button
        onClick={() => setIsMobileSearchOpen(true)}
        className="md:hidden p-2 text-gray-400 hover:text-white transition-colors"
        aria-label="Abrir pesquisa"
      >
        <FiSearch className="w-5 h-5" />
      </button>

      {/* Overlay para pesquisa mobile */}
      {isMobileSearchOpen && (
        <div className="fixed inset-0 bg-black/80 z-50 md:hidden">
          <div className="bg-[#24243e] p-4">
            <form onSubmit={handleSearch} className="relative">
              <div className="relative flex items-center border rounded-lg border-indigo-500/30 bg-[#2d2b55]">
                <FiSearch className="absolute left-3 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Buscar listas..."
                  className="w-full bg-transparent pl-10 pr-16 py-3 text-white placeholder-gray-400 outline-none"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setIsMobileSearchOpen(false)}
                  className="absolute right-10 text-gray-400 hover:text-white p-2"
                >
                  <FiX className="w-4 h-4" />
                </button>
                <button
                  type="submit"
                  className="absolute right-0 h-full px-3 bg-indigo-600 text-white rounded-r-lg"
                >
                  <FiSearch className="w-4 h-4" />
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Barra de pesquisa desktop (aparece apenas em telas médias/grandes) */}
      <div className="hidden md:flex flex-1 justify-center max-w-2xl mx-4 lg:mx-8">
        <Suspense fallback={
          <div className="relative w-full max-w-md">
            <div className="relative flex items-center border rounded-lg border-indigo-500/30 bg-[#2d2b55]">
              <FiSearch className="absolute left-3 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Buscar listas..."
                className="w-full bg-transparent pl-10 pr-20 py-2 text-gray-400 placeholder-gray-400 outline-none"
                disabled
              />
            </div>
          </div>
        }>
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
                className="w-full bg-transparent pl-10 pr-20 py-2 text-white placeholder-gray-400 outline-none"
              />

              {searchQuery && (
                <button
                  type="button"
                  onClick={clearSearch}
                  className="absolute right-12 text-gray-400 hover:text-white transition-colors p-1"
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
        </Suspense>
      </div>
    </>
  );
}

// Componente principal do Header
function HeaderContent() {
  const { user } = useUserStore();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <>
      <header className="w-full px-4 sm:px-6 py-3 bg-[#24243e] text-white border-b border-indigo-500/20 shadow-lg flex justify-between items-center relative">
        {/* Logo à esquerda */}
        <Link 
          href="/" 
          className="text-lg sm:text-xl font-semibold hover:text-indigo-400 transition-colors flex items-center gap-2 shrink-0"
        >
          <FiBook className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-400" />
          <span className="hidden sm:inline">ememora</span>
        </Link>

        {/* Barra de pesquisa */}
        <SearchBar />

        {/* Menu mobile (hamburger) */}
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="md:hidden p-2 text-gray-400 hover:text-white transition-colors"
          aria-label="Abrir menu"
        >
          <FiMenu className="w-5 h-5" />
        </button>

        {/* Navegação desktop */}
        <nav className="hidden md:flex items-center gap-3 shrink-0">
          {user ? (
            <>
              <Link
                href="/lists/new"
                className="px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors font-medium flex items-center gap-2 text-sm"
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
                className="px-3 py-2 bg-[#2d2b55] hover:bg-indigo-500/20 text-indigo-400 hover:text-indigo-300 rounded-lg border border-indigo-500/30 transition-colors font-medium text-sm"
              >
                Entrar
              </Link>
              <Link
                href="/register"
                className="px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors font-medium text-sm"
              >
                Registrar
              </Link>
            </>
          )}
        </nav>
      </header>

      {/* Menu mobile dropdown */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 bg-black/80 z-40 md:hidden" onClick={() => setIsMobileMenuOpen(false)}>
          <div className="absolute top-16 right-4 bg-[#24243e] border border-indigo-500/30 rounded-lg shadow-lg p-4 min-w-[200px]">
            <div className="flex flex-col gap-3">
              {user ? (
                <>
                  <Link
                    href="/lists/new"
                    className="px-4 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors font-medium flex items-center gap-3"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <FiPlus className="w-5 h-5" />
                    Nova Lista
                  </Link>

                  <Link
                    href={`/users/${user.uid}`}
                    className="px-4 py-3 bg-[#2d2b55] hover:bg-indigo-500/20 text-white rounded-lg transition-colors font-medium flex items-center gap-3"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <FiUser className="w-5 h-5" />
                    Meu Perfil
                  </Link>

                  <div className="border-t border-indigo-500/20 pt-3 mt-3">
                    <Link
                      href={`/users/${user.uid}`}
                      className="flex items-center gap-3 px-4 py-2 text-gray-300 hover:text-white transition-colors"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <Avatar
                        src={user?.image}
                        alt="Avatar"
                        size={32}
                        className="border-2 border-indigo-500/30"
                      />
                      <span>{user.name}</span>
                    </Link>
                  </div>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="px-4 py-3 bg-[#2d2b55] hover:bg-indigo-500/20 text-indigo-400 hover:text-indigo-300 rounded-lg border border-indigo-500/30 transition-colors font-medium flex items-center gap-3"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <FiUser className="w-5 h-5" />
                    Entrar
                  </Link>
                  <Link
                    href="/register"
                    className="px-4 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors font-medium flex items-center gap-3"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <FiPlus className="w-5 h-5" />
                    Registrar
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// Componente principal exportado
export default function Header() {
  return <HeaderContent />;
}