import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import api from '@/api/axios';
import { useAuthStore } from '@/store/useAuthStore';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Alert from '@/components/shared/Alert';
import bgRegister from '@/assets/images/bg-register.jpg';
import logoImg from '@/assets/images/logo.png';

// Vector Icons
const MailIcon = () => (
  <svg className="w-4 h-4 text-primary/80" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </svg>
);

const KeyIcon = () => (
  <svg className="w-4 h-4 text-primary/80" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 7a2 2 0 012 2m-2-2a2 2 0 00-2 2m2-2a2 2 0 002 2m0 0V11m0 0L21 15v2h-2v-2h-2l-2-2m-2-2H9a3 3 0 00-3 3v4h2v-2h2v-2h2a3 3 0 003-3V9a3 3 0 00-3-3H9a3 3 0 00-3 3v2" />
  </svg>
);

export default function VerificarCorreo() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const tokenFromUrl = searchParams.get('token');
  const emailFromUrl = searchParams.get('email') || '';

  const [tokenInput, setTokenInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('idle'); // 'idle' | 'verifying' | 'success' | 'error'
  const [message, setMessage] = useState('');

  // Reenvío de token
  const [emailInput, setEmailInput] = useState(emailFromUrl);
  const [showResendForm, setShowResendForm] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendMessage, setResendMessage] = useState('');
  const [resendError, setResendError] = useState('');

  // Verificar automáticamente si el token viene en la URL
  useEffect(() => {
    if (tokenFromUrl) {
      handleAutoVerify(tokenFromUrl);
    }
  }, [tokenFromUrl]);

  const handleAutoVerify = async (token) => {
    setLoading(true);
    setStatus('verifying');
    try {
      const response = await api.post('/verify-email', { token });
      setStatus('success');
      setMessage(response.data.message || '¡Tu cuenta ha sido activada con éxito!');
      
      // Guardar sesión e iniciar sesión automáticamente
      if (response.data.user && response.data.token) {
        useAuthStore.setState({
          user: response.data.user,
          token: response.data.token,
          isAuthenticated: true
        });
      }

      setTimeout(() => {
        if (response.data.user) {
          const role = response.data.user.role || 'jugador';
          if (role === 'administrador' || role === 'admin') {
            navigate('/admin');
          } else if (role === 'organizador') {
            navigate('/organizador');
          } else {
            navigate('/jugador');
          }
        } else {
          navigate('/login');
        }
      }, 2500);
    } catch (error) {
      setStatus('error');
      setMessage(error.response?.data?.message || 'El enlace de activación es inválido o ha expirado.');
    } finally {
      setLoading(false);
    }
  };

  const handleManualVerify = async (e) => {
    e.preventDefault();
    if (!tokenInput.trim()) return;

    setLoading(true);
    setStatus('verifying');
    setMessage('');
    try {
      const response = await api.post('/verify-email', { token: tokenInput.trim() });
      setStatus('success');
      setMessage(response.data.message || '¡Tu cuenta ha sido activada con éxito!');
      
      // Guardar sesión e iniciar sesión automáticamente
      if (response.data.user && response.data.token) {
        useAuthStore.setState({
          user: response.data.user,
          token: response.data.token,
          isAuthenticated: true
        });
      }

      setTimeout(() => {
        if (response.data.user) {
          const role = response.data.user.role || 'jugador';
          if (role === 'administrador' || role === 'admin') {
            navigate('/admin');
          } else if (role === 'organizador') {
            navigate('/organizador');
          } else {
            navigate('/jugador');
          }
        } else {
          navigate('/login');
        }
      }, 2500);
    } catch (error) {
      setStatus('error');
      setMessage(error.response?.data?.message || 'Código de activación incorrecto o expirado.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendRequest = async (e) => {
    e.preventDefault();
    if (!emailInput.trim()) return;

    setResendLoading(true);
    setResendMessage('');
    setResendError('');
    try {
      const response = await api.post('/resend-verification', { email: emailInput.trim() });
      setResendMessage(response.data.message || 'Código de activación reenviado correctamente.');
      setEmailInput('');
      // Ocultar formulario después de enviar
      setTimeout(() => {
        setShowResendForm(false);
        setResendMessage('');
      }, 4000);
    } catch (error) {
      setResendError(error.response?.data?.message || 'Error al solicitar el reenvío.');
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-background text-foreground font-sans overflow-hidden transition-colors duration-300">
      
      {/* Panel Izquierdo: Estadio (Idéntico a Registro para cohesión visual) */}
      <div 
        className="hidden lg:flex lg:w-1/2 relative bg-cover bg-center bg-[#07070a]" 
        style={{ backgroundImage: `url(${bgRegister})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-[#07070a] via-[#07070a]/80 to-[#07070a]/20"></div>
        <div className="absolute inset-0 bg-primary/10 mix-blend-overlay"></div>
        
        <div className="relative z-10 flex flex-col justify-end p-12 h-full max-w-2xl text-white">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-6 shadow-[0_0_20px_hsla(var(--primary),0.5)]">
            <img src={logoImg} alt="Torneos Pro FC" className="w-10 h-10 object-contain" />
          </div>
          <h1 className="text-5xl font-display font-extrabold uppercase tracking-tight mb-4 leading-none text-white">
            Verificación <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-destructive">
              De Seguridad
            </span>
          </h1>
          <p className="text-base text-gray-300 font-medium max-w-lg leading-relaxed">
            Activa tu cuenta de competidor para acceder a la arena. En Torneos Pro FC, la seguridad y veracidad de cada ficha de jugador es nuestra prioridad.
          </p>
        </div>
      </div>

      {/* Panel Derecho: Interfaz de verificación */}
      <div className="w-full lg:w-1/2 flex items-start lg:items-center justify-center pt-24 pb-12 lg:py-8 px-4 sm:px-8 lg:px-12 relative overflow-y-auto h-screen custom-scrollbar">
        {/* Glow ambient de fondo */}
        <div className="absolute top-1/4 right-1/4 w-[300px] sm:w-[450px] h-[300px] sm:h-[450px] bg-primary/10 rounded-full blur-[100px] sm:blur-[130px] pointer-events-none z-0"></div>
        <div className="absolute bottom-1/4 left-1/4 w-[250px] sm:w-[350px] h-[250px] sm:h-[350px] bg-destructive/5 rounded-full blur-[80px] sm:blur-[110px] pointer-events-none z-0"></div>

        <div className="w-full max-w-md relative z-10 my-auto">
          
          {/* Card HUD Contenedora */}
          <div className="relative bg-card/60 dark:bg-card/25 backdrop-blur-md border border-border/60 dark:border-border/30 rounded-2xl p-6 sm:p-8 shadow-xl dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.5)] border-t-primary/20 border-l-primary/20 transition-all duration-300">
            {/* Brackets tácticos cibernéticos */}
            <div className="absolute top-0 left-0 w-3.5 h-3.5 border-t-2 border-l-2 border-primary/40 dark:border-primary/50 rounded-tl-md pointer-events-none"></div>
            <div className="absolute top-0 right-0 w-3.5 h-3.5 border-t-2 border-r-2 border-primary/40 dark:border-primary/50 rounded-tr-md pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 w-3.5 h-3.5 border-b-2 border-l-2 border-primary/40 dark:border-primary/50 rounded-bl-md pointer-events-none"></div>
            <div className="absolute bottom-0 right-0 w-3.5 h-3.5 border-b-2 border-r-2 border-primary/40 dark:border-primary/50 rounded-br-md pointer-events-none"></div>

            <div className="mb-6 relative">
              <h2 className="text-2xl sm:text-3xl font-display font-black tracking-tight text-foreground uppercase">
                Activar <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-destructive">Cuenta</span>
              </h2>
              <p className="text-xs font-mono text-muted-foreground mt-1 uppercase tracking-widest flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
                Autenticación de Correo
              </p>
              <div className="h-[1px] w-full bg-gradient-to-r from-border/80 via-border/20 to-transparent mt-4"></div>
            </div>

            {/* Spinner en proceso de verificación automática */}
            {status === 'verifying' && (
              <div className="flex flex-col items-center justify-center py-10 space-y-4">
                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                <p className="text-xs font-mono text-muted-foreground animate-pulse">VERIFICANDO CÓDIGO CON EL SERVIDOR...</p>
              </div>
            )}

            {/* Pantalla de Éxito */}
            {status === 'success' && (
              <div className="animate-fade-in space-y-4 text-center py-6">
                <div className="mx-auto w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-2">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-display font-black uppercase text-emerald-400">¡Cuenta Activada!</h3>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto leading-relaxed">
                  {message}
                  <br />
                  Redireccionando al centro de mando para iniciar sesión...
                </p>
              </div>
            )}

            {/* Pantalla General / Error / Ingreso Manual */}
            {status !== 'verifying' && status !== 'success' && (
              <div className="space-y-5 animate-fade-in">
                {status === 'error' && (
                  <Alert variant="destructive" className="py-3 text-xs" onClose={() => setStatus('idle')}>
                    {message}
                  </Alert>
                )}

                {/* Formulario de Ingreso Manual de Token */}
                {!tokenFromUrl && !showResendForm && (
                  <form onSubmit={handleManualVerify} className="space-y-4">
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Si recibiste tu correo de activación, pega el código de seguridad o introduce el token a continuación para activar tu cuenta.
                    </p>

                    <Input 
                      label="Código de Activación" 
                      name="token" 
                      value={tokenInput} 
                      onChange={(e) => setTokenInput(e.target.value)} 
                      required 
                      disabled={loading}
                      placeholder="Pega el código de tu correo..."
                      icon={<KeyIcon />}
                      className="text-center font-mono tracking-widest text-base uppercase"
                    />

                    <Button 
                      type="submit" 
                      className="w-full py-3.5 font-bold tracking-widest uppercase hover:shadow-[0_0_20px_hsla(var(--primary),0.6)] transition-all bg-gradient-to-r from-primary to-destructive text-primary-foreground border-none rounded-md" 
                      isLoading={loading}
                    >
                      Activar Cuenta
                    </Button>
                  </form>
                )}

                {/* Formulario de Reenvío */}
                {showResendForm && (
                  <form onSubmit={handleResendRequest} className="space-y-4 animate-fade-in">
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Introduce el correo con el que te registraste para reenviar el enlace y código de activación.
                    </p>

                    {resendError && (
                      <Alert variant="destructive" className="py-2 text-xs" onClose={() => setResendError('')}>
                        {resendError}
                      </Alert>
                    )}

                    {resendMessage && (
                      <Alert variant="success" className="py-2 text-xs">
                        {resendMessage}
                      </Alert>
                    )}

                    <Input 
                      label="Correo Electrónico" 
                      type="email"
                      name="email" 
                      value={emailInput} 
                      onChange={(e) => setEmailInput(e.target.value)} 
                      required 
                      disabled={resendLoading}
                      placeholder="correo@ejemplo.com"
                      icon={<MailIcon />}
                    />

                    <Button 
                      type="submit" 
                      className="w-full py-3.5 font-bold tracking-widest uppercase hover:shadow-[0_0_20px_hsla(var(--primary),0.6)] transition-all bg-gradient-to-r from-primary to-destructive text-primary-foreground border-none rounded-md" 
                      isLoading={resendLoading}
                    >
                      Solicitar Reenvío
                    </Button>

                    <button 
                      type="button"
                      onClick={() => setShowResendForm(false)}
                      className="text-[10px] font-bold text-muted-foreground hover:text-foreground transition-colors uppercase tracking-wider block mx-auto pt-2"
                    >
                      ← Cancelar y volver
                    </button>
                  </form>
                )}

                {/* Enlaces de pie de página */}
                {!showResendForm && (
                  <div className="flex flex-col gap-3 pt-2 text-center border-t border-border/20">
                    <button 
                      onClick={() => {
                        setShowResendForm(true);
                        setResendMessage('');
                        setResendError('');
                      }}
                      className="text-[10px] font-bold text-muted-foreground hover:text-primary transition-colors uppercase tracking-wider"
                    >
                      ¿No recibiste el correo? Solicitar reenvío
                    </button>

                    <Link to="/login" className="text-[10px] font-black text-primary hover:text-destructive transition-colors uppercase tracking-widest pt-2">
                      ← Volver a Iniciar Sesión
                    </Link>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
