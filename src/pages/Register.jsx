import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Register() {
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [documento, setDocumento] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const { register } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres')
      return
    }
    try {
      await register(email, password, name, phone, documento)
      navigate('/')
    } catch (err) {
      if (err.code === 'auth/email-already-in-use') {
        setError('Este email ya está registrado')
      } else {
        setError('Error al registrarse. Intentá de nuevo.')
      }
    }
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="bg-gray-900 p-8 rounded-lg w-full max-w-md border border-gray-800">
        <h1 className="text-2xl font-bold text-club-yellow text-center mb-6">Registrarse</h1>
        {error && (
          <p className="bg-red-900/50 text-red-300 p-3 rounded mb-4 text-sm">{error}</p>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="reg-name" className="block text-gray-400 text-sm mb-1">Nombre</label>
            <input
              id="reg-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white focus:outline-none focus:border-club-yellow"
              required
            />
          </div>
          <div>
            <label htmlFor="reg-phone" className="block text-gray-400 text-sm mb-1">Teléfono</label>
            <input
              id="reg-phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white focus:outline-none focus:border-club-yellow"
              placeholder="+54 11 1234-5678"
            />
          </div>
          <div>
            <label htmlFor="reg-doc" className="block text-gray-400 text-sm mb-1">Documento</label>
            <input
              id="reg-doc"
              type="text"
              value={documento}
              onChange={(e) => setDocumento(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white focus:outline-none focus:border-club-yellow"
              placeholder="DNI / Pasaporte"
              required
            />
          </div>
          <div>
            <label htmlFor="reg-email" className="block text-gray-400 text-sm mb-1">Email</label>
            <input
              id="reg-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white focus:outline-none focus:border-club-yellow"
              required
            />
          </div>
          <div>
            <label htmlFor="reg-password" className="block text-gray-400 text-sm mb-1">Contraseña</label>
            <input
              id="reg-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white focus:outline-none focus:border-club-yellow"
              required
              minLength={6}
            />
          </div>
          <button
            type="submit"
            className="w-full bg-club-yellow text-black font-bold py-2 rounded hover:bg-yellow-400 transition"
          >
            Registrarse
          </button>
        </form>
        <p className="mt-4 text-center text-sm text-gray-400">
          ¿Ya tenés cuenta?{' '}
          <Link to="/login" className="text-club-yellow hover:underline">
            Ingresá
          </Link>
        </p>
      </div>
    </div>
  )
}
