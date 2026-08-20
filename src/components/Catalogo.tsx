'use client';
import React, { useState, useEffect } from 'react';
import {
  MapPin,
  ArrowRight,
  ShoppingCart,
  Eye,
  Clock,
  BadgeDollarSign,
  Image as ImageIcon,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
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
  destacado?: boolean;
}

export default function Catalogo() {
  const [productos, setProductos] = useState<EquipoBD[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEquipoModal, setSelectedEquipoModal] = useState<EquipoBD | null>(null);

  const router = useRouter();

  // La home muestra SOLO los productos marcados como destacados en el panel admin
  const fetchDestacados = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/equipos?destacado=true&pageSize=50`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setProductos(data);
          setLoading(false);
          return;
        }
        if (data && Array.isArray(data.items)) {
          setProductos(data.items);
          setLoading(false);
          return;
        }
      }
    } catch {
      console.warn('Backend API no disponible aún o vacía, usando fallback');
    }

    // Fallback local solo si el backend no responde
    setProductos([]);
    setLoading(false);
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- cargar destacados al montar
    fetchDestacados();
  }, []);

  const displayedProducts = productos.slice(0, 8);

  return (
    <section id="catalogo" className="bg-[#f8fafc] py-24 font-poppins border-t border-slate-100 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12">

        {/* ENCABEZADO DE SECCIÓN */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 mb-12">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-3">
              <span className="h-[2px] w-10 rounded-full bg-[#E63C46]" />
              <span className="text-xs font-montserrat font-[800] uppercase tracking-[0.22em] text-[#E63C46]">
                Base de Datos Oficial
              </span>
            </span>
            <h2 className="mt-4 font-spartan font-[800] text-4xl sm:text-5xl text-slate-900 leading-[1.05] tracking-tight">
              Productos <span className="text-[#E63C46]">Destacados</span>
            </h2>
            <p className="mt-4 text-sm sm:text-[15px] text-slate-500 font-[400] leading-relaxed max-w-xl">
              Ingeniería, medición y media tensión: una selección de equipos certificados disponibles
              para alquiler, venta y proyectos llave en mano en todo el país.
            </p>
          </div>

          <div className="flex flex-col items-stretch sm:items-end gap-3 shrink-0">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <Link
                href="/renta"
                className="group inline-flex items-center justify-center gap-2.5 bg-[#264772] px-5 py-3.5 rounded-[14px] shadow-lg shadow-[#264772]/15 text-white font-[700] text-sm hover:bg-[#1d385c] transition-all duration-300"
              >
                <Clock className="w-4 h-4" />
                <span>Equipos en Renta</span>
              </Link>
              <Link
                href="/venta"
                className="group inline-flex items-center justify-center gap-2.5 bg-[#E63C46] px-5 py-3.5 rounded-[14px] shadow-lg shadow-[#E63C46]/25 text-white font-[700] text-sm hover:bg-[#C92A36] transition-all duration-300"
              >
                <BadgeDollarSign className="w-4 h-4" />
                <span>Equipos en Venta</span>
              </Link>
            </div>
          </div>
        </div>

        {/* GRILLA DE DESTACADOS */}
        {loading ? (
          <div className="py-20 text-center text-slate-500 font-medium">
            <div className="animate-spin w-8 h-8 border-4 border-[#E63C46] border-t-transparent rounded-full mx-auto mb-4" />
            Cargando productos destacados...
          </div>
        ) : displayedProducts.length === 0 ? (
          <div className="py-16 text-center bg-white rounded-[20px] border border-slate-200 p-8">
            <p className="text-slate-700 font-[700] text-base">
              Aún no hay productos destacados.
            </p>
            <p className="text-xs text-slate-400 font-[500] mt-1.5">
              Marca equipos como destacados desde el panel admin para que aparezcan aquí.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {displayedProducts.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                onClick={() => router.push(`/equipos/${item.id}`)}
                className="bg-white rounded-[20px] border border-slate-200/80 hover:border-slate-300 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col justify-between group cursor-pointer"
              >
                <div>
                  {/* Imagen del Producto */}
                  <div className="relative h-52 w-full bg-slate-50 overflow-hidden">
                    <span
                      className={`absolute top-3 left-3 z-10 px-3 py-1 rounded-full text-[10px] font-[800] text-white tracking-wider uppercase shadow-sm ${tipoBadgeClass(
                        item.tipo
                      )}`}
                    >
                      {tipoLabel(item.tipo)}
                    </span>
                    <span className="absolute top-3 right-3 z-10 px-2.5 py-1 rounded-full bg-amber-400 text-amber-950 text-[10px] font-[800] uppercase tracking-wider shadow-sm">
                      Destacado
                    </span>
                    {item.imagenUrl ? (
                      <img
                        src={imagenCompleta(item.imagenUrl)}
                        alt={item.nombre}
                        className="w-full h-full object-contain p-4 group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center gap-2 bg-gradient-to-br from-slate-100 to-slate-200">
                        <ImageIcon className="w-10 h-10 text-slate-300" />
                        <span className="text-[11px] font-[700] uppercase tracking-widest text-slate-400">
                          Sin foto
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Contenido Card */}
                  <div className="p-5">
                    <div className="flex items-center justify-between text-xs font-[500] text-slate-500 mb-2">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-[#E63C46]" /> {item.ubicacion}
                      </span>
                      <span className="bg-slate-100 px-2 py-0.5 rounded text-[11px] font-[700] text-slate-700 max-w-[130px] truncate">
                        {item.categoria}
                      </span>
                    </div>

                    <h3 className="font-spartan font-[600] text-[17px] text-slate-900 leading-snug tracking-tight line-clamp-2 min-h-[46px] group-hover:text-[#E63C46] transition-colors">
                      {item.nombre}
                    </h3>

                    <p className="text-slate-500 text-xs line-clamp-3 leading-relaxed mt-2 font-spartan font-[500]">
                      {item.descripcion}
                    </p>

                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-[11px] uppercase font-[700] text-slate-400">
                        {precioEtiquetaCorta(item.tipo)}
                      </span>
                      {item.precio === null || item.precio === undefined ? (
                        <span className="text-xs font-[700] text-slate-500 italic">Bajo cotización</span>
                      ) : (
                        <div className="flex items-baseline gap-1">
                          <span className="font-spartan font-[700] text-xl text-slate-900">
                            S/ {typeof item.precio === 'number' ? item.precio.toLocaleString() : item.precio}
                          </span>
                          {item.unidad && <span className="text-xs font-[500] text-slate-500">{item.unidad}</span>}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Acciones */}
                <div className="p-5 pt-0 grid grid-cols-2 gap-2" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push(`/equipos/${item.id}`);
                    }}
                    className="h-10 rounded-[10px] border border-slate-200 hover:bg-slate-50 hover:border-slate-300 text-slate-700 font-[700] text-xs transition-all flex items-center justify-center gap-1.5 whitespace-nowrap"
                  >
                    <Eye className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>Detalles</span>
                  </button>

                  <button
                    onClick={() => {
                      agregarAlCarrito({
                        id: item.id,
                        nombre: item.nombre,
                        descripcion: item.descripcion,
                        ubicacion: item.ubicacion,
                        precio: item.precio,
                        tipo: item.tipo,
                        imagenUrl: item.imagenUrl,
                      });
                      window.dispatchEvent(
                        new CustomEvent('cart-updated', {
                          detail: {
                            addedItem: { nombre: item.nombre, imagenUrl: item.imagenUrl },
                          },
                        })
                      );
                      // Navega a la página de detalle del producto en la MISMA pestaña
                      router.push(`/equipos/${item.id}`);
                    }}
                    className="h-10 rounded-[10px] bg-[#E63C46] hover:bg-[#C92A36] text-white font-[700] text-xs transition-all flex items-center justify-center gap-1.5 shadow-md shadow-[#E63C46]/25 hover:shadow-[#E63C46]/35 whitespace-nowrap"
                  >
                    <ShoppingCart className="w-3.5 h-3.5 shrink-0" />
                    <span>{ctaLabel(item.tipo)}</span>
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* CTA VER CATÁLOGO COMPLETO */}
        <div className="mt-14 flex flex-col items-center gap-3">
          <Link
            href="/equipos"
            className="group inline-flex items-center justify-center gap-2.5 px-8 py-4 bg-[#264772] hover:bg-[#1d385c] text-white font-[800] text-sm rounded-[16px] shadow-xl shadow-[#264772]/25 transition-all hover:scale-[1.03]"
          >
            <span>Ver Catálogo Completo</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
          <p className="text-xs font-[500] text-slate-400">
            Explora toda la base de datos: buscador, categorías, alquiler, venta y proyectos.
          </p>
        </div>

      </div>

      {/* MODAL DETALLES DEL EQUIPO */}
      {selectedEquipoModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div
            className="bg-white rounded-[24px] max-w-lg w-full overflow-hidden shadow-2xl border border-slate-100 transition-all duration-200 animate-in fade-in zoom-in-95"
          >
            <div className="relative h-64 w-full bg-slate-100">
              <img
                src={imagenCompleta(selectedEquipoModal.imagenUrl)}
                alt={selectedEquipoModal.nombre}
                className="w-full h-full object-contain p-4"
              />
              <button
                onClick={() => setSelectedEquipoModal(null)}
                className="absolute top-4 right-4 bg-black/50 hover:bg-black/80 text-white w-9 h-9 rounded-full flex items-center justify-center transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="p-6">
              <div className="flex items-center justify-between text-xs font-[600] text-slate-500 mb-2">
                <span className="bg-[#E63C46]/10 text-[#E63C46] px-3 py-1 rounded-full font-[700]">
                  {selectedEquipoModal.categoria}
                </span>
                <span className="flex items-center gap-1 text-slate-600">
                  <MapPin className="w-4 h-4 text-[#E63C46]" /> Sede {selectedEquipoModal.ubicacion}
                </span>
              </div>

              <h3 className="font-spartan font-[700] text-xl text-slate-900 mb-3 tracking-tight">
                {selectedEquipoModal.nombre}
              </h3>

              <p className="text-sm text-slate-600 leading-relaxed mb-6">
                {selectedEquipoModal.descripcion}
              </p>

              <div className="bg-slate-50 p-4 rounded-[14px] border border-slate-200/60 mb-6 flex items-center justify-between">
                <span className="text-xs font-[600] text-slate-500">{precioEtiqueta(selectedEquipoModal.tipo)}:</span>
                <span className="font-spartan font-[700] text-xl text-slate-900">
                  {selectedEquipoModal.precio ? `S/ ${selectedEquipoModal.precio} ${selectedEquipoModal.unidad || ''}` : 'Bajo Cotización'}
                </span>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setSelectedEquipoModal(null)}
                  className="w-1/2 py-3 rounded-[12px] border border-slate-200 text-slate-700 font-[700] text-xs hover:bg-slate-50"
                >
                  Cerrar
                </button>
                <a
                  href={`/cotizacion?equipo=${encodeURIComponent(selectedEquipoModal.nombre)}`}
                  className="w-1/2 py-3 rounded-[12px] bg-[#E63C46] hover:bg-[#C92A36] text-white font-[700] text-xs flex items-center justify-center gap-2 shadow-md"
                >
                  <ShoppingCart className="w-4 h-4" />
                  <span>Solicitar Cotización</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

    </section>
  );
}

// Fallback estático con los equipos extraídos de los PDFs de catálogo (solo destacados)
const DEFAULT_EQUIPOS: EquipoBD[] = [
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
    destacado: true,
  },
  {
    id: '2',
    nombre: 'Siemens Celda Modular SIMOSEC 24kV',
    categoria: 'Celdas Modulares AIS / Media Tensión',
    descripcion: 'Celda modular de aislamiento en aire SIMOSEC hasta 24kV y 1250A. Diseño extensible con interruptor automático en vacío para protección y maniobra.',
    precio: null,
    ubicacion: 'Piura',
    tipo: 'PROYECTO',
    imagenUrl: 'https://images.unsplash.com/photo-1581092580497-e0d23cbdf1dc?q=80&w=800',
    disponible: true,
    destacado: true,
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
    destacado: true,
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
    destacado: true,
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
    destacado: true,
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
    destacado: true,
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
    destacado: true,
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
    destacado: true,
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
  {
    id: '16',
    nombre: 'Transformador de Media Tensión 500kVA',
    categoria: 'Subestaciones',
    descripcion: 'Transformador de distribución 500kVA 22.9kV / 0.44kV para subestaciones industriales y mineras. Fabricación bajo norma IEC.',
    precio: null,
    ubicacion: 'Piura',
    tipo: 'PROYECTO',
    imagenUrl: 'https://images.unsplash.com/photo-1544724569-5f546fd6f2b5?q=80&w=800',
    disponible: true,
    destacado: true,
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
];
