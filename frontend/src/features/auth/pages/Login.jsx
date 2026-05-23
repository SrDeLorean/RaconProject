import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/useAuthStore';
import Input from '@/components/shared/Input';
import Button from '@/components/shared/Button';
import Alert from '@/components/shared/Alert';
import bgLogin from '@/assets/images/bg-login.jpg';

export default function Login() {
  const navigate = useNavigate();
  const { login, authLoading, authError, clearAuthError, isAuthenticated } = useAuthStore();
  
  const [credentials, setCredentials] = useState({ email: '', password: '' });

  useEffect(() => {
    if (isAuthenticated) navigate('/admin');
    return () => clearAuthError();
  }, [isAuthenticated, navigate, clearAuthError]);

  const handleChange = (e) => {
    setCredentials({ ...credentials, [e.target.name]: e.target.value });
    if (authError) clearAuthError();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await login(credentials);
    if (result.success) navigate('/admin');
  };

  return (
    <div className="flex min-h-screen bg-background font-sans overflow-hidden">
      
      {/* Panel Izquierdo: Setup Gamer (Vibra FC Competitivo) */}
      <div 
        className="hidden lg:flex lg:w-1/2 relative bg-cover bg-center" 
        style={{ backgroundImage: `url(${bgLogin})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-background/20"></div>
        <div className="absolute inset-0 bg-primary/10 mix-blend-overlay"></div> {/* Tinte sutil del color de tu marca */}
        
        <div className="relative z-10 flex flex-col justify-end p-12 h-full max-w-2xl">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-primary to-destructive flex items-center justify-center text-primary-foreground font-display font-black text-3xl mb-6 shadow-[0_0_20px_hsla(var(--primary),0.5)]">
            R
          </div>
          <h1 className="text-5xl font-display font-extrabold text-foreground uppercase tracking-tight mb-4">
            Bienvenido de <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-destructive">
              Vuelta a la Arena
            </span>
          </h1>
          <p className="text-lg text-muted-foreground/90 font-medium">
            Accede al Centro de Mando de RaconPro. Verifica resultados, organiza nuevas jornadas y sigue escalando en el ranking mundial de FC26.
          </p>
        </div>
      </div>

      {/* Panel Derecho: Formulario (Se mantiene igual de limpio) */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 md:p-12 relative">
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-primary/10 rounded-full blur-[120px] pointer-events-none z-0"></div>

        <div className="w-full max-w-md relative z-10 animate-fade-in">
          <div className="mb-8">
            <h2 className="text-3xl font-display font-black tracking-tight text-foreground uppercase">Iniciar Sesión</h2>
            <p className="text-sm font-medium text-muted-foreground mt-1">Ingresa tus credenciales para continuar.</p>
          </div>

          {/* ... Resto del formulario (Botones sociales, inputs, etc.) exactamente igual que antes ... */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            <Button variant="outline" className="border-border/50 hover:bg-muted text-foreground">Google</Button>
            <Button variant="outline" className="border-border/50 hover:bg-muted text-foreground">Apple</Button>
            <Button variant="outline" className="border-border/50 hover:bg-muted text-foreground">Discord</Button>
          </div>

          <div className="relative flex items-center py-2 mb-6">
            <div className="flex-grow border-t border-border/50"></div>
            <span className="flex-shrink-0 mx-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">o inicia sesión con email</span>
            <div className="flex-grow border-t border-border/50"></div>
          </div>

          {authError && <Alert variant="destructive" className="mb-6" onClose={clearAuthError}>{authError}</Alert>}

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <Input label="Correo Electrónico" type="email" name="email" value={credentials.email} onChange={handleChange} required disabled={authLoading} icon={<span className="opacity-70">📧</span>} />
            <div className="flex flex-col gap-1">
              <Input label="Contraseña" type="password" name="password" value={credentials.password} onChange={handleChange} required disabled={authLoading} icon={<span className="opacity-70">🔒</span>} />
              <div className="text-right mt-1">
                <a href="#recuperar" className="text-xs font-bold text-muted-foreground hover:text-primary transition-colors">¿Olvidaste tu contraseña?</a>
              </div>
            </div>
            <Button type="submit" className="w-full mt-4 py-4 font-bold tracking-wide uppercase hover:shadow-[0_0_15px_hsla(var(--primary),0.5)] transition-all" isLoading={authLoading}>
              Entrar al Sistema
            </Button>
          </form>

          <p className="text-center text-sm font-medium text-muted-foreground mt-8">
            ¿No tienes una cuenta? <Link to="/registro" className="text-primary hover:text-destructive font-bold transition-colors">Regístrate aquí</Link>
          </p>
        </div>
      </div>
    </div>
  );
}