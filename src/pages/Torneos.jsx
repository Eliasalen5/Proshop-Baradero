import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore'
import { db } from '../services/firebase'
import { toArgentinaDate, nowArgentina, getStatus } from '../utils/date'

function hasLiveMatch(t, now) {
  if (!t.dateTime || t.finished) return false
  const ms = (t.matchDuration || 60) * 60000
  const byCourt = {}
  const addMatch = (m) => {
    if (!m.court || !m.time) return
    if (!byCourt[m.court]) byCourt[m.court] = []
    const [h, min] = m.time.split(':').map(Number)
    const d = toArgentinaDate(t.dateTime)
    d.setHours(h, min, 0, 0)
    if (h < 6) d.setDate(d.getDate() + 1)
    byCourt[m.court].push(d)
  }
  t.zones?.forEach((zone) => zone.matches?.forEach(addMatch))
  t.elimination?.forEach((round) => round.matches?.forEach(addMatch))
  for (const matches of Object.values(byCourt)) {
    matches.sort((a, b) => a - b)
    for (let i = 0; i < matches.length; i++) {
      const windowEnd = matches[i].getTime() + ms
      const end = i < matches.length - 1
        ? new Date(Math.min(matches[i + 1].getTime(), windowEnd))
        : new Date(windowEnd)
      if (now >= matches[i] && now < end) return true
    }
  }
  return false
}

export default function Torneos() {
  const [tournaments, setTournaments] = useState([])
  const [loading, setLoading] = useState(true)
  const [now, setNow] = useState(nowArgentina())

  useEffect(() => {
    const q = query(collection(db, 'tournaments'), orderBy('createdAt', 'desc'))
    const unsub = onSnapshot(q, (snap) => {
      setTournaments(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
      setLoading(false)
    }, (err) => {
      setLoading(false)
      console.error(err)
    })
    return unsub
  }, [])

  useEffect(() => {
    const id = setInterval(() => setNow(nowArgentina()), 30000)
    return () => clearInterval(id)
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
      <h1 className="text-3xl font-bold text-club-yellow mb-2">Torneos</h1>
      <p className="text-gray-400 mb-8">Torneos de pádel</p>

      {tournaments.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <p className="text-lg">No hay torneos disponibles aún</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {tournaments.map((t) => {
            const status = getStatus(t)
            const live = hasLiveMatch(t, now)
            return (
              <Link
                key={t.id}
                to={`/torneos/${t.id}`}
                className="bg-gray-900 rounded-lg border border-gray-800 overflow-hidden hover:border-club-yellow/50 transition group"
              >
                <div className="aspect-video bg-gray-800 flex items-center justify-center overflow-hidden relative">
                  {t.flyer ? (
                    <>
                      <img src={t.flyer} alt="" className="absolute inset-0 w-full h-full object-cover blur-xl opacity-60 scale-110 group-hover:scale-105 transition" />
                      <img src={t.flyer} alt={t.name} className="relative w-full h-full object-contain group-hover:scale-105 transition" />
                    </>
                  ) : (
                    <span className="text-gray-600 text-5xl">🏆</span>
                  )}
                </div>
                <div className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-white font-semibold group-hover:text-club-yellow transition">
                      {t.name}
                    </h3>
                    <div className="flex items-center gap-2">
                      {live && (
                        <span className="text-green-400 text-xs font-bold animate-pulse">● JUGANDO</span>
                      )}
                      <span className={`text-xs px-2 py-0.5 rounded font-medium ${status.color}`}>
                        {status.label}
                      </span>
                    </div>
                  </div>
                  <p className="text-gray-400 text-sm">
                    {t.dateTime
                      ? new Date(t.dateTime).toLocaleString('es-AR', { dateStyle: 'long', timeStyle: 'short' })
                      : 'Fecha a confirmar'}
                  </p>
                  {t.zones && (
                    <p className="text-gray-500 text-xs mt-1">{t.zones.length} zona{t.zones.length !== 1 ? 's' : ''} de {t.teamsPerZone || t.zones[0]?.teams?.filter(Boolean).length || '?'} parejas</p>
                  )}
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
