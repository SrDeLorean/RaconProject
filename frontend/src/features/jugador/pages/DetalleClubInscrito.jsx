import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '@/api/axios';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Alert from '@/components/shared/Alert';
import Partidos from '@/features/public/pages/Partidos';
import PageHelp from '@/components/shared/PageHelp';

export default function DetalleClubInscrito() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [club, setClub] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeSubTab, setActiveSubTab] = useState('resumen');
  const [notification, setNotification] = useState(null);

  const fetchClubDetalle = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/equipos/${id}`);
      setClub(response.data);
    } catch (error) {
      console.error("Error al cargar el detalle del club:", error);
      setNotification({ variant: 'error', text: 'No se pudo cargar la información del club.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchClubDetalle();
    }
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-[500px] flex flex-col items-center justify-center gap-3">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary"></div>
        <span className="text-sm font-bold tracking-widest text-primary uppercase animate-pulse">
          Desencriptando datos del club...
        </span>
      </div>
    );
  }

  if (!club) {
    return (
      <div className="border border-border/60 bg-muted/20 rounded-2xl p-16 flex flex-col items-center text-center max-w-2xl mx-auto mt-8 gap-6 shadow-sm">
        <div className="w-16 h-16 rounded-2xl bg-destructive/10 border border-destructive/20 flex items-center justify-center text-3xl">⚠️</div>
        <div className="space-y-2">
          <h2 className="text-xl font-display font-black tracking-wide text-foreground uppercase">Club No Encontrado</h2>
          <p className="text-sm text-muted-foreground max-w-md">
            No se ha podido localizar el club especificado o no tienes permisos de acceso.
          </p>
        </div>
        <Button onClick={() => navigate('/jugador/mis-equipos')} className="h-10 px-6 font-bold uppercase tracking-wider text-xs">
          Volver a Mis Equipos
        </Button>
      </div>
    );
  }

  return (
    <div className="animate-fade-in relative min-h-[500px] space-y-6">
      {notification && (
        <Alert 
          variant={notification.variant} 
          className="fixed top-24 right-8 z-[110] shadow-lg max-w-sm" 
          onClose={() => setNotification(null)}
        >
          {notification.text}
        </Alert>
      )}

      {/* HEADER: BOTÓN ATRÁS & TÍTULO */}
      <div className="flex items-center justify-between border-b border-border/50 pb-6">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/jugador/mis-equipos')}
            className="p-2.5 rounded-xl border border-border/60 hover:bg-muted/50 transition-all duration-200 active:scale-95 text-muted-foreground hover:text-foreground"
            title="Volver al listado"
          >
            ⬅️ Volver
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] bg-primary/10 text-primary border border-primary/20 font-bold px-2 py-0.5 rounded uppercase tracking-wider">
                Detalles del Club
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-display font-black text-foreground tracking-wide uppercase mt-1">
              {club.nombre} <span className="text-primary">[{club.abreviatura}]</span>
            </h1>
          </div>
        </div>

        {/* ECOSYSTEM / PLATAFORMA BADGE */}
        <Badge variant="outline" className="hidden sm:inline-flex uppercase px-3 py-1 border-primary/30 text-primary font-mono text-xs">
          🎮 Plataforma: {club.plataforma}
        </Badge>
      </div>

      {/* DETALLES DE ENTRADA & TABS */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* PANEL LATERAL DE PERFIL */}
        <div className="lg:col-span-1 space-y-6">
          <div className="border border-border/50 bg-card/20 backdrop-blur-md rounded-2xl p-6 flex flex-col items-center text-center gap-4 relative overflow-hidden shadow-md">
            <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full blur-2xl pointer-events-none"></div>
            
            <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-primary/20 to-destructive/20 border border-primary/20 flex items-center justify-center font-display font-black text-primary text-3xl shadow-inner">
              {club.abreviatura}
            </div>

            <div>
              <h2 className="font-display font-black text-lg text-foreground uppercase tracking-wide">
                {club.nombre}
              </h2>
              <span className="text-xs text-muted-foreground font-semibold uppercase">{club.plataforma}</span>
            </div>

            <div className="w-full h-px bg-border/40"></div>

            {/* Redes Sociales */}
            <div className="w-full space-y-2 text-xs">
              <span className="text-[9px] text-muted-foreground font-black uppercase tracking-wider block text-left">Redes Sociales</span>
              {club.redes_sociales?.twitter ? (
                <a href={`https://twitter.com/${club.redes_sociales.twitter}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-foreground font-bold hover:text-primary transition-colors">
                  🐦 Twitter: <span className="text-primary font-semibold font-mono">@{club.redes_sociales.twitter}</span>
                </a>
              ) : (
                <div className="text-muted-foreground italic text-left">Sin Twitter registrado</div>
              )}
              {club.redes_sociales?.twitch ? (
                <a href={`https://twitch.tv/${club.redes_sociales.twitch}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-foreground font-bold hover:text-primary transition-colors">
                  📺 Twitch: <span className="text-primary font-semibold font-mono">{club.redes_sociales.twitch}</span>
                </a>
              ) : (
                <div className="text-muted-foreground italic text-left">Sin Twitch registrado</div>
              )}
            </div>

            {/* Capitán */}
            {club.capitan && (
              <div className="w-full bg-muted/10 border border-border/30 rounded-xl p-3 space-y-1.5 mt-2 text-left">
                <span className="text-[9px] text-muted-foreground font-black uppercase tracking-wider block">Capitán / Owner</span>
                <div>
                  <p className="text-xs font-bold text-foreground flex items-center gap-1">
                    👑 {club.capitan.name}
                  </p>
                  <p className="text-[10px] text-primary font-mono font-bold mt-0.5">🎮 {club.capitan.gamertag}</p>
                  <p className="text-[10px] text-muted-foreground font-semibold font-mono truncate mt-0.5">{club.capitan.email}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* CONTENIDO PRINCIPAL: TABS & VISTAS */}
        <div className="lg:col-span-3 space-y-6">
          {/* SELECCIÓN DE PESTAÑAS (MÓDULOS DE CLUB) */}
          <div className="flex gap-1 bg-muted/40 p-1 rounded-lg border border-border/40 w-full overflow-x-auto">
            {[
              { id: 'resumen', label: 'Info General', icon: '📊' },
              { id: 'plantilla', label: 'Plantilla del Club', icon: '👥' },
              { id: 'calendario', label: 'Competiciones y Calendario', icon: '📅' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveSubTab(tab.id)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-md text-xs font-bold whitespace-nowrap transition-all duration-200 ${
                  activeSubTab === tab.id 
                    ? 'bg-background text-primary shadow-sm border border-border/40' 
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
                }`}
              >
                <span>{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>

          <div className="animate-fade-in">
            {/* PESTAÑA: INFO GENERAL */}
            {activeSubTab === 'resumen' && (
              <div className="border border-border/50 bg-card/20 backdrop-blur-md rounded-2xl p-6 space-y-6 shadow-md">
                <div className="space-y-2">
                  <h3 className="text-lg font-display font-black text-foreground uppercase tracking-wide">
                    Sobre el Club
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {club.descripcion || 'Este club aún no cuenta con una descripción detallada en sus registros tácticos de escuadra.'}
                  </p>
                </div>

                <div className="h-px bg-border/40"></div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="border border-border/30 rounded-xl p-4 bg-muted/10 space-y-1">
                    <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Identidad de Competidor</span>
                    <p className="text-sm font-bold text-foreground">Plataforma Oficial: <span className="text-primary uppercase font-mono">{club.plataforma}</span></p>
                  </div>
                  <div className="border border-border/30 rounded-xl p-4 bg-muted/10 space-y-1">
                    <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Miembros Activos</span>
                    <p className="text-sm font-bold text-foreground">Plantilla Oficial: <span className="text-primary font-mono">{club.roster?.length || 0} competidores</span></p>
                  </div>
                </div>
              </div>
            )}

            {/* PESTAÑA: PLANTILLA / ROSTER */}
            {activeSubTab === 'plantilla' && (
              <div className="space-y-4">
                <div className="border-b border-border/40 pb-2">
                  <h3 className="text-base font-bold uppercase text-foreground tracking-wide flex items-center gap-2">
                    👥 Miembros de la Escuadra ({club.roster?.length || 0})
                  </h3>
                </div>

                {club.roster && club.roster.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {club.roster.map((miembro) => (
                      <div 
                        key={miembro.id}
                        className="border border-border/50 bg-card/30 backdrop-blur-sm rounded-xl p-4 flex items-center justify-between gap-4 hover:border-primary/40 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-muted/30 border border-border/40 flex items-center justify-center font-black text-primary text-sm shadow-inner font-mono">
                            #{miembro.dorsal ?? 'N/A'}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-foreground">
                              {miembro.name}
                            </p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-[10px] font-bold font-mono text-primary uppercase">🎮 {miembro.gamertag}</span>
                              <span className="text-[10px] text-muted-foreground">•</span>
                              <span className="text-[10px] text-muted-foreground font-semibold">{miembro.posicion}</span>
                            </div>
                          </div>
                        </div>

                        {miembro.organizacion && (
                          <span className="text-[8px] bg-muted/40 text-foreground border border-border/60 font-bold px-2 py-0.5 rounded uppercase tracking-wider">
                            {miembro.organizacion.nombre}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground italic py-8 text-center">La escuadra no cuenta con jugadores enrolados activos.</p>
                )}
              </div>
            )}

            {/* PESTAÑA: CALENDARIO & COMPETENCIAS */}
            {activeSubTab === 'calendario' && (
              <div className="space-y-6">
                <div className="space-y-4">
                  <div className="border-b border-border/40 pb-2">
                    <h3 className="text-base font-bold uppercase text-foreground tracking-wide flex items-center gap-2">
                      🏆 Torneos Oficiales Inscritos
                    </h3>
                  </div>

                  {club.competencias && club.competencias.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {club.competencias.map((comp) => (
                        <div 
                          key={comp.id}
                          className="border border-border/50 bg-card/30 backdrop-blur-sm rounded-xl p-4 flex flex-col justify-between gap-3 hover:border-primary/40 transition-colors"
                        >
                          <div>
                            <div className="flex items-center justify-between">
                              <span className="text-[9px] bg-primary/10 text-primary border border-primary/20 font-bold px-2 py-0.5 rounded uppercase">
                                {comp.formato}
                              </span>
                              <span className="text-[9px] font-mono text-muted-foreground uppercase">{comp.plataforma}</span>
                            </div>
                            <h4 className="font-display font-black text-base text-foreground uppercase tracking-wide mt-2">
                              {comp.nombre}
                            </h4>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground italic py-4">Este club no se encuentra registrado en torneos de temporada vigentes.</p>
                  )}
                </div>

                {/* CALENDARIO DE PARTIDOS DE VERDAD */}
                <div className="space-y-4 pt-2">
                  <Partidos forTeam={true} hideHero={true} teamId={id} />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <PageHelp 
        title="Sede Detallada del Club"
        description="Esta pantalla te muestra un desglose del perfil, plantilla y competencias del club en el cual te encuentras enrolado."
        steps={[
          {
            title: "Perfil e Identidad",
            description: "Muestra el escudo del equipo, siglas representativas, plataforma oficial, redes sociales del club (Twitter/Twitch) y la información del Capitán o dueño."
          },
          {
            title: "Pestaña Info General",
            description: "Contiene una descripción detallada del club redactada por su mánager, junto con estadísticas básicas de miembros y plataforma oficial."
          },
          {
            title: "Pestaña Plantilla del Club",
            description: "Lista a todos tus compañeros de equipo registrados en el roster, junto con sus dorsales asignados, gamertags de consolas y posiciones preferidas de juego."
          },
          {
            title: "Competiciones y Calendario",
            description: "Muestra un listado de los torneos activos en los que el club está participando y el calendario oficial de partidos (historial y encuentros pendientes)."
          }
        ]}
      />
    </div>
  );
}
