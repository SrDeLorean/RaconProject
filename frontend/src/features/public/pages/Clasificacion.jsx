import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Badge from '@/components/ui/Badge';
import api from '@/api/axios';

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Build standings from partidos.
 * seedTeams: optional array of {id, nombre, abreviatura} to always show even with 0 points.
 */
function computeStandings(partidos, seedTeams = []) {
  const map = {};

  // Pre-seed from teams list so they appear even with 0 results
  seedTeams.forEach(t => {
    if (t?.id) map[t.id] = { id: t.id, nombre: t.nombre, abreviatura: t.abreviatura, pj:0, pg:0, pe:0, pp:0, gf:0, gc:0, pts:0 };
  });

  // Seed any teams we encounter in partidos (even upcoming ones)
  partidos.forEach(p => {
    if (p.local?.id  && !map[p.local.id])    map[p.local.id]    = { id: p.local.id,    nombre: p.local.nombre,    abreviatura: p.local.abreviatura,    pj:0, pg:0, pe:0, pp:0, gf:0, gc:0, pts:0 };
    if (p.visitante?.id && !map[p.visitante.id]) map[p.visitante.id] = { id: p.visitante.id, nombre: p.visitante.nombre, abreviatura: p.visitante.abreviatura, pj:0, pg:0, pe:0, pp:0, gf:0, gc:0, pts:0 };
  });

  // Apply finished results
  partidos.forEach(p => {
    if (p.goles_local == null || p.goles_visitante == null) return;
    const lid = p.local?.id, vid = p.visitante?.id;
    if (!lid || !vid || !map[lid] || !map[vid]) return;
    const gl = p.goles_local, gv = p.goles_visitante;
    const tl = map[lid], tv = map[vid];
    tl.pj++; tv.pj++;
    tl.gf += gl; tl.gc += gv;
    tv.gf += gv; tv.gc += gl;
    if      (gl > gv) { tl.pg++; tl.pts += 3; tv.pp++; }
    else if (gl < gv) { tv.pg++; tv.pts += 3; tl.pp++; }
    else              { tl.pe++; tl.pts++;     tv.pe++; tv.pts++; }
  });

  return Object.values(map).sort((a, b) =>
    b.pts - a.pts || (b.gf - b.gc) - (a.gf - a.gc) || b.gf - a.gf
  );
}

// ─── Filter Chip ──────────────────────────────────────────────────────────────

function FilterChip({ label, active, onClick, count }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wide whitespace-nowrap transition-all duration-200 border ${
        active
          ? 'bg-primary text-primary-foreground border-primary shadow-md shadow-primary/20'
          : 'bg-card/25 text-muted-foreground border-border/40 hover:border-primary/40 hover:text-foreground backdrop-blur-sm'
      }`}
    >
      {label}
      {count != null && (
        <span className={`text-[8px] px-1.5 py-0.5 rounded font-black ${active ? 'bg-white/20' : 'bg-muted/50'}`}>
          {count}
        </span>
      )}
    </button>
  );
}

// ─── Mini Stat Card ───────────────────────────────────────────────────────────

function StatCard({ icon, label, value, sub }) {
  return (
    <div className="border border-border/50 bg-card/20 backdrop-blur-md rounded-xl p-4 flex items-center gap-3 shadow-sm">
      <span className="text-2xl shrink-0">{icon}</span>
      <div className="min-w-0">
        <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">{label}</p>
        <p className="text-sm font-black uppercase text-foreground truncate">{value || '—'}</p>
        {sub && <p className="text-[9px] font-mono text-primary">{sub}</p>}
      </div>
    </div>
  );
}

// ─── Standings Table ──────────────────────────────────────────────────────────

function StandingsTable({ standings, noResultsMsg }) {
  if (standings.length === 0) {
    return (
      <p className="text-center text-xs text-muted-foreground italic py-8">
        {noResultsMsg || 'Sin equipos registrados.'}
      </p>
    );
  }

  const hasResults = standings.some(s => s.pj > 0);

  return (
    <div className="overflow-x-auto">
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
        <tbody className="divide-y divide-border/30 font-semibold text-xs">
          {standings.map((s, idx) => {
            const dg = s.gf - s.gc;
            return (
              <tr
                key={s.id}
                className={`hover:bg-primary/5 transition-colors duration-200 ${idx === 0 && hasResults ? 'bg-primary/5' : ''}`}
              >
                <td className="px-4 py-3 text-center">
                  <span className={`inline-flex items-center justify-center w-6 h-6 rounded font-black font-mono text-[10px] shadow-sm ${
                    idx === 0 && hasResults ? 'bg-gradient-to-tr from-amber-400 to-yellow-600 text-slate-950 shadow-amber-400/30' :
                    idx === 1 && hasResults ? 'bg-gradient-to-tr from-slate-300 to-slate-500 text-slate-950 shadow-slate-400/20' :
                    idx === 2 && hasResults ? 'bg-gradient-to-tr from-amber-700 to-amber-900 text-amber-100 shadow-amber-900/20' :
                    'bg-muted/60 text-foreground'
                  }`}>{idx + 1}</span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-8 h-8 rounded-lg border flex items-center justify-center font-display font-black text-[9px] shadow-inner uppercase shrink-0 ${
                      idx === 0 && hasResults ? 'bg-primary/15 border-primary/40 text-primary' : 'bg-muted/40 border-border/50 text-foreground'
                    }`}>{s.abreviatura}</div>
                    <span className="font-black uppercase text-foreground tracking-wide">{s.nombre}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-center font-mono">{s.pj}</td>
                <td className="px-4 py-3 text-center font-mono text-emerald-400">{s.pg}</td>
                <td className="px-4 py-3 text-center font-mono text-muted-foreground">{s.pe}</td>
                <td className="px-4 py-3 text-center font-mono text-destructive">{s.pp}</td>
                <td className="px-4 py-3 text-center font-mono">{s.gf}</td>
                <td className="px-4 py-3 text-center font-mono">{s.gc}</td>
                <td className={`px-4 py-3 text-center font-mono font-bold ${dg > 0 ? 'text-emerald-400' : dg < 0 ? 'text-destructive' : 'text-muted-foreground'}`}>
                  {dg > 0 ? `+${dg}` : dg}
                </td>
                <td className="px-4 py-3 text-center font-mono text-primary font-black text-sm">{s.pts}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ─── Liga View ────────────────────────────────────────────────────────────────

function LigaView({ partidos }) {
  // Show all teams that appear in partidos, even with 0 results
  const standings = useMemo(() => computeStandings(partidos), [partidos]);
  const hasResults = standings.some(s => s.pj > 0);

  const leader      = hasResults ? standings[0] : null;
  const bestAttack  = hasResults ? [...standings].sort((a, b) => b.gf - a.gf)[0] : null;
  const bestDefense = hasResults ? [...standings].sort((a, b) => a.gc - b.gc)[0]  : null;

  return (
    <div className="space-y-4">
      {/* Mini stats — only when there are results */}
      {hasResults && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <StatCard icon="🥇" label="Líder de Tabla" value={leader?.nombre}
            sub={leader ? `${leader.pts} pts · DG ${leader.gf - leader.gc > 0 ? '+' : ''}${leader.gf - leader.gc}` : null} />
          <StatCard icon="⚔️" label="Mejor Ataque"   value={bestAttack?.nombre}
            sub={bestAttack ? `${bestAttack.gf} goles marcados` : null} />
          <StatCard icon="🛡️" label="Mejor Defensa" value={bestDefense?.nombre}
            sub={bestDefense ? `Solo ${bestDefense.gc} recibidos` : null} />
        </div>
      )}

      {/* Pending notice when no results yet */}
      {!hasResults && standings.length > 0 && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl border border-amber-500/30 bg-amber-500/5 text-xs text-amber-400 font-bold">
          ⏳ El torneo aún no ha comenzado — se muestran los equipos inscritos en espera de resultados.
        </div>
      )}

      <div className="border border-border/50 bg-card/20 backdrop-blur-md rounded-2xl overflow-hidden shadow-lg">
        <StandingsTable
          standings={standings}
          noResultsMsg="No hay equipos inscritos en esta liga aún."
        />
      </div>
    </div>
  );
}

// ─── Copa View ────────────────────────────────────────────────────────────────

function CopaView({ partidos, compId, navigate }) {
  // Group-stage partidos (those with a "grupo" field)
  const grupoPartidos = useMemo(() => partidos.filter(p => p.grupo), [partidos]);
  const grupos = useMemo(() => {
    const map = {};
    grupoPartidos.forEach(p => {
      const g = p.grupo;
      if (!map[g]) map[g] = [];
      map[g].push(p);
    });
    return map;
  }, [grupoPartidos]);

  const grupoKeys   = Object.keys(grupos).sort();
  const hasKnockout = partidos.some(p => !p.grupo);
  const hasGroups   = grupoKeys.length > 0;

  if (!hasGroups && !hasKnockout) {
    return (
      <div className="border border-border/50 bg-card/20 backdrop-blur-md rounded-2xl p-8 text-center space-y-2">
        <div className="text-4xl">🥇</div>
        <p className="text-sm font-black uppercase tracking-wider text-foreground">Copa — Sin datos aún</p>
        <p className="text-xs text-muted-foreground">El fixture de grupos todavía no ha sido cargado por el organizador.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Group tables */}
      {hasGroups && (
        <div className="space-y-4">
          <h3 className="text-sm font-black uppercase tracking-widest text-foreground flex items-center gap-2">
            <span className="text-primary">📋</span> Fase de Grupos
          </h3>
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {grupoKeys.map(grupo => {
              const standings = computeStandings(grupos[grupo]);
              const hasResults = standings.some(s => s.pj > 0);
              return (
                <div key={grupo} className="border border-border/50 bg-card/20 backdrop-blur-md rounded-2xl overflow-hidden shadow-lg">
                  <div className="px-5 py-3 bg-muted/20 border-b border-border/40 flex items-center justify-between">
                    <span className="text-xs font-black uppercase tracking-widest text-primary">Grupo {grupo}</span>
                    {!hasResults && (
                      <span className="text-[9px] text-amber-400 font-bold uppercase tracking-wide">⏳ Sin resultados</span>
                    )}
                  </div>
                  <StandingsTable
                    standings={standings}
                    noResultsMsg="Sin equipos en este grupo."
                  />
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Knockout bracket rendered inline */}
      {hasKnockout && (
        <div className="space-y-4">
          <h3 className="text-sm font-black uppercase tracking-widest text-foreground flex items-center gap-2">
            <span className="text-primary">🏆</span> Fase Eliminatoria
          </h3>
          <PlayoffBracket partidos={partidos.filter(p => !p.grupo)} />
        </div>
      )}
    </div>
  );
}

// ─── Playoff Bracket ─────────────────────────────────────────────────────────

/**
 * Ordena las rondas de una eliminatoria de la más temprana a la final.
 * Usa heurísticas sobre el nombre de la jornada para ordenarlas correctamente.
 */
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
        <div className={`flex items-center justify-between px-3 py-2.5 border-b border-border/30 transition-colors ${
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
        <div className={`flex items-center justify-between px-3 py-2.5 transition-colors ${
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
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Leg 1 | Leg 2 scores */}
          <span className="text-[10px] font-bold text-muted-foreground/60 bg-muted/20 px-1 py-0.5 rounded font-mono">
            {hasRes1 ? leg1.goles_local : '-'}
          </span>
          <span className="text-[10px] font-bold text-muted-foreground/60 bg-muted/20 px-1 py-0.5 rounded font-mono">
            {hasRes2 ? leg2.goles_visitante : '-'}
          </span>
          {/* Total score */}
          <span className={`text-xs font-black font-mono ml-1 w-6 text-center ${
            localW ? 'text-primary' : hasResult ? 'text-foreground' : 'text-muted-foreground/30'
          }`}>
            {hasResult ? scoreA : ''}
          </span>
        </div>
      </div>

      {/* Team B (Visitante en Ida) */}
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
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Leg 1 | Leg 2 scores */}
          <span className="text-[10px] font-bold text-muted-foreground/60 bg-muted/20 px-1 py-0.5 rounded font-mono">
            {hasRes1 ? leg1.goles_visitante : '-'}
          </span>
          <span className="text-[10px] font-bold text-muted-foreground/60 bg-muted/20 px-1 py-0.5 rounded font-mono">
            {hasRes2 ? leg2.goles_local : '-'}
          </span>
          {/* Total score */}
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
    return (
      <div className="border border-border/50 bg-card/20 backdrop-blur-md rounded-2xl p-10 text-center space-y-3">
        <div className="text-5xl">🏆</div>
        <p className="text-sm font-black uppercase tracking-wider text-foreground">Sin partidos de eliminatoria cargados aún</p>
        <p className="text-xs text-muted-foreground">El organizador aún no ha generado el fixture de playoffs.</p>
      </div>
    );
  }

  return (
    <div className="border border-border/50 bg-card/20 backdrop-blur-md rounded-2xl overflow-hidden shadow-lg">
      <div className="px-5 py-3 bg-muted/20 border-b border-border/40 flex items-center gap-2">
        <span className="text-xs font-black uppercase tracking-widest text-primary">🏆 Cuadro Eliminatorio</span>
        <span className="text-[9px] text-muted-foreground font-mono ml-auto">
          {partidos.filter(p => p.goles_local != null).length} / {partidos.length} definidos
        </span>
      </div>
      <div className="p-5 overflow-x-auto">
        <div className="flex gap-0 min-w-max">
          {rounds.map(([roundName, matches], roundIdx) => (
            <div key={roundName} className="flex">
              {/* Round column */}
              <div className="flex flex-col" style={{ minWidth: 224 }}>
                {/* Round label */}
                <div className="text-center mb-4">
                  <span className="inline-block text-[10px] font-black uppercase tracking-widest text-primary bg-primary/10 border border-primary/20 px-3 py-1 rounded-full">
                    {roundName}
                  </span>
                </div>
                {/* Matches stacked with spacing for bracket alignment */}
                <div className="flex flex-col gap-6 justify-around flex-1">
                  {matches.map((p, i) => (
                    <div key={p.id ?? i} className="flex items-center justify-center">
                      <BracketMatchCard matchup={p} />
                    </div>
                  ))}
                </div>
              </div>
              {/* Connector between rounds */}
              {roundIdx < rounds.length - 1 && (
                <div className="flex flex-col justify-around px-3" style={{ minWidth: 32 }}>
                  {Array.from({ length: Math.ceil(matches.length / 2) }).map((_, i) => (
                    <div key={i} className="flex items-center justify-center h-16">
                      <div className="w-full h-px bg-border/50" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Playoff View ─────────────────────────────────────────────────────────────

function PlayoffView({ partidos, compId, navigate }) {
  return (
    <div className="space-y-4">
      <PlayoffBracket partidos={partidos} />
    </div>
  );
}

// ─── Competition Section ──────────────────────────────────────────────────────

function CompetenciaSection({ competencia, navigate }) {
  const formato   = (competencia.formato || 'liga').toLowerCase();
  const isPlayoff = formato === 'playoffs' || formato === 'playoff';
  const isCopa    = formato === 'copa';
  const isLiga    = !isPlayoff && !isCopa;

  const fmtIcon  = isPlayoff ? '🏆' : isCopa ? '🥇' : '🏟️';
  const fmtLabel = isPlayoff ? 'Playoffs' : isCopa ? 'Copa' : 'Liga';

  return (
    <div className="space-y-4">
      {/* Header row */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="text-lg">{fmtIcon}</span>
          <h2 className="text-base font-display font-black uppercase tracking-wider text-foreground">
            {competencia.nombre}
          </h2>
        </div>
        <span className="text-[9px] font-black uppercase tracking-widest text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-full">
          {fmtLabel}
        </span>
        {competencia.orgNombre && (
          <span className="text-[9px] font-bold text-muted-foreground uppercase bg-muted/30 border border-border/30 px-2 py-0.5 rounded-full">
            {competencia.orgNombre}
          </span>
        )}
        <span className="text-[9px] font-mono text-muted-foreground ml-auto">
          {competencia.partidos.filter(p => p.goles_local != null).length} / {competencia.partidos.length} jugados
        </span>
      </div>

      {isLiga    && <LigaView    partidos={competencia.partidos} />}
      {isCopa    && <CopaView    partidos={competencia.partidos} compId={competencia.id} navigate={navigate} />}
      {isPlayoff && <PlayoffBracket partidos={competencia.partidos} />}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function Clasificacion() {
  const navigate = useNavigate();
  const [partidos,   setPartidos]   = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [orgFiltro,  setOrgFiltro]  = useState(null);
  const [compFiltro, setCompFiltro] = useState(null);

  useEffect(() => {
    api.get('/partidos')
      .then(res => setPartidos(res.data || []))
      .catch(err => console.error('Error al cargar partidos:', err))
      .finally(() => setLoading(false));
  }, []);

  // ── Derived options ────────────────────────────────────────────────────────

  const organizaciones = useMemo(() => {
    const map = {};
    partidos.forEach(p => {
      const org = p.competencia?.temporada?.organizacion;
      if (org && !map[org.id]) map[org.id] = { id: org.id, nombre: org.nombre };
    });
    return Object.values(map);
  }, [partidos]);

  const competencias = useMemo(() => {
    const map = {};
    partidos.forEach(p => {
      const c = p.competencia;
      if (!c) return;
      const orgId = c.temporada?.organizacion?.id;
      if (orgFiltro && orgId !== orgFiltro) return;
      if (!map[c.id]) map[c.id] = { id: c.id, nombre: c.nombre, formato: c.formato, orgNombre: c.temporada?.organizacion?.nombre, count: 0 };
      map[c.id].count++;
    });
    return Object.values(map);
  }, [partidos, orgFiltro]);

  const competenciasConPartidos = useMemo(() => {
    const map = {};
    partidos.forEach(p => {
      const c = p.competencia;
      if (!c) return;
      const orgId = c.temporada?.organizacion?.id;
      if (orgFiltro  && orgId !== orgFiltro)  return;
      if (compFiltro && c.id  !== compFiltro) return;
      if (!map[c.id]) map[c.id] = { id: c.id, nombre: c.nombre, formato: c.formato, orgNombre: c.temporada?.organizacion?.nombre, partidos: [] };
      map[c.id].partidos.push(p);
    });
    return Object.values(map);
  }, [partidos, orgFiltro, compFiltro]);

  // Global highlight stats (only from finished matches)
  const allFinished = useMemo(() =>
    competenciasConPartidos.flatMap(c => c.partidos).filter(p => p.goles_local != null),
    [competenciasConPartidos]
  );
  const globalStandings = useMemo(() => computeStandings(allFinished), [allFinished]);
  const globalLeader    = globalStandings[0];
  const globalBestAtk   = [...globalStandings].sort((a, b) => b.gf - a.gf)[0];
  const globalBestDef   = [...globalStandings].sort((a, b) => a.gc - b.gc)[0];
  const totalJugados    = allFinished.length;

  const activeFiltersCount = [orgFiltro, compFiltro].filter(Boolean).length;

  return (
    <div className="relative min-h-screen bg-background pt-28 pb-16 overflow-hidden">

      {/* Background */}
      <div
        className="absolute inset-0 bg-cover bg-center z-0"
        style={{ backgroundImage: "url('https://images.unsplash.com/photo-1511512578047-dfb367046420?q=80&w=1920&auto=format&fit=crop')" }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-background/95 via-background/70 to-background z-10" />
      </div>
      <div className="absolute top-1/3 right-1/4 w-[500px] h-[500px] bg-primary/15 blur-[140px] rounded-full pointer-events-none z-10" />

      <div className="relative z-20 max-w-7xl mx-auto px-6 lg:px-10 space-y-10">

        {/* Hero */}
        <div className="text-center max-w-2xl mx-auto space-y-4">
          <Badge variant="primary" className="px-4 py-1.5 text-xs font-condensed tracking-widest text-primary border-primary/30 bg-primary/10 rounded-full animate-pulse-glow">
            📊 Clasificación General
          </Badge>
          <h1 className="text-5xl md:text-7xl font-display font-extrabold uppercase tracking-tight leading-[0.85] text-foreground">
            TABLA DE{' '}
            <span className="bg-clip-text bg-gradient-to-r from-primary to-destructive text-transparent">
              POSICIONES
            </span>
          </h1>
          <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
            Clasificaciones en tiempo real. Liga con tabla completa, Copa por grupos, Playoffs con cuadro de eliminación.
          </p>
        </div>

        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary" />
          </div>
        ) : (
          <div className="space-y-8">

            {/* ── FILTER PANEL ── */}
            <div className="border border-border/50 bg-card/20 backdrop-blur-md rounded-2xl p-5 shadow-lg space-y-5">

              {/* Global stats strip */}
              {totalJugados > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pb-4 border-b border-border/30">
                  <StatCard icon="🥇" label="Líder Global"     value={globalLeader?.nombre}  sub={globalLeader  ? `${globalLeader.pts} pts` : null} />
                  <StatCard icon="⚔️"  label="Mejor Ataque"    value={globalBestAtk?.nombre} sub={globalBestAtk ? `${globalBestAtk.gf} goles` : null} />
                  <StatCard icon="🛡️" label="Mejor Defensa"   value={globalBestDef?.nombre} sub={globalBestDef ? `${globalBestDef.gc} recibidos` : null} />
                  <StatCard icon="🎮" label="Partidos Jugados" value={String(totalJugados)}  sub={`en ${competenciasConPartidos.length} competencia${competenciasConPartidos.length !== 1 ? 's' : ''}`} />
                </div>
              )}

              {/* Org chips */}
              {organizaciones.length > 0 && (
                <div className="space-y-2">
                  <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Organización</p>
                  <div className="flex flex-wrap gap-2">
                    <FilterChip label="Todas" active={orgFiltro === null}
                      onClick={() => { setOrgFiltro(null); setCompFiltro(null); }} />
                    {organizaciones.map(org => (
                      <FilterChip key={org.id} label={org.nombre} active={orgFiltro === org.id}
                        count={partidos.filter(p => p.competencia?.temporada?.organizacion?.id === org.id).length}
                        onClick={() => { setOrgFiltro(org.id); setCompFiltro(null); }} />
                    ))}
                  </div>
                </div>
              )}

              {/* Competition chips with format icon */}
              {competencias.length > 0 && (
                <div className="space-y-2">
                  <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Competencia</p>
                  <div className="flex flex-wrap gap-2">
                    <FilterChip label="Todas" active={compFiltro === null}
                      onClick={() => setCompFiltro(null)} />
                    {competencias.map(c => {
                      const fmt     = (c.formato || 'liga').toLowerCase();
                      const fmtIcon = fmt === 'copa' ? '🥇' : fmt.includes('playoff') ? '🏆' : '🏟️';
                      return (
                        <FilterChip key={c.id} label={`${fmtIcon} ${c.nombre}`}
                          active={compFiltro === c.id} count={c.count}
                          onClick={() => setCompFiltro(c.id)} />
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Active filter summary */}
              {activeFiltersCount > 0 && (
                <div className="flex items-center justify-between border-t border-border/30 pt-3">
                  <span className="text-[10px] text-muted-foreground">
                    Mostrando <span className="text-foreground font-bold">{competenciasConPartidos.length}</span> competencia(s)
                  </span>
                  <button
                    onClick={() => { setOrgFiltro(null); setCompFiltro(null); }}
                    className="text-[10px] font-bold text-destructive hover:text-destructive/80 transition-colors flex items-center gap-1"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    Limpiar filtros
                  </button>
                </div>
              )}
            </div>

            {/* ── COMPETITION SECTIONS ── */}
            {competenciasConPartidos.length === 0 ? (
              <div className="text-center py-20 space-y-3">
                <div className="text-5xl">📊</div>
                <p className="text-base font-black uppercase tracking-wider text-foreground">Sin datos de partidos</p>
                <p className="text-sm text-muted-foreground">
                  Aún no hay fixtures cargados. El organizador debe generar el calendario desde el Matchmaker.
                </p>
              </div>
            ) : (
              <div className="space-y-12">
                {competenciasConPartidos.map(comp => (
                  <CompetenciaSection key={comp.id} competencia={comp} navigate={navigate} />
                ))}
              </div>
            )}

          </div>
        )}
      </div>
    </div>
  );
}
