// Helpers compartidos para diferenciar la modalidad comercial de cada equipo:
// ALQUILER (tarifa mensual) · VENTA (precio directo) · PROYECTO (llave en mano / bajo cotización)

export type TipoTransaccion = 'ALQUILER' | 'VENTA' | 'PROYECTO';

// Etiqueta legible para badges y columnas
export function tipoLabel(tipo: string | null | undefined): string {
  switch (tipo) {
    case 'ALQUILER':
      return 'Alquiler';
    case 'VENTA':
      return 'Venta';
    case 'PROYECTO':
      return 'Proyecto';
    default:
      return 'A Cotizar';
  }
}

// Clases de color para el badge de modalidad (consistente en todo el sitio)
export function tipoBadgeClass(tipo: string | null | undefined): string {
  switch (tipo) {
    case 'ALQUILER':
      return 'bg-[#233A61]';
    case 'VENTA':
      return 'bg-[#E63C46]';
    case 'PROYECTO':
      return 'bg-amber-600';
    default:
      return 'bg-slate-500';
  }
}

// Etiqueta del precio según modalidad
export function precioEtiqueta(tipo: string | null | undefined): string {
  switch (tipo) {
    case 'ALQUILER':
      return 'Tarifa de Alquiler';
    case 'VENTA':
      return 'Precio de Venta';
    case 'PROYECTO':
      return 'Precio a Cotizar';
    default:
      return 'Precio Referencial';
  }
}

// Texto corto para el resumen de la tarjeta ("Precio de venta" vs "Tarifa mensual")
export function precioEtiquetaCorta(tipo: string | null | undefined): string {
  switch (tipo) {
    case 'ALQUILER':
      return 'Tarifa mensual';
    case 'VENTA':
      return 'Precio de venta';
    case 'PROYECTO':
      return 'Bajo cotización';
    default:
      return 'Precio referencial';
  }
}

// Nota explicativa bajo el precio (ficha de equipo)
export function notaPrecio(tipo: string | null | undefined): string {
  switch (tipo) {
    case 'ALQUILER':
      return 'Tarifa mensual de alquiler, sin IGV. Incluye mantenimiento preventivo.';
    case 'VENTA':
      return 'Precio referencial de venta, sin IGV. Sujeto a stock y versión.';
    case 'PROYECTO':
      return 'Precio sujeto a cotización según alcance, ingeniería y llave en mano.';
    default:
      return 'Precio referencial, sin IGV.';
  }
}

// CTA principal según modalidad
export function ctaLabel(tipo: string | null | undefined): string {
  switch (tipo) {
    case 'ALQUILER':
      return 'Alquilar';
    case 'VENTA':
      return 'Comprar';
    case 'PROYECTO':
      return 'Cotizar';
    default:
      return 'Agregar';
  }
}

// Formateador universal de moneda (Dólares USD vs Soles PEN)
export function formatoPrecioMoneda(
  precio?: number | string | null,
  unidad?: string | null,
): string {
  if (precio == null || precio === '') return 'Bajo Cotización';
  const num = Number(precio);
  if (isNaN(num)) return String(precio);

  const u = (unidad || '').trim().toUpperCase();
  const esDolar = u.includes('USD') || u.includes('$');
  const simbolo = esDolar ? 'USD $' : 'S/';

  const numFormateado = num.toLocaleString('es-PE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  // Si la unidad es una especificación como "/ mes", "/ día", la concatenamos
  const tieneUnidadTemporal =
    unidad &&
    (unidad.includes('/') ||
      unidad.toLowerCase().includes('mes') ||
      unidad.toLowerCase().includes('día') ||
      unidad.toLowerCase().includes('dia'));

  return tieneUnidadTemporal
    ? `${simbolo} ${numFormateado} ${unidad}`
    : `${simbolo} ${numFormateado}`;
}

