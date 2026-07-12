import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { collection, getDocs, query, orderBy } from 'firebase/firestore'
import { db } from '../services/firebase'

export default function Proshop() {
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [selected, setSelected] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      getDocs(query(collection(db, 'products'), orderBy('createdAt', 'desc'))),
      getDocs(query(collection(db, 'categories'), orderBy('createdAt', 'desc'))),
    ]).then(([pSnap, cSnap]) => {
      setProducts(pSnap.docs.map((d) => ({ id: d.id, ...d.data() })))
      setCategories(cSnap.docs.map((d) => ({ id: d.id, ...d.data() })))
      setLoading(false)
    })
  }, [])

  const filtered = selected
    ? products.filter((p) => p.category === selected)
    : products

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-club-yellow" />
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold text-club-yellow mb-2">Proshop</h1>
      <p className="text-gray-400 mb-6">Productos</p>

      {categories.length > 0 && (
        <div className="flex gap-2 mb-8 overflow-x-auto flex-nowrap whitespace-nowrap -mx-4 px-4 md:mx-0 md:px-0 pb-1">
          <button
            onClick={() => setSelected('')}
            className={`px-4 py-1.5 rounded text-sm transition ${
              !selected ? 'bg-club-yellow text-black font-semibold' : 'bg-gray-800 text-gray-400 hover:text-white'
            }`}
          >
            Todas
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelected(c.name)}
              className={`px-4 py-1.5 rounded text-sm transition ${
                selected === c.name ? 'bg-club-yellow text-black font-semibold' : 'bg-gray-800 text-gray-400 hover:text-white'
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <p className="text-lg">No hay productos en esta categoría</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filtered.map((product) => (
            <Link
              key={product.id}
              to={`/proshop/${product.id}`}
              className="bg-gray-900 rounded-lg border border-gray-800 overflow-hidden hover:border-club-yellow/50 transition group"
            >
              <div className="aspect-square bg-gray-800 flex items-center justify-center overflow-hidden">
                {product.image ? (
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition"
                  />
                ) : (
                  <span className="text-gray-600 text-4xl">📦</span>
                )}
              </div>
              <div className="p-4">
                <h3 className="text-white font-semibold group-hover:text-club-yellow transition">
                  {product.name}
                </h3>
                <p className="text-club-yellow font-bold text-lg mt-1">
                  ${product.price?.toLocaleString('es-AR')}
                </p>
                {product.category && (
                  <span className="text-xs text-gray-500 uppercase">{product.category}</span>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
