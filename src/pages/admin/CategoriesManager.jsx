import { useEffect, useState } from 'react'
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, orderBy } from 'firebase/firestore'
import { db } from '../../services/firebase'

export default function CategoriesManager() {
  const [categories, setCategories] = useState([])
  const [name, setName] = useState('')
  const [editing, setEditing] = useState(null)
  const [editName, setEditName] = useState('')
  const [error, setError] = useState('')

  const load = () => {
    const q = query(collection(db, 'categories'), orderBy('createdAt', 'desc'))
    getDocs(q).then((snap) => setCategories(snap.docs.map((d) => ({ id: d.id, ...d.data() })))).catch((err) => {
      console.error(err)
    })
  }
  useEffect(load, [])

  const handleAdd = async (e) => {
    e.preventDefault()
    setError('')
    if (!name.trim()) return
    try {
      await addDoc(collection(db, 'categories'), { name: name.trim(), createdAt: new Date().toISOString() })
      setName('')
      load()
    } catch (err) {
      setError('Error al crear categoría: ' + err.message)
    }
  }

  const handleEdit = async (id) => {
    setError('')
    if (!editName.trim()) return
    try {
      await updateDoc(doc(db, 'categories', id), { name: editName.trim() })
      setEditing(null)
      setEditName('')
      load()
    } catch (err) {
      setError('Error al editar: ' + err.message)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Eliminar categoría?')) return
    try {
      await deleteDoc(doc(db, 'categories', id))
      load()
    } catch (err) {
      setError('Error al eliminar: ' + err.message)
    }
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-white mb-6">Categorías</h2>

      {error && (
        <div className="bg-red-900/50 text-red-300 p-3 rounded mb-4 text-sm">{error}</div>
      )}

      <form onSubmit={handleAdd} className="bg-gray-900 border border-gray-800 rounded-lg p-6 mb-8 flex gap-3">
        <input
          placeholder="Nombre de la categoría"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="flex-1 bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white"
          required
        />
        <button type="submit" className="bg-club-yellow text-black font-semibold px-6 py-2 rounded hover:bg-yellow-400 transition flex-shrink-0">
          Agregar
        </button>
      </form>

      <div className="space-y-2">
        {categories.map((c) => (
          <div key={c.id} className="bg-gray-900 border border-gray-800 rounded-lg p-4 flex items-center justify-between">
            {editing === c.id ? (
              <div className="flex gap-2 flex-1 mr-4">
                <input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="flex-1 bg-gray-800 border border-gray-700 rounded px-3 py-1.5 text-white text-sm"
                  autoFocus
                />
                <button onClick={() => handleEdit(c.id)} className="text-green-400 hover:text-green-300 text-sm font-semibold">Guardar</button>
                <button onClick={() => { setEditing(null); setEditName('') }} className="text-gray-400 hover:text-white text-sm">Cancelar</button>
              </div>
            ) : (
              <>
                <span className="text-white">{c.name}</span>
                <div className="flex gap-3">
                  <button onClick={() => { setEditing(c.id); setEditName(c.name) }} className="text-blue-400 hover:text-blue-300 text-sm">Editar</button>
                  <button onClick={() => handleDelete(c.id)} className="text-red-400 hover:text-red-300 text-sm">Eliminar</button>
                </div>
              </>
            )}
          </div>
        ))}
        {categories.length === 0 && <p className="text-gray-500 text-center py-8">No hay categorías. Creá la primera.</p>}
      </div>
    </div>
  )
}
