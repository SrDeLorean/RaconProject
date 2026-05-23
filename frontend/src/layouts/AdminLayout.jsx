import React from 'react';
import DashboardLayout from './DashboardLayout';

export default function AdminLayout() {
  // Los enlaces específicos para el rol de Administrador
  const navLinks = [
    { path: '/admin', label: 'Dashboard Global', icon: '🌐' },
    { path: '/admin/organizaciones', label: 'Organizaciones', icon: '🏢' },
    { path: '/admin/usuarios', label: 'Gestión Usuarios', icon: '👥' },
    { path: '/admin/config', label: 'Configuración', icon: '⚙️' },
    { path: '/admin/design-system', label: 'Design System', icon: '🎨' },
  ];

  // Datos simulados del perfil (luego puedes conectarlo a Zustand)
  const adminProfile = {
    name: 'Super Admin',
    email: 'admin@racon.com',
    initial: 'S'
  };

  return (
    <DashboardLayout 
      menuItems={navLinks} 
      profile={adminProfile} 
    />
  );
}