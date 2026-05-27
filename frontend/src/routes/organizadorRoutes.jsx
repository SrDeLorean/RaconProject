import { lazy } from 'react';
import OrganizadorLayout from '@/layouts/OrganizadorLayout';

// Features
const DashboardOrganizador = lazy(() => import('@/features/organizador/pages/DashboardOrganizador'));
const CompetenciasCRUD = lazy(() => import('@/features/organizador/pages/CompetenciasCRUD'));
const CompetenciaDetalle = lazy(() => import('@/features/organizador/pages/CompetenciaDetalle')); // 🔥 Nueva Vista
const TemporadasCRUD = lazy(() => import('@/features/organizador/pages/TemporadasCRUD'));
const JugadoresCRUD = lazy(() => import('@/features/organizador/pages/JugadoresCRUD'));

// Shared
const MiPerfil = lazy(() => import('@/features/shared/MiPerfil'));
const Configuracion = lazy(() => import('@/features/shared/Configuracion'));

export const organizadorRoutes = {
  path: '/organizador',
  element: <OrganizadorLayout />,
  children: [
    { index: true, element: <DashboardOrganizador /> },
    {
      path: 'competencias',
      children: [
        { index: true, element: <CompetenciasCRUD /> },
        { path: ':id', element: <CompetenciaDetalle /> } // 🔥 Ruta dinámica para gestionar equipos/calendario
      ]
    },
    {
      path: 'jugadores',
      element: <JugadoresCRUD />
    },
    {
      path: 'temporadas',
      element: <TemporadasCRUD />
    },
    { path: 'perfil', element: <MiPerfil /> },
    { path: 'configuracion', element: <Configuracion /> },
  ],
};