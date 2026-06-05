import React, { useState, useEffect, useCallback } from 'react';
import api from '@/api/axios';

export default function JugadoresTab() {
  const [missingData, setMissingData] = useState([]);
  const [similarGroups, setSimilarGroups] = useState([]);

  const [missingPage, setMissingPage] = useState(1);
  const [similarPage, setSimilarPage] = useState(1);

  const [missingHasMore, setMissingHasMore] = useState(false);
  const [similarHasMore, setSimilarHasMore] = useState(false);

  const [loadingMissing, setLoadingMissing] = useState(false);
  const [loadingSimilar, setLoadingSimilar] = useState(false);
  const [error, setError] = useState(null);

  const fetchMissing = useCallback(async (page, replace = false) => {
    setLoadingMissing(true);
    setError(null);
    try {
      const res = await api.get('/usuarios/auditoria', {
        params: { type: 'missing', per_page: 5, page }
      });
      const list = res.data.data || [];
      if (replace) {
        setMissingData(list);
      } else {
        setMissingData(prev => [...prev, ...list]);
      }
      setMissingHasMore(page < res.data.last_page);
    } catch (err) {
      console.error(err);
      setError("No se pudieron cargar las fichas incompletas.");
    } finally {
      setLoadingMissing(false);
    }
  }, []);

  const fetchSimilar = useCallback(async (page, replace = false) => {
    setLoadingSimilar(true);
    setError(null);
    try {
      const res = await api.get('/usuarios/auditoria', {
        params: { type: 'similar', per_page: 3, page }
      });
      const list = res.data.data || [];
      if (replace) {
        setSimilarGroups(list);
      } else {
        setSimilarGroups(prev => [...prev, ...list]);
      }
      setSimilarHasMore(page < res.data.last_page);
    } catch (err) {
      console.error(err);
      setError("No se pudieron cargar los GamerTAGs similares.");
    } finally {
      setLoadingSimilar(false);
    }
  }, []);

  useEffect(() => {
    fetchMissing(1, true);
    fetchSimilar(1, true);
  }, [fetchMissing, fetchSimilar]);

  const loadMoreMissing = () => {
    const nextPage = missingPage + 1;
    setMissingPage(nextPage);
    fetchMissing(nextPage, false);
  };

  const loadMoreSimilar = () => {
    const nextPage = similarPage + 1;
    setSimilarPage(nextPage);
    fetchSimilar(nextPage, false);
  };

  if (error) {
    return <div className="text-xs text-destructive font-bold p-4 bg-destructive/10 border border-destructive/20 rounded-xl">{error}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-border/10 pb-3 text-left">
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
          <div>
            <h4 className="text-sm font-bold text-foreground uppercase tracking-wide">Auditoría y Control de Calidad de Jugadores</h4>
            <p className="text-xs text-muted-foreground">Verificación de identificadores y detección de posibles cuentas similares o duplicadas.</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 text-left">
        
        {/* Tarjeta 1: Datos Faltantes */}
        <div className="space-y-3">
          <h5 className="text-xs font-black text-amber-500 uppercase tracking-wider flex items-center gap-1.5">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            Fichas Incompletas
          </h5>

          {loadingMissing && missingData.length === 0 ? (
            <div className="py-6 text-center text-xs text-muted-foreground font-mono">
              Analizando perfiles incompletos...
            </div>
          ) : missingData.length === 0 ? (
            <div className="text-xs text-emerald-400 font-bold bg-emerald-500/5 border border-emerald-500/10 rounded-2xl p-4 flex items-center gap-2">
              <svg className="w-4 h-4 text-emerald-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Todos los jugadores registrados tienen completo su GamerTAG y EA ID.</span>
            </div>
          ) : (
            <div className="space-y-2.5">
              <div className="space-y-2.5 max-h-[350px] overflow-y-auto pr-1 custom-scrollbar">
                {missingData.map((player) => (
                  <div key={player.id} className="p-3.5 bg-amber-500/5 hover:bg-amber-500/10 border border-amber-500/20 hover:border-amber-500/40 rounded-2xl flex items-center justify-between gap-3 transition-all duration-300">
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs font-bold text-foreground truncate">{player.name}</span>
                      <span className="text-[10px] text-muted-foreground truncate">{player.email}</span>
                      <div className="flex flex-wrap gap-1.5 mt-1.5">
                        {player.missingGt && (
                          <span className="text-[8px] font-black uppercase tracking-wider bg-rose-500/15 text-rose-400 border border-rose-500/30 px-2 py-0.5 rounded-full">
                            Falta GamerTAG
                          </span>
                        )}
                        {player.missingEa && (
                          <span className="text-[8px] font-black uppercase tracking-wider bg-amber-500/15 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded-full">
                            Falta EA ID
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {missingHasMore && (
                <div className="flex justify-center pt-2">
                  <button
                    onClick={loadMoreMissing}
                    disabled={loadingMissing}
                    className="px-4 py-2 rounded-xl border border-amber-500/40 bg-amber-500/10 text-amber-500 text-[9px] font-mono font-bold tracking-widest uppercase hover:bg-amber-500 hover:text-slate-950 transition-all duration-300 disabled:opacity-50 cursor-pointer"
                  >
                    {loadingMissing ? 'CARGANDO...' : 'CARGAR MÁS INCOMPLETAS'}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Tarjeta 2: Similitud / Duplicados */}
        <div className="space-y-3">
          <h5 className="text-xs font-black text-rose-500 uppercase tracking-wider flex items-center gap-1.5">
            <svg className="w-4 h-4 text-rose-500 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            GamerTAGs Similares
          </h5>

          {loadingSimilar && similarGroups.length === 0 ? (
            <div className="py-6 text-center text-xs text-muted-foreground font-mono">
              Calculando distancias Levenshtein...
            </div>
          ) : similarGroups.length === 0 ? (
            <div className="text-xs text-emerald-400 font-bold bg-emerald-500/5 border border-emerald-500/10 rounded-2xl p-4 flex items-center gap-2">
              <svg className="w-4 h-4 text-emerald-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>No se han detectado GamerTAGs sospechosamente similares o duplicados.</span>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1 custom-scrollbar">
                {similarGroups.map((group, idx) => (
                  <div key={idx} className="p-4 bg-rose-500/5 hover:bg-rose-500/10 border border-rose-500/20 hover:border-rose-500/30 rounded-2xl space-y-3 transition-all duration-300">
                    <p className="text-xs text-rose-400 font-black uppercase tracking-wide flex items-center gap-1.5">
                      <svg className="w-4 h-4 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      Conflicto / Duplicado
                    </p>
                    <div className="divide-y divide-border/10">
                      {group.map((player) => (
                        <div key={player.id} className="py-2.5 first:pt-0 last:pb-0 flex items-center justify-between text-xs gap-3 font-mono">
                          <div className="min-w-0 text-left">
                            <span className="font-bold text-foreground block truncate">{player.gamertag}</span>
                            <span className="text-[10px] text-muted-foreground block truncate font-sans">{player.name} ({player.email})</span>
                          </div>
                          <span className="text-[9px] bg-background/50 border border-border/30 text-muted-foreground px-2.5 py-0.5 rounded-full font-mono shrink-0 font-bold">
                            UID: {player.id}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {similarHasMore && (
                <div className="flex justify-center pt-2">
                  <button
                    onClick={loadMoreSimilar}
                    disabled={loadingSimilar}
                    className="px-4 py-2 rounded-xl border border-rose-500/40 bg-rose-500/10 text-rose-400 text-[9px] font-mono font-bold tracking-widest uppercase hover:bg-rose-500 hover:text-slate-950 transition-all duration-300 disabled:opacity-50 cursor-pointer"
                  >
                    {loadingSimilar ? 'CARGANDO...' : 'CARGAR MÁS CONFLICTOS'}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
