'use client';
import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Wrench,
  Play,
  CheckCircle2,
  XCircle,
  ClipboardList,
  Wallet,
  User,
  CalendarDays,
  AlertTriangle,
  Save,
} from 'lucide-react';
import {
  apiFetch,
  imagenCompleta,
  ORDEN_ESTADO_LABELS,
  ORDEN_ESTADO_COLORS,
  TIPO_MANTENIMIENTO_LABELS,
  PRIORIDAD_LABELS,
  ROLES_EDITAN_MANTENIMIENTO,
} from '@/lib/api';
import { useSession } from '@/hooks/useSession';
import { toast } from 'sonner';

interface OrdenEquipo {
  id: string;
  codigoInterno: string | null;
  nombre: string;
  estado: string;
  marca: string | null;
  modelo: string | null;
  serie: string | null;
  imagenUrl: string;
  ubicacion: string;
  categoria: string;
}

interface Tarea {
  id: string;
  descripcion: string;
  realizado: boolean;
  observacion: string | null;
}

interface OrdenTrabajo {
  id: string;
  numero: string;
  equipoId: string;
  tipo: string;
  prioridad: string;
  estado: string;
  descripcion: string;
  fechaProgramada: string;
  fechaInicio: string | null;
  fechaFin: string | null;
  tecnicoResponsable: string | null;
  costoRepuestos: number | null;
  costoManoObra: number | null;
  costoTotal: number | null;
  observaciones: string | null;
  equipo: OrdenEquipo;
  tareas: Tarea[];
}

const fmtFecha = (iso: string | null) =>
  iso
    ? new Date(iso).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' })
    : '—';

const fmtSoles = (n: number | null) =>
  n != null ? `S/ ${n.toLocaleString('es-PE', { maximumFractionDigits: 2 })}` : '—';

export default function OrdenTrabajoDetallePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const user = useSession();
  const puedeEditar = Boolean(
    user && ROLES_EDITAN_MANTENIMIENTO.includes(user.rol),
  );
  const esModoLectura = !puedeEditar;

  const [orden, setOrden] = useState<OrdenTrabajo | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionError, setActionError] = useState('');
  const [saving, setSaving] = useState(false);

  // Tareas editables
  const [tareas, setTareas] = useState<{ id: string; descripcion: string; realizado: boolean; observacion: string }[]>([]);
  const [tareasDirty, setTareasDirty] = useState(false);

  // Costos al completar
  const [costoRepuestos, setCostoRepuestos] = useState('');
  const [costoManoObra, setCostoManoObra] = useState('');
  const [modal, setModal] = useState<'NINGUNO' | 'INICIAR' | 'COMPLETAR' | 'CANCELAR'>('NINGUNO');
  const [motivo, setMotivo] = useState('');

  const cargar = () => {
    // loading ya inicia en true (evita setState síncrono en el effect)
    apiFetch<OrdenTrabajo>(`/mantenimiento/ordenes/${params.id}`)
      .then((o) => {
        setOrden(o);
        setTareas(o.tareas.map((t) => ({ id: t.id, descripcion: t.descripcion, realizado: t.realizado, observacion: t.observacion || '' })));
        setCostoRepuestos(o.costoRepuestos != null ? String(o.costoRepuestos) : '');
        setCostoManoObra(o.costoManoObra != null ? String(o.costoManoObra) : '');
      })
      .catch(() => setOrden(null))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  const guardarTareas = async () => {
    setSaving(true);
    setActionError('');
    try {
      const actualizada = await apiFetch<OrdenTrabajo>(`/mantenimiento/ordenes/${params.id}/tareas`, {
        method: 'PATCH',
        body: JSON.stringify({
          tareas: tareas.map((t) => ({
            descripcion: t.descripcion,
            realizado: t.realizado,
            observacion: t.observacion || undefined,
          })),
        }),
      });
      setOrden(actualizada);
      setTareasDirty(false);
    } catch (err: unknown) {
      setActionError(
        err instanceof Error ? err.message : 'Error al guardar las tareas'
      );
    } finally {
      setSaving(false);
    }
  };

  const ejecutarAccion = async () => {
    if (!orden) return;
    setSaving(true);
    setActionError('');
    try {
      const body: Record<string, unknown> = { estado: modal };
      if (modal === 'COMPLETAR') {
        body.costoRepuestos = costoRepuestos ? Number(costoRepuestos) : undefined;
        body.costoManoObra = costoManoObra ? Number(costoManoObra) : undefined;
      }
      if (modal === 'CANCELAR') body.observaciones = motivo || undefined;

      // Guardar tareas pendientes si las hay
      if (tareasDirty) {
        await apiFetch(`/mantenimiento/ordenes/${params.id}/tareas`, {
          method: 'PATCH',
          body: JSON.stringify({
            tareas: tareas.map((t) => ({
              descripcion: t.descripcion,
              realizado: t.realizado,
              observacion: t.observacion || undefined,
            })),
          }),
        });
      }

      const actualizada = await apiFetch<OrdenTrabajo>(
        `/mantenimiento/ordenes/${params.id}/estado`,
        { method: 'PATCH', body: JSON.stringify(body) }
      );
      setOrden(actualizada);
      setModal('NINGUNO');
      setMotivo('');
      toast.success(`Orden actualizada a: ${ORDEN_ESTADO_LABELS[actualizada.estado] || actualizada.estado}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al ejecutar la acción';
      setActionError(msg);
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="py-20 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-[#162B4D] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!orden) {
    return (
      <div className="py-20 text-center space-y-4">
        <p className="text-slate-700 font-[700] text-lg">Orden de trabajo no encontrada</p>
        <button
          onClick={() => router.push('/admin/mantenimiento')}
          className="px-5 py-2.5 bg-[#162B4D] text-white text-xs font-[700] rounded-xl"
        >
          Volver a Mantenimiento
        </button>
      </div>
    );
  }

  const editable = orden.estado !== 'COMPLETADO' && orden.estado !== 'CANCELADO';
  const tareasCompletas = tareas.length > 0 && tareas.every((t) => t.realizado);

  return (
    <div className="space-y-6 max-w-6xl">
      {/* ENCABEZADO */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <button
            onClick={() => router.push('/admin/mantenimiento')}
            className="inline-flex items-center gap-1.5 text-xs font-[700] text-slate-500 hover:text-[#E63C46] transition-colors mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Volver a Mantenimiento
          </button>
          <div className="flex items-center gap-3">
            <h1 className="font-spartan font-[800] text-2xl text-slate-900 uppercase tracking-tight">
              {orden.numero}
            </h1>
            <span
              className={`px-3 py-1.5 rounded-full text-[11px] font-[800] border whitespace-nowrap ${
                ORDEN_ESTADO_COLORS[orden.estado] || 'bg-slate-100 text-slate-600'
              }`}
            >
              {ORDEN_ESTADO_LABELS[orden.estado] || orden.estado}
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1 font-[500]">
            {TIPO_MANTENIMIENTO_LABELS[orden.tipo] || orden.tipo} · prioridad {PRIORIDAD_LABELS[orden.prioridad] || orden.prioridad}
          </p>
        </div>

        {/* ACCIONES PRINCIPALES */}
        <div className="flex flex-wrap gap-2">
          {esModoLectura ? (
            <span className="px-3.5 py-2.5 bg-slate-100 text-slate-500 text-[11px] font-[700] rounded-[12px] inline-flex items-center gap-2">
              <ClipboardList className="w-3.5 h-3.5" />
              Solo lectura
            </span>
          ) : (
            <>
              <Link
                href={`/admin/mantenimiento/nuevo?edit=${orden.id}`}
                className="inline-flex items-center gap-2 px-5 py-3 bg-[#162B4D] hover:bg-[#233A61] text-white text-xs font-[800] rounded-[14px] shadow-lg transition-all"
              >
                <Wrench className="w-4 h-4" />
                Editar Orden
              </Link>
              {orden.estado === 'PENDIENTE' && (
                <button
                  onClick={() => setModal('INICIAR')}
                  className="inline-flex items-center gap-2 px-5 py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-[800] rounded-[14px] shadow-lg transition-all"
                >
                  <Play className="w-4 h-4" />
                  Iniciar Orden
                </button>
              )}
              {orden.estado === 'EN_PROGRESO' && (
                <button
                  onClick={() => setModal('COMPLETAR')}
                  className="inline-flex items-center gap-2 px-5 py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-[800] rounded-[14px] shadow-lg shadow-emerald-600/25 transition-all"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Completar Orden
                </button>
              )}
              {editable && (
                <button
                  onClick={() => setModal('CANCELAR')}
                  className="inline-flex items-center gap-2 px-5 py-3 bg-white border border-red-200 text-red-500 hover:bg-red-50 text-xs font-[800] rounded-[14px] transition-all"
                >
                  <XCircle className="w-4 h-4" />
                  Cancelar
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {actionError && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-5 py-3 rounded-[14px] text-xs font-[700]">
          {actionError}
        </div>
      )}

      {/* RESUMEN DEL EQUIPO */}
      <div className="bg-white rounded-[20px] border border-slate-200/70 shadow-sm p-5 flex items-center gap-5">
        <img
          src={imagenCompleta(orden.equipo.imagenUrl)}
          alt={orden.equipo.nombre}
          className="w-20 h-20 rounded-[14px] object-cover bg-slate-100 border border-slate-200 shrink-0"
        />
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-[800] text-[#E63C46] uppercase tracking-wider">
            {orden.equipo.codigoInterno} · {orden.equipo.categoria}
          </p>
          <h2 className="font-spartan font-[700] text-lg text-slate-900 truncate">{orden.equipo.nombre}</h2>
          <p className="text-[11px] text-slate-400 font-[500] mt-0.5">
            {[orden.equipo.marca, orden.equipo.modelo, orden.equipo.serie].filter(Boolean).join(' · ') || 'Sin datos de marca'} · Sede {orden.equipo.ubicacion}
          </p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-[10px] font-[700] text-slate-400 uppercase tracking-wider">Estado del equipo</p>
          <span className="mt-1 inline-block px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-[11px] font-[800]">
            {orden.equipo.estado.replace(/_/g, ' ')}
          </span>
        </div>
      </div>

      {/* INFO DE LA ORDEN */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white rounded-[16px] border border-slate-200/70 p-4 shadow-sm">
          <p className="text-[10px] font-[700] text-slate-400 uppercase tracking-wider flex items-center gap-1">
            <CalendarDays className="w-3 h-3" /> Programada
          </p>
          <p className="text-sm font-[800] text-slate-800 mt-1">{fmtFecha(orden.fechaProgramada)}</p>
        </div>
        <div className="bg-white rounded-[16px] border border-slate-200/70 p-4 shadow-sm">
          <p className="text-[10px] font-[700] text-slate-400 uppercase tracking-wider flex items-center gap-1">
            <Play className="w-3 h-3" /> Inicio
          </p>
          <p className="text-sm font-[800] text-slate-800 mt-1">{fmtFecha(orden.fechaInicio)}</p>
        </div>
        <div className="bg-white rounded-[16px] border border-slate-200/70 p-4 shadow-sm">
          <p className="text-[10px] font-[700] text-slate-400 uppercase tracking-wider flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> Fin
          </p>
          <p className="text-sm font-[800] text-slate-800 mt-1">{fmtFecha(orden.fechaFin)}</p>
        </div>
        <div className="bg-white rounded-[16px] border border-slate-200/70 p-4 shadow-sm">
          <p className="text-[10px] font-[700] text-slate-400 uppercase tracking-wider flex items-center gap-1">
            <User className="w-3 h-3" /> Técnico
          </p>
          <p className="text-sm font-[800] text-slate-800 mt-1">{orden.tecnicoResponsable || '—'}</p>
        </div>
      </div>

      {/* DESCRIPCIÓN + COSTOS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-[20px] border border-slate-200/70 shadow-sm p-6">
          <h2 className="flex items-center gap-2 font-[800] text-slate-800 text-sm uppercase tracking-wider mb-3">
            <Wrench className="w-4 h-4 text-[#E63C46]" />
            Descripción del trabajo
          </h2>
          <p className="text-sm text-slate-600 leading-relaxed">{orden.descripcion}</p>
          {orden.observaciones && (
            <>
              <p className="text-[10px] font-[700] text-slate-400 uppercase tracking-wider mt-5 mb-1.5">Observaciones</p>
              <p className="text-xs text-slate-500 leading-relaxed">{orden.observaciones}</p>
            </>
          )}
        </div>

        <div className="bg-white rounded-[20px] border border-slate-200/70 shadow-sm p-6">
          <h2 className="flex items-center gap-2 font-[800] text-slate-800 text-sm uppercase tracking-wider mb-3">
            <Wallet className="w-4 h-4 text-[#E63C46]" />
            Costos de mantenimiento
          </h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between text-slate-600 font-[600]">
              <span>Repuestos</span>
              <span className="font-[800] text-slate-900">{fmtSoles(orden.costoRepuestos)}</span>
            </div>
            <div className="flex justify-between text-slate-600 font-[600]">
              <span>Mano de obra</span>
              <span className="font-[800] text-slate-900">{fmtSoles(orden.costoManoObra)}</span>
            </div>
            <div className="flex justify-between text-slate-900 font-[800] pt-3 border-t border-slate-200 text-base">
              <span>Total</span>
              <span className="text-[#E63C46]">{fmtSoles(orden.costoTotal)}</span>
            </div>
          </div>
          {orden.estado === 'EN_PROGRESO' && (
            <p className="text-[10px] text-slate-400 mt-4 font-[600]">
              Los costos se registran al completar la orden de trabajo.
            </p>
          )}
        </div>
      </div>

      {/* TAREAS */}
      <div className="bg-white rounded-[20px] border border-slate-200/70 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
          <h2 className="flex items-center gap-2 font-[800] text-slate-800 text-sm uppercase tracking-wider">
            <ClipboardList className="w-4 h-4 text-[#E63C46]" />
            Tareas de la orden
          </h2>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-[700] text-slate-400">
              {tareas.filter((t) => t.realizado).length}/{tareas.length} realizadas
            </span>
            {editable && !esModoLectura && tareasDirty && (
              <button
                onClick={guardarTareas}
                disabled={saving}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#E63C46] hover:bg-[#C92A36] disabled:opacity-60 text-white text-[11px] font-[800] rounded-[10px] transition-all"
              >
                <Save className="w-3.5 h-3.5" />
                Guardar tareas
              </button>
            )}
          </div>
        </div>
        <div className="p-6 space-y-3">
          {tareas.length === 0 && (
            <p className="text-center text-xs text-slate-400 font-[600] py-6">
              Esta orden no tiene tareas asignadas.
            </p>
          )}
          {tareas.map((tarea, i) => (
            <div key={tarea.id || i} className={`p-4 rounded-[14px] border transition-colors ${tarea.realizado ? 'bg-emerald-50/50 border-emerald-200' : 'bg-slate-50/60 border-slate-200'}`}>
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={tarea.realizado}
                  disabled={!editable || esModoLectura}
                  onChange={() => {
                    setTareas((prev) =>
                      prev.map((t, idx) => (idx === i ? { ...t, realizado: !t.realizado } : t))
                    );
                    setTareasDirty(true);
                  }}
                  className="w-4 h-4 accent-[#E63C46] mt-0.5 cursor-pointer shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <p className={`text-xs font-[700] ${tarea.realizado ? 'text-emerald-700 line-through' : 'text-slate-800'}`}>
                    {tarea.descripcion}
                  </p>
                  {editable && !esModoLectura ? (
                    <input
                      type="text"
                      value={tarea.observacion}
                      onChange={(e) => {
                        setTareas((prev) =>
                          prev.map((t, idx) => (idx === i ? { ...t, observacion: e.target.value } : t))
                        );
                        setTareasDirty(true);
                      }}
                      placeholder="Observación de la tarea..."
                      className="mt-2 w-full px-3 py-1.5 bg-white border border-slate-200 rounded-[8px] text-[11px] font-[500] text-slate-600 placeholder-slate-400 focus:outline-none focus:border-[#E63C46] transition-all"
                    />
                  ) : (
                    tarea.observacion && (
                      <p className="mt-1.5 text-[11px] text-slate-500 font-[500]">{tarea.observacion}</p>
                    )
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* MODAL DE ACCIÓN */}
      {modal !== 'NINGUNO' && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-[24px] max-w-md w-full p-6 shadow-2xl border border-slate-100">
            <h3 className="font-spartan font-[800] text-lg text-slate-900 uppercase tracking-tight">
              {modal === 'INICIAR' && 'Iniciar orden de trabajo'}
              {modal === 'COMPLETAR' && 'Completar orden de trabajo'}
              {modal === 'CANCELAR' && 'Cancelar orden de trabajo'}
            </h3>

            {modal === 'INICIAR' && (
              <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                Al iniciar la orden, el equipo pasará a estado{' '}
                <strong>{orden.tipo === 'CALIBRACION' ? 'EN CALIBRACIÓN' : 'EN MANTENIMIENTO'}</strong>.
                {!tareasCompletas && (
                  <span className="block mt-2 text-amber-600 font-[600] flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4" />
                    No todas las tareas están marcadas como realizadas.
                  </span>
                )}
              </p>
            )}

            {modal === 'COMPLETAR' && (
              <div className="mt-4 space-y-4">
                <p className="text-sm text-slate-600">
                  Al completar, el equipo volverá a estado <strong>DISPONIBLE</strong>. Registre los costos:
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-[700] text-slate-500 uppercase tracking-wider mb-1.5">
                      Costo repuestos
                    </label>
                    <input
                      type="number"
                      min={0}
                      step="0.01"
                      value={costoRepuestos}
                      onChange={(e) => setCostoRepuestos(e.target.value)}
                      placeholder="0.00"
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-[12px] text-xs font-[600] text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#162B4D] transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-[700] text-slate-500 uppercase tracking-wider mb-1.5">
                      Costo mano de obra
                    </label>
                    <input
                      type="number"
                      min={0}
                      step="0.01"
                      value={costoManoObra}
                      onChange={(e) => setCostoManoObra(e.target.value)}
                      placeholder="0.00"
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-[12px] text-xs font-[600] text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#162B4D] transition-all"
                    />
                  </div>
                </div>
                {!tareasCompletas && (
                  <p className="text-xs text-amber-600 font-[600] flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4" />
                    Hay tareas sin marcar como realizadas.
                  </p>
                )}
              </div>
            )}

            {modal === 'CANCELAR' && (
              <div className="mt-4 space-y-4">
                <p className="text-sm text-slate-600">
                  {orden.estado === 'PENDIENTE'
                    ? 'La orden se cancelará sin afectar el estado del equipo.'
                    : 'Al cancelar, el equipo volverá a estado DISPONIBLE.'}
                </p>
                <div>
                  <label className="block text-[11px] font-[700] text-slate-500 uppercase tracking-wider mb-1.5">
                    Motivo de cancelación
                  </label>
                  <textarea
                    rows={3}
                    value={motivo}
                    onChange={(e) => setMotivo(e.target.value)}
                    placeholder="Explique el motivo..."
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-[12px] text-xs font-[600] text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#162B4D] transition-all resize-none"
                  />
                </div>
              </div>
            )}

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setModal('NINGUNO')}
                className="flex-1 py-3 rounded-[12px] border border-slate-200 text-slate-600 font-[700] text-xs hover:bg-slate-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={ejecutarAccion}
                disabled={saving}
                className={`flex-1 py-3 rounded-[12px] text-white font-[700] text-xs transition-all disabled:opacity-60 ${
                  modal === 'CANCELAR'
                    ? 'bg-red-500 hover:bg-red-600'
                    : modal === 'COMPLETAR'
                    ? 'bg-emerald-600 hover:bg-emerald-700'
                    : 'bg-[#162B4D] hover:bg-[#233A61]'
                }`}
              >
                {saving ? (
                  <span className="inline-flex items-center gap-2">
                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Procesando...
                  </span>
                ) : (
                  modal === 'INICIAR' ? 'Sí, iniciar' : modal === 'COMPLETAR' ? 'Sí, completar' : 'Sí, cancelar'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
