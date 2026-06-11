import React, { useState, useRef, useEffect } from 'react';
import api from '@/api/axios';
import Button from './Button';
import { useAuthStore } from '@/store/useAuthStore';

export default function ImageUploader({ 
  value = '', 
  onChange, 
  folder = 'general', 
  label = 'Imagen / Logo', 
  className = '' 
}) {
  const { user } = useAuthStore();
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');
  const [localPreview, setLocalPreview] = useState('');
  const fileInputRef = useRef(null);

  const isPowerUser = user && (user.role === 'administrador' || user.role === 'organizador');
  const maxBytes = isPowerUser ? 8 * 1024 * 1024 : 4 * 1024 * 1024;
  const maxMbText = isPowerUser ? '8MB' : '4MB';

  // Determinar la URL correcta a mostrar
  const backendBaseUrl = window.mediaUrl ? window.mediaUrl('') : (api.defaults.baseURL?.replace(/\/api$/, '') || 'http://localhost:8000');
  
  // Limpiar el preview local cuando cambie el valor externo (el upload finalizó con éxito o se removió)
  useEffect(() => {
    setLocalPreview('');
  }, [value]);

  const displayUrl = localPreview || (value 
    ? (value.startsWith('http') ? value : (typeof window.mediaUrl === 'function' ? window.mediaUrl(value) : `${backendBaseUrl}${value.startsWith('/') ? value : '/' + value}`)) 
    : '');

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validar tipo de archivo
    if (!file.type.startsWith('image/')) {
      setError('Por favor, selecciona una imagen válida.');
      return;
    }

    // Validar tamaño de archivo (Max 4MB u 8MB según rol)
    if (file.size > maxBytes) {
      setError(`La imagen es demasiado pesada. El tamaño máximo permitido es ${maxMbText}.`);
      return;
    }

    // Crear previsualización local antes de subir
    const previewUrl = URL.createObjectURL(file);
    setLocalPreview(previewUrl);

    setIsUploading(true);
    setError('');

    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', folder);

    try {
      const response = await api.post('/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.data && response.data.url) {
        onChange(response.data.url);
      }
    } catch (err) {
      console.error(err);
      const errMsg = err.response?.data?.message || 'Error al subir la imagen al servidor.';
      setError(errMsg);
    } finally {
      setIsUploading(false);
    }
  };

  const triggerSelect = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleRemove = () => {
    onChange('');
    setLocalPreview('');
    setError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className={`flex flex-col gap-2.5 ${className}`}>
      {label && (
        <span className="text-technical text-muted-foreground ml-1">
          {label}
        </span>
      )}

      <div className="relative group rounded-xl border border-border/80 bg-background/30 backdrop-blur-sm p-4 transition-all duration-300 hover:border-primary/50 flex flex-col sm:flex-row items-center gap-5">
        
        {/* Vista previa / Avatar de Carga */}
        <div className="relative w-24 h-24 rounded-xl border border-border/50 bg-background/50 flex items-center justify-center overflow-hidden shrink-0 group-hover:shadow-[0_0_15px_rgba(var(--primary-rgb),0.1)] transition-all">
          {displayUrl ? (
            <img 
              src={displayUrl} 
              alt="Preview" 
              className="w-full h-full object-cover"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = 'https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=200'; // Fallback
              }}
            />
          ) : (
            <span className="text-3xl opacity-40">🖼️</span>
          )}

          {isUploading && (
            <div className="absolute inset-0 bg-background/80 flex flex-col items-center justify-center gap-1.5 z-10 animate-fade-in">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
              <span className="text-[9px] font-bold text-primary tracking-widest uppercase">Subiendo</span>
            </div>
          )}
        </div>

        {/* Acciones e Información */}
        <div className="flex-1 flex flex-col gap-2 w-full text-center sm:text-left">
          <div>
            <p className="text-xs font-bold text-foreground">Seleccionar un archivo de imagen</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">JPEG, PNG, WEBP o SVG hasta {maxMbText}</p>
          </div>

          <div className="flex items-center justify-center sm:justify-start gap-2.5 mt-1">
            <Button 
              type="button" 
              variant="outline" 
              size="sm" 
              onClick={triggerSelect}
              disabled={isUploading}
              className="text-xs py-2 px-4 border-border/50 hover:bg-muted text-foreground"
            >
              📤 {displayUrl ? 'Cambiar Imagen' : 'Subir Imagen'}
            </Button>

            {displayUrl && (
              <button 
                type="button"
                onClick={handleRemove}
                disabled={isUploading}
                className="text-xs font-bold text-destructive hover:underline px-3 focus:outline-none"
              >
                Remover
              </button>
            )}
          </div>
        </div>

        {/* Input Oculto */}
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleFileChange} 
          accept="image/*" 
          className="hidden" 
        />
      </div>

      {/* Alerta de Error */}
      {error && (
        <span className="text-xs text-destructive font-medium animate-pulse ml-1">
          ⚠️ {error}
        </span>
      )}
    </div>
  );
}
