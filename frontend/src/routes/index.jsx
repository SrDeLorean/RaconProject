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

// Nuevas Páginas Públicas
const Organizaciones = lazy(() => import('@/features/public/pages/Organizaciones'));
const Temporadas = lazy(() => import('@/features/public/pages/Temporadas'));
const Competencias = lazy(() => import('@/features/public/pages/Competencias'));
const DetalleCompetenciaPublica = lazy(() => import('@/features/public/pages/DetalleCompetenciaPublica'));
const Partidos = lazy(() => import('@/features/public/pages/Partidos'));
const Clasificacion = lazy(() => import('@/features/public/pages/Clasificacion'));
const Equipos = lazy(() => import('@/features/public/pages/Equipos'));
const DetalleEquipo = lazy(() => import('@/features/public/pages/DetalleEquipo'));
const Jugadores = lazy(() => import('@/features/public/pages/Jugadores'));
const DetalleJugador = lazy(() => import('@/features/public/pages/DetalleJugador'));
const DetallePartido = lazy(() => import('@/features/public/pages/DetallePartido'));
const Traspasos = lazy(() => import('@/features/public/pages/Traspasos'));
const TotwTots = lazy(() => import('@/features/public/pages/TotwTots'));
const Infografia = lazy(() => import('@/features/public/pages/Infografia'));
const Contacto = lazy(() => import('@/features/public/pages/Contacto'));
const AcercaDe = lazy(() => import('@/features/public/pages/AcercaDe'));
const Datos = lazy(() => import('@/features/public/pages/Datos'));

import PageLoader from '@/components/ui/PageLoader';


export const router = createBrowserRouter([
  // Rutas Públicas
  {
    element: <Suspense fallback={<PageLoader />}><PublicLayout /></Suspense>,
    errorElement: <ErrorBoundary />,
    children: [
      { path: '/', element: <Home /> },
      { path: '/login', element: <Login /> },
      { path: '/registro', element: <Register /> }, 
      { path: '/organizaciones', element: <Organizaciones /> },
      { path: '/organizaciones/:orgId', element: <Temporadas /> },
      { path: '/organizaciones/:orgId/temporadas/:tempId', element: <Competencias /> },
      { path: '/competencia-detalle/:compId', element: <DetalleCompetenciaPublica /> },
      { path: '/partidos', element: <Partidos /> },
      { path: '/partidos/:id', element: <DetallePartido /> },
      { path: '/clasificacion', element: <Clasificacion /> },
      { path: '/equipos', element: <Equipos /> },
      { path: '/equipos/:id', element: <DetalleEquipo /> },
      { path: '/jugadores', element: <Jugadores /> },
      { path: '/jugadores/:id', element: <DetalleJugador /> },
      { path: '/traspasos', element: <Traspasos /> },
      { path: '/totw-tots', element: <TotwTots /> },
      { path: '/infografia', element: <Infografia /> },
      { path: '/datos', element: <Datos /> },
      { path: '/contacto', element: <Contacto /> },
      { path: '/acerca-de', element: <AcercaDe /> },
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