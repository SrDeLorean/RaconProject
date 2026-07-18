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
const Home11v11 = lazy(() => import('@/features/public/pages/Home11v11'));
const HomeUT = lazy(() => import('@/features/public/pages/HomeUT'));
const TestAnimations = lazy(() => import('@/features/public/pages/TestAnimations'));
const Login = lazy(() => import('@/features/auth/pages/Login'));
const Register = lazy(() => import('@/features/auth/pages/Register'));
const VerificarCorreo = lazy(() => import('@/features/auth/pages/VerificarCorreo'));
const ProtectedRoute = lazy(() => import('@/components/ProtectedRoute'));

// Nuevas Páginas Públicas
const Organizaciones = lazy(() => import('@/features/public/pages/Organizaciones'));
const Temporadas = lazy(() => import('@/features/public/pages/Temporadas'));
const Competencias = lazy(() => import('@/features/public/pages/Competencias'));
const DetalleCompetenciaPublica = lazy(() => import('@/features/public/pages/DetalleCompetenciaPublica'));
const DetalleCompetenciaUtPublica = lazy(() => import('@/features/public/pages/DetalleCompetenciaUtPublica'));
const Partidos = lazy(() => import('@/features/public/pages/Partidos'));
const PartidosUt = lazy(() => import('@/features/public/pages/PartidosUt'));
const Clasificacion = lazy(() => import('@/features/public/pages/Clasificacion'));
const ClasificacionUt = lazy(() => import('@/features/public/pages/ClasificacionUt'));
const Equipos = lazy(() => import('@/features/public/pages/Equipos'));
const DetalleEquipo = lazy(() => import('@/features/public/pages/DetalleEquipo'));
const Jugadores = lazy(() => import('@/features/public/pages/Jugadores'));
const DetalleJugador = lazy(() => import('@/features/public/pages/DetalleJugador'));
const DetallePartido = lazy(() => import('@/features/public/pages/DetallePartido'));
const DetallePartidoUt = lazy(() => import('@/features/public/pages/DetallePartidoUt'));
const Traspasos = lazy(() => import('@/features/public/pages/Traspasos'));
const TotwTots = lazy(() => import('@/features/public/pages/TotwTots'));
const Infografia = lazy(() => import('@/features/public/pages/Infografia'));
const Contacto = lazy(() => import('@/features/public/pages/Contacto'));
const AcercaDe = lazy(() => import('@/features/public/pages/AcercaDe'));
const Datos = lazy(() => import('@/features/public/pages/Datos'));
const Usuarios = lazy(() => import('@/features/public/pages/Usuarios'));
const JugadoresUt = lazy(() => import('@/features/public/pages/JugadoresUt'));
const InfografiaUt = lazy(() => import('@/features/public/pages/InfografiaUt'));
const DatosUt = lazy(() => import('@/features/public/pages/DatosUt'));
const Terms = lazy(() => import('@/features/public/pages/Terms'));
const NotFound = lazy(() => import('@/features/public/pages/NotFound'));


import PageLoader from '@/components/ui/PageLoader';


export const router = createBrowserRouter([
  // Rutas Públicas
  {
    element: <Suspense fallback={<PageLoader />}><PublicLayout /></Suspense>,
    errorElement: <ErrorBoundary />,
    children: [
      { path: '/', element: <Home /> },
      { path: '/11v11', element: <Home11v11 /> },
      { path: '/ut', element: <HomeUT /> },
      { path: '/test-animaciones', element: <TestAnimations /> },
      { path: '/login', element: <Login /> },
      { path: '/registro', element: <Register /> }, 
      { path: '/verificar-correo', element: <VerificarCorreo /> }, 
      { path: '/organizaciones', element: <Organizaciones /> },
      { path: '/organizaciones/:orgId', element: <Temporadas /> },
      { path: '/organizaciones/:orgId/temporadas/:tempId', element: <Competencias /> },
      { path: '/competencia-detalle/:compId', element: <DetalleCompetenciaPublica /> },
      { path: '/competencia-ut-detalle/:compId', element: <DetalleCompetenciaUtPublica /> },
      { path: '/partidos', element: <Partidos /> },
      { path: '/partidos-ut', element: <PartidosUt /> },
      { path: '/partidos/:id', element: <DetallePartido /> },
      { path: '/partidos-ut/:id', element: <DetallePartidoUt /> },
      { path: '/clasificacion', element: <Clasificacion /> },
      { path: '/clasificacion-ut', element: <ClasificacionUt /> },
      { path: '/equipos', element: <Equipos /> },
      { path: '/equipos/:id', element: <DetalleEquipo /> },
      { path: '/jugadores', element: <Jugadores /> },
      { path: '/jugadores/:id', element: <DetalleJugador /> },
      { path: '/traspasos', element: <Traspasos /> },
      { path: '/totw-tots', element: <TotwTots /> },
      { path: '/infografia', element: <Infografia /> },
      { path: '/datos', element: <Datos /> },
      { path: '/usuarios', element: <Usuarios /> },
      { path: '/jugadores-ut', element: <JugadoresUt /> },
      { path: '/infografia-ut', element: <InfografiaUt /> },
      { path: '/datos-ut', element: <DatosUt /> },
      { path: '/contacto', element: <Contacto /> },
      { path: '/acerca-de', element: <AcercaDe /> },
      { path: '/terminos', element: <Terms /> },
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
  },

  // 404 Catch-all
  {
    path: '*',
    element: <Suspense fallback={<PageLoader />}><NotFound /></Suspense>,
  }
]);