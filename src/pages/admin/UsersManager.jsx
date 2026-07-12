import { useEffect, useState } from 'react'
import { collection, getDocs, updateDoc, doc, query, orderBy, where } from 'firebase/firestore'
import { db } from '../../services/firebase'

export default function UsersManager() {
  const [view, setView] = useState('users')
  const [users, setUsers] = useState([])
  const [redemptions, setRedemptions] = useState([])
  const [search, setSearch] = useState('')
  const [pointsInput, setPointsInput] = useState({})
  const [codeInput, setCodeInput] = useState('')
  const [confirmMsg, setConfirmMsg] = useState('')

  useEffect(() => {
    const q = query(collection(db, 'users'), orderBy('createdAt', 'desc'))
    getDocs(q).then((snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
      setUsers(list.filter(u => u.role !== 'admin'))
    })
  }, [])

  const loadRedemptions = () => {
    const q = query(collection(db, 'redemptions'), orderBy('date', 'desc'))
    getDocs(q).then((snap) => {
      setRedemptions(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    })
  }

  useEffect(() => {
    if (view === 'redemptions') loadRedemptions()
  }, [view])

  const assignPoints = async (userId, currentPoints) => {
    const added = Number(pointsInput[userId])
    if (!added || added <= 0) return
    const newTotal = (currentPoints || 0) + added
    await updateDoc(doc(db, 'users', userId), { points: newTotal })
    setUsers(users.map((u) => (u.id === userId ? { ...u, points: newTotal } : u)))
    setPointsInput({ ...pointsInput, [userId]: '' })
  }

  const handleConfirmRedemption = async () => {
    const code = codeInput.trim().toUpperCase()
    if (!code) return
    const match = redemptions.find((r) => r.code === code && r.status === 'pending')
    if (!match) {
      setConfirmMsg('No se encontró un canje pendiente con ese código')
      return
    }
    try {
      await updateDoc(doc(db, 'redemptions', match.id), { status: 'completed', completedAt: new Date().toISOString() })
      setConfirmMsg(`Canje de "${match.benefitName}" confirmado`)
      setCodeInput('')
      loadRedemptions()
    } catch {
      setConfirmMsg('Error al confirmar el canje')
    }
  }

  const pending = redemptions.filter((r) => r.status === 'pending')
  const completed = redemptions.filter((r) => r.status === 'completed').slice(0, 20)

  return (
    <div>
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setView('users')}
          className={`px-4 py-2 rounded text-sm font-semibold transition ${view === 'users' ? 'bg-club-yellow text-black' : 'bg-gray-800 text-gray-400 hover:text-white'}`}
        >
          Usuarios
        </button>
        <button
          onClick={() => setView('redemptions')}
          className={`px-4 py-2 rounded text-sm font-semibold transition ${view === 'redemptions' ? 'bg-club-yellow text-black' : 'bg-gray-800 text-gray-400 hover:text-white'}`}
        >
          Canjes Pendientes {pending.length > 0 && <span className="ml-1 bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">{pending.length}</span>}
        </button>
      </div>

      {view === 'users' && (
        <>
          <input placeholder="Buscar por nombre, email o documento..." value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white mb-6" />

          <div className="space-y-3">
            {users.filter(u => {
              const q = search.toLowerCase()
              return !q || (u.displayName || '').toLowerCase().includes(q) || (u.email || '').toLowerCase().includes(q) || (u.documento || '').toLowerCase().includes(q)
            }).map((u) => (
              <div key={u.id} className="bg-gray-900 border border-gray-800 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="text-white font-medium">{u.displayName || 'Sin nombre'}</p>
                    <p className="text-gray-400 text-sm">{u.email}</p>
                    <span className={`text-xs px-2 py-0.5 rounded ${u.role === 'admin' ? 'bg-club-yellow text-black' : 'bg-gray-800 text-gray-400'}`}>
                      {u.role || 'user'}
                    </span>
                  </div>
                  <div className="text-right">
                    <p className="text-gray-500 text-sm">Puntos</p>
                    <p className="text-club-yellow font-bold text-xl">{u.points ?? 0}</p>
                  </div>
                </div>
                {u.role !== 'admin' && (
                  <div className="flex gap-2 items-center">
                    <input
                      type="number"
                      placeholder="Sumar puntos"
                      value={pointsInput[u.id] || ''}
                      onChange={(e) => setPointsInput({ ...pointsInput, [u.id]: e.target.value })}
                      className="bg-gray-800 border border-gray-700 rounded px-3 py-1.5 text-white text-sm w-32"
                    />
                    <button
                      onClick={() => assignPoints(u.id, u.points)}
                      className="bg-club-yellow text-black font-semibold px-4 py-1.5 rounded text-sm hover:bg-yellow-400 transition"
                    >
                      Asignar
                    </button>
                  </div>
                )}
              </div>
            ))}
            {users.filter(u => {
              const q = search.toLowerCase()
              return !q || (u.displayName || '').toLowerCase().includes(q) || (u.email || '').toLowerCase().includes(q) || (u.documento || '').toLowerCase().includes(q)
            }).length === 0 && <p className="text-gray-500 text-center py-8">No hay usuarios registrados.</p>}
          </div>
        </>
      )}

      {view === 'redemptions' && (
        <div>
          {/* Verificar código */}
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 mb-6">
            <h3 className="text-club-yellow font-semibold mb-3">Verificar código de canje</h3>
            {confirmMsg && (
              <div className={`p-3 rounded mb-4 text-sm ${
                confirmMsg.includes('Error') || confirmMsg.includes('No se encontró')
                  ? 'bg-red-900/50 text-red-300'
                  : 'bg-green-900/50 text-green-300'
              }`}>
                {confirmMsg}
              </div>
            )}
            <div className="flex gap-2">
              <input
                placeholder="Ingresá el código de 6 caracteres"
                value={codeInput}
                onChange={(e) => { setCodeInput(e.target.value.toUpperCase()); setConfirmMsg('') }}
                maxLength={6}
                className="flex-1 bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white uppercase tracking-widest font-bold"
              />
              <button
                onClick={handleConfirmRedemption}
                disabled={!codeInput.trim()}
                className="bg-green-600 text-white font-semibold px-6 py-2 rounded hover:bg-green-500 transition disabled:opacity-50"
              >
                Confirmar canje
              </button>
            </div>
          </div>

          {/* Pendientes */}
          <h3 className="text-white font-semibold mb-3">
            Pendientes {pending.length > 0 && <span className="text-yellow-400">({pending.length})</span>}
          </h3>
          {pending.length === 0 ? (
            <p className="text-gray-500 text-sm mb-6">No hay canjes pendientes.</p>
          ) : (
            <div className="space-y-2 mb-8">
              {pending.map((r) => (
                <div key={r.id} className="bg-gray-900 border border-yellow-600/20 rounded-lg p-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="bg-yellow-900/30 border border-yellow-600/30 rounded-lg p-2">
                      <img src={`https://api.qrserver.com/v1/create-qr-code/?size=60x60&data=${r.code}`} alt="" className="w-12 h-12" />
                    </div>
                    <div>
                      <p className="text-white font-medium">{r.benefitName}</p>
                      <p className="text-gray-400 text-sm">{r.userName || r.userId}</p>
                      <p className="text-gray-500 text-xs">{new Date(r.date).toLocaleString('es-AR')}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-club-yellow font-bold">-{r.pointsSpent} pts</p>
                    <p className="text-yellow-400 text-sm font-mono tracking-widest">{r.code}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Completados recientes */}
          <h3 className="text-white font-semibold mb-3">Últimos canjes completados</h3>
          {completed.length === 0 ? (
            <p className="text-gray-500 text-sm">No hay canjes completados.</p>
          ) : (
            <div className="space-y-2">
              {completed.map((r) => (
                <div key={r.id} className="bg-gray-900 border border-gray-800 rounded-lg p-4 flex items-center justify-between">
                  <div>
                    <p className="text-white font-medium">{r.benefitName}</p>
                    <p className="text-gray-400 text-sm">{r.userName || r.userId}</p>
                    <p className="text-gray-500 text-xs">{new Date(r.date).toLocaleString('es-AR')}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-club-yellow font-bold">-{r.pointsSpent} pts</p>
                    <span className="text-green-400 text-xs">Completado</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
