import { lazy } from 'react';
import AdminLayout from '@/layouts/AdminLayout';

const DashboardAdmin = lazy(() => import('@/features/admin/pages/DashboardAdmin'));
const UsuariosCRUD = lazy(() => import('@/features/admin/pages/UsuariosCRUD'));
const DesignSystemPreview = lazy(() => import('@/features/admin/pages/DesignSystemPreview'));
const OrganizacionesCRUD = lazy(() => import('@/features/admin/pages/OrganizacionesCRUD'));
const EquiposCRUD = lazy(() => import('@/features/organizador/pages/EquiposCRUD'));

const MiPerfil = lazy(() => import('@/features/shared/MiPerfil'));
const Configuracion = lazy(() => import('@/features/shared/Configuracion'));


export const adminRoutes = {
  path: '/admin',
  element: <AdminLayout />,
  children: [
    { 
      index: true, 
      element: <DashboardAdmin /> 
    },
    { 
      path: 'usuarios', 
      element: <UsuariosCRUD /> 
    },
    { 
      path: 'equipos', 
      element: <EquiposCRUD /> 
    },
    {
      path: 'design-system',
      element: <DesignSystemPreview />
    },
    {
      path: 'organizaciones',
      element: <OrganizacionesCRUD />
    },
    { path: 'perfil', element: <MiPerfil /> },
    { path: 'configuracion', element: <Configuracion /> },
  ],
};