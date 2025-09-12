
// app/layout.js
import './globals.css'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import AuthProvider from '@/app/AuthProvider'
import { Toaster } from 'react-hot-toast'
import { Suspense } from 'react'

export const metadata = {
  title: 'ememora',
  description: 'Estude termos com flashcards e quizzes.',
  icons: {
    icon: '/favicon.png'
  }
}

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <body className="flex flex-col min-h-screen">
        <AuthProvider>

          <Suspense fallback={
            <header className="w-full px-6 py-4 bg-[#24243e] border-b border-indigo-500/20 animate-pulse">
              <div className="flex justify-between items-center">
                <div className="h-8 w-32 bg-[#2d2b55] rounded"></div>
                <div className="h-10 w-64 bg-[#2d2b55] rounded"></div>
                <div className="h-10 w-32 bg-[#2d2b55] rounded"></div>
              </div>
            </header>
          }>
            <Header />
          </Suspense>

          <Toaster position="top-center" />
          <main className="flex-grow">{children}</main>
          <Footer />
        </AuthProvider>
      </body>
    </html>
  )
}