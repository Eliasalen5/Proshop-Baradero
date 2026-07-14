import { useState, useEffect, useRef } from 'react'

export default function Carousel({ images = [], interval = 10000, fullscreen = false, hero = null }) {
  const slideCount = images.length + (hero ? 1 : 0)
  const [current, setCurrent] = useState(0)
  const [paused, setPaused] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const containerRef = useRef(null)
  const timerRef = useRef(null)
  const touchStartX = useRef(null)
  const isFullscreenRef = useRef(isFullscreen)
  isFullscreenRef.current = isFullscreen

  useEffect(() => {
    if (slideCount <= 1 || paused) return
    timerRef.current = setInterval(() => {
      setCurrent((prev) => (prev + 1) % slideCount)
    }, interval)
    return () => clearInterval(timerRef.current)
  }, [slideCount, interval, paused])

  useEffect(() => {
    const handler = () => setIsFullscreen(!!(document.fullscreenElement || document.webkitFullscreenElement))
    const escHandler = (e) => { if (e.key === 'Escape' && isFullscreenRef.current && !document.fullscreenElement) setIsFullscreen(false) }
    document.addEventListener('fullscreenchange', handler)
    document.addEventListener('webkitfullscreenchange', handler)
    document.addEventListener('keydown', escHandler)
    return () => {
      document.removeEventListener('fullscreenchange', handler)
      document.removeEventListener('webkitfullscreenchange', handler)
      document.removeEventListener('keydown', escHandler)
    }
  }, [])

  const toggleFullscreen = () => {
    const el = containerRef.current
    if (!el) return
    if (isFullscreen && !document.fullscreenElement && !document.webkitFullscreenElement) {
      setIsFullscreen(false)
    } else if (!document.fullscreenElement && !document.webkitFullscreenElement) {
      const req = el.requestFullscreen?.() || el.webkitRequestFullscreen?.()
      if (!req) {
        setIsFullscreen(true)
      }
    } else {
      document.exitFullscreen?.() || document.webkitExitFullscreen?.()
    }
  }

  if (slideCount === 0) return null

  const isFixed = isFullscreen && !fullscreen

  const renderSlide = (index) => {
    if (hero && index === 0) {
      return (
        <div key={index} className="min-w-full h-full relative flex-shrink-0 overflow-hidden bg-gradient-to-br from-black via-gray-900 to-black flex items-center justify-center px-6 py-8">
          <div className="text-center max-w-3xl">
            <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold text-club-yellow mb-3 drop-shadow-lg">
              {hero.title || 'Proshop Baradero'}
            </h1>
            {hero.subtitle && (
              <p className="text-gray-300 text-sm md:text-base lg:text-lg mb-4 drop-shadow">
                {hero.subtitle}
              </p>
            )}
            {hero.children}
          </div>
        </div>
      )
    }
    const imgIndex = hero ? index - 1 : index
    const img = images[imgIndex]
    if (!img) return null
    return (
      <div key={index} className="min-w-full h-full relative flex-shrink-0 overflow-hidden">
        <img
          src={img.imageUrl}
          alt=""
          className="absolute inset-0 w-full h-full object-cover blur-md opacity-60 scale-110"
        />
        <img
          src={img.imageUrl}
          alt={img.title || ''}
          className="absolute inset-0 w-full h-full object-contain z-10"
        />
        {(img.title || img.description) && (
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex items-end p-6 md:p-10 z-20">
            <div>
              {img.title && <h2 className="text-white text-xl md:text-4xl font-bold drop-shadow-lg">{img.title}</h2>}
              {img.description && <p className="text-gray-200 text-sm md:text-lg mt-1 drop-shadow">{img.description}</p>}
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      className={`${isFixed ? 'fixed inset-0 z-[9999]' : 'relative w-full h-[300px] sm:h-[400px] md:h-[500px] lg:h-[600px]'} overflow-hidden bg-gray-900`}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={(e) => { touchStartX.current = e.touches[0].clientX; setPaused(true) }}
      onTouchMove={(e) => {
        if (touchStartX.current === null) return
        const diff = touchStartX.current - e.touches[0].clientX
        if (Math.abs(diff) > 50) {
          if (diff > 0 && current < slideCount - 1) setCurrent(c => c + 1)
          else if (diff < 0 && current > 0) setCurrent(c => c - 1)
          touchStartX.current = null
        }
      }}
      onTouchEnd={() => { touchStartX.current = null; setPaused(false) }}
    >
      {isFullscreen && (
        <div className="absolute top-4 left-4 z-30 flex items-center gap-2">
          <img src="/logo.png" alt="Proshop Baradero" className="w-8 h-8 object-contain" />
          <span className="text-club-yellow text-xl font-bold tracking-wider drop-shadow-lg">
            PROSHOP BARADERO
          </span>
        </div>
      )}

      <div
        className="flex h-full transition-transform duration-700 ease-in-out"
        style={{ transform: `translateX(-${current * 100}%)` }}
      >
        {Array.from({ length: slideCount }).map((_, i) => renderSlide(i))}
      </div>

      {slideCount > 1 && (
        <div className="absolute bottom-3 md:bottom-5 left-1/2 -translate-x-1/2 flex gap-2 z-10">
          {Array.from({ length: slideCount }).map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`w-2.5 h-2.5 rounded-full transition-all ${i === current ? 'bg-club-yellow scale-125' : 'bg-white/50 hover:bg-white/80'}`}
            />
          ))}
        </div>
      )}

      <button
        onClick={toggleFullscreen}
        className="absolute top-3 right-3 z-20 bg-black/40 text-white p-2 rounded hover:bg-black/60 transition"
        title={isFullscreen ? "Salir de pantalla completa" : "Pantalla completa"}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          {isFullscreen ? (
            <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3" />
          ) : (
            <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
          )}
        </svg>
      </button>
    </div>
  )
}
