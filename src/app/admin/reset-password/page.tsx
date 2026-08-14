'use client';
import React, { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  ArrowLeft,
  KeyRound,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  ShieldCheck,
} from 'lucide-react';

function ResetPasswordInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';

  const [password, setPassword] = useState('');
  const [confirmar, setConfirmar] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [listo, setListo] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!token) {
      setError('El enlace es inválido. Solicite uno nuevo.');
      return;
    }
    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }
    if (password !== confirmar) {
      setError('Las contraseñas no coinciden');
      return;
    }

    setLoading(true);
    try {
      const API_URL =
        process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      const res = await fetch(`${API_URL}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, nuevaPassword: password }),
      });

      const data = (await res.json()) as {
        ok?: boolean;
        mensaje?: string;
      };
      if (!res.ok) {
        setError(data.mensaje || 'No se pudo restablecer la contraseña');
        setLoading(false);
        return;
      }

      setListo(true);
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
            Nueva Contraseña
          </h1>
          <p className="text-slate-500 text-sm mt-1 font-[500]">
            HT RENT · Sistema Integral de Gestión
          </p>
        </div>

        {/* TARJETA */}
        <div className="bg-white rounded-[24px] shadow-xl shadow-slate-200/60 border border-slate-200/70 p-8">
          {!listo ? (
            <>
              <div className="flex items-center gap-2 mb-6">
                <span className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5" />
                </span>
                <div>
                  <h2 className="font-[800] text-slate-900 text-base">
                    Define tu nueva contraseña
                  </h2>
                  <p className="text-[11px] text-slate-500 font-[500]">
                    Debe tener al menos 6 caracteres.
                  </p>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-[11px] font-[700] uppercase tracking-wider text-slate-500 mb-1.5">
                    Nueva contraseña
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-11 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-[14px] text-sm text-slate-800 focus:outline-none focus:border-[#162B4D] focus:bg-white focus:ring-2 focus:ring-[#162B4D]/10 transition-all placeholder:text-slate-400"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-[700] uppercase tracking-wider text-slate-500 mb-1.5">
                    Confirmar contraseña
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={confirmar}
                      onChange={(e) => setConfirmar(e.target.value)}
                      placeholder="••••••••"
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
                      <span>Guardando...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4" />
                      <span>Restablecer contraseña</span>
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
                ¡Contraseña actualizada!
              </h2>
              <p className="text-xs text-slate-500 font-[500] mt-1.5 leading-relaxed">
                Ya puedes iniciar sesión con tu nueva contraseña.
              </p>
              <button
                onClick={() => router.push('/admin/login')}
                className="mt-6 w-full py-3.5 bg-[#162B4D] hover:bg-[#10203B] text-white font-[800] text-sm rounded-[14px] transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#162B4D]/20"
              >
                Ir al inicio de sesión
              </button>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#F1F5F9] flex items-center justify-center">
          <div className="w-10 h-10 border-4 border-[#162B4D] border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <ResetPasswordInner />
    </Suspense>
  );
}
