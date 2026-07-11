import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function ResetPassword() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const { resetPassword } = useAuth()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    try {
      await resetPassword(email)
      setSent(true)
    } catch {
      setError('Error al enviar el email. Verificá que sea correcto.')
    }
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="bg-gray-900 p-8 rounded-lg w-full max-w-md border border-gray-800">
        <h1 className="text-2xl font-bold text-club-yellow text-center mb-6">Restablecer contraseña</h1>
        {sent ? (
          <div className="text-center">
            <p className="text-green-400 mb-4">
              Te enviamos un email para restablecer tu contraseña.
            </p>
            <Link to="/login" className="text-club-yellow hover:underline">
              Volver al inicio de sesión
            </Link>
          </div>
        ) : (
          <>
            {error && (
              <p className="bg-red-900/50 text-red-300 p-3 rounded mb-4 text-sm">{error}</p>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-gray-400 text-sm mb-1">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white focus:outline-none focus:border-club-yellow"
                  required
                />
              </div>
              <button
                type="submit"
                className="w-full bg-club-yellow text-black font-bold py-2 rounded hover:bg-yellow-400 transition"
              >
                Enviar
              </button>
            </form>
            <p className="mt-4 text-center text-sm text-gray-400">
              <Link to="/login" className="text-club-yellow hover:underline">
                Volver
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  )
}
