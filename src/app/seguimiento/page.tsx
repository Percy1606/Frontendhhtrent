'use client';
import React, { useState, useEffect, Suspense } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import WhatsappWidget from '@/components/WhatsappWidget';
import {
  Search,
  CheckCircle2,
  Clock,
  Truck,
  ShieldCheck,
  Building2,
  FileText,
  Copy,
  Check,
  ChevronRight,
  Loader2,
  AlertCircle,
  ArrowRight,
  QrCode,
  CreditCard,
  Send,
  MapPin,
  Calendar,
  Layers,
} from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { apiFetch, imagenCompleta } from '@/lib/api';
import { toast } from 'sonner';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatPEN } from '@/lib/api';

interface PedidoTracking {
  codigoTicket: string;
  clienteNombre: string;
  clienteEmpresa?: string;
  clienteEmail: string;
  clienteTelefono: string;
  fechaCreacion: string;
  estado: string;
  montoTotal?: number;
  proformaConfig?: any;
  metodoPago?: string;
  comprobanteUrl?: string;
  datosAlquiler?: {
    numeroContrato: string;
    fechaInicio: string;
    fechaFin: string;
    diasRestantes: number;
    estadoContrato: string;
  } | null;
  items: {
    nombre: string;
    cantidad: number;
    tipo: 'ALQUILER' | 'VENTA' | 'PROYECTO';
    imagenUrl?: string;
    precio?: number;
  }[];
}

function SeguimientoContent() {
  const searchParams = useSearchParams();
  const initialTicket = searchParams.get('ticket') || '';

  const [ticketInput, setTicketInput] = useState(initialTicket);
  const [buscando, setBuscando] = useState(false);
  const [errorTracking, setErrorTracking] = useState<string | null>(null);
  const [pedido, setPedido] = useState<PedidoTracking | null>(null);
  const [showDetalle, setShowDetalle] = useState(false);

  const [copiadoBcp, setCopiadoBcp] = useState(false);
  const [copiadoBbva, setCopiadoBbva] = useState(false);
  const [copiadoYape, setCopiadoYape] = useState(false);

  const [metodoSeleccionado, setMetodoSeleccionado] = useState<'TRANSFERENCIA' | 'YAPE'>('TRANSFERENCIA');
  const [voucherSubido, setVoucherSubido] = useState(false);
  const [subiendoVoucher, setSubiendoVoucher] = useState(false);

  const buscarPedido = async (codigo: string) => {
    if (!codigo.trim()) {
      setErrorTracking('Ingresa un número de ticket o RUC.');
      return;
    }
    setBuscando(true);
    setErrorTracking(null);

    try {
      // Intentar consulta al backend
      const cleanTicket = codigo.trim().toUpperCase();
      const res = await apiFetch<any>(`/cotizaciones/track/${encodeURIComponent(cleanTicket)}`);
      if (res && res.codigoTicket) {
        setPedido(res);
      } else {
        throw new Error('NotFound');
      }
    } catch {
      // Simulación fallback si el ticket fue generado localmente recién
      const cleanTicket = codigo.trim().toUpperCase();
      const demoDate = new Date().toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' });

      setPedido({
        codigoTicket: cleanTicket.startsWith('TCK-') ? cleanTicket : `TCK-${cleanTicket}`,
        clienteNombre: 'Cliente Registrado',
        clienteEmpresa: 'Empresa Industrial',
        clienteEmail: 'cliente@empresa.pe',
        clienteTelefono: '+51 920 081 628',
        fechaCreacion: demoDate,
        estado: 'PENDIENTE',
        montoTotal: 7150.0,
        items: [
          {
            nombre: 'LS Electric Variador de Frecuencia G100 15HP',
            cantidad: 2,
            tipo: 'ALQUILER',
            imagenUrl: 'https://images.unsplash.com/photo-1581092335397-9583fe92d232?q=80&w=800',
            precio: 1800.0,
          },
          {
            nombre: 'Cámara Termográfica Fluke TiS60+',
            cantidad: 1,
            tipo: 'ALQUILER',
            imagenUrl: 'https://images.unsplash.com/photo-1581092580497-e0d23cbdf1dc?q=80&w=800',
            precio: 2200.0,
          },
          {
            nombre: 'Alicate Pelacable Automático 8" Truper',
            cantidad: 3,
            tipo: 'VENTA',
            imagenUrl: 'https://images.unsplash.com/photo-1504148455328-c376907d081c?q=80&w=800',
            precio: 450.0,
          },
        ],
      });
    } finally {
      setBuscando(false);
    }
  };

  useEffect(() => {
    if (initialTicket) {
      buscarPedido(initialTicket);
    }
  }, [initialTicket]);

  const copiarTexto = (text: string, setter: (val: boolean) => void) => {
    navigator.clipboard.writeText(text);
    setter(true);
    toast.success('Copiado al portapapeles');
    setTimeout(() => setter(false), 2500);
  };

  const pasosEstado = [
    { key: 'PENDIENTE', titulo: 'Cotización Recibida', desc: 'En evaluación de precios' },
    { key: 'COTIZADA', titulo: 'Cotización Lista', desc: 'Precios asignados por HHTRENT' },
    { key: 'APROBADA', titulo: 'Pago Verificado', desc: 'Aprobado por finanzas' },
    { key: 'DESPACHADO', titulo: 'Producto Entregado', desc: 'Equipo o pedido entregado con éxito' },
    { key: 'RECHAZADA', titulo: 'Cancelada', desc: 'Cotización desestimada' },
  ];

  const getPasoActualIndex = (estado: string) => {
    switch (estado) {
      case 'PENDIENTE': return 0;
      case 'COTIZADA': return 1;
      case 'APROBADA': return 2;
      case 'DESPACHADO': return 3;
      case 'RECHAZADA': return 4;
      default: return 0;
    }
  };

  
  const descargarPDF = async () => {
    if (!pedido || !pedido.proformaConfig) return;
    try {
      const loadingToast = toast.loading('Generando proforma...');
      const config = pedido.proformaConfig;
      
      const doc = new jsPDF();
      const primaryColor: [number, number, number] = [22, 43, 77];
      
      try {
        const response = await fetch('/img/hhtrentlogo.jpg');
        const blob = await response.blob();
        const reader = new FileReader();
        const base64data = await new Promise<string>((resolve) => {
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(blob);
        });
        doc.addImage(base64data, 'JPEG', 14, 15, 45, 12);
      } catch (e) {
        doc.setFontSize(24);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
        doc.text('HHTRENT', 14, 22);
      }
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 116, 139);
      doc.text('Especialistas en Proyectos Eléctricos y Alquiler', 14, 32);
      doc.text('RUC: 20123456789', 14, 37);
      doc.text('Piura, Perú', 14, 42);

      doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.roundedRect(130, 15, 65, 25, 3, 3, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('PROFORMA', 162.5, 24, { align: 'center' });
      doc.setFontSize(12);
      doc.text('Nº ' + pedido.codigoTicket, 162.5, 32, { align: 'center' });

      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.5);
      doc.line(14, 47, 196, 47);

      doc.setFontSize(9);
      doc.setTextColor(15, 23, 42);
      const startY = 54;
      const lh = 6;
      
      doc.setFont('helvetica', 'bold'); doc.text('CLIENTE:', 14, startY);
      doc.setFont('helvetica', 'normal'); doc.text(pedido.clienteEmpresa || pedido.clienteNombre, 40, startY);
      doc.setFont('helvetica', 'bold'); doc.text('ATENCIÓN:', 14, startY + lh);
      doc.setFont('helvetica', 'normal'); doc.text(config.atencion || '-', 40, startY + lh);
      doc.setFont('helvetica', 'bold'); doc.text('RUC:', 14, startY + lh*2);
      doc.setFont('helvetica', 'normal'); doc.text(config.ruc || '-', 40, startY + lh*2);
      doc.setFont('helvetica', 'bold'); doc.text('DIRECCIÓN:', 14, startY + lh*3);
      doc.setFont('helvetica', 'normal'); doc.text(config.direccion || '-', 40, startY + lh*3);

      doc.setFont('helvetica', 'bold'); doc.text('FECHA:', 120, startY);
      doc.setFont('helvetica', 'normal'); doc.text(pedido.fechaCreacion, 150, startY);
      doc.setFont('helvetica', 'bold'); doc.text('MONEDA:', 120, startY + lh);
      doc.setFont('helvetica', 'normal'); doc.text(config.moneda || 'SOLES (S/)', 150, startY + lh);
      doc.setFont('helvetica', 'bold'); doc.text('COND. VENTA:', 120, startY + lh*2);
      doc.setFont('helvetica', 'normal'); doc.text(config.condVenta || 'AL CONTADO', 150, startY + lh*2);
      doc.setFont('helvetica', 'bold'); doc.text('VALIDEZ:', 120, startY + lh*3);
      doc.setFont('helvetica', 'normal'); doc.text(config.validez || '7 DÍAS', 150, startY + lh*3);

      let totalBruto = 0;
      const tableData = pedido.items.map((item: any, i: number) => {
        const pUnit = item.precio || 0;
        const pTot = pUnit * item.cantidad;
        totalBruto += pTot;
        return [
          i + 1,
          item.codigoInterno || '-',
          item.nombre,
          item.modelo || '-',
          item.marca || '-',
          item.cantidad,
          item.unidad || 'Und',
          formatPEN(pUnit),
          formatPEN(pTot)
        ];
      });

      autoTable(doc, {
        startY: 85,
        head: [['No', 'Código', 'Descripción', 'Modelo', 'Marca', 'Cant', 'Un.', 'Prec. Unit.', 'Prec. Total']],
        body: tableData,
        theme: 'grid',
        headStyles: { fillColor: primaryColor, textColor: 255, fontSize: 8, fontStyle: 'bold', halign: 'center' },
        bodyStyles: { fontSize: 7, textColor: 50 },
        columnStyles: {
          0: { halign: 'center', cellWidth: 8 },
          1: { halign: 'center', cellWidth: 16 },
          2: { cellWidth: 50 },
          3: { cellWidth: 20 },
          4: { cellWidth: 20 },
          5: { halign: 'center', cellWidth: 10 },
          6: { halign: 'center', cellWidth: 10 },
          7: { halign: 'right', cellWidth: 24 },
          8: { halign: 'right', cellWidth: 24 }
        },
        alternateRowStyles: { fillColor: [250, 250, 250] },
        margin: { left: 14, right: 14 }
      });

      const finalY = (doc as any).lastAutoTable.finalY + 10;
      const descuento = Number(config.descuento) || 0;
      const flete = Number(config.flete) || 0;
      const embalaje = Number(config.embalaje) || 0;
      const totalNeto = totalBruto - descuento;
      const igv = totalNeto * ((config.igvPercent || 18) / 100);
      const total = totalNeto + igv + flete + embalaje;

      doc.setDrawColor(226, 232, 240);
      doc.setFillColor(248, 250, 252);
      doc.roundedRect(120, finalY, 76, 54, 2, 2, 'FD');

      doc.setFontSize(9);
      let tY = finalY + 6;
      const tlH = 6.5;

      doc.setFont('helvetica', 'normal'); doc.text('TOTAL BRUTO:', 125, tY); doc.text(formatPEN(totalBruto), 190, tY, { align: 'right' });
      tY += tlH; doc.text('DESCUENTOS:', 125, tY); doc.text('- ' + formatPEN(descuento), 190, tY, { align: 'right' });
      tY += tlH; doc.text('TOTAL NETO:', 125, tY); doc.text(formatPEN(totalNeto), 190, tY, { align: 'right' });
      tY += tlH; doc.text('FLETE:', 125, tY); doc.text(formatPEN(flete), 190, tY, { align: 'right' });
      tY += tlH; doc.text('EMBALAJE:', 125, tY); doc.text(formatPEN(embalaje), 190, tY, { align: 'right' });
      tY += tlH; doc.text('I.G.V.:', 125, tY); doc.text(formatPEN(igv), 190, tY, { align: 'right' });
      
      tY += 8;
      doc.setFont('helvetica', 'bold'); doc.text('TOTAL COTIZACIÓN:', 125, tY);
      doc.text(formatPEN(total), 190, tY, { align: 'right' });

      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold'); doc.text('CUENTAS BANCARIAS', 14, finalY + 4);
      doc.setFont('helvetica', 'normal');
      doc.text('Banco de CrÃ©dito del PerÃº (BCP)', 14, finalY + 10);
      doc.text('Cta Corriente: 191-1234567-0-12', 14, finalY + 14);
      doc.text('CCI: 002-191-1234567012-12', 14, finalY + 18);
      
      doc.save(pedido.codigoTicket + '-HHTRENT.pdf');
      toast.dismiss(loadingToast);
      toast.success('PDF descargado exitosamente');
    } catch(e) {
      toast.error('Error al generar PDF');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 pt-[96px] pb-16 space-y-8 font-spartan">
      {/* BREADCRUMB */}
      <div className="flex items-center gap-2 text-xs font-[600] text-slate-500">
        <Link href="/" className="hover:text-[#264772] transition-colors">Inicio</Link>
        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
        <span className="text-slate-900 font-[700]">Seguimiento de Pedido & Pago</span>
      </div>

      {/* ENCABEZADO Y BUSCADOR */}
      <div className="bg-[#264772] rounded-[24px] p-6 sm:p-10 text-white shadow-xl relative overflow-hidden">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 80% 20%, #fff 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
        <div className="max-w-2xl relative z-10 space-y-4">
          <span className="bg-white/10 border border-white/20 text-white text-[10px] font-[800] uppercase tracking-widest px-3 py-1 rounded-full inline-block">
            Módulo de Rastreo B2B / B2C
          </span>
          <h1 className="text-2xl sm:text-4xl font-[800] leading-tight tracking-tight">
            Sigue tu Pedido y Realiza tu Pago
          </h1>
          <p className="text-slate-200 text-xs sm:text-sm font-[500] leading-relaxed">
            Ingresa tu código de Ticket (ej: <span className="font-[700] text-white">TCK-2026-0089</span>) para verificar el estado de calibración, despacho e información bancaria para transferencias o Yape.
          </p>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              buscarPedido(ticketInput);
            }}
            className="flex flex-col sm:flex-row gap-3 pt-2"
          >
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Ingresa tu N° de Ticket o RUC..."
                value={ticketInput}
                onChange={(e) => setTicketInput(e.target.value)}
                className="w-full pl-11 pr-4 py-3.5 bg-white text-slate-900 rounded-[14px] text-xs font-[700] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#E63C46]"
              />
            </div>
            <button
              type="submit"
              disabled={buscando}
              className="px-7 py-3.5 bg-[#E63C46] hover:bg-[#C92A36] text-white text-xs font-[800] uppercase tracking-wider rounded-[14px] shadow-lg shadow-[#E63C46]/30 transition-all flex items-center justify-center gap-2"
            >
              {buscando ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Rastrear</span>}
            </button>
          </form>
          {errorTracking && <p className="text-xs font-[600] text-red-300">{errorTracking}</p>}
        </div>
      </div>

      {pedido && (
        <div className="space-y-8 animate-in fade-in duration-300">
          {/* LÍNEA DE TIEMPO DEL ESTADO */}
          <div className="bg-white rounded-[24px] border border-slate-200/80 p-6 sm:p-8 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-4 gap-2">
              <div>
                <span className="text-[11px] font-[800] uppercase tracking-wider text-slate-400">Estado del Pedido</span>
                <div className="flex items-center gap-2 mt-0.5">
                  <h2 className="text-lg font-[800] text-slate-900">{pedido.codigoTicket}</h2>
                  <button
                    onClick={() => setShowDetalle((v) => !v)}
                    className="inline-flex items-center gap-1 text-[10px] font-[800] px-2.5 py-1 rounded-full border transition-all cursor-pointer bg-[#264772] text-white border-[#264772] hover:bg-[#1d385c] uppercase tracking-wide"
                  >
                    <Layers className="w-3 h-3" />
                    {showDetalle ? 'Ocultar' : `Ver detalle (${pedido.items.length})`}
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`text-xs px-3 py-1 rounded-full font-[800] border ${
                  pedido.estado === 'PENDIENTE'
                    ? 'bg-amber-50 text-amber-700 border-amber-200'
                    : pedido.estado === 'APROBADA'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : pedido.estado === 'DESPACHADO'
                    ? 'bg-purple-50 text-purple-700 border-purple-200'
                    : 'bg-red-50 text-red-700 border-red-200'
                }`}>
                  {pasosEstado[getPasoActualIndex(pedido.estado)].titulo}
                </span>
                <span className="text-xs text-slate-400 font-[600]">{pedido.fechaCreacion}</span>
              </div>
            </div>

            {/* STEPPER */}
            <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-3 gap-3">
              {pasosEstado
                .filter((p) => p.key !== 'RECHAZADA' || pedido.estado === 'RECHAZADA')
                .map((paso, idx) => {
                  const actualIdx = getPasoActualIndex(pedido.estado);
                  const completado = idx <= actualIdx;
                  const esActual = idx === actualIdx;

                  return (
                    <div
                      key={paso.key}
                      className={`p-4 rounded-[18px] border transition-all text-left space-y-2 ${
                        completado
                          ? 'bg-emerald-50/80 text-slate-900 border-emerald-300/80 shadow-sm'
                          : 'bg-slate-50/50 text-slate-400 border-slate-100 opacity-60'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className={`text-[11px] font-[800] rounded-full w-6 h-6 flex items-center justify-center ${
                          completado
                            ? 'bg-emerald-600 text-white shadow-sm'
                            : 'bg-slate-200 text-slate-600'
                        }`}>
                          {idx + 1}
                        </span>
                        {completado && (
                          <span className="flex items-center gap-1 bg-emerald-600 text-white text-[10px] font-[800] px-2 py-0.5 rounded-full shadow-xs">
                            <CheckCircle2 className="w-3 h-3 text-white" />
                            Completado
                          </span>
                        )}
                      </div>
                      <div>
                        <p className={`text-xs sm:text-sm font-[800] leading-snug ${completado ? 'text-emerald-950' : 'text-slate-700'}`}>
                          {paso.titulo}
                        </p>
                        <p className={`text-[11px] mt-0.5 ${completado ? 'text-emerald-700 font-[600]' : 'text-slate-400'}`}>
                          {paso.desc}
                        </p>
                      </div>
                    </div>
                  );
                })}
            </div>

            {/* ALQUILER ACTIVO - CONTROL DE DÍAS Y VIGENCIA */}
            {pedido.datosAlquiler && (
              <div className="bg-gradient-to-br from-[#264772] to-[#1a3252] text-white p-5 rounded-[20px] shadow-md space-y-4">
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-amber-300" />
                    <div>
                      <span className="text-[10px] font-[800] uppercase tracking-wider text-slate-300 block">
                        Contrato de Alquiler Vincular
                      </span>
                      <h4 className="font-[800] text-sm text-white">{pedido.datosAlquiler.numeroContrato}</h4>
                    </div>
                  </div>
                  <span className="bg-amber-400/20 text-amber-300 border border-amber-300/30 text-[10px] font-[800] px-3 py-1 rounded-full uppercase">
                    Alquiler Activo
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="bg-white/10 backdrop-blur p-3 rounded-xl border border-white/10">
                    <span className="text-[10px] text-slate-300 block">Inicio del Alquiler</span>
                    <span className="font-[800] text-sm text-white mt-0.5 block">{pedido.datosAlquiler.fechaInicio}</span>
                  </div>
                  <div className="bg-white/10 backdrop-blur p-3 rounded-xl border border-white/10">
                    <span className="text-[10px] text-slate-300 block">Fecha de Devolución</span>
                    <span className="font-[800] text-sm text-amber-300 mt-0.5 block">{pedido.datosAlquiler.fechaFin}</span>
                  </div>
                  <div className="bg-white/10 backdrop-blur p-3 rounded-xl border border-white/10 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-300 block">Tiempo Restante</span>
                      <span className="font-[800] text-base text-emerald-300">
                        {pedido.datosAlquiler.diasRestantes} día(s)
                      </span>
                    </div>
                    <Clock className="w-6 h-6 text-emerald-300/80" />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* RESUMEN DE LO QUE PIDIÓ EL CLIENTE - solo si showDetalle */}
          {showDetalle && (
          <div className="bg-white rounded-[24px] border border-slate-200/80 p-6 sm:p-8 shadow-sm space-y-5 animate-in fade-in duration-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
              <div>
                <span className="text-[11px] font-[800] uppercase tracking-wider text-slate-400 block">Detalle del Pedido</span>
                <h3 className="text-base font-[800] text-slate-900">Productos y servicios solicitados</h3>
              </div>
              <div className="flex flex-col sm:items-end gap-1">
                <span className="text-[10px] font-[700] text-slate-400 uppercase">Cliente</span>
                <span className="font-[800] text-slate-800 text-sm">{pedido.clienteNombre}</span>
                {pedido.clienteEmpresa && (
                  <span className="text-[11px] text-slate-500 font-[600]">{pedido.clienteEmpresa}</span>
                )}
                <span className="text-[10px] font-[800] bg-slate-100 text-slate-600 px-2.5 py-0.5 rounded-full mt-0.5">
                  {pedido.items.length} {pedido.items.length === 1 ? 'producto' : 'productos'}
                </span>
              </div>
            </div>

            <div className={`space-y-3 ${pedido.items.length > 5 ? 'max-h-[440px] overflow-y-auto pr-1' : ''}`}>
              {pedido.items.map((item, idx) => (
                <div key={idx} className="flex items-center gap-4 p-3.5 bg-slate-50 rounded-[16px] border border-slate-100">
                  {item.imagenUrl && (
                    <img
                      src={imagenCompleta(item.imagenUrl)}
                      alt={item.nombre}
                      className="w-14 h-14 object-cover rounded-xl border border-slate-200 shrink-0 bg-white"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-[800] text-slate-900 leading-snug">{item.nombre}</p>
                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                      <span className={`text-[10px] font-[800] px-2 py-0.5 rounded-full uppercase text-white ${
                        item.tipo === 'ALQUILER' ? 'bg-[#264772]' : item.tipo === 'VENTA' ? 'bg-emerald-600' : 'bg-amber-500'
                      }`}>
                        {item.tipo === 'ALQUILER' ? 'Alquiler' : item.tipo === 'VENTA' ? 'Venta' : 'Proyecto'}
                      </span>
                      <span className="inline-flex items-center gap-1 text-[11px] font-[800] bg-white border border-slate-200 text-slate-700 px-2.5 py-0.5 rounded-full">
                        <span className="text-slate-400 font-[600] text-[10px]">Cant.</span>
                        {item.cantidad}
                      </span>
                    </div>
                  </div>
                  {pedido.estado !== 'PENDIENTE' && item.precio != null && (
                    <div className="text-right shrink-0">
                      <span className="text-[10px] text-slate-400 font-[600] block">Subtotal</span>
                      <span className="font-[800] text-slate-900 text-sm">
                        S/ {(item.precio * item.cantidad).toFixed(2)}
                      </span>
                      {item.cantidad > 1 && (
                        <span className="text-[10px] text-slate-400 font-[500] block">
                          S/ {item.precio.toFixed(2)} c/u
                        </span>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {pedido.estado !== 'PENDIENTE' && pedido.montoTotal != null && (
              <div className="pt-3 border-t border-slate-100 space-y-2">
                {pedido.proformaConfig && (
                  <>
                    <div className="flex justify-between text-sm text-slate-500 font-[600]">
                      <span>Subtotal</span>
                      <span>S/ {(pedido.items.reduce((acc, i) => acc + ((i.precio||0) * i.cantidad), 0)).toFixed(2)}</span>
                    </div>
                    {Number(pedido.proformaConfig.descuento) > 0 && (
                      <div className="flex justify-between text-sm text-red-500 font-[600]">
                        <span>Descuento</span>
                        <span>-S/ {Number(pedido.proformaConfig.descuento).toFixed(2)}</span>
                      </div>
                    )}
                    {Number(pedido.proformaConfig.flete) > 0 && (
                      <div className="flex justify-between text-sm text-slate-500 font-[600]">
                        <span>Flete</span>
                        <span>S/ {Number(pedido.proformaConfig.flete).toFixed(2)}</span>
                      </div>
                    )}
                    {Number(pedido.proformaConfig.embalaje) > 0 && (
                      <div className="flex justify-between text-sm text-slate-500 font-[600]">
                        <span>Embalaje</span>
                        <span>S/ {Number(pedido.proformaConfig.embalaje).toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm text-slate-500 font-[600]">
                      <span>I.G.V. ({pedido.proformaConfig.igvPercent || 18}%)</span>
                      <span>S/ {(pedido.montoTotal - (pedido.items.reduce((acc, i) => acc + ((i.precio||0) * i.cantidad), 0) - (Number(pedido.proformaConfig.descuento)||0) + (Number(pedido.proformaConfig.flete)||0) + (Number(pedido.proformaConfig.embalaje)||0))).toFixed(2)}</span>
                    </div>
                  </>
                )}
                <div className="flex items-center justify-between pt-2 border-t border-slate-100 mt-2">
                  <span className="text-xs font-[800] text-slate-900 uppercase tracking-wider">TOTAL A PAGAR</span>
                  <span className="text-xl font-[800] text-[#E63C46]">S/ {pedido.montoTotal.toFixed(2)}</span>
                </div>
              </div>
            )}
          </div>
          )}

          {/* MÉTODOS DE PAGO O GUÍA DE ENTREGA SEGÚN ESTADO */}
          {pedido.estado === 'PENDIENTE' ? (
              <div className="bg-white rounded-[24px] border border-amber-200/80 p-8 shadow-sm space-y-6 text-center max-w-4xl mx-auto">
                <div className="w-16 h-16 rounded-full bg-amber-100 border-4 border-amber-50 text-amber-600 flex items-center justify-center mx-auto shadow-sm">
                  <Clock className="w-8 h-8" />
                </div>
                <div className="space-y-2">
                  <span className="text-[10px] font-[800] uppercase tracking-widest text-amber-700 bg-amber-50 border border-amber-200 px-3.5 py-1 rounded-full inline-block">
                    Solicitud en Revisión
                  </span>
                  <h3 className="text-2xl font-[800] text-slate-900 tracking-tight">Estamos valorizando tu cotización</h3>
                  <p className="text-slate-600 text-xs sm:text-sm max-w-xl mx-auto font-[500] leading-relaxed">
                    Nuestros especialistas están evaluando la disponibilidad y precios de los equipos solicitados. 
                    En breve, esta página se actualizará con tu cotización detallada.
                  </p>
                </div>
              </div>
            ) : pedido.estado === 'COTIZADA' ? (
              <div className="bg-white rounded-[24px] border border-blue-200/80 p-8 shadow-sm space-y-6 text-center max-w-4xl mx-auto">
                <div className="w-16 h-16 rounded-full bg-blue-100 border-4 border-blue-50 text-blue-600 flex items-center justify-center mx-auto shadow-sm">
                  <FileText className="w-8 h-8" />
                </div>
                <div className="space-y-2">
                  <span className="text-[10px] font-[800] uppercase tracking-widest text-blue-700 bg-blue-50 border border-blue-200 px-3.5 py-1 rounded-full inline-block">
                    Cotización Lista
                  </span>
                  <h3 className="text-2xl font-[800] text-slate-900 tracking-tight">Tu proforma está lista para revisión</h3>
                  <p className="text-slate-600 text-xs sm:text-sm max-w-xl mx-auto font-[500] leading-relaxed">
                    Ya hemos asignado los precios a los equipos solicitados. Puedes ver los detalles en la tabla superior o contactarnos para consultas.
                  </p>
                </div>
                
                <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
                  <button 
                    onClick={async () => {
                      try {
                        const loadingToast = toast.loading('Aprobando cotización...');
                        await apiFetch(`/cotizaciones/${pedido.codigoTicket.replace('TCK-', '')}/estado`, {
                          method: 'PATCH',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ estado: 'APROBADA' })
                        });
                        toast.dismiss(loadingToast);
                        toast.success('¡Cotización Aprobada Exitosamente!');
                        window.location.reload();
                      } catch(e) {
                        toast.error('Error al aprobar cotización');
                      }
                    }}
                    className="px-8 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-[800] shadow-md transition-all flex items-center gap-2"
                  >
                    <Check className="w-5 h-5" />
                    Aprobar Cotización
                  </button>
                </div>
              </div>) : (
            /* SI EL PAGO YA FUE VERIFICADO O DESPACHADO -> PANEL DE CONFIRMACIÓN Y DESPACHO INTELIGENTE */
            <div className="bg-white rounded-[24px] border border-emerald-200/80 p-8 shadow-sm space-y-6 text-center max-w-4xl mx-auto">
              <div className="w-16 h-16 rounded-full bg-emerald-100 border-4 border-emerald-50 text-emerald-600 flex items-center justify-center mx-auto shadow-sm">
                {pedido.estado === 'DESPACHADO' ? (
                  <Truck className="w-8 h-8 text-purple-600" />
                ) : (
                  <CheckCircle2 className="w-8 h-8 text-emerald-600" />
                )}
              </div>

              <div className="space-y-2">
                <span className="text-[10px] font-[800] uppercase tracking-widest text-emerald-700 bg-emerald-50 border border-emerald-200 px-3.5 py-1 rounded-full inline-block">
                  {pedido.estado === 'DESPACHADO' ? '📦 Pedido Despachado / Entregado' : '✅ Pago Verificado & Conformidad Técnica'}
                </span>
                <h3 className="text-2xl font-[800] text-slate-900 tracking-tight">
                  {pedido.estado === 'DESPACHADO'
                    ? '¡Tu equipo ha sido entregado en obra con éxito!'
                    : '¡Tu pago ha sido verificado por el área de finanzas!'}
                </h3>
                <p className="text-slate-600 text-xs sm:text-sm max-w-xl mx-auto font-[500] leading-relaxed">
                  {pedido.estado === 'DESPACHADO'
                    ? 'El equipo ya se encuentra operativo bajo las especificaciones técnicas requeridas. Puedes comunicarte con soporte técnico para cualquier consulta de calibración o mantenimiento.'
                    : 'El equipo ha entrado a la fase de inspección, calibración e inicio de despacho. Ya no requieres realizar transferencias adicionales para este requerimiento.'}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 text-left border-t border-slate-100">
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/60 space-y-1">
                  <span className="text-[10px] font-[700] text-slate-400 uppercase block">Ticket de Solicitud</span>
                  <span className="font-[800] text-slate-900 text-sm">{pedido.codigoTicket}</span>
                </div>
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/60 space-y-1">
                  <span className="text-[10px] font-[700] text-slate-400 uppercase block">Titular del Requerimiento</span>
                  <span className="font-[800] text-slate-900 text-sm truncate block">{pedido.clienteNombre}</span>
                </div>
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/60 space-y-1">
                  <span className="text-[10px] font-[700] text-slate-400 uppercase block">Centro de Soporte 24/7</span>
                  <span className="font-[800] text-[#264772] text-sm">+51 968 285 032</span>
                </div>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                <a
                  href={`https://wa.me/51968285032?text=${encodeURIComponent(
                    `Hola HH TRENT, consulto sobre el despacho de mi Ticket ${pedido.codigoTicket}.`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto px-6 py-3 bg-[#25D366] hover:bg-[#20bd5a] text-white rounded-xl text-xs font-[800] uppercase tracking-wider flex items-center justify-center gap-2 shadow-md transition-all"
                >
                  <Send className="w-4 h-4" />
                  <span>Coordinar Despacho / Soporte por WhatsApp</span>
                </a>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function SeguimientoPage() {
  return (
    <main className="min-h-screen bg-[#F8FAFC]">
      <Header />
      <Suspense fallback={<div className="py-32 text-center text-xs font-[700] text-slate-500">Cargando módulo de seguimiento...</div>}>
        <SeguimientoContent />
      </Suspense>
      <Footer />
      <WhatsappWidget />
    </main>
  );
}
