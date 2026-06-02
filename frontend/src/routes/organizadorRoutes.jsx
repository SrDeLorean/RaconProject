import { lazy } from 'react';
import OrganizadorLayout from '@/layouts/OrganizadorLayout';

// Features
const DashboardOrganizador = lazy(() => import('@/features/organizador/pages/DashboardOrganizador'));
const CompetenciasCRUD = lazy(() => import('@/features/organizador/pages/CompetenciasCRUD'));
const CompetenciaDetalle = lazy(() => import('@/features/organizador/pages/CompetenciaDetalle')); // 🔥 Nueva Vista
const TemporadasCRUD = lazy(() => import('@/features/organizador/pages/TemporadasCRUD'));
const EquiposCRUD = lazy(() => import('@/features/organizador/pages/EquiposCRUD'));
const JugadoresCRUD = lazy(() => import('@/features/organizador/pages/JugadoresCRUD'));
const TraspasosCRUD = lazy(() => import('@/features/organizador/pages/TraspasosCRUD'));
const PartidosCRUD = lazy(() => import('@/features/organizador/pages/PartidosCRUD'));

// Shared
const MiPerfil = lazy(() => import('@/features/shared/MiPerfil'));
const Configuracion = lazy(() => import('@/features/shared/Configuracion'));

export const organizadorRoutes = {
  path: '/organizador',
  element: <OrganizadorLayout />,
  children: [
    { index: true, element: <DashboardOrganizador /> },
    {
      path: 'equipos',
      element: <EquiposCRUD />
    },
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
    {
      path: 'traspasos',
      element: <TraspasosCRUD />
    },
    {
      path: 'partidos',
      element: <PartidosCRUD />
    },
    { path: 'perfil', element: <MiPerfil /> },
    { path: 'configuracion', element: <Configuracion /> },
  ],
};