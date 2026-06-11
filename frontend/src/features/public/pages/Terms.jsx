import React from 'react';
import { Link } from 'react-router-dom';
import useScrollAnimations from '@/hooks/useScrollAnimations';

export default function Terms() {
  useScrollAnimations();

  return (
    <div className="min-h-[80vh] relative pt-24 pb-20 px-6 sm:px-10 max-w-[90rem] mx-auto text-foreground overflow-hidden">
      
      {/* Background Effects */}
      <div className="absolute top-0 inset-x-0 h-96 bg-gradient-to-b from-primary/10 to-transparent pointer-events-none -z-10" />
      <div className="ambient-glow-primary top-20 right-0 opacity-20 w-96 h-96" />

      {/* Header */}
      <div className="text-center max-w-4xl mx-auto mb-16 animate-drum-roll">
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-display font-black tracking-widest uppercase mb-4 text-glow-primary">
          Términos de Uso y <span className="text-foreground">Privacidad</span>
        </h1>
        <p className="text-muted-foreground font-sans text-sm sm:text-base leading-relaxed">
          Las reglas del juego, políticas de competición y el manejo de tus datos en Torneos Pro FC.
        </p>
      </div>

      <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10">
        
        {/* Índice Lateral */}
        <div className="lg:col-span-3 hidden lg:block">
          <div className="sticky top-28 filter-panel glass-card space-y-4">
            <h3 className="text-amc-title text-sm mb-4 border-b border-border/50 pb-2">Índice</h3>
            <ul className="space-y-3 font-condensed font-semibold tracking-wider text-xs">
              <li><a href="#terminos" className="text-muted-foreground hover:text-primary transition-colors">1. Términos de Uso</a></li>
              <li><a href="#conducta" className="text-muted-foreground hover:text-primary transition-colors">2. Código de Conducta</a></li>
              <li><a href="#privacidad" className="text-muted-foreground hover:text-primary transition-colors">3. Política de Privacidad</a></li>
              <li><a href="#datos" className="text-muted-foreground hover:text-primary transition-colors">4. Uso de Datos y Cookies</a></li>
              <li><a href="#contacto" className="text-muted-foreground hover:text-primary transition-colors">5. Contacto Legal</a></li>
            </ul>
          </div>
        </div>

        {/* Contenido Principal */}
        <div className="lg:col-span-9 space-y-12 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
          
          {/* Términos de Uso */}
          <section id="terminos" className="glass-card p-8 sm:p-10 animate-fade-in-up">
            <div className="flex items-center gap-3 mb-6">
              <span className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center text-primary border border-primary/30">⚖️</span>
              <h2 className="text-2xl font-display font-bold uppercase tracking-wide">1. Términos de Uso</h2>
            </div>
            <div className="space-y-4 text-description">
              <p>
                Al acceder y utilizar <strong>Torneos Pro FC</strong> (en adelante, "la Plataforma"), aceptas cumplir y quedar vinculado por estos Términos de Uso. La Plataforma proporciona servicios digitales de gestión de torneos, recopilación de estadísticas y organización de ligas competitivas en formatos como 11v11 y Ultimate Team (UT).
              </p>
              <p>
                <strong>1.1. Elegibilidad:</strong> Debes ser mayor de 13 años para registrarte. Si eres menor de la mayoría de edad legal en tu jurisdicción, debes contar con el consentimiento verificable de tus padres o tutores legales.
              </p>
              <p>
                <strong>1.2. Modificación del Servicio:</strong> Nos reservamos el derecho exclusivo de modificar, suspender o discontinuar, temporal o permanentemente, cualquier parte del servicio con o sin previo aviso. No seremos responsables ante ti ni ante terceros por ninguna modificación o suspensión.
              </p>
              <p>
                <strong>1.3. Propiedad Intelectual:</strong> Torneos Pro FC no está afiliado, patrocinado ni respaldado por Electronic Arts Inc. (EA). "EA SPORTS FC", "Ultimate Team" y los activos relacionados son marcas comerciales de sus respectivos propietarios. Todo el contenido original, interfaces y bases de datos creadas por Torneos Pro FC son propiedad exclusiva de la Plataforma.
              </p>
            </div>
          </section>

          {/* Código de Conducta */}
          <section id="conducta" className="glass-card p-8 sm:p-10 animate-fade-in-up">
            <div className="flex items-center gap-3 mb-6">
              <span className="w-10 h-10 rounded-lg bg-warning/20 flex items-center justify-center text-warning border border-warning/30">🛡️</span>
              <h2 className="text-2xl font-display font-bold uppercase tracking-wide">2. Código de Conducta y Fair Play</h2>
            </div>
            <div className="space-y-4 text-description">
              <p>
                El respeto y la competitividad sana son los pilares fundamentales de nuestra comunidad. Cualquier usuario u organización que vulnere este código estará sujeto a sanciones inmediatas, incluyendo el <strong>baneo permanente</strong> y la eliminación de todo su historial estadístico.
              </p>
              <ul className="list-disc list-inside space-y-2 ml-2">
                <li><strong>Integridad Competitiva:</strong> Queda estrictamente prohibido el uso de <em>glitches</em>, <em>exploits</em>, <em>hacks</em> o cualquier software de terceros que altere el funcionamiento original del juego para obtener ventajas ilegítimas.</li>
                <li><strong>Comportamiento en la Comunidad:</strong> Tolerancia cero ante discursos de odio, acoso, amenazas, xenofobia, racismo, homofobia o cualquier forma de discriminación en nuestros servidores de Discord, foros o chats internos.</li>
                <li><strong>Manipulación de Resultados (Match-Fixing):</strong> Acordar empates, dejarse perder intencionalmente o falsificar reportes de resultados es una infracción gravísima.</li>
                <li><strong>Fraude de Identidad:</strong> Crear múltiples cuentas (<em>smurfing</em> / multicuentas) para evadir suspensiones o manipular el mercado de fichajes interno resultará en la expulsión de todas las cuentas vinculadas.</li>
              </ul>
            </div>
          </section>

          {/* Política de Privacidad */}
          <section id="privacidad" className="glass-card p-8 sm:p-10 animate-fade-in-up">
            <div className="flex items-center gap-3 mb-6">
              <span className="w-10 h-10 rounded-lg bg-info/20 flex items-center justify-center text-info border border-info/30">🔒</span>
              <h2 className="text-2xl font-display font-bold uppercase tracking-wide">3. Política de Privacidad (GDPR)</h2>
            </div>
            <div className="space-y-4 text-description">
              <p>
                En cumplimiento con las normativas internacionales de protección de datos (incluyendo el Reglamento General de Protección de Datos - GDPR), detallamos cómo recopilamos y resguardamos tu información personal:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-2">
                <li><strong>Datos Recopilados:</strong> Información de registro (Nombre, Correo Electrónico encriptado), Identidad Gamer (PSN ID, Xbox Gamertag, EA ID) y registros de actividad en la plataforma (IP y timestamps de inicio de sesión por motivos de seguridad).</li>
                <li><strong>Uso de la Información:</strong> Los datos deportivos (goles, asistencias, MVPs, valoraciones) y los IDs públicos se utilizan exclusivamente para conformar las tablas de clasificación, perfiles públicos de jugador y emparejamientos competitivos. El correo electrónico se utiliza <strong>únicamente</strong> para recuperación de cuentas y notificaciones críticas del sistema.</li>
                <li><strong>Retención de Datos:</strong> Tus datos se mantendrán en nuestras bases mientras tu cuenta permanezca activa. Si decides cerrar tu cuenta, la información personal se eliminará irreversiblemente en un plazo de 30 días, conservando los datos estadísticos deportivos de forma anonimizada para preservar la integridad histórica de las competiciones.</li>
                <li><strong>No Comercialización:</strong> <strong>Bajo ninguna circunstancia</strong> venderemos, alquilaremos ni compartiremos tu información personal o dirección de correo electrónico a terceros, anunciantes o agencias externas.</li>
              </ul>
            </div>
          </section>

          {/* Uso de Datos y Cookies */}
          <section id="datos" className="glass-card p-8 sm:p-10 animate-fade-in-up">
            <div className="flex items-center gap-3 mb-6">
              <span className="w-10 h-10 rounded-lg bg-success/20 flex items-center justify-center text-success border border-success/30">🍪</span>
              <h2 className="text-2xl font-display font-bold uppercase tracking-wide">4. Uso de Cookies y Tecnologías Similares</h2>
            </div>
            <div className="space-y-4 text-description">
              <p>
                Utilizamos cookies de origen (first-party cookies) estrictamente necesarias para el correcto funcionamiento de la plataforma web:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-2">
                <li><strong>Cookies de Autenticación (JWT):</strong> Permiten mantener tu sesión abierta de forma segura a través de tokens encriptados.</li>
                <li><strong>Cookies de Preferencias:</strong> Recuerdan configuraciones de interfaz de usuario, tales como la selección de Tema (Modo Claro/Oscuro) y la pestaña por defecto (11v11 vs Ultimate Team) para evitar redibujados innecesarios.</li>
              </ul>
              <p>
                Al navegar e iniciar sesión en Torneos Pro FC, consientes el almacenamiento de estas cookies esenciales. Puedes eliminar estas cookies borrando el caché y los datos de almacenamiento local de tu navegador, aunque esto cerrará tu sesión activa.
              </p>
            </div>
          </section>

          {/* Contacto Legal */}
          <section id="contacto" className="glass-card p-8 sm:p-10 animate-fade-in-up">
            <div className="flex items-center gap-3 mb-6">
              <span className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center text-primary border border-primary/30">✉️</span>
              <h2 className="text-2xl font-display font-bold uppercase tracking-wide">5. Contacto y Derechos ARCO</h2>
            </div>
            <div className="space-y-4 text-description">
              <p>
                Como usuario registrado, tienes derecho al Acceso, Rectificación, Cancelación y Oposición (Derechos ARCO) respecto a tus datos personales. Para ejercer estos derechos, solicitar la eliminación permanente de tu cuenta, o apelar una sanción disciplinaria, contacta directamente con la Administración General mediante:
              </p>
              <div className="flex flex-col sm:flex-row gap-4 mt-4">
                <div className="bg-background/50 border border-border/50 p-4 rounded-xl flex-1">
                  <span className="block text-foreground font-condensed tracking-wider text-xs uppercase mb-1">Soporte Directo (Recomendado):</span>
                  <a href="https://discord.gg/FGN8tdam56" target="_blank" rel="noreferrer" className="text-primary hover:text-primary/80 font-bold transition-colors text-lg flex items-center gap-2">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189Z"/></svg>
                    discord.gg/FGN8tdam56
                  </a>
                </div>
                <div className="bg-background/50 border border-border/50 p-4 rounded-xl flex-1">
                  <span className="block text-foreground font-condensed tracking-wider text-xs uppercase mb-1">Correo Electrónico (Legal):</span>
                  <a href="mailto:legal@torneosprofc.com" className="text-primary hover:text-primary/80 font-bold transition-colors text-lg flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
                    legal@torneosprofc.com
                  </a>
                </div>
              </div>
            </div>
          </section>

          <div className="text-center pt-8 border-t border-border/30">
            <p className="text-xs text-muted-foreground font-condensed tracking-widest uppercase">
              Última actualización: Junio 2026
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}
