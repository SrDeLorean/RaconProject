import React from 'react';
import Badge from '@/components/ui/Badge';
import Card from '@/components/shared/Card';

export default function Infografia() {
  const topScorers = [
    { rank: 1, name: 'Alonso10', team: 'VAL Esports', goals: 12, matchPlayed: 10 },
    { rank: 2, name: 'Zlatan_FC', team: 'RCN Esports', goals: 10, matchPlayed: 10 },
    { rank: 3, name: 'Dinho_9', team: 'KRN Club', goals: 8, matchPlayed: 10 },
    { rank: 4, name: 'Gavi_Pro', team: 'VAL Esports', goals: 7, matchPlayed: 10 },
  ];

  const topAssists = [
    { rank: 1, name: 'Pedri_Es', team: 'LAT Pro', assists: 8, matchPlayed: 10 },
    { rank: 2, name: 'Dinho_9', team: 'KRN Club', assists: 7, matchPlayed: 10 },
    { rank: 3, name: 'Alonso10', team: 'VAL Esports', assists: 6, matchPlayed: 10 },
    { rank: 4, name: 'Zlatan_FC', team: 'RCN Esports', assists: 5, matchPlayed: 10 },
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
            🔥 Estadísticas & Rendimiento
          </Badge>
          <h1 className="text-5xl md:text-7xl font-display font-extrabold uppercase tracking-tight leading-[0.85] text-foreground">
            INFOGRAFÍA DE LA <span className="text-glow-primary bg-clip-text bg-gradient-to-r from-primary to-destructive text-transparent">LIGA</span>
          </h1>
          <p className="text-sm md:text-base text-muted-foreground font-sans leading-relaxed">
            Descubre los líderes individuales, promedios de gol, asistencias y datos analíticos de la temporada activa.
          </p>
        </div>

        {/* Grid de Líderes */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Máximos Goleadores */}
          <div className="border border-border/50 bg-card/25 backdrop-blur-md rounded-2xl p-6 space-y-4 shadow-lg">
            <h3 className="text-xl font-display font-black text-foreground uppercase tracking-wide flex items-center gap-2">
              ⚽ Máximos Goleadores
            </h3>
            <div className="space-y-3">
              {topScorers.map((s) => (
                <div 
                  key={s.rank} 
                  className="flex items-center justify-between p-3 border border-border/30 rounded-xl bg-muted/10"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-black text-primary text-sm">#{s.rank}</span>
                    <div>
                      <p className="text-sm font-bold text-foreground">{s.name}</p>
                      <p className="text-[10px] text-muted-foreground font-semibold uppercase">{s.team}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-base font-black text-primary tracking-wide font-mono">{s.goals} Goles</p>
                    <p className="text-[9px] text-muted-foreground font-semibold font-mono">{s.matchPlayed} PJ</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Máximos Asistentes */}
          <div className="border border-border/50 bg-card/25 backdrop-blur-md rounded-2xl p-6 space-y-4 shadow-lg">
            <h3 className="text-xl font-display font-black text-foreground uppercase tracking-wide flex items-center gap-2">
              🎯 Líderes de Asistencias
            </h3>
            <div className="space-y-3">
              {topAssists.map((a) => (
                <div 
                  key={a.rank} 
                  className="flex items-center justify-between p-3 border border-border/30 rounded-xl bg-muted/10"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-black text-primary text-sm">#{a.rank}</span>
                    <div>
                      <p className="text-sm font-bold text-foreground">{a.name}</p>
                      <p className="text-[10px] text-muted-foreground font-semibold uppercase">{a.team}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-base font-black text-primary tracking-wide font-mono">{a.assists} Asistencias</p>
                    <p className="text-[9px] text-muted-foreground font-semibold font-mono">{a.matchPlayed} PJ</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Analytics widgets */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="flex flex-col items-center text-center p-6 backdrop-blur-xl border-border/60 shadow-lg hover:border-primary/45 transition-all duration-300 group" withGlow>
            <span className="text-3xl mb-2">📈</span>
            <h4 className="text-technical text-muted-foreground group-hover:text-primary transition-colors">Promedio de Goles</h4>
            <p className="text-3xl font-display font-black text-foreground mt-1">3.4 Goles / Duelo</p>
          </Card>
          <Card className="flex flex-col items-center text-center p-6 backdrop-blur-xl border-border/60 shadow-lg hover:border-primary/45 transition-all duration-300 group" withGlow>
            <span className="text-3xl mb-2">🛡️</span>
            <h4 className="text-technical text-muted-foreground group-hover:text-primary transition-colors">Vallas Invictas</h4>
            <p className="text-3xl font-display font-black text-foreground mt-1">14 Partidos a Cero</p>
          </Card>
          <Card className="flex flex-col items-center text-center p-6 backdrop-blur-xl border-border/60 shadow-lg hover:border-primary/45 transition-all duration-300 group" withGlow>
            <span className="text-3xl mb-2">⚡</span>
            <h4 className="text-technical text-muted-foreground group-hover:text-primary transition-colors">Tarjetas Totales</h4>
            <p className="text-3xl font-display font-black text-foreground mt-1">32 Amonestaciones</p>
          </Card>
        </div>
      </div>
    </div>
  );
}
