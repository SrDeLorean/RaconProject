import { lazy } from 'react';
import JugadorLayout from '@/layouts/JugadorLayout'; // El layout que crearemos abajo

const DashboardJugador = lazy(() => import('@/features/jugador/pages/DashboardJugador'));
const MiPerfil = lazy(() => import('@/features/shared/MiPerfil'));
const Configuracion = lazy(() => import('@/features/shared/Configuracion'));

export const jugadorRoutes = 
  {
    path: '/jugador',
    element: <JugadorLayout />,
    children: [{ index: true, element: <DashboardJugador /> 
  },
  { path: 'perfil', element: <MiPerfil /> },
  { path: 'configuracion', element: <Configuracion /> },

  ],
  
};