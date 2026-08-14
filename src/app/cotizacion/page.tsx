'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import {
  FileText,
  Download,
  Send,
  Save,
  Eye,
  CheckCircle2,
  XCircle,
  Edit3,
  Calendar,
  Zap,
  ShieldCheck,
  CreditCard,
  Lock,
  Plus,
  Minus,
  Trash2,
  Sparkles,
  Info,
  Check,
  ChevronDown,
  Loader2,
  X,
} from 'lucide-react';
import { leerCarrito, agregarAlCarrito, guardarCarrito } from '@/lib/cart';
import type { CartItem } from '@/lib/cart';
import { tipoLabel, tipoBadgeClass, precioEtiqueta } from '@/lib/equipo';

interface ProductoActual extends CartItem {
  categoria?: string;
}

interface EquipoDetalle {
  id: string;
  nombre: string;
  marca?: string | null;
  modelo?: string | null;
  serie?: string | null;
  anio?: number | null;
  codigoInterno?: string | null;
  categoria?: string;
  ubicacion?: string;
  estado?: string;
  tipo?: string;
  imagenUrl?: string;
  descripcion?: string;
  garantia?: string;
  proveedor?: string | null;
  familia?: { nombre: string } | null;
  subfamilia?: { nombre: string } | null;
}

import { apiFetch, imagenCompleta } from '@/lib/api';
import { toast } from 'sonner';

export default function CotizacionPage() {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [selectedProductIndex, setSelectedProductIndex] = useState(0);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [showSpecs, setShowSpecs] = useState(false);
  const [modalDetalleItem, setModalDetalleItem] = useState<CartItem | null>(null);
  const [showCaracteristicas, setShowCaracteristicas] = useState(false);
  const [equipoDetalle, setEquipoDetalle] = useState<EquipoDetalle | null>(null);
  const [loadingDetalle, setLoadingDetalle] = useState(false);

  // Datos del solicitante + estado del envío
  const [clienteForm, setClienteForm] = useState({
    nombre: '',
    empresa: '',
    email: '',
    telefono: '',
    mensaje: '',
  });
  const [enviando, setEnviando] = useState(false);
  const [enviada, setEnviada] = useState(false);
  const [nombreCliente, setNombreCliente] = useState('');
  const [errorEnvio, setErrorEnvio] = useState<string | null>(null);
  const [mensajeGuardado, setMensajeGuardado] = useState<string | null>(null);
  
  // Datos del Encabezado de Cotización Empresarial
  const [cotizacionMetadata, setCotizacionMetadata] = useState({
    numero: 'COT-2026-0089',
    fecha: '10/08/2026',
    cliente: 'Empresa Minera del Norte S.A.C.',
    proyecto: 'Expansión de Subestación y Potencia Fase II',
    responsable: 'Ing. Carlos Mendoza (HH TRENT)',
    estado: 'DISPONIBLE PARA COTIZAR',
  });

  // Condiciones Comerciales
  const [condiciones, setCondiciones] = useState({
    formaPago: 'Crédito a 30 días / Transferencia bancaria BCP/BBVA',
    tiempoEntrega: 'Inmediata (Sede Piura / Trujillo / Chiclayo)',
    validezOferta: '15 días calendarios a partir de la emisión',
    garantia: '2 Años de Garantía de Fábrica + Soporte Técnico 24/7',
    lugarEntrega: 'En obra / Almacén del cliente',
    observaciones: 'Precios incluyen IGV (18%). Sujeto a verificación de campo.',
  });

  const [ticketGenerado, setTicketGenerado] = useState<{
    codigo: string;
    fecha: string;
    items: number;
  } | null>(null);

  useEffect(() => {
    const loadCart = () => {
      setCartItems(leerCarrito());
    };
    loadCart();

    window.addEventListener('cart-updated', loadCart);
    return () => window.removeEventListener('cart-updated', loadCart);
  }, []);

  // Fetch detalle completo del equipo seleccionado cuando cambia el índice
  useEffect(() => {
    const items = leerCarrito();
    const item = items[selectedProductIndex];
    if (!item || item.id === 'demo-taladro') {
      setEquipoDetalle(null);
      return;
    }
    setLoadingDetalle(true);
    apiFetch<EquipoDetalle>(`/equipos/${item.id}`)
      .then((data) => setEquipoDetalle(data))
      .catch(() => setEquipoDetalle(null))
      .finally(() => setLoadingDetalle(false));
  }, [selectedProductIndex]);

  const updateQty = (id: string, delta: number) => {
    const updated = cartItems
      .map((item) => {
        if (item.id === id) {
          const newQty = item.cantidad + delta;
          return newQty > 0 ? { ...item, cantidad: newQty } : null;
        }
        return item;
      })
      .filter((x): x is CartItem => x !== null);
    setCartItems(updated);
    localStorage.setItem('hht_cotizacion_cart', JSON.stringify(updated));
    window.dispatchEvent(new Event('cart-updated'));
  };

  const removeItem = (id: string) => {
    const updated = cartItems.filter((item) => item.id !== id);
    setCartItems(updated);
    localStorage.setItem('hht_cotizacion_cart', JSON.stringify(updated));
    window.dispatchEvent(new Event('cart-updated'));
  };

  const actualizarCampo = (campo: keyof typeof clienteForm, valor: string) => {
    setClienteForm((prev) => ({ ...prev, [campo]: valor }));
  };

  const guardarBorrador = () => {
    try {
      localStorage.setItem('hht_cotizacion_draft', JSON.stringify(clienteForm));
      setMensajeGuardado('📄 Borrador de la solicitud guardado en este navegador.');
      setErrorEnvio(null);
      setTimeout(() => setMensajeGuardado(null), 3500);
    } catch {
      setErrorEnvio('No se pudo guardar el borrador.');
    }
  };

  const enviarSolicitud = async () => {
    setErrorEnvio(null);
    if (!clienteForm.nombre.trim()) {
      setErrorEnvio('Escribe tu nombre completo.');
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(clienteForm.email.trim())) {
      setErrorEnvio('Ingresa un correo electrónico válido.');
      return;
    }
    if (!clienteForm.telefono.trim()) {
      setErrorEnvio('Ingresa un teléfono de contacto.');
      return;
    }
    if (cartItems.length === 0) {
      setErrorEnvio('Agrega al menos un equipo a la cotización.');
      return;
    }

    const itemsReales = cartItems.filter((item) => !String(item.id).startsWith('demo-'));
    if (itemsReales.length === 0) {
      setErrorEnvio(
        'El ítem de demostración no se puede enviar. Agrega equipos reales del catálogo.',
      );
      return;
    }

    // 2. VALIDACIÓN ANTI-SPAM / DUPLICADOS RECIENTES (5 Minutos)
    const ultimaCotizacion = localStorage.getItem('hht_ultima_cotizacion_ts');
    const ultimoHash = localStorage.getItem('hht_ultima_cotizacion_hash');
    const currentHash = `${clienteForm.email.trim().toLowerCase()}-${itemsReales.map((i) => `${i.id}:${i.cantidad}`).join(',')}`;

    if (ultimaCotizacion && ultimoHash === currentHash) {
      const tiempoPasado = Date.now() - parseInt(ultimaCotizacion, 10);
      if (tiempoPasado < 5 * 60 * 1000) { // 5 Minutos de enfriamiento para la misma solicitud
        const minutosRestantes = Math.ceil((5 * 60 * 1000 - tiempoPasado) / 60000);
        setErrorEnvio(
          `⚠️ Ya enviaste esta misma solicitud recientemente. Tu Ticket de atención se encuentra en proceso. Si deseas cambiar algo, por favor espera ${minutosRestantes} minuto(s) o contáctanos por WhatsApp.`,
        );
        return;
      }
    }

    setEnviando(true);
    try {
      const res = await apiFetch<any>('/cotizaciones', {
        method: 'POST',
        body: JSON.stringify({
          clienteNombre: clienteForm.nombre.trim(),
          clienteEmpresa: clienteForm.empresa.trim() || undefined,
          clienteEmail: clienteForm.email.trim(),
          clienteTelefono: clienteForm.telefono.trim(),
          mensaje: clienteForm.mensaje.trim() || undefined,
          items: itemsReales.map((item) => ({
            equipoId: item.id,
            cantidad: item.cantidad,
          })),
        }),
      });

      // Generar código de Ticket Único
      const ticketNum = res?.id ? `TCK-${String(res.id).substring(0, 8).toUpperCase()}` : `TCK-${Math.floor(100000 + Math.random() * 900000)}`;
      const fechaHoy = new Date().toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });

      setNombreCliente(clienteForm.nombre.trim().split(' ')[0] || '');

      setTicketGenerado({
        codigo: ticketNum,
        fecha: fechaHoy,
        items: itemsReales.reduce((acc, curr) => acc + curr.cantidad, 0),
      });

      setClienteForm({
        nombre: '',
        empresa: '',
        email: '',
        telefono: '',
        mensaje: '',
      });
      localStorage.removeItem('hht_cliente_registrado');
      localStorage.removeItem('hht_cotizacion_draft');
      localStorage.setItem('hht_ultima_cotizacion_ts', Date.now().toString());
      localStorage.setItem('hht_ultima_cotizacion_hash', currentHash);

      setEnviada(true);
      toast.success('Solicitud de cotización enviada con éxito');
      guardarCarrito([]);
      window.dispatchEvent(new Event('cart-updated'));
      localStorage.removeItem('hht_cotizacion_draft');
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'No se pudo enviar la solicitud. Inténtalo de nuevo.';
      setErrorEnvio(msg);
      toast.error(msg);
    } finally {
      setEnviando(false);
    }
  };

  // Cálculos Económicos
  const subtotal = cartItems.reduce((acc, curr) => acc + curr.precio * curr.cantidad, 0);
  const igv = subtotal * 0.18;
  const totalEstimado = subtotal + igv;

  const tieneAlquiler = cartItems.some((item) => item.tipo === 'ALQUILER');
  const tieneVenta = cartItems.some((item) => item.tipo === 'VENTA');

  const currentProduct: ProductoActual = cartItems[selectedProductIndex] || {
    id: 'demo-taladro',
    nombre: 'Taladro Percutor Profesional 1/2" 600W Truper 15346 ROTO-1/2A7',
    categoria: 'Herramientas Eléctricas',
    precio: 199.0,
    tipo: 'VENTA',
    ubicacion: 'Piura',
    imagenUrl: 'https://images.unsplash.com/photo-1504148455328-c376907d081c?q=80&w=800',
    descripcion: 'Taladro percutor profesional 600W Truper 15346 (Modelo ROTO-1/2A7) con broquero de 1/2" (13 mm), 220V (50/60Hz), 3100 RPM y 50,000 GPM. Peso: 1.96 kg. Ciclo de trabajo: 30 min trabajo / 15 min descanso.',
    cantidad: 1,
  };

  const productImages = [
    currentProduct.imagenUrl,
    'https://images.unsplash.com/photo-1581092160607-ee22621dd758?q=80&w=800',
    'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?q=80&w=800',
    'https://images.unsplash.com/photo-1581092580497-e0d23cbdf1dc?q=80&w=800',
  ];

  return (
    <main className="min-h-screen bg-[#F8FAFC] text-slate-900 font-poppins font-normal pb-16">
      <Header />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 pt-24 sm:pt-28 space-y-8">

        {/* 1. ENCABEZADO DE COTIZACIÓN */}
        <section className="bg-white rounded-[24px] border border-slate-200/80 p-6 sm:p-8 shadow-sm relative overflow-hidden">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-slate-100">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="bg-[#162B4D] text-white text-[11px] font-[800] px-3.5 py-1.5 rounded-full uppercase tracking-wider shadow-xs">
                  {cotizacionMetadata.numero}
                </span>
                <span className={`text-white font-[800] text-[11px] px-3.5 py-1.5 rounded-full uppercase tracking-wider shadow-xs ${
                  cotizacionMetadata.estado.includes('DISPONIBLE') ? 'bg-emerald-600' : 'bg-amber-500'
                }`}>
                  {cotizacionMetadata.estado}
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold font-poppins text-slate-900 tracking-tight leading-tight">
                Módulo Empresarial de Cotizaciones
              </h1>
              <p className="text-slate-500 text-xs sm:text-sm font-normal">
                Gestión comercial de equipos industriales, transformadores y celdas de media tensión.
              </p>
            </div>

            {/* BOTONES DE ACCIÓN RÁPIDA EN EL ENCABEZADO */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => alert('📄 Borrador guardado correctamente.')}
                className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-xl transition-all flex items-center gap-1.5"
              >
                <Save className="w-4 h-4 text-slate-500" />
                <span>Guardar</span>
              </button>
              <button
                onClick={() => alert('👀 Generando vista previa del documento...')}
                className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-xl transition-all flex items-center gap-1.5"
              >
                <Eye className="w-4 h-4 text-slate-500" />
                <span>Vista Previa</span>
              </button>
              <button
                onClick={() => alert('📥 Generando y descargando PDF de cotización...')}
                className="px-3.5 py-2.5 bg-[#E63C46] hover:bg-[#C92A36] text-white text-xs font-semibold rounded-xl transition-all shadow-md flex items-center gap-1.5"
              >
                <Download className="w-4 h-4" />
                <span>Descargar PDF</span>
              </button>
              <button
                onClick={() => alert('🚀 Enviando propuesta al correo del cliente...')}
                className="px-3.5 py-2.5 bg-[#162B4D] hover:bg-[#10203B] text-white text-xs font-semibold rounded-xl transition-all shadow-md flex items-center gap-1.5"
              >
                <Send className="w-4 h-4" />
                <span>Enviar al Cliente</span>
              </button>
            </div>
          </div>

          {/* DATOS CLAVE DE LA COTIZACIÓN */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-6 text-xs">
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
              <span className="text-slate-400 font-[600] block uppercase text-[10px]">Cliente / Empresa</span>
              <span className="font-[700] text-slate-900 mt-0.5 block">{cotizacionMetadata.cliente}</span>
            </div>
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
              <span className="text-slate-400 font-[600] block uppercase text-[10px]">Proyecto</span>
              <span className="font-[700] text-slate-900 mt-0.5 block truncate">{cotizacionMetadata.proyecto}</span>
            </div>
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
              <span className="text-slate-400 font-[600] block uppercase text-[10px]">Fecha Emisión</span>
              <span className="font-[700] text-slate-900 mt-0.5 block">{cotizacionMetadata.fecha}</span>
            </div>
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
              <span className="text-slate-400 font-[600] block uppercase text-[10px]">Responsable Técnico</span>
              <span className="font-[700] text-slate-900 mt-0.5 block">{cotizacionMetadata.responsable}</span>
            </div>
          </div>
        </section>

        {/* 2 & 3. GALERÍA A LA IZQUIERDA E INFORMACIÓN A LA DERECHA */}
        <section id="seccion-galeria-producto" className="bg-white rounded-[24px] border border-slate-200/80 p-6 sm:p-8 shadow-sm grid grid-cols-1 lg:grid-cols-12 gap-8 items-start scroll-mt-28">
          
          {/* GALERÍA DE PRODUCTO (IZQUIERDA - 6 Cols) */}
          <div className="lg:col-span-6 space-y-4">
            <div className="relative h-80 sm:h-96 bg-slate-100 rounded-[20px] overflow-hidden border border-slate-200">
              <img
                src={productImages[activeImageIndex]}
                alt={currentProduct.nombre}
                className="w-full h-full object-cover transition-all duration-300"
              />
              <span className="absolute top-4 left-4 bg-[#162B4D] text-white text-[10px] font-[800] px-3 py-1 rounded-full uppercase tracking-wider shadow-sm">
                Sede {currentProduct.ubicacion || 'Piura'}
              </span>
            </div>

            {/* MINIATURAS DE LA GALERÍA */}
            <div className="grid grid-cols-4 gap-3">
              {productImages.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImageIndex(idx)}
                  className={`h-20 rounded-xl overflow-hidden border-2 transition-all ${
                    activeImageIndex === idx ? 'border-[#E63C46] shadow-md scale-105' : 'border-slate-200 opacity-70 hover:opacity-100'
                  }`}
                >
                  <img src={imagenCompleta(img)} alt={`Vista ${idx}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>

          {/* INFORMACIÓN PRINCIPAL DEL PRODUCTO (DERECHA - 6 Cols) */}
          <div className="lg:col-span-6 space-y-5">
            <div className="space-y-2">
              {/* Badges de estado y modalidad */}
              <div className="flex flex-wrap items-center gap-2">
                <span className={`font-[800] text-[10px] inline-block px-2.5 py-1 rounded-full uppercase text-white ${tipoBadgeClass(currentProduct.tipo)}`}>
                  {tipoLabel(currentProduct.tipo)}
                </span>
                {equipoDetalle?.estado === 'DISPONIBLE' || (!equipoDetalle && currentProduct.tipo) ? (
                  <span className="bg-emerald-100 text-emerald-700 text-[10px] font-[800] px-2.5 py-1 rounded-full uppercase">
                    Disponible
                  </span>
                ) : null}
                {(equipoDetalle?.codigoInterno) && (
                  <span className="bg-[#162B4D]/8 text-[#162B4D] text-[10px] font-[800] px-2.5 py-1 rounded-full border border-[#162B4D]/15">
                    {equipoDetalle.codigoInterno}
                  </span>
                )}
              </div>

              {/* Categoría */}
              <span className="text-[#E63C46] font-[600] text-xs uppercase tracking-widest bg-[#E63C46]/10 px-3 py-1 rounded-full inline-block">
                {equipoDetalle?.categoria || currentProduct.categoria || 'Equipo Industrial'}
              </span>

              {/* Nombre del producto */}
              <h2 className="text-xl sm:text-2xl font-[800] text-slate-900 leading-snug">
                {currentProduct.nombre}
              </h2>

              {/* Sede */}
              <p className="text-xs text-slate-500 font-[600]">
                Sede {equipoDetalle?.ubicacion || currentProduct.ubicacion || 'Piura'}
              </p>
            </div>

            {/* Info esencial: solo sede, condición y botón a specs */}
            <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-4 rounded-2xl border border-slate-100">
              <div>
                <span className="text-slate-400 font-[600] uppercase text-[10px] block">Sede</span>
                <span className="font-[700] text-slate-800">{equipoDetalle?.ubicacion || currentProduct.ubicacion || 'Piura'}</span>
              </div>
              <div>
                <span className="text-slate-400 font-[600] uppercase text-[10px] block">Condición</span>
                <span className="font-[700] text-slate-800">
                  {currentProduct.tipo === 'ALQUILER' ? 'Certificado y calibrado' : 'Nuevo con Garantía'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 font-[600] uppercase text-[10px] block">Disponibilidad</span>
                <span className="font-[700] text-emerald-600 flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" />
                  {currentProduct.tipo === 'ALQUILER' ? 'Para alquiler' : 'Para compra'}
                </span>
              </div>
              {equipoDetalle?.marca && (
                <div>
                  <span className="text-slate-400 font-[600] uppercase text-[10px] block">Marca</span>
                  <span className="font-[700] text-slate-800">{equipoDetalle.marca}</span>
                </div>
              )}
            </div>

            {/* Botón a especificaciones técnicas */}
            <button
              type="button"
              onClick={() => {
                setShowSpecs(true);
                setTimeout(() => {
                  const el = document.getElementById('seccion-specs-tecnicas');
                  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }, 50);
              }}
              className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl cursor-pointer group transition-colors"
            >
              <div className="text-left">
                <span className="text-xs font-[800] text-slate-700 uppercase tracking-tight group-hover:text-[#162B4D] transition-colors block">
                  Especificaciones Técnicas del Equipo
                </span>
                <span className="text-[10px] text-slate-400 font-[500]">
                  Parámetros eléctricos y mecánicos de rendimiento en campo.
                </span>
              </div>
              <ChevronDown className="w-4 h-4 text-slate-400 shrink-0 group-hover:translate-y-0.5 transition-transform" />
            </button>

            {/* PRECIO SEGÚN MODALIDAD */}
            <div className="p-5 bg-gradient-to-r from-slate-900 to-[#162B4D] rounded-2xl text-white flex items-center justify-between shadow-lg">
              <div>
                <span className="text-[10px] text-slate-300 font-[600] uppercase block">
                  {precioEtiqueta(currentProduct.tipo)}
                </span>
                <div className="text-2xl sm:text-3xl font-[800] text-white">
                  S/ {typeof currentProduct.precio === 'number' ? currentProduct.precio.toFixed(2) : currentProduct.precio}
                  {currentProduct.unidad && (
                    <span className="text-sm font-[600] text-slate-300 ml-1">{currentProduct.unidad}</span>
                  )}
                </div>
              </div>
              <div className="text-right">
                <span
                  className={`${
                    currentProduct.tipo === 'ALQUILER'
                      ? 'bg-[#233A61]'
                      : currentProduct.tipo === 'VENTA'
                      ? 'bg-emerald-500'
                      : 'bg-amber-500'
                  } text-white text-[10px] font-[800] px-2.5 py-1 rounded-full uppercase tracking-wider block mb-1`}
                >
                  {currentProduct.tipo === 'ALQUILER'
                    ? `Tarifa ${currentProduct.unidad || 'por período'}`
                    : currentProduct.tipo === 'VENTA'
                    ? 'Precio Directo'
                    : 'A Cotizar'}
                </span>
                {currentProduct.tipo === 'ALQUILER' && (
                  <span className="text-[11px] text-slate-300 font-[600]">
                    Mantenimiento incluido
                  </span>
                )}
              </div>
            </div>

            {/* BOTÓN AGREGAR A COTIZACIÓN */}
            <button
              onClick={() => {
                agregarAlCarrito({
                  id: currentProduct.id || 'item-demo',
                  nombre: currentProduct.nombre,
                  descripcion: currentProduct.descripcion,
                  ubicacion: currentProduct.ubicacion,
                  precio: currentProduct.precio,
                  tipo: currentProduct.tipo || 'VENTA',
                  unidad: currentProduct.unidad || undefined,
                  imagenUrl: currentProduct.imagenUrl,
                });
                setCartItems(leerCarrito());
                window.dispatchEvent(new CustomEvent('cart-updated', { detail: { openDrawer: true } }));
              }}
              className="w-full py-4 bg-[#E63C46] hover:bg-[#C92A36] text-white font-[800] text-sm rounded-xl shadow-lg shadow-[#E63C46]/20 transition-all flex items-center justify-center gap-2 uppercase tracking-wider"
            >
              <Plus className="w-5 h-5" />
              <span>Agregar a Cotización Actual</span>
            </button>
          </div>

        </section>

        {/* 4. CARACTERÍSTICAS Y ESPECIFICACIONES TÉCNICAS (DESPLEGABLE) */}
        <section id="seccion-specs-tecnicas" className="bg-white rounded-[24px] border border-slate-200/80 shadow-sm overflow-hidden transition-all scroll-mt-28">
          <button
            onClick={() => setShowSpecs(!showSpecs)}
            className="w-full p-6 sm:p-8 flex items-center justify-between text-left hover:bg-slate-50/50 transition-colors"
          >
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold font-poppins text-slate-900 uppercase tracking-tight">
                  Especificaciones Técnicas del Equipo
                </h3>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                  {showSpecs ? 'Ocultar' : 'Ver Detalles'}
                </span>
              </div>
              <p className="text-slate-500 text-xs font-normal mt-0.5">Parámetros eléctricos y mecánicos de rendimiento en campo.</p>
            </div>
            <div className={`p-2 rounded-full bg-slate-100 text-slate-600 transition-transform duration-300 ${showSpecs ? 'rotate-180 bg-[#162B4D] text-white' : ''}`}>
              <ChevronDown className="w-5 h-5" />
            </div>
          </button>

          {showSpecs && (
            <div className="px-6 pb-6 sm:px-8 sm:pb-8 pt-0 border-t border-slate-100">
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 text-xs pt-4">
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-slate-400 font-medium uppercase text-[10px] block">Potencia de Motor</span>
                  <span className="font-semibold text-slate-900 text-sm mt-0.5 block">600 W</span>
                </div>
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-slate-400 font-medium uppercase text-[10px] block">Voltaje / Frecuencia</span>
                  <span className="font-semibold text-slate-900 text-sm mt-0.5 block">220 V (50Hz / 60Hz)</span>
                </div>
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-slate-400 font-medium uppercase text-[10px] block">Velocidad / Impacto</span>
                  <span className="font-semibold text-slate-900 text-sm mt-0.5 block">0 - 3,100 RPM / 50,000 GPM</span>
                </div>
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-slate-400 font-medium uppercase text-[10px] block">Mandril / Broquero</span>
                  <span className="font-semibold text-slate-900 text-sm mt-0.5 block">1/2&quot; (13 mm)</span>
                </div>
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-slate-400 font-medium uppercase text-[10px] block">Peso del Equipo</span>
                  <span className="font-semibold text-slate-900 text-sm mt-0.5 block">1.96 kg</span>
                </div>
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-slate-400 font-medium uppercase text-[10px] block">Ciclo de Trabajo</span>
                  <span className="font-semibold text-slate-900 text-sm mt-0.5 block">30 min uso / 15 min descanso</span>
                </div>
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-slate-400 font-medium uppercase text-[10px] block">Funciones Integradas</span>
                  <span className="font-semibold text-slate-900 text-sm mt-0.5 block">Percutor + Atornillador</span>
                </div>
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-slate-400 font-medium uppercase text-[10px] block">Alimentación</span>
                  <span className="font-semibold text-slate-900 text-sm mt-0.5 block">Corriente Eléctrica 220V</span>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* 5. DESCRIPCIÓN COMPLETA */}
        <section className="bg-white rounded-[24px] border border-slate-200/80 p-6 sm:p-8 shadow-sm space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-lg font-[800] font-spartan text-slate-900 uppercase tracking-tight">
              Descripción General y Alcance Técnico
            </h3>
          </div>
          <p className="text-slate-600 text-sm leading-relaxed">
            {currentProduct.descripcion || 'Equipo de alta resistencia diseñado para trabajo pesado industrial. Incluye motor reforzado de balero de bolas, selector de función taladro o rotomartillo con velocidad variable reversible, mango auxiliar de plástico con giro de 360° para mayor control en perforaciones sobre concreto, madera y metal.'}
          </p>
        </section>

        {/* 6. PRODUCTOS / SERVICIOS DE LA COTIZACIÓN */}
        <section className="bg-white rounded-[24px] border border-slate-200/80 p-6 sm:p-8 shadow-sm space-y-6">
          <div className="border-b border-slate-100 pb-4 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-[800] font-spartan text-slate-900 uppercase tracking-tight">
                Productos y Servicios de la Cotización ({cartItems.length})
              </h3>
              <p className="text-slate-500 text-xs mt-0.5">Listado detallado de ítems incluidos en la propuesta comercial.</p>
            </div>
          </div>

          {/* TABLA DETALLADA DE PRODUCTOS */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 uppercase font-[700] border-b border-slate-200">
                  <th className="py-3.5 px-4">Item / Imagen</th>
                  <th className="py-3.5 px-4">Producto / Servicio</th>
                  <th className="py-3.5 px-4">Modalidad</th>
                  <th className="py-3.5 px-4 text-center">Cantidad</th>
                  <th className="py-3.5 px-4 text-right">Precio Unit.</th>
                  <th className="py-3.5 px-4 text-right">Subtotal</th>
                  <th className="py-3.5 px-4 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {cartItems.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-slate-400 font-[500]">
                      No hay equipos agregados en la cotización. Use el catálogo para incluir ítems.
                    </td>
                  </tr>
                ) : (
                  cartItems.map((item, idx) => {
                    const esSeleccionado = selectedProductIndex === idx;
                    return (
                      <tr
                        key={item.id}
                        onClick={() => {
                          setSelectedProductIndex(idx);
                          setActiveImageIndex(0);
                          const el = document.getElementById('seccion-galeria-producto');
                          if (el) {
                            el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                          }
                        }}
                        className={`cursor-pointer transition-all ${
                          esSeleccionado
                            ? 'bg-[#162B4D]/5 border-l-4 border-l-[#E63C46]'
                            : 'hover:bg-slate-50/80'
                        }`}
                      >
                        <td className="py-3 px-4">
                          <img
                            src={imagenCompleta(item.imagenUrl)}
                            alt={item.nombre}
                            className="w-12 h-12 rounded-lg object-cover bg-slate-100 border border-slate-200 shadow-xs"
                          />
                        </td>
                        <td className="py-3 px-4 font-normal text-slate-900 max-w-xs">
                          <div className="font-[700] text-slate-800 hover:text-[#E63C46] transition-colors flex items-center gap-1.5">
                            {item.nombre}
                            {esSeleccionado && (
                              <span className="px-2 py-0.5 bg-[#E63C46] text-white text-[9px] font-[800] rounded-full uppercase">
                                En Ficha
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-slate-500 font-normal block truncate mt-0.5">
                            {item.descripcion || 'Sin descripción detallada'}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-[800] text-white uppercase ${tipoBadgeClass(
                              item.tipo
                            )}`}
                          >
                            {tipoLabel(item.tipo)}
                          </span>
                          {item.tipo === 'ALQUILER' && item.unidad && (
                            <span className="text-[9px] text-slate-400 font-[600] block mt-0.5">
                              {item.unidad}
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-center gap-1.5">
                            <button onClick={() => updateQty(item.id, -1)} className="w-6 h-6 rounded bg-slate-100 hover:bg-slate-200 font-[800] flex items-center justify-center cursor-pointer">
                              -
                            </button>
                            <span className="font-[700] px-2">{item.cantidad}</span>
                            <button onClick={() => updateQty(item.id, 1)} className="w-6 h-6 rounded bg-slate-100 hover:bg-slate-200 font-[800] flex items-center justify-center cursor-pointer">
                              +
                            </button>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-right font-[700] text-slate-700 whitespace-nowrap">
                          S/ {item.precio > 0 ? item.precio.toFixed(2) : 'Cotización'}
                        </td>
                        <td className="py-3 px-4 text-right font-[800] text-[#162B4D] whitespace-nowrap">
                          S/ {(item.precio * item.cantidad).toFixed(2)}
                        </td>
                        <td className="py-3 px-4 text-center whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => setModalDetalleItem(item)}
                              title="Ver ficha completa"
                              className="px-2.5 py-1 bg-slate-100 hover:bg-[#162B4D] text-slate-700 hover:text-white rounded-lg text-[10px] font-[800] transition-all inline-flex items-center gap-1 cursor-pointer"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              Ver Ficha
                            </button>
                            <button
                              onClick={() => removeItem(item.id)}
                              title="Eliminar de la cotización"
                              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* 7 & 8. CONDICIONES COMERCIALES Y RESUMEN ECONÓMICO */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* CONDICIONES COMERCIALES (7 - IZQUIERDA 7 Cols) */}
          <div className="lg:col-span-7 bg-white rounded-[24px] border border-slate-200/80 p-6 sm:p-8 shadow-sm space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="text-base font-[800] font-spartan text-slate-900 uppercase tracking-tight">
                Condiciones Comerciales y Operativas
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-slate-400 font-[600] uppercase text-[10px] block">Forma de Pago</span>
                <span className="font-[700] text-slate-800 mt-0.5 block">{condiciones.formaPago}</span>
              </div>
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-slate-400 font-[600] uppercase text-[10px] block">Tiempo de Entrega</span>
                <span className="font-[700] text-slate-800 mt-0.5 block">{condiciones.tiempoEntrega}</span>
              </div>
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-slate-400 font-[600] uppercase text-[10px] block">Validez de Oferta</span>
                <span className="font-[700] text-slate-800 mt-0.5 block">{condiciones.validezOferta}</span>
              </div>
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-slate-400 font-[600] uppercase text-[10px] block">Garantía del Servicio</span>
                <span className="font-[700] text-slate-800 mt-0.5 block">{condiciones.garantia}</span>
              </div>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 text-xs">
              <span className="text-slate-400 font-[600] uppercase text-[10px] block">Observaciones Técnicas</span>
              <p className="text-slate-600 mt-1 leading-relaxed">{condiciones.observaciones}</p>
            </div>
          </div>

          {/* RESUMEN ECONÓMICO (8 - DERECHA 5 Cols) */}
          <div className="lg:col-span-5 bg-white rounded-[24px] border border-slate-200/80 p-6 sm:p-8 shadow-sm space-y-5 sticky top-24">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="text-base font-[800] font-spartan text-slate-900 uppercase tracking-tight">
                Resumen Económico General
              </h3>
            </div>

            {tieneAlquiler && (
              <p className="text-[10px] leading-relaxed text-slate-400 bg-amber-50 border border-amber-100 rounded-[10px] p-2.5 font-[500]">
                ⓘ Los ítems de <b>alquiler</b> se cotizan por tarifa del período indicado
                {tieneVenta ? ' y los de venta a precio directo.' : ' (mes, día o semana).'}
              </p>
            )}

            <div className="space-y-3 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal Equipos ({cartItems.reduce((acc, curr) => acc + curr.cantidad, 0)} u)</span>
                <span className="font-[700] text-slate-900">S/ {subtotal.toLocaleString('es-PE', { minimumFractionDigits: 2 })}</span>
              </div>

              <div className="pt-4 border-t border-slate-200 flex items-baseline justify-between bg-slate-900 p-4 rounded-xl text-white">
                <span className="font-[800] text-sm uppercase">TOTAL ESTIMADO</span>
                <span className="text-2xl font-[800] text-[#E63C46]">
                  S/ {subtotal.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>

          </div>

        </section>

        {/* 8.5. DATOS DEL SOLICITANTE (se envía a la BD) */}
        <section className="bg-white rounded-[24px] border border-slate-200/80 p-6 sm:p-8 shadow-sm">
          <div className="border-b border-slate-100 pb-3 mb-5">
            <h3 className="text-lg font-[800] font-spartan text-slate-900 uppercase tracking-tight">
              Datos del Solicitante
            </h3>
            <p className="text-slate-500 text-xs mt-0.5">
              Completa tus datos y envía la solicitud al área comercial de HH T-Soluciona. Un asesor te contactará para confirmar disponibilidad.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-[11px] font-[700] uppercase tracking-wide text-slate-500 block mb-1.5">
                Nombre completo *
              </label>
              <input
                value={clienteForm.nombre}
                onChange={(e) => actualizarCampo('nombre', e.target.value)}
                placeholder="Ej. Juan Pérez"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-[#E63C46]/30"
              />
            </div>
            <div>
              <label className="text-[11px] font-[700] uppercase tracking-wide text-slate-500 block mb-1.5">
                Empresa
              </label>
              <input
                value={clienteForm.empresa}
                onChange={(e) => actualizarCampo('empresa', e.target.value)}
                placeholder="Ej. Minera del Norte S.A.C."
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-[#E63C46]/30"
              />
            </div>
            <div>
              <label className="text-[11px] font-[700] uppercase tracking-wide text-slate-500 block mb-1.5">
                Correo electrónico *
              </label>
              <input
                type="email"
                value={clienteForm.email}
                onChange={(e) => actualizarCampo('email', e.target.value)}
                placeholder="Ej. juan.perez@empresa.com"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-[#E63C46]/30"
              />
            </div>
            <div>
              <label className="text-[11px] font-[700] uppercase tracking-wide text-slate-500 block mb-1.5">
                Teléfono / WhatsApp *
              </label>
              <input
                value={clienteForm.telefono}
                onChange={(e) => actualizarCampo('telefono', e.target.value)}
                placeholder="Ej. 999 999 999"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-[#E63C46]/30"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="text-[11px] font-[700] uppercase tracking-wide text-slate-500 block mb-1.5">
                Mensaje o requerimiento
              </label>
              <textarea
                value={clienteForm.mensaje}
                onChange={(e) => actualizarCampo('mensaje', e.target.value)}
                rows={3}
                placeholder="Cuéntanos sobre tu proyecto, fechas estimadas, condiciones especiales..."
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-[#E63C46]/30 resize-none"
              />
            </div>
          </div>

          {errorEnvio && (
            <div className="mt-4 bg-red-50 border border-red-200 text-red-700 text-xs font-[600] rounded-xl p-3.5">
              {errorEnvio}
            </div>
          )}
          {mensajeGuardado && (
            <div className="mt-4 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-[600] rounded-xl p-3.5">
              {mensajeGuardado}
            </div>
          )}
        </section>

        {/* 9. ACCIONES FINALES & TICKET DE ATENCIÓN */}
        {enviada ? (
          <section className="bg-white rounded-[24px] border border-emerald-200 p-8 sm:p-10 text-slate-900 shadow-xl text-center space-y-6 max-w-2xl mx-auto">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div>
              <span className="text-[11px] font-[800] text-emerald-600 uppercase tracking-widest bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 inline-block mb-2">
                Solicitud Registrada Exitosamente
              </span>
              <h3 className="text-2xl sm:text-3xl font-[800] font-spartan text-slate-900 uppercase tracking-tight">
                ¡Gracias, {nombreCliente || 'por tu solicitud'}!
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-md mx-auto">
                Hemos recibido tu pedido y asignado un Ticket de Atención Comercial directo para seguimiento.
              </p>
            </div>

            {/* VISTA DEL TICKET DE ATENCIÓN DE COTIZACIÓN */}
            {ticketGenerado && (
              <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 text-left space-y-3 font-poppins">
                <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                  <div>
                    <span className="text-[10px] font-[700] text-slate-400 uppercase tracking-wider block">Número de Ticket</span>
                    <span className="text-base font-[800] text-[#162B4D] font-mono">{ticketGenerado.codigo}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-[700] text-slate-400 uppercase tracking-wider block">Fecha & Hora</span>
                    <span className="text-xs font-[700] text-slate-700">{ticketGenerado.fecha}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 block font-[600]">Solicitante:</span>
                    <span className="font-[700] text-slate-800">{clienteForm.nombre}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-[600]">Correo de Contacto:</span>
                    <span className="font-[700] text-slate-800 truncate block">{clienteForm.email}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-[600]">Teléfono / WhatsApp:</span>
                    <span className="font-[700] text-slate-800">{clienteForm.telefono}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-[600]">Equipos Solicitados:</span>
                    <span className="font-[700] text-[#E63C46]">{ticketGenerado.items} unidad(es)</span>
                  </div>
                </div>

                {/* INSTRUCCIÓN INTELIGENTE DE PAGO & WHATSAPP */}
                <div className="mt-3 p-3.5 bg-amber-50/90 border border-amber-200/80 rounded-xl text-xs space-y-1">
                  <span className="font-[800] text-amber-900 flex items-center gap-1.5 text-[11px] uppercase tracking-wide">
                    📌 Importante para continuar con la reserva y despacho:
                  </span>
                  <p className="text-amber-800 text-[11px] font-[500] leading-snug">
                    Para confirmar y programar el flete/despacho de tus equipos, debes realizar la transferencia a nuestras cuentas bancarias corporativas (BBVA, Interbank o Banco de la Nación) o coordinar directamente por WhatsApp con tu código de ticket.
                  </p>
                </div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <Link
                href={`/seguimiento?ticket=${ticketGenerado?.codigo || ''}`}
                className="w-full sm:w-auto px-6 py-3.5 bg-[#264772] hover:bg-[#1d385c] text-white rounded-xl text-xs font-[800] uppercase tracking-wider shadow-lg flex items-center justify-center gap-2 transition-all"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Rastrear Pedido & Pagar</span>
              </Link>
              <a
                href={`https://wa.me/51968285032?text=${encodeURIComponent(
                  `Hola HT RENT, acabo de enviar la cotización con el Ticket ${ticketGenerado?.codigo || ''}. Quisiera coordinar detalles.`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto px-6 py-3.5 bg-[#25D366] hover:bg-[#20bd5a] text-white rounded-xl text-xs font-[800] uppercase tracking-wider shadow-lg flex items-center justify-center gap-2 transition-all"
              >
                <span>Consultar por WhatsApp</span>
              </a>
              <button
                onClick={() => {
                  setEnviada(false);
                }}
                className="w-full sm:w-auto px-6 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-[800] uppercase tracking-wider transition-all"
              >
                Nueva Cotización
              </button>
            </div>
          </section>
        ) : (
          <section className="bg-[#162B4D] rounded-[24px] p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-6 border border-slate-700/50">
            <div>
              <h3 className="text-lg sm:text-xl font-[800] font-spartan text-white uppercase tracking-tight">
                ¿Listo para enviar tu solicitud?
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 mt-1">
                Completa tus datos y envía la cotización al área comercial. Recibirás respuesta por correo o WhatsApp.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={guardarBorrador}
                className="px-4 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-[700] transition-all"
              >
                Guardar Borrador
              </button>
              <button
                onClick={enviarSolicitud}
                disabled={enviando}
                className="px-6 py-3 bg-[#E63C46] hover:bg-[#C92A36] disabled:opacity-60 disabled:cursor-not-allowed text-white rounded-xl text-xs font-[800] shadow-lg shadow-[#E63C46]/30 transition-all flex items-center gap-2"
              >
                {enviando ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Enviando…</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Enviar Solicitud de Cotización</span>
                  </>
                )}
              </button>
            </div>
          </section>
        )}

      </div>

      {/* MODAL DETALLE DEL ÍTEM SELECCIONADO */}
      {modalDetalleItem && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-[24px] max-w-2xl w-full p-6 sm:p-8 shadow-2xl space-y-6 relative animate-in fade-in zoom-in duration-200">
            <button
              onClick={() => setModalDetalleItem(null)}
              className="absolute top-5 right-5 p-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <span className={`px-3 py-1 rounded-full text-[10px] font-[800] text-white uppercase ${tipoBadgeClass(modalDetalleItem.tipo)}`}>
                {tipoLabel(modalDetalleItem.tipo)}
              </span>
              <span className="text-xs font-[700] text-slate-500">Sede {modalDetalleItem.ubicacion || 'Piura'}</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-6 items-start">
              <div className="sm:col-span-5 relative h-56 bg-slate-100 rounded-[16px] overflow-hidden border border-slate-200 shrink-0">
                <img
                  src={imagenCompleta(modalDetalleItem.imagenUrl)}
                  alt={modalDetalleItem.nombre}
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="sm:col-span-7 space-y-4">
                <h3 className="font-[800] text-slate-900 text-lg leading-snug">
                  {modalDetalleItem.nombre}
                </h3>
                <p className="text-xs text-slate-600 font-normal leading-relaxed max-h-36 overflow-y-auto pr-1">
                  {modalDetalleItem.descripcion || 'Equipo de alta confiabilidad inspeccionado para proyectos de ingeniería e industria.'}
                </p>

                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 font-[700] uppercase block">Precio Unitario</span>
                    <span className="text-xl font-[800] text-[#162B4D]">
                      S/ {modalDetalleItem.precio > 0 ? modalDetalleItem.precio.toFixed(2) : 'Cotización'}
                      {modalDetalleItem.unidad && <span className="text-xs text-slate-500 font-[600] ml-1">{modalDetalleItem.unidad}</span>}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 font-[700] uppercase block">Cantidad</span>
                    <span className="text-lg font-[800] text-slate-800">{modalDetalleItem.cantidad} Unid.</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  removeItem(modalDetalleItem.id);
                  setModalDetalleItem(null);
                }}
                className="inline-flex items-center gap-1.5 text-xs font-[800] text-red-600 hover:text-red-800 transition-colors cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                Quitar de la Cotización
              </button>
              <button
                type="button"
                onClick={() => setModalDetalleItem(null)}
                className="px-6 py-2.5 bg-[#162B4D] hover:bg-[#10203B] text-white text-xs font-[800] rounded-xl transition-all cursor-pointer shadow-md"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </main>
  );
}
