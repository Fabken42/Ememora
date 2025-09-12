
// app/layout.js
import './globals.css'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import AuthProvider from '@/app/AuthProvider'
import { Toaster } from 'react-hot-toast'

export const metadata = {
  title: 'ememora',
  description: 'Estude termos com flashcards e quizzes.',
  icons:{
    icon: '/favicon.png'
  }
}

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <body className="flex flex-col min-h-screen">
          <AuthProvider>
            <Header />
            <Toaster position="top-center" />
            <main className="flex-grow">{children}</main>
            <Footer />
          </AuthProvider>
      </body>
    </html>
  )
}