import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { HiMenu, HiX, HiChevronDown } from 'react-icons/hi'
import { useState, useRef, useEffect } from 'react'
import Logo from './Logo'

export default function Navbar() {
  const { user, userData, logout } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [userMenu, setUserMenu] = useState(false)
  const menuRef = useRef(null)
  const mobileMenuRef = useRef(null)

  useEffect(() => {
    const handleClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setUserMenu(false)
      }
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(e.target) && !e.target.closest('button')) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

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
            <span className="text-white text-2xl md:text-3xl" style={{ fontFamily: "'Mission Script', cursive" }}>
              Proshop Baradero
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-6">
            <Link to="/" className="text-gray-300 hover:text-club-yellow transition">Home</Link>
            <Link to="/proshop" className="text-gray-300 hover:text-club-yellow transition">Proshop</Link>
            <Link to="/torneos" className="text-gray-300 hover:text-club-yellow transition">Torneos</Link>
            <Link to="/club-beneficios" className="text-gray-300 hover:text-club-yellow transition">Club Beneficios</Link>
            {user ? (
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setUserMenu(!userMenu)}
                  className="flex items-center gap-1.5 text-gray-300 hover:text-club-yellow transition"
                >
                  <span className="max-w-[120px] truncate">{userData?.displayName || user.email}</span>
                  <HiChevronDown className={`w-4 h-4 transition ${userMenu ? 'rotate-180' : ''}`} />
                </button>
                {userMenu && (
                  <div className="absolute right-0 mt-2 w-44 bg-gray-900 border border-gray-700 rounded-lg shadow-lg py-1">
                    <Link
                      to="/perfil"
                      onClick={() => setUserMenu(false)}
                      className="block px-4 py-2 text-sm text-gray-300 hover:text-club-yellow hover:bg-gray-800 transition"
                    >
                      Perfil
                    </Link>
                    {userData?.role === 'admin' && (
                      <Link
                        to="/admin"
                        onClick={() => setUserMenu(false)}
                        className="block px-4 py-2 text-sm text-club-yellow hover:bg-gray-800 transition"
                      >
                        Admin
                      </Link>
                    )}
                    <button
                      onClick={() => { setUserMenu(false); handleLogout() }}
                      className="block w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-gray-800 transition"
                    >
                      Salir
                    </button>
                  </div>
                )}
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

      <div ref={mobileMenuRef} aria-hidden={!open} className={`md:hidden bg-club-black border-t border-yellow-600/30 transition-all duration-200 ${open ? 'max-h-80 opacity-100' : 'max-h-0 opacity-0 overflow-hidden'}`}>
        <div className="flex flex-col gap-1 px-4 pb-4 pt-3">
          <Link to="/" onClick={() => setOpen(false)} className="text-gray-300 hover:text-club-yellow transition px-3 py-2 rounded hover:bg-gray-800">Home</Link>
          <Link to="/proshop" onClick={() => setOpen(false)} className="text-gray-300 hover:text-club-yellow transition px-3 py-2 rounded hover:bg-gray-800">Proshop</Link>
          <Link to="/torneos" onClick={() => setOpen(false)} className="text-gray-300 hover:text-club-yellow transition px-3 py-2 rounded hover:bg-gray-800">Torneos</Link>
          <Link to="/club-beneficios" onClick={() => setOpen(false)} className="text-gray-300 hover:text-club-yellow transition px-3 py-2 rounded hover:bg-gray-800">Club Beneficios</Link>
          {user ? (
            <>
              <Link to="/perfil" onClick={() => setOpen(false)} className="text-gray-300 hover:text-club-yellow transition px-3 py-2 rounded hover:bg-gray-800">
                Perfil
              </Link>
              {userData?.role === 'admin' && (
                <Link to="/admin" onClick={() => setOpen(false)} className="text-club-yellow font-semibold px-3 py-2 rounded hover:bg-gray-800 transition">Admin</Link>
              )}
              <button onClick={() => { setOpen(false); handleLogout() }} className="text-left text-red-400 hover:bg-gray-800 transition px-3 py-2 rounded">Salir</button>
            </>
          ) : (
            <Link to="/login" onClick={() => setOpen(false)} className="bg-club-yellow text-black font-semibold text-center px-3 py-2 rounded hover:bg-yellow-400 transition">Ingresar</Link>
          )}
        </div>
      </div>
    </nav>
  )
}
