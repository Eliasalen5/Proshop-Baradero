import { useEffect, useState } from 'react'
import { collection, getDocs, updateDoc, doc, query, orderBy } from 'firebase/firestore'
import { db } from '../../services/firebase'

export default function UsersManager() {
  const [users, setUsers] = useState([])
  const [search, setSearch] = useState('')
  const [pointsInput, setPointsInput] = useState({})

  useEffect(() => {
    const q = query(collection(db, 'users'), orderBy('createdAt', 'desc'))
    getDocs(q).then((snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
      setUsers(list.filter(u => u.role !== 'admin'))
    })
  }, [])

  const assignPoints = async (userId, currentPoints) => {
    const added = Number(pointsInput[userId])
    if (!added || added <= 0) return
    const newTotal = (currentPoints || 0) + added
    await updateDoc(doc(db, 'users', userId), { points: newTotal })
    setUsers(users.map((u) => (u.id === userId ? { ...u, points: newTotal } : u)))
    setPointsInput({ ...pointsInput, [userId]: '' })
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-white mb-6">Usuarios</h2>

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
        {users.length === 0 && <p className="text-gray-500 text-center py-8">No hay usuarios registrados.</p>}
      </div>
    </div>
  )
}
