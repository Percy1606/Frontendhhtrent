'use client';
import React, { useEffect, useState } from 'react';
import {
  FolderTree,
  Plus,
  ChevronDown,
  ChevronRight,
  Package,
  X,
  Trash2,
  AlertTriangle,
} from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { toast } from 'sonner';

interface Subfamilia {
  id: string;
  nombre: string;
}

interface Familia {
  id: string;
  nombre: string;
  descripcion?: string;
  subfamilias: Subfamilia[];
  _count?: { equipos: number };
}

export default function AdminFamiliasPage() {
  const [familias, setFamilias] = useState<Familia[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [showNuevaFamilia, setShowNuevaFamilia] = useState(false);
  const [nombreFamilia, setNombreFamilia] = useState('');
  const [descFamilia, setDescFamilia] = useState('');
  const [familiaActiva, setFamiliaActiva] = useState<Familia | null>(null);
  const [nombreSub, setNombreSub] = useState('');
  const [saving, setSaving] = useState(false);
  const [mensaje, setMensaje] = useState('');
  const [eliminandoId, setEliminandoId] = useState<string | null>(null);

  // Modal elegante de confirmación de eliminación
  const [modalConfirmacion, setModalConfirmacion] = useState<{
    id: string;
    nombre: string;
    tipo: 'familia' | 'subfamilia';
    equiposAsignados?: number;
  } | null>(null);

  const cargar = async () => {
    try {
      const data = await apiFetch<Familia[]>('/familias');
      setFamilias(data);
      setLoading(false);
    } catch {
      setLoading(false);
    }
  };

  const ejecutarEliminacion = async () => {
    if (!modalConfirmacion) return;
    const { id, tipo } = modalConfirmacion;
    setEliminandoId(id);
    setSaving(true);
    try {
      if (tipo === 'familia') {
        await apiFetch(`/familias/${id}`, { method: 'DELETE' });
        mostrarMensaje('🗑️ Categoría eliminada');
      } else {
        await apiFetch(`/familias/subfamilias/${id}`, { method: 'DELETE' });
        mostrarMensaje('🗑️ Subcategoría eliminada');
      }
      await cargar();
      setModalConfirmacion(null);
    } catch (err) {
      mostrarMensaje(`❌ ${err instanceof Error ? err.message : 'No se pudo eliminar'}`);
    } finally {
      setEliminandoId(null);
      setSaving(false);
    }
  };

  const solicitarEliminarFamilia = (fam: Familia) => {
    setModalConfirmacion({
      id: fam.id,
      nombre: fam.nombre,
      tipo: 'familia',
      equiposAsignados: fam._count?.equipos || 0,
    });
  };

  const solicitarEliminarSubfamilia = (id: string, nombre: string) => {
    setModalConfirmacion({ id, nombre, tipo: 'subfamilia' });
  };

  useEffect(() => {
    apiFetch<Familia[]>('/familias')
      .then((data) => {
        setFamilias(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const mostrarMensaje = (msg: string) => {
    const clean = msg.replace(/^[🗑️❌✅]\s*/, '');
    if (msg.includes('eliminad') || msg.startsWith('❌')) {
      toast.error(clean);
    } else {
      toast.success(clean);
    }
  };

  const crearFamilia = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombreFamilia.trim()) return;
    setSaving(true);
    try {
      await apiFetch('/familias', {
        method: 'POST',
        body: JSON.stringify({ nombre: nombreFamilia.trim(), descripcion: descFamilia }),
      });
      setNombreFamilia('');
      setDescFamilia('');
      setShowNuevaFamilia(false);
      await cargar();
      mostrarMensaje('✅ Categoría creada');
    } catch (err) {
      mostrarMensaje(`❌ ${err instanceof Error ? err.message : 'Error desconocido'}`);
    } finally {
      setSaving(false);
    }
  };

  const crearSubfamilia = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!familiaActiva || !nombreSub.trim()) return;
    setSaving(true);
    try {
      await apiFetch(`/familias/${familiaActiva.id}/subfamilias`, {
        method: 'POST',
        body: JSON.stringify({ nombre: nombreSub.trim() }),
      });
      setNombreSub('');
      setFamiliaActiva(null);
      await cargar();
      mostrarMensaje('✅ Subcategoría agregada');
    } catch (err) {
      mostrarMensaje(`❌ ${err instanceof Error ? err.message : 'Error desconocido'}`);
    } finally {
      setSaving(false);
    }
  };

  const toggle = (id: string) => setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-spartan font-[800] text-2xl text-slate-900 uppercase tracking-tight">
            Categorías de Equipos
          </h1>
          <p className="text-sm text-slate-500 mt-1 font-[500]">
            Las 11 categorías oficiales del Maestro General · {familias.length} registradas
          </p>
        </div>
        <button
          onClick={() => setShowNuevaFamilia(!showNuevaFamilia)}
          className="inline-flex items-center gap-2 px-5 py-3 bg-[#E63C46] hover:bg-[#C92A36] text-white text-xs font-[800] rounded-[14px] shadow-lg shadow-[#E63C46]/25 transition-all"
        >
          {showNuevaFamilia ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          <span>{showNuevaFamilia ? 'Cancelar' : 'Nueva Categoría'}</span>
        </button>
      </div>

      {/* FORM NUEVA FAMILIA */}
      {showNuevaFamilia && (
        <form onSubmit={crearFamilia} className="bg-white rounded-[20px] border border-slate-200/70 shadow-sm p-5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-[700] uppercase tracking-wider text-slate-500 mb-1.5">
                Nombre de la Categoría *
              </label>
              <input
                required
                value={nombreFamilia}
                onChange={(e) => setNombreFamilia(e.target.value)}
                placeholder="Ej: Equipos de Medición"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-[12px] text-xs font-[600] focus:outline-none focus:border-[#162B4D] focus:bg-white transition-all"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-[11px] font-[700] uppercase tracking-wider text-slate-500 mb-1.5">
                Descripción
              </label>
              <input
                value={descFamilia}
                onChange={(e) => setDescFamilia(e.target.value)}
                placeholder="Descripción breve de la categoría"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-[12px] text-xs font-[600] focus:outline-none focus:border-[#162B4D] focus:bg-white transition-all"
              />
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2.5 bg-[#162B4D] hover:bg-[#10203B] text-white text-xs font-[800] rounded-[12px] disabled:opacity-60 transition-all"
            >
              {saving ? 'Creando...' : 'Crear Categoría'}
            </button>
          </div>
        </form>
      )}

      {/* LISTADO DE FAMILIAS */}
      {loading ? (
        <div className="py-20 flex items-center justify-center">
          <div className="w-10 h-10 border-4 border-[#162B4D] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {familias.map((fam) => (
            <div
              key={fam.id}
              className="bg-white rounded-[20px] border border-slate-200/70 shadow-sm overflow-hidden"
            >
              <div
                onClick={() => toggle(fam.id)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    toggle(fam.id);
                  }
                }}
                className="w-full p-5 flex items-center justify-between hover:bg-slate-50/70 transition-colors text-left cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <span className="w-10 h-10 rounded-[12px] bg-[#162B4D]/5 border border-[#162B4D]/10 flex items-center justify-center">
                    <FolderTree className="w-5 h-5 text-[#162B4D]" />
                  </span>
                  <div>
                    <h3 className="font-[800] text-sm text-slate-900">{fam.nombre}</h3>
                    <p className="text-[11px] text-slate-400 font-[500] mt-0.5">
                      {fam.subfamilias.length} subcategorías · {fam._count?.equipos || 0} equipos
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setFamiliaActiva(fam);
                    }}
                    className="p-2 rounded-[8px] bg-emerald-600/10 text-emerald-600 hover:bg-emerald-600 hover:text-white transition-all"
                    title="Agregar subcategoría"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      solicitarEliminarFamilia(fam);
                    }}
                    disabled={eliminandoId === fam.id}
                    className="p-2 rounded-[8px] bg-red-600/10 text-red-600 hover:bg-red-600 hover:text-white transition-all disabled:opacity-50"
                    title="Eliminar categoría"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  {expanded[fam.id] ? (
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  )}
                </div>
              </div>

              {expanded[fam.id] && (
                <div className="px-5 pb-5 border-t border-slate-100 pt-3">
                  {fam.subfamilias.length === 0 ? (
                    <p className="text-xs text-slate-400 font-[500] text-center py-3">
                      Sin subcategorías registradas.
                    </p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {fam.subfamilias.map((sub) => (
                        <span
                          key={sub.id}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-full text-[11px] font-[600] text-slate-700 group hover:border-red-200 transition-colors"
                        >
                          <Package className="w-3 h-3 text-slate-400" />
                          <span>{sub.nombre}</span>
                          <button
                            onClick={() => solicitarEliminarSubfamilia(sub.id, sub.nombre)}
                            className="text-slate-400 hover:text-red-600 transition-colors ml-0.5 p-0.5 rounded-full hover:bg-red-50"
                            title="Eliminar subcategoría"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* MODAL NUEVA SUBFAMILIA */}
      {familiaActiva && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <form
            onSubmit={crearSubfamilia}
            className="bg-white rounded-[20px] max-w-md w-full p-6 shadow-2xl border border-slate-100"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-[800] text-sm text-slate-900">
                Nueva Subcategoría en {familiaActiva.nombre}
              </h3>
              <button
                type="button"
                onClick={() => setFamiliaActiva(null)}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <input
              autoFocus
              required
              value={nombreSub}
              onChange={(e) => setNombreSub(e.target.value)}
              placeholder="Nombre de la subcategoría"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-[12px] text-sm font-[600] focus:outline-none focus:border-[#162B4D] focus:bg-white transition-all"
            />
            <div className="flex gap-2 mt-4 justify-end">
              <button
                type="button"
                onClick={() => setFamiliaActiva(null)}
                className="px-4 py-2.5 text-xs font-[700] text-slate-500"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2.5 bg-[#162B4D] hover:bg-[#10203B] text-white text-xs font-[800] rounded-[12px] disabled:opacity-60 transition-all"
              >
                {saving ? 'Guardando...' : 'Guardar Subcategoría'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL ELEGANTE DE CONFIRMACIÓN DE ELIMINACIÓN */}
      {modalConfirmacion && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => !saving && setModalConfirmacion(null)}
        >
          <div
            className="bg-white rounded-[24px] max-w-md w-full p-6 shadow-2xl border border-slate-100 text-center space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-14 h-14 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mx-auto border border-red-100">
              <AlertTriangle className="w-7 h-7" />
            </div>

            <div>
              <h3 className="font-[800] text-lg text-slate-900 font-spartan uppercase tracking-tight">
                ¿Eliminar {modalConfirmacion.tipo === 'familia' ? 'Categoría' : 'Subcategoría'}?
              </h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                ¿Estás seguro de eliminar la {modalConfirmacion.tipo === 'familia' ? 'categoría' : 'subcategoría'}{' '}
                <strong className="text-slate-900 font-[800]">"{modalConfirmacion.nombre}"</strong>?
              </p>
              {modalConfirmacion.equiposAsignados && modalConfirmacion.equiposAsignados > 0 ? (
                <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-800 font-[600]">
                  ⚠️ Esta categoría tiene <strong>{modalConfirmacion.equiposAsignados} equipo(s) asignado(s)</strong>. El sistema no permitirá borrarla hasta reasignar o eliminar dichos equipos.
                </div>
              ) : (
                <p className="text-[11px] text-slate-400 mt-1 font-[500]">
                  Esta acción no se puede deshacer.
                </p>
              )}
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                disabled={saving}
                onClick={() => setModalConfirmacion(null)}
                className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-[800] uppercase tracking-wider transition-all disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={ejecutarEliminacion}
                className="w-full py-3 bg-[#E63C46] hover:bg-[#C92A36] text-white rounded-xl text-xs font-[800] uppercase tracking-wider shadow-lg shadow-[#E63C46]/25 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {saving ? 'Eliminando…' : 'Sí, Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
