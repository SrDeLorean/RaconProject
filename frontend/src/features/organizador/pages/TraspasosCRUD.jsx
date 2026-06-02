import React, { useState, useEffect, useMemo } from 'react';
import DataTable from '@/components/ui/DataTable';
import CrudHeader from '@/components/shared/CrudHeader';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Alert from '@/components/shared/Alert';
import Input from '@/components/ui/Input';
import api from '@/api/axios';

export default function TraspasosCRUD() {
  const [solicitudes, setSolicitudes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Filtros y Paginación
  const [activeTab, setActiveTab] = useState('pendiente_admin');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Estado para rechazo
  const [rejectingId, setRejectingId] = useState(null);
  const [observaciones, setObservaciones] = useState('');
  const [processingId, setProcessingId] = useState(null);

  const fetchSolicitudes = async () => {
    setLoading(true);
    setError(null);
    try {
      // tipo mapping to match the backend index filtering
      const res = await api.get(`/solicitudes-fichaje?tipo=${activeTab}`);
      setSolicitudes(res.data?.data || res.data || []);
    } catch (err) {
      console.error("Error al obtener solicitudes de traspaso:", err);
      setError("No se pudieron obtener las solicitudes de traspaso.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSolicitudes();
    setCurrentPage(1);
  }, [activeTab]);

  const handleDecision = async (id, respuesta, obsText = '') => {
    setProcessingId(id);
    setError(null);
    setSuccessMsg(null);
    try {
      const res = await api.post(`/solicitudes-fichaje/${id}/admin-decidir`, {
        respuesta,
        observaciones: obsText
      });
      setSuccessMsg(res.data.message || `Operación completada con éxito.`);
      setRejectingId(null);
      setObservaciones('');
      fetchSolicitudes();
    } catch (err) {
      console.error("Error al procesar decisión:", err);
      setError(err.response?.data?.message || "Ocurrió un error al procesar la solicitud.");
    } finally {
      setProcessingId(null);
    }
  };

  // 👥 Tabs adaptados a la gestión de traspasos
  const tabsConfig = useMemo(() => [
    { id: 'pendiente_admin', label: 'Pendientes Admin', icon: '⏳' },
    { id: 'pendiente_jugador', label: 'Pendientes Jugador', icon: '📝' },
    { id: 'aprobado', label: 'Aceptados', icon: '🟢' },
    { id: 'rechazado', label: 'Rechazados', icon: '🔴' },
    { id: 'todos', label: 'Todos los Registros', icon: '📊' },
  ], []);

  // Filtrar y buscar en memoria
  const filteredData = useMemo(() => {
    return solicitudes.filter(row => {
      if (!searchTerm.trim()) return true;
      const q = searchTerm.toLowerCase();
      const jugadorNom = row.jugador?.name?.toLowerCase() || '';
      const jugadorGam = row.jugador?.gamertag?.toLowerCase() || '';
      const equipoNom  = row.equipo?.nombre?.toLowerCase() || '';
      const orgNom     = row.organizacion?.nombre?.toLowerCase() || '';
      
      return jugadorNom.includes(q) || jugadorGam.includes(q) || equipoNom.includes(q) || orgNom.includes(q);
    });
  }, [solicitudes, searchTerm]);

  // Paginación manual en el cliente
  const paginatedData = useMemo(() => {
    const offset = (currentPage - 1) * itemsPerPage;
    return filteredData.slice(offset, offset + itemsPerPage);
  }, [filteredData, currentPage]);

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);

  // Columnas de la DataTable
  const columnas = useMemo(() => [
    {
      header: 'Jugador / Competidor',
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary/10 to-destructive/10 border border-primary/20 flex items-center justify-center font-display font-black text-xs text-primary shadow-inner shrink-0">
            ⚽
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-foreground text-sm uppercase">{row.jugador?.name || 'Jugador'}</span>
            {row.jugador?.gamertag && (
              <span className="text-[10px] font-mono text-primary font-bold">🎮 {row.jugador.gamertag}</span>
            )}
          </div>
        </div>
      )
    },
    {
      header: 'Detalles del Fichaje',
      render: (row) => (
        <div className="flex flex-col text-xs font-semibold">
          <span className="text-foreground uppercase">🛡️ {row.equipo?.nombre || 'Club'}</span>
          <span className="text-muted-foreground text-[10px]">
            Posición: {row.posicion || 'PO'} • Dorsal: <strong className="font-mono text-primary">#{row.dorsal || '??'}</strong>
          </span>
        </div>
      )
    },
    {
      header: 'Circuito / Organización',
      render: (row) => (
        <span className="text-[10px] bg-primary/10 text-primary border border-primary/20 font-bold px-2 py-0.5 rounded uppercase tracking-wider font-mono">
          🌐 {row.organizacion?.nombre || 'Organización'}
        </span>
      )
    },
    {
      header: 'Estado',
      render: (row) => {
        const est = row.estado;
        let variant = 'neutral';
        let label = est;
        if (est === 'aprobado') { variant = 'success'; label = 'Aprobado'; }
        else if (est === 'rechazado') { variant = 'error'; label = 'Rechazado'; }
        else if (est === 'pendiente_admin') { variant = 'warning'; label = 'Pendiente Admin'; }
        else if (est === 'pendiente_jugador') { variant = 'neutral'; label = 'Pendiente Jugador'; }
        
        return (
          <div className="flex flex-col gap-1 items-start">
            <Badge variant={variant}>{label}</Badge>
            {row.observaciones_admin && (
              <span className="text-[9px] text-muted-foreground/80 italic max-w-[150px] truncate" title={row.observaciones_admin}>
                💬 {row.observaciones_admin}
              </span>
            )}
          </div>
        );
      }
    },
    {
      header: 'Acciones Rápidas',
      render: (row) => {
        if (row.estado !== 'pendiente_admin') {
          return <span className="text-[10px] text-muted-foreground font-mono">Registro cerrado</span>;
        }

        if (rejectingId === row.id) {
          return (
            <div className="flex flex-col gap-2 p-1 min-w-[200px] animate-fade-in">
              <Input 
                type="text"
                placeholder="Motivo del rechazo..."
                value={observaciones}
                onChange={(e) => setObservaciones(e.target.value)}
                className="h-8 text-[10px]"
              />
              <div className="flex gap-1 justify-end">
                <Button 
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setRejectingId(null);
                    setObservaciones('');
                  }}
                  className="h-7 px-2 text-[9px]"
                >
                  Cancelar
                </Button>
                <Button 
                  size="sm"
                  className="h-7 px-2 text-[9px] bg-destructive text-white hover:bg-destructive/80 border-none"
                  onClick={() => handleDecision(row.id, 'rechazar', observaciones)}
                  disabled={!observaciones.trim() || processingId === row.id}
                >
                  Confirmar
                </Button>
              </div>
            </div>
          );
        }

        return (
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              className="h-8 px-2.5 text-[10px] bg-emerald-500 hover:bg-emerald-600 text-white border-none shadow-sm"
              onClick={() => handleDecision(row.id, 'aprobar')}
              isLoading={processingId === row.id}
              disabled={processingId !== null}
            >
              ✅ Autorizar
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-8 px-2.5 text-[10px] border-destructive/30 text-destructive hover:bg-destructive/10"
              onClick={() => setRejectingId(row.id)}
              disabled={processingId !== null}
            >
              ❌ Rechazar
            </Button>
          </div>
        );
      }
    }
  ], [processingId, rejectingId, observaciones]);

  return (
    <div className="flex flex-col gap-6 animate-fade-in relative">
      
      {successMsg && (
        <Alert variant="success" className="fixed top-24 right-8 z-[110] shadow-lg max-w-sm" onClose={() => setSuccessMsg(null)}>
          {successMsg}
        </Alert>
      )}

      {error && (
        <Alert variant="error" className="fixed top-24 right-8 z-[110] shadow-lg max-w-sm" onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <CrudHeader 
        title="Gestión de Traspasos"
        description="Autoriza o rechaza fichajes y traspasos en mercado cerrado."
        buttonText={null} // Sin botón de agregar porque solo es gestión
        tabs={tabsConfig}
        activeTab={activeTab}
        onTabChange={(tabId) => {
          setActiveTab(tabId);
          setSearchTerm('');
        }}
      />

      <div className="relative">
        {loading && solicitudes.length > 0 && (
          <div className="absolute inset-0 bg-background/50 backdrop-blur-sm z-30 flex items-center justify-center rounded-xl">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
          </div>
        )}

        <DataTable 
          title={`Lista de Traspasos (${filteredData.length})`}
          columns={columnas}
          data={paginatedData}
          searchPlaceholder="Buscar por jugador, club u organización..."
          onSearch={(value) => {
            setSearchTerm(value);
            setCurrentPage(1);
          }}
          currentPage={currentPage}
          totalPages={totalPages}
          totalRecords={filteredData.length}
          perPage={itemsPerPage}
          isLoading={loading && solicitudes.length === 0}
          onPageChange={(page) => setCurrentPage(page)}
        />
      </div>

    </div>
  );
}
