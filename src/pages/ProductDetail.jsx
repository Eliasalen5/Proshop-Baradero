import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '../services/firebase'

export default function ProductDetail() {
  const { id } = useParams()
  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getDoc(doc(db, 'products', id)).then((snap) => {
      if (snap.exists()) setProduct({ id: snap.id, ...snap.data() })
      setLoading(false)
    }).catch((err) => {
      setLoading(false)
      console.error(err)
    })
  }, [id])

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-club-yellow" />
      </div>
    )
  }

  if (!product) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-400">Producto no encontrado</p>
        <Link to="/proshop" className="text-club-yellow hover:underline mt-2 inline-block">
          Volver al catálogo
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <Link to="/proshop" className="text-club-yellow hover:underline mb-6 inline-block">
        &larr; Volver al catálogo
      </Link>
      <div className="grid md:grid-cols-2 gap-8">
        <div className="aspect-square bg-gray-800 rounded-lg flex items-center justify-center overflow-hidden">
          {product.image ? (
            <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
          ) : (
            <span className="text-gray-600 text-6xl">📦</span>
          )}
        </div>
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">{product.name}</h1>
          {product.category && (
            <span className="text-xs text-gray-500 uppercase bg-gray-800 px-2 py-1 rounded">
              {product.category}
            </span>
          )}
          <p className="text-3xl font-bold text-club-yellow mt-4">
            ${product.price?.toLocaleString('es-AR')}
          </p>
          <p className="text-gray-400 mt-4">{product.description || 'Sin descripción'}</p>
          {product.stock !== undefined && (
            <p className="text-sm text-gray-500 mt-4">
              Stock: {product.stock > 0 ? product.stock : 'No disponible'}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
