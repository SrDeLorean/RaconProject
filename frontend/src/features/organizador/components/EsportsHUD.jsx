import React, { useMemo } from 'react';
import { useTorneoData } from '../hooks/useTorneoData';

/** Helper to compute standings from a flat list of partidos */
function computeStandings(partidos, equipos, filterTeamIds = null) {
  const map = {};
  const targetEquipos = filterTeamIds 
    ? equipos.filter(e => filterTeamIds.includes(e.id))
    : equipos;

  targetEquipos.forEach(eq => {
    map[eq.id] = {
      id: eq.id, nombre: eq.nombre, abreviatura: eq.abreviatura,
      pj: 0, pg: 0, pe: 0, pp: 0, gf: 0, gc: 0, pts: 0,
    };
  });
  partidos.forEach(p => {
    if (p.goles_local == null || p.goles_visitante == null) return;
    const gl = p.goles_local, gv = p.goles_visitante;
    const lid = p.equipo_local_id, vid = p.equipo_visitante_id;
    
    if (!lid || !vid || !map[lid] || !map[vid]) return;
    
    map[lid].pj++; map[vid].pj++;
    map[lid].gf += gl; map[lid].gc += gv;
    map[vid].gf += gv; map[vid].gc += gl;
    if (gl > gv)      { map[lid].pg++; map[lid].pts += 3; map[vid].pp++; }
    else if (gl < gv) { map[vid].pg++; map[vid].pts += 3; map[lid].pp++; }
    else              { map[lid].pe++; map[lid].pts++; map[vid].pe++; map[vid].pts++; }
  });
  return Object.values(map).sort(
    (a, b) => b.pts - a.pts || (b.gf - b.gc) - (a.gf - a.gc) || b.gf - a.gf
  );
}

export default function EsportsHUD({ competenciaId, title = "HUD DE CLASIFICACIÓN EN TIEMPO REAL" }) {
  const { data: competencia, loading, error, refreshData } = useTorneoData(competenciaId);

  const partidos = competencia?.partidos || [];
  const equipos = competencia?.equipos || [];

  const grupoPartidos = useMemo(() => partidos.filter(p => p.grupo), [partidos]);
  const isCopa = grupoPartidos.length > 0;

  const gruposData = useMemo(() => {
    if (!isCopa) return null;
    const groupsMap = {};
    const groupTeamsMap = {};

    grupoPartidos.forEach(p => {
      const g = p.grupo;
      if (!groupsMap[g]) groupsMap[g] = [];
      groupsMap[g].push(p);

      if (!groupTeamsMap[g]) groupTeamsMap[g] = new Set();
      if (p.equipo_local_id) groupTeamsMap[g].add(p.equipo_local_id);
      if (p.equipo_visitante_id) groupTeamsMap[g].add(p.equipo_visitante_id);
    });

    const result = {};
    Object.keys(groupsMap).sort().forEach(g => {
      const teamIds = Array.from(groupTeamsMap[g] || []);
      result[g] = computeStandings(groupsMap[g], equipos, teamIds);
    });
    return result;
  }, [grupoPartidos, equipos, isCopa]);

  const standings = useMemo(() => {
    if (isCopa) return [];
    return computeStandings(partidos, equipos);
  }, [partidos, equipos, isCopa]);

  if (!competenciaId) {
    return (
      <div className="p-6 rounded-2xl border border-dashed border-border/30 text-center text-xs text-muted-foreground">
        Selecciona una división o competencia activa para desplegar la telemetría del HUD.
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-3xl border border-border/40 bg-card/25 backdrop-blur-md shadow-2xl p-6 select-none scanlines">
      {/* Ambient noise & grid styling */}
      <div className="absolute inset-0 hud-noise pointer-events-none opacity-20"></div>
      
      {/* Decorative cyber grid corners */}
      <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-primary/50"></div>
      <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-primary/50"></div>
      <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-primary/50"></div>
      <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-primary/50"></div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/20 pb-4 mb-4">
        <div>
          <span className="text-[9px] font-mono text-primary font-black tracking-[0.2em] block uppercase">{title}</span>
          <h3 className="text-lg font-display font-black text-foreground uppercase tracking-wide mt-1">
            {competencia?.nombre || "Cargando división..."}
          </h3>
        </div>

        {/* Cyberpunk Refetch Button */}
        <button
          disabled={loading}
          onClick={refreshData}
          className="relative inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-primary/35 bg-primary/10 text-[10px] font-condensed font-black tracking-widest text-primary uppercase hover:bg-primary hover:text-primary-foreground hover:shadow-[0_0_15px_rgba(232,0,29,0.35)] active:scale-95 transition-all duration-300 disabled:opacity-50 cursor-pointer select-none"
        >
          <svg
            className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2.5"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99"
            />
          </svg>
          <span>{loading ? 'SINCRONIZANDO...' : 'ACTUALIZAR RESULTADOS'}</span>
        </button>
      </div>

      {error ? (
        <div className="text-xs text-rose-400 font-bold bg-rose-500/5 border border-rose-500/10 rounded-xl p-4">
          {error}
        </div>
      ) : loading && !competencia ? (
        <div className="py-12 flex flex-col items-center justify-center gap-2">
          <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-primary"></div>
          <span className="text-[9px] uppercase font-bold text-muted-foreground tracking-wider font-mono">Estableciendo enlace de datos...</span>
        </div>
      ) : (
        isCopa && gruposData ? (
          <div className="space-y-6 animate-fade-in">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {Object.keys(gruposData).map(groupName => {
                const groupStandings = gruposData[groupName];
                return (
                  <div key={groupName} className="border border-border/30 bg-black/35 rounded-2xl overflow-hidden shadow-inner">
                    <div className="px-4 py-2 bg-muted/20 border-b border-border/40 text-[10px] font-condensed font-black tracking-widest text-primary uppercase">
                      Grupo {groupName}
                    </div>
                    <table className="w-full text-xs text-left border-collapse font-mono">
                      <thead>
                        <tr className="border-b border-border/40 bg-muted/10 text-[8px] uppercase font-black text-muted-foreground tracking-widest">
                          <th className="px-3 py-1.5 text-center w-8">#</th>
                          <th className="px-3 py-1.5">Club</th>
                          <th className="px-3 py-1.5 text-center w-8">PJ</th>
                          <th className="px-3 py-1.5 text-center w-8 text-emerald-400">PG</th>
                          <th className="px-3 py-1.5 text-center w-8">PE</th>
                          <th className="px-3 py-1.5 text-center w-8 text-rose-400">PP</th>
                          <th className="px-3 py-1.5 text-center w-10 text-primary">Pts</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/20 text-[10px] font-bold">
                        {groupStandings.length === 0 ? (
                          <tr>
                            <td colSpan={7} className="px-3 py-4 text-center text-muted-foreground italic">
                              Sin equipos.
                            </td>
                          </tr>
                        ) : (
                          groupStandings.map((s, idx) => (
                            <tr key={s.id} className="hover:bg-primary/5 transition-colors duration-150">
                              <td className="px-3 py-2 text-center">
                                <span className={`inline-flex items-center justify-center w-4 h-4 rounded font-black text-[8px] ${
                                  idx === 0 ? 'bg-gradient-to-tr from-amber-400 to-yellow-600 text-slate-950 shadow-[0_0_6px_rgba(245,158,11,0.3)]' :
                                  idx === 1 ? 'bg-gradient-to-tr from-slate-300 to-slate-500 text-slate-950' :
                                  idx === 2 ? 'bg-gradient-to-tr from-amber-700 to-amber-900 text-amber-100' :
                                  'bg-muted text-foreground'
                                }`}>
                                  {idx + 1}
                                </span>
                              </td>
                              <td className="px-3 py-2 font-black text-foreground uppercase tracking-wider truncate max-w-[100px]">
                                {s.nombre}
                              </td>
                              <td className="px-3 py-2 text-center text-muted-foreground">{s.pj}</td>
                              <td className="px-3 py-2 text-center text-emerald-400">{s.pg}</td>
                              <td className="px-3 py-2 text-center text-muted-foreground">{s.pe}</td>
                              <td className="px-3 py-2 text-center text-rose-400">{s.pp}</td>
                              <td className="px-3 py-2 text-center text-primary font-black text-[11px]">{s.pts}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                );
              })}
            </div>
            <div className="flex justify-between items-center text-[8px] font-mono text-muted-foreground tracking-widest uppercase">
              <span>SISTEMA DE DETECCIÓN AUTOMÁTICA ACTIVO</span>
              <span>TTL CACHÉ BACKEND: 5 MIN</span>
            </div>
          </div>
        ) : (
          <div className="space-y-4 animate-fade-in">
            <div className="border border-border/30 bg-black/35 rounded-2xl overflow-hidden shadow-inner">
              <table className="w-full text-xs text-left border-collapse font-mono">
                <thead>
                  <tr className="border-b border-border/40 bg-muted/20 text-[9px] uppercase font-black text-muted-foreground tracking-widest">
                    <th className="px-4 py-2 text-center w-10">#</th>
                    <th className="px-4 py-2">Club</th>
                    <th className="px-4 py-2 text-center w-10">PJ</th>
                    <th className="px-4 py-2 text-center w-10 text-emerald-400">PG</th>
                    <th className="px-4 py-2 text-center w-10">PE</th>
                    <th className="px-4 py-2 text-center w-10 text-rose-400">PP</th>
                    <th className="px-4 py-2 text-center w-12 text-primary">Pts</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/20 text-[11px] font-bold">
                  {standings.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-6 text-center text-muted-foreground italic">
                        Sin estadísticas registradas.
                      </td>
                    </tr>
                  ) : (
                    standings.map((s, idx) => (
                      <tr key={s.id} className="hover:bg-primary/5 transition-colors duration-150">
                        <td className="px-4 py-2.5 text-center">
                          <span className={`inline-flex items-center justify-center w-5 h-5 rounded font-black text-[9px] ${
                            idx === 0 ? 'bg-gradient-to-tr from-amber-400 to-yellow-600 text-slate-950 shadow-[0_0_8px_rgba(245,158,11,0.3)]' :
                            idx === 1 ? 'bg-gradient-to-tr from-slate-300 to-slate-500 text-slate-950' :
                            idx === 2 ? 'bg-gradient-to-tr from-amber-700 to-amber-900 text-amber-100' :
                            'bg-muted text-foreground'
                          }`}>
                            {idx + 1}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 font-black text-foreground uppercase tracking-wider truncate max-w-[120px]">
                          {s.nombre}
                        </td>
                        <td className="px-4 py-2.5 text-center text-muted-foreground">{s.pj}</td>
                        <td className="px-4 py-2.5 text-center text-emerald-400">{s.pg}</td>
                        <td className="px-4 py-2.5 text-center text-muted-foreground">{s.pe}</td>
                        <td className="px-4 py-2.5 text-center text-rose-400">{s.pp}</td>
                        <td className="px-4 py-2.5 text-center text-primary font-black text-xs">{s.pts}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex justify-between items-center text-[8px] font-mono text-muted-foreground tracking-widest uppercase">
              <span>SISTEMA DE DETECCIÓN AUTOMÁTICA ACTIVO</span>
              <span>TTL CACHÉ BACKEND: 5 MIN</span>
            </div>
          </div>
        )
      )}
    </div>
  );
}
