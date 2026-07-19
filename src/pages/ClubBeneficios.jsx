import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { collection, query, where, onSnapshot } from 'firebase/firestore'
import { db } from '../services/firebase'

export default function ClubBeneficios() {
  const { user, userData } = useAuth()
  const [benefits, setBenefits] = useState([])
  const [selectedCategory, setSelectedCategory] = useState('')
  const [loading, setLoading] = useState(true)

  const uniqueCategories = [...new Set(benefits.map(b => b.category).filter(Boolean))]

  useEffect(() => {
    let unsubBenefits, retryB
    const listenBenefits = () => {
      unsubBenefits = onSnapshot(
        query(collection(db, 'benefits'), where('active', '!=', false)),
        (snap) => {
          setBenefits(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
          setLoading(false)
        },
        (err) => {
          console.error('Benefits onSnapshot:', err)
          retryB = setTimeout(listenBenefits, 3000)
        }
      )
    }
    listenBenefits()
    return () => {
      if (unsubBenefits) unsubBenefits()
      if (retryB) clearTimeout(retryB)
    }
  }, [])

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-club-yellow" />
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold text-club-yellow mb-2">Club Beneficios</h1>
      <p className="text-gray-400 mb-4">Canjeá tus puntos por productos con descuento</p>

      {user && userData?.role !== 'admin' && (
        <div className="bg-gray-900 border border-yellow-600/30 rounded-lg p-4 mb-8 inline-block">
          <span className="text-gray-400">Tus puntos: </span>
          <span className="text-club-yellow font-bold text-xl">{userData?.points ?? 0}</span>
        </div>
      )}

      {uniqueCategories.length > 0 && (
        <div className="flex gap-2 mb-6 overflow-x-auto flex-nowrap whitespace-nowrap -mx-4 px-4 md:mx-0 md:px-0 pb-1">
          <button onClick={() => setSelectedCategory('')}
            className={`px-4 py-1.5 rounded text-sm transition ${!selectedCategory ? 'bg-club-yellow text-black font-semibold' : 'bg-gray-800 text-gray-400 hover:text-white'}`}>
            Todas
          </button>
          {uniqueCategories.map((cat) => (
            <button key={cat} onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-1.5 rounded text-sm transition ${selectedCategory === cat ? 'bg-club-yellow text-black font-semibold' : 'bg-gray-800 text-gray-400 hover:text-white'}`}>
              {cat}
            </button>
          ))}
        </div>
      )}

      {benefits.filter(b => !selectedCategory || b.category === selectedCategory).length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <p className="text-lg">Próximamente...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {benefits.filter(b => !selectedCategory || b.category === selectedCategory).map((b) => (
            <Link key={b.id} to={`/club-beneficios/${b.id}`} className="bg-gray-900 rounded-lg border border-gray-800 overflow-hidden block hover:border-club-yellow/50 transition group">
              <div className="aspect-square bg-gray-800 flex items-center justify-center overflow-hidden">
                {b.image ? (
                  <img src={b.image} alt={b.name} className="w-full h-full object-cover group-hover:scale-105 transition duration-300" />
                ) : (
                  <span className="text-gray-600 text-4xl">🎁</span>
                )}
              </div>
              <div className="p-4">
                <h3 className="text-white font-semibold">{b.name}</h3>
                {b.description && (
                  <p className="text-gray-400 text-sm mt-1">{b.description}</p>
                )}
                {b.category && (
                  <span className="text-xs text-gray-500 uppercase block mt-1">{b.category}</span>
                )}
                <div className="flex flex-wrap items-center gap-2 mt-3">
                  {b.pointsRequired && (
                    <span className="text-club-yellow font-bold">{b.pointsRequired} pts</span>
                  )}
                  {b.price && (
                    <span className="text-green-400 font-bold">${b.price?.toLocaleString('es-AR')}</span>
                  )}
                  {b.discount && (
                    <span className="text-xs bg-green-900 text-green-300 px-2 py-0.5 rounded">-{b.discount}%</span>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

    </div>
  )
}
