import { lazy } from 'react';
import OrganizadorLayout from '@/layouts/OrganizadorLayout'; // El layout que crearemos abajo

const DashboardOrganizador = lazy(() => import('@/features/organizador/pages/DashboardOrganizador'));
const CompetenciasCRUD = lazy(() => import('@/features/organizador/pages/CompetenciasCRUD'));


const MiPerfil = lazy(() => import('@/features/shared/MiPerfil'));
const Configuracion = lazy(() => import('@/features/shared/Configuracion'));

export const organizadorRoutes = {
  path: '/organizador',
  element: <OrganizadorLayout />,
  children: [{ index: true, element: <DashboardOrganizador /> },
    {
      path: 'competencias',
      element: <CompetenciasCRUD />
    },

    { path: 'perfil', element: <MiPerfil /> },
    { path: 'configuracion', element: <Configuracion /> },
  ],
};