import React, { useState } from 'react';
import Badge from '@/components/ui/Badge';

export default function TotwTots() {
  const [activeTab, setActiveTab] = useState('totw');

  const totwPlayers = [
    { pos: 'DEL', name: 'Alonso10', team: 'VAL Esports', rating: '92', color: 'from-amber-400 to-yellow-600', positionGrid: 'top-[15%] left-[25%]' },
    { pos: 'DEL', name: 'Zlatan_FC', team: 'RCN Esports', rating: '94', color: 'from-amber-400 to-yellow-600', positionGrid: 'top-[15%] left-[65%]' },
    { pos: 'MCO', name: 'Dinho_9', team: 'KRN Club', rating: '91', color: 'from-amber-400 to-yellow-600', positionGrid: 'top-[35%] left-[45%]' },
    { pos: 'MC', name: 'Gavi_Pro', team: 'VAL Esports', rating: '89', color: 'from-amber-400 to-yellow-600', positionGrid: 'top-[50%] left-[20%]' },
    { pos: 'MC', name: 'Pedri_Es', team: 'LAT Pro', rating: '90', color: 'from-amber-400 to-yellow-600', positionGrid: 'top-[50%] left-[70%]' },
    { pos: 'MCD', name: 'Casem_14', team: 'AST Squad', rating: '88', color: 'from-amber-400 to-yellow-600', positionGrid: 'top-[60%] left-[45%]' },
    { pos: 'DFI', name: 'Mendy_RC', team: 'RCN Esports', rating: '87', color: 'from-amber-400 to-yellow-600', positionGrid: 'top-[75%] left-[10%]' },
    { pos: 'DFC', name: 'Vanos_4', team: 'KRN Club', rating: '89', color: 'from-amber-400 to-yellow-600', positionGrid: 'top-[75%] left-[33%]' },
    { pos: 'DFC', name: 'Rudig_Es', team: 'VAL Esports', rating: '90', color: 'from-amber-400 to-yellow-600', positionGrid: 'top-[75%] left-[57%]' },
    { pos: 'DFD', name: 'Walker_P', team: 'LAT Pro', rating: '88', color: 'from-amber-400 to-yellow-600', positionGrid: 'top-[75%] left-[80%]' },
    { pos: 'POR', name: 'Courtois', team: 'RCN Esports', rating: '93', color: 'from-amber-400 to-yellow-600', positionGrid: 'top-[90%] left-[45%]' },
  ];

  return (
    <div className="relative min-h-screen bg-background pt-28 pb-16 overflow-hidden">
      
      {/* Fondo Inmersivo */}
      <div 
        className="absolute inset-0 bg-cover bg-center z-0"
        style={{ backgroundImage: "url('https://images.unsplash.com/photo-1511512578047-dfb367046420?q=80&w=1920&auto=format&fit=crop')" }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-background/95 via-background/70 to-background z-10"></div>
      </div>

      {/* Resplandor ambiental e-sports */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[350px] md:w-[600px] h-[350px] md:h-[600px] bg-primary/20 blur-[120px] rounded-full pointer-events-none z-10 animate-pulse-glow"></div>

      <div className="relative z-20 max-w-7xl mx-auto px-6 lg:px-10 space-y-12">
        <div className="text-center max-w-2xl mx-auto space-y-4">
          <Badge 
            variant="primary"
            className="px-4 py-1.5 text-xs font-condensed tracking-widest text-primary border-primary/30 bg-primary/10 rounded-full animate-pulse-glow"
          >
            🔥 Equipo Ideal
          </Badge>
          <h1 className="text-5xl md:text-7xl font-display font-extrabold uppercase tracking-tight leading-[0.85] text-foreground">
            TOTW & <span className="text-glow-primary bg-clip-text bg-gradient-to-r from-primary to-destructive text-transparent">TOTS ELITE</span>
          </h1>
          <p className="text-sm md:text-base text-muted-foreground font-sans leading-relaxed">
            Conoce a los once jugadores más determinantes de la semana y de la temporada en nuestro Salón de la Fama.
          </p>
        </div>

        <div className="flex justify-center">
          <div className="flex gap-1 bg-muted/40 p-1 rounded-lg border border-border/40 overflow-x-auto">
            {[
              { id: 'totw', label: '⭐ Team of the Week (TOTW)' },
              { id: 'tots', label: '🔥 Team of the Season (TOTS)' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-5 py-2.5 rounded-md text-xs font-bold whitespace-nowrap transition-all duration-200 ${
                  activeTab === tab.id 
                    ? 'bg-background text-primary shadow-sm border border-border/40' 
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Soccer Pitch Visualizer */}
        <div className="relative w-full max-w-[700px] h-[650px] mx-auto border border-border/60 bg-gradient-to-b from-emerald-950/20 to-slate-950/65 rounded-3xl overflow-hidden shadow-2xl p-6 backdrop-blur-md">
          {/* Pitch markings */}
          <div className="absolute inset-4 border border-border/20 rounded-2xl pointer-events-none">
            <div className="absolute top-1/2 left-0 right-0 h-px bg-border/20"></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-28 h-28 border border-border/20 rounded-full"></div>
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-44 h-16 border-b border-x border-border/20"></div>
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-44 h-16 border-t border-x border-border/20"></div>
          </div>

          {/* Players Overlay */}
          <div className="absolute inset-0">
            {totwPlayers.map((p, idx) => (
              <div 
                key={idx} 
                className={`absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-1 cursor-pointer transition-transform duration-300 hover:scale-110 ${p.positionGrid}`}
              >
                <div className={`w-14 h-18 rounded-lg bg-gradient-to-b ${p.color} border border-yellow-300/40 p-1.5 flex flex-col justify-between items-center text-center shadow-[0_0_15px_rgba(245,158,11,0.2)] hover:shadow-[0_0_20px_rgba(245,158,11,0.5)] transition-all duration-300`}>
                  <span className="text-[10px] font-black text-slate-950">{p.rating}</span>
                  <span className="text-[8px] font-bold text-slate-950 uppercase leading-none truncate max-w-full font-mono">{p.pos}</span>
                  <span className="text-[8px] bg-slate-950/15 rounded px-1 text-slate-950 font-semibold">{p.team.substring(0, 3)}</span>
                </div>
                <span className="text-[10px] font-black bg-slate-950/80 backdrop-blur-sm text-foreground px-2 py-0.5 rounded-full border border-border/40 uppercase tracking-wide shadow-sm max-w-[90px] truncate">
                  {p.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
