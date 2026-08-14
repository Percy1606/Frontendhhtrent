'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  KeyRound,
  Mail,
  AlertCircle,
  CheckCircle2,
  Send,
} from 'lucide-react';

interface RespuestaReset {
  ok: boolean;
  mensaje?: string;
  enlaceDesarrollo?: string;
}

export default function OlvidePasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [enviado, setEnviado] = useState(false);
  const [enlaceDev, setEnlaceDev] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const API_URL =
        process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      const res = await fetch(`${API_URL}/auth/olvide-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = (await res.json()) as RespuestaReset;
      if (!res.ok) {
        setError(data.mensaje || 'No se pudo procesar la solicitud');
        setLoading(false);
        return;
      }

      setEnviado(true);
      if (data.enlaceDesarrollo) setEnlaceDev(data.enlaceDesarrollo);
    } catch {
      setError(
        'No se pudo conectar con el servidor. Verifique que el backend esté activo.',
      );
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#F1F5F9] flex items-center justify-center p-4 font-poppins relative overflow-hidden">
      {/* DECORACIÓN DE FONDO */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-32 -right-32 w-[500px] h-[500px] rounded-full bg-[#162B4D]/10 blur-3xl" />
        <div className="absolute -bottom-40 -left-32 w-[500px] h-[500px] rounded-full bg-[#E63C46]/10 blur-3xl" />
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* TÍTULO */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-[24px] bg-[#162B4D] shadow-xl shadow-[#162B4D]/30 mb-5">
            <KeyRound className="w-9 h-9 text-white" />
          </div>
          <h1 className="font-spartan font-[800] text-2xl text-slate-900 uppercase tracking-tight">
            Restablecer Contraseña
          </h1>
          <p className="text-slate-500 text-sm mt-1 font-[500]">
            HT RENT · Sistema Integral de Gestión
          </p>
        </div>

        {/* TARJETA */}
        <div className="bg-white rounded-[24px] shadow-xl shadow-slate-200/60 border border-slate-200/70 p-8">
          {!enviado ? (
            <>
              <div className="flex items-center gap-2 mb-6">
                <span className="w-9 h-9 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center">
                  <Mail className="w-5 h-5" />
                </span>
                <div>
                  <h2 className="font-[800] text-slate-900 text-base">
                    ¿Olvidaste tu contraseña?
                  </h2>
                  <p className="text-[11px] text-slate-500 font-[500]">
                    Ingresa tu correo corporativo y te enviaremos un enlace para
                    restablecerla.
                  </p>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-[11px] font-[700] uppercase tracking-wider text-slate-500 mb-1.5">
                    Correo Corporativo
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="usuario@hhtrent.com"
                      className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-[14px] text-sm text-slate-800 focus:outline-none focus:border-[#162B4D] focus:bg-white focus:ring-2 focus:ring-[#162B4D]/10 transition-all placeholder:text-slate-400"
                    />
                  </div>
                </div>

                {error && (
                  <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 text-xs font-[500] p-3 rounded-[12px]">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 bg-[#162B4D] hover:bg-[#10203B] text-white font-[800] text-sm rounded-[14px] transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#162B4D]/20 disabled:opacity-60"
                >
                  {loading ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                      <span>Enviando...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Enviar enlace</span>
                    </>
                  )}
                </button>
              </form>

              <Link
                href="/admin/login"
                className="mt-6 flex items-center justify-center gap-1.5 text-xs font-[700] text-slate-500 hover:text-[#E63C46] transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Volver al inicio de sesión
              </Link>
            </>
          ) : (
            <div className="text-center py-2">
              <span className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-7 h-7 text-emerald-600" />
              </span>
              <h2 className="font-[800] text-slate-900 text-base">
                Solicitud enviada
              </h2>
              <p className="text-xs text-slate-500 font-[500] mt-1.5 leading-relaxed">
                Si el correo está registrado, recibirás un enlace para
                restablecer tu contraseña (válido por 1 hora).
              </p>

              {/* Enlace de desarrollo: permite probar el flujo sin correo real */}
              {enlaceDev && (
                <div className="mt-5 bg-amber-50 border border-amber-200 rounded-[12px] p-4 text-left">
                  <p className="text-[10px] font-[800] uppercase tracking-wider text-amber-600 mb-2">
                    Enlace de desarrollo (sin correo configurado)
                  </p>
                  <a
                    href={enlaceDev}
                    className="text-[11px] font-[700] text-amber-800 underline break-all hover:text-amber-900"
                  >
                    {enlaceDev}
                  </a>
                </div>
              )}

              <Link
                href="/admin/login"
                className="mt-6 inline-flex items-center gap-1.5 text-xs font-[700] text-slate-500 hover:text-[#E63C46] transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Volver al inicio de sesión
              </Link>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
