import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const ATTEMPT_KEY = 'proshop_login_attempts'
const MAX_ATTEMPTS = 5
const LOCKOUT_MINUTES = 15

function getAttempts() {
  try {
    const data = JSON.parse(localStorage.getItem(ATTEMPT_KEY) || '{}')
    if (data.resetAt && Date.now() > data.resetAt) return { count: 0 }
    return data
  } catch { return { count: 0 } }
}

function recordAttempt() {
  const data = getAttempts()
  data.count = (data.count || 0) + 1
  data.resetAt = Date.now() + LOCKOUT_MINUTES * 60 * 1000
  localStorage.setItem(ATTEMPT_KEY, JSON.stringify(data))
}

function clearAttempts() {
  localStorage.removeItem(ATTEMPT_KEY)
}

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [lockoutMins, setLockoutMins] = useState(0)
  const { login } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    const attempts = getAttempts()
    if (attempts.count >= MAX_ATTEMPTS && attempts.resetAt && Date.now() < attempts.resetAt) {
      setLockoutMins(Math.ceil((attempts.resetAt - Date.now()) / 60000))
    }
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    const attempts = getAttempts()
    if (attempts.count >= MAX_ATTEMPTS && attempts.resetAt && Date.now() < attempts.resetAt) {
      const mins = Math.ceil((attempts.resetAt - Date.now()) / 60000)
      setLockoutMins(mins)
      return
    }

    try {
      await login(email, password)
      clearAttempts()
      navigate('/')
    } catch (err) {
      recordAttempt()
      if (err.code === 'auth/too-many-requests') {
        setError('Demasiados intentos. Esperá unos minutos e intentá de nuevo.')
      } else if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password') {
        setError('Email o contraseña incorrectos')
      } else {
        setError('Error al iniciar sesión')
      }
    }
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="bg-gray-900 p-8 rounded-lg w-full max-w-md border border-gray-800">
        <h1 className="text-2xl font-bold text-club-yellow text-center mb-6">Ingresar</h1>
        {lockoutMins > 0 ? (
          <div className="bg-red-900/50 text-red-300 p-4 rounded mb-4 text-sm text-center">
            <p className="font-bold mb-1">Demasiados intentos</p>
            <p>Esperá {lockoutMins} minuto{lockoutMins !== 1 ? 's' : ''} antes de intentar de nuevo.</p>
            <Link to="/reset-password" className="text-club-yellow hover:underline text-sm mt-2 inline-block">
              ¿Olvidaste tu contraseña? Restablecela acá
            </Link>
          </div>
        ) : (
          <>
            {error && (
              <div className="bg-red-900/50 text-red-300 p-3 rounded mb-4 text-sm">{error}</div>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="login-email" className="block text-gray-400 text-sm mb-1">Email</label>
                <input
                  id="login-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white focus:outline-none focus:border-club-yellow"
                  required
                />
              </div>
              <div>
                <label htmlFor="login-password" className="block text-gray-400 text-sm mb-1">Contraseña</label>
                <input
                  id="login-password"
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
          </>
        )}
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
