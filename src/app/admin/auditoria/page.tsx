'use client';
import React, { useEffect, useState } from 'react';
import {
  ScrollText,
  ShieldCheck,
  User,
  Clock,
  Search,
  Cpu,
  Trash2,
  AlertTriangle,
} from 'lucide-react';
import { apiFetch, ROL_LABELS } from '@/lib/api';

interface RegistroAuditoria {
  id: string;
  email: string;
  rol?: string;
  accion: string;
  entidad: string;
  entidadId?: string;
  detalle?: string;
  ip?: string;
  createdAt: string;
  usuario?: { nombre: string; email: string } | null;
}

const COLORES_ACCION: Record<string, string> = {
  CREAR_EQUIPO: 'bg-emerald-100 text-emerald-700',
  ACTUALIZAR_EQUIPO: 'bg-blue-100 text-blue-700',
  CAMBIO_ESTADO: 'bg-amber-100 text-amber-700',
  AGREGAR_HISTORIAL: 'bg-violet-100 text-violet-700',
  SUBIR_DOCUMENTO: 'bg-cyan-100 text-cyan-700',
  ELIMINAR_DOCUMENTO: 'bg-red-100 text-red-700',
  DAR_DE_BAJA: 'bg-slate-800 text-white',
  CREAR_FAMILIA: 'bg-emerald-100 text-emerald-700',
  CREAR_SUBFAMILIA: 'bg-emerald-100 text-emerald-700',
};

export default function AdminAuditoriaPage() {
  const [registros, setRegistros] = useState<RegistroAuditoria[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filtroEntidad, setFiltroEntidad] = useState('');
  const [filtroEmail, setFiltroEmail] = useState('');
  const [modalPurgar, setModalPurgar] = useState(false);
  const [opcionPurgar, setOpcionPurgar] = useState<'30_DIAS' | '90_DIAS' | 'TODOS'>('30_DIAS');
  const [purgando, setPurgando] = useState(false);
  const [mensajeExito, setMensajeExito] = useState('');

  const cargar = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filtroEntidad) params.set('entidad', filtroEntidad);
      if (filtroEmail) params.set('email', filtroEmail);
      const data = await apiFetch<{ registros: RegistroAuditoria[]; total: number }>(
        `/auditoria?${params.toString()}`
      );
      setRegistros(data.registros);
      setTotal(data.total);
      setLoading(false);
    } catch {
      setLoading(false);
    }
  };

  const handlePurgar = async () => {
    setPurgando(true);
    try {
      const res = await apiFetch<{ eliminados: number; mensaje: string }>('/auditoria/purgar', {
        method: 'DELETE',
        body: JSON.stringify({ opcion: opcionPurgar }),
      });
      setMensajeExito(res.mensaje);
      setModalPurgar(false);
      cargar();
      setTimeout(() => setMensajeExito(''), 4000);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Error al purgar auditoría');
    } finally {
      setPurgando(false);
    }
  };

  useEffect(() => {
    apiFetch<{ registros: RegistroAuditoria[]; total: number }>('/auditoria')
      .then((data) => {
        setRegistros(data.registros);
        setTotal(data.total);
        setLoading(false);
      })
      .catch(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const aplicarFiltro = (e: React.FormEvent) => {
    e.preventDefault();
    cargar();
  };

  return (
    <div className="space-y-6">
      {mensajeExito && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-[700] rounded-[14px]">
          {mensajeExito}
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-spartan font-[800] text-2xl text-slate-900 uppercase tracking-tight">
            Registro de Auditoría
          </h1>
          <p className="text-sm text-slate-500 mt-1 font-[500]">
            Trazabilidad total: quién, qué, cuándo y desde dónde ({total} registros)
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setModalPurgar(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-[12px] text-[11px] font-[800] transition-all cursor-pointer shadow-sm"
          >
            <Trash2 className="w-4 h-4 text-red-500" />
            Purgar Datos
          </button>
          <span className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-[12px] text-[11px] font-[700] text-slate-600">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            Solo Admin y Gerencia
          </span>
        </div>
      </div>

      {/* FILTROS */}
      <form
        onSubmit={aplicarFiltro}
        className="bg-white rounded-[20px] border border-slate-200/70 p-4 shadow-sm grid grid-cols-1 md:grid-cols-3 gap-3"
      >
        <select
          value={filtroEntidad}
          onChange={(e) => setFiltroEntidad(e.target.value)}
          className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-[12px] text-xs font-[600] text-slate-700 focus:outline-none focus:border-[#162B4D] cursor-pointer"
        >
          <option value="">Entidad: Todas</option>
          <option value="Equipo">Equipo</option>
          <option value="Familia">Categoría</option>
          <option value="Subfamilia">Subcategoría</option>
        </select>
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={filtroEmail}
            onChange={(e) => setFiltroEmail(e.target.value)}
            placeholder="Buscar por correo del usuario..."
            className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-[12px] text-xs font-[600] focus:outline-none focus:border-[#162B4D] focus:bg-white transition-all"
          />
        </div>
        <button
          type="submit"
          className="px-4 py-2.5 bg-[#162B4D] hover:bg-[#10203B] text-white text-xs font-[800] rounded-[12px] transition-all"
        >
          Aplicar Filtros
        </button>
      </form>

      {/* TABLA DE AUDITORÍA */}
      {loading ? (
        <div className="py-20 flex items-center justify-center">
          <div className="w-10 h-10 border-4 border-[#162B4D] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : registros.length === 0 ? (
        <div className="py-16 bg-white rounded-[20px] border border-slate-200 text-center p-8">
          <ScrollText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-700 font-[700] text-base">Sin registros de auditoría</p>
          <p className="text-slate-500 text-xs mt-1 font-[500]">
            Las acciones sobre equipos, categorías y documentos se registrarán aquí automáticamente.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-[20px] border border-slate-200/70 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-500 uppercase font-[700] border-b border-slate-200 text-[10px]">
                  <th className="py-3.5 px-5">Fecha / Hora</th>
                  <th className="py-3.5 px-4">Usuario</th>
                  <th className="py-3.5 px-4">Rol</th>
                  <th className="py-3.5 px-4">Acción</th>
                  <th className="py-3.5 px-4">Entidad</th>
                  <th className="py-3.5 px-4">Detalle</th>
                  <th className="py-3.5 px-4">IP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {registros.map((reg) => (
                  <tr key={reg.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-5 whitespace-nowrap">
                      <span className="flex items-center gap-1.5 text-slate-600 font-[600]">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        {new Date(reg.createdAt).toLocaleString('es-PE', {
                          day: '2-digit',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="flex items-center gap-1.5 text-slate-700 font-[700]">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        {reg.usuario?.nombre || reg.email}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-[800]">
                        {ROL_LABELS[reg.rol || ''] || reg.rol || '—'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-[800] whitespace-nowrap ${
                          COLORES_ACCION[reg.accion] || 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {reg.accion.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-[600] text-slate-600">{reg.entidad}</td>
                    <td className="py-3.5 px-4">
                      {reg.detalle ? (
                        <span className="text-slate-500 font-[500] block max-w-[200px] truncate">
                          {reg.detalle}
                        </span>
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="flex items-center gap-1 text-slate-400 font-[500]">
                        <Cpu className="w-3 h-3" />
                        {reg.ip || '—'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL DE PURGA MASIVA */}
      {modalPurgar && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-[24px] max-w-md w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center gap-3 text-red-600">
              <div className="w-10 h-10 rounded-2xl bg-red-100 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="font-[800] text-slate-900 text-base">Purga Masiva de Auditoría</h3>
                <p className="text-xs text-slate-500 font-[500]">Liberar espacio en la base de datos</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 font-[500] leading-relaxed">
              Selecciona el rango de registros de auditoría antiguos que deseas eliminar permanentemente:
            </p>

            <div className="space-y-2">
              <label
                onClick={() => setOpcionPurgar('30_DIAS')}
                className={`flex items-center gap-3 p-3.5 rounded-[14px] border cursor-pointer transition-all ${
                  opcionPurgar === '30_DIAS'
                    ? 'border-red-500 bg-red-50/50 text-red-950 font-[700]'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-700 font-[500]'
                }`}
              >
                <input
                  type="radio"
                  name="purga"
                  checked={opcionPurgar === '30_DIAS'}
                  onChange={() => setOpcionPurgar('30_DIAS')}
                  className="accent-red-600"
                />
                <div className="text-xs">
                  <span className="block font-[700]">Anteriores a 30 días</span>
                  <span className="text-[11px] text-slate-500">Conserva el último mes de registros</span>
                </div>
              </label>

              <label
                onClick={() => setOpcionPurgar('90_DIAS')}
                className={`flex items-center gap-3 p-3.5 rounded-[14px] border cursor-pointer transition-all ${
                  opcionPurgar === '90_DIAS'
                    ? 'border-red-500 bg-red-50/50 text-red-950 font-[700]'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-700 font-[500]'
                }`}
              >
                <input
                  type="radio"
                  name="purga"
                  checked={opcionPurgar === '90_DIAS'}
                  onChange={() => setOpcionPurgar('90_DIAS')}
                  className="accent-red-600"
                />
                <div className="text-xs">
                  <span className="block font-[700]">Anteriores a 90 días</span>
                  <span className="text-[11px] text-slate-500">Conserva los últimos 3 meses</span>
                </div>
              </label>

              <label
                onClick={() => setOpcionPurgar('TODOS')}
                className={`flex items-center gap-3 p-3.5 rounded-[14px] border cursor-pointer transition-all ${
                  opcionPurgar === 'TODOS'
                    ? 'border-red-600 bg-red-100/60 text-red-950 font-[800]'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-700 font-[500]'
                }`}
              >
                <input
                  type="radio"
                  name="purga"
                  checked={opcionPurgar === 'TODOS'}
                  onChange={() => setOpcionPurgar('TODOS')}
                  className="accent-red-600"
                />
                <div className="text-xs">
                  <span className="block font-[700] text-red-600">Purgar TODOS los registros</span>
                  <span className="text-[11px] text-slate-500">Vacía el historial completo de auditoría ({total} reg.)</span>
                </div>
              </label>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                disabled={purgando}
                onClick={() => setModalPurgar(false)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-[700] rounded-[12px] transition-all cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={purgando}
                onClick={handlePurgar}
                className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white text-xs font-[800] rounded-[12px] transition-all cursor-pointer shadow-lg shadow-red-600/20 disabled:opacity-50 inline-flex items-center gap-2"
              >
                {purgando ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Purgando...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    Confirmar Purga
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
