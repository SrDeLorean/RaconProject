import React, { useState, useMemo } from 'react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Badge from '@/components/ui/Badge';
import Card from '@/components/shared/Card';
import api from '@/api/axios';
import Modal from '@/components/ui/Modal';

const parsePlaceholderCode = (code) => {
  if (!code) return { nombre: 'Por definir', abreviatura: 'TBD' };
  const parts = code.split('-');
  if (parts.length === 3 && parts[0] === 'g') {
    const group = parts[1];
    const seed = parts[2];
    return {
      nombre: `${seed}º Grupo ${group}`,
      abreviatura: `${seed}º${group}`
    };
  }
  return { nombre: 'Por definir', abreviatura: 'TBD' };
};

const parseTeamField = (teamId, teamModel, isLocal, mStats, matchId, otherTeamId, golesSelf, golesOther) => {
  if (teamId) {
    return {
      id: teamId,
      nombre: teamModel?.nombre || 'TBD',
      abreviatura: teamModel?.abreviatura || 'TBD',
      logo: teamModel?.logo
    };
  }
  
  const placeholderCode = isLocal ? mStats.placeholderLocal : mStats.placeholderVisitante;
  if (placeholderCode) {
    const parsed = parsePlaceholderCode(placeholderCode);
    return {
      id: `tbd-${placeholderCode}`,
      nombre: parsed.nombre,
      abreviatura: parsed.abreviatura,
      logo: null
    };
  }
  
  if (otherTeamId && (golesOther === 3 || golesSelf === 0)) {
    return {
      id: 'bye',
      nombre: 'DESCANSO',
      abreviatura: 'BYE',
      logo: null
    };
  }
  
  return {
    id: `tbd-${isLocal ? 'l' : 'v'}-${matchId}`,
    nombre: 'Por definir',
    abreviatura: 'TBD',
    logo: null
  };
};

const getPlaceholderTeams = (numGrupos, clasificadosPorGrupo) => {
  let list = [];
  
  if (numGrupos === 1) {
    const total = clasificadosPorGrupo;
    const paired = [];
    for (let i = 0; i < Math.floor(total / 2); i++) {
      paired.push(i + 1);
      paired.push(total - i);
    }
    if (total % 2 !== 0) {
      paired.push(Math.ceil(total / 2));
    }
    
    paired.forEach(s => {
      list.push({
        id: `tbd-g-A-${s}`,
        nombre: `${s}º Grupo A`,
        abreviatura: `${s}ºA`,
        isPlaceholder: true,
        stats: {
          placeholderCode: `g-A-${s}`
        }
      });
    });
  } else if (clasificadosPorGrupo === 1) {
    for (let g = 0; g < numGrupos; g += 2) {
      const g1 = g;
      const g2 = g + 1;
      
      const char1 = String.fromCharCode(65 + g1);
      list.push({
        id: `tbd-g-${char1}-1`,
        nombre: `1º Grupo ${char1}`,
        abreviatura: `1º${char1}`,
        isPlaceholder: true,
        stats: {
          placeholderCode: `g-${char1}-1`
        }
      });
      
      if (g2 < numGrupos) {
        const char2 = String.fromCharCode(65 + g2);
        list.push({
          id: `tbd-g-${char2}-1`,
          nombre: `1º Grupo ${char2}`,
          abreviatura: `1º${char2}`,
          isPlaceholder: true,
          stats: {
            placeholderCode: `g-${char2}-1`
          }
        });
      } else {
        list.push({ id: 'bye', nombre: 'DESCANSO', abreviatura: 'BYE' });
      }
    }
  } else {
    for (let s = 1; s <= clasificadosPorGrupo; s += 2) {
      const s1 = s;
      const s2 = s + 1;
      
      for (let g = 0; g < numGrupos; g++) {
        const partnerGroupIdx = (numGrupos % 2 === 0) ? (g ^ 1) : ((g + 1) % numGrupos);
        
        const charCurrent = String.fromCharCode(65 + g);
        const charPartner = String.fromCharCode(65 + partnerGroupIdx);
        
        list.push({
          id: `tbd-g-${charCurrent}-${s1}`,
          nombre: `${s1}º Grupo ${charCurrent}`,
          abreviatura: `${s1}º${charCurrent}`,
          isPlaceholder: true,
          stats: {
            placeholderCode: `g-${charCurrent}-${s1}`
          }
        });
        
        if (s2 <= clasificadosPorGrupo) {
          list.push({
            id: `tbd-g-${charPartner}-${s2}`,
            nombre: `${s2}º Grupo ${charPartner}`,
            abreviatura: `${s2}º${charPartner}`,
            isPlaceholder: true,
            stats: {
              placeholderCode: `g-${charPartner}-${s2}`
            }
          });
        } else {
          const nextGroupIdx = (g + 1) % numGrupos;
          const charNext = String.fromCharCode(65 + nextGroupIdx);
          list.push({
            id: `tbd-g-${charNext}-${s1}`,
            nombre: `${s1}º Grupo ${charNext}`,
            abreviatura: `${s1}º${charNext}`,
            isPlaceholder: true,
            stats: {
              placeholderCode: `g-${charNext}-${s1}`
            }
          });
        }
      }
    }
  }
  return list;
};

export default function MatchmakerCalendario({ equipos = [], competenciaId = null, competencia = null, onMatchesUpdated = null }) {
  const [formatoTorneo, setFormatoTorneo] = useState('liga'); // 'liga' | 'playoff' | 'copa'
  const [partidos, setPartidos] = useState([]);
  const [modo, setModo] = useState('doble'); // 'simple' o 'doble'
  const [diasSeleccionados, setDiasSeleccionados] = useState(['Monday', 'Thursday']); // Dias de la semana
  const [horasInput, setHorasInput] = useState('22:00, 22:30'); // Lista de horas separadas por comas
  const [fechaInicio, setFechaInicio] = useState('2026-06-01');
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [numGrupos, setNumGrupos] = useState(2); // 2 o 4 grupos
  const [grupos, setGrupos] = useState({}); // { 'A': [...], 'B': [...] }
  const [faseActual, setFaseActual] = useState('grupos'); // 'grupos' o 'playoffs' (para copa)
  const [isSaved, setIsSaved] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [loadingExistentes, setLoadingExistentes] = useState(false);
  const [clasificadosPorGrupo, setClasificadosPorGrupo] = useState(2);
  const [hadExistingMatches, setHadExistingMatches] = useState(false);
  const [notification, setNotification] = useState(null);

  React.useEffect(() => {
    if (competencia?.config) {
      if (competencia.config.modo_playoff) {
        setModo(competencia.config.modo_playoff);
      }
      if (competencia.config.cantidad_grupos) {
        setNumGrupos(competencia.config.cantidad_grupos);
      }
      if (competencia.config.clasificados_por_grupo) {
        setClasificadosPorGrupo(competencia.config.clasificados_por_grupo);
      }
    }
  }, [competencia]);

  const totalEquipos = equipos.length;

  const groupOptions = useMemo(() => {
    const opts = [];
    if (totalEquipos < 2) {
      return [{ value: 1, label: '1 Grupo (Inscribe más equipos)' }];
    }
    opts.push({ 
      value: 1, 
      label: `1 Grupo (${totalEquipos} equipos) - Total: ${totalEquipos} equipos` 
    });

    if (totalEquipos >= 4) {
      const size = Math.floor(totalEquipos / 2);
      const rem = totalEquipos % 2;
      const desc = rem === 0 ? `${size} equipos` : `${size} a ${size + 1} equipos`;
      opts.push({ 
        value: 2, 
        label: `2 Grupos (${desc} por grupo) - Total: ${totalEquipos} equipos` 
      });
    }

    if (totalEquipos >= 8) {
      const size = Math.floor(totalEquipos / 4);
      const rem = totalEquipos % 4;
      const desc = rem === 0 ? `${size} equipos` : `${size} a ${size + 1} equipos`;
      opts.push({ 
        value: 4, 
        label: `4 Grupos (${desc} por grupo) - Total: ${totalEquipos} equipos` 
      });
    }

    if (totalEquipos >= 16) {
      const size = Math.floor(totalEquipos / 8);
      const rem = totalEquipos % 8;
      const desc = rem === 0 ? `${size} equipos` : `${size} a ${size + 1} equipos`;
      opts.push({ 
        value: 8, 
        label: `8 Grupos (${desc} por grupo) - Total: ${totalEquipos} equipos` 
      });
    }
    return opts;
  }, [totalEquipos]);

  const classifiedOptions = useMemo(() => {
    const opts = [];
    const size = Math.floor(totalEquipos / numGrupos);
    if (size <= 0) return [{ value: 1, label: '1 clasificado' }];
    
    for (let c = 1; c <= size; c++) {
      const totalPlayoff = numGrupos * c;
      const isPowerOfTwo = (totalPlayoff & (totalPlayoff - 1)) === 0 && totalPlayoff > 0;
      const labelSuffix = isPowerOfTwo ? ' - 🏆 Playoff Perfecto (Sin BYEs)' : '';
      opts.push({
        value: c,
        label: `Top ${c} de cada grupo (Total: ${totalPlayoff} en playoffs)${labelSuffix}`
      });
    }
    return opts;
  }, [totalEquipos, numGrupos]);

  const densityMetrics = useMemo(() => {
    if (totalEquipos < 2) return { groupStageMatches: 0, playoffMatchesCount: 0 };
    
    let groupStageMatches = 0;
    if (formatoTorneo === 'liga') {
      const matches = (totalEquipos * (totalEquipos - 1)) / 2;
      groupStageMatches = matches * (modo === 'doble' ? 2 : 1);
    } else if (formatoTorneo === 'copa') {
      const baseSize = Math.floor(totalEquipos / numGrupos);
      const remainder = totalEquipos % numGrupos;
      
      const sizeA = baseSize + 1;
      const matchesA = (sizeA * (sizeA - 1)) / 2;
      groupStageMatches += remainder * matchesA;
      
      const sizeB = baseSize;
      const matchesB = (sizeB * (sizeB - 1)) / 2;
      groupStageMatches += (numGrupos - remainder) * matchesB;

      if (modo === 'doble') {
        groupStageMatches *= 2;
      }
    }

    let playoffMatchesCount = 0;
    if (formatoTorneo === 'playoff') {
      let power = 2;
      while (power < totalEquipos) {
        power *= 2;
      }
      playoffMatchesCount = (power - 1) * (modo === 'doble' ? 2 : 1);
    } else if (formatoTorneo === 'copa') {
      const totalPlayoffTeams = numGrupos * clasificadosPorGrupo;
      let power = 2;
      while (power < totalPlayoffTeams) {
        power *= 2;
      }
      playoffMatchesCount = (power - 1) * (modo === 'doble' ? 2 : 1);
    }

    return { groupStageMatches, playoffMatchesCount };
  }, [totalEquipos, formatoTorneo, numGrupos, clasificadosPorGrupo, modo]);

  React.useEffect(() => {
    const fetchExistentes = async () => {
      if (!competenciaId) return;
      setLoadingExistentes(true);
      try {
        const res = await api.get('/partidos', { params: { competencia_id: competenciaId } });
        const dataArray = res.data.data || res.data || [];
        if (dataArray.length > 0) {
          setHadExistingMatches(true);
          const mapped = dataArray.map(m => {
            const mStats = m.stats || {};
            const jornadaLower = m.jornada.toLowerCase();
            const mIdx = mStats.matchupIndex !== undefined ? mStats.matchupIndex : null;
            let nextJ = null;
            if (jornadaLower.includes('octavos')) {
              nextJ = jornadaLower.includes('playoff') ? 'Cuartos Playoff' : 'Cuartos';
            } else if (jornadaLower.includes('cuartos')) {
              nextJ = jornadaLower.includes('playoff') ? 'Semis Playoff' : 'Semis';
            } else if (jornadaLower.includes('semi')) {
              nextJ = jornadaLower.includes('playoff') ? 'Gran Final Playoff' : 'Final';
            }
            const fallbackSiguienteMatchup = (nextJ !== null && mIdx !== null) ? {
              jornada: nextJ,
              matchupIndex: Math.floor(mIdx / 2),
              slot: mIdx % 2 === 0 ? 'local' : 'visitante'
            } : null;

            return {
              id: m.id,
              jornada: m.jornada,
              grupo: m.grupo,
              fecha: m.fecha,
              hora: m.hora,
              score_local: m.goles_local,
              score_visitante: m.goles_visitante,
              local: parseTeamField(m.equipo_local_id, m.local, true, mStats, m.id, m.equipo_visitante_id, m.goles_local, m.goles_visitante),
              visitante: parseTeamField(m.equipo_visitante_id, m.visitante, false, mStats, m.id, m.equipo_local_id, m.goles_visitante, m.goles_local),
              leg: mStats.leg || null,
              matchupIndex: mIdx,
              siguienteMatchup: mStats.siguienteMatchup || fallbackSiguienteMatchup,
              stats: mStats
            };
          });
          setPartidos(mapped);
          setIsSaved(true);

          const hasGroups = mapped.some(m => !!m.grupo);
          if (hasGroups) {
            setFormatoTorneo('copa');
            const grps = {};
            mapped.forEach(m => {
              if (m.grupo) {
                if (!grps[m.grupo]) grps[m.grupo] = [];
                const lid = m.local?.id;
                const vid = m.visitante?.id;
                if (lid && lid !== 'bye' && !grps[m.grupo].some(e => e.id === lid)) grps[m.grupo].push({ id: lid, nombre: m.local.nombre, abreviatura: m.local.abreviatura, logo: m.local.logo });
                if (vid && vid !== 'bye' && !grps[m.grupo].some(e => e.id === vid)) grps[m.grupo].push({ id: vid, nombre: m.visitante.nombre, abreviatura: m.visitante.abreviatura, logo: m.visitante.logo });
              }
            });
            setGrupos(grps);
            setNumGrupos(Object.keys(grps).length);
            
            const hasCopaPlayoffs = mapped.some(m => !m.grupo);
            if (hasCopaPlayoffs) {
              setFaseActual('playoffs');
            } else {
              setFaseActual('grupos');
            }
          } else {
            const hasPlayoffs = mapped.some(m => {
              const j = m.jornada.toLowerCase();
              return j.includes('playoff') || j.includes('semi') || j.includes('cuartos') || j.includes('octavos') || j.includes('final');
            });
            const hasRegularLeague = mapped.some(m => m.jornada.toLowerCase().includes('jornada') || m.jornada.toLowerCase().includes('liga'));
            
            if (hasPlayoffs && hasRegularLeague) {
              setFormatoTorneo('liga');
              setFaseActual('playoffs');
            } else if (hasPlayoffs && !hasRegularLeague) {
              setFormatoTorneo('playoff');
              setFaseActual('playoffs');
            } else {
              setFormatoTorneo('liga');
              setFaseActual('grupos');
            }
          }
        }
      } catch (error) {
        console.error("Error al cargar partidos existentes", error);
      } finally {
        setLoadingExistentes(false);
      }
    };
    fetchExistentes();
  }, [competenciaId]);

  const generarPlayoffsLiga = () => {
    const limit = competencia?.config?.clasificados_por_grupo || 4;
    const leagueStandings = getStandingsForTeams(equipos, partidos.filter(p => !p.jornada.toLowerCase().includes('playoff') && !p.jornada.toLowerCase().includes('final')));
    const clasificados = leagueStandings.slice(0, limit).map(t => t.model || equipos.find(eq => eq.id === t.id));

    const playoffMatches = buildPlayoffBracket(clasificados, partidos.length + 1, partidos.length);
    const ligaPlayoffs = playoffMatches.map(p => {
      const prefix = p.jornada === 'Final' ? 'Gran Final Playoff' : `${p.jornada} Playoff`;
      return {
        ...p,
        jornada: prefix
      };
    });

    ligaPlayoffs.forEach(p => {
      if (p.siguienteMatchup) {
        const nextJ = p.siguienteMatchup.jornada;
        p.siguienteMatchup.jornada = nextJ === 'Final' ? 'Gran Final Playoff' : `${nextJ} Playoff`;
      }
    });

    const scheduled = getScheduledMatches([...partidos, ...ligaPlayoffs]);
    setPartidos(scheduled);
    setFaseActual('playoffs');
    setIsSaved(false);
  };

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
  const [manualSaving, setManualSaving] = useState(false);


  // Roster ficticio del equipo para estadísticas de jugadores
  const mockRoster = [
    { id: 1, name: 'Alonso González', gamertag: 'Alonso10' },
    { id: 2, name: 'Carlos Silva', gamertag: 'CapitanFC' },
    { id: 3, name: 'Diego Rojas', gamertag: 'DiegoR_Pro' },
    { id: 4, name: 'Mateo Díaz', gamertag: 'MateoD_ST' }
  ];

  // Modales y Estadísticas Estado
  const [isStatsModalOpen, setIsStatsModalOpen] = useState(false);
  const [statsScoreA, setStatsScoreA] = useState(0);
  const [statsScoreB, setStatsScoreB] = useState(0);

  // IA Vision
  const [visionTeamStatsImg, setVisionTeamStatsImg] = useState(null);
  const [visionPlayerStatsImg, setVisionPlayerStatsImg] = useState(null);
  const [visionProcessing, setVisionProcessing] = useState(false);

  const handleImageUpload = (e, setter) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setter(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleVisionExtract = async () => {
    if (!visionTeamStatsImg || !visionPlayerStatsImg) {
      alert("⚠️ Sube ambas fotos primero (Stats de Equipo y Rendimiento).");
      return;
    }
    setVisionProcessing(true);
    try {
      const res = await api.post('/partidos/extract-vision', {
        team_stats_image: visionTeamStatsImg,
        player_stats_image: visionPlayerStatsImg
      });
      if (res.data && res.data.data) {
        const data = res.data.data;
        if (data.equipo_1) {
           setStatsScoreA(data.equipo_1.goles_favor || 0);
           setTeamAStats({
              ...teamAStats,
              possession: data.equipo_1.posesion || 0,
              shots: data.equipo_1.tiros || 0,
              passes: data.equipo_1.pases || 0,
              tackles: data.equipo_1.entradas || 0,
              corners: 0,
              fouls: data.equipo_1.entradas || 0
           });
        }
        if (data.equipo_2) {
           setStatsScoreB(data.equipo_2.goles_favor || 0);
           setTeamBStats({
              ...teamBStats,
              possession: data.equipo_2.posesion || 0,
              shots: data.equipo_2.tiros || 0,
              passes: data.equipo_2.pases || 0,
              tackles: data.equipo_2.entradas || 0,
              corners: 0,
              fouls: data.equipo_2.entradas || 0
           });
        }
        if (data.jugadores && Array.isArray(data.jugadores)) {
           const updateRoster = (currentRoster) => {
              const updated = [...currentRoster];
              data.jugadores.forEach(extractedPlayer => {
                 const matchedIdx = updated.findIndex(p => 
                    p.name.toLowerCase().includes(extractedPlayer.nombre.toLowerCase()) || 
                    extractedPlayer.nombre.toLowerCase().includes(p.name.toLowerCase())
                 );
                 if (matchedIdx !== -1) {
                    updated[matchedIdx].goals = extractedPlayer.goles || 0;
                    updated[matchedIdx].assists = extractedPlayer.asistencias || 0;
                    updated[matchedIdx].yellowCard = extractedPlayer.tarjetas_amarillas > 0;
                    updated[matchedIdx].redCard = extractedPlayer.tarjetas_rojas > 0;
                 }
              });
              return updated;
           };
           setLocalPlayersList(updateRoster(localPlayersList));
           setVisitantePlayersList(updateRoster(visitantePlayersList));
        }
        alert("✨ Estadísticas extraídas con IA. Por favor revisa y corrige si es necesario antes de enviar.");
      }
    } catch (err) {
      alert("❌ Error al extraer estadísticas con IA: " + (err.response?.data?.message || err.message));
    } finally {
      setVisionProcessing(false);
    }
  };
  const [teamAStats, setTeamAStats] = useState({ shots: 10, possession: 50, corners: 4, fouls: 5 });
  const [teamBStats, setTeamBStats] = useState({ shots: 8, possession: 50, corners: 3, fouls: 6 });
  const [playerStats, setPlayerStats] = useState([
    { id: 1, name: 'Alonso González', goals: 0, assists: 0, yellowCard: false, redCard: false },
    { id: 2, name: 'Carlos Silva', goals: 0, assists: 0, yellowCard: false, redCard: false }
  ]);

  const toggleDia = (dia) => {
    if (diasSeleccionados.includes(dia)) {
      setDiasSeleccionados(diasSeleccionados.filter(d => d !== dia));
    } else {
      setDiasSeleccionados([...diasSeleccionados, dia]);
    }
  };

  const getNextMatchDate = (currentDate, daysArray, hoursArray, matchIndex) => {
    const hoursCount = hoursArray.length;
    const dayOfWeekNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    
    // Calcular qué slot de hora y qué día le toca
    const hourSlot = matchIndex % hoursCount;
    const dayIndexOffset = Math.floor(matchIndex / hoursCount);
    
    const [year, month, day] = currentDate.split('-');
    let date = new Date(year, month - 1, day, 12, 0, 0); // 12 PM to avoid daylight saving issues
    
    // 1. Encontrar el primer día válido a partir de la fecha de inicio
    while (!daysArray.includes(dayOfWeekNames[date.getDay()])) {
      date.setDate(date.getDate() + 1);
    }
    
    // 2. Avanzar "dayIndexOffset" días válidos
    let addedDays = 0;
    while (addedDays < dayIndexOffset) {
      date.setDate(date.getDate() + 1);
      if (daysArray.includes(dayOfWeekNames[date.getDay()])) {
        addedDays++;
      }
    }
    
    const localDateString = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    
    return {
      dateString: localDateString,
      hourString: hoursArray[hourSlot].trim()
    };
  };

  const getScheduledMatches = (matchesList) => {
    const hoursArray = horasInput.split(',');

    const isPlayoffMatch = (p) => {
      if (formatoTorneo === 'playoff') return true;
      if (formatoTorneo === 'liga') {
        const j = p.jornada.toLowerCase();
        return j.includes('playoff') || j.includes('semi') || j.includes('final') || j.includes('cuartos') || j.includes('octavos');
      }
      return !p.grupo;
    };

    // 1. Separar fase de grupos / liga y fase de playoffs
    const groupMatches = matchesList.filter(p => !isPlayoffMatch(p));
    const playoffMatches = matchesList.filter(p => isPlayoffMatch(p));

    // 2. Programar partidos de fase regular / grupos
    let maxGroupRound = 0;
    const scheduledGroupMatches = groupMatches.map(p => {
      const roundNumMatch = p.jornada.match(/\d+$/);
      const roundNumber = roundNumMatch ? parseInt(roundNumMatch[0], 10) : 1;
      if (roundNumber > maxGroupRound) {
        maxGroupRound = roundNumber;
      }
      
      const slotIndex = roundNumber - 1;
      const schedule = getNextMatchDate(fechaInicio, diasSeleccionados, hoursArray, slotIndex);
      return {
        ...p,
        fecha: schedule.dateString,
        hora: schedule.hourString
      };
    });

    // 3. Programar partidos de playoffs
    const sortedRounds = [];
    const PLAYOFF_ROUNDS_ORDER = ['octavos', 'cuartos', 'semis', 'semifinal', 'final'];
    const getPlayoffRoundBase = (roundName) => {
      const norm = roundName.toLowerCase();
      if (norm.includes('octav')) return 'octavos';
      if (norm.includes('cuart')) return 'cuartos';
      if (norm.includes('semi')) return 'semis';
      if (norm.includes('final')) return 'final';
      return norm;
    };

    playoffMatches.forEach(p => {
      if (!sortedRounds.includes(p.jornada)) {
        sortedRounds.push(p.jornada);
      }
    });

    sortedRounds.sort((a, b) => {
      const baseA = getPlayoffRoundBase(a);
      const baseB = getPlayoffRoundBase(b);
      const valA = PLAYOFF_ROUNDS_ORDER.indexOf(baseA) === -1 ? 99 : PLAYOFF_ROUNDS_ORDER.indexOf(baseA);
      const valB = PLAYOFF_ROUNDS_ORDER.indexOf(baseB) === -1 ? 99 : PLAYOFF_ROUNDS_ORDER.indexOf(baseB);
      return valA - valB;
    });

    const scheduledPlayoffMatches = playoffMatches.map(p => {
      const roundOrderIndex = sortedRounds.indexOf(p.jornada);
      
      let slotIndex = maxGroupRound; // empieza después de la fase regular
      if (modo === 'doble') {
        const legOffset = p.leg === 'Vuelta' ? 1 : 0;
        slotIndex += roundOrderIndex * 2 + legOffset;
      } else {
        slotIndex += roundOrderIndex;
      }

      const schedule = getNextMatchDate(fechaInicio, diasSeleccionados, hoursArray, slotIndex);
      return {
        ...p,
        fecha: schedule.dateString,
        hora: schedule.hourString
      };
    });

    return [...scheduledGroupMatches, ...scheduledPlayoffMatches];
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

  // Generador de Llaves de Eliminación Directa
  const buildPlayoffBracket = (teamsList, baseMatchIdx = 1, startSchedIndex = 0) => {
    const cleanTeamsList = (teamsList || []).filter(Boolean);
    const totalTeams = cleanTeamsList.length;
    if (totalTeams === 0) return [];
    let power = 2;
    while (power < totalTeams) {
      power *= 2;
    }
    
    let list = [...cleanTeamsList];
    while (list.length < power) {
      list.push({ id: 'bye', nombre: 'DESCANSO', abreviatura: 'BYE' });
    }

    // Mezclar equipos para la siembra si es playoff directo
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
        // Leg 1 (Ida)
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

        // Leg 2 (Vuelta)
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

    // Enlazar rondas
    for (let r = 0; r < roundMatchups.length - 1; r++) {
      const currentRound = roundMatchups[r];
      const nextRound = roundMatchups[r + 1];

      currentRound.forEach(matchup => {
        const nextMatchupIdx = Math.floor(matchup.index / 2);
        const slot = matchup.index % 2 === 0 ? 'local' : 'visitante';
        const nextJornada = nextRound[nextMatchupIdx].partidos[0].jornada;

        matchup.partidos.forEach(p => {
          const info = {
            jornada: nextJornada,
            matchupIndex: nextMatchupIdx,
            slot: slot
          };
          p.siguienteMatchup = info;
          p.stats = {
            ...(p.stats || {}),
            siguienteMatchup: info
          };
        });
      });
    }

    // Auto-propagar BYEs
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

  // Generador Principal de Matchmaking
  const generarMatchmaking = () => {
    if (equipos.length < 2) return;
    setIsSaved(false);

    if (formatoTorneo === 'liga') {
      let roundRobinMatches = buildRoundRobin(equipos);
      const activeMatches = roundRobinMatches.map((match, index) => {
        return {
          ...match,
          id: index + 1
        };
      });
      setPartidos(getScheduledMatches(activeMatches));

    } else if (formatoTorneo === 'playoff') {
      const playoffMatches = buildPlayoffBracket(equipos, 1, 0);
      setPartidos(getScheduledMatches(playoffMatches));

    } else if (formatoTorneo === 'copa') {
      // Fase de grupos: Dividir equipos en A y B (o A, B, C, D)
      let list = [...equipos].sort(() => Math.random() - 0.5);
      let newGroups = {};
      for (let g = 0; g < numGrupos; g++) {
        const char = String.fromCharCode(65 + g); // A, B...
        newGroups[char] = [];
      }
      list.forEach((team, idx) => {
        const char = String.fromCharCode(65 + (idx % numGrupos));
        newGroups[char].push(team);
      });
      setGrupos(newGroups);
      setFaseActual('grupos');

      // Generar fixture de fase de grupos
      let copaMatches = [];
      let totalMatchIndex = 0;
      Object.keys(newGroups).forEach(groupName => {
        let groupRobin = buildRoundRobin(newGroups[groupName], 0, `Grupo ${groupName} - J`);
        groupRobin.forEach(match => {
          totalMatchIndex++;
          copaMatches.push({
            ...match,
            id: totalMatchIndex,
            grupo: groupName
          });
        });
      });

      // Generar de forma inmediata los playoffs correspondientes
      const placeholderTeamsList = getPlaceholderTeams(numGrupos, clasificadosPorGrupo);
      const playoffMatches = buildPlayoffBracket(placeholderTeamsList, totalMatchIndex + 1, totalMatchIndex);

      const copaPlayoffs = playoffMatches.map(p => {
        let stats = p.stats || {};
        
        if (p.local && p.local.isPlaceholder) {
          stats.placeholderLocal = p.local.stats.placeholderCode;
        }
        if (p.visitante && p.visitante.isPlaceholder) {
          stats.placeholderVisitante = p.visitante.stats.placeholderCode;
        }

        return {
          ...p,
          stats: Object.keys(stats).length > 0 ? stats : null
        };
      });

      const combined = [...copaMatches, ...copaPlayoffs];
      setPartidos(getScheduledMatches(combined));
    }
  };

  const handleSaveToDatabase = () => {
    if (!competenciaId) {
      setNotification({
        type: 'error',
        title: '⚠️ Competencia inválida',
        message: 'ID de competencia no válido.'
      });
      return;
    }

    const proceedSave = () => {
      setSaveLoading(true);
      api.post(`/competencias/${competenciaId}/partidos/bulk`, { partidos })
      .then(res => {
        setSaveLoading(false);
        setIsSaved(true);
        if (typeof onMatchesUpdated === 'function') {
          onMatchesUpdated();
        }
        setNotification({
          type: 'success',
          title: '🎉 Guardado con éxito',
          message: `¡Fixture guardado con éxito! Se registraron ${res.data.count} partidos en la base de datos.`
        });
      })
      .catch(err => {
        setSaveLoading(false);
        const msg = err.response?.data?.message || err.message;
        setNotification({
          type: 'error',
          title: '❌ Error al guardar',
          message: `Error al guardar el fixture: ${msg}`
        });
      });
    };

    if (hadExistingMatches) {
      setNotification({
        type: 'confirm',
        title: '⚠️ Sobrescribir Fixture Oficial',
        message: "Ya existen partidos oficiales guardados en la base de datos para esta competencia.\n\n" +
                 "Si guardas este nuevo fixture:\n" +
                 "1. Se eliminarán de forma permanente e irreversible todos los partidos que no pertenezcan al nuevo fixture.\n" +
                 "2. Se perderán todos los resultados, goles y estadísticas (goleadores, tarjetas, asistencias) que ya hayan sido reportados en los partidos modificados o eliminados.\n" +
                 "3. La tabla de posiciones de la competencia se recalculará desde cero.",
        onConfirm: proceedSave
      });
    } else {
      proceedSave();
    }
  };

  // Guardar estadísticas e incidentes de un partido
  const openStatsModal = async (match) => {
    if (match.local.id === 'bye' || match.visitante.id === 'bye') return;
    if (match.local.abreviatura === 'TBD' || match.visitante.abreviatura === 'TBD') return;
    
    setSelectedMatch(match);
    setStatsScoreA(match.score_local || 0);
    setStatsScoreB(match.score_visitante || 0);
    setReportMethod('manual'); // Resetear a manual por defecto
    setEaMatches([]);
    setEaError(null);
    setSelectedEaMatchId('');
    setEaClubLocalId('');
    setEaClubVisitanteId('');
    setEaWarnings(null);

    let parsedStats = match.stats;
    if (typeof parsedStats === 'string') {
      try {
        parsedStats = JSON.parse(parsedStats);
      } catch (e) {
        parsedStats = null;
      }
    }
    if (parsedStats) {
      setTeamAStats(parsedStats.teamA || parsedStats.teamLocal || { shots: 10, possession: 50, corners: 4, fouls: 5 });
      setTeamBStats(parsedStats.teamB || parsedStats.teamVisitante || { shots: 8, possession: 50, corners: 3, fouls: 6 });
      setPlayerStats(parsedStats.players || []);
    } else {
      setTeamAStats({ shots: 10, possession: 50, corners: 4, fouls: 5 });
      setTeamBStats({ shots: 8, possession: 50, corners: 3, fouls: 6 });
      setPlayerStats(mockRoster.map(p => ({
        id: p.id,
        name: p.name,
        goals: 0,
        assists: 0,
        yellowCard: false,
        redCard: false
      })));
    }
    setIsStatsModalOpen(true);

    // Intentar pre-cargar partidos de EA en segundo plano
    setEaLoading(true);
    try {
      const res = await api.get(`/partidos/${match.id}/ea-matches`);
      if (res.data && res.data.partidosEA) {
        setEaMatches(res.data.partidosEA);
        
        // Auto-detectar los club IDs de EA
        const localClubEaId = match.local?.club_id_ea;
        const visitClubEaId = match.visitante?.club_id_ea;
        if (localClubEaId) setEaClubLocalId(String(localClubEaId));
        if (visitClubEaId) setEaClubVisitanteId(String(visitClubEaId));
      }
    } catch (err) {
      console.warn("No se pudieron obtener los partidos de EA:", err);
      setEaError(err.response?.data?.message || "No se pudo conectar a la API de EA. Asegúrate de configurar los IDs de Club de EA.");
    } finally {
      setEaLoading(false);
    }
  };

  const handleSaveStats = async () => {
    const isMatchSaved = selectedMatch && selectedMatch.id && typeof selectedMatch.id === 'number';
    const updatedStats = {
      teamA: teamAStats,
      teamB: teamBStats,
      teamLocal: teamAStats,
      teamVisitante: teamBStats,
      players: playerStats
    };

    if (isMatchSaved) {
      setManualSaving(true);
      try {
        await api.put(`/partidos/${selectedMatch.id}`, {
          goles_local: Number(statsScoreA),
          goles_visitante: Number(statsScoreB),
          stats: {
            ...selectedMatch.stats,
            ...updatedStats
          }
        });
        
        setNotification({
          type: 'success',
          title: '🎉 Guardado con éxito',
          message: '¡Marcador y estadísticas del partido reportados exitosamente!'
        });

        if (typeof onMatchesUpdated === 'function') {
          await onMatchesUpdated();
        }
      } catch (err) {
        setNotification({
          type: 'error',
          title: '❌ Error al guardar',
          message: 'No se pudo guardar el reporte manual: ' + (err.response?.data?.message || err.message)
        });
        setManualSaving(false);
        return;
      }
      setManualSaving(false);
    }

    const aplicaAvancesYResoluciones = (partidosList, matchModificado) => {
      let updatedList = [...partidosList];

      // 1. Resolver clasificados de grupos si es Copa
      if (formatoTorneo === 'copa') {
        const groupStandings = {};
        const groupMatches = updatedList.filter(m => m.grupo);

        Object.keys(grupos).forEach(groupName => {
          const groupTeams = grupos[groupName] || [];
          const groupMatchesFiltered = groupMatches.filter(m => m.grupo === groupName);
          
          const allFinished = groupMatchesFiltered.length > 0 && groupMatchesFiltered.every(m => m.score_local !== null && m.score_visitante !== null);
          if (allFinished) {
            const standings = getStandingsForTeams(groupTeams, groupMatchesFiltered);
            groupStandings[groupName] = standings;
          }
        });

        updatedList = updatedList.map(m => {
          if (m.grupo) return m;

          let updatedMatch = { ...m };
          let pStats = updatedMatch.stats;
          if (typeof pStats === 'string') {
            try { pStats = JSON.parse(pStats); } catch(e) {}
          }

          if (pStats) {
            // Resolve Local
            if (pStats.placeholderLocal) {
              const code = pStats.placeholderLocal;
              const parts = code.split('-');
              if (parts.length === 3 && parts[0] === 'g') {
                const g = parts[1];
                const pos = parseInt(parts[2], 10) - 1;
                if (groupStandings[g] && groupStandings[g][pos]) {
                  const resolvedTeam = groupStandings[g][pos];
                  const teamObj = equipos.find(eq => eq.id === resolvedTeam.id) || { id: resolvedTeam.id, nombre: resolvedTeam.nombre, abreviatura: resolvedTeam.abreviatura, logo: resolvedTeam.logo };
                  if (!updatedMatch.local || updatedMatch.local.id !== teamObj.id) {
                    updatedMatch.local = teamObj;
                  }
                }
              }
            }

            // Resolve Visitante
            if (pStats.placeholderVisitante) {
              const code = pStats.placeholderVisitante;
              const parts = code.split('-');
              if (parts.length === 3 && parts[0] === 'g') {
                const g = parts[1];
                const pos = parseInt(parts[2], 10) - 1;
                if (groupStandings[g] && groupStandings[g][pos]) {
                  const resolvedTeam = groupStandings[g][pos];
                  const teamObj = equipos.find(eq => eq.id === resolvedTeam.id) || { id: resolvedTeam.id, nombre: resolvedTeam.nombre, abreviatura: resolvedTeam.abreviatura, logo: resolvedTeam.logo };
                  if (!updatedMatch.visitante || updatedMatch.visitante.id !== teamObj.id) {
                    updatedMatch.visitante = teamObj;
                  }
                }
              }
            }
          }
          return updatedMatch;
        });
      }

      // 2. Avance automático en playoffs
      if (formatoTorneo === 'playoff' || formatoTorneo === 'copa' || faseActual === 'playoffs') {
        const currentJornada = matchModificado.jornada;
        const currentMatchupIdx = matchModificado.matchupIndex;

        // Obtener todos los partidos de este matchup en el array actualizado
        const matchupMatches = updatedList.filter(m => m.jornada === currentJornada && m.matchupIndex === currentMatchupIdx);

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

        if (winner && matchModificado.siguienteMatchup) {
          const nextMatchupInfo = matchModificado.siguienteMatchup;
          
          updatedList.forEach(nm => {
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

      return updatedList;
    };

    const updated = partidos.map(m => {
      if (m.id === selectedMatch.id) {
        return {
          ...m,
          score_local: Number(statsScoreA),
          score_visitante: Number(statsScoreB),
          stats: {
            ...m.stats,
            ...updatedStats
          }
        };
      }
      return m;
    });

    const finalMatches = aplicaAvancesYResoluciones(updated, selectedMatch);
    setPartidos(finalMatches);
    setIsStatsModalOpen(false);
  };

  const handleEaReportSubmit = async (forceReport = false) => {
    if (!selectedEaMatchId || !eaClubLocalId || !eaClubVisitanteId) {
      setNotification({
        type: 'warning',
        title: '⚠️ Datos incompletos',
        message: 'Selecciona un partido de EA y confirma los IDs de Club de EA local y visitante.'
      });
      return;
    }

    // Doble chequeo de seguridad
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
      const res = await api.post(`/partidos/${selectedMatch.id}/ea-report`, {
        ea_match_id: selectedEaMatchId,
        club_local_id: eaClubLocalId,
        club_visitante_id: eaClubVisitanteId,
        force: forceReport
      });

      if (res.data && res.data.success) {
        setNotification({
          type: 'success',
          title: '🎉 Reporte exitoso',
          message: '¡Partido reportado exitosamente con datos de la API de EA Sports!'
        });

        if (typeof onMatchesUpdated === 'function') {
          await onMatchesUpdated();
        }
        
        // Actualizar el partido en el estado local de la previsualización
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

        const finalMatches = aplicaAvancesYResoluciones(updated, selectedMatch);
        setPartidos(finalMatches);
        setIsStatsModalOpen(false);
      }
    } catch (err) {
      if (err.response?.status === 422 && err.response?.data?.code === 'VALIDATION_WARNING') {
        setEaWarnings(err.response.data.players);
      } else {
        setNotification({
          type: 'error',
          title: '❌ Error de API',
          message: 'Error al procesar reporte de EA: ' + (err.response?.data?.message || err.message)
        });
      }
    } finally {
      setEaProcessing(false);
    }
  };

  // Calcular la tabla de posiciones en tiempo real
  const getStandingsForTeams = (teamList, filteredMatches) => {
    const statsMap = {};
    
    teamList.forEach(eq => {
      statsMap[eq.id] = {
        id: eq.id,
        nombre: eq.nombre,
        abreviatura: eq.abreviatura,
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



  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  const matchesGroupStage = partidos.filter(p => {
    const isBye = p.local.id === 'bye' || p.visitante.id === 'bye';
    if (isBye) return false;
    if (formatoTorneo === 'liga') return true;
    if (formatoTorneo === 'playoff') return false;
    return !!p.grupo;
  });

  const matchesPlayoffs = partidos.filter(p => {
    const isBye = p.local.id === 'bye' || p.visitante.id === 'bye';
    if (isBye) return false;
    if (formatoTorneo === 'liga') return false;
    if (formatoTorneo === 'playoff') return true;
    return !p.grupo;
  });

  const renderMatchCard = (p) => {
    return (
      <div 
        key={p.id}
        className="p-4 bg-card/25 border border-border/50 hover:border-primary/40 rounded-xl transition-all hover:shadow-md hover:shadow-primary/5 flex flex-col sm:flex-row justify-between items-center gap-4 relative overflow-hidden backdrop-blur-sm"
      >
        {/* Status Left bar */}
        <div className={`absolute top-0 left-0 bottom-0 w-[3px] ${
          p.score_local !== null && p.score_visitante !== null 
            ? 'bg-emerald-500' 
            : 'bg-primary/50'
        }`}></div>

        <div className="flex flex-col gap-2 w-full sm:w-auto flex-grow">
          <div className="flex items-center gap-2">
            <span className="text-[9px] bg-primary/10 text-primary border border-primary/20 font-bold px-2 py-0.5 rounded-full uppercase tracking-wider font-mono">
              {p.jornada}
            </span>
            {p.grupo && (
              <span className="text-[9px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold px-2 py-0.5 rounded-full uppercase tracking-wider font-mono">
                Grupo {p.grupo}
              </span>
            )}
            {p.leg && (
              <span className="text-[9px] bg-muted text-muted-foreground border border-border/30 font-bold px-2 py-0.5 rounded-full uppercase tracking-wider font-mono">
                {p.leg}
              </span>
            )}
          </div>
          
          {/* Matchup Teams & Score */}
          <div className="flex items-center gap-3 py-1 justify-between sm:justify-start w-full">
            {/* Local Team */}
            <div className="flex items-center gap-2 justify-end flex-1 min-w-0">
              <span className="text-xs font-black text-foreground uppercase truncate text-right flex-grow">
                {p.local.nombre}
              </span>
              {p.local.logo ? (
                <img src={p.local.logo} alt="" className="w-5.5 h-5.5 rounded-full object-contain bg-background/50 p-0.5 border border-border/20 shrink-0" />
              ) : (
                <span className="w-5.5 h-5.5 rounded-full bg-muted/40 border border-border/20 text-[8px] flex items-center justify-center font-bold text-muted-foreground shrink-0">🎮</span>
              )}
            </div>

            {/* Versus / Score Central Badge */}
            <div className="shrink-0 flex items-center justify-center min-w-[55px]">
              {p.score_local !== null && p.score_visitante !== null ? (
                <span className="text-xs font-mono font-black text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded border border-emerald-500/30">
                  {p.score_local} - {p.score_visitante}
                </span>
              ) : (
                <span className="text-[10px] font-display font-black text-primary bg-primary/10 px-2.5 py-0.5 rounded border border-primary/20 tracking-wider">
                  VS
                </span>
              )}
            </div>

            {/* Visitante Team */}
            <div className="flex items-center gap-2 justify-start flex-1 min-w-0">
              {p.visitante.logo ? (
                <img src={p.visitante.logo} alt="" className="w-5.5 h-5.5 rounded-full object-contain bg-background/50 p-0.5 border border-border/20 shrink-0" />
              ) : (
                <span className="w-5.5 h-5.5 rounded-full bg-muted/40 border border-border/20 text-[8px] flex items-center justify-center font-bold text-muted-foreground shrink-0">🎮</span>
              )}
              <span className="text-xs font-black text-foreground uppercase truncate text-left flex-grow">
                {p.visitante.nombre}
              </span>
            </div>
          </div>
        </div>

        {/* Date and actions */}
        <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-center w-full sm:w-auto border-t sm:border-t-0 border-border/20 pt-2.5 sm:pt-0 gap-2 shrink-0">
          <div className="text-left sm:text-right font-mono text-[9px] text-muted-foreground font-semibold">
            <div className="flex items-center gap-1 justify-start sm:justify-end">
              <span>📅</span> <span>{p.fecha}</span>
            </div>
            <div className="flex items-center gap-1 justify-start sm:justify-end mt-0.5">
              <span>🕒</span> <span>{p.hora}</span>
            </div>
          </div>
          
          <Button 
            size="sm" 
            onClick={() => openStatsModal(p)}
            className="h-7 px-2.5 text-[9px] bg-primary/10 hover:bg-primary text-primary hover:text-primary-foreground border border-primary/30 hover:border-transparent transition-all uppercase tracking-wider font-bold cursor-pointer"
          >
            📝 Reportar
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      
      {/* 1. CONFIGURACIÓN INICIAL / GENERACIÓN */}
      {partidos.length === 0 ? (
        <Card className="p-6 border border-border/50 backdrop-blur-md bg-card/25 shadow-lg relative overflow-hidden" withGlow>
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-display font-black text-foreground uppercase tracking-wide">Generar Matchmaking Táctico</h3>
              <p className="text-xs text-muted-foreground mt-1">Configura el formato táctico del torneo, jornadas y plazos oficiales de la división.</p>
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
                <label className="text-[10px] text-muted-foreground font-black uppercase tracking-wider block">Modalidad</label>
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

              <div className="space-y-2">
                <label className="text-[10px] text-muted-foreground font-black uppercase tracking-wider block">Fecha de Inicio oficial</label>
                <Input type="date" value={fechaInicio} onChange={(e) => setFechaInicio(e.target.value)} />
              </div>
            </div>

            {formatoTorneo === 'copa' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t border-border/20 pt-4">
                <div className="space-y-2">
                  <label className="text-[10px] text-muted-foreground font-black uppercase tracking-wider block">Número de Grupos</label>
                  <Select
                    value={numGrupos}
                    onChange={(e) => setNumGrupos(Number(e.target.value))}
                    options={groupOptions}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] text-muted-foreground font-black uppercase tracking-wider block">Clasificados por Grupo</label>
                  <Select
                    value={clasificadosPorGrupo}
                    onChange={(e) => setClasificadosPorGrupo(Number(e.target.value))}
                    options={classifiedOptions}
                  />
                </div>
              </div>
            )}

            {/* ESTIMACIÓN DE DENSIDAD DE PARTIDOS */}
            {equipos.length >= 2 && (
              <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 space-y-2 text-xs font-sans">
                <span className="font-bold text-primary block uppercase tracking-wider text-[10px]">📊 Estimación de Densidad de Partidos</span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-muted-foreground">
                  <div>
                    <span className="block text-[10px] uppercase">Fase Regular</span>
                    <strong className="text-foreground text-sm font-mono">{densityMetrics.groupStageMatches}</strong> partidos
                  </div>
                  <div>
                    <span className="block text-[10px] uppercase">Fase de Playoffs</span>
                    <strong className="text-foreground text-sm font-mono">{densityMetrics.playoffMatchesCount}</strong> partidos
                  </div>
                  <div className="border-t sm:border-t-0 sm:border-l border-border/30 pt-2 sm:pt-0 sm:pl-4">
                    <span className="block text-[10px] uppercase text-primary font-bold font-sans">Total Estimado</span>
                    <strong className="text-primary text-sm font-mono">{densityMetrics.groupStageMatches + densityMetrics.playoffMatchesCount}</strong> partidos
                  </div>
                </div>
              </div>
            )}

            {/* Días de juego */}
            <div className="space-y-2">
              <label className="text-[10px] text-muted-foreground font-black uppercase tracking-wider block">Días de Enfrentamiento Oficial</label>
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

            {/* Lista de horas */}
            <div className="space-y-2">
              <label className="text-[10px] text-muted-foreground font-black uppercase tracking-wider block">Horarios de los Partidos (Separados por comas)</label>
              <Input value={horasInput} onChange={(e) => setHorasInput(e.target.value)} placeholder="Ej: 22:00, 22:30, 23:00" />
            </div>

            {equipos.length < 2 ? (
              <p className="text-xs text-primary font-bold text-center bg-primary/10 p-3 rounded-lg border border-primary/20">
                ⚠️ Necesitas al menos 2 equipos inscritos en la división para poder armar el fixture del torneo.
              </p>
            ) : (
              <Button 
                onClick={generarMatchmaking}
                className="w-full h-11 bg-gradient-to-r from-primary to-destructive text-primary-foreground font-display font-black uppercase tracking-wider text-xs shadow-md border-none animate-pulse"
              >
                ⚙️ Previsualizar Matchmaking & Fixture
              </Button>
            )}
          </div>
        </Card>
      ) : (
        /* 2. MATCHMAKING PREVISUALIZADO */
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-card/45 p-4 rounded-xl border border-border/50 gap-4">
            <div>
              <h3 className="font-display font-black text-lg text-foreground uppercase tracking-wider">
                ✨ Previsualización del Fixture ({formatoTorneo === 'liga' ? 'Liga' : formatoTorneo === 'playoff' ? 'Playoffs Directos' : 'Copa Grupos'})
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">Revisa el fixture antes de hacerlo oficial en el servidor de la liga.</p>
            </div>
            <div className="flex gap-2">
              <Button 
                onClick={() => {
                  setPartidos([]);
                  setIsSaved(false);
                }}
                variant="outline"
                className="h-10 text-xs font-bold uppercase tracking-wider"
              >
                🔄 Configurar de nuevo
              </Button>
              <Button
                onClick={handleSaveToDatabase}
                disabled={isSaved || saveLoading}
                className={`h-10 text-xs font-bold uppercase tracking-wider px-6 ${
                  isSaved 
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                    : 'bg-primary text-primary-foreground border-none shadow-md'
                }`}
              >
                {saveLoading ? '💾 Guardando...' : isSaved ? '✅ Guardado con éxito' : '💾 Guardar Fixture Oficial'}
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            
            {/* LADO IZQUIERDO: TABLA O GRUPOS */}
            {formatoTorneo !== 'playoff' && (
              <div className="lg:col-span-1 space-y-6">
              {formatoTorneo === 'liga' && (
                <Card className="p-5 border border-border/50 bg-card/25 backdrop-blur-md shadow-lg" withGlow>
                  <h3 className="font-display font-black text-lg text-foreground uppercase tracking-wider mb-4 border-b border-border/40 pb-2">
                    📊 Clasificación Estimada
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left border-collapse">
                      <thead>
                        <tr className="border-b border-border/50 text-[9px] uppercase font-bold text-muted-foreground tracking-wider font-mono">
                          <th className="py-2 text-center w-8">Pos</th>
                          <th className="py-2">Club</th>
                          <th className="py-2 text-center">PJ</th>
                          <th className="py-2 text-center">DG</th>
                          <th className="py-2 text-center text-primary">Pts</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/30 font-semibold">
                        {standings.map((team, idx) => {
                          const isPromoted = idx < (competencia?.config?.clasificados_por_grupo || 4);
                          return (
                            <tr key={team.id} className={`hover:bg-muted/10 transition-colors border-l-2 ${isPromoted ? 'border-l-primary bg-primary/5' : 'border-l-transparent'}`}>
                              <td className="py-2.5 text-center font-mono font-bold">{idx + 1}</td>
                              <td className="py-2.5 font-bold text-foreground">
                                <div className="flex items-center gap-2 pl-2">
                                  {team.logo && <img src={team.logo} className="w-4.5 h-4.5 rounded-full object-contain bg-background/50 p-0.5" alt="" />}
                                  <span className="truncate max-w-[120px]">{team.nombre || team.abreviatura}</span>
                                </div>
                              </td>
                              <td className="py-2.5 text-center font-mono">{team.pj}</td>
                              <td className="py-2.5 text-center font-mono">{team.gf - team.gc}</td>
                              <td className="py-2.5 text-center font-mono text-primary font-black">{team.pts}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </Card>
              )}

              {formatoTorneo === 'liga' && competencia?.config?.clasificados_por_grupo > 0 && faseActual !== 'playoffs' && (
                <Button
                  onClick={generarPlayoffsLiga}
                  className="w-full h-11 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-display font-black uppercase tracking-wider text-xs border-none shadow-md hover:from-emerald-600 hover:to-teal-600"
                >
                  🔥 Generar Playoffs de Liga (Top {competencia.config.clasificados_por_grupo})
                </Button>
              )}

              {formatoTorneo === 'copa' && Object.keys(grupos).map(groupName => (
                <Card key={groupName} className="p-4 border border-border/40 bg-card/10 shadow-md">
                  <h4 className="font-display font-black text-sm text-primary uppercase tracking-wide mb-3 border-b border-border/20 pb-1">
                    🟢 Grupo {groupName}
                  </h4>
                  <table className="w-full text-[11px] text-left border-collapse">
                    <thead>
                      <tr className="text-[9px] text-muted-foreground uppercase font-mono border-b border-border/30">
                        <th className="py-1">Club</th>
                        <th className="py-1 text-center">PJ</th>
                        <th className="py-1 text-center">DG</th>
                        <th className="py-1 text-center text-primary">Pts</th>
                      </tr>
                    </thead>
                    <tbody className="font-semibold text-foreground divide-y divide-border/20">
                      {getStandingsForTeams(grupos[groupName], partidos.filter(p => p.grupo === groupName)).map((team, idx) => {
                        const isPromoted = idx < clasificadosPorGrupo;
                        return (
                          <tr key={team.id} className={`hover:bg-muted/5 transition-colors border-l-2 ${isPromoted ? 'border-l-emerald-500 bg-emerald-500/5' : 'border-l-transparent'}`}>
                            <td className="py-2 font-bold pl-2">
                              <div className="flex items-center gap-1.5">
                                {team.logo && <img src={team.logo} className="w-3.5 h-3.5 rounded-full object-contain bg-background/50 p-0.5" alt="" />}
                                <span className="truncate max-w-[120px]">{team.nombre || team.abreviatura}</span>
                              </div>
                            </td>
                            <td className="py-2 text-center font-mono">{team.pj}</td>
                            <td className="py-2 text-center font-mono">{team.gf - team.gc}</td>
                            <td className="py-2 text-center font-mono text-primary font-black">{team.pts}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </Card>
              ))}

              </div>
            )}

            {/* LADO DERECHO: PARTIDOS & LLAVES */}
            <div className={`${formatoTorneo === 'playoff' ? 'lg:col-span-3' : 'lg:col-span-2'} space-y-6`}>
              
              {/* VISTA BRACKET DE PLAYOFFS */}
              {(formatoTorneo === 'playoff' || formatoTorneo === 'copa') && (
                <Card className="p-5 border border-border/50 bg-card/20 backdrop-blur-md shadow-lg" withGlow>
                  <h3 className="font-display font-black text-sm text-foreground uppercase tracking-wide mb-4 flex items-center gap-2">
                    🛡️ Árbol de Eliminación Directa <span className="text-[10px] bg-primary/20 text-primary px-2 py-0.5 rounded font-mono font-bold tracking-normal normal-case">Deslizar horizontalmente ↔</span>
                  </h3>
                  
                  {/* Llaves dinámicas (Horizontal Esports Bracket) */}
                  <div className="flex flex-row gap-6 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-primary/25 scrollbar-track-transparent">
                    {['Octavos', 'Octavos Playoff', 'Octavos Copa', 'Cuartos', 'Cuartos Playoff', 'Cuartos Copa', 'Semis', 'Semis Playoff', 'Semis Copa', 'Semifinal Copa', 'Final', 'Gran Final Playoff', 'Gran Final Copa'].map(round => {
                      const roundMatches = partidos.filter(p => p.jornada === round);
                      if (roundMatches.length === 0) return null;

                      return (
                        <div key={round} className="flex flex-col min-w-[280px] w-[300px] shrink-0 space-y-4">
                          <div className="flex items-center justify-between border-b border-border/30 pb-2 mb-1">
                            <span className="text-xs font-display font-black text-primary uppercase tracking-wider">
                              {round}
                            </span>
                            <span className="text-[9px] font-mono bg-muted/30 text-muted-foreground px-2 py-0.5 rounded-full border border-border/20 font-bold">
                              {roundMatches.length} {roundMatches.length === 1 ? 'partido' : 'partidos'}
                            </span>
                          </div>
                          
                          <div className="flex flex-col justify-around flex-grow gap-4">
                            {roundMatches.map(p => {
                              const isTBD = p.local.id.toString().includes('tbd') || p.visitante.id.toString().includes('tbd');
                              const isFinished = p.score_local !== null && p.score_visitante !== null;
                              
                              return (
                                <div
                                  key={p.id}
                                  onClick={() => openStatsModal(p)}
                                  className={`p-3 bg-background/50 border backdrop-blur-sm transition-all rounded-xl cursor-pointer flex flex-col justify-between gap-3 group relative overflow-hidden shadow-sm hover:shadow-primary/5 hover:translate-y-[-2px] ${
                                    isFinished 
                                      ? 'border-emerald-500/20 hover:border-emerald-500/40 bg-emerald-950/5' 
                                      : isTBD
                                        ? 'border-border/40 hover:border-muted-foreground/30 opacity-75'
                                        : 'border-border/60 hover:border-primary/50'
                                  }`}
                                >
                                  {/* Glass highlight card header */}
                                  <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-primary/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                  
                                  <div className="space-y-2">
                                    {/* Local Team row */}
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center gap-2 max-w-[200px]">
                                        {p.local.logo ? (
                                          <img src={p.local.logo} alt="" className="w-5 h-5 rounded-full object-contain bg-background/40 p-0.5 border border-border/30" />
                                        ) : (
                                          <span className="w-5 h-5 rounded-full bg-muted/30 border border-border/20 text-[8px] flex items-center justify-center font-bold text-muted-foreground">🎮</span>
                                        )}
                                        <span className={`text-xs font-black truncate uppercase ${p.local.id.toString().includes('tbd') ? 'text-muted-foreground italic' : 'text-foreground'}`}>
                                          {p.local.nombre}
                                        </span>
                                      </div>
                                      <span className={`text-xs font-mono font-black px-2 py-0.5 rounded ${
                                        isFinished
                                          ? p.score_local > p.score_visitante
                                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                            : 'bg-muted/30 text-muted-foreground'
                                          : 'bg-muted/40 text-muted-foreground'
                                      }`}>
                                        {p.score_local !== null ? p.score_local : '-'}
                                      </span>
                                    </div>
                                    
                                    {/* Visitante Team row */}
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center gap-2 max-w-[200px]">
                                        {p.visitante.logo ? (
                                          <img src={p.visitante.logo} alt="" className="w-5 h-5 rounded-full object-contain bg-background/40 p-0.5 border border-border/30" />
                                        ) : (
                                          <span className="w-5 h-5 rounded-full bg-muted/30 border border-border/20 text-[8px] flex items-center justify-center font-bold text-muted-foreground">🎮</span>
                                        )}
                                        <span className={`text-xs font-black truncate uppercase ${p.visitante.id.toString().includes('tbd') ? 'text-muted-foreground italic' : 'text-foreground'}`}>
                                          {p.visitante.nombre}
                                        </span>
                                      </div>
                                      <span className={`text-xs font-mono font-black px-2 py-0.5 rounded ${
                                        isFinished
                                          ? p.score_visitante > p.score_local
                                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                            : 'bg-muted/30 text-muted-foreground'
                                          : 'bg-muted/40 text-muted-foreground'
                                      }`}>
                                        {p.score_visitante !== null ? p.score_visitante : '-'}
                                      </span>
                                    </div>
                                  </div>
                                  
                                  {/* Card bottom details */}
                                  <div className="flex items-center justify-between border-t border-border/20 pt-2 text-[9px] font-mono text-muted-foreground">
                                    <span className="font-sans font-bold uppercase tracking-wider text-[8px] px-1.5 py-0.5 bg-muted/20 border border-border/20 rounded">
                                      {p.leg}
                                    </span>
                                    <div className="flex items-center gap-2">
                                      <span>📅 {p.fecha}</span>
                                      <span>🕒 {p.hora}</span>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </Card>
              )}

              {/* LISTADO DE ENCUENTROS POR JORNADA */}
              <div className="space-y-6">
                <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-widest px-1 border-b border-border/50 pb-2">
                  Partidos y Cronogramas Generados
                </h3>

                {formatoTorneo === 'copa' ? (
                  <div className="space-y-6">
                    {/* Fase Regular / Grupos */}
                    <div className="space-y-3">
                      <span className="text-xs font-display font-black text-primary uppercase tracking-wider block px-1 border-l-2 border-primary pl-2">
                        📅 Fase Regular / Grupos ({matchesGroupStage.length} partidos)
                      </span>
                      <div className="grid grid-cols-1 gap-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                        {matchesGroupStage.length > 0 ? (
                          matchesGroupStage.map(p => renderMatchCard(p))
                        ) : (
                          <div className="text-center py-8 text-xs text-muted-foreground border border-dashed border-border/40 rounded-xl bg-card/5">
                            No hay partidos de fase regular
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Playoffs */}
                    <div className="space-y-3">
                      <span className="text-xs font-display font-black text-emerald-400 uppercase tracking-wider block px-1 border-l-2 border-emerald-400 pl-2">
                        🛡️ Fase de Playoffs ({matchesPlayoffs.length} partidos)
                      </span>
                      <div className="grid grid-cols-1 gap-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                        {matchesPlayoffs.length > 0 ? (
                          matchesPlayoffs.map(p => renderMatchCard(p))
                        ) : (
                          <div className="text-center py-8 text-xs text-muted-foreground border border-dashed border-border/40 rounded-xl bg-card/5">
                            No hay partidos de playoffs generados aún
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                    {partidos.filter(p => {
                      const isBye = p.local.id === 'bye' || p.visitante.id === 'bye';
                      return !isBye;
                    }).map(p => renderMatchCard(p))}
                  </div>
                )}
              </div>

            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: ESTADÍSTICAS DEL PARTIDO & REPORTES (EQUIPOS Y JUGADORES)          */}
      {/* ========================================================================= */}
      {isStatsModalOpen && selectedMatch && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-[120] flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-card border border-border/50 shadow-2xl rounded-2xl p-6 space-y-6 max-h-[90vh] overflow-y-auto animate-fade-in relative animate-scale-up">
            
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-border/40 pb-3 gap-3">
              <div>
                <h3 className="text-xl font-display font-black text-foreground uppercase tracking-wide flex items-center gap-2">
                  🛡️ Ficha Técnica y Reporte del Duelo
                </h3>
                <p className="text-[10px] text-muted-foreground mt-0.5">Reporta los resultados y estadísticas del encuentro oficial de la división.</p>
              </div>

              {/* TABS DE MÉTODO DE REPORTE */}
              <div className="flex flex-wrap gap-1 bg-muted/40 p-1 rounded-lg border border-border/40 shrink-0">
                <button 
                  onClick={() => setReportMethod('ea')}
                  className={`px-3 py-1.5 rounded-md text-[10px] font-black uppercase tracking-wider transition-colors flex items-center gap-1 ${reportMethod === 'ea' ? 'bg-background text-primary shadow-sm border border-border/20' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  🎮 EA API
                </button>
                <button 
                  onClick={() => setReportMethod('ia')}
                  className={`px-3 py-1.5 rounded-md text-[10px] font-black uppercase tracking-wider transition-colors flex items-center gap-1 ${reportMethod === 'ia' ? 'bg-background text-primary shadow-sm border border-border/20' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  ✨ IA Vision
                </button>
                <button 
                  onClick={() => setReportMethod('manual')}
                  className={`px-3 py-1.5 rounded-md text-[10px] font-black uppercase tracking-wider transition-colors ${reportMethod === 'manual' ? 'bg-background text-primary shadow-sm border border-border/20' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  📝 Manual
                </button>
              </div>
            </div>

            {(reportMethod === 'manual' || reportMethod === 'ia') ? (
              /* --- MÉTODO MANUAL O IA VISION --- */
              <div className="space-y-6">
                
                {reportMethod === 'ia' && (
                  <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 mb-4">
                    <h4 className="text-[11px] font-black uppercase text-primary mb-2 flex items-center gap-1.5">
                      ✨ Autocompletar con IA (Gemini Vision)
                    </h4>
                    <p className="text-[10px] text-muted-foreground mb-3">
                      Sube las capturas de pantalla del partido (Estadísticas del Equipo y Rendimiento de Jugadores) para extraer los datos automáticamente.
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold uppercase text-muted-foreground">Foto: Stats de Equipo</label>
                        <input 
                          type="file" 
                          accept="image/*"
                          onChange={(e) => handleImageUpload(e, setVisionTeamStatsImg)}
                          className="w-full text-[10px] file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-[10px] file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold uppercase text-muted-foreground">Foto: Rendimiento Jugadores</label>
                        <input 
                          type="file" 
                          accept="image/*"
                          onChange={(e) => handleImageUpload(e, setVisionPlayerStatsImg)}
                          className="w-full text-[10px] file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-[10px] file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                        />
                      </div>
                    </div>
                    <Button 
                      onClick={handleVisionExtract}
                      isLoading={visionProcessing}
                      disabled={!visionTeamStatsImg || !visionPlayerStatsImg}
                      className="w-full h-8 text-[10px] bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-black uppercase tracking-wider shadow border-none"
                    >
                      🚀 Extraer Estadísticas
                    </Button>
                  </div>
                )}
                
                <div className="grid grid-cols-2 gap-6">
                  {/* Local */}
                  <div className="space-y-4">
                    <h4 className="text-sm font-bold text-primary uppercase">{selectedMatch.local.nombre}</h4>
                    <div className="space-y-3">
                      <div className="space-y-1">
                        <label className="text-[10px] text-muted-foreground font-black uppercase tracking-wider block">Goles convertidos</label>
                        <Input type="number" value={statsScoreA} onChange={(e) => setStatsScoreA(e.target.value)} />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] text-muted-foreground font-black uppercase tracking-wider block">Tiros al arco</label>
                        <Input type="number" value={teamAStats.shots} onChange={(e) => setTeamAStats({ ...teamAStats, shots: Number(e.target.value) })} />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] text-muted-foreground font-black uppercase tracking-wider block">Posesión %</label>
                        <Input type="number" value={teamAStats.possession} onChange={(e) => setTeamAStats({ ...teamAStats, possession: Number(e.target.value) })} />
                      </div>
                    </div>
                  </div>

                  {/* Visitante */}
                  <div className="space-y-4">
                    <h4 className="text-sm font-bold text-primary uppercase">{selectedMatch.visitante.nombre}</h4>
                    <div className="space-y-3">
                      <div className="space-y-1">
                        <label className="text-[10px] text-muted-foreground font-black uppercase tracking-wider block">Goles convertidos</label>
                        <Input type="number" value={statsScoreB} onChange={(e) => setStatsScoreB(e.target.value)} />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] text-muted-foreground font-black uppercase tracking-wider block">Tiros al arco</label>
                        <Input type="number" value={teamBStats.shots} onChange={(e) => setTeamBStats({ ...teamBStats, shots: Number(e.target.value) })} />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] text-muted-foreground font-black uppercase tracking-wider block">Posesión %</label>
                        <Input type="number" value={teamBStats.possession} onChange={(e) => setTeamBStats({ ...teamBStats, possession: Number(e.target.value) })} />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="h-px bg-border/40"></div>

                {/* ESTADÍSTICAS DEL JUGADOR */}
                <div className="space-y-3">
                  <h4 className="text-sm font-bold text-foreground uppercase tracking-wide">Estadísticas Individuales de Jugador (Roster)</h4>
                  <div className="space-y-2 border border-border/40 rounded-xl overflow-hidden bg-muted/10 p-2">
                    {playerStats.map((p, idx) => (
                      <div key={p.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-3 border-b border-border/30 last:border-0 gap-3 text-xs">
                        <span className="font-bold text-foreground truncate w-32">{p.name}</span>
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
                              className="w-12 h-8 rounded bg-background border border-border/60 text-center font-mono font-bold" 
                            />
                          </div>
                          <div className="flex items-center gap-1.5">
                            <label className="text-[9px] font-black text-muted-foreground uppercase tracking-wider">Asists</label>
                            <input 
                              type="number" 
                              value={p.assists} 
                              onChange={(e) => {
                                const clone = [...playerStats];
                                clone[idx].assists = Number(e.target.value);
                                setPlayerStats(clone);
                              }}
                              className="w-12 h-8 rounded bg-background border border-border/60 text-center font-mono font-bold" 
                            />
                          </div>
                          <div className="flex items-center gap-2">
                            <label className="flex items-center gap-1 cursor-pointer">
                              <input 
                                type="checkbox" 
                                checked={p.yellowCard} 
                                onChange={(e) => {
                                  const clone = [...playerStats];
                                  clone[idx].yellowCard = e.target.checked;
                                  setPlayerStats(clone);
                                }}
                                className="rounded border-border/60 text-primary focus:ring-primary w-4 h-4 cursor-pointer"
                              />
                              <span className="text-[9px] font-black uppercase text-amber-500">🟨 Amarilla</span>
                            </label>
                            <label className="flex items-center gap-1 cursor-pointer">
                              <input 
                                type="checkbox" 
                                checked={p.redCard} 
                                onChange={(e) => {
                                  const clone = [...playerStats];
                                  clone[idx].redCard = e.target.checked;
                                  setPlayerStats(clone);
                                }}
                                className="rounded border-border/60 text-primary focus:ring-primary w-4 h-4 cursor-pointer"
                              />
                              <span className="text-[9px] font-black uppercase text-destructive">🟥 Roja</span>
                            </label>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Botones de acción */}
                <div className="flex gap-2 justify-end pt-3">
                  <Button onClick={() => setIsStatsModalOpen(false)} variant="outline" className="h-10 text-[10px]">
                    Cancelar
                  </Button>
                  <Button 
                    onClick={handleSaveStats} 
                    disabled={manualSaving}
                    className="h-10 text-[10px] bg-primary border-none"
                  >
                    {manualSaving ? 'Guardando...' : 'Guardar Reporte Táctico'}
                  </Button>
                </div>
              </div>
            ) : (
              /* --- MÉTODO EA SPORTS API (NUEVO & PREMIUM) --- */
              <div className="space-y-6">
                
                {/* Cargando */}
                {eaLoading && (
                  <div className="flex flex-col items-center justify-center py-12 gap-3">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
                    <span className="text-xs font-bold tracking-widest text-primary uppercase animate-pulse">Sincronizando con EA Sports API...</span>
                  </div>
                )}

                {/* Error / Falta Club ID */}
                {!eaLoading && eaError && (
                  <div className="border border-amber-500/30 bg-amber-500/5 rounded-xl p-4 space-y-2">
                    <p className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                      ⚠️ No se pudo obtener la información de EA Sports
                    </p>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      {eaError}
                    </p>
                    <div className="text-[10px] text-amber-500 font-semibold bg-amber-500/10 p-2.5 rounded-lg">
                      💡 Asegúrate de que ambos clubes tengan registrado su <strong>ID de Club de EA</strong> en la Oficina de su sede antes de reportar.
                    </div>
                  </div>
                )}

                {/* Lista de partidos de EA */}
                {!eaLoading && !eaError && eaMatches.length === 0 && (
                  <div className="text-center py-12 border border-dashed border-border/50 rounded-2xl bg-muted/10 space-y-2">
                    <div className="text-3xl">🎮</div>
                    <p className="text-xs font-bold text-foreground">Sin encuentros amistosos encontrados</p>
                    <p className="text-[10px] text-muted-foreground max-w-xs mx-auto">
                      No hay partidos de tipo "Amistoso" recientes en los servidores de EA para los ID de club indicados.
                    </p>
                  </div>
                )}

                {!eaLoading && !eaError && eaMatches.length > 0 && (
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] text-muted-foreground font-black uppercase tracking-wider block">
                        Selecciona el partido correspondiente de la lista de EA Sports:
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

                              
                              // Asignar determinando quién es quién
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
                          { value: '', label: 'Seleccionar partido reciente...' },
                          ...eaMatches.map(m => {
                            const keys = Object.keys(m.clubs || {});
                            const clubA = m.clubs[keys[0]]?.details?.name || 'Club A';
                            const clubB = m.clubs[keys[1]]?.details?.name || 'Club B';
                            const goalsA = m.clubs[keys[0]]?.goals || '0';
                            const goalsB = m.clubs[keys[1]]?.goals || '0';
                            const timeAgo = m.timeAgo ? `${m.timeAgo.number} ${m.timeAgo.unit} ago` : 'Reciente';
                            return {
                              value: m.matchId,
                              label: `🎮 ${clubA} ${goalsA} - ${goalsB} ${clubB} (${timeAgo})`
                            };
                          })
                        ]}
                      />
                    </div>

                    {selectedEaMatchId && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border border-border/40 bg-muted/10 rounded-xl p-4 animate-fade-in">
                        <div className="space-y-1">
                          <label className="text-[9px] text-muted-foreground font-black uppercase tracking-wider block">
                            Mapear ID Club Local (EA: {selectedMatch.local.nombre})
                          </label>
                          <input
                            type="text"
                            className="w-full h-10 px-3 text-xs rounded-lg bg-background border border-border/60 focus:border-primary font-mono"
                            value={eaClubLocalId}
                            onChange={(e) => setEaClubLocalId(e.target.value)}
                            placeholder="Ej: 50846"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] text-muted-foreground font-black uppercase tracking-wider block">
                            Mapear ID Club Visitante (EA: {selectedMatch.visitante.nombre})
                          </label>
                          <input
                            type="text"
                            className="w-full h-10 px-3 text-xs rounded-lg bg-background border border-border/60 focus:border-primary font-mono"
                            value={eaClubVisitanteId}
                            onChange={(e) => setEaClubVisitanteId(e.target.value)}
                            placeholder="Ej: 1978233"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Warnings de Jugadores No Registrados / Desalineados */}
                {eaWarnings && (
                  <div className="border border-red-500/30 bg-red-500/5 rounded-xl p-4 space-y-3 animate-fade-in text-left">
                    <p className="text-xs font-bold text-red-400 flex items-center gap-1.5 uppercase font-display tracking-wide">
                      🚨 Advertencia de Inscripción de Jugadores
                    </p>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      Los siguientes jugadores que participaron en el encuentro de EA Sports no están inscritos correctamente en el sistema:
                    </p>
                    
                    <ul className="text-[10px] space-y-1.5 font-mono bg-black/35 p-3 rounded-lg divide-y divide-white/5 max-h-36 overflow-y-auto">
                      {eaWarnings.map((w, idx) => (
                        <li key={idx} className="pt-1.5 first:pt-0 flex flex-col sm:flex-row sm:justify-between gap-1">
                          <span className="text-primary font-black uppercase">{w.playername} ({w.club})</span>
                          <span className="text-destructive/90 italic font-sans text-right">{w.reason}</span>
                        </li>
                      ))}
                    </ul>

                    <p className="text-[10px] text-yellow-500 font-semibold leading-relaxed">
                      💡 Hablar con un administrador u organizador para actualizar este tema, de lo contrario el equipo rival puede reclamar los puntos por no jugar en las condiciones pactadas.
                    </p>

                    <div className="flex justify-end pt-1.5 border-t border-border/20">
                      <Button 
                        size="sm"
                        onClick={() => handleEaReportSubmit(true)}
                        className="h-8 text-[9px] uppercase tracking-wider font-black bg-gradient-to-r from-red-600 to-amber-600 text-white border-none shadow-md hover:shadow-red-900/40"
                      >
                        Reportar de todas formas
                      </Button>
                    </div>
                  </div>
                )}

                {/* Botones de acción */}
                <div className="flex gap-2 justify-end pt-3">
                  <Button onClick={() => setIsStatsModalOpen(false)} variant="outline" className="h-10 text-[10px]">
                    Cancelar
                  </Button>
                  <Button 
                    onClick={() => handleEaReportSubmit(false)}
                    isLoading={eaProcessing}
                    disabled={!selectedEaMatchId || eaLoading || eaWarnings !== null}
                    className="h-10 text-[10px] bg-gradient-to-r from-primary to-destructive text-primary-foreground border-none font-display font-black uppercase tracking-widest shadow-lg"
                  >
                    ⚽ Procesar Reporte EA Sports
                  </Button>
                </div>

              </div>
            )}

          </div>
        </div>
      )}

      {/* Modal de Mismatch de Clubes EA Sports */}
      <Modal
        isOpen={eaMismatchModal !== null}
        onClose={() => setEaMismatchModal(null)}
        title="⚠️ Discrepancia de Clubes EA Sports"
        maxWidth="max-w-lg"
        zIndex="z-[130]"
      >
        <div className="space-y-4">
          <div className="p-3 bg-destructive/10 border border-destructive/30 rounded-xl">
            <p className="text-xs text-destructive-foreground font-semibold leading-relaxed">
              Los clubes detectados en el partido de EA Sports no corresponden con los clubes del partido oficial programado. Por favor, selecciona el partido correcto o verifica los IDs en la configuración.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Partido Programado Oficial */}
            <div className="space-y-2.5 p-3 rounded-xl bg-card border border-border/45">
              <h4 className="text-[10px] font-black text-primary uppercase tracking-wider border-b border-border/20 pb-1">
                📌 Partido Programado (DB)
              </h4>
              <div className="space-y-1.5 text-xs">
                <div>
                  <span className="text-[9px] text-muted-foreground block uppercase font-bold">Local</span>
                  <span className="font-bold text-foreground truncate block">{eaMismatchModal?.expectedLocal}</span>
                  <code className="block text-[10px] text-primary/80 font-mono mt-0.5">ID EA: {eaMismatchModal?.expectedLocalId || 'Sin ID'}</code>
                </div>
                <div className="pt-1.5 border-t border-border/10">
                  <span className="text-[9px] text-muted-foreground block uppercase font-bold">Visitante</span>
                  <span className="font-bold text-foreground truncate block">{eaMismatchModal?.expectedVisitante}</span>
                  <code className="block text-[10px] text-primary/80 font-mono mt-0.5">ID EA: {eaMismatchModal?.expectedVisitanteId || 'Sin ID'}</code>
                </div>
              </div>
            </div>

            {/* Partido Detectado en EA */}
            <div className="space-y-2.5 p-3 rounded-xl bg-muted/10 border border-border/45">
              <h4 className="text-[10px] font-black text-amber-500 uppercase tracking-wider border-b border-border/20 pb-1">
                🎮 Detectado en EA Sports
              </h4>
              <div className="space-y-1.5 text-xs">
                <div>
                  <span className="text-[9px] text-muted-foreground block uppercase font-bold">Club A</span>
                  <span className="font-bold text-amber-400 truncate block">{eaMismatchModal?.receivedLocal}</span>
                  <code className="block text-[10px] text-amber-500/80 font-mono mt-0.5">ID EA: {eaMismatchModal?.receivedLocalId}</code>
                </div>
                <div className="pt-1.5 border-t border-border/10">
                  <span className="text-[9px] text-muted-foreground block uppercase font-bold">Club B</span>
                  <span className="font-bold text-amber-400 truncate block">{eaMismatchModal?.receivedVisitante}</span>
                  <code className="block text-[10px] text-amber-500/80 font-mono mt-0.5">ID EA: {eaMismatchModal?.receivedVisitanteId}</code>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Button 
              onClick={() => setEaMismatchModal(null)} 
              className="px-4 py-2 text-xs bg-muted/30 border border-border/60 hover:bg-muted text-foreground font-bold rounded-lg transition-all"
            >
              Entendido
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal de Notificaciones y Advertencias Personalizado */}
      <Modal
        isOpen={notification !== null}
        onClose={() => setNotification(null)}
        title={notification?.title || "Notificación"}
        maxWidth="max-w-md"
        zIndex="z-[140]"
      >
        <div className="space-y-4">
          <div className={`p-4 rounded-xl border flex gap-3 ${
            notification?.type === 'error'
              ? 'bg-destructive/10 border-destructive/30 text-destructive-foreground'
              : notification?.type === 'success'
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                : notification?.type === 'confirm'
                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-500'
                  : 'bg-amber-500/10 border-amber-500/30 text-amber-400'
          }`}>
            <span className="text-xl shrink-0">
              {notification?.type === 'error' ? '❌' : notification?.type === 'success' ? '🎉' : '⚠️'}
            </span>
            <div className="space-y-1">
              <p className="text-xs font-semibold leading-relaxed whitespace-pre-wrap">
                {notification?.message}
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-border/20">
            {notification?.type === 'confirm' ? (
              <>
                <Button
                  variant="outline"
                  onClick={() => setNotification(null)}
                  className="h-9 px-4 text-[10px] uppercase font-bold tracking-wider cursor-pointer"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={() => {
                    const onConf = notification.onConfirm;
                    setNotification(null);
                    if (onConf) onConf();
                  }}
                  className="h-9 px-5 text-[10px] bg-primary hover:bg-primary/95 text-primary-foreground border-none shadow-md font-bold uppercase tracking-wider cursor-pointer"
                >
                  Confirmar
                </Button>
              </>
            ) : (
              <Button
                onClick={() => setNotification(null)}
                className="h-9 px-5 text-[10px] bg-primary hover:bg-primary/95 text-primary-foreground border-none shadow-md font-bold uppercase tracking-wider cursor-pointer"
              >
                Entendido
              </Button>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
}

