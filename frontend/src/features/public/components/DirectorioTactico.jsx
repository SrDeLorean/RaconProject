import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import Badge from '@/components/ui/Badge';

const getVisiblePages = (currentPage, totalPages) => {
  const maxVisible = 5;
  if (totalPages <= maxVisible) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }
  let start = Math.max(1, currentPage - 2);
  let end = Math.min(totalPages, currentPage + 2);
  
  if (start === 1) {
    end = maxVisible;
  } else if (end === totalPages) {
    start = totalPages - maxVisible + 1;
  }
  
  const pages = [];
  for (let i = start; i <= end; i++) {
    pages.push(i);
  }
  return pages;
};


export default function DirectorioTactico({ stats, getImageUrl }) {
  const [directoryTab, setDirectoryTab] = useState('jugadores'); // 'jugadores' | 'equipos'

  // Player search/filter/sort states
  const [playerSearch, setPlayerSearch] = useState('');
  const [playerPos, setPlayerPos] = useState('todos');
  const [playerSortField, setPlayerSortField] = useState('avg_valoracion');
  const [playerSortOrder, setPlayerSortOrder] = useState('desc');
  const [playerPage, setPlayerPage] = useState(1);
  const playersPerPage = 10;

  // Team search/sort states
  const [teamSearch, setTeamSearch] = useState('');
  const [teamSortField, setTeamSortField] = useState('total_goles_favor');
  const [teamSortOrder, setTeamSortOrder] = useState('desc');
  const [teamPage, setTeamPage] = useState(1);
  const teamsPerPage = 10;

  // Reset pagination page when filters change
  useEffect(() => {
    setPlayerPage(1);
  }, [playerSearch, playerPos, playerSortField, playerSortOrder]);

  useEffect(() => {
    setTeamPage(1);
  }, [teamSearch, teamSortField, teamSortOrder]);

  // Helper position category mapper
  const getPositionCategory = (pos) => {
    if (!pos) return 'DEL';
    const p = pos.toUpperCase();
    if (['DEL', 'DC', 'EI', 'ED', 'ST', 'LW', 'RW', 'CF', 'FORWARD'].includes(p)) return 'DEL';
    if (['MC', 'MCO', 'MCD', 'MD', 'MI', 'CM', 'CAM', 'CDM', 'LM', 'RM', 'MIDFIELDER'].includes(p)) return 'MED';
    if (['DFC', 'DFI', 'DFD', 'CB', 'LB', 'RB', 'DEFENDER'].includes(p)) return 'DEF';
    if (['POR', 'GK', 'GOALKEEPER'].includes(p)) return 'POR';
    return 'MED';
  };

  // Filtered and Sorted Players
  const filteredAndSortedPlayers = useMemo(() => {
    if (!stats || !stats.todos_jugadores) return [];
    
    let list = stats.todos_jugadores.filter(p => {
      const matchSearch = p.name?.toLowerCase().includes(playerSearch.toLowerCase()) || 
                          p.equipo_nombre?.toLowerCase().includes(playerSearch.toLowerCase());
      const matchPos = playerPos === 'todos' || getPositionCategory(p.posicion) === playerPos;
      return matchSearch && matchPos;
    });

    list.sort((a, b) => {
      let valA = a[playerSortField];
      let valB = b[playerSortField];
      if (valA === null || valA === undefined) valA = 0;
      if (valB === null || valB === undefined) valB = 0;
      const numA = Number(valA);
      const numB = Number(valB);
      if (!isNaN(numA) && !isNaN(numB)) {
        return playerSortOrder === 'desc' ? numB - numA : numA - numB;
      }
      const strA = String(valA).toLowerCase();
      const strB = String(valB).toLowerCase();
      if (strA < strB) return playerSortOrder === 'desc' ? 1 : -1;
      if (strA > strB) return playerSortOrder === 'desc' ? -1 : 1;
      return 0;
    });
    return list;
  }, [stats?.todos_jugadores, playerSearch, playerPos, playerSortField, playerSortOrder]);

  // Filtered and Sorted Teams
  const filteredAndSortedTeams = useMemo(() => {
    if (!stats || !stats.todos_equipos) return [];
    
    let list = stats.todos_equipos.filter(t => {
      return t.nombre?.toLowerCase().includes(teamSearch.toLowerCase());
    });

    list.sort((a, b) => {
      let valA = a[teamSortField];
      let valB = b[teamSortField];
      if (valA === null || valA === undefined) valA = 0;
      if (valB === null || valB === undefined) valB = 0;
      const numA = Number(valA);
      const numB = Number(valB);
      if (!isNaN(numA) && !isNaN(numB)) {
        return teamSortOrder === 'desc' ? numB - numA : numA - numB;
      }
      const strA = String(valA).toLowerCase();
      const strB = String(valB).toLowerCase();
      if (strA < strB) return teamSortOrder === 'desc' ? 1 : -1;
      if (strA > strB) return teamSortOrder === 'desc' ? -1 : 1;
      return 0;
    });
    return list;
  }, [stats?.todos_equipos, teamSearch, teamSortField, teamSortOrder]);

  // Paginated Slices
  const totalPlayerPages = Math.ceil(filteredAndSortedPlayers.length / playersPerPage) || 1;
  const paginatedPlayers = useMemo(() => {
    const start = (playerPage - 1) * playersPerPage;
    return filteredAndSortedPlayers.slice(start, start + playersPerPage);
  }, [filteredAndSortedPlayers, playerPage]);

  const totalTeamPages = Math.ceil(filteredAndSortedTeams.length / teamsPerPage) || 1;
  const paginatedTeams = useMemo(() => {
    const start = (teamPage - 1) * teamsPerPage;
    return filteredAndSortedTeams.slice(start, start + teamsPerPage);
  }, [filteredAndSortedTeams, teamPage]);

  return (
    <div className="border border-border/40 bg-card/15 backdrop-blur-xl rounded-3xl p-6 md:p-8 space-y-6 shadow-2xl relative overflow-hidden text-left">
      <div className="absolute top-0 left-0 w-48 h-48 bg-destructive/5 rounded-full blur-3xl pointer-events-none" />
      
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-border/40 pb-5 gap-4">
        <div className="text-left">
          <Badge className="text-primary bg-primary/10 border border-primary/25 text-[10px] uppercase font-condensed tracking-widest px-3 py-1">
            📋 DIRECTORIO TÁCTICO INTEGRAL
          </Badge>
          <h2 className="text-2xl md:text-3xl font-display font-black uppercase text-foreground mt-1">
            TELEMETRÍA GLOBAL DE <span className="text-primary">COMPETIDORES</span>
          </h2>
        </div>
        
        {/* Selector de Pestañas del Directorio */}
        <div className="flex bg-background/55 p-1 rounded-xl border border-border/40 gap-1 shrink-0 self-start sm:self-center">
          {[
            { id: 'jugadores', label: '🏃 Jugadores' },
            { id: 'equipos', label: '🛡️ Clubes' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setDirectoryTab(tab.id)}
              className={`px-4 py-2 rounded-lg text-[10px] font-condensed tracking-widest uppercase transition-all duration-300 cursor-pointer ${
                directoryTab === tab.id
                  ? 'text-primary bg-primary/10 border border-primary/20 font-black'
                  : 'text-muted-foreground hover:text-foreground font-bold'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* CONTENIDO DE PESTAÑA: JUGADORES */}
      {directoryTab === 'jugadores' && (
        <div className="space-y-6">
          {/* Filtros del Directorio de Jugadores */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            
            {/* Búsqueda */}
            <div className="space-y-1.5 text-left">
              <label className="text-[9px] font-mono font-black text-muted-foreground uppercase tracking-widest block">🔍 Buscar Jugador o Club</label>
              <input 
                type="text"
                placeholder="Nombre, club..."
                value={playerSearch}
                onChange={(e) => setPlayerSearch(e.target.value)}
                className="w-full bg-background/45 border border-border/40 hover:border-primary/45 rounded-xl px-4 py-2.5 text-xs font-mono font-bold text-foreground focus:outline-none focus:border-primary/50 transition-all placeholder:text-gray-600"
              />
            </div>

            {/* Filtro por Posición */}
            <div className="space-y-1.5 text-left">
              <label className="text-[9px] font-mono font-black text-muted-foreground uppercase tracking-widest block">⚽ Demarcación / Posición</label>
              <div className="relative">
                <select
                  value={playerPos}
                  onChange={(e) => setPlayerPos(e.target.value)}
                  className="w-full bg-background/45 border border-border/40 hover:border-primary/45 rounded-xl px-4 py-2.5 text-xs font-mono font-bold text-foreground focus:outline-none focus:border-primary/50 transition-all appearance-none cursor-pointer"
                >
                  <option value="todos">🌎 Todas las demarcaciones</option>
                  <option value="DEL">⚽ Delanteros</option>
                  <option value="MED">🪄 Mediocentros</option>
                  <option value="DEF">🛡️ Defensores</option>
                  <option value="POR">🧤 Porteros</option>
                </select>
                <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-muted-foreground text-[9px]">▼</div>
              </div>
            </div>

            {/* Ordenar por campo */}
            <div className="space-y-1.5 text-left">
              <label className="text-[9px] font-mono font-black text-muted-foreground uppercase tracking-widest block">📊 Métrica de Ordenación</label>
              <div className="relative">
                <select
                  value={playerSortField}
                  onChange={(e) => setPlayerSortField(e.target.value)}
                  className="w-full bg-background/45 border border-border/40 hover:border-primary/45 rounded-xl px-4 py-2.5 text-xs font-mono font-bold text-foreground focus:outline-none focus:border-primary/50 transition-all appearance-none cursor-pointer"
                >
                  <option value="avg_valoracion">⭐ Valoración Media (OVR)</option>
                  <option value="total_goles">⚽ Goles Totales</option>
                  <option value="total_asistencias">🎯 Asistencias Totales</option>
                  <option value="partidos_jugados">📅 Partidos Jugados</option>
                  <option value="total_mvp">🏆 Galardones MVP</option>
                  <option value="total_tiros">⚽ Tiros a Portería</option>
                  <option value="total_entradas">🛡️ Quites Exitosos</option>
                  <option value="total_atajadas">🧤 Atajadas de Arquero</option>
                </select>
                <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-muted-foreground text-[9px]">▼</div>
              </div>
            </div>

            {/* Dirección del orden */}
            <div className="space-y-1.5 text-left">
              <label className="text-[9px] font-mono font-black text-muted-foreground uppercase tracking-widest block">📈 Dirección</label>
              <div className="relative">
                <select
                  value={playerSortOrder}
                  onChange={(e) => setPlayerSortOrder(e.target.value)}
                  className="w-full bg-background/45 border border-border/40 hover:border-primary/45 rounded-xl px-4 py-2.5 text-xs font-mono font-bold text-foreground focus:outline-none focus:border-primary/50 transition-all appearance-none cursor-pointer"
                >
                  <option value="desc">Descendente (Mayor a Menor)</option>
                  <option value="asc">Ascendente (Menor a Mayor)</option>
                </select>
                <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-muted-foreground text-[9px]">▼</div>
              </div>
            </div>

          </div>

          {/* Tabla / Grid de Jugadores */}
          {paginatedPlayers.length > 0 ? (
            <div className="space-y-4">
              <div className="overflow-x-auto rounded-2xl border border-border/30 bg-background/25">
                <table className="w-full text-left font-mono text-[10px] xl:text-[11px] border-collapse min-w-[900px]">
                  <thead>
                    <tr className="bg-card/40 border-b border-border/30 text-gray-400 font-bold uppercase tracking-wider text-[9px]">
                      <th className="px-2 py-2.5 sm:px-4 sm:py-3.5 w-12">#</th>
                      <th className="px-2 py-2.5 sm:px-4 sm:py-3.5">Nombre / Club</th>
                      <th className="px-2 py-2.5 sm:px-4 sm:py-3.5 text-center">Posición</th>
                      <th className="px-2 py-2.5 sm:px-4 sm:py-3.5 text-center">Partidos</th>
                      <th className="px-2 py-2.5 sm:px-4 sm:py-3.5 text-center">Goles (Tiros / Prec)</th>
                      <th className="px-2 py-2.5 sm:px-4 sm:py-3.5 text-center">Asist (Pases / Prec)</th>
                      <th className="px-2 py-2.5 sm:px-4 sm:py-3.5 text-center">Quites (Exito)</th>
                      <th className="px-2 py-2.5 sm:px-4 sm:py-3.5 text-center">Arco (Ataj/Recib)</th>
                      <th className="px-2 py-2.5 sm:px-4 sm:py-3.5 text-center">MVPs</th>
                      <th className="px-2 py-2.5 sm:px-4 sm:py-3.5 text-center">Disc.</th>
                      <th className="px-2 py-2.5 sm:px-4 sm:py-3.5 text-center text-primary">OVR</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/20">
                    {paginatedPlayers.map((p, idx) => {
                      const ovr = p.avg_valoracion ? Number(p.avg_valoracion).toFixed(2) : '—';
                      const positionLabel = p.posicion?.toUpperCase() || 'CM';
                      const posCat = getPositionCategory(p.posicion);
                      
                      // Badge color mapping
                      const badgeColor = 
                        posCat === 'DEL' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
                        posCat === 'MED' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                        posCat === 'DEF' ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' :
                        'bg-purple-500/10 text-purple-500 border-purple-500/20';

                      // Stats formats mapping
                      const formattedGoles = posCat !== 'POR' 
                        ? `${p.total_goles || 0} (${p.total_tiros || 0} / ${Math.round(p.avg_precision_tiro || 0)}%)` 
                        : '—';

                      const formattedAsist = `${p.total_asistencias || 0} (${p.total_pases_completados || 0}/${p.total_pases_intentados || 0} / ${Math.round(p.avg_precision_pases || 0)}%)`;

                      const formattedQuites = posCat !== 'POR' 
                        ? `${p.total_entradas || 0} (${Math.round(p.avg_exito_entradas || 0)}%)` 
                        : '—';

                      const formattedPorteria = posCat === 'POR' 
                        ? `${p.total_atajadas || 0} / ${p.total_goles_recibidos || 0}` 
                        : '—';

                      return (
                        <tr key={p.id} className="hover:bg-card/25 transition-all group">
                          <td className="px-2 py-2.5 sm:px-4 sm:py-3 text-muted-foreground font-black">
                            #{(playerPage - 1) * playersPerPage + idx + 1}
                          </td>
                          <td className="px-2 py-2.5 sm:px-4 sm:py-3 font-sans">
                            <Link to={`/jugadores/${p.id}`} className="flex items-center gap-3 group-hover:text-primary transition-all">
                              {p.foto ? (
                                <img src={getImageUrl(p.foto)} alt="" className="w-8 h-8 rounded-full object-cover border border-border/40 bg-card" />
                              ) : (
                                <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center font-display font-black text-[10px] text-foreground uppercase">
                                  {p.name?.charAt(0)}
                                </div>
                              )}
                              <div className="text-left">
                                <strong className="text-xs text-foreground block group-hover:text-primary font-bold">{p.name}</strong>
                                <span className="text-[9px] text-muted-foreground font-mono font-bold block">{p.equipo_nombre}</span>
                              </div>
                            </Link>
                          </td>
                          <td className="px-2 py-2.5 sm:px-4 sm:py-3 text-center">
                            <span className={`px-2 py-0.5 rounded text-[8px] font-black border uppercase tracking-wider ${badgeColor}`}>
                              {positionLabel}
                            </span>
                          </td>
                          <td className="px-2 py-2.5 sm:px-4 sm:py-3 text-center text-foreground font-bold">{p.partidos_jugados || 0}</td>
                          <td className="px-2 py-2.5 sm:px-4 sm:py-3 text-center text-primary font-bold">{formattedGoles}</td>
                          <td className="px-2 py-2.5 sm:px-4 sm:py-3 text-center text-foreground font-bold">{formattedAsist}</td>
                          <td className="px-2 py-2.5 sm:px-4 sm:py-3 text-center text-emerald-400 font-bold">{formattedQuites}</td>
                          <td className="px-2 py-2.5 sm:px-4 sm:py-3 text-center text-purple-400 font-bold">{formattedPorteria}</td>
                          <td className="px-2 py-2.5 sm:px-4 sm:py-3 text-center text-amber-500 font-bold">🏆 {p.total_mvp || 0}</td>
                          <td className="px-2 py-2.5 sm:px-4 sm:py-3 text-center text-foreground">
                            {p.total_tarjetas_rojas > 0 ? (
                              <span className="text-destructive font-black">🟥 {p.total_tarjetas_rojas}</span>
                            ) : (
                              <span className="text-muted-foreground/30">0</span>
                            )}
                          </td>
                          <td className="px-2 py-2.5 sm:px-4 sm:py-3 text-center font-black text-xs text-primary">{ovr}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* PAGINADOR DE JUGADORES */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 font-mono text-[10px] border-t border-border/20 pt-4 px-2">
                <span className="text-muted-foreground font-bold">
                  Mostrando {Math.min(filteredAndSortedPlayers.length, (playerPage - 1) * playersPerPage + 1)}-{Math.min(filteredAndSortedPlayers.length, playerPage * playersPerPage)} de {filteredAndSortedPlayers.length} competidores
                </span>
                
                <div className="flex items-center gap-1">
                  {/* First Page button */}
                  <button 
                    disabled={playerPage === 1}
                    onClick={() => setPlayerPage(1)}
                    className="w-7 h-7 rounded-lg border border-border/40 bg-card/20 text-foreground hover:bg-primary/10 hover:border-primary/30 transition-all disabled:opacity-30 disabled:pointer-events-none cursor-pointer flex items-center justify-center font-bold"
                    title="Primera página"
                  >
                    «
                  </button>
                  
                  {/* Prev Page button */}
                  <button 
                    disabled={playerPage === 1}
                    onClick={() => setPlayerPage(playerPage - 1)}
                    className="px-2.5 h-7 rounded-lg border border-border/40 bg-card/20 text-foreground hover:bg-primary/10 hover:border-primary/30 transition-all disabled:opacity-30 disabled:pointer-events-none cursor-pointer flex items-center justify-center gap-1 font-bold"
                  >
                    ‹ <span className="hidden sm:inline">Ant</span>
                  </button>

                  {/* Numbered window (desktop only) */}
                  <div className="hidden sm:flex items-center gap-1">
                    {playerPage > 3 && totalPlayerPages > 5 && (
                      <>
                        <button onClick={() => setPlayerPage(1)} className="w-7 h-7 rounded-lg text-[9px] font-black border border-border/40 hover:bg-card transition-all cursor-pointer">1</button>
                        <span className="text-muted-foreground px-0.5">...</span>
                      </>
                    )}
                    
                    {getVisiblePages(playerPage, totalPlayerPages).map((page) => (
                      <button
                        key={page}
                        onClick={() => setPlayerPage(page)}
                        className={`w-7 h-7 rounded-lg text-[9px] font-black border transition-all cursor-pointer ${
                          playerPage === page
                            ? 'bg-primary/25 border-primary text-primary shadow-[0_0_10px_hsla(var(--primary),0.3)]'
                            : 'border-border/40 hover:bg-card'
                        }`}
                      >
                        {page}
                      </button>
                    ))}

                    {playerPage < totalPlayerPages - 2 && totalPlayerPages > 5 && (
                      <>
                        <span className="text-muted-foreground px-0.5">...</span>
                        <button onClick={() => setPlayerPage(totalPlayerPages)} className="w-7 h-7 rounded-lg text-[9px] font-black border border-border/40 hover:bg-card transition-all cursor-pointer">{totalPlayerPages}</button>
                      </>
                    )}
                  </div>

                  {/* Page Indicator (mobile only) */}
                  <span className="flex sm:hidden items-center justify-center bg-primary/10 text-primary border border-primary/20 rounded-lg px-3 h-7 font-mono font-black text-[9px]">
                    {playerPage} / {totalPlayerPages}
                  </span>

                  {/* Next Page button */}
                  <button 
                    disabled={playerPage === totalPlayerPages}
                    onClick={() => setPlayerPage(playerPage + 1)}
                    className="px-2.5 h-7 rounded-lg border border-border/40 bg-card/20 text-foreground hover:bg-primary/10 hover:border-primary/30 transition-all disabled:opacity-30 disabled:pointer-events-none cursor-pointer flex items-center justify-center gap-1 font-bold"
                  >
                    <span className="hidden sm:inline">Sig</span> ›
                  </button>

                  {/* Last Page button */}
                  <button 
                    disabled={playerPage === totalPlayerPages}
                    onClick={() => setPlayerPage(totalPlayerPages)}
                    className="w-7 h-7 rounded-lg border border-border/40 bg-card/20 text-foreground hover:bg-primary/10 hover:border-primary/30 transition-all disabled:opacity-30 disabled:pointer-events-none cursor-pointer flex items-center justify-center font-bold"
                    title="Última página"
                  >
                    »
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="border border-border/30 border-dashed rounded-2xl p-12 text-center text-muted-foreground">
              <span className="text-3xl">🔍</span>
              <h4 className="text-xs font-display font-black text-foreground uppercase tracking-wider mt-2">Ningún Jugador Coincide</h4>
              <p className="text-[10px] font-light mt-1">Ajusta la búsqueda de texto o el filtro de demarcación táctica.</p>
            </div>
          )}
        </div>
      )}

      {/* CONTENIDO DE PESTAÑA: CLUBES */}
      {directoryTab === 'equipos' && (
        <div className="space-y-6">
          {/* Filtros del Directorio de Equipos */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            
            {/* Búsqueda */}
            <div className="space-y-1.5 text-left">
              <label className="text-[9px] font-mono font-black text-muted-foreground uppercase tracking-widest block">🔍 Buscar Club</label>
              <input 
                type="text"
                placeholder="Nombre de la escuadra..."
                value={teamSearch}
                onChange={(e) => setTeamSearch(e.target.value)}
                className="w-full bg-background/45 border border-border/40 hover:border-primary/45 rounded-xl px-4 py-2.5 text-xs font-mono font-bold text-foreground focus:outline-none focus:border-primary/50 transition-all placeholder:text-gray-600"
              />
            </div>

            {/* Ordenar por campo */}
            <div className="space-y-1.5 text-left">
              <label className="text-[9px] font-mono font-black text-muted-foreground uppercase tracking-widest block">📊 Métrica de Ordenación</label>
              <div className="relative">
                <select
                  value={teamSortField}
                  onChange={(e) => setTeamSortField(e.target.value)}
                  className="w-full bg-background/45 border border-border/40 hover:border-primary/45 rounded-xl px-4 py-2.5 text-xs font-mono font-bold text-foreground focus:outline-none focus:border-primary/50 transition-all appearance-none cursor-pointer"
                >
                  <option value="total_goles_favor">⚽ Goles a Favor (GF)</option>
                  <option value="total_goles_recibidos">🛡️ Goles Concedidos (GC)</option>
                  <option value="avg_precision_pases">🎯 Precisión de Pases</option>
                  <option value="partidos_jugados">📅 Partidos Disputados</option>
                </select>
                <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-muted-foreground text-[9px]">▼</div>
              </div>
            </div>

            {/* Dirección del orden */}
            <div className="space-y-1.5 text-left">
              <label className="text-[9px] font-mono font-black text-muted-foreground uppercase tracking-widest block">📈 Dirección</label>
              <div className="relative">
                <select
                  value={teamSortOrder}
                  onChange={(e) => setTeamSortOrder(e.target.value)}
                  className="w-full bg-background/45 border border-border/40 hover:border-primary/45 rounded-xl px-4 py-2.5 text-xs font-mono font-bold text-foreground focus:outline-none focus:border-primary/50 transition-all appearance-none cursor-pointer"
                >
                  <option value="desc">Descendente (Mayor a Menor)</option>
                  <option value="asc">Ascendente (Menor a Mayor)</option>
                </select>
                <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-muted-foreground text-[9px]">▼</div>
              </div>
            </div>

          </div>

          {/* Tabla / Grid de Equipos */}
          {paginatedTeams.length > 0 ? (
            <div className="space-y-4">
              <div className="overflow-x-auto rounded-2xl border border-border/30 bg-background/25">
                <table className="w-full text-left font-mono text-[11px] border-collapse min-w-[700px]">
                  <thead>
                    <tr className="bg-card/40 border-b border-border/30 text-gray-400 font-bold uppercase tracking-wider text-[9px]">
                      <th className="px-3 py-2.5 sm:px-5 sm:py-3.5 w-12">#</th>
                      <th className="px-3 py-2.5 sm:px-5 sm:py-3.5">Escuadra / Club</th>
                      <th className="px-3 py-2.5 sm:px-5 sm:py-3.5 text-center">Partidos</th>
                      <th className="px-3 py-2.5 sm:px-5 sm:py-3.5 text-center text-primary">Goles Favor (GF)</th>
                      <th className="px-3 py-2.5 sm:px-5 sm:py-3.5 text-center text-destructive">Goles Contra (GC)</th>
                      <th className="px-3 py-2.5 sm:px-5 sm:py-3.5 text-center">Diferencia (DG)</th>
                      <th className="px-3 py-2.5 sm:px-5 sm:py-3.5 text-center">Precisión de Pases</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/20">
                    {paginatedTeams.map((e, idx) => {
                      const gf = e.total_goles_favor || 0;
                      const gc = e.total_goles_recibidos || 0;
                      const diff = gf - gc;

                      return (
                        <tr key={e.id} className="hover:bg-card/25 transition-all group">
                          <td className="px-3 py-2.5 sm:px-5 sm:py-3 text-muted-foreground font-black">
                            #{(teamPage - 1) * teamsPerPage + idx + 1}
                          </td>
                          <td className="px-3 py-2.5 sm:px-5 sm:py-3 font-sans">
                            <Link to={`/equipos/${e.id}`} className="flex items-center gap-3 group-hover:text-primary transition-all">
                              {e.logo ? (
                                <img src={getImageUrl(e.logo)} alt="" className="w-8 h-8 rounded-full object-cover border border-border/40 bg-card" />
                              ) : (
                                <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center font-display font-black text-[10px] text-foreground uppercase">
                                  {e.nombre?.substring(0, 2)}
                                </div>
                              )}
                              <strong className="text-xs text-foreground block group-hover:text-primary font-bold">{e.nombre}</strong>
                            </Link>
                          </td>
                          <td className="px-3 py-2.5 sm:px-5 sm:py-3 text-center text-foreground font-bold">{e.partidos_jugados || 0}</td>
                          <td className="px-3 py-2.5 sm:px-5 sm:py-3 text-center text-primary font-black">{gf} GF</td>
                          <td className="px-3 py-2.5 sm:px-5 sm:py-3 text-center text-destructive font-black">{gc} GC</td>
                          <td className={`px-3 py-2.5 sm:px-5 sm:py-3 text-center font-black ${diff >= 0 ? 'text-emerald-400' : 'text-rose-500'}`}>
                            {diff > 0 ? `+${diff}` : diff}
                          </td>
                          <td className="px-3 py-2.5 sm:px-5 sm:py-3 text-center text-foreground font-bold">{e.avg_precision_pases || 0}%</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* PAGINADOR DE EQUIPOS */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 font-mono text-[10px] border-t border-border/20 pt-4 px-2">
                <span className="text-muted-foreground font-bold">
                  Mostrando {Math.min(filteredAndSortedTeams.length, (teamPage - 1) * teamsPerPage + 1)}-{Math.min(filteredAndSortedTeams.length, teamPage * teamsPerPage)} de {filteredAndSortedTeams.length} clubes
                </span>
                
                <div className="flex items-center gap-1">
                  {/* First Page button */}
                  <button 
                    disabled={teamPage === 1}
                    onClick={() => setTeamPage(1)}
                    className="w-7 h-7 rounded-lg border border-border/40 bg-card/20 text-foreground hover:bg-primary/10 hover:border-primary/30 transition-all disabled:opacity-30 disabled:pointer-events-none cursor-pointer flex items-center justify-center font-bold"
                    title="Primera página"
                  >
                    «
                  </button>
                  
                  {/* Prev Page button */}
                  <button 
                    disabled={teamPage === 1}
                    onClick={() => setTeamPage(teamPage - 1)}
                    className="px-2.5 h-7 rounded-lg border border-border/40 bg-card/20 text-foreground hover:bg-primary/10 hover:border-primary/30 transition-all disabled:opacity-30 disabled:pointer-events-none cursor-pointer flex items-center justify-center gap-1 font-bold"
                  >
                    ‹ <span className="hidden sm:inline">Ant</span>
                  </button>

                  {/* Numbered window (desktop only) */}
                  <div className="hidden sm:flex items-center gap-1">
                    {teamPage > 3 && totalTeamPages > 5 && (
                      <>
                        <button onClick={() => setTeamPage(1)} className="w-7 h-7 rounded-lg text-[9px] font-black border border-border/40 hover:bg-card transition-all cursor-pointer">1</button>
                        <span className="text-muted-foreground px-0.5">...</span>
                      </>
                    )}
                    
                    {getVisiblePages(teamPage, totalTeamPages).map((page) => (
                      <button
                        key={page}
                        onClick={() => setTeamPage(page)}
                        className={`w-7 h-7 rounded-lg text-[9px] font-black border transition-all cursor-pointer ${
                          teamPage === page
                            ? 'bg-primary/25 border-primary text-primary shadow-[0_0_10px_hsla(var(--primary),0.3)]'
                            : 'border-border/40 hover:bg-card'
                        }`}
                      >
                        {page}
                      </button>
                    ))}

                    {teamPage < totalTeamPages - 2 && totalTeamPages > 5 && (
                      <>
                        <span className="text-muted-foreground px-0.5">...</span>
                        <button onClick={() => setTeamPage(totalTeamPages)} className="w-7 h-7 rounded-lg text-[9px] font-black border border-border/40 hover:bg-card transition-all cursor-pointer">{totalTeamPages}</button>
                      </>
                    )}
                  </div>

                  {/* Page Indicator (mobile only) */}
                  <span className="flex sm:hidden items-center justify-center bg-primary/10 text-primary border border-primary/20 rounded-lg px-3 h-7 font-mono font-black text-[9px]">
                    {teamPage} / {totalTeamPages}
                  </span>

                  {/* Next Page button */}
                  <button 
                    disabled={teamPage === totalTeamPages}
                    onClick={() => setTeamPage(teamPage + 1)}
                    className="px-2.5 h-7 rounded-lg border border-border/40 bg-card/20 text-foreground hover:bg-primary/10 hover:border-primary/30 transition-all disabled:opacity-30 disabled:pointer-events-none cursor-pointer flex items-center justify-center gap-1 font-bold"
                  >
                    <span className="hidden sm:inline">Sig</span> ›
                  </button>

                  {/* Last Page button */}
                  <button 
                    disabled={teamPage === totalTeamPages}
                    onClick={() => setTeamPage(totalTeamPages)}
                    className="w-7 h-7 rounded-lg border border-border/40 bg-card/20 text-foreground hover:bg-primary/10 hover:border-primary/30 transition-all disabled:opacity-30 disabled:pointer-events-none cursor-pointer flex items-center justify-center font-bold"
                    title="Última página"
                  >
                    »
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="border border-border/30 border-dashed rounded-2xl p-12 text-center text-muted-foreground">
              <span className="text-3xl">🔍</span>
              <h4 className="text-xs font-display font-black text-foreground uppercase tracking-wider mt-2">Ningún Club Coincide</h4>
              <p className="text-[10px] font-light mt-1">Ajusta la búsqueda de texto para encontrar escuadras.</p>
            </div>
          )}
        </div>
      )}

    </div>
  );
}
