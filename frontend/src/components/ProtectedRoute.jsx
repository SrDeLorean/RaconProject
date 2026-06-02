import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '@/store/useAuthStore';

export default function ProtectedRoute({ allowedRoles }) {
  const { user, isAuthenticated } = useAuthStore();

  // Robust fallback: if localStorage has the corrupted nested data key, unwrap it dynamically
  const normalizedUser = (user && user.data && typeof user.data === 'object' && user.data.email) ? user.data : user;

  if (!isAuthenticated || !normalizedUser) {
    return <Navigate to="/login" replace />;
  }

  // 1. NORMALIZACIÓN: Convertimos el rol de la DB al formato de tus rutas
  // Si en la DB es "administrador", lo tratamos como "admin" para el sistema
  const userRole = normalizedUser.role === 'administrador' ? 'admin' : normalizedUser.role;

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