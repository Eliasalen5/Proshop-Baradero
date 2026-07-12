import { useEffect, useState } from 'react'
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, orderBy } from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage'
import { db, storage } from '../../services/firebase'

export default function CarouselManager() {
  const [images, setImages] = useState([])
  const [file, setFile] = useState(null)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')

  const load = () => {
    const q = query(collection(db, 'carousel'), orderBy('order', 'asc'))
    getDocs(q).then((snap) => setImages(snap.docs.map((d) => ({ id: d.id, ...d.data() }))))
  }
  useEffect(load, [])

  const handleUpload = async (e) => {
    e.preventDefault()
    if (!file) return
    setError('')
    setUploading(true)
    try {
      const storageRef = ref(storage, `carousel/${Date.now()}_${file.name}`)
      await uploadBytes(storageRef, file)
      const imageUrl = await getDownloadURL(storageRef)
      const maxOrder = images.length > 0 ? Math.max(...images.map((img) => img.order || 0)) : 0
      await addDoc(collection(db, 'carousel'), {
        imageUrl,
        title: title || '',
        description: description || '',
        order: maxOrder + 1,
        createdAt: new Date().toISOString(),
      })
      setFile(null)
      setTitle('')
      setDescription('')
      load()
    } catch (err) {
      setError('Error: ' + err.message)
    }
    setUploading(false)
  }

  const moveUp = async (i) => {
    if (i === 0) return
    const a = images[i], b = images[i - 1]
    await updateDoc(doc(db, 'carousel', a.id), { order: b.order })
    await updateDoc(doc(db, 'carousel', b.id), { order: a.order })
    load()
  }

  const moveDown = async (i) => {
    if (i === images.length - 1) return
    const a = images[i], b = images[i + 1]
    await updateDoc(doc(db, 'carousel', a.id), { order: b.order })
    await updateDoc(doc(db, 'carousel', b.id), { order: a.order })
    load()
  }

  const handleDelete = async (id, imageUrl) => {
    if (!confirm('Eliminar imagen?')) return
    try {
      await deleteDoc(doc(db, 'carousel', id))
      if (imageUrl) {
        try { await deleteObject(ref(storage, imageUrl)) } catch {}
      }
      load()
    } catch (err) {
      setError('Error: ' + err.message)
    }
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-white mb-6">Carrusel</h2>
      {error && <div className="bg-red-900/50 text-red-300 p-3 rounded mb-4 text-sm">{error}</div>}

      {images.length >= 5 ? (
        <div className="bg-yellow-900/30 border border-yellow-600/30 rounded-lg p-4 mb-8 text-yellow-300 text-sm">
          Límite alcanzado. Eliminá una imagen para poder subir otra (máximo 5).
        </div>
      ) : (
        <form onSubmit={handleUpload} className="bg-gray-900 border border-gray-800 rounded-lg p-6 mb-8 space-y-4">
          <h3 className="text-club-yellow font-semibold">Agregar imagen ({images.length}/5)</h3>
          <div>
            <p className="text-gray-500 text-sm mb-1">Imagen (recomendado 1920x820 o 21:9)</p>
            <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files[0])} className="text-gray-400 text-sm" required />
          </div>
          <input placeholder="Título (opcional)" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white" />
          <input placeholder="Descripción (opcional)" value={description} onChange={(e) => setDescription(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white" />
          <button type="submit" disabled={uploading || !file} className="bg-club-yellow text-black font-semibold px-6 py-2 rounded hover:bg-yellow-400 transition disabled:opacity-50">
            {uploading ? 'Subiendo...' : 'Agregar'}
          </button>
        </form>
      )}

      <div className="grid gap-3">
        {images.map((img, i) => (
          <div key={img.id} className="bg-gray-900 border border-gray-800 rounded-lg p-4 flex items-center gap-4">
            <div className="w-40 h-[80px] sm:h-[100px] bg-gray-800 rounded overflow-hidden flex-shrink-0 relative">
              {img.imageUrl ? (
                <>
                  <img src={img.imageUrl} alt="" className="absolute inset-0 w-full h-full object-cover blur-sm opacity-40 scale-110" />
                  <img src={img.imageUrl} alt="" className="relative w-full h-full object-contain" />
                </>
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-600">?</div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-medium truncate">{img.title || 'Sin título'}</p>
              {img.description && <p className="text-gray-400 text-sm truncate">{img.description}</p>}
              <p className="text-gray-500 text-xs mt-1">Orden: {img.order}</p>
            </div>
            <div className="flex gap-1 flex-shrink-0">
              <button onClick={() => moveUp(i)} disabled={i === 0} className="text-gray-400 hover:text-white text-lg disabled:opacity-30 px-1" title="Subir">&uarr;</button>
              <button onClick={() => moveDown(i)} disabled={i === images.length - 1} className="text-gray-400 hover:text-white text-lg disabled:opacity-30 px-1" title="Bajar">&darr;</button>
              <button onClick={() => handleDelete(img.id, img.imageUrl)} className="text-red-400 hover:text-red-300 text-sm ml-2">Eliminar</button>
            </div>
          </div>
        ))}
        {images.length === 0 && <p className="text-gray-500 text-center py-8">No hay imágenes. Agregá la primera.</p>}
      </div>
    </div>
  )
}
