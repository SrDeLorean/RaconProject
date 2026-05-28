import React, { useState, useEffect } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import Button from '../components/ui/Button';

export default function PublicLayout() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const location = useLocation();

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

  // 4. EFECTO: Detecta el scroll para volver la barra superior de "cristal"
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { path: '/', label: 'Inicio' },
    { path: '/organizaciones', label: 'Organizaciones' },
    { path: '/partidos', label: 'Partidos' },
    { path: '/clasificacion', label: 'Clasificación' },
    { path: '/equipos', label: 'Equipos' },
    { path: '/jugadores', label: 'Jugadores' },
    { path: '/totw-tots', label: 'TOTW/TOTS' },
    { path: '/infografia', label: 'Infografía' },
    { path: '/contacto', label: 'Contacto' },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans selection:bg-primary selection:text-primary-foreground transition-colors duration-300">
      
      {/* ========================================================================= */}
      {/* NAVBAR (BARRA DE NAVEGACIÓN PÚBLICA)                                      */}
      {/* ========================================================================= */}
      <header 
        className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
          isScrolled 
            ? 'bg-background/80 backdrop-blur-xl border-b border-border/50 py-3 shadow-sm' 
            : 'bg-transparent py-5'
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 lg:px-10 flex items-center justify-between gap-4">
          
          {/* 1. Bloque Izquierdo: Logo (Flex-1 asegura que ocupe espacio equivalente al derecho) */}
          <div className="flex-1 flex items-center">
            <Link to="/" className="flex items-center gap-3 z-50 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-primary to-destructive flex items-center justify-center text-primary-foreground font-display font-black text-xl shadow-[0_0_15px_hsla(var(--primary),0.4)] transition-transform duration-300 group-hover:scale-110">
                R
              </div>
              <h1 className="text-2xl font-display font-black tracking-widest uppercase hidden sm:block mt-1">
                <span className="text-primary">Racon</span>
                <span className="text-foreground">Pro</span>
              </h1>
            </Link>
          </div>

          {/* 2. Bloque Central: Enlaces Desktop */}
          <nav className="hidden md:flex items-center justify-center gap-8">
            {navLinks.map((link) => {
              const isActive = location.pathname === link.path;
              return (
                <Link 
                  key={link.path}
                  to={link.path}
                  className={`text-sm font-bold tracking-wide uppercase transition-colors duration-300 ${
                    isActive 
                      ? 'text-primary' 
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* 3. Bloque Derecho: Controles de Acción (Flex-1 y justify-end empuja a la derecha) */}
          <div className="flex-1 hidden md:flex items-center justify-end gap-3">
            
            {/* BOTÓN CAMBIO DE TEMA */}
            <button 
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all duration-200 focus:outline-none"
              title={isDarkMode ? "Cambiar a Modo Claro" : "Cambiar a Modo Oscuro"}
            >
              {isDarkMode ? (
                <svg className="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707M16.243 17.657l.707-.707M7.757 6.364l.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z" />
                </svg>
              ) : (
                <svg className="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
            </button>

            <div className="h-5 w-px bg-border/50 mx-1"></div>

            <Link to="/login">
              <Button variant="outline" size="sm" className="border-border/50 hover:bg-muted text-foreground">
                Iniciar Sesión
              </Button>
            </Link>
            <Link to="/registro">
              <Button size="sm" className="hover:shadow-[0_0_15px_hsla(var(--primary),0.5)] transition-all">
                Unirse Ahora
              </Button>
            </Link>
          </div>

          {/* Lado Móvil: Botón de Tema + Hamburguesa (Solo se ve en < md) */}
          <div className="flex-1 flex md:hidden items-center justify-end gap-2">
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
                className={`w-7 h-7 transition-transform duration-300 ${isMobileMenuOpen ? 'rotate-180 text-destructive' : ''}`} 
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
      {/* MENÚ MÓVIL (FULLSCREEN OVERLAY)                                           */}
      {/* ========================================================================= */}
      <div 
        className={`fixed inset-0 z-40 bg-background/95 backdrop-blur-xl flex flex-col justify-center items-center px-6 transition-all duration-500 md:hidden ${
          isMobileMenuOpen ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-full pointer-events-none'
        }`}
      >
        <nav className="flex flex-col items-center gap-8 w-full max-w-sm">
          {navLinks.map((link) => (
            <Link 
              key={link.path}
              to={link.path}
              className="text-3xl font-display font-black tracking-widest uppercase text-foreground hover:text-primary transition-colors"
            >
              {link.label}
            </Link>
          ))}
          
          <div className="w-full h-px bg-border/50 my-4"></div>
          
          <Link to="/login" className="w-full">
            <Button variant="outline" className="w-full py-6 text-lg border-border/50">
              Iniciar Sesión
            </Button>
          </Link>
          <Link to="/registro" className="w-full mt-4">
            <Button className="w-full py-6 text-lg hover:shadow-[0_0_15px_hsla(var(--primary),0.5)]">
              Crear Cuenta
            </Button>
          </Link>
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
      {/* FOOTER                                                                    */}
      {/* ========================================================================= */}
      <footer className="border-t border-border/50 bg-card relative z-10 mt-auto">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 py-12 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex flex-col items-center md:items-start">
            <h2 className="text-xl font-display font-black tracking-widest uppercase mb-2">
              <span className="text-primary">Racon</span>
              <span className="text-foreground">Pro</span>
            </h2>
            <p className="text-sm text-muted-foreground font-medium text-center md:text-left max-w-sm">
              Plataforma de élite para la gestión integral de torneos y competiciones de FC26.
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-6 text-sm font-bold text-muted-foreground">
            <Link to="/terminos" className="hover:text-foreground transition-colors">Términos</Link>
            <Link to="/privacidad" className="hover:text-foreground transition-colors">Privacidad</Link>
            <Link to="/contacto" className="hover:text-foreground transition-colors">Contacto</Link>
          </div>
        </div>
        <div className="border-t border-border/50 py-6 text-center text-xs text-muted-foreground font-bold tracking-wider uppercase">
          &copy; {new Date().getFullYear()} Proyecto Gestor de Torneos. Todos los derechos reservados.
        </div>
      </footer>
    </div>
  );
}