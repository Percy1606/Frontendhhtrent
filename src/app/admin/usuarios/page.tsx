'use client';
import React, { useEffect, useState } from 'react';
import {
  Users,
  Plus,
  Pencil,
  KeyRound,
  ShieldCheck,
  Eye,
  X,
  UserCircle2,
  Power,
} from 'lucide-react';
import {
  apiFetch,
  ROLES,
  ROL_COLORS,
  ROL_DESCRIPCION,
  ROL_LABELS,
} from '@/lib/api';
import { useSession } from '@/hooks/useSession';
import { toast } from 'sonner';

interface Usuario {
  id: string;
  nombre: string;
  email: string;
  rol: string;
  activo: boolean;
  createdAt: string;
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

type ModalAbierto = 'crear' | 'editar' | 'password' | null;

export default function AdminUsuariosPage() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [modal, setModal] = useState<ModalAbierto>(null);
  const [seleccionado, setSeleccionado] = useState<Usuario | null>(null);
  const [enviando, setEnviando] = useState(false);
  const user = useSession();

  // Formularios
  const [form, setForm] = useState({
    nombre: '',
    email: '',
    rol: 'CONSULTA' as string,
    password: '',
    activo: true,
  });

  const cargar = () => {
    apiFetch<Usuario[]>('/usuarios')
      .then(setUsuarios)
      .catch(() => setError('No se pudieron cargar los usuarios.'))
      .finally(() => setCargando(false));
  };

  useEffect(() => {
    cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- carga inicial única
  }, []);

  const esPropiaCuenta = (u: Usuario) => user?.id === u.id;
  const esAdministrador = user?.rol === 'ADMINISTRADOR';

  const notificar = (texto: string) => {
    toast.success(texto);
    setError(null);
  };

  const abrirCrear = () => {
    setForm({ nombre: '', email: '', rol: 'CONSULTA', password: '', activo: true });
    setSeleccionado(null);
    setModal('crear');
  };

  const abrirEditar = (u: Usuario) => {
    setSeleccionado(u);
    setForm({ nombre: u.nombre, email: u.email, rol: u.rol, password: '', activo: u.activo });
    setModal('editar');
  };

  const abrirPassword = (u: Usuario) => {
    setSeleccionado(u);
    setForm({ ...form, password: '' });
    setModal('password');
  };

  const crearUsuario = async () => {
    setError(null);
    if (!form.nombre.trim() || !form.email.trim() || form.password.length < 6) {
      setError('Completa nombre, correo válido y contraseña de al menos 6 caracteres.');
      return;
    }
    setEnviando(true);
    try {
      await apiFetch('/usuarios', {
        method: 'POST',
        body: JSON.stringify({
          nombre: form.nombre,
          email: form.email,
          rol: form.rol,
          password: form.password,
        }),
      });
      setModal(null);
      notificar('Usuario creado correctamente.');
      cargar();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al crear el usuario');
    } finally {
      setEnviando(false);
    }
  };

  const actualizarUsuario = async () => {
    if (!seleccionado) return;
    setError(null);
    if (!form.nombre.trim() || !form.email.trim()) {
      setError('El nombre y el correo son obligatorios.');
      return;
    }
    setEnviando(true);
    try {
      await apiFetch(`/usuarios/${seleccionado.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          nombre: form.nombre,
          email: form.email,
          rol: form.rol,
          activo: form.activo,
        }),
      });
      setModal(null);
      notificar('Usuario actualizado correctamente.');
      cargar();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al actualizar el usuario');
    } finally {
      setEnviando(false);
    }
  };

  const cambiarPassword = async () => {
    if (!seleccionado) return;
    setError(null);
    if (form.password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }
    setEnviando(true);
    try {
      await apiFetch(`/usuarios/${seleccionado.id}/password`, {
        method: 'PATCH',
        body: JSON.stringify({ password: form.password }),
      });
      setModal(null);
      notificar(`Contraseña actualizada para ${seleccionado.nombre}.`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al cambiar la contraseña');
    } finally {
      setEnviando(false);
    }
  };

  const alternarActivo = async (u: Usuario) => {
    if (esPropiaCuenta(u)) {
      setError('No puedes desactivar tu propia cuenta.');
      return;
    }
    setError(null);
    try {
      await apiFetch(`/usuarios/${u.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ activo: !u.activo }),
      });
      notificar(u.activo ? `${u.nombre} desactivado.` : `${u.nombre} activado.`);
      cargar();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al cambiar el estado');
    }
  };

  const activos = usuarios.filter((u) => u.activo).length;

  if (cargando) {
    return (
      <div className="py-24 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-[#162B4D] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ENCABEZADO */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-spartan font-[800] text-2xl text-slate-900 uppercase tracking-tight">
            Usuarios y Permisos
          </h1>
          <p className="text-sm text-slate-500 mt-1 font-[500]">
            {usuarios.length} cuentas · {activos} activas — una por área de trabajo
          </p>
        </div>
        {esAdministrador ? (
          <button
            onClick={abrirCrear}
            className="inline-flex items-center gap-2 px-5 py-3 bg-[#E63C46] hover:bg-[#C92A36] text-white text-xs font-[800] rounded-[14px] shadow-lg shadow-[#E63C46]/25 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Nuevo Usuario</span>
          </button>
        ) : (
          <span className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-100 text-slate-500 rounded-[14px] text-xs font-[700]">
            <Eye className="w-4 h-4" />
            Solo lectura — gestión exclusiva del Administrador
          </span>
        )}
      </div>

      {/* PERMISOS POR ÁREA */}
      <div className="bg-white rounded-[20px] border border-slate-200/70 shadow-sm p-5">
        <div className="flex items-center gap-2 mb-4">
          <ShieldCheck className="w-4 h-4 text-[#E63C46]" />
          <h2 className="font-[800] text-sm text-slate-900 uppercase tracking-wide">
            Permisos por Área
          </h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {ROLES.map((rol) => (
            <div
              key={rol}
              className="p-3.5 bg-slate-50 rounded-xl border border-slate-100"
            >
              <span
                className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-[800] border mb-1.5 ${ROL_COLORS[rol]}`}
              >
                {ROL_LABELS[rol]}
              </span>
              <p className="text-[11px] text-slate-500 font-[500] leading-relaxed">
                {ROL_DESCRIPCION[rol]}
              </p>
            </div>
          ))}
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-[16px] p-4 text-sm font-[600] text-red-700">
          {error}
        </div>
      )}
      {mensaje && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-[16px] p-4 text-sm font-[600] text-emerald-700">
          {mensaje}
        </div>
      )}

      {/* TABLA */}
      <div className="bg-white rounded-[20px] border border-slate-200/70 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-500 uppercase font-[700] border-b border-slate-200">
                <th className="py-3.5 px-5">Usuario</th>
                <th className="py-3.5 px-5">Correo</th>
                <th className="py-3.5 px-5">Área / Rol</th>
                <th className="py-3.5 px-5">Estado</th>
                <th className="py-3.5 px-5">Creado</th>
                <th className="py-3.5 px-5 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {usuarios.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3.5 px-5">
                    <div className="flex items-center gap-3">
                      <span
                        className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                          u.activo ? 'bg-[#162B4D]/5' : 'bg-slate-100'
                        }`}
                      >
                        <UserCircle2
                          className={`w-5 h-5 ${u.activo ? 'text-[#162B4D]' : 'text-slate-300'}`}
                        />
                      </span>
                      <div>
                        <p className="font-[700] text-slate-900">
                          {u.nombre}
                          {esPropiaCuenta(u) && (
                            <span className="ml-1.5 text-[9px] font-[800] text-[#E63C46] uppercase">
                              (tú)
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-5 text-slate-500 font-[500]">{u.email}</td>
                  <td className="py-3.5 px-5">
                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-[800] border ${ROL_COLORS[u.rol] || 'bg-slate-100 text-slate-600'}`}
                    >
                      {ROL_LABELS[u.rol] || u.rol}
                    </span>
                  </td>
                  <td className="py-3.5 px-5">
                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-[800] border ${
                        u.activo
                          ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
                          : 'bg-slate-100 text-slate-500 border-slate-200'
                      }`}
                    >
                      {u.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="py-3.5 px-5 text-slate-400 font-[500]">
                    {formatoFecha(u.createdAt)}
                  </td>
                  <td className="py-3.5 px-5">
                    {esAdministrador ? (
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => abrirEditar(u)}
                          className="p-2 rounded-[8px] bg-[#162B4D]/5 text-[#162B4D] hover:bg-[#162B4D] hover:text-white transition-colors"
                          title="Editar"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => abrirPassword(u)}
                          className="p-2 rounded-[8px] bg-amber-100/70 text-amber-700 hover:bg-amber-500 hover:text-white transition-colors"
                          title="Cambiar contraseña"
                        >
                          <KeyRound className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => alternarActivo(u)}
                          disabled={esPropiaCuenta(u)}
                          className={`p-2 rounded-[8px] transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                            u.activo
                              ? 'bg-[#E63C46]/10 text-[#E63C46] hover:bg-[#E63C46] hover:text-white'
                              : 'bg-emerald-100/70 text-emerald-700 hover:bg-emerald-600 hover:text-white'
                          }`}
                          title={u.activo ? 'Desactivar' : 'Activar'}
                        >
                          <Power className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <span className="block text-center text-[10px] font-[600] text-slate-300">
                        —
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ===== MODALES ===== */}
      {modal && (
        <div
          className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"
          onClick={() => setModal(null)}
        >
          <div
            className="bg-white rounded-[24px] w-full max-w-md shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="w-10 h-10 rounded-[12px] bg-[#162B4D]/5 flex items-center justify-center">
                  <Users className="w-5 h-5 text-[#162B4D]" />
                </span>
                <div>
                  <h2 className="font-[800] text-sm text-slate-900 uppercase">
                    {modal === 'crear'
                      ? 'Nuevo Usuario'
                      : modal === 'editar'
                        ? 'Editar Usuario'
                        : 'Cambiar Contraseña'}
                  </h2>
                  <p className="text-[11px] text-slate-400 font-[500]">
                    {modal === 'crear'
                      ? 'Crea una cuenta para un área de trabajo'
                      : modal === 'editar'
                        ? seleccionado?.nombre
                        : seleccionado?.nombre}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setModal(null)}
                className="p-2 rounded-full hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {modal !== 'password' && (
                <>
                  <div>
                    <label className="text-[11px] font-[700] uppercase tracking-wide text-slate-500 block mb-1.5">
                      Nombre completo *
                    </label>
                    <input
                      value={form.nombre}
                      onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                      placeholder="Ej. Ing. María Ríos"
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-[#E63C46]/30"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-[700] uppercase tracking-wide text-slate-500 block mb-1.5">
                      Correo electrónico *
                    </label>
                    <input
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      placeholder="nombre@hhtrent.com"
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-[#E63C46]/30"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-[700] uppercase tracking-wide text-slate-500 block mb-1.5">
                      Área / Rol *
                    </label>
                    <select
                      value={form.rol}
                      onChange={(e) => setForm({ ...form, rol: e.target.value })}
                      disabled={modal === 'editar' && esPropiaCuenta(seleccionado!)}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-[#E63C46]/30 disabled:opacity-50"
                    >
                      {ROLES.map((rol) => (
                        <option key={rol} value={rol}>
                          {ROL_LABELS[rol]} — {ROL_DESCRIPCION[rol]}
                        </option>
                      ))}
                    </select>
                    {modal === 'editar' && esPropiaCuenta(seleccionado!) && (
                      <p className="text-[10px] text-amber-600 font-[600] mt-1">
                        No puedes cambiar tu propio rol.
                      </p>
                    )}
                  </div>
                </>
              )}

              {modal === 'crear' && (
                <div>
                  <label className="text-[11px] font-[700] uppercase tracking-wide text-slate-500 block mb-1.5">
                    Contraseña inicial *
                  </label>
                  <input
                    type="password"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    placeholder="Mínimo 6 caracteres"
                    autoComplete="new-password"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-[#E63C46]/30"
                  />
                </div>
              )}

              {modal === 'password' && (
                <div>
                  <label className="text-[11px] font-[700] uppercase tracking-wide text-slate-500 block mb-1.5">
                    Nueva contraseña *
                  </label>
                  <input
                    type="password"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    placeholder="Mínimo 6 caracteres"
                    autoComplete="new-password"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-[#E63C46]/30"
                  />
                </div>
              )}

              {modal === 'editar' && (
                <label className="flex items-center gap-3 p-3.5 bg-slate-50 rounded-xl border border-slate-100 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.activo}
                    onChange={(e) => setForm({ ...form, activo: e.target.checked })}
                    disabled={esPropiaCuenta(seleccionado!)}
                    className="w-4 h-4 accent-[#E63C46] disabled:opacity-40"
                  />
                  <div>
                    <p className="text-xs font-[700] text-slate-800">
                      Cuenta activa
                    </p>
                    <p className="text-[10px] text-slate-400 font-[500]">
                      {esPropiaCuenta(seleccionado!)
                        ? 'No puedes desactivar tu propia cuenta.'
                        : 'Los usuarios inactivos no pueden iniciar sesión.'}
                    </p>
                  </div>
                </label>
              )}

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-xs font-[600] rounded-xl p-3.5">
                  {error}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => setModal(null)}
                  className="px-4 py-2.5 rounded-[10px] bg-slate-100 text-slate-600 text-xs font-[700] hover:bg-slate-200 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={
                    modal === 'crear'
                      ? crearUsuario
                      : modal === 'editar'
                        ? actualizarUsuario
                        : cambiarPassword
                  }
                  disabled={enviando}
                  className="px-4 py-2.5 rounded-[10px] bg-[#E63C46] hover:bg-[#C92A36] disabled:opacity-60 text-white text-xs font-[800] transition-colors"
                >
                  {enviando ? 'Guardando…' : modal === 'crear' ? 'Crear Usuario' : 'Guardar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
