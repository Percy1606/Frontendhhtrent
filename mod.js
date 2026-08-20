const fs = require('fs');
let code = fs.readFileSync('src/app/seguimiento/page.tsx', 'utf8');

const oldPendienteStart = `{pedido.estado === 'PENDIENTE' ? (`;
const splitIndex = code.indexOf(oldPendienteStart);
if(splitIndex === -1) { console.error('Not found'); process.exit(1); }

const oldPendienteEnd = `) : (
            /* SI EL PAGO YA FUE VERIFICADO`;
const splitEndIndex = code.indexOf(oldPendienteEnd);
if(splitEndIndex === -1) { console.error('End Not found'); process.exit(1); }

const replaceBlock = `{pedido.estado === 'PENDIENTE' ? (
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
                        await apiFetch(\`/cotizaciones/\${pedido.codigoTicket.replace('TCK-', '')}/estado\`, 'PATCH', { estado: 'APROBADA' });
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
              </div>`;

const newCode = code.slice(0, splitIndex) + replaceBlock + code.slice(splitEndIndex);
fs.writeFileSync('src/app/seguimiento/page.tsx', newCode);
console.log('Success');
