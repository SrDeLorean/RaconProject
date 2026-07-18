import { useEffect } from 'react';

export default function useScrollAnimations() {
  useEffect(() => {
    let observer = null;

    // Pequeño delay de 100ms para permitir que React termine de renderizar y calcular dimensiones
    const timer = setTimeout(() => {
      const animatedElements = document.querySelectorAll(
        '.animate-drum-roll, .animate-fade-in-up, .animate-fade-in, .animate-slide-down'
      );

      observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          // Obtener la clase de animación
          const classes = Array.from(entry.target.classList);
          const animClass = classes.find(c => 
            ['animate-drum-roll', 'animate-fade-in-up', 'animate-fade-in', 'animate-slide-down'].includes(c)
          );

          // Guardar clase original si no está guardada
          if (animClass && !entry.target.dataset.animClass) {
            entry.target.dataset.animClass = animClass;
          }

          const targetAnimClass = entry.target.dataset.animClass || animClass;
          if (!targetAnimClass) return;

          // Robustez: Verificar si el elemento está por encima del final de la pantalla (above the fold)
          const rect = entry.target.getBoundingClientRect();
          const isAboveFold = rect.top < window.innerHeight && rect.bottom > 0;

          if (entry.isIntersecting || isAboveFold) {
            // Hacer visible y activar animación
            entry.target.style.visibility = 'visible';
            entry.target.classList.add(targetAnimClass);
            // Dejar de observar para evitar repeticiones
            observer.unobserve(entry.target);
          } else {
            // Solo ocultar si realmente está por debajo del scroll inicial
            entry.target.style.visibility = 'hidden';
            entry.target.classList.remove(targetAnimClass);
          }
        });
      }, { 
        threshold: 0.05,
        rootMargin: '0px 0px -20px 0px' 
      });

      animatedElements.forEach((el) => {
        observer.observe(el);
      });
    }, 100);

    return () => {
      clearTimeout(timer);
      if (observer) {
        observer.disconnect();
      }
    };
  }, []); // Se ejecuta una vez al montar el componente
}
