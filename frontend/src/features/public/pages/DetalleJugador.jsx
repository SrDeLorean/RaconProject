import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '@/api/axios';
import Badge from '@/components/ui/Badge';
import Partidos from './Partidos';

export default function DetalleJugador() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('stats'); // 'stats' | 'competencias' | 'traspasos' | 'calendario' | 'historia'
  const [selectedOrg, setSelectedOrg] = useState('todas');
  const [selectedComp, setSelectedComp] = useState('todas');

  useEffect(() => {
    const fetchJugador = async () => {
      setLoading(true);
      try {
        const response = await api.get(`/usuarios/${id}`, {
          params: {
            organizacion_id: selectedOrg,
            competencia_id: selectedComp
          }
        });
        setData(response.data);
      } catch (error) {
        console.error("Error al obtener los detalles del jugador:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchJugador();
  }, [id, selectedOrg, selectedComp]);

  const getImageUrl = (path) => {
    if (!path) return null;
    if (path.startsWith('http')) return path;
    return `http://localhost:8000${path}`;
  };

  const getPosStyles = (pos) => {
    const pStr = (pos || '').toUpperCase();
    if (['POR', 'GK', 'PO', 'GOALKEEPER'].includes(pStr)) {
      return {
        glow: 'group-hover:shadow-[0_12px_30px_-10px_rgba(245,158,11,0.15)] group-hover:border-amber-500/40',
        avatarGlow: 'border-amber-500/30 shadow-[0_0_15px_rgba(245,158,11,0.2)]',
        bracketColor: 'border-amber-500/60',
        posColor: 'text-amber-500 bg-amber-500/10 border-amber-500/20',
        barColor: 'bg-amber-500',
        accentText: 'text-amber-400',
        textColor: 'text-amber-500',
        label: 'Portero'
      };
    }
    if (['DFC', 'CB', 'LB', 'RB', 'DF', 'DEF', 'LI', 'LD', 'DD', 'DI', 'DEFENDER'].includes(pStr)) {
      return {
        glow: 'group-hover:shadow-[0_12px_30px_-10px_rgba(59,130,246,0.15)] group-hover:border-blue-500/40',
        avatarGlow: 'border-blue-500/30 shadow-[0_0_15px_rgba(59,130,246,0.2)]',
        bracketColor: 'border-blue-500/60',
        posColor: 'text-blue-500 bg-blue-500/10 border-blue-500/20',
        barColor: 'bg-blue-500',
        accentText: 'text-blue-400',
        textColor: 'text-blue-500',
        label: 'Defensa'
      };
    }
    if (['MC', 'MCO', 'MCD', 'MD', 'MI', 'CM', 'CAM', 'CDM', 'LM', 'RM', 'MED', 'MCI', 'MCR', 'MDD', 'MDI', 'MOD', 'MOI', 'MIDFIELDER'].includes(pStr)) {
      return {
        glow: 'group-hover:shadow-[0_12px_30px_-10px_rgba(16,185,129,0.15)] group-hover:border-emerald-500/40',
        avatarGlow: 'border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.2)]',
        bracketColor: 'border-emerald-500/60',
        posColor: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20',
        barColor: 'bg-emerald-500',
        accentText: 'text-emerald-400',
        textColor: 'text-emerald-500',
        label: 'Mediocentro'
      };
    }
    return {
      glow: 'group-hover:shadow-[0_12px_30px_-10px_rgba(239,68,68,0.15)] group-hover:border-primary/40',
      avatarGlow: 'border-primary/30 shadow-[0_0_15px_rgba(239,68,68,0.2)]',
      bracketColor: 'border-primary/60',
      posColor: 'text-primary bg-primary/10 border-primary/20',
      barColor: 'bg-primary',
      accentText: 'text-primary',
      textColor: 'text-primary',
      label: 'Delantero'
    };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background pt-28 pb-16">
        <div className="max-w-5xl mx-auto px-6 lg:px-10 space-y-8">
          <div className="skeleton-shimmer h-60 rounded-2xl"></div>
          <div className="skeleton-shimmer h-14 rounded-2xl max-w-3xl mx-auto"></div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="skeleton-shimmer h-52 rounded-xl"></div>
            <div className="lg:col-span-2 skeleton-shimmer h-80 rounded-xl"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4 text-center">
        <span className="text-4xl">👤</span>
        <h2 className="text-xl font-display font-black text-foreground uppercase">Competidor No Encontrado</h2>
        <Link to="/jugadores" className="text-xs text-primary font-bold uppercase hover:underline">Volver al Directorio</Link>
      </div>
    );
  }

  const { user, contrato_activo, traspasos, estadisticas, competencias = [], historial_torneos = [], comparativas = {}, filtros_disponibles = {} } = data;
  const rawPos = user.posicion || contrato_activo?.posicion_bloque || 'MC';
  const posStyles = getPosStyles(rawPos);

  const {
    posicion_grupo: posGroup = 'MED',
    rank_global = null,
    total_global = 0,
    rank_liga = null,
    total_liga = 0,
    promedio_posicion = {},
    lider_posicion = {}
  } = comparativas || {};

  const getComparativaStats = () => {
    const partidos = estadisticas.partidos_jugados || 0;
    const getAvg = (total) => partidos > 0 ? (total / partidos) : 0;
    
    const statsList = [
      {
        label: 'Valoración Promedio',
        player: Number(estadisticas.promedio_valoracion || 0),
        avg: Number(promedio_posicion.avg_valoracion || 0),
        leader: Number(lider_posicion?.avg_valoracion || 0),
        max: 10,
        format: (val) => val.toFixed(2),
      },
      {
        label: 'Goles por Partido',
        player: getAvg(estadisticas.total_goles || 0),
        avg: Number(promedio_posicion.avg_goles || 0),
        leader: Number(lider_posicion?.avg_goles || 0),
        max: 3,
        format: (val) => val.toFixed(2),
      },
      {
        label: 'Asistencias por Partido',
        player: getAvg(estadisticas.total_asistencias || 0),
        avg: Number(promedio_posicion.avg_asistencias || 0),
        leader: Number(lider_posicion?.avg_asistencias || 0),
        max: 3,
        format: (val) => val.toFixed(2),
      }
    ];

    const pos = rawPos.toUpperCase();

    if (['POR', 'GK', 'PO', 'GOALKEEPER'].includes(pos)) {
      statsList.push(
        {
          label: 'Atajadas por Partido',
          player: getAvg(estadisticas.total_atajadas || 0),
          avg: Number(promedio_posicion.avg_atajadas || 0),
          leader: Number(lider_posicion?.avg_atajadas || 0),
          max: 8,
          format: (val) => val.toFixed(2),
        },
        {
          label: 'Goles Recibidos por Partido',
          player: getAvg(estadisticas.total_goles_recibidos || 0),
          avg: Number(promedio_posicion.avg_goles_recibidos || 0),
          leader: Number(lider_posicion?.avg_goles_recibidos || 0),
          max: 5,
          format: (val) => val.toFixed(2),
          invertColor: true,
        }
      );
    } else if (['DFC', 'DFI', 'DFD', 'CB', 'LB', 'RB', 'DF', 'DEF', 'LD', 'LI', 'DD', 'DI', 'DEFENDER'].includes(pos)) {
      statsList.push(
        {
          label: 'Entradas por Partido',
          player: getAvg(estadisticas.total_entradas || 0),
          avg: Number(promedio_posicion.avg_entradas || 0),
          leader: Number(lider_posicion?.avg_entradas || 0),
          max: 8,
          format: (val) => val.toFixed(2),
        },
        {
          label: 'Éxito de Entradas (%)',
          player: Number(estadisticas.avg_exito_entradas || 0),
          avg: Number(promedio_posicion.avg_exito_entradas || 0),
          leader: Number(lider_posicion?.avg_exito_entradas || 0),
          max: 100,
          format: (val) => `${Math.round(val)}%`,
        }
      );
    } else {
      statsList.push(
        {
          label: 'Precisión de Pases (%)',
          player: Number(estadisticas.avg_precision_pases || 0),
          avg: Number(promedio_posicion.avg_precision_pases || 0),
          leader: Number(lider_posicion?.avg_precision_pases || 0),
          max: 100,
          format: (val) => `${Math.round(val)}%`,
        },
        {
          label: 'Precisión de Tiros (%)',
          player: Number(estadisticas.avg_precision_tiro || 0),
          avg: Number(promedio_posicion.avg_precision_tiro || 0),
          leader: Number(lider_posicion?.avg_precision_tiro || 0),
          max: 100,
          format: (val) => `${Math.round(val)}%`,
        }
      );
    }

    return statsList;
  };

  return (
    <div className="relative min-h-screen bg-background pt-28 pb-16 overflow-hidden">
      {/* Fondo Inmersivo HUD */}
      <div 
        className="absolute inset-0 bg-cover bg-center z-0"
        style={{ backgroundImage: "url('https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=1920&auto=format&fit=crop')" }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-background via-background/85 to-background z-10"></div>
      </div>
      
      {/* Resplandores ambientales según posición */}
      <div className={`absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[350px] md:w-[600px] h-[350px] md:h-[600px] opacity-[0.04] blur-[130px] rounded-full pointer-events-none z-10 bg-current ${posStyles.textColor}`}></div>

      <div className="relative z-20 max-w-5xl mx-auto px-6 lg:px-10 space-y-8 animate-fade-in-up">
        
        {/* Ficha Principal del Jugador */}
        <div className="group relative border border-border/40 bg-card/15 backdrop-blur-md rounded-2xl p-6 md:p-8 flex flex-col md:flex-row items-center md:items-start gap-8 shadow-2xl transition-all duration-300 hover:border-primary/25">
          {/* Brackets decorativos HUD */}
          <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-transparent transition-colors duration-300 group-hover:border-primary/45 rounded-tl-md pointer-events-none"></div>
          <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-transparent transition-colors duration-300 group-hover:border-primary/45 rounded-tr-md pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-transparent transition-colors duration-300 group-hover:border-primary/45 rounded-bl-md pointer-events-none"></div>
          <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-transparent transition-colors duration-300 group-hover:border-primary/45 rounded-br-md pointer-events-none"></div>

          {/* Avatar del Jugador */}
          <div className="relative shrink-0">
            <div className={`w-32 h-32 md:w-40 md:h-40 rounded-2xl overflow-hidden border bg-card/30 flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-[1.02] relative ${posStyles.avatarGlow}`}>
              {user.foto ? (
                <img 
                  src={getImageUrl(user.foto)} 
                  alt={user.name} 
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-tr from-card/30 to-background/50 flex items-center justify-center font-display font-black text-primary text-4xl uppercase">
                  {user.name?.charAt(0)}
                </div>
              )}
            </div>

            {contrato_activo?.dorsal && (
              <span className="absolute -bottom-2 -right-2 bg-primary text-primary-foreground text-xs font-mono font-black w-9 h-9 rounded-xl flex items-center justify-center border-2 border-background shadow-xl">
                N°{contrato_activo.dorsal}
              </span>
            )}
          </div>

          {/* Información e Identidades */}
          <div className="flex-1 text-center md:text-left space-y-4 min-w-0 w-full">
            <div className="space-y-1">
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
                <Badge variant="primary" className={`text-[10px] font-mono px-3 py-0.5 rounded font-black tracking-wider uppercase border ${posStyles.posColor}`}>
                  {posStyles.label}
                </Badge>
                <Badge variant="muted" className="text-[10px] font-mono px-2.5 py-0.5 rounded font-black tracking-wider uppercase border border-border/40 text-muted-foreground bg-background/55">
                  {user.plataforma || 'CROSSPLAY'}
                </Badge>
              </div>
              
              <h1 className="text-3xl md:text-4.5xl font-display font-extrabold uppercase tracking-tight text-foreground text-glow-primary mt-1 truncate">
                {user.name}
              </h1>
              
              <span className="text-xs text-primary/95 font-mono block">
                🎮 EA ID: <span className="text-foreground font-semibold">{user.gamertag || 'N/A'}</span>
              </span>
            </div>

            {/* Redes Sociales del Jugador */}
            {user.redes_sociales && Object.values(user.redes_sociales).some(Boolean) && (
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 pt-1">
                {Object.entries(user.redes_sociales).map(([red, url]) => {
                  if (!url) return null;
                  return (
                    <a 
                      key={red} 
                      href={url} 
                      target="_blank" 
                      rel="noreferrer" 
                      className="text-[9px] bg-background/65 border border-border/30 px-3 py-1.5 rounded-lg font-mono font-bold uppercase hover:bg-primary/10 hover:text-primary hover:border-primary/45 hover:shadow-[0_0_12px_hsla(var(--primary),0.1)] transition-all duration-300"
                    >
                      🔗 {red}
                    </a>
                  );
                })}
              </div>
            )}

            <div className="h-px bg-border/20"></div>

            {/* Ficha Física y Detalles */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-left">
              {[
                { label: 'Demarcación', value: user.posicion || contrato_activo?.posicion_bloque || 'MC' },
                { label: 'Nacionalidad', value: user.nacionalidad || 'Chilena' },
                { label: 'Estatura', value: user.altura ? `${user.altura} cm` : '—' },
                { label: 'Peso', value: user.peso ? `${user.peso} kg` : '—' },
              ].map((item, idx) => (
                <div key={idx} className="relative bg-background/35 border border-border/30 rounded-xl p-2.5 sm:p-3.5 space-y-0.5 group/spec transition-colors hover:border-primary/15">
                  <div className="absolute top-0 right-0 w-5 h-5 bg-foreground/[0.005] pointer-events-none"></div>
                  <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest block font-mono">{item.label}</span>
                  <strong className="text-sm font-black text-foreground uppercase block font-mono tracking-wide">{item.value}</strong>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Selector de Secciones (Tabs) */}
        <div className="flex border border-border/40 p-1 bg-card/25 backdrop-blur-md rounded-2xl max-w-3xl mx-auto shadow-xl overflow-x-auto gap-1">
          {[
            { id: 'stats', label: '📊 Rendimiento' },
            { id: 'competencias', label: '🏆 Torneos y Club' },
            { id: 'traspasos', label: '🔄 Traspasos' },
            { id: 'calendario', label: '📅 Calendario' },
            { id: 'historia', label: '📜 Historial' }
          ].map((tab) => (
            <button 
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 min-w-[120px] py-3 px-4 text-xs font-condensed tracking-widest font-black uppercase rounded-xl transition-all duration-300 cursor-pointer whitespace-nowrap ${
                activeTab === tab.id 
                  ? 'bg-primary text-primary-foreground shadow-[0_0_15px_hsla(var(--primary),0.3)]' 
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/30'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Contenido Condicional por Secciones */}
        {activeTab === 'stats' && (
          <div className="space-y-6 animate-fade-in">
            
            {/* Filtros de Telemetría Táctica */}
            <div className="border border-border/40 bg-card/15 backdrop-blur-md rounded-2xl p-5 shadow-xl flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="text-left space-y-1 shrink-0 w-full md:w-auto">
                <span className="text-[9px] font-mono font-black text-muted-foreground uppercase tracking-widest block">FILTROS DE TELEMETRÍA TÁCTICA</span>
                <h4 className="text-sm font-display font-black text-foreground uppercase tracking-wide">Ámbito de Rendimiento</h4>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full md:max-w-xl">
                {/* Selector de Organización */}
                <div className="relative">
                  <select
                    value={selectedOrg}
                    onChange={(e) => {
                      setSelectedOrg(e.target.value);
                      setSelectedComp('todas');
                    }}
                    className="w-full bg-background/55 border border-border/45 px-3 py-2 rounded-xl text-xs font-mono font-bold text-foreground focus:outline-none focus:border-primary/55 cursor-pointer uppercase select-none"
                  >
                    <option value="todas">🌍 Todas las Ligas</option>
                    {filtros_disponibles.organizaciones?.map((org) => (
                      <option key={org.id} value={org.id}>
                        🏆 {org.nombre}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Selector de Competencia */}
                <div className="relative">
                  <select
                    value={selectedComp}
                    onChange={(e) => setSelectedComp(e.target.value)}
                    className="w-full bg-background/55 border border-border/45 px-3 py-2 rounded-xl text-xs font-mono font-bold text-foreground focus:outline-none focus:border-primary/55 cursor-pointer uppercase select-none"
                  >
                    <option value="todas">⚔️ Todas las Competencias</option>
                    {filtros_disponibles.competencias
                      ?.filter((comp) => selectedOrg === 'todas' || String(comp.organizacion_id) === String(selectedOrg))
                      .map((comp) => (
                        <option key={comp.id} value={comp.id}>
                          🎮 {comp.nombre}
                        </option>
                      ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Grid principal de Stats */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Club Actual e Info Rápida */}
              <div className="lg:col-span-1 space-y-6 order-2 lg:order-1">
                <div className="border border-border/50 bg-card/20 backdrop-blur-sm rounded-2xl p-5 space-y-4 shadow-md relative overflow-hidden">
                  <h3 className="text-xs font-black tracking-widest text-muted-foreground uppercase font-mono border-b border-border/20 pb-2">
                    🛡️ VINCULACIÓN ACTUAL
                  </h3>
                  {contrato_activo ? (
                    <div className="flex flex-col gap-4">
                      <div className="flex items-center gap-3">
                        {contrato_activo.equipo_logo ? (
                          <img 
                            src={getImageUrl(contrato_activo.equipo_logo)} 
                            alt={contrato_activo.equipo_nombre} 
                            className="w-14 h-14 rounded-xl object-cover border border-border/40 shrink-0 shadow" 
                          />
                        ) : (
                          <div className="w-14 h-14 rounded-xl bg-primary/15 border border-primary/30 flex items-center justify-center font-display font-black text-primary text-xl uppercase shrink-0">
                            {contrato_activo.equipo_nombre?.charAt(0)}
                          </div>
                        )}
                        <div className="min-w-0">
                          <Link to={`/equipos/${contrato_activo.equipo_id}`} className="font-display font-black text-lg text-foreground hover:text-primary uppercase tracking-wide transition-colors truncate block">
                            {contrato_activo.equipo_nombre}
                          </Link>
                          <span className="text-[10px] text-muted-foreground block font-bold uppercase mt-0.5 truncate">
                            🏆 LIGA: {contrato_activo.organizacion_nombre}
                          </span>
                        </div>
                      </div>
                      <div className="w-full text-center bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-black font-mono py-2.5 rounded-xl shadow-inner">
                        🛡️ CONTRATO VIGENTE
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-4">
                      <div className="flex items-center gap-3">
                        <div className="w-14 h-14 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-500 text-2xl shrink-0 shadow">
                          🤝
                        </div>
                        <div className="min-w-0">
                          <strong className="font-display font-black text-lg text-amber-500 uppercase tracking-wide block truncate">
                            Agente Libre
                          </strong>
                          <span className="text-[10px] text-muted-foreground block font-bold uppercase mt-0.5 truncate">
                            Sin club asignado
                          </span>
                        </div>
                      </div>
                      <div className="w-full text-center bg-amber-500/10 text-amber-400 border border-amber-500/20 text-xs font-black font-mono py-2.5 rounded-xl animate-pulse">
                        ⚡ DISPONIBLE PARA FICHAJE
                      </div>
                    </div>
                  )}
                </div>

                {/* Carta OVR de Atributos */}
                <div className="border border-border/50 bg-card/20 backdrop-blur-sm rounded-2xl p-6 shadow-md relative overflow-hidden flex flex-col items-center justify-center text-center space-y-4">
                  <div className="absolute top-0 left-0 w-2.5 h-2.5 border-t-2 border-l-2 border-border/30 pointer-events-none"></div>
                  <div className="absolute bottom-0 right-0 w-2.5 h-2.5 border-b-2 border-r-2 border-border/30 pointer-events-none"></div>
                  
                  <span className="text-[9px] font-mono font-black text-muted-foreground uppercase tracking-widest border-b border-border/20 pb-1.5 w-full">TELEMETRÍA TÁCTICA</span>
                  
                  {/* HUD OVR Badge */}
                  <div className="relative flex items-center justify-center mt-2">
                    <div className={`w-28 h-28 rounded-full border-4 flex flex-col items-center justify-center bg-background/45 ${posStyles.avatarGlow}`}>
                      <span className="text-xs font-mono font-bold text-muted-foreground leading-none">OVR</span>
                      <strong className="text-4xl font-display font-extrabold text-foreground leading-tight mt-0.5">
                        {estadisticas.promedio_valoracion ? Number(estadisticas.promedio_valoracion).toFixed(1) : '—'}
                      </strong>
                    </div>
                    {/* Decorative glowing dots */}
                    <div className={`absolute w-2 h-2 rounded-full -top-1 left-1/2 -translate-x-1/2 animate-ping bg-current ${posStyles.textColor}`}></div>
                  </div>

                  <div className="space-y-1">
                    <strong className="text-sm font-black text-foreground uppercase block font-mono">
                      Valoración General
                    </strong>
                    <span className="text-[10px] text-muted-foreground font-medium block">
                      Calculado en {estadisticas.partidos_jugados || 0} partidos oficiales
                    </span>
                  </div>

                  <div className="w-full grid grid-cols-2 gap-2 pt-2 border-t border-border/20 text-center font-mono">
                    <div className="bg-background/25 border border-border/20 rounded-xl p-2">
                      <span className="text-[8px] font-bold text-muted-foreground uppercase tracking-wider block">Goles</span>
                      <strong className="text-sm font-black text-emerald-400">{estadisticas.total_goles || 0}</strong>
                    </div>
                    <div className="bg-background/25 border border-border/20 rounded-xl p-2">
                      <span className="text-[8px] font-bold text-muted-foreground uppercase tracking-wider block">MVPs</span>
                      <strong className="text-sm font-black text-amber-500">{estadisticas.total_mvp || 0} ⭐</strong>
                    </div>
                  </div>
                </div>
              </div>

              {/* Estadísticas Detalladas */}
              <div className="lg:col-span-2 space-y-6 order-1 lg:order-2">
                
                {/* Rankings Tácticos HUD */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Card Global */}
                  <div className="relative border border-border/40 bg-card/10 backdrop-blur-md rounded-2xl p-4 sm:p-5 flex items-center justify-between overflow-hidden shadow-lg group/rank">
                    <div className="absolute top-0 right-0 w-24 h-full bg-gradient-to-l from-primary/5 to-transparent pointer-events-none"></div>
                    <div className="space-y-1 text-left">
                      <span className="text-[9px] font-mono font-black text-muted-foreground uppercase tracking-widest block">RANGO GLOBAL POR POSICIÓN</span>
                      <h4 className="text-xs font-display font-black text-foreground uppercase tracking-wide">Clasificación Mundial</h4>
                      <p className="text-[10px] text-muted-foreground font-mono mt-1 font-bold">
                        Categoría: <span className={posStyles.accentText}>{posGroup}</span>
                      </p>
                    </div>
                    <div className="text-right flex flex-col items-end shrink-0">
                      {rank_global ? (
                        <>
                          <span className="text-3xl font-display font-extrabold text-foreground tracking-tighter">
                            #{rank_global}
                          </span>
                          <span className="text-[9px] text-muted-foreground font-mono font-black uppercase mt-0.5">
                            de {total_global} jugadores
                          </span>
                          <span className="text-[8px] bg-primary/15 text-primary border border-primary/25 rounded px-1.5 py-0.5 font-mono font-bold mt-2 uppercase tracking-wide">
                            Top {Math.max(1, Math.round((rank_global / total_global) * 100))}%
                          </span>
                        </>
                      ) : (
                        <>
                          <span className="text-3xl font-display font-extrabold text-muted-foreground/60 tracking-tighter">
                            #—
                          </span>
                          <span className="text-[9px] text-muted-foreground font-mono font-black uppercase mt-0.5">
                            Sin partidos
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Card Liga */}
                  <div className="relative border border-border/40 bg-card/10 backdrop-blur-md rounded-2xl p-4 sm:p-5 flex items-center justify-between overflow-hidden shadow-lg group/rank">
                    <div className="absolute top-0 right-0 w-24 h-full bg-gradient-to-l from-emerald-500/5 to-transparent pointer-events-none"></div>
                    <div className="space-y-1 text-left">
                      <span className="text-[9px] font-mono font-black text-muted-foreground uppercase tracking-widest block">RANGO CIRCUITO ACTIVO</span>
                      <h4 className="text-xs font-display font-black text-foreground uppercase tracking-wide">Clasificación en Liga</h4>
                      <p className="text-[10px] text-muted-foreground font-mono mt-1 font-bold truncate max-w-[150px]">
                        Liga: <span className="text-foreground">{contrato_activo?.organizacion_nombre || 'Ninguna'}</span>
                      </p>
                    </div>
                    <div className="text-right flex flex-col items-end shrink-0">
                      {rank_liga ? (
                        <>
                          <span className="text-3xl font-display font-extrabold text-foreground tracking-tighter">
                            #{rank_liga}
                          </span>
                          <span className="text-[9px] text-muted-foreground font-mono font-black uppercase mt-0.5">
                            de {total_liga} en liga
                          </span>
                          <span className="text-[8px] bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 rounded px-1.5 py-0.5 font-mono font-bold mt-2 uppercase tracking-wide">
                            Top {Math.max(1, Math.round((rank_liga / total_liga) * 100))}%
                          </span>
                        </>
                      ) : (
                        <>
                          <span className="text-3xl font-display font-extrabold text-muted-foreground/60 tracking-tighter">
                            #—
                          </span>
                          <span className="text-[9px] text-muted-foreground font-mono font-black uppercase mt-0.5">
                            {contrato_activo ? 'Sin estadísticas' : 'Agente Libre'}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Líder de la Posición */}
                {lider_posicion && lider_posicion.name && (
                  <div className="relative border border-amber-500/30 bg-amber-500/[0.02] backdrop-blur-md rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4 overflow-hidden shadow-lg group/leader">
                    {/* Left elements: Info */}
                    <div className="flex items-center gap-4 text-center sm:text-left">
                      {/* Leader Avatar */}
                      <div className="w-12 h-12 rounded-xl border border-amber-500/30 overflow-hidden bg-background/45 flex items-center justify-center shrink-0 shadow-md">
                        {lider_posicion.foto ? (
                          <img 
                            src={getImageUrl(lider_posicion.foto)} 
                            alt={lider_posicion.name} 
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-amber-500 text-lg font-black">{lider_posicion.name.charAt(0)}</span>
                        )}
                      </div>
                      <div className="space-y-0.5 text-left">
                        <span className="text-[8px] font-mono font-black text-amber-500 uppercase tracking-widest flex items-center justify-start gap-1">
                          ⭐ LÍDER DE LA POSICIÓN ({posGroup})
                        </span>
                        <h4 className="text-sm font-display font-black text-foreground uppercase tracking-wide">
                          {lider_posicion.name}
                        </h4>
                        <p className="text-[10px] text-muted-foreground font-mono">
                          Mejor valoración en la base de datos de competidores.
                        </p>
                      </div>
                    </div>

                    {/* Right: Rating */}
                    <div className="flex items-center gap-3 shrink-0 w-full sm:w-auto">
                      <div className="bg-amber-500/10 border border-amber-500/25 rounded-xl px-4 py-2 text-center w-full sm:w-auto">
                        <span className="text-[8px] font-bold text-amber-500 uppercase tracking-wider block font-mono">Valoración</span>
                        <strong className="text-base font-display font-black text-amber-400">{lider_posicion.avg_valoracion}</strong>
                      </div>
                    </div>
                  </div>
                )}

                {/* Estadísticas Generales (Totals) */}
                <div className="border border-border/50 bg-card/20 backdrop-blur-sm rounded-2xl p-5 space-y-4 shadow-md relative overflow-hidden">
                  <h3 className="text-xs font-black tracking-widest text-muted-foreground uppercase font-mono border-b border-border/20 pb-2 flex items-center justify-between">
                    <span>📊 ESTADÍSTICAS GENERALES DE CAMPAÑA (TOTALES)</span>
                    <span className={`text-[9px] font-mono font-bold ${posStyles.accentText}`}>{posStyles.label.toUpperCase()}</span>
                  </h3>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                    {(() => {
                      const baseStats = [
                        { label: 'Partidos Disputados', value: estadisticas.partidos_jugados || 0, max: 40 },
                        { label: 'Goles Marcados', value: estadisticas.total_goles || 0, max: 20 },
                        { label: 'Asistencias Entregadas', value: estadisticas.total_asistencias || 0, max: 20 },
                        { label: 'Valoración Promedio', value: Number(estadisticas.promedio_valoracion || 0).toFixed(2), max: 10 },
                        { label: 'Jugador del Partido (MVP)', value: estadisticas.total_mvp || 0, max: 10 },
                      ];

                      const pos = rawPos.toUpperCase();

                      if (pos === 'POR' || pos === 'GK' || pos === 'PO' || pos === 'GOALKEEPER') {
                        baseStats.push(
                          { label: 'Atajadas Totales', value: estadisticas.total_atajadas || 0, max: 80 },
                          { label: 'Goles Recibidos', value: estadisticas.total_goles_recibidos || 0, max: 40, alert: true }
                        );
                      } else if (['DFC', 'DFI', 'DFD', 'CB', 'LB', 'RB', 'DF', 'DEF', 'LD', 'LI', 'DD', 'DI', 'DEFENDER'].includes(pos)) {
                        baseStats.push(
                          { label: 'Entradas Exitosas', value: estadisticas.total_entradas || 0, max: 100 },
                          { label: 'Éxito de Entradas (%)', value: Math.round(estadisticas.avg_exito_entradas || 0), max: 100 }
                        );
                      } else {
                        baseStats.push(
                          { label: 'Precisión de Pases (%)', value: Math.round(estadisticas.avg_precision_pases || 0), max: 100 },
                          { label: 'Precisión de Tiros (%)', value: Math.round(estadisticas.avg_precision_tiro || 0), max: 100 }
                        );
                      }

                      baseStats.push({ label: 'Expulsiones (T. Rojas)', value: estadisticas.total_rojas || 0, max: 4, alert: true });

                      return baseStats.map((stat, idx) => (
                        <div key={idx} className="space-y-1.5 bg-background/20 border border-border/20 rounded-xl p-3.5 relative overflow-hidden">
                          <div className="absolute top-0 right-0 w-4 h-4 bg-foreground/[0.005] pointer-events-none"></div>
                          <div className="flex justify-between items-end text-xs font-semibold font-mono z-10 relative">
                            <span className="text-muted-foreground uppercase tracking-tight text-[10px]">{stat.label}</span>
                            <strong className={`text-xs font-black ${stat.alert ? 'text-rose-500' : posStyles.accentText}`}>
                              {stat.value}
                            </strong>
                          </div>
                          <div className="h-2 bg-muted/40 rounded-lg overflow-hidden border border-border/10">
                            <div 
                              className={`h-full rounded-lg animate-fill-bar ${
                                stat.alert ? 'bg-rose-500' : posStyles.barColor
                              }`}
                              style={{ width: `${Math.min((stat.value / stat.max) * 100, 100)}%`, animationDelay: `${idx * 0.08}s` }}
                            ></div>
                          </div>
                        </div>
                      ));
                    })()}
                  </div>
                </div>

                {/* Comparativa Táctica (Visual Analytics / Triple Bars) */}
                <div className="border border-border/50 bg-card/20 backdrop-blur-sm rounded-2xl p-5 space-y-4 shadow-md relative overflow-hidden">
                  <h3 className="text-xs font-black tracking-widest text-muted-foreground uppercase font-mono border-b border-border/20 pb-2 flex items-center justify-between">
                    <span>📊 COMPARATIVA TÁCTICA CON EL SERVIDOR</span>
                    <span className="text-[9px] font-mono font-bold text-amber-500">ANALYTICS HUD</span>
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                    {getComparativaStats().map((stat, idx) => {
                      const playerPercent = Math.min((stat.player / stat.max) * 100, 100);
                      const avgPercent = Math.min((stat.avg / stat.max) * 100, 100);
                      const leaderPercent = Math.min((stat.leader / stat.max) * 100, 100);

                      return (
                        <div key={idx} className="space-y-3 bg-background/25 border border-border/20 rounded-xl p-3.5 relative overflow-hidden flex flex-col justify-between">
                          <div>
                            <span className="text-xs font-bold text-foreground uppercase tracking-wide font-mono block">
                              {stat.label}
                            </span>

                            <div className="grid grid-cols-3 gap-1 font-mono text-[9px] bg-background/45 p-1.5 rounded-lg border border-border/10 mt-2">
                              <div className="text-center border-r border-border/10">
                                <span className="text-muted-foreground font-bold uppercase block text-[7px]">Tú</span>
                                <strong className={`text-xs font-black ${stat.invertColor ? 'text-rose-400' : posStyles.accentText}`}>
                                  {stat.format(stat.player)}
                                </strong>
                              </div>
                              <div className="text-center border-r border-border/10">
                                <span className="text-muted-foreground font-bold uppercase block text-[7px]">Media</span>
                                <strong className="text-xs font-black text-muted-foreground">
                                  {stat.format(stat.avg)}
                                </strong>
                              </div>
                              <div className="text-center">
                                <span className="text-muted-foreground font-bold uppercase block text-[7px]">Líder</span>
                                <strong className="text-xs font-black text-amber-400">
                                  {stat.format(stat.leader)}
                                </strong>
                              </div>
                            </div>
                          </div>

                          <div className="space-y-1.5 pt-2">
                            {/* Tú bar */}
                            <div className="space-y-0.5">
                              <div className="flex justify-between items-center text-[7px] text-muted-foreground uppercase font-mono">
                                <span>Tú</span>
                              </div>
                              <div className="h-1.5 bg-muted/40 rounded-full overflow-hidden border border-border/10">
                                <div 
                                  className={`h-full rounded-full animate-fill-bar ${stat.invertColor ? 'bg-rose-500' : posStyles.barColor}`}
                                  style={{ width: `${playerPercent}%`, animationDelay: `${idx * 0.05}s` }}
                                ></div>
                              </div>
                            </div>

                            {/* Media bar */}
                            <div className="space-y-0.5">
                              <div className="flex justify-between items-center text-[7px] text-muted-foreground uppercase font-mono">
                                <span>Media del Servidor</span>
                              </div>
                              <div className="h-1.5 bg-muted/40 rounded-full overflow-hidden border border-border/10">
                                <div 
                                  className="h-full bg-muted-foreground/30 rounded-full animate-fill-bar"
                                  style={{ width: `${avgPercent}%`, animationDelay: `${idx * 0.05 + 0.03}s` }}
                                ></div>
                              </div>
                            </div>

                            {/* Líder bar */}
                            <div className="space-y-0.5">
                              <div className="flex justify-between items-center text-[7px] text-muted-foreground uppercase font-mono">
                                <span>Líder Posicional</span>
                              </div>
                              <div className="h-1.5 bg-muted/40 rounded-full overflow-hidden border border-border/10">
                                <div 
                                  className="h-full bg-amber-400 rounded-full animate-fill-bar"
                                  style={{ width: `${leaderPercent}%`, animationDelay: `${idx * 0.05 + 0.06}s` }}
                                ></div>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

              </div>
            </div>

          </div>
        )}

        {activeTab === 'competencias' && (
          <div className="border border-border/50 bg-card/20 backdrop-blur-sm rounded-2xl p-5 space-y-4 shadow-md animate-fade-in">
            <h3 className="text-xs font-black tracking-widest text-muted-foreground uppercase font-mono border-b border-border/20 pb-2">
              🏆 TORNEOS ACTIVOS DEL CLUB
            </h3>
            {competencias && competencias.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-2">
                {competencias.map((comp) => (
                  <div key={comp.id} className="flex items-center gap-3.5 p-4 rounded-xl border border-border/30 bg-background/25 transition-all duration-300 hover:border-primary/20 hover:bg-background/45 relative group">
                    <div className="absolute top-0 right-0 w-16 h-full bg-gradient-to-l from-primary/5 to-transparent pointer-events-none"></div>
                    {comp.logo ? (
                      <img 
                        src={getImageUrl(comp.logo)} 
                        alt={comp.nombre} 
                        className="w-12 h-12 object-cover rounded-lg border border-border/40 shrink-0 shadow" 
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary text-sm font-bold shrink-0">
                        🏆
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <Link to={`/organizaciones/${comp.id}`} className="font-display font-black text-sm text-foreground uppercase tracking-wide hover:text-primary transition-colors block truncate">
                        {comp.nombre}
                      </Link>
                      <span className="text-[10px] text-muted-foreground uppercase font-mono mt-1 block truncate">
                        {comp.organizacion_nombre} • {comp.formato} ({comp.plataforma})
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground font-medium bg-muted/20 p-4 rounded-xl text-center italic border border-border/30">El club de este jugador no se encuentra inscrito en competencias activas.</p>
            )}
          </div>
        )}

        {activeTab === 'traspasos' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-in">
            {/* Expediente del Competidor (User details) */}
            <div className="lg:col-span-1 space-y-6">
              <div className="border border-border/50 bg-card/20 backdrop-blur-sm rounded-2xl p-5 space-y-5 shadow-md relative overflow-hidden">
                {/* Corners visual decoration */}
                <div className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-primary/45 rounded-tl-sm pointer-events-none"></div>
                <div className="absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 border-primary/45 rounded-br-sm pointer-events-none"></div>
                
                <h3 className="text-xs font-black tracking-widest text-muted-foreground uppercase font-mono border-b border-border/20 pb-2">
                  👤 EXPEDIENTE DEL COMPETIDOR
                </h3>
                
                <div className="space-y-4">
                  {/* Account status badge */}
                  <div className="flex justify-between items-center bg-background/25 border border-border/20 p-2.5 rounded-xl">
                    <span className="text-[10px] font-mono font-bold text-muted-foreground uppercase">Estado del Perfil</span>
                    <span className={`text-[10px] font-mono font-black uppercase px-2 py-0.5 rounded border ${
                      user.status === 'activo'
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        : user.status === 'suspendido'
                        ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                        : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                    }`}>
                      {user.status || 'Activo'}
                    </span>
                  </div>

                  {/* Gamer credentials */}
                  <div className="space-y-2.5 bg-background/25 border border-border/20 p-3.5 rounded-xl font-mono text-[11px] leading-relaxed">
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground font-bold uppercase">Gamertag</span>
                      <strong className="text-foreground font-extrabold">{user.gamertag || 'N/A'}</strong>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground font-bold uppercase">ID EA</span>
                      <strong className="text-primary font-black">{user.id_ea || 'N/A'}</strong>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground font-bold uppercase">Plataforma</span>
                      <strong className="text-foreground font-extrabold uppercase">{user.plataforma || 'Crossplay'}</strong>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground font-bold uppercase">Contacto</span>
                      <strong className="text-foreground font-extrabold truncate max-w-[120px]">{user.email || 'N/A'}</strong>
                    </div>
                    {user.fecha_nacimiento && (
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground font-bold uppercase">Nacimiento</span>
                        <strong className="text-foreground font-extrabold">{new Date(user.fecha_nacimiento).toLocaleDateString()}</strong>
                      </div>
                    )}
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground font-bold uppercase">Registro</span>
                      <strong className="text-foreground font-extrabold">
                        {user.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
                      </strong>
                    </div>
                  </div>

                  {/* Biography section */}
                  <div className="space-y-1.5 bg-background/25 border border-border/20 p-3.5 rounded-xl text-left">
                    <span className="text-[9px] font-mono font-bold text-muted-foreground uppercase tracking-wider block">BIOGRAFÍA TÁCTICA</span>
                    <p className="text-xs text-foreground/80 leading-relaxed font-sans font-light italic">
                      "{user.biografia || 'Sin biografía táctica declarada en el perfil del competidor.'}"
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Traspasos timeline */}
            <div className="lg:col-span-2">
              <div className="border border-border/50 bg-card/20 backdrop-blur-sm rounded-2xl p-5 space-y-4 shadow-md relative overflow-hidden">
                {/* Scanlines visual effect */}
                <div className="absolute inset-0 broadcast-scanlines pointer-events-none opacity-[0.03]"></div>
                
                <h3 className="text-xs font-black tracking-widest text-muted-foreground uppercase font-mono border-b border-border/20 pb-2">
                  🔄 CRONOLOGÍA DE FICHAJES Y TRANSFERENCIAS
                </h3>
                {traspasos && traspasos.length > 0 ? (
                  <div className="relative border-l border-border/40 ml-4 pl-6 space-y-6 pt-2">
                    {traspasos.map((t) => (
                      <div key={t.id} className="relative">
                        {/* Database dot connection */}
                        <span className={`absolute -left-[31px] top-1.5 w-4 h-4 rounded-full border-2 border-background shadow-lg bg-current ${posStyles.textColor}`}></span>
                        
                        <div className="space-y-2 bg-background/25 border border-border/30 p-4 rounded-xl transition-all hover:border-primary/20 hover:bg-background/40">
                          <div className="flex items-center justify-between flex-wrap gap-2">
                            <span className="text-[8px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-black px-2 py-0.5 rounded font-mono uppercase tracking-wide">
                              VINCULACIÓN APROBADA
                            </span>
                            <span className="text-[10px] text-muted-foreground font-mono font-bold">
                              {new Date(t.updated_at).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}
                            </span>
                          </div>
                          
                          <p className="text-xs font-semibold text-foreground leading-relaxed pt-1 font-sans">
                            {t.equipo?.id ? (
                              <span>
                                Fichaje oficial por <Link to={`/equipos/${t.equipo.id}`} className="text-primary hover:underline font-black">{t.equipo.nombre}</Link> procediendo desde <span className="text-muted-foreground font-bold">{t.equipo_origen?.nombre || 'Agente Libre'}</span>.
                              </span>
                            ) : (
                              <span>
                                Desvinculación de <strong className="text-foreground">{t.equipo_origen?.nombre || 'su club'}</strong> quedando en condición de <strong className="text-primary">Agente Libre / Jugador Libre</strong>.
                              </span>
                            )}
                          </p>
                          
                          <div className="flex items-center justify-between border-t border-border/10 pt-2.5 mt-1 text-[9px] font-mono font-bold text-muted-foreground uppercase">
                            <span>LIGA / CIRCUITO: <span className="text-foreground font-black">{t.organizacion?.nombre || 'N/A'}</span></span>
                            {t.dorsal && <span className="text-primary bg-primary/10 px-1.5 py-0.5 rounded border border-primary/20">Dorsal #{t.dorsal}</span>}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="border border-border/30 bg-muted/10 rounded-2xl p-10 text-center flex flex-col items-center justify-center gap-2">
                    <span className="text-2xl">🔄</span>
                    <p className="text-xs text-muted-foreground font-medium italic">No se registran movimientos ni transferencias oficiales para este competidor.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'calendario' && (
          <div className="border border-border/40 bg-card/15 backdrop-blur-md rounded-3xl p-5 shadow-2xl relative overflow-hidden transition-all duration-300 animate-fade-in">
            {/* Corners visual braces */}
            <div className="absolute top-0 left-0 w-3.5 h-3.5 border-t-2 border-l-2 border-primary/45 rounded-tl-lg pointer-events-none"></div>
            <div className="absolute top-0 right-0 w-3.5 h-3.5 border-t-2 border-r-2 border-primary/45 rounded-tr-lg pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 w-3.5 h-3.5 border-b-2 border-l-2 border-primary/45 rounded-bl-lg pointer-events-none"></div>
            <div className="absolute bottom-0 right-0 w-3.5 h-3.5 border-b-2 border-r-2 border-primary/45 rounded-br-lg pointer-events-none"></div>
            <Partidos forPlayer={true} hideHero={true} playerId={id} />
          </div>
        )}

        {activeTab === 'historia' && (
          <div className="space-y-6 animate-fade-in">
            <div className="border border-border/50 bg-card/20 backdrop-blur-sm rounded-2xl p-6 shadow-xl space-y-4">
              <div>
                <h3 className="text-xl font-display font-black text-foreground uppercase tracking-wide flex items-center gap-2">
                  📜 ARCHIVO HISTÓRICO Y RESUMEN TÁCTICO
                </h3>
                <p className="text-xs text-muted-foreground font-light mt-1">
                  Estadísticas acumuladas e historial de torneos disputados por el jugador a lo largo de las temporadas en RaconPro.
                </p>
              </div>

              {historial_torneos && historial_torneos.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
                  {historial_torneos.map((hist, idx) => (
                    <div key={idx} className="group border border-border/40 bg-background/20 backdrop-blur-md rounded-2xl p-5 relative overflow-hidden transition-all duration-300 hover:border-primary/30 flex flex-col gap-4 animate-fade-in-up" style={{ animationDelay: `${idx * 0.08}s` }}>
                      {/* Brackets decorativos HUD */}
                      <div className="absolute top-0 left-0 w-2.5 h-2.5 border-t-2 border-l-2 border-transparent transition-colors duration-300 group-hover:border-primary/30 rounded-tl-md pointer-events-none"></div>
                      <div className="absolute top-0 right-0 w-2.5 h-2.5 border-t-2 border-r-2 border-transparent transition-colors duration-300 group-hover:border-primary/30 rounded-tr-md pointer-events-none"></div>
                      <div className="absolute bottom-0 left-0 w-2.5 h-2.5 border-b-2 border-l-2 border-transparent transition-colors duration-300 group-hover:border-primary/30 rounded-bl-md pointer-events-none"></div>
                      <div className="absolute bottom-0 right-0 w-2.5 h-2.5 border-b-2 border-r-2 border-transparent transition-colors duration-300 group-hover:border-primary/30 rounded-br-md pointer-events-none"></div>
                      
                      <div className="absolute -top-10 -right-10 w-24 h-24 bg-primary/5 rounded-full blur-2xl pointer-events-none"></div>

                      <div className="flex items-center gap-3">
                        {hist.equipo_logo ? (
                          <img 
                            src={getImageUrl(hist.equipo_logo)} 
                            alt={hist.equipo_nombre} 
                            className="w-12 h-12 rounded-xl object-cover border border-border/40 shrink-0" 
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center font-display font-black text-primary text-lg uppercase shrink-0">
                            🛡️
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <h4 className="font-display font-black text-base text-foreground uppercase tracking-wide truncate group-hover:text-primary transition-colors">
                            {hist.equipo_nombre}
                          </h4>
                          <span className="text-[10px] text-muted-foreground block font-bold uppercase truncate">
                            🏆 {hist.competencia_nombre} • {hist.temporada_nombre}
                          </span>
                          <span className="text-[9px] text-primary/70 block font-mono font-bold uppercase truncate">
                            💼 {hist.organizacion_nombre}
                          </span>
                        </div>
                      </div>

                      <div className="h-px bg-border/20"></div>

                      {/* Resumen táctico de la temporada */}
                      <div className="grid grid-cols-3 gap-2.5 font-mono text-center">
                        <div className="bg-background/40 border border-border/25 rounded-xl p-2 hover:bg-background/60 transition-colors">
                          <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider block">Partidos</span>
                          <strong className="text-sm font-black text-foreground">{hist.partidos_jugados}</strong>
                        </div>
                        <div className="bg-background/40 border border-border/25 rounded-xl p-2 hover:bg-background/60 transition-colors">
                          <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider block">Goles</span>
                          <strong className="text-sm font-black text-emerald-400">{hist.total_goles}</strong>
                        </div>
                        <div className="bg-background/40 border border-border/25 rounded-xl p-2 hover:bg-background/60 transition-colors">
                          <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider block">Asist.</span>
                          <strong className="text-sm font-black text-primary">{hist.total_asistencias}</strong>
                        </div>
                        <div className="bg-background/40 border border-border/25 rounded-xl p-2 hover:bg-background/60 transition-colors col-span-1.5 flex items-center justify-between px-3">
                          <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">MVP</span>
                          <strong className="text-sm font-black text-amber-500">{hist.total_mvp} ⭐</strong>
                        </div>
                        <div className="bg-background/40 border border-border/25 rounded-xl p-2 hover:bg-background/60 transition-colors col-span-1.5 flex items-center justify-between px-3">
                          <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">Rating</span>
                          <strong className="text-sm font-black text-primary">{Number(hist.promedio_valoracion).toFixed(1)}</strong>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="border border-border/50 bg-muted/10 rounded-2xl p-12 text-center flex flex-col items-center justify-center gap-3">
                  <span className="text-2xl">📜</span>
                  <p className="text-sm text-muted-foreground font-medium italic">
                    No se registran datos ni participaciones en temporadas pasadas de forma oficial para este competidor.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
