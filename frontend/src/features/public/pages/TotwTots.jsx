import React, { useEffect, useState, lazy, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '@/api/axios';
import Badge from '@/components/ui/Badge';
import PlayerCard, { getFUTStats, getFlagUrl, translatePosition } from '@/components/ui/PlayerCard';
import Spinner from '@/components/ui/Spinner';

// Lazy-load heavy 3D component + large PNG assets — they only download when user
// switches to the 3D pitch view, saving ~4.5MB + entire Three.js bundle on initial load
const TacticVisualizer3D = lazy(() => import('./TacticVisualizer3D'));

export default function TotwTots() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('totw'); // totw | tots
  const [viewMode, setViewMode] = useState('pitch'); // pitch | grid
  
  const [organizations, setOrganizations] = useState([]);
  const [seasons, setSeasons] = useState([]);
  const [competitions, setCompetitions] = useState([]);

  // States for filters
  const [selectedOrg, setSelectedOrg] = useState('todas');
  const [selectedSeason, setSelectedSeason] = useState('todas');
  const [selectedComp, setSelectedComp] = useState('todas');

  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);

  const [selectedGalleryPlayer, setSelectedGalleryPlayer] = useState(null);
  const [shareStatus, setShareStatus] = useState('');

  const downloadCard = (player) => {
    setShareStatus('Generando imagen de la carta...');
    
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 680;
    const ctx = canvas.getContext('2d');
    
    const isTOTS = activeTab === 'tots';
    const cardTemplateUrl = isTOTS ? totsTemplateImg : totwTemplateImg;

    // Helper to resolve URLs with local proxy to bypass CORS
    const getCORSImageUrl = (path) => {
      if (!path) return null;
      if (path.includes('default-user.png')) {
        return '/images/users/default-user.png';
      }
      if (path.startsWith('http')) {
        return path;
      }
      const separator = path.startsWith('/') ? '' : '/';
      return `${apiBaseUrl}/media?path=${encodeURIComponent(separator + path)}`;
    };

    const playerImgSrc = getCORSImageUrl(player.foto);
    const resolvedFlagUrl = player.countryFlag || (player.nacionalidad ? getFlagUrl(player.nacionalidad) : null);
    const clubBadgeUrl = getCORSImageUrl(player.clubBadge);

    let loadedCount = 0;
    const totalAssets = 4;

    const checkAndDraw = () => {
      loadedCount++;
      if (loadedCount === totalAssets) {
        runDraw();
      }
    };

    const templateImg = new Image();
    const playerImg = new Image();
    const flagImg = new Image();
    const badgeImg = new Image();

    templateImg.crossOrigin = "anonymous";
    playerImg.crossOrigin = "anonymous";
    flagImg.crossOrigin = "anonymous";
    badgeImg.crossOrigin = "anonymous";

    templateImg.onload = checkAndDraw;
    templateImg.onerror = checkAndDraw;
    playerImg.onload = checkAndDraw;
    playerImg.onerror = checkAndDraw;
    flagImg.onload = checkAndDraw;
    flagImg.onerror = checkAndDraw;
    badgeImg.onload = checkAndDraw;
    badgeImg.onerror = checkAndDraw;

    templateImg.src = cardTemplateUrl;
    
    if (playerImgSrc) {
      playerImg.src = playerImgSrc;
    } else {
      checkAndDraw();
    }

    if (resolvedFlagUrl) {
      flagImg.src = resolvedFlagUrl;
    } else {
      checkAndDraw();
    }

    if (clubBadgeUrl) {
      badgeImg.src = clubBadgeUrl;
    } else {
      checkAndDraw();
    }

    const runDraw = () => {
      // 1. Draw Background template
      if (templateImg.complete && templateImg.naturalWidth > 0) {
        ctx.drawImage(templateImg, 0, 0, 512, 680);
      } else {
        // Fallback gradient
        const grad = ctx.createLinearGradient(0, 0, 0, 680);
        grad.addColorStop(0, isTOTS ? '#0c183a' : '#0c0c0c');
        grad.addColorStop(1, isTOTS ? '#01030e' : '#080808');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 512, 680);
      }

      // 2. Jersey Number (Camiseta) instead of Rating
      const displayDorsal = player.dorsal || (player.contrato_activo?.dorsal) || (player.id % 99) || 10;
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 90px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(displayDorsal, 120, 205);

      // 3. Position (Lowered)
      ctx.fillStyle = isTOTS ? '#67e8f9' : '#d97706';
      ctx.font = '900 32px sans-serif';
      ctx.fillText(translatePosition(player.posReal || player.pos || player.position || 'MC'), 120, 255);

      // 4. Club Badge / Shield (Lowered)
      if (badgeImg.complete && badgeImg.naturalWidth > 0) {
        ctx.drawImage(badgeImg, 76, 278, 88, 88);
      } else {
        ctx.save();
        ctx.translate(120, 322);
        ctx.fillStyle = isTOTS ? '#22d3ee' : '#fbbf24';
        ctx.beginPath();
        ctx.moveTo(0, -35);
        ctx.lineTo(31, -20);
        ctx.lineTo(31, 19);
        ctx.lineTo(0, 35);
        ctx.lineTo(-31, 19);
        ctx.lineTo(-31, -20);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }

      // 5. Draw Player portrait (Slightly shrunk and offset)
      if (playerImg.complete && playerImg.naturalWidth > 0) {
        const portraitCanvas = document.createElement('canvas');
        portraitCanvas.width = 330;
        portraitCanvas.height = 330;
        const pCtx = portraitCanvas.getContext('2d');
        pCtx.drawImage(playerImg, 0, 0, 330, 330);

        pCtx.globalCompositeOperation = 'destination-out';
        const fadeGrad = pCtx.createLinearGradient(0, 0, 0, 330);
        fadeGrad.addColorStop(0.65, 'rgba(0,0,0,0)');
        fadeGrad.addColorStop(1.0, 'rgba(0,0,0,1)');
        pCtx.fillStyle = fadeGrad;
        pCtx.fillRect(0, 0, 330, 330);
        pCtx.globalCompositeOperation = 'source-over';

        ctx.save();
        ctx.beginPath();
        // FUT card shield shape path (matching new size of portrait)
        ctx.moveTo(82, 44);
        ctx.lineTo(256, 10);
        ctx.lineTo(430, 44);
        ctx.lineTo(502, 110);
        ctx.lineTo(502, 558);
        ctx.lineTo(256, 670);
        ctx.lineTo(10, 558);
        ctx.lineTo(10, 110);
        ctx.closePath();
        ctx.clip();
        ctx.drawImage(portraitCanvas, 168, 95, 330, 330);
        ctx.restore();
      } else {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
        ctx.font = '900 240px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(player.name?.charAt(0) || 'P', 320, 320);
      }

      // 6. Player Name (Raised & Compacted)
      ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
      ctx.shadowBlur = 10;
      ctx.fillStyle = '#ffffff';
      ctx.font = '900 42px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(player.name?.substring(0, 14).toUpperCase() || 'PLAYER', 256, 438);
      ctx.shadowBlur = 0;

      // 7. Stats (Raised & Compacted)
      const cardStats = getFUTStats(player, isTOTS);
      const colCount = cardStats.length;
      cardStats.forEach((s, sIdx) => {
        const statX = 62 + (390 / colCount) * sIdx + (390 / (colCount * 2));
        // Stat label
        ctx.fillStyle = isTOTS ? '#67e8f9' : '#e2e8f0';
        ctx.font = '900 20px monospace';
        ctx.fillText(s.label, statX, 482);
        
        // Stat value
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 36px sans-serif';
        ctx.fillText(s.val, statX, 515);
      });

      // 8. Bottom Logos (Raised & Compacted)
      if (flagImg.complete && flagImg.naturalWidth > 0) {
        ctx.drawImage(flagImg, 165, 574, 36, 22);
      } else {
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(165, 574, 36, 22);
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 10px sans-serif';
        ctx.fillText('CL', 183, 589);
      }

      // League Icon
      ctx.fillStyle = isTOTS ? '#22d3ee' : '#fbbf24';
      ctx.font = '22px sans-serif';
      ctx.fillText('⚽', 256, 593);

      // Club Badge
      if (badgeImg.complete && badgeImg.naturalWidth > 0) {
        ctx.drawImage(badgeImg, 310, 572, 26, 26);
      } else {
        ctx.strokeStyle = isTOTS ? '#00f3ff' : '#f59e0b';
        ctx.lineWidth = 2;
        ctx.fillStyle = '#020617';
        ctx.beginPath();
        ctx.arc(323, 585, 12, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#ffffff';
        ctx.font = '900 8px sans-serif';
        ctx.fillText('FC', 323, 588);
      }

      // 9. Export PNG
      try {
        const dataUrl = canvas.toDataURL("image/png");
        const link = document.createElement("a");
        link.download = `${player.name.toLowerCase().replace(/\s+/g, '_')}_card.png`;
        link.href = dataUrl;
        link.click();
        setShareStatus('¡Descarga completada!');
        setTimeout(() => setShareStatus(''), 2000);
      } catch (err) {
        console.error("Canvas export failed:", err);
        setShareStatus('Error al generar la descarga.');
        setTimeout(() => setShareStatus(''), 3000);
      }
    };
  };

  const shareOnInstagram = (player) => {
    // 1. Download card
    downloadCard(player);

    // 2. Generate and copy caption
    const isTOTS = activeTab === 'tots';
    const tag = isTOTS ? '#TOTS' : '#TOTW';
    const caption = `🔥 ¡Mi carta oficial del Once Ideal en Torneos Pro FC! 🏆\n\n⚽ Jugador: ${player.name}\n⭐ Valoración: ${player.rating}\n🏃‍♂️ Posición: ${player.pos || player.position || 'MC'}\n🛡️ Equipo: ${player.equipo_nombre}\n\n#TorneosProFC #EAProClubs #OnceIdeal ${tag} #Esports #FUT`;
    
    navigator.clipboard.writeText(caption)
      .then(() => {
        setShareStatus('¡Copiado pie de foto al portapapeles! Abriendo Instagram...');
        setTimeout(() => {
          setShareStatus('');
          window.open('https://www.instagram.com/', '_blank');
        }, 3000);
      })
      .catch((err) => {
        console.error('Error al copiar al portapapeles:', err);
        setShareStatus('Carta descargada. Redirigiendo a Instagram...');
        setTimeout(() => {
          setShareStatus('');
          window.open('https://www.instagram.com/', '_blank');
        }, 2000);
      });
  };

  // Load organizations initially
  useEffect(() => {
    const fetchOrgs = async () => {
      try {
        const response = await api.get('/organizaciones', { params: { per_page: 50 } });
        setOrganizations(response.data.data || response.data || []);
      } catch (error) {
        console.error("Error al obtener organizaciones:", error);
      }
    };
    fetchOrgs();
  }, []);

  // Update seasons and competitions when organization changes
  useEffect(() => {
    const fetchOrgDetails = async () => {
      if (selectedOrg === 'todas') {
        setSeasons([]);
        setCompetitions([]);
        setSelectedSeason('todas');
        setSelectedComp('todas');
        return;
      }
      try {
        const response = await api.get(`/organizaciones/${selectedOrg}`);
        const orgData = response.data;
        const temps = orgData.temporadas || [];
        setSeasons(temps);

        const comps = [];
        temps.forEach(t => {
          if (t.competencias) {
            t.competencias.forEach(c => {
              comps.push({ ...c, temporada_nombre: t.nombre });
            });
          }
        });
        setCompetitions(comps);
        setSelectedSeason('todas');
        setSelectedComp('todas');
      } catch (error) {
        console.error("Error al obtener temporadas de organización:", error);
      }
    };
    fetchOrgDetails();
  }, [selectedOrg]);

  useEffect(() => {
    const fetchIdealTeam = async () => {
      setLoading(true);
      try {
        const response = await api.get('/analytics/totw-tots', {
          params: {
            organizacion_id: selectedOrg,
            temporada_id: selectedSeason,
            competencia_id: selectedComp,
            active_tab: activeTab
          }
        });
        const rawPlayers = response.data || [];
        const normalized = rawPlayers.map((p, idx) => {
          const updated = { ...p };
          updated.posReal = p.posicion || p.pos || 'MC'; // Save real position
          if (idx === 0) {
            // GK
            const currentPos = (updated.pos || updated.posicion || 'POR').toUpperCase();
            if (!['POR', 'GK', 'PO', 'ARQ', 'GOALKEEPER'].includes(currentPos)) {
              updated.pos = 'POR';
              updated.posicion = 'POR';
            }
            updated.lineGroup = 'gk';
          } else if (idx >= 1 && idx <= 4) {
            // Defender
            const currentPos = (updated.pos || updated.posicion || 'DFC').toUpperCase();
            if (!['DFC', 'LI', 'LD', 'DFI', 'DFD', 'DF', 'DFC1', 'DFC2', 'CB', 'LB', 'RB', 'DEFENDER'].includes(currentPos)) {
              updated.pos = 'DFC';
              updated.posicion = 'DFC';
            }
            updated.lineGroup = 'def';
          } else if (idx >= 5 && idx <= 7) {
            // Midfielder
            const currentPos = (updated.pos || updated.posicion || 'MC').toUpperCase();
            if (!['MC', 'MCD', 'MCO', 'VOL', 'MD', 'MI', 'CM', 'CAM', 'CDM', 'LM', 'RM', 'MIDFIELDER'].includes(currentPos)) {
              updated.pos = 'MC';
              updated.posicion = 'MC';
            }
            updated.lineGroup = 'mid';
          } else if (idx >= 8 && idx <= 10) {
            // Delantero
            const currentPos = (updated.pos || updated.posicion || 'DC').toUpperCase();
            const isStriker = !['POR', 'GK', 'PO', 'ARQ', 'GOALKEEPER', 'DFC', 'LI', 'LD', 'DFI', 'DFD', 'DF', 'DFC1', 'DFC2', 'CB', 'LB', 'RB', 'DEFENDER', 'MC', 'MCD', 'MCO', 'VOL', 'MD', 'MI', 'CM', 'CAM', 'CDM', 'LM', 'RM', 'MIDFIELDER'].includes(currentPos);
            if (!isStriker) {
              updated.pos = 'DC';
              updated.posicion = 'DC';
            }
            updated.lineGroup = 'del';
          }
          return updated;
        });
        setPlayers(normalized);
      } catch (error) {
        console.error("Error al obtener once ideal:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchIdealTeam();
  }, [activeTab, selectedOrg, selectedSeason, selectedComp]);

  const getImageUrl = (path) => {
    if (!path) return null;
    if (path.startsWith('http')) return path;
    if (typeof window.mediaUrl === 'function') {
      return window.mediaUrl(path);
    }
    const baseApi = api.defaults.baseURL || 'http://localhost:8000/api';
    const backendBaseUrl = baseApi.replace(/\/api$/, '') ;
    return `${backendBaseUrl}${path}`;
  };

  const isTOTS = activeTab === 'tots';

  // Dynamic competition branding color ("color de la temporada")
  const selectedCompObj = competitions.find(c => String(c.id) === String(selectedComp));
  const hasCompColor = selectedComp !== 'todas' && selectedCompObj && selectedCompObj.color_tema;
  const activeColor = hasCompColor ? selectedCompObj.color_tema : (isTOTS ? '#00f3ff' : '#f59e0b');

  const getGroupedPlayers = () => {
    const gks = [];
    const defs = [];
    const mids = [];
    const dels = [];

    players.forEach((p, index) => {
      if (p.lineGroup === 'gk') {
        gks.push(p);
      } else if (p.lineGroup === 'def') {
        defs.push(p);
      } else if (p.lineGroup === 'mid') {
        mids.push(p);
      } else if (p.lineGroup === 'del') {
        dels.push(p);
      } else {
        // Fallback by index matching backend layout
        if (index === 0) {
          gks.push(p);
        } else if (index >= 1 && index <= 4) {
          defs.push(p);
        } else if (index >= 5 && index <= 7) {
          mids.push(p);
        } else if (index >= 8 && index <= 10) {
          dels.push(p);
        } else {
          // Legacy pos check fallback
          const pos = (p.pos || p.posicion || 'MC').toUpperCase();
          if (['POR', 'GK', 'PO', 'ARQ', 'GOALKEEPER'].includes(pos)) {
            gks.push(p);
          } else if (['DFC', 'LI', 'LD', 'DFI', 'DFD', 'DF', 'DFC1', 'DFC2', 'CB', 'LB', 'RB', 'DEFENDER'].includes(pos)) {
            defs.push(p);
          } else if (['MC', 'MCD', 'MCO', 'VOL', 'MD', 'MI', 'CM', 'CAM', 'CDM', 'LM', 'RM', 'MIDFIELDER'].includes(pos)) {
            mids.push(p);
          } else {
            dels.push(p);
          }
        }
      }
    });

    return { gks, defs, mids, dels };
  };

  const { gks, defs, mids, dels } = getGroupedPlayers();

  return (
    <div className="relative min-h-screen bg-background pb-24 overflow-hidden text-foreground selection:bg-primary selection:text-primary-foreground">
      {/* Cinematic Ambient Glows matching standard e-sports style */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div 
          className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[350px] md:w-[600px] h-[350px] md:h-[600px] blur-[130px] rounded-full transition-all duration-700"
          style={{ backgroundColor: activeColor, opacity: 0.08 }}
        ></div>
        <div 
          className="absolute bottom-1/3 right-1/4 w-[300px] md:w-[500px] h-[300px] md:h-[500px] blur-[120px] rounded-full transition-all duration-700"
          style={{ backgroundColor: activeColor, opacity: 0.05 }}
        ></div>
        <div className="absolute inset-0 hud-noise opacity-15"></div>
      </div>

      <main className="relative z-10 max-w-7xl mx-auto px-6 lg:px-10 pt-32 md:pt-40 pb-16">
        
        {/* ========================================================================= */}
        {/* 1. FUT HEADER / BANNER                                                   */}
        {/* ========================================================================= */}
        <header className="relative w-full text-left flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8 mb-12">
          
          <div className="relative">
            {/* Background Title Text matching other pages */}
            <div className="absolute -top-16 -left-12 text-[15rem] md:text-[23rem] font-display font-black text-foreground/[0.035] dark:text-foreground/[0.045] select-none leading-none pointer-events-none font-extrabold tracking-tighter">
              {isTOTS ? 'TOTS' : 'TOTW'}
            </div>

            <Badge 
              variant="primary" 
              className="px-5 py-2 text-[10px] font-condensed tracking-[0.2em] text-primary border border-primary/30 bg-primary/10 rounded-full shadow-[0_0_20px_hsla(var(--primary),0.15)] uppercase animate-pulse shrink-0 z-10 mb-3"
            >
              🏆 ONCE IDEAL DE LA COMUNIDAD
            </Badge>

            <h1 className="text-4xl sm:text-8xl md:text-9xl font-display font-black text-foreground uppercase tracking-[0.01em] leading-[0.82] drop-shadow-2xl z-10 mt-2 select-none">
              {isTOTS ? (
                <>
                  TEAM OF THE <br />
                  <span className="text-primary tracking-tight font-black shimmer-text">
                    SEASON.
                  </span>
                </>
              ) : (
                <>
                  TEAM OF THE <br />
                  <span className="text-primary tracking-tight font-black shimmer-text">
                    WEEK.
                  </span>
                </>
              )}
            </h1>

            <p className="text-xs md:text-sm text-muted-foreground font-sans max-w-xl leading-relaxed tracking-wide font-light z-10 mt-3">
              Descubre los jugadores más destacados de la liga. Analizados y seleccionados automáticamente mediante estadísticas de juego, rendimiento y valoraciones oficiales de EA Sports FC Pro Clubs.
            </p>
          </div>

          {/* Quick Info Box */}
          <div className="w-full lg:w-80 shrink-0">
            <div className={`border rounded-2xl p-5 space-y-4 backdrop-blur-md shadow-xl relative overflow-hidden transition-all duration-500 ${
              isTOTS ? 'bg-cyan-950/10 border-cyan-500/20 shadow-cyan-950/50' : 'bg-amber-950/10 border-amber-500/20 shadow-amber-950/50'
            }`}>
              
              {/* Inner glowing edge */}
              <div className={`absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent to-transparent ${
                isTOTS ? 'via-cyan-500/40' : 'via-amber-500/40'
              }`}></div>

              <div className="flex justify-between items-center border-b border-white/10 pb-2">
                <span className="text-[9px] font-mono tracking-widest text-muted-foreground uppercase">TELEMETRÍA PRO</span>
                <span className={`text-[9px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                  isTOTS ? 'bg-cyan-500/10 text-cyan-400' : 'bg-amber-500/10 text-amber-400'
                }`}>
                  FUT ELITE
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-[8px] font-mono text-muted-foreground uppercase tracking-widest">PLANTILLA</h4>
                  <span className="text-2xl font-display font-black text-white leading-none block mt-1">11 JUGS</span>
                </div>
                <div>
                  <h4 className="text-[8px] font-mono text-muted-foreground uppercase tracking-widest">PROMEDIO</h4>
                  <span className={`text-2xl font-display font-black leading-none block mt-1 ${
                    isTOTS ? 'text-cyan-400' : 'text-amber-400'
                  }`}>
                    {players.length > 0 
                      ? (players.reduce((acc, curr) => acc + (curr.rating || 0), 0) / players.length).toFixed(1)
                      : '0.0'
                    }
                  </span>
                </div>
              </div>

              <p className="text-[10px] text-muted-foreground leading-relaxed font-sans font-light">
                Los algoritmos evalúan asistencias, goles y tarjetas oficiales por cada jornada para armar la alineación definitiva.
              </p>

              {/* Theme toggle button */}
              <button 
                onClick={() => setActiveTab(isTOTS ? 'totw' : 'tots')}
                className={`w-full py-3 text-xs font-mono font-black tracking-widest uppercase rounded-xl text-slate-950 font-black cursor-pointer shadow-lg transition-all duration-300 transform active:scale-95 ${
                  isTOTS 
                    ? 'bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 hover:shadow-cyan-500/20' 
                    : 'bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-500 hover:from-amber-300 hover:via-yellow-400 hover:to-amber-400 hover:shadow-amber-500/20'
                }`}
              >
                VER {isTOTS ? 'TEAM OF THE WEEK (TOTW)' : 'TEAM OF THE SEASON (TOTS)'}
              </button>
            </div>
          </div>
        </header>

        {/* ========================================================================= */}
        {/* 2. FILTERS PANEL                                                          */}
        {/* ========================================================================= */}
        <section className="bg-slate-950/40 border border-white/5 rounded-3xl p-5 backdrop-blur-md mb-8 max-w-4xl mx-auto shadow-xl">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            
            {/* Organizaciones */}
            <div className="space-y-1.5 text-left">
              <label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest block font-mono">
                🛡️ Circuito / Organización
              </label>
              <select 
                value={selectedOrg}
                onChange={(e) => setSelectedOrg(e.target.value)}
                className="w-full bg-[#050b16] border border-white/10 rounded-xl px-4 py-3 text-xs font-semibold text-white focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20 transition-all uppercase cursor-pointer"
              >
                <option value="todas">🌎 Todas (Global)</option>
                {organizations.map(org => (
                  <option key={org.id} value={org.id}>{org.nombre}</option>
                ))}
              </select>
            </div>

            {/* Temporadas */}
            <div className="space-y-1.5 text-left">
              <label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest block font-mono">
                📅 Temporada
              </label>
              <select 
                value={selectedSeason}
                onChange={(e) => setSelectedSeason(e.target.value)}
                disabled={selectedOrg === 'todas'}
                className="w-full bg-[#050b16] border border-white/10 rounded-xl px-4 py-3 text-xs font-semibold text-white focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed uppercase cursor-pointer"
              >
                <option value="todas">🌎 Todas las Temporadas</option>
                {seasons.map(s => (
                  <option key={s.id} value={s.id}>{s.nombre}</option>
                ))}
              </select>
            </div>

            {/* Competencias */}
            <div className="space-y-1.5 text-left">
              <label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest block font-mono">
                🏆 División / Competencia
              </label>
              <select 
                value={selectedComp}
                onChange={(e) => setSelectedComp(e.target.value)}
                disabled={selectedOrg === 'todas'}
                className="w-full bg-[#050b16] border border-white/10 rounded-xl px-4 py-3 text-xs font-semibold text-white focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed uppercase cursor-pointer"
              >
                <option value="todas">🌎 Todas las Divisiones</option>
                {competitions.map(c => (
                  <option key={c.id} value={c.id}>{c.nombre}</option>
                ))}
              </select>
            </div>

          </div>
        </section>

        {/* ========================================================================= */}
        {/* 3. VIEW MODE & TAB TOGGLES                                                */}
        {/* ========================================================================= */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-10 pb-6 border-b border-white/5">
          
          {/* Dynamic Theme Tab Selector */}
          <div className="flex gap-1.5 bg-[#050a14] p-1.5 rounded-xl border border-white/10 shrink-0">
            <button
              onClick={() => setActiveTab('totw')}
              className={`px-5 py-2.5 rounded-lg text-xs font-mono font-black uppercase transition-all duration-300 flex items-center gap-1.5 ${
                activeTab === 'totw' 
                  ? 'bg-amber-500 text-slate-950 shadow-[0_0_15px_rgba(245,158,11,0.35)]' 
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              ⭐ Team of the Week (TOTW)
            </button>
            <button
              onClick={() => setActiveTab('tots')}
              className={`px-5 py-2.5 rounded-lg text-xs font-mono font-black uppercase transition-all duration-300 flex items-center gap-1.5 ${
                activeTab === 'tots' 
                  ? 'bg-cyan-500 text-slate-950 shadow-[0_0_15px_rgba(6,182,212,0.35)]' 
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              🔥 Team of the Season (TOTS)
            </button>
          </div>

          {/* 3D Visualizer View Toggle */}
          <div className="flex gap-1.5 bg-[#050a14] p-1.5 rounded-xl border border-white/10 shrink-0">
            <button
              onClick={() => setViewMode('pitch')}
              className={`px-5 py-2.5 rounded-lg text-xs font-mono font-black uppercase transition-all duration-300 flex items-center gap-2 ${
                viewMode === 'pitch' 
                  ? 'bg-white/10 text-white border border-white/20' 
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              🏟️ Vista Táctica 3D
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`px-5 py-2.5 rounded-lg text-xs font-mono font-black uppercase transition-all duration-300 flex items-center gap-2 ${
                viewMode === 'grid' 
                  ? 'bg-white/10 text-white border border-white/20' 
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              🃏 Galería de Cartas 3D
            </button>
          </div>

        </div>

        {/* ========================================================================= */}
        {/* 4. MAIN DISPLAY (PITCH OR GRID)                                          */}
        {/* ========================================================================= */}
        {loading ? (
          <div className="space-y-8 max-w-5xl mx-auto">
            <div className="skeleton-shimmer h-[650px] rounded-3xl w-full"></div>
          </div>
        ) : (
          <div className="max-w-5xl mx-auto w-full">
            
            {/* Main Visual Block (Tactic Pitch or FUT Card Grid) */}
            <div className="w-full">
              {viewMode === 'pitch' ? (
                // 3D Pitch view — loaded lazily to avoid Three.js bundle on initial page load
                <Suspense fallback={
                  <div className="flex items-center justify-center h-[500px] text-muted-foreground">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                      <span className="text-xs font-condensed tracking-widest uppercase">Cargando Vista 3D...</span>
                    </div>
                  </div>
                }>
                  <TacticVisualizer3D players={players} activeTab={activeTab} customColor={hasCompColor ? activeColor : null} />
                </Suspense>
              ) : (
                // 3D Card grid view (Hover-tilt interactive gallery in tactical 1-4-3-3 layout)
                <div className="space-y-6">
                  {players.length === 0 ? (
                    <div className="border border-dashed border-white/10 p-20 rounded-3xl text-center text-muted-foreground">
                      No hay datos de jugadores para mostrar en esta combinación.
                    </div>
                  ) : (
                    (() => {
                      const renderCard = (p, idx, rowType) => {
                        let translationClass = "";
                        if (rowType === 'del' && idx === 1) {
                          // Center striker is shifted forward (upwards)
                          translationClass = " -translate-y-4 md:-translate-y-8";
                        } else if (rowType === 'mid' && idx === 1) {
                          // Center midfielder is shifted forward (upwards)
                          translationClass = " -translate-y-4 md:-translate-y-8";
                        } else if (rowType === 'def' && (idx === 0 || idx === 3)) {
                          // Outer defenders (wings) are shifted forward (upwards)
                          translationClass = " -translate-y-3 md:-translate-y-6";
                        }

                        return (
                          <div 
                            key={p.id || idx} 
                            onClick={() => {
                              setSelectedGalleryPlayer(p);
                            }}
                            className={`cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:-translate-y-2 bg-transparent transform w-full max-w-[150px] sm:max-w-[195px] mx-auto${translationClass} animate-fade-in`}
                            style={{ animationFillMode: 'both', animationDelay: `${idx * 80}ms` }}
                          >
                            <PlayerCard 
                              player={{
                                ...p,
                                theme: isTOTS ? 'champions-league' : 'totw'
                              }} 
                              variant="dynamic"
                            />
                          </div>
                        );
                      };

                      const lineColor = activeColor;

                      return (
                        <div 
                          className="space-y-4 md:space-y-6 p-6 sm:p-8 rounded-3xl border relative transition-all duration-500 overflow-hidden bg-[size:30px_30px] bg-[linear-gradient(to_right,rgba(255,255,255,0.01)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.01)_1px,transparent_1px)]"
                          style={{
                            backgroundColor: isTOTS ? '#020815f2' : '#070502f2',
                            borderColor: `${activeColor}33`,
                            boxShadow: `0 0 50px ${activeColor}26`,
                          }}
                        >
                          
                          {/* Glowing Soccer Pitch Background Board (Matching Mockup Image) */}
                          <div className="absolute inset-0 z-0 pointer-events-none select-none opacity-45 overflow-hidden rounded-3xl p-2 sm:p-4">
                            <svg className="w-full h-full" viewBox="0 0 800 1100" preserveAspectRatio="none" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <defs>
                                <filter id="pitch-glow" x="-20%" y="-20%" width="140%" height="140%">
                                  <feGaussianBlur stdDeviation="8" result="blur" />
                                  <feMerge>
                                    <feMergeNode in="blur" />
                                    <feMergeNode in="SourceGraphic" />
                                  </feMerge>
                                </filter>
                              </defs>
                              
                              {/* Glowing Outer Boundary */}
                              <rect x="25" y="25" width="750" height="1050" rx="15" stroke={lineColor} strokeWidth="3" filter="url(#pitch-glow)" opacity="0.8" />
                              <rect x="35" y="35" width="730" height="1030" rx="10" stroke={lineColor} strokeWidth="1" opacity="0.25" />

                              {/* Halfway Line */}
                              <line x1="35" y1="550" x2="765" y2="550" stroke={lineColor} strokeWidth="2.5" filter="url(#pitch-glow)" opacity="0.7" />

                              {/* Center Circle */}
                              <circle cx="400" cy="550" r="115" stroke={lineColor} strokeWidth="2.5" filter="url(#pitch-glow)" opacity="0.7" fill="none" />
                              <circle cx="400" cy="550" r="6" fill={lineColor} filter="url(#pitch-glow)" />

                              {/* Top Penalty Area */}
                              <rect x="180" y="35" width="440" height="190" stroke={lineColor} strokeWidth="2.5" filter="url(#pitch-glow)" opacity="0.7" />
                              <rect x="290" y="35" width="220" height="65" stroke={lineColor} strokeWidth="2" filter="url(#pitch-glow)" opacity="0.7" />
                              <path d="M 315 225 A 95 95 0 0 0 485 225" stroke={lineColor} strokeWidth="2.5" filter="url(#pitch-glow)" opacity="0.7" fill="none" />
                              <circle cx="400" cy="155" r="4.5" fill={lineColor} filter="url(#pitch-glow)" />

                              {/* Bottom Penalty Area */}
                              <rect x="180" y="875" width="440" height="190" stroke={lineColor} strokeWidth="2.5" filter="url(#pitch-glow)" opacity="0.7" />
                              <rect x="290" y="1000" width="220" height="65" stroke={lineColor} strokeWidth="2" filter="url(#pitch-glow)" opacity="0.7" />
                              <path d="M 315 875 A 95 95 0 0 1 485 875" stroke={lineColor} strokeWidth="2.5" filter="url(#pitch-glow)" opacity="0.7" fill="none" />
                              <circle cx="400" cy="945" r="4.5" fill={lineColor} filter="url(#pitch-glow)" />

                              {/* Corner Arcs */}
                              <path d="M 35 65 A 30 30 0 0 1 65 35" stroke={lineColor} strokeWidth="2" filter="url(#pitch-glow)" opacity="0.7" fill="none" />
                              <path d="M 735 35 A 30 30 0 0 1 765 65" stroke={lineColor} strokeWidth="2" filter="url(#pitch-glow)" opacity="0.7" fill="none" />
                              <path d="M 35 1035 A 30 30 0 0 0 65 1065" stroke={lineColor} strokeWidth="2" filter="url(#pitch-glow)" opacity="0.7" fill="none" />
                              <path d="M 735 1065 A 30 30 0 0 0 765 1035" stroke={lineColor} strokeWidth="2" filter="url(#pitch-glow)" opacity="0.7" fill="none" />
                            </svg>
                          </div>
                          
                          {/* Delanteros (3) */}
                          <div className="space-y-2 relative z-10 pt-2 md:pt-4">
                           
                            <div className="grid grid-cols-3 gap-3 sm:gap-6 max-w-2xl mx-auto">
                              {dels.map((p, idx) => renderCard(p, idx, 'del'))}
                            </div>
                          </div>

                          {/* Mediocampistas (3) */}
                          <div className="space-y-2 relative z-10 pt-0">
                     
                            <div className="grid grid-cols-3 gap-3 sm:gap-6 max-w-2xl mx-auto">
                              {mids.map((p, idx) => renderCard(p, idx, 'mid'))}
                            </div>
                          </div>

                          {/* Defensores (4) */}
                          <div className="space-y-2 relative z-10 pt-0">
                          
                            <div className="grid grid-cols-4 gap-2 sm:gap-4 max-w-3xl mx-auto">
                              {defs.map((p, idx) => renderCard(p, idx, 'def'))}
                            </div>
                          </div>

                          {/* Arquero (1) */}
                          <div className="space-y-2 relative z-10">
                            <div className="flex justify-center">
                              <div className="w-full max-w-[150px] sm:max-w-[195px]">
                                {gks.map((p, idx) => renderCard(p, idx, 'gk'))}
                              </div>
                            </div>
                          </div>

                        </div>
                      );
                    })()
                  )}
                </div>
              )}
            </div>

          </div>
        )}

      </main>

      {/* Sharing and Download Overlay Modal */}
      {selectedGalleryPlayer && (
        <div 
          className="fixed inset-0 bg-slate-950/90 backdrop-blur-xl z-50 flex items-center justify-center p-4 transition-all duration-300 animate-fadeIn"
          onClick={() => {
            setSelectedGalleryPlayer(null);
            setShareStatus('');
          }}
        >
          <div 
            className="relative flex flex-col md:flex-row gap-8 max-w-2xl w-full bg-gradient-to-b from-slate-900/90 to-slate-950 border border-white/10 rounded-3xl p-6 md:p-8 shadow-[0_0_50px_rgba(0,0,0,0.8)] animate-scaleUp pointer-events-auto text-left font-sans"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button 
              onClick={() => {
                setSelectedGalleryPlayer(null);
                setShareStatus('');
              }}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground hover:scale-110 transition-all font-sans font-bold text-xl bg-slate-800/40 w-10 h-10 rounded-full flex items-center justify-center border border-white/10 cursor-pointer"
            >
              ✕
            </button>

            {/* Left side: Enlarged Card Display */}
            <div className="flex justify-center md:w-1/2 shrink-0">
              <PlayerCard 
                player={{
                  ...selectedGalleryPlayer,
                  theme: isTOTS ? 'champions-league' : 'totw'
                }} 
                variant="dynamic" 
                className="w-64 max-w-full drop-shadow-[0_15px_30px_rgba(0,0,0,0.7)]" 
                disableHover={true}
              />
            </div>

            {/* Right side: Options and Info */}
            <div className="flex-1 flex flex-col justify-between">
              <div className="space-y-4">
                <div>
                  <span className={`text-[10px] font-mono font-bold tracking-[0.15em] uppercase block mb-1 ${isTOTS ? 'text-cyan-400' : 'text-amber-500'}`}>
                    Detalle de Carta de la Comunidad
                  </span>
                  <h3 className="text-2xl md:text-3xl font-black uppercase text-foreground tracking-wide pb-2 border-b border-white/10">
                    {selectedGalleryPlayer.name}
                  </h3>
                </div>

                <div className="bg-slate-950/50 border border-white/5 rounded-2xl p-4 space-y-3 font-mono">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-muted-foreground">Equipo</span>
                    <span className="font-bold text-white uppercase">{selectedGalleryPlayer.equipo_nombre}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-muted-foreground">Posición</span>
                    <span className={`font-black uppercase ${isTOTS ? 'text-cyan-400' : 'text-amber-500'}`}>
                      {selectedGalleryPlayer.pos || selectedGalleryPlayer.position || 'MC'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-muted-foreground">Valoración Global</span>
                    <span className="font-black text-white text-base">{selectedGalleryPlayer.rating}</span>
                  </div>
                </div>

                <p className="text-[11px] text-muted-foreground leading-relaxed font-sans font-light">
                  Puedes descargar la carta oficial en alta definición PNG o compartirla de forma rápida. Al compartirla en Instagram, copiaremos el pie de foto a tu portapapeles y se descargará la imagen de tu carta.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3 mt-6">
                
                {/* Download Button */}
                <button
                  onClick={() => downloadCard(selectedGalleryPlayer)}
                  className={`w-full py-3.5 text-xs font-mono font-black tracking-widest uppercase rounded-xl cursor-pointer shadow-lg transition-all duration-300 transform active:scale-95 flex items-center justify-center gap-2 ${
                    isTOTS 
                      ? 'bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-slate-950 hover:shadow-cyan-500/25' 
                      : 'bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-500 hover:from-amber-300 hover:via-yellow-400 hover:to-amber-400 text-slate-950 hover:shadow-amber-500/25'
                  }`}
                >
                  📥 Descargar Carta (PNG)
                </button>

                {/* Share on Instagram */}
                <button
                  onClick={() => shareOnInstagram(selectedGalleryPlayer)}
                  className="w-full py-3.5 text-xs font-mono font-black tracking-widest uppercase rounded-xl cursor-pointer shadow-lg transition-all duration-300 transform active:scale-95 flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 via-pink-600 to-yellow-500 hover:opacity-90 text-white hover:shadow-pink-500/25 border border-white/10"
                >
                  📸 Compartir en Instagram
                </button>

                {/* View Profile */}
                <button
                  onClick={() => {
                    const isRealPlayer = selectedGalleryPlayer.id && selectedGalleryPlayer.id < 700;
                    if (isRealPlayer) {
                      navigate(`/jugadores/${selectedGalleryPlayer.id}`);
                      setSelectedGalleryPlayer(null);
                    }
                  }}
                  className="w-full py-3 text-xs font-mono font-black tracking-widest uppercase rounded-xl cursor-pointer transition-all duration-300 hover:bg-white/5 text-muted-foreground hover:text-white border border-white/5"
                >
                  👤 Ver Perfil Completo
                </button>
              </div>

              {/* Status Banner */}
              {shareStatus && (
                <div className="mt-3 p-3 bg-emerald-500/10 border border-emerald-500/25 rounded-xl text-center text-[10px] text-emerald-400 font-mono animate-pulse">
                  {shareStatus}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
