import { lazy, Suspense } from 'react';
import PageLoader from '@/components/ui/PageLoader';

const JugadorLayout = lazy(() => import('@/layouts/JugadorLayout')); 

const DashboardJugador = lazy(() => import('@/features/jugador/pages/DashboardJugador'));
const MiEquipoDashboard = lazy(() => import('@/features/jugador/pages/MiEquipoDashboard'));
const MisEquiposInscritos = lazy(() => import('@/features/jugador/pages/MisEquiposInscritos'));
const DetalleClubInscrito = lazy(() => import('@/features/jugador/pages/DetalleClubInscrito'));
const InscripcionTorneoUT = lazy(() => import('@/features/jugador/pages/InscripcionTorneoUT'));
const CampeonatosJugadorUtPage = lazy(() => import('@/features/jugador/pages/CampeonatosJugadorUtPage'));

const MiPerfil = lazy(() => import('@/features/shared/MiPerfil'));
const Configuracion = lazy(() => import('@/features/shared/Configuracion'));

export const jugadorRoutes = {
  path: '/jugador',
  element: <Suspense fallback={<PageLoader />}><JugadorLayout /></Suspense>,
  children: [
    { index: true, element: <DashboardJugador /> },
    { path: 'miequipo', element: <MiEquipoDashboard /> },
    { path: 'mis-equipos', element: <MisEquiposInscritos /> },
    { path: 'mis-equipos/:id', element: <DetalleClubInscrito /> },
    { path: 'competencias-ut/:id/inscripcion', element: <InscripcionTorneoUT /> },
    { path: 'campeonatos-ut', element: <CampeonatosJugadorUtPage /> },
    { path: 'perfil', element: <MiPerfil /> },
    { path: 'configuracion', element: <Configuracion /> },
  ],
};