import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '@/api/axios';
import PageLoader from '@/components/ui/PageLoader';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Alert from '@/components/shared/Alert';
import DataTable from '@/components/ui/DataTable';
import Badge from '@/components/ui/Badge';
import Card from '@/components/shared/Card';

export default function OrganizadorGestionPlantilla() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [equipo, setEquipo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Búsqueda y fichaje directo
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isAdding, setIsAdding] = useState(false);

  const fetchEquipo = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/equipos/${id}`);
      setEquipo(res.data);
    } catch (err) {
      setError('No se pudo cargar la información del equipo.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEquipo();
  }, [id]);

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      setSearchResults([]);
      return;
    }
    setIsSearching(true);
    try {
      const res = await api.get(`/usuarios?search=${encodeURIComponent(searchTerm)}`);
      // Adaptar según la paginación o estructura
      setSearchResults(res.data.data || res.data || []);
    } catch (err) {
      setError('Error al buscar usuarios.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleAddJugador = async (user) => {
    setIsAdding(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await api.post(`/equipos/${id}/roster`, {
        user_id: user.id,
        posicion: user.posicion || null, // Usar la posición predeterminada del jugador si existe, sino null
        dorsal: user.dorsal || null // Usar dorsal si el objeto usuario lo trae
      });
      setSuccess(res.data.message || 'Jugador fichado con éxito por administración.');
      setSearchTerm('');
      setSearchResults([]);
      fetchEquipo(); // Refrescar roster
    } catch (err) {
      setError(err.response?.data?.message || 'Error al agregar jugador al equipo.');
    } finally {
      setIsAdding(false);
    }
  };

  const handleRemoveJugador = async (userId) => {
    if (!window.confirm("¿Seguro que deseas remover a este jugador del equipo?")) return;
    try {
      const res = await api.delete(`/equipos/${id}/roster/${userId}`);
      setSuccess(res.data.message || 'Jugador removido del equipo.');
      fetchEquipo();
    } catch (err) {
      setError(err.response?.data?.message || 'Error al remover jugador.');
    }
  };

  if (loading && !equipo) {
    return <PageLoader />;
  }

  if (!equipo) {
    return (
      <div className="p-6">
        <Alert variant="error">Equipo no encontrado.</Alert>
        <Button onClick={() => navigate('/organizador/equipos')} className="mt-4">Volver</Button>
      </div>
    );
  }

  const columnasRoster = [
    {
      header: 'Jugador',
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold">
            {(row.gamertag || row.name || '?').charAt(0).toUpperCase()}
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-sm">{row.gamertag || 'SIN GAMERTAG'}</span>
            <span className="text-xs text-muted-foreground">{row.name}</span>
          </div>
        </div>
      )
    },
    {
      header: 'Posición / Dorsal',
      render: (row) => (
        <span className="text-xs font-mono uppercase">
          {row.posicion || 'N/A'} {row.dorsal ? `#${row.dorsal}` : ''}
        </span>
      )
    },
    {
      header: 'Estado',
      render: (row) => (
        <Badge variant={row.estado_fichaje === 'activo' ? 'success' : 'neutral'}>
          {row.estado_fichaje || 'Activo'}
        </Badge>
      )
    },
    {
      header: 'Acciones',
      render: (row) => (
        <Button
          variant="outline"
          size="sm"
          className="h-8 text-[10px] border-destructive/30 text-destructive hover:bg-destructive/10"
          onClick={() => handleRemoveJugador(row.id)}
        >
          Expulsar
        </Button>
      )
    }
  ];

  return (
    <div className="flex flex-col gap-6 animate-fade-in relative">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" onClick={() => navigate('/organizador/equipos')}>
          ← Volver
        </Button>
        <div>
          <h1 className="text-2xl font-black font-display uppercase tracking-wider text-foreground">
            Gestión de Plantilla: <span className="text-primary">{equipo.nombre}</span>
          </h1>
          <p className="text-sm text-muted-foreground">Administra los jugadores inscritos en este club.</p>
        </div>
      </div>

      {error && <Alert variant="error" onClose={() => setError(null)}>{error}</Alert>}
      {success && <Alert variant="success" onClose={() => setSuccess(null)}>{success}</Alert>}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Formulario de Búsqueda y Fichaje Directo */}
        <Card className="lg:col-span-1" padding="p-5" withGlow={true}>
          <h3 className="text-lg font-black uppercase text-foreground mb-4">Fichar Jugador</h3>
          <p className="text-xs text-muted-foreground mb-4">Busca a un jugador por su Gamertag o Nombre para agregarlo directamente sin necesidad de su aprobación.</p>
          
          <div className="flex gap-2 mb-4">
            <Input 
              placeholder="Buscar jugador..." 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)} 
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="flex-1"
            />
            <Button onClick={handleSearch} isLoading={isSearching}>
              Buscar
            </Button>
          </div>

          {searchResults.length > 0 && (
            <div className="space-y-3 mt-4 max-h-80 overflow-y-auto pr-2">
              <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Resultados:</h4>
              {searchResults.map(user => (
                <div key={user.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 p-3 bg-muted/20 border border-border/40 rounded-xl">
                  <div className="flex flex-col">
                    <span className="text-sm font-bold">{user.gamertag || 'Sin gamertag'}</span>
                    <span className="text-xs text-muted-foreground">{user.name}</span>
                  </div>
                  <Button 
                    size="sm" 
                    isLoading={isAdding}
                    onClick={() => handleAddJugador(user)}
                    className="h-8 text-[10px] uppercase font-black tracking-wider w-full sm:w-auto"
                  >
                    Fichar
                  </Button>
                </div>
              ))}
            </div>
          )}
          
          {searchResults.length === 0 && searchTerm && !isSearching && (
            <p className="text-xs text-muted-foreground mt-4 text-center">No se encontraron resultados.</p>
          )}
        </Card>

        {/* Tabla de Roster Actual */}
        <div className="lg:col-span-2">
          <DataTable
            title={`Plantilla Actual (${equipo.roster?.length || 0} Jugadores)`}
            columns={columnasRoster}
            data={equipo.roster || []}
            searchPlaceholder="Filtrar plantilla..."
            perPage={20}
          />
        </div>

      </div>
    </div>
  );
}
