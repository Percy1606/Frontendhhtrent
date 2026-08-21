'use client';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Plus,
  Search,
  Eye,
  Pencil,
  CalendarClock,
  Building2,
  MapPin,
  FileText,
  Trash2,
  AlertTriangle,
  X,
} from 'lucide-react';
import {
  apiFetch,
  imagenCompleta,
  CONTRATO_ESTADO_LABELS,
  CONTRATO_ESTADO_COLORS,
  ESTADOS_CONTRATO,
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
    imagenUrl: string;
  };
}

interface Contrato {
  id: string;
  numero: string;
  clienteNombre: string;
  clienteEmpresa: string | null;
  clienteEmail: string;
  clienteTelefono: string;
  proyecto: string;
  sede: string;
  fechaInicio: string;
  fechaFin: string;
  estado: string;
  total: number | null;
  responsableNombre: string | null;
  items: ContratoItem[];
}

const fmtFecha = (iso: string) =>
  new Date(iso).toLocaleDateString('es-PE', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

const fmtSoles = (n: number | null) =>
  n != null ? `S/ ${n.toLocaleString('es-PE', { maximumFractionDigits: 2 })}` : '—';

export default function AdminAlquileresPage() {
  const [contratos, setContratos] = useState<Contrato[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [estadoFiltro, setEstadoFiltro] = useState('TODOS');
  const [confirmarEliminar, setConfirmarEliminar] = useState<Contrato | null>(
    null,
  );
  const [eliminando, setEliminando] = useState(false);
  const user = useSession();
  const puedeEditar = Boolean(
    user && ROLES_EDITAN_ALQUILERES.includes(user.rol),
  );

  const ejecutarEliminacion = async () => {
    if (!confirmarEliminar || eliminando) return;
    setEliminando(true);
    try {
      await apiFetch(`/alquileres/${confirmarEliminar.id}`, {
        method: 'DELETE',
      });
      setContratos((prev) => prev.filter((c) => c.id !== confirmarEliminar.id));
      setConfirmarEliminar(null);
      toast.error('Contrato eliminado');
    } catch (err) {
      toast.error(
        err instanceof Error
          ? `No se pudo eliminar: ${err.message}`
          : 'No se pudo eliminar el contrato',
      );
    } finally {
      setEliminando(false);
    }
  };

  useEffect(() => {
    apiFetch<Contrato[]>('/alquileres')
      .then(setContratos)
      .catch(() => setContratos([]))
      .finally(() => setLoading(false));
  }, []);

  const filtrados = contratos.filter((c) => {
    const matchBusqueda =
      searchTerm === '' ||
      c.numero.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.clienteNombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.proyecto.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.clienteEmpresa || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchEstado = estadoFiltro === 'TODOS' || c.estado === estadoFiltro;
    return matchBusqueda && matchEstado;
  });

  const totalActivos = contratos.filter(
    (c) => c.estado === 'EN_CURSO' || c.estado === 'CONFIRMADO'
  ).length;

  return (
    <div className="space-y-6">
      {/* ENCABEZADO */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-spartan font-[800] text-2xl text-slate-900 uppercase tracking-tight">
            Sistema de Alquileres
          </h1>
          <p className="text-sm text-slate-500 mt-1 font-[500]">
            Contratos de alquiler: reserva → contrato → entrega → retorno · {contratos.length} contratos registrados
          </p>
        </div>
        {puedeEditar && (
          <Link
            href="/admin/alquileres/nuevo"
            className="inline-flex items-center gap-2 px-5 py-3 bg-[#E63C46] hover:bg-[#C92A36] text-white text-xs font-[800] rounded-[14px] shadow-lg shadow-[#E63C46]/25 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Nuevo Contrato</span>
          </Link>
        )}
      </div>

      {/* MÉTRICAS RÁPIDAS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white rounded-[16px] border border-slate-200/70 p-4 shadow-sm">
          <p className="text-[11px] font-[700] text-slate-400 uppercase tracking-wider">Total contratos</p>
          <p className="text-2xl font-[800] text-[#162B4D] mt-1">{contratos.length}</p>
        </div>
        <div className="bg-white rounded-[16px] border border-slate-200/70 p-4 shadow-sm">
          <p className="text-[11px] font-[700] text-slate-400 uppercase tracking-wider">Activos</p>
          <p className="text-2xl font-[800] text-blue-600 mt-1">{totalActivos}</p>
        </div>
        <div className="bg-white rounded-[16px] border border-slate-200/70 p-4 shadow-sm">
          <p className="text-[11px] font-[700] text-slate-400 uppercase tracking-wider">En curso</p>
          <p className="text-2xl font-[800] text-emerald-600 mt-1">
            {contratos.filter((c) => c.estado === 'EN_CURSO').length}
          </p>
        </div>
        <div className="bg-white rounded-[16px] border border-slate-200/70 p-4 shadow-sm">
          <p className="text-[11px] font-[700] text-slate-400 uppercase tracking-wider">En provisional</p>
          <p className="text-2xl font-[800] text-amber-600 mt-1">
            {contratos.filter((c) => c.estado === 'BORRADOR').length}
          </p>
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
            placeholder="Buscar por número, cliente, empresa o proyecto..."
            className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-[12px] text-xs font-[600] text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#162B4D] focus:bg-white transition-all"
          />
        </div>
        <select
          value={estadoFiltro}
          onChange={(e) => setEstadoFiltro(e.target.value)}
          className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-[12px] text-xs font-[600] text-slate-700 focus:outline-none focus:border-[#162B4D] cursor-pointer"
        >
          <option value="TODOS">Estado: Todos</option>
          {ESTADOS_CONTRATO.map((estado) => (
            <option key={estado} value={estado}>
              Estado: {CONTRATO_ESTADO_LABELS[estado]}
            </option>
          ))}
        </select>
      </div>

      {/* LISTADO */}
      {loading ? (
        <div className="py-20 flex items-center justify-center">
          <div className="w-10 h-10 border-4 border-[#162B4D] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtrados.length === 0 ? (
        <div className="py-16 bg-white rounded-[20px] border border-slate-200 text-center p-8">
          <CalendarClock className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-lg font-[800] text-slate-800">No se encontraron contratos</h3>
          <p className="text-slate-500 text-xs mt-1 font-[500]">
            Ajuste los filtros o cree un nuevo contrato de alquiler.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-[20px] border border-slate-200/70 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-500 uppercase font-[700] border-b border-slate-200 text-[11px]">
                  <th className="py-3.5 px-5">Contrato</th>
                  <th className="py-3.5 px-4">Cliente / Proyecto</th>
                  <th className="py-3.5 px-4">Equipos</th>
                  <th className="py-3.5 px-4">Periodo</th>
                  <th className="py-3.5 px-4">Estado</th>
                  <th className="py-3.5 px-4 text-right">Total</th>
                  <th className="py-3.5 px-4 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtrados.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-5">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#162B4D]/5 border border-[#162B4D]/10 text-[11px] font-[800] text-[#162B4D] whitespace-nowrap">
                        <FileText className="w-3 h-3" />
                        {c.numero}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="min-w-0 max-w-[260px]">
                        <p className="font-[700] text-slate-900 truncate">
                          {c.clienteNombre}
                          {c.clienteEmpresa ? ` · ${c.clienteEmpresa}` : ''}
                        </p>
                        <p className="text-[11px] text-slate-400 font-[500] mt-0.5 truncate">
                          {c.proyecto}
                        </p>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        {c.items.slice(0, 3).map((item) => (
                          <img loading="lazy" decoding="async" loading="lazy" decoding="async"
                            key={item.id}
                            src={imagenCompleta(item.equipo.imagenUrl)}
                            alt={item.equipo.nombre}
                            title={item.equipo.nombre}
                            className="w-8 h-8 rounded-[8px] object-cover bg-slate-100 border border-slate-200"
                          />
                        ))}
                        {c.items.length > 3 && (
                          <span className="text-[10px] font-[800] text-slate-400">
                            +{c.items.length - 3}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="text-slate-600 font-[600] whitespace-nowrap">
                        {fmtFecha(c.fechaInicio)} → {fmtFecha(c.fechaFin)}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[11px] font-[800] border whitespace-nowrap ${
                          CONTRATO_ESTADO_COLORS[c.estado] || 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {CONTRATO_ESTADO_LABELS[c.estado] || c.estado}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <span className="font-[800] text-slate-900 whitespace-nowrap">
                        {fmtSoles(c.total)}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center justify-center gap-1.5">
                        <Link
                          href={`/admin/alquileres/${c.id}`}
                          className="p-2 rounded-[8px] bg-slate-100 hover:bg-[#162B4D] hover:text-white text-slate-600 transition-all"
                          title="Ver contrato"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                        {puedeEditar && c.estado === 'BORRADOR' && (
                          <Link
                            href={`/admin/alquileres/${c.id}?editar=1`}
                            className="p-2 rounded-[8px] bg-slate-100 hover:bg-[#E63C46] hover:text-white text-slate-600 transition-all"
                            title="Editar contrato"
                          >
                            <Pencil className="w-4 h-4" />
                          </Link>
                        )}
                        {puedeEditar &&
                          c.estado !== 'FINALIZADO' &&
                          c.estado !== 'CANCELADO' && (
                            <button
                              onClick={() => setConfirmarEliminar(c)}
                              className="p-2 rounded-[8px] bg-slate-100 hover:bg-red-600 hover:text-white text-slate-600 transition-all"
                              title="Cancelar contrato"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL DE CONFIRMACIÓN DE ELIMINACIÓN */}
      {confirmarEliminar && (
        <div
          className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-[2px]"
          onClick={() => !eliminando && setConfirmarEliminar(null)}
        >
          <div
            className="bg-white rounded-[24px] w-full max-w-md shadow-2xl overflow-hidden animate-[modalIn_.18s_ease-out]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* CABECERA */}
            <div className="px-6 pt-6 pb-4 flex items-start justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <span className="w-12 h-12 rounded-[14px] bg-red-100 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                </span>
                <div>
                  <h3 className="font-[800] text-base text-slate-900">
                    ¿Cancelar este contrato?
                  </h3>
                  <p className="text-[11px] text-slate-400 font-[600] mt-0.5">
                    Esta acción no se puede deshacer
                  </p>
                </div>
              </div>
              <button
                onClick={() => setConfirmarEliminar(null)}
                disabled={eliminando}
                className="p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors disabled:opacity-40"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* CUERPO */}
            <div className="px-6 pb-6">
              <div className="bg-slate-50 border border-slate-200 rounded-[14px] p-4 mb-4">
                <p className="font-[700] text-sm text-slate-900">
                  {confirmarEliminar.numero}
                </p>
                <p className="text-[11px] text-slate-500 font-[600] mt-0.5">
                  {confirmarEliminar.clienteNombre}
                  {confirmarEliminar.clienteEmpresa
                    ? ` · ${confirmarEliminar.clienteEmpresa}`
                    : ''}{' '}
                  · {confirmarEliminar.items.length} equipo(s)
                </p>
              </div>
              <p className="text-xs text-slate-500 font-[500] leading-relaxed">
                El contrato <b>{confirmarEliminar.numero}</b> <b>no se
                borrará</b>: se marcará como <b>CANCELADO</b> y sus equipos
                quedarán <b>libres (Disponible)</b>. El registro se conserva en
                el sistema para auditoría e historial.
              </p>

              {/* ACCIONES */}
              <div className="flex gap-2.5 mt-5">
                <button
                  onClick={() => setConfirmarEliminar(null)}
                  disabled={eliminando}
                  className="flex-1 px-4 py-3 rounded-[12px] bg-slate-100 text-slate-600 text-xs font-[800] hover:bg-slate-200 disabled:opacity-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={ejecutarEliminacion}
                  disabled={eliminando}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 bg-[#E63C46] text-white rounded-[12px] text-xs font-[800] hover:bg-[#C92A36] disabled:opacity-60 transition-all"
                >
                  {eliminando ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                      Eliminando...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" />
                      Sí, cancelar
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
