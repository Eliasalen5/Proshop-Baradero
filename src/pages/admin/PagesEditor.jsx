import { useState, useEffect } from 'react'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { db, storage } from '../../services/firebase'

const pages = ['home', 'proshop', 'torneos', 'beneficios']

export default function PagesEditor() {
  const [selected, setSelected] = useState('home')
  const [content, setContent] = useState({})
  const [file, setFile] = useState(null)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    getDoc(doc(db, 'pages', selected)).then((snap) => {
      if (snap.exists()) setContent(snap.data())
      else setContent({})
    })
  }, [selected])

  const handleSave = async () => {
    setSaving(true)
    setMessage('')
    let heroImage = content.heroImage
    if (file) {
      const storageRef = ref(storage, `pages/${selected}_${Date.now()}_${file.name}`)
      await uploadBytes(storageRef, file)
      heroImage = await getDownloadURL(storageRef)
    }
    await setDoc(doc(db, 'pages', selected), { ...content, heroImage }, { merge: true })
    setMessage('Guardado correctamente')
    setSaving(false)
    setFile(null)
  }

  const labels = {
    home: 'Home',
    proshop: 'Proshop',
    torneos: 'Torneos',
    beneficios: 'Club Beneficios',
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-white mb-6">Editar Páginas</h2>
      <div className="flex gap-2 mb-6">
        {pages.map((p) => (
          <button
            key={p}
            onClick={() => setSelected(p)}
            className={`px-4 py-2 rounded text-sm transition ${
              selected === p ? 'bg-club-yellow text-black font-semibold' : 'bg-gray-800 text-gray-400 hover:text-white'
            }`}
          >
            {labels[p]}
          </button>
        ))}
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 space-y-4">
        <h3 className="text-club-yellow font-semibold">Contenido - {labels[selected]}</h3>

        {selected === 'home' && (
          <>
            <input
              placeholder="Título del hero"
              value={content.heroTitle || ''}
              onChange={(e) => setContent({ ...content, heroTitle: e.target.value })}
              className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white"
            />
            <input
              placeholder="Subtítulo del hero"
              value={content.heroSubtitle || ''}
              onChange={(e) => setContent({ ...content, heroSubtitle: e.target.value })}
              className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white"
            />
          </>
        )}

        <textarea
          placeholder="Descripción / Contenido"
          value={content.description || ''}
          onChange={(e) => setContent({ ...content, description: e.target.value })}
          className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white"
          rows={4}
        />

        <div>
          <p className="text-gray-500 text-sm mb-1">Imagen de banner</p>
          <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files[0])} className="text-gray-400 text-sm" />
        </div>

        {message && <p className="text-green-400 text-sm">{message}</p>}

        <button onClick={handleSave} disabled={saving} className="bg-club-yellow text-black font-semibold px-6 py-2 rounded hover:bg-yellow-400 transition disabled:opacity-50">
          {saving ? 'Guardando...' : 'Guardar cambios'}
        </button>
      </div>
    </div>
  )
}
