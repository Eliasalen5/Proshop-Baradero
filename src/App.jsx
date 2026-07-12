import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'
import AdminRoute from './components/AdminRoute'
import Loading from './components/Loading'

const AdminLayout = lazy(() => import('./pages/admin/AdminLayout'))
const Home = lazy(() => import('./pages/Home'))
const Proshop = lazy(() => import('./pages/Proshop'))
const ProductDetail = lazy(() => import('./pages/ProductDetail'))
const Torneos = lazy(() => import('./pages/Torneos'))
const TournamentDetail = lazy(() => import('./pages/TournamentDetail'))
const ClubBeneficios = lazy(() => import('./pages/ClubBeneficios'))
const Login = lazy(() => import('./pages/Login'))
const Register = lazy(() => import('./pages/Register'))
const ResetPassword = lazy(() => import('./pages/ResetPassword'))
const Profile = lazy(() => import('./pages/Profile'))
const Dashboard = lazy(() => import('./pages/admin/Dashboard'))
const ProductsManager = lazy(() => import('./pages/admin/ProductsManager'))
const TournamentsManager = lazy(() => import('./pages/admin/TournamentsManager'))
const BenefitsManager = lazy(() => import('./pages/admin/BenefitsManager'))
const UsersManager = lazy(() => import('./pages/admin/UsersManager'))

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Suspense fallback={<Loading />}>
          <Routes>
            <Route element={<Layout />}>
              <Route path="/" element={<Home />} />
              <Route path="/proshop" element={<Proshop />} />
              <Route path="/proshop/:id" element={<ProductDetail />} />
              <Route path="/torneos" element={<Torneos />} />
              <Route path="/torneos/:id" element={<TournamentDetail />} />
              <Route path="/club-beneficios" element={<ClubBeneficios />} />
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
              </Route>
            </Route>
          </Routes>
        </Suspense>
      </AuthProvider>
    </BrowserRouter>
  )
}
