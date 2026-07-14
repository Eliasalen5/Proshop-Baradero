import { useEffect, useState } from 'react'
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, orderBy, where } from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage'
import { db, storage } from '../../services/firebase'

const emptyForm = { name: '', description: '', pointsRequired: '', price: '', discount: '', category: '', image: '', active: true }

export default function BenefitsManager() {
  const [benefits, setBenefits] = useState([])
  const [categories, setCategories] = useState([])
  const [form, setForm] = useState(emptyForm)
  const [editing, setEditing] = useState(null)
  const [file, setFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')

  const load = () => {
    const q = query(collection(db, 'benefits'), orderBy('createdAt', 'desc'))
    getDocs(q).then((snap) => setBenefits(snap.docs.map((d) => ({ id: d.id, ...d.data() }))))
  }

  const loadCategories = () => {
    getDocs(query(collection(db, 'categories'), orderBy('createdAt', 'desc'))).then((snap) =>
      setCategories(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    )
  }

  useEffect(() => { load(); loadCategories() }, [])

  const ensureCategory = async (name) => {
    if (!name) return
    const q = query(collection(db, 'categories'), where('name', '==', name))
    const snap = await getDocs(q)
    if (snap.empty) {
      await addDoc(collection(db, 'categories'), { name, createdAt: new Date().toISOString() })
      loadCategories()
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setUploading(true)
    try {
      let imageUrl = form.image
      if (file) {
        if (editing && form.image) {
          try { await deleteObject(ref(storage, form.image)) } catch {}
        }
        const storageRef = ref(storage, `benefits/${Date.now()}_${file.name}`)
        await uploadBytes(storageRef, file)
        imageUrl = await getDownloadURL(storageRef)
      }

      await ensureCategory(form.category)

      const data = {
        name: form.name,
        description: form.description,
        pointsRequired: form.pointsRequired ? Number(form.pointsRequired) : null,
        price: form.price ? Number(form.price) : null,
        discount: form.discount ? Number(form.discount) : null,
        category: form.category || null,
        image: imageUrl,
        active: form.active,
      }

      if (editing) {
        await updateDoc(doc(db, 'benefits', editing), data)
      } else {
        data.createdAt = new Date().toISOString()
        await addDoc(collection(db, 'benefits'), data)
      }
      setForm(emptyForm)
      setEditing(null)
      setFile(null)
      load()
    } catch (err) {
      setError('Error: ' + err.message)
    }
    setUploading(false)
  }

  const handleEdit = (b) => {
    setForm({
      name: b.name,
      description: b.description || '',
      pointsRequired: String(b.pointsRequired || ''),
      price: String(b.price || ''),
      discount: String(b.discount || ''),
      category: b.category || '',
      image: b.image || '',
      active: b.active !== false,
    })
    setEditing(b.id)
  }

  const handleDelete = async (id, imageUrl) => {
    if (!confirm('Eliminar beneficio?')) return
    try {
      await deleteDoc(doc(db, 'benefits', id))
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
      <h2 className="text-2xl font-bold text-white mb-6">Beneficios</h2>

      {error && (
        <div className="bg-red-900/50 text-red-300 p-3 rounded mb-4 text-sm">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="bg-gray-900 border border-gray-800 rounded-lg p-6 mb-8 space-y-4">
        <h3 className="text-club-yellow font-semibold">{editing ? 'Editar' : 'Nuevo'} Beneficio</h3>
        <div className="grid md:grid-cols-2 gap-4">
          <input placeholder="Nombre del producto" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white" required />
          <div>
            <input placeholder="Puntos requeridos (opcional)" type="number" value={form.pointsRequired} onChange={(e) => setForm({ ...form, pointsRequired: e.target.value })}
              className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white" />
          </div>
          <div>
            <input placeholder="Precio $ (opcional)" type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })}
              className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white" />
          </div>
          <div>
            <input placeholder="Descuento % (opcional)" type="number" value={form.discount} onChange={(e) => setForm({ ...form, discount: e.target.value })}
              className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white" />
          </div>
          <div>
            <input list="category-list" placeholder="Categoría (opcional)" value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white" />
            <datalist id="category-list">
              {categories.map((c) => <option key={c.id} value={c.name} />)}
            </datalist>
          </div>
        </div>
        <textarea placeholder="Descripción" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white" rows={2} />
        <div>
          <p className="text-gray-500 text-sm mb-1">Imagen del producto</p>
          <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files[0])} className="text-gray-400 text-sm" />
        </div>
        <label className="flex items-center gap-2 text-gray-400 text-sm">
          <input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} />
          Activo (visible para usuarios)
        </label>
        <div className="flex gap-2">
          <button type="submit" disabled={uploading} className="bg-club-yellow text-black font-semibold px-6 py-2 rounded hover:bg-yellow-400 transition disabled:opacity-50">
            {uploading ? 'Subiendo...' : editing ? 'Guardar cambios' : 'Agregar'}
          </button>
          {editing && (
            <button type="button" onClick={() => { setForm(emptyForm); setEditing(null); setFile(null) }} className="text-gray-400 hover:text-white transition">Cancelar</button>
          )}
        </div>
      </form>

      <div className="grid gap-3">
        {benefits.map((b) => (
          <div key={b.id} className="bg-gray-900 border border-gray-800 rounded-lg p-4 flex items-center gap-4">
            <div className="w-16 h-16 bg-gray-800 rounded overflow-hidden flex-shrink-0">
              {b.image ? <img src={b.image} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-gray-600">🎁</div>}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-medium">{b.name} {!b.active && <span className="text-gray-500 text-xs">(oculto)</span>}</p>
              <div className="flex flex-wrap gap-2 mt-1">
                {b.pointsRequired && <span className="text-club-yellow text-sm font-bold">{b.pointsRequired} pts</span>}
                {b.price && <span className="text-green-400 text-sm font-bold">${b.price?.toLocaleString('es-AR')}</span>}
                {b.discount && <span className="text-green-400 text-xs bg-green-900/50 px-1.5 py-0.5 rounded">-{b.discount}%</span>}
                {b.category && <span className="text-gray-500 text-xs uppercase">{b.category}</span>}
              </div>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <button onClick={() => handleEdit(b)} className="text-blue-400 hover:text-blue-300 text-sm">Editar</button>
              <button onClick={() => handleDelete(b.id, b.image)} className="text-red-400 hover:text-red-300 text-sm">Eliminar</button>
            </div>
          </div>
        ))}
        {benefits.length === 0 && <p className="text-gray-500 text-center py-8">No hay beneficios. Creá el primero.</p>}
      </div>
    </div>
  )
}
