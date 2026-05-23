import DashboardLayout from './DashboardLayout';
import { useAuthStore } from '@/store/useAuthStore';

export default function OrganizadorLayout() {
  const { user } = useAuthStore();
  
  const navLinks = [
    { path: '/organizador', label: 'Panel Organizador', icon: '🏢' },
    { path: '/organizador/jugador', label: 'Jugadores', icon: '🏆' },
    { path: '/organizador/competencias', label: 'Mis competencias', icon: '👥' },
  ];

  return (
    <DashboardLayout 
      menuItems={navLinks} 
      profile={{ name: user?.name, email: user?.email, initial: user?.name?.charAt(0) }} 
    />
  );
}