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
          // Trigger reflow to restart animation
          entry.target.classList.remove(targetAnimClass);
          void entry.target.offsetWidth;
          entry.target.classList.add(targetAnimClass);
        } else {
          // Hide and remove class when out of view
          entry.target.style.visibility = 'hidden';
          entry.target.classList.remove(targetAnimClass);
        }
      });
    }, { 
      threshold: 0.1, // Trigger when 10% of the element is visible
      rootMargin: '0px 0px -50px 0px' 
    });

    animatedElements.forEach((el) => {
      observer.observe(el);
    });

    return () => {
      observer.disconnect();
    };
  }, []); // Run once on mount
}
