import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/useAuthStore';
import api from '@/api/axios';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Alert from '@/components/shared/Alert';
import Select from '@/components/ui/Select';
// Import bgRegister was removed
import logoImg from '@/assets/images/logo.png';

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
    role: 'jugador', 
    password: '', 
    password_confirmation: '',
    gamertag: '',
    id_ea: '',
    plataforma: 'ps5'
  });

  // Estados para la verificación de correo posterior al registro
  const [registeredEmail, setRegisteredEmail] = useState('');
  const [resendMessage, setResendMessage] = useState('');
  const [resendLoading, setResendLoading] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [verifyingCode, setVerifyingCode] = useState(false);
  const [verificationError, setVerificationError] = useState('');
  const [verificationSuccess, setVerificationSuccess] = useState('');

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
      role: 'jugador', 
      password: userData.password,
      password_confirmation: userData.password_confirmation,
      plataforma: userData.plataforma
    };

    if (userData.gamertag) payload.gamertag = userData.gamertag;

    const result = await register(payload); 
    if (result.success) {
      const emailParam = encodeURIComponent(result.email || userData.email);
      navigate(`/verificar-correo?email=${emailParam}`);
    } 
  };

  const handleResend = async () => {
    setResendLoading(true);
    setResendMessage('');
    try {
      const response = await api.post('/resend-verification', { email: registeredEmail });
      setResendMessage(response.data.message || 'Código de activación reenviado.');
    } catch (err) {
      setResendMessage(err.response?.data?.message || 'Error al reenviar el correo de activación.');
    } finally {
      setResendLoading(false);
    }
  };

  const handleVerifyCode = async (e) => {
    e.preventDefault();
    setVerifyingCode(true);
    setVerificationError('');
    setVerificationSuccess('');
    try {
      const response = await api.post('/verify-email', { token: verificationCode.trim() });
      setVerificationSuccess(response.data.message || '¡Cuenta verificada y activa!');
      setTimeout(() => {
        navigate('/login');
      }, 2500);
    } catch (err) {
      setVerificationError(err.response?.data?.message || 'El código es inválido o ha expirado.');
    } finally {
      setVerifyingCode(false);
    }
  };

  return (
    <div className="relative flex min-h-screen bg-background text-foreground font-sans overflow-x-hidden transition-colors duration-300 items-center justify-center">
      
      {/* Background Video Cinematográfico Full Screen */}
      <div className="fixed inset-0 z-0 bg-[#07070a] overflow-hidden pointer-events-none">
        <iframe 
          className="w-[100vw] h-[56.25vw] min-h-[100vh] min-w-[177.77vh] absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 opacity-30 mix-blend-screen grayscale-[30%] pointer-events-none"
          src="https://www.youtube.com/embed/XhP3Xh4LMA8?autoplay=1&mute=1&controls=0&loop=1&playlist=XhP3Xh4LMA8" 
          title="EA FC Trailer" 
          frameBorder="0" 
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
          allowFullScreen>
        </iframe>
        {/* Overlays para garantizar legibilidad */}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-background/30 z-0"></div>
        <div className="absolute inset-0 bg-primary/5 mix-blend-overlay z-0"></div>
        
        {/* Glow ambient de fondo para acentuar el diseño de Esports */}
        <div className="absolute top-1/4 right-1/4 w-[300px] sm:w-[450px] h-[300px] sm:h-[450px] bg-primary/20 rounded-full blur-[120px] pointer-events-none z-0"></div>
        <div className="absolute bottom-1/4 left-1/4 w-[250px] sm:w-[350px] h-[250px] sm:h-[350px] bg-destructive/10 rounded-full blur-[100px] pointer-events-none z-0"></div>
      </div>

      {/* Main Container */}
      <div className="relative z-10 w-full max-w-[1200px] mx-auto flex flex-col lg:flex-row items-center justify-center sm:justify-between px-4 sm:px-8 py-12 lg:py-0 min-h-screen gap-8 lg:gap-16">
        
        {/* Texto de Bienvenida (Oculto en móviles pequeños para dar prioridad al login) */}
        <div className="hidden md:flex flex-col justify-center lg:w-1/2 text-center lg:text-left animate-fade-in-up mt-10 lg:mt-0">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-primary/20 to-destructive/20 border border-primary/30 flex items-center justify-center text-primary-foreground font-display font-black text-3xl mb-6 shadow-[0_0_30px_hsla(var(--primary),0.5)] p-1.5 backdrop-blur-sm mx-auto lg:mx-0">
            <img src={logoImg} alt="Torneos Pro FC" className="w-full h-full object-contain" />
          </div>
          <h1 className="text-4xl lg:text-6xl font-display font-extrabold uppercase tracking-tight mb-4 leading-none text-foreground drop-shadow-2xl">
            Comienza tu <br className="hidden lg:block"/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-destructive drop-shadow-[0_0_15px_rgba(var(--primary-rgb),0.5)]">
              Legado en FC26
            </span>
          </h1>
          <p className="text-base lg:text-lg text-muted-foreground font-medium max-w-lg leading-relaxed drop-shadow-md mx-auto lg:mx-0 backdrop-blur-sm bg-card/20 p-4 rounded-xl border border-border/30">
            Únete a la plataforma definitiva para jugadores. Domina la liga, gestiona plantillas y reporta resultados como los profesionales.
          </p>
        </div>

        {/* Panel Formulario Dinámico */}
        <div className="w-full lg:w-1/2 flex items-center justify-center max-w-lg mx-auto relative mt-10 lg:mt-0 z-20">
          
          <div className="w-full relative bg-card/80 backdrop-blur-xl border border-border/60 rounded-2xl p-6 sm:p-8 shadow-[0_15px_50px_0_rgba(0,0,0,0.5)] border-t-primary/40 border-l-primary/40 transition-all duration-300">
            <div className="absolute top-0 left-0 w-3.5 h-3.5 border-t-2 border-l-2 border-primary/50 rounded-tl-md pointer-events-none"></div>
            <div className="absolute top-0 right-0 w-3.5 h-3.5 border-t-2 border-r-2 border-primary/50 rounded-tr-md pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 w-3.5 h-3.5 border-b-2 border-l-2 border-primary/50 rounded-bl-md pointer-events-none"></div>
            <div className="absolute bottom-0 right-0 w-3.5 h-3.5 border-b-2 border-r-2 border-primary/50 rounded-br-md pointer-events-none"></div>

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

            {registeredEmail ? (
              <div className="animate-fade-in space-y-5">
                <div className="text-center space-y-2 pb-2">
                  <div className="mx-auto w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-2">
                    <svg className="w-6 h-6 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 19v-8.93a2 2 0 01.89-1.664l8-5.333a2 2 0 012.22 0l8 5.333A2 2 0 0121 10.07V19M3 19a2 2 0 002 2h14a2 2 0 002-2M3 19l6.75-4.5M21 19l-6.75-4.5M3 10l6.75 4.5M21 10l-6.75 4.5m0 0l-2.25-1.5a2 2 0 00-2.22 0l-2.25 1.5" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-display font-black text-foreground uppercase tracking-wide">¡Registro Completado!</h3>
                  <p className="text-xs text-muted-foreground leading-normal max-w-sm mx-auto">
                    Hemos enviado un enlace de activación y un código de seguridad a:
                    <br />
                    <span className="text-primary font-bold font-mono text-[13px]">{registeredEmail}</span>
                  </p>
                  <p className="text-[10px] text-destructive font-bold uppercase tracking-wider font-mono">
                    ⚠ Plazo límite de activación: 24 horas
                  </p>
                </div>

                {verificationError && (
                  <Alert variant="destructive" className="py-2.5 text-xs" onClose={() => setVerificationError('')}>
                    {verificationError}
                  </Alert>
                )}

                {verificationSuccess && (
                  <Alert variant="success" className="py-2.5 text-xs">
                    {verificationSuccess}
                  </Alert>
                )}

                {resendMessage && (
                  <Alert variant="info" className="py-2.5 text-xs" onClose={() => setResendMessage('')}>
                    {resendMessage}
                  </Alert>
                )}

                <form onSubmit={handleVerifyCode} className="space-y-4 pt-2">
                  <Input 
                    label="Código de Activación" 
                    name="verificationCode" 
                    value={verificationCode} 
                    onChange={(e) => setVerificationCode(e.target.value)} 
                    required 
                    disabled={verifyingCode} 
                    placeholder="Pega el código de tu correo o verifica desde el enlace..."
                    className="text-center font-mono tracking-widest text-base uppercase"
                  />

                  <Button 
                    type="submit" 
                    className="w-full py-3 font-bold tracking-widest uppercase bg-gradient-to-r from-primary to-destructive text-primary-foreground border-none rounded-md" 
                    isLoading={verifyingCode}
                  >
                    Activar Cuenta
                  </Button>
                </form>

                <div className="flex flex-col gap-2.5 pt-2 text-center border-t border-border/20 mt-4">
                  <button 
                    onClick={handleResend}
                    disabled={resendLoading || verifyingCode}
                    className="text-[10px] font-bold text-muted-foreground hover:text-primary transition-colors uppercase tracking-wider disabled:opacity-50"
                  >
                    {resendLoading ? 'Reenviando...' : '¿No recibiste el correo? Reenviar correo de activación'}
                  </button>

                  <Link to="/login" className="text-[10px] font-black text-primary hover:text-destructive transition-colors uppercase tracking-widest pt-2">
                    ← Volver al Iniciar Sesión
                  </Link>
                </div>
              </div>
            ) : (
              <>
                {authError && (
                  <Alert variant="destructive" className="mb-5 py-3 text-xs">
                    {authError}
                  </Alert>
                )}

                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
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
                        placeholder="Ej: TorneosProFC_Nickname"
                        className="!gap-0"
                        icon={<GamepadIcon />}
                      />
                    </div>

                    <p className="text-[9px] text-primary/80 leading-normal italic pl-1 font-mono">
                      * El GamerTAG debe ser idéntico al de EA para sincronizar tus estadísticas de juego correctamente.
                    </p>
                  </div>

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
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}