import { useState, useEffect, useRef } from 'react'

export default function Carousel({ images = [], interval = 10000 }) {
  const [current, setCurrent] = useState(0)
  const [paused, setPaused] = useState(false)
  const timerRef = useRef(null)

  useEffect(() => {
    if (images.length <= 1 || paused) return
    timerRef.current = setInterval(() => {
      setCurrent((prev) => (prev + 1) % images.length)
    }, interval)
    return () => clearInterval(timerRef.current)
  }, [images.length, interval, paused])

  if (images.length === 0) return null

  return (
    <div
      className="relative w-full overflow-hidden bg-gray-900"
      style={{ aspectRatio: '21/9' }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div
        className="flex h-full transition-transform duration-700 ease-in-out"
        style={{ transform: `translateX(-${current * 100}%)` }}
      >
        {images.map((img, i) => (
          <div key={i} className="min-w-full h-full relative flex-shrink-0">
            <img
              src={img.imageUrl}
              alt={img.title || ''}
              className="w-full h-full object-cover"
            />
            {(img.title || img.description) && (
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex items-end p-6 md:p-10">
                <div>
                  {img.title && <h2 className="text-white text-xl md:text-4xl font-bold drop-shadow-lg">{img.title}</h2>}
                  {img.description && <p className="text-gray-200 text-sm md:text-lg mt-1 drop-shadow">{img.description}</p>}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {images.length > 1 && (
        <div className="absolute bottom-3 md:bottom-5 left-1/2 -translate-x-1/2 flex gap-2">
          {images.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`w-2.5 h-2.5 rounded-full transition-all ${i === current ? 'bg-club-yellow scale-125' : 'bg-white/50 hover:bg-white/80'}`}
            />
          ))}
        </div>
      )}
    </div>
  )
}
