import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '@/api/axios';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Card from '@/components/shared/Card';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(dateStr) {
  if (!dateStr) return 'N/A';
  return new Date(dateStr).toLocaleDateString('es-CL', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
}

function groupBy(array, key) {
  return array.reduce((map, item) => {
    const k = item[key] || 'Sin Grupo';
    if (!map[k]) map[k] = [];
    map[k].push(item);
    return map;
  }, {});
}

/** Compute standings from a flat list of partidos filtered to relevant equipo IDs */
function computeStandings(partidos, equipos) {
  const map = {};
  equipos.forEach(eq => {
    map[eq.id] = {
      id: eq.id, nombre: eq.nombre, abreviatura: eq.abreviatura,
      pj: 0, pg: 0, pe: 0, pp: 0, gf: 0, gc: 0, pts: 0,
    };
  });
  partidos.forEach(p => {
    if (p.goles_local == null || p.goles_visitante == null) return;
    const gl = p.goles_local, gv = p.goles_visitante;
    const lid = p.equipo_local_id, vid = p.equipo_visitante_id;
    if (!map[lid] || !map[vid]) return;
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

// ─── Sub-components ───────────────────────────────────────────────────────────

const getImageUrl = (path) => {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  const backendBaseUrl = api.defaults.baseURL?.replace('/api', '') || 'http://localhost:8000';
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${backendBaseUrl}${cleanPath}`;
};

function MatchCard({ partido }) {
  const navigate = useNavigate();
  const today = new Date().toISOString().split('T')[0];
  const isLive = partido.fecha && partido.fecha === today;
  const isFinished = partido.goles_local != null && partido.goles_visitante != null;
  const teamL = partido.local?.nombre || 'Por definir';
  const teamV = partido.visitante?.nombre || 'Por definir';
  const localWinner = isFinished && partido.goles_local > partido.goles_visitante;
  const visitaWinner = isFinished && partido.goles_visitante > partido.goles_local;

  return (
    <div
      className={`relative overflow-hidden rounded-2xl glass-hud-panel p-5 flex flex-col md:flex-row justify-between items-center gap-6 md:gap-10 border transition-all duration-300 scanlines select-none ${
        isLive ? 'live-match-flash border-primary/50 bg-primary/5' : 'border-border/45'
      }`}
    >
      <div className="absolute inset-0 hud-noise pointer-events-none opacity-40"></div>

      {/* LEFT: Hora + Estado */}
      <div className="flex md:flex-col items-center md:items-start justify-between w-full md:w-auto shrink-0 gap-2 border-b md:border-b-0 md:border-r border-border/30 dark:border-white/[0.08] pb-3 md:pb-0 md:pr-8">
        <div className="text-center md:text-left">
          <span className="text-[9px] font-condensed text-muted-foreground font-black tracking-widest block uppercase">HORA DE TRANSMISIÓN</span>
          <span className="text-xl font-display font-black text-foreground tracking-widest leading-none mt-1 block">
            {partido.hora || 'Por definir'}
          </span>
        </div>
        <div className="mt-1">
          {isLive ? (
            <span className="inline-flex items-center gap-1.5 text-[9px] font-condensed font-black tracking-widest text-primary bg-primary/10 border border-primary/35 px-3 py-1 rounded">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-ping" /> EN VIVO
            </span>
          ) : isFinished ? (
            <span className="inline-flex items-center gap-1.5 text-[9px] font-condensed font-black tracking-widest text-muted-foreground bg-muted border border-border/50 px-3 py-1 rounded">
              FINALIZADO
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 text-[9px] font-condensed font-black tracking-widest text-primary/95 bg-primary/5 border border-primary/20 px-3 py-1 rounded">
              PROGRAMADO
            </span>
          )}
        </div>
      </div>

      {/* CENTER: Team A - Score - Team B (Aligned like eSports broadcast banner) */}
      <div className="flex-1 flex items-center justify-between gap-6 md:gap-10 w-full min-w-0">
        
        {/* Local Team */}
        <div className="flex-1 flex items-center justify-end gap-3 min-w-0 text-right">
          <span className={`text-xs md:text-sm font-condensed font-black uppercase tracking-wider truncate ${localWinner ? 'text-primary' : 'text-foreground'}`}>
            {teamL}
          </span>
          {partido.local?.logo ? (
            <img 
              src={getImageUrl(partido.local.logo)} 
              alt={teamL} 
              className="w-9 h-9 rounded-xl object-cover border bg-background shadow-inner shrink-0" 
            />
          ) : (
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border bg-background font-display font-black text-sm uppercase ${
              localWinner ? 'border-primary text-primary shadow-[0_0_10px_rgba(232,0,29,0.15)]' : 'border-border/50 text-muted-foreground'
            }`}>
              {partido.local?.abreviatura || teamL.charAt(0)}
            </div>
          )}
        </div>

        {/* Score in Center */}
        <div className="shrink-0 min-w-[84px] text-center">
          <span className="text-2xl md:text-3xl font-display font-black tracking-widest leading-none block">
            <span className={localWinner ? 'text-primary' : 'text-foreground'}>{isFinished || isLive ? partido.goles_local : ''}</span>
            <span className="text-muted-foreground/30 mx-2">{isFinished || isLive ? '–' : 'VS'}</span>
            <span className={visitaWinner ? 'text-primary' : 'text-foreground'}>{isFinished || isLive ? partido.goles_visitante : ''}</span>
          </span>
          {partido.jornada && (
            <span className="text-[8px] font-condensed font-bold text-muted-foreground uppercase tracking-widest mt-1 block">
              {partido.jornada}
            </span>
          )}
        </div>

        {/* Visitante Team */}
        <div className="flex-1 flex items-center justify-start gap-3 min-w-0 text-left">
          {partido.visitante?.logo ? (
            <img 
              src={getImageUrl(partido.visitante.logo)} 
              alt={teamV} 
              className="w-9 h-9 rounded-xl object-cover border bg-background shadow-inner shrink-0" 
            />
          ) : (
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border bg-background font-display font-black text-sm uppercase ${
              visitaWinner ? 'border-primary text-primary shadow-[0_0_10px_rgba(232,0,29,0.15)]' : 'border-border/50 text-muted-foreground'
            }`}>
              {partido.visitante?.abreviatura || teamV.charAt(0)}
            </div>
          )}
          <span className={`text-xs md:text-sm font-condensed font-black uppercase tracking-wider truncate ${visitaWinner ? 'text-primary' : 'text-foreground'}`}>
            {teamV}
          </span>
        </div>

      </div>

      {/* RIGHT: Watch / Detalle Button */}
      <div className="shrink-0 w-full md:w-auto border-t md:border-t-0 md:border-l border-border/30 dark:border-white/[0.08] pt-4 md:pt-0 md:pl-8 flex justify-center">
        <button
          onClick={() => navigate(`/partidos/${partido.id}`)}
          className="w-full md:w-32 py-3 px-6 text-[10px] font-condensed font-black tracking-widest uppercase bg-primary/15 text-primary border border-primary/35 rounded-xl hover:bg-primary hover:text-primary-foreground hover:shadow-[0_0_15px_rgba(232,0,29,0.45)] transition-all duration-300 cursor-pointer font-black"
        >
          {isLive ? '🔴 VER DUELO' : isFinished ? 'ANALIZAR' : 'VER DETALLES'}
        </button>
      </div>

    </div>
  );
}

function StandingsTable({ standings, title }) {
  return (
    <div className="border border-border/50 bg-card/25 backdrop-blur-md rounded-2xl overflow-hidden shadow-lg">
      {title && (
        <div className="px-5 py-3 bg-muted/30 border-b border-border/40">
          <span className="text-xs font-black uppercase tracking-widest text-primary">{title}</span>
        </div>
      )}
      <table className="w-full text-sm text-left border-collapse">
        <thead>
          <tr className="border-b border-border/50 bg-muted/30 text-[9px] uppercase font-black text-muted-foreground tracking-widest font-mono">
            <th className="px-4 py-3 text-center w-10">#</th>
            <th className="px-4 py-3">Club</th>
            <th className="px-4 py-3 text-center w-12">PJ</th>
            <th className="px-4 py-3 text-center w-12 text-emerald-400">PG</th>
            <th className="px-4 py-3 text-center w-12">PE</th>
            <th className="px-4 py-3 text-center w-12 text-destructive">PP</th>
            <th className="px-4 py-3 text-center w-12">GF</th>
            <th className="px-4 py-3 text-center w-12">GC</th>
            <th className="px-4 py-3 text-center w-14">DG</th>
            <th className="px-4 py-3 text-center w-16 text-primary">Pts</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border/30 text-xs font-semibold">
          {standings.length === 0 ? (
            <tr>
              <td colSpan={10} className="px-5 py-8 text-center text-muted-foreground italic">Sin resultados aún</td>
            </tr>
          ) : standings.map((s, idx) => (
            <tr key={s.id} className="hover:bg-primary/5 transition-colors">
              <td className="px-4 py-3 text-center">
                <span className={`inline-flex items-center justify-center w-6 h-6 rounded font-black font-mono text-[10px] ${
                  idx === 0 ? 'bg-gradient-to-tr from-amber-400 to-yellow-600 text-slate-950 shadow' :
                  idx === 1 ? 'bg-gradient-to-tr from-slate-300 to-slate-500 text-slate-950' :
                  idx === 2 ? 'bg-gradient-to-tr from-amber-700 to-amber-900 text-amber-100' :
                  'bg-muted text-foreground'
                }`}>{idx + 1}</span>
              </td>
              <td className="px-4 py-3 font-bold text-foreground uppercase">{s.nombre}</td>
              <td className="px-4 py-3 text-center font-mono">{s.pj}</td>
              <td className="px-4 py-3 text-center font-mono text-emerald-400">{s.pg}</td>
              <td className="px-4 py-3 text-center font-mono text-muted-foreground">{s.pe}</td>
              <td className="px-4 py-3 text-center font-mono text-destructive">{s.pp}</td>
              <td className="px-4 py-3 text-center font-mono">{s.gf}</td>
              <td className="px-4 py-3 text-center font-mono">{s.gc}</td>
              <td className={`px-4 py-3 text-center font-mono ${s.gf - s.gc >= 0 ? 'text-emerald-400' : 'text-destructive'}`}>
                {s.gf - s.gc > 0 ? `+${s.gf - s.gc}` : s.gf - s.gc}
              </td>
              <td className="px-4 py-3 text-center font-mono text-primary font-black">{s.pts}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const ROUND_ORDER = [
  'fase previa', 'ronda previa', 'play-in',
  'ronda de 64', 'ronda de 32', 'ronda de 16', 'octavos',
  'cuartos', 'cuartos de final',
  'semifinal', 'semis',
  'tercer puesto', '3er puesto',
  'final',
];

function getRoundWeight(jornada = '') {
  const j = jornada.toLowerCase();
  const idx = ROUND_ORDER.findIndex(r => j.includes(r));
  return idx === -1 ? 50 : idx;
}

function BracketMatchCard({ matchup }) {
  const leg1 = matchup.leg1;
  const leg2 = matchup.leg2;

  // Si solo hay un partido (Solo Ida)
  if (!leg2) {
    const hasResult = leg1.goles_local != null && leg1.goles_visitante != null;
    const localW  = hasResult && leg1.goles_local  > leg1.goles_visitante;
    const visitaW = hasResult && leg1.goles_visitante > leg1.goles_local;
    const isTBD   = !leg1.local && !leg1.visitante;

    return (
      <div className="border border-border/50 bg-card/30 backdrop-blur-md rounded-xl overflow-hidden shadow-md w-52 shrink-0">
        {/* Local */}
        <div className={`flex items-center justify-between px-3 py-2 border-b border-border/30 transition-colors ${
          localW ? 'bg-primary/15 border-primary/20' : ''
        }`}>
          <div className="flex items-center gap-2 min-w-0">
            <div className={`w-6 h-6 rounded font-display font-black text-[9px] flex items-center justify-center uppercase shrink-0 ${
              localW ? 'bg-primary text-primary-foreground' : 'bg-muted/60 text-foreground'
            }`}>
              {leg1.local?.abreviatura?.slice(0,3) || '?'}
            </div>
            <span className={`text-xs font-black uppercase truncate ${
              localW ? 'text-primary' : 'text-foreground'
            }`}>
              {leg1.local?.nombre || (isTBD ? 'Por definir' : 'TBD')}
            </span>
          </div>
          <span className={`text-sm font-black font-mono ml-2 shrink-0 ${
            localW ? 'text-primary' : hasResult ? 'text-foreground' : 'text-muted-foreground/40'
          }`}>
            {hasResult ? leg1.goles_local : '-'}
          </span>
        </div>
        {/* Visitante */}
        <div className={`flex items-center justify-between px-3 py-2 transition-colors ${
          visitaW ? 'bg-primary/15' : ''
        }`}>
          <div className="flex items-center gap-2 min-w-0">
            <div className={`w-6 h-6 rounded font-display font-black text-[9px] flex items-center justify-center uppercase shrink-0 ${
              visitaW ? 'bg-primary text-primary-foreground' : 'bg-muted/60 text-foreground'
            }`}>
              {leg1.visitante?.abreviatura?.slice(0,3) || '?'}
            </div>
            <span className={`text-xs font-black uppercase truncate ${
              visitaW ? 'text-primary' : 'text-foreground'
            }`}>
              {leg1.visitante?.nombre || (isTBD ? 'Por definir' : 'TBD')}
            </span>
          </div>
          <span className={`text-sm font-black font-mono ml-2 shrink-0 ${
            visitaW ? 'text-primary' : hasResult ? 'text-foreground' : 'text-muted-foreground/40'
          }`}>
            {hasResult ? leg1.goles_visitante : '-'}
          </span>
        </div>
        {/* Footer */}
        <div className="px-3 py-1.5 bg-muted/10 border-t border-border/20 text-center">
          {hasResult ? (
            <span className="text-[8px] font-bold text-emerald-400 uppercase tracking-widest">✅ Finalizado</span>
          ) : leg1.fecha ? (
            <span className="text-[8px] font-mono text-muted-foreground">{leg1.fecha} {leg1.hora || ''}</span>
          ) : (
            <span className="text-[8px] font-bold text-muted-foreground/50 uppercase tracking-wider">⏳ Pendiente</span>
          )}
        </div>
      </div>
    );
  }

  // Si hay dos partidos (Ida y Vuelta)
  const hasRes1 = leg1.goles_local != null && leg1.goles_visitante != null;
  const hasRes2 = leg2.goles_local != null && leg2.goles_visitante != null;
  const hasResult = hasRes1 && hasRes2;

  const scoreA = (leg1.goles_local || 0) + (leg2.goles_visitante || 0);
  const scoreB = (leg1.goles_visitante || 0) + (leg2.goles_local || 0);

  const localW = hasResult && scoreA > scoreB;
  const visitaW = hasResult && scoreB > scoreA;
  const isTBD = !leg1.local && !leg1.visitante;

  return (
    <div className="border border-border/50 bg-card/30 backdrop-blur-md rounded-xl overflow-hidden shadow-md w-60 shrink-0">
      {/* Team A (Local en Ida) */}
      <div className={`flex items-center justify-between px-3 py-1.5 border-b border-border/30 transition-colors ${
        localW ? 'bg-primary/15 border-primary/20' : ''
      }`}>
        <div className="flex items-center gap-2 min-w-0">
          <div className={`w-6 h-6 rounded font-display font-black text-[9px] flex items-center justify-center uppercase shrink-0 ${
            localW ? 'bg-primary text-primary-foreground' : 'bg-muted/60 text-foreground'
          }`}>
            {leg1.local?.abreviatura?.slice(0,3) || '?'}
          </div>
          <span className={`text-xs font-black uppercase truncate ${
            localW ? 'text-primary' : 'text-foreground'
          }`}>
            {leg1.local?.nombre || (isTBD ? 'Por definir' : 'TBD')}
          </span>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="text-[10px] font-bold text-muted-foreground/60 bg-muted/20 px-1 py-0.5 rounded font-mono">
            {hasRes1 ? leg1.goles_local : '-'}
          </span>
          <span className="text-[10px] font-bold text-muted-foreground/60 bg-muted/20 px-1 py-0.5 rounded font-mono">
            {hasRes2 ? leg2.goles_visitante : '-'}
          </span>
          <span className={`text-xs font-black font-mono ml-1 w-6 text-center ${
            localW ? 'text-primary' : hasResult ? 'text-foreground' : 'text-muted-foreground/30'
          }`}>
            {hasResult ? scoreA : ''}
          </span>
        </div>
      </div>

      {/* Team B (Visitante en Ida) */}
      <div className={`flex items-center justify-between px-3 py-1.5 transition-colors ${
        visitaW ? 'bg-primary/15' : ''
      }`}>
        <div className="flex items-center gap-2 min-w-0">
          <div className={`w-6 h-6 rounded font-display font-black text-[9px] flex items-center justify-center uppercase shrink-0 ${
            visitaW ? 'bg-primary text-primary-foreground' : 'bg-muted/60 text-foreground'
          }`}>
            {leg1.visitante?.abreviatura?.slice(0,3) || '?'}
          </div>
          <span className={`text-xs font-black uppercase truncate ${
            visitaW ? 'text-primary' : 'text-foreground'
          }`}>
            {leg1.visitante?.nombre || (isTBD ? 'Por definir' : 'TBD')}
          </span>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="text-[10px] font-bold text-muted-foreground/60 bg-muted/20 px-1 py-0.5 rounded font-mono">
            {hasRes1 ? leg1.goles_visitante : '-'}
          </span>
          <span className="text-[10px] font-bold text-muted-foreground/60 bg-muted/20 px-1 py-0.5 rounded font-mono">
            {hasRes2 ? leg2.goles_local : '-'}
          </span>
          <span className={`text-xs font-black font-mono ml-1 w-6 text-center ${
            visitaW ? 'text-primary' : hasResult ? 'text-foreground' : 'text-muted-foreground/30'
          }`}>
            {hasResult ? scoreB : ''}
          </span>
        </div>
      </div>

      {/* Footer */}
      <div className="px-3 py-1 bg-muted/10 border-t border-border/20 text-center flex justify-between text-[8px] font-mono text-muted-foreground">
        <span>Ida: {leg1.fecha || 'TBD'}</span>
        <span>Vuelta: {leg2.fecha || 'TBD'}</span>
      </div>
    </div>
  );
}

/** Renders a horizontal side-by-side playoff bracket */
function PlayoffBracket({ partidos }) {
  const rounds = useMemo(() => {
    const map = {};
    partidos.forEach(p => {
      const key = p.jornada || 'Ronda';
      if (!map[key]) map[key] = [];
      map[key].push(p);
    });

    // Sort rounds and group adjacent/swapped matches into matchups
    return Object.entries(map)
      .sort(([a], [b]) => getRoundWeight(a) - getRoundWeight(b))
      .map(([roundName, roundMatches]) => {
        const matchups = [];
        const visited = new Set();

        for (let i = 0; i < roundMatches.length; i++) {
          if (visited.has(i)) continue;
          const current = roundMatches[i];
          let paired = null;

          for (let j = i + 1; j < roundMatches.length; j++) {
            if (visited.has(j)) continue;
            const candidate = roundMatches[j];

            const matchSwapped = (
              current.local?.id && candidate.local?.id &&
              current.local.id === candidate.visitante?.id &&
              current.visitante?.id === candidate.local.id
            );

            const matchTBDAdjacent = (
              (!current.local && !current.visitante && !candidate.local && !candidate.visitante) &&
              (j === i + 1)
            );

            if (matchSwapped || matchTBDAdjacent) {
              paired = candidate;
              visited.add(j);
              break;
            }
          }

          visited.add(i);
          matchups.push({
            id: current.id,
            jornada: current.jornada,
            local: current.local,
            visitante: current.visitante,
            leg1: current,
            leg2: paired
          });
        }

        return [roundName, matchups];
      });
  }, [partidos]);

  if (rounds.length === 0) {
    return <p className="text-center text-sm text-muted-foreground italic py-10">No hay partidos de eliminatorias registrados aún.</p>;
  }

  return (
    <div className="overflow-x-auto pb-4">
      <div className="flex gap-6 min-w-max">
        {rounds.map(([round, matchups]) => (
          <div key={round} className="flex flex-col gap-4" style={{ minWidth: 220 }}>
            <div className="text-[10px] font-black uppercase tracking-widest text-primary border-b border-primary/30 pb-1 mb-1">
              {round}
            </div>
            <div className="flex flex-col gap-4">
              {matchups.map((m, i) => (
                <BracketMatchCard key={m.id ?? i} matchup={m} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Liga Fixture Tab ─────────────────────────────────────────────────────────

function FixturaLiga({ partidos }) {
  const jornadas = useMemo(() => groupBy(partidos, 'jornada'), [partidos]);
  const jornadaKeys = useMemo(() => {
    return Object.keys(jornadas).sort((a, b) => {
      const numA = parseInt(a.replace(/^\D+/g, ''), 10);
      const numB = parseInt(b.replace(/^\D+/g, ''), 10);
      if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
      return a.localeCompare(b);
    });
  }, [jornadas]);

  const [activeJornadaIndex, setActiveJornadaIndex] = useState(0);

  // Reset selected index if matches list changes
  useEffect(() => {
    setActiveJornadaIndex(0);
  }, [partidos]);

  if (jornadaKeys.length === 0) {
    return <p className="text-center text-sm text-muted-foreground italic py-10">No hay partidos registrados en el calendario aún.</p>;
  }

  const currentJornada = jornadaKeys[activeJornadaIndex];
  const currentMatches = jornadas[currentJornada] || [];

  return (
    <div className="space-y-6">
      {/* Paginador de Jornadas */}
      {jornadaKeys.length > 1 && (
        <div className="flex items-center justify-between bg-card/25 backdrop-blur-md border border-border/40 p-3.5 rounded-2xl max-w-md mx-auto shadow-lg relative overflow-hidden scanlines">
          <div className="absolute inset-0 hud-noise pointer-events-none opacity-20"></div>
          <button
            disabled={activeJornadaIndex === 0}
            onClick={() => setActiveJornadaIndex(prev => prev - 1)}
            className="px-4 py-2 rounded-xl border border-border/50 bg-card/85 text-xs font-condensed tracking-wider font-bold text-muted-foreground hover:text-foreground disabled:opacity-20 hover:border-primary/30 transition-all duration-200 cursor-pointer select-none"
          >
            ◀ Anterior
          </button>
          
          <span className="text-xs font-black uppercase tracking-widest text-primary font-display bg-primary/10 border border-primary/20 px-5 py-2 rounded-full shadow-[0_0_15px_rgba(232,0,29,0.1)]">
            {currentJornada}
          </span>

          <button
            disabled={activeJornadaIndex === jornadaKeys.length - 1}
            onClick={() => setActiveJornadaIndex(prev => prev + 1)}
            className="px-4 py-2 rounded-xl border border-border/50 bg-card/85 text-xs font-condensed tracking-wider font-bold text-muted-foreground hover:text-foreground disabled:opacity-20 hover:border-primary/30 transition-all duration-200 cursor-pointer select-none"
          >
            Siguiente ▶
          </button>
        </div>
      )}

      {/* Render Current Matches */}
      <div className="space-y-3.5">
        {currentMatches.map((p, i) => (
          <MatchCard key={p.id ?? i} partido={p} />
        ))}
      </div>
    </div>
  );
}

// ─── Copa Fixture Tab ─────────────────────────────────────────────────────────

function FixturaCopa({ partidos }) {
  const grupoPartidos   = useMemo(() => partidos.filter(p => p.grupo), [partidos]);
  const knockoutPartidos = useMemo(() => partidos.filter(p => !p.grupo), [partidos]);
  const grupos = useMemo(() => groupBy(grupoPartidos, 'grupo'), [grupoPartidos]);

  return (
    <div className="space-y-10">
      {Object.keys(grupos).length > 0 && (
        <div className="space-y-6">
          <h3 className="text-lg font-display font-black text-foreground uppercase tracking-wider">📋 Fase de Grupos</h3>
          <div className="space-y-6">
            {Object.entries(grupos).map(([grupo, ps]) => (
              <div key={grupo} className="space-y-3">
                <div className="text-xs font-black uppercase tracking-widest text-primary border-b border-primary/30 pb-1">Grupo {grupo}</div>
                <div className="space-y-3.5">
                  {ps.map((p, i) => <MatchCard key={p.id ?? i} partido={p} />)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {knockoutPartidos.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-display font-black text-foreground uppercase tracking-wider">🏆 Fase Eliminatoria</h3>
          <PlayoffBracket partidos={knockoutPartidos} />
        </div>
      )}

      {partidos.length === 0 && (
        <p className="text-center text-sm text-muted-foreground italic py-10">No hay partidos registrados aún.</p>
      )}
    </div>
  );
}

// ─── Tabla Liga ───────────────────────────────────────────────────────────────

function TablaLiga({ partidos, equipos }) {
  const standings = useMemo(() => computeStandings(partidos, equipos), [partidos, equipos]);
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-display font-black text-foreground uppercase tracking-wider">📊 Tabla de Posiciones</h3>
      <StandingsTable standings={standings} />
    </div>
  );
}

// ─── Tabla Copa (por grupos) ──────────────────────────────────────────────────

function TablaCopa({ partidos, equipos }) {
  const grupoPartidos = useMemo(() => partidos.filter(p => p.grupo), [partidos]);
  const grupos = useMemo(() => groupBy(grupoPartidos, 'grupo'), [grupoPartidos]);
  const grupoKeys = Object.keys(grupos);

  if (grupoKeys.length === 0) {
    return <p className="text-center text-sm text-muted-foreground italic py-10">Sin datos de grupos registrados aún.</p>;
  }

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-display font-black text-foreground uppercase tracking-wider">📊 Posiciones por Grupo</h3>
      {grupoKeys.map(grupo => {
        const teamIds = new Set(grupos[grupo].flatMap(p => [p.equipo_local_id, p.equipo_visitante_id]));
        const grupoEquipos = equipos.filter(eq => teamIds.has(eq.id));
        const standings = computeStandings(grupos[grupo], grupoEquipos);
        return <StandingsTable key={grupo} standings={standings} title={`Grupo ${grupo}`} />;
      })}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function DetalleCompetenciaPublica() {
  const { compId } = useParams();
  const navigate = useNavigate();
  const [competencia, setCompetencia] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeSubTab, setActiveSubTab] = useState('detalles');

  const partidos = competencia?.partidos || [];
  const equipos  = competencia?.equipos  || [];
  const formato  = (competencia?.formato || 'liga').toLowerCase();
  const isPlayoff = formato === 'playoffs' || formato === 'playoff';
  const isCopa    = formato === 'copa';
  const isLiga    = !isPlayoff && !isCopa;

  // Extract unique dates from partidos
  const uniqueDates = useMemo(() => {
    const dates = new Set();
    partidos.forEach(p => {
      if (p.fecha) dates.add(p.fecha);
    });
    return Array.from(dates).sort();
  }, [partidos]);

  const [dateIndex, setDateIndex] = useState(0);

  // Active Date selector
  const activeDate = useMemo(() => {
    if (uniqueDates.length === 0) return null;
    return uniqueDates[dateIndex];
  }, [uniqueDates, dateIndex]);

  // Filtered partidos by date
  const filteredPartidos = useMemo(() => {
    if (!activeDate) return partidos;
    return partidos.filter(p => p.fecha === activeDate);
  }, [partidos, activeDate]);

  // Format dates for selector
  const formattedDates = useMemo(() => {
    const weekdays = ['DOM', 'LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB'];
    const months = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'];
    
    return uniqueDates.map(dateStr => {
      const d = new Date(`${dateStr}T00:00:00`);
      const weekdayStr = weekdays[d.getDay()].toLowerCase();
      const monthStr = months[d.getMonth()].toLowerCase();
      
      const count = partidos.filter(p => p.fecha === dateStr).length;
      
      return {
        dateStr,
        dayNum: d.getDate(),
        label: `${weekdayStr}/${monthStr}`,
        count
      };
    });
  }, [uniqueDates, partidos]);

  useEffect(() => {
    if (!compId) return;
    const fetchDetalle = async () => {
      try {
        const res = await api.get(`/competencias/${compId}`);
        setCompetencia(res.data?.data || res.data);
      } catch (err) {
        console.error('Error al cargar ficha del torneo:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDetalle();
  }, [compId]);

  if (loading) {
    return (
      <div className="pt-28 pb-16 min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 space-y-8">
          <div className="skeleton-shimmer h-20 rounded-2xl"></div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="skeleton-shimmer h-80 rounded-xl"></div>
            <div className="lg:col-span-2 skeleton-shimmer h-96 rounded-xl"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!competencia) {
    return (
      <div className="pt-28 pb-16 text-center max-w-2xl mx-auto space-y-4">
        <h2 className="text-xl font-display font-black text-foreground uppercase">Torneo No Encontrado</h2>
        <Button onClick={() => navigate('/organizaciones')}>Volver al listado</Button>
      </div>
    );
  }

  const formatoLabel = isLiga ? '🏟️ Liga' : isPlayoff ? '🏆 Playoffs' : '🥇 Copa';

  const tabs = [
    { id: 'detalles', label: 'Detalles y Reglas', icon: '📋' },
    { id: 'equipos',  label: `Clubes (${equipos.length})`, icon: '🛡️' },
    { id: 'fixture',  label: 'Calendario / Partidos', icon: '📅' },
    { id: 'tabla',    label: isPlayoff ? 'Cuadro Eliminatorio' : 'Tabla de Posiciones', icon: '📊' },
  ];
  return (
    <div className="relative min-h-screen bg-background pt-28 pb-16 overflow-hidden">

      {/* Ambient glows */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/10 blur-[120px] rounded-full pointer-events-none z-10 animate-pulse-glow" />
      <div className="absolute bottom-10 right-10 w-[400px] h-[400px] bg-primary/3 blur-[110px] rounded-full pointer-events-none z-0"></div>

      {/* Sleek Navigation Back Button Row */}
      <div className="max-w-7xl mx-auto px-6 lg:px-10 mt-4 pb-4 flex justify-start items-center relative z-30">
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center gap-2.5 px-4 py-2 rounded-xl border border-border/50 bg-card/35 backdrop-blur-md text-xs font-condensed tracking-wider font-bold text-muted-foreground hover:text-primary hover:border-primary/45 transition-all duration-300 shadow-md active:scale-95 group cursor-pointer"
        >
          <span className="group-hover:-translate-x-1 transition-transform duration-300">←</span>
          VOLVER AL TORNEO
        </button>
      </div>

      <div className="relative z-20 max-w-7xl mx-auto px-6 lg:px-10 space-y-8">

        {/* 2. HERO CENTRAL (Cinemático y Táctico - Estilo Organizaciones con Banner) */}
        <section className="relative z-20 max-w-7xl mx-auto overflow-hidden rounded-3xl border border-border/40 bg-card/45 backdrop-blur-md shadow-2xl mt-8">
          
          {/* Banner image as header */}
          <div className="relative h-56 md:h-72 w-full overflow-hidden border-b border-border/40">
            {competencia.banner || competencia.temporada?.organizacion?.banner ? (
              <img 
                src={getImageUrl(competencia.banner || competencia.temporada?.organizacion?.banner)} 
                alt={competencia.nombre} 
                className="w-full h-full object-cover opacity-85" 
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-r from-primary/10 via-background to-primary/5 flex items-center justify-center">
                <span className="text-muted-foreground text-xs uppercase tracking-widest font-condensed">Sin banner oficial</span>
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-card via-card/40 to-transparent z-10"></div>
          </div>

          <div className="p-6 md:p-8 relative z-10 -mt-14 md:-mt-16">
            {/* Palabras de fondo brush estilo editorial */}
            <div className="absolute inset-0 pointer-events-none select-none overflow-hidden z-0">
              <span className="absolute top-2 left-10 text-[9rem] md:text-[14rem] font-display font-black uppercase text-foreground/[0.015] dark:text-foreground/[0.025] blur-[2px] float-brush-1">
                TORNEO
              </span>
              <span className="absolute bottom-2 right-20 text-[9rem] md:text-[14rem] font-display font-black uppercase text-foreground/[0.015] dark:text-foreground/[0.025] blur-[3px] float-brush-2">
                FIXTURE
              </span>
            </div>

            {/* Transparent background number */}
            <div className="absolute -top-16 -left-12 text-[15rem] md:text-[23rem] font-display font-black text-foreground/[0.035] dark:text-foreground/[0.045] select-none leading-none pointer-events-none font-extrabold tracking-tighter">
              {String(equipos.length || 1).padStart(2, '0')}
            </div>

            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
              <div className="flex items-center gap-4">
                {competencia.logo ? (
                  <img 
                    src={getImageUrl(competencia.logo)} 
                    alt={competencia.nombre} 
                    className="w-16 h-16 md:w-20 md:h-20 rounded-2xl object-cover border-4 border-card bg-card shadow-xl shrink-0"
                  />
                ) : (
                  <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-gradient-to-br from-primary/20 to-background border-4 border-card flex items-center justify-center font-display font-black text-primary text-3xl shrink-0">
                    {competencia.nombre?.charAt(0)}
                  </div>
                )}
                <div>
                  <Badge variant="primary" className="px-2.5 py-1 text-[10px] font-condensed tracking-widest text-primary border border-primary/30 bg-primary/10 rounded-full animate-pulse-glow">
                    {competencia.temporada?.organizacion?.nombre} / {competencia.temporada?.nombre}
                  </Badge>
                  <h1 className="text-4xl md:text-6xl font-display font-black text-foreground uppercase tracking-normal leading-[0.8] drop-shadow-2xl mt-2">
                    {competencia.nombre}
                  </h1>
                </div>
              </div>
              <div className="flex flex-col items-end gap-2 shrink-0">
                <Badge variant="outline" className="text-primary font-mono text-xs uppercase px-3 py-1.5 border-primary/30">
                  {formatoLabel}
                </Badge>
                <Badge variant="outline" className="text-muted-foreground font-mono text-[10px] uppercase px-2 py-1 border-border/40">
                  {competencia.estado || 'activo'}
                </Badge>
              </div>
            </div>
          </div>
        </section>

        {/* 3-col layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            <Card className="p-6 border border-border/50 backdrop-blur-md bg-card/25 shadow-lg relative overflow-hidden" withGlow>
              <h3 className="font-display font-black text-2xl text-foreground uppercase tracking-wider mb-4 border-b border-border/40 pb-2">
                ⚡ Ficha Rápida
              </h3>
              <div className="space-y-4 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-2.5 bg-muted/10 border border-border/30 rounded-xl">
                    <span className="text-[9px] text-muted-foreground font-black uppercase tracking-wider block">Bolsa de Premios</span>
                    <span className="font-bold text-primary text-sm font-mono">${competencia.prize_pool || '0.00'}</span>
                  </div>
                  <div className="p-2.5 bg-muted/10 border border-border/30 rounded-xl">
                    <span className="text-[9px] text-muted-foreground font-black uppercase tracking-wider block">Inscripción</span>
                    <span className="font-bold text-foreground text-sm font-mono">
                      {competencia.entry_fee > 0 ? `$${competencia.entry_fee}` : 'Gratis'}
                    </span>
                  </div>
                </div>

                <div className="p-3 bg-muted/10 border border-border/30 rounded-xl space-y-2">
                  <span className="text-[9px] text-muted-foreground font-black uppercase tracking-wider block">Cronograma</span>
                  <div className="space-y-1.5 text-muted-foreground font-semibold">
                    {[
                      ['Inicio Inscripciones', competencia.fecha_inicio_inscripciones],
                      ['Cierre Inscripciones', competencia.fecha_fin_inscripciones],
                      ['Patada Inicial',        competencia.fecha_inicio_competencia],
                    ].map(([label, val]) => (
                      <div key={label} className="flex justify-between">
                        <span>{label}:</span>
                        <span className="text-foreground font-mono">{fmt(val)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-2.5 bg-muted/10 border border-border/30 rounded-xl">
                    <span className="text-[9px] text-muted-foreground font-black uppercase tracking-wider block">Plataforma</span>
                    <span className="font-bold text-foreground uppercase">{competencia.plataforma}</span>
                  </div>
                  <div className="p-2.5 bg-muted/10 border border-border/30 rounded-xl">
                    <span className="text-[9px] text-muted-foreground font-black uppercase tracking-wider block">Cupos</span>
                    <span className="font-bold text-foreground font-mono">{equipos.length} / {competencia.max_participantes}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-2.5 bg-muted/10 border border-border/30 rounded-xl">
                    <span className="text-[9px] text-muted-foreground font-black uppercase tracking-wider block">Partidos</span>
                    <span className="font-bold text-foreground font-mono">{partidos.length}</span>
                  </div>
                  <div className="p-2.5 bg-muted/10 border border-border/30 rounded-xl">
                    <span className="text-[9px] text-muted-foreground font-black uppercase tracking-wider block">Jugados</span>
                    <span className="font-bold text-emerald-400 font-mono">
                      {partidos.filter(p => p.goles_local != null).length}
                    </span>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Main */}
          <div className="lg:col-span-2 space-y-6 animate-fade-in-up" style={{ animationDelay: '0.15s' }}>
            {/* Tabs */}
            <div className="flex gap-1 bg-muted/40 p-1 rounded-lg border border-border/40 overflow-x-auto">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveSubTab(tab.id)}
                  className={`flex items-center gap-1.5 px-4 py-2.5 rounded-md text-xs font-bold whitespace-nowrap transition-all duration-200 ${
                    activeSubTab === tab.id
                      ? 'bg-background text-primary shadow-sm border border-border/40'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
                  }`}
                >
                  <span>{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="animate-fade-in">
              {/* DETALLES */}
              {activeSubTab === 'detalles' && (
                <div className="border border-border/50 bg-card/25 backdrop-blur-md rounded-2xl p-6 space-y-6 shadow-lg">
                  <div className="space-y-2">
                    <h3 className="text-xl font-display font-black text-foreground uppercase tracking-wide">Sobre la Competencia</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {competencia.descripcion || 'Este torneo reúne a los mejores Pro Clubs en una contienda táctica oficial.'}
                    </p>
                  </div>
                  <div className="h-px bg-border/40" />
                  <div className="space-y-2">
                    <h3 className="text-xl font-display font-black text-foreground uppercase tracking-wide">Reglamento Táctico</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                      {competencia.reglas || '1. Respetar los horarios de fixture.\n2. Conexiones estables de red obligatorias.\n3. Reporte de capturas oficiales del partido.'}
                    </p>
                  </div>
                </div>
              )}

              {/* EQUIPOS */}
              {activeSubTab === 'equipos' && (
                <div className="space-y-4">
                  {equipos.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {equipos.map(eq => (
                        <div
                          key={eq.id}
                          className="border border-border/50 bg-card/25 backdrop-blur-md rounded-xl p-4 flex items-center gap-4 hover:border-primary/45 transition-colors shadow-sm"
                        >
                          {eq.logo ? (
                            <img src={eq.logo} alt={eq.nombre} className="w-10 h-10 rounded-lg object-cover border border-border/40" />
                          ) : (
                            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary/10 to-destructive/10 border border-primary/20 flex items-center justify-center font-display font-black text-primary text-sm uppercase shrink-0">
                              {eq.abreviatura || eq.nombre?.charAt(0)}
                            </div>
                          )}
                          <div>
                            <p className="text-sm font-bold text-foreground leading-none">{eq.nombre}</p>
                            <span className="text-[10px] font-mono text-muted-foreground uppercase">{eq.abreviatura} • {eq.plataforma}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground italic py-8 text-center bg-card/25 border border-border/50 rounded-2xl">
                      Aún no se registran escuadras aprobadas en este certamen.
                    </p>
                  )}
                </div>
              )}

              {/* FIXTURE */}
              {activeSubTab === 'fixture' && (
                <div className="space-y-6">
                  {/* Date Selector Strip if dates exist */}
                  {formattedDates.length > 0 && (
                    <div className="flex items-center gap-3 bg-card/25 backdrop-blur-md border border-border/40 p-4 rounded-2xl">
                      {/* Left Arrow */}
                      <button
                        disabled={dateIndex === 0}
                        onClick={() => setDateIndex(prev => Math.max(0, prev - 1))}
                        className="p-3.5 rounded-xl border border-border/40 dark:border-white/[0.06] bg-card/85 text-muted-foreground hover:text-foreground disabled:opacity-20 hover:border-primary/40 transition-all duration-300 cursor-pointer shrink-0"
                      >
                        ◀
                      </button>

                      {/* Carousel wrapper */}
                      <div className="flex-1 flex gap-3 overflow-x-auto pb-1.5 custom-scrollbar">
                        {formattedDates.map((item, idx) => {
                          const isActive = dateIndex === idx;
                          return (
                            <button
                              key={idx}
                              onClick={() => setDateIndex(idx)}
                              className={`flex-1 min-w-[84px] py-3.5 px-2.5 rounded-2xl border flex flex-col items-center gap-1.5 transition-all duration-300 cursor-pointer ${
                                isActive
                                  ? 'bg-primary text-primary-foreground border-primary active-date-glow scale-105'
                                  : 'bg-card/70 text-muted-foreground border-border/45 dark:border-white/[0.06] hover:border-primary/30 hover:text-foreground'
                              }`}
                            >
                              <span className="text-[9px] font-condensed font-black tracking-widest uppercase">{item.label}</span>
                              <span className="text-xl font-display font-black leading-none">{item.dayNum}</span>
                              <span className={`text-[8px] font-condensed font-black px-1.5 py-0.5 rounded-full mt-1.5 transition-colors ${
                                isActive 
                                  ? 'bg-white/20 text-white' 
                                  : item.count > 0 
                                  ? 'bg-primary/10 text-primary border border-primary/20' 
                                  : 'bg-muted text-muted-foreground'
                              }`}>
                                {item.count} {item.count === 1 ? 'partido' : 'partidos'}
                              </span>
                            </button>
                          );
                        })}
                      </div>

                      {/* Right Arrow */}
                      <button
                        disabled={dateIndex === uniqueDates.length - 1}
                        onClick={() => setDateIndex(prev => Math.min(uniqueDates.length - 1, prev + 1))}
                        className="p-3.5 rounded-xl border border-border/40 dark:border-white/[0.06] bg-card/85 text-muted-foreground hover:text-foreground disabled:opacity-20 hover:border-primary/40 transition-all duration-300 cursor-pointer shrink-0"
                      >
                        ▶
                      </button>
                    </div>
                  )}

                  {/* Render filtered matches based on active Date */}
                  {isLiga    && <FixturaLiga    partidos={filteredPartidos} />}
                  {isPlayoff && <PlayoffBracket partidos={filteredPartidos} />}
                  {isCopa    && <FixturaCopa    partidos={filteredPartidos} />}
                </div>
              )}

              {/* TABLA */}
              {activeSubTab === 'tabla' && (
                <>
                  {isLiga && <TablaLiga partidos={partidos} equipos={equipos} />}
                  {isCopa && <TablaCopa partidos={partidos} equipos={equipos} />}
                  {isPlayoff && (
                    <div className="border border-border/50 bg-card/25 backdrop-blur-md rounded-2xl p-8 text-center shadow-lg">
                      <div className="text-5xl mb-4">🏆</div>
                      <h3 className="text-xl font-display font-black text-foreground uppercase tracking-wider mb-2">Formato Eliminatorio</h3>
                      <p className="text-sm text-muted-foreground max-w-md mx-auto">
                        Los playoffs no tienen tabla de posiciones. Consulta el cuadro de eliminación en la pestaña{' '}
                        <button
                          onClick={() => setActiveSubTab('fixture')}
                          className="text-primary underline underline-offset-2 font-bold hover:no-underline"
                        >
                          Calendario / Partidos
                        </button>.
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
