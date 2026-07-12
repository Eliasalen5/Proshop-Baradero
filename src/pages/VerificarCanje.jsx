import { useParams } from 'react-router-dom'

export default function VerificarCanje() {
  const { code } = useParams()

  return (
    <div className="max-w-md mx-auto px-4 py-20 text-center">
      <div className="bg-gray-900 border border-yellow-600/30 rounded-2xl p-8">
        <div className="text-club-yellow text-5xl mb-4">✓</div>
        <h1 className="text-white text-xl font-bold mb-2">Código de canje</h1>
        <p className="text-4xl font-bold tracking-widest text-club-yellow mb-4">{code}</p>
        <p className="text-gray-400 text-sm mb-6">
          Ingresá este código en el panel de administración para confirmar el canje.
        </p>
        <a href="/admin/users" className="inline-block bg-club-yellow text-black font-semibold px-6 py-2 rounded hover:bg-yellow-400 transition">
          Ir al panel admin
        </a>
      </div>
    </div>
  )
}
