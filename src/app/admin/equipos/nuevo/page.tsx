'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Save,
  Package,
  Building2,
  Tag,
  DollarSign,
  MapPin,
  Image as ImageIcon,
  AlertCircle,
  RefreshCcw,
  ShoppingCart,
  ClipboardList,
  Star,
  Plus,
  Trash2,
} from 'lucide-react';
import { apiFetch, ESTADO_LABELS, ESTADOS_EQUIPO } from '@/lib/api';
import { toast } from 'sonner';
import ImageUploader from '@/components/ImageUploader';

const MODALIDADES = [
  {
    tipo: 'ALQUILER',
    titulo: 'Alquiler',
    desc: 'Tarifa por período (mes, día o semana)',
    icon: RefreshCcw,
  },
  {
    tipo: 'VENTA',
    titulo: 'Venta',
    desc: 'Precio de venta directa del equipo',
    icon: ShoppingCart,
  },
  {
    tipo: 'PROYECTO',
    titulo: 'Proyecto',
    desc: 'Cotización llave en mano según alcance',
    icon: ClipboardList,
  },
];

interface Familia {
  id: string;
  nombre: string;
  subfamilias: { id: string; nombre: string }[];
}

export default function NuevoEquipoPage() {
  const router = useRouter();
  const [familias, setFamilias] = useState<Familia[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [familiaId, setFamiliaId] = useState('');
  const [form, setForm] = useState({
    nombre: '',
    marca: '',
    modelo: '',
    serie: '',
    anio: '',
    proveedor: '',
    costo: '',
    valorComercial: '',
    estado: 'DISPONIBLE',
    ubicacion: 'Piura',
    descripcion: '',
    precio: '',
    unidad: '/ mes', // Por defecto el alquiler se cotiza por mes
    tipo: 'ALQUILER',
    imagenUrl: '',
    imagenThumbUrl: '',
    destacado: false,
    observaciones: '',
  });

  useEffect(() => {
    apiFetch<Familia[]>('/familias')
      .then((data) => {
        setFamilias(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const familiaSeleccionada = familias.find((f) => f.id === familiaId);
  const [subfamiliaId, setSubfamiliaId] = useState('');
  // Fotos adicionales opcionales: se suben a la carpeta digital al registrar el equipo
  const [fotosAdicionales, setFotosAdicionales] = useState<File[]>([]);
  const [subiendoFotos, setSubiendoFotos] = useState(false);

  const agregarFotos = (files: FileList | null) => {
    if (!files) return;
    const nuevas = Array.from(files).filter((f) => f.type.startsWith('image/'));
    if (nuevas.length) setFotosAdicionales((prev) => [...prev, ...nuevas]);
  };

  const quitarFoto = (index: number) => {
    setFotosAdicionales((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);

    try {
      const payload: Record<string, string | number | boolean | null> = {
        ...form,
        familiaId: familiaId || null,
        subfamiliaId: subfamiliaId || null,
        // La categoría pública toma el nombre de la categoría (familia) seleccionada
        categoria: familiaSeleccionada?.nombre || '',
        anio: form.anio ? Number(form.anio) : null,
        costo: form.costo ? Number(form.costo) : null,
        valorComercial: form.valorComercial ? Number(form.valorComercial) : null,
        precio: form.precio ? Number(form.precio) : null,
        unidad: form.unidad || (form.tipo === 'ALQUILER' ? '/ mes' : 'PEN'),
        imagenThumbUrl: form.imagenThumbUrl || null,
        destacado: form.destacado,
      };

      const data = await apiFetch<{ id: string }>('/equipos', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      // Subir las fotos adicionales (opcional) a la carpeta digital del equipo recién creado
      if (fotosAdicionales.length > 0) {
        setSubiendoFotos(true);
        for (const foto of fotosAdicionales) {
          const fd = new FormData();
          fd.append('file', foto);
          await apiFetch(`/equipos/${data.id}/documentos?tipo=FOTOGRAFIA`, {
            method: 'POST',
            body: fd,
          }).catch(() => undefined); // no bloquea el registro si una foto falla
        }
      }

      toast.success('Equipo registrado correctamente');
      router.push(`/admin/equipos/${data.id}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al registrar el equipo';
      setError(msg);
      toast.error(msg);
      setSaving(false);
    }
  };

  const inputCls =
    'w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-[12px] text-xs font-[600] text-slate-800 focus:outline-none focus:border-[#162B4D] focus:bg-white transition-all placeholder:text-slate-400';

  const labelCls = 'block text-[11px] font-[700] uppercase tracking-wider text-slate-500 mb-1.5';

  if (loading) {
    return (
      <div className="py-20 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-[#162B4D] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* ENCABEZADO */}
      <div className="flex items-center gap-3">
        <Link
          href="/admin/equipos"
          className="p-2.5 rounded-[12px] bg-white border border-slate-200 text-slate-600 hover:text-[#E63C46] hover:border-[#E63C46]/40 transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="font-spartan font-[800] text-2xl text-slate-900 uppercase tracking-tight">
            Registrar Nuevo Equipo
          </h1>
          <p className="text-sm text-slate-500 mt-1 font-[500]">
            El sistema asignará automáticamente el código HTR-MEG siguiente.
          </p>
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 text-xs font-[500] p-4 rounded-[14px]">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* IDENTIFICACIÓN */}
        <section className="bg-white rounded-[20px] border border-slate-200/70 shadow-sm p-6">
          <h2 className="font-[800] text-xs uppercase tracking-wider text-slate-900 mb-4 flex items-center gap-2">
            <Package className="w-4 h-4 text-[#E63C46]" />
            Identificación del Equipo
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className={labelCls}>Nombre del Equipo *</label>
              <input
                required
                value={form.nombre}
                onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                placeholder="Ej: Megómetro Digital Fluke 1507"
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Categoría *</label>
              <select
                value={familiaId}
                onChange={(e) => {
                  setFamiliaId(e.target.value);
                  setSubfamiliaId('');
                }}
                className={inputCls + ' cursor-pointer'}
              >
                <option value="">Seleccionar categoría...</option>
                {familias.map((fam) => (
                  <option key={fam.id} value={fam.id}>
                    {fam.nombre}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls}>Subcategoría</label>
              <select
                value={subfamiliaId}
                onChange={(e) => setSubfamiliaId(e.target.value)}
                disabled={!familiaSeleccionada}
                className={inputCls + ' cursor-pointer disabled:opacity-50'}
              >
                <option value="">Seleccionar subcategoría...</option>
                {familiaSeleccionada?.subfamilias.map((sub) => (
                  <option key={sub.id} value={sub.id}>
                    {sub.nombre}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls}>Marca</label>
              <input
                value={form.marca}
                onChange={(e) => setForm({ ...form, marca: e.target.value })}
                placeholder="Ej: Fluke"
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Modelo</label>
              <input
                value={form.modelo}
                onChange={(e) => setForm({ ...form, modelo: e.target.value })}
                placeholder="Ej: 1507"
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Serie</label>
              <input
                value={form.serie}
                onChange={(e) => setForm({ ...form, serie: e.target.value })}
                placeholder="N° de serie del equipo"
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Año</label>
              <input
                type="number"
                value={form.anio}
                onChange={(e) => setForm({ ...form, anio: e.target.value })}
                placeholder="2024"
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Proveedor</label>
              <input
                value={form.proveedor}
                onChange={(e) => setForm({ ...form, proveedor: e.target.value })}
                placeholder="Proveedor o distribuidor"
                className={inputCls}
              />
            </div>

          </div>
        </section>

        {/* VALORES Y ESTADO */}
        <section className="bg-white rounded-[20px] border border-slate-200/70 shadow-sm p-6">
          <h2 className="font-[800] text-xs uppercase tracking-wider text-slate-900 mb-4 flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-[#E63C46]" />
            Valores, Estado y Ubicación
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className={labelCls}>
                {form.tipo === 'VENTA'
                  ? 'Costo de Compra (S/)'
                  : form.tipo === 'ALQUILER'
                  ? 'Costo de Alquiler (S/)'
                  : 'Costo del Equipo (S/)'}
              </label>
              <input
                type="number"
                step="0.01"
                value={form.costo}
                onChange={(e) => setForm({ ...form, costo: e.target.value })}
                placeholder="0.00"
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Valor de Mercado (S/)</label>
              <input
                type="number"
                step="0.01"
                value={form.valorComercial}
                onChange={(e) => setForm({ ...form, valorComercial: e.target.value })}
                placeholder="0.00"
                className={inputCls}
              />
            </div>
            {/* MODALIDAD COMERCIAL (VENTA vs ALQUILER) */}
            <div className="md:col-span-3">
              <label className={labelCls}>Modalidad Comercial *</label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {MODALIDADES.map((m) => {
                  const activa = form.tipo === m.tipo;
                  const Icon = m.icon;
                  return (
                    <button
                      type="button"
                      key={m.tipo}
                      onClick={() =>
                        setForm((prev) => ({
                          ...prev,
                          tipo: m.tipo,
                          // Al alquilar se cobra por período; en venta/proyecto es un monto único
                          unidad: m.tipo === 'ALQUILER' ? prev.unidad || '/ mes' : '',
                        }))
                      }
                      className={`p-4 rounded-[14px] border-2 text-left transition-all ${
                        activa
                          ? m.tipo === 'ALQUILER'
                            ? 'border-[#233A61] bg-[#233A61]/5 shadow-md'
                            : m.tipo === 'VENTA'
                            ? 'border-[#E63C46] bg-[#E63C46]/5 shadow-md'
                            : 'border-amber-600 bg-amber-50 shadow-md'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1.5">
                        <Icon
                          className={`w-4 h-4 ${
                            activa
                              ? m.tipo === 'VENTA'
                                ? 'text-[#E63C46]'
                                : m.tipo === 'PROYECTO'
                                ? 'text-amber-600'
                                : 'text-[#233A61]'
                              : 'text-slate-400'
                          }`}
                        />
                        <span
                          className={`text-xs font-[800] uppercase tracking-wider ${
                            activa ? 'text-slate-900' : 'text-slate-600'
                          }`}
                        >
                          {m.titulo}
                        </span>
                      </div>
                      <p className="text-[10px] font-[500] text-slate-500 leading-snug">{m.desc}</p>
                    </button>
                  );
                })}
              </div>
              <p className="text-[10px] text-slate-400 font-[500] mt-2">
                {form.tipo === 'ALQUILER'
                  ? 'El cliente verá este equipo en la sección RENTA, con el precio como tarifa por período.'
                  : form.tipo === 'VENTA'
                  ? 'El cliente verá este equipo en la sección VENTA, con el precio de venta directa.'
                  : 'El cliente verá este equipo como proyecto a cotizar, sin precio fijo.'}
              </p>
            </div>

            <div className="flex items-end">
              <button
                type="button"
                onClick={() => setForm((prev) => ({ ...prev, destacado: !prev.destacado }))}
                className={`w-full flex items-center justify-between gap-3 px-4 py-3 rounded-[14px] border-2 transition-all ${
                  form.destacado
                    ? 'border-amber-400 bg-amber-50'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <span className="flex items-center gap-2">
                  <Star
                    className={`w-4 h-4 ${form.destacado ? 'text-amber-500' : 'text-slate-400'}`}
                  />
                  <span className="text-left">
                    <span
                      className={`block text-xs font-[800] uppercase tracking-wider ${
                        form.destacado ? 'text-amber-700' : 'text-slate-600'
                      }`}
                    >
                      Destacado en Home
                    </span>
                    <span className="text-[10px] font-[500] text-slate-400">
                      {form.destacado
                        ? 'Aparecerá en la portada del sitio'
                        : 'Solo en el catálogo general'}
                    </span>
                  </span>
                </span>
                <span
                  className={`relative w-10 rounded-full transition-colors ${
                    form.destacado ? 'bg-amber-500' : 'bg-slate-300'
                  }`}
                  style={{ height: 22 }}
                >
                  <span
                    className={`absolute top-0.5 w-[18px] h-[18px] rounded-full bg-white shadow transition-all ${
                      form.destacado ? 'left-[20px]' : 'left-0.5'
                    }`}
                  />
                </span>
              </button>
            </div>
            <div>
              <label className={labelCls}>Estado Inicial</label>
              <select
                value={form.estado}
                onChange={(e) => setForm({ ...form, estado: e.target.value })}
                className={inputCls + ' cursor-pointer'}
              >
                {ESTADOS_EQUIPO.map((estado) => (
                  <option key={estado} value={estado}>
                    {ESTADO_LABELS[estado]}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls}>Sede / Ubicación</label>
              <select
                value={form.ubicacion}
                onChange={(e) => setForm({ ...form, ubicacion: e.target.value })}
                className={inputCls + ' cursor-pointer'}
              >
                <option value="Piura">Sede Piura</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>
                {form.tipo === 'ALQUILER'
                  ? 'Tarifa de Alquiler'
                  : form.tipo === 'VENTA'
                  ? 'Precio de Venta'
                  : 'Precio Referencial'}
              </label>
              <input
                type="number"
                step="any"
                value={form.precio}
                onChange={(e) => setForm({ ...form, precio: e.target.value })}
                placeholder={form.tipo === 'PROYECTO' ? 'Opcional — bajo cotización' : '0.00'}
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Moneda / Período</label>
              <select
                value={form.unidad}
                onChange={(e) => setForm({ ...form, unidad: e.target.value })}
                className={inputCls + ' cursor-pointer'}
              >
                {form.tipo === 'ALQUILER' ? (
                  <>
                    <option value="/ mes">Soles — / mes</option>
                    <option value="/ día">Soles — / día</option>
                    <option value="/ semana">Soles — / semana</option>
                    <option value="USD / mes">Dólares — USD / mes</option>
                  </>
                ) : (
                  <>
                    <option value="PEN">Soles (S/ - PEN)</option>
                    <option value="USD">Dólares ($ - USD)</option>
                    <option value="Unidad">Por Unidad</option>
                  </>
                )}
              </select>
            </div>
          </div>
        </section>

        {/* IMAGEN Y DESCRIPCIÓN */}
        <section className="bg-white rounded-[20px] border border-slate-200/70 shadow-sm p-6">
          <h2 className="font-[800] text-xs uppercase tracking-wider text-slate-900 mb-4 flex items-center gap-2">
            <ImageIcon className="w-4 h-4 text-[#E63C46]" />
            Imagen y Descripción
          </h2>
          <div className="space-y-4">
            <div>
              <label className={labelCls}>Fotografía del Equipo</label>
              <ImageUploader
                value={form.imagenUrl}
                label="Subir fotografía"
                onUploaded={(urls) =>
                  setForm((prev) => ({
                    ...prev,
                    imagenUrl: urls.url,
                    imagenThumbUrl: urls.thumbUrl,
                  }))
                }
                onClear={() =>
                  setForm((prev) => ({ ...prev, imagenUrl: '', imagenThumbUrl: '' }))
                }
              />
            </div>

            {/* FOTOS ADICIONALES (OPCIONAL) */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className={labelCls + ' mb-0'}>Más Fotografías (opcional)</label>
                <label className="inline-flex items-center gap-1.5 px-3 py-2 bg-[#162B4D]/5 border border-dashed border-[#162B4D]/30 rounded-[10px] text-[10px] font-[800] text-[#162B4D] hover:bg-[#162B4D]/10 cursor-pointer transition-all uppercase tracking-wider">
                  <Plus className="w-3.5 h-3.5" />
                  Agregar fotos
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={(e) => {
                      agregarFotos(e.target.files);
                      e.target.value = '';
                    }}
                  />
                </label>
              </div>
              {fotosAdicionales.length === 0 ? (
                <p className="text-[10px] text-slate-400 font-[500]">
                  Puedes agregar varias fotos del equipo (vistas, accesorios, placa). Se guardan en
                  la carpeta digital y se muestran en la galería del sitio.
                </p>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
                  {fotosAdicionales.map((foto, i) => (
                    <div
                      key={i}
                      className="group relative aspect-square rounded-[12px] overflow-hidden border border-slate-200 bg-slate-50 p-1 flex items-center justify-center"
                    >
                      <img
                        src={URL.createObjectURL(foto)}
                        alt={`Foto adicional ${i + 1}`}
                        className="max-w-full max-h-full w-auto h-auto object-contain"
                      />
                      <button
                        type="button"
                        onClick={() => quitarFoto(i)}
                        className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/60 hover:bg-red-600 text-white flex items-center justify-center transition-colors"
                        title="Quitar foto"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div>
              <label className={labelCls}>Descripción Técnica *</label>
              <textarea
                required
                rows={4}
                value={form.descripcion}
                onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
                placeholder="Descripción completa del equipo, especificaciones técnicas y estado..."
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Observaciones</label>
              <textarea
                rows={2}
                value={form.observaciones}
                onChange={(e) => setForm({ ...form, observaciones: e.target.value })}
                placeholder="Notas internas del área de sistemas"
                className={inputCls}
              />
            </div>
          </div>
        </section>

        {/* ACCIONES */}
        <div className="flex items-center justify-end gap-3">
          <Link
            href="/admin/equipos"
            className="px-5 py-3 bg-white border border-slate-200 text-slate-700 text-xs font-[700] rounded-[12px] hover:border-slate-400 transition-all"
          >
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-3 bg-[#E63C46] hover:bg-[#C92A36] text-white text-xs font-[800] rounded-[12px] shadow-lg shadow-[#E63C46]/25 inline-flex items-center gap-2 disabled:opacity-60 transition-all"
          >
            <Save className="w-4 h-4" />
            {saving
              ? subiendoFotos
                ? 'Subiendo fotos...'
                : 'Registrando...'
              : 'Registrar en el Maestro'}
          </button>
        </div>
      </form>
    </div>
  );
}
