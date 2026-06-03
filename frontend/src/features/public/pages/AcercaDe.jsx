import React from 'react';
import Badge from '@/components/ui/Badge';
import Card from '@/components/shared/Card';

export default function AcercaDe() {
  return (
    <div className="relative min-h-screen bg-background pb-16 overflow-hidden text-foreground">
      {/* Resplandores ambientales e-sports */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[350px] md:w-[600px] h-[350px] md:h-[600px] bg-primary/8 blur-[130px] rounded-full pointer-events-none z-10"></div>
      <div className="absolute bottom-1/3 right-1/4 w-[300px] md:w-[500px] h-[300px] md:h-[500px] bg-primary/5 blur-[120px] rounded-full pointer-events-none z-10"></div>

      {/* ========================================================================= */}
      {/* 1. HERO CENTRAL (Cinemático y Táctico)                                    */}
      {/* ========================================================================= */}
      <section className="relative z-20 max-w-7xl mx-auto px-6 lg:px-10 pt-32 md:pt-40 pb-16 overflow-hidden">
        
        {/* Palabras de fondo brush estilo editorial */}
        <div className="absolute inset-0 pointer-events-none select-none overflow-hidden z-0">
          <span className="absolute top-10 left-10 text-[9rem] md:text-[14rem] font-display font-black uppercase text-foreground/[0.015] dark:text-foreground/[0.025] blur-[2px] float-brush-1">
            RACON PRO
          </span>
          <span className="absolute bottom-10 right-20 text-[9rem] md:text-[14rem] font-display font-black uppercase text-foreground/[0.015] dark:text-foreground/[0.025] blur-[3px] float-brush-2">
            NOSOTROS
          </span>
          <span className="absolute top-1/2 left-1/3 -translate-y-1/2 text-[10rem] md:text-[15rem] font-display font-black uppercase text-foreground/[0.01] dark:text-foreground/[0.02] blur-[4px]">
            ESPORTS
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-10 gap-12 lg:gap-16 items-center relative z-10">
          
          {/* LADO IZQUIERDO — IMPACTO PRINCIPAL */}
          <div className="lg:col-span-7 relative flex flex-col items-start gap-4">
            
            {/* Número gigante transparente de fondo */}
            <div className="absolute -top-16 -left-12 text-[15rem] md:text-[23rem] font-display font-black text-foreground/[0.035] dark:text-foreground/[0.045] select-none leading-none pointer-events-none font-extrabold tracking-tighter">
              11
            </div>

            <Badge 
              variant="primary" 
              className="animate-fade-in-up px-5 py-2 text-[10px] font-condensed tracking-[0.2em] text-primary border border-primary/30 bg-primary/10 rounded-full shadow-[0_0_20px_hsla(var(--primary),0.15)] uppercase animate-pulse shrink-0 z-10"
            >
              🛡️ Nuestra Identidad Competitiva
            </Badge>

            <h1 className="animate-fade-in-up text-6xl sm:text-8xl md:text-9xl font-display font-black text-foreground uppercase tracking-[0.01em] leading-[0.82] drop-shadow-2xl z-10 mt-2 select-none" style={{ animationDelay: '0.1s' }}>
              QUIÉNES <br />
              <span className="text-primary tracking-tight font-black shimmer-text">
                SOMOS.
              </span>
            </h1>

            <p className="animate-fade-in-up text-xs md:text-sm text-muted-foreground font-sans max-w-xl leading-relaxed tracking-wide font-light z-10 mt-2" style={{ animationDelay: '0.2s' }}>
              Racon Pro es la plataforma federativa y tecnológica de referencia para el circuito de Clubes Virtuales eSports. Diseñamos, administramos y transmitimos competiciones oficiales con telemetría avanzada y estadísticas en tiempo real.
            </p>
          </div>

          {/* DERECHA — INFORMACIÓN TÁCTICA */}
          <div className="lg:col-span-3 flex flex-col justify-center items-start lg:items-stretch gap-6 z-10 animate-fade-in-up" style={{ animationDelay: '0.15s' }}>
            <div className="border border-border/40 bg-white/90 dark:bg-card/85 backdrop-blur-md rounded-2xl p-6 w-full space-y-4 shadow-xl">
              
              <div className="flex justify-between items-center border-b border-border/30 pb-3">
                <span className="text-[9px] sm:text-[10px] font-condensed tracking-widest text-muted-foreground uppercase">TELEMETRÍA R-PRO</span>
                <span className="text-[9px] sm:text-[10px] font-mono text-primary font-bold">ABOUT US</span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-[8px] sm:text-[9px] font-condensed text-muted-foreground uppercase tracking-widest leading-none">CIRCUITOS</h4>
                  <span className="text-xl sm:text-2xl md:text-3xl font-display font-black text-foreground">16+</span>
                </div>
                <div>
                  <h4 className="text-[8px] sm:text-[9px] font-condensed text-muted-foreground uppercase tracking-widest leading-none">JUGADORES</h4>
                  <span className="text-xl sm:text-2xl md:text-3xl font-display font-black text-primary">11K</span>
                </div>
              </div>

              <p className="text-[11px] text-muted-foreground leading-relaxed font-sans font-light">
                Infraestructura digital diseñada para dar soporte a torneos de Pro Clubs, seguimiento de fichajes y administración de clubes.
              </p>

              <a 
                href="https://discord.gg/raconpro" 
                target="_blank" 
                rel="noreferrer" 
                className="w-full text-center py-4 text-xs font-condensed tracking-widest uppercase rounded-lg text-primary-foreground font-black cursor-pointer btn-glossy block"
              >
                UNIRSE A LA COMUNIDAD
              </a>
            </div>
          </div>

        </div>

      </section>

      {/* ========================================================================= */}
      {/* 2. ÁREA DE CONTENIDO PRINCIPAL                                           */}
      {/* ========================================================================= */}
      <div className="relative z-20 max-w-7xl mx-auto px-6 lg:px-10 space-y-12">
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          
          {/* Columna Izquierda: Nuestra Misión y Valores */}
          <div className="lg:col-span-1 space-y-6 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            <div className="border border-border/50 dark:border-white/[0.06] bg-white/60 dark:bg-card/75 backdrop-blur-md rounded-2xl p-6 space-y-5 shadow-lg">
              <h3 className="text-xl font-display font-black text-foreground uppercase tracking-wide">
                Nuestra Misión
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Empoderar a las comunidades competitivas de Clubes Virtuales proveyendo herramientas tecnológicas de alto nivel para organizar, disputar y registrar encuentros deportivos de forma automatizada y transparente.
              </p>
              
              <div className="space-y-3 pt-2">
                <h4 className="text-xs font-condensed font-black uppercase text-foreground tracking-wider">
                  Valores Competitivos
                </h4>
                <div className="space-y-3 text-xs">
                  <div className="p-3 border border-border/30 dark:border-white/[0.05] rounded-xl bg-muted/10">
                    <span className="text-[10px] text-primary font-bold uppercase tracking-wider block">🛡️ Transparencia</span>
                    <p className="text-muted-foreground text-[11px] mt-0.5">Sistemas de reportes verificados e historial inmutable de estadísticas de jugador.</p>
                  </div>
                  <div className="p-3 border border-border/30 dark:border-white/[0.05] rounded-xl bg-muted/10">
                    <span className="text-[10px] text-primary font-bold uppercase tracking-wider block">⚽ Comunidad</span>
                    <p className="text-muted-foreground text-[11px] mt-0.5">Unimos a ligas y confederaciones bajo un mismo ecosistema integrado.</p>
                  </div>
                  <div className="p-3 border border-border/30 dark:border-white/[0.05] rounded-xl bg-muted/10">
                    <span className="text-[10px] text-primary font-bold uppercase tracking-wider block">📈 Innovación</span>
                    <p className="text-muted-foreground text-[11px] mt-0.5">Telemetría de transmisiones e infografías automáticas de rendimiento.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Columna Derecha: Historia e Infraestructura */}
          <div className="lg:col-span-2 space-y-6 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            <div className="border border-border/50 dark:border-white/[0.06] bg-white/60 dark:bg-card/75 backdrop-blur-md rounded-2xl p-8 space-y-6 shadow-lg relative overflow-hidden">
              <h3 className="text-2xl font-display font-black text-foreground uppercase tracking-wide border-b border-border/40 pb-3">
                Nuestra Historia
              </h3>
              
              <div className="space-y-4 text-xs md:text-sm text-muted-foreground leading-relaxed font-light">
                <p>
                  Racon Pro nació de la necesidad de profesionalizar el formato de **Clubes Virtuales** (Pro Clubs) en Latinoamérica y España. Lo que comenzó como un sistema simple de registro de marcadores se convirtió rápidamente en un ecosistema robusto de torneos, fichajes y visualización en tiempo real.
                </p>
                <p>
                  Gracias al apoyo de comunidades destacadas como **Comunidad AMC**, **Espacio Gamer** y organizadores independientes, hemos unificado a miles de deportistas electrónicos bajo una plataforma común de alto rendimiento.
                </p>
                <p>
                  Hoy en día, proporcionamos a los organizadores paneles avanzados de auditoría, gestión de temporadas y control administrativo. A los jugadores, les ofrecemos un perfil profesional dinámico con dorsal oficial, historial de traspasos y clasificaciones de rendimiento individuales (TOTW y TOTS).
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                <Card className="p-4 border border-border/40 dark:border-white/[0.05] hover:border-primary/20 transition-all">
                  <span className="text-2xl">⚡</span>
                  <h4 className="font-display font-black text-sm uppercase text-foreground mt-2">Tecnología de Punta</h4>
                  <p className="text-[11px] text-muted-foreground mt-1 leading-normal">
                    Servidores optimizados y base de datos relacional para procesar actas de partidos y estadísticas al instante.
                  </p>
                </Card>
                <Card className="p-4 border border-border/40 dark:border-white/[0.05] hover:border-primary/20 transition-all">
                  <span className="text-2xl">🏆</span>
                  <h4 className="font-display font-black text-sm uppercase text-foreground mt-2">Circuito Unificado</h4>
                  <p className="text-[11px] text-muted-foreground mt-1 leading-normal">
                    Ligas y Copas estructuradas bajo un reglamento estándar de cumplimiento para asegurar un juego justo.
                  </p>
                </Card>
              </div>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
