'use client';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Plus,
  Search,
  MapPin,
  Eye,
  Pencil,
  Filter,
  FolderTree,
  Tag,
  Image as ImageIcon,
  Trash2,
  AlertTriangle,
  X,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import {
  apiFetch,
  fetchEquiposPublicos,
  imagenCompleta,
  ESTADO_LABELS,
  ESTADO_COLORS,
  ESTADOS_EQUIPO,
  ROLES_EDITAN_EQUIPOS,
  ROLES_ELIMINAN_EQUIPOS,
} from '@/lib/api';
import { toast } from 'sonner';
import { useSession } from '@/hooks/useSession';
import { formatoPrecioMoneda, tipoBadgeClass, tipoLabel } from '@/lib/equipo';

interface Equipo {
  id: string;
  codigoInterno: string;
  nombre: string;
  marca?: string;
  modelo?: string;
  estado: string;
  ubicacion: string;
  familiaId?: string;
  familia?: { id: string; nombre: string } | null;
  subfamilia?: { id: string; nombre: string } | null;
  tipo: string;
  precio?: number | string | null;
  unidad?: string | null;
  imagenUrl: string;
  anio?: number | null;
  padreId?: string | null;
  varianteNombre?: string | null;
  descripcion?: string;
}

interface Familia {
  id: string;
  nombre: string;
}

const norm = (s: any) => (s || '').toString().normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
export default function AdminEquiposPage() {
  const [equipos, setEquipos] = useState<Equipo[]>([]);
  const [familias, setFamilias] = useState<Familia[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [estadoFiltro, setEstadoFiltro] = useState('TODOS');
  const [tipoFiltro, setTipoFiltro] = useState('TODOS');
  const [familiaFiltro, setFamiliaFiltro] = useState('TODAS');
  const [jerarquiaFiltro, setJerarquiaFiltro] = useState('TODOS');
  const [paginaActual, setPaginaActual] = useState(1);
  const [pageSize, setPageSize] = useState(40);
  const [confirmarBaja, setConfirmarBaja] = useState<Equipo | null>(null);
  const [eliminando, setEliminando] = useState(false);
  const user = useSession();
  const puedeEditar = Boolean(
    user && ROLES_EDITAN_EQUIPOS.includes(user.rol),
  );
  const puedeEliminar = Boolean(
    user && ROLES_ELIMINAN_EQUIPOS.includes(user.rol),
  );

  const ejecutarBaja = async () => {
    if (!confirmarBaja || eliminando) return;
    setEliminando(true);
    try {
      await apiFetch(`/equipos/${confirmarBaja.id}`, { method: 'DELETE' });
      setEquipos((prev) => prev.filter((e) => e.id !== confirmarBaja.id));
      setConfirmarBaja(null);
      toast.error('Equipo dado de baja / eliminado');
    } catch (err) {
      toast.error(
        err instanceof Error
          ? `No se pudo eliminar: ${err.message}`
          : 'No se pudo eliminar el equipo',
      );
    } finally {
      setEliminando(false);
    }
  };

  useEffect(() => {
    // Petición directa en paralelo para máxima velocidad
    Promise.all([
      apiFetch<Equipo[]>('/equipos/admin/listar').catch(() => []),
      apiFetch<Familia[]>('/familias').catch(() => []),
    ]).then(async ([eqs, fams]) => {
      let finalEquipos = Array.isArray(eqs) ? eqs : [];
      if (finalEquipos.length === 0) {
        const publicList = await fetchEquiposPublicos<any>().catch(() => []);
        finalEquipos = publicList.map((e) => ({
          ...e,
          ubicacion: e.ubicacion || 'Piura',
          subfamilia: null,
        }));
      }
      setEquipos(finalEquipos);
      setFamilias(fams);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    setPaginaActual(1);
  }, [searchTerm, estadoFiltro, familiaFiltro, jerarquiaFiltro, tipoFiltro]);

  const limpiarFiltros = () => {
    setSearchTerm('');
    setEstadoFiltro('TODOS');
    setTipoFiltro('TODOS');
    setFamiliaFiltro('TODAS');
    setJerarquiaFiltro('TODOS');
    setPaginaActual(1);
  };

  const filtrados = equipos.filter((eq) => {
    const term = norm(searchTerm.trim());
    let matchBusqueda = true;

    if (term) {
      const words = term.split(/\s+/);
      const targetTextRaw = [
          eq.codigoInterno,
          eq.nombre,
          eq.marca,
          eq.modelo,
          (eq as any).proveedor,
          (eq as any).categoria,
          eq.familia?.nombre,
          eq.subfamilia?.nombre,
].filter(Boolean).join(' ');
        const targetText = norm(targetTextRaw);

      matchBusqueda = words.every((w: string) => targetText.includes(w));
    }

    const matchEstado = estadoFiltro === 'TODOS' || eq.estado === estadoFiltro;
    const matchTipo = tipoFiltro === 'TODOS' || eq.tipo === tipoFiltro;
    const matchFamilia = familiaFiltro === 'TODAS' || eq.familiaId === familiaFiltro;
    const matchJerarquia =
      jerarquiaFiltro === 'TODOS' ||
      (jerarquiaFiltro === 'PRINCIPAL' && !eq.padreId) ||
      (jerarquiaFiltro === 'VARIANTE' && Boolean(eq.padreId));

    return matchBusqueda && matchEstado && matchFamilia && matchJerarquia && matchTipo;
  });

  const totalPaginas = Math.max(1, Math.ceil(filtrados.length / pageSize));
  const indiceInicio = (paginaActual - 1) * pageSize;
  const paginados = filtrados.slice(indiceInicio, indiceInicio + pageSize);

  const irAPagina = (p: number) => {
    setPaginaActual(Math.max(1, Math.min(p, totalPaginas)));
  };

  return (
    <div className="space-y-6">
      {/* ENCABEZADO */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-spartan font-[800] text-xl text-slate-900 uppercase tracking-tight">
            Maestro General de Equipos
          </h1>
          <p className="text-xs text-slate-500 mt-0.5 font-[500]">
            Base de datos oficial de los activos de HT RENT · {equipos.length} equipos registrados
          </p>
        </div>
        {puedeEditar && (
          <Link
            href="/admin/equipos/nuevo"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-[#E63C46] hover:bg-[#C92A36] text-white text-[11px] font-[800] rounded-[12px] shadow-md shadow-[#E63C46]/20 transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Nuevo Equipo</span>
          </Link>
        )}
      </div>

      {/* SEPARADOR DE SECCIÓN (LÍNEA PUNTEADA) */}
      <div className="relative py-0.5">
        <div className="absolute inset-0 flex items-center" aria-hidden="true">
          <div className="w-full border-b border-dotted border-slate-300" />
        </div>
        <div className="relative flex justify-start">
          <span className="bg-[#F1F5F9] pr-3 text-[9px] font-[800] uppercase tracking-widest text-slate-400">
            Filtros &amp; Búsqueda
          </span>
        </div>
      </div>

      {/* FILTROS */}
      <div className="bg-white rounded-[16px] border border-slate-200/70 p-3.5 shadow-sm space-y-2.5">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-2.5">
          <div className="relative xl:col-span-2">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por nombre, código HTR-MEG, marca o modelo..."
              className="w-full pl-10 pr-3.5 py-2 bg-slate-50 border border-slate-200 rounded-[10px] text-[11px] font-[600] text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#162B4D] focus:bg-white transition-all"
            />
          </div>

          <select
            value={jerarquiaFiltro}
            onChange={(e) => setJerarquiaFiltro(e.target.value)}
            className="px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-[10px] text-[11px] font-[700] text-[#162B4D] focus:outline-none focus:border-[#162B4D] cursor-pointer"
          >
            <option value="TODOS">Registro: Todos los equipos</option>
            <option value="PRINCIPAL">Solo Producto Principal (Familia)</option>
            <option value="VARIANTE">Solo Variantes (Modelos / Hijos)</option>
          </select>

          <select
            value={tipoFiltro}
            onChange={(e) => setTipoFiltro(e.target.value)}
            className="px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-[10px] text-[11px] font-[600] text-slate-700 focus:outline-none focus:border-[#162B4D] cursor-pointer"
          >
            <option value="TODOS">Tipo: Todos</option>
            <option value="ALQUILER">Solo Alquiler / Rentas</option>
            <option value="VENTA">Solo Venta</option>
            <option value="PROYECTO">Proyecto</option>
          </select>

          <select
            value={estadoFiltro}
            onChange={(e) => setEstadoFiltro(e.target.value)}
            className="px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-[10px] text-[11px] font-[600] text-slate-700 focus:outline-none focus:border-[#162B4D] cursor-pointer"
          >
            <option value="TODOS">Estado: Todos</option>
            {ESTADOS_EQUIPO.map((estado) => (
              <option key={estado} value={estado}>
                Estado: {ESTADO_LABELS[estado]}
              </option>
            ))}
          </select>

          <select
            value={familiaFiltro}
            onChange={(e) => setFamiliaFiltro(e.target.value)}
            className="px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-[10px] text-[11px] font-[600] text-slate-700 focus:outline-none focus:border-[#162B4D] cursor-pointer"
          >
            <option value="TODAS">Categoría: Todas</option>
            {familias.map((fam) => (
              <option key={fam.id} value={fam.id}>
                {fam.nombre}
              </option>
            ))}
          </select>
        </div>

        {(searchTerm || estadoFiltro !== 'TODOS' || familiaFiltro !== 'TODAS' || jerarquiaFiltro !== 'TODOS' || tipoFiltro !== 'TODOS') && (
          <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[11px] font-[600]">
            <span className="text-slate-500 font-[500]">
              Filtros activos: <strong className="text-slate-800">{filtrados.length}</strong> resultados encontrados
            </span>
            <button
              onClick={limpiarFiltros}
              className="inline-flex items-center gap-1 text-[#E63C46] hover:text-[#C92A36] hover:underline font-[700] transition-colors"
            >
              <X className="w-3.5 h-3.5" />
              <span>Limpiar filtros</span>
            </button>
          </div>
        )}
      </div>

      {/* LISTADO */}
      {loading ? (
        <div className="py-20 bg-white rounded-[16px] border border-slate-200/70 text-center space-y-3">
          <div className="w-8 h-8 border-3 border-[#162B4D] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-slate-600 font-[700] text-[11px]">Cargando equipos del Maestro General...</p>
        </div>
      ) : filtrados.length === 0 ? (
        <div className="py-14 bg-white rounded-[16px] border border-slate-200 text-center p-6">
          <Filter className="w-10 h-10 text-slate-300 mx-auto mb-2.5" />
          <h3 className="text-base font-[800] text-slate-800">No se encontraron equipos</h3>
          <p className="text-slate-500 text-[11px] mt-1 font-[500]">
            Ajuste los filtros o registre un nuevo equipo en el Maestro General.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-[16px] border border-slate-200/70 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[11px]">
              <thead>
                <tr className="bg-slate-50 text-slate-500 uppercase font-[700] border-b border-slate-200 text-[10px] tracking-wider">
                  <th className="py-3 px-4">Código</th>
                  <th className="py-3 px-3.5">Equipo</th>
                  <th className="py-3 px-3.5">Categoría</th>
                  <th className="py-3 px-3.5">Precio / Modalidad</th>
                  <th className="py-3 px-3.5">Estado</th>
                  <th className="py-3 px-3.5">Sede</th>
                  <th className="py-3 px-3.5 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginados.map((eq) => (
                  <tr key={eq.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#162B4D]/5 border border-[#162B4D]/10 text-[10px] font-[800] text-[#162B4D]">
                        <Tag className="w-3 h-3" />
                        {eq.codigoInterno || 'Sin código'}
                      </span>
                    </td>
                    <td className="py-3 px-3.5">
                      <div className="flex items-center gap-2.5">
                        {eq.imagenUrl ? (
                          <img loading="lazy" decoding="async" src={imagenCompleta(eq.imagenUrl)}
                            alt={eq.nombre}
                            className="w-10 h-10 rounded-[8px] object-cover bg-slate-100 border border-slate-200 shrink-0"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-[8px] bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0">
                            <ImageIcon className="w-3.5 h-3.5 text-slate-300" />
                          </div>
                        )}
                        <div className="min-w-0 max-w-sm sm:max-w-md py-0.5">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <p className="font-[700] text-slate-900 leading-snug whitespace-normal break-words text-[11.5px]">
                              {eq.nombre}
                            </p>
                            {!eq.padreId ? (
                              <span className="px-1.5 py-0.5 rounded text-[8.5px] font-[800] bg-[#162B4D]/10 text-[#162B4D] border border-[#162B4D]/20 uppercase tracking-wide">
                                Producto Principal (Familia)
                              </span>
                            ) : (
                              <span className="px-1.5 py-0.5 rounded text-[8.5px] font-[800] bg-slate-100 text-slate-700 border border-slate-200 uppercase tracking-wide">
                                Variante: {eq.varianteNombre || 'Modelo'}
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-slate-400 font-[500] mt-0.5 whitespace-normal break-words">
                            {[eq.marca, eq.modelo, eq.anio].filter(Boolean).join(' · ') || 'Sin datos técnicos'}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-3.5">
                      <span className="inline-flex items-center gap-1 text-slate-600 font-[600] text-[11px]">
                        <FolderTree className="w-3 h-3 text-slate-400" />
                        {eq.familia?.nombre || '—'}
                      </span>
                    </td>
                    <td className="py-3 px-3.5">
                      <div className="font-[700] text-slate-900 text-[11px]">
                        {formatoPrecioMoneda(eq.precio, eq.unidad)}
                      </div>
                      <span
                        className={`inline-block text-[8.5px] font-[800] uppercase tracking-wider text-white px-1.5 py-0.5 rounded-full mt-0.5 ${tipoBadgeClass(
                          eq.tipo,
                        )}`}
                      >
                        {tipoLabel(eq.tipo)}
                      </span>
                    </td>
                    <td className="py-3 px-3.5">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-[800] border whitespace-nowrap ${
                          ESTADO_COLORS[eq.estado] || 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {ESTADO_LABELS[eq.estado] || eq.estado}
                      </span>
                    </td>
                    <td className="py-3 px-3.5">
                      <span className="inline-flex items-center gap-1 text-slate-600 font-[600] text-[11px]">
                        <MapPin className="w-3 h-3 text-[#E63C46]" />
                        {eq.ubicacion}
                      </span>
                    </td>
                    <td className="py-3 px-3.5">
                      <div className="flex items-center justify-center gap-1">
                        <Link
                          href={`/admin/equipos/${eq.id}`}
                          className="p-1.5 rounded-[7px] bg-slate-100 hover:bg-[#162B4D] hover:text-white text-slate-600 transition-all"
                          title="Ver ficha técnica (solo lectura)"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </Link>
                        {puedeEditar && (
                          <Link
                            href={`/admin/equipos/${eq.id}?editar=1`}
                            className="p-1.5 rounded-[7px] bg-slate-100 hover:bg-[#E63C46] hover:text-white text-slate-600 transition-all"
                            title="Editar equipo"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </Link>
                        )}
                        {puedeEliminar && (
                          <button
                            onClick={() => setConfirmarBaja(eq)}
                            className="p-1.5 rounded-[7px] bg-slate-100 hover:bg-red-600 hover:text-white text-slate-600 transition-all"
                            title="Eliminar (dar de baja)"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* BARRA DE PAGINACIÓN */}
          <div className="px-5 py-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-xs text-slate-500 font-[500]">
              Mostrando <span className="font-[700] text-slate-800">{filtrados.length === 0 ? 0 : indiceInicio + 1}</span> - <span className="font-[700] text-slate-800">{Math.min(indiceInicio + pageSize, filtrados.length)}</span> de <span className="font-[700] text-slate-800">{filtrados.length}</span> equipos
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 mr-2 text-xs text-slate-500 font-[500]">
                <span>Mostrar:</span>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setPaginaActual(1);
                  }}
                  className="bg-white border border-slate-200 rounded-[8px] px-2 py-1 text-xs font-[700] text-slate-700 focus:outline-none cursor-pointer"
                >
                  <option value={20}>20</option>
                  <option value={40}>40</option>
                  <option value={80}>80</option>
                  <option value={100}>100</option>
                </select>
              </div>

              <button
                onClick={() => irAPagina(paginaActual - 1)}
                disabled={paginaActual <= 1}
                className="p-2 rounded-[10px] bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                title="Página anterior"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-1">
                {Array.from({ length: totalPaginas }, (_, i) => i + 1)
                  .filter((p) => p === 1 || p === totalPaginas || Math.abs(p - paginaActual) <= 2)
                  .map((p, idx, arr) => {
                    const showEllipsis = idx > 0 && p - arr[idx - 1] > 1;
                    return (
                      <React.Fragment key={p}>
                        {showEllipsis && <span className="px-1 text-slate-400 font-[700]">...</span>}
                        <button
                          onClick={() => irAPagina(p)}
                          className={`w-8 h-8 rounded-[10px] text-xs font-[800] transition-all ${
                            paginaActual === p
                              ? 'bg-[#162B4D] text-white shadow-md'
                              : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          {p}
                        </button>
                      </React.Fragment>
                    );
                  })}
              </div>

              <button
                onClick={() => irAPagina(paginaActual + 1)}
                disabled={paginaActual >= totalPaginas}
                className="p-2 rounded-[10px] bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                title="Página siguiente"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE CONFIRMACIÓN DE BAJA */}
      {confirmarBaja && (
        <div
          className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-[2px]"
          onClick={() => !eliminando && setConfirmarBaja(null)}
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
                    ¿Dar de baja este equipo?
                  </h3>
                  <p className="text-xs text-slate-400 font-[600] mt-0.5">
                    Esta acción no se puede deshacer
                  </p>
                </div>
              </div>
              <button
                onClick={() => setConfirmarBaja(null)}
                disabled={eliminando}
                className="p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors disabled:opacity-40"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* CUERPO */}
            <div className="px-6 pb-6">
              <div className="bg-slate-50 border border-slate-200 rounded-[14px] p-4 mb-4">
                <p className="font-[700] text-sm text-slate-900 break-words">
                  {confirmarBaja.nombre}
                </p>
                <p className="text-[11px] text-slate-500 font-[600] mt-0.5">
                  {confirmarBaja.codigoInterno || 'Sin código'} ·{' '}
                  {confirmarBaja.marca || 'Sin marca'} {confirmarBaja.modelo || ''}
                </p>
              </div>
              <p className="text-xs text-slate-500 font-[500] leading-relaxed">
                El equipo pasará a estado <b>DADO DE BAJA</b> y dejará de
                aparecer en el catálogo público. Su historial, documentos y
                registros se conservan en el sistema.
              </p>

              {/* ACCIONES */}
              <div className="flex gap-2.5 mt-5">
                <button
                  onClick={() => setConfirmarBaja(null)}
                  disabled={eliminando}
                  className="flex-1 px-4 py-3 rounded-[12px] bg-slate-100 text-slate-600 text-xs font-[800] hover:bg-slate-200 disabled:opacity-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={ejecutarBaja}
                  disabled={eliminando}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 bg-[#E63C46] text-white rounded-[12px] text-xs font-[800] hover:bg-[#C92A36] disabled:opacity-60 transition-all"
                >
                  {eliminando ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                      Dando de baja...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" />
                      Sí, dar de baja
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
