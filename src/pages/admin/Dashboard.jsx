import { useEffect, useState } from 'react'
import { collection, getCountFromServer } from 'firebase/firestore'
import { db } from '../../services/firebase'
import { Link } from 'react-router-dom'

export default function Dashboard() {
  const [counts, setCounts] = useState({ products: 0, tournaments: 0, benefits: 0, users: 0 })
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    Promise.all([
      getCountFromServer(collection(db, 'products')),
      getCountFromServer(collection(db, 'tournaments')),
      getCountFromServer(collection(db, 'benefits')),
      getCountFromServer(collection(db, 'users')),
    ]).then(([p, t, b, u]) => {
      if (cancelled) return
      setCounts({ products: p.data().count, tournaments: t.data().count, benefits: b.data().count, users: u.data().count })
    }).catch((err) => {
      if (cancelled) return
      console.error(err)
      setError('Error al cargar estadísticas')
    })
    return () => { cancelled = true }
  }, [])

  const cards = [
    { label: 'Productos', count: counts.products, path: '/admin/products', emoji: '📦' },
    { label: 'Torneos', count: counts.tournaments, path: '/admin/tournaments', emoji: '🏆' },
    { label: 'Beneficios', count: counts.benefits, path: '/admin/benefits', emoji: '🎁' },
    { label: 'Usuarios', count: counts.users, path: '/admin/users', emoji: '👥' },
  ]

  return (
    <div>
      <h1 className="text-3xl font-bold text-club-yellow mb-8">Panel de Administración</h1>
      {error && <p className="text-red-400 mb-4">{error}</p>}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {cards.map((card) => (
          <Link
            key={card.path}
            to={card.path}
            className="bg-gray-900 border border-gray-800 rounded-lg p-6 hover:border-club-yellow/50 transition"
          >
            <div className="text-3xl mb-2">{card.emoji}</div>
            <p className="text-gray-400 text-sm">{card.label}</p>
            <p className="text-white text-2xl font-bold">{card.count}</p>
          </Link>
        ))}
      </div>

    </div>
  )
}
