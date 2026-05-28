import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Badge from '@/components/ui/Badge';
import api from '@/api/axios';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function classifyMatch(p) {
  if (p.goles_local != null && p.goles_visitante != null) return 'finished';
  const now = new Date();
  if (p.fecha) {
    const matchDate = new Date(`${p.fecha}T${p.hora || '00:00'}:00`);
    const diffMin = (now - matchDate) / 60000;
    if (diffMin >= 0 && diffMin < 110) return 'live';
  }
  return 'upcoming';
}

// ─── Match Card ───────────────────────────────────────────────────────────────

function MatchCard({ partido, view }) {
  const status    = classifyMatch(partido);
  const hasResult = status === 'finished';
  const isLive    = status === 'live';
  const localW    = hasResult && partido.goles_local  > partido.goles_visitante;
  const visitaW   = hasResult && partido.goles_visitante > partido.goles_local;

  const org  = partido.competencia?.temporada?.organizacion?.nombre;
  const comp = partido.competencia?.nombre;

  if (view === 'list') {
    return (
      <div className="border border-border/50 bg-card/20 backdrop-blur-md rounded-xl px-5 py-3.5 flex items-center gap-4 hover:border-primary/40 hover:bg-card/35 transition-all duration-200 group">
        {/* Status dot */}
        <div className="shrink-0">
          {isLive ? (
            <span className="inline-flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping inline-block" />LIVE
            </span>
          ) : hasResult ? (
            <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">FIN</span>
          ) : (
            <span className="text-[9px] font-black uppercase tracking-widest text-primary">{partido.hora || '??:??'}</span>
          )}
        </div>

        {/* Teams + score */}
        <div className="flex-1 flex items-center gap-3 min-w-0">
          <span className={`text-xs font-black uppercase truncate text-right flex-1 ${localW ? 'text-primary' : 'text-foreground'}`}>
            {partido.local?.nombre || 'TBD'}
          </span>
          <div className="shrink-0 min-w-[52px] text-center">
            {hasResult || isLive ? (
              <span className="text-sm font-black font-mono tracking-widest">
                <span className={localW ? 'text-primary' : 'text-foreground'}>{partido.goles_local}</span>
                <span className="text-muted-foreground/40 mx-1">-</span>
                <span className={visitaW ? 'text-primary' : 'text-foreground'}>{partido.goles_visitante}</span>
              </span>
            ) : (
              <span className="text-[10px] text-muted-foreground font-bold bg-muted/30 px-1.5 py-0.5 rounded">VS</span>
            )}
          </div>
          <span className={`text-xs font-black uppercase truncate text-left flex-1 ${visitaW ? 'text-primary' : 'text-foreground'}`}>
            {partido.visitante?.nombre || 'TBD'}
          </span>
        </div>

        {/* Meta */}
        <div className="shrink-0 text-right hidden sm:block">
          {comp && <p className="text-[9px] font-bold text-primary uppercase truncate max-w-[140px]">{comp}</p>}
          <p className="text-[9px] text-muted-foreground font-mono">{partido.fecha || 'Sin fecha'}</p>
        </div>
      </div>
    );
  }

  // GRID view
  return (
    <div className="border border-border/50 bg-card/20 backdrop-blur-md rounded-2xl p-5 flex flex-col gap-4 hover:border-primary/40 hover:bg-card/35 transition-all duration-300 shadow-md group relative overflow-hidden">
      {/* Glow accent on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/0 to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none rounded-2xl" />

      {/* Header */}
      <div className="flex items-start justify-between gap-2 relative">
        <div className="min-w-0">
          {comp && <p className="text-[9px] font-black uppercase tracking-widest text-primary truncate">{comp}</p>}
          {partido.jornada && (
            <p className="text-[8px] text-muted-foreground font-bold uppercase tracking-wider">
              {partido.jornada}{partido.grupo ? ` · Grupo ${partido.grupo}` : ''}
            </p>
          )}
        </div>
        <div className="shrink-0">
          {isLive ? (
            <span className="flex items-center gap-1 text-[8px] font-black uppercase text-emerald-400 bg-emerald-400/10 border border-emerald-400/30 px-2 py-0.5 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" /> EN VIVO
            </span>
          ) : hasResult ? (
            <span className="text-[8px] font-black uppercase text-muted-foreground bg-muted/30 px-2 py-0.5 rounded-full">FINAL</span>
          ) : (
            <span className="text-[8px] font-black uppercase text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-full">PRÓXIMO</span>
          )}
        </div>
      </div>

      {/* Score area */}
      <div className="flex items-center justify-between gap-2 relative">
        {/* Local */}
        <div className="flex flex-col items-center gap-1.5 flex-1">
          <div className={`w-11 h-11 rounded-xl bg-gradient-to-br from-primary/15 to-primary/5 border flex items-center justify-center font-display font-black text-xs uppercase shadow-inner ${localW ? 'border-primary/50 text-primary' : 'border-border/40 text-foreground'}`}>
            {partido.local?.abreviatura || '?'}
          </div>
          <span className="text-[9px] font-black uppercase tracking-wide text-center leading-none max-w-[72px] truncate text-foreground">
            {partido.local?.nombre || 'TBD'}
          </span>
        </div>

        {/* Center */}
        <div className="flex flex-col items-center shrink-0 px-1">
          {hasResult || isLive ? (
            <div className="text-2xl font-black font-mono tracking-widest leading-none">
              <span className={localW ? 'text-primary' : 'text-foreground'}>{partido.goles_local}</span>
              <span className="text-muted-foreground/30 mx-1.5 font-light">-</span>
              <span className={visitaW ? 'text-primary' : 'text-foreground'}>{partido.goles_visitante}</span>
            </div>
          ) : (
            <div className="text-center">
              <p className="text-base font-black font-mono text-primary leading-none">{partido.hora || '--:--'}</p>
              <p className="text-[8px] font-bold text-muted-foreground uppercase mt-1 bg-muted/30 px-1.5 py-0.5 rounded">
                {partido.fecha || 'Por definir'}
              </p>
            </div>
          )}
        </div>

        {/* Visitante */}
        <div className="flex flex-col items-center gap-1.5 flex-1">
          <div className={`w-11 h-11 rounded-xl bg-gradient-to-br from-primary/15 to-primary/5 border flex items-center justify-center font-display font-black text-xs uppercase shadow-inner ${visitaW ? 'border-primary/50 text-primary' : 'border-border/40 text-foreground'}`}>
            {partido.visitante?.abreviatura || '?'}
          </div>
          <span className="text-[9px] font-black uppercase tracking-wide text-center leading-none max-w-[72px] truncate text-foreground">
            {partido.visitante?.nombre || 'TBD'}
          </span>
        </div>
      </div>

      {/* Footer */}
      {org && (
        <div className="relative border-t border-border/30 pt-2 flex items-center justify-between">
          <span className="text-[8px] font-bold text-muted-foreground uppercase tracking-wider truncate">{org}</span>
          {partido.fecha && (
            <span className="text-[8px] font-mono text-muted-foreground shrink-0">{partido.fecha}</span>
          )}
        </div>
      )}
    </div>
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

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function Partidos() {
  const navigate = useNavigate();
  const [partidos,  setPartidos]  = useState([]);
  const [loading,   setLoading]   = useState(true);

  // Filters
  const [statusTab,     setStatusTab]     = useState('all');
  const [orgFiltro,     setOrgFiltro]     = useState(null);   // organizacion id
  const [compFiltro,    setCompFiltro]    = useState(null);   // competencia id
  const [jornadaFiltro, setJornadaFiltro] = useState(null);
  const [searchText,    setSearchText]    = useState('');
  const [viewMode,      setViewMode]      = useState('grid'); // 'grid' | 'list'

  useEffect(() => {
    api.get('/partidos')
      .then(res => setPartidos(res.data || []))
      .catch(err => console.error('Error al traer partidos:', err))
      .finally(() => setLoading(false));
  }, []);

  // ── Derived filter options ─────────────────────────────────────────────────

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
      if (!map[c.id]) map[c.id] = { id: c.id, nombre: c.nombre };
    });
    return Object.values(map);
  }, [partidos, orgFiltro]);

  const jornadas = useMemo(() => {
    const set = new Set();
    partidos.forEach(p => {
      if (p.jornada) {
        const orgId = p.competencia?.temporada?.organizacion?.id;
        const cId   = p.competencia?.id;
        if (orgFiltro  && orgId !== orgFiltro)  return;
        if (compFiltro && cId   !== compFiltro) return;
        set.add(p.jornada);
      }
    });
    return [...set];
  }, [partidos, orgFiltro, compFiltro]);

  // ── Filter & classify ──────────────────────────────────────────────────────

  const filtered = useMemo(() => {
    return partidos.filter(p => {
      const orgId  = p.competencia?.temporada?.organizacion?.id;
      const cId    = p.competencia?.id;
      const status = classifyMatch(p);

      if (orgFiltro     && orgId       !== orgFiltro)     return false;
      if (compFiltro    && cId         !== compFiltro)    return false;
      if (jornadaFiltro && p.jornada   !== jornadaFiltro) return false;
      if (statusTab     !== 'all'      && status         !== statusTab) return false;

      if (searchText.trim()) {
        const q = searchText.toLowerCase();
        const localNom   = p.local?.nombre?.toLowerCase()    || '';
        const visitaNom  = p.visitante?.nombre?.toLowerCase() || '';
        const compNom    = p.competencia?.nombre?.toLowerCase() || '';
        const orgNom     = orgId && organizaciones.find(o => o.id === orgId)?.nombre?.toLowerCase() || '';
        if (![localNom, visitaNom, compNom, orgNom].some(v => v.includes(q))) return false;
      }

      return true;
    });
  }, [partidos, orgFiltro, compFiltro, jornadaFiltro, statusTab, searchText, organizaciones]);

  const counts = useMemo(() => {
    let all = 0, live = 0, upcoming = 0, finished = 0;
    filtered.forEach(p => {
      const s = classifyMatch(p);
      all++;
      if (s === 'live')     live++;
      if (s === 'upcoming') upcoming++;
      if (s === 'finished') finished++;
    });
    return { all, live, upcoming, finished };
  }, [filtered]);

  // ── Grouped for display ────────────────────────────────────────────────────

  const grouped = useMemo(() => {
    // Group by competencia + jornada for better readability
    const map = {};
    filtered.forEach(p => {
      const compNom = p.competencia?.nombre || 'Sin Competencia';
      const jornada = p.jornada || 'Sin Jornada';
      const key = `${compNom}||${jornada}`;
      if (!map[key]) map[key] = { compNom, jornada, partidos: [] };
      map[key].partidos.push(p);
    });
    return Object.values(map);
  }, [filtered]);

  const activeFiltersCount = [orgFiltro, compFiltro, jornadaFiltro, searchText.trim()].filter(Boolean).length;

  function resetFilters() {
    setOrgFiltro(null); setCompFiltro(null); setJornadaFiltro(null); setSearchText('');
  }

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="relative min-h-screen bg-background pt-28 pb-16 overflow-hidden">

      {/* Background */}
      <div
        className="absolute inset-0 bg-cover bg-center z-0"
        style={{ backgroundImage: "url('https://images.unsplash.com/photo-1511512578047-dfb367046420?q=80&w=1920&auto=format&fit=crop')" }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-background/95 via-background/70 to-background z-10" />
      </div>
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/15 blur-[140px] rounded-full pointer-events-none z-10" />

      <div className="relative z-20 max-w-7xl mx-auto px-6 lg:px-10 space-y-10">

        {/* Hero */}
        <div className="text-center max-w-2xl mx-auto space-y-4">
          <Badge
            variant="primary"
            className="px-4 py-1.5 text-xs font-condensed tracking-widest text-primary border-primary/30 bg-primary/10 rounded-full animate-pulse-glow"
          >
            🔥 Fixture & Cronograma
          </Badge>
          <h1 className="text-5xl md:text-7xl font-display font-extrabold uppercase tracking-tight leading-[0.85] text-foreground">
            PARTIDOS Y{' '}
            <span className="bg-clip-text bg-gradient-to-r from-primary to-destructive text-transparent">
              CALENDARIO
            </span>
          </h1>
          <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
            Sigue el cronograma oficial de enfrentamientos, resultados en vivo y duelos finalizados del circuito.
          </p>
        </div>

        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary" />
          </div>
        ) : (
          <div className="space-y-6">

            {/* ── FILTER PANEL ── */}
            <div className="border border-border/50 bg-card/20 backdrop-blur-md rounded-2xl p-5 shadow-lg space-y-5">

              {/* Row 1: Status tabs + view toggle */}
              <div className="flex flex-wrap items-center justify-between gap-3">
                {/* Status tabs */}
                <div className="flex gap-1 bg-muted/30 p-1 rounded-lg border border-border/30 overflow-x-auto">
                  {[
                    { id: 'all',      label: 'Todos',    emoji: '🌐' },
                    { id: 'live',     label: 'En Vivo',  emoji: '🔴' },
                    { id: 'upcoming', label: 'Próximos', emoji: '📅' },
                    { id: 'finished', label: 'Finales',  emoji: '🏁' },
                  ].map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setStatusTab(tab.id)}
                      className={`flex items-center gap-1.5 px-4 py-2 rounded-md text-xs font-bold whitespace-nowrap transition-all duration-200 ${
                        statusTab === tab.id
                          ? 'bg-background text-primary shadow-sm border border-border/40'
                          : 'text-muted-foreground hover:text-foreground hover:bg-muted/40'
                      }`}
                    >
                      {tab.emoji} {tab.label}
                      <span className={`text-[9px] px-1.5 py-0.5 rounded font-black ${statusTab === tab.id ? 'bg-primary/15 text-primary' : 'bg-muted/50'}`}>
                        {counts[tab.id]}
                      </span>
                    </button>
                  ))}
                </div>

                {/* View mode toggle */}
                <div className="flex gap-1 bg-muted/30 p-1 rounded-lg border border-border/30">
                  <button
                    onClick={() => setViewMode('grid')}
                    title="Vista cuadrícula"
                    className={`p-2 rounded-md transition-all duration-200 ${viewMode === 'grid' ? 'bg-background text-primary border border-border/40 shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    title="Vista lista"
                    className={`p-2 rounded-md transition-all duration-200 ${viewMode === 'list' ? 'bg-background text-primary border border-border/40 shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Row 2: Search */}
              <div className="relative">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="Buscar equipo, competencia u organización..."
                  value={searchText}
                  onChange={e => setSearchText(e.target.value)}
                  className="w-full bg-muted/20 border border-border/40 rounded-xl pl-10 pr-4 py-2.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 focus:bg-muted/30 transition-all"
                />
                {searchText && (
                  <button
                    onClick={() => setSearchText('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>

              {/* Row 3: Organization filter chips */}
              {organizaciones.length > 0 && (
                <div className="space-y-2">
                  <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Organización</p>
                  <div className="flex flex-wrap gap-2">
                    <FilterChip
                      label="Todas"
                      active={orgFiltro === null}
                      onClick={() => { setOrgFiltro(null); setCompFiltro(null); setJornadaFiltro(null); }}
                    />
                    {organizaciones.map(org => (
                      <FilterChip
                        key={org.id}
                        label={org.nombre}
                        active={orgFiltro === org.id}
                        count={partidos.filter(p => p.competencia?.temporada?.organizacion?.id === org.id).length}
                        onClick={() => { setOrgFiltro(org.id); setCompFiltro(null); setJornadaFiltro(null); }}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Row 4: Competition chips (shown when org is selected or there are few comps) */}
              {competencias.length > 0 && (
                <div className="space-y-2">
                  <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Competencia</p>
                  <div className="flex flex-wrap gap-2">
                    <FilterChip
                      label="Todas"
                      active={compFiltro === null}
                      onClick={() => { setCompFiltro(null); setJornadaFiltro(null); }}
                    />
                    {competencias.map(c => (
                      <FilterChip
                        key={c.id}
                        label={c.nombre}
                        active={compFiltro === c.id}
                        count={partidos.filter(p => p.competencia?.id === c.id).length}
                        onClick={() => { setCompFiltro(c.id); setJornadaFiltro(null); }}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Row 5: Jornada chips (only when competition is filtered) */}
              {compFiltro && jornadas.length > 1 && (
                <div className="space-y-2">
                  <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Jornada</p>
                  <div className="flex flex-wrap gap-2">
                    <FilterChip
                      label="Todas"
                      active={jornadaFiltro === null}
                      onClick={() => setJornadaFiltro(null)}
                    />
                    {jornadas.map(j => (
                      <FilterChip
                        key={j}
                        label={j}
                        active={jornadaFiltro === j}
                        onClick={() => setJornadaFiltro(j)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Active filters summary */}
              {activeFiltersCount > 0 && (
                <div className="flex items-center justify-between border-t border-border/30 pt-3">
                  <span className="text-[10px] text-muted-foreground">
                    Mostrando <span className="text-foreground font-bold">{filtered.length}</span> de{' '}
                    <span className="text-foreground font-bold">{partidos.length}</span> partidos
                  </span>
                  <button
                    onClick={resetFilters}
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

            {/* ── RESULTS ── */}
            {filtered.length === 0 ? (
              <div className="text-center py-20 space-y-3">
                <div className="text-5xl">🔍</div>
                <p className="text-base font-black uppercase tracking-wider text-foreground">Sin resultados</p>
                <p className="text-sm text-muted-foreground">Prueba ajustando los filtros o busca otro término.</p>
                <button onClick={resetFilters} className="text-xs text-primary underline underline-offset-2 hover:no-underline font-bold">
                  Limpiar todos los filtros
                </button>
              </div>
            ) : viewMode === 'list' ? (
              /* LIST VIEW — grouped by competencia + jornada */
              <div className="space-y-8">
                {grouped.map(group => (
                  <div key={`${group.compNom}||${group.jornada}`} className="space-y-2">
                    <div className="flex items-center gap-3">
                      <div className="h-px flex-1 bg-border/30" />
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[9px] font-black uppercase tracking-widest text-primary">{group.compNom}</span>
                        <span className="text-[9px] text-muted-foreground">·</span>
                        <span className="text-[9px] font-bold text-muted-foreground uppercase">{group.jornada}</span>
                      </div>
                      <div className="h-px flex-1 bg-border/30" />
                    </div>
                    <div className="space-y-1.5">
                      {group.partidos.map(p => (
                        <MatchCard key={p.id} partido={p} view="list" />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              /* GRID VIEW — grouped */
              <div className="space-y-10">
                {grouped.map(group => (
                  <div key={`${group.compNom}||${group.jornada}`} className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="h-px flex-1 bg-border/30" />
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[10px] font-black uppercase tracking-widest text-primary px-3 py-1 bg-primary/10 border border-primary/20 rounded-full">
                          {group.compNom}
                        </span>
                        <span className="text-[9px] font-bold text-muted-foreground uppercase px-2 py-1 bg-muted/20 border border-border/30 rounded-full">
                          {group.jornada}
                        </span>
                      </div>
                      <div className="h-px flex-1 bg-border/30" />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {group.partidos.map(p => (
                        <MatchCard key={p.id} partido={p} view="grid" />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

          </div>
        )}
      </div>
    </div>
  );
}
