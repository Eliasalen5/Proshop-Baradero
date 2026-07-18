import { useEffect, useState } from 'react'
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, orderBy, where } from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage'
import { db, storage } from '../../services/firebase'

const emptyForm = { name: '', description: '', price: '', category: '', image: '' }

export default function ProductsManager() {
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [form, setForm] = useState(emptyForm)
  const [editing, setEditing] = useState(null)
  const [file, setFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')

  const loadProducts = () => {
    const q = query(collection(db, 'products'), orderBy('createdAt', 'desc'))
    getDocs(q).then((snap) => setProducts(snap.docs.map((d) => ({ id: d.id, ...d.data() }))))
  }

  const loadCategories = () => {
    getDocs(query(collection(db, 'categories'), orderBy('createdAt', 'desc'))).then((snap) =>
      setCategories(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    )
  }

  useEffect(() => { loadProducts(); loadCategories() }, [])

  const ensureCategory = async (name) => {
    const q = query(collection(db, 'categories'), where('name', '==', name))
    const snap = await getDocs(q)
    if (snap.empty) {
      await addDoc(collection(db, 'categories'), { name, createdAt: new Date().toISOString() })
      loadCategories()
    }
  }

  const handleDeleteCategory = async (id, name) => {
    if (!confirm(`Eliminar categoría "${name}"?`)) return
    try {
      await deleteDoc(doc(db, 'categories', id))
      loadCategories()
    } catch (err) {
      setError('Error al eliminar categoría: ' + err.message)
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
        const storageRef = ref(storage, `products/${Date.now()}_${file.name}`)
        await uploadBytes(storageRef, file)
        imageUrl = await getDownloadURL(storageRef)
      }

      await ensureCategory(form.category)

      if (editing) {
        const data = { name: form.name, description: form.description, price: Number(form.price), category: form.category }
        if (imageUrl) data.image = imageUrl
        await updateDoc(doc(db, 'products', editing), data)
      } else {
        await addDoc(collection(db, 'products'), {
          name: form.name,
          description: form.description,
          price: Number(form.price),
          category: form.category,
          image: imageUrl,
          createdAt: new Date().toISOString(),
        })
      }
      setForm(emptyForm)
      setEditing(null)
      setFile(null)
      loadProducts()
    } catch (err) {
      setError('Error: ' + err.message)
    }
    setUploading(false)
  }

  const handleEdit = (p) => {
    setForm({ name: p.name, description: p.description || '', price: String(p.price), category: p.category || '', image: p.image })
    setEditing(p.id)
  }

  const handleDelete = async (id, imageUrl) => {
    if (!confirm('Eliminar producto?')) return
    try {
      await deleteDoc(doc(db, 'products', id))
      if (imageUrl) {
        try { await deleteObject(ref(storage, imageUrl)) } catch {}
      }
      loadProducts()
    } catch (err) {
      setError('Error al eliminar: ' + err.message)
    }
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-white mb-6">Productos</h2>

      {error && (
        <div className="bg-red-900/50 text-red-300 p-3 rounded mb-4 text-sm">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="bg-gray-900 border border-gray-800 rounded-lg p-6 mb-8 space-y-4">
        <h3 className="text-club-yellow font-semibold">{editing ? 'Editar' : 'Nuevo'} Producto</h3>
        <div className="grid md:grid-cols-2 gap-4">
          <input placeholder="Nombre" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white" required />
          <input placeholder="Precio" type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className="bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white" required />
          <div>
            <input
              list="category-list"
              placeholder={categories.length === 0 ? 'Escribí la categoría (ej: Indumentaria)' : 'Escribí o seleccioná una categoría'}
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white"
              required
            />
            <datalist id="category-list">
              {categories.map((c) => (
                <option key={c.id} value={c.name} />
              ))}
            </datalist>
            {categories.length > 0 && (
              <div className="mt-3">
                <p className="text-xs text-gray-500 mb-1.5">Categorías existentes:</p>
                <div className="flex flex-wrap gap-2">
                  {(() => {
                    const used = {}
                    products.forEach(p => { used[p.category] = (used[p.category] || 0) + 1 })
                    return categories.map((c) => {
                      const count = used[c.name] || 0
                      return (
                        <div key={c.id} className="flex items-center gap-1 bg-gray-800 rounded px-2 py-1 text-xs text-white">
                          <span>{c.name} ({count})</span>
                          {count === 0 && (
                            <button
                              type="button"
                              onClick={() => handleDeleteCategory(c.id, c.name)}
                              className="text-red-400 hover:text-red-300 ml-0.5"
                              title="Eliminar categoría"
                            >
                              ✕
                            </button>
                          )}
                        </div>
                      )
                    })
                  })()}
                </div>
              </div>
            )}
          </div>
        </div>
        <textarea placeholder="Descripción" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white" rows={2} />
        <div className="flex flex-wrap items-center gap-3">
          <label className="inline-flex items-center gap-1.5 bg-club-yellow text-black font-semibold px-4 py-2 rounded hover:bg-yellow-400 transition cursor-pointer text-sm">
            <span className="text-lg leading-none">+</span>
            Elegir imagen
            <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files[0])} className="hidden" />
          </label>
          {file && <span className="text-gray-400 text-sm">{file.name}</span>}
          {!file && form.image && <span className="text-gray-500 text-sm">Tiene imagen actual</span>}
        </div>
        <div className="flex gap-2">
          <button type="submit" disabled={uploading} className="bg-club-yellow text-black font-semibold px-6 py-2 rounded hover:bg-yellow-400 transition disabled:opacity-50">
            {uploading ? 'Subiendo...' : editing ? 'Guardar cambios' : 'Agregar'}
          </button>
          {editing && (
            <button type="button" onClick={() => { setForm(emptyForm); setEditing(null); setFile(null) }} className="text-gray-400 hover:text-white transition">
              Cancelar
            </button>
          )}
        </div>
      </form>

      <>
        <div className="mb-4">
          <input placeholder="Buscar por nombre o categoría..." value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white" />
        </div>

        {!search ? (
          <p className="text-gray-500 text-center py-8">
            {products.length === 0 ? 'No hay productos. Creá el primero.' : 'Buscá un producto por nombre o categoría'}
          </p>
        ) : (
          <div className="grid gap-3">
            {(() => {
              const term = search.toLowerCase()
              const filtered = products.filter((p) =>
                (p.name?.toLowerCase() || '').includes(term) ||
                (p.category?.toLowerCase() || '').includes(term)
              )
              if (filtered.length === 0) {
                return <p className="text-gray-500 text-center py-8">No se encontraron productos</p>
              }
              return filtered.map((p) => (
              <div key={p.id} className="bg-gray-900 border border-gray-800 rounded-lg p-4 flex items-center gap-4">
                <div className="w-16 h-16 bg-gray-800 rounded overflow-hidden flex-shrink-0">
                  {p.image ? <img src={p.image} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-gray-600">📦</div>}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-medium truncate">{p.name}</p>
                  <p className="text-club-yellow text-sm font-bold">${p.price?.toLocaleString('es-AR')}</p>
                  <p className="text-gray-500 text-xs uppercase">{p.category}</p>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <button onClick={() => handleEdit(p)} className="text-blue-400 hover:text-blue-300 text-sm">Editar</button>
                  <button onClick={() => handleDelete(p.id, p.image)} className="text-red-400 hover:text-red-300 text-sm">Eliminar</button>
                </div>
              </div>
              ))
            })()}
          </div>
        )}
      </>
    </div>
  )
}
