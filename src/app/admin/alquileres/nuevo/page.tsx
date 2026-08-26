'use client';
import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Plus,
  Trash2,
  CheckCircle2,
  Package,
  CalendarClock,
  Minus,
  ShieldX,
  Search,
} from 'lucide-react';
import { apiFetch, fetchEquiposPublicos, ROLES_EDITAN_ALQUILERES, SEDES, imagenCompleta } from '@/lib/api';
import { toast } from 'sonner';
import { useSession } from '@/hooks/useSession';
import { norm } from '@/lib/equipo';

interface Equipo {
  id: string;
  codigoInterno: string | null;
  nombre: string;
  marca: string | null;
  modelo: string | null;
  estado: string;
  precio?: number | string | null;
  unidad: string | null;
  imagenUrl: string;
  ubicacion: string;
  tipo: string;
}

interface ItemSeleccionado {
  equipoId: string;
  cantidad: number;
  precioUnitario: number;
}

const IGV = 0.18;

// Fechas por defecto calculadas una sola vez (fuera del render)
const FECHA_HOY = new Date().toISOString().slice(0, 10);
const FECHA_FIN_DEFECTO = new Date(Date.now() + 30 * 86400000)
  .toISOString()
  .slice(0, 10);

export default function NuevoContratoPage() {
  const router = useRouter();
  const user = useSession();
  const puedeEditar = Boolean(
    user && ROLES_EDITAN_ALQUILERES.includes(user.rol),
  );
  const [equipos, setEquipos] = useState<Equipo[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const [form, setForm] = useState({
    clienteNombre: '',
    clienteEmpresa: '',
    clienteDocumento: '',
    clienteEmail: '',
    clienteTelefono: '',
    proyecto: '',
    sede: SEDES[0],
    fechaInicio: FECHA_HOY,
    fechaFin: FECHA_FIN_DEFECTO,
    condiciones: '',
    observaciones: '',
  });

  const [items, setItems] = useState<Record<string, ItemSeleccionado>>({});

  const [busquedaEquipo, setBusquedaEquipo] = useState('');

  useEffect(() => {
    apiFetch<Equipo[]>('/equipos/admin/listar')
      .then((eqs) => setEquipos(eqs.filter((e) => e.tipo === 'ALQUILER')))
      .catch(async () => {
        const publicList = await fetchEquiposPublicos<Equipo>().catch(() => []);
        setEquipos(publicList.filter((e) => e.tipo === 'ALQUILER'));
      })
      .finally(() => setLoading(false));
  }, []);

  const disponibles = useMemo(
    () =>
      equipos.filter((e) => {
        // Un equipo en MANTENIMIENTO o NO DISPONIBLE no se muestra para nuevo alquiler
        const esDispo = e.estado === 'DISPONIBLE';
        if (!esDispo) return false;
        if (!busquedaEquipo.trim()) return true;
        const term = norm(busquedaEquipo.trim());
        const words = term.split(/\s+/);
        const targetText = norm([e.nombre, e.codigoInterno, e.marca, e.modelo, e.ubicacion].filter(Boolean).join(' '));
        return words.every((w) => targetText.includes(w));
      }),
    [equipos, busquedaEquipo]
  );

  const toggleItem = (equipo: Equipo) => {
    setItems((prev) => {
      const next = { ...prev };
      if (next[equipo.id]) {
        delete next[equipo.id];
      } else {
        next[equipo.id] = {
          equipoId: equipo.id,
          cantidad: 1,
          precioUnitario: Number(equipo.precio) || 0,
        };
      }
      return next;
    });
  };

  const setCantidad = (equipoId: string, cantidad: number) => {
    setItems((prev) => ({
      ...prev,
      [equipoId]: { ...prev[equipoId], cantidad: Math.max(1, cantidad) },
    }));
  };

  const setPrecio = (equipoId: string, precio: number) => {
    setItems((prev) => ({
      ...prev,
      [equipoId]: { ...prev[equipoId], precioUnitario: Math.max(0, precio) },
    }));
  };

  const subtotal = Object.values(items).reduce(
    (acc, it) => acc + it.precioUnitario * it.cantidad,
    0
  );
  const igv = subtotal * IGV;
  const total = subtotal + igv;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!form.clienteNombre || !form.proyecto) {
      setError('Complete el cliente y el proyecto');
      return;
    }
    if (Object.keys(items).length === 0) {
      setError('Seleccione al menos un equipo para el alquiler');
      return;
    }
    setSaving(true);
    try {
      const body = {
        clienteNombre: form.clienteNombre,
        clienteEmpresa: form.clienteEmpresa || undefined,
        clienteDocumento: form.clienteDocumento || undefined,
        clienteEmail: form.clienteEmail,
        clienteTelefono: form.clienteTelefono,
        proyecto: form.proyecto,
        sede: form.sede,
        fechaInicio: form.fechaInicio,
        fechaFin: form.fechaFin,
        condiciones: form.condiciones || undefined,
        observaciones: form.observaciones || undefined,
        items: Object.values(items).map((it) => ({
          equipoId: it.equipoId,
          cantidad: it.cantidad,
          precioUnitario: it.precioUnitario,
        })),
      };
      const creada = await apiFetch<{ id: string }>('/alquileres', {
        method: 'POST',
        body: JSON.stringify(body),
      });

      setSuccess(true);
      toast.success('Contrato de alquiler creado correctamente');
      setTimeout(() => router.push(`/admin/alquileres/${creada.id}`), 900);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al crear el contrato';
      setError(msg);
      toast.error(msg);
      setSaving(false);
    }
  };

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
          Tu rol no tiene permisos para crear contratos de alquiler.
        </p>
        <button
          onClick={() => router.push('/admin/alquileres')}
          className="px-5 py-2.5 bg-[#162B4D] text-white text-xs font-[700] rounded-xl"
        >
          Volver a Alquileres
        </button>
      </div>
    );
  }

  const inputCls =
    'w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-[12px] text-xs font-[600] text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#162B4D] focus:bg-white transition-all';
  const labelCls = 'block text-[11px] font-[700] text-slate-500 uppercase tracking-wider mb-1.5';

  return (
    <div className="space-y-6 max-w-6xl">
      {/* ENCABEZADO */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <button
            onClick={() => router.push('/admin/alquileres')}
            className="inline-flex items-center gap-1.5 text-xs font-[700] text-slate-500 hover:text-[#E63C46] transition-colors mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Volver a Alquileres
          </button>
          <h1 className="font-spartan font-[800] text-2xl text-slate-900 uppercase tracking-tight">
            Nuevo Contrato de Alquiler
          </h1>
          <p className="text-sm text-slate-500 mt-1 font-[500]">
            Registre el cliente y seleccione los equipos disponibles a alquilar
          </p>
        </div>
      </div>

      {success && (
        <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 text-emerald-700 px-5 py-4 rounded-[14px] text-sm font-[700]">
          <CheckCircle2 className="w-5 h-5" />
          Contrato creado correctamente. Redirigiendo...
        </div>
      )}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-5 py-3 rounded-[14px] text-xs font-[700]">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid grid-cols-1 xl:grid-cols-5 gap-6">
        {/* COLUMNA IZQUIERDA: DATOS DEL CONTRATO */}
        <div className="xl:col-span-2 space-y-6">
          <div className="bg-white rounded-[20px] border border-slate-200/70 shadow-sm p-6 space-y-4">
            <h2 className="flex items-center gap-2 font-[800] text-slate-800 text-sm uppercase tracking-wider">
              <CalendarClock className="w-4 h-4 text-[#E63C46]" />
              Cliente y Proyecto
            </h2>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className={labelCls}>Cliente *</label>
                <input
                  type="text"
                  value={form.clienteNombre}
                  onChange={(e) => setForm({ ...form, clienteNombre: e.target.value })}
                  placeholder="Nombre del cliente"
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>Empresa</label>
                <input
                  type="text"
                  value={form.clienteEmpresa}
                  onChange={(e) => setForm({ ...form, clienteEmpresa: e.target.value })}
                  placeholder="Razón social"
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>Documento</label>
                <input
                  type="text"
                  value={form.clienteDocumento}
                  onChange={(e) => setForm({ ...form, clienteDocumento: e.target.value })}
                  placeholder="RUC / DNI"
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>Email</label>
                <input
                  type="email"
                  value={form.clienteEmail}
                  onChange={(e) => setForm({ ...form, clienteEmail: e.target.value })}
                  placeholder="correo@empresa.com"
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>Teléfono</label>
                <input
                  type="text"
                  value={form.clienteTelefono}
                  onChange={(e) => setForm({ ...form, clienteTelefono: e.target.value })}
                  placeholder="999 999 999"
                  className={inputCls}
                />
              </div>
              <div className="col-span-2">
                <label className={labelCls}>Proyecto *</label>
                <input
                  type="text"
                  value={form.proyecto}
                  onChange={(e) => setForm({ ...form, proyecto: e.target.value })}
                  placeholder="Nombre del proyecto / obra"
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>Sede</label>
                <select
                  value={form.sede}
                  onChange={(e) => setForm({ ...form, sede: e.target.value })}
                  className={inputCls + ' cursor-pointer'}
                >
                  {SEDES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Inicio</label>
                  <input
                    type="date"
                    value={form.fechaInicio}
                    onChange={(e) => setForm({ ...form, fechaInicio: e.target.value })}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className={labelCls}>Fin</label>
                  <input
                    type="date"
                    value={form.fechaFin}
                    onChange={(e) => setForm({ ...form, fechaFin: e.target.value })}
                    className={inputCls}
                  />
                </div>
              </div>
              <div className="col-span-2">
                <label className={labelCls}>Condiciones comerciales</label>
                <textarea
                  rows={2}
                  value={form.condiciones}
                  onChange={(e) => setForm({ ...form, condiciones: e.target.value })}
                  placeholder="Forma de pago, transporte, garantía..."
                  className={inputCls + ' resize-none'}
                />
              </div>
              <div className="col-span-2">
                <label className={labelCls}>Observaciones</label>
                <textarea
                  rows={2}
                  value={form.observaciones}
                  onChange={(e) => setForm({ ...form, observaciones: e.target.value })}
                  placeholder="Requerimientos especiales del cliente"
                  className={inputCls + ' resize-none'}
                />
              </div>
            </div>
          </div>
        </div>

        {/* COLUMNA DERECHA: SELECCIÓN DE EQUIPOS */}
        <div className="xl:col-span-3 space-y-6">
          <div className="bg-white rounded-[20px] border border-slate-200/70 shadow-sm overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="flex items-center gap-2 font-[800] text-slate-800 text-sm uppercase tracking-wider">
                  <Package className="w-4 h-4 text-[#E63C46]" />
                  Equipos disponibles para alquiler
                </h2>
                <p className="text-[11px] font-[500] text-slate-400 mt-0.5">
                  {disponibles.length} disponibles · {Object.keys(items).length} seleccionados
                </p>
              </div>

              {/* BUSCADOR DE EQUIPOS DISPONIBLES */}
              <div className="relative min-w-[240px]">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                <input
                  type="text"
                  value={busquedaEquipo}
                  onChange={(e) => setBusquedaEquipo(e.target.value)}
                  placeholder="Buscar equipo, marca, código..."
                  className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-[10px] text-xs font-[600] text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#162B4D] focus:bg-white transition-all"
                />
              </div>
            </div>

            {loading ? (
              <div className="py-16 flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-[#162B4D] border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <div className="max-h-[480px] overflow-y-auto divide-y divide-slate-50">
                {disponibles.length === 0 && (
                  <p className="py-10 text-center text-xs text-slate-400 font-[600]">
                    No hay equipos disponibles para alquilar en este momento.
                  </p>
                )}
                {disponibles.map((eq) => {
                  const sel = items[eq.id];
                  const activo = Boolean(sel);
                  return (
                    <div
                      key={eq.id}
                      className={`px-6 py-4 flex items-center gap-4 transition-colors ${
                        activo ? 'bg-[#162B4D]/[0.03]' : 'hover:bg-slate-50/70'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={activo}
                        onChange={() => toggleItem(eq)}
                        className="w-4 h-4 accent-[#E63C46] cursor-pointer shrink-0"
                      />
                      <img loading="lazy" decoding="async" src={imagenCompleta(eq.imagenUrl)}
                        alt={eq.nombre}
                        className="w-12 h-12 rounded-[10px] object-cover bg-slate-100 border border-slate-200 shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-[700] text-slate-900 truncate">{eq.nombre}</p>
                        <p className="text-[11px] text-slate-400 font-[500] mt-0.5">
                          {eq.codigoInterno || 'Sin código'} · {[eq.marca, eq.modelo].filter(Boolean).join(' ') || 'Sin datos'} · Sede {eq.ubicacion}
                        </p>
                      </div>
                      {activo && (
                        <div className="flex items-center gap-2 shrink-0">
                          <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-[8px] px-1 py-0.5">
                            <button
                              type="button"
                              onClick={() => setCantidad(eq.id, sel.cantidad - 1)}
                              className="p-0.5 text-slate-500 hover:text-[#E63C46]"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="text-xs font-[800] w-5 text-center">{sel.cantidad}</span>
                            <button
                              type="button"
                              onClick={() => setCantidad(eq.id, sel.cantidad + 1)}
                              className="p-0.5 text-slate-500 hover:text-[#E63C46]"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                          <input
                            type="number"
                            min={0}
                            step="0.01"
                            value={sel.precioUnitario}
                            onChange={(e) => setPrecio(eq.id, Number(e.target.value))}
                            className="w-24 px-2 py-1.5 bg-white border border-slate-200 rounded-[8px] text-xs font-[700] text-slate-800 text-right focus:outline-none focus:border-[#E63C46]"
                          />
                          <button
                            type="button"
                            onClick={() => toggleItem(eq)}
                            className="p-1.5 text-slate-400 hover:text-[#E63C46] transition-colors"
                            title="Quitar"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* RESUMEN */}
          <div className="bg-white rounded-[20px] border border-slate-200/70 shadow-sm p-6">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-slate-600 font-[600]">
                <span>Subtotal</span>
                <span className="font-[800] text-slate-900">
                  S/ {subtotal.toLocaleString('es-PE', { maximumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between text-slate-600 font-[600]">
                <span>IGV (18%)</span>
                <span className="font-[800] text-slate-900">
                  S/ {igv.toLocaleString('es-PE', { maximumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between text-slate-900 font-[800] pt-3 border-t border-slate-200 text-base">
                <span>Total estimado</span>
                <span className="text-[#E63C46]">
                  S/ {total.toLocaleString('es-PE', { maximumFractionDigits: 2 })}
                </span>
              </div>
            </div>
            <button
              type="submit"
              disabled={saving}
              className="mt-5 w-full inline-flex items-center justify-center gap-2 px-5 py-3.5 bg-[#E63C46] hover:bg-[#C92A36] disabled:opacity-60 text-white text-xs font-[800] rounded-[14px] shadow-lg shadow-[#E63C46]/25 transition-all"
            >
              {saving ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Creando contrato...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  Crear Contrato (Provisional)
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
