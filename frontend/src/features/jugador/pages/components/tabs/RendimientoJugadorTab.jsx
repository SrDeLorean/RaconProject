import React, { useState, useEffect } from 'react';
import Card from '@/components/shared/Card';
import Badge from '@/components/ui/Badge';

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
    <div className="space-y-6">
      <div className="border-b border-border/10 pb-3">
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <div>
            <h4 className="text-sm font-bold text-foreground uppercase tracking-wide">Mi Ficha de Telemetría Táctica</h4>
            <p className="text-xs text-muted-foreground">Estadísticas de juego acumuladas de todas las ligas oficiales.</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 text-left">
        
        {/* Lado izquierdo: Selector HUD */}
        <div className="flex lg:flex-col gap-1.5 overflow-x-auto lg:overflow-x-visible no-scrollbar bg-background/30 p-2 rounded-2xl border border-border/30 h-fit lg:col-span-1">
          {[
            { id: 'ataque', label: 'Ataque' },
            { id: 'pase', label: 'Distribución' },
            { id: 'defensa', label: 'Defensa' },
            { id: 'porteria', label: 'Portería' },
            { id: 'fisico', label: 'Físico / Red' }
          ].map(tab => {
            const isTabActive = activeStatSubTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveStatSubTab(tab.id)}
                className={`w-full py-2.5 px-3.5 text-[10px] font-mono tracking-widest uppercase rounded-xl transition-all cursor-pointer whitespace-nowrap text-left border flex items-center ${
                  isTabActive
                    ? 'bg-primary/10 border-primary/30 text-primary font-black shadow-inner'
                    : 'text-muted-foreground hover:text-foreground border-transparent hover:bg-card/30'
                }`}
              >
                {getSubTabIcon(tab.id, `w-3.5 h-3.5 mr-2 ${isTabActive ? 'text-primary' : 'text-muted-foreground'}`)}
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Lado derecho: Barras de Progreso */}
        <div className="lg:col-span-3 border border-border/40 bg-card/25 p-6 rounded-3xl space-y-6">
          <div className="flex items-center gap-2 border-b border-border/10 pb-3">
            {getSubTabIcon(currentSection.id, `w-4.5 h-4.5 ${currentSection.color}`)}
            <span className={`text-[11px] font-mono font-black uppercase tracking-widest block ${currentSection.color}`}>
              {currentSection.title}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {currentSection.items.map((item, idx) => {
              const val = item.valForBar !== undefined ? item.valForBar : item.pct !== undefined ? item.pct : Number(item.value);
              const max = item.pct !== undefined ? 100 : item.max || 10;
              const pct = Math.min(100, Math.max(0, (val / max) * 100));

              return (
                <div key={idx} className="space-y-2 text-left font-mono">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-muted-foreground font-bold">{item.label}</span>
                    <strong className={`font-black ${item.isNegative ? 'text-destructive font-bold' : 'text-foreground'}`}>
                      {item.value}
                    </strong>
                  </div>
                  
                  {/* Barra de progreso */}
                  <div className="w-full h-2.5 bg-muted/40 rounded-full overflow-hidden border border-border/10">
                    <div 
                      className={`h-full rounded-full transition-all duration-700 ease-out ${currentSection.barColor}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}
