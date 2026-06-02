import React from 'react';

export default function ContentSection({ 
  children, 
  className = '' 
}) {
  return (
    <section className={`py-12 md:py-20 flex flex-col gap-8 md:gap-12 text-left relative z-10 w-full ${className}`}>
      {children}
    </section>
  );
}
