'use client';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Plus,
  Search,
  Eye,
  Pencil,
  ClipboardList,
  Wrench,
  CalendarClock,
  AlertTriangle,
  CheckCircle2,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  apiFetch,
  imagenCompleta,
  ORDEN_ESTADO_LABELS,
  ORDEN_ESTADO_COLORS,
  ESTADOS_ORDEN,
  TIPO_MANTENIMIENTO_LABELS,
  PRIORIDAD_LABELS,
  PRIORIDAD_COLORS,
  FRECUENCIA_LABELS,
  ROLES_EDITAN_MANTENIMIENTO,
} from '@/lib/api';
import { useSession } from '@/hooks/useSession';

interface OrdenEquipo {
  id: string;
  codigoInterno: string | null;
  nombre: string;
  estado: string;
  marca: string | null;
  modelo: string | null;
  imagenUrl: string;
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

interface PlanMantenimiento {
  id: string;
  frecuencia: string;
  descripcion: string;
  proximaFecha: string;
  activo: boolean;
  equipo: {
    id: string;
    codigoInterno: string | null;
    nombre: string;
    imagenUrl: string;
  };
}

const fmtFecha = (iso: string) =>
  new Date(iso).toLocaleDateString('es-PE', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

const fmtSoles = (n: number | null) =>
  n != null ? `S/ ${n.toLocaleString('es-PE', { maximumFractionDigits: 2 })}` : '—';

export default function AdminMantenimientoPage() {
  const [ordenes, setOrdenes] = useState<OrdenTrabajo[]>([]);
  const [planes, setPlanes] = useState<PlanMantenimiento[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [estadoFiltro, setEstadoFiltro] = useState('TODOS');
  const user = useSession();
  const puedeEditar = Boolean(
    user && ROLES_EDITAN_MANTENIMIENTO.includes(user.rol),
  );

  const cargar = () => {
    // loading ya inicia en true (evita setState síncrono en el effect)
    Promise.all([
      apiFetch<OrdenTrabajo[]>('/mantenimiento/ordenes').catch(() => []),
      apiFetch<PlanMantenimiento[]>('/mantenimiento/planes').catch(() => []),
    ])
      .then(([o, p]) => {
        setOrdenes(o);
        setPlanes(p);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    cargar();
  }, []);

  const eliminarPlan = async (id: string) => {
    if (!confirm('¿Eliminar este plan de mantenimiento preventivo?')) return;
    try {
      await apiFetch(`/mantenimiento/planes/${id}`, { method: 'DELETE' });
      toast.error('Plan de mantenimiento eliminado');
      cargar();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'No se pudo eliminar el plan');
    }
  };

  const filtrados = ordenes.filter((o) => {
    const matchBusqueda =
      searchTerm === '' ||
      o.numero.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.equipo.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (o.equipo.codigoInterno || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (o.tecnicoResponsable || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchEstado = estadoFiltro === 'TODOS' || o.estado === estadoFiltro;
    return matchBusqueda && matchEstado;
  });

  const pendientes = ordenes.filter((o) => o.estado === 'PENDIENTE').length;
  const enProgreso = ordenes.filter((o) => o.estado === 'EN_PROGRESO').length;
  const completadas = ordenes.filter((o) => o.estado === 'COMPLETADO').length;
  const costoTotal = ordenes.reduce((acc, o) => acc + (o.costoTotal || 0), 0);
  const vencidas = ordenes.filter(
    (o) =>
      (o.estado === 'PENDIENTE' || o.estado === 'EN_PROGRESO') &&
      new Date(o.fechaProgramada) < new Date()
  ).length;

  return (
    <div className="space-y-6">
      {/* ENCABEZADO */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-spartan font-[800] text-2xl text-slate-900 uppercase tracking-tight">
            Mantenimiento Operativo
          </h1>
          <p className="text-sm text-slate-500 mt-1 font-[500]">
            Órdenes de trabajo, mantenimiento preventivo y registro de costos · {ordenes.length} órdenes registradas
          </p>
        </div>
        {puedeEditar && (
          <Link
            href="/admin/mantenimiento/nuevo"
            className="inline-flex items-center gap-2 px-5 py-3 bg-[#E63C46] hover:bg-[#C92A36] text-white text-xs font-[800] rounded-[14px] shadow-lg shadow-[#E63C46]/25 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Nueva Orden de Trabajo</span>
          </Link>
        )}
      </div>

      {/* MÉTRICAS RÁPIDAS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white rounded-[16px] border border-slate-200/70 p-4 shadow-sm">
          <p className="text-[11px] font-[700] text-slate-400 uppercase tracking-wider">Pendientes</p>
          <p className="text-2xl font-[800] text-amber-600 mt-1">{pendientes}</p>
        </div>
        <div className="bg-white rounded-[16px] border border-slate-200/70 p-4 shadow-sm">
          <p className="text-[11px] font-[700] text-slate-400 uppercase tracking-wider">En progreso</p>
          <p className="text-2xl font-[800] text-blue-600 mt-1">{enProgreso}</p>
        </div>
        <div className="bg-white rounded-[16px] border border-slate-200/70 p-4 shadow-sm">
          <p className="text-[11px] font-[700] text-slate-400 uppercase tracking-wider">Completadas</p>
          <p className="text-2xl font-[800] text-emerald-600 mt-1">{completadas}</p>
        </div>
        <div className="bg-white rounded-[16px] border border-slate-200/70 p-4 shadow-sm">
          <p className="text-[11px] font-[700] text-slate-400 uppercase tracking-wider">Costo acumulado</p>
          <p className="text-2xl font-[800] text-[#162B4D] mt-1">{fmtSoles(costoTotal)}</p>
        </div>
      </div>

      {/* FILTROS */}
      <div className="bg-white rounded-[20px] border border-slate-200/70 p-4 shadow-sm grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="relative md:col-span-2">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por orden, equipo, código o técnico..."
            className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-[12px] text-xs font-[600] text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#162B4D] focus:bg-white transition-all"
          />
        </div>
        <select
          value={estadoFiltro}
          onChange={(e) => setEstadoFiltro(e.target.value)}
          className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-[12px] text-xs font-[600] text-slate-700 focus:outline-none focus:border-[#162B4D] cursor-pointer"
        >
          <option value="TODOS">Estado: Todos</option>
          {ESTADOS_ORDEN.map((estado) => (
            <option key={estado} value={estado}>
              {ORDEN_ESTADO_LABELS[estado]}
            </option>
          ))}
        </select>
      </div>

      {/* ALERTA DE VENCIDAS */}
      {vencidas > 0 && (
        <div className="flex items-center gap-3 bg-red-50 border border-red-200 text-red-700 px-5 py-3 rounded-[14px] text-xs font-[700]">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          {vencidas} orden(es) programada(s) tienen su fecha vencida y requieren atención.
        </div>
      )}

      {/* LISTADO DE ÓRDENES */}
      {loading ? (
        <div className="py-20 flex items-center justify-center">
          <div className="w-10 h-10 border-4 border-[#162B4D] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtrados.length === 0 ? (
        <div className="py-16 bg-white rounded-[20px] border border-slate-200 text-center p-8">
          <ClipboardList className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-lg font-[800] text-slate-800">No se encontraron órdenes de trabajo</h3>
          <p className="text-slate-500 text-xs mt-1 font-[500]">
            Ajuste los filtros o cree una nueva orden de trabajo.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-[20px] border border-slate-200/70 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-500 uppercase font-[700] border-b border-slate-200 text-[10px]">
                  <th className="py-3.5 px-5">Orden</th>
                  <th className="py-3.5 px-4">Equipo</th>
                  <th className="py-3.5 px-4">Tipo / Prioridad</th>
                  <th className="py-3.5 px-4">Programada</th>
                  <th className="py-3.5 px-4">Técnico</th>
                  <th className="py-3.5 px-4">Estado</th>
                  <th className="py-3.5 px-4 text-right">Costo</th>
                  <th className="py-3.5 px-4 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtrados.map((o) => (
                  <tr key={o.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-5">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#E63C46]/5 border border-[#E63C46]/10 text-[10px] font-[800] text-[#E63C46] whitespace-nowrap">
                        <Wrench className="w-3 h-3" />
                        {o.numero}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2 min-w-0 max-w-[260px]">
                        <img loading="lazy" decoding="async" loading="lazy" decoding="async"
                          src={imagenCompleta(o.equipo.imagenUrl)}
                          alt={o.equipo.nombre}
                          className="w-9 h-9 rounded-[8px] object-cover bg-slate-100 border border-slate-200 shrink-0"
                        />
                        <div className="min-w-0">
                          <p className="font-[700] text-slate-900 truncate">{o.equipo.nombre}</p>
                          <p className="text-[11px] text-slate-400 font-[500] mt-0.5">
                            {o.equipo.codigoInterno || 'Sin código'}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="space-y-1">
                        <span className="text-slate-700 font-[600]">
                          {TIPO_MANTENIMIENTO_LABELS[o.tipo] || o.tipo}
                        </span>
                        <div>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[9px] font-[800] border whitespace-nowrap ${
                              PRIORIDAD_COLORS[o.prioridad] || 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {PRIORIDAD_LABELS[o.prioridad] || o.prioridad}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`text-slate-600 font-[600] whitespace-nowrap ${
                          new Date(o.fechaProgramada) < new Date() &&
                          (o.estado === 'PENDIENTE' || o.estado === 'EN_PROGRESO')
                            ? 'text-red-500 font-[800]'
                            : ''
                        }`}
                      >
                        {fmtFecha(o.fechaProgramada)}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="text-slate-600 font-[500]">
                        {o.tecnicoResponsable || '—'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-[800] border whitespace-nowrap ${
                          ORDEN_ESTADO_COLORS[o.estado] || 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {ORDEN_ESTADO_LABELS[o.estado] || o.estado}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <span className="font-[800] text-slate-900 whitespace-nowrap">
                        {fmtSoles(o.costoTotal)}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center justify-center gap-1.5">
                        <Link
                          href={`/admin/mantenimiento/nuevo?edit=${o.id}`}
                          className="p-2 rounded-[8px] bg-[#162B4D]/10 hover:bg-[#162B4D] hover:text-white text-[#162B4D] transition-all"
                          title="Editar orden"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </Link>
                        <Link
                          href={`/admin/mantenimiento/${o.id}`}
                          className="p-2 rounded-[8px] bg-slate-100 hover:bg-slate-700 hover:text-white text-slate-600 transition-all"
                          title="Ver detalle de orden"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* PLAN DE MANTENIMIENTO PREVENTIVO */}
      <div className="bg-white rounded-[20px] border border-slate-200/70 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
          <h2 className="flex items-center gap-2 font-[800] text-slate-800 text-sm uppercase tracking-wider">
            <CalendarClock className="w-4 h-4 text-[#E63C46]" />
            Plan de Mantenimiento Preventivo
          </h2>
          {puedeEditar && (
            <Link
              href="/admin/mantenimiento/nuevo?plan=1"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#162B4D] hover:bg-[#233A61] text-white text-[11px] font-[800] rounded-[10px] transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              Nuevo Plan
            </Link>
          )}
        </div>
        {planes.length === 0 ? (
          <p className="py-10 text-center text-xs text-slate-400 font-[600]">
            Aún no hay planes de mantenimiento preventivo registrados.
          </p>
        ) : (
          <div className="divide-y divide-slate-50">
            {planes.map((plan) => (
              <div key={plan.id} className="px-6 py-4 flex items-center gap-4 hover:bg-slate-50/70 transition-colors">
                <img loading="lazy" decoding="async" loading="lazy" decoding="async"
                  src={imagenCompleta(plan.equipo.imagenUrl)}
                  alt={plan.equipo.nombre}
                  className="w-10 h-10 rounded-[8px] object-cover bg-slate-100 border border-slate-200 shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-[700] text-slate-900 truncate">{plan.equipo.nombre}</p>
                  <p className="text-[11px] text-slate-400 font-[500] mt-0.5 truncate">
                    {plan.equipo.codigoInterno} · {plan.descripcion}
                  </p>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-[#162B4D]/5 border border-[#162B4D]/10 text-[10px] font-[800] text-[#162B4D] whitespace-nowrap">
                  {FRECUENCIA_LABELS[plan.frecuencia] || plan.frecuencia}
                </span>
                <div className="text-right shrink-0">
                  <p className="text-[10px] font-[700] text-slate-400 uppercase tracking-wider">Próxima</p>
                  <p className="text-xs font-[800] text-slate-800 whitespace-nowrap">{fmtFecha(plan.proximaFecha)}</p>
                </div>
                {puedeEditar && (
                  <button
                    onClick={() => eliminarPlan(plan.id)}
                    className="p-2 rounded-[8px] text-slate-400 hover:text-[#E63C46] hover:bg-red-50 transition-all shrink-0"
                    title="Eliminar plan"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
