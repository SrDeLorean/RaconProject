import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useCompetenciaDetalle } from '../hooks/useCompetenciaDetalle';
import api from '@/api/axios';
import Modal from '@/components/ui/Modal';

import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';

import PageHelp from '@/components/shared/PageHelp';
import Alert from '@/components/shared/Alert';
import MatchmakerCalendario from './components/MatchmakerCalendario';

export default function CompetenciaDetalle() {
  const { id } = useParams(); // Obtenemos el ID de la URL
  const navigate = useNavigate();
  const { data, ui, actions } = useCompetenciaDetalle(id);
  
  // Pestañas internas del Dashboard del Torneo
  const [activeTab, setActiveTab] = useState('roster');

  const [isFinalizeModalOpen, setIsFinalizeModalOpen] = useState(false);
  const [podio, setPodio] = useState({ campeon_id: '', subcampeon_id: '', tercer_lugar_id: '' });

  const [selectedEquipoForExit, setSelectedEquipoForExit] = useState(null);
  const [isExitModalOpen, setIsExitModalOpen] = useState(false);
  const [replacingEquipoId, setReplacingEquipoId] = useState('');
  const [replaceSearchQuery, setReplaceSearchQuery] = useState('');
  const [availableForReplace, setAvailableForReplace] = useState([]);

  useEffect(() => {
    if (isExitModalOpen) {
      api.get(`/competencias/${id}/equipos/disponibles`, { params: { search: replaceSearchQuery } })
        .then(res => setAvailableForReplace(res.data))
        .catch(err => console.error(err));
    }
  }, [id, replaceSearchQuery, isExitModalOpen]);

  const handleConfirmFinalize = async () => {
    if (!podio.campeon_id || !podio.subcampeon_id) {
      alert('Debes seleccionar al menos el Campeón y el Subcampeón para finalizar la competencia.');
      return;
    }
    await actions.finalizarCompetencia(podio);
    setIsFinalizeModalOpen(false);
  };

  if (ui.isFetchingInfo) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!data.competencia) {
    return (
      <div className="p-8 text-center flex flex-col items-center gap-4">
        <h2 className="text-xl font-bold text-foreground">Torneo no encontrado</h2>
        <Button onClick={() => navigate('/organizador/competencias')}>Volver al listado</Button>
      </div>
    );
  }

  const { competencia } = data;
  const maxCupos = competencia.max_participantes || 0;
  const cuposActuales = data.equiposInscritos.length;
  const estaLleno = cuposActuales >= maxCupos;

  const totalPartidos = competencia.partidos?.length || 0;
  const partidosJugados = competencia.partidos?.filter(p => p.goles_local !== null && p.goles_visitante !== null).length || 0;
  const partidosPendientes = totalPartidos - partidosJugados;
  const progresoPorcentaje = totalPartidos > 0 ? Math.round((partidosJugados / totalPartidos) * 100) : 0;

  const getStatusBadge = (estado) => {
    switch (estado) {
      case 'finalizada':
        return { variant: 'success', label: '🏁 Finalizado' };
      case 'en_curso':
        return { variant: 'primary', label: '⚽ En Curso' };
      case 'inscripciones':
        return { variant: 'brand', label: '📝 Inscripciones Abiertas' };
      case 'borrador':
      default:
        return { variant: 'neutral', label: '🛠️ Borrador' };
    }
  };

  const statusBadge = getStatusBadge(competencia.estado);

  return (
    <div className="flex flex-col gap-6 animate-fade-in relative">
      {ui.notification && (
        <Alert variant={ui.notification.variant} className="fixed top-24 right-8 z-[110] shadow-lg max-w-sm" onClose={() => actions.setNotification(null)}>
          {ui.notification.text}
        </Alert>
      )}

      {/* HEADER DEL DASHBOARD DE LA COMPETENCIA */}
      <div className="flex flex-col gap-4">
        <button 
          onClick={() => navigate('/organizador/competencias')} 
          className="text-xs font-bold text-muted-foreground hover:text-foreground transition-colors uppercase tracking-widest flex items-center gap-1 w-fit"
        >
          ← Volver a Divisiones
        </button>

        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-border/50 pb-6">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="w-5 h-5 rounded-full border border-border/50 shadow-sm" style={{ backgroundColor: competencia.color_tema || '#ef4444' }} />
              <Badge variant={statusBadge.variant} className="uppercase font-semibold">
                {statusBadge.label}
              </Badge>
              <Badge variant="brand" className="uppercase font-mono text-[10px]">{cuposActuales}/{maxCupos} Cupos</Badge>
            </div>
            <h1 className="text-3xl font-display font-black text-foreground uppercase tracking-wide">
              {competencia.nombre}
            </h1>
            <p className="text-sm text-muted-foreground mt-1 font-sans">
              Modo: <strong className="text-foreground uppercase">{competencia.formato}</strong> • Plataforma: <strong className="text-foreground uppercase">{competencia.plataforma}</strong>
            </p>
          </div>
          {competencia.estado === 'en_curso' && (
            <Button
              onClick={() => setIsFinalizeModalOpen(true)}
              className="bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-400 hover:to-amber-500 text-black font-display font-black uppercase shadow-lg h-11 px-6 tracking-wider shrink-0"
            >
              🏆 Finalizar División
            </Button>
          )}
        </div>

        {/* METRICAS Y CONFIGURACION RAPIDA */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* CONFIGURACIÓN */}
          <div className="bg-card/20 backdrop-blur-md border border-border/40 p-5 rounded-2xl flex flex-col justify-between hover:border-primary/20 transition-all duration-300 shadow-lg relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full blur-2xl pointer-events-none"></div>
            <div className="space-y-3 relative z-10">
              <span className="text-[10px] font-bold tracking-widest text-primary uppercase block">Reglas y Sistema</span>
              <div className="grid grid-cols-2 gap-4 text-xs font-sans">
                <div>
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wider block">Formato</span>
                  <span className="font-bold text-foreground uppercase">{competencia.formato}</span>
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wider block">Plataforma</span>
                  <span className="font-bold text-foreground uppercase">{competencia.plataforma}</span>
                </div>
              </div>
              {competencia.config && (
                <div className="border-t border-border/30 pt-3 mt-3 grid grid-cols-2 gap-y-3 gap-x-4 text-xs font-mono">
                  {competencia.formato === 'copa' && (
                    <>
                      <div>
                        <span className="text-[9px] text-muted-foreground uppercase block">Grupos</span>
                        <strong className="text-foreground">{competencia.config.cantidad_grupos || 1}</strong>
                      </div>
                      <div>
                        <span className="text-[9px] text-muted-foreground uppercase block">Clasifican</span>
                        <strong className="text-foreground">Top {competencia.config.clasificados_por_grupo || 2}</strong>
                      </div>
                    </>
                  )}
                  {competencia.formato === 'liga' && (
                    <div>
                      <span className="text-[9px] text-muted-foreground uppercase block">Playoffs</span>
                      <strong className="text-foreground">{competencia.config.clasificados_por_grupo ? `Top ${competencia.config.clasificados_por_grupo}` : 'Sin Playoffs'}</strong>
                    </div>
                  )}
                  <div>
                    <span className="text-[9px] text-muted-foreground uppercase block">Modo Playoff</span>
                    <strong className="text-foreground">{competencia.config.modo_playoff === 'doble' ? 'Ida y Vuelta' : 'Solo Ida'}</strong>
                  </div>
                  <div>
                    <span className="text-[9px] text-muted-foreground uppercase block">Auto-avance</span>
                    <strong className={competencia.config.auto_avanzar_fase ? 'text-primary font-bold' : 'text-foreground font-normal'}>
                      {competencia.config.auto_avanzar_fase ? 'Activo' : 'Manual'}
                    </strong>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* RENDIMIENTO Y PROGRESO DE PARTIDOS */}
          <div className="lg:col-span-2 bg-card/20 backdrop-blur-md border border-border/40 p-5 rounded-2xl flex flex-col justify-between hover:border-primary/20 transition-all duration-300 shadow-lg relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl pointer-events-none"></div>
            <div className="space-y-4 w-full relative z-10">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-bold tracking-widest text-primary uppercase">Progreso de la Competición</span>
                <span className="font-mono text-xs text-muted-foreground font-bold">{partidosJugados} / {totalPartidos} Partidos Jugados</span>
              </div>
              
              <div className="w-full bg-muted/40 h-3 rounded-full overflow-hidden border border-border/50 p-0.5 mt-2">
                <div 
                  className="h-full rounded-full transition-all duration-500 shadow-md"
                  style={{ 
                    width: `${progresoPorcentaje}%`, 
                    backgroundColor: competencia.color_tema || '#ef4444', 
                    boxShadow: `0 0 10px ${competencia.color_tema || '#ef4444'}88` 
                  }}
                />
              </div>

              <div className="grid grid-cols-3 gap-4 text-center mt-2 pt-2 border-t border-border/30 font-sans">
                <div>
                  <span className="text-[9px] text-muted-foreground block uppercase font-mono tracking-widest">Jugados</span>
                  <span className="text-xl font-display font-black text-foreground font-mono">{partidosJugados}</span>
                </div>
                <div>
                  <span className="text-[9px] text-muted-foreground block uppercase font-mono tracking-widest">Pendientes</span>
                  <span className="text-xl font-display font-black text-foreground font-mono">{partidosPendientes}</span>
                </div>
                <div>
                  <span className="text-[9px] text-muted-foreground block uppercase font-mono tracking-widest font-bold text-primary">Completado</span>
                  <span className="text-xl font-display font-black text-primary font-mono">{progresoPorcentaje}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* NAVEGACIÓN INTERNA (PREPARADA PARA ESCALAR) */}
        <div className="flex gap-2 bg-muted/30 p-1.5 rounded-lg border border-border/40 w-fit">
          <button 
            onClick={() => setActiveTab('roster')}
            className={`px-4 py-2 rounded-md text-xs font-bold transition-colors cursor-pointer ${activeTab === 'roster' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
          >
            👥 Roster de Equipos
          </button>
          <button 
            onClick={() => setActiveTab('calendario')}
            className={`px-4 py-2 rounded-md text-xs font-bold transition-colors cursor-pointer ${activeTab === 'calendario' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
          >
            📅 Calendario y Fixture
          </button>
        </div>
      </div>

      {/* PODIO DE HONOR Y LÍDERES SI ESTÁ FINALIZADA */}
      {competencia.estado === 'finalizada' && (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 animate-fade-in">
          {/* PANEL DEL PODIO */}
          <div className="xl:col-span-1 bg-gradient-to-br from-yellow-500/15 via-background to-amber-600/5 border border-yellow-500/30 rounded-2xl p-6 shadow-xl relative overflow-hidden flex flex-col justify-between gap-6 min-h-[220px]">
            <div className="absolute -right-10 -bottom-10 opacity-10 text-yellow-500 font-display font-black text-8xl pointer-events-none select-none">
              HALL
            </div>
            <div className="space-y-1 text-left relative z-10">
              <span className="text-[10px] font-bold tracking-widest text-yellow-500 uppercase">Salón de la Fama</span>
              <h2 className="text-2xl font-display font-black uppercase text-foreground">🏁 Podio Oficial</h2>
              <p className="text-xs text-muted-foreground">Esta división ha concluido y el cuadro de honor ha sido inmortalizado.</p>
            </div>
            
            <div className="flex gap-4 justify-center items-end py-2 relative z-10">
              {/* SUB-CAMPEÓN */}
              <div className="flex flex-col items-center gap-2">
                <div className="text-slate-300 font-black text-xs font-mono">2ND</div>
                <div className="w-16 h-16 rounded-xl bg-slate-800/80 border border-slate-400/30 flex items-center justify-center font-display font-black text-slate-300 shadow-md text-lg hover:scale-105 transition-transform duration-300">
                  {competencia.subcampeon?.abreviatura || '2ND'}
                </div>
                <span className="text-[10px] font-bold max-w-[90px] truncate text-center text-slate-300">
                  {competencia.subcampeon?.nombre || 'Subcampeón'}
                </span>
              </div>
              {/* CAMPEÓN */}
              <div className="flex flex-col items-center gap-2 transform -translate-y-2">
                <div className="text-yellow-400 font-black text-sm font-mono flex items-center gap-1 animate-bounce">
                  👑 1ST
                </div>
                <div className="w-20 h-20 rounded-xl bg-yellow-500/20 border-2 border-yellow-400 flex items-center justify-center font-display font-black text-yellow-400 shadow-xl shadow-yellow-500/10 text-2xl hover:scale-105 transition-transform duration-300">
                  {competencia.campeon?.abreviatura || '🏆'}
                </div>
                <span className="text-xs font-black max-w-[110px] truncate text-center text-yellow-400 font-sans">
                  {competencia.campeon?.nombre || 'Campeón'}
                </span>
              </div>
              {/* TERCER LUGAR */}
              <div className="flex flex-col items-center gap-2">
                <div className="text-amber-600 font-black text-xs font-mono">3RD</div>
                <div className="w-14 h-14 rounded-xl bg-amber-900/20 border border-amber-600/30 flex items-center justify-center font-display font-black text-amber-500 shadow-md text-base hover:scale-105 transition-transform duration-300">
                  {competencia.tercer_lugar?.abreviatura || '3RD'}
                </div>
                <span className="text-[10px] font-bold max-w-[80px] truncate text-center text-amber-500">
                  {competencia.tercer_lugar?.nombre || '3er Lugar'}
                </span>
              </div>
            </div>
          </div>

          {/* PANEL DE LIDERES ESTADISTICOS */}
          <div className="xl:col-span-2 bg-card/25 border border-border/40 rounded-2xl p-6 shadow-xl flex flex-col justify-between gap-4">
            <div>
              <span className="text-[10px] font-bold tracking-widest text-primary uppercase block">Estadísticas Oficiales</span>
              <h3 className="text-lg font-display font-black uppercase text-foreground">⭐ Líderes del Torneo</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* GOLEADORES */}
              <div className="bg-background/40 border border-border/20 rounded-xl p-3.5 space-y-3">
                <span className="text-[9px] font-bold text-primary tracking-wider uppercase block border-b border-border/10 pb-1">⚽ Goleadores</span>
                <div className="space-y-2">
                  {competencia.top_stats?.goleadores?.length > 0 ? (
                    competencia.top_stats.goleadores.map((p, idx) => (
                      <div key={p.id || idx} className="flex justify-between items-center text-xs">
                        <div className="flex items-center gap-2 truncate">
                          <span className="font-mono text-muted-foreground">{idx + 1}.</span>
                          <span className="font-bold text-foreground truncate max-w-[90px]">{p.gamertag || p.name}</span>
                        </div>
                        <span className="font-mono font-bold text-primary shrink-0">{p.total} G</span>
                      </div>
                    ))
                  ) : (
                    <span className="text-[10px] text-muted-foreground block italic">Sin registros</span>
                  )}
                </div>
              </div>
              
              {/* ASISTENTES */}
              <div className="bg-background/40 border border-border/20 rounded-xl p-3.5 space-y-3">
                <span className="text-[9px] font-bold text-emerald-400 tracking-wider uppercase block border-b border-border/10 pb-1">🎯 Asistentes</span>
                <div className="space-y-2">
                  {competencia.top_stats?.asistentes?.length > 0 ? (
                    competencia.top_stats.asistentes.map((p, idx) => (
                      <div key={p.id || idx} className="flex justify-between items-center text-xs">
                        <div className="flex items-center gap-2 truncate">
                          <span className="font-mono text-muted-foreground">{idx + 1}.</span>
                          <span className="font-bold text-foreground truncate max-w-[90px]">{p.gamertag || p.name}</span>
                        </div>
                        <span className="font-mono font-bold text-emerald-400 shrink-0">{p.total} A</span>
                      </div>
                    ))
                  ) : (
                    <span className="text-[10px] text-muted-foreground block italic">Sin registros</span>
                  )}
                </div>
              </div>

              {/* MVPS */}
              <div className="bg-background/40 border border-border/20 rounded-xl p-3.5 space-y-3">
                <span className="text-[9px] font-bold text-yellow-400 tracking-wider uppercase block border-b border-border/10 pb-1">⭐ Valoración (MVP)</span>
                <div className="space-y-2">
                  {competencia.top_stats?.mvps?.length > 0 ? (
                    competencia.top_stats.mvps.map((p, idx) => (
                      <div key={p.id || idx} className="flex justify-between items-center text-xs">
                        <div className="flex items-center gap-2 truncate">
                          <span className="font-mono text-muted-foreground">{idx + 1}.</span>
                          <span className="font-bold text-foreground truncate max-w-[90px]">{p.gamertag || p.name}</span>
                        </div>
                        <span className="font-mono font-bold text-yellow-400 shrink-0">{Number(p.total).toFixed(1)} ⭐</span>
                      </div>
                    ))
                  ) : (
                    <span className="text-[10px] text-muted-foreground block italic">Sin registros</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE FINALIZACIÓN */}
      {isFinalizeModalOpen && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-[150] flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-background border border-border/80 w-full max-w-md rounded-2xl p-6 shadow-2xl flex flex-col gap-5">
            <div>
              <h3 className="text-lg font-display font-black text-foreground uppercase tracking-wide">🏆 Clausurar División</h3>
              <p className="text-xs text-muted-foreground mt-1">Selecciona los equipos del podio oficial de honor para declarar el cierre definitivo de la competencia.</p>
            </div>

            <div className="flex flex-col gap-4">
              <Select
                label="👑 1er Lugar (Campeón)"
                value={podio.campeon_id}
                onChange={(e) => setPodio({ ...podio, campeon_id: e.target.value })}
                options={[
                  { value: '', label: 'Seleccionar campeón...' },
                  ...data.equiposInscritos.map(eq => ({ value: eq.id, label: eq.nombre }))
                ]}
              />
              <Select
                label="🥈 2do Lugar (Subcampeón)"
                value={podio.subcampeon_id}
                onChange={(e) => setPodio({ ...podio, subcampeon_id: e.target.value })}
                options={[
                  { value: '', label: 'Seleccionar subcampeón...' },
                  ...data.equiposInscritos.map(eq => ({ value: eq.id, label: eq.nombre }))
                ]}
              />
              <Select
                label="🥉 3er Lugar (Tercer puesto)"
                value={podio.tercer_lugar_id}
                onChange={(e) => setPodio({ ...podio, tercer_lugar_id: e.target.value })}
                options={[
                  { value: '', label: 'Seleccionar tercero...' },
                  ...data.equiposInscritos.map(eq => ({ value: eq.id, label: eq.nombre }))
                ]}
              />
            </div>

            <div className="flex gap-3 mt-2">
              <Button variant="outline" className="flex-1" onClick={() => setIsFinalizeModalOpen(false)}>Cancelar</Button>
              <Button 
                onClick={handleConfirmFinalize}
                className="flex-1 bg-gradient-to-r from-yellow-500 to-amber-600 text-black font-display font-bold uppercase tracking-wider"
              >
                Confirmar y Cerrar
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================= */}
      {/* VISTA: ROSTER DE EQUIPOS                  */}
      {/* ========================================= */}
      {activeTab === 'roster' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          
          {/* PANEL IZQUIERDO: MERCADO Y BÚSQUEDA */}
          <div className="lg:col-span-1 bg-muted/20 p-5 rounded-xl border border-border/50 shadow-sm flex flex-col gap-4 sticky top-24">
            <div>
              <h3 className="text-sm font-bold text-foreground">Inscribir Nuevo Club</h3>
              <p className="text-xs text-muted-foreground mt-1">Busca equipos registrados en el sistema global para asignarlos a esta división.</p>
            </div>
            
            <Input 
              placeholder="Buscar por nombre o TAG..." 
              value={data.searchTerm} 
              onChange={(e) => actions.setSearchTerm(e.target.value)}
              disabled={estaLleno}
            />

            <div className="bg-background border border-border/50 rounded-lg max-h-64 overflow-y-auto shadow-inner">
              {ui.isSearching ? (
                <div className="p-4 text-center text-xs text-muted-foreground font-bold uppercase animate-pulse">Buscando...</div>
              ) : data.equiposDisponibles.length === 0 ? (
                <div className="p-4 text-center text-xs text-muted-foreground">No hay resultados.</div>
              ) : (
                data.equiposDisponibles.map(equipo => (
                  <div key={equipo.id} className="flex justify-between items-center p-3 border-b border-border/30 last:border-0 hover:bg-muted/50 transition-colors">
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-foreground">{equipo.nombre}</span>
                      <span className="text-[10px] text-muted-foreground uppercase font-mono tracking-widest">{equipo.abreviatura}</span>
                    </div>
                    <Button size="sm" className="h-7 px-3 text-[10px] bg-foreground text-background" onClick={() => actions.asignarEquipo(equipo.id)} disabled={estaLleno}>
                      Inscribir
                    </Button>
                  </div>
                ))
              )}
            </div>
            {estaLleno && (
              <p className="text-xs text-destructive font-bold text-center bg-destructive/10 p-2 rounded-lg">
                Se ha alcanzado el límite de cupos ({maxCupos}).
              </p>
            )}
          </div>

          {/* PANEL DERECHO: EQUIPOS INSCRITOS */}
          <div className="lg:col-span-2 bg-background p-1 rounded-xl">
            <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-widest mb-4 px-1 border-b border-border/50 pb-2">
              Clubes Oficiales de la División
            </h3>

            {ui.isFetchingEquipos ? (
              <div className="flex justify-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
              </div>
            ) : data.equiposInscritos.length === 0 ? (
              <div className="text-center p-12 border border-dashed border-border/60 rounded-xl bg-muted/10">
                <span className="text-muted-foreground text-sm font-bold uppercase tracking-wider">Aún no hay clubes en esta división</span>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3">
                {data.equiposInscritos.map(equipo => (
                  <div key={equipo.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 bg-background border border-border/60 rounded-xl shadow-sm gap-4 hover:border-primary/30 transition-colors">
                    
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center font-display font-black text-foreground border border-border/40 shrink-0 text-lg">
                        {equipo.abreviatura || 'FC'}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-base font-bold text-foreground">{equipo.nombre}</span>
                        <span className="text-[10px] text-muted-foreground uppercase tracking-widest mt-0.5">
                          Mánager: {equipo.capitan?.gamertag || equipo.capitan?.name || 'Sin Asignar'}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 w-full sm:w-auto mt-2 sm:mt-0">
                      <Select
                        value={equipo.pivot.estado_inscripcion}
                        onChange={(e) => actions.cambiarEstado(equipo.id, e.target.value)}
                        className="h-9 text-xs py-1 min-w-[130px] font-bold"
                        options={[
                          { value: 'aprobado', label: '✅ Aprobado' },
                          { value: 'pendiente', label: '⏳ En Revisión' },
                          { value: 'rechazado', label: '🚫 Rechazado' }
                        ]}
                      />
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="h-9 px-3 border-destructive/30 text-destructive hover:bg-destructive/10"
                        onClick={() => {
                          const hasMatches = competencia.partidos && competencia.partidos.length > 0;
                          if (hasMatches) {
                            setSelectedEquipoForExit(equipo);
                            setIsExitModalOpen(true);
                          } else {
                            if (window.confirm(`¿Expulsar a ${equipo.nombre} de la división?`)) {
                              actions.removerEquipo(equipo.id).catch(err => {
                                if (err.response?.status === 422) {
                                  setSelectedEquipoForExit(equipo);
                                  setIsExitModalOpen(true);
                                }
                              });
                            }
                          }
                        }}
                      >
                        Dar de Baja
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================= */}
      {/* VISTA: CALENDARIO Y MATCHMAKING           */}
      {/* ========================================= */}
      {activeTab === 'calendario' && (
        <MatchmakerCalendario 
          equipos={data.equiposInscritos} 
          competenciaId={competencia.id} 
          competencia={competencia} 
          onMatchesUpdated={actions.fetchCompetenciaInfo}
        />
      )}

      <PageHelp 
        title="Panel Profundo: Competición"
        description="Aquí administras el día a día de esta liga o torneo específico (11v11)."
        steps={[
          {
            title: "Auditoría de Inscritos",
            description: "En la pestaña 'Inscripciones', verás qué clubes quieren participar. Aprobarlos aquí los sumará automáticamente al fixture y consolidará sus contratos."
          },
          {
            title: "El Fixture (Calendario)",
            description: "Desde 'Partidos', puedes generar las jornadas y cruces. Los capitanes de cada equipo reportarán los resultados (y estadísticas) desde sus propios perfiles."
          },
          {
            title: "Control de Playoffs",
            description: "Si el formato es eliminatorio, asegúrate de crear los partidos con los nombres correctos en el campo de jornada (ej. 'Cuartos', 'Semifinal') para que el árbol visual se dibuje con éxito."
          }
        ]}
      />

      {/* MODAL GESTIONAR SALIDA DE EQUIPO (11v11) */}
      <Modal
        isOpen={isExitModalOpen}
        onClose={() => {
          setIsExitModalOpen(false);
          setSelectedEquipoForExit(null);
          setReplacingEquipoId('');
          setReplaceSearchQuery('');
        }}
        title={`Gestionar Salida de ${selectedEquipoForExit?.nombre || 'Club'}`}
        maxWidth="max-w-xl"
        zIndex="z-[140]"
      >
        <div className="flex flex-col gap-6 p-4">
          <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-4 flex flex-col gap-2">
            <span className="text-xs font-black text-destructive uppercase tracking-widest">⚠️ Alerta del Sistema</span>
            <p className="text-xs text-foreground/80 leading-relaxed font-sans">
              Este club ya tiene partidos agendados en el calendario oficial de esta división. Darlo de baja directamente rompería las estadísticas y el fixture. Por favor, selecciona una de las siguientes opciones:
            </p>
          </div>

          {/* OPCION 1: DAR WO */}
          <div className="border border-border/60 bg-muted/10 p-5 rounded-2xl flex flex-col gap-3 hover:border-primary/20 transition-colors">
            <div className="flex flex-col">
              <span className="text-sm font-bold text-foreground">Opción 1: Declarar Walkover (WO)</span>
              <span className="text-xs text-muted-foreground mt-1 font-sans">
                Todos los partidos de este club se registrarán automáticamente como derrotas por 0-3. El club permanecerá en el roster para evitar redundancias, pero no podrá reportar más resultados reales.
              </span>
            </div>
            <Button
              className="w-full bg-destructive/25 border border-destructive/40 hover:bg-destructive/35 text-destructive font-display font-black uppercase text-xs tracking-wider"
              onClick={async () => {
                if (window.confirm(`¿Estás seguro de declarar WO para todos los partidos de ${selectedEquipoForExit?.nombre}? Esta acción no se puede deshacer.`)) {
                  await actions.darWOEquipo(selectedEquipoForExit.id);
                  setIsExitModalOpen(false);
                  setSelectedEquipoForExit(null);
                }
              }}
            >
              Aplicar WO a todos los partidos
            </Button>
          </div>

          {/* OPCION 2: REEMPLAZAR EQUIPO */}
          <div className="border border-border/60 bg-muted/10 p-5 rounded-2xl flex flex-col gap-4 hover:border-primary/20 transition-colors">
            <div className="flex flex-col">
              <span className="text-sm font-bold text-foreground">Opción 2: Reemplazar por otro Club</span>
              <span className="text-xs text-muted-foreground mt-1 font-sans">
                Selecciona un club libre de la base de datos para que herede y ocupe el lugar de {selectedEquipoForExit?.nombre} en todos sus partidos del calendario. El club saliente será dado de baja.
              </span>
            </div>
            
            <div className="flex flex-col gap-3 mt-1">
              <Input
                placeholder="Buscar club de reemplazo..."
                value={replaceSearchQuery}
                onChange={(e) => setReplaceSearchQuery(e.target.value)}
              />

              <div className="bg-background border border-border/50 rounded-lg max-h-40 overflow-y-auto shadow-inner">
                {availableForReplace.length === 0 ? (
                  <div className="p-3 text-center text-xs text-muted-foreground">No hay clubes disponibles.</div>
                ) : (
                  availableForReplace.map(eq => (
                    <div
                      key={eq.id}
                      onClick={() => setReplacingEquipoId(eq.id)}
                      className={`flex justify-between items-center p-3 cursor-pointer border-b border-border/30 last:border-0 transition-colors ${
                        replacingEquipoId === eq.id ? 'bg-primary/15 text-primary font-bold' : 'hover:bg-muted/50'
                      }`}
                    >
                      <div className="flex flex-col">
                        <span className="text-xs font-bold">{eq.nombre}</span>
                        <span className="text-[9px] uppercase font-mono text-muted-foreground tracking-widest">{eq.abreviatura}</span>
                      </div>
                      {replacingEquipoId === eq.id && <span className="text-[10px] text-primary uppercase font-black font-display tracking-widest">Seleccionado</span>}
                    </div>
                  ))
                )}
              </div>
            </div>

            <Button
              disabled={!replacingEquipoId}
              className="w-full bg-primary text-primary-foreground font-display font-black uppercase text-xs tracking-wider"
              onClick={async () => {
                const targetClubName = availableForReplace.find(x => x.id === replacingEquipoId)?.nombre || 'el club seleccionado';
                if (window.confirm(`¿Reemplazar a ${selectedEquipoForExit?.nombre} por ${targetClubName} en todo el calendario?`)) {
                  await actions.reemplazarEquipo(selectedEquipoForExit.id, replacingEquipoId);
                  setIsExitModalOpen(false);
                  setSelectedEquipoForExit(null);
                  setReplacingEquipoId('');
                  setReplaceSearchQuery('');
                }
              }}
            >
              Confirmar Reemplazo en el Calendario
            </Button>
          </div>

          {/* OPCION 3: FORZAR ELIMINACION DIRECTA */}
          <div className="border border-border/60 bg-muted/10 p-5 rounded-2xl flex flex-col gap-3 hover:border-primary/20 transition-colors mt-2">
            <div className="flex flex-col">
              <span className="text-sm font-bold text-foreground">Opción 3: Forzar Eliminación Directa</span>
              <span className="text-xs text-muted-foreground mt-1 font-sans">
                El equipo será dado de baja y TODOS los partidos donde iba a participar serán eliminados del fixture. Esto puede descuadrar la tabla si el equipo ya había jugado.
              </span>
            </div>
            <Button
              className="w-full bg-red-900/40 border border-red-500/50 hover:bg-red-900/60 text-red-400 font-display font-black uppercase text-xs tracking-wider"
              onClick={async () => {
                if (window.confirm(`⚠️ ADVERTENCIA CRÍTICA: ¿Estás 100% seguro de FORZAR la eliminación de ${selectedEquipoForExit?.nombre}? Se borrarán TODOS sus partidos del sistema.`)) {
                  await actions.forzarRemoverEquipo(selectedEquipoForExit.id);
                  setIsExitModalOpen(false);
                  setSelectedEquipoForExit(null);
                }
              }}
            >
              Forzar Eliminación Definitiva
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}