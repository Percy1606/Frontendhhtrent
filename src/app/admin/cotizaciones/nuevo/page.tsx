'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from '@/hooks/useSession';
import {
  FilePlus2,
  ArrowLeft,
  User,
  Building,
  Mail,
  Phone,
  MessageSquare,
  Search,
  ShoppingCart,
  Trash2,
  PackagePlus,
  Loader2,
  CheckCircle2
} from 'lucide-react';
import { apiFetch, imagenCompleta, formatPEN } from '@/lib/api';
import { toast } from 'sonner';

export default function NuevaCotizacionAdmin() {
  const router = useRouter();
  const session = useSession();

  const [clienteNombre, setClienteNombre] = useState('');
  const [clienteEmpresa, setClienteEmpresa] = useState('');
  const [clienteEmail, setClienteEmail] = useState('');
  const [clienteTelefono, setClienteTelefono] = useState('');
  const [mensaje, setMensaje] = useState('');

  const [equipos, setEquipos] = useState<any[]>([]);
  const [busqueda, setBusqueda] = useState('');
  const [itemsCart, setItemsCart] = useState<{equipo: any, cantidad: number}[]>([]);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    cargarEquipos();
  }, []);

  const cargarEquipos = async () => {
    try {
      let data = await apiFetch<any[]>('/equipos/admin/listar').catch(() => null);
      if (!data || !Array.isArray(data) || data.length === 0) {
        // Fallback robusto al catálogo público si falla el de admin
        const res = await apiFetch<any>('/equipos?pageSize=10000');
        data = Array.isArray(res) ? res : (res?.items || []);
      }
      
      // Filtramos para mostrar solo los que se pueden cotizar y activos
      setEquipos((data || []).filter((e: any) => e.estado === 'DISPONIBLE' && !e.esCategoria));
    } catch (error) {
      toast.error('Error al cargar catálogo de equipos');
    }
  };

  const agregarAlCarrito = (equipo: any) => {
    if (itemsCart.find(i => i.equipo.id === equipo.id)) {
      toast.error('El equipo ya está en la cotización');
      return;
    }
    setItemsCart([...itemsCart, { equipo, cantidad: 1 }]);
    setBusqueda('');
  };

  const removerDelCarrito = (id: string) => {
    setItemsCart(itemsCart.filter(i => i.equipo.id !== id));
  };

  const actualizarCantidad = (id: string, cantidad: number) => {
    if (cantidad < 1) return;
    setItemsCart(itemsCart.map(i => i.equipo.id === id ? { ...i, cantidad } : i));
  };

  const equiposFiltrados = equipos.filter(e => 
    e.nombre.toLowerCase().includes(busqueda.toLowerCase()) || 
    (e.codigoInterno || '').toLowerCase().includes(busqueda.toLowerCase())
  ).slice(0, 10); // Max 10 para dropdown

  const crearCotizacion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (itemsCart.length === 0) {
      toast.error('Debes agregar al menos un equipo a la cotización');
      return;
    }

    try {
      setGuardando(true);
      await apiFetch('/cotizaciones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clienteNombre,
          clienteEmpresa,
          clienteEmail,
          clienteTelefono,
          mensaje,
          items: itemsCart.map(i => ({ equipoId: i.equipo.id, cantidad: i.cantidad }))
        })
      });
      toast.success('Cotización generada correctamente');
      router.push('/admin/cotizaciones');
    } catch (error: any) {
      toast.error(error.message || 'Error al generar cotización');
    } finally {
      setGuardando(false);
    }
  };

  if (!session) return null;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* CABECERA */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.back()}
          className="p-2.5 rounded-[12px] text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="font-spartan font-[800] text-2xl text-slate-900 uppercase tracking-tight flex items-center gap-2">
            <FilePlus2 className="w-6 h-6 text-[#162B4D]" />
            Generar Cotización Manual
          </h1>
          <p className="text-sm text-slate-500 mt-1 font-[500]">
            Crear un nuevo ticket de cotización a nombre de un cliente
          </p>
        </div>
      </div>

      <form onSubmit={crearCotizacion} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* COLUMNA IZQUIERDA: DATOS DEL CLIENTE */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white rounded-[24px] border border-slate-200 p-6 shadow-sm">
            <h2 className="text-sm font-[800] text-slate-900 uppercase tracking-wider mb-5 flex items-center gap-2">
              <User className="w-4 h-4 text-slate-400" />
              Datos del Cliente
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-[11px] font-[700] uppercase text-slate-500 mb-1.5 ml-1">
                  Nombre Completo / Titular *
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={clienteNombre}
                    onChange={(e) => setClienteNombre(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border-none rounded-xl text-sm font-[600] text-slate-700 focus:ring-2 focus:ring-[#162B4D]/20 outline-none transition-all"
                    placeholder="Ej. Juan Pérez"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-[700] uppercase text-slate-500 mb-1.5 ml-1">
                  Empresa (Opcional)
                </label>
                <div className="relative">
                  <Building className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={clienteEmpresa}
                    onChange={(e) => setClienteEmpresa(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border-none rounded-xl text-sm font-[600] text-slate-700 focus:ring-2 focus:ring-[#162B4D]/20 outline-none transition-all"
                    placeholder="Ej. Constructora SAC"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-[700] uppercase text-slate-500 mb-1.5 ml-1">
                  Correo Electrónico *
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={clienteEmail}
                    onChange={(e) => setClienteEmail(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border-none rounded-xl text-sm font-[600] text-slate-700 focus:ring-2 focus:ring-[#162B4D]/20 outline-none transition-all"
                    placeholder="correo@empresa.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-[700] uppercase text-slate-500 mb-1.5 ml-1">
                  Teléfono / Celular *
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={clienteTelefono}
                    onChange={(e) => setClienteTelefono(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border-none rounded-xl text-sm font-[600] text-slate-700 focus:ring-2 focus:ring-[#162B4D]/20 outline-none transition-all"
                    placeholder="Ej. +51 999 999 999"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-[11px] font-[700] uppercase text-slate-500 mb-1.5 ml-1">
                  Mensaje u Observación
                </label>
                <div className="relative">
                  <MessageSquare className="w-4 h-4 text-slate-400 absolute left-3 top-4" />
                  <textarea
                    rows={3}
                    value={mensaje}
                    onChange={(e) => setMensaje(e.target.value)}
                    className="w-full pl-9 pr-4 py-3 bg-slate-50 border-none rounded-xl text-sm font-[500] text-slate-700 focus:ring-2 focus:ring-[#162B4D]/20 outline-none transition-all resize-none"
                    placeholder="Ingresa algún requerimiento especial..."
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* COLUMNA DERECHA: EQUIPOS */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-white rounded-[24px] border border-slate-200 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-sm font-[800] text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <ShoppingCart className="w-4 h-4 text-slate-400" />
                Equipos Solicitados
              </h2>
              <span className="text-xs font-[700] text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
                {itemsCart.length} equipos
              </span>
            </div>

            {/* BUSCADOR DE EQUIPOS */}
            <div className="relative mb-6">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  placeholder="Buscar equipos por nombre o código..."
                  className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl text-sm font-[500] focus:ring-2 focus:ring-[#162B4D]/20 focus:border-[#162B4D] outline-none transition-all"
                />
              </div>

              {busqueda.length > 1 && (
                <div className="absolute z-50 w-full mt-2 bg-white rounded-xl shadow-xl border border-slate-200 max-h-64 overflow-y-auto">
                  {equiposFiltrados.length === 0 ? (
                    <div className="p-4 text-center text-sm text-slate-500 font-[500]">
                      No se encontraron equipos
                    </div>
                  ) : (
                    equiposFiltrados.map((equipo) => (
                      <button
                        type="button"
                        key={equipo.id}
                        onClick={() => agregarAlCarrito(equipo)}
                        className="w-full flex items-center gap-3 p-3 hover:bg-slate-50 transition-colors text-left border-b border-slate-100 last:border-0"
                      >
                        <img loading="lazy" decoding="async" loading="lazy" decoding="async" 
                          src={imagenCompleta(equipo.imagenUrl)} 
                          alt={equipo.nombre}
                          className="w-10 h-10 rounded-lg object-cover bg-slate-100"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-[700] text-slate-900 truncate">{equipo.nombre}</p>
                          <p className="text-xs text-slate-500 font-[500]">{equipo.codigoInterno} • {equipo.marca || 'S/M'}</p>
                        </div>
                        <PackagePlus className="w-5 h-5 text-emerald-500 shrink-0" />
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* LISTA DEL CARRITO */}
            {itemsCart.length === 0 ? (
              <div className="text-center py-10 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
                <ShoppingCart className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <h3 className="text-slate-700 font-[700] text-sm mb-1">Cotización vacía</h3>
                <p className="text-slate-500 text-xs max-w-sm mx-auto">
                  Busca y agrega equipos usando el buscador superior.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {itemsCart.map((item, i) => (
                  <div key={item.equipo.id} className="flex items-center gap-4 p-3 bg-white border border-slate-200 rounded-2xl shadow-sm">
                    <div className="w-6 h-6 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center text-xs font-[800] shrink-0">
                      {i + 1}
                    </div>
                    <img loading="lazy" decoding="async" loading="lazy" decoding="async" 
                      src={imagenCompleta(item.equipo.imagenUrl)} 
                      alt={item.equipo.nombre}
                      className="w-14 h-14 rounded-xl object-cover bg-slate-100 border border-slate-200"
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-[700] text-slate-900 truncate">{item.equipo.nombre}</h4>
                      <p className="text-xs text-slate-500">{item.equipo.codigoInterno} • {item.equipo.tipo}</p>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-[700] text-slate-400 uppercase">Cant.</span>
                      <input 
                        type="number"
                        min="1"
                        value={item.cantidad}
                        onChange={(e) => actualizarCantidad(item.equipo.id, parseInt(e.target.value) || 1)}
                        className="w-16 px-2 py-1.5 text-center text-sm font-[700] border border-slate-200 rounded-lg outline-none focus:border-[#162B4D]"
                      />
                    </div>

                    <button 
                      type="button"
                      onClick={() => removerDelCarrito(item.equipo.id)}
                      className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors ml-2"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-6 py-3 rounded-[14px] text-sm font-[700] text-slate-600 hover:bg-slate-200 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={guardando || itemsCart.length === 0}
              className="px-8 py-3 rounded-[14px] text-sm font-[800] text-white bg-[#162B4D] hover:bg-[#0f1e36] transition-colors flex items-center gap-2 shadow-lg shadow-[#162B4D]/20 disabled:opacity-50"
            >
              {guardando ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Generando Ticket...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  Crear Cotización
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
