import React from 'react';

/**
 * Helper to resolve dynamic eSports stats based on player position/role.
 * GK (Portero): Estirada, Reflejos, Saque, Posicionamiento, Reflejos 1v1, Anticipación.
 * DEF (Defensa): Entradas, Marcaje, Intercepciones, Fuerza, Agresividad, Juego Aéreo.
 * MID (Mediocampista): Visión, Pases Clave, Regate, Control de Balón, Resistencia, Pases Largos.
 * DEL (Delantero): Definición, Desmarque, Potencia de Tiro, Aceleración, Agilidad, Voleas.
 */
export function getPlayerRoleStats(position = 'MC', ratingVal = 85, stats = {}, idx = 0) {
  const pos = position.toUpperCase();
  const baseRating = ratingVal || 85;

  if (['GK', 'PO', 'ARQ'].includes(pos)) {
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

  if (['MC', 'MCD', 'MCO', 'MVs', 'MC1', 'MC2'].includes(pos)) {
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

  // Delantero (DC, ST, EI, ED, DEL, DEL1, DEL2, DEL3)
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
    theme = 'totw', // champions-league | totw | gold | icon
  } = player;

  const activePosition = position || pos || 'MC';
  const displayImage = playerImage || (foto ? (foto.startsWith('http') ? foto : `http://localhost:8000${foto}`) : null);

  // Dynamic statistics mapping by player position
  const resolvedStats = getPlayerRoleStats(activePosition, rating, player.stats || {}, id);

  const themeStyles = {
    'champions-league': {
      card: 'bg-gradient-to-br from-indigo-950 via-slate-950 to-cyan-950 shadow-[0_0_20px_rgba(99,102,241,0.25)]',
      border: 'border-indigo-400',
      textRating: 'text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]',
      textName: 'text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]',
      textStats: 'text-cyan-400 font-bold',
      glow: 'shadow-indigo-500/40',
      stroke: '#6366f1'
    },
    'totw': {
      card: 'bg-gradient-to-br from-neutral-950 via-neutral-900 to-neutral-950 shadow-[0_0_25px_rgba(245,158,11,0.25)]',
      border: 'border-amber-400',
      textRating: 'text-amber-400 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]',
      textName: 'text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]',
      textStats: 'text-amber-500 font-bold',
      glow: 'shadow-amber-500/40',
      stroke: '#f59e0b'
    },
    'gold': {
      card: 'bg-gradient-to-br from-amber-700 via-yellow-600 to-amber-900 shadow-[0_0_20px_rgba(245,158,11,0.2)]',
      border: 'border-yellow-400',
      textRating: 'text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]',
      textName: 'text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]',
      textStats: 'text-yellow-300 font-bold',
      glow: 'shadow-yellow-500/30',
      stroke: '#eab308'
    },
    'icon': {
      card: 'bg-gradient-to-br from-neutral-100 via-stone-200 to-neutral-100 shadow-[0_0_20px_rgba(245,158,11,0.3)]',
      border: 'border-amber-400',
      textRating: 'text-slate-900 drop-shadow-[0_1px_2px_rgba(255,255,255,0.8)]',
      textName: 'text-slate-950 font-bold drop-shadow-[0_1px_2px_rgba(255,255,255,0.8)]',
      textStats: 'text-amber-600 font-bold',
      glow: 'shadow-amber-600/40',
      stroke: '#b45309'
    }
  };

  const currentTheme = themeStyles[theme] || themeStyles['totw'];

  // FUT Card shield polygon clip-path matching Image 2 TOTW exactly
  const shieldClipPath = {
    clipPath: 'polygon(16% 5%, 50% 0%, 84% 5%, 100% 16%, 100% 82%, 50% 100%, 0% 82%, 0% 16%)'
  };

  const displayDorsal = player.dorsal || (player.contrato_activo?.dorsal) || id || 10;

  return (
    <div 
      className={`group relative w-full aspect-[5/7] select-none overflow-hidden transition-all duration-300 ${
        disableHover 
          ? '' 
          : 'hover:-translate-y-2 hover:scale-[1.02] active:scale-98'
      } ${currentTheme.card} ${className}`}
      style={shieldClipPath}
    >
      {/* Glare shine reflection overlay */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 bg-gradient-to-tr from-transparent via-white/10 to-transparent transition-opacity duration-500 pointer-events-none z-30" />

      {/* Premium SVG Shield Border Overlay to prevent clip-path clipping of standard borders */}
      <svg 
        className="absolute inset-0 w-full h-full pointer-events-none z-30" 
        viewBox="0 0 100 140" 
        preserveAspectRatio="none"
      >
        <polygon 
          points="16,7.8 50,0.8 84,7.8 99.2,22.8 99.2,114.2 50,139.2 0.8,114.2 0.8,22.8" 
          fill="none" 
          stroke={currentTheme.stroke} 
          strokeWidth="2" 
        />
      </svg>

      <div className="w-full h-full relative z-10">
        
        {/* Top-Left Section: Absolute Wrapper flex column layout to prevent overlap */}
        <div className="absolute top-4 left-4 flex flex-col items-center gap-1.5 leading-none font-mono z-20 shrink-0 select-none">
          <span className={`text-3.5xl font-black tracking-tight ${currentTheme.textRating}`}>
            {rating}
          </span>
          <span className="text-[9px] font-bold text-amber-500 uppercase tracking-widest border-b border-amber-500/20 pb-0.5 w-full text-center">
            {activePosition}
          </span>

          {/* Dorsal Number Badge */}
          <span className="text-[10px] font-black text-white/90 bg-slate-950/70 border border-amber-500/20 px-1.5 py-0.5 rounded shadow-sm mt-0.5">
            #{displayDorsal}
          </span>

          {/* Country Flag */}
          {countryFlag ? (
            <img 
              src={countryFlag} 
              alt="Flag" 
              className="w-4 h-2.5 object-cover rounded shadow-sm mt-0.5" 
            />
          ) : (
            <div className="w-4 h-2.5 bg-sky-600 rounded mt-0.5 opacity-30 shadow-inner flex items-center justify-center text-[4px] text-white">CL</div>
          )}

          {/* Club Badge */}
          {clubBadge ? (
            <img 
              src={clubBadge} 
              alt="Club" 
              className="w-5 h-5 object-contain mt-0.5 drop-shadow" 
            />
          ) : (
            <div className="w-5 h-5 rounded-full bg-slate-900 border border-amber-500/20 flex items-center justify-center font-display font-extrabold text-[7px] text-amber-500">SXS</div>
          )}
        </div>

        {/* Center/Right Section: Cropped Player Avatar with strict bounds */}
        <div className="absolute right-[-10px] top-[10px] w-[70%] h-[72%] z-10 flex items-end justify-center overflow-hidden pointer-events-none">
          {displayImage ? (
            <img 
              src={displayImage} 
              alt={name} 
              className="max-h-[100%] max-w-[110%] object-cover object-center drop-shadow-[0_6px_10px_rgba(0,0,0,0.65)] translate-y-1 group-hover:scale-105 transition-all duration-300"
            />
          ) : (
            // Silhouette Fallback
            <div className="absolute inset-0 flex items-center justify-center opacity-[0.06] select-none text-9xl font-black uppercase text-white font-sans">
              {name.charAt(0)}
            </div>
          )}
        </div>

        {/* Bottom Section: absolute bottom-0 w-full black gradient footer */}
        <div className="absolute bottom-0 left-0 w-full pb-4 pt-10 px-4 bg-gradient-to-t from-black/95 via-black/60 to-transparent z-20 text-center flex flex-col justify-end">
          
          {/* Player Name */}
          <h4 className={`text-center text-base font-black uppercase tracking-wider mb-1 w-full truncate ${currentTheme.textName}`}>
            {name.substring(0, 14)}
          </h4>

          {/* Stats Divider Line */}
          <div className="border-t border-amber-500/20 mb-1.5 w-[85%] mx-auto" />

          {/* Posición Ideal Box */}
          <div className="flex flex-col items-center justify-center">
            <span className="text-[7px] text-muted-foreground uppercase tracking-widest font-mono leading-none">
              Posición Ideal
            </span>
            <span className="text-[11px] font-black text-amber-400 uppercase tracking-widest font-mono mt-0.5 leading-none">
              {resolvedStats.role}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
