'use client';
import React, { useEffect, useState } from 'react';
import {
  FileText,
  Plus,
  Search,
  Download,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Receipt,
  Building2,
  Calendar,
  DollarSign,
  Filter,
  RefreshCcw,
} from 'lucide-react';
import { apiFetch, formatPEN } from '@/lib/api';
import { toast } from 'sonner';
import { norm } from '@/lib/equipo';

interface Comprobante {
  id: string;
  tipo: 'FACTURA' | 'BOLETA' | 'NOTA_CREDITO';
  serie: string;
  numero: number;
  clienteTipoDoc: string;
  clienteNumDoc: string;
  clienteRazon: string;
  montoSubtotal: number;
  montoIgv: number;
  montoTotal: number;
  moneda: string;
  estado: 'BORRADOR' | 'EMITIDO' | 'ACEPTADO' | 'ANULADO' | 'RECHAZADO';
  pdfUrl?: string;
  xmlUrl?: string;
  observacion?: string;
  contrato?: {
    numero: string;
    proyecto: string;
  } | null;
  createdAt: string;
}

interface ContratoOption {
  id: string;
  numero: string;
  clienteNombre: string;
  clienteEmpresa?: string;
  clienteDocumento?: string;
  proyecto: string;
  subtotal: number;
  igv: number;
  total: number;
}

export default function AdminFacturacionPage() {
  const [comprobantes, setComprobantes] = useState<Comprobante[]>([]);
  const [contratos, setContratos] = useState<ContratoOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [tipoFiltro, setTipoFiltro] = useState('TODOS');
  const [showModalEmitir, setShowModalEmitir] = useState(false);
  const [emitiendo, setEmitiendo] = useState(false);

  // Formulario para nuevo comprobante
  const [contratoIdSel, setContratoIdSel] = useState('');
  const [form, setForm] = useState({
    tipo: 'FACTURA',
    clienteTipoDoc: '6',
    clienteNumDoc: '',
    clienteRazon: '',
    clienteDireccion: '',
    clienteEmail: '',
    montoSubtotal: '',
    montoIgv: '',
    montoTotal: '',
    observacion: '',
  });

  const cargarDatos = async () => {
    setLoading(true);
    try {
      const [comps, conts] = await Promise.all([
        apiFetch<Comprobante[]>('/comprobantes').catch(() => []),
        apiFetch<ContratoOption[]>('/alquileres').catch(() => []),
      ]);
      setComprobantes(comps);
      setContratos(conts);
    } catch {
      toast.error('No se pudo cargar el historial de comprobantes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const seleccionarContrato = (id: string) => {
    setContratoIdSel(id);
    const c = contratos.find((item) => item.id === id);
    if (c) {
      const doc = c.clienteDocumento || '';
      const tipoDoc = doc.length === 11 ? '6' : '1';
      const subtotal = Number(c.subtotal || 0);
      const igv = Number(c.igv || subtotal * 0.18);
      const total = Number(c.total || subtotal + igv);

      setForm((prev) => ({
        ...prev,
        clienteTipoDoc: tipoDoc,
        clienteNumDoc: doc,
        clienteRazon: c.clienteEmpresa || c.clienteNombre,
        montoSubtotal: subtotal.toFixed(2),
        montoIgv: igv.toFixed(2),
        montoTotal: total.toFixed(2),
        observacion: `Comprobante generado desde Contrato de Alquiler ${c.numero} - Proyecto: ${c.proyecto}`,
      }));
    }
  };

  const handleEmitir = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmitiendo(true);
    try {
      const subtotal = Number(form.montoSubtotal);
      const igv = Number(form.montoIgv);
      const total = Number(form.montoTotal);

      await apiFetch('/comprobantes', {
        method: 'POST',
        body: JSON.stringify({
          tipo: form.tipo,
          clienteTipoDoc: form.clienteTipoDoc,
          clienteNumDoc: form.clienteNumDoc,
          clienteRazon: form.clienteRazon,
          clienteDireccion: form.clienteDireccion,
          clienteEmail: form.clienteEmail,
          montoSubtotal: subtotal,
          montoIgv: igv,
          montoTotal: total,
          contratoId: contratoIdSel || null,
          observacion: form.observacion,
        }),
      });

      toast.success('Comprobante emitido correctamente (Modo DEMO OSE)');
      setShowModalEmitir(false);
      cargarDatos();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al emitir comprobante');
    } finally {
      setEmitiendo(false);
    }
  };

  const filtrados = comprobantes.filter((c) => {
    const term = norm(searchTerm.trim());
    const matchSearch =
      term === '' ||
      norm(c.clienteRazon).includes(term) ||
      norm(c.clienteNumDoc).includes(term) ||
      norm(`${c.serie}-${c.numero}`).includes(term);
    const matchTipo = tipoFiltro === 'TODOS' || c.tipo === tipoFiltro;
    return matchSearch && matchTipo;
  });

  return (
    <div className="space-y-6">
      {/* ENCABEZADO */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-spartan font-[800] text-2xl text-slate-900 uppercase tracking-tight">
            Facturación Electrónica SUNAT
          </h1>
          <p className="text-sm text-slate-500 mt-1 font-[500]">
            Módulo de emisión de Facturas, Boletas y Comprobantes de HH RENT (Integración OSE/SUNAT)
          </p>
        </div>
        <button
          onClick={() => {
            setContratoIdSel('');
            setForm({
              tipo: 'FACTURA',
              clienteTipoDoc: '6',
              clienteNumDoc: '',
              clienteRazon: '',
              clienteDireccion: '',
              clienteEmail: '',
              montoSubtotal: '',
              montoIgv: '',
              montoTotal: '',
              observacion: '',
            });
            setShowModalEmitir(true);
          }}
          className="inline-flex items-center gap-2 px-5 py-3 bg-[#E63C46] hover:bg-[#C92A36] text-white text-xs font-[800] rounded-[14px] shadow-lg shadow-[#E63C46]/25 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Emitir Nuevo Comprobante</span>
        </button>
      </div>

      {/* AVISO MODO DEMO / INTEGRACIÓN */}
      <div className="bg-blue-50 border border-blue-200 rounded-[18px] p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-blue-800">
        <div className="flex items-center gap-2.5">
          <Receipt className="w-5 h-5 text-blue-600 shrink-0" />
          <div>
            <span className="font-[800] block">Entorno preparado para FacturaLibre / Nubefact / OSE SUNAT</span>
            <span className="font-[500] text-blue-600">
              Puedes emitir comprobantes de prueba ilimitados. Al activar tu cuenta de producción se enviarán directamente a la SUNAT.
            </span>
          </div>
        </div>
        <span className="px-3 py-1 rounded-full bg-blue-600 text-white font-[800] uppercase text-[10px] tracking-wider shrink-0">
          Modo Demo Activo
        </span>
      </div>

      {/* FILTROS Y BÚSQUEDA */}
      <div className="bg-white rounded-[20px] border border-slate-200/70 p-4 shadow-sm space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="relative md:col-span-2">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por RUC/DNI, cliente o número de comprobante (F001-1)..."
              className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-[12px] text-xs font-[600] text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#162B4D] focus:bg-white transition-all"
            />
          </div>
          <select
            value={tipoFiltro}
            onChange={(e) => setTipoFiltro(e.target.value)}
            className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-[12px] text-xs font-[600] text-slate-700 focus:outline-none focus:border-[#162B4D] cursor-pointer"
          >
            <option value="TODOS">Todos los comprobantes</option>
            <option value="FACTURA">Facturas (F001)</option>
            <option value="BOLETA">Boletas (B001)</option>
          </select>
        </div>
      </div>

      {/* TABLA DE COMPROBANTES */}
      {loading ? (
        <div className="py-20 bg-white rounded-[20px] border border-slate-200/70 text-center space-y-3">
          <div className="w-10 h-10 border-4 border-[#162B4D] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-slate-600 font-[700] text-xs">Cargando registro de comprobantes...</p>
        </div>
      ) : filtrados.length === 0 ? (
        <div className="py-16 bg-white rounded-[20px] border border-slate-200 text-center p-8">
          <Receipt className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-lg font-[800] text-slate-800">No hay comprobantes emitidos</h3>
          <p className="text-slate-500 text-xs mt-1 font-[500]">
            Haz clic en "Emitir Nuevo Comprobante" para registrar una Factura o Boleta.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-[20px] border border-slate-200/70 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-500 uppercase font-[700] border-b border-slate-200 text-[11px]">
                  <th className="py-3.5 px-5">Comprobante</th>
                  <th className="py-3.5 px-4">Cliente / RUC - DNI</th>
                  <th className="py-3.5 px-4">Monto Total</th>
                  <th className="py-3.5 px-4">Estado SUNAT</th>
                  <th className="py-3.5 px-4">Fecha</th>
                  <th className="py-3.5 px-4 text-center">Formatos</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-sans">
                {filtrados.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-5">
                      <span className="font-[800] text-slate-900 text-xs block">
                        {c.serie}-{String(c.numero).padStart(6, '0')}
                      </span>
                      <span className="text-[10px] font-[800] uppercase text-[#E63C46]">
                        {c.tipo}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <p className="font-[700] text-slate-900 leading-snug">{c.clienteRazon}</p>
                      <p className="text-[10px] text-slate-400 font-[600] mt-0.5">
                        RUC/DNI: {c.clienteNumDoc}
                      </p>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-[800] text-slate-900 text-sm">
                        {formatPEN(c.montoTotal)}
                      </span>
                      <span className="block text-[10px] text-slate-400 font-[500]">
                        IGV: {formatPEN(c.montoIgv)}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-[800] bg-emerald-100 text-emerald-700 border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3" /> ACEPTADO SUNAT
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 font-[500]">
                      {new Date(c.createdAt).toLocaleDateString('es-PE')}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center justify-center gap-2">
                        {c.pdfUrl && (
                          <a
                            href={c.pdfUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-[#162B4D] hover:text-white text-slate-700 font-[700] text-[10px] transition-all flex items-center gap-1"
                          >
                            <Download className="w-3 h-3" /> PDF A4
                          </a>
                        )}
                        {c.xmlUrl && (
                          <a
                            href={c.xmlUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-[#E63C46] hover:text-white text-slate-700 font-[700] text-[10px] transition-all flex items-center gap-1"
                          >
                            <FileText className="w-3 h-3" /> XML
                          </a>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL EMITIR COMPROBANTE */}
      {showModalEmitir && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-[24px] max-w-xl w-full p-6 space-y-5 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-spartan font-[800] text-lg text-slate-900 uppercase">
                Emitir Factura / Boleta Electrónica
              </h3>
              <button
                onClick={() => setShowModalEmitir(false)}
                className="text-slate-400 hover:text-slate-600 font-[800]"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleEmitir} className="space-y-4 text-xs font-spartan">
              {/* Seleccionar Contrato como base */}
              <div>
                <label className="block text-[11px] font-[700] uppercase text-slate-500 mb-1">
                  Cargar datos desde Contrato de Alquiler (Opcional)
                </label>
                <select
                  value={contratoIdSel}
                  onChange={(e) => seleccionarContrato(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-[12px] text-xs font-[600] text-slate-800"
                >
                  <option value="">Seleccionar contrato base...</option>
                  {contratos.map((ct) => (
                    <option key={ct.id} value={ct.id}>
                      {ct.numero} - {ct.clienteEmpresa || ct.clienteNombre} ({ct.proyecto})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-[700] uppercase text-slate-500 mb-1">
                    Tipo Comprobante *
                  </label>
                  <select
                    value={form.tipo}
                    onChange={(e) => setForm({ ...form, tipo: e.target.value })}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-[12px] text-xs font-[600] text-slate-800"
                  >
                    <option value="FACTURA">Factura Electrónica (F001)</option>
                    <option value="BOLETA">Boleta de Venta (B001)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-[700] uppercase text-slate-500 mb-1">
                    RUC / DNI *
                  </label>
                  <input
                    required
                    type="text"
                    value={form.clienteNumDoc}
                    onChange={(e) => setForm({ ...form, clienteNumDoc: e.target.value })}
                    placeholder="Ej: 20601234567"
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-[12px] text-xs font-[600] text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-[700] uppercase text-slate-500 mb-1">
                  Razón Social / Nombre Cliente *
                </label>
                <input
                  required
                  type="text"
                  value={form.clienteRazon}
                  onChange={(e) => setForm({ ...form, clienteRazon: e.target.value })}
                  placeholder="Ej: CONSTRUCTORA Y SERVICIOS ELECTROMECANICOS S.A.C."
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-[12px] text-xs font-[600] text-slate-800"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-[700] uppercase text-slate-500 mb-1">
                    Subtotal (S/) *
                  </label>
                  <input
                    required
                    type="number"
                    step="0.01"
                    value={form.montoSubtotal}
                    onChange={(e) => {
                      const sub = Number(e.target.value);
                      const igv = sub * 0.18;
                      const tot = sub + igv;
                      setForm({
                        ...form,
                        montoSubtotal: e.target.value,
                        montoIgv: igv.toFixed(2),
                        montoTotal: tot.toFixed(2),
                      });
                    }}
                    placeholder="0.00"
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-[12px] text-xs font-[600] text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-[700] uppercase text-slate-500 mb-1">
                    IGV 18% (S/)
                  </label>
                  <input
                    readOnly
                    type="number"
                    value={form.montoIgv}
                    className="w-full px-3 py-2.5 bg-slate-100 border border-slate-200 rounded-[12px] text-xs font-[700] text-slate-700"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-[700] uppercase text-slate-500 mb-1">
                    Total Importe (S/)
                  </label>
                  <input
                    readOnly
                    type="number"
                    value={form.montoTotal}
                    className="w-full px-3 py-2.5 bg-slate-100 border border-slate-200 rounded-[12px] text-xs font-[800] text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-[700] uppercase text-slate-500 mb-1">
                  Observación / Glosa del Comprobante
                </label>
                <textarea
                  rows={2}
                  value={form.observacion}
                  onChange={(e) => setForm({ ...form, observacion: e.target.value })}
                  placeholder="Detalle de alquiler de equipos, período o condiciones de pago..."
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-[12px] text-xs font-[600] text-slate-800"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModalEmitir(false)}
                  className="px-4 py-2.5 bg-slate-100 text-slate-700 text-xs font-[700] rounded-xl hover:bg-slate-200"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={emitiendo}
                  className="px-5 py-2.5 bg-[#E63C46] hover:bg-[#C92A36] text-white text-xs font-[800] rounded-xl shadow-md disabled:opacity-60 inline-flex items-center gap-2"
                >
                  <Receipt className="w-4 h-4" />
                  {emitiendo ? 'Generando en SUNAT...' : 'Emitir Comprobante'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
