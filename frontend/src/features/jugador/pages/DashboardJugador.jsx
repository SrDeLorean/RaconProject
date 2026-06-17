import React, { useEffect, useState, lazy, Suspense } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { useNavigate } from 'react-router-dom';
import Card from '@/components/shared/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import api from '@/api/axios';
import Alert from '@/components/shared/Alert';
import PageHelp from '@/components/shared/PageHelp';

const ResumenJugadorTab = lazy(() => import('./components/tabs/ResumenJugadorTab'));
const CalendarioJugadorTab = lazy(() => import('./components/tabs/CalendarioJugadorTab'));
const CalendarioJugadorUtTab = lazy(() => import('./components/tabs/CalendarioJugadorUtTab'));
const OfertasJugadorTab = lazy(() => import('./components/tabs/OfertasJugadorTab'));
const RendimientoJugadorTab = lazy(() => import('./components/tabs/RendimientoJugadorTab'));

const getTabIcon = (id, className = "w-4 h-4") => {
  switch (id) {
    case 'resumen':
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
      );
    case 'ofertas':
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 19v-8.93a2 2 0 01.89-1.664l8-5.333a2 2 0 012.22 0l8 5.333A2 2 0 0121 10.07V19M3 19a2 2 0 002 2h14a2 2 0 002-2M3 19l6.75-4.5M21 19l-6.75-4.5m0 0l-2.25-1.5a2 2 0 00-2.22 0l-2.25 1.5m4.5 0V11m0 4v3" />
        </svg>
      );
    case 'rendimiento':
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      );
    case 'calendario':
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      );
    case 'calendario_ut':
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
        </svg>
      );
    default:
      return null;
  }
};

export default function DashboardJugador() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [solicitudes, setSolicitudes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [profileData, setProfileData] = useState(null);
  const [notification, setNotification] = useState(null);
  const [isProcessing, setIsProcessing] = useState(null);
  const [activeTab, setActiveTab] = useState('resumen');

  const fetchSolicitudesYPerfil = async () => {
    setLoading(true);
    try {
      // 1. Obtener solicitudes de fichaje recibidas
      const responseOffers = await api.get('/solicitudes-fichaje?tipo=recibidas');
      setSolicitudes(responseOffers.data?.data || responseOffers.data || []);

      // 2. Obtener estadísticas detalladas del jugador
      if (user?.id) {
        const responseProfile = await api.get(`/usuarios/${user.id}`);
        setProfileData(responseProfile.data || null);
      }
    } catch (error) {
      console.error("Error al obtener datos del jugador:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSolicitudesYPerfil();
  }, [user]);

  const handleResponder = async (id, respuesta) => {
    setIsProcessing(id);
    try {
      const response = await api.post(`/solicitudes-fichaje/${id}/responder`, { respuesta });
      setNotification({ variant: 'success', text: response.data.message || 'Respuesta registrada con éxito.' });
      await fetchSolicitudesYPerfil();
    } catch (error) {
      setNotification({ variant: 'error', text: error.response?.data?.message || 'Error al procesar la solicitud.' });
    } finally {
      setIsProcessing(null);
    }
  };

  // Cálculo de alertas y estados para las pestañas
  const missingFieldsCount = (!profileData?.plataforma ? 1 : 0) + (!profileData?.nacionalidad ? 1 : 0);
  const contractWarning = !profileData?.contrato_activo ? 1 : 0;
  const totalWarnings = missingFieldsCount + contractWarning + solicitudes.length;

  const tabsConfig = [
    { id: 'resumen', label: 'Resumen', count: totalWarnings, type: 'error' },
    { id: 'ofertas', label: 'Mis Ofertas', count: solicitudes.length, type: 'warning' },
    { id: 'rendimiento', label: 'Mi Rendimiento', count: 0, type: 'info' },
    { id: 'calendario', label: 'Mi Calendario', count: 0, type: 'info' },
    { id: 'calendario_ut', label: 'Mi Calendario UT', count: 0, type: 'info' },
  ];

  return (
    <div className="animate-fade-in relative min-h-[500px] space-y-8">
      
      {notification && (
        <Alert 
          variant={notification.variant} 
          className="fixed top-24 right-8 z-[110] shadow-lg max-w-sm" 
          onClose={() => setNotification(null)}
        >
          {notification.text}
        </Alert>
      )}

      {/* HEADER PRINCIPAL */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-display font-black uppercase tracking-wider mb-1 text-foreground">
            Oficina de <span className="text-glow-primary bg-clip-text bg-gradient-to-r from-primary to-destructive text-transparent">Jugador</span>
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Hola, <span className="font-bold text-foreground uppercase">{user?.gamertag || user?.name}</span>. Gestiona tus ofertas contractuales y administra tu carrera competitiva.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary"></div>
          <span className="text-xs uppercase font-bold text-muted-foreground animate-pulse">Sincronizando buzón...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 lg:gap-8 items-start">
          
          {/* Sidebar Menú Lateral */}
          <div className="lg:col-span-1 border border-border/40 bg-card/30 backdrop-blur-md rounded-3xl p-5 shadow-xl sticky top-24 space-y-6 flex flex-col">
            <div className="hidden lg:block border-b border-border/30 pb-4">
              <h2 className="text-sm font-display font-black text-foreground uppercase tracking-wider flex items-center gap-2">
                <svg className="w-4 h-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                Navegación
              </h2>
            </div>

            {/* Menú de Navegación */}
            <div className="flex flex-row lg:flex-col gap-2 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0 scrollbar-hide">
              {tabsConfig.map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex-shrink-0 w-auto lg:w-full px-4 lg:px-4 py-3 text-xs font-bold uppercase rounded-xl transition-all flex items-center justify-between gap-3 border ${
                      isActive
                        ? 'bg-primary/10 text-primary border-primary shadow-sm shadow-primary/20'
                        : 'bg-transparent text-muted-foreground border-transparent hover:bg-card/60 hover:text-foreground'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-1.5 rounded-lg ${isActive ? 'bg-primary text-primary-foreground' : 'bg-card/80 border border-border/40'}`}>
                        {getTabIcon(tab.id, "w-4 h-4")}
                      </div>
                      <span className="whitespace-nowrap">{tab.label}</span>
                    </div>
                    {tab.count > 0 && (
                      <span className={`text-[10px] w-5 h-5 flex items-center justify-center rounded-full font-black ml-2 ${
                        isActive 
                          ? 'bg-primary text-primary-foreground shadow-md shadow-primary/40' 
                          : tab.type === 'error'
                          ? 'bg-destructive text-destructive-foreground animate-pulse shadow-md shadow-destructive/40'
                          : tab.type === 'warning'
                          ? 'bg-amber-500 text-black animate-pulse shadow-md shadow-amber-500/40'
                          : 'bg-cyan-500 text-cyan-950 shadow-md shadow-cyan-500/40'
                      }`}>
                        {tab.count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Área de Contenido Principal */}
          <div className="lg:col-span-3 min-h-[500px]">
            <Suspense fallback={
              <div className="py-20 flex flex-col items-center justify-center gap-3 border border-border/20 rounded-3xl bg-card/10">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
                <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider animate-pulse">Cargando módulo...</span>
              </div>
            }>
              <div className="animate-fade-in">
                {activeTab === 'resumen' && (
                  <ResumenJugadorTab 
                    profileData={profileData} 
                    solicitudes={solicitudes} 
                    navigate={navigate} 
                    onTabChange={setActiveTab}
                  />
                )}
                {activeTab === 'ofertas' && (
                  <OfertasJugadorTab 
                    solicitudes={solicitudes} 
                    isProcessing={isProcessing} 
                    handleResponder={handleResponder} 
                  />
                )}
                {activeTab === 'rendimiento' && (
                  <RendimientoJugadorTab profileData={profileData} />
                )}
                {activeTab === 'calendario' && (
                  <CalendarioJugadorTab />
                )}
                {activeTab === 'calendario_ut' && (
                  <CalendarioJugadorUtTab />
                )}
              </div>
            </Suspense>
          </div>

        </div>
      )}

      <PageHelp 
        title="Oficina del Jugador"
        description="Tu panel central de control como jugador. Desde aquí gestionas tu perfil, ofertas de fichaje recibidas, revisas tus estadísticas competitivas y visualizas tu calendario de encuentros."
        steps={[
          {
            title: "Pestaña Resumen",
            description: "Muestra avisos críticos, como campos incompletos en tu perfil (plataforma o nacionalidad) o alertas de contrato pendientes."
          },
          {
            title: "Pestaña Mis Ofertas",
            description: "Revisa propuestas de contratos enviadas por clubes competitivos. Puedes aceptar o rechazar ofertas en tiempo real."
          },
          {
            title: "Pestaña Mi Rendimiento",
            description: "Desglosa tus estadísticas históricas de juego, tales como goles, asistencias, promedio de valoración y telemetría de partidos."
          },
          {
            title: "Pestañas de Calendario",
            description: "Consulta fechas, rivales y horarios de tus próximos encuentros, tanto en formato de Clubes Pro 11v11 como en Ultimate Team."
          }
        ]}
      />
    </div>
  );
}