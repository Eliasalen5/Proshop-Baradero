import { useEffect, useState } from 'react'
import { collection, query, orderBy, getDocs } from 'firebase/firestore'
import { db } from '../services/firebase'
import Carousel from '../components/Carousel'
import { Link } from 'react-router-dom'

export default function Pantalla() {
  const [images, setImages] = useState([])

  useEffect(() => {
    const q = query(collection(db, 'carousel'), orderBy('order', 'asc'))
    getDocs(q).then((snap) => setImages(snap.docs.map((d) => ({ id: d.id, ...d.data() }))))
  }, [])

  return (
    <div className="fixed inset-0 bg-black z-50 flex items-center justify-center">
      {images.length > 0 ? (
        <div className="w-full h-full">
          <Carousel images={images} interval={5000} fullscreen />
        </div>
      ) : (
        <div className="text-center">
          <p className="text-gray-500 text-lg">Sin imágenes</p>
        </div>
      )}
      <div className="absolute top-4 left-4 z-20">
        <span className="text-club-yellow text-xl font-bold tracking-wider drop-shadow-lg">
          PROSHOP BARADERO
        </span>
      </div>
      <Link
        to="/"
        className="absolute top-4 right-4 z-20 bg-black/40 text-white px-3 py-1.5 rounded text-sm hover:bg-black/60 transition"
      >
        Salir
      </Link>
    </div>
  )
}
