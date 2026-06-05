import React, { useRef, useState, useEffect } from 'react';
import api from '@/api/axios';
import totsTemplate from '@/assets/images/cartas/tots.png';
import totwTemplate from '@/assets/images/cartas/totw.png';

/**
 * 3D Tilt Wrapper Component for cards
 */
export function CardTilt({ children, className = '', disableTilt = false }) {
  const cardRef = useRef(null);
  const [style, setStyle] = useState({});

  if (disableTilt) {
    return <div className={`bg-transparent ${className}`} style={{ containerType: 'inline-size', backgroundColor: 'transparent' }}>{children}</div>;
  }

  const handleMouseMove = (e) => {
    const card = cardRef.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const xc = rect.width / 2;
    const yc = rect.height / 2;
    const angleX = -(y - yc) / 12; // Rotate on X axis
    const angleY = (x - xc) / 12;  // Rotate on Y axis
    
    const glareX = (x / rect.width) * 100;
    const glareY = (y / rect.height) * 100;

    setStyle({
      transform: `perspective(1000px) rotateX(${angleX}deg) rotateY(${angleY}deg) scale3d(1.04, 1.04, 1.04)`,
      transition: 'transform 0.08s ease-out',
      glare: {
        background: `radial-gradient(circle at ${glareX}% ${glareY}%, rgba(255, 255, 255, 0.15) 0%, transparent 75%)`
      }
    });
  };

  const handleMouseLeave = () => {
    setStyle({
      transform: 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)',
      transition: 'transform 0.4s ease-out',
      glare: {
        background: 'transparent'
      }
    });
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={`relative bg-transparent transition-all duration-300 ${className}`}
      style={{
        transformStyle: 'preserve-3d',
        transform: style.transform || 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)',
        transition: style.transition,
        containerType: 'inline-size',
        backgroundColor: 'transparent'
      }}
    >
      <div 
        className="absolute inset-0 pointer-events-none z-30 transition-all duration-300 rounded-[inherit]"
        style={style.glare}
      />
      {children}
    </div>
  );
}

/**
 * Helper to resolve dynamic, realistic FUT card stats based on overall rating and position.
 */
export function getFUTStats(player = {}, isTOTS = false) {
  const position = (player.position || player.pos || 'MC').toUpperCase();
  const stats = player.stats || {};

  const isGK = ['GK', 'PO', 'ARQ', 'POR'].includes(position);
  const isDEF = ['DFC', 'LI', 'LD', 'DFI', 'DFD', 'DF', 'DFC1', 'DFC2', 'CB', 'LB', 'RB', 'DEFENDER'].includes(position);
  const isMID = ['MC', 'MCD', 'MCO', 'MVs', 'MC1', 'MC2', 'VOL', 'MD', 'MI', 'CM', 'CAM', 'CDM', 'LM', 'RM', 'MIDFIELDER'].includes(position);

  if (isGK) {
    const atajadas = player.total_atajadas || stats.atajadas || 0;
    const imbatidos = player.arcos_imbatidos || stats.arcos_imbatidos || 0;
    const recibidos = player.total_goles_recibidos || stats.goles_recibidos || 0;
    return [
      { label: 'ATAJ', val: atajadas },
      { label: 'A. IMB', val: imbatidos },
      { label: 'REC', val: recibidos }
    ];
  } else if (isDEF) {
    const entradas = player.total_entradas || stats.entradas_exitosas || stats.entradas || 0;
    const exito = Math.round(player.avg_exito_entradas || stats.tasa_exito_entradas || 0);
    return [
      { label: 'ENT', val: entradas },
      { label: '% EXT', val: `${exito}%` }
    ];
  } else if (isMID) {
    const pasesComp = player.total_pases_completados || stats.pases_completados || 0;
    const pasesInt = player.total_pases_intentados || stats.pases_intentados || 0;
    const exitoPases = Math.round(player.avg_precision_pases || stats.precision_pases || 0);
    const entradas = player.total_entradas || stats.entradas_exitosas || stats.entradas || 0;
    return [
      { label: 'PAS C', val: pasesComp },
      { label: 'PAS I', val: pasesInt },
      { label: '% EXT', val: `${exitoPases}%` },
      { label: 'ENT', val: entradas }
    ];
  } else {
    // Delanteros / Atacantes
    const tiros = player.total_tiros || stats.tiros || 0;
    const goles = player.total_goles || stats.goles || 0;
    const acierto = Math.round(player.avg_precision_tiro || stats.precision_tiro || 0);
    const asistencias = player.total_asistencias || stats.asistencias || 0;
    return [
      { label: 'TIROS', val: tiros },
      { label: 'GOLES', val: goles },
      { label: '% ACI', val: `${acierto}%` },
      { label: 'ASIS', val: asistencias }
    ];
  }
}


/**
 * Helper to resolve dynamic eSports stats based on player position/role in the stats modal.
 */
export function getPlayerRoleStats(position = 'MC', ratingVal = 85, stats = {}, idx = 0) {
  const pos = position.toUpperCase();
  const baseRating = ratingVal || 85;

  if (['GK', 'PO', 'ARQ', 'POR'].includes(pos)) {
    return {
      role: 'Portero',
      list: [
        { label: 'EST', labelLong: 'Estirada', val: stats.est || stats.rit || Math.round(baseRating - 2 + (idx % 4)) },
        { label: 'REF', labelLong: 'Reflejos', val: stats.ref || stats.tir || Math.round(baseRating + 3 - (idx % 3)) },
        { label: 'SAQ', labelLong: 'Saque', val: stats.saq || stats.pas || Math.round(baseRating - 6 + (idx % 5)) },
        { label: 'POS', labelLong: 'Posicionamiento', val: stats.pos || stats.reg || Math.round(baseRating - 3 + (idx % 4)) },
        { label: '1v1', labelLong: 'Reflejos 1v1', val: stats.v1 || stats.def || Math.round(baseRating + 1 - (idx % 3)) },
        { label: 'ANT', labelLong: 'Anticipación', val: stats.ant || stats.fis || Math.round(baseRating - 1 + (idx % 2)) },
      ]
    };
  }

  if (['DFC', 'LI', 'LD', 'DFI', 'DFD', 'DF', 'DFC1', 'DFC2'].includes(pos)) {
    return {
      role: 'Defensa',
      list: [
        { label: 'ENT', labelLong: 'Entradas', val: stats.ent || stats.rit || Math.round(baseRating + 2 - (idx % 3)) },
        { label: 'MAR', labelLong: 'Marcaje', val: stats.mar || stats.tir || Math.round(baseRating - 1 + (idx % 4)) },
        { label: 'INT', labelLong: 'Intercepciones', val: stats.int || stats.pas || Math.round(baseRating + 1 - (idx % 3)) },
        { label: 'FUE', labelLong: 'Fuerza', val: stats.fue || stats.reg || Math.round(baseRating + 4 - (idx % 5)) },
        { label: 'AGR', labelLong: 'Agresividad', val: stats.agr || stats.def || Math.round(baseRating - 5 + (idx % 4)) },
        { label: 'AER', labelLong: 'Juego Aéreo', val: stats.aer || stats.fis || Math.round(baseRating + 3 - (idx % 3)) },
      ]
    };
  }

  if (['MC', 'MCD', 'MCO', 'MVs', 'MC1', 'MC2', 'VOL'].includes(pos)) {
    return {
      role: 'Mediocampista',
      list: [
        { label: 'VIS', labelLong: 'Visión', val: stats.vis || stats.rit || Math.round(baseRating + 4 - (idx % 5)) },
        { label: 'PAS', labelLong: 'Pases Clave', val: stats.pas || stats.tir || Math.round(baseRating + 2 - (idx % 3)) },
        { label: 'REG', labelLong: 'Regate', val: stats.reg || stats.pas || Math.round(baseRating - 1 + (idx % 4)) },
        { label: 'CON', labelLong: 'Control Balón', val: stats.con || stats.reg || Math.round(baseRating + 3 - (idx % 3)) },
        { label: 'RES', labelLong: 'Resistencia', val: stats.res || stats.def || Math.round(baseRating - 4 + (idx % 6)) },
        { label: 'LAR', labelLong: 'Pases Largos', val: stats.lar || stats.fis || Math.round(baseRating + 1 - (idx % 4)) },
      ]
    };
  }

  return {
    role: 'Delantero',
    list: [
      { label: 'DEF', labelLong: 'Definición', val: stats.def || stats.rit || Math.round(baseRating + 5 - (idx % 3)) },
      { label: 'DES', labelLong: 'Desmarque', val: stats.des || stats.tir || Math.round(baseRating + 2 - (idx % 4)) },
      { label: 'POT', labelLong: 'Potencia Tiro', val: stats.pot || stats.pas || Math.round(baseRating + 3 - (idx % 3)) },
      { label: 'ACE', labelLong: 'Aceleración', val: stats.ace || stats.reg || Math.round(baseRating + 4 - (idx % 5)) },
      { label: 'AGI', labelLong: 'Agilidad', val: stats.agi || stats.def || Math.round(baseRating - 1 + (idx % 4)) },
      { label: 'VOL', labelLong: 'Voleas', val: stats.vol || stats.fis || Math.round(baseRating - 6 + (idx % 6)) },
    ]
  };
}

/**
 * Helper to map nationalities to FlagCDN country codes
 */
export const getFlagUrl = (nationality) => {
  if (!nationality) return null;
  const normalized = nationality.toLowerCase().trim();
  const countryCodes = {
    'chile': 'cl',
    'chileno': 'cl',
    'chilena': 'cl',
    'argentina': 'ar',
    'argentino': 'ar',
    'uruguay': 'uy',
    'uruguayo': 'uy',
    'brazil': 'br',
    'brasil': 'br',
    'brasileño': 'br',
    'colombia': 'co',
    'colombiano': 'co',
    'peru': 'pe',
    'perú': 'pe',
    'peruano': 'pe',
    'ecuador': 'ec',
    'ecuatoriano': 'ec',
    'venezuela': 've',
    'venezolano': 've',
    'bolivia': 'bo',
    'boliviano': 'bo',
    'paraguay': 'py',
    'paraguayo': 'py',
    'españa': 'es',
    'español': 'es',
    'mexico': 'mx',
    'méxico': 'mx',
    'mexicano': 'mx',
    'eeuu': 'us',
    'usa': 'us',
    'estados unidos': 'us',
    'united states': 'us'
  };
  const code = countryCodes[normalized] || 'cl';
  return `https://flagcdn.com/w80/${code}.png`;
};

/**
 * Helper to translate English positions to Spanish abbreviations
 */
export const translatePosition = (pos) => {
  if (!pos) return 'MC';
  const p = pos.toUpperCase().trim();
  const map = {
    'GK': 'POR',
    'PO': 'POR',
    'POR': 'POR',
    'ARQ': 'POR',
    'GOALKEEPER': 'POR',
    'CB': 'DFC',
    'DFC': 'DFC',
    'DF': 'DFC',
    'LB': 'LI',
    'LI': 'LI',
    'DFI': 'LI',
    'RB': 'LD',
    'LD': 'LD',
    'DFD': 'LD',
    'CDM': 'MCD',
    'MCD': 'MCD',
    'CM': 'MC',
    'MC': 'MC',
    'CAM': 'MCO',
    'MCO': 'MCO',
    'LM': 'MI',
    'MI': 'MI',
    'RM': 'MD',
    'MD': 'MD',
    'ST': 'DC',
    'CF': 'DC',
    'DC': 'DC',
    'DEL': 'DC',
    'FORWARD': 'DC',
    'LW': 'EI',
    'EI': 'EI',
    'RW': 'ED',
    'ED': 'ED'
  };
  return map[p] || p;
};

/**
 * Re-designed PlayerCard component utilizing only totw.png image background
 */
export default function PlayerCard({ 
  player = {}, 
  variant = 'dynamic', 
  className = '',
  disableHover = false
}) {
  const {
    id = 1,
    rating = 85,
    position = 'MC',
    pos = 'MC',
    name = 'PLAYER',
    foto = '',
    playerImage = '',
    countryFlag = '',
    clubBadge = '',
    theme = 'totw', // champions-league (TOTS blue/cyan style) | totw (Black/gold style)
  } = player;

  // Safe Image resolution helper
  const getImageUrl = (path) => {
    if (!path) return null;
    if (path.includes('default-user.png')) {
      return '/images/users/default-user.png';
    }
    if (path.startsWith('http')) {
      return path;
    }
    const separator = path.startsWith('/') ? '' : '/';
    const apiBaseUrl = api.defaults.baseURL || 'http://localhost:8000/api';
    return `${apiBaseUrl}/media?path=${encodeURIComponent(separator + path)}`;
  };

  const displayImage = playerImage || getImageUrl(foto);

  const [imageLoaded, setImageLoaded] = useState(false);
  const imageRef = useRef(null);

  useEffect(() => {
    if (imageRef.current && imageRef.current.complete) {
      setImageLoaded(true);
    } else {
      setImageLoaded(false);
    }
  }, [displayImage]);

  const activePosition = translatePosition(player.posReal || position || pos || 'MC');
  const resolvedFlag = countryFlag || (player.nacionalidad ? getFlagUrl(player.nacionalidad) : null);
  
  const isTOTS = theme === 'champions-league' || theme === 'tots';
  const cardStats = getFUTStats(player, isTOTS);

  // Card template image - loaded from local assets (no backend request needed)
  const cardTemplateUrl = isTOTS ? totsTemplate : totwTemplate;
  const displayDorsal = player.dorsal || (player.contrato_activo?.dorsal) || (id % 99) || 10;

  return (
    <CardTilt disableTilt={disableHover} className={`w-full bg-transparent aspect-[5/7] select-none pointer-events-auto transition-all duration-300 relative ${className}`}>
      
      <div className="w-full h-full bg-transparent relative" style={{ backgroundColor: 'transparent' }}>
        
        {/* Background Card Template Image loaded from backend - ONLY this image forms the background */}
        <img 
          src={cardTemplateUrl} 
          alt="Card Template" 
          className="absolute inset-0 w-full h-full object-contain z-0 select-none pointer-events-none bg-transparent" 
          style={{ backgroundColor: 'transparent' }}
        />

        {/* Card Content Overlay */}
        <div className="w-full h-full absolute inset-0 z-20 pointer-events-none select-none">
          
          {/* Top-Left Column: Rating / Pos / Logo (Lowered) */}
          <div className="absolute top-[21%] left-[16.5%] flex flex-col items-center leading-none">
            {/* Jersey Number */}
            <span className="text-[14.5cqi] font-black tracking-tighter text-white drop-shadow-[0_2px_3px_rgba(0,0,0,0.85)] font-display">
              {displayDorsal}
            </span>
            
            {/* Position */}
            <span className="text-[4.5cqi] font-black tracking-widest uppercase text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] mt-0.5">
              {activePosition}
            </span>

            {/* Club badge instead of generic SVG shield */}
            <div className="mt-1 opacity-90 drop-shadow w-[19cqi] h-[19cqi] flex items-center justify-center">
              {clubBadge ? (
                <img src={getImageUrl(clubBadge)} alt="Club Crest" className="w-[19cqi] h-[19cqi] object-contain" />
              ) : (
                <div className={`w-[19cqi] h-[19cqi] rounded-full border flex items-center justify-center font-display font-black text-[5.8cqi] ${
                  isTOTS ? 'bg-cyan-950/45 border-cyan-500/30 text-cyan-300' : 'bg-amber-950/45 border-amber-500/30 text-amber-400'
                }`}>
                  SXS
                </div>
              )}
            </div>
          </div>

          {/* Right Side: Player portrait cutout - centered and slightly shrunk */}
          <div className="absolute right-[2%] top-[13.5%] w-[74%] h-[52%] flex items-end justify-center overflow-hidden pointer-events-none z-10">
            {!imageLoaded && displayImage && (
              <div className="absolute inset-0 bg-white/5 animate-pulse rounded-full filter blur-xl max-w-[80%] max-h-[80%] m-auto pointer-events-none opacity-40" />
            )}
            {displayImage ? (
              <img 
                ref={imageRef}
                src={displayImage} 
                alt={name} 
                onLoad={() => setImageLoaded(true)}
                className={`max-h-[100%] max-w-[120%] object-cover object-top drop-shadow-[0_8px_12px_rgba(0,0,0,0.85)] transition-all duration-[1200ms] ease-[cubic-bezier(0.16,1,0.3,1)] ${
                  imageLoaded ? 'opacity-100 translate-y-0 scale-105' : 'opacity-0 translate-y-6 scale-[0.96]'
                }`}
                style={{
                  maskImage: 'linear-gradient(to bottom, rgba(0,0,0,1) 60%, rgba(0,0,0,0) 100%)',
                  WebkitMaskImage: 'linear-gradient(to bottom, rgba(0,0,0,1) 60%, rgba(0,0,0,0) 100%)'
                }}
              />
            ) : (
              <div className="opacity-[0.06] select-none text-[8.5rem] font-black uppercase leading-none text-white">
                {name.charAt(0)}
              </div>
            )}
          </div>

          {/* Bottom Area: Name, Stats, Logos */}
          
          {/* Player Name */}
          <div className="absolute top-[64.5%] left-0 right-0 text-center z-20">
            <h4 className="text-white text-[6.5cqi] font-black tracking-widest uppercase drop-shadow-[0_2px_4px_rgba(0,0,0,0.95)]">
              {name.substring(0, 14)}
            </h4>
          </div>

          {/* Stats Row */}
          <div className="absolute top-[69.5%] left-0 right-0 px-[11%] z-20">
            <div className={`grid gap-0 text-center w-full px-1 text-white font-mono ${
              cardStats.length === 4 ? 'grid-cols-4' :
              cardStats.length === 3 ? 'grid-cols-3' : 'grid-cols-2'
            }`}>
              {cardStats.map((s, idx) => (
                <div key={idx} className="flex flex-col items-center">
                  <span className="text-[3.6cqi] font-bold tracking-wider text-slate-300 opacity-90 uppercase">
                    {s.label}
                  </span>
                  <span className="text-[5.8cqi] font-black tracking-tight text-white mt-0.5 leading-none">
                    {s.val}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom Logos: Flag, League logo, Club badge (Raised & Compacted) */}
          <div className="absolute bottom-[14.0%] left-0 right-0 flex items-center justify-center gap-[3cqi] z-20">
            {/* Country Flag */}
            {resolvedFlag ? (
              <img src={resolvedFlag} alt="Flag" className="w-[7.5cqi] h-[4.5cqi] object-cover rounded-[1px] shadow-sm animate-fadeIn" />
            ) : (
              <div className="w-[7.5cqi] h-[4.5cqi] bg-slate-800 border border-white/20 rounded-[1px] flex items-center justify-center text-[2cqi] font-bold text-white">CL</div>
            )}

            {/* League Logo (Center) */}
            <div className={`w-[7cqi] h-[7cqi] flex items-center justify-center text-[3cqi] font-black rounded-full border ${
              isTOTS ? 'text-cyan-300 border-cyan-500/30 bg-cyan-950/45' : 'text-amber-400 border-amber-500/30 bg-amber-950/45'
            }`}>
              ⚽
            </div>

            {/* Club badge */}
            {clubBadge ? (
              <img src={getImageUrl(clubBadge)} alt="Crest" className="w-[7cqi] h-[7cqi] object-contain" />
            ) : (
              <div className={`w-[7cqi] h-[7cqi] rounded-full border flex items-center justify-center font-display font-black text-[2.5cqi] ${
                isTOTS ? 'bg-cyan-950/45 border-cyan-500/30 text-cyan-300' : 'bg-amber-950/45 border-amber-500/30 text-amber-400'
              }`}>
                SXS
              </div>
            )}
          </div>

        </div>

      </div>

    </CardTilt>
  );
}
