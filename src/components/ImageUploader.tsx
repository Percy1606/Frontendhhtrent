'use client';
import React, { useRef, useState } from 'react';
import {
  Image as ImageIcon,
  UploadCloud,
  Loader2,
  RefreshCcw,
  Trash2,
} from 'lucide-react';
import { apiFetch, imagenCompleta } from '@/lib/api';

interface ImageUploaderProps {
  /** URL actual de la imagen (si existe) para mostrarla como vista previa */
  value?: string;
  /** Callback con las URLs generadas por el backend (WebP + miniatura) */
  onUploaded: (urls: { url: string; thumbUrl: string }) => void;
  /** Callback para quitar/borrar la foto (deja el campo vacío) */
  onClear?: () => void;
  /** Texto del botón (default: "Subir foto") */
  label?: string;
}

/**
 * Subida de la foto principal de un equipo (estilo Mercado Libre):
 * se sube la imagen maestra, el backend genera WebP optimizado + miniatura
 * y devuelve las URLs listas para guardar en el registro del equipo.
 * Admite drag & drop y selección por clic. Solo imágenes JPG/PNG/WebP (máx. 10 MB).
 */
export default function ImageUploader({
  value,
  onUploaded,
  onClear,
  label = 'Subir foto',
}: ImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState('');

  const handleClear = async () => {
    if (value && value.startsWith('/uploads/')) {
      try {
        await apiFetch(`/equipos/imagen?url=${encodeURIComponent(value)}`, {
          method: 'DELETE',
        });
      } catch {}
    }
    if (onClear) onClear();
  };

  const subir = async (file: File | null | undefined) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Formato no permitido. Sube JPG, PNG o WebP (máx. 10 MB).');
      return;
    }
    setUploading(true);
    setError('');
    try {
      const fd = new FormData();
      fd.append('file', file);
      const oldUrl = value;
      const data = await apiFetch<{ url: string; thumbUrl: string }>(
        '/equipos/imagen',
        { method: 'POST', body: fd },
      );
      if (oldUrl && oldUrl.startsWith('/uploads/') && oldUrl !== data.url) {
        apiFetch(`/equipos/imagen?url=${encodeURIComponent(oldUrl)}`, {
          method: 'DELETE',
        }).catch(() => undefined);
      }
      onUploaded(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Error al subir la imagen. Verifica tu conexión e intenta nuevamente.',
      );
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-2">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          subir(e.dataTransfer.files?.[0]);
        }}
        onClick={() => inputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
        className={`group relative cursor-pointer rounded-[14px] border-2 border-dashed transition-all ${
          dragOver
            ? 'border-[#E63C46] bg-[#E63C46]/5 scale-[1.01]'
            : 'border-[#162B4D]/25 bg-[#162B4D]/[0.03] hover:border-[#162B4D]/50 hover:bg-[#162B4D]/[0.06]'
        } ${value ? 'p-2' : 'p-5'}`}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          disabled={uploading}
          onChange={(e) => {
            subir(e.target.files?.[0]);
            e.target.value = '';
          }}
        />

        {value ? (
          <div className="relative">
            <img
              src={imagenCompleta(value)}
              alt="Vista previa"
              className="w-full h-44 md:h-52 object-cover rounded-[10px]"
            />
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 rounded-[10px] bg-[#162B4D]/60 opacity-0 group-hover:opacity-100 transition-opacity">
              <UploadCloud className="w-6 h-6 text-white" />
              <span className="text-[10px] font-[800] uppercase tracking-wider text-white">
                {uploading ? 'Subiendo...' : 'Cambiar foto'}
              </span>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center gap-2 py-3 text-center">
            {uploading ? (
              <>
                <Loader2 className="w-8 h-8 text-[#E63C46] animate-spin" />
                <span className="text-xs font-[700] text-[#162B4D]">
                  Optimizando imagen...
                </span>
              </>
            ) : (
              <>
                <span className="w-12 h-12 rounded-full bg-[#162B4D]/5 flex items-center justify-center">
                  <ImageIcon className="w-6 h-6 text-[#162B4D]/60" />
                </span>
                <span className="text-xs font-[700] text-[#162B4D]">
                  {dragOver ? 'Suelta la imagen aquí' : label}
                </span>
                <span className="text-[10px] font-[500] text-slate-400">
                  Arrastra y suelta o haz clic · JPG, PNG o WebP (máx. 10 MB)
                </span>
              </>
            )}
          </div>
        )}
      </div>

      {error && (
        <p className="text-[10px] font-[700] text-red-600 bg-red-50 border border-red-200 rounded-[10px] px-3 py-2">
          {error}
        </p>
      )}

      {value && !uploading && (
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-white border border-slate-200 text-slate-600 text-[10px] font-[800] uppercase tracking-wider rounded-[10px] hover:border-[#162B4D] hover:text-[#162B4D] transition-all"
          >
            <RefreshCcw className="w-3 h-3" />
            Reemplazar
          </button>
          {onClear && (
            <button
              type="button"
              onClick={handleClear}
              className="inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-red-50 border border-red-200 text-red-600 text-[10px] font-[800] uppercase tracking-wider rounded-[10px] hover:bg-red-600 hover:text-white transition-all"
            >
              <Trash2 className="w-3 h-3" />
              Quitar foto
            </button>
          )}
        </div>
      )}
    </div>
  );
}
