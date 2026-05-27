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
  const { register, authLoading, authError, clearAuthError, isAuthenticated } = useAuthStore();
  const [userData, setUserData] = useState({ name: '', email: '', role: 'jugador', password: '', password_confirmation: '' });

  // ... (Hooks y handlers idénticos al anterior) ...
  useEffect(() => { if (isAuthenticated) navigate('/admin'); return () => clearAuthError(); }, [isAuthenticated, navigate, clearAuthError]);
  const handleChange = (e) => { setUserData({ ...userData, [e.target.name]: e.target.value }); if (authError) clearAuthError(); };
  const handleSubmit = async (e) => { e.preventDefault(); if (userData.password !== userData.password_confirmation) { useAuthStore.setState({ authError: 'Las contraseñas no coinciden.' }); return; } const result = await register(userData); if (result.success) navigate('/admin'); };

  return (
    <div className="flex min-h-screen bg-background font-sans overflow-hidden">
      
      {/* Panel Izquierdo: Estadio Nocturno (Vibra Competición Oficial FC) */}
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
            Únete a la plataforma definitiva para jugadores y organizadores. Domina la liga, gestiona plantillas y reporta resultados como los profesionales.
          </p>
        </div>
      </div>

      {/* Panel Derecho: Formulario */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 md:p-12 relative">
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-primary/10 rounded-full blur-[120px] pointer-events-none z-0"></div>

        <div className="w-full max-w-md relative z-10 animate-fade-in">
          <div className="mb-8">
            <h2 className="text-3xl font-display font-black tracking-tight text-foreground uppercase">Crear Cuenta</h2>
            <p className="text-sm font-medium text-muted-foreground mt-1">Únete a la arena competitiva más grande.</p>
          </div>

          <div className="grid grid-cols-3 gap-3 mb-6">
            <Button variant="outline" className="border-border/50 hover:bg-muted text-foreground">Google</Button>
            <Button variant="outline" className="border-border/50 hover:bg-muted text-foreground">Apple</Button>
            <Button variant="outline" className="border-border/50 hover:bg-muted text-foreground">Discord</Button>
          </div>

          <div className="relative flex items-center py-2 mb-6">
            <div className="flex-grow border-t border-border/50"></div>
            <span className="flex-shrink-0 mx-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">o regístrate con email</span>
            <div className="flex-grow border-t border-border/50"></div>
          </div>

          {authError && <Alert variant="destructive" className="mb-6">{authError}</Alert>}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Input label="Nombre de Usuario / Organización" name="name" value={userData.name} onChange={handleChange} required disabled={authLoading} icon={<span className="opacity-70">👤</span>} />
            <Input label="Correo Electrónico" type="email" name="email" value={userData.email} onChange={handleChange} required disabled={authLoading} icon={<span className="opacity-70">📧</span>} />
            <Select label="Tipo de Perfil" name="role" value={userData.role} onChange={handleChange} disabled={authLoading} options={[{ value: 'jugador', label: 'Jugador Competitivo' }, { value: 'organizador', label: 'Organizador' }]} />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input label="Contraseña" type="password" name="password" value={userData.password} onChange={handleChange} required disabled={authLoading} icon={<span className="opacity-70">🔒</span>} />
              <Input label="Confirmar Contraseña" type="password" name="password_confirmation" value={userData.password_confirmation} onChange={handleChange} required disabled={authLoading} icon={<span className="opacity-70">🛡️</span>} />
            </div>
            <Button type="submit" className="w-full mt-4 py-4 font-bold tracking-wide uppercase hover:shadow-[0_0_15px_hsla(var(--primary),0.5)] transition-all" isLoading={authLoading}>
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