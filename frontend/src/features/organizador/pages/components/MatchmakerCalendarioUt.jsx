import React, { useState, useMemo } from 'react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Badge from '@/components/ui/Badge';
import Card from '@/components/shared/Card';
import api from '@/api/axios';
import Modal from '@/components/ui/Modal';

export default function MatchmakerCalendarioUt({ equipos = [], competenciaId = null }) {
  const [formatoTorneo, setFormatoTorneo] = useState('liga'); // 'liga' | 'playoff' | 'copa'
  const [partidos, setPartidos] = useState([]);
  const [modo, setModo] = useState('simple'); // 'simple' o 'doble'
  const [diasSeleccionados, setDiasSeleccionados] = useState(['Monday', 'Thursday']); // Dias de la semana
  const [horasInput, setHorasInput] = useState('22:00, 22:30'); // Lista de horas separadas por comas
  const [fechaInicio, setFechaInicio] = useState('2026-06-01');
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [numGrupos, setNumGrupos] = useState(2); // 2 o 4 grupos
  const [grupos, setGrupos] = useState({}); // { 'A': [...], 'B': [...] }
  const [faseActual, setFaseActual] = useState('grupos'); // 'grupos' o 'playoffs' (para copa)
  const [isSaved, setIsSaved] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);

  // EA Reporting System States
  const [reportMethod, setReportMethod] = useState('manual'); // 'manual' | 'ea'
  const [eaMatches, setEaMatches] = useState([]);
  const [eaLoading, setEaLoading] = useState(false);
  const [eaError, setEaError] = useState(null);
  const [selectedEaMatchId, setSelectedEaMatchId] = useState('');
  const [eaClubLocalId, setEaClubLocalId] = useState('');
  const [eaClubVisitanteId, setEaClubVisitanteId] = useState('');
  const [eaProcessing, setEaProcessing] = useState(false);
  const [eaWarnings, setEaWarnings] = useState(null);
  const [eaMismatchModal, setEaMismatchModal] = useState(null);

  // Modales y Estadísticas Estado
  const [isStatsModalOpen, setIsStatsModalOpen] = useState(false);
  const [statsScoreA, setStatsScoreA] = useState(0);
  const [statsScoreB, setStatsScoreB] = useState(0);
  const [teamAStats, setTeamAStats] = useState({ shots: 10, possession: 50, corners: 4, fouls: 5 });
  const [teamBStats, setTeamBStats] = useState({ shots: 8, possession: 50, corners: 3, fouls: 6 });
  const [playerStats, setPlayerStats] = useState([]);

  const toggleDia = (dia) => {
    if (diasSeleccionados.includes(dia)) {
      setDiasSeleccionados(diasSeleccionados.filter(d => d !== dia));
    } else {
      setDiasSeleccionados([...diasSeleccionados, day => day]);
      // Actually we need to toggle it correctly
      setDiasSeleccionados([...diasSeleccionados, dia]);
    }
  };

  const getNextMatchDate = (currentDate, daysArray, hoursArray, matchIndex) => {
    const hoursCount = hoursArray.length;
    const dayOfWeekNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    
    const hourSlot = matchIndex % hoursCount;
    const dayIndexOffset = Math.floor(matchIndex / hoursCount);
    
    let date = new Date(currentDate);
    let matchedDays = 0;
    
    while (matchedDays < dayIndexOffset || !daysArray.includes(dayOfWeekNames[date.getDay()])) {
      if (daysArray.includes(dayOfWeekNames[date.getDay()])) {
        matchedDays++;
      }
      if (matchedDays < dayIndexOffset || !daysArray.includes(dayOfWeekNames[date.getDay()])) {
        date.setDate(date.getDate() + 1);
      }
    }
    
    return {
      dateString: date.toISOString().split('T')[0],
      hourString: hoursArray[hourSlot].trim()
    };
  };

  // Generador de Fixture Round-Robin (Algoritmo Berger)
  const buildRoundRobin = (teamList, startOffset = 0, prefixJornada = '') => {
    let list = [...teamList];
    if (list.length % 2 !== 0) {
      list.push({ id: 'bye', nombre: 'DESCANSO', abreviatura: 'BYE' });
    }
    
    const roundsCount = list.length - 1;
    const matchesPerRound = list.length / 2;
    let matches = [];
    
    for (let r = 0; r < roundsCount; r++) {
      for (let m = 0; m < matchesPerRound; m++) {
        const home = (r + m) % (list.length - 1);
        let away = (list.length - 1 - m + r) % (list.length - 1);
        
        if (m === 0) away = list.length - 1;
        
        if (list[home].id !== 'bye' && list[away].id !== 'bye') {
          matches.push({
            jornada: `${prefixJornada}${r + 1}`,
            local: list[home],
            visitante: list[away],
            score_local: null,
            score_visitante: null,
            stats: null
          });
        }
      }
    }

    if (modo === 'doble') {
      const returnMatches = matches.map(m => ({
        jornada: `${prefixJornada}${Number(m.jornada.replace(prefixJornada, '')) + roundsCount}`,
        local: m.visitante,
        visitante: m.local,
        score_local: null,
        score_visitante: null,
        stats: null
      }));
      matches = [...matches, ...returnMatches];
    }
    return matches;
  };

  // Generador de Llaves de Playoffs
  const buildPlayoffBracket = (teamsList, baseMatchIdx = 1, startSchedIndex = 0) => {
    const totalTeams = teamsList.length;
    let power = 2;
    while (power < totalTeams) {
      power *= 2;
    }
    
    let list = [...teamsList];
    while (list.length < power) {
      list.push({ id: 'bye', nombre: 'DESCANSO', abreviatura: 'BYE' });
    }

    if (formatoTorneo === 'playoff') {
      list.sort(() => Math.random() - 0.5);
    }

    let playoffMatches = [];
    let matchIdx = baseMatchIdx;
    let schedIdx = startSchedIndex;
    const hoursArray = horasInput.split(',');

    let currentPower = power;
    let roundIndex = 0;
    const roundMatchups = [];

    while (currentPower >= 2) {
      const roundName = currentPower === 16 ? 'Octavos' : currentPower === 8 ? 'Cuartos' : currentPower === 4 ? 'Semis' : 'Final';
      const numMatchups = currentPower / 2;
      const matchupsInRound = [];

      for (let i = 0; i < numMatchups; i++) {
        const isFirstRound = roundIndex === 0;

        let teamL = { id: `w-${roundIndex}-${i}-L`, nombre: 'Por definir', abreviatura: 'TBD' };
        let teamV = { id: `w-${roundIndex}-${i}-V`, nombre: 'Por definir', abreviatura: 'TBD' };

        if (isFirstRound) {
          teamL = list[i * 2];
          teamV = list[i * 2 + 1];
        }

        const matchMatches = [];
        const sched1 = getNextMatchDate(fechaInicio, diasSeleccionados, hoursArray, schedIdx++);
        const p1 = {
          id: matchIdx++,
          jornada: roundName,
          grupo: null,
          local: teamL,
          visitante: teamV,
          score_local: teamL.id === 'bye' ? 0 : teamV.id === 'bye' ? 3 : null,
          score_visitante: teamL.id === 'bye' ? 3 : teamV.id === 'bye' ? 0 : null,
          fecha: sched1.dateString,
          hora: sched1.hourString,
          stats: null,
          leg: 'Ida',
          matchupIndex: i
        };
        matchMatches.push(p1);

        if (modo === 'doble') {
          const sched2 = getNextMatchDate(fechaInicio, diasSeleccionados, hoursArray, schedIdx++);
          const p2 = {
            id: matchIdx++,
            jornada: roundName,
            grupo: null,
            local: teamV,
            visitante: teamL,
            score_local: teamL.id === 'bye' ? 3 : teamV.id === 'bye' ? 0 : null,
            score_visitante: teamL.id === 'bye' ? 0 : teamV.id === 'bye' ? 3 : null,
            fecha: sched2.dateString,
            hora: sched2.hourString,
            stats: null,
            leg: 'Vuelta',
            matchupIndex: i
          };
          matchMatches.push(p2);
        }

        matchupsInRound.push({
          index: i,
          partidos: matchMatches
        });
        playoffMatches.push(...matchMatches);
      }

      roundMatchups.push(matchupsInRound);
      currentPower /= 2;
      roundIndex++;
    }

    // Enlazar rondas para avance automático
    for (let r = 0; r < roundMatchups.length - 1; r++) {
      const currentRound = roundMatchups[r];
      const nextRound = roundMatchups[r + 1];

      currentRound.forEach(matchup => {
        const nextMatchupIdx = Math.floor(matchup.index / 2);
        const slot = matchup.index % 2 === 0 ? 'local' : 'visitante';
        const nextJornada = nextRound[nextMatchupIdx].partidos[0].jornada;

        matchup.partidos.forEach(p => {
          p.siguienteMatchup = {
            jornada: nextJornada,
            matchupIndex: nextMatchupIdx,
            slot: slot
          };
        });
      });
    }

    // Propagar byes
    let updatedMatches = [...playoffMatches];
    let changed = true;
    while (changed) {
      changed = false;
      updatedMatches.forEach(p => {
        if (p.local?.id === 'bye' || p.visitante?.id === 'bye') {
          const ganador = p.local?.id === 'bye' ? p.visitante : p.local;
          if (p.siguienteMatchup && ganador && ganador.id !== 'bye') {
            const nextJornada = p.siguienteMatchup.jornada;
            const nextMatchupIdx = p.siguienteMatchup.matchupIndex;
            const slot = p.siguienteMatchup.slot;

            updatedMatches.forEach(np => {
              if (np.jornada === nextJornada && np.matchupIndex === nextMatchupIdx) {
                if (np.leg === 'Ida') {
                  if (slot === 'local' && np.local.id !== ganador.id) {
                    np.local = ganador;
                    changed = true;
                  } else if (slot === 'visitante' && np.visitante.id !== ganador.id) {
                    np.visitante = ganador;
                    changed = true;
                  }
                } else if (np.leg === 'Vuelta') {
                  if (slot === 'local' && np.visitante.id !== ganador.id) {
                    np.visitante = ganador;
                    changed = true;
                  } else if (slot === 'visitante' && np.local.id !== ganador.id) {
                    np.local = ganador;
                    changed = true;
                  }
                }
              }
            });
          }
        }
      });
    }

    return updatedMatches;
  };

  const generarMatchmaking = () => {
    if (equipos.length < 2) return;
    setIsSaved(false);

    const hoursArray = horasInput.split(',');

    if (formatoTorneo === 'liga') {
      let roundRobinMatches = buildRoundRobin(equipos);
      const activeMatches = roundRobinMatches.map((match, index) => {
        const schedule = getNextMatchDate(fechaInicio, diasSeleccionados, hoursArray, index);
        return {
          ...match,
          id: index + 1,
          fecha: schedule.dateString,
          hora: schedule.hourString
        };
      });
      setPartidos(activeMatches);

    } else if (formatoTorneo === 'playoff') {
      const playoffMatches = buildPlayoffBracket(equipos, 1, 0);
      setPartidos(playoffMatches);

    } else if (formatoTorneo === 'copa') {
      let list = [...equipos].sort(() => Math.random() - 0.5);
      let newGroups = {};
      for (let g = 0; g < numGrupos; g++) {
        const char = String.fromCharCode(65 + g);
        newGroups[char] = [];
      }
      list.forEach((team, idx) => {
        const char = String.fromCharCode(65 + (idx % numGrupos));
        newGroups[char].push(team);
      });
      setGrupos(newGroups);
      setFaseActual('grupos');

      let copaMatches = [];
      let totalMatchIndex = 0;
      Object.keys(newGroups).forEach(groupName => {
        let groupRobin = buildRoundRobin(newGroups[groupName], 0, `Grupo ${groupName} - J`);
        groupRobin.forEach(match => {
          const schedule = getNextMatchDate(fechaInicio, diasSeleccionados, hoursArray, totalMatchIndex++);
          copaMatches.push({
            ...match,
            id: totalMatchIndex,
            fecha: schedule.dateString,
            hora: schedule.hourString,
            grupo: groupName
          });
        });
      });

      setPartidos(copaMatches);
    }
  };

  const handleSaveToDatabase = () => {
    if (!competenciaId) {
      alert('⚠️ ID de competencia no válido.');
      return;
    }
    setSaveLoading(true);

    api.post(`/competencias-ut/${competenciaId}/partidos/bulk`, { partidos })
    .then(res => {
      setSaveLoading(false);
      setIsSaved(true);
      alert(`🎉 ¡Fixture de UT guardado con éxito! Se registraron ${res.data.count || res.data.partidos?.length || 0} partidos en la base de datos.`);
    })
    .catch(err => {
      setSaveLoading(false);
      const msg = err.response?.data?.message || err.message;
      alert(`❌ Error al guardar el fixture: ${msg}`);
    });
  };

  const openStatsModal = async (match) => {
    if (match.local.id === 'bye' || match.visitante.id === 'bye') return;
    if (match.local.abreviatura === 'TBD' || match.visitante.abreviatura === 'TBD') return;
    
    setSelectedMatch(match);
    setStatsScoreA(match.score_local || 0);
    setStatsScoreB(match.score_visitante || 0);
    setReportMethod('manual');
    setEaMatches([]);
    setEaError(null);
    setSelectedEaMatchId('');
    setEaClubLocalId('');
    setEaClubVisitanteId('');
    setEaWarnings(null);

    // Obtener jugadores reales de ambos equipos para el reporte manual
    const activePlayers = [];
    
    // Local Captain and Partner
    if (match.local?.capitan) {
      activePlayers.push({
        id: match.local.capitan.id,
        name: `${match.local.capitan.name} (${match.local.nombre})`,
        goals: 0,
        assists: 0,
        yellowCard: false,
        redCard: false
      });
    }
    if (match.local?.companero) {
      activePlayers.push({
        id: match.local.companero.id,
        name: `${match.local.companero.name} (${match.local.nombre})`,
        goals: 0,
        assists: 0,
        yellowCard: false,
        redCard: false
      });
    }

    // Visitante Captain and Partner
    if (match.visitante?.capitan) {
      activePlayers.push({
        id: match.visitante.capitan.id,
        name: `${match.visitante.capitan.name} (${match.visitante.nombre})`,
        goals: 0,
        assists: 0,
        yellowCard: false,
        redCard: false
      });
    }
    if (match.visitante?.companero) {
      activePlayers.push({
        id: match.visitante.companero.id,
        name: `${match.visitante.companero.name} (${match.visitante.nombre})`,
        goals: 0,
        assists: 0,
        yellowCard: false,
        redCard: false
      });
    }

    if (match.stats) {
      setTeamAStats(match.stats.teamA);
      setTeamBStats(match.stats.teamB);
      // Mapear los resultados guardados a la lista de jugadores activos
      const mapped = activePlayers.map(ap => {
        const saved = match.stats.players?.find(p => p.id === ap.id);
        return saved ? { ...ap, ...saved } : ap;
      });
      setPlayerStats(mapped);
    } else {
      setTeamAStats({ shots: 10, possession: 50, corners: 4, fouls: 5 });
      setTeamBStats({ shots: 8, possession: 50, corners: 3, fouls: 6 });
      setPlayerStats(activePlayers);
    }
    
    setIsStatsModalOpen(true);

    // Intentar precargar partidos de EA en segundo plano
    setEaLoading(true);
    try {
      const res = await api.get(`/partidos-ut/${match.id}/ea-matches`);
      if (res.data && res.data.partidosEA) {
        setEaMatches(res.data.partidosEA);
        
        const localClubEaId = match.local?.club_id_ea;
        const visitClubEaId = match.visitante?.club_id_ea;
        if (localClubEaId) setEaClubLocalId(String(localClubEaId));
        if (visitClubEaId) setEaClubVisitanteId(String(visitClubEaId));
      }
    } catch (err) {
      console.warn("No se pudieron obtener los partidos de EA:", err);
      setEaError(err.response?.data?.message || "No se pudo conectar a la API de EA. Configura el Club ID de EA de los participantes.");
    } finally {
      setEaLoading(false);
    }
  };

  const handleSaveStats = () => {
    const updated = partidos.map(m => {
      if (m.id === selectedMatch.id) {
        return {
          ...m,
          score_local: Number(statsScoreA),
          score_visitante: Number(statsScoreB),
          stats: {
            teamA: teamAStats,
            teamB: teamBStats,
            players: playerStats
          }
        };
      }
      return m;
    });

    // Avance automático en playoffs
    if (formatoTorneo === 'playoff' || faseActual === 'playoffs') {
      const currentJornada = selectedMatch.jornada;
      const currentMatchupIdx = selectedMatch.matchupIndex;
      const matchupMatches = updated.filter(m => m.jornada === currentJornada && m.matchupIndex === currentMatchupIdx);

      let winner = null;
      if (modo === 'simple' || matchupMatches.length === 1) {
        const match = matchupMatches[0];
        if (match.score_local !== null && match.score_visitante !== null) {
          if (match.score_local > match.score_visitante) {
            winner = match.local;
          } else if (match.score_local < match.score_visitante) {
            winner = match.visitante;
          }
        }
      } else if (modo === 'doble' && matchupMatches.length === 2) {
        const leg1 = matchupMatches.find(m => m.leg === 'Ida');
        const leg2 = matchupMatches.find(m => m.leg === 'Vuelta');

        if (leg1 && leg2 && leg1.score_local !== null && leg1.score_visitante !== null && leg2.score_local !== null && leg2.score_visitante !== null) {
          const teamAScore = leg1.score_local + leg2.score_visitante;
          const teamBScore = leg1.score_visitante + leg2.score_local;

          if (teamAScore > teamBScore) {
            winner = leg1.local;
          } else if (teamAScore < teamBScore) {
            winner = leg1.visitante;
          }
        }
      }

      if (winner && selectedMatch.siguienteMatchup) {
        const nextMatchupInfo = selectedMatch.siguienteMatchup;
        updated.forEach(nm => {
          if (nm.jornada === nextMatchupInfo.jornada && nm.matchupIndex === nextMatchupInfo.matchupIndex) {
            if (nm.leg === 'Ida') {
              if (nextMatchupInfo.slot === 'local') nm.local = winner;
              else nm.visitante = winner;
            } else if (nm.leg === 'Vuelta') {
              if (nextMatchupInfo.slot === 'local') nm.visitante = winner;
              else nm.local = winner;
            }
          }
        });
      }
    }

    setPartidos(updated);
    setIsStatsModalOpen(false);
  };

  const handleEaReportSubmit = async (forceReport = false) => {
    if (!selectedEaMatchId || !eaClubLocalId || !eaClubVisitanteId) {
      alert("⚠️ Selecciona un partido de EA y confirma los IDs de Club de EA local y visitante.");
      return;
    }

    const dbLocalEaId = String(selectedMatch.local?.club_id_ea || '').trim();
    const dbVisitEaId = String(selectedMatch.visitante?.club_id_ea || '').trim();
    const idLocalMap = String(eaClubLocalId).trim();
    const idVisitMap = String(eaClubVisitanteId).trim();

    const matchContainsLocal = idLocalMap === dbLocalEaId || idVisitMap === dbLocalEaId;
    const matchContainsVisit = idLocalMap === dbVisitEaId || idVisitMap === dbVisitEaId;

    if (!matchContainsLocal || !matchContainsVisit) {
      const matchObj = eaMatches.find(m => m.matchId === selectedEaMatchId);
      const keys = matchObj && matchObj.clubs ? Object.keys(matchObj.clubs) : [];
      const clubA = keys[0] ? (matchObj.clubs[keys[0]]?.details?.name || 'Club A') : 'Desconocido';
      const clubB = keys[1] ? (matchObj.clubs[keys[1]]?.details?.name || 'Club B') : 'Desconocido';

      setEaMismatchModal({
        expectedLocal: selectedMatch.local?.nombre || 'Local Oficial',
        expectedVisitante: selectedMatch.visitante?.nombre || 'Visitante Oficial',
        expectedLocalId: dbLocalEaId,
        expectedVisitanteId: dbVisitEaId,
        receivedLocal: clubA,
        receivedVisitante: clubB,
        receivedLocalId: idLocalMap,
        receivedVisitanteId: idVisitMap,
      });
      return;
    }

    setEaProcessing(true);
    setEaWarnings(null);
    try {
      const res = await api.post(`/partidos-ut/${selectedMatch.id}/ea-report`, {
        ea_match_id: selectedEaMatchId,
        club_local_id: eaClubLocalId,
        club_visitante_id: eaClubVisitanteId,
        force: forceReport
      });

      if (res.data && res.data.success) {
        alert("🎉 ¡Partido de UT reportado exitosamente con datos de EA Sports FC!");
        
        const updated = partidos.map(m => {
          if (m.id === selectedMatch.id) {
            return {
              ...m,
              score_local: res.data.goles_local,
              score_visitante: res.data.goles_visitante,
              stats: {
                processedWithEa: true
              }
            };
          }
          return m;
        });

        // Avance automático en playoffs
        if (formatoTorneo === 'playoff' || faseActual === 'playoffs') {
          const currentJornada = selectedMatch.jornada;
          const currentMatchupIdx = selectedMatch.matchupIndex;
          const matchupMatches = updated.filter(m => m.jornada === currentJornada && m.matchupIndex === currentMatchupIdx);

          let winner = null;
          if (modo === 'simple' || matchupMatches.length === 1) {
            const match = matchupMatches[0];
            if (match.score_local !== null && match.score_visitante !== null) {
              if (match.score_local > match.score_visitante) {
                winner = match.local;
              } else if (match.score_local < match.score_visitante) {
                winner = match.visitante;
              }
            }
          } else if (modo === 'doble' && matchupMatches.length === 2) {
            const leg1 = matchupMatches.find(m => m.leg === 'Ida');
            const leg2 = matchupMatches.find(m => m.leg === 'Vuelta');

            if (leg1 && leg2 && leg1.score_local !== null && leg1.score_visitante !== null && leg2.score_local !== null && leg2.score_visitante !== null) {
              const teamAScore = leg1.score_local + leg2.score_visitante;
              const teamBScore = leg1.score_visitante + leg2.score_local;

              if (teamAScore > teamBScore) {
                winner = leg1.local;
              } else if (teamAScore < teamBScore) {
                winner = leg1.visitante;
              }
            }
          }

          if (winner && selectedMatch.siguienteMatchup) {
            const nextMatchupInfo = selectedMatch.siguienteMatchup;
            updated.forEach(nm => {
              if (nm.jornada === nextMatchupInfo.jornada && nm.matchupIndex === nextMatchupInfo.matchupIndex) {
                if (nm.leg === 'Ida') {
                  if (nextMatchupInfo.slot === 'local') nm.local = winner;
                  else nm.visitante = winner;
                } else if (nm.leg === 'Vuelta') {
                  if (nextMatchupInfo.slot === 'local') nm.visitante = winner;
                  else nm.local = winner;
                }
              }
            });
          }
        }

        setPartidos(updated);
        setIsStatsModalOpen(false);
      }
    } catch (err) {
      if (err.response?.status === 422 && err.response?.data?.code === 'VALIDATION_WARNING') {
        setEaWarnings(err.response.data.players);
      } else {
        alert("❌ Error al procesar reporte de EA: " + (err.response?.data?.message || err.message));
      }
    } finally {
      setEaProcessing(false);
    }
  };

  const getStandingsForTeams = (teamList, filteredMatches) => {
    const statsMap = {};
    
    teamList.forEach(eq => {
      statsMap[eq.id] = {
        id: eq.id,
        nombre: eq.nombre,
        abreviatura: eq.nombre?.slice(0, 3) || 'UT',
        pj: 0, pg: 0, pe: 0, pp: 0, gf: 0, gc: 0, pts: 0
      };
    });
    
    filteredMatches.forEach(p => {
      if (p.score_local !== null && p.score_visitante !== null) {
        const teamLocal = statsMap[p.local.id];
        const teamVisit = statsMap[p.visitante.id];
        
        if (teamLocal && teamVisit) {
          teamLocal.pj++;
          teamVisit.pj++;
          teamLocal.gf += p.score_local;
          teamLocal.gc += p.score_visitante;
          teamVisit.gf += p.score_visitante;
          teamVisit.gc += p.score_local;
          
          if (p.score_local > p.score_visitante) {
            teamLocal.pg++;
            teamLocal.pts += 3;
            teamVisit.pp++;
          } else if (p.score_local < p.score_visitante) {
            teamVisit.pg++;
            teamVisit.pts += 3;
            teamLocal.pp++;
          } else {
            teamLocal.pe++;
            teamLocal.pts += 1;
            teamVisit.pe++;
            teamVisit.pts += 1;
          }
        }
      }
    });
    
    return Object.values(statsMap).sort((a, b) => {
      if (b.pts !== a.pts) return b.pts - a.pts;
      const dgA = a.gf - a.gc;
      const dgB = b.gf - b.gc;
      return dgB - dgA;
    });
  };

  const standings = useMemo(() => {
    if (formatoTorneo === 'liga') {
      return getStandingsForTeams(equipos, partidos);
    }
    return [];
  }, [partidos, equipos, formatoTorneo]);

  const generarPlayoffsCopa = () => {
    let clasificados = [];
    Object.keys(grupos).forEach(groupName => {
      const groupStandings = getStandingsForTeams(grupos[groupName], partidos.filter(p => p.grupo === groupName));
      clasificados.push(groupStandings[0]);
      clasificados.push(groupStandings[1]);
    });

    const playoffMatches = buildPlayoffBracket(clasificados, partidos.length + 1, partidos.length);
    const copaPlayoffs = playoffMatches.map(p => {
      const prefix = p.jornada === 'Final' ? 'Gran Final Copa' : `${p.jornada} Copa`;
      return { ...p, jornada: prefix };
    });

    copaPlayoffs.forEach(p => {
      if (p.siguienteMatchup) {
        const nextJ = p.siguienteMatchup.jornada;
        p.siguienteMatchup.jornada = nextJ === 'Final' ? 'Gran Final Copa' : `${nextJ} Copa`;
      }
    });

    setPartidos([...partidos, ...copaPlayoffs]);
    setFaseActual('playoffs');
    setIsSaved(false);
  };

  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  return (
    <div className="space-y-6">
      
      {/* 1. CONFIGURACIÓN INICIAL / GENERACIÓN */}
      {partidos.length === 0 ? (
        <Card className="p-6 border border-border/50 backdrop-blur-md bg-card/25 shadow-lg relative overflow-hidden" withGlow>
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-display font-black text-foreground uppercase tracking-wide">Generar Fixture de Torneo UT</h3>
              <p className="text-xs text-muted-foreground mt-1">Configura el formato del torneo, fechas de jornadas y plazos del torneo UT.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-b border-border/20 pb-4">
              <button
                onClick={() => setFormatoTorneo('liga')}
                className={`p-4 rounded-xl border flex flex-col items-center justify-center gap-2 transition-all ${
                  formatoTorneo === 'liga'
                    ? 'bg-primary/20 text-primary border-primary/50 shadow-inner'
                    : 'bg-muted/10 text-muted-foreground border-border/40 hover:bg-muted/20'
                }`}
              >
                <span className="text-2xl">🏆</span>
                <span className="text-xs font-black uppercase tracking-wider">Liga (Round Robin)</span>
              </button>
              
              <button
                onClick={() => setFormatoTorneo('playoff')}
                className={`p-4 rounded-xl border flex flex-col items-center justify-center gap-2 transition-all ${
                  formatoTorneo === 'playoff'
                    ? 'bg-primary/20 text-primary border-primary/50 shadow-inner'
                    : 'bg-muted/10 text-muted-foreground border-border/40 hover:bg-muted/20'
                }`}
              >
                <span className="text-2xl">🛡️</span>
                <span className="text-xs font-black uppercase tracking-wider">Playoffs (Directa)</span>
              </button>

              <button
                onClick={() => setFormatoTorneo('copa')}
                className={`p-4 rounded-xl border flex flex-col items-center justify-center gap-2 transition-all ${
                  formatoTorneo === 'copa'
                    ? 'bg-primary/20 text-primary border-primary/50 shadow-inner'
                    : 'bg-muted/10 text-muted-foreground border-border/40 hover:bg-muted/20'
                }`}
              >
                <span className="text-2xl">🔥</span>
                <span className="text-xs font-black uppercase tracking-wider">Copa (Grupos + Playoffs)</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] text-muted-foreground font-black uppercase tracking-wider block">Modalidad de Partidos</label>
                <div className="flex gap-2">
                  <Button 
                    onClick={() => setModo('simple')}
                    variant={modo === 'simple' ? 'primary' : 'outline'}
                    className="flex-1 h-10 text-[10px]"
                  >
                    Solo Ida
                  </Button>
                  <Button 
                    onClick={() => setModo('doble')}
                    variant={modo === 'doble' ? 'primary' : 'outline'}
                    className="flex-1 h-10 text-[10px]"
                  >
                    Ida y Vuelta
                  </Button>
                </div>
              </div>

              {formatoTorneo === 'copa' && (
                <div className="space-y-2">
                  <label className="text-[10px] text-muted-foreground font-black uppercase tracking-wider block">Número de Grupos</label>
                  <Select
                    value={numGrupos}
                    onChange={(e) => setNumGrupos(Number(e.target.value))}
                    options={[
                      { value: 2, label: '2 Grupos (Clasifican top 2)' },
                      { value: 4, label: '4 Grupos (Clasifican top 2)' }
                    ]}
                  />
                </div>
              )}

              <div className="space-y-2">
                <label className="text-[10px] text-muted-foreground font-black uppercase tracking-wider block">Fecha de Inicio Oficial</label>
                <Input type="date" value={fechaInicio} onChange={(e) => setFechaInicio(e.target.value)} />
              </div>
            </div>

            {/* Días de juego */}
            <div className="space-y-2">
              <label className="text-[10px] text-muted-foreground font-black uppercase tracking-wider block">Días Oficiales de Juego</label>
              <div className="flex flex-wrap gap-2">
                {daysOfWeek.map(day => {
                  const isSelected = diasSeleccionados.includes(day);
                  return (
                    <button
                      key={day}
                      onClick={() => toggleDia(day)}
                      className={`px-3 py-1.5 rounded-lg text-[10px] font-bold tracking-wider uppercase border transition-all ${
                        isSelected 
                          ? 'bg-primary/20 text-primary border-primary/40 shadow-inner' 
                          : 'bg-muted/30 text-muted-foreground border-border/50 hover:bg-muted/50'
                      }`}
                    >
                      {day === 'Monday' ? 'Lunes' : 
                       day === 'Tuesday' ? 'Martes' : 
                       day === 'Wednesday' ? 'Miércoles' : 
                       day === 'Thursday' ? 'Jueves' : 
                       day === 'Friday' ? 'Viernes' : 
                       day === 'Saturday' ? 'Sábado' : 'Domingo'}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Horas */}
            <div className="space-y-2">
              <label className="text-[10px] text-muted-foreground font-black uppercase tracking-wider block">Horarios de los Partidos (Separados por comas)</label>
              <Input value={horasInput} onChange={(e) => setHorasInput(e.target.value)} placeholder="Ej: 22:00, 22:30, 23:00" />
            </div>

            {equipos.length < 2 ? (
              <p className="text-xs text-primary font-bold text-center bg-primary/10 p-3 rounded-lg border border-primary/20">
                ⚠️ Necesitas al menos 2 participantes aprobados para armar el fixture del torneo UT.
              </p>
            ) : (
              <Button 
                onClick={generarMatchmaking}
                className="w-full h-11 bg-gradient-to-r from-primary to-destructive text-primary-foreground font-display font-black uppercase tracking-wider text-xs shadow-md border-none"
              >
                ⚙️ Previsualizar Fixture UT
              </Button>
            )}
          </div>
        </Card>
      ) : (
        /* 2. MATCHMAKING PREVISUALIZADO */
        <div className="space-y-6 animate-fade-in">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-card/45 p-4 rounded-xl border border-border/50 gap-4">
            <div>
              <h3 className="font-display font-black text-lg text-foreground uppercase tracking-wider">
                ✨ Previsualización del Fixture UT ({formatoTorneo === 'liga' ? 'Liga' : formatoTorneo === 'playoff' ? 'Playoffs' : 'Copa'})
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">Revisa el fixture antes de guardarlo en el servidor.</p>
            </div>
            <div className="flex gap-2">
              <Button 
                onClick={() => {
                  setPartidos([]);
                  setIsSaved(false);
                }}
                variant="outline"
                className="h-10 text-xs font-bold uppercase"
              >
                🔄 Configurar de nuevo
              </Button>
              <Button
                onClick={handleSaveToDatabase}
                disabled={isSaved || saveLoading}
                className={`h-10 text-xs font-bold uppercase px-6 ${
                  isSaved 
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                    : 'bg-primary text-primary-foreground border-none shadow-md'
                }`}
              >
                {saveLoading ? '💾 Guardando...' : isSaved ? '✅ Fixture Guardado' : '💾 Guardar Fixture UT'}
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            
            {/* TABLA ESTIMADA (LADO IZQUIERDO) */}
            <div className="lg:col-span-1 space-y-6">
              {formatoTorneo === 'liga' && (
                <Card className="p-5 border border-border/50 bg-card/25 backdrop-blur-md shadow-lg" withGlow>
                  <h3 className="font-display font-black text-lg text-foreground uppercase tracking-wider mb-4 border-b border-border/40 pb-2">
                    📊 Posiciones Estimadas
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left border-collapse">
                      <thead>
                        <tr className="border-b border-border/50 text-[9px] uppercase font-bold text-muted-foreground tracking-wider font-mono">
                          <th className="py-2 text-center w-8">Pos</th>
                          <th className="py-2">Equipo</th>
                          <th className="py-2 text-center">PJ</th>
                          <th className="py-2 text-center">DG</th>
                          <th className="py-2 text-center text-primary">Pts</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/30 font-semibold">
                        {standings.map((team, idx) => (
                          <tr key={team.id} className="hover:bg-muted/10">
                            <td className="py-2 text-center font-mono">{idx + 1}</td>
                            <td className="py-2 font-bold text-foreground truncate max-w-[100px]">{team.nombre}</td>
                            <td className="py-2 text-center font-mono">{team.pj}</td>
                            <td className="py-2 text-center font-mono">{team.gf - team.gc}</td>
                            <td className="py-2 text-center font-mono text-primary font-bold">{team.pts}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Card>
              )}

              {formatoTorneo === 'copa' && Object.keys(grupos).map(groupName => (
                <Card key={groupName} className="p-4 border border-border/40 bg-card/10 shadow-md">
                  <h4 className="font-display font-black text-sm text-primary uppercase tracking-wide mb-3 border-b border-border/20 pb-1">
                    🟢 Grupo {groupName}
                  </h4>
                  <table className="w-full text-[11px] text-left border-collapse">
                    <thead>
                      <tr className="text-[9px] text-muted-foreground uppercase font-mono border-b border-border/30">
                        <th className="py-1">Equipo</th>
                        <th className="py-1 text-center">PJ</th>
                        <th className="py-1 text-center">DG</th>
                        <th className="py-1 text-center text-primary">Pts</th>
                      </tr>
                    </thead>
                    <tbody className="font-semibold text-foreground divide-y divide-border/20">
                      {getStandingsForTeams(grupos[groupName], partidos.filter(p => p.grupo === groupName)).map(team => (
                        <tr key={team.id} className="hover:bg-muted/5">
                          <td className="py-1.5 font-bold">{team.nombre}</td>
                          <td className="py-1.5 text-center font-mono">{team.pj}</td>
                          <td className="py-1.5 text-center font-mono">{team.gf - team.gc}</td>
                          <td className="py-1.5 text-center font-mono text-primary">{team.pts}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </Card>
              ))}

              {formatoTorneo === 'copa' && faseActual === 'grupos' && (
                <Button
                  onClick={generarPlayoffsCopa}
                  className="w-full h-11 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-display font-black uppercase tracking-wider text-xs border-none shadow-md"
                >
                  🔥 Generar Playoffs de Copa (Top 2)
                </Button>
              )}
            </div>

            {/* PARTIDOS (LADO DERECHO) */}
            <div className="lg:col-span-2 space-y-6">
              
              {(formatoTorneo === 'playoff' || (formatoTorneo === 'copa' && faseActual === 'playoffs')) && (
                <Card className="p-5 border border-border/50 bg-card/20 backdrop-blur-md shadow-lg" withGlow>
                  <h3 className="font-display font-black text-sm text-foreground uppercase tracking-wide mb-4">
                    🛡️ Árbol de Playoffs UT
                  </h3>
                  
                  <div className="flex flex-col gap-6">
                    {['Octavos', 'Cuartos', 'Semis', 'Semifinal Copa', 'Final', 'Gran Final Copa'].map(round => {
                      const roundMatches = partidos.filter(p => p.jornada === round);
                      if (roundMatches.length === 0) return null;

                      return (
                        <div key={round} className="space-y-3">
                          <span className="text-[10px] font-mono text-primary font-black uppercase tracking-wider bg-primary/10 border border-primary/20 px-2 py-0.5 rounded">
                            {round}
                          </span>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {roundMatches.map(p => (
                              <div
                                key={p.id}
                                onClick={() => openStatsModal(p)}
                                className="p-3 bg-background border border-border/60 hover:border-primary/50 transition-all rounded-xl cursor-pointer flex justify-between items-center group relative overflow-hidden"
                              >
                                <div className="space-y-1.5 flex-1">
                                  <div className="flex items-center justify-between">
                                    <span className="text-xs font-black uppercase text-foreground truncate max-w-[120px]">{p.local?.nombre || 'TBD'}</span>
                                    <span className="text-xs font-mono font-black bg-muted/40 px-2 py-0.5 rounded">
                                      {p.score_local !== null ? p.score_local : '-'}
                                    </span>
                                  </div>
                                  <div className="flex items-center justify-between">
                                    <span className="text-xs font-black uppercase text-foreground truncate max-w-[120px]">{p.visitante?.nombre || 'TBD'}</span>
                                    <span className="text-xs font-mono font-black bg-muted/40 px-2 py-0.5 rounded">
                                      {p.score_visitante !== null ? p.score_visitante : '-'}
                                    </span>
                                  </div>
                                </div>
                                <div className="pl-3 border-l border-border/40 text-right font-mono text-[9px] text-muted-foreground flex flex-col justify-center shrink-0">
                                  <div>📅 {p.fecha}</div>
                                  <div>🕒 {p.hora}</div>
                                  <span className="text-[9px] text-primary font-bold opacity-0 group-hover:opacity-100 transition-opacity mt-1">
                                    Reportar →
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </Card>
              )}

              <div className="space-y-4">
                <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-widest px-1 border-b border-border/50 pb-2">
                  Partidos y Cronogramas Generados
                </h3>

                <div className="grid grid-cols-1 gap-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                  {partidos.map(p => {
                    const isBye = p.local.id === 'bye' || p.visitante.id === 'bye';
                    if (isBye) return null;

                    return (
                      <div 
                        key={p.id}
                        className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 bg-background border border-border/60 rounded-xl shadow-sm gap-4 hover:border-primary/30 transition-colors"
                      >
                        <div className="flex-1">
                          <span className="text-[9px] bg-primary/10 text-primary border border-primary/20 font-bold px-2 py-0.5 rounded uppercase tracking-wider font-mono">
                            {p.jornada} {p.grupo ? `• Grupo ${p.grupo}` : ''}
                          </span>
                          <div className="flex items-center gap-3 mt-2">
                            <span className="text-sm font-black text-foreground uppercase truncate max-w-[120px]">{p.local?.nombre}</span>
                            
                            <span className="text-sm font-mono font-black text-primary bg-muted/30 px-3 py-1 rounded border border-border/50">
                              {p.score_local !== null && p.score_visitante !== null ? (
                                `${p.score_local} - ${p.score_visitante}`
                              ) : (
                                'VS'
                              )}
                            </span>

                            <span className="text-sm font-black text-foreground uppercase truncate max-w-[120px]">{p.visitante?.nombre}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end mt-2 sm:mt-0 border-t border-border/30 pt-3 sm:pt-0 sm:border-0 shrink-0">
                          <div className="text-left sm:text-right font-mono text-[10px] text-muted-foreground font-semibold">
                            <div>📅 {p.fecha}</div>
                            <div>🕒 {p.hora}</div>
                          </div>
                          
                          <Button 
                            size="sm" 
                            onClick={() => openStatsModal(p)}
                            className="h-8 px-3 text-[10px] bg-primary/15 text-primary border border-primary/30 hover:bg-primary hover:text-primary-foreground hover:border-transparent cursor-pointer"
                          >
                            🛡️ Ficha / Reportar
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: ESTADÍSTICAS DEL PARTIDO & REPORTES UT                             */}
      {/* ========================================================================= */}
      {isStatsModalOpen && selectedMatch && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-[120] flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-card border border-border/50 shadow-2xl rounded-2xl p-6 space-y-6 max-h-[90vh] overflow-y-auto animate-fade-in relative animate-scale-up">
            
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-border/40 pb-3 gap-3">
              <div>
                <h3 className="text-xl font-display font-black text-foreground uppercase tracking-wide flex items-center gap-2">
                  🎮 Ficha de Partido UT
                </h3>
                <p className="text-[10px] text-muted-foreground mt-0.5">Ingresa los resultados manuales o sincroniza usando la API de EA.</p>
              </div>

              <div className="flex gap-1 bg-muted/40 p-1 rounded-lg border border-border/40 shrink-0">
                <button 
                  onClick={() => setReportMethod('manual')}
                  className={`px-3 py-1.5 rounded-md text-[10px] font-black uppercase tracking-wider transition-colors cursor-pointer ${reportMethod === 'manual' ? 'bg-background text-primary shadow-sm border border-border/20' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  📝 Manual
                </button>
                <button 
                  onClick={() => setReportMethod('ea')}
                  className={`px-3 py-1.5 rounded-md text-[10px] font-black uppercase tracking-wider transition-colors flex items-center gap-1 cursor-pointer ${reportMethod === 'ea' ? 'bg-background text-primary shadow-sm border border-border/20' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  🌐 EA API
                </button>
              </div>
            </div>

            {reportMethod === 'manual' ? (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-6 bg-muted/10 p-4 rounded-xl border border-border/40">
                  {/* Local */}
                  <div className="space-y-4">
                    <h4 className="text-sm font-bold text-primary uppercase truncate max-w-[200px]">{selectedMatch.local.nombre}</h4>
                    <div className="space-y-3">
                      <div className="space-y-1">
                        <label className="text-[10px] text-muted-foreground font-black uppercase tracking-wider block">Goles convertidos</label>
                        <Input type="number" value={statsScoreA} onChange={(e) => setStatsScoreA(e.target.value)} />
                      </div>
                    </div>
                  </div>

                  {/* Visitante */}
                  <div className="space-y-4">
                    <h4 className="text-sm font-bold text-primary uppercase truncate max-w-[200px]">{selectedMatch.visitante.nombre}</h4>
                    <div className="space-y-3">
                      <div className="space-y-1">
                        <label className="text-[10px] text-muted-foreground font-black uppercase tracking-wider block">Goles convertidos</label>
                        <Input type="number" value={statsScoreB} onChange={(e) => setStatsScoreB(e.target.value)} />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="h-px bg-border/40"></div>

                {/* Estadísticas de Jugador */}
                <div className="space-y-3">
                  <h4 className="text-sm font-bold text-foreground uppercase tracking-wide">Estadísticas de Participantes (Capitán/Pareja)</h4>
                  {playerStats.length === 0 ? (
                    <p className="text-xs text-muted-foreground italic">No hay jugadores configurados en estos equipos para reportar.</p>
                  ) : (
                    <div className="space-y-2 border border-border/40 rounded-xl overflow-hidden bg-muted/10 p-2">
                      {playerStats.map((p, idx) => (
                        <div key={p.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-3 border-b border-border/30 last:border-0 gap-3 text-xs">
                          <span className="font-bold text-foreground truncate w-48">{p.name}</span>
                          <div className="flex gap-4">
                            <div className="flex items-center gap-1.5">
                              <label className="text-[9px] font-black text-muted-foreground uppercase tracking-wider">Goles</label>
                              <input 
                                type="number" 
                                value={p.goals} 
                                onChange={(e) => {
                                  const clone = [...playerStats];
                                  clone[idx].goals = Number(e.target.value);
                                  setPlayerStats(clone);
                                }}
                                className="w-12 h-8 rounded bg-background border border-border/60 text-center font-mono font-bold text-foreground" 
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex gap-2 justify-end pt-3">
                  <Button onClick={() => setIsStatsModalOpen(false)} variant="outline" className="h-10 text-[10px]">
                    Cancelar
                  </Button>
                  <Button onClick={handleSaveStats} className="h-10 text-[10px] bg-primary border-none">
                    Guardar Ficha
                  </Button>
                </div>
              </div>
            ) : (
              /* EA API */
              <div className="space-y-6 animate-fade-in">
                {eaLoading && (
                  <div className="flex flex-col items-center justify-center py-12 gap-3">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
                    <span className="text-xs font-bold tracking-widest text-primary uppercase animate-pulse">Buscando partidos en servidores EA...</span>
                  </div>
                )}

                {!eaLoading && eaError && (
                  <div className="border border-amber-500/30 bg-amber-500/5 rounded-xl p-4 space-y-2">
                    <p className="text-xs font-bold text-amber-400">
                      ⚠️ No se pudieron obtener los datos de EA
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {eaError}
                    </p>
                    <div className="text-[10px] text-amber-500 font-semibold bg-amber-500/10 p-2.5 rounded-lg">
                      💡 Asegúrate de registrar el <strong>EA Club ID</strong> correcto para ambos participantes en la configuración del torneo.
                    </div>
                  </div>
                )}

                {!eaLoading && !eaError && eaMatches.length === 0 && (
                  <div className="text-center py-12 border border-dashed border-border/50 rounded-2xl bg-muted/10 space-y-2">
                    <span className="text-3xl">🎮</span>
                    <p className="text-xs font-bold text-foreground">Sin encuentros encontrados</p>
                    <p className="text-[10px] text-muted-foreground max-w-xs mx-auto">
                      No se detectaron partidos recientes en el club EA ingresado para esta pareja/jugador.
                    </p>
                  </div>
                )}

                {!eaLoading && !eaError && eaMatches.length > 0 && (
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] text-muted-foreground font-black uppercase tracking-wider block">
                        Selecciona el partido de EA para reportar en el sistema:
                      </label>
                      <Select
                        value={selectedEaMatchId}
                        onChange={(e) => {
                          const mId = e.target.value;
                          setSelectedEaMatchId(mId);
                          const mObj = eaMatches.find(m => m.matchId === mId);
                          if (mObj && mObj.clubs) {
                            const keys = Object.keys(mObj.clubs);
                            if (keys.length === 2) {
                              const dbLocalEaId = String(selectedMatch.local?.club_id_ea || '').trim();
                              const dbVisitEaId = String(selectedMatch.visitante?.club_id_ea || '').trim();
                              
                              const key0 = String(keys[0]).trim();
                              const key1 = String(keys[1]).trim();
                              
                              const isMatch0Local = key0 === dbLocalEaId;
                              const isMatch1Local = key1 === dbLocalEaId;
                              const isMatch0Visit = key0 === dbVisitEaId;
                              const isMatch1Visit = key1 === dbVisitEaId;
                              
                              const hasLocal = isMatch0Local || isMatch1Local;
                              const hasVisit = isMatch0Visit || isMatch1Visit;
                              
                              if (!hasLocal || !hasVisit) {
                                const clubA = mObj.clubs[keys[0]]?.details?.name || 'Club A';
                                const clubB = mObj.clubs[keys[1]]?.details?.name || 'Club B';
                                setEaMismatchModal({
                                  expectedLocal: selectedMatch.local?.nombre || 'Local Oficial',
                                  expectedVisitante: selectedMatch.visitante?.nombre || 'Visitante Oficial',
                                  expectedLocalId: dbLocalEaId,
                                  expectedVisitanteId: dbVisitEaId,
                                  receivedLocal: clubA,
                                  receivedVisitante: clubB,
                                  receivedLocalId: key0,
                                  receivedVisitanteId: key1,
                                });
                                setSelectedEaMatchId('');
                                setEaClubLocalId('');
                                setEaClubVisitanteId('');
                                return;
                              }

                              if (isMatch0Local) {
                                setEaClubLocalId(key0);
                                setEaClubVisitanteId(key1);
                              } else {
                                setEaClubLocalId(key1);
                                setEaClubVisitanteId(key0);
                              }
                            }
                          }
                        }}
                        options={[
                          { value: '', label: '-- Elige un partido de la lista --' },
                          ...eaMatches.map(m => {
                            const keys = Object.keys(m.clubs || {});
                            const nameA = m.clubs[keys[0]]?.details?.name || 'Club A';
                            const nameB = m.clubs[keys[1]]?.details?.name || 'Club B';
                            const scoreA = m.clubs[keys[0]]?.goals || 0;
                            const scoreB = m.clubs[keys[1]]?.goals || 0;
                            const timeAgoStr = m.timeAgo || '';
                            return {
                              value: m.matchId,
                              label: `🎮 ${nameA} (${scoreA}) vs ${nameB} (${scoreB}) - hace ${timeAgoStr}`
                            };
                          })
                        ]}
                      />
                    </div>

                    {eaWarnings && (
                      <div className="border border-destructive/30 bg-destructive/5 rounded-xl p-4 space-y-2">
                        <p className="text-xs font-bold text-destructive">⚠️ Alerta de Validación de Participantes</p>
                        <p className="text-[11px] text-muted-foreground">Los siguientes jugadores no pertenecen al equipo inscrito:</p>
                        <div className="space-y-1">
                          {eaWarnings.map((p, i) => (
                            <div key={i} className="text-[10px] text-destructive font-mono">
                              ❌ Gamertag: <strong>{p.playername}</strong> (Ingresó y no coincide con el capitán/pareja registrados)
                            </div>
                          ))}
                        </div>
                        <Button 
                          onClick={() => handleEaReportSubmit(true)}
                          className="w-full text-xs bg-destructive text-destructive-foreground hover:bg-destructive/80 h-9 font-bold mt-2"
                        >
                          Ignorar validación e inscribir reporte de todas formas
                        </Button>
                      </div>
                    )}

                    <div className="flex gap-2 justify-end pt-3">
                      <Button onClick={() => setIsStatsModalOpen(false)} variant="outline" className="h-10 text-[10px]" disabled={eaProcessing}>
                        Cancelar
                      </Button>
                      <Button 
                        onClick={() => handleEaReportSubmit(false)} 
                        isLoading={eaProcessing} 
                        disabled={!selectedEaMatchId || eaProcessing} 
                        className="h-10 text-[10px] bg-primary border-none"
                      >
                        Sincronizar e Importar
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* EA MISMATCH MODAL */}
      {eaMismatchModal && (
        <Modal 
          isOpen={!!eaMismatchModal} 
          onClose={() => setEaMismatchModal(null)} 
          title="Diferencia de Clubes EA Detectada"
          footer={
            <div className="flex gap-4 w-full">
              <Button variant="outline" className="flex-1" onClick={() => setEaMismatchModal(null)}>Cancelar</Button>
              <Button 
                variant="solid" 
                className="flex-1 bg-destructive text-destructive-foreground"
                onClick={() => {
                  setEaClubLocalId(eaMismatchModal.receivedLocalId);
                  setEaClubVisitanteId(eaMismatchModal.receivedVisitanteId);
                  setSelectedEaMatchId(selectedEaMatchId);
                  setEaMismatchModal(null);
                  handleEaReportSubmit(true);
                }}
              >
                Forzar Vinculación
              </Button>
            </div>
          }
        >
          <div className="space-y-4 text-xs">
            <p className="leading-relaxed">
              El partido seleccionado en EA Sports no coincide con los participantes esperados de la base de datos:
            </p>
            <div className="grid grid-cols-2 gap-4 bg-muted/20 p-3 rounded-lg border border-border/40 font-mono">
              <div>
                <span className="text-[10px] text-muted-foreground block font-sans">ESPERADO:</span>
                <span className="font-bold text-foreground">{eaMismatchModal.expectedLocal}</span> ({eaMismatchModal.expectedLocalId})
                <div className="text-center py-1 text-muted-foreground">vs</div>
                <span className="font-bold text-foreground">{eaMismatchModal.expectedVisitante}</span> ({eaMismatchModal.expectedVisitanteId})
              </div>
              <div>
                <span className="text-[10px] text-muted-foreground block font-sans">RECIBIDO:</span>
                <span className="font-bold text-primary">{eaMismatchModal.receivedLocal}</span> ({eaMismatchModal.receivedLocalId})
                <div className="text-center py-1 text-muted-foreground">vs</div>
                <span className="font-bold text-primary">{eaMismatchModal.receivedVisitante}</span> ({eaMismatchModal.receivedVisitanteId})
              </div>
            </div>
            <p className="text-muted-foreground leading-relaxed">
              Puedes presionar <strong>Forzar Vinculación</strong> si estás seguro de que es el partido correcto (por ejemplo, si jugaron con un club de entrenamiento o virtual alternativo).
            </p>
          </div>
        </Modal>
      )}

    </div>
  );
}
