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
        <Card className="lg:col-span-2 flex flex-col justify-between space-y-4 overflow-hidden relative" padding="p-6" withGlow={true}>
          <div className="absolute top-0 right-0 w-48 h-48 bg-primary/5 rounded-full blur-3xl pointer-events-none"></div>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase tracking-[0.2em] font-black text-primary animate-pulse flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-primary"></span>
                Siguiente Encuentro Programado
              </span>
              <Badge variant="brand" className="uppercase text-[9px] font-black tracking-widest px-2 py-0.5">OFICIAL</Badge>
            </div>
            
            {equipo?.proximo_partido ? (
              <div className="flex flex-col md:flex-row items-center justify-between gap-6 py-4">
                
                {/* Local Team */}
                <div className="flex flex-col items-center gap-3 flex-1 text-center">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-card to-muted border border-border/60 flex items-center justify-center font-display font-black text-primary text-xl shadow-lg overflow-hidden shrink-0">
                    {getLogoUrl(equipo.proximo_partido.local.logo) ? (
                      <img 
                        src={getLogoUrl(equipo.proximo_partido.local.logo)} 
                        alt={equipo.proximo_partido.local.nombre} 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      equipo.proximo_partido.local.abreviatura || equipo.proximo_partido.local.nombre?.substring(0, 3).toUpperCase()
                    )}
                  </div>
                  <span className="text-xs font-black text-foreground uppercase tracking-wide truncate max-w-[150px]">
                    {equipo.proximo_partido.local.nombre}
                  </span>
                </div>
                
                {/* VS & Match Information */}
                <div className="text-center space-y-2 shrink-0 px-4">
                  <span className="text-2xl font-display font-black tracking-widest text-muted-foreground/30">VS</span>
                  <div className="bg-primary/5 border border-primary/20 px-4 py-1.5 rounded-full">
                    <p className="text-[10px] text-foreground font-bold tracking-wider uppercase">
                      {equipo.proximo_partido.competencia?.nombre || 'Torneo General'}
                    </p>
                  </div>
                  <p className="text-[10px] font-mono text-muted-foreground tracking-widest font-bold">
                    {formatFechaHora(equipo.proximo_partido.fecha, equipo.proximo_partido.hora)}
                  </p>
                </div>

                {/* Visitante Team */}
                <div className="flex flex-col items-center gap-3 flex-1 text-center">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-card to-muted border border-border/60 flex items-center justify-center font-display font-black text-primary text-xl shadow-lg overflow-hidden shrink-0">
                    {getLogoUrl(equipo.proximo_partido.visitante.logo) ? (
                      <img 
                        src={getLogoUrl(equipo.proximo_partido.visitante.logo)} 
                        alt={equipo.proximo_partido.visitante.nombre} 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      equipo.proximo_partido.visitante.abreviatura || equipo.proximo_partido.visitante.nombre?.substring(0, 3).toUpperCase()
                    )}
                  </div>
                  <span className="text-xs font-black text-foreground uppercase tracking-wide truncate max-w-[150px]">
                    {equipo.proximo_partido.visitante.nombre}
                  </span>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-10 gap-3">
                <div className="text-3xl text-muted-foreground/30">📅</div>
                <div className="space-y-1 text-center">
                  <p className="text-xs font-black text-foreground uppercase tracking-wider">Sin Partidos Agendados</p>
                  <p className="text-[11px] text-muted-foreground max-w-sm">
                    No tienes ningún partido oficial programado en el fixture de tus competencias activas.
                  </p>
                </div>
              </div>
            )}
          </div>

          <Button 
            variant="outline" 
            size="sm" 
            className="w-full h-10 text-xs font-black uppercase tracking-widest border-border/50 hover:bg-primary/10 hover:border-primary/30 mt-2"
            onClick={() => onTabChange('calendario')}
          >
            📋 Ver Calendario y Reportes
          </Button>
        </Card>

        {/* AUDITORÍA Y ALERTAS OPERATIVAS */}
        <Card className="flex flex-col justify-between space-y-4" padding="p-6" withGlow={true}>
          <div className="space-y-4">
            <h3 className="text-xs font-black text-foreground uppercase tracking-widest border-b border-border/20 pb-2">Auditoría del Club</h3>
            
            <div className="space-y-4">
              {/* Alerta de Roster */}
              <div className="flex items-start gap-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm shrink-0 border ${
                  esPlantillaValida ? 'bg-green-500/10 border-green-500/30 text-green-500' : 'bg-amber-500/10 border-amber-500/30 text-amber-500 animate-pulse'
                }`}>
                  {esPlantillaValida ? '✓' : '⚠️'}
                </div>
                <div className="flex-1">
                  <p className="text-xs font-bold text-foreground">Reglamento de Plantilla ({totalJugadores}/11)</p>
                  <p className="text-muted-foreground text-[11px] leading-relaxed">
                    {esPlantillaValida 
                      ? 'Roster con mínimo legal de inscripción completo.' 
                      : 'Faltan jugadores para alcanzar el mínimo reglamentario.'
                    }
                  </p>
                </div>
              </div>

              {/* Alerta de Inscripciones */}
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-xs shrink-0 text-primary">
                  🏆
                </div>
                <div className="flex-1">
                  <p className="text-xs font-bold text-foreground">Torneos Inscritos</p>
                  <p className="text-muted-foreground text-[11px] leading-relaxed">
                    {competencias.length > 0 
                      ? `Inscrito en ${competencias.length} divisiones de la liga.` 
                      : 'El club no se encuentra registrado en torneos esta semana.'
                    }
                  </p>
                </div>
              </div>
            </div>
          </div>

          <Button 
            className="w-full h-10 text-xs font-black uppercase tracking-widest bg-primary text-primary-foreground hover:shadow-[0_0_15px_rgba(232,0,29,0.3)]"
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
          <div className="flex justify-between items-center border-b border-border/20 pb-2">
            <h3 className="text-xs font-black text-foreground uppercase tracking-widest">Estadísticas de la Temporada</h3>
            <span className="text-[10px] text-muted-foreground font-bold">Datos Acumulados</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {/* PJ */}
            <div className="bg-muted/15 border border-border/20 rounded-2xl p-4 text-center space-y-1">
              <span className="text-muted-foreground text-[10px] uppercase font-bold tracking-wider">Partidos Jugados</span>
              <p className="text-3xl font-display font-black text-foreground">{stats.jugados}</p>
            </div>
            
            {/* Victorias */}
            <div className="bg-green-500/5 border border-green-500/10 rounded-2xl p-4 text-center space-y-1">
              <span className="text-green-500/70 text-[10px] uppercase font-bold tracking-wider">Victorias</span>
              <p className="text-3xl font-display font-black text-green-500">{stats.victorias}</p>
            </div>

            {/* Empates */}
            <div className="bg-yellow-500/5 border border-yellow-500/10 rounded-2xl p-4 text-center space-y-1">
              <span className="text-yellow-500/70 text-[10px] uppercase font-bold tracking-wider">Empates</span>
              <p className="text-3xl font-display font-black text-yellow-500">{stats.empates}</p>
            </div>

            {/* Derrotas */}
            <div className="bg-destructive/5 border border-destructive/10 rounded-2xl p-4 text-center space-y-1">
              <span className="text-destructive/70 text-[10px] uppercase font-bold tracking-wider">Derrotas</span>
              <p className="text-3xl font-display font-black text-destructive">{stats.derrotas}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-t border-border/10 pt-4">
            {/* Goles a Favor */}
            <div className="flex justify-between items-center px-4 py-2 bg-muted/10 border border-border/10 rounded-xl">
              <span className="text-[11px] text-muted-foreground uppercase font-bold">Goles a Favor</span>
              <span className="text-sm font-display font-black text-foreground">{stats.goles_favor}</span>
            </div>

            {/* Goles en Contra */}
            <div className="flex justify-between items-center px-4 py-2 bg-muted/10 border border-border/10 rounded-xl">
              <span className="text-[11px] text-muted-foreground uppercase font-bold">Goles en Contra</span>
              <span className="text-sm font-display font-black text-foreground">{stats.goles_contra}</span>
            </div>

            {/* Diferencia de Goles */}
            <div className="flex justify-between items-center px-4 py-2 bg-muted/10 border border-border/10 rounded-xl">
              <span className="text-[11px] text-muted-foreground uppercase font-bold">Dif. de Goles</span>
              <span className={`text-sm font-display font-black ${
                diferenciaGoles > 0 ? 'text-green-500' : diferenciaGoles < 0 ? 'text-destructive' : 'text-foreground'
              }`}>
                {diferenciaGoles > 0 ? `+${diferenciaGoles}` : diferenciaGoles}
              </span>
            </div>
          </div>
        </Card>

        {/* IDENTIDAD / FICHA TÉCNICA DEL CLUB */}
        <Card className="space-y-4 flex flex-col justify-between" padding="p-6" withGlow={true}>
          <div className="space-y-3">
            <h3 className="text-xs font-black text-foreground uppercase tracking-widest border-b border-border/20 pb-2">
              Identidad del Club
            </h3>

            <div className="space-y-2.5 text-xs">
              {/* TAG */}
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground uppercase font-bold text-[10px]">TAG Oficial:</span>
                <span className="font-display font-black text-foreground text-sm uppercase bg-muted/20 px-2 py-0.5 rounded border border-border/40">
                  {equipo?.abreviatura || 'S/T'}
                </span>
              </div>

              {/* Plataforma */}
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground uppercase font-bold text-[10px]">Plataforma:</span>
                <span className="font-bold text-foreground uppercase bg-primary/10 border border-primary/20 px-2 py-0.5 rounded text-[10px]">
                  {equipo?.plataforma || 'Crossplay'}
                </span>
              </div>

              {/* EA Club ID */}
              {equipo?.club_id_ea && (
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground uppercase font-bold text-[10px]">Club ID EA:</span>
                  <span className="font-mono text-muted-foreground font-bold">
                    {equipo.club_id_ea}
                  </span>
                </div>
              )}

              {/* Manifiesto/Descripción */}
              <div className="space-y-1 pt-1.5 border-t border-border/10">
                <span className="text-muted-foreground uppercase font-bold text-[10px]">Manifiesto del Club:</span>
                <p className="text-[11px] text-muted-foreground leading-relaxed italic max-h-24 overflow-y-auto pr-1">
                  {equipo?.descripcion || '"Sin manifiesto o filosofía registrada para este club competitivo."'}
                </p>
              </div>
            </div>
          </div>

          {/* Enlaces Sociales del Club */}
          <div className="border-t border-border/20 pt-3 flex items-center justify-center gap-4">
            {equipo?.redes_sociales?.twitter ? (
              <a 
                href={`https://twitter.com/${equipo.redes_sociales.twitter.replace('@', '')}`}
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-card border border-border/50 text-[10px] font-bold text-muted-foreground hover:text-foreground hover:border-primary/40 transition-all duration-300"
              >
                🐦 Twitter
              </a>
            ) : (
              <span className="text-[10px] text-muted-foreground/40 font-bold">🐦 Twitter: N/D</span>
            )}
            
            {equipo?.redes_sociales?.twitch ? (
              <a 
                href={`https://twitch.tv/${equipo.redes_sociales.twitch}`}
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-card border border-border/50 text-[10px] font-bold text-muted-foreground hover:text-foreground hover:border-primary/40 transition-all duration-300"
              >
                🎮 Twitch
              </a>
            ) : (
              <span className="text-[10px] text-muted-foreground/40 font-bold">🎮 Twitch: N/D</span>
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
            <div className="h-3.5 w-full bg-muted rounded-full overflow-hidden flex border border-border/30">
              {positionDistribution.por > 0 && <div className="h-full bg-yellow-500 transition-all hover:opacity-80" style={{ width: `${(positionDistribution.por / totalJugadores) * 100}%` }} title="Porteros" />}
              {positionDistribution.df > 0 && <div className="h-full bg-blue-500 transition-all hover:opacity-80" style={{ width: `${(positionDistribution.df / totalJugadores) * 100}%` }} title="Defensas" />}
              {positionDistribution.mc > 0 && <div className="h-full bg-green-500 transition-all hover:opacity-80" style={{ width: `${(positionDistribution.mc / totalJugadores) * 100}%` }} title="Mediocampistas" />}
              {positionDistribution.dl > 0 && <div className="h-full bg-red-500 transition-all hover:opacity-80" style={{ width: `${(positionDistribution.dl / totalJugadores) * 100}%` }} title="Delanteros" />}
              {positionDistribution.sin > 0 && <div className="h-full bg-muted-foreground/40 transition-all hover:opacity-80" style={{ width: `${(positionDistribution.sin / totalJugadores) * 100}%` }} title="Sin Asignar" />}
            </div>

            {/* Leyenda de Posiciones */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
              <div className="flex items-center gap-2 text-xs">
                <span className="w-2.5 h-2.5 rounded bg-yellow-500 block shrink-0" />
                <span className="text-muted-foreground uppercase font-bold text-[10px]">Porteros: <strong className="text-foreground">{positionDistribution.por}</strong></span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="w-2.5 h-2.5 rounded bg-blue-500 block shrink-0" />
                <span className="text-muted-foreground uppercase font-bold text-[10px]">Defensas: <strong className="text-foreground">{positionDistribution.df}</strong></span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="w-2.5 h-2.5 rounded bg-green-500 block shrink-0" />
                <span className="text-muted-foreground uppercase font-bold text-[10px]">Medios: <strong className="text-foreground">{positionDistribution.mc}</strong></span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="w-2.5 h-2.5 rounded bg-red-500 block shrink-0" />
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