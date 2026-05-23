import { Link } from 'react-router-dom';
import Button from '@/components/shared/Button';
import Badge from '@/components/shared/Badge';

export default function Home() {
  return (
    <div className="relative min-h-[calc(100vh-80px)] flex flex-col items-center justify-center overflow-hidden bg-background">
      
      {/* Fondo Inmersivo */}
      <div 
        className="absolute inset-0 bg-cover bg-center z-0"
        style={{ backgroundImage: "url('https://images.unsplash.com/photo-1511886929837-354d827aae26?q=80&w=1920&auto=format&fit=crop')" }}
      >
        {/* Gradiente dramático para fundir la imagen con el fondo oscuro del nuevo CSS */}
        <div className="absolute inset-0 bg-gradient-to-b from-background/95 via-background/80 to-background z-10"></div>
      </div>

      {/* Foco de luz rojo sutil de fondo */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] md:w-[600px] h-[300px] md:h-[600px] bg-primary/20 blur-[100px] md:blur-[150px] rounded-full pointer-events-none z-10"></div>

      {/* Contenido Central */}
      <div className="relative z-20 text-center px-4 md:px-8 max-w-4xl mx-auto flex flex-col items-center mt-10 md:mt-0">
        
        {/* Insignia Premium: delegada al componente Shared */}
        <Badge 
          className="mb-6 px-4 py-1.5 text-xs md:text-sm font-sans font-bold uppercase tracking-widest text-primary border-primary/30 bg-primary/10 rounded-full"
        >
          La Evolución de los e-Sports
        </Badge>

        {/* Titular Principal: Usando la nueva tipografía "Display" */}
        <h1 className="text-4xl md:text-6xl lg:text-7xl font-display font-extrabold text-foreground mb-6 uppercase tracking-tighter leading-tight">
          Gestiona tus Torneos <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-destructive">
            Nivel Dios en FC26
          </span>
        </h1>

        <p className="text-base md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto font-sans leading-relaxed">
          La plataforma definitiva para crear ligas, gestionar plantillas independientes y reportar resultados sin fricciones. Construida para Organizadores y Jugadores de élite.
        </p>

        {/* Botones de Acción: Delegados al motor de interacción Shared */}
        <div className="flex flex-col sm:flex-row w-full sm:w-auto justify-center gap-4">
          <Link to="/torneos" className="w-full sm:w-auto">
            <Button 
              variant="default"
              className="w-full h-auto py-4 px-8 text-sm md:text-base font-bold uppercase tracking-wide hover:shadow-[0_0_20px_hsla(var(--primary),0.5)] transition-all duration-300"
            >
              Explorar Torneos
            </Button>
          </Link>
          
          <Link to="/login" className="w-full sm:w-auto">
            <Button 
              variant="outline"
              className="w-full h-auto py-4 px-8 text-sm md:text-base font-bold uppercase tracking-wide border-border text-foreground hover:border-primary hover:bg-primary/10 transition-all duration-300"
            >
              Acceder al Panel
            </Button>
          </Link>
        </div>

      </div>
    </div>
  );
}