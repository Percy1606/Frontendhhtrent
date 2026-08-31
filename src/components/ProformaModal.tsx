'use client';
import React, { useState, useEffect } from 'react';
import { X, FileDown, Calculator, Loader2 } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatPEN, apiFetch } from '@/lib/api';
import { toast } from 'sonner';

interface ItemCotizacion {
  id: string;
  cantidad: number;
  equipo: {
    id: string;
    codigoInterno: string | null;
    nombre: string;
    precio: number | null;
    imagenUrl: string;
    tipo: string;
    marca?: string | null;
    modelo?: string | null;
    unidad?: string | null;
  };
}

interface Cotizacion {
  id: string;
  clienteNombre: string;
  clienteEmpresa?: string | null;
  clienteEmail: string;
  clienteTelefono: string;
  items: ItemCotizacion[];
  createdAt: string;
}

interface Props {
  cotizacion: Cotizacion;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function ProformaModal({ cotizacion, onClose, onSuccess }: Props) {
  const [guardando, setGuardando] = useState(false);
  // Precios, Cantidades y Moneda por ítem editables
  const [precios, setPrecios] = useState<Record<string, number>>({});
  const [cantidades, setCantidades] = useState<Record<string, number>>({});
  const [monedas, setMonedas] = useState<Record<string, string>>({});
  
  // Datos extra para la proforma
  const [config, setConfig] = useState({
    ruc: '',
    direccion: '',
    atencion: cotizacion.clienteNombre,
    moneda: 'Bimonetaria (Soles / Dólares)',
    condVenta: 'Al Contado',
    validez: '7 días',
    ejecutivo: 'Administrador HHTRENT',
    contactoEjecutivo: 'gerencia@hhtrent.com | 948553419',
    observaciones: '1. Los precios no incluyen flete ni maniobras.\n2. La disponibilidad de los equipos está sujeta a confirmación al momento de la orden.',
    descuento: 0,
    flete: 0,
    embalaje: 0,
    igvPercent: 18,
  });

  // Inicializar precios, cantidades y monedas por ítem
  useEffect(() => {
    const initPrecios: Record<string, number> = {};
    const initCantidades: Record<string, number> = {};
    const initMonedas: Record<string, string> = {};
    cotizacion.items.forEach(item => {
      initPrecios[item.id] = item.equipo.precio || 0;
      initCantidades[item.id] = item.cantidad || 1;
      // Por defecto, equipos de alquiler en PEN y venta en USD o según preferencia
      initMonedas[item.id] = item.equipo.tipo === 'ALQUILER' ? 'PEN' : 'USD';
    });
    setPrecios(initPrecios);
    setCantidades(initCantidades);
    setMonedas(initMonedas);
  }, [cotizacion]);

  const handlePrecioChange = (id: string, value: string) => {
    const num = parseFloat(value) || 0;
    setPrecios(prev => ({ ...prev, [id]: num }));
  };

  const handleCantidadChange = (id: string, value: string) => {
    const num = Math.max(1, parseInt(value, 10) || 1);
    setCantidades(prev => ({ ...prev, [id]: num }));
  };

  const handleMonedaChange = (id: string, value: string) => {
    setMonedas(prev => ({ ...prev, [id]: value }));
  };

  const handleConfigChange = (field: string, value: string | number) => {
    setConfig(prev => ({ ...prev, [field]: value }));
  };

  const formatPENMoney = (val: number) => {
    const num = Number(val) || 0;
    return `S/ ${num.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatUSDMoney = (val: number) => {
    const num = Number(val) || 0;
    return `US$ ${num.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatItemMoney = (val: number, cur: string) => {
    return cur === 'USD' ? formatUSDMoney(val) : formatPENMoney(val);
  };

  // Cálculos bimonetarios independientes
  const itemsPEN = cotizacion.items.filter(it => (monedas[it.id] || (it.equipo.tipo === 'ALQUILER' ? 'PEN' : 'USD')) === 'PEN');
  const itemsUSD = cotizacion.items.filter(it => (monedas[it.id] || (it.equipo.tipo === 'ALQUILER' ? 'PEN' : 'USD')) === 'USD');

  const subtotalPEN = itemsPEN.reduce((acc, it) => acc + ((precios[it.id] || 0) * (cantidades[it.id] || it.cantidad || 1)), 0);
  const subtotalUSD = itemsUSD.reduce((acc, it) => acc + ((precios[it.id] || 0) * (cantidades[it.id] || it.cantidad || 1)), 0);

  const igvPEN = subtotalPEN * (config.igvPercent / 100);
  const igvUSD = subtotalUSD * (config.igvPercent / 100);

  const totalPEN = subtotalPEN + igvPEN;
  const totalUSD = subtotalUSD + igvUSD;

  const tienePEN = itemsPEN.length > 0;
  const tieneUSD = itemsUSD.length > 0;

  const guardarYGenerarPDF = async () => {
    try {
      setGuardando(true);
      
      // Guardar en backend precios, cantidades y monedas actualizadas
      await apiFetch(`/cotizaciones/${cotizacion.id}/valorizar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config: { ...config, monedas }, precios, cantidades })
      });
      
      toast.success('Cotización guardada y valorizada exitosamente');

      const doc = new jsPDF();
      
      // --- COLORES CORPORATIVOS ---
      const primaryColor: [number, number, number] = [22, 43, 77]; // #162B4D
      const accentColor: [number, number, number] = [230, 60, 70]; // #E63C46
    
    // --- CABECERA CORPORATIVA ---
    try {
      const response = await fetch('/img/hhtrentlogo.jpg');
      const blob = await response.blob();
      const reader = new FileReader();
      const base64data = await new Promise<string>((resolve) => {
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(blob);
      });
      doc.addImage(base64data, 'JPEG', 14, 12, 44, 12);
    } catch (e) {
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.text('HHTRENT', 14, 20);
    }
    
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text('Especialistas en Proyectos Eléctricos y Alquiler', 14, 28);
    doc.text('RUC: 20611371692  ·  HH T SOLUCIONA S.A.C.', 14, 33);
    doc.text('Av. Colectora Norte Nro. 509, Urb. Parques del Chipe, Piura', 14, 38);

    // Caja Proforma Superior Derecha
    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.roundedRect(132, 12, 64, 26, 2.5, 2.5, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.text('PROFORMA', 164, 22, { align: 'center' });
    doc.setFontSize(10.5);
    const nroCot = `Nº TCK-${String(cotizacion.id).substring(0, 8).toUpperCase()}`;
    doc.text(nroCot, 164, 30, { align: 'center' });

    // --- LÍNEA SEPARADORA ---
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.4);
    doc.line(14, 43, 196, 43);

    // --- DATOS DEL CLIENTE Y DOCUMENTO (DISTRIBUCIÓN LIMPIA SIN REPETICIÓN) ---
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(14, 46, 182, 32, 2, 2, 'FD');

    doc.setFontSize(8.5);
    doc.setTextColor(71, 85, 105);
    
    // Columna Izquierda (Datos Cliente)
    const cX1 = 18;
    const vX1 = 45;
    let rY1 = 52;
    const rH = 5.2;

    const nombreCliente = cotizacion.clienteNombre || 'Cliente General';
    const empresaCliente = cotizacion.clienteEmpresa && cotizacion.clienteEmpresa.trim() !== nombreCliente.trim()
      ? cotizacion.clienteEmpresa
      : null;

    doc.setFont('helvetica', 'bold'); doc.text('CLIENTE:', cX1, rY1);
    doc.setFont('helvetica', 'normal'); doc.setTextColor(15, 23, 42);
    doc.text(empresaCliente ? `${empresaCliente} (${nombreCliente})` : nombreCliente, vX1, rY1);

    rY1 += rH;
    doc.setTextColor(71, 85, 105);
    doc.setFont('helvetica', 'bold'); doc.text('RUC / DOC:', cX1, rY1);
    doc.setFont('helvetica', 'normal'); doc.setTextColor(15, 23, 42);
    doc.text(config.ruc || '—', vX1, rY1);

    rY1 += rH;
    doc.setTextColor(71, 85, 105);
    doc.setFont('helvetica', 'bold'); doc.text('DIRECCIÓN:', cX1, rY1);
    doc.setFont('helvetica', 'normal'); doc.setTextColor(15, 23, 42);
    doc.text(config.direccion || 'Piura, Perú', vX1, rY1);

    rY1 += rH;
    doc.setTextColor(71, 85, 105);
    doc.setFont('helvetica', 'bold'); doc.text('CONTACTO:', cX1, rY1);
    doc.setFont('helvetica', 'normal'); doc.setTextColor(15, 23, 42);
    doc.text(`${cotizacion.clienteTelefono || '—'}  |  ${cotizacion.clienteEmail || '—'}`, vX1, rY1);

    // Columna Derecha (Condiciones Comerciales)
    const cX2 = 120;
    const vX2 = 150;
    let rY2 = 52;

    doc.setTextColor(71, 85, 105);
    doc.setFont('helvetica', 'bold'); doc.text('FECHA:', cX2, rY2);
    doc.setFont('helvetica', 'normal'); doc.setTextColor(15, 23, 42);
    doc.text(new Date(cotizacion.createdAt).toLocaleDateString('es-PE'), vX2, rY2);

    rY2 += rH;
    doc.setTextColor(71, 85, 105);
    doc.setFont('helvetica', 'bold'); doc.text('COND. PAGO:', cX2, rY2);
    doc.setFont('helvetica', 'normal'); doc.setTextColor(15, 23, 42);
    doc.text(config.condVenta || 'Al Contado', vX2, rY2);

    rY2 += rH;
    doc.setTextColor(71, 85, 105);
    doc.setFont('helvetica', 'bold'); doc.text('VALIDEZ:', cX2, rY2);
    doc.setFont('helvetica', 'normal'); doc.setTextColor(15, 23, 42);
    doc.text(config.validez || '7 días', vX2, rY2);

    rY2 += rH;
    doc.setTextColor(71, 85, 105);
    doc.setFont('helvetica', 'bold'); doc.text('MODALIDAD:', cX2, rY2);
    doc.setFont('helvetica', 'normal'); doc.setTextColor(15, 23, 42);
    doc.text(tienePEN && tieneUSD ? 'Venta y Alquiler (Bimonetaria)' : (tienePEN ? 'Alquiler (Soles S/)' : 'Venta (Dólares US$)'), vX2, rY2);

    // --- TABLA DE ITEMS (DISTRIBUCIÓN TOTAL DE 182mm - SIN PALABRAS DIVIDIDAS) ---
    // Ancho total imprimible: 182mm (Márgenes: Izq 14mm, Der 14mm)
    // 0: N° (8mm)
    // 1: Código (18mm)
    // 2: Descripción (53mm)
    // 3: Tipo (16mm)
    // 4: Moneda (16mm)
    // 5: Cant. (11mm)
    // 6: Un. (10mm)
    // 7: P. Unitario (25mm)
    // 8: P. Total (25mm)
    // Suma: 8 + 18 + 53 + 16 + 16 + 11 + 10 + 25 + 25 = 182mm exacta

    const tableData = cotizacion.items.map((item, i) => {
      const cant = cantidades[item.id] !== undefined ? cantidades[item.id] : item.cantidad;
      const unitPrice = precios[item.id] || 0;
      const cur = monedas[item.id] || (item.equipo.tipo === 'ALQUILER' ? 'PEN' : 'USD');
      const esAlquilerCero = item.equipo.tipo === 'ALQUILER' && unitPrice === 0;

      const pUnitFormatted = esAlquilerCero ? 'A cotizar' : formatItemMoney(unitPrice, cur);
      const pTotalFormatted = esAlquilerCero ? 'A cotizar' : formatItemMoney(unitPrice * cant, cur);

      // Si el equipo tiene modelo o marca, se agrega de forma ordenada y limpia debajo del nombre
      const detallesEquipo = [item.equipo.nombre, item.equipo.modelo ? `Modelo: ${item.equipo.modelo}` : null, item.equipo.marca ? `Marca: ${item.equipo.marca}` : null].filter(Boolean).join('\n');

      return [
        i + 1,
        item.equipo.codigoInterno || '—',
        detallesEquipo,
        item.equipo.tipo === 'VENTA' ? 'VENTA' : 'ALQUILER',
        cur === 'USD' ? 'USD ($)' : 'S/ (Soles)',
        cant,
        (!item.equipo.unidad || item.equipo.unidad === 'USD' || item.equipo.unidad === 'PEN') ? 'UND' : item.equipo.unidad,
        pUnitFormatted,
        pTotalFormatted
      ];
    });

    autoTable(doc, {
      startY: 83,
      head: [['N.°', 'Código', 'Descripción del Equipo / Suministro', 'Tipo', 'Moneda', 'Cant.', 'Un.', 'P. Unitario', 'P. Total']],
      body: tableData,
      theme: 'grid',
      headStyles: {
        fillColor: primaryColor,
        textColor: 255,
        fontSize: 7.5,
        fontStyle: 'bold',
        halign: 'center',
        valign: 'middle',
        cellPadding: 2,
      },
      bodyStyles: {
        fontSize: 7,
        textColor: [30, 41, 59],
        cellPadding: 2,
        valign: 'middle',
        overflow: 'linebreak',
      },
      columnStyles: {
        0: { halign: 'center', cellWidth: 8 },
        1: { halign: 'center', cellWidth: 18 },
        2: { cellWidth: 53 },
        3: { halign: 'center', cellWidth: 16 },
        4: { halign: 'center', cellWidth: 16 },
        5: { halign: 'center', cellWidth: 11 },
        6: { halign: 'center', cellWidth: 10 },
        7: { halign: 'right', cellWidth: 25 },
        8: { halign: 'right', cellWidth: 25 }
      },
      didParseCell: (data) => {
        if (data.section === 'body') {
          if (data.column.index === 3) {
            const val = String(data.cell.raw);
            if (val === 'VENTA') {
              data.cell.styles.textColor = [5, 150, 105];
              data.cell.styles.fontStyle = 'bold';
            } else if (val === 'ALQUILER') {
              data.cell.styles.textColor = [30, 64, 175];
              data.cell.styles.fontStyle = 'bold';
            }
          }
        }
      },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      margin: { left: 14, right: 14 }
    });

    // @ts-ignore
    let currentY = doc.lastAutoTable.finalY + 6;

    // Control estricto para no generar páginas en blanco
    if (currentY > 200) {
      doc.addPage();
      currentY = 16;
    }

    // --- BLOQUES DE TOTALES DESTACADOS (SOLES Y/O DÓLARES) ---
    doc.setDrawColor(226, 232, 240);
    doc.setFillColor(255, 255, 255);

    const totalBoxWidth = 82;
    const totalBoxX = 114;
    let tY = currentY;

    if (tienePEN) {
      doc.setFillColor(240, 249, 255);
      doc.setDrawColor(186, 230, 253);
      doc.roundedRect(totalBoxX, tY, totalBoxWidth, 23, 2, 2, 'FD');

      doc.setFontSize(7.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(30, 64, 175);
      doc.text('LIQUIDACIÓN EN SOLES (S/)', totalBoxX + 4, tY + 4.5);

      doc.setFontSize(7.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(71, 85, 105);
      doc.text('Subtotal Soles:', totalBoxX + 4, tY + 9.5);
      doc.text(formatPENMoney(subtotalPEN), totalBoxX + totalBoxWidth - 4, tY + 9.5, { align: 'right' });

      doc.text(`I.G.V. (${config.igvPercent}%):`, totalBoxX + 4, tY + 14);
      doc.text(formatPENMoney(igvPEN), totalBoxX + totalBoxWidth - 4, tY + 14, { align: 'right' });

      doc.setFontSize(8.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(accentColor[0], accentColor[1], accentColor[2]);
      doc.text('TOTAL SOLES (INC. IGV):', totalBoxX + 4, tY + 19.5);
      doc.text(formatPENMoney(totalPEN), totalBoxX + totalBoxWidth - 4, tY + 19.5, { align: 'right' });

      tY += 26;
    }

    if (tieneUSD) {
      doc.setFillColor(255, 251, 235);
      doc.setDrawColor(254, 215, 170);
      doc.roundedRect(totalBoxX, tY, totalBoxWidth, 23, 2, 2, 'FD');

      doc.setFontSize(7.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(180, 83, 9);
      doc.text('LIQUIDACIÓN EN DÓLARES (US$)', totalBoxX + 4, tY + 4.5);

      doc.setFontSize(7.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(71, 85, 105);
      doc.text('Subtotal Dólares:', totalBoxX + 4, tY + 9.5);
      doc.text(formatUSDMoney(subtotalUSD), totalBoxX + totalBoxWidth - 4, tY + 9.5, { align: 'right' });

      doc.text(`I.G.V. (${config.igvPercent}%):`, totalBoxX + 4, tY + 14);
      doc.text(formatUSDMoney(igvUSD), totalBoxX + totalBoxWidth - 4, tY + 14, { align: 'right' });

      doc.setFontSize(8.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(accentColor[0], accentColor[1], accentColor[2]);
      doc.text('TOTAL DÓLARES (INC. IGV):', totalBoxX + 4, tY + 19.5);
      doc.text(formatUSDMoney(totalUSD), totalBoxX + totalBoxWidth - 4, tY + 19.5, { align: 'right' });

      tY += 26;
    }

    // --- SECCIÓN DE CUENTAS BANCARIAS EN TABLA ORDENADA (SIN CORTES DE NÚMEROS) ---
    const bankTableY = currentY;
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text('CUENTAS BANCARIAS AUTORIZADAS', 14, bankTableY + 4);

    const bankData = [
      ['Banco de Crédito (BCP)', 'Soles (S/)', '191-12345678-0-12', '002-191-123456780123-45'],
      ['Banco de Crédito (BCP)', 'Dólares (US$)', '191-98765432-1-34', '002-191-198765432134-56'],
      ['BBVA Continental', 'Soles (S/)', '0011-0123-0100012345', '011-123-000100012345-67'],
      ['BBVA Continental', 'Dólares (US$)', '0011-0456-0100067890', '011-456-000100067890-12']
    ];

    autoTable(doc, {
      startY: bankTableY + 6,
      head: [['Banco', 'Moneda', 'N.° de Cuenta', 'Código Interbancario (CCI)']],
      body: bankData,
      theme: 'grid',
      headStyles: { fillColor: [241, 245, 249], textColor: [15, 23, 42], fontSize: 6.5, fontStyle: 'bold', halign: 'center', cellPadding: 1.5 },
      bodyStyles: { fontSize: 6.5, textColor: [51, 65, 85], cellPadding: 1.5, valign: 'middle', overflow: 'visible' },
      columnStyles: {
        0: { cellWidth: 26, fontStyle: 'bold' },
        1: { halign: 'center', cellWidth: 16 },
        2: { halign: 'center', cellWidth: 23 },
        3: { halign: 'center', cellWidth: 28 }
      },
      margin: { left: 14 },
      tableWidth: 93
    });

    // --- PIE DE PÁGINA: EJECUTIVO Y TÉRMINOS ---
    const finalBlockY = Math.max(tY, (doc as any).lastAutoTable?.finalY ? (doc as any).lastAutoTable.finalY + 4 : currentY + 30);
    
    let footY = finalBlockY + 4;
    if (footY > 265) {
      doc.addPage();
      footY = 16;
    }

    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(14, footY, 182, 17, 2, 2, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text('EJECUTIVO COMERCIAL:', 18, footY + 4.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(15, 23, 42);
    doc.text(`${config.ejecutivo || 'Administrador HHTRENT'}  ·  ${config.contactoEjecutivo || 'gerencia@hhtrent.com | 948553419'}`, 55, footY + 4.5);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text('TÉRMINOS / NOTAS:', 18, footY + 9.5);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(71, 85, 105);

    const obsText = config.observaciones || '1. Precios no incluyen flete ni maniobras. 2. Disponibilidad sujeta a confirmación.';
    const obsLines = doc.splitTextToSize(obsText.replace(/\n+/g, '  ·  '), 135);
    doc.text(obsLines, 55, footY + 9.5);

    // Descargar PDF limpio
    doc.save(`Proforma_${nroCot.replace('Nº ', '')}.pdf`);
    
    if (onSuccess) {
      onSuccess();
    }
    
    } catch (error) {
      toast.error('Ocurrió un error al guardar la proforma');
      console.error(error);
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <div className="bg-white rounded-[24px] shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* HEADER */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#162B4D]/10 flex items-center justify-center text-[#162B4D]">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-[800] text-slate-900">Configurar Proforma PDF</h2>
              <p className="text-xs font-[600] text-slate-500">Ticket: TCK-{String(cotizacion.id).substring(0, 8).toUpperCase()}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-200 text-slate-500 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* BODY */}
        <div className="p-6 overflow-y-auto flex-1 bg-white space-y-8">
          
          {/* SECCIÓN: PRECIOS */}
          <section>
            <h3 className="text-sm font-[800] text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#E63C46]"></span> 1. Asignar Precios Unitarios
            </h3>
            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-[700]">
                  <tr>
                    <th className="py-3 px-4">Equipo</th>
                    <th className="py-3 px-4 text-center">Tipo</th>
                    <th className="py-3 px-4 text-center">Moneda</th>
                    <th className="py-3 px-4">Modelo/Marca</th>
                    <th className="py-3 px-4 text-center">Cant.</th>
                    <th className="py-3 px-4 w-36">Precio Unitario</th>
                    <th className="py-3 px-4 w-32 text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {cotizacion.items.map((item) => {
                    const cur = monedas[item.id] || (item.equipo.tipo === 'ALQUILER' ? 'PEN' : 'USD');
                    const cant = cantidades[item.id] !== undefined ? cantidades[item.id] : item.cantidad;
                    const precio = precios[item.id] || 0;
                    return (
                      <tr key={item.id} className="hover:bg-slate-50">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <p className="font-[700] text-slate-900">{item.equipo.nombre}</p>
                          </div>
                          <p className="text-xs text-slate-500">{item.equipo.codigoInterno || '-'}</p>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className={`text-[10px] font-[800] px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                            item.equipo.tipo === 'ALQUILER'
                              ? 'bg-blue-100 text-blue-700 border border-blue-200'
                              : 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                          }`}>
                            {item.equipo.tipo}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <select
                            value={cur}
                            onChange={(e) => handleMonedaChange(item.id, e.target.value)}
                            className="text-xs font-[700] px-2 py-1 bg-white border border-slate-200 text-slate-700 rounded-lg outline-none focus:border-[#162B4D] cursor-pointer"
                          >
                            <option value="PEN">Soles (S/)</option>
                            <option value="USD">Dólares (US$)</option>
                          </select>
                        </td>
                        <td className="py-3 px-4">
                          <p className="text-xs font-[600] text-slate-700">{item.equipo.modelo || '-'}</p>
                          <p className="text-xs text-slate-500">{item.equipo.marca || '-'}</p>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div className="inline-flex items-center gap-1 bg-white border border-slate-200 rounded-lg p-0.5">
                            <input
                              type="number"
                              min="1"
                              value={cant}
                              onChange={(e) => handleCantidadChange(item.id, e.target.value)}
                              className="w-12 text-center text-xs font-[800] text-slate-800 outline-none bg-transparent"
                            />
                            <span className="text-[10px] font-[700] text-slate-400 pr-1.5 uppercase">
                              {(!item.equipo.unidad || item.equipo.unidad === 'USD' || item.equipo.unidad === 'PEN') ? 'UND' : item.equipo.unidad}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <input 
                            type="number" 
                            min="0"
                            value={precios[item.id] !== undefined ? precios[item.id] : ''} 
                            onChange={(e) => handlePrecioChange(item.id, e.target.value)}
                            className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm font-[600] focus:ring-2 focus:ring-[#162B4D]/20 focus:border-[#162B4D] outline-none"
                            placeholder="0.00"
                          />
                        </td>
                        <td className="py-3 px-4 text-right font-[700] text-slate-900">
                          {formatItemMoney(precio * cant, cur)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>

          {/* SECCIÓN: DATOS DE LA PROFORMA */}
          <section>
            <h3 className="text-sm font-[800] text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#162B4D]"></span> 2. Detalles del Documento
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-[700] text-slate-600">Atención (Contacto)</label>
                <input type="text" value={config.atencion} onChange={e => handleConfigChange('atencion', e.target.value)} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:border-[#162B4D]" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-[700] text-slate-600">RUC Empresa</label>
                <input type="text" value={config.ruc} onChange={e => handleConfigChange('ruc', e.target.value)} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:border-[#162B4D]" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-[700] text-slate-600">Dirección</label>
                <input type="text" value={config.direccion} onChange={e => handleConfigChange('direccion', e.target.value)} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:border-[#162B4D]" />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-[700] text-slate-600">Condición de Venta</label>
                <input type="text" value={config.condVenta} onChange={e => handleConfigChange('condVenta', e.target.value)} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:border-[#162B4D]" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-[700] text-slate-600">Validez de Oferta</label>
                <input type="text" value={config.validez} onChange={e => handleConfigChange('validez', e.target.value)} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:border-[#162B4D]" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-[700] text-slate-600">I.G.V. General (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={config.igvPercent}
                  onChange={e => handleConfigChange('igvPercent', parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:border-[#162B4D]"
                />
              </div>
            </div>
          </section>

          {/* SECCIÓN: RESUMEN BIMONETARIO DE TOTALES */}
          <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-[700] text-slate-600">Observaciones (Términos)</label>
                <textarea rows={4} value={config.observaciones} onChange={e => handleConfigChange('observaciones', e.target.value)} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:border-[#162B4D] resize-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-[700] text-slate-600">Ejecutivo Ventas</label>
                  <input type="text" value={config.ejecutivo} onChange={e => handleConfigChange('ejecutivo', e.target.value)} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:border-[#162B4D]" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-[700] text-slate-600">Contacto Ejecutivo</label>
                  <input type="text" value={config.contactoEjecutivo} onChange={e => handleConfigChange('contactoEjecutivo', e.target.value)} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:border-[#162B4D]" />
                </div>
              </div>
            </div>

            {/* TARJETA DE RESUMEN BIMONETARIO */}
            <div className="bg-slate-50 rounded-xl p-5 border border-slate-200 space-y-4">
              <h4 className="text-xs font-[800] text-slate-900 uppercase tracking-wider border-b border-slate-200 pb-2">
                Resumen de Liquidación Proforma
              </h4>

              {tienePEN && (
                <div className="p-3.5 bg-white border border-slate-200 rounded-xl space-y-1.5 shadow-sm">
                  <span className="text-xs font-[800] text-slate-800 uppercase block">Totales en Soles (S/)</span>
                  <div className="flex justify-between text-xs font-[600] text-slate-600">
                    <span>Subtotal Soles ({itemsPEN.length} ítems):</span>
                    <span className="font-[700] text-slate-900">{formatPENMoney(subtotalPEN)}</span>
                  </div>
                  <div className="flex justify-between text-xs font-[600] text-slate-600">
                    <span>I.G.V. ({config.igvPercent}%):</span>
                    <span className="font-[700] text-slate-900">{formatPENMoney(igvPEN)}</span>
                  </div>
                  <div className="flex justify-between text-sm font-[800] text-[#162B4D] pt-1.5 border-t border-slate-100">
                    <span>TOTAL SOLES (Inc. IGV):</span>
                    <span className="text-[#E63C46]">{formatPENMoney(totalPEN)}</span>
                  </div>
                </div>
              )}

              {tieneUSD && (
                <div className="p-3.5 bg-white border border-slate-200 rounded-xl space-y-1.5 shadow-sm">
                  <span className="text-xs font-[800] text-slate-800 uppercase block">Totales en Dólares (US$)</span>
                  <div className="flex justify-between text-xs font-[600] text-slate-600">
                    <span>Subtotal Dólares ({itemsUSD.length} ítems):</span>
                    <span className="font-[700] text-slate-900">{formatUSDMoney(subtotalUSD)}</span>
                  </div>
                  <div className="flex justify-between text-xs font-[600] text-slate-600">
                    <span>I.G.V. ({config.igvPercent}%):</span>
                    <span className="font-[700] text-slate-900">{formatUSDMoney(igvUSD)}</span>
                  </div>
                  <div className="flex justify-between text-sm font-[800] text-[#162B4D] pt-1.5 border-t border-slate-100">
                    <span>TOTAL DÓLARES (Inc. IGV):</span>
                    <span className="text-[#E63C46]">{formatUSDMoney(totalUSD)}</span>
                  </div>
                </div>
              )}
            </div>
          </section>

        </div>

        {/* FOOTER */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 shrink-0 flex items-center justify-end gap-3">
          <button onClick={onClose} disabled={guardando} className="px-5 py-2.5 rounded-xl text-sm font-[700] text-slate-600 hover:bg-slate-200 transition-colors">
            Cancelar
          </button>
          <button 
            onClick={guardarYGenerarPDF} 
            disabled={guardando}
            className="px-6 py-2.5 rounded-xl text-sm font-[800] text-white bg-[#162B4D] hover:bg-[#0f1e36] transition-colors flex items-center gap-2 shadow-lg shadow-[#162B4D]/20 disabled:opacity-50"
          >
            {guardando ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileDown className="w-4 h-4" />}
            {guardando ? 'Guardando...' : 'Guardar y Descargar'}
          </button>
        </div>

      </div>
    </div>
  );
}
