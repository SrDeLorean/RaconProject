import React, { useState, useEffect, useRef } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Avatar from '@/components/ui/Avatar'; // <-- NUEVO: Importamos el Avatar
import logoImg from '@/assets/images/logo.png';
import { useTheme } from '@/hooks/useTheme';
import { useAuthStore } from '@/store/useAuthStore';

export default function DashboardLayout({ menuItems = [], profile }) {
  const { user, logout } = useAuthStore();
  const { isDark, toggleTheme } = useTheme(); 
  
  // isSidebarOpen en Desktop significa "Expandido (true) o Minimizado (false)"
  // isSidebarOpen en Móvil significa "Visible (true) o Fuera de pantalla (false)"
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  
  const location = useLocation();
  const navigate = useNavigate();
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsUserDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const root = window.document.documentElement;
    if (isDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [isDark]);

  useEffect(() => {
    if (window.innerWidth < 1024) {
      setIsSidebarOpen(false);
    }
  }, [location.pathname]);

  const handleLogout = async () => {
    setIsUserDropdownOpen(false);
    await logout(); 
    navigate('/login');
  };

  // Unificamos datos del usuario (Prioridad: Estado Global de Zustand > Props > Default)
  const displayName = user?.name || profile?.name || 'Administrador';
  const displayRole = user?.role || user?.rol || profile?.role || profile?.rol || 'Super Admin';
  const displayEmail = user?.email || profile?.email || 'admin@torneosprofc.com';
  const displayAvatar = user?.profile_photo_url || profile?.avatar;

  const getRolePrefix = () => {
    const r = user?.role || user?.rol || 'jugador';
    if (r === 'administrador' || r === 'admin') return 'admin';
    return r;
  };
  const rolePrefix = getRolePrefix();

  return (
    <div className="min-h-screen bg-background text-foreground flex overflow-hidden font-sans">
      
      {/* ========================================================================= */}
      {/* 1. SIDEBAR (MENÚ IZQUIERDA)                                               */}
      {/* ========================================================================= */}
      <aside className={`
        glass-sidebar fixed inset-y-0 left-0 z-50 flex flex-col border-r border-border/50
        transition-all duration-300 ease-in-out bg-card/50 backdrop-blur-xl
        ${isSidebarOpen ? 'w-72 translate-x-0' : '-translate-x-full lg:translate-x-0 lg:w-20'}
      `}>
        
        {/* Logo de la plataforma */}
        <div className="h-20 flex items-center justify-center border-b border-border/50 shrink-0">
          {isSidebarOpen ? (
            <Link to="/admin" className="flex items-center gap-2">
              <img src={logoImg} alt="Torneos Pro FC" className="h-10 object-contain" />
              <h1 className="text-display font-black text-xl tracking-widest mt-1 uppercase">
                <span className="text-primary">Torneos Pro</span>
                <span className="text-foreground"> FC</span>
              </h1>
            </Link>
          ) : (
            <Link to="/admin" className="w-10 h-10 flex items-center justify-center">
              <img src={logoImg} alt="Torneos Pro FC" className="w-9 h-9 object-contain" />
            </Link>
          )}
        </div>

        {/* Enlaces de Navegación */}
        <nav className="flex-1 overflow-y-auto custom-scrollbar py-6 space-y-1.5">
          
          <p className={`text-xs font-bold uppercase tracking-wider text-muted-foreground px-6 mb-4 transition-opacity duration-300 ${!isSidebarOpen && 'lg:hidden'}`}>
            Menú Principal
          </p>
          
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link 
                key={item.path} 
                to={item.path}
                // Si está cerrado, usamos el title nativo como tooltip
                title={!isSidebarOpen ? item.label : ""}
                className={`
                  flex items-center rounded-xl font-bold transition-all duration-300 group relative
                  ${isSidebarOpen ? 'gap-4 px-4 py-3 mx-4' : 'justify-center p-3.5 mb-2 mx-3'}
                  ${isActive 
                    ? 'bg-primary/10 text-primary border-primary' 
                    : 'text-muted-foreground hover:bg-foreground/5 hover:text-foreground hover:translate-x-1'
                  }
                  ${isSidebarOpen && isActive ? 'border-l-4' : ''}
                `}
              >
                {isActive && (
                  <div className="absolute inset-y-0 left-0 w-full bg-gradient-to-r from-primary/20 to-transparent opacity-50 rounded-xl pointer-events-none"></div>
                )}
                
                <span className={`text-xl relative z-10 transition-transform duration-300 ${isActive ? 'scale-110 drop-shadow-[0_0_8px_hsla(var(--primary),0.5)]' : 'group-hover:scale-110'}`}>
                  {item.icon}
                </span>
                
                {/* Se oculta el texto si la barra está colapsada */}
                <span className={`text-sm tracking-wide relative z-10 whitespace-nowrap transition-all duration-300 ${!isSidebarOpen ? 'opacity-0 w-0 overflow-hidden hidden lg:block' : 'opacity-100'}`}>
                  {item.label}
                </span>
              </Link>
            );
          })}
        </nav>

        {/* Pequeño indicador inferior en el Sidebar */}
        <div className={`p-4 border-t border-border/50 shrink-0 text-center text-xs font-semibold text-muted-foreground opacity-60 transition-opacity ${!isSidebarOpen && 'lg:hidden'}`}>
          v2.0.0 — Torneos Pro FC
        </div>
      </aside>

      {/* OVERLAY MÓVIL (Solo se muestra en pantallas < lg si isSidebarOpen es true) */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* ========================================================================= */}
      {/* 2. CONTENEDOR PRINCIPAL DERECHO (TOPBAR + CONTENIDO)                      */}
      {/* ========================================================================= */}
      <div className={`
        flex-1 flex flex-col h-screen min-w-0 transition-all duration-300 ease-in-out relative
        ${isSidebarOpen ? 'lg:pl-72' : 'lg:pl-20'}
      `}>
        
        {/* Glow Ambiental de Fondo Global */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] pointer-events-none z-0"></div>

        {/* ========================================================================= */}
        {/* TOPBAR (HEADER SUPERIOR)                                                  */}
        {/* ========================================================================= */}
        <header className="h-20 bg-background/60 backdrop-blur-xl border-b border-border/50 sticky top-0 z-30 px-6 flex items-center justify-between shrink-0">
          
          {/* LADO IZQUIERDO: Hamburguesa + Título */}
          <div className="flex items-center gap-4">
            <button 
              className="p-2.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all duration-200 active:scale-95 focus:outline-none"
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              title={isSidebarOpen ? "Minimizar menú" : "Expandir menú"}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <h2 className="text-display font-bold text-2xl tracking-wide uppercase hidden sm:block mt-1">
              {menuItems.find(item => item.path === location.pathname)?.label || "Panel de Control"}
            </h2>
          </div>
          
          {/* LADO DERECHO: Alerta + Tema + Datos Usuario */}
          <div className="flex items-center gap-3 sm:gap-4 relative z-10">
            {/* 1. BOTÓN DE ALERTAS */}
            <button className="relative p-2.5 rounded-xl text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all duration-200 focus:outline-none group">
              <svg 
                className="w-5 h-5 group-hover:animate-bounce" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth="2" 
                  d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.595 1.436-1.405 1.405L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" 
                />
              </svg>
              <span className="absolute top-2 right-2 w-2 h-2 bg-primary rounded-full shadow-[0_0_8px_hsla(var(--primary),1)] animate-pulse"></span>
            </button>

            {/* 2. BOTÓN CAMBIO DE TEMA */}
            <button 
              onClick={toggleTheme}
              className="p-2.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all duration-200 active:scale-95"
            >
              {isDark ? '☀️' : '🌙'}
            </button>

            {/* Línea divisoria */}
            <div className="h-6 w-px bg-border/50 hidden xs:block"></div>

            {/* 3. PERFIL DE USUARIO */}
            <div className="relative" ref={dropdownRef}>
              <button 
                onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
                className="flex items-center gap-3 p-1.5 pr-3 rounded-2xl hover:bg-muted/50 transition-all duration-200 focus:outline-none"
              >
                {/* NUESTRO NUEVO COMPONENTE AVATAR INYECTADO AQUÍ 
                  Mantenemos un tamaño similar y le pasamos tu clase de sombra glow
                */}
                <Avatar 
                  name={displayName} 
                  src={displayAvatar}
                  size="md"
                  className="shadow-[0_0_15px_hsla(var(--primary),0.3)] !rounded-xl" 
                />
                
                <div className="text-left hidden xs:block">
                  <p className="text-sm font-bold tracking-wide text-foreground max-w-[120px] truncate">
                    {displayName}
                  </p>
                  <p className="text-xs font-medium text-muted-foreground opacity-80">
                    {displayRole}
                  </p>
                </div>
                <svg className={`w-4 h-4 text-muted-foreground transition-transform duration-300 hidden xs:block ${isUserDropdownOpen ? 'rotate-180 text-primary' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* DROPDOWN MENU */}
              {isUserDropdownOpen && (
                <div className="absolute right-0 mt-3 w-56 bg-card border border-border/50 shadow-lg rounded-xl py-2 animate-fade-in z-50">
                  <div className="px-4 py-3 border-b border-border/50 xs:hidden mb-2">
                    <p className="text-sm font-bold text-foreground truncate">{displayName}</p>
                    <p className="text-xs text-muted-foreground truncate">{displayEmail}</p>
                  </div>
                  <Link to={`/${rolePrefix}/perfil`} className="flex items-center gap-3 px-4 py-2.5 text-sm font-bold text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors" onClick={() => setIsUserDropdownOpen(false)}>
                    <span className="text-lg opacity-70">👤</span> Mi Perfil
                  </Link>
                  {(user?.role === 'jugador' || user?.rol === 'jugador') && (
                    <Link to="/jugador/mis-equipos" className="flex items-center gap-3 px-4 py-2.5 text-sm font-bold text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors" onClick={() => setIsUserDropdownOpen(false)}>
                      <span className="text-lg opacity-70">⚽</span> Mis Equipos
                    </Link>
                  )}
                  <Link to={`/${rolePrefix}/configuracion`} className="flex items-center gap-3 px-4 py-2.5 text-sm font-bold text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors" onClick={() => setIsUserDropdownOpen(false)}>
                    <span className="text-lg opacity-70">⚙️</span> Configuración
                  </Link>
                  <div className="h-px bg-border/50 my-2"></div>
                  <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-bold text-destructive hover:bg-destructive/10 transition-colors text-left">
                    <span className="text-lg opacity-70">🚪</span> Cerrar Sesión
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* ========================================================================= */}
        {/* 3. ÁREA DE CONTENIDO (OUTLET)                                             */}
        {/* ========================================================================= */}
        <main className="flex-1 overflow-y-auto custom-scrollbar p-6 lg:p-10 scroll-smooth relative z-10">
          <div className="max-w-7xl mx-auto">
             <Outlet />
          </div>
        </main>

      </div>
    </div>
  );
}