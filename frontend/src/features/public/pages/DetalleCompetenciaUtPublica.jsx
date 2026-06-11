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
    // Actually we need to return map correctly
  }, {});
}

/** Compute standings from a flat list of partidos filtered to UT equipo IDs */
function computeUtStandings(partidos, equipos) {
  const map = {};
  equipos.forEach(eq => {
    map[eq.id] = {
      id: eq.id, nombre: eq.nombre,
      pj: 0, pg: 0, pe: 0, pp: 0, gf: 0, gc: 0, pts: 0,
    };
  });
  partidos.forEach(p => {
    if (p.goles_local == null || p.goles_visitante == null) return;
    const gl = p.goles_local, gv = p.goles_visitante;
    const lid = p.equipo_ut_local_id, vid = p.equipo_ut_visitante_id;
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

const getImageUrl = (path) => {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  if (typeof window.mediaUrl === 'function') {
    return window.mediaUrl(path);
  }
  const backendBaseUrl = api.defaults.baseURL?.replace(/\/api$/, '') ;
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
        isLive ? 'live-match-flash border-primary/50 bg-primary/5' : 'border-border/45 dark:border-white/[0.06]'
      }`}
    >
      <div className="absolute inset-0 hud-noise pointer-events-none opacity-40"></div>

      {/* LEFT: Hora + Estado */}
      <div className="flex md:flex-col items-center md:items-start justify-between w-full md:w-auto shrink-0 gap-2 border-b md:border-b-0 md:border-r border-border/30 dark:border-white/[0.08] pb-3 md:pb-0 md:pr-8">
        <div className="text-center md:text-left">
          <span className="text-[9px] font-condensed text-muted-foreground font-black tracking-widest block uppercase">TRANSMISIÓN UT</span>
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

      {/* CENTER: Teams & Score */}
      <div className="flex-1 flex items-center justify-between gap-6 md:gap-10 w-full min-w-0">
        
        {/* Local Team */}
        <div className="flex-1 flex items-center justify-end gap-3 min-w-0 text-right">
          <span className={`text-xs md:text-sm font-condensed font-black uppercase tracking-wider truncate ${localWinner ? 'text-primary' : 'text-foreground'}`}>
            {teamL}
          </span>
          {partido.local?.logo && partido.local.logo !== 'default.png' ? (
            <img 
              src={getImageUrl(partido.local.logo)} 
              alt={teamL} 
              className="w-9 h-9 rounded-xl object-cover border bg-background shadow-inner shrink-0" 
            />
          ) : (
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border bg-background font-display font-black text-sm uppercase ${
              localWinner ? 'border-primary text-primary shadow-[0_0_10px_rgba(232,0,29,0.15)]' : 'border-border/50 text-muted-foreground'
            }`}>
              {teamL.slice(0, 3)}
            </div>
          )}
        </div>

        {/* Score */}
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
          {partido.visitante?.logo && partido.visitante.logo !== 'default.png' ? (
            <img 
              src={getImageUrl(partido.visitante.logo)} 
              alt={teamV} 
              className="w-9 h-9 rounded-xl object-cover border bg-background shadow-inner shrink-0" 
            />
          ) : (
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border bg-background font-display font-black text-sm uppercase ${
              visitaWinner ? 'border-primary text-primary shadow-[0_0_10px_rgba(232,0,29,0.15)]' : 'border-border/50 text-muted-foreground'
            }`}>
              {teamV.slice(0, 3)}
            </div>
          )}
          <span className={`text-xs md:text-sm font-condensed font-black uppercase tracking-wider truncate ${visitaWinner ? 'text-primary' : 'text-foreground'}`}>
            {teamV}
          </span>
        </div>

      </div>

      {/* RIGHT: Analyze Button */}
      <div className="shrink-0 w-full md:w-auto border-t md:border-t-0 md:border-l border-border/30 dark:border-white/[0.08] pt-4 md:pt-0 md:pl-8 flex justify-center">
        <button
          onClick={() => navigate(`/partidos-ut/${partido.id}`)}
          className="w-full md:w-32 py-3 px-6 text-[10px] font-condensed font-black tracking-widest uppercase bg-primary/15 text-primary border border-primary/35 rounded-xl hover:bg-primary hover:text-primary-foreground hover:shadow-[0_0_15px_rgba(232,0,29,0.45)] transition-all duration-300 cursor-pointer font-black"
        >
          {isFinished ? 'ANALIZAR' : 'VER DETALLES'}
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
            <th className="px-4 py-3">Participante</th>
            <th className="px-4 py-3 text-center w-12">PJ</th>
            <th className="hidden sm:table-cell px-4 py-3 text-center w-12 text-emerald-400">PG</th>
            <th className="hidden sm:table-cell px-4 py-3 text-center w-12">PE</th>
            <th className="hidden sm:table-cell px-4 py-3 text-center w-12 text-destructive">PP</th>
            <th className="hidden md:table-cell px-4 py-3 text-center w-12">GF</th>
            <th className="hidden md:table-cell px-4 py-3 text-center w-12">GC</th>
            <th className="px-4 py-3 text-center w-14">DG</th>
            <th className="px-4 py-3 text-center w-16 text-primary">Pts</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border/30 text-xs font-semibold">
          {standings.length === 0 ? (
            <tr>
              <td colSpan={10} className="px-5 py-8 text-center text-muted-foreground italic">Sin resultados registrados</td>
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
              <td className="hidden sm:table-cell px-4 py-3 text-center font-mono text-emerald-400">{s.pg}</td>
              <td className="hidden sm:table-cell px-4 py-3 text-center font-mono text-muted-foreground">{s.pe}</td>
              <td className="hidden sm:table-cell px-4 py-3 text-center font-mono text-destructive">{s.pp}</td>
              <td className="hidden md:table-cell px-4 py-3 text-center font-mono">{s.gf}</td>
              <td className="hidden md:table-cell px-4 py-3 text-center font-mono">{s.gc}</td>
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

  if (!leg2) {
    const hasResult = leg1.goles_local != null && leg1.goles_visitante != null;
    const localW  = hasResult && leg1.goles_local  > leg1.goles_visitante;
    const visitaW = hasResult && leg1.goles_visitante > leg1.goles_local;
    const isTBD   = !leg1.local && !leg1.visitante;

    return (
      <div className="border border-border/50 bg-card/30 backdrop-blur-md rounded-xl overflow-hidden shadow-md w-52 shrink-0">
        <div className={`flex items-center justify-between px-3 py-2 border-b border-border/30 transition-colors ${
          localW ? 'bg-primary/15 border-primary/20' : ''
        }`}>
          <span className={`text-xs font-black uppercase truncate ${localW ? 'text-primary' : 'text-foreground'}`}>
            {leg1.local?.nombre || (isTBD ? 'Por definir' : 'TBD')}
          </span>
          <span className={`text-sm font-black font-mono ml-2 shrink-0 ${
            localW ? 'text-primary' : hasResult ? 'text-foreground' : 'text-muted-foreground/40'
          }`}>
            {hasResult ? leg1.goles_local : '-'}
          </span>
        </div>
        <div className={`flex items-center justify-between px-3 py-2 transition-colors ${
          visitaW ? 'bg-primary/15' : ''
        }`}>
          <span className={`text-xs font-black uppercase truncate ${visitaW ? 'text-primary' : 'text-foreground'}`}>
            {leg1.visitante?.nombre || (isTBD ? 'Por definir' : 'TBD')}
          </span>
          <span className={`text-sm font-black font-mono ml-2 shrink-0 ${
            visitaW ? 'text-primary' : hasResult ? 'text-foreground' : 'text-muted-foreground/40'
          }`}>
            {hasResult ? leg1.goles_visitante : '-'}
          </span>
        </div>
        <div className="px-3 py-1.5 bg-muted/10 border-t border-border/20 text-center text-[8px] font-mono text-muted-foreground">
          {hasResult ? '✅ Finalizado' : leg1.fecha ? `${leg1.fecha} ${leg1.hora || ''}` : '⏳ Pendiente'}
        </div>
      </div>
    );
  }

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
      <div className={`flex items-center justify-between px-3 py-1.5 border-b border-border/30 transition-colors ${
        localW ? 'bg-primary/15 border-primary/20' : ''
      }`}>
        <span className={`text-xs font-black uppercase truncate ${localW ? 'text-primary' : 'text-foreground'}`}>
          {leg1.local?.nombre || (isTBD ? 'Por definir' : 'TBD')}
        </span>
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="text-[10px] font-bold text-muted-foreground/60 bg-muted/20 px-1 py-0.5 rounded font-mono">{hasRes1 ? leg1.goles_local : '-'}</span>
          <span className="text-[10px] font-bold text-muted-foreground/60 bg-muted/20 px-1 py-0.5 rounded font-mono">{hasRes2 ? leg2.goles_visitante : '-'}</span>
          <span className={`text-xs font-black font-mono ml-1 w-6 text-center ${localW ? 'text-primary' : hasResult ? 'text-foreground' : 'text-muted-foreground/30'}`}>{hasResult ? scoreA : ''}</span>
        </div>
      </div>
      <div className={`flex items-center justify-between px-3 py-1.5 transition-colors ${
        visitaW ? 'bg-primary/15' : ''
      }`}>
        <span className={`text-xs font-black uppercase truncate ${visitaW ? 'text-primary' : 'text-foreground'}`}>
          {leg1.visitante?.nombre || (isTBD ? 'Por definir' : 'TBD')}
        </span>
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="text-[10px] font-bold text-muted-foreground/60 bg-muted/20 px-1 py-0.5 rounded font-mono">{hasRes1 ? leg1.goles_visitante : '-'}</span>
          <span className="text-[10px] font-bold text-muted-foreground/60 bg-muted/20 px-1 py-0.5 rounded font-mono">{hasRes2 ? leg2.goles_local : '-'}</span>
          <span className={`text-xs font-black font-mono ml-1 w-6 text-center ${visitaW ? 'text-primary' : hasResult ? 'text-foreground' : 'text-muted-foreground/30'}`}>{hasResult ? scoreB : ''}</span>
        </div>
      </div>
      <div className="px-3 py-1 bg-muted/10 border-t border-border/20 text-center flex justify-between text-[8px] font-mono text-muted-foreground">
        <span>Ida: {leg1.fecha || 'TBD'}</span>
        <span>Vuelta: {leg2.fecha || 'TBD'}</span>
      </div>
    </div>
  );
}

function PlayoffBracket({ partidos }) {
  const rounds = useMemo(() => {
    const map = {};
    partidos.forEach(p => {
      const key = p.jornada || 'Ronda';
      if (!map[key]) map[key] = [];
      map[key].push(p);
    });

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
    return <p className="text-center text-sm text-muted-foreground italic py-10">No hay llaves registradas aún.</p>;
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

  useEffect(() => {
    setActiveJornadaIndex(0);
  }, [partidos]);

  if (jornadaKeys.length === 0) {
    return <p className="text-center text-sm text-muted-foreground italic py-10">No hay partidos calendarizados aún.</p>;
  }

  const currentJornada = jornadaKeys[activeJornadaIndex];
  const currentMatches = jornadas[currentJornada] || [];

  return (
    <div className="space-y-6 animate-fade-in">
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

      <div className="space-y-3.5">
        {currentMatches.map((p, i) => (
          <MatchCard key={p.id ?? i} partido={p} />
        ))}
      </div>
    </div>
  );
}

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

function TablaLiga({ partidos, equipos }) {
  const standings = useMemo(() => computeUtStandings(partidos, equipos), [partidos, equipos]);
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-display font-black text-foreground uppercase tracking-wider">📊 Tabla de Posiciones</h3>
      <StandingsTable standings={standings} />
    </div>
  );
}

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
        const teamIds = new Set(grupos[grupo].flatMap(p => [p.equipo_ut_local_id, p.equipo_ut_visitante_id]));
        const grupoEquipos = equipos.filter(eq => teamIds.has(eq.id));
        const standings = computeUtStandings(grupos[grupo], grupoEquipos);
        return <StandingsTable key={grupo} standings={standings} title={`Grupo ${grupo}`} />;
      })}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function DetalleCompetenciaUtPublica() {
  const { compId } = useParams();
  const navigate = useNavigate();
  const [competencia, setCompetencia] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeSubTab, setActiveSubTab] = useState('detalles');

  const partidos = competencia?.partidos || [];
  const equipos  = competencia?.equipos  || [];
  const formato  = (competencia?.formato || 'liga').toLowerCase();
  const isPlayoff = formato === 'playoffs' || formato === 'playoff' || formato === 'eliminatoria';
  const isCopa    = formato === 'copa';
  const isLiga    = !isPlayoff && !isCopa;

  useEffect(() => {
    if (!compId) return;
    const fetchDetalle = async () => {
      try {
        const res = await api.get(`/competencias-ut/${compId}`);
        setCompetencia(res.data?.data || res.data);
      } catch (err) {
        console.error('Error al cargar ficha del torneo UT:', err);
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
        <h2 className="text-xl font-display font-black text-foreground uppercase">Torneo UT No Encontrado</h2>
        <Button onClick={() => navigate(-1)}>Volver atrás</Button>
      </div>
    );
  }

  const tabs = [
    { id: 'detalles', label: 'Detalles y Reglas', icon: '📋' },
    { id: 'equipos',  label: `Participantes (${equipos.length})`, icon: '👥' },
    { id: 'fixture',  label: 'Calendario / Partidos', icon: '📅' },
    { id: 'tabla',    label: isPlayoff ? 'Cuadro Eliminatorio' : 'Tabla de Posiciones', icon: '📊' },
  ];

  return (
    <div className="relative min-h-screen bg-background pt-28 pb-16 overflow-hidden">
      
      {/* Ambient glows */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/10 blur-[120px] rounded-full pointer-events-none z-10 animate-pulse-glow" />
      <div className="absolute bottom-10 right-10 w-[400px] h-[400px] bg-primary/3 blur-[110px] rounded-full pointer-events-none z-0"></div>

      {/* Navigation Back Button */}
      <div className="max-w-7xl mx-auto px-6 lg:px-10 mt-4 pb-4 flex justify-start items-center relative z-30">
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center gap-2.5 px-4 py-2 rounded-xl border border-border/50 bg-card/35 backdrop-blur-md text-xs font-condensed tracking-wider font-bold text-muted-foreground hover:text-primary hover:border-primary/45 transition-all duration-300 shadow-md active:scale-95 group cursor-pointer"
        >
          <span className="group-hover:-translate-x-1 transition-transform duration-300">←</span>
          VOLVER AL MENÚ
        </button>
      </div>

      <div className="relative z-20 max-w-7xl mx-auto px-6 lg:px-10 space-y-8">
        
        {/* HERO CARD */}
        <section className="relative z-20 max-w-7xl mx-auto overflow-hidden rounded-3xl border border-border/40 bg-card/45 backdrop-blur-md shadow-2xl mt-8">
          
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
            <div className="absolute inset-0 pointer-events-none select-none overflow-hidden z-0">
              <span className="absolute top-2 left-10 text-[9rem] md:text-[14rem] font-display font-black uppercase text-foreground/[0.015] dark:text-foreground/[0.025] blur-[2px]">
                UT FC26
              </span>
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
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="brand" className="uppercase font-mono text-[9px] tracking-widest">{competencia.tipo}</Badge>
                    <Badge variant="neutral" className="uppercase font-mono text-[9px] tracking-widest">{competencia.plataforma}</Badge>
                    <Badge variant={competencia.estado === 'en_curso' ? 'success' : 'neutral'} className="uppercase font-mono text-[9px] tracking-widest">{competencia.estado}</Badge>
                  </div>
                  <h1 className="text-2xl md:text-4xl font-display font-black text-foreground uppercase tracking-wide mt-2">
                    {competencia.nombre}
                  </h1>
                  <p className="text-xs text-muted-foreground mt-1 uppercase tracking-wider font-mono">
                    Temporada: <span className="text-foreground font-bold">{competencia.temporada?.nombre || 'General'}</span>
                  </p>
                </div>
              </div>
              
              <div className="flex gap-4 shrink-0 bg-background/30 border border-border/40 p-4 rounded-2xl backdrop-blur-sm">
                <div className="text-center">
                  <span className="text-[8px] font-black text-muted-foreground uppercase tracking-widest block">PRIZE POOL</span>
                  <span className="text-lg font-display font-black text-primary tracking-widest">${competencia.prize_pool || '0.00'}</span>
                </div>
                <div className="w-px bg-border/40" />
                <div className="text-center">
                  <span className="text-[8px] font-black text-muted-foreground uppercase tracking-widest block">INSCRIPCIÓN</span>
                  <span className="text-lg font-display font-black text-foreground tracking-widest">${competencia.entry_fee || '0.00'}</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* NAVEGACIÓN DE PESTAÑAS */}
        <div className="flex flex-wrap gap-2 border-b border-border/40 pb-1 z-20 relative">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id)}
              className={`px-4 py-2.5 rounded-xl text-xs font-condensed tracking-wider font-black uppercase transition-all duration-300 flex items-center gap-2 cursor-pointer ${
                activeSubTab === tab.id
                  ? 'bg-primary text-primary-foreground shadow-[0_0_15px_rgba(232,0,29,0.35)]'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/30'
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* CONTENIDO DE PESTAÑAS */}
        <div className="relative z-10">
          
          {/* TABS 1: DETALLES */}
          {activeSubTab === 'detalles' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start animate-fade-in">
              <div className="lg:col-span-2 space-y-6">
                <Card className="p-6 border border-border/40 bg-card/25 backdrop-blur-md shadow-lg" withGlow>
                  <h3 className="text-sm font-bold text-primary uppercase tracking-widest mb-4 border-b border-border/20 pb-2">Descripción del Torneo</h3>
                  <p className="text-sm text-foreground/90 leading-relaxed whitespace-pre-line">
                    {competencia.descripcion || 'No hay descripción oficial disponible para este torneo.'}
                  </p>
                </Card>

                <Card className="p-6 border border-border/40 bg-card/25 backdrop-blur-md shadow-lg" withGlow>
                  <h3 className="text-sm font-bold text-primary uppercase tracking-widest mb-4 border-b border-border/20 pb-2">Reglamento y Directrices</h3>
                  <p className="text-sm text-foreground/90 leading-relaxed whitespace-pre-line">
                    {competencia.reglas || 'Las reglas generales de la liga aplican para este encuentro.'}
                  </p>
                </Card>
              </div>

              <div className="space-y-6">
                <Card className="p-5 border border-border/40 bg-card/25 backdrop-blur-md shadow-lg" withGlow>
                  <h3 className="text-sm font-bold text-foreground uppercase tracking-wider mb-4 border-b border-border/20 pb-2">Ficha Técnica</h3>
                  <div className="space-y-3.5 text-xs">
                    <div className="flex justify-between border-b border-border/20 pb-2">
                      <span className="text-muted-foreground uppercase font-semibold">Formato</span>
                      <span className="font-bold text-foreground uppercase">{competencia.formato}</span>
                    </div>
                    <div className="flex justify-between border-b border-border/20 pb-2">
                      <span className="text-muted-foreground uppercase font-semibold">Modalidad</span>
                      <span className="font-bold text-foreground uppercase">{competencia.tipo} UT</span>
                    </div>
                    <div className="flex justify-between border-b border-border/20 pb-2">
                      <span className="text-muted-foreground uppercase font-semibold">Plataforma</span>
                      <span className="font-bold text-foreground uppercase">{competencia.plataforma}</span>
                    </div>
                    <div className="flex justify-between border-b border-border/20 pb-2">
                      <span className="text-muted-foreground uppercase font-semibold">Máx Participantes</span>
                      <span className="font-bold text-foreground font-mono">{competencia.max_participantes}</span>
                    </div>
                    <div className="flex justify-between border-b border-border/20 pb-2">
                      <span className="text-muted-foreground uppercase font-semibold">Inscritos</span>
                      <span className="font-bold text-primary font-mono">{equipos.length}</span>
                    </div>
                  </div>
                </Card>

                {competencia.estado === 'inscripciones' && (
                  <Button
                    onClick={() => navigate(`/jugador/competencias-ut/${competencia.id}/inscripcion`)}
                    className="w-full h-12 bg-gradient-to-r from-primary to-destructive text-primary-foreground font-display font-black uppercase tracking-wider text-xs shadow-lg animate-pulse"
                  >
                    📝 Inscribirse en el Torneo
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* TABS 2: PARTICIPANTES */}
          {activeSubTab === 'equipos' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
              {equipos.length === 0 ? (
                <div className="col-span-full text-center py-12 border border-dashed border-border/50 rounded-2xl bg-muted/10">
                  <span className="text-muted-foreground text-sm font-bold uppercase tracking-wider">Aún no hay inscritos aprobados</span>
                </div>
              ) : (
                equipos.filter(e => e.pivot?.estado_inscripcion === 'aprobado').map(equipo => (
                  <Card key={equipo.id} className="p-4 border border-border/50 bg-card/25 backdrop-blur-sm shadow-md" hoverable>
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center font-display font-black text-foreground border border-border/40 text-base uppercase">
                        {equipo.nombre?.slice(0, 3) || 'UT'}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-sm font-black text-foreground uppercase truncate">{equipo.nombre}</span>
                        <div className="text-[10px] text-muted-foreground space-y-0.5 mt-1">
                          <div>🎮 Jugador 1: <strong className="text-foreground">{equipo.capitan?.gamertag || equipo.capitan?.name}</strong></div>
                          {equipo.companero && (
                            <div>🎮 Jugador 2: <strong className="text-foreground">{equipo.companero?.gamertag || equipo.companero?.name}</strong></div>
                          )}
                          {equipo.club_id_ea && <div className="text-primary font-bold">Club EA ID: {equipo.club_id_ea}</div>}
                        </div>
                      </div>
                    </div>
                  </Card>
                ))
              )}
            </div>
          )}

          {/* TABS 3: FIXTURE */}
          {activeSubTab === 'fixture' && (
            <div className="animate-fade-in">
              {isLiga && <FixturaLiga partidos={partidos} />}
              {isPlayoff && <PlayoffBracket partidos={partidos} />}
              {isCopa && <FixturaCopa partidos={partidos} />}
            </div>
          )}

          {/* TABS 4: CLASIFICACIÓN / TABLA */}
          {activeSubTab === 'tabla' && (
            <div className="animate-fade-in">
              {isLiga && <TablaLiga partidos={partidos} equipos={equipos} />}
              {isPlayoff && <PlayoffBracket partidos={partidos} />}
              {isCopa && <TablaCopa partidos={partidos} equipos={equipos} />}
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
