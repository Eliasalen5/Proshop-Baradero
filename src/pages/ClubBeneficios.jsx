import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { collection, getDocs, query, where, orderBy, addDoc, doc, updateDoc } from 'firebase/firestore'
import { db } from '../services/firebase'

export default function ClubBeneficios() {
  const { user, userData, refreshUserData } = useAuth()
  const [benefits, setBenefits] = useState([])
  const [categories, setCategories] = useState([])
  const [selectedCategory, setSelectedCategory] = useState('')
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')

  useEffect(() => {
    Promise.all([
      getDocs(query(collection(db, 'benefits'), where('active', '!=', false))),
      getDocs(query(collection(db, 'categories'), orderBy('createdAt', 'desc'))),
    ]).then(([bSnap, cSnap]) => {
      setBenefits(bSnap.docs.map((d) => ({ id: d.id, ...d.data() })))
      setCategories(cSnap.docs.map((d) => ({ id: d.id, ...d.data() })))
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  const handleRedeem = async (benefit) => {
    if (!user) {
      setMessage('Iniciá sesión para canjear')
      return
    }
    if (benefit.pointsRequired) {
      if ((userData?.points || 0) < benefit.pointsRequired) {
        setMessage('No tenés suficientes puntos')
        return
      }
      try {
        await addDoc(collection(db, 'redemptions'), {
          userId: user.uid,
          benefitId: benefit.id,
          benefitName: benefit.name,
          pointsSpent: benefit.pointsRequired,
          date: new Date().toISOString(),
          status: 'pending',
        })
        const newPoints = (userData?.points || 0) - benefit.pointsRequired
        await updateDoc(doc(db, 'users', user.uid), { points: newPoints })
        await refreshUserData()
        setMessage(`Canjeaste "${benefit.name}" por ${benefit.pointsRequired} puntos`)
      } catch {
        setMessage('Error al canjear. Intentá de nuevo.')
      }
    } else {
      setMessage('Consultá en el club por este beneficio.')
    }
  }

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

      {message && (
        <div className={`p-3 rounded mb-6 text-sm ${
          message.includes('Error') || message.includes('suficientes') || message.includes('sesión')
            ? 'bg-red-900/50 text-red-300'
            : 'bg-green-900/50 text-green-300'
        }`}>
          {message}
        </div>
      )}

      {categories.filter(c => benefits.some(b => b.category === c.name)).length > 0 && (
        <div className="flex flex-wrap gap-2 mb-6">
          <button onClick={() => setSelectedCategory('')}
            className={`px-4 py-1.5 rounded text-sm transition ${!selectedCategory ? 'bg-club-yellow text-black font-semibold' : 'bg-gray-800 text-gray-400 hover:text-white'}`}>
            Todas
          </button>
          {categories.filter(c => benefits.some(b => b.category === c.name)).map((c) => (
            <button key={c.id} onClick={() => setSelectedCategory(c.name)}
              className={`px-4 py-1.5 rounded text-sm transition ${selectedCategory === c.name ? 'bg-club-yellow text-black font-semibold' : 'bg-gray-800 text-gray-400 hover:text-white'}`}>
              {c.name}
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
            <div key={b.id} className="bg-gray-900 rounded-lg border border-gray-800 overflow-hidden">
              <div className="aspect-square bg-gray-800 flex items-center justify-center overflow-hidden">
                {b.image ? (
                  <img src={b.image} alt={b.name} className="w-full h-full object-cover" />
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
                <button
                  onClick={() => handleRedeem(b)}
                  disabled={!user || (b.pointsRequired && (userData?.points || 0) < b.pointsRequired)}
                  className="w-full mt-3 bg-club-yellow text-black font-semibold py-2 rounded hover:bg-yellow-400 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {!user ? 'Ingresá para canjear' : b.pointsRequired ? 'Canjear' : 'Consultar'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
