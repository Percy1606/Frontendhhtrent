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
  Image as ImageIcon,
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

  const urlEquipo = equipo.imagenUrl && equipo.imagenUrl.trim() !== '' ? equipo.imagenUrl : null;
  const urlPadre = equipoPadre?.imagenUrl && equipoPadre.imagenUrl.trim() !== '' ? equipoPadre.imagenUrl : null;

  const urlPrincipal = urlEquipo || urlPadre || '';

  return [urlPrincipal, ...fotos].filter(
    (url, i, arr) => url && arr.indexOf(url) === i,
  );
}

export default function EquipoDetallePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [equipo, setEquipo] = useState<EquipoDetalle | null>(null);
  const [varianteSeleccionada, setVarianteSeleccionada] = useState<EquipoDetalle | null>(null);
  const [filtroVariantesTexto, setFiltroVariantesTexto] = useState('');
  const [variantePolo, setVariantePolo] = useState('TODOS');
  const [varianteAmp, setVarianteAmp] = useState('TODOS');
  const [varianteCorte, setVarianteCorte] = useState('TODOS');

  // Atributos extraídos automáticamente de las variantes
  const polosDisponibles: string[] = Array.from(
    new Set(
      (equipo?.variantes || [])
        .map((v: EquipoDetalle) => {
          const match = `${v.nombre} ${v.varianteNombre} ${v.modelo}`.match(/\b([1-4]\s*P)\b/i);
          return match ? match[0].toUpperCase().replace(/\s+/, '') : null;
        })
        .filter((item): item is string => Boolean(item))
    )
  ).sort();

  const amperajesDisponibles: string[] = Array.from(
    new Set(
      (equipo?.variantes || [])
        .map((v: EquipoDetalle) => {
          const match = `${v.nombre} ${v.varianteNombre} ${v.modelo}`.match(/\b(\d{1,4}\s*A)\b/i);
          return match ? match[0].toUpperCase().replace(/\s+/, '') : null;
        })
        .filter((item): item is string => Boolean(item))
    )
  ).sort((a: string, b: string) => parseInt(a) - parseInt(b));

  const cortesDisponibles: string[] = Array.from(
    new Set(
      (equipo?.variantes || [])
        .map((v: EquipoDetalle) => {
          const match = `${v.nombre} ${v.varianteNombre} ${v.modelo}`.match(/\b(\d{1,3}\s*KA)\b/i);
          return match ? match[0].toUpperCase().replace(/\s+/, '') : null;
        })
        .filter((item): item is string => Boolean(item))
    )
  ).sort((a: string, b: string) => parseInt(a) - parseInt(b));

  // Filtrado dinámico de variantes con expresiones regulares estrictas (evita falsos positivos como 10KA o 1A dentro de un texto)
  const variantesFiltradas = (equipo?.variantes || []).filter((v: EquipoDetalle) => {
    const texto = `${v.nombre} ${v.varianteNombre} ${v.codigoInterno} ${v.modelo} ${v.descripcion}`.toUpperCase();
    
    if (filtroVariantesTexto && !texto.includes(filtroVariantesTexto.toUpperCase())) return false;
    
    if (variantePolo !== 'TODOS') {
      const regexPolo = new RegExp(`\\b${variantePolo.replace(/P$/i, '\\s*P')}\\b`, 'i');
      if (!regexPolo.test(texto)) return false;
    }
    
    if (varianteAmp !== 'TODOS') {
      const regexAmp = new RegExp(`\\b${varianteAmp.replace(/A$/i, '\\s*A')}\\b`, 'i');
      if (!regexAmp.test(texto)) return false;
    }
    
    if (varianteCorte !== 'TODOS') {
      const regexCorte = new RegExp(`\\b${varianteCorte.replace(/KA$/i, '\\s*KA')}\\b`, 'i');
      if (!regexCorte.test(texto)) return false;
    }
    
    return true;
  });
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
          const data: EquipoDetalle & { varianteInicialId?: string } = await res.json();
          setEquipo(data);
          if (data.varianteInicialId && data.variantes && data.variantes.length > 0) {
            const inicial = data.variantes.find((v) => v.id === data.varianteInicialId) || null;
            setVarianteSeleccionada(inicial);
          } else {
            setVarianteSeleccionada(null);
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
        <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
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
      <section className="py-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* ===== COLUMNA IZQUIERDA (5 COLUMNAS): GALERÍA DE IMÁGENES + DESCRIPCIÓN Y FICHA TÉCNICA ===== */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white rounded-[20px] border border-slate-200/80 p-4 sm:p-5 shadow-sm">
              <div className="relative h-64 sm:h-80 bg-slate-50 rounded-[14px] overflow-hidden border border-slate-100 flex items-center justify-center">
                {imagenes.length > 0 && imagenes[imagenActiva] ? (
                  <img
                    src={imagenCompleta(imagenes[imagenActiva])}
                    alt={equipo.nombre}
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                      const parent = (e.target as HTMLElement).parentElement;
                      if (parent && !parent.querySelector('.fallback-icon')) {
                        const fallback = document.createElement('div');
                        fallback.className = 'fallback-icon flex flex-col items-center justify-center gap-1 text-slate-400 text-xs font-[800] uppercase tracking-widest';
                        fallback.innerHTML = '<span class="text-xl">⚡</span><span>HH RENT</span>';
                        parent.appendChild(fallback);
                      }
                    }}
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center text-slate-300 gap-1">
                    <span className="text-2xl font-[800]">⚡</span>
                    <span className="text-xs font-[700] text-slate-400 uppercase tracking-widest">HH RENT</span>
                  </div>
                )}
                <span
                  className={`absolute top-3 left-3 px-3 py-1 rounded-full text-[10px] font-[800] text-white tracking-wider uppercase shadow-sm ${tipoBadgeClass(
                    equipo.tipo
                  )}`}
                >
                  {tipoLabel(equipo.tipo)}
                </span>
              </div>

              {/* Miniaturas */}
              {imagenes.length > 1 && (
                <div className="grid grid-cols-6 gap-2 mt-3">
                  {imagenes.map((img, i) => (
                    <button
                      key={i}
                      onClick={() => setImagenActiva(i)}
                      aria-label={`Ver imagen ${i + 1}`}
                      className={`aspect-square rounded-[10px] overflow-hidden border-2 transition-all ${
                        imagenActiva === i
                          ? 'border-[#E63C46] shadow-md shadow-[#E63C46]/20'
                          : 'border-slate-200 hover:border-slate-400'
                      }`}
                    >
                      <img
                        src={imagenCompleta(img)}
                        alt={`Vista ${i + 1}`}
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* DESCRIPCIÓN Y ESPECIFICACIONES TÉCNICAS DIRECTAMENTE EN LA COLUMNA IZQUIERDA */}
            <div className="bg-white rounded-[20px] border border-slate-200/80 p-5 shadow-sm space-y-4 font-spartan">
              <div>
                <h3 className="font-[800] text-sm uppercase tracking-wider text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-2">
                  <FileText className="w-4 h-4 text-[#E63C46]" />
                  Descripción del Equipo
                </h3>
                <p className="mt-3 text-xs sm:text-sm text-slate-600 leading-relaxed whitespace-pre-line font-[500]">
                  {equipo.descripcion}
                </p>
              </div>

              {especificacionesCompletas.length > 0 && (
                <div className="pt-2">
                  <h3 className="font-[800] text-sm uppercase tracking-wider text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-2 mb-3">
                    <Layers className="w-4 h-4 text-[#162B4D]" />
                    Ficha Técnica
                  </h3>
                  <div className="grid grid-cols-1 gap-2">
                    {especificacionesCompletas.map((esp) => (
                      <div
                        key={esp.etiqueta}
                        className="flex items-center justify-between p-2.5 rounded-[12px] bg-slate-50 border border-slate-200/60 text-xs"
                      >
                        <span className="font-[700] text-slate-600">{esp.etiqueta}</span>
                        <span className="font-[800] text-slate-900 text-right bg-white px-2.5 py-0.5 rounded-[8px] border border-slate-200/80 shadow-2xs truncate max-w-[180px]">
                          {esp.valor}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ===== COLUMNA DERECHA (7 COLUMNAS): COMPRA, PRECIO, VARIANTES Y BENEFICIOS ===== */}
          <div className="lg:col-span-7 space-y-5">
            <div className="bg-white rounded-[20px] border border-slate-200/80 p-6 sm:p-7 shadow-sm">
              <div className="flex items-center justify-between flex-wrap gap-2 mb-2">
                <span className="inline-flex items-center gap-1.5 text-[11px] font-[800] uppercase tracking-wider text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {equipo.disponible ? 'Disponible Inmediato' : 'Bajo Reserva'}
                </span>
                {equipo.codigoInterno && (
                  <span className="text-[11px] font-[800] text-[#162B4D] bg-slate-100 px-2.5 py-1 rounded-lg">
                    CÓD: {equipo.codigoInterno}
                  </span>
                )}
              </div>

              {/* TÍTULO LIGERAMENTE MÁS PEQUEÑO Y EQUILIBRADO */}
              <h1 className="font-spartan font-[800] text-2xl sm:text-3xl text-slate-900 leading-snug tracking-tight">
                {equipo.nombre}
              </h1>

              <div className="flex items-center gap-2 mt-2 text-xs font-[600] text-slate-500 flex-wrap">
                <span className="flex items-center gap-1 text-slate-700 font-[700]">
                  <MapPin className="w-3.5 h-3.5 text-[#E63C46]" /> Sede {equipo.ubicacion}
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                <span className="text-[#E63C46] font-[700] uppercase">{equipo.categoria}</span>
              </div>

              {/* VARIANTES CON BUSCADOR Y FILTROS DINÁMICOS FACETADOS */}
              {equipo.variantes && equipo.variantes.length > 0 && (
                <div className="mt-5 p-4 bg-slate-50 rounded-[18px] border border-slate-200/80 space-y-4 font-spartan">
                  <div className="flex items-center justify-between border-b border-slate-200/60 pb-2.5">
                    <span className="text-xs font-[800] uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                      <Layers className="w-4 h-4 text-[#E63C46]" />
                      Selecciona Variante / Modelo ({equipo.variantes.length} disponibles)
                    </span>
                    {(filtroVariantesTexto || variantePolo !== 'TODOS' || varianteAmp !== 'TODOS' || varianteCorte !== 'TODOS') && (
                      <button
                        onClick={() => {
                          setFiltroVariantesTexto('');
                          setVariantePolo('TODOS');
                          setVarianteAmp('TODOS');
                          setVarianteCorte('TODOS');
                        }}
                        className="text-[10px] font-[700] text-[#E63C46] hover:underline"
                      >
                        Limpiar filtros
                      </button>
                    )}
                  </div>

                  {/* Buscador de variantes */}
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Buscar por modelo, código o característica..."
                      value={filtroVariantesTexto}
                      onChange={(e) => setFiltroVariantesTexto(e.target.value)}
                      className="w-full pl-3 pr-3 py-2 bg-white border border-slate-200 rounded-[10px] text-xs font-[600] text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#162B4D] transition-all"
                    />
                  </div>

                  {/* Filtros dinámicos automáticos */}
                  <div className="space-y-2 text-xs">
                    {/* Filtro Polos */}
                    {polosDisponibles.length > 0 && (
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] font-[700] uppercase text-slate-400 min-w-[60px]">Polos:</span>
                        <button
                          onClick={() => setVariantePolo('TODOS')}
                          className={`px-2 py-0.5 rounded-md text-[10px] font-[700] transition-all ${
                            variantePolo === 'TODOS' ? 'bg-[#162B4D] text-white' : 'bg-white border border-slate-200 text-slate-600'
                          }`}
                        >
                          TODOS
                        </button>
                        {polosDisponibles.map((p) => (
                          <button
                            key={p}
                            onClick={() => setVariantePolo(p)}
                            className={`px-2 py-0.5 rounded-md text-[10px] font-[700] transition-all ${
                              variantePolo === p ? 'bg-[#162B4D] text-white' : 'bg-white border border-slate-200 text-slate-600'
                            }`}
                          >
                            {p}
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Filtro Amperaje */}
                    {amperajesDisponibles.length > 0 && (
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] font-[700] uppercase text-slate-400 min-w-[60px]">Amperaje:</span>
                        <button
                          onClick={() => setVarianteAmp('TODOS')}
                          className={`px-2 py-0.5 rounded-md text-[10px] font-[700] transition-all ${
                            varianteAmp === 'TODOS' ? 'bg-[#162B4D] text-white' : 'bg-white border border-slate-200 text-slate-600'
                          }`}
                        >
                          TODOS
                        </button>
                        {amperajesDisponibles.map((a) => (
                          <button
                            key={a}
                            onClick={() => setVarianteAmp(a)}
                            className={`px-2 py-0.5 rounded-md text-[10px] font-[700] transition-all ${
                              varianteAmp === a ? 'bg-[#162B4D] text-white' : 'bg-white border border-slate-200 text-slate-600'
                            }`}
                          >
                            {a}
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Filtro Capacidad de Corte */}
                    {cortesDisponibles.length > 0 && (
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] font-[700] uppercase text-slate-400 min-w-[60px]">Capacidad:</span>
                        <button
                          onClick={() => setVarianteCorte('TODOS')}
                          className={`px-2 py-0.5 rounded-md text-[10px] font-[700] transition-all ${
                            varianteCorte === 'TODOS' ? 'bg-[#162B4D] text-white' : 'bg-white border border-slate-200 text-slate-600'
                          }`}
                        >
                          TODOS
                        </button>
                        {cortesDisponibles.map((c) => (
                          <button
                            key={c}
                            onClick={() => setVarianteCorte(c)}
                            className={`px-2 py-0.5 rounded-md text-[10px] font-[700] transition-all ${
                              varianteCorte === c ? 'bg-[#162B4D] text-white' : 'bg-white border border-slate-200 text-slate-600'
                            }`}
                          >
                            {c}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Contador y lista paginada/filtrada */}
                  <div className="flex items-center justify-between text-[11px] font-[700] text-slate-600 pt-1">
                    <span>→ {variantesFiltradas.length} variantes encontradas</span>
                    {varianteSeleccionada && (
                      <span className="text-[#E63C46]">Variante seleccionada activa</span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-64 overflow-y-auto pr-1">
                    {variantesFiltradas.slice(0, 12).map((v) => {
                      const esActiva = varianteSeleccionada?.id === v.id;
                      return (
                        <button
                          key={v.id}
                          type="button"
                          onClick={() => {
                            setVarianteSeleccionada(v);
                            setImagenActiva(0);
                          }}
                          className={`p-2.5 rounded-[12px] border text-left transition-all text-xs flex flex-col justify-between gap-1 shadow-2xs ${
                            esActiva
                              ? 'border-[#E63C46] bg-white ring-2 ring-[#E63C46]/20 font-[800]'
                              : 'border-slate-200 bg-white hover:border-slate-300 font-[600]'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-1.5">
                            <span className={`line-clamp-1 ${esActiva ? 'text-[#E63C46] font-[800]' : 'text-slate-900'}`}>
                              {v.varianteNombre || v.nombre}
                            </span>
                            {esActiva && <CheckCircle2 className="w-3.5 h-3.5 text-[#E63C46] shrink-0" />}
                          </div>
                          <div className="flex items-center justify-between mt-1 pt-1 border-t border-slate-100 text-[10px]">
                            <span className="text-slate-400 font-[600] truncate max-w-[100px]">
                              {v.modelo || v.codigoInterno}
                            </span>
                            <span className="font-[800] text-slate-900 bg-slate-100 px-1.5 py-0.5 rounded">
                              {formatoPrecioMoneda(v.precio, v.unidad)}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* BLOQUE DE PRECIO COMPACTO Y ELEGANTE */}
              <div className="border-t border-b border-slate-100 my-3 py-2 bg-slate-50/70 p-3 rounded-[12px]">
                <span className="text-[10px] font-[800] text-[#E63C46] uppercase tracking-wider block mb-0.5">
                  Precio de {precioEtiquetaCorta(equipo.tipo)}
                </span>
                <div className="flex items-baseline gap-2">
                  <span className="font-spartan font-[800] text-lg sm:text-xl text-slate-900">
                    {formatoPrecioMoneda(
                      varianteSeleccionada ? varianteSeleccionada.precio : equipo.precio,
                      varianteSeleccionada ? varianteSeleccionada.unidad : equipo.unidad,
                    )}
                  </span>
                </div>
                {varianteSeleccionada && varianteSeleccionada.codigoInterno && (
                  <p className="text-[10px] text-slate-600 font-[600] mt-0.5 flex items-center gap-1.5">
                    <span>Modelo:</span>
                    <span className="font-[800] text-[#162B4D] bg-[#162B4D]/10 px-1.5 py-0.5 rounded">
                      {varianteSeleccionada.codigoInterno}
                    </span>
                  </p>
                )}
                <p className="text-[10px] text-slate-400 font-spartan font-[500] mt-0.5 leading-relaxed">
                  {notaPrecio(equipo.tipo)}
                </p>
              </div>

              {/* BOTÓN PRINCIPAL COMPRAR + SECUNDARIO COTIZAR */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-6">
                <button
                  onClick={() => agregar(varianteSeleccionada || equipo)}
                  className="w-full py-4 rounded-[14px] text-xs font-[800] uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-xl bg-[#E63C46] hover:bg-[#C92A36] shadow-[#E63C46]/25 text-white transform hover:scale-[1.01]"
                >
                  <ShoppingCart className="w-4 h-4" /> COMPRAR AHORA
                </button>
                <a
                  href={`https://wa.me/51968285032?text=${encodeURIComponent(
                    `Hola, me interesa solicitar cotización para "${(varianteSeleccionada || equipo).nombre}" (Código: ${(varianteSeleccionada || equipo).codigoInterno || ''}, Modelo: ${(varianteSeleccionada || equipo).modelo || ''}).`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-4 rounded-[14px] text-xs font-[800] uppercase tracking-wider bg-[#162B4D] hover:bg-[#233A61] text-white transition-all flex items-center justify-center gap-2 shadow-md"
                >
                  <FileText className="w-4 h-4" /> Solicitar Cotización
                </a>
              </div>

              {/* MANTENER LOS BENEFICIOS DE CERTIFICACIÓN, DESPACHO Y SOPORTE */}
              <div className="grid grid-cols-3 gap-2 mt-6 pt-5 border-t border-slate-100">
                <div className="text-center p-3 rounded-[14px] bg-slate-50 border border-slate-100">
                  <ShieldCheck className="w-5 h-5 text-[#E63C46] mx-auto mb-1" />
                  <p className="text-[10px] font-[800] text-slate-700 uppercase tracking-wide leading-tight">
                    Equipos Certificados
                  </p>
                </div>
                <div className="text-center p-3 rounded-[14px] bg-slate-50 border border-slate-100">
                  <Truck className="w-5 h-5 text-[#162B4D] mx-auto mb-1" />
                  <p className="text-[10px] font-[800] text-slate-700 uppercase tracking-wide leading-tight">
                    Despacho a Nivel Nacional
                  </p>
                </div>
                <div className="text-center p-3 rounded-[14px] bg-slate-50 border border-slate-100">
                  <RefreshCcw className="w-5 h-5 text-[#233A61] mx-auto mb-1" />
                  <p className="text-[10px] font-[800] text-slate-700 uppercase tracking-wide leading-tight">
                    Soporte Técnico 24/7
                  </p>
                </div>
              </div>
            </div>

            {/* TARJETA DEL VENDEDOR VERIFICADO MEJORADA */}
            <div className="bg-white rounded-[20px] border border-slate-200/80 p-5 flex items-center gap-4 shadow-sm">
              <div className="w-12 h-12 rounded-[14px] bg-[#162B4D] flex items-center justify-center text-white font-spartan font-[800] text-base shrink-0 shadow-md">
                HT
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-[800] text-slate-900 uppercase tracking-wide">
                    HH T-Soluciona S.A.C.
                  </h4>
                  <span className="inline-flex items-center gap-1 text-[10px] font-[800] text-[#0EA5E9] bg-sky-50 border border-sky-200 px-2 py-0.5 rounded-full">
                    <BadgeCheck className="w-3.5 h-3.5 text-[#0EA5E9]" /> Vendedor Verificado
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1 font-spartan font-[500] leading-relaxed">
                  Av. Colectora Norte 509, Piura, Perú · Distribuidor oficial y soporte técnico garantizado.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ===== SECCIÓN PRODUCTOS RELACIONADOS CON ESPACIO REDUCIDO ===== */}
        {relacionados.length > 0 && (
          <div className="pt-2 space-y-4">
            <div className="flex items-center justify-between border-t border-slate-200/70 pt-6">
              <div>
                <span className="text-[#E63C46] font-[700] text-[10px] tracking-widest uppercase bg-[#E63C46]/10 px-2.5 py-0.5 rounded-full border border-[#E63C46]/20 inline-block mb-1">
                  Recomendados
                </span>
                <h2 className="font-spartan font-[800] text-xl sm:text-2xl text-slate-900 uppercase tracking-tight">
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

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-stretch">
              {relacionados.map((rel) => (
                <div
                  key={rel.id}
                  onClick={() => router.push(`/equipos/${rel.id}`)}
                  className="bg-white rounded-[20px] border border-slate-200/80 hover:border-slate-300 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col h-full overflow-hidden group cursor-pointer"
                >
                  <div className="relative h-44 bg-slate-100 overflow-hidden shrink-0 flex items-center justify-center">
                    <img
                      src={imagenCompleta(rel.imagenUrl)}
                      alt={rel.nombre}
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                        const parent = (e.target as HTMLElement).parentElement;
                        if (parent && !parent.querySelector('.fallback-icon')) {
                          const fallback = document.createElement('div');
                          fallback.className = 'fallback-icon flex flex-col items-center justify-center gap-1 text-slate-400 text-[10px] font-[700] uppercase';
                          fallback.innerHTML = '<span>⚡ HH RENT</span>';
                          parent.appendChild(fallback);
                        }
                      }}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <span
                      className={`absolute top-2.5 left-2.5 text-[9px] font-[800] px-2 py-0.5 rounded-full uppercase tracking-wider shadow-sm text-white ${tipoBadgeClass(
                        rel.tipo
                      )}`}
                    >
                      {tipoLabel(rel.tipo)}
                    </span>
                  </div>

                  <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                    <div className="space-y-1">
                      <span className="text-[10px] font-[800] text-[#E63C46] uppercase tracking-wider block truncate">
                        {rel.categoria}
                      </span>
                      <h4 className="font-spartan font-[700] text-[14px] text-slate-900 leading-snug line-clamp-2 min-h-[2.4rem] group-hover:text-[#264772] transition-colors">
                        {rel.nombre}
                      </h4>
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between mt-auto">
                      <div>
                        <span className="text-[10px] text-slate-400 font-[600] uppercase block">
                          {precioEtiquetaCorta(rel.tipo)}
                        </span>
                        <span className="font-spartan font-[800] text-xs sm:text-sm text-slate-900">
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
                        className="p-2 bg-[#264772] hover:bg-[#1d385c] text-white rounded-lg transition-all shadow-sm"
                        title={ctaLabel(rel.tipo)}
                      >
                        <ShoppingCart className="w-3.5 h-3.5" />
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
