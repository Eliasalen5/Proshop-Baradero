import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { HiMenu, HiX } from 'react-icons/hi'
import { useState } from 'react'
import Logo from './Logo'

export default function Navbar() {
  const { user, userData, logout } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  return (
    <nav className="bg-club-black border-b border-yellow-600/30 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2">
            <Logo />
            <span className="hidden md:inline text-club-yellow text-xl font-bold tracking-wider">
              PROSHOP BARADERO
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-6">
            <Link to="/" className="text-gray-300 hover:text-club-yellow transition">
              Home
            </Link>
            <Link to="/proshop" className="text-gray-300 hover:text-club-yellow transition">
              Proshop
            </Link>
            <Link to="/torneos" className="text-gray-300 hover:text-club-yellow transition">
              Torneos
            </Link>
            <Link to="/club-beneficios" className="text-gray-300 hover:text-club-yellow transition">
              Club Beneficios
            </Link>
            {user ? (
              <div className="flex items-center gap-4">
                <Link
                  to="/perfil"
                  className="flex items-center gap-1 text-gray-300 hover:text-club-yellow transition"
                >
                  <span>{userData?.displayName}</span>
                  {userData?.role !== 'admin' && (
                    <span className="text-xs bg-club-yellow text-black px-2 py-0.5 rounded-full font-bold">
                      {userData?.points ?? 0} pts
                    </span>
                  )}
                </Link>
                {userData?.role === 'admin' && (
                  <Link
                    to="/admin"
                    className="text-club-yellow hover:text-yellow-300 transition font-semibold"
                  >
                    Admin
                  </Link>
                )}
                <button
                  onClick={handleLogout}
                  className="text-gray-400 hover:text-red-400 transition text-sm"
                >
                  Salir
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="bg-club-yellow text-black px-4 py-1.5 rounded font-semibold hover:bg-yellow-400 transition"
              >
                Ingresar
              </Link>
            )}
          </div>

          <button className="md:hidden text-white p-2" onClick={() => setOpen(!open)}>
            {open ? <HiX size={24} /> : <HiMenu size={24} />}
          </button>
        </div>
      </div>

      <div className={`md:hidden bg-club-black border-t border-yellow-600/30 transition-all duration-200 ${open ? 'max-h-80 opacity-100' : 'max-h-0 opacity-0 overflow-hidden'}`}>
        <div className="flex flex-col gap-1 px-4 pb-4 pt-3">
          <Link to="/" onClick={() => setOpen(false)} className="text-gray-300 hover:text-club-yellow transition px-3 py-2 rounded hover:bg-gray-800">Home</Link>
          <Link to="/proshop" onClick={() => setOpen(false)} className="text-gray-300 hover:text-club-yellow transition px-3 py-2 rounded hover:bg-gray-800">Proshop</Link>
          <Link to="/torneos" onClick={() => setOpen(false)} className="text-gray-300 hover:text-club-yellow transition px-3 py-2 rounded hover:bg-gray-800">Torneos</Link>
          <Link to="/club-beneficios" onClick={() => setOpen(false)} className="text-gray-300 hover:text-club-yellow transition px-3 py-2 rounded hover:bg-gray-800">Club Beneficios</Link>
          {user ? (
            <>
              <Link to="/perfil" onClick={() => setOpen(false)} className="text-gray-300 hover:text-club-yellow transition px-3 py-2 rounded hover:bg-gray-800 flex items-center gap-2">
                Perfil
                {userData?.role !== 'admin' && (
                  <span className="text-xs bg-club-yellow text-black px-2 py-0.5 rounded-full font-bold">{userData?.points ?? 0} pts</span>
                )}
              </Link>
              {userData?.role === 'admin' && (
                <Link to="/admin" onClick={() => setOpen(false)} className="text-club-yellow font-semibold px-3 py-2 rounded hover:bg-gray-800 transition">Admin</Link>
              )}
              <button onClick={handleLogout} className="text-left text-red-400 hover:bg-gray-800 transition px-3 py-2 rounded">Salir</button>
            </>
          ) : (
            <Link to="/login" onClick={() => setOpen(false)} className="bg-club-yellow text-black font-semibold text-center px-3 py-2 rounded hover:bg-yellow-400 transition">Ingresar</Link>
          )}
        </div>
      </div>
    </nav>
  )
}
