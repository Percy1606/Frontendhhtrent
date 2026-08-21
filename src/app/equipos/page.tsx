'use client';
import Image from 'next/image';
import React, { useState, useEffect } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import WhatsappWidget from '@/components/WhatsappWidget';
import {
  MapPin,
  Search,
  ShoppingCart,
  Eye,
  FileText,
  Download,
  Filter,
  Layers,
  Sparkles,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  PhoneCall,
  Image as ImageIcon,
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
  precioEtiqueta,
  ctaLabel,
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

const norm = (s: any) => (s || '').toString().normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
export default function EquiposPage() {
  const [productos, setProductos] = useState<EquipoBD[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedTerm, setDebouncedTerm] = useState('');
  const [selectedCategoria, setSelectedCategoria] = useState('TODAS');
  const [selectedTipo, setSelectedTipo] = useState('TODOS');
  const [selectedMarca, setSelectedMarca] = useState('TODAS');
  const [selectedAmperaje, setSelectedAmperaje] = useState('TODOS');
  const [selectedIP, setSelectedIP] = useState('TODOS');
  const [selectedEquipoModal, setSelectedEquipoModal] = useState<EquipoBD | null>(null);
  const [categorias, setCategorias] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

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

  const fetchEquipos = async (busqueda = '', tipo = 'TODOS', categoria = 'TODAS', pagina = 1) => {
    if (pagina === 1) setLoading(true);
    else setLoadingMore(true);
    try {
      const params = new URLSearchParams();
      if (busqueda.trim()) params.set('busqueda', busqueda.trim());
      if (tipo && tipo !== 'TODOS') params.set('tipo', tipo);
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
    } catch (err) {
      console.warn('Backend API no disponible aún o vacía, usando fallback');
    }

    // Fallback local solo si el backend no responde (solo en la primera página)
    if (pagina === 1) {
      let fb = DEFAULT_EQUIPOS;
      if (busqueda.trim()) {
        const q = norm(busqueda.trim());
        fb = fb.filter(
          (p) =>
            norm(p.nombre).includes(q) ||
            p.descripcion.toLowerCase().includes(q) ||
            p.categoria.toLowerCase().includes(q)
        );
      }
      if (tipo && tipo !== 'TODOS') {
        fb = fb.filter((p) => p.tipo === tipo);
      }
      if (categoria && categoria !== 'TODAS') {
        fb = fb.filter((p) => p.categoria === categoria);
      }
      setProductos(fb);
      setHasMore(false);
    }
    setLoading(false);
    setLoadingMore(false);
  };

  // Debounce: espera 400ms desde la última tecla antes de consultar al servidor
  useEffect(() => {
    const t = setTimeout(() => setDebouncedTerm(searchTerm), 400);
    return () => clearTimeout(t);
  }, [searchTerm]);

  useEffect(() => {
    setPage(1);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- cargar catálogo según filtros al montar/cambiar
    fetchEquipos(debouncedTerm, selectedTipo, selectedCategoria, 1);
  }, [debouncedTerm, selectedTipo, selectedCategoria]);

  const categoriasUnicas = Array.from(
    new Set(categorias.length > 0 ? categorias : productos.map((p) => p.categoria))
  ).sort((a, b) => a.localeCompare(b, 'es'));

  const marcasUnicas = Array.from(
    new Set(productos.map((p: any) => p.marca).filter(Boolean))
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

  const filteredProducts = visibleProducts;

  const cargarMas = () => {
    const sig = page + 1;
    setPage(sig);
    fetchEquipos(debouncedTerm, selectedTipo, selectedCategoria, sig);
  };

  return (
    <main className="min-h-screen bg-[#f8fafc] font-poppins text-slate-900">
      <Header />

      {/* HEADER DE LA PÁGINA */}
      <section className="bg-gradient-to-r from-[#162B4D] via-[#1E3A66] to-[#162B4D] pt-24 pb-6 text-white relative overflow-hidden flex items-center justify-center">
        <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-12 relative z-10">
          <div className="relative flex flex-col md:flex-row items-center justify-center min-h-[44px] gap-3">
            <Link
              href="/#catalogo"
              className="md:absolute md:left-0 inline-flex items-center gap-1.5 text-xs font-[700] text-slate-300 hover:text-white bg-white/10 hover:bg-white/20 px-3 py-1 rounded-full backdrop-blur-sm transition-all"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Volver al Inicio</span>
            </Link>

            <h1 className="text-xl sm:text-2xl lg:text-3xl font-[800] font-spartan tracking-tight text-white uppercase leading-tight text-center my-auto">
              Todos los Equipos Industriales
            </h1>

            <a
              href="/Catalogos_Soluciones_MT_2026.pdf"
              target="_blank"
              rel="noopener noreferrer"
              className="md:absolute md:right-0 px-3.5 py-1.5 bg-[#E63C46] hover:bg-[#C92A36] text-white rounded-lg text-xs font-[700] flex items-center gap-1.5 transition-all shadow-sm"
            >
              <FileText className="w-4 h-4" />
              <span>Descargar PDF 2026</span>
              <Download className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </section>

      {/* CONTENIDO PRINCIPAL Y FILTROS */}
      <section className="py-6 w-full px-4 sm:px-6 lg:px-8">
        {/* CONTENEDOR PRINCIPAL CON SIDEBAR A LA IZQUIERDA */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* SIDEBAR DE FILTROS A LA IZQUIERDA */}
          <div className="lg:col-span-3 bg-white p-5 rounded-[20px] border border-slate-200/80 shadow-sm space-y-5 lg:sticky lg:top-24 text-left">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-spartan font-[800] text-sm text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <Filter className="w-4 h-4 text-[#E63C46]" />
                Filtros Avanzados
              </h3>
              {(searchTerm || selectedCategoria !== 'TODAS' || selectedTipo !== 'TODOS' || selectedMarca !== 'TODAS' || selectedAmperaje !== 'TODOS' || selectedIP !== 'TODOS') && (
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setSelectedCategoria('TODAS');
                    setSelectedTipo('TODOS');
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

            {/* Modalidad */}
            <div className="text-left">
              <label className="text-[11px] font-[700] uppercase tracking-wider text-slate-400 block mb-1.5 text-left">
                Modalidad
              </label>
              <select
                value={selectedTipo}
                onChange={(e) => setSelectedTipo(e.target.value)}
                className="w-full py-2.5 px-3 bg-slate-50 border border-slate-200 rounded-[12px] text-xs font-[600] text-slate-800 focus:outline-none focus:border-[#162B4D] transition-all cursor-pointer text-left"
              >
                <option value="TODOS">Todas las modalidades</option>
                <option value="ALQUILER">Solo Alquiler / Rentas</option>
                <option value="VENTA">Solo Venta</option>
                <option value="PROYECTO">Llave en Mano</option>
              </select>
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
                Amperaje
              </label>
              <div className="flex flex-wrap gap-1.5 justify-start">
                {['TODOS', '16A', '32A', '63A', '100A', '125A', '250A'].map((amp) => (
                  <button
                    key={amp}
                    onClick={() => setSelectedAmperaje(amp)}
                    className={`px-2 py-1 rounded-lg text-[10px] font-[700] transition-all ${
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

          {/* DERECHA: RESULTADOS */}
          <div className="lg:col-span-9 space-y-6">

        {/* GRILLA DE PRODUCTOS */}
        {loading ? (
          <div className="py-20 text-center space-y-4">
            <div className="w-10 h-10 border-4 border-[#162B4D] border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-slate-500 font-[600] text-sm">Cargando equipos del inventario...</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="py-20 bg-white rounded-[24px] border border-slate-200 text-center p-8">
            <Filter className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-lg font-[800] text-slate-800">No se encontraron equipos</h3>
            <p className="text-slate-500 text-xs mt-1">Pruebe ajustando los filtros de búsqueda o categoría.</p>
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedCategoria('TODAS');
                setSelectedTipo('TODOS');
              }}
              className="mt-4 px-4 py-2 bg-[#162B4D] text-white text-xs font-[700] rounded-xl hover:bg-[#10203B] transition-all"
            >
              Limpiar Filtros
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 items-stretch">
            {visibleProducts.map((p) => {
              const urlCatalogo = p.imagenUrl && p.imagenUrl.trim() !== ''
                ? p.imagenUrl
                : (p.variantes && p.variantes.find(v => v.imagenUrl && v.imagenUrl.trim() !== '')?.imagenUrl) || '';

              return (
                <div
                  key={p.id}
                  onClick={() => router.push(`/equipos/${p.id}`)}
                  className="bg-white rounded-[20px] border border-slate-200/80 hover:border-slate-300 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col h-full overflow-hidden group cursor-pointer"
                >
                  {/* Imagen del Producto con encuadre de estudio perfecto */}
                  <div className="relative h-52 bg-slate-50 border-b border-slate-100 overflow-hidden shrink-0 flex items-center justify-center p-3">
                    <Image src={imagenCompleta(urlCatalogo)}
                      alt={p.nombre}
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      className="object-contain p-2 group-hover:scale-105 transition-transform duration-300 drop-shadow-xs"
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
                        onClick={() => {
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
                              detail: {
                                addedItem: { nombre: p.nombre, imagenUrl: p.imagenUrl },
                              },
                            })
                          );
                          router.push(`/equipos/${p.id}`);
                        }}
                        className="px-2.5 py-1.5 bg-[#162B4D] hover:bg-[#E63C46] text-white rounded-lg text-[11px] font-[700] flex items-center gap-1 transition-all shadow-sm"
                      >
                        <ShoppingCart className="w-3 h-3" />
                        <span>{ctaLabel(p.tipo)}</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
          </div>
        )}

        {/* BOTÓN INFERIOR CARGAR MÁS (de 30 en 30) */}
        {hasMore && (
          <div className="mt-12 text-center">
            <button
              onClick={cargarMas}
              disabled={loadingMore}
              className="px-8 py-4 bg-[#162B4D] hover:bg-[#233A61] text-white font-[700] text-sm rounded-[16px] shadow-lg shadow-[#162B4D]/20 transition-all hover:scale-105 inline-flex items-center gap-2 disabled:opacity-60 disabled:hover:scale-100"
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
      </section>

      {/* MODAL DETALLE DEL EQUIPO */}
      {selectedEquipoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-[24px] max-w-xl w-full p-6 sm:p-8 shadow-2xl relative border border-slate-100 space-y-6">
            <button
              onClick={() => setSelectedEquipoModal(null)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 font-[800] transition-colors"
            >
              ✕
            </button>

            <div className="flex gap-4 items-start border-b border-slate-100 pb-4">
              <img loading="lazy" decoding="async" src={imagenCompleta(selectedEquipoModal.imagenUrl)}
                alt={selectedEquipoModal.nombre}
                className="w-24 h-24 rounded-2xl object-cover border border-slate-200"
              />
              <div>
                <span className="text-[11px] font-[800] text-[#E63C46] uppercase tracking-wider block">
                  {selectedEquipoModal.categoria}
                </span>
                <h3 className="font-spartan font-[700] text-lg text-slate-900 leading-snug tracking-tight">
                  {selectedEquipoModal.nombre}
                </h3>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-100 font-[700] text-slate-700">
                    Sede: {selectedEquipoModal.ubicacion}
                  </span>
                  <span className={`text-xs px-2.5 py-0.5 rounded-full text-white font-[700] ${tipoBadgeClass(
                    selectedEquipoModal.tipo
                  )}`}>
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
                  {selectedEquipoModal.precio !== null
                    ? `S/ ${Number(selectedEquipoModal.precio).toLocaleString('es-PE')} ${selectedEquipoModal.unidad || ''}`
                    : 'Cotización Personalizada'}
                </span>
              </div>

              <Link
                href="/cotizacion"
                className="px-5 py-3 bg-[#E63C46] hover:bg-[#C92A36] text-white text-xs font-[800] rounded-xl shadow-lg shadow-[#E63C46]/20 transition-all flex items-center gap-2"
              >
                <ShoppingCart className="w-4 h-4" />
                <span>Agregar a Cotización</span>
              </Link>
            </div>
          </div>
        </div>
      )}

      <Footer />
      <WhatsappWidget />
    </main>
  );
}

const DEFAULT_EQUIPOS: EquipoBD[] = [
  {
    id: '1',
    nombre: 'Celda de Media Tensión SM6 Schneider Electric 24kV',
    categoria: 'Subestaciones y Media Tensión',
    descripcion: 'Celda modular de protección con interruptor en SF6 SM6-24kV. Ideal para subestaciones de transformación de plantas industriales y proyectos de distribución.',
    precio: 14500,
    ubicacion: 'Piura',
    tipo: 'VENTA',
    imagenUrl: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?q=80&w=800',
    disponible: true,
  },
  {
    id: '2',
    nombre: 'Transformador Seco encapsulado en Resina 1000 kVA 22.9/0.44kV',
    categoria: 'Subestaciones y Media Tensión',
    descripcion: 'Transformador seco ecológico de alta eficiencia y clase de aislamiento F. Autoextinguible, óptimo para edificios comerciales e industria pesada.',
    precio: 3200,
    unidad: '/ mes',
    ubicacion: 'Piura',
    tipo: 'ALQUILER',
    imagenUrl: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?q=80&w=800',
    disponible: true,
  },
  {
    id: '3',
    nombre: 'Interruptor en Vacío VD4 ABB 17.5kV 1250A 31.5kA',
    categoria: 'Equipamiento de Protección MT',
    descripcion: 'Interruptor de potencia para media tensión para montaje extraíble o fijo. Elevado número de maniobras mecánicas y eléctricas.',
    precio: 8900,
    ubicacion: 'Piura',
    tipo: 'VENTA',
    imagenUrl: 'https://images.unsplash.com/photo-1504148455328-c376907d081c?q=80&w=800',
    disponible: true,
  },
  {
    id: '4',
    nombre: 'Generador Eléctrico Diesel Caterpillar 500kVA Insonorizado',
    categoria: 'Generadores y Potencia',
    descripcion: 'Grupo electrógeno cabinado insonorizado 500 kVA / 400 kW trifásico 220V/440V. Motor Cat C15 confiable para respaldo crítico continuo.',
    precio: 6500,
    unidad: '/ mes',
    ubicacion: 'Piura',
    tipo: 'ALQUILER',
    imagenUrl: 'https://images.unsplash.com/photo-1544724569-5f546fd6f2b5?q=80&w=800',
    disponible: true,
  },
  {
    id: '5',
    nombre: 'Raychem Kit de Terminación Contraíble en Frío 24kV 3x120mm²',
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
    categoria: 'Generadores y Potencia',
    descripcion: 'Generador diésel insonorizado 50kVA trifásico 220V/440V. Equipos certificados con mantenimientos rigurosos para minería e industria.',
    precio: 4500,
    unidad: '/ mes',
    ubicacion: 'Piura',
    tipo: 'ALQUILER',
    imagenUrl: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?q=80&w=800',
    disponible: true,
  },
  {
    id: '15',
    nombre: 'Taladro Percutor Industrial Heavy Duty 1200W',
    categoria: 'Herramientas Eléctricas',
    descripcion: 'Taladro percutor de alta potencia 1200W para trabajo pesado en concreto y estructuras metálicas. Incluye empuñadura antivibración.',
    precio: 1250,
    ubicacion: 'Piura',
    tipo: 'VENTA',
    imagenUrl: 'https://images.unsplash.com/photo-1504148455328-c376907d081c?q=80&w=800',
    disponible: true,
  },
  {
    id: '16',
    nombre: 'Transformador de Media Tensión 500kVA',
    categoria: 'Subestaciones y Media Tensión',
    descripcion: 'Transformador de distribución 500kVA 22.9kV / 0.44kV para subestaciones industriales y mineras. Fabricación bajo norma IEC.',
    precio: null,
    ubicacion: 'Piura',
    tipo: 'PROYECTO',
    imagenUrl: 'https://images.unsplash.com/photo-1544724569-5f546fd6f2b5?q=80&w=800',
    disponible: true,
  },
  {
    id: '17',
    nombre: 'Subestación Móvil Compacta 10kV / 0.44kV',
    categoria: 'Subestaciones y Media Tensión',
    descripcion: 'Subestación eléctrica móvil sobre remolque compacta 10kV a 0.44kV equipada con celdas de protección y medición.',
    precio: 8200,
    unidad: '/ mes',
    ubicacion: 'Piura',
    tipo: 'ALQUILER',
    imagenUrl: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?q=80&w=800',
    disponible: true,
  },
];
