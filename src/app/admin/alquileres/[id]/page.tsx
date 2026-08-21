'use client';
import React, { useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import {
  ArrowLeft,
  Building2,
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  FileText,
  Mail,
  MapPin,
  Phone,
  Package,
  Plus,
  Truck,
  Undo2,
  X,
  AlertTriangle,
  Pencil,
  Save,
} from 'lucide-react';
import {
  apiFetch,
  imagenCompleta,
  CONTRATO_ESTADO_LABELS,
  CONTRATO_ESTADO_COLORS,
  CHECKLIST_ENTREGA,
  CHECKLIST_RETORNO,
  RESULTADO_LABELS,
  RESULTADO_COLORS,
  ROLES_EDITAN_ALQUILERES,
} from '@/lib/api';
import { toast } from 'sonner';
import { useSession } from '@/hooks/useSession';

interface ContratoItem {
  id: string;
  equipoId: string;
  cantidad: number;
  precioUnitario: number | null;
  subtotal: number | null;
  equipo: {
    id: string;
    codigoInterno: string | null;
    nombre: string;
    estado: string;
    marca: string | null;
    modelo: string | null;
    serie: string | null;
    imagenUrl: string;
    ubicacion: string;
  };
}

interface InspeccionItem {
  id: string;
  descripcion: string;
  resultado: string;
  observacion: string | null;
}

interface Inspeccion {
  id: string;
  tipo: string;
  fecha: string;
  responsableNombre: string | null;
  observaciones: string | null;
  items: InspeccionItem[];
}

interface Contrato {
  id: string;
  numero: string;
  clienteNombre: string;
  clienteEmpresa: string | null;
  clienteDocumento: string | null;
  clienteEmail: string;
  clienteTelefono: string;
  proyecto: string;
  sede: string;
  fechaInicio: string;
  fechaFin: string;
  estado: string;
  subtotal: number | null;
  igv: number | null;
  total: number | null;
  condiciones: string | null;
  observaciones: string | null;
  responsableNombre: string | null;
  createdAt: string;
  items: ContratoItem[];
  inspecciones: Inspeccion[];
}

const fmtFecha = (iso: string) =>
  new Date(iso).toLocaleDateString('es-PE', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

const fmtSoles = (n: number | null) =>
  n != null ? `S/ ${n.toLocaleString('es-PE', { maximumFractionDigits: 2 })}` : '—';

const ACCIONES_POR_ESTADO: Record<
  string,
  { accion: string; label: string; color: string; icon: React.ComponentType<{ className?: string }> }[]
> = {
  BORRADOR: [
    { accion: 'CONFIRMAR', label: 'Confirmar reserva', color: 'bg-[#162B4D] hover:bg-[#1f3a6b]', icon: CheckCircle2 },
  ],
  CONFIRMADO: [
    { accion: 'INICIAR', label: 'Iniciar alquiler', color: 'bg-emerald-600 hover:bg-emerald-700', icon: Truck },
  ],
  EN_CURSO: [
    { accion: 'FINALIZAR', label: 'Finalizar contrato', color: 'bg-[#162B4D] hover:bg-[#1f3a6b]', icon: Undo2 },
  ],
  FINALIZADO: [],
  CANCELADO: [],
};

export default function ContratoDetallePage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = params.id as string;
  const user = useSession();
  const puedeEditar = Boolean(
    user && ROLES_EDITAN_ALQUILERES.includes(user.rol),
  );
  const esModoLectura = !puedeEditar;
  const esEdicion = searchParams.get('editar') === '1';

  const [contrato, setContrato] = useState<Contrato | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [confirmarCancelar, setConfirmarCancelar] = useState(false);

  // Formulario de edición (solo aplica a contratos en BORRADOR)
  const [form, setForm] = useState({
    clienteNombre: '',
    clienteEmpresa: '',
    clienteDocumento: '',
    clienteEmail: '',
    clienteTelefono: '',
    proyecto: '',
    sede: '',
    fechaInicio: '',
    fechaFin: '',
    condiciones: '',
    observaciones: '',
  });
  const [guardando, setGuardando] = useState(false);

  const inputCls =
    'w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-[12px] text-xs font-[600] text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#162B4D] focus:bg-white transition-all';
  const labelCls =
    'block text-[11px] font-[700] text-slate-500 uppercase tracking-wider mb-1.5';

  const cargar = () => {
    apiFetch<Contrato>(`/alquileres/${id}`)
      .then((c) => {
        setContrato(c);
        // Inicializar el formulario de edición con los datos actuales
        setForm({
          clienteNombre: c.clienteNombre || '',
          clienteEmpresa: c.clienteEmpresa || '',
          clienteDocumento: c.clienteDocumento || '',
          clienteEmail: c.clienteEmail || '',
          clienteTelefono: c.clienteTelefono || '',
          proyecto: c.proyecto || '',
          sede: c.sede || '',
          fechaInicio: c.fechaInicio
            ? c.fechaInicio.slice(0, 10)
            : '',
          fechaFin: c.fechaFin ? c.fechaFin.slice(0, 10) : '',
          condiciones: c.condiciones || '',
          observaciones: c.observaciones || '',
        });
      })
      .catch(() => setError('No se pudo cargar el contrato'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const guardarEdicion = async () => {
    setGuardando(true);
    setError('');
    try {
      const actualizado = await apiFetch<Contrato>(`/alquileres/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({
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
        }),
      });
      setContrato(actualizado);
      setForm({
        clienteNombre: actualizado.clienteNombre || '',
        clienteEmpresa: actualizado.clienteEmpresa || '',
        clienteDocumento: actualizado.clienteDocumento || '',
        clienteEmail: actualizado.clienteEmail || '',
        clienteTelefono: actualizado.clienteTelefono || '',
        proyecto: actualizado.proyecto || '',
        sede: actualizado.sede || '',
        fechaInicio: actualizado.fechaInicio
          ? actualizado.fechaInicio.slice(0, 10)
          : '',
        fechaFin: actualizado.fechaFin ? actualizado.fechaFin.slice(0, 10) : '',
        condiciones: actualizado.condiciones || '',
        observaciones: actualizado.observaciones || '',
      });
      router.replace(`/admin/alquileres/${id}`);
      toast.success('Contrato de alquiler actualizado correctamente');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al guardar los cambios';
      setError(msg);
      toast.error(msg);
    } finally {
      setGuardando(false);
    }
  };

  const ejecutarAccion = async (accion: string) => {
    setBusy(true);
    setError('');
    try {
      const actualizado = await apiFetch<Contrato>(`/alquileres/${id}/estado`, {
        method: 'PATCH',
        body: JSON.stringify({ estado: accion }),
      });
      setContrato(actualizado);
      toast.success(`Estado del contrato actualizado a: ${CONTRATO_ESTADO_LABELS[accion] || accion}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al cambiar el estado';
      setError(msg);
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  };

  const eliminar = async () => {
    setBusy(true);
    setError('');
    try {
      await apiFetch(`/alquileres/${id}`, { method: 'DELETE' });
      router.push('/admin/alquileres');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al eliminar el contrato');
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="py-24 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-[#162B4D] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!contrato) {
    return (
      <div className="py-16 text-center">
        <p className="text-slate-500 font-[600]">{error || 'Contrato no encontrado'}</p>
      </div>
    );
  }

  const acciones = ACCIONES_POR_ESTADO[contrato.estado] || [];
  const puedeCancelar = !['FINALIZADO', 'CANCELADO'].includes(contrato.estado);
  const puedeEditarInspecciones =
    contrato.estado === 'CONFIRMADO' || contrato.estado === 'EN_CURSO';

  return (
    <div className="space-y-6 max-w-6xl">
      {/* ENCABEZADO */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <button
            onClick={() => router.push('/admin/alquileres')}
            className="inline-flex items-center gap-1.5 text-xs font-[700] text-slate-500 hover:text-[#E63C46] transition-colors mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Volver a Alquileres
          </button>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="font-spartan font-[800] text-2xl text-slate-900 uppercase tracking-tight">
              {contrato.numero}
            </h1>
            <span
              className={`px-3 py-1 rounded-full text-[10px] font-[800] border ${
                CONTRATO_ESTADO_COLORS[contrato.estado] || 'bg-slate-100 text-slate-600'
              }`}
            >
              {CONTRATO_ESTADO_LABELS[contrato.estado] || contrato.estado}
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1 font-[500]">
            {contrato.clienteNombre}
            {contrato.clienteEmpresa ? ` · ${contrato.clienteEmpresa}` : ''} — {contrato.proyecto}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {esModoLectura ? (
            <span className="px-3.5 py-2.5 bg-slate-100 text-slate-500 text-[11px] font-[700] rounded-[12px] inline-flex items-center gap-2">
              <FileText className="w-3.5 h-3.5" />
              Solo lectura
            </span>
          ) : (
            <>
              {acciones.map((a) => {
                const Icon = a.icon;
                return (
                  <button
                    key={a.accion}
                    onClick={() => ejecutarAccion(a.accion)}
                    disabled={busy}
                    className={`inline-flex items-center gap-2 px-5 py-3 text-white text-xs font-[800] rounded-[14px] shadow-lg transition-all disabled:opacity-60 ${a.color}`}
                  >
                    <Icon className="w-4 h-4" />
                    {busy ? 'Procesando...' : a.label}
                  </button>
                );
              })}
              {contrato.estado === 'BORRADOR' && !esEdicion && (
                <button
                  onClick={() => router.push(`/admin/alquileres/${id}?editar=1`)}
                  disabled={busy}
                  className="inline-flex items-center gap-2 px-5 py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-[800] rounded-[14px] transition-all disabled:opacity-60"
                >
                  <Pencil className="w-4 h-4" />
                  Editar
                </button>
              )}
              {puedeCancelar && (
                <button
                  onClick={() => setConfirmarCancelar(true)}
                  disabled={busy}
                  className="inline-flex items-center gap-2 px-5 py-3 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-[800] rounded-[14px] border border-red-200 transition-all disabled:opacity-60"
                >
                  <X className="w-4 h-4" />
                  Cancelar contrato
                </button>
              )}
              {contrato.estado === 'BORRADOR' && (
                <button
                  onClick={eliminar}
                  disabled={busy}
                  className="inline-flex items-center gap-2 px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-500 text-xs font-[800] rounded-[14px] transition-all disabled:opacity-60"
                  title="Eliminar contrato provisional"
                >
                  <FileText className="w-4 h-4" />
                  Eliminar
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-5 py-3 rounded-[14px] text-xs font-[700]">
          {error}
        </div>
      )}

      {/* DATOS DEL CLIENTE / FORMULARIO DE EDICIÓN */}
      {esEdicion && contrato.estado === 'BORRADOR' ? (
        <div className="bg-white rounded-[20px] border border-slate-200/70 shadow-sm p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="flex items-center gap-2 font-[800] text-slate-800 text-sm uppercase tracking-wider">
              <Pencil className="w-4 h-4 text-[#E63C46]" />
              Editar contrato {contrato.numero}
            </h2>
            <button
              onClick={() => router.push(`/admin/alquileres/${id}`)}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 text-[11px] font-[800] rounded-[10px] transition-colors"
            >
              <X className="w-3.5 h-3.5" />
              Cancelar edición
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
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
              <label className={labelCls}>Email *</label>
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
                {['Piura'].map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls}>Inicio *</label>
              <input
                type="date"
                value={form.fechaInicio}
                onChange={(e) => setForm({ ...form, fechaInicio: e.target.value })}
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Fin *</label>
              <input
                type="date"
                value={form.fechaFin}
                onChange={(e) => setForm({ ...form, fechaFin: e.target.value })}
                className={inputCls}
              />
            </div>
            <div className="col-span-3">
              <label className={labelCls}>Condiciones comerciales</label>
              <textarea
                rows={2}
                value={form.condiciones}
                onChange={(e) => setForm({ ...form, condiciones: e.target.value })}
                placeholder="Forma de pago, transporte, garantía..."
                className={inputCls + ' resize-none'}
              />
            </div>
            <div className="col-span-3">
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

          <div className="flex justify-end gap-2 mt-6 pt-5 border-t border-slate-100">
            <button
              onClick={() => router.push(`/admin/alquileres/${id}`)}
              disabled={guardando}
              className="px-5 py-3 rounded-[12px] bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-[800] transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              onClick={guardarEdicion}
              disabled={guardando}
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#E63C46] hover:bg-[#C92A36] text-white text-xs font-[800] rounded-[12px] shadow-lg shadow-[#E63C46]/25 transition-all disabled:opacity-60"
            >
              {guardando ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Guardar cambios
                </>
              )}
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-[20px] border border-slate-200/70 shadow-sm p-6">
          <h2 className="flex items-center gap-2 font-[800] text-slate-800 text-sm uppercase tracking-wider mb-4">
            <Building2 className="w-4 h-4 text-[#E63C46]" />
            Información del contrato
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4 text-xs">
            <div>
              <p className="text-[11px] font-[700] text-slate-400 uppercase tracking-wider">Proyecto</p>
              <p className="font-[700] text-slate-800 mt-1">{contrato.proyecto}</p>
            </div>
            <div>
              <p className="text-[11px] font-[700] text-slate-400 uppercase tracking-wider">Sede</p>
              <p className="flex items-center gap-1 font-[700] text-slate-800 mt-1">
                <MapPin className="w-3 h-3 text-[#E63C46]" />
                {contrato.sede}
              </p>
            </div>
            <div>
              <p className="text-[11px] font-[700] text-slate-400 uppercase tracking-wider">Periodo</p>
              <p className="flex items-center gap-1 font-[700] text-slate-800 mt-1">
                <CalendarDays className="w-3 h-3 text-[#E63C46]" />
                {fmtFecha(contrato.fechaInicio)} → {fmtFecha(contrato.fechaFin)}
              </p>
            </div>
            <div>
              <p className="text-[11px] font-[700] text-slate-400 uppercase tracking-wider">Responsable</p>
              <p className="font-[700] text-slate-800 mt-1">{contrato.responsableNombre || '—'}</p>
            </div>
            <div>
              <p className="text-[11px] font-[700] text-slate-400 uppercase tracking-wider">Email</p>
              <p className="flex items-center gap-1 font-[700] text-slate-800 mt-1 truncate">
                <Mail className="w-3 h-3 text-[#E63C46] shrink-0" />
                {contrato.clienteEmail}
              </p>
            </div>
            <div>
              <p className="text-[11px] font-[700] text-slate-400 uppercase tracking-wider">Teléfono</p>
              <p className="flex items-center gap-1 font-[700] text-slate-800 mt-1">
                <Phone className="w-3 h-3 text-[#E63C46]" />
                {contrato.clienteTelefono}
              </p>
            </div>
          </div>
          {(contrato.condiciones || contrato.observaciones) && (
            <div className="mt-4 pt-4 border-t border-slate-100 grid md:grid-cols-2 gap-4 text-xs">
              {contrato.condiciones && (
                <div>
                  <p className="text-[11px] font-[700] text-slate-400 uppercase tracking-wider">Condiciones comerciales</p>
                  <p className="text-slate-600 font-[500] mt-1 leading-relaxed">{contrato.condiciones}</p>
                </div>
              )}
              {contrato.observaciones && (
                <div>
                  <p className="text-[11px] font-[700] text-slate-400 uppercase tracking-wider">Observaciones</p>
                  <p className="text-slate-600 font-[500] mt-1 leading-relaxed">{contrato.observaciones}</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* EQUIPOS + RESUMEN */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 bg-white rounded-[20px] border border-slate-200/70 shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
            <h2 className="flex items-center gap-2 font-[800] text-slate-800 text-sm uppercase tracking-wider">
              <Package className="w-4 h-4 text-[#E63C46]" />
              Equipos del contrato
            </h2>
            <span className="text-[11px] font-[700] text-slate-400">
              {contrato.items.length} ítem(s)
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-500 uppercase font-[700] border-b border-slate-200 text-[11px]">
                  <th className="py-3 px-6">Equipo</th>
                  <th className="py-3 px-4">Cant.</th>
                  <th className="py-3 px-4 text-right">Precio unit.</th>
                  <th className="py-3 px-6 text-right">Subtotal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {contrato.items.map((item) => (
                  <tr key={item.id}>
                    <td className="py-3.5 px-6">
                      <div className="flex items-center gap-3">
                        <img loading="lazy" decoding="async" src={imagenCompleta(item.equipo.imagenUrl)}
                          alt={item.equipo.nombre}
                          className="w-11 h-11 rounded-[10px] object-cover bg-slate-100 border border-slate-200 shrink-0"
                        />
                        <div className="min-w-0">
                          <p className="font-[700] text-slate-900 truncate max-w-[260px]">{item.equipo.nombre}</p>
                          <p className="text-[11px] text-slate-400 font-[500] mt-0.5">
                            {item.equipo.codigoInterno || 'Sin código'} · {[item.equipo.marca, item.equipo.modelo, item.equipo.serie].filter(Boolean).join(' · ')}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-[800] text-slate-800">{item.cantidad}</td>
                    <td className="py-3.5 px-4 text-right font-[700] text-slate-600 whitespace-nowrap">
                      {fmtSoles(item.precioUnitario)}
                    </td>
                    <td className="py-3.5 px-6 text-right font-[800] text-slate-900 whitespace-nowrap">
                      {fmtSoles(item.subtotal)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white rounded-[20px] border border-slate-200/70 shadow-sm p-6 h-fit">
          <h2 className="flex items-center gap-2 font-[800] text-slate-800 text-sm uppercase tracking-wider mb-4">
            <FileText className="w-4 h-4 text-[#E63C46]" />
            Resumen económico
          </h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between text-slate-600 font-[600]">
              <span>Subtotal</span>
              <span className="font-[800] text-slate-900">{fmtSoles(contrato.subtotal)}</span>
            </div>
            <div className="flex justify-between text-slate-600 font-[600]">
              <span>IGV (18%)</span>
              <span className="font-[800] text-slate-900">{fmtSoles(contrato.igv)}</span>
            </div>
            <div className="flex justify-between text-slate-900 font-[800] pt-3 border-t border-slate-200 text-base">
              <span>Total</span>
              <span className="text-[#E63C46]">{fmtSoles(contrato.total)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* INSPECCIONES / CHECKLISTS */}
      <div className="bg-white rounded-[20px] border border-slate-200/70 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
          <h2 className="flex items-center gap-2 font-[800] text-slate-800 text-sm uppercase tracking-wider">
            <ClipboardCheck className="w-4 h-4 text-[#E63C46]" />
            Check lists digitales (Entrega / Retorno)
          </h2>
          {puedeEditarInspecciones && !esModoLectura && (
            <button
              onClick={() => setModalAbierto(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#162B4D] hover:bg-[#1f3a6b] text-white text-xs font-[800] rounded-[12px] shadow-lg shadow-[#162B4D]/20 transition-all"
            >
              <Plus className="w-4 h-4" />
              Nueva inspección
            </button>
          )}
        </div>

        {contrato.inspecciones.length === 0 ? (
          <p className="py-10 text-center text-xs text-slate-400 font-[600]">
            Aún no se registraron inspecciones para este contrato.
          </p>
        ) : (
          <div className="divide-y divide-slate-100">
            {contrato.inspecciones.map((ins) => (
              <div key={ins.id} className="px-6 py-5">
                <div className="flex items-center gap-3 flex-wrap">
                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-[800] border ${
                      ins.tipo === 'ENTREGA'
                        ? 'bg-blue-50 text-blue-700 border-blue-200'
                        : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    }`}
                  >
                    {ins.tipo === 'ENTREGA' ? <Truck className="w-3 h-3" /> : <Undo2 className="w-3 h-3" />}
                    {ins.tipo === 'ENTREGA' ? 'Entrega' : 'Retorno'}
                  </span>
                  <span className="text-xs font-[700] text-slate-600">
                    {fmtFecha(ins.fecha)}
                  </span>
                  <span className="text-[11px] text-slate-400 font-[500]">
                    Responsable: {ins.responsableNombre || '—'}
                  </span>
                </div>
                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-2.5">
                  {ins.items.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-3 px-4 py-2.5 rounded-[10px] bg-slate-50 border border-slate-100"
                    >
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-[800] border whitespace-nowrap ${
                          RESULTADO_COLORS[item.resultado] || 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {RESULTADO_LABELS[item.resultado] || item.resultado}
                      </span>
                      <div className="min-w-0">
                        <p className="text-xs font-[700] text-slate-700 truncate">{item.descripcion}</p>
                        {item.observacion && (
                          <p className="text-[11px] text-slate-400 font-[500] truncate">{item.observacion}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                {ins.observaciones && (
                  <p className="mt-3 text-[11px] text-slate-500 font-[600] bg-amber-50 border border-amber-100 px-4 py-2 rounded-[8px]">
                    {ins.observaciones}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* MODAL NUEVA INSPECCIÓN */}
      {modalAbierto && (
        <ModalInspeccion
          tipo={contrato.inspecciones.some((i) => i.tipo === 'ENTREGA') ? 'RETORNO' : 'ENTREGA'}
          onClose={() => setModalAbierto(false)}
          onGuardar={() => {
            setModalAbierto(false);
            cargar();
          }}
        />
      )}

      {/* MODAL CANCELAR */}
      {confirmarCancelar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setConfirmarCancelar(false)} />
          <div className="relative bg-white rounded-[20px] p-6 max-w-sm w-full shadow-2xl">
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-4">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
            <h3 className="font-[800] text-slate-900 text-base">Cancelar contrato {contrato.numero}?</h3>
            <p className="text-xs text-slate-500 font-[500] mt-1 leading-relaxed">
              Los equipos reservados o alquilados quedarán disponibles nuevamente. Esta acción queda registrada en auditoría.
            </p>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setConfirmarCancelar(false)}
                className="flex-1 px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-[800] rounded-[12px] transition-all"
              >
                Volver
              </button>
              <button
                onClick={() => {
                  setConfirmarCancelar(false);
                  ejecutarAccion('CANCELAR');
                }}
                className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-700 text-white text-xs font-[800] rounded-[12px] transition-all"
              >
                Sí, cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ===== MODAL DE REGISTRO DE INSPECCIÓN =====
function ModalInspeccion({
  tipo,
  onClose,
  onGuardar,
}: {
  tipo: string;
  onClose: () => void;
  onGuardar: () => void;
}) {
  const params = useParams();
  const id = params.id as string;

  const [items, setItems] = useState(() =>
    (tipo === 'ENTREGA' ? CHECKLIST_ENTREGA : CHECKLIST_RETORNO).map((descripcion) => ({
      descripcion,
      resultado: 'OK',
      observacion: '',
    }))
  );
  const [responsable, setResponsable] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');

  const setResultado = (idx: number, resultado: string) => {
    setItems((prev) => prev.map((it, i) => (i === idx ? { ...it, resultado } : it)));
  };

  const setObservacion = (idx: number, observacion: string) => {
    setItems((prev) => prev.map((it, i) => (i === idx ? { ...it, observacion } : it)));
  };

  const guardar = async () => {
    setGuardando(true);
    setError('');
    try {
      await apiFetch(`/alquileres/${id}/inspecciones`, {
        method: 'POST',
        body: JSON.stringify({
          tipo,
          responsableNombre: responsable || undefined,
          observaciones: observaciones || undefined,
          items: items.map((it) => ({
            descripcion: it.descripcion,
            resultado: it.resultado,
            observacion: it.observacion || undefined,
          })),
        }),
      });
      onGuardar();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al guardar la inspección');
      setGuardando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-[20px] w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white">
          <h3 className="flex items-center gap-2 font-[800] text-slate-900 text-base">
            <ClipboardCheck className="w-5 h-5 text-[#E63C46]" />
            Checklist de {tipo === 'ENTREGA' ? 'Entrega' : 'Retorno'}
          </h3>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100 text-slate-400">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-2.5 rounded-[10px] text-xs font-[700]">
              {error}
            </div>
          )}
          <input
            type="text"
            value={responsable}
            onChange={(e) => setResponsable(e.target.value)}
            placeholder="Responsable (ej: Ing. Percy Loro)"
            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-[12px] text-xs font-[600] text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#162B4D] focus:bg-white transition-all"
          />

          <div className="space-y-3">
            {items.map((item, idx) => (
              <div key={idx} className="bg-slate-50 border border-slate-100 rounded-[12px] p-4">
                <p className="text-xs font-[700] text-slate-800">{item.descripcion}</p>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  {['OK', 'NO_OK', 'NA'].map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setResultado(idx, r)}
                      className={`px-3.5 py-1.5 rounded-full text-[10px] font-[800] border transition-all ${
                        item.resultado === r
                          ? r === 'OK'
                            ? 'bg-emerald-600 text-white border-emerald-600'
                            : r === 'NO_OK'
                              ? 'bg-red-600 text-white border-red-600'
                              : 'bg-slate-600 text-white border-slate-600'
                          : 'bg-white text-slate-500 border-slate-200 hover:border-slate-400'
                      }`}
                    >
                      {RESULTADO_LABELS[r]}
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  value={item.observacion}
                  onChange={(e) => setObservacion(idx, e.target.value)}
                  placeholder="Observación (opcional)"
                  className="mt-2.5 w-full px-3 py-2 bg-white border border-slate-200 rounded-[8px] text-[11px] font-[600] text-slate-700 placeholder-slate-400 focus:outline-none focus:border-[#E63C46] transition-all"
                />
              </div>
            ))}
          </div>

          <textarea
            rows={2}
            value={observaciones}
            onChange={(e) => setObservaciones(e.target.value)}
            placeholder="Observaciones generales de la inspección (opcional)"
            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-[12px] text-xs font-[600] text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#162B4D] focus:bg-white transition-all resize-none"
          />

          <button
            onClick={guardar}
            disabled={guardando}
            className="w-full inline-flex items-center justify-center gap-2 px-5 py-3.5 bg-[#E63C46] hover:bg-[#C92A36] disabled:opacity-60 text-white text-xs font-[800] rounded-[14px] shadow-lg shadow-[#E63C46]/25 transition-all"
          >
            {guardando ? (
              <>
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Guardando...
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                Guardar checklist
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
