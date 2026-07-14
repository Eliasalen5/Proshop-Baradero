import { useEffect, useState, useMemo } from 'react'
import { useParams, Link } from 'react-router-dom'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '../services/firebase'
import { toArgentinaDate, nowArgentina } from '../utils/date'

function getStatus(t) {
  if (t.finished) return { label: 'Finalizado', color: 'text-gray-400' }
  if (!t.dateTime) return { label: 'Próximo', color: 'text-green-400' }
  return new Date(t.dateTime) <= new Date()
    ? { label: 'En curso', color: 'text-blue-400' }
    : { label: 'Próximo', color: 'text-green-400' }
}

const medallas = { 1: '🥇', 2: '🥈', 3: '🥉', 4: '🏅' }
const labels = { 1: '1° Puesto', 2: '2° Puesto', 3: '3° Puesto', 4: '4° Puesto' }

function teamName(t) {
  if (!t) return ''
  if (typeof t === 'string') return t
  return t.name || ''
}

function renderScore(m) {
  if (m.sets?.length > 0 && m.sets.some(s => s.s1 !== '' || s.s2 !== '')) {
    return m.sets.map(s => `${s.s1 || '0'}/${s.s2 || '0'}`).join(' ')
  }
  if (m.score) return m.score
  return ''
}

function computeStartDate(tournamentDate, timeStr) {
  if (!tournamentDate || !timeStr) return null
  const [h, m] = timeStr.split(':').map(Number)
  const d = toArgentinaDate(tournamentDate)
  d.setHours(h, m, 0, 0)
  if (h < 6) d.setDate(d.getDate() + 1)
  return d
}

function getMatchStatuses(zones, elimination, tournamentDate, matchDuration, now) {
  if (!tournamentDate) return {}
  const ms = (matchDuration || 60) * 60000
  const byCourt = {}
  zones?.forEach((zone, zi) => {
    zone.matches?.forEach((m, mi) => {
      if (!m.court || !m.time) return
      if (!byCourt[m.court]) byCourt[m.court] = []
      byCourt[m.court].push({ key: `${zi}:${mi}`, start: computeStartDate(tournamentDate, m.time) })
    })
  })
  elimination?.forEach((round, ri) => {
    round.matches?.forEach((m, mi) => {
      if (!m.court || !m.time) return
      if (!byCourt[m.court]) byCourt[m.court] = []
      byCourt[m.court].push({ key: `e:${ri}:${mi}`, start: computeStartDate(tournamentDate, m.time) })
    })
  })
  const statuses = {}
  Object.values(byCourt).forEach((matches) => {
    matches.sort((a, b) => a.start - b.start)
    for (let i = 0; i < matches.length; i++) {
      const windowEnd = matches[i].start.getTime() + ms
      const end = i < matches.length - 1
        ? new Date(Math.min(matches[i + 1].start.getTime(), windowEnd))
        : new Date(windowEnd)
      if (now >= matches[i].start && now < end) statuses[matches[i].key] = 'jugando'
      else if (now >= end) statuses[matches[i].key] = 'finalizado'
    }
  })
  return statuses
}

export default function TournamentDetail() {
  const { id } = useParams()
  const [tournament, setTournament] = useState(null)
  const [loading, setLoading] = useState(true)
  const [now, setNow] = useState(nowArgentina())

  useEffect(() => {
    getDoc(doc(db, 'tournaments', id)).then((snap) => {
      if (snap.exists()) setTournament({ id: snap.id, ...snap.data() })
      setLoading(false)
    })
  }, [id])

  useEffect(() => {
    const id = setInterval(() => setNow(nowArgentina()), 30000)
    return () => clearInterval(id)
  }, [])

  const matchStatuses = useMemo(
    () => getMatchStatuses(tournament?.zones, tournament?.elimination, tournament?.dateTime, tournament?.matchDuration, now),
    [tournament, now]
  )

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-club-yellow" />
      </div>
    )
  }

  if (!tournament) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-400">Torneo no encontrado</p>
        <Link to="/torneos" className="text-club-yellow hover:underline mt-2 inline-block">
          Volver a torneos
        </Link>
      </div>
    )
  }

  const status = getStatus(tournament)

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <Link to="/torneos" className="text-club-yellow hover:underline mb-6 inline-block">
        &larr; Volver a torneos
      </Link>

      <div className="grid md:grid-cols-2 gap-8 mb-10">
        <div className="aspect-video bg-gray-800 rounded-lg flex items-center justify-center overflow-hidden">
          {tournament.flyer ? (
            <img src={tournament.flyer} alt={tournament.name} className="w-full h-full object-cover" />
          ) : (
            <span className="text-gray-600 text-6xl">🏆</span>
          )}
        </div>
        <div>
          <span className={`font-semibold ${status.color}`}>{status.label}</span>
          <h1 className="text-3xl font-bold text-white mt-1">{tournament.name}</h1>
          <div className="mt-4 space-y-2 text-gray-400">
            <p>
              <span className="text-gray-500">Fecha:</span>{' '}
              {tournament.dateTime
                ? new Date(tournament.dateTime).toLocaleDateString('es-AR', {
                    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit',
                  })
                : 'A confirmar'}
            </p>
            {tournament.zones && (
              <p>
                <span className="text-gray-500">
                  {tournament.zones.length} zona{tournament.zones.length !== 1 ? 's' : ''} de{' '}
                  {tournament.teamsPerZone || tournament.zones[0]?.teams?.filter(Boolean).length || '?'} parejas
                </span>
              </p>
            )}
          </div>
          <p className="text-gray-400 mt-4">{tournament.description || 'Sin descripción'}</p>
        </div>
      </div>

      {/* Zonas con partidos */}
      {tournament.zones && tournament.zones.length > 0 && (
        <div className="mb-10 space-y-8">
          <h2 className="text-xl font-bold text-white">Zonas y Partidos</h2>
          {tournament.zones.map((zone, zi) => (
            <div key={zi} className="bg-gray-900 border border-gray-800 rounded-lg p-6">
              <h3 className="text-club-yellow font-semibold text-lg mb-4">{zone.name}</h3>

              <div className="grid md:grid-cols-2 gap-6">
                {/* Parejas */}
                <div>
                  <p className="text-gray-400 text-base mb-3">Parejas</p>
                  {zone.teams?.filter(Boolean).length > 0 ? (
                    <ul className="space-y-2">
                      {zone.teams.filter(Boolean).map((team, ti) => (
                        <li key={ti} className="text-white text-base flex items-center gap-3 bg-gray-800 rounded px-4 py-2">
                          <span className="text-gray-500 font-mono">#{ti + 1}</span> {teamName(team)}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-gray-500 text-base">Sin parejas asignadas</p>
                  )}
                </div>

                {/* Partidos */}
                <div>
                  <p className="text-gray-400 text-base mb-3">Partidos</p>
                  {zone.matches?.length > 0 ? (
                    <div className="space-y-2">
                      {zone.matches.map((m, mi) => (
                        <div key={mi} className="flex gap-3 bg-gray-800 rounded px-3 py-2.5 text-sm items-center">
                          <div className="flex-1 text-white leading-tight">
                            <div>{teamName(zone.teams[m.team1Idx]) || `#${m.team1Idx + 1}`}</div>
                            <div className="text-gray-500 text-xs">vs</div>
                            <div>{teamName(zone.teams[m.team2Idx]) || `#${m.team2Idx + 1}`}</div>
                          </div>
                          <div className="flex flex-col items-end gap-0.5 shrink-0 text-xs">
                            {matchStatuses[`${zi}:${mi}`] === 'jugando' && (
                              <span className="text-green-400 font-bold animate-pulse">● JUGANDO</span>
                            )}
                            {matchStatuses[`${zi}:${mi}`] === 'finalizado' && (
                              <span className="text-gray-500">FINALIZADO</span>
                            )}
                            {renderScore(m) && (
                              <span className="text-white font-semibold whitespace-nowrap">{renderScore(m)}</span>
                            )}
                            {m.court && (
                              <span className="text-gray-400 whitespace-nowrap">{m.court}</span>
                            )}
                            {m.time && (
                              <span className="text-club-yellow font-semibold whitespace-nowrap">{m.time}</span>
                            )}
                            {!m.court && !m.time && !matchStatuses[`${zi}:${mi}`] && !renderScore(m) && (
                              <span className="text-gray-600">—</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-base">Sin partidos</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Eliminatorias */}
      {tournament.elimination && tournament.elimination.length > 0 && (
        <div className="mb-10 space-y-6">
          <h2 className="text-xl font-bold text-white">Eliminatorias</h2>
          {tournament.elimination.map((round, ri) => (
            <div key={ri} className="bg-gray-900 border border-gray-800 rounded-lg p-6">
              <h3 className="text-club-yellow font-semibold text-lg mb-4">{round.name || `Ronda ${ri + 1}`}</h3>
              {round.matches?.length > 0 ? (
                <div className="space-y-2">
                  {round.matches.map((m, mi) => (
                    <div key={mi} className="flex gap-3 bg-gray-800 rounded px-3 py-2.5 text-sm items-center">
                      <div className="flex-1 text-white leading-tight">
                        <div className={m.team1 ? 'text-white' : 'text-gray-500'}>{m.team1 || '—'}</div>
                        <div className="text-gray-500 text-xs">vs</div>
                        <div className={m.team2 ? 'text-white' : 'text-gray-500'}>{m.team2 || '—'}</div>
                      </div>
                      <div className="flex flex-col items-end gap-0.5 shrink-0 text-xs">
                        {matchStatuses[`e:${ri}:${mi}`] === 'jugando' && (
                          <span className="text-green-400 font-bold animate-pulse">● JUGANDO</span>
                        )}
                        {matchStatuses[`e:${ri}:${mi}`] === 'finalizado' && (
                          <span className="text-gray-500">FINALIZADO</span>
                        )}
                        {renderScore(m) && (
                          <span className="text-white font-semibold whitespace-nowrap">{renderScore(m)}</span>
                        )}
                        {m.court && <span className="text-gray-400 whitespace-nowrap">{m.court}</span>}
                        {m.time && <span className="text-club-yellow font-semibold whitespace-nowrap">{m.time}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-base">Sin partidos</p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Podio */}
      {tournament.finished && tournament.results && (
        <div>
          <h2 className="text-xl font-bold text-white mb-4">Resultados</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {['1', '2', '3', '4'].map((pos) => {
              const r = tournament.results[pos]
              if (!r) return null
              return (
                <div key={pos} className={`bg-gray-900 border rounded-lg p-4 text-center ${
                  pos === '1' ? 'border-yellow-600' : pos === '2' ? 'border-gray-500' : pos === '3' ? 'border-amber-800' : 'border-gray-800'
                }`}>
                  <div className="text-3xl mb-2">{medallas[pos]}</div>
                  <div className="w-full aspect-square bg-gray-800 rounded mb-3 overflow-hidden">
                    {r.flyer ? (
                      <img src={r.flyer} alt={r.team} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-600 text-2xl">{medallas[pos]}</div>
                    )}
                  </div>
                  <p className="text-xs text-gray-500">{labels[pos]}</p>
                  <p className="text-white font-semibold mt-1">{r.team || '—'}</p>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
