// app/not-found.js
export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0f0f23]">
      <div className="text-center p-8 bg-[#24243e] rounded-xl border border-indigo-500/30">
        <h1 className="text-6xl font-bold text-indigo-400 mb-4">404</h1>
        <h2 className="text-2xl font-semibold text-white mb-4">Página não encontrada</h2>
        <p className="text-gray-300 mb-6">
          A página que você está procurando não existe.
        </p>
        <a
          href="/"
          className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-lg transition-colors"
        >
          Voltar para o início
        </a>
      </div>
    </div>
  )
}

export const metadata = {
  title: 'Página não encontrada - Ememora',
}