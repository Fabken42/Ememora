
// components/Footer.js
export default function Footer() {
  return (
    <footer className="w-full px-6 py-4 text-center text-sm text-gray-400 bg-[#24243e] border-t border-indigo-500/20 mt-10">
      © {new Date().getFullYear()} ememora. Todos os direitos reservados.
    </footer>
  )
}