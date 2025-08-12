// components/Header.js
'use client'

import Link from 'next/link'
import useUserStore from '@/store/useUserStore'

export default function Header() {
  const { user, logout } = useUserStore()

  return (
    <header className="w-full px-6 py-4 bg-white shadow-md flex justify-between items-center">
      <Link href="/" className="text-xl font-semibold">ememora</Link>
      <nav className="space-x-4 flex items-center">
        {user ? (
          <>
            <Link href="/lists/new">Nova Lista</Link>
            <Link href={`/users/${user.uid}`}>
              <img
                src={user?.image || '/default-avatar.png'}
                alt="avatar"
                width={32}
                height={32}
                className="rounded-full border border-gray-300"
              />
            </Link>
            <button onClick={logout} className="text-red-500 ml-2">Sair</button>
          </>
        ) : (
          <>
            <Link href="/login">Entrar</Link>
            <Link href="/register">Registrar</Link>
          </>
        )}
      </nav>
    </header>
  )
}
