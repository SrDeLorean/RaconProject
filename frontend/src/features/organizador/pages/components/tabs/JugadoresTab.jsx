import React, { useState, useEffect } from 'react';
import api from '@/api/axios';

export default function JugadoresTab({ playersAudit: initialPlayersAudit }) {
  const [loading, setLoading] = useState(!initialPlayersAudit);
  const [error, setError] = useState(null);
  const [playersAudit, setPlayersAudit] = useState(initialPlayersAudit || { missingData: [], similarGroups: [] });

  useEffect(() => {
    if (initialPlayersAudit) {
      setPlayersAudit(initialPlayersAudit);
      setLoading(false);
      return;
    }

    const fetchAndAuditPlayers = async () => {
      setLoading(true);
      setError(null);
      try {
        const responsePlayers = await api.get('/usuarios', { params: { role: 'jugador', per_page: 1000 } });
        const allPlayers = responsePlayers.data?.data || responsePlayers.data || [];

        // Calcular auditoría de jugadores
        const missing = [];
        allPlayers.forEach(p => {
          const missingEa = !p.id_ea || p.id_ea.trim() === '';
          const missingGt = !p.gamertag || p.gamertag.trim() === '';
          if (missingEa || missingGt) {
            missing.push({
              ...p,
              missingEa,
              missingGt
            });
          }
        });

        // Agrupamiento por similitud
        const playersWithGt = allPlayers.filter(p => p.gamertag && p.gamertag.trim() !== '');
        const visited = new Set();
        const similarGroups = [];

        const getLevenshteinDistance = (a, b) => {
          const matrix = [];
          for (let i = 0; i <= b.length; i++) matrix[i] = [i];
          for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
          for (let i = 1; i <= b.length; i++) {
            for (let j = 1; j <= a.length; j++) {
              if (b.charAt(i - 1) === a.charAt(j - 1)) {
                matrix[i][j] = matrix[i - 1][j - 1];
              } else {
                matrix[i][j] = Math.min(
                  matrix[i - 1][j - 1] + 1,
                  matrix[i][j - 1] + 1,
                  matrix[i - 1][j] + 1
                );
              }
            }
          }
          return matrix[b.length][a.length];
        };

        const isSimilar = (gt1, gt2) => {
          if (!gt1 || !gt2) return false;
          const clean = (str) => {
            return str
              .toLowerCase()
              .replace(/[\s\._\-]/g, '')
              .replace(/0/g, 'o')
              .replace(/1/g, 'i')
              .replace(/3/g, 'e')
              .replace(/4/g, 'a')
              .replace(/5/g, 's')
              .replace(/7/g, 't')
              .replace(/8/g, 'b');
          };
          const c1 = clean(gt1);
          const c2 = clean(gt2);
          if (c1 === c2) return true;
          
          const dist = getLevenshteinDistance(c1, c2);
          if (dist <= 2 && Math.min(c1.length, c2.length) >= 4) {
            return true;
          }
          return false;
        };

        for (let i = 0; i < playersWithGt.length; i++) {
          const p1 = playersWithGt[i];
          if (visited.has(p1.id)) continue;

          const currentGroup = [p1];
          for (let j = i + 1; j < playersWithGt.length; j++) {
            const p2 = playersWithGt[j];
            if (visited.has(p2.id)) continue;

            if (isSimilar(p1.gamertag, p2.gamertag)) {
              currentGroup.push(p2);
            }
          }

          if (currentGroup.length > 1) {
            currentGroup.forEach(p => visited.add(p.id));
            similarGroups.push(currentGroup);
          }
        }

        setPlayersAudit({
          missingData: missing,
          similarGroups: similarGroups
        });
      } catch (err) {
        console.error("Error auditing players:", err);
        setError("No se pudieron cargar los datos de auditoría.");
      } finally {
        setLoading(false);
      }
    };
    fetchAndAuditPlayers();
  }, []);

  if (loading) {
    return (
      <div className="py-12 flex flex-col items-center justify-center gap-2">
        <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-primary"></div>
        <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Ejecutando auditoría biométrica de GamerTAGs...</span>
      </div>
    );
  }

  if (error) {
    return <div className="text-xs text-destructive font-bold p-4 bg-destructive/10 border border-destructive/20 rounded-xl">{error}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-border/10 pb-3">
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tarjeta 1: Datos Faltantes */}
        <div className="space-y-3">
          <h5 className="text-xs font-black text-amber-500 uppercase tracking-wider flex items-center gap-1.5">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            Fichas Incompletas ({playersAudit.missingData.length})
          </h5>
          {playersAudit.missingData.length === 0 ? (
            <div className="text-xs text-emerald-400 font-bold bg-emerald-500/5 border border-emerald-500/10 rounded-2xl p-4 flex items-center gap-2">
              <svg className="w-4 h-4 text-emerald-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Todos los jugadores registrados tienen completo su GamerTAG y EA ID.</span>
            </div>
          ) : (
            <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
              {playersAudit.missingData.map((player) => (
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
          )}
        </div>

        {/* Tarjeta 2: Similitud / Duplicados */}
        <div className="space-y-3">
          <h5 className="text-xs font-black text-rose-500 uppercase tracking-wider flex items-center gap-1.5">
            <svg className="w-4 h-4 text-rose-500 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            GamerTAGs Similares ({playersAudit.similarGroups.length})
          </h5>
          {playersAudit.similarGroups.length === 0 ? (
            <div className="text-xs text-emerald-400 font-bold bg-emerald-500/5 border border-emerald-500/10 rounded-2xl p-4 flex items-center gap-2">
              <svg className="w-4 h-4 text-emerald-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>No se han detectado GamerTAGs sospechosamente similares o duplicados.</span>
            </div>
          ) : (
            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
              {playersAudit.similarGroups.map((group, idx) => (
                <div key={idx} className="p-4 bg-rose-500/5 hover:bg-rose-500/10 border border-rose-500/20 hover:border-rose-500/30 rounded-2xl space-y-3 transition-all duration-300">
                  <p className="text-xs text-rose-400 font-black uppercase tracking-wide flex items-center gap-1.5">
                    <svg className="w-4 h-4 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    Conflicto / Duplicado
                  </p>
                  <div className="divide-y divide-border/10">
                    {group.map((player) => (
                      <div key={player.id} className="py-2.5 first:pt-0 last:pb-0 flex items-center justify-between text-xs gap-3">
                        <div className="min-w-0">
                          <span className="font-bold text-foreground block truncate">{player.gamertag}</span>
                          <span className="text-[10px] text-muted-foreground block truncate">{player.name} ({player.email})</span>
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
          )}
        </div>
      </div>
    </div>
  );
}
