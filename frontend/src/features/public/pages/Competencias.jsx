import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '@/api/axios';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';

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

  if (loading) {
    return (
      <div className="pt-28 pb-16 min-h-screen bg-background flex flex-col items-center justify-center gap-3">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary"></div>
        <span className="text-sm font-bold tracking-widest text-primary uppercase animate-pulse">Cargando Competencias...</span>
      </div>
    );
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
    <div className="relative min-h-screen bg-background pt-28 pb-16 overflow-hidden">
      
      {/* Fondo Inmersivo */}
      <div 
        className="absolute inset-0 bg-cover bg-center z-0"
        style={{ backgroundImage: "url('https://images.unsplash.com/photo-1511512578047-dfb367046420?q=80&w=1920&auto=format&fit=crop')" }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-background/95 via-background/70 to-background z-10"></div>
      </div>

      {/* Resplandor ambiental e-sports */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[350px] md:w-[600px] h-[350px] md:h-[600px] bg-primary/20 blur-[120px] rounded-full pointer-events-none z-10 animate-pulse-glow"></div>

      <div className="relative z-20 max-w-7xl mx-auto px-6 lg:px-10 space-y-12">
        {/* Cabecera */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6 border-b border-border/50 pb-8">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate(`/organizaciones/${orgId}`)}
              className="p-2.5 rounded-xl border border-border/60 hover:bg-muted/50 transition-all duration-200 active:scale-95 text-muted-foreground hover:text-foreground bg-card/40 backdrop-blur-md"
            >
              ⬅️ Atrás
            </button>
            <div>
              <Badge 
                variant="primary"
                className="px-2 py-0.5 text-[10px] font-condensed tracking-widest text-primary border-primary/30 bg-primary/10 rounded-full animate-pulse-glow"
              >
                {organizacion?.nombre} / {temporada.nombre}
              </Badge>
              <h1 className="text-4xl md:text-6xl font-display font-extrabold text-foreground tracking-wide uppercase mt-2 leading-[0.85]">
                LIGAS Y <span className="text-glow-primary">COMPETENCIAS</span>
              </h1>
            </div>
          </div>
        </div>

        {temporada.competencias && temporada.competencias.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {temporada.competencias.map((comp) => (
              <div 
                key={comp.id} 
                className="group border border-border/50 bg-card/25 backdrop-blur-md rounded-2xl p-6 flex flex-col justify-between gap-6 relative overflow-hidden shadow-lg hover:border-primary/45 transition-all duration-300"
              >
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-[9px] bg-primary/10 text-primary border border-primary/20 font-bold px-2 py-0.5 rounded uppercase tracking-wider">
                      {comp.formato}
                    </span>
                    <span className="text-[10px] font-mono text-muted-foreground uppercase">{comp.plataforma}</span>
                  </div>

                  <h3 className="font-display font-black text-2xl text-foreground uppercase tracking-wide group-hover:text-primary transition-colors leading-none">
                    {comp.nombre}
                  </h3>

                  <div className="w-full h-px bg-border/40"></div>

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

                <Button 
                  onClick={() => navigate(`/competencia-detalle/${comp.id}`)}
                  className="w-full h-10 text-xs font-bold uppercase tracking-wider bg-primary/10 text-primary border border-primary/20 hover:bg-primary hover:text-primary-foreground transition-all duration-300"
                >
                  🏟️ Ver Ficha del Torneo
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <div className="border border-border/60 bg-muted/25 rounded-2xl p-16 flex flex-col items-center text-center max-w-2xl mx-auto gap-6 shadow-sm">
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
