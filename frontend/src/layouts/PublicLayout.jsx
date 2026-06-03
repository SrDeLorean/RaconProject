import React, { useState, useEffect } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import Button from '../components/ui/Button';
import { useAuthStore } from '@/store/useAuthStore';

export default function PublicLayout() {
  const { isAuthenticated, user } = useAuthStore();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const location = useLocation();

  const getRolePrefix = () => {
    const r = user?.role || user?.rol || 'jugador';
    if (r === 'administrador' || r === 'admin') return 'admin';
    return r;
  };
  const rolePrefix = getRolePrefix();

  // 1. ESTADO DEL TEMA
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem('theme');
    return savedTheme ? savedTheme === 'dark' : true;
  });

  // 2. EFECTO: Sincroniza la clase .dark
  useEffect(() => {
    const root = window.document.documentElement;
    if (isDarkMode) {
      root.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  // 3. EFECTO: Cierra el menú móvil automáticamente al cambiar de página
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  // 4. EFECTO: Detecta el scroll para volver la barra superior de "cristal" + scroll-to-top
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
      setShowScrollTop(window.scrollY > 400);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Helper para verificar si un path está activo (incluyendo subpaths)
  const isActive = (path) => location.pathname === path;
  const isGroupActive = (paths) => paths.some(p => location.pathname === p || location.pathname.startsWith(p + '/'));

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans selection:bg-primary selection:text-white transition-colors duration-300">
      

      {/* ========================================================================= */}
      {/* NAVBAR (BARRA DE NAVEGACIÓN PÚBLICA STICKY GLASSMORPHISM)                   */}
      {/* ========================================================================= */}
      <header 
        className={`fixed top-0 inset-x-0 z-50 transition-all duration-500 ${
          isScrolled 
            ? 'bg-background/80 backdrop-blur-xl py-3 glow-neon-navbar' 
            : 'bg-transparent py-5'
        }`}
      >
        <div className="max-w-[90rem] mx-auto px-6 lg:px-10 flex items-center justify-between gap-4">
          
          {/* Logo RaconPro */}
          <div className="flex-1 flex items-center">
            <Link to="/" className="flex items-center gap-3 z-50 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-primary to-destructive flex items-center justify-center text-primary-foreground font-display font-black text-xl shadow-[0_0_15px_rgba(244,63,94,0.35)] transition-all duration-300 group-hover:scale-110 group-hover:shadow-[0_0_25px_rgba(244,63,94,0.5)]">
                R
              </div>
              <h1 className="text-2xl font-display font-black tracking-widest uppercase hidden sm:block mt-1">
                <span className="text-primary">Racon</span>
                <span className="text-foreground">Pro</span>
              </h1>
            </Link>
          </div>

          {/* Central Block: Desktop Links & Dropdowns */}
          <nav className="hidden lg:flex items-center justify-center gap-1 xl:gap-2">
            {/* Inicio */}
            <Link 
              to="/"
              className={`nav-link-underline text-[11px] xl:text-xs font-black tracking-widest uppercase transition-colors duration-300 px-3 py-2 rounded-lg ${
                isActive('/') ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Inicio
            </Link>

            {/* Separador */}
            <div className="h-4 w-px bg-border/30 mx-1"></div>

            {/* Dropdown: Nosotros */}
            <div className="relative group py-2">
              <button 
                className={`nav-link-underline text-[11px] xl:text-xs font-black tracking-widest uppercase transition-colors duration-300 flex items-center gap-1.5 cursor-pointer px-3 py-2 rounded-lg ${
                  isGroupActive(['/organizaciones', '/contacto', '/acerca-de'])
                    ? 'text-primary' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Nosotros <span className="text-[8px] transition-transform duration-300 group-hover:rotate-180 inline-block">▼</span>
              </button>
              <div className="dropdown-menu">
                {[
                  { path: '/organizaciones', label: 'Circuitos / Orgs', icon: '🏛️' },
                  { path: '/acerca-de', label: 'Acerca de', icon: 'ℹ️' },
                  { path: '/contacto', label: 'Contacto', icon: '✉️' },
                ].map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`dropdown-item flex items-center gap-2 ${
                      isActive(item.path) ? 'dropdown-item-active' : 'text-muted-foreground'
                    }`}
                  >
                    <span className="text-xs">{item.icon}</span>
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>

            {/* Dropdown: Competencias */}
            <div className="relative group py-2">
              <button 
                className={`nav-link-underline text-[11px] xl:text-xs font-black tracking-widest uppercase transition-colors duration-300 flex items-center gap-1.5 cursor-pointer px-3 py-2 rounded-lg ${
                  isGroupActive(['/clasificacion', '/partidos', '/traspasos'])
                    ? 'text-primary' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Competencias <span className="text-[8px] transition-transform duration-300 group-hover:rotate-180 inline-block">▼</span>
              </button>
              <div className="dropdown-menu">
                {[
                  { path: '/clasificacion', label: 'Clasificación', icon: '📊' },
                  { path: '/partidos', label: 'Partidos', icon: '⚽' },
                  { path: '/traspasos', label: 'Traspasos', icon: '🔄' },
                ].map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`dropdown-item flex items-center gap-2 ${
                      isActive(item.path) ? 'dropdown-item-active' : 'text-muted-foreground'
                    }`}
                  >
                    <span className="text-xs">{item.icon}</span>
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>

            {/* Separador */}
            <div className="h-4 w-px bg-border/30 mx-1"></div>

            {/* Dropdown: Comunidad */}
            <div className="relative group py-2">
              <button 
                className={`nav-link-underline text-[11px] xl:text-xs font-black tracking-widest uppercase transition-colors duration-300 flex items-center gap-1.5 cursor-pointer px-3 py-2 rounded-lg ${
                  isGroupActive(['/equipos', '/jugadores'])
                    ? 'text-primary' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Comunidad <span className="text-[8px] transition-transform duration-300 group-hover:rotate-180 inline-block">▼</span>
              </button>
              <div className="dropdown-menu">
                {[
                  { path: '/equipos', label: 'Equipos', icon: '🛡️' },
                  { path: '/jugadores', label: 'Jugadores', icon: '👤' },
                ].map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`dropdown-item flex items-center gap-2 ${
                      isActive(item.path) ? 'dropdown-item-active' : 'text-muted-foreground'
                    }`}
                  >
                    <span className="text-xs">{item.icon}</span>
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>

            {/* Dropdown: Estadísticas */}
            <div className="relative group py-2">
              <button 
                className={`nav-link-underline text-[11px] xl:text-xs font-black tracking-widest uppercase transition-colors duration-300 flex items-center gap-1.5 cursor-pointer px-3 py-2 rounded-lg ${
                  isGroupActive(['/totw-tots', '/infografia', '/datos'])
                    ? 'text-primary' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Estadísticas <span className="text-[8px] transition-transform duration-300 group-hover:rotate-180 inline-block">▼</span>
              </button>
              <div className="dropdown-menu">
                {[
                  { path: '/totw-tots', label: 'Once Ideal', icon: '⭐' },
                  { path: '/infografia', label: 'Infografía', icon: '📈' },
                  { path: '/datos', label: 'Datos', icon: '📊' },
                ].map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`dropdown-item flex items-center gap-2 ${
                      isActive(item.path) ? 'dropdown-item-active' : 'text-muted-foreground'
                    }`}
                  >
                    <span className="text-xs">{item.icon}</span>
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>
          </nav>

          {/* Right Block: Action Controls */}
          <div className="flex-1 hidden lg:flex items-center justify-end gap-2.5">
            
            {/* BOTÓN CAMBIO DE TEMA */}
            <button 
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="p-2.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all duration-300 focus:outline-none relative group/theme"
              title={isDarkMode ? "Cambiar a Modo Claro" : "Cambiar a Modo Oscuro"}
            >
              <div className="relative w-5 h-5">
                {isDarkMode ? (
                  <svg className="w-5 h-5 text-amber-400 transition-transform duration-300 group-hover/theme:rotate-45" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707M16.243 17.657l.707-.707M7.757 6.364l.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5 text-indigo-500 transition-transform duration-300 group-hover/theme:-rotate-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                  </svg>
                )}
              </div>
            </button>

            <div className="h-5 w-px bg-border/50 mx-1"></div>

            {isAuthenticated ? (
              <Link to={`/${rolePrefix}`}>
                <Button className="hover:shadow-[0_0_15px_hsla(var(--primary),0.5)] transition-all text-xs py-2 px-3.5 bg-gradient-to-r from-primary to-destructive text-primary-foreground font-display font-black tracking-wider uppercase flex items-center gap-1.5 border-transparent">
                  <span>🛡️</span> Escritorio
                </Button>
              </Link>
            ) : (
              <>
                <Link to="/login">
                  <Button variant="outline" size="sm" className="border-border/50 hover:bg-muted text-foreground text-xs py-2 px-3">
                    Iniciar Sesión
                  </Button>
                </Link>
                <Link to="/registro">
                  <Button size="sm" className="hover:shadow-[0_0_15px_hsla(var(--primary),0.5)] transition-all text-xs py-2 px-3">
                    Unirse Ahora
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile Side: Theme / Hamburger Menu */}
          <div className="flex-1 flex lg:hidden items-center justify-end gap-2">
            <button 
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="p-2 rounded-xl text-muted-foreground hover:text-foreground"
            >
              {isDarkMode ? '☀️' : '🌙'}
            </button>
            
            <button 
              className="p-2 text-foreground z-50 focus:outline-none"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              <svg 
                className={`w-7 h-7 transition-transform duration-300 ${isMobileMenuOpen ? 'rotate-180 text-primary' : ''}`} 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                {isMobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>

        </div>
      </header>

      {/* ========================================================================= */}
      {/* MOBILE MENU (FULLSCREEN SCROLLABLE OVERLAY)                               */}
      {/* ========================================================================= */}
      <div 
        className={`fixed inset-0 z-40 bg-background/95 backdrop-blur-xl flex flex-col justify-start items-center px-6 py-24 transition-all duration-500 lg:hidden overflow-y-auto custom-scrollbar ${
          isMobileMenuOpen ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-full pointer-events-none'
        }`}
      >
        <nav className="flex flex-col items-center gap-5 w-full max-w-sm">
          <Link 
            to="/"
            className="text-base font-display font-black tracking-widest uppercase text-foreground hover:text-primary transition-colors py-1"
          >
            Inicio
          </Link>
          
          {/* Grupo Móvil: Nosotros */}
          <div className="flex flex-col items-center gap-1.5 w-full border-b border-border/30 pb-3">
            <span className="text-[10px] font-condensed font-black tracking-[0.2em] text-primary uppercase">👥 Nosotros</span>
            <div className="flex flex-wrap justify-center gap-2">
              {[
                { path: '/organizaciones', label: 'Organizaciones' },
                { path: '/acerca-de', label: 'Acerca de' },
                { path: '/contacto', label: 'Contacto' },
              ].map((item) => (
                <Link
                  key={item.label}
                  to={item.path}
                  className={`text-xs font-display font-bold uppercase tracking-wider px-3 py-1.5 border rounded-lg transition-all duration-200 ${
                    isActive(item.path)
                      ? 'bg-primary/10 text-primary border-primary/30'
                      : 'text-muted-foreground hover:text-foreground bg-muted/30 border-border/40 hover:border-primary/30'
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Grupo Móvil: Competencias */}
          <div className="flex flex-col items-center gap-1.5 w-full border-b border-border/30 pb-3">
            <span className="text-[10px] font-condensed font-black tracking-[0.2em] text-primary uppercase">🏆 Competencias</span>
            <div className="flex flex-wrap justify-center gap-2">
              {[
                { path: '/clasificacion', label: 'Clasificación' },
                { path: '/partidos', label: 'Partidos' },
                { path: '/traspasos', label: 'Traspasos' },
              ].map((item) => (
                <Link
                  key={item.label}
                  to={item.path}
                  className={`text-xs font-display font-bold uppercase tracking-wider px-3 py-1.5 border rounded-lg transition-all duration-200 ${
                    isActive(item.path)
                      ? 'bg-primary/10 text-primary border-primary/30'
                      : 'text-muted-foreground hover:text-foreground bg-muted/30 border-border/40 hover:border-primary/30'
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Grupo Móvil: Comunidad */}
          <div className="flex flex-col items-center gap-1.5 w-full border-b border-border/30 pb-3">
            <span className="text-[10px] font-condensed font-black tracking-[0.2em] text-primary uppercase">👥 Comunidad</span>
            <div className="flex flex-wrap justify-center gap-2">
              {[
                { path: '/equipos', label: 'Equipos' },
                { path: '/jugadores', label: 'Jugadores' },
              ].map((item) => (
                <Link
                  key={item.label}
                  to={item.path}
                  className={`text-xs font-display font-bold uppercase tracking-wider px-3 py-1.5 border rounded-lg transition-all duration-200 ${
                    isActive(item.path)
                      ? 'bg-primary/10 text-primary border-primary/30'
                      : 'text-muted-foreground hover:text-foreground bg-muted/30 border-border/40 hover:border-primary/30'
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Grupo Móvil: Estadísticas */}
          <div className="flex flex-col items-center gap-1.5 w-full border-b border-border/30 pb-3">
            <span className="text-[10px] font-condensed font-black tracking-[0.2em] text-primary uppercase">📊 Estadísticas</span>
            <div className="flex flex-wrap justify-center gap-2">
              {[
                { path: '/totw-tots', label: 'Once Ideal' },
                { path: '/infografia', label: 'Infografía' },
                { path: '/datos', label: 'Datos' },
              ].map((item) => (
                <Link
                  key={item.label}
                  to={item.path}
                  className={`text-xs font-display font-bold uppercase tracking-wider px-3 py-1.5 border rounded-lg transition-all duration-200 ${
                    isActive(item.path)
                      ? 'bg-primary/10 text-primary border-primary/30'
                      : 'text-muted-foreground hover:text-foreground bg-muted/30 border-border/40 hover:border-primary/30'
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
          
          <div className="w-full h-px bg-border/50 my-2"></div>
          
          {isAuthenticated ? (
            <Link to={`/${rolePrefix}`} className="w-full">
              <Button className="w-full py-3.5 text-sm hover:shadow-[0_0_15px_hsla(var(--primary),0.5)] bg-gradient-to-r from-primary to-destructive text-primary-foreground font-display font-black tracking-wider uppercase flex items-center justify-center gap-1.5 border-transparent">
                <span>🛡️</span> Ir al Escritorio
              </Button>
            </Link>
          ) : (
            <>
              <Link to="/login" className="w-full">
                <Button variant="outline" className="w-full py-3.5 text-sm border-border/50">
                  Iniciar Sesión
                </Button>
              </Link>
              <Link to="/registro" className="w-full mt-2.5">
                <Button className="w-full py-3.5 text-sm hover:shadow-[0_0_15px_hsla(var(--primary),0.5)]">
                  Crear Cuenta
                </Button>
              </Link>
            </>
          )}
        </nav>
      </div>

      {/* ========================================================================= */}
      {/* ÁREA DE CONTENIDO (Main Content)                                          */}
      {/* ========================================================================= */}
      <main className="flex-1 relative z-10 flex flex-col">
        {/* Retiramos el pt-24 excesivo del layout, ya que los layouts como el "Split-Screen"
            que diseñamos para Login/Register manejan su propio espaciado de pantalla completa.
            Si el Home normal necesita padding, lo debe aplicar internamente. */}
        <Outlet />
      </main>

      {/* ========================================================================= */}
      {/* FOOTER EXPANDIDO                                                          */}
      {/* ========================================================================= */}
      <footer className="relative z-10 mt-auto border-t border-transparent">
        {/* Separador gradiente premium */}
        <div className="h-px w-full bg-gradient-to-r from-transparent via-primary/40 to-transparent"></div>
        
        <div className="bg-card/80 backdrop-blur-sm">
          <div className="max-w-[90rem] mx-auto px-6 lg:px-10 py-14">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-8">
              
              {/* Columna 1: Marca */}
              <div className="lg:col-span-1 space-y-4">
                <Link to="/" className="flex items-center gap-2.5 group">
                  <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-primary to-destructive flex items-center justify-center text-primary-foreground font-display font-black text-lg shadow-lg transition-transform duration-300 group-hover:scale-110">
                    R
                  </div>
                  <h2 className="text-xl font-display font-black tracking-widest uppercase">
                    <span className="text-primary">Racon</span>
                    <span className="text-foreground">Pro</span>
                  </h2>
                </Link>
                <p className="text-xs text-muted-foreground leading-relaxed max-w-xs">
                  Plataforma de élite para la gestión integral de torneos y competiciones de FC26 Pro Clubs.
                </p>
                {/* Redes Sociales */}
                <div className="flex items-center gap-3 pt-1">
                  <a href="https://discord.gg/raconpro" target="_blank" rel="noreferrer" className="w-9 h-9 rounded-lg border border-border/40 bg-muted/20 flex items-center justify-center text-muted-foreground hover:text-[#5865F2] hover:border-[#5865F2]/40 hover:bg-[#5865F2]/10 hover:shadow-[0_0_15px_rgba(88,101,242,0.2)] transition-all duration-300" title="Discord">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189z"/></svg>
                  </a>
                  <a href="https://twitter.com/raconpro" target="_blank" rel="noreferrer" className="w-9 h-9 rounded-lg border border-border/40 bg-muted/20 flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-foreground/30 hover:bg-foreground/5 hover:shadow-[0_0_15px_rgba(255,255,255,0.1)] transition-all duration-300" title="X (Twitter)">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                  </a>
                  <a href="https://instagram.com/raconpro" target="_blank" rel="noreferrer" className="w-9 h-9 rounded-lg border border-border/40 bg-muted/20 flex items-center justify-center text-muted-foreground hover:text-[#E4405F] hover:border-[#E4405F]/40 hover:bg-[#E4405F]/10 hover:shadow-[0_0_15px_rgba(228,64,95,0.2)] transition-all duration-300" title="Instagram">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
                  </a>
                </div>
              </div>

              {/* Columna 2: Competición */}
              <div className="space-y-4">
                <h3 className="text-sm font-display font-black tracking-widest uppercase text-foreground">Competición</h3>
                <div className="flex flex-col gap-2.5">
                  {[
                    { to: '/partidos', label: 'Centro de Partidos' },
                    { to: '/clasificacion', label: 'Clasificación' },
                    { to: '/traspasos', label: 'Mercado de Traspasos' },
                    { to: '/temporadas', label: 'Temporadas' },
                  ].map(link => (
                    <Link key={link.to} to={link.to} className="text-xs text-muted-foreground hover:text-primary transition-colors duration-200 font-medium">
                      {link.label}
                    </Link>
                  ))}
                </div>
              </div>

              {/* Columna 3: Comunidad */}
              <div className="space-y-4">
                <h3 className="text-sm font-display font-black tracking-widest uppercase text-foreground">Comunidad</h3>
                <div className="flex flex-col gap-2.5">
                  {[
                    { to: '/equipos', label: 'Directorio de Clubes' },
                    { to: '/jugadores', label: 'Salón de Jugadores' },
                    { to: '/organizaciones', label: 'Circuitos Oficiales' },
                    { to: '/totw-tots', label: 'Once Ideal' },
                    { to: '/infografia', label: 'Infografía & Stats' },
                    { to: '/datos', label: 'Centro de Datos' },
                  ].map(link => (
                    <Link key={link.to} to={link.to} className="text-xs text-muted-foreground hover:text-primary transition-colors duration-200 font-medium">
                      {link.label}
                    </Link>
                  ))}
                </div>
              </div>

              {/* Columna 4: Legal */}
              <div className="space-y-4">
                <h3 className="text-sm font-display font-black tracking-widest uppercase text-foreground">Legal</h3>
                <div className="flex flex-col gap-2.5">
                  {[
                    { to: '/terminos', label: 'Términos de Uso' },
                    { to: '/privacidad', label: 'Política de Privacidad' },
                    { to: '/contacto', label: 'Contacto & Soporte' },
                  ].map(link => (
                    <Link key={link.to} to={link.to} className="text-xs text-muted-foreground hover:text-primary transition-colors duration-200 font-medium">
                      {link.label}
                    </Link>
                  ))}
                </div>
              </div>

            </div>
          </div>

          {/* Barra inferior */}
          <div className="border-t border-border/30">
            <div className="max-w-[90rem] mx-auto px-6 lg:px-10 py-5 flex flex-col sm:flex-row justify-between items-center gap-3">
              <span className="text-[10px] text-muted-foreground font-bold tracking-wider uppercase">
                &copy; {new Date().getFullYear()} RaconPro — Todos los derechos reservados.
              </span>
              <span className="text-[9px] text-muted-foreground/50 font-mono tracking-widest uppercase">
                RaconPro v2.0 · FC26
              </span>
            </div>
          </div>
        </div>
      </footer>

      {/* ========================================================================= */}
      {/* SCROLL TO TOP BUTTON                                                       */}
      {/* ========================================================================= */}
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="scroll-top-btn animate-fade-in"
          aria-label="Volver arriba"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 15l7-7 7 7" />
          </svg>
        </button>
      )}
    </div>
  );
}