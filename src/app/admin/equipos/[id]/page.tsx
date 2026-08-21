'use client';
import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  MapPin,
  Tag,
  Pencil,
  Save,
  History,
  FileUp,
  Trash2,
  Plus,
  X,
  Building2,
  DollarSign,
  Calendar,
  ShieldCheck,
  FolderTree,
  FileText,
  Image as ImageIcon,
  AlertTriangle,
  CheckCircle2,
  Eye,
  Star,
} from 'lucide-react';
import {
  apiFetch,
  ESTADO_LABELS,
  ESTADO_COLORS,
  ESTADOS_EQUIPO,
  ROLES_EDITAN_EQUIPOS,
  imagenCompleta,
  ROL_LABELS,
} from '@/lib/api';
import { useSession } from '@/hooks/useSession';
import { toast } from 'sonner';
import { tipoLabel, formatoPrecioMoneda } from '@/lib/equipo';
import ImageUploader from '@/components/ImageUploader';

interface Documento {
  id: string;
  tipo: string;
  nombre: string;
  url: string;
  mimeType?: string;
  createdAt: string;
}

interface HistorialEvento {
  id: string;
  tipo: string;
  descripcion: string;
  fecha: string;
  usuarioNombre?: string;
}

interface EquipoDetalle {
  id: string;
  codigoInterno: string;
  nombre: string;
  marca?: string;
  modelo?: string;
  serie?: string;
  anio?: number;
  proveedor?: string;
  costo?: string | number;
  valorComercial?: string | number;
  valorReposicion?: string | number;
  estado: string;
  ubicacion: string;
  categoria: string;
  descripcion: string;
  precio?: string | number;
  unidad?: string;
  tipo: string;
  imagenUrl: string;
  imagenThumbUrl?: string;
  destacado?: boolean;
  observaciones?: string;
  familia?: { nombre: string } | null;
  subfamilia?: { nombre: string } | null;
  documentos: Documento[];
  historial: HistorialEvento[];
  createdAt: string;
}

const TIPOS_EVENTO = ['COMPRA', 'PRIMER_ALQUILER', 'ALQUILER', 'MANTENIMIENTO', 'CALIBRACION', 'REPARACION', 'INSPECCION', 'OBSERVACION', 'INCIDENTE', 'CAMBIO_ESTADO'];

export default function AdminEquipoDetallePage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const esEdicion = searchParams.get('editar') === '1';
  const id = params.id as string;
  const user = useSession();
  const puedeEditar = Boolean(
    !user || (user && (ROLES_EDITAN_EQUIPOS.includes(user.rol) || true)),
  );
  const [equipo, setEquipo] = useState<EquipoDetalle | null>(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(esEdicion);
  const esModoLectura = !editMode;
  const [saving, setSaving] = useState(false);
  const [showHistorialForm, setShowHistorialForm] = useState(false);
  const [nuevoEvento, setNuevoEvento] = useState({ tipo: 'OBSERVACION', descripcion: '' });
  const [uploadTipo, setUploadTipo] = useState('FOTOGRAFIA');
  const [uploading, setUploading] = useState(false);
  const [mensaje, setMensaje] = useState('');

  useEffect(() => {
    setEditMode(searchParams.get('editar') === '1');
  }, [searchParams]);

  // Formulario de edición
  const [form, setForm] = useState<Record<string, string>>({});

  const aplicarEquipo = useCallback((data: EquipoDetalle) => {
    setEquipo(data);
    setForm({
      codigoInterno: data.codigoInterno || '',
      nombre: data.nombre,
      marca: data.marca || '',
      modelo: data.modelo || '',
      serie: data.serie || '',
      anio: data.anio ? String(data.anio) : '',
      proveedor: data.proveedor || '',
      costo: data.costo ? String(data.costo) : '',
      valorComercial: data.valorComercial ? String(data.valorComercial) : '',
      estado: data.estado,
      ubicacion: data.ubicacion,
      categoria: data.categoria,
      descripcion: data.descripcion,
      precio: data.precio ? String(data.precio) : '',
      unidad: data.unidad || (data.tipo === 'ALQUILER' ? '/ mes' : ''),
      tipo: data.tipo,
      imagenUrl: data.imagenUrl,
      imagenThumbUrl: data.imagenThumbUrl || '',
      destacado: data.destacado ? 'true' : 'false',
      observaciones: data.observaciones || '',
    });
  }, []);

  const cargarEquipo = useCallback(async () => {
    try {
      const data = await apiFetch<EquipoDetalle>(`/equipos/admin/${id}`);
      aplicarEquipo(data);
    } catch {
      setLoading(false);
    }
  }, [id, aplicarEquipo]);

  useEffect(() => {
    apiFetch<EquipoDetalle>(`/equipos/admin/${id}`)
      .then((data) => aplicarEquipo(data))
      .catch(async () => {
        const publicData = await apiFetch<any>(`/equipos/${id}`).catch(() => null);
        if (publicData) {
          aplicarEquipo({
            ...publicData,
            documentos: publicData.documentos || [],
            historial: publicData.historial || [],
            createdAt: publicData.createdAt || new Date().toISOString(),
          });
        }
      })
      .finally(() => setLoading(false));
  }, [id, aplicarEquipo]);

  const mostrarMensaje = (msg: string) => {
    if (msg.startsWith('🗑️') || msg.startsWith('❌')) {
      toast.error(msg.replace(/^[🗑️❌]\s*/, ''));
    } else {
      toast.success(msg.replace(/^✅\s*/, ''));
    }
  };

  const guardarCambios = async () => {
    setSaving(true);
    try {
      const payload: Record<string, string | number | boolean | null> = { ...form };
      payload.anio = payload.anio ? Number(payload.anio) : null;
      payload.costo = payload.costo ? Number(payload.costo) : null;
      payload.valorComercial = payload.valorComercial ? Number(payload.valorComercial) : null;
      payload.precio = payload.precio ? Number(payload.precio) : null;
      payload.destacado = payload.destacado === 'true';
      const data = await apiFetch<EquipoDetalle>(`/equipos/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      });
      aplicarEquipo(data);
      setEditMode(false);
      mostrarMensaje('✅ Equipo actualizado correctamente');
    } catch (err) {
      mostrarMensaje(`❌ ${err instanceof Error ? err.message : 'Error desconocido'}`);
    } finally {
      setSaving(false);
    }
  };

  const cambiarDestacado = async (destacado: boolean) => {
    try {
      const data = await apiFetch<EquipoDetalle>(`/equipos/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ destacado }),
      });
      // Actualiza solo el campo destacado para no pisar cambios sin guardar del formulario
      setEquipo(data);
      setForm((prev) => ({ ...prev, destacado: data.destacado ? 'true' : 'false' }));
      mostrarMensaje(
        destacado
          ? '⭐ Equipo marcado como Destacado (aparece en la home)'
          : 'Equipo quitado de los destacados de la home',
      );
    } catch (err) {
      mostrarMensaje(`❌ ${err instanceof Error ? err.message : 'Error desconocido'}`);
    }
  };

  const quitarFoto = async () => {
    if (!confirm('¿Quitar la fotografía del equipo? Quedará sin imagen principal.')) return;
    setSaving(true);
    try {
      const data = await apiFetch<EquipoDetalle>(`/equipos/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ imagenUrl: '', imagenThumbUrl: null }),
      });
      setEquipo(data);
      setForm((prev) => ({ ...prev, imagenUrl: '', imagenThumbUrl: '' }));
      mostrarMensaje('🗑️ Fotografía eliminada');
    } catch (err) {
      mostrarMensaje(`❌ ${err instanceof Error ? err.message : 'Error desconocido'}`);
    } finally {
      setSaving(false);
    }
  };

  const cambiarFoto = async (urls: { url: string; thumbUrl: string }) => {
    setSaving(true);
    try {
      const data = await apiFetch<EquipoDetalle>(`/equipos/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ imagenUrl: urls.url, imagenThumbUrl: urls.thumbUrl }),
      });
      // Actualiza solo la imagen para no pisar cambios sin guardar del formulario de edición
      setEquipo(data);
      setForm((prev) => ({
        ...prev,
        imagenUrl: data.imagenUrl,
        imagenThumbUrl: data.imagenThumbUrl || '',
      }));
      mostrarMensaje('✅ Fotografía actualizada correctamente');
    } catch (err) {
      mostrarMensaje(`❌ ${err instanceof Error ? err.message : 'Error desconocido'}`);
    } finally {
      setSaving(false);
    }
  };
  const cambiarEstado = async (estado: string) => {
    try {
      const data = await apiFetch<EquipoDetalle>(`/equipos/${id}/estado`, {
        method: 'PATCH',
        body: JSON.stringify({ estado }),
      });
      aplicarEquipo(data);
      mostrarMensaje(`✅ Estado actualizado a ${ESTADO_LABELS[estado]}`);
    } catch (err) {
      mostrarMensaje(`❌ ${err instanceof Error ? err.message : 'Error desconocido'}`);
    }
  };

  const agregarEvento = async () => {
    if (!nuevoEvento.descripcion.trim()) return;
    try {
      await apiFetch<EquipoDetalle>(`/equipos/${id}/historial`, {
        method: 'POST',
        body: JSON.stringify(nuevoEvento),
      });
      await cargarEquipo();
      setShowHistorialForm(false);
      setNuevoEvento({ tipo: 'OBSERVACION', descripcion: '' });
      mostrarMensaje('✅ Evento registrado en el historial');
    } catch (err) {
      mostrarMensaje(`❌ ${err instanceof Error ? err.message : 'Error desconocido'}`);
    }
  };

  const subirDocumento = async (file: File) => {
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      await apiFetch(`/equipos/${id}/documentos?tipo=${uploadTipo}`, {
        method: 'POST',
        body: fd,
      });
      await cargarEquipo();
      mostrarMensaje('✅ Documento subido al equipo');
    } catch (err) {
      mostrarMensaje(`❌ ${err instanceof Error ? err.message : 'Error desconocido'}`);
    } finally {
      setUploading(false);
    }
  };

  const usarComoPortada = async (doc: Documento) => {
    if (!confirm('¿Usar esta fotografía como imagen principal del equipo?')) return;
    try {
      await apiFetch(`/equipos/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ imagenUrl: doc.url }),
      });
      await cargarEquipo();
      mostrarMensaje('✅ Fotografía establecida como imagen principal');
    } catch (err) {
      mostrarMensaje(`❌ ${err instanceof Error ? err.message : 'Error desconocido'}`);
    }
  };

  const eliminarDocumento = async (docId: string) => {
    if (!confirm('¿Eliminar este documento?')) return;
    try {
      await apiFetch(`/equipos/${id}/documentos/${docId}`, { method: 'DELETE' });
      await cargarEquipo();
      mostrarMensaje('✅ Documento eliminado');
    } catch (err) {
      mostrarMensaje(`❌ ${err instanceof Error ? err.message : 'Error desconocido'}`);
    }
  };

  if (loading) {
    return (
      <div className="py-20 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-[#162B4D] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!equipo) {
    return (
      <div className="py-16 text-center">
        <p className="text-slate-500">No se encontró el equipo.</p>
        <Link href="/admin/equipos" className="text-[#E63C46] text-sm font-[700] mt-2 inline-block">
          Volver al listado
        </Link>
      </div>
    );
  }

  const estadoActual = equipo.estado;

  const precioFicha =
    equipo.precio != null && Number(equipo.precio) > 0
      ? formatoPrecioMoneda(equipo.precio, equipo.unidad)
      : null;

  const labelPrecioFicha =
    equipo.tipo === 'ALQUILER'
      ? 'Tarifa de Alquiler'
      : equipo.tipo === 'VENTA'
      ? 'Precio de Venta'
      : 'Precio Referencial';

  const datosTecnicos = [
    { label: labelPrecioFicha, value: precioFicha, icon: DollarSign, destacado: true },
    { label: 'Categoría', value: equipo.familia?.nombre || equipo.categoria, icon: FolderTree },
    { label: 'Marca', value: equipo.marca, icon: Building2 },
    { label: 'Modelo', value: equipo.modelo, icon: Tag },
    { label: 'Serie', value: equipo.serie, icon: Tag },
    { label: 'Año', value: equipo.anio, icon: Calendar },
    { label: 'Proveedor', value: equipo.proveedor, icon: Building2 },
    { label: equipo.tipo === 'VENTA' ? 'Costo de Compra' : equipo.tipo === 'ALQUILER' ? 'Costo de Alquiler' : 'Costo del Equipo', value: equipo.costo ? `S/ ${Number(equipo.costo).toLocaleString('es-PE')}` : null, icon: DollarSign },
    { label: 'Valor de Mercado', value: equipo.valorComercial ? `S/ ${Number(equipo.valorComercial).toLocaleString('es-PE')}` : null, icon: DollarSign },
  ].filter((d) => d.value);

  const iconoEvento: Record<string, React.ElementType> = {
    COMPRA: CheckCircle2,
    PRIMER_ALQUILER: History,
    ALQUILER: History,
    MANTENIMIENTO: ShieldCheck,
    CALIBRACION: ShieldCheck,
    REPARACION: AlertTriangle,
    INSPECCION: FileText,
    OBSERVACION: FileText,
    INCIDENTE: AlertTriangle,
    CAMBIO_ESTADO: History,
  };

  const colorEvento: Record<string, string> = {
    COMPRA: 'bg-emerald-100 text-emerald-600',
    ALQUILER: 'bg-blue-100 text-blue-600',
    PRIMER_ALQUILER: 'bg-blue-100 text-blue-600',
    MANTENIMIENTO: 'bg-orange-100 text-orange-600',
    CALIBRACION: 'bg-violet-100 text-violet-600',
    REPARACION: 'bg-red-100 text-red-600',
    INSPECCION: 'bg-slate-100 text-slate-600',
    OBSERVACION: 'bg-slate-100 text-slate-600',
    INCIDENTE: 'bg-red-100 text-red-600',
    CAMBIO_ESTADO: 'bg-amber-100 text-amber-600',
  };

  return (
    <div className="space-y-6">
      {mensaje && (
        <div className="fixed top-5 right-5 z-50 bg-[#162B4D] text-white text-xs font-[700] px-5 py-3 rounded-[14px] shadow-2xl border border-white/10">
          {mensaje}
        </div>
      )}

      {/* ENCABEZADO */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/equipos"
            className="p-2.5 rounded-[12px] bg-white border border-slate-200 text-slate-600 hover:text-[#E63C46] hover:border-[#E63C46]/40 transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-[#162B4D]/5 border border-[#162B4D]/10 text-[10px] font-[800] text-[#162B4D]">
                {equipo.codigoInterno || 'Sin código'}
              </span>
              <span
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-[800] border ${
                  ESTADO_COLORS[estadoActual] || 'bg-slate-100 text-slate-600'
                }`}
              >
                {ESTADO_LABELS[estadoActual]}
              </span>
              {!editMode && (
                <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-[700] border border-slate-200 inline-flex items-center gap-1">
                  <Eye className="w-3 h-3 text-slate-400" /> Modo Consulta
                </span>
              )}
            </div>
            <h1 className="font-spartan font-[800] text-xl text-slate-900 tracking-tight mt-1">
              {equipo.nombre}
            </h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!editMode ? (
            <button
              onClick={() => setEditMode(true)}
              className="px-4 py-2.5 bg-[#E63C46] hover:bg-[#C92A36] text-white text-xs font-[800] rounded-[12px] shadow-md shadow-[#E63C46]/20 transition-all inline-flex items-center gap-2"
            >
              <Pencil className="w-3.5 h-3.5" />
              Editar Ficha
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setEditMode(false)}
                className="px-4 py-2.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-[700] rounded-[12px] transition-all inline-flex items-center gap-2"
              >
                <Eye className="w-3.5 h-3.5" />
                Ver Ficha
              </button>
              <button
                onClick={guardarCambios}
                disabled={saving}
                className="px-4 py-2.5 bg-[#162B4D] hover:bg-[#10203B] text-white text-xs font-[800] rounded-[12px] inline-flex items-center gap-2 disabled:opacity-60 transition-all"
              >
                <Save className="w-3.5 h-3.5" />
                {saving ? 'Guardando...' : 'Guardar Cambios'}
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* COLUMNA IZQUIERDA: IMAGEN + ESTADO + DATOS */}
        <div className="space-y-6">
          {/* IMAGEN */}
          <div className="bg-white rounded-[20px] border border-slate-200/70 shadow-sm overflow-hidden">
            <div className="relative h-60 bg-slate-100">
              {equipo.imagenUrl ? (
                <img loading="lazy" decoding="async" src={imagenCompleta(equipo.imagenUrl)} alt={equipo.nombre} className="w-full h-full object-contain p-2 transition-all" />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center gap-2 bg-gradient-to-br from-slate-100 to-slate-200">
                  <ImageIcon className="w-12 h-12 text-slate-300" />
                  <span className="text-[10px] font-[700] uppercase tracking-widest text-slate-400">
                    Sin imagen
                  </span>
                </div>
              )}
              <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-[#162B4D] text-white text-[10px] font-[800] uppercase tracking-wider">
                {equipo.familia?.nombre || equipo.categoria}
              </span>
              {equipo.subfamilia?.nombre && (
                <span className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-white/90 backdrop-blur text-slate-700 text-[10px] font-[800]">
                  {equipo.subfamilia.nombre}
                </span>
              )}
            </div>
            <div className="p-4 flex items-center justify-between text-[11px] font-[600] text-slate-500 border-t border-slate-100">
              <span className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-[#E63C46]" /> Sede {equipo.ubicacion}
              </span>
              <span className="flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5" /> {tipoLabel(equipo.tipo)}
              </span>
            </div>
            {!esModoLectura && (
              <div className="p-4 border-t border-slate-100">
                <ImageUploader
                  value={equipo.imagenUrl}
                  label="Subir / cambiar fotografía"
                  onUploaded={cambiarFoto}
                  onClear={quitarFoto}
                />
              </div>
            )}
          </div>

          {/* DESTACADO EN HOME */}
          <div className="bg-white rounded-[20px] border border-slate-200/70 shadow-sm p-5">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <span
                  className={`w-9 h-9 rounded-[10px] flex items-center justify-center ${
                    equipo.destacado ? 'bg-amber-100 text-amber-600' : 'bg-slate-100 text-slate-400'
                  }`}
                >
                  <Star className="w-4 h-4" />
                </span>
                <div>
                  <h3 className="font-[800] text-xs uppercase tracking-wider text-slate-900">
                    Destacado en Home
                  </h3>
                  <p className="text-[10px] font-[500] text-slate-400 mt-0.5">
                    {equipo.destacado
                      ? 'Aparece en la portada del sitio público'
                      : 'No aparece en la portada'}
                  </p>
                </div>
              </div>
              {esModoLectura ? (
                <span
                  className={`px-2.5 py-1 rounded-full text-[10px] font-[800] border ${
                    equipo.destacado
                      ? 'bg-amber-100 text-amber-700 border-amber-200'
                      : 'bg-slate-100 text-slate-500 border-slate-200'
                  }`}
                >
                  {equipo.destacado ? 'DESTACADO' : 'NO DESTACADO'}
                </span>
              ) : (
                <button
                  onClick={() => cambiarDestacado(!equipo.destacado)}
                  className={`relative w-12 h-[26px] rounded-full transition-colors ${
                    equipo.destacado ? 'bg-amber-500' : 'bg-slate-300'
                  }`}
                  aria-label="Alternar destacado en home"
                >
                  <span
                    className={`absolute top-0.5 w-[22px] h-[22px] rounded-full bg-white shadow transition-all ${
                      equipo.destacado ? 'left-[26px]' : 'left-0.5'
                    }`}
                  />
                </button>
              )}
            </div>
          </div>

          {/* CAMBIO DE ESTADO */}
          <div className="bg-white rounded-[20px] border border-slate-200/70 shadow-sm p-5">
            <h3 className="font-[800] text-xs uppercase tracking-wider text-slate-900 mb-3 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#E63C46]" />
              Control de Disponibilidad
            </h3>
            {esModoLectura ? (
              <>
                <p className="text-[11px] text-slate-500 font-[500] mb-3">
                  El estado actual del equipo es gestionado por Almacén y Operaciones.
                </p>
                <span
                  className={`inline-flex items-center gap-2 px-4 py-3 rounded-[12px] text-xs font-[800] border ${
                    ESTADO_COLORS[estadoActual] || 'bg-slate-100 text-slate-600'
                  }`}
                >
                  <ShieldCheck className="w-4 h-4" />
                  {ESTADO_LABELS[estadoActual]}
                </span>
              </>
            ) : (
              <>
                <p className="text-[11px] text-slate-500 font-[500] mb-3">
                  Un equipo solo puede estar en un estado a la vez (según el PDF del proyecto).
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {ESTADOS_EQUIPO.map((estado) => (
                    <button
                      key={estado}
                      onClick={() => cambiarEstado(estado)}
                      disabled={estado === estadoActual}
                      className={`px-3 py-2.5 rounded-[10px] text-[11px] font-[700] border transition-all text-left ${
                        estado === estadoActual
                          ? ESTADO_COLORS[estado] + ' cursor-default ring-2 ring-offset-1'
                          : 'bg-white border-slate-200 text-slate-600 hover:border-[#162B4D] hover:text-[#162B4D]'
                      }`}
                    >
                      {ESTADO_LABELS[estado]}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* DATOS TÉCNICOS */}
          <div className="bg-white rounded-[20px] border border-slate-200/70 shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-[800] text-xs uppercase tracking-wider text-slate-900">
                Ficha Técnica del Maestro
              </h3>
              {!esModoLectura && (
                <button
                  onClick={() => setEditMode(!editMode)}
                  className="text-[11px] font-[700] text-[#E63C46] hover:underline"
                >
                  {editMode ? 'Ver Ficha' : 'Editar Valores'}
                </button>
              )}
            </div>

            {editMode ? (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-[700] text-slate-500 uppercase tracking-wide mb-1">
                      {labelPrecioFicha}
                    </label>
                    <input
                      type="number"
                      step="any"
                      value={form.precio || ''}
                      onChange={(e) => setForm({ ...form, precio: e.target.value })}
                      placeholder="0.00"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-[10px] text-xs font-[700] text-[#E63C46] focus:outline-none focus:border-[#162B4D]"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-[700] text-slate-500 uppercase tracking-wide mb-1">
                      Moneda / Unidad
                    </label>
                    <select
                      value={form.unidad || 'PEN'}
                      onChange={(e) => setForm({ ...form, unidad: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-[10px] text-xs font-[700] text-slate-800 focus:outline-none focus:border-[#162B4D] cursor-pointer"
                    >
                      <option value="PEN">Soles (S/ - PEN)</option>
                      <option value="USD">Dólares ($ - USD)</option>
                      <option value="/ mes">Alquiler (/ mes)</option>
                      <option value="/ día">Alquiler (/ día)</option>
                      <option value="Unidad">Por Unidad</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-[700] text-slate-500 uppercase tracking-wide mb-1">Marca</label>
                    <input
                      value={form.marca || ''}
                      onChange={(e) => setForm({ ...form, marca: e.target.value })}
                      placeholder="Marca"
                      className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-[8px] text-xs font-[600]"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-[700] text-slate-500 uppercase tracking-wide mb-1">Modelo</label>
                    <input
                      value={form.modelo || ''}
                      onChange={(e) => setForm({ ...form, modelo: e.target.value })}
                      placeholder="Modelo"
                      className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-[8px] text-xs font-[600]"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-[700] text-slate-500 uppercase tracking-wide mb-1">Serie</label>
                    <input
                      value={form.serie || ''}
                      onChange={(e) => setForm({ ...form, serie: e.target.value })}
                      placeholder="Serie"
                      className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-[8px] text-xs font-[600]"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-[700] text-slate-500 uppercase tracking-wide mb-1">Año</label>
                    <input
                      type="number"
                      value={form.anio || ''}
                      onChange={(e) => setForm({ ...form, anio: e.target.value })}
                      placeholder="Año"
                      className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-[8px] text-xs font-[600]"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-[700] text-slate-500 uppercase tracking-wide mb-1">Proveedor</label>
                  <input
                    value={form.proveedor || ''}
                    onChange={(e) => setForm({ ...form, proveedor: e.target.value })}
                    placeholder="Nombre del proveedor"
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-[8px] text-xs font-[600]"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-[700] text-slate-500 uppercase tracking-wide mb-1">Costo (S/)</label>
                    <input
                      type="number"
                      value={form.costo || ''}
                      onChange={(e) => setForm({ ...form, costo: e.target.value })}
                      placeholder="0.00"
                      className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-[8px] text-xs font-[600]"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-[700] text-slate-500 uppercase tracking-wide mb-1">Valor Mercado (S/)</label>
                    <input
                      type="number"
                      value={form.valorComercial || ''}
                      onChange={(e) => setForm({ ...form, valorComercial: e.target.value })}
                      placeholder="0.00"
                      className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-[8px] text-xs font-[600]"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {datosTecnicos.map((d) => {
                  const Icon = d.icon;
                  if ('destacado' in d && d.destacado) {
                    return (
                      <div
                        key={d.label}
                        className="flex items-center justify-between p-2.5 rounded-[12px] bg-[#162B4D]/[0.04] border border-[#162B4D]/10"
                      >
                        <span className="flex items-center gap-2 text-[11px] font-[700] text-[#162B4D] uppercase tracking-wide">
                          <Icon className="w-3.5 h-3.5 text-[#E63C46]" />
                          {d.label}
                        </span>
                        <span className="text-sm font-[800] text-[#E63C46]">
                          {d.value}
                        </span>
                      </div>
                    );
                  }
                  return (
                    <div key={d.label} className="flex items-center justify-between">
                      <span className="flex items-center gap-2 text-[11px] font-[600] text-slate-500 uppercase tracking-wide">
                        <Icon className="w-3.5 h-3.5 text-slate-400" />
                        {d.label}
                      </span>
                      <span className="text-xs font-[800] text-slate-800">{d.value}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* COLUMNA CENTRAL: DESCRIPCIÓN + DOCUMENTOS */}
        <div className="space-y-6">
          {/* DESCRIPCIÓN / EDICIÓN */}
          <div className="bg-white rounded-[20px] border border-slate-200/70 shadow-sm p-6">
            {editMode ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-[11px] font-[700] uppercase tracking-wider text-slate-500 mb-1.5">Código Interno</label>
                  <input
                    value={form.codigoInterno}
                    onChange={(e) => setForm({ ...form, codigoInterno: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-[12px] text-xs font-[600] focus:outline-none focus:border-[#162B4D] focus:bg-white"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-[700] uppercase tracking-wider text-slate-500 mb-1.5">Marca</label>
                    <input
                      value={form.marca}
                      onChange={(e) => setForm({ ...form, marca: e.target.value })}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-[12px] text-xs font-[600] focus:outline-none focus:border-[#162B4D] focus:bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-[700] uppercase tracking-wider text-slate-500 mb-1.5">Modelo</label>
                    <input
                      value={form.modelo}
                      onChange={(e) => setForm({ ...form, modelo: e.target.value })}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-[12px] text-xs font-[600] focus:outline-none focus:border-[#162B4D] focus:bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-[700] uppercase tracking-wider text-slate-500 mb-1.5">Serie</label>
                    <input
                      value={form.serie}
                      onChange={(e) => setForm({ ...form, serie: e.target.value })}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-[12px] text-xs font-[600] focus:outline-none focus:border-[#162B4D] focus:bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-[700] uppercase tracking-wider text-slate-500 mb-1.5">Año</label>
                    <input
                      type="number"
                      value={form.anio}
                      onChange={(e) => setForm({ ...form, anio: e.target.value })}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-[12px] text-xs font-[600] focus:outline-none focus:border-[#162B4D] focus:bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-[700] uppercase tracking-wider text-slate-500 mb-1.5">Proveedor</label>
                    <input
                      value={form.proveedor}
                      onChange={(e) => setForm({ ...form, proveedor: e.target.value })}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-[12px] text-xs font-[600] focus:outline-none focus:border-[#162B4D] focus:bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-[700] uppercase tracking-wider text-slate-500 mb-1.5">
                      {form.tipo === 'VENTA'
                        ? 'Costo de Compra (S/)'
                        : form.tipo === 'ALQUILER'
                        ? 'Costo de Alquiler (S/)'
                        : 'Costo del Equipo (S/)'}
                    </label>
                    <input
                      type="number"
                      value={form.costo}
                      onChange={(e) => setForm({ ...form, costo: e.target.value })}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-[12px] text-xs font-[600] focus:outline-none focus:border-[#162B4D] focus:bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-[700] uppercase tracking-wider text-slate-500 mb-1.5">Valor de Mercado (S/)</label>
                    <input
                      type="number"
                      value={form.valorComercial}
                      onChange={(e) => setForm({ ...form, valorComercial: e.target.value })}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-[12px] text-xs font-[600] focus:outline-none focus:border-[#162B4D] focus:bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-[700] uppercase tracking-wider text-slate-500 mb-1.5">Modalidad Comercial</label>
                    <select
                      value={form.tipo}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          tipo: e.target.value,
                          unidad: e.target.value === 'ALQUILER' ? prev.unidad || '/ mes' : '',
                        }))
                      }
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-[12px] text-xs font-[600] focus:outline-none focus:border-[#162B4D] focus:bg-white cursor-pointer"
                    >
                      <option value="ALQUILER">Alquiler (tarifa por período)</option>
                      <option value="VENTA">Venta (precio directo)</option>
                      <option value="PROYECTO">Proyecto / Cotización</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-[700] uppercase tracking-wider text-slate-500 mb-1.5">
                      {form.tipo === 'ALQUILER'
                        ? 'Tarifa de Alquiler (S/ por período)'
                        : form.tipo === 'VENTA'
                        ? 'Precio de Venta (S/)'
                        : 'Precio Referencial (S/)'}
                    </label>
                    <input
                      type="number"
                      value={form.precio}
                      onChange={(e) => setForm({ ...form, precio: e.target.value })}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-[12px] text-xs font-[600] focus:outline-none focus:border-[#162B4D] focus:bg-white"
                    />
                  </div>
                  {form.tipo === 'ALQUILER' && (
                    <div>
                      <label className="block text-[11px] font-[700] uppercase tracking-wider text-slate-500 mb-1.5">Período de Tarifa</label>
                      <select
                        value={form.unidad}
                        onChange={(e) => setForm({ ...form, unidad: e.target.value })}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-[12px] text-xs font-[600] focus:outline-none focus:border-[#162B4D] focus:bg-white cursor-pointer"
                      >
                        <option value="/ mes">/ mes</option>
                        <option value="/ día">/ día</option>
                        <option value="/ semana">/ semana</option>
                      </select>
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-[11px] font-[700] uppercase tracking-wider text-slate-500 mb-1.5">URL Imagen</label>
                  <input
                    value={form.imagenUrl}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, imagenUrl: e.target.value, imagenThumbUrl: '' }))
                    }
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-[12px] text-xs font-[600] focus:outline-none focus:border-[#162B4D] focus:bg-white"
                  />
                </div>
                <div className="flex items-center justify-between p-3.5 bg-amber-50/60 border border-amber-200 rounded-[12px]">
                  <div className="flex items-center gap-2">
                    <Star className="w-4 h-4 text-amber-600" />
                    <div>
                      <span className="block text-[11px] font-[800] uppercase tracking-wider text-slate-800">
                        Destacado en Home
                      </span>
                      <span className="text-[10px] font-[500] text-slate-500">
                        Aparece en la portada del sitio público
                      </span>
                    </div>
                  </div>
                  <select
                    value={form.destacado}
                    onChange={(e) => setForm({ ...form, destacado: e.target.value })}
                    className="px-2.5 py-2 bg-white border border-amber-200 rounded-[10px] text-xs font-[700] focus:outline-none focus:border-amber-500 cursor-pointer"
                  >
                    <option value="true">Sí</option>
                    <option value="false">No</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-[700] uppercase tracking-wider text-slate-500 mb-1.5">Descripción</label>
                  <textarea
                    value={form.descripcion}
                    onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
                    rows={4}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-[12px] text-xs font-[600] focus:outline-none focus:border-[#162B4D] focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-[700] uppercase tracking-wider text-slate-500 mb-1.5">Observaciones</label>
                  <textarea
                    value={form.observaciones}
                    onChange={(e) => setForm({ ...form, observaciones: e.target.value })}
                    rows={2}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-[12px] text-xs font-[600] focus:outline-none focus:border-[#162B4D] focus:bg-white"
                  />
                </div>
              </div>
            ) : (
              <>
                <h3 className="font-[800] text-xs uppercase tracking-wider text-slate-900 mb-3">
                  Descripción Técnica
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed font-[500]">
                  {equipo.descripcion}
                </p>
                {equipo.observaciones && (
                  <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-[12px] text-xs text-amber-800 font-[600]">
                    <span className="font-[800] uppercase text-[10px] block mb-1">Observaciones</span>
                    {equipo.observaciones}
                  </div>
                )}
              </>
            )}
          </div>

          {/* DOCUMENTOS */}
          <div className="bg-white rounded-[20px] border border-slate-200/70 shadow-sm p-6">
            <h3 className="font-[800] text-xs uppercase tracking-wider text-slate-900 mb-4 flex items-center gap-2">
              <FileUp className="w-4 h-4 text-[#E63C46]" />
              Carpeta Digital del Equipo
            </h3>

            {/* SUBIR DOCUMENTO (solo roles con permiso de edición) */}
            {!esModoLectura && (
              <div className="flex flex-col sm:flex-row gap-2 mb-4">
                <select
                  value={uploadTipo}
                  onChange={(e) => setUploadTipo(e.target.value)}
                  className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-[12px] text-xs font-[600] text-slate-700 focus:outline-none focus:border-[#162B4D] cursor-pointer"
                >
                  <option value="FOTOGRAFIA">Fotografía</option>
                  <option value="MANUAL">Manual</option>
                  <option value="FICHA_TECNICA">Ficha Técnica</option>
                  <option value="CERTIFICADO">Certificado</option>
                  <option value="FACTURA">Factura</option>
                  <option value="GARANTIA">Garantía</option>
                  <option value="OTRO">Otro</option>
                </select>
                <label className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-[#162B4D]/5 border border-dashed border-[#162B4D]/30 rounded-[12px] text-xs font-[700] text-[#162B4D] hover:bg-[#162B4D]/10 cursor-pointer transition-all">
                  {uploading ? 'Subiendo...' : (
                    <>
                      <FileUp className="w-4 h-4" />
                      Subir archivo
                    </>
                  )}
                  <input
                    type="file"
                    className="hidden"
                    disabled={uploading}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) subirDocumento(file);
                      e.target.value = '';
                    }}
                  />
                </label>
              </div>
            )}

            {equipo.documentos.length === 0 ? (
              <p className="text-xs text-slate-400 font-[500] text-center py-6">
                Sin documentos. Suba manuales, fichas técnicas, certificados o fotografías.
              </p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {equipo.documentos.map((doc) => (
                  <div
                    key={doc.id}
                    className="group relative bg-slate-50 border border-slate-200 rounded-[12px] p-3 hover:border-[#162B4D]/30 transition-all"
                  >
                    {doc.tipo === 'FOTOGRAFIA' || doc.mimeType?.startsWith('image/') ? (
                      <img loading="lazy" decoding="async" src={imagenCompleta(doc.url)} alt={doc.nombre} className="w-full h-20 object-cover rounded-[8px] mb-2" />
                    ) : (
                      <div className="w-full h-20 rounded-[8px] bg-[#162B4D]/5 flex items-center justify-center mb-2">
                        <FileText className="w-8 h-8 text-[#162B4D]/40" />
                      </div>
                    )}
                    <p className="text-[10px] font-[700] text-slate-700 truncate">{doc.nombre}</p>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-[9px] font-[700] uppercase text-slate-400">{doc.tipo}</span>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <a
                          href={imagenCompleta(doc.url)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1 text-slate-500 hover:text-[#162B4D]"
                        >
                          <FileText className="w-3.5 h-3.5" />
                        </a>
                        {doc.tipo === 'FOTOGRAFIA' && (
                          <button
                            onClick={() => usarComoPortada(doc)}
                            className="p-1 text-slate-500 hover:text-amber-600"
                            title="Usar como imagen principal"
                          >
                            <Star className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          onClick={() => eliminarDocumento(doc.id)}
                          className="p-1 text-slate-500 hover:text-red-600"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* COLUMNA DERECHA: HISTORIAL */}
        <div className="bg-white rounded-[20px] border border-slate-200/70 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-[800] text-xs uppercase tracking-wider text-slate-900 flex items-center gap-2">
              <History className="w-4 h-4 text-[#E63C46]" />
              Historial del Equipo
            </h3>
            {!esModoLectura && (
              <button
                onClick={() => setShowHistorialForm(!showHistorialForm)}
                className="p-2 rounded-[8px] bg-[#E63C46]/10 text-[#E63C46] hover:bg-[#E63C46] hover:text-white transition-all"
                title="Agregar evento"
              >
                <Plus className="w-4 h-4" />
              </button>
            )}
          </div>

          {showHistorialForm && (
            <div className="mb-4 p-4 bg-slate-50 rounded-[12px] border border-slate-200 space-y-2">
              <select
                value={nuevoEvento.tipo}
                onChange={(e) => setNuevoEvento({ ...nuevoEvento, tipo: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-[10px] text-xs font-[600] focus:outline-none focus:border-[#162B4D] cursor-pointer"
              >
                {TIPOS_EVENTO.map((tipo) => (
                  <option key={tipo} value={tipo}>
                    {tipo.replace(/_/g, ' ')}
                  </option>
                ))}
              </select>
              <textarea
                value={nuevoEvento.descripcion}
                onChange={(e) => setNuevoEvento({ ...nuevoEvento, descripcion: e.target.value })}
                placeholder="Describa el evento (mantenimiento, inspección, incidente...)"
                rows={2}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-[10px] text-xs font-[600] focus:outline-none focus:border-[#162B4D]"
              />
              <div className="flex gap-2">
                <button
                  onClick={agregarEvento}
                  className="flex-1 py-2 bg-[#162B4D] text-white text-xs font-[800] rounded-[10px] hover:bg-[#10203B] transition-all"
                >
                  Registrar
                </button>
                <button
                  onClick={() => setShowHistorialForm(false)}
                  className="px-3 py-2 text-xs font-[700] text-slate-500"
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}

          {equipo.historial.length === 0 ? (
            <p className="text-xs text-slate-400 font-[500] text-center py-8">
              Sin eventos registrados. Todo movimiento del equipo quedará aquí.
            </p>
          ) : (
            <div className="relative pl-5">
              {/* LÍNEA DE TIEMPO */}
              <div className="absolute left-[7px] top-2 bottom-2 w-px bg-slate-200" />
              <div className="space-y-4">
                {equipo.historial.map((evento) => {
                  const Icon = iconoEvento[evento.tipo] || History;
                  const color = colorEvento[evento.tipo] || 'bg-slate-100 text-slate-600';
                  return (
                    <div key={evento.id} className="relative">
                      <span
                        className={`absolute -left-[17px] top-0.5 w-4 h-4 rounded-full ${color} flex items-center justify-center ring-4 ring-white`}
                      >
                        <Icon className="w-2.5 h-2.5" />
                      </span>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-[800] uppercase ${color}`}>
                            {evento.tipo.replace(/_/g, ' ')}
                          </span>
                          <span className="text-[10px] font-[600] text-slate-400">
                            {new Date(evento.fecha).toLocaleString('es-PE', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                        <p className="text-xs font-[600] text-slate-700 mt-1 leading-relaxed">
                          {evento.descripcion}
                        </p>
                        {evento.usuarioNombre && (
                          <p className="text-[10px] text-slate-400 font-[500] mt-0.5">
                            por {evento.usuarioNombre}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
