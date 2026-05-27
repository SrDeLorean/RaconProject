import DashboardLayout from './DashboardLayout';
import { useAuthStore } from '@/store/useAuthStore';

export default function JugadorLayout() {
  const { user } = useAuthStore();
  
  const navLinks = [
    { path: '/jugador', label: 'Mi Panel', icon: '🎮' },
    { path: '/jugador/torneos', label: 'Torneos', icon: '🏆' },
    { path: '/jugador/miequipo', label: 'Mis Equipos', icon: '🛡️' },
  ];

  return (
    <DashboardLayout 
      menuItems={navLinks} 
      profile={{ name: user?.name, email: user?.email, initial: user?.name?.charAt(0) }} 
    />
  );
}