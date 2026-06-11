import React, { useState, useEffect, useMemo } from 'react';
import Badge from '@/components/ui/Badge';

export default function ComparadorAnalitico({ playersList }) {
  const [playerAId, setPlayerAId] = useState('');
  const [playerBId, setPlayerBId] = useState('');
  const [searchA, setSearchA] = useState('');
  const [searchB, setSearchB] = useState('');

  const filteredPlayersA = useMemo(() => {
    return playersList.filter(p => {
      const match = p.name?.toLowerCase().includes(searchA.toLowerCase()) || 
                    p.equipo_nombre?.toLowerCase().includes(searchA.toLowerCase());
      return match || String(p.id) === String(playerAId);
    });
  }, [playersList, searchA, playerAId]);

  const filteredPlayersB = useMemo(() => {
    return playersList.filter(p => {
      const match = p.name?.toLowerCase().includes(searchB.toLowerCase()) || 
                    p.equipo_nombre?.toLowerCase().includes(searchB.toLowerCase());
      return match || String(p.id) === String(playerBId);
    });
  }, [playersList, searchB, playerBId]);

  // Set default selected players when list is loaded (consistently as string)
  useEffect(() => {
    if (playersList && playersList.length >= 2) {
      setPlayerAId(String(playersList[0].id));
      setPlayerBId(String(playersList[1].id));
    }
  }, [playersList]);

  // Auto-select first matching player when typing search queries
  useEffect(() => {
    if (searchA.trim() !== '') {
      const match = playersList.find(p => 
        p.name?.toLowerCase().includes(searchA.toLowerCase()) || 
        p.equipo_nombre?.toLowerCase().includes(searchA.toLowerCase())
      );
      if (match && String(match.id) !== String(playerAId)) {
        setPlayerAId(String(match.id));
      }
    }
  }, [searchA, playersList]);

  useEffect(() => {
    if (searchB.trim() !== '') {
      const match = playersList.find(p => 
        p.name?.toLowerCase().includes(searchB.toLowerCase()) || 
        p.equipo_nombre?.toLowerCase().includes(searchB.toLowerCase())
      );
      if (match && String(match.id) !== String(playerBId)) {
        setPlayerBId(String(match.id));
      }
    }
  }, [searchB, playersList]);

  // Find player objects
  const playerA = useMemo(() => playersList.find(p => String(p.id) === String(playerAId)), [playersList, playerAId]);
  const playerB = useMemo(() => playersList.find(p => String(p.id) === String(playerBId)), [playersList, playerBId]);

  const getImageUrl = (path) => {
    if (!path) return null;
    if (path.startsWith('http')) return path;
    if (typeof window.mediaUrl === 'function') {
      return window.mediaUrl(path);
    }
    return `http://localhost:8000${path}`;
  };

  const statGroups = useMemo(() => {
    if (!playerA || !playerB) return [];

    return [
      {
        title: '📊 MÉTRICAS GENERALES Y OVR',
        colorClass: 'text-primary border-primary/20 bg-primary/5',
        stats: [
          {
            label: 'Valoración General Promedio (OVR)',
            valA: playerA.avg_valoracion ? Number(playerA.avg_valoracion) : 0,
            valB: playerB.avg_valoracion ? Number(playerB.avg_valoracion) : 0,
            max: 10,
            format: (v) => Number(v).toFixed(2)
          },
          {
            label: 'Partidos Jugados',
            valA: playerA.partidos_jugados || 0,
            valB: playerB.partidos_jugados || 0,
            max: Math.max(1, (playerA.partidos_jugados || 0) * 1.2, (playerB.partidos_jugados || 0) * 1.2),
            format: (v) => `${v} Partidos`
          },
          {
            label: 'Galardones MVP',
            valA: playerA.total_mvp || 0,
            valB: playerB.total_mvp || 0,
            max: Math.max(1, (playerA.total_mvp || 0) * 1.2, (playerB.total_mvp || 0) * 1.2),
            format: (v) => `🏆 ${v} MVPs`
          }
        ]
      },
      {
        title: '🎯 FASE OFENSIVA Y REMATES',
        colorClass: 'text-rose-400 border-rose-500/20 bg-rose-500/5',
        stats: [
          {
            label: 'Goles Totales',
            valA: playerA.total_goles || 0,
            valB: playerB.total_goles || 0,
            max: Math.max(1, (playerA.total_goles || 0) * 1.2, (playerB.total_goles || 0) * 1.2),
            format: (v) => `${v} Goles`
          },
          {
            label: 'Tiros Totales',
            valA: playerA.total_tiros || 0,
            valB: playerB.total_tiros || 0,
            max: Math.max(1, (playerA.total_tiros || 0) * 1.2, (playerB.total_tiros || 0) * 1.2),
            format: (v) => `${v} Tiros`
          },
          {
            label: 'Precisión de Tiro (%)',
            valA: playerA.avg_precision_tiro ? Number(playerA.avg_precision_tiro) : 0,
            valB: playerB.avg_precision_tiro ? Number(playerB.avg_precision_tiro) : 0,
            max: 100,
            format: (v) => `${Number(v).toFixed(1)}%`
          }
        ]
      },
      {
        title: '🪄 FASE ASOCIATIVA Y DISTRIBUCIÓN',
        colorClass: 'text-emerald-400 border-emerald-500/20 bg-emerald-500/5',
        stats: [
          {
            label: 'Asistencias Totales',
            valA: playerA.total_asistencias || 0,
            valB: playerB.total_asistencias || 0,
            max: Math.max(1, (playerA.total_asistencias || 0) * 1.2, (playerB.total_asistencias || 0) * 1.2),
            format: (v) => `${v} Asist.`
          },
          {
            label: 'Pases Completados',
            valA: playerA.total_pases_completados || 0,
            valB: playerB.total_pases_completados || 0,
            max: Math.max(1, (playerA.total_pases_completados || 0) * 1.2, (playerB.total_pases_completados || 0) * 1.2),
            format: (v) => `${v} Pases`
          },
          {
            label: 'Pases Intentados',
            valA: playerA.total_pases_intentados || 0,
            valB: playerB.total_pases_intentados || 0,
            max: Math.max(1, (playerA.total_pases_intentados || 0) * 1.2, (playerB.total_pases_intentados || 0) * 1.2),
            format: (v) => `${v} Pases`
          },
          {
            label: 'Precisión de Pases (%)',
            valA: playerA.avg_precision_pases ? Number(playerA.avg_precision_pases) : 0,
            valB: playerB.avg_precision_pases ? Number(playerB.avg_precision_pases) : 0,
            max: 100,
            format: (v) => `${Number(v).toFixed(1)}%`
          }
        ]
      },
      {
        title: '🛡️ FASE DEFENSIVA Y PREVENCIÓN',
        colorClass: 'text-blue-400 border-blue-500/20 bg-blue-500/5',
        stats: [
          {
            label: 'Quites (Entradas) Exitosos',
            valA: playerA.total_entradas || 0,
            valB: playerB.total_entradas || 0,
            max: Math.max(1, (playerA.total_entradas || 0) * 1.2, (playerB.total_entradas || 0) * 1.2),
            format: (v) => `${v} Quites`
          },
          {
            label: 'Quites (Entradas) Intentados',
            valA: playerA.total_entradas_intentadas || 0,
            valB: playerB.total_entradas_intentadas || 0,
            max: Math.max(1, (playerA.total_entradas_intentadas || 0) * 1.2, (playerB.total_entradas_intentadas || 0) * 1.2),
            format: (v) => `${v} Quites`
          },
          {
            label: 'Tasa de Éxito en Quites (%)',
            valA: playerA.avg_exito_entradas ? Number(playerA.avg_exito_entradas) : 0,
            valB: playerB.avg_exito_entradas ? Number(playerB.avg_exito_entradas) : 0,
            max: 100,
            format: (v) => `${Number(v).toFixed(1)}%`
          },
          {
            label: 'Desvíos Totales',
            valA: playerA.total_desvios || 0,
            valB: playerB.total_desvios || 0,
            max: Math.max(1, (playerA.total_desvios || 0) * 1.2, (playerB.total_desvios || 0) * 1.2),
            format: (v) => `${v} Desvíos`
          }
        ]
      },
      {
        title: '🧤 REGISTRO DE ARCO Y ATAJADAS',
        colorClass: 'text-amber-400 border-amber-500/20 bg-amber-500/5',
        stats: [
          {
            label: 'Atajadas Totales',
            valA: playerA.total_atajadas || 0,
            valB: playerB.total_atajadas || 0,
            max: Math.max(1, (playerA.total_atajadas || 0) * 1.2, (playerB.total_atajadas || 0) * 1.2),
            format: (v) => `${v} Atajadas`
          },
          {
            label: 'Goles Recibidos',
            valA: playerA.total_goles_recibidos || 0,
            valB: playerB.total_goles_recibidos || 0,
            max: Math.max(1, (playerA.total_goles_recibidos || 0) * 1.2, (playerB.total_goles_recibidos || 0) * 1.2),
            format: (v) => `${v} Goles`
          },
          {
            label: 'Atajadas de Colocación',
            valA: playerA.total_atajadas_buena_colocacion || 0,
            valB: playerB.total_atajadas_buena_colocacion || 0,
            max: Math.max(1, (playerA.total_atajadas_buena_colocacion || 0) * 1.2, (playerB.total_atajadas_buena_colocacion || 0) * 1.2),
            format: (v) => `${v} Paradas`
          },
          {
            label: 'Atajadas de Volada',
            valA: playerA.total_atajadas_volada || 0,
            valB: playerB.total_atajadas_volada || 0,
            max: Math.max(1, (playerA.total_atajadas_volada || 0) * 1.2, (playerB.total_atajadas_volada || 0) * 1.2),
            format: (v) => `${v} Paradas`
          },
          {
            label: 'Atajadas de Reflejos',
            valA: playerA.total_atajadas_reflejos || 0,
            valB: playerB.total_atajadas_reflejos || 0,
            max: Math.max(1, (playerA.total_atajadas_reflejos || 0) * 1.2, (playerB.total_atajadas_reflejos || 0) * 1.2),
            format: (v) => `${v} Paradas`
          },
          {
            label: 'Despejes de Puños',
            valA: playerA.total_despejes_punos || 0,
            valB: playerB.total_despejes_punos || 0,
            max: Math.max(1, (playerA.total_despejes_punos || 0) * 1.2, (playerB.total_despejes_punos || 0) * 1.2),
            format: (v) => `${v} Despejes`
          },
          {
            label: 'Centros Cortados',
            valA: playerA.total_centros_cortados || 0,
            valB: playerB.total_centros_cortados || 0,
            max: Math.max(1, (playerA.total_centros_cortados || 0) * 1.2, (playerB.total_centros_cortados || 0) * 1.2),
            format: (v) => `${v} Centros`
          }
        ]
      },
      {
        title: '⏱️ TELEMETRÍA FÍSICA Y LATENCIA',
        colorClass: 'text-purple-400 border-purple-500/20 bg-purple-500/5',
        stats: [
          {
            label: 'Segundos Jugados',
            valA: playerA.total_segundos_jugados || 0,
            valB: playerB.total_segundos_jugados || 0,
            max: Math.max(1, (playerA.total_segundos_jugados || 0) * 1.2, (playerB.total_segundos_jugados || 0) * 1.2),
            format: (v) => `${Math.round(v / 60)} Mins (${v}s)`
          },
          {
            label: 'Tarjetas Rojas',
            valA: playerA.total_tarjetas_rojas || 0,
            valB: playerB.total_tarjetas_rojas || 0,
            max: Math.max(1, (playerA.total_tarjetas_rojas || 0) * 1.2, (playerB.total_tarjetas_rojas || 0) * 1.2),
            format: (v) => `🟥 ${v}`
          }
        ]
      }
    ];
  }, [playerA, playerB]);

  return (
    <div className="border border-border/40 bg-card/15 backdrop-blur-xl rounded-3xl p-6 md:p-8 space-y-6 max-w-5xl mx-auto shadow-2xl relative overflow-hidden group">
      {/* Dynamic Versus Background */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-transparent to-rose-500/5 pointer-events-none opacity-50 group-hover:opacity-100 transition-opacity duration-700"></div>
      <div className="absolute top-0 left-0 w-[40%] h-full bg-gradient-to-r from-blue-500/10 to-transparent blur-3xl pointer-events-none -translate-x-1/2"></div>
      <div className="absolute top-0 right-0 w-[40%] h-full bg-gradient-to-l from-rose-500/10 to-transparent blur-3xl pointer-events-none translate-x-1/2"></div>
      
      <div className="border-b border-border/40 pb-4 relative z-10 text-center">
        <Badge className="text-foreground bg-background/50 border border-border/50 text-[10px] uppercase font-condensed tracking-widest px-3 py-1 backdrop-blur-md">
          ⚔️ FIGHTER SELECT
        </Badge>
        <h2 className="text-3xl md:text-5xl font-display font-black uppercase text-foreground mt-3 tracking-tighter drop-shadow-lg">
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-blue-600">JUGADOR A</span>
          <span className="mx-4 text-muted-foreground/30 font-light text-2xl italic">VS</span>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-400 to-rose-600">JUGADOR B</span>
        </h2>
        <p className="text-[11px] text-muted-foreground font-light mt-2 uppercase tracking-widest">ENFRENTAMIENTO BIOMÉTRICO DIRECTO</p>
      </div>

      {/* Selector de Jugadores */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 items-center border-b border-border/20 pb-6">
        
        {/* Jugador A Select */}
        <div className="space-y-2">
          <label className="text-[10px] font-mono font-black text-muted-foreground uppercase tracking-widest block text-left">🔵 Jugador A</label>
          <div className="flex flex-col gap-2">
            <input
              type="text"
              placeholder="🔍 Buscar Jugador A (nombre o club)..."
              value={searchA}
              onChange={(e) => setSearchA(e.target.value)}
              className="w-full bg-background/45 border border-border/40 hover:border-primary/45 rounded-xl px-3 py-2 text-xs font-mono font-bold text-foreground focus:outline-none focus:border-primary/50 transition-all placeholder:text-gray-600"
            />
            <div className="relative">
              <select 
                value={playerAId}
                onChange={(e) => setPlayerAId(e.target.value)}
                className="w-full bg-background/55 border border-border/40 px-3 py-2.5 rounded-xl text-xs font-mono font-bold text-foreground focus:outline-none focus:border-primary/50 cursor-pointer select-none appearance-none"
              >
                {filteredPlayersA.map(p => (
                  <option key={p.id} value={p.id} className="bg-card text-foreground">{p.name} ({p.equipo_nombre})</option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-muted-foreground text-[9px]">▼</div>
            </div>
          </div>
        </div>
 
        {/* Jugador B Select */}
        <div className="space-y-2">
          <label className="text-[10px] font-mono font-black text-muted-foreground uppercase tracking-widest block text-left">🔴 Jugador B</label>
          <div className="flex flex-col gap-2">
            <input
              type="text"
              placeholder="🔍 Buscar Jugador B (nombre o club)..."
              value={searchB}
              onChange={(e) => setSearchB(e.target.value)}
              className="w-full bg-background/45 border border-border/40 hover:border-primary/45 rounded-xl px-3 py-2 text-xs font-mono font-bold text-foreground focus:outline-none focus:border-primary/50 transition-all placeholder:text-gray-600"
            />
            <div className="relative">
              <select 
                value={playerBId}
                onChange={(e) => setPlayerBId(e.target.value)}
                className="w-full bg-background/55 border border-border/40 px-3 py-2.5 rounded-xl text-xs font-mono font-bold text-foreground focus:outline-none focus:border-primary/50 cursor-pointer select-none appearance-none"
              >
                {filteredPlayersB.map(p => (
                  <option key={p.id} value={p.id} className="bg-card text-foreground">{p.name} ({p.equipo_nombre})</option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-muted-foreground text-[9px]">▼</div>
            </div>
          </div>
        </div>
 
      </div>

      {/* Visual Comparisons */}
      {playerA && playerB ? (
        <div className="space-y-10 pt-4 relative z-10">
          {/* Compare Info Header - Fighter Select Style */}
          <div className="flex justify-between items-center text-center font-mono py-6 relative">
            
            {/* VS Badge in the exact center */}
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20 flex flex-col items-center animate-pulse">
              <span className="text-4xl md:text-6xl font-display font-black italic bg-clip-text text-transparent bg-gradient-to-b from-white to-white/20 filter drop-shadow-[0_0_15px_rgba(255,255,255,0.5)]">
                VS
              </span>
            </div>

            {/* Player A Header (Blue Corner) */}
            <div className="w-[45%] flex flex-col items-center gap-3 relative group/p1">
              <div className="absolute inset-0 bg-blue-500/5 blur-2xl rounded-full scale-150 opacity-0 group-hover/p1:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
              <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest bg-blue-500/10 px-3 py-1 rounded-full border border-blue-500/30">
                P1 (AZUL)
              </span>
              
              <div className="relative">
                <div className="absolute inset-0 bg-blue-500/20 blur-xl rounded-full animate-pulse-slow"></div>
                {playerA.foto ? (
                  <img 
                    src={getImageUrl(playerA.foto)} 
                    alt="" 
                    className="w-24 h-24 md:w-32 md:h-32 rounded-full object-cover border-[3px] border-blue-500 shadow-[0_0_30px_rgba(59,130,246,0.4)] bg-card relative z-10 group-hover/p1:scale-105 transition-transform duration-300" 
                  />
                ) : (
                  <div className="w-24 h-24 md:w-32 md:h-32 rounded-full bg-blue-950/50 border-[3px] border-blue-500 shadow-[0_0_30px_rgba(59,130,246,0.4)] flex items-center justify-center font-display font-black text-4xl text-blue-400 uppercase relative z-10 group-hover/p1:scale-105 transition-transform duration-300">
                    {playerA.name?.charAt(0)}
                  </div>
                )}
              </div>
              
              <div className="relative z-10 mt-2">
                <strong className="text-xl md:text-3xl font-display font-black text-white uppercase block leading-none drop-shadow-[0_0_10px_rgba(59,130,246,0.8)]">{playerA.name}</strong>
                <span className="text-[10px] md:text-xs text-blue-300 font-bold uppercase tracking-widest mt-1 block">{playerA.equipo_nombre} • {playerA.posicion?.toUpperCase()}</span>
              </div>
            </div>

            {/* Player B Header (Red Corner) */}
            <div className="w-[45%] flex flex-col items-center gap-3 relative group/p2">
              <div className="absolute inset-0 bg-rose-500/5 blur-2xl rounded-full scale-150 opacity-0 group-hover/p2:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
              <span className="text-[10px] font-black text-rose-400 uppercase tracking-widest bg-rose-500/10 px-3 py-1 rounded-full border border-rose-500/30">
                P2 (ROJO)
              </span>
              
              <div className="relative">
                <div className="absolute inset-0 bg-rose-500/20 blur-xl rounded-full animate-pulse-slow"></div>
                {playerB.foto ? (
                  <img 
                    src={getImageUrl(playerB.foto)} 
                    alt="" 
                    className="w-24 h-24 md:w-32 md:h-32 rounded-full object-cover border-[3px] border-rose-500 shadow-[0_0_30px_rgba(244,63,94,0.4)] bg-card relative z-10 group-hover/p2:scale-105 transition-transform duration-300" 
                  />
                ) : (
                  <div className="w-24 h-24 md:w-32 md:h-32 rounded-full bg-rose-950/50 border-[3px] border-rose-500 shadow-[0_0_30px_rgba(244,63,94,0.4)] flex items-center justify-center font-display font-black text-4xl text-rose-400 uppercase relative z-10 group-hover/p2:scale-105 transition-transform duration-300">
                    {playerB.name?.charAt(0)}
                  </div>
                )}
              </div>
              
              <div className="relative z-10 mt-2">
                <strong className="text-xl md:text-3xl font-display font-black text-white uppercase block leading-none drop-shadow-[0_0_10px_rgba(244,63,94,0.8)]">{playerB.name}</strong>
                <span className="text-[10px] md:text-xs text-rose-300 font-bold uppercase tracking-widest mt-1 block">{playerB.equipo_nombre} • {playerB.posicion?.toUpperCase()}</span>
              </div>
            </div>
          </div>

          {/* Grouped metrics sections */}
          <div className="space-y-8 max-w-4xl mx-auto">
            {statGroups.map((group, gIdx) => (
              <div key={gIdx} className="space-y-3">
                {/* Group Heading */}
                <div className={`px-4 py-2 rounded-xl border font-mono text-[10px] font-black tracking-widest ${group.colorClass}`}>
                  {group.title}
                </div>

                {/* Group Stats Bars */}
                <div className="space-y-3">
                  {group.stats.map((stat, sIdx) => {
                    const pctA = Math.min(100, (stat.valA / stat.max) * 100);
                    const pctB = Math.min(100, (stat.valB / stat.max) * 100);

                    return (
                      <div key={sIdx} className="space-y-1 bg-background/25 border border-border/20 p-4 rounded-2xl relative overflow-hidden">
                        <span className="text-[10px] font-mono font-black text-muted-foreground uppercase tracking-wider block text-center mb-2">
                          {stat.label}
                        </span>

                        {/* Desktop Layout (Horizontal bars facing each other) */}
                        <div className="hidden sm:flex items-center justify-between gap-4 font-mono w-full">
                          {/* Left bar (Player A - Blue) */}
                          <div className="w-[45%] flex items-center justify-end gap-3 text-right">
                            <span className="text-sm font-black text-blue-400 leading-none shrink-0 w-16 drop-shadow-[0_0_5px_rgba(59,130,246,0.5)]">{stat.format(stat.valA)}</span>
                            <div className="w-full h-3 bg-blue-950/30 rounded-full overflow-hidden border border-blue-500/20 flex justify-end shadow-[inset_0_0_10px_rgba(0,0,0,0.5)] relative">
                              {/* Highlight effect */}
                              <div className="absolute top-0 right-0 h-full w-4 bg-white/30 mix-blend-overlay skew-x-[-20deg] pointer-events-none z-10 blur-[1px]"></div>
                              <div 
                                className="h-full bg-gradient-to-l from-blue-400 to-blue-600 rounded-full transition-all duration-1000 ease-out shadow-[0_0_15px_rgba(59,130,246,0.5)] relative overflow-hidden"
                                style={{ width: `${pctA}%` }}
                              >
                                <div className="absolute inset-0 bg-[url('/noise.png')] opacity-30 mix-blend-overlay"></div>
                              </div>
                            </div>
                          </div>

                          {/* Center divider icon */}
                          <div className="text-muted-foreground/30 font-black text-[10px] w-[10%] flex justify-center items-center select-none tracking-widest italic">
                            <div className="w-1 h-1 bg-border/50 rounded-full mx-1"></div>
                            VS
                            <div className="w-1 h-1 bg-border/50 rounded-full mx-1"></div>
                          </div>

                          {/* Right bar (Player B - Red) */}
                          <div className="w-[45%] flex items-center justify-start gap-3 text-left">
                            <div className="w-full h-3 bg-rose-950/30 rounded-full overflow-hidden border border-rose-500/20 flex justify-start shadow-[inset_0_0_10px_rgba(0,0,0,0.5)] relative">
                              {/* Highlight effect */}
                              <div className="absolute top-0 left-0 h-full w-4 bg-white/30 mix-blend-overlay skew-x-[-20deg] pointer-events-none z-10 blur-[1px]"></div>
                              <div 
                                className="h-full bg-gradient-to-r from-rose-400 to-rose-600 rounded-full transition-all duration-1000 ease-out shadow-[0_0_15px_rgba(244,63,94,0.5)] relative overflow-hidden"
                                style={{ width: `${pctB}%` }}
                              >
                                <div className="absolute inset-0 bg-[url('/noise.png')] opacity-30 mix-blend-overlay"></div>
                              </div>
                            </div>
                            <span className="text-sm font-black text-rose-400 leading-none shrink-0 w-16 drop-shadow-[0_0_5px_rgba(244,63,94,0.5)]">{stat.format(stat.valB)}</span>
                          </div>
                        </div>

                        {/* Mobile Layout (Stacked vertical bars) */}
                        <div className="block sm:hidden space-y-3 font-mono text-xs w-full">
                          {/* Player A Bar */}
                          <div className="space-y-1">
                            <div className="flex justify-between items-center text-[10px]">
                              <span className="text-blue-400 font-bold uppercase truncate max-w-[120px]">{playerA.name}</span>
                              <strong className="text-blue-400 font-black drop-shadow-[0_0_5px_rgba(59,130,246,0.5)]">{stat.format(stat.valA)}</strong>
                            </div>
                            <div className="w-full h-3 bg-blue-950/30 rounded-full overflow-hidden border border-blue-500/20 flex justify-start relative">
                              <div 
                                className="h-full bg-gradient-to-r from-blue-600 to-blue-400 rounded-full transition-all duration-1000 shadow-[0_0_15px_rgba(59,130,246,0.5)]"
                                style={{ width: `${pctA}%` }}
                              />
                            </div>
                          </div>

                          {/* Player B Bar */}
                          <div className="space-y-1">
                            <div className="flex justify-between items-center text-[10px]">
                              <span className="text-rose-400 font-bold uppercase truncate max-w-[120px]">{playerB.name}</span>
                              <strong className="text-rose-400 font-black drop-shadow-[0_0_5px_rgba(244,63,94,0.5)]">{stat.format(stat.valB)}</strong>
                            </div>
                            <div className="w-full h-3 bg-rose-950/30 rounded-full overflow-hidden border border-rose-500/20 flex justify-start relative">
                              <div 
                                className="h-full bg-gradient-to-r from-rose-600 to-rose-400 rounded-full transition-all duration-1000 shadow-[0_0_15px_rgba(244,63,94,0.5)]"
                                style={{ width: `${pctB}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <p className="text-xs text-muted-foreground text-center italic">Registra estadísticas de juego en competencias activas para realizar comparativas.</p>
      )}
    </div>
  );
}
