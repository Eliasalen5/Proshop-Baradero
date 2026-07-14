import { useEffect, useState } from 'react'
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, orderBy } from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage'
import { db, storage } from '../../services/firebase'

const emptyForm = { name: '', dateTime: '', description: '', zoneCount: '2', teamsPerZone: '3', flyer: '', matchDuration: '60' }

function getStatus(t) {
  if (t.finished) return { label: 'Finalizado', color: 'bg-gray-800 text-gray-400' }
  if (!t.dateTime) return { label: 'Próximo', color: 'bg-green-900 text-green-300' }
  return new Date(t.dateTime) <= new Date()
    ? { label: 'En curso', color: 'bg-blue-900 text-blue-300' }
    : { label: 'Próximo', color: 'bg-green-900 text-green-300' }
}

function generateMatches(count) {
  const matches = []
  for (let i = 0; i < count; i++) {
    for (let j = i + 1; j < count; j++) {
      matches.push({ team1Idx: i, team2Idx: j, court: '', time: '', sets: [{ s1: '', s2: '' }] })
    }
  }
  return matches
}

function generateZones(count, teamsPer) {
  const letters = 'ABCDEFGH'
  return Array.from({ length: count }, (_, i) => ({
    name: `Zona ${letters[i]}`,
    teams: Array.from({ length: teamsPer }, () => ({ name: '', player1: { uid: '', name: '' }, player2: { uid: '', name: '' } })),
    matches: generateMatches(teamsPer),
  }))
}

const roundSuggestions = ['32avos de final', '16avos de final', 'Octavos de final', 'Cuartos de final', 'Semifinal', 'Final', 'Tercer puesto']

const parseTime = (t) => {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}

export default function TournamentsManager() {
  const [tournaments, setTournaments] = useState([])
  const [users, setUsers] = useState([])
  const [form, setForm] = useState(emptyForm)
  const [editing, setEditing] = useState(null)
  const [file, setFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')

  const [results, setResults] = useState(null)
  const [resultFiles, setResultFiles] = useState({})

  const load = () => {
    const q = query(collection(db, 'tournaments'), orderBy('createdAt', 'desc'))
    getDocs(q).then((snap) => setTournaments(snap.docs.map((d) => ({ id: d.id, ...d.data() }))))
  }
  useEffect(load, [])

  useEffect(() => {
    getDocs(collection(db, 'users')).then((snap) =>
      setUsers(snap.docs.map((d) => ({ uid: d.id, ...d.data() })))
    )
  }, [])

  const zoneCount = Number(form.zoneCount) || 2
  const teamsPerZone = Number(form.teamsPerZone) || 3

  const [formZones, setFormZones] = useState(() => generateZones(2, 3))
  const [elimination, setElimination] = useState([])
  const [expandedScores, setExpandedScores] = useState({})

  useEffect(() => {
    setFormZones(generateZones(zoneCount, teamsPerZone))
  }, [form.zoneCount, form.teamsPerZone])

  const toggleScore = (key) => {
    setExpandedScores((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const addZoneSet = (zi, mi) => {
    const copy = [...formZones]
    copy[zi].matches[mi].sets.push({ s1: '', s2: '' })
    setFormZones(copy)
  }

  const removeZoneSet = (zi, mi, si) => {
    const copy = [...formZones]
    copy[zi].matches[mi].sets = copy[zi].matches[mi].sets.filter((_, i) => i !== si)
    setFormZones(copy)
  }

  const updateZoneSet = (zi, mi, si, field, value) => {
    const copy = [...formZones]
    copy[zi].matches[mi].sets[si][field] = value
    setFormZones(copy)
  }

  const addElimSet = (ri, mi) => {
    const copy = [...elimination]
    copy[ri].matches[mi].sets.push({ s1: '', s2: '' })
    setElimination(copy)
  }

  const removeElimSet = (ri, mi, si) => {
    const copy = [...elimination]
    copy[ri].matches[mi].sets = copy[ri].matches[mi].sets.filter((_, i) => i !== si)
    setElimination(copy)
  }

  const updateElimSet = (ri, mi, si, field, value) => {
    const copy = [...elimination]
    copy[ri].matches[mi].sets[si][field] = value
    setElimination(copy)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    const conflicts = []
    const dur = Number(form.matchDuration) || 60
    const matchesAll = []

    if (form.dateTime) {
      const tournamentStart = new Date(form.dateTime)
      const early = []
      const toFullDate = (timeStr) => {
        const [h, m] = timeStr.split(':').map(Number)
        const d = new Date(tournamentStart)
        d.setHours(h, m, 0, 0)
        if (h < 7) d.setDate(d.getDate() + 1)
        return d
      }
      formZones.forEach((zone) => zone.matches?.forEach((m, mi) => {
        if (m.time && toFullDate(m.time) < tournamentStart) early.push(`Zona ${zone.name} #${mi + 1} (${m.time})`)
      }))
      elimination.forEach((round, ri) => round.matches?.forEach((m, mi) => {
        if (m.time && toFullDate(m.time) < tournamentStart) early.push(`${round.name || `Ronda ${ri + 1}`} #${mi + 1} (${m.time})`)
      }))
      if (early.length > 0) {
        setError('Horarios anteriores al inicio del torneo:\n' + early.join('\n'))
        setUploading(false)
        return
      }
    }

    formZones.forEach((zone) => zone.matches?.forEach((m, mi) => {
      if (m.court && m.time) matchesAll.push({ court: m.court, time: parseTime(m.time), key: `Zona ${zone.name} #${mi + 1}` })
    }))
    elimination.forEach((round, ri) => round.matches?.forEach((m, mi) => {
      if (m.court && m.time) matchesAll.push({ court: m.court, time: parseTime(m.time), key: `${round.name || `Ronda ${ri + 1}`} #${mi + 1}` })
    }))
    for (let i = 0; i < matchesAll.length; i++) {
      for (let j = i + 1; j < matchesAll.length; j++) {
        const a = matchesAll[i], b = matchesAll[j]
        if (a.court !== b.court) continue
        const aEnd = a.time + dur, bEnd = b.time + dur
        if (a.time < bEnd && b.time < aEnd) {
          conflicts.push(`${a.key} y ${b.key} se solapan en ${a.court}`)
        }
      }
    }
    if (conflicts.length > 0) {
      setError('Solapamientos:\n' + conflicts.join('\n'))
      setUploading(false)
      return
    }

    setUploading(true)
    try {
      let flyerUrl = form.flyer
      if (file) {
        const ref_st = ref(storage, `tournaments/${Date.now()}_${file.name}`)
        await uploadBytes(ref_st, file)
        flyerUrl = await getDownloadURL(ref_st)
      }

      const data = {
        name: form.name,
        dateTime: form.dateTime,
        description: form.description,
        flyer: flyerUrl,
        matchDuration: Number(form.matchDuration) || 60,
        zones: formZones,
        elimination,
      }

      if (results) {
        const res = { ...results }
        for (const pos of ['1', '2', '3', '4']) {
          if (resultFiles[pos]) {
            const ref_st = ref(storage, `tournaments/results/${Date.now()}_${pos}_${resultFiles[pos].name}`)
            await uploadBytes(ref_st, resultFiles[pos])
            res[pos].flyer = await getDownloadURL(ref_st)
          }
        }
        data.results = res
        data.finished = true
      }

      if (editing) {
        if (!file) delete data.flyer
        await updateDoc(doc(db, 'tournaments', editing), data)
      } else {
        data.createdAt = new Date().toISOString()
        await addDoc(collection(db, 'tournaments'), data)
      }
      resetForm()
      load()
    } catch (err) {
      setError('Error: ' + err.message)
    }
    setUploading(false)
  }

  const handleEdit = (t) => {
    const rawZones = t.zones || []
    const z = rawZones.map((zone) => ({
      ...zone,
      teams: (zone.teams || []).map((team) =>
        typeof team === 'string'
          ? { name: team, player1: { uid: '', name: '' }, player2: { uid: '', name: '' } }
          : team
      ),
    }))
    setForm({
      name: t.name,
      dateTime: t.dateTime || '',
      description: t.description || '',
      zoneCount: String(z.length || 2),
      teamsPerZone: String(z[0]?.teams?.length || 3),
      flyer: t.flyer || '',
      matchDuration: String(t.matchDuration || '60'),
    })
    setEditing(t.id)
    setFormZones(z.length > 0 ? JSON.parse(JSON.stringify(z)) : generateZones(z.length || 2, z[0]?.teams?.length || 3))
    setElimination(t.elimination ? JSON.parse(JSON.stringify(t.elimination)) : [])
    setResults(t.results ? { ...t.results } : null)
    setResultFiles({})
    setExpandedScores({})
  }

  const handleDelete = async (id, flyerUrl) => {
    if (!confirm('Eliminar torneo?')) return
    try {
      await deleteDoc(doc(db, 'tournaments', id))
      if (flyerUrl) {
        try { await deleteObject(ref(storage, flyerUrl)) } catch {}
      }
      load()
    } catch (err) {
      setError('Error: ' + err.message)
    }
  }

  const resetForm = () => {
    setForm({ ...emptyForm })
    setEditing(null)
    setFile(null)
    setFormZones(generateZones(2, 3))
    setElimination([])
    setResults(null)
    setResultFiles({})
    setExpandedScores({})
  }

  const updatePlayer = (zi, ti, playerIdx, value) => {
    const copy = [...formZones]
    const field = playerIdx === 0 ? 'player1' : 'player2'
    const matched = users.find((u) => (u.displayName || u.name) === value)
    copy[zi].teams[ti][field] = matched ? { uid: matched.uid, name: value } : { uid: '', name: value }
    const p1 = copy[zi].teams[ti].player1?.name || ''
    const p2 = copy[zi].teams[ti].player2?.name || ''
    copy[zi].teams[ti].name = p1 && p2 ? `${p1} / ${p2}` : p1 || p2 || ''
    setFormZones(copy)
  }

  const updateMatchField = (zi, mi, field, value) => {
    const copy = [...formZones]
    copy[zi].matches[mi][field] = value
    setFormZones(copy)
  }

  const teamOptions = formZones.flatMap(z => z.teams.map(t => t.name)).filter(Boolean)

  const addRound = () => {
    setElimination([...elimination, { name: '', matches: [{ team1: '', team2: '', court: '', time: '', sets: [{ s1: '', s2: '' }] }] }])
  }

  const removeRound = (ri) => {
    setElimination(elimination.filter((_, i) => i !== ri))
  }

  const updateRoundName = (ri, value) => {
    const copy = [...elimination]
    copy[ri].name = value
    setElimination(copy)
  }

  const addElimMatch = (ri) => {
    const copy = [...elimination]
    copy[ri].matches.push({ team1: '', team2: '', court: '', time: '', sets: [{ s1: '', s2: '' }] })
    setElimination(copy)
  }

  const removeElimMatch = (ri, mi) => {
    const copy = [...elimination]
    copy[ri].matches = copy[ri].matches.filter((_, i) => i !== mi)
    setElimination(copy)
  }

  const updateElimMatch = (ri, mi, field, value) => {
    const copy = [...elimination]
    copy[ri].matches[mi][field] = value
    setElimination(copy)
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-white mb-6">Torneos</h2>

      {error && (
        <div className="bg-red-900/50 text-red-300 p-3 rounded mb-4 text-sm">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="bg-gray-900 border border-gray-800 rounded-lg p-6 mb-8 space-y-4">
        <h3 className="text-club-yellow font-semibold text-lg">{editing ? 'Editar' : 'Nuevo'} Torneo</h3>
        <div className="grid md:grid-cols-2 gap-4">
          <input placeholder="Nombre del torneo" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white" required />
          <input type="date" value={form.dateTime?.split('T')[0] ?? ''} onChange={(e) => {
            const time = form.dateTime?.split('T')[1] ?? '12:00'
            setForm({ ...form, dateTime: `${e.target.value}T${time}` })
          }} className="bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white" />
          <div className="flex items-center gap-2">
            <span className="text-gray-400 text-sm">Hora:</span>
            <input type="number" min={0} max={23} placeholder="00"
              value={form.dateTime?.split('T')[1]?.split(':')[0] ?? ''}
              onChange={(e) => {
                const date = form.dateTime?.split('T')[0] ?? ''
                const min = form.dateTime?.split('T')[1]?.split(':')[1] ?? '00'
                setForm({ ...form, dateTime: `${date}T${e.target.value.padStart(2, '0')}:${min}` })
              }}
              className="w-14 bg-gray-800 border border-gray-700 rounded px-1.5 py-2 text-white text-sm text-center" />
            <span className="text-gray-500">:</span>
            <input type="number" min={0} max={59} placeholder="00"
              value={form.dateTime?.split('T')[1]?.split(':')[1] ?? ''}
              onChange={(e) => {
                const date = form.dateTime?.split('T')[0] ?? ''
                const hr = form.dateTime?.split('T')[1]?.split(':')[0] ?? '12'
                setForm({ ...form, dateTime: `${date}T${hr}:${e.target.value.padStart(2, '0')}` })
              }}
              className="w-14 bg-gray-800 border border-gray-700 rounded px-1.5 py-2 text-white text-sm text-center" />
          </div>
          <select value={form.zoneCount} onChange={(e) => setForm({ ...form, zoneCount: e.target.value })} className="bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white" required>
            <option value="">Cant. zonas</option>
            {[2, 3, 4, 5, 6, 7, 8].map((n) => (
              <option key={n} value={n}>{n} zonas</option>
            ))}
          </select>
          <select value={form.teamsPerZone} onChange={(e) => setForm({ ...form, teamsPerZone: e.target.value })} className="bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white" required>
            <option value="">Parejas x zona</option>
            {[3, 4, 5, 6].map((n) => (
              <option key={n} value={n}>{n} parejas</option>
            ))}
          </select>
          <div className="flex items-center gap-3">
            <label className="text-gray-400 text-sm whitespace-nowrap">Duración x partido</label>
            <input type="number" min={15} max={180} step={5} value={form.matchDuration}
              onChange={(e) => setForm({ ...form, matchDuration: e.target.value })}
              className="w-24 bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white text-center" />
            <span className="text-gray-500 text-sm">min</span>
          </div>
        </div>
        <textarea placeholder="Descripción" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white" rows={2} />
        <div>
          <p className="text-gray-500 text-sm mb-1">Flyer del torneo</p>
          <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files[0])} className="text-gray-400 text-sm" />
          {form.flyer && !file && <p className="text-gray-600 text-xs mt-1">Tiene flyer actual</p>}
        </div>
      </form>

      {/* Zonas y partidos */}
      <div className="mb-8 space-y-6">
        <h3 className="text-xl font-bold text-white">Zonas y Partidos</h3>
        {formZones.map((zone, zi) => (
          <div key={zi} className="bg-gray-900 border border-gray-800 rounded-lg p-6">
            <h4 className="text-club-yellow font-semibold text-lg mb-4">{zone.name}</h4>

            <div className="mb-4">
              <p className="text-gray-400 text-sm mb-2">Parejas</p>
              <div className="grid gap-3">
                {zone.teams.map((team, ti) => (
                  <div key={ti} className="bg-gray-800 rounded p-3">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <p className="text-gray-500 text-xs mb-1">Jugador 1</p>
                        <input placeholder="Nombre" value={team.player1?.name || ''}
                          onChange={(e) => updatePlayer(zi, ti, 0, e.target.value)}
                          list={`players-${zi}-${ti}-0`}
                          className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1.5 text-white text-sm" />
                        <datalist id={`players-${zi}-${ti}-0`}>
                          {users.map((u) => <option key={u.uid} value={u.displayName || u.name || ''} />)}
                        </datalist>
                      </div>
                      <div>
                        <p className="text-gray-500 text-xs mb-1">Jugador 2</p>
                        <input placeholder="Nombre" value={team.player2?.name || ''}
                          onChange={(e) => updatePlayer(zi, ti, 1, e.target.value)}
                          list={`players-${zi}-${ti}-1`}
                          className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1.5 text-white text-sm" />
                        <datalist id={`players-${zi}-${ti}-1`}>
                          {users.map((u) => <option key={u.uid} value={u.displayName || u.name || ''} />)}
                        </datalist>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <p className="text-gray-400 text-sm mb-2">Partidos</p>
              <div className="space-y-2">
                {zone.matches.map((m, mi) => {
                  const zkey = `z:${zi}:${mi}`
                  const open = expandedScores[zkey]
                  return (
                    <div key={mi} className="bg-gray-800 rounded">
                      <div className="flex items-center gap-3 px-4 py-2">
                        <span className="text-white text-sm flex-1">
                          <span className={zone.teams[m.team1Idx]?.name ? 'text-white' : 'text-gray-500'}>
                            {zone.teams[m.team1Idx]?.name || `Pareja ${m.team1Idx + 1}`}
                          </span>
                          <span className="text-gray-500 mx-2">vs</span>
                          <span className={zone.teams[m.team2Idx]?.name ? 'text-white' : 'text-gray-500'}>
                            {zone.teams[m.team2Idx]?.name || `Pareja ${m.team2Idx + 1}`}
                          </span>
                        </span>
                        <select value={m.court} onChange={(e) => updateMatchField(zi, mi, 'court', e.target.value)}
                          className="bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white text-sm">
                          <option value="">Cancha</option>
                          <option value="Cancha 1">Cancha 1</option>
                          <option value="Cancha 2">Cancha 2</option>
                        </select>
                        <div className="flex items-center gap-1">
                          <input type="number" min={0} max={23} placeholder="00"
                            value={m.time?.split(':')[0] ?? ''}
                            onChange={(e) => {
                              const min = m.time?.split(':')[1] ?? '00'
                              updateMatchField(zi, mi, 'time', `${e.target.value.padStart(2, '0')}:${min}`)
                            }}
                            className="w-14 bg-gray-700 border border-gray-600 rounded px-1.5 py-1 text-white text-sm text-center" />
                          <span className="text-gray-500">:</span>
                          <input type="number" min={0} max={59} placeholder="00"
                            value={m.time?.split(':')[1] ?? ''}
                            onChange={(e) => {
                              const hr = m.time?.split(':')[0] ?? '00'
                              updateMatchField(zi, mi, 'time', `${hr}:${e.target.value.padStart(2, '0')}`)
                            }}
                            className="w-14 bg-gray-700 border border-gray-600 rounded px-1.5 py-1 text-white text-sm text-center" />
                        </div>
                        <button type="button" onClick={() => toggleScore(zkey)}
                          className="text-club-yellow hover:text-yellow-400 text-sm transition whitespace-nowrap">
                          {open ? '▼' : m.sets?.some(s => s.s1 !== '' || s.s2 !== '') ? '✎ Resultado' : '+ Resultado'}
                        </button>
                      </div>
                      {open && (
                        <div className="px-4 pb-3 pt-2 border-t border-gray-700">
                          {m.sets?.map((set, si) => (
                            <div key={si} className="flex items-center gap-2 mt-1.5">
                              <span className="text-gray-500 text-xs w-10">Set {si + 1}</span>
                              <input type="number" min={0} placeholder="0" value={set.s1}
                                onChange={(e) => updateZoneSet(zi, mi, si, 's1', e.target.value)}
                                className="w-12 bg-gray-700 border border-gray-600 rounded px-1.5 py-1 text-white text-center text-sm" />
                              <span className="text-gray-500 text-sm">-</span>
                              <input type="number" min={0} placeholder="0" value={set.s2}
                                onChange={(e) => updateZoneSet(zi, mi, si, 's2', e.target.value)}
                                className="w-12 bg-gray-700 border border-gray-600 rounded px-1.5 py-1 text-white text-center text-sm" />
                              {m.sets.length > 1 && (
                                <button type="button" onClick={() => removeZoneSet(zi, mi, si)}
                                  className="text-red-400 hover:text-red-300 text-xs ml-1">✕</button>
                              )}
                            </div>
                          ))}
                          <button type="button" onClick={() => addZoneSet(zi, mi)}
                            className="text-club-yellow hover:text-yellow-400 text-xs mt-2 transition">
                            + Agregar set
                          </button>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Eliminatorias */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-white">Eliminatorias</h3>
          <button type="button" onClick={addRound}
            className="bg-club-yellow text-black font-semibold px-4 py-2 rounded hover:bg-yellow-400 transition text-sm">
            + Agregar ronda
          </button>
        </div>
        {elimination.length === 0 && (
          <p className="text-gray-500 text-sm mb-4">Sin eliminatorias. Agregá una ronda.</p>
        )}
        {elimination.map((round, ri) => (
          <div key={ri} className="bg-gray-900 border border-gray-800 rounded-lg p-6 mb-4">
            <div className="flex items-center gap-3 mb-4">
              <input placeholder="Nombre de la ronda" value={round.name}
                onChange={(e) => updateRoundName(ri, e.target.value)}
                list={`round-suggestions-${ri}`}
                className="flex-1 bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white font-semibold" />
              <datalist id={`round-suggestions-${ri}`}>
                {roundSuggestions.map((s) => <option key={s} value={s} />)}
              </datalist>
              <button type="button" onClick={() => removeRound(ri)}
                className="text-red-400 hover:text-red-300 text-sm">Eliminar ronda</button>
            </div>
            <div className="space-y-2">
              {round.matches.map((m, mi) => {
                const ekey = `e:${ri}:${mi}`
                const open = expandedScores[ekey]
                const eligibleTeams = (() => {
                  const hierarchy = [
                    { cur: '32avos', prev: null },
                    { cur: '16avos', prev: '32avos' },
                    { cur: 'octav', prev: '16avos' },
                    { cur: 'cuart', prev: 'octav' },
                    { cur: 'semif', prev: 'cuart' },
                    { cur: 'final', prev: 'semif' },
                    { cur: 'tercer', prev: 'semif' },
                  ]
                  const name = round.name?.toLowerCase() || ''
                  const match = hierarchy.find(h => name.includes(h.cur))
                  let prevIdx = -1
                  if (match?.prev) {
                    prevIdx = elimination.findIndex(r => r.name?.toLowerCase().includes(match.prev))
                  }
                  if (prevIdx >= 0) {
                    return [...new Set(elimination[prevIdx].matches.flatMap(pm => [pm.team1, pm.team2].filter(Boolean)))]
                  }
                  if (ri > 0) {
                    return [...new Set(elimination[ri - 1].matches.flatMap(pm => [pm.team1, pm.team2].filter(Boolean)))]
                  }
                  return teamOptions
                })()
                return (
                  <div key={mi} className="bg-gray-800 rounded">
                    <div className="flex items-center gap-3 px-4 py-2">
                      {(() => {
                        const isTercer = round.name?.toLowerCase().includes('tercer')
                        return (
                          <>
                            <select value={m.team1} onChange={(e) => updateElimMatch(ri, mi, 'team1', e.target.value)}
                              className="flex-1 bg-gray-700 border border-gray-600 rounded px-2 py-1.5 text-white text-sm">
                              <option value="" disabled>{isTercer ? 'Perdedor' : 'Clasificado'}</option>
                              {eligibleTeams.map(name => <option key={name} value={name}>{name}</option>)}
                            </select>
                            <span className="text-gray-500 text-sm">vs</span>
                            <select value={m.team2} onChange={(e) => updateElimMatch(ri, mi, 'team2', e.target.value)}
                              className="flex-1 bg-gray-700 border border-gray-600 rounded px-2 py-1.5 text-white text-sm">
                              <option value="" disabled>{isTercer ? 'Perdedor' : 'Clasificado'}</option>
                              {eligibleTeams.map(name => <option key={name} value={name}>{name}</option>)}
                            </select>
                          </>
                        )
                      })()}
                      <select value={m.court} onChange={(e) => updateElimMatch(ri, mi, 'court', e.target.value)}
                        className="bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white text-sm">
                        <option value="">Cancha</option>
                        <option value="Cancha 1">Cancha 1</option>
                        <option value="Cancha 2">Cancha 2</option>
                      </select>
                      <div className="flex items-center gap-1">
                        <input type="number" min={0} max={23} placeholder="00"
                          value={m.time?.split(':')[0] ?? ''}
                          onChange={(e) => {
                            const min = m.time?.split(':')[1] ?? '00'
                            updateElimMatch(ri, mi, 'time', `${e.target.value.padStart(2, '0')}:${min}`)
                          }}
                          className="w-14 bg-gray-700 border border-gray-600 rounded px-1.5 py-1 text-white text-sm text-center" />
                        <span className="text-gray-500">:</span>
                        <input type="number" min={0} max={59} placeholder="00"
                          value={m.time?.split(':')[1] ?? ''}
                          onChange={(e) => {
                            const hr = m.time?.split(':')[0] ?? '00'
                            updateElimMatch(ri, mi, 'time', `${hr}:${e.target.value.padStart(2, '0')}`)
                          }}
                          className="w-14 bg-gray-700 border border-gray-600 rounded px-1.5 py-1 text-white text-sm text-center" />
                      </div>
                      <button type="button" onClick={() => toggleScore(ekey)}
                        className="text-club-yellow hover:text-yellow-400 text-sm transition whitespace-nowrap">
                        {open ? '▼' : m.sets?.some(s => s.s1 !== '' || s.s2 !== '') ? '✎ Resultado' : '+ Resultado'}
                      </button>
                      <button type="button" onClick={() => removeElimMatch(ri, mi)}
                        className="text-red-400 hover:text-red-300 text-sm">✕</button>
                    </div>
                    {open && (
                      <div className="px-4 pb-3 pt-2 border-t border-gray-700">
                        {m.sets?.map((set, si) => (
                          <div key={si} className="flex items-center gap-2 mt-1.5">
                            <span className="text-gray-500 text-xs w-10">Set {si + 1}</span>
                            <input type="number" min={0} placeholder="0" value={set.s1}
                              onChange={(e) => updateElimSet(ri, mi, si, 's1', e.target.value)}
                              className="w-12 bg-gray-700 border border-gray-600 rounded px-1.5 py-1 text-white text-center text-sm" />
                            <span className="text-gray-500 text-sm">-</span>
                            <input type="number" min={0} placeholder="0" value={set.s2}
                              onChange={(e) => updateElimSet(ri, mi, si, 's2', e.target.value)}
                              className="w-12 bg-gray-700 border border-gray-600 rounded px-1.5 py-1 text-white text-center text-sm" />
                            {m.sets.length > 1 && (
                              <button type="button" onClick={() => removeElimSet(ri, mi, si)}
                                className="text-red-400 hover:text-red-300 text-xs ml-1">✕</button>
                            )}
                          </div>
                        ))}
                        <button type="button" onClick={() => addElimSet(ri, mi)}
                          className="text-club-yellow hover:text-yellow-400 text-xs mt-2 transition">
                          + Agregar set
                        </button>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
            <button type="button" onClick={() => addElimMatch(ri)}
              className="mt-3 text-club-yellow hover:text-yellow-400 text-sm transition">
              + Agregar partido
            </button>
          </div>
        ))}
      </div>

      {/* Resultados / Podio */}
      <div className="mb-8">
        <h3 className="text-xl font-bold text-white mb-4">Resultados</h3>
        {!results ? (
          <button type="button" onClick={() => {
            const r = {}
            for (let i = 1; i <= 4; i++) r[String(i)] = { team: '', flyer: '' }
            setResults(r)
          }} className="bg-gray-800 text-white px-4 py-2 rounded hover:bg-gray-700 transition text-sm">
            Cargar resultados
          </button>
        ) : (
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
            {(() => {
              const finalTeams = elimination
                .find(r => {
                  const n = r.name?.toLowerCase() || ''
                  return n.includes('final') && !n.includes('semi')
                })
                ?.matches?.flatMap(m => [m.team1, m.team2].filter(Boolean)) || []
              const tercerTeams = elimination
                .find(r => r.name?.toLowerCase().includes('tercer'))
                ?.matches?.flatMap(m => [m.team1, m.team2].filter(Boolean)) || []
              return (
                <div className="grid md:grid-cols-2 gap-4 mb-4">
                  {['1', '2', '3', '4'].map((pos) => {
                    const labels = { 1: '1° Puesto', 2: '2° Puesto', 3: '3° Puesto', 4: '4° Puesto' }
                    const opts = ['1', '2'].includes(pos) ? finalTeams : tercerTeams
                    return (
                      <div key={pos} className="bg-gray-800 rounded p-3">
                        <p className="text-club-yellow font-semibold text-sm mb-2">{labels[pos]}</p>
                        <select value={results[pos]?.team || ''}
                          onChange={(e) => setResults({ ...results, [pos]: { ...results[pos], team: e.target.value } })}
                          className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-1.5 text-white text-sm mb-2">
                          <option value="">Seleccionar pareja</option>
                          {opts.map(name => <option key={name} value={name}>{name}</option>)}
                        </select>
                        <div>
                          <p className="text-gray-500 text-xs mb-1">Flyer del puesto</p>
                          <input type="file" accept="image/*" onChange={(e) => setResultFiles({ ...resultFiles, [pos]: e.target.files[0] })} className="text-gray-400 text-xs" />
                          {results[pos]?.flyer && !resultFiles[pos] && <p className="text-gray-600 text-xs mt-1">Tiene flyer</p>}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )
            })()}
            <button type="button" onClick={() => { setResults(null); setResultFiles({}) }}
              className="text-gray-400 hover:text-white text-sm transition">
              Quitar resultados
            </button>
          </div>
        )}
      </div>

      {/* Botones de acción */}
      <div className="flex gap-3 mb-8">
        <button onClick={handleSubmit} disabled={uploading}
          className="bg-club-yellow text-black font-semibold px-8 py-3 rounded hover:bg-yellow-400 transition disabled:opacity-50 text-lg">
          {uploading ? 'Guardando...' : editing ? 'Guardar cambios' : 'Crear torneo'}
        </button>
        {editing && (
          <button type="button" onClick={resetForm}
            className="text-gray-400 hover:text-white transition px-4 py-3">
            Cancelar
          </button>
        )}
      </div>

      {/* Lista de torneos */}
      <div className="grid gap-3">
        {tournaments.map((t) => {
          const status = getStatus(t)
          return (
            <div key={t.id} className="bg-gray-900 border border-gray-800 rounded-lg p-4 flex items-center gap-4">
              <div className="w-20 h-14 bg-gray-800 rounded overflow-hidden flex-shrink-0">
                {t.flyer ? <img src={t.flyer} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-gray-600">🏆</div>}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-medium">{t.name}</p>
                <p className="text-gray-400 text-sm">{t.dateTime ? new Date(t.dateTime).toLocaleString('es-AR') : 'Sin fecha'}</p>
                <span className={`text-xs px-2 py-0.5 rounded ${status.color}`}>{status.label}</span>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <button onClick={() => handleEdit(t)} className="text-blue-400 hover:text-blue-300 text-sm">Editar</button>
                <button onClick={() => handleDelete(t.id, t.flyer)} className="text-red-400 hover:text-red-300 text-sm">Eliminar</button>
              </div>
            </div>
          )
        })}
        {tournaments.length === 0 && <p className="text-gray-500 text-center py-8">No hay torneos. Creá el primero.</p>}
      </div>
    </div>
  )
}
