export default function Footer() {
  return (
    <footer className="bg-black border-t border-yellow-600/30 mt-auto">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-club-yellow font-bold text-lg mb-2">Proshop Baradero</h3>
            <p className="text-gray-400 text-sm">
              Los mejores productos, torneos y beneficios.
            </p>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-2">Navegación</h4>
            <ul className="text-gray-400 text-sm space-y-1">
              <li>Proshop</li>
              <li>Torneos</li>
              <li>Club Beneficios</li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-2">Contacto</h4>
            <ul className="text-gray-400 text-sm space-y-1">
              <li>info@proshopbaradero.com</li>
              <li>@proshopbaradero</li>
            </ul>
          </div>
        </div>
        <div className="border-t border-gray-800 mt-6 pt-4 text-center text-gray-500 text-xs">
          &copy; {new Date().getFullYear()} Proshop Baradero. Todos los derechos reservados.
        </div>
      </div>
    </footer>
  )
}
