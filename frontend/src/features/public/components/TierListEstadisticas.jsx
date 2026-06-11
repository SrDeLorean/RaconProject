import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import Badge from '@/components/ui/Badge';

export default function TierListEstadisticas({ stats, getImageUrl }) {
  const [activeCategory, setActiveCategory] = useState('goleadores');

  const categories = [
    { id: 'goleadores', label: '🎯 Goleadores', key: 'top_goleadores' },
    { id: 'asistentes', label: '🪄 Asistentes', key: 'top_asistentes' },
    { id: 'delanteros', label: '👟 Delanteros', key: 'prestigio_delanteros' },
    { id: 'medios', label: '🔮 Mediocentros', key: 'prestigio_medios' },
    { id: 'defensas', label: '🛡️ Defensores', key: 'prestigio_defensas' },
    { id: 'porteros', label: '🧤 Porteros', key: 'prestigio_porteros' }
  ];

  const currentList = useMemo(() => {
    if (!stats) return [];
    const cat = categories.find(c => c.id === activeCategory);
    return stats[cat.key] || [];
  }, [stats, activeCategory]);

  const valueLabelAndFormat = (player) => {
    if (activeCategory === 'goleadores') {
      return { val: player.total_goles || 0, label: 'Goles' };
    }
    if (activeCategory === 'asistentes') {
      return { val: player.total_asistencias || 0, label: 'Asist.' };
    }
    return { val: player.score || 0, label: 'Score' };
  };

  // Group players by Tiers: S (1-3), A (4-10), B (11-25)
  const tiers = useMemo(() => {
    const s = [];
    const a = [];
    const b = [];

    currentList.forEach((player, index) => {
      const rank = index + 1;
      const enriched = { ...player, rank };
      if (rank <= 3) {
        s.push(enriched);
      } else if (rank <= 10) {
        a.push(enriched);
      } else {
        b.push(enriched);
      }
    });

    return { S: s, A: a, B: b };
  }, [currentList]);

  return (
    <div className="border border-border/40 bg-card/15 backdrop-blur-xl rounded-3xl p-6 md:p-8 space-y-6 max-w-5xl mx-auto shadow-2xl relative overflow-hidden text-left">
      <div className="absolute top-0 right-0 w-48 h-48 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
      
      <div className="border-b border-border/40 pb-4">
        <Badge className="text-primary bg-primary/10 border border-primary/25 text-[10px] uppercase font-condensed tracking-widest px-3 py-1">
          🏆 LEADERBOARD DE ELITE
        </Badge>
        <h2 className="text-2xl md:text-3xl font-display font-black uppercase text-foreground mt-1">
          TIER LIST POR <span className="text-primary">ESTADÍSTICAS</span>
        </h2>
        <p className="text-[11px] text-muted-foreground font-light">Explora a los mejores del servidor agrupados en rangos competitivos según su desempeño oficial.</p>
      </div>

      {/* Selector de Categorías */}
      <div className="grid grid-cols-2 xs:grid-cols-3 gap-1.5 sm:flex sm:flex-wrap justify-start border-b border-border/20 pb-5">
        {categories.map(cat => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`px-4 py-2.5 rounded-xl text-[10px] font-condensed tracking-widest uppercase transition-all duration-300 cursor-pointer border ${
              activeCategory === cat.id
                ? 'text-primary bg-primary/10 border-primary/40 font-black shadow-[0_0_12px_hsla(var(--primary),0.15)]'
                : 'text-muted-foreground hover:text-foreground border-border/40 bg-card/5 hover:bg-card/25'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Tier Lists Groups */}
      <div className="space-y-8 pt-2">
        {currentList.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center italic py-10">Sin reportes registrados para esta categoría.</p>
        ) : (
          ['S', 'A', 'B'].map(tierKey => {
            const list = tiers[tierKey];
            if (list.length === 0) return null;

            const tierMeta = {
              S: { label: 'TIER S (Leyendas)', color: 'from-amber-400/20 to-amber-500/5 text-amber-400 border-amber-500/30' },
              A: { label: 'TIER A (Clase Mundial)', color: 'from-emerald-500/20 to-emerald-600/5 text-emerald-400 border-emerald-500/30' },
              B: { label: 'TIER B (Profesionales)', color: 'from-blue-500/10 to-blue-600/5 text-blue-400 border-blue-500/20' }
            }[tierKey];

            return (
              <div key={tierKey} className="space-y-3 relative animate-fade-in-up">
                {/* Cabecera del Tier */}
                <div className={`flex items-center gap-3 px-4 py-2 rounded-xl bg-gradient-to-r ${tierMeta.color} border font-mono`}>
                  <span className="text-lg font-black tracking-widest">{tierKey}</span>
                  <span className="text-[10px] font-bold uppercase tracking-widest">{tierMeta.label}</span>
                </div>

                {/* Grid del Tier */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {list.map((player, idx) => {
                    const dataObj = valueLabelAndFormat(player);
                    
                    // Specific rank styles for top 3
                    const rankMedal = {
                      1: '🥇',
                      2: '🥈',
                      3: '🥉'
                    }[player.rank];

                    return (
                      <div 
                        key={player.id} 
                        className={`group border rounded-2xl p-4 flex items-center gap-4 transition-all duration-500 hover:-translate-y-1 hover:scale-[1.02] bg-background/40 backdrop-blur-sm relative overflow-hidden animate-fade-in-up ${
                          tierKey === 'S' 
                            ? 'border-amber-500/40 hover:border-amber-400 hover:shadow-[0_0_30px_rgba(245,158,11,0.25)] bg-gradient-to-br from-amber-500/10 to-transparent' 
                            : tierKey === 'A' 
                            ? 'border-emerald-500/20 hover:border-emerald-400 hover:shadow-[0_0_20px_rgba(16,185,129,0.15)] bg-gradient-to-br from-emerald-500/5 to-transparent'
                            : 'border-border/30 hover:border-primary/40 hover:shadow-[0_0_15px_rgba(var(--primary-rgb),0.1)]'
                        }`}
                        style={{ animationDelay: `${idx * 100}ms`, animationFillMode: 'both' }}
                      >
                        {/* Shimmer effect for S tier */}
                        {tierKey === 'S' && (
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-amber-300/10 to-transparent -translate-x-full group-hover:animate-shimmer pointer-events-none mix-blend-overlay"></div>
                        )}

                        {/* Rank Badge */}
                        <div className={`flex flex-col items-center justify-center shrink-0 w-10 h-10 rounded-xl font-mono shadow-inner ${
                          tierKey === 'S' ? 'bg-gradient-to-br from-amber-400/20 to-amber-600/20 border border-amber-500/50' :
                          tierKey === 'A' ? 'bg-emerald-500/10 border border-emerald-500/30' :
                          'bg-card/60 border border-border/30'
                        }`}>
                          {rankMedal ? (
                            <span className="text-xl leading-none select-none drop-shadow-md">{rankMedal}</span>
                          ) : (
                            <span className="text-xs font-black text-muted-foreground">#{player.rank}</span>
                          )}
                        </div>

                        {/* Player Photo */}
                        <Link to={`/jugadores/${player.id}`} className="shrink-0 relative">
                          {tierKey === 'S' && <div className="absolute inset-0 bg-amber-400/20 blur-md rounded-full pointer-events-none group-hover:bg-amber-400/40 transition-colors"></div>}
                          {player.foto ? (
                            <img 
                              src={getImageUrl(player.foto)} 
                              alt="" 
                              className={`w-12 h-12 rounded-full object-cover border-2 bg-card transition-colors relative z-10 ${
                                tierKey === 'S' ? 'border-amber-400/70 group-hover:border-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.3)]' :
                                tierKey === 'A' ? 'border-emerald-500/40 group-hover:border-emerald-400' :
                                'border-border/40 group-hover:border-primary/50'
                              }`} 
                            />
                          ) : (
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center font-display font-black text-sm text-foreground uppercase border-2 relative z-10 transition-colors ${
                                tierKey === 'S' ? 'bg-amber-950/40 border-amber-400/70 group-hover:border-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.3)] text-amber-400' :
                                tierKey === 'A' ? 'bg-emerald-950/30 border-emerald-500/40 group-hover:border-emerald-400 text-emerald-400' :
                                'bg-primary/10 border-border/40 group-hover:border-primary/50'
                            }`}>
                              {player.name?.charAt(0)}
                            </div>
                          )}
                        </Link>

                        {/* Player Details */}
                        <div className="min-w-0 flex-1 relative z-10">
                          <Link to={`/jugadores/${player.id}`} className="text-left block">
                            <strong className={`text-sm block font-bold truncate transition-colors ${
                              tierKey === 'S' ? 'text-amber-50 group-hover:text-amber-300 drop-shadow-[0_0_5px_rgba(245,158,11,0.3)]' :
                              tierKey === 'A' ? 'text-foreground group-hover:text-emerald-300' :
                              'text-foreground group-hover:text-primary'
                            }`}>
                              {player.name}
                            </strong>
                            <span className="text-[10px] text-muted-foreground font-mono font-bold block truncate mt-0.5">
                              {player.equipo_nombre}
                            </span>
                          </Link>
                        </div>

                        {/* Score Metric */}
                        <div className="text-right shrink-0 font-mono relative z-10">
                          <span className="text-[9px] font-bold text-muted-foreground uppercase block tracking-wider mb-0.5">{dataObj.label}</span>
                          <strong className={`text-lg font-black drop-shadow-md ${
                            tierKey === 'S' 
                              ? 'text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-amber-500' 
                              : tierKey === 'A' 
                              ? 'text-emerald-400' 
                              : 'text-primary'
                          }`}>
                            {typeof dataObj.val === 'number' && activeCategory !== 'goleadores' && activeCategory !== 'asistentes'
                              ? Number(dataObj.val).toFixed(1)
                              : dataObj.val}
                          </strong>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
