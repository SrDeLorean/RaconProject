import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/useAuthStore';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Alert from '@/components/shared/Alert';
import Select from '@/components/ui/Select';

import bgRegister from '@/assets/images/bg-register.jpg';

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
    if (userData.id_ea) payload.id_ea = userData.id_ea;

    const result = await register(payload); 
    if (result.success) {
      const currentUser = useAuthStore.getState().user;
      navigateToDashboard(currentUser);
    } 
  };

  return (
    <div className="flex min-h-screen bg-background font-sans overflow-hidden">
      
      {/* Panel Izquierdo: Estadio Nocturno */}
      <div 
        className="hidden lg:flex lg:w-1/2 relative bg-cover bg-center" 
        style={{ backgroundImage: `url(${bgRegister})` }}      
      >
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-background/20"></div>
        <div className="absolute inset-0 bg-primary/5 mix-blend-overlay"></div>
        
        <div className="relative z-10 flex flex-col justify-end p-12 h-full max-w-2xl">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-primary to-destructive flex items-center justify-center text-primary-foreground font-display font-black text-3xl mb-6 shadow-[0_0_20px_hsla(var(--primary),0.5)]">
            R
          </div>
          <h1 className="text-5xl font-display font-extrabold text-foreground uppercase tracking-tight mb-4">
            Comienza tu <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-destructive">
              Legado en FC26
            </span>
          </h1>
          <p className="text-lg text-muted-foreground/90 font-medium">
            Únete a la plataforma definitiva para jugadores. Domina la liga, gestiona plantillas y reporta resultados como los profesionales.
          </p>
        </div>
      </div>

      {/* Panel Derecho: Formulario */}
      <div className="w-full lg:w-1/2 flex justify-center items-start pt-20 sm:pt-28 pb-16 px-4 sm:px-8 lg:px-10 relative overflow-y-auto h-screen custom-scrollbar">
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-primary/10 rounded-full blur-[120px] pointer-events-none z-0"></div>

        <div className="w-full max-w-md relative z-10 animate-fade-in">
          <div className="mb-4">
            <h2 className="text-3xl font-display font-black tracking-tight text-foreground uppercase">Crear Cuenta</h2>
            <p className="text-sm font-medium text-muted-foreground mt-1">Únete a la arena competitiva de jugadores más grande.</p>
          </div>



          {authError && <Alert variant="destructive" className="mb-6">{authError}</Alert>}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            
            {/* 1. Información General */}
            <Input 
              label="Nombre de Usuario" 
              name="name" 
              value={userData.name} 
              onChange={handleChange} 
              required 
              disabled={authLoading} 
              icon={<span className="opacity-70">👤</span>} 
            />
            
            <Input 
              label="Correo Electrónico" 
              type="email" 
              name="email" 
              value={userData.email} 
              onChange={handleChange} 
              required 
              disabled={authLoading} 
              icon={<span className="opacity-70">📧</span>} 
            />

            {/* 2. Sección Gamer Obligatoria (Siempre visible, optimizada) */}
            <div className="p-4 rounded-xl bg-card/60 border border-border/50 flex flex-col gap-4">
              <p className="text-xs font-bold text-primary uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <span>🎮</span> Datos del Jugador / Identidad EA
              </p>
              
              <div>
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="text-technical text-muted-foreground">EA ID</span>
                  <div className="group relative cursor-pointer text-primary hover:text-destructive transition-colors text-xs font-bold bg-primary/10 w-4.5 h-4.5 rounded-full flex items-center justify-center">
                    ℹ️
                    <span className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 p-2 text-[10px] leading-relaxed bg-card border border-border text-foreground rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-50">
                      Número que se encuentra en la configuración de cuenta de EA.
                    </span>
                  </div>
                </div>
                <Input 
                  type="number" 
                  name="id_ea" 
                  value={userData.id_ea} 
                  onChange={handleChange} 
                  disabled={authLoading} 
                  placeholder="Ej: 100293847"
                  className="!gap-0"
                />
                <p className="text-[10px] text-muted-foreground mt-1 italic pl-1">
                  * Número que se encuentra en la configuración de cuenta de EA.
                </p>
              </div>

              <div>
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="text-technical text-muted-foreground">GamerTAG (EA Nickname)</span>
                  <div className="group relative cursor-pointer text-primary hover:text-destructive transition-colors text-xs font-bold bg-primary/10 w-4.5 h-4.5 rounded-full flex items-center justify-center">
                    ℹ️
                    <span className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-2 text-[10px] leading-relaxed bg-card border border-border text-foreground rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-50">
                      NOMBRE EXACTO AL DE EA, es el nombre que aparece al ver el listado de jugadores conectados en el partido.
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
                />
                <p className="text-[10px] text-primary mt-1 italic pl-1 font-semibold">
                  * NOMBRE EXACTO AL DE EA, es el nombre que aparece al ver el listado de jugadores conectados en el partido.
                </p>
              </div>

              <Select 
                label="Plataforma de Juego" 
                name="plataforma" 
                value={userData.plataforma} 
                onChange={handleChange} 
                disabled={authLoading} 
                options={[
                  { value: 'ps5', label: 'PlayStation 5' },
                  { value: 'xbox', label: 'Xbox Series X/S' },
                  { value: 'pc', label: 'PC' },
                  { value: 'crossplay', label: 'Crossplay total' }
                ]}
              />
            </div>

            {/* 3. Contraseñas */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input 
                label="Contraseña" 
                type="password" 
                name="password" 
                value={userData.password} 
                onChange={handleChange} 
                required 
                disabled={authLoading} 
                icon={<span className="opacity-70">🔒</span>} 
              />
              <Input 
                label="Confirmar Contraseña" 
                type="password" 
                name="password_confirmation" 
                value={userData.password_confirmation} 
                onChange={handleChange} 
                required 
                disabled={authLoading} 
                icon={<span className="opacity-70">🛡️</span>} 
              />
            </div>

            <Button 
              type="submit" 
              className="w-full mt-4 py-4 font-bold tracking-wide uppercase hover:shadow-[0_0_15px_hsla(var(--primary),0.5)] transition-all bg-gradient-to-r from-primary to-destructive text-primary-foreground" 
              isLoading={authLoading}
            >
              Registrarme Ahora
            </Button>
          </form>

          <p className="text-center text-sm font-medium text-muted-foreground mt-8">
            ¿Ya tienes una cuenta? <Link to="/login" className="text-primary hover:text-destructive font-bold transition-colors">Inicia sesión</Link>
          </p>
        </div>
      </div>
    </div>
  );
}