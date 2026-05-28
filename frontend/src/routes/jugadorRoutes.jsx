import { lazy } from 'react';
import JugadorLayout from '@/layouts/JugadorLayout'; 

const DashboardJugador = lazy(() => import('@/features/jugador/pages/DashboardJugador'));
const MiEquipoDashboard = lazy(() => import('@/features/jugador/pages/MiEquipoDashboard'));
const MisEquiposInscritos = lazy(() => import('@/features/jugador/pages/MisEquiposInscritos'));
const DetalleClubInscrito = lazy(() => import('@/features/jugador/pages/DetalleClubInscrito'));

const MiPerfil = lazy(() => import('@/features/shared/MiPerfil'));
const Configuracion = lazy(() => import('@/features/shared/Configuracion'));

export const jugadorRoutes = {
  path: '/jugador',
  element: <JugadorLayout />,
  children: [
    { index: true, element: <DashboardJugador /> },
    { path: 'miequipo', element: <MiEquipoDashboard /> },
    { path: 'mis-equipos', element: <MisEquiposInscritos /> },
    { path: 'mis-equipos/:id', element: <DetalleClubInscrito /> },
    { path: 'perfil', element: <MiPerfil /> },
    { path: 'configuracion', element: <Configuracion /> },
  ],
};