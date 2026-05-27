import { lazy } from 'react';
import JugadorLayout from '@/layouts/JugadorLayout'; // El layout que crearemos abajo

const DashboardJugador = lazy(() => import('@/features/jugador/pages/DashboardJugador'));
const MiEquipoDashboard = lazy(() => import('@/features/jugador/pages/MiEquipoDashboard'));

const MiPerfil = lazy(() => import('@/features/shared/MiPerfil'));
const Configuracion = lazy(() => import('@/features/shared/Configuracion'));

export const jugadorRoutes = 
  {
    path: '/jugador',
    element: <JugadorLayout />,
    children: [{ index: true, element: <DashboardJugador /> 
  },
  {
    path: 'miequipo',
    element: <MiEquipoDashboard />
  },
  { path: 'perfil', element: <MiPerfil /> },
  { path: 'configuracion', element: <Configuracion /> },

  ],
  
};