// Utilidades compartidas del carrito de cotización
// Clave única usada por todo el sistema (catálogo, header, página de cotización)
export const CART_KEY = 'hht_cotizacion_cart';

export interface CartItem {
  id: string;
  nombre: string;
  descripcion?: string;
  ubicacion?: string;
  precio: number;
  tipo: string;
  unidad?: string;
  imagenUrl: string;
  cantidad: number;
}

export function numeroPrecio(precio: number | string | null | undefined): number {
  if (typeof precio === 'number' && Number.isFinite(precio)) return precio;
  return parseFloat(String(precio ?? 0)) || 0;
}

// Lee el carrito con validación: devuelve siempre un array de items normalizados
export function leerCarrito(): CartItem[] {
  try {
    const saved = localStorage.getItem(CART_KEY);
    if (!saved) return [];
    const parsed = JSON.parse(saved);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(
        (i: unknown): i is Record<string, unknown> =>
          !!i && typeof i === 'object' && 'id' in i
      )
      .map((i) => ({
        id: String(i.id),
        nombre: String(i.nombre ?? 'Equipo'),
        descripcion: typeof i.descripcion === 'string' ? i.descripcion : undefined,
        ubicacion: typeof i.ubicacion === 'string' ? i.ubicacion : undefined,
        precio: numeroPrecio(i.precio as number | string | null),
        tipo: String(i.tipo ?? 'ALQUILER'),
        unidad: typeof i.unidad === 'string' ? i.unidad : undefined,
        imagenUrl: String(i.imagenUrl ?? ''),
        cantidad: Math.max(1, Number(i.cantidad) || 1),
      }));
  } catch {
    return [];
  }
}

export function guardarCarrito(cart: CartItem[]) {
  try {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
  } catch (e) {
    console.error('Error guardando el carrito:', e);
  }
}

// Agrega un ítem al carrito (si ya existe, incrementa la cantidad) y lo persiste.
// Devuelve el carrito resultante.
export function agregarAlCarrito(item: {
  id: string;
  nombre: string;
  descripcion?: string;
  ubicacion?: string;
  precio: number | string | null;
  tipo: string;
  unidad?: string;
  imagenUrl: string;
}): CartItem[] {
  const cart = leerCarrito();
  const existingIndex = cart.findIndex((i) => i.id === item.id);
  if (existingIndex > -1) {
    cart[existingIndex] = {
      ...cart[existingIndex],
      cantidad: cart[existingIndex].cantidad + 1,
    };
  } else {
    cart.push({
      id: item.id,
      nombre: item.nombre,
      descripcion: item.descripcion,
      ubicacion: item.ubicacion,
      precio: numeroPrecio(item.precio),
      tipo: item.tipo,
      unidad: item.unidad,
      imagenUrl: item.imagenUrl,
      cantidad: 1,
    });
  }
  guardarCarrito(cart);
  return cart;
}
