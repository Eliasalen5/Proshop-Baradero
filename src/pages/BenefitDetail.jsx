import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { doc, getDoc, runTransaction, collection } from 'firebase/firestore'
import { db } from '../services/firebase'
import { useAuth } from '../context/AuthContext'

function generateCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  const arr = new Uint8Array(6)
  crypto.getRandomValues(arr)
  return Array.from(arr, (b) => chars[b % chars.length]).join('')
}

export default function BenefitDetail() {
  const { id } = useParams()
  const { user, userData } = useAuth()
  const [benefit, setBenefit] = useState(null)
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [redeemed, setRedeemed] = useState(null)

  useEffect(() => {
    getDoc(doc(db, 'benefits', id)).then((snap) => {
      if (snap.exists()) setBenefit({ id: snap.id, ...snap.data() })
      setLoading(false)
    }).catch((err) => {
      setLoading(false)
      console.error(err)
    })
  }, [id])

  const handleRedeem = async () => {
    if (!benefit) return
    if (!user) {
      setMessage('Iniciá sesión para canjear')
      return
    }
    if (benefit.pointsRequired) {
      if ((userData?.points || 0) < benefit.pointsRequired) {
        setMessage('No tenés suficientes puntos')
        return
      }
      const code = generateCode()
      try {
        await runTransaction(db, async (transaction) => {
          const userRef = doc(db, 'users', user.uid)
          const userSnap = await transaction.get(userRef)
          if (!userSnap.exists()) throw new Error('Usuario no encontrado')
          const currentPoints = userSnap.data().points || 0
          if (currentPoints < benefit.pointsRequired) throw new Error('No tenés suficientes puntos')
          transaction.update(userRef, { points: currentPoints - benefit.pointsRequired })
          const redemptionRef = doc(collection(db, 'redemptions'))
          transaction.set(redemptionRef, {
            userId: user.uid,
            userName: userData?.displayName || user.email,
            benefitId: benefit.id,
            benefitName: benefit.name,
            pointsSpent: benefit.pointsRequired,
            code,
            date: new Date().toISOString(),
            status: 'pending',
          })
        })
        setRedeemed({ benefit, code })
      } catch {
        setMessage('Error al canjear. Intentá de nuevo.')
      }
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-club-yellow" />
      </div>
    )
  }

  if (!benefit) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-400">Beneficio no encontrado</p>
        <Link to="/club-beneficios" className="text-club-yellow hover:underline mt-2 inline-block">
          Volver a beneficios
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <Link to="/club-beneficios" className="text-club-yellow hover:underline mb-6 inline-block">
        &larr; Volver a beneficios
      </Link>

      {message && (
        <div className={`p-3 rounded mb-6 text-sm ${
          message.includes('Error') || message.includes('suficientes') || message.includes('sesión')
            ? 'bg-red-900/50 text-red-300'
            : 'bg-green-900/50 text-green-300'
        }`}>
          {message}
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-8">
        <div className="aspect-square bg-gray-800 rounded-lg flex items-center justify-center overflow-hidden">
          {benefit.image ? (
            <img src={benefit.image} alt={benefit.name} className="w-full h-full object-contain" />
          ) : (
            <span className="text-gray-600 text-6xl">🎁</span>
          )}
        </div>
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">{benefit.name}</h1>
          {benefit.category && (
            <span className="text-xs text-gray-500 uppercase bg-gray-800 px-2 py-1 rounded">
              {benefit.category}
            </span>
          )}
          <p className="text-gray-400 mt-4">{benefit.description || 'Sin descripción'}</p>

          <div className="flex flex-wrap items-center gap-3 mt-4">
            {benefit.pointsRequired && (
              <span className="text-club-yellow font-bold text-2xl">{benefit.pointsRequired} pts</span>
            )}
            {benefit.price && (
              <span className="text-green-400 font-bold text-2xl">${benefit.price?.toLocaleString('es-AR')}</span>
            )}
            {benefit.discount && (
              <span className="text-sm bg-green-900 text-green-300 px-2 py-0.5 rounded">-{benefit.discount}%</span>
            )}
          </div>

          {!user ? (
            <button disabled className="w-full mt-6 bg-gray-700 text-gray-400 font-bold py-3 rounded cursor-not-allowed text-lg">
              Ingresá para canjear
            </button>
          ) : benefit.pointsRequired ? (
            <button
              onClick={handleRedeem}
              disabled={(userData?.points || 0) < benefit.pointsRequired}
              className="w-full mt-6 bg-club-yellow text-black font-bold py-3 rounded hover:bg-yellow-400 transition disabled:opacity-50 disabled:cursor-not-allowed text-lg"
            >
              Canjear
            </button>
          ) : (
            <div className="mt-6 p-4 bg-gray-800 rounded-lg text-center">
              <p className="text-gray-400">Consultá en el local por este beneficio</p>
            </div>
          )}
        </div>
      </div>

      {redeemed && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4" onClick={() => setRedeemed(null)}>
          <div className="bg-gray-900 border border-yellow-600/30 rounded-2xl p-8 max-w-sm w-full text-center" onClick={(e) => e.stopPropagation()}>
            <div className="text-green-400 text-5xl mb-3">✓</div>
            <h2 className="text-white text-xl font-bold mb-1">¡Canje exitoso!</h2>
            <p className="text-gray-400 text-sm mb-4">Mostrá este código en el club</p>
            <div className="bg-white rounded-xl p-4 inline-block mb-4">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(`https://proshop-baradero.vercel.app/verificar/${redeemed.code}`)}`}
                alt="QR de canje"
                className="w-44 h-44 mx-auto"
              />
            </div>
            <p className="text-3xl font-bold tracking-widest text-club-yellow mb-2">{redeemed.code}</p>
            <p className="text-white font-medium">{redeemed.benefit.name}</p>
            <p className="text-gray-500 text-sm mt-1">-{redeemed.benefit.pointsRequired} pts</p>
            <button onClick={() => setRedeemed(null)} className="mt-3 bg-club-yellow text-black font-semibold px-6 py-2 rounded hover:bg-yellow-400 transition w-full">
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
