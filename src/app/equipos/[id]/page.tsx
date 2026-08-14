'use client';
import React, { useEffect, useState } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import WhatsappWidget from '@/components/WhatsappWidget';
import {
  MapPin,
  ShoppingCart,
  CheckCircle2,
  Truck,
  ShieldCheck,
  ArrowLeft,
  RefreshCcw,
  BadgeCheck,
  FileText,
  ChevronRight,
  ChevronDown,
  Layers,
  Eye,
  Clock,
  BadgeDollarSign,
} from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { agregarAlCarrito } from '@/lib/cart';
import { imagenCompleta, API_URL } from '@/lib/api';
import {
  tipoLabel,
  tipoBadgeClass,
  notaPrecio,
  ctaLabel,
  precioEtiqueta,
  precioEtiquetaCorta,
  formatoPrecioMoneda,
} from '@/lib/equipo';

interface EquipoDetalle {
  id: string;
  codigoInterno?: string | null;
  nombre: string;
  categoria: string;
  descripcion: string;
  precio: number | string | null;
  unidad?: string | null;
  ubicacion: string;
  tipo: 'ALQUILER' | 'VENTA' | 'PROYECTO';
  imagenUrl: string;
  disponible: boolean;
  marca?: string | null;
  modelo?: string | null;
  serie?: string | null;
  anio?: number | null;
  proveedor?: string | null;
  familia?: { nombre: string } | null;
  subfamilia?: { nombre: string } | null;
  padreId?: string | null;
  varianteNombre?: string | null;
  variantes?: EquipoDetalle[];
  documentos?: { id: string; tipo: string; url: string; mimeType?: string }[];
}

function galeriaDe(equipo: EquipoDetalle, equipoPadre?: EquipoDetalle | null): string[] {
  const fotos = (equipo.documentos || [])
    .filter(
      (d) =>
        d.tipo === 'FOTOGRAFIA' ||
        (d.mimeType && d.mimeType.startsWith('image/')),
    )
    .map((d) => d.url);

  const urlPrincipal = equipo.imagenUrl || equipoPadre?.imagenUrl || '';

  return [urlPrincipal, ...fotos].filter(
    (url, i, arr) => url && arr.indexOf(url) === i,
  );
}

export default function EquipoDetallePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [equipo, setEquipo] = useState<EquipoDetalle | null>(null);
  const [varianteSeleccionada, setVarianteSeleccionada] = useState<EquipoDetalle | null>(null);
  const [relacionados, setRelacionados] = useState<EquipoDetalle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [imagenActiva, setImagenActiva] = useState(0);
  const [descripcionAbierta, setDescripcionAbierta] = useState(false);
  const [especificacionesAbiertas, setEspecificacionesAbiertas] = useState(false);

  useEffect(() => {
    const cargar = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API_URL}/equipos/${params.id}`);
        if (res.ok) {
          const data: EquipoDetalle = await res.json();
          setEquipo(data);
          if (data.variantes && data.variantes.length > 0) {
            setVarianteSeleccionada(data.variantes[0]);
          } else {
            setVarianteSeleccionada(data);
          }

          // Cargar productos relacionados (misma categoría o modalidad)
          try {
            const relRes = await fetch(`${API_URL}/equipos?pageSize=50`);
            if (relRes.ok) {
              const relData = await relRes.json();
              const lista: EquipoDetalle[] = Array.isArray(relData)
                ? relData
                : (relData.items ?? []);
              const filtrados = lista
                .filter((item) => item.id !== data.id && (item.categoria === data.categoria || item.tipo === data.tipo))
                .slice(0, 4);
              setRelacionados(filtrados);
            }
          } catch {
            // Silencioso si falla la sugerencia
          }
        } else {
          setError('No se pudo cargar el equipo solicitado.');
        }
      } catch (err) {
        setError('El catálogo no está disponible en este momento.');
      } finally {
        setLoading(false);
      }
    };
    if (params.id) cargar();
  }, [params.id]);

  const agregar = (itemAgregar: EquipoDetalle = equipo!) => {
    if (!itemAgregar) return;
    agregarAlCarrito({
      id: itemAgregar.id,
      nombre: itemAgregar.nombre,
      descripcion: itemAgregar.descripcion,
      ubicacion: itemAgregar.ubicacion,
      precio: itemAgregar.precio,
      tipo: itemAgregar.tipo,
      unidad: itemAgregar.unidad || undefined,
      imagenUrl: itemAgregar.imagenUrl,
    });
    window.dispatchEvent(
      new CustomEvent('cart-updated', {
        detail: {
          addedItem: { nombre: itemAgregar.nombre, imagenUrl: itemAgregar.imagenUrl },
          openDrawer: true,
        },
      })
    );
  };

  const precioTexto = (p: number | string | null) =>
    p === null || p === undefined
      ? 'Bajo Cotización'
      : `S/ ${Number(p).toLocaleString('es-PE')}`;

  const tipoTexto =
    equipo?.tipo === 'ALQUILER'
      ? 'Alquiler'
      : equipo?.tipo === 'VENTA'
      ? 'Venta Directa'
      : 'Proyecto / Cotización';

  const equipoActivo = varianteSeleccionada || equipo;
  const imagenes = equipoActivo ? galeriaDe(equipoActivo, equipo) : [];

  // Características primordiales
  const primordiales = equipoActivo
    ? [
        { etiqueta: 'Marca', valor: equipoActivo.marca || equipo?.marca || 'HT RENT' },
        { etiqueta: 'Modelo', valor: equipoActivo.modelo || 'Estándar Industrial' },
        { etiqueta: 'Categoría', valor: equipoActivo.categoria || equipo?.categoria },
        { etiqueta: 'Modalidad', valor: tipoTexto },
      ]
    : [];

  // Especificaciones completas para desplegable
  const especificacionesCompletas = equipoActivo
    ? [
        { etiqueta: 'Código interno', valor: equipoActivo.codigoInterno || '—' },
        { etiqueta: 'Marca', valor: equipoActivo.marca || equipo?.marca || 'HT RENT' },
        { etiqueta: 'Modelo', valor: equipoActivo.modelo || '—' },
        { etiqueta: 'Variante / Tipo', valor: equipoActivo.varianteNombre || '—' },
        { etiqueta: 'Serie', valor: equipoActivo.serie || '—' },
        { etiqueta: 'Año de Fabricación', valor: equipoActivo.anio ? String(equipoActivo.anio) : '—' },
        { etiqueta: 'Proveedor', valor: equipoActivo.proveedor || 'HT RENT S.A.C.' },
        { etiqueta: 'Categoría Principal', valor: equipoActivo.categoria || equipo?.categoria },
        { etiqueta: 'Familia', valor: equipo?.familia?.nombre || '—' },
        { etiqueta: 'Subcategoría', valor: equipo?.subfamilia?.nombre || '—' },
        { etiqueta: 'Sede de Ubicación', valor: equipoActivo.ubicacion || equipo?.ubicacion },
        { etiqueta: 'Modalidad Comercial', valor: tipoTexto },
        {
          etiqueta: 'Disponibilidad Operativa',
          valor: equipoActivo.disponible ? 'Disponible Inmediato' : 'Bajo Pedido / Reserva',
        },
      ]
    : [];

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f8fafc] font-poppins">
        <Header />
        <div className="py-32 text-center space-y-4">
          <div className="w-10 h-10 border-4 border-[#162B4D] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-slate-500 font-[600] text-sm">Cargando detalles del equipo...</p>
        </div>
        <Footer />
        <WhatsappWidget />
      </main>
    );
  }

  if (error || !equipo) {
    return (
      <main className="min-h-screen bg-[#f8fafc] font-poppins">
        <Header />
        <div className="py-32 max-w-md mx-auto text-center px-6 space-y-4">
          <p className="text-slate-700 font-[700] text-lg">{error || 'Equipo no encontrado'}</p>
          <Link
            href="/equipos"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#162B4D] text-white text-xs font-[700] rounded-xl hover:bg-[#233A61] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Volver al catálogo
          </Link>
        </div>
        <Footer />
        <WhatsappWidget />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f8fafc] font-poppins text-slate-900">
      <Header />

      {/* BREADCRUMB COMPACTO */}
      <section className="bg-gradient-to-r from-[#162B4D] via-[#1E3A66] to-[#162B4D] pt-[90px] pb-4 text-white relative overflow-hidden shadow-inner">
        <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-12 relative z-10">
          <div className="flex items-center gap-2 text-xs sm:text-sm font-[600] text-slate-300">
            <Link href="/" className="hover:text-white transition-colors">Inicio</Link>
            <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
            <Link href="/equipos" className="hover:text-white transition-colors">Catálogo</Link>
            <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
            <span className="text-white font-[700] truncate max-w-[320px] sm:max-w-none">{equipo.nombre}</span>
          </div>
        </div>
      </section>

      {/* CUERPO PRINCIPAL */}
      <section className="py-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          {/* ===== COLUMNA IZQUIERDA: GALERÍA DE IMÁGENES + ACORDEONES ===== */}
          <div className="space-y-6">
            <div className="bg-white rounded-[20px] border border-slate-200/80 p-4 sm:p-5">
              <div className="relative h-72 sm:h-96 bg-slate-50 rounded-[14px] overflow-hidden border border-slate-100">
                <img
                  src={imagenCompleta(imagenes[imagenActiva])}
                  alt={equipo.nombre}
                  className="w-full h-full object-contain mix-blend-multiply"
                />
                <span
                  className={`absolute top-3 left-3 px-3 py-1 rounded-full text-[10px] font-[800] text-white tracking-wider uppercase shadow-sm ${tipoBadgeClass(
                    equipo.tipo
                  )}`}
                >
                  {tipoLabel(equipo.tipo)}
                </span>
              </div>

              {/* Miniaturas */}
              <div className="grid grid-cols-7 gap-2 mt-3">
                {imagenes.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setImagenActiva(i)}
                    aria-label={`Ver imagen ${i + 1} de ${equipo.nombre}`}
                    className={`aspect-square rounded-[10px] overflow-hidden border-2 transition-all ${
                      imagenActiva === i
                        ? 'border-[#E63C46] shadow-md shadow-[#E63C46]/20'
                        : 'border-slate-200 hover:border-slate-400'
                    }`}
                  >
                    <img
                      src={imagenCompleta(img)}
                      alt={`Vista ${i + 1} de ${equipo.nombre}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-slate-400 font-[600] text-center mt-2">
                {imagenActiva + 1} de {imagenes.length} imágenes
              </p>
            </div>

            {/* ACORDEONES DESPLEGABLES DIRECTAMENTE DEBAJO DE LA IMAGEN */}
            <div className="space-y-4 font-spartan">
              {/* ACORDEÓN 1: DESCRIPCIÓN TÉCNICA */}
              <div className="bg-white rounded-[22px] border border-slate-200/90 shadow-sm hover:shadow-md transition-all overflow-hidden">
                <button
                  onClick={() => setDescripcionAbierta(!descripcionAbierta)}
                  className={`w-full px-5 py-4 flex items-center justify-between transition-all text-left ${
                    descripcionAbierta ? 'bg-[#264772] text-white' : 'bg-slate-50 hover:bg-slate-100 text-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-xl transition-colors ${descripcionAbierta ? 'bg-white/10 text-white' : 'bg-[#264772]/10 text-[#264772]'}`}>
                      <FileText className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-[800] text-sm uppercase tracking-wide">
                        Descripción del Equipo
                      </h3>
                      <p className={`text-[11px] font-[500] ${descripcionAbierta ? 'text-slate-200' : 'text-slate-500'}`}>
                        Información general y detalles operativos
                      </p>
                    </div>
                  </div>
                  <ChevronDown
                    className={`w-5 h-5 transition-transform duration-300 ${
                      descripcionAbierta ? 'rotate-180 text-white' : 'text-[#264772]'
                    }`}
                  />
                </button>

                {descripcionAbierta && (
                  <div className="p-6 bg-white border-t border-slate-100 animate-in fade-in duration-200">
                    <div className="bg-slate-50/70 p-4 rounded-[16px] border border-slate-200/60">
                      <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-[500] whitespace-pre-line">
                        {equipo.descripcion}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* ACORDEÓN 2: ESPECIFICACIONES TÉCNICAS COMPLETAS */}
              <div id="seccion-especificaciones" className="bg-white rounded-[22px] border border-slate-200/90 shadow-sm hover:shadow-md transition-all overflow-hidden">
                <button
                  onClick={() => setEspecificacionesAbiertas(!especificacionesAbiertas)}
                  className={`w-full px-5 py-4 flex items-center justify-between transition-all text-left ${
                    especificacionesAbiertas ? 'bg-[#264772] text-white' : 'bg-slate-50 hover:bg-slate-100 text-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-xl transition-colors ${especificacionesAbiertas ? 'bg-white/10 text-white' : 'bg-[#264772]/10 text-[#264772]'}`}>
                      <Layers className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-[800] text-sm uppercase tracking-wide">
                          Especificaciones Técnicas
                        </h3>
                        <span className={`text-[10px] font-[800] px-2 py-0.5 rounded-full ${especificacionesAbiertas ? 'bg-[#E63C46] text-white' : 'bg-[#264772]/10 text-[#264772]'}`}>
                          {especificacionesCompletas.length} ítems
                        </span>
                      </div>
                      <p className={`text-[11px] font-[500] ${especificacionesAbiertas ? 'text-slate-200' : 'text-slate-500'}`}>
                        Ficha técnica detallada e identificación
                      </p>
                    </div>
                  </div>
                  <ChevronDown
                    className={`w-5 h-5 transition-transform duration-300 ${
                      especificacionesAbiertas ? 'rotate-180 text-white' : 'text-[#264772]'
                    }`}
                  />
                </button>

                {especificacionesAbiertas && (
                  <div className="p-5 sm:p-6 bg-white border-t border-slate-100 animate-in fade-in duration-200">
                    <div className="grid grid-cols-1 gap-2.5">
                      {especificacionesCompletas.map((esp, i) => (
                        <div
                          key={esp.etiqueta}
                          className="flex items-center justify-between p-3 rounded-[14px] bg-slate-50/80 hover:bg-slate-100/80 border border-slate-200/60 transition-colors text-xs"
                        >
                          <div className="flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#E63C46]" />
                            <span className="font-[700] text-slate-600">{esp.etiqueta}</span>
                          </div>
                          <span className="font-[800] text-slate-900 text-right bg-white px-3 py-1 rounded-[10px] border border-slate-200/80 shadow-2xs max-w-[200px] sm:max-w-xs truncate">
                            {esp.valor}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ===== INFO + CARACTERÍSTICAS PRIMORDIALES ===== */}
          <div className="space-y-4">
            <div className="bg-white rounded-[20px] border border-slate-200/80 p-6 sm:p-7">
              <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
                <span className="inline-flex items-center gap-1.5 text-[11px] font-[800] uppercase tracking-wider text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {equipo.disponible ? 'Disponible' : 'No disponible'}
                </span>
                {equipo.codigoInterno && (
                  <span className="text-[10px] font-[700] text-slate-400 uppercase tracking-wider">
                    {equipo.codigoInterno}
                  </span>
                )}
              </div>

              <h1 className="font-spartan font-[800] text-3xl sm:text-4xl lg:text-[38px] leading-tight tracking-tight text-slate-900">
                {equipo.nombre}
              </h1>

              <div className="flex items-center gap-2 mt-3 text-xs font-[600] text-slate-500 flex-wrap">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-[#E63C46]" /> Sede {equipo.ubicacion}
                </span>
                <span className="w-1 h-1 rounded-full bg-slate-300" />
                <span>{equipo.categoria}</span>
              </div>

              {/* BLOQUE DE CARACTERÍSTICAS DEL PRODUCTO */}
              <div className="mt-5 p-4 bg-[#F8FAFC] rounded-[16px] border border-slate-200/70 space-y-3 font-spartan">
                <h3 className="font-[800] text-sm text-slate-900 tracking-tight">
                  Características del producto
                </h3>
                
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between items-baseline border-b border-slate-200/50 pb-1.5">
                    <span className="font-[600] text-slate-500">Marca:</span>
                    <span className="font-[700] text-slate-900 text-right">{equipo.marca || 'HT RENT / Importado'}</span>
                  </div>
                  {equipo.modelo && (
                    <div className="flex justify-between items-baseline border-b border-slate-200/50 pb-1.5">
                      <span className="font-[600] text-slate-500">Modelo:</span>
                      <span className="font-[700] text-slate-900 text-right">{equipo.modelo}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-baseline border-b border-slate-200/50 pb-1.5">
                    <span className="font-[600] text-slate-500">Categoría:</span>
                    <span className="font-[700] text-slate-900 text-right">{equipo.categoria}</span>
                  </div>
                  <div className="flex justify-between items-baseline border-b border-slate-200/50 pb-1.5">
                    <span className="font-[600] text-slate-500">Sede / Ubicación:</span>
                    <span className="font-[700] text-slate-900 text-right">{equipo.ubicacion}</span>
                  </div>
                  <div className="flex justify-between items-baseline pb-1">
                    <span className="font-[600] text-slate-500">Garantía & Soporte:</span>
                    <span className="font-[700] text-emerald-600 text-right">Verificado 100%</span>
                  </div>
                </div>

                {/* SELECTOR DE VARIANTES INTERACTIVO */}
                {equipo.variantes && equipo.variantes.length > 0 && (
                  <div className="mt-4 p-4 bg-white rounded-[16px] border-2 border-[#162B4D]/15 shadow-sm space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-[800] uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5 text-[#E63C46]" />
                        Selecciona Variante / Modelo:
                      </span>
                      <span className="text-[11px] font-[700] text-slate-400">
                        {equipo.variantes.length} disponibles
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {equipo.variantes.map((v) => {
                        const esActiva = varianteSeleccionada?.id === v.id;
                        return (
                          <button
                            key={v.id}
                            type="button"
                            onClick={() => {
                              setVarianteSeleccionada(v);
                              setImagenActiva(0);
                            }}
                            className={`p-2.5 rounded-[12px] border text-left transition-all text-xs flex flex-col justify-between gap-1 ${
                              esActiva
                                ? 'border-[#E63C46] bg-[#E63C46]/5 ring-2 ring-[#E63C46]/20 font-[800]'
                                : 'border-slate-200 bg-white hover:border-slate-300 font-[600]'
                            }`}
                          >
                            <span className={esActiva ? 'text-[#E63C46]' : 'text-slate-900'}>
                              {v.varianteNombre || v.nombre}
                            </span>
                            <div className="flex items-center justify-between mt-1 text-[11px]">
                              <span className="text-slate-400 font-[600]">{v.modelo || v.codigoInterno}</span>
                              <span className="font-[800] text-slate-900">
                                {formatoPrecioMoneda(v.precio, v.unidad)}
                              </span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* BOTÓN / LINK VER TODAS LAS CARACTERÍSTICAS V */}
                <button
                  onClick={() => {
                    setEspecificacionesAbiertas(true);
                    const el = document.getElementById('seccion-especificaciones');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="w-full pt-2 text-[#264772] hover:text-[#1d385c] text-xs font-[800] flex items-center justify-center gap-1 transition-colors border-t border-slate-200/60"
                >
                  <span>Ver todas las características</span>
                  <ChevronDown className="w-4 h-4 text-[#264772]" />
                </button>
              </div>

              <div className="border-t border-slate-100 mt-5 pt-4">
                <div className="flex items-baseline gap-1.5">
                  <span className="font-spartan font-[800] text-xl sm:text-2xl text-slate-900">
                    {formatoPrecioMoneda(
                      varianteSeleccionada ? varianteSeleccionada.precio : equipo.precio,
                      varianteSeleccionada ? varianteSeleccionada.unidad : equipo.unidad,
                    )}
                  </span>
                </div>
                {varianteSeleccionada && varianteSeleccionada.codigoInterno && (
                  <p className="text-[11px] text-slate-500 font-[600] mt-1 flex items-center gap-1.5">
                    <span>Código seleccionado:</span>
                    <span className="font-[800] text-[#162B4D] bg-[#162B4D]/5 px-2 py-0.5 rounded">
                      {varianteSeleccionada.codigoInterno}
                    </span>
                    {varianteSeleccionada.modelo && (
                      <span className="text-slate-400 font-[500]">({varianteSeleccionada.modelo})</span>
                    )}
                  </p>
                )}
                <p className="text-[11px] text-slate-400 font-spartan font-[500] mt-0.5 leading-relaxed">
                  {notaPrecio(equipo.tipo)}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-6">
                <button
                  onClick={() => agregar(varianteSeleccionada || equipo)}
                  className="w-full py-3.5 rounded-[12px] text-xs font-[800] uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-lg bg-[#E63C46] hover:bg-[#C92A36] shadow-[#E63C46]/25 text-white"
                >
                  <ShoppingCart className="w-4 h-4" /> {ctaLabel(equipo.tipo)}
                </button>
                <a
                  href={`https://wa.me/51968285032?text=${encodeURIComponent(
                    `Hola, me interesa "${(varianteSeleccionada || equipo).nombre}" (Código: ${(varianteSeleccionada || equipo).codigoInterno || ''}, Modelo: ${(varianteSeleccionada || equipo).modelo || ''}). ¿Podrían cotizarlo?`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3.5 rounded-[12px] text-xs font-[800] uppercase tracking-wider bg-[#162B4D] hover:bg-[#233A61] text-white transition-all flex items-center justify-center gap-2"
                >
                  <FileText className="w-4 h-4" /> Solicitar Cotización
                </a>
              </div>

              {/* Garantías */}
              <div className="grid grid-cols-3 gap-2 mt-6 pt-5 border-t border-slate-100">
                <div className="text-center p-2.5 rounded-[12px] bg-slate-50 border border-slate-100">
                  <ShieldCheck className="w-5 h-5 text-[#E63C46] mx-auto mb-1" />
                  <p className="text-[10px] font-[700] text-slate-600 uppercase tracking-wide leading-tight">
                    Equipos Certificados
                  </p>
                </div>
                <div className="text-center p-2.5 rounded-[12px] bg-slate-50 border border-slate-100">
                  <Truck className="w-5 h-5 text-[#162B4D] mx-auto mb-1" />
                  <p className="text-[10px] font-[700] text-slate-600 uppercase tracking-wide leading-tight">
                    Despacho a Nivel Nacional
                  </p>
                </div>
                <div className="text-center p-2.5 rounded-[12px] bg-slate-50 border border-slate-100">
                  <RefreshCcw className="w-5 h-5 text-[#233A61] mx-auto mb-1" />
                  <p className="text-[10px] font-[700] text-slate-600 uppercase tracking-wide leading-tight">
                    Soporte Técnico 24/7
                  </p>
                </div>
              </div>
            </div>

            {/* Vendedor */}
            <div className="bg-white rounded-[20px] border border-slate-200/80 p-5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-[14px] bg-[#162B4D] flex items-center justify-center text-white font-spartan font-[800] text-sm shrink-0">
                HT
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-[800] text-slate-800 flex items-center gap-1.5">
                  HH T-Soluciona S.A.C.
                  <BadgeCheck className="w-4 h-4 text-[#0EA5E9]" />
                </p>
                <p className="text-xs text-slate-500 mt-0.5 font-spartan font-[500]">
                  Av. Colectora Norte 509, Piura, Perú · {tipoLabel(equipo.tipo)} y venta directa con la empresa
                </p>
              </div>
            </div>
          </div>
        </div>



        {/* ===== SECCIÓN PRODUCTOS RELACIONADOS ===== */}
        {relacionados.length > 0 && (
          <div className="pt-6 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[#E63C46] font-[700] text-xs tracking-widest uppercase bg-[#E63C46]/10 px-3 py-1 rounded-full border border-[#E63C46]/20 inline-block mb-1">
                  Recomendados
                </span>
                <h2 className="font-spartan font-[800] text-2xl sm:text-3xl text-slate-900 uppercase tracking-tight">
                  Productos Relacionados
                </h2>
              </div>
              <Link
                href="/equipos"
                className="hidden sm:inline-flex items-center gap-1.5 text-xs font-[700] text-[#264772] hover:text-[#1d385c] transition-colors"
              >
                <span>Ver todo el catálogo</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {relacionados.map((rel) => (
                <div
                  key={rel.id}
                  onClick={() => router.push(`/equipos/${rel.id}`)}
                  className="bg-white rounded-[20px] border border-slate-200/80 hover:border-slate-300 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col overflow-hidden group cursor-pointer"
                >
                  <div className="relative h-48 bg-slate-100 overflow-hidden">
                    <img
                      src={imagenCompleta(rel.imagenUrl)}
                      alt={rel.nombre}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <span
                      className={`absolute top-3 left-3 text-[10px] font-[800] px-2.5 py-1 rounded-full uppercase tracking-wider shadow-sm text-white ${tipoBadgeClass(
                        rel.tipo
                      )}`}
                    >
                      {tipoLabel(rel.tipo)}
                    </span>
                  </div>

                  <div className="p-4 flex-1 flex flex-col justify-between">
                    <div>
                      <span className="text-[10px] font-[700] text-[#E63C46] uppercase tracking-wider block mb-1">
                        {rel.categoria}
                      </span>
                      <h4 className="font-spartan font-[700] text-sm text-slate-900 leading-snug line-clamp-2 group-hover:text-[#264772] transition-colors">
                        {rel.nombre}
                      </h4>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-slate-400 font-[600] uppercase block">
                          {precioEtiquetaCorta(rel.tipo)}
                        </span>
                        <span className="font-spartan font-[700] text-sm text-slate-900">
                          {rel.precio !== null && rel.precio !== undefined
                            ? `S/ ${Number(rel.precio).toLocaleString('es-PE')}`
                            : 'A Cotizar'}
                        </span>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          agregar(rel);
                        }}
                        className="p-2 bg-[#264772] hover:bg-[#1d385c] text-white rounded-xl transition-all shadow-sm"
                        title={ctaLabel(rel.tipo)}
                      >
                        <ShoppingCart className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CTA Final */}
        <div className="bg-gradient-to-r from-[#162B4D] via-[#233A61] to-[#162B4D] rounded-[20px] p-8 text-center text-white shadow-xl">
          <h3 className="font-spartan font-[800] text-xl sm:text-2xl">
            ¿Necesitas este equipo para tu proyecto?
          </h3>
          <p className="text-slate-300 text-xs sm:text-sm mt-2 max-w-xl mx-auto font-spartan font-[500]">
            Cotizamos este equipo en modalidad {precioEtiqueta(equipo.tipo)} o como proyecto llave en mano, con asesoría técnica especializada.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-6">
            <a
              href={`https://wa.me/51968285032?text=${encodeURIComponent(
                `Hola, me interesa cotizar el equipo "${equipo.nombre}".`
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-7 py-3 bg-[#E63C46] hover:bg-[#C92A36] text-white text-xs font-[800] rounded-[12px] uppercase tracking-wider transition-all shadow-lg shadow-[#E63C46]/25"
            >
              Cotizar por WhatsApp
            </a>
            <Link
              href="/cotizacion"
              className="px-7 py-3 bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-[800] rounded-[12px] uppercase tracking-wider transition-all"
            >
              Ir a mi Cotización
            </Link>
          </div>
        </div>
      </section>

      <Footer />
      <WhatsappWidget />
    </main>
  );
}
