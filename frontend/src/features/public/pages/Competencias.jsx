import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '@/api/axios';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import PageLoader from '@/components/ui/PageLoader';

const getImageUrl = (path) => {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  const backendBaseUrl = api.defaults.baseURL?.replace('/api', '') || 'http://localhost:8000';
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${backendBaseUrl}${cleanPath}`;
};

export default function Competencias() {
  const { orgId, tempId } = useParams();
  const navigate = useNavigate();
  const [organizacion, setOrganizacion] = useState(null);
  const [temporada, setTemporada] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrgDetail = async () => {
      try {
        const response = await api.get(`/organizaciones/${orgId}`);
        setOrganizacion(response.data);
        const temp = response.data?.temporadas?.find(t => t.id === Number(tempId));
        setTemporada(temp);
      } catch (error) {
        console.error("Error al obtener competencias de la temporada:", error);
      } finally {
        setLoading(false);
      }
    };
    if (orgId && tempId) {
      fetchOrgDetail();
    }
  }, [orgId, tempId]);

  // Format badge color mapping
  const formatoBadge = (formato) => {
    const f = (formato || '').toLowerCase();
    if (f.includes('liga')) return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
    if (f.includes('copa')) return 'bg-amber-500/15 text-amber-400 border-amber-500/30';
    if (f.includes('torneo')) return 'bg-violet-500/15 text-violet-400 border-violet-500/30';
    if (f.includes('playoff')) return 'bg-rose-500/15 text-rose-400 border-rose-500/30';
    return 'bg-primary/10 text-primary border-primary/20';
  };

  if (loading) {
    return <PageLoader />;
  }

  if (!temporada) {
    return (
      <div className="pt-28 pb-16 text-center max-w-2xl mx-auto space-y-4">
        <h2 className="text-xl font-display font-black text-foreground uppercase">Temporada No Encontrada</h2>
        <Button onClick={() => navigate(`/organizaciones/${orgId}`)}>Volver al circuito</Button>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-background text-foreground overflow-hidden selection:bg-primary/30 selection:text-primary font-sans">
      
      {/* Ambient glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[70%] h-[550px] bg-primary/5 blur-[120px] pointer-events-none z-0"></div>
      <div className="absolute bottom-10 right-10 w-[400px] h-[400px] bg-primary/3 blur-[110px] rounded-full pointer-events-none z-0"></div>

      {/* Sleek Navigation Back Button Row */}
      <div className="max-w-7xl mx-auto px-6 lg:px-10 pt-28 md:pt-32 pb-4 flex justify-start items-center relative z-30">
        <button 
          onClick={() => navigate(`/organizaciones/${orgId}`)}
          className="flex items-center gap-2.5 px-4 py-2 rounded-xl border border-border/50 bg-card/35 backdrop-blur-md text-xs font-condensed tracking-wider font-bold text-muted-foreground hover:text-primary hover:border-primary/45 transition-all duration-300 shadow-md active:scale-95 group cursor-pointer"
        >
          <span className="group-hover:-translate-x-1 transition-transform duration-300">←</span>
          VOLVER AL CIRCUITO
        </button>
      </div>

      {/* ========================================================================= */}
      {/* 2. HERO CENTRAL (Cinemático y Táctico - Estilo Organizaciones)            */}
      {/* ========================================================================= */}
      <section className="relative z-20 max-w-7xl mx-auto overflow-hidden rounded-3xl border border-border/40 bg-card/45 backdrop-blur-md shadow-2xl mb-8">
        
        {/* Banner image as header */}
        <div className="relative h-56 md:h-72 w-full overflow-hidden border-b border-border/40">
          {organizacion?.banner ? (
            <img 
              src={getImageUrl(organizacion.banner)} 
              alt={organizacion.nombre} 
              className="w-full h-full object-cover opacity-85" 
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-r from-primary/10 via-background to-primary/5 flex items-center justify-center">
              <span className="text-muted-foreground text-xs uppercase tracking-widest font-condensed">Sin banner oficial</span>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-card via-card/40 to-transparent z-10"></div>
        </div>

        <div className="p-6 md:p-8 relative z-10 -mt-14 md:-mt-16">
          <div className="grid grid-cols-1 lg:grid-cols-10 gap-8 items-end">
            
            {/* LADO IZQUIERDO — IMPACTO PRINCIPAL */}
            <div className="lg:col-span-7 relative flex flex-col items-start gap-4">
              
              <div className="flex items-center gap-3 animate-fade-in-up">
                <Badge 
                  variant="primary" 
                  className="px-5 py-2 text-[10px] font-condensed tracking-[0.2em] text-primary border border-primary/30 bg-primary/10 rounded-full shadow-[0_0_20px_hsla(var(--primary),0.15)] uppercase animate-pulse shrink-0 z-10"
                >
                  🏆 {temporada.nombre}
                </Badge>
              </div>

              <div className="flex items-center gap-5 mt-2 z-10 animate-fade-in-up">
                {organizacion?.logo ? (
                  <img 
                    src={getImageUrl(organizacion.logo)} 
                    alt={organizacion.nombre}
                    className="w-20 h-20 md:w-24 md:h-24 rounded-2xl object-cover border-4 border-card bg-card shadow-xl shrink-0"
                  />
                ) : (
                  <div className="w-20 h-20 md:w-24 md:h-24 rounded-2xl bg-gradient-to-br from-primary/20 to-background border-4 border-card flex items-center justify-center font-display font-black text-primary text-3xl shrink-0">
                    {organizacion?.nombre?.charAt(0)}
                  </div>
                )}
                <div>
                  <h1 className="text-4xl md:text-6xl font-display font-black text-foreground uppercase tracking-normal leading-tight drop-shadow-2xl">
                    {organizacion?.nombre}
                  </h1>
                  <p className="text-xs md:text-sm text-muted-foreground mt-2 max-w-xl font-light leading-relaxed">
                    {organizacion?.descripcion || 'American Club Leagues. Confederación líder en eSports Pro Clubs profesionales.'}
                  </p>
                </div>
              </div>
            </div>

            {/* DERECHA — INFORMACIÓN TÁCTICA */}
            <div className="lg:col-span-3 flex flex-col justify-center items-start lg:items-stretch gap-6 z-10 animate-fade-in-up" style={{ animationDelay: '0.15s' }}>
              <div className="border border-border/40 bg-card/65 backdrop-blur-md rounded-2xl p-5 w-full space-y-4 shadow-xl">
                
                <div className="flex justify-between items-center border-b border-border/30 pb-2">
                  <span className="text-[10px] font-condensed tracking-widest text-muted-foreground uppercase">DETALLES DE LA TEMPORADA</span>
                  <span className="text-[10px] font-mono text-primary font-bold">INFO CIRCUITO</span>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-[9px] font-condensed text-muted-foreground uppercase tracking-widest leading-none">TORNEOS</h4>
                    <span className="text-2xl font-display font-black text-foreground">{temporada.competencias?.length || 0}</span>
                  </div>
                  <div>
                    <h4 className="text-[9px] font-condensed text-muted-foreground uppercase tracking-widest leading-none">ESTADO</h4>
                    <span className={`text-sm font-condensed font-black px-2 py-0.5 rounded border tracking-wider inline-block ${
                      temporada.activa 
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                        : 'bg-muted/20 text-muted-foreground border-border/50'
                    }`}>
                      {temporada.activa ? 'ACTIVA' : 'FINALIZADA'}
                    </span>
                  </div>
                </div>

                <p className="text-[11px] text-muted-foreground leading-relaxed font-sans font-light">
                  Listado oficial de divisiones creadas para la disputa de la temporada activa.
                </p>
              </div>
            </div>

          </div>
        </div>
      </section>

      <div className="relative z-20 max-w-7xl mx-auto px-6 lg:px-10 space-y-12">

        {temporada.competencias && temporada.competencias.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {temporada.competencias.map((comp, index) => (
              <div 
                key={comp.id} 
                className="group border border-border/50 bg-card/25 backdrop-blur-md rounded-2xl flex flex-col justify-between overflow-hidden shadow-lg relative league-card-interactive scanlines animate-fade-in-up hover:border-primary/45 transition-all duration-300"
                style={{
                  animationDelay: `${index * 0.06}s`,
                  ...(comp.color_tema ? { borderLeftWidth: '3px', borderLeftColor: comp.color_tema } : {})
                }}
              >
                {/* Subtle color tint overlay when color_tema exists */}
                {comp.color_tema && (
                  <div 
                    className="absolute inset-0 rounded-2xl pointer-events-none opacity-[0.04] z-0" 
                    style={{ backgroundColor: comp.color_tema }}
                  />
                )}
                <div className="absolute inset-0 tactical-noise pointer-events-none z-10 opacity-[0.6]"></div>

                {/* Banner header for the division card */}
                <div className="relative h-28 w-full overflow-hidden border-b border-border/30 bg-muted/20">
                  {comp.banner ? (
                    <img 
                      src={getImageUrl(comp.banner)} 
                      alt={comp.nombre} 
                      className="w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-500" 
                    />
                  ) : organizacion?.banner ? (
                    <img 
                      src={getImageUrl(organizacion.banner)} 
                      alt={comp.nombre} 
                      className="w-full h-full object-cover opacity-60 filter blur-[1px] group-hover:scale-105 transition-transform duration-500" 
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-r from-primary/10 to-primary/5"></div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-card/90 to-transparent"></div>
                </div>

                <div className="px-6 pb-6 pt-0 space-y-4 relative z-20 -mt-10">
                  {/* Logo and metadata row */}
                  <div className="flex items-end justify-between border-b border-border/40 pb-3">
                    {comp.logo ? (
                      <img 
                        src={getImageUrl(comp.logo)} 
                        alt={comp.nombre} 
                        className="w-16 h-16 rounded-xl object-cover border-2 border-card bg-card shadow-md shrink-0 z-20"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-primary/20 to-background border-2 border-card flex items-center justify-center font-display font-black text-primary text-xl shrink-0 z-20">
                        {comp.nombre?.charAt(0)}
                      </div>
                    )}
                    <div className="flex flex-col items-end gap-1.5 text-right relative z-20">
                      <span className={`text-[9px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider border ${formatoBadge(comp.formato)}`}>
                        {comp.formato === 'liga' ? '🏟️' : comp.formato === 'copa' ? '🏆' : '⚽'} {comp.formato}
                      </span>
                      <span className="text-[9px] font-mono font-bold text-muted-foreground uppercase leading-none">{comp.plataforma}</span>
                    </div>
                  </div>

                  <h3 className="font-display font-black text-2xl text-foreground uppercase tracking-wide group-hover:text-primary transition-colors leading-tight">
                    {comp.nombre}
                  </h3>

                  <div className="space-y-2 text-xs text-muted-foreground font-semibold">
                    <div className="flex justify-between">
                      <span>Cupo Máximo:</span>
                      <span className="text-foreground font-bold font-mono">{comp.max_participantes} Clubes</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Prize Pool:</span>
                      <span className="text-primary font-bold font-mono">${comp.prize_pool || '0.00'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Inscripción:</span>
                      <span className="text-foreground font-bold font-mono">${comp.entry_fee || 'Gratis'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Periodo Fichajes:</span>
                      <span className={`font-bold ${comp.periodo_traspasos_abierto ? 'text-emerald-400' : 'text-primary'}`}>
                        {comp.periodo_traspasos_abierto ? 'Abierto 🔓' : 'Cerrado 🔒'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="p-6 pt-0 relative z-20">
                  <Button 
                    onClick={() => navigate(`/competencia-detalle/${comp.id}`)}
                    className="w-full h-11 text-xs font-condensed font-black uppercase tracking-widest bg-primary/10 text-primary border border-primary/20 hover:bg-primary hover:text-primary-foreground hover:shadow-[0_0_15px_hsla(var(--primary),0.35)] transition-all duration-300"
                  >
                    🏟️ Ver Ficha del Torneo
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="border border-border/60 bg-muted/25 rounded-2xl p-16 flex flex-col items-center text-center max-w-2xl mx-auto gap-6 shadow-sm animate-fade-in-up">
            <span className="text-3xl">🏆</span>
            <div className="space-y-2">
              <h2 className="text-xl font-display font-black tracking-wide text-foreground uppercase">Sin Competencias Vigentes</h2>
              <p className="text-sm text-muted-foreground max-w-md">
                No se registran ligas o competencias activas para esta temporada en nuestro sistema.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
