// components/Header.js
'use client'

import Link from 'next/link'
import useUserStore from '@/store/useUserStore'
import Avatar from './Avatar'
import { FiBook, FiLogOut, FiPlus } from 'react-icons/fi'

export default function Header() {
  const { user, logout } = useUserStore()

  return (
    <header className="w-full px-6 py-4 bg-[#24243e] text-[var(--primary-text)] border-b border-indigo-500/20 shadow-lg flex justify-between items-center">
      <Link href="/" className="text-xl font-semibold hover:text-indigo-400 transition-colors flex items-center gap-2">
        <FiBook className="w-6 h-6 text-indigo-400" />
        ememora
      </Link>
      
      <nav className="space-x-4 flex items-center">
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
            
            <button 
              onClick={logout} 
              className="px-3 py-2 bg-[#2d2b55] hover:bg-red-500/20 text-red-400 hover:text-red-300 rounded-lg border border-red-500/30 transition-colors font-medium flex items-center gap-2 ml-2"
            >
              <FiLogOut className="w-4 h-4" />
              Sair
            </button>
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
  )
}
