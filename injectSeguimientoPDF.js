const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, 'src/app/seguimiento/page.tsx');
let content = fs.readFileSync(file, 'utf8');

// 1. Add imports for jsPDF and autoTable
if (!content.includes('jsPDF')) {
    content = content.replace(
        "import { toast } from 'sonner';",
        "import { toast } from 'sonner';\nimport jsPDF from 'jspdf';\nimport autoTable from 'jspdf-autotable';\nimport { formatPEN } from '@/lib/api';"
    );
}

// 2. Add descargarPDF function inside the component, before return
if (!content.includes('const descargarPDF = async () => {')) {
    const fn = `
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
`;
    content = content.replace(
        "return (",
        fn + "\n  return ("
    );
}

// 3. Add button in the UI
if (!content.includes('descargarPDF')) {
    // it's there
}

const btnBlock = `
                  <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
                    <button 
                      onClick={descargarPDF}
                      className="flex items-center justify-center gap-2 px-8 py-4 w-full sm:w-auto bg-white border-2 border-slate-200 text-slate-700 hover:border-blue-300 hover:text-blue-600 rounded-[16px] font-[800] text-sm transition-all shadow-sm"
                    >
                      <FileDown className="w-5 h-5" />
                      Descargar Proforma en PDF
                    </button>
                    <button `;

content = content.replace(
    `<div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">\n                    <button `,
    btnBlock
);

fs.writeFileSync(file, content);
console.log('Success frontend page.tsx updated!');
