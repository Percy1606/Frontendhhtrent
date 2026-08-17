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

function galeriaDe(
  equipoActivo: EquipoDetalle,
  equipoPadre?: EquipoDetalle | null
): { fotos: string[]; esReferencial: boolean } {
  const tieneImagenPropia = Boolean(equipoActivo.imagenUrl && equipoActivo.imagenUrl.trim() !== '');

  const fotosVariante = (equipoActivo.documentos || [])
    .filter(
      (d) =>
        d.tipo === 'FOTOGRAFIA' ||
        (d.mimeType && d.mimeType.startsWith('image/')),
    )
    .map((d) => d.url);

  const fotosPadre = (equipoPadre?.documentos || [])
    .filter(
      (d) =>
        d.tipo === 'FOTOGRAFIA' ||
        (d.mimeType && d.mimeType.startsWith('image/')),
    )
    .map((d) => d.url);

  let urlPrincipal = '';
  let esReferencial = false;

  if (tieneImagenPropia) {
    urlPrincipal = equipoActivo.imagenUrl!;
    esReferencial = false;
  } else if (equipoPadre?.imagenUrl && equipoPadre.imagenUrl.trim() !== '') {
    urlPrincipal = equipoPadre.imagenUrl;
    esReferencial = equipoActivo.id !== equipoPadre.id; // Es referencial si estamos en variante sin imagen propia
  }

  const todasLasFotos = [urlPrincipal, ...(fotosVariante.length > 0 ? fotosVariante : fotosPadre)].filter(
    (url, i, arr) => url && arr.indexOf(url) === i,
  );

  return { fotos: todasLasFotos, esReferencial };
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
  const galeriaInfo = equipoActivo ? galeriaDe(equipoActivo, equipo) : { fotos: [], esReferencial: false };

  // Bloque 1: Identificación
  const bloqueIdentificacion = (equipoActivo
    ? [
        { etiqueta: 'Código interno', valor: equipoActivo.codigoInterno },
        { etiqueta: 'Modelo', valor: equipoActivo.modelo },
        { etiqueta: 'Variante / Tipo', valor: equipoActivo.varianteNombre },
        { etiqueta: 'Marca', valor: equipoActivo.marca || equipo?.marca },
        { etiqueta: 'Serie', valor: equipoActivo.serie },
        { etiqueta: 'Año de Fabricación', valor: equipoActivo.anio ? String(equipoActivo.anio) : null },
      ]
    : []
  ).filter((i) => i.valor && i.valor !== '—' && String(i.valor).trim() !== '');

  // Bloque 2: Clasificación
  const bloqueClasificacion = (equipoActivo
    ? [
        { etiqueta: 'Categoría', valor: equipoActivo.categoria || equipo?.categoria },
        { etiqueta: 'Familia', valor: equipo?.familia?.nombre },
        { etiqueta: 'Subcategoría', valor: equipo?.subfamilia?.nombre },
      ]
    : []
  ).filter((i) => i.valor && i.valor !== '—' && String(i.valor).trim() !== '');

  // Bloque 3: Logística y Operativa
  const bloqueLogistica = (equipoActivo
    ? [
        { etiqueta: 'Proveedor / Fabricante', valor: equipoActivo.proveedor },
        { etiqueta: 'Almacén / Ubicación', valor: equipoActivo.ubicacion || equipo?.ubicacion },
        { etiqueta: 'Modalidad Comercial', valor: tipoTexto },
        {
          etiqueta: 'Disponibilidad Operativa',
          valor: equipoActivo.disponible ? 'Disponible Inmediato' : 'Bajo Pedido / Reserva',
        },
      ]
    : []
  ).filter((i) => i.valor && i.valor !== '—' && String(i.valor).trim() !== '');

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
          
          {/* ===== COLUMNA IZQUIERDA (5 COLUMNAS): GALERÍA DE IMÁGENES + DESCRIPCIÓN Y FICHA TÉCNICA ESTRUCTURADA ===== */}
          <div className="lg:col-span-5 space-y-5 font-spartan">
            <div className="bg-white rounded-[20px] border border-[#E5EAF1] p-4 sm:p-5 shadow-2xs">
              <div className="relative h-64 sm:h-80 bg-[#F8FAFC] rounded-[14px] overflow-hidden border border-[#E5EAF1] flex items-center justify-center">
                {galeriaInfo.fotos.length > 0 && galeriaInfo.fotos[imagenActiva] ? (
                  <img
                    src={imagenCompleta(galeriaInfo.fotos[imagenActiva])}
                    alt={equipoActivo!.nombre}
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                      const parent = (e.target as HTMLElement).parentElement;
                      if (parent && !parent.querySelector('.fallback-icon')) {
                        const fallback = document.createElement('div');
                        fallback.className = 'fallback-icon flex flex-col items-center justify-center gap-1 text-[#7890AD] text-xs font-[700] uppercase tracking-widest';
                        fallback.innerHTML = '<span class="text-xl">⚡</span><span>HH RENT</span>';
                        parent.appendChild(fallback);
                      }
                    }}
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center text-[#7890AD] gap-1">
                    <span className="text-2xl font-[800]">⚡</span>
                    <span className="text-xs font-[700] uppercase tracking-widest">HH RENT</span>
                  </div>
                )}
                
                {/* Badges de Estado */}
                <div className="absolute top-3 left-3 flex flex-col gap-1.5 items-start">
                  <span
                    className={`px-3 py-1 rounded-full text-[10px] font-[700] tracking-wider uppercase shadow-2xs text-white ${tipoBadgeClass(
                      equipoActivo!.tipo
                    )}`}
                  >
                    {tipoLabel(equipoActivo!.tipo)}
                  </span>
                  {galeriaInfo.esReferencial && (
                    <span className="px-2.5 py-0.5 rounded-full text-[9px] font-[600] text-slate-700 bg-white/90 backdrop-blur-xs border border-slate-200 shadow-2xs">
                      📷 Imagen referencial
                    </span>
                  )}
                </div>
              </div>

              {/* Miniaturas de imágenes */}
              {galeriaInfo.fotos.length > 1 && (
                <div className="grid grid-cols-6 gap-2 mt-3">
                  {galeriaInfo.fotos.map((img, i) => (
                    <button
                      key={i}
                      onClick={() => setImagenActiva(i)}
                      aria-label={`Ver imagen ${i + 1}`}
                      className={`aspect-square rounded-[10px] overflow-hidden border transition-all ${
                        imagenActiva === i
                          ? 'border-[#EF3945] ring-2 ring-[#EF3945]/20 shadow-2xs'
                          : 'border-[#E5EAF1] hover:border-[#7890AD]'
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

            {/* DESCRIPCIÓN DEL EQUIPO Y FICHA TÉCNICA LIMPIA Y PROFESIONAL */}
            <div className="bg-white rounded-[20px] border border-[#E5EAF1] p-5 sm:p-6 shadow-2xs space-y-6">
              {/* Descripción */}
              {equipoActivo.descripcion && (
                <div>
                  <h3 className="font-[700] text-[15px] sm:text-[16px] text-[#172D52] flex items-center gap-2 border-b border-[#E5EAF1] pb-2.5">
                    <FileText className="w-4 h-4 text-[#EF3945]" />
                    Descripción del Equipo
                  </h3>
                  <p className="mt-3 text-[14px] sm:text-[15px] text-[#425A78] font-[400] leading-relaxed whitespace-pre-line">
                    {equipoActivo.descripcion}
                  </p>
                </div>
              )}

              {/* Ficha Técnica Estructurada en Bloques */}
              <div className="pt-2">
                <div className="flex items-center justify-between border-b border-[#E5EAF1] pb-2.5 mb-4">
                  <h3 className="font-[700] text-[15px] sm:text-[16px] text-[#172D52] flex items-center gap-2">
                    <Layers className="w-4 h-4 text-[#172D52]" />
                    Ficha Técnica
                  </h3>
                  {varianteSeleccionada && (
                    <span className="text-[11px] font-[600] text-[#EF3945] bg-[#EF3945]/10 px-2 py-0.5 rounded-md">
                      Datos de variante
                    </span>
                  )}
                </div>

                <div className="space-y-4">
                  {/* Bloque 1: Identificación */}
                  {bloqueIdentificacion.length > 0 && (
                    <div>
                      <h4 className="text-[12px] font-[700] uppercase tracking-wider text-[#7890AD] mb-2">
                        Identificación
                      </h4>
                      <div className="space-y-1.5">
                        {bloqueIdentificacion.map((item) => (
                          <div
                            key={item.etiqueta}
                            className="flex items-center justify-between py-1.5 border-b border-[#E5EAF1]/60 text-xs"
                          >
                            <span className="text-[12px] sm:text-[13px] font-[500] text-[#7890AD]">
                              {item.etiqueta}
                            </span>
                            <span className="text-[13px] sm:text-[14px] font-[600] text-[#172D52] text-right">
                              {item.valor}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Bloque 2: Clasificación */}
                  {bloqueClasificacion.length > 0 && (
                    <div>
                      <h4 className="text-[12px] font-[700] uppercase tracking-wider text-[#7890AD] mb-2">
                        Clasificación
                      </h4>
                      <div className="space-y-1.5">
                        {bloqueClasificacion.map((item) => (
                          <div
                            key={item.etiqueta}
                            className="flex items-center justify-between py-1.5 border-b border-[#E5EAF1]/60 text-xs"
                          >
                            <span className="text-[12px] sm:text-[13px] font-[500] text-[#7890AD]">
                              {item.etiqueta}
                            </span>
                            <span className="text-[13px] sm:text-[14px] font-[600] text-[#172D52] text-right">
                              {item.valor}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Bloque 3: Logística y Comercial (Desplegable) */}
                  {bloqueLogistica.length > 0 && (
                    <div>
                      {especificacionesAbiertas && (
                        <div>
                          <h4 className="text-[12px] font-[700] uppercase tracking-wider text-[#7890AD] my-2">
                            Logística y Operativa
                          </h4>
                          <div className="space-y-1.5">
                            {bloqueLogistica.map((item) => (
                              <div
                                key={item.etiqueta}
                                className="flex items-center justify-between py-1.5 border-b border-[#E5EAF1]/60 text-xs"
                              >
                                <span className="text-[12px] sm:text-[13px] font-[500] text-[#7890AD]">
                                  {item.etiqueta}
                                </span>
                                <span className="text-[13px] sm:text-[14px] font-[600] text-[#172D52] text-right">
                                  {item.valor}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <button
                        type="button"
                        onClick={() => setEspecificacionesAbiertas(!especificacionesAbiertas)}
                        className="w-full mt-3 py-2 px-3 bg-[#F8FAFC] hover:bg-[#E5EAF1]/50 border border-[#E5EAF1] rounded-[10px] text-xs font-[600] text-[#172D52] transition-all flex items-center justify-center gap-1.5"
                      >
                        <span>{especificacionesAbiertas ? 'Ver menos características' : 'Ver más características'}</span>
                        <ChevronDown
                          className={`w-3.5 h-3.5 text-[#7890AD] transition-transform duration-200 ${
                            especificacionesAbiertas ? 'rotate-180' : ''
                          }`}
                        />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* ===== COLUMNA DERECHA (7 COLUMNAS): COMPRA, PRECIO, VARIANTES Y BENEFICIOS ===== */}
          <div className="lg:col-span-7 space-y-5">
            <div className="bg-white rounded-[20px] border border-slate-200/80 p-6 sm:p-7 shadow-sm">
              <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-[600] text-[#10A36A] bg-[#10A36A]/10 border border-[#10A36A]/20 px-2.5 py-0.5 rounded-full">
                    🟢 {equipoActivo!.disponible ? 'Disponible inmediato' : 'Bajo Reserva'}
                  </span>
                  <span className="inline-flex items-center gap-1 text-[11px] font-[600] text-[#172D52] bg-[#F8FAFC] border border-[#E5EAF1] px-2.5 py-0.5 rounded-full">
                    🔵 {tipoLabel(equipoActivo!.tipo)}
                  </span>
                  <span className="inline-flex items-center gap-1 text-[11px] font-[600] text-[#7890AD] bg-[#F8FAFC] border border-[#E5EAF1] px-2.5 py-0.5 rounded-full">
                    📍 Sede {equipoActivo!.ubicacion || equipo.ubicacion}
                  </span>
                </div>
                {equipoActivo!.codigoInterno && (
                  <span className="text-[11px] font-[600] text-[#7890AD] bg-[#F8FAFC] border border-[#E5EAF1] px-2 py-0.5 rounded-md">
                    CÓD: {equipoActivo!.codigoInterno}
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

              {/* VARIANTES CON BUSCADOR DE MODELO O CÓDIGO */}
              {equipo.variantes && equipo.variantes.length > 0 && (
                <div className="mt-5 p-4 bg-slate-50 rounded-[18px] border border-slate-200/80 space-y-3 font-spartan">
                  <div className="flex items-center justify-between border-b border-slate-200/60 pb-2.5">
                    <span className="text-xs font-[800] uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                      <Layers className="w-4 h-4 text-[#E63C46]" />
                      Selecciona Variante / Modelo ({equipo.variantes.length} disponibles)
                    </span>
                    {filtroVariantesTexto && (
                      <button
                        onClick={() => setFiltroVariantesTexto('')}
                        className="text-[10px] font-[700] text-[#E63C46] hover:underline"
                      >
                        Limpiar búsqueda
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

                  {/* Contador y lista filtrada */}
                  <div className="flex items-center justify-between text-[11px] font-[700] text-slate-600 pt-1">
                    <span>→ {variantesFiltradas.length} variantes encontradas</span>
                    {varianteSeleccionada && (
                      <span className="text-[#E63C46]">Variante seleccionada activa</span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-64 overflow-y-auto pr-1">
                    {variantesFiltradas.map((v) => {
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
