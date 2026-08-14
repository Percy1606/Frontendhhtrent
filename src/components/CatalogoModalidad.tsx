'use client';
import React, { useState, useEffect } from 'react';
import {
  MapPin,
  Search,
  ShoppingCart,
  Eye,
  Layers,
  ArrowRight,
  Clock,
  BadgeDollarSign,
  Loader2,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { agregarAlCarrito } from '@/lib/cart';
import { imagenCompleta, API_URL } from '@/lib/api';
import {
  tipoLabel,
  tipoBadgeClass,
  precioEtiquetaCorta,
  ctaLabel,
  precioEtiqueta,
} from '@/lib/equipo';

interface EquipoBD {
  id: string;
  nombre: string;
  categoria: string;
  descripcion: string;
  precio: number | string | null;
  unidad?: string | null;
  ubicacion: string;
  tipo: 'ALQUILER' | 'VENTA' | 'PROYECTO';
  imagenUrl: string;
  disponible: boolean;
}

interface Props {
  tipo: 'ALQUILER' | 'VENTA';
  otroTipoLabel: string;
  otroTipoHref: string;
}

export default function CatalogoModalidad({ tipo, otroTipoLabel, otroTipoHref }: Props) {
  const [productos, setProductos] = useState<EquipoBD[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedTerm, setDebouncedTerm] = useState('');
  const [selectedCategoria, setSelectedCategoria] = useState('TODAS');
  const [selectedEquipoModal, setSelectedEquipoModal] = useState<EquipoBD | null>(null);
  const [categorias, setCategorias] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [addingId, setAddingId] = useState<string | null>(null);

  const router = useRouter();

  const PAGE_SIZE = 30;

  // Cargar categorías únicas para el filtro (servidor)
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API_URL}/equipos/categorias`);
        if (res.ok) {
          const cats = await res.json();
          if (Array.isArray(cats)) setCategorias(cats);
        }
      } catch {
        // Si falla, el filtro usa las categorías de los productos ya cargados
      }
    })();
  }, []);

  const fetchEquipos = async (busqueda = '', categoria = 'TODAS', pagina = 1) => {
    if (pagina === 1) setLoading(true);
    else setLoadingMore(true);
    try {
      const params = new URLSearchParams({ tipo });
      if (busqueda.trim()) params.set('busqueda', busqueda.trim());
      if (categoria && categoria !== 'TODAS') params.set('categoria', categoria);
      params.set('page', String(pagina));
      params.set('pageSize', String(PAGE_SIZE));
      const res = await fetch(`${API_URL}/equipos?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          // Compatibilidad: respuesta sin paginar
          setProductos((prev) => (pagina === 1 ? data : [...prev, ...data]));
          setHasMore(false);
          setLoading(false);
          setLoadingMore(false);
          return;
        }
        if (data && Array.isArray(data.items)) {
          setProductos((prev) => {
            if (pagina === 1) return data.items;
            const ids = new Set(prev.map((p) => p.id));
            return [...prev, ...data.items.filter((i: EquipoBD) => !ids.has(i.id))];
          });
          setHasMore(data.page < data.totalPages);
          setLoading(false);
          setLoadingMore(false);
          return;
        }
      }
    } catch {
      console.warn('Backend API no disponible aún');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedTerm(searchTerm);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    setPage(1);
    fetchEquipos(debouncedTerm, selectedCategoria, 1);
  }, [debouncedTerm, tipo, selectedCategoria]);

  const categoriasUnicas = Array.from(
    new Set(
      (categorias.length > 0
        ? categorias
        : productos.map((p) => p.categoria)
      ).filter(Boolean)
    )
  ).sort((a, b) => a.localeCompare(b, 'es'));

  // Con paginación en el servidor, lo visible es lo ya cargado
  const filteredProducts = productos;
  const visibleProducts = productos;

  const cargarMas = () => {
    const sig = page + 1;
    setPage(sig);
    fetchEquipos(debouncedTerm, selectedCategoria, sig);
  };

  return (
    <div className="space-y-6">
      {/* AVISO CAMBIO DE MODALIDAD */}
      <div
        className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-[20px] border shadow-sm ${
          tipo === 'ALQUILER'
            ? 'bg-[#264772]/5 border-[#264772]/20'
            : 'bg-[#E63C46]/5 border-[#E63C46]/20'
        }`}
      >
        <div className="flex items-center gap-3">
          {tipo === 'ALQUILER' ? (
            <Clock className="w-8 h-8 text-[#264772] shrink-0" />
          ) : (
            <BadgeDollarSign className="w-8 h-8 text-[#E63C46] shrink-0" />
          )}
          <div>
            <p className="text-xs font-[800] uppercase tracking-wider text-slate-800">
              {tipo === 'ALQUILER'
                ? '¿Necesitas el equipo por un tiempo definido?'
                : '¿Prefieres adquirir el equipo de forma definitiva?'}
            </p>
            <p className="text-[11px] text-slate-500 font-[500] mt-0.5">
              {tipo === 'ALQUILER'
                ? 'En esta sección solo se muestran equipos disponibles para renta con tarifa mensual.'
                : 'En esta sección solo se muestran equipos disponibles para venta directa.'}
            </p>
          </div>
        </div>
        <Link
          href={otroTipoHref}
          className={`shrink-0 inline-flex items-center gap-2 px-5 py-3 rounded-[14px] text-xs font-[800] uppercase tracking-wider text-white transition-all shadow-md ${
            tipo === 'ALQUILER'
              ? 'bg-[#E63C46] hover:bg-[#C92A36] shadow-[#E63C46]/25'
              : 'bg-[#264772] hover:bg-[#1d385c] shadow-[#264772]/25'
          }`}
        >
          <span>Ver {otroTipoLabel}</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {/* FILTROS */}
      <div className="bg-white p-4 sm:p-5 rounded-[20px] border border-slate-200/80 shadow-sm grid grid-cols-1 md:grid-cols-3 gap-3 items-center">
        <div className="relative md:col-span-2">
          <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder={`Buscar equipos en ${tipo === 'ALQUILER' ? 'renta' : 'venta'} (equipo, marca, código...)`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-[14px] text-xs font-[600] text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#162B4D] focus:bg-white transition-all"
          />
        </div>
        <div>
          <select
            value={selectedCategoria}
            onChange={(e) => setSelectedCategoria(e.target.value)}
            className="w-full py-3 px-4 bg-slate-50 border border-slate-200 rounded-[14px] text-xs font-[600] text-slate-800 focus:outline-none focus:border-[#162B4D] transition-all cursor-pointer"
          >
            <option value="TODAS">Categoría: Todas ({categoriasUnicas.length})</option>
            {categoriasUnicas.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* GRILLA */}
      {loading ? (
        <div className="py-20 text-center space-y-4">
          <div className="w-10 h-10 border-4 border-[#162B4D] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-slate-500 font-[600] text-sm">Cargando equipos disponibles...</p>
        </div>
      ) : visibleProducts.length === 0 ? (
        <div className="py-20 bg-white rounded-[24px] border border-slate-200 text-center p-8">
          <Layers className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-lg font-[800] text-slate-800">No hay equipos {tipo === 'ALQUILER' ? 'en renta' : 'en venta'}</h3>
          <p className="text-slate-500 text-xs mt-1">
            Por ahora no tenemos equipos disponibles en esta modalidad. Consulte el catálogo general o cotice por WhatsApp.
          </p>
          <div className="flex flex-wrap justify-center gap-3 mt-5">
            <Link
              href="/equipos"
              className="px-4 py-2 bg-[#162B4D] text-white text-xs font-[700] rounded-xl hover:bg-[#10203B] transition-all"
            >
              Ver catálogo completo
            </Link>
            <Link
              href={otroTipoHref}
              className="px-4 py-2 bg-white border border-slate-200 text-slate-700 text-xs font-[700] rounded-xl hover:border-slate-400 transition-all"
            >
              Ver {otroTipoLabel}
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {visibleProducts.map((p) => (
            <div
              key={p.id}
              onClick={() => router.push(`/equipos/${p.id}`)}
              className="bg-white rounded-[20px] border border-slate-200/80 hover:border-slate-300 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col overflow-hidden group cursor-pointer"
            >
              <div className="relative h-52 bg-slate-100 overflow-hidden">
                <img
                  src={imagenCompleta(p.imagenUrl)}
                  alt={p.nombre}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <span
                  className={`absolute top-3 left-3 text-[10px] font-[800] px-2.5 py-1 rounded-full uppercase tracking-wider shadow-sm text-white ${tipoBadgeClass(
                    p.tipo
                  )}`}
                >
                  {tipoLabel(p.tipo)}
                </span>
                <div className="absolute bottom-3 right-3 bg-white/90 backdrop-blur-md px-2.5 py-1 rounded-full text-[11px] font-[700] text-slate-700 flex items-center gap-1 shadow-sm">
                  <MapPin className="w-3 h-3 text-[#E63C46]" />
                  <span>{p.ubicacion}</span>
                </div>
              </div>

              <div className="p-5 flex-1 flex flex-col justify-between">
                <div>
                  <span className="text-[11px] font-[700] text-[#E63C46] uppercase tracking-wider block mb-1">
                    {p.categoria}
                  </span>
                  <h3 className="font-spartan font-[700] text-[17px] text-slate-900 leading-snug tracking-tight line-clamp-2 mb-2 group-hover:text-[#162B4D] transition-colors">
                    {p.nombre}
                  </h3>
                  <p className="text-slate-500 text-xs line-clamp-3 leading-relaxed mb-4 font-spartan font-[500]">
                    {p.descripcion}
                  </p>
                </div>

                <div className="border-t border-slate-100 pt-4 flex items-center justify-between mt-auto" onClick={(e) => e.stopPropagation()}>
                  <div>
                    <span className="text-[11px] text-slate-400 font-[600] uppercase block">
                      {precioEtiquetaCorta(p.tipo)}
                    </span>
                    <div className="text-slate-900 font-spartan font-[700] text-sm">
                      {p.precio !== null && p.precio !== undefined ? (
                        <>
                          S/ {Number(p.precio).toLocaleString('es-PE')}{' '}
                          <span className="text-[10px] text-slate-400 font-[600]">{p.unidad || ''}</span>
                        </>
                      ) : (
                        'Bajo Cotización'
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/equipos/${p.id}`);
                      }}
                      className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-all"
                      title="Ver características y ficha técnica"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      disabled={addingId === p.id}
                      onClick={() => {
                        setAddingId(p.id);
                        agregarAlCarrito({
                          id: p.id,
                          nombre: p.nombre,
                          descripcion: p.descripcion,
                          ubicacion: p.ubicacion,
                          precio: p.precio,
                          tipo: p.tipo,
                          unidad: p.unidad || undefined,
                          imagenUrl: p.imagenUrl,
                        });
                        window.dispatchEvent(
                          new CustomEvent('cart-updated', {
                            detail: { addedItem: { nombre: p.nombre, imagenUrl: p.imagenUrl } },
                          })
                        );
                        setTimeout(() => {
                          setAddingId(null);
                        }, 1000);
                      }}
                      className={`px-3 py-2 text-white rounded-xl text-xs font-[700] flex items-center gap-1.5 transition-all shadow-sm ${
                        addingId === p.id
                          ? 'bg-emerald-600 cursor-wait'
                          : tipo === 'ALQUILER'
                          ? 'bg-[#264772] hover:bg-[#1d385c]'
                          : 'bg-[#E63C46] hover:bg-[#C92A36]'
                      }`}
                    >
                      {addingId === p.id ? (
                        <span className="flex items-center gap-1.5">
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Añadiendo...</span>
                        </span>
                      ) : (
                        <span className="flex items-center gap-1.5">
                          <ShoppingCart className="w-3.5 h-3.5" />
                          <span>{ctaLabel(p.tipo)}</span>
                        </span>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CARGAR MÁS */}
      {hasMore && (
        <div className="mt-10 text-center">
          <button
            onClick={cargarMas}
            disabled={loadingMore}
            className="px-8 py-4 bg-[#264772] hover:bg-[#1d385c] text-white font-[700] text-sm rounded-[16px] shadow-lg shadow-[#264772]/20 transition-all hover:scale-105 inline-flex items-center gap-2 disabled:opacity-60 disabled:hover:scale-100"
          >
            {loadingMore ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <ArrowRight className="w-4 h-4" />
            )}
            <span>{loadingMore ? 'Cargando...' : 'Cargar más equipos'}</span>
          </button>
        </div>
      )}

      {/* MODAL DETALLE */}
      {selectedEquipoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-[24px] max-w-xl w-full p-6 sm:p-8 shadow-2xl relative border border-slate-100 space-y-6">
            <button
              onClick={() => setSelectedEquipoModal(null)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 font-[800] transition-colors"
            >
              ✕
            </button>

            <div className="flex gap-4 items-start border-b border-slate-100 pb-4">
              <img
                src={imagenCompleta(selectedEquipoModal.imagenUrl)}
                alt={selectedEquipoModal.nombre}
                className="w-24 h-24 rounded-2xl object-cover border border-slate-200"
              />
              <div>
                <span className="text-xs font-[800] text-[#E63C46] uppercase tracking-wider block">
                  {selectedEquipoModal.categoria}
                </span>
                <h3 className="font-spartan font-[700] text-lg text-slate-900 leading-snug tracking-tight">
                  {selectedEquipoModal.nombre}
                </h3>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-100 font-[700] text-slate-700">
                    Sede: {selectedEquipoModal.ubicacion}
                  </span>
                  <span
                    className={`text-xs px-2.5 py-0.5 rounded-full text-white font-[700] ${tipoBadgeClass(
                      selectedEquipoModal.tipo
                    )}`}
                  >
                    {tipoLabel(selectedEquipoModal.tipo)}
                  </span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-xs font-[800] uppercase text-slate-400 tracking-wider mb-2">
                Descripción Técnica
              </h4>
              <p className="text-slate-600 text-sm leading-relaxed">
                {selectedEquipoModal.descripcion}
              </p>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 flex items-center justify-between">
              <div>
                <span className="text-[11px] uppercase font-[700] text-slate-400 block">
                  {precioEtiqueta(selectedEquipoModal.tipo)}
                </span>
                <span className="text-xl font-[800] text-slate-900">
                  {selectedEquipoModal.precio !== null && selectedEquipoModal.precio !== undefined
                    ? `S/ ${Number(selectedEquipoModal.precio).toLocaleString('es-PE')} ${selectedEquipoModal.unidad || ''}`
                    : 'Cotización Personalizada'}
                </span>
              </div>

              <Link
                href="/cotizacion"
                className="px-5 py-3 bg-[#E63C46] hover:bg-[#C92A36] text-white text-xs font-[800] rounded-xl shadow-lg shadow-[#E63C46]/20 transition-all flex items-center gap-2"
              >
                <ShoppingCart className="w-4 h-4" />
                <span>Solicitar Cotización</span>
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Fallback estático (misma base de datos de ejemplo del catálogo)
const FALLBACK_MODALIDAD: EquipoBD[] = [
  {
    id: '7',
    nombre: 'LS Electric Variador de Frecuencia G100 15HP / 11kW',
    categoria: 'Arranque Electrónico de Motores',
    descripcion: 'Inversor/Variador de velocidad vectorial LS G100 trifásico 380-480V 15HP. Ideal para bombas, ventiladores e industrias de procesamiento.',
    precio: 3450,
    unidad: '/ mes',
    ubicacion: 'Piura',
    tipo: 'ALQUILER',
    imagenUrl: 'https://images.unsplash.com/photo-1581092335397-9583fe92d232?q=80&w=800',
    disponible: true,
  },
  {
    id: '13',
    nombre: 'Lithonia Lighting Luminaria Hermética LED HighBay 150W IP65',
    categoria: 'Iluminación Industrial',
    descripcion: 'Luminaria industrial hermética de gran altura (HighBay) 150W 20,000 lúmenes 5000K, chasis de aluminio para ambientes exigentes.',
    precio: 780,
    unidad: '/ mes',
    ubicacion: 'Piura',
    tipo: 'ALQUILER',
    imagenUrl: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?q=80&w=800',
    disponible: true,
  },
  {
    id: '14',
    nombre: 'Generador Eléctrico Diesel 50kVA - Trifásico',
    categoria: 'Generadores',
    descripcion: 'Generador diésel insonorizado 50kVA trifásico 220V/440V. Equipos certificados con mantenimientos rigurosos para minería e industria.',
    precio: 4500,
    unidad: '/ mes',
    ubicacion: 'Piura',
    tipo: 'ALQUILER',
    imagenUrl: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?q=80&w=800',
    disponible: true,
  },
  {
    id: '17',
    nombre: 'Subestación Móvil Compacta 10kV / 0.44kV',
    categoria: 'Subestaciones',
    descripcion: 'Subestación eléctrica móvil sobre remolque compacta 10kV a 0.44kV equipada con celdas de protección y medición.',
    precio: 8200,
    unidad: '/ mes',
    ubicacion: 'Piura',
    tipo: 'ALQUILER',
    imagenUrl: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?q=80&w=800',
    disponible: true,
  },
  {
    id: '1',
    nombre: 'Ormazabal Celda Modular GIS cgmcosmos 24kV',
    categoria: 'Celdas Modulares GIS / Media Tensión',
    descripcion: 'Celda de media tensión aislada en gas SF6 herméticamente sellada. Modelo cgmcosmos 24kV con enclavamientos mecánicos y resistencia al arco interno (IEC 62271-200).',
    precio: 15500,
    ubicacion: 'Piura',
    tipo: 'VENTA',
    imagenUrl: 'https://images.unsplash.com/photo-1581092335397-9583fe92d232?q=80&w=800',
    disponible: true,
  },
  {
    id: '3',
    nombre: 'TMC Sudamerica Transformador Seco 1000kVA 20kV',
    categoria: 'Transformadores Secos',
    descripcion: 'Transformador seco encapsulado en resina epoxi TMC de 1000kVA, 20kV/22.9kV a 440V. Alta resistencia al fuego (Clase F1) y bajas pérdidas operativas.',
    precio: 28500,
    ubicacion: 'Piura',
    tipo: 'VENTA',
    imagenUrl: 'https://images.unsplash.com/photo-1581092162384-8987c1d64718?q=80&w=800',
    disponible: true,
  },
  {
    id: '4',
    nombre: 'Euromold Conector Hermético T-Body 480TB 630A 24kV',
    categoria: 'Conectores y Terminaciones MT',
    descripcion: 'Conector separable estanco 3xK480TB/G-02195TBAi para cables de media tensión hasta 24kV 630A. Aislamiento premoldeado en EPDM.',
    precio: 850,
    ubicacion: 'Piura',
    tipo: 'VENTA',
    imagenUrl: 'https://images.unsplash.com/photo-1581092334651-ddf26d9a09d0?q=80&w=800',
    disponible: true,
  },
  {
    id: '5',
    nombre: 'Euromold Terminación Termocontraíble MONOi 24kV',
    categoria: 'Conectores y Terminaciones MT',
    descripcion: 'Terminación termocontraíble para uso interior 3x24MONOi1.95Ai. Alta resistencia dieléctrica y facilidad de montaje para cables subterráneos.',
    precio: 420,
    ubicacion: 'Piura',
    tipo: 'VENTA',
    imagenUrl: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?q=80&w=800',
    disponible: true,
  },
  {
    id: '6',
    nombre: 'LS Electric Interruptor en Aire Metasol ACB 1600A',
    categoria: 'Protección Eléctrica Baja Tensión',
    descripcion: 'Interruptor de potencia en aire (ACB) LS Metasol trifásico de 1600A con unidad de protección electrónica y alta capacidad de ruptura en cortocircuito.',
    precio: 9800,
    ubicacion: 'Piura',
    tipo: 'VENTA',
    imagenUrl: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?q=80&w=800',
    disponible: true,
  },
  {
    id: '8',
    nombre: 'Siemens Arrancador Suave 3RW44 75kW 400V',
    categoria: 'Arranque Electrónico de Motores',
    descripcion: 'Arrancador suave inteligente Siemens Sirius 3RW44 con control trifásico, bypass integrado y protección térmica avanzada para motores pesados.',
    precio: 5200,
    ubicacion: 'Piura',
    tipo: 'VENTA',
    imagenUrl: 'https://images.unsplash.com/photo-1504148455328-c376907d081c?q=80&w=800',
    disponible: true,
  },
  {
    id: '9',
    nombre: 'Phoenix Contact Fuente de Alimentación QUINT POWER 24VDC 20A',
    categoria: 'Automatización y Control',
    descripcion: 'Fuente de alimentación conmutada industrial de alta confiabilidad 24V DC / 20A para riel DIN, con tecnología SFB y monitoreo preventivo.',
    precio: 1150,
    ubicacion: 'Piura',
    tipo: 'VENTA',
    imagenUrl: 'https://images.unsplash.com/photo-1544724569-5f546fd6f2b5?q=80&w=800',
    disponible: true,
  },
  {
    id: '10',
    nombre: 'Lovato Electric PLC / Relé Programable KINCO 20I/O RS485',
    categoria: 'Automatización y Control',
    descripcion: 'Controlador lógico programable compacto con pantalla LCD integrada, 12 entradas digitales y 8 salidas relé, soporte para protocolo Modbus RS485.',
    precio: 980,
    ubicacion: 'Piura',
    tipo: 'VENTA',
    imagenUrl: 'https://images.unsplash.com/photo-1581092580497-e0d23cbdf1dc?q=80&w=800',
    disponible: true,
  },
  {
    id: '11',
    nombre: 'Erico GEM Cemento Conductivo Puesta a Tierra (Saco 25kg)',
    categoria: 'Sistemas Puesta a Tierra',
    descripcion: 'Material intensificador de tierra Ground Enhancement Material (GEM) de alta conductividad para reducir la resistencia de pozos a tierra.',
    precio: 165,
    ubicacion: 'Piura',
    tipo: 'VENTA',
    imagenUrl: 'https://images.unsplash.com/photo-1581092162384-8987c1d64718?q=80&w=800',
    disponible: true,
  },
  {
    id: '12',
    nombre: 'Crouse-Hinds Caja Botonera a Prueba de Explosión NEMA 7/9',
    categoria: 'Sistemas a Prueba de Explosión',
    descripcion: 'Estación de pulsadores heavy duty de aluminio libre de cobre a prueba de explosiones para áreas clasificadas Clase I Div 1 & 2.',
    precio: 2100,
    ubicacion: 'Piura',
    tipo: 'VENTA',
    imagenUrl: 'https://images.unsplash.com/photo-1581092334651-ddf26d9a09d0?q=80&w=800',
    disponible: true,
  },
  {
    id: '15',
    nombre: 'Taladro Percutor Industrial Heavy Duty 1200W',
    categoria: 'Taladros',
    descripcion: 'Taladro percutor de alta potencia 1200W para trabajo pesado en concreto y estructuras metálicas. Incluye empuñadura antivibración.',
    precio: 1250,
    ubicacion: 'Piura',
    tipo: 'VENTA',
    imagenUrl: 'https://images.unsplash.com/photo-1504148455328-c376907d081c?q=80&w=800',
    disponible: true,
  },
];
