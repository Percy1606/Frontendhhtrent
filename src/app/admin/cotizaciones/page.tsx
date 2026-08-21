'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  FileText,
  Mail,
  Phone,
  MessageSquare,
  Trash2,
  Eye,
  X,
  Inbox,
  Send,
  CheckCircle2,
  FileCheck,
  XCircle,
  CalendarDays,
  ArrowRight,
  FilePlus2,
  Loader2,
  Search,
  Ticket,
  Truck,
  FileDown,
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import ProformaModal from '@/components/ProformaModal';
import {
  apiFetch,
  imagenCompleta,
  COTIZACION_ESTADO_COLORS,
  COTIZACION_ESTADO_LABELS,
  ESTADOS_COTIZACION,
  formatPEN,
  SEDES,
} from '@/lib/api';
import { useSession } from '@/hooks/useSession';
import { tipoLabel, tipoBadgeClass } from '@/lib/equipo';
import { toast } from 'sonner';

interface ItemCotizacion {
  id: string;
  cantidad: number;
  equipo: {
    id: string;
    codigoInterno: string | null;
    nombre: string;
    precio: number | null;
    imagenUrl: string;
    tipo: string;
    marca: string | null;
  };
}

interface Cotizacion {
  id: string;
  clienteNombre: string;
  clienteEmpresa: string | null;
  clienteEmail: string;
  clienteTelefono: string;
  mensaje: string | null;
  totalEstimado: number | null;
  estado: string;
  contratoId?: string | null;
  createdAt: string;
  items: ItemCotizacion[];
  contrato: { id: string; numero: string } | null;
}

// Roles que pueden generar un contrato desde una cotización aprobada
const ROLES_CONVERSION = ['ADMINISTRADOR', 'GERENCIA', 'COMERCIAL', 'LOGISTICA'];

// Fecha en formato YYYY-MM-DD usando la zona horaria LOCAL (no UTC)
function aISO(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
}

function hoyISO(): string {
  return aISO(new Date());
}

function enNDias(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return aISO(d);
}

function formatoFecha(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('es-PE', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

export default function AdminCotizacionesPage() {
  const router = useRouter();
  const [cotizaciones, setCotizaciones] = useState<Cotizacion[]>([]);
  const [cargando, setCargando] = useState(true);
  const [filtro, setFiltro] = useState<string>('TODOS');
  const [detalle, setDetalle] = useState<Cotizacion | null>(null);
  const [configurandoProforma, setConfigurandoProforma] = useState<Cotizacion | null>(null);
  const [confirmarEliminar, setConfirmarEliminar] = useState<string | null>(
    null,
  );
  const [cambiando, setCambiando] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // ---- Estado de conversión a contrato ----
  const [convirtiendo, setConvirtiendo] = useState<Cotizacion | null>(null);
  const [formConv, setFormConv] = useState({
    proyecto: '',
    sede: SEDES[0],
    fechaInicio: hoyISO(),
    fechaFin: enNDias(30),
    condiciones: '',
    observaciones: '',
  });
  const [guardandoContrato, setGuardandoContrato] = useState(false);
  const [errorConv, setErrorConv] = useState('');
  const [contratoGenerado, setContratoGenerado] = useState<{
    id: string;
    numero: string;
  } | null>(null);

  // Rol del usuario para mostrar/ocultar acciones de conversión
  const rolUsuario = useSession()?.rol ?? null;

  // Estado para modal de motivo de cancelación
  const [cotizacionACancelar, setCotizacionACancelar] = useState<Cotizacion | null>(null);
  const [motivoCancelacionInput, setMotivoCancelacionInput] = useState('');

  // Estado para clave de administrador al eliminar
  const [adminPasswordConfirm, setAdminPasswordConfirm] = useState('');
  const [errorPasswordEliminar, setErrorPasswordEliminar] = useState('');

  // Estado para modal de confirmación de despacho / pago verificado
  const [cotizacionADespachar, setCotizacionADespachar] = useState<Cotizacion | null>(null);

  const puedeConvertir = Boolean(
    rolUsuario && ROLES_CONVERSION.includes(rolUsuario),
  );

  const cargar = () => {
    apiFetch<Cotizacion[]>('/cotizaciones')
      .then((data) => setCotizaciones(data))
      .catch(() => setError('No se pudieron cargar las cotizaciones.'))
      .finally(() => setCargando(false));
  };

  const generarProformaPDF = (cotizacion: Cotizacion) => {
    setConfigurandoProforma(cotizacion);
  };

  useEffect(() => {
    cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- carga inicial única
  }, []);

  const [busqueda, setBusqueda] = useState('');

  const obtenerTicket = (c: Cotizacion) => {
    return `TCK-${String(c.id).substring(0, 8).toUpperCase()}`;
  };

  const filtradas = cotizaciones.filter((c) => {
    const cumpleFiltro = filtro === 'TODOS' || c.estado === filtro;
    if (!cumpleFiltro) return false;
    if (!busqueda.trim()) return true;

    const term = busqueda.trim().toLowerCase();
    const ticket = obtenerTicket(c).toLowerCase();
    const cliente = (c.clienteNombre || '').toLowerCase();
    const empresa = (c.clienteEmpresa || '').toLowerCase();
    const email = (c.clienteEmail || '').toLowerCase();
    const telefono = (c.clienteTelefono || '').toLowerCase();

    return (
      ticket.includes(term) ||
      cliente.includes(term) ||
      empresa.includes(term) ||
      email.includes(term) ||
      telefono.includes(term)
    );
  });

  const conteo = (estado: string) =>
    cotizaciones.filter((c) => c.estado === estado).length;

  const totalPendiente = cotizaciones
    .filter((c) => c.estado === 'PENDIENTE')
    .reduce((acc, c) => acc + (c.totalEstimado ?? 0), 0);

  const cambiarEstado = async (id: string, estado: string, motivoObs?: string, confirmadoPago?: boolean) => {
    if (cambiando) return;
    
    // Si la cotización actual está DESPACHADO y se intenta regresar a APROBADA o PENDIENTE, bloquear
    const actual = cotizaciones.find((c) => c.id === id);
    if (actual?.estado === 'DESPACHADO' && (estado === 'PENDIENTE' || estado === 'APROBADA')) {
      setError('Una cotización que ya fue DESPACHADA no puede regresar a estado Aprobada o Pendiente.');
      return;
    }

    // Si se pasa a DESPACHADO y no ha sido confirmado el pago explícitamente en el modal, abrir la confirmación
    if (estado === 'DESPACHADO' && !confirmadoPago && actual) {
      setCotizacionADespachar(actual);
      return;
    }

    // Si se pasa a RECHAZADA (cancelar) y no viene motivo, abrir el modal
    if (estado === 'RECHAZADA' && !motivoObs && actual) {
      setCotizacionACancelar(actual);
      setMotivoCancelacionInput('');
      return;
    }

    setCambiando(id);
    try {
      const actualizada = await apiFetch<Cotizacion>(
        `/cotizaciones/${id}/estado`,
        {
          method: 'PATCH',
          body: JSON.stringify({ 
            estado,
            observaciones: motivoObs || undefined,
          }),
        },
      );
      setCotizaciones((prev) =>
        prev.map((c) => (c.id === id ? actualizada : c)),
      );
      setDetalle(actualizada);
      setCotizacionACancelar(null);
      setCotizacionADespachar(null);
      setMotivoCancelacionInput('');
      toast.success(`Estado actualizado a: ${COTIZACION_ESTADO_LABELS[estado] || estado}`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Error al cambiar el estado';
      setError(msg);
      toast.error(msg);
    } finally {
      setCambiando(null);
    }
  };

  const eliminar = async (id: string) => {
    if (!adminPasswordConfirm.trim()) {
      setErrorPasswordEliminar('Debes ingresar la contraseña de administrador.');
      return;
    }
    setErrorPasswordEliminar('');
    try {
      const res = await apiFetch<any>(`/cotizaciones/${id}`, {
        method: 'DELETE',
        body: JSON.stringify({ password: adminPasswordConfirm }),
      });

      if (res.error) {
        setErrorPasswordEliminar(res.error);
        toast.error(res.error);
        return;
      }

      setCotizaciones((prev) => prev.filter((c) => c.id !== id));
      if (detalle?.id === id) setDetalle(null);
      setConfirmarEliminar(null);
      setAdminPasswordConfirm('');
      toast.error('Cotización eliminada');
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Error al eliminar la cotización';
      setErrorPasswordEliminar(msg);
      toast.error(msg);
    }
  };

  const abrirConversion = (c: Cotizacion) => {
    setErrorConv('');
    setContratoGenerado(null);
    setFormConv({
      proyecto: c.clienteEmpresa
        ? `Proyecto ${c.clienteEmpresa}`
        : `Proyecto ${c.clienteNombre}`,
      sede: SEDES[0],
      fechaInicio: hoyISO(),
      fechaFin: enNDias(30),
      condiciones: '',
      observaciones: '',
    });
    setConvirtiendo(c);
  };

  const convertir = async () => {
    if (!convirtiendo || guardandoContrato) return;
    if (!formConv.proyecto.trim()) {
      setErrorConv('El proyecto es obligatorio');
      return;
    }
    if (formConv.fechaFin < formConv.fechaInicio) {
      setErrorConv('La fecha de fin debe ser posterior a la de inicio');
      return;
    }
    setGuardandoContrato(true);
    setErrorConv('');
    try {
      const res = await apiFetch<{
        cotizacion: Cotizacion;
        contrato: { id: string; numero: string };
      }>(`/cotizaciones/${convirtiendo.id}/contrato`, {
        method: 'POST',
        body: JSON.stringify(formConv),
      });
      setCotizaciones((prev) =>
        prev.map((c) => (c.id === convirtiendo.id ? res.cotizacion : c)),
      );
      if (detalle?.id === convirtiendo.id) setDetalle(res.cotizacion);
      setContratoGenerado(res.contrato);
    } catch (e) {
      setErrorConv(e instanceof Error ? e.message : 'Error al generar el contrato');
    } finally {
      setGuardandoContrato(false);
    }
  };

  const metrics = [
    { label: 'Pendientes', value: conteo('PENDIENTE'), color: 'text-amber-600', bg: 'bg-amber-100', icon: Inbox },
    { label: 'Enviadas', value: conteo('ENVIADA'), color: 'text-blue-600', bg: 'bg-blue-100', icon: Send },
    { label: 'Aprobadas', value: conteo('APROBADA'), color: 'text-emerald-600', bg: 'bg-emerald-100', icon: CheckCircle2 },
    { label: 'Total pendiente', value: formatPEN(totalPendiente), color: 'text-[#162B4D]', bg: 'bg-[#162B4D]/10', icon: FileCheck },
  ];

  if (cargando) {
    return (
      <div className="py-24 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-[#162B4D] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ENCABEZADO */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-spartan font-[800] text-2xl text-slate-900 uppercase tracking-tight">
            Cotizaciones
          </h1>
          <p className="text-sm text-slate-500 mt-1 font-[500]">
            Gestión de solicitudes web y manuales • {cotizaciones.length} en total
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden lg:inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-50 text-emerald-700 rounded-[14px] text-xs font-[700] border border-emerald-200">
            <Mail className="w-4 h-4" />
            Vía Web y Manual
          </span>
          <button
            onClick={() => router.push('/admin/cotizaciones/nuevo')}
            className="flex items-center gap-2 bg-[#162B4D] text-white px-5 py-2.5 rounded-[14px] text-sm font-[800] hover:bg-[#0f1e36] transition-colors shadow-lg shadow-[#162B4D]/20"
          >
            <FilePlus2 className="w-4 h-4" />
            Nueva Cotización
          </button>
        </div>
      </div>

      {/* MÉTRICAS (TARJETAS MÁS COMPACTAS) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {metrics.map((m) => {
          const Icon = m.icon;
          return (
            <div
              key={m.label}
              className="bg-white rounded-[16px] border border-slate-200/70 p-3.5 shadow-sm hover:shadow-md transition-all flex items-center gap-3"
            >
              <span className={`w-9 h-9 rounded-[10px] ${m.bg} flex items-center justify-center shrink-0`}>
                <Icon className={`w-4 h-4 ${m.color}`} />
              </span>
              <div className="min-w-0">
                <div className="font-spartan font-[800] text-lg sm:text-xl text-slate-900 truncate leading-none">
                  {m.value}
                </div>
                <div className="text-[11px] font-[600] text-slate-500 mt-1 truncate">{m.label}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* CONTROLES: FILTROS + BUSCADOR */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 rounded-[16px] border border-slate-200/70 shadow-sm">
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => setFiltro('TODOS')}
            className={`px-3 py-1.5 rounded-[8px] text-[11px] font-[700] transition-all ${
              filtro === 'TODOS'
                ? 'bg-[#162B4D] text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Todos ({cotizaciones.length})
          </button>
          {ESTADOS_COTIZACION.map((estado) => (
            <button
              key={estado}
              onClick={() => setFiltro(estado)}
              className={`px-3 py-1.5 rounded-[8px] text-[11px] font-[700] transition-all ${
                filtro === estado
                  ? 'bg-[#162B4D] text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {COTIZACION_ESTADO_LABELS[estado]} ({conteo(estado)})
            </button>
          ))}
        </div>

        {/* BUSCADOR DE TICKETS Y CLIENTES */}
        <div className="relative shrink-0 sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por Ticket (TCK-...), cliente o email..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-[10px] text-xs focus:outline-none focus:ring-2 focus:ring-[#162B4D]/20 transition-all font-[500]"
          />
          {busqueda && (
            <button
              onClick={() => setBusqueda('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-[16px] p-4 text-sm font-[600] text-red-700">
          {error}
        </div>
      )}

      {/* TABLA DE COTIZACIONES */}
      <div className="bg-white rounded-[20px] border border-slate-200/70 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-500 uppercase font-[700] border-b border-slate-200">
                <th className="py-3.5 px-4">Ticket</th>
                <th className="py-3.5 px-4">Fecha</th>
                <th className="py-3.5 px-4">Cliente / Empresa</th>
                <th className="py-3.5 px-4">Contacto</th>
                <th className="py-3.5 px-4 text-center">Equipos</th>
                <th className="py-3.5 px-4 text-right">Total estimado</th>
                <th className="py-3.5 px-4">Estado</th>
                <th className="py-3.5 px-4 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtradas.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-10 text-slate-400 font-[500]">
                    No se encontraron cotizaciones {busqueda ? `para "${busqueda}"` : filtro !== 'TODOS' ? `en estado "${COTIZACION_ESTADO_LABELS[filtro]}"` : ''}.
                  </td>
                </tr>
              ) : (
                filtradas.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 text-[11px] font-[800] text-[#162B4D] bg-slate-100 border border-slate-200/80 px-2.5 py-1 rounded-md font-mono">
                        <Ticket className="w-3 h-3 text-[#E63C46]" />
                        {obtenerTicket(c)}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 font-[500] whitespace-nowrap">
                      {formatoFecha(c.createdAt)}
                    </td>
                    <td className="py-3.5 px-5">
                      <p className="font-[700] text-slate-900">{c.clienteNombre}</p>
                      {c.clienteEmpresa && (
                        <p className="text-[10px] text-slate-400 font-[500]">{c.clienteEmpresa}</p>
                      )}
                    </td>
                    <td className="py-3.5 px-5 text-slate-500 font-[500]">
                      <p className="flex items-center gap-1"><Mail className="w-3 h-3" /> {c.clienteEmail}</p>
                      <p className="flex items-center gap-1 mt-0.5"><Phone className="w-3 h-3" /> {c.clienteTelefono}</p>
                    </td>
                    <td className="py-3.5 px-5 text-center font-[700] text-slate-700">
                      {c.items.length}
                    </td>
                    <td className="py-3.5 px-5 text-right font-[800] text-[#162B4D]">
                      {formatPEN(c.totalEstimado)}
                    </td>
                    <td className="py-3.5 px-5">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-[800] border ${
                          COTIZACION_ESTADO_COLORS[c.estado] || 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {COTIZACION_ESTADO_LABELS[c.estado] || c.estado}
                      </span>
                    </td>
                    <td className="py-3.5 px-5">
                      <div className="flex items-center justify-center gap-1.5">
                        {c.estado !== 'DESPACHADO' && c.estado !== 'RECHAZADA' && (
                          <button
                            onClick={() => cambiarEstado(c.id, 'DESPACHADO')}
                            className="p-2 rounded-[8px] bg-purple-600/10 text-purple-600 hover:bg-purple-600 hover:text-white transition-colors"
                            title="Despachar Cotización"
                          >
                            <Truck className="w-4 h-4" />
                          </button>
                        )}
                        {c.estado !== 'RECHAZADA' && !c.contratoId && puedeConvertir && (
                          <button
                            onClick={() => abrirConversion(c)}
                            className="p-2 rounded-[8px] bg-emerald-600/10 text-emerald-600 hover:bg-emerald-600 hover:text-white transition-colors"
                            title="Convertir en contrato de alquiler (Auto-aprueba la cotización)"
                          >
                            <FilePlus2 className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => setDetalle(c)}
                          className="p-2 rounded-[8px] bg-[#162B4D]/5 text-[#162B4D] hover:bg-[#162B4D] hover:text-white transition-colors"
                          title="Ver detalle"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setConfirmarEliminar(c.id)}
                          className="p-2 rounded-[8px] bg-[#E63C46]/10 text-[#E63C46] hover:bg-[#E63C46] hover:text-white transition-colors"
                          title="Eliminar"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL DE DETALLE */}
      {detalle && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={() => setDetalle(null)}>
          <div
            className="bg-white rounded-[24px] w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* CABECERA DEL MODAL */}
            <div className="sticky top-0 bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="w-10 h-10 rounded-[12px] bg-[#162B4D]/5 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-[#162B4D]" />
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="font-[800] text-sm text-slate-900 uppercase">Cotización</h2>
                    <span className="text-[11px] font-[800] text-[#162B4D] bg-slate-100 border border-slate-200 px-2 py-0.5 rounded font-mono">
                      {obtenerTicket(detalle)}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 font-[500]">
                    Recibida el {formatoFecha(detalle.createdAt)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => generarProformaPDF(detalle)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#162B4D] text-white rounded-[10px] text-[11px] font-[800] hover:bg-[#0f1e36] transition-colors"
                >
                  <FileDown className="w-4 h-4" />
                  Generar Proforma PDF
                </button>
                <button onClick={() => setDetalle(null)} className="p-2 rounded-full hover:bg-slate-100 transition-colors">
                  <X className="w-5 h-5 text-slate-500" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* DATOS DEL SOLICITANTE */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                  <span className="text-slate-400 font-[600] uppercase text-[10px] block">Cliente</span>
                  <span className="font-[700] text-slate-900 mt-0.5 block">{detalle.clienteNombre}</span>
                </div>
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                  <span className="text-slate-400 font-[600] uppercase text-[10px] block">Empresa</span>
                  <span className="font-[700] text-slate-900 mt-0.5 block">{detalle.clienteEmpresa || '—'}</span>
                </div>
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                  <span className="text-slate-400 font-[600] uppercase text-[10px] block">Correo</span>
                  <span className="font-[700] text-slate-900 mt-0.5 block break-all">{detalle.clienteEmail}</span>
                </div>
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                  <span className="text-slate-400 font-[600] uppercase text-[10px] block">Teléfono</span>
                  <span className="font-[700] text-slate-900 mt-0.5 block">{detalle.clienteTelefono}</span>
                </div>
                {detalle.mensaje && (
                  <div className="sm:col-span-2 bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                    <span className="text-slate-400 font-[600] uppercase text-[10px] block flex items-center gap-1">
                      <MessageSquare className="w-3 h-3" /> Mensaje del cliente
                    </span>
                    <p className="text-slate-700 mt-1 leading-relaxed">{detalle.mensaje}</p>
                  </div>
                )}
              </div>

              {/* ITEMS */}
              <div>
                <h3 className="text-[11px] font-[800] uppercase tracking-widest text-slate-400 mb-3">
                  Equipos solicitados ({detalle.items.length})
                </h3>
                <div className="space-y-2.5">
                  {detalle.items.map((item) => (
                    <div key={item.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <img
                        src={imagenCompleta(item.equipo.imagenUrl)}
                        alt={item.equipo.nombre}
                        className="w-12 h-12 rounded-lg object-cover bg-white border border-slate-200"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span
                            className={`text-[9px] font-[800] text-white px-2 py-0.5 rounded-md uppercase tracking-wider ${tipoBadgeClass(
                              item.equipo.tipo
                            )}`}
                          >
                            {tipoLabel(item.equipo.tipo)}
                          </span>
                          <span className="text-[10px] text-slate-400 font-[600]">
                            {item.equipo.codigoInterno || '—'} · {item.equipo.marca || 'Sin marca'}
                          </span>
                        </div>
                        <p className="text-xs font-[700] text-slate-900 truncate">{item.equipo.nombre}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-[10px] font-[700] text-[#162B4D]">
                          {item.equipo.tipo === 'ALQUILER'
                            ? `x${item.cantidad} ${item.cantidad === 1 ? 'mes' : 'meses'}`
                            : `x${item.cantidad}`}
                        </p>
                        <p className="text-xs font-[800] text-[#162B4D] mt-0.5">
                          {formatPEN(item.equipo.precio ? item.equipo.precio * item.cantidad : null)}
                          {item.equipo.tipo === 'ALQUILER' && (
                            <span className="text-[10px] font-[600] text-[#E63C46] block">
                              (S/ {(item.equipo.precio ?? 0).toLocaleString('es-PE')} / mes por {item.cantidad} {item.cantidad === 1 ? 'mes' : 'meses'})
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* RESUMEN */}
              <div className="flex items-baseline justify-between bg-slate-900 p-4 rounded-xl text-white">
                <span className="font-[800] text-sm uppercase">Total Estimado General</span>
                <span className="text-xl font-[800] text-[#E63C46]">{formatPEN(detalle.totalEstimado)}</span>
              </div>

              {/* CONTRATO GENERADO */}
              {detalle.contrato && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="w-10 h-10 rounded-[12px] bg-emerald-600/10 flex items-center justify-center shrink-0">
                      <FileCheck className="w-5 h-5 text-emerald-600" />
                    </span>
                    <div>
                      <p className="text-xs font-[800] text-emerald-800">
                        Contrato {detalle.contrato.numero} generado
                      </p>
                      <p className="text-[11px] text-emerald-600 font-[500]">
                        Esta cotización ya fue convertida en contrato de alquiler.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => router.push(`/admin/alquileres/${detalle.contrato!.id}`)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 text-white rounded-[10px] text-[11px] font-[800] hover:bg-emerald-700 transition-colors shrink-0"
                  >
                    Ver contrato
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* CONVERSIÓN A CONTRATO */}
              {detalle.estado !== 'RECHAZADA' && !detalle.contratoId && puedeConvertir && (
                <div className="bg-[#162B4D]/[0.04] border border-[#162B4D]/15 rounded-xl p-4 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="w-10 h-10 rounded-[12px] bg-[#162B4D]/10 flex items-center justify-center shrink-0">
                      <FilePlus2 className="w-5 h-5 text-[#162B4D]" />
                    </span>
                    <div>
                      <p className="text-xs font-[800] text-slate-900">
                        Generar Contrato de Alquiler
                      </p>
                      <p className="text-[11px] text-slate-500 font-[500]">
                        Genere el contrato de alquiler oficial. La cotización pasará a estado APROBADA (Pago Verificado) automáticamente.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => abrirConversion(detalle)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#162B4D] text-white rounded-[10px] text-[11px] font-[800] hover:bg-[#0f1e36] transition-colors shrink-0"
                  >
                    Convertir en contrato
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* CAMBIO DE ESTADO */}
              <div>
                <h3 className="text-[11px] font-[800] uppercase tracking-widest text-slate-400 mb-3">
                  Cambiar estado
                </h3>
                <div className="flex flex-wrap gap-2">
                  {ESTADOS_COTIZACION.map((estado) => {
                    const esBloqueado =
                      detalle.estado === 'DESPACHADO' &&
                      (estado === 'PENDIENTE' || estado === 'APROBADA');
                    const esActual = detalle.estado === estado;

                    return (
                      <button
                        key={estado}
                        onClick={() => cambiarEstado(detalle.id, estado)}
                        disabled={esActual || esBloqueado || cambiando === detalle.id}
                        className={`px-3.5 py-2 rounded-[10px] text-[11px] font-[700] transition-all ${
                          esActual
                            ? 'bg-[#162B4D] text-white shadow-sm cursor-default'
                            : esBloqueado
                            ? 'bg-slate-100 text-slate-300 border border-slate-200 cursor-not-allowed line-through'
                            : 'bg-slate-100 text-slate-600 hover:bg-[#E63C46] hover:text-white'
                        }`}
                        title={
                          esBloqueado
                            ? 'Una cotización despachada no puede regresar a Pendiente o Aprobada'
                            : ''
                        }
                      >
                        {COTIZACION_ESTADO_LABELS[estado]}
                      </button>
                    );
                  })}
                </div>
                <p className="text-[10px] text-slate-400 font-[500] mt-2">
                  PENDIENTE → APROBADA → DESPACHADO. Si la cotización fue despachada, no puede revertirse a Pendiente o Aprobada.
                </p>
              </div>

              {/* ELIMINAR */}
              <div className="border-t border-slate-100 pt-4 flex items-center justify-between">
                <span className="text-[11px] text-slate-400 font-[500]">
                  ¿Deseas eliminar esta cotización? (Requiere clave de admin)
                </span>
                <button
                  onClick={() => {
                    setConfirmarEliminar(detalle.id);
                    setErrorPasswordEliminar('');
                    setAdminPasswordConfirm('');
                  }}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-[10px] bg-[#E63C46]/10 text-[#E63C46] text-[11px] font-[800] hover:bg-[#E63C46] hover:text-white transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Eliminar Cotización
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE CONVERSIÓN A CONTRATO */}
      {convirtiendo && !contratoGenerado && (
        <div className="fixed inset-0 z-[60] bg-black/60 flex items-center justify-center p-4">
          <div
            className="bg-white rounded-[24px] w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* CABECERA */}
            <div className="sticky top-0 bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="w-10 h-10 rounded-[12px] bg-emerald-600/10 flex items-center justify-center">
                  <FilePlus2 className="w-5 h-5 text-emerald-600" />
                </span>
                <div>
                  <h2 className="font-[800] text-sm text-slate-900 uppercase">
                    Convertir en Contrato
                  </h2>
                  <p className="text-[11px] text-slate-400 font-[500]">
                    {convirtiendo.clienteNombre} · {convirtiendo.items.length} equipo(s) ·{' '}
                    {formatPEN(convirtiendo.totalEstimado)}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setConvirtiendo(null)}
                className="p-2 rounded-full hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* EQUIPOS DE LA COTIZACIÓN */}
              <div className="bg-slate-50 rounded-xl border border-slate-100 p-3.5">
                <p className="text-[10px] font-[800] uppercase tracking-widest text-slate-400 mb-2">
                  Equipos que se incluirán
                </p>
                <ul className="space-y-1.5">
                  {convirtiendo.items.map((item) => (
                    <li key={item.id} className="flex items-center justify-between gap-2 text-xs">
                      <span className="font-[600] text-slate-700 truncate">
                        {item.equipo.nombre}
                      </span>
                      <span className="font-[800] text-slate-500 shrink-0">×{item.cantidad}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {errorConv && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-2.5 rounded-[10px] text-[11px] font-[700]">
                  {errorConv}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="block text-[10px] font-[700] text-slate-500 uppercase tracking-wider mb-1.5">
                    Proyecto *
                  </label>
                  <input
                    type="text"
                    value={formConv.proyecto}
                    onChange={(e) => setFormConv({ ...formConv, proyecto: e.target.value })}
                    placeholder="Nombre del proyecto / obra"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-[12px] text-xs font-[600] text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#162B4D] focus:bg-white transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-[700] text-slate-500 uppercase tracking-wider mb-1.5">
                    Sede *
                  </label>
                  <select
                    value={formConv.sede}
                    onChange={(e) => setFormConv({ ...formConv, sede: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-[12px] text-xs font-[600] text-slate-800 cursor-pointer focus:outline-none focus:border-[#162B4D] focus:bg-white transition-all"
                  >
                    {SEDES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-[700] text-slate-500 uppercase tracking-wider mb-1.5">
                      Inicio *
                    </label>
                    <input
                      type="date"
                      value={formConv.fechaInicio}
                      onChange={(e) => setFormConv({ ...formConv, fechaInicio: e.target.value })}
                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-[12px] text-xs font-[600] text-slate-800 focus:outline-none focus:border-[#162B4D] focus:bg-white transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-[700] text-slate-500 uppercase tracking-wider mb-1.5">
                      Fin *
                    </label>
                    <input
                      type="date"
                      value={formConv.fechaFin}
                      onChange={(e) => setFormConv({ ...formConv, fechaFin: e.target.value })}
                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-[12px] text-xs font-[600] text-slate-800 focus:outline-none focus:border-[#162B4D] focus:bg-white transition-all"
                    />
                  </div>
                </div>
                <div className="col-span-2">
                  <label className="block text-[10px] font-[700] text-slate-500 uppercase tracking-wider mb-1.5">
                    Condiciones comerciales
                  </label>
                  <textarea
                    rows={2}
                    value={formConv.condiciones}
                    onChange={(e) => setFormConv({ ...formConv, condiciones: e.target.value })}
                    placeholder="Forma de pago, transporte, garantía..."
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-[12px] text-xs font-[600] text-slate-800 placeholder-slate-400 resize-none focus:outline-none focus:border-[#162B4D] focus:bg-white transition-all"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-[10px] font-[700] text-slate-500 uppercase tracking-wider mb-1.5">
                    Observaciones
                  </label>
                  <textarea
                    rows={2}
                    value={formConv.observaciones}
                    onChange={(e) => setFormConv({ ...formConv, observaciones: e.target.value })}
                    placeholder="Requerimientos especiales del cliente"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-[12px] text-xs font-[600] text-slate-800 placeholder-slate-400 resize-none focus:outline-none focus:border-[#162B4D] focus:bg-white transition-all"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => setConvirtiendo(null)}
                  className="flex-1 px-4 py-3 rounded-[12px] bg-slate-100 text-slate-600 text-xs font-[800] hover:bg-slate-200 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={convertir}
                  disabled={guardandoContrato}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 bg-[#162B4D] text-white rounded-[12px] text-xs font-[800] hover:bg-[#0f1e36] disabled:opacity-60 transition-all"
                >
                  {guardandoContrato ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Generando...
                    </>
                  ) : (
                    <>
                      <FilePlus2 className="w-4 h-4" />
                      Generar contrato (Provisional)
                    </>
                  )}
                </button>
              </div>
              <p className="text-[10px] text-slate-400 font-[500] text-center">
                Se creará un contrato PROVISIONAL con el cliente y los equipos de esta cotización. Podrás ajustar precios, fechas y condiciones antes de confirmarlo.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ÉXITO DE CONVERSIÓN */}
      {contratoGenerado && (
        <div className="fixed inset-0 z-[60] bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-[24px] p-6 w-full max-w-sm text-center shadow-2xl">
            <span className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-7 h-7 text-emerald-600" />
            </span>
            <h3 className="font-[800] text-base text-slate-900">Contrato generado</h3>
            <p className="text-xs text-slate-500 font-[500] mt-1.5 mb-6">
              La cotización quedó marcada como <b>CONTRATO</b> y se creó el contrato{' '}
              <b className="text-[#162B4D]">{contratoGenerado.numero}</b> en estado Provisional.
            </p>
            <div className="flex flex-col gap-2">
              <button
                onClick={() => router.push(`/admin/alquileres/${contratoGenerado.id}`)}
                className="inline-flex items-center justify-center gap-2 px-4 py-3 bg-[#162B4D] text-white rounded-[12px] text-xs font-[800] hover:bg-[#0f1e36] transition-colors"
              >
                Ir al contrato
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => {
                  setContratoGenerado(null);
                  setConvirtiendo(null);
                }}
                className="px-4 py-2.5 rounded-[12px] text-xs font-[700] text-slate-500 hover:bg-slate-100 transition-colors"
              >
                Seguir en cotizaciones
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL PARA SOLICITAR MOTIVO DE CANCELACIÓN */}
      {cotizacionACancelar && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={() => setCotizacionACancelar(null)}>
          <div className="bg-white rounded-[24px] p-6 w-full max-w-md shadow-2xl space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-3">
                <span className="w-10 h-10 rounded-[12px] bg-red-100 text-red-600 flex items-center justify-center">
                  <XCircle className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="font-[800] text-sm text-slate-900">Cancelar Cotización</h3>
                  <p className="text-[11px] text-slate-400 font-[500]">{obtenerTicket(cotizacionACancelar)}</p>
                </div>
              </div>
              <button onClick={() => setCotizacionACancelar(null)} className="p-1 rounded-full hover:bg-slate-100">
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>

            <p className="text-xs text-slate-600 font-[500] leading-relaxed">
              Por favor, ingrese la razón o motivo por el cual el cliente o el área comercial está cancelando esta solicitud:
            </p>

            <textarea
              rows={3}
              value={motivoCancelacionInput}
              onChange={(e) => setMotivoCancelacionInput(e.target.value)}
              placeholder="Ej: Cliente desistió por tiempo de flete / Presupuesto declinado / Cambio de alcance de obra..."
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-[500] text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500/20"
            />

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setCotizacionACancelar(null)}
                className="px-4 py-2.5 rounded-[10px] bg-slate-100 text-slate-600 text-xs font-[700] hover:bg-slate-200 transition-colors"
              >
                Volver
              </button>
              <button
                onClick={() => cambiarEstado(cotizacionACancelar.id, 'RECHAZADA', motivoCancelacionInput.trim() || 'Cancelado por el cliente')}
                className="px-4 py-2.5 rounded-[10px] bg-[#E63C46] text-white text-xs font-[800] hover:bg-[#C92A36] transition-colors shadow-md shadow-[#E63C46]/20"
              >
                Confirmar Cancelación
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE CONFIRMACIÓN DE VERIFICACIÓN DE PAGO ANTES DE DESPACHAR */}
      {cotizacionADespachar && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={() => setCotizacionADespachar(null)}>
          <div className="bg-white rounded-[24px] p-6 w-full max-w-md shadow-2xl space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-3">
                <span className="w-10 h-10 rounded-[12px] bg-purple-100 text-purple-700 flex items-center justify-center">
                  <Truck className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="font-[800] text-sm text-slate-900">Verificación de Pago antes de Despachar</h3>
                  <p className="text-[11px] text-slate-400 font-[500]">{obtenerTicket(cotizacionADespachar)}</p>
                </div>
              </div>
              <button onClick={() => setCotizacionADespachar(null)} className="p-1 rounded-full hover:bg-slate-100">
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>

            <div className="bg-purple-50/70 border border-purple-200/80 rounded-xl p-4 space-y-2 text-xs">
              <div className="flex items-center justify-between font-[700] text-purple-900">
                <span>Cliente: {cotizacionADespachar.clienteNombre}</span>
                <span className="text-[10px] bg-purple-200 px-2 py-0.5 rounded-full">{formatPEN(cotizacionADespachar.totalEstimado)}</span>
              </div>
              <p className="text-slate-600 text-[11px] font-[500] leading-relaxed">
                ¿Te has asegurado de que la constancia o depósito bancario (BBVA, Interbank o BN) fue validado exitosamente en la cuenta corporativa?
              </p>
            </div>

            <p className="text-[11px] text-slate-500 font-[500]">
              Al confirmar, el sistema registrará el pago como verificado y marcará el pedido como <span className="font-[700] text-purple-700">DESPACHADO</span> actualizando la pantalla del cliente en tiempo real.
            </p>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setCotizacionADespachar(null)}
                className="px-4 py-2.5 rounded-[10px] bg-slate-100 text-slate-600 text-xs font-[700] hover:bg-slate-200 transition-colors"
              >
                Volver sin cambiar
              </button>
              <button
                onClick={() => cambiarEstado(cotizacionADespachar.id, 'DESPACHADO', undefined, true)}
                className="px-4 py-2.5 rounded-[10px] bg-purple-600 text-white text-xs font-[800] hover:bg-purple-700 transition-colors shadow-md shadow-purple-600/20 flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Sí, pago verificado y despachar</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRMACIÓN DE ELIMINACIÓN CON CONTRASEÑA */}
      {confirmarEliminar && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={() => setConfirmarEliminar(null)}>
          <div className="bg-white rounded-[24px] p-6 w-full max-w-sm shadow-2xl space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3">
              <span className="w-10 h-10 rounded-[12px] bg-[#E63C46]/10 flex items-center justify-center shrink-0">
                <XCircle className="w-5 h-5 text-[#E63C46]" />
              </span>
              <div>
                <h3 className="font-[800] text-sm text-slate-900">Eliminar cotización</h3>
                <p className="text-[11px] text-slate-400 font-[500]">Protegido con clave de Administrador</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 font-[500] leading-relaxed">
              Ingrese la contraseña del Administrador para autorizar la eliminación permanente de este registro:
            </p>

            <div>
              <input
                type="password"
                value={adminPasswordConfirm}
                onChange={(e) => {
                  setAdminPasswordConfirm(e.target.value);
                  setErrorPasswordEliminar('');
                }}
                placeholder="Contraseña del Administrador..."
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-[600] text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#E63C46]"
              />
              {errorPasswordEliminar && (
                <p className="text-[10px] text-[#E63C46] font-[600] mt-1.5">{errorPasswordEliminar}</p>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => {
                  setConfirmarEliminar(null);
                  setAdminPasswordConfirm('');
                  setErrorPasswordEliminar('');
                }}
                className="px-4 py-2.5 rounded-[10px] bg-slate-100 text-slate-600 text-xs font-[700] hover:bg-slate-200 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => eliminar(confirmarEliminar)}
                className="px-4 py-2.5 rounded-[10px] bg-[#E63C46] text-white text-xs font-[800] hover:bg-[#C92A36] transition-colors shadow-md shadow-[#E63C46]/20"
              >
                Confirmar Eliminación
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ICONO DECORATIVO CUANDO NO HAY NADA */}
      {cotizaciones.length === 0 && (
        <div className="bg-white rounded-[20px] border border-dashed border-slate-300 p-10 text-center">
          <CalendarDays className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-sm font-[700] text-slate-500">Aún no hay solicitudes</p>
          <p className="text-xs text-slate-400 font-[500] mt-1">
            Cuando un cliente envíe una cotización desde el sitio web, aparecerá aquí.
          </p>
        </div>
      )}

      {/* MODAL CONFIGURACIÓN DE PROFORMA PDF */}
      {configurandoProforma && (
        <ProformaModal
          cotizacion={configurandoProforma}
          onClose={() => setConfigurandoProforma(null)}
        />
      )}
    </div>
  );
}
