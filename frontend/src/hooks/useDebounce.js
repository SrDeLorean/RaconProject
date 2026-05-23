import { useState, useEffect } from 'react';

/**
 * Retrasa la actualización de un valor hasta que pase el tiempo especificado.
 * Ideal para buscadores que consultan APIs.
 */
export const useDebounce = (value, delay = 500) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    // Cada vez que 'value' cambia, configuramos un temporizador
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Si 'value' cambia ANTES de que termine el delay, cancelamos el temporizador anterior
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};