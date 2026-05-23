import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '@/store/useAuthStore';

export default function ProtectedRoute({ allowedRoles }) {
  const { user, isAuthenticated } = useAuthStore();

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  // 1. NORMALIZACIÓN: Convertimos el rol de la DB al formato de tus rutas
  // Si en la DB es "administrador", lo tratamos como "admin" para el sistema
  const userRole = user.role === 'administrador' ? 'admin' : user.role;

  // 2. Si el usuario es 'admin', tiene acceso total (Bypass)
  if (userRole === 'admin') {
    return <Outlet />;
  }

  // 3. Validación estricta para el resto de roles
  if (allowedRoles && !allowedRoles.includes(userRole)) {
    console.warn(`Acceso denegado: Se requiere alguno de estos roles: ${allowedRoles}. Tu rol actual es: ${userRole}`);
    
    // Redirección segura según rol
    const fallbackRoute = userRole === 'organizador' ? '/organizador' : '/jugador';
    return <Navigate to={fallbackRoute} replace />;
  }

  return <Outlet />;
}