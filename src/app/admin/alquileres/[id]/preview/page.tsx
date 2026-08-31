'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Download, Printer, RefreshCw, FileText } from 'lucide-react';
import { getToken, API_URL } from '@/lib/api';
import { toast } from 'sonner';

export default function ContratoVistaPreviaPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const containerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [blobDocx, setBlobDocx] = useState<Blob | null>(null);
  const [numeroContrato, setNumeroContrato] = useState('');

  const cargarYRenderizar = async () => {
    setLoading(true);
    setError('');
    try {
      const token = getToken() || '';
      const res = await fetch(`${API_URL}/contratos/${id}/docx?t=${Date.now()}`, {
        cache: 'no-store',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        throw new Error('No se pudo obtener el documento del contrato');
      }

      const arrayBuffer = await res.arrayBuffer();
      const blob = new Blob([arrayBuffer], {
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      });
      setBlobDocx(blob);

      // Renderizar el docx en el contenedor usando docx-preview con visualización continua fluida
      const { renderAsync } = await import('docx-preview');
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
        await renderAsync(arrayBuffer, containerRef.current, undefined, {
          className: 'docx-document',
          inWrapper: false,
          ignoreWidth: true,
          ignoreHeight: true,
          breakPages: false,
        });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al cargar la vista previa';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      cargarYRenderizar();
    }
  }, [id]);

  const descargarArchivo = () => {
    if (!blobDocx) return;
    const url = URL.createObjectURL(blobDocx);
    const a = document.createElement('a');
    a.href = url;
    a.download = `contrato-${numeroContrato || id}.docx`;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      a.remove();
      URL.revokeObjectURL(url);
    }, 100);
    toast.success('Documento Word descargado');
  };

  const imprimir = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans">
      {/* BARRA SUPERIOR DE HERRAMIENTAS */}
      <header className="sticky top-0 z-50 bg-slate-900/90 backdrop-blur border-b border-slate-800 px-6 py-3.5 flex items-center justify-between shadow-md print:hidden">
        <div className="flex items-center gap-3">
          <button
            onClick={() => window.close()}
            className="inline-flex items-center gap-1.5 text-xs font-[700] text-slate-400 hover:text-white transition-colors bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-[10px]"
          >
            <ArrowLeft className="w-4 h-4" />
            Cerrar pestaña
          </button>
          <div className="h-4 w-px bg-slate-700 mx-1" />
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-emerald-400" />
            <h1 className="text-sm font-[800] text-white tracking-wide uppercase">
              Vista Previa de Contrato
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={cargarYRenderizar}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-[700] rounded-[10px] transition-colors disabled:opacity-50"
            title="Recargar documento"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Recargar
          </button>

          <button
            onClick={imprimir}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-[700] rounded-[10px] transition-colors disabled:opacity-50"
            title="Imprimir contrato"
          >
            <Printer className="w-4 h-4" />
            Imprimir
          </button>

          <button
            onClick={descargarArchivo}
            disabled={!blobDocx || loading}
            className="inline-flex items-center gap-2 px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-[800] rounded-[10px] shadow-lg shadow-emerald-900/30 transition-all disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            Descargar Word (.docx)
          </button>
        </div>
      </header>

      {/* ÁREA DE VISUALIZACIÓN DEL DOCUMENTO */}
      <main className="flex-1 overflow-y-auto overflow-x-hidden p-2 sm:p-6 md:p-8 flex justify-center items-start bg-slate-950">
        {loading && (
          <div className="flex flex-col items-center justify-center py-32 text-center">
            <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-sm font-[700] text-slate-300">Generando vista previa del contrato...</p>
            <p className="text-xs text-slate-500 mt-1">Renderizando cláusulas legales y tablas dinámicas</p>
          </div>
        )}

        {error && !loading && (
          <div className="bg-red-950/50 border border-red-800 text-red-300 px-6 py-4 rounded-[14px] text-xs font-[600] max-w-md text-center mt-12">
            <p className="font-[800] text-red-200 text-sm mb-1">No se pudo cargar la vista previa</p>
            <p>{error}</p>
            <button
              onClick={cargarYRenderizar}
              className="mt-4 px-4 py-2 bg-red-800 hover:bg-red-700 text-white rounded-[8px] font-[700] transition-colors"
            >
              Reintentar
            </button>
          </div>
        )}

        {/* CONTENEDOR FLUIDO RESPONSIVE CON AJUSTE PROPORCIONAL */}
        <div className={`w-full max-w-[840px] flex justify-center ${loading ? 'hidden' : 'flex'}`}>
          <div
            ref={containerRef}
            className="w-full bg-white text-slate-900 rounded-[12px] shadow-2xl overflow-hidden my-2 sm:my-4 transition-all duration-300"
          />
        </div>
      </main>

      {/* ESTILOS PARA LA VISTA PREVIA Y PARA IMPRESIÓN */}
      <style jsx global>{`
        .docx-wrapper {
          background: transparent !important;
          padding: 0 !important;
          margin: 0 auto !important;
          width: 100% !important;
          max-width: 100% !important;
          box-sizing: border-box !important;
        }
        .docx-document {
          background: transparent !important;
          padding: 0 !important;
          margin: 0 auto !important;
          width: 100% !important;
          max-width: 100% !important;
          box-sizing: border-box !important;
        }
        .docx-document > article,
        .docx-document > section.docx,
        section.docx,
        article.docx {
          box-sizing: border-box !important;
          width: 100% !important;
          max-width: 100% !important;
          min-height: auto !important;
          margin: 0 0 16px 0 !important;
          padding: 3rem 2.5rem !important;
          background: white !important;
          color: #0f172a !important;
          box-shadow: none !important;
          overflow-wrap: break-word !important;
          word-break: break-word !important;
        }
        /* Eliminar secciones vacías huérfanas que genera docx-preview al final */
        section.docx:empty,
        article.docx:empty {
          display: none !important;
        }
        /* Ajuste estricto de tablas para que no desborden la hoja */
        .docx-document table,
        table.docx {
          max-width: 100% !important;
          width: 100% !important;
          table-layout: fixed !important;
          word-break: break-word !important;
          box-sizing: border-box !important;
          margin-left: 0 !important;
          margin-right: 0 !important;
        }
        .docx-document td,
        .docx-document th {
          word-break: break-word !important;
          overflow-wrap: break-word !important;
          box-sizing: border-box !important;
        }
        .docx-document p, 
        .docx-document span,
        .docx-document div {
          max-width: 100% !important;
          word-break: break-word !important;
          overflow-wrap: break-word !important;
          box-sizing: border-box !important;
        }
        @media (max-width: 640px) {
          .docx-document > article,
          .docx-document > section.docx,
          section.docx {
            padding: 1.5rem 1rem !important;
          }
        }
        @media print {
          body {
            background: white !important;
          }
          header {
            display: none !important;
          }
          main {
            background: white !important;
            padding: 0 !important;
            overflow: visible !important;
          }
          .docx-document, .docx-wrapper {
            width: 100% !important;
            max-width: 100% !important;
            padding: 0 !important;
            box-shadow: none !important;
          }
          .docx-document > article,
          .docx-document > section.docx,
          section.docx {
            padding: 0 !important;
            margin: 0 !important;
            box-shadow: none !important;
          }
        }
      `}</style>
    </div>
  );
}
