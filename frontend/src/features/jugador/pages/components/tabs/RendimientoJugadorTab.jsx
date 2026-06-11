import React, { useState, useEffect } from 'react';
import Card from '@/components/shared/Card';

const getSubTabIcon = (id, className = "w-4 h-4 mr-2 inline-block") => {
  switch (id) {
    case 'ataque':
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
          <circle cx="12" cy="12" r="10" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4M8 12h8" />
        </svg>
      );
    case 'pase':
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      );
    case 'defensa':
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      );
    case 'porteria':
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l9-5-9-5-9 5 9 5zm0 0v6m-4 0h8" />
        </svg>
      );
    case 'fisico':
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    default:
      return null;
  }
};

export default function RendimientoJugadorTab({ profileData }) {
  const [activeStatSubTab, setActiveStatSubTab] = useState('ataque');

  const user = profileData || {};
  const estadisticas = profileData?.estadisticas || {
    partidos_jugados: 0,
    total_goles: 0,
    total_asistencias: 0,
    promedio_valoracion: 0,
    total_mvp: 0,
    total_rojas: 0,
    total_entradas: 0,
    avg_exito_entradas: 0,
    avg_precision_pases: 0,
    avg_precision_tiro: 0,
    total_atajadas: 0,
    total_goles_recibidos: 0,
    total_tiros: 0,
    total_pases_intentados: 0,
    total_pases_completados: 0,
    total_entradas_intentadas: 0,
    total_atajadas_buena_colocacion: 0,
    total_atajadas_volada: 0,
    total_atajadas_reflejos: 0,
    total_centros_cortados: 0,
    total_despejes_punos: 0,
    total_desvios: 0,
    total_segundos_jugados: 0,
    total_tiempo_juego_motor: 0,
    total_tiempo_inactivo: 0,
    total_tiempo_real_lag: 0
  };

  const rawPos = user.posicion || user.contrato_activo?.posicion_bloque || 'MC';
  
  useEffect(() => {
    const pStr = rawPos.toUpperCase();
    if (['POR', 'GK', 'PO', 'GOALKEEPER'].includes(pStr)) {
      setActiveStatSubTab('porteria');
    } else if (['DFC', 'CB', 'LB', 'RB', 'DF', 'DEF', 'LI', 'LD', 'DD', 'DI', 'DEFENDER'].includes(pStr)) {
      setActiveStatSubTab('defensa');
    } else if (['MC', 'MCO', 'MCD', 'MD', 'MI', 'CM', 'CAM', 'CDM', 'LM', 'RM', 'MED', 'MCI', 'MCR', 'MDD', 'MDI', 'MOD', 'MOI', 'MIDFIELDER'].includes(pStr)) {
      setActiveStatSubTab('pase');
    } else {
      setActiveStatSubTab('ataque');
    }
  }, [rawPos]);

  const statsSections = [
    {
      id: 'ataque',
      title: 'Fase Ofensiva y Remates',
      color: 'text-rose-500',
      activeBg: 'bg-rose-500/10',
      activeBorder: 'border-rose-500/30',
      barColor: 'bg-gradient-to-r from-rose-600 to-rose-400 shadow-[0_0_8px_rgba(244,63,94,0.45)]',
      items: [
        { label: 'Goles Totales', value: estadisticas.total_goles || 0, max: 20 },
        { label: 'Tiros Totales', value: estadisticas.total_tiros || 0, max: 80 },
        { label: 'Precisión de Tiro', value: `${Math.round(estadisticas.avg_precision_tiro || 0)}%`, pct: Math.round(estadisticas.avg_precision_tiro || 0) }
      ]
    },
    {
      id: 'pase',
      title: 'Fase Asociativa y Distribución',
      color: 'text-emerald-500',
      activeBg: 'bg-emerald-500/10',
      activeBorder: 'border-emerald-500/30',
      barColor: 'bg-gradient-to-r from-emerald-600 to-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.45)]',
      items: [
        { label: 'Asistencias', value: estadisticas.total_asistencias || 0, max: 15 },
        { label: 'Pases Completados', value: estadisticas.total_pases_completados || 0, max: 400 },
        { label: 'Pases Intentados', value: estadisticas.total_pases_intentados || 0, max: 500 },
        { label: 'Precisión de Pases', value: `${Math.round(estadisticas.avg_precision_pases || 0)}%`, pct: Math.round(estadisticas.avg_precision_pases || 0) }
      ]
    },
    {
      id: 'defensa',
      title: 'Fase Defensiva y Prevención',
      color: 'text-blue-500',
      activeBg: 'bg-blue-500/10',
      activeBorder: 'border-blue-500/30',
      barColor: 'bg-gradient-to-r from-blue-600 to-blue-400 shadow-[0_0_8px_rgba(59,130,246,0.45)]',
      items: [
        { label: 'Entradas Exitosas', value: estadisticas.total_entradas || 0, max: 80 },
        { label: 'Entradas Intentadas', value: estadisticas.total_entradas_intentadas || 0, max: 120 },
        { label: 'Éxito de Entradas', value: `${Math.round(estadisticas.avg_exito_entradas || 0)}%`, pct: Math.round(estadisticas.avg_exito_entradas || 0) },
        { label: 'Desvíos Totales', value: estadisticas.total_desvios || 0, max: 40 }
      ]
    },
    {
      id: 'porteria',
      title: 'Registro de Arco y Atajadas',
      color: 'text-amber-500',
      activeBg: 'bg-amber-500/10',
      activeBorder: 'border-amber-500/30',
      barColor: 'bg-gradient-to-r from-amber-600 to-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.45)]',
      items: [
        { label: 'Atajadas', value: estadisticas.total_atajadas || 0, max: 100 },
        { label: 'Goles Recibidos', value: estadisticas.total_goles_recibidos || 0, max: 50, isNegative: true },
        { label: 'Atajadas Colocación', value: estadisticas.total_atajadas_buena_colocacion || 0, max: 40 },
        { label: 'Atajadas Volada', value: estadisticas.total_atajadas_volada || 0, max: 40 },
        { label: 'Atajadas Reflejos', value: estadisticas.total_atajadas_reflejos || 0, max: 40 },
        { 
          label: 'Despejes / Centros Cortados', 
          value: `${estadisticas.total_despejes_punos || 0} / ${estadisticas.total_centros_cortados || 0}`, 
          valForBar: (estadisticas.total_despejes_punos || 0) + (estadisticas.total_centros_cortados || 0), 
          max: 30 
        }
      ]
    },
    {
      id: 'fisico',
      title: 'Telemetría Física y Latencia',
      color: 'text-purple-500',
      activeBg: 'bg-purple-500/10',
      activeBorder: 'border-purple-500/30',
      barColor: 'bg-gradient-to-r from-purple-600 to-fuchsia-400 shadow-[0_0_8px_rgba(168,85,247,0.45)]',
      items: [
        { label: 'Segundos Jugados', value: estadisticas.total_segundos_jugados || 0, max: 15000 },
        { label: 'Tiempo Juego Motor', value: estadisticas.total_tiempo_juego_motor || 0, max: 15000 },
        { label: 'Tiempo Inactivo', value: estadisticas.total_tiempo_inactivo || 0, max: 5000 },
        { label: 'Tiempo Real Lag', value: estadisticas.total_tiempo_real_lag || 0, max: 2000 },
        { label: 'Tarjetas Rojas', value: estadisticas.total_rojas || 0, max: 5, isNegative: true }
      ]
    }
  ];

  const currentSection = statsSections.find(s => s.id === activeStatSubTab);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="border-b border-border/10 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-xl border border-primary/20">
            <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <div>
            <h4 className="text-lg font-display font-black text-foreground uppercase tracking-wider">Telemetría Táctica</h4>
            <p className="text-xs text-muted-foreground mt-0.5">Estadísticas de juego acumuladas de todas las ligas oficiales.</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 text-left items-start">
        
        {/* Lado izquierdo: Selector HUD */}
        <div className="flex lg:flex-col gap-2 overflow-x-auto lg:overflow-x-visible no-scrollbar p-2 h-fit lg:col-span-1">
          {statsSections.map(tab => {
            const isTabActive = activeStatSubTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveStatSubTab(tab.id)}
                className={`w-full py-3 px-4 text-xs font-mono tracking-widest uppercase rounded-xl transition-all duration-300 cursor-pointer whitespace-nowrap text-left border flex items-center group ${
                  isTabActive
                    ? `${tab.activeBg} ${tab.activeBorder} ${tab.color} font-black shadow-inner`
                    : 'text-muted-foreground border-transparent hover:bg-card/40 hover:text-foreground'
                }`}
              >
                {getSubTabIcon(tab.id, `w-4 h-4 mr-3 transition-transform duration-300 ${isTabActive ? `${tab.color} scale-110` : 'text-muted-foreground group-hover:scale-110'}`)}
                <span>{tab.title.split(' ')[1] || tab.title.split(' ')[0]}</span>
              </button>
            );
          })}
        </div>

        {/* Lado derecho: Barras de Progreso usando Card Premium */}
        <Card className="lg:col-span-3 space-y-6" hoverLift={false} withGlow={true}>
          <div className="flex items-center gap-3 border-b border-border/10 pb-4 relative z-10">
            <div className={`p-2 rounded-lg ${currentSection.activeBg}`}>
              {getSubTabIcon(currentSection.id, `w-5 h-5 ${currentSection.color} m-0`)}
            </div>
            <span className={`text-lg font-display font-black uppercase tracking-widest block ${currentSection.color}`}>
              {currentSection.title}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
            {currentSection.items.map((item, idx) => {
              const val = item.valForBar !== undefined ? item.valForBar : item.pct !== undefined ? item.pct : Number(item.value);
              const max = item.pct !== undefined ? 100 : item.max || 10;
              const pct = Math.min(100, Math.max(0, (val / max) * 100));

              return (
                <div key={idx} className="space-y-3 text-left font-mono">
                  <div className="flex justify-between items-end text-xs">
                    <span className="text-muted-foreground font-bold tracking-wider">{item.label}</span>
                    <strong className={`font-black text-lg leading-none ${item.isNegative ? 'text-destructive drop-shadow-[0_0_8px_rgba(220,38,38,0.5)]' : 'text-foreground'}`}>
                      {item.value}
                    </strong>
                  </div>
                  
                  {/* Barra de progreso */}
                  <div className="w-full h-3 bg-muted/30 rounded-full overflow-hidden border border-border/20 shadow-inner">
                    <div 
                      className={`h-full rounded-full transition-all duration-1000 ease-out relative overflow-hidden ${currentSection.barColor}`}
                      style={{ width: `${pct}%` }}
                    >
                      {/* Efecto de luz recorriendo la barra */}
                      <div className="absolute top-0 bottom-0 left-0 right-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full animate-[shimmer_2s_infinite]"></div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

      </div>
    </div>
  );
}
