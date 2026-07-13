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
            <p className="text-gray-500 text-base md:text-lg">
              Todo en indumentaria deportiva
            </p>
            <div className="mt-6 inline-block bg-green-700/20 border border-green-500 rounded-lg px-5 py-3 text-left">
              <p className="text-green-400 font-bold text-sm mb-2">🟢 Abierto</p>
              <div className="flex flex-col gap-1 text-gray-300 text-sm md:text-base">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-gray-200 w-20">Lun a Vie:</span>
                  <span>9:00 a.m. - 12:30 p.m.</span>
                  <span className="text-gray-500">/</span>
                  <span>4:30 p.m. - 8:30 p.m.</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-gray-200 w-20">Sábados:</span>
                  <span>9:30 a.m. - 1:00 p.m.</span>
                  <span className="text-gray-500">/</span>
                  <span>4:30 p.m. - 9:00 p.m.</span>
                </div>
              </div>
            </div>
          </div>
        </section>
      ) : (
        <>
          <Carousel images={carouselImages} interval={5000} />
          <div className="max-w-7xl mx-auto px-4 pb-4 -mt-6 text-center">
            <div className="inline-block bg-green-700/20 border border-green-500 rounded-lg px-5 py-3 text-left">
              <p className="text-green-400 font-bold text-sm mb-2">🟢 Abierto</p>
              <div className="flex flex-col gap-1 text-gray-300 text-sm md:text-base">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-gray-200 w-20">Lun a Vie:</span>
                  <span>9:00 a.m. - 12:30 p.m.</span>
                  <span className="text-gray-500">/</span>
                  <span>4:30 p.m. - 8:30 p.m.</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-gray-200 w-20">Sábados:</span>
                  <span>9:30 a.m. - 1:00 p.m.</span>
                  <span className="text-gray-500">/</span>
                  <span>4:30 p.m. - 9:00 p.m.</span>
                </div>
              </div>
            </div>
          </div>
        </>
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
              Torneos de pádel
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
