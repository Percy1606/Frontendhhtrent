'use client';
import React, { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Plus, Trash2, CheckCircle2, Wrench, CalendarClock, ClipboardList, ShieldX, Search } from 'lucide-react';
import {
  apiFetch,
  fetchEquiposPublicos,
  ROLES_EDITAN_MANTENIMIENTO,
  TIPOS_MANTENIMIENTO,
  TIPO_MANTENIMIENTO_LABELS,
  PRIORIDADES_ORDEN,
  PRIORIDAD_LABELS,
  FRECUENCIAS_PLAN,
  FRECUENCIA_LABELS,
} from '@/lib/api';
import { toast } from 'sonner';
import { useSession } from '@/hooks/useSession';

interface Equipo {
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
  anio: number | null;
  tipo: string;
}

export default function NuevaOrdenTrabajoPage() {
  return (
    <Suspense
      fallback={
        <div className="py-20 flex items-center justify-center">
          <div className="w-10 h-10 border-4 border-[#162B4D] border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <NuevaOrdenTrabajoInner />
    </Suspense>
  );
}

function NuevaOrdenTrabajoInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const esPlan = searchParams.get('plan') === '1';
  const user = useSession();
  const puedeEditar = Boolean(
    user && ROLES_EDITAN_MANTENIMIENTO.includes(user.rol),
  );

  const [equipos, setEquipos] = useState<Equipo[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const [form, setForm] = useState({
    equipoId: '',
    tipo: 'PREVENTIVO',
    prioridad: 'MEDIA',
    descripcion: '',
    fechaProgramada: new Date().toISOString().slice(0, 10),
    tecnicoResponsable: '',
    observaciones: '',
  });

  const [tareas, setTareas] = useState<string[]>(['', '', '', '']);

  // Formulario de plan preventivo
  const [planForm, setPlanForm] = useState({
    equipoId: '',
    frecuencia: 'TRIMESTRAL',
    descripcion: '',
    proximaFecha: new Date().toISOString().slice(0, 10),
  });

  const [busquedaEquipo, setBusquedaEquipo] = useState('');
  const [openEquipoDropdown, setOpenEquipoDropdown] = useState(false);

  const editId = searchParams.get('edit');
  const esEdicion = Boolean(editId);

  useEffect(() => {
    const fetchEquipos = apiFetch<Equipo[]>('/mantenimiento/ordenes/equipos')
      .then((eqs) => {
        setEquipos(eqs);
        return eqs;
      })
      .catch(async () => {
        const publicList = await fetchEquiposPublicos<Equipo>().catch(() => []);
        setEquipos(publicList);
        return publicList;
      });

    if (editId) {
      Promise.all([fetchEquipos, apiFetch<any>(`/mantenimiento/ordenes/${editId}`)])
        .then(([_, ordenData]) => {
          if (ordenData) {
            setForm({
              equipoId: ordenData.equipoId || ordenData.equipo?.id || '',
              tipo: ordenData.tipo || 'PREVENTIVO',
              prioridad: ordenData.prioridad || 'MEDIA',
              descripcion: ordenData.descripcion || '',
              fechaProgramada: ordenData.fechaProgramada ? ordenData.fechaProgramada.slice(0, 10) : new Date().toISOString().slice(0, 10),
              tecnicoResponsable: ordenData.tecnicoResponsable || '',
              observaciones: ordenData.observaciones || '',
            });
            if (ordenData.tareas && ordenData.tareas.length > 0) {
              setTareas(ordenData.tareas.map((t: any) => t.descripcion));
            }
          }
        })
        .finally(() => setLoading(false));
    } else {
      fetchEquipos
      .then((eqs) => {
        const soloAlquiler = eqs.filter((e) => e.tipo !== 'VENTA');
        if (soloAlquiler.length > 0) {
          setForm((f) => ({ ...f, equipoId: soloAlquiler[0].id }));
          setPlanForm((p) => ({ ...p, equipoId: soloAlquiler[0].id }));
        }
      })
      .finally(() => setLoading(false));
    }
  }, [editId]);

  const equiposFiltrados = equipos.filter((eq) => {
    // Solo equipos en modalidad de ALQUILER aplican para mantenimientos
    if (eq.tipo === 'VENTA') return false;
    if (!busquedaEquipo.trim()) return true;
    const q = busquedaEquipo.toLowerCase();
    return (
      eq.nombre.toLowerCase().includes(q) ||
      (eq.codigoInterno && eq.codigoInterno.toLowerCase().includes(q)) ||
      (eq.marca && eq.marca.toLowerCase().includes(q)) ||
      (eq.modelo && eq.modelo.toLowerCase().includes(q)) ||
      (eq.serie && eq.serie.toLowerCase().includes(q))
    );
  });

  const equipoSeleccionado = equipos.find((eq) => eq.id === form.equipoId);
  const equipoPlanSeleccionado = equipos.find((eq) => eq.id === planForm.equipoId);

  if (!puedeEditar) {
    return (
      <div className="max-w-md mx-auto py-20 text-center space-y-4">
        <span className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center mx-auto">
          <ShieldX className="w-7 h-7 text-slate-400" />
        </span>
        <h1 className="font-spartan font-[800] text-xl text-slate-900 uppercase tracking-tight">
          Sin permiso
        </h1>
        <p className="text-sm text-slate-500 font-[500]">
          Tu rol no tiene permisos para crear órdenes de trabajo ni planes de mantenimiento.
        </p>
        <button
          onClick={() => router.push('/admin/mantenimiento')}
          className="px-5 py-2.5 bg-[#162B4D] text-white text-xs font-[700] rounded-xl"
        >
          Volver a Mantenimiento
        </button>
      </div>
    );
  }

  const hoyISO = new Date().toISOString().slice(0, 10);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!form.equipoId || !form.descripcion.trim()) {
      setError('Seleccione el equipo y escriba la descripción de la orden');
      return;
    }
    if (form.fechaProgramada < hoyISO) {
      setError('La fecha programada no puede ser anterior a la fecha actual');
      return;
    }
    setSaving(true);
    try {
      let targetId = editId;
      if (editId) {
        await apiFetch(`/mantenimiento/ordenes/${editId}`, {
          method: 'PATCH',
          body: JSON.stringify({
            equipoId: form.equipoId,
            tipo: form.tipo,
            prioridad: form.prioridad,
            descripcion: form.descripcion,
            fechaProgramada: form.fechaProgramada,
            tecnicoResponsable: form.tecnicoResponsable || undefined,
            observaciones: form.observaciones || undefined,
            tareas: tareas.map((t) => t.trim()).filter(Boolean).map((t) => ({ descripcion: t })),
          }),
        });
      } else {
        const creada = await apiFetch<{ id: string; numero: string }>('/mantenimiento/ordenes', {
          method: 'POST',
          body: JSON.stringify({
            equipoId: form.equipoId,
            tipo: form.tipo,
            prioridad: form.prioridad,
            descripcion: form.descripcion,
            fechaProgramada: form.fechaProgramada,
            tecnicoResponsable: form.tecnicoResponsable || undefined,
            observaciones: form.observaciones || undefined,
            tareas: tareas.map((t) => t.trim()).filter(Boolean).map((t) => ({ descripcion: t })),
          }),
        });
        targetId = creada.id;
      }
      setSuccess(true);
      toast.success(esEdicion ? 'Orden de trabajo actualizada' : 'Orden de trabajo creada correctamente');
      setTimeout(() => router.push(`/admin/mantenimiento/${targetId}`), 800);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al guardar la orden de trabajo';
      setError(msg);
      toast.error(msg);
      setSaving(false);
    }
  };

  const handlePlanSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!planForm.equipoId || !planForm.descripcion.trim()) {
      const msg = 'Seleccione el equipo y describa el plan preventivo';
      setError(msg);
      toast.error(msg);
      return;
    }
    if (planForm.proximaFecha < hoyISO) {
      const msg = 'La próxima fecha del plan no puede ser anterior a la fecha actual';
      setError(msg);
      toast.error(msg);
      return;
    }
    setSaving(true);
    try {
      await apiFetch('/mantenimiento/planes', {
        method: 'POST',
        body: JSON.stringify(planForm),
      });
      setSuccess(true);
      toast.success('Plan de mantenimiento creado');
      setTimeout(() => router.push('/admin/mantenimiento'), 800);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al crear el plan';
      setError(msg);
      toast.error(msg);
      setSaving(false);
    }
  };

  const inputCls =
    'w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-[12px] text-xs font-[600] text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#162B4D] focus:bg-white transition-all';
  const labelCls = 'block text-[11px] font-[700] text-slate-500 uppercase tracking-wider mb-1.5';

  const estadoLabel: Record<string, string> = {
    DISPONIBLE: 'Disponible',
    EN_MANTENIMIENTO: 'En mantenimiento',
    EN_CALIBRACION: 'En calibración',
  };

  return (
    <div className="space-y-6 max-w-6xl">
      {/* ENCABEZADO */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <button
            onClick={() => router.push('/admin/mantenimiento')}
            className="inline-flex items-center gap-1.5 text-xs font-[700] text-slate-500 hover:text-[#E63C46] transition-colors mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Volver a Mantenimiento
          </button>
          <h1 className="font-spartan font-[800] text-2xl text-slate-900 uppercase tracking-tight">
            {esPlan
              ? 'Nuevo Plan de Mantenimiento'
              : esEdicion
              ? 'Editar Orden de Trabajo'
              : 'Nueva Orden de Trabajo'}
          </h1>
          <p className="text-sm text-slate-500 mt-1 font-[500]">
            {esPlan
              ? 'Registre un plan preventivo periódico para un equipo'
              : esEdicion
              ? 'Modifique los datos y tareas de la orden de trabajo'
              : 'Registre una orden de mantenimiento y sus tareas a realizar'}
          </p>
        </div>
      </div>

      {success && (
        <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 text-emerald-700 px-5 py-4 rounded-[14px] text-sm font-[700]">
          <CheckCircle2 className="w-5 h-5" />
          {esPlan
            ? 'Plan guardado correctamente. Redirigiendo...'
            : esEdicion
            ? 'Orden actualizada correctamente. Redirigiendo...'
            : 'Orden de trabajo creada. Redirigiendo...'}
        </div>
      )}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-5 py-3 rounded-[14px] text-xs font-[700]">
          {error}
        </div>
      )}

      {loading ? (
        <div className="py-20 flex items-center justify-center">
          <div className="w-10 h-10 border-4 border-[#162B4D] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          {/* CAMBIAR MODO */}
          <div className="flex gap-2">
            <button
              onClick={() => router.push('/admin/mantenimiento/nuevo')}
              className={`px-4 py-2 rounded-[10px] text-xs font-[800] transition-all ${
                !esPlan
                  ? 'bg-[#162B4D] text-white shadow-md'
                  : 'bg-white border border-slate-200 text-slate-500 hover:bg-slate-50'
              }`}
            >
              <span className="inline-flex items-center gap-1.5">
                <ClipboardList className="w-3.5 h-3.5" /> Orden de Trabajo
              </span>
            </button>
            <button
              onClick={() => router.push('/admin/mantenimiento/nuevo?plan=1')}
              className={`px-4 py-2 rounded-[10px] text-xs font-[800] transition-all ${
                esPlan
                  ? 'bg-[#162B4D] text-white shadow-md'
                  : 'bg-white border border-slate-200 text-slate-500 hover:bg-slate-50'
              }`}
            >
              <span className="inline-flex items-center gap-1.5">
                <CalendarClock className="w-3.5 h-3.5" /> Plan Preventivo
              </span>
            </button>
          </div>

          {!esPlan ? (
            <form onSubmit={handleSubmit} className="grid grid-cols-1 xl:grid-cols-5 gap-6">
              {/* COLUMNA IZQUIERDA: DATOS DE LA ORDEN */}
              <div className="xl:col-span-2 space-y-6">
                <div className="bg-white rounded-[20px] border border-slate-200/70 shadow-sm p-6 space-y-4">
                  <h2 className="flex items-center gap-2 font-[800] text-slate-800 text-sm uppercase tracking-wider">
                    <Wrench className="w-4 h-4 text-[#E63C46]" />
                    Datos de la Orden
                  </h2>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="col-span-2 space-y-1.5 relative">
                      <label className={labelCls}>Equipo *</label>
                      {/* BOTÓN / DESPLEGABLE TIPO SELECT */}
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => setOpenEquipoDropdown((prev) => !prev)}
                          className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-[12px] text-xs font-[700] text-slate-800 text-left flex items-center justify-between focus:outline-none focus:border-[#162B4D] focus:bg-white transition-all cursor-pointer"
                        >
                          <span className="truncate">
                            {equipoSeleccionado
                              ? `${equipoSeleccionado.codigoInterno || 'SIN-COD'} · ${equipoSeleccionado.nombre}`
                              : 'Seleccionar equipo...'}
                          </span>
                          <span className="text-slate-400 text-[10px] ml-2">▼</span>
                        </button>
                      </div>

                      {/* MENÚ DESPLEGABLE CON BUSCADOR CUANDO ESTÁ ABIERTO */}
                      {openEquipoDropdown && (
                        <div className="absolute top-full left-0 right-0 z-30 bg-white border border-slate-200 rounded-[14px] shadow-2xl divide-y divide-slate-100 mt-1 p-2 space-y-2">
                          <div className="relative">
                            <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
                            <input
                              type="text"
                              value={busquedaEquipo}
                              onChange={(e) => setBusquedaEquipo(e.target.value)}
                              placeholder="Buscar por código, nombre, marca..."
                              className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-[8px] text-xs font-[600] text-slate-800 focus:outline-none focus:border-[#162B4D]"
                              autoFocus
                            />
                          </div>

                          <div className="max-h-48 overflow-y-auto divide-y divide-slate-100">
                            {equiposFiltrados.length === 0 ? (
                              <p className="p-3 text-xs text-slate-400 font-[500] text-center">No se encontraron equipos</p>
                            ) : (
                              equiposFiltrados.map((eq) => {
                                const esSel = form.equipoId === eq.id;
                                return (
                                  <div
                                    key={eq.id}
                                    onClick={() => {
                                      setForm((f) => ({ ...f, equipoId: eq.id }));
                                      setOpenEquipoDropdown(false);
                                    }}
                                    className={`px-3 py-2 text-left flex items-center justify-between text-xs cursor-pointer rounded-[8px] transition-colors ${
                                      esSel ? 'bg-[#162B4D] text-white font-[800]' : 'hover:bg-slate-50 font-[600] text-slate-700'
                                    }`}
                                  >
                                    <span className="truncate">
                                      <strong className={esSel ? 'text-amber-300' : 'text-slate-900 font-[800]'}>
                                        {eq.codigoInterno || 'SIN-COD'}
                                      </strong>{' '}
                                      · {eq.nombre}
                                    </span>
                                    <span
                                      className={`text-[10px] px-2 py-0.5 rounded-full font-[700] shrink-0 ml-2 ${
                                        esSel
                                          ? 'bg-white/20 text-white'
                                          : 'bg-slate-100 text-slate-500'
                                      }`}
                                    >
                                      {estadoLabel[eq.estado] || eq.estado}
                                    </span>
                                  </div>
                                );
                              })
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                    <div>
                      <label className={labelCls}>Tipo de mantenimiento</label>
                      <select
                        value={form.tipo}
                        onChange={(e) => setForm({ ...form, tipo: e.target.value })}
                        className={inputCls + ' cursor-pointer'}
                      >
                        {TIPOS_MANTENIMIENTO.map((t) => (
                          <option key={t} value={t}>
                            {TIPO_MANTENIMIENTO_LABELS[t]}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className={labelCls}>Prioridad</label>
                      <select
                        value={form.prioridad}
                        onChange={(e) => setForm({ ...form, prioridad: e.target.value })}
                        className={inputCls + ' cursor-pointer'}
                      >
                        {PRIORIDADES_ORDEN.map((p) => (
                          <option key={p} value={p}>
                            {PRIORIDAD_LABELS[p]}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className={labelCls}>Fecha programada</label>
                      <input
                        type="date"
                        min={hoyISO}
                        value={form.fechaProgramada}
                        onChange={(e) => setForm({ ...form, fechaProgramada: e.target.value })}
                        className={inputCls}
                      />
                    </div>
                    <div>
                      <label className={labelCls}>Técnico responsable</label>
                      <input
                        type="text"
                        value={form.tecnicoResponsable}
                        onChange={(e) => setForm({ ...form, tecnicoResponsable: e.target.value })}
                        placeholder="Nombre del técnico"
                        className={inputCls}
                      />
                    </div>
                    <div className="col-span-2">
                      <label className={labelCls}>Descripción *</label>
                      <textarea
                        rows={3}
                        value={form.descripcion}
                        onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
                        placeholder="Describa el trabajo a realizar (diagnóstico, causa, alcance...)"
                        className={inputCls + ' resize-none'}
                      />
                    </div>
                    <div className="col-span-2">
                      <label className={labelCls}>Observaciones</label>
                      <textarea
                        rows={2}
                        value={form.observaciones}
                        onChange={(e) => setForm({ ...form, observaciones: e.target.value })}
                        placeholder="Notas adicionales"
                        className={inputCls + ' resize-none'}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* COLUMNA DERECHA: TAREAS */}
              <div className="xl:col-span-3 space-y-6">
                <div className="bg-white rounded-[20px] border border-slate-200/70 shadow-sm overflow-hidden">
                  <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
                    <h2 className="flex items-center gap-2 font-[800] text-slate-800 text-sm uppercase tracking-wider">
                      <ClipboardList className="w-4 h-4 text-[#E63C46]" />
                      Tareas de la orden
                    </h2>
                    <span className="text-[11px] font-[700] text-slate-400">
                      {tareas.filter((t) => t.trim()).length} tareas
                    </span>
                  </div>
                  <div className="p-6 space-y-3">
                    {tareas.map((tarea, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-500 text-[10px] font-[800] flex items-center justify-center shrink-0">
                          {i + 1}
                        </span>
                        <input
                          type="text"
                          value={tarea}
                          onChange={(e) =>
                            setTareas((prev) => prev.map((t, idx) => (idx === i ? e.target.value : t)))
                          }
                          placeholder={`Tarea ${i + 1} (ej: revisar aislamiento, cambio de aceite...)`}
                          className={inputCls}
                        />
                        <button
                          type="button"
                          onClick={() => setTareas((prev) => prev.filter((_, idx) => idx !== i))}
                          className="p-2 text-slate-400 hover:text-[#E63C46] transition-colors shrink-0"
                          title="Quitar tarea"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => setTareas((prev) => [...prev, ''])}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 text-[11px] font-[800] rounded-[10px] transition-all"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Agregar tarea
                    </button>
                  </div>
                </div>

                <div className="bg-white rounded-[20px] border border-slate-200/70 shadow-sm p-6">
                  <button
                    type="submit"
                    disabled={saving}
                    className="mt-1 w-full inline-flex items-center justify-center gap-2 px-5 py-3.5 bg-[#E63C46] hover:bg-[#C92A36] disabled:opacity-60 text-white text-xs font-[800] rounded-[14px] shadow-lg shadow-[#E63C46]/25 transition-all cursor-pointer"
                  >
                    {saving ? (
                      <>
                        <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        {esEdicion ? 'Guardando cambios...' : 'Creando orden...'}
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        {esEdicion ? 'Guardar Cambios' : 'Crear Orden de Trabajo'}
                      </>
                    )}
                  </button>
                  <p className="text-[10px] text-slate-400 text-center mt-3 font-[500]">
                    Al iniciar la orden, el equipo pasará a estado En mantenimiento / En calibración
                  </p>
                </div>
              </div>
            </form>
          ) : (
            /* ===== PLAN PREVENTIVO ===== */
            <form onSubmit={handlePlanSubmit} className="max-w-2xl">
              <div className="bg-white rounded-[20px] border border-slate-200/70 shadow-sm p-6 space-y-4">
                <h2 className="flex items-center gap-2 font-[800] text-slate-800 text-sm uppercase tracking-wider">
                  <CalendarClock className="w-4 h-4 text-[#E63C46]" />
                  Plan de Mantenimiento Preventivo
                </h2>
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2 space-y-1.5 relative">
                    <label className={labelCls}>Equipo *</label>
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setOpenEquipoDropdown((prev) => !prev)}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-[12px] text-xs font-[700] text-slate-800 text-left flex items-center justify-between focus:outline-none focus:border-[#162B4D] focus:bg-white transition-all cursor-pointer"
                      >
                        <span className="truncate">
                          {equipoPlanSeleccionado
                            ? `${equipoPlanSeleccionado.codigoInterno || 'SIN-COD'} · ${equipoPlanSeleccionado.nombre}`
                            : 'Seleccionar equipo...'}
                        </span>
                        <span className="text-slate-400 text-[10px] ml-2">▼</span>
                      </button>
                    </div>

                    {openEquipoDropdown && (
                      <div className="absolute top-full left-0 right-0 z-30 bg-white border border-slate-200 rounded-[14px] shadow-2xl divide-y divide-slate-100 mt-1 p-2 space-y-2">
                        <div className="relative">
                          <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
                          <input
                            type="text"
                            value={busquedaEquipo}
                            onChange={(e) => setBusquedaEquipo(e.target.value)}
                            placeholder="Buscar por código, nombre, marca..."
                            className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-[8px] text-xs font-[600] text-slate-800 focus:outline-none focus:border-[#162B4D]"
                            autoFocus
                          />
                        </div>

                        <div className="max-h-48 overflow-y-auto divide-y divide-slate-100">
                          {equiposFiltrados.length === 0 ? (
                            <p className="p-3 text-xs text-slate-400 font-[500] text-center">No se encontraron equipos</p>
                          ) : (
                            equiposFiltrados.map((eq) => {
                              const esSel = planForm.equipoId === eq.id;
                              return (
                                <div
                                  key={eq.id}
                                  onClick={() => {
                                    setPlanForm((p) => ({ ...p, equipoId: eq.id }));
                                    setOpenEquipoDropdown(false);
                                  }}
                                  className={`px-3 py-2 text-left flex items-center justify-between text-xs cursor-pointer rounded-[8px] transition-colors ${
                                    esSel ? 'bg-[#162B4D] text-white font-[800]' : 'hover:bg-slate-50 font-[600] text-slate-700'
                                  }`}
                                >
                                  <span className="truncate">
                                    <strong className={esSel ? 'text-amber-300' : 'text-slate-900 font-[800]'}>
                                      {eq.codigoInterno || 'SIN-COD'}
                                    </strong>{' '}
                                    · {eq.nombre}
                                  </span>
                                  <span
                                    className={`text-[10px] px-2 py-0.5 rounded-full font-[700] shrink-0 ml-2 ${
                                      esSel
                                        ? 'bg-white/20 text-white'
                                        : 'bg-slate-100 text-slate-500'
                                    }`}
                                  >
                                    {estadoLabel[eq.estado] || eq.estado}
                                  </span>
                                </div>
                              );
                            })
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                  <div>
                    <label className={labelCls}>Frecuencia</label>
                    <select
                      value={planForm.frecuencia}
                      onChange={(e) => setPlanForm({ ...planForm, frecuencia: e.target.value })}
                      className={inputCls + ' cursor-pointer'}
                    >
                      {FRECUENCIAS_PLAN.map((f) => (
                        <option key={f} value={f}>
                          {FRECUENCIA_LABELS[f]}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}>Próxima fecha</label>
                    <input
                      type="date"
                      min={hoyISO}
                      value={planForm.proximaFecha}
                      onChange={(e) => setPlanForm({ ...planForm, proximaFecha: e.target.value })}
                      className={inputCls}
                    />
                  </div>
                  <div className="col-span-2">
                    <label className={labelCls}>Descripción del plan *</label>
                    <textarea
                      rows={3}
                      value={planForm.descripcion}
                      onChange={(e) => setPlanForm({ ...planForm, descripcion: e.target.value })}
                      placeholder="Ej: revisión trimestral de aislamiento, lubricación y prueba funcional"
                      className={inputCls + ' resize-none'}
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={saving}
                  className="w-full inline-flex items-center justify-center gap-2 px-5 py-3.5 bg-[#E63C46] hover:bg-[#C92A36] disabled:opacity-60 text-white text-xs font-[800] rounded-[14px] shadow-lg shadow-[#E63C46]/25 transition-all"
                >
                  {saving ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Creando plan...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      Crear Plan Preventivo
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </>
      )}
    </div>
  );
}
