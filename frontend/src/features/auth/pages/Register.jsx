import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/useAuthStore';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Alert from '@/components/shared/Alert';
import Select from '@/components/ui/Select';
import bgRegister from '@/assets/images/bg-register.jpg';

// Iconos SVG de alta resolución para estética Esports
const UserIcon = () => (
  <svg className="w-4 h-4 text-primary/80" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

const MailIcon = () => (
  <svg className="w-4 h-4 text-primary/80" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </svg>
);

const GamepadIcon = () => (
  <svg className="w-4 h-4 text-primary/80" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <rect x="2" y="6" width="20" height="12" rx="4" />
    <path d="M6 12h4M8 10v4M15 11v.01M18 13v.01" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const LockIcon = () => (
  <svg className="w-4 h-4 text-primary/80" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
  </svg>
);

const ShieldIcon = () => (
  <svg className="w-4 h-4 text-primary/80" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
  </svg>
);


export default function Register() {
  const navigate = useNavigate();
  const { user, register, authLoading, authError, clearAuthError, isAuthenticated } = useAuthStore();
  
  const [userData, setUserData] = useState({ 
    name: '', 
    email: '', 
    role: 'jugador', // Siempre tipo jugador por defecto
    password: '', 
    password_confirmation: '',
    gamertag: '',
    id_ea: '',
    plataforma: 'ps5'
  });

  const navigateToDashboard = (currentUser) => {
    const role = currentUser?.role || 'jugador';
    if (role === 'administrador' || role === 'admin') {
      navigate('/admin');
    } else if (role === 'organizador') {
      navigate('/organizador');
    } else {
      navigate('/jugador');
    }
  };

  useEffect(() => { 
    if (isAuthenticated && user) {
      navigateToDashboard(user);
    } 
    return () => clearAuthError(); 
  }, [isAuthenticated, user, navigate, clearAuthError]);

  const handleChange = (e) => { 
    setUserData({ ...userData, [e.target.name]: e.target.value }); 
    if (authError) clearAuthError(); 
  };

  const handleSubmit = async (e) => { 
    e.preventDefault(); 
    if (userData.password !== userData.password_confirmation) { 
      useAuthStore.setState({ authError: 'Las contraseñas no coinciden.' }); 
      return; 
    } 

    const payload = {
      name: userData.name,
      email: userData.email,
      role: 'jugador', // Forzado a jugador
      password: userData.password,
      password_confirmation: userData.password_confirmation,
      plataforma: userData.plataforma
    };

    if (userData.gamertag) payload.gamertag = userData.gamertag;

    const result = await register(payload); 
    if (result.success) {
      const currentUser = useAuthStore.getState().user;
      navigateToDashboard(currentUser);
    } 
  };

  return (
    <div className="flex min-h-screen bg-background text-foreground font-sans overflow-hidden transition-colors duration-300">
      
      {/* Panel Izquierdo: Estadio Nocturno (Siempre Oscuro para estilo e-sports premium) */}
      <div 
        className="hidden lg:flex lg:w-1/2 relative bg-cover bg-center bg-[#07070a]" 
        style={{ backgroundImage: `url(${bgRegister})` }}      
      >
        <div className="absolute inset-0 bg-gradient-to-t from-[#07070a] via-[#07070a]/80 to-[#07070a]/20"></div>
        <div className="absolute inset-0 bg-primary/5 mix-blend-overlay"></div>
        
        <div className="relative z-10 flex flex-col justify-end p-12 h-full max-w-2xl text-white">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-primary to-destructive flex items-center justify-center text-primary-foreground font-display font-black text-3xl mb-6 shadow-[0_0_20px_hsla(var(--primary),0.5)]">
            R
          </div>
          <h1 className="text-5xl font-display font-extrabold uppercase tracking-tight mb-4 leading-none text-white">
            Comienza tu <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-destructive">
              Legado en FC26
            </span>
          </h1>
          <p className="text-base text-gray-300 font-medium max-w-lg leading-relaxed">
            Únete a la plataforma definitiva para jugadores. Domina la liga, gestiona plantillas y reporta resultados como los profesionales.
          </p>
        </div>
      </div>

      {/* Panel Derecho: Formulario */}
      <div className="w-full lg:w-1/2 flex items-start lg:items-center justify-center pt-24 pb-12 lg:py-8 px-4 sm:px-8 lg:px-12 relative overflow-y-auto h-screen custom-scrollbar">
        {/* Glow ambient de fondo para acentuar el diseño de Esports */}
        <div className="absolute top-1/4 right-1/4 w-[300px] sm:w-[450px] h-[300px] sm:h-[450px] bg-primary/10 rounded-full blur-[100px] sm:blur-[130px] pointer-events-none z-0"></div>
        <div className="absolute bottom-1/4 left-1/4 w-[250px] sm:w-[350px] h-[250px] sm:h-[350px] bg-destructive/5 rounded-full blur-[80px] sm:blur-[110px] pointer-events-none z-0"></div>

        <div className="w-full max-w-lg relative z-10 my-auto">
          
          {/* Card HUD Contenedora con Glassmorphism y Brackets */}
          <div className="relative bg-card/60 dark:bg-card/25 backdrop-blur-md border border-border/60 dark:border-border/30 rounded-2xl p-6 sm:p-8 shadow-xl dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.5)] border-t-primary/20 border-l-primary/20 transition-all duration-300">
            {/* Brackets tácticos cibernéticos */}
            <div className="absolute top-0 left-0 w-3.5 h-3.5 border-t-2 border-l-2 border-primary/40 dark:border-primary/50 rounded-tl-md pointer-events-none"></div>
            <div className="absolute top-0 right-0 w-3.5 h-3.5 border-t-2 border-r-2 border-primary/40 dark:border-primary/50 rounded-tr-md pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 w-3.5 h-3.5 border-b-2 border-l-2 border-primary/40 dark:border-primary/50 rounded-bl-md pointer-events-none"></div>
            <div className="absolute bottom-0 right-0 w-3.5 h-3.5 border-b-2 border-r-2 border-primary/40 dark:border-primary/50 rounded-br-md pointer-events-none"></div>

            <div className="mb-6 relative">
              <h2 className="text-2xl sm:text-3xl font-display font-black tracking-tight text-foreground uppercase">
                Crear <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-destructive">Cuenta</span>
              </h2>
              <p className="text-xs font-mono text-muted-foreground mt-1 uppercase tracking-widest flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
                Únete a la arena de juego
              </p>
              <div className="h-[1px] w-full bg-gradient-to-r from-border/80 via-border/20 to-transparent mt-4"></div>
            </div>

            {authError && (
              <Alert variant="destructive" className="mb-5 py-3 text-xs">
                {authError}
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              
              {/* 1. Información General (Dos columnas en desktop) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input 
                  label="Nombre de Usuario" 
                  name="name" 
                  value={userData.name} 
                  onChange={handleChange} 
                  required 
                  disabled={authLoading} 
                  icon={<UserIcon />} 
                  placeholder="Tu apodo"
                />
                
                <Input 
                  label="Correo Electrónico" 
                  type="email" 
                  name="email" 
                  value={userData.email} 
                  onChange={handleChange} 
                  required 
                  disabled={authLoading} 
                  icon={<MailIcon />} 
                  placeholder="correo@ejemplo.com"
                />
              </div>

              {/* 2. Sección Gamer Obligatoria (Siempre visible, optimizada) */}
              <div className="p-4 rounded-xl bg-card/40 backdrop-blur border border-border/30 flex flex-col gap-4">
                <p className="text-[10px] sm:text-xs font-mono font-bold text-primary uppercase tracking-wider flex items-center gap-1.5 border-b border-border/20 pb-2">
                  <GamepadIcon /> Datos del Jugador / Identidad EA
                </p>
                
                <div>
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <span className="text-technical text-muted-foreground">GamerTAG (EA Nickname)</span>
                    <div className="group relative cursor-pointer text-primary hover:text-destructive transition-colors text-[10px] font-bold bg-primary/10 w-4 h-4 rounded-full flex items-center justify-center">
                      ?
                      <span className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 sm:w-56 p-2 text-[9px] leading-normal bg-card border border-border text-foreground rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-50 text-center font-normal font-sans">
                        Nombre exacto con el que apareces dentro de los partidos en EA.
                      </span>
                    </div>
                  </div>
                  <Input 
                    name="gamertag" 
                    value={userData.gamertag} 
                    onChange={handleChange} 
                    disabled={authLoading} 
                    placeholder="Ej: Racon_Nickname"
                    className="!gap-0"
                    icon={<GamepadIcon />}
                  />
                </div>

                <p className="text-[9px] text-primary/80 leading-normal italic pl-1 font-mono">
                  * El GamerTAG debe ser idéntico al de EA para sincronizar tus estadísticas de juego correctamente.
                </p>
              </div>

              {/* 3. Contraseñas (Dos columnas) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input 
                  label="Contraseña" 
                  type="password" 
                  name="password" 
                  value={userData.password} 
                  onChange={handleChange} 
                  required 
                  disabled={authLoading} 
                  icon={<LockIcon />} 
                  placeholder="••••••••"
                />
                <Input 
                  label="Confirmar Contraseña" 
                  type="password" 
                  name="password_confirmation" 
                  value={userData.password_confirmation} 
                  onChange={handleChange} 
                  required 
                  disabled={authLoading} 
                  icon={<ShieldIcon />} 
                  placeholder="••••••••"
                />
              </div>

              <Button 
                type="submit" 
                className="w-full mt-2 py-3.5 font-bold tracking-widest uppercase hover:shadow-[0_0_20px_hsla(var(--primary),0.6)] transition-all bg-gradient-to-r from-primary to-destructive text-primary-foreground border-none rounded-md" 
                isLoading={authLoading}
              >
                Registrarme Ahora
              </Button>
            </form>

            <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-border/30 to-transparent my-6"></div>

            <p className="text-center text-xs font-semibold text-muted-foreground">
              ¿Ya tienes una cuenta?{' '}
              <Link to="/login" className="text-primary hover:text-destructive font-bold transition-colors uppercase tracking-wider">
                Inicia sesión
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}