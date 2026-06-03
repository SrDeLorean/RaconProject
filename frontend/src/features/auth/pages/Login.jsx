import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/useAuthStore';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Alert from '@/components/shared/Alert';
import bgLogin from '@/assets/images/bg-login.jpg';
import api from '@/api/axios';

// Iconos SVG para una apariencia premium sin dependencias externas
const MailIcon = () => (
  <svg className="w-4 h-4 text-primary/80" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </svg>
);

const LockIcon = () => (
  <svg className="w-4 h-4 text-primary/80" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
  </svg>
);

const KeyIcon = () => (
  <svg className="w-4 h-4 text-primary/80" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 7a2 2 0 012 2m-2-2a2 2 0 00-2 2m2-2a2 2 0 002 2m0 0V11m0 0L21 15v2h-2v-2h-2l-2-2m-2-2H9a3 3 0 00-3 3v4h2v-2h2v-2h2a3 3 0 003-3V9a3 3 0 00-3-3H9a3 3 0 00-3 3v2" />
  </svg>
);

export default function Login() {
  const navigate = useNavigate();
  const { user, login, authLoading, authError, clearAuthError, isAuthenticated } = useAuthStore();
  
  const [credentials, setCredentials] = useState({ email: '', password: '' });

  // Estados para el flujo de recuperación de contraseña
  const [view, setView] = useState('login'); // 'login' | 'forgot' | 'reset'
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [recoveryToken, setRecoveryToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [recoveryError, setRecoveryError] = useState('');
  const [recoverySuccess, setRecoverySuccess] = useState('');
  const [isRecovering, setIsRecovering] = useState(false);

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
    setCredentials({ ...credentials, [e.target.name]: e.target.value });
    if (authError) clearAuthError();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await login(credentials);
    if (result.success) {
      const currentUser = useAuthStore.getState().user;
      navigateToDashboard(currentUser);
    }
  };

  // 1. Enviar solicitud de recuperación (forgotPassword)
  const handleForgotSubmit = async (e) => {
    e.preventDefault();
    setIsRecovering(true);
    setRecoveryError('');
    setRecoverySuccess('');

    try {
      const response = await api.post('/forgot-password', { email: recoveryEmail });
      if (response.data) {
        setRecoverySuccess(response.data.message);
        // Limpiamos el token local para obligar al usuario a ingresarlo manualmente desde su correo
        setRecoveryToken('');
        
        // Transición con delay para leer el éxito
        setTimeout(() => {
          setView('reset');
          setRecoverySuccess('');
        }, 2000);
      }
    } catch (error) {
      console.error(error);
      const errMsg = error.response?.data?.message || 'El correo ingresado no está registrado.';
      setRecoveryError(errMsg);
    } finally {
      setIsRecovering(false);
    }
  };

  // 2. Establecer la nueva contraseña (resetPassword)
  const handleResetSubmit = async (e) => {
    e.preventDefault();

    if (newPassword.length < 8) {
      setRecoveryError('La contraseña debe tener al menos 8 caracteres.');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setRecoveryError('Las contraseñas no coinciden.');
      return;
    }

    setIsRecovering(true);
    setRecoveryError('');
    setRecoverySuccess('');

    try {
      const response = await api.post('/reset-password', {
        email: recoveryEmail,
        token: recoveryToken,
        password: newPassword,
        password_confirmation: confirmNewPassword
      });

      if (response.data) {
        setRecoverySuccess(response.data.message);
        // Limpiamos los inputs
        setNewPassword('');
        setConfirmNewPassword('');
        
        // Redirección con delay al login de vuelta
        setTimeout(() => {
          setView('login');
          setRecoverySuccess('');
          setRecoveryEmail('');
          setRecoveryToken('');
        }, 3000);
      }
    } catch (error) {
      console.error(error);
      const errMsg = error.response?.data?.message || 'Error al restablecer la contraseña. Inténtalo de nuevo.';
      setRecoveryError(errMsg);
    } finally {
      setIsRecovering(false);
    }
  };
  return (
    <div className="flex min-h-screen bg-background text-foreground font-sans overflow-hidden transition-colors duration-300">
      
      {/* Panel Izquierdo: Setup Gamer (Siempre Oscuro para estilo e-sports premium) */}
      <div 
        className="hidden lg:flex lg:w-1/2 relative bg-cover bg-center bg-[#07070a]" 
        style={{ backgroundImage: `url(${bgLogin})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-[#07070a] via-[#07070a]/80 to-[#07070a]/20"></div>
        <div className="absolute inset-0 bg-primary/10 mix-blend-overlay"></div>
        
        <div className="relative z-10 flex flex-col justify-end p-12 h-full max-w-2xl text-white">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-primary to-destructive flex items-center justify-center text-primary-foreground font-display font-black text-3xl mb-6 shadow-[0_0_20px_hsla(var(--primary),0.5)]">
            R
          </div>
          <h1 className="text-5xl font-display font-extrabold uppercase tracking-tight mb-4 leading-none text-white">
            Bienvenido de <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-destructive">
              Vuelta a la Arena
            </span>
          </h1>
          <p className="text-base text-gray-300 font-medium max-w-lg leading-relaxed">
            Accede al Centro de Mando de RaconPro. Verifica resultados, organiza nuevas jornadas y sigue escalando en el ranking mundial de FC26.
          </p>
        </div>
      </div>

      {/* Panel Derecho: Formulario Dinámico */}
      <div className="w-full lg:w-1/2 flex items-start lg:items-center justify-center pt-24 pb-12 lg:py-8 px-4 sm:px-8 lg:px-12 relative overflow-y-auto h-screen custom-scrollbar">
        {/* Glow ambient de fondo para acentuar el diseño de Esports */}
        <div className="absolute top-1/4 right-1/4 w-[300px] sm:w-[450px] h-[300px] sm:h-[450px] bg-primary/10 rounded-full blur-[100px] sm:blur-[130px] pointer-events-none z-0"></div>
        <div className="absolute bottom-1/4 left-1/4 w-[250px] sm:w-[350px] h-[250px] sm:h-[350px] bg-destructive/5 rounded-full blur-[80px] sm:blur-[110px] pointer-events-none z-0"></div>

        <div className="w-full max-w-md relative z-10 my-auto">
          
          {/* Card HUD Contenedora con Glassmorphism y Brackets */}
          <div className="relative bg-card/60 dark:bg-card/25 backdrop-blur-md border border-border/60 dark:border-border/30 rounded-2xl p-6 sm:p-8 shadow-xl dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.5)] border-t-primary/20 border-l-primary/20 transition-all duration-300">
            {/* Brackets tácticos cibernéticos */}
            <div className="absolute top-0 left-0 w-3.5 h-3.5 border-t-2 border-l-2 border-primary/40 dark:border-primary/50 rounded-tl-md pointer-events-none"></div>
            <div className="absolute top-0 right-0 w-3.5 h-3.5 border-t-2 border-r-2 border-primary/40 dark:border-primary/50 rounded-tr-md pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 w-3.5 h-3.5 border-b-2 border-l-2 border-primary/40 dark:border-primary/50 rounded-bl-md pointer-events-none"></div>
            <div className="absolute bottom-0 right-0 w-3.5 h-3.5 border-b-2 border-r-2 border-primary/40 dark:border-primary/50 rounded-br-md pointer-events-none"></div>

            {/* ========================================================================= */}
            {/* VISTA 1: INICIAR SESIÓN                                                   */}
            {/* ========================================================================= */}
            {view === 'login' && (
              <div className="animate-fade-in">
                <div className="mb-6 relative">
                  <h2 className="text-2xl sm:text-3xl font-display font-black tracking-tight text-foreground uppercase">
                    Iniciar <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-destructive">Sesión</span>
                  </h2>
                  <p className="text-xs font-mono text-muted-foreground mt-1 uppercase tracking-widest flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
                    Acceso al centro de mando
                  </p>
                  <div className="h-[1px] w-full bg-gradient-to-r from-border/80 via-border/20 to-transparent mt-4"></div>
                </div>

                {authError && (
                  <Alert variant="destructive" className="mb-5 py-3 text-xs" onClose={clearAuthError}>
                    {authError}
                  </Alert>
                )}

                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                  <Input 
                    label="Correo Electrónico" 
                    type="email" 
                    name="email" 
                    value={credentials.email} 
                    onChange={handleChange} 
                    required 
                    disabled={authLoading} 
                    icon={<MailIcon />} 
                    placeholder="correo@ejemplo.com"
                  />
                  
                  <div className="flex flex-col gap-1.5">
                    <Input 
                      label="Contraseña" 
                      type="password" 
                      name="password" 
                      value={credentials.password} 
                      onChange={handleChange} 
                      required 
                      disabled={authLoading} 
                      icon={<LockIcon />} 
                      placeholder="••••••••"
                    />
                    <div className="text-right mt-0.5">
                      <button 
                        type="button" 
                        onClick={() => {
                          setView('forgot');
                          setRecoveryError('');
                          setRecoverySuccess('');
                        }} 
                        className="text-[10px] font-bold text-muted-foreground/80 hover:text-primary transition-colors focus:outline-none uppercase tracking-wider"
                      >
                        ¿Olvidaste tu contraseña?
                      </button>
                    </div>
                  </div>
                  
                  <Button 
                    type="submit" 
                    className="w-full mt-2 py-3.5 font-bold tracking-widest uppercase hover:shadow-[0_0_20px_hsla(var(--primary),0.6)] transition-all bg-gradient-to-r from-primary to-destructive text-primary-foreground border-none rounded-md" 
                    isLoading={authLoading}
                  >
                    Entrar al Sistema
                  </Button>
                </form>

                <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-border/30 to-transparent my-6"></div>

                <p className="text-center text-xs font-semibold text-muted-foreground">
                  ¿No tienes una cuenta?{' '}
                  <Link to="/registro" className="text-primary hover:text-destructive font-bold transition-colors uppercase tracking-wider">
                    Regístrate aquí
                  </Link>
                </p>
              </div>
            )}

            {/* ========================================================================= */}
            {/* VISTA 2: OLVIDÓ SU CONTRASEÑA (forgot-password)                          */}
            {/* ========================================================================= */}
            {view === 'forgot' && (
              <div className="animate-fade-in">
                <div className="mb-6 relative">
                  <h2 className="text-2xl sm:text-3xl font-display font-black tracking-tight text-foreground uppercase">
                    Recuperar <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-destructive">Clave</span>
                  </h2>
                  <p className="text-xs font-mono text-muted-foreground mt-1 uppercase tracking-widest flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
                    Protocolo de restauración
                  </p>
                  <div className="h-[1px] w-full bg-gradient-to-r from-border/80 via-border/20 to-transparent mt-4"></div>
                </div>

                {recoveryError && (
                  <Alert variant="destructive" className="mb-5 py-3 text-xs" onClose={() => setRecoveryError('')}>
                    {recoveryError}
                  </Alert>
                )}
                {recoverySuccess && (
                  <Alert variant="success" className="mb-5 py-3 text-xs">
                    {recoverySuccess}
                  </Alert>
                )}

                <form onSubmit={handleForgotSubmit} className="flex flex-col gap-4">
                  <Input 
                    label="Correo Registrado" 
                    type="email" 
                    value={recoveryEmail} 
                    onChange={(e) => setRecoveryEmail(e.target.value)} 
                    required 
                    disabled={isRecovering} 
                    icon={<MailIcon />} 
                    placeholder="ejemplo@racon.com"
                  />

                  <Button 
                    type="submit" 
                    className="w-full mt-2 py-3.5 font-bold tracking-widest uppercase hover:shadow-[0_0_20px_hsla(var(--primary),0.6)] transition-all bg-gradient-to-r from-primary to-destructive text-primary-foreground border-none rounded-md" 
                    isLoading={isRecovering}
                  >
                    Enviar Solicitud
                  </Button>
                </form>

                <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-border/30 to-transparent my-6"></div>

                <div className="text-center">
                  <button 
                    type="button" 
                    onClick={() => setView('login')} 
                    className="text-[10px] font-bold text-muted-foreground/80 hover:text-primary transition-colors focus:outline-none uppercase tracking-wider flex items-center justify-center gap-1 mx-auto"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    Volver al login
                  </button>
                </div>
              </div>
            )}

            {/* ========================================================================= */}
            {/* VISTA 3: RESTABLECER CONTRASEÑA (reset-password)                           */}
            {/* ========================================================================= */}
            {view === 'reset' && (
              <div className="animate-fade-in">
                <div className="mb-6 relative">
                  <h2 className="text-2xl sm:text-3xl font-display font-black tracking-tight text-foreground uppercase">
                    Nueva <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-destructive">Clave</span>
                  </h2>
                  <p className="text-xs font-mono text-muted-foreground mt-1 uppercase tracking-widest flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
                    Restablecer acceso seguro
                  </p>
                  <div className="h-[1px] w-full bg-gradient-to-r from-border/80 via-border/20 to-transparent mt-4"></div>
                </div>

                {recoveryError && (
                  <Alert variant="destructive" className="mb-5 py-3 text-xs" onClose={() => setRecoveryError('')}>
                    {recoveryError}
                  </Alert>
                )}
                {recoverySuccess && (
                  <Alert variant="success" className="mb-5 py-3 text-xs">
                    {recoverySuccess}
                  </Alert>
                )}

                <form onSubmit={handleResetSubmit} className="flex flex-col gap-4">
                  <Input 
                    label="Correo Electrónico" 
                    type="email" 
                    value={recoveryEmail} 
                    disabled 
                    className="opacity-70"
                    icon={<MailIcon />} 
                  />

                  <Input 
                    label="Código de Seguridad" 
                    type="text" 
                    value={recoveryToken} 
                    onChange={(e) => setRecoveryToken(e.target.value)} 
                    required 
                    disabled={isRecovering} 
                    placeholder="Pegar código recibido..."
                    icon={<KeyIcon />} 
                  />

                  <Input 
                    label="Nueva Contraseña (mínimo 8 caracteres)" 
                    type="password" 
                    value={newPassword} 
                    onChange={(e) => setNewPassword(e.target.value)} 
                    required 
                    disabled={isRecovering} 
                    placeholder="••••••••"
                    icon={<LockIcon />} 
                  />

                  <Input 
                    label="Confirmar Nueva Contraseña" 
                    type="password" 
                    value={confirmNewPassword} 
                    onChange={(e) => setConfirmNewPassword(e.target.value)} 
                    required 
                    disabled={isRecovering} 
                    placeholder="••••••••"
                    icon={<LockIcon />} 
                  />

                  <Button 
                    type="submit" 
                    className="w-full mt-2 py-3.5 font-bold tracking-widest uppercase hover:shadow-[0_0_20px_hsla(var(--primary),0.6)] transition-all bg-gradient-to-r from-primary to-destructive text-primary-foreground border-none rounded-md" 
                    isLoading={isRecovering}
                  >
                    Restablecer Contraseña
                  </Button>
                </form>

                <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-border/30 to-transparent my-6"></div>

                <div className="text-center">
                  <button 
                    type="button" 
                    onClick={() => setView('login')} 
                    className="text-[10px] font-bold text-muted-foreground/80 hover:text-primary transition-colors focus:outline-none uppercase tracking-wider flex items-center justify-center gap-1 mx-auto"
                    disabled={isRecovering}
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    Volver al login
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}