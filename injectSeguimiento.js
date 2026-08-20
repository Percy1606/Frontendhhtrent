const fs = require('fs');
let code = fs.readFileSync('src/app/seguimiento/page.tsx', 'utf8');

// Replace the {pedido.estado === 'PENDIENTE' ? ( ... ) : (...)} block.
const searchBlock = \{pedido.estado === 'PENDIENTE' ? (\;
const replaceBlock = \{pedido.estado === 'PENDIENTE' ? (
  <div className=\g-white rounded-[24px] border border-amber-200/80 p-8 shadow-sm space-y-6 text-center max-w-4xl mx-auto\>
    <div className=\w-16 h-16 rounded-full bg-amber-100 border-4 border-amber-50 text-amber-600 flex items-center justify-center mx-auto shadow-sm\>
      <Clock className=\w-8 h-8\ />
    </div>
    <div className=\space-y-2\>
      <span className=\	ext-[10px] font-[800] uppercase tracking-widest text-amber-700 bg-amber-50 border border-amber-200 px-3.5 py-1 rounded-full inline-block\>
        Solicitud en Revisión
      </span>
      <h3 className=\	ext-2xl font-[800] text-slate-900 tracking-tight\>Estamos valorizando tu cotización</h3>
      <p className=\	ext-slate-600 text-xs sm:text-sm max-w-xl mx-auto font-[500] leading-relaxed\>
        Nuestros especialistas están evaluando la disponibilidad y precios de los equipos solicitados. 
        En breve, esta página se actualizará con tu cotización detallada.
      </p>
    </div>
  </div>
) : pedido.estado === 'COTIZADA' ? (\;

code = code.replace(searchBlock, replaceBlock);
fs.writeFileSync('src/app/seguimiento/page.tsx', code);

