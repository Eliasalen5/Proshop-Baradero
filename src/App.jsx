import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'
import AdminRoute from './components/AdminRoute'
import AdminLayout from './pages/admin/AdminLayout'
import Home from './pages/Home'
import Proshop from './pages/Proshop'
import ProductDetail from './pages/ProductDetail'
import Torneos from './pages/Torneos'
import TournamentDetail from './pages/TournamentDetail'
import ClubBeneficios from './pages/ClubBeneficios'
import BenefitDetail from './pages/BenefitDetail'
import Login from './pages/Login'
import Register from './pages/Register'
import ResetPassword from './pages/ResetPassword'
import Profile from './pages/Profile'
import Dashboard from './pages/admin/Dashboard'
import ProductsManager from './pages/admin/ProductsManager'
import TournamentsManager from './pages/admin/TournamentsManager'
import BenefitsManager from './pages/admin/BenefitsManager'
import UsersManager from './pages/admin/UsersManager'
import CarouselManager from './pages/admin/CarouselManager'
import VerificarCanje from './pages/VerificarCanje'
import Pantalla from './pages/Pantalla'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/verificar/:code" element={<VerificarCanje />} />
          <Route path="/pantalla" element={<Pantalla />} />
          <Route element={<Layout />}>
            <Route path="/" element={<Home />} />
            <Route path="/proshop" element={<Proshop />} />
            <Route path="/proshop/:id" element={<ProductDetail />} />
            <Route path="/torneos" element={<Torneos />} />
            <Route path="/torneos/:id" element={<TournamentDetail />} />
            <Route path="/club-beneficios" element={<ClubBeneficios />} />
            <Route path="/club-beneficios/:id" element={<BenefitDetail />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route
              path="/perfil"
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin"
              element={
                <AdminRoute>
                  <AdminLayout />
                </AdminRoute>
              }
            >
              <Route index element={<Dashboard />} />
              <Route path="tournaments" element={<TournamentsManager />} />
              <Route path="products" element={<ProductsManager />} />
              <Route path="benefits" element={<BenefitsManager />} />
              <Route path="users" element={<UsersManager />} />
              <Route path="carousel" element={<CarouselManager />} />
            </Route>
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
