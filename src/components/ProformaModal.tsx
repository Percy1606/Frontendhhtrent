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
  // Precios editables
  const [precios, setPrecios] = useState<Record<string, number>>({});
  
  // Datos extra para la proforma
  const [config, setConfig] = useState({
    ruc: '',
    direccion: '',
    atencion: cotizacion.clienteNombre,
    moneda: 'Soles (S/)',
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

  // Inicializar precios con 0 si son nulos en la base de datos
  useEffect(() => {
    const initPrecios: Record<string, number> = {};
    cotizacion.items.forEach(item => {
      initPrecios[item.id] = item.equipo.precio || 0;
    });
    setPrecios(initPrecios);
  }, [cotizacion]);

  const handlePrecioChange = (id: string, value: string) => {
    const num = parseFloat(value) || 0;
    setPrecios(prev => ({ ...prev, [id]: num }));
  };

  const handleConfigChange = (field: string, value: string | number) => {
    setConfig(prev => ({ ...prev, [field]: value }));
  };

  // Cálculos
  const totalBruto = cotizacion.items.reduce((acc, item) => acc + (precios[item.id] * item.cantidad), 0);
  const totalNeto = totalBruto - config.descuento;
  const igv = totalNeto * (config.igvPercent / 100);
  const granTotal = totalNeto + igv + config.flete + config.embalaje;

  const guardarYGenerarPDF = async () => {
    try {
      setGuardando(true);
      
      // Guardar en backend
      await apiFetch(`/cotizaciones/${cotizacion.id}/valorizar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config, precios })
      });
      
      toast.success('Cotización guardada y valorizada exitosamente');

      const doc = new jsPDF();
      
      // --- COLORES CORPORATIVOS ---
      const primaryColor: [number, number, number] = [22, 43, 77]; // #162B4D
      const accentColor: [number, number, number] = [230, 60, 70]; // #E63C46
    
    // --- CABECERA ---
    // Cargar Logo dinámicamente
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

    // Caja Proforma
    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.roundedRect(130, 15, 65, 25, 3, 3, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('PROFORMA', 162.5, 24, { align: 'center' });
    doc.setFontSize(12);
    const nroCot = `Nº TCK-${String(cotizacion.id).substring(0, 8).toUpperCase()}`;
    doc.text(nroCot, 162.5, 32, { align: 'center' });

    // --- LÍNEA SEPARADORA ---
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.5);
    doc.line(14, 47, 196, 47);

    // --- DATOS DEL CLIENTE ---
    doc.setFontSize(9);
    doc.setTextColor(15, 23, 42);
    const startY = 54;
    const lh = 6;
    
    doc.setFont('helvetica', 'bold'); doc.text('CLIENTE:', 14, startY);
    doc.setFont('helvetica', 'normal'); doc.text(cotizacion.clienteEmpresa || cotizacion.clienteNombre, 40, startY);
    
    doc.setFont('helvetica', 'bold'); doc.text('ATENCIÓN:', 14, startY + lh);
    doc.setFont('helvetica', 'normal'); doc.text(config.atencion, 40, startY + lh);
    
    doc.setFont('helvetica', 'bold'); doc.text('RUC:', 14, startY + lh*2);
    doc.setFont('helvetica', 'normal'); doc.text(config.ruc || '-', 40, startY + lh*2);
    
    doc.setFont('helvetica', 'bold'); doc.text('DIRECCIÓN:', 14, startY + lh*3);
    doc.setFont('helvetica', 'normal'); doc.text(config.direccion || '-', 40, startY + lh*3);

    // Columna Derecha
    doc.setFont('helvetica', 'bold'); doc.text('FECHA:', 120, startY);
    doc.setFont('helvetica', 'normal'); doc.text(new Date(cotizacion.createdAt).toLocaleDateString('es-PE'), 150, startY);
    
    doc.setFont('helvetica', 'bold'); doc.text('MONEDA:', 120, startY + lh);
    doc.setFont('helvetica', 'normal'); doc.text(config.moneda, 150, startY + lh);
    
    doc.setFont('helvetica', 'bold'); doc.text('COND. VENTA:', 120, startY + lh*2);
    doc.setFont('helvetica', 'normal'); doc.text(config.condVenta, 150, startY + lh*2);
    
    doc.setFont('helvetica', 'bold'); doc.text('VALIDEZ:', 120, startY + lh*3);
    doc.setFont('helvetica', 'normal'); doc.text(config.validez, 150, startY + lh*3);

    // --- TABLA DE ITEMS ---
    const tableData = cotizacion.items.map((item, i) => [
      i + 1,
      item.equipo.codigoInterno || '-',
      item.equipo.nombre,
      item.equipo.modelo || '-',
      item.equipo.marca || '-',
      item.cantidad,
      item.equipo.unidad || 'Und',
      formatPEN(precios[item.id]),
      formatPEN(precios[item.id] * item.cantidad)
    ]);

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

    // --- TOTALES ---
    // @ts-ignore
    const finalY = doc.lastAutoTable.finalY + 10;
    
    doc.setDrawColor(226, 232, 240);
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(120, finalY, 76, 54, 2, 2, 'FD');

    doc.setFontSize(9);
    const tlH = 6.5;
    let tY = finalY + 6;

    doc.setFont('helvetica', 'normal'); doc.text('TOTAL BRUTO:', 125, tY);
    doc.text(formatPEN(totalBruto), 190, tY, { align: 'right' });
    
    tY += tlH;
    doc.text('DESCUENTOS:', 125, tY);
    doc.text(`- ${formatPEN(config.descuento)}`, 190, tY, { align: 'right' });
    
    tY += tlH;
    doc.text('TOTAL NETO:', 125, tY);
    doc.text(formatPEN(totalNeto), 190, tY, { align: 'right' });

    tY += tlH;
    doc.text('FLETE:', 125, tY);
    doc.text(formatPEN(config.flete), 190, tY, { align: 'right' });

    tY += tlH;
    doc.text('EMBALAJE:', 125, tY);
    doc.text(formatPEN(config.embalaje), 190, tY, { align: 'right' });
    
    tY += tlH;
    doc.text(`I.G.V. (${config.igvPercent}%):`, 125, tY);
    doc.text(formatPEN(igv), 190, tY, { align: 'right' });

    tY += tlH + 2;
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(accentColor[0], accentColor[1], accentColor[2]);
    doc.text('TOTAL COTIZACIÓN:', 125, tY);
    doc.text(formatPEN(granTotal), 190, tY, { align: 'right' });

    // --- CUENTAS BANCARIAS ---
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(10);
    doc.text('CUENTAS BANCARIAS', 14, finalY + 6);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text('BCP Soles: 191-12345678-0-12\nCCI: 0021911234567801234', 14, finalY + 12);
    doc.text('BBVA Soles: 0011-0123-0100012345\nCCI: 01112300010001234567', 14, finalY + 22);
    
    // --- PIE DE PÁGINA ---
    let footY = finalY + 66;
    if (footY > 270) {
       doc.addPage();
       footY = 20;
    }
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text('EJECUTIVO DE VENTAS:', 14, footY);
    doc.setFont('helvetica', 'normal');
    doc.text(`${config.ejecutivo} - ${config.contactoEjecutivo}`, 60, footY);
    
    footY += 10;
    doc.setFont('helvetica', 'bold');
    doc.text('CONDICIONES U OBSERVACIONES:', 14, footY);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    
    const obsLines = doc.splitTextToSize(config.observaciones, 180);
    doc.text(obsLines, 14, footY + 5);

    // Descargar
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
                    <th className="py-3 px-4">Modelo/Marca</th>
                    <th className="py-3 px-4 text-center">Cant.</th>
                    <th className="py-3 px-4 w-40">Precio Unit. (S/)</th>
                    <th className="py-3 px-4 w-32 text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {cotizacion.items.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50">
                      <td className="py-3 px-4">
                        <p className="font-[700] text-slate-900">{item.equipo.nombre}</p>
                        <p className="text-xs text-slate-500">{item.equipo.codigoInterno || '-'}</p>
                      </td>
                      <td className="py-3 px-4">
                        <p className="text-xs font-[600] text-slate-700">{item.equipo.modelo || '-'}</p>
                        <p className="text-xs text-slate-500">{item.equipo.marca || '-'}</p>
                      </td>
                      <td className="py-3 px-4 text-center font-[700] text-slate-700">{item.cantidad} {item.equipo.unidad || 'Und'}</td>
                      <td className="py-3 px-4">
                        <input 
                          type="number" 
                          min="0"
                          value={precios[item.id] || ''} 
                          onChange={(e) => handlePrecioChange(item.id, e.target.value)}
                          className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm font-[600] focus:ring-2 focus:ring-[#162B4D]/20 focus:border-[#162B4D] outline-none"
                          placeholder="0.00"
                        />
                      </td>
                      <td className="py-3 px-4 text-right font-[700] text-slate-900">
                        {formatPEN((precios[item.id] || 0) * item.cantidad)}
                      </td>
                    </tr>
                  ))}
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
                <label className="text-xs font-[700] text-slate-600">Moneda</label>
                <input type="text" value={config.moneda} onChange={e => handleConfigChange('moneda', e.target.value)} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:border-[#162B4D]" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-[700] text-slate-600">Condición de Venta</label>
                <input type="text" value={config.condVenta} onChange={e => handleConfigChange('condVenta', e.target.value)} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:border-[#162B4D]" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-[700] text-slate-600">Validez de Oferta</label>
                <input type="text" value={config.validez} onChange={e => handleConfigChange('validez', e.target.value)} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:border-[#162B4D]" />
              </div>
            </div>
          </section>

          {/* SECCIÓN: AJUSTES Y TOTALES */}
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

            <div className="bg-slate-50 rounded-xl p-5 border border-slate-200 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-[600] text-slate-500">Total Bruto</span>
                <span className="text-sm font-[800] text-slate-900">{formatPEN(totalBruto)}</span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-sm font-[600] text-slate-500">Descuentos (-)</span>
                <input type="number" value={config.descuento || ''} onChange={e => handleConfigChange('descuento', parseFloat(e.target.value)||0)} className="w-24 px-2 py-1 text-right bg-white border border-slate-200 rounded text-sm outline-none" placeholder="0.00" />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-[600] text-slate-500">Total Neto</span>
                <span className="text-sm font-[800] text-slate-900">{formatPEN(totalNeto)}</span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-sm font-[600] text-slate-500">Flete (+)</span>
                <input type="number" value={config.flete || ''} onChange={e => handleConfigChange('flete', parseFloat(e.target.value)||0)} className="w-24 px-2 py-1 text-right bg-white border border-slate-200 rounded text-sm outline-none" placeholder="0.00" />
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-sm font-[600] text-slate-500">Embalaje (+)</span>
                <input type="number" value={config.embalaje || ''} onChange={e => handleConfigChange('embalaje', parseFloat(e.target.value)||0)} className="w-24 px-2 py-1 text-right bg-white border border-slate-200 rounded text-sm outline-none" placeholder="0.00" />
              </div>
              <div className="flex items-center justify-between gap-4 border-t border-slate-200 pt-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-[600] text-slate-500">I.G.V. (%)</span>
                  <input type="number" value={config.igvPercent} onChange={e => handleConfigChange('igvPercent', parseFloat(e.target.value)||0)} className="w-16 px-2 py-1 text-center bg-white border border-slate-200 rounded text-sm outline-none" placeholder="18" />
                </div>
                <span className="text-sm font-[800] text-slate-900">{formatPEN(igv)}</span>
              </div>
              <div className="flex items-center justify-between pt-2">
                <span className="text-base font-[800] text-[#E63C46]">Total Cotización</span>
                <span className="text-xl font-[800] text-[#E63C46]">{formatPEN(granTotal)}</span>
              </div>
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
