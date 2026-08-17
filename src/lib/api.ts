// Utilidades de API para el panel de gestión HT RENT
export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001';

// Convierte rutas relativas del backend (/uploads/...) en URLs completas cargables
// desde el navegador (el frontend corre en otro puerto). Las URLs externas (https://...)
// se devuelven tal cual.
export function imagenCompleta(url?: string | null): string {
  if (!url) return '';
  if (url.startsWith('/uploads/')) {
    return `${API_URL}${url}`;
  }
  return url;
}

export const ESTADOS_EQUIPO = [
  'DISPONIBLE',
  'RESERVADO',
  'ALQUILADO',
  'EN_MANTENIMIENTO',
  'EN_CALIBRACION',
  'FUERA_DE_SERVICIO',
  'EN_REPARACION',
  'DADO_DE_BAJA',
] as const;

export const ESTADO_LABELS: Record<string, string> = {
  DISPONIBLE: 'Disponible',
  RESERVADO: 'Reservado',
  ALQUILADO: 'Alquilado',
  EN_MANTENIMIENTO: 'En mantenimiento',
  EN_CALIBRACION: 'En calibración',
  FUERA_DE_SERVICIO: 'Fuera de servicio',
  EN_REPARACION: 'En reparación',
  DADO_DE_BAJA: 'Dado de baja',
};

export const ESTADO_CORTO: Record<string, string> = {
  DISPONIBLE: 'DISP',
  RESERVADO: 'RES',
  ALQUILADO: 'ALQ',
  EN_MANTENIMIENTO: 'MANT',
  EN_CALIBRACION: 'CAL',
  FUERA_DE_SERVICIO: 'FDS',
  EN_REPARACION: 'REP',
  DADO_DE_BAJA: 'BAJA',
};

export const ESTADO_COLORS: Record<string, string> = {
  DISPONIBLE: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  RESERVADO: 'bg-amber-100 text-amber-700 border-amber-200',
  ALQUILADO: 'bg-blue-100 text-blue-700 border-blue-200',
  EN_MANTENIMIENTO: 'bg-orange-100 text-orange-700 border-orange-200',
  EN_CALIBRACION: 'bg-violet-100 text-violet-700 border-violet-200',
  FUERA_DE_SERVICIO: 'bg-slate-100 text-slate-600 border-slate-200',
  EN_REPARACION: 'bg-red-100 text-red-700 border-red-200',
  DADO_DE_BAJA: 'bg-slate-800 text-white border-slate-700',
};

export const ESTADOS_CONTRATO = [
  'BORRADOR',
  'CONFIRMADO',
  'EN_CURSO',
  'FINALIZADO',
  'CANCELADO',
] as const;

export const CONTRATO_ESTADO_LABELS: Record<string, string> = {
  BORRADOR: 'Borrador',
  CONFIRMADO: 'Confirmado',
  EN_CURSO: 'En curso',
  FINALIZADO: 'Finalizado',
  CANCELADO: 'Cancelado',
};

export const CONTRATO_ESTADO_COLORS: Record<string, string> = {
  BORRADOR: 'bg-slate-100 text-slate-600 border-slate-200',
  CONFIRMADO: 'bg-amber-100 text-amber-700 border-amber-200',
  EN_CURSO: 'bg-blue-100 text-blue-700 border-blue-200',
  FINALIZADO: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  CANCELADO: 'bg-red-100 text-red-700 border-red-200',
};

export const SEDES = ['Piura'];
export const SEDE_PRINCIPAL = 'Piura';

export const ESTADOS_COTIZACION = [
  'PENDIENTE',
  'APROBADA',
  'DESPACHADO',
  'RECHAZADA',
] as const;

export const COTIZACION_ESTADO_LABELS: Record<string, string> = {
  PENDIENTE: 'Pendiente',
  APROBADA: 'Aprobada',
  DESPACHADO: 'Despachado',
  RECHAZADA: 'Cancelada / Rechazada',
};

export const COTIZACION_ESTADO_COLORS: Record<string, string> = {
  PENDIENTE: 'bg-amber-100 text-amber-700 border-amber-200',
  APROBADA: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  DESPACHADO: 'bg-purple-100 text-purple-800 border-purple-200',
  RECHAZADA: 'bg-red-100 text-red-700 border-red-200',
};

export function formatPEN(n: number | null | undefined): string {
  if (n == null || Number.isNaN(n)) return 'S/ 0.00';
  return new Intl.NumberFormat('es-PE', {
    style: 'currency',
    currency: 'PEN',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);
}

export const TIPOS_MANTENIMIENTO = [
  'PREVENTIVO',
  'CORRECTIVO',
  'CALIBRACION',
  'INSPECCION',
] as const;

export const TIPO_MANTENIMIENTO_LABELS: Record<string, string> = {
  PREVENTIVO: 'Preventivo',
  CORRECTIVO: 'Correctivo',
  CALIBRACION: 'Calibración',
  INSPECCION: 'Inspección',
};

export const PRIORIDADES_ORDEN = ['BAJA', 'MEDIA', 'ALTA', 'URGENTE'] as const;

export const PRIORIDAD_LABELS: Record<string, string> = {
  BAJA: 'Baja',
  MEDIA: 'Media',
  ALTA: 'Alta',
  URGENTE: 'Urgente',
};

export const PRIORIDAD_COLORS: Record<string, string> = {
  BAJA: 'bg-slate-100 text-slate-600 border-slate-200',
  MEDIA: 'bg-blue-100 text-blue-700 border-blue-200',
  ALTA: 'bg-amber-100 text-amber-700 border-amber-200',
  URGENTE: 'bg-red-100 text-red-700 border-red-200',
};

export const ESTADOS_ORDEN = [
  'PENDIENTE',
  'EN_PROGRESO',
  'COMPLETADO',
  'CANCELADO',
] as const;

export const ORDEN_ESTADO_LABELS: Record<string, string> = {
  PENDIENTE: 'Pendiente',
  EN_PROGRESO: 'En progreso',
  COMPLETADO: 'Completado',
  CANCELADO: 'Cancelado',
};

export const ORDEN_ESTADO_COLORS: Record<string, string> = {
  PENDIENTE: 'bg-slate-100 text-slate-600 border-slate-200',
  EN_PROGRESO: 'bg-blue-100 text-blue-700 border-blue-200',
  COMPLETADO: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  CANCELADO: 'bg-red-100 text-red-700 border-red-200',
};

export const FRECUENCIAS_PLAN = [
  'MENSUAL',
  'TRIMESTRAL',
  'SEMESTRAL',
  'ANUAL',
] as const;

export const FRECUENCIA_LABELS: Record<string, string> = {
  MENSUAL: 'Mensual',
  TRIMESTRAL: 'Trimestral',
  SEMESTRAL: 'Semestral',
  ANUAL: 'Anual',
};

export const CHECKLIST_ENTREGA = [
  'Estado visual general del equipo',
  'Accesorios y componentes completos',
  'Nivel de combustible / batería',
  'Prueba de funcionamiento',
  'Documentación (manual, certificados)',
];

export const CHECKLIST_RETORNO = [
  'Estado visual general del equipo',
  'Accesorios devueltos completos',
  'Condición de operación',
  'Daños o novedades',
  'Limpieza y orden',
];

export const RESULTADO_LABELS: Record<string, string> = {
  OK: 'OK',
  NO_OK: 'No OK',
  NA: 'N/A',
};

export const RESULTADO_COLORS: Record<string, string> = {
  OK: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  NO_OK: 'bg-red-100 text-red-700 border-red-200',
  NA: 'bg-slate-100 text-slate-500 border-slate-200',
};

export const ROL_LABELS: Record<string, string> = {
  ADMINISTRADOR: 'Administrador',
  GERENCIA: 'Gerencia',
  COMERCIAL: 'Comercial',
  LOGISTICA: 'Logística',
  OPERACIONES: 'Operaciones',
  CONTABILIDAD: 'Contabilidad',
  ALMACEN: 'Almacén',
  CONSULTA: 'Consulta',
};

export const ROLES = [
  'ADMINISTRADOR',
  'GERENCIA',
  'COMERCIAL',
  'LOGISTICA',
  'OPERACIONES',
  'CONTABILIDAD',
  'ALMACEN',
  'CONSULTA',
] as const;

export const ROL_COLORS: Record<string, string> = {
  ADMINISTRADOR: 'bg-[#162B4D]/10 text-[#162B4D] border-[#162B4D]/20',
  GERENCIA: 'bg-purple-100 text-purple-700 border-purple-200',
  COMERCIAL: 'bg-blue-100 text-blue-700 border-blue-200',
  LOGISTICA: 'bg-amber-100 text-amber-700 border-amber-200',
  OPERACIONES: 'bg-orange-100 text-orange-700 border-orange-200',
  CONTABILIDAD: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  ALMACEN: 'bg-cyan-100 text-cyan-700 border-cyan-200',
  CONSULTA: 'bg-slate-100 text-slate-600 border-slate-200',
};

// Roles que pueden crear/editar equipos (coincide con @Roles del backend)
export const ROLES_EDITAN_EQUIPOS = [
  'ADMINISTRADOR',
  'GERENCIA',
  'ALMACEN',
  'OPERACIONES',
];

// Roles que pueden eliminar (dar de baja) equipos (backend: DELETE /equipos/:id)
export const ROLES_ELIMINAN_EQUIPOS = [
  'ADMINISTRADOR',
  'GERENCIA',
  'ALMACEN',
  'OPERACIONES',
];

// Roles que pueden crear/editar contratos de alquiler (backend: alquileres.controller)
export const ROLES_EDITAN_ALQUILERES = [
  'ADMINISTRADOR',
  'GERENCIA',
  'COMERCIAL',
  'LOGISTICA',
  'OPERACIONES',
  'ALMACEN',
];

// Roles que pueden gestionar mantenimiento (backend: mantenimiento.controller)
export const ROLES_EDITAN_MANTENIMIENTO = [
  'ADMINISTRADOR',
  'GERENCIA',
  'LOGISTICA',
  'OPERACIONES',
  'ALMACEN',
];

export const ROL_DESCRIPCION: Record<string, string> = {
  ADMINISTRADOR: 'Acceso total al sistema y gestión de usuarios',
  GERENCIA: 'Visión global, reportes, auditoría y aprobaciones',
  COMERCIAL: 'Cotizaciones, contratos de alquiler y clientes',
  LOGISTICA: 'Alquileres, mantenimiento y disponibilidad de flota',
  OPERACIONES: 'Operación de equipos, mantenimiento y check lists',
  CONTABILIDAD: 'Ingresos, cotizaciones y contratos (solo lectura operativa)',
  ALMACEN: 'Inventario, equipos y estados de almacén',
  CONSULTA: 'Acceso de solo lectura a todo el sistema',
};

export interface UsuarioSesion {
  id: string;
  nombre: string;
  email: string;
  rol: string;
}

export function isTokenExpired(token: string): boolean {
  try {
    const payloadBase64 = token.split('.')[1];
    if (!payloadBase64) return true;
    const decodedJson = atob(payloadBase64.replace(/-/g, '+').replace(/_/g, '/'));
    const payload = JSON.parse(decodedJson) as { exp?: number };
    if (!payload.exp) return false;
    // Dar un margen de 10 segundos antes del tiempo de expiración exacto
    return Date.now() >= payload.exp * 1000 - 10000;
  } catch {
    return true;
  }
}

function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return decodeURIComponent(parts.pop()?.split(';').shift() || '');
  return null;
}

function setCookie(name: string, value: string, days = 1) {
  if (typeof document === 'undefined') return;
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
}

function eraseCookie(name: string) {
  if (typeof document === 'undefined') return;
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; SameSite=Lax`;
}

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  const token = getCookie('hht_admin_token');
  if (!token) return null;

  if (isTokenExpired(token)) {
    clearSession();
    return null;
  }

  return token;
}

export function getStoredUser(): UsuarioSesion | null {
  if (typeof window === 'undefined') return null;
  if (!getToken()) return null;
  try {
    const raw = getCookie('hht_admin_user');
    return raw ? (JSON.parse(raw) as UsuarioSesion) : null;
  } catch {
    return null;
  }
}

export function saveSession(token: string, usuario: UsuarioSesion) {
  // Se almacena la sesión mediante Cookies seguras del navegador.
  // Se ha removido completamente el uso de localStorage.
  setCookie('hht_admin_token', token, 1);
  setCookie('hht_admin_user', JSON.stringify(usuario), 1);
  if (typeof localStorage !== 'undefined') {
    localStorage.removeItem('hht_admin_token');
    localStorage.removeItem('hht_admin_user');
  }
}

export function clearSession() {
  eraseCookie('hht_admin_token');
  eraseCookie('hht_admin_user');
  if (typeof localStorage !== 'undefined') {
    localStorage.removeItem('hht_admin_token');
    localStorage.removeItem('hht_admin_user');
  }
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {};

  if (options.headers instanceof Headers) {
    options.headers.forEach((value, key) => {
      headers[key] = value;
    });
  } else if (options.headers) {
    Object.assign(headers, options.headers);
  }

  if (options.body && !(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_URL}${path}`, { ...options, headers });

  if (res.status === 401) {
    clearSession();
    if (typeof window !== 'undefined') {
      window.location.href = '/admin/login';
    }
    throw new Error('Sesión expirada');
  }

  if (!res.ok) {
    let msg = `Error ${res.status}`;
    try {
      const data = (await res.json()) as { message?: string | string[] };
      if (Array.isArray(data.message)) msg = data.message.join(', ');
      else if (data.message) msg = data.message;
    } catch {}
    throw new Error(msg);
  }

  return res.json() as Promise<T>;
}

// GET /equipos (catálogo público) devuelve un objeto paginado { items, total, ... },
// NO un array. Esta función normaliza la respuesta a un array plano para el admin.
export async function fetchEquiposPublicos<T = unknown>(): Promise<T[]> {
  const res = await apiFetch<{ items?: T[] } | T[]>('/equipos?pageSize=10000');
  return Array.isArray(res) ? res : (res?.items ?? []);
}
