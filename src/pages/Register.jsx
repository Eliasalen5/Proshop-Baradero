import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { sendEmailVerification } from 'firebase/auth'
import { auth } from '../services/firebase'

export default function Register() {
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [documento, setDocumento] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const { register } = useAuth()
  const navigate = useNavigate()
  const [registered, setRegistered] = useState(false)
  const [sending, setSending] = useState(false)

  const validatePassword = (pass) => {
    const errors = []
    if (pass.length < 8) errors.push('Mínimo 8 caracteres')
    if (!/[A-Z]/.test(pass)) errors.push('Al menos una mayúscula')
    if (!/[0-9]/.test(pass)) errors.push('Al menos un número')
    if (!/[!@#$%^&*(),.?":{}|<>_\-]/.test(pass)) errors.push('Al menos un carácter especial')
    return errors
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    const pwdErrors = validatePassword(password)
    if (pwdErrors.length > 0) {
      setError('La contraseña debe tener: ' + pwdErrors.join(', '))
      return
    }
    try {
      const cred = await register(email, password, name, phone, documento)
      await sendEmailVerification(cred.user)
      setRegistered(true)
    } catch (err) {
      if (err.code === 'auth/email-already-in-use') {
        setError('Este email ya está registrado')
      } else {
        setError('Error al registrarse. Intentá de nuevo.')
      }
    }
  }

  const handleResend = async () => {
    setSending(true)
    try {
      await sendEmailVerification(auth.currentUser)
    } catch {}
    setSending(false)
  }

  if (registered) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4">
        <div className="bg-gray-900 p-8 rounded-lg w-full max-w-md border border-gray-800 text-center">
          <div className="text-5xl mb-4">📧</div>
          <h1 className="text-2xl font-bold text-club-yellow mb-4">Verificá tu email</h1>
          <p className="text-gray-400 mb-6">
            Te enviamos un email de verificación a <strong className="text-white">{email}</strong>.
            Hacé clic en el enlace para activar tu cuenta, luego iniciá sesión.
          </p>
          <button
            onClick={handleResend}
            disabled={sending}
            className="text-club-yellow hover:underline text-sm mb-4 block w-full"
          >
            {sending ? 'Enviando...' : 'Reenviar email de verificación'}
          </button>
          <Link
            to="/login"
            className="block w-full bg-club-yellow text-black font-bold py-2 rounded hover:bg-yellow-400 transition"
          >
            Ir a iniciar sesión
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="bg-gray-900 p-8 rounded-lg w-full max-w-md border border-gray-800">
        <h1 className="text-2xl font-bold text-club-yellow text-center mb-6">Registrarse</h1>
        {error && (
          <p className="bg-red-900/50 text-red-300 p-3 rounded mb-4 text-sm whitespace-pre-line">{error}</p>
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
              minLength={8}
            />
            <p className="text-gray-500 text-xs mt-1">Mín. 8 caracteres, 1 mayúscula, 1 número, 1 especial</p>
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
