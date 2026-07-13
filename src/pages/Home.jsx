import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { collection, query, orderBy, getDocs } from 'firebase/firestore'
import { db } from '../services/firebase'
import Carousel from '../components/Carousel'

export default function Home() {
  const [carouselImages, setCarouselImages] = useState(null)

  useEffect(() => {
    const q = query(collection(db, 'carousel'), orderBy('order', 'asc'))
    getDocs(q).then((snap) => {
      const imgs = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
      setCarouselImages(imgs.length > 0 ? imgs : [])
    })
  }, [])

  return (
    <div>
      {carouselImages === null || carouselImages.length === 0 ? (
        <section className="relative bg-gradient-to-br from-black via-gray-900 to-black py-24 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-club-yellow mb-4">
              Proshop Baradero
            </h1>
            <p className="text-gray-400 text-lg md:text-xl">
              Tu tienda de confianza
            </p>
          </div>
        </section>
      ) : (
        <Carousel images={carouselImages} interval={5000} />
      )}

      <section className="max-w-7xl mx-auto px-4 py-16">
        <div className="grid md:grid-cols-3 gap-8">
          <Link to="/proshop" className="bg-gray-900 p-6 rounded-lg border border-gray-800 text-center block hover:border-club-yellow/50 transition group">
            <div className="text-club-yellow text-3xl mb-3">🏪</div>
            <h3 className="text-white font-bold text-lg mb-2 group-hover:text-club-yellow transition">Proshop</h3>
            <p className="text-gray-400 text-sm">
              Productos de primera calidad
            </p>
          </Link>
          <Link to="/torneos" className="bg-gray-900 p-6 rounded-lg border border-gray-800 text-center block hover:border-club-yellow/50 transition group">
            <div className="text-club-yellow text-3xl mb-3">🏆</div>
            <h3 className="text-white font-bold text-lg mb-2 group-hover:text-club-yellow transition">Torneos</h3>
            <p className="text-gray-400 text-sm">
              Torneos de pádel en parejas
            </p>
          </Link>
          <Link to="/club-beneficios" className="bg-gray-900 p-6 rounded-lg border border-gray-800 text-center block hover:border-club-yellow/50 transition group">
            <div className="text-club-yellow text-3xl mb-3">🎁</div>
            <h3 className="text-white font-bold text-lg mb-2 group-hover:text-club-yellow transition">Club Beneficios</h3>
            <p className="text-gray-400 text-sm">
              Canjeá tus puntos por productos con descuento
            </p>
          </Link>
        </div>
      </section>
    </div>
  )
}
