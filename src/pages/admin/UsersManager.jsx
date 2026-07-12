import { useEffect, useState, useRef } from 'react'
import { collection, updateDoc, doc, query, orderBy, onSnapshot } from 'firebase/firestore'
import { db } from '../../services/firebase'

export default function UsersManager() {
  const [view, setView] = useState('users')
  const [users, setUsers] = useState([])
  const [redemptions, setRedemptions] = useState([])
  const [search, setSearch] = useState('')
  const [pointsInput, setPointsInput] = useState({})
  const [codeInput, setCodeInput] = useState('')
  const [confirmMsg, setConfirmMsg] = useState('')
  const [qrModal, setQrModal] = useState(null)
  const [scannerOpen, setScannerOpen] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)
  const scannerRef = useRef(null)
  const html5QrCodeRef = useRef(null)

  useEffect(() => {
    let unsub, retry
    const listen = () => {
      const q = query(collection(db, 'users'), orderBy('createdAt', 'desc'))
      unsub = onSnapshot(
        q,
        (snap) => {
          const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
          setUsers(list.filter(u => u.role !== 'admin'))
        },
        (err) => {
          console.error('Users onSnapshot:', err)
          retry = setTimeout(listen, 3000)
        }
      )
    }
    listen()
    return () => { if (unsub) unsub(); if (retry) clearTimeout(retry) }
  }, [refreshKey])

  useEffect(() => {
    if (view !== 'redemptions') return
    let unsub, retry
    const listen = () => {
      const q = query(collection(db, 'redemptions'), orderBy('date', 'desc'))
      unsub = onSnapshot(
        q,
        (snap) => {
          setRedemptions(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
        },
        (err) => {
          console.error('Redemptions onSnapshot:', err)
          retry = setTimeout(listen, 3000)
        }
      )
    }
    listen()
    return () => { if (unsub) unsub(); if (retry) clearTimeout(retry) }
  }, [view, refreshKey])

  const assignPoints = async (userId, currentPoints) => {
    const added = Number(pointsInput[userId])
    if (!added || added <= 0) return
    const newTotal = (currentPoints || 0) + added
    await updateDoc(doc(db, 'users', userId), { points: newTotal })
    setUsers(users.map((u) => (u.id === userId ? { ...u, points: newTotal } : u)))
    setPointsInput({ ...pointsInput, [userId]: '' })
  }

  const extractCode = (text) => {
    const m = (text || '').match(/\/verificar\/(\w+)/i)
    return m ? m[1].toUpperCase() : text.trim().toUpperCase()
  }

  const handleConfirmRedemption = async (scannedCode) => {
    const code = extractCode(scannedCode || codeInput)
    if (!code) return
    const match = redemptions.find((r) => r.code === code && r.status === 'pending')
    if (!match) {
      setConfirmMsg('No se encontró un canje pendiente con ese código')
      return
    }
    try {
      await updateDoc(doc(db, 'redemptions', match.id), { status: 'completed', completedAt: new Date().toISOString() })
      setRedemptions(redemptions.map((r) => (r.id === match.id ? { ...r, status: 'completed' } : r)))
      setConfirmMsg(`Canje de "${match.benefitName}" confirmado`)
      setCodeInput('')
    } catch {
      setConfirmMsg('Error al confirmar el canje')
    }
  }

  const startScanner = async () => {
    setScannerOpen(true)
    setTimeout(async () => {
      if (!scannerRef.current) return
      try {
        const { Html5Qrcode } = await import('html5-qrcode')
        const scanner = new Html5Qrcode('qr-scanner')
        html5QrCodeRef.current = scanner
        await scanner.start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: { width: 250, height: 250 } },
          (decodedText) => {
            scanner.stop().catch(() => {})
            setScannerOpen(false)
            handleConfirmRedemption(decodedText)
          },
          () => {}
        )
      } catch {
        setScannerOpen(false)
      }
    }, 300)
  }

  const stopScanner = async () => {
    if (html5QrCodeRef.current) {
      try { await html5QrCodeRef.current.stop() } catch {}
      html5QrCodeRef.current = null
    }
    setScannerOpen(false)
  }

  const pending = redemptions.filter((r) => r.status === 'pending')
  const completed = redemptions.filter((r) => r.status === 'completed').slice(0, 20)

  return (
    <div>
      <div className="flex gap-2 mb-6 overflow-x-auto flex-nowrap whitespace-nowrap -mx-4 px-4 md:mx-0 md:px-0 pb-1">
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
        <button
          onClick={() => setRefreshKey(k => k + 1)}
          className="ml-auto px-3 py-2 rounded text-sm font-semibold bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700 transition flex-shrink-0"
          title="Refrescar datos"
        >
          ↻
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
                <div className="flex items-start justify-between mb-2 gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-white font-medium truncate">{u.displayName || 'Sin nombre'}</p>
                    <p className="text-gray-400 text-sm truncate">{u.email}</p>
                    <span className={`text-xs px-2 py-0.5 rounded ${u.role === 'admin' ? 'bg-club-yellow text-black' : 'bg-gray-800 text-gray-400'}`}>
                      {u.role || 'user'}
                    </span>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-gray-500 text-sm">Puntos</p>
                    <p className="text-club-yellow font-bold text-xl">{u.points ?? 0}</p>
                  </div>
                </div>
                {u.role !== 'admin' && (
                  <div className="flex gap-2 items-center mt-2">
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
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                placeholder="Ingresá el código de 6 caracteres"
                value={codeInput}
                onChange={(e) => { setCodeInput(e.target.value.toUpperCase()); setConfirmMsg('') }}
                maxLength={6}
                className="flex-1 bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white uppercase tracking-widest font-bold"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => handleConfirmRedemption()}
                  disabled={!codeInput.trim()}
                  className="flex-1 sm:flex-none bg-green-600 text-white font-semibold px-6 py-2 rounded hover:bg-green-500 transition disabled:opacity-50"
                >
                  Confirmar
                </button>
                <button
                  onClick={startScanner}
                  className="flex-1 sm:flex-none bg-blue-600 text-white font-semibold px-4 py-2 rounded hover:bg-blue-500 transition flex items-center justify-center gap-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 7V5a2 2 0 0 1 2-2h2" /><path d="M17 3h2a2 2 0 0 1 2 2v2" /><path d="M21 17v2a2 2 0 0 1-2 2h-2" /><path d="M7 21H5a2 2 0 0 1-2-2v-2" />
                    <rect x="7" y="7" width="10" height="10" rx="2" />
                  </svg>
                  QR
                </button>
              </div>
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
                <div key={r.id} className="bg-gray-900 border border-yellow-600/20 rounded-lg p-4 flex items-center justify-between cursor-pointer hover:bg-gray-800/50 transition gap-3"
                  onClick={() => setQrModal(r)}>
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="bg-yellow-900/30 border border-yellow-600/30 rounded-lg p-2 flex-shrink-0">
                      <img src={`https://api.qrserver.com/v1/create-qr-code/?size=60x60&data=${encodeURIComponent(`https://proshop-baradero.vercel.app/verificar/${r.code}`)}`} alt="" className="w-10 h-10 sm:w-12 sm:h-12" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-white font-medium truncate">{r.benefitName}</p>
                      <p className="text-gray-400 text-sm truncate">{r.userName || r.userId}</p>
                      <p className="text-gray-500 text-xs">{new Date(r.date).toLocaleString('es-AR')}</p>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
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
                <div key={r.id} className="bg-gray-900 border border-gray-800 rounded-lg p-4 flex items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-white font-medium truncate">{r.benefitName}</p>
                    <p className="text-gray-400 text-sm truncate">{r.userName || r.userId}</p>
                    <p className="text-gray-500 text-xs">{new Date(r.date).toLocaleString('es-AR')}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-club-yellow font-bold">-{r.pointsSpent} pts</p>
                    <span className="text-green-400 text-xs">Completado</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Escáner QR */}
      {scannerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4" onClick={stopScanner}>
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 sm:p-6 max-w-sm w-full mx-2" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-white font-semibold mb-3 text-center">Escaneá el código QR</h3>
            <p className="text-gray-500 text-xs text-center mb-3">Apuntale al QR que te muestra el socio en su teléfono</p>
            <div id="qr-scanner" ref={scannerRef} className="w-full aspect-square bg-black rounded-lg overflow-hidden" />
            <button onClick={stopScanner} className="mt-4 bg-gray-700 text-white px-6 py-2.5 rounded hover:bg-gray-600 transition w-full text-sm">
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Modal QR grande */}
      {qrModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4" onClick={() => setQrModal(null)}>
          <div className="bg-gray-900 border border-yellow-600/30 rounded-2xl p-8 max-w-sm w-full text-center" onClick={(e) => e.stopPropagation()}>
            <div className="bg-white rounded-xl p-4 inline-block mb-4">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(`https://proshop-baradero.vercel.app/verificar/${qrModal.code}`)}`}
                alt="QR de canje"
                className="w-60 h-60 mx-auto"
              />
            </div>
            <p className="text-3xl font-bold tracking-widest text-club-yellow mb-2">{qrModal.code}</p>
            <p className="text-white font-medium">{qrModal.benefitName}</p>
            <p className="text-gray-400 text-sm">{qrModal.userName || qrModal.userId}</p>
            <p className="text-gray-500 text-sm mt-1">-{qrModal.pointsSpent} pts</p>
            <button onClick={() => setQrModal(null)} className="mt-6 bg-club-yellow text-black font-semibold px-6 py-2 rounded hover:bg-yellow-400 transition w-full">
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
