'use client';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  CalendarDays,
  CalendarRange,
  CheckCircle2,
  CircleDollarSign,
  Coins,
  FileText,
  FolderTree,
  Gauge,
  MapPin,
  Package,
  Plus,
  TrendingUp,
  Users,
  Wallet,
  Wrench,
} from 'lucide-react';
import {
  apiFetch,
  CONTRATO_ESTADO_COLORS,
  CONTRATO_ESTADO_LABELS,
  ESTADO_COLORS,
  ESTADO_LABELS,
  formatPEN,
  ROL_LABELS,
  ROLES_EDITAN_EQUIPOS,
} from '@/lib/api';
import { useSession } from '@/hooks/useSession';

interface ResumenEquipo {
  id: string;
  codigoInterno: string;
  nombre: string;
  estado: string;
  ubicacion: string;
  familia?: { nombre: string } | null;
  marca?: string | null;
}

interface DashboardResumen {
  generadoEn: string;
  periodo: { desde: string | null; hasta: string | null };
  flota: {
    total: number;
    activos: number;
    disponibles: number;
    alquilados: number;
    reservados: number;
    enMantenimiento: number;
    fueraServicio: number;
    dadosDeBaja: number;
    utilizacionActual: number;
    sinRotacion: number;
    valorInventario: number;
    valorReposicion: number;
  };
  ingresos: {
    facturado: number;
    enCurso: number;
    proyectado: number;
    cancelado: number;
  };
  utilizacion90: number;
  equiposMasRentables: {
    id: string;
    codigoInterno: string | null;
    nombre: string;
    ingreso: number;
    costo: number;
    roi: number | null;
  }[];
  topClientes: {
    cliente: string;
    empresa: string | null;
    ingreso: number;
    contratos: number;
  }[];
  ingresosPorMes: { mes: string; etiqueta: string; ingreso: number }[];
  contratosPorEstado: { estado: string; cantidad: number }[];
  mantenimiento: {
    pendientes: number;
    enProgreso: number;
    completadas: number;
    canceladas: number;
    costoTotal: number;
  };
  cotizaciones: { pendientes: number; totalEstimado: number };
  alquileresActivos: {
    id: string;
    numero: string;
    clienteNombre: string;
    clienteEmpresa: string | null;
    proyecto: string;
    fechaInicio: string;
    fechaFin: string;
    total: number;
    equipos: number;
  }[];
}

function colorDeEstado(estado: string): string {
  const c = CONTRATO_ESTADO_COLORS[estado] ?? '';
  if (c.includes('emerald')) return '#10B981';
  if (c.includes('amber')) return '#F59E0B';
  if (c.includes('blue')) return '#3B82F6';
  if (c.includes('red')) return '#EF4444';
  return '#94A3B8';
}

function formatoFecha(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('es-PE', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return iso;
  }
}

interface Periodo {
  desde: string;
  hasta: string;
}

const PRESETS = [
  { id: 'todo', label: 'Todo' },
  { id: 'mes', label: 'Este mes' },
  { id: '3m', label: '3 meses' },
  { id: '6m', label: '6 meses' },
  { id: 'anio', label: '1 año' },
] as const;

type IdPreset = (typeof PRESETS)[number]['id'];

const OFFSETS_PRESET: Record<Exclude<IdPreset, 'todo'>, number> = {
  mes: 0,
  '3m': 2,
  '6m': 5,
  anio: 11,
};

function aISO(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function periodoDePreset(id: IdPreset): Periodo | null {
  if (id === 'todo') return null;
  const hoy = new Date();
  const inicio = new Date(
    hoy.getFullYear(),
    hoy.getMonth() - OFFSETS_PRESET[id],
    1,
  );
  return { desde: aISO(inicio), hasta: aISO(hoy) };
}

function ultimoDiaDeMes(mes: string): string {
  const [anio, mesNum] = mes.split('-').map(Number);
  const ultimo = new Date(anio, mesNum, 0).getDate();
  return `${mes}-${String(ultimo).padStart(2, '0')}`;
}

function formatoPeriodo(p: Periodo): string {
  const f = (iso: string) =>
    new Date(`${iso}T00:00:00`).toLocaleDateString('es-PE', {
      month: 'short',
      year: 'numeric',
    });
  if (p.desde.slice(0, 7) === p.hasta.slice(0, 7)) return f(p.desde);
  return `${f(p.desde)} – ${f(p.hasta)}`;
}

export default function AdminDashboardPage() {
  const [resumen, setResumen] = useState<DashboardResumen | null>(null);
  const [equipos, setEquipos] = useState<ResumenEquipo[]>([]);
  const [cargando, setCargando] = useState(true);
  const [refrescando, setRefrescando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [periodo, setPeriodo] = useState<Periodo | null>(null);
  const [version, setVersion] = useState(0);
  const [desdeMes, setDesdeMes] = useState('');
  const [hastaMes, setHastaMes] = useState('');
  const [presetActivo, setPresetActivo] = useState<IdPreset | null>('todo');
  const [errorRango, setErrorRango] = useState<string | null>(null);
  const user = useSession();

  useEffect(() => {
    let activo = true;
    const params = periodo
      ? `?desde=${periodo.desde}&hasta=${periodo.hasta}`
      : '';
    apiFetch<DashboardResumen>(`/dashboard/resumen${params}`)
      .then((data) => {
        if (!activo) return;
        setResumen(data);
        setError(null);
        setCargando(false);
        setRefrescando(false);
      })
      .catch(() => {
        if (!activo) return;
        setCargando(false);
        setRefrescando(false);
        setError('No se pudieron cargar los indicadores del período.');
      });
    return () => {
      activo = false;
    };
  }, [periodo, version]);

  useEffect(() => {
    apiFetch<ResumenEquipo[]>('/equipos/admin/listar')
      .then((lista) => setEquipos(lista))
      .catch(() => undefined);
  }, []);

  const aplicarPeriodo = (nuevo: Periodo | null) => {
    setRefrescando(true);
    setPeriodo(nuevo);
    setVersion((v) => v + 1);
  };

  const aplicarPreset = (id: IdPreset) => {
    setPresetActivo(id);
    setDesdeMes('');
    setHastaMes('');
    setErrorRango(null);
    aplicarPeriodo(periodoDePreset(id));
  };

  const aplicarPeriodoCustom = (desde: string, hasta: string) => {
    if (!desde && !hasta) {
      setPresetActivo('todo');
      setErrorRango(null);
      aplicarPeriodo(null);
      return;
    }
    const desdeISO = `${desde || hasta}-01`;
    const hastaISO = ultimoDiaDeMes(hasta || desde);
    if (desdeISO > hastaISO) {
      setErrorRango('La fecha inicial no puede ser posterior a la final.');
      return;
    }
    setPresetActivo(null);
    setErrorRango(null);
    aplicarPeriodo({ desde: desdeISO, hasta: hastaISO });
  };

  const cambiarDesdeMes = (v: string) => {
    setDesdeMes(v);
    aplicarPeriodoCustom(v, hastaMes);
  };

  const cambiarHastaMes = (v: string) => {
    setHastaMes(v);
    aplicarPeriodoCustom(desdeMes, v);
  };

  if (cargando) {
    return (
      <div className="py-24 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-[#162B4D] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error && !resumen) {
    return (
      <div className="py-24 flex flex-col items-center justify-center gap-4">
        <AlertTriangle className="w-10 h-10 text-red-400" />
        <p className="text-sm font-[600] text-slate-600">{error}</p>
        <button
          onClick={() => aplicarPeriodo(periodo)}
          className="px-4 py-2 bg-[#162B4D] hover:bg-[#1d3a63] text-white text-xs font-[700] rounded-[10px] transition-colors"
        >
          Reintentar
        </button>
      </div>
    );
  }

  const conteoPorEstado = (estado: string) =>
    equipos.filter((e) => e.estado === estado).length;

  const maxIngresoMes = Math.max(
    ...(resumen?.ingresosPorMes ?? []).map((m) => m.ingreso),
    1,
  );
  const maxIngresoEquipo = Math.max(
    ...(resumen?.equiposMasRentables ?? []).map((e) => e.ingreso),
    1,
  );
  const totalContratos = (resumen?.contratosPorEstado ?? []).reduce(
    (acc, c) => acc + c.cantidad,
    0,
  );
  const otAbiertas =
    (resumen?.mantenimiento.pendientes ?? 0) +
    (resumen?.mantenimiento.enProgreso ?? 0);
  const flota = resumen?.flota;

  return (
    <div className="space-y-4">
      {/* ENCABEZADO */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-spartan font-[800] text-2xl text-slate-900 uppercase tracking-tight">
            Dashboard Gerencial
          </h1>
          <p className="text-sm text-slate-500 mt-1 font-[500] flex items-center gap-2">
            <CalendarDays className="w-3.5 h-3.5" />
            {user
              ? `${user.nombre} · ${ROL_LABELS[user.rol] || user.rol} — `
              : ''}
            {resumen
              ? formatoFecha(resumen.generadoEn)
              : new Date().toLocaleDateString('es-PE')}
          </p>
        </div>
        {user && ROLES_EDITAN_EQUIPOS.includes(user.rol) && (
            <Link
              href="/admin/equipos/nuevo"
              className="inline-flex items-center gap-2 px-5 py-3 bg-[#E63C46] hover:bg-[#C92A36] text-white text-xs font-[800] rounded-[14px] shadow-lg shadow-[#E63C46]/25 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Registrar Equipo</span>
            </Link>
          )}
      </div>

      {/* FILTRO DE PERÍODO */}
      <div className="bg-white rounded-[12px] border border-slate-200/70 shadow-sm p-2.5">
        <div className="flex flex-col lg:flex-row lg:items-center gap-2">
          <div className="flex items-center gap-1.5 shrink-0">
            <CalendarRange className="w-3.5 h-3.5 text-[#E63C46]" />
            <span className="text-[11px] font-[800] uppercase tracking-wide text-slate-600">
              Período
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            {PRESETS.map((p) => (
              <button
                key={p.id}
                onClick={() => aplicarPreset(p.id)}
                className={`px-2.5 py-1 rounded-[6px] text-[11px] font-[700] transition-all ${
                  presetActivo === p.id
                    ? 'bg-[#162B4D] text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-1.5">
            <input
              type="month"
              value={desdeMes}
              onChange={(e) => cambiarDesdeMes(e.target.value)}
              className="px-2 py-1 rounded-[6px] border border-slate-200 bg-slate-50 text-[11px] font-[600] text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#E63C46]/30"
            />
            <span className="text-slate-400 text-xs">→</span>
            <input
              type="month"
              value={hastaMes}
              onChange={(e) => cambiarHastaMes(e.target.value)}
              className="px-2 py-1 rounded-[6px] border border-slate-200 bg-slate-50 text-[11px] font-[600] text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#E63C46]/30"
            />
          </div>
          <div className="lg:ml-auto flex items-center justify-end gap-2 text-[11px] font-[600] text-slate-500">
            {refrescando ? (
              <span className="inline-flex items-center gap-1.5">
                <span className="w-3 h-3 border-2 border-[#162B4D] border-t-transparent rounded-full animate-spin" />
                Actualizando…
              </span>
            ) : periodo ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#E63C46]/10 text-[#C92A36] font-[800]">
                {formatoPeriodo(periodo)}
              </span>
            ) : (
              <span className="text-slate-400">Todo el historial</span>
            )}
          </div>
        </div>
        {errorRango && (
          <p className="mt-1 text-[11px] font-[600] text-red-500">
            {errorRango}
          </p>
        )}
        {error && resumen && (
          <p className="mt-1 text-[11px] font-[600] text-red-500">
            {error} — mostrando datos del período anterior.
          </p>
        )}
      </div>

      {/* ===== INGRESOS ===== */}
      <div>
        <h2 className="text-xs font-[800] uppercase tracking-widest text-slate-400 mb-3 flex items-center gap-2">
          Ingresos por Alquiler
          {periodo && (
            <span className="px-2 py-0.5 rounded-full bg-[#162B4D]/10 text-[#162B4D] normal-case tracking-normal">
              {formatoPeriodo(periodo)}
            </span>
          )}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <TarjetaKpi
            label="Facturado"
            value={formatPEN(resumen?.ingresos.facturado)}
            sub="Contratos finalizados"
            icon={CircleDollarSign}
            iconBg="bg-emerald-100"
            iconText="text-emerald-600"
          />
          <TarjetaKpi
            label="En curso"
            value={formatPEN(resumen?.ingresos.enCurso)}
            sub="Contratos activos"
            icon={Activity}
            iconBg="bg-blue-100"
            iconText="text-blue-600"
          />
          <TarjetaKpi
            label="Proyectado"
            value={formatPEN(resumen?.ingresos.proyectado)}
            sub="Confirmados por iniciar"
            icon={TrendingUp}
            iconBg="bg-amber-100"
            iconText="text-amber-600"
          />
          <TarjetaKpi
            label="Cancelado"
            value={formatPEN(resumen?.ingresos.cancelado)}
            sub="Contratos anulados"
            icon={Coins}
            iconBg="bg-red-100"
            iconText="text-red-600"
          />
        </div>
      </div>

      {/* ===== OPERACIÓN ===== */}
      <div>
        <h2 className="text-xs font-[800] uppercase tracking-widest text-slate-400 mb-3">
          Operación de Flota
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-[20px] border border-slate-200/80 p-5 shadow-sm hover:shadow-md hover:border-slate-300 transition-all flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <span className="text-xs font-[700] text-slate-500 block truncate">Utilización actual</span>
              <span className="font-spartan font-[800] text-xl sm:text-2xl text-[#162B4D] block mt-1.5 leading-none">
                {flota?.utilizacionActual ?? 0}%
              </span>
              <p className="text-xs text-slate-400 font-[500] truncate mt-2">
                {flota?.alquilados ?? 0} alq. + {flota?.reservados ?? 0} res. / {flota?.activos ?? 0} act.
              </p>
            </div>
            <div
              className="relative w-11 h-11 rounded-full shrink-0 shadow-sm"
              style={{
                background: `conic-gradient(#10B981 ${flota?.utilizacionActual ?? 0}%, #E2E8F0 0)`,
              }}
            >
              <div className="absolute inset-[4px] bg-white rounded-full flex items-center justify-center">
                <span className="font-spartan font-[800] text-[10px] text-slate-900">
                  {flota?.utilizacionActual ?? 0}%
                </span>
              </div>
            </div>
          </div>

          <TarjetaKpi
            label={periodo ? 'Utilización del período' : 'Utilización 90 días'}
            value={`${resumen?.utilizacion90 ?? 0}%`}
            sub={
              periodo
                ? 'Días-equipo alquilados en el rango'
                : 'Días-equipo · últimos 90 días'
            }
            icon={Gauge}
            iconBg="bg-[#162B4D]/10"
            iconText="text-[#162B4D]"
          />
          <TarjetaKpi
            label="OT de mantenimiento"
            value={String(otAbiertas)}
            sub={`${resumen?.mantenimiento.pendientes ?? 0} pendientes · ${resumen?.mantenimiento.enProgreso ?? 0} en progreso`}
            icon={Wrench}
            iconBg="bg-orange-100"
            iconText="text-orange-600"
            enlace="/admin/mantenimiento"
          />
          <TarjetaKpi
            label="Cotizaciones pendientes"
            value={String(resumen?.cotizaciones.pendientes ?? 0)}
            sub={`Estimado: ${formatPEN(resumen?.cotizaciones.totalEstimado)}`}
            icon={FileText}
            iconBg="bg-violet-100"
            iconText="text-violet-600"
          />
        </div>
      </div>

      {/* ===== GRÁFICAS ===== */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* INGRESOS POR MES */}
        <div className="lg:col-span-2 bg-white rounded-[20px] border border-slate-200/70 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-[800] text-sm text-slate-900 uppercase tracking-wide">
                Ingresos por Mes
              </h2>
              <p className="text-[11px] text-slate-500 font-[500] mt-0.5">
                {periodo ? 'Meses del período seleccionado' : 'Últimos 6 meses'}{' '}
                · contratos confirmados, en curso y finalizados
              </p>
            </div>
            <Wallet className="w-4 h-4 text-slate-400" />
          </div>
          <div className="flex items-end gap-3 h-48">
            {(resumen?.ingresosPorMes ?? []).map((m) => {
              const altura = Math.max(
                (m.ingreso / maxIngresoMes) * 100,
                m.ingreso > 0 ? 8 : 2,
              );
              return (
                <div
                  key={m.mes}
                  className="flex-1 flex flex-col items-center gap-2 min-w-0"
                  title={`${m.etiqueta}: ${formatPEN(m.ingreso)}`}
                >
                  <span className="text-[10px] font-[700] text-slate-500 truncate max-w-full">
                    {m.ingreso > 0 ? formatPEN(m.ingreso) : '—'}
                  </span>
                  <div
                    className={`w-full rounded-t-[8px] transition-all duration-700 ${
                      m.ingreso > 0 ? 'bg-[#E63C46]/80 hover:bg-[#E63C46]' : 'bg-slate-100'
                    }`}
                    style={{ height: `${altura}%` }}
                  />
                  <span className="text-[10px] font-[700] uppercase text-slate-400 capitalize">
                    {m.etiqueta}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* CONTRATOS POR ESTADO */}
        <div className="bg-white rounded-[20px] border border-slate-200/70 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-[800] text-sm text-slate-900 uppercase tracking-wide">
                Contratos por Estado
              </h2>
              <p className="text-[11px] text-slate-500 font-[500] mt-0.5">
                {totalContratos} contratos en total
              </p>
            </div>
            <Activity className="w-4 h-4 text-slate-400" />
          </div>
          <div className="space-y-3.5">
            {(resumen?.contratosPorEstado ?? []).map((c) => (
              <div key={c.estado}>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-[600] text-slate-600">
                    {CONTRATO_ESTADO_LABELS[c.estado] || c.estado}
                  </span>
                  <span className="font-[800] text-slate-900">{c.cantidad}</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${totalContratos > 0 ? (c.cantidad / totalContratos) * 100 : 0}%`,
                      backgroundColor: colorDeEstado(c.estado),
                    }}
                  />
                </div>
              </div>
            ))}
            {totalContratos === 0 && (
              <p className="text-center text-xs text-slate-400 font-[500] py-6">
                Aún no hay contratos registrados.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* ===== RENTABILIDAD Y CLIENTES ===== */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* EQUIPOS MÁS RENTABLES */}
        <div className="bg-white rounded-[20px] border border-slate-200/70 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-[800] text-sm text-slate-900 uppercase tracking-wide">
                Equipos Más Rentables
              </h2>
              <p className="text-[11px] text-slate-500 font-[500] mt-0.5">
                Ingreso generado vs. costo del equipo
              </p>
            </div>
            <TrendingUp className="w-4 h-4 text-slate-400" />
          </div>
          <div className="space-y-4">
            {(resumen?.equiposMasRentables ?? []).map((eq) => (
              <div key={eq.id}>
                <div className="flex items-center justify-between gap-3 mb-1.5">
                  <div className="min-w-0">
                    <p className="text-[12px] font-[700] text-slate-800 truncate">
                      {eq.codigoInterno?.replace('HTR-MEG-', '') || '??'} ·{' '}
                      {eq.nombre}
                    </p>
                    <p className="text-[10px] text-slate-400 font-[500]">
                      Costo: {formatPEN(eq.costo)}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-[12px] font-[800] text-emerald-600">
                      {formatPEN(eq.ingreso)}
                    </p>
                    {eq.roi !== null && (
                      <span
                        className={`text-[9px] font-[800] px-1.5 py-0.5 rounded-full ${
                          eq.roi >= 0
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-red-100 text-red-700'
                        }`}
                      >
                        ROI {eq.roi >= 0 ? '+' : ''}
                        {eq.roi}%
                      </span>
                    )}
                  </div>
                </div>
                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-[#162B4D] transition-all duration-700"
                    style={{
                      width: `${(eq.ingreso / maxIngresoEquipo) * 100}%`,
                    }}
                  />
                </div>
              </div>
            ))}
            {(resumen?.equiposMasRentables ?? []).length === 0 && (
              <p className="text-center text-xs text-slate-400 font-[500] py-6">
                Sin alquileres registrados aún.
              </p>
            )}
          </div>
          <Link
            href="/admin/equipos"
            className="mt-5 flex items-center justify-center gap-2 w-full py-3 bg-slate-50 hover:bg-slate-100 rounded-[12px] text-xs font-[700] text-slate-700 transition-colors"
          >
            <Package className="w-4 h-4 text-[#E63C46]" />
            <span>Ver Maestro de Equipos</span>
          </Link>
        </div>

        {/* TOP CLIENTES */}
        <div className="bg-white rounded-[20px] border border-slate-200/70 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-[800] text-sm text-slate-900 uppercase tracking-wide">
                Top Clientes
              </h2>
              <p className="text-[11px] text-slate-500 font-[500] mt-0.5">
                Por ingreso total facturado
              </p>
            </div>
            <Users className="w-4 h-4 text-slate-400" />
          </div>
          <div className="space-y-3">
            {(resumen?.topClientes ?? []).map((c, i) => (
              <div
                key={c.cliente}
                className="flex items-center gap-3 py-2 border-b border-slate-100 last:border-0"
              >
                <span className="w-7 h-7 rounded-full bg-[#162B4D]/5 border border-slate-200 flex items-center justify-center text-[11px] font-[800] text-[#162B4D] shrink-0">
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] font-[700] text-slate-800 truncate">
                    {c.cliente}
                  </p>
                  <p className="text-[10px] text-slate-400 font-[500]">
                    {c.empresa || 'Particular'} · {c.contratos}{' '}
                    {c.contratos === 1 ? 'contrato' : 'contratos'}
                  </p>
                </div>
                <span className="text-[12px] font-[800] text-slate-900 shrink-0">
                  {formatPEN(c.ingreso)}
                </span>
              </div>
            ))}
            {(resumen?.topClientes ?? []).length === 0 && (
              <p className="text-center text-xs text-slate-400 font-[500] py-6">
                Sin clientes con contratos aún.
              </p>
            )}
          </div>
        </div>

        {/* ALQUILERES ACTIVOS */}
        <div className="bg-white rounded-[20px] border border-slate-200/70 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-[800] text-sm text-slate-900 uppercase tracking-wide">
                Alquileres Activos
              </h2>
              <p className="text-[11px] text-slate-500 font-[500] mt-0.5">
                Contratos EN CURSO ahora mismo
              </p>
            </div>
            <CheckCircle2 className="w-4 h-4 text-slate-400" />
          </div>
          <div className="space-y-3">
            {(resumen?.alquileresActivos ?? []).map((c) => (
              <Link
                key={c.id}
                href={`/admin/alquileres/${c.id}`}
                className="block rounded-[14px] border border-slate-200/70 p-3.5 hover:border-[#E63C46]/40 hover:shadow-sm transition-all group"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-[800] text-[#162B4D]">
                    {c.numero}
                  </span>
                  <span className="text-[11px] font-[800] text-emerald-600">
                    {formatPEN(c.total)}
                  </span>
                </div>
                <p className="text-[12px] font-[700] text-slate-800 truncate group-hover:text-[#E63C46] transition-colors">
                  {c.clienteNombre}
                </p>
                <div className="flex items-center justify-between mt-1.5">
                  <span className="text-[10px] text-slate-400 font-[500]">
                    {formatoFecha(c.fechaInicio)} → {formatoFecha(c.fechaFin)}
                  </span>
                  <span className="text-[10px] font-[700] text-slate-500">
                    {c.equipos} {c.equipos === 1 ? 'equipo' : 'equipos'}
                  </span>
                </div>
              </Link>
            ))}
            {(resumen?.alquileresActivos ?? []).length === 0 && (
              <div className="text-center py-6">
                <CheckCircle2 className="w-8 h-8 text-emerald-200 mx-auto mb-2" />
                <p className="text-xs text-slate-400 font-[500]">
                  No hay alquileres activos.
                </p>
              </div>
            )}
          </div>
          <Link
            href="/admin/alquileres"
            className="mt-4 flex items-center justify-center gap-2 w-full py-3 bg-slate-50 hover:bg-slate-100 rounded-[12px] text-xs font-[700] text-slate-700 transition-colors"
          >
            <span>Ver Alquileres</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* ALERTA DE FLOTA */}
      {(flota?.sinRotacion ?? 0) > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-[20px] p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-[700] text-amber-800">
              Tiempo muerto detectado
            </p>
            <p className="text-xs text-amber-700 font-[500] mt-0.5">
              {flota?.sinRotacion} equipos nunca han sido alquilados
              ({flota?.disponibles ?? 0} disponibles sin rotación). Valor del
              inventario: {formatPEN(flota?.valorInventario)} · Reposición:{' '}
              {formatPEN(flota?.valorReposicion)}. Revisa precios o promociona
              estos equipos en el catálogo.
            </p>
          </div>
        </div>
      )}

      {/* ===== RESUMEN DE INVENTARIO ===== */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* ÚLTIMOS EQUIPOS */}
        <div className="lg:col-span-2 bg-white rounded-[20px] border border-slate-200/70 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="font-[800] text-sm text-slate-900 uppercase tracking-wide">
                Últimos Equipos Registrados
              </h2>
              <p className="text-[11px] text-slate-500 font-[500] mt-0.5">
                Maestro General de Equipos · Códigos HTR-MEG
              </p>
            </div>
            <Link
              href="/admin/equipos"
              className="text-[11px] font-[700] text-[#E63C46] hover:text-[#C92A36] inline-flex items-center gap-1"
            >
              Ver todos <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="divide-y divide-slate-100">
            {equipos.slice(0, 5).map((eq) => (
              <Link
                key={eq.id}
                href={`/admin/equipos/${eq.id}`}
                className="flex items-center gap-4 px-5 py-3.5 hover:bg-slate-50 transition-colors group"
              >
                <span className="w-9 h-9 rounded-[10px] bg-[#162B4D]/5 border border-slate-200 flex items-center justify-center text-[10px] font-[800] text-[#162B4D] shrink-0">
                  {eq.codigoInterno?.replace('HTR-MEG-', '') || '??'}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-[700] text-slate-800 truncate group-hover:text-[#162B4D] transition-colors">
                    {eq.nombre}
                  </p>
                  <div className="flex items-center gap-2 text-[11px] text-slate-400 font-[500] mt-0.5">
                    <span>{eq.marca || 'Sin marca'}</span>
                    {eq.familia?.nombre && (
                      <>
                        <span>·</span>
                        <span>{eq.familia.nombre}</span>
                      </>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="flex items-center gap-1 text-[11px] text-slate-400 font-[500]">
                    <MapPin className="w-3 h-3" />
                    {eq.ubicacion}
                  </span>
                  <span
                    className={`px-2.5 py-1 rounded-full text-[10px] font-[800] border ${
                      ESTADO_COLORS[eq.estado] || 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {ESTADO_LABELS[eq.estado] || eq.estado}
                  </span>
                </div>
              </Link>
            ))}
            {equipos.length === 0 && (
              <div className="p-8 text-center text-sm text-slate-400 font-[500]">
                No hay equipos registrados aún.
              </div>
            )}
          </div>
        </div>

        {/* ESTADOS DEL INVENTARIO */}
        <div className="bg-white rounded-[20px] border border-slate-200/70 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-[800] text-sm text-slate-900 uppercase tracking-wide">
              Estados del Inventario
            </h2>
            <Activity className="w-4 h-4 text-slate-400" />
          </div>
          <div className="space-y-2.5">
            {Object.entries(ESTADO_LABELS).map(([estado, label]) => {
              const cantidad = conteoPorEstado(estado);
              const total = equipos.length || 1;
              return (
                <div key={estado}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-[600] text-slate-600">{label}</span>
                    <span className="font-[800] text-slate-900">
                      {cantidad}
                    </span>
                  </div>
                  <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${(cantidad / total) * 100}%`,
                        backgroundColor: ESTADO_COLORS[estado]?.includes(
                          'emerald',
                        )
                          ? '#10B981'
                          : ESTADO_COLORS[estado]?.includes('amber')
                            ? '#F59E0B'
                            : ESTADO_COLORS[estado]?.includes('blue')
                              ? '#3B82F6'
                              : ESTADO_COLORS[estado]?.includes('orange')
                                ? '#F97316'
                                : ESTADO_COLORS[estado]?.includes('red')
                                  ? '#EF4444'
                                  : '#94A3B8',
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <Link
            href="/admin/familias"
            className="mt-5 flex items-center justify-center gap-2 w-full py-3 bg-slate-50 hover:bg-slate-100 rounded-[12px] text-xs font-[700] text-slate-700 transition-colors"
          >
            <FolderTree className="w-4 h-4 text-[#E63C46]" />
            <span>Gestionar Categorías</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

function TarjetaKpi({
  label,
  value,
  sub,
  icon: Icon,
  iconBg,
  iconText,
  enlace,
}: {
  label: string;
  value: string;
  sub: string;
  icon: React.ComponentType<{ className?: string }>;
  iconBg: string;
  iconText: string;
  enlace?: string;
}) {
  const contenido = (
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0 flex-1">
        <span className="text-xs font-[700] text-slate-500 block truncate">{label}</span>
        <span className="font-spartan font-[800] text-xl sm:text-2xl text-[#162B4D] block mt-1.5 leading-none">
          {value}
        </span>
        <div className="text-xs font-[500] text-slate-400 truncate mt-2">
          {sub}
        </div>
      </div>
      <span
        className={`w-11 h-11 rounded-[14px] ${iconBg} flex items-center justify-center shrink-0 border border-slate-100 shadow-sm`}
      >
        <Icon className={`w-5 h-5 ${iconText}`} />
      </span>
    </div>
  );

  const clases =
    'bg-white rounded-[20px] border border-slate-200/80 p-5 shadow-sm hover:shadow-md hover:border-slate-300 transition-all';

  if (enlace) {
    return (
      <Link href={enlace} className={`${clases} block`}>
        {contenido}
      </Link>
    );
  }
  return <div className={clases}>{contenido}</div>;
}
