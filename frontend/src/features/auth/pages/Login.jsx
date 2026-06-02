import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/useAuthStore';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Alert from '@/components/shared/Alert';
import bgLogin from '@/assets/images/bg-login.jpg';
import api from '@/api/axios';

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
    <div className="flex min-h-screen bg-background font-sans overflow-hidden">
      
      {/* Panel Izquierdo: Setup Gamer */}
      <div 
        className="hidden lg:flex lg:w-1/2 relative bg-cover bg-center" 
        style={{ backgroundImage: `url(${bgLogin})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-background/20"></div>
        <div className="absolute inset-0 bg-primary/10 mix-blend-overlay"></div>
        
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

      {/* Panel Derecho: Formulario Dinámico */}
      <div className="w-full lg:w-1/2 flex justify-center py-12 px-4 sm:px-8 lg:px-10 relative overflow-y-auto h-screen custom-scrollbar">
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-primary/10 rounded-full blur-[120px] pointer-events-none z-0"></div>

        <div className="w-full max-w-md my-auto relative z-10 animate-fade-in">
          
          {/* ========================================================================= */}
          {/* VISTA 1: INICIAR SESIÓN                                                   */}
          {/* ========================================================================= */}
          {view === 'login' && (
            <div className="animate-fade-in">
              <div className="mb-8">
                <h2 className="text-3xl font-display font-black tracking-tight text-foreground uppercase">Iniciar Sesión</h2>
                <p className="text-sm font-medium text-muted-foreground mt-1">Ingresa tus credenciales para continuar.</p>
              </div>



              {authError && <Alert variant="destructive" className="mb-6" onClose={clearAuthError}>{authError}</Alert>}

              <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                <Input 
                  label="Correo Electrónico" 
                  type="email" 
                  name="email" 
                  value={credentials.email} 
                  onChange={handleChange} 
                  required 
                  disabled={authLoading} 
                  icon={<span className="opacity-70">📧</span>} 
                />
                
                <div className="flex flex-col gap-1">
                  <Input 
                    label="Contraseña" 
                    type="password" 
                    name="password" 
                    value={credentials.password} 
                    onChange={handleChange} 
                    required 
                    disabled={authLoading} 
                    icon={<span className="opacity-70">🔒</span>} 
                  />
                  <div className="text-right mt-1">
                    <button 
                      type="button" 
                      onClick={() => {
                        setView('forgot');
                        setRecoveryError('');
                        setRecoverySuccess('');
                      }} 
                      className="text-xs font-bold text-muted-foreground hover:text-primary transition-colors focus:outline-none"
                    >
                      ¿Olvidaste tu contraseña?
                    </button>
                  </div>
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full mt-4 py-4 font-bold tracking-wide uppercase hover:shadow-[0_0_15px_hsla(var(--primary),0.5)] transition-all" 
                  isLoading={authLoading}
                >
                  Entrar al Sistema
                </Button>
              </form>

              <p className="text-center text-sm font-medium text-muted-foreground mt-8">
                ¿No tienes una cuenta? <Link to="/registro" className="text-primary hover:text-destructive font-bold transition-colors">Regístrate aquí</Link>
              </p>
            </div>
          )}

          {/* ========================================================================= */}
          {/* VISTA 2: OLVIDÓ SU CONTRASEÑA (forgot-password)                          */}
          {/* ========================================================================= */}
          {view === 'forgot' && (
            <div className="animate-fade-in">
              <div className="mb-8">
                <h2 className="text-3xl font-display font-black tracking-tight text-foreground uppercase">Recuperar Contraseña</h2>
                <p className="text-sm font-medium text-muted-foreground mt-1">
                  Ingresa tu correo y te enviaremos las instrucciones de restablecimiento.
                </p>
              </div>

              {recoveryError && <Alert variant="destructive" className="mb-6" onClose={() => setRecoveryError('')}>{recoveryError}</Alert>}
              {recoverySuccess && <Alert variant="success" className="mb-6">{recoverySuccess}</Alert>}

              <form onSubmit={handleForgotSubmit} className="flex flex-col gap-5">
                <Input 
                  label="Correo Registrado" 
                  type="email" 
                  value={recoveryEmail} 
                  onChange={(e) => setRecoveryEmail(e.target.value)} 
                  required 
                  disabled={isRecovering} 
                  icon={<span className="opacity-70">📧</span>} 
                  placeholder="ejemplo@racon.com"
                />

                <Button 
                  type="submit" 
                  className="w-full mt-2 py-4 font-bold tracking-wide uppercase hover:shadow-[0_0_15px_hsla(var(--primary),0.5)] transition-all" 
                  isLoading={isRecovering}
                >
                  Enviar Solicitud
                </Button>
              </form>

              <div className="text-center mt-6">
                <button 
                  type="button" 
                  onClick={() => setView('login')} 
                  className="text-xs font-bold text-muted-foreground hover:text-primary transition-colors focus:outline-none"
                >
                  ⬅ Volver a Iniciar Sesión
                </button>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* VISTA 3: RESTABLECER CONTRASEÑA (reset-password)                           */}
          {/* ========================================================================= */}
          {view === 'reset' && (
            <div className="animate-fade-in">
              <div className="mb-8">
                <h2 className="text-3xl font-display font-black tracking-tight text-foreground uppercase">Nueva Contraseña</h2>
                <p className="text-sm font-medium text-muted-foreground mt-1">
                  Ingresa y confirma tu nueva clave de acceso para tu cuenta.
                </p>
              </div>

              {recoveryError && <Alert variant="destructive" className="mb-6" onClose={() => setRecoveryError('')}>{recoveryError}</Alert>}
              {recoverySuccess && <Alert variant="success" className="mb-6">{recoverySuccess}</Alert>}

              <form onSubmit={handleResetSubmit} className="flex flex-col gap-5">
                <Input 
                  label="Correo Electrónico" 
                  type="email" 
                  value={recoveryEmail} 
                  disabled 
                  className="opacity-70"
                  icon={<span className="opacity-70">📧</span>} 
                />

                <Input 
                  label="Código de Seguridad (recibido por correo)" 
                  type="text" 
                  value={recoveryToken} 
                  onChange={(e) => setRecoveryToken(e.target.value)} 
                  required 
                  disabled={isRecovering} 
                  placeholder="Pegar código del correo..."
                  icon={<span className="opacity-70">🔑</span>} 
                />

                <Input 
                  label="Nueva Contraseña (mínimo 8 caracteres)" 
                  type="password" 
                  value={newPassword} 
                  onChange={(e) => setNewPassword(e.target.value)} 
                  required 
                  disabled={isRecovering} 
                  placeholder="••••••••"
                  icon={<span className="opacity-70">🔒</span>} 
                />

                <Input 
                  label="Confirmar Nueva Contraseña" 
                  type="password" 
                  value={confirmNewPassword} 
                  onChange={(e) => setConfirmNewPassword(e.target.value)} 
                  required 
                  disabled={isRecovering} 
                  placeholder="••••••••"
                  icon={<span className="opacity-70">🔒</span>} 
                />

                <Button 
                  type="submit" 
                  className="w-full mt-2 py-4 font-bold tracking-wide uppercase hover:shadow-[0_0_15px_hsla(var(--primary),0.5)] transition-all bg-gradient-to-r from-primary to-destructive" 
                  isLoading={isRecovering}
                >
                  Restablecer Contraseña Real
                </Button>
              </form>

              <div className="text-center mt-6">
                <button 
                  type="button" 
                  onClick={() => setView('login')} 
                  className="text-xs font-bold text-muted-foreground hover:text-primary transition-colors focus:outline-none"
                  disabled={isRecovering}
                >
                  ⬅ Volver a Iniciar Sesión
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}