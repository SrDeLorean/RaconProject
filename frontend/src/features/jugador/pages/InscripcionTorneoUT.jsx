import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '@/api/axios';
import Card from '@/components/shared/Card';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Alert from '@/components/shared/Alert';
import PageHelp from '@/components/shared/PageHelp';

export default function InscripcionTorneoUT() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [competencia, setCompetencia] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notification, setNotification] = useState(null);

  // Form states
  const [nombreEquipo, setNombreEquipo] = useState('');
  const [clubIdEa, setClubIdEa] = useState('');
  const [idCompanero, setIdCompanero] = useState('');
  
  // Teammate search
  const [searchPartnerTerm, setSearchPartnerTerm] = useState('');
  const [partnersList, setPartnersList] = useState([]);
  const [isSearchingPartner, setIsSearchingPartner] = useState(false);
  const [selectedPartner, setSelectedPartner] = useState(null);

  const triggerNotification = (variant, text) => {
    setNotification({ variant, text });
    setTimeout(() => setNotification(null), 4500);
  };

  useEffect(() => {
    if (!id) return;
    const fetchCompetencia = async () => {
      try {
        const res = await api.get(`/competencias-ut/${id}`);
        const comp = res.data.data;
        setCompetencia(comp);
        
        // Default team name to player's name/gamertag if available
        try {
          const userRes = await api.get('/user');
          const me = userRes.data;
          setNombreEquipo(me.gamertag || me.name || '');
        } catch (e) {
          console.warn("No se pudo obtener información del usuario logueado para autocompletar.");
        }
      } catch (err) {
        console.error("Error al obtener torneo UT:", err);
        triggerNotification('error', 'No se pudo cargar la información del torneo.');
      } finally {
        setLoading(false);
      }
    };
    fetchCompetencia();
  }, [id]);

  // Search teammates
  const searchPartners = useCallback(async (query) => {
    if (!query) {
      setPartnersList([]);
      return;
    }
    setIsSearchingPartner(true);
    try {
      const response = await api.get('/users', { params: { search: query, per_page: 10 } });
      const users = response.data.data || response.data || [];
      // Filter out self
      setPartnersList(users);
    } catch (error) {
      console.error("Error al buscar compañeros:", error);
    } finally {
      setIsSearchingPartner(false);
    }
  }, []);

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      if (searchPartnerTerm && !selectedPartner) {
        searchPartners(searchPartnerTerm);
      }
    }, 400);
    return () => clearTimeout(delayDebounce);
  }, [searchPartnerTerm, selectedPartner, searchPartners]);

  const handleSelectPartner = (partner) => {
    setSelectedPartner(partner);
    setIdCompanero(partner.id);
    setSearchPartnerTerm(partner.name);
    setPartnersList([]);
  };

  const handleClearPartner = () => {
    setSelectedPartner(null);
    setIdCompanero('');
    setSearchPartnerTerm('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!competencia) return;
    
    if (competencia.tipo === '2vs2' && !idCompanero) {
      triggerNotification('error', 'Debes seleccionar un compañero para participar en 2vs2.');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        nombre_equipo: null,
        club_id_ea: clubIdEa || null,
        id_companero: competencia.tipo === '2vs2' ? idCompanero : null
      };

      await api.post(`/competencias-ut/${id}/inscribir`, payload);
      triggerNotification('success', '¡Inscripción realizada con éxito!');
      
      setTimeout(() => {
        navigate('/jugador/mis-equipos');
      }, 1500);
    } catch (err) {
      const msg = err.response?.data?.message || 'Error al completar la inscripción.';
      triggerNotification('error', msg);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!competencia) {
    return (
      <div className="pt-28 pb-16 text-center max-w-2xl mx-auto space-y-4 bg-background min-h-screen flex flex-col items-center justify-center">
        <h2 className="text-xl font-display font-black text-foreground uppercase">Torneo no disponible</h2>
        <Button onClick={() => navigate(-1)}>Volver atrás</Button>
      </div>
    );
  }

  const es2vs2 = competencia.tipo === '2vs2';
  const logoUrl = competencia.logo ? (competencia.logo.startsWith('http') ? competencia.logo : `${api.defaults.baseURL?.replace(/\/api$/, '')}/${competencia.logo}`) : null;

  return (
    <div className="relative min-h-screen bg-background pt-24 pb-16 overflow-hidden flex flex-col items-center justify-center">
      {/* Ambient glows */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/10 blur-[100px] rounded-full pointer-events-none z-0" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-[500px] h-[500px] bg-primary/5 blur-[100px] rounded-full pointer-events-none z-0" />

      {notification && (
        <Alert variant={notification.variant} className="fixed top-24 right-8 z-[110] shadow-lg max-w-sm" onClose={() => setNotification(null)}>
          {notification.text}
        </Alert>
      )}

      <div className="relative z-10 w-full max-w-2xl px-6">
        
        {/* Volver atrás */}
        <button 
          onClick={() => navigate(-1)} 
          className="text-xs font-bold text-muted-foreground hover:text-foreground transition-colors uppercase tracking-widest flex items-center gap-1 mb-4 cursor-pointer"
        >
          ← Regresar
        </button>

        <Card className="p-6 md:p-8 border border-border/50 backdrop-blur-md bg-card/25 shadow-2xl relative overflow-hidden" withGlow>
          
          <div className="flex items-center gap-4 border-b border-border/40 pb-5 mb-6">
            {logoUrl ? (
              <img src={logoUrl} alt={competencia.nombre} className="w-14 h-14 rounded-xl object-cover border border-border/40 shrink-0" />
            ) : (
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary/20 to-background border border-border/40 flex items-center justify-center font-display font-black text-primary text-xl shrink-0">
                {competencia.nombre?.charAt(0)}
              </div>
            )}
            <div>
              <div className="flex gap-2 mb-1">
                <Badge variant="brand" className="uppercase font-mono text-[9px] tracking-wider">{competencia.tipo}</Badge>
                <Badge variant="neutral" className="uppercase font-mono text-[9px] tracking-wider">{competencia.plataforma}</Badge>
              </div>
              <h2 className="text-xl font-display font-black text-foreground uppercase tracking-wide">{competencia.nombre}</h2>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-primary uppercase tracking-widest border-b border-border/30 pb-1.5">Datos de Registro</h3>
              
              <Input 
                label="EA Club ID (Opcional)" 
                placeholder="ID de Club virtual para sincronizar estadísticas" 
                value={clubIdEa} 
                onChange={(e) => setClubIdEa(e.target.value)} 
                disabled={saving}
              />
              <p className="text-[10px] text-muted-foreground -mt-2.5">
                💡 Al registrar tu <strong>Club ID de EA</strong>, el sistema obtendrá automáticamente tus partidos de Ultimate Team desde los servidores de EA.
              </p>
            </div>

            {es2vs2 && (
              <div className="space-y-4">
                <h3 className="text-xs font-bold text-primary uppercase tracking-widest border-b border-border/30 pb-1.5">Pareja de Juego</h3>
                
                <div className="space-y-2 relative">
                  <label className="text-[10px] text-muted-foreground font-black uppercase tracking-wider block">Buscar Compañero *</label>
                  
                  <div className="flex gap-2">
                    <Input 
                      placeholder="Busca por nombre o gamertag..." 
                      value={searchPartnerTerm} 
                      onChange={(e) => {
                        setSearchPartnerTerm(e.target.value);
                        if (selectedPartner) handleClearPartner();
                      }}
                      disabled={saving || !!selectedPartner}
                      className="flex-1"
                    />
                    {selectedPartner && (
                      <Button variant="outline" className="h-10 text-xs px-4" onClick={handleClearPartner} disabled={saving}>
                        Cambiar
                      </Button>
                    )}
                  </div>

                  {/* Resultados de búsqueda */}
                  {searchPartnerTerm && !selectedPartner && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-lg shadow-xl max-h-48 overflow-y-auto z-20">
                      {isSearchingPartner ? (
                        <div className="p-3 text-center text-xs text-muted-foreground uppercase tracking-widest animate-pulse font-bold">Buscando...</div>
                      ) : partnersList.length === 0 ? (
                        <div className="p-3 text-center text-xs text-muted-foreground">No se encontraron usuarios.</div>
                      ) : (
                        partnersList.map(partner => (
                          <div 
                            key={partner.id} 
                            onClick={() => handleSelectPartner(partner)}
                            className="p-3 border-b border-border/30 last:border-0 hover:bg-muted/50 transition-colors cursor-pointer flex flex-col"
                          >
                            <span className="text-sm font-bold text-foreground">{partner.name}</span>
                            <span className="text-[10px] text-muted-foreground font-mono">{partner.gamertag || 'Sin Gamertag'}</span>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* BOTONES */}
            <div className="flex gap-4 border-t border-border/40 pt-5 mt-2">
              <Button 
                variant="outline" 
                type="button"
                className="flex-1 h-11 border-border/60 text-foreground" 
                onClick={() => navigate(-1)} 
                disabled={saving}
              >
                Cancelar
              </Button>
              <Button 
                type="submit" 
                isLoading={saving}
                className="flex-1 h-11 bg-gradient-to-r from-primary to-destructive text-primary-foreground font-display font-black uppercase shadow-lg border-none"
              >
                Confirmar Inscripción
              </Button>
            </div>

          </form>

        </Card>
      </div>

      <PageHelp 
        title="Inscripción en Torneo UT"
        description="Esta pantalla te guía en el proceso de registro para un torneo oficial de Ultimate Team en el sistema."
        steps={[
          {
            title: "EA Club ID",
            description: "Introduce opcionalmente tu ID de club virtual de EA. Al configurarlo, el sistema podrá vincular tus partidos de Ultimate Team desde las bases de datos de EA de forma automatizada."
          },
          {
            title: "Seleccionar Compañero (2vs2)",
            description: "Si el formato del torneo es 2vs2, aparecerá un buscador. Escribe el nombre o gamertag de tu compañero y elígelo del listado. Es obligatorio seleccionarlo para enviar la inscripción."
          },
          {
            title: "Confirmar Inscripción",
            description: "Haz clic en 'Confirmar Inscripción' para procesar tu registro. Serás redirigido a la sección 'Mis Equipos' una vez completado."
          }
        ]}
      />
    </div>
  );
}
