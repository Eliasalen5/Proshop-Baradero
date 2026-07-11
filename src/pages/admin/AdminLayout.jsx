import { Outlet, Link, useLocation } from 'react-router-dom'

export default function AdminLayout() {
  const location = useLocation()

  const links = [
    { path: '/admin', label: 'Dashboard', emoji: '📊' },
    { path: '/admin/tournaments', label: 'Torneos', emoji: '🏆' },
    { path: '/admin/products', label: 'Productos', emoji: '📦' },
    { path: '/admin/benefits', label: 'Beneficios', emoji: '🎁' },
    { path: '/admin/users', label: 'Usuarios', emoji: '👥' },
  ]

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <nav className="flex flex-wrap gap-2 mb-8 border-b border-gray-800 pb-4">
        {links.map((link) => (
          <Link
            key={link.path}
            to={link.path}
            className={`px-3 py-1.5 rounded text-sm transition ${
              location.pathname === link.path
                ? 'bg-club-yellow text-black font-semibold'
                : 'text-gray-400 hover:text-white hover:bg-gray-800'
            }`}
          >
            {link.emoji} {link.label}
          </Link>
        ))}
      </nav>
      <Outlet />
    </div>
  )
}
