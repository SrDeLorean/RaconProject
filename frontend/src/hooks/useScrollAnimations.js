import { useEffect } from 'react';

export default function useScrollAnimations() {
  useEffect(() => {
    // Select elements that have entrance animation classes
    const animatedElements = document.querySelectorAll(
      '.animate-drum-roll, .animate-fade-in-up, .animate-fade-in, .animate-slide-down'
    );

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        // Find which animation class this element has
        const classes = Array.from(entry.target.classList);
        const animClass = classes.find(c => 
          ['animate-drum-roll', 'animate-fade-in-up', 'animate-fade-in', 'animate-slide-down'].includes(c)
        );

        // Store the original animation class in dataset if not already stored
        if (animClass && !entry.target.dataset.animClass) {
          entry.target.dataset.animClass = animClass;
        }

        const targetAnimClass = entry.target.dataset.animClass || animClass;

        if (!targetAnimClass) return;

        if (entry.isIntersecting) {
          // Make visible
          entry.target.style.visibility = 'visible';
          // Add animation class (starts animation)
          entry.target.classList.add(targetAnimClass);
          // Stop observing to avoid reflows and repaints on future scroll movements
          observer.unobserve(entry.target);
        } else {
          // Hide and remove class when out of view (on initial load)
          entry.target.style.visibility = 'hidden';
          entry.target.classList.remove(targetAnimClass);
        }
      });
    }, { 
      threshold: 0.05, // Trigger slightly earlier for smoother feeling
      rootMargin: '0px 0px -20px 0px' 
    });

    animatedElements.forEach((el) => {
      observer.observe(el);
    });

    return () => {
      observer.disconnect();
    };
  }, []); // Run once on mount
}
