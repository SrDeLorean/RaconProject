import React, { useMemo } from 'react';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Card from '@/components/shared/Card';
import api from '@/api/axios';

export default function ResumenClub({ equipo, roster = [], competencias = [], onTabChange }) {
  const totalJugadores = roster.length;
  const esPlantillaValida = totalJugadores >= 11;

  // Distribución de posiciones en plantilla
  const positionDistribution = useMemo(() => {
    const counts = { por: 0, df: 0, mc: 0, dl: 0, sin: 0 };
    roster.forEach(player => {
      const pos = (player.posicion || player.posicion_bloque || '').toUpperCase();
      if (['PO', 'POR', 'GK', 'PORTERO'].some(x => pos.includes(x))) {
        counts.por++;
      } else if (['DF', 'DFC', 'LD', 'LI', 'CB', 'LB', 'RB', 'DEFENSA'].some(x => pos.includes(x))) {
        counts.df++;
      } else if (['MC', 'MCO', 'MCD', 'MI', 'MD', 'CM', 'CAM', 'CDM', 'LM', 'RM', 'MEDIO', 'VOLANTE'].some(x => pos.includes(x))) {
        counts.mc++;
      } else if (['DC', 'EI', 'ED', 'ST', 'LW', 'RW', 'CF', 'DELANTERO', 'ATACANTE'].some(x => pos.includes(x))) {
        counts.dl++;
      } else {
        counts.sin++;
      }
    });
    return counts;
  }, [roster]);

  // Helper para armar la URL del logo del equipo
  const getLogoUrl = (logoPath) => {
    if (!logoPath) return null;
    if (logoPath.startsWith('http')) return logoPath;
    const baseUrl = api.defaults.baseURL?.replace(/\/api$/, '') || 'http://127.0.0.1:8000';
    return `${baseUrl}${logoPath}`;
  };

  // Extraer estadísticas reales del equipo
  const stats = useMemo(() => {
    const defaultStats = { jugados: 0, victorias: 0, empates: 0, derrotas: 0, goles_favor: 0, goles_contra: 0 };
    return equipo?.estadisticas ? { ...defaultStats, ...equipo.estadisticas } : defaultStats;
  }, [equipo]);

  const diferenciaGoles = stats.goles_favor - stats.goles_contra;

  const winRate = useMemo(() => {
    return stats.jugados > 0 ? Math.round((stats.victorias / stats.jugados) * 100) : 0;
  }, [stats]);

  // Formatear fecha del próximo encuentro
  const formatFechaHora = (fecha, hora) => {
    if (!fecha) return 'Sin fecha';
    try {
      const dateParts = fecha.split('-');
      const formattedDate = dateParts.length === 3 ? `${dateParts[2]}/${dateParts[1]}/${dateParts[0]}` : fecha;
      const formattedHora = hora ? hora.substring(0, 5) : '';
      return `${formattedDate}${formattedHora ? ` - ${formattedHora} HS` : ''}`;
    } catch (e) {
      return `${fecha} ${hora || ''}`;
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Fila Superior: Próximo Encuentro y Datos Básicos / Alertas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* PANEL IZQUIERDO/CENTRAL: PRÓXIMO ENCUENTRO REAL */}
        <Card className="lg:col-span-2 flex flex-col justify-between space-y-4 overflow-hidden relative group" padding="p-6" withGlow={true}>
          <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000 pointer-events-none -z-10"></div>
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-[80px] pointer-events-none -z-10"></div>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold tracking-[0.2em] text-primary flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-primary animate-ping"></span>
                Siguiente Encuentro Programado
              </span>
              <Badge variant="brand" className="uppercase text-[9px] font-black tracking-widest px-2.5 py-0.5 border border-primary/30 bg-primary/10">OFICIAL</Badge>
            </div>
            
            {equipo?.proximo_partido ? (
              <div className="flex flex-col md:flex-row items-center justify-between gap-6 py-6 border-y border-border/20 my-2">
                
                {/* Local Team */}
                <div className="flex flex-col items-center gap-3 flex-1 text-center group/team">
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-card to-background border border-border/80 flex items-center justify-center font-display font-black text-primary text-2xl shadow-lg overflow-hidden shrink-0 group-hover/team:scale-105 transition-transform duration-300 relative">
                    {getLogoUrl(equipo.proximo_partido.local.logo) ? (
                      <img 
                        src={getLogoUrl(equipo.proximo_partido.local.logo)} 
                        alt={equipo.proximo_partido.local.nombre} 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      equipo.proximo_partido.local.abreviatura || equipo.proximo_partido.local.nombre?.substring(0, 3).toUpperCase()
                    )}
                    <div className="absolute inset-0 border border-primary/20 rounded-2xl pointer-events-none"></div>
                  </div>
                  <span className="text-xs font-black text-foreground uppercase tracking-wide truncate max-w-[150px]">
                    {equipo.proximo_partido.local.nombre}
                  </span>
                </div>
                
                {/* VS & Match Information */}
                <div className="text-center space-y-3 shrink-0 px-4">
                  <div className="relative flex items-center justify-center">
                    <span className="text-3xl font-display font-black tracking-wider text-muted-foreground/25 italic">VS</span>
                    <div className="absolute w-12 h-12 bg-primary/5 rounded-full blur-md"></div>
                  </div>
                  <div className="bg-primary/5 border border-primary/25 px-4.5 py-1.5 rounded-xl shadow-[inset_0_0_10px_rgba(232,0,29,0.05)]">
                    <p className="text-[10px] text-primary font-black tracking-widest uppercase font-condensed">
                      {equipo.proximo_partido.competencia?.nombre || 'Torneo General'}
                    </p>
                  </div>
                  <p className="text-[10px] font-mono text-muted-foreground tracking-widest font-bold bg-muted/40 px-3 py-1 rounded-md border border-border/40">
                    {formatFechaHora(equipo.proximo_partido.fecha, equipo.proximo_partido.hora)}
                  </p>
                </div>

                {/* Visitante Team */}
                <div className="flex flex-col items-center gap-3 flex-1 text-center group/team">
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-card to-background border border-border/80 flex items-center justify-center font-display font-black text-primary text-2xl shadow-lg overflow-hidden shrink-0 group-hover/team:scale-105 transition-transform duration-300 relative">
                    {getLogoUrl(equipo.proximo_partido.visitante.logo) ? (
                      <img 
                        src={getLogoUrl(equipo.proximo_partido.visitante.logo)} 
                        alt={equipo.proximo_partido.visitante.nombre} 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      equipo.proximo_partido.visitante.abreviatura || equipo.proximo_partido.visitante.nombre?.substring(0, 3).toUpperCase()
                    )}
                    <div className="absolute inset-0 border border-primary/20 rounded-2xl pointer-events-none"></div>
                  </div>
                  <span className="text-xs font-black text-foreground uppercase tracking-wide truncate max-w-[150px]">
                    {equipo.proximo_partido.visitante.nombre}
                  </span>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 gap-3 border border-dashed border-border/30 rounded-2xl bg-card/20 my-2">
                <div className="text-4xl text-muted-foreground/35 animate-bounce">📅</div>
                <div className="space-y-1 text-center">
                  <p className="text-xs font-black text-foreground uppercase tracking-wider">Sin Partidos Agendados</p>
                  <p className="text-[11px] text-muted-foreground max-w-xs mx-auto leading-relaxed">
                    No tienes ningún partido oficial programado en el fixture de tus competencias activas en esta organización.
                  </p>
                </div>
              </div>
            )}
          </div>

          <Button 
            variant="outline" 
            size="sm" 
            className="w-full h-10 text-[10px] font-black uppercase tracking-widest border-border/60 hover:bg-primary/10 hover:border-primary/40 transition-colors shadow-sm"
            onClick={() => onTabChange('calendario')}
          >
            📋 Ver Calendario y Reportes de Partidos
          </Button>
        </Card>

        {/* AUDITORÍA Y ALERTAS OPERATIVAS */}
        <Card className="flex flex-col justify-between space-y-4 h-full" padding="p-6" withGlow={true}>
          <div className="space-y-4">
            <h3 className="text-xs font-black text-foreground uppercase tracking-widest border-b border-border/25 pb-2.5">Auditoría del Club</h3>
            
            <div className="space-y-4">
              {/* Alerta de Roster */}
              <div className="flex items-start gap-3 p-3 rounded-xl bg-card/40 border border-border/20 hover:border-border/40 transition-colors">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm shrink-0 border ${
                  esPlantillaValida ? 'bg-green-500/10 border-green-500/30 text-green-500' : 'bg-amber-500/10 border-amber-500/30 text-amber-500 animate-pulse'
                }`}>
                  {esPlantillaValida ? '✓' : '⚠️'}
                </div>
                <div className="flex-1">
                  <p className="text-xs font-bold text-foreground">Reglamento de Roster ({totalJugadores}/11)</p>
                  <p className="text-muted-foreground text-[10px] leading-relaxed mt-0.5">
                    {esPlantillaValida 
                      ? 'Roster con el mínimo legal completo.' 
                      : 'Faltan jugadores para alcanzar el mínimo reglamentario de 11.'
                    }
                  </p>
                </div>
              </div>

              {/* Alerta de Inscripciones */}
              <div className="flex items-start gap-3 p-3 rounded-xl bg-card/40 border border-border/20 hover:border-border/40 transition-colors">
                <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-xs shrink-0 text-primary">
                  🏆
                </div>
                <div className="flex-1">
                  <p className="text-xs font-bold text-foreground">Torneos Inscritos</p>
                  <p className="text-muted-foreground text-[10px] leading-relaxed mt-0.5">
                    {competencias.length > 0 
                      ? `Inscripto en ${competencias.length} divisiones de la liga.` 
                      : 'El club no se encuentra registrado en torneos esta semana.'
                    }
                  </p>
                </div>
              </div>
            </div>
          </div>

          <Button 
            className="w-full h-10 text-[10px] font-black uppercase tracking-widest bg-primary text-primary-foreground hover:shadow-[0_0_15px_rgba(232,0,29,0.3)] transition-all"
            onClick={() => onTabChange(esPlantillaValida ? 'competencias' : 'roster')}
          >
            {esPlantillaValida ? '🏆 Buscar Torneos' : '👥 Fichar Jugadores'}
          </Button>
        </Card>

      </div>

      {/* Fila Central: Estadísticas de la Temporada e Identidad del Club */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* TARJETA DE ESTADÍSTICAS REALES */}
        <Card className="lg:col-span-2 space-y-5" padding="p-6" withGlow={true}>
          <div className="flex justify-between items-center border-b border-border/25 pb-2.5">
            <h3 className="text-xs font-black text-foreground uppercase tracking-widest">Estadísticas de la Temporada</h3>
            <span className="text-[10px] text-muted-foreground font-bold">Datos Acumulados</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {/* PJ */}
            <div className="bg-card/40 border border-border/40 rounded-2xl p-4 text-center space-y-1 shadow-sm hover:border-border transition-colors">
              <span className="text-muted-foreground text-[10px] uppercase font-bold tracking-wider font-condensed">Partidos Jugados</span>
              <p className="text-3xl font-display font-black text-foreground">{stats.jugados}</p>
            </div>
            
            {/* Victorias */}
            <div className="bg-green-500/5 border border-green-500/10 rounded-2xl p-4 text-center space-y-1 shadow-sm hover:border-green-500/20 transition-colors">
              <span className="text-green-500/70 text-[10px] uppercase font-bold tracking-wider font-condensed">Victorias</span>
              <p className="text-3xl font-display font-black text-green-500">{stats.victorias}</p>
            </div>

            {/* Empates */}
            <div className="bg-yellow-500/5 border border-yellow-500/10 rounded-2xl p-4 text-center space-y-1 shadow-sm hover:border-yellow-500/20 transition-colors">
              <span className="text-yellow-500/70 text-[10px] uppercase font-bold tracking-wider font-condensed">Empates</span>
              <p className="text-3xl font-display font-black text-yellow-500">{stats.empates}</p>
            </div>

            {/* Derrotas */}
            <div className="bg-destructive/5 border border-destructive/10 rounded-2xl p-4 text-center space-y-1 shadow-sm hover:border-destructive/20 transition-colors">
              <span className="text-destructive/70 text-[10px] uppercase font-bold tracking-wider font-condensed">Derrotas</span>
              <p className="text-3xl font-display font-black text-destructive">{stats.derrotas}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-t border-border/10 pt-4">
            {/* Goles a Favor */}
            <div className="flex justify-between items-center px-4 py-2.5 bg-card/20 border border-border/20 rounded-xl">
              <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Goles a Favor</span>
              <span className="text-sm font-display font-black text-foreground">{stats.goles_favor}</span>
            </div>

            {/* Goles en Contra */}
            <div className="flex justify-between items-center px-4 py-2.5 bg-card/20 border border-border/20 rounded-xl">
              <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Goles en Contra</span>
              <span className="text-sm font-display font-black text-foreground">{stats.goles_contra}</span>
            </div>

            {/* Diferencia de Goles */}
            <div className="flex justify-between items-center px-4 py-2.5 bg-card/20 border border-border/20 rounded-xl">
              <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Dif. de Goles</span>
              <span className={`text-sm font-display font-black ${
                diferenciaGoles > 0 ? 'text-green-500' : diferenciaGoles < 0 ? 'text-destructive' : 'text-foreground'
              }`}>
                {diferenciaGoles > 0 ? `+${diferenciaGoles}` : diferenciaGoles}
              </span>
            </div>
          </div>

          {/* Win Rate Progress Bar */}
          <div className="space-y-2 pt-4 border-t border-border/10">
            <div className="flex justify-between items-center text-xs">
              <span className="text-muted-foreground uppercase font-bold text-[10px] tracking-wider">Tasa de Victoria (Win Rate)</span>
              <strong className="text-primary font-display font-black text-base">{winRate}%</strong>
            </div>
            <div className="h-2 w-full bg-muted rounded-full overflow-hidden flex border border-border/30 shadow-inner">
              <div 
                className="h-full bg-gradient-to-r from-primary to-rose-500 shadow-[0_0_10px_hsla(var(--primary),0.5)] transition-all duration-1000" 
                style={{ width: `${winRate}%` }} 
              />
            </div>
          </div>
        </Card>

        {/* IDENTIDAD / FICHA TÉCNICA DEL CLUB */}
        <Card className="space-y-4 flex flex-col justify-between" padding="p-6" withGlow={true}>
          <div className="space-y-3">
            <h3 className="text-xs font-black text-foreground uppercase tracking-widest border-b border-border/25 pb-2.5">
              Identidad del Club
            </h3>

            <div className="space-y-3 text-xs">
              {/* TAG */}
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground uppercase font-bold text-[10px] tracking-wider">TAG Oficial:</span>
                <span className="font-display font-black text-foreground text-sm uppercase bg-muted/30 px-3 py-1 rounded-lg border border-border/50 shadow-inner">
                  {equipo?.abreviatura || 'S/T'}
                </span>
              </div>

              {/* Plataforma */}
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground uppercase font-bold text-[10px] tracking-wider">Plataforma:</span>
                <span className="font-bold text-foreground uppercase bg-primary/10 border border-primary/25 px-2.5 py-0.5 rounded-lg text-[9px] tracking-wider">
                  {equipo?.plataforma || 'Crossplay'}
                </span>
              </div>

              {/* EA Club ID */}
              {equipo?.club_id_ea && (
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground uppercase font-bold text-[10px] tracking-wider">Club ID EA:</span>
                  <span className="font-mono text-foreground font-black bg-card/60 px-2 py-0.5 rounded border border-border/30">
                    {equipo.club_id_ea}
                  </span>
                </div>
              )}

              {/* Manifiesto/Descripción */}
              <div className="space-y-1.5 pt-2 border-t border-border/10">
                <span className="text-muted-foreground uppercase font-bold text-[10px] tracking-wider block">Manifiesto del Club:</span>
                <p className="text-[11px] text-muted-foreground leading-relaxed italic max-h-24 overflow-y-auto pr-1">
                  {equipo?.descripcion ? `"${equipo.descripcion}"` : '"Sin manifiesto o filosofía registrada para este club competitivo."'}
                </p>
              </div>
            </div>
          </div>

          {/* Enlaces Sociales del Club */}
          <div className="border-t border-border/20 pt-4.5 flex items-center justify-center gap-4">
            {equipo?.redes_sociales?.twitter ? (
              <a 
                href={`https://twitter.com/${equipo.redes_sociales.twitter.replace('@', '')}`}
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-card border border-border hover:text-foreground hover:border-primary/40 transition-all duration-300 shadow-sm text-xs font-bold text-muted-foreground"
              >
                🐦 Twitter
              </a>
            ) : (
              <span className="text-[10px] text-muted-foreground/35 font-bold uppercase tracking-wider">🐦 Twitter: N/D</span>
            )}
            
            {equipo?.redes_sociales?.twitch ? (
              <a 
                href={`https://twitch.tv/${equipo.redes_sociales.twitch}`}
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-card border border-border hover:text-foreground hover:border-primary/40 transition-all duration-300 shadow-sm text-xs font-bold text-muted-foreground"
              >
                🎮 Twitch
              </a>
            ) : (
              <span className="text-[10px] text-muted-foreground/35 font-bold uppercase tracking-wider">🎮 Twitch: N/D</span>
            )}
          </div>
        </Card>

      </div>

      {/* Grilla Inferior: Distribución de Tácticas / Posiciones */}
      <Card className="space-y-4" padding="p-6" withGlow={true}>
        <div>
          <h3 className="text-xs font-black text-foreground uppercase tracking-widest">Distribución de Posiciones en el Roster</h3>
          <p className="text-[11px] text-muted-foreground">Estructura táctica y balance de la plantilla activa.</p>
        </div>

        {totalJugadores === 0 ? (
          <p className="text-xs text-muted-foreground">Ficha jugadores para visualizar la distribución táctica.</p>
        ) : (
          <div className="space-y-4">
            {/* Barra de Distribución */}
            <div className="h-3.5 w-full bg-muted rounded-full overflow-hidden flex border border-border/30 shadow-inner">
              {positionDistribution.por > 0 && <div className="h-full bg-yellow-500 transition-all hover:opacity-85" style={{ width: `${(positionDistribution.por / totalJugadores) * 100}%` }} title="Porteros" />}
              {positionDistribution.df > 0 && <div className="h-full bg-blue-500 transition-all hover:opacity-85" style={{ width: `${(positionDistribution.df / totalJugadores) * 100}%` }} title="Defensas" />}
              {positionDistribution.mc > 0 && <div className="h-full bg-green-500 transition-all hover:opacity-85" style={{ width: `${(positionDistribution.mc / totalJugadores) * 100}%` }} title="Mediocampistas" />}
              {positionDistribution.dl > 0 && <div className="h-full bg-red-500 transition-all hover:opacity-85" style={{ width: `${(positionDistribution.dl / totalJugadores) * 100}%` }} title="Delanteros" />}
              {positionDistribution.sin > 0 && <div className="h-full bg-muted-foreground/40 transition-all hover:opacity-85" style={{ width: `${(positionDistribution.sin / totalJugadores) * 100}%` }} title="Sin Asignar" />}
            </div>

            {/* Leyenda de Posiciones */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
              <div className="flex items-center gap-2 text-xs">
                <span className="w-2.5 h-2.5 rounded bg-yellow-500 block shrink-0 shadow-[0_0_5px_rgba(234,179,8,0.4)]" />
                <span className="text-muted-foreground uppercase font-bold text-[10px]">Porteros: <strong className="text-foreground">{positionDistribution.por}</strong></span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="w-2.5 h-2.5 rounded bg-blue-500 block shrink-0 shadow-[0_0_5px_rgba(59,130,246,0.4)]" />
                <span className="text-muted-foreground uppercase font-bold text-[10px]">Defensas: <strong className="text-foreground">{positionDistribution.df}</strong></span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="w-2.5 h-2.5 rounded bg-green-500 block shrink-0 shadow-[0_0_5px_rgba(34,197,94,0.4)]" />
                <span className="text-muted-foreground uppercase font-bold text-[10px]">Medios: <strong className="text-foreground">{positionDistribution.mc}</strong></span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="w-2.5 h-2.5 rounded bg-red-500 block shrink-0 shadow-[0_0_5px_rgba(239,68,68,0.4)]" />
                <span className="text-muted-foreground uppercase font-bold text-[10px]">Delanteros: <strong className="text-foreground">{positionDistribution.dl}</strong></span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="w-2.5 h-2.5 rounded bg-muted-foreground/40 block shrink-0" />
                <span className="text-muted-foreground uppercase font-bold text-[10px]">Sin Rol: <strong className="text-foreground">{positionDistribution.sin}</strong></span>
              </div>
            </div>
          </div>
        )}
      </Card>

    </div>
  );
}