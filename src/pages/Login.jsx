import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    try {
      await login(email, password)
      navigate('/')
    } catch {
      setError('Email o contraseña incorrectos')
    }
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="bg-gray-900 p-8 rounded-lg w-full max-w-md border border-gray-800">
        <h1 className="text-2xl font-bold text-club-yellow text-center mb-6">Ingresar</h1>
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
          <div>
            <label className="block text-gray-400 text-sm mb-1">Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white focus:outline-none focus:border-club-yellow"
              required
            />
          </div>
          <button
            type="submit"
            className="w-full bg-club-yellow text-black font-bold py-2 rounded hover:bg-yellow-400 transition"
          >
            Ingresar
          </button>
        </form>
        <div className="mt-4 text-center text-sm text-gray-400 space-y-2">
          <p>
            <Link to="/reset-password" className="text-club-yellow hover:underline">
              Olvidé mi contraseña
            </Link>
          </p>
          <p>
            ¿No tenés cuenta?{' '}
            <Link to="/register" className="text-club-yellow hover:underline">
              Registrate
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
