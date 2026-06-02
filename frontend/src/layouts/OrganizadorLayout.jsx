import DashboardLayout from './DashboardLayout';
import { useAuthStore } from '@/store/useAuthStore';

export default function OrganizadorLayout() {
  const { user } = useAuthStore();
  
  const navLinks = [
    { path: '/organizador', label: 'Panel Organizador', icon: '🏢' },
    { path: '/organizador/equipos', label: 'Equipos', icon: '🛡️' },
    { path: '/organizador/jugadores', label: 'Jugadores', icon: '🏆' },
    { path: '/organizador/competencias', label: 'Mis competencias', icon: '👥' },
    { path: '/organizador/temporadas', label: 'Temporadas', icon: '📅' },
    { path: '/organizador/traspasos', label: 'Traspasos', icon: '🔁' },
    { path: '/organizador/partidos', label: 'Partidos y Reportes', icon: '🏟️' },
  ];

  return (
    <DashboardLayout 
      menuItems={navLinks} 
      profile={{ name: user?.name, email: user?.email, initial: user?.name?.charAt(0) }} 
    />
  );
}