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
  formatoPrecioMoneda,
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
  variantes?: EquipoBD[];
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
  const [selectedMarca, setSelectedMarca] = useState('TODAS');
  const [selectedAmperaje, setSelectedAmperaje] = useState('TODOS');
  const [selectedIP, setSelectedIP] = useState('TODOS');
  const [selectedEquipoModal, setSelectedEquipoModal] = useState<EquipoBD | null>(null);
  const [categorias, setCategorias] = useState<string[]>([]);
  const [marcas, setMarcas] = useState<string[]>([]);
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

  const marcasUnicas = Array.from(
    new Set(
      productos.map((p: any) => p.marca).filter(Boolean)
    )
  ).sort((a: any, b: any) => a.localeCompare(b, 'es'));

  // Aplicar filtros locales de Marca, Amperaje e IP
  const visibleProducts = productos.filter((p: any) => {
    if (selectedMarca !== 'TODAS' && p.marca !== selectedMarca) return false;
    if (selectedAmperaje !== 'TODOS') {
      const text = `${p.nombre} ${p.descripcion}`.toUpperCase();
      if (!text.includes(selectedAmperaje)) return false;
    }
    if (selectedIP !== 'TODOS') {
      const text = `${p.nombre} ${p.descripcion}`.toUpperCase();
      if (!text.includes(selectedIP)) return false;
    }
    return true;
  });

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

      {/* FILTROS Y PRODUCTOS EN LA MISMA FILA */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* PANEL DE FILTROS AVANZADOS - PEGADO TOTALMENTE A LA IZQUIERDA */}
        <div className="lg:col-span-3 bg-white p-5 rounded-[20px] border border-slate-200/80 shadow-sm space-y-5 lg:sticky lg:top-24 text-left w-full">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-spartan font-[800] text-sm text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <Search className="w-4 h-4 text-[#E63C46]" />
              Filtros Avanzados
            </h3>
            {(searchTerm || selectedCategoria !== 'TODAS' || selectedMarca !== 'TODAS' || selectedAmperaje !== 'TODOS' || selectedIP !== 'TODOS') && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setSelectedCategoria('TODAS');
                  setSelectedMarca('TODAS');
                  setSelectedAmperaje('TODOS');
                  setSelectedIP('TODOS');
                }}
                className="text-[10px] font-[700] text-[#E63C46] hover:underline"
              >
                Limpiar todo
              </button>
            )}
          </div>

          {/* Buscador general */}
          <div className="text-left">
            <label className="text-[11px] font-[700] uppercase tracking-wider text-slate-400 block mb-1.5 text-left">
              Buscar Producto / Código
            </label>
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Ej: 32A, IP67, 5SY4..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-[12px] text-xs font-[600] text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#162B4D] focus:bg-white transition-all text-left"
              />
            </div>
          </div>

          {/* Filtro Marca */}
          <div className="text-left">
            <label className="text-[11px] font-[700] uppercase tracking-wider text-slate-400 block mb-1.5 text-left">
              Marca / Fabricante
            </label>
            <select
              value={selectedMarca}
              onChange={(e) => setSelectedMarca(e.target.value)}
              className="w-full py-2.5 px-3 bg-slate-50 border border-slate-200 rounded-[12px] text-xs font-[600] text-slate-800 focus:outline-none focus:border-[#162B4D] transition-all cursor-pointer text-left"
            >
              <option value="TODAS">Todas las marcas ({marcasUnicas.length})</option>
              {marcasUnicas.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          {/* Filtro Categoría */}
          <div className="text-left">
            <label className="text-[11px] font-[700] uppercase tracking-wider text-slate-400 block mb-1.5 text-left">
              Categoría Técnica
            </label>
            <select
              value={selectedCategoria}
              onChange={(e) => setSelectedCategoria(e.target.value)}
              className="w-full py-2.5 px-3 bg-slate-50 border border-slate-200 rounded-[12px] text-xs font-[600] text-slate-800 focus:outline-none focus:border-[#162B4D] transition-all cursor-pointer text-left"
            >
              <option value="TODAS">Todas las categorías ({categoriasUnicas.length})</option>
              {categoriasUnicas.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Filtro Amperaje */}
          <div className="text-left">
            <label className="text-[11px] font-[700] uppercase tracking-wider text-slate-400 block mb-1.5 text-left">
              Capacidad de Corriente (Amperaje)
            </label>
            <div className="flex flex-wrap gap-1.5 justify-start">
              {['TODOS', '16A', '32A', '63A', '100A', '125A', '250A'].map((amp) => (
                <button
                  key={amp}
                  onClick={() => setSelectedAmperaje(amp)}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-[700] transition-all ${
                    selectedAmperaje === amp
                      ? 'bg-[#162B4D] text-white shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {amp}
                </button>
              ))}
            </div>
          </div>

          {/* Filtro Grado IP */}
          <div className="text-left">
            <label className="text-[11px] font-[700] uppercase tracking-wider text-slate-400 block mb-1.5 text-left">
              Protección Hermética IP
            </label>
            <div className="flex gap-2 justify-start">
              {['TODOS', 'IP44', 'IP67'].map((ip) => (
                <button
                  key={ip}
                  onClick={() => setSelectedIP(ip)}
                  className={`flex-1 py-1.5 rounded-lg text-[10px] font-[800] uppercase tracking-wider transition-all border ${
                    selectedIP === ip
                      ? 'bg-[#E63C46] border-[#E63C46] text-white shadow-sm'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {ip}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* CONTENEDOR PRINCIPAL DE RESULTADOS A LA DERECHA DE LOS FILTROS */}
        <div className="lg:col-span-9 space-y-6">

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
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 items-stretch">
          {visibleProducts.map((p) => (
            <div
              key={p.id}
              onClick={() => router.push(`/equipos/${p.id}`)}
              className="bg-white rounded-[20px] border border-slate-200/80 hover:border-slate-300 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col h-full overflow-hidden group cursor-pointer"
            >
              {/* Imagen del Producto con fallback si está rota */}
              <div className="relative h-48 bg-slate-100 overflow-hidden shrink-0 flex items-center justify-center">
                <img
                  src={imagenCompleta(p.imagenUrl)}
                  alt={p.nombre}
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
                    p.tipo
                  )}`}
                >
                  {tipoLabel(p.tipo)}
                </span>
                {p.variantes && p.variantes.length > 0 && (
                  <div className="absolute top-2.5 right-2.5 bg-[#162B4D]/90 backdrop-blur-md px-2 py-0.5 rounded-full text-[9px] font-[800] text-white flex items-center gap-1 shadow-sm">
                    <Layers className="w-3 h-3 text-[#E63C46]" />
                    <span>{p.variantes.length} modelos</span>
                  </div>
                )}
                <div className="absolute bottom-2.5 right-2.5 bg-white/90 backdrop-blur-md px-2 py-0.5 rounded-full text-[10px] font-[700] text-slate-700 flex items-center gap-1 shadow-sm">
                  <MapPin className="w-3 h-3 text-[#E63C46]" />
                  <span>{p.ubicacion}</span>
                </div>
              </div>

              {/* Info del Producto con altura uniforme */}
              <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                <div className="space-y-1">
                  <span className="text-[10px] font-[800] text-[#E63C46] uppercase tracking-wider block truncate">
                    {p.categoria}
                  </span>
                  <h3 className="font-spartan font-[700] text-[15px] text-slate-900 leading-snug tracking-tight line-clamp-2 min-h-[2.6rem] group-hover:text-[#162B4D] transition-colors">
                    {p.nombre}
                  </h3>
                  <p className="text-slate-500 text-[11px] line-clamp-2 leading-relaxed font-spartan font-[500] min-h-[2rem]">
                    {p.descripcion}
                  </p>
                </div>

                <div className="border-t border-slate-100 pt-3 flex items-center justify-between mt-auto" onClick={(e) => e.stopPropagation()}>
                  <div>
                    <span className="text-[10px] text-slate-400 font-[600] uppercase block">
                      {precioEtiquetaCorta(p.tipo)}
                    </span>
                    <div className="text-slate-900 font-spartan font-[800] text-xs sm:text-sm">
                      {formatoPrecioMoneda(p.precio, p.unidad)}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/equipos/${p.id}`);
                      }}
                      className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-all"
                      title="Ver Ficha Técnica"
                    >
                      <Eye className="w-3.5 h-3.5" />
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
                      className={`px-2.5 py-1.5 text-white rounded-lg text-[11px] font-[700] flex items-center gap-1 transition-all shadow-sm ${
                        addingId === p.id
                          ? 'bg-emerald-600 cursor-wait'
                          : tipo === 'ALQUILER'
                          ? 'bg-[#264772] hover:bg-[#1d385c]'
                          : 'bg-[#E63C46] hover:bg-[#C92A36]'
                      }`}
                    >
                      {addingId === p.id ? (
                        <span className="flex items-center gap-1">
                          <Loader2 className="w-3 h-3 animate-spin" />
                          <span>OK</span>
                        </span>
                      ) : (
                        <span className="flex items-center gap-1">
                          <ShoppingCart className="w-3 h-3" />
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
        </div>
      </div>

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
                  {formatoPrecioMoneda(
                    selectedEquipoModal.precio,
                    selectedEquipoModal.unidad,
                  )}
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
