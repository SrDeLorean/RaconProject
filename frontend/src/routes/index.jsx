import { createBrowserRouter } from 'react-router-dom';
import { lazy, Suspense } from 'react';

// Importaciones estáticas
import { adminRoutes } from './adminRoutes.jsx';
import { organizadorRoutes } from './organizadorRoutes.jsx';
import { jugadorRoutes } from './jugadorRoutes.jsx';

import ErrorBoundary from '@/components/ErrorBoundary';

// Importaciones dinámicas (Code Splitting)
const PublicLayout = lazy(() => import('@/layouts/PublicLayout'));
const Home = lazy(() => import('@/features/public/pages/Home'));
const Login = lazy(() => import('@/features/auth/pages/Login'));
const Register = lazy(() => import('@/features/auth/pages/Register'));
const ProtectedRoute = lazy(() => import('@/components/ProtectedRoute'));

// 💎 Pantalla de Carga Global Premium (Ajustada al nuevo diseño HSL)
const PageLoader = () => (
  <div className="min-h-screen bg-background flex flex-col items-center justify-center overflow-hidden relative">
    
    {/* Resplandor ambiental de fondo para la pantalla de carga */}
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-primary/10 rounded-full blur-[100px] pointer-events-none z-0 animate-pulse"></div>

    <div className="flex flex-col items-center gap-6 animate-fade-in relative z-10">
      {/* Logo R idéntico al del Login/Navbar */}
      <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-primary to-destructive flex items-center justify-center text-primary-foreground font-display font-black text-4xl shadow-[0_0_20px_hsla(var(--primary),0.5)] animate-bounce">
        R
      </div>
      <p className="text-xs font-bold text-muted-foreground tracking-[0.3em] uppercase animate-pulse">
        Cargando Sistema...
      </p>
    </div>
  </div>
);

export const router = createBrowserRouter([
  // Rutas Públicas
  {
    element: <Suspense fallback={<PageLoader />}><PublicLayout /></Suspense>,
    errorElement: <ErrorBoundary />,
    children: [
      { path: '/', element: <Home /> },
      { path: '/login', element: <Login /> },
      { path: '/registro', element: <Register /> }, 
    ],
  },
  
  // Rutas Privadas: ADMIN
  {
    element: <Suspense fallback={<PageLoader />}><ProtectedRoute allowedRoles={['admin']} /></Suspense>,
    errorElement: <ErrorBoundary />,
    children: [adminRoutes],
  },
  
  // Rutas Privadas: ORGANIZADOR
  {
    element: <Suspense fallback={<PageLoader />}><ProtectedRoute allowedRoles={['organizador']} /></Suspense>,
    errorElement: <ErrorBoundary />,
    children: [organizadorRoutes],
  },
  
  // Rutas Privadas: JUGADOR
  {
    element: <Suspense fallback={<PageLoader />}><ProtectedRoute allowedRoles={['jugador']} /></Suspense>,
    errorElement: <ErrorBoundary />,
    children: [jugadorRoutes],
  }
]);