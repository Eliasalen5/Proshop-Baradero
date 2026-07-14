import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { collection, query, where, getDocs, updateDoc, doc } from 'firebase/firestore'
import { db } from '../services/firebase'
import { useAuth } from '../context/AuthContext'

export default function VerificarCanje() {
  const { code } = useParams()
  const { userData, loading: authLoading } = useAuth()
  const [redemption, setRedemption] = useState(null)
  const [loading, setLoading] = useState(true)
  const [confirming, setConfirming] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (authLoading) return
    let retry
    const fetchRedemption = () => {
      const q = query(collection(db, 'redemptions'), where('code', '==', code?.toUpperCase()), where('status', '==', 'pending'))
      getDocs(q).then((snap) => {
        if (!snap.empty) {
          setRedemption({ id: snap.docs[0].id, ...snap.docs[0].data() })
        }
        setLoading(false)
      }).catch(() => {
        retry = setTimeout(fetchRedemption, 3000)
      })
    }
    fetchRedemption()
    return () => { if (retry) clearTimeout(retry) }
  }, [code, authLoading])

  const handleConfirm = async () => {
    if (!redemption) return
    setConfirming(true)
    setError('')
    try {
      await updateDoc(doc(db, 'redemptions', redemption.id), { status: 'completed', completedAt: new Date().toISOString() })
      setDone(true)
    } catch {
      setError('Error al confirmar el canje')
    }
    setConfirming(false)
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-primary flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-club-yellow" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-primary flex items-center justify-center px-4">
      <div className="bg-gray-900 border border-yellow-600/30 rounded-2xl p-8 max-w-sm w-full text-center">
        {done ? (
          <>
            <div className="text-green-400 text-5xl mb-3">✓</div>
            <h1 className="text-white text-xl font-bold mb-2">¡Canje confirmado!</h1>
            <p className="text-gray-400 text-sm mb-6">El beneficio se marcó como completado.</p>
            <Link to="/admin/users" className="inline-block bg-club-yellow text-black font-semibold px-6 py-2 rounded hover:bg-yellow-400 transition">
              Volver al panel
            </Link>
          </>
        ) : redemption ? (
          <>
            <div className="bg-white rounded-xl p-3 inline-block mb-4">
              <img src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${code}`} alt="" className="w-32 h-32 mx-auto" />
            </div>
            <p className="text-3xl font-bold tracking-widest text-club-yellow mb-2">{code}</p>
            <p className="text-white font-medium">{redemption.benefitName}</p>
            <p className="text-gray-400 text-sm">{redemption.userName}</p>
            <p className="text-gray-500 text-sm mt-1">-{redemption.pointsSpent} pts</p>

            {userData?.role === 'admin' ? (
              <>
                <button onClick={handleConfirm} disabled={confirming}
                  className="mt-6 bg-green-600 text-white font-semibold px-6 py-2 rounded hover:bg-green-500 transition w-full disabled:opacity-50">
                  {confirming ? 'Confirmando...' : 'Confirmar canje'}
                </button>
                {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
              </>
            ) : userData ? (
              <p className="text-red-400 text-sm mt-6">No tenés permisos de administrador para confirmar este canje.</p>
            ) : (
              <p className="text-gray-500 text-sm mt-6">Necesitás iniciar sesión como administrador para confirmar este canje.</p>
            )}

            <Link to="/admin/users" className="block mt-3 text-gray-500 text-sm hover:text-white transition">
              Ir al panel
            </Link>
          </>
        ) : (
          <>
            <div className="text-yellow-400 text-5xl mb-3">?</div>
            <h1 className="text-white text-xl font-bold mb-2">Código no encontrado</h1>
            <p className="text-gray-400 text-sm mb-6">No hay un canje pendiente con este código.</p>
            <Link to="/" className="inline-block bg-club-yellow text-black font-semibold px-6 py-2 rounded hover:bg-yellow-400 transition">
              Volver al inicio
            </Link>
          </>
        )}
      </div>
    </div>
  )
}
