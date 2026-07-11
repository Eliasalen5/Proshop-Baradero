import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '../services/firebase'

export default function Home() {
  const [pageData, setPageData] = useState(null)

  useEffect(() => {
    getDoc(doc(db, 'pages', 'home')).then((snap) => {
      if (snap.exists()) setPageData(snap.data())
    })
  }, [])

  return (
    <div>
      <section className="relative bg-gradient-to-br from-black via-gray-900 to-black py-24 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-club-yellow mb-4">
            {pageData?.heroTitle || 'Bienvenido a Proshop Baradero'}
          </h1>
          <p className="text-gray-400 text-lg md:text-xl mb-8">
            {pageData?.heroSubtitle || 'Tu club deportivo de confianza'}
          </p>
          <div className="flex justify-center gap-4">
            <Link
              to="/proshop"
              className="bg-club-yellow text-black font-bold px-6 py-3 rounded hover:bg-yellow-400 transition"
            >
              Ver Productos
            </Link>
            <Link
              to="/torneos"
              className="border border-club-yellow text-club-yellow px-6 py-3 rounded hover:bg-club-yellow/10 transition"
            >
              Torneos
            </Link>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 py-16">
        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-gray-900 p-6 rounded-lg border border-gray-800 text-center">
            <div className="text-club-yellow text-3xl mb-3">🏪</div>
            <h3 className="text-white font-bold text-lg mb-2">Proshop</h3>
            <p className="text-gray-400 text-sm">
              Productos deportivos de primera calidad
            </p>
          </div>
          <div className="bg-gray-900 p-6 rounded-lg border border-gray-800 text-center">
            <div className="text-club-yellow text-3xl mb-3">🏆</div>
            <h3 className="text-white font-bold text-lg mb-2">Torneos</h3>
            <p className="text-gray-400 text-sm">
              Torneos de pádel en parejas
            </p>
          </div>
          <div className="bg-gray-900 p-6 rounded-lg border border-gray-800 text-center">
            <div className="text-club-yellow text-3xl mb-3">🎁</div>
            <h3 className="text-white font-bold text-lg mb-2">Club Beneficios</h3>
            <p className="text-gray-400 text-sm">
              Canjeá tus puntos por productos con descuento
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}
